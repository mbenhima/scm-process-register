// Client for journi's backend RAG routes (server/routes/*.js). Uses the
// same relative '/api' base AppStateContext.jsx already uses for
// GET/PUT /api/state — proxied to the backend by Vite in dev
// (vite.config.js) and served from the same origin in production, so no
// separate base-URL configuration is needed.
//
// Every function here resolves even when the backend is unreachable
// (network error, backend not started) rather than throwing, returning
// `{ reachable: false }` instead — callers use that to fall back to
// whatever this feature's next-best option is (a direct LLM call, or the
// built-in canned example), the same layered-fallback pattern
// AiSuggestionBox already used before this backend existed.

async function post(path, body) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { reachable: false }
  }
  let json
  try {
    json = await res.json()
  } catch {
    return { reachable: false }
  }
  return { reachable: true, ok: res.ok, status: res.status, ...json }
}

/** @param {string} question @param {{role:string,scopeType?:string,scopeId?:string}} user @param {object} data @param {object} [llm] */
export function queryData(question, user, data, llm) {
  return post('/query-data', { question, user, data, llm })
}

/** @param {string} question @param {{role:string}} user @param {object} [llm] */
export function queryFeatures(question, user, llm) {
  return post('/query-features', { question, user, llm })
}

/** @param {string} useCaseId @param {string} [recordContext] @param {object} [llm] */
export function aiSuggest(useCaseId, recordContext, llm) {
  return post('/ai-suggest', { useCaseId, recordContext, llm })
}

export async function backendReachable() {
  try {
    const res = await fetch('/api/health')
    return res.ok
  } catch {
    return false
  }
}
