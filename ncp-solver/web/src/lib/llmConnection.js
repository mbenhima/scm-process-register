// The optional Real LLM Provider Connection (FR-M6-08): provider, apiKey,
// model, baseUrl. Lives ONLY in the browser's own localStorage, in a key
// namespace distinct from every other piece of app state, so it is never
// swept up by a data export and is unaffected by anything that resets
// server-side data. It is forwarded, at most, once per generation request
// in that request's own body — see server/src/services/aiGeneration.js for
// the one-shot, never-persisted contract on the receiving end.
const STORAGE_KEY = 'ncpSolver.llmProviderConnection.v1';

export function getLlmConnection() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.apiKey ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLlmConnection(connection) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
  } catch {
    // localStorage unavailable (private mode, quota) - fail silently; the
    // feature is optional and every use case still works deterministically.
  }
}

export function clearLlmConnection() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch { /* noop */ }
}
