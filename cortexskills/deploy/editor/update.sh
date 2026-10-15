#!/usr/bin/env bash
# Updates to the release of this folder. Unzip the new release next to the current one, then run, in the NEW folder:
#   ./update.sh /opt/cortexskills/<current folder>
# It takes a backup, copies .env, licence/ and vendor-public.pem from the current folder, loads or builds the new image
# and restarts on the same data volume (the database is migrated at start-up).
set -euo pipefail
cd "$(dirname "$0")"
OLD=${1:?Usage: ./update.sh <folder of the current installation>}; VER=$(cat VERSION)
[ -f "$OLD/.env" ] || { echo "No .env in $OLD"; exit 1; }
(cd "$OLD" && ./backup.sh)
cp -p "$OLD/.env" .env; mkdir -p licence; cp -p "$OLD"/licence/*.lic licence/ 2>/dev/null || true
[ -f vendor-public.pem ] || cp -p "$OLD/vendor-public.pem" .
sed -i "s|^CORTEXSKILLS_VERSION=.*|CORTEXSKILLS_VERSION=$VER|" .env
(cd "$OLD" && docker compose stop)
./install.sh
echo "Updated to $VER. To go back: cd $OLD && docker compose up -d (and restore the backup if the database was migrated)."
