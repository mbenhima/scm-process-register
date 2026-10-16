#!/bin/bash
# Construit les exécutables minifiés de CortexSkills (sans Docker, sans code source lisible) :
#   deliverables/runtime/Runtime_Customer_Linux_CortexSkills_<v>.zip        client (sans tarif), Linux x64
#   deliverables/runtime/Runtime_Editor_Linux_Windows_CortexSkills_<v>.zip  éditeur, Linux x64 et Windows x64, gestion des licences
# Chaque paquet contient : le serveur minifié (esbuild, fichier par fichier), l'interface compilée par Vite (minifiée,
# découpée, précompressée Brotli/gzip, sans source map), les dépendances de production, la clé publique de l'éditeur
# et Node.js (distribution officielle, empreinte vérifiée).
# Usage : tools/package-runtime.sh --cle-publique <vendor-public.pem> [--cle-privee <vendor-private.pem>] [--parties 24m]
#   --cle-privee : la place dans le dossier poste-signature/ du paquet éditeur (à importer avec cslic importer).
# Variables : NODE_DIST_VERSION (défaut 22.22.2), NODE_MIRROR (défaut https://nodejs.org/dist).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/deliverables/runtime"; CACHE="$OUT/.cache"; mkdir -p "$OUT" "$CACHE"
PUB=""; PRIV=""; PARTS=""
while [ $# -gt 0 ]; do case "$1" in --cle-publique) PUB=$2; shift 2;; --cle-privee) PRIV=$2; shift 2;; --parties) PARTS=$2; shift 2;; *) echo "option inconnue $1" >&2; exit 1;; esac; done
[ -f "$PUB" ] && grep -q "BEGIN PUBLIC KEY" "$PUB" || { echo "--cle-publique <vendor-public.pem> obligatoire" >&2; exit 1; }
VER=$(node -p "require('$ROOT/server/package.json').version")
NV=${NODE_DIST_VERSION:-22.22.2}; MIRROR=${NODE_MIRROR:-https://nodejs.org/dist}
RT="$ROOT/deploy/runtime"
TMP=$(mktemp -d); trap 'rm -rf -- "${TMP:?}"' EXIT

# --- Node.js officiel (Linux x64, Windows x64), vérifié avec SHASUMS256.txt
fetch() { [ -s "$CACHE/$1" ] || curl -fsSL -o "$CACHE/$1" "$MIRROR/v$NV/$1"; }
fetch SHASUMS256.txt; fetch "node-v$NV-linux-x64.tar.xz"; fetch "node-v$NV-win-x64.zip"
(cd "$CACHE" && grep -E " (node-v$NV-linux-x64\.tar\.xz|node-v$NV-win-x64\.zip)$" SHASUMS256.txt | sha256sum -c --quiet) || { echo "empreinte Node.js invalide" >&2; exit 1; }
mkdir -p "$TMP/node-linux/bin" "$TMP/node-windows"
tar -xJf "$CACHE/node-v$NV-linux-x64.tar.xz" -C "$TMP" "node-v$NV-linux-x64/bin/node" "node-v$NV-linux-x64/LICENSE"
mv "$TMP/node-v$NV-linux-x64/bin/node" "$TMP/node-linux/bin/"; mv "$TMP/node-v$NV-linux-x64/LICENSE" "$TMP/node-linux/"
unzip -q -j "$CACHE/node-v$NV-win-x64.zip" "node-v$NV-win-x64/node.exe" "node-v$NV-win-x64/LICENSE" -d "$TMP/node-windows"

# --- Interface web : compilation de production (icônes utilisées seulement, découpage par page, précompression)
(cd "$ROOT/web" && npm run build >/dev/null 2>&1) || { echo "échec de la compilation de l'interface (cd web && npm run build)" >&2; exit 1; }

# --- Dépendances de production du serveur (une fois), + le binaire Windows de @resvg/resvg-js pour l'éditeur
D="$TMP/deps"; mkdir -p "$D"; cp "$ROOT/server/package.json" "$ROOT/server/package-lock.json" "$D/"
(cd "$D" && npm ci --omit=dev --no-audit --no-fund --ignore-scripts >/dev/null)
find "$D/node_modules" -type f \( -name '*.md' -o -name '*.ts' -o -name '*.map' -o -name 'CHANGELOG*' -o -name '*.tsbuildinfo' \) -delete
find "$D/node_modules" -depth -type d \( -name test -o -name tests -o -name __tests__ -o -name docs -o -name example -o -name examples \) -exec rm -rf {} +
RV=$(node -p "require('$D/node_modules/@resvg/resvg-js/package.json').version")
WIN="$TMP/win-resvg"; mkdir -p "$WIN"
(cd "$WIN" && npm pack "@resvg/resvg-js-win32-x64-msvc@$RV" --silent >/dev/null && tar -xzf ./*.tgz && rm -f ./*.tgz)

minify() { # $1 source .mjs $2 destination : fichier minifié (la ligne #! est gardée)
  node -e "const e=require('$ROOT/web/node_modules/esbuild');const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');const b=s.startsWith('#!')?s.slice(0,s.indexOf('\n')+1):'';fs.writeFileSync(process.argv[2],b+e.transformSync(s.slice(b.length),{loader:'js',format:'esm',target:'node22',platform:'node',minify:true,legalComments:'none',charset:'utf8'}).code)" "$1" "$2"
}
assemble() { # $1 dossier du paquet $2 édition (customer|editor)
  local P="$1"; mkdir -p "$P/app" "$P/config" "$P/licence" "$P/documentation" "$P/data"
  node "$ROOT/tools/build-runtime.mjs" "$P/app" "$2" >/dev/null
  rm -f "$P/app/server/.env"* ; cp -r "$D/node_modules" "$P/app/server/node_modules"
  mkdir -p "$P/app/server/tools/keys"; cp "$PUB" "$P/app/server/tools/keys/vendor-public.pem"
  cp "$RT/commun/cortexskills" "$RT/commun/installer-service.sh" "$RT/commun/env.example" "$P/"
  cp "$RT/commun/cortexskills.service" "$RT/commun/nginx-cortexskills.conf" "$P/config/"
  cp "$RT/commun/licence-LISEZMOI.txt" "$P/licence/LISEZMOI.txt"
  printf "Données de CortexSkills (base, pièces jointes, sauvegardes, licence installée). À sauvegarder.\n" > "$P/data/LISEZMOI.txt"
  chmod +x "$P/cortexskills" "$P/installer-service.sh"
}
doc() { for f in $1; do for x in docx pdf; do [ -f "$ROOT/deliverables/$f.$x" ] && cp "$ROOT/deliverables/$f.$x" "$2/documentation/"; done; done; true; }
finish() { # $1 nom du dossier → contrôles, SHA256SUMS, zip, .sha256 (+ parties)
  local P="$TMP/$1"
  # Contrôles : aucune source map, aucun outil de signature ni clé privée dans app/, et chaque fichier JavaScript de
  # l'application (hors dépendances tierces) est déjà minifié : le minifier encore ne le réduit pas de plus de 3 %.
  ! find "$P/app" -name '*.map' -o -name 'sign-licence*' -o -name 'vendor-private*' | grep -q . || { echo "fichier interdit dans $1" >&2; exit 1; }
  node -e "const e=require('$ROOT/web/node_modules/esbuild');const fs=require('fs'),p=require('path');const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.name==='node_modules'?[]:x.isDirectory()?w(p.join(d,x.name)):[p.join(d,x.name)]);const bad=w(process.argv[1]).filter(f=>/\.m?js$/.test(f)).filter(f=>{let s=fs.readFileSync(f,'utf8');if(s.startsWith('#!'))s=s.slice(s.indexOf('\n')+1);if(s.length<1024)return false;const m=e.transformSync(s,{loader:'js',format:'esm',minify:true,legalComments:'inline',charset:'utf8',target:'esnext'}).code;return m.length<s.length*0.97});if(bad.length){console.error('fichiers non minifiés :',bad);process.exit(1)}" "$P/app"
  (cd "$P" && find . -type f ! -name SHA256SUMS.txt | sort | xargs -d '\n' sha256sum > SHA256SUMS.txt)
  (cd "$TMP" && rm -f "$OUT/$1.zip" && zip -q -r -X -y "$OUT/$1.zip" "$1")
  (cd "$OUT" && sha256sum "$1.zip" > "$1.zip.sha256" && rm -f "$1.zip.part"*)
  if [ -n "$PARTS" ]; then (cd "$OUT" && split -b "$PARTS" -d -a 2 "$1.zip" "$1.zip.part" && ls "$1.zip.part"*); fi
  echo "$1.zip : $(du -h "$OUT/$1.zip" | cut -f1)"
}

# --- Client : Linux x64, sans tarif ni information commerciale
CN="Runtime_Customer_Linux_CortexSkills_$VER"; C="$TMP/$CN"
assemble "$C" customer
mkdir -p "$C/runtime"; cp -r "$TMP/node-linux" "$C/runtime/node"
sed "s/@VERSION@/$VER/g; s/@NODE@/$NV/g" "$RT/client/LISEZMOI.txt" > "$C/LISEZMOI.txt"
doc "Guide_Installation_Runtime_Customer_Linux_CortexSkills_FR Guide_Utilisateur_Customer_CortexSkills_FR" "$C"
finish "$CN"

# --- Éditeur : Linux x64 et Windows x64, gestion des licences
EN="Runtime_Editor_Linux_Windows_CortexSkills_$VER"; E="$TMP/$EN"
assemble "$E" editor
cp -r "$WIN/package" "$E/app/server/node_modules/@resvg/resvg-js-win32-x64-msvc"
mkdir -p "$E/runtime" "$E/app/tools"; cp -r "$TMP/node-linux" "$E/runtime/node-linux"; cp -r "$TMP/node-windows" "$E/runtime/node-windows"
minify "$ROOT/tools/licence-manager/cslic.mjs" "$E/app/tools/cslic.mjs"
cp "$RT/editeur/cortexskills.cmd" "$RT/editeur/cslic" "$RT/editeur/cslic.cmd" "$ROOT/tools/licence-manager/cslic-sauvegarder" "$E/"
chmod +x "$E/cslic" "$E/cslic-sauvegarder"
for f in cortexskills.cmd cslic.cmd; do sed -i 's/\r\?$/\r/' "$E/$f"; done   # fins de ligne Windows
sed "s/@VERSION@/$VER/g; s/@NODE@/$NV/g" "$RT/editeur/LISEZMOI.txt" > "$E/LISEZMOI.txt"
sed -i 's|^# CortexSkills — réglages.|# CortexSkills (version éditeur) — réglages.|' "$E/env.example"
if [ -n "$PRIV" ]; then mkdir -p "$E/poste-signature"; cp "$PRIV" "$E/poste-signature/vendor-private.pem"; cp "$PUB" "$E/poste-signature/vendor-public.pem"; chmod 600 "$E/poste-signature/vendor-private.pem"
  printf "Paire de clés de signature des licences (Ed25519).\nInstallez-la UNE fois sur votre poste :  ./cslic importer poste-signature   (Windows : cslic importer poste-signature)\npuis supprimez ce dossier et sauvegardez le poste (Linux : ./cslic-sauvegarder ~/coffre).\nNe copiez jamais vendor-private.pem sur un serveur.\n" > "$E/poste-signature/LISEZMOI.txt"; fi
doc "Guide_Installation_Runtime_Editor_Linux_Windows_CortexSkills_FR" "$E"
finish "$EN"
ls -la "$OUT"
