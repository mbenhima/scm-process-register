import crypto from 'node:crypto';

export const uuid = () => crypto.randomUUID();
/** Deterministic, opaque UUID derived from a key (used by the reproducible seed). */
export function detUuid(key) {
  const h = crypto.createHash('sha1').update('cortexskills:' + key).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export const now = () => new Date().toISOString();
export const J = (s, d = null) => { if (s == null || s === '') return d; try { return JSON.parse(s); } catch { return d; } };
export const S = v => JSON.stringify(v ?? null);

export const LANGS = ['en', 'fr', 'ar'];
/** A multilingual value is {en, fr, ar}. A plain string is treated as the same text in every language. */
export function ml(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  return { en: v ?? '', fr: v ?? '', ar: v ?? '' };
}
export function pick(v, lang = 'en') {
  if (v == null) return '';
  if (typeof v === 'string') { const p = J(v); if (p && typeof p === 'object') return pick(p, lang); return v; }
  return v[lang] || v.en || '';
}

export class HttpError extends Error {
  constructor(status, code, params = {}) { super(code); this.status = status; this.code = code; this.params = params; }
}

/** Seeded pseudo-random generator (mulberry32) for a deterministic demonstration seed. */
export function rng(seed) {
  let a = typeof seed === 'number' ? seed : [...String(seed)].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619)) >>> 0, 2166136261);
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const addDays = (iso, d) => { const x = new Date(iso); x.setUTCDate(x.getUTCDate() + d); return x.toISOString(); };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
