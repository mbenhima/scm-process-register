// Shared translation dictionary (FR-DA-I18N-01/06). Each language is one JSON file in src/i18n.
// Adding a language = adding a file; no code change. The web client loads the same dictionaries.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { q } from '../db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'i18n');
let cache = null;

export function dictionaries() {
  if (cache) return cache;
  cache = {};
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    cache[d.meta.code] = d;
  }
  return cache;
}
export const languages = () => Object.values(dictionaries()).map((d) => d.meta);

export function translate(lang, key, params = {}) {
  const d = dictionaries();
  const s = d[lang]?.strings[key] ?? d.en?.strings[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
}

// Precedence: user preference -> organization default -> English (Section 3.6).
export function resolveLanguage(userLang, orgId) {
  const d = dictionaries();
  if (userLang && d[userLang]) return userLang;
  const org = orgId ? q.get('SELECT default_language FROM organizations WHERE id = ?', orgId) : null;
  if (org?.default_language && d[org.default_language]) return org.default_language;
  return 'en';
}
