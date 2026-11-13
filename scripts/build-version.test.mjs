import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { epochBuildNumber, formatDisplayVersion, stampBuild, advanceSourceVersion } from './build-version.mjs';

test('build identity follows whole epoch minutes and the requested modulo10000', () => {
  assert.equal(epochBuildNumber(0), 0);
  assert.equal(epochBuildNumber(59999), 0);
  assert.equal(epochBuildNumber(60000), 1);
  assert.equal(epochBuildNumber(9999 * 60000 + 59999), 9999);
  assert.equal(epochBuildNumber(10000 * 60000), 0);
  assert.equal(epochBuildNumber(10001 * 60000), 1);
  assert.equal(epochBuildNumber(Date.parse('2026-11-13T08:36:36Z')), 9316);
  assert.throws(() => epochBuildNumber(NaN));
  assert.throws(() => epochBuildNumber(-1));
});

test('five-digit human build field preserves valid numeric package SemVer', () => {
  assert.equal(formatDisplayVersion('1.32.0'), '1.32.00000');
  assert.equal(formatDisplayVersion('1.32.769'), '1.32.00769');
  assert.equal(formatDisplayVersion('1.32.9999'), '1.32.09999');
  for (const invalid of ['v1.32.769', '1.32.00769', '1.032.769', '1.32', '1.32.counter']) {
    assert.throws(() => formatDisplayVersion(invalid));
  }
});

test('release stamp retains source minor; successful advancement retains build and clears builtAt', () => {
  const directory = mkdtempSync(join(tmpdir(), 'natally-version-'));
  try {
    writeFileSync(join(directory, 'version.json'), JSON.stringify({ version: '1.32.768', builtAt: null }));
    const now = Date.parse('2026-11-13T08:36:36Z');
    const release = stampBuild(now, directory);
    assert.deepEqual(release, { version: '1.32.9316', displayVersion: '1.32.09316', builtAt: '2026-11-13T08:36:36.000Z' });
    assert.equal(readFileSync(join(directory, 'version.txt'), 'utf8'), '1.32.9316\n');
    const source = advanceSourceVersion(directory);
    assert.deepEqual(source, { version: '1.33.9316', displayVersion: '1.33.09316', builtAt: null });
    assert.equal(readFileSync(join(directory, 'version.txt'), 'utf8'), '1.33.9316\n');
    assert.equal(stampBuild(now + 60000, directory).version, '1.33.9317');
    assert.equal(release.builtAt, '2026-11-13T08:36:36.000Z');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('canonical pipeline advances source only after the complete required matrix succeeds', async t => {
  for (const failure of ['', 'lint', 'web', 'astronatally.com', 'asknatally.online', 'native', 'commit', 'push']) {
    await t.test(failure || 'success', () => {
      const directory = mkdtempSync(join(tmpdir(), 'natally-build-order-'));
      try {
        mkdirSync(join(directory, 'scripts'));
        mkdirSync(join(directory, 'bin'));
        copyFileSync(new URL('../build_all.sh', import.meta.url), join(directory, 'build_all.sh'));
        copyFileSync(new URL('./build-version.mjs', import.meta.url), join(directory, 'scripts/build-version.mjs'));
        writeFileSync(join(directory, 'version.json'), JSON.stringify({ version: '1.32.768', builtAt: null }));
        writeFileSync(join(directory, 'scripts/build-native.mjs'), `
          import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
          const identity = JSON.parse(readFileSync('version.json', 'utf8'));
          const phase = process.argv[2] === 'prepare' ? 'prepare' : 'native';
          appendFileSync(process.env.NATALLY_TEST_LOG, phase + ':' + identity.version + ':' + (identity.builtAt !== null) + '\\n');
          if (phase === 'native') {
            if (process.env.NATALLY_TEST_FAIL === 'native') process.exit(1);
            writeFileSync('artifact-identity.json', JSON.stringify(identity));
          }
        `);
        writeFileSync(join(directory, 'bin/npm'), `#!/bin/sh
          echo lint >> "$NATALLY_TEST_LOG"
          [ "$NATALLY_TEST_FAIL" != lint ]
        `, { mode: 0o755 });
        writeFileSync(join(directory, 'bin/npx'), `#!/bin/sh
          if [ "$1" = vite ]; then
            echo web >> "$NATALLY_TEST_LOG"
            [ "$NATALLY_TEST_FAIL" != web ] || exit 1
            mkdir -p dist-web
            echo '<main>compiled fixture</main>' > dist-web/app.html
          else
            echo "publish:$4" >> "$NATALLY_TEST_LOG"
            [ "$NATALLY_TEST_FAIL" != "$4" ] || exit 1
          fi
        `, { mode: 0o755 });
        writeFileSync(join(directory, 'bin/git'), `#!/bin/sh
          echo "git:$1" >> "$NATALLY_TEST_LOG"
          [ "$NATALLY_TEST_FAIL" != "$1" ]
        `, { mode: 0o755 });
        const result = spawnSync('bash', ['build_all.sh'], {
          cwd: directory,
          env: { ...process.env, PATH: join(directory, 'bin') + ':' + process.env.PATH, NATALLY_BUILD_ENV_RESOLVED: '1', NATALLY_TEST_LOG: join(directory, 'order.log'), NATALLY_TEST_FAIL: failure },
          encoding: 'utf8'
        });
        const source = JSON.parse(readFileSync(join(directory, 'version.json'), 'utf8'));
        const order = readFileSync(join(directory, 'order.log'), 'utf8').trim().split('\n');
        if (failure) {
          assert.notEqual(result.status, 0, result.stdout + result.stderr);
          assert.equal(source.version.split('.')[1], '32', order.join('\n'));
          assert.ok(source.builtAt);
          assert.equal(order.filter(line => line.startsWith('prepare:')).length, 1);
        } else {
          assert.equal(result.status, 0, result.stdout + result.stderr);
          const artifact = JSON.parse(readFileSync(join(directory, 'artifact-identity.json'), 'utf8'));
          assert.equal(artifact.version.split('.')[1], '32');
          assert.equal(source.version.split('.')[1], '33');
          assert.equal(source.version.split('.')[2], artifact.version.split('.')[2]);
          assert.match(artifact.displayVersion, /^1\.32\.\d{5}$/);
          assert.ok(artifact.builtAt);
          assert.equal(source.builtAt, null);
          assert.ok(order.indexOf('publish:astronatally.com') < order.indexOf('publish:asknatally.online'));
          assert.ok(order.indexOf('publish:asknatally.online') < order.findIndex(line => line.startsWith('native:')));
          assert.match(order.at(-4), /^prepare:1\.33\.\d+:false$/);
          assert.deepEqual(order.slice(-3), ['git:add', 'git:commit', 'git:push']);
        }
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });
  }
});
