// Typed step forms in a running task, readiness, registers, record links and choice libraries.
import { Router } from 'express';
import { ah } from '../lib/http.js';
import { requirePerm } from '../rbac.js';
import * as St from '../services/steps.js';
import { run } from '../db.js';

const r = Router();
r.get('/tasks/:id/steps', requirePerm('projects.view'), ah(req => St.taskSteps(req, req.params.id)));
r.put('/tasks/:id/steps/:stepId/fields', requirePerm('tasks.execute'), ah(req => St.saveFields(req, req.params.id, req.params.stepId, req.body?.fields || {})));
r.post('/tasks/:id/steps/:stepId/rows', requirePerm('tasks.execute'), ah(req => St.saveRow(req, req.params.id, req.params.stepId, null, req.body?.data || {}, req.body?.origin)));
r.put('/tasks/:id/steps/:stepId/rows/:rowId', requirePerm('tasks.execute'), ah(req => St.saveRow(req, req.params.id, req.params.stepId, req.params.rowId, req.body?.data || {})));
r.delete('/tasks/:id/steps/:stepId/rows/:rowId', requirePerm('tasks.execute'), ah(req => St.deleteRow(req, req.params.id, req.params.stepId, req.params.rowId)));
r.post('/tasks/:id/steps/:stepId/complete', requirePerm('tasks.execute'), ah(req => St.completeStep(req, req.params.id, req.params.stepId)));
r.post('/tasks/:id/steps/:stepId/reopen', requirePerm('tasks.execute'), ah(req => St.reopenStep(req, req.params.id, req.params.stepId, req.body?._justification)));
r.post('/tasks/:id/steps/:stepId/suggest', requirePerm('tasks.execute', 'ai.run'), ah(req => St.suggestRows(req, req.params.id, req.params.stepId)));
r.get('/e2e-instances/:id/readiness', requirePerm('projects.view'), ah(req => St.readiness(req.orgId, req.params.id, req.lang)));
r.get('/registers', requirePerm('registers.view'), ah(req => St.registers(req.orgId, req.query.project || req.projectId || null)));
r.get('/registers/:key', requirePerm('registers.view'), ah(req => St.registerEntries(req.orgId, req.params.key, req.query.project || req.projectId || null, req.lang)));
r.get('/links', requirePerm('projects.view'), ah(req => St.links(req.orgId, req.query.type, req.query.id)));
r.post('/links', requirePerm('tasks.execute'), ah(req => St.addLink(req, req.body || {})));
r.delete('/links/:id', requirePerm('tasks.execute'), ah(req => { run(`DELETE FROM record_links WHERE id=? AND org_id=?`, req.params.id, req.orgId); return { ok: true }; }));
r.get('/choices', requirePerm('projects.view'), ah(req => St.choices(req.orgId, String(req.query.field || '').replace(/[^\w]/g, ''), req.lang, req.query.q || '')));
export default r;
