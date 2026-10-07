import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api, get, put, session, setUnauthorizedHandler } from './api.js';
import { useI18n } from './i18n.jsx';

const Ctx = createContext(null);
const PREF_CACHE = 'cs.prefs';
const readCache = () => { try { return JSON.parse(localStorage.getItem(PREF_CACHE) || 'null'); } catch { return null; } };
const writeCache = p => { try { localStorage.setItem(PREF_CACHE, JSON.stringify(p)); } catch { /* storage unavailable */ } };

export function SessionProvider({ children }) {
  const { setLang } = useI18n();
  const [me, setMe] = useState(null); const [nav, setNav] = useState(null); const [loading, setLoading] = useState(!!session.token);
  const [projects, setProjects] = useState([]); const [project, setProjectState] = useState(session.project);
  const [toasts, setToasts] = useState([]); const [expired, setExpired] = useState(false); const seq = useRef(0);
  // Preferences are kept on the server (they follow the user on every device) and cached in the browser for an
  // immediate layout (FR-DA-NAV-06, FR-DA-PNL-06).
  const [prefs, setPrefs] = useState(() => readCache() || {});
  const pending = useRef({}); const flush = useRef(null);

  const dismiss = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);
  // Notifications last 5 s by default; an error stays until dismissed (FR-DA-STA-05). An action (for example Undo) is optional.
  const toast = useCallback((text, kind = 'ok', opts = {}) => { const id = ++seq.current; setToasts(t => [...t.slice(-4), { id, text, kind, action: opts.action }]); if (kind !== 'error' || opts.duration) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts.duration || 5000); return id; }, []);

  const load = useCallback(async () => {
    if (!session.token) { setLoading(false); return; }
    try {
      const m = await get('/me'); setMe(m); setPrefs(m.prefs || {}); writeCache(m.prefs || {});
      // The language the user last chose (sign-in screen or header) wins over the one stored with the profile, and
      // is saved to the profile; the stored one applies only when no choice was made in this browser.
      const chosen = session.lang || m.lang; setLang(chosen); if (chosen !== m.lang) put('/me/language', { language: chosen }).catch(() => { /* kept locally */ });
      if (!session.org && m.org) session.org = m.org.id;
      const [n, ps] = await Promise.all([get('/nav'), get('/context/projects')]); setNav(n); setProjects(ps);
      if (session.project && !ps.some(p => p.id === session.project)) { session.project = null; setProjectState(null); }
    } catch { session.token = null; setMe(null); } finally { setLoading(false); }
  }, [setLang]);
  // An expired session offers "Sign in again" in a dialog instead of dropping the screen (FR-DA-STA-03).
  useEffect(() => { setUnauthorizedHandler(() => { if (session.token) setExpired(true); }); load(); }, [load]);

  const login = useCallback(async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    const keepOrg = expired ? session.org : null; const keepProject = expired ? session.project : null;
    session.token = r.token; session.org = keepOrg; session.project = keepProject; setProjectState(keepProject);
    setExpired(false); setLoading(!me); await load();
  }, [expired, load, me]);
  const logout = useCallback(() => { session.token = null; session.org = null; session.project = null; setExpired(false); setMe(null); setNav(null); }, []);
  const switchOrg = useCallback(async orgId => { session.org = orgId; session.project = null; setProjectState(null); setLoading(true); await load(); }, [load]);
  const setProject = useCallback(id => { session.project = id || null; setProjectState(id || null); }, []);
  const savePrefs = useCallback(async p => { setPrefs(cur => { const n = { ...cur, ...p }; writeCache(n); return n; }); const next = await put('/me/prefs', p); setPrefs(next); writeCache(next); setMe(m => (m ? { ...m, prefs: next } : m)); return next; }, []);
  /** Debounced preference write for frequent changes (panel drag, column resize): applied locally at once, sent after 600 ms. */
  const queuePrefs = useCallback(p => {
    setPrefs(cur => { const n = { ...cur, ...p, tables: p.tables ? { ...(cur.tables || {}), ...p.tables } : cur.tables }; writeCache(n); return n; });
    pending.current = { ...pending.current, ...p, tables: p.tables ? { ...(pending.current.tables || {}), ...p.tables } : pending.current.tables };
    clearTimeout(flush.current);
    flush.current = setTimeout(() => { const body = pending.current; pending.current = {}; put('/me/prefs', body).catch(() => { /* kept locally; retried on next change */ }); }, 600);
  }, []);
  const changeLang = useCallback(async code => { setLang(code); try { await put('/me/language', { language: code }); } catch { /* keep local choice */ } }, [setLang]);
  const permissions = me?.permissions; const modules = me?.config?.modules;
  const can = useCallback(code => !!permissions?.includes(code), [permissions]);
  const entitled = useCallback(mod => !!modules?.includes(mod), [modules]);
  const meWithPrefs = useMemo(() => (me ? { ...me, prefs: { ...(me.prefs || {}), ...prefs } } : me), [me, prefs]);
  // The provider value is memoized so consumers do not re-render on every parent render (C8, NFR-DA-FOC-04).
  const value = useMemo(() => ({ me: meWithPrefs, prefs, nav, loading, login, logout, reload: load, switchOrg, projects, project, setProject, savePrefs, queuePrefs, changeLang, can, entitled, toast, toasts, dismiss, expired }),
    [meWithPrefs, prefs, nav, loading, login, logout, load, switchOrg, projects, project, setProject, savePrefs, queuePrefs, changeLang, can, entitled, toast, toasts, dismiss, expired]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useSession = () => useContext(Ctx);

/**
 * Data hook: fetches a path and refetches when the organization, project or dependencies change. Only the answer to
 * the latest request updates the state; a stale answer is discarded (C19, NFR-DA-FOC-09).
 */
export function useData(path, deps = []) {
  const { project } = useSession(); const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const req = useRef(0);
  const reload = useCallback(() => {
    const id = ++req.current;
    if (!path) { setState({ data: null, error: null, loading: false }); return Promise.resolve(null); }
    setState(s => ({ ...s, loading: true }));
    return get(path).then(data => { if (id === req.current) setState({ data, error: null, loading: false }); return data; })
      .catch(error => { if (id === req.current) setState({ data: null, error, loading: false }); });
  }, [path, project, session.org]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [reload, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  const setData = useCallback(fn => setState(s => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), []);
  return { ...state, reload, setData };
}

/** Online / offline state of the device (FR-DA-STA-06). */
export function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => { const a = () => setOn(true), b = () => setOn(false); window.addEventListener('online', a); window.addEventListener('offline', b); return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); }; }, []);
  return on;
}
