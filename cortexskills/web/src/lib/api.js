// Thin API client. The session token and the chosen organization/project travel as headers.
// A live AI model configuration (if the user added one) is kept in this browser only and sent per request.
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};
export const session = {
  get token() { return store.get('cs.token'); }, set token(v) { store.set('cs.token', v); },
  get org() { return store.get('cs.org'); }, set org(v) { store.set('cs.org', v); },
  get project() { return store.get('cs.project'); }, set project(v) { store.set('cs.project', v); },
  get lang() { return store.get('cs.lang'); }, set lang(v) { store.set('cs.lang', v); },
  get llm() { try { return JSON.parse(store.get('cs.llm') || 'null'); } catch { return null; } }, set llm(v) { store.set('cs.llm', v ? JSON.stringify(v) : null); },
};
let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

export class ApiError extends Error { constructor(status, body) { super(body?.message || 'Error'); this.status = status; this.code = body?.error; this.params = body?.params; } }

function headers(extra = {}, withLlm = false) {
  const h = { ...extra };
  if (session.token) h.Authorization = `Bearer ${session.token}`;
  if (session.org) h['X-Org-Id'] = session.org;
  if (session.project) h['X-Project-Id'] = session.project;
  if (session.lang) h['Accept-Language'] = session.lang;
  if (withLlm && session.llm?.apiKey) h['X-LLM-Config'] = btoa(unescape(encodeURIComponent(JSON.stringify(session.llm))));
  return h;
}
export async function api(path, { method = 'GET', body, llm = false, raw = false } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch('/api' + path, { method, headers: headers(isForm || body === undefined ? {} : { 'Content-Type': 'application/json' }, llm), body: isForm ? body : body === undefined ? undefined : JSON.stringify(body) });
  if (raw) { if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({}))); return res; }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/auth')) onUnauthorized();
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
export const get = p => api(p);
export const post = (p, body, o) => api(p, { method: 'POST', body, ...o });
export const put = (p, body) => api(p, { method: 'PUT', body });
export const patch = (p, body) => api(p, { method: 'PATCH', body });
export const del = (p, body) => api(p, { method: 'DELETE', body });

/** Download a server-generated file (report export) with the session headers. */
export async function download(path, fallbackName) {
  const res = await api(path, { raw: true });
  const cd = res.headers.get('Content-Disposition') || '';
  const name = decodeURIComponent((cd.match(/filename="?([^"]+)"?/) || [])[1] || fallbackName);
  const blob = await res.blob(); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** CSV of exactly the rows and columns on screen, UTF-8 with BOM so accents and Arabic open correctly (FR-DA-REP-04). */
export function downloadCsv(name, columns, rows) {
  const esc = v => { const s = v == null ? '' : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const text = '﻿' + [columns.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
