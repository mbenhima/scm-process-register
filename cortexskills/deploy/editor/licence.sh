#!/usr/bin/env bash
# Customer organizations and their licences on this installation.
#   ./licence.sh create-org --name "Clinique Exemple" --domain clinique-exemple.ma --admin-email a@clinique-exemple.ma \
#                           --admin-name "Admin" --admin-password 'Str0ng#Passw0rd2026' [--lang fr]
#   ./licence.sh list
#   ./licence.sh request <customer domain>      prints the Organization ID to sign on your laptop
#   ./licence.sh install <file.lic>             installs a licence signed on your laptop (no restart)
set -euo pipefail
cd "$(dirname "$0")"
adm() { docker compose exec -T cortexskills cortexskills-admin "$@"; }
case "${1:-}" in
  create-org) shift; adm org-create "$@" ;;
  list) adm org-list ;;
  request) [ -n "${2:-}" ] || { echo "Usage: ./licence.sh request <customer domain>"; exit 1; }; adm licence-request --org "$2" ;;
  install)
    f=${2:-}; [ -f "$f" ] || { echo "Usage: ./licence.sh install <file.lic>"; exit 1; }
    mkdir -p licence; base=$(basename "$f"); [ "$(realpath "$f")" = "$(realpath "licence/$base" 2>/dev/null || true)" ] || cp "$f" "licence/$base"
    adm licence-install --file "/licence/$base" ;;
  *) sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
