#!/bin/bash
# Construit les livrables Docker (Linux) sans code dans les paquets :
#   deliverables/docker/Docker_Runtime_Customer_Linux_CortexSkills_<v>.zip        image client (sans tarif) + compose + HTTPS
#   deliverables/docker/Docker_Runtime_Editor_Linux_Windows_CortexSkills_<v>.zip  image éditeur + scripts (cloud privé / sur site
#     Linux, local Windows) + gestion des licences
# Les images contiennent l'exécutable (serveur minifié, interface compilée) et la clé publique de l'éditeur ; les paquets
# ne contiennent que des archives d'images, des fichiers de configuration et des scripts.
# Usage : tools/package-docker.sh --cle-publique <vendor-public.pem> [--cle-privee <vendor-private.pem>] [--parties 24m]
#   --cle-privee : la place dans le dossier poste-signature/ du paquet éditeur (à importer avec cslic importer).
# Variables : BASE_IMAGE (défaut node:22-alpine), CADDY_IMAGE (défaut caddy:2), BUILD_CA (certificat d'un proxy),
#             DOCKER_BUILD_OPTS (ex. --network host --build-arg HTTPS_PROXY=...).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/deliverables/docker"; mkdir -p "$OUT"
PUB=""; PRIV=""; PARTS=""
while [ $# -gt 0 ]; do case "$1" in --cle-publique) PUB=$2; shift 2;; --cle-privee) PRIV=$2; shift 2;; --parties) PARTS=$2; shift 2;; *) echo "option inconnue $1" >&2; exit 1;; esac; done
[ -f "$PUB" ] && grep -q "BEGIN PUBLIC KEY" "$PUB" || { echo "--cle-publique <vendor-public.pem> obligatoire" >&2; exit 1; }
VER=$(node -p "require('$ROOT/server/package.json').version")
BASE=${BASE_IMAGE:-node:22-alpine}; CADDY=${CADDY_IMAGE:-caddy:2}
TMP=$(mktemp -d); trap 'rm -rf -- "${TMP:?}"' EXIT
(cd "$ROOT/web" && npm run build >/dev/null 2>&1)
docker image inspect "$CADDY" >/dev/null 2>&1 || docker pull "$CADDY"
[ "$CADDY" = "caddy:2" ] || docker tag "$CADDY" caddy:2

build() { # $1 edition (client|editeur) $2 runtime edition (customer|editor) $3 commercial $4 Customer|Editor
  local C="$TMP/ctx-$1"; mkdir -p "$C/extra" "$C/build-ca"
  node "$ROOT/tools/build-runtime.mjs" "$C/runtime" "$2" >/dev/null
  cp "$ROOT/tools/docker/Dockerfile.image" "$ROOT/tools/docker/entrypoint.sh" "$ROOT/tools/docker/cortexskills-admin" "$C/"; cp "$PUB" "$C/vendor-public.pem"
  [ -z "${BUILD_CA:-}" ] || cp "$BUILD_CA" "$C/build-ca/proxy.crt"
  if [ "$1" = editeur ]; then node -e "const e=require('$ROOT/web/node_modules/esbuild');const fs=require('fs');const s=fs.readFileSync('$ROOT/tools/licence-manager/cslic.mjs','utf8');const b=s.slice(0,s.indexOf('\n')+1);fs.writeFileSync('$C/extra/cslic.mjs',b+e.transformSync(s.slice(b.length),{loader:'js',format:'esm',target:'node22',minify:true,legalComments:'none',charset:'utf8'}).code)"; fi
  docker build ${DOCKER_BUILD_OPTS:-} -f "$C/Dockerfile.image" --build-arg BASE_IMAGE="$BASE" --build-arg EDITION="$1" --build-arg COMMERCIAL="$3" -t "cortexskills-$1:$VER" "$C" >/dev/null
  docker save "cortexskills-$1:$VER" caddy:2 | gzip -9 > "$TMP/Docker_Image_Runtime_$4_CortexSkills_$VER.tar.gz"
  echo "image cortexskills-$1:$VER : $(du -h "$TMP/Docker_Image_Runtime_$4_CortexSkills_$VER.tar.gz" | cut -f1)"
}
build client customer hidden Customer
build editeur editor shown Editor

finish() { # $1 folder name → zip + .sha256 (+ parts)
  (cd "$TMP" && rm -f "$OUT/$1.zip" && zip -q -r -X "$OUT/$1.zip" "$1")
  (cd "$OUT" && sha256sum "$1.zip" > "$1.zip.sha256" && rm -f "$1.zip.part"*)
  if [ -n "$PARTS" ]; then (cd "$OUT" && split -b "$PARTS" -d -a 2 "$1.zip" "$1.zip.part" && ls "$1.zip.part"*); fi
}
# --- client
CL="$TMP/Docker_Runtime_Customer_Linux_CortexSkills_$VER"; mkdir -p "$CL"
cp -r "$ROOT/deploy/client/." "$CL/"; mv "$TMP/Docker_Image_Runtime_Customer_CortexSkills_$VER.tar.gz" "$CL/"
for f in docker-compose.yml LISEZMOI.txt; do sed -i "s/@VERSION@/$VER/g" "$CL/$f"; done
# Guides livrés dans le paquet (Word et PDF), s'ils sont construits.
doc() { mkdir -p "$2/documentation"; for f in $1; do for x in docx pdf; do [ -f "$ROOT/deliverables/$f.$x" ] && cp "$ROOT/deliverables/$f.$x" "$2/documentation/"; done; done; true; }
doc "Guide_Installation_Docker_Runtime_Customer_Linux_CortexSkills_FR Guide_Utilisateur_Customer_CortexSkills_FR" "$CL"
(cd "$CL" && find . -type f ! -name SHA256SUMS.txt | sort | xargs sha256sum > SHA256SUMS.txt)
finish "Docker_Runtime_Customer_Linux_CortexSkills_$VER"
# --- éditeur
ED="$TMP/Docker_Runtime_Editor_Linux_Windows_CortexSkills_$VER"; A="$ED/application"; G="$ED/gestion-licences"; mkdir -p "$A/licence" "$A/certs" "$G"
cp "$ROOT/deploy/client/Caddyfile" "$ROOT/deploy/client/env.example" "$A/"; cp "$ROOT/deploy/client/licence/LISEZMOI.txt" "$A/licence/"; cp "$ROOT/deploy/client/certs/LISEZMOI.txt" "$A/certs/"
cp "$ROOT/deploy/editeur/docker-compose.yml" "$ROOT"/deploy/editeur/*.sh "$A/"; sed -i "s/@VERSION@/$VER/g" "$A/docker-compose.yml"; echo "$VER" > "$A/VERSION"
sed -i 's|^# CortexSkills — réglages.|# CortexSkills (version éditeur) — réglages. installer.sh crée .env à partir de ce fichier.|' "$A/env.example"
mv "$TMP/Docker_Image_Runtime_Editor_CortexSkills_$VER.tar.gz" "$A/"
cp "$ROOT/tools/licence-manager/cslic" "$ROOT/tools/licence-manager/cslic-sauvegarder" "$G/"
sed "s/@VERSION@/$VER/g" "$ROOT/deploy/editeur/LISEZMOI.txt" > "$ED/LISEZMOI.txt"
if [ -n "$PRIV" ]; then mkdir -p "$ED/poste-signature"; cp "$PRIV" "$ED/poste-signature/vendor-private.pem"; cp "$PUB" "$ED/poste-signature/vendor-public.pem"; chmod 600 "$ED/poste-signature/vendor-private.pem"
  printf "Paire de clés de signature des licences (Ed25519).\nInstallez-la UNE fois sur votre poste :  ./gestion-licences/cslic importer poste-signature\npuis supprimez ce dossier et sauvegardez le poste :  ./gestion-licences/cslic-sauvegarder ~/coffre\nNe copiez jamais vendor-private.pem sur un serveur.\n" > "$ED/poste-signature/LISEZMOI.txt"; fi
chmod +x "$A"/*.sh "$G"/*
doc "Guide_Installation_Docker_Runtime_Editor_Linux_Windows_CortexSkills_FR" "$ED"
(cd "$A" && find . -type f ! -name SHA256SUMS.txt | sort | xargs sha256sum > SHA256SUMS.txt)
finish "Docker_Runtime_Editor_Linux_Windows_CortexSkills_$VER"
! (cd "$TMP" && find . -name '*.js' -o -name '*.mjs' | grep -v '^./ctx-' | grep -q .) || { echo "du code est présent dans un paquet" >&2; exit 1; }
ls -la "$OUT"
