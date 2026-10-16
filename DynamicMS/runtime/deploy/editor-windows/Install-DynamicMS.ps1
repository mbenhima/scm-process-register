#Requires -Version 5.1
<#
  Installation de DynamicMS 2026.10 (runtime éditeur) en local sur Windows avec Docker Desktop.
  Exécution (PowerShell, dans ce dossier) :
    powershell -ExecutionPolicy Bypass -File .\Install-DynamicMS.ps1
  Paramètres facultatifs : -ImageArchive <chemin de l'archive de l'image> -PrivateKey <chemin de la clé privée>
#>
param(
  [string]$ImageArchive = '..\Docker_Runtime_Editor_Linux_DynamicMS_2026.10_Image.tar.gz',
  [string]$PrivateKey = '..\Docker_Runtime_Editor_Licence_PrivateKey.pem'
)
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot
function Say([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Fail([string]$m) { Write-Host "ERREUR : $m" -ForegroundColor Red; exit 1 }
$Image = 'dynamicms-editor:2026.10'
$Volume = 'dynamicms-editor-data'

function Test-Strong([string]$p) { return ($p.Length -ge 12 -and $p -cmatch '[A-Z]' -and $p -cmatch '[a-z]' -and $p -match '\d') }
function Read-Secret([string]$prompt) {
  $s = Read-Host -Prompt $prompt -AsSecureString
  return [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}
function Get-EnvValue([string]$key) {
  $line = Get-Content .env -Encoding UTF8 | Where-Object { $_.StartsWith("$key=") } | Select-Object -First 1
  if ($line) { return $line.Substring($key.Length + 1) } else { return '' }
}
function Set-EnvValue([string]$key, [string]$value) {
  $out = foreach ($l in (Get-Content .env -Encoding UTF8)) { if ($l.StartsWith("$key=")) { "$key=$value" } else { $l } }
  # UTF-8 without byte-order mark, as Docker Compose expects.
  [IO.File]::WriteAllLines((Join-Path $PSScriptRoot '.env'), [string[]]$out, (New-Object Text.UTF8Encoding($false)))
}

Say 'Contrôle de Docker Desktop'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail "Docker Desktop n'est pas installé (voir le guide, chapitre Windows)." }
docker info *> $null
if ($LASTEXITCODE -ne 0) { Fail "Docker Desktop n'est pas démarré : lancez-le et attendez « Engine running »." }
docker compose version *> $null
if ($LASTEXITCODE -ne 0) { Fail 'Docker Compose v2 est requis (inclus dans Docker Desktop).' }

docker image inspect $Image *> $null
if ($LASTEXITCODE -eq 0) {
  Say "Image $Image déjà chargée"
} else {
  if (-not (Test-Path $ImageArchive)) { Fail "Archive de l'image introuvable : $ImageArchive" }
  $ImageArchive = (Resolve-Path $ImageArchive).Path
  $shaFile = "$ImageArchive.sha256"
  if (Test-Path $shaFile) {
    Say "Vérification de l'empreinte SHA-256"
    $expected = ((Get-Content $shaFile -Raw).Trim() -split '\s+')[0].ToLower()
    $actual = (Get-FileHash $ImageArchive -Algorithm SHA256).Hash.ToLower()
    if ($expected -ne $actual) { Fail "Empreinte incorrecte : archive incomplète ou modifiée." }
  }
  Say "Chargement de l'image (1 à 2 minutes)"
  docker load -i $ImageArchive
  if ($LASTEXITCODE -ne 0) { Fail "Chargement de l'image impossible." }
}

Say 'Clé de signature des licences'
New-Item -ItemType Directory -Force -Path secrets | Out-Null
if (-not (Test-Path (Join-Path 'secrets' 'licence_private.pem'))) {
  if (-not (Test-Path $PrivateKey)) { Fail "Clé privée introuvable : $PrivateKey" }
  Copy-Item $PrivateKey (Join-Path 'secrets' 'licence_private.pem')
}

if (-not (Test-Path .env)) {
  Say 'Création du fichier .env'
  Copy-Item .env.example .env
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  Set-EnvValue 'JWT_SECRET' (-join ($bytes | ForEach-Object { $_.ToString('x2') }))
}
if (-not (Get-EnvValue 'ADMIN_EMAIL')) { Set-EnvValue 'ADMIN_EMAIL' (Read-Host -Prompt "E-mail de l'administrateur de la plateforme") }
$pw = Get-EnvValue 'ADMIN_PASSWORD'
while (-not (Test-Strong $pw)) { $pw = Read-Secret "Mot de passe provisoire de l'administrateur (12 car., maj., min., chiffre)" }
Set-EnvValue 'ADMIN_PASSWORD' $pw
if ((Get-EnvValue 'INIT_DATA') -ne 'empty') {
  $sp = Get-EnvValue 'SEED_PASSWORD'
  while (-not (Test-Strong $sp)) { $sp = Read-Secret 'Mot de passe initial des comptes initialisés (12 car., maj., min., chiffre)' }
  Set-EnvValue 'SEED_PASSWORD' $sp
}

Say 'Démarrage'
docker compose up -d
if ($LASTEXITCODE -ne 0) { Fail 'Démarrage impossible : docker logs dynamicms-editor' }
Say "Attente de l'application (le premier démarrage initialise les données : environ 1 minute)"
$port = Get-EnvValue 'HTTP_PORT'; if (-not $port) { $port = '4000' }
$ready = $false
for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$port/api/health" -UseBasicParsing -TimeoutSec 5
    $ready = ($r.StatusCode -eq 200)
  } catch { }
  if (-not $ready) { Start-Sleep -Seconds 5 }
}
if (-not $ready) { Fail "L'application ne répond pas après 5 minutes : docker logs dynamicms-editor" }
Say "DynamicMS (éditeur) est démarré : http://localhost:$port"
Write-Host "Connectez-vous avec $(Get-EnvValue 'ADMIN_EMAIL'), changez le mot de passe, puis ouvrez Administration > Licences."
try { Start-Process "http://localhost:$port" } catch { }
exit 0
