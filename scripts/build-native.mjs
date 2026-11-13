import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync, openSync, closeSync, rmSync } from 'node:fs';
import { resolve, join, basename, extname } from 'node:path';
import { homedir, hostname } from 'node:os';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { formatDisplayVersion } from './build-version.mjs';
import { readProductRelease } from './product-release.mjs';

const root = process.cwd();
const identity = JSON.parse(readFileSync('version.json', 'utf8'));
const version = identity.version;
const prefix = `natally-v${version}`;
const destination = resolve('dist', prefix);
const targets = resolve(process.env.CARGO_TARGET_DIR || 'build/native-target');
const androidHome = process.env.ANDROID_HOME || join(homedir(), 'Android/Sdk');
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const json = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

function prepare() {
  const release = readProductRelease(root);
  const [major, minor, build] = version.split('.').map(Number);
  formatDisplayVersion(version);
  if (major !== release.releaseMajor || minor < release.initialMinor) throw Error('Native identity is outside the configured release lineage');
  const pkg = readJson('package.json');
  pkg.version = version;
  json('package.json', pkg);
  const lock = readJson('package-lock.json');
  lock.version = version;
  if (lock.packages?.['']) lock.packages[''].version = version;
  json('package-lock.json', lock);
  const cargoFile = 'src-tauri/Cargo.toml';
  const cargo = readFileSync(cargoFile, 'utf8').replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`);
  writeFileSync(cargoFile, cargo);
  const cargoLock = 'src-tauri/Cargo.lock';
  writeFileSync(cargoLock, readFileSync(cargoLock, 'utf8').replace(/(name = "natally-ai-studio"\nversion = ")[^"]+/, `$1${version}`));
  const config = readJson('src-tauri/tauri.conf.json');
  config.identifier = 'mba.robin.astronatally';
  config.version = version;
  config.build.beforeBuildCommand = '';
  config.build.frontendDist = '../dist-web';
  config.build.devUrl = 'http://localhost:37841';
  for (const window of config.app.windows) {
    window.title = `Natally v${formatDisplayVersion(version)}`;
    window.url = 'app.html';
  }
  const code = major * 100000000 + minor * 10000 + build;
  if (!Number.isSafeInteger(code) || code >= 2100000000) throw Error('Android versionCode exceeds platform range');
  config.bundle.android.versionCode = code;
  config.bundle.windows.wix.version = `${major}.${minor}.${build}.0`;
  json('src-tauri/tauri.conf.json', config);
  mkdirSync(destination, { recursive: true });
  console.log(`Native identity prepared: ${config.identifier}, v${version}, Android versionCode ${code}`);
}

if (process.env.NATALLY_CANONICAL_BUILD !== '1') throw Error('Use build_all.sh for native packaging');
if (process.argv[2] === 'prepare') {
  prepare();
} else if (process.argv[2] === 'verify-publication') {
  const release = readProductRelease(root);
  const inventoryPath = join(destination, 'inventory.json');
  const manifest = readJson(inventoryPath);
  if (!manifest.packagingComplete || manifest.version !== version || manifest.projectId !== release.projectId
      || manifest.repository !== release.repository || manifest.webOrigin !== release.webOrigin || !manifest.publicSnapshot) {
    throw Error('Current release is not ready for publication readback');
  }
  const verify = async (url, expected, retain = false) => {
    if (new URL(url).origin !== release.webOrigin) throw Error('Release readback escaped its configured origin');
    console.log(`Reading published ${url}`);
    const response = await fetch(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(600000) });
    if (!response.ok || !response.body) throw Error(`Published artifact returned HTTP ${response.status}: ${url}`);
    const hash = createHash('sha256');
    const chunks = [];
    let bytes = 0;
    let reported = 0;
    for await (const chunk of response.body) {
      hash.update(chunk);
      bytes += chunk.length;
      if (retain) chunks.push(chunk);
      if (bytes - reported >= 16777216) { console.log(`${basename(new URL(url).pathname)}: ${bytes}/${expected.bytes} bytes received`); reported = bytes; }
    }
    const sha256 = hash.digest('hex');
    if (bytes !== expected.bytes || sha256 !== expected.sha256) throw Error(`Published bytes/hash do not match ${url}`);
    console.log(`Verified ${basename(new URL(url).pathname)}: ${bytes} bytes, SHA-256 ${sha256}`);
    return { bytes, sha256, verifiedAt: new Date().toISOString(), ...(retain ? { content: Buffer.concat(chunks).toString('utf8') } : {}) };
  };
  try {
    const observed = await verify(manifest.publicSnapshot.url, manifest.publicSnapshot, true);
    const publicManifest = JSON.parse(observed.content);
    if (publicManifest.version !== version || publicManifest.projectId !== release.projectId
        || publicManifest.repository !== release.repository || publicManifest.webOrigin !== release.webOrigin
        || publicManifest.publicationStatus !== 'awaiting-readback') throw Error('Published release manifest identity mismatch');
    const pointer = await verify(manifest.publicSnapshot.current.url, manifest.publicSnapshot.current, true);
    const current = JSON.parse(pointer.content);
    if (current.version !== version || current.projectId !== release.projectId || current.manifest.sha256 !== observed.sha256) {
      throw Error('Published current release pointer mismatch');
    }
    for (const artifact of manifest.artifacts) {
      const location = artifact.locations.find(item => item.role === 'web-origin');
      const receipt = await verify(location.url, artifact);
      location.publicationStatus = 'verified';
      location.verification = receipt;
      json(inventoryPath, manifest);
    }
    manifest.publicSnapshot.verification = { bytes: observed.bytes, sha256: observed.sha256, verifiedAt: observed.verifiedAt };
    manifest.publicSnapshot.current.verification = { bytes: pointer.bytes, sha256: pointer.sha256, verifiedAt: pointer.verifiedAt };
    manifest.publicationStatus = 'verified';
    manifest.complete = true;
    manifest.verifiedAt = new Date().toISOString();
    json(inventoryPath, manifest);
  } catch (error) {
    manifest.complete = false;
    manifest.publicationStatus = 'failed';
    manifest.publicationError = error.message;
    json(inventoryPath, manifest);
    throw error;
  }
} else {
  if (process.argv[2]) throw Error('Expected prepare, verify-publication or the canonical packaging phase');
  const release = readProductRelease(root);
  const [major, minor] = version.split('.').map(Number);
  if (major !== release.releaseMajor || minor < release.initialMinor || !identity.builtAt) throw Error('A current configured-lineage build stamp is required');
  mkdirSync(destination, { recursive: true });
  mkdirSync(join(destination, 'logs'), { recursive: true });
  const manifest = { schema: 'mba.robin.release-manifest.v1', sourceRole: 'generated', policySource: 'config/product-release.json',
    projectId: release.projectId, repository: release.repository, webOrigin: release.webOrigin,
    version, displayVersion: formatDisplayVersion(version), builtAt: identity.builtAt,
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    artifacts: [], targets: {}, packagingComplete: false, complete: false, publicationStatus: 'not-staged' };
  const inventoryPath = join(destination, 'inventory.json');
  const children = new Set();
  const save = () => json(inventoryPath, manifest);
  const childEnv = { ...process.env, CARGO_TARGET_DIR: targets, ANDROID_HOME: androidHome, ANDROID_SDK_ROOT: androidHome, APPIMAGE_EXTRACT_AND_RUN: '1', GRADLE_OPTS: '-Dorg.gradle.daemon=false' };
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    for (const child of children) {
      try { if (process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM'); else child.kill(); } catch { }
    }
    manifest.interrupted = signal;
    save();
    process.exit(130);
  });
  function run(label, command, args, cwd = root, environment = childEnv) {
    const logfile = join(destination, 'logs', label + '.log');
    console.log(`\n=== ${label}: ${command} ${args.join(' ')} ===`);
    const fd = openSync(logfile, 'a');
    return new Promise((done) => {
      const child = spawn(command, args, { cwd, env: environment, detached: process.platform !== 'win32', stdio: ['ignore', fd, fd] });
      children.add(child);
      child.once('error', error => { children.delete(child); closeSync(fd); done({ code: 1, message: error.code || error.message }); });
      child.once('exit', code => { children.delete(child); closeSync(fd); done({ code: code ?? 1, log: logfile }); });
    });
  }
  function files(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]);
  }
  function stage(file, name, kind) {
    if (!existsSync(file)) throw Error(`Missing ${kind}: ${file}`);
    const out = join(destination, `${prefix}-${name}`);
    if (resolve(file) !== out) copyFileSync(file, out);
    const data = readFileSync(out);
    if (data.length === 0) throw Error(`Empty ${kind}: ${file}`);
    manifest.artifacts.push({ kind, path: out.slice(root.length + 1), filename: basename(out), bytes: data.length,
      sha256: createHash('sha256').update(data).digest('hex'), preferred_public_location_role: 'web-origin', locations: [
        { role: 'build-workspace', transport: 'local-fs', host: hostname(), path: out, public: false },
        { role: 'web-origin', transport: 'https', host: new URL(release.webOrigin).hostname, public: true,
          url: new URL(`/releases/${version}/${basename(out)}`, release.webOrigin).href, publicationStatus: 'not-staged' },
      ] });
    save();
    console.log(`Staged ${kind}: ${out}`);
  }
  function stageBundles(dir, extensions, label) {
    const token = new RegExp(`(^|[^0-9.])${version.replaceAll('.', '\\.')}($|[^0-9.])`);
    for (const ext of extensions) {
      const matches = files(dir).filter(file => file.endsWith(ext) && token.test(basename(file).slice(0, -ext.length)));
      if (matches.length !== 1) throw Error(`${label}: expected one current-version ${ext}, found ${matches.length}`);
      stage(matches[0], `${label}${ext}`, label + ext);
    }
  }
  async function target(name, execute, collect) {
    manifest.targets[name] = { state: 'running' }; save();
    const startedAt = new Date().toISOString();
    try {
      const result = await execute();
      if (result.code !== 0) throw Error(`${name} command failed (${result.code}); see ${result.log || result.message}`);
      await collect();
      manifest.targets[name] = { ...manifest.targets[name], state: 'packaged', startedAt, finishedAt: new Date().toISOString() };
    } catch (error) {
      manifest.targets[name] = { ...manifest.targets[name], state: 'failed', startedAt, error: error.message };
      console.error(error.message);
    }
    save();
  }
  await target('web', () => {
    const archive = join(destination, `${prefix}-web.zip`);
    rmSync(archive, { force: true });
    return run('web-archive', 'zip', ['-q', '-r', archive, '.'], resolve('dist-web'));
  }, () => stage(join(destination, `${prefix}-web.zip`), 'web.zip', 'web-archive'));
  await target('linux', () => run('linux', 'npx', ['--no-install', 'tauri', 'build', '--bundles', 'appimage,deb,rpm', '--', '--locked']), () => {
    stageBundles(join(targets, 'release/bundle'), ['.AppImage', '.deb', '.rpm'], 'linux-x64');
  });
  await target('windows', () => {
    const environment = { ...childEnv, CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_RUSTFLAGS:
      `${childEnv.CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_RUSTFLAGS || ''} -C target-feature=+crt-static`.trim() };
    delete environment.RUSTFLAGS;
    delete environment.CARGO_ENCODED_RUSTFLAGS;
    return run('windows', 'npx', ['--no-install', 'tauri', 'build', '--runner', 'cargo-xwin', '--target', 'x86_64-pc-windows-msvc', '--bundles', 'nsis', '--', '--locked'], root, environment);
  }, () => {
    stage(join(targets, 'x86_64-pc-windows-msvc/release/natally-ai-studio.exe'), 'windows-x64.exe', 'windows-executable');
    stageBundles(join(targets, 'x86_64-pc-windows-msvc/release/bundle/nsis'), ['.exe'], 'windows-x64-installer');
  });
  await target('windows-msi', async () => {
    if (manifest.targets.windows?.state !== 'packaged') throw Error('Windows executable must succeed before MSI packaging');
    // wixl packages the staged Windows executable into a per-machine MSI on
    // Linux (ARCHITECTURE.md "Windows MSI (Store)"). Ubuntu ships wixl as its
    // own package, Debian inside msitools, so request both and fall back.
    if (spawnSync('wixl', ['--version']).error) {
      let install = await run('msitools', 'sudo', ['apt-get', 'install', '-y', 'msitools', 'wixl']);
      if (install.code !== 0) install = await run('msitools', 'sudo', ['apt-get', 'install', '-y', 'msitools']);
      if (install.code !== 0) throw Error(`msitools/wixl install failed (${install.code}); see ${install.log || install.message}`);
    }
    const config = readJson('src-tauri/tauri.conf.json');
    const upgradeCode = config.bundle?.windows?.wix?.upgradeCode;
    if (!upgradeCode) throw Error('tauri.conf.json bundle.windows.wix.upgradeCode missing for MSI');
    const manufacturer = /authors\s*=\s*\[\s*"([^"]+)"/.exec(readFileSync('src-tauri/Cargo.toml', 'utf8'))?.[1];
    if (!manufacturer) throw Error('src-tauri/Cargo.toml authors missing for MSI manufacturer');
    const [major, minor, build] = version.split('.').map(Number);
    const output = join(targets, 'msi', `${prefix}-windows-x64.msi`);
    mkdirSync(join(targets, 'msi'), { recursive: true });
    // wixl can exit 0 without writing its output (e.g. missing parent dir);
    // drop any stale file so stage() can only ever see this run's product.
    rmSync(output, { force: true });
    return run('windows-msi', 'wixl', ['-a', 'x64', '-o', output,
      '-D', `ProductName=${config.productName}`,
      '-D', `ProductVersion=${major}.${minor}.${build}.0`,
      '-D', `UpgradeCode=${upgradeCode}`,
      '-D', `Manufacturer=${manufacturer}`,
      '-D', `ExeSource=${join(destination, `${prefix}-windows-x64.exe`)}`,
      '-D', `IconSource=${resolve('src-tauri/icons/icon.ico')}`,
      'src-tauri/msi/natally.wxs']);
  }, () => {
    stage(join(targets, 'msi', `${prefix}-windows-x64.msi`), 'windows-x64.msi', 'windows-msi');
  });
  await target('windows-msix', async () => {
    if (manifest.targets.windows?.state !== 'packaged') throw Error('Windows executable must succeed before MSIX packaging');
    const config = readJson('src-tauri/tauri.conf.json');
    const manufacturer = /authors\s*=\s*\[\s*"([^"]+)"/.exec(readFileSync('src-tauri/Cargo.toml', 'utf8'))?.[1];
    if (!manufacturer) throw Error('Configured MSIX publisher is missing');
    const background = /--atelier-ink:\s*(#[0-9a-f]{6})/i.exec(readFileSync('src/app/prototype/atelier-frozen.css', 'utf8'))?.[1];
    if (!background) throw Error('Frozen product background is missing');
    const work = resolve('build', `${prefix}-msix`, String(Date.parse(identity.builtAt)));
    const payload = join(work, 'payload');
    mkdirSync(join(payload, 'Assets'), { recursive: true });
    const executable = join(destination, `${prefix}-windows-x64.exe`);
    copyFileSync(executable, join(payload, 'natally-ai-studio.exe'));
    for (const name of ['StoreLogo.png', 'Square44x44Logo.png', 'Square150x150Logo.png']) {
      copyFileSync(join('src-tauri/icons', name), join(payload, 'Assets', name));
    }
    const runtimeImports = [];
    const runtimeSidecars = [];
    const system = new Set('advapi32 avrt bcrypt bcryptprimitives cfgmgr32 clbcatq comctl32 comdlg32 crypt32 cryptbase cryptsp d2d1 d3d11 d3d12 d3dcompiler_47 dbghelp dnsapi dsound dwmapi dwrite dxcore dxgi gdi32 gdiplus imm32 iphlpapi kernel32 kernelbase mf mfplat mmdevapi mpr mscms msctf msimg32 msvcp_win msvcrt ncrypt netapi32 normaliz ntdll ole32 oleacc oleaut32 opengl32 powrprof profapi propsys psapi rasapi32 rpcrt4 secur32 setupapi shell32 shlwapi sspicli user32 userenv usp10 uxtheme ucrtbase version winhttp wininet winmm winspool winsta wintrust wldap32 ws2_32 wtsapi32'.split(' '));
    const pending = [executable];
    for (let index = 0; index < pending.length; index += 1) {
      const imports = String(execFileSync('objdump', ['-p', pending[index]], { encoding: 'utf8', maxBuffer: 33554432 })).split('\n')
        .filter(line => line.trim().startsWith('DLL Name:')).map(line => line.split(':').slice(1).join(':').trim());
      for (const name of imports) {
        if (!runtimeImports.includes(name)) runtimeImports.push(name);
        const normalized = name.toLowerCase();
        if (normalized.startsWith('api-ms-') || normalized.startsWith('ext-ms-') || system.has(normalized.replace(/\.(dll|drv)$/, ''))) continue;
        if (runtimeSidecars.some(item => item.toLowerCase() === normalized)) continue;
        const directory = join(targets, 'x86_64-pc-windows-msvc/release');
        const sidecar = readdirSync(directory).find(item => item.toLowerCase() === normalized);
        if (!sidecar) throw Error(`Required non-system Windows runtime is unavailable: ${name}`);
        const source = join(directory, sidecar);
        copyFileSync(source, join(payload, sidecar));
        runtimeSidecars.push(sidecar);
        pending.push(source);
      }
    }
    manifest.targets['windows-msix'].runtimeImports = runtimeImports;
    manifest.targets['windows-msix'].runtimeSidecars = runtimeSidecars;
    const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
    writeFileSync(join(payload, 'AppxManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10" xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10" xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities" IgnorableNamespaces="uap rescap">
  <Identity Name="${xml(config.identifier)}" Publisher="${xml(`CN=${manufacturer}`)}" Version="${version}.0" ProcessorArchitecture="x64" />
  <Properties><DisplayName>${xml(config.productName)}</DisplayName><PublisherDisplayName>${xml(manufacturer)}</PublisherDisplayName><Description>${xml(config.bundle.shortDescription)}</Description><Logo>Assets\\StoreLogo.png</Logo></Properties>
  <Resources><Resource Language="en-US" /></Resources>
  <Dependencies><TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.22000.0" MaxVersionTested="10.0.22000.0" /></Dependencies>
  <Applications><Application Id="Natally" Executable="natally-ai-studio.exe" EntryPoint="Windows.FullTrustApplication"><uap:VisualElements DisplayName="${xml(config.productName)}" Description="${xml(config.bundle.shortDescription)}" BackgroundColor="${xml(background)}" Square150x150Logo="Assets\\Square150x150Logo.png" Square44x44Logo="Assets\\Square44x44Logo.png" /></Application></Applications>
  <Capabilities><rescap:Capability Name="runFullTrust" /></Capabilities>
</Package>
`);
    save();
    return run('windows-msix', 'makemsix', ['pack', '-d', payload, '-p', join(work, `${prefix}-windows-x64.msix`)]);
  }, () => {
    const work = resolve('build', `${prefix}-msix`, String(Date.parse(identity.builtAt)));
    stage(join(work, `${prefix}-windows-x64.msix`), 'windows-x64.msix', 'windows-msix');
    manifest.artifacts.at(-1).signatureStatus = 'unsigned';
  });
  await target('android', () => run('android', 'npx', ['--no-install', 'tauri', 'android', 'build', '--target', 'aarch64', '--apk', '--aab']), async () => {
    const output = 'src-tauri/gen/android/app/build/outputs';
    // Gradle stamps the current version into artifact names (build.gradle.kts
    // archivesName "natally-ai-studio-v" + version from version.txt), so
    // versioned leftovers from earlier invocations accumulate beside this
    // run's outputs instead of being overwritten (v1.24.765 failed with four
    // release AABs from v1.20/v1.22/v1.23/v1.24). Collect only the current
    // stamped version's artifacts.
    const stamp = `v${version}-`;
    const apks = files(join(output, 'apk')).filter(p => p.endsWith('.apk') && !p.includes('unsigned') && !p.includes('debug') && basename(p).includes(stamp));
    const aabs = files(join(output, 'bundle')).filter(p => p.endsWith('.aab') && !p.includes('debug') && basename(p).includes(stamp));
    if (apks.length !== 1 || aabs.length !== 1) throw Error(`Android release APK/AAB were not uniquely produced for v${version}; found: ${[...apks, ...aabs].map(p => basename(p)).join(', ') || 'none'}`);
    const toolsRoot = join(androidHome, 'build-tools');
    const versions = readdirSync(toolsRoot).sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
    const tool = versions.map(v => join(toolsRoot, v)).find(d => existsSync(join(d, 'apksigner')) && existsSync(join(d, 'zipalign')));
    if (!tool) throw Error('Complete Android build tools unavailable');
    const signature = execFileSync(join(tool, 'apksigner'), ['verify', '--print-certs', apks[0]], { encoding: 'utf8' });
    const actual = /certificate SHA-256 digest:\s*([0-9a-f:]+)/i.exec(signature)?.[1].replaceAll(':', '').toUpperCase();
    const expected = childEnv.ANDROID_SIGNING_CERT_SHA256.replaceAll(':', '').toUpperCase();
    if (!actual || actual !== expected) throw Error('Android APK signer does not match the configured production certificate');
    execFileSync(join(tool, 'zipalign'), ['-c', '-P', '16', '4', apks[0]], { stdio: 'inherit' });
    execFileSync('jarsigner', ['-verify', aabs[0]], { stdio: 'ignore' });
    const certificate = execFileSync('keytool', ['-printcert', '-jarfile', aabs[0], '-rfc'], { encoding: 'utf8' });
    const pem = /-----BEGIN CERTIFICATE-----([\s\S]+?)-----END CERTIFICATE-----/.exec(certificate)?.[1];
    const bundleSigner = pem ? createHash('sha256').update(Buffer.from(pem.replace(/\s/g, ''), 'base64')).digest('hex').toUpperCase() : null;
    if (!bundleSigner || bundleSigner !== expected) throw Error('Android AAB signer does not match the configured production certificate');
    manifest.targets.android.signerCertificatesSha256 = { apk: actual, aab: bundleSigner };
    stage(apks[0], 'android-arm64.apk', 'android-apk');
    manifest.artifacts.at(-1).signatureStatus = 'verified-production';
    manifest.artifacts.at(-1).signerCertificateSha256 = actual;
    stage(aabs[0], 'android-arm64.aab', 'android-aab');
    manifest.artifacts.at(-1).signatureStatus = 'verified-production';
    manifest.artifacts.at(-1).signerCertificateSha256 = bundleSigner;
    const symbols = files(join(output, 'native-debug-symbols')).filter(p => p.endsWith('.zip') && p.includes('release') && basename(p).includes(stamp));
    if (symbols.length === 1) stage(symbols[0], 'android-arm64-native-debug-symbols.zip', 'android-symbols');
    else {
      const ndks = readdirSync(join(androidHome, 'ndk')).sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
      const llvm = ndks.map(v => join(androidHome, 'ndk', v, 'toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-objcopy')).find(existsSync);
      if (!llvm) throw Error('NDK llvm-objcopy unavailable for native debug symbols');
      const symbolRoot = resolve('build', prefix + '-symbols');
      const abiDir = join(symbolRoot, 'arm64-v8a'); mkdirSync(abiDir, { recursive: true });
      const library = join(targets, 'aarch64-linux-android/release/libnatally_ai_studio_lib.so');
      execFileSync(llvm, ['--only-keep-debug', library, join(abiDir, 'libnatally_ai_studio_lib.so.dbg')]);
      const archive = join(destination, `${prefix}-android-arm64-native-debug-symbols.zip`);
      execFileSync('zip', ['-r', archive, 'arm64-v8a'], { cwd: symbolRoot, stdio: 'inherit' });
      stage(archive, 'android-arm64-native-debug-symbols.zip', 'android-symbols');
    }
  });
  manifest.finishedAt = new Date().toISOString();
  manifest.packagingComplete = ['web', 'linux', 'windows', 'windows-msi', 'windows-msix', 'android'].every(name => manifest.targets[name]?.state === 'packaged');
  if (manifest.packagingComplete) {
    const published = resolve('dist-web/releases', version);
    mkdirSync(published, { recursive: true });
    for (const artifact of manifest.artifacts) {
      copyFileSync(artifact.path, join(published, artifact.filename));
      artifact.locations.find(item => item.role === 'web-origin').publicationStatus = 'awaiting-readback';
    }
    manifest.publicationStatus = 'awaiting-readback';
    const snapshot = { ...manifest, sourceRole: 'generated', generatedFrom: { role: 'canonical-build-inventory', path: inventoryPath.slice(root.length + 1) } };
    const snapshotPath = join(destination, 'public-inventory.json');
    json(snapshotPath, snapshot);
    copyFileSync(snapshotPath, join(published, 'inventory.json'));
    const data = readFileSync(snapshotPath);
    const current = { sourceRole: 'generated', generatedFrom: { role: 'canonical-build-inventory', path: inventoryPath.slice(root.length + 1) },
      projectId: release.projectId, repository: release.repository, webOrigin: release.webOrigin,
      version, displayVersion: manifest.displayVersion, publicationStatus: 'awaiting-readback',
      manifest: { url: new URL(`/releases/${version}/inventory.json`, release.webOrigin).href, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') } };
    const currentPath = join(destination, 'public-current.json');
    json(currentPath, current);
    copyFileSync(currentPath, resolve('dist-web/releases/current.json'));
    const pointer = readFileSync(currentPath);
    manifest.publicSnapshot = { ...current.manifest, path: snapshotPath.slice(root.length + 1),
      current: { path: currentPath.slice(root.length + 1), url: new URL('/releases/current.json', release.webOrigin).href,
        bytes: pointer.length, sha256: createHash('sha256').update(pointer).digest('hex') } };
  }
  save();
  console.log(JSON.stringify({ version, displayVersion: manifest.displayVersion, packagingComplete: manifest.packagingComplete,
    complete: manifest.complete, publicationStatus: manifest.publicationStatus, targets: manifest.targets, inventory: inventoryPath }, null, 2));
  process.exitCode = manifest.packagingComplete ? 0 : 1;
}
