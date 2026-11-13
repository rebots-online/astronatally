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
release_hostname="$(node scripts/product-release.mjs hostname)"
node scripts/build-version.mjs stamp
node scripts/build-native.mjs prepare
git add version.json version.txt package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git commit -qm "Stamp shared web, desktop and Android release identity" -- version.json version.txt package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git push origin HEAD
npm run lint
npx vite build --outDir dist-web
cp dist-web/app.html dist-web/index.html
echo "Web build complete → dist-web/"
# The fork has one configured origin. Original-lineage sites are untouched.
npx --yes surge@0.56.0 dist-web "$release_hostname" --force https
printf 'Web published: %s (v%s)\n' "$(node scripts/product-release.mjs origin)" "$(node -p 'require("./version.json").displayVersion')"
printf 'Review the published screens. Type BUILD to continue native packaging: '
if ! IFS= read -r review_decision < /dev/tty || [[ "$review_decision" != BUILD ]]; then
  printf '\nWeb review pending; native packaging has not started and source minor has not advanced.\n' >&2
  exit 75
fi
node scripts/build-native.mjs
npx --yes surge@0.56.0 dist-web "$release_hostname" --force https
node scripts/build-native.mjs verify-publication
node scripts/build-version.mjs advance
node scripts/build-native.mjs prepare
git add version.json version.txt package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git commit -qm "Advance source minor after successful complete build" -- version.json version.txt package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git push origin HEAD
