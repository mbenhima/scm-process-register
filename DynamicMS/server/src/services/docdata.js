// Document generation: fills an IMS document template with the project's data (registers,
// risks, KPIs, step values, RACSI...) and turns it into a render model (PDF, DOCX, XLSX).
// Content is kept trilingual; localization happens when the model is rendered.
import { all, get, P } from '../db.js';
import { catalog, loc } from '../catalog/store.js';
import { FORM_KINDS } from '../catalog/forms.js';
import { LABELS } from '../content/labels.js';
import { DOC_TEMPLATES, templateByCode } from '../content/templates.js';
import { PROFILES } from '../seed/profiles.js';
import { ROLES } from '../permissions.js';

const L = (en, fr, ar) => ({ en, fr, ar });
const lab = (code) => LABELS[code] || (code === null || code === undefined ? '' : { en: String(code), fr: String(code), ar: String(code) });
const roleName = (code) => ROLES.find(r => r.code === code)?.name || (code === 'system' ? L('DynamicMS Engine', 'Moteur DynamicMS', 'محرك DynamicMS') : code);
const col = (key, label, width = 1) => ({ key, label, width });
const table = (columns, rows, caption) => ({ kind: 'table', columns, rows, caption });
const para = (text) => ({ kind: 'text', text });
const empty = L('No record yet in this project.', 'Aucun enregistrement pour l\'instant dans ce projet.', 'لا يوجد سجل بعد في هذا المشروع.');
const H = {
  item: L('Item', 'Élément', 'البند'), category: L('Category', 'Catégorie', 'الفئة'), detail: L('Description and impact', 'Description et impact', 'الوصف والأثر'),
  relevance: L('Relevance', 'Pertinence', 'الأهمية'), source: L('Source / evidence', 'Source / preuve', 'المصدر / الدليل'), owner: L('Owner', 'Responsable', 'المسؤول'),
  status: L('Status', 'Statut', 'الحالة'), code: L('Code', 'Code', 'الرمز'), title: L('Title', 'Titre', 'العنوان'), date: L('Date', 'Date', 'التاريخ'),
  due: L('Due date', 'Échéance', 'تاريخ الاستحقاق'), target: L('Target', 'Cible', 'المستهدف'), value: L('Last value', 'Dernière valeur', 'آخر قيمة'),
  kpi: L('KPI', 'KPI', 'المؤشر'), score: L('Score', 'Note', 'الدرجة'), type: L('Type', 'Type', 'النوع'), version: L('Version', 'Version', 'الإصدار'),
  process: L('Macro process', 'Macro-processus', 'العملية الكلية'), phase: L('Phase', 'Phase', 'المرحلة'), needs: L('Needs and expectations', 'Besoins et attentes', 'الاحتياجات والتوقعات'),
  influence: L('Influence', 'Influence', 'النفوذ'), interest: L('Interest', 'Intérêt', 'الاهتمام'), impact: L('Impact (1–5)', 'Impact (1–5)', 'الأثر (1–5)'),
};

export function profileOf(org) {
  if (org.short_code === 'AT-UNI') return PROFILES.SME;
  return PROFILES[org.sector] || PROFILES.UNI;
}

// Placeholders of template text: {org} {product} {line} {city} {customer} {supplier} {standards} {date} {project} {phase}
export function fillText(t, vars) {
  if (!t) return t;
  const out = {};
  for (const l of ['en', 'fr', 'ar']) out[l] = (t[l] ?? t.en ?? '').replace(/\{(\w+)\}/g, (m, k) => { const v = vars[k]; if (v === undefined || v === null) return m; return typeof v === 'object' ? (v[l] ?? v.en) : String(v); });
  return out;
}

function context(projectId, extra = {}) {
  const p = get('SELECT * FROM projects WHERE id=?', projectId);
  const org = get('SELECT * FROM organizations WHERE id=?', p.org_id);
  const prof = profileOf(org);
  const standards = P(p.standards) || [];
  const vars = { org: P(org.name), product: prof.product, line: prof.line, city: prof.city, customer: prof.customer, supplier: prof.supplier, standards: standards.join(', '), project: P(p.name), date: new Date().toISOString().slice(0, 10), ...extra.vars };
  return { ...extra, p, org, prof, standards, vars, cat: catalog() };
}

const stepExec = (ctx, stepId) => get('SELECT * FROM step_exec WHERE project_id=? AND step_id=?', ctx.p.id, stepId);
const userName = (id) => (id ? get('SELECT name FROM users WHERE id=?', id)?.name || '' : '');
const cell = (v) => (v === null || v === undefined ? '' : v);

// Converts the "rows" field of a step into a table using the form definition.
function stepRowsTable(exec) {
  if (!exec) return null;
  const def = FORM_KINDS[exec.form_kind];
  const f = P(exec.fields) || {};
  const fd = def?.fields.find(x => ['rows', 'kpis'].includes(x.type) && Array.isArray(f[x.key]) && f[x.key].length);
  if (!fd) return null;
  const cols = fd.columns.map(c => col(c.key, c.label, c.type === 'textarea' ? 2 : 1));
  const rows = f[fd.key].map(r => Object.fromEntries(fd.columns.map(c => [c.key, fmtCell(r[c.key], c.type)])));
  return table(cols, rows);
}
function fmtCell(v, type) {
  if (v === null || v === undefined) return '';
  if (type === 'person') return userName(v);
  if (type === 'role') return roleName(v);
  if (type === 'select') return lab(v);
  if (type === 'obs') return Array.isArray(v) ? v.map(x => x.name || x).map(x => (typeof x === 'object' ? x : String(x))) : (v.name || v);
  if (Array.isArray(v)) return v;
  return v;
}

const SOURCES = {
  revisions: (ctx) => {
    if (!ctx.docId) return table([col('v', H.version), col('d', H.date), col('s', L('Change', 'Modification', 'التغيير'), 3), col('st', H.status)], [{ v: '1.0', d: ctx.vars.date, s: L('First issue', 'Première émission', 'الإصدار الأول'), st: lab('Draft') }]);
    const vs = all('SELECT version, status, summary, created_at FROM document_versions WHERE document_id=? ORDER BY created_at', ctx.docId);
    return table([col('v', H.version), col('d', H.date), col('s', L('Change', 'Modification', 'التغيير'), 3), col('st', H.status)], vs.map(v => ({ v: v.version, d: v.created_at.slice(0, 10), s: P(v.summary), st: lab(v.status) })));
  },
  policy_statement: (ctx) => {
    const ai = stepExec(ctx, 'MP-002.11'); const f = P(ai?.fields) || {};
    if (f.final) return para(f.final);
    const doc = get(`SELECT v.content FROM documents d JOIN document_versions v ON v.document_id=d.id WHERE d.project_id=? AND d.doc_type='Policy' AND v.status='Published' LIMIT 1`, ctx.p.id);
    const c = P(doc?.content);
    if (c && !c.sections) return para(c);
    return para(fillText(ctx.p.ms_type === 'QHSE' ? POLICY_I : POLICY_Q, ctx.vars));
  },
  policy_statement_env: (ctx) => para(fillText(L('{org} protects the environment, prevents pollution from {line}, fulfils its compliance obligations and continually improves its environmental performance.', '{org} protège l\'environnement, prévient la pollution liée à {line}, respecte ses obligations de conformité et améliore en continu sa performance environnementale.', 'تحمي {org} البيئة وتمنع التلوث الناتج عن {line} وتفي بالتزامات الامتثال وتحسّن أداءها البيئي باستمرار.'), ctx.vars)),
  policy_statement_ohs: (ctx) => para(fillText(L('{org} provides safe and healthy working conditions, eliminates hazards and reduces OH&S risks, fulfils legal requirements and consults and involves workers.', '{org} assure des conditions de travail sûres et saines, élimine les dangers et réduit les risques SST, respecte les exigences légales et consulte et fait participer les travailleurs.', 'توفر {org} ظروف عمل آمنة وصحية وتزيل المخاطر وتقلل مخاطر الصحة والسلامة المهنية وتفي بالمتطلبات القانونية وتستشير العاملين وتشركهم.'), ctx.vars)),
  policy_commitments: (ctx) => {
    const ex = stepExec(ctx, 'MP-002.3');
    const rows = (P(ex?.fields)?.items || []).filter(x => x.item);
    if (rows.length) return { kind: 'bullets', items: rows.map(r => r.item) };
    return { kind: 'bullets', items: (ctx.p.ms_type === 'QHSE' ? COMMIT_I : COMMIT_Q).map(x => fillText(x, ctx.vars)) };
  },
  scope: (ctx) => stepRowsTable(stepExec(ctx, 'MP-001.8')) || para(fillText(L('The management system of {org} covers the design and delivery of {product} at {city}.', 'Le système de management de {org} couvre la conception et la réalisation des {product} à {city}.', 'يشمل نظام إدارة {org} تصميم {product} وتقديمها في {city}.'), ctx.vars)),
  obs_units: (ctx) => {
    const nodes = all(`SELECT n.name, n.type, (SELECT COUNT(*) FROM obs_members m WHERE m.node_id=n.id) members FROM obs_nodes n WHERE n.org_id=? AND n.project_id IS NULL ORDER BY CASE n.type WHEN 'Organization' THEN 0 WHEN 'Site' THEN 1 ELSE 2 END, n.created_at`, ctx.org.id);
    return table([col('n', L('Unit', 'Unité', 'الوحدة'), 2), col('t', H.type), col('m', L('Members', 'Membres', 'الأعضاء'))], nodes.map(n => ({ n: P(n.name), t: lab(n.type), m: n.members })));
  },
  standards: (ctx) => table([col('s', L('Standard', 'Norme', 'المعيار'), 2), col('c', L('Certification target', 'Objectif de certification', 'هدف الاعتماد'))], ctx.standards.map(s => ({ s, c: /9001|14001|45001/.test(s) ? L('Yes', 'Oui', 'نعم') : L('Compliance', 'Conformité', 'امتثال') }))),
  processes: (ctx) => {
    const mps = all('SELECT mp_id, e2e_id, status, progress, owner_role FROM project_mps WHERE project_id=?', ctx.p.id);
    const order = (id) => ctx.cat.macroProcesses.findIndex(m => m.id === id);
    return table([col('e', H.phase), col('c', H.code), col('n', H.process, 3), col('o', H.owner, 2), col('s', H.status)], mps.sort((a, b) => a.e2e_id.localeCompare(b.e2e_id) || order(a.mp_id) - order(b.mp_id)).map(m => ({ e: m.e2e_id, c: ctx.cat.mpById[m.mp_id].code, n: ctx.cat.mpById[m.mp_id].name, o: roleName(m.owner_role), s: lab(m.status) })));
  },
  racsi: (ctx) => racsiTable(ctx, null),
  mp_racsi: (ctx) => racsiTable(ctx, ctx.mpId),
  documents: (ctx) => {
    const ds = all('SELECT code, title, doc_type, current_version, status, owner_role, next_review FROM documents WHERE project_id=? ORDER BY doc_type, code', ctx.p.id);
    return table([col('c', H.code, 2), col('t', H.title, 3), col('y', H.type), col('v', H.version), col('s', H.status), col('o', H.owner, 2), col('n', L('Next review', 'Prochaine revue', 'المراجعة التالية'))], ds.map(d => ({ c: d.code, t: P(d.title), y: lab(d.doc_type), v: d.current_version, s: lab(d.status), o: roleName(d.owner_role), n: d.next_review || '' })));
  },
  mandatory_matrix: (ctx) => {
    const have = new Set(all('SELECT template_id FROM documents WHERE project_id=?', ctx.p.id).map(x => x.template_id));
    const rows = [];
    for (const t of DOC_TEMPLATES) for (const [std, kind] of Object.entries(t.mandatory)) if (ctx.standards.includes(std)) rows.push({ s: std, c: t.clauses[std] || '', t: t.name, k: kind === 'maintain' ? L('Document to maintain', 'Document à tenir à jour', 'وثيقة يجب الاحتفاظ بها محدثة') : L('Record to retain', 'Enregistrement à conserver', 'سجل يجب الاحتفاظ به'), h: have.has(t.code) ? L('Available', 'Disponible', 'متوفرة') : L('Missing', 'Manquant', 'مفقودة') });
    return table([col('s', L('Standard', 'Norme', 'المعيار')), col('c', L('Clause', 'Article', 'البند')), col('t', H.title, 3), col('k', H.type, 2), col('h', H.status)], rows);
  },
  context_issues: (ctx) => registerTable(ctx, 'context', [col('t', H.item, 3), col('type', H.type), col('category', H.category), col('impact', H.impact)]),
  context_external: (ctx) => stepRowsTable(stepExec(ctx, 'MP-001.2')) || registerTable(ctx, 'context', [col('t', H.item, 3), col('category', H.category), col('impact', H.impact)], (x) => x.code.startsWith('CI-E')),
  context_internal: (ctx) => stepRowsTable(stepExec(ctx, 'MP-001.3')) || registerTable(ctx, 'context', [col('t', H.item, 3), col('category', H.category), col('impact', H.impact)], (x) => x.code.startsWith('CI-I')),
  parties: (ctx) => stepRowsTable(stepExec(ctx, 'MP-001.4')) || registerTable(ctx, 'parties', [col('t', H.item, 2), col('needs', H.needs, 3), col('influence', H.influence), col('interest', H.interest)]),
  objectives: (ctx) => {
    const list = all('SELECT code, title, data, status FROM registers WHERE project_id=? AND register=? ORDER BY code', ctx.p.id, 'objectives');
    return table([col('c', H.code), col('t', L('Objective', 'Objectif', 'الهدف'), 3), col('k', H.kpi), col('g', H.target), col('v', L('Current', 'Actuel', 'الحالي')), col('o', H.owner, 2), col('d', L('Deadline', 'Échéance', 'الموعد النهائي'), 1.4), col('s', H.status)],
      list.map(x => { const d = P(x.data) || {}; return { c: x.code, t: P(x.title), k: d.kpi || '', g: d.target || '', v: d.current ?? '', o: d.ownerUser ? userName(d.ownerUser) : roleName(d.owner), d: d.deadline || '', s: lab(x.status) }; }));
  },
  obligations: (ctx) => registerTable(ctx, 'obligations', [col('t', H.item, 3), col('type', H.type), col('evaluation', L('Compliance evaluation', 'Évaluation de conformité', 'تقييم الامتثال')), col('lastEvaluated', L('Evaluated on', 'Évalué le', 'تاريخ التقييم'))]),
  competence: (ctx) => registerTable(ctx, 'competence', [col('t', L('Competence', 'Compétence', 'الكفاءة'), 2), col('holder', L('Holder', 'Titulaire', 'الحائز'), 2), col('level', L('Level', 'Niveau', 'المستوى')), col('required', L('Required', 'Requis', 'المطلوب')), col('trainedOn', L('Trained on', 'Formé le', 'تاريخ التدريب'))]),
  calibration: (ctx) => registerTable(ctx, 'calibration', [col('t', L('Equipment', 'Équipement', 'المعدة'), 2), col('serial', L('Serial', 'N° de série', 'الرقم التسلسلي')), col('lastCalibration', L('Last calibration', 'Dernier étalonnage', 'آخر معايرة')), col('nextCalibration', L('Next calibration', 'Prochain étalonnage', 'المعايرة التالية')), col('status', H.status)]),
  suppliers: (ctx) => registerTable(ctx, 'suppliers', [col('t', L('Supplier', 'Fournisseur', 'المورد'), 3), col('score', H.score), col('lastEvaluation', L('Last evaluation', 'Dernière évaluation', 'آخر تقييم')), col('status', H.status)]),
  reviews: (ctx) => registerTable(ctx, 'reviews', [col('t', H.title, 2), col('date', H.date), col('attendees', L('Attendees', 'Participants', 'الحضور'), 3), col('outputs', L('Outputs', 'Éléments de sortie', 'المخرجات'), 3)]),
  incidents: (ctx) => registerTable(ctx, 'incidents', [col('t', L('Incident', 'Incident', 'الحادث'), 3), col('type', H.type), col('date', H.date), col('status', H.status)]),
  ideas: (ctx) => registerTable(ctx, 'ideas', [col('t', L('Idea', 'Idée', 'الفكرة'), 3), col('roi', L('ROI (%)', 'ROI (%)', 'العائد (%)')), col('effort', L('Effort', 'Effort', 'الجهد')), col('status', H.status)]),
  risks: (ctx) => riskTable(ctx, "kind='Risk'"),
  risks_top: (ctx) => riskTable(ctx, "kind='Risk' AND score>=12"),
  opportunities: (ctx) => riskTable(ctx, "kind='Opportunity'"),
  aspects: (ctx) => riskTable(ctx, "kind='Aspect'"),
  hazards: (ctx) => riskTable(ctx, "kind='Hazard'"),
  risk_scale: () => table([col('s', H.score), col('l', L('Likelihood', 'Probabilité', 'الاحتمالية'), 2), col('i', L('Impact', 'Impact', 'الأثر'), 2)], [
    { s: '1', l: L('Rare (once in 10 years)', 'Rare (une fois en 10 ans)', 'نادر (مرة كل 10 سنوات)'), i: L('Negligible', 'Négligeable', 'ضئيل') },
    { s: '2', l: L('Unlikely (once in 5 years)', 'Peu probable (une fois en 5 ans)', 'غير مرجح (مرة كل 5 سنوات)'), i: L('Minor: no customer impact', 'Mineur : pas d\'impact client', 'طفيف: دون أثر على العميل') },
    { s: '3', l: L('Possible (once a year)', 'Possible (une fois par an)', 'ممكن (مرة في السنة)'), i: L('Moderate: one customer affected', 'Modéré : un client touché', 'متوسط: عميل واحد متأثر') },
    { s: '4', l: L('Likely (every quarter)', 'Probable (chaque trimestre)', 'مرجح (كل ربع سنة)'), i: L('Major: several customers, legal', 'Majeur : plusieurs clients, légal', 'كبير: عدة عملاء، قانوني') },
    { s: '5', l: L('Almost certain (every month)', 'Quasi certain (chaque mois)', 'شبه مؤكد (كل شهر)'), i: L('Critical: loss of certificate or licence', 'Critique : perte du certificat ou de l\'autorisation', 'حرج: فقدان الشهادة أو الترخيص') },
  ], L('Score = likelihood × impact. 1–6 low, 8–12 medium, 15–25 high.', 'Note = probabilité × impact. 1–6 faible, 8–12 moyen, 15–25 élevé.', 'الدرجة = الاحتمالية × الأثر. 1–6 منخفضة، 8–12 متوسطة، 15–25 مرتفعة.')),
  kpis: (ctx) => {
    const ks = all(`SELECT k.id, k.code, k.name, k.target_text, k.direction, k.owner_role, k.mp_id, (SELECT value FROM kpi_values v WHERE v.kpi_id=k.id ORDER BY period DESC LIMIT 1) last FROM kpis k WHERE k.project_id=? ${ctx.mpId ? 'AND k.mp_id=?' : ''} ORDER BY k.code`, ...(ctx.mpId ? [ctx.p.id, ctx.mpId] : [ctx.p.id]));
    return table([col('c', H.code), col('n', H.kpi, 3), col('t', H.target), col('v', H.value), col('s', H.status), col('o', H.owner, 2)], ks.slice(0, 60).map(k => {
      const m = String(k.target_text || '').replace(',', '.').match(/(-?\d+(?:\.\d+)?)/); const t = m ? +m[1] : null;
      const ok = t === null || k.last === null ? null : k.direction === 'down' ? k.last <= t : k.last >= t;
      return { c: k.code, n: P(k.name), t: k.target_text || '', v: k.last ?? '', s: ok === null ? '' : ok ? L('On target', 'Dans la cible', 'ضمن المستهدف') : L('Off target', 'Hors cible', 'خارج المستهدف'), o: roleName(k.owner_role), _status: ok === null ? undefined : ok ? 3 : 0 };
    }), undefined);
  },
  mp_kpis: (ctx) => SOURCES.kpis(ctx),
  kpi_values: (ctx) => {
    const periods = all('SELECT DISTINCT v.period FROM kpi_values v JOIN kpis k ON k.id=v.kpi_id WHERE k.project_id=? ORDER BY v.period DESC LIMIT 6', ctx.p.id).map(x => x.period).reverse();
    const ks = all('SELECT id, code, name FROM kpis WHERE project_id=? ORDER BY code LIMIT 25', ctx.p.id);
    return table([col('c', H.code), col('n', H.kpi, 3), ...periods.map(p => col(p, p))], ks.map(k => ({ c: k.code, n: P(k.name), ...Object.fromEntries(all('SELECT period, value FROM kpi_values WHERE kpi_id=?', k.id).filter(v => periods.includes(v.period)).map(v => [v.period, v.value])) })));
  },
  actions_objectives: (ctx) => actionTable(ctx, "(a.source_type='objective' OR (a.source_type='step' AND a.source_id IN (SELECT id FROM step_exec WHERE project_id=a.project_id AND mp_id IN ('MP-003','MP-150'))))"),
  actions_corrective: (ctx) => actionTable(ctx, "a.kind IN ('Corrective','Containment','Preventive')"),
  actions_improvement: (ctx) => actionTable(ctx, "a.kind='Improvement'"),
  actions_review: (ctx) => actionTable(ctx, "a.source_type='step' AND a.kind='Review decision'"),
  ncs: (ctx) => ncTable(ctx, ''),
  ncs_major: (ctx) => ncTable(ctx, "AND criticality IN ('Major','Critical')"),
  audits: (ctx) => auditTable(ctx, ''),
  audits_done: (ctx) => auditTable(ctx, "AND status='Completed'"),
  findings: (ctx) => {
    const fs = all('SELECT a.code, f.type, f.clause, f.text, f.status FROM findings f JOIN audits a ON a.id=f.audit_id WHERE a.project_id=? ORDER BY a.planned_date', ctx.p.id);
    return table([col('a', L('Audit', 'Audit', 'التدقيق'), 2), col('t', H.type), col('c', L('Clause', 'Article', 'البند')), col('x', L('Finding', 'Constat', 'الملاحظة'), 4), col('s', H.status)], fs.map(f => ({ a: f.code, t: lab(f.type), c: f.clause, x: P(f.text), s: lab(f.status) })));
  },
  rex: (ctx) => {
    const xs = all('SELECT went_well, not_well, recommendation, category FROM rex WHERE project_id=? ORDER BY created_at DESC LIMIT 10', ctx.p.id);
    return table([col('c', H.category), col('w', L('What went well', 'Ce qui a bien fonctionné', 'ما نجح'), 2), col('n', L('What did not', 'Ce qui n\'a pas fonctionné', 'ما لم ينجح'), 2), col('r', L('Recommendation', 'Recommandation', 'التوصية'), 2)], xs.map(x => ({ c: lab(x.category), w: P(x.went_well), n: P(x.not_well), r: P(x.recommendation) })));
  },
  controls: (ctx) => {
    const cs = all('SELECT code, name, type, frequency, owner_role, effectiveness FROM controls WHERE org_id=? AND standard=? ORDER BY code LIMIT 40', ctx.org.id, 'ISO 9001');
    return table([col('c', H.code), col('n', L('Control', 'Contrôle', 'الضابط'), 3), col('t', H.type), col('f', L('Frequency', 'Fréquence', 'التكرار')), col('o', H.owner, 2), col('e', L('Effectiveness', 'Efficacité', 'الفعالية'))], cs.map(c => ({ c: c.code, n: P(c.name), t: c.type, f: lab(c.frequency), o: roleName(c.owner_role), e: lab(c.effectiveness) })));
  },
  rules: (ctx) => {
    const mps = new Set(all('SELECT mp_id FROM project_mps WHERE project_id=?', ctx.p.id).map(x => x.mp_id));
    const rs = ctx.cat.rules.filter(r => mps.has(r.mp)).slice(0, 40);
    return table([col('c', H.code), col('s', L('Step', 'Étape', 'الخطوة')), col('x', L('Condition', 'Condition', 'الشرط'), 3), col('a', L('Action', 'Action', 'الإجراء'), 2)], rs.map(r => ({ c: r.id, s: r.step, x: r.condition, a: r.action })));
  },
  changes: (ctx) => {
    const ex = all(`SELECT step_id, fields, completed_at, completed_by FROM step_exec WHERE project_id=? AND form_kind='update' AND status='Done' ORDER BY completed_at DESC LIMIT 60`, ctx.p.id);
    return table([col('d', H.date), col('s', L('Change (step)', 'Modification (étape)', 'التغيير (الخطوة)'), 2), col('c', L('What changed', 'Ce qui a changé', 'ما الذي تغير'), 3), col('r', L('Reason', 'Motif', 'السبب'), 2), col('b', L('Authorized by', 'Autorisé par', 'اعتمده'), 2)],
      ex.map(e => { const f = P(e.fields) || {}; return { d: (e.completed_at || '').slice(0, 10), s: ctx.cat.stepById[e.step_id]?.name, c: f.change || '', r: f.reason || '', b: userName(e.completed_by) }; }));
  },
  communications: (ctx) => {
    const ex = all(`SELECT step_id, fields FROM step_exec WHERE project_id=? AND form_kind='communicate' AND status='Done' ORDER BY completed_at`, ctx.p.id);
    const rows = [];
    for (const e of ex) for (const m of (P(e.fields)?.messages || [])) rows.push({ s: ctx.cat.stepById[e.step_id]?.name, a: fmtCell(m.audience, 'obs'), c: lab(m.channel), d: m.date || '', m: m.message || '', b: roleName(m.by) });
    return table([col('s', L('What (step)', 'Quoi (étape)', 'ماذا (الخطوة)'), 2), col('a', L('With whom', 'Avec qui', 'مع من'), 2), col('c', L('How', 'Comment', 'كيف')), col('d', L('When', 'Quand', 'متى')), col('m', L('Message', 'Message', 'الرسالة'), 3), col('b', L('Who', 'Qui', 'من'), 2)], rows.slice(0, 200));
  },
  training: (ctx) => {
    const ex = all(`SELECT step_id, fields, completed_at FROM step_exec WHERE project_id=? AND form_kind='train' AND status='Done' ORDER BY completed_at`, ctx.p.id);
    return table([col('s', L('Session', 'Session', 'الجلسة'), 3), col('d', H.date), col('p', L('Participants', 'Participants', 'المشاركون')), col('e', L('Effectiveness (%)', 'Efficacité (%)', 'الفعالية (%)'))], ex.map(e => { const f = P(e.fields) || {}; return { s: f.session || ctx.cat.stepById[e.step_id]?.name, d: f.date || e.completed_at?.slice(0, 10), p: f.participants ?? '', e: f.effectiveness ?? '' }; }));
  },
  mp_goal: (ctx) => { const m = ctx.cat.mpById[ctx.mpId]; return para({ en: `${m.goal.en}\n${m.trigger.en}\n${m.terminal.en}`, fr: `${m.goal.fr}\n${m.trigger.fr}\n${m.terminal.fr}`, ar: `${m.goal.ar}\n${m.trigger.ar}\n${m.terminal.ar}` }); },
  mp_sipoc: (ctx) => { const m = ctx.cat.mpById[ctx.mpId]; const s = m.sipoc; const n = Math.max(s.S.length, s.I.length, s.O.length, s.C.length); const rows = []; for (let i = 0; i < n; i++) rows.push({ S: s.S[i] || '', I: s.I[i] || '', P: s.P[i] ? ctx.cat.stepsByMp[m.id]?.[i]?.name || s.P[i] : '', O: s.O[i] || '', C: s.C[i] || '' }); return table(['S', 'I', 'P', 'O', 'C'].map(k => col(k, { S: L('Suppliers', 'Fournisseurs', 'الموردون'), I: L('Inputs', 'Entrées', 'المدخلات'), P: L('Process', 'Processus', 'العملية'), O: L('Outputs', 'Sorties', 'المخرجات'), C: L('Customers', 'Clients', 'العملاء') }[k])), rows); },
  mp_steps: (ctx) => {
    const ex = Object.fromEntries(all('SELECT step_id, status, completed_at FROM step_exec WHERE project_id=? AND mp_id=?', ctx.p.id, ctx.mpId).map(e => [e.step_id, e]));
    const tasks = Object.fromEntries((ctx.cat.tasksByMp[ctx.mpId] || []).map(t => [t.id, t.name]));
    return table([col('n', '#'), col('t', L('Task', 'Tâche', 'المهمة'), 2), col('s', L('Step', 'Étape', 'الخطوة'), 3), col('r', L('Role', 'Rôle', 'الدور'), 2), col('st', H.status)], (ctx.cat.stepsByMp[ctx.mpId] || []).map(s => ({ n: s.seq, t: tasks[s.task], s: s.name, r: s.roleName, st: lab(ex[s.id]?.status || 'Todo') })));
  },
  phase_racsi: (ctx) => racsiTable(ctx, null, ctx.e2e),
  phase_steps: (ctx) => {
    const ex = all('SELECT step_id, mp_id, status, assignee_role FROM step_exec WHERE project_id=? AND e2e_id=? ORDER BY seq', ctx.p.id, ctx.e2e);
    return table([col('m', H.process, 2), col('s', L('Step', 'Étape', 'الخطوة'), 3), col('r', L('Role', 'Rôle', 'الدور'), 2), col('st', H.status)], ex.slice(0, 250).map(e => ({ m: ctx.cat.mpById[e.mp_id].code, s: ctx.cat.stepById[e.step_id]?.name, r: roleName(e.assignee_role), st: lab(e.status) })));
  },
  phase_outputs: (ctx) => { const e = ctx.cat.e2eById[ctx.e2e]; const mps = all('SELECT mp_id FROM project_mps WHERE project_id=? AND e2e_id=?', ctx.p.id, ctx.e2e).map(x => ctx.cat.mpById[x.mp_id]); return { kind: 'bullets', items: [...new Map(mps.flatMap(m => m.sipoc.O.slice(0, 3)).map(o => [o.en, o])).values()].slice(0, 20).concat(e ? [] : []) }; },
  phase_kpis: (ctx) => { const mps = all('SELECT mp_id FROM project_mps WHERE project_id=? AND e2e_id=?', ctx.p.id, ctx.e2e).map(x => x.mp_id); const ks = all(`SELECT code, name, target_text FROM kpis WHERE project_id=? AND mp_id IN (${mps.map(() => '?').join(',') || "''"})`, ctx.p.id, ...mps); return table([col('c', H.code), col('n', H.kpi, 3), col('t', H.target)], ks.map(k => ({ c: k.code, n: P(k.name), t: k.target_text }))); },
};

function racsiTable(ctx, mpId, e2e) {
  const acts = all(`SELECT id, name, mp_id FROM racsi_activities WHERE project_id=? AND linked_type='mp' ${mpId ? 'AND mp_id=?' : ''} ${e2e ? 'AND e2e_id=?' : ''} ORDER BY e2e_id`, ctx.p.id, ...(mpId ? [mpId] : []), ...(e2e ? [e2e] : []));
  const rows = acts.map(a => {
    const as = all('SELECT letter, assignee FROM racsi_assignments WHERE activity_id=?', a.id);
    const pick = (l) => as.filter(x => x.letter === l).map(x => roleName(x.assignee));
    const join = (list) => { const o = {}; for (const lg of ['en', 'fr', 'ar']) o[lg] = list.map(x => (typeof x === 'object' ? x[lg] ?? x.en : x)).join(', '); return o; };
    return { m: `${ctx.cat.mpById[a.mp_id]?.code || ''} ${ctx.cat.mpById[a.mp_id]?.name.en || ''}`.trim() ? { en: `${ctx.cat.mpById[a.mp_id].code} ${ctx.cat.mpById[a.mp_id].name.en}`, fr: `${ctx.cat.mpById[a.mp_id].code} ${ctx.cat.mpById[a.mp_id].name.fr}`, ar: `${ctx.cat.mpById[a.mp_id].code} ${ctx.cat.mpById[a.mp_id].name.ar}` } : P(a.name), R: join(pick('R')), A: join(pick('A')), C: join(pick('C')), S: join(pick('S')), I: join(pick('I')) };
  });
  return table([col('m', H.process, 3), col('R', 'R'), col('A', 'A'), col('C', 'C'), col('S', 'S'), col('I', 'I')], rows, L('R Responsible · A Accountable (one only) · C Consulted · S Support · I Informed', 'R Réalise · A Approuve (un seul) · C Consulté · S Support · I Informé', 'R المنفذ · A المساءل (واحد فقط) · C المستشار · S الداعم · I المُبلَّغ'));
}
function registerTable(ctx, reg, cols, filter) {
  let list = all('SELECT code, title, data, status FROM registers WHERE project_id=? AND register=? ORDER BY code', ctx.p.id, reg);
  if (filter) list = list.filter(filter);
  return table(cols, list.map(x => { const d = P(x.data) || {}; const o = { t: P(x.title), status: lab(x.status) }; for (const c of cols) if (!(c.key in o)) { const v = d[c.key]; o[c.key] = Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? L('Yes', 'Oui', 'نعم') : L('No', 'Non', 'لا')) : cell(v); } return o; }));
}
function riskTable(ctx, where) {
  const rs = all(`SELECT code, title, category, likelihood, impact, score, residual, owner_role, status, treatment FROM risks WHERE project_id=? AND ${where} ORDER BY score DESC`, ctx.p.id);
  return table([col('c', H.code), col('t', L('Description', 'Description', 'الوصف'), 3), col('l', 'L'), col('i', 'I'), col('s', H.score), col('r', L('Residual', 'Résiduel', 'المتبقي')), col('tr', L('Treatment', 'Traitement', 'المعالجة')), col('o', H.owner, 2), col('st', H.status)],
    rs.map(x => ({ c: x.code, t: P(x.title), l: x.likelihood, i: x.impact, s: x.score, r: x.residual, tr: P(x.treatment) || '', o: roleName(x.owner_role), st: lab(x.status), _status: x.score >= 15 ? 0 : x.score >= 8 ? 1 : 3 })), undefined);
}
function actionTable(ctx, where) {
  const as = all(`SELECT a.title, a.kind, a.status, a.due_date, a.pct, u.name owner FROM actions a LEFT JOIN users u ON u.id=a.owner_user WHERE a.project_id=? AND ${where} ORDER BY a.due_date LIMIT 150`, ctx.p.id);
  return table([col('t', L('Action', 'Action', 'الإجراء'), 4), col('k', H.type), col('o', H.owner, 2), col('d', H.due), col('p', '%'), col('s', H.status)], as.map(a => ({ t: P(a.title), k: lab(a.kind), o: a.owner || '', d: a.due_date, p: a.pct, s: lab(a.status) })));
}
function ncTable(ctx, extra) {
  const ns = all(`SELECT code, title, source, criticality, stage, detected_at, closed_at, root_cause FROM ncs WHERE project_id=? ${extra} ORDER BY detected_at`, ctx.p.id);
  return table([col('c', H.code, 2), col('t', L('Nonconformity', 'Non-conformité', 'عدم المطابقة'), 3), col('s', L('Source', 'Source', 'المصدر')), col('k', L('Criticality', 'Criticité', 'الخطورة')), col('d', L('Detected', 'Détectée', 'تاريخ الاكتشاف')), col('r', L('Root cause', 'Cause racine', 'السبب الجذري'), 3), col('st', H.status)],
    ns.map(n => ({ c: n.code, t: P(n.title), s: lab(n.source), k: lab(n.criticality), d: n.detected_at, r: P(n.root_cause) || '', st: lab(n.stage) })));
}
function auditTable(ctx, extra) {
  const as = all(`SELECT a.code, a.type, a.standard, a.planned_date, a.status, u.name lead FROM audits a LEFT JOIN users u ON u.id=a.lead_user WHERE a.project_id=? ${extra} ORDER BY a.planned_date`, ctx.p.id);
  return table([col('c', H.code, 2), col('t', H.type), col('s', L('Criteria', 'Critères', 'المعايير'), 2), col('d', H.date), col('l', L('Lead auditor', 'Auditeur responsable', 'المدقق الرئيسي'), 2), col('st', H.status)], as.map(a => ({ c: a.code, t: lab(a.type), s: a.standard, d: a.planned_date, l: a.lead || '', st: lab(a.status) })));
}

const POLICY_Q = L('{org} provides {product} to {customer} from {city}. Top management commits to satisfy customer and applicable legal requirements, to set and review quality objectives, and to continually improve the quality management system ({standards}).', '{org} fournit des {product} aux {customer} depuis {city}. La direction s\'engage à satisfaire les exigences des clients et les exigences légales applicables, à fixer et revoir les objectifs qualité et à améliorer en continu le système de management de la qualité ({standards}).', 'تقدم {org} {product} إلى {customer} من {city}. تلتزم الإدارة العليا بتلبية متطلبات العملاء والمتطلبات القانونية المنطبقة، ووضع أهداف الجودة ومراجعتها، والتحسين المستمر لنظام إدارة الجودة ({standards}).');
const POLICY_I = L('{org} delivers compliant {product} while preventing injury and ill health, protecting the environment and preventing pollution. Top management commits to fulfil compliance obligations, to consult workers and to continually improve the integrated management system ({standards}).', '{org} fournit des {product} conformes tout en prévenant les traumatismes et pathologies, en protégeant l\'environnement et en prévenant la pollution. La direction s\'engage à respecter les obligations de conformité, à consulter les travailleurs et à améliorer en continu le système de management intégré ({standards}).', 'تقدم {org} {product} مطابقة مع منع الإصابات والأمراض المهنية وحماية البيئة ومنع التلوث. وتلتزم الإدارة العليا بالوفاء بالتزامات الامتثال واستشارة العاملين والتحسين المستمر لنظام الإدارة المتكامل ({standards}).');
const COMMIT_Q = [
  L('Satisfy the requirements of our customers and the applicable legal requirements.', 'Satisfaire les exigences de nos clients et les exigences légales applicables.', 'تلبية متطلبات عملائنا والمتطلبات القانونية المنطبقة.'),
  L('Set measurable quality objectives each year and review them at the management review.', 'Fixer chaque année des objectifs qualité mesurables et les revoir en revue de direction.', 'وضع أهداف جودة قابلة للقياس كل عام ومراجعتها في مراجعة الإدارة.'),
  L('Provide the competent people and the resources needed.', 'Fournir les personnes compétentes et les ressources nécessaires.', 'توفير الأشخاص الأكفاء والموارد اللازمة.'),
  L('Continually improve the quality management system.', 'Améliorer en continu le système de management de la qualité.', 'التحسين المستمر لنظام إدارة الجودة.'),
];
const COMMIT_I = [...COMMIT_Q,
  L('Prevent injury and ill health and provide safe working conditions.', 'Prévenir les traumatismes et pathologies et assurer des conditions de travail sûres.', 'منع الإصابات والأمراض المهنية وتوفير ظروف عمل آمنة.'),
  L('Protect the environment, including prevention of pollution.', 'Protéger l\'environnement, y compris la prévention de la pollution.', 'حماية البيئة بما في ذلك منع التلوث.'),
  L('Consult workers and their representatives and encourage their participation.', 'Consulter les travailleurs et leurs représentants et favoriser leur participation.', 'استشارة العاملين وممثليهم وتشجيع مشاركتهم.'),
];

// Builds the structured content of a document from its template and the project's data.
export function buildContent(projectId, templateCode, opts = {}) {
  const t = opts.template || templateByCode[templateCode];
  if (!t) return null;
  const cat = catalog();
  const extra = { docId: opts.docId || null, mpId: opts.mpId || t.mp, e2e: opts.e2e || null };
  const vars = {};
  if (extra.e2e) vars.phase = cat.e2eById[extra.e2e]?.name;
  if (extra.mpId && cat.mpById[extra.mpId]) vars.mp = cat.mpById[extra.mpId].name;
  const ctx = context(projectId, { ...extra, vars });
  const sections = t.sections.map(s => {
    const out = { key: s.key, type: s.type, title: fillText(s.title, ctx.vars) };
    if (s.type === 'text') out.text = fillText(s.text, ctx.vars);
    if (s.type === 'data' || s.type === 'step') {
      if (s.text) out.text = fillText(s.text, ctx.vars);
      const src = s.source || '';
      const [name, arg] = src.split(':');
      let block = null;
      try {
        if (name === 'step_rows') block = stepRowsTable(stepExec(ctx, arg));
        else if (name === 'step_matrix') block = matrixBlock(stepExec(ctx, arg));
        else if (name === 'step_review') block = reviewBlock(ctx, stepExec(ctx, arg));
        else if (SOURCES[name]) block = SOURCES[name](ctx);
      } catch (e) { block = para(L(`Data not available (${e.message}).`, `Données indisponibles (${e.message}).`, `البيانات غير متاحة (${e.message}).`)); }
      if (!block || (block.kind === 'table' && !block.rows.length) || (block.kind === 'bullets' && !block.items.length)) block = para(empty);
      out.block = block;
      out.source = src;
    }
    if (s.type === 'signature') out.block = signatureBlock(ctx, opts);
    return out;
  });
  return { format: 'structured', template: t.code, toc: !!t.toc, generatedAt: new Date().toISOString(), sections };
}

function matrixBlock(exec) {
  const f = P(exec?.fields) || {};
  if (!Array.isArray(f.matrix) || !f.matrix.length) return null;
  const rows = f.matrix.map(r => ({ c: r.criterion, w: r.weight, s: r.score, j: r.justification || '' }));
  rows.push({ c: L('Weighted score', 'Note pondérée', 'الدرجة المرجحة'), w: 100, s: f.score, j: f.rationale || '' });
  return table([col('c', L('Criterion', 'Critère', 'المعيار'), 3), col('w', L('Weight (%)', 'Poids (%)', 'الوزن (%)')), col('s', L('Score (1–5)', 'Note (1–5)', 'الدرجة (1–5)')), col('j', L('Justification', 'Justification', 'المبرر'), 4)], rows);
}
function reviewBlock(ctx, exec) {
  const f = P(exec?.fields) || {};
  if (!exec || exec.status !== 'Done') return null;
  const rows = [
    { k: L('Frequency', 'Fréquence', 'التكرار'), v: lab(f.frequency) }, { k: L('Review date', 'Date de revue', 'تاريخ المراجعة'), v: f.date || '' }, { k: L('Next review', 'Prochaine revue', 'المراجعة التالية'), v: f.nextDate || '' },
    { k: L('Chaired by', 'Présidée par', 'يرأسها'), v: roleName(f.chair) },
    ...(f.decisions || []).map(d => ({ k: L('Decision', 'Décision', 'القرار'), v: d.decision })),
  ];
  return table([col('k', L('Item', 'Élément', 'البند'), 1), col('v', L('Content', 'Contenu', 'المحتوى'), 3)], rows);
}
function signatureBlock(ctx, opts) {
  const owner = opts.ownerRole || 'ims_manager';
  const approver = opts.approverRole || 'top_management';
  const u = (role) => get('SELECT name FROM users WHERE org_id=? AND roles LIKE ? LIMIT 1', ctx.org.id, `%"${role}"%`)?.name || '';
  return table([col('r', L('Role', 'Rôle', 'الدور'), 2), col('n', L('Name', 'Nom', 'الاسم'), 2), col('d', H.date), col('s', L('Signature', 'Signature', 'التوقيع'), 2)], [
    { r: L('Prepared by', 'Rédigé par', 'أعده'), n: u('document_controller'), d: opts.date || '', s: '' },
    { r: L('Reviewed by', 'Vérifié par', 'راجعه'), n: u(owner), d: opts.date || '', s: '' },
    { r: L('Approved by', 'Approuvé par', 'اعتمده'), n: u(approver), d: opts.date || '', s: '' },
  ]);
}

// Render model (localized) for the document renderer.
export function documentModel(doc, version, lang, layout = {}) {
  const content = P(version.content);
  const org = get('SELECT name, short_code FROM organizations WHERE id=?', doc.org_id);
  const t = templateByCode[doc.template_id] || null;
  const tr = (v) => loc(v, lang) ?? '';
  const strCell = (v) => (Array.isArray(v) ? v.map(tr).join(', ') : tr(v));
  const sections = [];
  if (content && content.format === 'structured') {
    for (const s of content.sections) {
      const sec = { heading: tr(s.title) };
      const texts = [];
      if (s.text) texts.push(tr(s.text));
      const b = s.block;
      if (b?.kind === 'text') texts.push(tr(b.text));
      if (b?.kind === 'bullets') texts.push(b.items.map(i => `• ${tr(i)}`).join('\n'));
      if (texts.length) sec.text = texts.join('\n\n');
      if (b?.kind === 'table') sec.table = { columns: b.columns.map(c => ({ key: c.key, label: tr(c.label), width: c.width })), rows: b.rows.map(r => { const o = {}; for (const c of b.columns) o[c.key] = strCell(r[c.key]); if (r._status !== undefined) o._status = r._status; return o; }), caption: b.caption ? tr(b.caption) : undefined, statusKey: b.rows.some(r => r._status !== undefined) ? (b.columns.find(c => ['s', 'st'].includes(c.key))?.key) : undefined };
      sections.push(sec);
    }
  } else {
    sections.push({ heading: tr(L('Content', 'Contenu', 'المحتوى')), text: tr(content) || '' });
  }
  const V = { en: 'Version', fr: 'Version', ar: 'الإصدار' }[lang];
  const S = { en: 'Status', fr: 'Statut', ar: 'الحالة' }[lang];
  return {
    eyebrow: `${tr(P(org.name))} · ${doc.code}`,
    title: tr(P(doc.title)),
    subtitle: t ? tr(t.description) : '',
    meta: [[V, version.version], [S, tr(LABELS[version.status] || version.status)], [{ en: 'Standards', fr: 'Normes', ar: 'المعايير' }[lang], (P(doc.standards) || []).join(', ')], [{ en: 'Owner', fr: 'Responsable', ar: 'المسؤول' }[lang], tr(roleName(doc.owner_role))], [{ en: 'Next review', fr: 'Prochaine revue', ar: 'المراجعة التالية' }[lang], doc.next_review || '—']],
    toc: content?.format === 'structured' ? !!content.toc : false,
    cover: true,
    sections,
    footer: layout.footerText || `${tr(P(org.name))} · ${doc.code} v${version.version}`,
    generatedAt: new Date().toISOString().slice(0, 10),
    pageLabel: { en: 'Page', fr: 'Page', ar: 'صفحة' }[lang],
    tocLabel: { en: 'Contents', fr: 'Sommaire', ar: 'المحتويات' }[lang],
    summaryLabel: { en: 'Cover', fr: 'Page de garde', ar: 'الغلاف' }[lang],
    layout,
  };
}
