// Healthcare full case presentation: the training engineering project of the Regional Hospital Centre (AI skills run,
// 100 % complete) and the documents it produced — Training Engineering Report, Training Plan and the 37 published documents.
// Every figure comes from case-data.json (extract-case.mjs) and case-pages.json (page counts of the exported PDFs).
// Run: node build-case-deck.cjs en|fr [outDir]
const path = require('path'); const fs = require('fs');
const PptxGenJS = require('pptxgenjs'); const sharp = require('sharp'); const lucide = require('lucide-static');
const LANG = process.argv[2] === 'fr' ? 'fr' : 'en';
const out = process.argv[3] || path.join(__dirname, '../../deliverables');
const t = (en, fr) => (LANG === 'fr' ? fr : en);
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'case-data.json'), 'utf8'));
const PAGES = fs.existsSync(path.join(__dirname, 'case-pages.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'case-pages.json'), 'utf8'))[LANG] || {} : {};
const L = x => (x && typeof x === 'object' && !Array.isArray(x) ? x[LANG] ?? x.en ?? '' : x ?? '');
const DOCS = D.documents[LANG]; const TER = DOCS['DT-TER'].sections; const PLAN = DOCS['DT-PLAN'].sections;
const sec = (list, ...prefixes) => list.find(s => prefixes.some(p => (s.heading || '').startsWith(p)));
const rowsOf = (list, ...p) => sec(list, ...p)?.table?.rows || [];
const textOf = (list, ...p) => sec(list, ...p)?.table?.intro || sec(list, ...p)?.text || '';
const N = s => Number(String(s).replace(/[^\d.,-]/g, '').replace(/,/g, '').replace(/\s/g, '')) || 0;
const num = n => Math.round(n).toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-US').replace(/ /g, ' ');
const C = { orange: 'F8931D', deep: 'E07B00', tint: 'FDEEDA', dark: '3A3A3C', ink: '58595B', medium: '808184', light: 'F2F2F3', line: 'E3E3E4', bg: 'FDFDFC', white: 'FFFFFF' };
const ST = ['F4C7C3', 'FBE0B5', 'FFF3B0', 'D9EAD3', 'B6D7A8'];
const TITLE = 'Cambria', BODY = 'Calibri';
const W = 13.333, H = 7.5, M = 0.6;
const SHOTS = path.join(__dirname, 'shots/case', LANG);
const org = L(D.org.name), proj = D.project;

const pres = new PptxGenJS(); pres.layout = 'LAYOUT_WIDE'; pres.author = 'POWERACT Consulting'; pres.lang = LANG === 'fr' ? 'fr-FR' : 'en-GB';
pres.title = t('Healthcare full case — Training engineering project', 'Cas complet santé — Projet d’ingénierie de formation');
let pageNo = 0, section = '';
const icons = {};
async function icon(name, color = C.white) {
  const k = name + color; if (icons[k]) return icons[k];
  const svg = lucide[name].replace(/stroke="currentColor"/, `stroke="#${color}"`).replace(/width="24"/, 'width="256"').replace(/height="24"/, 'height="256"');
  return (icons[k] = 'image/png;base64,' + (await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer()).toString('base64'));
}
async function badge(s, name, x, y, d, fill = C.orange) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  const i = d * 0.52; s.addImage({ data: await icon(name), x: x + (d - i) / 2, y: y + (d - i) / 2, w: i, h: i, altText: name });
}
const shadow = () => ({ type: 'outer', color: '808184', blur: 6, offset: 1.5, angle: 90, opacity: 0.18 });
const card = (s, x, y, w, h, fill = C.white) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 0.75 }, rectRadius: 0.12, shadow: shadow() });
const txt = (s, tx, x, y, w, h, o = {}) => s.addText(tx, { x, y, w, h, fontFace: BODY, fontSize: 14, color: C.dark, margin: 0, isTextBox: true, valign: 'top', ...o });
const cap = (s, tx, x, y, w) => txt(s, tx, x, y, w, 0.3, { fontSize: 10, italic: true, color: C.ink });
function wordmark(s, x, y, size = 11, dark = false) {
  s.addText([{ text: 'POWER', options: { color: dark ? C.white : C.dark, bold: true } }, { text: 'ACT', options: { color: C.orange, bold: true } }], { x, y, w: 2, h: 0.3, fontFace: BODY, fontSize: size, charSpacing: 2, margin: 0, isTextBox: true });
}
function content(eyebrow, title, subtitle) {
  const s = pres.addSlide(); pageNo++; s.background = { color: C.bg };
  txt(s, eyebrow.toUpperCase(), M, 0.42, 11, 0.3, { fontSize: 12, bold: true, color: C.deep, charSpacing: 3 });
  txt(s, title, M, 0.72, W - 2 * M, 0.75, { fontFace: TITLE, fontSize: 28, bold: true, fit: 'shrink', valign: 'middle' });
  if (subtitle) txt(s, subtitle, M, 1.45, W - 2 * M, 0.4, { fontSize: 15, color: C.ink });
  wordmark(s, M, H - 0.42, 10);
  txt(s, section + '  ·  ' + t('Demonstration data — fictional organization', 'Données de démonstration — organisation fictive'), 2.6, H - 0.44, 8.1, 0.3, { fontSize: 10, color: C.medium, align: 'center' });
  txt(s, String(pageNo), W - M - 1, H - 0.44, 1, 0.3, { fontSize: 10, color: C.medium, align: 'right' });
  return s;
}
function divider(no, title, sub) {
  const s = pres.addSlide(); pageNo++; section = title; s.background = { color: C.dark };
  s.addShape(pres.shapes.OVAL, { x: 9.2, y: -1.6, w: 6.5, h: 6.5, fill: { color: C.orange, transparency: 82 }, line: { color: C.orange, transparency: 100 } });
  s.addShape(pres.shapes.OVAL, { x: 10.6, y: 3.9, w: 3.6, h: 3.6, fill: { color: C.orange, transparency: 70 }, line: { color: C.orange, transparency: 100 } });
  txt(s, no, M, 2.1, 3, 1.2, { fontFace: TITLE, fontSize: 72, bold: true, color: C.orange });
  txt(s, title, M, 3.35, 9, 0.9, { fontFace: TITLE, fontSize: 40, bold: true, color: C.white });
  txt(s, sub, M, 4.3, 9, 0.9, { fontSize: 18, color: 'D9D9DA' });
  wordmark(s, M, H - 0.5, 11, true);
}
function screenshot(s, name, x, y, w, maxH = 5) {
  const file = path.join(SHOTS, name + '.png');
  if (!fs.existsSync(file)) { console.warn('missing', file); return 0; }
  const buf = fs.readFileSync(file); const r = buf.readUInt32BE(20) / buf.readUInt32BE(16); let h = w * r; if (h > maxH) { h = maxH; w = h / r; }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, fill: { color: C.white }, line: { color: C.line, width: 0.75 }, rectRadius: 0.08, shadow: shadow() });
  s.addImage({ path: file, x, y, w, h, altText: t('Screenshot of the application', 'Capture d’écran de l’application') }); return h;
}
function table(s, head, rows, x, y, w, colW, o = {}) {
  const f = o.fontSize || 11;
  const data = [head.map(h => ({ text: String(h), options: { bold: true, color: C.white, fill: { color: C.orange }, fontSize: f } })),
    ...rows.map((r, i) => r.map(c => { const cell = c !== null && typeof c === 'object' && 'text' in c ? c : { text: L(c) }; return { text: String(cell.text ?? ''), options: { color: C.dark, fill: { color: cell.fill || (i % 2 ? C.light : C.white) }, fontSize: f, bold: !!cell.bold, align: cell.align } }; }))];
  s.addTable(data, { x, y, w, colW, fontFace: BODY, border: { type: 'solid', pt: 0.5, color: C.line }, margin: 0.06, rowH: o.rowH || 0.3, valign: 'middle', autoPage: false });
}
async function kpi(s, x, y, w, value, label, ic, fill = C.orange) {
  card(s, x, y, w, 1.35); await badge(s, ic, x + 0.22, y + 0.22, 0.5, fill);
  txt(s, value, x + 0.85, y + 0.14, w - 1, 0.6, { fontFace: TITLE, fontSize: 25, bold: true, color: C.deep, valign: 'middle', fit: 'shrink' });
  txt(s, label, x + 0.22, y + 0.82, w - 0.4, 0.46, { fontSize: 11.5, color: C.ink });
}
async function bullets(s, items, x, y, w, gap = 0.8, f = 14) {
  for (const [k, line] of items.entries()) { const yy = y + k * gap; await badge(s, ['Check', 'ArrowRight', 'ShieldCheck', 'CircleDot', 'Target', 'Info'][k % 6], x, yy, 0.42, k === 0 ? C.orange : C.ink);
    txt(s, line, x + 0.6, yy - 0.03, w - 0.6, gap - 0.08, { fontSize: f }); }
}
const axis = { catAxisLabelColor: C.ink, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 11, valAxisLabelColor: C.medium, valAxisLabelFontSize: 10, valGridLine: { color: C.line, size: 0.5 }, catGridLine: { style: 'none' }, legendFontFace: BODY, legendFontSize: 11, legendColor: C.ink, dataLabelColor: C.dark, dataLabelFontSize: 10 };
const short = (s, n = 60) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

(async () => {
  const sample = rowsOf(TER, '1.6 '); const byPop = rowsOf(TER, '1.11 '); const byFn = rowsOf(TER, '1.12 '); const byCh = rowsOf(TER, '1.13 ');
  const invited = byPop.reduce((a, r) => a + N(r[1]), 0), responded = byPop.reduce((a, r) => a + N(r[2]), 0);
  const prio = rowsOf(TER, '5. '); const trainings = rowsOf(TER, '5.1 '); const budget = rowsOf(TER, '5.7 '); const total = budget.find(r => /Total/.test(r[0])) || [];
  const evals = rowsOf(TER, '5.9 '); const certs = rowsOf(TER, '5.10 ');
  const docCodes = Object.keys(DOCS); const totalPages = docCodes.reduce((a, c) => a + (PAGES[c] || 0), 0);
  const tasks = (D.workspace.phases || []).flatMap(p => p.items || []); const nTasks = tasks.reduce((a, r) => a + (r.tasks || r.task_count || 0), 0);

  // 1 — Title
  { const s = pres.addSlide(); pageNo++; s.background = { color: C.bg }; wordmark(s, M, 0.5, 16);
    s.addShape(pres.shapes.OVAL, { x: -1.4, y: 4.6, w: 4.4, h: 4.4, fill: { color: C.tint }, line: { color: C.tint } });
    txt(s, t('FULL CASE · HEALTHCARE · 2026', 'CAS COMPLET · SANTÉ · 2026'), M, 1.75, 6, 0.35, { fontSize: 13, bold: true, color: C.deep, charSpacing: 3 });
    txt(s, t('AI skills training engineering at a regional hospital', 'Ingénierie de formation aux compétences IA dans un centre hospitalier régional'), M, 2.15, 5.9, 1.9, { fontFace: TITLE, fontSize: 36, bold: true, fit: 'shrink' });
    txt(s, t(`${org}: from scope to evaluation — the project, the Training Engineering Report, the Training Plan and every document produced with CortexSkills`, `${org} : du périmètre à l’évaluation — le projet, le Rapport d’ingénierie de formation, le Plan de formation et chaque document produit avec CortexSkills`), M, 4.15, 5.6, 1.4, { fontSize: 17, color: C.ink });
    txt(s, 'POWERACT Consulting', M, 6.6, 5, 0.3, { fontSize: 11, color: C.medium });
    screenshot(s, 'project_workspace', 6.6, 1.35, 6.2); }

  // 2 — Agenda
  { section = t('Agenda', 'Sommaire'); const s = content(t('Agenda', 'Sommaire'), t('How the case is presented', 'Déroulé de la présentation'));
    const ag = [['01', t('The hospital and the project', 'L’hôpital et le projet'), t('Context, charter, scope, method, schedule', 'Contexte, charte, périmètre, méthode, calendrier'), 'Hospital'],
      ['02', t('Diagnosis', 'Diagnostic'), t('Questionnaires, maturity, skill gaps, needs', 'Questionnaires, maturité, écarts, besoins'), 'Stethoscope'],
      ['03', t('Training Engineering Report', 'Rapport d’ingénierie de formation'), t('Structure, roadmap, risks', 'Structure, feuille de route, risques'), 'FileText'],
      ['04', t('Training Plan', 'Plan de formation'), t('Programs, trainings, agendas, budget', 'Programmes, formations, déroulés, budget'), 'GraduationCap'],
      ['05', t('Delivery and evaluation', 'Déploiement et évaluation'), t('Kirkpatrick, certifications, lessons', 'Kirkpatrick, certifications, retours'), 'ChartColumn'],
      ['06', t('Documents produced', 'Documents produits'), t(`${docCodes.length} published documents`, `${docCodes.length} documents publiés`), 'FileStack']];
    for (let i = 0; i < 6; i++) { const x = M + (i % 3) * 4.1, y = 2.0 + Math.floor(i / 3) * 2.35; card(s, x, y, 3.85, 2.1);
      await badge(s, ag[i][3], x + 0.3, y + 0.3, 0.7, i === 0 ? C.orange : C.ink);
      txt(s, ag[i][0], x + 2.9, y + 0.35, 0.7, 0.5, { fontFace: TITLE, fontSize: 22, bold: true, color: C.deep, align: 'right' });
      txt(s, ag[i][1], x + 0.3, y + 1.1, 3.3, 0.45, { fontFace: TITLE, fontSize: 17, bold: true, fit: 'shrink' });
      txt(s, ag[i][2], x + 0.3, y + 1.52, 3.3, 0.5, { fontSize: 13, color: C.ink }); } }

  // 3 — Executive summary
  { section = t('Executive summary', 'Synthèse'); const s = content(t('Executive summary', 'Synthèse'), t('A complete AI skills cycle, documented end to end', 'Un cycle complet de compétences IA, documenté de bout en bout'), `${org} · ${num(D.org.employees)} ${t('employees', 'collaborateurs')} · ${L(proj.name)}`);
    await kpi(s, M, 2.0, 2.9, `${Math.round(proj.progress)} %`, t(`of the run completed — ${tasks.length} end-to-end processes`, `du déroulé réalisé — ${tasks.length} processus de bout en bout`), 'CircleCheck');
    await kpi(s, M + 3.07, 2.0, 2.9, `${responded} / ${invited}`, t(`people answered the questionnaires (${Math.round(responded / invited * 100)} %)`, `personnes ont répondu aux questionnaires (${Math.round(responded / invited * 100)} %)`), 'ClipboardList', C.ink);
    await kpi(s, M + 6.14, 2.0, 2.9, `${prio.length}`, t(`trainings in ${rowsOf(PLAN, 'Programs', 'Programmes').length} programs, prioritized by impact`, `formations dans ${rowsOf(PLAN, 'Programs', 'Programmes').length} programmes, priorisées par impact`), 'GraduationCap', C.ink);
    await kpi(s, M + 9.21, 2.0, 2.9, total[1] || '—', t(`training budget; ${total[4] || '—'} spent`, `budget de formation ; ${total[4] || '—'} consommés`), 'Wallet', C.ink);
    card(s, M, 3.6, W - 2 * M, 3.1);
    txt(s, t('What the case shows', 'Ce que montre le cas'), M + 0.35, 3.8, 6, 0.4, { fontFace: TITLE, fontSize: 18, bold: true });
    const mat = rowsOf(TER, '1.9 '); const weakest = [...mat].sort((a, b) => N(a[1]) - N(b[1]))[0] || [];
    const gaps = rowsOf(TER, '3.40'); const worstGap = [...gaps].sort((a, b) => N(b[3]) - N(a[3]))[0] || [];
    await bullets(s, [
      t(`Diagnosis: “${weakest[0]}” is the weakest axis (${weakest[1]} / 5); the largest skill gap is “${worstGap[0]}” (average gap ${worstGap[3]}).`, `Diagnostic : « ${weakest[0]} » est l’axe le plus faible (${weakest[1]} / 5) ; le plus grand écart est « ${worstGap[0]} » (écart moyen ${worstGap[3]}).`),
      t(`${rowsOf(TER, '3.41').length} training needs were validated and grouped into ${prio.length} themes, delivered in ${rowsOf(TER, '4.1 ').length} roadmap initiatives over three waves.`, `${rowsOf(TER, '3.41').length} besoins de formation ont été validés et regroupés en ${prio.length} thèmes, déployés en ${rowsOf(TER, '4.1 ').length} initiatives sur trois vagues.`),
      t(`Kirkpatrick results: ${evals.map(e => e[2]).join(' · ')} for reaction, learning and behaviour.`, `Résultats Kirkpatrick : ${evals.map(e => e[2]).join(' · ')} pour la réaction, l’apprentissage et le comportement.`),
      t(`${docCodes.length} documents published${totalPages ? `, ${num(totalPages)} pages in total` : ''}; the Training Engineering Report alone has ${PAGES['DT-TER'] || '—'} pages.`, `${docCodes.length} documents publiés${totalPages ? `, ${num(totalPages)} pages au total` : ''} ; le Rapport d’ingénierie de formation compte à lui seul ${PAGES['DT-TER'] || '—'} pages.`)], M + 0.35, 4.35, W - 2 * M - 0.7, 0.58, 13.5); }

  // ---------------------------------------------------------------- 01 The hospital and the project
  divider('01', t('The hospital and the project', 'L’hôpital et le projet'), t('Context, charter, scope, method and schedule', 'Contexte, charte, périmètre, méthode et calendrier'));
  { const s = content(t('Context', 'Contexte'), t(`${org}`, `${org}`), textOf(TER, '1. '));
    const vis = rowsOf(TER, '1.1 ');
    table(s, [t('Topic', 'Sujet'), t('Content', 'Contenu')], vis.slice(0, 7).map(r => [{ text: r[0], bold: true }, short(r[1], 170)]), M, 2.0, 7.4, [2.0, 5.4], { fontSize: 10.5, rowH: 0.55 });
    const org2 = rowsOf(TER, '1.2 ');
    card(s, 8.3, 2.0, 4.43, 4.6); txt(s, t('Organization and headcount', 'Organigramme et effectif'), 8.55, 2.15, 4, 0.4, { fontFace: TITLE, fontSize: 16, bold: true });
    table(s, [t('Function', 'Fonction'), t('People', 'Effectif')], org2.slice(0, 8).map(r => [r[0], r[r.length - 1]]), 8.55, 2.65, 3.95, [2.85, 1.1], { fontSize: 10.5 }); }
  { const s = content(t('Project charter', 'Charte du projet'), L(proj.name), L(proj.description));
    const so = D.records.StrategicObjective || []; const sow = (D.records.ScopeOfWork || [])[0] || {};
    await kpi(s, M, 2.1, 2.9, String(proj.complexity ?? '—'), t('complexity score (out of 100): full run with gates', 'score de complexité (sur 100) : déroulé complet avec jalons'), 'Gauge');
    await kpi(s, M + 3.07, 2.1, 2.9, String((D.records.Stakeholder || []).length), t('stakeholders registered and consulted', 'parties prenantes enregistrées et consultées'), 'Users', C.ink);
    await kpi(s, M + 6.14, 2.1, 2.9, String((D.records.ScopeCriterion || []).length), t('scope criteria approved in the Scope of Work', 'critères de périmètre approuvés'), 'Crosshair', C.ink);
    await kpi(s, M + 9.21, 2.1, 2.9, (sow.decision_levels || []).join(' · ') || '—', t('decision levels covered (strategic, middle, operational)', 'niveaux de décision couverts (stratégique, intermédiaire, opérationnel)'), 'Layers', C.ink);
    card(s, M, 3.75, W - 2 * M, 2.9); txt(s, t('Strategic objectives', 'Objectifs stratégiques'), M + 0.35, 3.95, 6, 0.4, { fontFace: TITLE, fontSize: 18, bold: true });
    await bullets(s, so.map(o => `${o.code} — ${L(o.statement)} (${t('horizon', 'échéance')} ${o.horizon_date})`), M + 0.35, 4.5, W - 2 * M - 0.7, 0.75, 14); }
  { const s = content(t('Method', 'Méthode'), t('Six phases, each closed by a gate with its deliverables', 'Six phases, chacune close par un jalon et ses livrables'), short(textOf(TER, '1.5 '), 160));
    const mission = rowsOf(TER, '1.5 ');
    table(s, [t('Phase', 'Phase'), t('End-to-end processes', 'Processus de bout en bout'), t('Progress', 'Avancement')], mission.map(r => [{ text: r[0], bold: true }, String(r[1]).split('\n').map(x => x.split(' ')[0]).join(' · '), { text: r[2], fill: ST[4] }]), M, 2.0, W - 2 * M, [3.6, 7.1, 1.43], { fontSize: 11, rowH: 0.62 });
    cap(s, t('Source: Training Engineering Report, section 1.5 “The current mission”.', 'Source : Rapport d’ingénierie de formation, section 1.5 « La mission en cours ».'), M, 6.55, 8); }
  { const s = content(t('Schedule', 'Calendrier'), t('Work packages and the Gantt chart', 'Lots de travaux et diagramme de Gantt'));
    const sch = rowsOf(TER, '4.2 ');
    table(s, [t('Work package', 'Lot'), t('Start', 'Début'), t('End', 'Fin'), t('Progress', 'Avancement')], sch, M, 2.0, 4.6, [1.9, 1.0, 1.0, 0.7], { fontSize: 10.5 });
    const cal = rowsOf(PLAN, 'Calendar', 'Calendrier').slice(3);
    if (cal.length) table(s, [t('Sessions', 'Sessions'), t('Date', 'Date')], cal.map(r => [short(r[1], 38), r[2]]), M, 3.6, 4.6, [3.4, 1.2], { fontSize: 10 });
    screenshot(s, 'project_gantt', 5.55, 2.0, 7.2, 4.5); cap(s, t('WBS and Gantt of the project in CortexSkills.', 'WBS et Gantt du projet dans CortexSkills.'), 5.55, 6.6, 7); }

  // ---------------------------------------------------------------- 02 Diagnosis
  divider('02', t('Diagnosis', 'Diagnostic'), t('Who answered, where the hospital stands, which skills are missing', 'Qui a répondu, où en est l’hôpital, quelles compétences manquent'));
  { const s = content(t('Questionnaire campaign', 'Campagne de questionnaires'), t(`${responded} of ${invited} people answered`, `${responded} personnes sur ${invited} ont répondu`), short(textOf(TER, '1.6 '), 150));
    table(s, sample.length ? [t('Function', 'Fonction'), t('General Manager', 'Direction générale'), t('Management', 'Management'), t('Team member', 'Équipe'), t('Responded', 'Répondants')] : [], sample, M, 2.0, 6.3, [2.3, 1.1, 1.0, 0.9, 1.0], { fontSize: 10.5 });
    s.addChart(pres.charts.BAR, [{ name: t('Response rate (%)', 'Taux de réponse (%)'), labels: byFn.map(r => r[0]), values: byFn.map(r => N(r[3])) }], { x: 7.2, y: 1.95, w: 5.5, h: 3.0, barDir: 'bar', chartColors: [C.orange], showValue: true, dataLabelFormatCode: '0"%"', valAxisMaxVal: 100, valAxisMinVal: 0, ...axis, showLegend: false });
    cap(s, t('Response rate by function.', 'Taux de réponse par fonction.'), 7.2, 4.95, 5.5);
    table(s, [t('Channel', 'Canal'), t('Invited', 'Invités'), t('Responded', 'Répondants'), t('Rate', 'Taux'), t('Completeness', 'Complétude')], byCh, 7.2, 5.3, 5.5, [1.5, 0.95, 1.1, 0.85, 1.1], { fontSize: 10.5 });
    cap(s, t('Source: TER sections 1.6, 1.12 and 1.13.', 'Source : RIF sections 1.6, 1.12 et 1.13.'), M, 6.55, 6); }
  { const s = content(t('Diagnosis and maturity', 'Diagnostic et maturité'), t('Five axes scored, maturity one level below target', 'Cinq axes évalués, maturité un niveau sous la cible'));
    const mat = rowsOf(TER, '1.9 '); const mm = rowsOf(TER, '1.10 ');
    s.addChart(pres.charts.BAR, [{ name: t('Score (out of 5)', 'Score (sur 5)'), labels: mat.map(r => r[0]), values: mat.map(r => N(r[1])) }], { x: M, y: 2.0, w: 6.4, h: 3.8, barDir: 'col', chartColors: [C.orange], showValue: true, valAxisMaxVal: 5, valAxisMinVal: 0, ...axis, showLegend: false });
    cap(s, t('Diagnostic score by axis (TER 1.9).', 'Score de diagnostic par axe (RIF 1.9).'), M, 5.85, 6);
    table(s, [t('Axis', 'Axe'), t('Score', 'Score'), t('Reading', 'Lecture')], mat.map(r => [r[0], r[1], { text: r[2], fill: N(r[1]) >= 3.3 ? ST[3] : N(r[1]) >= 2.5 ? ST[1] : ST[0] }]), 7.3, 2.0, 5.43, [1.9, 0.8, 2.73], { fontSize: 10.5 });
    table(s, [t('Model', 'Modèle'), t('Current', 'Actuel'), t('Target', 'Cible'), t('Gap', 'Écart')], mm, 7.3, 4.2, 5.43, [2.6, 0.95, 0.95, 0.93], { fontSize: 10.5 });
    cap(s, t('Maturity models (TER 1.10).', 'Modèles de maturité (RIF 1.10).'), 7.3, 5.15, 5); }
  { const s = content(t('Skill gaps and training needs', 'Écarts de compétences et besoins de formation'), t('From measured gaps to a validated needs register', 'Des écarts mesurés à un registre de besoins validé'));
    const gaps = rowsOf(TER, '3.40'); const needs = rowsOf(TER, '3.41');
    table(s, [t('Competency', 'Compétence'), t('People', 'Personnes'), t('Avg gap', 'Écart moyen'), t('Critical', 'Critiques')], gaps.map(r => [r[0], r[2], { text: r[3], fill: N(r[3]) >= 3 ? ST[0] : N(r[3]) >= 2 ? ST[1] : ST[3] }, r[4]]), M, 2.0, 5.6, [2.9, 0.9, 0.95, 0.85], { fontSize: 10.5 });
    cap(s, t('Skill gaps by competency (TER 3.40).', 'Écarts par compétence (RIF 3.40).'), M, 3.35, 5);
    table(s, ['#', t('Theme', 'Thème'), t('Source', 'Source'), t('Impact', 'Impact'), t('Status', 'Statut')], needs.map(r => [r[0], r[1], r[2], { text: r[3], fill: ST[Math.min(4, Math.max(0, N(r[3]) - 1))] }, r[4]]), 6.45, 2.0, 6.28, [0.35, 3.0, 1.15, 0.75, 1.03], { fontSize: 10 });
    cap(s, t('Training needs register (TER 3.41): every need traced to its source.', 'Registre des besoins (RIF 3.41) : chaque besoin tracé jusqu’à sa source.'), 6.45, 5.45, 6);
    screenshot(s, 'questionnaire', M, 3.8, 5.6, 2.6); }

  // ---------------------------------------------------------------- 03 Training Engineering Report
  divider('03', t('Training Engineering Report', 'Rapport d’ingénierie de formation'), t(`${TER.length} sections, ${PAGES['DT-TER'] || '—'} pages, generated from the run data`, `${TER.length} sections, ${PAGES['DT-TER'] || '—'} pages, générées à partir des données du déroulé`));
  { const s = content(t('Structure of the report', 'Structure du rapport'), DOCS['DT-TER'].title, t(`Version ${DOCS['DT-TER'].version} · author ${DOCS['DT-TER'].author} · approved by ${DOCS['DT-TER'].approver}`, `Version ${DOCS['DT-TER'].version} · auteur ${DOCS['DT-TER'].author} · approuvé par ${DOCS['DT-TER'].approver}`));
    const chapters = TER.filter(x => /^\d+\. /.test(x.heading || '')); const count = no => TER.filter(x => new RegExp('^' + no + '(\\.|\\s)').test(x.heading || '')).length;
    table(s, [t('Chapter', 'Chapitre'), t('Sections', 'Sections')], chapters.map(c => [c.heading, String(count(c.heading.split('.')[0]))]), M, 2.0, 5.6, [4.6, 1.0], { fontSize: 11, rowH: 0.42 });
    cap(s, t('Plus identification, data sources and approval.', 'Plus l’identification, les sources de données et l’approbation.'), M, 6.45, 5.6);
    screenshot(s, 'document_training_engineering_report', 6.5, 2.0, 6.2, 4.4); cap(s, t('The report in the document editor.', 'Le rapport dans l’éditeur de documents.'), 6.5, 6.5, 6); }
  { const s = content(t('Perspectives and roadmap', 'Perspectives et feuille de route'), t('Four initiatives deployed in three waves', 'Quatre initiatives déployées en trois vagues'), short(textOf(TER, '4. '), 170));
    const wave = rowsOf(TER, '4.1 '); const per = rowsOf(TER, '4. ');
    for (const w of [1, 2, 3]) { const x = M + (w - 1) * 4.1; card(s, x, 2.05, 3.85, 2.55, w === 1 ? C.tint : C.white);
      txt(s, t(`Wave ${w}`, `Vague ${w}`), x + 0.3, 2.2, 3.3, 0.45, { fontFace: TITLE, fontSize: 20, bold: true, color: C.deep });
      txt(s, wave.filter(r => N(r[0]) === w).map(r => `• ${r[1]} — ${t('impact', 'impact')} ${r[4]}`).join('\n') || '—', x + 0.3, 2.75, 3.3, 1.8, { fontSize: 13 }); }
    table(s, ['#', t('Improvement axis', 'Axe d’amélioration'), t('Implemented', 'Réalisé'), t('Wave', 'Vague')], per, M, 4.85, W - 2 * M, [0.5, 8.4, 1.6, 1.63], { fontSize: 11 });
    cap(s, t('Source: TER chapter 4 and section 4.1.', 'Source : RIF chapitre 4 et section 4.1.'), M, 6.55, 6); }
  { const s = content(t('Risks, controls and indicators', 'Risques, contrôles et indicateurs'), t('Each risk reduced by named controls', 'Chaque risque réduit par des contrôles nommés'));
    const risks = rowsOf(TER, '6. ').slice(0, 9);
    table(s, ['ID', t('Risk or opportunity', 'Risque ou opportunité'), t('Category', 'Catégorie'), t('Inherent', 'Inhérent'), t('Residual', 'Résiduel'), t('Controls', 'Contrôles')], risks.map(r => [r[0], r[1], r[2], { text: r[3], fill: N(r[3]) >= 16 ? ST[0] : ST[1], align: 'center' }, { text: r[4], fill: N(r[4]) >= 8 ? ST[1] : ST[3], align: 'center' }, r[5]]), M, 2.0, W - 2 * M, [1.0, 4.6, 1.6, 0.95, 0.95, 3.03], { fontSize: 10.5 });
    cap(s, t(`Top 9 of ${rowsOf(TER, '6. ').length} risks by residual score (TER chapter 6); ${rowsOf(TER, '6.1 ').length} project indicators follow in section 6.1.`, `9 premiers risques sur ${rowsOf(TER, '6. ').length} par score résiduel (RIF chapitre 6) ; ${rowsOf(TER, '6.1 ').length} indicateurs du projet suivent en section 6.1.`), M, 5.35, 11); }

  // ---------------------------------------------------------------- 04 Training Plan
  divider('04', t('Training Plan', 'Plan de formation'), short(textOf(PLAN, 'Plan overview', 'Vue d’ensemble'), 140));
  { const s = content(t('Prioritized plan', 'Plan priorisé'), t('Six themes ranked by impact and urgency', 'Six thèmes classés par impact et urgence'), textOf(TER, '5. '));
    table(s, ['#', t('Theme', 'Thème'), t('Days', 'Jours'), t('Groups', 'Groupes'), t('Budget', 'Budget')], prio, M, 2.0, 6.6, [0.4, 3.6, 0.8, 0.8, 1.0], { fontSize: 11, rowH: 0.42 });
    s.addChart(pres.charts.BAR, [{ name: t('Budget', 'Budget'), labels: prio.map(r => short(r[1], 28)), values: prio.map(r => N(r[4])) }], { x: 7.4, y: 1.95, w: 5.3, h: 3.6, barDir: 'bar', chartColors: [C.orange], showValue: true, dataLabelFormatCode: '#,##0', ...axis, valAxisLabelFormatCode: '#,##0', showLegend: false });
    cap(s, t('Budget by theme.', 'Budget par thème.'), 7.4, 5.6, 5); }
  { const s = content(t('Programs and trainings', 'Programmes et formations'), t('Two programs, six trainings, clear prerequisites', 'Deux programmes, six formations, des prérequis clairs'));
    const prg = rowsOf(PLAN, 'Programs', 'Programmes');
    table(s, [t('Code', 'Code'), t('Program', 'Programme'), t('Strategic axis', 'Axe stratégique'), t('Trainings', 'Formations')], prg.map(r => [r[0], r[1], r[2], r[4]]), M, 2.0, W - 2 * M, [1.0, 4.0, 3.7, 3.43], { fontSize: 11 });
    table(s, ['ID', t('Training', 'Formation'), t('Level', 'Niveau'), t('Duration', 'Durée'), t('Prerequisites', 'Prérequis')], trainings.map(r => [r[1], r[2], r[3], r[4], r[5]]), M, 3.2, W - 2 * M, [1.1, 4.0, 1.3, 1.1, 4.63], { fontSize: 10.5, rowH: 0.42 });
    cap(s, t('Source: Training Plan “Programs” and TER section 5.1.', 'Source : Plan de formation « Programmes » et RIF section 5.1.'), M, 6.3, 8); }
  { const ag = rowsOf(PLAN, 'Detailed agendas', 'Programmes détaillés').filter(r => r[0] === 'TR-AI-01');
    const s = content(t('Detailed agenda', 'Programme détaillé'), t(`${trainings[0]?.[2] || 'TR-AI-01'} — half-day by half-day`, `${trainings[0]?.[2] || 'TR-AI-01'} — demi-journée par demi-journée`), t(`${ag.length} activities over ${trainings[0]?.[4] || ''}: lectures, quizzes and workshops on the hospital’s own cases.`, `${ag.length} activités sur ${trainings[0]?.[4] || ''} : exposés, quiz et ateliers sur les cas propres à l’hôpital.`));
    const half = [...new Set(ag.map(r => r[1]))];
    half.slice(0, 6).forEach((h, i) => { const x = M + (i % 3) * 4.1, y = 2.0 + Math.floor(i / 3) * 2.3; card(s, x, y, 3.85, 2.15, i === 0 ? C.tint : C.white);
      txt(s, h, x + 0.25, y + 0.15, 3.4, 0.35, { fontFace: TITLE, fontSize: 14, bold: true, color: C.deep });
      txt(s, ag.filter(r => r[1] === h).map(r => `${String(r[3]).startsWith(r[2]) ? '' : r[2] + ' · '}${short(r[3], 62)} (${r[4]} min)`).join('\n'), x + 0.25, y + 0.55, 3.4, 1.55, { fontSize: 10.5, fit: 'shrink' }); }); }
  { const s = content(t('Value for each persona', 'Valeur pour chaque persona'), t('Why each audience should take the training', 'Pourquoi chaque public doit suivre la formation'), t('Training TR-AI-01 — behaviour, pain points and hopes of each persona', 'Formation TR-AI-01 — comportements, irritants et attentes de chaque persona'));
    const vp = rowsOf(PLAN, 'Value proposition', 'Proposition de valeur').filter(r => r[0] === 'TR-AI-01');
    vp.slice(0, 3).forEach((r, i) => { const x = M + i * 4.1; card(s, x, 2.0, 3.85, 4.5); badge(s, ['Briefcase', 'Users', 'Stethoscope'][i], x + 0.25, 2.2, 0.6, i === 0 ? C.orange : C.ink);
      txt(s, r[1], x + 1.0, 2.2, 2.7, 0.7, { fontFace: TITLE, fontSize: 13.5, bold: true, fit: 'shrink' });
      txt(s, String(r[2]).split(' · ').join('\n\n'), x + 0.25, 3.0, 3.4, 3.4, { fontSize: 10.5, fit: 'shrink' }); }); }
  { const s = content(t('Budget', 'Budget'), t('Allocated, committed, spent and refunds expected', 'Alloué, engagé, consommé et remboursements attendus'), textOf(TER, '5.7 '));
    const lines = budget.filter(r => !/Total/.test(r[0]));
    s.addChart(pres.charts.BAR, [{ name: t('Allocated', 'Alloué'), labels: lines.map(r => short(r[0], 26)), values: lines.map(r => N(r[1])) }, { name: t('Actual', 'Réel'), labels: lines.map(r => short(r[0], 26)), values: lines.map(r => N(r[4])) }],
      { x: M, y: 2.0, w: 7.0, h: 4.2, barDir: 'col', barGrouping: 'clustered', chartColors: [C.ink, C.orange], showLegend: true, legendPos: 'b', ...axis, catAxisLabelFontSize: 9, valAxisLabelFormatCode: '#,##0' });
    cap(s, t('Allocated versus actual by training (TER 5.7).', 'Alloué et réel par formation (RIF 5.7).'), M, 6.25, 6);
    table(s, [t('Line', 'Ligne'), t('Actual', 'Réel'), t('Refund', 'Rembours.')], budget.map(r => [{ text: short(r[0], 30), bold: /Total/.test(r[0]) }, { text: r[4], bold: /Total/.test(r[0]) }, r[5]]), 7.85, 2.0, 4.88, [2.7, 1.1, 1.08], { fontSize: 10.5 });
    const prov = rowsOf(PLAN, 'Training providers', 'Prestataires');
    table(s, [t('Provider', 'Prestataire'), t('Accredited until', 'Agrément jusqu’au'), '/5'], prov, 7.85, 4.75, 4.88, [2.3, 1.8, 0.78], { fontSize: 10.5 }); }

  // ---------------------------------------------------------------- 05 Delivery and evaluation
  divider('05', t('Delivery and evaluation', 'Déploiement et évaluation'), t('Kirkpatrick levels, certifications and lessons learned', 'Niveaux de Kirkpatrick, certifications et retours d’expérience'));
  { const s = content(t('Evaluation', 'Évaluation'), t('Results measured at three Kirkpatrick levels', 'Résultats mesurés sur trois niveaux de Kirkpatrick'));
    const ep = rowsOf(PLAN, 'Evaluation plan', 'Plan d’évaluation');
    for (const [i, e] of evals.entries()) await kpi(s, M + i * 4.1, 2.0, 3.85, e[2], e[0], ['Smile', 'BookOpenCheck', 'Footprints'][i] || 'ChartColumn', i === 0 ? C.orange : C.ink);
    table(s, [t('Level', 'Niveau'), t('What is measured', 'Ce qui est mesuré'), t('When', 'Quand'), t('Instrument', 'Instrument'), t('Results', 'Résultats')], ep, M, 3.65, W - 2 * M, [1.6, 3.4, 2.3, 3.0, 1.83], { fontSize: 10.5 });
    const cnt = k => certs.filter(r => r[4] === k).length;
    txt(s, t(`Certifications (TER 5.10): ${cnt('Valid')} valid, ${cnt('Expiring')} expiring, ${cnt('Expired')} expired — the expired one triggers an alert and a renewal session.`, `Certifications (RIF 5.10) : ${cnt('Valide') + cnt('Valid')} valides, ${cnt('Expire bientôt') + cnt('Expiring')} à échéance proche, ${cnt('Expiré') + cnt('Expirée') + cnt('Expired')} expirée — l’expirée déclenche une alerte et une session de renouvellement.`), M, 5.7, W - 2 * M, 0.6, { fontSize: 13 }); }
  { const rex = (D.records.RexEntry || [])[0] || {}; const s = content(t('Lessons learned', 'Retour d’expérience'), L(rex.title) || t('Lessons learned', 'Retour d’expérience'));
    const cols = [[t('What went well', 'Ce qui a bien fonctionné'), L(rex.what_went_well), ST[3], 'ThumbsUp'], [t('What did not', 'Ce qui n’a pas fonctionné'), L(rex.what_did_not), ST[0], 'TriangleAlert'], [t('What we will do next time', 'Ce que nous ferons la prochaine fois'), L(rex.recommendation || rex.lesson || rex.next_time), ST[1], 'Lightbulb']];
    for (const [i, c] of cols.entries()) { const x = M + i * 4.1; card(s, x, 2.0, 3.85, 3.6, c[2]); await badge(s, c[3], x + 0.3, 2.25, 0.6, i === 0 ? C.orange : C.ink);
      txt(s, c[0], x + 1.05, 2.3, 2.7, 0.55, { fontFace: TITLE, fontSize: 15, bold: true }); txt(s, c[1] || '—', x + 0.3, 3.1, 3.3, 2.4, { fontSize: 13 }); } }

  // ---------------------------------------------------------------- 06 Documents produced
  divider('06', t('Documents produced', 'Documents produits'), t(`${docCodes.length} documents published in ${LANG === 'fr' ? 'French' : 'English'}, each traced to its data`, `${docCodes.length} documents publiés en français, chacun relié à ses données`));
  { const list = docCodes.sort((a, b) => (a.startsWith('DT-E2E') ? Number(a.slice(7)) : 100 + ['DT-TER', 'DT-PLAN', 'DT-AUDIT', 'DT-MASTER'].indexOf(a)) - (b.startsWith('DT-E2E') ? Number(b.slice(7)) : 100 + ['DT-TER', 'DT-PLAN', 'DT-AUDIT', 'DT-MASTER'].indexOf(b)));
    const rows = list.map(c => [c, short(DOCS[c].title.replace(/ — .*$/, ''), 60), String(PAGES[c] || '—')]);
    for (let part = 0; part < 2; part++) {
      const chunk = rows.slice(part * 19, part * 19 + 19); if (!chunk.length) break;
      const s = content(t('Documents produced', 'Documents produits'), part ? t('Documents produced (continued)', 'Documents produits (suite)') : t('Every end-to-end process leaves its document', 'Chaque processus de bout en bout laisse son document'), part ? '' : t(`All published, versioned and approved by a second person${totalPages ? ` — ${num(totalPages)} pages` : ''}.`, `Tous publiés, versionnés et approuvés par une seconde personne${totalPages ? ` — ${num(totalPages)} pages` : ''}.`));
      table(s, [t('Code', 'Code'), t('Document', 'Document'), t('Pages', 'Pages')], chunk.slice(0, 10), M, 2.0, 5.95, [1.25, 4.0, 0.7], { fontSize: 9.5, rowH: 0.36 });
      if (chunk.length > 10) table(s, [t('Code', 'Code'), t('Document', 'Document'), t('Pages', 'Pages')], chunk.slice(10), 6.78, 2.0, 5.95, [1.25, 4.0, 0.7], { fontSize: 9.5, rowH: 0.36 });
    } }
  { const s = content(t('Inside the application', 'Dans l’application'), t('The Training Plan as the users see it', 'Le plan de formation tel que les utilisateurs le voient'));
    screenshot(s, 'document_training_plan', M, 2.0, 6.0, 4.3); cap(s, DOCS['DT-PLAN'].title, M, 6.4, 6);
    screenshot(s, 'training_plan', 6.75, 2.0, 6.0, 4.3); cap(s, t('Training plan screen: programs, trainings and sessions.', 'Écran du plan de formation : programmes, formations et sessions.'), 6.75, 6.4, 6); }

  // Closing
  { section = t('Conclusion', 'Conclusion'); const s = content(t('Conclusion', 'Conclusion'), t('What the hospital has at the end of the cycle', 'Ce que l’hôpital obtient en fin de cycle'));
    await bullets(s, [
      t(`A Training Engineering Report of ${PAGES['DT-TER'] || '—'} pages, built from ${responded} answers, ${(D.records.Stakeholder || []).length} stakeholders and the diagnosis of every function.`, `Un Rapport d’ingénierie de formation de ${PAGES['DT-TER'] || '—'} pages, construit à partir de ${responded} réponses, ${(D.records.Stakeholder || []).length} parties prenantes et du diagnostic de chaque fonction.`),
      t(`A locked Training Plan: ${prio.length} trainings, half-day agendas, a value proposition per persona and a budget of ${total[1] || '—'}.`, `Un Plan de formation verrouillé : ${prio.length} formations, des déroulés par demi-journée, une proposition de valeur par persona et un budget de ${total[1] || '—'}.`),
      t('Evaluation at three Kirkpatrick levels, with certifications followed and alerts on expiry.', 'Une évaluation sur trois niveaux de Kirkpatrick, avec le suivi des certifications et des alertes à échéance.'),
      t(`${docCodes.length} published documents ready for an accreditation audit (ISO 7101, JCI), each traced to the data and the step that produced it.`, `${docCodes.length} documents publiés, prêts pour un audit d’accréditation (ISO 7101, JCI), chacun relié aux données et à l’étape qui l’a produit.`),
      t('Next: waves 2 and 3 of the roadmap and the level-4 (results) evaluation six to twelve months after the trainings.', 'Ensuite : vagues 2 et 3 de la feuille de route et évaluation de niveau 4 (résultats) six à douze mois après les formations.')], M, 2.1, W - 2 * M, 0.85, 15); }

  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, `CortexSkills_Healthcare_Case_${LANG.toUpperCase()}.pptx`);
  await pres.writeFile({ fileName: file }); console.log('written', file, pageNo, 'slides');
})();
