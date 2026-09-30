// Alerts, AI use case library and governance, AI Assistant, knowledge base and help.
import { Router } from 'express';
import { all, get, run, uid, now, J, P } from '../db.js';
import { requirePerm, can, assertFeature } from '../auth.js';
import { h, send, row, rows, bad, notFound, requireOrg, loadProject, loadOrgRow, orgAccess, HttpError, paginate } from '../http.js';
import { audit, snapshot, versions } from '../services/audit.js';
import { ALERT_TYPES } from '../services/alerts.js';
import { ask, suggest } from '../services/ai.js';
import { catalog } from '../catalog/store.js';
import { orgConfig } from '../packs.js';
import { PROVIDERS, llmConfig, publicConfig, saveConfig, complete, toItems } from '../services/llm.js';
import { specOf, specCompleteness, buildPrompt } from '../services/aiprompt.js';

const r = Router();

// ---- Alerts (notification center)
r.get('/alerts/catalog', requirePerm('alerts.view'), h((req, res) => {
  const c = catalog();
  send(req, res, [...Object.entries(ALERT_TYPES).map(([id, a]) => ({ id, ...a, source: 'engine' })), ...c.alerts.map(a => ({ id: a.id, severity: a.severity, name: a.condition, description: a.condition, escalation: a.escalation, step: a.step, source: 'catalog' }))]);
}));
r.get('/alerts', requirePerm('alerts.view'), h((req, res) => {
  const { limit, offset } = paginate(req, 300);
  const where = ['dismissed=0']; const args = [];
  if (req.query.projectId) { loadProject(req, req.query.projectId); where.push('project_id=?'); args.push(req.query.projectId); }
  else if (req.query.orgId) { requireOrg(req, req.query.orgId); where.push('org_id=?'); args.push(req.query.orgId); }
  else { where.push('org_id=?'); args.push(req.user.org_id); }
  if (req.query.unread === '1') where.push('read_at IS NULL');
  if (req.query.severity) { where.push('severity=?'); args.push(req.query.severity); }
  if (req.query.mine === '1') { where.push(`(${req.user.roles.map(() => 'escalation LIKE ?').join(' OR ') || '1=0'})`); args.push(...req.user.roles.map(x => `%"${x}"%`)); }
  const total = get(`SELECT COUNT(*) n FROM alerts WHERE ${where.join(' AND ')}`, ...args).n;
  const unread = get(`SELECT COUNT(*) n FROM alerts WHERE ${where.join(' AND ')} AND read_at IS NULL`, ...args).n;
  const items = rows(all(`SELECT * FROM alerts WHERE ${where.join(' AND ')} ORDER BY read_at IS NOT NULL, CASE severity WHEN 'Critical' THEN 0 WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, created_at DESC LIMIT ? OFFSET ?`, ...args, limit, offset));
  send(req, res, { total, unread, items });
}));
r.put('/alerts/:id', requirePerm('alerts.view'), h((req, res) => {
  const a = loadOrgRow(req, 'alerts', req.params.id, true, 'Alert');
  if (req.body?.read !== undefined) run('UPDATE alerts SET read_at=? WHERE id=?', req.body.read ? now() : null, a.id);
  if (req.body?.dismissed) run('UPDATE alerts SET dismissed=1 WHERE id=?', a.id);
  res.json({ ok: true });
}));
r.post('/alerts/read-all', requirePerm('alerts.view'), h((req, res) => {
  const p = req.body?.projectId ? loadProject(req, req.body.projectId) : null;
  run(`UPDATE alerts SET read_at=? WHERE read_at IS NULL AND ${p ? 'project_id=?' : 'org_id=?'}`, now(), p ? p.id : req.user.org_id);
  res.json({ ok: true });
}));
r.get('/orgs/:id/alert-settings', requirePerm('alerts.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  send(req, res, all('SELECT type, enabled FROM alert_settings WHERE org_id=?', req.params.id));
}));
r.put('/orgs/:id/alert-settings', requirePerm('alerts.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  for (const [type, on] of Object.entries(req.body || {})) run('INSERT INTO alert_settings(org_id,type,enabled) VALUES(?,?,?) ON CONFLICT(org_id,type) DO UPDATE SET enabled=excluded.enabled', req.params.id, type, on ? 1 : 0);
  audit(req, req.params.id, 'alert_settings', req.params.id, 'update', null, req.body, null);
  res.json({ ok: true });
}));
r.get('/orgs/:id/dispatches', requirePerm('alerts.manage'), h((req, res) => {
  requireOrg(req, req.params.id);
  send(req, res, rows(all('SELECT d.*, u.name AS user_name FROM dispatches d LEFT JOIN users u ON u.id=d.user_id WHERE d.org_id=? ORDER BY d.at DESC LIMIT 200', req.params.id)));
}));

// ---- AI use case library (FR-DA-AI)
r.get('/orgs/:id/ai/usecases', requirePerm('ai.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  const tier = orgConfig(o).aiTier;
  const list = rows(all('SELECT * FROM ai_usecases WHERE org_id=? ORDER BY custom, code', req.params.id));
  const usage = Object.fromEntries(all('SELECT usecase_id, COUNT(*) n, SUM(outcome=\'Accepted\') acc, SUM(outcome=\'Edited\') ed, SUM(outcome=\'Rejected\') rej, AVG(confidence) conf FROM ai_usage_log WHERE org_id=? GROUP BY usecase_id', req.params.id).map(u => [u.usecase_id, u]));
  send(req, res, { tier, items: list.map(u => ({ ...u, entitled: u.tier === 'Assistive' || tier.includes('Augmented'), usage: usage[u.id] || null })) });
}));
r.post('/orgs/:id/ai/usecases', requirePerm('ai.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  const b = req.body || {};
  const n = get('SELECT COUNT(*) n FROM ai_usecases WHERE org_id=? AND custom=1', o.id).n;
  if (n >= orgConfig(o).quotas.customAi) throw new HttpError(402, 'QUOTA_EXCEEDED', 'Custom AI use case quota reached.');
  if (!b.name || !b.checkpoint || !b.taskType) throw bad('FIELDS_REQUIRED', 'Name, task type and human checkpoint are required.');
  if (b.tier === 'Augmented') assertFeature(o.id, 'ai_augmented');
  if (b.linkedStep && !catalog().stepById[b.linkedStep]) throw bad('BAD_STEP', 'Unknown step: use a code like MP-001.2.');
  if (b.linkedStep) b.linkedMp = catalog().stepById[b.linkedStep].mp;
  const id = uid();
  const t = (v) => (v ? J({ [req.lang]: v }) : null);
  run('INSERT INTO ai_usecases(id,org_id,code,name,tier,module,trigger_,expected_output,checkpoint,prompt,task_type,risk_level,linked_step,linked_mp,custom,active,approval,version,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0,?,1,?)',
    id, o.id, `AIUC-C${String(n + 1).padStart(2, '0')}`, t(b.name), b.tier || 'Assistive', b.module || null, t(b.trigger), t(b.expectedOutput), t(b.checkpoint), t(b.prompt), J({ en: b.taskType, fr: b.taskType, ar: b.taskType }), b.riskLevel || 'Medium', b.linkedStep || null, b.linkedMp || null, 'Pending approval', now());
  audit(req, o.id, 'ai_usecase', id, 'create', null, b, null);
  snapshot(req, o.id, 'ai_usecase', id, row(get('SELECT * FROM ai_usecases WHERE id=?', id)), null);
  res.status(201).json({ id });
}));
r.put('/ai/usecases/:id', requirePerm('ai.manage'), h((req, res) => {
  const u = loadOrgRow(req, 'ai_usecases', req.params.id, true, 'AI use case');
  const b = req.body || {};
  if (b.active && u.tier === 'Augmented') assertFeature(u.org_id, 'ai_augmented');
  if (b.active && u.custom && u.approval !== 'Approved' && b.approval !== 'Approved') throw bad('APPROVAL_REQUIRED', 'A custom use case must be approved before activation.');
  if (b.active) { const comp = specCompleteness(specOf(u), req.lang); if (!comp.complete) throw bad('PROMPT_INCOMPLETE', `Complete the prompt specification before activation: ${comp.missing.join(', ')}.`); }
  const t = (cur, v) => (v === undefined ? J(cur) : J({ ...(cur || {}), [req.lang]: v }));
  run('UPDATE ai_usecases SET name=?, checkpoint=?, prompt=?, active=COALESCE(?,active), approval=COALESCE(?,approval), risk_level=COALESCE(?,risk_level), version=version+1 WHERE id=?',
    t(u.name, b.name), t(u.checkpoint, b.checkpoint), t(u.prompt, b.prompt), b.active === undefined ? null : (b.active ? 1 : 0), b.approval || null, b.riskLevel || null, u.id);
  audit(req, u.org_id, 'ai_usecase', u.id, 'update', { active: u.active, approval: u.approval }, b, b.justification || null);
  snapshot(req, u.org_id, 'ai_usecase', u.id, row(get('SELECT * FROM ai_usecases WHERE id=?', u.id)), b.justification || null);
  res.json({ ok: true });
}));
r.delete('/ai/usecases/:id', requirePerm('ai.manage'), h((req, res) => {
  const u = loadOrgRow(req, 'ai_usecases', req.params.id, true, 'AI use case');
  if (!u.custom) throw bad('SEEDED_USECASE', 'Library use cases can be deactivated, not deleted.');
  run('DELETE FROM ai_usecases WHERE id=?', u.id);
  audit(req, u.org_id, 'ai_usecase', u.id, 'delete', u, null, null);
  res.json({ ok: true });
}));
r.put('/projects/:id/ai/overrides/:ucId', requirePerm('ai.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const u = loadOrgRow(req, 'ai_usecases', req.params.ucId, true, 'AI use case');
  if (u.org_id !== p.org_id) throw notFound('AI use case');
  const state = req.body?.state;
  if (state === 'Inherit') run('DELETE FROM ai_project_overrides WHERE usecase_id=? AND project_id=?', u.id, p.id);
  else if (['Active', 'Inactive'].includes(state)) run('INSERT INTO ai_project_overrides(usecase_id,project_id,org_id,state) VALUES(?,?,?,?) ON CONFLICT(usecase_id,project_id) DO UPDATE SET state=excluded.state', u.id, p.id, p.org_id, state);
  else throw bad('BAD_STATE', 'State must be Active, Inactive or Inherit.');
  audit(req, p.org_id, 'ai_override', u.id, 'update', null, { project: p.id, state }, null);
  res.json({ ok: true });
}));
r.get('/projects/:id/ai/overrides', requirePerm('ai.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  res.json(all('SELECT usecase_id, state FROM ai_project_overrides WHERE project_id=?', p.id));
}));

// ---- LLM configuration (per organization)
r.get('/orgs/:id/ai/llm', requirePerm('ai.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  res.json({ providers: PROVIDERS, config: publicConfig(req.params.id), canEdit: can(req, 'ai.manage') });
}));
r.put('/orgs/:id/ai/llm', requirePerm('ai.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const prev = llmConfig(req.params.id);
  try { saveConfig(req.params.id, req.body || {}, prev); } catch (e) { throw bad(e.code || 'BAD_LLM', e.message); }
  audit(req, req.params.id, 'llm', req.params.id, 'update', { provider: prev.provider, model: prev.model, enabled: prev.enabled }, { provider: req.body?.provider, model: req.body?.model, enabled: req.body?.enabled, keyChanged: !!req.body?.apiKey }, null);
  res.json(publicConfig(req.params.id));
}));
r.post('/orgs/:id/ai/llm/test', requirePerm('ai.manage'), h(async (req, res) => {
  requireOrg(req, req.params.id);
  const c = llmConfig(req.params.id);
  if (c.provider === 'builtin') return res.json({ ok: true, message: 'Built-in engine: no external call.' });
  try {
    const r2 = await complete(req.params.id, { system: 'Reply with the single word OK.', user: 'Connection test from DynamicMS.' });
    if (!r2) return res.json({ ok: false, message: 'The provider is disabled; enable it first.' });
    res.json({ ok: true, message: `${r2.provider} · ${r2.model}: ${r2.text.slice(0, 60)}` });
  } catch (e) { res.json({ ok: false, message: e.message }); }
}));
r.put('/ai/usecases/:id/model', requirePerm('ai.manage'), h((req, res) => {
  const u = loadOrgRow(req, 'ai_usecases', req.params.id, true, 'AI use case');
  run('UPDATE ai_usecases SET model=? WHERE id=?', req.body?.model || null, u.id);
  audit(req, u.org_id, 'ai_usecase', u.id, 'model', { model: u.model || null }, { model: req.body?.model || null }, null);
  res.json({ ok: true });
}));
// The exact prompt a use case sends for a step (transparency before running it).
r.get('/ai/usecases/:id/prompt', requirePerm('ai.view'), h((req, res) => {
  const u = loadOrgRow(req, 'ai_usecases', req.params.id, false, 'AI use case');
  const p = loadProject(req, req.query.projectId);
  res.json(buildPrompt(get('SELECT * FROM ai_usecases WHERE id=?', u.id), { projectId: p.id, stepExecId: req.query.stepId || null, lang: req.lang }));
}));

r.post('/ai/suggest', requirePerm('ai.use'), h(async (req, res) => {
  const p = loadProject(req, req.body?.projectId, true);
  const u = loadOrgRow(req, 'ai_usecases', req.body?.usecaseId, false, 'AI use case');
  if (u.org_id !== p.org_id) throw notFound('AI use case');
  const ov = get('SELECT state FROM ai_project_overrides WHERE usecase_id=? AND project_id=?', u.id, p.id)?.state;
  if (!(ov === 'Active' || (ov !== 'Inactive' && u.active))) throw bad('USECASE_INACTIVE', 'This AI use case is not active for the project.');
  assertFeature(p.org_id, u.tier === 'Augmented' ? 'ai_augmented' : 'ai_assistive');
  const full = get('SELECT * FROM ai_usecases WHERE id=?', u.id);
  const prompt = buildPrompt(full, { projectId: p.id, stepExecId: req.body?.recordType === 'step' ? req.body?.recordId : null, input: req.body?.input, lang: req.lang });
  let out = null; let source = 'rules+retrieval'; let warning = null;
  // The organization's LLM (when configured and enabled) answers first; the built-in engine is the fallback.
  try {
    const r2 = await complete(p.org_id, { system: prompt.system, user: prompt.user, model: full.model || undefined });
    if (r2 && r2.text) { out = { kind: 'LLM', items: toItems(r2.text), confidence: 0.8, sources: [{ type: 'llm', id: r2.provider, title: `${r2.provider} · ${r2.model}` }] }; source = `llm:${r2.provider}:${r2.model}`; }
  } catch (e) { warning = `LLM unavailable (${e.message}); built-in engine used.`; }
  if (!out) out = suggest({ usecase: full, project: get('SELECT * FROM projects WHERE id=?', p.id), lang: req.lang, input: req.body?.input });
  const id = uid();
  run('INSERT INTO ai_usage_log(id,org_id,project_id,usecase_id,record_type,record_id,user_id,outcome,confidence,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)', id, p.org_id, p.id, u.id, req.body?.recordType || null, req.body?.recordId || null, req.user.id, 'Pending', out.confidence, source, now());
  out = { ...out, prompt, engine: source, warning };
  send(req, res, { logId: id, usecase: { id: u.id, code: u.code, name: u.name, checkpoint: u.checkpoint, tier: u.tier }, ...out });
}));
r.post('/ai/feedback', requirePerm('ai.use'), h((req, res) => {
  const l = loadOrgRow(req, 'ai_usage_log', req.body?.logId, true, 'AI log');
  if (!['Accepted', 'Edited', 'Rejected'].includes(req.body?.outcome)) throw bad('BAD_OUTCOME', 'Outcome must be Accepted, Edited or Rejected.');
  if (l.user_id !== req.user.id) throw bad('NOT_YOURS', 'Only the requester records the outcome.');
  run('UPDATE ai_usage_log SET outcome=? WHERE id=?', req.body.outcome, l.id);
  audit(req, l.org_id, 'ai_suggestion', l.id, 'feedback', { outcome: l.outcome }, { outcome: req.body.outcome }, null);
  res.json({ ok: true });
}));
r.get('/projects/:id/ai/log', requirePerm('ai.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  send(req, res, rows(all('SELECT l.*, u.name AS user_name, c.code AS usecase_code, c.name AS usecase_name, c.tier FROM ai_usage_log l LEFT JOIN users u ON u.id=l.user_id LEFT JOIN ai_usecases c ON c.id=l.usecase_id WHERE l.project_id=? ORDER BY l.created_at DESC LIMIT 300', p.id)));
}));

// ---- AI Assistant (help, standards and data modes)
r.post('/assistant/ask', requirePerm('assistant.use'), h((req, res) => {
  const mode = ['help', 'standards', 'data'].includes(req.body?.mode) ? req.body.mode : 'help';
  if (mode === 'data' && req.body?.projectId) loadProject(req, req.body.projectId);
  if (!String(req.body?.question || '').trim()) throw bad('QUESTION_REQUIRED', 'Type a question.');
  if (req.user.org_id) assertFeature(req.user.org_id, 'assistant');
  res.json(ask({ question: req.body.question, mode, lang: req.lang, projectId: req.body?.projectId, user: req.user }));
}));

// ---- Knowledge base and help
r.get('/kb', requirePerm('kb.view'), h((req, res) => send(req, res, catalog().kb)));
r.get('/help', h((req, res) => send(req, res, { articles: catalog().help, faq: catalog().faq })));

export default r;
export { versions };
