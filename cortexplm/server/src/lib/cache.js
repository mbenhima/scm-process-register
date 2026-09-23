// Short-lived response cache for heavy read-only screens (NFR-DA-SCALE-02). Entries are per organization and
// per user (so permission filtering is preserved), expire after TTL_MS, and are dropped as soon as any change
// is written in the organization.
const TTL_MS = 20000;
const CACHEABLE = /^\/(dashboard|projects(\/\d+)?|kpis|reports(\/[\w-]+)?|benchmark\/(organization|group)|controls-coverage|risk-heatmap)$/;
const store = new Map(); // orgId -> Map(key -> { at, body })

export function responseCache(req, res, next) {
  if (!req.user) return next();
  const org = req.orgId;
  if (req.method !== 'GET') { // any write clears the organization's cache once it succeeds
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      store.delete(org);
      for (const m of store.values()) for (const k of m.keys()) if (k.includes('/benchmark/group')) m.delete(k); // peers' figures changed
    });
    return next();
  }
  if (!CACHEABLE.test(req.path)) return next();
  const key = `${req.user.id}|${req.originalUrl}`;
  const hit = store.get(org)?.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) { res.set('X-Cache', 'HIT'); return res.json(hit.body); }
  const json = res.json.bind(res);
  res.json = (body) => { if (res.statusCode < 400) { if (!store.has(org)) store.set(org, new Map()); store.get(org).set(key, { at: Date.now(), body }); } return json(body); };
  return next();
}
export const clearAll = () => store.clear();
