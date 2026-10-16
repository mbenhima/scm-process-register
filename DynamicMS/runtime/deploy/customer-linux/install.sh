#!/usr/bin/env bash
# Installation de DynamicMS 2026.10 (runtime client, Linux).
#   sudo ./install.sh [chemin/vers/Docker_Runtime_Customer_Linux_DynamicMS_2026.10_Image.tar.gz]
# Étapes : contrôle de Docker, vérification de l'empreinte SHA-256 de l'image, chargement de
# l'image, création du fichier .env, démarrage, attente de l'application.
set -euo pipefail
cd "$(dirname "$0")"
IMAGE_TAR="${1:-../Docker_Runtime_Customer_Linux_DynamicMS_2026.10_Image.tar.gz}"
IMAGE=dynamicms-customer:2026.10
say() { printf '\n== %s\n' "$*"; }
fail() { printf 'ERREUR : %s\n' "$*" >&2; exit 1; }
strong() { [[ ${#1} -ge 12 && "$1" =~ [A-Z] && "$1" =~ [a-z] && "$1" =~ [0-9] ]]; }
envget() { grep -m1 "^$1=" .env | cut -d= -f2- || true; }
envset() { local v="${2//\\/\\\\}"; v="${v//|/\\|}"; v="${v//&/\\&}"; sed -i "s|^$1=.*|$1=$v|" .env; }

say "Contrôle de Docker"
command -v docker >/dev/null || fail "Docker n'est pas installé (voir le guide, chapitre Prérequis)."
docker info >/dev/null 2>&1 || fail "Le service Docker ne répond pas (sudo systemctl start docker)."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 est requis (paquet docker-compose-plugin)."

if docker image inspect "$IMAGE" >/dev/null 2>&1; then
  say "Image $IMAGE déjà chargée"
else
  [[ -f "$IMAGE_TAR" ]] || fail "Archive de l'image introuvable : $IMAGE_TAR"
  if [[ -f "$IMAGE_TAR.sha256" ]]; then
    say "Vérification de l'empreinte SHA-256"
    ( cd "$(dirname "$IMAGE_TAR")" && sha256sum -c "$(basename "$IMAGE_TAR").sha256" ) || fail "Empreinte incorrecte : archive incomplète ou modifiée."
  fi
  say "Chargement de l'image (1 à 2 minutes)"
  docker load -i "$IMAGE_TAR"
fi

if [[ ! -f .env ]]; then
  say "Création du fichier .env"
  cp .env.example .env
  chmod 600 .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|" .env
fi
ADMIN_EMAIL=$(envget ADMIN_EMAIL); ADMIN_PASSWORD=$(envget ADMIN_PASSWORD); SEED_PASSWORD=$(envget SEED_PASSWORD); INIT_DATA=$(envget INIT_DATA); HTTP_PORT=$(envget HTTP_PORT)
if [[ -z "${ADMIN_EMAIL:-}" ]]; then read -rp "E-mail de l'administrateur de la plateforme : " ADMIN_EMAIL; envset ADMIN_EMAIL "$ADMIN_EMAIL"; fi
while ! strong "${ADMIN_PASSWORD:-}"; do read -rsp "Mot de passe provisoire de l'administrateur (12 car., maj., min., chiffre) : " ADMIN_PASSWORD; echo; done
envset ADMIN_PASSWORD "$ADMIN_PASSWORD"
if [[ "${INIT_DATA:-demo}" == "demo" ]]; then
  while ! strong "${SEED_PASSWORD:-}"; do read -rsp "Mot de passe initial des comptes initialisés (12 car., maj., min., chiffre) : " SEED_PASSWORD; echo; done
  envset SEED_PASSWORD "$SEED_PASSWORD"
fi

say "Démarrage"
docker compose up -d
say "Attente de l'application (le premier démarrage initialise les données : environ 1 minute)"
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${HTTP_PORT:-4000}/api/health" >/dev/null 2>&1; then
    say "DynamicMS est démarré : http://127.0.0.1:${HTTP_PORT:-4000} (publier via le proxy HTTPS : nginx/dynamicms.conf)"
    echo "Étape suivante : se connecter avec $ADMIN_EMAIL, changer le mot de passe, puis installer la licence"
    echo "(Administration > Exploitation > Licence > Installer un fichier de licence)."
    exit 0
  fi
  sleep 5
done
fail "L'application ne répond pas après 5 minutes : docker logs dynamicms"
