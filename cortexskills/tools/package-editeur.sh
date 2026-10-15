#!/bin/bash
# Builds deliverables/CortexSkills-Editeur-<version>.zip: the editor's package (Linux, Docker) — application/ (runtime
# only, prices shown, install scripts for the two scenarios), gestion-licences/ (licence manager, minified) and
# paquet-client/ (the customer package to prepare with cslic-paquet). No source code, no key.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/deliverables"
VER=$(node -p "require('$ROOT/server/package.json').version"); NAME="CortexSkills-Editeur-$VER"
TMP=$(mktemp -d); trap 'rm -rf -- "${TMP:?}"' EXIT; B="$TMP/$NAME"; A="$B/application"; G="$B/gestion-licences"; mkdir -p "$A" "$G" "$B/paquet-client"
bash "$ROOT/tools/package-client.sh" >/dev/null
cp "$OUT/CortexSkills-Client-$VER.zip" "$B/paquet-client/"
node "$ROOT/tools/build-runtime.mjs" "$A/runtime" editor
cp -r "$ROOT/deploy/client/." "$A/"; rm -f "$A/LISEZMOI.txt"
cp "$ROOT"/deploy/editeur/*.sh "$A/"; echo "$VER" > "$A/VERSION"
for f in Dockerfile docker-compose.yml; do sed -i "s/@VERSION@/$VER/g; s/@COMMERCIAL@/shown/g" "$A/$f"; done
sed -i 's|^# CortexSkills — réglages.|# CortexSkills (version éditeur) — réglages. installer.sh crée .env à partir de ce fichier.|' "$A/env.example"
sed "s/@VERSION@/$VER/g" "$ROOT/deploy/editeur/LISEZMOI.txt" > "$B/LISEZMOI.txt"
LM="$ROOT/tools/licence-manager"
node -e "const e=require('$ROOT/web/node_modules/esbuild');const fs=require('fs');const s=fs.readFileSync('$LM/cslic.mjs','utf8');const b=s.slice(0,s.indexOf('\n')+1);fs.writeFileSync('$G/cslic.mjs',b+e.transformSync(s.slice(b.length),{loader:'js',format:'esm',target:'node22',minify:true,legalComments:'none',charset:'utf8'}).code)"
cp "$LM/cslic" "$LM/cslic-paquet" "$LM/cslic-sauvegarder" "$G/"
chmod +x "$A"/*.sh "$A/docker/"* "$G"/cslic "$G"/cslic-*
! find "$B" -name 'vendor-*.pem' | grep -q . || { echo "a key is in the editor package" >&2; exit 1; }
rm -f "$OUT/$NAME.zip"; (cd "$TMP" && zip -qr -X "$OUT/$NAME.zip" "$NAME")
ls -la "$OUT/$NAME.zip"
