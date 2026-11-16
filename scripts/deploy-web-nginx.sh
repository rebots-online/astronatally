#!/usr/bin/env bash
# Publish dist-web to our own nginx (nginx-ui on Proxmox CT123) — replaces the retired surge publisher.
# The release hostname comes from config/product-release.json (webOrigin), so
# publication readback (scripts/build-native.mjs verify-publication) verifies
# the same origin this script serves.
set -euo pipefail
cd "$(dirname "$0")/.."
host="$(node scripts/product-release.mjs hostname)"
webroot="/var/www/${host}"
ASTRONATALLY_NGINX_HOST="${ASTRONATALLY_NGINX_HOST:-192.168.0.126}"
ASTRONATALLY_NGINX_USER="${ASTRONATALLY_NGINX_USER:-root}"
target="${ASTRONATALLY_NGINX_USER}@${ASTRONATALLY_NGINX_HOST}"
if [ ! -f dist-web/index.html ]; then
  echo "dist-web/ is missing or incomplete; run the canonical web build first." >&2
  exit 1
fi
# --delete keeps the webroot an exact mirror; CNAME is a retired publisher artifact.
rsync -az --delete --exclude CNAME dist-web/ "${target}:${webroot}/"
ssh "${target}" "nginx -t >/dev/null 2>&1 && systemctl reload nginx"
printf 'Web published to nginx: https://%s (webroot %s on %s)\n' "$host" "$webroot" "$ASTRONATALLY_NGINX_HOST"
