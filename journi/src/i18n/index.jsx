import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import dict from './translations.js'

const I18nContext = createContext(null)

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
]

const STORAGE_KEY = 'journi.language'

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en')

  const dir = LANGUAGES.find((l) => l.code === lang)?.dir || 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang, dir])

  const t = useCallback(
    (key, fallback) => {
      const entry = dict[key]
      if (!entry) return fallback ?? key
      return entry[lang] ?? entry.en ?? fallback ?? key
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, dir, t, languages: LANGUAGES }), [lang, dir, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
