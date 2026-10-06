// Builds the User Guide (Word) in English or French from runs-data.json (extract-runs.mjs): five complete runs,
// each step followed directly by what to type. Run: node build-guide.cjs en|fr <outDir>; then python3 topdf.py.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, H3, bullet, callout, shot, cover, tocPage, document, spacer, run } = B;
const lang = process.argv[2] === 'fr' ? 'fr' : 'en';
const out = process.argv[3] || path.join(__dirname, '../../deliverables');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'runs-data.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const L = x => (x == null ? '' : typeof x === 'object' && !Array.isArray(x) ? (x[lang] || x.en || '') : Array.isArray(x) ? x.map(L).join(', ') : String(x));
const SHOT = f => path.join(__dirname, 'shots/v110', lang, f + '.png');
const { Paragraph, AlignmentType, TextRun } = D;

const T = {
  en: { eyebrow: 'User Guide', subtitle: 'Five complete runs, step by step: what to do and what to type', prepared: 'Prepared by POWERACT Consulting', toc: 'Table of Contents',
    about: '1. About this guide', start: '2. Before you start',
    aboutText: ['This guide follows five complete runs of CortexSkills, from the first strategic objective to the last improvement action. Each run is a real scenario of the demonstration data: a large hospital group, a large car maker, a construction SME, a dairy cooperative and a multi-sector services group.',
      'Every step is written the same way: the step, then, just after it, what to type. Values are the ones recorded in the demonstration data for that organization; type them as shown, or your own values in the same form.',
      'A run has seven phases. Each phase holds end-to-end processes; each process holds user tasks; each task holds steps. Phase gates close phases 1 to 6.'],
    scenarios: 'The five scenarios', scenarioCols: ['Scenario', 'Organization', 'Run', 'Sign in as'],
    howTitle: 'How a step is written', how: ['Step code and name — what the step asks, and the role that does it.', 'Type: — the values to enter, field by field. For a table step, one line per row.', 'Then — the button that closes the step.'],
    signIn: 'Sign in at http://localhost:5173 with the e-mail shown and the password CortexSkills#2026.',
    open: ['Choose the organization and the project in the selectors at the top of the screen.', 'Open Projects, then the run. The workspace lists the seven phases and their processes.', 'Click a process to open it, then click a task in its list. The task panel opens on the right.', 'In the panel, the Steps section lists the steps of the task. Click a step to open it.'],
    entry: ['A table step: click Add row, type in the first cell, press Tab to move to the next cell. A row is saved half a second after you leave it.', 'To see one row with large fields, click the Open icon at the end of the row (Row Editor). Back returns to the table and keeps what you typed.', 'A choice list offers the values of the organization; choose Custom value to type your own.', 'A form step: fill the fields; each field is saved when you leave it.', 'When the step is complete, click Complete the step. Its rows go to the register shown under the step.'],
    figTask: 'Figure 1 — Task panel with its typed steps', figRow: 'Figure 2 — Row Editor of a table step',
    scenario: n => `Scenario ${n}`, context: 'Context', run: 'Run', sector: 'Sector', size: 'Size', large: 'Large company', sme: 'SME', employees: 'employees', signAs: 'Sign in as', phasesN: 'Scope of the run',
    counts: c => `${c.e2e} end-to-end processes, ${c.tasks} user tasks and ${c.steps} steps.`, goal: 'Goal', trigger: 'Starts when', end: 'Ends with',
    task: 'Task', by: 'done by', accountable: 'accountable', input: 'Input', output: 'Output', guidance: 'Result to record in the task',
    step: 'Step', type: 'Type:', row: n => `Row ${n}`, then: 'Then click Complete the step.', thenFeeds: r => `Then click Complete the step. The rows go to the register “${r}”.`,
    system: 'Nothing to type: the platform performs this step once the previous steps are complete.', single: 'Then click Complete the step.',
    closeTask: 'When every step is complete, click Complete in the task panel.', gate: g => `Gate ${g}: close the phase`,
    gateText: ['Open the project workspace and click the gate button of the phase.', 'Tick each checklist item once its evidence is attached, then click Submit for decision.', 'Click Go. Type the justification: All mandatory items met; evidence attached.', 'Confirm. The decision is recorded with your name and the date; the steps of the phase become read-only.'],
    phase0: 'Enablers run across all phases', segment: { LARGE: 'Large company', SME: 'SME' }, focus: { AI: 'AI skills', Digital: 'Digital skills' }, mode: { Full: 'Full run', SME: 'SME track' } },
  fr: { eyebrow: 'Guide utilisateur', subtitle: 'Cinq déroulés complets, étape par étape : quoi faire et quoi saisir', prepared: 'Préparé par POWERACT Consulting', toc: 'Table des matières',
    about: '1. À propos de ce guide', start: '2. Avant de commencer',
    aboutText: ['Ce guide suit cinq déroulés complets de CortexSkills, du premier objectif stratégique à la dernière action d’amélioration. Chaque déroulé est un scénario réel des données de démonstration : un grand groupe hospitalier, un grand constructeur automobile, une PME du BTP, une coopérative laitière et un groupe de services multisectoriel.',
      'Chaque étape est écrite de la même façon : l’étape, puis, juste après, ce qu’il faut saisir. Les valeurs sont celles enregistrées dans les données de démonstration de l’organisation ; saisissez-les telles quelles, ou vos propres valeurs sous la même forme.',
      'Un déroulé compte sept phases. Chaque phase regroupe des processus de bout en bout ; chaque processus, des tâches utilisateur ; chaque tâche, des étapes. Des jalons ferment les phases 1 à 6.'],
    scenarios: 'Les cinq scénarios', scenarioCols: ['Scénario', 'Organisation', 'Déroulé', 'Se connecter avec'],
    howTitle: 'Comment une étape est écrite', how: ['Code et nom de l’étape — ce que demande l’étape et le rôle qui la réalise.', 'Saisir : — les valeurs à entrer, champ par champ. Pour une étape en tableau, une ligne par enregistrement.', 'Puis — le bouton qui termine l’étape.'],
    signIn: 'Connectez-vous sur http://localhost:5173 avec l’adresse indiquée et le mot de passe CortexSkills#2026.',
    open: ['Choisissez l’organisation et le projet dans les sélecteurs en haut de l’écran.', 'Ouvrez Projets, puis le déroulé. L’espace de travail liste les sept phases et leurs processus.', 'Cliquez sur un processus pour l’ouvrir, puis sur une tâche de sa liste. Le panneau de la tâche s’ouvre à droite.', 'Dans le panneau, la section Étapes liste les étapes de la tâche. Cliquez sur une étape pour l’ouvrir.'],
    entry: ['Étape en tableau : cliquez sur Ajouter une ligne, saisissez dans la première cellule, appuyez sur Tab pour passer à la suivante. Une ligne est enregistrée une demi-seconde après l’avoir quittée.', 'Pour voir une ligne avec de grands champs, cliquez sur l’icône Ouvrir en bout de ligne (éditeur de ligne). Retour revient au tableau et garde votre saisie.', 'Une liste de choix propose les valeurs de l’organisation ; choisissez Valeur personnalisée pour saisir la vôtre.', 'Étape en formulaire : remplissez les champs ; chaque champ est enregistré quand vous le quittez.', 'Quand l’étape est complète, cliquez sur Terminer l’étape. Ses lignes alimentent le registre indiqué sous l’étape.'],
    figTask: 'Figure 1 — Panneau d’une tâche avec ses étapes typées', figRow: 'Figure 2 — Éditeur de ligne d’une étape en tableau',
    scenario: n => `Scénario ${n}`, context: 'Contexte', run: 'Déroulé', sector: 'Secteur', size: 'Taille', large: 'Grande entreprise', sme: 'PME', employees: 'salariés', signAs: 'Se connecter avec', phasesN: 'Périmètre du déroulé',
    counts: c => `${c.e2e} processus de bout en bout, ${c.tasks} tâches utilisateur et ${c.steps} étapes.`, goal: 'Objectif', trigger: 'Démarre quand', end: 'Se termine par',
    task: 'Tâche', by: 'réalisée par', accountable: 'responsable final', input: 'Entrée', output: 'Sortie', guidance: 'Résultat à consigner dans la tâche',
    step: 'Étape', type: 'Saisir :', row: n => `Ligne ${n}`, then: 'Puis cliquez sur Terminer l’étape.', thenFeeds: r => `Puis cliquez sur Terminer l’étape. Les lignes alimentent le registre « ${r} ».`,
    system: 'Rien à saisir : la plateforme réalise cette étape dès que les étapes précédentes sont terminées.', single: 'Puis cliquez sur Terminer l’étape.',
    closeTask: 'Quand toutes les étapes sont terminées, cliquez sur Terminer dans le panneau de la tâche.', gate: g => `Jalon ${g} : fermer la phase`,
    gateText: ['Ouvrez l’espace de travail du projet et cliquez sur le bouton du jalon de la phase.', 'Cochez chaque point de la check-list dès que sa preuve est jointe, puis cliquez sur Soumettre à décision.', 'Cliquez sur Go. Saisissez la justification : Tous les points obligatoires sont satisfaits ; preuves jointes.', 'Confirmez. La décision est enregistrée avec votre nom et la date ; les étapes de la phase passent en lecture seule.'],
    phase0: 'Les catalyseurs couvrent toutes les phases', segment: { LARGE: 'Grande entreprise', SME: 'PME' }, focus: { AI: 'compétences IA', Digital: 'compétences numériques' }, mode: { Full: 'Déroulé complet', SME: 'Parcours PME' } },
}[lang];

const typeLine = cells => new Paragraph({ spacing: { after: 40 }, indent: { left: 700 }, children: cells.flatMap((c, i) => [...(i ? [run('  ·  ', { size: 21, color: C.medium })] : []), run(L(c.label) + ' : '.slice(lang === 'fr' ? 0 : 1), { size: 21, bold: true, color: C.dark }), run(L(c.value), { size: 21 })]) });
const label = (t, o = {}) => run(t, { size: 22, bold: true, color: o.color || C.deep, ...o });
const stepPara = (s) => new Paragraph({ keepNext: true, spacing: { before: 100, after: 40 }, indent: { left: 360 }, children: [label(`${T.step} ${s.id} — `), run(L(s.name), { size: 22, bold: true, color: C.dark }), run(`  (${L(s.role)})`, { size: 20, color: C.medium })] });
const typeHead = () => new Paragraph({ keepNext: true, spacing: { after: 20 }, indent: { left: 700 }, children: [label(T.type, { size: 21 })] });
const thenPara = t => new Paragraph({ spacing: { after: 80 }, indent: { left: 700 }, children: [run(t, { size: 21, italics: true, color: C.ink })] });

const body = [];
body.push(...cover({ eyebrow: T.eyebrow, title: 'CortexSkills', subtitle: T.subtitle, meta: [`Version ${version} · ${today}`, T.prepared] }));
body.push(...tocPage(T.toc));
body.push(H1(T.about), ...T.aboutText.map(x => P(x)), H2(T.scenarios),
  B.table(T.scenarioCols, data.runs.map((r, i) => [T.scenario(i + 1), `${L(r.org.name)} — ${L(r.org.sectorName)} (${T.segment[r.org.segment]})`, `${T.focus[r.project.focus]} · ${T.mode[r.project.mode]}`, r.login]), [1300, 4000, 2400, 2600]),
  spacer(), H2(T.howTitle), ...T.how.map(x => bullet(x)), spacer(), callout(T.signIn.split('.')[0], [T.signIn]));
body.push(H1(T.start), ...T.open.map((x, i) => B.numbered(x, 'steps')), spacer(), ...T.entry.map(x => bullet(x)), ...shot(SHOT('task'), T.figTask), ...shot(SHOT('roweditor'), T.figRow));

let listN = 1;
data.runs.forEach((r, ri) => {
  body.push(H1(`${3 + ri}. ${T.scenario(ri + 1)} — ${L(r.org.name)}`),
    H2(T.context),
    B.table([T.context, ''], [[T.sector, L(r.org.sectorName)], [T.size, `${T.segment[r.org.segment]} · ${r.org.employees} ${T.employees} · ${r.org.city}`], [T.run, `${L(r.project.name)} — ${T.focus[r.project.focus]}, ${T.mode[r.project.mode]}${r.project.track ? ' ' + r.project.track : ''}`],
      ['Standards', (r.standards || []).join(', ')], [lang === 'fr' ? 'Thèmes' : 'Themes', r.themes.map(L).join(' · ')], [T.signAs, `${r.login} · CortexSkills#2026`], [T.phasesN, T.counts(r.counts)]], [2600, 7146]));
  for (const ph of r.phases) {
    body.push(H2(`${lang === 'fr' ? 'Phase' : 'Phase'} ${ph.no} — ${L(ph.name)}`));
    if (ph.no === 0) body.push(P(T.phase0, { italics: true }));
    for (const e of ph.e2es) {
      body.push(H3(`${e.id} — ${L(e.name)}`), P([{ text: T.goal + ' : '.slice(lang === 'fr' ? 0 : 1), bold: true, color: C.dark }, L(e.goal)], { size: 22, after: 40 }),
        P([{ text: T.trigger + ' : '.slice(lang === 'fr' ? 0 : 1), bold: true, color: C.dark }, L(e.trigger), '   ', { text: T.end + ' : '.slice(lang === 'fr' ? 0 : 1), bold: true, color: C.dark }, L(e.terminal)], { size: 22, after: 100 }));
      for (const t of e.tasks) {
        body.push(new Paragraph({ keepNext: true, spacing: { before: 200, after: 40 }, shading: { type: D.ShadingType.CLEAR, fill: C.light, color: 'auto' }, children: [label(`${T.task} ${t.uft} — `, { size: 23 }), run(L(t.name), { size: 23, bold: true, color: C.dark }), run(`  · ${T.by} ${L(t.ownerT || t.owner)}`, { size: 20, color: C.ink })] }));
        if (t.input || t.output) body.push(P([{ text: T.input + ' : '.slice(lang === 'fr' ? 0 : 1), bold: true, color: C.dark }, L(t.input), '  →  ', { text: T.output + ' : '.slice(lang === 'fr' ? 0 : 1), bold: true, color: C.dark }, L(t.output)], { size: 20, after: 40 }));
        for (const s of t.steps) {
          body.push(stepPara(s));
          if (s.kind === 'system' || !s.rows.length) { body.push(thenPara(T.system)); continue; }
          body.push(typeHead());
          if (s.pattern === 'form' || s.pattern === 'sectioned') { for (const c of s.rows[0]) body.push(typeLine([c])); body.push(thenPara(T.single)); }
          else { s.rows.forEach((row, i) => body.push(new Paragraph({ keepNext: i < s.rows.length - 1, spacing: { after: 40 }, indent: { left: 700 }, children: [label(T.row(i + 1) + ' — ', { size: 21, color: C.dark }), ...row.flatMap((c, k) => [...(k ? [run('  ·  ', { size: 21, color: C.medium })] : []), run(L(c.label) + ' : '.slice(lang === 'fr' ? 0 : 1), { size: 21, bold: true, color: C.dark }), run(L(c.value), { size: 21 })])] })));
            body.push(thenPara(s.register ? T.thenFeeds(L(s.register)) : T.then)); }
        }
        if (t.guidance) body.push(new Paragraph({ spacing: { before: 40, after: 60 }, indent: { left: 360 }, children: [label(T.guidance + ' : '.slice(lang === 'fr' ? 0 : 1), { size: 21, color: C.dark }), run(L(t.guidance), { size: 21 })] }));
        body.push(thenPara(T.closeTask));
      }
    }
    if (ph.gate) { body.push(new Paragraph({ keepNext: true, spacing: { before: 240, after: 60 }, children: [label(T.gate(`${ph.gate.id} — ${L(ph.gate.name)}`), { size: 24 })] }));
      T.gateText.forEach(x => body.push(B.numbered(x, 'steps' + (listN++ % 39 + 1)))); }
  }
});

const doc = document({ title: `CortexSkills — ${T.eyebrow}`, credit: `CortexSkills ${version} · ${T.eyebrow}`, sections: [body], lang: lang === 'fr' ? 'fr-FR' : 'en-GB' });
const file = path.join(out, `CortexSkills_User_Guide_${lang.toUpperCase()}.docx`);
D.Packer.toBuffer(doc).then(b => { fs.writeFileSync(file, b); console.log('written', file, Math.round(b.length / 1024) + ' KB'); });
