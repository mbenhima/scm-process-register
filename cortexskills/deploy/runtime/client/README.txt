CortexSkills @VERSION@ — Minified runtime, customer side (Linux x64, private cloud or on-premises)
Full procedure: Installation_Guide_Runtime_Customer_Linux_CortexSkills_EN (Word / PDF, delivered with this file).
No readable source code: minified server, compiled and minified web client. Prerequisite: Node.js 22 LTS (22.13 or newer).

Contents
  cortexskills            starts the application and its console (start, admin, secrets, backup, restore, version)
  installer-service.sh    installs the Linux service (systemd): sudo ./installer-service.sh
  env.example             template of the .env settings file
  config/                 cortexskills.service (hardened systemd unit) and nginx-cortexskills.conf (HTTPS)
  licence/                put the licence file (.lic) received from the vendor here
  app/                    the application (runtime, read-only)
  data/                   your data (created at first start)
  SHA256SUMS.txt          checksums of the files

Quick start (recommended folder: /opt/cortexskills)
  1. Node.js 22:  sudo tar -xJf node-v22.22.2-linux-x64.tar.xz -C /usr/local --strip-components=1 && node -v
  2. sha256sum -c Runtime_Customer_Linux_CortexSkills_@VERSION@.tar.xz.sha256
  3. sudo mkdir -p /opt/cortexskills && sudo tar -xJf Runtime_Customer_Linux_CortexSkills_@VERSION@.tar.xz -C /opt/cortexskills --strip-components=1
  4. cd /opt/cortexskills && sha256sum -c --quiet SHA256SUMS.txt && sudo cp env.example .env && ./cortexskills secrets && sudo nano .env
  5. sudo ./installer-service.sh && journalctl -u cortexskills -f      (first start: 5 to 15 minutes)
  6. HTTPS: config/nginx-cortexskills.conf → /etc/nginx/conf.d/cortexskills.conf
  7. sudo -u cortexskills ./cortexskills admin org-create --name "Your company" --domain your-company.com \
       --admin-email admin@your-company.com --admin-name "First Last" --admin-password '<strong password>' --lang en
  8. sudo -u cortexskills ./cortexskills admin licence-request --org your-company.com   → send to the vendor
  9. sudo -u cortexskills ./cortexskills admin licence-install --file licence/<file>.lic
