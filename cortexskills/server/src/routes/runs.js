import { Router } from 'express';
import { ah, parseMl, projectOf } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { J, S, HttpError, now, uuid, pick } from '../lib/util.js';
import { requirePerm, has } from '../rbac.js';
import { audit } from '../audit.js';
import * as cat from '../catalog.js';
import { refreshProgress, insertRecord } from '../services/projects.js';
import { invalidateTenant } from '../services/retrieval.js';
import { orgConfig } from '../entitlements.js';

const r = Router();
const taskOut = t => t && ({ ...t, guidance: J(t.guidance), output: J(t.output), steps: J(t.steps, []) });

r.get('/projects/:id/workspace', requirePerm('projects.view'), ah(req => {
  const p = projectOf(req, req.params.id);
  const e2e = all(`SELECT e.*, u.name owner_name, (SELECT COUNT(*) FROM task_instances t WHERE t.e2e_instance_id=e.id) tasks,
      (SELECT COUNT(*) FROM task_instances t WHERE t.e2e_instance_id=e.id AND t.status='Completed') done,
      (SELECT COUNT(*) FROM task_instances t WHERE t.e2e_instance_id=e.id AND t.status!='Completed' AND t.due_date < ?) overdue
    FROM e2e_instances e LEFT JOIN users u ON u.id=e.owner_id WHERE e.project_id=? ORDER BY e.phase, e.sort`, now(), p.id);
  const phases = cat.list('phase').map(ph => {
    const items = e2e.filter(x => x.phase === ph.no);
    const gateRec = all(`SELECT id, data FROM records WHERE entity='PhaseChecklist' AND project_id=? AND json_extract(data,'$.phase')=?`, p.id, ph.no).map(x => ({ id: x.id, ...J(x.data) }));
    return { ...ph, items, progress: items.length ? Math.round(items.reduce((s, x) => s + x.progress, 0) / items.length) : 0, checklists: gateRec };
  });
  const counts = one(`SELECT COUNT(*) n, SUM(status='Completed') done, SUM(status='In progress') wip, SUM(status='Blocked') blocked, SUM(status!='Completed' AND due_date < ?) overdue FROM task_instances WHERE project_id=?`, now(), p.id);
  const kpis = all(`SELECT kpi_id, value, target, status, period FROM kpi_values WHERE project_id=? AND period=(SELECT MAX(period) FROM kpi_values WHERE project_id=?)`, p.id, p.id);
  const alerts = one(`SELECT COUNT(*) n FROM alerts WHERE project_id=?`, p.id).n;
  return { project: parseMl(p), phases, counts, kpis, alerts, complexity: all(`SELECT data FROM records WHERE entity='ComplexityScore' AND project_id=?`, p.id).map(x => J(x.data))[0] || null };
}));
r.get('/e2e-instances/:id', requirePerm('projects.view'), ah(req => {
  const e = one(`SELECT * FROM e2e_instances WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!e) throw new HttpError(404, 'err.notFound');
  const tasks = all(`SELECT t.*, o.name owner_name, v.name evaluator_name FROM task_instances t LEFT JOIN users o ON o.id=t.owner_id LEFT JOIN users v ON v.id=t.evaluator_id WHERE t.e2e_instance_id=? ORDER BY t.sort`, e.id).map(taskOut);
  return { instance: e, e2e: cat.get('e2e', e.e2e_id), project: parseMl(one(`SELECT id, name, focus, segment, mode, track FROM projects WHERE id=?`, e.project_id)), tasks };
}));
r.get('/tasks/mine', requirePerm('tasks.execute'), ah(req => all(`SELECT t.id, t.uft_id, t.e2e_id, t.status, t.due_date, t.project_id, t.e2e_instance_id, p.name project_name FROM task_instances t JOIN projects p ON p.id=t.project_id
  WHERE t.org_id=? AND (t.owner_id=? OR t.evaluator_id=?) AND t.status!='Completed' ORDER BY t.due_date LIMIT 300`, req.orgId, req.user.id, req.user.id).map(x => ({ ...x, project_name: J(x.project_name) }))));
r.get('/tasks/:id', requirePerm('projects.view'), ah(req => {
  const t = one(`SELECT t.*, o.name owner_name, v.name evaluator_name FROM task_instances t LEFT JOIN users o ON o.id=t.owner_id LEFT JOIN users v ON v.id=t.evaluator_id WHERE t.id=? AND t.org_id=?`, req.params.id, req.orgId);
  if (!t) throw new HttpError(404, 'err.notFound');
  const u = cat.get('uft', t.uft_id);
  const attachments = all(`SELECT a.id, a.filename, a.mime, a.size, a.created_at, coalesce(a.version,1) version, a.note, u.name author, (SELECT COUNT(*) FROM attachments b WHERE coalesce(b.chain_id,b.id)=coalesce(a.chain_id,a.id)) versions FROM attachments a LEFT JOIN users u ON u.id=a.author_id WHERE a.owner_type='task' AND a.owner_id=? AND a.org_id=? AND coalesce(a.is_latest,1)=1`, t.id, req.orgId);
  const history = all(`SELECT a.action, a.after_val, a.justification, a.created_at, u.name user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id WHERE a.entity='Task' AND a.entity_id=? ORDER BY a.created_at DESC LIMIT 30`, t.id).map(h => ({ ...h, after_val: J(h.after_val) }));
  const racsi = one(`SELECT id FROM racsi_activities WHERE org_id=? AND ref_type='uft' AND ref_id=? AND (project_id IS NULL OR project_id=?)`, req.orgId, t.uft_id, t.project_id);
  return { task: taskOut(t), uft: u, steps: u.steps.map(s => cat.get('step', s)), attachments, history,
    racsi: racsi ? all(`SELECT letter, assignee, user_id FROM racsi_assignments WHERE activity_id=?`, racsi.id) : Object.entries(u.racsi).map(([letter, assignee]) => ({ letter, assignee })) };
}));

/** Task execution: status, owner/evaluator, output, step ticks. Rules: BPMN sequence (VPR-05), gate progression (GTE-05), owner ≠ evaluator (RBAC-04). */
r.patch('/tasks/:id', requirePerm('tasks.execute'), ah(req => {
  const t = one(`SELECT * FROM task_instances WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!t) throw new HttpError(404, 'err.notFound');
  const b = req.body || {}; const lang = req.lang;
  const owner = b.owner_id === undefined ? t.owner_id : b.owner_id; const evaluator = b.evaluator_id === undefined ? t.evaluator_id : b.evaluator_id;
  if (owner && evaluator && owner === evaluator) throw new HttpError(422, 'err.ownerEvaluator');
  if ((b.owner_id || b.evaluator_id) && !has(req, 'projects.manage') && t.owner_id !== req.user.id) throw new HttpError(403, 'err.forbidden', { permission: 'projects.manage' });
  let status = b.status ?? t.status;
  if (t.status === 'Completed' && status !== 'Completed') {
    // Reopen (FR-DA-AUD-05): only with a justification, and only before the phase gate is decided.
    if (!String(b._justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
    const e = one(`SELECT phase FROM e2e_instances WHERE id=?`, t.e2e_instance_id);
    const decided = all(`SELECT data FROM records WHERE entity='PhaseChecklist' AND project_id=? AND json_extract(data,'$.phase')=?`, t.project_id, e.phase).some(x => ['Submitted', 'Signed off'].includes(J(x.data).state));
    if (decided) throw new HttpError(409, 'err.gateDecided');
  }
  if (status !== t.status && ['In progress', 'Completed'].includes(status)) {
    const prev = one(`SELECT status FROM task_instances WHERE e2e_instance_id=? AND sort=?`, t.e2e_instance_id, t.sort - 1);
    if (status === 'Completed' && prev && prev.status !== 'Completed') throw new HttpError(409, 'err.dependency');
    const e = one(`SELECT phase FROM e2e_instances WHERE id=?`, t.e2e_instance_id);
    if (e.phase > 1) blockedByGate(t.project_id, e.phase - 1);
  }
  let output = J(t.output) || {};
  if (b.output !== undefined) {
    // A person's own writing is shown as typed in every language (it is not machine-translated).
    output = typeof b.output === 'object' ? b.output : { en: String(b.output), fr: String(b.output), ar: String(b.output) };
  }
  if (status === 'Completed' && !pick(output, lang).trim()) throw new HttpError(422, 'err.outputRequired');
  let steps = J(t.steps, []);
  if (Array.isArray(b.steps)) steps = steps.map(s => ({ ...s, done: b.steps.includes(s.id), doneBy: b.steps.includes(s.id) ? (s.doneBy || req.user.id) : null }));
  if (status === 'Completed') steps = steps.map(s => ({ ...s, done: true }));
  const tm = now();
  run(`UPDATE task_instances SET status=?, owner_id=?, evaluator_id=?, due_date=?, output=?, steps=?, started_at=coalesce(started_at, CASE WHEN ?!='Not started' THEN ? END), completed_at=CASE WHEN ?='Completed' THEN ? ELSE NULL END, ai_used=max(ai_used,?), updated_at=? WHERE id=?`,
    status, owner, evaluator, b.due_date ?? t.due_date, S(output), S(steps), status, tm, status, tm, b.ai_used ? 1 : 0, tm, t.id);
  audit(req, 'Task', t.id, status !== t.status ? 'status' : 'update', { status: t.status }, { status, output: pick(output, lang) }, b._justification || (status === 'Completed' ? pick(output, lang).slice(0, 300) : null));
  const progress = refreshProgress(t.project_id); invalidateTenant(req.orgId);
  return { task: taskOut(one(`SELECT * FROM task_instances WHERE id=?`, t.id)), projectProgress: progress, rexPrompt: status === 'Completed' && t.status !== 'Completed' };
}));
function blockedByGate(projectId, phaseNo) {
  const ph = cat.list('phase').find(p => p.no === phaseNo); if (!ph?.gate) return;
  for (const x of all(`SELECT data FROM records WHERE entity='PhaseChecklist' AND project_id=? AND json_extract(data,'$.phase')=?`, projectId, phaseNo).map(y => J(y.data))) {
    if (!x.mandatory || !x.enforce) continue;
    const missing = (x.items || []).filter(i => i.mandatory && !i.done && !x.waiver);
    if (missing.length && x.decision !== 'Go') throw new HttpError(409, 'err.gateBlocked', { gate: pick(x.gate_name, 'en') || ph.gate, n: missing.length });
  }
}

// ------------------------------------------------------------------ Phase checklists & gate decisions (Sections 4.23, 4.35)
r.post('/projects/:id/phases/:no/attach', requirePerm('projects.manage'), ah(req => {
  const p = projectOf(req, req.params.id); const no = Number(req.params.no); const b = req.body || {};
  const started = one(`SELECT COUNT(*) n FROM e2e_instances WHERE project_id=? AND phase=? AND status!='Not started'`, p.id, no).n;
  let items = []; let gateName = null; let enforce = false; let mandatory = false;
  if (b.gate_id) {
    if (started) throw new HttpError(409, 'err.phaseStarted');
    const g = one(`SELECT * FROM records WHERE id=? AND entity='GateDefinition' AND (org_id IS NULL OR org_id=?)`, b.gate_id, req.orgId); if (!g) throw new HttpError(404, 'err.notFound');
    const gd = J(g.data); gateName = gd.name; enforce = !!gd.enforce; mandatory = true;
    for (const c of gd.checklists || []) {
      const cr = one(`SELECT data, version FROM records WHERE (id=? OR ref=?) AND entity='ChecklistTemplate' AND (org_id IS NULL OR org_id=?)`, c.id, c.id, req.orgId);
      if (cr) items.push(...(J(cr.data).items || []).map(i => ({ ...i, done: false, from: c.id })));
    }
  } else if (b.checklist_id) {
    const cr = one(`SELECT data FROM records WHERE (id=? OR ref=?) AND entity='ChecklistTemplate' AND (org_id IS NULL OR org_id=?)`, b.checklist_id, b.checklist_id, req.orgId); if (!cr) throw new HttpError(404, 'err.notFound');
    items = (J(cr.data).items || []).map(i => ({ ...i, done: false }));
  }
  const id = uuid();
  insertRecord(id, 'PhaseChecklist', req.orgId, p.id, null, { phase: no, gate_id: b.gate_id || null, gate_name: gateName, checklist_id: b.checklist_id || null, items, state: 'Open', mandatory, enforce }, req.user.id);
  audit(req, 'PhaseChecklist', id, 'attach', null, { phase: no, gate: b.gate_id, checklist: b.checklist_id }); return { id };
}));
r.patch('/phase-checklists/:id', requirePerm('tasks.execute'), ah(req => {
  const rec = one(`SELECT * FROM records WHERE id=? AND entity='PhaseChecklist' AND org_id=?`, req.params.id, req.orgId); if (!rec) throw new HttpError(404, 'err.notFound');
  const d = J(rec.data); const b = req.body || {};
  if (['Submitted', 'Signed off'].includes(d.state) && !b.decision) throw new HttpError(409, 'err.checklistFrozen'); // FR-DA-CHK-05
  if (b.items) {
    const add = b.items.filter(x => x.text && !d.items.some(i => pick(i.text, 'en') === pick(x.text, 'en'))); // never the same item twice (CHK-03)
    d.items = d.items.map(i => ({ ...i, done: b.done ? b.done.includes(pick(i.text, 'en')) : i.done })).concat(add.map(x => ({ text: x.text, mandatory: !!x.mandatory, evidence: !!x.evidence, done: false })));
  } else if (b.done) d.items = d.items.map(i => ({ ...i, done: b.done.includes(pick(i.text, 'en')) }));
  if (b.state === 'Submitted') d.state = 'Submitted';
  if (b.decision) {
    if (!['Go', 'No-Go', 'Hold', 'Recycle'].includes(b.decision)) throw new HttpError(422, 'err.invalidOption', { field: 'decision', value: b.decision });
    const cfg = orgConfig(req.orgId); if (cfg.justification_required && !String(b._justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
    const missing = d.items.filter(i => i.mandatory && !i.done);
    if (b.decision === 'Go' && missing.length && d.enforce && !b.waiver) throw new HttpError(409, 'err.gateBlocked', { gate: pick(d.gate_name, req.lang), n: missing.length });
    d.decision = b.decision; d.state = 'Signed off'; d.decision_comment = b._justification; d.waiver = b.waiver || null; d.decided_by = req.user.id; d.decided_at = now();
  }
  run(`UPDATE records SET data=?, version=version+1, updated_at=?, updated_by=? WHERE id=?`, S(d), now(), req.user.id, rec.id);
  audit(req, 'PhaseChecklist', rec.id, b.decision ? 'decision' : 'update', null, { state: d.state, decision: d.decision, waiver: d.waiver }, b._justification);
  return { id: rec.id, ...d };
}));
r.delete('/phase-checklists/:id', requirePerm('projects.manage'), ah(req => {
  const rec = one(`SELECT * FROM records WHERE id=? AND entity='PhaseChecklist' AND org_id=?`, req.params.id, req.orgId); if (!rec) throw new HttpError(404, 'err.notFound');
  const d = J(rec.data); const started = one(`SELECT COUNT(*) n FROM e2e_instances WHERE project_id=? AND phase=? AND status!='Not started'`, rec.project_id, d.phase).n;
  if (d.gate_id && started) throw new HttpError(409, 'err.phaseStarted');
  run(`DELETE FROM records WHERE id=?`, rec.id); audit(req, 'PhaseChecklist', rec.id, 'detach', d); return { ok: true };
}));

// ------------------------------------------------------------------ Portfolio overview (FR-DA-PFO-01..04)
r.get('/portfolio', requirePerm('portfolio.view'), ah(req => {
  const scope = req.query.scope || 'org';
  let orgIds = [req.orgId];
  if (scope === 'group') {
    const g = one(`SELECT group_id FROM organizations WHERE id=?`, req.user.org_id || req.orgId)?.group_id;
    if (g && (has(req, 'group.view') || req.user.is_platform)) orgIds = all(`SELECT id FROM organizations WHERE group_id=?`, g).map(x => x.id);
  }
  if (scope === 'all' && req.user.is_platform) orgIds = all(`SELECT id FROM organizations`).map(x => x.id);
  const ph = orgIds.map(() => '?').join(',');
  const projects = all(`SELECT p.id, p.org_id, p.name, p.focus, p.segment, p.mode, p.track, p.progress, o.name org_name, o.sector FROM projects p JOIN organizations o ON o.id=p.org_id WHERE p.org_id IN (${ph}) ORDER BY o.segment, o.sector, p.focus`, ...orgIds).map(parseMl);
  const cells = all(`SELECT project_id, e2e_id, status, progress FROM e2e_instances WHERE org_id IN (${ph})`, ...orgIds);
  const gates = all(`SELECT project_id, data FROM records WHERE entity='PhaseChecklist' AND org_id IN (${ph})`, ...orgIds).map(x => ({ project_id: x.project_id, ...J(x.data) }));
  const map = {}; for (const c of cells) map[c.project_id + '|' + c.e2e_id] = c;
  const columns = cat.list('e2e').map(e => ({ id: e.id, name: e.name, phase: cat.list('phase').find(p => p.e2e.includes(e.id))?.no ?? 0 }));
  const statusOf = (p, e) => {
    const c = map[p.id + '|' + e.id]; if (!c) return 'na';
    if (c.status === 'Completed') return 'completed';
    if (c.status === 'Not started') return 'notStarted';
    const gate = gates.find(g => g.project_id === p.id && g.phase === e.phase);
    if (gate?.decision === 'Hold') return 'onHold'; if (gate?.decision === 'No-Go') return 'stopped'; if (gate?.state === 'Submitted') return 'atGate';
    return 'inProgress';
  };
  const rows = projects.map(p => ({ ...p, readOnly: p.org_id !== req.user.org_id && !req.user.is_platform, cells: columns.map(e => statusOf(p, e)) }));
  const totals = columns.map((e, i) => { const t = {}; for (const r of rows) t[r.cells[i]] = (t[r.cells[i]] || 0) + 1; return t; });
  return { columns, rows, totals };
}));

// ------------------------------------------------------------------ WBS & Gantt (Section 4.15)
r.get('/projects/:id/gantt', requirePerm('projects.view'), ah(req => {
  const p = projectOf(req, req.params.id);
  const e2e = all(`SELECT * FROM e2e_instances WHERE project_id=? ORDER BY phase, sort`, p.id);
  const tasks = all(`SELECT id, e2e_instance_id, uft_id, status, started_at, due_date, completed_at, sort FROM task_instances WHERE project_id=? ORDER BY sort`, p.id);
  const items = [];
  for (const ph of cat.list('phase')) {
    const inst = e2e.filter(e => e.phase === ph.no); if (!inst.length) continue;
    const phaseItems = [];
    for (const e of inst) {
      const ts = tasks.filter(t => t.e2e_instance_id === e.id).map((t, k, arr) => ({ id: t.id, kind: 'task', name: t.uft_id, start: t.started_at || addDaysIso(t.due_date, -3), end: t.completed_at || t.due_date, status: statusGantt(t), deps: k ? [arr[k - 1].id] : [] }));
      const start = ts.reduce((m, x) => (x.start < m ? x.start : m), ts[0]?.start || now()); const end = ts.reduce((m, x) => (x.end > m ? x.end : m), ts[0]?.end || now());
      phaseItems.push({ id: e.id, kind: 'e2e', name: e.e2e_id, start, end, percent: e.progress, status: e.progress === 100 ? 'completed' : e.progress ? 'inProgress' : 'planned', children: ts });
    }
    const start = phaseItems.reduce((m, x) => (x.start < m ? x.start : m), phaseItems[0].start); const end = phaseItems.reduce((m, x) => (x.end > m ? x.end : m), phaseItems[0].end);
    // Summary bar recomputed from its children (FR-DA-WBS-04).
    items.push({ id: 'phase-' + ph.no, kind: 'phase', name: ph.name, start, end, percent: Math.round(phaseItems.reduce((s, x) => s + x.percent, 0) / phaseItems.length), children: phaseItems });
  }
  const custom = all(`SELECT id, data FROM records WHERE entity='WbsNode' AND project_id=?`, p.id).map(x => ({ id: x.id, ...J(x.data) }));
  return { project: parseMl(p), items, custom };
}));
const addDaysIso = (iso, d) => new Date(new Date(iso).getTime() + d * 86400000).toISOString();
function statusGantt(t) { if (t.status === 'Completed') return 'completed'; if (t.due_date < now()) return 'overdue'; if (t.status === 'In progress' || t.status === 'Blocked') return 'inProgress'; return 'planned'; }
export default r;
