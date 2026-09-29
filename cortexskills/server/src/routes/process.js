import { Router } from 'express';
import { ah } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { J, S, HttpError, now, uuid } from '../lib/util.js';
import { requirePerm } from '../rbac.js';
import * as cat from '../catalog.js';
import { audit } from '../audit.js';
import { useCases } from '../services/ai.js';
import { entitledModules } from '../entitlements.js';
import { updateRecord } from '../entities.js';

const r = Router();
const KINDS = ['mp', 'task', 'step', 'e2e', 'uft', 'composite', 'glossary', 'module', 'packCatalog', 'solutionPack', 'integration', 'addOn', 'bundle', 'packagingRule',
  'action', 'alertType', 'report', 'class', 'attribute', 'phase', 'gateSeed', 'complianceStandard', 'function', 'focusLabel', 'verticalSeed', 'smeMp', 'smeE2E', 'smeTrackSeed', 'checklistSeedUniversal', 'themePool', 'trace', 'decisionMatrix', 'legend', 'role'];
r.get('/catalog/:kind', requirePerm('catalog.view'), ah(req => { if (!KINDS.includes(req.params.kind)) throw new HttpError(404, 'err.notFound'); return cat.list(req.params.kind); }));

r.get('/process/mp/:id', requirePerm('catalog.view'), ah(req => {
  const mp = cat.get('mp', req.params.id) || cat.get('smeMp', req.params.id) || cat.list('verticalSeed').flatMap(v => v.mps).find(m => m.id === req.params.id);
  if (!mp) throw new HttpError(404, 'err.notFound');
  const steps = cat.list('step').filter(s => s.mp === mp.id); const stepIds = new Set(steps.map(s => s.id));
  const org = req.orgId;
  const recs = e => all(`SELECT id, data FROM records WHERE entity=? AND org_id=?`, e, org).map(x => ({ id: x.id, ...J(x.data) }));
  return {
    mp, tasks: cat.list('task').filter(t => t.mp === mp.id), steps,
    e2e: cat.list('e2e').filter(e => e.mps.includes(mp.id) || e.ufts.some(u => cat.get('uft', u)?.steps.some(s => stepIds.has(s)))).map(e => ({ id: e.id, name: e.name, type: e.type })),
    kpis: recs('KpiDefinition').filter(k => k.macro_process === mp.id),
    rules: recs('BusinessRule').filter(x => stepIds.has(x.process_tag)),
    controls: recs('Control').filter(x => String(x.process_tag || '').split(/;\s*/).some(s => stepIds.has(s))),
    alerts: cat.list('alertType').filter(a => stepIds.has(a.step)),
    aiUseCases: useCases(org).filter(u => stepIds.has(u.step)),
    reports: cat.list('report').filter(x => (x.fields.match(/KPI-\d+/g) || []).some(k => cat.get('kpi', k)?.mp === mp.id)),
    classes: cat.list('class').filter(c => (c.mps || []).includes(mp.id)),
    module: cat.get('module', mp.module), entitled: entitledModules(org).has(mp.module),
  };
}));
r.get('/process/e2e/:id', requirePerm('catalog.view'), ah(req => {
  const e = cat.get('e2e', req.params.id); if (!e) throw new HttpError(404, 'err.notFound');
  const uc = useCases(req.orgId);
  const ufts = e.ufts.map(id => { const u = cat.get('uft', id); return { ...u, stepsDetail: u.steps.map(s => cat.get('step', s)).filter(Boolean), ai: uc.filter(x => u.steps.includes(x.step)).map(x => ({ id: x.id, code: x.code, name: x.name, tier: x.tier })), guidance: cat.get('guidance', id)?.text || null }; });
  return { e2e: e, ufts, chainIn: cat.list('e2e').filter(x => (x.feedsInto || '').includes(e.id)).map(x => ({ id: x.id, name: x.name })), chainOut: (e.feedsInto || '').match(/E2E-\d\d/g) || [] };
}));
/** Chain dependency graph (Section 5 of the process design). */
r.get('/process/chain', requirePerm('catalog.view'), ah(() => {
  const nodes = cat.list('e2e').map(e => ({ id: e.id, name: e.name, layer: e.layer, type: e.type }));
  const edges = []; for (const e of cat.list('e2e')) for (const to of (e.feedsInto || '').match(/E2E-\d\d/g) || []) edges.push({ from: e.id, to, kind: e.id === 'E2E-19' && to === 'E2E-31' ? 'dashed' : 'solid' });
  return { nodes, edges, composites: cat.list('composite') };
}));
r.get('/process/coverage', requirePerm('catalog.view'), ah(() => {
  const ufts = cat.list('uft'); const stepToE2e = new Map();
  for (const u of ufts) for (const s of u.steps) (stepToE2e.get(s) || stepToE2e.set(s, new Set()).get(s)).add(u.e2e);
  const rows = cat.list('mp').map(m => {
    const steps = cat.list('step').filter(s => s.mp === m.id); const covered = steps.filter(s => stepToE2e.has(s.id));
    const e2e = new Set([...(m.coveredBy || []), ...covered.flatMap(s => [...stepToE2e.get(s.id)])]);
    return { id: m.id, name: m.name, family: m.family, e2e: [...e2e].sort(), steps: steps.length, stepsCovered: covered.length, status: m.family === 'Platform Administration' ? 'Admin' : covered.length === steps.length ? 'Full' : covered.length ? 'Partial' : 'None' };
  });
  return { rows, businessMps: rows.filter(r => r.status !== 'Admin').length, fullyCovered: rows.filter(r => r.status === 'Full').length, steps: cat.list('step').length, stepsCovered: stepToE2e.size };
}));
/** Tasks of the process design with the AI Use Cases that support them, filterable by tier (FR-DA-AI-13). */
r.get('/process/ai-map', requirePerm('catalog.view'), ah(req => {
  const uc = useCases(req.orgId).filter(u => !req.query.tier || u.tier === req.query.tier);
  return cat.list('step').filter(s => uc.some(u => u.step === s.id)).map(s => ({ step: s, useCases: uc.filter(u => u.step === s.id) }));
}));
r.get('/modules', requirePerm('projects.view'), ah(req => { const ent = entitledModules(req.orgId); return cat.list('module').map(m => ({ ...m, entitled: ent.has(m.id) })); }));
r.get('/modules/:id', requirePerm('projects.view'), ah(req => {
  const m = cat.get('module', req.params.id); if (!m) throw new HttpError(404, 'err.notFound');
  const entitled = entitledModules(req.orgId).has(m.id);
  const mps = m.mps.map(id => cat.get('mp', id)).filter(Boolean); const stepIds = new Set(cat.list('step').filter(s => m.mps.includes(s.mp)).map(s => s.id));
  const uftIds = cat.list('uft').filter(u => u.steps.some(s => stepIds.has(s))).map(u => u.id);
  const tasks = entitled && uftIds.length ? all(`SELECT t.id, t.uft_id, t.status, t.due_date, t.project_id, p.name project_name, u.name owner_name FROM task_instances t JOIN projects p ON p.id=t.project_id LEFT JOIN users u ON u.id=t.owner_id
    WHERE t.org_id=? AND t.uft_id IN (${uftIds.map(() => '?').join(',')}) ${req.projectId ? 'AND t.project_id=?' : ''} ORDER BY t.due_date LIMIT 200`, req.orgId, ...uftIds, ...(req.projectId ? [req.projectId] : [])).map(x => ({ ...x, project_name: J(x.project_name) })) : [];
  const classes = cat.list('class').filter(c => (c.mps || []).some(x => m.mps.includes(x)));
  const counts = Object.fromEntries(classes.map(c => [c.name, one(`SELECT COUNT(*) n FROM records WHERE entity=? AND org_id=?`, c.name, req.orgId).n]));
  return { module: m, entitled, mps, tasks, classes, counts, menus: cat.list('roleMenu').filter(x => x.module === m.id) };
}));

// ------------------------------------------------------------------ Verticals: lifecycle, activation, deactivation
const LIFECYCLE = { Draft: ['Review'], Review: ['Approved', 'Draft'], Approved: ['Active', 'Draft'], Active: ['Deprecated'], Deprecated: ['Retired', 'Active'], Retired: [] };
r.post('/verticals/:id/transition', requirePerm('verticals.manage'), ah(req => {
  const rec = one(`SELECT * FROM records WHERE id=? AND entity='Vertical'`, req.params.id); if (!rec) throw new HttpError(404, 'err.notFound');
  const d = J(rec.data); const to = req.body?.to;
  if (!(LIFECYCLE[d.lifecycle] || []).includes(to)) throw new HttpError(422, 'err.lifecycle', { from: d.lifecycle, to });
  if (['Deprecated', 'Retired'].includes(to)) {
    const n = one(`SELECT COUNT(*) n FROM projects WHERE vertical_id=? AND status='Active'`, rec.ref).n;
    if (n) throw new HttpError(409, 'err.verticalInUse', { n });
  }
  return updateRecord(req, 'Vertical', rec.id, { lifecycle: to, _justification: req.body?._justification || `Lifecycle ${d.lifecycle} → ${to}` });
}));
function validateVertical(d) {
  const failed = [];
  if (!d.macro_processes?.length || d.macro_processes.length < 3 || d.macro_processes.length > 5) failed.push('rule.vertical.mpRange');
  if (!d.e2e_processes?.length || d.e2e_processes.length < 2 || d.e2e_processes.length > 4) failed.push('rule.vertical.e2eRange');
  if (!d.standards?.length) failed.push('rule.vertical.standards');
  if (d.lifecycle !== 'Active' && d.lifecycle !== 'Approved') failed.push('rule.vertical.approved');
  return failed;
}
r.get('/verticals/activation', requirePerm('catalog.view'), ah(req => all(`SELECT * FROM vertical_activation WHERE org_id=? ORDER BY sort`, req.orgId)));
r.post('/verticals/:id/activate', requirePerm('verticals.manage'), ah(req => {
  const rec = one(`SELECT * FROM records WHERE id=? AND entity='Vertical'`, req.params.id); if (!rec) throw new HttpError(404, 'err.notFound');
  const failed = validateVertical(J(rec.data));
  if (failed.length) throw new HttpError(422, 'err.validationFailed', { rules: failed.join(', ') });
  const sort = (one(`SELECT MAX(sort) s FROM vertical_activation WHERE org_id=?`, req.orgId)?.s || 0) + 1;
  run(`INSERT INTO vertical_activation(org_id,vertical_id,version,sort,validated,activated_at) VALUES(?,?,?,?,1,?) ON CONFLICT(org_id,vertical_id) DO UPDATE SET version=excluded.version, validated=1`, req.orgId, rec.ref, rec.version, sort, now());
  audit(req, 'VerticalActivation', rec.ref, 'activate', null, { version: rec.version }); return { ok: true };
}));
r.post('/verticals/:id/deactivate', requirePerm('verticals.manage'), ah(req => {
  const rec = one(`SELECT * FROM records WHERE id=? AND entity='Vertical'`, req.params.id); if (!rec) throw new HttpError(404, 'err.notFound');
  const n = one(`SELECT COUNT(*) n FROM projects WHERE org_id=? AND vertical_id=? AND status='Active'`, req.orgId, rec.ref).n;
  if (n) throw new HttpError(409, 'err.verticalInUse', { n }); // data of a deactivated vertical is preserved
  if (!String(req.body?._justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
  run(`DELETE FROM vertical_activation WHERE org_id=? AND vertical_id=?`, req.orgId, rec.ref);
  audit(req, 'VerticalActivation', rec.ref, 'deactivate', null, null, req.body._justification); return { ok: true };
}));
/** Criteria weights are saved together and must sum to 100 % (FR-DA-SCO-02). */
r.put('/sme/criteria/weights', requirePerm('sme.manage'), ah(req => {
  const w = req.body?.weights || {}; const recs = all(`SELECT id, data FROM records WHERE entity='ComplexityCriterion'`).map(x => ({ id: x.id, ...J(x.data) })).filter(c => !c.vertical_id);
  const total = recs.reduce((s, c) => s + Number(w[c.code] ?? c.weight), 0);
  if (Math.round(total) !== 100) throw new HttpError(422, 'err.weightsSum', { total });
  for (const c of recs) if (w[c.code] != null && Number(w[c.code]) !== c.weight) updateRecord(req, 'ComplexityCriterion', c.id, { weight: Number(w[c.code]), _justification: req.body?._justification || 'Weights update' });
  return { ok: true, total };
}));
export default r;
