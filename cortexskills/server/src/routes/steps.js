// Typed step forms in a running task, readiness, registers, record links and choice libraries.
import { Router } from 'express';
import { ah } from '../lib/http.js';
import { requirePerm } from '../rbac.js';
import * as St from '../services/steps.js';
import { run, one } from '../db.js';
import { HttpError } from '../lib/util.js';
import * as FLOW from '../services/flow.js';

const r = Router();
r.get('/tasks/:id/steps', requirePerm('projects.view'), ah(req => St.taskSteps(req, req.params.id)));
r.put('/tasks/:id/steps/:stepId/fields', requirePerm('tasks.execute'), ah(req => St.saveFields(req, req.params.id, req.params.stepId, req.body?.fields || {})));
r.post('/tasks/:id/steps/:stepId/rows', requirePerm('tasks.execute'), ah(req => St.saveRow(req, req.params.id, req.params.stepId, null, req.body?.data || {}, req.body?.origin)));
r.put('/tasks/:id/steps/:stepId/rows/:rowId', requirePerm('tasks.execute'), ah(req => St.saveRow(req, req.params.id, req.params.stepId, req.params.rowId, req.body?.data || {}, 'manual', { expected: req.body?.expected || null })));
r.delete('/tasks/:id/steps/:stepId/rows/:rowId', requirePerm('tasks.execute'), ah(req => St.deleteRow(req, req.params.id, req.params.stepId, req.params.rowId)));
r.post('/tasks/:id/steps/:stepId/complete', requirePerm('tasks.execute'), ah(req => St.completeStep(req, req.params.id, req.params.stepId)));
r.post('/tasks/:id/steps/:stepId/reopen', requirePerm('tasks.execute'), ah(req => St.reopenStep(req, req.params.id, req.params.stepId, req.body?._justification)));
r.post('/tasks/:id/steps/:stepId/suggest', requirePerm('tasks.execute', 'ai.run'), ah(req => St.suggestRows(req, req.params.id, req.params.stepId, req.body?.use_case)));
r.post('/tasks/:id/steps/:stepId/template', requirePerm('tasks.execute'), ah(req => St.templateRows(req, req.params.id, req.params.stepId)));
r.get('/tasks/:id/steps/:stepId/panel', requirePerm('projects.view'), ah(req => St.stepPanel(req, req.params.id, req.params.stepId)));
r.post('/tasks/:id/steps/:stepId/actions/:key', requirePerm('tasks.execute'), ah(req => St.stepAction(req, req.params.id, req.params.stepId, req.params.key, req.body || {})));
// A table of a panel downloaded as CSV (UTF-8 with a byte-order mark, opened as is by spreadsheet software).
r.get('/tasks/:id/steps/:stepId/panel.csv', requirePerm('projects.view'), ah((req, res) => {
  const p = St.stepPanel(req, req.params.id, req.params.stepId); const tb = (p.tables || [])[Number(req.query.table) || 0]; if (!tb) return { rows: 0 };
  const esc = v => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = '\uFEFF' + [tb.columns.map(c => esc(c[1])).join(';'), ...tb.rows.map(r => tb.columns.map(c => esc(r[c[0]])).join(';'))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${req.params.stepId}.csv"`); res.send(csv);
}));
// Indicator widgets chosen for the project dashboard (step MP-10.2), with their current values.
r.get('/projects/:id/widgets', requirePerm('projects.view'), ah(req => { if (!one(`SELECT id FROM projects WHERE id=? AND org_id=?`, req.params.id, req.orgId)) throw new HttpError(404, 'err.notFound'); return FLOW.widgets(req, req.params.id); }));
r.get('/e2e-instances/:id/readiness', requirePerm('projects.view'), ah(req => St.readiness(req.orgId, req.params.id, req.lang)));
r.get('/registers', requirePerm('registers.view'), ah(req => St.registers(req.orgId, req.query.project || req.projectId || null)));
r.get('/registers/:key', requirePerm('registers.view'), ah(req => St.registerEntries(req.orgId, req.params.key, req.query.project || req.projectId || null, req.lang)));
r.get('/links', requirePerm('projects.view'), ah(req => St.links(req.orgId, req.query.type, req.query.id)));
r.post('/links', requirePerm('tasks.execute'), ah(req => St.addLink(req, req.body || {})));
r.delete('/links/:id', requirePerm('tasks.execute'), ah(req => { run(`DELETE FROM record_links WHERE id=? AND org_id=?`, req.params.id, req.orgId); return { ok: true }; }));
r.get('/choices', requirePerm('projects.view'), ah(req => St.choices(req.orgId, String(req.query.field || '').replace(/[^\w]/g, ''), req.lang, req.query.q || '')));
export default r;
