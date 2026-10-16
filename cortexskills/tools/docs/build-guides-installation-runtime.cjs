// Builds the installation guides of the minified runtimes (no Docker), in French or English (Word, with a table of contents):
//  - customer: the customer installs the runtime on its Linux server (private cloud or on-premises), as a systemd service
//    behind Nginx, and activates its licence — with no commercial content;
//  - editor: the vendor — signing workstation (Windows or Linux), scenario a (private cloud / on-premises, Linux server),
//    scenario b (localhost on Windows), licence management (create, read, update, revoke, delete).
// Each runtime is one compressed file; Node.js 22 LTS is a prerequisite of the machine.
// Run: node build-guides-installation-runtime.cjs fr|en <outDir>, then python3 topdf.py <files> for the PDFs.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, bullet, code, callout, table, shot, cover, tocPage, document, spacer } = B;
const L = process.argv[2] === 'en' ? 'en' : 'fr'; const X = (f, e) => (L === 'fr' ? f : e);
const out = process.argv[3] || path.join(__dirname, '../../deliverables');
const V = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const NV = process.env.NODE_DIST_VERSION || '22.22.2';
const today = new Date().toISOString().slice(0, 10);
const SH = f => path.join(__dirname, X('shots/docker-fr', 'shots/docker-en'), f + '.png');
let n = 0; const steps = items => { const ref = 'rsteps' + (n++ || ''); return items.map(t => B.numbered(t, ref)); };
const cmd = s => s.split('\n').map(l => code(l));
const b = t => ({ text: t, bold: true });
const PKG = `Runtime_Customer_Linux_CortexSkills_${V}`, ED = `Runtime_Editor_Linux_Windows_CortexSkills_${V}`;
const PKGF = `${PKG}.tar.xz`, EDF = `${ED}.zip`;
const GC = X('Guide_Installation_Runtime_Customer_Linux_CortexSkills_FR', 'Installation_Guide_Runtime_Customer_Linux_CortexSkills_EN');
const GE = X('Guide_Installation_Runtime_Editor_Linux_Windows_CortexSkills_FR', 'Installation_Guide_Runtime_Editor_Linux_Windows_CortexSkills_EN');
const GU = X('Guide_Utilisateur_Customer_CortexSkills_FR', 'User_Guide_Customer_CortexSkills_EN');
const GUE = X('Guide_Utilisateur_Editor_CortexSkills_FR', 'User_Guide_Editor_CortexSkills_EN');
const REF = JSON.parse(fs.readFileSync(path.join(__dirname, 'reference-orgs.json'), 'utf8'));
const nLarge = REF.orgs.filter(o => o.segment === 'LARGE').length, nSme = REF.orgs.filter(o => o.segment === 'SME').length;
const refTable = () => table([X('Secteur', 'Sector'), X('Grandes entreprises', 'Large companies'), X('PME', 'SMEs')], Object.entries(REF.sectors).sort((a, c) => a[1][L].localeCompare(c[1][L], L)).map(([k, v]) => [`${v[L]} (${k})`,
  REF.orgs.filter(o => o.sector === k && o.segment === 'LARGE').map(o => o.name[L]).join(' ; ') || '—', REF.orgs.filter(o => o.sector === k && o.segment === 'SME').map(o => o.name[L]).join(' ; ') || '—']), [3000, 3800, 2846], { size: 15 });
const refIntro = who => [
  P(X(`Au premier démarrage, l’installation charge ${REF.orgs.length} organisations de référence : ${nLarge} grandes entreprises et ${nSme} PME, dans toutes les verticales (${Object.keys(REF.sectors).length - 1} secteurs et un cas universel). Chacune a deux projets complets (orientation Numérique et IA) avec ses processus, tâches, étapes, questionnaires, plans, documents et indicateurs : ce sont des exemples à consulter, en français, anglais et arabe.`,
    `At first start, the installation loads ${REF.orgs.length} reference organizations: ${nLarge} large companies and ${nSme} SMEs, in every vertical (${Object.keys(REF.sectors).length - 1} sectors and a universal case). Each has two complete projects (Digital and AI focus) with its processes, tasks, steps, questionnaires, plans, documents and indicators: they are examples to look at, in English, French and Arabic.`)),
  callout(X('Aucun compte de démonstration', 'No demonstration account'), X([
    'La page de connexion ne mentionne aucun compte ; aucun mot de passe de démonstration n’existe dans cette version de production.',
    'Les personnes des organisations de référence ne peuvent pas se connecter : leurs comptes sont désactivés et leur mot de passe, tiré au hasard à l’installation, n’est connu de personne.',
    `Seul l’administrateur de la plateforme (ADMIN_EMAIL) se connecte au départ ; il consulte les organisations de référence en lecture (Portefeuille › Groupes et organisations).${who === 'client' ? ' Vos propres utilisateurs sont ceux de votre organisation (chapitre 8).' : ' Vos organisations clientes se créent avec la console (chapitre 6).'}`,
    'Elles n’ont pas de licence : elles ne comptent pas dans le nombre d’utilisateurs de votre licence. Pour une base vide, mettez REFERENCE_DATA=non dans .env avant le premier démarrage.'], [
    'The sign-in page names no account; no demonstration password exists in this production version.',
    'The people of the reference organizations cannot sign in: their accounts are disabled and their password, drawn at random at installation, is known to nobody.',
    `Only the platform administrator (ADMIN_EMAIL) signs in at first; they look at the reference organizations read-only (Portfolio › Groups and organizations).${who === 'client' ? ' Your own users are those of your organization (chapter 8).' : ' Your customer organizations are created with the console (chapter 6).'}`,
    'They have no licence: they do not count in the number of users of your licence. For an empty database, set REFERENCE_DATA=non in .env before the first start.'])),
];
const W2 = [3000, 6646];
const ADM = 'sudo -u cortexskills ./cortexskills admin';
const minified = who => callout(X('Ce que contient le paquet — et ce qu’il ne contient pas', 'What the package contains — and what it does not'), X([
  'L’exécutable de production : le serveur minifié (fichier par fichier, sans commentaires, noms internes raccourcis), l’interface web compilée et minifiée (découpée par page, précompressée Brotli et gzip, sans source map) et les bibliothèques nécessaires à l’exécution.',
  'La clé publique de l’éditeur : elle vérifie la licence, elle ne peut pas en créer.',
  'Aucun code source lisible, aucun test, aucune source map, aucun outil de signature, aucune clé privée' + (who === 'editeur' ? ' (sauf le dossier poste-signature/, chapitre 3)' : '') + '.',
  `Node.js n’est pas inclus : c’est un prérequis de la machine (Node.js 22 LTS, 22.13 ou plus récent ; version validée : ${NV}). Le paquet tient ainsi en un seul fichier compressé.`], [
  'The production runtime: the minified server (file by file, without comments, internal names shortened), the compiled and minified web client (split per page, pre-compressed with Brotli and gzip, without source maps) and the libraries needed at run time.',
  'The vendor public key: it verifies the licence, it cannot create one.',
  'No readable source code, no test, no source map, no signing tool, no private key' + (who === 'editeur' ? ' (except the poste-signature/ folder, chapter 3)' : '') + '.',
  `Node.js is not included: it is a prerequisite of the machine (Node.js 22 LTS, 22.13 or newer; validated version: ${NV}). This keeps the package to a single compressed file.`]));
const perf = P(X('Optimisations d’exécution : seuls les écrans ouverts sont chargés (le premier affichage charge environ 370 Ko de JavaScript au lieu de 2,2 Mo), les fichiers statiques sont servis précompressés et mis en cache par le navigateur pour un an (leur nom change à chaque version), et Node.js garde le code compilé entre deux démarrages (data/.node-compile-cache).',
  'Run-time optimisations: only the screens opened are loaded (the first display loads about 370 KB of JavaScript instead of 2.2 MB), static files are served pre-compressed and cached by the browser for a year (their name changes with each version), and Node.js keeps the compiled code between two starts (data/.node-compile-cache).'), { size: 20, color: C.muted });
const nodeLinux = () => [
  P(X('Node.js 22 LTS (22.13 ou plus récent) doit être installé sur le serveur. Deux méthodes ; vérifiez ensuite avec node -v.', 'Node.js 22 LTS (22.13 or newer) must be installed on the server. Two methods; then check with node -v.')),
  P([b(X('Méthode 1 — archive officielle (fonctionne aussi sans Internet sur le serveur). ', 'Method 1 — official archive (also works without Internet on the server). ')), X(`Téléchargez node-v${NV}-linux-x64.tar.xz et SHASUMS256.txt depuis https://nodejs.org/dist/v${NV}/ (sur un poste connecté, puis copiez-les sur le serveur) :`, `Download node-v${NV}-linux-x64.tar.xz and SHASUMS256.txt from https://nodejs.org/dist/v${NV}/ (on a connected workstation, then copy them to the server):`)], { size: 20 }),
  ...cmd(`grep " node-v${NV}-linux-x64.tar.xz$" SHASUMS256.txt | sha256sum -c -\nsudo tar -xJf node-v${NV}-linux-x64.tar.xz -C /usr/local --strip-components=1\nnode -v          # v${NV}`),
  P([b(X('Méthode 2 — dépôt NodeSource (serveur connecté à Internet). ', 'Method 2 — NodeSource repository (server connected to the Internet). '))], { size: 20 }),
  ...cmd(X('# Ubuntu, Debian\ncurl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs\n# RHEL, Rocky, AlmaLinux\ncurl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - && sudo dnf install -y nodejs\nnode -v          # v22.x (22.13 ou plus)', '# Ubuntu, Debian\ncurl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs\n# RHEL, Rocky, AlmaLinux\ncurl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - && sudo dnf install -y nodejs\nnode -v          # v22.x (22.13 or newer)')),
  P(X('Le paquet nodejs des dépôts standard d’Ubuntu ou de Debian est trop ancien (18 ou 20) : n’utilisez pas « apt install nodejs » sans NodeSource. Si Node.js est installé ailleurs, indiquez son chemin dans la variable CORTEXSKILLS_NODE (par exemple /opt/node22/bin/node).', 'The nodejs package of the standard Ubuntu or Debian repositories is too old (18 or 20): do not use “apt install nodejs” without NodeSource. If Node.js is installed elsewhere, give its path in the CORTEXSKILLS_NODE variable (for example /opt/node22/bin/node).'), { size: 20, color: C.muted }),
];
const envTable = local => table([X('Réglage', 'Setting'), X('Valeur', 'Value'), X('Exemple', 'Example')], [
  ['PUBLIC_URL', local ? X('http://localhost:4000 (évaluation sur la machine elle-même).', 'http://localhost:4000 (evaluation on the machine itself).') : X('L’adresse saisie par les utilisateurs, en HTTPS ; elle figure dans les liens envoyés par e-mail et WhatsApp.', 'The address users type, in HTTPS; it appears in the links sent by e-mail and WhatsApp.'), local ? 'http://localhost:4000' : X('https://competences.votre-entreprise.ma', 'https://skills.your-company.com')],
  ['CORS_ORIGIN', X('La même adresse.', 'The same address.'), local ? 'http://localhost:4000' : X('https://competences.votre-entreprise.ma', 'https://skills.your-company.com')],
  ['HOST, PORT', X('Interface et port d’écoute. 127.0.0.1 : seul le reverse proxy (ou le navigateur local) y accède.', 'Listening interface and port. 127.0.0.1: only the reverse proxy (or the local browser) reaches it.'), '127.0.0.1, 4000'],
  ['JWT_SECRET', X('Valeur aléatoire de 32 caractères ou plus (signe les sessions).', 'Random value of 32 characters or more (signs the sessions).'), X('affichée par « cortexskills secrets »', 'shown by “cortexskills secrets”')],
  ['CHANNEL_SECRET_KEY', X('Autre valeur aléatoire (chiffre les identifiants enregistrés).', 'Another random value (encrypts the stored credentials).'), X('affichée par « cortexskills secrets »', 'shown by “cortexskills secrets”')],
  ['ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD', X('L’administrateur de la plateforme, créé au premier démarrage. Mot de passe : 12 caractères min., majuscule, minuscule, chiffre, symbole. Effacez ADMIN_PASSWORD ensuite.', 'The platform administrator, created at first start. Password: 12 characters min., upper case, lower case, digit, symbol. Clear ADMIN_PASSWORD afterwards.'), X('it.ops@votre-entreprise.ma', 'it.ops@your-company.com')],
  ['REFERENCE_DATA', X('Premier démarrage : « oui » charge les organisations de référence ; « non » crée une base vide.', 'First start: “oui” loads the reference organizations; “non” creates an empty database.'), 'oui'],
  ['DATA_DIR', X('Facultatif : dossier des données. Par défaut data/ dans le dossier du paquet.', 'Optional: data folder. By default data/ in the package folder.'), '/var/lib/cortexskills'],
  ['BACKUP_RETENTION_DAYS', X('Jours de conservation des sauvegardes quotidiennes (environ 0,8 Go chacune).', 'Days the daily backups are kept (about 0.8 GB each).'), '7'],
  ['SMTP_*', X('Votre messagerie pour les invitations, relances et notifications.', 'Your mail server for invitations, reminders and notifications.'), X('smtp.votre-entreprise.ma, 587', 'smtp.your-company.com, 587')],
  ['WHATSAPP_*', X('Facultatif : WhatsApp Business Cloud API.', 'Optional: WhatsApp Business Cloud API.'), '—'],
], [2400, 4800, 2446], { size: 17 });
const editionNote = who => P(X(`Le paquet impose le mode « sur site » (licence signée obligatoire)${who === 'client' ? ' et masque toute information commerciale' : ''}, quelle que soit la valeur de DEPLOYMENT_MODE ou COMMERCIAL_INFO dans .env : ces réglages sont ignorés.`, `The package enforces the on-premises mode (signed licence required)${who === 'client' ? ' and hides all commercial information' : ''}, whatever the value of DEPLOYMENT_MODE or COMMERCIAL_INFO in .env: these settings are ignored.`), { size: 20, color: C.muted });
const DNS = X('competences.votre-entreprise.ma', 'skills.your-company.com'), DOM = X('votre-entreprise.ma', 'your-company.com');

// =============================================================== CUSTOMER GUIDE
const client = [
  ...cover({ eyebrow: X('Guide d’installation — Exécutable minifié — Côté client — Linux', 'Installation Guide — Minified runtime — Customer side — Linux'), title: 'CortexSkills', subtitle: X('Installer l’exécutable de production CortexSkills sur votre serveur Linux (cloud privé ou sur site), sans Docker, avec les données de référence de toutes les verticales et des PME, et activer votre licence', 'Install the CortexSkills production runtime on your Linux server (private cloud or on-premises), without Docker, with the reference data of every vertical and SMEs, and activate your licence'), meta: [`Version ${V} · ${today}`, 'AI Value'] }),
  ...tocPage(X('Table des matières', 'Table of Contents')),

  H1(X('1. Ce que vous installez', '1. What you install')),
  P(X(`CortexSkills est livré en un seul fichier compressé, ${PKGF} : un dossier à décompresser sur votre serveur, qui contient l’exécutable de production. Il fonctionne avec Node.js 22 installé sur le serveur ; aucune compilation et aucun accès Internet ne sont nécessaires. Vos données ne quittent pas vos serveurs : la base, les pièces jointes et les sauvegardes sont dans le dossier data/. Rien n’est envoyé à l’éditeur.`,
    `CortexSkills is delivered as a single compressed file, ${PKGF}: a folder to extract on your server, which holds the production runtime. It runs with Node.js 22 installed on the server; no build and no Internet access are needed. Your data does not leave your servers: the database, attachments and backups are in the data/ folder. Nothing is sent to the vendor.`)),
  table([X('Élément', 'Item'), X('Rôle', 'Role')], [
    ['cortexskills', X('Le lanceur : start (démarrer), admin (console d’installation), secrets, backup, restore, version.', 'The launcher: start, admin (installation console), secrets, backup, restore, version.')],
    ['installer-service.sh', X('Installe le service Linux (systemd) : utilisateur système dédié, droits des dossiers, démarrage au boot.', 'Installs the Linux service (systemd): dedicated system user, folder rights, start at boot.')],
    ['app/', X('L’application, en lecture seule pour le service.', 'The application, read-only for the service.')],
    ['data/', X('Base de données, pièces jointes, sauvegardes quotidiennes et licence installée. C’est la seule donnée à protéger.', 'Database, attachments, daily backups and installed licence. This is the only data to protect.')],
    ['.env', X('Vos réglages : adresse, secrets, administrateur, messagerie (créé à partir de env.example).', 'Your settings: address, secrets, administrator, mail (created from env.example).')],
    ['config/', X('cortexskills.service (systemd, durci) et nginx-cortexskills.conf (HTTPS).', 'cortexskills.service (hardened systemd unit) and nginx-cortexskills.conf (HTTPS).')],
    ['licence/', X('Où vous déposez le fichier de licence reçu de l’éditeur.', 'Where you put the licence file received from the vendor.')],
    ['LISEZMOI.txt · README.txt', X('Rappel des commandes essentielles, en français et en anglais.', 'Reminder of the essential commands, in French and English.')],
  ], W2),
  spacer(), minified('client'), perf,
  H2(X('1.1 Les données de référence', '1.1 The reference data')),
  ...refIntro('client'),

  H1(X('2. Prérequis', '2. Prerequisites')),
  H2(X('2.1 Serveur', '2.1 Server')),
  table([X('Élément', 'Item'), 'Minimum', X('Recommandé (300 utilisateurs et plus)', 'Recommended (300 users and more)')], [
    [X('Système', 'System'), X('Linux 64 bits x86-64 avec glibc 2.28 ou plus récente', 'Linux 64-bit x86-64 with glibc 2.28 or newer'), 'Ubuntu 22.04 / 24.04 LTS, Debian 12, RHEL / Rocky / AlmaLinux 9'],
    ['Node.js', X('22 LTS, 22.13 ou plus récent (chapitre 3)', '22 LTS, 22.13 or newer (chapter 3)'), `${NV}`],
    [X('Processeur', 'Processor'), '2 vCPU', '4 vCPU'],
    [X('Mémoire', 'Memory'), X('4 Go', '4 GB'), X('8 Go', '8 GB')],
    [X('Disque', 'Disk'), X('20 Go libres : application (environ 80 Mo), base avec les données de référence (environ 0,9 Go), sauvegardes quotidiennes (environ 0,8 Go chacune, 7 jours par défaut)', '20 GB free: application (about 80 MB), database with the reference data (about 0.9 GB), daily backups (about 0.8 GB each, 7 days by default)'), X('50 Go sur un stockage sauvegardé', '50 GB on backed-up storage')],
    [X('Logiciels', 'Software'), X('systemd ; tar et xz ; sha256sum ; un reverse proxy HTTPS (Nginx conseillé)', 'systemd; tar and xz; sha256sum; an HTTPS reverse proxy (Nginx recommended)'), X('Nginx et Certbot (Let’s Encrypt) ou le certificat de votre entreprise', 'Nginx and Certbot (Let’s Encrypt) or your company’s certificate')],
  ], [2000, 3600, 4046], { size: 18 }),
  P(X('Alpine Linux (musl) et les processeurs arm64 ne sont pas pris en charge par ce paquet : utilisez le paquet Docker, ou demandez la version correspondante à l’éditeur.', 'Alpine Linux (musl) and arm64 processors are not supported by this package: use the Docker package, or ask the vendor for the matching version.'), { size: 20, color: C.muted }),
  H2(X('2.2 Réseau', '2.2 Network')),
  table([X('Besoin', 'Need'), X('Détail', 'Detail')], [
    [X('Nom DNS', 'DNS name'), X(`Par exemple ${DNS}, pointant vers le serveur (un DNS interne suffit pour un intranet).`, `For example ${DNS}, pointing to the server (an internal DNS is enough for an intranet).`)],
    [X('Entrant', 'Inbound'), X('443/TCP pour les utilisateurs (et 80/TCP pour obtenir le certificat Let’s Encrypt). Le port 4000 reste fermé : l’application n’écoute que sur 127.0.0.1.', '443/TCP for the users (and 80/TCP to obtain the Let’s Encrypt certificate). Port 4000 stays closed: the application only listens on 127.0.0.1.')],
    ['Installation', X('Aucun accès Internet nécessaire si Node.js est installé depuis l’archive officielle (serveur isolé possible).', 'No Internet access needed if Node.js is installed from the official archive (isolated server possible).')],
    [X('Sortant en exploitation (facultatif)', 'Outbound in operation (optional)'), X('Votre serveur SMTP (souvent 587/TCP) ; graph.facebook.com en 443/TCP pour WhatsApp Business.', 'Your SMTP server (often 587/TCP); graph.facebook.com on 443/TCP for WhatsApp Business.')],
    [X('Navigateurs', 'Browsers'), X('Chrome, Edge, Firefox ou Safari récents.', 'Recent Chrome, Edge, Firefox or Safari.')],
  ], W2),
  H2(X('2.3 Ce que vous recevez de l’éditeur', '2.3 What you receive from the vendor')),
  table([X('Fichier', 'File'), X('Rôle', 'Role')], [
    [PKGF, X('L’exécutable : un seul fichier compressé (xz) avec l’application minifiée, le lanceur, le service, l’exemple Nginx, le modèle de réglages et la liste des empreintes.', 'The runtime: a single compressed file (xz) with the minified application, the launcher, the service, the Nginx example, the settings template and the list of checksums.')],
    [`${PKGF}.sha256`, X('L’empreinte SHA-256 du fichier, pour vérifier qu’il est intact.', 'The SHA-256 checksum of the file, to check it is intact.')],
    [`${GC}.docx / .pdf`, X('Ce guide.', 'This guide.')],
    [`${GU}.docx / .pdf`, X('Le Guide utilisateur : utilisation de l’application sur un cas réel complet.', 'The User Guide: use of the application on a complete real case.')],
    [X('Plus tard : <Votre_entreprise>.lic', 'Later: <Your_company>.lic'), X('Votre fichier de licence, envoyé par l’éditeur après votre demande (chapitre 9).', 'Your licence file, sent by the vendor after your request (chapter 9).')],
  ], W2),

  H1(X('3. Installer Node.js 22', '3. Install Node.js 22')),
  ...nodeLinux(),

  H1(X('4. Vérifier et décompresser le paquet', '4. Check and extract the package')),
  P(X('En administrateur (sudo). Le dossier conseillé est /opt/cortexskills : le service systemd protège les dossiers personnels (/home), n’y installez pas l’application.', 'As administrator (sudo). The recommended folder is /opt/cortexskills: the systemd service protects the home folders (/home), do not install the application there.')),
  ...cmd(`cd ~                                 # ${X('dossier où se trouvent les fichiers reçus', 'folder holding the files received')}\nsha256sum -c ${PKGF}.sha256          # ${X('doit répondre', 'must answer')}: ${PKGF}: OK\nsudo mkdir -p /opt/cortexskills\nsudo tar -xJf ${PKGF} -C /opt/cortexskills --strip-components=1\ncd /opt/cortexskills && sha256sum -c --quiet SHA256SUMS.txt && echo "${X('contenu intact', 'content intact')}"\n./cortexskills version`),
  P(X(`La dernière commande affiche « CortexSkills ${V} · customer edition · Node.js ${NV} · data /opt/cortexskills/data ». Si une vérification échoue, n’installez pas : demandez un nouvel envoi à l’éditeur.`, `The last command shows “CortexSkills ${V} · customer edition · Node.js ${NV} · data /opt/cortexskills/data”. If a check fails, do not install: ask the vendor for a new copy.`), { size: 20 }),

  H1(X('5. Réglages (.env)', '5. Settings (.env)')),
  ...cmd(`sudo cp env.example .env\n./cortexskills secrets          # ${X('affiche JWT_SECRET et CHANNEL_SECRET_KEY (et une troisième valeur, inutile ici)', 'shows JWT_SECRET and CHANNEL_SECRET_KEY (and a third value, not used here)')}\nsudo nano .env`),
  envTable(false),
  editionNote('client'),
  callout(X('Contrôles au démarrage', 'Start-up checks'), X(['L’application refuse de démarrer tant qu’un réglage est dangereux — secret court ou par défaut, deux secrets identiques, adresse qui n’est pas en HTTPS, CORS ouvert, clé privée de l’éditeur présente — et liste chaque problème dans son journal.', 'Gardez une copie de .env dans votre coffre : changer JWT_SECRET déconnecte tous les utilisateurs ; perdre CHANNEL_SECRET_KEY rend illisibles les identifiants de messagerie enregistrés.'],
    ['The application refuses to start while a setting is dangerous — short or default secret, two identical secrets, address not in HTTPS, open CORS, vendor private key present — and lists each problem in its log.', 'Keep a copy of .env in your vault: changing JWT_SECRET signs every user out; losing CHANNEL_SECRET_KEY makes the stored mail credentials unreadable.']), C.light),

  H1(X('6. Installer le service et démarrer', '6. Install the service and start')),
  ...cmd(`cd /opt/cortexskills\nsudo ./installer-service.sh\njournalctl -u cortexskills -f       # ${X('Ctrl+C pour quitter', 'Ctrl+C to quit')}`),
  P(X('installer-service.sh vérifie Node.js (22.13 ou plus), crée l’utilisateur système « cortexskills » (sans shell ni mot de passe), rend app/ en lecture seule (propriété de root), donne data/ au seul service, réserve .env à root et au service, installe /etc/systemd/system/cortexskills.service avec le chemin de Node.js, puis démarre le service et l’active au démarrage du serveur.', 'installer-service.sh checks Node.js (22.13 or newer), creates the “cortexskills” system user (no shell, no password), makes app/ read-only (owned by root), gives data/ to the service only, restricts .env to root and the service, installs /etc/systemd/system/cortexskills.service with the path of Node.js, then starts the service and enables it at server start.')),
  P(X('Au premier démarrage, l’application crée la base de production — catalogue de référence, modèles, administrateur de la plateforme et organisations de référence (1.1) — puis démarre. Cette étape dure de 5 à 15 minutes selon le serveur : ne l’interrompez pas. Le journal affiche « Production database ready … 61 reference organizations (no account can sign in) », puis « CortexSkills API is running ». Contrôle de santé, sur le serveur :', 'At first start, the application creates the production database — reference catalog, templates, platform administrator and reference organizations (1.1) — then starts. This step takes 5 to 15 minutes depending on the server: do not interrupt it. The log shows “Production database ready … 61 reference organizations (no account can sign in)”, then “CortexSkills API is running”. Health check, on the server:')),
  ...cmd(`curl -s http://127.0.0.1:4000/api/health\n{"status":"ok","initialized":true,"mode":"onprem","version":"${V}","demoAccounts":false}`),
  P(X('Effacez ensuite la valeur de ADMIN_PASSWORD dans .env (sudo nano .env), puis sudo systemctl restart cortexskills.', 'Then clear the value of ADMIN_PASSWORD in .env (sudo nano .env), then sudo systemctl restart cortexskills.'), { size: 20 }),
  table([X('Protection du service (config/cortexskills.service)', 'Service protection (config/cortexskills.service)'), X('Effet', 'Effect')], [
    ['User=cortexskills, NoNewPrivileges', X('Le processus n’a aucun privilège et ne peut pas en obtenir.', 'The process has no privilege and cannot obtain any.')],
    ['ProtectSystem=strict, ReadWritePaths=…/data', X('Tout le système de fichiers est en lecture seule pour le service, sauf data/.', 'The whole file system is read-only for the service, except data/.')],
    ['ProtectHome, PrivateTmp, PrivateDevices', X('Pas d’accès aux dossiers personnels, ni aux /tmp des autres, ni aux périphériques.', 'No access to home folders, to the others’ /tmp, or to devices.')],
    ['UMask=0077', X('Les fichiers créés (base, sauvegardes, pièces jointes) ne sont lisibles que par le service.', 'The files created (database, backups, attachments) are readable by the service only.')],
    ['TimeoutStartSec=30min', X('Laisse le temps au premier démarrage de charger les données de référence.', 'Leaves time for the first start to load the reference data.')],
  ], [4200, 5446], { size: 17 }),

  H1(X('7. HTTPS (Nginx)', '7. HTTPS (Nginx)')),
  ...cmd(`sudo apt -y install nginx certbot python3-certbot-nginx\nsudo cp config/nginx-cortexskills.conf /etc/nginx/conf.d/cortexskills.conf\nsudo nano /etc/nginx/conf.d/cortexskills.conf      # ${X('votre nom DNS et votre certificat', 'your DNS name and your certificate')}\nsudo certbot certonly --nginx -d ${DNS}\nsudo nginx -t && sudo systemctl reload nginx`),
  P(X('Le fichier redirige le port 80 vers HTTPS, n’accepte que TLS 1.2 et 1.3, autorise des pièces jointes de 30 Mo et transmet vers http://127.0.0.1:4000 avec les en-têtes X-Forwarded-*. Un autre reverse proxy (Apache, HAProxy, F5, IIS ARR, Traefik) convient de la même façon. Ouvrez ensuite votre adresse :', 'The file redirects port 80 to HTTPS, accepts only TLS 1.2 and 1.3, allows 30 MB attachments and forwards to http://127.0.0.1:4000 with the X-Forwarded-* headers. Another reverse proxy (Apache, HAProxy, F5, IIS ARR, Traefik) works the same way. Then open your address:')),
  ...shot(SH('01_connexion'), X('La page de connexion à votre adresse : aucun compte de démonstration', 'The sign-in page at your address: no demonstration account'), 500),
  P(X('Connectez-vous avec ADMIN_EMAIL et son mot de passe : les organisations de référence sont dans Portefeuille › Groupes et organisations.', 'Sign in with ADMIN_EMAIL and its password: the reference organizations are in Portfolio › Groups and organizations.'), { size: 20 }),
  ...shot(SH('05_organisations_reference'), X('Les organisations de référence, vues par l’administrateur de la plateforme', 'The reference organizations, seen by the platform administrator'), 560),
  H2(X('7.1 Les organisations de référence', '7.1 The reference organizations')),
  refTable(),

  H1(X('8. Créer votre organisation', '8. Create your organization')),
  P(X('L’organisation est votre entreprise dans CortexSkills, avec ses utilisateurs, ses projets et sa licence. Dans /opt/cortexskills :', 'The organization is your company in CortexSkills, with its users, projects and licence. In /opt/cortexskills:')),
  ...cmd(`${ADM} org-create \\\n  --name "${X('Votre entreprise', 'Your company')}" --domain ${DOM} \\\n  --admin-email ${X('prenom.nom', 'first.last')}@${DOM} --admin-name "${X('Prénom Nom', 'First Last')}" \\\n  --admin-password 'Str0ng#Passw0rd2026' --lang ${L} --country ${X('Maroc', 'Morocco')} --city Casablanca`),
  table(['Option', X('Signification', 'Meaning')], [
    ['--name', X('Nom affiché dans l’application.', 'Name shown in the application.')],
    ['--domain', X('Domaine e-mail de vos utilisateurs ; il désigne l’organisation dans les commandes suivantes.', 'E-mail domain of your users; it names the organization in the next commands.')],
    ['--admin-email, --admin-name, --admin-password', X('Premier administrateur de l’organisation (tous les droits). Mot de passe fort obligatoire.', 'First administrator of the organization (all rights). Strong password required.')],
    ['--lang', X('Langue par défaut : fr, en ou ar. Chaque utilisateur peut en changer.', 'Default language: fr, en or ar. Each user can change it.')],
    ['--sector, --segment, --employees, --country, --city', X('Profil facultatif, complétable ensuite dans l’application.', 'Optional profile, can be completed later in the application.')],
  ], W2, { size: 18 }),
  P(X('La console s’exécute avec l’utilisateur du service (sudo -u cortexskills), qui seul peut écrire dans data/. Elle affiche l’Organization ID. Vos utilisateurs ne peuvent pas se connecter avant l’installation de la licence.', 'The console runs as the service user (sudo -u cortexskills), the only one allowed to write in data/. It shows the Organization ID. Your users cannot sign in before the licence is installed.'), { size: 20 }),

  H1(X('9. Activer la licence', '9. Activate the licence')),
  P(X('La licence est un petit fichier signé (.lic) émis par l’éditeur pour votre Organization ID. Elle fixe le plan, le nombre d’utilisateurs, les add-ons et la date de fin. Elle est vérifiée avec la clé publique incluse dans le paquet : toute modification du fichier la rend invalide.', 'The licence is a small signed file (.lic) issued by the vendor for your Organization ID. It sets the plan, the number of users, the add-ons and the end date. It is verified with the public key included in the package: any change to the file makes it invalid.')),
  ...steps([[b(X('Demander. ', 'Request. ')), X('Affichez les informations à transmettre :', 'Show the information to send:')]]),
  ...cmd(`${ADM} licence-request --org ${DOM}`),
  P(X('Envoyez à l’éditeur, par e-mail, les lignes affichées (société et Organization ID). L’Organization ID n’est pas secret mais doit être recopié exactement.', 'Send the vendor, by e-mail, the lines shown (company and Organization ID). The Organization ID is not secret but must be copied exactly.'), { size: 20 }),
  ...steps([[b(X('Recevoir. ', 'Receive. ')), X('L’éditeur vous envoie un fichier comme L-0012_v1_Votre_entreprise.lic. Copiez-le dans licence/ :', 'The vendor sends you a file such as L-0012_v1_Your_company.lic. Copy it into licence/:')]]),
  ...cmd(X('sudo cp ~/L-0012_v1_Votre_entreprise.lic /opt/cortexskills/licence/ && sudo chmod 644 /opt/cortexskills/licence/*.lic', 'sudo cp ~/L-0012_v1_Your_company.lic /opt/cortexskills/licence/ && sudo chmod 644 /opt/cortexskills/licence/*.lic')),
  ...steps([[b(X('Installer ', 'Install ')), X('(sans redémarrage) :', '(no restart):')]]),
  ...cmd(`${ADM} licence-install --file licence/${X('L-0012_v1_Votre_entreprise.lic', 'L-0012_v1_Your_company.lic')}`),
  P(X('La console confirme le plan, le nombre d’utilisateurs et la date de fin, et copie la licence dans data/license.lic. Un fichier modifié, ou émis pour un autre Organization ID, est refusé avec un message explicite.', 'The console confirms the plan, the number of users and the end date, and copies the licence to data/license.lic. A modified file, or one issued for another Organization ID, is refused with a clear message.'), { size: 20 }),
  ...steps([[b(X('Vérifier. ', 'Check. ')), X('Connectez-vous avec l’administrateur de l’organisation, puis ouvrez Administration › Configuration et licence : la licence est « Active », avec le plan, le nombre d’utilisateurs et la date de fin.', 'Sign in with the organization administrator, then open Administration › Configuration and licence: the licence is “Active”, with the plan, the number of users and the end date.')]]),
  ...shot(SH('02_licence'), X('Administration › Configuration et licence après l’activation', 'Administration › Configuration and licence after activation'), 560),
  H2(X('9.1 Consulter la licence installée', '9.1 View the installed licence')),
  ...cmd(`${ADM} licence-list\n${ADM} licence-show --org ${DOM}`),
  H2(X('9.2 Ce que la licence décide', '9.2 What the licence decides')),
  P(X('Le plan, le nombre d’utilisateurs et les add-ons viennent uniquement de la licence : ils ne se modifient ni dans l’application ni par la console. L’écran le rappelle :', 'The plan, the number of users and the add-ons come only from the licence: they are changed neither in the application nor through the console. The screen says so:')),
  ...shot(SH('03_packs_sans_prix'), X('Le plan est fixé par la licence', 'The plan is set by the licence'), 560),
  H2(X('9.3 Renouvellement, changement, fin', '9.3 Renewal, change, end')),
  ...X([
    'L’application prévient les administrateurs 30 jours avant la date de fin ; après cette date, elle passe en lecture seule jusqu’à l’installation d’une nouvelle licence.',
    'Pour un renouvellement, davantage d’utilisateurs, un autre plan ou un add-on : demandez une nouvelle licence à l’éditeur et installez-la de la même façon (licence-install) ou par Administration › Configuration et licence › Téléverser la licence. Elle remplace la précédente.',
    `Retrait d’une licence (fin de contrat) : licence-remove --org ${DOM} --yes. Les utilisateurs de l’organisation ne peuvent plus se connecter ; les données restent dans data/.`,
  ], [
    'The application warns the administrators 30 days before the end date; after that date, it becomes read-only until a new licence is installed.',
    'For a renewal, more users, another plan or an add-on: ask the vendor for a new licence and install it the same way (licence-install) or through Administration › Configuration and licence › Upload the licence. It replaces the previous one.',
    `Removing a licence (end of contract): licence-remove --org ${DOM} --yes. The users of the organization can no longer sign in; the data stays in data/.`,
  ]).map(t => bullet(t)),

  H1(X('10. Exploitation', '10. Operation')),
  H2(X('10.1 Commandes courantes', '10.1 Everyday commands')),
  table(['Action', X('Commande (dans /opt/cortexskills)', 'Command (in /opt/cortexskills)')], [
    [X('Démarrer / arrêter / redémarrer', 'Start / stop / restart'), 'sudo systemctl start · stop · restart cortexskills'],
    [X('État et santé', 'Status and health'), 'systemctl status cortexskills · curl -s http://127.0.0.1:4000/api/health'],
    [X('Journal', 'Log'), 'journalctl -u cortexskills -f -n 200'],
    ['Version', './cortexskills version'],
    [X('Aide de la console', 'Console help'), `${ADM} help`],
    [X('Nouveau mot de passe d’un utilisateur', 'New password for a user'), `${ADM} password --email ${X('jean', 'john')}@${DOM} --password 'N3w#2026Passw0rd'`],
  ], [2900, 6746], { size: 17 }),
  H2(X('10.2 Sauvegardes', '10.2 Backups')),
  P(X('L’application écrit chaque jour une sauvegarde de la base dans data/backups (environ 0,8 Go chacune avec les données de référence ; BACKUP_RETENTION_DAYS jours conservés). Avant toute intervention, et chaque jour, copiez les sauvegardes et les pièces jointes hors du serveur :', 'The application writes a daily database backup in data/backups (about 0.8 GB each with the reference data; BACKUP_RETENTION_DAYS days kept). Before any intervention, and every day, copy the backups and attachments off the server:')),
  ...cmd(`sudo -u cortexskills ./cortexskills backup\nsudo rsync -a /opt/cortexskills/data/backups/ /opt/cortexskills/data/attachments/ backup@storage:/cortexskills/\n# ${X('ou une tâche planifiée : sudo crontab -e', 'or a scheduled task: sudo crontab -e')}\n30 2 * * * rsync -a /opt/cortexskills/data/ backup@storage:/cortexskills/`),
  H2(X('10.3 Restauration', '10.3 Restore')),
  ...cmd(`sudo systemctl stop cortexskills\nsudo -u cortexskills ./cortexskills restore               # ${X('liste les sauvegardes', 'lists the backups')}\nsudo -u cortexskills ./cortexskills restore <${X('fichier', 'file')}.db>\nsudo systemctl start cortexskills`),
  P(X('La base actuelle est conservée à côté des sauvegardes (before-restore-<date>.db). Une sauvegarde d’une version antérieure est mise à niveau au démarrage.', 'The current database is kept next to the backups (before-restore-<date>.db). A backup from an earlier version is upgraded at start.'), { size: 20 }),
  H2(X('10.4 Mise à jour', '10.4 Update')),
  P(X('Une nouvelle version remplace app/, config/ et les scripts ; .env, data/ et licence/ sont conservés :', 'A new version replaces app/, config/ and the scripts; .env, data/ and licence/ are kept:')),
  ...cmd(`sudo -u cortexskills /opt/cortexskills/cortexskills backup\nsha256sum -c Runtime_Customer_Linux_CortexSkills_<version>.tar.xz.sha256\nmkdir -p /tmp/cs-new && tar -xJf Runtime_Customer_Linux_CortexSkills_<version>.tar.xz -C /tmp/cs-new --strip-components=1\nsudo systemctl stop cortexskills\ncd /opt/cortexskills && sudo rm -rf app config\nsudo cp -r /tmp/cs-new/{app,config,cortexskills,installer-service.sh,env.example,LISEZMOI.txt,README.txt,SHA256SUMS.txt} .\nsudo ./installer-service.sh            # ${X('réapplique les droits et redémarre ; la base est migrée au démarrage', 're-applies the rights and restarts; the database is migrated at start')}\n./cortexskills version`),
  H2(X('10.5 Désinstallation', '10.5 Uninstall')),
  P(X('sudo systemctl disable --now cortexskills, puis sudo rm /etc/systemd/system/cortexskills.service. Le dossier /opt/cortexskills contient toutes les données (data/) : faites et copiez une sauvegarde avant de le supprimer.', 'sudo systemctl disable --now cortexskills, then sudo rm /etc/systemd/system/cortexskills.service. The /opt/cortexskills folder holds all the data (data/): make and copy a backup before deleting it.')),

  H1(X('11. Sécurité', '11. Security')),
  ...X([
    'Le service s’exécute avec un utilisateur système sans privilège, sur un système de fichiers en lecture seule sauf data/ (chapitre 6).',
    'L’application n’écoute que sur 127.0.0.1 ; seul le HTTPS du reverse proxy est exposé.',
    'Gardez .env lisible par root et le service seulement (installer-service.sh le règle) et ses secrets dans votre coffre.',
    'Mots de passe stockés hachés ; sessions limitées à JWT_TTL (12 h par défaut) ; chaque action d’administration est inscrite au journal d’audit. Aucun compte de démonstration : seuls l’administrateur de la plateforme et les utilisateurs que vous créez peuvent se connecter.',
    'Ne modifiez pas les fichiers de app/ : la licence d’utilisation l’interdit, et une modification est écrasée à la mise à jour suivante.',
    'Appliquez les mises à jour du système, de Node.js 22 (versions correctives) et de Nginx, et les mises à jour de CortexSkills envoyées par l’éditeur.',
  ], [
    'The service runs as an unprivileged system user, on a file system that is read-only except data/ (chapter 6).',
    'The application only listens on 127.0.0.1; only the reverse proxy’s HTTPS is exposed.',
    'Keep .env readable by root and the service only (installer-service.sh sets this) and its secrets in your vault.',
    'Passwords stored hashed; sessions limited to JWT_TTL (12 h by default); every administration action is written to the audit log. No demonstration account: only the platform administrator and the users you create can sign in.',
    'Do not change the files of app/: the licence of use forbids it, and a change is overwritten at the next update.',
    'Apply the updates of the system, of Node.js 22 (patch releases) and of Nginx, and the CortexSkills updates sent by the vendor.',
  ]).map(t => bullet(t)),

  H1(X('12. Dépannage', '12. Troubleshooting')),
  table([X('Ce que vous voyez', 'What you see'), X('Cause', 'Cause'), X('Que faire', 'What to do')], X([
    ['« Node.js 22 introuvable » / « not found »', 'Node.js n’est pas installé, ou pas dans le PATH.', 'Chapitre 3 ; ou CORTEXSKILLS_NODE=/chemin/vers/node.'],
    ['« needs Node.js 22.13 or newer »', 'Version de Node.js trop ancienne (paquet de la distribution).', 'Installez Node.js 22 depuis l’archive officielle ou NodeSource (chapitre 3).'],
    ['« will not start in production mode » dans le journal', 'Un réglage de .env manque ou est dangereux.', 'Lisez la liste du journal : chaque ligne nomme le réglage à corriger, puis sudo systemctl restart cortexskills.'],
    ['« First start: set ADMIN_EMAIL and ADMIN_PASSWORD »', 'Premier démarrage sans administrateur.', 'Renseignez-les dans .env, redémarrez, puis effacez ADMIN_PASSWORD.'],
    ['systemctl status : « activating » pendant plusieurs minutes', 'Premier démarrage : chargement des données de référence.', 'Normal (5 à 15 minutes) : suivez journalctl -u cortexskills -f. Ne redémarrez pas pendant cette étape.'],
    ['« Port 4000 is already in use »', 'Une autre application, ou CortexSkills lancé deux fois.', 'Arrêtez l’autre processus, ou changez PORT dans .env et dans la configuration Nginx.'],
    ['« EACCES » ou « read-only file system » au démarrage', 'Dossier data/ déplacé ou droits modifiés ; ou installation sous /home.', 'Relancez sudo ./installer-service.sh ; installez dans /opt/cortexskills.'],
    ['« GLIBC_2.28 not found » ou « cannot execute binary file »', 'Système trop ancien, Alpine (musl) ou processeur arm64.', 'Utilisez un Linux x86-64 récent (2.1), ou le paquet Docker.'],
    ['502 Bad Gateway dans le navigateur', 'Le service est arrêté ou encore au premier démarrage.', 'systemctl status cortexskills ; journalctl -u cortexskills.'],
    ['Un compte d’une organisation de référence est refusé', 'Ces comptes ne peuvent pas se connecter (1.1).', 'Connectez-vous avec l’administrateur de la plateforme ou avec les comptes de votre organisation.'],
    ['« No space left on device »', 'Disque plein (sauvegardes).', 'Libérez de la place, réduisez BACKUP_RETENTION_DAYS et copiez les sauvegardes hors du serveur.'],
    ['sha256sum : « FAILED »', 'Fichier incomplet ou altéré.', 'Demandez un nouvel envoi.'],
    ['« The licence of this Organization is not active »', 'Licence non installée ou expirée.', 'Chapitre 9 ; vérifiez la date de fin.'],
    ['licence-install : « signature is not valid »', 'Fichier modifié ou non émis par l’éditeur.', 'Redemandez le fichier ; ne l’ouvrez pas dans un éditeur de texte qui le reformaterait.'],
    ['licence-install : « Organization ID … does not exist »', 'Licence émise pour un autre ID.', 'Comparez avec org-list et renvoyez le bon ID à l’éditeur.'],
    ['Changer de plan ou d’add-on est refusé', 'Le plan et les add-ons sont fixés par la licence.', 'Demandez une nouvelle licence à l’éditeur.'],
  ], [
    ['“Node.js 22 not found”', 'Node.js is not installed, or not in the PATH.', 'Chapter 3; or CORTEXSKILLS_NODE=/path/to/node.'],
    ['“needs Node.js 22.13 or newer”', 'Node.js version too old (distribution package).', 'Install Node.js 22 from the official archive or NodeSource (chapter 3).'],
    ['“will not start in production mode” in the log', 'A setting of .env is missing or dangerous.', 'Read the list in the log: each line names the setting to fix, then sudo systemctl restart cortexskills.'],
    ['“First start: set ADMIN_EMAIL and ADMIN_PASSWORD”', 'First start without an administrator.', 'Fill them in .env, restart, then clear ADMIN_PASSWORD.'],
    ['systemctl status: “activating” for several minutes', 'First start: loading the reference data.', 'Normal (5 to 15 minutes): follow journalctl -u cortexskills -f. Do not restart during this step.'],
    ['“Port 4000 is already in use”', 'Another application, or CortexSkills started twice.', 'Stop the other process, or change PORT in .env and in the Nginx configuration.'],
    ['“EACCES” or “read-only file system” at start', 'data/ folder moved or rights changed; or installation under /home.', 'Run sudo ./installer-service.sh again; install in /opt/cortexskills.'],
    ['“GLIBC_2.28 not found” or “cannot execute binary file”', 'System too old, Alpine (musl) or arm64 processor.', 'Use a recent Linux x86-64 (2.1), or the Docker package.'],
    ['502 Bad Gateway in the browser', 'The service is stopped or still in its first start.', 'systemctl status cortexskills; journalctl -u cortexskills.'],
    ['An account of a reference organization is refused', 'These accounts cannot sign in (1.1).', 'Sign in with the platform administrator or with the accounts of your organization.'],
    ['“No space left on device”', 'Disk full (backups).', 'Free space, reduce BACKUP_RETENTION_DAYS and copy the backups off the server.'],
    ['sha256sum: “FAILED”', 'Incomplete or altered file.', 'Ask for a new copy.'],
    ['“The licence of this Organization is not active”', 'Licence not installed or expired.', 'Chapter 9; check the end date.'],
    ['licence-install: “signature is not valid”', 'File modified or not issued by the vendor.', 'Ask for the file again; do not open it in a text editor that would reformat it.'],
    ['licence-install: “Organization ID … does not exist”', 'Licence issued for another ID.', 'Compare with org-list and send the right ID to the vendor.'],
    ['Changing plan or add-on is refused', 'The plan and add-ons are set by the licence.', 'Ask the vendor for a new licence.'],
  ]), [3000, 2900, 3746], { size: 16 }),

  H1(X('13. Assistance', '13. Support')),
  P(X('Pour contacter l’éditeur, joignez : le résultat de ./cortexskills version, celui de systemctl status cortexskills et les 200 dernières lignes de journalctl -u cortexskills. N’envoyez jamais le fichier .env ni ses secrets.', 'To contact the vendor, attach: the output of ./cortexskills version, that of systemctl status cortexskills and the last 200 lines of journalctl -u cortexskills. Never send the .env file or its secrets.')),
];

// =============================================================== EDITOR GUIDE — LINUX AND WINDOWS
const PLANS = [['PK-01', X('Offre ingénierie de formation de base', 'Core training engineering offer'), 'PK-01'], ['PK-02', X('Offre réalisation et expérience d’apprentissage', 'Delivery and learning experience offer'), 'PK-02'], ['PK-03', X('Offre évaluation, analytique et ROI', 'Evaluation, analytics and ROI offer'), 'PK-03'], ['PK-04', X('Offre conformité et certification', 'Compliance and certification offer'), 'PK-04'], ['PK-05', X('Offre talents et mobilité', 'Talent and mobility offer'), 'PK-05'], ['PK-06', X('Offre entreprise étendue', 'Extended enterprise offer'), 'PK-06'], ['PK-07', X('Offre conseil et diagnostic', 'Consulting and diagnostic offer'), 'PK-07'], ['PK-08', X('Offre pilotage stratégique des effectifs et gouvernance', 'Strategic workforce planning and governance offer'), 'PK-08'], ['BND-01', X('Pack Démarrage', 'Starter Bundle'), 'PK-01, PK-02'], ['BND-02', X('Pack Croissance', 'Growth Bundle'), X('PK-01 à PK-03', 'PK-01 to PK-03')], ['BND-03', X('Pack Entreprise', 'Enterprise Bundle'), X('PK-01 à PK-05', 'PK-01 to PK-05')], ['BND-04', X('Pack Stratégique', 'Strategic Bundle'), X('PK-01 à PK-06, PK-08', 'PK-01 to PK-06, PK-08')], ['BND-05', X('Suite complète', 'Full Suite'), X('PK-01 à PK-08', 'PK-01 to PK-08')], ['SME-ESS', X('Pack PME Essentiel', 'SME Essentials Pack'), 'PK-01'], ['SME-GRO', X('Pack PME Croissance', 'SME Growth Pack'), X('PK-01 à PK-03', 'PK-01 to PK-03')], ['SME-CMP', X('Pack PME Complet', 'SME Complete Pack'), X('PK-01 à PK-08', 'PK-01 to PK-08')]];
const ADDONS = [['AD-01', X('Apprentissage immersif (RV/RA/simulation)', 'Immersive learning (VR/AR/simulation)')], ['AD-02', X('Moteur de personnalisation IA', 'AI personalisation engine')], ['AD-03', X('Analytique prédictive', 'Predictive analytics')], ['AD-04', X('Apprentissage social et collaboratif', 'Social and collaborative learning')], ['AD-05', X('Moteur de ludification', 'Gamification engine')], ['AD-06', X('Curation et agrégation de contenus', 'Content curation and aggregation')], ['AD-07', X('Capture et transfert des savoirs d’experts', 'Expert knowledge capture and transfer')], ['AD-08', X('Déploiement multi-sites / multi-entités', 'Multi-site / multi-entity deployment')], ['AD-09', X('Validation externe du plan de formation', 'External validation of the training plan')], ['AD-10', X('Maturité managériale', 'Managerial maturity')], ['AD-11', X('Bibliothèque de questionnaires et diffusion multicanale', 'Questionnaire library and multi-channel distribution')]];
// cslic: French command names in the French guide, English aliases in the English guide.
const CS = X({ imp: 'importer', create: 'creer', list: 'lister', show: 'afficher', upd: 'modifier', renew: 'renouveler', revoke: 'revoquer', del: 'supprimer', fp: 'empreinte', pk: 'cle-publique', verify: 'verifier', help: 'aide', company: '--societe', users: '--utilisateurs', end: '--fin', reason: '--motif', yes: '--oui', all: '--tout', features: '--fonctions' },
  { imp: 'import', create: 'create', list: 'list', show: 'show', upd: 'update', renew: 'renew', revoke: 'revoke', del: 'delete', fp: 'fingerprint', pk: 'public-key', verify: 'verify', help: 'help', company: '--company', users: '--users', end: '--end', reason: '--reason', yes: '--yes', all: '--all', features: '--features' });
const editeur = [
  ...cover({ eyebrow: X('Guide d’installation — Exécutable minifié — Côté éditeur — Linux et Windows', 'Installation Guide — Minified runtime — Editor side — Linux and Windows'), title: 'CortexSkills', subtitle: X('Poste de signature, scénario a (cloud privé / sur site, serveur Linux), scénario b (localhost sous Windows), sans Docker, données de référence et gestion des licences (créer, lire, modifier, révoquer, supprimer)', 'Signing workstation, scenario a (private cloud / on-premises, Linux server), scenario b (localhost on Windows), without Docker, reference data and licence management (create, read, update, revoke, delete)'), meta: [`Version ${V} · ${today}`, X('Interne — AI Value', 'Internal — AI Value')] }),
  ...tocPage(X('Table des matières', 'Table of Contents')),

  H1(X('1. Vue d’ensemble', '1. Overview')),
  P(X(`Tout ce dont l’éditeur a besoin tient dans un seul fichier, ${EDF} ; l’exécutable client, ${PKGF}, s’envoie tel quel aux clients. Les deux sont des exécutables de production minifiés, prêts à lancer avec Node.js 22 : ni Docker, ni npm, ni compilation. Ce guide décrit deux scénarios : a — cloud privé ou sur site, sur un serveur Linux (service systemd et HTTPS) ; b — localhost, sur un poste Windows 10 / 11. Les deux installations sont des versions de production : données de référence de toutes les verticales et des PME, aucun compte de démonstration.`,
    `Everything the editor needs fits in a single file, ${EDF}; the customer runtime, ${PKGF}, is sent as is to customers. Both are minified production runtimes, ready to run with Node.js 22: no Docker, no npm, no build. This guide describes two scenarios: a — private cloud or on-premises, on a Linux server (systemd service and HTTPS); b — localhost, on a Windows 10 / 11 workstation. Both installations are production versions: reference data of every vertical and SMEs, no demonstration account.`)),
  table([X('Dans le paquet éditeur', 'In the editor package'), X('Contenu', 'Content'), X('Où l’utiliser', 'Where to use it')], [
    ['cortexskills · cortexskills.cmd', X('Le lanceur sous Linux et sous Windows : start, admin (console), secrets, backup, restore, version.', 'The launcher on Linux and Windows: start, admin (console), secrets, backup, restore, version.'), X('Scénarios a et b.', 'Scenarios a and b.')],
    ['cslic · cslic.cmd · cslic-sauvegarder', X('Le gestionnaire de licences (importer, créer, lister, afficher, modifier, renouveler, révoquer, supprimer, vérifier) et la sauvegarde chiffrée du poste (Linux).', 'The licence manager (import, create, list, show, update, renew, revoke, delete, verify) and the encrypted backup of the workstation (Linux).'), X('Votre poste uniquement : le poste de signature.', 'Your workstation only: the signing workstation.')],
    ['app/', X('CortexSkills, version éditeur (tarifs visibles), et le gestionnaire de licences, minifiés.', 'CortexSkills, editor edition (prices shown), and the licence manager, minified.'), X('Scénarios a et b.', 'Scenarios a and b.')],
    ['installer-service.sh · config/', X('Service systemd durci et exemple Nginx (HTTPS).', 'Hardened systemd service and Nginx example (HTTPS).'), X('Scénario a.', 'Scenario a.')],
    ['poste-signature/', X('Votre paire de clés de signature (vendor-private.pem, vendor-public.pem), créée pour vous lors de la préparation des paquets ; les paquets contiennent la clé publique correspondante.', 'Your signing key pair (vendor-private.pem, vendor-public.pem), created for you when the packages were prepared; the packages contain the matching public key.'), X('À importer une fois (cslic importer), puis à supprimer du paquet.', 'To import once (cslic import), then delete from the package.')],
    ['LISEZMOI.txt · README.txt', X('Rappel des commandes essentielles, en français et en anglais.', 'Reminder of the essential commands, in French and English.'), X('Votre poste.', 'Your workstation.')],
    [`${PKGF} (${X('fichier séparé', 'separate file')})`, X('L’exécutable client (Linux) : sans tarif ni élément commercial.', 'The customer runtime (Linux): with no price and no commercial content.'), X('Envoyé tel quel aux clients avec son .sha256, le guide d’installation client et le guide utilisateur client.', 'Sent as is to customers with its .sha256, the customer installation guide and the customer user guide.')],
  ], [2700, 4400, 2546], { size: 17 }),
  spacer(), minified('editeur'), perf,
  H2(X('1.1 Les données de référence', '1.1 The reference data')),
  ...refIntro('editeur'),
  spacer(),
  callout(X('Comment l’application est protégée', 'How the application is protected'), X([
    'Code minifié : chaque fichier du serveur est compacté (sans commentaires, noms internes raccourcis, mise en forme supprimée) ; l’interface est compilée et minifiée ; aucune source map, aucun test, aucun outil de signature. La construction du paquet vérifie qu’aucun fichier de l’application n’est lisible avant de produire le fichier.',
    'Licence signée Ed25519 : le plan, le nombre d’utilisateurs, les add-ons et la date de fin viennent uniquement du fichier .lic ; un fichier modifié est refusé ; le client ne peut changer ni le plan ni les add-ons, ni dans l’écran ni par la console.',
    'Mode figé : le paquet impose le mode sur site (licence obligatoire) et, côté client, l’absence d’information commerciale, quels que soient les réglages de .env.',
    'Clé publique à un emplacement fixe dans app/ ; aucun réglage ne permet d’en désigner une autre. L’application refuse de démarrer si une clé privée se trouve dans son dossier.',
    'Version client sans élément commercial : aucun prix, aucun devis, pas d’écran Tarifs ; les prix sont retirés jusque dans la base.',
    'Service Linux non privilégié, en lecture seule sauf data/, port local uniquement.'], [
    'Minified code: each server file is compacted (no comments, internal names shortened, formatting removed); the web client is compiled and minified; no source map, no test, no signing tool. The package build checks that no application file is readable before producing the file.',
    'Ed25519-signed licence: the plan, the number of users, the add-ons and the end date come only from the .lic file; a modified file is refused; the customer can change neither the plan nor the add-ons, neither on screen nor through the console.',
    'Fixed mode: the package enforces the on-premises mode (licence required) and, on the customer side, the absence of commercial information, whatever the settings of .env.',
    'Public key at a fixed place in app/; no setting can point to another one. The application refuses to start if a private key is in its folder.',
    'Customer edition without commercial content: no price, no quotation, no Pricing screen; the prices are removed down to the database.',
    'Unprivileged Linux service, read-only except data/, local port only.'])),
  P(X('Limite à connaître : du code minifié reste exécutable, donc lisible avec effort par un administrateur déterminé disposant de tous les droits sur le serveur ; c’est moins protégé que le paquet Docker, où le code n’est pas accessible sans extraire l’image. La protection technique se complète par le contrat (licence d’utilisation, interdiction de rétro-ingénierie, droit d’audit, nombre d’utilisateurs, date de fin).', 'Limit to know: minified code remains executable, hence readable with effort by a determined administrator with full rights on the server; it is less protected than the Docker package, where the code is not reachable without extracting the image. Technical protection is completed by the contract (licence of use, ban on reverse engineering, audit right, number of users, end date).'), { size: 20, color: C.muted }),

  H1(X('2. Prérequis et préparation', '2. Prerequisites and preparation')),
  H2(X('2.1 Machines', '2.1 Machines')),
  table(['Machine', X('Besoin', 'Need')], [
    [X('Serveur (scénario a)', 'Server (scenario a)'), X('Linux 64 bits x86-64 avec glibc 2.28+ (Ubuntu 22.04 / 24.04, Debian 12, RHEL / Rocky / AlmaLinux 9), 2 vCPU, 4 Go de RAM, 20 Go de disque libre (4 vCPU / 8 Go au-delà de 100 utilisateurs actifs) ; Node.js 22 LTS ; systemd ; Nginx ; un nom DNS ; ports 80/443.', 'Linux 64-bit x86-64 with glibc 2.28+ (Ubuntu 22.04 / 24.04, Debian 12, RHEL / Rocky / AlmaLinux 9), 2 vCPU, 4 GB RAM, 20 GB free disk (4 vCPU / 8 GB beyond 100 active users); Node.js 22 LTS; systemd; Nginx; a DNS name; ports 80/443.')],
    [X('Poste Windows (signature et scénario b)', 'Windows workstation (signing and scenario b)'), X('Windows 10 22H2 ou Windows 11, 64 bits (x64), 8 Go de RAM conseillés, 20 Go de disque libre ; Node.js 22 LTS. Ni WSL, ni Docker.', 'Windows 10 22H2 or Windows 11, 64-bit (x64), 8 GB RAM recommended, 20 GB free disk; Node.js 22 LTS. No WSL, no Docker.')],
    [X('Poste de signature sous Linux (au choix)', 'Signing workstation on Linux (alternative)'), X('Linux 64 bits x86-64 avec Node.js 22 ; unzip, sha256sum, openssl (pour cslic-sauvegarder).', 'Linux 64-bit x86-64 with Node.js 22; unzip, sha256sum, openssl (for cslic-sauvegarder).')],
    ['Internet', X('Pas nécessaire pour installer CortexSkills une fois Node.js installé (serveurs et postes isolés possibles).', 'Not needed to install CortexSkills once Node.js is installed (isolated servers and workstations possible).')],
  ], W2),
  H2(X('2.2 Installer Node.js 22', '2.2 Install Node.js 22')),
  P([b('Windows. '), X(`Sur https://nodejs.org/fr/download, choisissez la version 22 (LTS), « Windows Installer (.msi) », x64 ; installez avec les options par défaut (ajout au PATH). Ouvrez une nouvelle invite de commandes : node -v affiche v22.x (22.13 ou plus ; version validée : ${NV}).`, `On https://nodejs.org/en/download, choose version 22 (LTS), “Windows Installer (.msi)”, x64; install with the default options (added to the PATH). Open a new command prompt: node -v shows v22.x (22.13 or newer; validated version: ${NV}).`)], { size: 20 }),
  P([b(X('Linux (serveur du scénario a, ou poste de signature). ', 'Linux (scenario a server, or signing workstation). '))], { size: 20 }),
  ...nodeLinux(),
  H2(X('2.3 Vérifier et décompresser le paquet', '2.3 Check and extract the package')),
  P(X('Sous Windows, dans PowerShell (le dossier C:\\CortexSkills est un exemple ; évitez « Program Files », protégé en écriture) :', 'On Windows, in PowerShell (the C:\\CortexSkills folder is an example; avoid “Program Files”, which is write-protected):')),
  ...cmd(`cd $env:USERPROFILE\\Downloads\n(Get-FileHash ${EDF} -Algorithm SHA256).Hash.ToLower()     # ${X('identique au contenu du .sha256', 'same as the content of the .sha256')}\nUnblock-File ${EDF}\nExpand-Archive ${EDF} -DestinationPath C:\\CortexSkills\ncd C:\\CortexSkills\\${ED}\n.\\cortexskills.cmd version`),
  P(X('Unblock-File retire la marque « téléchargé depuis Internet » : sans elle, Windows SmartScreen demande une confirmation à chaque lancement d’un .cmd.', 'Unblock-File removes the “downloaded from the Internet” mark: without it, Windows SmartScreen asks for a confirmation at each launch of a .cmd.'), { size: 20 }),
  P(X('Sous Linux :', 'On Linux:')),
  ...cmd(`sha256sum -c ${EDF}.sha256 && unzip -q ${EDF} -d ~/cortexskills && cd ~/cortexskills/${ED}\nsha256sum -c --quiet SHA256SUMS.txt && echo "${X('contenu intact', 'content intact')}"\n./cortexskills version`),

  H1(X('3. Le poste de signature (une seule fois)', '3. The signing workstation (once)')),
  P(X('Le poste de signature est votre poste de travail, Windows ou Linux. Dans le dossier du paquet :', 'The signing workstation is your own workstation, Windows or Linux. In the package folder:')),
  ...steps([X('Installez votre paire de clés et créez le registre des licences, puis supprimez le dossier poste-signature :', 'Install your key pair and create the licence register, then delete the poste-signature folder:')]),
  ...cmd(`# Windows (PowerShell, ${X('dans', 'in')} C:\\CortexSkills\\${ED})\n.\\cslic.cmd ${CS.imp} poste-signature\nicacls $env:USERPROFILE\\.cortexskills-editeur /inheritance:r /grant:r "$($env:USERNAME):(OI)(CI)F"\nRemove-Item -Recurse poste-signature\n# Linux\n./cslic ${CS.imp} poste-signature && rm -r poste-signature`),
  P(X('cslic enregistre tout dans %USERPROFILE%\\.cortexskills-editeur (Windows) ou ~/.cortexskills-editeur (Linux) : cles/vendor-private.pem (secrète), cles/vendor-public.pem, registre.json, licences/, archives/ et journal.log. La commande icacls réserve ce dossier à votre compte Windows ; sous Linux, cslic le crée avec les droits 700. cslic affiche l’empreinte de la clé publique : notez-la, vos clients peuvent la comparer.', 'cslic saves everything in %USERPROFILE%\\.cortexskills-editeur (Windows) or ~/.cortexskills-editeur (Linux): cles/vendor-private.pem (secret), cles/vendor-public.pem, registre.json, licences/, archives/ and journal.log. The icacls command restricts this folder to your Windows account; on Linux, cslic creates it with rights 700. cslic shows the fingerprint of the public key: note it, your customers can compare it. The licence manager accepts English commands and options (import, create, --company, --users, --end…); its messages are in French.'), { size: 20 }),
  ...steps([X('Sauvegardez immédiatement le poste de signature, hors ligne et chiffré :', 'Back up the signing workstation immediately, offline and encrypted:')]),
  ...cmd(X('# Linux : archive chiffrée AES-256 (mot de passe demandé)\n./cslic-sauvegarder ~/coffre           # → cortexskills-editeur-AAAA-MM-JJ.tar.gz.enc\n# restauration : openssl enc -d -aes-256-cbc -pbkdf2 -in <fichier.enc> | tar -xz -C ~\n# Windows : archive 7-Zip chiffrée (AES-256), à conserver hors ligne\n& "C:\\Program Files\\7-Zip\\7z.exe" a -p -mhe=on "$env:USERPROFILE\\Documents\\cortexskills-editeur-$(Get-Date -f yyyy-MM-dd).7z" "$env:USERPROFILE\\.cortexskills-editeur"',
    '# Linux: AES-256 encrypted archive (password asked)\n./cslic-sauvegarder ~/vault            # → cortexskills-editeur-YYYY-MM-DD.tar.gz.enc\n# restore: openssl enc -d -aes-256-cbc -pbkdf2 -in <file.enc> | tar -xz -C ~\n# Windows: 7-Zip encrypted archive (AES-256), kept offline\n& "C:\\Program Files\\7-Zip\\7z.exe" a -p -mhe=on "$env:USERPROFILE\\Documents\\cortexskills-editeur-$(Get-Date -f yyyy-MM-dd).7z" "$env:USERPROFILE\\.cortexskills-editeur"')),
  callout(X('Règles de la clé privée', 'Private key rules'), X(['Elle ne quitte jamais votre poste : ni serveur du scénario a, ni client, ni messagerie, ni dépôt de code.', 'Si elle est perdue, vous ne pouvez plus émettre ni renouveler de licence ; si elle est divulguée, n’importe qui peut en émettre. Dans les deux cas, il faut une nouvelle paire de clés et de nouveaux paquets et licences pour tous les clients.', 'Sur un autre poste, restaurez la sauvegarde chiffrée ; ne créez pas de nouvelle paire (cslic init), sauf changement de clés volontaire (chapitre 7).', 'Cette paire a été créée pour vous lors de la préparation des paquets : elle n’est conservée nulle part ailleurs que dans le paquet éditeur. Après l’import et la sauvegarde, supprimez aussi le fichier zip reçu.'],
    ['It never leaves your workstation: not to a scenario a server, not to a customer, not by e-mail, not into a code repository.', 'If it is lost, you can no longer issue or renew a licence; if it is disclosed, anyone can issue one. In both cases, a new key pair and new packages and licences for every customer are needed.', 'On another workstation, restore the encrypted backup; do not create a new pair (cslic init), except for a deliberate key change (chapter 7).', 'This pair was created for you when the packages were prepared: it is kept nowhere else than in the editor package. After the import and the backup, also delete the zip file received.']), C.light),
  P(X(`Pour taper simplement « cslic » : Windows, ajoutez C:\\CortexSkills\\${ED} à la variable PATH de votre compte ; Linux, alias cslic="$HOME/cortexskills/${ED}/cslic" dans ~/.bashrc.`, `To type just “cslic”: on Windows, add C:\\CortexSkills\\${ED} to your account’s PATH variable; on Linux, alias cslic="$HOME/cortexskills/${ED}/cslic" in ~/.bashrc.`), { size: 20 }),

  H1(X('4. Scénario a — Cloud privé ou sur site (serveur Linux)', '4. Scenario a — Private cloud or on-premises (Linux server)')),
  P(X('Sur un serveur Linux que vous administrez — cloud privé, serveur sur site ou VPS — pour un pilote ou une démonstration en HTTPS. Mêmes protections que chez un client ; la signature reste sur votre poste : ne copiez jamais poste-signature/ ni le dossier .cortexskills-editeur sur le serveur.', 'On a Linux server you manage — private cloud, on-premises server or VPS — for a pilot or a demonstration in HTTPS. Same protections as at a customer; signing stays on your workstation: never copy poste-signature/ or the .cortexskills-editeur folder to the server.')),
  H2(X('4.1 Node.js, copie et décompression sur le serveur', '4.1 Node.js, copy and extraction on the server')),
  P(X('Installez Node.js 22 sur le serveur (2.2, partie Linux), puis :', 'Install Node.js 22 on the server (2.2, Linux part), then:'), { size: 20 }),
  ...cmd(`scp ${EDF} ${EDF}.sha256 user@server:~      # ${X('depuis votre poste', 'from your workstation')}\n# ${X('sur le serveur', 'on the server')}\nsudo apt -y install unzip nginx certbot python3-certbot-nginx\nsha256sum -c ${EDF}.sha256\nsudo unzip -q ${EDF} -d /opt && sudo mv /opt/${ED} /opt/cortexskills\ncd /opt/cortexskills && sudo rm -rf poste-signature *.cmd\nsudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable`),
  P(X('Le dossier poste-signature/ et les lanceurs Windows sont retirés du serveur : ils n’y servent pas, et la clé privée ne doit jamais s’y trouver (l’application refuse de démarrer si elle en trouve une dans son dossier).', 'The poste-signature/ folder and the Windows launchers are removed from the server: they are not used there, and the private key must never be there (the application refuses to start if it finds one in its folder).'), { size: 20 }),
  H2(X('4.2 Réglages', '4.2 Settings')),
  ...cmd('sudo cp env.example .env\n./cortexskills secrets\nsudo nano .env'),
  envTable(false),
  editionNote('editeur'),
  H2(X('4.3 Service et HTTPS', '4.3 Service and HTTPS')),
  ...cmd(`sudo ./installer-service.sh\njournalctl -u cortexskills -f          # ${X('premier démarrage : 5 à 15 minutes, jusqu’à « CortexSkills API is running »', 'first start: 5 to 15 minutes, until “CortexSkills API is running”')}\nsudo cp config/nginx-cortexskills.conf /etc/nginx/conf.d/cortexskills.conf && sudo nano /etc/nginx/conf.d/cortexskills.conf\nsudo certbot certonly --nginx -d ${X('competences.mondomaine.ma', 'skills.mydomain.com')}\nsudo nginx -t && sudo systemctl reload nginx\ncurl -s https://${X('competences.mondomaine.ma', 'skills.mydomain.com')}/api/health`),
  P(X('installer-service.sh vérifie Node.js, crée l’utilisateur système cortexskills, rend app/ en lecture seule, réserve data/ au service et installe le service systemd durci (lecture seule sauf data/, sans privilège). Effacez ensuite ADMIN_PASSWORD de .env et sudo systemctl restart cortexskills. Renseignez les lignes SMTP_* pour que les invitations et relances partent réellement.', 'installer-service.sh checks Node.js, creates the cortexskills system user, makes app/ read-only, restricts data/ to the service and installs the hardened systemd service (read-only except data/, no privilege). Then clear ADMIN_PASSWORD from .env and run sudo systemctl restart cortexskills. Fill in the SMTP_* lines so that invitations and reminders really leave.'), { size: 20 }),
  H2(X('4.4 Exploiter', '4.4 Operate')),
  ...cmd(`sudo systemctl status cortexskills · journalctl -u cortexskills -f\nsudo -u cortexskills ./cortexskills backup\n30 2 * * * rsync -a /opt/cortexskills/data/ backup@storage:/cortexskills/     # sudo crontab -e`),
  ...X([
    'Restauration : sudo systemctl stop cortexskills ; sudo -u cortexskills ./cortexskills restore <fichier.db> ; sudo systemctl start cortexskills.',
    'Mise à jour : sauvegarde, puis remplacez app/, config/ et les scripts par ceux de la nouvelle version, et relancez sudo ./installer-service.sh ; .env, data/ et licence/ sont conservés, la base est migrée au démarrage (même procédure que le chapitre 10.4 du guide client).',
    'Plusieurs organisations clientes peuvent être actives sur la même installation : une licence chacune.',
  ], [
    'Restore: sudo systemctl stop cortexskills; sudo -u cortexskills ./cortexskills restore <file.db>; sudo systemctl start cortexskills.',
    'Update: backup, then replace app/, config/ and the scripts with those of the new version, and run sudo ./installer-service.sh again; .env, data/ and licence/ are kept, the database is migrated at start (same procedure as chapter 10.4 of the customer guide).',
    'Several customer organizations can be active on the same installation: one licence each.',
  ]).map(t => bullet(t)),

  H1(X('5. Scénario b — Localhost sous Windows', '5. Scenario b — Localhost on Windows')),
  P(X(`Sur votre poste Windows, pour démontrer, former ou piloter avec un client, à l’adresse http://localhost:4000, dans le même mode de production sur site que chez un client, avec les données de référence. Dans PowerShell, dossier C:\\CortexSkills\\${ED} :`, `On your Windows workstation, to demonstrate, train or run a pilot with a customer, at the address http://localhost:4000, in the same on-premises production mode as at a customer, with the reference data. In PowerShell, folder C:\\CortexSkills\\${ED}:`)),
  ...cmd(`Copy-Item env.example .env\n.\\cortexskills.cmd secrets            # ${X('deux secrets pour .env', 'two secrets for .env')}\nnotepad .env`),
  table([X('Ligne de .env', '.env line'), X('Valeur (localhost)', 'Value (localhost)')], [
    ['PUBLIC_URL, CORS_ORIGIN', 'http://localhost:4000'], ['HOST, PORT', '127.0.0.1, 4000'],
    ['JWT_SECRET, CHANNEL_SECRET_KEY', X('les deux premières valeurs affichées par secrets', 'the first two values shown by secrets')], ['ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD', X('votre administrateur de la plateforme', 'your platform administrator')],
    ['REFERENCE_DATA', X('oui (données de référence) ou non (base vide)', 'oui (reference data) or non (empty database)')],
  ], W2, { size: 18 }),
  ...cmd(`.\\cortexskills.cmd start             # ${X('premier démarrage : 5 à 15 minutes, jusqu’à « CortexSkills API is running »', 'first start: 5 to 15 minutes, until “CortexSkills API is running”')}`),
  P(X('Laissez la fenêtre ouverte et ouvrez http://localhost:4000 dans le navigateur. Arrêt : Ctrl+C dans la fenêtre. Ensuite, effacez la valeur de ADMIN_PASSWORD dans .env. Les données sont dans data\\ à côté du lanceur. Au premier lancement, le pare-feu Windows peut demander une autorisation pour node.exe : refusez l’accès réseau public, l’application n’écoute que sur 127.0.0.1.', 'Leave the window open and open http://localhost:4000 in the browser. Stop: Ctrl+C in the window. Then clear the value of ADMIN_PASSWORD in .env. The data is in data\\ next to the launcher. At first launch, the Windows firewall may ask for permission for node.exe: refuse public network access, the application only listens on 127.0.0.1.')),
  H2(X('5.1 Démarrage automatique (facultatif)', '5.1 Automatic start (optional)')),
  P(X('Pour lancer CortexSkills à l’ouverture de session, sans fenêtre, avec le Planificateur de tâches (PowerShell) :', 'To start CortexSkills at sign-in, without a window, with the Task Scheduler (PowerShell):')),
  ...cmd(`$a = New-ScheduledTaskAction -Execute "C:\\CortexSkills\\${ED}\\cortexskills.cmd" -Argument "start" -WorkingDirectory "C:\\CortexSkills\\${ED}"\n$t = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME\n$s = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -AllowStartIfOnBatteries\nRegister-ScheduledTask -TaskName "CortexSkills" -Action $a -Trigger $t -Settings $s -Description "CortexSkills localhost"\nStart-ScheduledTask CortexSkills · Stop-ScheduledTask CortexSkills · Unregister-ScheduledTask CortexSkills`),
  H2(X('5.2 Console, sauvegarde et restauration sous Windows', '5.2 Console, backup and restore on Windows')),
  table(['Action', X('Commande (PowerShell, dossier du paquet)', 'Command (PowerShell, package folder)')], [
    [X('Aide de la console', 'Console help'), '.\\cortexskills.cmd admin help'],
    [X('Sauvegarde à la demande', 'On-demand backup'), X('.\\cortexskills.cmd backup        (dans data\\backups)', '.\\cortexskills.cmd backup        (in data\\backups)')],
    [X('Restauration (application arrêtée)', 'Restore (application stopped)'), `.\\cortexskills.cmd restore · .\\cortexskills.cmd restore <${X('fichier', 'file')}.db>`],
    ['Version', '.\\cortexskills.cmd version'],
  ], [3200, 6446], { size: 17 }),
  H2(X('5.3 Les organisations de référence', '5.3 The reference organizations')),
  refTable(),

  H1(X('6. Gestion des licences', '6. Licence management')),
  P(X('Une licence suit toujours le même cycle. La signature (création, modification) se fait sur votre poste avec cslic ; l’installation et le retrait se font sur l’installation concernée avec la console (cortexskills admin) — ou par le client lui-même.', 'A licence always follows the same cycle. Signing (create, update) is done on your workstation with cslic; installing and removing are done on the installation concerned with the console (cortexskills admin) — or by the customer themselves.')),
  table([X('Étape', 'Stage'), X('Sur le poste de signature (cslic)', 'On the signing workstation (cslic)'), X('Sur l’installation (cortexskills admin …)', 'On the installation (cortexskills admin …)')], [
    [X('Demande', 'Request'), '—', X('org-create … puis licence-request --org <domaine> → Organization ID', 'org-create … then licence-request --org <domain> → Organization ID')],
    [X('Créer (C)', 'Create (C)'), `cslic ${CS.create} …`, `licence-install --file <${X('fichier', 'file')}.lic>`],
    [X('Lire (R)', 'Read (R)'), `cslic ${CS.list} · cslic ${CS.show} L-0001 · cslic ${CS.list} --csv`, X('licence-list · licence-show --org <domaine> · écran Configuration et licence', 'licence-list · licence-show --org <domain> · Configuration and licence screen')],
    [X('Modifier (U)', 'Update (U)'), `cslic ${CS.upd} L-0001 … · cslic ${CS.renew} L-0001 ${CS.end} …`, `licence-install --file <${X('nouvelle version', 'new version')}>`],
    [X('Révoquer', 'Revoke'), `cslic ${CS.revoke} L-0001 ${CS.reason} …`, `licence-remove --org <${X('domaine', 'domain')}> --yes`],
    [X('Supprimer (D)', 'Delete (D)'), `cslic ${CS.del} L-0001 ${CS.yes}`, '—'],
  ], [1500, 4000, 4146], { size: 16 }),
  P(X('Sur le serveur Linux (scénario a), préfixez la console par sudo -u cortexskills ./cortexskills admin ; sous Windows (scénario b), .\\cortexskills.cmd admin. Sous Windows, cslic s’écrit .\\cslic.cmd.', 'On the Linux server (scenario a), prefix the console with sudo -u cortexskills ./cortexskills admin; on Windows (scenario b), .\\cortexskills.cmd admin. On Windows, cslic is written .\\cslic.cmd.'), { size: 20 }),
  H2(X('6.1 Créer', '6.1 Create')),
  ...steps([[b(X('Créer l’organisation sur l’installation :', 'Create the organization on the installation:')), '']]),
  ...cmd(`cortexskills admin org-create --name "${X('Clinique Exemple', 'Example Clinic')}" --domain ${X('clinique-exemple.ma', 'example-clinic.com')} \\\n  --admin-email admin@${X('clinique-exemple.ma', 'example-clinic.com')} --admin-name "${X('Admin Clinique', 'Clinic Admin')}" --admin-password 'Str0ng#Passw0rd2026' --lang ${L}\ncortexskills admin licence-request --org ${X('clinique-exemple.ma', 'example-clinic.com')}        # ${X('affiche l’Organization ID', 'shows the Organization ID')}`),
  ...steps([[b(X('Signer sur votre poste :', 'Sign on your workstation:')), '']]),
  ...cmd(`cslic ${CS.create} ${CS.company} "${X('Clinique Exemple', 'Example Clinic')}" --org-id <Organization ID> --plan SME-GRO ${CS.users} 50 \\\n  ${CS.end} 2027-12-31 --addons AD-11 --ref ${X('CONTRAT', 'CONTRACT')}-2026-014`),
  table(['Option', X('Signification', 'Meaning'), X('Règle', 'Rule')], [
    [CS.company, X('Nom du client écrit dans la licence.', 'Customer name written in the licence.'), X('Obligatoire.', 'Required.')],
    ['--org-id', X('Organization ID affiché par la demande.', 'Organization ID shown by the request.'), X('Exact (format UUID) ; la licence ne vaut que pour cette organisation.', 'Exact (UUID format); the licence is valid for this organization only.')],
    ['--plan', X('Plan (chapitre 8).', 'Plan (chapter 8).'), X('Fixe les modules de l’organisation.', 'Sets the organization’s modules.')],
    [CS.users, X('Nombre maximal d’utilisateurs actifs.', 'Maximum number of active users.'), X('La création d’un utilisateur au-delà est refusée.', 'Creating a user beyond it is refused.')],
    [CS.end, X('Date de fin (AAAA-MM-JJ).', 'End date (YYYY-MM-DD).'), X('Alerte 30 jours avant ; lecture seule après.', 'Warning 30 days before; read-only after.')],
    ['--addons', X('Add-ons (chapitre 8), séparés par des virgules.', 'Add-ons (chapter 8), separated by commas.'), X('Facultatif ; seuls ces add-ons sont actifs.', 'Optional; only these add-ons are active.')],
    [`${CS.features}, --ref, --notes`, X('Mentions libres ; référence du contrat ; notes internes.', 'Free mentions; contract reference; internal notes.'), X('Facultatif.', 'Optional.')],
  ], [1800, 3700, 4146], { size: 16 }),
  P(X('cslic attribue un numéro (L-0001, L-0002…), écrit le fichier licences/L-0001_v1_Clinique_Exemple.lic dans le dossier du poste de signature et l’inscrit au registre. Une seule licence active par organisation : pour la changer, modifiez-la.', 'cslic gives a number (L-0001, L-0002…), writes the file licences/L-0001_v1_Example_Clinic.lic in the signing workstation folder and records it in the register. A single active licence per organization: to change it, update it.'), { size: 20 }),
  ...steps([[b(X('Installer. ', 'Install. ')), X('Scénario a : copiez d’abord le fichier sur le serveur. Scénario b : directement depuis votre poste.', 'Scenario a: first copy the file to the server. Scenario b: directly from your workstation.')]]),
  ...cmd(X(`# scénario a\nscp ~/.cortexskills-editeur/licences/L-0001_v1_Clinique_Exemple.lic utilisateur@serveur:/tmp/\nsudo cp /tmp/L-0001_v1_Clinique_Exemple.lic /opt/cortexskills/licence/ && sudo chmod 644 /opt/cortexskills/licence/*.lic\nsudo -u cortexskills ./cortexskills admin licence-install --file licence/L-0001_v1_Clinique_Exemple.lic\n# scénario b (PowerShell)\n.\\cortexskills.cmd admin licence-install --file $env:USERPROFILE\\.cortexskills-editeur\\licences\\L-0001_v1_Clinique_Exemple.lic`,
    `# scenario a\nscp ~/.cortexskills-editeur/licences/L-0001_v1_Example_Clinic.lic user@server:/tmp/\nsudo cp /tmp/L-0001_v1_Example_Clinic.lic /opt/cortexskills/licence/ && sudo chmod 644 /opt/cortexskills/licence/*.lic\nsudo -u cortexskills ./cortexskills admin licence-install --file licence/L-0001_v1_Example_Clinic.lic\n# scenario b (PowerShell)\n.\\cortexskills.cmd admin licence-install --file $env:USERPROFILE\\.cortexskills-editeur\\licences\\L-0001_v1_Example_Clinic.lic`)),
  H2(X('6.2 Lire', '6.2 Read')),
  ...cmd(`cslic ${CS.list}                     # ${X('licences actives : numéro, société, plan, utilisateurs, fin, version, état', 'active licences: number, company, plan, users, end, version, state')}\ncslic ${CS.list} ${CS.all} --csv ${X('registre', 'register')}.csv   # ${X('tout l’historique, exporté pour un tableur', 'the whole history, exported for a spreadsheet')}\ncslic ${CS.show} L-0001            # ${X('détail et historique (création, modifications, révocation)', 'detail and history (creation, updates, revocation)')}\ncortexskills admin licence-list  # ${X('sur l’installation : licences installées et leur état', 'on the installation: installed licences and their state')}\ncortexskills admin licence-show --org ${X('clinique-exemple.ma', 'example-clinic.com')}`),
  P(X('États : ACTIVE, ACTIVE (n j) dans les 30 derniers jours, EXPIRÉE, RÉVOQUÉE. Le journal journal.log du poste trace chaque opération (date, utilisateur, licence).', 'States (shown in French by cslic): ACTIVE, ACTIVE (n j) in the last 30 days, EXPIRÉE (expired), RÉVOQUÉE (revoked). The journal.log file of the workstation records each operation (date, user, licence).'), { size: 20 }),
  H2(X('6.3 Modifier et renouveler', '6.3 Update and renew')),
  ...cmd(`cslic ${CS.upd} L-0001 ${CS.users} 80                  # ${X('plus d’utilisateurs', 'more users')}\ncslic ${CS.upd} L-0001 --plan BND-02 --addons AD-02,AD-11   # ${X('autre plan, autres add-ons (--addons "" pour aucun)', 'other plan, other add-ons (--addons "" for none)')}\ncslic ${CS.renew} L-0001 ${CS.end} 2028-12-31                  # ${X('nouvelle date de fin', 'new end date')}`),
  P(X('Chaque modification signe une nouvelle version (L-0001_v2_…lic) et l’inscrit dans l’historique. Installez-la comme la première (licence-install) : elle remplace la précédente, sans redémarrage.', 'Each update signs a new version (L-0001_v2_…lic) and records it in the history. Install it like the first one (licence-install): it replaces the previous one, without restart.'), { size: 20 }),
  H2(X('6.4 Révoquer et retirer', '6.4 Revoke and remove')),
  ...cmd(`cslic ${CS.revoke} L-0001 ${CS.reason} "${X('contrat résilié', 'contract terminated')}"\ncortexskills admin licence-remove --org ${X('clinique-exemple.ma', 'example-clinic.com')} --yes     # ${X('sur l’installation : les utilisateurs ne peuvent plus se connecter', 'on the installation: the users can no longer sign in')}`),
  P(X('Sur vos installations (scénarios a et b), le retrait est immédiat. Chez un client qui installe lui-même, une licence ne peut pas être annulée à distance : elle cesse à sa date de fin. Préférez donc des durées d’un an, renouvelées, et appliquez le contrat. Les données de l’organisation restent dans data/.', 'On your installations (scenarios a and b), removal is immediate. At a customer who installs themselves, a licence cannot be cancelled remotely: it stops at its end date. So prefer one-year terms, renewed, and enforce the contract. The organization’s data stays in data/.'), { size: 20 }),
  H2(X('6.5 Supprimer', '6.5 Delete')),
  ...cmd(`cslic ${CS.del} L-0001 ${CS.yes}            # ${X('licence révoquée ou expirée ; --force pour une licence encore active', 'revoked or expired licence; --force for a licence still active')}`),
  P(X('La fiche et toutes les versions du fichier sont déplacées dans archives/ ; la ligne disparaît du registre. Le journal garde la trace de l’opération.', 'The record and all versions of the file are moved to archives/; the line disappears from the register. The log keeps a trace of the operation.'), { size: 20 }),
  H2(X('6.6 Un client qui installe chez lui', '6.6 A customer who installs on their own premises')),
  ...steps(X([
    `Envoyer au client : ${PKGF} et ${PKGF}.sha256, avec le guide d’installation client et le guide utilisateur client (Word et PDF, en français ou en anglais). Le paquet est le même pour tous les clients : il contient votre clé publique.`,
    'Recevoir les lignes de sa demande (licence-request) : société et Organization ID.',
    'Signer avec cslic creer (6.1) et lui envoyer le fichier .lic par e-mail. Il l’installe avec licence-install, sans accès de votre part à son serveur.',
    'Renouvellements et changements : cslic modifier / renouveler, puis envoi de la nouvelle version.',
  ], [
    `Send the customer: ${PKGF} and ${PKGF}.sha256, with the customer installation guide and the customer user guide (Word and PDF, in English or French). The package is the same for every customer: it contains your public key.`,
    'Receive the lines of their request (licence-request): company and Organization ID.',
    'Sign with cslic create (6.1) and send them the .lic file by e-mail. They install it with licence-install, without any access from you to their server.',
    'Renewals and changes: cslic update / renew, then send the new version.',
  ])),

  H1(X('7. Nouvelle version ou changement de clés', '7. New version or key change')),
  ...X([
    `Nouvelle version : vous recevez de nouveaux fichiers ${EDF.replace(V, '<version>')} et ${PKGF.replace(V, '<version>')}, construits par l’équipe de développement (le code source ne fait pas partie de cette livraison). Sur chaque installation : sauvegarde, puis remplacement de app/, config/ et des scripts ; .env, data/ et licence/ sont conservés et la base est migrée au démarrage. Les données de référence ne sont pas rechargées.`,
    'Sous Windows (scénario b) : arrêtez l’application, décompressez la nouvelle version dans un nouveau dossier, copiez-y .env et le dossier data\\ de l’ancienne, puis lancez .\\cortexskills.cmd start ; mettez à jour la tâche planifiée si vous l’utilisez.',
    'Les nouveaux paquets sont construits avec votre clé publique (vendor-public.pem, que vous pouvez exporter avec cslic cle-publique) : vos licences restent valables.',
    'Changement de clés (clé perdue ou divulguée) : créez une nouvelle paire avec cslic init dans un nouveau CSLIC_HOME, faites reconstruire les paquets avec la nouvelle clé publique, puis réémettez et renvoyez toutes les licences ; les anciennes ne sont plus reconnues par les nouveaux paquets.',
  ], [
    `New version: you receive new files ${EDF.replace(V, '<version>')} and ${PKGF.replace(V, '<version>')}, built by the development team (the source code is not part of this delivery). On each installation: backup, then replace app/, config/ and the scripts; .env, data/ and licence/ are kept and the database is migrated at start. The reference data is not reloaded.`,
    'On Windows (scenario b): stop the application, extract the new version into a new folder, copy .env and the data\\ folder of the old one into it, then run .\\cortexskills.cmd start; update the scheduled task if you use it.',
    'The new packages are built with your public key (vendor-public.pem, which you can export with cslic public-key): your licences remain valid.',
    'Key change (key lost or disclosed): create a new pair with cslic init in a new CSLIC_HOME, have the packages rebuilt with the new public key, then reissue and resend all licences; the old ones are no longer recognised by the new packages.',
  ]).map(t => bullet(t)),
  H1(X('8. Plans et add-ons', '8. Plans and add-ons')),
  table(['Plan', X('Nom', 'Name'), X('Contient', 'Contains')], PLANS, [1300, 5300, 3046], { size: 16 }),
  table(['Add-on', X('Nom', 'Name')], ADDONS, [1300, 8346], { size: 16 }),
  P(X('Les tarifs restent visibles dans vos installations (Administration › Tarifs) ; ils n’apparaissent jamais chez les clients.', 'Prices remain visible in your installations (Administration › Pricing); they never appear at customers.'), { size: 20, color: C.muted }),

  H1(X('9. Dépannage', '9. Troubleshooting')),
  table([X('Ce que vous voyez', 'What you see'), X('Cause', 'Cause'), X('Que faire', 'What to do')], X([
    ['« Node.js 22 introuvable »', 'Node.js n’est pas installé, ou la fenêtre a été ouverte avant son installation.', 'Installez Node.js 22 (2.2) puis ouvrez une nouvelle fenêtre ; ou CORTEXSKILLS_NODE=<chemin de node>.'],
    ['« needs Node.js 22.13 or newer »', 'Version de Node.js trop ancienne.', 'Installez Node.js 22 LTS (2.2).'],
    ['cslic : « Poste de signature non initialisé »', 'Clés pas encore importées sur ce poste, ou CSLIC_HOME différent.', 'cslic importer poste-signature, ou restauration de la sauvegarde chiffrée.'],
    ['cslic creer : « déjà active pour cette organisation »', 'Une seule licence active par organisation.', 'cslic modifier L-xxxx …'],
    ['« The vendor PRIVATE key must never be on a customer server »', 'vendor-private.pem trouvé dans le dossier de l’application.', 'Retirez-le : il ne doit exister que dans le dossier cles/ du poste de signature.'],
    ['licence-install : « signature is not valid » partout', 'Licences signées avec une autre clé que celle du paquet.', 'Comparez les empreintes (cslic empreinte) ; voir le chapitre 7.'],
    ['Premier démarrage long', 'Chargement des données de référence.', 'Normal (5 à 15 minutes). Ne l’interrompez pas.'],
    ['« Port 4000 is already in use »', 'CortexSkills déjà lancé (autre fenêtre, tâche planifiée) ou autre logiciel.', 'Fermez l’autre instance, ou changez PORT, PUBLIC_URL et CORS_ORIGIN dans .env.'],
    ['Windows : « Windows a protégé votre ordinateur » (SmartScreen)', 'Fichiers marqués « téléchargés depuis Internet ».', 'Unblock-File sur le zip avant de le décompresser (2.3), ou Get-ChildItem -Recurse | Unblock-File dans le dossier.'],
    ['Windows : « Accès refusé » en écrivant data\\', 'Paquet décompressé dans Program Files.', 'Décompressez dans C:\\CortexSkills.'],
    ['Linux : « EACCES » ou « read-only file system »', 'Installation sous /home ou droits modifiés.', 'Installez dans /opt/cortexskills ; relancez sudo ./installer-service.sh.'],
    ['Linux : « GLIBC_2.28 not found »', 'Système trop ancien, Alpine ou arm64.', 'Linux x86-64 récent (2.1), ou le paquet Docker.'],
    ['Un compte d’une organisation de référence est refusé', 'Ces comptes ne peuvent pas se connecter (1.1).', 'Administrateur de la plateforme, ou comptes des organisations créées avec la console.'],
  ], [
    ['“Node.js 22 not found”', 'Node.js is not installed, or the window was opened before it was installed.', 'Install Node.js 22 (2.2) then open a new window; or CORTEXSKILLS_NODE=<path of node>.'],
    ['“needs Node.js 22.13 or newer”', 'Node.js version too old.', 'Install Node.js 22 LTS (2.2).'],
    ['cslic: “Poste de signature non initialisé” (not initialised)', 'Keys not imported on this workstation yet, or a different CSLIC_HOME.', 'cslic import poste-signature, or restore the encrypted backup.'],
    ['cslic create: “déjà active pour cette organisation” (already active)', 'A single active licence per organization.', 'cslic update L-xxxx …'],
    ['“The vendor PRIVATE key must never be on a customer server”', 'vendor-private.pem found in the application folder.', 'Remove it: it must exist only in the cles/ folder of the signing workstation.'],
    ['licence-install: “signature is not valid” everywhere', 'Licences signed with a key other than the package’s.', 'Compare the fingerprints (cslic fingerprint); see chapter 7.'],
    ['Long first start', 'Loading the reference data.', 'Normal (5 to 15 minutes). Do not interrupt it.'],
    ['“Port 4000 is already in use”', 'CortexSkills already started (other window, scheduled task) or other software.', 'Close the other instance, or change PORT, PUBLIC_URL and CORS_ORIGIN in .env.'],
    ['Windows: “Windows protected your PC” (SmartScreen)', 'Files marked “downloaded from the Internet”.', 'Unblock-File on the zip before extracting it (2.3), or Get-ChildItem -Recurse | Unblock-File in the folder.'],
    ['Windows: “Access denied” when writing data\\', 'Package extracted in Program Files.', 'Extract into C:\\CortexSkills.'],
    ['Linux: “EACCES” or “read-only file system”', 'Installation under /home or rights changed.', 'Install in /opt/cortexskills; run sudo ./installer-service.sh again.'],
    ['Linux: “GLIBC_2.28 not found”', 'System too old, Alpine or arm64.', 'Recent Linux x86-64 (2.1), or the Docker package.'],
    ['An account of a reference organization is refused', 'These accounts cannot sign in (1.1).', 'Platform administrator, or accounts of the organizations created with the console.'],
  ]), [3200, 3000, 3446], { size: 16 }),

  H1(X('10. Référence des commandes', '10. Command reference')),
  table([X('Où', 'Where'), X('Commande', 'Command'), X('Rôle', 'Role')], [
    [X('Poste', 'Workstation'), `cslic ${CS.imp} poste-signature · cslic-sauvegarder <${X('dossier', 'folder')}> · cslic ${CS.fp} · cslic ${CS.pk}`, X('Clés et sauvegarde', 'Keys and backup')],
    [X('Poste', 'Workstation'), `cslic ${CS.create} · ${CS.list} · ${CS.show} · ${CS.upd} · ${CS.renew} · ${CS.revoke} · ${CS.del} · ${CS.verify}`, X('Licences (CRUD)', 'Licences (CRUD)')],
    ['Installation', 'cortexskills start · version · secrets · backup · restore [file]', X('Lancement et exploitation', 'Start and operation')],
    ['Installation', 'cortexskills admin org-create · org-list · licence-request · licence-install · licence-list · licence-show · licence-remove · password · help', X('Organisations, licences installées, comptes', 'Organizations, installed licences, accounts')],
    [X('Serveur Linux', 'Linux server'), 'sudo ./installer-service.sh · systemctl status|restart cortexskills · journalctl -u cortexskills -f', X('Service (scénario a)', 'Service (scenario a)')],
    [X('Poste Windows', 'Windows workstation'), '.\\cortexskills.cmd … · .\\cslic.cmd … · Register-ScheduledTask (5.1)', X('Scénario b', 'Scenario b')],
  ], [1600, 5600, 2446], { size: 16 }),
  P(X(`Utilisation de l’application côté éditeur (organisations, tarifs, licences à l’écran, organisations de référence) : ${GUE}.`, `Use of the application on the editor side (organizations, pricing, licences on screen, reference organizations): ${GUE}.`), { size: 20, color: C.muted }),
];

fs.mkdirSync(out, { recursive: true });
const write = (body, title, credit, file) => D.Packer.toBuffer(document({ title, credit, sections: [body], lang: X('fr-FR', 'en-GB') })).then(buf => { fs.writeFileSync(path.join(out, file), buf); console.log(X('écrit', 'written'), file); });
write(client, X('CortexSkills — Guide d’installation, exécutable minifié, côté client (Linux)', 'CortexSkills — Installation Guide, minified runtime, customer side (Linux)'), X(`CortexSkills ${V} · Guide d’installation — exécutable — client — Linux`, `CortexSkills ${V} · Installation Guide — runtime — customer — Linux`), GC + '.docx')
  .then(() => write(editeur, X('CortexSkills — Guide d’installation, exécutable minifié, côté éditeur (Linux et Windows)', 'CortexSkills — Installation Guide, minified runtime, editor side (Linux and Windows)'), X(`CortexSkills ${V} · Guide d’installation — exécutable — éditeur — Linux et Windows`, `CortexSkills ${V} · Installation Guide — runtime — editor — Linux and Windows`), GE + '.docx'));
