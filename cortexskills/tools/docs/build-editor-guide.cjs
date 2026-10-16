// Builds the editor user guide (Word, with a table of contents), in French or English: how AI Value uses CortexSkills
// on its own installations (editor edition, prices shown) — reference organizations, customer organizations and users,
// offers, prices and quotations, licences on screen, delivering a project, platform settings, audit and backups.
// Screenshots: shots/editor-en and shots/editor-fr (tools/qa/shoot-editor.mjs on an installed editor runtime).
// Run: node build-editor-guide.cjs fr|en <outDir>, then python3 topdf.py <file>.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, bullet, code, callout, table, shot, cover, tocPage, document, spacer } = B;
const L = process.argv[2] === 'en' ? 'en' : 'fr'; const X = (f, e) => (L === 'fr' ? f : e);
const out = process.argv[3] || path.join(__dirname, '../../deliverables');
const V = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const SH = f => path.join(__dirname, `shots/editor-${L}`, f + '.png');
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/seed/data/catalog.json'), 'utf8'));
const fw = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/seed/content/framework.json'), 'utf8'));
const REF = JSON.parse(fs.readFileSync(path.join(__dirname, 'reference-orgs.json'), 'utf8'));
let n = 0; const steps = items => { const ref = 'esteps' + (n++ || ''); return items.map(t => B.numbered(t, ref)); };
const cmd = s => s.split('\n').map(l => code(l));
const b = t => ({ text: t, bold: true });
const W2 = [3000, 6646];
const usd = v => (L === 'fr' ? `${String(v).replace('.', ',')} $` : `$${v}`);
const nm = v => (Array.isArray(v) ? v[L === 'fr' ? 1 : 0] || v[0] : v && typeof v === 'object' ? v[L] || v.en || v.fr : v);
// French names of the offers (the catalog holds the English ones).
const FRN = { 'PK-01': 'Offre ingénierie de formation de base', 'PK-02': 'Offre réalisation et expérience d’apprentissage', 'PK-03': 'Offre évaluation, analytique et ROI', 'PK-04': 'Offre conformité et certification', 'PK-05': 'Offre talents et mobilité', 'PK-06': 'Offre entreprise étendue', 'PK-07': 'Offre conseil et diagnostic', 'PK-08': 'Offre pilotage stratégique des effectifs et gouvernance',
  'Starter Bundle': 'Pack Démarrage', 'Growth Bundle': 'Pack Croissance', 'Enterprise Bundle': 'Pack Entreprise', 'Strategic Bundle': 'Pack Stratégique', 'Full Suite': 'Suite complète' };
const GU = X('Guide_Utilisateur_Customer_CortexSkills_FR', 'User_Guide_Customer_CortexSkills_EN');
const GE = X('Guide_Installation_Runtime_Editor_Linux_Windows_CortexSkills_FR', 'Installation_Guide_Runtime_Editor_Linux_Windows_CortexSkills_EN');
const SME_USERS = { 'SME-ESS': 25, 'SME-GRO': 50, 'SME-CMP': 100 };

const body = [
  ...cover({ eyebrow: X('Guide utilisateur — Côté éditeur', 'User Guide — Editor side'), title: 'CortexSkills', subtitle: X('Utiliser CortexSkills sur vos installations : organisations de référence, organisations clientes et utilisateurs, offres, tarifs et devis, licences, conduite des projets, réglages de la plateforme, audit et sauvegardes', 'Using CortexSkills on your installations: reference organizations, customer organizations and users, offers, prices and quotations, licences, running projects, platform settings, audit and backups'), meta: [`Version ${V} · ${today}`, X('Interne — AI Value', 'Internal — AI Value')] }),
  ...tocPage(X('Table des matières', 'Table of Contents')),

  // ------------------------------------------------------------------ 1
  H1(X('1. À propos de ce guide', '1. About this guide')),
  P(X('Ce guide s’adresse aux équipes d’AI Value qui utilisent CortexSkills sur leurs propres installations (scénario a : cloud privé ou sur site ; scénario b : localhost sous Windows) : l’administrateur de la plateforme, les consultants qui conduisent les projets avec les clients et les commerciaux qui préparent les offres. L’installation elle-même et la signature des licences sont décrites dans le guide d’installation éditeur.', 'This guide is for the AI Value teams who use CortexSkills on their own installations (scenario a: private cloud or on-premises; scenario b: localhost on Windows): the platform administrator, the consultants who run projects with customers and the sales people who prepare offers. The installation itself and licence signing are described in the editor installation guide.')),
  table([X('Document', 'Document'), X('Contenu', 'Content')], [
    [GE, X('Installer l’exécutable éditeur (Linux, Windows), le poste de signature et la gestion des licences (cslic).', 'Install the editor runtime (Linux, Windows), the signing workstation and licence management (cslic).')],
    [X('Ce guide', 'This guide'), X('Utiliser l’application en version éditeur.', 'Use the application in the editor edition.')],
    [GU, X('Le déroulé complet d’un projet sur un cas réel (clinique privée), étape par étape ; il vaut aussi pour vos installations.', 'The complete run of a project on a real case (private clinic), step by step; it also applies to your installations.')],
  ], W2, { size: 18 }),
  H2(X('1.1 Version éditeur et version client', '1.1 Editor edition and customer edition')),
  table([X('Élément', 'Item'), X('Version éditeur (ce guide)', 'Editor edition (this guide)'), X('Version client', 'Customer edition')], [
    [X('Écran Offres et tarifs, calculateur de prix', 'Packs & pricing screen, price calculator'), X('Oui', 'Yes'), X('Non (page indisponible)', 'No (page unavailable)')],
    [X('Prix dans le catalogue, règles de packaging', 'Prices in the catalog, packaging rules'), X('Oui', 'Yes'), X('Retirés jusque dans la base', 'Removed down to the database')],
    [X('Gestionnaire de licences (cslic)', 'Licence manager (cslic)'), X('Oui, sur le poste de signature', 'Yes, on the signing workstation'), X('Non', 'No')],
    [X('Licence signée obligatoire', 'Signed licence required'), X('Oui', 'Yes'), X('Oui', 'Yes')],
    [X('Données de référence (61 organisations)', 'Reference data (61 organizations)'), X('Oui', 'Yes'), X('Oui', 'Yes')],
    [X('Processus, tâches, étapes, IA, documents', 'Processes, tasks, steps, AI, documents'), X('Identiques', 'Identical'), X('Identiques', 'Identical')],
  ], [3600, 3000, 3046], { size: 18 }),

  // ------------------------------------------------------------------ 2
  H1(X('2. Se connecter et se repérer', '2. Sign in and find your way')),
  P(X('Ouvrez l’adresse de l’installation (https://competences.mondomaine.ma en scénario a, http://localhost:4000 en scénario b). La page de connexion ne mentionne aucun compte : il n’existe aucun compte de démonstration. Au départ, seul l’administrateur de la plateforme (ADMIN_EMAIL du fichier .env) peut se connecter.', 'Open the address of the installation (https://skills.mydomain.com in scenario a, http://localhost:4000 in scenario b). The sign-in page names no account: no demonstration account exists. At first, only the platform administrator (ADMIN_EMAIL of the .env file) can sign in.')),
  ...shot(SH('e01_signin'), X('La page de connexion', 'The sign-in page'), 460),
  table([X('Zone', 'Area'), X('Usage', 'Use')], [
    [X('Barre du haut', 'Top bar'), X('Recherche globale (Ctrl K), langue (EN · FR · AR), alertes, assistant IA, votre compte (mot de passe, déconnexion).', 'Global search (Ctrl K), language (EN · FR · AR), alerts, AI assistant, your account (password, sign out).')],
    [X('Sélecteurs de contexte', 'Context selectors'), X('Le groupe ou l’organisation, puis le projet sur lesquels portent les écrans. L’administrateur de la plateforme passe d’une organisation à l’autre.', 'The group or organization, then the project the screens apply to. The platform administrator moves from one organization to another.')],
    [X('Menu de gauche', 'Left menu'), X('Favoris, Accueil, Portefeuille, Conception des processus, Gouvernance, IA et connaissances, Documents, Administration. Le filtre en haut du menu retrouve une entrée.', 'Favorites, Home, Portfolio, Process design, Governance, AI & knowledge, Documents, Administration. The filter at the top of the menu finds an entry.')],
  ], W2, { size: 18 }),
  ...shot(SH('e02_home'), X('Le tableau de bord de l’organisation choisie', 'The dashboard of the organization chosen'), 520),

  // ------------------------------------------------------------------ 3
  H1(X('3. Les organisations de référence', '3. The reference organizations')),
  P(X(`L’installation contient ${REF.orgs.length} organisations de référence : une grande entreprise et une PME pour chacun des secteurs, plus des groupes multisectoriels. Chacune a deux projets complets (Numérique et IA), avec tous leurs processus, tâches, étapes, questionnaires, plans, documents et indicateurs, en anglais, français et arabe. Elles servent de vitrine et de modèle : démonstrations, formation de vos consultants, exemples de livrables.`, `The installation holds ${REF.orgs.length} reference organizations: a large company and an SME for each sector, plus multi-sector groups. Each has two complete projects (Digital and AI), with all their processes, tasks, steps, questionnaires, plans, documents and indicators, in English, French and Arabic. They are a showcase and a model: demonstrations, training of your consultants, sample deliverables.`)),
  ...steps(X(['Portefeuille › Groupes et organisations : l’arbre des groupes, de leurs organisations et de leurs projets (vue Arbre ou Tableau).', 'Cliquez sur « Ouvrir » à côté d’une organisation, puis sur un projet : le projet s’ouvre sur sa progression par phase.', 'Dans un projet, ouvrez un processus puis une tâche : ses étapes, leurs saisies, « Votre résultat » et l’onglet Documents montrent ce qu’un projet terminé contient.'],
    ['Portfolio › Groups and organizations: the tree of the groups, their organizations and their projects (Tree or Table view).', 'Click “Open” next to an organization, then a project: the project opens on its progress by phase.', 'In a project, open a process then a task: its steps, their entries, “Your result” and the Documents tab show what a completed project contains.'])),
  ...shot(SH('e03_reference_orgs'), X('Portefeuille › Groupes et organisations', 'Portfolio › Groups and organizations'), 520),
  ...shot(SH('e04_reference_project'), X('Un projet de référence terminé', 'A completed reference project'), 520),
  callout(X('À retenir', 'Keep in mind'), X(['Les personnes des organisations de référence ne peuvent pas se connecter : leurs comptes sont désactivés.', 'Les organisations de référence n’ont pas de licence et ne comptent dans aucune licence.', 'Ne conduisez pas un vrai projet client dans une organisation de référence : créez l’organisation du client (chapitre 4).'],
    ['The people of the reference organizations cannot sign in: their accounts are disabled.', 'The reference organizations have no licence and count in no licence.', 'Do not run a real customer project in a reference organization: create the customer’s organization (chapter 4).'])),

  // ------------------------------------------------------------------ 4
  H1(X('4. Organisations clientes et utilisateurs', '4. Customer organizations and users')),
  H2(X('4.1 Créer l’organisation d’un client', '4.1 Create a customer’s organization')),
  P(X('Sur vos installations, l’organisation d’un client se crée avec la console d’installation, puis reçoit sa licence (chapitre 6). La commande crée aussi le premier administrateur de l’organisation :', 'On your installations, a customer’s organization is created with the installation console, then receives its licence (chapter 6). The command also creates the organization’s first administrator:')),
  ...cmd(`cortexskills admin org-create --name "${X('Clinique Exemple', 'Example Clinic')}" --domain ${X('clinique-exemple.ma', 'example-clinic.com')} \\\n  --admin-email admin@${X('clinique-exemple.ma', 'example-clinic.com')} --admin-name "${X('Admin Clinique', 'Clinic Admin')}" --admin-password 'Str0ng#Passw0rd2026' \\\n  --lang ${L} --sector HCPR --segment SME --employees 95 --city Marrakech\ncortexskills admin licence-request --org ${X('clinique-exemple.ma', 'example-clinic.com')}`),
  P(X('Sur un serveur Linux, préfixez par sudo -u cortexskills ./ ; sous Windows, utilisez .\\cortexskills.cmd. Le code secteur (--sector) relie l’organisation à sa verticale : modèles de projet, compétences, thèmes IA et questionnaires du secteur.', 'On a Linux server, prefix with sudo -u cortexskills ./; on Windows, use .\\cortexskills.cmd. The sector code (--sector) links the organization to its vertical: the sector’s project templates, competencies, AI themes and questionnaires.'), { size: 20, color: C.muted }),
  H2(X('4.2 Utilisateurs et rôles', '4.2 Users and roles')),
  P(X('Administration › Utilisateurs : l’administrateur de l’organisation crée les comptes de ses équipes, leur attribue un ou plusieurs rôles (responsable formation, analyste, DRH, manager…) et les désactive à leur départ. Le nombre d’utilisateurs actifs est limité par la licence ; un utilisateur au-delà est refusé avec un message qui nomme la limite.', 'Administration › Users: the organization administrator creates the accounts of their teams, gives them one or more roles (head of L&D, analyst, HR director, manager…) and disables them when they leave. The number of active users is limited by the licence; a user beyond it is refused with a message naming the limit.')),
  ...shot(SH('e06_users'), X('Administration › Utilisateurs', 'Administration › Users'), 500),
  P(X('Un mot de passe oublié se réinitialise depuis cet écran, ou par la console : cortexskills admin password --email … --password …. Administration › Permissions montre ce que chaque rôle peut voir et faire.', 'A forgotten password is reset from this screen, or with the console: cortexskills admin password --email … --password …. Administration › Permissions shows what each role can see and do.'), { size: 20 }),

  // ------------------------------------------------------------------ 5
  H1(X('5. Offres, tarifs et devis', '5. Offers, prices and quotations')),
  P(X('Administration › Offres et tarifs n’existe que dans la version éditeur. Il présente les packs, les bundles, les packs PME et les add-ons avec leurs prix, et un calculateur : choisissez une offre et un nombre d’utilisateurs, l’écran donne le montant mensuel (prix de base + utilisateurs au-delà de l’inclus × prix du dépassement).', 'Administration › Packs & pricing exists only in the editor edition. It shows the packs, bundles, SME packs and add-ons with their prices, and a calculator: choose an offer and a number of users, the screen gives the monthly amount (base price + users beyond those included × overage price).')),
  ...shot(SH('e05_pricing'), X('Administration › Offres et tarifs : le calculateur', 'Administration › Packs & pricing: the calculator'), 520),
  H2(X('5.1 Packs', '5.1 Packs')),
  table(['Pack', X('Nom', 'Name'), X('Prix / mois', 'Price / month'), X('Utilisateurs inclus', 'Users included'), X('Dépassement / utilisateur', 'Overage / user')], cat.packs.map(p => [p.id, X(FRN[p.id] || p.name, p.name), usd(p.price), String(p.includedUsers ?? '—'), usd(p.overage)]), [1100, 4300, 1500, 1400, 1346], { size: 16 }),
  H2(X('5.2 Bundles et packs PME', '5.2 Bundles and SME packs')),
  table([X('Offre', 'Offer'), X('Contenu', 'Content'), X('Remise', 'Discount'), X('Prix / mois', 'Price / month')], cat.bundles.map(x => [X(FRN[x.name] || x.name, x.name), x.packsText, `${x.discount} %`.replace(' %', L === 'fr' ? ' %' : '%'), usd(x.price)]), [2600, 3900, 1300, 1846], { size: 16 }), spacer(),
  table([X('Pack PME', 'SME pack'), X('Prix / mois', 'Price / month'), X('Utilisateurs inclus', 'Users included'), X('Dépassement / utilisateur', 'Overage / user')], (fw.smePacks || []).map(s => [`${s.id} — ${nm(s.name) || ''}`, usd(s.price), String(SME_USERS[s.id] ?? '—'), usd(s.overage)]), [4000, 1800, 1900, 1946], { size: 16 }),
  P(X(`Chaque bundle inclut 500 utilisateurs. Add-ons : de ${usd(Math.min(...cat.addOns.map(a => a.price)))} à ${usd(Math.max(...cat.addOns.map(a => a.price)))} par mois (liste complète dans l’écran et au chapitre 8 du guide d’installation éditeur). Un minimum de 5 utilisateurs s’applique aux packs PME.`, `Each bundle includes 500 users. Add-ons: from ${usd(Math.min(...cat.addOns.map(a => a.price)))} to ${usd(Math.max(...cat.addOns.map(a => a.price)))} per month (full list on the screen and in chapter 8 of the editor installation guide). A minimum of 5 users applies to SME packs.`), { size: 20 }),
  ...shot(SH('e05b_pricing_more'), X('Les bundles et le registre des offres, plus bas dans la même page', 'The bundles and the offer records, further down the same page'), 480),
  callout(X('Ce que voient les clients', 'What customers see'), X(['Aucun prix, aucun devis et aucune règle commerciale n’apparaissent dans la version client : la page Offres et tarifs y est indisponible.', 'Le client voit son plan, ses utilisateurs, ses add-ons et sa date de fin dans Administration › Configuration et licence.'],
    ['No price, no quotation and no commercial rule appear in the customer edition: the Packs & pricing page is unavailable there.', 'The customer sees their plan, users, add-ons and end date in Administration › Configuration and licence.'])),

  // ------------------------------------------------------------------ 6
  H1(X('6. Les licences dans l’application', '6. Licences in the application')),
  P(X('Une licence est signée sur votre poste de signature (cslic, guide d’installation éditeur, chapitre 6) pour l’Organization ID d’une organisation. Elle s’installe sur l’installation concernée de deux façons :', 'A licence is signed on your signing workstation (cslic, editor installation guide, chapter 6) for an organization’s Organization ID. It is installed on the installation concerned in two ways:')),
  ...steps(X([[b('Console : '), 'cortexskills admin licence-install --file licence/<fichier>.lic (sans redémarrage).'], [b('Écran : '), 'l’administrateur de l’organisation ouvre Administration › Configuration et licence, puis « Téléverser le fichier de licence ».']],
    [[b('Console: '), 'cortexskills admin licence-install --file licence/<file>.lic (no restart).'], [b('Screen: '), 'the organization administrator opens Administration › Configuration and licence, then “Upload licence file”.']])),
  ...shot(SH('e07_licence'), X('Administration › Configuration et licence d’une organisation cliente sous licence', 'Administration › Configuration and licence of a licensed customer organization'), 520),
  table([X('Zone de l’écran', 'Screen area'), X('Ce qu’elle montre', 'What it shows')], [
    [X('Pack · Modules · Niveau IA · Licence', 'Pack · Modules · AI tier · Licence'), X('Le plan de la licence, le nombre de modules ouverts, le niveau d’IA (Assistif, ou Assistif et Augmenté) et l’état de la licence avec les jours restants.', 'The licence’s plan, the number of modules opened, the AI tier (Assistive, or Assistive and Augmented) and the state of the licence with the days left.')],
    [X('Utilisation des quotas', 'Usage against quotas'), X('Projets, nœuds d’organigramme, cas d’usage IA personnalisés, questionnaires du mois : utilisé et limite de l’offre.', 'Projects, OBS nodes, custom AI use cases, questionnaires this month: used and limit of the offer.')],
    [X('Licence', 'Licence'), X('Déploiement, statut, plan, utilisateurs maximum, expiration, add-ons actifs.', 'Deployment, status, plan, maximum users, expiry, active add-ons.')],
  ], W2, { size: 18 }),
  P(X('Le plan, les utilisateurs et les add-ons ne se modifient pas dans l’écran : un changement est une nouvelle version de la licence (cslic modifier ou renouveler), installée de la même façon. Trente jours avant la fin, les administrateurs sont prévenus ; après la fin, l’organisation passe en lecture seule.', 'The plan, users and add-ons are not changed on screen: a change is a new version of the licence (cslic update or renew), installed the same way. Thirty days before the end, the administrators are warned; after the end, the organization becomes read-only.'), { size: 20 }),

  // ------------------------------------------------------------------ 7
  H1(X('7. Conduire un projet avec un client', '7. Run a project with a customer')),
  P(X('Les projets se conduisent de la même façon dans la version éditeur et dans la version client. Le déroulé complet, avec chaque étape et ce qu’il faut saisir, est dans le guide utilisateur client (cas réel d’une clinique privée). Les points essentiels :', 'Projects are run the same way in the editor and customer editions. The complete run, with each step and what to type, is in the customer user guide (real case of a private clinic). The essentials:')),
  ...steps(X([[b('Créer le projet : '), 'Portefeuille › Nouveau projet, onglet « Depuis le catalogue » : Nom, Focus (Numérique, IA), Description, puis Modèle. La liste des modèles contient ceux de l’organisation, de son secteur, les modèles universels et ceux des autres secteurs.'], [b('Suivre les phases : '), 'chaque processus de bout en bout (E2E) a ses tâches et ses étapes ; les jalons (G1 à G5) se décident « Go » par le président du comité de pilotage.'], [b('Remplir une étape de trois façons : '), 'saisie manuelle ou collage d’un tableau, « Depuis le modèle », ou « Proposer des lignes avec l’IA » ; chaque proposition est relue et validée par une personne.'], [b('Produire les documents : '), 'chaque processus génère ses documents (DOCX, PDF, XLSX) depuis les données saisies, en version datée.']],
    [[b('Create the project: '), 'Portfolio › New project, “From the catalog” tab: Name, Focus (Digital, AI), Description, then Template. The template list holds those of the organization, of its sector, the universal templates and those of the other sectors.'], [b('Follow the phases: '), 'each end-to-end (E2E) process has its tasks and steps; the gates (G1 to G5) are decided “Go” by the steering committee chair.'], [b('Fill a step in three ways: '), 'manual entry or pasting a table, “From the template”, or “Propose rows with AI”; each proposal is read and validated by a person.'], [b('Produce the documents: '), 'each process generates its documents (DOCX, PDF, XLSX) from the data entered, as a dated version.']])),
  ...shot(SH('e08_new_project'), X('Nouveau projet, dans l’organisation cliente', 'New project, in the customer organization'), 500),
  H2(X('7.1 Les modèles de projet', '7.1 Project templates')),
  P(X('Conception des processus › Modèles de projet : les modèles publiés (universels ou par secteur, parcours complet ou PME). « Enregistrer comme modèle » sur un projet terminé en crée un nouveau, à publier pour le proposer à la création.', 'Process design › Project templates: the published templates (universal or per sector, full or SME track). “Save as template” on a completed project creates a new one, to publish so it is offered at creation.'), { size: 20 }),
  ...shot(SH('e09_project_templates'), X('Conception des processus › Modèles de projet', 'Process design › Project templates'), 460),

  // ------------------------------------------------------------------ 8
  H1(X('8. Réglages de la plateforme', '8. Platform settings')),
  H2(X('8.1 Canaux : e-mail et WhatsApp', '8.1 Channels: e-mail and WhatsApp')),
  P(X('Administration › Canaux : le serveur d’e-mail (SMTP) et le compte WhatsApp Business de l’organisation, chacun en « Bac à sable » (messages conservés sans partir, pour répéter une démonstration) ou « En production ». « Envoyer un test » confirme que le fournisseur accepte les messages. Les valeurs SMTP_* et WHATSAPP_* du fichier .env servent par défaut aux organisations qui n’ont pas leur propre réglage.', 'Administration › Channels: the organization’s mail server (SMTP) and WhatsApp Business account, each in “Sandbox” (messages kept without leaving, to rehearse a demonstration) or “Live”. “Send a test” confirms the provider accepts the messages. The SMTP_* and WHATSAPP_* values of the .env file are used by default for organizations without their own setting.')),
  ...shot(SH('e10_channels'), X('Administration › Canaux', 'Administration › Channels'), 480),
  H2(X('8.2 IA', '8.2 AI')),
  P(X('IA et connaissances › Réglages IA : le fournisseur et le modèle utilisés par les cas d’usage IA de l’organisation, avec une clé d’API chiffrée. Sans modèle activé, le moteur intégré produit les propositions. Les données personnelles des répondants ne sont jamais envoyées au fournisseur ; chaque proposition est validée par une personne et journalisée (IA et connaissances › Utilisation).', 'AI & knowledge › AI settings: the provider and model used by the organization’s AI use cases, with an encrypted API key. Without an enabled model, the built-in engine produces the proposals. The respondents’ personal data is never sent to the provider; each proposal is validated by a person and logged (AI & knowledge › Usage).')),
  ...shot(SH('e11_ai_settings'), X('IA et connaissances › Réglages IA', 'AI & knowledge › AI settings'), 460),
  H2(X('8.3 Modèles de documents', '8.3 Document templates')),
  P(X('Documents › Modèles : la bibliothèque des modèles de documents (cahier des charges, rapports de campagne, plan de formation, évaluation…). Documents › Mise en page applique la charte de l’organisation (logo, couleurs, polices) à tous les documents générés.', 'Documents › Templates: the library of document templates (scope of work, campaign reports, training plan, evaluation…). Documents › Layout applies the organization’s charter (logo, colours, fonts) to every generated document.')),
  ...shot(SH('e12_document_templates'), X('Documents › Modèles', 'Documents › Templates'), 460),

  // ------------------------------------------------------------------ 9
  H1(X('9. Audit, traçabilité et sauvegardes', '9. Audit, traceability and backups')),
  P(X('Administration › Journal d’audit : chaque action d’administration et chaque décision (création d’utilisateur, licence installée, jalon décidé, document publié) avec sa date, son auteur et ses valeurs avant et après. Administration › Traçabilité relie les exigences, les processus et les enregistrements.', 'Administration › Audit log: every administration action and every decision (user created, licence installed, gate decided, document published) with its date, author and before and after values. Administration › Traceability links requirements, processes and records.')),
  ...shot(SH('e13_audit_log'), X('Administration › Journal d’audit', 'Administration › Audit log'), 460),
  P(X('Administration › Sauvegardes et santé : l’état du service, les sauvegardes quotidiennes et à la demande (« Sauvegarder maintenant ») et la procédure de restauration. Copiez les sauvegardes hors du serveur chaque jour (guide d’installation éditeur, 4.4).', 'Administration › Backups & health: the state of the service, the daily and on-demand backups (“Back up now”) and the restore procedure. Copy the backups off the server every day (editor installation guide, 4.4).')),
  ...shot(SH('e14_backups'), X('Administration › Sauvegardes et santé', 'Administration › Backups & health'), 460),

  // ------------------------------------------------------------------ 10
  H1(X('10. Bonnes pratiques', '10. Good practices')),
  ...X([
    'Une organisation par client, une licence par organisation ; ne mélangez jamais les données de deux clients dans une organisation.',
    'Démonstrations : utilisez les organisations de référence, ou une organisation de démonstration sous licence courte, avec les canaux en « Bac à sable ».',
    'Avant un pilote : réglez les canaux en « Production », vérifiez PUBLIC_URL (les liens envoyés doivent s’ouvrir sur un téléphone) et testez un envoi.',
    'Ne communiquez jamais un prix depuis une installation client : les prix n’y existent pas ; préparez le devis sur votre installation éditeur.',
    'Changez de mot de passe à la première connexion et gardez au moins deux administrateurs par organisation (règle des deux personnes pour publier).',
  ], [
    'One organization per customer, one licence per organization; never mix the data of two customers in one organization.',
    'Demonstrations: use the reference organizations, or a demonstration organization under a short licence, with the channels in “Sandbox”.',
    'Before a pilot: set the channels to “Live”, check PUBLIC_URL (the links sent must open on a phone) and test a send.',
    'Never quote a price from a customer installation: prices do not exist there; prepare the quotation on your editor installation.',
    'Change your password at first sign-in and keep at least two administrators per organization (two-person rule to publish).',
  ]).map(t => bullet(t)),

  // ------------------------------------------------------------------ 11
  H1(X('11. Dépannage', '11. Troubleshooting')),
  table([X('Ce que vous voyez', 'What you see'), X('Cause', 'Cause'), X('Que faire', 'What to do')], X([
    ['« The licence of this Organization is not active »', 'Licence non installée, expirée ou retirée.', 'Installez la licence (chapitre 6) ; vérifiez sa date de fin.'],
    ['La création d’un utilisateur est refusée', 'Nombre maximal d’utilisateurs de la licence atteint.', 'Désactivez un compte inutile ou émettez une nouvelle version de la licence (plus d’utilisateurs).'],
    ['Un module n’apparaît pas dans le menu', 'Le plan de la licence ne l’inclut pas.', 'Changez de plan ou ajoutez l’add-on par une nouvelle version de la licence.'],
    ['Un compte d’une organisation de référence est refusé', 'Ces comptes ne peuvent pas se connecter.', 'Connectez-vous comme administrateur de la plateforme.'],
    ['La page Offres et tarifs est indisponible', 'Vous êtes sur une installation client.', 'Utilisez votre installation éditeur.'],
    ['Les messages ne partent pas', 'Canal en « Bac à sable » ou non activé.', 'Administration › Canaux : « Activé », « En production », puis « Envoyer un test ».'],
  ], [
    ['“The licence of this Organization is not active”', 'Licence not installed, expired or removed.', 'Install the licence (chapter 6); check its end date.'],
    ['Creating a user is refused', 'Maximum number of users of the licence reached.', 'Disable an unused account or issue a new version of the licence (more users).'],
    ['A module does not appear in the menu', 'The licence’s plan does not include it.', 'Change the plan or add the add-on with a new version of the licence.'],
    ['An account of a reference organization is refused', 'These accounts cannot sign in.', 'Sign in as platform administrator.'],
    ['The Packs & pricing page is unavailable', 'You are on a customer installation.', 'Use your editor installation.'],
    ['Messages do not leave', 'Channel in “Sandbox” or not enabled.', 'Administration › Channels: “Enabled”, “Live”, then “Send a test”.'],
  ]), [3200, 3000, 3446], { size: 17 }),
];

fs.mkdirSync(out, { recursive: true });
const file = X('Guide_Utilisateur_Editor_CortexSkills_FR.docx', 'User_Guide_Editor_CortexSkills_EN.docx');
D.Packer.toBuffer(document({ title: X('CortexSkills — Guide utilisateur, côté éditeur', 'CortexSkills — User Guide, editor side'), credit: X(`CortexSkills ${V} · Guide utilisateur — éditeur`, `CortexSkills ${V} · User Guide — editor`), sections: [body], lang: X('fr-FR', 'en-GB') }))
  .then(buf => { fs.writeFileSync(path.join(out, file), buf); console.log(X('écrit', 'written'), file); });
