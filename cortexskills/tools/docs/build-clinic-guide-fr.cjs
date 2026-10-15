// Builds the French user guide of the private-clinic simple case (Clinique Al Amal) from clinic-case.json — the data
// of a real run of the case through the application (run-clinic-case.mjs) — and its screenshots (shots/clinic-fr).
// Every table of a Multi-Entry step has, as its first row, the exact French column titles of the application, so it
// is copied in Word and pasted in the step's table. Run: node build-clinic-guide-fr.cjs <outDir>; then topdf.py.
const path = require('path'); const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, H3, bullet, callout, table, cover, tocPage, document, spacer, shot, code, CONTENT_LAND } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'clinic-case.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const db = new DatabaseSync(path.join(__dirname, '../../server/data/cortexskills.db'), { readOnly: true });
const kpi = Object.fromEntries(db.prepare("SELECT id, data FROM catalog WHERE kind='kpi'").all().map(r => [r.id, JSON.parse(r.data).name?.fr || r.id]));
const SH = f => path.join(__dirname, 'shots/clinic-fr', f + '.png');
let list = 0; const steps = items => { const ref = 'steps' + (list++ % 199 || ''); return items.map(t => B.numbered(t, ref)); };
const b = t => ({ text: t, bold: true });
const today = new Date().toISOString().slice(0, 10).split('-').reverse().join('/');
const task = uft => d.tasks.find(t => t.uft === uft);
const W2 = [2800, 6846];
const PASS = 'CortexSkills#2026';

// Value of a cell as typed in the application (KPI by code and name).
const cellText = (f, v) => (f?.type === 'kpi' && /^KPI-\d+$/.test(String(v)) ? `${v} (${kpi[v] || ''})` : v);
const colW = (f, i, rows) => { const len = Math.max(String(f.label).length, ...rows.map(r => String(r[i] || '').length)); const base = { boolean: 1000, date: 1200, number: 1100 }[f.type]; return base ? Math.max(base, f.label.length * 120 + 260) : Math.min(3400, Math.max(1100, len * 70)); };
const KIND = { inline: 'Tableau à coller', 'master-detail': 'Tableau à coller', form: 'Formulaire', sectioned: 'Formulaire', system: 'Étape automatique', module: 'Panneau de travail' };
const stepHead = s => P([{ text: `Étape ${s.id} · `, bold: true, color: C.azure }, { text: s.name, bold: true, color: C.navy }, { text: `   ${KIND[s.pattern] || s.kindLabel} · ${s.role}`, color: C.muted, size: 18 }], { before: 200, after: 80, keepNext: true });
function stepBlock(s, extra = {}) {
  const outB = [stepHead(s)];
  if (s.pattern === 'system') outB.push(P('Rien à saisir : la plateforme réalise cette étape quand les étapes précédentes sont terminées. Vérifiez son résultat, puis cliquez sur « Terminer l’étape ».', { size: 20, color: C.muted, after: 120 }));
  else if (s.pattern === 'form' || s.pattern === 'sectioned') {
    outB.push(P('Saisissez ces valeurs dans le formulaire de l’étape ; chaque champ est enregistré quand vous le quittez. Une liste se choisit en un clic (le choix est enregistré par ce même clic).', { size: 20, after: 60, keepNext: true }));
    outB.push(table(['Champ', 'Valeur à saisir ou à choisir'], (s.values || []).map((v, i) => { const f = s.fields[i] || {}; const lbl = f.required ? { text: `${v.label} (obligatoire)`, bold: true } : v.label; const how = f.type === 'select' || f.type === 'person' ? ' — liste' : f.type === 'multi' ? ' — cases à cocher' : f.type === 'date' ? ' — date' : ''; return [lbl, (cellText(f, v.value) || '—') + (v.value ? how : '')]; }), W2, { size: 18 }), spacer(80));
  } else if (s.pattern === 'inline' || s.pattern === 'master-detail') {
    const req = s.fields.filter(f => f.required).map(f => f.label); const rows = (s.rows || []).map(r => r.map((v, i) => String(cellText(s.fields[i], v) ?? '')));
    const wide = s.fields.length > 9; const block = [];
    block.push(P([`Copiez ce tableau (poignée ✥ en haut à gauche, Ctrl+C) et collez-le dans le tableau de l’étape (Ctrl+V), puis « Appliquer ».`, req.length ? { text: ` Colonnes obligatoires : ${req.join(', ')}.`, color: C.muted } : ''], { size: 20, after: 60, keepNext: true }));
    if (wide) block.unshift(P([{ text: `Étape ${s.id} · ${s.name}`, bold: true, color: C.navy }, { text: ' — tableau large, présenté en paysage', color: C.muted }], { size: 20, after: 60 }));
    block.push(table(s.fields.map(f => f.label), rows, s.fields.map((f, i) => colW(f, i, rows)), { size: wide ? 16 : s.fields.length > 7 ? 15 : s.fields.length > 5 ? 16 : 17, ...(wide ? { width: CONTENT_LAND } : {}) }));
    const lists = s.fields.filter(f => (f.type === 'select' || f.type === 'multi') && f.options.length && f.options.length <= 6);
    if (lists.length) block.push(P(`Listes : ${lists.map(f => `${f.label} = ${f.options.map(o => o.label).join(' | ')}${f.type === 'multi' ? ' (plusieurs choix, séparés par des virgules)' : ''}`).join(' ; ')}.`, { size: 16, color: C.muted, before: 40, after: 120 }));
    else block.push(spacer(100));
    if (wide) { outB.push(P('Le tableau à coller est sur la page suivante, en paysage.', { size: 20, after: 60 })); outB.push({ landscapeBlock: block }); } else outB.push(...block);
  }
  if (extra.after) outB.push(...extra.after);
  return outB;
}
const info = t => table(['Rubrique', 'Contenu'], [['Qui · Approbateur', `${t.owner || '—'} · ${t.accountable || '—'}`], ['Compte à utiliser', t.actor], ['Entrée → Sortie', `${t.input || '—'} → ${t.outputName || '—'}`], [b('Ce qu’il faut faire'), t.guidance || '—']], [2600, 7046], { size: 18 });
const closeTask = t => [P([b('Clôturer la tâche : '), 'le champ « Votre résultat » est déjà rédigé à partir de vos saisies ; relisez-le, puis cliquez sur « Terminer ». Passez à la tâche suivante avec « Tâche suivante ».'], { size: 19, color: C.ink, before: 60 }),
  t.output ? P(`Votre résultat (proposé par l’application) : ${String(t.output).split('\n').slice(0, 3).join(' / ')}${String(t.output).split('\n').length > 3 ? ' …' : ''}`, { size: 16, italics: true, color: C.muted, after: 160 }) : spacer(80)];
const taskBlock = (t, extras = {}) => [H3(`${t.uft} — ${t.name}`), info(t), ...t.steps.flatMap(s => stepBlock(s, extras[s.id] || {})), ...(extras.shots || []), ...closeTask(t)];

const body = [];
body.push(...cover({ eyebrow: 'Guide utilisateur · Cas réel', title: 'CortexSkills — Clinique Al Amal', subtitle: 'Un premier cycle complet de développement des compétences IA dans une clinique privée : quoi saisir, quoi coller, quoi vérifier — avec de vraies questions, de vrais messages et de vraies réponses',
  meta: [`Version ${version} · ${today}`, 'Préparé par AI Value'], appLogo: path.join(__dirname, '../../web/public/cortexskills-logo.png') }));
body.push(...tocPage('Table des matières'));

// ---------------------------------------------------------------- 1
const nTasks = d.tasks.length; const nSteps = d.tasks.reduce((a, t) => a + t.steps.length, 0);
body.push(H1('1. Le cas et ce guide'),
  P(`Ce guide déroule un cas simple et complet : la ${d.org.name}, clinique privée de ${d.org.city} (${d.org.employees} salariés), lance son premier projet de compétences en intelligence artificielle, centré sur le tri des patients aux urgences et l’aide à la lecture d’images. Le projet va du cahier des charges à l’évaluation de l’efficacité des formations.`),
  P([b('Tout est réel. '), `Ce guide a été produit en déroulant ce cas dans l’application CortexSkills ${version} : chaque valeur, chaque question, chaque message et chaque capture d’écran vient de ce déroulé. Les questions du questionnaire sont celles que les répondants reçoivent ; les messages partent réellement par e-mail et par WhatsApp dès que les canaux sont configurés (chapitre 2) ; les répondants ouvrent leur lien personnel, répondent et leurs réponses arrivent dans l’application.`]),
  H2('1.1 Le parcours'),
  table(['Phase', 'Processus', 'Tâches', 'Jalon à la fin'], d.phases.map(p => [`Phase ${p.phase}`, `${p.e2e} — ${p.name}`, String(p.tasks), (d.gates.find(g => g.phase === p.phase) || {}).gate || '—']), [1200, 5400, 900, 2146], { size: 18 }),
  P(`Au total : ${d.phases.length} processus, ${nTasks} tâches, ${nSteps} étapes, et les jalons de fin de phase. Le modèle de projet « ${d.project.template.name} » ne garde que ces six processus : c’est ce qui fait de ce cas un cas simple.`, { size: 20 }),
  H2('1.2 Les comptes du cas'),
  table(['Rôle dans le cas', 'Nom', 'E-mail de connexion'], [['Responsable formation (pilote du projet)', d.users.find(u => /headld/.test(u.email))?.name, 'headld@cliniquealamal.ma'], ['Analyste formation', d.users.find(u => /analyst/.test(u.email))?.name, 'analyst@cliniquealamal.ma'], ['DRH, présidente du comité de pilotage (jalons)', d.users.find(u => /hrd@/.test(u.email))?.name, 'hrd@cliniquealamal.ma'], ['Administrateur (canaux, intégrations)', d.users.find(u => /admin@/.test(u.email))?.name, 'admin@cliniquealamal.ma']], [3600, 2400, 3646]),
  P(`Mot de passe de démonstration : ${PASS}. Dans votre installation, utilisez vos propres comptes ; les rôles sont les mêmes.`, { size: 20, before: 60 }),
  H2('1.3 Les quatre façons de remplir une étape'),
  table(['Type d’étape', 'Ce que vous faites'], [['Tableau à coller', 'Plusieurs lignes du même type : copiez le tableau du guide (sa première ligne contient les titres exacts des colonnes) et collez-le dans le tableau de l’étape ; l’Aperçu du collage vérifie tout avant « Appliquer ».'], ['Formulaire', 'Une seule fiche (une décision, une revue) : choisissez ou saisissez chaque valeur. Les dates du jour, votre nom et l’objet de l’étape sont proposés d’office.'], ['Panneau de travail', 'L’étape travaille directement sur l’objet réel : le questionnaire (questions, répondants, messages, réponses) ou le document à générer.'], ['Étape automatique', 'La plateforme la réalise ; vous vérifiez son résultat.']], [2600, 7046]),
  callout('Avant de coller', ['Mettez l’interface en français (bouton FR) : les dates JJ/MM/AAAA et les nombres « 3,5 » sont lus selon la langue de l’interface.', 'Les tableaux de ce guide peuvent être modifiés avant d’être copiés : remplacez les valeurs par celles de votre clinique.']),
);

// ---------------------------------------------------------------- 2
body.push(H1('2. Préparer l’application (administrateur)'),
  P('Trois réglages rendent le cas réel : l’adresse publique de l’application (pour que les liens fonctionnent sur un téléphone), le serveur d’e-mail et le compte WhatsApp Business. Ils se font une fois, avec le compte administrateur.'),
  H2('2.1 L’adresse publique de l’application'),
  P('Les liens envoyés aux répondants sont construits avec l’adresse publique du serveur. Une adresse « localhost » ne s’ouvre que sur l’ordinateur du serveur : pour que les répondants ouvrent leur lien depuis leur téléphone, l’application doit être joignable par Internet (ou par le réseau Wi-Fi de la clinique) et son adresse déclarée dans le fichier de configuration du serveur :'),
  code('PUBLIC_URL=https://competences.cliniquealamal.ma'),
  P('Redémarrez ensuite le serveur. Pour un essai sur le réseau local, une adresse comme http://192.168.1.20:4000 convient pour les téléphones connectés au même Wi-Fi.', { size: 20 }),
  H2('2.2 L’e-mail (serveur SMTP)'),
  P('Menu Administration › Canaux (e-mail, WhatsApp), carte « E-mail ». Cochez « Activé », choisissez le mode « En production — envoyés par le fournisseur », puis renseignez :'),
  table(['Champ', 'Microsoft 365', 'Google Workspace / Gmail', 'Autre fournisseur'], [['Serveur SMTP', 'smtp.office365.com', 'smtp.gmail.com', 'celui du fournisseur'], ['Port', '587', '587', '587 (ou 465)'], ['TLS dès la connexion (port 465)', 'Non coché', 'Non coché', 'Coché si port 465'], ['Nom d’utilisateur', 'formation@cliniquealamal.ma', 'votre.compte@gmail.com', 'l’identifiant SMTP'], ['Mot de passe', 'mot de passe du compte (ou mot de passe d’application)', 'mot de passe d’application (16 caractères)', 'mot de passe SMTP'], ['Expéditeur (From)', 'Clinique Al Amal <formation@cliniquealamal.ma>', 'Clinique Al Amal <votre.compte@gmail.com>', 'l’adresse autorisée'], ['Adresse de réponse', 'formation@cliniquealamal.ma', 'votre.compte@gmail.com', 'facultatif']], [2400, 2500, 2500, 2246], { size: 17 }),
  P('Cliquez sur « Enregistrer », saisissez votre adresse dans « Destinataire du test », puis « Envoyer un test » : le message « Le fournisseur a accepté le message. » confirme que l’e-mail part réellement. Le mot de passe est chiffré et n’est plus jamais affiché.', { size: 20 }),
  H2('2.3 WhatsApp (API WhatsApp Business Cloud de Meta)'),
  ...steps(['Dans le Meta Business Manager, créez (ou utilisez) un compte WhatsApp Business et ajoutez le numéro de la clinique.', 'Dans l’application Meta pour développeurs, notez l’« ID du numéro de téléphone » et l’« ID du compte WhatsApp Business », et créez un jeton d’accès permanent (utilisateur système).', 'Créez un modèle de message de catégorie « Utilitaire », en français, par exemple « cortexskills_invitation », avec ce corps : « Bonjour {{1}}, {{2}} vous invite à répondre au questionnaire « {{3}} » : {{4}} (réponse avant le {{5}}). » Attendez son approbation par Meta.', 'Dans CortexSkills, carte « WhatsApp » : cochez « Activé », mode « En production », puis renseignez les champs ci-dessous et « Enregistrer ».', 'Déclarez chez Meta l’URL du webhook affichée sur la carte (…/api/public/whatsapp/webhook) avec le « Jeton de vérification du webhook » : les statuts de remise et les réponses reviennent dans l’application.', 'Envoyez un test vers votre propre numéro.']),
  table(['Champ', 'Valeur'], [['ID du numéro de téléphone', 'l’identifiant donné par Meta (une suite de chiffres)'], ['ID du compte Business', 'l’identifiant du compte WhatsApp Business'], ['Nom du modèle approuvé', 'cortexskills_invitation'], ['Code langue du modèle', 'fr'], ['Jeton de vérification du webhook', 'un mot de passe de votre choix, saisi aussi chez Meta'], ['Indicatif pays par défaut', '212'], ['URL de base de l’API', 'https://graph.facebook.com/v21.0 (valeur par défaut)'], ['Jeton d’accès', 'le jeton permanent (chiffré, plus jamais affiché)'], ['Secret de l’application', 'le secret de l’application Meta (signature du webhook)']], W2, { size: 18 }),
  callout('Règle de WhatsApp à connaître', ['Le premier message envoyé par la clinique doit utiliser un modèle approuvé : c’est pourquoi le nom du modèle est demandé. Un texte libre n’est accepté que dans les 24 heures qui suivent un message du répondant.', 'Les variables du modèle sont remplies dans cet ordre : {{1}} nom du répondant, {{2}} organisation, {{3}} titre du questionnaire, {{4}} lien personnel, {{5}} date limite.'], C.bg),
  H2('2.4 Bac à sable ou production'),
  P('Tant qu’un canal est en mode « Bac à sable », les messages sont composés et conservés dans la boîte d’envoi (Administration › Canaux, et le journal du questionnaire), sans partir. C’est utile pour une répétition. Passez en « En production » pour le vrai déroulé : les mêmes messages partent alors chez le fournisseur.', { size: 20 }),
  ...shot(SH('34_channels'), 'Administration › Canaux : e-mail et WhatsApp, leur mode et la boîte d’envoi', 560),
  H2('2.5 L’annuaire des salariés (facultatif)'),
  P('Si la clinique dispose d’un SIRH, l’annuaire se met à jour depuis un export. Administration › Intégrations, ligne « HRIS / HCM » : « Tester » vérifie la connexion, « Synchroniser (fichier SIRH) » lit un fichier CSV dont la première ligne porte les noms de champs du SIRH. Le compte rendu indique les salariés créés, mis à jour et les fiches rejetées avec leur motif (poste inconnu, matricule manquant).', { size: 20 }),
  table(['employee_id', 'full_name', 'email', 'phone', 'position', 'department'], [['EMP-0101', 'Samira Ouazzani', 'infirmiere.urgences@cliniquealamal.ma', '+212661000007', 'Opérateur — Soins cliniques et infirmiers', 'Soins cliniques et infirmiers'], ['EMP-0102', 'Rachid Amrani', 'radiologie@cliniquealamal.ma', '+212661000008', 'Opérateur — Soins cliniques et infirmiers', 'Soins cliniques et infirmiers']], [1300, 1600, 2600, 1500, 2300, 2000], { size: 15 }),
  ...shot(SH('35_integrations'), 'Administration › Intégrations : tester une connexion, synchroniser le SIRH', 560),
);

// ---------------------------------------------------------------- 3
const inv = (task('UFT-33-06')?.steps[0] || {}).invitations || [];
const STK = (task('UFT-32-06')?.steps[0] || {}).rows || [];
body.push(H1('3. Les répondants du cas'),
  P('Le questionnaire est envoyé aux huit personnes ci-dessous, saisies à l’étape MP-53.8. Leurs adresses et numéros sont fictifs : pour un essai réel, remplacez-les avant de coller le tableau (chapitre 5, tâche UFT-32-06) par des adresses et des numéros que vous recevez vous-même ou dont les titulaires ont donné leur accord.'),
  table(['Nom', 'E-mail du cas', 'Téléphone (WhatsApp)', 'Niveau', 'Canal préféré'], STK.map(r => [r[0], r[1], r[2], r[5], r[7]]), [2300, 3100, 1900, 1200, 1200], { size: 17 }),
  callout('Recevoir les huit messages vous-même', ['Avec une adresse Gmail, ajoutez « +mot » avant l’arobase : prenom.nom+dg@gmail.com, prenom.nom+infirmiere@gmail.com… Tous ces messages arrivent dans votre boîte, chacun avec son lien personnel.', 'Pour WhatsApp, utilisez des numéros de collègues volontaires, au format international (+212 6…).']),
);

// ---------------------------------------------------------------- 4
body.push(H1('4. Créer le projet'),
  P('Connectez-vous comme Responsable formation (headld@cliniquealamal.ma), interface en FR. Menu Portefeuille › Nouveau projet, onglet « Depuis le catalogue ». Les champs se remplissent dans cet ordre :'),
  table(['Champ', 'Valeur à saisir ou à choisir'], [['Nom', d.project.name], ['Focus', 'IA'], ['Description', 'Premier cycle complet de développement des compétences en IA de la clinique : triage aux urgences et aide à la lecture d’images.'], ['Modèle', `${d.project.template.name} (groupe « Votre organisation »)`], ['Parcours', 'Utiliser le parcours recommandé']], W2),
  P('La liste « Modèle » contient toute la bibliothèque publiée : les modèles de votre organisation, ceux de votre secteur, les modèles universels et ceux des autres secteurs. Cliquez enfin sur « Créer le projet ».', { size: 20 }),
  ...shot(SH('01_new_project'), 'Nouveau projet : Nom, Focus, Description, puis Modèle', 560),
  ...shot(SH('02_template_list'), 'La liste des modèles publiés, groupés', 560),
  P('Le projet s’ouvre avec ses six processus et les jalons G1, G3 et G5. Ouvrez un processus, puis une tâche : le panneau de la tâche s’ouvre à droite, avec ses étapes, « Votre résultat » et les boutons « Tâche précédente » / « Tâche suivante ».', { size: 20 }),
);

// ---------------------------------------------------------------- 5 E2E-32
const T32 = d.tasks.filter(t => t.e2e === 'E2E-32');
body.push(H1('5. Phase 1 — Le cahier des charges (E2E-32)'), P('Neuf tâches fixent le périmètre de la mission et enregistrent les parties prenantes — qui deviennent les répondants du questionnaire.'));
for (const t of T32) {
  const ex = {};
  if (t.uft === 'UFT-32-01') ex.shots = shot(SH('10_scope_group_org'), 'UFT-32-01 : le formulaire avec ses listes, et « Votre résultat » rédigé depuis les étapes', 420);
  if (t.uft === 'UFT-32-06') ex.shots = [callout('Ce qui se passe quand vous collez ce tableau', ['Chaque ligne crée la fiche de la partie prenante (registre des parties prenantes) avec son e-mail, son téléphone, son niveau et son canal préféré.', 'Ces fiches sont celles que l’étape de diffusion (UFT-33-06) propose comme répondants. Une Directrice générale ou un Directeur général reçoit le formulaire « Direction générale », les niveaux MS et MO le formulaire « Management », le niveau OP le formulaire « Collaborateur ».']), ...shot(SH('15_stakeholders_b'), 'UFT-32-06 : les huit parties prenantes enregistrées', 420)];
  if (t.uft === 'UFT-32-08') ex.shots = [P('L’étape MP-53.10 est un panneau de travail : cliquez sur « Générer une nouvelle version » pour produire le cahier des charges (modèle DT-E2E-32). Chaque génération crée une version datée ; chaque version se télécharge en DOCX, PDF ou XLSX, et le rapport standard RPT-033 se télécharge en PDF, DOCX ou XLSX. L’onglet « Documents » de chaque tâche donne les documents de son processus.', { size: 19 }), ...shot(SH('16_publish_doc_b'), 'MP-53.10 : le document généré, sa version, ses formats', 420)];
  body.push(...taskBlock(t, ex));
}

// ---------------------------------------------------------------- 6 E2E-33
const T33 = d.tasks.filter(t => t.e2e === 'E2E-33'); const q = d.questionnaire;
const nItems = f => f.sections.reduce((a, s) => a + (s.items.length || (s.columns.length ? 1 : 0)), 0);
body.push(H1('6. Phase 1 — La campagne de questionnaires (E2E-33)'),
  P(`Douze tâches mènent la campagne de bout en bout, sur le questionnaire réel du projet : « ${q.label} ». Les étapes en panneau de travail montrent le questionnaire lui-même — ses questions, ses répondants, les messages envoyés et les réponses reçues.`));
for (const t of T33) {
  const ex = {}; const s0 = t.steps[0];
  if (t.uft === 'UFT-33-01') ex.shots = [P('À la clôture de l’étape, le questionnaire du projet est créé avec les trois formulaires choisis ; le lien « Ouvrir le questionnaire » apparaît dans l’étape.', { size: 19 }),
    table(['Formulaire', 'Population', 'Sections', 'Questions et tableaux'], q.forms.map(f => [f.name, { DG: 'Direction générale', Management: 'Management', Member: 'Collaborateurs' }[f.population] || f.population, String(f.sections.length), String(nItems(f))]), [4400, 1800, 1200, 2246], { size: 18 })];
  if (t.uft === 'UFT-33-02') {
    const ai = q.forms.flatMap(f => f.sections.filter(s => s.id === 'ai_sector').map(s => ({ f, s })));
    ex.shots = [P('Le panneau liste toutes les questions de chaque formulaire, section par section (la liste complète est en annexe A). Trois actions :', { size: 19 }),
      ...steps([[b('Questions des modèles : '), 'elles sont chargées depuis les trois modèles choisis à l’étape précédente.'], [b('« Adapter avec l’IA » : '), 'ajoute à chaque formulaire une section « Questions spécifiques au secteur » générée pour les établissements de santé et le focus IA, marquée IA et à valider par une personne.'], [b('« Ajouter une question » : '), 'dans la section de votre choix ; saisissez le texte, puis « Enregistrer ».']]),
      P('Les questions générées par l’IA dans ce cas (formulaire Collaborateurs) :', { size: 19, before: 80, keepNext: true }),
      table(['N°', 'Question', 'Origine'], (ai.find(x => x.f.code === 'QT-IFPAC-MBR')?.s.items || []).map((it, i) => [String(i + 1), it.label, it.origin === 'ai' ? 'IA (à valider)' : 'Ajoutée manuellement']), [600, 7400, 1646], { size: 17 }),
      ...shot(SH('21_questions'), 'UFT-33-02 : le questionnaire du projet dans l’étape', 420), ...shot(SH('21_questions_b'), 'Les questions d’une section, avec leur RACSI', 420)];
  }
  if (t.uft === 'UFT-33-03') ex.shots = [P('Validez chaque question IA (✓) ou toutes à la fois (« Tout valider »), reformulez au besoin, supprimez les doublons, puis « Enregistrer ». Dans ce cas, une question a été reformulée avec le vocabulaire du service des urgences :', { size: 19 }),
    table(['Avant (IA)', 'Après (reformulée)'], [[s0.reworded?.from || '—', s0.reworded?.to || '—']], [4823, 4823], { size: 18 }), P('L’étape ne se termine que lorsqu’il ne reste aucune question IA à valider.', { size: 19, color: C.muted })];
  if (t.uft === 'UFT-33-04') ex.shots = [P('Le RACSI s’écrit une ligne par rôle : cochez R, A, C, S ou I. La colonne Sections vide signifie « toutes les sections ». À la clôture, l’application vérifie qu’il y a exactement un A par section et inscrit le RACSI dans chaque section du questionnaire.', { size: 19 }), ...shot(SH('23_racsi_b'), 'UFT-33-04 : le RACSI par rôle, R A C S I en colonnes', 420)];
  if (t.uft === 'UFT-33-05') ex.shots = [P('Les canaux se choisissent par niveau de décision, dans leur ordre d’utilisation : le premier invite, les suivants relancent à la cadence choisie ; « Présentiel » ajoute un entretien après les relances. Voici les plans obtenus pour les répondants du cas :', { size: 19 }),
    table(['Répondant', 'Population', 'Plan de canaux (jour)'], inv.map(i => [i.name, { DG: 'Direction générale', Management: 'Management', Member: 'Collaborateur' }[i.population] || i.population, (i.plan || []).map(p => `${{ Email: 'E-mail', WhatsApp: 'WhatsApp', 'Face-to-Face': 'Présentiel', Application: 'Application' }[p.channel] || p.channel} J+${p.after_days}`).join(' → ')]), [2600, 1800, 5246], { size: 17 }),
    ...shot(SH('24_channels_b'), 'UFT-33-05 : canaux préférés à choix multiple', 420)];
  if (t.uft === 'UFT-33-06') { const em = (s0.messages || []).find(m => m.channel === 'email') || (s0.messages || [])[0]; const wa = (s0.messages || []).find(m => m.channel === 'whatsapp');
    ex.shots = [P('Le panneau montre l’état des canaux (production ou bac à sable), puis la liste « Qui répond ». Deux actions :', { size: 19 }),
      ...steps([[b('« Ajouter des répondants » : '), 'cochez « Tout sélectionner » : les huit parties prenantes de UFT-32-06 sont ajoutées, chacune avec son formulaire et son plan de canaux.'], [b('« Diffuser maintenant à 8 répondant(s) » : '), 'chaque répondant reçoit immédiatement son premier message, avec son lien personnel.']]),
      P('Le message réellement envoyé par e-mail (exemple) :', { size: 19, before: 60, keepNext: true }), code(`Objet : ${em?.subject || ''}`), ...String(em?.text || '').split('\n').filter(Boolean).slice(0, 9).map(l => code(l.replace(/https?:\/\/[^\s]+\/respond\/\S+/, 'https://competences.cliniquealamal.ma/respond/<lien personnel>'))),
      ...(wa ? [P('Et par WhatsApp (avec le modèle approuvé, les mêmes informations remplissent ses variables) :', { size: 19, before: 60, keepNext: true }), ...String(wa.text || '').split('\n').filter(Boolean).slice(0, 4).map(l => code(l.replace(/https?:\/\/[^\s]+\/respond\/\S+/, 'https://competences.cliniquealamal.ma/respond/<lien personnel>')))] : []),
      ...shot(SH('25_distribution_b'), 'UFT-33-06 : les répondants, leurs coordonnées et leur plan de canaux', 420)]; }
  if (t.uft === 'UFT-33-07') ex.shots = [P(`Le panneau compte les répondants en attente. Les relances partent d’elles-mêmes à la cadence de l’étape MP-54.5 ; « Envoyer les relances maintenant » en envoie une immédiatement à chaque répondant qui n’a pas répondu (dans ce cas : ${s0.reminders?.sent ?? 0} envoyées, ${s0.reminders?.failed ?? 0} en échec). Le journal en bas du panneau liste chaque message avec son statut de remise (envoyé, remis, lu, échec).`, { size: 19 })];
  if (t.uft === 'UFT-33-08') ex.shots = [H3('Ce que voit le répondant'), ...steps(['Il ouvre son lien (e-mail ou WhatsApp) : la page s’ouvre dans sa langue, à son nom, avec la date limite.', 'Il coche « J’accepte que mes réponses soient enregistrées et utilisées » : sans consentement, rien n’est enregistré.', 'Il répond section par section ; « Enregistrer le brouillon » lui permet de reprendre plus tard ; la barre « Rempli » montre sa progression.', 'Il clique sur « Envoyer mes réponses » : « Merci, vos réponses ont été enregistrées. »']),
    ...shot(SH('30_respond_top'), 'La page du répondant : consentement, puis les sections du formulaire', 480), ...shot(SH('31_respond_middle'), 'Plus bas : tableaux, grilles et questions ouvertes', 480),
    P(`Dans ce cas, ${(d.answered || []).length} répondants sur ${inv.length} ont répondu depuis leur lien. Pour un entretien en présentiel (direction générale), le bouton « Saisir les réponses (entretien) » de la liste des répondants ouvre le même formulaire pour l’intervieweur.`, { size: 19 }),
    table(['Répondant', 'Formulaire'], (d.answered || []).map(a => [a.name, { 'QT-IFPAC-DG': 'Direction générale', 'QT-IFPAC-MGT': 'Management', 'QT-IFPAC-MBR': 'Collaborateurs' }[a.form] || a.form]), [4800, 4846], { size: 18 })];
  if (t.uft === 'UFT-33-09') ex.shots = [P(`Résultat du cas : ${q.stats.invited} répondants, ${q.stats.responded} réponses, taux de réponse ${q.stats.responseRate} %, complétude ${q.stats.completeness} %. Une réponse sous le seuil de 70 % est signalée ; « Inclure » / « Exclure » demande une justification.`, { size: 19 })];
  if (t.uft === 'UFT-33-10') { const ds = s0.dataset || {}; ex.shots = [P('Le jeu de données consolidé regroupe les réponses incluses par population, fonction et niveau. Les compétences les plus citées dans ce cas :', { size: 19 }),
    table(['Compétence', 'Mentions', 'Populations'], (ds.competences || []).slice(0, 8).map(c => [c.competence, String(c.count), (c.populations || []).map(p => ({ DG: 'Direction générale', Management: 'Management', Member: 'Collaborateurs' }[p] || p)).join(', ')]), [4600, 1300, 3746], { size: 18 }), ...shot(SH('28_dataset'), 'UFT-33-10 : le jeu de données consolidé', 420)]; }
  if (t.uft === 'UFT-33-11') { const fd = t.steps.find(s => s.feed)?.feed; ex.shots = [P(`« Transmettre à l’analyse des besoins » crée les besoins de formation du projet à partir des compétences citées (dans ce cas : ${fd?.created ?? 0} besoins créés depuis ${fd?.responses ?? 0} réponses). L’étape MP-54.12 génère ensuite le rapport de campagne (document DT-E2E-33, rapport RPT-034), téléchargeable en DOCX, PDF ou XLSX.`, { size: 19 }), ...shot(SH('29_report_b'), 'Le rapport de campagne : indicateurs, document et formats', 420)]; }
  body.push(...taskBlock(t, ex));
}
const gate = ph => { const g = d.gates.find(x => x.phase === ph); if (!g) return []; return [H2(`Jalon ${g.gate}`), P('Connectez-vous comme DRH (hrd@cliniquealamal.ma). Dans le projet, ouvrez la liste de contrôle du jalon, cochez chaque point vérifié, puis décidez « Go » avec une justification. Les tâches de la phase suivante ne démarrent qu’après ce « Go ».', { size: 20 }),
  table(['Point à vérifier', 'Coché'], g.items.map(i => [i, 'Oui']), [8200, 1446], { size: 18 }), P([b('Décision : '), `Go — ${g.justification}`], { size: 20 })]; };
body.push(...gate(1));

// ---------------------------------------------------------------- 7-10 phases 2..5
const PH = [[2, 'E2E-02', '7. Phase 2 — Le diagnostic des écarts de compétences (E2E-02)', 'À partir des besoins créés par la campagne, l’analyste formalise le référentiel de compétences, évalue les niveaux et calcule les écarts.'],
  [3, 'E2E-01', '8. Phase 3 — Le plan de formation (E2E-01)', 'Le plan de formation relie les objectifs de la clinique aux thèmes prioritaires, avec budget, calendrier et indicateurs.'],
  [4, 'E2E-05', '9. Phase 4 — La conception et la réalisation (E2E-05)', 'Les actions du plan deviennent des sessions : prestataires, programmes, convocations, présences et évaluations à chaud.'],
  [5, 'E2E-07', '10. Phase 5 — L’évaluation de l’efficacité (E2E-07)', 'Les acquis, le transfert en situation de travail et l’efficacité sont mesurés et comparés aux objectifs.']];
for (const [ph, e2e, title, intro] of PH) {
  body.push(H1(title), P(intro));
  for (const t of d.tasks.filter(x => x.e2e === e2e)) body.push(...taskBlock(t));
  body.push(...gate(ph));
}

// ---------------------------------------------------------------- 11
body.push(H1('11. En cas de difficulté'),
  table(['Ce que vous voyez', 'Cause probable', 'Que faire'], [
    ['Les messages restent « Bac à sable » / « simulé »', 'Le canal est en mode bac à sable ou n’est pas activé.', 'Administration › Canaux : cochez « Activé », choisissez « En production », enregistrez, puis « Envoyer un test ».'],
    ['« Le fournisseur a refusé le message » (e-mail)', 'Identifiants SMTP, port ou expéditeur refusés par le serveur.', 'Vérifiez le port (587 sans TLS immédiat, 465 avec), le mot de passe d’application, et que l’expéditeur est autorisé pour ce compte.'],
    ['WhatsApp : échec « template » ou « 24 h »', 'Pas de modèle approuvé, ou nom/langue du modèle incorrects.', 'Renseignez le nom exact du modèle approuvé et son code langue (fr) ; attendez l’approbation de Meta.'],
    ['Le répondant ne peut pas ouvrir son lien', 'Le lien pointe vers localhost ou une adresse interne.', 'Déclarez PUBLIC_URL (chapitre 2.1) et redémarrez le serveur ; renvoyez le message (« Envoyer maintenant »).'],
    ['« Le projet n’a pas encore de questionnaire »', 'L’étape MP-54.1 n’est pas terminée.', 'Choisissez les modèles dans MP-54.1 et terminez l’étape ; le questionnaire est créé.'],
    ['« Chaque section doit avoir exactement un A »', 'Aucun ou plusieurs rôles cochés A pour une section.', 'Dans MP-54.4, gardez un seul A (ou précisez les sections de chaque ligne).'],
    ['« Des questions IA ne sont pas encore validées »', 'Une question IA attend sa validation.', 'MP-54.3 : « Tout valider » ou ✓ sur chaque question, puis terminez l’étape.'],
    ['« Ce processus transverse démarre après le jalon G3 »', 'Le processus d’adoption (E2E-17) attend le plan approuvé.', 'Normal : il démarre après le « Go » du jalon G3.'],
    ['Le collage met les titres dans une ligne', 'La case « La première ligne contient les titres » est décochée ou un titre a changé.', 'Cochez-la dans l’Aperçu du collage, ou recopiez le tableau sans modifier ses titres.'],
  ], [2900, 3200, 3546], { size: 17 }),
);

// ---------------------------------------------------------------- annex A: the questions
body.push(H1('Annexe A — Les questions des trois formulaires'), P('Liste complète des sections et des questions telles que les répondants les reçoivent. Pour les sections en tableau, le répondant ajoute des lignes avec les colonnes indiquées.'));
for (const f of q.forms) {
  body.push(H2(f.name));
  for (const [i, s] of f.sections.entries()) {
    const head = `${i + 1}. ${s.title}${s.origin === 'ai' ? ' (IA, validée)' : ''}`;
    if (s.type === 'note') { body.push(P([b(head), ` — ${s.instructions}`], { size: 18, after: 80 })); continue; }
    if (s.columns.length && !s.items.length) { body.push(P([b(head), { text: ` — tableau : ${s.columns.join(' | ')}`, color: C.muted }], { size: 18, after: 80 })); continue; }
    body.push(P([b(head), s.columns.length ? { text: ` — colonnes : ${s.columns.join(' | ')}`, color: C.muted } : ''], { size: 18, after: 40, keepNext: true }));
    body.push(P(s.items.map((it, k) => `${k + 1}) ${it.label}`).join('   '), { size: 17, after: 100 }));
  }
}

const doc = document({ title: 'CortexSkills — Guide du cas Clinique Al Amal', credit: `CortexSkills ${version} · Guide utilisateur · Cas Clinique Al Amal`, sections: (() => { const secs = [[]]; for (const x of body) { if (x && x.landscapeBlock) { secs.push({ landscape: true, children: x.landscapeBlock }, []); } else secs[secs.length - 1].push(x); } return secs.filter(x => !Array.isArray(x) || x.length); })(), lang: 'fr-FR' });
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'CortexSkills_Guide_Utilisateur_Clinique_Privee_FR.docx');
D.Packer.toBuffer(doc).then(x => { fs.writeFileSync(file, x); console.log(file, (x.length / 1024).toFixed(0) + ' KB'); });
