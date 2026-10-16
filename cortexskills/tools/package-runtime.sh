#!/bin/bash
# Construit les exécutables minifiés de CortexSkills (sans Docker, sans code source lisible), un fichier par côté :
#   deliverables/runtime/Runtime_Customer_Linux_CortexSkills_<v>.tar.xz        client (sans tarif), Linux x64
#   deliverables/runtime/Runtime_Editor_Linux_Windows_CortexSkills_<v>.zip     éditeur, Linux x64 et Windows x64, licences
# Chaque paquet contient : le serveur minifié (esbuild, fichier par fichier), l'interface compilée par Vite (minifiée,
# découpée, précompressée Brotli/gzip, sans source map), les dépendances de production (sans les fichiers inutiles à
# l'exécution) et la clé publique de l'éditeur. Node.js 22 LTS est un prérequis de la machine (non inclus).
# Usage : tools/package-runtime.sh --cle-publique <vendor-public.pem> [--cle-privee <vendor-private.pem>]
#   --cle-privee : la place dans le dossier poste-signature/ du paquet éditeur (à importer avec cslic importer).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/deliverables/runtime"; mkdir -p "$OUT"
PUB=""; PRIV=""
while [ $# -gt 0 ]; do case "$1" in --cle-publique) PUB=$2; shift 2;; --cle-privee) PRIV=$2; shift 2;; *) echo "option inconnue $1" >&2; exit 1;; esac; done
[ -f "$PUB" ] && grep -q "BEGIN PUBLIC KEY" "$PUB" || { echo "--cle-publique <vendor-public.pem> obligatoire" >&2; exit 1; }
VER=$(node -p "require('$ROOT/server/package.json').version")
RT="$ROOT/deploy/runtime"
TMP=$(mktemp -d); trap 'rm -rf -- "${TMP:?}"' EXIT

# --- Interface web : compilation de production (icônes utilisées seulement, découpage par page, précompression)
(cd "$ROOT/web" && npm run build >/dev/null 2>&1) || { echo "échec de la compilation de l'interface (cd web && npm run build)" >&2; exit 1; }

# --- Dépendances de production du serveur (une fois), allégées de ce qui ne sert pas à l'exécution sous Node.js :
# documentation, types, source maps, tests, variantes navigateur (iife, umd) de docx et exceljs, polices web
# @fontsource (le serveur utilise ses propres polices), binaire musl de @resvg/resvg-js (Linux glibc seulement).
D="$TMP/deps"; mkdir -p "$D"; cp "$ROOT/server/package.json" "$ROOT/server/package-lock.json" "$D/"
(cd "$D" && npm ci --omit=dev --no-audit --no-fund --ignore-scripts >/dev/null)
NM="$D/node_modules"
find "$NM" -type f \( -name '*.md' -o -name '*.ts' -o -name '*.cts' -o -name '*.mts' -o -name '*.map' -o -name 'CHANGELOG*' -o -name '*.tsbuildinfo' \) -delete
find "$NM" -depth -type d \( -name test -o -name tests -o -name __tests__ -o -name docs -o -name example -o -name examples \) -exec rm -rf {} +
rm -f "$NM"/docx/dist/*.iife.js "$NM"/docx/dist/*.umd.cjs
rm -rf "$NM/exceljs/dist" "$NM/@fontsource" "$NM/@resvg/resvg-js-linux-x64-musl"
# docx : point d'entrée « main » vers la variante CommonJS gardée.
node -e "const f='$NM/docx/package.json',p=require(f);p.main='./dist/index.cjs';require('fs').writeFileSync(f,JSON.stringify(p,null,2))"
RV=$(node -p "require('$NM/@resvg/resvg-js/package.json').version")
WIN="$TMP/win-resvg"; mkdir -p "$WIN"
(cd "$WIN" && npm pack "@resvg/resvg-js-win32-x64-msvc@$RV" --silent >/dev/null && tar -xzf ./*.tgz && rm -f ./*.tgz)

minify() { # $1 source .mjs $2 destination : fichier minifié (la ligne #! est gardée)
  node -e "const e=require('$ROOT/web/node_modules/esbuild');const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');const b=s.startsWith('#!')?s.slice(0,s.indexOf('\n')+1):'';fs.writeFileSync(process.argv[2],b+e.transformSync(s.slice(b.length),{loader:'js',format:'esm',target:'node22',platform:'node',minify:true,legalComments:'none',charset:'utf8'}).code)" "$1" "$2"
}
assemble() { # $1 dossier du paquet $2 édition (customer|editor) $3 dossier des textes (client|editeur)
  local P="$1"; mkdir -p "$P/app" "$P/config" "$P/licence" "$P/data"
  node "$ROOT/tools/build-runtime.mjs" "$P/app" "$2" >/dev/null
  rm -f "$P/app/server/.env"* ; cp -r "$NM" "$P/app/server/node_modules"
  mkdir -p "$P/app/server/tools/keys"; cp "$PUB" "$P/app/server/tools/keys/vendor-public.pem"
  cp "$RT/commun/cortexskills" "$RT/commun/installer-service.sh" "$RT/commun/env.example" "$P/"
  cp "$RT/commun/cortexskills.service" "$RT/commun/nginx-cortexskills.conf" "$P/config/"
  cp "$RT/commun/licence-LISEZMOI.txt" "$P/licence/LISEZMOI.txt"
  printf "Données de CortexSkills (base, pièces jointes, sauvegardes, licence installée). À sauvegarder.\nCortexSkills data (database, attachments, backups, installed licence). Back it up.\n" > "$P/data/LISEZMOI.txt"
  for f in LISEZMOI.txt README.txt; do sed "s/@VERSION@/$VER/g" "$RT/$3/$f" > "$P/$f"; done
  chmod +x "$P/cortexskills" "$P/installer-service.sh"
}
check() { # $1 dossier : aucune source map, aucun outil de signature ni clé privée dans app/, et chaque fichier JavaScript
  # de l'application (hors dépendances tierces) est déjà minifié : le minifier encore ne le réduit pas de plus de 3 %.
  local P="$1"
  ! find "$P/app" -name '*.map' -o -name 'sign-licence*' -o -name 'vendor-private*' | grep -q . || { echo "fichier interdit dans $P" >&2; exit 1; }
  node -e "const e=require('$ROOT/web/node_modules/esbuild');const fs=require('fs'),p=require('path');const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.name==='node_modules'?[]:x.isDirectory()?w(p.join(d,x.name)):[p.join(d,x.name)]);const bad=w(process.argv[1]).filter(f=>/\.m?js$/.test(f)).filter(f=>{let s=fs.readFileSync(f,'utf8');if(s.startsWith('#!'))s=s.slice(s.indexOf('\n')+1);if(s.length<1024)return false;const m=e.transformSync(s,{loader:'js',format:'esm',minify:true,legalComments:'inline',charset:'utf8',target:'esnext'}).code;return m.length<s.length*0.97});if(bad.length){console.error('fichiers non minifiés :',bad);process.exit(1)}" "$P/app"
  (cd "$P" && find . -type f ! -name SHA256SUMS.txt | sort | xargs -d '\n' sha256sum > SHA256SUMS.txt)
}
sums() { (cd "$OUT" && sha256sum "$1" > "$1.sha256"); echo "$1 : $(du -h "$OUT/$1" | cut -f1)"; }
rm -f "$OUT"/Runtime_*

# --- Client : Linux x64, sans tarif ni information commerciale → un seul fichier .tar.xz
CN="Runtime_Customer_Linux_CortexSkills_$VER"; C="$TMP/$CN"
assemble "$C" customer client
check "$C"
(cd "$TMP" && tar --owner=0 --group=0 -cf - "$CN" | xz -9e -T0 > "$OUT/$CN.tar.xz")
sums "$CN.tar.xz"

# --- Éditeur : Linux x64 et Windows x64, gestion des licences → un seul fichier .zip (ouvert nativement par Windows)
EN="Runtime_Editor_Linux_Windows_CortexSkills_$VER"; E="$TMP/$EN"
assemble "$E" editor editeur
cp -r "$WIN/package" "$E/app/server/node_modules/@resvg/resvg-js-win32-x64-msvc"
mkdir -p "$E/app/tools"; minify "$ROOT/tools/licence-manager/cslic.mjs" "$E/app/tools/cslic.mjs"
cp "$RT/editeur/cortexskills.cmd" "$RT/editeur/cslic" "$RT/editeur/cslic.cmd" "$ROOT/tools/licence-manager/cslic-sauvegarder" "$E/"
chmod +x "$E/cslic" "$E/cslic-sauvegarder"
for f in cortexskills.cmd cslic.cmd; do sed -i 's/\r\?$/\r/' "$E/$f"; done   # fins de ligne Windows
sed -i 's|^# CortexSkills — réglages.|# CortexSkills (version éditeur) — réglages.|' "$E/env.example"
if [ -n "$PRIV" ]; then mkdir -p "$E/poste-signature"; cp "$PRIV" "$E/poste-signature/vendor-private.pem"; cp "$PUB" "$E/poste-signature/vendor-public.pem"; chmod 600 "$E/poste-signature/vendor-private.pem"
  printf "Paire de clés de signature des licences (Ed25519) / Licence signing key pair.\nInstallez-la UNE fois / Import it ONCE:  ./cslic importer poste-signature   (Windows : cslic importer poste-signature)\npuis supprimez ce dossier et sauvegardez le poste / then delete this folder and back up the workstation.\nNe copiez jamais vendor-private.pem sur un serveur / Never copy vendor-private.pem to a server.\n" > "$E/poste-signature/LISEZMOI.txt"; fi
check "$E"
(cd "$TMP" && zip -q -9 -r -X -y "$OUT/$EN.zip" "$EN")
sums "$EN.zip"
ls -la "$OUT"
