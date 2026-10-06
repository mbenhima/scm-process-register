// Process design management API (FR-DA-PDM-01 – 11, FR-DA-NAM-01 – 04, FR-DA-SFM-01, FR-DA-VER-07 – 09).
import { Router } from 'express';
import ExcelJS from 'exceljs';
import { ah } from '../lib/http.js';
import { all, one } from '../db.js';
import { J, HttpError, pick } from '../lib/util.js';
import { requirePerm } from '../rbac.js';
import * as D from '../services/design.js';
import { FORM_KINDS, KIND_LABEL, fieldsFor } from '../services/stepforms.js';
import { objectOf } from '../services/naming.js';
import * as cat from '../catalog.js';

const r = Router();
const org = req => (req.user.is_platform && req.query.scope === 'reference' ? null : req.orgId);
const kindOk = k => { if (!D.KINDS.includes(k)) throw new HttpError(404, 'err.notFound'); return k; };

r.get('/design/tree', requirePerm('catalog.view'), ah(req => D.tree(org(req), { releaseId: req.query.release || null })));
r.get('/design/form-kinds', requirePerm('catalog.view'), ah(() => FORM_KINDS.map(k => ({ id: k, label: KIND_LABEL[k], fields: fieldsFor(k, { en: 'Item', fr: 'Élément', ar: 'عنصر' }) }))));
r.get('/design/reference-changes', requirePerm('catalog.view'), ah(req => D.referenceChanges(req.orgId)));
r.get('/design/releases', requirePerm('catalog.view'), ah(req => D.releases(req.orgId)));
r.post('/design/releases', requirePerm('design.release'), ah(req => D.createRelease(req, req.body || {})));
r.post('/design/releases/:id/:action(refresh|submit|publish|reject|retire)', requirePerm('design.release'), ah(req => D.transitionRelease(req, req.params.id, req.params.action, req.body?._justification)));
r.get('/design/releases/:id/compare', requirePerm('catalog.view'), ah(req => D.compareReleases(req.orgId, req.params.id, req.query.with || 'current')));
r.post('/design/releases/:id/restore', requirePerm('design.manage'), ah(req => D.restoreRelease(req, req.params.id, req.body?._justification)));
r.get('/projects/:id/migrate-release', requirePerm('projects.manage'), ah(req => D.migrationPreview(req.orgId, req.params.id, req.query.to)));
r.post('/projects/:id/migrate-release', requirePerm('projects.manage'), ah(req => D.migrate(req, req.params.id, req.body?.to, req.body?._justification)));

r.get('/design/export', requirePerm('catalog.view'), ah(async (req, res) => {
  const data = D.exportDesign(org(req));
  if (req.query.format !== 'xlsx') { res.set('Content-Disposition', `attachment; filename="process-design_${new Date().toISOString().slice(0, 10)}.json"`).json(data); return; }
  const wb = new ExcelJS.Workbook(); const lang = req.lang;
  const sheets = { phase: 'Phases', e2e: 'End-to-end processes', uft: 'User tasks', mp: 'Macro processes', task: 'Tasks', step: 'Steps' };
  for (const [k, title] of Object.entries(sheets)) {
    const ws = wb.addWorksheet(title); const head = ws.addRow(['ID', 'Name (EN)', 'Name (FR)', 'Name (AR)', 'Parent', 'Status', 'Custom', 'Modified', 'Version']);
    head.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8931D' } }; });
    data.elements.filter(e => e.kind === k).forEach((e, i) => { const p = D.parentOf(org(req), k, e.data); const row = ws.addRow([e.id, e.data.name?.en, e.data.name?.fr, e.data.name?.ar, p ? p[1] : '', e.status, e.custom ? 'Yes' : '', e.modified ? 'Yes' : '', e.version]);
      row.eachCell(c => { c.font = { name: 'Calibri', size: 9.5 }; c.alignment = { wrapText: true, vertical: 'top' }; if (i % 2) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F3' } }; }); });
    ws.columns.forEach((c, i) => { c.width = [14, 48, 48, 48, 14, 10, 8, 9, 8][i]; }); ws.views = [{ state: 'frozen', ySplit: 1 }];
  }
  void lang;
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').set('Content-Disposition', `attachment; filename="process-design_${new Date().toISOString().slice(0, 10)}.xlsx"`).send(Buffer.from(await wb.xlsx.writeBuffer()));
}));
r.post('/design/import', requirePerm('design.manage'), ah(req => D.importDesign(req, req.body)));
r.get('/design/e2e/:id/bpmn', requirePerm('catalog.view'), ah((req, res) => { res.set('Content-Type', 'application/xml').set('Content-Disposition', `attachment; filename="${req.params.id}.bpmn"`).send(D.bpmnXml(org(req), req.params.id, req.lang, { releaseId: req.query.release || null })); }));

r.post('/design/check-names', requirePerm('catalog.view'), ah(req => { const b = req.body || {}; const kind = kindOk(b.kind); const el = { id: b.id || '__new__', name: b.name, ...(b.parent ? (kind === 'step' ? { task: b.parent } : kind === 'uft' ? { e2e: b.parent } : kind === 'task' ? { mp: b.parent } : {}) : {}) };
  return { warnings: D.namingWarnings(org(req), kind, el), object: { en: objectOf(b.name?.en, 'en'), fr: objectOf(b.name?.fr, 'fr'), ar: objectOf(b.name?.ar, 'ar') } }; }));
r.get('/design/:kind/:id', requirePerm('catalog.view'), ah(req => D.detail(org(req), kindOk(req.params.kind), req.params.id, { releaseId: req.query.release || null })));
r.put('/design/:kind/:id', requirePerm('design.manage'), ah(req => { const b = req.body || {}; return D.save(req, kindOk(req.params.kind), req.params.id, b.data || {}, { note: b.note, justification: b._justification, acceptWarnings: !!b.acceptWarnings }); }));
r.post('/design/:kind', requirePerm('design.manage'), ah(req => { const b = req.body || {}; return D.create(req, kindOk(req.params.kind), { parentKind: b.parent_kind, parentId: b.parent_id, data: b.data || {}, note: b.note, acceptWarnings: !!b.acceptWarnings }); }));
r.post('/design/:kind/:id/duplicate', requirePerm('design.manage'), ah(req => D.duplicate(req, kindOk(req.params.kind), req.params.id)));
r.post('/design/:kind/:id/move', requirePerm('design.manage'), ah(req => D.move(req, kindOk(req.params.kind), req.params.id, { toParentId: req.body?.to_parent, index: req.body?.index })));
r.post('/design/:kind/:id/retire', requirePerm('design.manage'), ah(req => D.retire(req, kindOk(req.params.kind), req.params.id, req.body?._justification)));
r.post('/design/:kind/:id/reactivate', requirePerm('design.manage'), ah(req => D.reactivate(req, kindOk(req.params.kind), req.params.id, req.body?._justification)));
r.delete('/design/:kind/:id', requirePerm('design.manage'), ah(req => D.remove(req, kindOk(req.params.kind), req.params.id, req.body?._justification)));
r.get('/design/:kind/:id/usage', requirePerm('catalog.view'), ah(req => D.usage(org(req), kindOk(req.params.kind), req.params.id)));
r.get('/design/:kind/:id/versions', requirePerm('catalog.view'), ah(req => D.versions(org(req) || '__ref__', kindOk(req.params.kind), req.params.id)));
r.get('/design/:kind/:id/compare', requirePerm('catalog.view'), ah(req => D.compare(org(req) || '__ref__', kindOk(req.params.kind), req.params.id, req.query.a, req.query.b)));
r.post('/design/:kind/:id/restore', requirePerm('design.manage'), ah(req => D.restore(req, kindOk(req.params.kind), req.params.id, req.body?.version, req.body?._justification)));

/** Context of a step shown wherever the step appears: process, inputs and outputs, standards and clauses, rules and controls (FR-DA-NAM-04). */
r.get('/design/step/:id/context', requirePerm('catalog.view'), ah(req => {
  const o = org(req); const s = D.get(o, 'step', req.params.id); if (!s) throw new HttpError(404, 'err.notFound');
  const mp = D.get(o, 'mp', s.mp); const ufts = D.list(o, 'uft').filter(u => (u.steps || []).includes(s.id));
  const e2e = [...new Set(ufts.map(u => u.e2e))].map(id => D.get(o, 'e2e', id)).filter(Boolean);
  const recs = e => all(`SELECT id, data FROM records WHERE entity=? AND org_id=?`, e, req.orgId).map(x => ({ id: x.id, ...J(x.data) }));
  const rules = cat.list('rule').filter(x => x.step === s.id).map(x => ({ id: x.id, condition: x.condition, type: x.type }));
  const controls = cat.list('control').filter(x => String(x.steps || '').split(/[;,]\s*/).includes(s.id)).map(x => ({ id: x.id, name: x.name, coso: x.coso }));
  const orgControls = recs('Control').filter(x => String(x.process_tag || '').split(/;\s*/).includes(s.id)).map(x => ({ id: x.code || x.id, name: x.name }));
  const proj = req.projectId ? one(`SELECT vertical_id FROM projects WHERE id=? AND org_id=?`, req.projectId, req.orgId) : null;
  const vert = proj?.vertical_id ? cat.list('verticalSeed').find(v => v.id === proj.vertical_id) : null;
  const clauses = (mp?.standards || vert?.standards || []).map(std => ({ standard: std, clause: clauseFor(std, s) }));
  return { step: { id: s.id, name: s.name, role: s.role, type: s.type }, mp: mp ? { id: mp.id, name: mp.name } : null, e2e: e2e.map(e => ({ id: e.id, name: e.name })),
    inputs: ufts.map(u => u.input).filter(Boolean), outputs: ufts.map(u => u.output).filter(Boolean), rules, controls: [...controls, ...orgControls], standards: clauses,
    alerts: cat.list('alertType').filter(a => a.step === s.id).map(a => ({ id: a.id, severity: a.severity, name: a.name })) };
}));
/** Clause of a sector standard most related to a step, from its verb (planning, competence, operation, evaluation, improvement). */
function clauseFor(std, step) {
  const v = (pick(step.name, 'en') || '').split(' ')[0].toLowerCase();
  const plan = /define|set|plan|schedule|build|design|forecast|budget|sequence/.test(v), comp = /assess|score|rate|record|identify|list|register|map|collect/.test(v), eval_ = /review|check|verify|audit|measure|track|monitor|evaluate|validate/.test(v), imp = /improve|correct|fix|resolve|update|adjust/.test(v);
  if (/^ISO 9001|^ISO 13485|^IATF|^ISO 14001|^ISO 45001|^ISO 22000|^ISO 27001|^ISO 50001|^ISO 21001|^ISO 19650|^AS9100|^EN 9100/i.test(std)) return plan ? '6.2 / 8.1' : comp ? '7.2' : eval_ ? '9.1' : imp ? '10.2' : '7.3';
  if (/GMP|BPF|ICH|GDP/i.test(std)) return comp ? 'Personnel training' : eval_ ? 'Self-inspection' : 'Documentation';
  return plan ? 'Planning' : comp ? 'Competence' : eval_ ? 'Performance evaluation' : imp ? 'Improvement' : 'Operation';
}
export default r;
