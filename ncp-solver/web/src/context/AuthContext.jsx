import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../lib/api.js';
import { useI18n } from './I18nContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setLang } = useI18n();

  const loadMe = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const me = await api.get('/auth/me');
      setUser(me);
      if (me.languagePreference) setLang(me.languagePreference);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setLang]);

  useEffect(() => { loadMe(); }, [loadMe]);

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('ncp:unauthorized', handler);
    return () => window.removeEventListener('ncp:unauthorized', handler);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token } = await api.post('/auth/login', { email, password });
    setToken(token);
    await loadMe();
  }, [loadMe]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback((code) => !!user?.permissions?.includes(code), [user]);
  const hasAnyPermission = useCallback((...codes) => codes.some((c) => user?.permissions?.includes(c)), [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, hasAnyPermission, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
