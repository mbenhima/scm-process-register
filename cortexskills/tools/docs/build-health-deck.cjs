// Healthcare customer presentation: node build-health-deck.cjs [en|fr] [outDir]
// Every figure comes from health-data.json (extract-health.mjs, seeded demonstration instance) and the screenshots in shots/.
const path = require('path'); const fs = require('fs');
const PptxGenJS = require('pptxgenjs'); const sharp = require('sharp'); const lucide = require('lucide-static');
const LANG = ['en', 'fr'].includes(process.argv[2]) ? process.argv[2] : 'en';
const out = process.argv[3] || path.join(__dirname, '../../deliverables');
// French: every string reaching a slide goes through the dictionary below; data values come in French from the data pack.
const FR = LANG === 'fr' ? JSON.parse(fs.readFileSync(path.join(__dirname, 'health-deck-fr.json'), 'utf8')) : {};
const MISSING = new Set(); const SEEN = new Set();
const _ = s => { if (LANG !== 'fr' || typeof s !== 'string' || !/[A-Za-z]{2}/.test(s)) return s; SEEN.add(s); const k = s.replace(/\u00a0/g, ' '); if (FR[k] != null) return FR[k]; MISSING.add(s); return s; };
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'health-data.json'), 'utf8'));
const L = x => (x && typeof x === 'object' ? x[LANG] ?? x.en ?? '' : x ?? '');
const C = { orange: 'F8931D', deep: 'E07B00', tint: 'FDEEDA', dark: '3A3A3C', ink: '58595B', medium: '808184', light: 'F2F2F3', line: 'E3E3E4', bg: 'FDFDFC', white: 'FFFFFF' };
const S = ['F4C7C3', 'FBE0B5', 'FFF3B0', 'D9EAD3', 'B6D7A8']; const RAG = { Red: S[0], Amber: S[1], Green: S[3] };
const TITLE = 'Cambria', BODY = 'Calibri';
const shot = (...p) => path.join(__dirname, 'shots', ...p);
const H_ = D.hospital, CL = D.clinic, HA = H_.projects.AI, HD = H_.projects.Digital, R = HA.records, CA = CL.projects.AI, CD = CL.projects.Digital;
const V = Object.fromEntries(D.verticals.map(v => [v.id, v])); const HC = V.HCPR;
const num = n => Math.round(n).toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-US').replace(/\u202f/g, '\u00a0');
const pct = t => Math.round((t.done / t.n) * 100);
const date = s => new Date(s).toLocaleDateString(LANG === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const cnt = (a, f) => a.reduce((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {});
const sum = (a, f) => a.reduce((p, x) => p + f(x), 0);
const byPhase = p => D.phases.map(ph => { const r = p.e2e.filter(e => e.phase === ph.no); return Math.round(sum(r, e => e.done) / (sum(r, e => e.tasks) || 1) * 100); });
const phaseShort = ['Enablers', 'Scope', 'Diagnosis', 'Report & plan', 'Delivery', 'Evaluation', 'Improvement'];

const pres = new PptxGenJS(); pres.layout = 'LAYOUT_WIDE'; pres.title = LANG === 'fr' ? 'CortexSkills pour la santé' : 'CortexSkills for Healthcare'; pres.author = 'POWERACT Consulting'; pres.lang = LANG === 'fr' ? 'fr-FR' : 'en-GB';
// Translation at the slide level: text boxes, tables and charts.
const addSlide0 = pres.addSlide.bind(pres);
pres.addSlide = (...a) => {
  const sl = addSlide0(...a); const t0 = sl.addText.bind(sl), tb0 = sl.addTable.bind(sl), ch0 = sl.addChart.bind(sl);
  sl.addText = (t, o) => t0(Array.isArray(t) ? t.map(x => ({ ...x, text: _(x.text) })) : _(t), o);
  sl.addTable = (rows, o) => tb0(rows.map(r => r.map(c => (c && typeof c === 'object' ? { ...c, text: _(c.text) } : _(c)))), o);
  sl.addChart = (ty, data, o) => ch0(ty, Array.isArray(data) ? data.map(d => ({ ...d, name: _(d.name), labels: (d.labels || []).map(_) })) : data, o);
  return sl;
};
const shotH = n => { const f = shot('health_' + LANG, n); return LANG !== 'en' && fs.existsSync(f) ? f : shot('health', n); };
const stripV = s => String(s).replace('Healthcare Providers ', '').replace(/ — Établissements de santé$/, '');
const CORE = () => L(HC.coreFunction.name);
const W = 13.333, H = 7.5, M = 0.6;
let pageNo = 0, section = '', demo = false;
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
const txt = (s, t, x, y, w, h, o = {}) => s.addText(t, { x, y, w, h, fontFace: BODY, fontSize: 14, color: C.dark, margin: 0, isTextBox: true, valign: 'top', ...o });
const cap = (s, t, x, y, w) => txt(s, t, x, y, w, 0.3, { fontSize: 10, italic: true, color: C.ink });
function wordmark(s, x, y, size = 11, dark = false) {
  s.addText([{ text: 'POWER', options: { color: dark ? C.white : C.dark, bold: true } }, { text: 'ACT', options: { color: C.orange, bold: true } }], { x, y, w: 2, h: 0.3, fontFace: BODY, fontSize: size, charSpacing: 2, margin: 0, isTextBox: true });
}
function content(eyebrow, title, subtitle) {
  const s = pres.addSlide(); pageNo++; s.background = { color: C.bg };
  txt(s, eyebrow.toUpperCase(), M, 0.42, 11, 0.3, { fontSize: 12, bold: true, color: C.deep, charSpacing: 3 });
  txt(s, title, M, 0.72, W - 2 * M, 0.75, { fontFace: TITLE, fontSize: 30, bold: true, fit: 'shrink', valign: 'middle' });
  if (subtitle) txt(s, subtitle, M, 1.45, W - 2 * M, 0.4, { fontSize: 16, color: C.ink });
  wordmark(s, M, H - 0.42, 10);
  txt(s, _(section) + (demo ? '  ·  ' + _('Demonstration data — fictional organization') : ''), 2.6, H - 0.44, 8.1, 0.3, { fontSize: 10, color: C.medium, align: 'center' });
  txt(s, String(pageNo), W - M - 1, H - 0.44, 1, 0.3, { fontSize: 10, color: C.medium, align: 'right' });
  return s;
}
function divider(num, title, sub, isDemo = false) {
  const s = pres.addSlide(); pageNo++; section = title; demo = isDemo; s.background = { color: C.dark };
  s.addShape(pres.shapes.OVAL, { x: 9.2, y: -1.6, w: 6.5, h: 6.5, fill: { color: C.orange, transparency: 82 }, line: { color: C.orange, transparency: 100 } });
  s.addShape(pres.shapes.OVAL, { x: 10.6, y: 3.9, w: 3.6, h: 3.6, fill: { color: C.orange, transparency: 70 }, line: { color: C.orange, transparency: 100 } });
  txt(s, num, M, 2.1, 3, 1.2, { fontFace: TITLE, fontSize: 72, bold: true, color: C.orange });
  txt(s, title, M, 3.35, 9, 0.9, { fontFace: TITLE, fontSize: 40, bold: true, color: C.white });
  txt(s, sub, M, 4.3, 9, 0.9, { fontSize: 18, color: 'D9D9DA' });
  wordmark(s, M, H - 0.5, 11, true);
}
function screenshot(s, file, x, y, w, maxH = 5) {
  if (!fs.existsSync(file)) { console.warn('missing', file); return 0; }
  const buf = fs.readFileSync(file); const r = buf.readUInt32BE(20) / buf.readUInt32BE(16); let h = w * r; if (h > maxH) { h = maxH; w = h / r; }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, fill: { color: C.white }, line: { color: C.line, width: 0.75 }, rectRadius: 0.08, shadow: shadow() });
  s.addImage({ path: file, x, y, w, h, altText: _('Screenshot of the application') }); return h;
}
function table(s, head, rows, x, y, w, colW, o = {}) {
  const fs_ = o.fontSize || 11;
  const data = [head.map(h => ({ text: h, options: { bold: true, color: C.white, fill: { color: C.orange }, fontSize: fs_ } })),
    ...rows.map((r, i) => r.map(c => { const cell = typeof c === 'object' && c !== null ? c : { text: String(c) }; return { text: String(cell.text), options: { color: C.dark, fill: { color: cell.fill || (i % 2 ? C.light : C.white) }, fontSize: fs_, bold: !!cell.bold, align: cell.align } }; }))];
  s.addTable(data, { x, y, w, colW, fontFace: BODY, border: { type: 'solid', pt: 0.5, color: C.line }, margin: 0.06, rowH: o.rowH || 0.32, valign: 'middle', autoPage: false });
}
async function kpi(s, x, y, w, value, label, ic, fill = C.orange) {
  card(s, x, y, w, 1.35); await badge(s, ic, x + 0.22, y + 0.22, 0.5, fill);
  txt(s, value, x + 0.85, y + 0.14, w - 1, 0.6, { fontFace: TITLE, fontSize: 26, bold: true, color: C.deep, valign: 'middle', fit: 'shrink' });
  txt(s, label, x + 0.22, y + 0.82, w - 0.4, 0.46, { fontSize: 11.5, color: C.ink });
}
async function bullets(s, items, x, y, w, gap = 1.0, fs_ = 15) {
  for (const [k, line] of items.entries()) { const yy = y + k * gap; await badge(s, ['Check', 'ArrowRight', 'ShieldCheck', 'CircleDot', 'Target', 'Info'][k % 6], x, yy, 0.46, k === 0 ? C.orange : C.ink);
    txt(s, line, x + 0.65, yy - 0.04, w - 0.65, gap - 0.1, { fontSize: fs_ }); }
}
const axis = { catAxisLabelColor: C.ink, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 11, valAxisLabelColor: C.medium, valAxisLabelFontSize: 10, valGridLine: { color: C.line, size: 0.5 }, catGridLine: { style: 'none' }, legendFontFace: BODY, legendFontSize: 11, legendColor: C.ink, dataLabelColor: C.dark, dataLabelFontSize: 10 };

(async () => {
  const tH = HA.tasks, tD = HD.tasks, gates = R.PhaseChecklist.filter(g => g.gate_name).sort((a, b) => a.phase - b.phase);
  const signed = gates.filter(g => g.state === 'Signed off').length;
  const plan = R.TrainingPlan[0], cs = R.ComplexityScore[0], sow = R.ScopeOfWork[0], qr = R.QuestionnaireResponse;
  const compl = Math.round(sum(qr, x => x.completeness_pct) / qr.length);

  // 1 — Title
  { const s = pres.addSlide(); pageNo++; s.background = { color: C.bg }; wordmark(s, M, 0.5, 16);
    s.addShape(pres.shapes.OVAL, { x: -1.4, y: 4.6, w: 4.4, h: 4.4, fill: { color: C.tint }, line: { color: C.tint } });
    txt(s, 'CUSTOMER PRESENTATION · HEALTHCARE · 2026', M, 1.85, 6, 0.35, { fontSize: 13, bold: true, color: C.deep, charSpacing: 3 });
    txt(s, 'CortexSkills for Healthcare', M, 2.25, 5.8, 1.6, { fontFace: TITLE, fontSize: 44, bold: true });
    txt(s, 'Training engineering for hospitals and clinics — from accreditation requirements to certified, evaluated staff', M, 3.9, 5.5, 1.3, { fontSize: 19, color: C.ink });
    txt(s, 'POWERACT Consulting', M, 6.6, 5, 0.3, { fontSize: 11, color: C.medium });
    screenshot(s, shotH('dashboard.png'), 6.5, 1.35, 6.3); }

  // 2 — Agenda
  { section = 'Agenda'; const s = content('Agenda', 'What this presentation covers');
    const ag = [['01', 'The healthcare challenge', 'Accreditation, patient safety and new skills'], ['02', 'The solution', 'Lifecycle, gates, healthcare processes'], ['03', 'Case study: hospital group', 'A full AI skills run, phase by phase'], ['04', 'Case study: a clinic', 'The same method on an SME track'], ['05', 'The health ecosystem', 'Life sciences and pharma'], ['06', 'Trust and next steps', 'Security, deployment, packs, plan']];
    const ic = ['HeartPulse', 'RefreshCw', 'Hospital', 'Stethoscope', 'FlaskConical', 'ShieldCheck'];
    for (let i = 0; i < 6; i++) { const x = M + (i % 3) * 4.1, y = 2.0 + Math.floor(i / 3) * 2.35; card(s, x, y, 3.85, 2.1);
      await badge(s, ic[i], x + 0.3, y + 0.3, 0.7, i === 0 ? C.orange : C.ink);
      txt(s, ag[i][0], x + 2.9, y + 0.35, 0.7, 0.5, { fontFace: TITLE, fontSize: 22, bold: true, color: C.deep, align: 'right' });
      txt(s, ag[i][1], x + 0.3, y + 1.1, 3.3, 0.45, { fontFace: TITLE, fontSize: 17, bold: true });
      txt(s, ag[i][2], x + 0.3, y + 1.52, 3.3, 0.5, { fontSize: 13, color: C.ink }); } }

  // 3 — Executive summary
  { section = 'Executive summary'; demo = true; const s = content('Executive summary', 'One hospital group, one AI skills run, measured end to end', `${L(H_.org.name)} · ${num(H_.org.employees)} employees · ${H_.org.city} · figures from the seeded demonstration run`);
    await kpi(s, M, 2.1, 2.9, pct(tH) + '%', `of ${tH.n} tasks completed in the AI skills run`, 'Sparkles');
    await kpi(s, M + 3.07, 2.1, 2.9, `${signed} of ${gates.length}`, 'phase gates signed off with a “Go” decision', 'Flag', C.ink);
    await kpi(s, M + 6.14, 2.1, 2.9, `${qr.length}`, `questionnaire responses, ${compl}% average completeness`, 'ClipboardList', C.ink);
    await kpi(s, M + 9.21, 2.1, 2.9, num(plan.total_budget), 'training budget in the locked 2026 plan', 'Wallet', C.ink);
    card(s, M, 3.75, W - 2 * M, 2.9, C.white);
    txt(s, 'What the run shows', M + 0.35, 3.95, 6, 0.4, { fontFace: TITLE, fontSize: 18, bold: true });
    const nRed = R.PerformanceAssessment.filter(p => p.rag === 'Red').length;
    const pts = [`Diagnosis flagged ${nRed} of ${R.PerformanceAssessment.length} function × decision-level cells as Red; Clinical Care & Nursing is Red at strategic and operational levels.`,
      `Six AI themes were prioritized by impact and urgency; “AI triage and clinical decision support” ranks first (impact 5, urgency 4).`,
      `Kirkpatrick evaluations range from 74% to 93%; one ISO 7101 awareness certificate has expired and one is expiring.`,
      `Every one of the ${H_.racsi.activities} RACSI activities has exactly one Accountable; ${H_.audit} audit entries trace the changes.`];
    await bullets(s, pts, M + 0.35, 4.5, W - 2 * M - 0.7, 0.52, 13.5); }

  // Section 1
  divider('01', 'The healthcare challenge', 'Accreditation, patient safety and the shift to digital and AI');
  { const s = content('Healthcare providers', 'Patient safety depends on proven competence', 'The accreditation bodies ask for evidence that each role is trained, assessed and current.');
    const st = [['ISO 7101', 'Healthcare quality management: competence determined per role, training records kept, effectiveness evaluated.'], ['JCI Standards', 'Accreditation surveys check staff qualification and education, with evidence at the level of each practitioner.'], ['ISO 15189', 'Medical laboratories: competence of laboratory personnel, assessed and recorded.']];
    for (const [i, [a, b]] of st.entries()) { const x = M + i * 4.1; card(s, x, 2.1, 3.85, 2.45); await badge(s, ['ShieldCheck', 'BadgeCheck', 'Microscope'][i], x + 0.3, 2.35, 0.65, i ? C.ink : C.orange);
      txt(s, a, x + 1.1, 2.42, 2.6, 0.5, { fontFace: TITLE, fontSize: 19, bold: true, valign: 'middle' }); txt(s, b, x + 0.3, 3.15, 3.3, 1.3, { fontSize: 13.5, color: C.ink }); }
    card(s, M, 4.85, 6.0, 1.75, C.tint); txt(s, 'SECTOR DRIVER', M + 0.3, 5.0, 5, 0.3, { fontSize: 11, bold: true, color: C.deep, charSpacing: 2 });
    txt(s, 'Patient-safety accreditation burden', M + 0.3, 5.35, 5.5, 0.5, { fontFace: TITLE, fontSize: 20, bold: true }); txt(s, 'Every accreditation cycle requires competence evidence for regulated roles.', M + 0.3, 5.9, 5.5, 0.6, { fontSize: 13, color: C.ink });
    card(s, M + 6.13, 4.85, 6.0, 1.75); txt(s, 'SECTOR RISK', M + 6.43, 5.0, 5, 0.3, { fontSize: 11, bold: true, color: C.deep, charSpacing: 2 });
    txt(s, 'Adverse clinical event linked to a training gap', M + 6.43, 5.35, 5.5, 0.5, { fontFace: TITLE, fontSize: 20, bold: true, fit: 'shrink' }); txt(s, 'Reviewed at each gate through the healthcare readiness checklist.', M + 6.43, 5.9, 5.5, 0.6, { fontSize: 13, color: C.ink }); }
  { const s = content('Four challenges', 'What Learning & Development teams in hospitals must solve');
    const ch = [['Stethoscope', 'Clinical competence', 'Map every Clinical Care & Nursing position to its obligations and keep certificates valid.'], ['FileCheck', 'Audit-ready evidence', 'Attendance, results and manager observations kept per step, retrievable for a survey.'], ['Cpu', 'Digital and AI adoption', 'Electronic records, telemedicine, AI triage and imaging change daily practice.'], ['Building2', 'Multi-site, multilingual', 'Several sites and three working languages — English, French and Arabic.']];
    for (const [i, [ic, a, b]] of ch.entries()) { const x = M + i * 3.07; card(s, x, 2.0, 2.85, 4.4, i === 0 ? C.tint : C.white); await badge(s, ic, x + 0.3, 2.3, 0.8, i === 0 ? C.orange : C.ink);
      txt(s, a, x + 0.3, 3.35, 2.3, 0.8, { fontFace: TITLE, fontSize: 19, bold: true }); txt(s, b, x + 0.3, 4.2, 2.3, 2.0, { fontSize: 14, color: C.ink }); } }
  { const s = content('The health ecosystem', 'Four healthcare verticals, each with its own standards', 'Each vertical brings its macro processes, end-to-end processes and readiness checklist.');
    for (const [i, v] of D.verticals.entries()) { const x = M + i * 3.07; card(s, x, 2.1, 2.85, 4.3, i === 0 ? C.tint : C.white);
      txt(s, v.id, x + 0.3, 2.3, 2.3, 0.4, { fontSize: 12, bold: true, color: C.deep, charSpacing: 2 }); txt(s, L(v.name), x + 0.3, 2.65, 2.3, 0.8, { fontFace: TITLE, fontSize: 18, bold: true });
      txt(s, 'Standards', x + 0.3, 3.55, 2.3, 0.3, { fontSize: 11, bold: true, color: C.ink }); txt(s, v.standards.join('\n'), x + 0.3, 3.85, 2.3, 0.95, { fontSize: 13 });
      txt(s, 'Core function', x + 0.3, 4.85, 2.3, 0.3, { fontSize: 11, bold: true, color: C.ink }); txt(s, L(v.coreFunction?.name), x + 0.3, 5.15, 2.3, 0.6, { fontSize: 13 });
      txt(s, `Demo: ${L(v.large?.name)}`, x + 0.3, 5.8, 2.3, 0.5, { fontSize: 10.5, color: C.medium }); } }
  { const s = content('Healthcare providers', 'Priority skills themes, digital and AI', 'Seeded for the Healthcare Providers vertical; each organization adjusts them during diagnosis.');
    for (const [i, [head, list, ic]] of [['Digital skills', HC.themes.digital, 'MonitorSmartphone'], ['AI skills', HC.themes.ai, 'Sparkles']].entries()) { const x = M + i * 6.13; card(s, x, 2.1, 5.95, 4.3);
      await badge(s, ic, x + 0.3, 2.35, 0.65, i ? C.orange : C.ink); txt(s, head, x + 1.15, 2.42, 4, 0.5, { fontFace: TITLE, fontSize: 20, bold: true, valign: 'middle' });
      for (const [k, t] of list.entries()) { const y = 3.35 + k * 0.95; s.addShape(pres.shapes.OVAL, { x: x + 0.35, y: y + 0.02, w: 0.42, h: 0.42, fill: { color: C.light }, line: { color: C.line } });
        txt(s, String(k + 1), x + 0.35, y + 0.02, 0.42, 0.42, { fontSize: 13, bold: true, align: 'center', valign: 'middle' }); txt(s, L(t), x + 1.0, y, 4.7, 0.5, { fontSize: 15, valign: 'middle' }); } } }

  // Section 2
  divider('02', 'The solution', 'One lifecycle, seven phases, gates, and healthcare-specific processes');
  { const s = content('The lifecycle', 'One lifecycle, seven phases', 'Each phase groups end-to-end processes; a gate closes each main phase.');
    const ph = D.phases.filter(p => p.no > 0); const bw = (W - 2 * M - 0.25 * 5) / 6;
    ph.forEach((p, i) => { const x = M + i * (bw + 0.25), y = 2.3; card(s, x, y, bw, 2.8, i === 2 ? C.tint : C.white);
      txt(s, String(p.no), x + 0.2, y + 0.2, 1, 0.6, { fontFace: TITLE, fontSize: 30, bold: true, color: C.deep });
      txt(s, L(p.name), x + 0.2, y + 0.85, bw - 0.4, 1.0, { fontSize: 14, bold: true }); txt(s, `${p.e2e.length} processes`, x + 0.2, y + 1.9, bw - 0.4, 0.3, { fontSize: 12, color: C.ink });
      txt(s, p.gate, x + 0.2, y + 2.3, 0.6, 0.32, { fontSize: 11, bold: true, color: C.white, fill: { color: C.ink }, align: 'center', valign: 'middle' }); });
    card(s, M, 5.45, W - 2 * M, 1.05, C.light); await badge(s, 'Layers', M + 0.25, 5.64, 0.66, C.ink);
    txt(s, [{ text: 'Enablers run across all phases — ', options: { bold: true } }, { text: 'data, AI and integration · change and adoption · quality, risk and improvement', options: { color: C.ink } }], M + 1.15, 5.6, W - 2 * M - 1.4, 0.75, { fontSize: 15, valign: 'middle' }); }
  { const s = content('Gates', 'Six gates, each with a checklist and named approvers', 'A phase closes only when the mandatory items are met and the decision is recorded.');
    table(s, ['Gate', 'Purpose', 'Approvers'], D.gates.map(g => [{ text: L(g.name), bold: true }, L(g.purpose), (g.approvers || []).map(L).join(', ')]), M, 2.05, W - 2 * M, [3.4, 5.9, 2.83], { fontSize: 11.5, rowH: 0.62 }); }
  { const s = content('Healthcare processes', 'Three healthcare macro processes on top of the core model', 'Added automatically when the organization’s sector is Healthcare Providers.');
    const mps = D.verticalMp.filter(m => String(m.id).startsWith('HCPR'));
    for (const [i, m] of mps.entries()) { const x = M + i * 4.1; card(s, x, 2.1, 3.85, 4.3, i === 0 ? C.tint : C.white); await badge(s, ['ShieldCheck', 'Award', 'Cpu'][i], x + 0.3, 2.35, 0.65, i ? C.ink : C.orange);
      txt(s, m.id, x + 1.1, 2.45, 2.5, 0.4, { fontSize: 12, bold: true, color: C.deep, charSpacing: 2, valign: 'middle' });
      txt(s, stripV(L(m.name)), x + 0.3, 3.2, 3.3, 0.9, { fontFace: TITLE, fontSize: 17, bold: true });
      txt(s, L(m.objective), x + 0.3, 4.15, 3.3, 1.3, { fontSize: 13.5, color: C.ink }); txt(s, 'Owner: ' + L(m.owner), x + 0.3, 5.75, 3.3, 0.35, { fontSize: 12, bold: true }); } }
  { const s = content('Healthcare processes', 'Two healthcare end-to-end processes', 'Each has a trigger, an end state, the macro processes it crosses and its user-facing tasks.');
    const e2 = D.verticalE2E.filter(e => String(e.id).startsWith('HCPR'));
    for (const [i, e] of e2.entries()) { const x = M + i * 6.13; card(s, x, 2.05, 5.95, 4.55);
      txt(s, e.id, x + 0.3, 2.25, 3, 0.35, { fontSize: 12, bold: true, color: C.deep, charSpacing: 2 }); txt(s, stripV(L(e.name)), x + 0.3, 2.6, 5.4, 0.8, { fontFace: TITLE, fontSize: 18, bold: true });
      const rows = [['Goal', L(e.goal)], ['Trigger', L(e.trigger)], ['End state', L(e.terminal)], ['Crosses', (e.mps || []).join(' · ')], ['Tasks', `${e.stepsCount || (e.ufts || []).length} user-facing tasks`]];
      rows.forEach(([a, b], k) => { txt(s, a, x + 0.3, 3.5 + k * 0.6, 1.2, 0.55, { fontSize: 12, bold: true, color: C.ink }); txt(s, b, x + 1.5, 3.5 + k * 0.6, 4.2, 0.58, { fontSize: 12.5, fit: 'shrink' }); }); } }
  { const s = content('Compliance scaffolding', 'A readiness checklist for Healthcare Providers', 'Published once for the vertical; used at the gates and in the compliance extract.');
    const cl = D.checklists.find(c => c.id === 'CL-HCPR').data;
    table(s, ['Checklist item', 'Mandatory', 'Evidence'], cl.items.map(i => [L(i.text), i.mandatory ? 'Yes' : 'No', i.evidence ? 'Required' : '—']), M, 2.1, 6.4, [4.2, 1.0, 1.2], { fontSize: 12, rowH: 0.55 });
    card(s, M, 4.6, 6.4, 1.95, C.tint); await badge(s, 'Info', M + 0.3, 4.85, 0.55, C.ink);
    txt(s, 'Readiness support, not certification', M + 1.05, 4.85, 5.1, 0.45, { fontFace: TITLE, fontSize: 16, bold: true });
    txt(s, 'The application organizes evidence and checks readiness against ISO 7101, JCI and ISO 15189. The certification decision stays with the accreditation body.', M + 1.05, 5.3, 5.1, 1.2, { fontSize: 12.5, color: C.ink });
    screenshot(s, shotH('checklists.png'), 7.4, 2.1, 5.3); }
  { const s = content('Roles and accountability', `${D.roles.length} roles, one Accountable per activity`, 'RACSI: Responsible, Accountable, Consulted, Supported, Informed — allocated for every activity of the run.');
    screenshot(s, shotH('racsi.png'), M, 2.05, 7.6);
    const x = 8.6, w = W - M - x; const roles = ['R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'R-08', 'R-10'].map(id => D.roles.find(r => r.id === id)).filter(Boolean);
    txt(s, 'Examples of roles', x, 2.05, w, 0.35, { fontSize: 13, bold: true });
    txt(s, roles.map((r, j) => ({ text: L(r.name), options: { bullet: { indent: 12 }, breakLine: j < roles.length - 1 } })), x, 2.45, w, 2.6, { fontSize: 12.5, color: C.ink });
    await kpi(s, x, 5.2, w, `${H_.racsi.activities}`, 'activities in the hospital run, each with exactly one Accountable', 'Users'); }
  { const s = content('AI with a human checkpoint', `${D.aiUseCases.length} AI use cases, each reviewed by a person`, 'AI drafts; a named role accepts, edits or rejects. Every suggestion is logged with its outcome.');
    const risk = cnt(D.aiUseCases, a => a.risk);
    s.addChart(pres.charts.BAR, [{ name: 'Use cases', labels: ['Low', 'Medium', 'High'], values: [risk.Low || 0, risk.Medium || 0, risk.High || 0] }], { x: M, y: 2.05, w: 5.2, h: 3.9, barDir: 'col', chartColors: [C.orange], showValue: true, dataLabelPosition: 'outEnd', ...axis, showLegend: false });
    cap(s, 'Number of catalog AI use cases by risk level', M, 6.0, 5.2);
    const ex = ['AIUC-03', 'AIUC-21', 'AIUC-30', 'AIUC-15', 'AIUC-12'].map(id => D.aiUseCases.find(a => a.id === id));
    table(s, ['Use case', 'Risk', 'Human checkpoint'], ex.map(a => [L(a.name), { text: a.risk, fill: a.risk === 'High' ? S[0] : a.risk === 'Medium' ? S[1] : S[3] }, L(a.checkpoint)]), 6.2, 2.05, W - M - 6.2, [1.9, 0.8, 3.83], { fontSize: 10, rowH: 0.8 }); }

  // Section 3 — hospital case study
  divider('03', 'Case study: a hospital group', `${L(H_.org.name)} — ${num(H_.org.employees)} employees, ${H_.org.city}. Demonstration data, fictional organization.`, true);
  { const s = content('Case study · profile', L(H_.org.name), `Member of ${L(H_.group.name)} · Healthcare Providers · large company`);
    await kpi(s, M, 2.05, 2.9, num(H_.org.employees), 'employees', 'Users'); await kpi(s, M + 3.07, 2.05, 2.9, String(H_.obs.find(o => o.type === 'Function').n), 'functions in the organization structure', 'Network', C.ink);
    await kpi(s, M + 6.14, 2.05, 2.9, String(H_.users), 'named users, one per role', 'UserCheck', C.ink); await kpi(s, M + 9.21, 2.05, 2.9, '2', 'full runs in 2026: Digital and AI', 'RefreshCw', C.ink);
    const cfg = H_.config, bnd = D.bundles.find(b => b.id === cfg.pack_id), ad = JSON.parse(cfg.addons).map(id => L(D.addOns.find(a => a.id === id)?.name));
    table(s, ['Setting', 'Value'], [['Functions', H_.obsNodes.filter(n => n.type === 'Function').map(n => L(n.name)).join(', ')], ['Solution', `${bnd.id} ${L(bnd.name)} (${bnd.packsText})`], ['Add-ons', ad.join('; ')], ['Data protection frameworks', JSON.parse(cfg.compliance).map(id => L(D.compliance.find(c => c.id === id)?.name)).join(', ')], ['Deployment · seats', `${cfg.deployment} · ${cfg.seats} seats`], ['Justification on governed changes', cfg.justification_required ? 'Required' : 'Optional']], M, 3.75, W - 2 * M, [3.2, 8.93], { fontSize: 12, rowH: 0.43 }); }
  { const s = content('Case study · workspace', 'The AI skills run on one screen', L(HA.project.name));
    screenshot(s, shotH('ws.png'), M, 1.95, 7.9);
    await bullets(s, [`${pct(tH)}% of ${tH.n} tasks completed; ${tH.wip} in progress, ${tH.blocked} blocked.`, `${tH.overdue} tasks overdue — each raises an alert with an escalation chain.`, `Complexity score ${cs.score}: Full mode, all seven phases and six gates.`], 9.0, 2.1, W - M - 9.0, 1.4, 14.5); }
  { const s = content('Case study · two runs', 'Two runs: the Digital run leads on delivery and evaluation', 'Share of tasks completed per phase, same organization, same template.');
    s.addChart(pres.charts.BAR, [{ name: `AI run (${pct(tH)}%)`, labels: phaseShort, values: byPhase(HA) }, { name: `Digital run (${pct(tD)}%)`, labels: phaseShort, values: byPhase(HD) }], { x: M, y: 1.95, w: 8.3, h: 4.55, barDir: 'col', barGrouping: 'clustered', chartColors: [C.orange, C.medium], showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0"%"', dataLabelFontSize: 9, valAxisMaxVal: 110, valAxisMinVal: 0, valAxisHidden: true, valGridLine: { style: 'none' }, ...axis, showLegend: true, legendPos: 'b' });
    cap(s, 'Tasks completed / tasks planned in each phase (%)', M, 6.55, 8.3);
    const x = 9.3, w = W - M - x;
    await kpi(s, x, 2.0, w, `${tD.done} / ${tD.n}`, 'tasks completed in the Digital run', 'MonitorSmartphone', C.ink); await kpi(s, x, 3.55, w, `${tH.done} / ${tH.n}`, 'tasks completed in the AI run', 'Sparkles');
    txt(s, 'Scope, diagnosis and the report are complete in both runs; the gap opens in delivery and evaluation.', x, 5.1, w, 1.2, { fontSize: 13.5, color: C.ink }); }
  { const s = content('Phase 0 · complexity', `Complexity score ${cs.score} out of 100: Full mode`, 'Seven weighted criteria rated 1–5 when the project is created; the score recommends the mode.');
    const lab = { impact: 'Business impact', novelty: 'Novelty', regulatory: 'Regulatory exposure', investment: 'Investment', scope: 'Scope', uncertainty: 'Uncertainty', ttm: 'Time to market' };
    const k = Object.keys(cs.values);
    s.addChart(pres.charts.BAR, [{ name: 'Rating', labels: k.map(x => lab[x] || x), values: k.map(x => cs.values[x]) }], { x: M, y: 1.95, w: 7.6, h: 4.5, barDir: 'bar', chartColors: [C.orange], showValue: true, dataLabelPosition: 'outEnd', valAxisMaxVal: 5, valAxisMinVal: 0, valAxisMajorUnit: 1, ...axis, catAxisOrientation: 'maxMin', showLegend: false });
    cap(s, 'Rating of each complexity criterion (1 = low, 5 = high)', M, 6.5, 7.6);
    const x = 8.7, w = W - M - x; card(s, x, 2.0, w, 2.1, C.tint);
    txt(s, String(cs.score), x + 0.3, 2.15, 2, 1.0, { fontFace: TITLE, fontSize: 54, bold: true, color: C.deep }); txt(s, 'Full mode: score of 70 or more', x + 0.3, 3.25, w - 0.5, 0.6, { fontSize: 14, bold: true });
    txt(s, 'Below 70, the score recommends SME mode and one of three tracks (T1, T2, T3). Choosing a different track requires a written justification.', x, 4.4, w, 1.8, { fontSize: 13.5, color: C.ink }); }
  { const s = content('Phase 1 · scope of work', 'A scope approved before any data is collected', `Approved on ${date(sow.approved_on)} · focus ${sow.focus} · decision levels ${sow.decision_levels.join(' / ')}`);
    await kpi(s, M, 2.05, 2.9, String(R.ScopeCriterion.length), 'scope criteria: function × decision level', 'Grid3x3'); await kpi(s, M + 3.07, 2.05, 2.9, String(R.Stakeholder.length), 'stakeholders in the register', 'Users', C.ink);
    await kpi(s, M + 6.14, 2.05, 2.9, `${cnt(R.Stakeholder, x => x.consent_status).Given}/${R.Stakeholder.length}`, 'stakeholders with consent recorded', 'ShieldCheck', C.ink); await kpi(s, M + 9.21, 2.05, 2.9, 'v' + sow.version_no, 'approved version of the Scope of Work', 'FileCheck', C.ink);
    const lv = cnt(R.Stakeholder, x => x.decision_level), ch = cnt(R.Stakeholder, x => x.preferred_channel);
    s.addChart(pres.charts.BAR, [{ name: 'Stakeholders', labels: ['Strategic (MS)', 'Managerial (MO)', 'Operational (OP)'], values: [lv.MS, lv.MO, lv.OP] }], { x: M, y: 3.65, w: 5.9, h: 2.8, barDir: 'bar', chartColors: [C.orange], showValue: true, dataLabelPosition: 'outEnd', ...axis, valAxisHidden: true, valGridLine: { style: 'none' }, catAxisOrientation: 'maxMin', showLegend: false });
    cap(s, 'Stakeholders by decision level', M, 6.5, 5.9);
    s.addChart(pres.charts.BAR, [{ name: 'Stakeholders', labels: Object.keys(ch), values: Object.values(ch) }], { x: M + 6.2, y: 3.65, w: 5.9, h: 2.8, barDir: 'bar', chartColors: [C.medium], showValue: true, dataLabelPosition: 'outEnd', ...axis, valAxisHidden: true, valGridLine: { style: 'none' }, catAxisOrientation: 'maxMin', showLegend: false });
    cap(s, 'Stakeholders by preferred channel', M + 6.2, 6.5, 5.9); }
  { const s = content('Phase 1 · evidence', `${qr.length} questionnaire responses, ${compl}% complete on average`, 'Questions drafted by AI from the Scope of Work, validated by a person, sent through each stakeholder’s channel.');
    const ch = cnt(qr, x => x.channel_used);
    s.addChart(pres.charts.DOUGHNUT, [{ name: 'Responses', labels: Object.keys(ch), values: Object.values(ch) }], { x: M, y: 1.95, w: 5.2, h: 4.4, holeSize: 58, chartColors: [C.orange, C.medium, C.line], showPercent: false, showValue: true, dataLabelColor: C.dark, dataLabelFontSize: 12, showLegend: true, legendPos: 'b', legendFontFace: BODY, legendFontSize: 12, legendColor: C.ink });
    cap(s, 'Questionnaire responses by channel used', M, 6.4, 5.2);
    const bins = [0, 0, 0]; qr.forEach(x => bins[x.completeness_pct >= 95 ? 2 : x.completeness_pct >= 85 ? 1 : 0]++);
    s.addChart(pres.charts.BAR, [{ name: 'Responses', labels: ['Below 85%', '85–94%', '95% and more'], values: bins }], { x: 6.2, y: 1.95, w: 6.5, h: 4.4, barDir: 'col', chartColors: [C.orange], showValue: true, dataLabelPosition: 'outEnd', ...axis, showLegend: false });
    cap(s, 'Responses by completeness of the answers', 6.2, 6.4, 6.5); }
  { const g1 = gates[0]; const s = content('Gate G1', `${L(g1.gate_name)}: “${g1.decision}”`, `Decided on ${date(g1.decided_at)} · ${L(g1.decision_comment)}`);
    table(s, ['Checklist item', 'Mandatory', 'Evidence', 'Status'], g1.items.map(i => [L(i.text), i.mandatory ? 'Yes' : 'No', i.evidence ? 'Attached' : '—', { text: i.done ? 'Done' : 'Open', fill: i.done ? S[3] : S[0] }]), M, 2.1, W - 2 * M, [7.53, 1.5, 1.6, 1.5], { fontSize: 13, rowH: 0.62 });
    cap(s, 'A gate cannot be signed off while a mandatory item is open; the approvers are ' + (D.gates[0].approvers || []).map(L).join(' and ') + '.', M, 6.05, W - 2 * M); }
  { const da = R.DiagnosticAssessment[0].axis_scores; const s = content('Phase 2 · diagnosis', 'Five-axis diagnostic: information systems score lowest', `Findings ${R.DiagnosticAssessment[0].findings_status.toLowerCase()} with the sponsor · scores on a 0–5 scale`);
    const lab = ['Strategy', 'Organization', 'Processes', 'People', 'Information systems'];
    s.addChart(pres.charts.RADAR, [{ name: 'Current score', labels: lab, values: [da.strategy, da.organization, da.processes, da.people, da.is] }], { x: M, y: 1.9, w: 6.6, h: 4.6, radarStyle: 'marker', chartColors: [C.orange], lineSize: 2, valAxisMaxVal: 5, valAxisMinVal: 0, valAxisMajorUnit: 1, ...axis, catAxisLabelFontSize: 12, showLegend: false });
    cap(s, 'Score of each diagnostic axis (0–5)', M, 6.5, 6.6);
    const x = 7.6, w = W - M - x;
    R.MaturityAssessment.forEach((m, i) => { const y = 2.05 + i * 1.65; card(s, x, y, w, 1.45, i ? C.white : C.tint);
      txt(s, L(m.label), x + 0.3, y + 0.15, w - 0.6, 0.4, { fontSize: 14, bold: true });
      txt(s, [{ text: String(m.overall_level), options: { color: C.deep } }, { text: '  →  ', options: { color: C.medium } }, { text: String(m.target_level), options: { color: C.dark } }], x + 0.3, y + 0.55, 2.5, 0.75, { fontFace: TITLE, fontSize: 32, bold: true, valign: 'middle' });
      txt(s, 'current level → target level (1–5)', x + 2.6, y + 0.7, w - 2.8, 0.5, { fontSize: 12, color: C.ink, valign: 'middle' }); });
    txt(s, `Lowest axis: information systems (${da.is}). Highest: strategy (${da.strategy}).`, x, 5.45, w, 0.9, { fontSize: 14, color: C.ink }); }
  { const pa = R.PerformanceAssessment; const fns = [...new Set(pa.map(p => L(p.function_name)))]; const s = content('Phase 2 · performance', `${pa.filter(p => p.rag === 'Red').length} of ${pa.length} cells are Red`, 'Performance by function and decision level: MS strategic, MO managerial, OP operational.');
    const cell = (f, l) => pa.find(p => L(p.function_name) === f && p.level === l);
    table(s, ['Function', 'MS', 'MO', 'OP'], fns.map(f => [{ text: L(f), bold: true }, ...['MS', 'MO', 'OP'].map(l => { const c = cell(f, l); return { text: `${c.score_pct}%`, fill: RAG[c.rag], align: 'center' }; })]), M, 2.05, 7.4, [3.2, 1.4, 1.4, 1.4], { fontSize: 13, rowH: 0.52 });
    cap(s, 'Score per cell; fill shows the RAG status (red, amber, green)', M, 6.3, 7.4);
    const x = 8.5, w = W - M - x; const cc = pa.filter(p => L(p.function_name) === CORE());
    card(s, x, 2.05, w, 4.2, C.white); txt(s, CORE(), x + 0.3, 2.25, w - 0.6, 0.4, { fontFace: TITLE, fontSize: 17, bold: true });
    cc.forEach((c, k) => { const y = 2.85 + k * 1.05; txt(s, c.level, x + 0.3, y, 0.7, 0.4, { fontSize: 13, bold: true, color: C.white, fill: { color: c.rag === 'Red' ? C.ink : C.medium }, align: 'center', valign: 'middle' });
      txt(s, `${c.score_pct}% · ${c.rag}`, x + 1.15, y - 0.02, w - 1.4, 0.35, { fontSize: 13, bold: true }); txt(s, 'Gap: ' + L(c.gap_comment), x + 1.15, y + 0.33, w - 1.4, 0.6, { fontSize: 11.5, color: C.ink }); }); }
  { const sw = R.FunctionalSwot[0]; const s = content('Phase 2 · SWOT and improvement axes', 'Four improvement axes, ranked', `Functional SWOT ${sw.status.toLowerCase()} for ${R.FunctionalSwot.map(x => L(x.function_name)).join(' and ')}.`);
    const q = [['Strengths', sw.strengths, C.white], ['Weaknesses', sw.weaknesses, C.light], ['Opportunities', sw.opportunities, C.tint], ['Threats', sw.threats, C.light]];
    q.forEach(([a, b, f], i) => { const x = M + (i % 2) * 3.05, y = 2.05 + Math.floor(i / 2) * 2.25; card(s, x, y, 2.9, 2.05, f);
      txt(s, a, x + 0.25, y + 0.2, 2.4, 0.4, { fontFace: TITLE, fontSize: 16, bold: true, color: i === 2 ? C.deep : C.dark }); txt(s, L(b), x + 0.25, y + 0.7, 2.4, 1.2, { fontSize: 13, color: C.ink }); });
    const ia = R.ImprovementAxis.sort((a, b) => a.priority_rank - b.priority_rank);
    s.addChart(pres.charts.BAR, [{ name: 'Implemented', labels: ia.map(a => `${a.priority_rank}. ${L(a.label)}`), values: ia.map(a => a.implementation_pct) }], { x: 6.9, y: 1.95, w: 5.8, h: 4.4, barDir: 'bar', chartColors: [C.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0"%"', valAxisMaxVal: 100, valAxisMinVal: 0, ...axis, catAxisLabelFontSize: 10.5, catAxisOrientation: 'maxMin', showLegend: false });
    cap(s, 'Implementation progress of each improvement axis, by priority rank (%)', 6.9, 6.4, 5.8); }
  { const s = content('Phase 2 · skills gaps and needs', 'From individual gaps to validated training demands', 'Gaps come from skills assessments; needs and demands are validated before prioritization.');
    await kpi(s, M, 2.05, 2.9, String(R.SkillAssessment.length), 'skills assessments recorded', 'ClipboardCheck', C.ink); await kpi(s, M + 3.07, 2.05, 2.9, String(R.SkillGap.length), `skill gaps, ${R.SkillGap.filter(g => g.is_critical).length} critical`, 'TriangleAlert');
    await kpi(s, M + 6.14, 2.05, 2.9, String(R.TrainingNeed.length), `training needs, ${R.TrainingNeed.filter(n => n.validation_status === 'Validated').length} validated`, 'ListChecks', C.ink); await kpi(s, M + 9.21, 2.05, 2.9, String(R.TrainingDemand.length), 'training demands from managers and staff', 'Inbox', C.ink);
    const g = {}; R.SkillGap.forEach(x => { const k = L(x.competency); g[k] = g[k] || []; g[k].push(x.gap_value); });
    const ks = Object.keys(g);
    s.addChart(pres.charts.BAR, [{ name: 'Average gap (levels)', labels: ks, values: ks.map(k => +(sum(g[k], v => v) / g[k].length).toFixed(1)) }, { name: 'Number of gaps', labels: ks, values: ks.map(k => g[k].length) }], { x: M, y: 3.6, w: 8.0, h: 2.9, barDir: 'bar', barGrouping: 'clustered', chartColors: [C.orange, C.medium], showValue: true, dataLabelPosition: 'outEnd', ...axis, valAxisHidden: true, valGridLine: { style: 'none' }, catAxisOrientation: 'maxMin', showLegend: true, legendPos: 'b' });
    cap(s, 'Skill gaps by competency: average gap in proficiency levels and number of gaps', M, 6.55, 8.0);
    const dm = cnt(R.TrainingDemand, d => d.priority); const x = 9.0, w = W - M - x;
    txt(s, 'Training demands by priority', x, 3.65, w, 0.35, { fontSize: 13, bold: true });
    table(s, ['Priority', 'Demands'], ['High', 'Medium', 'Low'].filter(p => dm[p]).map(p => [p, String(dm[p])]), x, 4.05, w, [w * 0.6, w * 0.4], { fontSize: 12, rowH: 0.4 }); }
  { const tt = R.TrainingTheme.sort((a, b) => a.priority_rank - b.priority_rank); const s = content('Phase 3 · prioritization', 'Six AI themes, ranked by impact and urgency', 'AI proposes a priority score; the L&D Strategist accepts or changes it with a justification.');
    table(s, ['#', 'Theme', 'Impact', 'Urgency', 'Days × groups', 'Trainer', 'Budget'], tt.map(t => [String(t.priority_rank), { text: L(t.name), bold: t.priority_rank === 1 }, { text: String(t.impact_score), fill: S[t.impact_score - 1], align: 'center' }, { text: String(t.urgency), fill: S[t.urgency - 1], align: 'center' }, { text: `${t.days_per_group} × ${t.group_count}`, align: 'center' }, t.trainer, { text: num(t.budget), align: 'right' }]), M, 2.05, W - 2 * M, [0.5, 4.6, 1.1, 1.1, 1.6, 1.6, 1.63], { fontSize: 12.5, rowH: 0.5 });
    cap(s, 'Impact and urgency on a 1–5 scale; cell fill follows the status scale (red = 1, dark green = 5). Budget as recorded in the plan.', M, 5.75, W - 2 * M); }
  { const rep = R.TrainingEngineeringReport[0]; const s = content('Phase 3 · report and roadmap', 'The Training Engineering Report, published and versioned', `Status ${rep.status} · version ${rep.version_no} · ${rep.ai_generated_sections} sections drafted by AI and reviewed by the Quality Manager`);
    const ri = R.RoadmapInitiative; const x0 = M, w0 = 7.5, cw = w0 / 3;
    ['Wave 1', 'Wave 2', 'Wave 3'].forEach((p, i) => { s.addShape(pres.shapes.RECTANGLE, { x: x0 + i * cw, y: 2.05, w: cw - 0.05, h: 0.42, fill: { color: i === 0 ? C.orange : C.ink }, line: { color: C.white } });
      txt(s, p, x0 + i * cw, 2.05, cw - 0.05, 0.42, { fontSize: 13, bold: true, color: C.white, align: 'center', valign: 'middle' }); });
    ri.forEach((r, k) => { const y = 2.7 + k * 0.72; card(s, x0 + (r.phase - 1) * cw + 0.05, y, cw - 0.15, 0.58, r.phase === 1 ? C.tint : C.white); txt(s, L(r.label), x0 + (r.phase - 1) * cw + 0.18, y + 0.04, cw - 0.4, 0.5, { fontSize: 11.5, valign: 'middle', fit: 'shrink' }); });
    cap(s, 'Roadmap initiatives by wave', x0, 5.65, w0);
    const x = 8.5, w = W - M - x; txt(s, 'Strategic objectives', x, 2.05, w, 0.35, { fontSize: 14, bold: true });
    R.StrategicObjective.forEach((o, i) => { const y = 2.5 + i * 1.55; card(s, x, y, w, 1.35); txt(s, o.code, x + 0.25, y + 0.15, 1, 0.3, { fontSize: 12, bold: true, color: C.deep });
      txt(s, 'by ' + date(o.horizon_date), x + 1.2, y + 0.15, w - 1.45, 0.3, { fontSize: 11, color: C.medium, align: 'right' }); txt(s, L(o.statement), x + 0.25, y + 0.5, w - 0.5, 0.8, { fontSize: 12.5, fit: 'shrink' }); });
    const ir = R.IntelligenceReport[0]; txt(s, `Input: ${L(ir.label)}, updated ${date(ir.last_updated_on)}.`, x, 5.7, w, 0.6, { fontSize: 11.5, color: C.ink }); }
  { const bl = R.BudgetLine; const s = content('Phase 3 · plan and budget', `${plan.plan_year} plan locked: ${num(plan.total_budget)} budgeted, ${plan.realization_rate}% realized`, 'Planned, committed and actual amounts per theme, as recorded (currency set per organization).');
    const lab = bl.map(b => L(b.label).replace('and clinical decision support', '& decision support'));
    s.addChart(pres.charts.BAR, [{ name: 'Planned', labels: lab, values: bl.map(b => b.planned_amount) }, { name: 'Committed', labels: lab, values: bl.map(b => b.committed_amount) }, { name: 'Actual', labels: lab, values: bl.map(b => b.actual_amount) }], { x: M, y: 1.95, w: 8.6, h: 4.55, barDir: 'bar', barGrouping: 'clustered', chartColors: [C.line, C.medium, C.orange], showValue: false, ...axis, catAxisLabelFontSize: 10, valAxisLabelFormatCode: LANG === 'fr' ? '# ##0' : '#,##0', catAxisOrientation: 'maxMin', showLegend: true, legendPos: 'b' });
    cap(s, 'Planned, committed and actual spend per theme', M, 6.55, 8.6);
    const x = 9.6, w = W - M - x; const tot = k => sum(bl, b => b[k]);
    await kpi(s, x, 2.0, w, num(tot('committed_amount')), `committed (${Math.round(tot('committed_amount') / tot('planned_amount') * 100)}% of planned)`, 'FileSignature', C.ink);
    await kpi(s, x, 3.5, w, num(tot('actual_amount')), `actual spend (${Math.round(tot('actual_amount') / tot('planned_amount') * 100)}% of planned)`, 'Receipt');
    await kpi(s, x, 5.0, w, num(tot('refund_forecast')), 'refund forecast from training contracts', 'Undo2', C.ink); }
  { const rs = R.RegulatorySubmission[0]; const s = content('Phase 3 · funding and regulation', 'Training contract refunds, tracked to the deadline', `${L(rs.label)} · regulator ${rs.regulator} · deadline ${date(rs.deadline)} · status ${rs.status}`);
    const bl = R.BudgetLine; table(s, ['Theme', 'Planned', 'Actual', 'Refund forecast', 'Refund / planned'], bl.map(b => [L(b.label), { text: num(b.planned_amount), align: 'right' }, { text: num(b.actual_amount), align: 'right' }, { text: num(b.refund_forecast), align: 'right' }, { text: Math.round(b.refund_forecast / b.planned_amount * 100) + '%', align: 'center' }]), M, 2.1, 8.2, [3.6, 1.15, 1.15, 1.25, 1.05], { fontSize: 12, rowH: 0.48 });
    const x = 9.2, w = W - M - x; card(s, x, 2.1, w, 3.4, C.tint); await badge(s, 'CalendarClock', x + 0.3, 2.35, 0.6);
    txt(s, 'Deadline alerts', x + 1.1, 2.4, w - 1.3, 0.5, { fontFace: TITLE, fontSize: 17, bold: true, valign: 'middle' });
    txt(s, 'A missed submission deadline means a lost refund. The run records the file, its deadline and its status, and the risk register tracks “Missed regulatory submission deadline and lost refund”.', x + 0.3, 3.1, w - 0.6, 2.3, { fontSize: 13, color: C.ink }); }
  { const s = content('Phase 4 · design and delivery', 'Learning paths, modules and sessions', `${R.LearningPath.length} learning paths · ${R.LearningModule.length} modules · ${R.Session.length} sessions · ${R.Enrollment.length} enrollments`);
    table(s, ['Module', 'Modality', 'Hours', 'Design status'], R.LearningModule.map(m => [L(m.label), m.modality, { text: String(m.duration_hours), align: 'center' }, { text: m.design_status, fill: m.design_status === 'Approved' ? S[3] : S[1] }]), M, 2.1, 7.4, [3.9, 1.3, 0.8, 1.4], { fontSize: 12, rowH: 0.5 });
    table(s, ['Session', 'Starts', 'Capacity'], R.Session.map(x => [L(x.label), date(x.start_at), { text: String(x.capacity), align: 'center' }]), M, 4.9, 7.4, [4.5, 1.8, 1.1], { fontSize: 11.5, rowH: 0.34 });
    const x = 8.5, w = W - M - x; await kpi(s, x, 2.1, w, String(R.ContentAsset.length), 'content assets tagged to competencies', 'FileVideo', C.ink);
    await kpi(s, x, 3.65, w, String(sum(R.Session, x => x.capacity)), 'seats scheduled across the sessions', 'CalendarDays');
    txt(s, 'Attendance is recorded per session; a missing attendance record raises an alert to the Training Administrator.', x, 5.2, w, 1.2, { fontSize: 13, color: C.ink }); }
  { const s = content('Every task · what to type', 'Guidance written for this hospital and this sector', 'The task panel shows the expected answer, the inputs and outputs, the owner and the evaluator.');
    screenshot(s, shotH('task03.png'), M, 1.95, 7.9);
    await bullets(s, ['“What to type” is specific to the organization, its sector and the focus of the run.', 'AI help proposes a draft, labelled with its confidence and sources.', 'Owner and evaluator are two different people: segregation of duties is enforced.'], 9.0, 2.1, W - M - 9.0, 1.4, 14.5); }
  { const ev = R.Evaluation, ce = R.Certification; const s = content('Phase 5 · evaluation and certification', 'Kirkpatrick levels 1 to 3, and certificate validity', 'Evaluation results per enrollment; certificates tracked against their expiry date.');
    const lv = [1, 2, 3]; const a = ev.filter((_, i) => i < 3), b = ev.filter((_, i) => i >= 3);
    s.addChart(pres.charts.BAR, [{ name: 'Cohort 1', labels: lv.map(l => 'Level ' + l), values: lv.map(l => a.find(e => e.level === l)?.score_pct || 0) }, { name: 'Cohort 2', labels: lv.map(l => 'Level ' + l), values: lv.map(l => b.find(e => e.level === l)?.score_pct || 0) }], { x: M, y: 1.95, w: 6.4, h: 4.5, barDir: 'col', barGrouping: 'clustered', chartColors: [C.orange, C.medium], showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0"%"', valAxisMaxVal: 100, valAxisMinVal: 0, ...axis, showLegend: true, legendPos: 'b' });
    cap(s, 'Evaluation score by Kirkpatrick level: 1 reaction, 2 learning, 3 behaviour (%)', M, 6.5, 6.4);
    const st = cnt(ce, c => c.status);
    table(s, ['Certificate', 'Valid until', 'Status'], ce.sort((x, y) => x.valid_until.localeCompare(y.valid_until)).map(c => [L(c.label), date(c.valid_until), { text: c.status, fill: c.status === 'Valid' ? S[3] : c.status === 'Expiring' ? S[1] : S[0] }]), 7.4, 2.05, W - M - 7.4, [2.3, 1.75, 1.28], { fontSize: 12, rowH: 0.44 });
    txt(s, `${st.Valid || 0} valid · ${st.Expiring || 0} expiring · ${st.Expired || 0} expired. Expiry raises an alert before the date.`, 7.4, 5.4, W - M - 7.4, 0.8, { fontSize: 13, color: C.ink }); }
  { const s = content('Gates', `${signed} gates signed off, ${gates.length - signed} open`, 'Where the run stands: mandatory items completed at each gate.');
    const bw = (W - 2 * M - 0.2 * 5) / 6;
    gates.forEach((g, i) => { const x = M + i * (bw + 0.2), y = 2.1, done = g.items.filter(t => t.done).length, ok = g.state === 'Signed off';
      card(s, x, y, bw, 3.6, ok ? C.white : C.light); txt(s, L(g.gate_name).split(' — ')[0], x + 0.2, y + 0.2, bw - 0.4, 0.5, { fontFace: TITLE, fontSize: 24, bold: true, color: ok ? C.deep : C.ink });
      txt(s, L(g.gate_name).split(' — ')[1], x + 0.2, y + 0.8, bw - 0.4, 0.9, { fontSize: 13, bold: true });
      txt(s, `${done} / ${g.items.length}`, x + 0.2, y + 1.8, bw - 0.4, 0.5, { fontFace: TITLE, fontSize: 22, bold: true }); txt(s, 'items completed', x + 0.2, y + 2.3, bw - 0.4, 0.3, { fontSize: 11, color: C.ink });
      txt(s, ok ? `${g.decision} · signed off` : 'Open', x + 0.2, y + 2.9, bw - 0.4, 0.4, { fontSize: 12, bold: true, color: C.dark, fill: { color: ok ? S[3] : S[1] }, align: 'center', valign: 'middle' }); });
    cap(s, 'Each gate has its own checklist; the sign-off records the decision, the approver and the date.', M, 5.95, W - 2 * M); }
  { const rk = H_.orgRecords.RiskOpportunity; const s = content('Governance · risks', `${rk.length} risks scored by likelihood and impact`, 'Each risk is linked to its controls, a key risk indicator and an owner.');
    const x0 = M + 0.5, y0 = 2.3, c = 0.7;
    for (let li = 5; li >= 1; li--) for (let im = 1; im <= 5; im++) { const n = rk.filter(r => r.likelihood === li && r.impact === im).length, sc = li * im;
      const fill = sc >= 15 ? S[0] : sc >= 8 ? S[1] : sc >= 4 ? S[2] : S[3];
      s.addShape(pres.shapes.RECTANGLE, { x: x0 + (im - 1) * c, y: y0 + (5 - li) * c, w: c - 0.04, h: c - 0.04, fill: { color: fill }, line: { color: C.white } });
      if (n) txt(s, String(n), x0 + (im - 1) * c, y0 + (5 - li) * c, c - 0.04, c - 0.04, { fontSize: 15, bold: true, align: 'center', valign: 'middle' }); }
    for (let i = 1; i <= 5; i++) { txt(s, String(i), x0 + (i - 1) * c, y0 + 5 * c + 0.02, c, 0.3, { fontSize: 10, color: C.medium, align: 'center' }); txt(s, String(i), x0 - 0.35, y0 + (5 - i) * c, 0.3, c, { fontSize: 10, color: C.medium, align: 'right', valign: 'middle' }); }
    txt(s, 'Impact →', x0, y0 + 5 * c + 0.3, 5 * c, 0.3, { fontSize: 11, color: C.ink, align: 'center' }); txt(s, 'Likelihood ↓', M - 0.2, y0 - 0.32, 1.6, 0.3, { fontSize: 11, color: C.ink });
    cap(s, 'Number of risks per likelihood × impact cell', M, 6.6, 4.5);
    const top = [...rk].sort((a, b) => b.score - a.score).slice(0, 7);
    table(s, ['Code', 'Risk', 'Category', 'Score'], top.map(r => [r.code, L(r.title), L(r.category), { text: String(r.score), align: 'center', fill: r.score >= 9 ? S[1] : S[2] }]), 5.3, 2.05, W - M - 5.3, [1.1, 4.1, 1.35, 0.88], { fontSize: 11, rowH: 0.52 }); }
  { const ct = H_.orgRecords.Control; const co = {}; ct.forEach(x => { co[x.coso] = co[x.coso] || { n: 0, e: 0 }; co[x.coso].n++; if (x.effectiveness === 'Effective') co[x.coso].e++; });
    const ks = ['Control Environment', 'Risk Assessment', 'Control Activities', 'Information & Communication', 'Monitoring Activities'];
    const s = content('Governance · controls', `${ct.length} controls mapped to the COSO components`, `${sum(Object.values(co), v => v.e)} rated effective · ${H_.orgRecords.BusinessRule.length} business rules enforce them in the workflow`);
    s.addChart(pres.charts.BAR, [{ name: 'Controls', labels: ks, values: ks.map(k => co[k]?.n || 0) }, { name: 'Rated effective', labels: ks, values: ks.map(k => co[k]?.e || 0) }], { x: M, y: 1.95, w: 7.6, h: 4.55, barDir: 'col', barGrouping: 'clustered', chartColors: [C.orange, C.medium], showValue: true, dataLabelPosition: 'outEnd', ...axis, catAxisLabelFontSize: 10, showLegend: true, legendPos: 'b' });
    cap(s, 'Controls and effective controls per COSO component', M, 6.55, 7.6);
    screenshot(s, shotH('controls.png'), 8.6, 2.05, 4.1); }
  { const k = ['KPI-001', 'KPI-002', 'KPI-003', 'KPI-010', 'KPI-020', 'KPI-061'].filter(id => HA.kpis.some(v => v.kpi_id === id));
    const s = content('Governance · KPIs', `${D.kpiDefs.length} standard KPIs, measured monthly`, `Plus ${H_.orgRecords.CustomKpi.length} custom KPIs, e.g. “${L(H_.orgRecords.CustomKpi[0].name)}”.`);
    const last = id => HA.kpis.filter(v => v.kpi_id === id).slice(-1)[0]; const def = id => D.kpiDefs.find(d => d.id === id);
    table(s, ['KPI', 'Latest', 'Target', 'Status'], k.map(id => { const v = last(id); return [`${id} · ${L(def(id).name)}`, { text: String(v.value), align: 'center' }, { text: L(def(id).target), align: 'center' }, { text: v.status, fill: RAG[v.status] }]; }), M, 2.05, 7.2, [4.3, 0.95, 1.05, 0.9], { fontSize: 11.5, rowH: 0.5 });
    const t = HA.kpis.filter(v => v.kpi_id === 'KPI-001');
    s.addChart(pres.charts.LINE, [{ name: 'Value', labels: t.map(v => v.period), values: t.map(v => v.value) }, { name: 'Target', labels: t.map(v => v.period), values: t.map(v => v.target) }], { x: 8.0, y: 1.95, w: W - M - 8.0, h: 4.3, chartColors: [C.orange, C.medium], lineSize: 2, lineDataSymbol: 'circle', lineDataSymbolSize: 6, ...axis, catAxisLabelFontSize: 9, showLegend: true, legendPos: 'b' });
    cap(s, `${L(def('KPI-001').name)}: monthly value against target`, 8.0, 6.3, W - M - 8.0); }
  { const al = H_.alerts; const s = content('Governance · alerts', `${sum(al, a => a.n)} open alerts, each with an escalation chain`, 'Alerts come from process rules; overdue steps escalate by role and by delay.');
    table(s, ['Alert', 'Step', 'Severity', 'Open', 'Escalation'], al.map(a => { const t = D.alertTypes.find(x => x.id === a.type); return [`${a.type} · ${L(t?.name)}`, t?.step, { text: a.severity, fill: a.severity === 'High' ? S[0] : a.severity === 'Medium' ? S[1] : S[3] }, { text: String(a.n), align: 'center' }, L(t?.escalation)]; }), M, 2.05, W - 2 * M, [3.6, 1.0, 1.0, 0.7, 5.83], { fontSize: 11, rowH: 0.47 });
    const dsp = sum(H_.dispatch, d => d.n); cap(s, `Alerts, approvals and task notices are sent in the application and by e-mail (${dsp} dispatches in the demonstration run).`, M, 6.45, W - 2 * M); }
  { const au = H_.aiUsage; const o = cnt(au.flatMap(a => Array(a.n).fill(a.outcome)), x => x); const s = content('AI governance · usage log', `${sum(au, a => a.n)} AI suggestions logged: ${o.Accepted} accepted, ${o.Edited} edited, ${o.Rejected} rejected`, 'The usage log is append-only; each line keeps the use case, the user, the confidence and the decision.');
    s.addChart(pres.charts.DOUGHNUT, [{ name: 'Outcome', labels: ['Accepted', 'Edited', 'Rejected'], values: [o.Accepted, o.Edited, o.Rejected] }], { x: M, y: 1.95, w: 4.6, h: 4.4, holeSize: 58, chartColors: [C.orange, C.medium, C.line], showValue: true, showPercent: false, dataLabelColor: C.dark, dataLabelFontSize: 12, showLegend: true, legendPos: 'b', legendFontFace: BODY, legendFontSize: 12, legendColor: C.ink });
    cap(s, 'AI suggestions by outcome of the human review', M, 6.4, 4.6);
    screenshot(s, shotH('usage.png'), 5.7, 2.05, 7.0); }
  { const s = content('Planning', 'The whole run on one timeline', 'Phases, processes and tasks with dependencies; summary bars are computed from the tasks.');
    screenshot(s, shotH('gantt.png'), M + 1.3, 1.95, 9.5, 4.8); }
  { const s = content('Reports and questions', `${D.reports.length} standard reports and a data-aware assistant`, 'Reports export to PDF, Excel and Word. The assistant answers within the user’s permissions.');
    screenshot(s, shotH('reports.png'), M, 1.95, 6.0); screenshot(s, shotH('assistant.png'), 6.9, 1.95, 5.8); }
  { const rx = R.RexEntry[0]; const kb = H_.orgRecords.KbArticle; const s = content('Phase 6 · knowledge and improvement', 'Lessons learned feed the next cycle', `Return on experience rated ${rx.rating}/5 · ${kb.length} knowledge base articles for the sector standards`);
    const q = [['What went well', rx.what_went_well], ['What did not', rx.what_did_not], ['Root cause', rx.root_cause], ['Recommendation', rx.recommendation]];
    q.forEach(([a, b], i) => { const y = 2.05 + i * 1.12; card(s, M, y, 6.6, 0.98, i === 3 ? C.tint : C.white); txt(s, a, M + 0.25, y + 0.1, 1.9, 0.78, { fontSize: 13, bold: true, color: i === 3 ? C.deep : C.dark, valign: 'middle' }); txt(s, L(b), M + 2.2, y + 0.1, 4.2, 0.78, { fontSize: 13, color: C.ink, valign: 'middle' }); });
    const x = 7.6, w = W - M - x; txt(s, 'Knowledge base', x, 2.05, w, 0.35, { fontSize: 14, bold: true });
    kb.forEach((k, i) => { const y = 2.5 + i * 1.0; card(s, x, y, w, 0.88); txt(s, L(k.title), x + 0.25, y + 0.08, w - 0.5, 0.72, { fontSize: 12.5, valign: 'middle', fit: 'shrink' }); }); }

  // Section 4 — clinic
  divider('04', 'Case study: a clinic', `${L(CL.org.name)} — ${CL.org.employees} employees, ${CL.org.city}. The same method on a lighter track.`, true);
  { const cc = CA.records.ComplexityScore[0]; const s = content('SME · track', `Complexity score ${cc.score}: SME track T3`, `${L(CL.org.name)} · ${CL.org.employees} employees · ${CL.users} users · Law 09-08 data protection`);
    table(s, ['Track', 'For', 'Gates', 'Items per gate', 'Duration', 'Score'], D.smeTracks.map(t => [{ text: `${t.code} · ${L(t.name)}`, bold: t.code === cc.chosen_track, fill: t.code === cc.chosen_track ? C.tint : undefined }, L(t.segment), t.gates.join(' · '), { text: String(t.items), align: 'center' }, `about ${t.days} days`, `${t.min}–${Math.ceil(t.max)}`]), M, 2.1, W - 2 * M, [2.6, 1.3, 3.4, 1.4, 1.8, 1.63], { fontSize: 12.5, rowH: 0.55 });
    const lab = { impact: 'Impact', novelty: 'Novelty', regulatory: 'Regulatory', investment: 'Investment', scope: 'Scope', uncertainty: 'Uncertainty', ttm: 'Time to market' }; const k = Object.keys(cc.values);
    s.addChart(pres.charts.BAR, [{ name: 'Clinic', labels: k.map(x => lab[x]), values: k.map(x => cc.values[x]) }, { name: 'Hospital group', labels: k.map(x => lab[x]), values: k.map(x => cs.values[x]) }], { x: M, y: 4.4, w: W - 2 * M, h: 2.2, barDir: 'col', barGrouping: 'clustered', chartColors: [C.orange, C.medium], showValue: true, dataLabelPosition: 'outEnd', valAxisHidden: true, valAxisMaxVal: 6, valGridLine: { style: 'none' }, ...axis, showLegend: true, legendPos: 'r' });
    cap(s, 'Complexity ratings (1–5), clinic compared with the hospital group: investment and scope drive the difference', M, 6.65, W - 2 * M); }
  { const s = content('SME · workspace', 'Same lifecycle, fewer items to complete', `${L(CA.project.name)} · ${pct(CA.tasks)}% of ${CA.tasks.n} tasks completed`);
    screenshot(s, shot(LANG, LANG === 'fr' ? 'sme_ws.png' : 'sme_ws2.png'), M, 1.95, 7.9);
    await bullets(s, [`Digital run: ${pct(CD.tasks)}% of ${CD.tasks.n} tasks completed; AI run: ${pct(CA.tasks)}%.`, 'Six gates with five items each on track T3, instead of the Full-mode checklists.', 'The recommended track is kept; another choice needs a written justification.'], 9.0, 2.1, W - M - 9.0, 1.4, 14.5); }
  { const s = content('SME · any screen, any language', 'The same guidance in English, French and Arabic', 'The task panel on a desktop, the workspace in Arabic on a phone (right-to-left layout).');
    screenshot(s, shot(LANG, LANG === 'fr' ? 'sme_task.png' : 'sme_task2.png'), M, 1.95, 8.6, 4.8); const m = shot('en', 'm_ar.png'); screenshot(s, m, 10.0, 1.95, 2.35, 4.8); }
  { const s = content('Large vs SME', 'One method, sized to the organization', 'Comparison of the two healthcare providers in the demonstration instance.');
    const cc = CA.records.ComplexityScore[0];
    const row = (a, b, c) => [{ text: a, bold: true }, b, c];
    table(s, ['', L(H_.org.name), L(CL.org.name)], [row('Employees · city', `${num(H_.org.employees)} · ${H_.org.city}`, `${CL.org.employees} · ${CL.org.city}`), row('Complexity score · mode', `${cs.score} · Full mode`, `${cc.score} · SME track ${cc.chosen_track.replace('SME-', '')}`), row('Tasks per run', String(tH.n), String(CA.tasks.n)), row('AI run completed', `${pct(tH)}%`, `${pct(CA.tasks)}%`), row('Digital run completed', `${pct(tD)}%`, `${pct(CD.tasks)}%`), row('Users', String(H_.users), String(CL.users)), row('Solution', `${H_.config.pack_id} · ${H_.config.seats} seats`, `${CL.config.pack_id} · ${CL.config.seats} seats`), row('Data protection', JSON.parse(H_.config.compliance).join(', '), JSON.parse(CL.config.compliance).join(', '))], M, 2.05, W - 2 * M, [3.2, 4.47, 4.46], { fontSize: 13, rowH: 0.5 }); }

  // Section 5 — ecosystem
  divider('05', 'The health ecosystem', 'Life sciences, pharma distribution and pharmaceutical manufacturing', true);
  const others = D.others; const org = (s_, g) => others.find(o => o.sector === s_ && o.segment === g);
  for (const code of ['HLS', 'PHAR', 'PHPR']) {
    const v = V[code], lg = org(code, 'LARGE'), sm = org(code, 'SME');
    const s = content(`Sector · ${code}`, L(v.name), `Core function: ${L(v.coreFunction?.name)} · ${v.standards.join(', ')}`);
    screenshot(s, shot('sectors_' + LANG, code + '.png'), M, 2.05, 7.3);
    const x = 8.3, w = W - M - x;
    [['Large company', lg], ['SME', sm]].forEach(([k, o], i) => txt(s, [{ text: k + ' — ', options: { bold: true } }, { text: `${L(o.name)} (${o.employees})`, options: { color: C.ink } }], x, 1.98 + i * 0.3, w, 0.3, { fontSize: 12, fit: 'shrink' }));
    s.addChart(pres.charts.BAR, [{ name: 'Digital', labels: ['SME', 'Large'], values: [sm.runs.Digital.progress, lg.runs.Digital.progress] }, { name: 'AI', labels: ['SME', 'Large'], values: [sm.runs.AI.progress, lg.runs.AI.progress] }], { x: x - 0.1, y: 2.62, w: w + 0.1, h: 1.9, barDir: 'bar', barGrouping: 'clustered', chartColors: [C.medium, C.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0"%"', valAxisHidden: true, valAxisMaxVal: 115, valAxisMinVal: 0, valGridLine: { style: 'none' }, ...axis, showLegend: true, legendPos: 'b', legendFontSize: 10 });
    cap(s, 'Task completion by run (%)', x, 4.55, w);
    for (const [i, [head, items, ic]] of [['Priority AI themes', v.themes.ai, 'Sparkles'], ['Priority digital themes', v.themes.digital, 'MonitorSmartphone']].entries()) { const y = 4.95 + i * 0.95;
      await badge(s, ic, x, y, 0.34, i ? C.ink : C.orange); txt(s, head, x + 0.45, y + 0.02, w - 0.45, 0.3, { fontSize: 12, bold: true });
      txt(s, items.map((t, j) => ({ text: L(t), options: { bullet: { indent: 12 }, breakLine: j < items.length - 1 } })), x + 0.45, y + 0.3, w - 0.45, 0.62, { fontSize: 10, color: C.ink, fit: 'shrink' }); }
  }
  { const s = content('Health ecosystem · benchmark', 'Eight health organizations, two runs each', 'Share of tasks completed in the Digital and AI runs of each demonstration organization.');
    const rows = [{ name: L(H_.org.name), sector: 'HCPR', runs: { Digital: { progress: pct(tD) }, AI: { progress: pct(tH) } } }, { name: L(CL.org.name), sector: 'HCPR', runs: { Digital: { progress: pct(CD.tasks) }, AI: { progress: pct(CA.tasks) } } }, ...others.map(o => ({ ...o, name: L(o.name) }))];
    const lab = rows.map(r => `${r.name} (${r.sector})`);
    s.addChart(pres.charts.BAR, [{ name: 'Digital', labels: lab, values: rows.map(r => r.runs.Digital.progress) }, { name: 'AI', labels: lab, values: rows.map(r => r.runs.AI.progress) }], { x: M, y: 1.95, w: W - 2 * M, h: 4.55, barDir: 'bar', barGrouping: 'clustered', chartColors: [C.medium, C.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0"%"', dataLabelFontSize: 9, valAxisMaxVal: 100, valAxisMinVal: 0, ...axis, catAxisLabelFontSize: 10.5, catAxisOrientation: 'maxMin', showLegend: true, legendPos: 'r' });
    cap(s, 'Tasks completed in each run (%). Group members see these aggregates; records of sister organizations stay read-only.', M, 6.55, W - 2 * M); }

  // Section 6 — trust and next steps
  divider('06', 'Trust and next steps', 'Security, data protection, deployment and how to start');
  demo = false;
  { const s = content('Security and data protection', 'Patient-adjacent data, handled with strict boundaries', 'Staff data and training records stay inside the organization’s tenant.');
    const it = [['Building', 'Tenant isolation', 'Each organization is a closed tenant; group members read sister organizations but cannot change them.'], ['KeyRound', 'Role-based access', `Permissions checked on the server for each of the ${D.roles.length} roles; pack entitlements enforced.`], ['History', 'Audit trail', 'Every change to a governed field is justified and recorded in an append-only log.'], ['Scale', 'Data-protection frameworks', D.compliance.map(c => L(c.name)).join(', ') + '.'], ['Bot', 'Governed AI', 'Each AI use case names its human checkpoint; the usage log keeps every outcome.'], ['FileLock', 'Consent', 'Consent recorded for every stored questionnaire response before gate G1.']];
    for (const [i, [ic, a, b]] of it.entries()) { const x = M + (i % 3) * 4.1, y = 2.05 + Math.floor(i / 3) * 2.3; card(s, x, y, 3.85, 2.1);
      await badge(s, ic, x + 0.28, y + 0.28, 0.6, i === 0 ? C.orange : C.ink); txt(s, a, x + 1.05, y + 0.3, 2.6, 0.55, { fontFace: TITLE, fontSize: 16, bold: true, valign: 'middle' }); txt(s, b, x + 0.28, y + 1.0, 3.3, 1.05, { fontSize: 12.5, color: C.ink, fit: 'shrink' }); } }
  { const s = content('Integrations', `${D.integrations.length} integrations in the catalog`, 'Three connections at the hospital group, each health-checked; the single sign-on check currently reports a failure.');
    const fam = cnt(D.integrations, x => L(x.family));
    table(s, ['Family', 'Integrations'], Object.entries(fam).map(([k, v]) => [k, { text: String(v), align: 'center' }]), M, 2.05, 5.2, [3.8, 1.4], { fontSize: 12.5, rowH: 0.45 });
    const ex = H_.orgRecords.ExternalIntegration;
    table(s, ['Connected at the hospital group', 'Code', 'Last health check'], ex.map(e => [L(e.label), e.integration_code, { text: e.last_health_status, fill: e.last_health_status === 'Success' ? S[3] : S[1] }]), 6.2, 2.05, W - M - 6.2, [3.0, 1.6, 1.93], { fontSize: 12.5, rowH: 0.5 });
    const hr = D.integrations.find(i => i.id === 'INT-HR-01'); txt(s, [{ text: 'HRIS / HCM examples: ', options: { bold: true } }, { text: L(hr.examples), options: { color: C.ink } }], 6.2, 4.35, W - M - 6.2, 0.9, { fontSize: 12.5 }); }
  { const s = content('Deployment', 'SaaS or on-premises, same application', 'One licensing interface with two implementations, chosen when the server starts.');
    const col = [['Cloud', 'SaaS', ['Hosted and updated centrally.', 'Licence checked online per organization.', 'Suited to clinics and groups without a local IT team.']], ['Server', 'On-premises', ['Installed in the hospital’s data centre.', 'Signed licence file bound to the server, with expiry date and seat limit.', 'Suited to strict data-residency policies.']]];
    for (const [i, [ic, a, pts]] of col.entries()) { const x = M + i * 6.13; card(s, x, 2.05, 5.95, 3.4, i ? C.white : C.tint); await badge(s, ic, x + 0.3, 2.3, 0.7, i ? C.ink : C.orange);
      txt(s, a, x + 1.2, 2.38, 4, 0.55, { fontFace: TITLE, fontSize: 22, bold: true, valign: 'middle' });
      txt(s, pts.map((t, j) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: j < pts.length - 1 } })), x + 0.35, 3.25, 5.3, 2.0, { fontSize: 14, color: C.ink, paraSpaceAfter: 6 }); }
    const lic = JSON.parse(H_.licence.data); card(s, M, 5.7, W - 2 * M, 0.85, C.light);
    txt(s, `Demonstration licence of the hospital group: plan ${lic.plan}, up to ${lic.maxUsers} users, features ${lic.features.join(', ')}, valid until ${date(lic.expiryDate)}.`, M + 0.3, 5.75, W - 2 * M - 0.6, 0.75, { fontSize: 13, valign: 'middle' }); }
  { const s = content('Packs for healthcare', 'Recommended packs for a hospital or clinic', 'Catalog prices per month, in USD; each pack includes a number of users, with a per-user price beyond.');
    const pk = ['PK-01', 'PK-04', 'PK-03', 'PK-02'].map(id => D.packs.find(p => p.id === id)); const why = { 'PK-01': 'Scope, evidence, diagnosis, the Training Engineering Report and the roadmap.', 'PK-04': 'Certificate tracking and readiness evidence for ISO 7101, JCI and ISO 15189.', 'PK-03': 'Kirkpatrick evaluation, KPIs and return on investment.', 'PK-02': 'Paths, modules, sessions and learner engagement.' };
    for (const [i, p] of pk.entries()) { const x = M + i * 3.07; card(s, x, 2.05, 2.85, 4.4, i < 2 ? C.tint : C.white);
      txt(s, p.id, x + 0.25, 2.25, 2.3, 0.3, { fontSize: 12, bold: true, color: C.deep, charSpacing: 2 }); txt(s, L(p.name), x + 0.25, 2.6, 2.4, 0.9, { fontFace: TITLE, fontSize: 16, bold: true });
      txt(s, '$' + p.price, x + 0.25, 3.55, 2.4, 0.6, { fontFace: TITLE, fontSize: 28, bold: true, color: C.deep }); txt(s, `per month · ${p.includedUsers} users included · $${p.overage} per extra user`, x + 0.25, 4.15, 2.4, 0.6, { fontSize: 11, color: C.ink });
      txt(s, why[p.id], x + 0.25, 4.85, 2.4, 1.4, { fontSize: 12.5 }); } }
  { const s = content('Add-ons and bundles', 'Add-ons that fit hospital groups', 'Catalog prices per month, in USD.');
    const ad = ['AD-08', 'AD-09', 'AD-11', 'AD-01', 'AD-07'].map(id => D.addOns.find(a => a.id === id));
    table(s, ['Add-on', 'Price', 'What it adds'], ad.map(a => [{ text: `${a.id} · ${L(a.name)}`, bold: true }, { text: '$' + a.price, align: 'center' }, L(a.goals).split(/;\s|(?<!ex)\.\s(?=[A-ZÀ-Ý])/)[0].replace(/\s*\.$/, '') + '.']), M, 2.05, 7.9, [2.7, 0.8, 4.4], { fontSize: 11, rowH: 0.72 });
    table(s, ['Bundle', 'Packs', 'Price'], D.bundles.map(b => [L(b.name), b.packsText, { text: `$${b.price} (−${b.discount}%)`, align: 'right' }]), 8.8, 2.05, W - M - 8.8, [1.25, 1.35, 1.33], { fontSize: 10.5, rowH: 0.55 }); }
  { const s = content('Implementation', 'A first run in four steps', 'Sized by the complexity score: about 30, 60 or 90 days on an SME track; a full run for a hospital group.');
    const st = [['Settings', 'Set up', 'Group, organization, functions, users and roles; connect the HR system.'], ['ClipboardList', 'Scope and evidence', 'Approve the Scope of Work, send questionnaires, pass gate G1.'], ['Search', 'Diagnose and plan', 'Five-axis diagnostic, gaps, prioritized themes, report, budget; gates G2 and G3.'], ['GraduationCap', 'Deliver and evaluate', 'Sessions, Kirkpatrick evaluation, certificates, return on experience; gates G4 to G6.']];
    for (const [i, [ic, a, b]] of st.entries()) { const x = M + i * 3.07; card(s, x, 2.3, 2.85, 3.6, i === 0 ? C.tint : C.white); await badge(s, ic, x + 0.3, 2.55, 0.7, i === 0 ? C.orange : C.ink);
      txt(s, String(i + 1).padStart(2, '0'), x + 1.95, 2.6, 0.7, 0.5, { fontFace: TITLE, fontSize: 22, bold: true, color: C.deep, align: 'right' });
      txt(s, a, x + 0.3, 3.5, 2.3, 0.5, { fontFace: TITLE, fontSize: 17, bold: true }); txt(s, b, x + 0.3, 4.05, 2.3, 1.7, { fontSize: 13, color: C.ink }); }
    s.addShape(pres.shapes.LINE, { x: M, y: 6.25, w: W - 2 * M, h: 0, line: { color: C.line, width: 1 } });
    txt(s, 'POWERACT supports each step: set-up, method coaching and the first gate reviews.', M, 6.35, W - 2 * M, 0.4, { fontSize: 13, color: C.ink }); }
  { section = 'Next steps'; const s = content('Next steps', 'Start with one hospital, one run');
    const ic = ['CalendarCheck', 'MonitorPlay', 'Rocket']; const l = ['Book a working session with POWERACT: your accreditation calendar, sites and priority roles.', 'See the demonstration: sign in to the healthcare tenant and follow a task from scope to certificate.', 'Run a pilot: one site or one clinic, Digital or AI focus, measured with the same KPIs.'];
    for (const [i, t] of l.entries()) { const y = 2.2 + i * 1.3; card(s, M, y, 7.6, 1.05); await badge(s, ic[i], M + 0.25, y + 0.2, 0.65, i === 0 ? C.orange : C.ink); txt(s, t, M + 1.15, y + 0.1, 6.2, 0.85, { fontSize: 15, valign: 'middle' }); }
    card(s, 8.7, 2.2, 4.0, 3.65, C.tint); txt(s, 'POWERACT Consulting', 9.0, 2.5, 3.5, 0.4, { fontFace: TITLE, fontSize: 18, bold: true }); txt(s, 'www.poweract.ma', 9.0, 2.95, 3.5, 0.35, { fontSize: 14, color: C.ink });
    txt(s, 'Figures in this presentation come from the demonstration instance. Organizations and people are fictional.', 9.0, 3.6, 3.4, 1.8, { fontSize: 12.5, color: C.ink, italic: true }); }

  fs.mkdirSync(out, { recursive: true });
  const f = path.join(out, `CortexSkills_Healthcare_Presentation_${LANG.toUpperCase()}.pptx`); await pres.writeFile({ fileName: f }); console.log('written', f, pageNo, 'slides');
  if (LANG === 'fr') { fs.writeFileSync(path.join(__dirname, 'health-deck-fr.seen.json'), JSON.stringify([...SEEN], null, 1)); if (MISSING.size) console.log('untranslated:', MISSING.size, '(see health-deck-fr.seen.json)'); }
})();
