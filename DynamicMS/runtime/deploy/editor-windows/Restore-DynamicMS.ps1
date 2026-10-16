#Requires -Version 5.1
# Restaure une sauvegarde de Backup-DynamicMS.ps1. Remplace TOUTES les données actuelles.
#   .\Restore-DynamicMS.ps1 -Archive .\sauvegardes\dynamicms-editor-data-AAAAMMJJ-HHMMSS.tar.gz
param([Parameter(Mandatory = $true)][string]$Archive)
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot
function Say([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Fail([string]$m) { Write-Host "ERREUR : $m" -ForegroundColor Red; exit 1 }
$Image = 'dynamicms-editor:2026.10'
$Volume = 'dynamicms-editor-data'
if (-not (Test-Path $Archive)) { Fail "Archive introuvable : $Archive" }
$ok = Read-Host -Prompt 'Toutes les données actuelles seront remplacées. Tapez RESTAURER pour confirmer'
if ($ok -ne 'RESTAURER') { Write-Host 'Abandon.'; exit 1 }
$dir = (Resolve-Path (Split-Path $Archive -Parent)).Path
$name = Split-Path $Archive -Leaf
docker compose stop
docker run --rm --user 0 --entrypoint sh -v "${Volume}:/data" -v "${dir}:/in:ro" $Image -c "find /data -mindepth 1 -delete && tar xzf /in/$name -C /data && chown -R node:node /data"
if ($LASTEXITCODE -ne 0) { Fail 'Restauration impossible.' }
docker compose start | Out-Null
Say 'Restauration terminée.'
