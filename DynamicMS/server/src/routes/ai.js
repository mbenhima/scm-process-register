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
import { PROVIDERS, llmConfig, publicConfig, saveConfig, orgConnection, callModel, errorCategory, toItems } from '../services/llm.js';
import { specOf, specCompleteness, buildPrompt, assemble, defaultSpec, SPEC_FIELDS, SPEC_LABELS, SPEC_REQUIRED } from '../services/aiprompt.js';
import { generate, recordOutcome, requireServing, requestConnection } from '../services/aigen.js';
import { stepFields, deriveFields, setLinks, linksOf, effectiveActive, servingUseCases, specVersion, libraryFigures, coverage, suggestFor, nextCustomCode } from '../services/aiusecases.js';
import { PLACES } from '../catalog/aiplaces.js';

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

// ---- AI use case library (FR-DA-AI-01, -13, -21 to -25)
const TASK_TYPES = ['Text Generation', 'Summarization', 'Classification', 'Recommendation', 'Prediction'];
const usageOf = (orgId) => Object.fromEntries(all(`SELECT usecase_id, SUM(parent_id IS NULL) n, SUM(outcome='Accepted') acc, SUM(outcome='Edited') ed, SUM(outcome='Rejected') rej, AVG(CASE WHEN parent_id IS NULL THEN confidence END) conf FROM ai_usage_log WHERE org_id=? GROUP BY usecase_id`, orgId).map(u => [u.usecase_id, u]));
function brief(u, cat, tier, usage, projectId) {
  const comp = specCompleteness(specOf(u), 'en');
  return { ...row(u), prompt_spec: undefined, step_name: cat.stepById[u.linked_step]?.name || null, mp_name: cat.mpById[u.linked_mp]?.name || null, task: cat.stepById[u.linked_step]?.task || null,
    entitled: u.tier === 'Assistive' || tier.includes('Augmented'), usage: usage[u.id] || null, completeness: Math.round(100 * comp.filled / comp.total), specComplete: comp.complete,
    projectActive: projectId ? effectiveActive(u, projectId) : null, links: all('SELECT COUNT(*) n FROM ai_usecase_links WHERE usecase_id=?', u.id)[0].n };
}
r.get('/orgs/:id/ai/usecases', requirePerm('ai.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  const tier = orgConfig(o).aiTier;
  const projectId = req.query.projectId ? loadProject(req, req.query.projectId).id : null;
  const raw = all('SELECT * FROM ai_usecases WHERE org_id=? ORDER BY custom, code', o.id);
  const usage = usageOf(o.id);
  const cat = catalog();
  let items = raw.map(u => brief(u, cat, tier, usage, projectId));
  const figures = libraryFigures(o.id, projectId, raw);
  const q = req.query;
  if (q.tier) items = items.filter(u => u.tier === q.tier);
  if (q.state) items = items.filter(u => (q.state === 'active') === !!(projectId ? u.projectActive : u.active));
  if (q.origin) items = items.filter(u => (q.origin === 'custom') === !!u.custom);
  send(req, res, { tier, figures, items });
}));
// The process elements a use case can be linked to (form pickers).
r.get('/orgs/:id/ai/linkables', requirePerm('ai.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const c = catalog();
  send(req, res, {
    e2e: c.e2e.map(e => ({ id: e.id, name: e.name })),
    mps: c.macroProcesses.map(m => ({ id: m.id, code: m.code, name: m.name, e2e: m.e2e })),
    tasks: c.tasks.map(t => ({ id: t.id, name: t.name, mp: t.mp })),
    steps: c.steps.map(s => ({ id: s.id, name: s.name, mp: s.mp, task: s.task, type: s.type, fields: stepFields(s.id) })),
    modules: Object.entries(PLACES).map(([id, name]) => ({ id, name })),
  });
}));
// The page of one use case (FR-DA-AI-21).
r.get('/ai/usecases/:id', requirePerm('ai.view'), h((req, res) => {
  const u0 = loadOrgRow(req, 'ai_usecases', req.params.id, false, 'AI use case');
  const u = get('SELECT * FROM ai_usecases WHERE id=?', u0.id);
  const o = get('SELECT * FROM organizations WHERE id=?', u.org_id);
  const cat = catalog();
  const projectId = req.query.projectId ? loadProject(req, req.query.projectId).id : null;
  const spec = specOf(u);
  const step = cat.stepById[u.linked_step];
  const base = u.based_on ? get('SELECT id, code, name FROM ai_usecases WHERE id=?', u.based_on) : null;
  const log = rows(all('SELECT l.*, us.name AS user_name FROM ai_usage_log l LEFT JOIN users us ON us.id=l.user_id WHERE l.usecase_id=? ORDER BY l.created_at DESC LIMIT 200', u.id));
  const counts = { Proposed: 0, Accepted: 0, Edited: 0, Rejected: 0 };
  for (const x of all('SELECT outcome, COUNT(*) n FROM ai_usage_log WHERE usecase_id=? GROUP BY outcome', u.id)) counts[x.outcome] = x.n;
  const ov = projectId ? get('SELECT state FROM ai_project_overrides WHERE usecase_id=? AND project_id=?', u.id, projectId)?.state || 'Inherit' : null;
  send(req, res, {
    ...brief(u, cat, orgConfig(o).aiTier, usageOf(u.org_id), projectId),
    step: step ? { id: step.id, name: step.name, mp: step.mp, task: step.task, taskName: cat.tasks.find(t => t.id === step.task)?.name, mpCode: cat.mpById[step.mp]?.code, mpName: cat.mpById[step.mp]?.name } : null,
    basedOn: base ? { ...base, name: P(base.name) } : null,
    links: linksOf(u.id), override: ov,
    spec, specFields: SPEC_FIELDS.map(k => ({ key: k, label: SPEC_LABELS[k], required: SPEC_REQUIRED.includes(k) })), specCompleteness: specCompleteness(spec, req.lang), specVersion: specVersion(u.id),
    versions: { usecase: versions('ai_usecase', u.id).length, spec: versions('prompt_spec', u.id).length },
    log, counts, quota: libraryFigures(u.org_id, null, all('SELECT * FROM ai_usecases WHERE org_id=?', u.org_id)),
  });
}));
const textOf = (req, v) => (v === undefined || v === null ? null : typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k, x]) => ['en', 'fr', 'ar'].includes(k) && String(x || '').trim()).map(([k, x]) => [k, String(x).trim().slice(0, 4000)])) : String(v).trim() ? { [req.lang]: String(v).trim().slice(0, 4000) } : null);
const hasText = (v) => v && Object.values(v).some(x => String(x).trim());
function checkQuota(o) {
  const n = get('SELECT COUNT(*) n FROM ai_usecases WHERE org_id=? AND custom=1', o.id).n;
  const q = orgConfig(o).quotas.customAi;
  if (n >= q) throw new HttpError(402, 'QUOTA_EXCEEDED', `The Solution Pack allows ${q} custom AI use cases; ${n} exist.`);
  return n;
}
// The fields of the form (FR-DA-AI-01); every text in each configured language.
function formValues(req, b, prev = null) {
  const c = catalog();
  const primaryStep = b.primaryStep !== undefined ? (b.primaryStep || null) : prev?.linked_step || null;
  if (primaryStep && !c.stepById[primaryStep]) throw bad('BAD_STEP', 'Choose the primary step in the process design.');
  const name = b.name !== undefined ? textOf(req, b.name) : P(prev?.name);
  const checkpoint = b.checkpoint !== undefined ? textOf(req, b.checkpoint) : P(prev?.checkpoint);
  if (!hasText(name)) throw bad('FIELDS_REQUIRED', 'Name is required.', { fields: ['name'] });
  if (!hasText(checkpoint)) throw bad('FIELDS_REQUIRED', 'The human checkpoint is required.', { fields: ['checkpoint'] });
  const taskType = b.taskType !== undefined ? b.taskType : P(prev?.task_type)?.en;
  if (!TASK_TYPES.includes(taskType)) throw bad('FIELDS_REQUIRED', 'Choose the model task type.', { fields: ['taskType'] });
  const tier = b.tier || prev?.tier || 'Assistive';
  if (!['Assistive', 'Augmented'].includes(tier)) throw bad('BAD_TIER', 'Tier must be Assistive or Augmented.');
  const d = deriveFields(primaryStep, { module: b.module !== undefined ? b.module : prev?.module, trigger: b.trigger !== undefined ? textOf(req, b.trigger) : P(prev?.trigger_), expectedOutput: b.expectedOutput !== undefined ? textOf(req, b.expectedOutput) : P(prev?.expected_output) });
  return { name, checkpoint, taskType, tier, primaryStep, mp: primaryStep ? c.stepById[primaryStep].mp : (prev?.linked_mp || null), module: d.module, trigger: d.trigger, expectedOutput: d.expectedOutput,
    risk: ['Low', 'Medium', 'High'].includes(b.riskLevel) ? b.riskLevel : prev?.risk_level || 'Medium', scope: ['Global', 'Tenant'].includes(b.scope) ? b.scope : prev?.scope || 'Tenant',
    prompt: b.prompt !== undefined ? textOf(req, b.prompt) : P(prev?.prompt) };
}
const TT = (x) => ({ en: x, fr: { 'Text Generation': 'Génération de texte', Summarization: 'Synthèse', Classification: 'Classification', Recommendation: 'Recommandation', Prediction: 'Prédiction' }[x], ar: { 'Text Generation': 'توليد النصوص', Summarization: 'التلخيص', Classification: 'التصنيف', Recommendation: 'التوصية', Prediction: 'التنبؤ' }[x] });
const formLinks = (v, b) => [...(v.primaryStep ? [{ type: 'step', id: v.primaryStep, primary: true }] : []), ...(Array.isArray(b.links) ? b.links.filter(l => !(l.type === 'step' && l.id === v.primaryStep)).map(l => ({ type: l.type, id: l.id, inputs: l.inputs, outputs: l.outputs })) : [])];
r.post('/orgs/:id/ai/usecases', requirePerm('ai.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  const b = req.body || {};
  const n = checkQuota(o);
  const v = formValues(req, b);
  if (v.tier === 'Augmented') assertFeature(o.id, 'ai_augmented');
  if (!v.primaryStep && !(b.links || []).length) throw bad('FIELDS_REQUIRED', 'Choose the primary step, or link the use case to a place.', { fields: ['primaryStep'] });
  const id = uid();
  run('INSERT INTO ai_usecases(id,org_id,code,name,tier,module,trigger_,expected_output,checkpoint,prompt,task_type,risk_level,linked_step,linked_mp,custom,active,approval,version,created_at,scope,origin,spec_version,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0,?,1,?,?,?,1,?)',
    id, o.id, nextCustomCode(o.id, n), J(v.name), v.tier, v.module, J(v.trigger), J(v.expectedOutput), J(v.checkpoint), J(v.prompt), J(TT(v.taskType)), v.risk, v.primaryStep, v.mp, 'Draft', now(), v.scope, 'Custom', now());
  setLinks(o.id, id, formLinks(v, b));
  // Created deactivated, as a Draft, with a fully populated specification as its Version 1 (FR-DA-AI-25).
  const spec = defaultSpec(get('SELECT * FROM ai_usecases WHERE id=?', id));
  run('UPDATE ai_usecases SET prompt_spec=? WHERE id=?', J(spec), id);
  snapshot(req, o.id, 'prompt_spec', id, spec, { en: 'Version 1', fr: 'Version 1', ar: 'الإصدار 1' });
  audit(req, o.id, 'ai_usecase', id, 'create', null, { ...v, links: b.links || [] }, textOf(req, b.justification));
  snapshot(req, o.id, 'ai_usecase', id, row(get('SELECT * FROM ai_usecases WHERE id=?', id)), textOf(req, b.justification));
  res.status(201).json({ id });
}));
r.put('/ai/usecases/:id', requirePerm('ai.manage'), h((req, res) => {
  const u = get('SELECT * FROM ai_usecases WHERE id=?', loadOrgRow(req, 'ai_usecases', req.params.id, true, 'AI use case').id);
  const b = req.body || {};
  const just = textOf(req, b.justification);
  const activation = Object.keys(b).every(k => ['active', 'approval', 'justification', 'riskLevel'].includes(k));
  if (!activation && !hasText(just)) throw bad('JUSTIFICATION_REQUIRED', 'Give the reason for this change.', { fields: ['justification'] });
  if (b.active) {
    if (u.tier === 'Augmented') assertFeature(u.org_id, 'ai_augmented');
    const comp = specCompleteness(specOf(u), req.lang);
    if (!comp.complete) throw bad('PROMPT_INCOMPLETE', `Complete the prompt specification before activation: ${comp.missing.join(', ')}.`);
    if (u.custom && u.approval !== 'Approved' && b.approval !== 'Approved') throw bad('APPROVAL_REQUIRED', 'A custom use case must be reviewed and approved before activation.');
  }
  if (activation) {
    run('UPDATE ai_usecases SET active=COALESCE(?,active), approval=COALESCE(?,approval), risk_level=COALESCE(?,risk_level), version=version+1, updated_at=? WHERE id=?',
      b.active === undefined ? null : (b.active ? 1 : 0), b.approval || null, b.riskLevel || null, now(), u.id);
  } else {
    const v = formValues(req, b, u);
    if (v.tier === 'Augmented') assertFeature(u.org_id, 'ai_augmented');
    run('UPDATE ai_usecases SET name=?, tier=?, module=?, trigger_=?, expected_output=?, checkpoint=?, prompt=?, task_type=?, risk_level=?, linked_step=?, linked_mp=?, scope=?, version=version+1, updated_at=? WHERE id=?',
      J(v.name), v.tier, v.module, J(v.trigger), J(v.expectedOutput), J(v.checkpoint), J(v.prompt), J(TT(v.taskType)), v.risk, v.primaryStep, v.mp, v.scope, now(), u.id);
    if (b.links !== undefined || b.primaryStep !== undefined) setLinks(u.org_id, u.id, formLinks(v, b.links !== undefined ? b : { links: linksOf(u.id).filter(l => !l.primary).map(l => ({ type: l.type, id: l.targetId, inputs: l.inputs, outputs: l.outputs })) }));
  }
  audit(req, u.org_id, 'ai_usecase', u.id, 'update', { active: u.active, approval: u.approval, name: P(u.name) }, b, just);
  snapshot(req, u.org_id, 'ai_usecase', u.id, row(get('SELECT * FROM ai_usecases WHERE id=?', u.id)), just);
  res.json({ ok: true });
}));
// Duplicate (FR-DA-AI-01, -25): a deactivated Draft recording its base, the specification copied as its Version 1.
r.post('/ai/usecases/:id/duplicate', requirePerm('ai.manage'), h((req, res) => {
  const u = get('SELECT * FROM ai_usecases WHERE id=?', loadOrgRow(req, 'ai_usecases', req.params.id, true, 'AI use case').id);
  const o = get('SELECT * FROM organizations WHERE id=?', u.org_id);
  const n = checkQuota(o);
  const id = uid();
  const name = Object.fromEntries(Object.entries(P(u.name) || {}).map(([k, v]) => [k, `${v} (${{ en: 'copy', fr: 'copie', ar: 'نسخة' }[k] || 'copy'})`]));
  const spec = specOf(u);
  run('INSERT INTO ai_usecases(id,org_id,code,name,tier,module,trigger_,expected_output,checkpoint,prompt,task_type,risk_level,linked_step,linked_mp,custom,active,approval,version,created_at,model,prompt_spec,based_on,scope,origin,spec_version,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0,?,1,?,?,?,?,?,?,1,?)',
    id, u.org_id, nextCustomCode(u.org_id, n), J(name), u.tier, u.module, u.trigger_, u.expected_output, u.checkpoint, u.prompt, u.task_type, u.risk_level, u.linked_step, u.linked_mp, 'Draft', now(), u.model, J(spec), u.id, u.scope || 'Tenant', 'Duplicate', now());
  setLinks(u.org_id, id, linksOf(u.id).map(l => ({ type: l.type, id: l.targetId, primary: l.primary, inputs: l.inputs, outputs: l.outputs })));
  snapshot(req, u.org_id, 'prompt_spec', id, spec, { en: `Version 1 — copied from ${u.code}`, fr: `Version 1 — copiée de ${u.code}`, ar: `الإصدار 1 — منسوخ من ${u.code}` });
  audit(req, u.org_id, 'ai_usecase', id, 'duplicate', null, { basedOn: u.code }, textOf(req, req.body?.justification));
  snapshot(req, u.org_id, 'ai_usecase', id, row(get('SELECT * FROM ai_usecases WHERE id=?', id)), null);
  res.status(201).json({ id });
}));
r.delete('/ai/usecases/:id', requirePerm('ai.manage'), h((req, res) => {
  const u = loadOrgRow(req, 'ai_usecases', req.params.id, true, 'AI use case');
  if (!u.custom) throw bad('SEEDED_USECASE', 'Library use cases can be deactivated or duplicated, not deleted.');
  // The usage-log entries are kept (FR-DA-AI-14).
  run('DELETE FROM ai_usecase_links WHERE usecase_id=?', u.id);
  run('DELETE FROM ai_project_overrides WHERE usecase_id=?', u.id);
  run('DELETE FROM ai_usecases WHERE id=?', u.id);
  audit(req, u.org_id, 'ai_usecase', u.id, 'delete', u, null, textOf(req, req.body?.justification));
  res.json({ ok: true });
}));
// Suggest a use case for a task or step that has none (FR-DA-AIP-11).
r.post('/orgs/:id/ai/usecases/suggest', requirePerm('ai.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  checkQuota(o);
  const id = suggestFor(req, o.id, { taskId: req.body?.taskId, stepId: req.body?.stepId });
  if (!id) throw bad('BAD_TARGET', 'Choose a task or a step of the process design.');
  audit(req, o.id, 'ai_usecase', id, 'suggest', null, { task: req.body?.taskId || null, step: req.body?.stepId || null }, null);
  snapshot(req, o.id, 'ai_usecase', id, row(get('SELECT * FROM ai_usecases WHERE id=?', id)), null);
  res.status(201).json({ id });
}));
// Coverage of the process design (FR-DA-AI-13).
r.get('/orgs/:id/ai/coverage', requirePerm('ai.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const projectId = req.query.projectId ? loadProject(req, req.query.projectId).id : null;
  let list = coverage(req.params.id, projectId);
  if (req.query.tier) list = list.filter(t => t.usecases.some(u => u.tier === req.query.tier));
  if (req.query.covered === '1') list = list.filter(t => t.covered);
  if (req.query.covered === '0') list = list.filter(t => !t.covered);
  const all2 = coverage(req.params.id, projectId);
  send(req, res, { total: all2.length, covered: all2.filter(t => t.covered).length, items: list });
}));
// The active use cases serving a place: the client shows an AI action only when there is one (FR-DA-AI-23).
r.get('/orgs/:id/ai/serving', requirePerm('ai.view', 'ai.use', 'execution.view', 'project.create', 'assistant.use'), h((req, res) => {
  requireOrg(req, req.params.id);
  const projectId = req.query.projectId ? loadProject(req, req.query.projectId).id : null;
  const target = req.query.step ? { step: String(req.query.step) } : { module: String(req.query.module || '') };
  const list = servingUseCases(req.params.id, projectId, target);
  send(req, res, { items: list.map(u => ({ id: u.id, code: u.code, name: P(u.name), tier: u.tier, checkpoint: P(u.checkpoint) })), canSuggest: can(req, 'ai.manage') });
}));
r.put('/projects/:id/ai/overrides/:ucId', requirePerm('ai.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const u = loadOrgRow(req, 'ai_usecases', req.params.ucId, true, 'AI use case');
  if (u.org_id !== p.org_id) throw notFound('AI use case');
  const state = req.body?.state;
  if (state === 'Inherit') run('DELETE FROM ai_project_overrides WHERE usecase_id=? AND project_id=?', u.id, p.id);
  else if (['Active', 'Inactive'].includes(state)) {
    if (state === 'Active' && !specCompleteness(specOf(u), req.lang).complete) throw bad('PROMPT_INCOMPLETE', 'Complete the prompt specification before activation.');
    if (state === 'Active' && u.custom && u.approval !== 'Approved') throw bad('APPROVAL_REQUIRED', 'A custom use case must be reviewed and approved before activation.');
    run('INSERT INTO ai_project_overrides(usecase_id,project_id,org_id,state) VALUES(?,?,?,?) ON CONFLICT(usecase_id,project_id) DO UPDATE SET state=excluded.state', u.id, p.id, p.org_id, state);
  } else throw bad('BAD_STATE', 'State must be Active, Inactive or Inherit.');
  audit(req, p.org_id, 'ai_override', u.id, 'update', null, { project: p.id, state }, null);
  res.json({ ok: true });
}));
r.get('/projects/:id/ai/overrides', requirePerm('ai.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  res.json(all('SELECT usecase_id, state FROM ai_project_overrides WHERE project_id=?', p.id));
}));

// ---- LLM configuration (per organization; FR-DA-AI-15, -16)
const CATEGORY = { authentication: 'Authentication failure', model: 'Model not found', rate: 'Rate limited', unreachable: 'Unreachable' };
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
async function testConn(conn) {
  if (!conn) return { ok: false, category: 'disabled', message: 'The provider is disabled; enable it first.' };
  try { const r2 = await callModel(conn, { system: 'Reply with the single word OK.', user: 'Connection test from DynamicMS.' }); return { ok: true, category: 'works', message: `Works · ${r2.provider} · ${r2.model}` }; } catch (e) { const k = errorCategory(e.message); return { ok: false, category: k, message: CATEGORY[k] }; }
}
r.post('/orgs/:id/ai/llm/test', requirePerm('ai.manage'), h(async (req, res) => {
  requireOrg(req, req.params.id);
  const c = llmConfig(req.params.id);
  if (c.provider === 'builtin') return res.json({ ok: true, category: 'works', message: 'Built-in engine: no external call.' });
  res.json(await testConn(orgConnection(req.params.id)));
}));
// The provider list for the personal connection (no secret).
r.get('/ai/providers', h((req, res) => res.json({ providers: PROVIDERS })));
// Test of the personal connection forwarded by the browser for this request only (FR-DA-AI-08).
r.post('/ai/personal/test', requirePerm('ai.use', 'assistant.use'), h(async (req, res) => {
  const conn = requestConnection(req);
  if (!conn) return res.json({ ok: false, category: 'invalid', message: 'Choose a provider and a model and type the key (and the HTTPS endpoint for a custom model).' });
  res.json(await testConn(conn));
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

// A run of a use case: step proposals and the test run of the use case page (FR-DA-AI-21).
async function runUseCase(req, { u, p, recordType, recordId, input, test }) {
  const full = get('SELECT * FROM ai_usecases WHERE id=?', u.id);
  if (test) { if (!specCompleteness(specOf(full), req.lang).complete) throw bad('PROMPT_INCOMPLETE', 'Complete the prompt specification first.'); }
  else assertFeature(p.org_id, u.tier === 'Augmented' ? 'ai_augmented' : 'ai_assistive');
  const prompt = buildPrompt(full, { projectId: p.id, stepExecId: recordType === 'step' ? recordId : null, input, lang: req.lang });
  return generate(req, { usecase: full, projectId: p.id, recordType, recordId, prompt, skipActivation: !!test,
    parse: (text) => { const items = toItems(text); return items.length ? { kind: 'LLM', items, sources: [{ type: 'llm', id: 'llm', title: 'Language model' }] } : null; },
    builtin: () => suggest({ usecase: full, project: get('SELECT * FROM projects WHERE id=?', p.id), lang: req.lang, input }) });
}
r.post('/ai/suggest', requirePerm('ai.use'), h(async (req, res) => {
  const p = loadProject(req, req.body?.projectId, true);
  const u = loadOrgRow(req, 'ai_usecases', req.body?.usecaseId, false, 'AI use case');
  if (u.org_id !== p.org_id) throw notFound('AI use case');
  // The step proposal runs only through a use case that serves the step (FR-DA-AI-23).
  if (req.body?.recordType === 'step') {
    const e = get('SELECT step_id FROM step_exec WHERE id=? AND project_id=?', req.body.recordId, p.id);
    if (e && !servingUseCases(p.org_id, p.id, { step: e.step_id }).some(x => x.id === u.id)) throw bad('USECASE_INACTIVE', 'This AI use case does not serve this step, or is not active for the project.');
  }
  send(req, res, await runUseCase(req, { u, p, recordType: req.body?.recordType || null, recordId: req.body?.recordId || null, input: req.body?.input }));
}));
r.post('/ai/usecases/:id/test', requirePerm('ai.manage'), h(async (req, res) => {
  const u = loadOrgRow(req, 'ai_usecases', req.params.id, false, 'AI use case');
  const p = loadProject(req, req.body?.projectId);
  if (u.org_id !== p.org_id) throw notFound('AI use case');
  send(req, res, await runUseCase(req, { u, p, recordType: 'test', recordId: req.body?.stepId || null, input: req.body?.input, test: true }));
}));
// The outcome of a suggestion or of each of its items, appended to the log (FR-DA-AI-07).
r.post('/ai/feedback', requirePerm('ai.use', 'execution.perform', 'project.create', 'assistant.use'), h((req, res) => {
  const { parent } = recordOutcome(req, req.body?.logId, { item: req.body?.item, outcome: req.body?.outcome });
  audit(req, parent.org_id, 'ai_suggestion', parent.id, 'feedback', null, { item: req.body?.item ?? null, outcome: req.body.outcome }, null);
  res.status(201).json({ ok: true });
}));
r.get('/projects/:id/ai/log', requirePerm('ai.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  send(req, res, rows(all('SELECT l.*, u.name AS user_name, c.code AS usecase_code, c.name AS usecase_name, c.tier FROM ai_usage_log l LEFT JOIN users u ON u.id=l.user_id LEFT JOIN ai_usecases c ON c.id=l.usecase_id WHERE l.project_id=? ORDER BY l.created_at DESC, l.parent_id IS NOT NULL DESC LIMIT 500', p.id)));
}));

// ---- AI Assistant (help, standards and data modes), through its AI Use Case (FR-DA-AI-23)
r.post('/assistant/ask', requirePerm('assistant.use'), h(async (req, res) => {
  const mode = ['help', 'standards', 'data'].includes(req.body?.mode) ? req.body.mode : 'help';
  const p = req.body?.projectId ? loadProject(req, req.body.projectId) : null;
  if (!String(req.body?.question || '').trim()) throw bad('QUESTION_REQUIRED', 'Type a question.');
  const orgId = p?.org_id || req.user.org_id;
  if (!orgId) throw bad('ORG_REQUIRED', 'Open a project of an organization to use the assistant.');
  assertFeature(orgId, 'assistant');
  const u = requireServing(orgId, p?.id || null, { module: 'assistant' });
  const base = ask({ question: req.body.question, mode, lang: req.lang, projectId: p?.id, user: req.user });
  const refs = (base.sources || []).map(s => `- ${s.title || s.id}`).join('\n');
  const prompt = assemble(u, req.lang || 'en', [`Mode: ${mode}`, `Question: ${String(req.body.question).slice(0, 800)}`, `References retrieved:\n${refs || '- none'}`, base.answer ? `Reference answer: ${String(base.answer).slice(0, 1500)}` : '']);
  const out = await generate(req, { usecase: u, projectId: p?.id || null, recordType: 'assistant', recordId: mode, prompt, live: mode !== 'data' && (base.sources || []).length > 0,
    parse: (text) => ({ ...base, answer: text, confidence: base.confidence }), builtin: () => base, count: () => 1 });
  res.json(out);
}));

// ---- Knowledge base and help
r.get('/kb', requirePerm('kb.view'), h((req, res) => send(req, res, catalog().kb)));
r.get('/help', h((req, res) => send(req, res, { articles: catalog().help, faq: catalog().faq })));

export default r;
export { versions };
