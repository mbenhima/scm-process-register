# Windows service for CortexSkills with NSSM (https://nssm.cc). Run in PowerShell as administrator.
# Adapt $App to the folder where CortexSkills was unzipped.
$App  = "C:\CortexSkills"
$Node = (Get-Command node).Source
New-Item -ItemType Directory -Force -Path "$App\logs" | Out-Null
nssm install CortexSkills $Node "--no-warnings" "src\index.js"
nssm set CortexSkills AppDirectory "$App\server"
nssm set CortexSkills AppEnvironmentExtra "NODE_ENV=production"
nssm set CortexSkills AppStdout "$App\logs\cortexskills.log"
nssm set CortexSkills AppStderr "$App\logs\cortexskills-error.log"
nssm set CortexSkills AppRotateFiles 1
nssm set CortexSkills AppRotateBytes 10485760
nssm set CortexSkills Start SERVICE_AUTO_START
nssm start CortexSkills
Write-Host "CortexSkills service installed and started. Check: nssm status CortexSkills"
