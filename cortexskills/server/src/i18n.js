// One shared, versioned string dictionary for UI and server messages (Section 3.6, FR-DA-I18N-07).
// Adding a language = adding its values to i18n/dictionary.json and its code to i18n/languages.json (FR-DA-I18N-06).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.js';

const dir = path.join(ROOT, 'i18n');
let dict = {}, languages = [];
export function loadDictionary() {
  dict = JSON.parse(fs.readFileSync(path.join(dir, 'dictionary.json'), 'utf8'));
  languages = JSON.parse(fs.readFileSync(path.join(dir, 'languages.json'), 'utf8'));
  return { keys: Object.keys(dict).length, languages: languages.map(l => l.code) };
}
export const getDictionary = () => dict;
export const getLanguages = () => languages;
export function t(key, lang = 'en', params = {}) {
  const e = dict[key];
  let s = (e && (e[lang] || e.en)) || key;
  for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
/** Language precedence: user preference, then Organization default, then English (Section 3.6). */
export function resolveLang(user, org) {
  const codes = languages.map(l => l.code);
  if (user?.language && codes.includes(user.language)) return user.language;
  if (org?.default_language && codes.includes(org.default_language)) return org.default_language;
  return 'en';
}
