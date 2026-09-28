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
  const acts = all('SELECT a.id, a.name FROM racsi_activities a WHERE a.project_id=? AND a.mp_id=?', p.id, m.id);
  const racsi = acts.map(a => ({ name: P(a.name), assignments: all('SELECT letter, assignee FROM racsi_assignments WHERE activity_id=?', a.id).map(x => ({ ...x, roleName: roleName(x.assignee) })) }));
  send(req, res, {
    mp: { ...m, e2eName: c.e2eById[m.e2e].name }, status: pm.status, progress: pm.progress, started_at: pm.started_at, completed_at: pm.completed_at,
    tasks: (c.tasksByMp[m.id] || []).map(t => ({ id: t.id, name: t.name, seq: t.seq, steps: (c.stepsByMp[m.id] || []).filter(s => s.task === t.id).map(s => ({ id: s.id, seq: s.seq, name: s.name, type: s.typeName, role: s.roleName, formKind: s.formKind, exec: byStep[s.id] ? { id: byStep[s.id].id, status: byStep[s.id].status, due_date: byStep[s.id].due_date, completed_at: byStep[s.id].completed_at, value: byStep[s.id].value, assignee: byStep[s.id].assignee_name, completedBy: byStep[s.id].completed_by_name } : null })) })),
    racsi, kpis: rows(all('SELECT id, code, name, target_text, direction FROM kpis WHERE project_id=? AND mp_id=?', p.id, m.id)),
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
    ...e, step: { ...s, form: c.forms[s.formKind] }, mp: { id: m.id, code: m.code, name: m.name, e2e: m.e2e, e2eName: c.e2eById[m.e2e].name, sipoc: m.sipoc, standards: m.standards },
    task: (c.tasksByMp[m.id] || []).find(t => t.id === s.task)?.name, roleName: roleName(e.assignee_role),
    assignee: e.assignee_user ? get('SELECT id, name, email FROM users WHERE id=?', e.assignee_user) : null,
    completedBy: e.completed_by ? get('SELECT id, name FROM users WHERE id=?', e.completed_by) : null,
    prev: siblings[i - 1]?.id || null, next: siblings[i + 1]?.id || null, position: i + 1, count: siblings.length,
    rules: c.rules.filter(x => x.step === s.id), controls: c.controls.filter(x => x.steps.includes(s.id)), aiUseCases: c.aiUseCases.filter(a => a.step === s.id || a.mp === m.id),
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
  res.json({ ok: true, version: d.version });
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
