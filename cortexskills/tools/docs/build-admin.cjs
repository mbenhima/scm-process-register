// Builds the Administration Guide (Word) in English or French. Run: node build-admin.cjs en|fr <outDir>; then topdf.py.
// Procedures are written as a step followed at once by what to type.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, bullet, callout, shot, cover, tocPage, document, spacer, run } = B;
const lang = process.argv[2] === 'fr' ? 'fr' : 'en';
const out = process.argv[3] || path.join(__dirname, '../../deliverables');
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const SHOT = f => path.join(__dirname, 'shots/v110', lang, f + '.png');
const { Paragraph } = D;
const fr = lang === 'fr';
const X = (en, frt) => (fr ? frt : en);
let n = 0;
/** One procedure: [step, typeText?] pairs; the "Type" line sits right under its step. */
function proc(title, items) {
  const ref = 'steps' + ((n++ % 39) + 1); const outp = [new Paragraph({ keepNext: true, spacing: { before: 160, after: 60 }, children: [run(title, { size: 23, bold: true, color: C.dark })] })];
  for (const [step, type] of items) {
    outp.push(B.numbered(step, ref));
    if (type) outp.push(new Paragraph({ spacing: { after: 60 }, indent: { left: 700 }, children: [run(X('Type: ', 'Saisir : '), { size: 21, bold: true, color: C.deep }), run(type, { size: 21 })] }));
  }
  return outp;
}
const fig = (() => { let k = 0; return (f, cap) => shot(SHOT(f), `${X('Figure', 'Figure')} ${++k} — ${cap}`); })();

const body = [];
body.push(...cover({ eyebrow: X('Administration Guide', 'Guide d’administration'), title: 'CortexSkills', subtitle: X('Configure, govern and operate the platform', 'Configurer, gouverner et exploiter la plateforme'), meta: [`Version ${version} · ${today}`, X('Prepared by POWERACT Consulting', 'Préparé par POWERACT Consulting')] }));
body.push(...tocPage(X('Table of Contents', 'Table des matières')));

body.push(H1(X('1. About this guide', '1. À propos de ce guide')),
  P(X('This guide is for the people who configure and run CortexSkills: the platform administrator, who manages every organization, and the organization administrator, who manages one organization. Every procedure is written as a step followed directly by what to type.',
    'Ce guide s’adresse aux personnes qui configurent et exploitent CortexSkills : l’administrateur de la plateforme, qui gère toutes les organisations, et l’administrateur d’organisation, qui en gère une. Chaque procédure est écrite sous la forme d’une étape suivie directement de ce qu’il faut saisir.')),
  B.table([X('Account', 'Compte'), X('Scope', 'Périmètre'), X('Sign in', 'Connexion')], [
    [X('Platform administrator', 'Administrateur de la plateforme'), X('All groups and organizations, licences, reference process design', 'Tous les groupes et organisations, licences, conception de référence'), 'admin@cortexskills.app · Admin#2026'],
    [X('Organization administrator', 'Administrateur d’organisation'), X('One organization: users, configuration, design copy, OBS, AI, documents', 'Une organisation : utilisateurs, configuration, copie de conception, OBS, IA, documents'), 'admin@maghrebhospitalsgr.ma · CortexSkills#2026'],
    [X('Head of L&D', 'Responsable formation'), X('Runs, templates, documents; approves with the HR Director', 'Déroulés, modèles, documents ; approuve avec le DRH'), 'headld@maghrebhospitalsgr.ma · CortexSkills#2026'],
    [X('HR Director', 'DRH'), X('Second approver: releases, documents, gates', 'Second approbateur : versions, documents, jalons'), 'hrd@maghrebhospitalsgr.ma · CortexSkills#2026']], [2600, 4300, 2846]),
  spacer(), callout(X('Two-person rule', 'Règle des deux personnes'), [X('A process-design release, a document and a gate decision are published by a person other than the one who submitted them. Plan two administrators per organization.', 'Une version de conception, un document et une décision de jalon sont publiés par une autre personne que celle qui les a soumis. Prévoyez deux administrateurs par organisation.')]));

body.push(H1(X('2. Organizations, users and access', '2. Organisations, utilisateurs et accès')),
  P(X('The demonstration holds 61 organizations: one large company and one SME for each of the 29 verticals, the multi-sector Horizon Services Group used for the sample documents, and two healthcare showcases (Santé Ora private clinic group and the Centre Hospitalier Régional). Each has a licence, a pack and its add-ons.', 'La démonstration compte 61 organisations : une grande entreprise et une PME pour chacune des 29 verticales, le groupe multisectoriel Horizon Services utilisé pour les documents types, et deux vitrines santé (le groupe de cliniques privées Santé Ora et le Centre Hospitalier Régional). Chacune a une licence, une offre et ses options.')),
  ...proc(X('Create an organization (production: server console)', 'Créer une organisation (production : console du serveur)'), [
    [X('On the server, open a terminal in the server folder.', 'Sur le serveur, ouvrez un terminal dans le dossier server.'), 'cd /opt/cortexskills/server'],
    [X('Create the organization, its licence and its first administrator in one command.', 'Créez l’organisation, sa licence et son premier administrateur en une commande.'), 'npm run -s admin -- org-create --name "Atlas Cold Chain" --domain atlascoldchain.ma --segment SME --sector LOGI --pack SME-CMP --seats 25 --days 365 --lang fr --admin-email dsi@atlascoldchain.ma --admin-name "Youssef Amrani" --admin-password "Atlas#Cold2026x"'],
    [X('Note the Organization ID printed by the console. In OnPrem mode, send it to the vendor to receive the signed licence (licence-request, then licence-install). The Installation Guides describe each mode.', 'Notez l’identifiant d’organisation affiché par la console. En mode OnPrem, envoyez-le à l’éditeur pour recevoir la licence signée (licence-request, puis licence-install). Les guides d’installation décrivent chaque mode.')]]),
  ...proc(X('Create an organization (platform administrator, through the API)', 'Créer une organisation (administrateur de la plateforme, par l’API)'), [
    [X('Sign in with the API as the platform administrator.', 'Connectez-vous à l’API en administrateur de la plateforme.'), 'POST /api/auth/login  {"email":"admin@cortexskills.app","password":"Admin#2026"}'],
    [X('Create the organization with the token received.', 'Créez l’organisation avec le jeton reçu.'), 'POST /api/organizations  {"name":{"en":"Atlas Cold Chain","fr":"Atlas Cold Chain","ar":"أطلس للتبريد"},"sector":"LOGI","segment":"SME","employees":40,"city":"Agadir","email_domain":"atlascoldchain.ma","pack_id":"SME-CMP","seats":25,"starter_team":true,"default_language":"fr"}'],
    [X('The organization receives its functions, governance catalog, AI use cases and checklists; the starter team receives one account per role with the password Welcome#2026, to change at first sign-in.', 'L’organisation reçoit ses fonctions, son catalogue de gouvernance, ses cas d’usage IA et ses check-lists ; l’équipe de départ reçoit un compte par rôle avec le mot de passe Welcome#2026, à changer à la première connexion.')],
    [X('Open Groups & organizations to see it in the tree.', 'Ouvrez Groupes et organisations pour la voir dans l’arborescence.')]]),
  ...proc(X('Add a user and give a role', 'Ajouter un utilisateur et lui donner un rôle'), [
    [X('Open Administration › Users and click New user.', 'Ouvrez Administration › Utilisateurs et cliquez sur Nouvel utilisateur.')],
    [X('Type the identity.', 'Saisissez l’identité.'), X('Name — Salma Tazi; E-mail — salma.tazi@maghrebhospitalsgr.ma; Language — French; Title — Training coordinator', 'Nom — Salma Tazi ; E-mail — salma.tazi@maghrebhospitalsgr.ma ; Langue — Français ; Fonction — Coordinatrice formation')],
    [X('Type a first password, tick the role L&D Planner and click Save. Give the password to the user, who changes it in the profile menu › Change password.', 'Saisissez un premier mot de passe, cochez le rôle Planificateur formation et cliquez sur Enregistrer. Communiquez le mot de passe à l’utilisateur, qui le change dans le menu du profil › Changer le mot de passe.'), 'Welcome#2026']]),
  ...fig('a_users', X('Users of the organization', 'Utilisateurs de l’organisation')),
  ...proc(X('Change your own password', 'Changer votre mot de passe'), [
    [X('Click the profile icon at the top right, then Change password.', 'Cliquez sur l’icône de profil en haut à droite, puis sur Changer le mot de passe.')],
    [X('Type the current password, then the new one twice and click Save.', 'Saisissez le mot de passe actuel, puis le nouveau deux fois et cliquez sur Enregistrer.'), X('At least 12 characters with upper and lower case letters, a digit and a symbol — for example Rabat#Skills2026', 'Au moins 12 caractères avec majuscules, minuscules, un chiffre et un symbole — par exemple Rabat#Skills2026')],
    [X('The change is written in the audit log (User · password.change). A user who forgot the password receives a temporary one from the organization administrator (Administration › Users).', 'Le changement est inscrit au journal d’audit (User · password.change). Un utilisateur qui a oublié son mot de passe en reçoit un temporaire de l’administrateur d’organisation (Administration › Utilisateurs).')]]),
  ...fig('a_password', X('Change password (profile menu)', 'Changer le mot de passe (menu du profil)')),
  ...proc(X('Adjust a permission', 'Ajuster une permission'), [
    [X('Open Administration › Permissions. Rows are permissions, columns are roles.', 'Ouvrez Administration › Permissions. Les lignes sont les permissions, les colonnes les rôles.')],
    [X('Tick documents.approve for the role Quality Manager.', 'Cochez documents.approve pour le rôle Responsable qualité.')],
    [X('Type the justification and confirm. The change is in the audit log.', 'Saisissez la justification et confirmez. Le changement figure au journal d’audit.'), X('Quality Manager approves procedures from 2026.', 'Le responsable qualité approuve les procédures à partir de 2026.')]]),
  ...fig('a_perm', X('Permission matrix', 'Matrice des permissions')));

body.push(H1(X('3. Configuration', '3. Configuration')),
  P(X('Configuration sets the pack, add-ons, compliance standards, quotas and the justification rule. A field marked as governed asks for a justification when it changes.', 'La configuration fixe l’offre, les options, les normes de conformité, les quotas et la règle de justification. Un champ gouverné demande une justification lorsqu’il change.')),
  ...proc(X('Activate a compliance standard', 'Activer une norme de conformité'), [
    [X('Open Administration › Configuration, section Compliance standards.', 'Ouvrez Administration › Configuration, section Normes de conformité.')],
    [X('Tick ISO 21001 and click Save.', 'Cochez ISO 21001 et cliquez sur Enregistrer.'), X('Justification — Certification audit planned in March 2027.', 'Justification — Audit de certification prévu en mars 2027.')],
    [X('Open Reports › Master list › Required by standards: ISO 21001 now lists its documented information.', 'Ouvrez Rapports › Liste maîtresse › Exigé par les normes : ISO 21001 liste désormais ses informations documentées.')]]),
  ...fig('a_config', X('Configuration of the organization', 'Configuration de l’organisation')),
  ...proc(X('Change the pack, add an add-on, renew the licence', 'Changer d’offre, ajouter une option, renouveler la licence'), [
    [X('Open Administration › Configuration & licence. The tiles show the pack, the modules, the AI tier and the licence state.', 'Ouvrez Administration › Configuration et licence. Les tuiles indiquent l’offre, les modules, le niveau d’IA et l’état de la licence.')],
    [X('Pack: in Solution Packs, click Switch on the new pack, read the proration and type the justification.', 'Offre : dans Packs, cliquez sur Changer sur la nouvelle offre, lisez le prorata et saisissez la justification.'), X('Justification — Purchase order PO-2026-118: move to the Enterprise Suite.', 'Justification — Bon de commande BC-2026-118 : passage à la suite complète.')],
    [X('Add-on: tick its box in Add-ons. Data of a deactivated add-on is kept.', 'Option : cochez sa case dans Add-ons. Les données d’une option désactivée sont conservées.')],
    [X('Licence: click Upload licence file in the Licence card and choose the .lic file received from the vendor. The server checks the vendor signature and the Organization ID before accepting it.', 'Licence : cliquez sur Téléverser la licence dans la carte Licence et choisissez le fichier .lic reçu de l’éditeur. Le serveur vérifie la signature de l’éditeur et l’identifiant d’organisation avant de l’accepter.')]]),
  ...proc(X('Connect the e-mail and WhatsApp channels', 'Connecter les canaux e-mail et WhatsApp'), [
    [X('Open Administration › Channels.', 'Ouvrez Administration › Canaux.')],
    [X('In E-mail, fill the SMTP account.', 'Dans E-mail, renseignez le compte SMTP.'), X('Host — smtp.maghrebhospitalsgr.ma; Port — 587; User — formation@maghrebhospitalsgr.ma; Sender — CortexSkills Formation', 'Hôte — smtp.maghrebhospitalsgr.ma ; Port — 587 ; Utilisateur — formation@maghrebhospitalsgr.ma ; Expéditeur — CortexSkills Formation')],
    [X('In WhatsApp, paste the phone-number ID and the access token of the WhatsApp Business account.', 'Dans WhatsApp, collez l’identifiant du numéro et le jeton d’accès du compte WhatsApp Business.')],
    [X('Click Send a test. Without credentials, messages stay in sandbox and are listed as simulated.', 'Cliquez sur Envoyer un test. Sans identifiants, les messages restent en bac à sable et sont listés comme simulés.')]]),
  ...fig('a_channels', X('Channels', 'Canaux')));

body.push(H1(X('4. Process design', '4. Conception des processus')),
  P(X('The reference design (33 end-to-end processes, 54 macro processes, their tasks and steps) is read-only. Your organization edits its own copy: the first change to an element copies it. Every change creates a version; a release freezes the design for projects.', 'La conception de référence (33 processus de bout en bout, 54 macro-processus, leurs tâches et étapes) est en lecture seule. Votre organisation modifie sa copie : la première modification d’un élément le copie. Chaque modification crée une version ; une version de conception fige la conception pour les projets.')),
  ...proc(X('Rename a step', 'Renommer une étape'), [
    [X('Open Process design. In the tree, choose By macro process, open MP-01 and its first task, then click step MP-01.1.', 'Ouvrez Conception des processus. Dans l’arborescence, choisissez Par macro-processus, ouvrez MP-01 et sa première tâche, puis cliquez sur l’étape MP-01.1.')],
    [X('In Details, change the name in each language.', 'Dans Détails, modifiez le nom dans chaque langue.'), X('EN — Record the corporate strategic objectives; FR — Enregistrer les objectifs stratégiques de l’entreprise; AR — تسجيل الأهداف الاستراتيجية للمؤسسة', 'EN — Record the corporate strategic objectives ; FR — Enregistrer les objectifs stratégiques de l’entreprise ; AR — تسجيل الأهداف الاستراتيجية للمؤسسة')],
    [X('Leave the name field. The naming rules are checked: verb first, no generic word, no unexplained abbreviation, no duplicate.', 'Quittez le champ. Les règles de nommage sont vérifiées : verbe en tête, pas de mot générique, pas d’abréviation non expliquée, pas de doublon.')],
    [X('Type the change note and click Save.', 'Saisissez la note de modification et cliquez sur Enregistrer.'), X('Clearer object for the strategy team.', 'Objet plus clair pour l’équipe stratégie.')]]),
  ...fig('a_design', X('Process design: tree and element form', 'Conception des processus : arborescence et formulaire de l’élément')),
  ...proc(X('Compare and restore a version', 'Comparer et restaurer une version'), [
    [X('Open the tab Versions of the element. Tick v0 (reference) and the latest version, then click Compare.', 'Ouvrez l’onglet Versions de l’élément. Cochez v0 (référence) et la dernière version, puis cliquez sur Comparer.')],
    [X('Click Restore on the version to bring back, and type why.', 'Cliquez sur Restaurer sur la version à rétablir, et indiquez pourquoi.'), X('Back to the reference wording after the steering committee.', 'Retour à la formulation de référence après le comité de pilotage.')]]),
  ...proc(X('Publish a release (two people)', 'Publier une version de conception (deux personnes)'), [
    [X('Open the tab Releases and click New release.', 'Ouvrez l’onglet Versions de conception et cliquez sur Nouvelle version.'), X('Name — 2027 design; Note — After the internal audit.', 'Nom — Conception 2027 ; Note — Après l’audit interne.')],
    [X('Click Submit.', 'Cliquez sur Soumettre.')],
    [X('Sign in as the HR Director, open the same release and click Publish.', 'Connectez-vous en DRH, ouvrez la même version et cliquez sur Publier.'), X('Reviewed with the process owners.', 'Revue avec les propriétaires de processus.')],
    [X('New projects run on the published release. To move a running project, open the project and use Migrate release: the preview lists affected open records.', 'Les nouveaux projets s’exécutent sur la version publiée. Pour déplacer un projet en cours, ouvrez le projet et utilisez Migrer la version : l’aperçu liste les enregistrements ouverts concernés.')]]),
  ...fig('a_releases', X('Releases', 'Versions de conception')),
  P(X('Export JSON produces a file that another installation imports with Import; Export Excel gives one sheet per level. The tab Reference changes lists copied elements whose reference changed since the copy.', 'Exporter JSON produit un fichier qu’une autre installation importe avec Importer ; Exporter Excel donne une feuille par niveau. L’onglet Évolutions de la référence liste les éléments copiés dont la référence a changé depuis.')));

body.push(H1(X('5. Organization (OBS) and RACSI', '5. Organisation (OBS) et RACSI')),
  P(X('Functions group roles; a role has a mission and is held by people with dates and an allocation. Holding an OBS role gives no access right. When an assignment ends, open work assigned through the role moves to the remaining holder.', 'Les fonctions regroupent les rôles ; un rôle a une mission et est tenu par des personnes, avec dates et affectation. Tenir un rôle OBS ne donne aucun droit d’accès. Quand une affectation se termine, le travail en cours attribué via le rôle passe au titulaire restant.')),
  ...proc(X('Create a role and assign it', 'Créer un rôle et l’affecter'), [
    [X('Open Governance › Organization (OBS), tab Roles, and click New role.', 'Ouvrez Gouvernance › Organisation (OBS), onglet Rôles, et cliquez sur Nouveau rôle.'), X('Code — OR-31; Role EN — Training coordinator; FR — Coordinateur formation; AR — منسق التكوين; Function — Human Resources; Reports to — OR-02', 'Code — OR-31 ; Rôle EN — Training coordinator ; FR — Coordinateur formation ; AR — منسق التكوين ; Fonction — Ressources humaines ; Rattaché à — OR-02')],
    [X('Click Assign on the new role.', 'Cliquez sur Affecter sur le nouveau rôle.'), X('Person — Salma Tazi; Type — Holder; Allocation — 60; Start — 2026-11-01', 'Personne — Salma Tazi ; Type — Titulaire ; Affectation — 60 ; Début — 2026-11-01')]]),
  ...fig('a_obs', X('Roles and holders', 'Rôles et titulaires')),
  ...proc(X('Set the RACSI of a macro process', 'Définir le RACSI d’un macro-processus'), [
    [X('Open the tab RACSI by process and choose MP-01.', 'Ouvrez l’onglet RACSI par processus et choisissez MP-01.')],
    [X('Click the pencil of a step and pick roles rather than names.', 'Cliquez sur le crayon d’une étape et choisissez des rôles plutôt que des noms.'), X('R — L&D Analyst; A — Head of L&D (exactly one); C — HR Director; I — Finance Manager', 'R — Analyste formation ; A — Responsable formation (un seul) ; C — DRH ; I — Directeur financier')],
    [X('Click Save. The matrix shows Complete when every step has one Accountable.', 'Cliquez sur Enregistrer. La matrice affiche Complet quand chaque étape a un seul responsable final.')]]),
  ...fig('a_racsi', X('RACSI by macro process', 'RACSI par macro-processus')));

body.push(H1(X('6. Project templates and blueprints', '6. Modèles de projet et plans types')),
  P(X('A template’s blueprint says what a project receives. Library templates are read-only; Customize copies one into the organization. Published organization templates are offered first at project creation; the project keeps the template code and version it was created from.', 'Le plan type d’un modèle dit ce que reçoit un projet. Les modèles de bibliothèque sont en lecture seule ; Personnaliser en copie un dans l’organisation. Les modèles publiés de l’organisation sont proposés en premier à la création ; le projet garde le code et la version du modèle utilisé.')),
  ...proc(X('Customize a template', 'Personnaliser un modèle'), [
    [X('Open Process design › Project templates and open Healthcare Providers — full run — AI. Click Customize (copy).', 'Ouvrez Conception des processus › Modèles de projet et ouvrez Établissements de santé — déroulé complet — IA. Cliquez sur Personnaliser (copie).')],
    [X('In Processes and steps, untick a task the organization does not run; click the pencil of a task to rename it in projects.', 'Dans Processus et étapes, décochez une tâche que l’organisation ne réalise pas ; cliquez sur le crayon d’une tâche pour la renommer dans les projets.'), X('Name in projects — Validate the plan with the executive committee', 'Nom dans les projets — Valider le plan avec le comité de direction')],
    [X('Click + on a task to add a custom step.', 'Cliquez sur + d’une tâche pour ajouter une étape personnalisée.'), X('Level — Step; Name — Record the board minutes', 'Niveau — Étape ; Nom — Enregistrer le procès-verbal du conseil')],
    [X('In Reporting plan, click Add manually.', 'Dans Plan de reporting, cliquez sur Ajouter manuellement.'), X('Report — Monthly steering pack; Audience — Executive committee; Frequency — Monthly; Format — PDF; Owner — Head of L&D', 'Rapport — Dossier de pilotage mensuel ; Destinataires — Comité de direction ; Fréquence — Mensuelle ; Format — PDF ; Responsable — Responsable formation')],
    [X('Click Publish. A template with no included step cannot be published. Export it in Word, PDF or Excel from the header.', 'Cliquez sur Publier. Un modèle sans étape incluse ne peut pas être publié. Exportez-le en Word, PDF ou Excel depuis l’en-tête.')]]),
  ...fig('a_bp', X('Blueprint of an organization template', 'Plan type d’un modèle de l’organisation')));

body.push(H1(X('7. Artificial intelligence', '7. Intelligence artificielle')),
  P(X('Without a model, CortexSkills answers with its built-in engine. With an organization model, each AI use case sends its assembled prompt; nothing proposed by the AI is saved before a person validates it.', 'Sans modèle, CortexSkills répond avec son moteur intégré. Avec un modèle d’organisation, chaque cas d’usage envoie son prompt assemblé ; rien de ce que propose l’IA n’est enregistré avant validation par une personne.')),
  ...proc(X('Connect the organization model', 'Connecter le modèle de l’organisation'), [
    [X('Open AI & knowledge › AI settings.', 'Ouvrez IA et connaissances › Paramètres IA.')],
    [X('Choose the provider and the model.', 'Choisissez le fournisseur et le modèle.'), X('Provider — Anthropic; Model — claude-sonnet-5-5', 'Fournisseur — Anthropic ; Modèle — claude-sonnet-5-5')],
    [X('Paste the API key. It is stored encrypted and never shown again.', 'Collez la clé d’API. Elle est stockée chiffrée et jamais réaffichée.')],
    [X('Set the maximum answer length, tick Use this model for the organization and click Save.', 'Réglez la longueur maximale, cochez Utiliser ce modèle pour l’organisation et cliquez sur Enregistrer.'), '1500'],
    [X('Click Test connection. The result names the cause of any failure: key refused, model not found, parameter rejected, rate limit, unreachable.', 'Cliquez sur Tester la connexion. Le résultat nomme la cause de tout échec : clé refusée, modèle introuvable, paramètre rejeté, limite de débit, injoignable.')]]),
  ...fig('a_aiset', X('AI settings', 'Paramètres IA')),
  ...proc(X('Complete a prompt specification and activate the use case', 'Compléter une spécification et activer le cas d’usage'), [
    [X('Open AI use cases and click Specification on AIUC-01.', 'Ouvrez Cas d’usage IA et cliquez sur Spécification pour AIUC-01.')],
    [X('Fill each required field in each language; each field is saved when you leave it.', 'Renseignez chaque champ obligatoire dans chaque langue ; chaque champ est enregistré quand vous le quittez.'), X('Constraints — Never assign a level without evidence; cite the evidence for each level.', 'Contraintes — Ne jamais attribuer un niveau sans preuve ; citer la preuve de chaque niveau.')],
    [X('Click Assembled prompt to check the variables, then Test on this project. The test writes nothing.', 'Cliquez sur Prompt assemblé pour vérifier les variables, puis Tester sur ce projet. Le test n’écrit rien.')],
    [X('Back in AI use cases, tick the use case in the column Organization. Activation is refused while a required field is empty.', 'De retour dans Cas d’usage IA, cochez le cas dans la colonne Organisation. L’activation est refusée tant qu’un champ obligatoire est vide.')]]),
  ...fig('a_spec', X('Prompt specification', 'Spécification du prompt')));

body.push(H1(X('8. Documented information', '8. Informations documentées')),
  P(X('The library holds 37 templates: one per end-to-end deliverable, the Training Engineering Report, the training plan, the audit report and the master list. An organization copy replaces the library template with the same code. The layout applies to every generated document.', 'La bibliothèque compte 37 modèles : un par livrable de bout en bout, le rapport d’ingénierie de formation, le plan de formation, le rapport d’audit et la liste maîtresse. Une copie de l’organisation remplace le modèle de même code. La mise en page s’applique à tous les documents générés.')),
  ...proc(X('Adapt a template', 'Adapter un modèle'), [
    [X('Open Reports › Document templates and click DT-E2E-01.', 'Ouvrez Rapports › Modèles de documents et cliquez sur DT-E2E-01.')],
    [X('Click Copy to my organization. Drafts that use an older version are listed.', 'Cliquez sur Copier dans mon organisation. Les brouillons qui utilisent une version plus ancienne sont listés.')]]),
  ...fig('a_doctpl', X('Document template library', 'Bibliothèque de modèles de documents')),
  ...proc(X('Set the organization layout', 'Définir la mise en page de l’organisation'), [
    [X('Open Reports › Document layout.', 'Ouvrez Rapports › Mise en page des documents.')],
    [X('Choose fonts, sizes, alignment and colors from the allowed lists.', 'Choisissez polices, tailles, alignement et couleurs dans les listes autorisées.'), X('Body font — Open Sans 11 pt; Heading font — Montserrat 16 pt; Alignment — Left; Table header color — 123A5F (Navy); Paper — A4; Margins — 20 mm', 'Police du texte — Open Sans 11 pt ; Police des titres — Montserrat 16 pt ; Alignement — Gauche ; Couleur d’en-tête — 123A5F (Navy) ; Papier — A4 ; Marges — 20 mm')],
    [X('Type the header and footer texts, choose Uploaded image as logo and upload a PNG of 5 MB or less.', 'Saisissez les textes d’en-tête et de pied de page, choisissez Image téléversée pour le logo et téléversez un PNG de 5 Mo maximum.'), X('Header — Maghreb Hospitals Group · Training; Footer — Internal use', 'En-tête — Groupe Hospitalier Maghreb · Formation ; Pied de page — Usage interne')],
    [X('Click Preview as PDF, then Save. Each save is a version.', 'Cliquez sur Aperçu en PDF, puis Enregistrer. Chaque enregistrement est une version.')]]),
  ...fig('a_layout', X('Document layout', 'Mise en page des documents')),
  P(X('Reports › Master list lists every document of the project with version, status, owner and review dates; the tab Required by standards shows, clause by clause, the template and the document that answer each standard.', 'Rapports › Liste maîtresse liste chaque document du projet avec version, statut, propriétaire et dates de revue ; l’onglet Exigé par les normes montre, clause par clause, le modèle et le document qui répondent à chaque norme.')),
  ...fig('a_master', X('Master list', 'Liste maîtresse')));

body.push(H1(X('9. Audits', '9. Audits')),
  ...proc(X('Plan an audit and treat a nonconformity', 'Planifier un audit et traiter une non-conformité'), [
    [X('Open Governance › Audits and click New.', 'Ouvrez Gouvernance › Audits et cliquez sur Nouveau.'), X('Code — AUD-2027-01; Name — Internal audit of the training process; Standard — ISO 9001; Frequency — Annual; Planned date — 2027-03-15', 'Code — AUD-2027-01 ; Nom — Audit interne du processus formation ; Norme — ISO 9001 ; Fréquence — Annuelle ; Date planifiée — 2027-03-15')],
    [X('Save. The next date is computed from the frequency.', 'Enregistrez. La prochaine date est calculée depuis la fréquence.')],
    [X('Open the audit and add a finding.', 'Ouvrez l’audit et ajoutez un constat.'), X('Grade — Minor; Requirement — ISO 9001 §7.2; Statement — Two trainers have no evidence of competence on file.', 'Niveau — Mineure ; Exigence — ISO 9001 §7.2 ; Énoncé — Deux formateurs n’ont pas de preuve de compétence au dossier.')],
    [X('Click Raise the action. The corrective action enters the action process; the finding moves to Action planned.', 'Cliquez sur Créer l’action. L’action corrective entre dans le processus des actions ; le constat passe à Action planifiée.')]]),
  ...fig('a_audits', X('Audit programmes and grading scale', 'Programmes d’audit et échelle de notation')));

body.push(H1(X('10. Data protection and operations', '10. Protection des données et exploitation')),
  B.table([X('Topic', 'Sujet'), X('Rule in CortexSkills', 'Règle dans CortexSkills')], [
    [X('Retention of responses', 'Conservation des réponses'), X('Questionnaire responses older than the retention period (5 years by default, record Retention policy) are anonymized every day: identity and free text removed, scores kept.', 'Les réponses plus anciennes que la durée de conservation (5 ans par défaut, enregistrement Politique de conservation) sont anonymisées chaque jour : identité et texte libre supprimés, notes conservées.')],
    [X('Anonymized questionnaires', 'Questionnaires anonymisés'), X('Tick Anonymized on the questionnaire: identity is stripped before storage and no link to the respondent is kept.', 'Cochez Anonymisé sur le questionnaire : l’identité est retirée avant stockage et aucun lien vers le répondant n’est conservé.')],
    [X('Audit log', 'Journal d’audit'), X('Append-only: every change with user, time, before and after values and justification.', 'En ajout seul : chaque modification avec utilisateur, heure, valeurs avant et après et justification.')],
    [X('Backups', 'Sauvegardes'), X('Daily copy of the database while the service runs; retention set in the server configuration; Backup now on demand (platform administrator).', 'Copie quotidienne de la base pendant le service ; conservation réglée dans la configuration serveur ; Sauvegarder maintenant à la demande (administrateur plateforme).')],
    [X('Keys and secrets', 'Clés et secrets'), X('Model keys and channel tokens are sealed on the server; only the last characters are shown.', 'Les clés de modèle et jetons de canaux sont scellés sur le serveur ; seuls les derniers caractères sont affichés.')]], [2800, 6946]),
  spacer(),
  ...proc(X('Purge expired responses now', 'Purger maintenant les réponses expirées'), [
    [X('Set the period: open Portfolio › Business records › RetentionPolicy and create the record.', 'Fixez la durée : ouvrez Portefeuille › Enregistrements métier › RetentionPolicy et créez l’enregistrement.'), X('Questionnaire years — 5; Mode — anonymize', 'Années questionnaires — 5 ; Mode — anonymize')],
    [X('The purge runs every day. To run it now, call the API as organization administrator.', 'La purge s’exécute chaque jour. Pour la lancer maintenant, appelez l’API en administrateur d’organisation.'), 'POST /api/retention/purge  {"mode":"anonymize"}'],
    [X('Check the count in the audit log entry RetentionPolicy · purge.', 'Vérifiez le nombre dans l’entrée du journal RetentionPolicy · purge.')]]),
  ...fig('a_audit', X('Audit log', 'Journal d’audit')),
  H2(X('Traceability', 'Traçabilité')),
  P(X('Administration › Traceability lists the 580 requirements of the Dynamic Apps Standard SRS v1.10 with their status and evidence: 558 met, 10 partial and 12 left to the production hosting (sizing, uptime, encryption at rest, residency).', 'Administration › Traçabilité liste les 580 exigences du SRS Dynamic Apps Standard v1.10 avec leur statut et leur preuve : 558 satisfaites, 10 partielles et 12 relevant de l’hébergement de production (dimensionnement, disponibilité, chiffrement au repos, résidence).')),
  ...fig('a_trace', X('Requirement traceability', 'Traçabilité des exigences')));

body.push(H1(X('11. Production deployment', '11. Déploiement en production')),
  P(X('The demonstration runs in development mode with shared passwords. A production installation is created empty with npm run init and is administered from the server console (npm run admin). Two Installation Guides give every step: CortexSkills — SaaS Mode, and CortexSkills — Dedicated Cloud & On-Premises.', 'La démonstration fonctionne en mode développement avec des mots de passe partagés. Une installation de production est créée vide avec npm run init et s’administre depuis la console du serveur (npm run admin). Deux guides d’installation donnent chaque étape : CortexSkills — Mode SaaS, et CortexSkills — Cloud dédié et sur site.')),
  B.table([X('Mode', 'Mode'), X('Where', 'Où'), X('Licence', 'Licence'), X('Pack activation', 'Activation des offres')], [
    ['SaaS (DEPLOYMENT_MODE=saas)', X('One installation at the provider, many organizations', 'Une installation chez le fournisseur, plusieurs organisations'), X('Issued by the provider: npm run admin -- licence', 'Émise par le fournisseur : npm run admin -- licence'), X('Console (licence, addon) or Configuration & licence screen', 'Console (licence, addon) ou écran Configuration et licence')],
    [X('Dedicated cloud / On-Prem (DEPLOYMENT_MODE=onprem)', 'Cloud dédié / sur site (DEPLOYMENT_MODE=onprem)'), X('One installation per customer: public cloud, private cloud or own datacenter', 'Une installation par client : cloud public, cloud privé ou centre de données'), X('Vendor-signed file: licence-request → vendor signs → licence-install', 'Fichier signé par l’éditeur : licence-request → signature → licence-install'), X('Signed licence (pack, users, date); add-ons and standards on screen', 'Licence signée (offre, utilisateurs, date) ; options et normes à l’écran')]], [2400, 2600, 2600, 2146]),
  spacer(),
  B.table([X('Console command', 'Commande console'), X('Purpose', 'Rôle')], [
    ['npm run secrets', X('New random secrets for server/.env', 'Nouveaux secrets aléatoires pour server/.env')],
    ['npm run init', X('Empty production database and platform administrator', 'Base de production vide et administrateur de la plateforme')],
    ['npm run admin -- org-create / org-list', X('Create and list customer organizations', 'Créer et lister les organisations clientes')],
    ['npm run admin -- licence / addon', X('SaaS: issue, renew, resize a licence; add-ons', 'SaaS : émettre, renouveler, redimensionner une licence ; options')],
    ['npm run admin -- licence-request / licence-install', X('OnPrem: request and install the signed licence', 'OnPrem : demander et installer la licence signée')],
    ['npm run admin -- user-create / password / platform-admin', X('Users, password reset, platform administrators', 'Utilisateurs, réinitialisation de mot de passe, administrateurs de la plateforme')],
    ['npm run backup', X('Back up the database now', 'Sauvegarder la base maintenant')]], [4400, 5346]),
  spacer(),
  callout(X('Safety at start-up', 'Sécurité au démarrage'), [X('With NODE_ENV=production the server refuses to start while a secret is missing or weak, the public address is not HTTPS, CORS is open, the database holds the demonstration data, or (OnPrem) the vendor public key is missing or the vendor private key is present. It lists each problem with its fix.', 'Avec NODE_ENV=production, le serveur refuse de démarrer tant qu’un secret est absent ou faible, que l’adresse publique n’est pas en HTTPS, que CORS est ouvert, que la base contient les données de démonstration, ou (OnPrem) que la clé publique de l’éditeur manque ou que sa clé privée est présente. Il liste chaque problème avec sa correction.')]));

const doc = document({ title: `CortexSkills — ${X('Administration Guide', 'Guide d’administration')}`, credit: `CortexSkills ${version} · ${X('Administration Guide', 'Guide d’administration')}`, sections: [body], lang: fr ? 'fr-FR' : 'en-GB' });
const file = path.join(out, `CortexSkills_Admin_Guide_${lang.toUpperCase()}.docx`);
D.Packer.toBuffer(doc).then(b => { fs.writeFileSync(file, b); console.log('written', file, Math.round(b.length / 1024) + ' KB'); });
