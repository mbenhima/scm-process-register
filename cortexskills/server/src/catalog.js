import { all, one } from './db.js';
import { J } from './lib/util.js';

// Read-only reference catalog (process design, governance catalog, packs...). Loaded once, cached.
const cache = new Map();
export function list(kind) {
  if (!cache.has(kind)) cache.set(kind, all(`SELECT data FROM catalog WHERE kind=? ORDER BY sort, id`, kind).map(r => J(r.data)));
  return cache.get(kind);
}
export function get(kind, id) { return list(kind).find(x => x.id === id) || null; }
export function byId(kind) {
  const k = kind + '#map';
  if (!cache.has(k)) cache.set(k, new Map(list(kind).map(x => [x.id, x])));
  return cache.get(k);
}
export function clearCatalogCache() { cache.clear(); }
export function hasCatalog() { return !!one(`SELECT 1 AS x FROM catalog LIMIT 1`); }
