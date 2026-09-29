import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { session } from './api.js';

// One dictionary for the whole UI, served by the server (same file the server uses for its messages).
const Ctx = createContext(null);
export function I18nProvider({ children }) {
  const [dict, setDict] = useState(null); const [languages, setLanguages] = useState([]);
  const [lang, setLangState] = useState(session.lang || 'en');
  useEffect(() => { fetch('/api/i18n').then(r => r.json()).then(d => { setDict(d.dictionary); setLanguages(d.languages); }).catch(() => setDict({})); }, []);
  const dir = languages.find(l => l.code === lang)?.dir || (lang === 'ar' ? 'rtl' : 'ltr');
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = dir; }, [lang, dir]);
  const setLang = useCallback(l => { session.lang = l; setLangState(l); }, []);
  const t = useCallback((key, params) => {
    const e = dict?.[key]; let s = (e && (e[lang] || e.en)) || humanize(key);
    if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
    return s;
  }, [dict, lang]);
  /** Pick the current language from a multilingual value {en, fr, ar}. */
  const L = useCallback(v => { if (v == null) return ''; if (typeof v === 'string') return v; return v[lang] || v.en || ''; }, [lang]);
  const fmtNum = useCallback((n, o) => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-MA' : 'en-GB', o)), [lang]);
  const fmtDate = useCallback(d => (d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'), [lang]);
  const value = useMemo(() => ({ t, L, lang, setLang, dir, languages, ready: !!dict, fmtNum, fmtDate }), [t, L, lang, setLang, dir, languages, dict, fmtNum, fmtDate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
function humanize(key) { const last = String(key).split('.').pop(); return last.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase()); }
