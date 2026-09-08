import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translate } from '../i18n/translations.js';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ncp_solver_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('ncp_solver_lang', lang);
    const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    dir: (LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]).dir,
    t: (key) => translate(lang, key),
    languages: LANGUAGES,
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
