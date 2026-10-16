#!/bin/sh
# Démarre CortexSkills ; au tout premier démarrage (volume vide) crée la base de production, l'administrateur et les
# organisations de référence de toutes les verticales et des PME (REFERENCE_DATA=non pour une base vide).
set -eu
cd /app/server
if ! node --no-warnings --input-type=module -e "const d = await import('./src/db.js'); d.migrate(); process.exit(d.isSeeded() ? 0 : 3)"; then
  if [ -z "${ADMIN_EMAIL:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ]; then
    echo "Premier démarrage : renseignez ADMIN_EMAIL et ADMIN_PASSWORD dans le fichier .env." >&2; exit 1
  fi
  if [ "${REFERENCE_DATA:-oui}" = "non" ]; then
    echo "Premier démarrage : création de la base de production dans ${DATA_DIR}..."
    node --no-warnings seed/seed.js --production
  else
    echo "Premier démarrage : création de la base de production avec les données de référence (toutes les verticales et les PME) dans ${DATA_DIR}."
    echo "Cette étape dure de 5 à 15 minutes selon le serveur ; ne l'interrompez pas."
    node --no-warnings seed/seed.js --production --reference-data
  fi
  echo "Base créée. Effacez ADMIN_PASSWORD du fichier .env, puis créez votre organisation (voir le Guide d’installation)."
fi
exec node --no-warnings src/index.js
