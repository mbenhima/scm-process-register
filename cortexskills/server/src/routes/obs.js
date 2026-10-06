// OBS functions, roles, assignments, views and pickers; role-based RACSI per macro process.
import { Router } from 'express';
import { ah } from '../lib/http.js';
import { requirePerm } from '../rbac.js';
import * as O from '../services/obs.js';

const r = Router();
r.get('/obs-functions', requirePerm('obs.view'), ah(req => O.functions(req.orgId)));
r.post('/obs-functions', requirePerm('obs.manage'), ah(req => O.saveFunction(req, null, req.body || {})));
r.put('/obs-functions/:id', requirePerm('obs.manage'), ah(req => O.saveFunction(req, req.params.id, req.body || {})));
r.delete('/obs-functions/:id', requirePerm('obs.manage'), ah(req => O.deleteFunction(req, req.params.id)));
r.get('/obs-roles', requirePerm('obs.view'), ah(req => O.roles(req.orgId, req.query.date || undefined)));
r.get('/obs-roles/:id', requirePerm('obs.view'), ah(req => O.role(req.orgId, req.params.id)));
r.post('/obs-roles', requirePerm('obs.manage'), ah(req => O.saveRole(req, null, req.body || {})));
r.put('/obs-roles/:id', requirePerm('obs.manage'), ah(req => O.saveRole(req, req.params.id, req.body || {})));
r.delete('/obs-roles/:id', requirePerm('obs.manage'), ah(req => O.deleteRole(req, req.params.id)));
r.post('/obs-assignments', requirePerm('obs.manage'), ah(req => O.saveAssignment(req, null, req.body || {})));
r.put('/obs-assignments/:id', requirePerm('obs.manage'), ah(req => O.saveAssignment(req, req.params.id, req.body || {})));
r.delete('/obs-assignments/:id', requirePerm('obs.manage'), ah(req => O.deleteAssignment(req, req.params.id)));
r.get('/obs-views', requirePerm('obs.view'), ah(req => O.views(req.orgId, req.query.date || undefined)));
r.get('/obs-pickers', requirePerm('projects.view'), ah(req => O.pickers(req.orgId)));
r.get('/obs-resolve', requirePerm('projects.view'), ah(req => O.resolve(req.orgId, req.query.assignee)));
r.get('/racsi/mp/:id', requirePerm('governance.view'), ah(req => O.racsiMatrix(req.orgId, req.params.id, req.lang)));
r.put('/racsi/mp/:id/:stepId', requirePerm('governance.manage'), ah(req => O.saveRacsiRow(req, req.params.id, req.params.stepId, req.body?.cells || {})));
export default r;
