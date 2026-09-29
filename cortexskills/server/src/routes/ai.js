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

const r = Router();
/** The live model configuration travels in one request header and is used for one outbound call only (FR-DA-AI-08). */
const llmFrom = req => { const h = req.headers['x-llm-config']; if (!h) return null; try { return JSON.parse(Buffer.from(String(h), 'base64').toString('utf8')); } catch { return null; } };

r.get('/ai/use-cases', requirePerm('ai.view'), ah(req => useCases(req.orgId).map(u => ({ ...u, active: effectiveActive(req.orgId, null, u.id),
  orgActive: !!(one(`SELECT active FROM ai_activation WHERE org_id=? AND use_case_id=?`, req.orgId, u.id)?.active ?? 1),
  projectState: req.projectId ? one(`SELECT state FROM ai_overrides WHERE project_id=? AND use_case_id=?`, req.projectId, u.id)?.state || 'Inherit' : null,
  effective: effectiveActive(req.orgId, req.projectId, u.id), usage: one(`SELECT COUNT(*) n FROM ai_usage_log WHERE org_id=? AND use_case_id=?`, req.orgId, u.code).n }))));
r.put('/ai/use-cases/:id/activation', requirePerm('ai.manage'), ah(req => {
  const u = one(`SELECT id FROM records WHERE id=? AND entity='AIUseCase' AND org_id=?`, req.params.id, req.orgId); if (!u) throw new HttpError(404, 'err.notFound');
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
  return generate({ orgId: req.orgId, projectId: project_id || null, user: req.user, lang: req.lang, code, input, llm: llmFrom(req) });
}));
r.post('/ai/usage', requirePerm('ai.run'), ah(req => {
  const b = req.body || {}; if (!['Accepted', 'Edited', 'Rejected'].includes(b.outcome)) throw new HttpError(422, 'err.invalidOption', { field: 'outcome', value: b.outcome });
  logUsage({ orgId: req.orgId, projectId: b.project_id, useCaseId: b.use_case, recordRef: b.record_ref, userId: req.user.id, outcome: b.outcome, source: b.source, confidence: b.confidence }); return { ok: true };
}));
r.get('/ai/usage', requirePerm('ai.view'), ah(req => ({
  items: all(`SELECT l.*, u.name user_name FROM ai_usage_log l LEFT JOIN users u ON u.id=l.user_id WHERE l.org_id=? ORDER BY l.created_at DESC LIMIT 500`, req.orgId),
  summary: all(`SELECT outcome, COUNT(*) n FROM ai_usage_log WHERE org_id=? GROUP BY outcome`, req.orgId),
})));
r.get('/ai/models', requirePerm('ai.view'), ah(() => PROVIDERS));
r.post('/ai/test-connection', requirePerm('ai.view'), ah(async req => ({ outcome: await testConnection(req.body || {}) })));

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
