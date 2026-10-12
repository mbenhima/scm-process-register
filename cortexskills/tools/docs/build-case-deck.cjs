// Healthcare full case presentation (regional hospital, or private clinic group with CASE=clinic): the AI skills run,
// 100 % complete) and the documents it produced — Training Engineering Report, Training Plan, audit, ROI and the
// 37 published documents. Styled with the AI Value Graphical Chart v1.2 (§13.3 PowerPoint, §9 charts, §8.17 tables).
// Every figure comes from case-data.json (extract-case.mjs) and case-pages.json (page counts of the exported PDFs).
// Run: node build-case-deck.cjs en|fr [outDir]
const path = require('path'); const fs = require('fs');
const PptxGenJS = require('pptxgenjs'); const sharp = require('sharp'); const lucide = require('lucide-static');
const LANG = process.argv[2] === 'fr' ? 'fr' : 'en';
const out = process.argv[3] || path.join(__dirname, '../../deliverables');
const t = (en, fr) => (LANG === 'fr' ? fr : en);
// CASE=clinic builds the private clinic group scenario (case-clinic.json); default: the regional hospital (case-data.json).
const CLINIC = process.env.CASE === 'clinic';
const K = CLINIC ? { the: ['the clinic group', 'le groupe de cliniques'], The: ['The clinic group', 'Le groupe de cliniques'], of: ['of the clinic group', 'du groupe de cliniques'], sub: ['at a private clinic group', 'dans un groupe de cliniques privées'], file: 'PrivateClinics_Case' }
  : { the: ['the hospital', 'l’hôpital'], The: ['The hospital', 'L’hôpital'], of: ['of the hospital', 'de l’hôpital'], sub: ['at a regional hospital', 'dans un centre hospitalier régional'], file: 'Hospital_Case' };
const D = JSON.parse(fs.readFileSync(path.join(__dirname, CLINIC ? 'case-clinic.json' : 'case-data.json'), 'utf8'));
const PAGES = fs.existsSync(path.join(__dirname, CLINIC ? 'case-pages-clinic.json' : 'case-pages.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, CLINIC ? 'case-pages-clinic.json' : 'case-pages.json'), 'utf8'))[LANG] || {} : {};
const L = x => (x && typeof x === 'object' && !Array.isArray(x) ? x[LANG] ?? x.en ?? '' : x ?? '');
const DOCS = D.documents[LANG]; const TER = DOCS['DT-TER'].sections; const PLAN = DOCS['DT-PLAN'].sections;
const secN = (list, prefix, n = 0) => list.filter(s => (s.heading || '').startsWith(prefix))[n];
const sec = (list, ...prefixes) => list.find(s => prefixes.some(p => (s.heading || '').startsWith(p)));
const rowsOf = (list, ...p) => sec(list, ...p)?.table?.rows || [];
const textOf = (list, ...p) => sec(list, ...p)?.table?.intro || sec(list, ...p)?.text || '';
const N = s => Number(String(s).replace(/[^\d.,-]/g, '').replace(/,/g, '').replace(/\s/g, '')) || 0;
const num = n => Math.round(n).toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-US').replace(/ /g, ' ');
// AI Value core palette (§3.1, §17) and status scale (§3.4).
const C = { navy: '123A5F', navyDark: '0D2A47', azure: '1876C6', green: '28C87C', teal: '17A2B8', ink: '2C3E50', muted: '5A6B7B', white: 'FFFFFF', bg: 'F5F8FB', line: 'E1E8F0', azureTint: 'E8F1FB', greenTint: 'E7F9F0', tealTint: 'E6F6F8' };
const ST = ['F4C7C3', 'FBE0B5', 'FFF3B0', 'D9EAD3', 'B6D7A8'];
const TITLE = 'Montserrat', BODY = 'Open Sans';
const W = 13.333, H = 7.5, M = 0.6;
const SHOTS = path.join(__dirname, CLINIC ? 'shots/case-clinic' : 'shots/case', LANG);
const BRAND = path.join(__dirname, 'brand');
const org = L(D.org.name), proj = D.project;

const pres = new PptxGenJS(); pres.layout = 'LAYOUT_WIDE'; pres.author = 'AI Value'; pres.company = 'AI Value'; pres.lang = LANG === 'fr' ? 'fr-FR' : 'en-GB';
pres.title = t('Healthcare full case — Training engineering project', 'Cas complet santé — Projet d’ingénierie de formation');
let pageNo = 0, section = ''; const OUTLINE = [];
const icons = {};
async function icon(name, color = C.white) {
  const k = name + color; if (icons[k]) return icons[k];
  const svg = lucide[name].replace(/stroke="currentColor"/, `stroke="#${color}"`).replace(/stroke-width="2"/, 'stroke-width="2"').replace(/width="24"/, 'width="256"').replace(/height="24"/, 'height="256"');
  return (icons[k] = 'image/png;base64,' + (await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer()).toString('base64'));
}
/** Icon badge (§7.2): solid circle, Azure or Green for emphasis, Navy or Muted for neutral, white line icon at 52 %. */
async function badge(s, name, x, y, d, fill = C.azure) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  const i = d * 0.52; s.addImage({ data: await icon(name), x: x + (d - i) / 2, y: y + (d - i) / 2, w: i, h: i, altText: name });
}
/** Card (§8.5): white, 12 px radius, 1 px Line border — border or shadow, never both. */
const card = (s, x, y, w, h, fill = C.white) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 0.75 }, rectRadius: 0.1 });
const txt = (s, tx, x, y, w, h, o = {}) => s.addText(tx, { x, y, w, h, fontFace: BODY, fontSize: 14, color: C.ink, margin: 0, isTextBox: true, valign: 'top', ...o });
const cap = (s, tx, x, y, w) => txt(s, tx, x, y, w, 0.3, { fontSize: 10, italic: true, color: C.muted });
const logo = (s, file, x, y, w) => { const f = path.join(BRAND, file); const b = fs.readFileSync(f); const h = w * b.readUInt32BE(20) / b.readUInt32BE(16); s.addImage({ path: f, x, y, w, h, altText: 'AI Value' }); return h; };
function content(eyebrow, title, subtitle) {
  const s = pres.addSlide(); pageNo++; s.background = { color: C.white }; OUTLINE.push({ no: pageNo, section, title });
  txt(s, eyebrow.toUpperCase(), M, 0.38, 11, 0.32, { fontSize: 14, bold: true, color: C.azure, charSpacing: 2 });
  txt(s, title, M, 0.72, W - 2 * M, 0.72, { fontFace: TITLE, fontSize: String(title).length > 62 ? 19 : String(title).length > 52 ? 21 : String(title).length > 44 ? 23 : 26, bold: true, color: C.navy, fit: 'shrink', valign: 'middle' });
  if (subtitle) txt(s, subtitle, M, 1.44, W - 2 * M, 0.42, { fontSize: 14, color: C.ink, fit: 'shrink' });
  s.addShape(pres.shapes.LINE, { x: M, y: H - 0.62, w: W - 2 * M, h: 0, line: { color: C.line, width: 0.75 } });
  logo(s, 'aivalue-lockup-slide.png', M, H - 0.5, 1.6);
  txt(s, section + '  ·  ' + t('Demonstration data — fictional organization', 'Données de démonstration — organisation fictive'), 2.6, H - 0.46, 8.1, 0.3, { fontSize: 10, color: C.muted, align: 'center' });
  txt(s, String(pageNo), W - M - 1, H - 0.46, 1, 0.3, { fontSize: 10, color: C.muted, align: 'right' });
  return s;
}
/** Section divider: the one approved dark surface (Navy), with the white logo (§2.4, §12). */
function divider(no, title, sub) {
  const s = pres.addSlide(); pageNo++; section = title; s.background = { color: C.navy }; OUTLINE.push({ no: pageNo, section: title, title: `${no}. ${title}`, divider: true });
  s.addShape(pres.shapes.OVAL, { x: 9.4, y: -1.5, w: 6.2, h: 6.2, fill: { color: C.azure, transparency: 80 }, line: { color: C.azure, transparency: 100 } });
  s.addShape(pres.shapes.OVAL, { x: 10.8, y: 4.1, w: 3.4, h: 3.4, fill: { color: C.teal, transparency: 78 }, line: { color: C.teal, transparency: 100 } });
  txt(s, no, M, 2.0, 3, 1.2, { fontFace: TITLE, fontSize: 72, bold: true, color: C.green });
  txt(s, title, M, 3.3, 9, 0.9, { fontFace: TITLE, fontSize: 38, bold: true, color: C.white, fit: 'shrink' });
  txt(s, sub, M, 4.25, 9, 0.9, { fontSize: 18, color: C.white });
  logo(s, 'aivalue-lockup-white-slide.png', M, H - 0.85, 2.2);
}
function screenshot(s, name, x, y, w, maxH = 5) {
  const file = path.join(SHOTS, name + '.png');
  if (!fs.existsSync(file)) { console.warn('missing', file); return 0; }
  const buf = fs.readFileSync(file); const r = buf.readUInt32BE(20) / buf.readUInt32BE(16); let h = w * r; if (h > maxH) { h = maxH; w = h / r; }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.05, y: y - 0.05, w: w + 0.1, h: h + 0.1, fill: { color: C.white }, line: { color: C.line, width: 0.75 }, rectRadius: 0.06 });
  s.addImage({ path: file, x, y, w, h, altText: t('Screenshot of the application', 'Capture d’écran de l’application') }); return h;
}
/** Table (§8.17): Navy header, bold white text, alternating White / Background rows, 1 px Line borders. */
function table(s, head, rows, x, y, w, colW, o = {}) {
  const f = o.fontSize || 11;
  const data = [head.map(h => ({ text: String(h), options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: f } })),
    ...rows.map((r, i) => r.map(c => { const cell = c !== null && typeof c === 'object' && 'text' in c ? c : { text: L(c) }; return { text: String(cell.text ?? ''), options: { color: C.ink, fill: { color: cell.fill || (i % 2 ? C.bg : C.white) }, fontSize: f, bold: !!cell.bold, align: cell.align } }; }))];
  s.addTable(data, { x, y, w, colW, fontFace: BODY, border: { type: 'solid', pt: 0.75, color: C.line }, margin: 0.06, rowH: o.rowH || 0.3, valign: 'middle', autoPage: false });
}
/** KPI tile (§9.4): label uppercase Muted, value Montserrat Bold Navy. */
async function kpi(s, x, y, w, value, label, ic, fill = C.azure) {
  card(s, x, y, w, 1.35); await badge(s, ic, x + 0.22, y + 0.24, 0.5, fill);
  txt(s, value, x + 0.85, y + 0.16, w - 1, 0.6, { fontFace: TITLE, fontSize: 25, bold: true, color: C.navy, valign: 'middle', fit: 'shrink' });
  txt(s, label, x + 0.22, y + 0.84, w - 0.4, 0.46, { fontSize: 11, color: C.muted });
}
async function bullets(s, items, x, y, w, gap = 0.8, f = 14) {
  for (const [k, line] of items.entries()) { const yy = y + k * gap; await badge(s, ['Check', 'ArrowRight', 'ShieldCheck', 'CircleDot', 'Target', 'Info'][k % 6], x, yy, 0.42, k === 0 ? C.azure : C.navy);
    txt(s, line, x + 0.6, yy - 0.03, w - 0.6, gap - 0.08, { fontSize: f }); }
}
// Charts (§9): Azure primary, Muted comparison, Line gridlines, Muted axis text, legend below, no 3D, no gradients.
const axis = { catAxisLabelColor: C.muted, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 10, valAxisLabelColor: C.muted, valAxisLabelFontFace: BODY, valAxisLabelFontSize: 10, valGridLine: { color: C.line, size: 0.75 }, catGridLine: { style: 'none' }, valAxisLineShow: false, catAxisLineColor: C.line, legendFontFace: BODY, legendFontSize: 10, legendColor: C.muted, legendPos: 'b', dataLabelColor: C.navy, dataLabelFontSize: 10, dataLabelFontBold: true };
const short = (s, n = 60) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const rag = v => /Green|Vert/i.test(v) ? ST[3] : /Amber|Ambre|Orange/i.test(v) ? ST[1] : /Red|Rouge/i.test(v) ? ST[0] : C.white;

(async () => {
  const byPop = rowsOf(TER, '1.11 '); const byFn = rowsOf(TER, '1.12 '); const byCh = rowsOf(TER, '1.13 '); const sample = rowsOf(TER, '1.6 ');
  const invited = byPop.reduce((a, r) => a + N(r[1]), 0), responded = byPop.reduce((a, r) => a + N(r[2]), 0);
  const prio = rowsOf(TER, '5. '); const trainings = rowsOf(TER, '5.1 '); const budget = rowsOf(TER, '5.7 '); const total = budget.find(r => /Total/.test(r[0])) || [];
  const evals = rowsOf(TER, '5.9 '); const certs = rowsOf(TER, '5.10 ');
  const docCodes = Object.keys(DOCS); const totalPages = docCodes.reduce((a, c) => a + (PAGES[c] || 0), 0);
  const tasks = (D.workspace.phases || []).flatMap(p => p.items || []);
  const stake = rowsOf(TER, '1.7 ');
  const AUD = DOCS['DT-AUDIT']?.sections || []; const ROI = DOCS['DT-E2E-08']?.sections || [];
  const roiKpi = (ROI.find(s => s.table?.rows?.[0]?.[0]?.startsWith?.('KPI-'))?.table?.rows) || [];

  // 1 — Title (§13.3: Navy background, white Montserrat H1, Green tagline)
  { const s = pres.addSlide(); pageNo++; s.background = { color: C.navy };
    s.addShape(pres.shapes.OVAL, { x: 8.9, y: -2.2, w: 7.5, h: 7.5, fill: { color: C.azure, transparency: 82 }, line: { color: C.azure, transparency: 100 } });
    logo(s, 'aivalue-lockup-white-slide.png', M, 0.55, 3.0);
    txt(s, t('FULL CASE · HEALTHCARE · 2026', 'CAS COMPLET · SANTÉ · 2026'), M, 2.0, 7, 0.4, { fontSize: 14, bold: true, color: C.green, charSpacing: 3 });
    txt(s, t('AI skills training engineering ' + K.sub[0], 'Ingénierie de formation aux compétences IA ' + K.sub[1]), M, 2.45, 6.3, 1.9, { fontFace: TITLE, fontSize: 36, bold: true, color: C.white, fit: 'shrink' });
    txt(s, t(`${org}: the project, the Training Engineering Report, the Training Plan and every document produced with CortexSkills`, `${org} : le projet, le Rapport d’ingénierie de formation, le Plan de formation et chaque document produit avec CortexSkills`), M, 4.45, 6.0, 1.2, { fontSize: 17, color: C.white });
    txt(s, 'MEASURABLE · GOVERNED · SUSTAINABLE', M, 6.65, 7, 0.35, { fontSize: 13, bold: true, color: C.green, charSpacing: 3 });
    const f = path.join(SHOTS, 'project_workspace.png'); if (fs.existsSync(f)) { const b = fs.readFileSync(f); const w = 5.6, h = w * b.readUInt32BE(20) / b.readUInt32BE(16); s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.15, y: 1.85, w: w + 0.1, h: h + 0.1, fill: { color: C.white }, line: { color: C.white }, rectRadius: 0.06 }); s.addImage({ path: f, x: 7.2, y: 1.9, w, h, altText: 'CortexSkills' }); } }

  // 2 — Agenda
  { section = t('Agenda', 'Sommaire'); const s = content(t('Agenda', 'Sommaire'), t('How the case is presented', 'Déroulé de la présentation'));
    const ag = [['01', t(K.The[0] + ' and the project', K.The[1] + ' et le projet'), t('Context, charter, scope, method, schedule', 'Contexte, charte, périmètre, méthode, calendrier'), 'Hospital'],
      ['02', t('Diagnosis', 'Diagnostic'), t('Questionnaires, maturity, gaps, needs', 'Questionnaires, maturité, écarts, besoins'), 'Stethoscope'],
      ['03', t('Training Engineering Report', 'Rapport d’ingénierie de formation'), t('Structure, findings, roadmap, risks', 'Structure, constats, feuille de route, risques'), 'FileText'],
      ['04', t('Training Plan', 'Plan de formation'), t('Programs, agendas, design, budget', 'Programmes, déroulés, conception, budget'), 'GraduationCap'],
      ['05', t('Delivery, evaluation and audit', 'Déploiement, évaluation et audit'), t('Sessions, Kirkpatrick, ROI, audit', 'Sessions, Kirkpatrick, ROI, audit'), 'ChartColumn'],
      ['06', t('Documents produced', 'Documents produits'), t(`${docCodes.length} published documents, traced`, `${docCodes.length} documents publiés, tracés`), 'FileStack']];
    for (let i = 0; i < 6; i++) { const x = M + (i % 3) * 4.1, y = 2.0 + Math.floor(i / 3) * 2.35; card(s, x, y, 3.85, 2.1);
      await badge(s, ag[i][3], x + 0.3, y + 0.3, 0.7, i === 0 ? C.azure : C.navy);
      txt(s, ag[i][0], x + 2.9, y + 0.35, 0.7, 0.5, { fontFace: TITLE, fontSize: 22, bold: true, color: C.navy, align: 'right' });
      txt(s, ag[i][1], x + 0.3, y + 1.1, 3.3, 0.45, { fontFace: TITLE, fontSize: 16, bold: true, color: C.navy, fit: 'shrink' });
      txt(s, ag[i][2], x + 0.3, y + 1.52, 3.3, 0.5, { fontSize: 12.5, color: C.ink }); } }

  // 3 — Executive summary
  { section = t('Executive summary', 'Synthèse'); const s = content(t('Executive summary', 'Synthèse'), t('A complete AI skills cycle, documented end to end', 'Un cycle complet de compétences IA, documenté de bout en bout'), `${org} · ${num(D.org.employees)} ${t('employees', 'collaborateurs')} · ${L(proj.name)}`);
    await kpi(s, M, 2.0, 2.9, `${Math.round(proj.progress)} %`, t(`of the run completed — ${tasks.length} end-to-end processes`, `du déroulé réalisé — ${tasks.length} processus de bout en bout`), 'CircleCheck', C.green);
    await kpi(s, M + 3.07, 2.0, 2.9, `${responded} / ${invited}`, t(`people answered the questionnaires (${Math.round(responded / invited * 100)} %)`, `personnes ont répondu aux questionnaires (${Math.round(responded / invited * 100)} %)`), 'ClipboardList', C.navy);
    await kpi(s, M + 6.14, 2.0, 2.9, `${prio.length}`, t(`trainings in ${rowsOf(PLAN, 'Programs', 'Programmes').length} programs, prioritized by impact`, `formations dans ${rowsOf(PLAN, 'Programs', 'Programmes').length} programmes, priorisées par impact`), 'GraduationCap', C.navy);
    await kpi(s, M + 9.21, 2.0, 2.9, total[1] || '—', t(`training budget; ${total[4] || '—'} spent`, `budget de formation ; ${total[4] || '—'} consommés`), 'Wallet', C.navy);
    card(s, M, 3.6, W - 2 * M, 3.05);
    txt(s, t('What the case shows', 'Ce que montre le cas'), M + 0.35, 3.78, 6, 0.4, { fontFace: TITLE, fontSize: 17, bold: true, color: C.navy });
    const mat = rowsOf(TER, '1.9 '); const weakest = [...mat].sort((a, b) => N(a[1]) - N(b[1]))[0] || [];
    const gaps = rowsOf(TER, '3.40'); const worstGap = [...gaps].sort((a, b) => N(b[3]) - N(a[3]))[0] || [];
    const roi = roiKpi.find(r => r[0] === 'KPI-037');
    await bullets(s, [
      t(`Diagnosis: “${weakest[0]}” is the weakest axis (${weakest[1]} / 5); the largest skill gap is “${worstGap[0]}” (average gap ${worstGap[3]}).`, `Diagnostic : « ${weakest[0]} » est l’axe le plus faible (${weakest[1]} / 5) ; le plus grand écart est « ${worstGap[0]} » (écart moyen ${worstGap[3]}).`),
      t(`${rowsOf(TER, '3.41').length} training needs were validated and grouped into ${prio.length} themes, deployed in ${rowsOf(TER, '4.1 ').length} roadmap initiatives over three waves.`, `${rowsOf(TER, '3.41').length} besoins de formation ont été validés et regroupés en ${prio.length} thèmes, déployés en ${rowsOf(TER, '4.1 ').length} initiatives sur trois vagues.`),
      t(`Kirkpatrick results ${evals.map(e => e[2]).join(' · ')}${roi ? `; training ROI ${roi[4].split(' ')[0]} % (target ${roi[3]})` : ''}.`, `Résultats Kirkpatrick ${evals.map(e => e[2]).join(' · ')}${roi ? ` ; ROI de la formation ${roi[4].split(' ')[0]} % (cible ${roi[3]})` : ''}.`),
      t(`${docCodes.length} documents published${totalPages ? `, ${num(totalPages)} pages` : ''}; the Training Engineering Report alone has ${PAGES['DT-TER'] || '—'} pages.`, `${docCodes.length} documents publiés${totalPages ? `, ${num(totalPages)} pages` : ''} ; le Rapport d’ingénierie de formation compte à lui seul ${PAGES['DT-TER'] || '—'} pages.`)], M + 0.35, 4.3, W - 2 * M - 0.7, 0.58, 13.5); }

  // ---------------------------------------------------------------- 01 The hospital and the project
  divider('01', t(K.The[0] + ' and the project', K.The[1] + ' et le projet'), t('Context, charter, scope, method and schedule', 'Contexte, charte, périmètre, méthode et calendrier'));
  { const s = content(t('Context', 'Contexte'), org, textOf(TER, '1. '));
    const vis = rowsOf(TER, '1.1 ');
    table(s, [t('Topic', 'Sujet'), t('Content', 'Contenu')], vis.slice(0, 7).map(r => [{ text: r[0], bold: true }, short(r[1], 170)]), M, 2.0, 7.4, [2.0, 5.4], { fontSize: 10.5, rowH: 0.55 });
    const org2 = rowsOf(TER, '1.2 ');
    card(s, 8.3, 2.0, 4.43, 4.6); txt(s, t('Organization and headcount', 'Organigramme et effectif'), 8.55, 2.15, 4, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy });
    table(s, [t('Function', 'Fonction'), t('People', 'Effectif')], org2.slice(0, 8).map(r => [r[0], r[r.length - 1]]), 8.55, 2.65, 3.95, [2.85, 1.1], { fontSize: 10.5 }); }
  { const s = content(t(CLINIC ? 'Group profile' : 'Hospital profile', 'Profil ' + K.of[1]), t('Key dates and SWOT ' + K.of[0], 'Dates clés et SWOT ' + K.of[1]));
    const dates = rowsOf(TER, '1.3 '); const swot = rowsOf(TER, '1.4 ')[0] || [];
    dates.forEach((d, i) => { const x = M + i * 3.07; card(s, x, 2.0, 2.9, 1.3); txt(s, d[0], x + 0.25, 2.12, 2.4, 0.5, { fontFace: TITLE, fontSize: 22, bold: true, color: C.navy }); txt(s, d[1], x + 0.25, 2.65, 2.5, 0.6, { fontSize: 12 }); });
    const q = [[t('Strengths', 'Forces'), swot[0], ST[4]], [t('Areas for improvement', 'Axes d’amélioration'), swot[1], ST[0]], [t('Opportunities', 'Opportunités'), swot[2], ST[3]], [t('Threats', 'Menaces'), swot[3], ST[1]]];
    q.forEach((c, i) => { const x = M + i * 3.07; card(s, x, 3.55, 2.9, 3.1, c[2]); txt(s, c[0], x + 0.22, 3.68, 2.5, 0.4, { fontFace: TITLE, fontSize: 14, bold: true, color: C.navy });
      txt(s, [...new Set(String(c[1] || '—').split(/\n|; /))].slice(0, 5).map(x => '• ' + x).join('\n'), x + 0.22, 4.12, 2.5, 2.45, { fontSize: 11.5, fit: 'shrink' }); });
    cap(s, t('Source: TER sections 1.3 and 1.4.', 'Source : RIF sections 1.3 et 1.4.'), M, 6.7, 6); }
  { const s = content(t('Project charter', 'Charte du projet'), L(proj.name), L(proj.description));
    const so = D.records.StrategicObjective || []; const sow = (D.records.ScopeOfWork || [])[0] || {};
    await kpi(s, M, 2.1, 2.9, String(proj.complexity ?? '—'), t('complexity score (out of 100): full run with gates', 'score de complexité (sur 100) : déroulé complet avec jalons'), 'Gauge');
    await kpi(s, M + 3.07, 2.1, 2.9, String((D.records.Stakeholder || []).length), t('stakeholders registered and consulted', 'parties prenantes enregistrées et consultées'), 'Users', C.navy);
    await kpi(s, M + 6.14, 2.1, 2.9, String((D.records.ScopeCriterion || []).length), t('scope criteria approved in the Scope of Work', 'critères de périmètre approuvés'), 'Crosshair', C.navy);
    await kpi(s, M + 9.21, 2.1, 2.9, (sow.decision_levels || []).join(' · ') || '—', t('decision levels covered (strategic, middle, operational)', 'niveaux de décision couverts (stratégique, intermédiaire, opérationnel)'), 'Layers', C.navy);
    card(s, M, 3.75, W - 2 * M, 2.9); txt(s, t('Strategic objectives', 'Objectifs stratégiques'), M + 0.35, 3.95, 6, 0.4, { fontFace: TITLE, fontSize: 17, bold: true, color: C.navy });
    await bullets(s, so.map(o => `${o.code} — ${L(o.statement)} (${t('horizon', 'échéance')} ${o.horizon_date})`), M + 0.35, 4.5, W - 2 * M - 0.7, 0.75, 14); }
  { const s = content(t('Scope of the mission', 'Périmètre de la mission'), t('Functions and decision levels in scope', 'Fonctions et niveaux de décision couverts'), textOf(TER, '1.8 '));
    const lv0 = ['MS', 'MO', 'OP']; const cr = rowsOf(TER, '1.8 ').filter(r => lv0.includes(r[3])); const fns = [...new Set(cr.map(r => r[2]))]; const lv = ['MS', 'MO', 'OP'];
    const grid = fns.map(f => [{ text: f, bold: true }, ...lv.map(l => cr.some(r => r[2] === f && r[3] === l) ? { text: '●', fill: ST[3], align: 'center' } : { text: '—', align: 'center' })]);
    table(s, [t('Function', 'Fonction'), t('MS — strategic', 'MS — stratégique'), t('MO — middle', 'MO — intermédiaire'), t('OP — operational', 'OP — opérationnel')], grid, M, 2.05, 7.6, [2.8, 1.6, 1.6, 1.6], { fontSize: 11, rowH: 0.42 });
    card(s, 8.55, 2.05, 4.18, 3.5, C.azureTint); txt(s, t('How the scope is set', 'Comment le périmètre est fixé'), 8.8, 2.2, 3.8, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy });
    txt(s, t(`Each function × decision-level cell is a weighted criterion of the Scope of Work. ${cr.length} criteria were approved by the sponsor before any questionnaire was sent; every later table of the report is filtered by this scope.`, `Chaque case fonction × niveau de décision est un critère pondéré du périmètre. ${cr.length} critères ont été approuvés par le sponsor avant l’envoi de tout questionnaire ; chaque tableau du rapport est ensuite filtré par ce périmètre.`), 8.8, 2.7, 3.75, 2.7, { fontSize: 12.5 });
    cap(s, t('Source: TER section 1.8.', 'Source : RIF section 1.8.'), M, 6.65, 6); }
  { const s = content(t('Method', 'Méthode'), t('Six phases, each closed by a gate with its deliverables', 'Six phases, chacune close par un jalon et ses livrables'), short(textOf(TER, '1.5 '), 160));
    const mission = rowsOf(TER, '1.5 ');
    table(s, [t('Phase', 'Phase'), t('End-to-end processes', 'Processus de bout en bout'), t('Progress', 'Avancement')], mission.map(r => [{ text: r[0], bold: true }, String(r[1]).split('\n').map(x => x.split(' ')[0]).join(' · '), { text: r[2], fill: ST[4], align: 'center' }]), M, 2.0, W - 2 * M, [3.6, 7.1, 1.43], { fontSize: 11, rowH: 0.62 });
    cap(s, t('Source: Training Engineering Report, section 1.5 “The current mission”.', 'Source : Rapport d’ingénierie de formation, section 1.5 « La mission en cours ».'), M, 6.55, 8); }
  { const s = content(t('Schedule', 'Calendrier'), t('Work packages and the Gantt chart', 'Lots de travaux et diagramme de Gantt'));
    const sch = rowsOf(TER, '4.2 ');
    table(s, [t('Work package', 'Lot'), t('Start', 'Début'), t('End', 'Fin'), t('Progress', 'Avancement')], sch, M, 2.0, 4.6, [1.9, 1.0, 1.0, 0.7], { fontSize: 10.5 });
    const cal = rowsOf(PLAN, 'Calendar', 'Calendrier').slice(3);
    if (cal.length) table(s, [t('Sessions', 'Sessions'), t('Date', 'Date')], cal.map(r => [short(r[1], 38), r[2]]), M, 3.6, 4.6, [3.4, 1.2], { fontSize: 10 });
    screenshot(s, 'project_gantt', 5.55, 2.0, 7.2, 4.4); cap(s, t('WBS and Gantt of the project in CortexSkills.', 'WBS et Gantt du projet dans CortexSkills.'), 5.55, 6.5, 7); }
  { const s = content(t('Stakeholders', 'Parties prenantes'), t(`${stake.length} people consulted across every function`, `${stake.length} personnes consultées dans toutes les fonctions`), textOf(TER, '1.7 '));
    const pops = [...new Set(stake.map(r => r[2]))]; const fns = [...new Set(stake.map(r => r[3]))];
    s.addChart(pres.charts.BAR, pops.map((p, i) => ({ name: p, labels: fns, values: fns.map(f => stake.filter(r => r[3] === f && r[2] === p).length) })), { x: M, y: 1.95, w: 7.2, h: 4.4, barDir: 'bar', barGrouping: 'stacked', chartColors: [C.navy, C.azure, C.teal], showLegend: true, ...axis });
    cap(s, t('People consulted by function and population (TER 1.7).', 'Personnes consultées par fonction et population (RIF 1.7).'), M, 6.4, 7);
    const ch = [...new Set(stake.map(r => r[5]))].map(c => [c, String(stake.filter(r => r[5] === c).length)]);
    table(s, [t('Channel', 'Canal'), t('People', 'Personnes')], ch, 8.1, 2.0, 4.63, [3.2, 1.43], { fontSize: 11 });
    txt(s, t(`Consent recorded for ${stake.filter(r => /Given|Donné/i.test(r[6])).length} of ${stake.length} people before any answer was stored.`, `Consentement enregistré pour ${stake.filter(r => /Given|Donné/i.test(r[6])).length} personnes sur ${stake.length} avant tout enregistrement de réponse.`), 8.1, 4.4, 4.63, 0.8, { fontSize: 12.5 }); }

  // ---------------------------------------------------------------- 02 Diagnosis
  divider('02', t('Diagnosis', 'Diagnostic'), t('Who answered, where ' + K.the[0] + ' stands, which skills are missing', 'Qui a répondu, où en est l’hôpital, quelles compétences manquent'));
  { const s = content(t('Questionnaire campaign', 'Campagne de questionnaires'), t(`${responded} of ${invited} people answered`, `${responded} personnes sur ${invited} ont répondu`), short(textOf(TER, '1.6 '), 150));
    table(s, [t('Function', 'Fonction'), t('General Manager', 'Direction générale'), t('Management', 'Management'), t('Team member', 'Équipe'), t('Responded', 'Répondants')], sample, M, 2.0, 6.3, [2.3, 1.1, 1.0, 0.9, 1.0], { fontSize: 10.5 });
    s.addChart(pres.charts.BAR, [{ name: t('Response rate (%)', 'Taux de réponse (%)'), labels: byFn.map(r => r[0]), values: byFn.map(r => N(r[3])) }], { x: 7.2, y: 1.95, w: 5.5, h: 3.0, barDir: 'bar', chartColors: [C.azure], showValue: true, dataLabelFormatCode: '0"%"', valAxisMaxVal: 100, valAxisMinVal: 0, ...axis, showLegend: false });
    cap(s, t('Response rate by function.', 'Taux de réponse par fonction.'), 7.2, 4.95, 5.5);
    table(s, [t('Channel', 'Canal'), t('Invited', 'Invités'), t('Responded', 'Répondants'), t('Rate', 'Taux'), t('Completeness', 'Complétude')], byCh, 7.2, 5.3, 5.5, [1.5, 0.95, 1.1, 0.85, 1.1], { fontSize: 10.5 });
    cap(s, t('Source: TER sections 1.6, 1.12 and 1.13.', 'Source : RIF sections 1.6, 1.12 et 1.13.'), M, 6.65, 6); }
  { const s = content(t('The previous plan', 'Le plan précédent'), t('What the teams said about the last training plan', 'Ce que les équipes disent du dernier plan de formation'));
    const fb = rowsOf(TER, '2. ');
    fb.slice(0, 6).forEach((r, i) => { const x = M + (i % 3) * 4.1, y = 2.0 + Math.floor(i / 3) * 2.3; card(s, x, y, 3.85, 2.15, i === 5 ? C.azureTint : C.white);
      txt(s, short(r[0], 80), x + 0.25, y + 0.15, 3.4, 0.6, { fontFace: TITLE, fontSize: 12, bold: true, color: C.navy, fit: 'shrink' });
      txt(s, String(r[1]).split('\n').map(x => '• ' + x).join('\n'), x + 0.25, y + 0.8, 3.4, 1.3, { fontSize: 11.5, fit: 'shrink' }); });
    cap(s, t(`Source: TER chapter 2 — ${rowsOf(TER, '2.1 ').length} trainings attended are listed in section 2.1.`, `Source : RIF chapitre 2 — ${rowsOf(TER, '2.1 ').length} formations suivies sont listées en section 2.1.`), M, 6.65, 9); }
  { const s = content(t('Diagnosis and maturity', 'Diagnostic et maturité'), t('Five axes scored, maturity one level below target', 'Cinq axes évalués, maturité un niveau sous la cible'));
    const mat = rowsOf(TER, '1.9 '); const mm = rowsOf(TER, '1.10 ');
    s.addChart(pres.charts.RADAR, [{ name: t('Score (out of 5)', 'Score (sur 5)'), labels: mat.map(r => r[0]), values: mat.map(r => N(r[1])) }, { name: t('Target', 'Cible'), labels: mat.map(r => r[0]), values: mat.map(() => 4) }], { x: M, y: 1.95, w: 6.4, h: 4.3, radarStyle: 'standard', chartColors: [C.azure, C.muted], lineDash: ['solid', 'dash'], valAxisMaxVal: 5, valAxisMinVal: 0, ...axis, showLegend: true, catAxisLabelFontSize: 10 });
    cap(s, t('Diagnostic score by axis against target level 4 (TER 1.9).', 'Score de diagnostic par axe face à la cible de niveau 4 (RIF 1.9).'), M, 6.3, 6);
    table(s, [t('Axis', 'Axe'), t('Score', 'Score'), t('Reading', 'Lecture')], mat.map(r => [r[0], { text: r[1], align: 'center' }, { text: r[2], fill: N(r[1]) >= 3.3 ? ST[3] : N(r[1]) >= 2.5 ? ST[1] : ST[0] }]), 7.3, 2.0, 5.43, [1.9, 0.8, 2.73], { fontSize: 10.5 });
    table(s, [t('Model', 'Modèle'), t('Current', 'Actuel'), t('Target', 'Cible'), t('Gap', 'Écart')], mm, 7.3, 4.2, 5.43, [2.6, 0.95, 0.95, 0.93], { fontSize: 10.5 });
    cap(s, t('Maturity models (TER 1.10).', 'Modèles de maturité (RIF 1.10).'), 7.3, 5.15, 5); }
  { const s = content(t('Performance by function', 'Performance par fonction'), t('Where each function stands at each decision level', 'Où se situe chaque fonction à chaque niveau de décision'), textOf(TER, '3.2 '));
    const pf = rowsOf(TER, '3.2 ');
    table(s, [t('Function', 'Fonction'), 'MS', 'MO', 'OP', t('Main gaps', 'Écarts principaux')], pf.map(r => [{ text: r[0], bold: true }, { text: r[1], fill: rag(r[1]), align: 'center' }, { text: r[2], fill: rag(r[2]), align: 'center' }, { text: r[3], fill: rag(r[3]), align: 'center' }, short(r[4], 95)]), M, 2.05, W - 2 * M, [2.3, 1.3, 1.3, 1.3, 5.93], { fontSize: 10.5, rowH: 0.5 });
    cap(s, t('Maturity heatmap on the fixed red → green status scale (TER 3.2).', 'Carte de chaleur sur l’échelle de statut fixe rouge → vert (RIF 3.2).'), M, 6.4, 8); }
  { const s = content(t('Competences named in the interviews', 'Compétences citées lors des entretiens'), t('The competences people asked for, by number of mentions', 'Les compétences demandées, par nombre de mentions'), textOf(TER, '3.3 '));
    const cm = rowsOf(TER, '3.3 ').slice(0, 9);
    s.addChart(pres.charts.BAR, [{ name: t('Mentions', 'Mentions'), labels: cm.map(r => short(r[0], 40)), values: cm.map(r => N(r[1])) }], { x: M, y: 1.95, w: 7.6, h: 4.4, barDir: 'bar', chartColors: [C.azure], showValue: true, ...axis, showLegend: false, catAxisOrientation: 'maxMin' });
    cap(s, t('Mentions across all answers (TER 3.3).', 'Mentions dans l’ensemble des réponses (RIF 3.3).'), M, 6.4, 7);
    card(s, 8.55, 2.05, 4.18, 4.3, C.azureTint); txt(s, t('Reading', 'Lecture'), 8.8, 2.2, 3.8, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy });
    txt(s, t(`The two AI clinical themes lead (${cm[0]?.[1]} and ${cm[1]?.[1]} mentions), followed by team communication and problem solving: the plan pairs each AI training with practical workshops on ${CLINIC ? 'the clinics’' : 'the hospital’s'} own cases.`, `Les deux thèmes IA cliniques arrivent en tête (${cm[0]?.[1]} et ${cm[1]?.[1]} mentions), suivis de la communication d’équipe et de la résolution de problèmes : le plan associe chaque formation IA à des ateliers pratiques sur les cas propres ${CLINIC ? 'aux cliniques' : 'à l’hôpital'}.`), 8.8, 2.7, 3.75, 3.5, { fontSize: 12.5 }); }
  { const s = content(t('Soft skills and leadership', 'Compétences comportementales et leadership'), t('Self-assessment of the respondents, weakest first', 'Auto-évaluation des répondants, du plus faible au plus fort'));
    const ss = secN(TER, '3.7 ', 0)?.table?.rows || []; const ll = secN(TER, '3.7 ', 1)?.table?.rows || [];
    table(s, [t('Competence', 'Compétence'), t('Average (1–5)', 'Moyenne (1–5)'), 'n'], ss.slice(0, 8).map(r => [short(r[0], 70), { text: r[1], align: 'center', fill: N(r[1]) < 3.3 ? ST[1] : ST[2] }, { text: r[2], align: 'center' }]), M, 2.0, 7.0, [5.0, 1.3, 0.7], { fontSize: 10.5 });
    s.addChart(pres.charts.BAR, [{ name: t('Share of respondents', 'Part des répondants'), labels: ll.map(r => short(r[0], 34)), values: ll.map(r => N(r[1])) }], { x: 7.9, y: 1.95, w: 4.83, h: 4.1, barDir: 'bar', chartColors: [C.teal], showValue: true, dataLabelFormatCode: '0.0"%"', ...axis, showLegend: false, catAxisOrientation: 'maxMin', catAxisLabelFontSize: 9 });
    cap(s, t('Leadership levels reached (TER 3.7).', 'Niveaux de leadership atteints (RIF 3.7).'), 7.9, 6.1, 4.8); }
  { const s = content(t('Skill gaps and training needs', 'Écarts de compétences et besoins de formation'), t('From measured gaps to a validated needs register', 'Des écarts mesurés à un registre de besoins validé'));
    const gaps = rowsOf(TER, '3.40'); const needs = rowsOf(TER, '3.41');
    table(s, [t('Competency', 'Compétence'), t('People', 'Personnes'), t('Avg gap', 'Écart moyen'), t('Critical', 'Critiques')], gaps.map(r => [r[0], { text: r[2], align: 'center' }, { text: r[3], fill: N(r[3]) >= 3 ? ST[0] : N(r[3]) >= 2 ? ST[1] : ST[3], align: 'center' }, { text: r[4], align: 'center' }]), M, 2.0, 5.6, [2.9, 0.9, 0.95, 0.85], { fontSize: 10.5 });
    cap(s, t('Skill gaps by competency (TER 3.40).', 'Écarts par compétence (RIF 3.40).'), M, 3.35, 5);
    table(s, ['#', t('Theme', 'Thème'), t('Source', 'Source'), t('Impact', 'Impact'), t('Status', 'Statut')], needs.map(r => [r[0], r[1], r[2], { text: r[3], fill: ST[Math.min(4, Math.max(0, N(r[3]) - 1))], align: 'center' }, r[4]]), 6.45, 2.0, 6.28, [0.35, 3.0, 1.15, 0.75, 1.03], { fontSize: 10 });
    cap(s, t('Training needs register (TER 3.41): every need traced to its source.', 'Registre des besoins (RIF 3.41) : chaque besoin tracé jusqu’à sa source.'), 6.45, 5.45, 6);
    screenshot(s, 'questionnaire', M, 3.8, 5.6, 2.6); }
  { const core = TER.filter(x => /Clinical Care|Soins cliniques/.test(x.heading || '') && /^3\.\d+/.test(x.heading || ''));
    const s = content(t('Focus on the core function', 'Zoom sur la fonction cœur'), t('Clinical Care & Nursing', 'Soins cliniques et infirmiers'), t('Needs, assessment and competences of the function that carries the strategic objective SO-1', 'Besoins, évaluation et compétences de la fonction qui porte l’objectif stratégique SO-1'));
    const needs = core[0]?.table; const comp = core.find(x => (x.table?.columns || []).some(c => /Respondent|Répondant/.test(c)))?.table;
    if (needs) table(s, needs.columns.slice(0, 4), needs.rows.map(r => r.slice(0, 4).map(c => short(c, 60))), M, 2.0, W - 2 * M, needs.columns.slice(0, 4).map(() => (W - 2 * M) / Math.min(4, needs.columns.length)), { fontSize: 10.5 });
    if (comp) table(s, comp.columns.slice(0, 4), comp.rows.slice(0, 6).map(r => r.slice(0, 4).map(c => short(c, 70))), M, 3.6, W - 2 * M, [2.0, 1.6, 5.0, 3.53], { fontSize: 10 });
    cap(s, t('Source: TER sections 3.36 to 3.39.', 'Source : RIF sections 3.36 à 3.39.'), M, 6.65, 6); }
  { const s = content(t('Use of AI today', 'Usage actuel de l’IA'), t('How the teams use AI and what holds them back', 'Comment les équipes utilisent l’IA et ce qui les freine'));
    const ai = rowsOf(TER, '3.45 '); const qs = [...new Set(ai.map(r => r[0]))].slice(0, 5);
    const qLabel = [t('Current use', 'Usage actuel'), t('Barriers', 'Freins'), t('Risks to manage', 'Risques à maîtriser'), t('Priorities', 'Priorités'), t('Preferred format', 'Format préféré')];
    for (const [i, q] of qs.entries()) { const x = M + i * 2.46; const ans = ai.filter(r => r[0] === q).map(r => r[1]); const top = Object.entries(ans.reduce((m, a) => ((m[a] = (m[a] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).slice(0, 2);
      card(s, x, 2.0, 2.3, 3.0); await badge(s, ['Activity', 'OctagonAlert', 'ShieldCheck', 'Target', 'Presentation'][i], x + 0.2, 2.18, 0.5, i === 0 ? C.azure : C.navy);
      txt(s, qLabel[i] || q, x + 0.2, 2.8, 1.95, 0.4, { fontFace: TITLE, fontSize: 13, bold: true, color: C.navy });
      txt(s, top.map(([a, n]) => `${short(a, 70)} (${n})`).join('\n\n'), x + 0.2, 3.25, 1.95, 1.7, { fontSize: 10.5, fit: 'shrink' }); }
    const sp = rowsOf(TER, '3.46 ');
    table(s, [t('Strategic planning practice', 'Pratique de planification stratégique'), t('Yes', 'Oui'), t('No', 'Non')], sp.map(r => [r[0], { text: r[1], align: 'center', fill: N(r[1]) ? ST[3] : C.white }, { text: r[2], align: 'center', fill: N(r[2]) ? ST[0] : C.white }]), M, 5.1, W - 2 * M, [10.0, 1.07, 1.06], { fontSize: 10, rowH: 0.27 });
    cap(s, t(`Most frequent answers of ${responded} respondents (TER 3.45, 3.46).`, `Réponses les plus fréquentes des ${responded} répondants (RIF 3.45, 3.46).`), M, 6.55, 8); }
  { const s = content(t('Objectives and expected results', 'Objectifs et résultats attendus'), t('What the respondents want the training to change', 'Ce que les répondants attendent de la formation'));
    const ob = rowsOf(TER, '3.42 '); const top = Object.values(ob.reduce((m, r) => { (m[r[0]] ||= { o: r[0], smart: r[1], n: 0 }).n++; return m; }, {})).sort((a, b) => b.n - a.n).slice(0, 5);
    table(s, [t('Objective', 'Objectif'), t('SMART formulation', 'Formulation SMART'), t('Mentions', 'Mentions')], top.map(x => [{ text: x.o, bold: true }, x.smart, { text: String(x.n), align: 'center' }]), M, 2.0, 7.4, [2.8, 3.6, 1.0], { fontSize: 11, rowH: 0.48 });
    const ex = [...new Set(rowsOf(TER, '3.9 ').map(r => r[0]))].slice(0, 5);
    card(s, 8.3, 2.0, 4.43, 4.4, C.greenTint); txt(s, t('Expected results', 'Résultats attendus'), 8.55, 2.15, 4, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy });
    txt(s, ex.map(x => '• ' + x).join('\n\n'), 8.55, 2.65, 3.95, 3.6, { fontSize: 12.5 });
    cap(s, t(`Source: TER 3.42 (${ob.length} objectives stated) and 3.9.`, `Source : RIF 3.42 (${ob.length} objectifs exprimés) et 3.9.`), M, 6.65, 8); }

  // ---------------------------------------------------------------- 03 Training Engineering Report
  divider('03', t('Training Engineering Report', 'Rapport d’ingénierie de formation'), t(`${TER.length} sections, ${PAGES['DT-TER'] || '—'} pages, generated from the run data`, `${TER.length} sections, ${PAGES['DT-TER'] || '—'} pages, générées à partir des données du déroulé`));
  { const s = content(t('Structure of the report', 'Structure du rapport'), DOCS['DT-TER'].title.replace(/ — [^—]*$/, ''), t(`Version ${DOCS['DT-TER'].version} · author ${DOCS['DT-TER'].author} · approved by ${DOCS['DT-TER'].approver}`, `Version ${DOCS['DT-TER'].version} · auteur ${DOCS['DT-TER'].author} · approuvé par ${DOCS['DT-TER'].approver}`));
    const chapters = TER.filter(x => /^\d+\. /.test(x.heading || '')); const count = no => TER.filter(x => new RegExp('^' + no + '(\\.|\\s)').test(x.heading || '')).length;
    table(s, [t('Chapter', 'Chapitre'), t('Sections', 'Sections')], chapters.map(c => [c.heading, { text: String(count(c.heading.split('.')[0])), align: 'center' }]), M, 2.0, 5.6, [4.6, 1.0], { fontSize: 11, rowH: 0.42 });
    cap(s, t('Plus identification, data sources and approval.', 'Plus l’identification, les sources de données et l’approbation.'), M, 6.45, 5.6);
    screenshot(s, 'document_training_engineering_report', 6.5, 2.0, 6.2, 4.4); cap(s, t('The report in the document editor.', 'Le rapport dans l’éditeur de documents.'), 6.5, 6.5, 6); }
  { const s = content(t('Strategic orientations and HR', 'Orientations stratégiques et RH'), t('Needs linked to the strategy and to the HR orientations', 'Besoins liés à la stratégie et aux orientations RH'), textOf(TER, '3.1 '));
    const so = rowsOf(TER, '3.1 '); table(s, ['ID', t('Objective', 'Objectif'), t('Horizon', 'Échéance')], so, M, 2.05, W - 2 * M, [1.0, 9.33, 1.8], { fontSize: 11.5, rowH: 0.45 });
    const hr = [...new Set(rowsOf(TER, '3.5 ').map(r => r[0]))];
    card(s, M, 3.6, 6.0, 2.9); txt(s, t('HR orientations', 'Orientations RH'), M + 0.25, 3.75, 5.5, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy }); txt(s, hr.map(x => '• ' + x).join('\n'), M + 0.25, 4.2, 5.5, 2.2, { fontSize: 12.5 });
    card(s, 6.8, 3.6, 5.93, 2.9, C.azureTint); txt(s, t('Change management', 'Gestion du changement'), 7.05, 3.75, 5.5, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy }); txt(s, textOf(TER, '3.6 '), 7.05, 4.2, 5.5, 2.2, { fontSize: 12.5, fit: 'shrink' });
    cap(s, t('Source: TER sections 3.1, 3.5 and 3.6.', 'Source : RIF sections 3.1, 3.5 et 3.6.'), M, 6.65, 6); }
  { const s = content(t('Perspectives and roadmap', 'Perspectives et feuille de route'), t('Four initiatives deployed in three waves', 'Quatre initiatives déployées en trois vagues'), short(textOf(TER, '4. '), 170));
    const wave = rowsOf(TER, '4.1 '); const per = rowsOf(TER, '4. ');
    for (const w of [1, 2, 3]) { const x = M + (w - 1) * 4.1; card(s, x, 2.05, 3.85, 2.55, w === 1 ? C.azureTint : C.white);
      txt(s, t(`Wave ${w}`, `Vague ${w}`), x + 0.3, 2.2, 3.3, 0.45, { fontFace: TITLE, fontSize: 19, bold: true, color: C.navy });
      txt(s, wave.filter(r => N(r[0]) === w).map(r => `• ${r[1]} — ${t('impact', 'impact')} ${r[4]}`).join('\n') || '—', x + 0.3, 2.75, 3.3, 1.8, { fontSize: 13 }); }
    table(s, ['#', t('Improvement axis', 'Axe d’amélioration'), t('Implemented', 'Réalisé'), t('Wave', 'Vague')], per, M, 4.85, W - 2 * M, [0.5, 8.4, 1.6, 1.63], { fontSize: 11 });
    cap(s, t('Source: TER chapter 4 and section 4.1.', 'Source : RIF chapitre 4 et section 4.1.'), M, 6.65, 6); }
  { const s = content(t('Risks and controls', 'Risques et contrôles'), t('Each risk reduced by named controls', 'Chaque risque réduit par des contrôles nommés'));
    const risks = rowsOf(TER, '6. ').slice(0, 9);
    table(s, ['ID', t('Risk or opportunity', 'Risque ou opportunité'), t('Category', 'Catégorie'), t('Inherent', 'Inhérent'), t('Residual', 'Résiduel'), t('Controls', 'Contrôles')], risks.map(r => [r[0], r[1], r[2], { text: r[3], fill: N(r[3]) >= 16 ? ST[0] : ST[1], align: 'center' }, { text: r[4], fill: N(r[4]) >= 8 ? ST[1] : ST[3], align: 'center' }, r[5]]), M, 2.0, W - 2 * M, [1.0, 4.6, 1.6, 0.95, 0.95, 3.03], { fontSize: 10.5 });
    cap(s, t(`Top 9 of ${rowsOf(TER, '6. ').length} risks by residual score (TER chapter 6).`, `9 premiers risques sur ${rowsOf(TER, '6. ').length} par score résiduel (RIF chapitre 6).`), M, 5.35, 11); }
  { const s = content(t('Project indicators', 'Indicateurs du projet'), t('Indicators followed every month during the run', 'Indicateurs suivis chaque mois pendant le déroulé'));
    const k = rowsOf(TER, '6.1 ').filter(r => !/1[0-9]{2}(\.\d)?\b/.test(String(r[3]).split('·').pop())).slice(0, 10);
    table(s, ['ID', t('Indicator', 'Indicateur'), t('Target', 'Cible'), t('Latest value', 'Dernière valeur'), t('Status', 'Statut')], k.map(r => [r[0], r[1], r[2], String(r[3]).split('·').pop().trim(), { text: r[4], fill: rag(r[4]), align: 'center' }]), M, 2.0, W - 2 * M, [1.2, 5.0, 1.6, 2.9, 1.43], { fontSize: 10.5 });
    cap(s, t(`${k.length} of the ${rowsOf(TER, '6.1 ').length} indicators of TER section 6.1.`, `${k.length} des ${rowsOf(TER, '6.1 ').length} indicateurs de la section 6.1 du RIF.`), M, 6.65, 8); }

  // ---------------------------------------------------------------- 04 Training Plan
  divider('04', t('Training Plan', 'Plan de formation'), short(textOf(PLAN, 'Plan overview', 'Vue d’ensemble'), 140));
  { const s = content(t('Prioritized plan', 'Plan priorisé'), t('Six themes ranked by impact and urgency', 'Six thèmes classés par impact et urgence'), textOf(TER, '5. '));
    table(s, ['#', t('Theme', 'Thème'), t('Days', 'Jours'), t('Groups', 'Groupes'), t('Budget', 'Budget')], prio, M, 2.0, 6.6, [0.4, 3.6, 0.8, 0.8, 1.0], { fontSize: 11, rowH: 0.42 });
    s.addChart(pres.charts.BAR, [{ name: t('Budget', 'Budget'), labels: prio.map(r => short(r[1], 28)), values: prio.map(r => N(r[4])) }], { x: 7.4, y: 1.95, w: 5.3, h: 3.6, barDir: 'bar', chartColors: [C.azure], showValue: true, dataLabelFormatCode: '#,##0', ...axis, valAxisLabelFormatCode: '#,##0', showLegend: false, catAxisOrientation: 'maxMin' });
    cap(s, t('Budget by theme.', 'Budget par thème.'), 7.4, 5.6, 5); }
  { const s = content(t('Programs and trainings', 'Programmes et formations'), t('Two programs, six trainings, clear prerequisites', 'Deux programmes, six formations, des prérequis clairs'));
    const prg = rowsOf(PLAN, 'Programs', 'Programmes');
    table(s, [t('Code', 'Code'), t('Program', 'Programme'), t('Strategic axis', 'Axe stratégique'), t('Trainings', 'Formations')], prg.map(r => [r[0], r[1], r[2], r[4]]), M, 2.0, W - 2 * M, [1.0, 4.0, 3.7, 3.43], { fontSize: 11 });
    table(s, ['ID', t('Training', 'Formation'), t('Level', 'Niveau'), t('Duration', 'Durée'), t('Prerequisites', 'Prérequis')], trainings.map(r => [r[1], r[2], r[3], r[4], r[5]]), M, 3.2, W - 2 * M, [1.1, 4.0, 1.3, 1.1, 4.63], { fontSize: 10.5, rowH: 0.42 });
    cap(s, t('Source: Training Plan “Programs” and TER section 5.1.', 'Source : Plan de formation « Programmes » et RIF section 5.1.'), M, 6.3, 8); }
  { const tr = rowsOf(PLAN, 'Trainings', 'Formations')[0] || [];
    const s = content(t('Training sheet', 'Fiche de formation'), `${tr[1] || 'TR-AI-01'} — ${tr[2] || ''}`, t(`Level ${tr[3] || ''} · ${tr[4] || ''} day(s) · program ${tr[0] || ''}`, `Niveau ${tr[3] || ''} · ${tr[4] || ''} jour(s) · programme ${tr[0] || ''}`));
    card(s, M, 2.0, 7.4, 4.5); txt(s, t('Learning objectives', 'Objectifs pédagogiques'), M + 0.3, 2.15, 7, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy });
    txt(s, String(tr[5] || '').split('\n').map(x => '• ' + x).join('\n'), M + 0.3, 2.65, 6.8, 3.7, { fontSize: 12.5, fit: 'shrink' });
    card(s, 8.3, 2.0, 4.43, 4.5, C.azureTint); txt(s, t('Prerequisites', 'Prérequis'), 8.55, 2.15, 4, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy }); txt(s, tr[6] || '—', 8.55, 2.65, 3.95, 1.4, { fontSize: 12.5 });
    const pathRow = rowsOf(TER, '5.3 ').filter(r => r[0] === tr[2] || (!r[0] && 0));
    txt(s, t('Delivery', 'Modalités'), 8.55, 4.0, 4, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy });
    txt(s, rowsOf(TER, '5.3 ').slice(0, 2).map(r => `${r[2]} · ${r[3]} · ${r[4]} h`).join('\n'), 8.55, 4.45, 3.95, 1.8, { fontSize: 12 }); }
  { const ag = rowsOf(PLAN, 'Detailed agendas', 'Programmes détaillés').filter(r => r[0] === 'TR-AI-01');
    const s = content(t('Detailed agenda', 'Programme détaillé'), t(`${trainings[0]?.[2] || 'TR-AI-01'} — half-day by half-day`, `${trainings[0]?.[2] || 'TR-AI-01'} — demi-journée par demi-journée`), t(`${ag.length} activities over ${trainings[0]?.[4] || ''}: lectures, quizzes and workshops on ${CLINIC ? 'the clinics’' : 'the hospital’s'} own cases.`, `${ag.length} activités sur ${trainings[0]?.[4] || ''} : exposés, quiz et ateliers sur les cas propres ${CLINIC ? 'aux cliniques' : 'à l’hôpital'}.`));
    const half = [...new Set(ag.map(r => r[1]))];
    half.slice(0, 6).forEach((h, i) => { const x = M + (i % 3) * 4.1, y = 2.0 + Math.floor(i / 3) * 2.3; card(s, x, y, 3.85, 2.15, i === 0 ? C.azureTint : C.white);
      txt(s, h, x + 0.25, y + 0.15, 3.4, 0.35, { fontFace: TITLE, fontSize: 13, bold: true, color: C.navy });
      txt(s, ag.filter(r => r[1] === h).map(r => `${String(r[3]).startsWith(r[2]) ? '' : r[2] + ' · '}${short(r[3], 62)} (${r[4]} min)`).join('\n'), x + 0.25, y + 0.55, 3.4, 1.55, { fontSize: 10.5, fit: 'shrink' }); }); }
  { const s = content(t('Value for each persona', 'Valeur pour chaque persona'), t('Why each audience should take the training', 'Pourquoi chaque public doit suivre la formation'), t('Training TR-AI-01 — behaviour, pain points and hopes of each persona', 'Formation TR-AI-01 — comportements, irritants et attentes de chaque persona'));
    const vp = rowsOf(PLAN, 'Value proposition', 'Proposition de valeur').filter(r => r[0] === 'TR-AI-01');
    for (const [i, r] of vp.slice(0, 3).entries()) { const x = M + i * 4.1; card(s, x, 2.0, 3.85, 4.5); await badge(s, ['Briefcase', 'Users', 'Stethoscope'][i], x + 0.25, 2.2, 0.6, i === 0 ? C.azure : C.navy);
      txt(s, r[1], x + 1.0, 2.2, 2.7, 0.7, { fontFace: TITLE, fontSize: 13, bold: true, color: C.navy, fit: 'shrink' });
      txt(s, String(r[2]).split(' · ').join('\n\n'), x + 0.25, 3.0, 3.4, 3.4, { fontSize: 10.5, fit: 'shrink' }); } }
  { const s = content(t('Learning design', 'Ingénierie pédagogique'), t('Paths, modules and content assets', 'Parcours, modules et ressources pédagogiques'));
    const lp = rowsOf(TER, '5.3 '); const ca = rowsOf(TER, '5.4 ');
    table(s, [t('Learning path', 'Parcours'), t('Days', 'Jours'), t('Module', 'Module'), t('Modality', 'Modalité'), t('Hours', 'Heures'), t('Design', 'Conception')], lp.map(r => [r[0], r[1], r[2], r[3], r[4], { text: r[5], fill: ST[3] }]), M, 2.0, W - 2 * M, [3.2, 0.8, 3.4, 1.8, 0.9, 2.03], { fontSize: 10.5 });
    table(s, [t('Content', 'Ressource'), t('Format', 'Format'), t('Size (MB)', 'Taille (Mo)'), t('Review date', 'Date de revue'), t('Status', 'Statut'), t('Language', 'Langue')], ca, M, 4.0, W - 2 * M, [2.6, 1.6, 1.5, 2.2, 2.2, 2.03], { fontSize: 10.5 });
    cap(s, t('Source: TER sections 5.3 and 5.4.', 'Source : RIF sections 5.3 et 5.4.'), M, 6.65, 6); }
  { const s = content(t('Budget', 'Budget'), t('Allocated, committed, spent and refunds expected', 'Alloué, engagé, consommé et remboursements attendus'), textOf(TER, '5.7 '));
    const lines = budget.filter(r => !/Total/.test(r[0]));
    s.addChart(pres.charts.BAR, [{ name: t('Allocated', 'Alloué'), labels: lines.map(r => short(r[0], 26)), values: lines.map(r => N(r[1])) }, { name: t('Actual', 'Réel'), labels: lines.map(r => short(r[0], 26)), values: lines.map(r => N(r[4])) }],
      { x: M, y: 2.0, w: 7.0, h: 4.2, barDir: 'col', barGrouping: 'clustered', chartColors: [C.muted, C.azure], showLegend: true, ...axis, catAxisLabelFontSize: 9, valAxisLabelFormatCode: '#,##0' });
    cap(s, t('Allocated (Muted) versus actual (Azure) by training, (TER 5.7).', 'Alloué (gris) et réel (azur) par formation (RIF 5.7).'), M, 6.25, 6.5);
    table(s, [t('Line', 'Ligne'), t('Actual', 'Réel'), t('Refund', 'Rembours.')], budget.map(r => [{ text: short(r[0], 30), bold: /Total/.test(r[0]) }, { text: r[4], bold: /Total/.test(r[0]) }, r[5]]), 7.85, 2.0, 4.88, [2.7, 1.1, 1.08], { fontSize: 10.5 });
    const prov = rowsOf(PLAN, 'Training providers', 'Prestataires');
    table(s, [t('Provider', 'Prestataire'), t('Accredited until', 'Agrément jusqu’au'), '/5'], prov, 7.85, 4.75, 4.88, [2.3, 1.8, 0.78], { fontSize: 10.5 }); }

  // ---------------------------------------------------------------- 05 Delivery, evaluation and audit
  divider('05', t('Delivery, evaluation and audit', 'Déploiement, évaluation et audit'), t('Sessions, Kirkpatrick levels, ROI, internal audit and lessons learned', 'Sessions, niveaux de Kirkpatrick, ROI, audit interne et retours d’expérience'));
  { const s = content(t('Sessions and attendance', 'Sessions et présence'), t('Four sessions delivered with their enrolments', 'Quatre sessions réalisées avec leurs inscriptions'));
    const ss = rowsOf(TER, '5.5 '); const en = rowsOf(TER, '5.6 ');
    table(s, [t('Session', 'Session'), t('Date', 'Date'), t('Capacity', 'Capacité'), t('Trainer', 'Formateur'), t('Enrolled', 'Inscrits')], ss, M, 2.0, 7.6, [3.5, 1.2, 0.9, 1.3, 0.7], { fontSize: 10.5 });
    const pres_ = en.filter(r => /Present|Présent/i.test(r[2])).length, done = en.filter(r => /Completed|Terminé|Achevé/i.test(r[3])).length;
    await kpi(s, 8.55, 2.0, 4.18, `${pres_} / ${en.length}`, t('learners present at their session', 'apprenants présents à leur session'), 'UserCheck', C.green);
    await kpi(s, 8.55, 3.55, 4.18, `${done} / ${en.length}`, t('enrolments completed', 'inscriptions achevées'), 'BadgeCheck', C.navy);
    screenshot(s, 'run_task_steps', M, 4.25, 7.6, 2.25); cap(s, t('A task of the delivery process with its typed steps.', 'Une tâche du processus de déploiement avec ses étapes typées.'), M, 6.55, 7); }
  { const s = content(t('Evaluation', 'Évaluation'), t('Results measured at three Kirkpatrick levels', 'Résultats mesurés sur trois niveaux de Kirkpatrick'));
    const ep = rowsOf(PLAN, 'Evaluation plan', 'Plan d’évaluation');
    for (const [i, e] of evals.entries()) await kpi(s, M + i * 4.1, 2.0, 3.85, e[2], e[0], ['Smile', 'BookOpenCheck', 'Footprints'][i] || 'ChartColumn', i === 0 ? C.azure : C.navy);
    table(s, [t('Level', 'Niveau'), t('What is measured', 'Ce qui est mesuré'), t('When', 'Quand'), t('Instrument', 'Instrument'), t('Results', 'Résultats')], ep, M, 3.65, W - 2 * M, [1.6, 3.4, 2.3, 3.0, 1.83], { fontSize: 10.5 });
    const cnt = k => certs.filter(r => r[4] === k).length;
    txt(s, t(`Certifications (TER 5.10): ${cnt('Valid')} valid, ${cnt('Expiring')} expiring, ${cnt('Expired')} expired — the expired one triggers an alert and a renewal session.`, `Certifications (RIF 5.10) : ${cnt('Valide') + cnt('Valid')} valides, ${cnt('Expire bientôt') + cnt('Expiring')} à échéance proche, ${cnt('Expiré') + cnt('Expirée') + cnt('Expired')} expirée — l’expirée déclenche une alerte et une session de renouvellement.`), M, 5.7, W - 2 * M, 0.6, { fontSize: 13 }); }
  { const s = content(t('ROI and business impact', 'ROI et impact métier'), t('Phillips ROI and the indicators of the ROI study', 'ROI de Phillips et indicateurs de l’étude ROI'), DOCS['DT-E2E-08']?.title);
    const pick = ['KPI-037', 'KPI-012', 'KPI-013', 'KPI-022', 'KPI-023'];
    const rows = pick.map(id => roiKpi.find(r => r[0] === id)).filter(Boolean);
    for (const [i, r] of rows.slice(0, 4).entries()) await kpi(s, M + i * 3.07, 2.0, 2.9, r[4].split(' ')[0], short(r[1], 46), ['TrendingUp', 'Smile', 'ChartLine', 'Scale'][i], i === 0 ? C.green : C.navy);
    table(s, ['ID', t('Indicator', 'Indicateur'), t('Formula', 'Formule'), t('Target', 'Cible'), t('Latest value', 'Dernière valeur'), t('Status', 'Statut')], rows.map(r => [r[0], r[1], short(r[2], 70), r[3], r[4], { text: r[5], fill: rag(r[5]), align: 'center' }]), M, 3.65, W - 2 * M, [1.0, 2.8, 4.3, 1.1, 1.8, 1.13], { fontSize: 10.5 });
    cap(s, t('Source: ROI and business impact report (DT-E2E-08), indicators section.', 'Source : rapport ROI et impact métier (DT-E2E-08), section indicateurs.'), M, 6.65, 9); }
  { const s = content(t('Internal audit', 'Audit interne'), DOCS['DT-AUDIT']?.title || t('Audit report', 'Rapport d’audit'), AUD[5]?.text || '');
    const grades = AUD[2]?.table?.rows || []; const findings = AUD[3]?.table?.rows || [];
    s.addChart(pres.charts.BAR, [{ name: t('Findings', 'Constats'), labels: grades.map(r => r[0]), values: grades.map(r => N(r[1])) }], { x: M, y: 1.95, w: 5.0, h: 3.2, barDir: 'bar', chartColors: [C.azure], showValue: true, ...axis, showLegend: false, catAxisOrientation: 'maxMin', valAxisMaxVal: 3 });
    cap(s, t('Findings by grade.', 'Constats par niveau.'), M, 5.2, 5);
    table(s, ['ID', t('Grade', 'Niveau'), t('Requirement', 'Exigence'), t('Statement', 'Constat')], findings.map(r => [r[0], { text: r[1], fill: /Major|majeure/i.test(r[1]) ? ST[0] : /Minor|mineure/i.test(r[1]) ? ST[1] : /Strength|Force|Point fort/i.test(r[1]) ? ST[4] : ST[2] }, r[2], r[3]]), 5.9, 2.0, 6.83, [0.6, 1.7, 1.2, 3.33], { fontSize: 10.5, rowH: 0.55 });
    txt(s, `${t('Strengths', 'Points forts')}: ${AUD[1]?.text || '—'}\n${t('Follow-up', 'Suivi')}: ${AUD[6]?.text || '—'}`, M, 5.6, W - 2 * M, 0.9, { fontSize: 12.5 }); }
  { const rex = (D.records.RexEntry || [])[0] || {}; const s = content(t('Lessons learned', 'Retour d’expérience'), L(rex.title) || t('Lessons learned', 'Retour d’expérience'));
    const cols = [[t('What went well', 'Ce qui a bien fonctionné'), L(rex.what_went_well), C.greenTint, 'ThumbsUp'], [t('What did not', 'Ce qui n’a pas fonctionné'), L(rex.what_did_not), ST[0], 'TriangleAlert'], [t('Root cause', 'Cause racine'), L(rex.root_cause), ST[2], 'Search'], [t('What we will do next time', 'Ce que nous ferons la prochaine fois'), L(rex.recommendation), C.azureTint, 'Lightbulb']];
    for (const [i, c] of cols.entries()) { const x = M + i * 3.07; card(s, x, 2.0, 2.9, 4.4, c[2]); await badge(s, c[3], x + 0.25, 2.25, 0.6, i === 0 ? C.green : C.navy);
      txt(s, c[0], x + 0.25, 3.0, 2.45, 0.6, { fontFace: TITLE, fontSize: 14, bold: true, color: C.navy, fit: 'shrink' }); txt(s, c[1] || '—', x + 0.25, 3.65, 2.45, 2.6, { fontSize: 12.5 }); } }

  // ---------------------------------------------------------------- 06 Documents produced
  divider('06', t('Documents produced', 'Documents produits'), t(`${docCodes.length} documents published in English, each traced to its data`, `${docCodes.length} documents publiés en français, chacun relié à ses données`));
  { const list = docCodes.sort((a, b) => (a.startsWith('DT-E2E') ? Number(a.slice(7)) : 100 + ['DT-TER', 'DT-PLAN', 'DT-AUDIT', 'DT-MASTER'].indexOf(a)) - (b.startsWith('DT-E2E') ? Number(b.slice(7)) : 100 + ['DT-TER', 'DT-PLAN', 'DT-AUDIT', 'DT-MASTER'].indexOf(b)));
    const rows = list.map(c => [c, short(DOCS[c].title.replace(/ — .*$/, ''), 60), { text: String(PAGES[c] || '—'), align: 'center' }]);
    for (let part = 0; part < 2; part++) {
      const chunk = rows.slice(part * 20, part * 20 + 20); if (!chunk.length) break;
      const s = content(t('Documents produced', 'Documents produits'), part ? t('Documents produced (continued)', 'Documents produits (suite)') : t('Every end-to-end process leaves its document', 'Chaque processus de bout en bout laisse son document'), part ? '' : t(`All published, versioned and approved by a second person${totalPages ? ` — ${num(totalPages)} pages` : ''}.`, `Tous publiés, versionnés et approuvés par une seconde personne${totalPages ? ` — ${num(totalPages)} pages` : ''}.`));
      table(s, [t('Code', 'Code'), t('Document', 'Document'), t('Pages', 'Pages')], chunk.slice(0, 10), M, 2.0, 5.95, [1.25, 4.0, 0.7], { fontSize: 9.5, rowH: 0.36 });
      if (chunk.length > 10) table(s, [t('Code', 'Code'), t('Document', 'Document'), t('Pages', 'Pages')], chunk.slice(10), 6.78, 2.0, 5.95, [1.25, 4.0, 0.7], { fontSize: 9.5, rowH: 0.36 });
    } }
  { const s = content(t('Traceability', 'Traçabilité'), t('Every number of the report comes from a record', 'Chaque chiffre du rapport provient d’un enregistrement'), textOf(TER, 'Data sources', 'Sources des données'));
    const src = rowsOf(TER, 'Data sources', 'Sources des données');
    table(s, [t('Source', 'Source'), t('Records', 'Enreg.'), t('Process', 'Processus'), t('Last change', 'Dernière modif.')], src.slice(0, 12), M, 2.0, 7.0, [2.9, 1.1, 1.3, 1.7], { fontSize: 10, rowH: 0.3 });
    card(s, 7.95, 2.0, 4.78, 4.4, C.azureTint); txt(s, t('Governance of the documents', 'Gouvernance des documents'), 8.2, 2.15, 4.4, 0.4, { fontFace: TITLE, fontSize: 15, bold: true, color: C.navy });
    await bullets(s, [t(`Author ${DOCS['DT-TER'].author}, approver ${DOCS['DT-TER'].approver}: two different people.`, `Auteur ${DOCS['DT-TER'].author}, approbateur ${DOCS['DT-TER'].approver} : deux personnes différentes.`), t('Each version is kept; a change of the data marks the document as stale.', 'Chaque version est conservée ; un changement des données marque le document comme obsolète.'), t(`${src.length} data sources listed with their record counts and process.`, `${src.length} sources de données listées avec leur nombre d’enregistrements et leur processus.`)], 8.2, 2.7, 4.35, 1.15, 12); }
  { const s = content(t('Inside the application', 'Dans l’application'), t('The Training Plan as the users see it', 'Le plan de formation tel que les utilisateurs le voient'));
    screenshot(s, 'document_training_plan', M, 2.0, 6.0, 4.3); cap(s, DOCS['DT-PLAN'].title, M, 6.4, 6);
    screenshot(s, 'training_plan', 6.75, 2.0, 6.0, 4.3); cap(s, t('Training plan screen: programs, trainings and sessions.', 'Écran du plan de formation : programmes, formations et sessions.'), 6.75, 6.4, 6); }
  { const s = content(t('Inside the application', 'Dans l’application'), t('The project workspace and the dashboard', 'L’espace projet et le tableau de bord'));
    screenshot(s, 'project_workspace', M, 2.0, 6.0, 4.3); cap(s, t('Project workspace: phases, processes and progress.', 'Espace projet : phases, processus et avancement.'), M, 6.4, 6);
    screenshot(s, 'dashboard', 6.75, 2.0, 6.0, 4.3); cap(s, t('Dashboard ' + K.of[0] + '.', 'Tableau de bord ' + K.of[1] + '.'), 6.75, 6.4, 6); }

  // Conclusion
  { section = t('Conclusion', 'Conclusion'); const s = content(t('Conclusion', 'Conclusion'), t('What ' + K.the[0] + ' has at the end of the cycle', 'Ce que ' + (CLINIC ? 'le groupe' : 'l’hôpital') + ' obtient en fin de cycle'));
    await bullets(s, [
      t(`A Training Engineering Report of ${PAGES['DT-TER'] || '—'} pages, built from ${responded} answers, ${(D.records.Stakeholder || []).length} stakeholders and the diagnosis of every function.`, `Un Rapport d’ingénierie de formation de ${PAGES['DT-TER'] || '—'} pages, construit à partir de ${responded} réponses, ${(D.records.Stakeholder || []).length} parties prenantes et du diagnostic de chaque fonction.`),
      t(`A locked Training Plan: ${prio.length} trainings, half-day agendas, a value proposition per persona and a budget of ${total[1] || '—'}`, `Un Plan de formation verrouillé : ${prio.length} formations, des déroulés par demi-journée, une proposition de valeur par persona et un budget de ${total[1] || '—'}`),
      t('Evaluation at three Kirkpatrick levels, an ROI study, followed certifications and an internal audit with one minor nonconformity to correct.', 'Une évaluation sur trois niveaux de Kirkpatrick, une étude ROI, des certifications suivies et un audit interne avec une non-conformité mineure à corriger.'),
      t(`${docCodes.length} published documents ready for an accreditation audit (ISO 7101, JCI), each traced to the data and the step that produced it.`, `${docCodes.length} documents publiés, prêts pour un audit d’accréditation (ISO 7101, JCI), chacun relié aux données et à l’étape qui l’a produit.`),
      t('Next: waves 2 and 3 of the roadmap and the level-4 (results) evaluation six to twelve months after the trainings.', 'Ensuite : vagues 2 et 3 de la feuille de route et évaluation de niveau 4 (résultats) six à douze mois après les formations.')], M, 2.1, W - 2 * M, 0.85, 15); }
  // Closing (Navy, white logo)
  { const s = pres.addSlide(); pageNo++; s.background = { color: C.navy };
    logo(s, 'aivalue-logo-white-slide.png', (W - 3.6) / 2, 1.5, 3.6);
    txt(s, t('Thank you', 'Merci'), 0, 4.45, W, 0.8, { fontFace: TITLE, fontSize: 36, bold: true, color: C.white, align: 'center' });
    txt(s, 'MEASURABLE · GOVERNED · SUSTAINABLE', 0, 5.35, W, 0.4, { fontSize: 14, bold: true, color: C.green, align: 'center', charSpacing: 3 }); }

  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, `CortexSkills_Healthcare_${K.file}_${LANG.toUpperCase()}.pptx`);
  await pres.writeFile({ fileName: file }); fs.writeFileSync(file.replace(/\.pptx$/, '.outline.json'), JSON.stringify({ title: pres.title, org, lang: LANG, slides: OUTLINE }));
  console.log('written', file, pageNo, 'slides');
})();
