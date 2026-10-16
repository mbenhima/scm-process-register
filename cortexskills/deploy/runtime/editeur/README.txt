CortexSkills @VERSION@ — Minified runtime, editor side (Linux x64 and Windows x64)
Full procedure: Installation_Guide_Runtime_Editor_Linux_Windows_CortexSkills_EN (Word / PDF, delivered with this file).
No readable source code: minified server and licence manager, compiled and minified web client.
Prerequisite: Node.js 22 LTS (22.13 or newer) — official installer on Windows, official archive or NodeSource on Linux.

Two scenarios
  a) Private cloud / on-premises (Linux server): ./cortexskills, sudo ./installer-service.sh, config/ (systemd, Nginx).
  b) Localhost on Windows (the editor's workstation): cortexskills.cmd start, then http://localhost:4000.

Contents
  cortexskills / cortexskills.cmd   the application and its console (start, admin, secrets, backup, restore, version)
  cslic / cslic.cmd                 licence manager (CRUD) of the signing workstation
  cslic-sauvegarder                 encrypted archive of the signing workstation (Linux)
  installer-service.sh              Linux service (systemd)
  env.example                       template of the .env settings file
  config/                           cortexskills.service, nginx-cortexskills.conf
  licence/                          licence files (.lic) to install
  app/                              the application (runtime)
  poste-signature/                  signing key pair: import it once (cslic importer), then delete the folder
  SHA256SUMS.txt                    checksums of the files

Scenario b, Windows (command prompt, in the extracted folder)
  copy env.example .env      then in .env: PUBLIC_URL=http://localhost:4000, CORS_ORIGIN=http://localhost:4000,
                             the two secrets (cortexskills secrets), ADMIN_EMAIL, ADMIN_PASSWORD
  cortexskills start         (first start: 5 to 15 minutes)
  cslic importer poste-signature
  cslic aide
