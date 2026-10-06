import { Router } from 'express';
import { ah, projectOf } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { J, HttpError, pick } from '../lib/util.js';
import { requirePerm } from '../rbac.js';
import { audit } from '../audit.js';
import { useCases, effectiveActive, generate, logUsage, PROVIDERS, testConnection } from '../services/ai.js';
import { ask, intentCatalog } from '../services/assistant.js';
import { retrieve } from '../services/retrieval.js';
import { entitledModules } from '../entitlements.js';
import * as cat from '../catalog.js';
import * as P from '../services/prompts.js';
import * as D from '../services/design.js';
import { describeStep } from '../services/stepforms.js';
import { open } from '../services/secrets.js';
import { createRecord } from '../entities.js';

const r = Router();
/** The live model configuration travels in one request header and is used for one outbound call only (FR-DA-AI-08). */
const llmFrom = req => { const h = req.headers['x-llm-config']; if (!h) return null; try { return JSON.parse(Buffer.from(String(h), 'base64').toString('utf8')); } catch { return null; } };

r.get('/ai/use-cases', requirePerm('ai.view'), ah(req => useCases(req.orgId).map(u => ({ ...u, active: effectiveActive(req.orgId, null, u.id),
  orgActive: !!(one(`SELECT active FROM ai_activation WHERE org_id=? AND use_case_id=?`, req.orgId, u.id)?.active ?? 1),
  projectState: req.projectId ? one(`SELECT state FROM ai_overrides WHERE project_id=? AND use_case_id=?`, req.projectId, u.id)?.state || 'Inherit' : null,
  effective: effectiveActive(req.orgId, req.projectId, u.id), usage: one(`SELECT COUNT(*) n FROM ai_usage_log WHERE org_id=? AND use_case_id=?`, req.orgId, u.code).n }))));
r.put('/ai/use-cases/:id/activation', requirePerm('ai.manage'), ah(req => {
  const u = one(`SELECT id FROM records WHERE id=? AND entity='AIUseCase' AND org_id=?`, req.params.id, req.orgId); if (!u) throw new HttpError(404, 'err.notFound');
  // A use case is activated only when its specification is complete (FR-DA-AIP-06).
  if (req.body.active) { const sp = P.getSpec(req.orgId, u.id); if (sp.missing.length) throw new HttpError(409, 'err.specIncomplete', { fields: sp.missing.join(', ') }); }
  run(`INSERT INTO ai_activation(org_id,use_case_id,active) VALUES(?,?,?) ON CONFLICT(org_id,use_case_id) DO UPDATE SET active=excluded.active`, req.orgId, u.id, req.body.active ? 1 : 0);
  audit(req, 'AIUseCase', u.id, req.body.active ? 'activate' : 'deactivate', null, null, req.body._justification); return { ok: true };
}));
r.put('/ai/use-cases/:id/override', requirePerm('projects.manage'), ah(req => {
  const p = projectOf(req, req.body.project_id); const state = req.body.state;
  if (!['Inherit', 'On', 'Off'].includes(state)) throw new HttpError(422, 'err.invalidOption', { field: 'state', value: state });
  run(`INSERT INTO ai_overrides(project_id,use_case_id,state) VALUES(?,?,?) ON CONFLICT(project_id,use_case_id) DO UPDATE SET state=excluded.state`, p.id, req.params.id, state);
  audit(req, 'AIUseCaseOverride', `${p.id}:${req.params.id}`, 'update', null, { state }); return { ok: true };
}));
r.post('/ai/generate', requirePerm('ai.run', 'm00.view'), ah(async req => {
  const { code, project_id, input } = req.body || {}; if (project_id) projectOf(req, project_id);
  return generate({ orgId: req.orgId, projectId: project_id || null, user: req.user, lang: req.lang, code, input, llm: llmFrom(req), taskId: req.body?.task_id, stepId: req.body?.step_id });
}));
r.post('/ai/usage', requirePerm('ai.run'), ah(req => {
  const b = req.body || {}; if (!['Accepted', 'Edited', 'Rejected'].includes(b.outcome)) throw new HttpError(422, 'err.invalidOption', { field: 'outcome', value: b.outcome });
  logUsage({ orgId: req.orgId, projectId: b.project_id, useCaseId: b.use_case, recordRef: b.record_ref, userId: req.user.id, outcome: b.outcome, source: b.source, confidence: b.confidence, specVersion: b.spec_version, engine: b.engine, model: b.model }); return { ok: true };
}));
r.get('/ai/usage', requirePerm('ai.view'), ah(req => ({
  items: all(`SELECT l.*, u.name user_name FROM ai_usage_log l LEFT JOIN users u ON u.id=l.user_id WHERE l.org_id=? ORDER BY l.created_at DESC LIMIT 500`, req.orgId),
  summary: all(`SELECT outcome, COUNT(*) n FROM ai_usage_log WHERE org_id=? GROUP BY outcome`, req.orgId),
})));
r.get('/ai/models', requirePerm('ai.view'), ah(() => PROVIDERS));
r.post('/ai/test-connection', requirePerm('ai.view'), ah(async req => testConnection(req.body || {})));

// ---- Organization live model (FR-DA-AI-16 – 20); the key is stored encrypted and never returned (NFR-DA-SEC-17)
r.get('/ai/settings', requirePerm('ai.view'), ah(req => ({ ...P.getSettings(req.orgId), providers: PROVIDERS, profiles: P.MODEL_PROFILES })));
r.put('/ai/settings', requirePerm('aisettings.manage'), ah(req => P.saveSettings(req, req.body || {})));
r.post('/ai/settings/test', requirePerm('aisettings.manage'), ah(async req => {
  const cfg = P.liveConfig(req.orgId) || (() => { const s = one(`SELECT * FROM ai_settings WHERE org_id=?`, req.orgId); return s?.secret ? { provider: s.provider, endpoint: s.endpoint, model: req.body?.model || s.model, temperature: s.temperature, max_tokens: s.max_tokens, apiKey: open(s.secret) } : null; })();
  if (!cfg) { P.recordTest(req.orgId, 'noKey'); return { outcome: 'noKey' }; }
  const out = await testConnection({ ...cfg, model: req.body?.model || cfg.model }); P.recordTest(req.orgId, out.outcome, out.detail); audit(req, 'AiSettings', req.orgId, 'test', null, out); return out;
}));

// ---- Prompt Specifications (FR-DA-AIP-03 – 10)
r.get('/ai/use-cases/:id/spec', requirePerm('ai.view'), ah(req => P.getSpec(req.orgId, req.params.id)));
r.put('/ai/use-cases/:id/spec/:field', requirePerm('prompts.manage'), ah(req => P.saveField(req, req.params.id, req.params.field, req.body?.value, req.body?.note)));
r.get('/ai/use-cases/:id/spec/history', requirePerm('ai.view'), ah(req => P.history(req.orgId, req.params.id, req.query.field || null)));
r.post('/ai/use-cases/:id/spec/restore', requirePerm('prompts.manage'), ah(req => P.restoreSpec(req, req.params.id, req.body?.version, req.body?.field || null)));
r.put('/ai/use-cases/:id/model', requirePerm('prompts.manage'), ah(req => P.setModel(req, req.params.id, req.body?.model)));
/** The exact prompt the use case sends, resolved for a task or step, before a run (FR-DA-AI-18). */
r.get('/ai/use-cases/:id/prompt', requirePerm('ai.view'), ah(req => {
  const spec = P.getSpec(req.orgId, req.params.id); const vars = P.variables(req.orgId, { projectId: req.query.project || req.projectId, lang: req.lang, taskId: req.query.task, stepId: spec.useCase.step });
  const a = P.assemble(spec, vars, req.lang); const live = P.liveConfig(req.orgId, spec.model);
  return { ...a, engine: live ? 'live' : 'built-in', model: live?.model || null, specVersion: spec.version, variables: vars };
}));
/** Test a specification on a chosen record without writing the result to it (FR-DA-AIP-09). */
r.post('/ai/use-cases/:id/test', requirePerm('prompts.manage'), ah(async req => {
  const spec = P.getSpec(req.orgId, req.params.id);
  const out = await generate({ orgId: req.orgId, projectId: req.body?.project_id || req.projectId || null, user: req.user, lang: req.lang, code: spec.useCase.code, input: { values: req.body?.values || {} }, dryRun: true, taskId: req.body?.task_id, stepId: spec.useCase.step });
  return { ...out, dryRun: true };
}));
/** Link fit: the use case's expected output matches a field of its step and its inputs exist at that point (FR-DA-AIP-01, -02). */
r.get('/ai/use-cases/:id/fit', requirePerm('ai.view'), ah(req => {
  const uc = useCases(req.orgId).find(u => u.id === req.params.id); if (!uc) throw new HttpError(404, 'err.notFound');
  const step = D.get(req.orgId, 'step', uc.step); if (!step) return { ok: false, issues: ['noStep'] };
  const form = describeStep(step, {}); const type = String(uc.model_task_type || '').toLowerCase(); const issues = [];
  const expectsRows = /cluster|extract|classif|recommend|match|scor|rank|generation/.test(type);
  if (expectsRows && form.pattern !== 'inline' && form.pattern !== 'form') issues.push('outputMismatch');
  if (form.kind === 'system') issues.push('systemStep');
  const pos = D.list(req.orgId, 'uft').find(u => (u.steps || []).includes(step.id));
  if (!pos?.input) issues.push('noInput');
  return { ok: !issues.length, issues, step: { id: step.id, name: step.name }, inputs: pos?.input || null, outputs: form.fields.map(f => ({ key: f.key, label: f.label })), outputField: form.pattern === 'form' ? form.fields[0]?.key : 'rows' };
}));
/** Suggest an AI Use Case for a step that has none, as a draft with a populated specification, activated only after review (FR-DA-AIP-11). */
r.post('/ai/use-cases/suggest', requirePerm('prompts.manage'), ah(req => {
  const step = D.get(req.orgId, 'step', req.body?.step_id); if (!step) throw new HttpError(404, 'err.notFound');
  if (useCases(req.orgId).some(u => u.step === step.id)) throw new HttpError(409, 'err.useCaseExists');
  const kind = describeStep(step, {}).kind; const type = { record: 'Extraction', matrix: 'Scoring / ranking', decision: 'Summarization', objectives: 'Text generation', plan: 'Text generation', communication: 'Text generation', training: 'Recommendation', monitoring: 'Forecasting', review: 'Summarization', assignment: 'Matching', configuration: 'Classification' }[kind] || 'Text generation';
  const n = useCases(req.orgId).filter(u => /^AIUC-S/.test(u.code || '')).length + 1; const code = `AIUC-S${String(n).padStart(2, '0')}`;
  const name = Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, (l === 'fr' ? 'Assistance IA — ' : l === 'ar' ? 'مساعدة الذكاء الاصطناعي — ' : 'AI assistance — ') + pick(step.name, l)]));
  const rec = createRecord(req, 'AIUseCase', { code, name, step: step.id, model_task_type: type, risk: 'Low', tier: 'Assistive', approval: 'Draft', scope: 'Organization', isCustom: true, origin: 'ai-suggested' });
  run(`INSERT INTO ai_activation(org_id,use_case_id,active) VALUES(?,?,0) ON CONFLICT(org_id,use_case_id) DO UPDATE SET active=0`, req.orgId, rec.id);
  return { useCase: rec, spec: P.getSpec(req.orgId, rec.id) };
}));

// AI Assistant: gated by its view permission and the Pack's assistant entitlement (M00 core) — FR-DA-AST-06.
r.post('/assistant/ask', requirePerm('assistant.view'), ah(req => {
  if (!entitledModules(req.orgId).has('M00')) throw new HttpError(403, 'err.notEntitled', { feature: 'AI Assistant' });
  const q = String(req.body?.question || '').slice(0, 500); if (!q.trim()) throw new HttpError(422, 'err.required', { field: 'question' });
  return ask(req, q, req.body?.mode || 'auto');
}));
r.get('/assistant/intents', requirePerm('assistant.view'), ah(() => intentCatalog()));
r.get('/help', requirePerm('help.view'), ah(() => cat.list('help')));
r.get('/help/search', requirePerm('help.view'), ah(req => retrieve(null, String(req.query.q || ''), { lang: req.lang, k: 10, sources: ['help', 'faq'] })));
r.get('/kb/search', requirePerm('ai.view'), ah(req => retrieve(req.orgId, String(req.query.q || ''), { lang: req.query.lang || req.lang, k: 12, sources: ['kb', 'rex', 'process', 'glossary'] })));
export default r;
