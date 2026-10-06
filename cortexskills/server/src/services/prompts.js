// AI Use Case mapping and Prompt Specifications (FR-DA-AIP-01 – 16) and the Organization live model (FR-DA-AI-16 – 20).
import { all, one, run, tx } from '../db.js';
import { J, S, HttpError, now, uuid, pick } from '../lib/util.js';
import { seal, open, mask } from './secrets.js';
import * as D from './design.js';
import * as cat from '../catalog.js';
import { describeStep } from './stepforms.js';

/** Fields of a Prompt Specification, in the fixed order used to assemble the prompt (FR-DA-AIP-03, -08). */
export const FIELDS = ['role', 'context', 'task', 'inputs', 'knowledge', 'constraints', 'examples', 'outputFormat', 'tone', 'qualityCriteria', 'humanCheckpoint', 'modelParameters'];
export const REQUIRED = ['role', 'context', 'task', 'constraints', 'outputFormat', 'humanCheckpoint'];
const HEAD = { role: 'Role', context: 'Context', task: 'Task', inputs: 'Inputs', knowledge: 'Knowledge', constraints: 'Constraints', examples: 'Examples', outputFormat: 'Output format', tone: 'Tone', qualityCriteria: 'Quality criteria', humanCheckpoint: 'Human checkpoint', modelParameters: 'Model parameters' };

/** Capability profiles: the request parameters each model accepts, whether it reasons first, its maximum output (FR-DA-AI-19). */
export const MODEL_PROFILES = {
  'claude-opus-5-5': { params: ['max_tokens'], reasoning: true, maxOutput: 32000 }, 'claude-sonnet-5-5': { params: ['max_tokens'], reasoning: true, maxOutput: 32000 },
  'claude-haiku-4-5-20251001': { params: ['max_tokens', 'temperature'], reasoning: false, maxOutput: 8192 }, 'gpt-4.1': { params: ['max_tokens', 'temperature', 'top_p'], reasoning: false, maxOutput: 16384 },
  'gpt-4.1-mini': { params: ['max_tokens', 'temperature', 'top_p'], reasoning: false, maxOutput: 16384 }, 'mistral-large-latest': { params: ['max_tokens', 'temperature', 'top_p'], reasoning: false, maxOutput: 8192 },
  'mistral-small-latest': { params: ['max_tokens', 'temperature', 'top_p'], reasoning: false, maxOutput: 8192 }, default: { params: ['max_tokens', 'temperature'], reasoning: false, maxOutput: 4096 },
};
export const profileOf = (model, overrides = {}) => ({ ...(MODEL_PROFILES[model] || MODEL_PROFILES.default), ...(overrides?.[model] || {}) });

/* ------------------------------------------------------------------------------- specification seed */
const L3 = (en, fr, ar) => ({ en, fr, ar });
/** A fully populated specification for the step a use case is linked to (FR-DA-AIP-07). */
export function seedSpec(orgId, uc) {
  const step = D.get(orgId, 'step', uc.step) || cat.get('step', uc.step);
  const mp = step ? D.get(orgId, 'mp', step.mp) : null; const uft = step ? D.list(orgId, 'uft').find(u => (u.steps || []).includes(step.id)) : null;
  const form = step ? describeStep(step, { mpName: mp?.name, inputs: uft?.input }) : null;
  const sn = l => pick(step?.name, l) || pick(uc.name, l); const mpn = l => pick(mp?.name, l) || ''; const role = l => pick(step?.role, l) || 'L&D Analyst';
  const fields = (form?.fields || []).map(f => f.key); const outField = form?.pattern === 'form' ? form.fields[0]?.key : 'rows';
  return {
    role: L3(`You are an assistant to the ${role('en')} of {{org}}, a ${'{{sector}}'} organization, expert in training engineering.`, `Vous êtes l’assistant du ${role('fr')} de {{org}}, organisation du secteur {{sector}}, expert en ingénierie de formation.`, `أنت مساعد ${role('ar')} في {{org}}، مؤسسة في قطاع {{sector}}، خبير في هندسة التكوين.`),
    context: L3(`Process “${mpn('en')}”, step ${step?.id || ''} “${sn('en')}”. Inputs of the step: ${pick(uft?.input, 'en') || '—'}. Output: ${pick(uft?.output, 'en') || '—'}. Applicable clauses: {{clauses}}. Project: {{project}} ({{focus}} focus).`,
      `Processus « ${mpn('fr')} », étape ${step?.id || ''} « ${sn('fr')} ». Entrées : ${pick(uft?.input, 'fr') || '—'}. Sortie : ${pick(uft?.output, 'fr') || '—'}. Clauses applicables : {{clauses}}. Projet : {{project}} (orientation {{focus}}).`,
      `العملية «${mpn('ar')}»، الخطوة ${step?.id || ''} «${sn('ar')}». المدخلات: ${pick(uft?.input, 'ar') || '—'}. المخرج: ${pick(uft?.output, 'ar') || '—'}. البنود المطبقة: {{clauses}}. المشروع: {{project}} (توجه {{focus}}).`),
    task: L3(`${sn('en')}: propose the content of the step from the records already captured, never by repeating the input.`, `${sn('fr')} : proposez le contenu de l’étape à partir des enregistrements déjà saisis, sans répéter l’entrée.`, `${sn('ar')}: اقترح محتوى الخطوة انطلاقاً من السجلات المدخلة، دون تكرار المدخلات.`),
    inputs: L3(`Typed values of the step (${fields.join(', ') || '—'}) and the named project records: {{records}}.`, `Valeurs saisies de l’étape (${fields.join(', ') || '—'}) et enregistrements nommés du projet : {{records}}.`, `القيم المدخلة في الخطوة (${fields.join(', ') || '—'}) وسجلات المشروع المسماة: {{records}}.`),
    knowledge: L3('Organization knowledge base, sector standards and lessons learned (REX), retrieved for this step.', 'Base de connaissances de l’organisation, normes du secteur et retours d’expérience (REX), récupérés pour cette étape.', 'قاعدة معارف المؤسسة ومعايير القطاع والدروس المستفادة، المسترجعة لهذه الخطوة.'),
    constraints: L3('Use only the facts given. Never state a number, score or name absent from them. Write in {{lang}}. Respect the RACSI: the human in charge decides.', 'N’utilisez que les faits fournis. N’énoncez aucun chiffre, note ou nom qui n’y figure pas. Rédigez en {{lang}}. Respectez le RACSI : l’humain responsable décide.', 'استعمل الوقائع المقدمة فقط. لا تذكر رقماً أو نقطة أو اسماً غير وارد فيها. اكتب بلغة {{lang}}. احترم RACSI: الإنسان المسؤول يقرر.'),
    examples: L3('', '', ''),
    outputFormat: L3(`${outField === 'rows' ? 'Rows of the step table, one per item, with the columns' : 'The step fields'}: ${fields.join(', ') || 'text'}. Inserted into the output field “${outField}”.`, `${outField === 'rows' ? 'Lignes du tableau de l’étape, une par élément, avec les colonnes' : 'Les champs de l’étape'} : ${fields.join(', ') || 'texte'}. Insérées dans le champ de sortie « ${outField} ».`, `${outField === 'rows' ? 'صفوف جدول الخطوة، صف لكل عنصر، بالأعمدة' : 'حقول الخطوة'}: ${fields.join(', ') || 'نص'}. تدرج في حقل المخرج «${outField}».`),
    tone: L3('Professional, factual, evidence first, short sentences.', 'Professionnel, factuel, les preuves d’abord, phrases courtes.', 'مهني وواقعي، الأدلة أولاً، جمل قصيرة.'),
    qualityCriteria: L3('Every item traceable to a source record; no duplicate; names start with a verb where they describe an action.', 'Chaque élément est rattaché à un enregistrement source ; aucun doublon ; les noms d’action commencent par un verbe.', 'كل عنصر مرتبط بسجل مصدر؛ لا تكرار؛ أسماء الإجراءات تبدأ بفعل.'),
    humanCheckpoint: uc.checkpoint || L3('The person in charge of the step accepts, edits or rejects each proposal before completion.', 'Le responsable de l’étape accepte, modifie ou rejette chaque proposition avant la clôture.', 'يقبل المسؤول عن الخطوة كل اقتراح أو يعدله أو يرفضه قبل الإتمام.'),
    modelParameters: L3('max_tokens=900; temperature=0.3 where the model accepts it.', 'max_tokens=900 ; temperature=0,3 si le modèle l’accepte.', 'max_tokens=900؛ temperature=0.3 إذا قبلها النموذج.'),
  };
}

/* ------------------------------------------------------------------------------------- read, write */
const keySpec = (o, u) => `${o}|${u}`; const keyField = (o, u, f) => `${o}|${u}|${f}`;
function insertVersion(entity, recordId, orgId, data, userId, note) {
  const v = (one(`SELECT MAX(version) v FROM entity_versions WHERE entity=? AND record_id=?`, entity, recordId)?.v || 0) + 1;
  run(`UPDATE entity_versions SET is_current=0 WHERE entity=? AND record_id=?`, entity, recordId);
  run(`INSERT INTO entity_versions(id,entity,record_id,org_id,version,data,user_id,justification,is_current,created_at) VALUES(?,?,?,?,?,?,?,?,1,?)`, uuid(), entity, recordId, orgId, v, S(data), userId, note || null, now()); return v;
}
export function getSpec(orgId, ucId) {
  const uc = one(`SELECT id, ref, data FROM records WHERE entity='AIUseCase' AND org_id=? AND (id=? OR ref=?)`, orgId, ucId, ucId); if (!uc) throw new HttpError(404, 'err.notFound'); ucId = uc.id;
  let row = one(`SELECT * FROM prompt_specs WHERE org_id=? AND use_case_id=?`, orgId, ucId);
  if (!row) { const fields = seedSpec(orgId, { id: uc.id, ...J(uc.data) }); const fv = Object.fromEntries(FIELDS.map(f => [f, 1]));
    tx(() => { run(`INSERT INTO prompt_specs(org_id,use_case_id,fields,field_versions,version,status,updated_at) VALUES(?,?,?,?,1,'Draft',?)`, orgId, ucId, S(fields), S(fv), now());
      insertVersion('PromptSpec', keySpec(orgId, ucId), orgId, { fields, note: 'Seed' }, null, 'Seed'); for (const f of FIELDS) insertVersion('PromptField', keyField(orgId, ucId, f), orgId, { value: fields[f], note: 'Seed' }, null, 'Seed'); });
    row = one(`SELECT * FROM prompt_specs WHERE org_id=? AND use_case_id=?`, orgId, ucId); }
  const fields = J(row.fields, {}); const missing = REQUIRED.filter(f => !Object.values(fields[f] || {}).some(v => String(v).trim()));
  return { useCase: { ...J(uc.data), id: uc.id, code: J(uc.data).code || J(uc.data).id || uc.ref }, fields, fieldVersions: J(row.field_versions, {}), version: row.version, status: row.status, model: row.model, completeness: Math.round(((FIELDS.length - FIELDS.filter(f => !Object.values(fields[f] || {}).some(v => String(v).trim())).length) / FIELDS.length) * 100), missing, required: REQUIRED, order: FIELDS };
}
/** Each field edited on its own and versioned; the whole specification takes a new version too (FR-DA-AIP-04). */
export function saveField(req, ucId, field, value, note) {
  if (!FIELDS.includes(field)) throw new HttpError(422, 'err.invalidOption', { field: 'field', value: field });
  const spec = getSpec(req.orgId, ucId); ucId = spec.useCase.id; const fields = { ...spec.fields, [field]: typeof value === 'object' ? { ...(spec.fields[field] || {}), ...value } : { ...(spec.fields[field] || {}), [req.lang]: String(value) } };
  const fv = { ...spec.fieldVersions };
  tx(() => { fv[field] = insertVersion('PromptField', keyField(req.orgId, ucId, field), req.orgId, { value: fields[field], note }, req.user.id, note);
    const v = insertVersion('PromptSpec', keySpec(req.orgId, ucId), req.orgId, { fields, note: note || `Edit ${field}` }, req.user.id, note);
    run(`UPDATE prompt_specs SET fields=?, field_versions=?, version=?, updated_by=?, updated_at=? WHERE org_id=? AND use_case_id=?`, S(fields), S(fv), v, req.user.id, now(), req.orgId, ucId);
    run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,after_val,justification,created_at) VALUES(?,?,?,?,?,?,?,?,?)`, uuid(), req.orgId, req.user.id, 'PromptSpec', ucId, 'field:' + field, S(fields[field]), note || null, now()); });
  return getSpec(req.orgId, ucId);
}
export function history(orgId, ucId, field) {
  ucId = one(`SELECT id FROM records WHERE entity='AIUseCase' AND org_id=? AND (id=? OR ref=?)`, orgId, ucId, ucId)?.id || ucId;
  const entity = field ? 'PromptField' : 'PromptSpec'; const rid = field ? keyField(orgId, ucId, field) : keySpec(orgId, ucId);
  return all(`SELECT v.version, v.data, v.justification, v.created_at, u.name author FROM entity_versions v LEFT JOIN users u ON u.id=v.user_id WHERE v.entity=? AND v.record_id=? ORDER BY v.version DESC`, entity, rid).map(v => ({ version: v.version, author: v.author || 'System', date: v.created_at, note: J(v.data, {}).note || v.justification, value: field ? J(v.data, {}).value : J(v.data, {}).fields }));
}
/** Restore one field or the whole specification as the new Current Version (FR-DA-AIP-05). */
export function restoreSpec(req, ucId, version, field) {
  const h = history(req.orgId, ucId, field).find(x => x.version === Number(version)); if (!h) throw new HttpError(404, 'err.notFound');
  if (field) return saveField(req, ucId, field, h.value, `Restore of ${field} v${version}`);
  const spec = getSpec(req.orgId, ucId); let out = spec;
  for (const f of FIELDS) if (JSON.stringify(spec.fields[f]) !== JSON.stringify(h.value[f])) out = saveField(req, ucId, f, h.value[f] || {}, `Restore of specification v${version}`);
  return out;
}
export function setModel(req, ucId, model) { ucId = getSpec(req.orgId, ucId).useCase.id; run(`UPDATE prompt_specs SET model=?, updated_by=?, updated_at=? WHERE org_id=? AND use_case_id=?`, model || null, req.user.id, now(), req.orgId, ucId); return getSpec(req.orgId, ucId); }

/* ----------------------------------------------------------------------------------- assembly */
/** Variables of the current task or step; only typed values and named records, never interface state (FR-DA-AIP-14). */
export function variables(orgId, { projectId, lang, stepId, taskId, values = {} }) {
  const org = one(`SELECT name, sector FROM organizations WHERE id=?`, orgId); const p = projectId ? one(`SELECT name, focus, vertical_id FROM projects WHERE id=? AND org_id=?`, projectId, orgId) : null;
  const vert = cat.list('verticalSeed').find(v => v.id === (p?.vertical_id || org?.sector));
  const records = projectId ? all(`SELECT entity, data FROM records WHERE project_id=? AND entity IN ('TrainingTheme','TrainingNeed','StrategicObjective','SkillGap') LIMIT 12`, projectId).map(r => { const d = J(r.data, {}); return `${r.entity}: ${pick(d.name || d.statement || d.title || d.competency, lang) || ''}`; }).filter(x => !/: $/.test(x)) : [];
  const rows = taskId && stepId ? all(`SELECT r.data FROM step_rows r JOIN step_records s ON s.id=r.step_record_id WHERE s.task_instance_id=? AND s.step_id=? LIMIT 20`, taskId, stepId).map(r => J(r.data, {})) : [];
  return { org: pick(J(org?.name, org?.name), lang), sector: pick(vert?.name, lang) || org?.sector || '', project: pick(J(p?.name, p?.name), lang) || '', focus: p?.focus || '', lang: { en: 'English', fr: 'French', ar: 'Arabic' }[lang] || lang,
    clauses: (vert?.standards || []).join(', ') || '—', records: [...records, ...rows.map(r => Object.values(r).map(v => pick(v, lang)).join(' | '))].join('; ') || '', ...Object.fromEntries(Object.entries(values).map(([k, v]) => ['record.' + k, String(v)])) };
}
/** Assembles the prompt from the fields in the fixed order and resolves every variable; refuses when one has no value. */
export function assemble(spec, vars, lang) {
  const parts = []; const missing = new Set();
  for (const f of FIELDS) {
    const raw = pick(spec.fields[f], lang) || pick(spec.fields[f], 'en'); if (!String(raw || '').trim()) continue;
    const text = raw.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => { const v = vars[k]; if (v == null || v === '') { missing.add(k); return m; } return v; });
    parts.push(`## ${HEAD[f]}\n${text}`);
  }
  return { prompt: parts.join('\n\n'), missing: [...missing] };
}

/* ------------------------------------------------------------------------------ Organization model */
export function getSettings(orgId) {
  const s = one(`SELECT * FROM ai_settings WHERE org_id=?`, orgId);
  return { provider: s?.provider || null, endpoint: s?.endpoint || '', model: s?.model || '', temperature: s?.temperature ?? 0.3, max_tokens: s?.max_tokens ?? 900, enabled: !!s?.enabled, keySet: !!s?.secret, keyHint: s?.secret ? mask(open(s.secret) || '') : null, lastTest: J(s?.last_test, null), profiles: J(s?.profiles, {}) };
}
export function saveSettings(req, b) {
  const cur = one(`SELECT * FROM ai_settings WHERE org_id=?`, req.orgId);
  const providers = ['anthropic', 'openai', 'mistral', 'custom'];
  if (b.provider && !providers.includes(b.provider)) throw new HttpError(422, 'err.invalidOption', { field: 'provider', value: b.provider });
  if (b.provider === 'custom' && b.endpoint && !/^https:\/\//.test(b.endpoint)) throw new HttpError(422, 'err.httpsOnly');
  const t = b.temperature == null ? cur?.temperature ?? 0.3 : Number(b.temperature); if (!(t >= 0 && t <= 2)) throw new HttpError(422, 'err.range', { field: 'temperature', min: 0, max: 2 });
  const mt = b.max_tokens == null ? cur?.max_tokens ?? 900 : Number(b.max_tokens); if (!(mt >= 64 && mt <= 32000)) throw new HttpError(422, 'err.range', { field: 'max_tokens', min: 64, max: 32000 });
  const secret = b.apiKey ? seal(String(b.apiKey)) : cur?.secret || null; // encrypted at rest (NFR-DA-SEC-17)
  run(`INSERT INTO ai_settings(org_id,provider,endpoint,model,temperature,max_tokens,secret,enabled,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(org_id) DO UPDATE SET provider=excluded.provider, endpoint=excluded.endpoint, model=excluded.model, temperature=excluded.temperature, max_tokens=excluded.max_tokens, secret=excluded.secret, enabled=excluded.enabled, updated_by=excluded.updated_by, updated_at=excluded.updated_at`,
    req.orgId, b.provider ?? cur?.provider ?? null, b.endpoint ?? cur?.endpoint ?? '', b.model ?? cur?.model ?? '', t, mt, secret, b.enabled == null ? cur?.enabled ?? 0 : b.enabled ? 1 : 0, req.user.id, now());
  run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,after_val,created_at) VALUES(?,?,?,?,?,?,?,?)`, uuid(), req.orgId, req.user.id, 'AiSettings', req.orgId, 'update', S({ provider: b.provider, model: b.model, enabled: b.enabled, keyChanged: !!b.apiKey }), now());
  return getSettings(req.orgId);
}
/** The live model configuration of an Organization, with its key decrypted for one call. */
export function liveConfig(orgId, model) {
  const s = one(`SELECT * FROM ai_settings WHERE org_id=?`, orgId); if (!s?.enabled || !s.secret || !s.provider) return null;
  return { provider: s.provider, endpoint: s.endpoint, model: model || s.model, temperature: s.temperature, max_tokens: s.max_tokens, apiKey: open(s.secret), profiles: J(s.profiles, {}) };
}
export function recordTest(orgId, outcome, detail) { run(`UPDATE ai_settings SET last_test=? WHERE org_id=?`, S({ outcome, detail: detail || null, at: now() }), orgId); }
