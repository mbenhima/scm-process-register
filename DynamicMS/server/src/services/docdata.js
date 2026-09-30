// Document generation: fills an IMS document template with the project's data (registers,
// risks, KPIs, audits, step values, RACSI, process design...) and turns it into a render model
// (PDF, DOCX, XLSX). Content is kept trilingual; localization happens when the model is rendered.
//
// A data source returns one block or a list of blocks:
//   text {text} · bullets {items, intro?} · table {columns, rows, caption?} · kv {rows: [[label, value]]}
//   sub {text} (sub-heading) · diagram {diagram: 'bpmn'|'pmap', spec, caption?}
import { all, get, P } from '../db.js';
import { catalog, loc } from '../catalog/store.js';
import { FORM_KINDS } from '../catalog/forms.js';
import { LABELS } from '../content/labels.js';
import { DOC_TEMPLATES, templateByCode } from '../content/templates.js';
import { PROFILES, COUNTRY_NAMES } from '../seed/profiles.js';
import { ROLES } from '../permissions.js';
import { bpmnSvgVertical, processMapSvg } from './diagram.js';
import { formFor, stepRule } from '../catalog/stepforms.js';

const L = (en, fr, ar) => ({ en, fr, ar });
const LANGS = ['en', 'fr', 'ar'];
const EXTRA = {
  Gap: L('Gap', 'Écart', 'فجوة'), Competent: L('Competent', 'Compétent', 'كفء'), 'Due soon': L('Due soon', 'Échéance proche', 'قريب الاستحقاق'), Released: L('Released', 'Libéré', 'تم الإفراج'),
  'On hold': L('On hold', 'En attente', 'معلق'), Reviewed: L('Reviewed', 'Revue', 'تمت المراجعة'), Done: L('Done', 'Fait', 'منجز'), Approved: L('Approved', 'Approuvé', 'معتمد'), Planned: L('Planned', 'Planifié', 'مخطط'),
  Completed: L('Completed', 'Terminé', 'مكتمل'), Valid: L('Valid', 'Valide', 'ساري'), Overdue: L('Overdue', 'En retard', 'متأخر'), Noted: L('Noted', 'Pris en compte', 'مسجل'), Closed: L('Closed', 'Clôturé', 'مغلق'), Open: L('Open', 'Ouvert', 'مفتوح'),
  Monthly: L('Monthly', 'Mensuelle', 'شهري'), Quarterly: L('Quarterly', 'Trimestrielle', 'ربع سنوي'), 'Semi-annual': L('Semi-annual', 'Semestrielle', 'نصف سنوي'), Annual: L('Annual', 'Annuelle', 'سنوي'),
  'Every 2 years': L('Every 2 years', 'Tous les 2 ans', 'كل سنتين'), 'Every 3 years': L('Every 3 years', 'Tous les 3 ans', 'كل 3 سنوات'), Custom: L('Custom', 'Personnalisée', 'مخصص'), 'Per event': L('Per event', 'À chaque événement', 'عند كل حدث'),
  Major: L('Major nonconformity', 'Non-conformité majeure', 'عدم مطابقة رئيسية'), Minor: L('Minor nonconformity', 'Non-conformité mineure', 'عدم مطابقة ثانوية'), Observation: L('Observation', 'Observation', 'ملاحظة'), OFI: L('Opportunity for improvement', 'Piste d\'amélioration', 'فرصة للتحسين'),
};
const lab = (code) => (code === null || code === undefined ? '' : typeof code === 'object' ? code : EXTRA[code] || LABELS[code] || { en: String(code), fr: String(code), ar: String(code) });
const roleName = (code) => ROLES.find(r => r.code === code)?.name || (code === 'system' ? L('DynamicMS Engine', 'Moteur DynamicMS', 'محرك DynamicMS') : code || '');
const col = (key, label, width = 1) => ({ key, label, width });
const table = (columns, rows, caption) => ({ kind: 'table', columns, rows, caption });
const para = (text) => ({ kind: 'text', text });
const bullets = (items, intro) => ({ kind: 'bullets', items, ...(intro ? { intro } : {}) });
const kv = (rows) => ({ kind: 'kv', rows: rows.filter(r => r && r[1] !== undefined) });
const sub = (text) => ({ kind: 'sub', text });
const YES = L('Yes', 'Oui', 'نعم'); const NO = L('No', 'Non', 'لا');
const yn = (b) => (b ? YES : NO);
const empty = L('No record yet in this project.', 'Aucun enregistrement pour l\'instant dans ce projet.', 'لا يوجد سجل بعد في هذا المشروع.');
// Joins trilingual (or plain) parts into one trilingual string.
const cat = (sep, ...parts) => { const o = {}; for (const l of LANGS) o[l] = parts.filter(p => p !== null && p !== undefined && p !== '').map(p => (typeof p === 'object' ? p[l] ?? p.en : String(p))).join(typeof sep === 'object' ? sep[l] : sep); return o; };
const H = {
  item: L('Item', 'Élément', 'البند'), category: L('Category', 'Catégorie', 'الفئة'), owner: L('Owner', 'Responsable', 'المسؤول'), status: L('Status', 'Statut', 'الحالة'),
  code: L('Ref.', 'Réf.', 'المرجع'), title: L('Title', 'Titre', 'العنوان'), date: L('Date', 'Date', 'التاريخ'), due: L('Due date', 'Échéance', 'تاريخ الاستحقاق'), target: L('Target', 'Cible', 'المستهدف'),
  kpi: L('Indicator', 'Indicateur', 'المؤشر'), score: L('Score', 'Note', 'الدرجة'), type: L('Type', 'Type', 'النوع'), version: L('Version', 'Version', 'الإصدار'), process: L('Process', 'Processus', 'العملية'),
  phase: L('Phase', 'Phase', 'المرحلة'), step: L('Step', 'Étape', 'الخطوة'), role: L('Role', 'Rôle', 'الدور'), frequency: L('Frequency', 'Fréquence', 'التكرار'), record: L('Record', 'Enregistrement', 'السجل'),
  action: L('Action', 'Action', 'الإجراء'), description: L('Description', 'Description', 'الوصف'), result: L('Result', 'Résultat', 'النتيجة'), evidence: L('Evidence', 'Preuve', 'الدليل'), comment: L('Comment', 'Commentaire', 'تعليق'),
  supplier: L('Supplier', 'Fournisseur', 'المورد'), customer: L('Customer', 'Client', 'العميل'), input: L('Input', 'Entrée', 'المدخل'), output: L('Output', 'Sortie', 'المخرج'), clause: L('Clause', 'Article', 'البند'),
  responsible: L('Responsible', 'Responsable', 'المسؤول'), value: L('Value', 'Valeur', 'القيمة'), total: L('Total', 'Total', 'المجموع'), name: L('Name', 'Nom', 'الاسم'), level: L('Level', 'Niveau', 'المستوى'),
};

export function profileOf(org) {
  if (org.short_code === 'AT-UNI') return PROFILES.SME;
  return PROFILES[org.sector] || PROFILES.UNI;
}

// Placeholders of template text: {org} {product} {line} {city} {customer} {supplier} {standards} {date} {project} {phase} {mp} {ceo} {year}
export function fillText(t, vars) {
  if (!t) return t;
  if (typeof t === 'string') t = { en: t, fr: t, ar: t };
  const out = {};
  for (const l of LANGS) out[l] = (t[l] ?? t.en ?? '').replace(/\{(\w+)\}/g, (m, k) => { const v = vars[k]; if (v === undefined || v === null) return m; return typeof v === 'object' ? (v[l] ?? v.en) : String(v); });
  return out;
}

function context(projectId, extra = {}) {
  const p = get('SELECT * FROM projects WHERE id=?', projectId);
  const org = get('SELECT * FROM organizations WHERE id=?', p.org_id);
  const prof = profileOf(org);
  const standards = P(p.standards) || [];
  const person = (role) => get('SELECT name FROM users WHERE org_id=? AND roles LIKE ? LIMIT 1', org.id, `%"${role}"%`)?.name || '';
  const vars = {
    org: P(org.name), product: prof.product, line: prof.line, city: prof.city, customer: prof.customer, supplier: prof.supplier, standards: standards.join(', '), project: P(p.name),
    date: extra.date || new Date().toISOString().slice(0, 10), year: (extra.date || new Date().toISOString()).slice(0, 4), ceo: person('top_management'), country: COUNTRY_NAMES?.[org.country] || org.country || '', ...extra.vars,
  };
  return { ...extra, p, org, prof, standards, vars, person, qhse: p.ms_type === 'QHSE', cat: catalog() };
}

const stepExec = (ctx, stepId) => get('SELECT * FROM step_exec WHERE project_id=? AND step_id=?', ctx.p.id, stepId);
const userName = (id) => (id ? get('SELECT name FROM users WHERE id=?', id)?.name || '' : '');
const cell = (v) => (v === null || v === undefined ? '' : v);
const regs = (ctx, name, filter) => { let list = all('SELECT id, code, title, data, status, created_at FROM registers WHERE project_id=? AND register=? ORDER BY code', ctx.p.id, name).map(x => ({ ...x, title: P(x.title), d: P(x.data) || {} })); if (filter) list = list.filter(filter); return list; };
const val = (v) => (v === null || v === undefined ? '' : Array.isArray(v) ? cat(', ', ...v) : typeof v === 'boolean' ? yn(v) : v);
const mpLabel = (ctx, id) => { const m = ctx.cat.mpById[id]; return m ? cat(' ', m.code, m.name) : id; };
const RAG = (ok) => (ok === null || ok === undefined ? undefined : ok ? 3 : 0);

// Interested parties: the register, or the rows typed in the "identify interested parties"
// step when the register has no entry yet.
const txtKey = (t) => String((t && typeof t === 'object' ? t.en ?? Object.values(t)[0] : t) || '').trim().toLowerCase();
function partiesOf(ctx) {
  const reg = regs(ctx, 'parties');
  if (reg.length) return reg;
  const ex = all("SELECT * FROM step_exec WHERE project_id=? AND form_kind='list'", ctx.p.id).find(e => stepRule(ctx.cat.stepById[e.step_id])?.id === 'parties' && (P(e.fields)?.items || []).length);
  return ex ? P(ex.fields).items.map((r, i) => ({ code: `IP-${i + 1}`, title: r.item, d: { needs: r.detail, category: r.category, influence: +r.influence || (r.priority === 'High' ? 4 : 3), interest: +r.interest || (r.priority === 'High' ? 4 : 3) } })) : [];
}
function needsOf(ctx) {
  const ex = all("SELECT fields FROM step_exec WHERE project_id=? AND form_kind='needs'", ctx.p.id).map(e => P(e.fields)?.needs || []).find(x => x.length);
  return ex || [];
}
const partyMatch = (need, title) => (need.parties || []).some(x => txtKey(x?.name ?? x) === txtKey(title));

// Converts the "rows" field of a step into a table using the form definition.
function stepRowsTable(exec) {
  if (!exec) return null;
  const def = formFor(catalog().stepById[exec.step_id], exec.form_kind);
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
  if (type === 'mp') { const m = typeof v === 'string' ? catalog().mpById[v] : null; return m ? cat(' ', m.code, m.name) : v; }
  if (type === 'parties') return Array.isArray(v) ? v.map(x => x?.name || x) : v;
  if (type === 'obs') return Array.isArray(v) ? v.map(x => x.name || x).map(x => (typeof x === 'object' ? x : String(x))) : (v.name || v);
  if (Array.isArray(v)) return v;
  return v;
}

// ---------------------------------------------------------------- Step-level SIPOC and BPMN
// Output of a step by form kind; the object of the step comes from its explicit name
// (verb + object), so every output reads like a deliverable.
const OUT_BY_KIND = {
  standards: L('Standards in scope confirmed', 'Normes du périmètre confirmées', 'تأكيد المعايير المشمولة'),
  periodicity: L('Review periodicity fixed', 'Périodicité de revue fixée', 'تحديد دورية المراجعة'),
  list: L('List with sources: {obj}', 'Liste sourcée : {obj}', 'قائمة موثقة المصدر: {obj}'),
  assess: L('Assessment matrix and score: {obj}', 'Matrice d\'évaluation et note : {obj}', 'مصفوفة التقييم والدرجة: {obj}'),
  decision: L('Decision record with criteria (Go / No-Go)', 'Décision tracée avec critères (Go / No-Go)', 'سجل القرار مع المعايير (متابعة / توقف)'),
  document: L('Draft document: {obj}', 'Projet de document : {obj}', 'مسودة وثيقة: {obj}'),
  communicate: L('Communication records: {obj}', 'Enregistrements de communication : {obj}', 'سجلات التواصل: {obj}'),
  train: L('Training record and attendance', 'Enregistrement de formation et présence', 'سجل التدريب والحضور'),
  monitor: L('KPI values and alerts', 'Valeurs des KPI et alertes', 'قيم المؤشرات والتنبيهات'),
  review: L('Review minutes and decisions', 'Compte rendu de revue et décisions', 'محضر المراجعة والقرارات'),
  plan: L('Action plan (actions created)', 'Plan d\'actions (actions créées)', 'خطة عمل (إجراءات منشأة)'),
  objectives: L('SMART objectives in the register', 'Objectifs SMART au registre', 'أهداف ذكية في السجل'),
  execute: L('Execution record: {obj}', 'Enregistrement d\'exécution : {obj}', 'سجل التنفيذ: {obj}'),
  update: L('Updated record: {obj}', 'Enregistrement mis à jour : {obj}', 'سجل محدث: {obj}'),
  close: L('Closure record: {obj}', 'Enregistrement de clôture : {obj}', 'سجل الإغلاق: {obj}'),
  service: L('Service record: {obj}', 'Enregistrement de service : {obj}', 'سجل الخدمة: {obj}'),
  assign: L('Owner and RACSI assigned', 'Responsable et RACSI attribués', 'تعيين المسؤول وRACSI'),
  configure: L('Settings configured: {obj}', 'Paramètres configurés : {obj}', 'إعدادات مهيأة: {obj}'),
  escalate: L('Escalation record', 'Enregistrement d\'escalade', 'سجل التصعيد'),
  ai: L('AI suggestion reviewed and accepted', 'Suggestion IA revue et acceptée', 'مراجعة اقتراح الذكاء الاصطناعي وقبوله'),
  needs: L('Needs and expectations mapped to the interested parties', 'Besoins et attentes rattachés aux parties intéressées', 'احتياجات وتوقعات مرتبطة بالأطراف المعنية'),
};
// The object of an explicit step name: the words after the verb ("Define or review the scope" -> "the scope").
const objectOf = (name) => { const o = {}; for (const l of LANGS) { let w = String(name?.[l] ?? '').split(' ').slice(1); while (w.length > 2 && ['or', 'and', 'ou', 'et', 'أو', 'و'].includes(w[0])) w = w.slice(2); o[l] = w.join(' ') || String(name?.[l] ?? ''); } return o; };
function stepSipoc(ctx, mpId) {
  const m = ctx.cat.mpById[mpId]; const steps = ctx.cat.stepsByMp[mpId] || [];
  const first = (arr) => (arr || []).slice(0, 2);
  return steps.map((s, i) => {
    const prev = steps[i - 1]; const next = steps[i + 1];
    const out = fillText(OUT_BY_KIND[s.formKind] || OUT_BY_KIND.execute, { obj: objectOf(s.name) });
    const prevOut = prev ? fillText(OUT_BY_KIND[prev.formKind] || OUT_BY_KIND.execute, { obj: objectOf(prev.name) }) : null;
    return {
      step: s, S: prev ? prev.roleName : cat(', ', ...first(m.sipoc.S)), I: prev ? prevOut : cat(', ', ...first(m.sipoc.I)),
      O: next ? out : cat('; ', out, ...first(m.sipoc.O)), C: next ? next.roleName : cat(', ', ...first(m.sipoc.C)), R: s.roleName,
    };
  });
}
const CHUNK = 8;
// BPMN of a macro process: one lane per role; start, steps, Go / No-Go gateway, end.
// Long flows are split into parts joined by link events (A, B...).
function mpBpmnBlocks(ctx, mpId) {
  const m = ctx.cat.mpById[mpId]; const steps = ctx.cat.stepsByMp[mpId] || [];
  if (!steps.length) return [];
  const laneOf = (s) => s.roleCode || 'x';
  const parts = []; for (let i = 0; i < steps.length; i += CHUNK) parts.push(steps.slice(i, i + CHUNK));
  const blocks = [];
  parts.forEach((part, pi) => {
    const last = pi === parts.length - 1;
    const laneIds = [...new Set([...part.map(laneOf), ...(last ? [m.ownerRoleCode || laneOf(part[part.length - 1])] : [])])];
    const lanes = laneIds.map(id => ({ id, name: roleName(id) || id }));
    const nodes = []; const flows = [];
    const firstLane = laneOf(part[0]);
    nodes.push(pi === 0 ? { id: 's', type: 'start', lane: firstLane, label: L('Trigger', 'Déclencheur', 'المُطلق') } : { id: 's', type: 'link', lane: firstLane, letter: String.fromCharCode(64 + pi) });
    let prevId = 's';
    part.forEach((s) => { nodes.push({ id: s.id, type: 'task', lane: laneOf(s), label: s.name, code: s.id }); flows.push({ from: prevId, to: s.id }); prevId = s.id; });
    if (last) {
      const owner = m.ownerRoleCode || laneOf(part[part.length - 1]);
      nodes.push({ id: 'g', type: 'gateway', lane: owner, label: L('Go / No-Go', 'Go / No-Go', 'متابعة / توقف') });
      nodes.push({ id: 'e', type: 'end', lane: owner, label: L('Outputs approved', 'Sorties approuvées', 'اعتماد المخرجات') });
      flows.push({ from: prevId, to: 'g' }, { from: 'g', to: 'e', label: L('Go', 'Go', 'متابعة') }, { from: 'g', to: prevId, label: L('No-Go', 'No-Go', 'توقف'), back: true });
    } else {
      nodes.push({ id: 'l', type: 'link', lane: laneOf(part[part.length - 1]), letter: String.fromCharCode(65 + pi) });
      flows.push({ from: prevId, to: 'l' });
    }
    blocks.push({ kind: 'diagram', diagram: 'bpmn', spec: { lanes, nodes, flows }, caption: parts.length > 1 ? cat(' ', mpLabel(ctx, mpId), L(`— part ${pi + 1} of ${parts.length}`, `— partie ${pi + 1} sur ${parts.length}`, `— الجزء ${pi + 1} من ${parts.length}`)) : cat(' ', mpLabel(ctx, mpId), L('— BPMN flow', '— logigramme BPMN', '— مخطط BPMN')) });
  });
  return blocks;
}
function phaseMps(ctx) {
  const order = (id) => ctx.cat.macroProcesses.findIndex(m => m.id === id);
  return all('SELECT mp_id, status, owner_role FROM project_mps WHERE project_id=? AND e2e_id=?', ctx.p.id, ctx.e2e).sort((a, b) => order(a.mp_id) - order(b.mp_id));
}
function phaseGate(ctx) {
  const gate = all('SELECT * FROM gate_defs WHERE (org_id=? OR org_id IS NULL) ORDER BY org_id IS NULL', ctx.org.id).find(g => g.code === `GATE-${ctx.e2e}`);
  return gate;
}

// ---------------------------------------------------------------- Policy
const AXES = {
  customer: { t: L('Meet the expectations of our customers', 'Répondre aux attentes de nos clients', 'تلبية توقعات عملائنا'), items: [L('Improve responsiveness to customer complaints (answer within 48 h)', 'Améliorer la réactivité aux réclamations clients (réponse sous 48 h)', 'تحسين سرعة الاستجابة لشكاوى العملاء (الرد خلال 48 ساعة)'), L('Improve the customer satisfaction barometer', 'Améliorer le baromètre de satisfaction client', 'تحسين مقياس رضا العملاء')], kpis: ['Q-KPI-01', 'Q-KPI-02'] },
  excellence: { t: L('Operational excellence, right first time', 'Excellence opérationnelle, bien du premier coup', 'التميز التشغيلي والصواب من المرة الأولى'), items: [L('Update and standardize workstations and work instructions', 'Mettre à jour et standardiser les postes et instructions de travail', 'تحديث مواقع العمل وتعليماته وتوحيدها'), L('Control our processes with control plans and calibrated equipment', 'Maîtriser nos processus par des plans de surveillance et des équipements étalonnés', 'ضبط عملياتنا بخطط الضبط والمعدات المعايرة')], kpis: ['Q-KPI-04'] },
  improvement: { t: L('Continual improvement', 'Amélioration continue', 'التحسين المستمر'), items: [L('Involve every team in the PDCA dynamic and develop personal leadership', 'Impliquer chaque équipe dans la dynamique PDCA et développer le leadership personnel', 'إشراك كل فريق في دينامية PDCA وتنمية القيادة الذاتية'), L('Treat root causes and verify the effectiveness of corrective actions', 'Traiter les causes racines et vérifier l\'efficacité des actions correctives', 'معالجة الأسباب الجذرية والتحقق من فعالية الإجراءات التصحيحية')], kpis: ['Q-KPI-05'] },
  people: { t: L('Develop our people and their competence', 'Développer nos collaborateurs et leurs compétences', 'تطوير موظفينا وكفاءاتهم'), items: [L('Preserve and develop organizational knowledge', 'Préserver et développer les connaissances organisationnelles', 'الحفاظ على المعرفة التنظيمية وتطويرها'), L('Plan careers and anticipate jobs and skills', 'Planifier les carrières et anticiper les emplois et compétences', 'تخطيط المسارات المهنية واستشراف الوظائف والكفاءات')], kpis: [] },
  compliance: { t: L('Meet applicable requirements', 'Satisfaire aux exigences applicables', 'الوفاء بالمتطلبات المنطبقة'), items: [L('Determine, monitor and review all applicable requirements (legal, customer, other)', 'Déterminer, surveiller et revoir l\'ensemble des exigences applicables (légales, clients, autres)', 'تحديد جميع المتطلبات المنطبقة (القانونية والعملاء وغيرها) ومراقبتها ومراجعتها'), L('Develop a culture of quality and integrity', 'Développer une culture de la qualité et de l\'intégrité', 'تنمية ثقافة الجودة والنزاهة')], kpis: [] },
  partners: { t: L('Grow with our suppliers and partners', 'Progresser avec nos fournisseurs et partenaires', 'النمو مع موردينا وشركائنا'), items: [L('Select and evaluate suppliers on quality, delivery and HSE', 'Sélectionner et évaluer les fournisseurs sur la qualité, les délais et le HSE', 'اختيار الموردين وتقييمهم على أساس الجودة والتسليم والسلامة'), L('Share scorecards and build development plans', 'Partager les évaluations et bâtir des plans de progrès', 'مشاركة بطاقات الأداء وبناء خطط التطوير')], kpis: [] },
  digital: { t: L('Modernize our tools and infrastructure', 'Moderniser nos outils et nos infrastructures', 'تحديث أدواتنا وبنيتنا التحتية'), items: [L('Digitize records and business reporting', 'Numériser les enregistrements et le reporting métier', 'رقمنة السجلات والتقارير'), L('Upgrade the premises, equipment and flows', 'Mettre à niveau les locaux, équipements et flux', 'تحديث المباني والمعدات والتدفقات')], kpis: [] },
  safety: { t: L('Protect the health and safety of our workers', 'Protéger la santé et la sécurité de nos collaborateurs', 'حماية صحة عاملينا وسلامتهم'), items: [L('Eliminate hazards and reduce OH&S risks following the hierarchy of controls', 'Éliminer les dangers et réduire les risques SST selon la hiérarchie des mesures', 'إزالة المخاطر وتقليل مخاطر الصحة والسلامة وفق تسلسل الضوابط'), L('Consult workers and their representatives and encourage their participation', 'Consulter les travailleurs et leurs représentants et favoriser leur participation', 'استشارة العاملين وممثليهم وتشجيع مشاركتهم')], kpis: ['H-KPI-01', 'H-KPI-02'] },
  environment: { t: L('Protect the environment', 'Protéger l\'environnement', 'حماية البيئة'), items: [L('Prevent pollution and reduce our significant environmental aspects', 'Prévenir la pollution et réduire nos aspects environnementaux significatifs', 'منع التلوث وتقليل جوانبنا البيئية الهامة'), L('Use energy and resources efficiently and recover waste', 'Utiliser l\'énergie et les ressources avec efficience et valoriser les déchets', 'استخدام الطاقة والموارد بكفاءة وتثمين النفايات')], kpis: ['H-KPI-03', 'H-KPI-04'] },
};
const AXES_BY = { Q: ['customer', 'excellence', 'improvement', 'people', 'compliance', 'partners', 'digital'], IMS: ['customer', 'safety', 'environment', 'excellence', 'improvement', 'people', 'compliance'], E: ['environment', 'compliance', 'improvement', 'people'], OHS: ['safety', 'compliance', 'improvement', 'people'] };
const SUBJECT = { Q: L('quality', 'qualité', 'الجودة'), IMS: L('quality, health, safety and environment', 'qualité, santé, sécurité et environnement', 'الجودة والصحة والسلامة والبيئة'), E: L('environmental', 'environnemental', 'البيئي'), OHS: L('occupational health and safety', 'santé et sécurité au travail', 'الصحة والسلامة المهنية') };

// ---------------------------------------------------------------- Sources
const SOURCES = {
  doc_identity: (ctx) => {
    const d = ctx.docId ? get('SELECT code, current_version, owner_role, review_frequency, next_review FROM documents WHERE id=?', ctx.docId) : null;
    return kv([
      [L('Reference', 'Référence', 'المرجع'), d?.code || '—'], [H.version, d?.current_version || '1.0'], [L('Owner', 'Responsable', 'المسؤول'), roleName(d?.owner_role || ctx.t?.owner)],
      [L('Applies to', 'S\'applique à', 'ينطبق على'), ctx.vars.org], [L('Standards', 'Normes', 'المعايير'), ctx.standards.join(', ')],
      [L('Review', 'Revue', 'المراجعة'), cat(' — ', lab(d?.review_frequency || ctx.t?.review), d?.next_review ? cat(' ', L('next', 'prochaine', 'التالية'), d.next_review) : '')],
    ]);
  },
  revisions: (ctx) => {
    const cols = [col('v', H.version), col('d', H.date), col('s', L('Change', 'Modification', 'التغيير'), 3), col('a', L('Approved by', 'Approuvé par', 'اعتمده'), 2), col('st', H.status)];
    if (!ctx.docId) return table(cols, [{ v: '1.0', d: ctx.vars.date, s: L('First issue', 'Première émission', 'الإصدار الأول'), a: '', st: lab('Draft') }]);
    const vs = all('SELECT version, status, summary, created_at, approver FROM document_versions WHERE document_id=? ORDER BY created_at', ctx.docId);
    return table(cols, vs.map(v => ({ v: v.version, d: v.created_at.slice(0, 10), s: P(v.summary), a: userName(v.approver), st: lab(v.status) })));
  },
  references: (ctx) => {
    const rows = ctx.standards.map(s => ({ r: s, t: L('Requirements of the standard', 'Exigences de la norme', 'متطلبات المعيار') }));
    rows.push({ r: `${ctx.org.short_code}-${ctx.p.ms_type}-MAN`, t: L('Management system manual', 'Manuel du système de management', 'دليل نظام الإدارة') }, { r: `${ctx.org.short_code}-${ctx.p.ms_type}-PMAP`, t: L('Process map and interactions', 'Cartographie des processus', 'خريطة العمليات') }, { r: `${ctx.org.short_code}-${ctx.p.ms_type}-DOCLIST`, t: L('Master list of documented information', 'Liste maîtresse des informations documentées', 'القائمة الرئيسية للمعلومات الموثقة') });
    return table([col('r', L('Reference', 'Référence', 'المرجع'), 2), col('t', H.title, 4)], rows);
  },
  definitions: () => table([col('t', L('Term', 'Terme', 'المصطلح'), 1.4), col('d', L('Definition', 'Définition', 'التعريف'), 4)], [
    { t: 'SIPOC', d: L('Suppliers, Inputs, Process, Outputs, Customers: the view of a step or process from what it receives to what it delivers.', 'Fournisseurs, Entrées, Processus, Sorties, Clients : vue d\'une étape ou d\'un processus de ce qu\'il reçoit à ce qu\'il livre.', 'الموردون والمدخلات والعملية والمخرجات والعملاء: رؤية الخطوة أو العملية مما تتلقاه إلى ما تسلمه.') },
    { t: 'RACSI', d: L('Responsible, Accountable (one only), Consulted, Support, Informed.', 'Réalise, Approuve (un seul), Consulté, Support, Informé.', 'المنفذ والمساءل (واحد فقط) والمستشار والداعم والمُبلَّغ.') },
    { t: 'BPMN', d: L('Business Process Model and Notation (ISO/IEC 19510): standard notation of the process flow.', 'Business Process Model and Notation (ISO/IEC 19510) : notation normalisée du déroulement.', 'نموذج العمليات وترميزها (ISO/IEC 19510): ترميز قياسي لسير العملية.') },
    { t: L('Gate / Go / No-Go', 'Jalon / Go / No-Go', 'البوابة / متابعة / توقف'), d: L('Decision point at the end of a phase: Go (proceed), No-Go (stop), Hold (wait for a condition) or Recycle (redo part of the phase).', 'Point de décision en fin de phase : Go (poursuivre), No-Go (arrêter), Hold (attendre une condition) ou Recycle (refaire une partie de la phase).', 'نقطة قرار في نهاية المرحلة: متابعة أو توقف أو تعليق (انتظار شرط) أو إعادة (إعادة جزء من المرحلة).') },
    { t: L('Documented information', 'Information documentée', 'المعلومات الموثقة'), d: L('Information to be controlled and maintained (document) or retained as evidence (record).', 'Information devant être maîtrisée et tenue à jour (document) ou conservée comme preuve (enregistrement).', 'معلومات يجب ضبطها وتحديثها (وثيقة) أو الاحتفاظ بها كدليل (سجل).') },
  ]),
  // Policy
  policy_vision: (ctx, v) => {
    const issues = regs(ctx, 'context', x => x.code.startsWith('CI-E')).slice(0, 2).map(x => x.title);
    return [
      para(fillText(L('Our vision is to be the reference provider of {product} for {customer}, recognized for reliability, responsiveness and the professionalism of our teams.', 'Notre vision est d\'être l\'acteur de référence des {product} pour les {customer}, reconnu pour sa fiabilité, sa réactivité et le professionnalisme de ses équipes.', 'رؤيتنا أن نكون المزوّد المرجعي لـ {product} لـ {customer}، المعروف بالموثوقية وسرعة الاستجابة واحترافية فرقه.'), ctx.vars)),
      para(fillText(cat(' ', L('Aware of the challenges of our context', 'Conscients des défis imposés par notre contexte', 'إدراكًا منا لتحديات سياقنا'), issues.length ? cat('', ' — ', cat('; ', ...issues), ' —') : '', L('and relying on the daily commitment of our women and men to meet the expectations of our customers, we have built our {subject} management system on {standards}.', 'et forts de l\'engagement quotidien de nos femmes et de nos hommes pour répondre aux attentes de nos clients, nous avons bâti notre système de management {subject} sur {standards}.', 'واعتمادًا على الالتزام اليومي لنسائنا ورجالنا بتلبية توقعات عملائنا، بنينا نظام إدارة {subject} الخاص بنا على {standards}.')), { ...ctx.vars, subject: SUBJECT[v] })),
    ];
  },
  policy_axes: (ctx, v) => {
    const objs = regs(ctx, 'objectives');
    const keys = AXES_BY[v] || AXES_BY.Q;
    const out = [para(fillText(L('We affirm this ambition through {n} strategic axes, each with measurable objectives reviewed every year:', 'Nous affirmons cette ambition à travers {n} axes stratégiques, chacun décliné en objectifs mesurables revus chaque année :', 'نؤكد هذا الطموح من خلال {n} محاور استراتيجية لكل منها أهداف قابلة للقياس تُراجع سنويًا:'), { n: keys.length }))];
    keys.forEach((k, i) => {
      const a = AXES[k];
      const linked = objs.filter(o => a.kpis.includes(o.d.kpi)).map(o => cat(' ', o.title, L('— target', '— cible', '— المستهدف'), o.d.target, L('by', 'd\'ici', 'بحلول'), o.d.deadline, `(${o.d.kpi})`));
      out.push(sub(cat(' ', L(`Axis ${i + 1} —`, `Axe ${i + 1} —`, `المحور ${i + 1} —`), a.t)));
      out.push(bullets([...a.items, ...linked]));
    });
    return out;
  },
  policy_commitments: (ctx, v) => {
    const q = [
      L('Satisfy the requirements of our customers and the applicable legal and other requirements;', 'Satisfaire les exigences de nos clients ainsi que les exigences légales et autres applicables ;', 'تلبية متطلبات عملائنا والمتطلبات القانونية وغيرها المنطبقة؛'),
      L('Provide the resources, competence and infrastructure needed for the management system to work;', 'Accorder les moyens, compétences et infrastructures nécessaires au bon fonctionnement du système de management ;', 'توفير الموارد والكفاءات والبنية التحتية اللازمة لسير نظام الإدارة؛'),
      fillText(L('Delegate to our management system manager, {ims}, the responsibility and authority for planning, running and monitoring the system and reporting on its performance;', 'Déléguer à notre responsable du système de management, {ims}, la responsabilité et l\'autorité de planifier, animer et contrôler le système et de rendre compte de sa performance ;', 'تفويض مسؤول نظام الإدارة، {ims}، بمسؤولية وصلاحية تخطيط النظام وتنشيطه ومراقبته ورفع التقارير عن أدائه؛'), { ims: ctx.person('ims_manager') || ctx.person('quality_manager') }),
      L('Set measurable objectives consistent with this policy and review them at each management review;', 'Fixer des objectifs mesurables cohérents avec cette politique et les revoir à chaque revue de direction ;', 'وضع أهداف قابلة للقياس متسقة مع هذه السياسة ومراجعتها في كل مراجعة للإدارة؛'),
      L('Continually improve the management system and its performance.', 'Améliorer en continu le système de management et sa performance.', 'التحسين المستمر لنظام الإدارة وأدائه.'),
    ];
    const hse = [
      L('Provide safe and healthy working conditions to prevent work-related injury and ill health, eliminate hazards and reduce OH&S risks;', 'Assurer des conditions de travail sûres et saines pour prévenir les traumatismes et pathologies liés au travail, éliminer les dangers et réduire les risques SST ;', 'توفير ظروف عمل آمنة وصحية لمنع الإصابات والأمراض المهنية وإزالة المخاطر وتقليل مخاطر الصحة والسلامة؛'),
      L('Protect the environment, including the prevention of pollution, and fulfil our compliance obligations;', 'Protéger l\'environnement, y compris par la prévention de la pollution, et respecter nos obligations de conformité ;', 'حماية البيئة بما في ذلك منع التلوث والوفاء بالتزامات الامتثال؛'),
      L('Consult workers and their representatives and encourage their participation.', 'Consulter les travailleurs et leurs représentants et favoriser leur participation.', 'استشارة العاملين وممثليهم وتشجيع مشاركتهم.'),
    ];
    const items = v === 'Q' ? q : v === 'E' ? [q[0], q[1], q[2], hse[1], q[3], q[4]] : v === 'OHS' ? [q[0], q[1], q[2], hse[0], hse[2], q[3], q[4]] : [q[0], q[1], q[2], hse[0], hse[1], hse[2], q[3], q[4]];
    return bullets(items, L('As chief executive, I commit to:', 'En tant que dirigeant, je prends l\'engagement de :', 'بصفتي الرئيس التنفيذي، ألتزم بما يلي:'));
  },
  policy_roles: (ctx, v) => [
    para(fillText(L('It is essential that every manager deploys the {subject} management system at all levels of the organization, in a spirit of listening, dialogue and continual improvement. Every employee contributes by applying the procedures, reporting any nonconformity, hazard or idea, and taking part in the improvement actions.', 'Il est essentiel que chaque manager veille au déploiement du système de management {subject} à tous les niveaux de l\'entreprise, dans un esprit d\'écoute, de dialogue et d\'amélioration continue. Chaque collaborateur y contribue en appliquant les procédures, en signalant toute non-conformité, tout danger ou toute idée, et en participant aux actions d\'amélioration.', 'من الضروري أن يحرص كل مدير على نشر نظام إدارة {subject} على جميع مستويات المؤسسة بروح الإصغاء والحوار والتحسين المستمر. ويساهم كل موظف بتطبيق الإجراءات والإبلاغ عن أي عدم مطابقة أو خطر أو فكرة والمشاركة في إجراءات التحسين.'), { subject: SUBJECT[v] })),
    para(L('Our management system drives our ambition; certification is only one step in a journey towards overall excellence. I count on the active participation of each of you so that together we build an efficient and sustainable company.', 'Notre système de management est le moteur de notre ambition ; la certification n\'est qu\'une étape d\'une démarche qui doit tendre vers l\'excellence globale. Je compte sur la participation active de chacune et de chacun afin que nous bâtissions ensemble une entreprise performante et pérenne.', 'نظام إدارتنا هو محرك طموحنا، والاعتماد ليس سوى مرحلة في مسار نحو التميز الشامل. وأعوّل على المشاركة الفاعلة لكل واحد منكم لنبني معًا مؤسسة ناجحة ومستدامة.')),
  ],
  policy_review: (ctx) => {
    const mr = regs(ctx, 'reviews').pop();
    return para(fillText(L('This policy is communicated to all staff at induction and by display, explained in team meetings, available to interested parties on request and on our website, and reviewed for continuing suitability at each management review (last review: {mr}).', 'Cette politique est communiquée à tout le personnel à l\'accueil et par affichage, expliquée en réunion d\'équipe, disponible pour les parties intéressées sur demande et sur notre site web, et revue pour s\'assurer qu\'elle reste appropriée à chaque revue de direction (dernière revue : {mr}).', 'تُبلَّغ هذه السياسة لجميع العاملين عند الاستقبال وعبر الملصقات، وتُشرح في اجتماعات الفرق، وتُتاح للأطراف المعنية عند الطلب وعلى موقعنا، وتُراجع لضمان ملاءمتها في كل مراجعة للإدارة (آخر مراجعة: {mr}).'), { mr: mr?.d.date || ctx.vars.date }));
  },
  policy_signature: (ctx) => kv([[H.name, ctx.vars.ceo], [L('Title', 'Fonction', 'الصفة'), L('Chief executive', 'Dirigeant', 'الرئيس التنفيذي')], [L('Place and date', 'Lieu et date', 'المكان والتاريخ'), cat(', ', ctx.vars.city, ctx.vars.date)], [L('Signature', 'Signature', 'التوقيع'), '______________________']]),
  // Scope and organization
  org_profile: (ctx) => {
    const n = get('SELECT COUNT(*) n FROM users WHERE org_id=?', ctx.org.id).n;
    const cert = regs(ctx, 'certificates');
    return kv([
      [L('Organization', 'Organisme', 'المؤسسة'), ctx.vars.org], [L('Activity', 'Activité', 'النشاط'), ctx.vars.product], [L('Main site', 'Site principal', 'الموقع الرئيسي'), ctx.vars.city],
      [L('Size', 'Taille', 'الحجم'), cat(' ', ctx.org.employees || n, L('employees', 'salariés', 'موظفًا'))], [L('Customers', 'Clients', 'العملاء'), ctx.vars.customer],
      [L('Management system', 'Système de management', 'نظام الإدارة'), cat(' — ', ctx.p.ms_type, ctx.standards.join(', '))],
      [L('Certification', 'Certification', 'الاعتماد'), cert.length ? cat('; ', ...cert.map(c => cat(' ', c.title, c.d.number || '', c.status === 'Valid' ? cat(' ', L('valid until', 'valide jusqu\'au', 'سارية حتى'), c.d.expiry) : lab(c.status)))) : L('Planned', 'Planifiée', 'مخطط')],
      [L('Management system manager', 'Responsable du système de management', 'مسؤول نظام الإدارة'), ctx.person('ims_manager')],
    ]);
  },
  scope_statement: (ctx) => {
    const t = stepRowsTable(stepExec(ctx, 'MP-001.8'));
    return [para(fillText(L('The management system of {org} applies to the design, planning and delivery of {product} for {customer}, carried out from {city}, including the support processes that enable them, in accordance with {standards}.', 'Le système de management de {org} s\'applique à la conception, la planification et la réalisation des {product} pour les {customer}, depuis {city}, y compris les processus de support qui les rendent possibles, conformément à {standards}.', 'ينطبق نظام إدارة {org} على تصميم {product} وتخطيطها وتقديمها لـ {customer} انطلاقًا من {city}، بما في ذلك عمليات الدعم التي تمكّنها، وفق {standards}.'), ctx.vars)), ...(t ? [t] : [])];
  },
  scope_summary: (ctx) => [...[SOURCES.scope_statement(ctx)].flat(), SOURCES.exclusions(ctx)],
  obs_units: (ctx) => {
    const nodes = all(`SELECT n.id, n.name, n.type, (SELECT COUNT(*) FROM obs_members m WHERE m.node_id=n.id) members FROM obs_nodes n WHERE n.org_id=? AND n.project_id IS NULL ORDER BY CASE n.type WHEN 'Organization' THEN 0 WHEN 'Site' THEN 1 ELSE 2 END, n.created_at`, ctx.org.id);
    return table([col('n', L('Unit', 'Unité', 'الوحدة'), 2), col('t', H.type), col('a', L('Activities in scope', 'Activités incluses', 'الأنشطة المشمولة'), 3), col('m', L('Members', 'Membres', 'الأعضاء'))], nodes.map(n => ({ n: P(n.name), t: lab(n.type), a: n.type === 'Site' || n.type === 'Organization' ? ctx.vars.product : L('Support activities', 'Activités de support', 'أنشطة الدعم'), m: n.members })));
  },
  products_services: (ctx) => table([col('p', L('Product or service', 'Produit ou service', 'المنتج أو الخدمة'), 3), col('c', H.customer, 2), col('r', L('Main requirements', 'Exigences principales', 'المتطلبات الرئيسية'), 3)], [
    { p: ctx.vars.product, c: ctx.vars.customer, r: L('Conformity to specification, on-time delivery, safety', 'Conformité à la spécification, respect des délais, sécurité', 'المطابقة للمواصفة والتسليم في الموعد والسلامة') },
    { p: L('After-sales service and warranty', 'Service après-vente et garantie', 'خدمة ما بعد البيع والضمان'), c: ctx.vars.customer, r: L('Response within 48 h; legal warranty', 'Réponse sous 48 h ; garantie légale', 'الرد خلال 48 ساعة؛ الضمان القانوني') },
    { p: L('Technical advice and quotation', 'Conseil technique et devis', 'الاستشارة الفنية وعرض الأسعار'), c: L('Prospects and customers', 'Prospects et clients', 'العملاء المحتملون والعملاء'), r: L('Accurate quote; requirements reviewed (§8.2.3)', 'Devis exact ; exigences revues (§8.2.3)', 'عرض دقيق؛ مراجعة المتطلبات (§8.2.3)') },
  ]),
  outsourced: (ctx) => table([col('p', L('Outsourced process or interface', 'Processus externalisé ou interface', 'العملية المسندة أو الواجهة'), 3), col('s', H.supplier, 2), col('c', L('How it is controlled', 'Mode de maîtrise', 'طريقة الضبط'), 3)], [
    { p: L('Calibration of measuring equipment', 'Étalonnage des équipements de mesure', 'معايرة معدات القياس'), s: L('Accredited laboratory', 'Laboratoire accrédité', 'مختبر معتمد'), c: L('ISO/IEC 17025 certificate checked at each calibration; supplier evaluation', 'Certificat ISO/IEC 17025 vérifié à chaque étalonnage ; évaluation fournisseur', 'التحقق من شهادة ISO/IEC 17025 في كل معايرة؛ تقييم المورد') },
    { p: L('Transport and logistics', 'Transport et logistique', 'النقل واللوجستيك'), s: L('Logistics provider', 'Prestataire logistique', 'مزوّد الخدمات اللوجستية'), c: L('Contract with service levels; quarterly scorecard', 'Contrat avec niveaux de service ; évaluation trimestrielle', 'عقد بمستويات خدمة؛ بطاقة أداء ربع سنوية') },
    { p: L('IT hosting of the management system application', 'Hébergement informatique de l\'application', 'استضافة تطبيق نظام الإدارة'), s: L('IT provider', 'Prestataire informatique', 'مزوّد تقنية المعلومات'), c: L('Backups daily; access rights reviewed twice a year', 'Sauvegardes quotidiennes ; droits d\'accès revus semestriellement', 'نسخ احتياطي يومي؛ مراجعة صلاحيات الوصول مرتين سنويًا') },
  ]),
  standards: (ctx) => table([col('s', L('Standard', 'Norme', 'المعيار'), 2), col('c', L('Certification target', 'Objectif de certification', 'هدف الاعتماد'))], ctx.standards.map(s => ({ s, c: /9001|14001|45001/.test(s) ? YES : L('Compliance', 'Conformité', 'امتثال') }))),
  exclusions: (ctx) => {
    const rows = [{ c: 'ISO 9001 §8.3', r: L('Design and development of products and services', 'Conception et développement des produits et services', 'تصميم المنتجات والخدمات وتطويرها'), a: ctx.org.size === 'SME' ? NO : YES, j: ctx.org.size === 'SME' ? L('Services are delivered to customer or manufacturer specifications; no design responsibility. The exclusion does not affect the ability to provide conforming services.', 'Les services sont réalisés selon les spécifications du client ou du fabricant ; aucune responsabilité de conception. L\'exclusion n\'affecte pas l\'aptitude à fournir des services conformes.', 'تُقدَّم الخدمات وفق مواصفات العميل أو الصانع دون مسؤولية تصميم. ولا يؤثر الاستبعاد على القدرة على تقديم خدمات مطابقة.') : L('Applicable', 'Applicable', 'منطبق') },
      { c: 'ISO 9001 §8.5.3', r: L('Property belonging to customers or external providers', 'Propriété des clients ou des prestataires externes', 'ممتلكات العملاء أو مقدمي الخدمات الخارجيين'), a: YES, j: L('Applicable: customer equipment is handled on site.', 'Applicable : les équipements des clients sont manipulés sur site.', 'منطبق: يتم التعامل مع معدات العملاء في الموقع.') },
      { c: 'ISO 9001 §7.1.5.2', r: L('Measurement traceability', 'Traçabilité de la mesure', 'تتبع القياس'), a: YES, j: L('Applicable: measurements are used to verify conformity.', 'Applicable : les mesures servent à vérifier la conformité.', 'منطبق: تُستخدم القياسات للتحقق من المطابقة.') }];
    return table([col('c', H.clause), col('r', L('Requirement', 'Exigence', 'المتطلب'), 2), col('a', L('Applicable', 'Applicable', 'منطبق')), col('j', L('Justification', 'Justification', 'المبرر'), 4)], rows);
  },
  processes: (ctx) => {
    const mps = all('SELECT mp_id, e2e_id, status, progress, owner_role FROM project_mps WHERE project_id=?', ctx.p.id);
    const order = (id) => ctx.cat.macroProcesses.findIndex(m => m.id === id);
    return table([col('e', H.phase), col('c', H.code), col('n', H.process, 3), col('o', H.owner, 2), col('s', H.status)], mps.sort((a, b) => a.e2e_id.localeCompare(b.e2e_id) || order(a.mp_id) - order(b.mp_id)).map(m => ({ e: m.e2e_id, c: ctx.cat.mpById[m.mp_id].code, n: ctx.cat.mpById[m.mp_id].name, o: roleName(m.owner_role), s: lab(m.status) })));
  },
  process_list: (ctx) => {
    const mps = all('SELECT mp_id, e2e_id, owner_role FROM project_mps WHERE project_id=?', ctx.p.id);
    const kp = {}; for (const k of all('SELECT code, mp_id FROM kpis WHERE project_id=?', ctx.p.id)) (kp[k.mp_id] ||= []).push(k.code);
    return table([col('c', H.code), col('n', H.process, 3), col('t', H.type), col('o', H.owner, 2), col('g', L('Purpose', 'Finalité', 'الغاية'), 3), col('k', L('Indicators', 'Indicateurs', 'المؤشرات'))], mps.map(x => { const m = ctx.cat.mpById[x.mp_id]; return { c: m.code, n: m.name, t: procType(m), o: roleName(x.owner_role), g: m.goal, k: (kp[x.mp_id] || []).slice(0, 3).join(', ') }; }));
  },
  pmap_diagram: (ctx) => {
    const mps = all('SELECT mp_id, e2e_id FROM project_mps WHERE project_id=?', ctx.p.id).map(x => ctx.cat.mpById[x.mp_id]);
    const group = (k) => mps.filter(m => procKind(m) === k).map(m => m.name).slice(0, 12);
    const spec = { left: L('Requirements of customers and interested parties', 'Exigences des clients et des parties intéressées', 'متطلبات العملاء والأطراف المعنية'), right: L('Satisfaction and conforming products and services', 'Satisfaction et produits et services conformes', 'الرضا ومنتجات وخدمات مطابقة'),
      groups: [{ name: L('Management processes', 'Processus de management', 'العمليات الإدارية'), items: group('M') }, { name: L('Core (realization) processes', 'Processus de réalisation', 'العمليات الأساسية'), items: group('C') }, { name: L('Support processes', 'Processus de support', 'العمليات الداعمة'), items: group('S') }] };
    return [{ kind: 'diagram', diagram: 'pmap', spec, caption: L('Process map: management, core and support processes and their interactions.', 'Cartographie : processus de management, de réalisation et de support et leurs interactions.', 'خريطة العمليات: العمليات الإدارية والأساسية والداعمة وتفاعلاتها.') }];
  },
  // Manual chapters
  context_summary: (ctx) => [para(L('The external and internal issues and the interested parties are analysed once a year and when a significant change occurs. The full analysis is recorded in the context report; the main issues are:', 'Les enjeux externes et internes et les parties intéressées sont analysés une fois par an et lors de tout changement significatif. L\'analyse complète figure dans le rapport de contexte ; les principaux enjeux sont :', 'تُحلَّل القضايا الخارجية والداخلية والأطراف المعنية مرة في السنة وعند أي تغيير مهم. ويرد التحليل الكامل في تقرير السياق؛ وأهم القضايا:')), bullets(regs(ctx, 'context').slice(0, 6).map(x => cat(' — ', x.title, x.d.type))), SOURCES.parties_full(ctx)],
  leadership_summary: (ctx) => [para(fillText(L('Top management demonstrates leadership by taking accountability for the effectiveness of the system, establishing the policy and objectives, integrating the requirements into business processes, promoting the process approach and risk-based thinking, providing resources and chairing the management review. The policy is signed by {ceo}.', 'La direction démontre son leadership en assumant la responsabilité de l\'efficacité du système, en établissant la politique et les objectifs, en intégrant les exigences dans les processus métier, en promouvant l\'approche processus et l\'approche par les risques, en fournissant les ressources et en présidant la revue de direction. La politique est signée par {ceo}.', 'تُظهر الإدارة العليا قيادتها بتحمل المساءلة عن فعالية النظام ووضع السياسة والأهداف ودمج المتطلبات في العمليات وتعزيز نهج العمليات والتفكير القائم على المخاطر وتوفير الموارد وترؤس مراجعة الإدارة. السياسة موقعة من {ceo}.'), ctx.vars)), bullets(AXES_BY[ctx.qhse ? 'IMS' : 'Q'].map(k => AXES[k].t), L('Strategic axes of the policy:', 'Axes stratégiques de la politique :', 'المحاور الاستراتيجية للسياسة:'))],
  planning_summary: (ctx) => [para(L('Risks and opportunities are identified per process and scored likelihood × impact (1–25); risks of 12 or more need a treatment plan. Objectives are SMART, linked to the policy axes and followed monthly.', 'Les risques et opportunités sont identifiés par processus et cotés probabilité × impact (1–25) ; les risques de 12 ou plus exigent un plan de traitement. Les objectifs sont SMART, reliés aux axes de la politique et suivis mensuellement.', 'تُحدَّد المخاطر والفرص لكل عملية وتُقيَّم بالاحتمالية × الأثر (1–25)؛ وتتطلب المخاطر بدرجة 12 فأكثر خطة معالجة. والأهداف ذكية ومرتبطة بمحاور السياسة وتُتابع شهريًا.')), SOURCES.risks_top(ctx), SOURCES.objectives_full(ctx)],
  support_summary: (ctx) => {
    const eq = regs(ctx, 'calibration'); const cmp = regs(ctx, 'competence'); const tr = regs(ctx, 'training');
    return [kv([
      [L('Resources and infrastructure (§7.1)', 'Ressources et infrastructures (§7.1)', 'الموارد والبنية التحتية (§7.1)'), L('Budgeted each year at the management review; maintenance plan for equipment and IT.', 'Budgétées chaque année en revue de direction ; plan de maintenance des équipements et de l\'informatique.', 'تُرصد سنويًا في مراجعة الإدارة؛ خطة صيانة للمعدات وتقنية المعلومات.')],
      [L('Measuring equipment (§7.1.5)', 'Équipements de mesure (§7.1.5)', 'معدات القياس (§7.1.5)'), cat(' ', eq.length, L('items in the register;', 'équipements au registre ;', 'معدة في السجل؛'), eq.filter(e => e.status === 'Valid').length, L('valid', 'valides', 'سارية'))],
      [L('Competence and awareness (§7.2, §7.3)', 'Compétences et sensibilisation (§7.2, §7.3)', 'الكفاءة والتوعية (§7.2، §7.3)'), cat(' ', cmp.length, L('competences required;', 'compétences requises ;', 'كفاءة مطلوبة؛'), cmp.filter(c => c.status === 'Gap').length, L('gaps with actions;', 'écarts avec actions ;', 'فجوات مع إجراءات؛'), tr.length, L('training sessions', 'sessions de formation', 'دورة تدريبية'))],
      [L('Communication (§7.4)', 'Communication (§7.4)', 'التواصل (§7.4)'), L('Communication plan: what, with whom, how, when and who; records kept.', 'Plan de communication : quoi, avec qui, comment, quand et qui ; enregistrements conservés.', 'خطة التواصل: ماذا ومع من وكيف ومتى ومن؛ مع حفظ السجلات.')],
      [L('Documented information (§7.5)', 'Informations documentées (§7.5)', 'المعلومات الموثقة (§7.5)'), L('Four levels (manual, procedures, instructions, records) controlled in the application: approval by a second person, versions, distribution and retention.', 'Quatre niveaux (manuel, procédures, instructions, enregistrements) maîtrisés dans l\'application : approbation par une seconde personne, versions, diffusion et conservation.', 'أربعة مستويات (الدليل، الإجراءات، التعليمات، السجلات) مضبوطة في التطبيق: اعتماد من شخص ثانٍ والإصدارات والتوزيع والاحتفاظ.')],
    ])];
  },
  operation_summary: (ctx) => [para(fillText(L('Operations of {line} are planned and controlled through the control plan, the review of customer requirements before commitment, the control of external providers, the release of products and services by authorized people, and the control of nonconforming outputs.', 'Les opérations de {line} sont planifiées et maîtrisées par le plan de surveillance, la revue des exigences client avant engagement, la maîtrise des prestataires externes, la libération des produits et services par des personnes autorisées et la maîtrise des éléments non conformes.', 'تُخطَّط عمليات {line} وتُضبط من خلال خطة الضبط ومراجعة متطلبات العملاء قبل الالتزام وضبط مقدمي الخدمات الخارجيين والإفراج عن المنتجات والخدمات من أشخاص مخولين وضبط المخرجات غير المطابقة.'), ctx.vars)), SOURCES.controlplan(ctx)],
  performance_summary: (ctx) => { const s = kpiStats(ctx); return [kv([[L('Indicators monitored', 'Indicateurs suivis', 'المؤشرات المتابعة'), s.total], [L('On target', 'Dans la cible', 'ضمن المستهدف'), `${s.on} (${s.pct} %)`], [L('Internal audits carried out', 'Audits internes réalisés', 'التدقيقات الداخلية المنفذة'), all("SELECT COUNT(*) n FROM audits WHERE project_id=? AND status='Completed'", ctx.p.id)[0].n], [L('Management reviews held', 'Revues de direction tenues', 'مراجعات الإدارة المنعقدة'), regs(ctx, 'reviews').length]])]; },
  improvement_summary: (ctx) => { const n = all('SELECT stage FROM ncs WHERE project_id=?', ctx.p.id); return [kv([[L('Nonconformities recorded', 'Non-conformités enregistrées', 'حالات عدم المطابقة المسجلة'), n.length], [L('Closed', 'Clôturées', 'المغلقة'), n.filter(x => x.stage === 'Closed').length], [L('Improvement ideas', 'Idées d\'amélioration', 'أفكار التحسين'), regs(ctx, 'ideas').length]]), para(L('Nonconformities are corrected, analysed for root cause, treated by corrective actions and verified by a person other than the action owner. Improvement ideas are prioritized by expected return.', 'Les non-conformités sont corrigées, analysées pour la cause racine, traitées par des actions correctives et vérifiées par une personne autre que le porteur de l\'action. Les idées d\'amélioration sont priorisées selon le gain attendu.', 'تُصحَّح حالات عدم المطابقة ويُحلَّل سببها الجذري وتُعالج بإجراءات تصحيحية ويتحقق منها شخص غير صاحب الإجراء. وتُرتَّب أفكار التحسين حسب العائد المتوقع.'))]; },
  clause_matrix: (ctx) => {
    const code = (s) => `${ctx.org.short_code}-${ctx.p.ms_type}-${s}`;
    const rows = [
      ['4.1–4.2', L('Context and interested parties', 'Contexte et parties intéressées', 'السياق والأطراف المعنية'), 'MP-001', code('CTX')], ['4.3', L('Scope', 'Périmètre', 'النطاق'), 'MP-001', code('SCOPE')], ['4.4', L('Processes', 'Processus', 'العمليات'), 'MP-004', code('PMAP')],
      ['5.2', L('Policy', 'Politique', 'السياسة'), 'MP-002', code(ctx.qhse ? 'POL-IMS' : 'POL-Q')], ['5.3', L('Roles and responsibilities', 'Rôles et responsabilités', 'الأدوار والمسؤوليات'), 'MP-004', code('RACSI')], ['6.1', L('Risks and opportunities', 'Risques et opportunités', 'المخاطر والفرص'), 'MP-012', code('REG-RISK')],
      ['6.2', L('Objectives', 'Objectifs', 'الأهداف'), 'MP-003', code('OBJ')], ['6.3', L('Planning of changes', 'Planification des modifications', 'تخطيط التغييرات'), 'MP-036', code('CHANGE')], ['7.1.5', L('Measuring equipment', 'Équipements de mesure', 'معدات القياس'), 'MP-025', code('CAL')],
      ['7.2–7.3', L('Competence and awareness', 'Compétences et sensibilisation', 'الكفاءة والتوعية'), 'MP-013', code('COMP')], ['7.4', L('Communication', 'Communication', 'التواصل'), 'MP-014', code('COMM')], ['7.5', L('Documented information', 'Informations documentées', 'المعلومات الموثقة'), 'MP-029', code('DOCLIST')],
      ['8.1', L('Operational planning and control', 'Planification et maîtrise opérationnelles', 'التخطيط والضبط التشغيلي'), 'MP-007', code('CTRL')], ['8.2.3', L('Review of requirements', 'Revue des exigences', 'مراجعة المتطلبات'), 'MP-001', code('REQ')], ['8.4', L('External providers', 'Prestataires externes', 'مقدمو الخدمات الخارجيون'), 'MP-024', code('SUP')],
      ['8.6', L('Release', 'Libération', 'الإفراج'), 'MP-007', code('RELEASE')], ['8.7', L('Nonconforming outputs', 'Éléments non conformes', 'المخرجات غير المطابقة'), 'MP-018', code('NCO')], ['9.1', L('Monitoring and measurement', 'Surveillance et mesure', 'المراقبة والقياس'), 'MP-009', code('KPI')],
      ['9.2', L('Internal audit', 'Audit interne', 'التدقيق الداخلي'), 'MP-039', code('AUDPRG')], ['9.3', L('Management review', 'Revue de direction', 'مراجعة الإدارة'), 'MP-034', code('MR')], ['10.2', L('Nonconformity and corrective action', 'Non-conformité et action corrective', 'عدم المطابقة والإجراء التصحيحي'), 'MP-021', code('NC')], ['10.3', L('Continual improvement', 'Amélioration continue', 'التحسين المستمر'), 'MP-023', code('IMP')],
    ];
    return table([col('c', H.clause), col('r', L('Requirement', 'Exigence', 'المتطلب'), 2.4), col('p', H.process, 2.4), col('d', L('Document', 'Document', 'الوثيقة'), 2)], rows.map(([c, r, p, d]) => ({ c, r, p: mpLabel(ctx, p), d })));
  },
  // Context
  context_method: () => kv([
    [L('External issues', 'Enjeux externes', 'القضايا الخارجية'), L('PESTLE: political, economic, social, technological, legal, environmental.', 'PESTEL : politique, économique, social, technologique, légal, environnemental.', 'PESTLE: السياسي والاقتصادي والاجتماعي والتقني والقانوني والبيئي.')],
    [L('Internal issues', 'Enjeux internes', 'القضايا الداخلية'), L('Values, culture, knowledge, performance, resources, organization.', 'Valeurs, culture, connaissances, performance, ressources, organisation.', 'القيم والثقافة والمعرفة والأداء والموارد والتنظيم.')],
    [L('Interested parties', 'Parties intéressées', 'الأطراف المعنية'), L('Needs and expectations; influence and interest scored 1–5; priority = influence × interest.', 'Besoins et attentes ; influence et intérêt cotés 1–5 ; priorité = influence × intérêt.', 'الاحتياجات والتوقعات؛ النفوذ والاهتمام من 1 إلى 5؛ الأولوية = النفوذ × الاهتمام.')],
    [L('Frequency', 'Fréquence', 'التكرار'), L('Once a year before the management review and at any significant change.', 'Une fois par an avant la revue de direction et à tout changement significatif.', 'مرة في السنة قبل مراجعة الإدارة وعند أي تغيير مهم.')],
  ]),
  pestle: (ctx) => {
    const rows = stepRowsTable(stepExec(ctx, 'MP-001.2'));
    const reg = regs(ctx, 'context', x => x.code.startsWith('CI-E')).map(x => ({ f: x.d.category, i: x.title, t: x.d.impact >= 4 ? L('Risk', 'Risque', 'خطر') : L('Opportunity', 'Opportunité', 'فرصة'), m: x.d.impact, tr: x.d.impact >= 4 ? L('Rising', 'En hausse', 'متزايد') : L('Stable', 'Stable', 'مستقر') }));
    const out = [];
    if (reg.length) out.push(table([col('f', L('Factor', 'Facteur', 'العامل')), col('i', L('Issue', 'Enjeu', 'القضية'), 4), col('t', L('Risk / opportunity', 'Risque / opportunité', 'خطر / فرصة')), col('m', L('Impact (1–5)', 'Impact (1–5)', 'الأثر (1–5)')), col('tr', L('Trend', 'Tendance', 'الاتجاه'))], reg));
    if (rows) out.push(rows);
    return out.length ? out : null;
  },
  context_internal: (ctx) => stepRowsTable(stepExec(ctx, 'MP-001.3')) || table([col('t', L('Issue', 'Enjeu', 'القضية'), 4), col('category', H.category), col('impact', L('Impact (1–5)', 'Impact (1–5)', 'الأثر (1–5)'))], regs(ctx, 'context', x => x.code.startsWith('CI-I')).map(x => ({ t: x.title, category: x.d.category, impact: x.d.impact }))),
  swot: (ctx) => {
    const ext = regs(ctx, 'context', x => x.code.startsWith('CI-E')); const int = regs(ctx, 'context', x => x.code.startsWith('CI-I'));
    const strengths = [L('Certified management system and documented processes', 'Système de management certifié et processus documentés', 'نظام إدارة معتمد وعمليات موثقة'), L('Skilled and committed teams', 'Équipes qualifiées et engagées', 'فرق مؤهلة وملتزمة'), L('Close relationship with customers', 'Proximité avec les clients', 'قرب من العملاء')];
    const opp = [...ext.filter(x => x.d.impact < 4).map(x => x.title), ...regs(ctx, 'ideas').slice(0, 2).map(x => x.title)];
    return table([col('a', L('Strengths', 'Forces', 'نقاط القوة'), 2), col('b', L('Weaknesses', 'Faiblesses', 'نقاط الضعف'), 2), col('c', L('Opportunities', 'Opportunités', 'الفرص'), 2), col('d', L('Threats', 'Menaces', 'التهديدات'), 2)], [{ a: cat('\n', ...strengths), b: cat('\n', ...int.map(x => x.title)), c: cat('\n', ...opp), d: cat('\n', ...ext.filter(x => x.d.impact >= 4).map(x => x.title)) }]);
  },
  parties_full: (ctx) => {
    const list = partiesOf(ctx);
    if (!list.length) return null;
    const needs = needsOf(ctx);
    const obl = new Set(['IP-1', 'IP-3']);
    return table([col('c', H.code), col('t', L('Interested party', 'Partie intéressée', 'الطرف المعني'), 2), col('k', L('Internal / external', 'Interne / externe', 'داخلي / خارجي')), col('n', L('Needs and expectations', 'Besoins et attentes', 'الاحتياجات والتوقعات'), 3), col('o', L('Compliance obligation', 'Obligation de conformité', 'التزام امتثال')), col('i', L('Influence', 'Influence', 'النفوذ')), col('r', L('Interest', 'Intérêt', 'الاهتمام')), col('p', L('Priority', 'Priorité', 'الأولوية')), col('m', L('How monitored', 'Mode de surveillance', 'طريقة المراقبة'), 2)],
      list.map(x => { const pr = (x.d.influence || 0) * (x.d.interest || 0); const mine = needs.filter(r => partyMatch(r, x.title)); return { c: x.code, t: x.title, k: x.d.category || (x.code === 'IP-2' ? L('Internal', 'Interne', 'داخلي') : L('External', 'Externe', 'خارجي')), n: mine.length ? cat('\n', ...mine.map(r => r.need)) : x.d.needs, o: yn(mine.length ? mine.some(r => r.obligation === 'Yes') : obl.has(x.code)), i: x.d.influence, r: x.d.interest, p: pr, m: x.code === 'IP-1' ? L('Survey and complaints', 'Enquête et réclamations', 'الاستبيان والشكاوى') : x.code === 'IP-3' ? L('Regulatory watch', 'Veille réglementaire', 'الرصد التنظيمي') : L('Meetings and feedback', 'Réunions et retours', 'الاجتماعات والملاحظات'), _cells: { p: pr >= 16 ? 0 : pr >= 9 ? 1 : 3 } }; }),
      L('Priority = influence × interest: 16 or more manage closely, 9–15 keep satisfied, below 9 keep informed.', 'Priorité = influence × intérêt : 16 et plus gérer étroitement, 9–15 satisfaire, moins de 9 informer.', 'الأولوية = النفوذ × الاهتمام: 16 فأكثر إدارة عن قرب، 9–15 إرضاء، أقل من 9 إعلام.'));
  },
  // Needs and expectations mapped to the interested parties (many-to-many).
  needs_parties: (ctx) => {
    const list = needsOf(ctx);
    if (!list.length) return null;
    return table([col('n', L('Need or expectation', 'Besoin ou attente', 'الحاجة أو التوقع'), 3), col('p', L('Interested parties', 'Parties intéressées', 'الأطراف المعنية'), 2), col('t', L('Type', 'Type', 'النوع')), col('o', L('Compliance obligation', 'Obligation de conformité', 'التزام امتثال')), col('r', L('How addressed', 'Réponse de l\'organisme', 'طريقة المعالجة'), 2)],
      list.map(r => ({ n: r.need, p: cat(', ', ...(r.parties || []).map(x => x?.name || x)), t: r.type, o: r.obligation ? lab(r.obligation) : '', r: r.response })));
  },
  power_grid: (ctx) => {
    const list = partiesOf(ctx);
    if (!list.length) return null;
    const q = (hiI, hiR) => cat('\n', ...list.filter(x => (x.d.influence >= 4) === hiI && (x.d.interest >= 4) === hiR).map(x => x.title));
    return table([col('k', ''), col('a', L('Low interest', 'Intérêt faible', 'اهتمام منخفض'), 2), col('b', L('High interest', 'Intérêt fort', 'اهتمام مرتفع'), 2)], [
      { k: L('High influence', 'Influence forte', 'نفوذ مرتفع'), a: cat('\n', L('Keep satisfied:', 'Satisfaire :', 'إرضاء:'), q(true, false)), b: cat('\n', L('Manage closely:', 'Gérer étroitement :', 'إدارة عن قرب:'), q(true, true)) },
      { k: L('Low influence', 'Influence faible', 'نفوذ منخفض'), a: cat('\n', L('Monitor:', 'Surveiller :', 'مراقبة:'), q(false, false)), b: cat('\n', L('Keep informed:', 'Informer :', 'إعلام:'), q(false, true)) },
    ]);
  },
  context_conclusions: (ctx) => [para(L('The issues and requirements above lead to the following risks and opportunities, recorded in the risk register with their treatment:', 'Les enjeux et exigences ci-dessus conduisent aux risques et opportunités suivants, enregistrés au registre des risques avec leur traitement :', 'تؤدي القضايا والمتطلبات أعلاه إلى المخاطر والفرص التالية المسجلة في سجل المخاطر مع معالجتها:')), SOURCES.risks_top(ctx), SOURCES.opportunities_full(ctx)],
  // Risks
  risk_summary: (ctx) => { const rs = all("SELECT score FROM risks WHERE project_id=? AND kind='Risk'", ctx.p.id); return kv([[L('Risks', 'Risques', 'المخاطر'), rs.length], [L('High (15–25)', 'Élevés (15–25)', 'مرتفعة (15–25)'), rs.filter(x => x.score >= 15).length], [L('Medium (8–12)', 'Moyens (8–12)', 'متوسطة (8–12)'), rs.filter(x => x.score >= 8 && x.score < 15).length], [L('Low (1–6)', 'Faibles (1–6)', 'منخفضة (1–6)'), rs.filter(x => x.score < 8).length], [L('Opportunities', 'Opportunités', 'الفرص'), all("SELECT COUNT(*) n FROM risks WHERE project_id=? AND kind='Opportunity'", ctx.p.id)[0].n]]); },
  risks_full: (ctx) => riskTable(ctx, "kind='Risk'", true),
  risks: (ctx) => riskTable(ctx, "kind='Risk'"),
  risks_top: (ctx) => riskTable(ctx, "kind='Risk' AND score>=12"),
  opportunities: (ctx) => riskTable(ctx, "kind='Opportunity'"),
  opportunities_full: (ctx) => {
    const rs = all("SELECT code, title, likelihood, impact, owner_role, status FROM risks WHERE project_id=? AND kind='Opportunity' ORDER BY likelihood*impact DESC", ctx.p.id);
    return table([col('c', H.code), col('t', L('Opportunity', 'Opportunité', 'الفرصة'), 3), col('b', L('Benefit (1–5)', 'Bénéfice (1–5)', 'المنفعة (1–5)')), col('f', L('Feasibility (1–5)', 'Faisabilité (1–5)', 'الجدوى (1–5)')), col('a', L('Action to pursue it', 'Action pour la saisir', 'إجراء لاغتنامها'), 3), col('o', H.owner, 2), col('s', H.status)], rs.map(x => ({ c: x.code, t: P(x.title), b: x.impact, f: x.likelihood, a: L('Business case and pilot; decision at the management review', 'Étude d\'opportunité et pilote ; décision en revue de direction', 'دراسة جدوى وتجربة؛ القرار في مراجعة الإدارة'), o: roleName(x.owner_role), s: lab(x.status) })));
  },
  aspects: (ctx) => riskTable(ctx, "kind='Aspect'"),
  hazards: (ctx) => riskTable(ctx, "kind='Hazard'"),
  heatmap: (ctx) => {
    const rs = all("SELECT likelihood l, impact i FROM risks WHERE project_id=? AND kind='Risk'", ctx.p.id);
    const rows = [5, 4, 3, 2, 1].map(l => { const o = { l: cat(' ', L('Likelihood', 'Probabilité', 'الاحتمالية'), l) }; const c = {}; for (let i = 1; i <= 5; i++) { o[`i${i}`] = rs.filter(x => x.l === l && x.i === i).length || ''; c[`i${i}`] = l * i >= 15 ? 0 : l * i >= 8 ? 1 : 3; } o._cells = c; return o; });
    return table([col('l', '', 1.4), ...[1, 2, 3, 4, 5].map(i => col(`i${i}`, cat(' ', L('Impact', 'Impact', 'الأثر'), i)))], rows);
  },
  risk_scale: () => table([col('s', H.score), col('l', L('Likelihood', 'Probabilité', 'الاحتمالية'), 2), col('i', L('Impact', 'Impact', 'الأثر'), 2)], [
    { s: '1', l: L('Rare (once in 10 years)', 'Rare (une fois en 10 ans)', 'نادر (مرة كل 10 سنوات)'), i: L('Negligible', 'Négligeable', 'ضئيل') },
    { s: '2', l: L('Unlikely (once in 5 years)', 'Peu probable (une fois en 5 ans)', 'غير مرجح (مرة كل 5 سنوات)'), i: L('Minor: no customer impact', 'Mineur : pas d\'impact client', 'طفيف: دون أثر على العميل') },
    { s: '3', l: L('Possible (once a year)', 'Possible (une fois par an)', 'ممكن (مرة في السنة)'), i: L('Moderate: one customer affected', 'Modéré : un client touché', 'متوسط: عميل واحد متأثر') },
    { s: '4', l: L('Likely (every quarter)', 'Probable (chaque trimestre)', 'مرجح (كل ربع سنة)'), i: L('Major: several customers, legal', 'Majeur : plusieurs clients, légal', 'كبير: عدة عملاء، قانوني') },
    { s: '5', l: L('Almost certain (every month)', 'Quasi certain (chaque mois)', 'شبه مؤكد (كل شهر)'), i: L('Critical: loss of certificate or licence', 'Critique : perte du certificat ou de l\'autorisation', 'حرج: فقدان الشهادة أو الترخيص') },
  ], L('Score = likelihood × impact. 1–6 low (accept and monitor), 8–12 medium (treat within 6 months), 15–25 high (treat now; top management informed).', 'Note = probabilité × impact. 1–6 faible (accepter et surveiller), 8–12 moyen (traiter sous 6 mois), 15–25 élevé (traiter immédiatement ; direction informée).', 'الدرجة = الاحتمالية × الأثر. 1–6 منخفضة (قبول ومراقبة)، 8–12 متوسطة (معالجة خلال 6 أشهر)، 15–25 مرتفعة (معالجة فورية مع إبلاغ الإدارة).')),
  // Objectives
  objectives_summary: (ctx) => { const o = regs(ctx, 'objectives'); return kv([[L('Objectives', 'Objectifs', 'الأهداف'), o.length], [L('On track', 'En bonne voie', 'على المسار'), o.filter(x => x.status === 'On track').length], [L('At risk', 'À risque', 'معرضة للخطر'), o.filter(x => x.status === 'At risk').length]]); },
  objectives: (ctx) => SOURCES.objectives_full(ctx),
  objectives_full: (ctx) => table([col('c', H.code), col('t', L('Objective', 'Objectif', 'الهدف'), 3), col('a', L('Policy axis', 'Axe de la politique', 'محور السياسة'), 2), col('k', H.kpi), col('b', L('Baseline', 'Référence', 'خط الأساس')), col('g', H.target), col('v', L('Current', 'Actuel', 'الحالي')), col('d', L('Deadline', 'Échéance', 'الموعد النهائي'), 1.4), col('o', H.owner, 2), col('r', L('Resources', 'Ressources', 'الموارد'), 2), col('s', H.status)],
    regs(ctx, 'objectives').map(x => ({ c: x.code, t: x.title, a: x.d.relevance || '', k: x.d.kpi || '', b: x.d.baseline || '', g: x.d.target || '', v: x.d.current ?? '', d: x.d.deadline || '', o: x.d.ownerUser ? userName(x.d.ownerUser) : roleName(x.d.owner), r: x.d.resources || '', s: lab(x.status), _status: x.status === 'On track' ? 3 : 1 })),
    L('Evaluation: monthly KPI value against target; status reviewed quarterly and at the management review.', 'Évaluation : valeur mensuelle du KPI par rapport à la cible ; statut revu trimestriellement et en revue de direction.', 'التقييم: القيمة الشهرية للمؤشر مقابل المستهدف؛ مراجعة الحالة كل ربع سنة وفي مراجعة الإدارة.')),
  // Compliance obligations
  obligations: (ctx) => SOURCES.obligations_full(ctx),
  obligations_full: (ctx) => table([col('c', H.code), col('t', L('Obligation', 'Obligation', 'الالتزام'), 2.4), col('y', H.type), col('a', L('Source / authority', 'Source / autorité', 'المصدر / الجهة'), 1.6), col('r', L('Reference', 'Référence', 'المرجع'), 1.6), col('p', L('Applies to', 'S\'applique à', 'ينطبق على'), 1.6), col('q', L('Requirement', 'Exigence', 'المتطلب'), 2.6), col('h', L('How complied', 'Mode de conformité', 'طريقة الامتثال'), 2.4), col('o', H.owner, 1.6), col('f', H.frequency), col('l', L('Last evaluated', 'Dernière évaluation', 'آخر تقييم'), 1.3), col('e', L('Evaluation', 'Évaluation', 'التقييم'), 1.3), col('n', L('Next', 'Prochaine', 'التالي'), 1.3)],
    regs(ctx, 'obligations').map(x => ({ c: x.code, t: x.title, y: x.d.type, a: x.d.authority || '', r: x.d.reference || '', p: x.d.applicability || '', q: x.d.requirement || '', h: x.d.compliance || '', o: roleName(x.d.owner), f: x.d.frequencyMonths ? cat(' ', x.d.frequencyMonths, L('months', 'mois', 'شهرًا')) : '', l: x.d.lastEvaluated || '', e: x.d.evaluation, n: x.d.nextEvaluation || '', _cells: { e: /Partial|Partiel|جزئي/.test(x.d.evaluation?.en || '') ? 1 : /Non-/.test(x.d.evaluation?.en || '') ? 0 : 3 } }))),
  obligations_summary: (ctx) => { const o = regs(ctx, 'obligations'); const c = (re) => o.filter(x => re.test(x.d.evaluation?.en || '')).length; return kv([[L('Obligations identified', 'Obligations identifiées', 'الالتزامات المحددة'), o.length], [L('Compliant', 'Conformes', 'مطابقة'), c(/^Compliant/)], [L('Partially compliant', 'Partiellement conformes', 'مطابقة جزئيًا'), c(/Partially/)], [L('Non-compliant', 'Non conformes', 'غير مطابقة'), c(/Non-/)], [L('Method', 'Méthode', 'المنهجية'), L('Evaluated by the owner at the stated frequency with evidence; results reported to the management review.', 'Évaluées par le responsable à la fréquence prévue avec preuves ; résultats présentés en revue de direction.', 'يقيّمها المسؤول بالتكرار المحدد مع الأدلة؛ وتُعرض النتائج في مراجعة الإدارة.')]]); },
  obligations_actions: (ctx) => table([col('c', H.code), col('t', L('Obligation', 'Obligation', 'الالتزام'), 3), col('a', H.action, 3), col('o', H.owner, 2)], regs(ctx, 'obligations', x => x.d.action).map(x => ({ c: x.code, t: x.title, a: x.d.action, o: roleName(x.d.owner) }))),
  // Process sheet and procedure
  mp_header: (ctx) => { const m = ctx.cat.mpById[ctx.mpId]; return kv([[H.process, mpLabel(ctx, m.id)], [L('Type', 'Type', 'النوع'), procType(m)], [L('Process owner', 'Pilote', 'مالك العملية'), m.ownerRoleName], [L('Purpose', 'Finalité', 'الغاية'), m.goal], [L('Trigger', 'Déclencheur', 'المُطلق'), m.trigger], [L('End', 'Fin', 'النهاية'), m.terminal], [L('Standards and clauses', 'Normes et articles', 'المعايير والبنود'), typeof m.clauses === 'string' ? m.clauses : Array.isArray(m.clauses) ? m.clauses.join(', ') : (m.standards || []).join(', ')], [L('Phase', 'Phase', 'المرحلة'), ctx.cat.e2eById[m.e2e]?.name || m.e2e]]); },
  mp_goal: (ctx) => SOURCES.mp_header(ctx),
  mp_sipoc: (ctx) => { const m = ctx.cat.mpById[ctx.mpId]; const s = m.sipoc; const n = Math.max(s.S.length, s.I.length, s.O.length, s.C.length); const rows = []; for (let i = 0; i < n; i++) rows.push({ S: s.S[i] || '', I: s.I[i] || '', O: s.O[i] || '', C: s.C[i] || '' }); return table(['S', 'I', 'O', 'C'].map(k => col(k, { S: L('Suppliers', 'Fournisseurs', 'الموردون'), I: L('Inputs', 'Entrées', 'المدخلات'), O: L('Outputs', 'Sorties', 'المخرجات'), C: L('Customers', 'Clients', 'العملاء') }[k])), rows); },
  mp_bpmn: (ctx) => mpBpmnBlocks(ctx, ctx.mpId),
  mp_steps_sipoc: (ctx) => sipocTable(ctx, ctx.mpId),
  mp_steps: (ctx) => sipocTable(ctx, ctx.mpId),
  mp_gonogo: (ctx) => mpGoNoGo(ctx, ctx.mpId),
  mp_risks: (ctx) => { const rs = all('SELECT code, title, score, owner_role, treatment FROM risks WHERE project_id=? AND mp_id=? ORDER BY score DESC LIMIT 8', ctx.p.id, ctx.mpId); const ctl = all('SELECT code, name, frequency FROM controls WHERE org_id=? AND mp_id=? LIMIT 6', ctx.org.id, ctx.mpId); return [table([col('c', H.code), col('t', L('Risk', 'Risque', 'الخطر'), 3), col('s', H.score), col('tr', L('Treatment', 'Traitement', 'المعالجة'), 2), col('o', H.owner, 2)], rs.map(x => ({ c: x.code, t: P(x.title), s: x.score, tr: P(x.treatment) || '', o: roleName(x.owner_role) }))), ...(ctl.length ? [table([col('c', H.code), col('n', L('Control', 'Contrôle', 'الضابط'), 3), col('f', H.frequency)], ctl.map(c => ({ c: c.code, n: P(c.name), f: lab(c.frequency) })))] : [])]; },
  mp_docs: (ctx) => { const ds = all('SELECT code, title, doc_type, current_version, status FROM documents WHERE project_id=? AND (mp_id=? OR template_id IN (SELECT template_id FROM documents WHERE 0)) ORDER BY code', ctx.p.id, ctx.mpId); const tpl = DOC_TEMPLATES.filter(t => t.mp === ctx.mpId); return table([col('c', H.code, 2), col('t', H.title, 3), col('y', H.type), col('v', H.version), col('s', H.status)], [...ds.map(d => ({ c: d.code, t: P(d.title), y: lab(d.doc_type), v: d.current_version, s: lab(d.status) })), ...tpl.filter(t => !ds.some(d => d.title && P(d.title)?.en === t.name.en)).map(t => ({ c: t.code, t: t.name, y: lab(t.docType), v: '—', s: L('Template', 'Modèle', 'نموذج') }))]); },
  phase_racsi: (ctx) => racsiTable(ctx, null, ctx.e2e),
  phase_bpmn: (ctx) => {
    const mps = phaseMps(ctx); if (!mps.length) return null;
    const gate = phaseGate(ctx);
    const lanesIds = [...new Set(mps.map(m => m.owner_role || ctx.cat.mpById[m.mp_id].ownerRoleCode))];
    const deciders = 'top_management';
    const parts = []; for (let i = 0; i < mps.length; i += CHUNK) parts.push(mps.slice(i, i + CHUNK));
    return parts.map((part, pi) => {
      const last = pi === parts.length - 1;
      const ids = [...new Set([...part.map(m => m.owner_role || ctx.cat.mpById[m.mp_id].ownerRoleCode), ...(last ? [deciders] : [])])].filter(x => lanesIds.includes(x) || x === deciders);
      const lanes = ids.map(id => ({ id, name: roleName(id) }));
      const nodes = [pi === 0 ? { id: 's', type: 'start', lane: ids[0], label: L('Phase opened', 'Phase ouverte', 'فتح المرحلة') } : { id: 's', type: 'link', lane: ids[0], letter: String.fromCharCode(64 + pi) }]; const flows = []; let prev = 's';
      part.forEach(m => { const mp = ctx.cat.mpById[m.mp_id]; nodes.push({ id: m.mp_id, type: 'sub', lane: m.owner_role || mp.ownerRoleCode, label: mp.name, code: mp.code }); flows.push({ from: prev, to: m.mp_id }); prev = m.mp_id; });
      if (last) { nodes.push({ id: 'g', type: 'gateway', lane: deciders, label: gate ? P(gate.name) : L('Gate', 'Jalon', 'البوابة') }, { id: 'e', type: 'end', lane: deciders, label: L('Next phase', 'Phase suivante', 'المرحلة التالية') }); flows.push({ from: prev, to: 'g' }, { from: 'g', to: 'e', label: L('Go', 'Go', 'متابعة') }, { from: 'g', to: prev, label: L('No-Go / Recycle', 'No-Go / Recycle', 'توقف / إعادة'), back: true }); }
      else { nodes.push({ id: 'l', type: 'link', lane: ids[ids.length - 1] === deciders ? ids[0] : ids[ids.length - 1], letter: String.fromCharCode(65 + pi) }); flows.push({ from: prev, to: 'l' }); }
      return { kind: 'diagram', diagram: 'bpmn', spec: { lanes, nodes, flows }, caption: cat(' ', ctx.cat.e2eById[ctx.e2e]?.name, parts.length > 1 ? L(`— overview, part ${pi + 1} of ${parts.length}`, `— vue d'ensemble, partie ${pi + 1} sur ${parts.length}`, `— نظرة عامة، الجزء ${pi + 1} من ${parts.length}`) : L('— overview: macro processes and gate', '— vue d\'ensemble : macro-processus et jalon', '— نظرة عامة: العمليات الكلية والبوابة')) };
    });
  },
  phase_activities: (ctx) => {
    const out = [];
    for (const x of phaseMps(ctx)) {
      const m = ctx.cat.mpById[x.mp_id];
      out.push(sub(mpLabel(ctx, m.id)));
      out.push(kv([[L('Purpose', 'Finalité', 'الغاية'), m.goal], [L('Trigger', 'Déclencheur', 'المُطلق'), m.trigger], [L('Process owner', 'Pilote', 'مالك العملية'), roleName(x.owner_role || m.ownerRoleCode)], [L('Status in this project', 'Statut dans ce projet', 'الحالة في هذا المشروع'), lab(x.status)]]));
      out.push(...mpBpmnBlocks(ctx, m.id));
      out.push(sipocTable(ctx, m.id));
      out.push(...[mpGoNoGo(ctx, m.id)].flat());
    }
    return out;
  },
  phase_gate: (ctx) => {
    const gate = phaseGate(ctx);
    const ph = get('SELECT * FROM phases WHERE project_id=? AND e2e_id=?', ctx.p.id, ctx.e2e);
    const items = ph ? all('SELECT i.text, i.mandatory, i.evidence_required, i.done, i.done_at FROM checklist_items i JOIN checklists c ON c.id=i.checklist_id WHERE c.project_id=? AND c.phase_id=? ORDER BY i.seq', ctx.p.id, ph.id) : [];
    const out = [kv([
      [L('Gate', 'Jalon', 'البوابة'), gate ? P(gate.name) : cat(' ', L('Gate of', 'Jalon de', 'بوابة'), ctx.cat.e2eById[ctx.e2e]?.name)], [L('Purpose', 'Finalité', 'الغاية'), gate ? P(gate.purpose) || P(gate.exit_criteria) : ''],
      [L('Entry criteria', 'Critères d\'entrée', 'معايير الدخول'), gate ? P(gate.entry_criteria) : ''], [L('Exit criteria (Go)', 'Critères de sortie (Go)', 'معايير الخروج (متابعة)'), gate ? P(gate.exit_criteria) : ''],
      [L('Decision makers', 'Décideurs', 'متخذو القرار'), cat(', ', roleName('top_management'), roleName('ims_manager'))],
    ])];
    if (items.length) out.push(table([col('n', '#'), col('t', L('Checklist item', 'Point de contrôle', 'بند القائمة'), 4), col('m', L('Mandatory', 'Obligatoire', 'إلزامي')), col('e', L('Evidence required', 'Preuve exigée', 'دليل مطلوب')), col('d', H.status), col('a', H.date)], items.map((i, k) => ({ n: k + 1, t: P(i.text), m: yn(i.mandatory), e: yn(i.evidence_required), d: i.done ? L('Met', 'Satisfait', 'مستوفى') : L('Open', 'Ouvert', 'مفتوح'), a: i.done_at?.slice(0, 10) || '', _status: i.done ? 3 : i.mandatory ? 0 : 1 })), L('A mandatory item not met blocks the Go decision, unless a waiver is approved with justification.', 'Un point obligatoire non satisfait bloque la décision Go, sauf dérogation approuvée et justifiée.', 'يمنع أي بند إلزامي غير مستوفى قرار المتابعة ما لم يُعتمد إعفاء مبرر.')));
    out.push(table([col('d', L('Decision', 'Décision', 'القرار')), col('c', L('When', 'Quand', 'متى'), 3), col('n', L('Consequence', 'Conséquence', 'العاقبة'), 3)], [
      { d: 'Go', c: L('All mandatory items met; evidence reviewed; no open critical risk', 'Tous les points obligatoires satisfaits ; preuves revues ; aucun risque critique ouvert', 'استيفاء جميع البنود الإلزامية ومراجعة الأدلة وعدم وجود خطر حرج مفتوح'), n: L('The next phase opens; the phase documents are published', 'La phase suivante s\'ouvre ; les documents de la phase sont publiés', 'تُفتح المرحلة التالية وتُنشر وثائق المرحلة') },
      { d: 'No-Go', c: L('A mandatory item is not met and cannot be met in the phase', 'Un point obligatoire n\'est pas satisfait et ne peut l\'être dans la phase', 'بند إلزامي غير مستوفى ولا يمكن استيفاؤه في المرحلة'), n: L('The project stops at this gate; decision escalated to top management', 'Le projet s\'arrête à ce jalon ; décision remontée à la direction', 'يتوقف المشروع عند هذه البوابة ويُصعَّد القرار إلى الإدارة العليا') },
      { d: 'Hold', c: L('Items pending an external condition (e.g. auditor availability)', 'Points en attente d\'une condition externe (ex. disponibilité de l\'auditeur)', 'بنود بانتظار شرط خارجي (مثل توفر المدقق)'), n: L('The decision is postponed to a set date', 'La décision est reportée à une date fixée', 'يؤجل القرار إلى تاريخ محدد') },
      { d: 'Recycle', c: L('Some outputs must be redone', 'Certaines sorties doivent être refaites', 'يجب إعادة بعض المخرجات'), n: L('The listed steps are reopened with justification; the gate is reviewed again', 'Les étapes listées sont rouvertes avec justification ; le jalon est revu', 'تُعاد فتح الخطوات المذكورة مع التبرير وتُراجع البوابة مجددًا') },
    ]));
    if (ph) out.push(kv([[L('Decision recorded', 'Décision enregistrée', 'القرار المسجل'), ph.gate_decision ? lab(ph.gate_decision) : L('Not decided yet', 'Pas encore décidée', 'لم يُتخذ بعد')], [H.date, ph.decided_at?.slice(0, 10) || '—'], [L('Decided by', 'Décidée par', 'اتخذه'), userName(ph.decided_by) || '—'], [H.comment, P(ph.comment) || '—']]));
    return out;
  },
  phase_records: (ctx) => {
    const rows = [];
    for (const x of phaseMps(ctx)) { const m = ctx.cat.mpById[x.mp_id]; for (const o of m.sipoc.O.slice(0, 2)) rows.push({ r: o, p: m.code, o: roleName(x.owner_role || m.ownerRoleCode), s: L('DynamicMS — project records', 'DynamicMS — enregistrements du projet', 'DynamicMS — سجلات المشروع'), k: L('3 years after the end of validity', '3 ans après la fin de validité', '3 سنوات بعد انتهاء الصلاحية') }); }
    return table([col('r', H.record, 3), col('p', H.process), col('o', H.owner, 2), col('s', L('Storage', 'Stockage', 'الحفظ'), 2), col('k', L('Retention', 'Conservation', 'مدة الاحتفاظ'), 2)], rows.slice(0, 40));
  },
  phase_outputs: (ctx) => SOURCES.phase_records(ctx),
  phase_kpis: (ctx) => { const mps = phaseMps(ctx).map(x => x.mp_id); const ks = all(`SELECT code, name, target_text, frequency, owner_role FROM kpis WHERE project_id=? AND mp_id IN (${mps.map(() => '?').join(',') || "''"})`, ctx.p.id, ...mps); return table([col('c', H.code), col('n', H.kpi, 3), col('t', H.target), col('f', H.frequency), col('o', H.owner, 2)], ks.map(k => ({ c: k.code, n: P(k.name), t: k.target_text, f: lab(k.frequency), o: roleName(k.owner_role) }))); },
  phase_risks: (ctx) => { const mps = phaseMps(ctx).map(x => x.mp_id); const rs = all(`SELECT code, title, score, treatment, owner_role FROM risks WHERE project_id=? AND mp_id IN (${mps.map(() => '?').join(',') || "''"}) ORDER BY score DESC LIMIT 12`, ctx.p.id, ...mps); const rules = ctx.cat.rules.filter(r => mps.includes(r.mp)).slice(0, 10); return [table([col('c', H.code), col('t', L('Risk', 'Risque', 'الخطر'), 3), col('s', H.score), col('tr', L('Treatment', 'Traitement', 'المعالجة'), 2), col('o', H.owner, 2)], rs.map(x => ({ c: x.code, t: P(x.title), s: x.score, tr: P(x.treatment) || '', o: roleName(x.owner_role) }))), ...(rules.length ? [table([col('c', H.code), col('s', H.step), col('x', L('Rule', 'Règle', 'القاعدة'), 3), col('a', H.action, 2)], rules.map(r => ({ c: r.id, s: r.step, x: r.condition, a: r.action })))] : [])]; },
  // Work instruction
  wi_safety: () => bullets([L('Wear the PPE required at the workstation (safety shoes, gloves, glasses).', 'Porter les EPI requis au poste (chaussures de sécurité, gants, lunettes).', 'ارتداء معدات الوقاية المطلوبة (أحذية السلامة، القفازات، النظارات).'), L('Isolate and lock out energy sources before any intervention.', 'Consigner les énergies avant toute intervention.', 'عزل مصادر الطاقة وقفلها قبل أي تدخل.'), L('Report any near miss or hazard immediately.', 'Signaler immédiatement tout presque-accident ou danger.', 'الإبلاغ فورًا عن أي حادث وشيك أو خطر.')]),
  wi_tools: (ctx) => table([col('t', L('Tool or material', 'Outil ou matière', 'الأداة أو المادة'), 3), col('r', L('Requirement', 'Exigence', 'المتطلب'), 3)], regs(ctx, 'calibration').slice(0, 4).map(e => ({ t: cat(' ', e.title, `(${e.code})`), r: cat(' ', L('Calibration valid until', 'Étalonnage valide jusqu\'au', 'المعايرة سارية حتى'), e.d.nextCalibration) }))),
  wi_steps: (ctx) => table([col('n', '#'), col('s', H.step, 3), col('k', L('Key point', 'Point clé', 'النقطة الرئيسية'), 3), col('w', L('Why', 'Pourquoi', 'لماذا'), 2)], [
    { n: 1, s: L('Check the job order and the accepted quote', 'Vérifier l\'ordre de travail et le devis accepté', 'التحقق من أمر العمل والعرض المقبول'), k: L('Scope, address, customer contact', 'Périmètre, adresse, contact client', 'النطاق والعنوان وجهة اتصال العميل'), w: L('Avoid working outside the agreed scope', 'Éviter de travailler hors du périmètre convenu', 'تجنب العمل خارج النطاق المتفق عليه') },
    { n: 2, s: L('Prepare tools and parts; check calibration labels', 'Préparer outils et pièces ; vérifier les étiquettes d\'étalonnage', 'تجهيز الأدوات والقطع والتحقق من ملصقات المعايرة'), k: L('Label date not exceeded', 'Date de l\'étiquette non dépassée', 'عدم تجاوز تاريخ الملصق'), w: L('Measurements must be valid (§7.1.5)', 'Les mesures doivent être valides (§7.1.5)', 'يجب أن تكون القياسات صالحة (§7.1.5)') },
    { n: 3, s: fillText(L('Carry out the work on {line} following the manufacturer instructions', 'Réaliser l\'intervention sur {line} selon les instructions du fabricant', 'تنفيذ العمل في {line} وفق تعليمات الصانع'), ctx.vars), k: L('Critical parameters within tolerance', 'Paramètres critiques dans la tolérance', 'المعاملات الحرجة ضمن التفاوت'), w: L('Right first time; safety', 'Bien du premier coup ; sécurité', 'الصواب من المرة الأولى؛ السلامة') },
    { n: 4, s: L('Test the result with the customer', 'Tester le résultat avec le client', 'اختبار النتيجة مع العميل'), k: L('Test protocol passed', 'Protocole d\'essai réussi', 'نجاح بروتوكول الاختبار'), w: L('Release criteria (§8.6)', 'Critères de libération (§8.6)', 'معايير الإفراج (§8.6)') },
    { n: 5, s: L('Have the job sheet signed and photograph it in the application', 'Faire signer la fiche et la photographier dans l\'application', 'توقيع بطاقة العمل وتصويرها في التطبيق'), k: L('Customer signature and date', 'Signature et date du client', 'توقيع العميل والتاريخ'), w: L('Evidence of release; invoicing', 'Preuve de libération ; facturation', 'دليل الإفراج؛ الفوترة') },
  ]),
  wi_checks: (ctx) => table([col('c', L('Characteristic', 'Caractéristique', 'الخاصية'), 2), col('s', L('Acceptance criterion', 'Critère d\'acceptation', 'معيار القبول'), 3), col('r', L('If not met', 'Si non satisfait', 'في حال عدم الاستيفاء'), 3)], regs(ctx, 'controlplan').filter(x => /execution|test|exécution|essai|التنفيذ|الاختبار/i.test(x.title.en + x.title.fr)).map(x => ({ c: x.d.characteristic, s: x.d.specification, r: x.d.reaction }))),
  racsi: (ctx) => racsiTable(ctx, null),
  mp_racsi: (ctx) => racsiTable(ctx, ctx.mpId),
  racsi_rules: () => bullets([L('Exactly one Accountable (A) per activity; the A approves and answers for the result.', 'Exactement un Approbateur (A) par activité ; le A approuve et répond du résultat.', 'مساءل واحد (A) فقط لكل نشاط؛ يعتمد النتيجة ويُسأل عنها.'), L('At least one Responsible (R) who does the work; R and A may be the same role only for simple activities.', 'Au moins un Réalisateur (R) qui fait le travail ; R et A ne sont le même rôle que pour des activités simples.', 'منفذ (R) واحد على الأقل يقوم بالعمل؛ ولا يكون R وA الدور نفسه إلا في الأنشطة البسيطة.'), L('Consulted (C) are asked before the decision; Informed (I) are told after; Support (S) provide resources.', 'Les Consultés (C) sont sollicités avant la décision ; les Informés (I) après ; le Support (S) fournit les ressources.', 'يُستشار (C) قبل القرار، ويُبلَّغ (I) بعده، ويوفر الداعم (S) الموارد.'), L('The matrix is reviewed when the organization chart or a process changes.', 'La matrice est revue lors de tout changement d\'organigramme ou de processus.', 'تُراجع المصفوفة عند تغيير الهيكل التنظيمي أو إحدى العمليات.')]),
  // Competence and training
  competence: (ctx) => SOURCES.competence_req(ctx),
  competence_req: (ctx) => table([col('c', L('Competence', 'Compétence', 'الكفاءة'), 3), col('r', H.role, 2), col('q', L('Required level', 'Niveau requis', 'المستوى المطلوب')), col('k', L('Criticality', 'Criticité', 'الأهمية')), col('a', L('How acquired', 'Mode d\'acquisition', 'طريقة الاكتساب'), 2)], regs(ctx, 'competence').map(x => ({ c: x.title, r: roleName(x.d.role), q: x.d.required, k: x.d.criticality || '', a: x.d.acquiredBy || '' }))),
  competence_matrix: (ctx) => {
    const list = regs(ctx, 'competence'); const people = [...new Set(list.map(x => x.d.holder))];
    const rows = people.map(p => { const o = { p }; const c = {}; list.forEach((x, i) => { if (x.d.holder === p) { o[`c${i}`] = `${x.d.level}/${x.d.required}`; c[`c${i}`] = x.d.level >= x.d.required ? 3 : x.d.required - x.d.level >= 2 ? 0 : 1; } else o[`c${i}`] = ''; }); o._cells = c; return o; });
    return table([col('p', H.name, 2), ...list.map((x, i) => col(`c${i}`, x.code))], rows, cat(' · ', ...list.map(x => cat(' ', x.code, x.title))));
  },
  competence_gaps: (ctx) => table([col('h', H.name, 2), col('c', L('Competence', 'Compétence', 'الكفاءة'), 3), col('q', L('Required', 'Requis', 'المطلوب')), col('l', L('Actual', 'Actuel', 'الفعلي')), col('g', L('Gap', 'Écart', 'الفجوة')), col('a', H.action, 3)], regs(ctx, 'competence', x => x.d.gap > 0).map(x => ({ h: x.d.holder, c: x.title, q: x.d.required, l: x.d.level, g: x.d.gap, a: x.d.action || '', _cells: { g: x.d.gap >= 2 ? 0 : 1 } }))),
  training_plan: (ctx) => table([col('c', L('Course', 'Formation', 'الدورة'), 3), col('t', H.type), col('p', L('Provider', 'Prestataire', 'الجهة'), 2), col('d', H.date), col('h', L('Hours', 'Heures', 'الساعات')), col('s', H.status)], regs(ctx, 'training').map(x => ({ c: x.title, t: x.d.type, p: x.d.provider, d: x.d.date, h: x.d.durationH, s: lab(x.status) }))),
  training: (ctx) => SOURCES.training_full(ctx),
  training_full: (ctx) => table([col('c', L('Course', 'Formation', 'الدورة'), 2.4), col('d', H.date), col('tr', L('Trainer', 'Formateur', 'المدرب'), 1.6), col('p', L('Participants', 'Participants', 'المشاركون'), 2.6), col('e', L('Evaluation', 'Évaluation', 'التقييم'), 1.8), col('r', H.result), col('f', L('Effectiveness (%)', 'Efficacité (%)', 'الفعالية (%)')), col('m', L('Effectiveness method', 'Méthode d\'efficacité', 'طريقة الفعالية'), 2)],
    regs(ctx, 'training', x => x.status === 'Completed').map(x => ({ c: x.title, d: x.d.date, tr: x.d.trainer, p: val(x.d.participants), e: x.d.evaluation, r: x.d.result || '', f: x.d.effectiveness ?? '', m: x.d.effectivenessMethod, _cells: { f: x.d.effectiveness >= 80 ? 3 : 1 } }))),
  competence_scale: () => table([col('l', H.level), col('d', L('Meaning', 'Signification', 'المعنى'), 4)], [
    { l: '1', d: L('Knows: has been trained, works under supervision', 'Connaît : formé, travaille sous supervision', 'يعرف: تلقى التدريب ويعمل تحت الإشراف') }, { l: '2', d: L('Applies: works alone on standard cases', 'Applique : travaille seul sur les cas standards', 'يطبق: يعمل منفردًا في الحالات المعتادة') },
    { l: '3', d: L('Masters: handles all cases and deviations', 'Maîtrise : traite tous les cas et écarts', 'يتقن: يتعامل مع جميع الحالات والانحرافات') }, { l: '4', d: L('Expert: trains and assesses others', 'Expert : forme et évalue les autres', 'خبير: يدرب الآخرين ويقيّمهم') },
  ], L('Cells show actual / required level. Green: requirement met; amber: gap of 1; red: gap of 2 or more.', 'Les cellules indiquent niveau réel / requis. Vert : exigence satisfaite ; orange : écart de 1 ; rouge : écart de 2 ou plus.', 'تعرض الخلايا المستوى الفعلي / المطلوب. أخضر: مستوفى؛ برتقالي: فجوة 1؛ أحمر: فجوة 2 فأكثر.')),
  // Measuring equipment
  cal_summary: (ctx) => { const e = regs(ctx, 'calibration'); const n = (s) => e.filter(x => x.status === s).length; return kv([[L('Equipment in the register', 'Équipements au registre', 'المعدات في السجل'), e.length], [lab('Valid'), n('Valid')], [lab('Due soon'), n('Due soon')], [lab('Overdue'), n('Overdue')], [L('Out of tolerance at last calibration', 'Hors tolérance au dernier étalonnage', 'خارج التفاوت في آخر معايرة'), e.filter(x => x.d.outOfTolerance).length], [L('Rule', 'Règle', 'القاعدة'), L('Overdue equipment is withdrawn and labelled "Do not use" until recalibrated.', 'Un équipement échu est retiré et étiqueté « Ne pas utiliser » jusqu\'au réétalonnage.', 'تُسحب المعدة المتأخرة ويُلصق عليها "لا تستخدم" حتى إعادة المعايرة.')]]); },
  calibration: (ctx) => SOURCES.calibration_full(ctx),
  calibration_full: (ctx) => table([col('c', L('ID', 'ID', 'الرمز')), col('t', L('Equipment', 'Équipement', 'المعدة'), 2.2), col('k', H.category, 1.2), col('m', L('Make / model', 'Marque / modèle', 'الصانع / الطراز'), 1.6), col('s', L('Serial', 'N° de série', 'الرقم التسلسلي'), 1.2), col('l', L('Location / user', 'Emplacement / utilisateur', 'الموقع / المستخدم'), 2), col('r', L('Range', 'Étendue', 'النطاق'), 1.3), col('a', L('Required accuracy', 'Exactitude requise', 'الدقة المطلوبة'), 1.2), col('mt', L('Method', 'Méthode', 'الطريقة'), 2.2), col('f', L('Interval', 'Périodicité', 'الفترة')), col('n', L('Next due', 'Prochaine échéance', 'الاستحقاق التالي'), 1.2), col('st', H.status)],
    regs(ctx, 'calibration').map(x => ({ c: x.code, t: x.title, k: x.d.category || '', m: cat(' ', x.d.manufacturer || '', x.d.model || ''), s: x.d.serial, l: cat(' — ', x.d.location, x.d.user), r: x.d.range || '', a: x.d.tolerance || '', mt: x.d.method || '', f: x.d.frequencyMonths ? cat(' ', x.d.frequencyMonths, L('months', 'mois', 'شهرًا')) : '', n: x.d.nextCalibration, st: lab(x.status), _status: x.status === 'Overdue' ? 0 : x.status === 'Due soon' ? 1 : 3 }))),
  cal_records: (ctx) => table([col('c', L('ID', 'ID', 'الرمز')), col('t', L('Equipment', 'Équipement', 'المعدة'), 2), col('d', L('Last calibration', 'Dernier étalonnage', 'آخر معايرة'), 1.2), col('p', L('Provider', 'Prestataire', 'الجهة'), 2), col('cert', L('Certificate', 'Certificat', 'الشهادة'), 1.3), col('e', L('Error found', 'Écart constaté', 'الخطأ المرصود'), 1.4), col('r', H.result), col('tr', L('Traceability', 'Raccordement', 'التتبع'), 2.6)], regs(ctx, 'calibration').map(x => ({ c: x.code, t: x.title, d: x.d.lastCalibration, p: x.d.provider || '', cert: x.d.certificate || '', e: x.d.error || '', r: x.d.result || '', tr: x.d.traceability || '', _cells: { r: x.d.lastCalibrationResult === 'Adjusted' ? 1 : 3 } }))),
  cal_oot: (ctx) => { const e = regs(ctx, 'calibration', x => x.d.outOfTolerance); return e.length ? table([col('c', L('ID', 'ID', 'الرمز')), col('t', L('Equipment', 'Équipement', 'المعدة'), 2), col('a', L('Assessment and action', 'Évaluation et action', 'التقييم والإجراء'), 6)], e.map(x => ({ c: x.code, t: x.title, a: x.d.outOfTolerance }))) : para(L('No equipment found out of tolerance during the period.', 'Aucun équipement hors tolérance sur la période.', 'لم تُرصد أي معدة خارج التفاوت خلال الفترة.')); },
  cal_legend: () => kv([[lab('Valid'), L('Calibration valid more than 30 days.', 'Étalonnage valide plus de 30 jours.', 'معايرة سارية لأكثر من 30 يومًا.')], [lab('Due soon'), L('Due within 30 days: schedule with the provider.', 'Échéance sous 30 jours : planifier avec le prestataire.', 'استحقاق خلال 30 يومًا: الجدولة مع الجهة.')], [lab('Overdue'), L('Withdrawn from use until recalibrated; previous results assessed if needed.', 'Retiré de l\'usage jusqu\'au réétalonnage ; résultats antérieurs évalués si nécessaire.', 'يُسحب من الاستخدام حتى إعادة المعايرة مع تقييم النتائج السابقة عند الحاجة.')], [L('Adjusted', 'Ajusté', 'تم الضبط'), L('Found out of tolerance, adjusted and re-verified; impact assessed (§7.1.5.2).', 'Trouvé hors tolérance, ajusté et revérifié ; impact évalué (§7.1.5.2).', 'وُجد خارج التفاوت وتم ضبطه وإعادة التحقق منه مع تقييم الأثر (§7.1.5.2).')]]),
  // Communication
  commplan: (ctx) => table([col('c', H.code), col('t', L('What', 'Quoi', 'ماذا'), 2), col('p', L('Why', 'Pourquoi', 'لماذا'), 2), col('a', L('With whom', 'Avec qui', 'مع من'), 2), col('d', L('Int. / ext.', 'Int. / ext.', 'داخلي / خارجي')), col('s', L('Who', 'Qui', 'من'), 1.6), col('h', L('How', 'Comment', 'كيف'), 2), col('w', L('When', 'Quand', 'متى'), 1.6), col('r', H.record, 1.8)], regs(ctx, 'commplan').map(x => ({ c: x.code, t: x.title, p: x.d.purpose, a: x.d.audience, d: x.d.direction, s: roleName(x.d.sender), h: x.d.channel, w: x.d.frequency, r: x.d.record }))),
  commlog: (ctx) => table([col('d', H.date), col('t', L('Topic', 'Sujet', 'الموضوع'), 2.4), col('a', L('Audience', 'Destinataires', 'الجمهور'), 2), col('h', L('Channel', 'Canal', 'القناة'), 1.8), col('b', L('By', 'Par', 'بواسطة'), 1.6), col('n', L('Reach', 'Portée', 'العدد')), col('e', H.evidence, 1.8), col('f', L('Feedback', 'Retour', 'الملاحظات'), 1.6)], regs(ctx, 'commlog').sort((a, b) => String(a.d.date).localeCompare(String(b.d.date))).map(x => ({ d: x.d.date, t: x.title, a: x.d.audience, h: x.d.channel, b: x.d.by, n: x.d.reach, e: x.d.evidence, f: x.d.feedback }))),
  communications: (ctx) => {
    const ex = all(`SELECT step_id, fields FROM step_exec WHERE project_id=? AND form_kind='communicate' AND status='Done' ORDER BY completed_at`, ctx.p.id);
    const rows = [];
    for (const e of ex) for (const m of (P(e.fields)?.messages || [])) rows.push({ s: ctx.cat.stepById[e.step_id]?.name, a: fmtCell(m.audience, 'obs'), c: lab(m.channel), d: m.date || '', m: m.message || '', b: roleName(m.by) });
    return table([col('s', L('What (step)', 'Quoi (étape)', 'ماذا (الخطوة)'), 2), col('a', L('With whom', 'Avec qui', 'مع من'), 2), col('c', L('How', 'Comment', 'كيف')), col('d', L('When', 'Quand', 'متى')), col('m', L('Message', 'Message', 'الرسالة'), 3), col('b', L('Who', 'Qui', 'من'), 2)], rows.slice(0, 200));
  },
  // Documented information
  doc_hierarchy: () => table([col('l', H.level), col('t', H.type, 2), col('c', L('Content', 'Contenu', 'المحتوى'), 4), col('a', L('Approved by', 'Approuvé par', 'اعتمده'), 2)], [
    { l: '1', t: L('Policy and manual', 'Politique et manuel', 'السياسة والدليل'), c: L('Why and what: commitments, scope, processes', 'Pourquoi et quoi : engagements, périmètre, processus', 'لماذا وماذا: الالتزامات والنطاق والعمليات'), a: roleName('top_management') },
    { l: '2', t: L('Procedures and process sheets', 'Procédures et fiches processus', 'الإجراءات وبطاقات العمليات'), c: L('Who does what, when: flows, responsibilities, SIPOC', 'Qui fait quoi, quand : logigrammes, responsabilités, SIPOC', 'من يفعل ماذا ومتى: المخططات والمسؤوليات وSIPOC'), a: roleName('ims_manager') },
    { l: '3', t: L('Work instructions and forms', 'Instructions de travail et formulaires', 'تعليمات العمل والنماذج'), c: L('How to do a task', 'Comment réaliser une tâche', 'كيفية تنفيذ مهمة'), a: roleName('operations_manager') },
    { l: '4', t: L('Records and registers', 'Enregistrements et registres', 'السجلات'), c: L('Evidence of what was done', 'Preuves de ce qui a été fait', 'أدلة على ما تم تنفيذه'), a: L('Not approved; retained', 'Non approuvés ; conservés', 'لا تُعتمد؛ يُحتفظ بها') },
  ]),
  documents: (ctx) => SOURCES.documents_full(ctx),
  documents_full: (ctx) => {
    const ds = all('SELECT d.code, d.title, d.doc_type, d.template_id, d.current_version, d.status, d.owner_role, d.review_frequency, d.next_review, (SELECT MAX(approved_at) FROM document_versions v WHERE v.document_id=d.id) approved, (SELECT u.name FROM document_versions v JOIN users u ON u.id=v.approver WHERE v.document_id=d.id ORDER BY v.created_at DESC LIMIT 1) approver FROM documents d WHERE d.project_id=? ORDER BY d.doc_type, d.code', ctx.p.id);
    const level = (t) => ({ Policy: 1, Manual: 1, Scope: 1, Procedure: 2, Sheet: 2, Map: 2, Instruction: 3, Matrix: 3, Plan: 3 }[t] || 4);
    return table([col('c', H.code, 1.8), col('t', H.title, 2.6), col('y', H.type), col('l', H.level, 0.6), col('k', H.clause, 1), col('v', H.version, 0.7), col('s', H.status), col('o', H.owner, 1.5), col('a', L('Approved by', 'Approuvé par', 'اعتمده'), 1.4), col('e', L('Effective', 'Application', 'السريان'), 1.1), col('r', L('Review', 'Revue', 'المراجعة'), 1), col('n', L('Next review', 'Prochaine revue', 'المراجعة التالية'), 1.1), col('x', L('Distribution', 'Diffusion', 'التوزيع'), 1.4)],
      ds.map(d => ({ c: d.code, t: P(d.title), y: lab(d.doc_type), l: level(d.doc_type), k: Object.values(templateByCode[d.template_id]?.clauses || {})[0] || '', v: d.current_version, s: lab(d.status), o: roleName(d.owner_role), a: d.approver || '', e: d.approved?.slice(0, 10) || '', r: lab(d.review_frequency), n: d.next_review || '', x: level(d.doc_type) === 1 ? L('All staff; public', 'Tout le personnel ; public', 'جميع العاملين؛ عام') : L('Users of the process', 'Utilisateurs du processus', 'مستخدمو العملية'), _status: d.status === 'Published' ? 3 : d.status === 'Draft' ? 1 : undefined })));
  },
  records_retention: (ctx) => table([col('r', H.record, 3), col('k', H.clause), col('o', H.owner, 2), col('s', L('Storage', 'Stockage', 'الحفظ'), 2), col('p', L('Protection', 'Protection', 'الحماية'), 2), col('t', L('Retention', 'Conservation', 'مدة الاحتفاظ'), 1.6), col('d', L('Disposition', 'Élimination', 'الإتلاف'), 1.6)],
    DOC_TEMPLATES.filter(t => Object.values(t.mandatory).includes('retain') && t.ms.includes(ctx.p.ms_type)).map(t => ({ r: t.name, k: Object.values(t.clauses)[0], o: roleName(t.owner), s: L('DynamicMS (electronic)', 'DynamicMS (électronique)', 'DynamicMS (إلكتروني)'), p: L('Access by role; daily backup', 'Accès par rôle ; sauvegarde quotidienne', 'الوصول حسب الدور؛ نسخ احتياطي يومي'), t: ['TPL-KPI', 'TPL-COMM'].includes(t.code) ? L('3 years', '3 ans', '3 سنوات') : ['TPL-COMP'].includes(t.code) ? L('Employment + 5 years', 'Durée d\'emploi + 5 ans', 'مدة التوظيف + 5 سنوات') : L('5 years', '5 ans', '5 سنوات'), d: L('Secure deletion; log kept', 'Suppression sécurisée ; trace conservée', 'حذف آمن مع الاحتفاظ بالأثر') }))),
  external_docs: (ctx) => table([col('d', L('Document', 'Document', 'الوثيقة'), 3), col('s', L('Origin', 'Origine', 'المصدر'), 2), col('v', L('Edition', 'Édition', 'الطبعة')), col('m', L('How kept up to date', 'Mise à jour', 'طريقة التحديث'), 3)], [
    ...ctx.standards.map(s => ({ d: s, s: 'ISO', v: /9001|14001/.test(s) ? '2015' : /45001/.test(s) ? '2018' : '—', m: L('Subscription to the national standards body', 'Abonnement à l\'organisme national de normalisation', 'اشتراك لدى هيئة التقييس الوطنية') })),
    ...regs(ctx, 'obligations', x => !x.code.startsWith('OB-S')).slice(0, 6).map(x => ({ d: x.title, s: x.d.authority || '', v: x.d.reference || '', m: L('Regulatory watch every quarter', 'Veille réglementaire trimestrielle', 'رصد تنظيمي كل ربع سنة') })),
  ]),
  mandatory_matrix: (ctx) => {
    const have = new Set(all('SELECT template_id FROM documents WHERE project_id=?', ctx.p.id).map(x => x.template_id));
    const rows = [];
    for (const t of DOC_TEMPLATES) for (const [std, kind] of Object.entries(t.mandatory)) if (ctx.standards.includes(std)) rows.push({ s: std, c: t.clauses[std] || '', t: t.name, k: kind === 'maintain' ? L('Document to maintain', 'Document à tenir à jour', 'وثيقة يجب تحديثها') : L('Record to retain', 'Enregistrement à conserver', 'سجل يجب الاحتفاظ به'), h: have.has(t.code) ? L('Available', 'Disponible', 'متوفرة') : L('Missing', 'Manquant', 'مفقودة'), _status: have.has(t.code) ? 3 : 0 });
    return table([col('s', L('Standard', 'Norme', 'المعيار')), col('c', H.clause), col('t', H.title, 3), col('k', H.type, 2), col('h', H.status)], rows);
  },
  // Suppliers
  supplier_criteria: () => table([col('c', L('Criterion', 'Critère', 'المعيار'), 2), col('w', L('Weight', 'Poids', 'الوزن')), col('d', L('How scored (1–5)', 'Mode de notation (1–5)', 'طريقة التقييم (1–5)'), 4)], [
    { c: L('Quality', 'Qualité', 'الجودة'), w: '35 %', d: L('Nonconforming deliveries (PPM) and complaints', 'Livraisons non conformes (PPM) et réclamations', 'التوريدات غير المطابقة (PPM) والشكاوى') }, { c: L('Delivery', 'Livraison', 'التسليم'), w: '25 %', d: L('On-time, in-full deliveries', 'Livraisons à l\'heure et complètes', 'التسليمات في الموعد وكاملة') },
    { c: L('Price', 'Prix', 'السعر'), w: '15 %', d: L('Competitiveness and stability', 'Compétitivité et stabilité', 'التنافسية والاستقرار') }, { c: L('Service', 'Service', 'الخدمة'), w: '15 %', d: L('Responsiveness and documentation', 'Réactivité et documentation', 'سرعة الاستجابة والتوثيق') }, { c: L('HSE', 'HSE', 'الصحة والسلامة والبيئة'), w: '10 %', d: L('Certification, incidents, compliance', 'Certification, incidents, conformité', 'الاعتماد والحوادث والامتثال') },
  ], L('Overall score (%) = weighted average. A ≥ 80 approved; B 65–79 approved with follow-up; C < 65 development plan or replacement.', 'Note globale (%) = moyenne pondérée. A ≥ 80 homologué ; B 65–79 homologué avec suivi ; C < 65 plan de progrès ou remplacement.', 'الدرجة الإجمالية (%) = المتوسط المرجح. A ≥ 80 معتمد؛ B 65–79 معتمد مع متابعة؛ C < 65 خطة تطوير أو استبدال.')),
  suppliers: (ctx) => SOURCES.suppliers_full(ctx),
  suppliers_full: (ctx) => table([col('c', H.code), col('t', H.supplier, 2.4), col('k', H.category, 1.8), col('x', L('Certification', 'Certification', 'الاعتماد'), 1.4), col('cr', L('Critical', 'Critique', 'حرج'), 0.8), col('q', 'Q'), col('d', 'D'), col('p', 'P'), col('s', 'S'), col('h', 'HSE'), col('o', L('Score (%)', 'Note (%)', 'الدرجة (%)')), col('cl', L('Class', 'Classe', 'الفئة')), col('st', H.status, 1.2), col('l', L('Last evaluation', 'Dernière évaluation', 'آخر تقييم'), 1.2), col('n', L('Next', 'Prochaine', 'التالي'), 1.2)],
    regs(ctx, 'suppliers').map(x => ({ c: x.code, t: x.title, k: x.d.category || '', x: x.d.certification || '', cr: yn(x.d.critical), q: x.d.quality ?? '', d: x.d.delivery ?? '', p: x.d.price ?? '', s: x.d.service ?? '', h: x.d.hse ?? '', o: x.d.score, cl: x.d.class || '', st: lab(x.status), l: x.d.lastEvaluation || '', n: x.d.nextEvaluation || '', _cells: { cl: x.d.class === 'A' ? 3 : x.d.class === 'B' ? 1 : 0 } }))),
  supplier_perf: (ctx) => table([col('t', H.supplier, 3), col('o', L('On-time delivery', 'Livraison à l\'heure', 'التسليم في الموعد')), col('p', 'PPM'), col('c', L('Complaints', 'Réclamations', 'الشكاوى')), col('a', H.action, 3)], regs(ctx, 'suppliers').map(x => ({ t: x.title, o: x.d.otd || '', p: x.d.ppm ?? '', c: x.d.complaints ?? '', a: x.d.action || L('Keep monitoring', 'Poursuivre la surveillance', 'مواصلة المراقبة') }))),
  // Operation
  ctrl_header: (ctx) => kv([[L('Control plan', 'Plan de surveillance', 'خطة الضبط'), `${ctx.org.short_code}-${ctx.p.ms_type}-CTRL`], [L('Products / services', 'Produits / services', 'المنتجات / الخدمات'), ctx.vars.product], [L('Operations', 'Opérations', 'العمليات'), ctx.vars.line], [L('Stage', 'Stade', 'المرحلة'), L('Production (series)', 'Production (série)', 'الإنتاج (تسلسلي)')], [L('Key contact', 'Contact clé', 'جهة الاتصال الرئيسية'), ctx.person('operations_manager')], [L('Core team', 'Équipe', 'الفريق'), cat(', ', ctx.person('operations_manager'), ctx.person('quality_manager'), ctx.person('process_excellence_manager'))]]),
  controlplan: (ctx) => table([col('n', '#', 0.5), col('o', L('Operation', 'Opération', 'العملية'), 1.8), col('c', L('Characteristic', 'Caractéristique', 'الخاصية'), 1.8), col('k', L('Product / process', 'Produit / procédé', 'منتج / عملية'), 1), col('cl', L('Class', 'Classe', 'الفئة'), 1), col('s', L('Specification / tolerance', 'Spécification / tolérance', 'المواصفة / التفاوت'), 2), col('m', L('Measurement technique', 'Technique de mesure', 'تقنية القياس'), 1.8), col('sz', L('Sample', 'Échantillon', 'العينة'), 0.9), col('f', H.frequency, 1.1), col('ct', L('Control method', 'Méthode de maîtrise', 'طريقة الضبط'), 1.8), col('r', H.responsible, 1.4), col('rec', H.record, 1.4), col('re', L('Reaction plan', 'Plan de réaction', 'خطة الاستجابة'), 2)],
    regs(ctx, 'controlplan').map((x, i) => ({ n: i + 1, o: x.title, c: x.d.characteristic, k: x.d.charType, cl: x.d.classification, s: x.d.specification, m: x.d.method, sz: x.d.sample, f: x.d.frequency, ct: x.d.control, r: roleName(x.d.responsible), rec: x.d.record, re: x.d.reaction, _cells: { cl: /Critical|Critique|حرج/.test(x.d.classification?.en || '') ? 0 : /Major/.test(x.d.classification?.en || '') ? 1 : 3 } })),
    L('Class: Critical (CC) affects safety or legal compliance; Major (SC) affects fit, function or customer satisfaction.', 'Classe : Critique (CC) touche la sécurité ou la conformité légale ; Majeure (SC) touche l\'aptitude, la fonction ou la satisfaction client.', 'الفئة: حرج (CC) يمس السلامة أو الامتثال القانوني؛ رئيسي (SC) يمس الملاءمة أو الوظيفة أو رضا العميل.')),
  ctrl_reaction: () => bullets([L('Stop the operation when a critical characteristic is out of specification; segregate and label the output.', 'Arrêter l\'opération lorsqu\'une caractéristique critique est hors spécification ; isoler et identifier la sortie.', 'إيقاف العملية عند خروج خاصية حرجة عن المواصفة وعزل المخرج وتعليمه.'), L('Check the outputs produced since the last good check; record them in the nonconforming outputs register.', 'Vérifier les sorties produites depuis le dernier contrôle bon ; les enregistrer au registre des éléments non conformes.', 'فحص المخرجات منذ آخر فحص سليم وتسجيلها في سجل المخرجات غير المطابقة.'), L('Correct the cause, restart after a first-off check approved by the supervisor.', 'Corriger la cause, redémarrer après un contrôle de première pièce approuvé par le responsable.', 'تصحيح السبب وإعادة التشغيل بعد فحص أول قطعة يعتمده المشرف.'), L('Open a nonconformity; a corrective action is required for repeated or critical cases.', 'Ouvrir une non-conformité ; une action corrective est requise pour les cas répétés ou critiques.', 'فتح حالة عدم مطابقة؛ ويلزم إجراء تصحيحي للحالات المتكررة أو الحرجة.')]),
  controls: (ctx) => {
    const cs = all('SELECT code, name, type, coso, frequency, owner_role, effectiveness FROM controls WHERE org_id=? AND standard=? ORDER BY code LIMIT 40', ctx.org.id, 'ISO 9001');
    return table([col('c', H.code), col('n', L('Control', 'Contrôle', 'الضابط'), 3), col('t', H.type), col('co', 'COSO', 1.4), col('f', H.frequency), col('o', H.owner, 2), col('e', L('Effectiveness', 'Efficacité', 'الفعالية'))], cs.map(c => ({ c: c.code, n: P(c.name), t: c.type, co: c.coso || '', f: lab(c.frequency), o: roleName(c.owner_role), e: lab(c.effectiveness) })));
  },
  rules: (ctx) => {
    const mps = new Set(all('SELECT mp_id FROM project_mps WHERE project_id=?', ctx.p.id).map(x => x.mp_id));
    const rs = ctx.cat.rules.filter(r => mps.has(r.mp)).slice(0, 40);
    return table([col('c', H.code), col('s', H.step), col('x', L('Condition', 'Condition', 'الشرط'), 3), col('a', H.action, 2)], rs.map(r => ({ c: r.id, s: r.step, x: r.condition, a: r.action })));
  },
  nco_summary: (ctx) => { const n = regs(ctx, 'nco'); const cost = n.reduce((a, x) => a + (x.d.cost || 0), 0); return kv([[L('Nonconforming outputs', 'Éléments non conformes', 'المخرجات غير المطابقة'), n.length], [L('Open', 'Ouverts', 'المفتوحة'), n.filter(x => x.status === 'Open').length], [L('Concessions', 'Dérogations', 'التنازلات'), n.filter(x => x.d.concession).length], [L('Cost of nonconforming outputs', 'Coût des éléments non conformes', 'تكلفة المخرجات غير المطابقة'), cost.toLocaleString('en')]]); },
  nco_full: (ctx) => table([col('c', H.code), col('n', L('NC ref.', 'Réf. NC', 'مرجع عدم المطابقة'), 1.6), col('d', H.date), col('t', H.description, 2.6), col('q', L('Qty', 'Qté', 'الكمية'), 0.6), col('w', L('Detected at', 'Détecté à', 'مكان الاكتشاف'), 1.2), col('p', L('Disposition', 'Traitement', 'المعالجة'), 1.6), col('a', L('Decided by', 'Décidé par', 'قرره'), 1.4), col('ci', L('Customer informed', 'Client informé', 'إعلام العميل')), col('k', L('Concession', 'Dérogation', 'التنازل')), col('co', L('Cost', 'Coût', 'التكلفة')), col('s', H.status)],
    regs(ctx, 'nco').map(x => ({ c: x.code, n: x.d.ncCode, d: x.d.date, t: x.title, q: x.d.quantity, w: x.d.detectedAt, p: x.d.disposition, a: x.d.authority, ci: yn(x.d.customerInformed), k: x.d.concession || '—', co: x.d.cost, s: lab(x.status) }))),
  reqreview: (ctx) => table([col('c', H.code), col('t', L('Request', 'Demande', 'الطلب'), 2), col('cu', H.customer, 1.6), col('y', H.type), col('d', H.date), col('r', L('Requirements reviewed', 'Exigences revues', 'المتطلبات المراجعة'), 3.6), col('a', L('Capability', 'Aptitude', 'القدرة'), 1.6), col('l', L('Lead time', 'Délai', 'المدة')), col('de', L('Decision', 'Décision', 'القرار'), 1.3), col('b', L('Reviewed by', 'Revu par', 'راجعه'), 1.4), col('cf', L('Confirmed', 'Confirmé', 'التأكيد'))],
    regs(ctx, 'reqreview').map(x => ({ c: x.code, t: x.title, cu: x.d.customer, y: x.d.type, d: x.d.date, r: cat(' ', x.d.requirements, x.d.conditions ? cat(' ', L('Condition:', 'Condition :', 'شرط:'), x.d.conditions) : ''), a: x.d.capability, l: x.d.leadTime, de: x.d.decision, b: x.d.reviewedBy, cf: x.d.confirmed }))),
  changes_customer: (ctx) => table([col('c', H.code), col('t', H.title, 3), col('d', H.date), col('r', L('Reason', 'Motif', 'السبب'), 3), col('s', H.status)], regs(ctx, 'changes', x => /Product|Process/.test(x.d.type?.en || '')).map(x => ({ c: x.code, t: x.title, d: x.d.date, r: x.d.reason, s: lab(x.status) }))),
  release_criteria: (ctx) => table([col('o', L('Operation', 'Opération', 'العملية'), 2), col('c', L('Criterion', 'Critère', 'المعيار'), 3), col('m', L('Verification', 'Vérification', 'التحقق'), 2), col('r', L('Authorized to release', 'Autorisé à libérer', 'المخول بالإفراج'), 2)], regs(ctx, 'controlplan', x => /Product/.test(x.d.charType?.en || '')).map(x => ({ o: x.title, c: x.d.specification, m: x.d.method, r: roleName(x.d.responsible) }))),
  releases: (ctx) => table([col('c', H.code, 1.6), col('t', L('Job / lot', 'Intervention / lot', 'العملية / الدفعة'), 2.4), col('d', H.date), col('k', L('Criteria', 'Critères', 'المعايير'), 3), col('r', H.result, 2), col('b', L('Released by', 'Libéré par', 'أفرج عنه'), 1.6), col('e', H.evidence), col('s', H.status)], regs(ctx, 'releases').map(x => ({ c: x.code, t: x.title, d: x.d.date, k: x.d.criteria, r: x.d.result, b: x.d.releasedBy, e: x.d.evidence, s: lab(x.status), _status: x.d.conform ? 3 : 1 }))),
  // Changes
  change_process: () => bullets([L('Request: any change to processes, products, services, organization, suppliers, IT or documents is requested in the application with its reason.', 'Demande : toute modification des processus, produits, services, organisation, fournisseurs, SI ou documents est demandée dans l\'application avec son motif.', 'الطلب: يُطلب أي تغيير في العمليات أو المنتجات أو الخدمات أو التنظيم أو الموردين أو النظم أو الوثائق في التطبيق مع سببه.'), L('Assessment: purpose and consequences, integrity of the management system, resources, responsibilities (ISO 9001 §6.3 a–d); risk scored likelihood × impact.', 'Évaluation : objet et conséquences, intégrité du système de management, ressources, responsabilités (ISO 9001 §6.3 a–d) ; risque coté probabilité × impact.', 'التقييم: الغرض والعواقب وسلامة نظام الإدارة والموارد والمسؤوليات (ISO 9001 §6.3 أ–د)؛ تقييم الخطر بالاحتمالية × الأثر.'), L('Approval by the management system manager (by top management when the risk is high).', 'Approbation par le responsable du système de management (par la direction si le risque est élevé).', 'الاعتماد من مسؤول نظام الإدارة (ومن الإدارة العليا إذا كان الخطر مرتفعًا).'), L('Implementation: documents, trainings and responsibilities updated before release; communication to users.', 'Mise en œuvre : documents, formations et responsabilités mis à jour avant mise en œuvre ; communication aux utilisateurs.', 'التنفيذ: تحديث الوثائق والتدريبات والمسؤوليات قبل التنفيذ وإبلاغ المستخدمين.'), L('Verification of effectiveness 30 days after implementation; review of the results retained (ISO 9001 §8.5.6).', 'Vérification de l\'efficacité 30 jours après la mise en œuvre ; résultats de la revue conservés (ISO 9001 §8.5.6).', 'التحقق من الفعالية بعد 30 يومًا من التنفيذ والاحتفاظ بنتائج المراجعة (ISO 9001 §8.5.6).')]),
  changes_full: (ctx) => table([col('c', H.code), col('t', L('Change', 'Modification', 'التغيير'), 2.4), col('y', H.type, 1.2), col('d', H.date), col('q', L('Requested by', 'Demandée par', 'طلبه'), 1.4), col('r', L('Reason', 'Motif', 'السبب'), 2.4), col('i', L('Impacted', 'Impacts', 'المتأثر'), 2.4), col('rs', L('Resources', 'Ressources', 'الموارد'), 1.8), col('a', L('Approved by / date', 'Approuvée par / date', 'اعتمده / التاريخ'), 1.8), col('p', L('Planned', 'Prévue', 'المخطط')), col('s', H.status)],
    regs(ctx, 'changes').map(x => ({ c: x.code, t: x.title, y: x.d.type, d: x.d.date, q: x.d.requester, r: x.d.reason, i: x.d.impacted, rs: x.d.resources, a: cat(' — ', x.d.approvedBy, x.d.approvalDate), p: x.d.plannedDate, s: lab(x.status) }))),
  change_risk: (ctx) => table([col('c', H.code), col('t', L('Change', 'Modification', 'التغيير'), 3), col('l', L('Likelihood', 'Probabilité', 'الاحتمالية')), col('i', L('Impact', 'Impact', 'الأثر')), col('s', H.score), col('v', L('Risk level', 'Niveau de risque', 'مستوى الخطر')), col('g', L('Integrity of the system', 'Intégrité du système', 'سلامة النظام'), 3)], regs(ctx, 'changes').map(x => ({ c: x.code, t: x.title, l: x.d.likelihood, i: x.d.impact, s: (x.d.likelihood || 0) * (x.d.impact || 0), v: x.d.riskLevel, g: x.d.integrity, _cells: { s: x.d.likelihood * x.d.impact >= 12 ? 0 : x.d.likelihood * x.d.impact >= 6 ? 1 : 3 } }))),
  change_verification: (ctx) => table([col('c', H.code), col('t', L('Change', 'Modification', 'التغيير'), 3), col('m', L('Implementation', 'Mise en œuvre', 'التنفيذ')), col('v', L('Verification of effectiveness', 'Vérification de l\'efficacité', 'التحقق من الفعالية'), 4), col('r', L('Post-change review', 'Revue après changement', 'المراجعة بعد التغيير'))], regs(ctx, 'changes').map(x => ({ c: x.code, t: x.title, m: x.d.implementation, v: x.d.verification || L('Pending', 'En attente', 'قيد الانتظار'), r: x.d.reviewDate }))),
  changes: (ctx) => {
    const ex = all(`SELECT step_id, fields, completed_at, completed_by FROM step_exec WHERE project_id=? AND form_kind='update' AND status='Done' ORDER BY completed_at DESC LIMIT 60`, ctx.p.id);
    return table([col('d', H.date), col('s', L('Change (step)', 'Modification (étape)', 'التغيير (الخطوة)'), 2), col('c', L('What changed', 'Ce qui a changé', 'ما الذي تغير'), 3), col('r', L('Reason', 'Motif', 'السبب'), 2), col('b', L('Authorized by', 'Autorisé par', 'اعتمده'), 2)],
      ex.map(e => { const f = P(e.fields) || {}; return { d: (e.completed_at || '').slice(0, 10), s: ctx.cat.stepById[e.step_id]?.name, c: f.change || '', r: f.reason || '', b: userName(e.completed_by) }; }));
  },
  // HSE
  aspects_full: (ctx) => { const rs = all("SELECT code, title, likelihood, impact, score, residual, owner_role, status, treatment FROM risks WHERE project_id=? AND kind='Aspect' ORDER BY score DESC", ctx.p.id); return table([col('c', H.code), col('a', L('Activity', 'Activité', 'النشاط'), 1.6), col('t', L('Aspect', 'Aspect', 'الجانب'), 2.4), col('i', L('Impact', 'Impact', 'الأثر'), 2), col('cd', L('Condition', 'Condition', 'الظرف')), col('f', L('Frequency (1–5)', 'Fréquence (1–5)', 'التكرار (1–5)')), col('g', L('Severity (1–5)', 'Gravité (1–5)', 'الشدة (1–5)')), col('s', L('Significance', 'Significativité', 'الأهمية')), col('sig', L('Significant', 'Significatif', 'هام')), col('lg', L('Legal link', 'Lien réglementaire', 'الارتباط القانوني')), col('ct', L('Control', 'Maîtrise', 'الضبط'), 2), col('o', H.owner, 1.6)], rs.map((x, i) => ({ c: x.code, a: ctx.vars.line, t: P(x.title), i: [L('Air pollution', 'Pollution de l\'air', 'تلوث الهواء'), L('Resource depletion', 'Épuisement des ressources', 'استنزاف الموارد'), L('Soil and water contamination', 'Contamination des sols et de l\'eau', 'تلوث التربة والمياه'), L('Waste generation', 'Production de déchets', 'إنتاج النفايات')][i % 4], cd: i === 2 ? L('Abnormal', 'Anormale', 'غير عادي') : L('Normal', 'Normale', 'عادي'), f: x.likelihood, g: x.impact, s: x.score, sig: yn(x.score >= 12), lg: yn(i % 2 === 0), ct: P(x.treatment) || '', o: roleName(x.owner_role), _cells: { s: x.score >= 12 ? 0 : x.score >= 8 ? 1 : 3 } }))); },
  aspects_method: () => para(L('Significance = frequency × severity (1–25). An aspect is significant when the score is 12 or more, or when it is linked to a compliance obligation or a complaint of an interested party. Significant aspects have an operational control and are considered when setting objectives.', 'Significativité = fréquence × gravité (1–25). Un aspect est significatif si la note est de 12 ou plus, ou s\'il est lié à une obligation de conformité ou à une plainte d\'une partie intéressée. Les aspects significatifs font l\'objet d\'une maîtrise opérationnelle et sont pris en compte dans les objectifs.', 'الأهمية = التكرار × الشدة (1–25). يكون الجانب هامًا إذا بلغت درجته 12 فأكثر أو ارتبط بالتزام امتثال أو بشكوى طرف معني. وتخضع الجوانب الهامة لضبط تشغيلي وتؤخذ في الاعتبار عند وضع الأهداف.')),
  hazards_full: (ctx) => { const rs = all("SELECT code, title, likelihood, impact, score, residual, owner_role, status, treatment FROM risks WHERE project_id=? AND kind='Hazard' ORDER BY score DESC", ctx.p.id); return table([col('c', H.code), col('a', L('Activity / task', 'Activité / tâche', 'النشاط / المهمة'), 1.6), col('t', L('Hazard', 'Danger', 'الخطر'), 2.2), col('h', L('Possible harm', 'Dommage possible', 'الضرر المحتمل'), 1.8), col('p', L('Persons exposed', 'Personnes exposées', 'الأشخاص المعرضون'), 1.4), col('l', 'P'), col('g', 'G'), col('s', 'R'), col('e', L('Existing controls', 'Mesures existantes', 'الضوابط القائمة'), 2), col('ad', L('Additional controls (hierarchy)', 'Mesures complémentaires (hiérarchie)', 'ضوابط إضافية (التسلسل)'), 2.4), col('r', L('Residual', 'Résiduel', 'المتبقي')), col('o', H.owner, 1.4)], rs.map((x, i) => ({ c: x.code, a: ctx.vars.line, t: P(x.title), h: [L('Fracture, crushing', 'Fracture, écrasement', 'كسر أو سحق'), L('Burns', 'Brûlures', 'حروق'), L('Musculoskeletal disorder', 'Trouble musculo-squelettique', 'اضطراب عضلي هيكلي'), L('Hearing loss', 'Perte auditive', 'فقدان السمع')][i % 4], p: L('Technicians; visitors', 'Techniciens ; visiteurs', 'الفنيون؛ الزوار'), l: x.likelihood, g: x.impact, s: x.score, e: L('Training; PPE', 'Formation ; EPI', 'التدريب؛ معدات الوقاية'), ad: P(x.treatment) || '', r: x.residual, o: roleName(x.owner_role), _cells: { s: x.score >= 15 ? 0 : x.score >= 8 ? 1 : 3 } }))); },
  hierarchy_controls: () => table([col('n', '#'), col('l', H.level, 2), col('e', L('Example', 'Exemple', 'مثال'), 4)], [
    { n: 1, l: L('Elimination', 'Élimination', 'الإزالة'), e: L('Remove the task or the hazard (design change)', 'Supprimer la tâche ou le danger (modification de conception)', 'إلغاء المهمة أو الخطر (تغيير التصميم)') }, { n: 2, l: L('Substitution', 'Substitution', 'الاستبدال'), e: L('Use a less hazardous product or process', 'Utiliser un produit ou procédé moins dangereux', 'استخدام منتج أو عملية أقل خطورة') },
    { n: 3, l: L('Engineering controls', 'Mesures techniques', 'الضوابط الهندسية'), e: L('Guards, ventilation, interlocks', 'Protecteurs, ventilation, verrouillages', 'الحواجز والتهوية والأقفال') }, { n: 4, l: L('Administrative controls', 'Mesures organisationnelles', 'الضوابط الإدارية'), e: L('Procedures, training, signage, permits to work', 'Procédures, formation, signalisation, permis de travail', 'الإجراءات والتدريب واللافتات وتصاريح العمل') },
    { n: 5, l: L('Personal protective equipment', 'Équipements de protection individuelle', 'معدات الوقاية الشخصية'), e: L('Last line of defence', 'Dernier rempart', 'خط الدفاع الأخير') },
  ]),
  epr_scenarios: (ctx) => table([col('s', L('Scenario', 'Scénario', 'السيناريو'), 1.6), col('r', L('Immediate response', 'Réponse immédiate', 'الاستجابة الفورية'), 3.4), col('o', H.responsible, 1.6), col('m', L('Resources', 'Moyens', 'الموارد'), 2)], [
    { s: L('Fire', 'Incendie', 'الحريق'), r: L('Raise the alarm, evacuate to the assembly point, call the fire brigade, use extinguishers only if trained and safe.', 'Donner l\'alerte, évacuer vers le point de rassemblement, appeler les pompiers, utiliser les extincteurs seulement si formé et sans danger.', 'إطلاق الإنذار والإخلاء إلى نقطة التجمع والاتصال بالإطفاء واستخدام الطفايات فقط عند التدريب والأمان.'), o: roleName('hse_manager'), m: L('Extinguishers, alarm, evacuation plan', 'Extincteurs, alarme, plan d\'évacuation', 'الطفايات والإنذار ومخطط الإخلاء') },
    { s: L('Injury', 'Blessure', 'الإصابة'), r: L('Give first aid, call the emergency services, secure the area, report the incident.', 'Porter les premiers secours, appeler les secours, sécuriser la zone, déclarer l\'incident.', 'تقديم الإسعافات الأولية والاتصال بالطوارئ وتأمين المكان والإبلاغ عن الحادث.'), o: roleName('operations_manager'), m: L('First aid kit, trained first aiders', 'Trousse de secours, sauveteurs formés', 'حقيبة الإسعاف ومسعفون مدربون') },
    { s: L('Spill', 'Déversement', 'الانسكاب'), r: L('Stop the leak, contain with the spill kit, protect drains, collect as hazardous waste, inform the HSE manager.', 'Arrêter la fuite, contenir avec le kit antipollution, protéger les regards, collecter comme déchet dangereux, informer le responsable HSE.', 'إيقاف التسرب والاحتواء بعدة الانسكاب وحماية المصارف وجمعه كنفايات خطرة وإبلاغ مسؤول السلامة.'), o: roleName('hse_manager'), m: L('Spill kits, retention trays', 'Kits antipollution, bacs de rétention', 'عدد الانسكاب وأحواض الاحتواء') },
    { s: L('Road accident', 'Accident de la route', 'حادث الطريق'), r: L('Secure the area, call the emergency services, inform the office, do not move the injured.', 'Sécuriser la zone, appeler les secours, prévenir le bureau, ne pas déplacer les blessés.', 'تأمين المكان والاتصال بالطوارئ وإبلاغ المكتب وعدم تحريك المصابين.'), o: roleName('operations_manager'), m: L('Vehicle kit, triangle, vest', 'Kit véhicule, triangle, gilet', 'عدة السيارة والمثلث والسترة') },
  ]),
  epr_roles: (ctx) => table([col('r', H.role, 2), col('n', H.name, 2), col('t', L('Tasks', 'Missions', 'المهام'), 4)], [
    { r: L('Emergency coordinator', 'Coordinateur d\'urgence', 'منسق الطوارئ'), n: ctx.person('hse_manager'), t: L('Decides evacuation, liaises with emergency services', 'Décide de l\'évacuation, fait le lien avec les secours', 'يقرر الإخلاء وينسق مع فرق الطوارئ') },
    { r: L('Evacuation guides', 'Guides d\'évacuation', 'مرشدو الإخلاء'), n: ctx.person('operations_manager'), t: L('Check areas are empty, count people at the assembly point', 'Vérifient que les zones sont vides, comptent les personnes au point de rassemblement', 'التحقق من خلو الأماكن وعدّ الأشخاص في نقطة التجمع') },
    { r: L('First aiders', 'Sauveteurs secouristes', 'المسعفون'), n: ctx.person('employee'), t: L('Give first aid until the emergency services arrive', 'Portent les premiers secours jusqu\'à l\'arrivée des secours', 'تقديم الإسعافات حتى وصول الطوارئ') },
  ]),
  epr_contacts: () => table([col('s', L('Service', 'Service', 'الخدمة'), 3), col('n', L('Number', 'Numéro', 'الرقم'), 2)], [{ s: L('Fire brigade and ambulance', 'Pompiers et ambulance', 'الإطفاء والإسعاف'), n: '15 / 150' }, { s: L('Police', 'Police', 'الشرطة'), n: '19' }, { s: L('Poison centre', 'Centre antipoison', 'مركز السموم'), n: '0801 000 180' }, { s: L('HSE manager (24/7)', 'Responsable HSE (24/7)', 'مسؤول السلامة (24/7)'), n: '+212 600 000 000' }]),
  incidents: (ctx) => SOURCES.incidents_full(ctx),
  incidents_full: (ctx) => table([col('c', H.code), col('t', L('Incident', 'Incident', 'الحادث'), 3), col('y', H.type, 1.4), col('d', H.date), col('l', L('Lost days', 'Jours perdus', 'الأيام الضائعة')), col('i', L('Investigated', 'Enquêté', 'تم التحقيق')), col('a', L('Immediate action and lesson', 'Action immédiate et enseignement', 'الإجراء الفوري والدرس'), 3), col('s', H.status)], regs(ctx, 'incidents').map(x => ({ c: x.code, t: x.title, y: x.d.type, d: x.d.date, l: x.d.lostDays ?? 0, i: yn(x.d.investigated), a: L('Area secured; cause analysed with the team; instruction and toolbox talk updated.', 'Zone sécurisée ; cause analysée avec l\'équipe ; instruction et quart d\'heure sécurité mis à jour.', 'تأمين المكان وتحليل السبب مع الفريق وتحديث التعليمات وحديث السلامة.'), s: lab(x.status) }))),
  // KPIs
  kpis: (ctx) => SOURCES.kpi_results(ctx),
  mp_kpis: (ctx) => kpiTable(ctx, ctx.mpId, true),
  kpi_summary: (ctx) => { const s = kpiStats(ctx); return kv([[L('Indicators', 'Indicateurs', 'المؤشرات'), s.total], [L('On target', 'Dans la cible', 'ضمن المستهدف'), `${s.on} (${s.pct} %)`], [L('Off target', 'Hors cible', 'خارج المستهدف'), s.off], [L('Improving', 'En amélioration', 'في تحسن'), s.up], [L('Period', 'Période', 'الفترة'), s.periods.join(' → ')]]); },
  kpi_results: (ctx) => kpiTable(ctx, null, false),
  kpi_results_short: (ctx) => kpiTable(ctx, null, false, 20),
  kpi_values: (ctx) => kpiTable(ctx, null, false),
  kpi_analysis: (ctx) => { const rows = kpiRows(ctx).filter(k => k.ok === false).slice(0, 15); return table([col('c', H.code), col('n', H.kpi, 3), col('v', L('Last value', 'Dernière valeur', 'آخر قيمة')), col('t', H.target), col('a', L('Analysis', 'Analyse', 'التحليل'), 3), col('x', H.action, 3), col('o', H.owner, 1.6)], rows.map(k => ({ c: k.code, n: k.name, v: k.last, t: k.target, a: k.trend === 'up' ? L('Improving but still below target; effect of actions visible over two periods.', 'En amélioration mais encore sous la cible ; effet des actions visible sur deux périodes.', 'في تحسن لكنه ما زال دون المستهدف؛ أثر الإجراءات ظاهر خلال فترتين.') : L('Off target for the period; causes analysed at the monthly performance review.', 'Hors cible sur la période ; causes analysées en revue mensuelle de performance.', 'خارج المستهدف للفترة؛ تُحلَّل الأسباب في المراجعة الشهرية للأداء.'), x: L('Action plan opened; progress checked at the next review.', 'Plan d\'actions ouvert ; avancement vérifié à la prochaine revue.', 'فتح خطة عمل والتحقق من التقدم في المراجعة القادمة.'), o: k.owner }))); },
  kpi_definitions: (ctx) => { const ks = all('SELECT code, name, formula, unit, target_text, direction, frequency, analysis_frequency, owner_role, source FROM kpis WHERE project_id=? ORDER BY code LIMIT 60', ctx.p.id); return table([col('c', H.code), col('n', H.kpi, 2.4), col('f', L('Formula', 'Formule', 'الصيغة'), 3), col('u', L('Unit', 'Unité', 'الوحدة'), 0.7), col('t', H.target), col('d', L('Direction', 'Sens', 'الاتجاه'), 0.9), col('fr', L('Measured', 'Mesure', 'القياس')), col('a', L('Analysed', 'Analyse', 'التحليل')), col('s', L('Data source', 'Source des données', 'مصدر البيانات'), 1.4), col('o', H.owner, 1.6)], ks.map(k => ({ c: k.code, n: P(k.name), f: P(k.formula), u: k.unit || '', t: k.target_text, d: k.direction === 'down' ? L('Lower is better', 'Plus bas = mieux', 'الأقل أفضل') : L('Higher is better', 'Plus haut = mieux', 'الأعلى أفضل'), fr: lab(k.frequency), a: lab(k.analysis_frequency), s: k.source === 'core' ? L('DynamicMS records', 'Enregistrements DynamicMS', 'سجلات DynamicMS') : L('Process data', 'Données du processus', 'بيانات العملية'), o: roleName(k.owner_role) }))); },
  // Audits
  audprg_intro: (ctx) => kv([
    [L('Objectives', 'Objectifs', 'الأهداف'), L('Verify conformity to the standards and to our own requirements, the effective implementation and maintenance of the system, and find improvement opportunities.', 'Vérifier la conformité aux normes et à nos propres exigences, la mise en œuvre et la tenue à jour efficaces du système, et identifier des pistes d\'amélioration.', 'التحقق من المطابقة للمعايير ولمتطلباتنا والتطبيق الفعال للنظام وصيانته وتحديد فرص التحسين.')],
    [L('Extent', 'Étendue', 'النطاق'), cat(' ', L('All processes of the scope, every site, over a 3-year cycle;', 'Tous les processus du périmètre, tous les sites, sur un cycle de 3 ans ;', 'جميع العمليات المشمولة وكل المواقع خلال دورة 3 سنوات؛'), ctx.standards.join(', '))],
    [L('Frequency rule', 'Règle de fréquence', 'قاعدة التكرار'), L('Set per process from its importance, its risks and the results of previous audits: critical processes at least every 6 months, others annually or every 2–3 years; a custom frequency may be set with justification.', 'Fixée par processus selon son importance, ses risques et les résultats des audits précédents : processus critiques au moins tous les 6 mois, autres annuellement ou tous les 2–3 ans ; une fréquence personnalisée peut être fixée avec justification.', 'يُحدد لكل عملية حسب أهميتها ومخاطرها ونتائج التدقيقات السابقة: العمليات الحرجة كل 6 أشهر على الأقل، والأخرى سنويًا أو كل 2–3 سنوات؛ ويمكن تحديد تكرار مخصص مع التبرير.')],
    [L('Methods', 'Méthodes', 'الطرق'), L('On-site and remote audits: interviews, observation, sampling of records (ISO 19011 Annex A).', 'Audits sur site et à distance : entretiens, observation, échantillonnage d\'enregistrements (ISO 19011 annexe A).', 'تدقيقات ميدانية وعن بعد: مقابلات وملاحظة وأخذ عينات من السجلات (ISO 19011 الملحق A).')],
    [L('Resources', 'Ressources', 'الموارد'), L('Qualified internal auditors independent of the area audited; external auditor for the mock audit.', 'Auditeurs internes qualifiés indépendants de la zone auditée ; auditeur externe pour l\'audit à blanc.', 'مدققون داخليون مؤهلون مستقلون عن المجال المدقق؛ مدقق خارجي للتدقيق التجريبي.')],
    [L('Risks to the programme', 'Risques du programme', 'مخاطر البرنامج'), L('Auditor availability, changes in the organization; mitigated by a backup auditor and a quarterly review of the programme.', 'Disponibilité des auditeurs, changements d\'organisation ; atténués par un auditeur suppléant et une revue trimestrielle du programme.', 'توفر المدققين وتغييرات التنظيم؛ يُخفف ذلك بمدقق احتياطي ومراجعة ربع سنوية للبرنامج.')],
  ]),
  audit_universe: (ctx) => {
    const mps = all('SELECT mp_id, owner_role FROM project_mps WHERE project_id=?', ctx.p.id).map(x => ({ ...x, m: ctx.cat.mpById[x.mp_id] })).filter(x => x.m.tier <= 2 || procKind(x.m) === 'C').slice(0, 20);
    const auds = all('SELECT code, planned_date, processes, status FROM audits WHERE project_id=?', ctx.p.id).map(a => ({ ...a, ps: P(a.processes) || [] }));
    return table([col('p', H.process, 3), col('o', H.owner, 2), col('i', L('Importance / risk', 'Importance / risque', 'الأهمية / الخطر'), 1.2), col('f', H.frequency, 1.2), col('l', L('Last audit', 'Dernier audit', 'آخر تدقيق'), 1.2), col('n', L('Next audit', 'Prochain audit', 'التدقيق التالي'), 1.2)],
      mps.map((x, i) => { const hi = procKind(x.m) === 'C' || i % 4 === 0; const done = auds.filter(a => a.ps.includes(x.mp_id) && a.status === 'Completed').map(a => a.planned_date).sort(); const next = auds.filter(a => a.ps.includes(x.mp_id) && a.status !== 'Completed').map(a => a.planned_date).sort(); return { p: mpLabel(ctx, x.mp_id), o: roleName(x.owner_role), i: hi ? L('High', 'Élevée', 'عالية') : L('Medium', 'Moyenne', 'متوسطة'), f: lab(hi ? 'Semi-annual' : 'Annual'), l: done.pop() || '—', n: next[0] || '—', _cells: { i: hi ? 1 : 3 } }; }));
  },
  audits: (ctx) => SOURCES.audits_full(ctx),
  audits_full: (ctx) => {
    const as = all(`SELECT a.*, u.name lead FROM audits a LEFT JOIN users u ON u.id=a.lead_user WHERE a.project_id=? ORDER BY a.planned_date`, ctx.p.id);
    return table([col('c', H.code, 1.8), col('t', H.type), col('s', L('Scope / processes', 'Périmètre / processus', 'النطاق / العمليات'), 2.6), col('k', L('Criteria', 'Critères', 'المعايير'), 2), col('f', H.frequency, 1.4), col('d', L('Planned date', 'Date prévue', 'التاريخ المخطط'), 1.2), col('h', L('Duration (h)', 'Durée (h)', 'المدة (س)'), 0.8), col('l', L('Audit team', 'Équipe d\'audit', 'فريق التدقيق'), 1.8), col('st', H.status)],
      as.map(a => ({ c: a.code, t: lab(a.type), s: cat(' — ', P(a.scope), (P(a.processes) || []).map(p => ctx.cat.mpById[p]?.code).join(', ')), k: P(a.criteria) || a.standard, f: a.frequency === 'Custom' ? cat(': ', lab('Custom'), P(a.frequency_custom) || '') : lab(a.frequency), d: a.planned_date, h: a.duration_h ?? '', l: val(P(a.team)) || a.lead || '', st: lab(a.status), _status: a.status === 'Completed' ? 3 : a.planned_date < ctx.vars.date ? 1 : undefined })));
  },
  audits_done: (ctx) => SOURCES.audits_full(ctx),
  auditors: (ctx) => { const tr = regs(ctx, 'training', x => /19011/.test(x.title.en)); const cm = regs(ctx, 'competence', x => /19011/.test(x.title.en)); const names = [...new Set([ctx.person('audit_manager'), ctx.person(ctx.qhse ? 'hse_manager' : 'process_excellence_manager'), ctx.person('auditor')])].filter(Boolean); return table([col('n', H.name, 2), col('r', H.role, 2), col('q', L('Qualification', 'Qualification', 'التأهيل'), 3), col('i', L('Independence', 'Indépendance', 'الاستقلالية'), 3)], names.map((n, i) => ({ n, r: i === 2 ? L('External auditor', 'Auditeur externe', 'مدقق خارجي') : i === 0 ? L('Lead auditor', 'Auditeur responsable', 'المدقق الرئيسي') : L('Auditor', 'Auditeur', 'مدقق'), q: i === 0 ? cat(' ', tr[0]?.title || 'ISO 19011', cm[0] ? cat(' — ', L('level', 'niveau', 'المستوى'), cm[0].d.level) : '') : i === 2 ? L('Certified lead auditor (IRCA)', 'Auditeur responsable certifié (IRCA)', 'مدقق رئيسي معتمد (IRCA)') : L('ISO 19011 training; 2 witnessed audits', 'Formation ISO 19011 ; 2 audits observés', 'تدريب ISO 19011؛ تدقيقان تحت الملاحظة'), i: L('Does not audit own work', 'N\'audite pas son propre travail', 'لا يدقق عمله الخاص') }))); },
  freq_legend: () => table([col('f', H.frequency, 1.4), col('u', L('Typical use', 'Usage type', 'الاستخدام المعتاد'), 4)], [
    { f: lab('Monthly'), u: L('Process under close watch after a major nonconformity', 'Processus sous surveillance renforcée après une non-conformité majeure', 'عملية تحت مراقبة مشددة بعد عدم مطابقة رئيسية') }, { f: lab('Quarterly'), u: L('Critical processes with recent changes', 'Processus critiques ayant connu des changements récents', 'عمليات حرجة شهدت تغييرات حديثة') },
    { f: lab('Semi-annual'), u: L('Core and high-risk processes', 'Processus de réalisation et à risque élevé', 'العمليات الأساسية وعالية الخطورة') }, { f: lab('Annual'), u: L('Management and support processes', 'Processus de management et de support', 'العمليات الإدارية والداعمة') },
    { f: lab('Every 2 years'), u: L('Stable, low-risk processes with good results', 'Processus stables, à faible risque et aux bons résultats', 'عمليات مستقرة منخفضة الخطورة وجيدة النتائج') }, { f: lab('Every 3 years'), u: L('Minimum: every process at least once per certification cycle', 'Minimum : chaque processus au moins une fois par cycle de certification', 'الحد الأدنى: كل عملية مرة واحدة على الأقل في كل دورة اعتماد') },
    { f: lab('Custom'), u: L('Any other frequency, with its justification (e.g. once before the certification audit)', 'Toute autre fréquence, avec sa justification (ex. une fois avant l\'audit de certification)', 'أي تكرار آخر مع تبريره (مثل مرة قبل تدقيق الاعتماد)') },
  ]),
  audit_header: (ctx) => {
    const a = auditOf(ctx); if (!a) return null;
    return kv([[L('Audit reference', 'Référence de l\'audit', 'مرجع التدقيق'), a.code], [L('Audit type', 'Type d\'audit', 'نوع التدقيق'), lab(a.type)], [H.date, a.done_date || a.planned_date], [L('Duration', 'Durée', 'المدة'), a.duration_h ? `${a.duration_h} h` : ''], [L('Objectives', 'Objectifs', 'الأهداف'), P(a.objectives) || ''], [L('Scope', 'Périmètre', 'النطاق'), cat(' — ', P(a.scope), (P(a.processes) || []).map(p => mpLabel(ctx, p)).reduce((acc, x) => cat('; ', acc, x), ''))], [L('Criteria', 'Critères', 'المعايير'), P(a.criteria) || a.standard], [L('Lead auditor', 'Auditeur responsable', 'المدقق الرئيسي'), a.lead || ''], [L('Audit team', 'Équipe d\'audit', 'فريق التدقيق'), val(P(a.team))], [L('Auditees', 'Audités', 'الجهات المدققة'), val(P(a.auditees))], [L('Method', 'Méthode', 'الطريقة'), P(a.method) || ''], [H.frequency, a.frequency === 'Custom' ? cat(': ', lab('Custom'), P(a.frequency_custom) || '') : lab(a.frequency)]]);
  },
  audit_summary: (ctx) => {
    const a = auditOf(ctx); if (!a) return null; const fs = findingsOf(ctx, a);
    const n = (t) => fs.filter(f => f.type === t).length;
    return [kv([[lab('Major'), n('Major')], [lab('Minor'), n('Minor')], [lab('Observation'), n('Observation')], [lab('OFI'), n('OFI')]]), para(n('Major') ? L('The management system is implemented, but a major nonconformity puts the achievement of intended results at risk in the area audited; a corrective action plan is required within 30 days.', 'Le système de management est mis en œuvre, mais une non-conformité majeure compromet l\'atteinte des résultats attendus dans la zone auditée ; un plan d\'actions correctives est exigé sous 30 jours.', 'نظام الإدارة مطبق، لكن عدم مطابقة رئيسية تهدد تحقيق النتائج المرجوة في المجال المدقق؛ ويلزم تقديم خطة إجراءات تصحيحية خلال 30 يومًا.') : L('The management system is effectively implemented and maintained in the area audited and conforms to the audit criteria, except for the minor nonconformities listed, which do not affect the ability to achieve intended results.', 'Le système de management est efficacement mis en œuvre et tenu à jour dans la zone auditée et conforme aux critères d\'audit, à l\'exception des non-conformités mineures listées, qui n\'affectent pas l\'aptitude à atteindre les résultats attendus.', 'نظام الإدارة مطبق ومُصان بفعالية في المجال المدقق ومطابق لمعايير التدقيق باستثناء حالات عدم المطابقة الثانوية المذكورة التي لا تؤثر في القدرة على تحقيق النتائج المرجوة.'))];
  },
  audit_strengths: (ctx) => bullets([fillText(L('Clear commitment of the management team and good knowledge of the policy by the staff interviewed.', 'Engagement clair de l\'équipe de direction et bonne connaissance de la politique par le personnel interrogé.', 'التزام واضح من فريق الإدارة ومعرفة جيدة بالسياسة لدى العاملين الذين تمت مقابلتهم.'), ctx.vars), L('Process records complete and easy to retrieve in the application.', 'Enregistrements des processus complets et faciles à retrouver dans l\'application.', 'سجلات العمليات مكتملة وسهلة الاسترجاع في التطبيق.'), L('KPI dashboard updated monthly with owners named.', 'Tableau de bord KPI mis à jour mensuellement avec des responsables nommés.', 'تحديث لوحة المؤشرات شهريًا مع تسمية المسؤولين.')]),
  audit_findings: (ctx) => { const a = auditOf(ctx); if (!a) return null; return table([col('c', L('Finding', 'Constat', 'الملاحظة'), 1.2), col('g', L('Grading', 'Qualification', 'التصنيف'), 1.8), col('k', H.clause), col('a', L('Area', 'Zone', 'المجال'), 1.2), col('t', H.description, 4), col('d', H.due, 1.2), col('s', H.status)], findingsOf(ctx, a).map(f => ({ c: f.code || '', g: lab(f.type), k: f.clause, a: P(f.area) || '', t: P(f.text), d: f.due_date || '—', s: lab(f.status), _cells: { g: f.type === 'Major' ? 0 : f.type === 'Minor' ? 1 : 3 } }))); },
  audit_nc_detail: (ctx) => {
    const a = auditOf(ctx); if (!a) return null;
    const ncs = findingsOf(ctx, a).filter(f => ['Major', 'Minor'].includes(f.type));
    if (!ncs.length) return para(L('No nonconformity was raised during this audit.', 'Aucune non-conformité n\'a été relevée lors de cet audit.', 'لم تُسجل أي حالة عدم مطابقة خلال هذا التدقيق.'));
    const out = [];
    for (const f of ncs) {
      out.push(sub(cat(' — ', f.code || '', lab(f.type), `§${f.clause}`)));
      const act = f.action_id ? get('SELECT a.title, a.status, a.due_date, u.name owner FROM actions a LEFT JOIN users u ON u.id=a.owner_user WHERE a.id=?', f.action_id) : null;
      out.push(kv([
        [L('Classification', 'Qualification', 'التصنيف'), cat(' — ', lab(f.type), f.type === 'Major' ? L('absence or breakdown of a system requirement; conformity or effectiveness at risk', 'absence ou défaillance d\'une exigence du système ; conformité ou efficacité compromise', 'غياب متطلب في النظام أو انهياره؛ المطابقة أو الفعالية مهددة') : L('isolated lapse; does not affect the ability of the system to achieve intended results', 'défaillance ponctuelle ; n\'affecte pas l\'aptitude du système à atteindre les résultats attendus', 'إخفاق منفرد لا يؤثر في قدرة النظام على تحقيق النتائج المرجوة'))],
        [L('Requirement (criterion)', 'Exigence (critère)', 'المتطلب (المعيار)'), P(f.requirement) || `§${f.clause}`],
        [L('Nonconformity statement', 'Énoncé de la non-conformité', 'بيان عدم المطابقة'), P(f.text)],
        [L('Objective evidence', 'Preuve objective', 'الدليل الموضوعي'), P(f.evidence) || ''],
        [L('Process / area', 'Processus / zone', 'العملية / المجال'), cat(' — ', mpLabel(ctx, f.mp_id), P(f.area) || '')], [L('Auditee', 'Audité', 'الجهة المدققة'), f.auditee || ''],
        [L('Correction', 'Correction', 'التصحيح'), P(f.correction) || ''], [L('Root cause (auditee)', 'Cause racine (audité)', 'السبب الجذري (الجهة المدققة)'), P(f.root_cause) || ''],
        [L('Corrective action', 'Action corrective', 'الإجراء التصحيحي'), act ? cat(' — ', P(act.title), act.owner || '', cat(' ', L('due', 'échéance', 'الاستحقاق'), act.due_date), lab(act.status)) : L('To be defined by the auditee', 'À définir par l\'audité', 'تحددها الجهة المدققة')],
        [L('Response due', 'Réponse attendue', 'موعد الرد'), f.due_date || ''], [L('Verification of effectiveness', 'Vérification de l\'efficacité', 'التحقق من الفعالية'), f.verification ? cat(' — ', P(f.verification), f.verified_at) : L('Pending', 'En attente', 'قيد الانتظار')], [H.status, lab(f.status)],
      ]));
    }
    return out;
  },
  audit_ofi: (ctx) => { const a = auditOf(ctx); if (!a) return null; return table([col('c', L('Finding', 'Constat', 'الملاحظة')), col('g', L('Grading', 'Qualification', 'التصنيف'), 1.6), col('k', H.clause), col('t', H.description, 4), col('e', H.evidence, 3)], findingsOf(ctx, a).filter(f => ['Observation', 'OFI'].includes(f.type)).map(f => ({ c: f.code || '', g: lab(f.type), k: f.clause, t: P(f.text), e: P(f.evidence) || '' }))); },
  finding_grading: () => table([col('g', L('Grading', 'Qualification', 'التصنيف'), 1.6), col('d', L('Definition', 'Définition', 'التعريف'), 4), col('r', L('Response expected', 'Réponse attendue', 'الاستجابة المتوقعة'), 2.4)], [
    { g: lab('Major'), d: L('Absence or total breakdown of a required process or requirement, or a situation that raises significant doubt about conformity of products and services or the achievement of intended results.', 'Absence ou défaillance totale d\'un processus ou d\'une exigence, ou situation qui met sérieusement en doute la conformité des produits et services ou l\'atteinte des résultats attendus.', 'غياب عملية أو متطلب مطلوب أو انهياره كليًا، أو وضع يثير شكًا كبيرًا في مطابقة المنتجات والخدمات أو تحقيق النتائج المرجوة.'), r: L('Correction and corrective action plan within 30 days; verification before closure', 'Correction et plan d\'actions correctives sous 30 jours ; vérification avant clôture', 'التصحيح وخطة إجراءات تصحيحية خلال 30 يومًا؛ التحقق قبل الإغلاق') },
    { g: lab('Minor'), d: L('Isolated failure to meet a requirement that does not affect the ability of the management system to achieve its intended results.', 'Manquement ponctuel à une exigence qui n\'affecte pas l\'aptitude du système de management à atteindre les résultats attendus.', 'إخفاق منفرد في متطلب لا يؤثر في قدرة نظام الإدارة على تحقيق نتائجه المرجوة.'), r: L('Correction and corrective action within 60 days; verified at the next audit', 'Correction et action corrective sous 60 jours ; vérifiées à l\'audit suivant', 'التصحيح والإجراء التصحيحي خلال 60 يومًا؛ التحقق في التدقيق التالي') },
    { g: lab('Observation'), d: L('Situation that could lead to a nonconformity if not addressed.', 'Situation qui pourrait conduire à une non-conformité si elle n\'est pas traitée.', 'وضع قد يؤدي إلى عدم مطابقة إذا لم يُعالج.'), r: L('Considered by the process owner; no formal response required', 'Prise en compte par le pilote ; pas de réponse formelle exigée', 'يأخذها مالك العملية بالاعتبار؛ لا يلزم رد رسمي') },
    { g: lab('OFI'), d: L('Possible improvement of efficiency or effectiveness; not a nonconformity.', 'Amélioration possible de l\'efficience ou de l\'efficacité ; pas une non-conformité.', 'تحسين ممكن للكفاءة أو الفعالية؛ ليس عدم مطابقة.'), r: L('Recorded in the improvement plan at the owner\'s discretion', 'Inscrite au plan d\'amélioration à l\'appréciation du pilote', 'تُسجل في خطة التحسين حسب تقدير المالك') },
  ]),
  audit_conclusion: (ctx) => { const a = auditOf(ctx); if (!a) return null; const fs = findingsOf(ctx, a); return kv([[L('Conclusion', 'Conclusion', 'الخلاصة'), fs.some(f => f.type === 'Major') ? L('Conformity not demonstrated in the area audited until the major nonconformity is closed.', 'Conformité non démontrée dans la zone auditée tant que la non-conformité majeure n\'est pas levée.', 'لم تثبت المطابقة في المجال المدقق حتى إغلاق عدم المطابقة الرئيسية.') : L('The area audited conforms to the audit criteria; the system is effective.', 'La zone auditée est conforme aux critères d\'audit ; le système est efficace.', 'المجال المدقق مطابق لمعايير التدقيق والنظام فعال.')], [L('Follow-up', 'Suivi', 'المتابعة'), L('Corrective actions tracked in the application; effectiveness verified by the lead auditor.', 'Actions correctives suivies dans l\'application ; efficacité vérifiée par l\'auditeur responsable.', 'تُتابع الإجراءات التصحيحية في التطبيق ويتحقق المدقق الرئيسي من فعاليتها.')], [L('Distribution', 'Diffusion', 'التوزيع'), cat(', ', roleName('top_management'), roleName('ims_manager'), L('auditees', 'audités', 'الجهات المدققة'))], [L('Limitations', 'Limites', 'القيود'), L('Audit based on sampling; nonconformities may exist in areas not sampled.', 'Audit fondé sur l\'échantillonnage ; des non-conformités peuvent exister dans les zones non échantillonnées.', 'تدقيق قائم على العينات؛ قد توجد حالات عدم مطابقة في مجالات لم تُفحص.')]]); },
  findings: (ctx) => { const fs = all('SELECT a.code, f.type, f.clause, f.text, f.status FROM findings f JOIN audits a ON a.id=f.audit_id WHERE a.project_id=? ORDER BY a.planned_date', ctx.p.id); return table([col('a', L('Audit', 'Audit', 'التدقيق'), 2), col('t', L('Grading', 'Qualification', 'التصنيف'), 1.6), col('c', H.clause), col('x', L('Finding', 'Constat', 'الملاحظة'), 4), col('s', H.status)], fs.map(f => ({ a: f.code, t: lab(f.type), c: f.clause, x: P(f.text), s: lab(f.status), _cells: { t: f.type === 'Major' ? 0 : f.type === 'Minor' ? 1 : 3 } }))); },
  // Management review
  mr_header: (ctx) => { const mr = regs(ctx, 'reviews').pop(); return kv([[L('Meeting', 'Réunion', 'الاجتماع'), mr ? cat(' ', mr.code, mr.title) : ''], [H.date, mr?.d.date || ctx.vars.date], [L('Location', 'Lieu', 'المكان'), cat(' — ', ctx.vars.city, L('meeting room', 'salle de réunion', 'قاعة الاجتماعات'))], [L('Chair', 'Président', 'الرئيس'), ctx.vars.ceo], [L('Attendees', 'Participants', 'الحضور'), val(mr?.d.attendees || [])], [L('Secretary', 'Secrétaire', 'أمين السر'), ctx.person('ims_manager')], [L('Previous review', 'Revue précédente', 'المراجعة السابقة'), regs(ctx, 'reviews').slice(-2, -1)[0]?.d.date || '—']]); },
  mr_agenda: () => bullets([L('Status of actions from previous reviews', 'État des actions des revues précédentes', 'حالة إجراءات المراجعات السابقة'), L('Changes in external and internal issues', 'Modifications des enjeux externes et internes', 'تغيرات القضايا الخارجية والداخلية'), L('Performance and effectiveness: customer satisfaction, objectives, processes, nonconformities, monitoring, audits, external providers', 'Performance et efficacité : satisfaction client, objectifs, processus, non-conformités, surveillance, audits, prestataires externes', 'الأداء والفعالية: رضا العملاء والأهداف والعمليات وحالات عدم المطابقة والمراقبة والتدقيقات ومقدمو الخدمات'), L('Adequacy of resources', 'Adéquation des ressources', 'كفاية الموارد'), L('Effectiveness of actions on risks and opportunities', 'Efficacité des actions face aux risques et opportunités', 'فعالية الإجراءات تجاه المخاطر والفرص'), L('Opportunities for improvement; decisions', 'Opportunités d\'amélioration ; décisions', 'فرص التحسين؛ القرارات')]),
  mr_inputs: (ctx) => {
    const s = kpiStats(ctx); const n = all('SELECT stage FROM ncs WHERE project_id=?', ctx.p.id); const f = all('SELECT f.type FROM findings f JOIN audits a ON a.id=f.audit_id WHERE a.project_id=?', ctx.p.id);
    const acts = all("SELECT status FROM actions WHERE project_id=? AND kind='Review decision'", ctx.p.id); const sup = regs(ctx, 'suppliers'); const obj = regs(ctx, 'objectives');
    const sat = kpiRows(ctx).find(k => k.code === 'Q-KPI-01');
    const rows = [
      ['a', L('Status of actions from previous reviews', 'État des actions des revues précédentes', 'حالة إجراءات المراجعات السابقة'), cat(' ', acts.filter(x => x.status === 'Closed').length, '/', acts.length, L('closed', 'clôturées', 'مغلقة')), acts.length && acts.every(x => x.status === 'Closed') ? 3 : 1],
      ['b', L('Changes in external and internal issues', 'Modifications des enjeux externes et internes', 'تغيرات القضايا الخارجية والداخلية'), cat(' ', regs(ctx, 'context').length, L('issues reviewed; no change in scope', 'enjeux revus ; pas de changement de périmètre', 'قضية تمت مراجعتها؛ دون تغيير في النطاق')), 3],
      ['c1', L('Customer satisfaction and feedback', 'Satisfaction et retours clients', 'رضا العملاء وملاحظاتهم'), sat ? cat(' ', sat.last, L('vs target', 'pour une cible de', 'مقابل المستهدف'), sat.target) : '—', sat ? RAG(sat.ok) : undefined],
      ['c2', L('Extent to which objectives have been met', 'Degré de réalisation des objectifs', 'مدى تحقيق الأهداف'), cat(' ', obj.filter(o => o.status === 'On track').length, '/', obj.length, L('on track', 'en bonne voie', 'على المسار')), obj.every(o => o.status === 'On track') ? 3 : 1],
      ['c3', L('Process performance and conformity', 'Performance des processus et conformité', 'أداء العمليات والمطابقة'), cat(' ', s.on, '/', s.total, L('indicators on target', 'indicateurs dans la cible', 'مؤشرًا ضمن المستهدف')), s.pct >= 80 ? 3 : 1],
      ['c4', L('Nonconformities and corrective actions', 'Non-conformités et actions correctives', 'حالات عدم المطابقة والإجراءات التصحيحية'), cat(' ', n.length, L('recorded,', 'enregistrées,', 'مسجلة،'), n.filter(x => x.stage === 'Closed').length, L('closed', 'clôturées', 'مغلقة')), n.filter(x => x.stage !== 'Closed').length > 3 ? 1 : 3],
      ['c5', L('Monitoring and measurement results', 'Résultats de la surveillance et de la mesure', 'نتائج المراقبة والقياس'), cat(' ', L('Trend over', 'Tendance sur', 'الاتجاه خلال'), s.periods.length, L('periods;', 'périodes ;', 'فترات؛'), s.up, L('improving', 'en amélioration', 'في تحسن')), 3],
      ['c6', L('Audit results', 'Résultats d\'audit', 'نتائج التدقيق'), cat(' ', f.filter(x => x.type === 'Major').length, L('major,', 'majeures,', 'رئيسية،'), f.filter(x => x.type === 'Minor').length, L('minor,', 'mineures,', 'ثانوية،'), f.filter(x => ['Observation', 'OFI'].includes(x.type)).length, L('observations / OFI', 'observations / pistes', 'ملاحظات / فرص')), f.some(x => x.type === 'Major') ? 0 : 3],
      ['c7', L('Performance of external providers', 'Performance des prestataires externes', 'أداء مقدمي الخدمات الخارجيين'), cat(' ', sup.filter(x => x.d.class === 'A').length, L('class A,', 'classe A,', 'فئة A،'), sup.filter(x => x.d.class === 'B').length, 'B,', sup.filter(x => x.d.class === 'C').length, 'C'), sup.some(x => x.d.class === 'C') ? 1 : 3],
      ['d', L('Adequacy of resources', 'Adéquation des ressources', 'كفاية الموارد'), L('Adequate; one additional technician requested for peak season', 'Adéquates ; un technicien supplémentaire demandé pour la haute saison', 'كافية؛ طُلب فني إضافي لموسم الذروة'), 1],
      ['e', L('Effectiveness of actions on risks and opportunities', 'Efficacité des actions face aux risques et opportunités', 'فعالية الإجراءات تجاه المخاطر والفرص'), cat(' ', all("SELECT COUNT(*) n FROM risks WHERE project_id=? AND status='Treated'", ctx.p.id)[0].n, L('risks treated', 'risques traités', 'خطرًا معالجًا')), 3],
      ['f', L('Opportunities for improvement', 'Opportunités d\'amélioration', 'فرص التحسين'), cat(' ', regs(ctx, 'ideas').length, L('ideas in the improvement plan', 'idées au plan d\'amélioration', 'فكرة في خطة التحسين')), 3],
    ];
    if (ctx.qhse) rows.push(['h', L('Compliance obligations, incidents and consultation of workers', 'Obligations de conformité, incidents et consultation des travailleurs', 'التزامات الامتثال والحوادث واستشارة العاملين'), cat(' ', regs(ctx, 'incidents').length, L('incidents; compliance evaluated', 'incidents ; conformité évaluée', 'حوادث؛ تم تقييم الامتثال')), 3]);
    return table([col('k', '§9.3.2', 0.7), col('i', L('Input', 'Élément d\'entrée', 'المدخل'), 3), col('s', L('Status and trend', 'État et tendance', 'الحالة والاتجاه'), 3), col('r', L('Assessment', 'Appréciation', 'التقدير'))], rows.map(([k, i, s, r]) => ({ k, i, s, r: r === 3 ? L('Satisfactory', 'Satisfaisant', 'مرضٍ') : r === 0 ? L('Action required', 'Action requise', 'يتطلب إجراء') : L('To watch', 'À surveiller', 'تحت المراقبة'), _cells: { r } })));
  },
  mr_outputs: (ctx) => {
    const acts = all(`SELECT a.title, a.status, a.due_date, u.name owner FROM actions a LEFT JOIN users u ON u.id=a.owner_user WHERE a.project_id=? AND a.kind='Review decision' ORDER BY a.due_date LIMIT 30`, ctx.p.id);
    const kinds = [L('Improvement', 'Amélioration', 'تحسين'), L('Change to the management system', 'Modification du système', 'تغيير في النظام'), L('Resources', 'Ressources', 'الموارد')];
    const rows = acts.map((a, i) => ({ d: P(a.title), k: kinds[i % 3], o: a.owner || '', due: a.due_date, s: lab(a.status) }));
    if (!rows.length) rows.push({ d: L('Recruit one technician for the peak season', 'Recruter un technicien pour la haute saison', 'توظيف فني لموسم الذروة'), k: kinds[2], o: ctx.person('hr_manager'), due: '', s: lab('Open') });
    return table([col('d', L('Decision / action', 'Décision / action', 'القرار / الإجراء'), 4), col('k', L('Category (§9.3.3)', 'Catégorie (§9.3.3)', 'الفئة (§9.3.3)'), 2), col('o', H.owner, 2), col('due', H.due), col('s', H.status)], rows);
  },
  mr_conclusion: (ctx) => { const s = kpiStats(ctx); return kv([[L('Suitability', 'Pertinence', 'الملاءمة'), L('The management system remains suitable to the context and strategic direction.', 'Le système de management reste pertinent au regard du contexte et de l\'orientation stratégique.', 'يبقى نظام الإدارة ملائمًا للسياق والتوجه الاستراتيجي.')], [L('Adequacy', 'Adéquation', 'الكفاية'), L('Resources and documented information are adequate, subject to the decisions above.', 'Les ressources et informations documentées sont adéquates, sous réserve des décisions ci-dessus.', 'الموارد والمعلومات الموثقة كافية رهنًا بالقرارات أعلاه.')], [L('Effectiveness', 'Efficacité', 'الفعالية'), cat(' ', s.pct, L('% of indicators on target; objectives followed; audits and corrective actions effective.', '% des indicateurs dans la cible ; objectifs suivis ; audits et actions correctives efficaces.', '% من المؤشرات ضمن المستهدف؛ الأهداف متابعة؛ التدقيقات والإجراءات التصحيحية فعالة.'))], [L('Next review', 'Prochaine revue', 'المراجعة التالية'), L('In six months', 'Dans six mois', 'بعد ستة أشهر')]]); },
  // Nonconformities and 8D
  nc_summary: (ctx) => { const n = all('SELECT criticality, stage, cost FROM ncs WHERE project_id=?', ctx.p.id); return kv([[L('Nonconformities', 'Non-conformités', 'حالات عدم المطابقة'), n.length], [L('Critical / major', 'Critiques / majeures', 'حرجة / رئيسية'), n.filter(x => ['Critical', 'Major'].includes(x.criticality)).length], [L('Open', 'Ouvertes', 'مفتوحة'), n.filter(x => x.stage !== 'Closed').length], [L('Cost of nonconformities', 'Coût des non-conformités', 'تكلفة حالات عدم المطابقة'), n.reduce((a, x) => a + (x.cost || 0), 0).toLocaleString('en')]]); },
  ncs: (ctx) => ncTable(ctx, ''),
  ncs_short: (ctx) => ncTable(ctx, ''),
  ncs_major: (ctx) => ncTable(ctx, "AND criticality IN ('Major','Critical')"),
  ncs_full: (ctx) => {
    const ns = all(`SELECT n.id, n.code, n.title, n.source, n.category, n.criticality, n.stage, n.detected_at, n.due_date, n.closed_at, n.root_cause, n.cost, u.name owner FROM ncs n LEFT JOIN users u ON u.id=n.owner_user WHERE n.project_id=? ORDER BY n.detected_at`, ctx.p.id);
    return table([col('c', H.code, 1.8), col('t', L('Nonconformity', 'Non-conformité', 'عدم المطابقة'), 2.6), col('s', L('Source', 'Source', 'المصدر')), col('k', L('Criticality', 'Criticité', 'الخطورة')), col('d', L('Detected', 'Détectée', 'تاريخ الاكتشاف'), 1.1), col('o', H.owner, 1.4), col('co', L('Correction', 'Correction', 'التصحيح'), 1.8), col('r', L('Root cause', 'Cause racine', 'السبب الجذري'), 2.4), col('ca', L('Corrective action', 'Action corrective', 'الإجراء التصحيحي'), 2.4), col('due', H.due, 1.1), col('e', L('Effectiveness', 'Efficacité', 'الفعالية'), 1.2), col('st', H.status)],
      ns.map(n => { const acts = all("SELECT kind, title, effectiveness FROM actions WHERE source_type='nc' AND source_id=?", n.id); const cont = acts.find(a => a.kind === 'Containment'); const corr = acts.find(a => a.kind === 'Corrective'); return { c: n.code, t: P(n.title), s: lab(n.source), k: lab(n.criticality), d: n.detected_at, o: n.owner || '', co: cont ? P(cont.title) : '', r: P(n.root_cause) || '', ca: corr ? P(corr.title) : '', due: n.due_date, e: corr?.effectiveness ? lab(corr.effectiveness) : '', st: lab(n.stage), _cells: { k: n.criticality === 'Critical' ? 0 : n.criticality === 'Major' ? 1 : 3 } }; }));
  },
  capa_d0: (ctx) => { const c = capaOf(ctx); if (!c) return null; const n = get('SELECT * FROM ncs WHERE project_id=? AND code=?', ctx.p.id, c.d.ncCode); return kv([[L('8D report', 'Rapport 8D', 'تقرير 8D'), c.code], [L('Nonconformity', 'Non-conformité', 'عدم المطابقة'), cat(' — ', c.d.ncCode, c.title)], [L('Source', 'Source', 'المصدر'), lab(n?.source)], [L('Criticality', 'Criticité', 'الخطورة'), lab(n?.criticality)], [L('Opened', 'Ouvert le', 'تاريخ الفتح'), c.d.opened], [L('Champion', 'Pilote', 'المسؤول'), c.d.champion], [L('Priority', 'Priorité', 'الأولوية'), c.d.priority], [H.status, lab(c.status)]]); },
  capa_d1: (ctx) => { const c = capaOf(ctx); if (!c) return null; return table([col('n', H.name, 2), col('r', H.role, 2), col('f', L('Role in the team', 'Rôle dans l\'équipe', 'الدور في الفريق'), 2)], (c.d.team || []).map(t => ({ n: t.name, r: roleName(t.role), f: t.fn }))); },
  capa_d2: (ctx) => { const c = capaOf(ctx); if (!c) return null; return kv([[L('What', 'Quoi', 'ماذا'), c.d.what], [L('Where', 'Où', 'أين'), c.d.where], [L('When', 'Quand', 'متى'), c.d.when], [L('Who', 'Qui', 'من'), c.d.who], [L('How many', 'Combien', 'كم'), c.d.howMany], [L('How detected', 'Comment détecté', 'كيف اكتُشف'), c.d.howDetected], [L('Why it is a problem', 'Pourquoi c\'est un problème', 'لماذا يعد مشكلة'), c.d.why]]); },
  capa_d3: (ctx) => { const c = capaOf(ctx); if (!c) return null; return table([col('a', H.action, 4), col('o', H.owner, 2), col('d', H.date), col('r', H.result, 3)], (c.d.containment || []).map(x => ({ a: x.action, o: x.owner, d: x.date, r: x.result }))); },
  capa_d4: (ctx) => { const c = capaOf(ctx); if (!c) return null; const ik = c.d.ishikawa || {}; return [sub(L('Ishikawa (6M)', 'Ishikawa (6M)', 'إيشيكاوا (6M)')), table([col('m', L('Category', 'Catégorie', 'الفئة'), 1.4), col('c', L('Possible cause and verification', 'Cause possible et vérification', 'السبب المحتمل والتحقق'), 4)], [['man', L('Man', 'Main-d\'œuvre', 'الإنسان')], ['method', L('Method', 'Méthode', 'الطريقة')], ['machine', L('Machine', 'Machine', 'الآلة')], ['material', L('Material', 'Matière', 'المادة')], ['measurement', L('Measurement', 'Mesure', 'القياس')], ['environment', L('Environment', 'Milieu', 'البيئة')]].map(([k, l]) => ({ m: l, c: ik[k] || '' }))), sub(L('5 Whys', '5 pourquoi', 'لماذا الخمسة')), table([col('n', '#', 0.4), col('w', L('Why?', 'Pourquoi ?', 'لماذا؟'), 6)], (c.d.whys || []).map((w, i) => ({ n: i + 1, w }))), sub(L('Verified root causes', 'Causes racines vérifiées', 'الأسباب الجذرية المؤكدة')), para(c.d.rootCause)]; },
  capa_d5: (ctx) => { const c = capaOf(ctx); if (!c) return null; return [table([col('a', L('Permanent corrective action', 'Action corrective permanente', 'الإجراء التصحيحي الدائم'), 3.4), col('o', H.owner, 1.8), col('d', H.due), col('v', L('Verification / evidence', 'Vérification / preuve', 'التحقق / الدليل'), 3)], (c.d.corrective || []).map(x => ({ a: x.action, o: x.owner, d: x.due, v: x.verification }))), kv([[L('Validation of effectiveness', 'Validation de l\'efficacité', 'التحقق من الفعالية'), c.d.validation || L('In progress', 'En cours', 'قيد التنفيذ')]])]; },
  capa_d7: (ctx) => { const c = capaOf(ctx); if (!c) return null; return bullets(c.d.prevention || []); },
  capa_d8: (ctx) => { const c = capaOf(ctx); if (!c) return null; return kv([[L('Lessons learned', 'Enseignements', 'الدروس المستفادة'), c.d.lessons], [L('Closure date', 'Date de clôture', 'تاريخ الإغلاق'), c.d.closed || L('Open', 'Ouvert', 'مفتوح')], [L('Closed by', 'Clôturé par', 'أغلقه'), c.d.closedBy || '—'], [L('Team recognition', 'Reconnaissance de l\'équipe', 'تقدير الفريق'), L('Team thanked at the monthly quality meeting', 'Équipe remerciée en réunion qualité mensuelle', 'شكر الفريق في اجتماع الجودة الشهري')]]); },
  rex: (ctx) => { const xs = all('SELECT went_well, not_well, recommendation, category FROM rex WHERE project_id=? ORDER BY created_at DESC LIMIT 10', ctx.p.id); return table([col('c', H.category), col('w', L('What went well', 'Ce qui a bien fonctionné', 'ما نجح'), 2), col('n', L('What did not', 'Ce qui n\'a pas fonctionné', 'ما لم ينجح'), 2), col('r', L('Recommendation', 'Recommandation', 'التوصية'), 2)], xs.map(x => ({ c: lab(x.category), w: P(x.went_well), n: P(x.not_well), r: P(x.recommendation) }))); },
  // Improvement
  ideas: (ctx) => SOURCES.ideas_full(ctx),
  ideas_full: (ctx) => table([col('c', H.code), col('t', L('Opportunity', 'Piste', 'الفرصة'), 3), col('s', L('Source', 'Source', 'المصدر'), 1.4), col('b', L('Submitted by', 'Proposée par', 'اقترحها'), 1.6), col('r', L('ROI (%)', 'ROI (%)', 'العائد (%)')), col('e', L('Effort', 'Effort', 'الجهد')), col('p', L('Priority', 'Priorité', 'الأولوية')), col('st', H.status)], regs(ctx, 'ideas').map(x => { const pr = x.d.roi >= 250 && x.d.effort !== 'High' ? 'A' : x.d.roi >= 150 ? 'B' : 'C'; return { c: x.code, t: x.title, s: L('Staff suggestion', 'Suggestion du personnel', 'اقتراح العاملين'), b: x.d.submittedBy, r: x.d.roi, e: lab(x.d.effort), p: pr, st: lab(x.status), _cells: { p: pr === 'A' ? 3 : pr === 'B' ? 1 : 2 } }; }), L('Priority A: ROI ≥ 250 % and effort low or medium; B: ROI ≥ 150 %; C: others.', 'Priorité A : ROI ≥ 250 % et effort faible ou moyen ; B : ROI ≥ 150 % ; C : autres.', 'الأولوية A: عائد ≥ 250 % وجهد منخفض أو متوسط؛ B: عائد ≥ 150 %؛ C: غير ذلك.')),
  actions_objectives: (ctx) => actionTable(ctx, "(a.source_type='objective' OR (a.source_type='step' AND a.source_id IN (SELECT id FROM step_exec WHERE project_id=a.project_id AND mp_id IN ('MP-003','MP-150'))))"),
  actions_corrective: (ctx) => actionTable(ctx, "a.kind IN ('Corrective','Containment','Preventive')"),
  actions_improvement: (ctx) => actionTable(ctx, "a.kind='Improvement'"),
  actions_review: (ctx) => actionTable(ctx, "a.source_type='step' AND a.kind='Review decision'"),
};

const PROC_KIND = { 'FN-10': 'C', 'FN-11': 'C', 'FN-03': 'C', 'FN-07': 'S', 'FN-08': 'S', 'FN-09': 'S', 'FN-13': 'S' };
const procKind = (m) => PROC_KIND[m.function] || 'M';
const procType = (m) => ({ M: L('Management', 'Management', 'إدارية'), C: L('Core (realization)', 'Réalisation', 'أساسية'), S: L('Support', 'Support', 'داعمة') }[procKind(m)]);
function sipocTable(ctx, mpId) {
  const rows = stepSipoc(ctx, mpId);
  return table([col('n', '#', 0.5), col('p', L('Step (P)', 'Étape (P)', 'الخطوة (P)'), 2.6), col('s', L('Suppliers (S)', 'Fournisseurs (S)', 'الموردون (S)'), 1.6), col('i', L('Inputs (I)', 'Entrées (I)', 'المدخلات (I)'), 2.2), col('o', L('Outputs (O)', 'Sorties (O)', 'المخرجات (O)'), 2.2), col('c', L('Customers (C)', 'Clients (C)', 'العملاء (C)'), 1.6), col('r', L('Responsible', 'Responsable', 'المسؤول'), 1.4)],
    rows.map((x, i) => ({ n: i + 1, p: cat(' ', x.step.id, x.step.name), s: x.S, i: x.I, o: x.O, c: x.C, r: x.R })), L('SIPOC per step: the supplier and input of a step are the role and output of the previous step; the first step receives the inputs of the process and the last step delivers its outputs.', 'SIPOC par étape : le fournisseur et l\'entrée d\'une étape sont le rôle et la sortie de l\'étape précédente ; la première étape reçoit les entrées du processus et la dernière livre ses sorties.', 'SIPOC لكل خطوة: مورد الخطوة ومدخلها هما دور الخطوة السابقة ومخرجها؛ تتلقى الخطوة الأولى مدخلات العملية وتسلم الأخيرة مخرجاتها.'));
}
function mpGoNoGo(ctx, mpId) {
  const m = ctx.cat.mpById[mpId];
  const ex = all('SELECT status FROM step_exec WHERE project_id=? AND mp_id=?', ctx.p.id, mpId);
  const done = ex.filter(e => e.status === 'Done').length;
  const go = ex.length && done === ex.length;
  return [kv([
    [L('Go criteria', 'Critères Go', 'معايير المتابعة'), cat('; ', L('all mandatory steps completed', 'toutes les étapes obligatoires terminées', 'إكمال جميع الخطوات الإلزامية'), cat(' ', L('outputs approved:', 'sorties approuvées :', 'اعتماد المخرجات:'), cat(', ', ...(m.sipoc.O || []).slice(0, 3))), L('no open critical risk or nonconformity', 'aucun risque ni non-conformité critique ouvert', 'عدم وجود خطر أو عدم مطابقة حرجة مفتوحة'))],
    [L('No-Go handling', 'Traitement du No-Go', 'معالجة التوقف'), L('Steps not meeting the criteria are reopened with justification (Recycle); the process owner informs the phase gate.', 'Les étapes ne satisfaisant pas aux critères sont rouvertes avec justification (Recycle) ; le pilote informe le jalon de phase.', 'تُعاد فتح الخطوات غير المستوفية للمعايير مع التبرير (إعادة) ويُبلغ مالك العملية بوابة المرحلة.')],
    [L('Decided by', 'Décidé par', 'يقرره'), roleName(m.ownerRoleCode || 'ims_manager')],
    [L('Current status', 'État actuel', 'الحالة الحالية'), cat(' ', done, '/', ex.length, L('steps done —', 'étapes faites —', 'خطوات منجزة —'), go ? 'Go' : L('not yet', 'pas encore', 'ليس بعد'))],
  ])];
}
function auditOf(ctx) {
  const id = ctx.target?.audit;
  const a = id ? get('SELECT a.*, u.name lead FROM audits a LEFT JOIN users u ON u.id=a.lead_user WHERE a.id=?', id) : get(`SELECT a.*, u.name lead FROM audits a LEFT JOIN users u ON u.id=a.lead_user WHERE a.project_id=? AND a.status='Completed' ORDER BY a.planned_date DESC LIMIT 1`, ctx.p.id);
  return a || null;
}
const findingsOf = (ctx, a) => all('SELECT * FROM findings WHERE audit_id=? ORDER BY code', a.id);
function capaOf(ctx) {
  const list = regs(ctx, 'capa');
  if (ctx.target?.nc) { const n = get('SELECT code FROM ncs WHERE id=?', ctx.target.nc); return list.find(c => c.d.ncCode === n?.code) || null; }
  return list[0] || null;
}
function kpiRows(ctx, mpId) {
  const periods = all('SELECT DISTINCT v.period FROM kpi_values v JOIN kpis k ON k.id=v.kpi_id WHERE k.project_id=? ORDER BY v.period DESC LIMIT 6', ctx.p.id).map(x => x.period).reverse();
  const ks = all(`SELECT id, code, name, target_text, direction, owner_role, unit FROM kpis WHERE project_id=? ${mpId ? 'AND mp_id=?' : ''} ORDER BY code`, ...(mpId ? [ctx.p.id, mpId] : [ctx.p.id]));
  return ks.map(k => {
    const vals = Object.fromEntries(all('SELECT period, value FROM kpi_values WHERE kpi_id=?', k.id).map(v => [v.period, v.value]));
    const series = periods.map(p => vals[p]);
    const last = series[series.length - 1] ?? null; const prev = series[series.length - 2] ?? null;
    const m = String(k.target_text || '').replace(',', '.').match(/(-?\d+(?:\.\d+)?)/); const t = m ? +m[1] : null;
    const ok = t === null || last === null ? null : k.direction === 'down' ? last <= t : last >= t;
    const better = last === null || prev === null ? null : k.direction === 'down' ? last < prev : last > prev;
    return { id: k.id, code: k.code, name: P(k.name), target: k.target_text || '', last, ok, trend: better === null || last === prev ? 'flat' : better ? 'up' : 'down', owner: roleName(k.owner_role), series, periods };
  });
}
function kpiStats(ctx) {
  const rows = kpiRows(ctx);
  const on = rows.filter(r => r.ok === true).length;
  return { total: rows.length, on, off: rows.filter(r => r.ok === false).length, pct: rows.length ? Math.round((on / rows.length) * 100) : 0, up: rows.filter(r => r.trend === 'up').length, periods: rows[0]?.periods || [] };
}
function kpiTable(ctx, mpId, short, limit = 60) {
  const rows = kpiRows(ctx, mpId).slice(0, limit);
  const periods = rows[0]?.periods || [];
  const arrow = { up: '↑', down: '↓', flat: '→' };
  const shown = short ? periods.slice(-3) : periods;
  return table([col('c', H.code), col('n', H.kpi, 3), col('t', H.target), ...shown.map(p => col(p, p, 0.9)), col('tr', L('Trend', 'Tendance', 'الاتجاه'), 0.8), col('s', H.status), col('o', H.owner, 1.6)],
    rows.map(r => ({ c: r.code, n: r.name, t: r.target, ...Object.fromEntries(shown.map(p => [p, r.series[periods.indexOf(p)] ?? ''])), tr: arrow[r.trend], s: r.ok === null ? '' : r.ok ? L('On target', 'Dans la cible', 'ضمن المستهدف') : L('Off target', 'Hors cible', 'خارج المستهدف'), o: r.owner, _status: RAG(r.ok) })),
    L('Trend: ↑ better than the previous period, ↓ worse, → unchanged (according to the direction of the indicator).', 'Tendance : ↑ meilleure que la période précédente, ↓ moins bonne, → inchangée (selon le sens de l\'indicateur).', 'الاتجاه: ↑ أفضل من الفترة السابقة، ↓ أسوأ، → دون تغيير (حسب اتجاه المؤشر).'));
}
function racsiTable(ctx, mpId, e2e) {
  const acts = all(`SELECT id, name, mp_id FROM racsi_activities WHERE project_id=? AND linked_type='mp' ${mpId ? 'AND mp_id=?' : ''} ${e2e ? 'AND e2e_id=?' : ''} ORDER BY e2e_id`, ctx.p.id, ...(mpId ? [mpId] : []), ...(e2e ? [e2e] : []));
  const rows = acts.map(a => {
    const as = all('SELECT letter, assignee FROM racsi_assignments WHERE activity_id=?', a.id);
    const pick = (l) => cat(', ', ...as.filter(x => x.letter === l).map(x => roleName(x.assignee)));
    return { m: ctx.cat.mpById[a.mp_id] ? mpLabel(ctx, a.mp_id) : P(a.name), R: pick('R'), A: pick('A'), C: pick('C'), S: pick('S'), I: pick('I') };
  });
  return table([col('m', H.process, 3), col('R', 'R'), col('A', 'A'), col('C', 'C'), col('S', 'S'), col('I', 'I')], rows, L('R Responsible · A Accountable (one only) · C Consulted · S Support · I Informed', 'R Réalise · A Approuve (un seul) · C Consulté · S Support · I Informé', 'R المنفذ · A المساءل (واحد فقط) · C المستشار · S الداعم · I المُبلَّغ'));
}
function riskTable(ctx, where, full) {
  const rs = all(`SELECT code, title, category, likelihood, impact, score, residual, owner_role, status, treatment, controls FROM risks WHERE project_id=? AND ${where} ORDER BY score DESC`, ctx.p.id);
  if (!full) return table([col('c', H.code), col('t', H.description, 3), col('l', 'L'), col('i', 'I'), col('s', H.score), col('r', L('Residual', 'Résiduel', 'المتبقي')), col('tr', L('Treatment', 'Traitement', 'المعالجة')), col('o', H.owner, 2), col('st', H.status)],
    rs.map(x => ({ c: x.code, t: P(x.title), l: x.likelihood, i: x.impact, s: x.score, r: x.residual, tr: P(x.treatment) || '', o: roleName(x.owner_role), st: lab(x.status), _cells: { s: x.score >= 15 ? 0 : x.score >= 8 ? 1 : 3 } })));
  return table([col('c', H.code, 1.2), col('t', L('Risk', 'Risque', 'الخطر'), 2.6), col('k', H.category, 1.2), col('cs', L('Cause', 'Cause', 'السبب'), 1.8), col('cq', L('Consequence', 'Conséquence', 'العاقبة'), 1.8), col('ex', L('Existing controls', 'Maîtrises existantes', 'الضوابط القائمة'), 1.6), col('l', 'L', 0.5), col('i', 'I', 0.5), col('s', H.score, 0.7), col('tr', L('Treatment', 'Traitement', 'المعالجة'), 1.4), col('r', L('Residual', 'Résiduel', 'المتبقي'), 0.8), col('o', H.owner, 1.6), col('st', H.status)],
    rs.map(x => ({ c: x.code, t: P(x.title), k: x.category, cs: L('Process variability; workload peaks', 'Variabilité du processus ; pics de charge', 'تباين العملية؛ ذروات العمل'), cq: L('Customer dissatisfaction; cost; loss of certification', 'Insatisfaction client ; coût ; perte de certification', 'عدم رضا العملاء؛ التكلفة؛ فقدان الاعتماد'), ex: (P(x.controls) || []).join(', '), l: x.likelihood, i: x.impact, s: x.score, tr: P(x.treatment) || '', r: x.residual, o: roleName(x.owner_role), st: lab(x.status), _cells: { s: x.score >= 15 ? 0 : x.score >= 8 ? 1 : 3 } })));
}
function actionTable(ctx, where) {
  const as = all(`SELECT a.title, a.kind, a.status, a.start_date, a.due_date, a.pct, a.effectiveness, u.name owner, v.name evaluator FROM actions a LEFT JOIN users u ON u.id=a.owner_user LEFT JOIN users v ON v.id=a.evaluator_user WHERE a.project_id=? AND ${where} ORDER BY a.due_date LIMIT 150`, ctx.p.id);
  return table([col('t', H.action, 3.4), col('k', H.type, 1.2), col('o', H.owner, 1.6), col('st', L('Start', 'Début', 'البداية'), 1.1), col('d', H.due, 1.1), col('p', '%', 0.6), col('e', L('Verified by', 'Vérifiée par', 'تحقق منها'), 1.6), col('f', L('Effectiveness', 'Efficacité', 'الفعالية'), 1.2), col('s', H.status)], as.map(a => ({ t: P(a.title), k: lab(a.kind), o: a.owner || '', st: a.start_date || '', d: a.due_date, p: a.pct, e: a.evaluator || '', f: lab(a.effectiveness), s: lab(a.status) })));
}
function ncTable(ctx, extra) {
  const ns = all(`SELECT code, title, source, criticality, stage, detected_at, closed_at, root_cause FROM ncs WHERE project_id=? ${extra} ORDER BY detected_at`, ctx.p.id);
  return table([col('c', H.code, 2), col('t', L('Nonconformity', 'Non-conformité', 'عدم المطابقة'), 3), col('s', L('Source', 'Source', 'المصدر')), col('k', L('Criticality', 'Criticité', 'الخطورة')), col('d', L('Detected', 'Détectée', 'تاريخ الاكتشاف')), col('r', L('Root cause', 'Cause racine', 'السبب الجذري'), 3), col('st', H.status)],
    ns.map(n => ({ c: n.code, t: P(n.title), s: lab(n.source), k: lab(n.criticality), d: n.detected_at, r: P(n.root_cause) || '', st: lab(n.stage) })));
}

// SVG of a diagram block in one language (for the document page of the web client).
export function diagramSvg(b, lang) {
  const spec = JSON.parse(JSON.stringify(b.spec), (k, v) => (v && typeof v === 'object' && !Array.isArray(v) && 'en' in v && 'fr' in v ? loc(v, lang) : v));
  return (b.diagram === 'pmap' ? processMapSvg(spec) : bpmnSvgVertical(spec)).svg;
}

// The names of the data sources, for the template editor.
export const SOURCE_NAMES = Object.keys(SOURCES).sort();

// Builds the structured content of a document from its template and the project's data.
export function buildContent(projectId, templateCode, opts = {}) {
  const t = opts.template || templateByCode[templateCode];
  if (!t) return null;
  const cat2 = catalog();
  const extra = { docId: opts.docId || null, mpId: opts.mpId || t.mp, e2e: opts.e2e || null, target: opts.target || {}, t, date: opts.date };
  const vars = {};
  if (extra.e2e) vars.phase = cat2.e2eById[extra.e2e]?.name;
  if (extra.mpId && cat2.mpById[extra.mpId]) vars.mp = cat2.mpById[extra.mpId].name;
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
        else if (SOURCES[name]) block = SOURCES[name](ctx, arg);
      } catch (e) { block = para(L(`Data not available (${e.message}).`, `Données indisponibles (${e.message}).`, `البيانات غير متاحة (${e.message}).`)); }
      const blocks = (Array.isArray(block) ? block : [block]).filter(Boolean).filter(b => !(b.kind === 'table' && !b.rows.length) && !(b.kind === 'bullets' && !b.items.length));
      out.blocks = blocks.length ? blocks : [para(empty)];
      out.source = src;
    }
    if (s.type === 'signature') out.blocks = [signatureBlock(ctx, opts)];
    return out;
  });
  return { format: 'structured', template: t.code, toc: !!t.toc, cover: t.cover !== false, numbered: !!t.toc, generatedAt: new Date().toISOString(), sections };
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
  return kv([
    [L('Frequency', 'Fréquence', 'التكرار'), lab(f.frequency)], [L('Review date', 'Date de revue', 'تاريخ المراجعة'), f.date || ''], [L('Next review', 'Prochaine revue', 'المراجعة التالية'), f.nextDate || ''],
    [L('Chaired by', 'Présidée par', 'يرأسها'), roleName(f.chair)], ...(f.decisions || []).map(d => [L('Decision', 'Décision', 'القرار'), d.decision]),
  ]);
}
function signatureBlock(ctx, opts) {
  const owner = opts.ownerRole || ctx.t?.owner || 'ims_manager';
  const approver = opts.approverRole || 'top_management';
  return table([col('r', L('Role', 'Rôle', 'الدور'), 2), col('n', L('Name', 'Nom', 'الاسم'), 2), col('f', L('Function', 'Fonction', 'الوظيفة'), 2), col('d', H.date), col('s', L('Signature', 'Signature', 'التوقيع'), 2)], [
    { r: L('Prepared by', 'Rédigé par', 'أعده'), n: ctx.person('document_controller'), f: roleName('document_controller'), d: opts.date || '', s: '' },
    { r: L('Reviewed by', 'Vérifié par', 'راجعه'), n: ctx.person(owner), f: roleName(owner), d: opts.date || '', s: '' },
    { r: L('Approved by', 'Approuvé par', 'اعتمده'), n: ctx.person(approver), f: roleName(approver), d: opts.date || '', s: '' },
  ]);
}

// Render model (localized) for the document renderer. Every section holds a list of items:
// { type: 'sub' | 'text' | 'bullets' | 'table' | 'kv' | 'diagram', ... }.
export function documentModel(doc, version, lang, layout = {}) {
  const content = P(version.content);
  const org = get('SELECT name, short_code FROM organizations WHERE id=?', doc.org_id);
  const t = templateByCode[doc.template_id] || null;
  const tr = (v) => loc(v, lang) ?? '';
  const strCell = (v) => (Array.isArray(v) ? v.map(tr).join(', ') : tr(v));
  const sections = [];
  const numbered = !!(content && content.format === 'structured' && content.numbered);
  if (content && content.format === 'structured') {
    let n = 0;
    for (const s of content.sections) {
      n += 1; let m = 0;
      const heading = numbered ? `${n}. ${tr(s.title)}` : tr(s.title);
      const items = [];
      if (s.text) items.push({ type: 'text', text: tr(s.text) });
      const blocks = s.blocks || (s.block ? [s.block] : []);
      for (const b of blocks) {
        if (!b) continue;
        if (b.kind === 'sub') { m += 1; items.push({ type: 'sub', text: numbered ? `${n}.${m} ${tr(b.text)}` : tr(b.text) }); }
        else if (b.kind === 'text') items.push({ type: 'text', text: tr(b.text) });
        else if (b.kind === 'bullets') items.push({ type: 'bullets', intro: b.intro ? tr(b.intro) : undefined, items: b.items.map(tr) });
        else if (b.kind === 'kv') items.push({ type: 'kv', rows: b.rows.map(([k, v]) => [tr(k), strCell(v)]) });
        else if (b.kind === 'table') items.push({ type: 'table', table: { columns: b.columns.map(c => ({ key: c.key, label: tr(c.label), width: c.width })), rows: b.rows.map(r => { const o = {}; for (const c of b.columns) o[c.key] = strCell(r[c.key]); if (r._status !== undefined) o._status = r._status; if (r._cells) o._cells = r._cells; return o; }), caption: b.caption ? tr(b.caption) : undefined, statusKey: b.rows.some(r => r._status !== undefined) ? (b.columns.find(c => c.key === 'st') || b.columns.find(c => c.key === 's'))?.key : undefined } });
        else if (b.kind === 'diagram') {
          const loc2 = (o) => JSON.parse(JSON.stringify(o), (k, v) => (v && typeof v === 'object' && !Array.isArray(v) && 'en' in v && 'fr' in v ? tr(v) : v));
          const spec = loc2(b.spec);
          const d = b.diagram === 'pmap' ? processMapSvg(spec) : bpmnSvgVertical(spec);
          items.push({ type: 'diagram', svg: d.svg, width: d.width, height: d.height, caption: b.caption ? tr(b.caption) : undefined });
        }
      }
      sections.push({ heading, items });
    }
  } else {
    sections.push({ heading: tr(L('Content', 'Contenu', 'المحتوى')), items: [{ type: 'text', text: tr(content) || '' }] });
  }
  const V = { en: 'Version', fr: 'Version', ar: 'الإصدار' }[lang];
  const S = { en: 'Status', fr: 'Statut', ar: 'الحالة' }[lang];
  const cover = content?.format === 'structured' ? content.cover !== false && t?.cover !== false : true;
  return {
    eyebrow: `${tr(P(org.name))} · ${doc.code}`,
    title: tr(P(doc.title)),
    subtitle: cover && t ? tr(t.description) : '',
    meta: cover ? [[V, version.version], [S, tr(LABELS[version.status] || version.status)], [{ en: 'Standards', fr: 'Normes', ar: 'المعايير' }[lang], (P(doc.standards) || []).join(', ')], [{ en: 'Owner', fr: 'Responsable', ar: 'المسؤول' }[lang], tr(roleName(doc.owner_role))], [{ en: 'Next review', fr: 'Prochaine revue', ar: 'المراجعة التالية' }[lang], doc.next_review || '—']] : [],
    docLine: cover ? null : `${doc.code} · ${V} ${version.version} · ${tr(LABELS[version.status] || version.status)}`,
    toc: content?.format === 'structured' ? !!content.toc : false,
    cover,
    landscape: !!t?.formats?.includes('XLSX'),
    sections,
    footer: layout.footerText || `${tr(P(org.name))} · ${doc.code} v${version.version}`,
    generatedAt: new Date().toISOString().slice(0, 10),
    pageLabel: { en: 'Page', fr: 'Page', ar: 'صفحة' }[lang],
    tocLabel: { en: 'Contents', fr: 'Sommaire', ar: 'المحتويات' }[lang],
    summaryLabel: { en: 'Cover', fr: 'Page de garde', ar: 'الغلاف' }[lang],
    layout,
  };
}
