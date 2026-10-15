#!/usr/bin/env bash
# Sauvegarde copiée hors du conteneur (base, pièces jointes, licences) dans DOSSIER/<date>, conservée JOURS jours ;
# avec DISTANT=utilisateur@hote:/chemin, copie aussi vers une autre machine (rsync sur SSH).
# Chaque nuit à 2 h 30 :  crontab -e  →  30 2 * * * /opt/cortexskills/actuel/sauvegarder.sh >> $HOME/cortexskills-sauvegarde.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"
DOSSIER=${DOSSIER:-/opt/cortexskills-sauvegardes}; JOURS=${JOURS:-30}; D="$DOSSIER/$(date +%F_%H%M)"
mkdir -p "$D"
docker compose exec -T cortexskills cortexskills-admin backup
docker compose cp cortexskills:/data/backups "$D/backups" >/dev/null 2>&1
docker compose cp cortexskills:/data/attachments "$D/attachments" >/dev/null 2>&1
docker compose cp cortexskills:/data/license.lic "$D/license.lic" >/dev/null 2>&1 || true
find "$DOSSIER" -mindepth 1 -maxdepth 1 -type d -mtime +"$JOURS" -exec rm -r -- {} +
[ -z "${DISTANT:-}" ] || rsync -a "$D" "$DISTANT/"
echo "$(date '+%F %T') sauvegarde écrite dans $D"
