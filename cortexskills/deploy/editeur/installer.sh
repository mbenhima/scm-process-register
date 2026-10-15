#!/usr/bin/env bash
# Installe et démarre CortexSkills (version éditeur) avec Docker.
#   ./installer.sh local                                  scénario 1 : ce poste, http://localhost:4000
#   ./installer.sh serveur competences.mondomaine.ma [auto|internal|files]   scénario 2 : cloud privé / sur site, HTTPS
# Sans questions : ADMIN_EMAIL=... ADMIN_PASSWORD='...' ./installer.sh ...
set -euo pipefail
cd "$(dirname "$0")"
VER=$(cat VERSION)
dire() { printf '\n  %s\n' "$*"; }
echec() { printf '\n  ERREUR : %s\n\n' "$*" >&2; exit 1; }
MODE=${1:-}; DOMAINE=${2:-}; TLS=${3:-auto}
case "$MODE" in local) ;; serveur) [ -n "$DOMAINE" ] || echec "Usage : ./installer.sh serveur <nom DNS> [auto|internal|files]";; *) sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//'; exit 1;; esac
case "$TLS" in auto|internal|files) ;; *) echec "Mode de certificat inconnu : $TLS (auto, internal ou files).";; esac

command -v docker >/dev/null || echec "Docker n'est pas installé : curl -fsSL https://get.docker.com | sudo sh"
docker compose version >/dev/null 2>&1 || echec "Le plugin docker compose manque (paquet docker-compose-plugin)."
[ ! -e vendor-private.pem ] || echec "vendor-private.pem ne doit jamais être ici. Il reste sur le poste de signature (~/.cortexskills-editeur)."
[ "$TLS" != "files" ] || { [ -f certs/cert.pem ] && [ -f certs/key.pem ]; } || echec "Mode files : copiez certs/cert.pem et certs/key.pem."
ARCHIVE="cortexskills-editeur-docker-image-$VER.tar.gz"
if ! docker image inspect "cortexskills-editeur:$VER" >/dev/null 2>&1; then
  [ -f "$ARCHIVE" ] || echec "Archive de l'image introuvable : $ARCHIVE"
  dire "Chargement de l'image (1 à 2 minutes)..."; docker load -i "$ARCHIVE" >/dev/null
fi

if [ ! -f .env ]; then
  ADMIN_EMAIL=${ADMIN_EMAIL:-}; ADMIN_NAME=${ADMIN_NAME:-Administrateur plateforme}; ADMIN_PASSWORD=${ADMIN_PASSWORD:-}
  [ -n "$ADMIN_EMAIL" ] || read -rp "  E-mail de l'administrateur de la plateforme : " ADMIN_EMAIL
  [ -n "$ADMIN_PASSWORD" ] || { read -rsp "  Mot de passe (12 caractères min., majuscule, minuscule, chiffre, symbole) : " ADMIN_PASSWORD; echo; }
  if [ "$MODE" = local ]; then URL="http://localhost:4000"; PROF=""; DOMAINE="localhost"; else URL="https://$DOMAINE"; PROF="https"; fi
  secret() { head -c 48 /dev/urandom | base64 | tr -d '\n=+/'; }
  esc() { printf '%s' "$1" | sed -e 's/[&|\\]/\\&/g'; }
  sed -e "s|^PUBLIC_URL=.*|PUBLIC_URL=$(esc "$URL")|" -e "s|^CORS_ORIGIN=.*|CORS_ORIGIN=$(esc "$URL")|" -e "s|^DOMAIN=.*|DOMAIN=$(esc "$DOMAINE")|" \
      -e "s|^TLS_MODE=.*|TLS_MODE=$TLS|" -e "s|^COMPOSE_PROFILES=.*|COMPOSE_PROFILES=$PROF|" -e "s|^JWT_SECRET=.*|JWT_SECRET=$(secret)|" \
      -e "s|^CHANNEL_SECRET_KEY=.*|CHANNEL_SECRET_KEY=$(secret)|" -e "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=$(esc "$ADMIN_EMAIL")|" \
      -e "s|^ADMIN_NAME=.*|ADMIN_NAME=$(esc "$ADMIN_NAME")|" -e "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$(esc "$ADMIN_PASSWORD")|" env.example > .env
  chmod 600 .env; dire "Réglages écrits dans .env (secrets générés). Gardez-en une copie dans votre coffre de mots de passe."
fi

sain() { sleep 2; for i in $(seq 1 60); do [ "$(docker inspect -f '{{.State.Health.Status}}' cortexskills 2>/dev/null || true)" = healthy ] && return 0; sleep 3; done; docker compose logs --tail 40 cortexskills; echec "CortexSkills n'a pas démarré correctement (journal ci-dessus)."; }
dire "Démarrage..."; docker compose up -d; sain
if grep -q '^ADMIN_PASSWORD=.\+' .env; then sed -i 's|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=|' .env; docker compose up -d >/dev/null 2>&1; sain; dire "ADMIN_PASSWORD effacé de .env (l'administrateur existe)."; fi
dire "CortexSkills $VER fonctionne : $(grep '^PUBLIC_URL=' .env | cut -d= -f2-)"
dire "Suite : ./licences.sh organisation ... puis ./licences.sh demande <domaine> (Guide d'installation éditeur, chapitre 6)."
