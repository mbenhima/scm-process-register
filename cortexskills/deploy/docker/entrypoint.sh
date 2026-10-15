#!/bin/sh
# Starts CortexSkills. On the very first start (empty data volume) it creates the production database: reference
# catalog, templates and one platform administrator (ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD).
set -eu
cd /app/server
if ! node --no-warnings --input-type=module -e "const d = await import('./src/db.js'); d.migrate(); process.exit(d.isSeeded() ? 0 : 3)"; then
  if [ -z "${ADMIN_EMAIL:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ]; then
    echo "First start: set ADMIN_EMAIL and ADMIN_PASSWORD in the .env file to create the platform administrator." >&2
    exit 1
  fi
  echo "First start: creating the production database in ${DATA_DIR}..."
  node --no-warnings seed/seed.js --production
  echo "Database created. Next: remove ADMIN_PASSWORD from .env, then create your organization:"
  echo "  docker compose exec cortexskills cortexskills-admin org-create --name \"Your Company\" --domain yourcompany.com ..."
fi
exec node --no-warnings src/index.js
