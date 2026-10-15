// Construit les deux guides d'installation en français (Word, avec table des matières) :
//  - CortexSkills_Guide_Installation_Client_FR.docx : le client installe le paquet client (Docker, Linux) et active sa
//    licence — sans aucun élément commercial ;
//  - CortexSkills_Guide_Installation_Editeur_FR.docx : l'éditeur — poste de signature, scénario 1 (local), scénario 2
//    (cloud privé / sur site), gestion des licences (créer, lire, modifier, révoquer, supprimer), paquets clients.
// Exécution : node build-guides-installation-fr.cjs <dossier>, puis python3 topdf.py <fichiers> pour les PDF.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, bullet, code, callout, table, shot, cover, tocPage, document, spacer } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const V = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const SH = f => path.join(__dirname, 'shots/docker-fr', f + '.png');
let n = 0; const steps = items => { const ref = 'fsteps' + (n++ || ''); return items.map(t => B.numbered(t, ref)); };
const cmd = s => s.split('\n').map(l => code(l));
const b = t => ({ text: t, bold: true });
const PKG = `CortexSkills-Client-${V}`, ED = `CortexSkills-Editeur-${V}`, IMG = `cortexskills:${V}`;
const W2 = [3000, 6646];
const ADM = 'docker compose exec cortexskills cortexskills-admin';

// =============================================================== GUIDE CLIENT
const client = [
  ...cover({ eyebrow: 'Guide d’installation — Client', title: 'CortexSkills', subtitle: 'Installer CortexSkills sur votre serveur Linux avec Docker (cloud privé ou sur site) et activer votre licence', meta: [`Version ${V} · ${today}`, 'AI Value'] }),
  ...tocPage('Table des matières'),

  H1('1. Ce que vous installez'),
  P('CortexSkills fonctionne sur votre infrastructure, dans un conteneur Docker. Vos données ne quittent pas vos serveurs : la base, les pièces jointes et les sauvegardes sont dans un volume Docker de votre machine. Rien n’est envoyé à l’éditeur et l’application n’a pas besoin d’Internet pour fonctionner (seulement pour envoyer des e-mails ou des messages WhatsApp, si vous les configurez).'),
  table(['Élément', 'Rôle'], [
    ['Conteneur cortexskills', `L’application (serveur et écrans web), construite depuis le paquet en image ${IMG}. Elle s’exécute avec un utilisateur sans privilège, sur un système de fichiers en lecture seule.`],
    ['Volume cortexskills_cortexskills-data', 'Monté sur /data : base de données, pièces jointes, sauvegardes quotidiennes et licence installée. C’est la seule donnée à protéger.'],
    ['Conteneur cortexskills-https (facultatif)', 'Caddy : HTTPS devant l’application, avec un certificat automatique, interne ou fourni par vous.'],
    ['Dossier licence/', 'Où vous déposez le fichier de licence reçu de l’éditeur (lu en lecture seule).'],
    ['Fichier .env', 'Vos réglages : adresse, secrets, administrateur, messagerie.'],
  ], W2),
  spacer(),
  callout('Ce que contient l’image — et ce qu’elle ne contient pas', [
    'Dans l’image : Node.js 22, l’exécutable CortexSkills (code minifié, sans code source), les écrans web compilés et la clé publique de l’éditeur (elle vérifie la licence, elle ne peut pas en créer).',
    'Hors de l’image : votre licence, vos réglages et secrets, vos données. Aucun outil de signature, aucune clé privée, aucun outil de développement.',
    'Le port de l’application (4000) n’est ouvert que sur 127.0.0.1 : les utilisateurs passent par HTTPS.']),

  H1('2. Prérequis'),
  H2('2.1 Serveur'),
  table(['Élément', 'Minimum', 'Recommandé (300 utilisateurs et plus)'], [
    ['Système', 'Linux 64 bits (x86-64 ou arm64)', 'Ubuntu 22.04 / 24.04 LTS, Debian 12, RHEL / Rocky / AlmaLinux 9'],
    ['Processeur', '2 vCPU', '4 vCPU'],
    ['Mémoire', '4 Go', '8 Go'],
    ['Disque', '20 Go libres (image d’environ 650 Mo, données, sauvegardes)', '50 Go sur un stockage sauvegardé'],
    ['Logiciels', 'Docker Engine 24 ou plus récent avec le plugin compose ; unzip ; sha256sum', 'Dernière version stable de Docker Engine'],
  ], [2000, 3600, 4046], { size: 18 }),
  H2('2.2 Réseau'),
  table(['Besoin', 'Détail'], [
    ['Nom DNS', 'Par exemple competences.votre-entreprise.ma, pointant vers le serveur (un DNS interne suffit pour un intranet).'],
    ['Entrant', '443/TCP pour les utilisateurs (et 80/TCP si le certificat est obtenu automatiquement). Le port 4000 reste fermé.'],
    ['Sortant pendant l’installation', 'Accès au registre Docker (image Node.js et Caddy) et au registre npm (bibliothèques du serveur), directement ou par vos miroirs / proxy.'],
    ['Sortant en exploitation (facultatif)', 'Votre serveur SMTP (souvent 587/TCP) ; graph.facebook.com en 443/TCP pour WhatsApp Business.'],
    ['Navigateurs', 'Chrome, Edge, Firefox ou Safari récents.'],
  ], W2),
  H2('2.3 Ce que vous recevez de l’éditeur'),
  table(['Fichier', 'Rôle'], [
    [`${PKG}.zip`, 'Le paquet d’installation : Dockerfile, fichiers compose, configuration HTTPS, modèle de réglages, exécutable CortexSkills et clé publique de l’éditeur.'],
    [`${PKG}.zip.sha256`, 'L’empreinte SHA-256 du paquet, pour vérifier qu’il est intact (chapitre 4).'],
    ['Ce guide (Word et PDF)', 'Installation, activation de la licence, exploitation.'],
    ['Le Guide utilisateur (Word et PDF)', 'Utilisation de l’application, sur un cas réel complet.'],
    ['Plus tard : <Votre_entreprise>.lic', 'Votre fichier de licence, envoyé par l’éditeur après votre demande (chapitre 9).'],
  ], W2),
  P(`Le paquet contient un fichier nommé Dockerfile : c’est la recette de construction de l’image d’exécution, utilisée par la commande docker compose build (chapitre 7). Vous n’avez pas à l’ouvrir ni à le modifier.`, { size: 20 }),

  H1('3. Installer Docker'),
  P('Passez ce chapitre si la commande docker compose version répond déjà. Sinon, en administrateur (sudo), sur Ubuntu ou Debian :'),
  ...cmd('sudo apt update && sudo apt -y install unzip ca-certificates curl\ncurl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh\nsudo usermod -aG docker $USER && sudo systemctl enable --now docker      # puis déconnectez-vous et reconnectez-vous\ndocker version && docker compose version'),
  P('Sur RHEL, Rocky ou AlmaLinux, suivez la procédure officielle (docs.docker.com/engine/install : paquets docker-ce et docker-compose-plugin), puis sudo systemctl enable --now docker.', { size: 20 }),

  H1('4. Vérifier et décompresser le paquet'),
  ...cmd(`sudo mkdir -p /opt/cortexskills && sudo chown $USER /opt/cortexskills\ncp ${PKG}.zip ${PKG}.zip.sha256 /opt/cortexskills/ && cd /opt/cortexskills\nsha256sum -c ${PKG}.zip.sha256          # doit répondre : ${PKG}.zip: OK\nunzip ${PKG}.zip && cd ${PKG}\nls -a`),
  P('Si la vérification ne répond pas « OK », n’installez pas : demandez un nouvel envoi à l’éditeur.', { size: 20, color: C.muted }),
  table(['Dans le dossier', 'Rôle'], [
    ['Dockerfile, .dockerignore', 'Recette de l’image d’exécution (utilisée par docker compose build).'],
    ['docker-compose.yml', 'Le service CortexSkills, son volume de données, ses options de sécurité, et Caddy pour le HTTPS (profil « https »).'],
    ['Caddyfile', 'Configuration HTTPS, avec trois modes de certificat (chapitre 6).'],
    ['env.example', 'Modèle du fichier de réglages .env.'],
    ['vendor-public.pem', 'Clé publique de l’éditeur, qui vérifie la licence. Ne la modifiez pas.'],
    ['runtime/', 'L’exécutable CortexSkills : serveur minifié et écrans web compilés.'],
    ['docker/', 'Script de démarrage et console d’administration de l’image.'],
    ['licence/', 'Déposez ici le fichier .lic reçu de l’éditeur.'],
    ['certs/', 'Mode de certificat « files » : votre certificat cert.pem et sa clé key.pem.'],
    ['LISEZMOI.txt', 'Rappel des commandes essentielles.'],
  ], W2, { size: 18 }),

  H1('5. Réglages (.env)'),
  ...cmd('cp env.example .env && chmod 600 .env\nopenssl rand -base64 48 | tr -d "\\n=+/"; echo     # à lancer deux fois : une valeur par secret\nnano .env'),
  table(['Réglage', 'Valeur', 'Exemple'], [
    ['PUBLIC_URL', 'L’adresse saisie par les utilisateurs, en HTTPS ; elle figure dans les liens envoyés par e-mail et WhatsApp.', 'https://competences.votre-entreprise.ma'],
    ['CORS_ORIGIN', 'La même adresse.', 'https://competences.votre-entreprise.ma'],
    ['DOMAIN', 'Le nom DNS du serveur.', 'competences.votre-entreprise.ma'],
    ['TLS_MODE', 'auto, internal ou files (chapitre 6).', 'auto'],
    ['COMPOSE_PROFILES', '« https » pour utiliser Caddy fourni ; vide si vous avez votre propre reverse proxy.', 'https'],
    ['HOST_PORT', 'Port local (127.0.0.1) de l’application.', '4000'],
    ['JWT_SECRET', 'Valeur aléatoire de 32 caractères ou plus (signe les sessions).', 'résultat de openssl rand'],
    ['CHANNEL_SECRET_KEY', 'Autre valeur aléatoire (chiffre les identifiants enregistrés).', 'résultat de openssl rand'],
    ['ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD', 'L’administrateur de la plateforme, créé au premier démarrage. Mot de passe : 12 caractères min., majuscule, minuscule, chiffre, symbole. Effacez ADMIN_PASSWORD ensuite.', 'it.ops@votre-entreprise.ma'],
    ['BACKUP_RETENTION_DAYS', 'Jours de conservation des sauvegardes quotidiennes.', '30'],
    ['SMTP_*', 'Votre messagerie pour les invitations, relances et notifications.', 'smtp.votre-entreprise.ma, 587'],
    ['WHATSAPP_*', 'Facultatif : WhatsApp Business Cloud API.', '—'],
  ], [2400, 4800, 2446], { size: 17 }),
  callout('Contrôles au démarrage', ['L’application refuse de démarrer tant qu’un réglage est dangereux — secret court ou par défaut, deux secrets identiques, adresse qui n’est pas en HTTPS, CORS ouvert — et liste chaque problème dans son journal.', 'Gardez une copie de .env dans votre coffre : changer JWT_SECRET déconnecte tous les utilisateurs ; perdre CHANNEL_SECRET_KEY rend illisibles les identifiants de messagerie enregistrés.'], C.light),

  H1('6. HTTPS'),
  table(['TLS_MODE', 'Quand', 'Ce qu’il faut'], [
    ['auto', 'Serveur joignable depuis Internet.', 'Le nom DNS public pointe vers le serveur ; ports 80 et 443 ouverts. Caddy obtient et renouvelle le certificat Let’s Encrypt.'],
    ['internal', 'Réseau privé, essais.', 'Rien de plus : Caddy utilise sa propre autorité. Les navigateurs afficheront un avertissement tant que cette autorité n’est pas approuvée par vos postes.'],
    ['files', 'Certificat de votre entreprise.', 'Copiez certs/cert.pem (chaîne complète) et certs/key.pem.'],
  ], [1600, 2800, 5246], { size: 18 }),
  P('Votre propre reverse proxy ou répartiteur de charge : laissez COMPOSE_PROFILES vide et transférez le HTTPS vers http://127.0.0.1:4000. Exemple nginx :'),
  ...cmd('server {\n  listen 443 ssl http2;  server_name competences.votre-entreprise.ma;\n  ssl_certificate /etc/ssl/competences.crt;  ssl_certificate_key /etc/ssl/competences.key;\n  client_max_body_size 20m;\n  location / {\n    proxy_pass http://127.0.0.1:4000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto https;\n  }\n}'),

  H1('7. Construire et démarrer'),
  ...cmd('docker compose build                 # construit l’image depuis le Dockerfile : 2 à 5 minutes\ndocker compose up -d\ndocker compose logs -f cortexskills   # Ctrl+C pour quitter\ndocker compose ps                     # cortexskills : « healthy »'),
  P('Au premier démarrage, l’application crée la base de production (catalogue de référence, modèles, administrateur de la plateforme) en quelques secondes, puis démarre. Le contrôle de santé répond :'),
  ...cmd(`curl -sk https://competences.votre-entreprise.ma/api/health\n{"status":"ok","initialized":true,"mode":"onprem","version":"${V}"}`),
  P('Effacez ensuite la valeur de ADMIN_PASSWORD dans .env et relancez docker compose up -d. Derrière un proxy d’entreprise, ajoutez à la construction : docker compose build --build-arg HTTPS_PROXY=http://proxy:port. Avec un miroir interne de l’image Node.js officielle : --build-arg BASE_IMAGE=registre.votre-entreprise.ma/library/node:22-bookworm-slim.', { size: 20 }),
  ...shot(SH('01_connexion'), 'La page de connexion à votre adresse', 500),

  H1('8. Créer votre organisation'),
  P('L’organisation est votre entreprise dans CortexSkills, avec ses utilisateurs, ses projets et sa licence :'),
  ...cmd(`${ADM} org-create \\\n  --name "Votre entreprise" --domain votre-entreprise.ma \\\n  --admin-email prenom.nom@votre-entreprise.ma --admin-name "Prénom Nom" \\\n  --admin-password 'Str0ng#Passw0rd2026' --lang fr --country Maroc --city Casablanca`),
  table(['Option', 'Signification'], [
    ['--name', 'Nom affiché dans l’application.'],
    ['--domain', 'Domaine e-mail de vos utilisateurs ; il désigne l’organisation dans les commandes suivantes.'],
    ['--admin-email, --admin-name, --admin-password', 'Premier administrateur de l’organisation (tous les droits). Mot de passe fort obligatoire.'],
    ['--lang', 'Langue par défaut : fr, en ou ar. Chaque utilisateur peut en changer.'],
    ['--sector, --segment, --employees, --country, --city', 'Profil facultatif, complétable ensuite dans l’application.'],
  ], W2, { size: 18 }),
  P('La commande affiche l’Organization ID. Vos utilisateurs ne peuvent pas se connecter avant l’installation de la licence.'),

  H1('9. Activer la licence'),
  P('La licence est un petit fichier signé (.lic) émis par l’éditeur pour votre Organization ID. Elle fixe le plan, le nombre d’utilisateurs, les add-ons et la date de fin. Elle est vérifiée avec la clé publique incluse dans l’image : toute modification du fichier la rend invalide.'),
  ...steps([[b('Demander. '), 'Affichez les informations à transmettre :']]),
  ...cmd(`${ADM} licence-request --org votre-entreprise.ma`),
  P('Envoyez à l’éditeur, par e-mail, les lignes affichées (société et Organization ID). L’Organization ID n’est pas secret mais doit être recopié exactement.', { size: 20 }),
  ...steps([[b('Recevoir. '), 'L’éditeur vous envoie un fichier comme L-0012_v1_Votre_entreprise.lic. Copiez-le dans le dossier licence/ du paquet :']]),
  ...cmd(`cp ~/L-0012_v1_Votre_entreprise.lic /opt/cortexskills/${PKG}/licence/ && chmod 644 /opt/cortexskills/${PKG}/licence/*.lic`),
  ...steps([[b('Installer '), '(sans redémarrage) :']]),
  ...cmd(`${ADM} licence-install --file /licence/L-0012_v1_Votre_entreprise.lic`),
  P('La console confirme le plan, le nombre d’utilisateurs et la date de fin. Un fichier modifié, ou émis pour un autre Organization ID, est refusé avec un message explicite.', { size: 20 }),
  ...steps([[b('Vérifier. '), 'Connectez-vous avec l’administrateur de l’organisation, puis ouvrez Administration › Configuration et licence : la licence est « Active », avec le plan, le nombre d’utilisateurs et la date de fin.']]),
  ...shot(SH('02_licence'), 'Administration › Configuration et licence après l’activation', 560),
  H2('9.1 Consulter la licence installée'),
  ...cmd(`${ADM} licence-list\n${ADM} licence-show --org votre-entreprise.ma`),
  H2('9.2 Ce que la licence décide'),
  P('Le plan, le nombre d’utilisateurs et les add-ons viennent uniquement de la licence : ils ne se modifient ni dans l’application ni par la console. L’écran le rappelle :'),
  ...shot(SH('03_packs_sans_prix'), 'Le plan est fixé par la licence', 560),
  H2('9.3 Renouvellement, changement, fin'),
  ...[
    'L’application prévient les administrateurs 30 jours avant la date de fin ; après cette date, elle passe en lecture seule jusqu’à l’installation d’une nouvelle licence.',
    'Pour un renouvellement, davantage d’utilisateurs, un autre plan ou un add-on : demandez une nouvelle licence à l’éditeur et installez-la de la même façon (licence-install) ou par Administration › Configuration et licence › Téléverser la licence. Elle remplace la précédente.',
    'Retrait d’une licence (fin de contrat) : licence-remove --org votre-entreprise.ma --yes. Les utilisateurs de l’organisation ne peuvent plus se connecter ; les données restent dans le volume.',
  ].map(t => bullet(t)),

  H1('10. Exploitation'),
  H2('10.1 Commandes courantes'),
  table(['Action', 'Commande (dans le dossier du paquet)'], [
    ['Démarrer / arrêter / redémarrer', 'docker compose up -d · docker compose stop · docker compose restart'],
    ['État et santé', 'docker compose ps · curl -sk https://<votre adresse>/api/health'],
    ['Journal', 'docker compose logs -f --tail 200 cortexskills'],
    ['Aide de la console', `${ADM} help`],
    ['Nouveau mot de passe d’un utilisateur', `${ADM} password --email jean@votre-entreprise.ma --password 'N0uveau#2026Mdp'`],
  ], [2900, 6746], { size: 17 }),
  P('Les conteneurs redémarrent seuls après un redémarrage du serveur (restart: unless-stopped), si le service Docker est activé.', { size: 20 }),
  H2('10.2 Sauvegardes'),
  P('L’application écrit chaque jour une sauvegarde de la base dans /data/backups. Avant toute intervention, et chaque jour, copiez les sauvegardes hors du serveur :'),
  ...cmd(`${ADM} backup\ndocker compose cp cortexskills:/data/backups ./sauvegardes-$(date +%F)\ndocker compose cp cortexskills:/data/attachments ./pieces-jointes-$(date +%F)\n# puis copiez ces dossiers vers votre stockage de sauvegarde`),
  H2('10.3 Restauration'),
  ...cmd('docker compose stop cortexskills\ndocker compose run --rm --no-deps --entrypoint cortexskills-admin cortexskills restore            # liste les sauvegardes\ndocker compose run --rm --no-deps --entrypoint cortexskills-admin cortexskills restore <fichier.db>\ndocker compose start cortexskills'),
  P('La base actuelle est conservée à côté des sauvegardes (before-restore-<date>.db). Une sauvegarde d’une version antérieure est mise à niveau au démarrage.', { size: 20 }),
  H2('10.4 Mise à jour'),
  ...steps(['Faites une sauvegarde (10.2).', 'Vérifiez et décompressez le nouveau paquet à côté de l’actuel (chapitre 4).', 'Copiez-y .env, licence/ et certs/ du dossier actuel.', 'Dans le nouveau dossier : docker compose build puis docker compose up -d. Le volume de données et la licence sont conservés ; la base est migrée au démarrage.', 'Vérifiez la santé et la version.']),
  H2('10.5 Désinstallation'),
  P('docker compose down arrête et supprime les conteneurs mais garde les données. docker compose down -v supprime aussi le volume, donc toutes les données : faites et copiez une sauvegarde avant.'),

  H1('11. Sécurité'),
  ...[
    'Le conteneur s’exécute avec un utilisateur sans privilège, sur un système de fichiers en lecture seule, sans capacité Linux et sans élévation de privilèges.',
    'Le port de l’application n’écoute que sur 127.0.0.1 ; seul le HTTPS est exposé.',
    'Gardez .env lisible par les seuls administrateurs (chmod 600) et ses secrets dans votre coffre.',
    'Mots de passe stockés hachés ; sessions limitées à JWT_TTL (12 h par défaut) ; chaque action d’administration est inscrite au journal d’audit.',
    'Appliquez les mises à jour du système et de Docker, et les mises à jour de CortexSkills envoyées par l’éditeur.',
  ].map(t => bullet(t)),

  H1('12. Dépannage'),
  table(['Ce que vous voyez', 'Cause', 'Que faire'], [
    ['« will not start in production mode » dans le journal', 'Un réglage de .env manque ou est dangereux.', 'Lisez la liste du journal : chaque ligne nomme le réglage à corriger, puis docker compose up -d.'],
    ['« Premier démarrage : renseignez ADMIN_EMAIL et ADMIN_PASSWORD »', 'Premier démarrage sans administrateur.', 'Renseignez-les dans .env, redémarrez, puis effacez ADMIN_PASSWORD.'],
    ['La construction s’arrête sur vendor-public.pem', 'Clé absente ou modifiée.', 'Vérifiez le paquet (chapitre 4) ; demandez-en un nouveau à l’éditeur.'],
    ['La construction n’accède pas à Internet', 'Proxy d’entreprise.', 'docker compose build --build-arg HTTPS_PROXY=http://proxy:port, ou miroirs internes.'],
    ['« The licence of this Organization is not active »', 'Licence non installée ou expirée.', 'Chapitre 9 ; vérifiez la date de fin.'],
    ['licence-install : « signature is not valid »', 'Fichier modifié ou non émis par l’éditeur.', 'Redemandez le fichier ; ne l’ouvrez pas dans un éditeur de texte qui le reformaterait.'],
    ['licence-install : « Cannot read … (EACCES) »', 'Fichier illisible par le conteneur.', 'chmod 644 licence/*.lic'],
    ['licence-install : « Organization ID … does not exist »', 'Licence émise pour un autre ID.', 'Comparez avec org-list et renvoyez le bon ID à l’éditeur.'],
    ['Changer de plan ou d’add-on est refusé', 'Le plan et les add-ons sont fixés par la licence.', 'Demandez une nouvelle licence à l’éditeur.'],
    ['Caddy n’obtient pas de certificat (TLS_MODE=auto)', 'DNS ou ports 80/443.', 'Vérifiez le DNS et le pare-feu ; docker compose logs caddy ; ou TLS_MODE=internal / files.'],
  ], [3000, 2900, 3746], { size: 16 }),

  H1('13. Assistance'),
  P('Pour contacter l’éditeur, joignez : la version (…/api/health), le résultat de docker compose ps et les 200 dernières lignes de docker compose logs cortexskills. N’envoyez jamais le fichier .env ni ses secrets.'),
];

// =============================================================== GUIDE ÉDITEUR
const PLANS = [['PK-01', 'Offre ingénierie de formation de base', 'PK-01'], ['PK-02', 'Offre réalisation et expérience d’apprentissage', 'PK-02'], ['PK-03', 'Offre évaluation, analytique et ROI', 'PK-03'], ['PK-04', 'Offre conformité et certification', 'PK-04'], ['PK-05', 'Offre talents et mobilité', 'PK-05'], ['PK-06', 'Offre entreprise étendue', 'PK-06'], ['PK-07', 'Offre conseil et diagnostic', 'PK-07'], ['PK-08', 'Offre pilotage stratégique des effectifs et gouvernance', 'PK-08'], ['BND-01', 'Pack Démarrage', 'PK-01, PK-02'], ['BND-02', 'Pack Croissance', 'PK-01 à PK-03'], ['BND-03', 'Pack Entreprise', 'PK-01 à PK-05'], ['BND-04', 'Pack Stratégique', 'PK-01 à PK-06, PK-08'], ['BND-05', 'Suite complète', 'PK-01 à PK-08'], ['SME-ESS', 'Pack PME Essentiel', 'PK-01'], ['SME-GRO', 'Pack PME Croissance', 'PK-01 à PK-03'], ['SME-CMP', 'Pack PME Complet', 'PK-01 à PK-08']];
const ADDONS = [['AD-01', 'Apprentissage immersif (RV/RA/simulation)'], ['AD-02', 'Moteur de personnalisation IA'], ['AD-03', 'Analytique prédictive'], ['AD-04', 'Apprentissage social et collaboratif'], ['AD-05', 'Moteur de ludification'], ['AD-06', 'Curation et agrégation de contenus'], ['AD-07', 'Capture et transfert des savoirs d’experts'], ['AD-08', 'Déploiement multi-sites / multi-entités'], ['AD-09', 'Validation externe du plan de formation'], ['AD-10', 'Maturité managériale'], ['AD-11', 'Bibliothèque de questionnaires et diffusion multicanale']];
const editeur = [
  ...cover({ eyebrow: 'Guide d’installation — Éditeur', title: 'CortexSkills', subtitle: 'Poste de signature, installation locale et en cloud privé / sur site, gestion des licences et paquets clients', meta: [`Version ${V} · ${today}`, 'Interne — AI Value'] }),
  ...tocPage('Table des matières'),

  H1('1. Vue d’ensemble'),
  P(`Tout ce dont l’éditeur a besoin tient dans un seul fichier, ${ED}.zip, sans code source. Il s’utilise sur deux types de machines : votre poste (Linux), qui signe les licences, et les serveurs où CortexSkills s’exécute.`),
  table(['Dans le paquet éditeur', 'Contenu', 'Où l’utiliser'], [
    ['gestion-licences/', 'cslic (licences : créer, lister, afficher, modifier, renouveler, révoquer, supprimer, vérifier), cslic-paquet (paquet d’un client), cslic-sauvegarder (sauvegarde chiffrée).', 'Votre poste uniquement : le poste de signature, qui détient la clé privée.'],
    ['application/', 'CortexSkills pour vos propres installations (tarifs visibles) : Dockerfile, compose, HTTPS, exécutable minifié, scripts installer.sh, licences.sh, sauvegarder.sh, mettre-a-jour.sh.', 'Scénario 1 : votre poste (localhost). Scénario 2 : un serveur de cloud privé ou sur site.'],
    ['paquet-client/', `${PKG}.zip : le paquet du client (sans tarif ni élément commercial), à préparer pour chaque envoi avec cslic-paquet.`, 'Envoyé aux clients avec le Guide d’installation client et le Guide utilisateur.'],
    ['LISEZMOI.txt', 'Les premières commandes.', '—'],
  ], [2300, 4600, 2746], { size: 17 }),
  spacer(),
  callout('Comment l’application est protégée', [
    'Pas de code source : le serveur est livré minifié (noms raccourcis, commentaires et mise en forme supprimés), les écrans web compilés ; ni tests, ni outil de signature, ni carte de sources.',
    'Licence signée Ed25519 : le plan, le nombre d’utilisateurs, les add-ons et la date de fin viennent uniquement du fichier .lic ; un fichier modifié est refusé ; le client ne peut changer ni le plan ni les add-ons, ni dans l’écran ni par la console.',
    'Clé publique figée en lecture seule dans l’image ; aucun réglage ne permet d’en désigner une autre. L’application refuse de démarrer si une clé privée se trouve dans son dossier.',
    'Version client sans élément commercial : aucun prix, aucun devis, pas d’écran Tarifs ; les prix sont retirés jusque dans la base.',
    'Conteneur non privilégié, en lecture seule, port local uniquement.']),
  P('Limite à connaître : un logiciel installé chez un client peut toujours être étudié par un administrateur déterminé disposant de tous les droits sur le serveur. La protection technique se complète par le contrat (licence d’utilisation, interdiction de rétro-ingénierie, droit d’audit, nombre d’utilisateurs, date de fin).', { size: 20, color: C.muted }),

  H1('2. Prérequis'),
  table(['Machine', 'Besoin'], [
    ['Votre poste (signature et scénario 1)', 'Linux 64 bits ; Docker Engine 24+ avec compose (scénario 1 et cslic sans Node.js) ou Node.js 22 (cslic seul) ; unzip, zip, sha256sum, openssl (sudo apt install zip unzip openssl).'],
    ['Serveur (scénario 2)', 'Linux 64 bits, 2 vCPU, 4 Go de RAM, 25 Go de disque (jusqu’à environ 100 utilisateurs actifs ; 4 vCPU / 8 Go au-delà) ; Docker Engine 24+ avec compose ; un nom DNS ; ports 80/443.'],
    ['Pendant la construction de l’image', 'Accès au registre Docker et au registre npm (ou à vos miroirs).'],
  ], W2),
  P(`Décompressez le paquet sur votre poste, par exemple dans ~/cortexskills : unzip ${ED}.zip -d ~/cortexskills.`, { size: 20 }),

  H1('3. Le poste de signature (une seule fois)'),
  ...steps(['Créez la paire de clés et le registre des licences :']),
  ...cmd(`cd ~/cortexskills/${ED}/gestion-licences\n./cslic init`),
  P('cslic enregistre tout dans ~/.cortexskills-editeur : cles/vendor-private.pem (secrète), cles/vendor-public.pem, registre.json, licences/, archives/ et journal.log. Il affiche l’empreinte de la clé publique : notez-la, vos clients peuvent la comparer. cslic utilise Node.js 22 s’il est installé, sinon un conteneur Node.js (Docker) : les commandes sont les mêmes.', { size: 20 }),
  ...steps(['Sauvegardez immédiatement le poste de signature, hors ligne et chiffré :']),
  ...cmd('./cslic-sauvegarder ~/coffre          # demande un mot de passe ; produit cortexskills-editeur-AAAA-MM-JJ.tar.gz.enc\n# restauration : openssl enc -d -aes-256-cbc -pbkdf2 -in <fichier.enc> | tar -xz -C ~'),
  callout('Règles de la clé privée', ['Elle ne quitte jamais votre poste : ni serveur de scénario 2, ni client, ni messagerie, ni dépôt de code.', 'Si elle est perdue, vous ne pouvez plus émettre ni renouveler de licence ; si elle est divulguée, n’importe qui peut en émettre. Dans les deux cas, il faut une nouvelle paire de clés et de nouveaux paquets et licences pour tous les clients.', 'Ne relancez jamais cslic init sur un autre poste : utilisez la sauvegarde.'], C.light),
  P('Ajoutez cslic à votre chemin pour l’appeler de partout : echo \'export PATH="$PATH:$HOME/cortexskills/' + ED + '/gestion-licences"\' >> ~/.bashrc', { size: 20 }),

  H1('4. Scénario 1 — Installation locale (localhost)'),
  P('Sur votre poste, pour démontrer, former ou piloter avec un client, à l’adresse http://localhost:4000, dans le même mode de production sur site que chez un client.'),
  ...cmd(`cd ~/cortexskills/${ED}/application\n./installer.sh local`),
  P('installer.sh demande l’e-mail et le mot de passe de l’administrateur de la plateforme, puis :'),
  ...[
    'vérifie Docker, l’absence de clé privée dans le dossier, et reprend votre clé publique depuis le poste de signature ;',
    'écrit .env avec des secrets générés (PUBLIC_URL=http://localhost:4000, sans HTTPS) ;',
    'construit l’image (docker compose build, 2 à 5 minutes la première fois) et démarre ;',
    'attend que l’application soit en bonne santé, puis efface le mot de passe de .env.',
  ].map(t => bullet(t)),
  P('Ouvrez http://localhost:4000. Arrêt : docker compose stop ; relance : docker compose up -d (dans application/).'),

  H1('5. Scénario 2 — Cloud privé ou sur site (version éditeur)'),
  P('Sur un serveur que vous administrez — cloud privé, serveur sur site, ou VPS — pour un pilote ou une démonstration accessible en HTTPS. Mêmes protections que chez un client ; la signature reste sur votre poste.'),
  H2('5.1 Préparer le serveur'),
  ...cmd('sudo apt update && sudo apt -y upgrade && sudo apt -y install unzip rsync\nsudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable\ncurl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh\nsudo usermod -aG docker $USER && sudo systemctl enable --now docker       # puis reconnectez-vous'),
  P('Créez l’enregistrement DNS : competences.mondomaine.ma → adresse du serveur.', { size: 20 }),
  H2('5.2 Copier l’application et votre clé publique'),
  ...cmd(`# sur votre poste\ncd ~/cortexskills/${ED}\n./gestion-licences/cslic cle-publique application/\nscp -r application utilisateur@serveur:/tmp/cortexskills-${V}\n# sur le serveur\nsudo mkdir -p /opt/cortexskills && sudo chown $USER /opt/cortexskills\nmv /tmp/cortexskills-${V} /opt/cortexskills/ && ln -sfn /opt/cortexskills/cortexskills-${V} /opt/cortexskills/actuel`),
  H2('5.3 Installer'),
  ...cmd('cd /opt/cortexskills/actuel\n./installer.sh serveur competences.mondomaine.ma auto        # ou internal, ou files'),
  table(['Mode de certificat', 'Quand'], [
    ['auto', 'Serveur joignable depuis Internet : certificat Let’s Encrypt obtenu et renouvelé par Caddy.'],
    ['internal', 'Réseau privé sans Internet : autorité interne de Caddy (avertissement du navigateur tant qu’elle n’est pas approuvée).'],
    ['files', 'Certificat de l’entreprise : copiez certs/cert.pem et certs/key.pem avant installer.sh.'],
  ], [2000, 7646], { size: 18 }),
  P('installer.sh répond « CortexSkills fonctionne : https://competences.mondomaine.ma ». Renseignez ensuite les lignes SMTP_* de .env pour que les invitations et relances partent réellement, puis docker compose up -d.', { size: 20 }),
  H2('5.4 Exploiter'),
  ...cmd('crontab -e      # sauvegarde chaque nuit, copiée vers une autre machine :\n30 2 * * * DISTANT=utilisateur@sauvegarde:/cortexskills /opt/cortexskills/actuel/sauvegarder.sh >> $HOME/cortexskills-sauvegarde.log 2>&1'),
  ...[
    'Mise à jour : copiez le dossier application/ de la nouvelle version à côté de l’actuel, puis dans le nouveau dossier : ./mettre-a-jour.sh /opt/cortexskills/actuel ; enfin ln -sfn <nouveau dossier> /opt/cortexskills/actuel.',
    'Restauration : docker compose stop cortexskills, puis docker compose run --rm --no-deps --entrypoint cortexskills-admin cortexskills restore <fichier.db>, puis docker compose start cortexskills.',
    'Plusieurs organisations clientes peuvent être actives sur la même installation : une licence chacune.',
  ].map(t => bullet(t)),

  H1('6. Gestion des licences'),
  P('Une licence suit toujours le même cycle. La signature (création, modification) se fait sur votre poste avec cslic ; l’installation et le retrait se font sur l’installation concernée avec licences.sh (scénarios 1 et 2) ou par le client (cortexskills-admin).'),
  table(['Étape', 'Sur le poste de signature (cslic)', 'Sur l’installation'], [
    ['Demande', '—', './licences.sh organisation … puis ./licences.sh demande <domaine> → Organization ID'],
    ['Créer (C)', 'cslic creer …', './licences.sh installer <fichier.lic>'],
    ['Lire (R)', 'cslic lister · cslic afficher L-0001 · cslic lister --csv', './licences.sh liste · ./licences.sh detail <domaine> · écran Configuration et licence'],
    ['Modifier (U)', 'cslic modifier L-0001 … · cslic renouveler L-0001 --fin …', './licences.sh installer <nouvelle version>'],
    ['Révoquer', 'cslic revoquer L-0001 --motif …', './licences.sh retirer <domaine>'],
    ['Supprimer (D)', 'cslic supprimer L-0001 --oui', '—'],
  ], [1500, 4000, 4146], { size: 16 }),
  H2('6.1 Créer'),
  ...steps([[b('Créer l’organisation sur l’installation '), '(dossier application/ en scénario 1, /opt/cortexskills/actuel en scénario 2) :']]),
  ...cmd('./licences.sh organisation --name "Clinique Exemple" --domain clinique-exemple.ma \\\n  --admin-email admin@clinique-exemple.ma --admin-name "Admin Clinique" --admin-password \'Str0ng#Passw0rd2026\' --lang fr\n./licences.sh demande clinique-exemple.ma          # affiche l’Organization ID'),
  ...steps([[b('Signer sur votre poste :'), '']]),
  ...cmd('cslic creer --societe "Clinique Exemple" --org-id <Organization ID> --plan SME-GRO --utilisateurs 50 \\\n  --fin 2027-12-31 --addons AD-11 --ref CONTRAT-2026-014'),
  table(['Option', 'Signification', 'Règle'], [
    ['--societe', 'Nom du client écrit dans la licence.', 'Obligatoire.'],
    ['--org-id', 'Organization ID affiché par la demande.', 'Exact (format UUID) ; la licence ne vaut que pour cette organisation.'],
    ['--plan', 'Plan (tableau du chapitre 7).', 'Fixe les modules de l’organisation.'],
    ['--utilisateurs', 'Nombre maximal d’utilisateurs actifs.', 'La création d’un utilisateur au-delà est refusée.'],
    ['--fin', 'Date de fin (AAAA-MM-JJ).', 'Alerte 30 jours avant ; lecture seule après.'],
    ['--addons', 'Add-ons (chapitre 7), séparés par des virgules.', 'Facultatif ; seuls ces add-ons sont actifs.'],
    ['--fonctions, --ref, --notes', 'Mentions libres ; référence du contrat ; notes internes.', 'Facultatif.'],
  ], [1800, 3700, 4146], { size: 16 }),
  P('cslic attribue un numéro (L-0001, L-0002…), écrit le fichier ~/.cortexskills-editeur/licences/L-0001_v1_Clinique_Exemple.lic et l’inscrit au registre. Une seule licence active par organisation : pour la changer, modifiez-la.', { size: 20 }),
  ...steps([[b('Installer. '), 'Scénario 1 : directement depuis votre poste. Scénario 2 : copiez d’abord le fichier sur le serveur.']]),
  ...cmd('# scénario 1 (dossier application/)\n./licences.sh installer ~/.cortexskills-editeur/licences/L-0001_v1_Clinique_Exemple.lic\n# scénario 2\nscp ~/.cortexskills-editeur/licences/L-0001_v1_Clinique_Exemple.lic utilisateur@serveur:/opt/cortexskills/actuel/licence/\n./licences.sh installer licence/L-0001_v1_Clinique_Exemple.lic          # sur le serveur'),
  H2('6.2 Lire'),
  ...cmd('cslic lister                     # licences actives : numéro, société, plan, utilisateurs, fin, version, état\ncslic lister --tout --csv registre.csv   # tout l’historique, exporté pour un tableur\ncslic afficher L-0001            # détail et historique (création, modifications, révocation)\n./licences.sh liste              # sur l’installation : licences installées et leur état\n./licences.sh detail clinique-exemple.ma'),
  P('États : ACTIVE, ACTIVE (n j) dans les 30 derniers jours, EXPIRÉE, RÉVOQUÉE. Le journal ~/.cortexskills-editeur/journal.log trace chaque opération (date, utilisateur, licence).', { size: 20 }),
  H2('6.3 Modifier et renouveler'),
  ...cmd('cslic modifier L-0001 --utilisateurs 80                  # plus d’utilisateurs\ncslic modifier L-0001 --plan BND-02 --addons AD-02,AD-11   # autre plan, autres add-ons (--addons "" pour aucun)\ncslic renouveler L-0001 --fin 2028-12-31                  # nouvelle date de fin'),
  P('Chaque modification signe une nouvelle version (L-0001_v2_…lic) et l’inscrit dans l’historique. Installez-la comme la première (./licences.sh installer …, ou par le client) : elle remplace la précédente, sans redémarrage.', { size: 20 }),
  H2('6.4 Révoquer et retirer'),
  ...cmd('cslic revoquer L-0001 --motif "contrat résilié"\n./licences.sh retirer clinique-exemple.ma        # sur l’installation : les utilisateurs ne peuvent plus se connecter'),
  P('Sur vos installations (scénarios 1 et 2), le retrait est immédiat. Chez un client qui installe lui-même, une licence ne peut pas être annulée à distance : elle cesse à sa date de fin. Préférez donc des durées d’un an, renouvelées, et appliquez le contrat. Les données de l’organisation restent dans le volume.', { size: 20 }),
  H2('6.5 Supprimer'),
  ...cmd('cslic supprimer L-0001 --oui            # licence révoquée ou expirée ; --force pour une licence encore active'),
  P('La fiche et toutes les versions du fichier sont déplacées dans ~/.cortexskills-editeur/archives ; la ligne disparaît du registre. Le journal garde la trace de l’opération.', { size: 20 }),
  H2('6.6 Un client qui installe chez lui'),
  ...steps([
    [b('Préparer son paquet '), '(votre clé publique est ajoutée, l’empreinte calculée) :'],
  ]),
  ...cmd(`cd ~/cortexskills/${ED}\n./gestion-licences/cslic-paquet paquet-client/${PKG}.zip ~/envois\n# → ~/envois/${PKG}.zip et ~/envois/${PKG}.zip.sha256`),
  ...steps([
    'Envoyer au client : les deux fichiers ci-dessus, le Guide d’installation client et le Guide utilisateur (Word et PDF).',
    'Recevoir les lignes de sa demande (licence-request) : société et Organization ID.',
    'Signer avec cslic creer (6.1) et lui envoyer le fichier .lic par e-mail. Il l’installe avec licence-install, sans accès de votre part à son serveur.',
    'Renouvellements et changements : cslic modifier / renouveler, puis envoi de la nouvelle version.',
  ]),

  H1('7. Plans et add-ons'),
  table(['Plan', 'Nom', 'Contient'], PLANS, [1300, 5300, 3046], { size: 16 }),
  table(['Add-on', 'Nom'], ADDONS, [1300, 8346], { size: 16 }),
  P('Les tarifs restent visibles dans vos installations (Administration › Tarifs) ; ils n’apparaissent jamais chez les clients.', { size: 20, color: C.muted }),

  H1('8. Dépannage'),
  table(['Ce que vous voyez', 'Cause', 'Que faire'], [
    ['cslic : « Poste de signature non initialisé »', 'cslic init jamais lancé sur ce poste, ou CSLIC_HOME différent.', 'cslic init (premier poste) ou restauration de la sauvegarde chiffrée.'],
    ['cslic init : « Une paire de clés existe déjà »', 'Protection contre l’écrasement des clés.', 'Ne rien faire : la paire existante doit être conservée.'],
    ['cslic creer : « déjà active pour cette organisation »', 'Une seule licence active par organisation.', 'cslic modifier L-xxxx …'],
    ['installer.sh : « Copiez votre vendor-public.pem »', 'Clé publique absente du dossier (scénario 2).', 'cslic cle-publique application/ sur votre poste, puis copie.'],
    ['« The vendor PRIVATE key must never be on a customer server »', 'vendor-private.pem trouvé dans le dossier de l’application.', 'Retirez-le : il ne doit exister que dans ~/.cortexskills-editeur/cles.'],
    ['licence-install : « signature is not valid » partout', 'Paquets construits avec une autre clé publique que celle de cslic.', 'Comparez les empreintes (cslic empreinte) ; refaites les paquets avec cslic-paquet.'],
    ['cslic-paquet : « la commande zip manque »', 'Outils absents.', 'sudo apt install zip unzip'],
  ], [3200, 3000, 3446], { size: 16 }),

  H1('9. Référence des commandes'),
  table(['Où', 'Commande', 'Rôle'], [
    ['Poste', 'cslic init · cslic-sauvegarder <dossier> · cslic empreinte · cslic cle-publique <dossier>', 'Clés et sauvegarde'],
    ['Poste', 'cslic creer · lister · afficher · modifier · renouveler · revoquer · supprimer · verifier', 'Licences (CRUD)'],
    ['Poste', `cslic-paquet paquet-client/${PKG}.zip <dossier>`, 'Paquet d’un client'],
    ['Installation', './installer.sh local · ./installer.sh serveur <dns> [auto|internal|files]', 'Scénarios 1 et 2'],
    ['Installation', './licences.sh organisation · organisations · demande · installer · liste · detail · retirer', 'Organisations et licences installées'],
    ['Installation', './sauvegarder.sh · ./mettre-a-jour.sh <ancien dossier>', 'Exploitation'],
    ['Installation', 'docker compose exec cortexskills cortexskills-admin help', 'Console complète'],
  ], [1600, 5600, 2446], { size: 16 }),
];

fs.mkdirSync(out, { recursive: true });
const write = (body, title, credit, file) => D.Packer.toBuffer(document({ title, credit, sections: [body], lang: 'fr-FR' })).then(buf => { fs.writeFileSync(path.join(out, file), buf); console.log('écrit', file); });
write(client, 'CortexSkills — Guide d’installation client', `CortexSkills ${V} · Guide d’installation client`, 'CortexSkills_Guide_Installation_Client_FR.docx')
  .then(() => write(editeur, 'CortexSkills — Guide d’installation éditeur', `CortexSkills ${V} · Guide d’installation éditeur`, 'CortexSkills_Guide_Installation_Editeur_FR.docx'));
