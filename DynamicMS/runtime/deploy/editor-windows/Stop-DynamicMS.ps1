#Requires -Version 5.1
# Arrête DynamicMS (les données sont conservées dans le volume).
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot
function Say([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Fail([string]$m) { Write-Host "ERREUR : $m" -ForegroundColor Red; exit 1 }
$Image = 'dynamicms-editor:2026.10'
$Volume = 'dynamicms-editor-data'
docker compose stop
Say 'DynamicMS est arrêté. Les données sont conservées.'
