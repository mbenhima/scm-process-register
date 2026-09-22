import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { TRANSLATIONS } from '../lib/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('dba_lang') || 'en')

  useEffect(() => {
    localStorage.setItem('dba_lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const t = useMemo(() => {
    return (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key
  }, [lang])

  const value = { lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
