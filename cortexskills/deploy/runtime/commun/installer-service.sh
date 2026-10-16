#!/bin/sh
# Installe CortexSkills comme service Linux (systemd) : utilisateur système « cortexskills », droits des dossiers,
# service démarré au boot. À lancer en root depuis le dossier du paquet, une fois .env rempli :  sudo ./installer-service.sh
set -eu
DIR=$(cd "$(dirname "$0")" && pwd)
[ "$(id -u)" = 0 ] || { echo "  ERREUR : lancez ce script avec sudo." >&2; exit 1; }
NODE=${CORTEXSKILLS_NODE:-$(command -v node || true)}
[ -n "$NODE" ] && "$NODE" -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)" || { echo "  ERROR / ERREUR : Node.js 22.13 or newer is required / est nécessaire (see the installation guide / voir le guide d’installation)." >&2; exit 1; }
[ -f "$DIR/.env" ] || { echo "  ERREUR : créez d'abord $DIR/.env (cp env.example .env) et remplissez-le." >&2; exit 1; }
id cortexskills >/dev/null 2>&1 || useradd --system --home-dir "$DIR" --shell /usr/sbin/nologin cortexskills
mkdir -p "$DIR/data"
# Application en lecture seule pour le service (Node.js : $NODE) ; seuls data/ et .env lui appartiennent.
chown -R root:root "$DIR/app"; chmod -R a-w "$DIR/app"
chown -R cortexskills:cortexskills "$DIR/data"; chmod 700 "$DIR/data"
chown root:cortexskills "$DIR/.env"; chmod 640 "$DIR/.env"
sed "s|@DIR@|$DIR|g; s|@NODE@|$NODE|g" "$DIR/config/cortexskills.service" > /etc/systemd/system/cortexskills.service
systemctl daemon-reload
systemctl enable --now cortexskills
echo
echo "  Service installé et démarré. Suivi :  journalctl -u cortexskills -f"
echo "  (premier démarrage : 5 à 15 minutes, jusqu'à « CortexSkills API is running »)"
echo "  Console :  sudo -u cortexskills $DIR/cortexskills admin help"
echo
