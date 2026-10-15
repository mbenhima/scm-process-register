#!/usr/bin/env bash
# Backup copied out of the container: database backups and attached files, in BACKUP_DIR/<date>, kept KEEP_DAYS days;
# with OFFSITE=user@host:/path the folder is also sent to another machine (rsync over SSH).
# Every night at 02:30:   crontab -e   →   30 2 * * * /opt/cortexskills/current/backup.sh >> /var/log/cortexskills-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"
BACKUP_DIR=${BACKUP_DIR:-/opt/cortexskills-backups}; KEEP_DAYS=${KEEP_DAYS:-30}; D="$BACKUP_DIR/$(date +%F_%H%M)"
mkdir -p "$D"
docker compose exec -T cortexskills cortexskills-admin backup
docker compose cp cortexskills:/data/backups "$D/backups" >/dev/null
docker compose cp cortexskills:/data/attachments "$D/attachments" >/dev/null
docker compose cp cortexskills:/data/license.lic "$D/license.lic" >/dev/null 2>&1 || true
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP_DAYS" -exec rm -r -- {} +
[ -z "${OFFSITE:-}" ] || rsync -a "$D" "$OFFSITE/"
echo "$(date '+%F %T') backup written to $D"
