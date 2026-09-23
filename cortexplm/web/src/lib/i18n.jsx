// Translation layer. English text is the key; dictionaries (en, fr, ar, ...) are served by the server
// from one shared dictionary folder, so a new language is added by configuration only.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const I18nCtx = createContext(null);
const LANG_KEY = 'cortexplm.lang';
const cache = {};

async function loadDictionary(lang) {
  if (cache[lang]) return cache[lang];
  const res = await fetch(`/api/i18n/${lang}`);
  if (!res.ok) throw new Error('Language not available');
  cache[lang] = await res.json();
  return cache[lang];
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => { try { return localStorage.getItem(LANG_KEY) || 'en'; } catch { return 'en'; } });
  const [dict, setDict] = useState({ meta: { code: 'en', dir: 'ltr', name: 'English' }, strings: {} });
  const [languages, setLanguages] = useState([{ code: 'en', name: 'English', dir: 'ltr' }]);

  useEffect(() => { fetch('/api/i18n').then((r) => r.json()).then(setLanguages).catch(() => {}); }, []);
  useEffect(() => {
    let alive = true;
    loadDictionary(lang).then((d) => { if (alive) setDict(d); }).catch(() => { if (lang !== 'en') setLangState('en'); });
    return () => { alive = false; };
  }, [lang]);
  useEffect(() => {
    document.documentElement.lang = dict.meta.code;
    document.documentElement.dir = dict.meta.dir || 'ltr';
  }, [dict]);

  const setLang = useCallback((l) => { setLangState(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* storage unavailable */ } }, []);
  const t = useCallback((key, params) => {
    if (key == null) return '';
    let s = dict.strings[key] ?? key;
    if (params) s = s.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
    return s;
  }, [dict]);
  const value = useMemo(() => ({ lang, setLang, t, dir: dict.meta.dir || 'ltr', languages }), [lang, setLang, t, dict, languages]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
export const useT = () => useContext(I18nCtx).t;
