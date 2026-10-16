#!/usr/bin/env bash
# Restauration d'une sauvegarde produite par backup.sh. Remplace TOUTES les données actuelles.
#   sudo ./restore.sh sauvegardes/dynamicms-data-AAAAMMJJ-HHMMSS.tar.gz
set -euo pipefail
cd "$(dirname "$0")"
ARCHIVE="${1:-}"; [[ -n "$ARCHIVE" ]] || { echo "Usage : sudo ./restore.sh sauvegardes/<archive>.tar.gz" >&2; exit 1; }
[[ -f "$ARCHIVE" ]] || { echo "Archive introuvable : $ARCHIVE" >&2; exit 1; }
read -rp "Toutes les données actuelles seront remplacées. Taper RESTAURER pour confirmer : " OK
[[ "$OK" == "RESTAURER" ]] || { echo "Abandon."; exit 1; }
IMAGE=$(docker compose config --images | head -1)
docker compose stop dynamicms
docker run --rm --user 0 --entrypoint sh -v dynamicms-data:/data -v "$(cd "$(dirname "$ARCHIVE")" && pwd):/in:ro" "$IMAGE" \
  -c "find /data -mindepth 1 -delete && tar xzf /in/$(basename "$ARCHIVE") -C /data && chown -R node:node /data"
docker compose start dynamicms
echo "Restauration terminée."
