// Process design reference catalog: E2E processes, macro processes, tasks, steps,
// verticals, activation matrix, governance references and commercial catalog.
import { Router } from 'express';
import { catalog } from '../catalog/store.js';
import { requirePerm } from '../auth.js';
import { h, send, notFound } from '../http.js';
import { LABELS } from '../content/labels.js';

const r = Router();
r.use(requirePerm('process.view'));

const mpBrief = (m) => ({ id: m.id, code: m.code, name: m.name, tier: m.tier, tierName: m.tierName, e2e: m.e2e, scope: m.scope, ownerRole: m.ownerRoleName, ownerRoleCode: m.ownerRoleCode, module: m.module, stepCount: m.stepCount, standards: m.standards, sme: m.sme });

r.get('/summary', h((req, res) => {
  const c = catalog();
  send(req, res, { e2e: c.e2e.length, macroProcesses: c.macroProcesses.length, tasks: c.tasks.length, steps: c.steps.length, verticals: c.segments.length, standards: c.standards.length,
    rules: c.rules.length, controls: c.controls.length, risks: c.risks.length, kpis: c.kpis.length, alerts: c.alerts.length, reports: c.reports.length, aiUseCases: c.aiUseCases.length, requirements: c.requirements.length,
    tiers: [1, 2, 3, 4, 5, 6, 7].map(t => ({ tier: t, count: c.macroProcesses.filter(m => m.tier === t).length, name: c.macroProcesses.find(m => m.tier === t)?.tierName })) });
}));

r.get('/e2e', h((req, res) => {
  const c = catalog();
  send(req, res, c.e2e.map(e => ({ id: e.id, name: e.name, type: e.typeName, goals: e.goals, trigger: e.trigger, terminal: e.terminal, ownerRole: e.ownerRoleName, mpCount: e.mpIds.length, stepCount: e.mpIds.reduce((a, m) => a + (c.mpById[m]?.stepCount || 0), 0) })));
}));
r.get('/e2e/:id', h((req, res) => {
  const c = catalog();
  const e = c.e2eById[req.params.id];
  if (!e) throw notFound('E2E process');
  send(req, res, { ...e, mps: e.mpIds.map(m => c.mpById[m]).filter(Boolean).map(mpBrief), chains: c.chains.filter(x => x.from === e.id || x.to === e.id), gate: null });
}));
r.get('/composites', h((req, res) => send(req, res, catalog().composites)));
r.get('/chains', h((req, res) => send(req, res, { chains: catalog().chains, relationTypes: catalog().relationTypes })));

r.get('/mps', h((req, res) => {
  const c = catalog();
  const q = (req.query.q || '').toString().toLowerCase();
  let list = c.macroProcesses;
  if (req.query.e2e) list = list.filter(m => m.e2e === req.query.e2e);
  if (req.query.tier) list = list.filter(m => m.tier === +req.query.tier);
  if (req.query.vertical) list = list.filter(m => ['✓', 'S'].includes(m.activation[req.query.vertical]));
  if (q) list = list.filter(m => m.code.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || Object.values(m.name).some(v => v.toLowerCase().includes(q)));
  send(req, res, list.map(mpBrief));
}));
r.get('/mps/:id', h((req, res) => {
  const c = catalog();
  const m = c.mpById[req.params.id] || c.mpByCode[req.params.id];
  if (!m) throw notFound('Macro process');
  send(req, res, {
    ...m, e2eName: c.e2eById[m.e2e]?.name,
    tasks: (c.tasksByMp[m.id] || []).map(t => ({ ...t, steps: (c.stepsByMp[m.id] || []).filter(s => s.task === t.id) })),
    rules: c.rules.filter(x => x.mp === m.id), controls: c.controls.filter(x => x.steps.some(s => s.startsWith(m.id + '.'))),
    kpis: c.kpis.filter(k => k.mp === m.id), aiUseCases: c.aiUseCases.filter(a => a.mp === m.id), alerts: c.alerts.filter(a => a.step.startsWith(m.id + '.')),
    uf: m.uf.map(u => c.uf.find(x => x.id === u)).filter(Boolean),
  });
}));
r.get('/steps/:id', h((req, res) => {
  const c = catalog();
  const s = c.stepById[req.params.id];
  if (!s) throw notFound('Step');
  send(req, res, { ...s, form: c.forms[s.formKind], mp: mpBrief(c.mpById[s.mp]), rules: c.rules.filter(x => x.step === s.id), controls: c.controls.filter(x => x.steps.includes(s.id)), aiUseCases: c.aiUseCases.filter(a => a.step === s.id) });
}));
r.get('/forms', h((req, res) => send(req, res, catalog().forms)));
r.get('/labels', h((req, res) => send(req, res, LABELS)));

r.get('/verticals', h((req, res) => {
  const c = catalog();
  send(req, res, c.segments.map(s => ({ ...s, active: c.macroProcesses.filter(m => ['✓', 'S'].includes(m.activation[s.id])).length })));
}));
r.get('/verticals/:id', h((req, res) => {
  const c = catalog();
  const s = c.segById[req.params.id];
  if (!s) throw notFound('Vertical');
  send(req, res, { ...s, mps: c.macroProcesses.filter(m => ['✓', 'S'].includes(m.activation[s.id])).map(m => ({ ...mpBrief(m), activation: m.activation[s.id] })), templates: [] });
}));
r.get('/activation', h((req, res) => {
  const c = catalog();
  send(req, res, { segments: c.segments.map(s => ({ id: s.id, name: s.name })), rows: c.macroProcesses.map(m => ({ id: m.id, code: m.code, name: m.name, tier: m.tier, e2e: m.e2e, activation: m.activation })) });
}));
r.get('/standards', h((req, res) => send(req, res, catalog().standards)));
r.get('/functions', h((req, res) => send(req, res, { functions: catalog().functions, levels: catalog().processLevels })));
r.get('/sample', h((req, res) => send(req, res, { ...catalog().sample, dms048: catalog().dms048Sample, e2e01Expanded: catalog().e2e01Expanded })));

const REF = ['rules', 'actions', 'controls', 'risks', 'kpis', 'alerts', 'reports', 'docTemplates', 'policies', 'docVersions', 'classes', 'dataDictionary', 'valueLists', 'aiUseCases', 'roleMenus', 'modules', 'uf', 'tier6Racsi'];
r.get('/reference/:kind', h((req, res) => {
  if (!REF.includes(req.params.kind)) throw notFound('Reference list');
  send(req, res, catalog()[req.params.kind]);
}));
r.get('/commercial', h((req, res) => {
  const c = catalog();
  send(req, res, { packs: c.packs, addons: c.addons, integrations: c.integrations, deploymentModes: c.deploymentModes, priceMatrix: c.priceMatrix, bundles: c.bundles, bundleDiscounts: c.bundleDiscounts, clusters: c.clusters, agreements: c.agreements, compliancePacks: c.compliancePacks, licensingLinks: c.licensingLinks });
}));
r.get('/requirements', h((req, res) => send(req, res, catalog().requirements)));

export default r;
