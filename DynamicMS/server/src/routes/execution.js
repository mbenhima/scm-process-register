// Lifecycle execution: phases, macro processes, tasks and steps of a project, gate
// decisions, checklists and BPMN diagrams (FR-DA-GTE, FR-DA-CHK, FR-DA-BPMN).
import { Router } from 'express';
import { all, get, run, uid, now, J, P } from '../db.js';
import { requirePerm, can, assertFeature } from '../auth.js';
import { h, send, row, rows, bad, notFound, forbidden, loadProject, loadOrgRow, paginate, conflict } from '../http.js';
import { catalog } from '../catalog/store.js';
import { saveStep, reopenStep, decideGate, refreshProgress } from '../services/lifecycle.js';
import { versions, audit, snapshot } from '../services/audit.js';
import { generateBpmn, isValidBpmn } from '../services/bpmn.js';
import { ROLES } from '../permissions.js';
import { templatesForMp } from '../content/templates.js';
import { checkName } from '../catalog/naming.js';
import { templateLibrary } from './documents.js';

const r = Router();
const roleName = (c) => ROLES.find(x => x.code === c)?.name || (c === 'system' ? { en: 'DynamicMS Engine', fr: 'Moteur DynamicMS', ar: 'محرك DynamicMS' } : c);

r.get('/projects/:id/lifecycle', requirePerm('execution.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const c = catalog();
  const phases = rows(all('SELECT * FROM phases WHERE project_id=? ORDER BY seq', p.id));
  const mps = all('SELECT * FROM project_mps WHERE project_id=?', p.id);
  const counts = all(`SELECT e2e_id, COUNT(*) n, SUM(status='Done') d, SUM(status='InProgress') ip, SUM(status<>'Done' AND due_date < date('now')) od FROM step_exec WHERE project_id=? GROUP BY e2e_id`, p.id);
  const gates = Object.fromEntries(all('SELECT id, code, name, exit_criteria FROM gate_defs').map(g => [g.code, row(g)]));
  const withGate = new Set(all('SELECT DISTINCT phase_id FROM checklists WHERE project_id=?', p.id).map(x => x.phase_id));
  send(req, res, phases.map(ph => {
    const e = c.e2eById[ph.e2e_id];
    const cnt = counts.find(x => x.e2e_id === ph.e2e_id) || { n: 0, d: 0, ip: 0, od: 0 };
    const order = e.mpIds;
    return { ...ph, name: e.name, goals: e.goals, type: e.typeName, trigger: e.trigger, terminal: e.terminal, steps: cnt.n, done: cnt.d, inProgress: cnt.ip, overdue: cnt.od,
      progress: cnt.n ? Math.round(100 * cnt.d / cnt.n) : 0, gate: withGate.has(ph.id) ? gates[`GATE-${ph.e2e_id}`] : null,
      mps: mps.filter(m => m.e2e_id === ph.e2e_id).sort((a, b) => order.indexOf(a.mp_id) - order.indexOf(b.mp_id)).map(m => { const cm = c.mpById[m.mp_id]; return { id: m.mp_id, code: cm.code, name: cm.name, tier: cm.tier, status: m.status, progress: m.progress, owner: cm.ownerRoleName, ownerCode: cm.ownerRoleCode, steps: cm.stepCount, activation: m.activation }; }) };
  }));
}));

r.get('/projects/:id/mps/:mpId', requirePerm('execution.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const c = catalog();
  const m = c.mpById[req.params.mpId];
  const pm = get('SELECT * FROM project_mps WHERE project_id=? AND mp_id=?', p.id, req.params.mpId);
  if (!m || !pm) throw notFound('Macro process');
  const execs = rows(all('SELECT e.*, u.name AS assignee_name, cu.name AS completed_by_name FROM step_exec e LEFT JOIN users u ON u.id=e.assignee_user LEFT JOIN users cu ON cu.id=e.completed_by WHERE e.project_id=? AND e.mp_id=? ORDER BY e.seq', p.id, m.id));
  const byStep = Object.fromEntries(execs.map(e => [e.step_id, e]));
  const acts = all('SELECT a.id, a.name, a.linked_type, a.step_ref FROM racsi_activities a WHERE a.project_id=? AND a.mp_id=?', p.id, m.id);
  const racsi = acts.map(a => ({ id: a.id, level: a.linked_type, stepId: a.step_ref, name: P(a.name), assignments: all('SELECT letter, assignee FROM racsi_assignments WHERE activity_id=?', a.id).map(x => ({ ...x, roleName: roleName(x.assignee) })) }));
  send(req, res, {
    mp: { ...m, e2eName: c.e2eById[m.e2e].name }, status: pm.status, progress: pm.progress, started_at: pm.started_at, completed_at: pm.completed_at,
    tasks: (c.tasksByMp[m.id] || []).map(t => ({ id: t.id, name: t.name, seq: t.seq, steps: (c.stepsByMp[m.id] || []).filter(s => s.task === t.id).map(s => ({ id: s.id, seq: s.seq, name: s.name, brief: s.brief, type: s.typeName, role: s.roleName, formKind: s.formKind, exec: byStep[s.id] ? { id: byStep[s.id].id, status: byStep[s.id].status, due_date: byStep[s.id].due_date, completed_at: byStep[s.id].completed_at, value: byStep[s.id].value, assignee: byStep[s.id].assignee_name, completedBy: byStep[s.id].completed_by_name } : null })) })),
    racsi, canEditRacsi: can(req, 'governance.manage') || can(req, 'project.manage'), kpis: rows(all('SELECT id, code, name, target_text, direction FROM kpis WHERE project_id=? AND mp_id=?', p.id, m.id)),
    rules: c.rules.filter(x => x.mp === m.id), controls: c.controls.filter(x => x.steps.some(s => s.startsWith(m.id + '.'))), aiUseCases: c.aiUseCases.filter(a => a.mp === m.id),
  });
}));

r.get('/projects/:id/steps', requirePerm('execution.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const c = catalog();
  const { limit, offset } = paginate(req);
  const where = ['e.project_id=?']; const args = [p.id];
  if (req.query.status) { where.push('e.status=?'); args.push(req.query.status); }
  if (req.query.open === '1') where.push(`e.status<>'Done'`);
  if (req.query.overdue === '1') where.push(`e.status<>'Done' AND e.due_date < date('now')`);
  if (req.query.mine === '1') { where.push(`(e.assignee_user=? OR e.assignee_role IN (${req.user.roles.map(() => '?').join(',') || "''"}))`); args.push(req.user.id, ...req.user.roles); }
  if (req.query.e2e) { where.push('e.e2e_id=?'); args.push(req.query.e2e); }
  if (req.query.mp) { where.push('e.mp_id=?'); args.push(req.query.mp); }
  const sql = `FROM step_exec e LEFT JOIN users u ON u.id=e.assignee_user WHERE ${where.join(' AND ')}`;
  const total = get(`SELECT COUNT(*) n ${sql}`, ...args).n;
  const list = rows(all(`SELECT e.id, e.step_id, e.mp_id, e.e2e_id, e.status, e.due_date, e.completed_at, e.assignee_role, e.form_kind, e.value, u.name AS assignee_name ${sql} ORDER BY ${req.query.open === '1' || req.query.mine === '1' ? 'e.due_date' : 'e.seq'} LIMIT ? OFFSET ?`, ...args, limit, offset));
  send(req, res, { total, items: list.map(e => ({ ...e, name: c.stepById[e.step_id]?.name, mpCode: c.mpById[e.mp_id]?.code, mpName: c.mpById[e.mp_id]?.name, roleName: roleName(e.assignee_role) })) });
}));

function stepRacsiOf(projectId, stepId) {
  const a = get(`SELECT id FROM racsi_activities WHERE project_id=? AND step_ref=? AND linked_type='step'`, projectId, stepId);
  if (!a) return null;
  const out = { R: [], A: [], C: [], S: [], I: [] };
  for (const x of all('SELECT letter, assignee FROM racsi_assignments WHERE activity_id=?', a.id)) out[x.letter].push(x.assignee);
  return out;
}
function stepDetail(req, e) {
  const c = catalog();
  const s = c.stepById[e.step_id];
  const m = c.mpById[e.mp_id];
  const siblings = all('SELECT id, step_id, status FROM step_exec WHERE project_id=? AND mp_id=? ORDER BY seq', e.project_id, e.mp_id);
  const i = siblings.findIndex(x => x.id === e.id);
  const phase = get('SELECT gate_decision FROM phases WHERE project_id=? AND e2e_id=?', e.project_id, e.e2e_id);
  const history = rows(all('SELECT a.action, a.at, a.justification, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id WHERE a.entity_type=? AND a.entity_id=? ORDER BY a.at DESC', 'step', e.id));
  const canPerform = can(req, 'execution.perform') && (req.user.roles.includes(e.assignee_role) || can(req, 'project.manage'));
  return {
    ...e, step: { ...s, form: c.forms[s.formKind] }, mp: { id: m.id, code: m.code, name: m.name, e2e: m.e2e, e2eName: c.e2eById[m.e2e].name, sipoc: m.sipoc, standards: P(get('SELECT standards FROM projects WHERE id=?', e.project_id).standards) || [], clauses: m.clauses },
    task: (c.tasksByMp[m.id] || []).find(t => t.id === s.task)?.name, roleName: roleName(e.assignee_role),
    assignee: e.assignee_user ? get('SELECT id, name, email FROM users WHERE id=?', e.assignee_user) : null,
    completedBy: e.completed_by ? get('SELECT id, name FROM users WHERE id=?', e.completed_by) : null,
    prev: siblings[i - 1]?.id || null, next: siblings[i + 1]?.id || null, position: i + 1, count: siblings.length,
    rules: c.rules.filter(x => x.step === s.id), controls: c.controls.filter(x => x.steps.includes(s.id)), aiUseCases: c.aiUseCases.filter(a => a.step === s.id),
    templates: templatesForMp(m.id, get('SELECT ms_type FROM projects WHERE id=?', e.project_id).ms_type).map(t => ({ code: t.code, name: t.name })),
    documents: rows(all('SELECT id, code, title, status, current_version, template_id FROM documents WHERE project_id=? AND (source_step=? OR mp_id=?) ORDER BY code', e.project_id, e.id, m.id)),
    stepRacsi: stepRacsiOf(e.project_id, s.id),
    locked: phase?.gate_decision === 'Go', canPerform, canReopen: can(req, 'execution.reopen') && e.status === 'Done' && phase?.gate_decision !== 'Go',
    history, versions: rows(versions('step', e.id)).map(v => ({ version: v.version, at: v.at, is_current: v.is_current, justification: v.justification })),
  };
}

r.get('/steps/:id', requirePerm('execution.view'), h((req, res) => {
  const e = loadOrgRow(req, 'step_exec', req.params.id, false, 'Step');
  send(req, res, stepDetail(req, e));
}));
function guardPerform(req, e) {
  if (!(req.user.roles.includes(e.assignee_role) || can(req, 'project.manage'))) throw forbidden('NOT_ASSIGNEE', 'This step is assigned to another role.');
}
r.put('/steps/:id', requirePerm('execution.perform'), h((req, res) => {
  const e = loadOrgRow(req, 'step_exec', req.params.id, true, 'Step');
  guardPerform(req, e);
  const out = saveStep(req, get('SELECT * FROM step_exec WHERE id=?', e.id), req.body?.fields || {}, false);
  res.json(out);
}));
r.post('/steps/:id/complete', requirePerm('execution.perform'), h((req, res) => {
  const e = loadOrgRow(req, 'step_exec', req.params.id, true, 'Step');
  guardPerform(req, e);
  const out = saveStep(req, get('SELECT * FROM step_exec WHERE id=?', e.id), req.body?.fields || {}, true);
  res.json(out);
}));
r.post('/steps/:id/reopen', requirePerm('execution.reopen'), h((req, res) => {
  const e = loadOrgRow(req, 'step_exec', req.params.id, true, 'Step');
  reopenStep(req, get('SELECT * FROM step_exec WHERE id=?', e.id), req.body?.justification);
  res.json({ ok: true });
}));
r.put('/steps/:id/assign', requirePerm('project.manage'), h((req, res) => {
  const e = loadOrgRow(req, 'step_exec', req.params.id, true, 'Step');
  const u = get('SELECT id FROM users WHERE id=? AND org_id=?', req.body?.userId, e.org_id);
  if (!u) throw bad('BAD_USER', 'Choose a user of this organization.');
  run('UPDATE step_exec SET assignee_user=?, due_date=COALESCE(?,due_date), updated_at=? WHERE id=?', u.id, req.body?.dueDate || null, now(), e.id);
  audit(req, e.org_id, 'step', e.id, 'assign', { assignee: e.assignee_user }, { assignee: u.id, due: req.body?.dueDate }, null);
  res.json({ ok: true });
}));

// ---- Pickers for the step forms: people (OBS), organization units, KPIs, templates, standards
r.get('/projects/:id/pickers', requirePerm('execution.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const c = catalog();
  const nodes = rows(all('SELECT id, parent_id, name, type FROM obs_nodes WHERE org_id=? AND (project_id IS NULL OR project_id=?) ORDER BY created_at', p.org_id, p.id));
  const members = all('SELECT m.node_id, m.user_id, m.role_in_node FROM obs_members m WHERE m.org_id=?', p.org_id);
  const users = all('SELECT id, name, email, roles FROM users WHERE org_id=? AND status=? ORDER BY name', p.org_id, 'Active').map(u => ({ id: u.id, name: u.name, email: u.email, roles: JSON.parse(u.roles), units: members.filter(m => m.user_id === u.id).map(m => m.node_id) }));
  const kpis = rows(all('SELECT id, code, name, target_text, mp_id, unit FROM kpis WHERE project_id=? ORDER BY code', p.id));
  const stds = [...new Set([...(c.standards || []).map(x => x.code), 'ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 27001', 'ISO 50001'])].sort();
  send(req, res, { users, obs: nodes, kpis, standards: stds, projectStandards: P(p.standards) || [], templates: templateLibrary(p.org_id).filter(t => t.ms.includes(p.ms_type)).map(t => ({ code: t.code, name: t.name, mp: t.mp, category: t.category })), roles: ROLES.filter(x => x.code !== 'platform_admin') });
}));
// A new KPI created from a step form (the performer may not hold governance rights).
r.post('/steps/:id/kpis', requirePerm('execution.perform'), h((req, res) => {
  const e = loadOrgRow(req, 'step_exec', req.params.id, true, 'Step');
  guardPerform(req, e);
  const b = req.body || {};
  if (!b.name || b.target === undefined || b.target === '') throw bad('FIELDS_REQUIRED', 'Name and target are required.');
  const n = get('SELECT COUNT(*) n FROM kpis WHERE project_id=? AND custom=1', e.project_id).n;
  const id = uid();
  const t = +b.target; const unit = b.unit || '';
  run('INSERT INTO kpis(id,org_id,project_id,code,name,formula,unit,target,target_text,direction,frequency,analysis_frequency,mp_id,owner_role,custom,racsi,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)',
    id, e.org_id, e.project_id, `KPI-C${String(n + 1).padStart(2, '0')}`, J({ [req.lang]: String(b.name) }), J({ [req.lang]: String(b.formula || b.name) }), unit, t, `${b.direction === 'down' ? '<=' : '>='} ${t}${unit === '%' ? '%' : ''}`, b.direction === 'down' ? 'down' : 'up', b.frequency || 'Monthly', 'Quarterly', e.mp_id, catalog().mpById[e.mp_id]?.ownerRoleCode || 'performance_manager', J({ A: ['ims_manager'] }), 'step', now());
  audit(req, e.org_id, 'kpi', id, 'create', null, { ...b, fromStep: e.step_id }, null);
  res.status(201).json({ id, code: `KPI-C${String(n + 1).padStart(2, '0')}` });
}));

// ---- RACSI of a macro process (default) and, when needed, of a step (five columns, one A)
r.put('/projects/:id/mps/:mpId/racsi', requirePerm('execution.view'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  if (!(can(req, 'governance.manage') || can(req, 'project.manage'))) throw forbidden();
  const c = catalog();
  const m = c.mpById[req.params.mpId];
  if (!m) throw notFound('Macro process');
  const letters = req.body?.letters || {};
  const stepId = req.body?.stepId || null;
  if (stepId && c.stepById[stepId]?.mp !== m.id) throw bad('BAD_STEP', 'The step does not belong to this macro process.');
  for (const L of Object.keys(letters)) if (!['R', 'A', 'C', 'S', 'I'].includes(L)) throw bad('BAD_LETTER', 'Letters are R, A, C, S and I.');
  if ((letters.A || []).length > 1) throw bad('ONE_ACCOUNTABLE', 'Only one role can be Accountable (A).');
  if (!stepId && !(letters.A || []).length) throw bad('ACCOUNTABLE_REQUIRED', 'A macro process needs one Accountable (A).');
  const valid = new Set(ROLES.map(x => x.code));
  for (const list of Object.values(letters)) for (const code of list) if (!valid.has(code)) throw bad('BAD_ROLE', `Unknown role ${code}.`);
  let a = stepId ? get(`SELECT * FROM racsi_activities WHERE project_id=? AND step_ref=? AND linked_type='step'`, p.id, stepId) : get(`SELECT * FROM racsi_activities WHERE project_id=? AND mp_id=? AND linked_type='mp'`, p.id, m.id);
  const before = a ? all('SELECT letter, assignee FROM racsi_assignments WHERE activity_id=?', a.id) : null;
  if (!a) {
    const id = uid();
    run('INSERT INTO racsi_activities(id,org_id,project_id,e2e_id,mp_id,step_ref,linked_type,linked_id,name,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', id, p.org_id, p.id, m.e2e, m.id, stepId, stepId ? 'step' : 'mp', stepId || m.id, J(stepId ? c.stepById[stepId].name : m.name), now());
    a = { id };
  }
  const empty = !Object.values(letters).some(x => x.length);
  if (stepId && empty) { run('DELETE FROM racsi_activities WHERE id=?', a.id); }
  else {
    run('DELETE FROM racsi_assignments WHERE activity_id=?', a.id);
    for (const L of ['R', 'A', 'C', 'S', 'I']) for (const code of [...new Set(letters[L] || [])]) run('INSERT INTO racsi_assignments(id,activity_id,org_id,letter,assignee) VALUES(?,?,?,?,?)', uid(), a.id, p.org_id, L, code);
  }
  audit(req, p.org_id, 'racsi', a.id, 'update', before, { mp: m.id, step: stepId, letters }, req.body?.justification || null);
  res.json({ ok: true });
}));

// ---- Readiness checklist of a macro process: optional list of what should be in place before starting
function readinessItems(p, m) {
  const c = catalog();
  const L = (en, fr, ar) => ({ en, fr, ar });
  const items = m.sipoc.I.slice(0, 5).map((x, i) => ({ id: `in${i + 1}`, text: { en: `Input available: ${x.en}`, fr: `Élément d'entrée disponible : ${x.fr}`, ar: `المدخل متاح: ${x.ar}` } }));
  const order = c.e2eById[m.e2e].mpIds;
  const prev = all('SELECT mp_id, status FROM project_mps WHERE project_id=? AND e2e_id=?', p.id, m.e2e).filter(x => order.indexOf(x.mp_id) < order.indexOf(m.id));
  if (prev.length) items.push({ id: 'prev', text: L(`Previous macro processes of the phase completed (${prev.map(x => c.mpById[x.mp_id].code).join(', ')})`, `Macro-processus précédents de la phase terminés (${prev.map(x => c.mpById[x.mp_id].code).join(', ')})`, `اكتمال العمليات الكلية السابقة في المرحلة (${prev.map(x => c.mpById[x.mp_id].code).join('، ')})`), auto: prev.every(x => x.status === 'Completed') });
  const hasA = get(`SELECT 1 FROM racsi_assignments ra JOIN racsi_activities a ON a.id=ra.activity_id WHERE a.project_id=? AND a.mp_id=? AND a.linked_type='mp' AND ra.letter='A'`, p.id, m.id);
  items.push({ id: 'racsi', text: L('Owner and RACSI assigned', 'Pilote et RACSI désignés', 'تعيين المالك ومصفوفة RACSI'), auto: !!hasA });
  const tpls = templatesForMp(m.id, p.ms_type);
  if (tpls.length) items.push({ id: 'tpl', text: { en: `Document templates ready: ${tpls.map(t => t.name.en).join(', ')}`, fr: `Modèles de documents prêts : ${tpls.map(t => t.name.fr).join(', ')}`, ar: `نماذج الوثائق جاهزة: ${tpls.map(t => t.name.ar).join('، ')}` }, auto: tpls.every(t => get('SELECT 1 FROM documents WHERE project_id=? AND template_id=?', p.id, t.code)) });
  items.push({ id: 'team', text: L('People involved informed of the start and due dates', 'Personnes concernées informées du démarrage et des échéances', 'إبلاغ المعنيين بموعد البدء والاستحقاق') });
  const ks = get('SELECT COUNT(*) n FROM kpis WHERE project_id=? AND mp_id=?', p.id, m.id).n;
  items.push({ id: 'kpi', text: L('KPIs of the macro process defined', 'KPI du macro-processus définis', 'تحديد مؤشرات العملية الكلية'), auto: ks > 0 });
  return items;
}
r.get('/projects/:id/mps/:mpId/readiness', requirePerm('execution.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const m = catalog().mpById[req.params.mpId];
  if (!m) throw notFound('Macro process');
  const saved = get('SELECT * FROM mp_readiness WHERE project_id=? AND mp_id=?', p.id, m.id);
  const ticks = saved ? JSON.parse(saved.items) : {};
  const items = readinessItems(p, m).map(it => ({ ...it, done: ticks[it.id]?.done ?? it.auto ?? false, doneBy: ticks[it.id]?.by ? get('SELECT name FROM users WHERE id=?', ticks[it.id].by)?.name : null, doneAt: ticks[it.id]?.at || null }));
  send(req, res, { items, ready: items.filter(i => i.done).length, total: items.length, canEdit: can(req, 'execution.perform') });
}));
r.put('/projects/:id/mps/:mpId/readiness', requirePerm('execution.perform'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const m = catalog().mpById[req.params.mpId];
  if (!m) throw notFound('Macro process');
  const saved = get('SELECT * FROM mp_readiness WHERE project_id=? AND mp_id=?', p.id, m.id);
  const ticks = saved ? JSON.parse(saved.items) : {};
  const id = String(req.body?.itemId || '');
  if (!readinessItems(p, m).some(x => x.id === id)) throw bad('BAD_ITEM', 'Unknown checklist item.');
  ticks[id] = { done: !!req.body?.done, by: req.user.id, at: now() };
  run('INSERT INTO mp_readiness(project_id,org_id,mp_id,items,updated_by,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(project_id,mp_id) DO UPDATE SET items=excluded.items, updated_by=excluded.updated_by, updated_at=excluded.updated_at', p.id, p.org_id, m.id, J(ticks), req.user.id, now());
  audit(req, p.org_id, 'mp_readiness', `${p.id}:${m.id}`, req.body?.done ? 'check' : 'uncheck', null, { item: id }, null);
  res.json({ ok: true });
}));

// ---- Phases, gates and checklists
r.get('/phases/:id', requirePerm('execution.view'), h((req, res) => {
  const ph = loadOrgRow(req, 'phases', req.params.id, false, 'Phase');
  const c = catalog();
  const lists = rows(all('SELECT * FROM checklists WHERE phase_id=?', ph.id)).map(cl => ({ ...cl, items: rows(all('SELECT ci.*, u.name AS done_by_name FROM checklist_items ci LEFT JOIN users u ON u.id=ci.done_by WHERE ci.checklist_id=? ORDER BY ci.seq', cl.id)) }));
  const gate = row(get('SELECT * FROM gate_defs WHERE code=?', `GATE-${ph.e2e_id}`));
  const open = get(`SELECT COUNT(*) n FROM step_exec WHERE project_id=? AND e2e_id=? AND status<>'Done'`, ph.project_id, ph.e2e_id).n;
  send(req, res, { ...ph, name: c.e2eById[ph.e2e_id].name, gate: lists.length ? gate : null, checklists: lists, openSteps: open, decidedBy: ph.decided_by ? get('SELECT name FROM users WHERE id=?', ph.decided_by)?.name : null, canDecide: can(req, 'project.manage') });
}));
r.post('/phases/:id/gate', requirePerm('project.manage'), h((req, res) => {
  const ph = loadOrgRow(req, 'phases', req.params.id, true, 'Phase');
  decideGate(req, get('SELECT * FROM phases WHERE id=?', ph.id), req.body?.decision, req.body?.comment);
  res.json({ ok: true });
}));
r.put('/checklist-items/:id', requirePerm('execution.perform'), h((req, res) => {
  const it = loadOrgRow(req, 'checklist_items', req.params.id, true, 'Checklist item');
  const cl = get('SELECT * FROM checklists WHERE id=?', it.checklist_id);
  if (cl.frozen) throw conflict('CHECKLIST_FROZEN', 'The checklist is frozen after the gate decision.');
  if (req.body?.done && it.evidence_required && !get(`SELECT 1 FROM attachments WHERE entity_type='checklist_item' AND entity_id=?`, it.id) && !req.body?.evidenceNote) throw bad('EVIDENCE_REQUIRED', 'Attach evidence or enter an evidence note.');
  run('UPDATE checklist_items SET done=?, done_by=?, done_at=? WHERE id=?', req.body?.done ? 1 : 0, req.body?.done ? req.user.id : null, req.body?.done ? now() : null, it.id);
  audit(req, it.org_id, 'checklist_item', it.id, req.body?.done ? 'check' : 'uncheck', { done: it.done }, { done: !!req.body?.done, note: req.body?.evidenceNote || null }, null);
  res.json({ ok: true });
}));
r.post('/checklists/:id/items', requirePerm('project.manage'), h((req, res) => {
  const cl = loadOrgRow(req, 'checklists', req.params.id, true, 'Checklist');
  if (cl.frozen) throw conflict('CHECKLIST_FROZEN', 'The checklist is frozen.');
  if (!req.body?.text) throw bad('TEXT_REQUIRED', 'Item text is required.');
  const n = get('SELECT MAX(seq) m FROM checklist_items WHERE checklist_id=?', cl.id).m || 0;
  const id = uid();
  run('INSERT INTO checklist_items(id,checklist_id,org_id,seq,text,mandatory,evidence_required,done) VALUES(?,?,?,?,?,?,?,0)', id, cl.id, cl.org_id, n + 1, J({ [req.lang]: req.body.text }), req.body.mandatory ? 1 : 0, req.body.evidence ? 1 : 0);
  audit(req, cl.org_id, 'checklist', cl.id, 'add_item', null, req.body, null);
  res.status(201).json({ id });
}));

// ---- BPMN diagrams (generated from the process design; editable when entitled)
r.get('/projects/:id/bpmn/:mpId', requirePerm('process.view', 'execution.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const saved = get('SELECT * FROM bpmn_diagrams WHERE org_id=? AND mp_id=?', p.org_id, req.params.mpId);
  const xml = saved?.xml || generateBpmn(req.params.mpId, req.lang);
  if (!xml) throw notFound('Diagram');
  let canEdit = false;
  try { assertFeature(p.org_id, 'bpmn_edit'); canEdit = can(req, 'process.design'); } catch { canEdit = false; }
  res.json({ xml, saved: !!saved, version: saved?.version || 0, status: saved?.status || 'Generated', canEdit, updatedAt: saved?.updated_at || null });
}));
r.put('/projects/:id/bpmn/:mpId', requirePerm('process.design'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  assertFeature(p.org_id, 'bpmn_edit');
  const xml = req.body?.xml;
  if (!isValidBpmn(xml)) throw bad('BAD_BPMN', 'The file is not a valid BPMN 2.0 diagram.');
  const cur = get('SELECT * FROM bpmn_diagrams WHERE org_id=? AND mp_id=?', p.org_id, req.params.mpId);
  if (cur) run('UPDATE bpmn_diagrams SET xml=?, version=version+1, status=?, updated_by=?, updated_at=? WHERE id=?', xml, req.body?.status || 'Draft', req.user.id, now(), cur.id);
  else run('INSERT INTO bpmn_diagrams(id,org_id,mp_id,name,xml,version,status,updated_by,updated_at) VALUES(?,?,?,?,?,1,?,?,?)', uid(), p.org_id, req.params.mpId, J(catalog().mpById[req.params.mpId]?.name), xml, req.body?.status || 'Draft', req.user.id, now());
  const d = get('SELECT * FROM bpmn_diagrams WHERE org_id=? AND mp_id=?', p.org_id, req.params.mpId);
  snapshot(req, p.org_id, 'bpmn', d.id, { xml, status: d.status }, req.body?.justification || null);
  audit(req, p.org_id, 'bpmn', d.id, cur ? 'update' : 'create', null, { mp: req.params.mpId, version: d.version }, null);
  // Naming convention: task names start with a verb and name their object.
  const names = [...xml.matchAll(/<bpmn:(?:userTask|task|serviceTask|manualTask|scriptTask)\b[^>]*\bname="([^"]*)"/g)].map(m => m[1].replace(/&#10;/g, ' ').trim()).filter(Boolean);
  const warnings = names.filter(n => !checkName('step', n).ok);
  res.json({ ok: true, version: d.version, warnings });
}));
r.delete('/projects/:id/bpmn/:mpId', requirePerm('process.design'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const d = get('SELECT * FROM bpmn_diagrams WHERE org_id=? AND mp_id=?', p.org_id, req.params.mpId);
  if (!d) throw notFound('Diagram');
  run('DELETE FROM bpmn_diagrams WHERE id=?', d.id);
  audit(req, p.org_id, 'bpmn', d.id, 'reset', { version: d.version }, null, null);
  res.json({ ok: true });
}));

export default r;
export { refreshProgress };
