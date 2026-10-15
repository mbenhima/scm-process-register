#!/usr/bin/env bash
# Installs and starts CortexSkills on this Linux machine with Docker (editor runtime).
#   ./install.sh                         asks for the domain and the platform administrator
#   DOMAIN=skills.example.com ADMIN_EMAIL=ops@example.com ADMIN_PASSWORD='...' ./install.sh    (no questions)
#   DOMAIN=localhost ...                 laptop: http://localhost:4000, no HTTPS front end
set -euo pipefail
cd "$(dirname "$0")"
VER=$(cat VERSION)
say() { printf '\n  %s\n' "$*"; }
fail() { printf '\n  ERROR: %s\n\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || fail "Docker is not installed. Install it with: curl -fsSL https://get.docker.com | sudo sh"
docker compose version >/dev/null 2>&1 || fail "The Docker compose plugin is missing (package docker-compose-plugin)."
[ ! -e vendor-private.pem ] || fail "vendor-private.pem must never be on this machine. Move it back to your signing workspace."
[ -f vendor-public.pem ] || fail "Copy your vendor-public.pem (signing workspace: server/tools/keys/vendor-public.pem) next to this script."
grep -q "BEGIN PUBLIC KEY" vendor-public.pem || fail "vendor-public.pem is not a public key."

if [ ! -f .env ]; then
  DOMAIN=${DOMAIN:-}; ADMIN_EMAIL=${ADMIN_EMAIL:-}; ADMIN_NAME=${ADMIN_NAME:-Platform Administrator}; ADMIN_PASSWORD=${ADMIN_PASSWORD:-}
  [ -n "$DOMAIN" ] || read -rp "  Domain name (skills.yourdomain.com, or localhost on a laptop): " DOMAIN
  [ -n "$ADMIN_EMAIL" ] || read -rp "  Platform administrator e-mail: " ADMIN_EMAIL
  [ -n "$ADMIN_PASSWORD" ] || { read -rsp "  Administrator password (12+ characters, upper and lower case, digit, symbol): " ADMIN_PASSWORD; echo; }
  if [ "$DOMAIN" = "localhost" ]; then URL="http://localhost:4000"; PROFILES=""; else URL="https://$DOMAIN"; PROFILES="https"; fi
  secret() { head -c 48 /dev/urandom | base64 | tr -d '\n=+/'; }
  esc() { printf '%s' "$1" | sed -e 's/[&|\\]/\\&/g'; }
  sed -e "s|@VERSION@|$VER|" -e "s|@DOMAIN@|$(esc "$DOMAIN")|" -e "s|@PUBLIC_URL@|$(esc "$URL")|g" -e "s|@PROFILES@|$PROFILES|" \
      -e "s|@JWT@|$(secret)|" -e "s|@CHANNEL@|$(secret)|" -e "s|@ADMIN_EMAIL@|$(esc "$ADMIN_EMAIL")|" \
      -e "s|@ADMIN_NAME@|$(esc "$ADMIN_NAME")|" -e "s|@ADMIN_PASSWORD@|$(esc "$ADMIN_PASSWORD")|" env.example > .env
  chmod 600 .env
  say "Settings written to .env (secrets generated). Keep a copy of it in your password vault."
fi
grep -q "^CORTEXSKILLS_VERSION=$VER$" .env || sed -i "s|^CORTEXSKILLS_VERSION=.*|CORTEXSKILLS_VERSION=$VER|" .env

if ! docker image inspect "cortexskills:$VER" >/dev/null 2>&1; then
  if [ -f "cortexskills-image-$VER.tar.gz" ]; then say "Loading the image cortexskills:$VER..."; docker load -i "cortexskills-image-$VER.tar.gz"
  else say "Building the image cortexskills:$VER (2 to 5 minutes)..."; docker build ${BUILD_ARGS:-} -t "cortexskills:$VER" .; fi
fi

healthy() {
  sleep 2
  for i in $(seq 1 60); do
    st=$(docker inspect -f '{{.State.Health.Status}}' cortexskills 2>/dev/null || echo starting)
    [ "$st" = "healthy" ] && return 0
    sleep 3
  done
  docker compose logs --tail 40 cortexskills; fail "CortexSkills did not become healthy. Read the log above."
}
say "Starting CortexSkills..."
docker compose up -d
healthy
# The database exists: the administrator password is not needed any more (the container is recreated without it).
if grep -q '^ADMIN_PASSWORD=.\+' .env; then
  sed -i 's|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=|' .env; say "ADMIN_PASSWORD removed from .env (the administrator exists)."
  docker compose up -d >/dev/null 2>&1; healthy
fi
URL=$(grep '^PUBLIC_URL=' .env | cut -d= -f2-)
say "CortexSkills $VER is running: $URL"
say "Next: ./licence.sh create-org ... then ./licence.sh request <domain> (see README.txt)."
