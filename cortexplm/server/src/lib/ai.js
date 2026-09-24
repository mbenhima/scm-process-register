// AI Use Case Library service (FR-DA-AI-01..11). This module is the single designated integration point
// for any live LLM call (NFR-DA-MAINT-04). Every use case has a deterministic, explainable generator; a
// live model, if the user configured one on their own device, is used for one request and never stored.
import { translate } from './i18n.js';
import Anthropic from '@anthropic-ai/sdk';
import { q, json } from '../db.js';
import { STEP, MP, STEPS } from './ref.js';
import { search, similarProjects, tokens, searchHelp } from './rag.js';
import { AppError } from './lifecycle.js';
import { effectiveConfig } from './entitlements.js';
import { computeKpis } from './kpis.js';

export function effectiveState(useCase, projectId) {
  if (projectId) {
    const o = q.get('SELECT state FROM ai_project_overrides WHERE project_id = ? AND use_case_id = ?', projectId, useCase.id);
    if (o && o.state !== 'Inherit') return o.state === 'On';
  }
  return !!useCase.active;
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const lines = (arr) => arr.filter(Boolean).join('\n');

function projectContext(orgId, projectId) {
  if (!projectId) return null;
  const p = q.get('SELECT * FROM projects WHERE id = ? AND org_id = ?', projectId, orgId);
  if (!p) throw new AppError(404, 'Project not found.');
  return p;
}

// Deterministic generators: facts come only from the record and the retrieved references.
const GENERATORS = {
  'AIUC-01': ({ orgId, project, text }) => {
    const hits = similarProjects(orgId, text || `${project?.name} ${project?.description}`, project?.id, 5);
    if (!hits.length) return { text: 'No similar ideas found in this organization.', confidence: 0.6, refs: [] };
    return { text: lines(['Possible duplicates or related ideas (similarity score):', ...hits.map((h) => `- ${h.title} (${h.score})`), 'Confirm any merge before acting (human checkpoint).']), confidence: Math.min(0.95, 0.5 + hits[0].score), refs: hits };
  },
  'AIUC-02': ({ project }) => {
    if (!project?.budget || project.npv == null) return { text: 'No business case figures recorded yet. Complete "Build Preliminary Business Case" first.', confidence: 0.3, refs: [] };
    const cf = (project.budget + project.npv) / 5;
    const ramp = [0.45, 0.75, 1, 1.05, 1.05];
    return { text: lines([`Forecast assistant for ${project.name} (recorded investment ${project.budget} kUSD, NPV ${project.npv} kUSD, ROI ${project.roi}%).`, 'Suggested adoption ramp for yearly cash flow (kUSD):', ...ramp.map((r, i) => `- Year ${i + 1}: ${Math.round(cf * r)}`), 'The ramp applies standard adoption factors to the recorded figures. Finance approval is required before use.']), confidence: 0.55, refs: [] };
  },
  'AIUC-12': ({ orgId, project }) => {
    const g = q.get("SELECT * FROM gate_reviews WHERE project_id = ? AND org_id = ? ORDER BY id DESC LIMIT 1", project.id, orgId);
    if (!g) return { text: 'No gate review found for this project.', confidence: 0.3, refs: [] };
    const items = q.all('SELECT * FROM checklist_items WHERE gate_review_id = ?', g.id);
    const mand = items.filter((i) => i.mandatory); const done = mand.filter((i) => ['Complete', 'Waived'].includes(i.status));
    const tasks = q.all("SELECT name, status, due_date FROM run_tasks WHERE run_id = ? AND kind = 'work'", g.run_id);
    const openT = tasks.filter((t) => !['Done', 'Skipped'].includes(t.status));
    const today = new Date().toISOString().slice(0, 10);
    const late = openT.filter((t) => t.due_date < today);
    const score = Math.round(pct(done.length, mand.length) * 0.6 + pct(tasks.length - openT.length, tasks.length) * 0.4 - late.length * 5);
    return { text: lines([`Gate ${g.gate} readiness: ${Math.max(0, score)} / 100 (advisory only; the Gate Review Board decides - CTL-01).`,
      `- Mandatory checklist items complete or waived: ${done.length} of ${mand.length}.`, `- Work tasks closed: ${tasks.length - openT.length} of ${tasks.length}.`,
      late.length ? `- Overdue tasks: ${late.map((t) => t.name).join('; ')}.` : '- No overdue tasks.',
      ...mand.filter((i) => !['Complete', 'Waived'].includes(i.status)).slice(0, 6).map((i) => `- Open: ${i.text}`)]), confidence: 0.8, refs: [] };
  },
  'AIUC-20': ({ orgId, project }) => {
    const outs = q.all("SELECT name, output FROM run_tasks WHERE project_id = ? AND org_id = ? AND status = 'Done' AND output IS NOT NULL ORDER BY completed_at", project.id, orgId);
    if (!outs.length) return { text: 'No completed task outputs to summarize yet.', confidence: 0.3, refs: [] };
    const sentences = outs.flatMap((o) => o.output.split(/(?<=[.!?])\s+/).map((s) => ({ s, task: o.name })));
    const freq = new Map(); for (const x of sentences) for (const t of tokens(x.s)) freq.set(t, (freq.get(t) || 0) + 1);
    const ranked = sentences.map((x) => ({ ...x, w: tokens(x.s).reduce((a, t) => a + freq.get(t), 0) / Math.sqrt(tokens(x.s).length || 1) })).sort((a, b) => b.w - a.w).slice(0, 5);
    return { text: lines([`Summary of ${outs.length} completed task outputs for ${project.name}:`, ...ranked.map((r) => `- ${r.s} (${r.task})`)]), confidence: 0.65, refs: [] };
  },
  'AIUC-10': ({ orgId, text }) => {
    const refs = search(orgId, text || 'root cause recurring defect', { kinds: ['REX'], k: 4 });
    if (!refs.length) return { text: 'No prior lessons learned match this description.', confidence: 0.3, refs: [] };
    return { text: lines(['Candidate root causes from prior lessons learned:', ...refs.map((r) => `- ${r.title}: ${(r.text.match(/Root cause: (.*?) Recommendation/) || [])[1] || r.snippet}`), 'The CAPA owner selects and documents the root cause.']), confidence: 0.6, refs };
  },
};

function genericGenerator({ orgId, useCase, text, project }) {
  const step = STEP[useCase.linked_step];
  const mp = step ? MP[step.Parent_Macro_Process_ID] : null;
  const query = [useCase.name, step?.Step_Name, text, project?.name].filter(Boolean).join(' ');
  const refs = search(orgId, query, { k: 4 });
  const siblings = step ? STEPS.filter((s) => s.Parent_Macro_Process_ID === step.Parent_Macro_Process_ID && s.Task_Name === step.Task_Name) : [];
  return {
    text: lines([`${useCase.name} - suggested working points${project ? ` for ${project.name}` : ''}:`,
      step ? `- Step ${step.Step_ID}: ${step.Step_Name}.` : null, mp ? `- Macro process ${mp.id} ${mp.name} goal: ${mp.goal}` : null,
      ...siblings.filter((s) => s.Step_ID !== step?.Step_ID).slice(0, 3).map((s) => `- Related step ${s.Step_ID}: ${s.Step_Name}.`),
      ...refs.slice(0, 3).map((r) => `- See ${r.kind} ${r.ref}: ${r.title}.`),
      `Human checkpoint: ${useCase.human_checkpoint}`]),
    confidence: refs.length ? Math.min(0.85, 0.4 + refs[0].score) : 0.4, refs,
  };
}

// Models offered in the AI model drop-down; any other model id can be typed as a custom choice.
export const LLM_PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic Claude', endpoint: '' },
  { id: 'custom', label: 'Custom endpoint (Anthropic Messages API compatible)', endpoint: 'required' },
];
export const LLM_MODELS = [
  { id: 'claude-opus-5', label: 'Claude Opus 5 (default)' },
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
  { id: 'claude-fable-5-1', label: 'Claude Fable 5.1 (most capable)' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest)' },
];
const clientFor = (llm, timeout = 60000) => new Anthropic({ apiKey: llm.apiKey, baseURL: llm.endpoint || undefined, maxRetries: 0, timeout });

// Connection test: one short call with the user's key; only the outcome category is returned, never provider details.
export async function testLlm(llm) {
  if (!llm?.apiKey) return { ok: false, reason: 'Enter an API key first.' };
  try {
    await clientFor(llm, 30000).messages.create({ model: llm.model || 'claude-opus-5', max_tokens: 64, messages: [{ role: 'user', content: 'Reply with the word OK.' }] });
    return { ok: true, model: llm.model || 'claude-opus-5' };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return { ok: false, reason: 'Authentication failure: check the API key.' };
    if (e instanceof Anthropic.NotFoundError) return { ok: false, reason: 'Model not found: check the model name.' };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, reason: 'The provider is rate limiting requests; try again later.' };
    if (e instanceof Anthropic.APIConnectionError) return { ok: false, reason: 'Unreachable: check the endpoint and the network.' };
    return { ok: false, reason: `The provider refused the request (${e.status || 'error'}).` };
  }
}

async function liveGenerate(llm, useCase, base, refs, text) {
  // Single outbound call using the user's own key; the key is never persisted, logged or returned.
  const client = clientFor(llm);
  const system = 'You assist users of CortexPLM, a product-service lifecycle application. Use only the vocabulary of the application. State no number, score or name that is not present in the record data or the references provided. Keep the answer under 180 words. A person will review your output.';
  const content = `Use case: ${useCase.name}\nHuman checkpoint: ${useCase.human_checkpoint}\nTemplate: ${useCase.prompt_template || ''}\nUser input: ${text || '(none)'}\nDeterministic draft:\n${base}\nReferences:\n${refs.map((r) => `[${r.ref}] ${r.title}: ${r.snippet}`).join('\n')}`;
  const res = await client.messages.create({ model: llm.model || 'claude-opus-5', max_tokens: 4096, system, messages: [{ role: 'user', content }] });
  if (res.stop_reason === 'refusal') throw new Error('Model declined the request.');
  const out = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  if (!out) throw new Error('Empty model response.');
  return out;
}

export async function generate(ctx, useCaseId, { projectId, recordType, recordId, text, llm } = {}) {
  const uc = q.get('SELECT * FROM ai_use_cases WHERE id = ? AND org_id = ?', useCaseId, ctx.orgId);
  if (!uc) throw new AppError(404, 'AI use case not found.');
  const project = projectContext(ctx.orgId, projectId);
  if (!effectiveState(uc, projectId)) throw new AppError(403, `The AI use case ${uc.code} is deactivated${projectId ? ' for this project' : ''}.`); // FR-DA-AI-05
  const eff = effectiveConfig(ctx.orgId);
  if (uc.tier === 'Augmented' && !eff.augmentedAllowed) throw new AppError(403, 'Augmented AI use cases need an Advanced or Enterprise tier subscription.');
  const gen = GENERATORS[uc.code] && (project || !['AIUC-02', 'AIUC-12', 'AIUC-20'].includes(uc.code)) ? GENERATORS[uc.code] : genericGenerator;
  const base = gen({ orgId: ctx.orgId, useCase: uc, project, text });
  let output = base.text; let source = 'Built-in deterministic engine'; let note = null;
  if (llm?.apiKey) {
    try { output = await liveGenerate(llm, uc, base.text, base.refs, text); source = `Live model (${llm.model || 'claude-opus-5'})`; }
    catch (e) { note = `Live model unavailable, built-in result shown (${e.status || 'error'}).`; } // FR-DA-AI-09 fallback
  }
  const id = q.insert('ai_suggestions', { org_id: ctx.orgId, use_case_id: uc.id, project_id: projectId || null, record_type: recordType || null, record_id: recordId || null, output, refs: base.refs.map(({ kind, ref, title, link, score }) => ({ kind, ref, title, link, score })), source, confidence: base.confidence, user_id: ctx.user.id });
  return { id, useCase: { code: uc.code, name: uc.name, tier: uc.tier, checkpoint: uc.human_checkpoint }, output, refs: base.refs.map(({ kind, ref, title, link, score }) => ({ kind, ref, title, link, score })), source, confidence: base.confidence, note, label: 'AI-generated - requires human review' };
}

export function recordOutcome(ctx, suggestionId, outcome) {
  if (!['Accepted', 'Edited', 'Rejected'].includes(outcome)) throw new AppError(400, 'Outcome must be Accepted, Edited or Rejected.');
  const s = q.get('SELECT s.*, u.code FROM ai_suggestions s JOIN ai_use_cases u ON u.id = s.use_case_id WHERE s.id = ? AND s.org_id = ?', suggestionId, ctx.orgId);
  if (!s) throw new AppError(404, 'Suggestion not found.');
  q.insert('ai_usage_log', { org_id: ctx.orgId, suggestion_id: s.id, use_case_code: s.code, project_id: s.project_id, record_type: s.record_type, record_id: s.record_id, user_id: ctx.user.id, outcome, source: s.source, confidence: s.confidence, created_at: ctx.now || new Date().toISOString() });
  if (outcome !== 'Rejected') q.run('UPDATE ai_suggestions SET approved = 1 WHERE id = ?', s.id);
}

// ------------------------------------------------------------------ AI Assistant (FR-DA-AST-01..06)
// Each intent is bound to exactly one permission, checked after matching and before querying.
const today = () => new Date().toISOString().slice(0, 10);
export const INTENTS = [
  { id: 'active_projects', permission: 'project.view', match: /(how many|number of|count|combien|كم).*(project|projet|مشروع|مشاريع)|active projects|projets actifs|المشاريع النشطة/i,
    run: (o, u, qt, tr) => { const r = q.all("SELECT track, COUNT(*) n FROM projects WHERE org_id = ? AND status = 'Active' GROUP BY track", o); const t = r.reduce((s, x) => s + x.n, 0); return { text: tr('{n} active projects: {list}.', { n: t, list: r.map((x) => `${x.n} ${tr(x.track)}`).join(', ') || tr('none') }), rows: r }; } },
  { id: 'pending_gates', permission: 'gate.view', match: /(pending|waiting|submitted|awaiting|en attente|معلق).*(gate|jalon|decision|بوابة)|gates? (to|waiting)|gate board|jalons? en attente|البوابات المعلقة/i,
    run: (o, u, qt, tr) => { const r = q.all("SELECT p.code, p.name, g.gate, g.submitted_at FROM gate_reviews g JOIN projects p ON p.id = g.project_id WHERE g.org_id = ? AND g.status = 'Submitted' ORDER BY g.submitted_at", o); return { text: r.length ? tr('{n} gate(s) wait for a decision. Oldest: {p} at {g}, submitted {d}.', { n: r.length, p: `${r[0].code} ${r[0].name}`, g: r[0].gate, d: r[0].submitted_at.slice(0, 10) }) : tr('No gate is waiting for a decision.'), rows: r }; } },
  { id: 'my_tasks', permission: 'task.view', match: /\bmy tasks?\b|mes t[aâ]ches|مهامي|assigned to me/i,
    run: (o, u, qt, tr) => { const r = q.all("SELECT t.name, p.code, t.due_date, t.status FROM run_tasks t JOIN projects p ON p.id = t.project_id WHERE t.org_id = ? AND t.owner_id = ? AND t.status IN ('To do','In progress') AND p.status = 'Active' ORDER BY t.due_date LIMIT 10", o, u.id); return { text: r.length ? tr('You have {n} open task(s) shown here. Next due: "{t}" ({p}) on {d}.', { n: r.length, t: tr(r[0].name), p: r[0].code, d: r[0].due_date }) : tr('You have no open tasks.'), rows: r }; } },
  { id: 'overdue_tasks', permission: 'task.view', match: /overdue|late tasks?|en retard|متأخر/i,
    run: (o, u, qt, tr) => { const r = q.all("SELECT t.name, p.code, t.due_date FROM run_tasks t JOIN projects p ON p.id = t.project_id WHERE t.org_id = ? AND t.status IN ('To do','In progress') AND t.due_date < ? AND p.status = 'Active' ORDER BY t.due_date LIMIT 15", o, today()); const n = q.get("SELECT COUNT(*) n FROM run_tasks t JOIN projects p ON p.id = t.project_id WHERE t.org_id = ? AND t.status IN ('To do','In progress') AND t.due_date < ? AND p.status = 'Active'", o, today()).n; return { text: tr('{n} task(s) are overdue.', { n }), rows: r }; } },
  { id: 'top_risks', permission: 'governance.view', match: /(top|highest|biggest|main|principaux|أعلى).*risk|risques?|مخاطر/i,
    run: (o, u, qt, tr) => { const r = q.all("SELECT code, name, likelihood * impact score, status FROM risks WHERE org_id = ? AND status != 'Closed' ORDER BY score DESC LIMIT 5", o); return { text: r.length ? tr('Highest open risk: {r} (score {s} of 25).', { r: `${r[0].code} ${r[0].name}`, s: r[0].score }) : tr('No open risks.'), rows: r }; } },
  { id: 'kpi', permission: 'kpi.view', match: /kpi|indicator|indicateur|مؤشر|time to market|first-pass|checklist compliance|nps|csat/i,
    run: (o, u, question, tr) => { const all = computeKpis(o); const qt = tokens(question); const best = all.map((k) => ({ k, s: tokens(k.name).filter((t) => qt.includes(t)).length })).sort((a, b) => b.s - a.s)[0]; const k = best.s ? best.k : all.find((x) => x.id === 'KPI-38'); return { text: tr('{k}: {v} (target {t}, {s}).', { k: `${k.id} ${tr(k.name)}`, v: k.value != null ? `${k.value} ${k.unit}` : tr('no data yet'), t: k.target, s: tr(k.source) }), rows: [{ id: k.id, name: k.name, value: k.value, target: k.target }] }; } },
  { id: 'unread_alerts', permission: 'alert.view', match: /alert|alerte|تنبيه|notification/i,
    run: (o, u, qt, tr) => { const r = q.all('SELECT a.type, a.severity, a.message FROM alerts a LEFT JOIN alert_reads r ON r.alert_id = a.id AND r.user_id = ? WHERE a.org_id = ? AND r.alert_id IS NULL AND a.resolved_at IS NULL ORDER BY a.id DESC LIMIT 5', u.id, o); const n = q.get('SELECT COUNT(*) n FROM alerts a LEFT JOIN alert_reads r ON r.alert_id = a.id AND r.user_id = ? WHERE a.org_id = ? AND r.alert_id IS NULL AND a.resolved_at IS NULL', u.id, o).n; return { text: tr('You have {n} unread alert(s).', { n }), rows: r }; } },
  { id: 'user_count', permission: 'user.manage', match: /(how many|number of|combien|كم).*(user|utilisateur|مستخدم)/i,
    run: (o, u, qt, tr) => { const n = q.get('SELECT COUNT(*) n FROM users WHERE org_id = ? AND active = 1', o).n; return { text: tr('{n} active user accounts in this organization.', { n }), rows: [] }; } },
  { id: 'projects_by_phase', permission: 'project.view', match: /(phase|stage|étape|مرحلة)|which e2e/i,
    run: (o, u, qt, tr) => { const r = q.all("SELECT current_e2e, COUNT(*) n FROM projects WHERE org_id = ? AND status = 'Active' GROUP BY current_e2e ORDER BY current_e2e", o); return { text: tr('Active projects by current E2E process: {list}.', { list: r.map((x) => `${x.current_e2e}: ${x.n}`).join(', ') }), rows: r }; } },
];

export function assistantAnswer(ctx, question, lang = 'en') {
  const qText = String(question || '').slice(0, 500);
  const helpish = /^(how (do|can|to|does)|can (i|it|we|you)|what is|where (do|can|is)|comment (faire|puis|je)|peut-on|puis-je|كيف|هل يمكن)/i.test(qText.trim());
  const intent = helpish ? null : INTENTS.find((i) => i.match.test(qText));
  if (intent) {
    if (!ctx.perms.has(intent.permission)) {
      return { mode: 'data', intent: intent.id, refused: true, text: translate(lang, 'I cannot answer this: it needs the permission "{p}", which your roles do not include.', { p: intent.permission }) };
    }
    const r = intent.run(ctx.orgId, ctx.user, qText, (k, p) => translate(lang, k, p));
    return { mode: 'data', intent: intent.id, text: r.text, rows: r.rows, label: 'Computed from your organization data' };
  }
  const refs = searchHelp(qText, lang, 3);
  const extra = search(ctx.orgId, qText, { k: 3, kinds: ['Macro process', 'E2E process', 'Gate', 'Track rule', 'Glossary'] });
  if (!refs.length && !extra.length) return { mode: 'help', text: translate(lang, 'I did not find an answer. Try other words, or open Help.'), refs: [] };
  return { mode: 'help', text: refs[0] ? refs[0].text : extra[0].snippet, refs: [...refs, ...extra].map(({ kind, ref, title, link, score }) => ({ kind, ref, title, link, score })) };
}
