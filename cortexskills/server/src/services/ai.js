// AI Use Case generation service: the single designated integration point for a live LLM call (NFR-DA-MAINT-04).
// Every use case has a deterministic, explainable built-in generator and falls back to it on any live failure (FR-DA-AI-09).
import { one, all, run } from '../db.js';
import { J, pick, uuid, now, HttpError } from '../lib/util.js';
import { t } from '../i18n.js';
import { retrieve } from './retrieval.js';
import { aiTier } from '../entitlements.js';

export const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', endpoint: 'https://api.anthropic.com/v1/messages', models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5-20251001'] },
  { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', models: ['gpt-4.1', 'gpt-4.1-mini'] },
  { id: 'mistral', name: 'Mistral AI', endpoint: 'https://api.mistral.ai/v1/chat/completions', models: ['mistral-large-latest', 'mistral-small-latest'] },
  { id: 'custom', name: 'Custom (OpenAI-compatible)', endpoint: '', models: [] },
];

/** Effective activation: Project override (On/Off) when set, otherwise the Organization state (FR-DA-AI-04). */
export function effectiveActive(orgId, projectId, ucId) {
  if (projectId) {
    const o = one(`SELECT state FROM ai_overrides WHERE project_id=? AND use_case_id=?`, projectId, ucId);
    if (o && o.state !== 'Inherit') return o.state === 'On';
  }
  const a = one(`SELECT active FROM ai_activation WHERE org_id=? AND use_case_id=?`, orgId, ucId);
  return a ? !!a.active : true;
}
export function useCases(orgId) {
  return all(`SELECT id, data FROM records WHERE entity='AIUseCase' AND org_id=? ORDER BY json_extract(data,'$.code')`, orgId).map(r => ({ id: r.id, ...J(r.data) }));
}
export function useCaseByCode(orgId, code) { return useCases(orgId).find(u => u.code === code || u.id === code); }

function projectFacts(orgId, projectId, lang) {
  const p = projectId ? one(`SELECT * FROM projects WHERE id=? AND org_id=?`, projectId, orgId) : null;
  const org = one(`SELECT name, sector FROM organizations WHERE id=?`, orgId);
  const vertical = org?.sector ? one(`SELECT data FROM records WHERE entity='Vertical' AND ref=?`, org.sector) : null;
  const facts = { org: pick(org?.name, lang), sector: vertical ? pick(J(vertical.data).name, lang) : '', focus: p?.focus || 'All', project: pick(p?.name, lang) };
  if (p) {
    const q = (e) => all(`SELECT data FROM records WHERE entity=? AND project_id=?`, e, p.id).map(r => J(r.data));
    facts.themes = q('TrainingTheme').sort((a, b) => (a.priority_rank || 99) - (b.priority_rank || 99));
    facts.needs = q('TrainingNeed'); facts.demands = q('TrainingDemand'); facts.gaps = q('SkillGap'); facts.stakeholders = q('Stakeholder');
    facts.responses = q('QuestionnaireResponse'); facts.swot = q('FunctionalSwot'); facts.axes = q('ImprovementAxis'); facts.perf = q('PerformanceAssessment');
    facts.progress = p.progress; facts.tasksDone = one(`SELECT COUNT(*) n FROM task_instances WHERE project_id=? AND status='Completed'`, p.id).n;
    facts.tasksTotal = one(`SELECT COUNT(*) n FROM task_instances WHERE project_id=?`, p.id).n;
  }
  return facts;
}

// Built-in deterministic generators, keyed by model task type. Each returns {text, items, confidence}.
function builtIn(uc, facts, lang, input) {
  const type = (uc.model_task_type || '').toLowerCase();
  const themes = (facts.themes || []).map(x => pick(x.name, lang)).filter(Boolean);
  const T = (k, p) => t('ai.' + k, lang, { ...facts, ...p });
  const top = themes.slice(0, 5);
  if (type.includes('cluster')) {
    const groups = {};
    for (const n of [...(facts.needs || []), ...(facts.demands || [])]) { const g = pick(n.theme || n.family || n.competency_family, lang) || T('otherTheme'); (groups[g] ||= []).push(pick(n.title || n.description || n.name, lang)); }
    const items = Object.entries(groups).slice(0, 8).map(([g, v]) => ({ label: g, detail: T('clusterDetail', { n: v.length }) }));
    return { text: T('clusterIntro', { n: items.length }), items: items.length ? items : top.map(x => ({ label: x })), confidence: 0.74 };
  }
  if (type.includes('scor') || type.includes('rank')) {
    const items = (facts.themes || []).map((x, i) => {
      const s = Math.round(((x.impact_score ?? 3) * 12 + (x.urgency ?? 3) * 8 + (5 - Math.min(5, i)) * 4));
      return { label: pick(x.name, lang), detail: T('scoreDetail', { score: s }), score: s };
    }).sort((a, b) => b.score - a.score);
    return { text: T('scoreIntro', { n: items.length }), items, confidence: 0.7 };
  }
  if (type.includes('forecast') || type.includes('predict')) {
    const items = (facts.gaps || []).slice(0, 6).map(g => ({ label: pick(g.competency || g.name, lang), detail: T('forecastDetail', { gap: g.gap_value ?? 1 }) }));
    return { text: T('forecastIntro'), items: items.length ? items : top.map(x => ({ label: x, detail: T('forecastDetail', { gap: 1 }) })), confidence: 0.62 };
  }
  if (type.includes('anomaly')) {
    const red = (facts.perf || []).filter(p => p.rag_rating === 'Red');
    return { text: T('anomalyIntro', { n: red.length }), items: red.map(p => ({ label: pick(p.function_name || p.level, lang), detail: pick(p.gap_comment, lang) })), confidence: 0.68 };
  }
  if (type.includes('match') || type.includes('recommend')) {
    return { text: T('recommendIntro'), items: top.map((x, i) => ({ label: x, detail: T('recommendDetail', { rank: i + 1 }) })), confidence: 0.66 };
  }
  if (type.includes('classif') || type.includes('sentiment')) {
    return { text: T('classifyIntro'), items: top.map(x => ({ label: x, detail: T('classifyDetail') })), confidence: 0.71 };
  }
  if (type.includes('translat')) {
    return { text: T('translateIntro'), items: [{ label: input?.text || facts.project }], confidence: 0.6 };
  }
  if (type.includes('summar') || type.includes('extraction')) {
    return { text: T('summaryIntro', { done: facts.tasksDone ?? 0, total: facts.tasksTotal ?? 0 }), items: top.map(x => ({ label: x })), confidence: 0.72 };
  }
  // Text generation (with or without RAG): a structured draft built only from the record's own data.
  const sections = [
    { label: T('draftContext'), detail: T('draftContextBody') },
    { label: T('draftEvidence'), detail: T('draftEvidenceBody', { stakeholders: (facts.stakeholders || []).length, responses: (facts.responses || []).length }) },
    { label: T('draftPriorities'), detail: top.join(' · ') || '—' },
    { label: T('draftNext'), detail: T('draftNextBody') },
  ];
  return { text: T('draftIntro'), items: sections, confidence: 0.69 };
}

async function liveCall(llm, prompt) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const endpoint = llm.endpoint || PROVIDERS.find(p => p.id === llm.provider)?.endpoint;
    if (!endpoint) throw new Error('no-endpoint');
    let res, text;
    if (llm.provider === 'anthropic') {
      res = await fetch(endpoint, { method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json', 'x-api-key': llm.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: llm.model, max_tokens: 900, messages: [{ role: 'user', content: prompt }] }) });
      if (!res.ok) throw Object.assign(new Error('http'), { status: res.status });
      text = (await res.json()).content?.map(c => c.text).join('\n');
    } else {
      res = await fetch(endpoint, { method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json', authorization: `Bearer ${llm.apiKey}` },
        body: JSON.stringify({ model: llm.model, messages: [{ role: 'user', content: prompt }], max_tokens: 900 }) });
      if (!res.ok) throw Object.assign(new Error('http'), { status: res.status });
      text = (await res.json()).choices?.[0]?.message?.content;
    }
    if (!text) throw new Error('empty');
    return text;
  } finally { clearTimeout(timer); }
}
/** Connection test reporting only the outcome category (FR-DA-AI-15). */
export async function testConnection(llm) {
  try { await liveCall(llm, 'Reply with OK.'); return 'works'; }
  catch (e) {
    if (e.status === 401 || e.status === 403) return 'authFailure';
    if (e.status === 404) return 'modelNotFound';
    if (e.status === 429) return 'rateLimited';
    return 'unreachable';
  }
}

/** Generate a suggestion. `llm` comes from the request header only; it is never stored, logged or returned. */
export async function generate({ orgId, projectId, user, lang, code, input = {}, llm }) {
  const uc = useCaseByCode(orgId, code);
  if (!uc) throw new HttpError(404, 'err.notFound');
  if (!effectiveActive(orgId, projectId, uc.id)) throw new HttpError(403, 'err.aiInactive', { useCase: uc.code });
  if (uc.tier === 'Augmented' && aiTier(orgId) !== 'Assistive+Augmented') throw new HttpError(403, 'err.notEntitled', { feature: 'Augmented AI' });
  const facts = projectFacts(orgId, projectId, lang);
  const query = [pick(uc.name, lang), input.query || '', facts.sector, facts.focus].join(' ');
  const refs = retrieve(orgId, query, { lang, k: 4 }).map(r => ({ source: r.source, title: r.title, score: r.score, route: r.route }));
  const base = builtIn(uc, facts, lang, input);
  let result = { ...base, source: 'built-in' };
  if (llm?.apiKey && llm?.model) {
    const prompt = [
      `You assist a Training Engineering application. Task: ${pick(uc.name, 'en')}. Answer in language "${lang}".`,
      'Use only the facts and references below. Do not state any number, score or name that is not present in them.',
      'Stay within the vocabulary of training engineering (needs analysis, themes, roadmap, RACSI, KPIs).',
      `Facts: ${JSON.stringify({ org: facts.org, sector: facts.sector, focus: facts.focus, themes: (facts.themes || []).map(x => pick(x.name, lang)).slice(0, 8) })}`,
      `References: ${refs.map(r => r.title).join(' | ')}`,
      `Draft to improve: ${base.text} ${base.items.map(i => i.label + ': ' + (i.detail || '')).join('; ')}`,
    ].join('\n');
    try { const text = await liveCall(llm, prompt); result = { text, items: [], confidence: 0.8, source: 'live:' + llm.model }; }
    catch { result.fallback = true; }
  }
  return { useCase: { id: uc.id, code: uc.code, name: uc.name, tier: uc.tier, checkpoint: uc.checkpoint }, ...result, references: refs, generatedAt: now(), label: t('ai.label', lang) };
}

/** Append-only AI Usage Log (FR-DA-AI-07): no edit or delete route exists. */
export function logUsage({ orgId, projectId, useCaseId, recordRef, userId, outcome, source, confidence, question }) {
  run(`INSERT INTO ai_usage_log(id,org_id,project_id,use_case_id,record_ref,user_id,outcome,source,confidence,question,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    uuid(), orgId, projectId || null, useCaseId, recordRef || null, userId, outcome, source || 'built-in', confidence ?? null, question || null, now());
}
