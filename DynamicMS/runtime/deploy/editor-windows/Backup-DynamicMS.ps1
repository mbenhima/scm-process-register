#Requires -Version 5.1
# Sauvegarde complète des données dans .\sauvegardes (l'application est arrêtée quelques secondes).
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot
function Say([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Fail([string]$m) { Write-Host "ERREUR : $m" -ForegroundColor Red; exit 1 }
$Image = 'dynamicms-editor:2026.10'
$Volume = 'dynamicms-editor-data'
New-Item -ItemType Directory -Force -Path sauvegardes | Out-Null
$file = 'dynamicms-editor-data-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.tar.gz'
docker compose stop
try {
  docker run --rm --user 0 --entrypoint tar -v "${Volume}:/data:ro" -v "$(Join-Path $PSScriptRoot 'sauvegardes'):/out" $Image czf "/out/$file" -C /data .
  if ($LASTEXITCODE -ne 0) { Fail 'Sauvegarde impossible.' }
} finally { docker compose start | Out-Null }
Say "Sauvegarde écrite : $(Join-Path 'sauvegardes' $file)"
