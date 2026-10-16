#!/bin/bash
# Builds the delivery zips: CortexSkills-app-<v>.zip (server + web, ready to install with Node.js) and CortexSkills-source-<v>.zip (all source and tools).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/deliverables"; TMP=$(mktemp -d)
VER=$(node -p "require('$ROOT/server/package.json').version")
EX=(--exclude=node_modules --exclude=./server/data --exclude=dist --exclude=keys --exclude=.env --exclude='*.log')
mkdir -p "$TMP/app/CortexSkills" "$TMP/src/CortexSkills-source"
# The application zip ships the built web client (web/dist) so production needs no build step on the server.
(cd "$ROOT/web" && npm run build >/dev/null)
# The vendor signing tool stays in the source code (vendor signing workspace), never in the application.
tar -C "$ROOT" "${EX[@]}" --exclude=./server/tools/sign-licence.js --exclude=./server/test --exclude=./web/test --exclude=./deploy/README-vendor-licence.txt --exclude=./deploy/client --exclude=./deploy/editeur -cf - ./server ./web ./deploy ./README.md | tar -C "$TMP/app/CortexSkills" -xf -
mkdir -p "$TMP/app/CortexSkills/web/dist" && cp -r "$ROOT/web/dist/." "$TMP/app/CortexSkills/web/dist/"
tar -C "$ROOT" "${EX[@]}" --exclude=./deliverables --exclude=./tools/docs/shots --exclude=guide-data.json --exclude=sector-data.json -cf - . | tar -C "$TMP/src/CortexSkills-source" -xf -
mkdir -p "$TMP/src/CortexSkills-source/.github/workflows" && cp "$ROOT/../.github/workflows/cortexskills-ci.yml" "$TMP/src/CortexSkills-source/.github/workflows/"
rm -f "$OUT/CortexSkills-app-$VER.zip" "$OUT/CortexSkills-source-$VER.zip"
(cd "$TMP/app" && zip -qr -X "$OUT/CortexSkills-app-$VER.zip" CortexSkills)
(cd "$TMP/src" && zip -qr -X "$OUT/CortexSkills-source-$VER.zip" CortexSkills-source)
rm -rf "$TMP"; ls -la "$OUT"/CortexSkills-app-$VER.zip "$OUT"/CortexSkills-source-$VER.zip
