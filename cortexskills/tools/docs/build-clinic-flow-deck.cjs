// Private clinic group case study (Santéora), for a healthcare customer: the full real flow of every end-to-end
// process run in CortexSkills — its macro processes, its tasks with the steps done, who did them and what was entered —
// with screenshots of the application. POWERACT Consulting graphical chart (orange / grey, Cambria titles, Calibri).
// Data: clinic-flow.json (extract-clinic-flow.mjs + enrich-clinic-flow.mjs); screenshots: shots/clinic-flow/<lang>
// (tools/qa/shoot-clinic-flow.mjs). Run: node build-clinic-flow-deck.cjs en|fr [outDir]
const path = require('path'); const fs = require('fs');
const PptxGenJS = require('pptxgenjs'); const sharp = require('sharp'); const lucide = require('lucide-static');
const LANG = process.argv[2] === 'fr' ? 'fr' : 'en';
const OUT = process.argv[3] || path.join(__dirname, '../../deliverables');
const t = (en, fr) => (LANG === 'fr' ? fr : en);
const L = x => (x && typeof x === 'object' && !Array.isArray(x) ? x[LANG] ?? x.en ?? '' : x ?? '');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'clinic-flow.json'), 'utf8'));
const FW = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/seed/content/framework.json'), 'utf8'));
const SH = path.join(__dirname, 'shots/clinic-flow', LANG);
const CACHE = path.join(__dirname, 'shots/clinic-flow', '.jpg-' + LANG); fs.mkdirSync(CACHE, { recursive: true });
const num = n => Number(n).toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-US').replace(/ | /g, ' ');
const fmtDate = d => new Date(d).toLocaleDateString(LANG === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const days = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));

// POWERACT palette (graphical chart §4) and status scale (§6.2).
const C = { orange: 'F8931D', deep: 'E07B00', tint: 'FDEEDA', dark: '3A3A3C', ink: '58595B', medium: '808184', light: 'F2F2F3', line: 'E3E3E4', bg: 'FDFDFC', white: 'FFFFFF', green: 'D9EAD3', blue: '3A6EA5', mgreen: '5AA469' };
const HEAD = 'Cambria', BODY = 'Calibri';
const W = 13.333, H = 7.5, M = 0.5;
const THEME = { name: 'POWERACT', headFontFace: HEAD, bodyFontFace: BODY,
  colors: { dk1: C.dark, lt1: C.white, dk2: C.ink, lt2: C.light, accent1: C.orange, accent2: C.deep, accent3: C.medium, accent4: C.blue, accent5: C.mgreen, accent6: C.tint, hlink: C.deep, folHlink: C.ink } };

const pres = new PptxGenJS(); pres.layout = 'LAYOUT_WIDE'; pres.author = 'POWERACT Consulting'; pres.company = 'POWERACT Consulting';
pres.lang = LANG === 'fr' ? 'fr-FR' : 'en-GB'; pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };
pres.title = t('Private clinic group case study — CortexSkills', 'Étude de cas groupe de cliniques privées — CortexSkills');

// ------------------------------------------------------------------ layouts: content (light), divider (dark), cover
// The POWERACT wordmark (grey POWER, orange ACT), as on the POWERACT documents.
const wordmarkRuns = dark => [{ text: 'POWER', options: { color: dark ? C.white : C.dark } }, { text: 'ACT', options: { color: C.orange } }];
// Layouts take one run per text object: POWER and ACT side by side (POWER is 0.53 in wide at 11 pt in Cambria bold).
const wordmark = (dark = false, x = M, y = 7.02, size = 11) => [
  { text: { text: 'POWER', options: { x, y, w: 0.62 * size / 11, h: 0.26 * size / 11, fontFace: HEAD, fontSize: size, bold: true, color: dark ? C.white : C.dark, margin: 0, valign: 'middle' } } },
  { text: { text: 'ACT', options: { x: x + 0.535 * size / 11, y, w: 0.42 * size / 11, h: 0.26 * size / 11, fontFace: HEAD, fontSize: size, bold: true, color: C.orange, margin: 0, valign: 'middle' } } }];
pres.defineSlideMaster({ title: 'CONTENT', background: { color: C.bg }, margin: [0.5, 0.5, 0.6, 0.5],
  objects: [...wordmark(false), { text: { text: 'CortexSkills · ' + t('Private clinic case study', 'Étude de cas clinique privée'), options: { x: 2.0, y: 7.02, w: 6, h: 0.26, fontFace: BODY, fontSize: 9, color: C.medium, margin: 0, valign: 'middle' } } }],
  slideNumber: { x: 12.3, y: 7.0, w: 0.55, h: 0.3, fontFace: BODY, fontSize: 9, color: C.medium, align: 'right' } });
pres.defineSlideMaster({ title: 'DIVIDER', background: { color: C.dark }, objects: [...wordmark(true)],
  slideNumber: { x: 12.3, y: 7.0, w: 0.55, h: 0.3, fontFace: BODY, fontSize: 9, color: 'BDBDBF', align: 'right' } });
pres.defineSlideMaster({ title: 'COVER', background: { color: C.bg }, objects: [] });

// ------------------------------------------------------------------ helpers
const icons = {};
async function icon(name, color = C.white) {
  const k = name + color; if (icons[k]) return icons[k];
  const svg = lucide[name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')].replace(/stroke="currentColor"/, `stroke="#${color}"`).replace(/width="24"/, 'width="256"').replace(/height="24"/, 'height="256"');
  return (icons[k] = 'image/png;base64,' + (await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer()).toString('base64'));
}
async function badge(s, name, x, y, d, fill = C.orange) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, objectName: 'badge ' + name });
  const i = d * 0.54; s.addImage({ data: await icon(name), x: x + (d - i) / 2, y: y + (d - i) / 2, w: i, h: i, altText: name });
}
/** A screenshot, without the application's side menu when `content`, as a compressed JPEG; returns its aspect ratio. */
const shots = {};
async function shot(name, { content = false } = {}) {
  const k = name + (content ? '-c' : ''); if (shots[k]) return shots[k];
  const src = path.join(SH, name + '.png'); if (!fs.existsSync(src)) throw new Error('missing screenshot ' + src);
  const dst = path.join(CACHE, k + '.jpg');
  let img = sharp(src); const meta = await img.metadata();
  if (content) img = img.extract({ left: 300, top: 0, width: meta.width - 300, height: meta.height });
  if (!fs.existsSync(dst)) await img.resize({ width: 1700, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(dst);
  const m2 = await sharp(dst).metadata();
  return (shots[k] = { path: dst, ratio: m2.width / m2.height });
}
/** Picture in a white card with a subtle shadow, fitted inside the box (x, y, w, h). */
async function picture(s, name, x, y, w, h, opts = {}) {
  const p = await shot(name, opts); let pw = w, ph = w / p.ratio; if (ph > h) { ph = h; pw = h * p.ratio; }
  const px = x + (w - pw) / 2;
  s.addShape(pres.shapes.RECTANGLE, { x: px - 0.06, y: y - 0.06, w: pw + 0.12, h: ph + 0.12, fill: { color: C.white }, line: { color: C.line, width: 0.75 }, shadow: { type: 'outer', color: '000000', opacity: 0.12, blur: 6, offset: 2, angle: 90 }, objectName: 'frame ' + name });
  s.addImage({ path: p.path, x: px, y, w: pw, h: ph, altText: opts.alt || name });
  return { x: px, y, w: pw, h: ph };
}
const head = (s, eyebrow, title, sub) => {
  s.addText(eyebrow.toUpperCase(), { x: M, y: 0.38, w: 12.3, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: C.deep, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText(title, { x: M, y: 0.68, w: 12.3, h: 0.62, fontFace: HEAD, fontSize: 28, bold: true, color: C.dark, margin: 0, valign: 'middle', fit: 'shrink', isTextBox: true });
  if (sub) s.addText(sub, { x: M, y: 1.3, w: 12.3, h: 0.4, fontFace: BODY, fontSize: 14, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
};
const card = (s, x, y, w, h, fill = C.white, name = 'card') => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: C.line, width: 0.5 }, shadow: { type: 'outer', color: '000000', opacity: 0.1, blur: 5, offset: 1.5, angle: 90 }, objectName: name });
const caption = (s, text, x, y, w) => s.addText(text, { x, y, w, h: 0.32, fontFace: BODY, fontSize: 10, italic: true, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
const kpi = (s, x, y, w, value, label, fill = C.white) => {
  card(s, x, y, w, 1.25, fill, 'kpi ' + label);
  s.addText(value, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.62, fontFace: HEAD, fontSize: 32, bold: true, color: C.deep, margin: 0, valign: 'middle', isTextBox: true });
  s.addText(label, { x: x + 0.2, y: y + 0.74, w: w - 0.4, h: 0.42, fontFace: BODY, fontSize: 12, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
};
const cell = (text, o = {}) => ({ text, options: { fontFace: BODY, fontSize: 10, color: C.ink, valign: 'top', margin: [3, 5, 3, 5], ...o } });
const hcell = text => cell(text, { bold: true, color: C.white, fill: { color: C.orange }, valign: 'middle' });
const border = { type: 'solid', pt: 0.5, color: C.line };
let section = ''; const OUTLINE = [];
const slide = (master = 'CONTENT', title = '') => { const s = pres.addSlide({ masterName: master, sectionTitle: section }); OUTLINE.push({ n: OUTLINE.length + 1, section, title }); return s; };
const newSection = title => { section = title; pres.addSection({ title }); };

// ------------------------------------------------------------------ data
const org = L(D.org.name); const runs = D.runs;
const allTasks = runs.flatMap(r => r.tasks); const allSteps = allTasks.flatMap(x => x.steps);
const mpIds = [...new Set(runs.flatMap(r => r.mps.map(m => m.id)))];
const start = allTasks.map(x => x.started).sort()[0], end = allTasks.map(x => x.completed).sort().at(-1);
const PH = Object.fromEntries(FW.phases.map(p => [p.no, { name: { en: p.name[0], fr: p.name[1] }, gate: p.gate }]));
const GATE = Object.fromEntries(FW.gates.map(g => [g.id, { en: g.name[0], fr: g.name[1] }]));
const docsLang = (D.documents || []).filter(d => d.lang === LANG);
const out = (e2e, uft) => L(runs.find(r => r.e2e.id === e2e)?.tasks.find(x => x.uft === uft)?.output);
const must = (text, ...parts) => { for (const p of parts) if (!text.includes(p)) throw new Error(`figure "${p}" not found in "${text}"`); return text; };
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const FITF = path.join(__dirname, `clinic-flow-fit-${LANG}.json`); const FIT = fs.existsSync(FITF) ? JSON.parse(fs.readFileSync(FITF, 'utf8')) : {};

const outEn = (e2e, uft) => runs.find(r => r.e2e.id === e2e)?.tasks.find(x => x.uft === uft)?.output?.en || '';
(async () => {
// ================================================================== 1. cover
{ const s = slide('COVER', 'Cover');
  s.addText(wordmarkRuns(false), { x: M, y: 0.45, w: 3, h: 0.5, fontFace: HEAD, fontSize: 22, bold: true, margin: 0, valign: 'middle', isTextBox: true });
  s.addText('C O N S U L T I N G', { x: M, y: 0.86, w: 3, h: 0.22, fontFace: BODY, fontSize: 9, color: C.medium, margin: 0, isTextBox: true });
  s.addText(t('CASE STUDY · HEALTHCARE · PRIVATE CLINICS', 'ÉTUDE DE CAS · SANTÉ · CLINIQUES PRIVÉES'), { x: M, y: 2.0, w: 7.6, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: C.deep, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText(t('Training engineering for AI skills, end to end', 'L’ingénierie de formation des compétences IA, de bout en bout'), { x: M, y: 2.45, w: 7.9, h: 2.0, fontFace: HEAD, fontSize: 36, bold: true, color: C.dark, margin: 0, valign: 'top', isTextBox: true });
  s.addText(t(`${org}: the real flow of the ${runs.length} end-to-end processes run in CortexSkills — macro processes, tasks and steps`, `${org} : le déroulé réel des ${runs.length} processus de bout en bout exécutés dans CortexSkills — macro-processus, tâches et étapes`),
    { x: M, y: 4.6, w: 7.4, h: 0.9, fontFace: BODY, fontSize: 16, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  s.addText(t('Prepared by POWERACT Consulting · ', 'Préparé par POWERACT Consulting · ') + fmtDate(new Date()), { x: M, y: 6.55, w: 7, h: 0.3, fontFace: BODY, fontSize: 11, color: C.medium, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.OVAL, { x: 8.75, y: 0.95, w: 5.6, h: 5.6, fill: { color: C.tint }, line: { color: C.tint }, objectName: 'decorative circle' });
  s.addShape(pres.shapes.OVAL, { x: 9.15, y: 1.6, w: 4.3, h: 4.3, fill: { color: C.white }, line: { color: C.line, width: 0.75 }, shadow: { type: 'outer', color: '000000', opacity: 0.1, blur: 6, offset: 2, angle: 90 }, objectName: 'logo circle' });
  s.addImage({ path: path.join(__dirname, '../../web/dist/cortexskills-logo.png'), x: 9.75, y: 2.2, w: 3.1, h: 3.1, sizing: { type: 'contain', w: 3.1, h: 3.1 }, altText: 'CortexSkills' });
  s.addNotes(t('Case study of a private clinic group run end to end in CortexSkills. Every figure and every screen comes from the application.', 'Étude de cas d’un groupe de cliniques privées déroulé de bout en bout dans CortexSkills. Chaque chiffre et chaque écran viennent de l’application.')); }

// ================================================================== 2. agenda
newSection(t('Introduction', 'Introduction'));
{ const s = slide('CONTENT', 'Agenda'); head(s, t('Agenda', 'Sommaire'), t('What this case study covers', 'Ce que couvre cette étude de cas'));
  const items = [[t('The client and the project', 'Le client et le projet'), 'building-2'], [t('How CortexSkills structures the work', 'Comment CortexSkills structure le travail'), 'network'],
    ...ORDER.map(no => [`${t('Phase', 'Phase')} ${no} — ${L(PH[no].name)}`, ['layers', 'search', 'stethoscope', 'file-text', 'graduation-cap', 'chart-column', 'users'][no] || 'circle']),
    [t('Results and next steps', 'Résultats et prochaines étapes'), 'target']];
  for (let i = 0; i < items.length; i++) {
    const col = i < 5 ? 0 : 1, row = i < 5 ? i : i - 5, x = M + col * 6.3, y = 1.75 + row * 0.98;
    await badge(s, items[i][1], x, y, 0.62, i >= 2 && i <= 8 ? C.orange : C.ink);
    s.addText(items[i][0], { x: x + 0.82, y, w: 5.3, h: 0.62, fontFace: BODY, fontSize: 16, color: C.dark, margin: 0, valign: 'middle', isTextBox: true });
  } }

// ================================================================== 3. executive summary
{ const s = slide('CONTENT', 'Executive summary'); head(s, t('Executive summary', 'Synthèse'), t(`${runs.length} processes run end to end, 100 % of tasks completed`, `${runs.length} processus déroulés de bout en bout, 100 % des tâches terminées`),
    t(`${fmtDate(start)} – ${fmtDate(end)} · ${D.people.length} people involved · every figure below is read from the application`, `${fmtDate(start)} – ${fmtDate(end)} · ${D.people.length} personnes impliquées · chaque chiffre ci-dessous est lu dans l’application`));
  const k = [[String(runs.length), t('end-to-end processes (33 standard + 2 healthcare)', 'processus de bout en bout (33 standard + 2 santé)')], [String(mpIds.length), t('macro processes involved', 'macro-processus mobilisés')],
    [String(allTasks.length), t('tasks completed, none overdue', 'tâches terminées, aucune en retard')], [String(allSteps.length), t('steps executed', 'étapes exécutées')]];
  k.forEach(([v, l], i) => kpi(s, M + i * 3.13, 1.95, 2.93, v, l));
  const msgs = [['clipboard-check', t('Scope and evidence first', 'Le périmètre et les preuves d’abord'), t('40 stakeholders registered, 24 AI-generated questions validated, 187 responses collected before any decision.', '40 parties prenantes enregistrées, 24 questions générées par l’IA et validées, 187 réponses collectées avant toute décision.')],
    ['file-check', t('A plan approved on facts', 'Un plan approuvé sur des faits'), t('23 needs grouped into 6 themes; net budget 1,330,000 MAD approved by the Steering Committee.', '23 besoins regroupés en 6 thèmes ; budget net de 1 330 000 MAD approuvé par le comité de pilotage.')],
    ['trending-up', t('Delivery measured up to impact', 'Un déploiement mesuré jusqu’à l’impact'), t('Test scores from 48 % to 81 %; 9 of 11 supervisors apply the routine at day 30; ROI 22 %.', 'Scores de 48 % à 81 % ; 9 superviseurs sur 11 appliquent la routine à J+30 ; ROI de 22 %.')]];
  must(outEn('E2E-32', 'UFT-32-06'), '40'); must(outEn('E2E-33', 'UFT-33-02'), '24'); must(outEn('E2E-03', 'UFT-03-06'), '187'); must(outEn('E2E-03', 'UFT-03-05'), '23 needs', '6 themes');
  must(outEn('E2E-01', 'UFT-01-05'), '1,330,000'); must(outEn('E2E-07', 'UFT-07-04'), '48%', '81%'); must(outEn('E2E-07', 'UFT-07-05'), '9 of 11'); must(outEn('E2E-07', 'UFT-07-03'), '4.3'); must(outEn('E2E-08', 'UFT-08-05'), '22%', '1.22');
  for (let i = 0; i < 3; i++) {
    const x = M + i * 4.15; card(s, x, 3.5, 3.95, 3.15, C.white, 'message ' + i); await badge(s, msgs[i][0], x + 0.3, 3.8, 0.66);
    s.addText(msgs[i][1], { x: x + 0.3, y: 4.6, w: 3.4, h: 0.55, fontFace: HEAD, fontSize: 17, bold: true, color: C.dark, margin: 0, valign: 'top', isTextBox: true });
    s.addText(msgs[i][2], { x: x + 0.3, y: 5.2, w: 3.4, h: 1.3, fontFace: BODY, fontSize: 14, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  }
  s.addNotes(t('Three messages: the evidence comes first, the plan is approved on facts, and delivery is measured up to business impact.', 'Trois messages : les preuves d’abord, un plan approuvé sur des faits, un déploiement mesuré jusqu’à l’impact métier.')); }

// ================================================================== 4. the client
{ const s = slide('CONTENT', 'The client'); head(s, t('The client', 'Le client'), org, L(D.project.description));
  const facts = [[t('Sector', 'Secteur'), t('Healthcare providers — private clinics', 'Établissements de santé — cliniques privées')], [t('Size', 'Taille'), t(`${num(D.org.employees)} employees, large organization`, `${num(D.org.employees)} salariés, grande organisation`)],
    [t('Headquarters', 'Siège'), `${D.org.city}, ${t('Morocco', 'Maroc')}`], [t('Project', 'Projet'), L(D.project.name)], [t('Focus', 'Orientation'), t('AI skills', 'Compétences IA')],
    [t('Period', 'Période'), `${fmtDate(start)} – ${fmtDate(end)}`], [t('Languages', 'Langues'), t('French, English, Arabic', 'Français, anglais, arabe')]];
  s.addTable([[hcell(t('Fact', 'Élément')), hcell(t('Value', 'Valeur'))], ...facts.map(([a, b], i) => [cell(a, { bold: true, color: C.dark, fontSize: 12, fill: { color: i % 2 ? C.light : C.white } }), cell(b, { fontSize: 12, fill: { color: i % 2 ? C.light : C.white } })])],
    { x: M, y: 2.0, w: 6.1, colW: [1.7, 4.4], border, rowH: 0.42 });
  card(s, 6.95, 2.0, 5.88, 4.7, C.tint, 'objectives'); await badge(s, 'target', 7.25, 2.25, 0.62);
  s.addText(t('Strategic objectives entered in the application', 'Objectifs stratégiques saisis dans l’application'), { x: 8.05, y: 2.25, w: 4.6, h: 0.62, fontFace: HEAD, fontSize: 16, bold: true, color: C.dark, margin: 0, valign: 'middle', isTextBox: true });
  const so = out('E2E-01', 'UFT-01-01').split(/(?=SO-2)/);
  s.addText([...so.map((x, i) => ({ text: x.trim(), options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } })), { text: out('E2E-01', 'UFT-01-03'), options: { bullet: true } }],
    { x: 7.25, y: 3.05, w: 5.35, h: 3.5, fontFace: BODY, fontSize: 14, color: C.dark, margin: 0, valign: 'top', isTextBox: true });
  s.addNotes(t('The client and what it wanted: the two strategic objectives typed in step MP-01.1 and the priority competency families.', 'Le client et ce qu’il voulait : les deux objectifs stratégiques saisis à l’étape MP-01.1 et les familles de compétences prioritaires.')); }

// ================================================================== 5. how the work is structured
{ const s = slide('CONTENT', 'Structure'); head(s, t('How CortexSkills structures the work', 'Comment CortexSkills structure le travail'), t('Four levels, from the value stream down to the step that is typed', 'Quatre niveaux, du flux de valeur jusqu’à l’étape saisie'));
  const r = runs.find(x => x.e2e.id === 'E2E-33'); const tk = r.tasks.find(x => x.uft === 'UFT-33-04'); const st = tk.steps[0];
  const lv = [['workflow', t('End-to-end process', 'Processus de bout en bout'), `${r.e2e.id} · ${L(r.e2e.name)}`, t(`${runs.length} run in this case`, `${runs.length} exécutés dans ce cas`)],
    ['boxes', t('Macro process', 'Macro-processus'), `${st.mp} · ${L(st.mpName)}`, t(`${mpIds.length} involved`, `${mpIds.length} mobilisés`)],
    ['list-checks', t('Task', 'Tâche'), `${tk.uft} · ${L(tk.name)}`, t(`${allTasks.length} completed`, `${allTasks.length} terminées`)],
    ['square-pen', t('Step', 'Étape'), `${st.id} · ${L(st.name)}`, t(`${allSteps.length} executed`, `${allSteps.length} exécutées`)]];
  for (let i = 0; i < 4; i++) {
    const x = M + i * 3.15; card(s, x, 1.95, 2.85, 2.9, C.white, 'level ' + i); await badge(s, lv[i][0], x + 0.25, 2.2, 0.6, i === 3 ? C.orange : C.ink);
    s.addText(lv[i][1], { x: x + 0.25, y: 2.92, w: 2.4, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: C.dark, margin: 0, isTextBox: true });
    s.addText(lv[i][2], { x: x + 0.25, y: 3.35, w: 2.4, h: 0.95, fontFace: BODY, fontSize: 13, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
    s.addText(lv[i][3], { x: x + 0.25, y: 4.3, w: 2.4, h: 0.35, fontFace: BODY, fontSize: 12, bold: true, color: C.deep, margin: 0, isTextBox: true });
    if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.9, y: 3.25, w: 0.2, h: 0.3, fill: { color: C.orange }, line: { color: C.orange }, objectName: 'arrow' });
  }
  card(s, M, 5.1, 12.33, 1.6, C.tint, 'entered');
  s.addText(t('What was entered at this step', 'Ce qui a été saisi à cette étape'), { x: M + 0.3, y: 5.22, w: 6, h: 0.35, fontFace: BODY, fontSize: 12, bold: true, color: C.deep, margin: 0, isTextBox: true });
  s.addText(L(tk.output), { x: M + 0.3, y: 5.58, w: 7.4, h: 0.95, fontFace: BODY, fontSize: 14, color: C.dark, margin: 0, valign: 'top', isTextBox: true });
  s.addText([{ text: t('Each step is filled in one of three ways: ', 'Chaque étape se remplit de trois façons : '), options: { bold: true } }, { text: t('typed or pasted, loaded from a template, or proposed by AI and validated by a person.', 'saisie ou collée, chargée depuis un modèle, ou proposée par l’IA et validée par une personne.') }],
    { x: 8.2, y: 5.25, w: 4.4, h: 1.3, fontFace: BODY, fontSize: 13, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  s.addNotes(t('Read the process slides with this grid: a process groups tasks; each task executes one or more steps of a macro process.', 'Lire les diapositives de processus avec cette grille : un processus regroupe des tâches ; chaque tâche exécute une ou plusieurs étapes d’un macro-processus.')); }

// ================================================================== 6. roadmap of phases
{ const s = slide('CONTENT', 'Phases'); head(s, t('The project path', 'Le parcours du projet'), t('Six phases closed by approval gates, with enablers running throughout', 'Six phases fermées par des jalons d’approbation, avec des catalyseurs tout au long'));
  const cw = 12.33 / 6;
  for (let i = 0; i < 6; i++) {
    const no = i + 1; const rs = runs.filter(r => r.phase === no); const ts = rs.flatMap(r => r.tasks);
    const x = M + i * cw; card(s, x + 0.05, 1.95, cw - 0.15, 3.65, i % 2 ? C.white : C.white, 'phase ' + no);
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: 2.15, w: 0.6, h: 0.6, fill: { color: C.orange }, line: { color: C.orange }, objectName: 'phase number' });
    s.addText(String(no), { x: x + 0.25, y: 2.15, w: 0.6, h: 0.6, fontFace: HEAD, fontSize: 18, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText(L(PH[no].name), { x: x + 0.25, y: 2.85, w: cw - 0.4, h: 1.0, fontFace: HEAD, fontSize: 13, bold: true, color: C.dark, margin: 0, valign: 'top', isTextBox: true });
    s.addText(rs.map(r => r.e2e.id).join(' · '), { x: x + 0.25, y: 3.88, w: cw - 0.5, h: 0.7, fontFace: BODY, fontSize: 11, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
    s.addText(`${rs.length} ${t('processes', 'processus')} · ${ts.length} ${t('tasks', 'tâches')}`, { x: x + 0.25, y: 4.6, w: cw - 0.5, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: C.deep, margin: 0, isTextBox: true });
    s.addText(L(GATE[PH[no].gate]), { x: x + 0.25, y: 4.92, w: cw - 0.5, h: 0.6, fontFace: BODY, fontSize: 10, italic: true, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  }
  const e0 = runs.filter(r => r.phase === 0);
  card(s, M, 5.8, 12.33, 0.9, C.light, 'enablers'); await badge(s, 'layers', M + 0.2, 5.95, 0.6, C.ink);
  s.addText([{ text: t('Phase 0 — Enablers, across all phases: ', 'Phase 0 — Catalyseurs, sur toutes les phases : '), options: { bold: true, color: C.dark } }, { text: e0.map(r => `${r.e2e.id} ${L(r.e2e.name)}`).join(' · ') }],
    { x: M + 1.0, y: 5.85, w: 11.2, h: 0.8, fontFace: BODY, fontSize: 13, color: C.ink, margin: 0, valign: 'middle', isTextBox: true }); }

// ================================================================== 7-9. the project in the application
{ const s = slide('CONTENT', 'Project cockpit'); head(s, t('In the application', 'Dans l’application'), t('The project cockpit: 265 of 265 tasks completed', 'Le cockpit du projet : 265 tâches terminées sur 265'));
  await picture(s, '01_project', M, 1.85, 8.4, 4.95, { content: true });
  const pts = [[t('Progress per phase', 'Avancement par phase'), t('Each phase lists its processes, owners and task counts.', 'Chaque phase liste ses processus, responsables et nombres de tâches.')],
    [t('No overdue task', 'Aucune tâche en retard'), t('Due dates, owners and evaluators are set per task.', 'Échéances, responsables et évaluateurs sont fixés par tâche.')],
    [t('Complexity score 72', 'Score de complexité 72'), t('Full mode chosen from the scoring of the project.', 'Mode complet choisi à partir de la notation du projet.')]];
  for (let i = 0; i < 3; i++) { const y = 1.9 + i * 1.62; await badge(s, ['chart-column', 'clock', 'gauge'][i], 9.25, y, 0.55);
    s.addText(pts[i][0], { x: 9.95, y, w: 2.9, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: C.dark, margin: 0, isTextBox: true });
    s.addText(pts[i][1], { x: 9.95, y: y + 0.42, w: 2.9, h: 0.95, fontFace: BODY, fontSize: 13, color: C.ink, margin: 0, valign: 'top', isTextBox: true }); } }
{ const s = slide('CONTENT', 'Gantt'); head(s, t('In the application', 'Dans l’application'), t('Work breakdown and Gantt chart of the run', 'Découpage du travail et diagramme de Gantt du déroulé'));
  const f = await picture(s, '02_gantt', M, 1.85, 12.33, 4.75, { content: true }); caption(s, t('Phases, processes and tasks on one timeline, with their dependencies.', 'Phases, processus et tâches sur une même frise, avec leurs dépendances.'), f.x, f.y + f.h + 0.12, f.w); }
{ const s = slide('CONTENT', 'Chain'); head(s, t('In the application', 'Dans l’application'), t('How the processes feed each other', 'Comment les processus s’alimentent'));
  const f = await picture(s, '03_chain', M, 1.85, 12.33, 4.75, { content: true }); caption(s, t('Chain diagram: the output of each process is an input of the next ones.', 'Diagramme des chaînes : la sortie de chaque processus alimente les suivants.'), f.x, f.y + f.h + 0.12, f.w); }

// ================================================================== phases and processes
const ROWS_H = 3.45;
const lines = (s, cpl) => Math.max(1, Math.ceil(String(s || '').length / cpl));
const stepLines = tk => Math.min(tk.steps.length, 3) + (tk.steps.length > 3 ? 1 : 0);
// Measured on the rendered deck: 0.167 in per line of 10 pt plus 0.09 in of cell margins; characters per line per column.
const rowH = tk => 0.09 + 0.145 * Math.max(1 + lines(L(tk.name), 28), tk.steps.slice(0, 3).reduce((a, s) => a + lines(`${s.id} ${L(s.name)}`, 38), 0) + (tk.steps.length > 3 ? 1 : 0), lines(L(tk.output), 42), 2);
function pages(tasks, avail) { const p = [[]]; let h = 0.32; for (const tk of tasks) { const r = rowH(tk); if (h + r > avail && p.at(-1).length) { p.push([]); h = 0.32; } p.at(-1).push(tk); h += r; } return p; }
const taskRows = tasks => tasks.map((tk, i) => { const f = { color: i % 2 ? C.light : C.white };
  const steps = tk.steps.slice(0, 3).flatMap((s, j, a) => [{ text: s.id + ' ', options: { bold: true, color: C.dark } }, { text: L(s.name), options: { breakLine: j < a.length - 1 || tk.steps.length > 3 } }]);
  if (tk.steps.length > 3) steps.push({ text: t(`+ ${tk.steps.length - 3} more steps`, `+ ${tk.steps.length - 3} autres étapes`), options: { italic: true } });
  return [cell([{ text: tk.uft + '\n', options: { bold: true, color: C.deep } }, { text: L(tk.name), options: { bold: true, color: C.dark } }], { fill: f }), cell(steps, { fill: f }),
    cell([{ text: tk.owner || '—', options: { breakLine: true } }, { text: fmtDate(tk.completed), options: { color: C.medium, fontSize: 9 } }], { fill: f }), cell(L(tk.output), { fill: f })]; });
const HDR = () => [hcell(t('Task', 'Tâche')), hcell(t('Steps executed', 'Étapes exécutées')), hcell(t('Owner · done', 'Responsable · fait')), hcell(t('What was entered', 'Ce qui a été saisi'))];
const COLW = [2.15, 2.6, 1.3, 2.55];

for (const no of ORDER) {
  const rs = runs.filter(r => r.phase === no); const ph = PH[no];
  newSection(`${t('Phase', 'Phase')} ${no} — ${L(ph.name)}`);
  // divider
  { const s = slide('DIVIDER', 'Phase ' + no);
    s.addText(String(no).padStart(2, '0'), { x: M, y: 1.0, w: 3, h: 1.4, fontFace: HEAD, fontSize: 80, bold: true, color: C.orange, margin: 0, isTextBox: true });
    s.addText(`${t('PHASE', 'PHASE')} ${no}`, { x: M, y: 2.55, w: 6, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: C.orange, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText(L(ph.name), { x: M, y: 2.95, w: 6.2, h: 1.5, fontFace: HEAD, fontSize: 36, bold: true, color: C.white, margin: 0, valign: 'top', isTextBox: true });
    const ts = rs.flatMap(r => r.tasks); const st = ts.map(x => x.started).sort()[0], en = ts.map(x => x.completed).sort().at(-1);
    s.addText([{ text: `${rs.length} ${t('processes', 'processus')} · ${ts.length} ${t('tasks', 'tâches')} · ${ts.reduce((a, x) => a + x.steps.length, 0)} ${t('steps', 'étapes')}`, options: { breakLine: true } },
      { text: `${fmtDate(st)} – ${fmtDate(en)}`, options: { breakLine: true } }, { text: ph.gate ? `${t('Closed by', 'Fermée par')} ${L(GATE[ph.gate])}` : t('Runs across all phases', 'Sur toutes les phases') }],
      { x: M, y: 4.6, w: 6.2, h: 1.2, fontFace: BODY, fontSize: 15, color: 'D6D6D8', margin: 0, valign: 'top', paraSpaceAfter: 4, isTextBox: true });
    s.addText(rs.map((r, i) => ({ text: `${r.e2e.id}   ${L(r.e2e.name)}`, options: { breakLine: i < rs.length - 1, paraSpaceAfter: 6 } })),
      { x: 7.3, y: 1.2, w: 5.5, h: 5.2, fontFace: BODY, fontSize: 15, color: C.white, margin: 0, valign: 'middle', isTextBox: true });
    s.addNotes(L(ph.name)); }
  for (const r of rs) {
    const e = r.e2e; const ts = r.tasks; const sc = ts.reduce((a, x) => a + x.steps.length, 0);
    const eyebrow = `${t('Phase', 'Phase')} ${no} · ${e.id} · ${L(e.type)}`;
    // Rows on the first slide: the estimate, or the cap measured on a rendered deck (clinic-flow-fit.json, fit-clinic-flow-deck.py).
    let first = pages(ts, ROWS_H)[0]; if (FIT[e.id] != null) first = ts.slice(0, Math.min(first.length, FIT[e.id]));
    const rest = ts.length > first.length ? pages(ts.slice(first.length), 5.2) : [];
    // main slide: card row, task table, the task opened in the application
    { const s = slide('CONTENT', e.id); head(s, eyebrow, L(e.name), L(e.goal));
      const cards = [[t('Trigger', 'Déclencheur'), L(e.trigger)], [t('End state', 'État final'), L(e.terminal)]];
      cards.forEach(([a, b], i) => { const x = M + i * 3.0; card(s, x, 1.8, 2.85, 0.92, C.white, a);
        s.addText([{ text: a.toUpperCase() + '\n', options: { bold: true, color: C.deep, fontSize: 9, charSpacing: 1 } }, { text: b }], { x: x + 0.12, y: 1.84, w: 2.62, h: 0.84, fontFace: BODY, fontSize: 10, color: C.dark, margin: 0, valign: 'top', fit: 'shrink', isTextBox: true }); });
      card(s, M + 6.0, 1.8, 2.6, 0.92, C.tint, 'figures');
      s.addText([{ text: `${ts.length} ${t('tasks', 'tâches')} · ${sc} ${t('steps', 'étapes')}\n`, options: { bold: true, color: C.deep, fontSize: 13 } },
        { text: `${days(ts.map(x => x.started).sort()[0], ts.map(x => x.completed).sort().at(-1))} ${t('days', 'jours')} · ${new Set(ts.map(x => x.owner)).size} ${t('owners', 'responsables')} · 100 %` }],
        { x: M + 6.12, y: 1.84, w: 2.4, h: 0.84, fontFace: BODY, fontSize: 11, color: C.dark, margin: 0, valign: 'middle', isTextBox: true });
      s.addText([{ text: t('Macro processes: ', 'Macro-processus : '), options: { bold: true, color: C.dark } }, ...r.mps.map((m, i) => ({ text: `${m.id} ${L(m.name)}${i < r.mps.length - 1 ? ' · ' : ''}` }))],
        { x: M, y: 2.78, w: 8.6, h: 0.42, fontFace: BODY, fontSize: 10, color: C.ink, margin: 0, valign: 'middle', fit: 'shrink', isTextBox: true });
      s.addTable([HDR(), ...taskRows(first)], { x: M, y: 3.25, w: 8.6, colW: COLW, border, autoPage: false });
      const tsk = ts.find(x => x.uft === JSON.parse(fs.readFileSync(path.join(SH, 'tasks.json'), 'utf8'))[e.id]) || ts[0];
      const f = await picture(s, 'task_' + e.id, 9.35, 1.8, 3.48, 4.55, { alt: `${tsk.uft} ${L(tsk.name)}` });
      caption(s, t(`${tsk.uft} opened in CortexSkills: what to enter, its steps and its result.`, `${tsk.uft} ouverte dans CortexSkills : quoi saisir, ses étapes et son résultat.`), 9.35, f.y + f.h + 0.1, 3.48);
      if (rest.length) s.addText(t('Continued on the next slide', 'Suite sur la diapositive suivante'), { x: 9.35, y: 6.72, w: 3.48, align: 'right', h: 0.25, fontFace: BODY, fontSize: 9, italic: true, color: C.medium, margin: 0, isTextBox: true });
      s.addNotes(`${e.id} ${L(e.name)} — ${L(e.description || e.goal)}\n${t('Trigger', 'Déclencheur')}: ${L(e.trigger)}\n${t('End state', 'État final')}: ${L(e.terminal)}`); }
    // continuation: the remaining tasks and the process page in the application
    for (const part of rest) {
      const s = slide('CONTENT', e.id + ' (2)'); head(s, eyebrow, `${L(e.name)} ${t('(continued)', '(suite)')}`);
      s.addTable([HDR(), ...taskRows(part)], { x: M, y: 1.45, w: 8.6, colW: COLW, border, autoPage: false });
      // A short table leaves room under it: the process page goes there, the macro processes on the right.
      const estH = 0.32 + part.reduce((a, x) => a + rowH(x), 0);
      if (estH < 2.7) {
        const y = (FIT[`${e.id} (2)`] ?? 1.45 + estH) + 0.3; const f = await picture(s, 'run_' + e.id, M, y, 8.6, 6.55 - y, { content: true });
        caption(s, t(`The page of ${e.id} in CortexSkills: its tasks, owners and due dates, and the process card.`, `La page de ${e.id} dans CortexSkills : ses tâches, responsables et échéances, et la fiche du processus.`), M, f.y + f.h + 0.08, 8.6);
        card(s, 9.35, 1.45, 3.48, 5.2, C.white, 'macro processes');
        const H = (x, gap = 0) => ({ text: x, options: { bold: true, color: C.deep, fontSize: 11, bullet: false, breakLine: true, paraSpaceBefore: gap, paraSpaceAfter: 2 } });
        const P = x => ({ text: x, options: { bullet: false, breakLine: true, paraSpaceAfter: 2 } });
        s.addText([H(t('Macro processes', 'Macro-processus')), ...r.mps.map(m => ({ text: `${m.id} ${L(m.name)}`, options: { bullet: true, breakLine: true, paraSpaceAfter: 4 } })),
          H(t('Feeds into', 'Alimente'), 10), P((typeof e.feedsInto === 'string' ? e.feedsInto : L(e.feedsInto)) || '—'),
          H(t('Supported by', 'Soutenu par'), 10), { text: (typeof e.supportedBy === 'string' ? e.supportedBy : L(e.supportedBy)) || '—', options: { bullet: false } }],
          { x: 9.55, y: 1.6, w: 3.1, h: 4.9, fontFace: BODY, fontSize: 11, color: C.dark, margin: 0, valign: 'top', isTextBox: true });
        s.addNotes(`${e.id} — ${t('remaining tasks', 'tâches restantes')}`); continue;
      }
      const f = await picture(s, 'run_' + e.id, 9.35, 1.45, 3.48, 3.0, { content: true });
      caption(s, t(`The page of ${e.id} in CortexSkills: its tasks, owners and due dates, and the process card.`, `La page de ${e.id} dans CortexSkills : ses tâches, responsables et échéances, et la fiche du processus.`), 9.35, f.y + f.h + 0.1, 3.48);
      card(s, 9.35, 5.0, 3.48, 1.65, C.tint, 'feeds');
      s.addText([{ text: t('Feeds into', 'Alimente') + '\n', options: { bold: true, color: C.deep, fontSize: 10 } }, { text: (typeof e.feedsInto === 'string' ? e.feedsInto : L(e.feedsInto)) || '—', options: { breakLine: true } },
        { text: t('Supported by', 'Soutenu par') + '\n', options: { bold: true, color: C.deep, fontSize: 10 } }, { text: (typeof e.supportedBy === 'string' ? e.supportedBy : L(e.supportedBy)) || '—' }],
        { x: 9.5, y: 5.08, w: 3.2, h: 1.5, fontFace: BODY, fontSize: 11, color: C.dark, margin: 0, valign: 'top', isTextBox: true });
      s.addNotes(`${e.id} — ${t('remaining tasks', 'tâches restantes')}`);
    }
  }
}

// ================================================================== results
newSection(t('Results and next steps', 'Résultats et prochaines étapes'));
{ const s = slide('CONTENT', 'Results'); head(s, t('Results', 'Résultats'), t('What the run produced, in figures', 'Ce que le déroulé a produit, en chiffres'), t('Each figure is the value entered or computed at the step shown under it', 'Chaque chiffre est la valeur saisie ou calculée à l’étape indiquée dessous'));
  const k = [['187', t('questionnaire responses consolidated', 'réponses au questionnaire consolidées'), 'UFT-03-06'], ['6', t('themes built from 23 validated needs', 'thèmes construits à partir de 23 besoins validés'), 'UFT-03-05'],
    ['1,33 M', t('MAD net L&D budget approved', 'MAD de budget formation net approuvé'), 'UFT-01-05'], ['+33 pts', t('test score, 48 % to 81 % (level 2)', 'score au test, de 48 % à 81 % (niveau 2)'), 'UFT-07-04'],
    ['9 / 11', t('supervisors apply the routine at day 30', 'superviseurs appliquent la routine à J+30'), 'UFT-07-05'], ['22 %', t('ROI, benefit-cost ratio 1.22', 'ROI, ratio bénéfice-coût 1,22'), 'UFT-08-05']];
  if (LANG === 'en') k[2][0] = '1.33 M';
  k.forEach(([v, l, u], i) => { const x = M + (i % 3) * 4.15, y = 1.95 + Math.floor(i / 3) * 2.35; kpi(s, x, y, 3.95, v, l);
    s.addText(u, { x: x + 0.2, y: y + 1.32, w: 3.5, h: 0.3, fontFace: BODY, fontSize: 10, italic: true, color: C.medium, margin: 0, isTextBox: true }); }); }
{ const s = slide('CONTENT', 'Evaluation'); head(s, t('Results', 'Résultats'), t('Training measured at every Kirkpatrick level', 'La formation mesurée à chaque niveau de Kirkpatrick'), t('Session S-01, AI triage and clinical decision support for supervisors', 'Session S-01, triage IA et aide à la décision clinique pour les superviseurs'));
  s.addChart(pres.charts.BAR, [{ name: t('Score (%)', 'Score (%)'), labels: [t('Satisfaction (4.3 / 5)', 'Satisfaction (4,3 / 5)'), t('Pre-test', 'Pré-test'), t('Post-test', 'Post-test'), t('Apply at day 30', 'Appliquent à J+30')], values: [86, 48, 81, 82] }],
    { x: M, y: 1.95, w: 7.4, h: 4.55, barDir: 'col', chartColors: [C.medium, C.medium, C.orange, C.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 12, dataLabelColor: C.dark, dataLabelFontFace: '+mn-lt',
      catAxisLabelColor: C.ink, valAxisLabelColor: C.medium, catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt', catAxisLabelFontSize: 12, valAxisLabelFontSize: 10, valAxisMaxVal: 100, valGridLine: { color: C.line, size: 0.5 }, catGridLine: { style: 'none' }, showLegend: false,
      showTitle: true, title: t('Results of session S-01 (%)', 'Résultats de la session S-01 (%)'), titleFontFace: '+mj-lt', titleFontSize: 14, titleColor: C.dark });
  caption(s, t('Satisfaction 4.3/5 shown as 86 %; 9 of 11 participants shown as 82 %. Source: tasks UFT-07-03 to UFT-07-05.', 'Satisfaction 4,3/5 affichée à 86 % ; 9 participants sur 11 affichés à 82 %. Source : tâches UFT-07-03 à UFT-07-05.'), M, 6.55, 7.4);
  const lv = [['smile', t('Level 1 — Reaction', 'Niveau 1 — Réaction'), out('E2E-07', 'UFT-07-03')], ['brain', t('Level 2 — Learning', 'Niveau 2 — Apprentissage'), out('E2E-07', 'UFT-07-04')], ['activity', t('Level 3 — Behaviour', 'Niveau 3 — Comportement'), out('E2E-07', 'UFT-07-05')], ['coins', t('Level 4 — ROI', 'Niveau 4 — ROI'), out('E2E-08', 'UFT-08-05')]];
  for (let i = 0; i < 4; i++) { const y = 1.95 + i * 1.17; await badge(s, lv[i][0], 8.3, y, 0.52, i === 3 ? C.orange : C.ink);
    s.addText([{ text: lv[i][1] + '\n', options: { bold: true, color: C.dark, fontSize: 13 } }, { text: lv[i][2] }], { x: 8.95, y: y - 0.04, w: 3.9, h: 1.08, fontFace: BODY, fontSize: 11, color: C.ink, margin: 0, valign: 'top', isTextBox: true }); } }
{ const kp = D.workspace.kpis.filter(k => k.name).slice(0, 10);
  const s = slide('CONTENT', 'KPIs'); head(s, t('Results', 'Résultats'), t('Every KPI of the project on target', 'Tous les KPI du projet dans la cible'), t(`${D.workspace.kpis.filter(k => k.status === 'Green').length} of ${D.workspace.kpis.length} KPIs green — the first ten`, `${D.workspace.kpis.filter(k => k.status === 'Green').length} KPI sur ${D.workspace.kpis.length} au vert — les dix premiers`));
  s.addTable([[hcell('ID'), hcell('KPI'), hcell(t('Value', 'Valeur')), hcell(t('Target', 'Cible')), hcell(t('Status', 'Statut'))],
    ...kp.map((k, i) => { const f = { color: i % 2 ? C.light : C.white }; return [cell(k.kpi_id, { bold: true, color: C.dark, fill: f, fontSize: 11 }), cell(L(k.name), { fill: f, fontSize: 11 }), cell(num(k.value), { fill: f, fontSize: 11, align: 'right' }), cell(num(k.target), { fill: f, fontSize: 11, align: 'right' }),
      cell(k.status === 'Green' ? t('On target', 'Dans la cible') : k.status, { fill: { color: k.status === 'Green' ? C.green : 'FBE0B5' }, fontSize: 11, bold: true, color: C.dark, align: 'center' })]; })],
    { x: M, y: 1.95, w: 6.9, colW: [0.9, 3.1, 0.8, 0.8, 1.3], border, rowH: 0.4 });
  const f = await picture(s, '14_kpis', 7.7, 1.95, 5.13, 4.6, { content: true }); caption(s, t('KPI page of the project in CortexSkills.', 'Page des KPI du projet dans CortexSkills.'), f.x, f.y + f.h + 0.1, f.w); }
for (const [name, eyebrow, title, cap] of [
  ['10_questionnaires', t('Deliverables', 'Livrables'), t('The questionnaire campaign', 'La campagne de questionnaires'), t('Campaign with three forms (top management, management, staff), channels, response rate and completeness.', 'Campagne à trois formulaires (direction générale, encadrement, collaborateurs), canaux, taux de réponse et complétude.')],
  ['11_training_plan', t('Deliverables', 'Livrables'), t('The 2026 training plan', 'Le plan de formation 2026'), t('Programmes, trainings, half-day agendas and the golden rules checked on every training.', 'Programmes, formations, agendas par demi-journée et règles d’or vérifiées sur chaque formation.')],
  ['12_documents', t('Deliverables', 'Livrables'), t(`${docsLang.length} documents published, versioned and approved`, `${docsLang.length} documents publiés, versionnés et approuvés`), t('Training Engineering Report, training plan, audit, ROI report and the other documents, each with an author, an approver and a review date.', 'Rapport d’ingénierie de formation, plan de formation, audit, rapport ROI et les autres documents, chacun avec un auteur, un approbateur et une date de revue.')],
  ['13_reports', t('Deliverables', 'Livrables'), t('Standard reports, ready to export', 'Des rapports standard prêts à exporter'), t('34 standard reports, previewed and downloaded as PDF, Excel or Word.', '34 rapports standard, prévisualisés et téléchargés en PDF, Excel ou Word.')]]) {
  const s = slide('CONTENT', name); head(s, eyebrow, title); const f = await picture(s, name, M, 1.55, 12.33, 4.75, { content: true }); caption(s, cap, f.x, f.y + f.h + 0.12, f.w);
}
{ const s = slide('CONTENT', 'Next steps'); head(s, t('Next steps', 'Prochaines étapes'), t('Proposed path for your clinics', 'Parcours proposé pour vos cliniques'), t('Durations are indicative and set with you during the scoping workshop', 'Les durées sont indicatives et fixées avec vous lors de l’atelier de cadrage'));
  const st = [['calendar-check', t('Scoping workshop', 'Atelier de cadrage'), t('Half a day: sites, functions, decision levels, focus and stakeholders — Phase 1 in the application.', 'Une demi-journée : sites, fonctions, niveaux de décision, orientation et parties prenantes — phase 1 dans l’application.')],
    ['hospital', t('Pilot on one clinic', 'Pilote sur une clinique'), t('Questionnaires, diagnosis and Training Engineering Report on your data — Phases 1 to 3.', 'Questionnaires, diagnostic et rapport d’ingénierie de formation sur vos données — phases 1 à 3.')],
    ['network', t('Deployment to all clinics', 'Déploiement sur toutes les cliniques'), t('Delivery, evaluation up to ROI and continuous improvement — Phases 4 to 6.', 'Déploiement, évaluation jusqu’au ROI et amélioration continue — phases 4 à 6.')]];
  for (let i = 0; i < 3; i++) { const x = M + i * 4.15; card(s, x, 1.95, 3.95, 3.6, C.white, 'step ' + i);
    s.addText(String(i + 1), { x: x + 0.3, y: 2.15, w: 1, h: 0.8, fontFace: HEAD, fontSize: 44, bold: true, color: C.deep, margin: 0, isTextBox: true }); await badge(s, st[i][0], x + 3.0, 2.25, 0.62, i === 1 ? C.orange : C.ink);
    s.addText(st[i][1], { x: x + 0.3, y: 3.1, w: 3.4, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: C.dark, margin: 0, isTextBox: true });
    s.addText(st[i][2], { x: x + 0.3, y: 3.65, w: 3.4, h: 1.7, fontFace: BODY, fontSize: 14, color: C.ink, margin: 0, valign: 'top', isTextBox: true }); }
  card(s, M, 5.8, 12.33, 0.85, C.tint, 'deployment');
  s.addText(t('Deployment on your private cloud or on site, under a licence; interface and documents in French, English and Arabic.', 'Installation sur votre cloud privé ou sur site, sous licence ; interface et documents en français, anglais et arabe.'),
    { x: M + 0.3, y: 5.85, w: 11.8, h: 0.75, fontFace: BODY, fontSize: 14, color: C.dark, margin: 0, valign: 'middle', isTextBox: true }); }
{ const s = slide('DIVIDER', 'Closing');
  s.addText(t('Thank you', 'Merci'), { x: M, y: 2.3, w: 8, h: 1.2, fontFace: HEAD, fontSize: 48, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addText(t('POWERACT Consulting · CortexSkills, training engineering for healthcare', 'POWERACT Consulting · CortexSkills, l’ingénierie de formation pour la santé'), { x: M, y: 3.6, w: 10, h: 0.5, fontFace: BODY, fontSize: 18, color: C.orange, margin: 0, isTextBox: true });
  s.addText(t('Questions and discussion', 'Questions et échanges'), { x: M, y: 4.3, w: 10, h: 0.5, fontFace: BODY, fontSize: 16, color: 'D6D6D8', margin: 0, isTextBox: true }); }

const file = path.join(OUT, `CortexSkills_PrivateClinic_CaseStudy_E2E_${LANG.toUpperCase()}.pptx`);
await pres.writeFile({ fileName: file });
// Theme colours and fonts written into the deck (pptxgenjs writes only the fonts): APPLY_THEME=<path of apply_theme.js>.
if (process.env.APPLY_THEME) await require(process.env.APPLY_THEME).applyTheme(file, THEME);
fs.writeFileSync(file.replace(/\.pptx$/, '.outline.json'), JSON.stringify(OUTLINE, null, 1));
console.log('written', file, OUTLINE.length, 'slides');
})().catch(e => { console.error(e); process.exit(1); });
