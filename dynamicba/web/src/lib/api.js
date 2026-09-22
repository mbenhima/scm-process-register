// src/lib/api.js
// Thin fetch wrapper for the DynamicBA API server. In development, Vite proxies /api to
// the server (see vite.config.js), so no environment variable needs to be set at all —
// `npm install && npm run dev` in both server/ and web/ is enough. For a production
// deployment where the built web/ bundle is hosted separately from the API, set
// VITE_API_URL to the API's full base URL (e.g. https://api.example.com/api).
const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'dba_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(method, path, body) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) throw new Error(data?.error || `Request failed (HTTP ${res.status})`)
  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
  getToken,
  setToken,
}
