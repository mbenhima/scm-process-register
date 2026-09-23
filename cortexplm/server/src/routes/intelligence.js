import { Router } from 'express';
import { q, json } from '../db.js';
import { requirePerm } from '../lib/security.js';
import { requireFeatureFor, checkQuota } from '../lib/entitlements.js';
import { generate, recordOutcome, assistantAnswer, effectiveState } from '../lib/ai.js';
import { search, searchHelp, invalidate } from '../lib/rag.js';
import { HELP } from '../lib/help.js';
import { audit, snapshot, versionsOf } from '../lib/audit.js';
import { resolveLanguage } from '../lib/i18n.js';
import { h, crud, ctxOf, badRequest, notFound } from './util.js';

const r = Router();

// ------------------------------------------------------------------ AI Use Case Library
const UC_FIELDS = ['name', 'linked_step', 'model_task_type', 'tier', 'risk_level', 'human_checkpoint', 'activation_scope', 'module', 'trigger_text', 'expected_output', 'prompt_template', 'approval_status', 'based_on'];
const ucRow = (u, projectId) => ({ ...u, effective: effectiveState(u, projectId), usage: q.get("SELECT COUNT(*) n, SUM(outcome='Accepted') a FROM ai_usage_log WHERE use_case_code = ? AND org_id = ?", u.code, u.org_id) });

r.get('/ai/use-cases', requirePerm('ai.view'), h((req) => {
  const pid = req.query.project ? Number(req.query.project) : null;
  return q.all("SELECT * FROM ai_use_cases WHERE org_id = ? ORDER BY is_custom, CAST(substr(code, 6) AS INTEGER)", req.orgId).map((u) => ({
    ...ucRow(u, pid), override: pid ? q.get('SELECT state FROM ai_project_overrides WHERE project_id = ? AND use_case_id = ?', pid, u.id)?.state || 'Inherit' : undefined,
  }));
}));
r.get('/ai/use-cases/:id', requirePerm('ai.view'), h((req) => {
  const u = q.get('SELECT * FROM ai_use_cases WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!u) throw notFound();
  return { ...ucRow(u), versions: versionsOf('ai_use_case', u.id) };
}));
r.post('/ai/use-cases', requirePerm('ai.manage'), h((req) => {
  requireFeatureFor(req.orgId, 'ai');
  checkQuota(req.orgId, 'customAiUseCases');
  const d = Object.fromEntries(UC_FIELDS.map((f) => [f, req.body[f] ?? null]));
  if (!d.name || !d.human_checkpoint) throw badRequest('Name and human checkpoint are required.');
  if (!['Assistive', 'Augmented'].includes(d.tier)) throw badRequest('Tier must be Assistive or Augmented (never autonomous).');
  const n = q.get("SELECT COUNT(*) n FROM ai_use_cases WHERE org_id = ?", req.orgId).n + 1;
  const id = q.insert('ai_use_cases', { ...d, org_id: req.orgId, code: `AIUC-${String(n).padStart(2, '0')}`, is_custom: 1, approval_status: 'Pending Approval', active: 0 });
  const row = q.get('SELECT * FROM ai_use_cases WHERE id = ?', id);
  snapshot(ctxOf(req), 'ai_use_case', id, row, 'Version 1 created.');
  audit(ctxOf(req), 'ai_use_case', id, 'create', { name: [null, d.name] });
  return row;
}));
r.put('/ai/use-cases/:id', requirePerm('ai.manage'), h((req) => {
  const u = q.get('SELECT * FROM ai_use_cases WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!u) throw notFound();
  const d = Object.fromEntries(UC_FIELDS.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f]]));
  if (d.tier && !['Assistive', 'Augmented'].includes(d.tier)) throw badRequest('Tier must be Assistive or Augmented.');
  if (!String(req.body.justification || '').trim()) throw badRequest('Describe the change: each save creates a new version.');
  q.update('ai_use_cases', u.id, d);
  const row = q.get('SELECT * FROM ai_use_cases WHERE id = ?', u.id);
  const v = snapshot(ctxOf(req), 'ai_use_case', u.id, row, req.body.justification);
  audit(ctxOf(req), 'ai_use_case', u.id, 'update', Object.fromEntries(Object.keys(d).map((k) => [k, [u[k], d[k]]])), req.body.justification);
  return { ...row, version: v };
}));
r.post('/ai/use-cases/:id/revert/:version', requirePerm('ai.manage'), h((req) => {
  const u = q.get('SELECT * FROM ai_use_cases WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  const v = u && q.get("SELECT data FROM entity_versions WHERE entity_type = 'ai_use_case' AND entity_id = ? AND version = ?", u.id, req.params.version);
  if (!v) throw notFound();
  const data = Object.fromEntries(UC_FIELDS.map((f) => [f, JSON.parse(v.data)[f]]));
  q.update('ai_use_cases', u.id, data);
  const nv = snapshot(ctxOf(req), 'ai_use_case', u.id, q.get('SELECT * FROM ai_use_cases WHERE id = ?', u.id), `Reverted to version ${req.params.version}.`);
  audit(ctxOf(req), 'ai_use_case', u.id, 'revert', {}, `Reverted to version ${req.params.version} (new version ${nv}).`);
  return { ok: true, version: nv };
}));
r.put('/ai/use-cases/:id/activation', requirePerm('ai.manage'), h((req) => {
  const u = q.get('SELECT * FROM ai_use_cases WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!u) throw notFound();
  if (req.body.active && u.is_custom && u.approval_status !== 'Approved') throw badRequest('Approve the custom use case before activating it.');
  q.run('UPDATE ai_use_cases SET active = ? WHERE id = ?', req.body.active ? 1 : 0, u.id);
  audit(ctxOf(req), 'ai_use_case', u.id, 'activation', { active: [!!u.active, !!req.body.active] });
  return { ok: true };
}));
r.put('/ai/use-cases/:id/approval', requirePerm('ai.manage'), h((req) => {
  const u = q.get('SELECT * FROM ai_use_cases WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!u) throw notFound();
  if (!['Approved', 'Rejected', 'Pending Approval'].includes(req.body.status)) throw badRequest('Unknown approval status.');
  q.run('UPDATE ai_use_cases SET approval_status = ? WHERE id = ?', req.body.status, u.id);
  audit(ctxOf(req), 'ai_use_case', u.id, 'approval', { approval_status: [u.approval_status, req.body.status] });
  return { ok: true };
}));
r.put('/ai/use-cases/:id/override/:projectId', requirePerm('project.edit'), h((req) => {
  const u = q.get('SELECT id FROM ai_use_cases WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  const p = q.get('SELECT id FROM projects WHERE id = ? AND org_id = ?', req.params.projectId, req.orgId);
  if (!u || !p) throw notFound();
  if (!['Inherit', 'On', 'Off'].includes(req.body.state)) throw badRequest('State must be Inherit, On or Off.');
  q.run('INSERT INTO ai_project_overrides (project_id, use_case_id, state) VALUES (?, ?, ?) ON CONFLICT(project_id, use_case_id) DO UPDATE SET state = excluded.state', p.id, u.id, req.body.state);
  audit(ctxOf(req), 'project', p.id, 'ai_override', { [`use case ${u.id}`]: [null, req.body.state] });
  return { ok: true };
}));
r.post('/ai/generate', requirePerm('ai.use'), h(async (req) => {
  requireFeatureFor(req.orgId, 'ai');
  const { useCaseId, projectId, recordType, recordId, text, llm } = req.body || {};
  return generate(ctxOf(req), useCaseId, { projectId, recordType, recordId, text, llm });
}));
r.post('/ai/suggestions/:id/outcome', requirePerm('ai.use'), h((req) => { recordOutcome(ctxOf(req), req.params.id, req.body.outcome); return { ok: true }; }));
r.get('/ai/suggestions', requirePerm('ai.view'), h((req) => q.all(`SELECT s.id, s.output, s.source, s.confidence, s.created_at, s.approved, u.code, u.name, s.project_id FROM ai_suggestions s JOIN ai_use_cases u ON u.id = s.use_case_id
  WHERE s.org_id = ? ${req.query.project ? 'AND s.project_id = ?' : ''} ORDER BY s.id DESC LIMIT 100`, req.orgId, ...(req.query.project ? [req.query.project] : []))));
r.get('/ai/usage-log', requirePerm('ai.view'), h((req) => q.all(`SELECT l.*, u.name user_name, p.code project_code FROM ai_usage_log l LEFT JOIN users u ON u.id = l.user_id LEFT JOIN projects p ON p.id = l.project_id
  WHERE l.org_id = ? ORDER BY l.id DESC LIMIT 500`, req.orgId)));

// ------------------------------------------------------------------ AI Assistant
r.post('/assistant', requirePerm('assistant.use'), h((req) => {
  requireFeatureFor(req.orgId, 'assistant');
  const lang = resolveLanguage(req.user.language, req.orgId);
  const out = assistantAnswer(ctxOf(req), req.body.question, req.body.lang || lang);
  q.insert('ai_usage_log', { org_id: req.orgId, use_case_code: `ASSISTANT:${out.intent || out.mode}`, user_id: req.user.id, outcome: out.refused ? 'Rejected' : 'Accepted', source: 'AI Assistant', confidence: out.mode === 'data' ? 1 : (out.refs?.[0]?.score ?? 0), record_type: 'question', created_at: new Date().toISOString() });
  return out;
}));

// ------------------------------------------------------------------ Knowledge base & search
r.get('/search', requirePerm('kb.view'), h((req) => search(req.orgId, String(req.query.q || ''), { k: 12 })));
r.get('/knowledge/:id', requirePerm('kb.view'), h((req) => {
  const d = q.get('SELECT * FROM knowledge_docs WHERE id = ? AND (org_id = ? OR org_id IS NULL)', req.params.id, req.orgId);
  if (!d) throw notFound();
  return { ...d, readOnly: d.org_id == null };
}));
crud(r, '/knowledge', { table: 'knowledge_docs', entity: 'knowledge', view: 'kb.view', manage: 'kb.manage', fields: ['kind', 'ref', 'title', 'body', 'lang', 'tags'], required: ['title', 'body', 'kind'], ragOrg: true,
  filter: (req, w) => { w[0] = '(org_id = ? OR org_id IS NULL)'; }, order: 'org_id IS NULL, kind, title' });

r.get('/help', (req, res) => {
  const lang = req.query.lang || resolveLanguage(req.user.language, req.orgId);
  const qText = String(req.query.q || '').toLowerCase();
  const list = HELP.map((a) => ({ id: a.id, module: a.module, title: a.title[lang] || a.title.en, body: a.body[lang] || a.body.en }))
    .filter((a) => !qText || a.title.toLowerCase().includes(qText) || a.body.toLowerCase().includes(qText));
  res.json(list);
});
r.get('/help/search', (req, res) => res.json(searchHelp(String(req.query.q || ''), req.query.lang || 'en')));

// ------------------------------------------------------------------ REX (FR-DA-REX-01..07)
crud(r, '/rex', { table: 'rex_entries', entity: 'rex_entry', view: 'rex.view', manage: 'rex.manage', versioned: true, ragOrg: true, order: 'id DESC',
  fields: ['project_id', 'task_id', 'title', 'went_well', 'went_wrong', 'root_cause', 'recommendation', 'category', 'rating', 'obs_node_id', 'process_tag', 'created_by'],
  required: ['title', 'went_well', 'went_wrong', 'root_cause', 'recommendation', 'category', 'rating'],
  validate: (d, req) => {
    if (!(Number(d.rating) >= 1 && Number(d.rating) <= 5)) throw badRequest('Rating must be from 1 to 5.');
    if (d.project_id && !q.get('SELECT id FROM projects WHERE id = ? AND org_id = ?', d.project_id, req.orgId)) throw badRequest('Unknown project.');
    d.created_by ||= req.user.id;
  },
  map: (x) => ({ ...x, project_code: x.project_id ? q.get('SELECT code FROM projects WHERE id = ?', x.project_id)?.code : null }) });
r.get('/rex-register', requirePerm('rex.view'), h((req) => ({
  byCategory: q.all('SELECT category, COUNT(*) n, ROUND(AVG(rating),2) avg FROM rex_entries WHERE org_id = ? GROUP BY category ORDER BY n DESC', req.orgId),
  byRating: q.all('SELECT rating, COUNT(*) n FROM rex_entries WHERE org_id = ? GROUP BY rating ORDER BY rating', req.orgId),
  trend: q.all("SELECT substr(created_at,1,7) month, ROUND(AVG(rating),2) avg, COUNT(*) n FROM rex_entries WHERE org_id = ? GROUP BY month ORDER BY month", req.orgId),
  rootCauses: q.all('SELECT root_cause, COUNT(*) n FROM rex_entries WHERE org_id = ? GROUP BY root_cause HAVING n > 1 ORDER BY n DESC LIMIT 8', req.orgId),
})));

// ------------------------------------------------------------------ Templates (FR-DA-TPL-01..04)
crud(r, '/templates', { table: 'templates', entity: 'template', view: 'template.view', manage: 'template.manage', versioned: true, fields: ['kind', 'name', 'description', 'payload'], required: ['name', 'payload'],
  validate: (d) => { if (typeof d.payload === 'string') { try { JSON.parse(d.payload); } catch { throw badRequest('Template content must be valid JSON.'); } } },
  map: (t) => ({ ...t, payload: json(t.payload, {}) }) });

// ------------------------------------------------------------------ WBS & Gantt (FR-DA-WBS-01..06)
export function wbsTree(wbsId) {
  const today = new Date().toISOString().slice(0, 10);
  const raw = q.all(`SELECT n.*, t.name task_name, t.status task_status, t.planned_start t_start, t.due_date t_end, t.pct t_pct, t.completed_at, p.code project_code
    FROM wbs_nodes n LEFT JOIN run_tasks t ON t.id = n.task_id LEFT JOIN projects p ON p.id = t.project_id WHERE n.wbs_id = ? ORDER BY n.seq, n.id`, wbsId);
  const byParent = new Map();
  for (const n of raw) { const k = n.parent_id || 0; if (!byParent.has(k)) byParent.set(k, []); byParent.get(k).push(n); }
  const out = [];
  const walk = (parent, depth) => {
    for (const n of byParent.get(parent) || []) {
      const kids = byParent.get(n.id) || [];
      const node = { id: n.id, parent_id: n.parent_id, name: n.task_id ? `${n.project_code} · ${n.task_name}` : n.name, task_id: n.task_id, depth, summary: kids.length > 0, predecessors: json(n.predecessors, []),
        start: n.planned_start || n.t_start, end: n.planned_end || n.t_end, pct: n.pct ?? (n.task_status === 'Done' ? 100 : n.t_pct ?? 0), status: n.task_status };
      out.push(node);
      const idx = out.length - 1;
      walk(n.id, depth + 1);
      if (kids.length && !n.planned_start) { // FR-DA-WBS-04: summary rolls up from children
        const ch = out.slice(idx + 1).filter((c) => c.depth === depth + 1);
        const s = ch.map((c) => c.start).filter(Boolean).sort(); const e = ch.map((c) => c.end).filter(Boolean).sort();
        out[idx].start = s[0] || null; out[idx].end = e[e.length - 1] || null;
        out[idx].pct = Math.round(ch.reduce((a, c) => a + (c.pct || 0), 0) / (ch.length || 1));
      }
    }
  };
  walk(0, 0);
  for (const n of out) n.state = n.pct >= 100 ? 'Completed' : n.end && n.end < today ? 'Overdue' : n.pct > 0 ? 'In progress' : 'Planned';
  return out;
}
const wbsForOrg = (req) => { const w = q.get('SELECT * FROM wbs WHERE id = ? AND org_id = ?', req.params.id, req.orgId); if (!w) throw notFound(); return w; };
r.get('/wbs', requirePerm('wbs.view'), h((req) => q.all('SELECT w.*, p.code project_code, (SELECT COUNT(*) FROM wbs_nodes WHERE wbs_id = w.id) nodes FROM wbs w LEFT JOIN projects p ON p.id = w.project_id WHERE w.org_id = ? ORDER BY w.id DESC', req.orgId)));
r.post('/wbs', requirePerm('wbs.manage'), h((req) => {
  if (!req.body.name) throw badRequest('Name is required.');
  const id = q.insert('wbs', { org_id: req.orgId, name: req.body.name, description: req.body.description, project_id: req.body.project_id || null, created_by: req.user.id });
  if (req.body.project_id && req.body.fromProject) { // quick start: one summary node per E2E run with its tasks
    const runs = q.all('SELECT id, e2e_id, run_no FROM e2e_runs WHERE project_id = ? AND org_id = ? ORDER BY id', req.body.project_id, req.orgId);
    let prev = null;
    runs.forEach((run, i) => {
      const nid = q.insert('wbs_nodes', { wbs_id: id, seq: i, name: `${run.e2e_id} (run ${run.run_no})` });
      for (const t of q.all('SELECT id, seq FROM run_tasks WHERE run_id = ? ORDER BY seq', run.id)) {
        const tn = q.insert('wbs_nodes', { wbs_id: id, parent_id: nid, seq: t.seq, name: 'task', task_id: t.id, predecessors: prev ? [prev] : [] });
        prev = tn;
      }
    });
  }
  audit(ctxOf(req), 'wbs', id, 'create', { name: [null, req.body.name] });
  return { id };
}));
r.get('/wbs/:id', requirePerm('wbs.view'), h((req) => ({ ...wbsForOrg(req), nodes: wbsTree(req.params.id) })));
r.delete('/wbs/:id', requirePerm('wbs.manage'), h((req) => { const w = wbsForOrg(req); q.run('DELETE FROM wbs WHERE id = ?', w.id); audit(ctxOf(req), 'wbs', w.id, 'delete'); return { ok: true }; }));
r.post('/wbs/:id/nodes', requirePerm('wbs.manage'), h((req) => {
  const w = wbsForOrg(req);
  const { name, parent_id, task_id, planned_start, planned_end, pct, predecessors = [] } = req.body;
  if (!name && !task_id) throw badRequest('Give a node name or choose a task.');
  if (task_id && !q.get('SELECT id FROM run_tasks WHERE id = ? AND org_id = ?', task_id, req.orgId)) throw badRequest('Unknown task.');
  if (parent_id && !q.get('SELECT id FROM wbs_nodes WHERE id = ? AND wbs_id = ?', parent_id, w.id)) throw badRequest('Unknown parent node.');
  const ids = new Set(q.all('SELECT id FROM wbs_nodes WHERE wbs_id = ?', w.id).map((x) => x.id));
  if (predecessors.some((p) => !ids.has(Number(p)))) throw badRequest('Predecessors must belong to the same WBS.');
  const seq = (q.get('SELECT MAX(seq) m FROM wbs_nodes WHERE wbs_id = ?', w.id).m || 0) + 1;
  const id = q.insert('wbs_nodes', { wbs_id: w.id, parent_id: parent_id || null, seq, name: name || 'task', task_id: task_id || null, planned_start: planned_start || null, planned_end: planned_end || null, pct: pct === '' || pct == null ? null : Number(pct), predecessors: predecessors.map(Number) });
  return { id };
}));
r.put('/wbs/:id/nodes/:nid', requirePerm('wbs.manage'), h((req) => {
  const w = wbsForOrg(req);
  const n = q.get('SELECT * FROM wbs_nodes WHERE id = ? AND wbs_id = ?', req.params.nid, w.id);
  if (!n) throw notFound();
  const d = {};
  for (const k of ['name', 'planned_start', 'planned_end', 'pct', 'parent_id']) if (req.body[k] !== undefined) d[k] = req.body[k] === '' ? null : req.body[k];
  if (req.body.predecessors) d.predecessors = req.body.predecessors.map(Number).filter((p) => p !== n.id);
  q.update('wbs_nodes', n.id, d);
  return { ok: true };
}));
r.delete('/wbs/:id/nodes/:nid', requirePerm('wbs.manage'), h((req) => { const w = wbsForOrg(req); q.run('DELETE FROM wbs_nodes WHERE id = ? AND wbs_id = ?', req.params.nid, w.id); return { ok: true }; }));
r.get('/task-search', requirePerm('wbs.view'), h((req) => q.all(`SELECT t.id, t.name, t.status, t.due_date, p.code FROM run_tasks t JOIN projects p ON p.id = t.project_id WHERE t.org_id = ? AND (t.name LIKE ? OR p.code LIKE ? OR p.name LIKE ?) ORDER BY t.id DESC LIMIT 30`,
  req.orgId, ...Array(3).fill(`%${req.query.q || ''}%`))));

export { invalidate };
export default r;
