// Builds the two on-premises installation guides (Word):
//  - CortexSkills_Installation_Guide_Customer_Docker_Linux.docx — the customer installs and runs the Docker image on
//    Linux, creates its organization and activates the licence (no commercial content);
//  - CortexSkills_Editor_Installation_and_Licensing_Guide.docx — the editor: signing workspace and keys, the customer
//    bundle, scenario 1 (laptop, localhost), scenario 2 (VPS with Docker), licence activation for each.
// Run: node build-docker-guides.cjs <outDir>; then python3 topdf.py <files> for the PDFs.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, H3, bullet, code, callout, table, shot, cover, tocPage, document, spacer } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const SH = f => path.join(__dirname, 'shots/docker', f + '.png');
let list = 0; const steps = items => { const ref = 'dsteps' + (list++ || ''); return items.map(t => B.numbered(t, ref)); };
const cmd = s => s.split('\n').map(l => code(l));
const b = t => ({ text: t, bold: true });
const IMG = `cortexskills:${version}`; const BUNDLE = `CortexSkills-docker-${version}`;
const W2 = [3000, 6646], W3 = [2600, 2600, 4446];

// ================================================================== 1. CUSTOMER GUIDE
const cust = [
  ...cover({ eyebrow: 'Installation Guide — Customer', title: 'CortexSkills', subtitle: 'Install and run CortexSkills on your own Linux server with Docker (private cloud or on premises)', meta: [`Version ${version} · ${today}`, 'Prepared by AI Value'] }),
  ...tocPage(),

  H1('1. What you install'),
  P('CortexSkills runs on your own infrastructure as one Docker container. Your data never leaves your servers: the database, the attached files and the backups are kept in a Docker volume on your host. Nothing is sent to the editor, and the application does not need an Internet connection to run (only to send e-mails or WhatsApp messages, if you configure them).'),
  table(['Element', 'What it is'], [
    ['Container cortexskills', `The application: server and web screens, from the image ${IMG}. It runs as a non-root user on a read-only file system.`],
    ['Volume cortexskills_cortexskills-data', 'Mounted at /data in the container: database, attached files, daily backups and the installed licence. This is the only data to protect.'],
    ['Folder licence/ (on the host)', 'Where you put the licence file sent by the editor. Mounted read-only at /licence.'],
    ['File .env (on the host)', 'Your settings: public address, secrets, administrator, e-mail server.'],
    ['HTTPS reverse proxy', 'Either the Caddy container provided (compose.https.yml, automatic certificates), or your own proxy or load balancer.'],
  ], W2),
  spacer(),
  callout('What is in the image — and what is not', [
    'In the image: Node.js 22 runtime, the CortexSkills server, the built web screens, and the editor’s public key (it can only check a licence, not create one).',
    'Not in the image: your licence, your settings and secrets, your data, any signing tool or private key, any build tool.',
    'The container listens on port 4000 and is published on 127.0.0.1 only: users reach it through HTTPS.']),

  H1('2. Requirements'),
  H2('2.1 Server'),
  table(['Item', 'Minimum', 'Recommended (300+ users)'], [
    ['Operating system', 'Linux x86-64 or arm64 with a 64-bit kernel', 'Ubuntu 22.04/24.04 LTS, Debian 12, RHEL/Rocky/AlmaLinux 9'],
    ['CPU', '2 vCPU', '4 vCPU'],
    ['Memory', '4 GB', '8 GB'],
    ['Disk', '20 GB free (image about 650 MB, data and backups)', '50 GB on backed-up storage'],
    ['Docker', 'Docker Engine 24 or newer with the compose plugin (docker compose)', 'Latest stable Docker Engine'],
  ], W3, { size: 18 }),
  H2('2.2 Network'),
  table(['Need', 'Detail'], [
    ['DNS name', 'For example skills.yourcompany.com, pointing to the server (internal DNS is enough for an intranet).'],
    ['Inbound', '443/TCP for users (and 80/TCP if Caddy obtains a Let’s Encrypt certificate). Port 4000 stays closed: it is bound to 127.0.0.1.'],
    ['Outbound (optional)', 'Your SMTP server (usually 587/TCP) for e-mails; 443/TCP to graph.facebook.com for WhatsApp Business.'],
    ['Browsers', 'Recent Chrome, Edge, Firefox or Safari.'],
  ], W2),
  H2('2.3 What you receive from the editor'),
  table(['File', 'Use'], [
    [`${BUNDLE}.zip`, 'The installation bundle: Dockerfile, compose files, settings template, the application and the editor public key (vendor-public.pem).'],
    [`cortexskills-image-${version}.tar.gz (optional)`, 'The image already built by the editor. With it you do not build anything (section 4.1).'],
    ['SHA-256 checksums', 'To check that the files are intact (section 3).'],
    ['This guide', 'Installation and operation.'],
  ], W2),

  H1('3. Install Docker and unpack the bundle'),
  H2('3.1 Install Docker (Ubuntu or Debian)'),
  P('Skip this section if docker compose version already answers. Otherwise, as an administrator (sudo):'),
  ...cmd('curl -fsSL https://get.docker.com -o get-docker.sh\nsudo sh get-docker.sh\nsudo usermod -aG docker $USER      # then log out and back in\ndocker version && docker compose version'),
  P('On RHEL, Rocky or AlmaLinux, follow the official procedure at docs.docker.com/engine/install (package docker-ce and docker-compose-plugin), then: sudo systemctl enable --now docker.', { size: 20 }),
  H2('3.2 Unpack and check'),
  ...cmd(`sudo mkdir -p /opt/cortexskills && sudo chown $USER /opt/cortexskills && cd /opt/cortexskills\nsha256sum ${BUNDLE}.zip        # compare with the checksum sent by the editor\nunzip ${BUNDLE}.zip && cd ${BUNDLE}\nls -a`),
  table(['In the folder', 'Role'], [
    ['Dockerfile, .dockerignore', 'Builds the runtime image (section 4.2).'],
    ['docker-compose.yml', 'The CortexSkills service, its data volume and its security options.'],
    ['compose.https.yml, Caddyfile', 'Optional HTTPS front end with automatic certificates.'],
    ['env.example', 'Template of the settings file .env.'],
    ['entrypoint.sh, cortexskills-admin', 'Start script (creates the database on the first start) and administration console.'],
    ['vendor-public.pem', 'Editor public key that checks the licence file. Do not modify it.'],
    ['app/', 'The application (server and built web screens).'],
    ['licence/', 'Put the licence file here when you receive it.'],
  ], W2, { size: 18 }),

  H1('4. Get the image'),
  H2('4.1 Option A — load the image built by the editor (recommended)'),
  ...cmd(`sha256sum cortexskills-image-${version}.tar.gz\ndocker load -i cortexskills-image-${version}.tar.gz\ndocker image ls cortexskills`),
  H2('4.2 Option B — build the image from the bundle'),
  P('The build downloads the Node.js base image and the server libraries from the Internet (registry.npmjs.org and Docker Hub, or your internal mirrors). It takes 2 to 5 minutes.'),
  ...cmd(`docker build -t ${IMG} .`),
  P('The build stops with an explicit message if vendor-public.pem is missing or is not a public key. Behind a proxy, add --build-arg HTTPS_PROXY=http://proxy:port. To use an internal registry mirror of the official Node image: --build-arg BASE_IMAGE=registry.yourcompany.com/library/node:22-bookworm-slim.', { size: 20 }),

  H1('5. Settings (.env)'),
  ...cmd('cp env.example .env && chmod 600 .env\nopenssl rand -base64 48 | tr -d "\\n=+/"; echo     # run twice: one value per secret\nnano .env'),
  table(['Setting', 'What to put', 'Example'], [
    ['PUBLIC_URL', 'The address users type, in HTTPS. Used in the links sent by e-mail and WhatsApp.', 'https://skills.yourcompany.com'],
    ['CORS_ORIGIN', 'The same address.', 'https://skills.yourcompany.com'],
    ['DOMAIN', 'Only with compose.https.yml: the DNS name.', 'skills.yourcompany.com'],
    ['HOST_PORT', 'Port of the host where the container is published, on 127.0.0.1.', '4000'],
    ['JWT_SECRET', 'Random value of 32+ characters (signs the sessions).', 'output of openssl rand'],
    ['CHANNEL_SECRET_KEY', 'Another random value of 32+ characters (encrypts stored credentials).', 'output of openssl rand'],
    ['ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD', 'The platform administrator created at the first start. Password: 12+ characters, upper and lower case, digit, symbol. Remove ADMIN_PASSWORD after the first start.', 'it.ops@yourcompany.com'],
    ['BACKUP_RETENTION_DAYS', 'Days a daily backup is kept in the volume.', '30'],
    ['SMTP_*', 'Your mail server for invitations, reminders and notifications (each organization can also set its own).', 'smtp.yourcompany.com, 587'],
    ['WHATSAPP_*', 'Optional: WhatsApp Business Cloud API.', '—'],
  ], [2500, 4646, 2500], { size: 17 }),
  callout('Production checks at start-up', ['The container refuses to start while a setting is unsafe — a short or default secret, the same value for both secrets, an address that is not HTTPS, an open CORS policy — and lists each problem in its log. http://localhost:4000 is accepted only for an evaluation on the server itself.', 'Keep a copy of .env in your secret vault: changing JWT_SECRET signs every user out; losing CHANNEL_SECRET_KEY makes the stored e-mail and WhatsApp credentials unreadable.'], C.light),

  H1('6. HTTPS'),
  H2('6.1 Option A — Caddy provided (automatic certificates)'),
  P('The DNS name must point to the server and ports 80 and 443 must be reachable (from the Internet for Let’s Encrypt). Caddy obtains and renews the certificate itself.'),
  ...cmd('docker compose -f docker-compose.yml -f compose.https.yml up -d'),
  P('For an internal certificate authority, replace the first line of the Caddyfile by the name followed by a tls directive with your certificate and key files, mounted in the Caddy container.', { size: 20 }),
  H2('6.2 Option B — your own reverse proxy or load balancer'),
  P('Start only CortexSkills (docker compose up -d) and forward HTTPS to http://127.0.0.1:4000. Example for nginx:'),
  ...cmd('server {\n  listen 443 ssl http2;  server_name skills.yourcompany.com;\n  ssl_certificate /etc/ssl/skills.crt;  ssl_certificate_key /etc/ssl/skills.key;\n  client_max_body_size 20m;\n  location / {\n    proxy_pass http://127.0.0.1:4000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto https;\n  }\n}'),
  P('If the proxy runs on another machine, publish the port on the server’s private address instead of 127.0.0.1 (docker-compose.yml, ports) and restrict it with your firewall to the proxy only.', { size: 20 }),

  H1('7. First start'),
  ...cmd('docker compose up -d            # or with compose.https.yml, section 6.1\ndocker compose logs -f          # Ctrl+C to leave the logs\ncurl -s http://127.0.0.1:4000/api/health'),
  P('On the first start the container creates the database (reference catalog, templates and the platform administrator) in about 5 seconds, then starts. The health check answers:'),
  ...cmd(`{"status":"ok","initialized":true,"mode":"onprem","version":"${version}"}`),
  P('Docker also reports the state: docker compose ps shows “healthy”. Then remove ADMIN_PASSWORD from .env and run docker compose up -d again.'),
  ...shot(SH('01_login'), 'The sign-in page at your public address', 520),

  H1('8. Create your organization'),
  P('An organization is your company in CortexSkills, with its own users, projects and licence. Create it from the administration console of the container:'),
  ...cmd('docker compose exec cortexskills cortexskills-admin org-create \\\n  --name "Your Company" --domain yourcompany.com \\\n  --admin-email jane.doe@yourcompany.com --admin-name "Jane Doe" \\\n  --admin-password \'Str0ng#Passw0rd2026\' \\\n  --lang en --country Morocco --city Casablanca'),
  table(['Option', 'Meaning'], [
    ['--name', 'Company name as shown in the application.'],
    ['--domain', 'E-mail domain of your users; it identifies the organization in the commands below.'],
    ['--admin-email, --admin-name, --admin-password', 'The first administrator of your organization (full rights). Strong password required.'],
    ['--lang', 'Default language: en, fr or ar. Each user can switch language later.'],
    ['--sector, --segment, --employees, --country, --city', 'Optional profile; can be completed later in the application.'],
  ], W2, { size: 18 }),
  P('The command prints the Organization ID. Your users cannot sign in until the licence is installed (section 9).'),

  H1('9. Activate the licence'),
  P('The licence is a small signed file (.lic) issued by the editor for your Organization ID. It sets the number of users, the scope and the end date. It is checked with the editor public key included in the image: any change to the file makes it invalid.'),
  ...steps([
    [b('Request. '), 'Print the information to send to the editor:'],
  ]),
  ...cmd('docker compose exec cortexskills cortexskills-admin licence-request --org yourcompany.com'),
  P('Send the lines printed (Company and Organization ID) to the editor by e-mail. The Organization ID is not secret, but it must be copied exactly.', { size: 20 }),
  ...steps([[b('Receive. '), 'The editor sends you a file such as Your_Company.lic. Copy it into the licence/ folder of the bundle:']]),
  ...cmd('cp ~/Your_Company.lic /opt/cortexskills/' + BUNDLE + '/licence/'),
  ...steps([[b('Install. '), 'No restart is needed:']]),
  ...cmd('docker compose exec cortexskills cortexskills-admin licence-install --file /licence/Your_Company.lic'),
  P('The console confirms the scope, the number of users and the end date. A modified file, or one issued for another Organization ID, is refused with an explicit message.', { size: 20 }),
  ...steps([[b('Check. '), 'Sign in with the organization administrator, then open Administration › Configuration & licence: the licence shows Active, the number of users and the end date.']]),
  ...shot(SH('03_licence'), 'Administration › Configuration & licence after activation', 560),
  H2('9.1 Renewal and changes'),
  P('Before the end date the application warns the administrators (30 days ahead). After it, the application becomes read-only until a new licence is installed. For a renewal or a change in the number of users, the editor sends a new .lic file: install it with the same command, or upload it in Administration › Configuration & licence › Upload licence file.'),

  H1('10. Operation'),
  H2('10.1 Everyday commands'),
  table(['Action', 'Command (in the bundle folder)'], [
    ['Start / stop / restart', 'docker compose up -d   ·   docker compose stop   ·   docker compose restart'],
    ['State and health', 'docker compose ps   ·   curl -s http://127.0.0.1:4000/api/health'],
    ['Logs', 'docker compose logs -f --tail 200'],
    ['Console help', 'docker compose exec cortexskills cortexskills-admin help'],
    ['Reset a user password', 'docker compose exec cortexskills cortexskills-admin password --email john@yourcompany.com --password \'New#Passw0rd2026\''],
  ], [2600, 7046], { size: 17 }),
  P('The container restarts by itself after a reboot of the server (restart: unless-stopped), as long as the Docker service is enabled (sudo systemctl enable docker).', { size: 20 }),
  H2('10.2 Backups'),
  P('The application writes a backup of the database every day in /data/backups and keeps it BACKUP_RETENTION_DAYS days. Take an extra one before any change, and copy the backups out of the server every day:'),
  ...cmd('docker compose exec cortexskills cortexskills-admin backup\ndocker compose cp cortexskills:/data/backups ./backups-$(date +%F)\n# then copy that folder to your backup storage (rsync, object storage, tape...)'),
  P('Attached files are in /data/attachments: copy them the same way (docker compose cp cortexskills:/data/attachments ./attachments-$(date +%F)), or back up the whole Docker volume with your usual tool.', { size: 20 }),
  H2('10.3 Restore'),
  ...cmd('docker compose stop\ndocker compose run --rm --no-deps --entrypoint cortexskills-admin cortexskills restore            # lists the backups\ndocker compose run --rm --no-deps --entrypoint cortexskills-admin cortexskills restore <file.db>\ndocker compose start'),
  P('The current database is kept beside the backups as before-restore-<date>.db. A backup from an earlier version is upgraded automatically at start-up.', { size: 20 }),
  H2('10.4 Update to a new version'),
  ...steps(['Take a backup (10.2).', 'Load or build the new image (section 4) — for example cortexskills:1.16.0.', 'Set the new tag in docker-compose.yml (image:), then run docker compose up -d. The data volume and the licence are kept; the database is migrated at start-up.', 'Check the health and the version (curl …/api/health).']),
  P('To go back, set the previous tag again and restore the backup taken in step 1.', { size: 20 }),
  H2('10.5 Uninstall'),
  P('docker compose down stops and removes the container but keeps the data volume. docker compose down -v also deletes the volume and therefore all data: take and copy a backup first.'),

  H1('11. Security'),
  ...[
    'The container runs as an unprivileged user, with a read-only file system, no Linux capabilities and no privilege escalation (docker-compose.yml).',
    'Port 4000 is published on 127.0.0.1 only; only the HTTPS front end is exposed.',
    'Keep .env readable by administrators only (chmod 600) and store its secrets in your vault.',
    'Passwords are stored hashed; sessions expire after JWT_TTL (12 hours by default); every administrative change is written to the audit log.',
    'Apply your operating system updates; update Docker Engine; install the CortexSkills updates sent by the editor.',
  ].map(t => bullet(t)),

  H1('12. Troubleshooting'),
  table(['What you see', 'Cause', 'What to do'], [
    ['“will not start in production mode” in the logs', 'A setting of .env is missing or unsafe.', 'Read the list printed in the logs; each line names the setting to fix. Then docker compose up -d.'],
    ['“First start: set ADMIN_EMAIL and ADMIN_PASSWORD”', 'First start without an administrator.', 'Fill ADMIN_EMAIL and ADMIN_PASSWORD in .env, start again, then remove ADMIN_PASSWORD.'],
    ['Users get “The licence of this Organization is not active”', 'No licence installed, or expired.', 'Section 9. Check the end date in Administration › Configuration & licence.'],
    ['licence-install: “signature is not valid”', 'The file was modified, or not issued by the editor.', 'Ask the editor for the file again; do not edit it.'],
    ['licence-install: “Organization ID … does not exist”', 'The file was issued for another ID.', 'Compare with cortexskills-admin org-list and send the right ID to the editor.'],
    ['The build stops on vendor-public.pem', 'Key missing from the bundle folder.', 'Ask the editor for the bundle with its key, or use the prebuilt image.'],
    ['Links in e-mails point to the wrong address', 'PUBLIC_URL is not the address users type.', 'Fix PUBLIC_URL and CORS_ORIGIN, then docker compose up -d.'],
    ['Caddy cannot get a certificate', 'DNS not pointing to the server, or port 80/443 closed.', 'Check the DNS record and the firewall; docker compose logs caddy.'],
  ], [2900, 2900, 3846], { size: 16 }),

  H1('13. Support'),
  P('When you contact the editor, send: the version (…/api/health), the output of docker compose ps, and the last 200 lines of docker compose logs. Never send the .env file or the secrets it contains.'),
];

// ================================================================== 2. EDITOR GUIDE
const ed = [
  ...cover({ eyebrow: 'Installation & Licensing — Editor', title: 'CortexSkills', subtitle: 'Your signing workspace, the customer bundle, installation on your laptop and on a VPS with Docker, and licence activation', meta: [`Version ${version} · ${today}`, 'Internal — AI Value'] }),
  ...tocPage(),

  H1('1. The pieces and where they live'),
  P('CortexSkills is sold for installation by the customer (private cloud or on premises), in OnPrem mode: each customer organization needs a licence file signed with your private key. The rule that protects your business: the private key never leaves your signing workspace.'),
  table(['Piece', 'Content', 'Where it goes'], [
    ['CortexSkills-source.zip', 'All the source code and tools, including the signing tool (npm run sign-licence).', 'Your laptop only: the signing workspace (section 2). Never to a customer, never to the VPS.'],
    ['vendor-private.pem', 'Your Ed25519 private key: it creates licences.', 'Signing workspace + an offline encrypted backup. Nowhere else.'],
    ['vendor-public.pem', 'The matching public key: it only checks licences. The same for every customer.', 'In every installation (zip or Docker image).'],
    ['CortexSkills-app.zip', 'The application, ready to install with Node.js. No signing tool, no key.', 'Scenario 1: your laptop (a folder separate from the signing workspace).'],
    [`${BUNDLE}.zip`, 'Dockerfile, compose files, settings template and the application. No signing tool, no private key.', 'Scenario 2 (your VPS) and every customer installing with Docker.'],
    ['Customer Installation Guide (PDF)', 'Docker on Linux, settings, licence request and installation, operation. No commercial content.', 'Sent to each customer with the bundle.'],
    ['<Customer>.lic', 'Licence of one organization: company, Organization ID, plan, users, end date, signature.', 'To the customer (or to your laptop/VPS for scenarios 1 and 2).'],
  ], [2400, 3800, 3446], { size: 16 }),
  spacer(),
  callout('Two folders on your laptop, never one', ['Signing workspace (source code + private key), for example ~/CortexSkills-signing — and the application you run, for example ~/CortexSkills. The application refuses to start in OnPrem production mode if it finds vendor-private.pem in its own tools/keys folder.'], C.light),

  H1('2. One time: your signing workspace and your key pair'),
  ...steps(['Install Node.js 22.13 or newer (nodejs.org, LTS).', 'Unzip CortexSkills-source.zip into a dedicated folder, for example ~/CortexSkills-signing (Windows: C:\\CortexSkills-signing).', 'Install the server libraries and create the key pair:']),
  ...cmd('cd ~/CortexSkills-signing/server\nnpm ci --no-audit --no-fund\nnode --no-warnings --input-type=module -e "const m = await import(\'./tools/sign-licence.js\'); m.ensureKeys(); console.log(\'keys ready\')"\nls tools/keys          # vendor-private.pem  vendor-public.pem'),
  ...steps(['Back up the private key now, offline and encrypted (encrypted USB key, password manager vault). If it is lost you cannot renew any licence; if it leaks, anyone can create licences. In both cases every customer would need a new public key and new licences.', 'Record the fingerprint of the public key (customers can compare it):']),
  ...cmd('openssl pkey -pubin -in tools/keys/vendor-public.pem -outform DER | sha256sum'),
  P('The key pair is created once. Do not run ensureKeys on another computer: it would create a different pair.', { size: 20, color: C.muted }),

  H1('3. Prepare what you send to a customer'),
  H2('3.1 The Docker bundle with your public key'),
  P('In the signing workspace (Linux, macOS, or Windows with WSL or Git Bash):'),
  ...cmd(`cd ~/CortexSkills-signing\nbash tools/package-docker.sh server/tools/keys/vendor-public.pem\n# → deliverables/${BUNDLE}.zip : Dockerfile, compose files, app/, vendor-public.pem`),
  P(`The script leaves out the signing tool, the keys folder, the tests, the data and any .env, and checks that no private key is in the bundle. Alternative without the script: take the ${BUNDLE}.zip delivered with this guide and add your vendor-public.pem at its root (next to the Dockerfile).`, { size: 20 }),
  H2('3.2 Optional: the prebuilt image'),
  P('Sending the image built by you means the customer builds nothing and runs exactly what you tested. On a machine with Docker (your laptop with Docker Desktop, or the VPS):'),
  ...cmd(`unzip ${BUNDLE}.zip && cd ${BUNDLE}\ndocker build -t ${IMG} .\ndocker save ${IMG} | gzip > cortexskills-image-${version}.tar.gz      # about 150 MB\nsha256sum ${BUNDLE}.zip cortexskills-image-${version}.tar.gz > SHA256SUMS.txt`),
  P('For a customer on arm64 servers, build with docker buildx build --platform linux/arm64 (or both platforms and push to a registry the customer can reach).', { size: 20 }),
  H2('3.3 What to send'),
  table(['Send', 'Do not send'], [
    [`${BUNDLE}.zip (with vendor-public.pem)`, 'CortexSkills-source.zip, the signing tool, vendor-private.pem'],
    [`cortexskills-image-${version}.tar.gz (optional) and SHA256SUMS.txt`, 'Your price list or contract terms inside the technical package'],
    ['Customer Installation Guide (PDF)', 'A licence before you have the customer’s Organization ID'],
  ], [4823, 4823], { size: 18 }),

  H1('4. Scenario 1 — CortexSkills on your laptop (localhost)'),
  P('Use it to demonstrate, train or pilot with a customer organization, at http://localhost:4000, in the same OnPrem production mode as a customer installation.'),
  H2('4.1 Install'),
  ...steps(['Unzip CortexSkills-app.zip into its own folder, for example ~/CortexSkills (Windows: C:\\CortexSkills) — not inside the signing workspace.', 'Copy only the public key into the application:']),
  ...cmd('mkdir -p ~/CortexSkills/server/tools/keys\ncp ~/CortexSkills-signing/server/tools/keys/vendor-public.pem ~/CortexSkills/server/tools/keys/\n# Windows (PowerShell):\n# New-Item -ItemType Directory C:\\CortexSkills\\server\\tools\\keys -Force\n# Copy-Item C:\\CortexSkills-signing\\server\\tools\\keys\\vendor-public.pem C:\\CortexSkills\\server\\tools\\keys\\'),
  ...steps(['Create the settings file ~/CortexSkills/server/.env with this content (generate the two secrets with npm run secrets in the server folder, after step 4):']),
  ...cmd('NODE_ENV=production\nDEPLOYMENT_MODE=onprem\nPORT=4000\nPUBLIC_URL=http://localhost:4000\nCORS_ORIGIN=http://localhost:4000\nJWT_SECRET=<first value of npm run secrets>\nCHANNEL_SECRET_KEY=<second value>\nADMIN_EMAIL=you@aivalue.ma\nADMIN_NAME=Your Name\nADMIN_PASSWORD=<12+ characters, upper/lower case, digit, symbol>'),
  ...steps(['Install the libraries, create the database, start:']),
  ...cmd('cd ~/CortexSkills/server\nnpm ci --omit=dev --no-audit --no-fund\nnpm run secrets          # copy JWT_SECRET and CHANNEL_SECRET_KEY into .env\nnpm run init             # empty production database + your platform administrator\nnpm start                # keep this window open'),
  ...steps(['Open http://localhost:4000. Remove ADMIN_PASSWORD from .env. To stop: Ctrl+C in the window; to start again: npm start.']),
  callout('Demonstration data instead', ['For a demo with the 59 sample organizations (including the private-clinic case), use a second folder without NODE_ENV=production and with DEPLOYMENT_MODE=saas, then npm run seed. Never mix the demonstration database with a customer’s production data.'], C.light),
  H2('4.2 Docker on your laptop (alternative)'),
  P(`With Docker Desktop or Docker Engine, the bundle of section 3.1 works on the laptop too: in .env set PUBLIC_URL and CORS_ORIGIN to http://localhost:4000, then docker build -t ${IMG} . and docker compose up -d. The commands of section 5.2 then apply, with docker compose exec cortexskills cortexskills-admin in place of npm run admin --.`),

  H1('5. Scenario 1 — Activate the licence of a customer on your laptop'),
  H2('5.1 Create the customer organization (application folder)'),
  ...cmd('cd ~/CortexSkills/server\nnpm run admin -- org-create --name "Clinique Exemple" --domain clinique-exemple.ma \\\n  --admin-email admin@clinique-exemple.ma --admin-name "Admin Clinique" \\\n  --admin-password \'Str0ng#Passw0rd2026\' --lang fr --sector HCPR --segment SME\nnpm run admin -- licence-request --org clinique-exemple.ma'),
  P('licence-request prints the Company, the Organization ID, and the plan and users currently requested. Keep the Organization ID.', { size: 20 }),
  H2('5.2 Sign the licence (signing workspace)'),
  ...cmd('cd ~/CortexSkills-signing/server\nnpm run sign-licence -- --company "Clinique Exemple" --companyId <Organization ID> \\\n  --expiry 2027-12-31 --maxUsers 50 --plan SME-GRO --features analytics,export \\\n  --output ~/licences/Clinique_Exemple.lic'),
  table(['Option', 'Meaning', 'Rules'], [
    ['--company', 'Customer name written in the licence.', 'As agreed in the contract.'],
    ['--companyId', 'Organization ID printed by licence-request.', 'Exactly; the licence works only for this organization.'],
    ['--expiry', 'End date (YYYY-MM-DD).', 'Warning 30 days before; read-only after.'],
    ['--maxUsers', 'Maximum active users.', 'Creating a user beyond it is refused.'],
    ['--plan', 'Pack, bundle or SME pack (list: npm run admin -- packs).', 'PK-01…PK-08, BND-01…BND-05, SME-ESS, SME-GRO, SME-CMP. Sets the modules of the organization.'],
    ['--features', 'Comma-separated list recorded in the licence.', 'Informative (shown to the administrator).'],
    ['--output', 'File to write.', 'Keep a copy of every licence you issue (register below).'],
  ], [1700, 3700, 4246], { size: 16 }),
  H2('5.3 Install and check (application folder)'),
  ...cmd('cd ~/CortexSkills/server\nnpm run admin -- licence-install --file ~/licences/Clinique_Exemple.lic'),
  P('No restart is needed. Sign in at http://localhost:4000 with the organization administrator; Administration › Configuration & licence shows Active, the plan, the users and the end date. Renewal: sign a new file with the new date or users and install it the same way (or upload it in that screen).'),

  H1('6. Scenario 2 — CortexSkills on your VPS with Docker (editor version)'),
  P('Use it for a hosted pilot or demonstration reachable over the Internet, for example on a HeberJahiz Cloud 2 VPS (2 vCores, 4 GB RAM, 25 GB) with Ubuntu 24.04. The “editor version” is the same image as the customers’ one, with the HTTPS front end and your own settings — the private key and the signing tool stay on your laptop.'),
  H2('6.1 Prepare the VPS (once)'),
  ...steps(['Create a DNS record A: skills.yourdomain.com → public IP of the VPS.', 'Connect with SSH, create an administrator user, use SSH keys, and open only the needed ports:']),
  ...cmd('sudo apt update && sudo apt -y upgrade\nsudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable\ncurl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh\nsudo usermod -aG docker $USER && sudo systemctl enable docker      # log out and back in'),
  H2('6.2 Install'),
  ...cmd(`# from your laptop\nscp ${BUNDLE}.zip user@skills.yourdomain.com:/tmp/\n# on the VPS\nsudo mkdir -p /opt/cortexskills && sudo chown $USER /opt/cortexskills && cd /opt/cortexskills\nunzip /tmp/${BUNDLE}.zip && cd ${BUNDLE}\ndocker build -t ${IMG} .            # or: docker load -i cortexskills-image-${version}.tar.gz\ncp env.example .env && chmod 600 .env && nano .env`),
  table(['Setting', 'Value on the VPS'], [
    ['PUBLIC_URL, CORS_ORIGIN', 'https://skills.yourdomain.com'],
    ['DOMAIN', 'skills.yourdomain.com'],
    ['JWT_SECRET, CHANNEL_SECRET_KEY', 'Two different values of openssl rand -base64 48 | tr -d "\\n=+/"'],
    ['ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD', 'Your platform administrator (remove the password after the first start).'],
    ['SMTP_*', 'Your outgoing mail account, so invitations and reminders really leave.'],
  ], W2, { size: 18 }),
  ...cmd('docker compose -f docker-compose.yml -f compose.https.yml up -d\ndocker compose logs -f cortexskills          # wait for "CortexSkills API is running"\ncurl -s https://skills.yourdomain.com/api/health'),
  P('Caddy obtains the certificate at the first request (a few seconds). Then remove ADMIN_PASSWORD from .env and run the same up -d command again. Tip: define an alias to type less — alias csk="docker compose -f docker-compose.yml -f compose.https.yml".', { size: 20 }),
  H2('6.3 Run it'),
  ...[
    'Backups off the VPS every night — on your laptop or another server, for example with cron on the VPS: docker compose exec -T cortexskills cortexskills-admin backup, then docker compose cp cortexskills:/data/backups /opt/cortexskills/backups and rsync that folder to your backup host.',
    'Updates: same procedure as the customers (Customer guide, section 10.4).',
    'Several customer organizations can be activated on the same VPS: one org-create and one licence each; the licence file of the installation keeps one entry per organization.',
    'Cloud 2 sizing fits a pilot of up to about 100 active users; above, move to 4 vCPU / 8 GB.',
  ].map(t => bullet(t)),

  H1('7. Scenario 2 — Activate the licence of a customer on the VPS'),
  ...steps([[b('Create the organization on the VPS '), '(in /opt/cortexskills/' + BUNDLE + '):']]),
  ...cmd('docker compose exec cortexskills cortexskills-admin org-create --name "Clinique Exemple" --domain clinique-exemple.ma \\\n  --admin-email admin@clinique-exemple.ma --admin-name "Admin Clinique" --admin-password \'Str0ng#Passw0rd2026\' --lang fr\ndocker compose exec cortexskills cortexskills-admin licence-request --org clinique-exemple.ma'),
  ...steps([[b('Sign on your laptop '), '(signing workspace) with the Organization ID printed, exactly as in section 5.2.'], [b('Copy the file to the VPS '), 'into the licence/ folder of the bundle:']]),
  ...cmd(`scp ~/licences/Clinique_Exemple.lic user@skills.yourdomain.com:/opt/cortexskills/${BUNDLE}/licence/`),
  ...steps([[b('Install '), '(no restart):']]),
  ...cmd('docker compose exec cortexskills cortexskills-admin licence-install --file /licence/Clinique_Exemple.lic'),
  ...steps([[b('Check '), 'at https://skills.yourdomain.com: sign in with the customer administrator, Administration › Configuration & licence shows Active.']]),
  ...shot(SH('03_licence'), 'The licence installed and active, as tested on the Docker image of this release', 520),

  H1('8. A customer installing on its own servers'),
  P('The customer follows the Customer Installation Guide. Your part:'),
  ...steps(['Send the bundle (with your public key), optionally the prebuilt image, the checksums and the Customer Installation Guide.', 'Receive the lines printed by licence-request (Company and Organization ID).', 'Sign the licence in your signing workspace (section 5.2) and record it in your register.', 'Send the .lic file by e-mail. The customer installs it with licence-install; no restart, no remote access needed.', 'Renewal, more users, another plan: sign a new file with the same Organization ID; the customer installs it the same way or uploads it in the application.']),
  H2('8.1 Your licence register'),
  P('Keep one line per licence issued (a spreadsheet is enough):'),
  table(['Date', 'Company', 'Organization ID', 'Plan', 'Users', 'End date', 'File'], [['2026-10-16', 'Clinique Exemple', 'a35218b4-…', 'SME-GRO', '50', '2027-12-31', 'Clinique_Exemple.lic']], [1200, 1700, 1700, 1100, 800, 1300, 1846], { size: 16 }),

  H1('9. Security and limits'),
  ...[
    'The licence check uses an Ed25519 signature: a modified file, or one signed with another key, is refused. The public key sits at a fixed, read-only place in the image; no setting can point the application to another key.',
    'The application refuses to start in OnPrem production mode if a private key is present in its folder.',
    'As with any software installed at the customer, a determined administrator with full access to the server could alter the installation. The licence is a strong, auditable control, not an absolute lock: keep the licence terms in your contract (right to audit, number of users, end date).',
    'Never send the source code, the signing tool or the private key; never copy the private key to the VPS.',
  ].map(t => bullet(t)),

  H1('10. Troubleshooting'),
  table(['What you see', 'Cause', 'What to do'], [
    ['“The vendor PRIVATE key must never be on a customer server”', 'vendor-private.pem is in the application’s tools/keys folder.', 'Move it back to the signing workspace only; keep vendor-public.pem.'],
    ['“OnPrem mode needs the vendor public key”', 'vendor-public.pem missing from server/tools/keys (zip) or from the bundle (Docker).', 'Copy your public key there (zip) or rebuild the bundle with package-docker.sh.'],
    ['licence-install: “signature is not valid” on every customer', 'Licences signed with another key pair than the public key shipped.', 'Check the fingerprints (section 2); sign again in the right workspace.'],
    ['Laptop: “PUBLIC_URL must be the public HTTPS address”', 'PUBLIC_URL is not http://localhost:<port> or https://…', 'Use http://localhost:4000 on the laptop.'],
    ['npm run sign-licence fails (module not found)', 'You are in the application folder: it has no signing tool.', 'Go to the signing workspace: ~/CortexSkills-signing/server.'],
  ], [3000, 3000, 3646], { size: 16 }),

  H1('11. Command reference'),
  table(['Where', 'Command', 'Purpose'], [
    ['Signing workspace', 'npm run sign-licence -- --company … --companyId … --expiry … --maxUsers … --plan … --output …', 'Sign a licence'],
    ['Signing workspace', 'bash tools/package-docker.sh server/tools/keys/vendor-public.pem', 'Build the customer Docker bundle'],
    ['Laptop application', 'npm run init  ·  npm start  ·  npm run admin -- help  ·  npm run backup  ·  npm run restore -- <file>', 'Install, run, administer'],
    ['Docker (VPS or customer)', 'docker compose exec cortexskills cortexskills-admin help | org-create | org-list | licence-request | licence-install | backup', 'Administer the container'],
    ['Docker (VPS or customer)', 'docker compose run --rm --no-deps --entrypoint cortexskills-admin cortexskills restore <file>', 'Restore (container stopped)'],
  ], [2200, 5000, 2446], { size: 16 }),
];

fs.mkdirSync(out, { recursive: true });
const write = (body, title, credit, file) => D.Packer.toBuffer(document({ title, credit, sections: [body] })).then(buf => { fs.writeFileSync(path.join(out, file), buf); console.log('written', file); });
write(cust, 'CortexSkills — Installation Guide (Customer, Docker on Linux)', `CortexSkills ${version} · Installation Guide — Docker on Linux`, 'CortexSkills_Installation_Guide_Customer_Docker_Linux.docx')
  .then(() => write(ed, 'CortexSkills — Editor Installation and Licensing Guide', `CortexSkills ${version} · Editor installation and licensing`, 'CortexSkills_Editor_Installation_and_Licensing_Guide.docx'));
