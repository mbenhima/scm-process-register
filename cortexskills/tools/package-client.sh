#!/bin/bash
# Builds deliverables/CortexSkills-Client-<version>.zip: the customer package (Linux, Docker) with the runtime only —
# minified server, built web client, no source code, no test, no signing tool, no price. The editor adds its public key
# and the checksum file with « cslic-paquet » before sending it to a customer.
# Usage: tools/package-client.sh [path/to/vendor-public.pem]   (with a key: the package is ready to send, with .sha256)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/deliverables"
VER=$(node -p "require('$ROOT/server/package.json').version"); NAME="CortexSkills-Client-$VER"
TMP=$(mktemp -d); trap 'rm -rf -- "${TMP:?}"' EXIT; B="$TMP/$NAME"; mkdir -p "$B"
(cd "$ROOT/web" && npm run build >/dev/null 2>&1)
node "$ROOT/tools/build-runtime.mjs" "$B/runtime" customer
cp -r "$ROOT/deploy/client/." "$B/"
for f in Dockerfile docker-compose.yml LISEZMOI.txt; do sed -i "s/@VERSION@/$VER/g; s/@COMMERCIAL@/hidden/g" "$B/$f"; done
chmod +x "$B/docker/"*
if [ "${1:-}" ]; then grep -q "BEGIN PUBLIC KEY" "$1" || { echo "$1 is not a public key" >&2; exit 1; }; cp "$1" "$B/vendor-public.pem"; fi
! grep -rqiE '"(price|priceRule|overage)"' "$B/runtime/server/seed" || { echo "prices left in the customer runtime" >&2; exit 1; }
rm -f "$OUT/$NAME.zip" "$OUT/$NAME.zip.sha256"; (cd "$TMP" && zip -qr -X "$OUT/$NAME.zip" "$NAME")
[ -f "$B/vendor-public.pem" ] && (cd "$OUT" && sha256sum "$NAME.zip" > "$NAME.zip.sha256")
ls -la "$OUT/$NAME.zip"*
