// Seed helpers: translation memory (English source text → French / Arabic), triples and templating.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SEED_DIR = path.dirname(fileURLToPath(import.meta.url));
export const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(SEED_DIR, ...p), 'utf8'));
const tryJson = (...p) => { const f = path.join(SEED_DIR, ...p); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}; };

// Translation memory files: i18n/tm.<lang>.*.json, each {"English text": "translation"}.
const TM = { fr: {}, ar: {} };
const tmDir = path.join(SEED_DIR, 'i18n');
if (fs.existsSync(tmDir)) for (const f of fs.readdirSync(tmDir).filter(f => f.endsWith('.json'))) {
  const m = f.match(/^tm\.(fr|ar)\./); if (m) Object.assign(TM[m[1]], tryJson('i18n', f));
}
export const missing = { fr: new Set(), ar: new Set() };
/** {en, fr, ar} for an English catalog string, using the translation memory (English fallback, reported). */
export function tr(en) {
  if (en == null) return { en: '', fr: '', ar: '' };
  const s = String(en).trim();
  const out = { en: s, fr: TM.fr[s], ar: TM.ar[s] };
  for (const l of ['fr', 'ar']) if (out[l] == null) { if (s && !/^[A-Z0-9 .;,\-–—/()%×→]+$/.test(s)) missing[l].add(s); out[l] = s; }
  return out;
}
/** A triple [en, fr, ar] from the content files → {en, fr, ar}. */
export const T = a => Array.isArray(a) ? { en: a[0], fr: a[1] ?? a[0], ar: a[2] ?? a[0] } : (a && typeof a === 'object' ? a : tr(a));
export const fillT = (t, vals) => Object.fromEntries(Object.entries(t).map(([l, s]) => [l, String(s).replace(/\{(\w+)\}/g, (m, k) => (vals[k] ? (typeof vals[k] === 'object' ? vals[k][l] : vals[k]) : m))]));
export const tmStats = () => ({ fr: Object.keys(TM.fr).length, ar: Object.keys(TM.ar).length });
