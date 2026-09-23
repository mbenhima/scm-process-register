import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { q, json } from '../db.js';
import { config } from '../config.js';
import { requirePerm, has } from '../lib/security.js';
import { E2E, GATE, TRACK_MATRIX, MP } from '../lib/ref.js';
import * as L from '../lib/lifecycle.js';
import { audit, diff, justificationRequired } from '../lib/audit.js';
import { formFor } from '../lib/taskForms.js';
import { h, ctxOf, notFound, badRequest } from './util.js';
import { invalidate } from '../lib/rag.js';
import { computeKpis } from '../lib/kpis.js';

const r = Router();
fs.mkdirSync(config.uploadDir, { recursive: true });
const upload = multer({ dest: config.uploadDir, limits: { fileSize: 15 * 1024 * 1024 } });
const today = () => new Date().toISOString().slice(0, 10);

const projectRow = (p) => {
  const t = q.get("SELECT COUNT(*) n, SUM(status IN ('Done','Skipped')) d, SUM(status IN ('To do','In progress') AND due_date < ?) late FROM run_tasks WHERE project_id = ?", today(), p.id);
  const owner = q.get('SELECT name FROM users WHERE id = ?', p.owner_id)?.name;
  return { ...p, scores: json(p.scores, {}), owner_name: owner, progress: t.n ? Math.round((t.d / t.n) * 100) : 0, overdue: t.late || 0, e2e_name: E2E[p.current_e2e]?.name };
};

r.get('/projects', requirePerm('project.view'), h((req) => {
  const where = ['org_id = ?']; const args = [req.orgId];
  for (const k of ['status', 'track', 'current_e2e']) if (req.query[k]) { where.push(`${k} = ?`); args.push(req.query[k]); }
  if (req.query.q) { where.push('(name LIKE ? OR code LIKE ? OR description LIKE ?)'); args.push(...Array(3).fill(`%${req.query.q}%`)); }
  return q.all(`SELECT * FROM projects WHERE ${where.join(' AND ')} ORDER BY code`, ...args).map(projectRow);
}));

r.post('/projects', requirePerm('project.create'), h((req) => {
  let body = { ...req.body };
  if (body.template_id) {
    const t = q.get('SELECT payload FROM templates WHERE id = ? AND org_id = ?', body.template_id, req.orgId);
    if (!t) throw notFound('Template not found.');
    const tp = json(t.payload, {});
    body = { ...tp, ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== '' && v != null)), scores: { ...(tp.scores || {}), ...(body.scores || {}) }, optional_mps: body.optional_mps || tp.optional_mps || [] };
  }
  const p = L.createProject(ctxOf(req), body);
  invalidate(req.orgId);
  return projectRow(p);
}));

r.get('/projects/:id', requirePerm('project.view'), h((req) => {
  const p = L.projectForOrg(req.orgId, req.params.id);
  const runs = q.all('SELECT * FROM e2e_runs WHERE project_id = ? ORDER BY id', p.id).map((run) => {
    const tasks = q.all('SELECT t.*, u.name owner_name, e.name evaluator_name FROM run_tasks t LEFT JOIN users u ON u.id = t.owner_id LEFT JOIN users e ON e.id = t.evaluator_id WHERE t.run_id = ? ORDER BY t.seq', run.id)
      .map((t) => ({ ...t, data: json(t.data, {}), evaluation: json(t.evaluation, null) }));
    const gate = q.get('SELECT * FROM gate_reviews WHERE run_id = ?', run.id);
    return { ...run, name: E2E[run.e2e_id].name, tasks, gate: gate ? { ...gate, recycle_tasks: json(gate.recycle_tasks, []), votes: json(gate.votes, null) } : null };
  });
  const risks = q.all('SELECT * FROM risks WHERE project_id = ?', p.id);
  const rex = q.all('SELECT * FROM rex_entries WHERE project_id = ? ORDER BY id DESC', p.id);
  const sponsor = q.get('SELECT name FROM users WHERE id = ?', p.sponsor_id)?.name;
  const obs = q.get('SELECT name FROM obs_nodes WHERE id = ?', p.obs_node_id)?.name;
  return { ...projectRow(p), sponsor_name: sponsor, obs_name: obs, runs, risks, rex };
}));

r.put('/projects/:id', requirePerm('project.edit'), h((req) => {
  const p = L.projectForOrg(req.orgId, req.params.id);
  const fields = ['name', 'description', 'owner_id', 'sponsor_id', 'obs_node_id', 'planned_launch_date', 'region', 'offer_type', 'parent_product'];
  const data = Object.fromEntries(fields.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f] === '' ? null : req.body[f]]));
  const changes = diff(p, data);
  if (Object.keys(changes).length && justificationRequired(req.orgId) && !String(req.body.justification || '').trim()) throw badRequest('A justification note is required before saving this change.');
  q.update('projects', p.id, data);
  audit(ctxOf(req), 'project', p.id, 'update', changes, req.body.justification || null);
  invalidate(req.orgId);
  return projectRow(L.getProject(p.id));
}));

r.delete('/projects/:id', requirePerm('project.delete'), h((req) => {
  const p = L.projectForOrg(req.orgId, req.params.id);
  q.run('DELETE FROM projects WHERE id = ?', p.id);
  audit(ctxOf(req), 'project', p.id, 'delete', { name: [p.name, null] }, req.body?.justification || null);
  invalidate(req.orgId);
  return { ok: true };
}));

r.post('/projects/:id/resume', requirePerm('project.edit'), h((req) => { L.projectForOrg(req.orgId, req.params.id); L.resumeProject(ctxOf(req), Number(req.params.id)); return { ok: true }; }));
r.post('/projects/:id/campaign', requirePerm('project.edit'), h((req) => { L.projectForOrg(req.orgId, req.params.id); return { runId: L.startParallelCampaign(ctxOf(req), Number(req.params.id)) }; }));

// Tailoring (MP-124)
r.get('/projects/:id/mps', requirePerm('project.view'), h((req) => {
  const p = L.projectForOrg(req.orgId, req.params.id);
  return q.all('SELECT m.*, u.name approver FROM project_mps m LEFT JOIN users u ON u.id = m.approved_by WHERE m.project_id = ?', p.id)
    .map((m) => ({ ...m, name: MP[m.mp_id]?.name, category: MP[m.mp_id]?.category, trackDefault: TRACK_MATRIX[m.mp_id][p.track] }))
    .sort((a, b) => Number(a.mp_id.slice(3)) - Number(b.mp_id.slice(3)));
}));
r.put('/projects/:id/mps/:mp', requirePerm('project.edit'), h((req) => {
  const p = L.projectForOrg(req.orgId, req.params.id);
  L.setProjectMp(ctxOf(req), p.id, req.params.mp, req.body.state, req.body.justification, has(req, 'tailoring.approve'));
  return { ok: true };
}));

// Tasks
const taskDetail = (orgId, id) => {
  const t = L.taskForOrg(orgId, id);
  const p = L.getProject(t.project_id);
  const run = q.get('SELECT * FROM e2e_runs WHERE id = ?', t.run_id);
  const uft = E2E[run.e2e_id].tasks.find((x) => x.id === t.uft_id) || Object.values(E2E).flatMap((e) => e.tasks).find((x) => x.id === t.uft_id);
  const gate = q.get('SELECT * FROM gate_reviews WHERE run_id = ?', t.run_id);
  const checklist = gate && t.kind !== 'work' ? q.all('SELECT c.*, u.name completed_by_name FROM checklist_items c LEFT JOIN users u ON u.id = c.completed_by WHERE gate_review_id = ? ORDER BY seq', gate.id)
    .map((c) => ({ ...c, files: q.all("SELECT id, filename FROM evidence_files WHERE entity_type = 'checklist_item' AND entity_id = ?", c.id) })) : null;
  const files = q.all("SELECT id, filename, uploaded_at FROM evidence_files WHERE entity_type = 'task' AND entity_id = ?", t.id);
  const people = q.all('SELECT id, name FROM users WHERE id IN (?, ?)', t.owner_id || 0, t.evaluator_id || 0);
  return {
    ...t, data: json(t.data, {}), evaluation: json(t.evaluation, null), project: { id: p.id, code: p.code, name: p.name, track: p.track, status: p.status, owner_id: p.owner_id },
    run: { id: run.id, e2e_id: run.e2e_id, e2e_name: E2E[run.e2e_id].name, run_no: run.run_no, status: run.status, branch: run.branch }, uft, form: formFor(t.uft_id),
    gate: gate ? { ...gate, question: GATE[gate.gate]?.question, evidence: GATE[gate.gate]?.evidence } : null, checklist, files,
    owner_name: people.find((x) => x.id === t.owner_id)?.name, evaluator_name: people.find((x) => x.id === t.evaluator_id)?.name,
  };
};

r.get('/tasks/mine', requirePerm('task.view'), h((req) => q.all(`SELECT t.id, t.name, t.uft_id, t.kind, t.status, t.due_date, t.project_id, p.code, p.name project_name, r.e2e_id,
  CASE WHEN t.owner_id = ? THEN 'Owner' ELSE 'Evaluator' END as my_role
  FROM run_tasks t JOIN projects p ON p.id = t.project_id JOIN e2e_runs r ON r.id = t.run_id
  WHERE t.org_id = ? AND p.status = 'Active' AND r.status = 'In progress' AND ((t.owner_id = ? AND t.status IN ('To do','In progress')) OR (t.evaluator_id = ? AND t.status = 'Done' AND t.evaluation IS NULL))
  ORDER BY t.due_date LIMIT 200`, req.user.id, req.orgId, req.user.id, req.user.id)));

r.get('/tasks/:id', requirePerm('task.view'), h((req) => taskDetail(req.orgId, req.params.id)));
r.post('/tasks/:id/start', requirePerm('task.edit'), h((req) => { L.startTask(ctxOf(req), req.params.id, has(req, 'project.edit')); return taskDetail(req.orgId, req.params.id); }));
r.post('/tasks/:id/complete', requirePerm('task.edit'), h((req) => {
  const res = L.completeTask(ctxOf(req), req.params.id, { data: req.body.data || {}, output: req.body.output || '' }, has(req, 'project.edit'));
  invalidate(req.orgId);
  return { ...taskDetail(req.orgId, req.params.id), effects: res.effects, rexPrompt: res.rexPrompt };
}));
r.post('/tasks/:id/skip', requirePerm('task.edit'), h((req) => { L.skipTask(ctxOf(req), req.params.id, req.body.reason, has(req, 'project.edit')); return taskDetail(req.orgId, req.params.id); }));
r.post('/tasks/:id/reopen', requirePerm('project.edit'), h((req) => { L.reopenTask(ctxOf(req), req.params.id, req.body.reason); return taskDetail(req.orgId, req.params.id); }));
r.post('/tasks/:id/evaluate', requirePerm('task.evaluate'), h((req) => { L.evaluateTask(ctxOf(req), req.params.id, req.body.verdict, req.body.notes); return taskDetail(req.orgId, req.params.id); }));
r.put('/tasks/:id/assign', requirePerm('task.assign'), h((req) => { L.assignTask(ctxOf(req), req.params.id, req.body); return taskDetail(req.orgId, req.params.id); }));
r.put('/tasks/:id/schedule', requirePerm('wbs.manage'), h((req) => {
  const t = L.taskForOrg(req.orgId, req.params.id);
  const data = { planned_start: req.body.planned_start ?? t.planned_start, due_date: req.body.due_date ?? t.due_date, pct: req.body.pct ?? t.pct };
  q.update('run_tasks', t.id, data); audit(ctxOf(req), 'task', t.id, 'schedule', diff(t, data));
  return { ok: true };
}));

// Checklist items
r.put('/checklist/:id', requirePerm('checklist.edit'), h((req) => L.updateChecklistItem(ctxOf(req), req.params.id, req.body, req.perms)));

// Evidence files
r.post('/evidence', requirePerm('task.edit', 'checklist.edit'), upload.single('file'), h((req) => {
  const { entity_type, entity_id } = req.body;
  if (!req.file) throw badRequest('Choose a file to upload.');
  const ok = entity_type === 'task' ? q.get('SELECT id FROM run_tasks WHERE id = ? AND org_id = ?', entity_id, req.orgId)
    : entity_type === 'checklist_item' ? q.get('SELECT id FROM checklist_items WHERE id = ? AND org_id = ?', entity_id, req.orgId) : null;
  if (!ok) { fs.unlinkSync(req.file.path); throw notFound('Record not found.'); }
  const stored = crypto.randomUUID();
  fs.renameSync(req.file.path, path.join(config.uploadDir, stored));
  const id = q.insert('evidence_files', { org_id: req.orgId, entity_type, entity_id, filename: req.file.originalname, stored_name: stored, mime: req.file.mimetype, size: req.file.size, uploaded_by: req.user.id });
  audit(ctxOf(req), entity_type, entity_id, 'evidence', { file: [null, req.file.originalname] });
  return { id, filename: req.file.originalname };
}));
r.get('/evidence/:id', requirePerm('task.view'), (req, res) => {
  const f = q.get('SELECT * FROM evidence_files WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!f) return res.status(404).json({ error: 'File not found.' });
  res.download(path.join(config.uploadDir, f.stored_name), f.filename);
});

// Gates
r.get('/gates', requirePerm('gate.view'), h((req) => {
  const where = ['g.org_id = ?']; const args = [req.orgId];
  if (req.query.status) { where.push('g.status = ?'); args.push(req.query.status); }
  return q.all(`SELECT g.*, p.code, p.name project_name, p.track, p.owner_id, u.name decided_by_name, s.name submitted_by_name FROM gate_reviews g JOIN projects p ON p.id = g.project_id
    LEFT JOIN users u ON u.id = g.decided_by LEFT JOIN users s ON s.id = g.submitted_by WHERE ${where.join(' AND ')} ORDER BY COALESCE(g.submitted_at, g.id) DESC LIMIT 300`, ...args)
    .map((g) => {
      const c = q.get("SELECT COUNT(*) n, SUM(status IN ('Complete','Waived')) d, SUM(mandatory) m FROM checklist_items WHERE gate_review_id = ?", g.id);
      return { ...g, question: GATE[g.gate]?.question, checklist_total: c.n, checklist_done: c.d || 0, mandatory: c.m || 0 };
    });
}));
r.get('/gates/:id', requirePerm('gate.view'), h((req) => {
  const g = L.gateForOrg(req.orgId, req.params.id);
  const p = L.getProject(g.project_id);
  const items = q.all('SELECT c.*, u.name completed_by_name FROM checklist_items c LEFT JOIN users u ON u.id = c.completed_by WHERE gate_review_id = ? ORDER BY seq', g.id)
    .map((c) => ({ ...c, files: q.all("SELECT id, filename FROM evidence_files WHERE entity_type = 'checklist_item' AND entity_id = ?", c.id) }));
  const tasks = q.all('SELECT t.id, t.uft_id, t.name, t.kind, t.status, t.output, u.name owner_name FROM run_tasks t LEFT JOIN users u ON u.id = t.owner_id WHERE run_id = ? ORDER BY seq', g.run_id);
  const run = q.get('SELECT e2e_id, run_no, branch FROM e2e_runs WHERE id = ?', g.run_id);
  return { ...g, recycle_tasks: json(g.recycle_tasks, []), votes: json(g.votes, null), reference: GATE[g.gate], project: projectRow(p), run: { ...run, name: E2E[run.e2e_id].name }, items, tasks, kpis: { npv: p.npv, roi: p.roi, payback: p.payback_years } };
}));
r.post('/gates/:id/submit', requirePerm('gate.submit'), h((req) => { L.submitGate(ctxOf(req), req.params.id); return { ok: true }; }));
r.post('/gates/:id/decide', requirePerm('gate.decide'), h((req) => { const out = L.decideGate(ctxOf(req), req.params.id, req.body); invalidate(req.orgId); return out; }));

// Dashboard aggregates (FR-DA-REP-01: computed in real time, tenant-scoped).
r.get('/dashboard', requirePerm('dashboard.view'), h((req) => {
  const o = req.orgId;
  const n = (sql, ...a) => q.get(sql, o, ...a).n;
  const kpis = computeKpis(o);
  const pick = (id) => kpis.find((k) => k.id === id);
  return {
    counts: {
      active: n("SELECT COUNT(*) n FROM projects WHERE org_id = ? AND status = 'Active'"),
      onHold: n("SELECT COUNT(*) n FROM projects WHERE org_id = ? AND status = 'On Hold'"),
      launched: n("SELECT COUNT(*) n FROM projects WHERE org_id = ? AND actual_launch_date IS NOT NULL"),
      retired: n("SELECT COUNT(*) n FROM projects WHERE org_id = ? AND status = 'Retired'"),
      killed: n("SELECT COUNT(*) n FROM projects WHERE org_id = ? AND status = 'Killed'"),
      pendingGates: n("SELECT COUNT(*) n FROM gate_reviews WHERE org_id = ? AND status = 'Submitted'"),
      overdue: n("SELECT COUNT(*) n FROM run_tasks t JOIN projects p ON p.id = t.project_id WHERE t.org_id = ? AND t.status IN ('To do','In progress') AND t.due_date < ? AND p.status = 'Active'", today()),
      myTasks: q.get("SELECT COUNT(*) n FROM run_tasks t JOIN projects p ON p.id = t.project_id WHERE t.org_id = ? AND t.owner_id = ? AND t.status IN ('To do','In progress') AND p.status = 'Active'", o, req.user.id).n,
      runs: n('SELECT COUNT(*) n FROM e2e_runs WHERE org_id = ?'),
    },
    byE2E: q.all("SELECT e2e_id, COUNT(*) total, SUM(status = 'Completed') completed, SUM(status = 'In progress') active FROM e2e_runs WHERE org_id = ? GROUP BY e2e_id ORDER BY e2e_id", o),
    byTrack: q.all("SELECT track, COUNT(*) n FROM projects WHERE org_id = ? GROUP BY track", o),
    byStatus: q.all('SELECT status, COUNT(*) n FROM projects WHERE org_id = ? GROUP BY status', o),
    decisions: q.all("SELECT decision, COUNT(*) n FROM gate_reviews WHERE org_id = ? AND decision IS NOT NULL GROUP BY decision", o),
    gateCycle: q.all("SELECT gate, ROUND(AVG(julianday(decided_at) - julianday(submitted_at)),1) days FROM gate_reviews WHERE org_id = ? AND decided_at IS NOT NULL GROUP BY gate ORDER BY gate", o),
    kpis: ['KPI-01', 'KPI-02', 'KPI-03', 'KPI-04', 'KPI-05', 'KPI-38'].map(pick),
    trend: q.all("SELECT substr(decided_at,1,7) month, COUNT(*) decided, SUM(decision='Go') go FROM gate_reviews WHERE org_id = ? AND decided_at >= date('now','-12 month') GROUP BY month ORDER BY month", o),
    submitted: q.all("SELECT g.id, g.gate, g.submitted_at, p.code, p.name FROM gate_reviews g JOIN projects p ON p.id = g.project_id WHERE g.org_id = ? AND g.status = 'Submitted' ORDER BY g.submitted_at LIMIT 6", o),
  };
}));

export default r;
