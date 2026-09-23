// Internal benchmarking API (within the organization, and across the organizations of its group only).
import { Router } from 'express';
import { q } from '../db.js';
import { requirePerm } from '../lib/security.js';
import { audit } from '../lib/audit.js';
import { internalBenchmark, groupBenchmark, sharesWithGroup, METRICS, DIMENSIONS } from '../lib/benchmark.js';
import { h, ctxOf } from './util.js';

const r = Router();
const filters = (req) => ({ track: req.query.track || undefined, offer_type: req.query.offer_type || undefined });

r.get('/benchmark/catalog', requirePerm('benchmark.view'), (req, res) => res.json({ metrics: METRICS, dimensions: Object.entries(DIMENSIONS).map(([key, d]) => ({ key, label: d.label })) }));
r.get('/benchmark/organization', requirePerm('benchmark.view'), h((req) => internalBenchmark(req.orgId, req.query.dimension || 'offer_type', filters(req))));
r.get('/benchmark/group', requirePerm('benchmark.group'), h((req) => groupBenchmark(req.orgId, filters(req))));
r.get('/benchmark/sharing', requirePerm('benchmark.view'), h((req) => ({ sharing: sharesWithGroup(req.orgId), inGroup: !!q.get('SELECT group_id FROM organizations WHERE id = ?', req.orgId).group_id })));
r.put('/benchmark/sharing', requirePerm('benchmark.manage'), h((req) => {
  const before = sharesWithGroup(req.orgId); const on = !!req.body.sharing;
  q.run("INSERT INTO governance_settings (org_id, key, value) VALUES (?, 'group_benchmark_sharing', ?) ON CONFLICT(org_id, key) DO UPDATE SET value = excluded.value", req.orgId, on ? '1' : '0');
  audit(ctxOf(req), 'settings', req.orgId, 'update', { group_benchmark_sharing: [before, on] }, req.body.justification || null);
  return { sharing: on };
}));

export default r;
