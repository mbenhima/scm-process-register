// Builds the presentation deck in English or French: node build-deck.cjs en|fr [outDir]
// Content comes from guide-data.json and sector-data.json (seeded instance) and the screenshots in shots/.
const path = require('path'); const fs = require('fs');
const PptxGenJS = require('pptxgenjs'); const sharp = require('sharp'); const lucide = require('lucide-static');
const LANG = process.argv[2] || 'en'; const out = process.argv[3] || path.join(__dirname, '../../deliverables');
const G = JSON.parse(fs.readFileSync(path.join(__dirname, 'guide-data.json'), 'utf8'));
const SEC = JSON.parse(fs.readFileSync(path.join(__dirname, 'sector-data.json'), 'utf8'));
const L = x => (x && typeof x === 'object' ? x[LANG] ?? x.en : x ?? '');
const C = { orange: 'F8931D', deep: 'E07B00', tint: 'FDEEDA', dark: '3A3A3C', ink: '58595B', medium: '808184', light: 'F2F2F3', line: 'E3E3E4', bg: 'FDFDFC', white: 'FFFFFF' };
const TITLE = 'Cambria', BODY = 'Calibri';
const shotDir = f => path.join(__dirname, 'shots', f);
const SHOT = n => { const p = path.join(__dirname, 'shots', LANG, n + '.png'); return fs.existsSync(p) ? p : path.join(__dirname, 'shots/en', n + '.png'); };

const T = {
  en: {
    deckTitle: 'CortexSkills', deckSub: 'Training engineering, end to end — the application in action, sector by sector', deckEyebrow: 'Presentation · 2026',
    agenda: 'Agenda', agendaT: 'What this presentation covers',
    ag: [['The lifecycle', 'Seven phases, 33 end-to-end processes, five gates'], ['The dynamics, step by step', 'From the tenancy to the reports, on a large company'], ['SMEs', 'Lighter tracks for smaller organizations'], ['Sector by sector', '29 sectors, each with its large company and its SME']],
    lifeE: 'The lifecycle', lifeT: 'One lifecycle, seven phases', lifeS: 'Each phase groups end-to-end processes; a gate closes each main phase.', procs: 'processes', enablers: 'Enablers run across all phases',
    segE: 'Four segments', segT: 'Every organization runs two full cycles', segS: 'Digital skills and AI skills, for large companies and SMEs, in 29 sectors.',
    seg: ['Large companies — Digital', 'Large companies — AI', 'SMEs — Digital', 'SMEs — AI'], avgProg: 'average progress', orgs: 'organizations',
    segChart: 'Average task completion by segment and run, across the 29 sectors (%)',
    d1: 'The dynamics, step by step', d1s: 'Example: Atlas Motors Kénitra, automotive, large company', d2: 'SMEs: lighter tracks', d2s: 'Example: Clinique Al Amal, healthcare provider', d3: 'Sector by sector', d3s: '29 sectors · 58 organizations · 116 full runs',
    steps: [
      ['Step 1 · Tenancy', 'Start from the Group and the Organization', ['Choose the Group (Yes or No), then the Organization.', 'Each organization is a closed tenant: its data is never visible to another.', 'Group members can read sister organizations; they cannot change them.'], 'tenancy'],
      ['Step 2 · New project', 'Create the run from the catalog, by hand or with AI', ['Rate seven weighted criteria: the score recommends Full mode or an SME track.', 'With AI: type a short description; accept, change or reject each proposed item.', 'Phases, gates, checklists and roles come from the chosen template.'], 'newproject'],
      ['Step 3 · Workspace', 'Seven phases, processes and gates on one screen', ['Progress per phase and per process, overdue tasks, complexity score.', 'Enablers (data, change, quality) run across all phases.', 'A gate checklist must be complete before the next phase starts.'], 'ws'],
      ['Step 4 · Process chain', 'Processes feed each other', ['Each end-to-end process has a trigger, an end state and its inputs and outputs.', 'The chain shows which process consumes which output.', 'BPMN diagrams can be viewed, edited, imported and exported.'], 'chain'],
      ['Step 5 · Task', '“What to type” for every task', ['The task panel shows the expected answer for this organization and sector.', 'AI help proposes a draft, labelled with its confidence and sources.', 'Owner and evaluator are always two different people.'], 'task'],
      ['Step 6 · Governance', 'One Accountable per activity', ['RACSI roles are allocated per activity, with exactly one Accountable.', 'Risks, controls and business rules are tagged to the processes.', 'Every change to a governed field is justified and recorded.'], 'racsi'],
      ['Step 7 · Planning', 'The run on a timeline', ['Phases, processes and tasks on one Gantt, with dependencies.', 'Summary bars are computed from the tasks below them.', 'Print or save as PDF.'], 'gantt'],
      ['Step 8 · Results', 'Reports and questions in plain language', ['Standard reports exported to PDF, Excel and Word.', 'The AI Assistant answers from the organization’s own data, within the user’s permissions.', 'Alerts flag overdue steps and off-target KPIs.'], 'reports'],
    ],
    smeE: 'SMEs', smeT: 'Three SME tracks, sized by complexity', smeS: 'The complexity score recommends the track; a different choice needs a justification.',
    smeTracks: [['T1 · Essential', 'Score 0–29', 'Fewer gates, short checklists, about 6 weeks'], ['T2 · Standard', 'Score 30–49', 'Core processes with three gates'], ['T3 · Extended', 'Score 50–69', 'Close to Full mode, lighter documentation']],
    smeTaskE: 'SMEs', smeTaskT: 'Same guidance, on any screen', smeTaskS: 'Healthcare SME: the task panel in French, the workspace in Arabic on a phone.',
    secE: 'Sector', core: 'Core function:', large: 'Large company', sme: 'SME', themes: 'Priority AI themes (large company)', themesD: 'Priority digital themes (SME)', runChart: 'Task completion by run (%)', digital: 'Digital', ai: 'AI',
    sumE: 'What the data shows', sumT: 'Progress of the AI runs, by sector', sumS: 'Large companies, share of tasks completed in the AI skills run.', sumChart: 'Share of tasks completed in the AI run of each large company (%)',
    endE: 'Next steps', endT: 'Start your own run', endL: ['Install: two folders, three commands each (Installation Guide).', 'Sign in with a demonstration account and follow the User Guide.', 'Replace the demonstration organization with yours: Group, Organization, then Project.'],
    footer: 'CortexSkills', shotCap: 'Screenshot of the application',
  },
  fr: {
    deckTitle: 'CortexSkills', deckSub: 'L’ingénierie de formation de bout en bout — l’application en action, secteur par secteur', deckEyebrow: 'Présentation · 2026',
    agenda: 'Sommaire', agendaT: 'Ce que couvre cette présentation',
    ag: [['Le cycle de vie', 'Sept phases, 33 processus de bout en bout, cinq jalons'], ['La dynamique pas à pas', 'De la structure des locataires aux rapports, sur une grande entreprise'], ['Les PME', 'Des parcours allégés pour les petites structures'], ['Secteur par secteur', '29 secteurs, chacun avec sa grande entreprise et sa PME']],
    lifeE: 'Le cycle de vie', lifeT: 'Un cycle, sept phases', lifeS: 'Chaque phase regroupe des processus de bout en bout ; un jalon clôt chaque phase principale.', procs: 'processus', enablers: 'Les catalyseurs couvrent toutes les phases',
    segE: 'Quatre segments', segT: 'Chaque organisation mène deux cycles complets', segS: 'Compétences digitales et compétences IA, pour les grandes entreprises et les PME, dans 29 secteurs.',
    seg: ['Grandes entreprises — Digital', 'Grandes entreprises — IA', 'PME — Digital', 'PME — IA'], avgProg: 'avancement moyen', orgs: 'organisations',
    segChart: 'Taux moyen de tâches terminées par segment et par déroulé, sur les 29 secteurs (%)',
    d1: 'La dynamique pas à pas', d1s: 'Exemple : Atlas Motors Kénitra, automobile, grande entreprise', d2: 'Les PME : des parcours allégés', d2s: 'Exemple : Clinique Al Amal, établissement de santé', d3: 'Secteur par secteur', d3s: '29 secteurs · 58 organisations · 116 déroulés complets',
    steps: [
      ['Étape 1 · Locataires', 'Partir du groupe et de l’organisation', ['Choisir le groupe (oui ou non), puis l’organisation.', 'Chaque organisation est un locataire fermé : ses données ne sont jamais visibles d’une autre.', 'Les membres d’un groupe lisent les organisations sœurs sans pouvoir les modifier.'], 'tenancy'],
      ['Étape 2 · Nouveau projet', 'Créer le déroulé depuis le catalogue, à la main ou avec l’IA', ['Noter sept critères pondérés : le score recommande le mode complet ou un parcours PME.', 'Avec l’IA : saisir une courte description ; accepter, modifier ou rejeter chaque élément proposé.', 'Phases, jalons, listes de contrôle et rôles viennent du modèle choisi.'], 'newproject'],
      ['Étape 3 · Espace projet', 'Sept phases, processus et jalons sur un seul écran', ['Avancement par phase et par processus, tâches en retard, score de complexité.', 'Les catalyseurs (données, changement, qualité) couvrent toutes les phases.', 'La liste de contrôle d’un jalon doit être complète avant la phase suivante.'], 'ws'],
      ['Étape 4 · Chaîne des processus', 'Les processus s’alimentent entre eux', ['Chaque processus de bout en bout a un déclencheur, un état final, des entrées et des sorties.', 'La chaîne montre quel processus utilise quelle sortie.', 'Les diagrammes BPMN se consultent, se modifient, s’importent et s’exportent.'], 'chain'],
      ['Étape 5 · Tâche', '« Quoi saisir » pour chaque tâche', ['Le panneau de tâche indique la réponse attendue pour cette organisation et ce secteur.', 'L’aide IA propose un brouillon, étiqueté avec sa confiance et ses sources.', 'Le responsable et l’évaluateur sont toujours deux personnes différentes.'], 'task'],
      ['Étape 6 · Gouvernance', 'Un seul Approbateur par activité', ['Les rôles RACSI sont affectés par activité, avec un seul Approbateur.', 'Risques, contrôles et règles métier sont rattachés aux processus.', 'Chaque modification d’un champ gouverné est justifiée et tracée.'], 'racsi'],
      ['Étape 7 · Planification', 'Le déroulé sur une frise', ['Phases, processus et tâches sur un même Gantt, avec dépendances.', 'Les barres de synthèse sont calculées à partir des tâches.', 'Imprimer ou enregistrer en PDF.'], 'gantt'],
      ['Étape 8 · Résultats', 'Rapports et questions en langage courant', ['Rapports standard exportés en PDF, Excel et Word.', 'L’assistant IA répond à partir des données de l’organisation, dans les limites des permissions.', 'Les alertes signalent les étapes en retard et les indicateurs hors cible.'], 'reports'],
    ],
    smeE: 'PME', smeT: 'Trois parcours PME, dimensionnés par la complexité', smeS: 'Le score de complexité recommande le parcours ; un autre choix exige une justification.',
    smeTracks: [['T1 · Essentiel', 'Score 0–29', 'Moins de jalons, listes courtes, environ 6 semaines'], ['T2 · Standard', 'Score 30–49', 'Processus clés avec trois jalons'], ['T3 · Étendu', 'Score 50–69', 'Proche du mode complet, documentation allégée']],
    smeTaskE: 'PME', smeTaskT: 'Les mêmes consignes, sur tous les écrans', smeTaskS: 'PME de santé : le panneau de tâche en français, l’espace projet en arabe sur mobile.',
    secE: 'Secteur', core: 'Fonction cœur :', large: 'Grande entreprise', sme: 'PME', themes: 'Thèmes IA prioritaires (grande entreprise)', themesD: 'Thèmes digitaux prioritaires (PME)', runChart: 'Tâches terminées par déroulé (%)', digital: 'Digital', ai: 'IA',
    sumE: 'Ce que montrent les données', sumT: 'Avancement des déroulés IA, par secteur', sumS: 'Grandes entreprises, part des tâches terminées dans le déroulé compétences IA.', sumChart: 'Part des tâches terminées dans le déroulé IA de chaque grande entreprise (%)',
    endE: 'Prochaines étapes', endT: 'Lancer votre propre déroulé', endL: ['Installer : deux dossiers, trois commandes chacun (guide d’installation).', 'Se connecter avec un compte de démonstration et suivre le guide utilisateur.', 'Remplacer l’organisation de démonstration par la vôtre : groupe, organisation, puis projet.'],
    footer: 'CortexSkills', shotCap: 'Capture d’écran de l’application',
  },
}[LANG];

const pres = new PptxGenJS(); pres.layout = 'LAYOUT_WIDE'; pres.title = 'CortexSkills'; pres.author = 'POWERACT Consulting'; pres.lang = LANG === 'fr' ? 'fr-FR' : 'en-GB';
const W = 13.333, H = 7.5, M = 0.6;
let pageNo = 0; let section = '';
const icons = {};
async function icon(name, color = C.white) {
  const k = name + color; if (icons[k]) return icons[k];
  const svg = lucide[name].replace(/stroke="currentColor"/, `stroke="#${color}"`).replace(/width="24"/, 'width="256"').replace(/height="24"/, 'height="256"');
  const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return (icons[k] = 'image/png;base64,' + png.toString('base64'));
}
async function badge(s, name, x, y, d, fill = C.orange) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  const i = d * 0.52; s.addImage({ data: await icon(name), x: x + (d - i) / 2, y: y + (d - i) / 2, w: i, h: i, altText: name });
}
const shadow = () => ({ type: 'outer', color: '808184', blur: 6, offset: 1.5, angle: 90, opacity: 0.18 });
const card = (s, x, y, w, h, fill = C.white) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 0.75 }, rectRadius: 0.12, shadow: shadow() });
function wordmark(s, x, y, size = 11, dark = false) {
  s.addText([{ text: 'POWER', options: { color: dark ? C.white : C.dark, bold: true } }, { text: 'ACT', options: { color: C.orange, bold: true } }], { x, y, w: 2, h: 0.3, fontFace: BODY, fontSize: size, charSpacing: 2, margin: 0, isTextBox: true });
}
function content(eyebrow, title, subtitle) {
  const s = pres.addSlide(); pageNo++; s.background = { color: C.bg };
  s.addText(eyebrow.toUpperCase(), { x: M, y: 0.42, w: 9, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: C.deep, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText(title, { x: M, y: 0.72, w: W - 2 * M, h: 0.75, fontFace: TITLE, fontSize: 32, bold: true, color: C.dark, margin: 0, isTextBox: true, fit: 'shrink' });
  if (subtitle) s.addText(subtitle, { x: M, y: 1.45, w: W - 2 * M, h: 0.4, fontFace: BODY, fontSize: 16, color: C.ink, margin: 0, isTextBox: true });
  wordmark(s, M, H - 0.42, 10);
  s.addText(section, { x: 3, y: H - 0.44, w: 7.3, h: 0.3, fontFace: BODY, fontSize: 10, color: C.medium, align: 'center', margin: 0, isTextBox: true });
  s.addText(String(pageNo), { x: W - M - 1, y: H - 0.44, w: 1, h: 0.3, fontFace: BODY, fontSize: 10, color: C.medium, align: 'right', margin: 0, isTextBox: true });
  return s;
}
function divider(num, title, sub) {
  const s = pres.addSlide(); pageNo++; section = title; s.background = { color: C.dark };
  s.addShape(pres.shapes.OVAL, { x: 9.2, y: -1.6, w: 6.5, h: 6.5, fill: { color: C.orange, transparency: 82 }, line: { color: C.orange, transparency: 100 } });
  s.addShape(pres.shapes.OVAL, { x: 10.6, y: 3.9, w: 3.6, h: 3.6, fill: { color: C.orange, transparency: 70 }, line: { color: C.orange, transparency: 100 } });
  s.addText(num, { x: M, y: 2.1, w: 3, h: 1.2, fontFace: TITLE, fontSize: 72, bold: true, color: C.orange, margin: 0, isTextBox: true });
  s.addText(title, { x: M, y: 3.35, w: 9, h: 0.9, fontFace: TITLE, fontSize: 40, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addText(sub, { x: M, y: 4.3, w: 9, h: 0.5, fontFace: BODY, fontSize: 18, color: 'D9D9DA', margin: 0, isTextBox: true });
  wordmark(s, M, H - 0.5, 11, true);
}
function screenshot(s, file, x, y, w) {
  if (!fs.existsSync(file)) return 0;
  const buf = fs.readFileSync(file); const r = buf.readUInt32BE(20) / buf.readUInt32BE(16); const h = w * r;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, fill: { color: C.white }, line: { color: C.line, width: 0.75 }, rectRadius: 0.08, shadow: shadow() });
  s.addImage({ path: file, x, y, w, h, altText: T.shotCap }); return h;
}
const avg = a => Math.round(a.reduce((p, q) => p + q, 0) / (a.length || 1));
const prog = (seg, run) => avg(SEC.map(r => r.orgs[seg]?.runs[run]?.progress).filter(v => v != null));
const themeList = txt => String(txt || '').split(/\.\s+/).map(x => x.replace(/:\s*impact.*$/i, '').replace(/\s*:\s*impact.*$/i, '').replace(/\s*:\s*(impact|urgence).*$/i, '').replace(/\.$/, '').trim()).filter(Boolean).slice(0, 3);

(async () => {
  // 1 — Title
  { const s = pres.addSlide(); pageNo++; s.background = { color: C.bg };
    wordmark(s, M, 0.5, 16);
    s.addShape(pres.shapes.OVAL, { x: -1.4, y: 4.6, w: 4.4, h: 4.4, fill: { color: C.tint }, line: { color: C.tint } });
    s.addText(T.deckEyebrow.toUpperCase(), { x: M, y: 2.0, w: 5.6, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: C.deep, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText(T.deckTitle, { x: M, y: 2.4, w: 5.6, h: 1.1, fontFace: TITLE, fontSize: 54, bold: true, color: C.dark, margin: 0, isTextBox: true });
    s.addText(T.deckSub, { x: M, y: 3.6, w: 5.3, h: 1.3, fontFace: BODY, fontSize: 20, color: C.ink, margin: 0, isTextBox: true, valign: 'top' });
    s.addText('POWERACT Consulting', { x: M, y: 6.6, w: 5, h: 0.3, fontFace: BODY, fontSize: 11, color: C.medium, margin: 0, isTextBox: true });
    screenshot(s, SHOT('dashboard'), 6.5, 1.35, 6.3); }
  // 2 — Agenda
  { section = T.agenda; const s = content(T.agenda, T.agendaT); const ic = ['RefreshCw', 'MousePointerClick', 'Building', 'LayoutGrid'];
    for (let i = 0; i < 4; i++) { const x = M + i * 3.07, y = 2.3; card(s, x, y, 2.85, 3.6); await badge(s, ic[i], x + 0.3, y + 0.35, 0.8, i === 0 ? C.orange : C.ink);
      s.addText(String(i + 1).padStart(2, '0'), { x: x + 1.95, y: y + 0.4, w: 0.7, h: 0.5, fontFace: TITLE, fontSize: 24, bold: true, color: C.deep, align: 'right', margin: 0, isTextBox: true });
      s.addText(T.ag[i][0], { x: x + 0.3, y: y + 1.4, w: 2.3, h: 0.8, fontFace: TITLE, fontSize: 19, bold: true, color: C.dark, margin: 0, isTextBox: true, valign: 'top' });
      s.addText(T.ag[i][1], { x: x + 0.3, y: y + 2.25, w: 2.3, h: 1.1, fontFace: BODY, fontSize: 14, color: C.ink, margin: 0, isTextBox: true, valign: 'top' }); } }
  // 3 — Lifecycle
  { section = T.lifeE; const s = content(T.lifeE, T.lifeT, T.lifeS);
    const ph = G.phases.filter(p => p.no > 0); const bw = (W - 2 * M - 0.25 * (ph.length - 1)) / ph.length;
    ph.forEach((p, i) => { const x = M + i * (bw + 0.25), y = 2.45; card(s, x, y, bw, 2.7, i === 3 ? C.tint : C.white);
      s.addText(String(p.no), { x: x + 0.2, y: y + 0.2, w: bw - 0.4, h: 0.6, fontFace: TITLE, fontSize: 30, bold: true, color: C.deep, margin: 0, isTextBox: true });
      s.addText(L(p.name), { x: x + 0.2, y: y + 0.85, w: bw - 0.4, h: 0.95, fontFace: BODY, fontSize: 14, bold: true, color: C.dark, margin: 0, isTextBox: true, valign: 'top' });
      s.addText(`${p.e2e.length} ${T.procs}`, { x: x + 0.2, y: y + 1.85, w: bw - 0.4, h: 0.3, fontFace: BODY, fontSize: 12, color: C.ink, margin: 0, isTextBox: true });
      if (p.gate) s.addText(p.gate, { x: x + 0.2, y: y + 2.2, w: 0.7, h: 0.32, fontFace: BODY, fontSize: 11, bold: true, color: C.white, fill: { color: C.ink }, align: 'center', margin: 0, isTextBox: true }); });
    const en0 = G.phases.find(p => p.no === 0);
    card(s, M, 5.55, W - 2 * M, 1.0, C.light); await badge(s, 'Layers', M + 0.25, 5.72, 0.66, C.ink);
    s.addText([{ text: T.enablers + ' — ', options: { bold: true, color: C.dark } }, { text: en0.e2e.join(' · '), options: { color: C.ink } }], { x: M + 1.15, y: 5.7, w: W - 2 * M - 1.4, h: 0.7, fontFace: BODY, fontSize: 15, margin: 0, isTextBox: true, valign: 'middle' }); }
  // 4 — Segments
  { section = T.segE; const s = content(T.segE, T.segT, T.segS);
    const vals = [prog('LARGE', 'Digital'), prog('LARGE', 'AI'), prog('SME', 'Digital'), prog('SME', 'AI')]; const ic = ['Building2', 'Sparkles', 'Store', 'Bot'];
    for (let i = 0; i < 4; i++) { const x = M + (i % 2) * 3.15, y = 2.2 + Math.floor(i / 2) * 2.2; card(s, x, y, 2.95, 2.0);
      await badge(s, ic[i], x + 0.25, y + 0.25, 0.6, i % 2 ? C.orange : C.ink);
      s.addText(T.seg[i], { x: x + 1.0, y: y + 0.22, w: 1.85, h: 0.7, fontFace: BODY, fontSize: 13, bold: true, color: C.dark, margin: 0, isTextBox: true, valign: 'middle' });
      s.addText(vals[i] + '%', { x: x + 0.25, y: y + 0.95, w: 2.5, h: 0.6, fontFace: TITLE, fontSize: 30, bold: true, color: C.deep, margin: 0, isTextBox: true });
      s.addText(`${T.avgProg} · 29 ${T.orgs}`, { x: x + 0.25, y: y + 1.52, w: 2.6, h: 0.3, fontFace: BODY, fontSize: 11, color: C.ink, margin: 0, isTextBox: true }); }
    s.addChart(pres.charts.BAR, [{ name: T.digital, labels: [T.large, T.sme], values: [vals[0], vals[2]] }, { name: T.ai, labels: [T.large, T.sme], values: [vals[1], vals[3]] }],
      { x: 7.2, y: 2.1, w: 5.5, h: 3.9, barDir: 'col', barGrouping: 'clustered', chartColors: [C.medium, C.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 11, dataLabelColor: C.dark, dataLabelFormatCode: '0"%"',
        catAxisLabelColor: C.ink, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 12, valAxisLabelColor: C.medium, valAxisLabelFontSize: 10, valAxisMaxVal: 100, valAxisMinVal: 0, valGridLine: { color: C.line, size: 0.5 }, catGridLine: { style: 'none' },
        showLegend: true, legendPos: 'b', legendFontFace: BODY, legendFontSize: 11, legendColor: C.ink });
    s.addText(T.segChart, { x: 7.2, y: 6.05, w: 5.5, h: 0.4, fontFace: BODY, fontSize: 10, italic: true, color: C.ink, margin: 0, isTextBox: true }); }
  // Section 1 — dynamics
  divider('01', T.d1, T.d1s);
  for (const [i, st] of T.steps.entries()) {
    const s = content(st[0], st[1]); const h = screenshot(s, SHOT(st[3]), M, 1.75, 7.9);
    const x = M + 8.3, w = W - M - x;
    for (const [k, line] of st[2].entries()) { const y = 1.9 + k * 1.45; await badge(s, ['Check', 'ArrowRight', 'ShieldCheck'][k], x, y, 0.5, k === 0 ? C.orange : C.ink);
      s.addText(line, { x: x + 0.7, y: y - 0.05, w: w - 0.7, h: 1.25, fontFace: BODY, fontSize: 15, color: C.dark, margin: 0, isTextBox: true, valign: 'top' }); }
  }
  // Section 2 — SMEs
  divider('02', T.d2, T.d2s);
  { const s = content(T.smeE, T.smeT, T.smeS);
    T.smeTracks.forEach(([a, b, c], i) => { const y = 2.25 + i * 1.35; card(s, M, y, 4.6, 1.15, i === 1 ? C.tint : C.white);
      s.addText(a, { x: M + 0.25, y: y + 0.12, w: 2.6, h: 0.4, fontFace: TITLE, fontSize: 17, bold: true, color: C.dark, margin: 0, isTextBox: true });
      s.addText(b, { x: M + 2.9, y: y + 0.14, w: 1.5, h: 0.35, fontFace: BODY, fontSize: 12, bold: true, color: C.deep, align: 'right', margin: 0, isTextBox: true });
      s.addText(c, { x: M + 0.25, y: y + 0.55, w: 4.1, h: 0.5, fontFace: BODY, fontSize: 13, color: C.ink, margin: 0, isTextBox: true }); });
    screenshot(s, SHOT(LANG === 'fr' ? 'sme_ws' : 'sme_ws2'), 5.6, 2.05, 7.1); }
  { const s = content(T.smeTaskE, T.smeTaskT, T.smeTaskS); screenshot(s, SHOT(LANG === 'fr' ? 'sme_task' : 'sme_task2'), M, 2.05, 8.6);
    const m = path.join(__dirname, 'shots/en/m_ar.png'); if (fs.existsSync(m)) screenshot(s, m, 10.0, 2.05, 2.35); }
  // Section 3 — sectors
  divider('03', T.d3, T.d3s);
  for (const r of SEC) {
    const lg = r.orgs.LARGE, sm = r.orgs.SME, v = r.vertical;
    const sub = `${L(v.parentName)} · ${T.core} ${L(v.coreFunction?.name)} · ${(v.standards || []).join(', ')}`;
    const s = content(`${T.secE} · ${r.code}`, L(r.name), sub);
    screenshot(s, path.join(__dirname, 'shots', 'sectors_' + LANG, r.code + '.png'), M, 2.05, 7.3);
    const x = 8.3, w = W - M - x;
    [[T.large, lg], [T.sme, sm]].forEach(([k, o], i) => s.addText([{ text: k + ' — ', options: { bold: true, color: C.dark } }, { text: L(o.name), options: { color: C.ink } }], { x, y: 1.98 + i * 0.3, w, h: 0.3, fontFace: BODY, fontSize: 12, margin: 0, isTextBox: true, fit: 'shrink' }));
    s.addChart(pres.charts.BAR, [{ name: T.digital, labels: [T.sme, T.large], values: [sm.runs.Digital.progress, lg.runs.Digital.progress] }, { name: T.ai, labels: [T.sme, T.large], values: [sm.runs.AI.progress, lg.runs.AI.progress] }],
      { x: x - 0.1, y: 2.62, w: w + 0.1, h: 1.75, barDir: 'bar', barGrouping: 'clustered', chartColors: [C.medium, C.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 10, dataLabelColor: C.dark, dataLabelFormatCode: '0"%"',
        catAxisLabelColor: C.ink, catAxisLabelFontSize: 11, valAxisHidden: true, valAxisMaxVal: 115, valAxisMinVal: 0, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: true, legendPos: 'b', legendFontSize: 10, legendColor: C.ink });
    s.addText(T.runChart, { x, y: 4.37, w, h: 0.26, fontFace: BODY, fontSize: 10, italic: true, color: C.ink, margin: 0, isTextBox: true });
    const lists = [[T.themes, themeList(L(lg.runs.AI.samples['UFT-03-04']?.guidance)), 'Sparkles'], [T.themesD, (v.themes?.digital || []).slice(0, 3).map(L), 'MonitorSmartphone']];
    for (const [i, [head, items, ic]] of lists.entries()) { const y = 4.75 + i * 1.02;
      await badge(s, ic, x, y, 0.34, i ? C.ink : C.orange);
      s.addText(head, { x: x + 0.45, y: y + 0.02, w: w - 0.45, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: C.dark, margin: 0, isTextBox: true });
      s.addText(items.map((t, j) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: j < items.length - 1 } })), { x: x + 0.45, y: y + 0.32, w: w - 0.45, h: 0.66, fontFace: BODY, fontSize: 10.5, color: C.ink, margin: 0, isTextBox: true, valign: 'top', fit: 'shrink' }); }
  }
  // Summary chart
  { section = T.sumE; const s = content(T.sumE, T.sumT, T.sumS); const rows = SEC.map(r => [r.code, r.orgs.LARGE.runs.AI.progress]).sort((a, b) => b[1] - a[1]);
    s.addChart(pres.charts.BAR, [{ name: T.ai, labels: rows.map(r => r[0]), values: rows.map(r => r[1]) }], { x: M, y: 1.95, w: W - 2 * M, h: 4.55, barDir: 'col', chartColors: [C.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 8, dataLabelColor: C.dark, dataLabelFormatCode: '0',
      catAxisLabelColor: C.ink, catAxisLabelFontSize: 9, valAxisLabelColor: C.medium, valAxisLabelFontSize: 9, valAxisMaxVal: 100, valAxisMinVal: 0, valGridLine: { color: C.line, size: 0.5 }, catGridLine: { style: 'none' }, showLegend: false });
    s.addText(T.sumChart, { x: M, y: 6.5, w: W - 2 * M, h: 0.3, fontFace: BODY, fontSize: 10, italic: true, color: C.ink, margin: 0, isTextBox: true }); }
  // Closing
  { section = T.endE; const s = content(T.endE, T.endT); const ic = ['Download', 'LogIn', 'Building2'];
    for (const [i, l] of T.endL.entries()) { const y = 2.2 + i * 1.3; card(s, M, y, 7.6, 1.05); await badge(s, ic[i], M + 0.25, y + 0.2, 0.65, i === 0 ? C.orange : C.ink);
      s.addText(l, { x: M + 1.15, y: y + 0.1, w: 6.2, h: 0.85, fontFace: BODY, fontSize: 16, color: C.dark, margin: 0, isTextBox: true, valign: 'middle' }); }
    screenshot(s, SHOT('assistant'), 8.7, 2.2, 4.0); }
  fs.mkdirSync(out, { recursive: true });
  const f = path.join(out, `CortexSkills_Presentation_${LANG.toUpperCase()}.pptx`); await pres.writeFile({ fileName: f }); console.log('written', f, pageNo, 'slides');
})();
