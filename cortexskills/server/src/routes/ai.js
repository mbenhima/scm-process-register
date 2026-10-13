import { Router } from 'express';
import { ah, projectOf } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { J, HttpError, pick } from '../lib/util.js';
import { requirePerm } from '../rbac.js';
import { audit, versions } from '../audit.js';
import { useCases, effectiveActive, generate, logUsage, PROVIDERS, testConnection } from '../services/ai.js';
import { ask, intentCatalog } from '../services/assistant.js';
import { retrieve } from '../services/retrieval.js';
import { entitledModules } from '../entitlements.js';
import * as cat from '../catalog.js';
import * as P from '../services/prompts.js';
import * as D from '../services/design.js';
import { describeStep } from '../services/stepforms.js';
import { open } from '../services/secrets.js';
import { createRecord, updateRecord, deleteRecord, getRecord } from '../entities.js';
import { checkQuota, quotas, usage as quotaUsage } from '../entitlements.js';
import * as AC from '../services/aicatalog.js';
import { invalidateTenant } from '../services/retrieval.js';

const r = Router();
const specDone = (orgId, ucId) => { const row = one(`SELECT fields FROM prompt_specs WHERE org_id=? AND use_case_id=?`, orgId, ucId); if (!row) return P.getSpec(orgId, ucId).completeness; const f = J(row.fields, {}); return Math.round(P.FIELDS.filter(k => Object.values(f[k] || {}).some(v => String(v).trim())).length / P.FIELDS.length * 100); };
/** The live model configuration travels in one request header and is used for one outbound call only (FR-DA-AI-08). */
const llmFrom = req => { const h = req.headers['x-llm-config']; if (!h) return null; try { return JSON.parse(Buffer.from(String(h), 'base64').toString('utf8')); } catch { return null; } };

r.get('/ai/use-cases', requirePerm('ai.view'), ah(req => useCases(req.orgId).map(u => ({ ...u, active: effectiveActive(req.orgId, null, u.id),
  orgActive: !!(one(`SELECT active FROM ai_activation WHERE org_id=? AND use_case_id=?`, req.orgId, u.id)?.active ?? 1),
  projectState: req.projectId ? one(`SELECT state FROM ai_overrides WHERE project_id=? AND use_case_id=?`, req.projectId, u.id)?.state || 'Inherit' : null,
  effective: effectiveActive(req.orgId, req.projectId, u.id), completeness: specDone(req.orgId, u.id), usage: one(`SELECT COUNT(*) n FROM ai_usage_log WHERE org_id=? AND use_case_id=?`, req.orgId, u.code).n }))));
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
/**
 * The whole AI Use Case on one screen (FR-DA-AI-01, AI-04, AI-07, AIP-01 – 10): identification, the step and task it
 * serves with the inputs it reads and the outputs it proposes, activation, Prompt Specification summary, usage and versions.
 */
r.get('/ai/use-cases/:id/detail', requirePerm('ai.view'), ah(req => {
  const uc = useCases(req.orgId).find(u => u.id === req.params.id || u.code === req.params.id); if (!uc) throw new HttpError(404, 'err.notFound');
  const step = D.get(req.orgId, 'step', uc.step); const mp = step ? D.get(req.orgId, 'mp', step.mp) : null;
  const uft = step ? D.list(req.orgId, 'uft').find(u => (u.steps || []).includes(step.id)) : null;
  const form = step ? describeStep(step, { mpName: mp?.name, inputs: uft?.input }) : null;
  const L3 = (en, fr, ar) => ({ en, fr, ar });
  const stepName = l => (step ? pick(step.name, l) : uc.step);
  const derived = {
    module: uc.module || mp?.module || null,
    trigger: uc.trigger || (step ? L3(`On the step ${step.id} “${stepName('en')}”, when the user runs “Propose with AI”.`, `À l’étape ${step.id} « ${stepName('fr')} », quand l’utilisateur lance « Proposer avec l’IA ».`, `في الخطوة ${step.id} «${stepName('ar')}»، عندما يطلق المستخدم «اقتراح بالذكاء الاصطناعي».`) : null),
    expected_output: uc.expected_output || (form ? L3(`Draft ${form.pattern === 'form' ? 'values' : 'rows'} of “${pick(form.object, 'en')}”: ${form.fields.map(f => pick(f.label, 'en')).join(', ')}.`, `${form.pattern === 'form' ? 'Valeurs' : 'Lignes'} proposées de « ${pick(form.object, 'fr')} » : ${form.fields.map(f => pick(f.label, 'fr')).join(', ')}.`, `${form.pattern === 'form' ? 'قيم' : 'صفوف'} مقترحة لـ«${pick(form.object, 'ar')}»: ${form.fields.map(f => pick(f.label, 'ar')).join('، ')}.`) : null),
  };
  const spec = P.getSpec(req.orgId, uc.id);
  const usage = all(`SELECT l.outcome, l.created_at, l.confidence, l.source, l.record_ref, u.name user_name FROM ai_usage_log l LEFT JOIN users u ON u.id=l.user_id WHERE l.org_id=? AND l.use_case_id=? ORDER BY l.created_at DESC LIMIT 50`, req.orgId, uc.code);
  const outcomes = all(`SELECT outcome, COUNT(*) n FROM ai_usage_log WHERE org_id=? AND use_case_id=? GROUP BY outcome`, req.orgId, uc.code);
  return {
    useCase: { ...uc, ...Object.fromEntries(Object.entries(derived).filter(([k, v]) => v && !uc[k])) }, derived: Object.keys(derived).filter(k => !uc[k] && derived[k]),
    step: step ? { id: step.id, name: step.name, mp: step.mp, mpName: mp?.name || null, kind: form?.kind, pattern: form?.pattern, object: form?.object } : null,
    task: uft ? { id: uft.id, name: uft.name, e2e: uft.e2e || uft.e2eId || null, input: uft.input || null, output: uft.output || null } : null,
    inputs: uft?.input || null, outputs: (form?.fields || []).map(f => ({ key: f.key, label: f.label, type: f.type, required: !!f.required })),
    activation: { orgActive: !!(one(`SELECT active FROM ai_activation WHERE org_id=? AND use_case_id=?`, req.orgId, uc.id)?.active ?? 1), projectState: req.projectId ? one(`SELECT state FROM ai_overrides WHERE project_id=? AND use_case_id=?`, req.projectId, uc.id)?.state || 'Inherit' : null, effective: effectiveActive(req.orgId, req.projectId, uc.id) },
    spec: { version: spec.version, status: spec.status, model: spec.model, completeness: spec.completeness, missing: spec.missing },
    links: (uc.allLinks || []).map(l => ({ ...l, name: D.get(req.orgId, l.type === 'task' ? 'uft' : l.type, l.id)?.name || null, primary: l.type === 'step' && l.id === uc.step })),
    usage, outcomes, versions: versions('AIUseCase', uc.id).map(v => ({ version: v.version, user_name: v.user_name, justification: v.justification, created_at: v.created_at, is_current: v.is_current })),
  };
}));
/* ------------------------------------------------------------------ catalog CRUD (FR-DA-AI-01 – 03, -13, -14) */
/** Process elements a use case can be linked to: steps, tasks, macro processes, end-to-end processes. */
r.get('/ai/targets', requirePerm('ai.view'), ah(req => AC.targets(req.orgId)));
/** Library figures: use cases, active ones, custom ones against the Solution Pack quota, average completeness, coverage. */
r.get('/ai/summary', requirePerm('ai.view'), ah(req => {
  const ucs = useCases(req.orgId); const cov = AC.coverage(req.orgId, ucs, id => effectiveActive(req.orgId, req.projectId, id));
  const comp = ucs.map(u => specDone(req.orgId, u.id));
  return { total: ucs.length, active: ucs.filter(u => effectiveActive(req.orgId, req.projectId, u.id)).length, custom: quotaUsage(req.orgId).aiCustom, quota: quotas(req.orgId).aiCustom ?? null,
    assistive: ucs.filter(u => u.tier === 'Assistive').length, augmented: ucs.filter(u => u.tier === 'Augmented').length,
    completeness: comp.length ? Math.round(comp.reduce((a, b) => a + b, 0) / comp.length) : 0, tasks: cov.length, coveredTasks: cov.filter(x => x.covered).length };
}));
/** Tasks of the process design with the use cases that support them, filterable by tier (FR-DA-AI-13). */
r.get('/ai/coverage', requirePerm('ai.view'), ah(req => {
  const tier = req.query.tier; const ucs = useCases(req.orgId).filter(u => !tier || tier === 'all' || u.tier === tier);
  return AC.coverage(req.orgId, ucs, id => effectiveActive(req.orgId, req.projectId, id));
}));
/** Checks of a use case written by a user: a known primary step, known links, a checkpoint (FR-DA-AI-01, FR-DA-AIP-01). */
function cleanUseCase(req, b, cur = {}) {
  const tg = AC.targets(req.orgId); const known = (type, id) => (tg[type] || []).some(x => x.id === id);
  const out = { ...b }; for (const k of Object.keys(out)) if (k.startsWith('_') && k !== '_justification') delete out[k];
  delete out.id; delete out.isCustom; delete out.allLinks; delete out.steps;
  const step = out.step ?? cur.step; if (!step) throw new HttpError(422, 'err.required', { field: 'step' });
  if (!known('step', step)) throw new HttpError(422, 'err.invalidOption', { field: 'step', value: step });
  if (out.links != null) {
    if (!Array.isArray(out.links)) throw new HttpError(422, 'err.invalidOption', { field: 'links', value: typeof out.links });
    out.links = out.links.slice(0, 50).map(l => ({ type: String(l?.type || ''), id: String(l?.id || '') })).filter(l => l.id && !(l.type === 'step' && l.id === step));
    for (const l of out.links) if (!AC.LINK_TYPES.includes(l.type) || !known(l.type, l.id)) throw new HttpError(422, 'err.invalidOption', { field: 'links', value: `${l.type}:${l.id}` });
  }
  if (out.tier && !['Assistive', 'Augmented'].includes(out.tier)) throw new HttpError(422, 'err.invalidOption', { field: 'tier', value: out.tier }); // never Autonomous
  const der = AC.derive(req.orgId, { ...cur, ...out });
  if (!out.module && !cur.module && der.module) out.module = der.module;
  return out;
}
const nextCode = orgId => { const n = useCases(orgId).map(u => Number(/^AIUC-C(\d+)$/.exec(u.code || '')?.[1] || 0)).reduce((a, b) => Math.max(a, b), 0) + 1; return `AIUC-C${String(n).padStart(2, '0')}`; };
/** Create a custom use case, within the Solution Pack quota; it starts deactivated, as a Draft, until a person activates it. */
r.post('/ai/use-cases', requirePerm('ai.manage'), ah(req => {
  checkQuota(req.orgId, 'aiCustom'); // NFR-DA-SEC-08
  const data = cleanUseCase(req, req.body || {});
  if (!data.checkpoint || !Object.values(typeof data.checkpoint === 'object' ? data.checkpoint : { v: data.checkpoint }).some(v => String(v).trim())) throw new HttpError(422, 'err.required', { field: 'checkpoint' });
  const code = String(data.code || '').trim() || nextCode(req.orgId);
  if (useCases(req.orgId).some(u => u.code === code)) throw new HttpError(409, 'err.duplicate', { field: 'code', value: code });
  const der = AC.derive(req.orgId, data);
  const rec = createRecord(req, 'AIUseCase', { tier: 'Assistive', risk: 'Low', scope: 'Organization', approval: 'Draft', ...data, trigger: data.trigger || der.trigger, expected_output: data.expected_output || der.expected_output, code, isCustom: true, origin: data.based_on ? 'duplicate' : 'manual', links: data.links || [] });
  run(`INSERT INTO ai_activation(org_id,use_case_id,active) VALUES(?,?,0) ON CONFLICT(org_id,use_case_id) DO UPDATE SET active=0`, req.orgId, rec.id);
  P.getSpec(req.orgId, rec.id); // Version 1 of a fully populated Prompt Specification (FR-DA-AI-03, FR-DA-AIP-07)
  invalidateTenant(req.orgId); return rec;
}));
/** Update: every change is a new version with its justification (FR-DA-AI-03); the code of a seeded entry is kept. */
r.put('/ai/use-cases/:id', requirePerm('ai.manage'), ah(req => {
  const cur = getRecord(req, 'AIUseCase', req.params.id); const data = cleanUseCase(req, req.body || {}, cur);
  if (!cur.isCustom) delete data.code; else if (data.code && data.code !== cur.code && useCases(req.orgId).some(u => u.code === data.code)) throw new HttpError(409, 'err.duplicate', { field: 'code', value: data.code });
  const rec = updateRecord(req, 'AIUseCase', req.params.id, { ...data, _justification: req.body?._justification || null }); invalidateTenant(req.orgId); return rec;
}));
/** Duplicate as a custom use case "based on" the source, deactivated until reviewed. */
r.post('/ai/use-cases/:id/duplicate', requirePerm('ai.manage'), ah(req => {
  checkQuota(req.orgId, 'aiCustom'); const src = getRecord(req, 'AIUseCase', req.params.id);
  const { id, ref, version, created_at, updated_at, created_by, updated_by, org_id, project_id, entity, ...data } = src;
  const name = Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, `${pick(src.name, l)} (${l === 'fr' ? 'copie' : l === 'ar' ? 'نسخة' : 'copy'})`]));
  const rec = createRecord(req, 'AIUseCase', { ...data, name, code: nextCode(req.orgId), isCustom: true, based_on: src.code, origin: 'duplicate', approval: 'Draft', scope: 'Organization' });
  run(`INSERT INTO ai_activation(org_id,use_case_id,active) VALUES(?,?,0) ON CONFLICT(org_id,use_case_id) DO UPDATE SET active=0`, req.orgId, rec.id);
  // The copy starts from the source's Prompt Specification (a new Version 1 of its own).
  const sp = P.getSpec(req.orgId, src.id); P.getSpec(req.orgId, rec.id);
  run(`UPDATE prompt_specs SET fields=?, model=? WHERE org_id=? AND use_case_id=?`, JSON.stringify(sp.fields), sp.model || null, req.orgId, rec.id);
  audit(req, 'AIUseCase', rec.id, 'duplicate', null, { from: src.code }); invalidateTenant(req.orgId); return rec;
}));
/** Delete a custom use case, keeping its usage-log entries; a seeded entry is deactivated instead (FR-DA-AI-14). */
r.delete('/ai/use-cases/:id', requirePerm('ai.manage'), ah(req => {
  const cur = getRecord(req, 'AIUseCase', req.params.id);
  if (!cur.isCustom) throw new HttpError(409, 'err.seededUseCase');
  const out = deleteRecord(req, 'AIUseCase', req.params.id);
  run(`DELETE FROM ai_activation WHERE org_id=? AND use_case_id=?`, req.orgId, req.params.id); run(`DELETE FROM ai_overrides WHERE use_case_id=?`, req.params.id);
  invalidateTenant(req.orgId); return out;
}));

/** Suggest an AI Use Case for a step that has none, as a draft with a populated specification, activated only after review (FR-DA-AIP-11). */
r.post('/ai/use-cases/suggest', requirePerm('prompts.manage'), ah(req => {
  const step = D.get(req.orgId, 'step', req.body?.step_id); if (!step) throw new HttpError(404, 'err.notFound');
  if (useCases(req.orgId).some(u => u.steps.includes(step.id))) throw new HttpError(409, 'err.useCaseExists');
  const kind = describeStep(step, {}).kind; const type = { record: 'Extraction', matrix: 'Scoring / ranking', decision: 'Summarization', objectives: 'Text generation', plan: 'Text generation', communication: 'Text generation', training: 'Recommendation', monitoring: 'Forecasting', review: 'Summarization', assignment: 'Matching', configuration: 'Classification' }[kind] || 'Text generation';
  const n = useCases(req.orgId).filter(u => /^AIUC-S/.test(u.code || '')).length + 1; const code = `AIUC-S${String(n).padStart(2, '0')}`;
  const name = Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, (l === 'fr' ? 'Assistance IA — ' : l === 'ar' ? 'مساعدة الذكاء الاصطناعي — ' : 'AI assistance — ') + pick(step.name, l)]));
  const der = AC.derive(req.orgId, { step: step.id });
  const rec = createRecord(req, 'AIUseCase', { code, name, step: step.id, model_task_type: type, risk: 'Low', tier: 'Assistive', approval: 'Draft', scope: 'Organization', isCustom: true, origin: 'ai-suggested', links: [], ...der,
    checkpoint: Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, l === 'fr' ? `Le responsable de l’étape ${step.id} valide chaque proposition avant la clôture.` : l === 'ar' ? `يصادق المسؤول عن الخطوة ${step.id} على كل اقتراح قبل الإتمام.` : `The person in charge of step ${step.id} validates each proposal before completion.`])) });
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
