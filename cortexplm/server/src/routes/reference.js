// Read-only reference catalog: process design, deliverables workbook, commercial catalog, SRS.
import { Router } from 'express';
import { PROC, DLV, CAT, SRS, MP, D01, STEPS, E2E, E2E_IDS, GATE, TRACKS, TRACK_MATRIX } from '../lib/ref.js';
import { TASK_FORMS } from '../lib/taskForms.js';
import { CRITERIA, recommendTrack } from '../lib/lifecycle.js';
import { requirePerm } from '../lib/security.js';
import { complianceCatalog, FEATURES } from '../lib/entitlements.js';
import { ALERT_CATALOG } from '../lib/alerts.js';
import { h } from './util.js';

const r = Router();
const view = requirePerm('reference.view');

r.get('/reference/summary', view, (req, res) => res.json({ keyFigures: PROC.keyFigures, categories: [...new Set(PROC.macroProcesses.map((m) => m.category))] }));
r.get('/reference/macro-processes', view, (req, res) => res.json(PROC.macroProcesses.map((m) => ({ ...m, d01: D01[m.id], stepCount: STEPS.filter((s) => s.Parent_Macro_Process_ID === m.id).length }))));
r.get('/reference/macro-processes/:id', view, (req, res) => {
  const m = MP[req.params.id];
  if (!m) return res.status(404).json({ error: 'Macro process not found.' });
  const steps = STEPS.filter((s) => s.Parent_Macro_Process_ID === m.id);
  const tasks = [...new Set(steps.map((s) => s.Task_Name))].map((t) => ({ name: t, steps: steps.filter((s) => s.Task_Name === t) }));
  const rules = DLV['D03 Business Rules'].filter((b) => b.Triggering_Step_ID.startsWith(m.id + '.'));
  const controls = DLV['D04 Controls'].filter((c) => c.Linked_Step_IDs.split(', ').some((s) => s.startsWith(m.id + '.')));
  const kpis = DLV['D06 KPIs'].filter((k) => k.Linked_Macro_Process_ID === m.id);
  const ai = DLV['D15 AI Use Cases'].filter((a) => a.Linked_Step_ID.startsWith(m.id + '.'));
  const packs = DLV['D26 Modules & Tiers'].filter((p) => p.Module_ID === 'PACK-11' || (p.Included_Macro_Process_IDs.match(/MP-\d+/g) || []).includes(m.id)).map((p) => ({ id: p.Module_ID, name: p.Module_Name }));
  const e2e = Object.fromEntries(PROC.coverage.filter((c) => c.MP === m.id).flatMap((c) => ['E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09'].map((k) => [k, c[k]])));
  const classes = DLV['D09 Information Class Model'].filter((c) => c.Related_Macro_Process_IDs.split(', ').includes(m.id));
  res.json({ ...m, d01: D01[m.id], tasks, rules, controls, kpis, ai, packs, coverage: e2e, track: TRACK_MATRIX[m.id], classes });
});
r.get('/reference/e2e', view, (req, res) => res.json(E2E_IDS.map((id) => ({ ...E2E[id], chain: PROC.chains.find((c) => c.E2E === id), trackSummary: PROC.trackSummary.find((t) => t.E2E === id) }))));
r.get('/reference/e2e/:id', view, (req, res) => {
  const e = E2E[req.params.id];
  if (!e) return res.status(404).json({ error: 'E2E process not found.' });
  res.json({ ...e, chain: PROC.chains.find((c) => c.E2E === e.id), ufs: PROC.ufs.filter((u) => u.e2e.includes(e.id) || u.e2e === 'All E2E processes'), bpmn: e.id === 'E2E-01' ? PROC.bpmnE2E01 : null, trackSummary: PROC.trackSummary.find((t) => t.E2E === e.id) });
});
r.get('/reference/ufs', view, (req, res) => res.json(PROC.ufs));
r.get('/reference/coverage', view, (req, res) => res.json({ matrix: PROC.coverage, byCategory: PROC.unmappedResolution, conclusion: 'With the proposals, every macro process appears in at least one E2E process, and every E2E process maps to at least nine macro processes.' }));
r.get('/reference/gates', (req, res) => res.json({ gates: Object.values(GATE), outcomes: PROC.gateOutcomes, roles: PROC.gateRoles }));
r.get('/reference/tracks', (req, res) => res.json({ tracks: PROC.tracks, config: TRACKS, matrix: PROC.trackMatrix, summary: PROC.trackSummary, scoring: PROC.scoring, thresholds: PROC.thresholds, rules: PROC.trackRules, criteria: CRITERIA }));
r.post('/reference/recommend-track', h((req) => recommendTrack(req.body.scores, !!req.body.safety_critical)));
r.get('/reference/findings', view, (req, res) => res.json({ findings: PROC.findings, glossary: PROC.glossary }));
r.get('/reference/task-forms', (req, res) => res.json(TASK_FORMS));
r.get('/reference/data-model', view, (req, res) => res.json({ classes: DLV['D09 Information Class Model'], attributes: DLV['D10 Data Dictionary'] }));
r.get('/reference/role-menus', view, (req, res) => res.json(DLV['D15b Role Menus']));
r.get('/reference/actions', (req, res) => res.json(DLV['D03a Actions Registry']));
r.get('/reference/steps', view, (req, res) => res.json(STEPS));
r.get('/reference/workbook', view, (req, res) => res.json({ cover: DLV.Cover }));
r.get('/reference/srs', (req, res) => res.json(SRS));
r.get('/reference/alert-catalog', (req, res) => res.json(ALERT_CATALOG));
r.get('/catalog', requirePerm('catalog.view', 'config.view'), (req, res) => res.json({ ...CAT, modules: DLV['D26 Modules & Tiers'], compliance: complianceCatalog(), features: FEATURES }));

export default r;
