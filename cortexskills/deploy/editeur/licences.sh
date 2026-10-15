#!/usr/bin/env bash
# Organisations clientes et licences installées sur CETTE installation (la signature se fait avec cslic).
#   ./licences.sh organisation --name "Clinique Exemple" --domain clinique-exemple.ma --admin-email a@clinique-exemple.ma \
#                              --admin-name "Admin" --admin-password 'Str0ng#Passw0rd2026' [--lang fr]
#   ./licences.sh organisations                  liste des organisations
#   ./licences.sh demande <domaine>              affiche l'Organization ID à signer avec cslic
#   ./licences.sh installer <fichier.lic>        installe ou remplace une licence (sans redémarrage)
#   ./licences.sh liste                          licences installées et leur état
#   ./licences.sh detail <domaine>               détail d'une licence installée
#   ./licences.sh retirer <domaine>              retire une licence (les utilisateurs ne peuvent plus se connecter)
set -euo pipefail
cd "$(dirname "$0")"
adm() { docker compose exec -T cortexskills cortexskills-admin "$@"; }
case "${1:-}" in
  organisation) shift; adm org-create "$@" ;;
  organisations) adm org-list ;;
  demande) adm licence-request --org "${2:?domaine}" ;;
  installer) f=${2:?fichier .lic}; [ -f "$f" ] || { echo "Fichier introuvable : $f"; exit 1; }; b=$(basename "$f")
             [ "$(realpath "$f")" = "$(realpath "licence/$b" 2>/dev/null || true)" ] || cp "$f" "licence/$b"; chmod 644 "licence/$b"; adm licence-install --file "/licence/$b" ;;
  liste) adm licence-list ;;
  detail) adm licence-show --org "${2:?domaine}" ;;
  retirer) adm licence-remove --org "${2:?domaine}" --yes ;;
  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
