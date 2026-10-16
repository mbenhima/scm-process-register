#Requires -Version 5.1
# Démarre DynamicMS (runtime éditeur, poste Windows).
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot
function Say([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Fail([string]$m) { Write-Host "ERREUR : $m" -ForegroundColor Red; exit 1 }
$Image = 'dynamicms-editor:2026.10'
$Volume = 'dynamicms-editor-data'
docker compose up -d
if ($LASTEXITCODE -ne 0) { Fail 'Démarrage impossible : vérifiez que Docker Desktop est lancé.' }
Say 'DynamicMS démarre : http://localhost:4000 (prêt en quelques secondes)'
