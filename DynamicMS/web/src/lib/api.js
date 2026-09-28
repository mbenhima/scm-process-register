// Thin API client: bearer token, language, JSON errors, file downloads.
let token = null;
try { token = sessionStorage.getItem('dms.token'); } catch { token = null; }
let lang = 'en';
let onUnauthorized = () => {};

export const setToken = (t) => { token = t; try { t ? sessionStorage.setItem('dms.token', t) : sessionStorage.removeItem('dms.token'); } catch { /* storage blocked */ } };
export const getToken = () => token;
export const setApiLang = (l) => { lang = l; };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(status, code, message, details) { super(message); this.status = status; this.code = code; this.details = details; }
}

export async function api(path, { method = 'GET', body, raw = false, signal } = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`/api${path}${sep}lang=${lang}${raw ? '&raw=1' : ''}`, {
    method, signal,
    headers: { ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });
  if (res.status === 401 && !path.startsWith('/auth/login')) { onUnauthorized(); }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const e = data?.error || {};
    throw new ApiError(res.status, e.code || 'HTTP_' + res.status, e.message || res.statusText, e.details);
  }
  return data;
}

export async function download(path, filename) {
  const sep = path.includes('?') ? '&' : '?';
  const url = /[?&]lang=/.test(path) ? `/api${path}` : `/api${path}${sep}lang=${lang}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { let msg = res.statusText; try { msg = (await res.json()).error.message; } catch { /* binary */ } throw new ApiError(res.status, 'DOWNLOAD_FAILED', msg); }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}
