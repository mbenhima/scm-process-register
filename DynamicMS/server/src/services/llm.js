// Large language model providers for the AI use cases. Each organization chooses a standard
// provider (Anthropic, OpenAI, Azure OpenAI, Google, Mistral) and model, or a custom
// OpenAI-compatible endpoint. API keys are encrypted at rest (AES-256-GCM) and never sent
// back to the browser. Without a configured provider, the built-in engine answers.
import crypto from 'node:crypto';
import { get, run, J, P } from '../db.js';
import { config } from '../config.js';

export const PROVIDERS = [
  { id: 'builtin', name: 'DynamicMS built-in engine', kind: 'builtin', models: [{ id: 'rules-retrieval', name: 'Rules + retrieval (no external call)' }] },
  { id: 'anthropic', name: 'Anthropic (Claude)', kind: 'anthropic', baseUrl: 'https://api.anthropic.com', models: [
    { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', temperature: false }, { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', temperature: false }, { id: 'claude-fable-5-1', name: 'Claude Fable 5.1', temperature: false }, { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' }] },
  { id: 'openai', name: 'OpenAI', kind: 'openai', baseUrl: 'https://api.openai.com/v1', models: [
    { id: 'gpt-5', name: 'GPT-5', temperature: false }, { id: 'gpt-5-mini', name: 'GPT-5 mini', temperature: false }, { id: 'gpt-4.1', name: 'GPT-4.1' }] },
  { id: 'azure', name: 'Azure OpenAI', kind: 'azure', baseUrl: '', models: [{ id: 'deployment', name: 'Your deployment name' }], needsBaseUrl: true },
  { id: 'google', name: 'Google (Gemini)', kind: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' }, { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }] },
  { id: 'mistral', name: 'Mistral AI', kind: 'openai', baseUrl: 'https://api.mistral.ai/v1', models: [
    { id: 'mistral-large-latest', name: 'Mistral Large' }, { id: 'mistral-small-latest', name: 'Mistral Small' }] },
  { id: 'custom', name: 'Custom LLM (OpenAI-compatible API)', kind: 'openai', baseUrl: '', models: [], needsBaseUrl: true, customModel: true },
];
const byId = Object.fromEntries(PROVIDERS.map(p => [p.id, p]));

// Reasoning models fix their own sampling: recent Claude models (Opus 4.7 and later, Sonnet 5 and
// later, Fable, Mythos) return 400 on `temperature`, and OpenAI GPT-5 and o-series accept only the
// default. Earlier Claude models (3.x, Haiku 4.5, Opus/Sonnet 4.0–4.6) and other providers keep it.
export function acceptsTemperature(kind, model) {
  const m = String(model || '').toLowerCase();
  if (kind === 'anthropic') return /^claude-(3|haiku-4-5)/.test(m) || /^claude-(opus|sonnet)-4(-[0-6](-|$)|-\d{8}|$)/.test(m);
  if (kind === 'openai' || kind === 'azure') return !/^(gpt-5|o\d)/.test(m);
  return true;
}

const key32 = () => crypto.createHash('sha256').update(`llm:${config.jwtSecret}`).digest();
export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key32(), iv);
  const enc = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return `v1:${iv.toString('base64')}:${c.getAuthTag().toString('base64')}:${enc.toString('base64')}`;
}
export function decrypt(blob) {
  if (!blob) return null;
  try {
    const [, iv, tag, data] = blob.split(':');
    const d = crypto.createDecipheriv('aes-256-gcm', key32(), Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8');
  } catch { return null; }
}

// Stored per organization in settings(key='llm'): { enabled, provider, model, baseUrl, apiKeyEnc, temperature, maxTokens, dataResidency }
export function llmConfig(orgId) {
  const s = P(get('SELECT value FROM settings WHERE org_id=? AND key=?', orgId, 'llm')?.value) || {};
  return { enabled: !!s.enabled, provider: s.provider || 'builtin', model: s.model || 'rules-retrieval', baseUrl: s.baseUrl || '', temperature: s.temperature ?? 0.2, maxTokens: s.maxTokens || 800, apiKeyEnc: s.apiKeyEnc || null, apiVersion: s.apiVersion || '2024-10-21', updatedAt: s.updatedAt || null };
}
export function publicConfig(orgId) {
  const c = llmConfig(orgId);
  const k = decrypt(c.apiKeyEnc);
  return { ...c, apiKeyEnc: undefined, hasKey: !!k, keyHint: k ? `••••${k.slice(-4)}` : null };
}
export function saveConfig(orgId, b, prev) {
  const p = byId[b.provider || prev.provider];
  if (!p) throw Object.assign(new Error('Unknown provider.'), { code: 'BAD_PROVIDER' });
  const model = String(b.model ?? prev.model ?? '').trim();
  if (p.kind !== 'builtin' && !model) throw Object.assign(new Error('Choose a model.'), { code: 'MODEL_REQUIRED' });
  if (!p.customModel && p.kind !== 'azure' && p.models.length && !p.models.some(m => m.id === model)) throw Object.assign(new Error('This model is not offered by the provider.'), { code: 'BAD_MODEL' });
  const baseUrl = String(b.baseUrl ?? prev.baseUrl ?? '').trim();
  if (p.needsBaseUrl && !/^https:\/\/[\w.-]+(:\d+)?(\/[\w./-]*)?$/.test(baseUrl)) throw Object.assign(new Error('Give the HTTPS endpoint URL of the service.'), { code: 'BAD_URL' });
  const next = {
    enabled: b.enabled ?? prev.enabled, provider: p.id, model: p.kind === 'builtin' ? 'rules-retrieval' : model, baseUrl: p.needsBaseUrl ? baseUrl : '',
    temperature: Math.min(1, Math.max(0, +(b.temperature ?? prev.temperature ?? 0.2))), maxTokens: Math.min(4000, Math.max(100, +(b.maxTokens ?? prev.maxTokens ?? 800))),
    apiVersion: b.apiVersion || prev.apiVersion, apiKeyEnc: b.apiKey ? encrypt(b.apiKey) : (b.clearKey ? null : prev.apiKeyEnc), updatedAt: new Date().toISOString(),
  };
  if (next.enabled && p.kind !== 'builtin' && !next.apiKeyEnc) throw Object.assign(new Error('An API key is required to enable this provider.'), { code: 'KEY_REQUIRED' });
  run(`INSERT INTO settings(org_id,key,value) VALUES(?,?,?) ON CONFLICT(org_id,key) DO UPDATE SET value=excluded.value`, orgId, 'llm', J(next));
  return next;
}

// Calls the configured provider. Returns { text, provider, model } or throws.
export async function complete(orgId, { system, user, model: override }, fetchImpl = fetch) {
  const c = llmConfig(orgId);
  const p = byId[c.provider];
  if (!c.enabled || !p || p.kind === 'builtin') return null;
  const key = decrypt(c.apiKeyEnc);
  if (!key) throw new Error('API key missing or unreadable.');
  const model = override || c.model;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60000);
  const sampling = acceptsTemperature(p.kind, model);
  try {
    let res; let text;
    if (p.kind === 'anthropic') {
      res = await fetchImpl(`${p.baseUrl}/v1/messages`, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        // Models without sampling controls think by default; thinking tokens count toward max_tokens, so
        // leave room for it and keep the effort low for these short suggestions.
        body: JSON.stringify({ model, system, messages: [{ role: 'user', content: user }],
          ...(sampling ? { max_tokens: c.maxTokens, temperature: c.temperature } : { max_tokens: Math.max(c.maxTokens, 16000), output_config: { effort: 'low' } }) }) });
      const j = await res.json();
      if (!res.ok) throw new Error(res.status === 401 ? 'The API key was refused by Anthropic (401).' : j?.error?.message || `HTTP ${res.status}`);
      if (j.stop_reason === 'refusal') throw new Error('The model declined this request (refusal).');
      text = (j.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n');
    } else if (p.kind === 'google') {
      res = await fetchImpl(`${p.baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { temperature: c.temperature, maxOutputTokens: c.maxTokens } }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error?.message || `HTTP ${res.status}`);
      text = (j.candidates?.[0]?.content?.parts || []).map(x => x.text).join('\n');
    } else {
      const url = p.kind === 'azure' ? `${c.baseUrl.replace(/\/$/, '')}/openai/deployments/${encodeURIComponent(model)}/chat/completions?api-version=${c.apiVersion}` : `${(p.baseUrl || c.baseUrl).replace(/\/$/, '')}/chat/completions`;
      const headers = { 'content-type': 'application/json', ...(p.kind === 'azure' ? { 'api-key': key } : { authorization: `Bearer ${key}` }) };
      res = await fetchImpl(url, { method: 'POST', signal: ctl.signal, headers, body: JSON.stringify({ ...(p.kind === 'azure' ? {} : { model }), ...(sampling ? { temperature: c.temperature, max_tokens: c.maxTokens } : { max_completion_tokens: Math.max(c.maxTokens, 16000) }), messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error?.message || `HTTP ${res.status}`);
      text = j.choices?.[0]?.message?.content || '';
    }
    return { text: String(text || '').trim(), provider: p.id, model };
  } finally { clearTimeout(timer); }
}

// Splits a model answer into the suggestion items shown to the user.
export function toItems(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = [];
  for (const l of lines) {
    const m = l.match(/^(?:\d+[.)]|[-*•])\s+(.*)$/);
    if (m) items.push(m[1]); else if (items.length) items[items.length - 1] += ` ${l}`; else items.push(l);
  }
  return items.slice(0, 12);
}
