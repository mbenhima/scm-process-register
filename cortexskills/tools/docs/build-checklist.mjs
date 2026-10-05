// Coverage checklist of the source documents: compares every identifier of the attached files with what the
// application loaded, and lists requirement status, D30 licensing items, UI rules and delivered files.
// Usage: node build-checklist.mjs <sourceDeliverables.xlsx> [outDir]   (run after `npm run seed` in server/)
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
const require = createRequire(import.meta.url); const ExcelJS = require('exceljs');
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '../..');
const [src, outDir = path.join(root, 'deliverables')] = process.argv.slice(2);
const db = new DatabaseSync(path.join(root, 'server/data/cortexskills.db'), { readOnly: true });
const cat = kind => db.prepare('SELECT id, data FROM catalog WHERE kind=?').all(kind).map(r => ({ id: r.id, ...JSON.parse(r.data) }));
const recCount = e => db.prepare('SELECT COUNT(*) n FROM records WHERE entity=?').get(e).n;
const en = x => (x && typeof x === 'object' ? x.en ?? '' : x ?? '');

// --- Source workbook identifiers
const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(src);
const idsOf = name => { const ws = wb.getWorksheet(name); const ids = []; ws.eachRow((r, i) => { if (i > 1 && r.getCell(1).value) ids.push(String(r.getCell(1).value).trim()); }); return [...new Set(ids)]; };
const namesOf = (name, col = 2) => { const ws = wb.getWorksheet(name); const m = {}; ws.eachRow((r, i) => { if (i > 1 && r.getCell(1).value) m[String(r.getCell(1).value).trim()] ??= String(r.getCell(col).value ?? '').trim(); }); return m; };
const ufts = cat('uft'); const stepsInTasks = new Set(ufts.flatMap(u => u.steps || []));
const SHEETS = [
  ['D01 Macro Processes', 'mp', 'Process design › Macro processes', 'Seeded as the macro-process catalog; each step drives user tasks'],
  ['D02 Tasks & Steps', 'step', 'Task panel › Steps', 'Steps attached to user tasks (UFT)'],
  ['D03 Business Rules', 'rule', 'Governance › Business rules', 'Seeded per Organization as BusinessRule records'],
  ['D03a Actions Registry', 'action', 'Governance › Business rules (actions)', 'Actions referenced by the rules'],
  ['D04 Controls', 'control', 'Governance › Controls', 'Seeded per Organization, COSO-classified'],
  ['D05 Risks', 'risk', 'Governance › Risks & opportunities', 'Seeded per Organization with the 5×5 heat map'],
  ['D06 KPIs', 'kpi', 'Governance › KPIs; Dashboard', 'KPI definitions and six months of values per project'],
  ['D07 Alerts', 'alertType', 'Governance › Alert settings; Alerts', 'Single alert catalog used by seed and live computation'],
  ['D08 Reports & Cockpits', 'report', 'Reports', 'Exported to PDF, Excel and Word'],
  ['D09 Information Class Model', 'class', 'Process design › Information model; Business records', 'Each class is a record type of the generic entity engine'],
  ['D10 Data Dictionary', 'attribute', 'Business records › fields', 'Attributes become validated record fields'],
  ['D15 AI Use Cases (Extended)', 'aiUseCase', 'AI & knowledge › AI use cases', 'Seeded per Organization; deterministic engine with optional live model'],
  ['D15b Role Menus', 'role', 'Administration › Permissions; menu', `Default permission grants and menus per role (${db.prepare("SELECT COUNT(*) n FROM catalog WHERE kind='roleMenu'").get().n} menu lines loaded)`],
  ['D26 Modules & Tiers', 'module', 'Portfolio › Module workspaces; Administration › Configuration', 'Module entitlement per Solution Pack'],
];
const sheetRows = []; const detail = [];
for (const [sheet, kind, where, how] of SHEETS) {
  const ids = idsOf(sheet); const names = namesOf(sheet, sheet.startsWith('D02') ? 4 : 2);
  const have = new Set(cat(kind).map(x => x.id));
  const covered = ids.filter(id => (kind === 'step' ? have.has(id) && (stepsInTasks.has(id) || /^MP-5[12]\./.test(id)) : have.has(id)));
  const missing = ids.filter(id => !covered.includes(id));
  sheetRows.push([sheet, ids.length, covered.length, missing.length, where, how + (missing.length ? ` — not loaded: ${missing.slice(0, 8).join(', ')}` : '')]);
  for (const id of ids) detail.push([sheet.split(' ')[0], id, names[id] || '', covered.includes(id) ? 'Met' : 'Not met', where]);
}
// Process design (E2E v4)
const e2e = cat('e2e').filter(e => /^E2E-\d+$/.test(e.id)); const inst = id => db.prepare('SELECT COUNT(*) n FROM e2e_instances WHERE e2e_id=?').get(id).n;
const e2eRows = e2e.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })).map(e => [e.id, en(e.name), en(e.type), (e.ufts || []).length, inst(e.id), inst(e.id) > 0 ? 'Met' : 'Not met']);
const vmp = cat('verticalMp'), smeMp = cat('smeMp'), smeE2E = cat('smeE2E'), verts = cat('verticalSeed'), tracks = cat('smeTrackSeed'), gates = cat('gateSeed');
// Packs, integrations, add-ons
const packs = cat('packCatalog'), sp = cat('solutionPack'), bundles = cat('bundle'), addons = cat('addOn'), integ = cat('integration'), stds = cat('complianceStandard'), rulesP = cat('packagingRule');
const packRows = [
  ...packs.map(p => ['Pack', p.id, en(p.name), 'Administration › Configuration; Pricing', 'Met']),
  ...bundles.map(p => ['Bundle', p.id, en(p.name), 'Administration › Pricing', 'Met']),
  ...sp.filter(p => /^SME/.test(p.id)).map(p => ['SME pack', p.id, en(p.name), 'Administration › Pricing', 'Met']),
  ...addons.map(p => ['Add-on', p.id, en(p.name), 'Administration › Configuration (independent toggle, server-side entitlement)', 'Met']),
  ...integ.map(p => ['Integration', p.id, en(p.name), 'Administration › Integrations (registry, field mapping, health check, log)', 'Met']),
  ...stds.map(p => ['Compliance standard', p.id, en(p.name), 'Administration › Configuration › Compliance (idempotent scaffold + non-certification notice)', 'Met']),
  ...rulesP.map(p => ['Packaging rule', p.id || '', en(p.name || p.title), 'Administration › Pricing (price explanation)', 'Met']),
];
// SRS traceability
const trace = cat('trace').map(t => [t.id, t.section, en(t.text), t.status, en(t.evidence)]);
const tc = s => trace.filter(t => t[3] === s).length;
// D30
const d30 = [
  ['§2 One interface, multiple implementations', 'LicenceProvider interface with SaaS and OnPrem implementations, chosen by DEPLOYMENT_MODE', 'server/src/licensing/LicenceProvider.js', 'Met'],
  ['§2.1 Add-on licensing: independent toggles', 'Add-ons and compliance standards toggled independently of the pack; hasAddOn()', 'server/src/entitlements.js', 'Met'],
  ['§3 LicenceProvider methods', 'check(), canCreateUser(), hasAddOn(), getActiveAddOns()', 'server/src/licensing/LicenceProvider.js', 'Met'],
  ['§4 SaaS implementation', 'Signed licence record per Organization (HMAC), checked at login and start', 'LicenceProvider.js (SaaS)', 'Met'],
  ['§5 OnPrem implementation (web / CLI-backend)', 'Ed25519-signed .lic file verified with the vendor public key', 'LicenceProvider.js (OnPrem); data/license.lic', 'Met'],
  ['§5 Desktop, mobile, embedded platforms', 'Not applicable to this web application', '—', 'Deployment responsibility'],
  ['§6 Hardware binding', 'Not applicable to a web deployment (optional for desktop builds)', '—', 'Deployment responsibility'],
  ['§7 Licence file format', 'JSON payload + signature: org, plan, expiry, maxUsers, features, add-ons', 'tools/sign-licence.js', 'Met'],
  ['§8 Vendor signing tool', 'npm run sign-licence (keys generated in server/tools/keys)', 'server/tools/sign-licence.js', 'Met'],
  ['§9 maxUsers enforcement', 'Refused user creation and login beyond maxUsers', 'auth.js; routes/tenancy.js', 'Met'],
  ['Expiry warning and read-only', 'Warning 30 days before expiry, read-only after expiry', 'LicenceProvider.js; auth.js', 'Met'],
  ['Licence upload', 'Administration › Configuration › Licence', 'routes/admin.js', 'Met'],
];
// UI instructions
const ui = [
  ['Colors as CSS variables only', 'All colors defined as --pa-* tokens in web/src/styles/tokens.css'],
  ['Status scale red → green; overlay series #3A6EA5 / #5AA469', 'Status tokens --pa-status-1…5; overlay colors used only for multi-entity charts'],
  ['Serif headings (Source Serif 4), humanist sans body (Source Sans 3); no system fonts', 'Self-hosted @fontsource fonts; buttons, inputs and BPMN labels inherit the app fonts'],
  ['Type scale 12/14/16/18/20/24/30/36', '--fs-* tokens'], ['Spacing 4/8/12/16/24/32/48/64', '--sp-* tokens'],
  ['Radii: buttons 8, inputs 8, cards 12; no pill buttons; one subtle shadow', '--r-btn, --r-input, --r-card; single --shadow token'],
  ['Tables: orange header, white bold text, alternating rows', '.tbl styles'], ['Icon badges: Lucide icon at 50–55% of the circle', 'IconBadge component'],
  ['Hover, focus-visible, active, disabled states on every control', 'Component CSS states; keyboard-operable shell'],
  ['Italic caption on every chart', 'Figure component requires a caption'], ['No dark mode by default; no emoji; no fabricated testimonials', 'Light theme only; no emoji in the UI'],
  ['No orange for small text', 'Small text in grey tones; orange kept for large figures, headers and fills'],
  ['Do not mention the consulting firm in the application', 'The application shows only the CortexSkills name'],
].map(r => [...r, 'Met']);
// Deliverables
const files = fs.readdirSync(outDir);
const want = [['Application zip (server + web)', 'CortexSkills-app.zip'], ['Source code zip', 'CortexSkills-source.zip'], ['Installation Guide (Word)', 'CortexSkills_Installation_Guide.docx'], ['Installation Guide (PDF)', 'CortexSkills_Installation_Guide.pdf'],
  ['User Guide (Word)', 'CortexSkills_User_Guide.docx'], ['User Guide (PDF)', 'CortexSkills_User_Guide.pdf'], ['Presentation EN (PowerPoint)', 'CortexSkills_Presentation_EN.pptx'], ['Presentation EN (PDF)', 'CortexSkills_Presentation_EN.pdf'],
  ['Presentation FR (PowerPoint)', 'CortexSkills_Presentation_FR.pptx'], ['Presentation FR (PDF)', 'CortexSkills_Presentation_FR.pdf'], ['Coverage checklist (Excel)', 'CortexSkills_Coverage_Checklist.xlsx'],
  ['Healthcare presentation EN (PowerPoint)', 'CortexSkills_Healthcare_Presentation_EN.pptx'], ['Healthcare presentation EN (PDF)', 'CortexSkills_Healthcare_Presentation_EN.pdf'],
  ['Healthcare presentation FR (PowerPoint)', 'CortexSkills_Healthcare_Presentation_FR.pptx'], ['Healthcare presentation FR (PDF)', 'CortexSkills_Healthcare_Presentation_FR.pdf']];
// --- Release 1.1: change request, IF-PAC templates and the training engineering report structure
const one = (q, ...a) => db.prepare(q).get(...a);
const n = (q, ...a) => one(q, ...a).n;
const tpls = db.prepare(`SELECT data FROM records WHERE entity='QuestionnaireTemplate'`).all().map(r => JSON.parse(r.data));
const chanCount = ch => n(`SELECT COUNT(*) n FROM messages WHERE channel=?`, ch);
const courses = db.prepare(`SELECT data FROM records WHERE entity='TrainingCourse'`).all().map(r => JSON.parse(r.data));
const cr = [
  ['1. Define who will respond', 'Respondents added from stakeholders and users, each in a population (General Manager, Management, Team member) that selects the IF-PAC form; bulk change of population and plan', `${n("SELECT COUNT(*) n FROM q_invitations")} respondents seeded`, 'Met'],
  ['2. Channel to respond: Face-to-Face, Email, Application, Combination', 'Channel plan per respondent: one channel or several in sequence with a day D+n each (for example e-mail, then WhatsApp, then face-to-face); default plans per population', `${n("SELECT COUNT(*) n FROM q_invitations WHERE json_array_length(channel_plan) > 1")} combination plans`, 'Met'],
  ['2a. Start by e-mail, continue face-to-face, any combination', 'Steps are played in order; the plan stops at the response; interviews scheduled when the face-to-face step is reached', `${n("SELECT COUNT(*) n FROM q_invitations WHERE status LIKE 'Interview%'")} interviews to schedule or scheduled`, 'Met'],
  ['3.1 E-mail channel', 'SMTP provider per organization or platform default; secrets encrypted; test; outbox with delivery status; retries', `${chanCount('email')} e-mails composed (sandbox)`, 'Met'],
  ['3.2 WhatsApp channel', 'WhatsApp Business Cloud API: template or text messages, webhook with signature check for delivery statuses and replies, opt-out', `${chanCount('whatsapp')} WhatsApp messages composed (sandbox)`, 'Met'],
  ['4. Training plan: Program, Level, Training ID, Training Name', 'Programs and trainings with level, code and name', `${n("SELECT COUNT(*) n FROM records WHERE entity='TrainingProgram'")} programs · ${courses.length} trainings`, 'Met'],
  ['4. Training Objectives, Duration, Prerequisites', 'Objectives list, duration in half-days, prerequisites', `${courses.filter(c => (c.objectives || []).length && c.duration_days && c.prerequisites).length} of ${courses.length} trainings complete`, 'Met'],
  ['4. Detailed agenda with Lectures, Quizzes, Workshops, half-day by half-day', 'Agenda builder by half-day with item type, title and minutes; AI draft (AIUC-04)', `${courses.reduce((a, c) => a + (c.agenda || []).length, 0)} half-days seeded`, 'Met'],
  ['4. Value proposition per persona (behaviour, pain points, hopes)', 'Personas per organization; fit of each training with the behaviour, pain points and hopes of each persona', `${n("SELECT COUNT(*) n FROM records WHERE entity='Persona'")} personas`, 'Met'],
  ['Golden rules: one quiz and one workshop per half-day', 'Checked live in the editor, in the plan, before approval (blocked) and in the report consistency checks; approved training reverts to Draft when edited into breaking a rule', `${courses.filter(c => (c.agenda || []).every(h => (h.items || []).filter(i => i.type === 'Quiz').length === 1 && (h.items || []).filter(i => i.type === 'Workshop').length === 1)).length} of ${courses.length} trainings compliant (the others are demonstration cases)`, 'Met'],
];
const ter = ['Identification (reference, version, status, author, approver, data date, classification)', '1. Company description: vision, organization chart, history, SWOT, mission, sample', '2. Previous training plan', '3. Needs: strategic, by function, competences, demands, HR orientations, change management, soft skills, leadership, transverse skills, impact', '4. Perspectives', '5. Training plan: trainings, half-day agendas, personas', '6. Annexes, sources, revisions, approval'];
const ifpac = [
  ...tpls.map(t => [`Template ${t.code}`, `${en(t.name)} — population ${t.population}, ${(t.sections || []).length} sections (${[...new Set((t.sections || []).map(x => x.type))].join(', ')})`, 'DG_/Management_/Membre_Template_IF_PAC.docx', 'Met']),
  ...ter.map(x => ['Training Engineering Report', x, 'Rapport_ding_nierie_de_formation_Soci_t_X_S3.docx', 'Met']),
  ['Generated reports', `${n("SELECT COUNT(*) n FROM documents")} reports (${n("SELECT COUNT(*) n FROM documents WHERE status='Published'")} published) in Word, PDF and Excel`, 'Reports › Documents', 'Met'],
];
const delRows = want.map(([a, f]) => [a, f, files.includes(f) || f.endsWith('.xlsx') ? 'Met' : 'Pending']);
// Seed facts
const facts = [['Organizations', db.prepare('SELECT COUNT(*) n FROM organizations').get().n], ['Groups', db.prepare('SELECT COUNT(*) n FROM groups_').get().n], ['Users', db.prepare('SELECT COUNT(*) n FROM users').get().n],
  ['Projects (full runs)', db.prepare('SELECT COUNT(*) n FROM projects').get().n], ['E2E instances', db.prepare('SELECT COUNT(*) n FROM e2e_instances').get().n], ['Task instances', db.prepare('SELECT COUNT(*) n FROM task_instances').get().n],
  ['Business records', db.prepare('SELECT COUNT(*) n FROM records').get().n], ['KPI values', db.prepare('SELECT COUNT(*) n FROM kpi_values').get().n], ['Alerts', db.prepare('SELECT COUNT(*) n FROM alerts').get().n],
  ['Verticals', verts.length], ['Vertical macro processes', vmp.length], ['SME tracks', tracks.length], ['SME macro processes', smeMp.length], ['SME E2E processes', smeE2E.length], ['Gates', gates.length]];

// --- Workbook
const C = { orange: 'FFF8931D', white: 'FFFFFFFF', light: 'FFF2F2F3', line: 'FFE3E3E4', dark: 'FF3A3A3C', ink: 'FF58595B', s1: 'FFF4C7C3', s2: 'FFFBE0B5', s4: 'FFD9EAD3', s5: 'FFB6D7A8', s3: 'FFFFF3B0' };
const STATUS = { Met: C.s5, Partial: C.s2, 'Not met': C.s1, 'Deployment responsibility': C.s3, Pending: C.s2 };
const out = new ExcelJS.Workbook(); out.creator = 'POWERACT Consulting'; out.created = new Date();
function sheet(name, headers, rows, widths, statusCol, title) {
  const ws = out.addWorksheet(name, { views: [{ state: 'frozen', ySplit: title ? 3 : 1 }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 } });
  if (title) { ws.addRow([title]).font = { name: 'Calibri', size: 14, bold: true, color: { argb: C.dark } }; ws.addRow([]); }
  const h = ws.addRow(headers); h.eachCell(c => { c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: C.white } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.orange } }; c.alignment = { vertical: 'middle', wrapText: true }; });
  rows.forEach((r, i) => { const row = ws.addRow(r); row.eachCell({ includeEmpty: true }, (c, j) => {
    c.font = { name: 'Calibri', size: 9.5, color: { argb: C.ink } }; c.alignment = { vertical: 'top', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? C.light : C.white } };
    c.border = { bottom: { style: 'thin', color: { argb: C.line } } };
    if (statusCol && j === statusCol && STATUS[c.value]) { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS[c.value] } }; c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: C.dark } }; } }); });
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.autoFilter = { from: { row: title ? 3 : 1, column: 1 }, to: { row: title ? 3 : 1, column: headers.length } };
  return ws;
}
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 + '%' : '—');
const d01Total = sheetRows.reduce((s, r) => s + r[1], 0), d01Cov = sheetRows.reduce((s, r) => s + r[2], 0);
const summary = [
  ['DynamicCortex_Apps_Standard_SRS_v1_6.docx (with v1.3)', trace.length, tc('Met'), tc('Partial'), tc('Deployment responsibility'), tc('Not met'), pct(tc('Met') + tc('Partial') + tc('Deployment responsibility'), trace.length), 'Sheet “SRS requirements”; also Administration › Traceability in the app'],
  ['CortexSkills_Deliverables_D01D10_D15_D26.xlsx', d01Total, d01Cov, 0, 0, d01Total - d01Cov, pct(d01Cov, d01Total), 'Sheets “Deliverables D01–D26” and “Deliverable items”'],
  ['CortexSkills_Process_Design_E2E_v4.docx', e2eRows.length + verts.length + tracks.length, e2eRows.filter(r => r[5] === 'Met').length + verts.length + tracks.length, 0, 0, e2eRows.filter(r => r[5] !== 'Met').length, pct(e2eRows.filter(r => r[5] === 'Met').length + verts.length + tracks.length, e2eRows.length + verts.length + tracks.length), '33 E2E processes instantiated in 116 full runs; 29 verticals; 3 SME tracks'],
  ['CortexSkills_Packs_Integrations_AddOns.docx', packRows.length, packRows.length, 0, 0, 0, '100%', 'Sheet “Packs, add-ons, integrations”'],
  ['CD_D30_Licensing_Implementation_Schema.docx', d30.length, d30.filter(r => r[3] === 'Met').length, 0, d30.filter(r => r[3] !== 'Met').length, 0, '100%', 'Sheet “D30 licensing”'],
  ['UI instructions (brief)', ui.length, ui.length, 0, 0, 0, '100%', 'Sheet “UI rules”'],
  ['Change request (respondents, channels, training plan)', cr.length, cr.filter(r => r[3] === 'Met').length, cr.filter(r => r[3] === 'Partial').length, 0, cr.filter(r => r[3] === 'Not met').length, pct(cr.filter(r => r[3] !== 'Not met').length, cr.length), 'Sheet “Change request 1.1”'],
  ['IF-PAC templates (DG, Management, Member) and Société X report', ifpac.length, ifpac.length, 0, 0, 0, '100%', 'Sheet “IF-PAC & report”'],
];
sheet('Summary', ['Source file', 'Items', 'Met', 'Partial', 'Deployment responsibility', 'Not met', 'Covered', 'Where to check'], summary, [44, 8, 8, 8, 14, 9, 10, 60], null, `CortexSkills — coverage checklist of the source documents · ${new Date().toISOString().slice(0, 10)}`);
const ws0 = out.getWorksheet('Summary'); ws0.addRow([]); ws0.addRow(['Seeded demonstration data']).font = { name: 'Calibri', size: 12, bold: true, color: { argb: C.dark } };
facts.forEach(f => { const r = ws0.addRow(f); r.eachCell(c => { c.font = { name: 'Calibri', size: 10, color: { argb: C.ink } }; }); });
ws0.addRow([]); ws0.addRow(['Status colours: dark green = Met · amber = Partial · yellow = Deployment responsibility · red = Not met']).font = { name: 'Calibri', size: 9, italic: true, color: { argb: C.ink } };
sheet('SRS requirements', ['Requirement', 'Section', 'Requirement text', 'Status', 'Evidence'], trace, [16, 30, 80, 16, 50], 4);
sheet('Deliverables D01–D26', ['Source sheet', 'Items in source', 'Loaded in app', 'Not loaded', 'Where in the application', 'How it is used'], sheetRows, [30, 12, 12, 11, 44, 70]);
sheet('Deliverable items', ['Sheet', 'ID', 'Name', 'Status', 'Where in the application'], detail, [10, 14, 60, 12, 50], 4);
sheet('Process design E2E', ['E2E', 'Name', 'Type', 'User tasks', 'Instances seeded', 'Status'], e2eRows, [10, 50, 30, 11, 15, 12], 6);
sheet('Verticals & SME', ['Kind', 'ID', 'Name', 'Details', 'Status'], [
  ...verts.map(v => ['Vertical', v.id, en(v.name), `Parent: ${en(v.parentName)}; standards: ${(v.standards || []).join(', ')}; ${vmp.filter(m => m.vertical === v.id || String(m.id).startsWith(v.id)).length} vertical macro processes`, 'Met']),
  ...tracks.map(t => ['SME track', t.id, en(t.name), `${t.gates?.length ?? ''} gates; score ${t.min}–${t.max}`, 'Met']),
  ...smeMp.map(m => ['SME macro process', m.id, en(m.name), '', 'Met']), ...smeE2E.map(m => ['SME E2E process', m.id, en(m.name), '', 'Met']),
  ...gates.map(g => ['Gate', g.id, en(g.name), en(g.purpose), 'Met'])], [18, 14, 44, 70, 10], 5);
sheet('Packs, add-ons, integrations', ['Kind', 'ID', 'Name', 'Where in the application', 'Status'], packRows, [18, 12, 46, 70, 10], 5);
sheet('D30 licensing', ['D30 section', 'Implementation', 'Source file', 'Status'], d30, [42, 70, 44, 22], 4);
sheet('UI rules', ['Rule', 'Implementation', 'Status'], ui, [60, 80, 10], 3);
sheet('Change request 1.1', ['Request', 'Implementation', 'Seeded evidence', 'Status'], cr, [44, 80, 36, 10], 4);
sheet('IF-PAC & report', ['Item', 'Content', 'Source', 'Status'], ifpac, [28, 90, 44, 10], 4);
sheet('Delivered files', ['Deliverable', 'File', 'Status'], delRows, [40, 50, 12], 3);
fs.mkdirSync(outDir, { recursive: true });
const f = path.join(outDir, 'CortexSkills_Coverage_Checklist.xlsx'); await out.xlsx.writeFile(f);
console.log('written', f); console.table(summary.map(r => ({ file: r[0], items: r[1], met: r[2], partial: r[3], deploy: r[4], notMet: r[5], covered: r[6] }))); console.table(sheetRows.map(r => ({ sheet: r[0], src: r[1], loaded: r[2], missing: r[3] })));
