// The Multi-Entries of the application (FR-DA-MRE): every place where several records of one
// kind are typed is a "source" with its columns, rights, rows and persistence.
//   step:<stepExecId>:<field>  — a record table of a typed step form (Section 4.42)
//   tpl:<templateId>:<list>    — a list of a project template blueprint (rules, controls, risks…)
//   reg:<projectId>:<register> — a register of a project (context, parties, objectives…)
import { all, get, run, uid, now, J, P } from '../db.js';
import { can } from '../auth.js';
import { bad, notFound, forbidden, loadProject, loadOrgRow, row as parseRow } from '../http.js';
import { catalog } from '../catalog/store.js';
import { formFor } from '../catalog/stepforms.js';
import { saveStep, normCell } from './lifecycle.js';
import { orgConfig } from '../packs.js';
import { ROLES } from '../permissions.js';
import { REGISTER_DEFS, REGISTERS } from '../content/registers.js';
import { listsOf, LISTS, blueprintOf } from './blueprint.js';
import { editable as tplEditable, load as tplLoad } from '../routes/ptemplates.js';
import { stampRows, newStamp } from './rowops.js';

const L3 = (en, fr, ar) => ({ en, fr, ar });
const tx = (v, l) => (v && typeof v === 'object' ? v[l] ?? v.en ?? '' : v ?? '');
const isI18n = (v) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0 && Object.keys(v).every(k => ['en', 'fr', 'ar'].includes(k));
/** A text value: unchanged text keeps every stored translation (FR-DA-I18N-10). */
export function keepI18n(lang, prev, v) {
  if (v === undefined) return prev;
  if (v === null || (typeof v === 'string' && !v.trim())) return null;
  if (typeof v === 'object') return v;
  if (isI18n(prev) && (prev[lang] ?? prev.en) === v) return prev;
  if (typeof prev === 'string' && prev === v) return prev;
  return { ...(isI18n(prev) ? prev : {}), [lang]: String(v) };
}
const quotaOf = (orgId) => { const o = orgId ? get('SELECT * FROM organizations WHERE id=?', orgId) : null; return o ? (orgConfig(o).quotas.rowsPerTable || Infinity) : Infinity; };
const roleOptions = () => ROLES.filter(r => r.code !== 'platform_admin').map(r => ({ value: r.code, label: r.name }));

// ---------------------------------------------------------------- step record tables
function stepSource(req, execId, fieldKey) {
  const e = loadOrgRow(req, 'step_exec', execId, false, 'Step');
  const c = catalog();
  const step = c.stepById[e.step_id];
  const def = formFor(step, e.form_kind || step?.formKind);
  const field = def.fields.find(f => f.key === fieldKey && f.columns);
  if (!field) throw notFound('Record table');
  const ph = get('SELECT gate_decision FROM phases WHERE project_id=? AND e2e_id=?', e.project_id, e.e2e_id);
  const assignee = req.user.roles.includes(e.assignee_role) || can(req, 'project.manage');
  const reason = !can(req, 'execution.perform') || !assignee ? 'NOT_ASSIGNEE' : ph?.gate_decision === 'Go' ? 'PHASE_LOCKED' : e.status === 'Done' ? 'STEP_DONE' : null;
  const lang = req.lang || 'en';
  const columns = field.columns.map(col => ({ ...col, objectValue: ['obs', 'parties', 'person', 'kpi', 'mp', 'role'].includes(col.type) }));
  return {
    orgId: e.org_id, projectId: e.project_id, kind: 'step',
    title: field.label, parent: L3(`${step?.id || e.step_id} ${tx(step?.name, 'en')}`, `${step?.id || e.step_id} ${tx(step?.name, 'fr')}`, `${step?.id || e.step_id} ${tx(step?.name, 'ar')}`),
    back: { type: 'step', id: e.id, code: e.step_id, name: step?.name, status: e.status },
    columns, readOnly: !!reason, reason, quota: quotaOf(e.org_id),
    read() { const f = P(get('SELECT fields FROM step_exec WHERE id=?', e.id).fields) || {}; return Array.isArray(f[fieldKey]) ? f[fieldKey] : []; },
    normalize(values, prev) {
      const out = {};
      for (const col of field.columns) {
        if (!(col.key in values)) continue;
        const v = values[col.key];
        if (['text', 'textarea', 'combo'].includes(col.type) || col.type === undefined) {
          if (typeof v === 'string' && prev && isI18n(prev[col.key]) && (prev[col.key][lang] ?? prev[col.key].en) === v) { out[col.key] = prev[col.key]; continue; }
        }
        const x = normCell(col.type, v, lang);
        out[col.key] = x === undefined ? null : x;
      }
      return out;
    },
    write(rows) { saveStep(req, get('SELECT * FROM step_exec WHERE id=?', e.id), { [fieldKey]: rows }, false); },
  };
}

// ---------------------------------------------------------------- project template lists
const SEV = ['Low', 'Medium', 'High', 'Critical'];
const sel = (values) => values.map(v => ({ value: v, label: v }));
function tplColumns(list, mpOptions) {
  const roles = roleOptions();
  const mp = { key: 'mp', type: 'select', label: L3('Macro process', 'Macro-processus', 'العملية الكلية'), options: mpOptions, carry: true };
  const code = (ph) => ({ key: 'id', type: 'text', required: true, label: L3('Code', 'Code', 'الرمز'), placeholder: ph, width: 110 });
  const owner = { key: 'owner', type: 'select', required: true, custom: false, label: L3('Owner', 'Responsable', 'المسؤول'), options: roles };
  const C = {
    rules: [code('BR-…'), { ...mp }, { key: 'condition', type: 'textarea', required: true, label: L3('Condition', 'Condition', 'الشرط'), wide: true }, { key: 'action', type: 'textarea', required: true, label: L3('Action', 'Action', 'الإجراء') },
      { key: 'type', type: 'select', required: true, custom: false, translate: true, label: L3('Type', 'Type', 'النوع'), options: sel(['Validation', 'Calculation', 'Routing', 'Notification', 'Constraint']) },
      { key: 'severity', type: 'select', required: true, custom: false, translate: true, label: L3('Severity', 'Gravité', 'الخطورة'), options: sel(SEV) }, owner],
    controls: [code('CTL-…'), { key: 'name', type: 'text', required: true, label: L3('Control', 'Contrôle', 'الضابط'), wide: true }, { key: 'description', type: 'textarea', optional: true, label: L3('Description', 'Description', 'الوصف') },
      { key: 'type', type: 'select', required: true, custom: false, translate: true, label: L3('Type', 'Type', 'النوع'), options: sel(['Preventive', 'Detective', 'Corrective', 'Directive']) },
      { key: 'frequency', type: 'select', required: true, custom: false, translate: true, label: L3('Frequency', 'Fréquence', 'التكرار'), options: sel(['Continuous', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual', 'Per event']) }, owner, { ...mp }],
    risks: [code('RSK-…'), { key: 'kind', type: 'select', required: true, custom: false, translate: true, carry: true, label: L3('Kind', 'Nature', 'النوع'), options: sel(['Risk', 'Opportunity']) },
      { key: 'title', type: 'text', required: true, label: L3('Title', 'Titre', 'العنوان'), wide: true }, { key: 'category', type: 'text', carry: true, label: L3('Category', 'Catégorie', 'الفئة') },
      { key: 'likelihood', type: 'number', min: 1, max: 5, required: true, label: L3('Likelihood (1–5)', 'Probabilité (1–5)', 'الاحتمال (1–5)') },
      { key: 'impact', type: 'number', min: 1, max: 5, required: true, label: L3('Impact (1–5)', 'Impact (1–5)', 'الأثر (1–5)') },
      { key: 'score', type: 'number', computed: true, readOnly: true, label: L3('Score', 'Score', 'الدرجة') },
      { key: 'treatment', type: 'text', optional: true, label: L3('Treatment', 'Traitement', 'المعالجة') }, owner, { ...mp, carry: false }],
    alerts: [code('ALR-…'), { key: 'name', type: 'text', required: true, label: L3('Alert', 'Alerte', 'التنبيه'), wide: true },
      { key: 'severity', type: 'select', required: true, custom: false, translate: true, label: L3('Severity', 'Gravité', 'الخطورة'), options: sel(SEV) },
      { key: 'escalation', type: 'select', required: true, custom: false, label: L3('Escalated to', 'Escaladé à', 'التصعيد إلى'), options: roles }, { key: 'enabled', type: 'checkbox', label: L3('Active', 'Actif', 'نشط') }],
    kpis: [code('KPI-…'), { key: 'name', type: 'text', required: true, label: L3('KPI', 'KPI', 'المؤشر'), wide: true }, { key: 'formula', type: 'textarea', required: true, label: L3('Formula', 'Formule', 'الصيغة') },
      { key: 'target', type: 'text', required: true, label: L3('Target', 'Cible', 'المستهدف'), placeholder: '≥ 95%' }, { key: 'unit', type: 'text', label: L3('Unit', 'Unité', 'الوحدة') },
      { key: 'frequency', type: 'select', required: true, custom: false, translate: true, label: L3('Frequency', 'Fréquence', 'التكرار'), options: sel(['Weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual']) }, owner, { ...mp }],
    reports: [code('RPT-…'), { key: 'name', type: 'text', required: true, label: L3('Report', 'Rapport', 'التقرير'), wide: true }, { key: 'audience', type: 'text', label: L3('Audience', 'Destinataires', 'الجمهور') },
      { key: 'frequency', type: 'text', required: true, label: L3('Frequency', 'Fréquence', 'التكرار') },
      { key: 'format', type: 'select', required: true, custom: false, label: L3('Format', 'Format', 'الصيغة'), options: sel(['PDF', 'DOCX', 'XLSX', 'PPTX', 'CSV', 'Dashboard']) }, owner],
  };
  return C[list];
}
const TPL_TEXT = new Set(['name', 'goals', 'goal', 'brief', 'condition', 'action', 'description', 'title', 'formula', 'treatment', 'frequency', 'target', 'audience', 'category']);
function tplSource(req, tplId, list) {
  if (!LISTS.includes(list)) throw notFound('List');
  const t = tplLoad(req, tplId);
  const c = catalog();
  const bp = blueprintOf(t);
  const mpOptions = [...new Set([...(c.macroProcesses || []).map(m => m.id), ...(bp.custom?.mp || []).map(m => m.id)])].map(id => { const m = c.mpById[id] || (bp.custom?.mp || []).find(x => x.id === id); return { value: id, label: m ? `${m.code || id} ${tx(m.name, req.lang || 'en')}` : id }; });
  const lang = req.lang || 'en';
  const canEdit = tplEditable(req, t);
  const listName = { rules: L3('Business rules', 'Règles métier', 'قواعد العمل'), controls: L3('Controls', 'Contrôles', 'الضوابط'), risks: L3('Risks and opportunities', 'Risques et opportunités', 'المخاطر والفرص'), alerts: L3('Alerts', 'Alertes', 'التنبيهات'), kpis: L3('KPIs', 'KPI', 'المؤشرات'), reports: L3('Reporting', 'Reporting', 'التقارير') }[list];
  return {
    orgId: t.org_id || req.user.org_id, kind: 'tpl', title: listName,
    parent: { en: `${t.code} ${tx(P(t.name), 'en')}`, fr: `${t.code} ${tx(P(t.name), 'fr')}`, ar: `${t.code} ${tx(P(t.name), 'ar')}` },
    back: { type: 'template', id: t.id, code: t.code, name: P(t.name), status: t.status },
    columns: tplColumns(list, mpOptions), readOnly: !canEdit, reason: canEdit ? null : (t.org_id ? 'NO_RIGHT' : 'LIBRARY_TEMPLATE'), quota: quotaOf(t.org_id),
    read() {
      const rows = listsOf(get('SELECT * FROM project_templates WHERE id=?', t.id))[list] || [];
      return rows.map(r => (list === 'risks' ? { ...r, score: (+r.likelihood || 0) * (+r.impact || 0) } : r));
    },
    normalize(values, prev) {
      const out = {};
      for (const [k, v] of Object.entries(values)) {
        if (k === 'score') continue;
        out[k] = TPL_TEXT.has(k) ? keepI18n(lang, prev?.[k], v) : (['likelihood', 'impact'].includes(k) && v !== '' && v !== null ? +v : v);
      }
      if (list === 'risks') { const l = +(out.likelihood ?? prev?.likelihood) || 0; const i = +(out.impact ?? prev?.impact) || 0; out.score = l * i; }
      return out;
    },
    write(rows) {
      const cur = get('SELECT * FROM project_templates WHERE id=?', t.id);
      const b = blueprintOf(cur);
      b.lists = { ...listsOf(cur), [list]: rows.map(r => { const { score, ...x } = r; return list === 'risks' ? x : r; }) };
      run('UPDATE project_templates SET content=?, version=version+1, updated_at=?, updated_by=? WHERE id=?', J(b), now(), req.user.id, t.id);
    },
  };
}

// ---------------------------------------------------------------- project registers
const STATUSES = ['Active', 'Proposed', 'Accepted', 'Implemented', 'Closed', 'Rejected', 'Overdue', 'Valid', 'Expired'];
function regSource(req, projectId, reg) {
  const p = loadProject(req, projectId);
  if (!REGISTERS.includes(reg)) throw notFound('Register');
  const def = REGISTER_DEFS.find(d => d.key === reg);
  const lang = req.lang || 'en';
  const write = can(req, 'records.manage') || (reg === 'ideas' && can(req, 'records.create'));
  const access = get('SELECT 1 FROM organizations WHERE id=?', p.org_id) && (req.user.org_id === p.org_id || req.user.is_platform_admin);
  const columns = [
    { key: 'code', type: 'text', readOnly: true, computed: true, label: L3('Code', 'Code', 'الرمز'), width: 110 },
    { key: 'title', type: 'text', required: true, label: L3('Title', 'Titre', 'العنوان'), wide: true },
    ...def.fields.map((f, i) => ({ key: f.key, label: f.label, type: f.type === 'role' ? 'select' : (f.type || 'text'), ...(f.type === 'role' ? { options: roleOptions(), custom: false } : {}), optional: i >= 5 })),
    { key: 'status', type: 'select', translate: true, label: L3('Status', 'Statut', 'الحالة'), options: sel(STATUSES) },
  ];
  const fieldKeys = new Set(def.fields.map(f => f.key));
  return {
    orgId: p.org_id, projectId: p.id, kind: 'reg', title: def.name,
    parent: { en: `${p.code} ${tx(def.name, 'en')}`, fr: `${p.code} ${tx(def.name, 'fr')}`, ar: `${p.code} ${tx(def.name, 'ar')}` },
    back: { type: 'register', id: reg, code: p.code, name: def.name },
    columns, readOnly: !(write && access), reason: write && access ? null : 'NO_RIGHT', quota: quotaOf(p.org_id),
    read() {
      return all('SELECT r.*, u.name AS by_name FROM registers r LEFT JOIN users u ON u.id=r.updated_by WHERE r.project_id=? AND r.register=? ORDER BY r.code', p.id, reg).map(x0 => {
        const x = parseRow(x0);
        return { _rid: x.id, _stamp: x.updated_at || x.created_at || '0', _by: x.updated_by || null, _byName: x.by_name || null, _at: x.updated_at || null, code: x.code, title: x.title, status: x.status, ...(x.data || {}) };
      });
    },
    normalize(values, prev) {
      const out = {};
      for (const [k, v] of Object.entries(values)) {
        if (k === 'code') continue;
        const col = columns.find(c => c.key === k);
        if (!col) continue;
        out[k] = ['date', 'number', 'select', 'checkbox'].includes(col.type) ? v : keepI18n(lang, prev?.[k], v);
      }
      return out;
    },
    // Registers are rows of their own table: insert, update and delete what changed.
    write(next, before) {
      const prevById = Object.fromEntries(before.map(r => [r._rid, r]));
      const nextIds = new Set(next.map(r => r._rid));
      let n = get('SELECT COUNT(*) n FROM registers WHERE project_id=? AND register=?', p.id, reg).n;
      for (const r of before) if (!nextIds.has(r._rid)) run('DELETE FROM registers WHERE id=? AND project_id=?', r._rid, p.id);
      for (const r of next) {
        const data = Object.fromEntries(Object.entries(r).filter(([k]) => fieldKeys.has(k)));
        const at = r._at || now();
        if (!prevById[r._rid]) {
          n += 1;
          const code = `${reg.slice(0, 3).toUpperCase()}-N${n}`;
          run('INSERT INTO registers(id,org_id,project_id,register,code,title,data,status,created_at,updated_at,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)', r._rid, p.org_id, p.id, reg, code, J(r.title), J(data), r.status || (reg === 'ideas' ? 'Proposed' : 'Active'), at, r._stamp, req.user.id);
          r.code = code;
        } else if (prevById[r._rid]._stamp !== r._stamp) {
          run('UPDATE registers SET title=?, data=?, status=?, updated_at=?, updated_by=? WHERE id=?', J(r.title), J(data), r.status || null, r._stamp, req.user.id, r._rid);
        }
      }
    },
  };
}

/** The source of a Multi-Entry, from its identifier. */
export function openSource(req, source) {
  const [kind, a, b] = String(source || '').split(':');
  if (!a || !b) throw bad('BAD_SOURCE', 'Unknown table.');
  if (kind === 'step') return stepSource(req, a, b);
  if (kind === 'tpl') return tplSource(req, a, b);
  if (kind === 'reg') return regSource(req, a, b);
  throw bad('BAD_SOURCE', 'Unknown table.');
}

/** Rows of a source with their Row Stamps (stored at once when rows had none). */
export function readStamped(src) {
  const list = src.read();
  if (src.kind === 'reg') return list;
  const { rows, changed } = stampRows(list);
  if (changed && !src.readOnly) { try { src.write(rows, list); } catch { /* read-only use */ } }
  return rows;
}
export { newStamp };
export const REASONS = {
  NOT_ASSIGNEE: L3('This step is assigned to another role.', 'Cette étape est affectée à un autre rôle.', 'هذه الخطوة مسندة إلى دور آخر.'),
  PHASE_LOCKED: L3('The phase gate is passed: the step is locked.', 'Le jalon de la phase est franchi : l\'étape est verrouillée.', 'تم اجتياز بوابة المرحلة: الخطوة مقفلة.'),
  STEP_DONE: L3('The step is completed: reopen it to change its rows.', 'L\'étape est terminée : rouvrez-la pour modifier ses lignes.', 'الخطوة مكتملة: أعد فتحها لتعديل صفوفها.'),
  NO_RIGHT: L3('Your role can read this table but not change it.', 'Votre rôle peut lire ce tableau mais pas le modifier.', 'يمكن لدورك قراءة هذا الجدول دون تعديله.'),
  LIBRARY_TEMPLATE: L3('Library templates are read-only: copy the template to change it.', 'Les modèles de la bibliothèque sont en lecture seule : copiez le modèle pour le modifier.', 'نماذج المكتبة للقراءة فقط: انسخ النموذج لتعديله.'),
};
export { uid };
