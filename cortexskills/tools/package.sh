#!/bin/bash
# Builds the delivery zips: CortexSkills-app.zip (server + web, ready to install) and CortexSkills-source.zip (all source and tools).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/deliverables"; TMP=$(mktemp -d)
EX=(--exclude=node_modules --exclude=./server/data --exclude=dist --exclude=keys --exclude=.env --exclude='*.log')
mkdir -p "$TMP/app/CortexSkills" "$TMP/src/CortexSkills-source"
# The application zip ships the built web client (web/dist) so production needs no build step on the server.
(cd "$ROOT/web" && npm run build >/dev/null)
tar -C "$ROOT" "${EX[@]}" -cf - ./server ./web ./deploy ./README.md | tar -C "$TMP/app/CortexSkills" -xf -
mkdir -p "$TMP/app/CortexSkills/web/dist" && cp -r "$ROOT/web/dist/." "$TMP/app/CortexSkills/web/dist/"
tar -C "$ROOT" "${EX[@]}" --exclude=./deliverables --exclude=./tools/docs/shots --exclude=guide-data.json --exclude=sector-data.json -cf - . | tar -C "$TMP/src/CortexSkills-source" -xf -
mkdir -p "$TMP/src/CortexSkills-source/.github/workflows" && cp "$ROOT/../.github/workflows/cortexskills-ci.yml" "$TMP/src/CortexSkills-source/.github/workflows/"
rm -f "$OUT/CortexSkills-app.zip" "$OUT/CortexSkills-source.zip"
(cd "$TMP/app" && zip -qr -X "$OUT/CortexSkills-app.zip" CortexSkills)
(cd "$TMP/src" && zip -qr -X "$OUT/CortexSkills-source.zip" CortexSkills-source)
rm -rf "$TMP"; ls -la "$OUT"/*.zip
