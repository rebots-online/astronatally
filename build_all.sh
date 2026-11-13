#!/usr/bin/env bash
# Canonical full-matrix entry: web build/deploy first, then native packages.
set -euo pipefail
cd "$(dirname "$0")"
if [ "${NATALLY_BUILD_ENV_RESOLVED:-0}" != 1 ]; then
  exec node scripts/build-environment.mjs bash "$0" "$@"
fi
mkdir -p build
exec 9>build/build-all.lock
flock -n 9 || { echo "Another canonical build is running." >&2; exit 1; }
export NATALLY_CANONICAL_BUILD=1
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

# Stamp this release once from UTC epoch minutes; source MINOR advances only
# after the complete web/native matrix has returned successfully.
node scripts/build-version.mjs stamp
node scripts/build-native.mjs prepare
git add version.json version.txt package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git commit -qm "Stamp shared web, desktop and Android release identity" -- version.json version.txt package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git push origin HEAD
npm run lint
npx vite build --outDir dist-web
cp dist-web/app.html dist-web/index.html
echo "Web build complete → dist-web/"
# astronatally.com is the landing; the webapp lands on asknatally.online
# (ARCHITECTURE §12.1). No temporary subdomains.
npx --yes surge@0.56.0 dist-web astronatally.com --force https
npx --yes surge@0.56.0 dist-web asknatally.online --force https
node scripts/build-native.mjs
node scripts/build-version.mjs advance
node scripts/build-native.mjs prepare
git add version.json version.txt package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git commit -qm "Advance source minor after successful complete build" -- version.json version.txt package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git push origin HEAD
