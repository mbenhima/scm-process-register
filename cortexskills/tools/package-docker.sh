#!/bin/bash
# Builds deliverables/CortexSkills-docker-<version>.zip, the bundle sent to a customer who runs CortexSkills with
# Docker on Linux: the Dockerfile and compose files, and the application (server + built web client) without the
# vendor signing tool, keys, tests, data or settings.
# Usage: tools/package-docker.sh [path/to/vendor-public.pem]
#   With the vendor public key, the bundle is ready to build. Without it, add vendor-public.pem next to the Dockerfile
#   before building (the build stops otherwise). The private key is never part of the bundle.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/deliverables"
VER=$(node -p "require('$ROOT/server/package.json').version"); NAME="CortexSkills-docker-$VER"
TMP=$(mktemp -d); B="$TMP/$NAME"; mkdir -p "$B/app/web" "$B/licence"
(cd "$ROOT/web" && npm run build >/dev/null)
tar -C "$ROOT/server" --exclude=node_modules --exclude=./data --exclude=./tools/keys --exclude=./tools/sign-licence.js --exclude=./test \
  --exclude=.env --exclude='*.log' -cf - . | (mkdir -p "$B/app/server" && tar -C "$B/app/server" -xf -)
cp -r "$ROOT/web/dist" "$B/app/web/dist"
cp "$ROOT"/deploy/docker/{Dockerfile,.dockerignore,docker-compose.yml,compose.https.yml,Caddyfile,env.example,entrypoint.sh,cortexskills-admin,INSTALL.txt} "$B/"
sed -i "s/cortexskills:[0-9][0-9.]*/cortexskills:$VER/g" "$B/docker-compose.yml" "$B/Dockerfile" "$B/env.example" "$B/INSTALL.txt"
printf 'Put here the licence file (.lic) received from the vendor, then run:\n  docker compose exec cortexskills cortexskills-admin licence-install --file /licence/<file>.lic\n' > "$B/licence/README.txt"
if [ "${1:-}" ]; then grep -q "BEGIN PUBLIC KEY" "$1" || { echo "$1 is not a public key" >&2; exit 1; }; cp "$1" "$B/vendor-public.pem"; fi
test ! -e "$B/app/server/tools/sign-licence.js" && ! find "$B" -name 'vendor-private.pem' | grep -q .
chmod +x "$B/entrypoint.sh" "$B/cortexskills-admin"
rm -f "$OUT/$NAME.zip"; (cd "$TMP" && zip -qr -X "$OUT/$NAME.zip" "$NAME"); rm -rf "$TMP"
ls -la "$OUT/$NAME.zip"
