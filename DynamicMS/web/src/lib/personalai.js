// Personal live-model connection (FR-DA-AI-08, NFR-DA-SEC-07): kept in this browser only and
// forwarded once per generation request; the server never stores, logs or returns it.
const KEY = 'dms.llm.personal';
export function readPersonal() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; }
}
export function writePersonal(v) {
  try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
// The requests that generate an AI suggestion — only they carry the connection.
const GENERATION = /^\/(ai\/suggest|ai\/usecases\/[^/]+\/test|ai\/personal\/test|steps\/[^/]+\/needs-suggest|orgs\/[^/]+\/projects\/draft|assistant\/ask)(\?|$)/;
export function personalHeader(path, method) {
  if (method !== 'POST' || !GENERATION.test(path)) return {};
  const v = readPersonal();
  if (!v?.apiKey || !v.provider || !v.model) return {};
  const json = JSON.stringify({ provider: v.provider, model: v.model, baseUrl: v.baseUrl || '', apiKey: v.apiKey, temperature: v.temperature, maxTokens: v.maxTokens });
  return { 'X-DMS-LLM': btoa(unescape(encodeURIComponent(json))) };
}
