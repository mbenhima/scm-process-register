CortexSkills @VERSION@ — Editor runtime (Linux, Docker)

Your own installation of CortexSkills: on your VPS (scenario 2, HTTPS with Caddy) or on a Linux laptop (scenario 1,
http://localhost:4000). Same runtime image as the customers'. The private key and the signing tool are NOT here:
licences are signed in your signing workspace on your laptop (source code, server/tools/keys/vendor-private.pem).

Requirements: Linux x86-64 or arm64, Docker Engine 24+ with the compose plugin, 2 vCPU, 4 GB RAM, 20 GB disk.
VPS: a DNS record (A) pointing to the server, ports 80 and 443 open.

1. Install
     sudo mkdir -p /opt/cortexskills && sudo chown $USER /opt/cortexskills && cd /opt/cortexskills
     unzip CortexSkills-editor-runtime-linux-@VERSION@.zip && ln -sfn CortexSkills-editor-runtime-linux-@VERSION@ current
     cd current && cp <signing workspace>/server/tools/keys/vendor-public.pem .
     ./install.sh            (asks the domain — skills.yourdomain.com, or localhost — and the platform administrator)

2. A customer organization and its licence
     ./licence.sh create-org --name "Clinique Exemple" --domain clinique-exemple.ma \
        --admin-email admin@clinique-exemple.ma --admin-name "Admin" --admin-password 'Str0ng#Passw0rd2026' --lang fr
     ./licence.sh request clinique-exemple.ma          → Organization ID
   On your laptop, in the signing workspace (server folder):
     npm run sign-licence -- --company "Clinique Exemple" --companyId <Organization ID> --expiry 2027-12-31 \
        --maxUsers 50 --plan SME-GRO --features analytics,export --output ~/licences/Clinique_Exemple.lic
     scp ~/licences/Clinique_Exemple.lic user@server:/opt/cortexskills/current/licence/
   Back on this machine:
     ./licence.sh install licence/Clinique_Exemple.lic

3. Backups (also automatic every day inside the container)
     ./backup.sh                                        → /opt/cortexskills-backups/<date>
     OFFSITE=user@backuphost:/backups ./backup.sh       → also copied to another machine
     cron: 30 2 * * * /opt/cortexskills/current/backup.sh >> /var/log/cortexskills-backup.log 2>&1
   Restore: docker compose stop && docker compose run --rm --no-deps --entrypoint cortexskills-admin cortexskills restore <file.db> && docker compose start

4. Update to a new release
     unzip the new zip in /opt/cortexskills, cd into it, then:  ./update.sh /opt/cortexskills/current
     ln -sfn <new folder> /opt/cortexskills/current

Everyday: docker compose ps · docker compose logs -f · docker compose restart · docker compose exec cortexskills cortexskills-admin help
Full procedure: CortexSkills — Editor Installation and Licensing Guide.
