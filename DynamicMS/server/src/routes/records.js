// Records: nonconformities, actions (two-party verification), audits and findings,
// documented information with versions, registers, REX and WBS.
import { Router } from 'express';
import { all, get, run, uid, now, J, P, tx } from '../db.js';
import { requirePerm, can, assertFeature } from '../auth.js';
import { h, send, row, rows, bad, notFound, forbidden, requireOrg, loadProject, loadOrgRow, conflict, paginate } from '../http.js';
import { audit, snapshot } from '../services/audit.js';
import { raise } from '../services/alerts.js';
import { addDays } from '../seed/rng.js';

const r = Router();
const tr = (req, v) => (v === undefined || v === null ? null : typeof v === 'object' ? v : { [req.lang]: String(v) });
const userIn = (orgId, id) => (id ? get('SELECT id, name FROM users WHERE id=? AND org_id=?', id, orgId) : null);

// ---- Nonconformities (E2E-09)
const STAGES = ['Open', 'Analysis', 'Action', 'Verification', 'Closed'];
r.get('/projects/:id/ncs', requirePerm('records.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const list = rows(all('SELECT n.*, u.name AS owner_name, (SELECT COUNT(*) FROM actions a WHERE a.source_type=\'nc\' AND a.source_id=n.id) AS actions FROM ncs n LEFT JOIN users u ON u.id=n.owner_user WHERE n.project_id=? ORDER BY n.detected_at DESC', p.id));
  send(req, res, list);
}));
r.post('/projects/:id/ncs', requirePerm('records.create'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const b = req.body || {};
  if (!b.title || !b.description || !b.source || !b.criticality) throw bad('FIELDS_REQUIRED', 'Title, description, source and criticality are required.');
  if (!['Minor', 'Major', 'Critical'].includes(b.criticality)) throw bad('BAD_CRITICALITY', 'Criticality must be Minor, Major or Critical.');
  const n = get('SELECT COUNT(*) n FROM ncs WHERE project_id=?', p.id).n;
  const id = uid();
  const code = `NC-${p.code}-${String(n + 1).padStart(3, '0')}`;
  const today = now().slice(0, 10);
  const owner = userIn(p.org_id, b.ownerUser) || get(`SELECT id FROM users WHERE org_id=? AND roles LIKE '%quality_manager%' LIMIT 1`, p.org_id);
  run('INSERT INTO ncs(id,org_id,project_id,code,title,description,source,category,criticality,status,stage,detected_at,due_date,mp_id,owner_user,cost,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    id, p.org_id, p.id, code, J(tr(req, b.title)), J(tr(req, b.description)), b.source, b.category || 'Product', b.criticality, 'Open', 'Open', b.detectedAt || today, addDays(today, b.criticality === 'Critical' ? 15 : 45), p.mode === 'SME' ? 'MP-158' : 'MP-018', owner?.id || req.user.id, b.cost ? +b.cost : null, now());
  audit(req, p.org_id, 'nc', id, 'create', null, b, null);
  snapshot(req, p.org_id, 'nc', id, { ...b, code, stage: 'Open' }, null);
  if (b.criticality === 'Critical') raise({ orgId: p.org_id, projectId: p.id, type: 'NC_CRITICAL', title: { [req.lang]: `${code} — ${b.title}` }, entityType: 'nc', entityId: id, escalation: ['quality_manager', 'top_management'] });
  res.status(201).json({ id, code });
}));
r.get('/ncs/:id', requirePerm('records.view'), h((req, res) => {
  const n = loadOrgRow(req, 'ncs', req.params.id, false, 'Nonconformity');
  const acts = rows(all('SELECT a.*, o.name AS owner_name, e.name AS evaluator_name FROM actions a LEFT JOIN users o ON o.id=a.owner_user LEFT JOIN users e ON e.id=a.evaluator_user WHERE a.source_type=? AND a.source_id=? ORDER BY a.start_date', 'nc', n.id)).map(a => hideVerdict(req, a));
  send(req, res, { ...n, owner: userIn(n.org_id, n.owner_user), actions: acts, rex: rows(all('SELECT * FROM rex WHERE source_type=? AND source_id=?', 'nc', n.id)), stages: STAGES });
}));
r.put('/ncs/:id', requirePerm('records.manage'), h((req, res) => {
  const n = loadOrgRow(req, 'ncs', req.params.id, true, 'Nonconformity');
  const b = req.body || {};
  const stage = b.stage || n.stage;
  const si = STAGES.indexOf(stage);
  if (si < 0) throw bad('BAD_STAGE', 'Unknown stage.');
  if (si > STAGES.indexOf(n.stage) + 1) throw conflict('STAGE_SKIP', 'Stages move one at a time.');
  const rootCause = b.rootCause !== undefined ? tr(req, b.rootCause) : n.root_cause;
  if (si >= 2 && !rootCause) throw bad('ROOT_CAUSE_REQUIRED', 'Record the root cause before planning actions.');
  if (stage === 'Verification' && get(`SELECT COUNT(*) n FROM actions WHERE source_type='nc' AND source_id=? AND kind='Corrective'`, n.id).n === 0) throw conflict('ACTION_REQUIRED', 'Add at least one corrective action.');
  if (stage === 'Closed') {
    const open = get(`SELECT COUNT(*) n FROM actions WHERE source_type='nc' AND source_id=? AND status<>'Closed'`, n.id).n;
    if (open) throw conflict('ACTIONS_OPEN', `${open} action(s) still open.`);
    if (!b.rex && !get('SELECT 1 FROM rex WHERE source_type=? AND source_id=?', 'nc', n.id)) throw bad('REX_REQUIRED', 'Record the lessons learned (REX) to close the nonconformity.');
  }
  tx(() => {
    run('UPDATE ncs SET stage=?, status=?, root_cause=?, closed_at=?, criticality=COALESCE(?,criticality), cost=COALESCE(?,cost) WHERE id=?', stage, stage === 'Closed' ? 'Closed' : 'Open', J(rootCause), stage === 'Closed' ? now().slice(0, 10) : null, b.criticality || null, b.cost ?? null, n.id);
    if (stage === 'Closed' && b.rex) {
      run('INSERT INTO rex(id,org_id,project_id,source_type,source_id,went_well,not_well,root_cause,recommendation,category,rating,mp_id,created_by,created_at,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)',
        uid(), n.org_id, n.project_id, 'nc', n.id, J(tr(req, b.rex.wentWell || '')), J(tr(req, b.rex.notWell || '')), J(rootCause), J(tr(req, b.rex.recommendation || '')), n.category, +b.rex.rating || 3, 'MP-022', req.user.id, now());
    }
    audit(req, n.org_id, 'nc', n.id, stage !== n.stage ? 'stage' : 'update', { stage: n.stage }, { stage, rootCause }, b.justification || null);
    snapshot(req, n.org_id, 'nc', n.id, row(get('SELECT * FROM ncs WHERE id=?', n.id)), b.justification || null);
  });
  res.json({ ok: true });
}));

// ---- Actions (owner and evaluator are always different users — FR-DA-RBAC-04)
function hideVerdict(req, a) {
  if (can(req, 'evaluation.view') || a.owner_user === req.user.id || a.evaluator_user === req.user.id) return a;
  return { ...a, verdict: null, verdictHidden: !!a.verdict };
}
r.get('/projects/:id/actions', requirePerm('records.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const where = ['a.project_id=?']; const args = [p.id];
  if (req.query.mine === '1') { where.push('(a.owner_user=? OR a.evaluator_user=?)'); args.push(req.user.id, req.user.id); }
  if (req.query.open === '1') where.push(`a.status<>'Closed'`);
  const list = rows(all(`SELECT a.*, o.name AS owner_name, e.name AS evaluator_name FROM actions a LEFT JOIN users o ON o.id=a.owner_user LEFT JOIN users e ON e.id=a.evaluator_user WHERE ${where.join(' AND ')} ORDER BY a.due_date`, ...args));
  send(req, res, list.map(a => hideVerdict(req, a)));
}));
function createAction(req, p, b) {
  if (!b.title || !b.ownerUser || !b.evaluatorUser || !b.dueDate) throw bad('FIELDS_REQUIRED', 'Title, owner, evaluator and due date are required.');
  if (b.ownerUser === b.evaluatorUser) throw bad('OWNER_EQUALS_EVALUATOR', 'The owner and the evaluator must be different users.');
  if (!userIn(p.org_id, b.ownerUser) || !userIn(p.org_id, b.evaluatorUser)) throw bad('BAD_USER', 'Owner and evaluator must belong to the organization.');
  const id = uid();
  run('INSERT INTO actions(id,org_id,project_id,source_type,source_id,kind,title,owner_user,evaluator_user,status,start_date,due_date,pct,predecessors,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)',
    id, p.org_id, p.id, b.sourceType || 'manual', b.sourceId || null, b.kind || 'Corrective', J(tr(req, b.title)), b.ownerUser, b.evaluatorUser, 'Open', b.startDate || now().slice(0, 10), b.dueDate, J([]), now());
  audit(req, p.org_id, 'action', id, 'create', null, b, null);
  snapshot(req, p.org_id, 'action', id, b, null);
  return id;
}
r.post('/projects/:id/actions', requirePerm('records.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  res.status(201).json({ id: createAction(req, p, req.body || {}) });
}));
r.put('/actions/:id', requirePerm('records.manage', 'records.view'), h((req, res) => {
  const a = loadOrgRow(req, 'actions', req.params.id, true, 'Action');
  const b = req.body || {};
  const isOwner = a.owner_user === req.user.id; const isEval = a.evaluator_user === req.user.id;
  if (!can(req, 'records.manage') && !isOwner && !isEval) throw forbidden();
  if (b.evaluatorUser && b.evaluatorUser === (b.ownerUser || a.owner_user)) throw bad('OWNER_EQUALS_EVALUATOR', 'The owner and the evaluator must be different users.');
  if (b.ownerUser && b.ownerUser === (b.evaluatorUser || a.evaluator_user)) throw bad('OWNER_EQUALS_EVALUATOR', 'The owner and the evaluator must be different users.');
  if (b.verdict !== undefined || b.effectiveness !== undefined) {
    if (!isEval) throw forbidden('EVALUATOR_ONLY', 'Only the evaluator records the effectiveness verdict.');
    if (a.pct < 100 && (b.pct ?? a.pct) < 100) throw conflict('NOT_COMPLETED', 'The owner must complete the action before evaluation.');
  }
  const status = b.effectiveness === 'Effective' || b.effectiveness === 'Partially effective' ? 'Closed' : b.status || a.status;
  run('UPDATE actions SET title=?, owner_user=COALESCE(?,owner_user), evaluator_user=COALESCE(?,evaluator_user), status=?, start_date=COALESCE(?,start_date), due_date=COALESCE(?,due_date), pct=COALESCE(?,pct), effectiveness=COALESCE(?,effectiveness), verdict=?, done_at=?, predecessors=COALESCE(?,predecessors) WHERE id=?',
    J(b.title ? { ...(a.title || {}), [req.lang]: b.title } : a.title), b.ownerUser || null, b.evaluatorUser || null, status, b.startDate || null, b.dueDate || null, b.pct ?? null, b.effectiveness || null,
    J(b.verdict !== undefined ? tr(req, b.verdict) : a.verdict), status === 'Closed' ? (a.done_at || now()) : null, b.predecessors ? J(b.predecessors) : null, a.id);
  audit(req, a.org_id, 'action', a.id, 'update', { status: a.status, pct: a.pct }, b, b.justification || null);
  snapshot(req, a.org_id, 'action', a.id, row(get('SELECT * FROM actions WHERE id=?', a.id)), b.justification || null);
  res.json({ ok: true });
}));

// ---- Audits and findings
r.get('/projects/:id/audits', requirePerm('records.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  send(req, res, rows(all(`SELECT a.*, u.name AS lead_name, (SELECT COUNT(*) FROM findings f WHERE f.audit_id=a.id) AS findings FROM audits a LEFT JOIN users u ON u.id=a.lead_user WHERE a.project_id=? ORDER BY a.planned_date`, p.id)));
}));
r.post('/projects/:id/audits', requirePerm('records.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const b = req.body || {};
  if (!b.title || !b.type || !b.plannedDate) throw bad('FIELDS_REQUIRED', 'Title, type and planned date are required.');
  const n = get('SELECT COUNT(*) n FROM audits WHERE project_id=?', p.id).n;
  const id = uid();
  run('INSERT INTO audits(id,org_id,project_id,code,title,type,standard,planned_date,status,lead_user,scope,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', id, p.org_id, p.id, `AUD-${p.code}-${String(n + 1).padStart(2, '0')}`, J(tr(req, b.title)), b.type, b.standard || 'ISO 9001', b.plannedDate, 'Planned', userIn(p.org_id, b.leadUser)?.id || req.user.id, J(tr(req, b.scope || '')), now());
  audit(req, p.org_id, 'audit', id, 'create', null, b, null);
  res.status(201).json({ id });
}));
r.get('/audits/:id', requirePerm('records.view'), h((req, res) => {
  const a = loadOrgRow(req, 'audits', req.params.id, false, 'Audit');
  send(req, res, { ...a, lead: userIn(a.org_id, a.lead_user), findings: rows(all('SELECT f.*, ac.status AS action_status FROM findings f LEFT JOIN actions ac ON ac.id=f.action_id WHERE f.audit_id=? ORDER BY f.type', a.id)) });
}));
r.put('/audits/:id', requirePerm('records.manage'), h((req, res) => {
  const a = loadOrgRow(req, 'audits', req.params.id, true, 'Audit');
  const b = req.body || {};
  run('UPDATE audits SET status=COALESCE(?,status), done_date=COALESCE(?,done_date), planned_date=COALESCE(?,planned_date) WHERE id=?', b.status || null, b.status === 'Completed' ? (b.doneDate || now().slice(0, 10)) : null, b.plannedDate || null, a.id);
  audit(req, a.org_id, 'audit', a.id, 'update', { status: a.status }, b, null);
  res.json({ ok: true });
}));
r.post('/audits/:id/findings', requirePerm('records.manage'), h((req, res) => {
  const a = loadOrgRow(req, 'audits', req.params.id, true, 'Audit');
  const b = req.body || {};
  if (!b.type || !b.text) throw bad('FIELDS_REQUIRED', 'Finding type and text are required.');
  let actionId = null;
  const p = get('SELECT * FROM projects WHERE id=?', a.project_id);
  tx(() => {
    if (['Major', 'Minor'].includes(b.type) && b.ownerUser) actionId = createAction(req, p, { title: b.text, ownerUser: b.ownerUser, evaluatorUser: b.evaluatorUser, dueDate: b.dueDate || addDays(now().slice(0, 10), 45), sourceType: 'finding', kind: 'Corrective' });
    const id = uid();
    run('INSERT INTO findings(id,org_id,audit_id,type,clause,text,status,action_id,mp_id) VALUES(?,?,?,?,?,?,?,?,?)', id, a.org_id, a.id, b.type, b.clause || null, J(tr(req, b.text)), ['Observation', 'OFI'].includes(b.type) ? 'Noted' : 'Open', actionId, b.mpId || 'MP-039');
    audit(req, a.org_id, 'finding', id, 'create', null, b, null);
  });
  res.status(201).json({ ok: true, actionId });
}));

// ---- Documented information: see routes/documents.js

// ---- Registers (context, interested parties, objectives, obligations, certificates, suppliers, ideas, competence, calibration, reviews, incidents)
const REGISTERS = ['context', 'parties', 'objectives', 'obligations', 'certificates', 'suppliers', 'ideas', 'competence', 'calibration', 'reviews', 'incidents'];
r.get('/projects/:id/registers', requirePerm('records.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  send(req, res, REGISTERS.map(k => ({ key: k, count: get('SELECT COUNT(*) n FROM registers WHERE project_id=? AND register=?', p.id, k).n })));
}));
r.get('/projects/:id/registers/:reg', requirePerm('records.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  if (!REGISTERS.includes(req.params.reg)) throw notFound('Register');
  send(req, res, rows(all('SELECT * FROM registers WHERE project_id=? AND register=? ORDER BY code', p.id, req.params.reg)));
}));
r.post('/projects/:id/registers/:reg', requirePerm('records.create'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  if (!REGISTERS.includes(req.params.reg)) throw notFound('Register');
  const b = req.body || {};
  if (!b.title) throw bad('TITLE_REQUIRED', 'Title is required.');
  if (req.params.reg !== 'ideas' && !can(req, 'records.manage')) throw forbidden();
  const n = get('SELECT COUNT(*) n FROM registers WHERE project_id=? AND register=?', p.id, req.params.reg).n;
  const id = uid();
  const data = Object.fromEntries(Object.entries(b.data || {}).map(([k, v]) => [k, typeof v === 'string' && isNaN(+v) && !/^\d{4}-\d{2}-\d{2}$/.test(v) ? { [req.lang]: v } : v]));
  run('INSERT INTO registers(id,org_id,project_id,register,code,title,data,status,mp_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', id, p.org_id, p.id, req.params.reg, `${req.params.reg.slice(0, 3).toUpperCase()}-N${n + 1}`, J(tr(req, b.title)), J(data), b.status || (req.params.reg === 'ideas' ? 'Proposed' : 'Active'), b.mpId || null, now());
  audit(req, p.org_id, 'register', id, 'create', null, b, null);
  res.status(201).json({ id });
}));
r.put('/registers/:id', requirePerm('records.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'registers', req.params.id, true, 'Register entry');
  const b = req.body || {};
  run('UPDATE registers SET title=?, data=?, status=COALESCE(?,status) WHERE id=?', J(b.title ? { ...(x.title || {}), [req.lang]: b.title } : x.title), J({ ...(x.data || {}), ...(b.data || {}) }), b.status || null, x.id);
  audit(req, x.org_id, 'register', x.id, 'update', x, b, null);
  snapshot(req, x.org_id, 'register', x.id, row(get('SELECT * FROM registers WHERE id=?', x.id)), null);
  res.json({ ok: true });
}));
r.delete('/registers/:id', requirePerm('records.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'registers', req.params.id, true, 'Register entry');
  run('DELETE FROM registers WHERE id=?', x.id);
  audit(req, x.org_id, 'register', x.id, 'delete', x, null, null);
  res.json({ ok: true });
}));

// ---- REX (return on experience)
r.get('/orgs/:id/rex', requirePerm('kb.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const q = (req.query.q || '').toString().toLowerCase();
  let list = rows(all('SELECT x.*, u.name AS author FROM rex x LEFT JOIN users u ON u.id=x.created_by WHERE x.org_id=? ORDER BY x.created_at DESC LIMIT 500', req.params.id));
  if (q) list = list.filter(x => JSON.stringify([x.went_well, x.not_well, x.root_cause, x.recommendation]).toLowerCase().includes(q));
  send(req, res, list);
}));
r.post('/projects/:id/rex', requirePerm('kb.manage', 'records.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const b = req.body || {};
  if (!b.recommendation) throw bad('FIELDS_REQUIRED', 'A recommendation is required.');
  const id = uid();
  run('INSERT INTO rex(id,org_id,project_id,source_type,source_id,went_well,not_well,root_cause,recommendation,category,rating,mp_id,created_by,created_at,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)',
    id, p.org_id, p.id, b.sourceType || 'project', b.sourceId || null, J(tr(req, b.wentWell || '')), J(tr(req, b.notWell || '')), J(tr(req, b.rootCause || '')), J(tr(req, b.recommendation)), b.category || 'General', +b.rating || 3, b.mpId || 'MP-087', req.user.id, now());
  audit(req, p.org_id, 'rex', id, 'create', null, b, null);
  res.status(201).json({ id });
}));

// ---- WBS and Gantt (FR-DA-WBS)
r.get('/projects/:id/wbs', requirePerm('records.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  assertFeature(p.org_id, 'wbs');
  const nodes = rows(all('SELECT * FROM wbs_nodes WHERE project_id=? ORDER BY seq', p.id));
  const ids = [...new Set(nodes.flatMap(n => n.action_ids || []))];
  const acts = ids.length ? rows(all(`SELECT id, title, status, start_date, due_date, pct, predecessors, done_at FROM actions WHERE id IN (${ids.map(() => '?').join(',')})`, ...ids)) : [];
  send(req, res, { nodes, actions: acts, today: now().slice(0, 10) });
}));
function hasCycle(projectId, nodeId, preds) {
  const map = Object.fromEntries(all('SELECT id, predecessors FROM wbs_nodes WHERE project_id=?', projectId).map(n => [n.id, P(n.predecessors) || []]));
  map[nodeId] = preds;
  const seen = new Set(); const stack = new Set();
  const visit = (n) => { if (stack.has(n)) return true; if (seen.has(n)) return false; seen.add(n); stack.add(n); for (const m of map[n] || []) if (visit(m)) return true; stack.delete(n); return false; };
  return Object.keys(map).some(visit);
}
r.post('/projects/:id/wbs', requirePerm('records.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  assertFeature(p.org_id, 'wbs');
  const b = req.body || {};
  if (!b.name) throw bad('NAME_REQUIRED', 'Name is required.');
  const parent = b.parentId ? get('SELECT id FROM wbs_nodes WHERE id=? AND project_id=?', b.parentId, p.id) : get('SELECT id FROM wbs_nodes WHERE project_id=? AND parent_id IS NULL', p.id);
  const id = uid();
  const n = get('SELECT MAX(seq) m FROM wbs_nodes WHERE project_id=?', p.id).m || 0;
  run('INSERT INTO wbs_nodes(id,org_id,project_id,parent_id,name,action_ids,start_date,end_date,pct,predecessors,seq) VALUES(?,?,?,?,?,?,?,?,?,?,?)', id, p.org_id, p.id, parent?.id || null, J(tr(req, b.name)), J(b.actionIds || []), b.startDate || now().slice(0, 10), b.endDate || addDays(now().slice(0, 10), 30), 0, J([]), n + 1);
  audit(req, p.org_id, 'wbs', id, 'create', null, b, null);
  res.status(201).json({ id });
}));
r.put('/wbs/:id', requirePerm('records.manage'), h((req, res) => {
  const w = loadOrgRow(req, 'wbs_nodes', req.params.id, true, 'WBS node');
  const b = req.body || {};
  if (b.startDate && b.endDate && b.endDate < b.startDate) throw bad('BAD_DATES', 'The end date must follow the start date.');
  if (b.predecessors && hasCycle(w.project_id, w.id, b.predecessors)) throw bad('DEPENDENCY_CYCLE', 'This dependency would create a cycle.');
  run('UPDATE wbs_nodes SET name=?, start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date), pct=COALESCE(?,pct), predecessors=COALESCE(?,predecessors), action_ids=COALESCE(?,action_ids) WHERE id=?',
    J(b.name ? { ...(w.name || {}), [req.lang]: b.name } : w.name), b.startDate || null, b.endDate || null, b.pct ?? null, b.predecessors ? J(b.predecessors) : null, b.actionIds ? J(b.actionIds) : null, w.id);
  audit(req, w.org_id, 'wbs', w.id, 'update', w, b, null);
  res.json({ ok: true });
}));
r.delete('/wbs/:id', requirePerm('records.manage'), h((req, res) => {
  const w = loadOrgRow(req, 'wbs_nodes', req.params.id, true, 'WBS node');
  if (!w.parent_id) throw bad('ROOT_NODE', 'The root node cannot be deleted.');
  run('UPDATE wbs_nodes SET parent_id=? WHERE parent_id=?', w.parent_id, w.id);
  run('DELETE FROM wbs_nodes WHERE id=?', w.id);
  audit(req, w.org_id, 'wbs', w.id, 'delete', w, null, null);
  res.json({ ok: true });
}));

export default r;
export { paginate };
