// Builds the production installation guides (Word), each in English and French:
//   CortexSkills_Install_SaaS_{EN,FR}.docx                  — provider-hosted, many customer organizations
//   CortexSkills_Install_Dedicated_Cloud_OnPrem_{EN,FR}.docx — one installation per customer: public cloud, private cloud, on-premises
// Run: node build-prod-guides.cjs <outDir>; then python3 topdf.py <files> for the PDFs and the filled tables of contents.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, P, H1, H2, H3, bullet, code, callout, table, shot, cover, tocPage, document, spacer } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const CAT = JSON.parse(fs.readFileSync(path.join(__dirname, 'prod-catalog.json'), 'utf8'));
const LOGO = path.join(__dirname, '../../web/public/cortexskills-logo.png');

function build(kind, lang) {
  const fr = lang === 'fr'; const t = (en, f) => (fr ? f : en);
  const saas = kind === 'saas';
  let list = 0; const steps = items => { const ref = 'steps' + (list++ || ''); return items.map(x => B.numbered(x, ref)); };
  const S = f => path.join(__dirname, 'shots/prod', saas ? 'saas' : 'onprem', lang, f + '.png');
  const SS = f => path.join(__dirname, 'shots/prod/saas', lang, f + '.png');
  let fig = 0; const figure = (file, cap, w) => shot(file, `${t('Figure', 'Figure')} ${++fig} — ${cap}`, w);
  const nm = x => (typeof x === 'object' ? x[lang] || x.en : x);
  const ai = x => ({ Assistive: t('Assistive', 'Assistive'), 'Assistive+Augmented': t('Assistive and augmented', 'Assistive et augmentée') }[x] || x);
  const kindLabel = k => ({ pack: 'Pack', bundle: t('Bundle', 'Offre groupée'), sme: t('SME pack', 'Pack PME') }[k] || k);
  const B_ = text => ({ text, bold: true });
  const host = saas ? 'skills.example.com' : 'skills.customer.com';

  // ------------------------------------------------------------------ shared blocks
  const requirements = () => [
    H2(t('Server and network', 'Serveur et réseau')),
    table([t('Item', 'Élément'), t('Recommended', 'Recommandé'), t('Notes', 'Remarques')], [
      [t('Operating system', 'Système d’exploitation'), 'Ubuntu Server 22.04 / 24.04 LTS', t('Also works on Debian 12, RHEL 9 and Windows Server 2019/2022 (see the Windows chapter' + (saas ? ' of the Dedicated Cloud & On-Prem guide).' : ').'), 'Fonctionne aussi sur Debian 12, RHEL 9 et Windows Server 2019/2022 (voir le chapitre Windows' + (saas ? ' du guide Cloud dédié et On-Prem).' : ').'))],
      ['Node.js', '22 LTS (22.13 ' + t('or newer', 'ou plus récent') + ')', t('The only runtime needed. The database is built into Node.js (SQLite): no database server to install.', 'Le seul environnement d’exécution nécessaire. La base de données est intégrée à Node.js (SQLite) : aucun serveur de base de données à installer.')],
      [t('Reverse proxy', 'Proxy inverse'), 'Nginx ' + t('or', 'ou') + ' Caddy (Linux), IIS (Windows)', t('Terminates HTTPS and forwards to CortexSkills on 127.0.0.1:4000.', 'Termine le HTTPS et transmet à CortexSkills sur 127.0.0.1:4000.')],
      [t('Domain name', 'Nom de domaine'), host, t('A DNS record pointing to the server (or to the load balancer).', 'Un enregistrement DNS pointant vers le serveur (ou vers l’équilibreur de charge).')],
      [t('TLS certificate', 'Certificat TLS'), t('Let’s Encrypt (automatic) or your company certificate', 'Let’s Encrypt (automatique) ou le certificat de l’entreprise'), t('HTTPS is mandatory in production: the server refuses to start without an https:// public address.', 'Le HTTPS est obligatoire en production : le serveur refuse de démarrer sans adresse publique https://.')],
      [t('Open ports', 'Ports ouverts'), '443 (HTTPS), 80 ' + t('(redirect only)', '(redirection seulement)'), t('Port 4000 stays closed to the outside; only the reverse proxy reaches it.', 'Le port 4000 reste fermé vers l’extérieur ; seul le proxy inverse y accède.')],
      [t('Outbound access', 'Accès sortant'), t('SMTP server; WhatsApp Cloud API (optional); AI provider (optional)', 'Serveur SMTP ; API WhatsApp Cloud (optionnel) ; fournisseur d’IA (optionnel)'), t('Only needed for the channels and AI features you use.', 'Nécessaire uniquement pour les canaux et fonctions d’IA utilisés.')],
    ], [2100, 3000, 4646]),
    spacer(),
    H2(t('Sizing', 'Dimensionnement')),
    P(t('CortexSkills runs as one Node.js process with an embedded database. It scales up (a larger server), not out. The sizes below are recommendations for active users at the same time of day; monitor the server and adjust.', 'CortexSkills fonctionne comme un seul processus Node.js avec une base de données intégrée. Il se dimensionne en hauteur (un serveur plus puissant), pas en largeur. Les tailles ci-dessous sont des recommandations pour des utilisateurs actifs au même moment ; surveillez le serveur et ajustez.')),
    table([t('Users (total)', 'Utilisateurs (total)'), 'vCPU', t('Memory', 'Mémoire'), t('SSD disk', 'Disque SSD'), t('Example', 'Exemple')], [
      [t('up to 500', 'jusqu’à 500'), '2', '4 GB', '40 GB', 'Azure B2ms · AWS t3.medium · GCP e2-medium'],
      ['500 – 3 000', '4', '8 GB', '100 GB', 'Azure D4s v5 · AWS m6i.xlarge · GCP e2-standard-4'],
      [t('3 000 – 10 000', '3 000 – 10 000'), '8', '16 GB', '250 GB', 'Azure D8s v5 · AWS m6i.2xlarge · GCP e2-standard-8'],
    ], [1900, 900, 1200, 1300, 4446]),
    spacer(),
    callout(t('Disk space', 'Espace disque'), [t('Plan the disk for the data folder (database + attached files + 30 days of daily backups). A database of 1 GB with 30 backups needs about 31 GB. Put the data folder on a disk that is snapshotted or backed up.', 'Prévoyez le disque pour le dossier de données (base + fichiers joints + 30 jours de sauvegardes quotidiennes). Une base de 1 Go avec 30 sauvegardes demande environ 31 Go. Placez le dossier de données sur un disque sauvegardé ou pris en instantané.')]),
  ];

  const linuxInstall = mode => [
    H2(t('Step 1 — Install Node.js 22 LTS', 'Étape 1 — Installer Node.js 22 LTS')),
    P(t('Connect to the server with SSH as a user with sudo rights, then type:', 'Connectez-vous au serveur en SSH avec un utilisateur disposant des droits sudo, puis tapez :')),
    code('curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -'), code('sudo apt-get install -y nodejs unzip'), code('node -v'),
    P(t('The last command must print v22.13 or higher.', 'La dernière commande doit afficher v22.13 ou plus.')),
    H2(t('Step 2 — Create the service account and the folders', 'Étape 2 — Créer le compte de service et les dossiers')),
    code('sudo useradd --system --home /opt/cortexskills --shell /usr/sbin/nologin cortexskills'),
    code('sudo mkdir -p /opt/cortexskills /var/lib/cortexskills /var/log/cortexskills'),
    H2(t('Step 3 — Copy and unzip the application', 'Étape 3 — Copier et décompresser l’application')),
    P(t('Copy CortexSkills-app.zip to the server (for example with scp or WinSCP), then:', 'Copiez CortexSkills-app.zip sur le serveur (par exemple avec scp ou WinSCP), puis :')),
    code('cd /tmp && unzip -q CortexSkills-app.zip'), code('sudo cp -r /tmp/CortexSkills/. /opt/cortexskills/'),
    P(t('The folder now holds server (the application and its tools), web/dist (the screens, already built) and deploy (the configuration files used in this guide).', 'Le dossier contient maintenant server (l’application et ses outils), web/dist (les écrans, déjà construits) et deploy (les fichiers de configuration utilisés dans ce guide).')),
    H2(t('Step 4 — Install the components', 'Étape 4 — Installer les composants')),
    code('cd /opt/cortexskills/server && sudo npm ci --omit=dev'),
    P(t('This downloads the components listed in package-lock.json (1 to 3 minutes). The server needs Internet access to the npm registry for this step only; for a server without Internet access, see “Installing without Internet access”.', 'Cette commande télécharge les composants listés dans package-lock.json (1 à 3 minutes). Le serveur a besoin d’un accès Internet au registre npm uniquement pour cette étape ; pour un serveur sans Internet, voir « Installer sans accès Internet ».')),
    H2(t('Step 5 — Write the configuration file (.env)', 'Étape 5 — Écrire le fichier de configuration (.env)')),
    code('sudo cp /opt/cortexskills/deploy/env.production.example /opt/cortexskills/server/.env'),
    code('cd /opt/cortexskills/server && npm run -s secrets'),
    P(t('The second command prints three new random secrets. Open the .env file (sudo nano .env) and fill it as below:', 'La seconde commande affiche trois nouveaux secrets aléatoires. Ouvrez le fichier .env (sudo nano .env) et remplissez-le comme ci-dessous :')),
    table([t('Setting', 'Paramètre'), t('Value to type', 'Valeur à saisir')], [
      ['NODE_ENV', 'production'],
      ['DEPLOYMENT_MODE', mode === 'saas' ? 'saas' : 'onprem'],
      ['PUBLIC_URL / CORS_ORIGIN', `https://${host}`],
      ['TRUST_PROXY', t('loopback (the reverse proxy is on the same server)', 'loopback (le proxy inverse est sur le même serveur)')],
      ['JWT_SECRET, CHANNEL_SECRET_KEY', t('the values printed by npm run secrets', 'les valeurs affichées par npm run secrets')],
      ['LICENSE_HMAC_SECRET', mode === 'saas' ? t('the value printed by npm run secrets (signs the customer licences)', 'la valeur affichée par npm run secrets (signe les licences clients)') : t('leave empty (not used: the licence is a vendor-signed file)', 'laisser vide (non utilisé : la licence est un fichier signé par l’éditeur)')],
      ['DATA_DIR', '/var/lib/cortexskills'],
      ['BACKUP_RETENTION_DAYS / BACKUP_COPY_DIR', t('30 / a mounted folder on another machine or cloud storage', '30 / un dossier monté sur une autre machine ou un stockage cloud')],
      ['ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD', t('the first platform administrator (used once by npm run init)', 'le premier administrateur de la plateforme (utilisé une fois par npm run init)')],
      ['SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM', t('the platform e-mail server (invitations, reminders)', 'le serveur de messagerie de la plateforme (invitations, relances)')],
      ['WHATSAPP_*', t('optional: WhatsApp Business Cloud API', 'optionnel : API WhatsApp Business Cloud')],
    ], [3900, 5846]),
    spacer(),
    callout(t('Keep the secrets safe', 'Protégez les secrets'), [t('Store a copy of the .env file in your password vault. Changing JWT_SECRET signs every user out; changing CHANNEL_SECRET_KEY makes the stored channel passwords unreadable' + (mode === 'saas' ? '; changing LICENSE_HMAC_SECRET invalidates every customer licence (re-issue them with npm run admin -- licence).' : '.'), 'Conservez une copie du fichier .env dans votre coffre-fort de mots de passe. Changer JWT_SECRET déconnecte tous les utilisateurs ; changer CHANNEL_SECRET_KEY rend illisibles les mots de passe des canaux enregistrés' + (mode === 'saas' ? ' ; changer LICENSE_HMAC_SECRET invalide toutes les licences clients (réémettez-les avec npm run admin -- licence).' : '.'))]),
    ...(mode === 'saas' ? [] : [
      H2(t('Step 6 — Place the vendor public key', 'Étape 6 — Déposer la clé publique de l’éditeur')),
      P(t('The vendor sends vendor-public.pem with the licence. It lets the server check that the licence file was signed by the vendor and not modified.', 'L’éditeur envoie vendor-public.pem avec la licence. Elle permet au serveur de vérifier que le fichier de licence a été signé par l’éditeur et n’a pas été modifié.')),
      code('sudo mkdir -p /opt/cortexskills/server/tools/keys'), code('sudo cp vendor-public.pem /opt/cortexskills/server/tools/keys/'),
      callout(t('Never the private key', 'Jamais la clé privée'), [t('Only the public key goes on the customer server. If a file named vendor-private.pem is found in tools/keys, the server refuses to start.', 'Seule la clé publique va sur le serveur du client. Si un fichier vendor-private.pem est présent dans tools/keys, le serveur refuse de démarrer.')], B.C.light),
    ]),
    H2(t(`Step ${mode === 'saas' ? 6 : 7} — Create the production database`, `Étape ${mode === 'saas' ? 6 : 7} — Créer la base de production`)),
    code('sudo chown -R cortexskills:cortexskills /opt/cortexskills /var/lib/cortexskills /var/log/cortexskills'),
    code('cd /opt/cortexskills/server && sudo -u cortexskills npm run init'),
    P(t('npm run init builds the reference catalog (process design, packs, sectors, document templates), creates the platform administrator from ADMIN_EMAIL / ADMIN_PASSWORD and takes a first backup. It holds no demonstration data and no customer organization. It takes a few seconds and prints:', 'npm run init construit le catalogue de référence (conception des processus, packs, secteurs, modèles de documents), crée l’administrateur de la plateforme à partir de ADMIN_EMAIL / ADMIN_PASSWORD et réalise une première sauvegarde. Elle ne contient ni données de démonstration ni organisation cliente. Elle prend quelques secondes et affiche :')),
    code('Production database ready in 1 s: reference catalog, 261 library records, no organization.'),
    bullet(t('The password must have at least 12 characters, with upper and lower case letters, a digit and a symbol; otherwise init stops and says why.', 'Le mot de passe doit comporter au moins 12 caractères, avec majuscules, minuscules, un chiffre et un symbole ; sinon init s’arrête et indique pourquoi.')),
    bullet(t('Then remove the ADMIN_PASSWORD line from .env.', 'Supprimez ensuite la ligne ADMIN_PASSWORD du fichier .env.')),
    bullet(t('npm run init refuses to run on a database that already holds organizations. npm run seed (demonstration data) is disabled in production.', 'npm run init refuse de s’exécuter sur une base qui contient déjà des organisations. npm run seed (données de démonstration) est désactivé en production.')),
    H2(t(`Step ${mode === 'saas' ? 7 : 8} — Run CortexSkills as a service`, `Étape ${mode === 'saas' ? 7 : 8} — Exécuter CortexSkills comme service`)),
    code('sudo cp /opt/cortexskills/deploy/cortexskills.service /etc/systemd/system/'),
    code('sudo systemctl daemon-reload && sudo systemctl enable --now cortexskills'),
    code('sudo systemctl status cortexskills'),
    P(t('The service starts with the server, restarts automatically after a failure and writes its log to /var/log/cortexskills. The first lines of the log show:', 'Le service démarre avec le serveur, redémarre automatiquement après un incident et écrit son journal dans /var/log/cortexskills. Les premières lignes du journal indiquent :')),
    code(`CortexSkills API is running on http://localhost:4000  (mode: ${mode === 'saas' ? 'saas' : 'onprem'}, production)`), code(`Open the application at https://${host}.`),
    callout(t('Safety check at start-up', 'Contrôle de sécurité au démarrage'), [t('In production the server refuses to start while a setting is unsafe and lists each problem with the fix: a missing or development secret, the same value for two secrets, a public address that is not https://, CORS_ORIGIN=*, demonstration data' + (mode === 'saas' ? '.' : ', a missing vendor public key or a vendor private key on the server.'), 'En production, le serveur refuse de démarrer tant qu’un paramètre n’est pas sûr et liste chaque problème avec sa correction : secret absent ou de développement, même valeur pour deux secrets, adresse publique non https://, CORS_ORIGIN=*, données de démonstration' + (mode === 'saas' ? '.' : ', clé publique de l’éditeur absente ou clé privée de l’éditeur présente sur le serveur.')), t('Read the reason with: sudo tail -n 20 /var/log/cortexskills/cortexskills-error.log', 'Lisez la raison avec : sudo tail -n 20 /var/log/cortexskills/cortexskills-error.log')]),
    H2(t(`Step ${mode === 'saas' ? 8 : 9} — Publish it in HTTPS`, `Étape ${mode === 'saas' ? 8 : 9} — Publier en HTTPS`)),
    H3(t('Option A — Nginx with Let’s Encrypt', 'Option A — Nginx avec Let’s Encrypt')),
    code('sudo apt-get install -y nginx certbot python3-certbot-nginx'),
    code(`sudo certbot certonly --nginx -d ${host}`),
    code('sudo cp /opt/cortexskills/deploy/nginx-cortexskills.conf /etc/nginx/sites-available/cortexskills'),
    P(t(`Replace skills.example.com with ${host} in the file, then:`, `Remplacez skills.example.com par ${host} dans le fichier, puis :`)),
    code('sudo ln -s /etc/nginx/sites-available/cortexskills /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx'),
    H3(t('Option B — Caddy (automatic certificate)', 'Option B — Caddy (certificat automatique)')),
    P(t(`Install Caddy (caddyserver.com), copy deploy/Caddyfile to /etc/caddy/Caddyfile, replace the address with ${host} and run sudo systemctl reload caddy. Caddy obtains and renews the certificate by itself.`, `Installez Caddy (caddyserver.com), copiez deploy/Caddyfile vers /etc/caddy/Caddyfile, remplacez l’adresse par ${host} et lancez sudo systemctl reload caddy. Caddy obtient et renouvelle le certificat lui-même.`)),
    H3(t('Option C — Company certificate', 'Option C — Certificat de l’entreprise')),
    P(t('With a certificate from your own certificate authority (common in private clouds and on-premises), keep the Nginx file and point ssl_certificate and ssl_certificate_key to your certificate (full chain) and private key.', 'Avec un certificat de votre propre autorité de certification (fréquent en cloud privé et sur site), gardez le fichier Nginx et faites pointer ssl_certificate et ssl_certificate_key vers votre certificat (chaîne complète) et sa clé privée.')),
    H2(t(`Step ${mode === 'saas' ? 9 : 10} — Check the installation`, `Étape ${mode === 'saas' ? 9 : 10} — Vérifier l’installation`)),
    code(`curl https://${host}/api/health`),
    P(t('The answer must be:', 'La réponse doit être :')),
    code(`{"status":"ok","initialized":true,"mode":"${mode === 'saas' ? 'saas' : 'onprem'}","version":"${version}"}`),
    P(t(`Then open https://${host} in a browser and sign in with the platform administrator account (ADMIN_EMAIL).`, `Ouvrez ensuite https://${host} dans un navigateur et connectez-vous avec le compte administrateur de la plateforme (ADMIN_EMAIL).`)),
  ];

  const orgCreate = (dom, nameEx, pack, seats) => [
    code(`cd /opt/cortexskills/server`),
    code(`sudo -u cortexskills npm run -s admin -- org-create --name "${nameEx}" --domain ${dom} --segment LARGE --sector HCPR --pack ${pack} --seats ${seats} --days 365 --lang ${fr ? 'fr' : 'en'} --country Morocco --city Casablanca --admin-email dsi@${dom} --admin-name "Nadia Benali" --admin-password "Choose#AStrong1"`),
    P(t('The console prints the Organization ID and the administrator account:', 'La console affiche l’identifiant de l’organisation et le compte administrateur :')),
    code(`Organization created: ${nameEx}`), code('Organization ID: 5c2f2728-9f25-4059-af3e-931b36b51b20'),
    code(`Pack: ${pack} · seats: ${seats} · licence valid 365 days${saas ? '' : ' (OnPrem: upload the vendor-signed licence to activate it)'}`),
    code(`Administrator: dsi@${dom} (role R-01, full rights in this organization)`),
    table([t('Option', 'Option'), t('Meaning', 'Signification')], [
      ['--name / --domain', t('Company name; e-mail domain of its users (unique per organization)', 'Nom de l’entreprise ; domaine e-mail de ses utilisateurs (unique par organisation)')],
      ['--segment', t('LARGE (default) or SME', 'LARGE (par défaut) ou SME (PME)')],
      ['--sector', t('Sector code (for example HCPR private healthcare); the console lists the valid codes if you type a wrong one', 'Code secteur (par exemple HCPR santé privée) ; la console liste les codes valides en cas d’erreur')],
      ['--pack / --seats / --days', t('Contracted pack, number of users and licence duration', 'Pack contractuel, nombre d’utilisateurs et durée de la licence')],
      ['--lang / --country / --city', t('Default language (en, fr, ar) and location', 'Langue par défaut (en, fr, ar) et localisation')],
      ['--admin-email / --admin-name / --admin-password', t('The customer’s first administrator (role R-01). A strong password is required.', 'Le premier administrateur du client (rôle R-01). Un mot de passe fort est exigé.')],
    ], [3600, 6146]),
  ];

  const packCatalog = () => [
    H2(t('The catalogue', 'Le catalogue')),
    P(t('A customer organization always has exactly one Solution Pack (a pack, a bundle or an SME pack). Add-ons and compliance standards are independent and can be added to any pack. Changing a pack keeps all the data: modules outside the new pack become read-only, never deleted.', 'Une organisation cliente a toujours exactement une offre (un pack, une offre groupée ou un pack PME). Les add-ons et les normes de conformité sont indépendants et s’ajoutent à n’importe quelle offre. Changer d’offre conserve toutes les données : les modules hors de la nouvelle offre passent en lecture seule, ils ne sont jamais supprimés.')),
    table(['ID', t('Name', 'Nom'), 'Type', t('Contains', 'Contient'), t('AI tier', 'Niveau d’IA'), t('Price', 'Prix')],
      CAT.p.map(p => [B_(p.id), nm(p.name), kindLabel(p.kind), (p.packs || []).join(', ') + (p.addons?.length ? ' + ' + p.addons.join(', ') : ''), ai(p.ai), nm(p.rule) || '$' + p.price]), [950, 2300, 1000, 1700, 1300, 2500], { size: 17 }),
    B.caption(t('Packs, bundles and SME packs (list prices of the catalogue; your contract prevails).', 'Packs, offres groupées et packs PME (prix catalogue ; votre contrat prévaut).')),
    table(['ID', t('Add-on', 'Add-on'), t('Price', 'Prix')], CAT.a.map(a => [B_(a.id), nm(a.name), '$' + a.price + t(' / month', ' / mois')]), [1000, 6746, 2000], { size: 18 }),
    B.caption(t('Add-ons.', 'Add-ons.')),
    table(['ID', t('Compliance & security standard', 'Norme de conformité et de sécurité')], CAT.c.map(c => [B_(c.id), nm(c.name)]), [2000, 7746], { size: 18 }),
    B.caption(t('Compliance standards. CortexSkills organizes the evidence; it does not certify compliance.', 'Normes de conformité. CortexSkills organise les éléments probants ; il ne certifie pas la conformité.')),
    P([t('On the server, the console prints the same catalogue: ', 'Sur le serveur, la console affiche le même catalogue : '), { text: 'npm run -s admin -- packs', bold: true }]),
  ];

  const licenceStates = () => [
    H2(t('Licence states', 'États de la licence')),
    table([t('State', 'État'), t('When', 'Quand'), t('What users see', 'Ce que voient les utilisateurs')], [
      [t('Active', 'Active'), t('More than 30 days before the expiry date', 'Plus de 30 jours avant l’échéance'), t('Normal use.', 'Utilisation normale.')],
      [t('Warning', 'Alerte'), t('30 days or less before expiry', '30 jours ou moins avant l’échéance'), t('A banner reminds the administrator to renew.', 'Un bandeau rappelle à l’administrateur de renouveler.')],
      [t('Expired', 'Expirée'), t('After the expiry date', 'Après l’échéance'), t('Read-only: users can sign in and read, not change.', 'Lecture seule : les utilisateurs se connectent et consultent, sans modifier.')],
      [t('Inactive', 'Inactive'), t('No licence for the organization', 'Aucune licence pour l’organisation'), t('Sign-in is refused with “The licence of this Organization is not active”.', 'La connexion est refusée avec « La licence de cette organisation n’est pas active ».')],
    ], [1700, 3400, 4646], { fills: [[ 'D9EAD3' ], [ 'FBE0B5' ], [ 'F4C7C3' ], [ 'F4C7C3' ]] }),
    spacer(),
    P(t('The number of users is enforced: when the active users reach the licence maximum, creating a new user is refused until a user is deactivated or the licence is extended.', 'Le nombre d’utilisateurs est contrôlé : quand les utilisateurs actifs atteignent le maximum de la licence, la création d’un nouvel utilisateur est refusée jusqu’à la désactivation d’un utilisateur ou l’extension de la licence.')),
  ];

  const customerScreens = (withSwitch = true) => [
    H2(t('The Configuration & licence screen', 'L’écran Configuration et licence')),
    P(t('Menu: Administration › Configuration & licence. The four tiles show the current pack, the number of modules included, the AI tier and the licence state. The Licence card shows the deployment mode, the plan, the maximum number of users, the expiry date and the active add-ons.', 'Menu : Administration › Configuration et licence. Les quatre tuiles indiquent l’offre actuelle, le nombre de modules inclus, le niveau d’IA et l’état de la licence. La carte Licence indique le mode de déploiement, le plan, le nombre maximal d’utilisateurs, l’échéance et les add-ons actifs.')),
    ...figure(S('config'), t('Administration › Configuration & licence', 'Administration › Configuration et licence')),
    ...(withSwitch ? [
    H2(t('Change the pack', 'Changer d’offre')),
    ...steps([t('In the Solution Packs table, find the pack you want and click Switch.', 'Dans le tableau Packs, repérez l’offre souhaitée et cliquez sur Changer.'), t('Read the proration (credit for the days left on the current pack, charge for the new one) and type the justification (for example the purchase order number).', 'Lisez le prorata (avoir pour les jours restants de l’offre actuelle, montant de la nouvelle) et saisissez la justification (par exemple le numéro de bon de commande).'), t('Confirm. The new modules appear in the menu at once; the change, its justification and the proration are kept in the audit trail.', 'Confirmez. Les nouveaux modules apparaissent aussitôt dans le menu ; le changement, sa justification et le prorata sont conservés dans la piste d’audit.')]),
    ...figure(S('packs'), t('The Solution Packs table: the current pack is marked “Current”', 'Le tableau des offres : l’offre actuelle est marquée « Actuelle »')),
    ] : []),
    H2(t('Activate an add-on', 'Activer un add-on')),
    P(t('In the Add-ons section, tick the box of the add-on. It becomes Active and its screens appear for the users who have the permission. Untick to deactivate it (its data is kept).', 'Dans la section Add-ons, cochez la case de l’add-on. Il devient Actif et ses écrans apparaissent pour les utilisateurs qui ont la permission. Décochez pour le désactiver (ses données sont conservées).')),
    ...figure(S('addons'), t('Add-ons: one tick box per add-on', 'Add-ons : une case à cocher par add-on')),
    H2(t('Activate a compliance standard', 'Activer une norme de conformité')),
    P(t('In Compliance & security standards, tick the standard. The first activation creates its controls once (for example 4 controls for ISO/IEC 27001) in the controls register. Deactivating keeps the controls. Read the notice: the application organizes the evidence; only an accredited body can certify.', 'Dans Normes de conformité et de sécurité, cochez la norme. La première activation crée une seule fois ses contrôles (par exemple 4 contrôles pour ISO/IEC 27001) dans le registre des contrôles. La désactivation conserve les contrôles. Lisez l’avertissement : l’application organise les éléments probants ; seul un organisme accrédité peut certifier.')),
    ...figure(S('compliance'), t('Compliance & security standards', 'Normes de conformité et de sécurité')),
  ];

  const customerFirstSteps = () => [
    H2(t('First sign-in and password', 'Première connexion et mot de passe')),
    ...steps([t(`Open https://${host} and sign in with the administrator e-mail and the temporary password received from ${saas ? 'the provider' : 'your IT team or the vendor'}.`, `Ouvrez https://${host} et connectez-vous avec l’e-mail administrateur et le mot de passe temporaire reçus ${saas ? 'du fournisseur' : 'de votre équipe informatique ou de l’éditeur'}.`), t('Click the profile icon (top right), then Change password.', 'Cliquez sur l’icône de profil (en haut à droite), puis sur Changer le mot de passe.'), t('Type the current password, then the new one twice (12 characters or more, upper and lower case, a digit and a symbol) and click Save.', 'Saisissez le mot de passe actuel, puis le nouveau deux fois (12 caractères ou plus, majuscules, minuscules, un chiffre et un symbole) et cliquez sur Enregistrer.')]),
    ...figure(SS('menu'), t('The profile menu', 'Le menu du profil'), 320),
    ...figure(SS('password'), t('Change password', 'Changer le mot de passe'), 380),
    H2(t('Check the licence', 'Vérifier la licence')),
    P(t('Open Administration › Configuration & licence and check the Licence card: status Active, the plan and the number of users of your contract, the expiry date. If something is wrong, contact ' + (saas ? 'the provider' : 'the vendor') + ' before inviting users.', 'Ouvrez Administration › Configuration et licence et vérifiez la carte Licence : statut Actif, le plan et le nombre d’utilisateurs de votre contrat, l’échéance. En cas d’écart, contactez ' + (saas ? 'le fournisseur' : 'l’éditeur') + ' avant d’inviter les utilisateurs.')),
    H2(t('Create the users', 'Créer les utilisateurs')),
    ...steps([t('Open Administration › Users and click New user.', 'Ouvrez Administration › Utilisateurs et cliquez sur Nouvel utilisateur.'), t('Type the name, the e-mail, the job title, the language and a temporary password; choose the role (for example Head of Learning & Development, Training Manager, Process Owner, Employee).', 'Saisissez le nom, l’e-mail, la fonction, la langue et un mot de passe temporaire ; choisissez le rôle (par exemple Responsable formation et développement, Chargé de formation, Propriétaire de processus, Collaborateur).'), t('Send each user the address of the application and the temporary password, and ask them to change it at first sign-in (profile › Change password).', 'Envoyez à chaque utilisateur l’adresse de l’application et le mot de passe temporaire, et demandez-lui de le changer à la première connexion (profil › Changer le mot de passe).')]),
    ...figure(S('users'), t('Administration › Users', 'Administration › Utilisateurs')),
    H2(t('Finish the set-up', 'Terminer la configuration')),
    table([t('Menu', 'Menu'), t('What to do', 'Que faire')], [
      [t('Administration › Channels (e-mail, WhatsApp)', 'Administration › Canaux (e-mail, WhatsApp)'), t('Enter your own e-mail server (optional: otherwise the platform e-mail is used) and, if you use it, your WhatsApp Business account. Send a test message.', 'Saisissez votre propre serveur de messagerie (optionnel : sinon la messagerie de la plateforme est utilisée) et, si vous l’utilisez, votre compte WhatsApp Business. Envoyez un message de test.')],
      [t('Administration › AI settings', 'Administration › Paramètres IA'), t('Choose the AI provider and model, or keep the assistant off.', 'Choisissez le fournisseur et le modèle d’IA, ou laissez l’assistant désactivé.')],
      [t('Administration › Permission matrix', 'Administration › Matrice des permissions'), t('Review what each role can see and do; adapt it to your organization.', 'Vérifiez ce que chaque rôle peut voir et faire ; adaptez-le à votre organisation.')],
      [t('Portfolio › Groups & organizations', 'Portefeuille › Groupes et organisations'), t('Build the organization structure (directorates, departments, units) and assign the people.', 'Construisez la structure de l’organisation (directions, départements, unités) et affectez les personnes.')],
      [t('Administration › SME onboarding', 'Administration › Intégration PME'), t('SME packs only: answer the short onboarding questions; the guided track is prepared for you.', 'Packs PME uniquement : répondez aux questions d’intégration ; le parcours guidé est préparé pour vous.')],
      [t('Administration › Backups & health', 'Administration › Sauvegardes et santé'), t('See the last backups and the health of the service' + (saas ? ' (operated by the provider).' : '.'), 'Consultez les dernières sauvegardes et la santé du service' + (saas ? ' (exploité par le fournisseur).' : '.'))],
    ], [3500, 6246]),
    spacer(),
    P(t('Then create the first project (Portfolio › New project): the users find their tasks in My tasks. The User Guide and the Administrator Guide describe each screen in detail.', 'Créez ensuite le premier projet (Portefeuille › Nouveau projet) : les utilisateurs trouvent leurs tâches dans Mes tâches. Le Guide utilisateur et le Guide administrateur décrivent chaque écran en détail.')),
  ];

  const operations = mode => [
    H2(t('Backups', 'Sauvegardes')),
    bullet(t('The server takes a backup of the database every day (data folder › backups) and keeps it BACKUP_RETENTION_DAYS days. Each backup is also copied to BACKUP_COPY_DIR when it is set: mount there a folder of another machine or of cloud storage.', 'Le serveur sauvegarde la base chaque jour (dossier de données › backups) et la conserve BACKUP_RETENTION_DAYS jours. Chaque sauvegarde est aussi copiée dans BACKUP_COPY_DIR s’il est renseigné : montez-y un dossier d’une autre machine ou d’un stockage cloud.')),
    bullet(t('Take a backup at any time, for example before an update:', 'Faites une sauvegarde à tout moment, par exemple avant une mise à jour :')), code('cd /opt/cortexskills/server && sudo -u cortexskills npm run backup'),
    bullet(t('The attached files (data folder › attachments) are not inside the database backup: include the whole data folder in your file backup or disk snapshots.', 'Les fichiers joints (dossier de données › attachments) ne sont pas dans la sauvegarde de la base : incluez tout le dossier de données dans votre sauvegarde de fichiers ou vos instantanés de disque.')),
    H3(t('Restore a backup', 'Restaurer une sauvegarde')),
    ...steps([t('Stop the service: sudo systemctl stop cortexskills', 'Arrêtez le service : sudo systemctl stop cortexskills'), t('In /var/lib/cortexskills, move cortexskills.db (and the files cortexskills.db-wal and cortexskills.db-shm if present) to a safe folder.', 'Dans /var/lib/cortexskills, déplacez cortexskills.db (et les fichiers cortexskills.db-wal et cortexskills.db-shm s’ils existent) dans un dossier de côté.'), t('Copy the chosen file from backups (or from BACKUP_COPY_DIR) to /var/lib/cortexskills/cortexskills.db and give it to the cortexskills user (chown).', 'Copiez le fichier choisi depuis backups (ou depuis BACKUP_COPY_DIR) vers /var/lib/cortexskills/cortexskills.db et attribuez-le à l’utilisateur cortexskills (chown).'), t('Start the service: sudo systemctl start cortexskills. A backup from an earlier version is upgraded automatically at start-up.', 'Démarrez le service : sudo systemctl start cortexskills. Une sauvegarde d’une version antérieure est mise à niveau automatiquement au démarrage.')]),
    H2(t('Updating to a new version', 'Mettre à jour vers une nouvelle version')),
    ...steps([t('Take a backup (npm run backup) and stop the service.', 'Faites une sauvegarde (npm run backup) et arrêtez le service.'), t('Keep server/.env' + (mode === 'saas' ? '' : ' and server/tools/keys/vendor-public.pem') + '. The data folder (/var/lib/cortexskills) is outside the application folder and is not touched.', 'Conservez server/.env' + (mode === 'saas' ? '' : ' et server/tools/keys/vendor-public.pem') + '. Le dossier de données (/var/lib/cortexskills) est hors du dossier de l’application et n’est pas modifié.'), t('Unzip the new CortexSkills-app.zip over /opt/cortexskills, put back the kept file(s), then run: cd /opt/cortexskills/server && sudo npm ci --omit=dev', 'Décompressez le nouveau CortexSkills-app.zip sur /opt/cortexskills, remettez le(s) fichier(s) conservé(s), puis lancez : cd /opt/cortexskills/server && sudo npm ci --omit=dev'), t('Give the folder back to the service account (chown -R cortexskills:cortexskills /opt/cortexskills) and start the service. Database changes are applied automatically at start-up.', 'Rendez le dossier au compte de service (chown -R cortexskills:cortexskills /opt/cortexskills) et démarrez le service. Les évolutions de la base sont appliquées automatiquement au démarrage.')]),
    H2(t('Monitoring and logs', 'Supervision et journaux')),
    bullet([t('Health check for your monitoring tool: ', 'Contrôle de santé pour votre outil de supervision : '), { text: `GET https://${host}/api/health`, bold: true }, t(' (status ok).', ' (status ok).')]),
    bullet(t('Each API request is written as one JSON line (time, method, path, status, duration, client address, user) in /var/log/cortexskills/cortexskills.log; errors go to cortexskills-error.log. Rotate them with logrotate.', 'Chaque requête API est écrite sur une ligne JSON (heure, méthode, chemin, statut, durée, adresse du client, utilisateur) dans /var/log/cortexskills/cortexskills.log ; les erreurs vont dans cortexskills-error.log. Faites-les tourner avec logrotate.')),
    bullet(t('Every administrative change (pack, add-on, licence, users, password change) is in the audit trail of the organization.', 'Chaque changement administratif (offre, add-on, licence, utilisateurs, changement de mot de passe) figure dans la piste d’audit de l’organisation.')),
    H2(t('Security checklist', 'Liste de contrôle sécurité')),
    table(['✓', t('Check', 'Contrôle')], [
      ['☐', t('HTTPS only; port 4000 not reachable from outside (firewall).', 'HTTPS uniquement ; port 4000 inaccessible depuis l’extérieur (pare-feu).')],
      ['☐', t('.env readable only by root and cortexskills (chmod 600); a copy in the password vault.', '.env lisible seulement par root et cortexskills (chmod 600) ; une copie dans le coffre-fort de mots de passe.')],
      ['☐', t('ADMIN_PASSWORD removed from .env after npm run init.', 'ADMIN_PASSWORD supprimé du fichier .env après npm run init.')],
      ['☐', t('Backups copied off the server (BACKUP_COPY_DIR) and a restore tested once.', 'Sauvegardes copiées hors du serveur (BACKUP_COPY_DIR) et une restauration testée une fois.')],
      ['☐', t('Operating system updates applied every month; Node.js kept on the 22 LTS line.', 'Mises à jour du système appliquées chaque mois ; Node.js maintenu sur la branche 22 LTS.')],
      ...(mode === 'saas' ? [] : [['☐', t('Only vendor-public.pem in server/tools/keys (never vendor-private.pem).', 'Seulement vendor-public.pem dans server/tools/keys (jamais vendor-private.pem).')]]),
      ['☐', t('Every administrator changed the temporary password at first sign-in.', 'Chaque administrateur a changé son mot de passe temporaire à la première connexion.')],
    ], [700, 9046]),
  ];

  const troubleshooting = mode => [
    table([t('Message or symptom', 'Message ou symptôme'), t('What to do', 'Que faire')], [
      [t('“CortexSkills will not start in production mode” followed by a list', '« CortexSkills will not start in production mode » suivi d’une liste'), t('Fix each line in server/.env (or in server/tools/keys), then start again. npm run secrets generates the secrets.', 'Corrigez chaque ligne dans server/.env (ou dans server/tools/keys), puis redémarrez. npm run secrets génère les secrets.')],
      [t('“The database holds the demonstration data”', '« The database holds the demonstration data »'), t('The database was created with npm run seed. Initialize a production database: npm run init -- --wipe-all-data (erases everything).', 'La base a été créée avec npm run seed. Initialisez une base de production : npm run init -- --wipe-all-data (efface tout).')],
      [t('“The database already holds N organization(s)” (npm run init)', '« The database already holds N organization(s) » (npm run init)'), t('Normal protection: the database is already in use. Do not re-initialize it.', 'Protection normale : la base est déjà en service. Ne la réinitialisez pas.')],
      [t('“The licence of this Organization is not active” at sign-in', '« La licence de cette organisation n’est pas active » à la connexion'), mode === 'saas' ? t('Issue the licence: npm run admin -- licence --org <domain> --days 365', 'Émettez la licence : npm run admin -- licence --org <domaine> --days 365') : t('Install the signed licence: npm run admin -- licence-install --file <file.lic>', 'Installez la licence signée : npm run admin -- licence-install --file <fichier.lic>')],
      [t('“The licence signature is not valid”', '« La signature de la licence n’est pas valide »'), t('The file was modified or not signed with the vendor key. Ask the vendor for a new file; do not edit it.', 'Le fichier a été modifié ou n’a pas été signé avec la clé de l’éditeur. Demandez un nouveau fichier à l’éditeur ; ne le modifiez pas.')],
      [t('“This licence file belongs to another Organization”', '« Ce fichier de licence appartient à une autre organisation »'), t('The Organization ID in the file is not this organization. Compare with npm run admin -- org-list.', 'L’identifiant d’organisation du fichier n’est pas celui de cette organisation. Comparez avec npm run admin -- org-list.')],
      [t('502 Bad Gateway in the browser', '502 Bad Gateway dans le navigateur'), t('The service is stopped: sudo systemctl status cortexskills, then read the error log.', 'Le service est arrêté : sudo systemctl status cortexskills, puis lisez le journal d’erreurs.')],
      [t('Uploads larger than 30 MB refused', 'Envois de plus de 30 Mo refusés'), t('Limit set in the reverse proxy (client_max_body_size in Nginx, max_size in Caddy, maxAllowedContentLength in IIS).', 'Limite fixée dans le proxy inverse (client_max_body_size dans Nginx, max_size dans Caddy, maxAllowedContentLength dans IIS).')],
      [t('A user forgot the password', 'Un utilisateur a oublié son mot de passe'), t('The organization administrator sets a temporary one in Administration › Users; on the server: npm run admin -- password --email <e-mail> --password <new>', 'L’administrateur de l’organisation en définit un temporaire dans Administration › Utilisateurs ; sur le serveur : npm run admin -- password --email <e-mail> --password <nouveau>')],
    ], [3700, 6046]),
  ];

  const consoleRef = mode => table([t('Command (in /opt/cortexskills/server)', 'Commande (dans /opt/cortexskills/server)'), t('Purpose', 'Rôle')], [
    ['npm run secrets', t('Print three new random secrets for .env', 'Afficher trois nouveaux secrets aléatoires pour .env')],
    ['npm run init', t('Create the empty production database and the platform administrator', 'Créer la base de production vide et l’administrateur de la plateforme')],
    ['npm run backup', t('Back up the database now', 'Sauvegarder la base maintenant')],
    ['npm run admin -- org-create …', t('Create a customer organization, its licence and its administrator', 'Créer une organisation cliente, sa licence et son administrateur')],
    ['npm run admin -- org-list', t('List organizations with pack, users, add-ons and licence end date', 'Lister les organisations avec offre, utilisateurs, add-ons et fin de licence')],
    ['npm run admin -- packs', t('List packs, bundles, SME packs, add-ons and standards', 'Lister packs, offres groupées, packs PME, add-ons et normes')],
    ...(mode === 'saas' ? [['npm run admin -- licence --org <domain> [--pack] [--seats] [--days]', t('Issue, renew, resize or change the pack of a licence', 'Émettre, renouveler, redimensionner ou changer l’offre d’une licence')]] : [
      ['npm run admin -- licence-request --org <domain>', t('Print what to send to the vendor (company, Organization ID, pack, users, add-ons)', 'Afficher ce qu’il faut envoyer à l’éditeur (société, identifiant, offre, utilisateurs, add-ons)')],
      ['npm run admin -- licence-install --file <file.lic>', t('Check the vendor signature and install the licence', 'Vérifier la signature de l’éditeur et installer la licence')]]),
    ['npm run admin -- addon --org <domain> --id AD-08 --on|--off', t('Activate or deactivate an add-on', 'Activer ou désactiver un add-on')],
    ['npm run admin -- user-create --org <domain> --email … --name … --password … [--role R-03]', t('Create a user (role R-01 by default)', 'Créer un utilisateur (rôle R-01 par défaut)')],
    ['npm run admin -- password --email … --password …', t('Reset a password', 'Réinitialiser un mot de passe')],
    ['npm run admin -- platform-admin --email … --name … --password …', t('Add a platform administrator', 'Ajouter un administrateur de la plateforme')],
  ], [5200, 4546], { size: 17 });

  // ------------------------------------------------------------------ SaaS guide
  const saasBody = () => [
    ...cover({ eyebrow: t('Installation Guide · Production', 'Guide d’installation · Production'), title: t('CortexSkills — SaaS Mode', 'CortexSkills — Mode SaaS'), subtitle: t('Host one CortexSkills platform for many customer organizations, onboard each customer and activate its packs', 'Héberger une plateforme CortexSkills pour plusieurs organisations clientes, intégrer chaque client et activer ses offres'), meta: [`Version ${version} · ${today}`, t('Prepared by POWERACT Consulting', 'Préparé par POWERACT Consulting')], appLogo: LOGO }),
    ...tocPage(t('Table of Contents', 'Table des matières')),

    H1(t('1. About this guide', '1. À propos de ce guide')),
    P(t('In SaaS mode, the provider runs one CortexSkills installation on its own servers and serves many customers from it. Each customer is an Organization: its users, projects and documents are separated from the other customers. The provider issues each customer’s licence from the server console; the customer administrator manages users, pack options and add-ons from the web screens.', 'En mode SaaS, le fournisseur exploite une seule installation de CortexSkills sur ses propres serveurs et y sert plusieurs clients. Chaque client est une Organisation : ses utilisateurs, projets et documents sont séparés de ceux des autres clients. Le fournisseur émet la licence de chaque client depuis la console du serveur ; l’administrateur du client gère les utilisateurs, l’offre et les add-ons depuis les écrans web.')),
    table([t('Who', 'Qui'), t('Does what', 'Fait quoi'), t('Chapters', 'Chapitres')], [
      [B_(t('Provider operations team (server side)', 'Équipe d’exploitation du fournisseur (côté serveur)')), t('Installs and runs the platform, onboards each customer, issues and renews licences, backs up and updates.', 'Installe et exploite la plateforme, intègre chaque client, émet et renouvelle les licences, sauvegarde et met à jour.'), '2, 3, 4, 5, 7'],
      [B_(t('Customer administrator (customer side)', 'Administrateur du client (côté client)')), t('Signs in, checks the licence, creates the users, configures channels and AI, activates add-ons and standards, changes the pack.', 'Se connecte, vérifie la licence, crée les utilisateurs, configure les canaux et l’IA, active add-ons et normes, change d’offre.'), '5, 6'],
      [B_(t('Customer users', 'Utilisateurs du client')), t('Sign in with the address and the account received and work in My tasks.', 'Se connectent avec l’adresse et le compte reçus et travaillent dans Mes tâches.'), '6'],
    ], [3000, 5146, 1600]),
    spacer(),
    H2(t('How it works', 'Fonctionnement')),
    table([t('Element', 'Élément'), t('SaaS mode', 'Mode SaaS')], [
      [t('Installations', 'Installations'), t('One, at the provider', 'Une seule, chez le fournisseur')],
      [t('Customers', 'Clients'), t('Many organizations, data separated by organization', 'Plusieurs organisations, données séparées par organisation')],
      [t('Address', 'Adresse'), t('One address for all customers, for example https://skills.example.com', 'Une adresse pour tous les clients, par exemple https://skills.example.com')],
      [t('Licence', 'Licence'), t('A record per organization in the database, signed by the server (LICENSE_HMAC_SECRET); issued by the provider with the console', 'Un enregistrement par organisation dans la base, signé par le serveur (LICENSE_HMAC_SECRET) ; émis par le fournisseur avec la console')],
      [t('Pack activation', 'Activation des offres'), t('Provider: console (licence, add-on). Customer: Configuration & licence screen (self-service, logged)', 'Fournisseur : console (licence, add-on). Client : écran Configuration et licence (libre-service, tracé)')],
      ['DEPLOYMENT_MODE', 'saas'],
    ], [2600, 7146]),
    spacer(),
    callout(t('Time needed', 'Temps nécessaire'), [t('About 1 hour for the platform (chapter 3), then 5 minutes per new customer (chapter 4) and 20 minutes for the customer administrator (chapter 6).', 'Environ 1 heure pour la plateforme (chapitre 3), puis 5 minutes par nouveau client (chapitre 4) et 20 minutes pour l’administrateur du client (chapitre 6).')]),

    H1(t('2. Before you start (server side)', '2. Avant de commencer (côté serveur)')),
    ...requirements(),
    H2(t('What you receive', 'Ce que vous recevez')),
    table([t('File', 'Fichier'), t('Content', 'Contenu')], [
      ['CortexSkills-app.zip', t('The application: server, web/dist (built screens), deploy (configuration examples)', 'L’application : server, web/dist (écrans construits), deploy (exemples de configuration)')],
      ['deploy/env.production.example', t('The settings file to copy to server/.env', 'Le fichier de paramètres à copier vers server/.env')],
      ['deploy/cortexskills.service', t('The Linux service (systemd)', 'Le service Linux (systemd)')],
      ['deploy/nginx-cortexskills.conf · deploy/Caddyfile', t('The HTTPS reverse proxy (choose one)', 'Le proxy inverse HTTPS (choisissez-en un)')],
    ], [3800, 5946]),

    H1(t('3. Install the platform (server side)', '3. Installer la plateforme (côté serveur)')),
    P(t('The commands below are for Ubuntu Server. Type them one at a time and wait for each to finish.', 'Les commandes ci-dessous sont pour Ubuntu Server. Tapez-les une à une et attendez la fin de chacune.')),
    ...linuxInstall('saas'),

    H1(t('4. Onboard a customer (server side)', '4. Intégrer un client (côté serveur)')),
    H2(t('Collect the information', 'Rassembler les informations')),
    table([t('Information', 'Information'), t('Example', 'Exemple')], [
      [t('Company name and e-mail domain', 'Nom de l’entreprise et domaine e-mail'), 'Clinique Atlas Santé · atlassante.ma'],
      [t('Segment and sector', 'Segment et secteur'), t('Large organization · HCPR (private healthcare)', 'Grande organisation · HCPR (santé privée)')],
      [t('Contracted pack, users, duration', 'Offre contractuelle, utilisateurs, durée'), t('BND-03 · 250 users · 12 months', 'BND-03 · 250 utilisateurs · 12 mois')],
      [t('Add-ons in the contract', 'Add-ons du contrat'), 'AD-11'],
      [t('Customer administrator', 'Administrateur du client'), 'Nadia Benali · dsi@atlassante.ma'],
      [t('Default language', 'Langue par défaut'), t('French', 'Français')],
    ], [4200, 5546]),
    spacer(),
    H2(t('Create the organization', 'Créer l’organisation')),
    ...orgCreate('atlassante.ma', 'Clinique Atlas Santé', 'BND-03', 250),
    spacer(),
    P(t('The licence is issued at once (status Active). Add the add-ons of the contract:', 'La licence est émise aussitôt (statut Active). Ajoutez les add-ons du contrat :')),
    code('sudo -u cortexskills npm run -s admin -- addon --org atlassante.ma --id AD-11 --on'),
    H2(t('Send the welcome message', 'Envoyer le message de bienvenue')),
    P(t('Send the customer administrator, by two separate channels: the address (https://skills.example.com) and the e-mail of the account in a first message; the temporary password in a second message (SMS or phone). Ask them to change it at first sign-in and to follow chapter 6 of this guide.', 'Envoyez à l’administrateur du client, par deux canaux distincts : l’adresse (https://skills.example.com) et l’e-mail du compte dans un premier message ; le mot de passe temporaire dans un second message (SMS ou téléphone). Demandez-lui de le changer à la première connexion et de suivre le chapitre 6 de ce guide.')),
    H2(t('Check the customers', 'Contrôler les clients')),
    code('sudo -u cortexskills npm run -s admin -- org-list'),
    P(t('One line per organization: ID, name, domain, segment, pack, seats, active users, add-ons and licence end date.', 'Une ligne par organisation : identifiant, nom, domaine, segment, offre, sièges, utilisateurs actifs, add-ons et fin de licence.')),

    H1(t('5. Activate and change the packs', '5. Activer et changer les offres')),
    ...packCatalog(),
    H2(t('Server side: the provider', 'Côté serveur : le fournisseur')),
    table([t('Need', 'Besoin'), t('Command', 'Commande')], [
      [t('Activate the contracted pack (new customer)', 'Activer l’offre contractuelle (nouveau client)'), 'org-create … --pack BND-03 --seats 250 --days 365'],
      [t('Renew for one more year', 'Renouveler pour un an'), 'licence --org atlassante.ma --days 365'],
      [t('Upgrade the pack and the users', 'Monter en gamme l’offre et les utilisateurs'), 'licence --org atlassante.ma --pack BND-05 --seats 400 --days 365'],
      [t('Add or remove an add-on', 'Ajouter ou retirer un add-on'), 'addon --org atlassante.ma --id AD-08 --on   (--off)'],
    ], [4000, 5746], { size: 18 }),
    B.caption(t('Each command starts with: sudo -u cortexskills npm run -s admin -- (in /opt/cortexskills/server).', 'Chaque commande commence par : sudo -u cortexskills npm run -s admin -- (dans /opt/cortexskills/server).')),
    P(t('The licence command issues a new licence that starts today for the number of days given; it prints the new end date. Every change is written in the customer’s audit trail with the author “server console”.', 'La commande licence émet une nouvelle licence qui commence aujourd’hui pour le nombre de jours indiqué ; elle affiche la nouvelle échéance. Chaque changement est inscrit dans la piste d’audit du client avec l’auteur « server console ».')),
    H2(t('Customer side: self-service', 'Côté client : libre-service')),
    P(t('The customer administrator can change the pack, the add-ons and the compliance standards in the web application (chapter 6, “Activate add-ons, standards and change the pack”). The provider bills from the audit trail (each switch records the proration). If your contract does not allow self-service changes, remove the config.manage permission from the customer roles in Administration › Permission matrix and make the changes with the console.', 'L’administrateur du client peut changer l’offre, les add-ons et les normes de conformité dans l’application web (chapitre 6, « Activer add-ons et normes, changer d’offre »). Le fournisseur facture à partir de la piste d’audit (chaque changement enregistre le prorata). Si votre contrat n’autorise pas les changements en libre-service, retirez la permission config.manage des rôles du client dans Administration › Matrice des permissions et faites les changements avec la console.')),
    H2(t('Licence file (optional)', 'Fichier de licence (optionnel)')),
    P(t('A customer can also receive a vendor-signed licence file (same format as in the Dedicated Cloud & On-Prem guide) and upload it in Configuration & licence › Upload licence file. In SaaS mode the server accepts it only if the vendor signature is valid (vendor-public.pem in server/tools/keys) and the Organization ID in the file is the customer’s.', 'Un client peut aussi recevoir un fichier de licence signé par l’éditeur (même format que dans le guide Cloud dédié et On-Prem) et le téléverser dans Configuration et licence › Téléverser la licence. En mode SaaS, le serveur ne l’accepte que si la signature de l’éditeur est valide (vendor-public.pem dans server/tools/keys) et si l’identifiant d’organisation du fichier est celui du client.')),
    ...licenceStates(),

    H1(t('6. Customer side: get started', '6. Côté client : démarrer')),
    P(t('This chapter is for the customer administrator. Everything is done in the browser; nothing is installed on the customer side.', 'Ce chapitre s’adresse à l’administrateur du client. Tout se fait dans le navigateur ; rien n’est installé côté client.')),
    ...customerFirstSteps(),
    H2(t('Activate add-ons, standards and change the pack', 'Activer add-ons et normes, changer d’offre')),
    ...customerScreens(),
    H2(t('Renewal', 'Renouvellement')),
    P(t('Thirty days before the end of the licence, a banner reminds the administrators. Contact the provider: they renew it from the console and the new date appears at once in the Licence card. No action is needed on the customer side.', 'Trente jours avant la fin de la licence, un bandeau prévient les administrateurs. Contactez le fournisseur : il la renouvelle depuis la console et la nouvelle date apparaît aussitôt dans la carte Licence. Aucune action n’est nécessaire côté client.')),

    H1(t('7. Operate the platform (server side)', '7. Exploiter la plateforme (côté serveur)')),
    ...operations('saas'),
    H2(t('Troubleshooting', 'Dépannage')),
    ...troubleshooting('saas'),

    H1(t('Appendix — Console commands', 'Annexe — Commandes de la console')),
    consoleRef('saas'),
  ];

  // ------------------------------------------------------------------ Dedicated Cloud & On-Prem guide
  const dedBody = () => [
    ...cover({ eyebrow: t('Installation Guide · Production', 'Guide d’installation · Production'), title: t('CortexSkills — Dedicated Cloud & On-Premises', 'CortexSkills — Cloud dédié et sur site (On-Prem)'), subtitle: t('Install CortexSkills for one customer in its public cloud, its private cloud or its own datacenter, activate the licence and the packs', 'Installer CortexSkills pour un client dans son cloud public, son cloud privé ou son propre centre de données, activer la licence et les offres'), meta: [`Version ${version} · ${today}`, t('Prepared by POWERACT Consulting', 'Préparé par POWERACT Consulting')], appLogo: LOGO }),
    ...tocPage(t('Table of Contents', 'Table des matières')),

    H1(t('1. About this guide', '1. À propos de ce guide')),
    P(t('In a dedicated installation, CortexSkills runs for one customer only, in an environment chosen by the customer. The same guide covers the three cases below, because the installation is the same: only the place of the server, the network and the source of the HTTPS certificate change.', 'Dans une installation dédiée, CortexSkills fonctionne pour un seul client, dans un environnement choisi par le client. Le même guide couvre les trois cas ci-dessous, car l’installation est identique : seuls l’emplacement du serveur, le réseau et l’origine du certificat HTTPS changent.')),
    table(['', t('Dedicated public cloud', 'Cloud public dédié'), t('Dedicated private cloud', 'Cloud privé dédié'), t('On-premises', 'Sur site (On-Prem)')], [
      [B_(t('Where', 'Où')), t('A virtual machine in the customer’s Azure, AWS, Google Cloud or OVHcloud subscription', 'Une machine virtuelle dans l’abonnement Azure, AWS, Google Cloud ou OVHcloud du client'), t('A virtual machine in the customer’s VMware, Nutanix, OpenStack or Hyper-V platform', 'Une machine virtuelle sur la plateforme VMware, Nutanix, OpenStack ou Hyper-V du client'), t('A server (physical or virtual) in the customer’s premises', 'Un serveur (physique ou virtuel) dans les locaux du client')],
      [B_(t('Address', 'Adresse')), 'https://skills.customer.com', t('https://skills.customer.local (internal DNS) or public', 'https://skills.customer.local (DNS interne) ou publique'), t('Internal address, often no Internet', 'Adresse interne, souvent sans Internet')],
      [B_(t('Certificate', 'Certificat')), t('Let’s Encrypt or company', 'Let’s Encrypt ou entreprise'), t('Company certificate authority', 'Autorité de certification de l’entreprise'), t('Company certificate authority', 'Autorité de certification de l’entreprise')],
      [B_(t('Backups', 'Sauvegardes')), t('Disk snapshots + storage account', 'Instantanés de disque + compte de stockage'), t('VM backup + network share', 'Sauvegarde VM + partage réseau'), t('Backup tool + network share', 'Outil de sauvegarde + partage réseau')],
      [B_(t('Install steps', 'Étapes d’installation')), t('Same (chapters 3 to 6)', 'Identiques (chapitres 3 à 6)'), t('Same (chapters 3 to 6)', 'Identiques (chapitres 3 à 6)'), t('Same; without Internet see chapter 3', 'Identiques ; sans Internet voir chapitre 3')],
    ], [1500, 2750, 2750, 2746], { size: 18 }),
    spacer(),
    H2(t('Licence: a vendor-signed file', 'Licence : un fichier signé par l’éditeur')),
    P(t('A dedicated installation runs in onprem mode (DEPLOYMENT_MODE=onprem). The licence is a file signed by the vendor with its private key; the server checks the signature with the vendor public key. Nobody can change the pack, the number of users or the date in the file without breaking the signature. The vendor private key never leaves the vendor.', 'Une installation dédiée fonctionne en mode onprem (DEPLOYMENT_MODE=onprem). La licence est un fichier signé par l’éditeur avec sa clé privée ; le serveur vérifie la signature avec la clé publique de l’éditeur. Personne ne peut modifier l’offre, le nombre d’utilisateurs ou la date du fichier sans casser la signature. La clé privée de l’éditeur ne quitte jamais l’éditeur.')),
    callout(t('Dedicated cloud operated by the provider', 'Cloud dédié exploité par le fournisseur'), [t('If the provider operates a dedicated instance in its own cloud subscription for one customer, it can also use the SaaS mode with a single organization (see the SaaS guide). Use this guide when the customer or its IT partner operates the server.', 'Si le fournisseur exploite une instance dédiée dans son propre abonnement cloud pour un seul client, il peut aussi utiliser le mode SaaS avec une seule organisation (voir le guide SaaS). Utilisez ce guide quand le client ou son partenaire informatique exploite le serveur.')], B.C.light),
    H2(t('Who does what', 'Qui fait quoi')),
    table([t('Task', 'Tâche'), t('Vendor', 'Éditeur'), t('Customer IT (server side)', 'Informatique du client (côté serveur)'), t('Customer administrator', 'Administrateur du client')], [
      [t('Deliver the application and the public key', 'Livrer l’application et la clé publique'), '●', '', ''],
      [t('Prepare the server, network, DNS, certificate', 'Préparer serveur, réseau, DNS, certificat'), '', '●', ''],
      [t('Install, configure, initialize (chapters 3–4)', 'Installer, configurer, initialiser (chapitres 3–4)'), t('support', 'appui'), '●', ''],
      [t('Create the organization, request the licence (chapter 5)', 'Créer l’organisation, demander la licence (chapitre 5)'), '', '●', ''],
      [t('Sign the licence file (chapter 5)', 'Signer le fichier de licence (chapitre 5)'), '●', '', ''],
      [t('Install the licence (chapter 5)', 'Installer la licence (chapitre 5)'), '', '●', ''],
      [t('Users, channels, add-ons, standards (chapters 6–7)', 'Utilisateurs, canaux, add-ons, normes (chapitres 6–7)'), '', '', '●'],
      [t('Backups, updates, monitoring (chapter 8)', 'Sauvegardes, mises à jour, supervision (chapitre 8)'), t('new versions', 'nouvelles versions'), '●', ''],
    ], [4146, 1400, 2300, 1900], { size: 18 }),

    H1(t('2. Before you start (server side)', '2. Avant de commencer (côté serveur)')),
    ...requirements(),
    H2(t('Cloud-specific preparation', 'Préparation propre au cloud')),
    table([t('Platform', 'Plateforme'), t('What to prepare', 'Ce qu’il faut préparer')], [
      ['Microsoft Azure', t('A Linux VM (Ubuntu 24.04), a Premium SSD data disk mounted on /var/lib/cortexskills, a Network Security Group allowing 443 (and 80 for Let’s Encrypt), Azure Backup on the VM, an Azure Files share mounted for BACKUP_COPY_DIR.', 'Une VM Linux (Ubuntu 24.04), un disque de données SSD Premium monté sur /var/lib/cortexskills, un groupe de sécurité réseau autorisant 443 (et 80 pour Let’s Encrypt), Azure Backup sur la VM, un partage Azure Files monté pour BACKUP_COPY_DIR.')],
      ['AWS', t('An EC2 instance (Ubuntu 24.04), an EBS gp3 volume for /var/lib/cortexskills, a security group allowing 443/80, EBS snapshots with Data Lifecycle Manager, an S3 bucket mounted (Mountpoint for S3) or EFS for BACKUP_COPY_DIR.', 'Une instance EC2 (Ubuntu 24.04), un volume EBS gp3 pour /var/lib/cortexskills, un groupe de sécurité autorisant 443/80, des instantanés EBS avec Data Lifecycle Manager, un compartiment S3 monté (Mountpoint for S3) ou EFS pour BACKUP_COPY_DIR.')],
      ['Google Cloud', t('A Compute Engine VM, a persistent SSD disk, a firewall rule for 443/80, snapshot schedules, a Filestore share or a Cloud Storage bucket (gcsfuse) for BACKUP_COPY_DIR.', 'Une VM Compute Engine, un disque persistant SSD, une règle de pare-feu pour 443/80, des planifications d’instantanés, un partage Filestore ou un bucket Cloud Storage (gcsfuse) pour BACKUP_COPY_DIR.')],
      [t('Private cloud (VMware, Nutanix, OpenStack, Hyper-V)', 'Cloud privé (VMware, Nutanix, OpenStack, Hyper-V)'), t('A VM from the Ubuntu or RHEL template, an internal DNS record, a certificate from the company authority, the VM in the backup policy, an NFS/SMB share for BACKUP_COPY_DIR.', 'Une VM depuis le modèle Ubuntu ou RHEL, un enregistrement DNS interne, un certificat de l’autorité de l’entreprise, la VM dans la politique de sauvegarde, un partage NFS/SMB pour BACKUP_COPY_DIR.')],
      [t('On-premises', 'Sur site'), t('The same as private cloud. On Windows Server, follow chapter 4 instead of chapter 3.', 'Comme le cloud privé. Sous Windows Server, suivez le chapitre 4 au lieu du chapitre 3.')],
    ], [2600, 7146], { size: 18 }),
    H2(t('What you receive from the vendor', 'Ce que vous recevez de l’éditeur')),
    table([t('File', 'Fichier'), t('Content', 'Contenu')], [
      ['CortexSkills-app.zip', t('The application: server, web/dist (built screens), deploy (configuration examples)', 'L’application : server, web/dist (écrans construits), deploy (exemples de configuration)')],
      ['vendor-public.pem', t('The vendor public key (checks the licence signature)', 'La clé publique de l’éditeur (vérifie la signature de la licence)')],
      [t('<company>.lic (later)', '<société>.lic (plus tard)'), t('The signed licence file, after you send the Organization ID (chapter 5)', 'Le fichier de licence signé, après l’envoi de l’identifiant d’organisation (chapitre 5)')],
    ], [3000, 6746]),

    H1(t('3. Install on Linux (server side)', '3. Installer sous Linux (côté serveur)')),
    P(t('The commands below are for Ubuntu Server; on RHEL use dnf instead of apt-get. Type them one at a time.', 'Les commandes ci-dessous sont pour Ubuntu Server ; sous RHEL utilisez dnf au lieu de apt-get. Tapez-les une à une.')),
    ...linuxInstall('onprem'),
    H2(t('Installing without Internet access', 'Installer sans accès Internet')),
    P(t('Step 4 (npm ci) needs the npm registry. For a server without Internet (common on-premises):', 'L’étape 4 (npm ci) a besoin du registre npm. Pour un serveur sans Internet (fréquent sur site) :')),
    ...steps([t('On a connected machine with the same operating system, the same processor type (x64 or arm64) and Node.js 22, unzip CortexSkills-app.zip and run npm ci --omit=dev in the server folder.', 'Sur une machine connectée avec le même système, le même type de processeur (x64 ou arm64) et Node.js 22, décompressez CortexSkills-app.zip et lancez npm ci --omit=dev dans le dossier server.'), t('Zip the whole CortexSkills folder (now with server/node_modules) and copy it to the server, with the Node.js 22 installer (nodejs.org, “Linux binaries” or the .msi for Windows).', 'Compressez tout le dossier CortexSkills (avec server/node_modules) et copiez-le sur le serveur, avec l’installateur de Node.js 22 (nodejs.org, « Linux binaries » ou le .msi pour Windows).'), t('Continue at step 5. The operating system must match because one component (the image renderer used for document charts) ships a compiled file per system.', 'Poursuivez à l’étape 5. Le système doit correspondre car un composant (le moteur d’images des graphiques des documents) fournit un fichier compilé par système.')]),
    P(t('Without Internet, the e-mail and WhatsApp channels need an internal SMTP relay and an outbound route to the WhatsApp API; the AI assistant needs a route to the AI provider (or stays off).', 'Sans Internet, les canaux e-mail et WhatsApp ont besoin d’un relais SMTP interne et d’une route sortante vers l’API WhatsApp ; l’assistant IA a besoin d’une route vers le fournisseur d’IA (ou reste désactivé).')),

    H1(t('4. Install on Windows Server (server side)', '4. Installer sous Windows Server (côté serveur)')),
    P(t('Use PowerShell opened as administrator.', 'Utilisez PowerShell ouvert en tant qu’administrateur.')),
    ...steps([
      t('Install Node.js 22 LTS (the .msi from nodejs.org) with the default options; check with node -v (v22.13 or higher).', 'Installez Node.js 22 LTS (le .msi de nodejs.org) avec les options par défaut ; vérifiez avec node -v (v22.13 ou plus).'),
      t('Unzip CortexSkills-app.zip to C:\\CortexSkills (the folder holds server, web and deploy). Create the data folder D:\\CortexSkillsData (on a backed-up disk).', 'Décompressez CortexSkills-app.zip dans C:\\CortexSkills (le dossier contient server, web et deploy). Créez le dossier de données D:\\CortexSkillsData (sur un disque sauvegardé).'),
      t('In C:\\CortexSkills\\server run: npm ci --omit=dev', 'Dans C:\\CortexSkills\\server lancez : npm ci --omit=dev'),
      t('Copy deploy\\env.production.example to server\\.env, run npm run -s secrets and fill .env as in chapter 3 step 5, with DEPLOYMENT_MODE=onprem and DATA_DIR=D:\\CortexSkillsData.', 'Copiez deploy\\env.production.example vers server\\.env, lancez npm run -s secrets et remplissez .env comme au chapitre 3 étape 5, avec DEPLOYMENT_MODE=onprem et DATA_DIR=D:\\CortexSkillsData.'),
      t('Create server\\tools\\keys and copy vendor-public.pem into it.', 'Créez server\\tools\\keys et copiez-y vendor-public.pem.'),
      t('Run npm run init (it uses ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD from .env), then remove ADMIN_PASSWORD from .env.', 'Lancez npm run init (il utilise ADMIN_EMAIL, ADMIN_NAME et ADMIN_PASSWORD de .env), puis supprimez ADMIN_PASSWORD de .env.'),
      t('Install NSSM (nssm.cc), add it to the PATH, then run the script deploy\\install-windows-service.ps1 (adapt $App if the folder is not C:\\CortexSkills). Check: nssm status CortexSkills shows SERVICE_RUNNING.', 'Installez NSSM (nssm.cc), ajoutez-le au PATH, puis exécutez le script deploy\\install-windows-service.ps1 (adaptez $App si le dossier n’est pas C:\\CortexSkills). Vérifiez : nssm status CortexSkills affiche SERVICE_RUNNING.'),
      t('In IIS, install the URL Rewrite and Application Request Routing modules; in ARR “Server Proxy Settings” tick Enable proxy. Create a site bound to https://skills.customer.com with your certificate, and copy deploy\\web.config into its folder. It forwards every request to http://127.0.0.1:4000 and allows uploads up to 30 MB.', 'Dans IIS, installez les modules URL Rewrite et Application Request Routing ; dans « Server Proxy Settings » d’ARR cochez Enable proxy. Créez un site lié à https://skills.customer.com avec votre certificat, et copiez deploy\\web.config dans son dossier. Il transmet chaque requête à http://127.0.0.1:4000 et autorise les envois jusqu’à 30 Mo.'),
      t('Open https://skills.customer.com/api/health: the answer is {"status":"ok", … "mode":"onprem"}. The logs are in C:\\CortexSkills\\logs.', 'Ouvrez https://skills.customer.com/api/health : la réponse est {"status":"ok", … "mode":"onprem"}. Les journaux sont dans C:\\CortexSkills\\logs.'),
    ]),
    callout(t('Windows notes', 'Remarques Windows'), [t('On Windows, run the console commands of this guide in C:\\CortexSkills\\server without sudo -u cortexskills, for example: npm run -s admin -- org-list. Exclude the data folder from antivirus real-time scanning and from OneDrive synchronization. Restore and update work as in chapter 8 with the service stopped (nssm stop CortexSkills).', 'Sous Windows, exécutez les commandes console de ce guide dans C:\\CortexSkills\\server sans sudo -u cortexskills, par exemple : npm run -s admin -- org-list. Excluez le dossier de données de l’analyse antivirus en temps réel et de la synchronisation OneDrive. La restauration et la mise à jour se font comme au chapitre 8, service arrêté (nssm stop CortexSkills).')]),

    H1(t('5. Create the organization and activate the licence', '5. Créer l’organisation et activer la licence')),
    P(t('The licence is tied to the Organization ID created on your server. The activation takes four steps; the customer’s users cannot sign in before step 4.', 'La licence est liée à l’identifiant d’organisation créé sur votre serveur. L’activation se fait en quatre étapes ; les utilisateurs du client ne peuvent pas se connecter avant l’étape 4.')),
    table([t('Step', 'Étape'), t('Who', 'Qui'), t('Action', 'Action')], [
      ['1', t('Customer IT', 'Informatique du client'), t('Create the organization and its administrator (org-create)', 'Créer l’organisation et son administrateur (org-create)')],
      ['2', t('Customer IT', 'Informatique du client'), t('Send the licence request to the vendor (licence-request)', 'Envoyer la demande de licence à l’éditeur (licence-request)')],
      ['3', t('Vendor', 'Éditeur'), t('Sign the licence file and send it', 'Signer le fichier de licence et l’envoyer')],
      ['4', t('Customer IT', 'Informatique du client'), t('Install the file (licence-install); the users can sign in', 'Installer le fichier (licence-install) ; les utilisateurs peuvent se connecter')],
    ], [900, 2600, 6246]),
    H2(t('Step 1 — Create the organization', 'Étape 1 — Créer l’organisation')),
    ...orgCreate('orn.ma', 'Office Régional Nord', 'BND-02', 150),
    H2(t('Step 2 — Request the licence', 'Étape 2 — Demander la licence')),
    code('sudo -u cortexskills npm run -s admin -- licence-request --org orn.ma'),
    code('Company: Office Régional Nord'), code('Organization ID: 6ec2a117-eb31-4af4-ad03-5696108ecd13'), code('Requested pack: BND-02'), code('Requested users: 150'), code('Add-ons: none'),
    P(t('Send these lines to the vendor with the expected end date of the contract.', 'Envoyez ces lignes à l’éditeur avec la date de fin de contrat prévue.')),
    H2(t('Step 3 — The vendor signs the licence', 'Étape 3 — L’éditeur signe la licence')),
    P(t('On the vendor signing computer only (never on a customer server), in the server folder of the source code:', 'Sur l’ordinateur de signature de l’éditeur uniquement (jamais sur un serveur client), dans le dossier server du code source :')),
    code('npm run sign-licence -- --company "Office Régional Nord" --companyId 6ec2a117-eb31-4af4-ad03-5696108ecd13 --expiry 2027-12-31 --maxUsers 150 --plan BND-02 --features analytics,export,api --output ./ORN.lic'),
    P(t('The first run creates the vendor key pair in server/tools/keys: vendor-private.pem (secret: keep it offline and back it up) and vendor-public.pem (the same for every customer). The vendor sends ORN.lic and vendor-public.pem to the customer.', 'La première exécution crée la paire de clés de l’éditeur dans server/tools/keys : vendor-private.pem (secrète : à garder hors ligne et sauvegardée) et vendor-public.pem (la même pour tous les clients). L’éditeur envoie ORN.lic et vendor-public.pem au client.')),
    H2(t('Step 4 — Install the licence', 'Étape 4 — Installer la licence')),
    code('sudo -u cortexskills npm run -s admin -- licence-install --file /tmp/ORN.lic'),
    code('Licence installed for Office Régional Nord: pack BND-02, 150 users, valid until 2027-12-31.'),
    P(t('The console checks the vendor signature and the Organization ID, writes the file to the data folder (license.lic, or LICENSE_PATH) and sets the organization’s pack and number of users. No restart is needed: the administrator can sign in at once. A modified file is refused with “The licence signature is not valid”.', 'La console vérifie la signature de l’éditeur et l’identifiant d’organisation, écrit le fichier dans le dossier de données (license.lic, ou LICENSE_PATH) et règle l’offre et le nombre d’utilisateurs de l’organisation. Aucun redémarrage n’est nécessaire : l’administrateur peut se connecter aussitôt. Un fichier modifié est refusé avec « La signature de la licence n’est pas valide ».')),
    callout(t('Several organizations on one dedicated server', 'Plusieurs organisations sur un même serveur dédié'), [t('A group with several companies can create one organization per company on the same server. Each organization needs its own signed licence; the licence file keeps one entry per Organization ID.', 'Un groupe de plusieurs sociétés peut créer une organisation par société sur le même serveur. Chaque organisation a besoin de sa propre licence signée ; le fichier de licence conserve une entrée par identifiant d’organisation.')], B.C.light),

    H1(t('6. Activate and change the packs', '6. Activer et changer les offres')),
    ...packCatalog(),
    H2(t('How the activation works in a dedicated installation', 'Fonctionnement de l’activation en installation dédiée')),
    table([t('Element', 'Élément'), t('Decided by', 'Décidé par'), t('How', 'Comment')], [
      [t('Pack, number of users, end date', 'Offre, nombre d’utilisateurs, échéance'), t('The signed licence file', 'Le fichier de licence signé'), t('Installed with licence-install (server) or uploaded in Configuration & licence (customer administrator)', 'Installé avec licence-install (serveur) ou téléversé dans Configuration et licence (administrateur du client)')],
      [t('Add-ons', 'Add-ons'), t('Customer administrator, per contract', 'Administrateur du client, selon le contrat'), t('Tick boxes in Configuration & licence, or addon --on (server); listed in licence-request for the true-up', 'Cases à cocher dans Configuration et licence, ou addon --on (serveur) ; listés dans licence-request pour la régularisation')],
      [t('Compliance standards', 'Normes de conformité'), t('Customer administrator', 'Administrateur du client'), t('Tick boxes in Configuration & licence', 'Cases à cocher dans Configuration et licence')],
    ], [2800, 2600, 4346], { size: 18 }),
    H2(t('Upgrade, add users or renew', 'Monter en gamme, ajouter des utilisateurs ou renouveler')),
    ...steps([t('The customer orders the change from the vendor (new pack, more users or a new end date).', 'Le client commande le changement à l’éditeur (nouvelle offre, plus d’utilisateurs ou nouvelle échéance).'), t('The vendor signs a new file for the same Organization ID (step 3 of chapter 5) and sends it.', 'L’éditeur signe un nouveau fichier pour le même identifiant d’organisation (étape 3 du chapitre 5) et l’envoie.'), t('The customer administrator opens Administration › Configuration & licence, clicks Upload licence file and chooses the file — or the IT team runs licence-install again. The new file replaces the previous one for this organization; the pack and the number of users are updated at once.', 'L’administrateur du client ouvre Administration › Configuration et licence, clique sur Téléverser la licence et choisit le fichier — ou l’équipe informatique relance licence-install. Le nouveau fichier remplace le précédent pour cette organisation ; l’offre et le nombre d’utilisateurs sont mis à jour aussitôt.')]),
    callout(t('Upload before the end date', 'Téléverser avant l’échéance'), [t('After the end date the licence is read-only but administrators can still sign in and upload a new file. If the licence was never installed (status inactive), use licence-install on the server.', 'Après l’échéance, la licence est en lecture seule mais les administrateurs peuvent toujours se connecter et téléverser un nouveau fichier. Si la licence n’a jamais été installée (statut inactif), utilisez licence-install sur le serveur.')]),
    ...licenceStates(),

    H1(t('7. Customer side: get started', '7. Côté client : démarrer')),
    P(t('This chapter is for the customer administrator, once the licence is installed. Everything is done in the browser.', 'Ce chapitre s’adresse à l’administrateur du client, une fois la licence installée. Tout se fait dans le navigateur.')),
    ...customerFirstSteps(),
    H2(t('Activate add-ons, standards and upload a licence', 'Activer add-ons et normes, téléverser une licence')),
    ...customerScreens(false),
    H2(t('Upload a new licence file', 'Téléverser un nouveau fichier de licence')),
    ...steps([t('Save the .lic file received from the vendor on your computer.', 'Enregistrez sur votre ordinateur le fichier .lic reçu de l’éditeur.'), t('In Administration › Configuration & licence, click Upload licence file (Licence card) and choose the file.', 'Dans Administration › Configuration et licence, cliquez sur Téléverser la licence (carte Licence) et choisissez le fichier.'), t('The Licence card shows the new plan, users and date. A message explains any refusal (signature not valid, file for another organization).', 'La carte Licence affiche le nouveau plan, les utilisateurs et la date. Un message explique tout refus (signature non valide, fichier d’une autre organisation).')]),

    H1(t('8. Operate the installation (server side)', '8. Exploiter l’installation (côté serveur)')),
    P(t('Paths are for Linux. On Windows: C:\\CortexSkills for the application, your DATA_DIR for the data, nssm stop / nssm start CortexSkills for the service.', 'Les chemins sont pour Linux. Sous Windows : C:\\CortexSkills pour l’application, votre DATA_DIR pour les données, nssm stop / nssm start CortexSkills pour le service.')),
    ...operations('onprem'),
    H2(t('Troubleshooting', 'Dépannage')),
    ...troubleshooting('onprem'),

    H1(t('Appendix — Console commands', 'Annexe — Commandes de la console')),
    consoleRef('onprem'),
  ];

  const body = saas ? saasBody() : dedBody();
  const title = saas ? t('CortexSkills Installation Guide — SaaS Mode', 'Guide d’installation CortexSkills — Mode SaaS') : t('CortexSkills Installation Guide — Dedicated Cloud & On-Prem', 'Guide d’installation CortexSkills — Cloud dédié et On-Prem');
  const doc = document({ title, credit: 'CortexSkills · ' + (saas ? t('Installation Guide — SaaS', 'Guide d’installation — SaaS') : t('Installation Guide — Dedicated Cloud & On-Prem', 'Guide d’installation — Cloud dédié et On-Prem')), sections: [body], lang: fr ? 'fr-FR' : 'en-GB' });
  const file = path.join(out, `CortexSkills_Install_${saas ? 'SaaS' : 'Dedicated_Cloud_OnPrem'}_${lang.toUpperCase()}.docx`);
  return D.Packer.toBuffer(doc).then(buf => { fs.writeFileSync(file, buf); console.log('written', file); });
}

fs.mkdirSync(out, { recursive: true });
(async () => { for (const k of ['saas', 'dedicated']) for (const l of ['en', 'fr']) await build(k, l); })();
