// SRS revision 1.5 capabilities: global search (4.37), process design management with
// version history and restore (4.38), OBS functions, roles and people (4.39), and the AI
// prompt specification with field-level versions (4.40).
import { Router } from 'express';
import { all, get, run, uid, now, J, P, tx } from '../db.js';
import { requirePerm, can } from '../auth.js';
import { h, send, bad, notFound, forbidden, requireOrg, loadProject, loadOrgRow } from '../http.js';
import { audit, snapshot, versions } from '../services/audit.js';
import { registerReverter } from '../services/revert.js';
import { catalog, loc } from '../catalog/store.js';
import { FORM_KINDS } from '../catalog/forms.js';
import { ROLES } from '../permissions.js';
import { holdersOf, roleData, missionOf } from '../services/obsroles.js';
import { SPEC_FIELDS, SPEC_LABELS, SPEC_REQUIRED, specOf, specCompleteness } from '../services/aiprompt.js';

const r = Router();
const tr = (req, v) => (v === undefined || v === null ? null : typeof v === 'object' ? v : { [req.lang]: String(v) });
// Merges an edited language into a trilingual value, keeping the other languages.
const merge = (req, prev, v) => (v === undefined ? prev : v === null ? null : typeof v === 'object' ? v : { ...(prev && typeof prev === 'object' ? prev : {}), [req.lang]: String(v) });

// ---------------------------------------------------------------- Global search (FR-DA-SRCH)
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const text = (v) => (v && typeof v === 'object' ? [v.en, v.fr, v.ar].join(' ') : String(v ?? ''));
r.get('/search', requirePerm('dashboard.view'), h((req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return send(req, res, { q, total: 0, groups: [] });
  const words = norm(q).split(/\s+/).filter(Boolean);
  const hit = (...fields) => { const t = norm(fields.map(text).join(' ')); return words.every(w => t.includes(w)); };
  const exact = (code) => norm(code) === norm(q);
  const limit = Math.min(25, +req.query.limit || 8);
  const c = catalog();
  const p = req.query.projectId ? loadProject(req, req.query.projectId) : null;
  const orgId = p?.org_id || req.user.org_id;
  const groups = [];
  const add = (type, label, items) => { const list = items.sort((a, b) => (b._exact ? 1 : 0) - (a._exact ? 1 : 0)); if (list.length) groups.push({ type, label, total: list.length, items: list.slice(0, limit).map(({ _exact, ...x }) => x) }); };
  const L = (en, fr, ar) => ({ en, fr, ar });
  if (p && can(req, 'execution.view')) {
    const ex = all('SELECT id, step_id, mp_id, status FROM step_exec WHERE project_id=?', p.id);
    add('step', L('Steps', 'Étapes', 'الخطوات'), ex.filter(e => { const s = c.stepById[e.step_id]; return s && hit(s.id, s.name, s.brief); }).map(e => ({ id: e.id, code: e.step_id, title: c.stepById[e.step_id].name, sub: c.mpById[e.mp_id]?.name, status: e.status, link: `/steps/${e.id}`, _exact: exact(e.step_id) })));
    const mps = all('SELECT mp_id, status FROM project_mps WHERE project_id=?', p.id);
    add('mp', L('Macro processes', 'Macro-processus', 'العمليات الكلية'), mps.filter(m => { const x = c.mpById[m.mp_id]; return x && hit(x.id, x.code, x.name, x.goal); }).map(m => ({ id: m.mp_id, code: c.mpById[m.mp_id].code, title: c.mpById[m.mp_id].name, status: m.status, link: `/mp/${m.mp_id}`, _exact: exact(c.mpById[m.mp_id].code) || exact(m.mp_id) })));
  }
  if (p && can(req, 'records.view')) {
    add('nc', L('Nonconformities', 'Non-conformités', 'حالات عدم المطابقة'), all('SELECT id, code, title, stage FROM ncs WHERE project_id=?', p.id).filter(n => hit(n.code, P(n.title))).map(n => ({ id: n.id, code: n.code, title: P(n.title), status: n.stage, link: `/ncs/${n.id}`, _exact: exact(n.code) })));
    add('action', L('Actions', 'Actions', 'الإجراءات'), all('SELECT id, title, status, due_date FROM actions WHERE project_id=?', p.id).filter(a => hit(P(a.title))).map(a => ({ id: a.id, title: P(a.title), sub: a.due_date, status: a.status, link: '/actions' })));
    add('audit', L('Audits', 'Audits', 'التدقيقات'), all('SELECT id, code, title, status FROM audits WHERE project_id=?', p.id).filter(a => hit(a.code, P(a.title))).map(a => ({ id: a.id, code: a.code, title: P(a.title), status: a.status, link: `/audits/${a.id}`, _exact: exact(a.code) })));
    add('document', L('Documents', 'Documents', 'الوثائق'), all('SELECT id, code, title, status, current_version FROM documents WHERE project_id=?', p.id).filter(d => hit(d.code, P(d.title))).map(d => ({ id: d.id, code: d.code, title: P(d.title), sub: `v${d.current_version}`, status: d.status, link: `/documents/${d.id}`, _exact: exact(d.code) })));
    add('register', L('Register entries', 'Entrées de registre', 'بنود السجلات'), all('SELECT id, register, code, title, status FROM registers WHERE project_id=?', p.id).filter(x => hit(x.code, P(x.title))).map(x => ({ id: x.id, code: x.code, title: P(x.title), sub: x.register, status: x.status, link: `/registers?reg=${x.register}`, _exact: exact(x.code) })));
    add('attachment', L('Attachments', 'Pièces jointes', 'المرفقات'), all('SELECT a.id, a.filename, a.entity_type, a.entity_id FROM attachments a WHERE a.org_id=?', orgId).filter(a => hit(a.filename)).map(a => ({ id: a.id, title: a.filename, sub: a.entity_type, link: a.entity_type === 'document' ? `/documents/${a.entity_id}` : a.entity_type === 'nc' ? `/ncs/${a.entity_id}` : a.entity_type === 'audit' ? `/audits/${a.entity_id}` : a.entity_type === 'step' ? `/steps/${a.entity_id}` : '/actions' })));
  }
  if (p && can(req, 'governance.view')) {
    add('risk', L('Risks and opportunities', 'Risques et opportunités', 'المخاطر والفرص'), all('SELECT id, code, title, score, status FROM risks WHERE project_id=?', p.id).filter(x => hit(x.code, P(x.title))).map(x => ({ id: x.id, code: x.code, title: P(x.title), sub: `${x.score}`, status: x.status, link: '/risks', _exact: exact(x.code) })));
    add('kpi', L('KPIs', 'KPI', 'المؤشرات'), all('SELECT id, code, name, target_text FROM kpis WHERE project_id=?', p.id).filter(x => hit(x.code, P(x.name))).map(x => ({ id: x.id, code: x.code, title: P(x.name), sub: x.target_text, link: '/kpis', _exact: exact(x.code) })));
    add('rule', L('Rules and controls', 'Règles et contrôles', 'القواعد والضوابط'), [...all('SELECT id, code, condition t FROM business_rules WHERE org_id=?', orgId), ...all('SELECT id, code, name t FROM controls WHERE org_id=?', orgId)].filter(x => hit(x.code, P(x.t))).map(x => ({ id: x.id, code: x.code, title: P(x.t), link: '/rules', _exact: exact(x.code) })));
  }
  if (can(req, 'ai.view')) add('ai', L('AI use cases', 'Cas d\'usage IA', 'حالات استخدام الذكاء الاصطناعي'), all('SELECT id, code, name, linked_step FROM ai_usecases WHERE org_id=?', orgId).filter(x => hit(x.code, P(x.name), x.linked_step)).map(x => ({ id: x.id, code: x.code, title: P(x.name), sub: x.linked_step, link: '/ai', _exact: exact(x.code) })));
  if (can(req, 'tenancy.view')) {
    add('person', L('People', 'Personnes', 'الأشخاص'), all('SELECT id, name, email, roles FROM users WHERE org_id=?', orgId).filter(u => hit(u.name, u.email, ...(P(u.roles) || []).map(x => ROLES.find(r2 => r2.code === x)?.name))).map(u => ({ id: u.id, title: u.name, sub: u.email, link: '/organization?tab=roles' })));
    add('obs', L('Units and roles', 'Unités et rôles', 'الوحدات والأدوار'), [...all('SELECT id, name, type FROM obs_nodes WHERE org_id=? AND project_id IS NULL', orgId).map(n => ({ id: n.id, title: P(n.name), sub: n.type })), ...all("SELECT id, name FROM obs_roles WHERE org_id=? AND status='Active'", orgId).map(x => ({ id: x.id, title: P(x.name), sub: 'Role' }))].filter(x => hit(x.title)).map(x => ({ ...x, link: '/organization?tab=roles' })));
  }
  if (can(req, 'process.view')) {
    const els = [...c.macroProcesses.map(m => ({ id: m.id, code: m.code, title: m.name, sub: 'MP', link: `/process/mp/${m.id}` })), ...c.e2e.map(e => ({ id: e.id, code: e.id, title: e.name, sub: 'E2E', link: `/process/e2e/${e.id}` })), ...(c.functions || []).map(f => ({ id: f.id, code: f.id, title: f.name, sub: 'Function', link: '/design?type=function' }))];
    add('process', L('Process design', 'Conception des processus', 'تصميم العمليات'), els.filter(x => hit(x.code, x.title)).map(x => ({ ...x, _exact: exact(x.code) })));
  }
  add('help', L('Help topics', 'Rubriques d\'aide', 'مواضيع المساعدة'), (c.help || []).filter(x => hit(x.title, x.body)).map(x => ({ id: x.id, title: x.title, link: `/help?topic=${x.id}` })));
  send(req, res, { q, total: groups.reduce((a, g) => a + g.total, 0), groups });
}));

// ---------------------------------------------------------------- Process design (FR-DA-PDM)
export const DESIGN_TYPES = {
  function: { label: { en: 'Functions', fr: 'Fonctions', ar: 'الوظائف' }, fields: ['name', 'description'] },
  e2e: { label: { en: 'End-to-end processes (phases)', fr: 'Processus de bout en bout (phases)', ar: 'العمليات الشاملة (المراحل)' }, fields: ['name', 'goals', 'trigger'] },
  mp: { label: { en: 'Macro processes', fr: 'Macro-processus', ar: 'العمليات الكلية' }, fields: ['code', 'name', 'goal', 'function', 'e2e', 'ownerRoleCode', 'trigger', 'terminal'] },
  task: { label: { en: 'Tasks', fr: 'Tâches', ar: 'المهام' }, fields: ['name', 'mp', 'seq'] },
  step: { label: { en: 'Steps', fr: 'Étapes', ar: 'الخطوات' }, fields: ['name', 'brief', 'description', 'mp', 'task', 'seq', 'roleCode', 'formKind'] },
  gate: { label: { en: 'Gates', fr: 'Jalons', ar: 'البوابات' }, fields: ['name', 'purpose', 'entry_criteria', 'exit_criteria', 'approvers'] },
  checklist: { label: { en: 'Checklists', fr: 'Listes de contrôle', ar: 'قوائم التحقق' }, fields: ['name', 'items'] },
};
const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
function baseElements(type) {
  const c = catalog(); const f = DESIGN_TYPES[type].fields;
  if (type === 'function') return (c.functions || []).map(x => ({ id: x.id, data: pick(x, f) }));
  if (type === 'e2e') return c.e2e.map(x => ({ id: x.id, data: pick(x, f) }));
  if (type === 'mp') return c.macroProcesses.map(x => ({ id: x.id, data: pick(x, f), parent: x.e2e }));
  if (type === 'task') return c.tasks.map(x => ({ id: x.id, data: pick(x, f), parent: x.mp }));
  if (type === 'step') return c.steps.map(x => ({ id: x.id, data: pick(x, f), parent: x.mp }));
  if (type === 'gate') return all('SELECT * FROM gate_defs WHERE org_id IS NULL ORDER BY code').map(g => ({ id: g.code, data: { name: P(g.name), purpose: P(g.purpose), entry_criteria: P(g.entry_criteria), exit_criteria: P(g.exit_criteria), approvers: P(g.approvers) } }));
  if (type === 'checklist') return all('SELECT * FROM checklist_templates WHERE org_id IS NULL ORDER BY code').map(x => ({ id: x.code, data: { name: P(x.name), items: P(x.items) } }));
  return [];
}
const designId = (orgId, type, id) => `${orgId}:${type}:${id}`;
function elementOf(orgId, type, id) {
  const base = baseElements(type).find(x => x.id === id);
  const ov = get('SELECT * FROM design_elements WHERE org_id=? AND type=? AND el_id=?', orgId, type, id);
  if (!base && !ov) return null;
  return { id, type, data: ov ? P(ov.data) : base.data, status: ov?.status || 'Active', custom: !!ov?.custom, version: ov?.version || 1, modified: !!ov, parent: base?.parent || P(ov?.data)?.mp || P(ov?.data)?.e2e || null, updatedAt: ov?.updated_at || null };
}
// Usage of an element: what would be affected by a change, a retirement or a deletion (FR-DA-PDM-07).
function usageOf(orgId, type, id) {
  const c = catalog();
  const n = (sql, ...a) => get(sql, ...a).n;
  if (type === 'step') return { runs: n('SELECT COUNT(*) n FROM step_exec s JOIN projects p ON p.id=s.project_id WHERE p.org_id=? AND s.step_id=?', orgId, id), children: 0, aiUseCases: n('SELECT COUNT(*) n FROM ai_usecases WHERE org_id=? AND linked_step=?', orgId, id) };
  if (type === 'task') return { runs: 0, children: c.steps.filter(s => s.task === id).length };
  if (type === 'mp') return { runs: n('SELECT COUNT(*) n FROM project_mps m JOIN projects p ON p.id=m.project_id WHERE p.org_id=? AND m.mp_id=?', orgId, id), children: (c.stepsByMp[id] || []).length, documents: n('SELECT COUNT(*) n FROM documents WHERE org_id=? AND mp_id=?', orgId, id) };
  if (type === 'e2e') return { runs: n('SELECT COUNT(*) n FROM phases WHERE org_id=? AND e2e_id=?', orgId, id), children: c.macroProcesses.filter(m => m.e2e === id).length };
  if (type === 'function') return { runs: 0, children: c.macroProcesses.filter(m => m.function === id).length, roles: all('SELECT functions FROM obs_roles WHERE org_id=?', orgId).filter(x => (P(x.functions) || []).includes(id)).length };
  return { runs: 0, children: 0 };
}
function validateDesign(type, d) {
  const c = catalog();
  if (!d.name || !(typeof d.name === 'object' ? Object.values(d.name).some(Boolean) : String(d.name).trim())) throw bad('NAME_REQUIRED', 'A name is required.');
  if (type === 'step' || type === 'task') {
    const nm = typeof d.name === 'object' ? d.name.en || Object.values(d.name).find(Boolean) : d.name;
    if (String(nm).trim().split(/\s+/).length < 2) throw bad('EXPLICIT_NAME', 'Name the step with a verb and its object, e.g. "Identify the interested parties".');
  }
  if (type === 'step' && d.formKind && !FORM_KINDS[d.formKind]) throw bad('BAD_FORM_KIND', 'Unknown form kind.');
  if ((type === 'step' || type === 'task') && d.mp && !c.mpById[d.mp]) throw bad('BAD_PARENT', 'Unknown macro process.');
  if (type === 'mp' && d.function && !c.fnById?.[d.function]) throw bad('BAD_FUNCTION', 'Unknown function.');
}
r.get('/orgs/:id/design', requirePerm('process.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const type = req.query.type || 'mp';
  if (!DESIGN_TYPES[type]) throw bad('BAD_TYPE', 'Unknown design element type.');
  const ov = Object.fromEntries(all('SELECT * FROM design_elements WHERE org_id=? AND type=?', req.params.id, type).map(x => [x.el_id, x]));
  const base = baseElements(type);
  const list = base.map(b => ({ id: b.id, parent: b.parent || null, data: ov[b.id] ? P(ov[b.id].data) : b.data, status: ov[b.id]?.status || 'Active', modified: !!ov[b.id], custom: false, version: ov[b.id]?.version || 1 }));
  for (const [id, x] of Object.entries(ov)) if (x.custom) list.push({ id, parent: P(x.data).mp || P(x.data).e2e || null, data: P(x.data), status: x.status, modified: true, custom: true, version: x.version });
  const q = norm(req.query.q || ''); const parent = req.query.parent || '';
  const out = list.filter(x => (!parent || x.parent === parent || x.data.mp === parent) && (!q || norm(`${x.id} ${text(x.data.code)} ${text(x.data.name)}`).includes(q)) && (req.query.all || x.status !== 'Deleted'));
  send(req, res, { type, types: Object.fromEntries(Object.entries(DESIGN_TYPES).map(([k, v]) => [k, v.label])), fields: DESIGN_TYPES[type].fields, total: out.length, items: out.slice(0, +req.query.limit || 400) });
}));
r.get('/orgs/:id/design/:type/:el', requirePerm('process.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  if (!DESIGN_TYPES[req.params.type]) throw bad('BAD_TYPE', 'Unknown design element type.');
  const e = elementOf(req.params.id, req.params.type, req.params.el);
  if (!e) throw notFound('Element');
  send(req, res, { ...e, fields: DESIGN_TYPES[req.params.type].fields, usage: usageOf(req.params.id, req.params.type, req.params.el), versionKey: { type: 'design', id: designId(req.params.id, req.params.type, req.params.el) }, versions: versions('design', designId(req.params.id, req.params.type, req.params.el)).length });
}));
function saveDesign(req, orgId, type, id, data, status, custom, note) {
  const key = designId(orgId, type, id);
  // The first change keeps the reference (catalog) content as version 1.
  if (!versions('design', key).length) { const base = baseElements(type).find(x => x.id === id); if (base) snapshot({ user: null }, orgId, 'design', key, { ...base.data, _status: 'Active' }, { en: 'Reference version (catalog)', fr: 'Version de référence (catalogue)', ar: 'النسخة المرجعية (الكتالوج)' }); }
  const v = snapshot(req, orgId, 'design', key, { ...data, _status: status }, note ? tr(req, note) : null);
  run(`INSERT INTO design_elements(org_id,type,el_id,data,status,custom,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?)
       ON CONFLICT(org_id,type,el_id) DO UPDATE SET data=excluded.data, status=excluded.status, version=excluded.version, updated_by=excluded.updated_by, updated_at=excluded.updated_at`, orgId, type, id, J(data), status, custom ? 1 : 0, v, req.user?.id || null, now());
  return v;
}
r.put('/orgs/:id/design/:type/:el', requirePerm('process.design'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const { type, el } = req.params;
  if (!DESIGN_TYPES[type]) throw bad('BAD_TYPE', 'Unknown design element type.');
  const e = elementOf(req.params.id, type, el);
  if (!e) throw notFound('Element');
  const b = req.body || {};
  const data = { ...e.data };
  for (const k of DESIGN_TYPES[type].fields) if (b[k] !== undefined) data[k] = ['name', 'brief', 'description', 'goal', 'goals', 'trigger', 'terminal', 'purpose', 'entry_criteria', 'exit_criteria'].includes(k) ? merge(req, e.data[k], b[k]) : b[k];
  validateDesign(type, data);
  const v = saveDesign(req, req.params.id, type, el, data, b.status || e.status, e.custom, b.note);
  audit(req, req.params.id, 'design', designId(req.params.id, type, el), 'update', e.data, data, b.note || null);
  res.json({ ok: true, version: v });
}));
r.post('/orgs/:id/design/:type', requirePerm('process.design'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const { type } = req.params;
  if (!DESIGN_TYPES[type]) throw bad('BAD_TYPE', 'Unknown design element type.');
  const b = req.body || {};
  const data = {};
  for (const k of DESIGN_TYPES[type].fields) if (b[k] !== undefined) data[k] = ['name', 'brief', 'description', 'goal', 'goals', 'trigger', 'terminal', 'purpose', 'entry_criteria', 'exit_criteria'].includes(k) ? tr(req, b[k]) : b[k];
  validateDesign(type, data);
  const n = get('SELECT COUNT(*) n FROM design_elements WHERE org_id=? AND type=? AND custom=1', req.params.id, type).n;
  const prefix = { function: 'FN-C', e2e: 'E2E-C', mp: 'MP-C', task: `${data.mp || 'MP'}.TC`, step: `${data.mp || 'MP'}.C`, gate: 'GATE-C', checklist: 'CL-C' }[type];
  const id = `${prefix}${String(n + 1).padStart(2, '0')}`;
  const v = saveDesign(req, req.params.id, type, id, data, 'Active', true, b.note || 'Created');
  audit(req, req.params.id, 'design', designId(req.params.id, type, id), 'create', null, data, null);
  res.status(201).json({ id, version: v });
}));
// Deleting: a custom element that nothing uses is deleted (restorable from its history); a
// reference element or one used by runs is retired instead (FR-DA-PDM-07).
r.delete('/orgs/:id/design/:type/:el', requirePerm('process.design'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const { type, el } = req.params;
  const e = elementOf(req.params.id, type, el);
  if (!e) throw notFound('Element');
  const usage = usageOf(req.params.id, type, el);
  const status = e.custom && !usage.runs ? 'Deleted' : 'Retired';
  saveDesign(req, req.params.id, type, el, e.data, status, e.custom, req.body?.justification || status);
  audit(req, req.params.id, 'design', designId(req.params.id, type, el), status === 'Deleted' ? 'delete' : 'retire', e.data, { status }, req.body?.justification || null);
  res.json({ ok: true, status, usage });
}));
registerReverter('design', (req, v, data) => {
  const [orgId, type, ...rest] = v.entity_id.split(':'); const id = rest.join(':');
  const { _status, ...d } = data;
  const custom = !baseElements(type).some(x => x.id === id);
  run(`INSERT INTO design_elements(org_id,type,el_id,data,status,custom,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?)
       ON CONFLICT(org_id,type,el_id) DO UPDATE SET data=excluded.data, status=excluded.status, version=excluded.version+0, updated_by=excluded.updated_by, updated_at=excluded.updated_at`, orgId, type, id, J(d), _status || 'Active', custom ? 1 : 0, (get('SELECT MAX(version) m FROM entity_versions WHERE entity_type=? AND entity_id=?', 'design', v.entity_id).m || 0) + 1, req.user.id, now());
});
// Element content applicable to a record that started on a given date (FR-DA-PDM-06): the
// latest version saved before the start; null when the reference content applies.
export function designAt(orgId, type, id, when) {
  const v = get('SELECT data FROM entity_versions WHERE entity_type=? AND entity_id=? AND at<=? ORDER BY version DESC LIMIT 1', 'design', designId(orgId, type, id), when);
  return v ? P(v.data) : null;
}

// ---------------------------------------------------------------- OBS roles (FR-DA-OBS)
r.get('/orgs/:id/obs-roles', requirePerm('tenancy.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const c = catalog();
  const on = String(req.query.on || now().slice(0, 10));
  const nodes = Object.fromEntries(all('SELECT id, name, type FROM obs_nodes WHERE org_id=?', req.params.id).map(n => [n.id, n]));
  const roles = all("SELECT * FROM obs_roles WHERE org_id=? AND (status='Active' OR ?) ORDER BY name", req.params.id, req.query.all ? 1 : 0);
  const out = roles.map(x => ({ id: x.id, code: x.code, name: P(x.name), mission: P(x.mission), responsibilities: P(x.responsibilities), competences: P(x.competences), functions: (P(x.functions) || []).map(f => ({ id: f, name: c.fnById?.[f]?.name || f })), accessRoles: P(x.access_roles) || [], unit: nodes[x.node_id] ? { id: x.node_id, name: P(nodes[x.node_id].name), type: nodes[x.node_id].type } : null, reportsTo: x.reports_to, status: x.status, version: x.version,
    holders: holdersOf(x.id, on).map(a => ({ id: a.id, userId: a.user_id, name: a.name, holderType: a.holder_type, allocation: a.allocation, start: a.start_date, end: a.end_date })) }));
  const functions = (c.functions || []).map(f => ({ id: f.id, name: f.name, roles: out.filter(x => x.functions.some(y => y.id === f.id)).map(x => ({ id: x.id, name: x.name, holders: x.holders.map(h2 => h2.name) })) }));
  const people = {};
  for (const x of out) for (const h2 of x.holders) (people[h2.userId] ||= { id: h2.userId, name: h2.name, roles: [] }).roles.push({ id: x.id, name: x.name, holderType: h2.holderType, allocation: h2.allocation });
  send(req, res, { on, roles: out, functions, people: Object.values(people).sort((a, b) => a.name.localeCompare(b.name)), vacant: out.filter(x => !x.holders.length).map(x => x.id) });
}));
function roleBody(req, b, prev = {}) {
  const c = catalog();
  const fns = Array.isArray(b.functions) ? b.functions : prev.functions;
  if (!fns || !fns.length) throw bad('FUNCTION_REQUIRED', 'Link the role to at least one function.');
  for (const f of fns) if (!c.fnById?.[f]) throw bad('BAD_FUNCTION', `Unknown function ${f}.`);
  const name = merge(req, prev.name, b.name);
  if (!name || !Object.values(name).some(Boolean)) throw bad('NAME_REQUIRED', 'A role name is required.');
  return { name, mission: b.mission !== undefined ? merge(req, prev.mission, b.mission) : prev.mission || missionOf(fns), responsibilities: merge(req, prev.responsibilities, b.responsibilities) ?? null, competences: merge(req, prev.competences, b.competences) ?? null, functions: fns, access_roles: Array.isArray(b.accessRoles) ? b.accessRoles : prev.access_roles || ['contributor'], node_id: b.unitId !== undefined ? b.unitId : prev.node_id, reports_to: b.reportsTo !== undefined ? b.reportsTo : prev.reports_to, status: b.status || prev.status || 'Active' };
}
const writeRole = (id, d, version) => run('UPDATE obs_roles SET name=?, mission=?, responsibilities=?, competences=?, functions=?, access_roles=?, node_id=?, reports_to=?, status=?, version=?, updated_at=? WHERE id=?', J(d.name), J(d.mission), J(d.responsibilities), J(d.competences), J(d.functions), J(d.access_roles), d.node_id || null, d.reports_to || null, d.status, version, now(), id);
r.post('/orgs/:id/obs-roles', requirePerm('obs.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const d = roleBody(req, req.body || {});
  if (d.node_id && !get('SELECT 1 FROM obs_nodes WHERE id=? AND org_id=?', d.node_id, req.params.id)) throw bad('BAD_UNIT', 'Unknown unit.');
  const id = uid();
  run('INSERT INTO obs_roles(id,org_id,node_id,code,name,mission,responsibilities,competences,functions,access_roles,reports_to,status,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)', id, req.params.id, d.node_id || null, null, J(d.name), J(d.mission), J(d.responsibilities), J(d.competences), J(d.functions), J(d.access_roles), d.reports_to || null, 'Active', now(), now());
  snapshot(req, req.params.id, 'obs_role', id, d, null);
  audit(req, req.params.id, 'obs_role', id, 'create', null, d, null);
  res.status(201).json({ id });
}));
r.put('/obs-roles/:id', requirePerm('obs.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'obs_roles', req.params.id, true, 'Role');
  const prev = roleData(x);
  if (!versions('obs_role', x.id).length) snapshot(req, x.org_id, 'obs_role', x.id, prev, null);
  const d = roleBody(req, req.body || {}, prev);
  const v = snapshot(req, x.org_id, 'obs_role', x.id, d, req.body?.note ? tr(req, req.body.note) : null);
  writeRole(x.id, d, v);
  audit(req, x.org_id, 'obs_role', x.id, 'update', prev, d, req.body?.note || null);
  res.json({ ok: true, version: v });
}));
// Retiring a role ends its assignments; open work assigned through the role goes to its next holder.
r.delete('/obs-roles/:id', requirePerm('obs.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'obs_roles', req.params.id, true, 'Role');
  const d = { ...roleData(x), status: 'Retired' };
  if (!versions('obs_role', x.id).length) snapshot(req, x.org_id, 'obs_role', x.id, roleData(x), null);
  const v = snapshot(req, x.org_id, 'obs_role', x.id, d, tr(req, req.body?.justification || 'Retired'));
  writeRole(x.id, d, v);
  run('UPDATE role_assignments SET end_date=? WHERE role_id=? AND (end_date IS NULL OR end_date>?)', now().slice(0, 10), x.id, now().slice(0, 10));
  audit(req, x.org_id, 'obs_role', x.id, 'retire', null, { status: 'Retired' }, req.body?.justification || null);
  res.json({ ok: true });
}));
registerReverter('obs_role', (req, v, d) => writeRole(v.entity_id, { ...d, name: d.name, functions: d.functions || [] }, (get('SELECT MAX(version) m FROM entity_versions WHERE entity_type=? AND entity_id=?', 'obs_role', v.entity_id).m || 0) + 1));
r.post('/obs-roles/:id/assignments', requirePerm('obs.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'obs_roles', req.params.id, true, 'Role');
  const b = req.body || {};
  const u = get('SELECT id FROM users WHERE id=? AND org_id=?', b.userId, x.org_id);
  if (!u) throw bad('BAD_USER', 'Choose a person of the organization.');
  const type = ['Holder', 'Deputy', 'Acting'].includes(b.holderType) ? b.holderType : 'Holder';
  const alloc = Math.max(1, Math.min(100, +b.allocation || 100));
  if (b.endDate && b.startDate && b.endDate < b.startDate) throw bad('BAD_DATES', 'The end date is before the start date.');
  const id = uid();
  run('INSERT INTO role_assignments(id,org_id,role_id,user_id,holder_type,allocation,start_date,end_date,created_at) VALUES(?,?,?,?,?,?,?,?,?)', id, x.org_id, x.id, u.id, type, alloc, b.startDate || now().slice(0, 10), b.endDate || null, now());
  audit(req, x.org_id, 'role_assignment', id, 'create', null, { role: x.id, user: u.id, type, alloc }, null);
  res.status(201).json({ id });
}));
r.put('/role-assignments/:id', requirePerm('obs.manage'), h((req, res) => {
  const a = loadOrgRow(req, 'role_assignments', req.params.id, true, 'Assignment');
  const b = req.body || {};
  run('UPDATE role_assignments SET holder_type=COALESCE(?,holder_type), allocation=COALESCE(?,allocation), start_date=COALESCE(?,start_date), end_date=? WHERE id=?', b.holderType || null, b.allocation ? Math.max(1, Math.min(100, +b.allocation)) : null, b.startDate || null, b.endDate === undefined ? a.end_date : b.endDate || null, a.id);
  // When an assignment ends, the open work assigned to the person by name is listed for re-assignment (FR-DA-OBS-07).
  const open = b.endDate ? all("SELECT id, title FROM actions WHERE owner_user=? AND status NOT IN ('Closed','Cancelled') LIMIT 50", a.user_id).map(x => ({ id: x.id, title: P(x.title) })) : [];
  audit(req, a.org_id, 'role_assignment', a.id, 'update', a, b, null);
  send(req, res, { ok: true, openWork: open });
}));
r.delete('/role-assignments/:id', requirePerm('obs.manage'), h((req, res) => {
  const a = loadOrgRow(req, 'role_assignments', req.params.id, true, 'Assignment');
  run('DELETE FROM role_assignments WHERE id=?', a.id);
  audit(req, a.org_id, 'role_assignment', a.id, 'delete', a, null, null);
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- AI prompt specification (FR-DA-AIP)
r.get('/ai/usecases/:id/spec', requirePerm('ai.view'), h((req, res) => {
  const u = loadOrgRow(req, 'ai_usecases', req.params.id, false, 'AI use case');
  const spec = specOf(u);
  if (!u.prompt_spec) { run('UPDATE ai_usecases SET prompt_spec=? WHERE id=?', J(spec), u.id); if (!versions('prompt_spec', u.id).length) snapshot({ user: null }, u.org_id, 'prompt_spec', u.id, spec, { en: 'Generated for the linked step', fr: 'Générée pour l\'étape liée', ar: 'مولّدة للخطوة المرتبطة' }); }
  const c = catalog();
  const fieldVersions = Object.fromEntries(SPEC_FIELDS.map(k => [k, get('SELECT COUNT(*) n FROM entity_versions WHERE entity_type=? AND entity_id=?', 'prompt_field', `${u.id}:${k}`).n]));
  send(req, res, { id: u.id, code: u.code, name: P(u.name), step: u.linked_step ? { id: u.linked_step, name: c.stepById[u.linked_step]?.name, mp: c.stepById[u.linked_step]?.mp } : null, fields: SPEC_FIELDS.map(k => ({ key: k, label: SPEC_LABELS[k], required: SPEC_REQUIRED.includes(k), versions: fieldVersions[k] })), spec, completeness: specCompleteness(spec, req.lang), versions: versions('prompt_spec', u.id).length, active: !!u.active });
}));
// Edits one or several fields; each field changed gets its own version, and the whole
// specification a new version (FR-DA-AIP-04).
r.put('/ai/usecases/:id/spec', requirePerm('ai.manage'), h((req, res) => {
  const u = loadOrgRow(req, 'ai_usecases', req.params.id, true, 'AI use case');
  const prev = specOf(u);
  const b = req.body || {};
  const next = { ...prev };
  const changed = [];
  for (const k of SPEC_FIELDS) {
    if (b.fields?.[k] === undefined) continue;
    const val2 = k === 'params' ? { model: String(b.fields.params.model || prev.params?.model || ''), temperature: Math.max(0, Math.min(1, +b.fields.params.temperature ?? 0.2)), maxTokens: Math.max(50, Math.min(8000, +b.fields.params.maxTokens || 800)) } : merge(req, prev[k], b.fields[k]);
    if (JSON.stringify(val2) === JSON.stringify(prev[k])) continue;
    if (!versions('prompt_field', `${u.id}:${k}`).length) snapshot(req, u.org_id, 'prompt_field', `${u.id}:${k}`, { value: prev[k] }, null);
    snapshot(req, u.org_id, 'prompt_field', `${u.id}:${k}`, { value: val2 }, b.note ? tr(req, b.note) : null);
    next[k] = val2; changed.push(k);
  }
  if (!changed.length) return res.json({ ok: true, changed });
  if (!versions('prompt_spec', u.id).length) snapshot(req, u.org_id, 'prompt_spec', u.id, prev, null);
  const v = snapshot(req, u.org_id, 'prompt_spec', u.id, next, tr(req, b.note || `Changed: ${changed.join(', ')}`));
  run('UPDATE ai_usecases SET prompt_spec=?, version=version+1 WHERE id=?', J(next), u.id);
  // An incomplete specification cannot stay active (FR-DA-AIP-06).
  const comp = specCompleteness(next, req.lang);
  if (!comp.complete && u.active) run('UPDATE ai_usecases SET active=0 WHERE id=?', u.id);
  audit(req, u.org_id, 'prompt_spec', u.id, 'update', pick(prev, changed), pick(next, changed), b.note || null);
  res.json({ ok: true, changed, version: v, completeness: comp });
}));
registerReverter('prompt_spec', (req, v, data) => run('UPDATE ai_usecases SET prompt_spec=?, version=version+1 WHERE id=?', J(data), v.entity_id));
registerReverter('prompt_field', (req, v, data) => {
  const [ucId, field] = v.entity_id.split(':');
  const u = get('SELECT * FROM ai_usecases WHERE id=?', ucId);
  const spec = { ...specOf(u), [field]: data.value };
  run('UPDATE ai_usecases SET prompt_spec=?, version=version+1 WHERE id=?', J(spec), ucId);
  snapshot(req, u.org_id, 'prompt_spec', ucId, spec, { en: `Field "${field}" restored to v${v.version}` });
});

export default r;
