import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api, get, put, session, setUnauthorizedHandler } from './api.js';
import { useI18n } from './i18n.jsx';

const Ctx = createContext(null);
export function SessionProvider({ children }) {
  const { setLang } = useI18n();
  const [me, setMe] = useState(null); const [nav, setNav] = useState(null); const [loading, setLoading] = useState(!!session.token);
  const [projects, setProjects] = useState([]); const [project, setProjectState] = useState(session.project);
  const [toasts, setToasts] = useState([]); const seq = useRef(0);
  const toast = useCallback((text, kind = 'ok') => { const id = ++seq.current; setToasts(t => [...t, { id, text, kind }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 6000); }, []);
  const load = useCallback(async () => {
    if (!session.token) { setLoading(false); return; }
    try {
      const m = await get('/me'); setMe(m); if (!session.lang || session.lang !== m.lang) { setLang(m.lang); }
      if (!session.org && m.org) session.org = m.org.id;
      const [n, ps] = await Promise.all([get('/nav'), get('/context/projects')]); setNav(n); setProjects(ps);
      if (session.project && !ps.some(p => p.id === session.project)) { session.project = null; setProjectState(null); }
    } catch { session.token = null; setMe(null); } finally { setLoading(false); }
  }, [setLang]);
  useEffect(() => { setUnauthorizedHandler(() => { session.token = null; setMe(null); }); load(); }, [load]);
  const login = async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    session.token = r.token; session.org = null; session.project = null; setProjectState(null); session.lang = null; setLoading(true); await load();
  };
  const logout = () => { session.token = null; session.org = null; session.project = null; setMe(null); setNav(null); };
  const switchOrg = async orgId => { session.org = orgId; session.project = null; setProjectState(null); setLoading(true); await load(); };
  const setProject = id => { session.project = id || null; setProjectState(id || null); };
  const savePrefs = async p => { const next = await put('/me/prefs', p); setMe(m => ({ ...m, prefs: next })); return next; };
  const changeLang = async code => { setLang(code); try { await put('/me/language', { language: code }); } catch { /* keep local choice */ } };
  const can = code => !!me?.permissions?.includes(code);
  const entitled = mod => !!me?.config?.modules?.includes(mod);
  return <Ctx.Provider value={{ me, nav, loading, login, logout, reload: load, switchOrg, projects, project, setProject, savePrefs, changeLang, can, entitled, toast, toasts }}>{children}</Ctx.Provider>;
}
export const useSession = () => useContext(Ctx);

/** Data hook: fetches a path and refetches when the organization, project or dependencies change. */
export function useData(path, deps = []) {
  const { project } = useSession(); const [state, setState] = useState({ data: null, error: null, loading: true });
  const reload = useCallback(() => {
    if (!path) { setState({ data: null, error: null, loading: false }); return; }
    setState(s => ({ ...s, loading: true }));
    get(path).then(data => setState({ data, error: null, loading: false })).catch(error => setState({ data: null, error, loading: false }));
  }, [path, project, session.org]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [reload, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload };
}
