// In-memory reference catalog, loaded from catalog_items and localized per request.
import { all, run, now, J } from '../db.js';

let cache = null;

export function catalog() {
  if (!cache) load();
  return cache;
}

export function load() {
  const rows = all('SELECT id, data FROM catalog_items WHERE kind = ?', 'bundle');
  const c = {};
  for (const r of rows) c[r.id] = JSON.parse(r.data);
  indexCatalog(c);
  cache = c;
  return c;
}

export function indexCatalog(c) {
  c.mpById = Object.fromEntries((c.macroProcesses || []).map(m => [m.id, m]));
  c.mpByCode = Object.fromEntries((c.macroProcesses || []).map(m => [m.code, m]));
  c.stepById = Object.fromEntries((c.steps || []).map(s => [s.id, s]));
  c.stepsByMp = {};
  for (const s of c.steps || []) (c.stepsByMp[s.mp] ||= []).push(s);
  c.tasksByMp = {};
  for (const t of c.tasks || []) (c.tasksByMp[t.mp] ||= []).push(t);
  c.e2eById = Object.fromEntries((c.e2e || []).map(e => [e.id, e]));
  c.segById = Object.fromEntries((c.segments || []).map(s => [s.id, s]));
  c.fnById = Object.fromEntries((c.functions || []).map(f => [f.id, f]));
  return c;
}

export function saveBundle(key, data) {
  run(`INSERT INTO catalog_items(kind,id,data,version,updated_at) VALUES('bundle',?,?,1,?)
       ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data, version=version+1, updated_at=excluded.updated_at`, key, J(data), now());
  cache = null;
}

export function invalidateCatalog() { cache = null; }

const LANGS = ['en', 'fr', 'ar'];
function isI18n(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const k = Object.keys(v);
  return k.length > 0 && k.length <= 3 && k.every(x => LANGS.includes(x)) && typeof (v.en ?? v.fr ?? v.ar) === 'string';
}

// Deep-localizes {en,fr,ar} objects into strings for the requested language.
export function loc(v, lang = 'en') {
  if (v === null || v === undefined) return v;
  if (typeof v === 'string') {
    if (v.startsWith('{"') && (v.includes('"en"') || v.includes('"fr"') || v.includes('"ar"'))) {
      try { const o = JSON.parse(v); if (isI18n(o)) return o[lang] ?? o.en ?? o.fr ?? o.ar; } catch { /* plain string */ }
    }
    return v;
  }
  if (Array.isArray(v)) return v.map(x => loc(x, lang));
  if (typeof v === 'object') {
    if (isI18n(v)) return v[lang] ?? v.en ?? v.fr ?? v.ar;
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = loc(x, lang);
    return out;
  }
  return v;
}

// Stores user-entered text as an i18n object in the author's language.
export function asI18n(text, lang = 'en') {
  if (text === null || text === undefined) return null;
  if (typeof text === 'object') return text;
  return { [lang]: String(text) };
}
