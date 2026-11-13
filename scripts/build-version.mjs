import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

export function epochBuildNumber(now = Date.now()) {
  if (!Number.isFinite(now) || now < 0) throw Error('A nonnegative epoch-millisecond timestamp is required');
  return Math.floor(now / 60000) % 10000;
}

export function formatDisplayVersion(version) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)
      || !version.split('.').every(part => Number.isSafeInteger(Number(part)))) {
    throw Error('A numeric SemVer identity without leading zeros is required');
  }
  return version.split('.').map((part, index) => index === 2 ? part.padStart(5, '0') : part).join('.');
}

export function stampBuild(now = Date.now(), directory = root) {
  const source = JSON.parse(readFileSync(join(directory, 'version.json'), 'utf8'));
  formatDisplayVersion(source.version);
  const [major, minor] = source.version.split('.');
  const version = `${major}.${minor}.${epochBuildNumber(now)}`;
  const identity = { ...source, version, displayVersion: formatDisplayVersion(version), builtAt: new Date(now).toISOString() };
  writeFileSync(join(directory, 'version.json'), JSON.stringify(identity, null, 2) + '\n');
  writeFileSync(join(directory, 'version.txt'), version + '\n');
  return identity;
}

export function advanceSourceVersion(directory = root) {
  const release = JSON.parse(readFileSync(join(directory, 'version.json'), 'utf8'));
  formatDisplayVersion(release.version);
  const [major, minor, build] = release.version.split('.');
  const version = `${major}.${Number(minor) + 1}.${build}`;
  const identity = { ...release, version, displayVersion: formatDisplayVersion(version), builtAt: null };
  writeFileSync(join(directory, 'version.json'), JSON.stringify(identity, null, 2) + '\n');
  writeFileSync(join(directory, 'version.txt'), version + '\n');
  return identity;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.NATALLY_CANONICAL_BUILD !== '1') throw Error('Use build_all.sh for build identity changes');
  if (process.argv[2] === 'stamp') console.log('Build identity:', stampBuild().displayVersion);
  else if (process.argv[2] === 'advance') console.log('Next source identity:', advanceSourceVersion().displayVersion);
  else throw Error('Expected stamp or advance identity phase');
}
