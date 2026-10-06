// Application state: session, language (with RTL), current organization/project,
// server-side user preferences, toasts and shared reference data.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, setApiLang, setToken, getToken, setUnauthorizedHandler } from './api.js';
import { DICT } from './dict.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const LOCALES = { en: 'en-GB', fr: 'fr-FR', ar: 'ar-MA' };

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => { try { return localStorage.getItem('dms.lang') || 'en'; } catch { return 'en'; } });
  const [me, setMe] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [tree, setTree] = useState(null);
  const [projectId, setProjectIdState] = useState(null);
  const [labels, setLabels] = useState({});
  const [toasts, setToasts] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const tid = useRef(0);

  setApiLang(lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('dms.lang', lang); } catch { /* storage blocked */ }
  }, [lang]);

  const t = useCallback((s, vars) => {
    let out = (lang !== 'en' && DICT[s]?.[lang]) || s;
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(v);
    return out;
  }, [lang]);
  const L = useCallback((code) => (code === null || code === undefined ? '' : labels[code] ?? code), [labels]);
  const fmtDate = useCallback((d) => (d ? new Date(d.length === 10 ? d + 'T12:00:00Z' : d).toLocaleDateString(LOCALES[lang], { year: 'numeric', month: 'short', day: 'numeric' }) : '—'), [lang]);
  const fmtNum = useCallback((n, digits = 1) => (n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString(LOCALES[lang], { maximumFractionDigits: digits })), [lang]);

  // Toasts (graphical chart §8.11): 5 s by default, errors stay until dismissed; an optional
  // action (e.g. Undo) runs before the toast closes.
  const dismissToast = useCallback((id) => setToasts(ts => ts.filter(x => x.id !== id)), []);
  const toast = useCallback((message, kind = 'ok', action = null) => {
    const id = ++tid.current;
    setToasts(ts => [...ts, { id, message, kind, action }]);
    if (kind !== 'error') setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 5000);
    return id;
  }, []);

  const logout = useCallback(() => { setToken(null); setMe(null); setTree(null); setProjectIdState(null); }, []);
  useEffect(() => { setUnauthorizedHandler(logout); }, [logout]);

  const loadSession = useCallback(async () => {
    const m = await api('/auth/me');
    setMe(m);
    const tr = await api('/tenancy/tree');
    setTree(tr);
    const all = [...tr.groups.flatMap(g => g.orgs), ...tr.independent];
    const own = all.find(o => o.id === m.org?.id) || all[0];
    const saved = m.prefs?.projectId && all.some(o => o.projects.some(p => p.id === m.prefs.projectId)) ? m.prefs.projectId : null;
    setProjectIdState(saved || own?.projects?.[0]?.id || null);
    return m;
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    loadSession().catch(() => logout()).finally(() => setBooting(false));
  }, [loadSession, logout]);
  useEffect(() => { if (me) api('/catalog/labels').then(setLabels).catch(() => {}); }, [me, lang]);

  const login = useCallback(async (email, password) => {
    const { token } = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(token);
    const m = await loadSession();
    if (m.user.lang && m.user.lang !== lang && !localStorage.getItem('dms.lang.chosen')) setLangState(m.user.lang);
  }, [loadSession, lang]);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('dms.lang.chosen', '1'); } catch { /* storage blocked */ }
    if (getToken()) api('/auth/prefs', { method: 'PUT', body: { lang: l } }).catch(() => {});
  }, []);

  const savePrefs = useCallback(async (patch) => {
    setMe(m => (m ? { ...m, prefs: { ...m.prefs, ...patch } } : m));
    try { await api('/auth/prefs', { method: 'PUT', body: patch }); } catch { /* keep local state */ }
  }, []);

  const setProjectId = useCallback((id) => { setProjectIdState(id); savePrefs({ projectId: id }); }, [savePrefs]);

  const orgs = useMemo(() => (tree ? [...tree.groups.flatMap(g => g.orgs.map(o => ({ ...o, groupName: g.name }))), ...tree.independent] : []), [tree]);
  const project = useMemo(() => { for (const o of orgs) { const p = o.projects.find(x => x.id === projectId); if (p) return { ...p, org: o }; } return null; }, [orgs, projectId]);
  const can = useCallback((perm) => !!me?.permissions?.includes(perm), [me]);
  const hasFeature = useCallback((f) => !!me?.features?.includes(f), [me]);
  const readOnly = project && project.org.access === 'read';

  // Memoized so consumers do not re-render (and lose focus) on unrelated parent renders.
  const prefs = useMemo(() => me?.prefs || {}, [me]);
  const value = useMemo(() => ({ lang, setLang, t, L, fmtDate, fmtNum, me, booting, login, logout, tree, orgs, reloadTree: loadSession, project, projectId, setProjectId, can, hasFeature, readOnly, prefs, savePrefs, toast, dismissToast, toasts, alertCount, setAlertCount }),
    [lang, setLang, t, L, fmtDate, fmtNum, me, booting, login, logout, tree, orgs, loadSession, project, projectId, setProjectId, can, hasFeature, readOnly, prefs, savePrefs, toast, dismissToast, toasts, alertCount]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Data hook with loading/error state and manual reload.
export function useData(path, deps = []) {
  const { lang } = useContext(Ctx);
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!path) { setState({ data: null, loading: false, error: null, path }); return undefined; }
    const ctl = new AbortController();
    setState(s => ({ ...s, loading: true, error: null }));
    api(path, { signal: ctl.signal }).then(data => setState({ data, loading: false, error: null, path })).catch(error => { if (error.name !== 'AbortError') setState({ data: null, loading: false, error, path }); });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, n, lang, ...deps]);
  const reload = useCallback(() => setN(x => x + 1), []);
  const setData = useCallback((fn) => setState(s => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), []);
  // Until the effect has started the request of a new path, report it as loading (not 'no data').
  const { path: loadedPath, ...rest } = state;
  return { ...rest, loading: rest.loading || (!!path && loadedPath !== undefined && loadedPath !== path && !rest.data), reload, setData };
}
