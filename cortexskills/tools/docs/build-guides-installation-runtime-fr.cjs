// Construit les guides d'installation des exécutables minifiés (sans Docker) en français (Word, avec table des matières) :
//  - Guide_Installation_Runtime_Customer_Linux_CortexSkills_FR.docx : le client installe l'exécutable sur son serveur
//    Linux (cloud privé ou sur site), en service systemd derrière Nginx, et active sa licence — sans élément commercial ;
//  - Guide_Installation_Runtime_Editor_Linux_Windows_CortexSkills_FR.docx : l'éditeur — poste de signature (Windows ou
//    Linux), scénario a (cloud privé / sur site, serveur Linux), scénario b (localhost sous Windows), licences (CRUD).
// Exécution : node build-guides-installation-runtime-fr.cjs <dossier>, puis python3 topdf.py <fichiers> pour les PDF.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, H3, bullet, code, callout, table, shot, cover, tocPage, document, spacer } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const V = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const NV = process.env.NODE_DIST_VERSION || '22.22.2';
const today = new Date().toISOString().slice(0, 10);
const SH = f => path.join(__dirname, 'shots/docker-fr', f + '.png');
let n = 0; const steps = items => { const ref = 'rsteps' + (n++ || ''); return items.map(t => B.numbered(t, ref)); };
const cmd = s => s.split('\n').map(l => code(l));
const b = t => ({ text: t, bold: true });
const PKG = `Runtime_Customer_Linux_CortexSkills_${V}`, ED = `Runtime_Editor_Linux_Windows_CortexSkills_${V}`;
const GC = 'Guide_Installation_Runtime_Customer_Linux_CortexSkills_FR', GE = 'Guide_Installation_Runtime_Editor_Linux_Windows_CortexSkills_FR', GU = 'Guide_Utilisateur_Customer_CortexSkills_FR';
const REF = JSON.parse(fs.readFileSync(path.join(__dirname, 'reference-orgs.json'), 'utf8'));
const nLarge = REF.orgs.filter(o => o.segment === 'LARGE').length, nSme = REF.orgs.filter(o => o.segment === 'SME').length;
const refTable = () => table(['Secteur', 'Grandes entreprises', 'PME'], Object.entries(REF.sectors).sort((a, b) => a[1].fr.localeCompare(b[1].fr, 'fr')).map(([k, v]) => [`${v.fr} (${k})`,
  REF.orgs.filter(o => o.sector === k && o.segment === 'LARGE').map(o => o.name.fr).join(' ; ') || '—', REF.orgs.filter(o => o.sector === k && o.segment === 'SME').map(o => o.name.fr).join(' ; ') || '—']), [3000, 3800, 2846], { size: 15 });
const refIntro = who => [
  P(`Au premier démarrage, l’installation charge ${REF.orgs.length} organisations de référence : ${nLarge} grandes entreprises et ${nSme} PME, dans toutes les verticales (${Object.keys(REF.sectors).length - 1} secteurs et un cas universel). Chacune a deux projets complets (orientation Numérique et IA) avec ses processus, tâches, étapes, questionnaires, plans, documents et indicateurs : ce sont des exemples à consulter, en français, anglais et arabe.`),
  callout('Aucun compte de démonstration', [
    'La page de connexion ne mentionne aucun compte ; aucun mot de passe de démonstration n’existe dans cette version de production.',
    'Les personnes des organisations de référence ne peuvent pas se connecter : leurs comptes sont désactivés et leur mot de passe, tiré au hasard à l’installation, n’est connu de personne.',
    `Seul l’administrateur de la plateforme (ADMIN_EMAIL) se connecte au départ ; il consulte les organisations de référence en lecture (Portefeuille › Groupes et organisations).${who === 'client' ? ' Vos propres utilisateurs sont ceux de votre organisation (chapitre 7).' : ' Vos organisations clientes se créent avec la console (chapitre 6).'}`,
    'Elles n’ont pas de licence : elles ne comptent pas dans le nombre d’utilisateurs de votre licence. Pour une base vide, mettez REFERENCE_DATA=non dans .env avant le premier démarrage.']),
];
const W2 = [3000, 6646];
const ADM = 'sudo -u cortexskills ./cortexskills admin';
const minified = who => callout('Ce que contient le paquet — et ce qu’il ne contient pas', [
  'L’exécutable de production : le serveur minifié (fichier par fichier, sans commentaires, noms internes raccourcis), l’interface web compilée et minifiée (découpée par page, précompressée Brotli et gzip, sans source map) et les bibliothèques nécessaires à l’exécution.',
  `Node.js ${NV}${who === 'editeur' ? ' pour Linux x64 et pour Windows x64' : ' pour Linux x64'} : la distribution officielle, dont l’empreinte a été vérifiée à la construction du paquet. Rien à installer, ni Node.js, ni npm, ni compilateur.`,
  'La clé publique de l’éditeur : elle vérifie la licence, elle ne peut pas en créer.',
  'Aucun code source lisible, aucun test, aucune source map, aucun outil de signature, aucune clé privée' + (who === 'editeur' ? ' (sauf le dossier poste-signature/, chapitre 3)' : '') + '.',
]);
const perf = P('Optimisations d’exécution : seuls les écrans ouverts sont chargés (le premier affichage charge environ 370 Ko de JavaScript au lieu de 2,2 Mo), les fichiers statiques sont servis précompressés et mis en cache par le navigateur pour un an (leur nom change à chaque version), et Node.js garde le code compilé entre deux démarrages (data/.node-compile-cache).', { size: 20, color: C.muted });
const envTable = local => table(['Réglage', 'Valeur', 'Exemple'], [
  ['PUBLIC_URL', local ? 'http://localhost:4000 (évaluation sur la machine elle-même).' : 'L’adresse saisie par les utilisateurs, en HTTPS ; elle figure dans les liens envoyés par e-mail et WhatsApp.', local ? 'http://localhost:4000' : 'https://competences.votre-entreprise.ma'],
  ['CORS_ORIGIN', 'La même adresse.', local ? 'http://localhost:4000' : 'https://competences.votre-entreprise.ma'],
  ['HOST, PORT', 'Interface et port d’écoute. 127.0.0.1 : seul le reverse proxy (ou le navigateur local) y accède.', '127.0.0.1, 4000'],
  ['JWT_SECRET', 'Valeur aléatoire de 32 caractères ou plus (signe les sessions).', 'affichée par « cortexskills secrets »'],
  ['CHANNEL_SECRET_KEY', 'Autre valeur aléatoire (chiffre les identifiants enregistrés).', 'affichée par « cortexskills secrets »'],
  ['ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD', 'L’administrateur de la plateforme, créé au premier démarrage. Mot de passe : 12 caractères min., majuscule, minuscule, chiffre, symbole. Effacez ADMIN_PASSWORD ensuite.', 'it.ops@votre-entreprise.ma'],
  ['REFERENCE_DATA', 'Premier démarrage : « oui » charge les organisations de référence ; « non » crée une base vide.', 'oui'],
  ['DATA_DIR', 'Facultatif : dossier des données. Par défaut data/ dans le dossier du paquet.', '/var/lib/cortexskills'],
  ['BACKUP_RETENTION_DAYS', 'Jours de conservation des sauvegardes quotidiennes (environ 0,8 Go chacune).', '7'],
  ['SMTP_*', 'Votre messagerie pour les invitations, relances et notifications.', 'smtp.votre-entreprise.ma, 587'],
  ['WHATSAPP_*', 'Facultatif : WhatsApp Business Cloud API.', '—'],
], [2400, 4800, 2446], { size: 17 });
const editionNote = who => P(`Le paquet impose le mode « sur site » (licence signée obligatoire)${who === 'client' ? ' et masque toute information commerciale' : ''}, quelle que soit la valeur de DEPLOYMENT_MODE ou COMMERCIAL_INFO dans .env : ces réglages sont ignorés.`, { size: 20, color: C.muted });

// =============================================================== GUIDE CLIENT
const client = [
  ...cover({ eyebrow: 'Guide d’installation — Exécutable minifié — Côté client — Linux', title: 'CortexSkills', subtitle: 'Installer l’exécutable de production CortexSkills sur votre serveur Linux (cloud privé ou sur site), sans Docker, avec les données de référence de toutes les verticales et des PME, et activer votre licence', meta: [`Version ${V} · ${today}`, 'AI Value'] }),
  ...tocPage('Table des matières'),

  H1('1. Ce que vous installez'),
  P('CortexSkills est livré sous forme d’exécutable de production prêt à lancer : un dossier à décompresser sur votre serveur, qui contient l’application et son moteur Node.js. Aucune compilation, aucun téléchargement, aucun accès Internet n’est nécessaire. Vos données ne quittent pas vos serveurs : la base, les pièces jointes et les sauvegardes sont dans le dossier data/. Rien n’est envoyé à l’éditeur.'),
  table(['Élément', 'Rôle'], [
    ['cortexskills', 'Le lanceur : start (démarrer), admin (console d’installation), secrets, backup, restore, version.'],
    ['installer-service.sh', 'Installe le service Linux (systemd) : utilisateur système dédié, droits des dossiers, démarrage au boot.'],
    ['app/', 'L’application, en lecture seule pour le service.'],
    ['runtime/node/', `Node.js ${NV} (linux-x64), distribution officielle.`],
    ['data/', 'Base de données, pièces jointes, sauvegardes quotidiennes et licence installée. C’est la seule donnée à protéger.'],
    ['.env', 'Vos réglages : adresse, secrets, administrateur, messagerie (créé à partir de env.example).'],
    ['config/', 'cortexskills.service (systemd, durci) et nginx-cortexskills.conf (HTTPS).'],
    ['licence/', 'Où vous déposez le fichier de licence reçu de l’éditeur.'],
  ], W2),
  spacer(), minified('client'), perf,
  H2('1.1 Les données de référence'),
  ...refIntro('client'),

  H1('2. Prérequis'),
  H2('2.1 Serveur'),
  table(['Élément', 'Minimum', 'Recommandé (300 utilisateurs et plus)'], [
    ['Système', 'Linux 64 bits x86-64 avec glibc 2.28 ou plus récente', 'Ubuntu 22.04 / 24.04 LTS, Debian 12, RHEL / Rocky / AlmaLinux 9'],
    ['Processeur', '2 vCPU', '4 vCPU'],
    ['Mémoire', '4 Go', '8 Go'],
    ['Disque', '20 Go libres : paquet (environ 200 Mo décompressé), base avec les données de référence (environ 0,9 Go), sauvegardes quotidiennes (environ 0,8 Go chacune, 7 jours par défaut)', '50 Go sur un stockage sauvegardé'],
    ['Logiciels', 'systemd ; unzip ; sha256sum ; un reverse proxy HTTPS (Nginx conseillé)', 'Nginx et Certbot (Let’s Encrypt) ou le certificat de votre entreprise'],
  ], [2000, 3600, 4046], { size: 18 }),
  P('Alpine Linux (musl) et les processeurs arm64 ne sont pas pris en charge par ce paquet : utilisez le paquet Docker, ou demandez la version correspondante à l’éditeur.', { size: 20, color: C.muted }),
  H2('2.2 Réseau'),
  table(['Besoin', 'Détail'], [
    ['Nom DNS', 'Par exemple competences.votre-entreprise.ma, pointant vers le serveur (un DNS interne suffit pour un intranet).'],
    ['Entrant', '443/TCP pour les utilisateurs (et 80/TCP pour obtenir le certificat Let’s Encrypt). Le port 4000 reste fermé : l’application n’écoute que sur 127.0.0.1.'],
    ['Installation', 'Aucun accès Internet nécessaire (serveur isolé possible).'],
    ['Sortant en exploitation (facultatif)', 'Votre serveur SMTP (souvent 587/TCP) ; graph.facebook.com en 443/TCP pour WhatsApp Business.'],
    ['Navigateurs', 'Chrome, Edge, Firefox ou Safari récents.'],
  ], W2),
  H2('2.3 Ce que vous recevez de l’éditeur'),
  table(['Fichier', 'Rôle'], [
    [`${PKG}.zip`, 'Le paquet d’installation : l’exécutable minifié, Node.js, le lanceur, le service, l’exemple Nginx, le modèle de réglages, la documentation et la liste des empreintes.'],
    [`${PKG}.zip.part00 …`, 'Le même paquet en plusieurs parties, si l’envoi est découpé (taille maximale des pièces jointes). Reconstituez-le au chapitre 3.'],
    [`${PKG}.zip.sha256`, 'L’empreinte SHA-256 du paquet, pour vérifier qu’il est intact.'],
    [`${GC}.docx / .pdf`, 'Ce guide (aussi dans le dossier documentation/ du paquet).'],
    [`${GU}.docx / .pdf`, 'Le Guide utilisateur : utilisation de l’application sur un cas réel complet (aussi dans documentation/).'],
    ['Plus tard : <Votre_entreprise>.lic', 'Votre fichier de licence, envoyé par l’éditeur après votre demande (chapitre 8).'],
  ], W2),

  H1('3. Vérifier et décompresser le paquet'),
  P('En administrateur (sudo). Le dossier conseillé est /opt/cortexskills : le service systemd protège les dossiers personnels (/home), n’y installez pas l’application.'),
  ...cmd(`sudo apt -y install unzip            # RHEL / Rocky : sudo dnf -y install unzip\ncd ~                                 # dossier où se trouvent les fichiers reçus\ncat ${PKG}.zip.part* > ${PKG}.zip    # seulement si vous avez reçu des parties\nsha256sum -c ${PKG}.zip.sha256       # doit répondre : ${PKG}.zip: OK\nsudo unzip -q ${PKG}.zip -d /opt && sudo mv /opt/${PKG} /opt/cortexskills\ncd /opt/cortexskills && sha256sum -c --quiet SHA256SUMS.txt && echo "contenu intact"\n./cortexskills version`),
  P(`La dernière commande affiche « CortexSkills ${V} · customer edition · Node.js ${NV} · data /opt/cortexskills/data ». Si une vérification échoue, n’installez pas : demandez un nouvel envoi à l’éditeur.`, { size: 20 }),

  H1('4. Réglages (.env)'),
  ...cmd('sudo cp env.example .env\n./cortexskills secrets          # affiche JWT_SECRET et CHANNEL_SECRET_KEY (et une troisième valeur, inutile ici)\nsudo nano .env'),
  envTable(false),
  editionNote('client'),
  callout('Contrôles au démarrage', ['L’application refuse de démarrer tant qu’un réglage est dangereux — secret court ou par défaut, deux secrets identiques, adresse qui n’est pas en HTTPS, CORS ouvert, clé privée de l’éditeur présente — et liste chaque problème dans son journal.', 'Gardez une copie de .env dans votre coffre : changer JWT_SECRET déconnecte tous les utilisateurs ; perdre CHANNEL_SECRET_KEY rend illisibles les identifiants de messagerie enregistrés.'], C.light),

  H1('5. Installer le service et démarrer'),
  ...cmd('cd /opt/cortexskills\nsudo ./installer-service.sh\njournalctl -u cortexskills -f       # Ctrl+C pour quitter'),
  P('installer-service.sh crée l’utilisateur système « cortexskills » (sans shell ni mot de passe), rend app/ et runtime/ en lecture seule (propriété de root), donne data/ au seul service, réserve .env à root et au service, installe /etc/systemd/system/cortexskills.service puis démarre le service et l’active au démarrage du serveur.'),
  P('Au premier démarrage, l’application crée la base de production — catalogue de référence, modèles, administrateur de la plateforme et organisations de référence (1.1) — puis démarre. Cette étape dure de 5 à 15 minutes selon le serveur : ne l’interrompez pas. Le journal affiche « Production database ready … 61 reference organizations (no account can sign in) », puis « CortexSkills API is running ». Contrôle de santé, sur le serveur :'),
  ...cmd(`curl -s http://127.0.0.1:4000/api/health\n{"status":"ok","initialized":true,"mode":"onprem","version":"${V}","demoAccounts":false}`),
  P('Effacez ensuite la valeur de ADMIN_PASSWORD dans .env (sudo nano .env), puis sudo systemctl restart cortexskills.', { size: 20 }),
  table(['Protection du service (config/cortexskills.service)', 'Effet'], [
    ['User=cortexskills, NoNewPrivileges', 'Le processus n’a aucun privilège et ne peut pas en obtenir.'],
    ['ProtectSystem=strict, ReadWritePaths=…/data', 'Tout le système de fichiers est en lecture seule pour le service, sauf data/.'],
    ['ProtectHome, PrivateTmp, PrivateDevices', 'Pas d’accès aux dossiers personnels, ni aux /tmp des autres, ni aux périphériques.'],
    ['UMask=0077', 'Les fichiers créés (base, sauvegardes, pièces jointes) ne sont lisibles que par le service.'],
    ['TimeoutStartSec=30min', 'Laisse le temps au premier démarrage de charger les données de référence.'],
  ], [4200, 5446], { size: 17 }),

  H1('6. HTTPS (Nginx)'),
  ...cmd('sudo apt -y install nginx certbot python3-certbot-nginx\nsudo cp config/nginx-cortexskills.conf /etc/nginx/conf.d/cortexskills.conf\nsudo nano /etc/nginx/conf.d/cortexskills.conf      # votre nom DNS et votre certificat\nsudo certbot certonly --nginx -d competences.votre-entreprise.ma   # certificat Let’s Encrypt (ou celui de votre entreprise)\nsudo nginx -t && sudo systemctl reload nginx'),
  P('Le fichier redirige le port 80 vers HTTPS, n’accepte que TLS 1.2 et 1.3, autorise des pièces jointes de 30 Mo et transmet vers http://127.0.0.1:4000 avec les en-têtes X-Forwarded-*. Un autre reverse proxy (Apache, HAProxy, F5, IIS ARR, Traefik) convient de la même façon. Ouvrez ensuite https://competences.votre-entreprise.ma :'),
  ...shot(SH('01_connexion'), 'La page de connexion à votre adresse : aucun compte de démonstration', 500),
  P('Connectez-vous avec ADMIN_EMAIL et son mot de passe : les organisations de référence sont dans Portefeuille › Groupes et organisations.', { size: 20 }),
  ...shot(SH('05_organisations_reference'), 'Les organisations de référence, vues par l’administrateur de la plateforme', 560),
  H2('6.1 Les organisations de référence'),
  refTable(),

  H1('7. Créer votre organisation'),
  P('L’organisation est votre entreprise dans CortexSkills, avec ses utilisateurs, ses projets et sa licence. Dans /opt/cortexskills :'),
  ...cmd(`${ADM} org-create \\\n  --name "Votre entreprise" --domain votre-entreprise.ma \\\n  --admin-email prenom.nom@votre-entreprise.ma --admin-name "Prénom Nom" \\\n  --admin-password 'Str0ng#Passw0rd2026' --lang fr --country Maroc --city Casablanca`),
  table(['Option', 'Signification'], [
    ['--name', 'Nom affiché dans l’application.'],
    ['--domain', 'Domaine e-mail de vos utilisateurs ; il désigne l’organisation dans les commandes suivantes.'],
    ['--admin-email, --admin-name, --admin-password', 'Premier administrateur de l’organisation (tous les droits). Mot de passe fort obligatoire.'],
    ['--lang', 'Langue par défaut : fr, en ou ar. Chaque utilisateur peut en changer.'],
    ['--sector, --segment, --employees, --country, --city', 'Profil facultatif, complétable ensuite dans l’application.'],
  ], W2, { size: 18 }),
  P('La console s’exécute avec l’utilisateur du service (sudo -u cortexskills), qui seul peut écrire dans data/. Elle affiche l’Organization ID. Vos utilisateurs ne peuvent pas se connecter avant l’installation de la licence.', { size: 20 }),

  H1('8. Activer la licence'),
  P('La licence est un petit fichier signé (.lic) émis par l’éditeur pour votre Organization ID. Elle fixe le plan, le nombre d’utilisateurs, les add-ons et la date de fin. Elle est vérifiée avec la clé publique incluse dans le paquet : toute modification du fichier la rend invalide.'),
  ...steps([[b('Demander. '), 'Affichez les informations à transmettre :']]),
  ...cmd(`${ADM} licence-request --org votre-entreprise.ma`),
  P('Envoyez à l’éditeur, par e-mail, les lignes affichées (société et Organization ID). L’Organization ID n’est pas secret mais doit être recopié exactement.', { size: 20 }),
  ...steps([[b('Recevoir. '), 'L’éditeur vous envoie un fichier comme L-0012_v1_Votre_entreprise.lic. Copiez-le dans licence/ :']]),
  ...cmd('sudo cp ~/L-0012_v1_Votre_entreprise.lic /opt/cortexskills/licence/ && sudo chmod 644 /opt/cortexskills/licence/*.lic'),
  ...steps([[b('Installer '), '(sans redémarrage) :']]),
  ...cmd(`${ADM} licence-install --file licence/L-0012_v1_Votre_entreprise.lic`),
  P('La console confirme le plan, le nombre d’utilisateurs et la date de fin, et copie la licence dans data/license.lic. Un fichier modifié, ou émis pour un autre Organization ID, est refusé avec un message explicite.', { size: 20 }),
  ...steps([[b('Vérifier. '), 'Connectez-vous avec l’administrateur de l’organisation, puis ouvrez Administration › Configuration et licence : la licence est « Active », avec le plan, le nombre d’utilisateurs et la date de fin.']]),
  ...shot(SH('02_licence'), 'Administration › Configuration et licence après l’activation', 560),
  H2('8.1 Consulter la licence installée'),
  ...cmd(`${ADM} licence-list\n${ADM} licence-show --org votre-entreprise.ma`),
  H2('8.2 Ce que la licence décide'),
  P('Le plan, le nombre d’utilisateurs et les add-ons viennent uniquement de la licence : ils ne se modifient ni dans l’application ni par la console. L’écran le rappelle :'),
  ...shot(SH('03_packs_sans_prix'), 'Le plan est fixé par la licence', 560),
  H2('8.3 Renouvellement, changement, fin'),
  ...[
    'L’application prévient les administrateurs 30 jours avant la date de fin ; après cette date, elle passe en lecture seule jusqu’à l’installation d’une nouvelle licence.',
    'Pour un renouvellement, davantage d’utilisateurs, un autre plan ou un add-on : demandez une nouvelle licence à l’éditeur et installez-la de la même façon (licence-install) ou par Administration › Configuration et licence › Téléverser la licence. Elle remplace la précédente.',
    'Retrait d’une licence (fin de contrat) : licence-remove --org votre-entreprise.ma --yes. Les utilisateurs de l’organisation ne peuvent plus se connecter ; les données restent dans data/.',
  ].map(t => bullet(t)),

  H1('9. Exploitation'),
  H2('9.1 Commandes courantes'),
  table(['Action', 'Commande (dans /opt/cortexskills)'], [
    ['Démarrer / arrêter / redémarrer', 'sudo systemctl start · stop · restart cortexskills'],
    ['État et santé', 'systemctl status cortexskills · curl -s http://127.0.0.1:4000/api/health'],
    ['Journal', 'journalctl -u cortexskills -f -n 200'],
    ['Version', './cortexskills version'],
    ['Aide de la console', `${ADM} help`],
    ['Nouveau mot de passe d’un utilisateur', `${ADM} password --email jean@votre-entreprise.ma --password 'N0uveau#2026Mdp'`],
  ], [2900, 6746], { size: 17 }),
  H2('9.2 Sauvegardes'),
  P('L’application écrit chaque jour une sauvegarde de la base dans data/backups (environ 0,8 Go chacune avec les données de référence ; BACKUP_RETENTION_DAYS jours conservés). Avant toute intervention, et chaque jour, copiez les sauvegardes et les pièces jointes hors du serveur :'),
  ...cmd('sudo -u cortexskills ./cortexskills backup\nsudo rsync -a /opt/cortexskills/data/backups/ /opt/cortexskills/data/attachments/ sauvegarde@stockage:/cortexskills/\n# ou une tâche planifiée : sudo crontab -e\n30 2 * * * rsync -a /opt/cortexskills/data/ sauvegarde@stockage:/cortexskills/'),
  H2('9.3 Restauration'),
  ...cmd('sudo systemctl stop cortexskills\nsudo -u cortexskills ./cortexskills restore               # liste les sauvegardes\nsudo -u cortexskills ./cortexskills restore <fichier.db>\nsudo systemctl start cortexskills'),
  P('La base actuelle est conservée à côté des sauvegardes (before-restore-<date>.db). Une sauvegarde d’une version antérieure est mise à niveau au démarrage.', { size: 20 }),
  H2('9.4 Mise à jour'),
  P('Une nouvelle version remplace app/, runtime/ et les scripts ; .env, data/ et licence/ sont conservés :'),
  ...cmd(`sudo -u cortexskills /opt/cortexskills/cortexskills backup\nsha256sum -c Runtime_Customer_Linux_CortexSkills_<version>.zip.sha256\nunzip -q Runtime_Customer_Linux_CortexSkills_<version>.zip -d /tmp/cs-nouveau\nsudo systemctl stop cortexskills\ncd /opt/cortexskills && sudo rm -rf app runtime config\nsudo cp -r /tmp/cs-nouveau/Runtime_Customer_Linux_CortexSkills_<version>/{app,runtime,config,documentation,cortexskills,installer-service.sh,env.example,LISEZMOI.txt,SHA256SUMS.txt} .\nsudo ./installer-service.sh            # réapplique les droits et redémarre ; la base est migrée au démarrage\n./cortexskills version`),
  H2('9.5 Désinstallation'),
  P('sudo systemctl disable --now cortexskills, puis sudo rm /etc/systemd/system/cortexskills.service. Le dossier /opt/cortexskills contient toutes les données (data/) : faites et copiez une sauvegarde avant de le supprimer.'),

  H1('10. Sécurité'),
  ...[
    'Le service s’exécute avec un utilisateur système sans privilège, sur un système de fichiers en lecture seule sauf data/ (chapitre 5).',
    'L’application n’écoute que sur 127.0.0.1 ; seul le HTTPS du reverse proxy est exposé.',
    'Gardez .env lisible par root et le service seulement (installer-service.sh le règle) et ses secrets dans votre coffre.',
    'Mots de passe stockés hachés ; sessions limitées à JWT_TTL (12 h par défaut) ; chaque action d’administration est inscrite au journal d’audit. Aucun compte de démonstration : seuls l’administrateur de la plateforme et les utilisateurs que vous créez peuvent se connecter.',
    'Ne modifiez pas les fichiers de app/ : la licence d’utilisation l’interdit, et une modification est écrasée à la mise à jour suivante.',
    'Appliquez les mises à jour du système et de Nginx, et les mises à jour de CortexSkills envoyées par l’éditeur (Node.js est mis à jour avec elles).',
  ].map(t => bullet(t)),

  H1('11. Dépannage'),
  table(['Ce que vous voyez', 'Cause', 'Que faire'], [
    ['« will not start in production mode » dans le journal', 'Un réglage de .env manque ou est dangereux.', 'Lisez la liste du journal : chaque ligne nomme le réglage à corriger, puis sudo systemctl restart cortexskills.'],
    ['« First start: set ADMIN_EMAIL and ADMIN_PASSWORD »', 'Premier démarrage sans administrateur.', 'Renseignez-les dans .env, redémarrez, puis effacez ADMIN_PASSWORD.'],
    ['systemctl status : « activating » pendant plusieurs minutes', 'Premier démarrage : chargement des données de référence.', 'Normal (5 à 15 minutes) : suivez journalctl -u cortexskills -f. Ne redémarrez pas pendant cette étape.'],
    ['« Port 4000 is already in use »', 'Une autre application, ou CortexSkills lancé deux fois.', 'Arrêtez l’autre processus, ou changez PORT dans .env et dans la configuration Nginx.'],
    ['« EACCES » ou « read-only file system » au démarrage', 'Dossier data/ déplacé ou droits modifiés ; ou installation sous /home.', 'Relancez sudo ./installer-service.sh ; installez dans /opt/cortexskills.'],
    ['« GLIBC_2.28 not found » ou « cannot execute binary file »', 'Système trop ancien, Alpine (musl) ou processeur arm64.', 'Utilisez un Linux x86-64 récent (2.1), ou le paquet Docker.'],
    ['502 Bad Gateway dans le navigateur', 'Le service est arrêté ou encore au premier démarrage.', 'systemctl status cortexskills ; journalctl -u cortexskills.'],
    ['Un compte d’une organisation de référence est refusé', 'Ces comptes ne peuvent pas se connecter (1.1).', 'Connectez-vous avec l’administrateur de la plateforme ou avec les comptes de votre organisation.'],
    ['« No space left on device »', 'Disque plein (sauvegardes).', 'Libérez de la place, réduisez BACKUP_RETENTION_DAYS et copiez les sauvegardes hors du serveur.'],
    ['sha256sum : « FAILED »', 'Paquet incomplet ou altéré (souvent une partie manquante).', 'Vérifiez que toutes les parties sont présentes et reconstituez le paquet ; sinon demandez un nouvel envoi.'],
    ['« The licence of this Organization is not active »', 'Licence non installée ou expirée.', 'Chapitre 8 ; vérifiez la date de fin.'],
    ['licence-install : « signature is not valid »', 'Fichier modifié ou non émis par l’éditeur.', 'Redemandez le fichier ; ne l’ouvrez pas dans un éditeur de texte qui le reformaterait.'],
    ['licence-install : « Organization ID … does not exist »', 'Licence émise pour un autre ID.', 'Comparez avec org-list et renvoyez le bon ID à l’éditeur.'],
    ['Changer de plan ou d’add-on est refusé', 'Le plan et les add-ons sont fixés par la licence.', 'Demandez une nouvelle licence à l’éditeur.'],
  ], [3000, 2900, 3746], { size: 16 }),

  H1('12. Assistance'),
  P('Pour contacter l’éditeur, joignez : le résultat de ./cortexskills version, celui de systemctl status cortexskills et les 200 dernières lignes de journalctl -u cortexskills. N’envoyez jamais le fichier .env ni ses secrets.'),
];

// =============================================================== GUIDE ÉDITEUR — LINUX ET WINDOWS
const PLANS = [['PK-01', 'Offre ingénierie de formation de base', 'PK-01'], ['PK-02', 'Offre réalisation et expérience d’apprentissage', 'PK-02'], ['PK-03', 'Offre évaluation, analytique et ROI', 'PK-03'], ['PK-04', 'Offre conformité et certification', 'PK-04'], ['PK-05', 'Offre talents et mobilité', 'PK-05'], ['PK-06', 'Offre entreprise étendue', 'PK-06'], ['PK-07', 'Offre conseil et diagnostic', 'PK-07'], ['PK-08', 'Offre pilotage stratégique des effectifs et gouvernance', 'PK-08'], ['BND-01', 'Pack Démarrage', 'PK-01, PK-02'], ['BND-02', 'Pack Croissance', 'PK-01 à PK-03'], ['BND-03', 'Pack Entreprise', 'PK-01 à PK-05'], ['BND-04', 'Pack Stratégique', 'PK-01 à PK-06, PK-08'], ['BND-05', 'Suite complète', 'PK-01 à PK-08'], ['SME-ESS', 'Pack PME Essentiel', 'PK-01'], ['SME-GRO', 'Pack PME Croissance', 'PK-01 à PK-03'], ['SME-CMP', 'Pack PME Complet', 'PK-01 à PK-08']];
const ADDONS = [['AD-01', 'Apprentissage immersif (RV/RA/simulation)'], ['AD-02', 'Moteur de personnalisation IA'], ['AD-03', 'Analytique prédictive'], ['AD-04', 'Apprentissage social et collaboratif'], ['AD-05', 'Moteur de ludification'], ['AD-06', 'Curation et agrégation de contenus'], ['AD-07', 'Capture et transfert des savoirs d’experts'], ['AD-08', 'Déploiement multi-sites / multi-entités'], ['AD-09', 'Validation externe du plan de formation'], ['AD-10', 'Maturité managériale'], ['AD-11', 'Bibliothèque de questionnaires et diffusion multicanale']];
const WADM = 'cortexskills admin';
const editeur = [
  ...cover({ eyebrow: 'Guide d’installation — Exécutable minifié — Côté éditeur — Linux et Windows', title: 'CortexSkills', subtitle: 'Poste de signature, scénario a (cloud privé / sur site, serveur Linux), scénario b (localhost sous Windows), sans Docker, données de référence et gestion des licences (créer, lire, modifier, révoquer, supprimer)', meta: [`Version ${V} · ${today}`, 'Interne — AI Value'] }),
  ...tocPage('Table des matières'),

  H1('1. Vue d’ensemble'),
  P(`Tout ce dont l’éditeur a besoin tient dans ${ED}.zip ; l’exécutable client, ${PKG}.zip, s’envoie tel quel aux clients. Les deux sont des exécutables de production minifiés, prêts à lancer, avec leur Node.js : ni Docker, ni npm, ni compilation. Ce guide décrit deux scénarios : a — cloud privé ou sur site, sur un serveur Linux (service systemd et HTTPS) ; b — localhost, sur un poste Windows 10 / 11. Les deux installations sont des versions de production : données de référence de toutes les verticales et des PME, aucun compte de démonstration.`),
  table(['Dans le paquet éditeur', 'Contenu', 'Où l’utiliser'], [
    ['cortexskills · cortexskills.cmd', 'Le lanceur sous Linux et sous Windows : start, admin (console), secrets, backup, restore, version.', 'Scénarios a et b.'],
    ['cslic · cslic.cmd · cslic-sauvegarder', 'Le gestionnaire de licences (importer, créer, lister, afficher, modifier, renouveler, révoquer, supprimer, vérifier) et la sauvegarde chiffrée du poste (Linux).', 'Votre poste uniquement : le poste de signature.'],
    ['app/', 'CortexSkills, version éditeur (tarifs visibles), et le gestionnaire de licences, minifiés.', 'Scénarios a et b.'],
    ['runtime/node-linux · runtime/node-windows', `Node.js ${NV} officiel pour Linux x64 et pour Windows x64.`, 'Utilisé par les lanceurs.'],
    ['installer-service.sh · config/', 'Service systemd durci et exemple Nginx (HTTPS).', 'Scénario a.'],
    ['poste-signature/', 'Votre paire de clés de signature (vendor-private.pem, vendor-public.pem), créée pour vous lors de la préparation des paquets ; les paquets contiennent la clé publique correspondante.', 'À importer une fois (cslic importer), puis à supprimer du paquet.'],
    ['documentation/', `${GE} (ce guide), en Word et en PDF.`, 'Votre poste.'],
    [`${PKG}.zip (fichier séparé)`, 'L’exécutable client (Linux) : sans tarif ni élément commercial, avec son guide d’installation et le Guide utilisateur.', 'Envoyé tel quel aux clients avec son .sha256.'],
  ], [2700, 4400, 2546], { size: 17 }),
  spacer(), minified('editeur'), perf,
  H2('1.1 Les données de référence'),
  ...refIntro('editeur'),
  spacer(),
  callout('Comment l’application est protégée', [
    'Code minifié : chaque fichier du serveur est compacté (sans commentaires, noms internes raccourcis, mise en forme supprimée) ; l’interface est compilée et minifiée ; aucune source map, aucun test, aucun outil de signature. Le paquet de construction vérifie qu’aucun fichier de l’application n’est lisible avant de produire le zip.',
    'Licence signée Ed25519 : le plan, le nombre d’utilisateurs, les add-ons et la date de fin viennent uniquement du fichier .lic ; un fichier modifié est refusé ; le client ne peut changer ni le plan ni les add-ons, ni dans l’écran ni par la console.',
    'Mode figé : le paquet impose le mode sur site (licence obligatoire) et, côté client, l’absence d’information commerciale, quels que soient les réglages de .env.',
    'Clé publique à un emplacement fixe dans app/ ; aucun réglage ne permet d’en désigner une autre. L’application refuse de démarrer si une clé privée se trouve dans son dossier.',
    'Version client sans élément commercial : aucun prix, aucun devis, pas d’écran Tarifs ; les prix sont retirés jusque dans la base.',
    'Service Linux non privilégié, en lecture seule sauf data/, port local uniquement.']),
  P('Limite à connaître : du code minifié reste exécutable, donc lisible avec effort par un administrateur déterminé disposant de tous les droits sur le serveur ; c’est moins protégé que le paquet Docker, où le code n’est pas accessible sans extraire l’image. La protection technique se complète par le contrat (licence d’utilisation, interdiction de rétro-ingénierie, droit d’audit, nombre d’utilisateurs, date de fin).', { size: 20, color: C.muted }),

  H1('2. Prérequis et préparation'),
  H2('2.1 Machines'),
  table(['Machine', 'Besoin'], [
    ['Serveur (scénario a)', 'Linux 64 bits x86-64 avec glibc 2.28+ (Ubuntu 22.04 / 24.04, Debian 12, RHEL / Rocky / AlmaLinux 9), 2 vCPU, 4 Go de RAM, 20 Go de disque libre (4 vCPU / 8 Go au-delà de 100 utilisateurs actifs) ; systemd ; Nginx ; un nom DNS ; ports 80/443.'],
    ['Poste Windows (signature et scénario b)', 'Windows 10 22H2 ou Windows 11, 64 bits (x64), 8 Go de RAM conseillés, 20 Go de disque libre. Rien d’autre : ni WSL, ni Docker, ni Node.js.'],
    ['Poste de signature sous Linux (au choix)', 'Linux 64 bits x86-64 ; unzip, sha256sum, openssl (pour cslic-sauvegarder).'],
    ['Internet', 'Pas nécessaire pour installer CortexSkills (serveurs et postes isolés possibles).'],
  ], W2),
  H2('2.2 Vérifier et décompresser le paquet'),
  P('Sous Windows, dans PowerShell (le dossier C:\\CortexSkills est un exemple ; évitez « Program Files », protégé en écriture) :'),
  ...cmd(`cd $env:USERPROFILE\\Downloads\n# seulement si vous avez reçu des parties :\ncmd /c "copy /b ${ED}.zip.part00+${ED}.zip.part01+${ED}.zip.part02+${ED}.zip.part03+${ED}.zip.part04 ${ED}.zip"\n(Get-FileHash ${ED}.zip -Algorithm SHA256).Hash.ToLower()     # identique au contenu du .sha256\nUnblock-File ${ED}.zip\nExpand-Archive ${ED}.zip -DestinationPath C:\\CortexSkills\ncd C:\\CortexSkills\\${ED}\n.\\cortexskills.cmd version`),
  P('Unblock-File retire la marque « téléchargé depuis Internet » : sans elle, Windows SmartScreen demande une confirmation à chaque lancement d’un .cmd. Adaptez la commande copy /b au nombre de parties reçues.', { size: 20 }),
  P('Sous Linux :'),
  ...cmd(`cat ${ED}.zip.part* > ${ED}.zip      # si reçu en parties\nsha256sum -c ${ED}.zip.sha256 && unzip -q ${ED}.zip -d ~/cortexskills && cd ~/cortexskills/${ED}\nsha256sum -c --quiet SHA256SUMS.txt && echo "contenu intact"\n./cortexskills version`),

  H1('3. Le poste de signature (une seule fois)'),
  P('Le poste de signature est votre poste de travail, Windows ou Linux. Dans le dossier du paquet :'),
  ...steps(['Installez votre paire de clés et créez le registre des licences, puis supprimez le dossier poste-signature :']),
  ...cmd(`# Windows (PowerShell, dans C:\\CortexSkills\\${ED})\n.\\cslic.cmd importer poste-signature\nicacls $env:USERPROFILE\\.cortexskills-editeur /inheritance:r /grant:r "$($env:USERNAME):(OI)(CI)F"\nRemove-Item -Recurse poste-signature\n# Linux\n./cslic importer poste-signature && rm -r poste-signature`),
  P('cslic enregistre tout dans %USERPROFILE%\\.cortexskills-editeur (Windows) ou ~/.cortexskills-editeur (Linux) : cles/vendor-private.pem (secrète), cles/vendor-public.pem, registre.json, licences/, archives/ et journal.log. La commande icacls réserve ce dossier à votre compte Windows ; sous Linux, cslic le crée avec les droits 700. cslic affiche l’empreinte de la clé publique : notez-la, vos clients peuvent la comparer.', { size: 20 }),
  ...steps(['Sauvegardez immédiatement le poste de signature, hors ligne et chiffré :']),
  ...cmd('# Linux : archive chiffrée AES-256 (mot de passe demandé)\n./cslic-sauvegarder ~/coffre           # → cortexskills-editeur-AAAA-MM-JJ.tar.gz.enc\n# restauration : openssl enc -d -aes-256-cbc -pbkdf2 -in <fichier.enc> | tar -xz -C ~\n# Windows : archive 7-Zip chiffrée (AES-256), à conserver hors ligne\n& "C:\\Program Files\\7-Zip\\7z.exe" a -p -mhe=on "$env:USERPROFILE\\Documents\\cortexskills-editeur-$(Get-Date -f yyyy-MM-dd).7z" "$env:USERPROFILE\\.cortexskills-editeur"'),
  callout('Règles de la clé privée', ['Elle ne quitte jamais votre poste : ni serveur du scénario a, ni client, ni messagerie, ni dépôt de code.', 'Si elle est perdue, vous ne pouvez plus émettre ni renouveler de licence ; si elle est divulguée, n’importe qui peut en émettre. Dans les deux cas, il faut une nouvelle paire de clés et de nouveaux paquets et licences pour tous les clients.', 'Sur un autre poste, restaurez la sauvegarde chiffrée ; ne créez pas de nouvelle paire (cslic init), sauf changement de clés volontaire (chapitre 7).', 'Cette paire a été créée pour vous lors de la préparation des paquets : elle n’est conservée nulle part ailleurs que dans le paquet éditeur. Après l’import et la sauvegarde, supprimez aussi le fichier zip reçu.'], C.light),
  P(`Pour taper simplement « cslic » : Windows, ajoutez C:\\CortexSkills\\${ED} à la variable PATH de votre compte ; Linux, alias cslic="$HOME/cortexskills/${ED}/cslic" dans ~/.bashrc.`, { size: 20 }),

  H1('4. Scénario a — Cloud privé ou sur site (serveur Linux)'),
  P('Sur un serveur Linux que vous administrez — cloud privé, serveur sur site ou VPS — pour un pilote ou une démonstration en HTTPS. Mêmes protections que chez un client ; la signature reste sur votre poste : ne copiez jamais poste-signature/ ni ~/.cortexskills-editeur sur le serveur.'),
  H2('4.1 Copier et décompresser sur le serveur'),
  ...cmd(`scp ${ED}.zip ${ED}.zip.sha256 utilisateur@serveur:~      # depuis votre poste (zip d’origine, sans poste-signature/ importé)\n# sur le serveur\nsudo apt -y install unzip nginx certbot python3-certbot-nginx\nsha256sum -c ${ED}.zip.sha256\nsudo unzip -q ${ED}.zip -d /opt && sudo mv /opt/${ED} /opt/cortexskills\ncd /opt/cortexskills && sudo rm -rf poste-signature runtime/node-windows *.cmd\nsudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable`),
  P('Le dossier poste-signature/ et la partie Windows sont retirés du serveur : ils n’y servent pas, et la clé privée ne doit jamais s’y trouver (l’application refuse de démarrer si elle en trouve une dans son dossier).', { size: 20 }),
  H2('4.2 Réglages'),
  ...cmd('sudo cp env.example .env\n./cortexskills secrets\nsudo nano .env'),
  envTable(false),
  editionNote('editeur'),
  H2('4.3 Service et HTTPS'),
  ...cmd('sudo ./installer-service.sh\njournalctl -u cortexskills -f          # premier démarrage : 5 à 15 minutes, jusqu’à « CortexSkills API is running »\nsudo cp config/nginx-cortexskills.conf /etc/nginx/conf.d/cortexskills.conf && sudo nano /etc/nginx/conf.d/cortexskills.conf\nsudo certbot certonly --nginx -d competences.mondomaine.ma\nsudo nginx -t && sudo systemctl reload nginx\ncurl -s https://competences.mondomaine.ma/api/health'),
  P('installer-service.sh crée l’utilisateur système cortexskills, rend app/ et runtime/ en lecture seule, réserve data/ au service et installe le service systemd durci (lecture seule sauf data/, sans privilège). Effacez ensuite ADMIN_PASSWORD de .env et sudo systemctl restart cortexskills. Renseignez les lignes SMTP_* pour que les invitations et relances partent réellement.', { size: 20 }),
  H2('4.4 Exploiter'),
  ...cmd(`sudo systemctl status cortexskills · journalctl -u cortexskills -f\nsudo -u cortexskills ./cortexskills backup\n30 2 * * * rsync -a /opt/cortexskills/data/ sauvegarde@stockage:/cortexskills/     # sudo crontab -e`),
  ...[
    'Restauration : sudo systemctl stop cortexskills ; sudo -u cortexskills ./cortexskills restore <fichier.db> ; sudo systemctl start cortexskills.',
    'Mise à jour : sauvegarde, puis remplacez app/, runtime/, config/ et les scripts par ceux de la nouvelle version, et relancez sudo ./installer-service.sh ; .env, data/ et licence/ sont conservés, la base est migrée au démarrage (même procédure que le chapitre 9.4 du guide client).',
    'Plusieurs organisations clientes peuvent être actives sur la même installation : une licence chacune.',
  ].map(t => bullet(t)),

  H1('5. Scénario b — Localhost sous Windows'),
  P('Sur votre poste Windows, pour démontrer, former ou piloter avec un client, à l’adresse http://localhost:4000, dans le même mode de production sur site que chez un client, avec les données de référence. Dans PowerShell, dossier C:\\CortexSkills\\' + ED + ' :'),
  ...cmd('Copy-Item env.example .env\n.\\cortexskills.cmd secrets            # deux secrets pour .env\nnotepad .env'),
  table(['Ligne de .env', 'Valeur (localhost)'], [
    ['PUBLIC_URL, CORS_ORIGIN', 'http://localhost:4000'], ['HOST, PORT', '127.0.0.1, 4000'],
    ['JWT_SECRET, CHANNEL_SECRET_KEY', 'les deux premières valeurs affichées par secrets'], ['ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD', 'votre administrateur de la plateforme'],
    ['REFERENCE_DATA', 'oui (données de référence) ou non (base vide)'],
  ], W2, { size: 18 }),
  ...cmd('.\\cortexskills.cmd start             # premier démarrage : 5 à 15 minutes, jusqu’à « CortexSkills API is running »'),
  P('Laissez la fenêtre ouverte et ouvrez http://localhost:4000 dans le navigateur. Arrêt : Ctrl+C dans la fenêtre. Ensuite, effacez la valeur de ADMIN_PASSWORD dans .env. Les données sont dans data\\ à côté du lanceur. Au premier lancement, le pare-feu Windows peut demander une autorisation pour node.exe : refusez l’accès réseau public, l’application n’écoute que sur 127.0.0.1.'),
  H2('5.1 Démarrage automatique (facultatif)'),
  P('Pour lancer CortexSkills à l’ouverture de session, sans fenêtre, avec le Planificateur de tâches (PowerShell) :'),
  ...cmd(`$a = New-ScheduledTaskAction -Execute "C:\\CortexSkills\\${ED}\\cortexskills.cmd" -Argument "start" -WorkingDirectory "C:\\CortexSkills\\${ED}"\n$t = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME\n$s = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -AllowStartIfOnBatteries\nRegister-ScheduledTask -TaskName "CortexSkills" -Action $a -Trigger $t -Settings $s -Description "CortexSkills localhost"\nStart-ScheduledTask CortexSkills · Stop-ScheduledTask CortexSkills · Unregister-ScheduledTask CortexSkills`),
  H2('5.2 Console, sauvegarde et restauration sous Windows'),
  table(['Action', 'Commande (PowerShell, dossier du paquet)'], [
    ['Aide de la console', `.\\${WADM.replace('cortexskills', 'cortexskills.cmd')} help`],
    ['Sauvegarde à la demande', '.\\cortexskills.cmd backup        (dans data\\backups)'],
    ['Restauration (application arrêtée)', '.\\cortexskills.cmd restore · .\\cortexskills.cmd restore <fichier.db>'],
    ['Version', '.\\cortexskills.cmd version'],
  ], [3200, 6446], { size: 17 }),
  H2('5.3 Les organisations de référence'),
  refTable(),

  H1('6. Gestion des licences'),
  P('Une licence suit toujours le même cycle. La signature (création, modification) se fait sur votre poste avec cslic ; l’installation et le retrait se font sur l’installation concernée avec la console (cortexskills admin) — ou par le client lui-même.'),
  table(['Étape', 'Sur le poste de signature (cslic)', 'Sur l’installation (cortexskills admin …)'], [
    ['Demande', '—', 'org-create … puis licence-request --org <domaine> → Organization ID'],
    ['Créer (C)', 'cslic creer …', 'licence-install --file <fichier.lic>'],
    ['Lire (R)', 'cslic lister · cslic afficher L-0001 · cslic lister --csv', 'licence-list · licence-show --org <domaine> · écran Configuration et licence'],
    ['Modifier (U)', 'cslic modifier L-0001 … · cslic renouveler L-0001 --fin …', 'licence-install --file <nouvelle version>'],
    ['Révoquer', 'cslic revoquer L-0001 --motif …', 'licence-remove --org <domaine> --yes'],
    ['Supprimer (D)', 'cslic supprimer L-0001 --oui', '—'],
  ], [1500, 4000, 4146], { size: 16 }),
  P('Sur le serveur Linux (scénario a), préfixez la console par sudo -u cortexskills ./cortexskills admin ; sous Windows (scénario b), .\\cortexskills.cmd admin. Sous Windows, cslic s’écrit .\\cslic.cmd.', { size: 20 }),
  H2('6.1 Créer'),
  ...steps([[b('Créer l’organisation sur l’installation :'), '']]),
  ...cmd('cortexskills admin org-create --name "Clinique Exemple" --domain clinique-exemple.ma \\\n  --admin-email admin@clinique-exemple.ma --admin-name "Admin Clinique" --admin-password \'Str0ng#Passw0rd2026\' --lang fr\ncortexskills admin licence-request --org clinique-exemple.ma        # affiche l’Organization ID'),
  ...steps([[b('Signer sur votre poste :'), '']]),
  ...cmd('cslic creer --societe "Clinique Exemple" --org-id <Organization ID> --plan SME-GRO --utilisateurs 50 \\\n  --fin 2027-12-31 --addons AD-11 --ref CONTRAT-2026-014'),
  table(['Option', 'Signification', 'Règle'], [
    ['--societe', 'Nom du client écrit dans la licence.', 'Obligatoire.'],
    ['--org-id', 'Organization ID affiché par la demande.', 'Exact (format UUID) ; la licence ne vaut que pour cette organisation.'],
    ['--plan', 'Plan (chapitre 8).', 'Fixe les modules de l’organisation.'],
    ['--utilisateurs', 'Nombre maximal d’utilisateurs actifs.', 'La création d’un utilisateur au-delà est refusée.'],
    ['--fin', 'Date de fin (AAAA-MM-JJ).', 'Alerte 30 jours avant ; lecture seule après.'],
    ['--addons', 'Add-ons (chapitre 8), séparés par des virgules.', 'Facultatif ; seuls ces add-ons sont actifs.'],
    ['--fonctions, --ref, --notes', 'Mentions libres ; référence du contrat ; notes internes.', 'Facultatif.'],
  ], [1800, 3700, 4146], { size: 16 }),
  P('cslic attribue un numéro (L-0001, L-0002…), écrit le fichier licences/L-0001_v1_Clinique_Exemple.lic dans le dossier du poste de signature et l’inscrit au registre. Une seule licence active par organisation : pour la changer, modifiez-la.', { size: 20 }),
  ...steps([[b('Installer. '), 'Scénario a : copiez d’abord le fichier sur le serveur. Scénario b : directement depuis votre poste.']]),
  ...cmd('# scénario a\nscp ~/.cortexskills-editeur/licences/L-0001_v1_Clinique_Exemple.lic utilisateur@serveur:/tmp/\nsudo cp /tmp/L-0001_v1_Clinique_Exemple.lic /opt/cortexskills/licence/ && sudo chmod 644 /opt/cortexskills/licence/*.lic\nsudo -u cortexskills ./cortexskills admin licence-install --file licence/L-0001_v1_Clinique_Exemple.lic\n# scénario b (PowerShell)\n.\\cortexskills.cmd admin licence-install --file $env:USERPROFILE\\.cortexskills-editeur\\licences\\L-0001_v1_Clinique_Exemple.lic'),
  H2('6.2 Lire'),
  ...cmd('cslic lister                     # licences actives : numéro, société, plan, utilisateurs, fin, version, état\ncslic lister --tout --csv registre.csv   # tout l’historique, exporté pour un tableur\ncslic afficher L-0001            # détail et historique (création, modifications, révocation)\ncortexskills admin licence-list  # sur l’installation : licences installées et leur état\ncortexskills admin licence-show --org clinique-exemple.ma'),
  P('États : ACTIVE, ACTIVE (n j) dans les 30 derniers jours, EXPIRÉE, RÉVOQUÉE. Le journal journal.log du poste trace chaque opération (date, utilisateur, licence).', { size: 20 }),
  H2('6.3 Modifier et renouveler'),
  ...cmd('cslic modifier L-0001 --utilisateurs 80                  # plus d’utilisateurs\ncslic modifier L-0001 --plan BND-02 --addons AD-02,AD-11   # autre plan, autres add-ons (--addons "" pour aucun)\ncslic renouveler L-0001 --fin 2028-12-31                  # nouvelle date de fin'),
  P('Chaque modification signe une nouvelle version (L-0001_v2_…lic) et l’inscrit dans l’historique. Installez-la comme la première (licence-install) : elle remplace la précédente, sans redémarrage.', { size: 20 }),
  H2('6.4 Révoquer et retirer'),
  ...cmd('cslic revoquer L-0001 --motif "contrat résilié"\ncortexskills admin licence-remove --org clinique-exemple.ma --yes     # sur l’installation : les utilisateurs ne peuvent plus se connecter'),
  P('Sur vos installations (scénarios a et b), le retrait est immédiat. Chez un client qui installe lui-même, une licence ne peut pas être annulée à distance : elle cesse à sa date de fin. Préférez donc des durées d’un an, renouvelées, et appliquez le contrat. Les données de l’organisation restent dans data/.', { size: 20 }),
  H2('6.5 Supprimer'),
  ...cmd('cslic supprimer L-0001 --oui            # licence révoquée ou expirée ; --force pour une licence encore active'),
  P('La fiche et toutes les versions du fichier sont déplacées dans archives/ ; la ligne disparaît du registre. Le journal garde la trace de l’opération.', { size: 20 }),
  H2('6.6 Un client qui installe chez lui'),
  ...steps([
    `Envoyer au client : ${PKG}.zip (ou ses parties) et ${PKG}.zip.sha256 ; le paquet contient ${GC} et ${GU} (Word et PDF, dossier documentation/). Le paquet est le même pour tous les clients : il contient votre clé publique.`,
    'Recevoir les lignes de sa demande (licence-request) : société et Organization ID.',
    'Signer avec cslic creer (6.1) et lui envoyer le fichier .lic par e-mail. Il l’installe avec licence-install, sans accès de votre part à son serveur.',
    'Renouvellements et changements : cslic modifier / renouveler, puis envoi de la nouvelle version.',
  ]),

  H1('7. Nouvelle version ou changement de clés'),
  ...[
    `Nouvelle version : vous recevez de nouveaux paquets ${ED.replace(V, '<version>')}.zip et ${PKG.replace(V, '<version>')}.zip, construits par l’équipe de développement (le code source ne fait pas partie de cette livraison). Sur chaque installation : sauvegarde, puis remplacement de app/, runtime/ et des scripts ; .env, data/ et licence/ sont conservés et la base est migrée au démarrage. Les données de référence ne sont pas rechargées.`,
    'Sous Windows (scénario b) : arrêtez l’application, décompressez la nouvelle version dans un nouveau dossier, copiez-y .env et le dossier data\\ de l’ancienne, puis lancez .\\cortexskills.cmd start ; mettez à jour la tâche planifiée si vous l’utilisez.',
    'Les nouveaux paquets sont construits avec votre clé publique (vendor-public.pem, que vous pouvez exporter avec cslic cle-publique) : vos licences restent valables.',
    'Changement de clés (clé perdue ou divulguée) : créez une nouvelle paire avec cslic init dans un nouveau CSLIC_HOME, faites reconstruire les paquets avec la nouvelle clé publique, puis réémettez et renvoyez toutes les licences ; les anciennes ne sont plus reconnues par les nouveaux paquets.',
  ].map(t => bullet(t)),
  H1('8. Plans et add-ons'),
  table(['Plan', 'Nom', 'Contient'], PLANS, [1300, 5300, 3046], { size: 16 }),
  table(['Add-on', 'Nom'], ADDONS, [1300, 8346], { size: 16 }),
  P('Les tarifs restent visibles dans vos installations (Administration › Tarifs) ; ils n’apparaissent jamais chez les clients.', { size: 20, color: C.muted }),

  H1('9. Dépannage'),
  table(['Ce que vous voyez', 'Cause', 'Que faire'], [
    ['cslic : « Poste de signature non initialisé »', 'Clés pas encore importées sur ce poste, ou CSLIC_HOME différent.', 'cslic importer poste-signature, ou restauration de la sauvegarde chiffrée.'],
    ['cslic creer : « déjà active pour cette organisation »', 'Une seule licence active par organisation.', 'cslic modifier L-xxxx …'],
    ['« The vendor PRIVATE key must never be on a customer server »', 'vendor-private.pem trouvé dans le dossier de l’application.', 'Retirez-le : il ne doit exister que dans le dossier cles/ du poste de signature.'],
    ['licence-install : « signature is not valid » partout', 'Licences signées avec une autre clé que celle du paquet.', 'Comparez les empreintes (cslic empreinte) ; voir le chapitre 7.'],
    ['Premier démarrage long', 'Chargement des données de référence.', 'Normal (5 à 15 minutes). Ne l’interrompez pas.'],
    ['« Port 4000 is already in use »', 'CortexSkills déjà lancé (autre fenêtre, tâche planifiée) ou autre logiciel.', 'Fermez l’autre instance, ou changez PORT, PUBLIC_URL et CORS_ORIGIN dans .env.'],
    ['Windows : « Windows a protégé votre ordinateur » (SmartScreen)', 'Fichiers marqués « téléchargés depuis Internet ».', 'Unblock-File sur le zip avant de le décompresser (2.2), ou Get-ChildItem -Recurse | Unblock-File dans le dossier.'],
    ['Windows : « Accès refusé » en écrivant data\\', 'Paquet décompressé dans Program Files.', 'Décompressez dans C:\\CortexSkills.'],
    ['Linux : « EACCES » ou « read-only file system »', 'Installation sous /home ou droits modifiés.', 'Installez dans /opt/cortexskills ; relancez sudo ./installer-service.sh.'],
    ['Linux : « GLIBC_2.28 not found »', 'Système trop ancien, Alpine ou arm64.', 'Linux x86-64 récent (2.1), ou le paquet Docker.'],
    ['Un compte d’une organisation de référence est refusé', 'Ces comptes ne peuvent pas se connecter (1.1).', 'Administrateur de la plateforme, ou comptes des organisations créées avec la console.'],
  ], [3200, 3000, 3446], { size: 16 }),

  H1('10. Référence des commandes'),
  table(['Où', 'Commande', 'Rôle'], [
    ['Poste', 'cslic importer poste-signature · cslic-sauvegarder <dossier> · cslic empreinte · cslic cle-publique', 'Clés et sauvegarde'],
    ['Poste', 'cslic creer · lister · afficher · modifier · renouveler · revoquer · supprimer · verifier', 'Licences (CRUD)'],
    ['Installation', 'cortexskills start · version · secrets · backup · restore [fichier]', 'Lancement et exploitation'],
    ['Installation', 'cortexskills admin org-create · org-list · licence-request · licence-install · licence-list · licence-show · licence-remove · password · help', 'Organisations, licences installées, comptes'],
    ['Serveur Linux', 'sudo ./installer-service.sh · systemctl status|restart cortexskills · journalctl -u cortexskills -f', 'Service (scénario a)'],
    ['Poste Windows', '.\\cortexskills.cmd … · .\\cslic.cmd … · Register-ScheduledTask (5.1)', 'Scénario b'],
  ], [1600, 5600, 2446], { size: 16 }),
];

fs.mkdirSync(out, { recursive: true });
const write = (body, title, credit, file) => D.Packer.toBuffer(document({ title, credit, sections: [body], lang: 'fr-FR' })).then(buf => { fs.writeFileSync(path.join(out, file), buf); console.log('écrit', file); });
write(client, 'CortexSkills — Guide d’installation, exécutable minifié, côté client (Linux)', `CortexSkills ${V} · Guide d’installation — exécutable — client — Linux`, GC + '.docx')
  .then(() => write(editeur, 'CortexSkills — Guide d’installation, exécutable minifié, côté éditeur (Linux et Windows)', `CortexSkills ${V} · Guide d’installation — exécutable — éditeur — Linux et Windows`, GE + '.docx'));
