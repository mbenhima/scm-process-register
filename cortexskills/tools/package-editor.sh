#!/bin/bash
# Builds deliverables/CortexSkills-editor-runtime-linux-<version>.zip: the editor's own runtime on Linux with Docker
# (VPS with HTTPS, or a Linux laptop) — the same image as the customers', plus install, licence, backup and update
# scripts. No signing tool, no private key. Usage: tools/package-editor.sh [path/to/vendor-public.pem]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/deliverables"
VER=$(node -p "require('$ROOT/server/package.json').version"); NAME="CortexSkills-editor-runtime-linux-$VER"
TMP=$(mktemp -d); B="$TMP/$NAME"; mkdir -p "$B/app/web" "$B/licence"
(cd "$ROOT/web" && npm run build >/dev/null)
tar -C "$ROOT/server" --exclude=node_modules --exclude=./data --exclude=./tools/keys --exclude=./tools/sign-licence.js --exclude=./test \
  --exclude=.env --exclude='*.log' -cf - . | (mkdir -p "$B/app/server" && tar -C "$B/app/server" -xf -)
cp -r "$ROOT/web/dist" "$B/app/web/dist"
cp "$ROOT"/deploy/docker/{Dockerfile,.dockerignore,Caddyfile,entrypoint.sh,cortexskills-admin} "$B/"
cp "$ROOT"/deploy/editor/{docker-compose.yml,env.example,install.sh,licence.sh,backup.sh,update.sh} "$B/"
sed "s/@VERSION@/$VER/g" "$ROOT/deploy/editor/README.txt" > "$B/README.txt"
sed -i "s/cortexskills:[0-9][0-9.]*/cortexskills:$VER/g" "$B/Dockerfile"
echo "$VER" > "$B/VERSION"
printf 'Licence files (.lic) signed on your laptop go here: ./licence.sh install licence/<file>.lic\n' > "$B/licence/README.txt"
if [ "${1:-}" ]; then grep -q "BEGIN PUBLIC KEY" "$1" || { echo "$1 is not a public key" >&2; exit 1; }; cp "$1" "$B/vendor-public.pem"; fi
test ! -e "$B/app/server/tools/sign-licence.js" && ! find "$B" -name 'vendor-private.pem' | grep -q .
chmod +x "$B"/*.sh "$B/cortexskills-admin"
rm -f "$OUT/$NAME.zip"; (cd "$TMP" && zip -qr -X "$OUT/$NAME.zip" "$NAME"); rm -rf "$TMP"
ls -la "$OUT/$NAME.zip"
