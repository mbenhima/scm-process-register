#!/bin/sh
# Démarre CortexSkills ; au tout premier démarrage (volume vide) crée la base de production et l'administrateur.
set -eu
cd /app/server
if ! node --no-warnings --input-type=module -e "const d = await import('./src/db.js'); d.migrate(); process.exit(d.isSeeded() ? 0 : 3)"; then
  if [ -z "${ADMIN_EMAIL:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ]; then
    echo "Premier démarrage : renseignez ADMIN_EMAIL et ADMIN_PASSWORD dans le fichier .env." >&2; exit 1
  fi
  echo "Premier démarrage : création de la base de production dans ${DATA_DIR}..."
  node --no-warnings seed/seed.js --production
  echo "Base créée. Effacez ADMIN_PASSWORD du fichier .env, puis créez votre organisation (voir le Guide d’installation)."
fi
exec node --no-warnings src/index.js
