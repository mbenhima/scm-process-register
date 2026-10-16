#!/usr/bin/env bash
# Sauvegarde complète des données DynamicMS (base, fichiers joints, licence, sauvegardes internes)
# dans ./sauvegardes/dynamicms-editor-data-AAAAMMJJ-HHMMSS.tar.gz. L'application est arrêtée pendant la
# copie (quelques secondes) pour garantir une sauvegarde cohérente.
#   sudo ./backup.sh
set -euo pipefail
cd "$(dirname "$0")"
IMAGE=$(docker compose config --images | head -1)
mkdir -p sauvegardes
FILE="dynamicms-editor-data-$(date +%Y%m%d-%H%M%S).tar.gz"
docker compose stop dynamicms
trap 'docker compose start dynamicms >/dev/null' EXIT
docker run --rm --user 0 --entrypoint tar -v dynamicms-editor-data:/data:ro -v "$PWD/sauvegardes:/out" "$IMAGE" czf "/out/$FILE" -C /data .
echo "Sauvegarde écrite : sauvegardes/$FILE"
