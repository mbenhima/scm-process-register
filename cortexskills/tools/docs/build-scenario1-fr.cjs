// Builds the French paste guide of scenario 1 (Groupe Hospitalier Maghreb, AI run) from scenario1-fr.json
// (produced by extract-scenario1.mjs). Each Multi-Entry step has a table whose first row holds the exact French
// column titles of the application, so it can be copied in Word and pasted in the step table (Ctrl+V).
// Run: node build-scenario1-fr.cjs <outDir>; then python3 topdf.py <docx> for the table of contents and the PDF.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, H3, bullet, callout, table, cover, tocPage, document, spacer, run } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenario1-fr.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const fmtDate = s => { const [y, m, dd] = s.slice(0, 10).split('-'); return `${dd}/${m}/${y}`; };
let list = 0; const steps = items => { const ref = 'steps' + (list++ % 199 || ''); return items.map(t => B.numbered(t, ref)); };
const PASSWORD = 'CortexSkills#2026';
const all = d.phases.flatMap(p => p.e2es.flatMap(e => e.tasks.flatMap(t => t.steps)));
const nMulti = all.filter(s => s.pattern === 'inline' || s.pattern === 'master-detail').length;
const nForm = all.filter(s => s.pattern === 'form' || s.pattern === 'sectioned').length;
const nSys = all.filter(s => s.pattern === 'system').length;

const body = [];
body.push(...cover({ eyebrow: 'Guide utilisateur · Scénario 1', title: 'CortexSkills',
  subtitle: `Ce qu’il faut saisir, étape par étape, avec des tableaux prêts à copier-coller — ${d.org.name}`,
  meta: [`Version ${version} · ${fmtDate(new Date().toISOString())}`, 'Préparé par AI Value'], appLogo: path.join(__dirname, '../../web/public/cortexskills-logo.png') }));
body.push(...tocPage('Table des matières'));

// ---------------------------------------------------------------- 1
body.push(H1('1. À propos de ce guide'),
  P(`Ce guide déroule le scénario 1 de CortexSkills de bout en bout : le projet « ${d.project.name} ». Pour chaque tâche, il indique qui la réalise, ce qu’elle reçoit, ce qu’elle produit et ce qu’il faut saisir à chaque étape.`),
  P([{ text: 'La nouveauté : ', bold: true }, 'chaque tableau de saisie (Multi-Entry) est reproduit ici avec, en première ligne, les titres exacts des colonnes de l’application. Il suffit de sélectionner le tableau dans ce document, de le copier et de le coller dans l’application : les lignes sont créées en une fois, chaque valeur dans la bonne colonne.']),
  H2('1.1 Le scénario en chiffres'),
  table(['Élément', 'Valeur'], [
    ['Organisation', `${d.org.name} — ${d.org.sector}, grande entreprise, ${d.org.employees.toLocaleString('fr-FR')} salariés, ${d.org.city}`],
    ['Projet', d.project.name],
    ['Orientation', 'Compétences en intelligence artificielle (IA), déroulé complet'],
    ['Thèmes du projet', d.themes.join(' · ')],
    ['Phases', String(d.counts.phases)],
    ['Processus de bout en bout (E2E)', String(d.counts.e2e)],
    ['Tâches', String(d.counts.tasks)],
    ['Étapes', `${d.counts.steps} : ${nMulti} tableaux à coller, ${nForm} formulaires à remplir, ${nSys} étapes automatiques`],
    ['Devise par défaut', d.currency],
  ], [3000, 6646]),
  H2('1.2 Comment lire une tâche'),
  table(['Rubrique', 'Signification'], [
    ['Code et nom de la tâche', 'UFT-xx-yy : le code de la tâche dans le catalogue des processus, suivi de son nom, tel qu’il apparaît dans l’application.'],
    ['Responsable · Approbateur', 'Le rôle qui réalise la tâche (R) et celui qui en répond (A), selon la matrice RACSI.'],
    ['Entrée · Sortie', 'Ce que la tâche reçoit et ce qu’elle produit.'],
    ['Ce qu’il faut saisir', 'Le contenu attendu pour ce scénario, repris de l’aide « Ce qu’il faut saisir » de l’application.'],
    ['Étape', 'Chaque étape de la tâche, avec son code (MP-xx.y), son type et le rôle qui la réalise, puis le tableau à coller ou les valeurs du formulaire.'],
  ], [3000, 6646]),
  spacer(),
  callout('Les trois types d’étapes', [
    [{ text: 'Tableau à coller (Multi-Entry) — ', bold: true }, 'plusieurs lignes du même type : copiez le tableau du guide et collez-le dans le tableau de l’étape.'],
    [{ text: 'Formulaire — ', bold: true }, 'une seule fiche (décision, revue) : saisissez chaque valeur dans le champ indiqué.'],
    [{ text: 'Étape automatique — ', bold: true }, 'la plateforme la réalise ; il n’y a rien à saisir, vérifiez seulement son résultat.'],
  ]),
);

// ---------------------------------------------------------------- 2
body.push(H1('2. Avant de commencer'),
  H2('2.1 Se connecter'),
  table(['Élément', 'Valeur'], [
    ['Adresse de l’application', 'L’adresse communiquée par votre administrateur (en démonstration : http://localhost:4000)'],
    ['E-mail', d.login],
    ['Mot de passe', PASSWORD],
    ['Rôle', `Responsable formation (${d.headName})`],
  ], [3000, 6646]),
  spacer(),
  ...steps([
    'Ouvrez l’application et saisissez l’e-mail et le mot de passe ci-dessus.',
    'Dans l’en-tête, cliquez sur FR pour afficher l’application en français. C’est important : les dates JJ/MM/AAAA et les nombres « 3,5 » du guide sont lus selon la langue de l’interface.',
    `Dans le sélecteur de projet, choisissez « ${d.project.name} ».`,
    'Ouvrez Projets, puis le projet, la phase, le processus et enfin la tâche à traiter. Les étapes de la tâche s’affichent l’une sous l’autre.',
  ]),
  H2('2.2 Où faire le scénario'),
  P('Dans le jeu de démonstration, le projet du scénario 1 est déjà bien avancé : les étapes terminées sont en lecture seule et contiennent déjà des lignes. Deux façons de suivre ce guide :'),
  bullet([{ text: 'Refaire le scénario complet : ', bold: true }, 'créez un nouveau projet IA pour la même organisation, à partir du même modèle, et suivez le guide du début à la fin.']),
  bullet([{ text: 'Compléter le projet existant : ', bold: true }, 'utilisez les tableaux des étapes encore ouvertes. Pour une étape terminée, cliquez d’abord sur « Rouvrir l’étape » (une justification est demandée), sinon le collage est refusé avec le message « l’étape est terminée : rouvrez-la pour modifier ses lignes ».']),
  callout('Après le passage d’un jalon', ['Une fois le jalon (gate) d’une phase validé « Go », ses étapes sont verrouillées. Collez donc les lignes d’une phase avant de présenter son jalon.'], C.bg),
);

// ---------------------------------------------------------------- 3
body.push(H1('3. Copier-coller un tableau dans l’application'),
  P('Le collage suit le modèle Multi-Entry de CortexSkills : les lignes copiées depuis Word sont lues comme un tableau, la première ligne est reconnue comme la ligne des titres, chaque colonne va dans la colonne de même nom, et un aperçu permet de tout vérifier avant d’enregistrer.'),
  H2('3.1 Dans Word : copier le tableau'),
  ...steps([
    'Placez le curseur dans le tableau de l’étape, dans ce guide.',
    'Sélectionnez tout le tableau, ligne des titres comprise : cliquez sur la poignée ✥ en haut à gauche du tableau (ou faites glisser la souris de la première à la dernière cellule).',
    'Copiez : Ctrl+C (⌘C sur Mac).',
  ]),
  H2('3.2 Dans CortexSkills : coller les lignes'),
  ...steps([
    'Ouvrez la tâche, puis l’étape concernée : son tableau s’affiche (vous pouvez l’ouvrir en plein écran avec « Plein écran »).',
    'Cliquez sur une cellule du tableau — par exemple la première cellule d’une nouvelle ligne — ou sur le bouton « Coller ».',
    'Collez : Ctrl+V (⌘V sur Mac). Avec le bouton « Coller », une « Zone de collage » s’ouvre : appuyez sur Ctrl+V dans cette zone.',
    'L’« Aperçu du collage » s’affiche : il indique le nombre de lignes lues « comme un tableau HTML », les lignes à ajouter et celles à corriger. Vérifiez que la case « La première ligne contient les titres des colonnes » est cochée.',
    'Contrôlez la « Correspondance des colonnes » : chaque « Colonne copiée » « Va dans » la colonne de même nom. Corrigez une correspondance au besoin, ou choisissez « Ignorer ».',
    'Cliquez sur « Appliquer ». Le message « N ligne(s) collée(s). » confirme l’enregistrement. Ctrl+Z annule le collage.',
    'Complétez ou ajustez une valeur directement dans le tableau si besoin, puis cliquez sur « Terminer l’étape ». Les lignes alimentent alors le registre de l’étape.',
  ]),
  callout('Bon à savoir', [
    'Ne modifiez pas les titres de la première ligne : ce sont eux qui placent chaque valeur dans la bonne colonne.',
    'Une cellule vide est permise, sauf pour les colonnes obligatoires indiquées sous chaque tableau.',
    'Vous pouvez adapter les valeurs à votre propre organisation avant de copier : remplacez simplement le texte dans le tableau du guide.',
    'Le copier-coller fonctionne aussi depuis Excel ou une page web, et l’import d’un fichier Excel ou CSV est disponible avec le bouton « Importer ».',
  ]),
  H2('3.3 Les formats des valeurs'),
  table(['Type de colonne', 'Format utilisé dans ce guide', 'Exemple'], [
    ['Date', 'JJ/MM/AAAA (l’interface doit être en français)', '26/08/2026'],
    ['Nombre', 'Virgule décimale ; espace pour les milliers', '3,5 · 61 000'],
    ['Oui / Non (case à cocher)', 'Oui ou Non', 'Oui'],
    ['Liste de choix', 'Le libellé français de la liste ; la casse et les accents ne comptent pas', 'Principal · Présentiel · Ambre'],
    ['Indicateur (KPI)', 'Code suivi du nom entre parenthèses', 'KPI-013 (Taux de progression des compétences)'],
    ['Personne', 'Nom d’une personne de l’organisation (voir 4.1)', d.people[0]?.name || ''],
    ['Fonction · Rôle', 'Nom de la fonction ou du rôle de l’organisation (voir 4.2)', d.functions[0] || ''],
    ['Devise', 'Code ISO à trois lettres', d.currency],
  ], [2400, 4446, 2800]),
);

// ---------------------------------------------------------------- 4
const half = a => { const h = Math.ceil(a.length / 2); return Array.from({ length: h }, (_, i) => [a[i], a[i + h]]); };
body.push(H1('4. Personnes, fonctions et rôles de l’organisation'),
  P('Les colonnes Responsable, Personne, Fonction et Rôle proposent les personnes, fonctions et rôles enregistrés pour l’organisation. Les valeurs du guide viennent de ces listes ; une autre valeur est acceptée comme « valeur personnalisée ».'),
  H2('4.1 Personnes'),
  table(['Nom', 'Intitulé', 'E-mail'], d.people.map(u => [u.name, u.title || '', u.email]), [2800, 3200, 3646], { size: 17 }),
  H2('4.2 Fonctions et rôles'),
  table(['Fonctions (OBS)', 'Rôles'], Array.from({ length: Math.max(d.functions.length, d.roles.length) }, (_, i) => [d.functions[i] || '', d.roles[i] || '']), [4823, 4823], { size: 17 }),
);

// ---------------------------------------------------------------- phases
const info = t => table(['Rubrique', 'Contenu'], [
  ['Responsable · Approbateur', `${t.owner || '—'} · ${t.accountable || '—'}`],
  ['Entrée', t.input || '—'], ['Sortie', t.output || '—'],
  ...(t.guidance ? [[{ text: 'Ce qu’il faut saisir', bold: true }, t.guidance]] : []),
], [2600, 7046], { size: 18 });
const stepHead = (s, tag) => P([{ text: `Étape ${s.id} · `, bold: true, color: C.azure }, { text: s.name, bold: true, color: C.navy }, { text: `   ${tag} · ${s.role}`, color: C.muted, size: 18 }], { before: 200, after: 80, keepNext: true });
// Width of a paste column from its type and the length of its values.
const colW = (c, i, rows) => { const len = Math.max(c.label.length, ...rows.map(r => String(r[i] || '').length)); const base = { boolean: 900, date: 1150, number: 1000 }[c.type]; return base ? Math.max(base, c.label.length * 125 + 250) : Math.min(3400, Math.max(1100, len * 70)); };
// The task's own guidance makes the first configuration row and the subject of a decision or review specific.
function specific(s, t) {
  if (!t.guidance) return s;
  const at = k => s.columns.findIndex(c => c.key === k);
  if (s.kind === 'configuration') return { ...s, rows: [s.columns.map(c => ({ setting: s.object, value: t.guidance, reference: t.output || '' })[c.key] ?? ''), ...s.rows.slice(0, 1)] };
  const k = s.kind === 'decision' ? at('subject') : s.kind === 'review' ? at('scope') : -1;
  if (k >= 0) return { ...s, rows: s.rows.map(r => r.map((v, i) => (i === k ? `${s.object} — ${t.guidance}` : v))) };
  return s;
}
function stepBlock(s) {
  if (s.pattern === 'system') return [stepHead(s, 'Étape automatique'), P('Rien à saisir : la plateforme réalise cette étape. Vérifiez son résultat dans la tâche.', { size: 20, color: C.muted, after: 120 })];
  if (s.pattern === 'form' || s.pattern === 'sectioned') {
    const row = s.rows[0] || [];
    return [stepHead(s, `Formulaire · ${s.kindLabel}`), P('Saisissez ces valeurs dans les champs du formulaire de l’étape :', { size: 20, after: 60, keepNext: true }),
      table(['Champ', 'Valeur à saisir'], s.columns.map((c, i) => [c.required ? { text: `${c.label} (obligatoire)`, bold: true } : c.label, row[i] || '—']), [3000, 6646], { size: 18 }), spacer(80)];
  }
  const req = s.columns.filter(c => c.required).map(c => c.label);
  return [stepHead(s, `Tableau à coller · ${s.kindLabel}`),
    P([`Copiez ce tableau et collez-le dans le tableau de l’étape (${s.rows.length} ligne${s.rows.length > 1 ? 's' : ''}).`, req.length ? { text: ` Colonnes obligatoires : ${req.join(', ')}.`, color: C.muted } : ''], { size: 20, after: 60, keepNext: true }),
    table(s.columns.map(c => c.label), s.rows, s.columns.map((c, i) => colW(c, i, s.rows)), { size: s.columns.length > 6 ? 16 : 17 }),
    ...(s.register ? [P(`À la clôture de l’étape, ces lignes alimentent le « ${s.register} ».`, { size: 17, italics: true, color: C.muted, before: 40, after: 120 })] : [spacer(100)])];
}
let n = 5;
for (const ph of d.phases) {
  body.push(H1(`${n}. Phase ${ph.no} — ${ph.name}`));
  const nt = ph.e2es.reduce((a, e) => a + e.tasks.length, 0);
  body.push(P(`Cette phase compte ${ph.e2es.length} processus et ${nt} tâches.${ph.gate ? ` Elle se termine par le jalon ${ph.gate.name}.` : ' Ces processus transverses s’exécutent tout au long du projet.'}`));
  body.push(table(['Processus', 'Nom', 'Tâches'], ph.e2es.map(e => [e.id, e.name, String(e.tasks.length)]), [1700, 6646, 1300], { size: 18 }));
  ph.e2es.forEach((e, ei) => {
    body.push(H2(`${n}.${ei + 1} ${e.id} — ${e.name}`));
    if (e.goal) body.push(P([{ text: 'Objectif : ', bold: true }, e.goal], { size: 20, after: 60 }));
    if (e.trigger || e.terminal) body.push(P([{ text: 'Déclencheur : ', bold: true }, e.trigger || '—', { text: '   Résultat final : ', bold: true }, e.terminal || '—'], { size: 20 }));
    e.tasks.forEach((t, ti) => {
      body.push(H3(`${t.uft} — ${t.name}`), info(t));
      for (const s of t.steps) body.push(...stepBlock(specific(s, t)));
    });
  });
  n++;
}

// ---------------------------------------------------------------- annex
body.push(H1(`${n}. En cas de difficulté`),
  table(['Ce que vous voyez', 'Cause probable', 'Que faire'], [
    ['Les titres sont collés comme une ligne de données', 'La case « La première ligne contient les titres des colonnes » n’est pas cochée, ou un titre a été modifié.', 'Cochez la case dans l’Aperçu du collage, ou recopiez le tableau du guide sans changer ses titres.'],
    ['Toutes les valeurs sont dans la première colonne', 'Seul le texte d’une cellule a été copié, pas le tableau.', 'Sélectionnez le tableau entier avec sa poignée ✥, puis copiez de nouveau.'],
    ['Une date est inversée (mois et jour)', 'L’interface est en anglais : la date est lue MM/JJ/AAAA.', 'Passez l’interface en FR avant de coller, ou saisissez la date au format AAAA-MM-JJ.'],
    ['« À corriger » sur une cellule de liste', 'La valeur n’est pas dans la liste et la colonne n’accepte pas de valeur personnalisée.', 'Choisissez une valeur de la liste dans la cellule, ou corrigez le texte dans le guide.'],
    ['« Collage refusé : l’étape est terminée »', 'L’étape a déjà été terminée.', 'Cliquez sur « Rouvrir l’étape », justifiez, puis collez de nouveau.'],
    ['Le tableau est en lecture seule', 'Le jalon de la phase a été validé, ou votre rôle ne permet pas de modifier cette étape.', 'Connectez-vous avec le rôle indiqué dans l’étape, ou faites rouvrir la phase.'],
    ['« N ligne(s) n’ont pas pu être enregistrée(s) »', 'Une colonne obligatoire est vide, ou une valeur n’est pas valide.', 'Corrigez les valeurs listées, puis collez ces lignes de nouveau ; les autres sont déjà enregistrées.'],
  ], [2900, 3300, 3446], { size: 18 }),
);

const doc = document({ title: 'CortexSkills — Guide utilisateur, scénario 1', credit: `CortexSkills ${version} · Guide utilisateur · Scénario 1`, sections: [body], lang: 'fr-FR' });
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'CortexSkills_Guide_Utilisateur_Scenario1_FR.docx');
D.Packer.toBuffer(doc).then(b => { fs.writeFileSync(file, b); console.log(file, (b.length / 1024).toFixed(0) + ' KB'); });
