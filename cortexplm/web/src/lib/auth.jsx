import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, put, post, session, setUnauthorizedHandler } from './api.js';
import { useI18n } from './i18n.jsx';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const { setLang } = useI18n();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(!!session.token);

  const refresh = useCallback(async () => {
    if (!session.token) { setMe(null); setLoading(false); return null; }
    try {
      const m = await api('/auth/me');
      setMe(m);
      setLang(m.language); // user preference -> organization default -> English
      return m;
    } catch { session.token = null; setMe(null); return null; } finally { setLoading(false); }
  }, [setLang]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setUnauthorizedHandler(() => { session.token = null; setMe(null); }); }, []);

  const login = useCallback(async (email, password) => {
    const { token } = await post('/auth/login', { email, password });
    session.token = token; session.org = null;
    return refresh();
  }, [refresh]);
  const logout = useCallback(() => { session.token = null; session.org = null; setMe(null); }, []);
  const switchOrg = useCallback(async (id) => { session.org = id; await refresh(); }, [refresh]);
  const savePrefs = useCallback(async (prefs) => {
    setMe((m) => (m ? { ...m, user: { ...m.user, prefs: { ...m.user.prefs, ...prefs } } } : m));
    try { await put('/auth/me', { prefs }); } catch { /* keep local state */ }
  }, []);
  const saveLanguage = useCallback(async (language) => {
    setLang(language);
    try { const m = await put('/auth/me', { language }); setMe(m); } catch { /* ignore */ }
  }, [setLang]);

  const value = useMemo(() => {
    const perms = new Set(me?.permissions || []);
    return {
      me, loading, login, logout, refresh, switchOrg, savePrefs, saveLanguage,
      can: (...codes) => codes.some((c) => perms.has(c)),
      feature: (f) => !!me?.config?.features?.[f],
    };
  }, [me, loading, login, logout, refresh, switchOrg, savePrefs, saveLanguage]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
