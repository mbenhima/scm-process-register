#!/usr/bin/env bash
# Passe à la version de CE dossier. Décompressez la nouvelle version à côté de l'actuelle, puis, dans le NOUVEAU dossier :
#   ./mettre-a-jour.sh /opt/cortexskills/actuel
# Sauvegarde, reprend .env, licence/, certs/ et vendor-public.pem, construit la nouvelle image et redémarre sur les mêmes données.
set -euo pipefail
cd "$(dirname "$0")"
ANCIEN=${1:?Usage : ./mettre-a-jour.sh <dossier de l'installation actuelle>}; VER=$(cat VERSION)
[ -f "$ANCIEN/.env" ] || { echo "Pas de .env dans $ANCIEN"; exit 1; }
(cd "$ANCIEN" && ./sauvegarder.sh)
cp -p "$ANCIEN/.env" .env; cp -p "$ANCIEN"/licence/*.lic licence/ 2>/dev/null || true; cp -p "$ANCIEN"/certs/*.pem certs/ 2>/dev/null || true
[ -f vendor-public.pem ] || cp -p "$ANCIEN/vendor-public.pem" .
(cd "$ANCIEN" && docker compose stop)
MODE=local; grep -q '^COMPOSE_PROFILES=https' .env && MODE=serveur
./installer.sh "$MODE" "$(grep '^DOMAIN=' .env | cut -d= -f2-)" "$(grep '^TLS_MODE=' .env | cut -d= -f2-)"
echo "Version $VER installée. Retour arrière : cd $ANCIEN && docker compose up -d (et restaurer la sauvegarde si la base a été migrée)."
