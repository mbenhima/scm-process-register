// The generation service of the AI Use Case Library (NFR-DA-MAINT-04): the single place that
// produces an AI suggestion. Every module calls it with the AI Use Case serving its place
// (FR-DA-AI-23); it checks the effective activation on the server (FR-DA-AI-05), resolves the
// model in the documented order (FR-DA-AI-24), falls back to the built-in engine on any
// failure (FR-DA-AI-09) and writes the Proposed entry of the append-only usage log with the
// specification version, the engine and the model (FR-DA-AI-07, FR-DA-AIP-10).
import { get, run, uid, now } from '../db.js';
import { HttpError } from '../http.js';
import { assertFeature } from '../auth.js';
import { orgConnection, personalConnection, callModel } from './llm.js';
import { effectiveActive, entitled, servingUseCases, specVersion } from './aiusecases.js';

const MSG = {
  none: { en: 'No language model is enabled for this organization (Administration › AI models) and no personal connection is set (Settings › Personal AI connection), so the built-in engine answered.', fr: 'Aucun modèle de langage n\'est activé pour cet organisme (Administration › Modèles d\'IA) et aucune connexion personnelle n\'est définie (Paramètres › Connexion IA personnelle) : le moteur intégré a répondu.', ar: 'لا يوجد نموذج لغة مفعّل لهذه المؤسسة (الإدارة › نماذج الذكاء الاصطناعي) ولا اتصال شخصي معرّف (الإعدادات › اتصال الذكاء الاصطناعي الشخصي)، لذلك أجاب المحرك المدمج.' },
  error: { en: 'The language model returned an error ({e}); the built-in engine answered instead.', fr: 'Le modèle de langage a renvoyé une erreur ({e}) ; le moteur intégré a répondu à sa place.', ar: 'أعاد نموذج اللغة خطأ ({e})؛ وأجاب المحرك المدمج بدلًا منه.' },
  unread: { en: 'The language model answer could not be read; the built-in engine answered instead.', fr: 'La réponse du modèle de langage n\'a pas pu être lue ; le moteur intégré a répondu à sa place.', ar: 'تعذّرت قراءة إجابة نموذج اللغة؛ وأجاب المحرك المدمج بدلًا منه.' },
};
const say = (k, lang, vars = {}) => (MSG[k][lang] || MSG[k].en).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '');

/** The personal connection forwarded by the browser for this request only (header X-DMS-LLM, base64 JSON). */
export function requestConnection(req) {
  const h = req.get?.('x-dms-llm');
  if (!h) return null;
  try { return personalConnection(JSON.parse(Buffer.from(String(h), 'base64').toString('utf8'))); } catch { return null; }
}

/**
 * Model precedence (FR-DA-AI-24), the same for every AI feature:
 * 1. the model chosen for the AI Use Case (FR-DA-AI-17), on the Organization connection;
 * 2. the Organization-level live model (FR-DA-AI-16);
 * 3. the user's personal connection (FR-DA-AI-08);
 * 4. the built-in engine (FR-DA-AI-09).
 */
export function resolveModel(orgId, usecase, personal) {
  const org = orgConnection(orgId);
  if (org && usecase?.model) return { rank: 'usecase', conn: org, model: usecase.model };
  if (org) return { rank: 'organization', conn: org, model: org.model };
  if (personal) return { rank: 'personal', conn: personal, model: personal.model };
  return { rank: 'builtin', conn: null, model: 'rules-retrieval' };
}

/** The active use case serving a place, or a 409 telling that the place offers no AI action. */
export function requireServing(orgId, projectId, target) {
  const u = servingUseCases(orgId, projectId, target)[0];
  if (!u) throw new HttpError(409, 'NO_AI_USECASE', 'No active AI use case serves this place, so it offers no AI action.');
  return u;
}

export function assertRunnable(u, projectId) {
  if (!effectiveActive(u, projectId)) throw new HttpError(400, 'USECASE_INACTIVE', 'This AI use case is not active for the project.');
  if (!entitled(u.org_id, u.tier)) throw new HttpError(402, 'FEATURE_NOT_LICENSED', 'Augmented AI is not included in the Solution Pack.');
  if (u.tier === 'Augmented') assertFeature(u.org_id, 'ai_augmented');
}

/**
 * Produces one suggestion.
 * builtin(): { ...out, confidence, sources }   parse(text): { ...out } | null   count(out): number of items
 */
export async function generate(req, { usecase, projectId = null, recordType = null, recordId = null, prompt, builtin, parse, count, fetchImpl, skipActivation = false, live = true }) {
  // A test run of the use case page checks the specification, not the activation (a Draft can be tried before review).
  if (!skipActivation) assertRunnable(usecase, projectId);
  const lang = req.lang || 'en';
  const m = resolveModel(usecase.org_id, usecase, requestConnection(req));
  let out = null; let engine = 'rules+retrieval'; let model = 'rules-retrieval'; let warning = null; let llmError = null;
  if (m.conn && live) {
    try {
      const r = await callModel(m.conn, { system: prompt.system, user: prompt.user, model: m.model }, fetchImpl);
      const parsed = r?.text ? parse(r.text) : null;
      if (parsed) { out = { confidence: 0.8, ...parsed }; engine = `llm:${r.provider}:${r.model}`; model = r.model; }
      else { warning = say('unread', lang); llmError = 'unreadable'; }
    } catch (e) { llmError = String(e.message || e).slice(0, 300); warning = say('error', lang, { e: llmError }); }
  } else if (!m.conn) warning = say('none', lang);
  if (!out) out = await builtin();
  const id = uid();
  const items = count ? count(out) : (out.items || out.rows || []).length || 1;
  run('INSERT INTO ai_usage_log(id,org_id,project_id,usecase_id,record_type,record_id,user_id,outcome,confidence,source,created_at,spec_version,engine,model,items) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    id, usecase.org_id, projectId, usecase.id, recordType, recordId, req.user.id, 'Proposed', out.confidence ?? null, engine, now(), specVersion(usecase.id), engine.startsWith('llm:') ? 'live' : 'builtin', model, items);
  return {
    ...out, logId: id, engine, model, modelSource: engine.startsWith('llm:') ? m.rank : 'builtin', warning, error: llmError,
    prompt: { system: prompt.system, user: prompt.user, spec: prompt.spec },
    usecase: { id: usecase.id, code: usecase.code, name: safeJson(usecase.name), checkpoint: safeJson(usecase.checkpoint), tier: usecase.tier },
  };
}

/** Records the outcome of one item, or of the whole suggestion, as a new log entry (append-only). */
export function recordOutcome(req, logId, { item = null, outcome }) {
  const l = get('SELECT * FROM ai_usage_log WHERE id=?', logId);
  if (!l || (req.user.org_id && l.org_id !== req.user.org_id && !req.user.is_platform_admin)) throw new HttpError(404, 'NOT_FOUND', 'AI log not found.');
  if (l.parent_id) throw new HttpError(400, 'NOT_A_PROPOSAL', 'Record the outcome against the proposal.');
  if (!['Accepted', 'Edited', 'Rejected'].includes(outcome)) throw new HttpError(400, 'BAD_OUTCOME', 'Outcome must be Accepted, Edited or Rejected.');
  if (l.user_id !== req.user.id) throw new HttpError(400, 'NOT_YOURS', 'Only the requester records the outcome.');
  const n = item === null || item === undefined ? null : Math.max(0, Math.floor(+item));
  if (n !== null && l.items && n >= l.items) throw new HttpError(400, 'BAD_ITEM', 'This item is not part of the proposal.');
  if (get('SELECT 1 FROM ai_usage_log WHERE parent_id=? AND COALESCE(item,-1)=?', l.id, n ?? -1)) throw new HttpError(409, 'ALREADY_DECIDED', 'The outcome of this item is already recorded.');
  const id = uid();
  run('INSERT INTO ai_usage_log(id,org_id,project_id,usecase_id,record_type,record_id,user_id,outcome,confidence,source,created_at,parent_id,item,spec_version,engine,model,items) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    id, l.org_id, l.project_id, l.usecase_id, l.record_type, l.record_id, req.user.id, outcome, l.confidence, l.source, now(), l.id, n, l.spec_version, l.engine, l.model, null);
  return { id, parent: l };
}

function safeJson(v) { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } }
