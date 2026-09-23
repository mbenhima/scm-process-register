// API client: bearer token, organization switch header, JSON errors surfaced as Error.message.
const TOKEN_KEY = 'cortexplm.token';
const ORG_KEY = 'cortexplm.org';
const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };

export const session = {
  get token() { return safe(() => localStorage.getItem(TOKEN_KEY)); },
  set token(v) { safe(() => (v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY))); },
  get org() { return safe(() => localStorage.getItem(ORG_KEY)); },
  set org(v) { safe(() => (v ? localStorage.setItem(ORG_KEY, String(v)) : localStorage.removeItem(ORG_KEY))); },
};

export class ApiError extends Error {
  constructor(status, body) { super(body?.error || `Request failed (${status}).`); this.status = status; this.body = body; }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function api(path, { method = 'GET', body, raw = false, form } = {}) {
  const headers = {};
  if (session.token) headers.authorization = `Bearer ${session.token}`;
  if (session.org) headers['x-org-id'] = session.org;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  if (res.status === 401 && !path.startsWith('/auth/login')) onUnauthorized();
  if (raw) { if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({}))); return res; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const get = (p) => api(p);
export const post = (p, body) => api(p, { method: 'POST', body: body ?? {} });
export const put = (p, body) => api(p, { method: 'PUT', body: body ?? {} });
export const del = (p, body) => api(p, { method: 'DELETE', body });

// Authenticated file download (reports, evidence, Gantt PDF): keeps the server's file name.
export async function download(path) {
  const res = await api(path, { raw: true });
  const cd = res.headers.get('content-disposition') || '';
  const name = decodeURIComponent((cd.match(/filename="?([^";]+)"?/) || [])[1] || path.split('/').pop());
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
