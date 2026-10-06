import { Router } from 'express';
import { ah, parseMl, projectOf } from '../lib/http.js';
import { all, one, run, tx } from '../db.js';
import { uuid, now, S, J, HttpError, ml, pick } from '../lib/util.js';
import { requirePerm, has, clearPermCache, permissionCatalog, defaultGrants } from '../rbac.js';
import { audit } from '../audit.js';
import { checkQuota } from '../entitlements.js';
import { hashPassword } from '../auth.js';
import { getLicenceProvider } from '../licensing/LicenceProvider.js';
import { provisionOrg, instantiateProject, processPlan, insertRecord } from '../services/projects.js';
import { applyPlan, applyAfter } from '../services/blueprints.js';
import { latestPublished } from '../services/design.js';
import { draftProject, scoreComplexity } from '../services/creation.js';
import * as cat from '../catalog.js';

const r = Router();
const mlBody = v => S(ml(v));

// ------------------------------------------------------------------ Tenancy tree (FR-DA-TEN-12)
r.get('/tenancy/tree', requirePerm('projects.view'), ah(req => {
  const home = req.user.org_id ? one(`SELECT group_id FROM organizations WHERE id=?`, req.user.org_id) : null;
  const orgs = req.user.is_platform ? all(`SELECT * FROM organizations ORDER BY segment, sector`)
    : all(`SELECT * FROM organizations WHERE id=? OR (group_id IS NOT NULL AND group_id=? AND ?=1)`, req.user.org_id, home?.group_id ?? '__none__', has(req, 'group.view') ? 1 : 0);
  const groups = all(`SELECT * FROM groups_`).map(parseMl).filter(g => orgs.some(o => o.group_id === g.id));
  const projects = all(`SELECT id, org_id, name, focus, segment, mode, track, status, progress, plan_year FROM projects WHERE org_id IN (${orgs.map(() => '?').join(',') || "''"})`, ...orgs.map(o => o.id)).map(parseMl);
  const tree = [
    ...groups.map(g => ({ ...g, kind: 'group', organizations: orgs.filter(o => o.group_id === g.id).map(o => ({ ...parseMl(o), projects: projects.filter(p => p.org_id === o.id) })) })),
    { kind: 'independent', organizations: orgs.filter(o => !o.group_id).map(o => ({ ...parseMl(o), projects: projects.filter(p => p.org_id === o.id) })) },
  ];
  return { tree, table: orgs.map(o => ({ group: o.group_id ? groups.find(g => g.id === o.group_id)?.name : null, groupYes: !!o.group_id, org: parseMl(o), sector: o.sector, segment: o.segment, records: projects.filter(p => p.org_id === o.id).length, readOnly: !req.user.is_platform && o.id !== req.user.org_id })) };
}));

// ------------------------------------------------------------------ Groups (FR-DA-TEN-01..03)
r.get('/groups', ah(() => all(`SELECT g.*, (SELECT COUNT(*) FROM organizations o WHERE o.group_id=g.id) orgs FROM groups_ g`).map(parseMl)));
r.post('/groups', requirePerm('hierarchy.manage'), ah(req => {
  const id = uuid(); run(`INSERT INTO groups_(id,name,description,benchmark_sharing,created_at) VALUES(?,?,?,1,?)`, id, mlBody(req.body.name), mlBody(req.body.description || ''), now());
  audit(req, 'Group', id, 'create', null, req.body); return parseMl(one(`SELECT * FROM groups_ WHERE id=?`, id));
}));
r.put('/groups/:id', requirePerm('hierarchy.manage'), ah(req => {
  const g = one(`SELECT * FROM groups_ WHERE id=?`, req.params.id); if (!g) throw new HttpError(404, 'err.notFound');
  if (!req.user.is_platform && one(`SELECT group_id FROM organizations WHERE id=?`, req.user.org_id)?.group_id !== g.id) throw new HttpError(404, 'err.notFound');
  run(`UPDATE groups_ SET name=?, description=? WHERE id=?`, mlBody(req.body.name ?? J(g.name)), mlBody(req.body.description ?? J(g.description)), g.id);
  audit(req, 'Group', g.id, 'update', parseMl(g), req.body); return parseMl(one(`SELECT * FROM groups_ WHERE id=?`, g.id));
}));
// Deleting a Group never deletes its Organizations: they become Independent (FR-DA-TEN-03).
r.delete('/groups/:id', requirePerm('hierarchy.manage'), ah(req => {
  if (!req.user.is_platform) throw new HttpError(403, 'err.platformOnly');
  run(`UPDATE organizations SET group_id=NULL WHERE group_id=?`, req.params.id); run(`DELETE FROM groups_ WHERE id=?`, req.params.id);
  audit(req, 'Group', req.params.id, 'delete'); return { ok: true };
}));

// ------------------------------------------------------------------ Organizations
r.get('/organizations', ah(req => {
  const rows = req.user.is_platform ? all(`SELECT o.*, g.name group_name FROM organizations o LEFT JOIN groups_ g ON g.id=o.group_id`) : all(`SELECT o.*, g.name group_name FROM organizations o LEFT JOIN groups_ g ON g.id=o.group_id WHERE o.id=?`, req.user.org_id);
  return rows.map(o => ({ ...parseMl(o), groupYes: !!o.group_id }));
}));
r.post('/organizations', requirePerm('hierarchy.manage'), ah(req => {
  if (!req.user.is_platform) throw new HttpError(403, 'err.platformOnly');
  const b = req.body || {}; const domain = String(b.email_domain || '').toLowerCase().trim() || null;
  if (domain && one(`SELECT id FROM organizations WHERE email_domain=?`, domain)) throw new HttpError(409, 'err.domainTaken', { domain });
  const id = uuid();
  tx(() => {
    run(`INSERT INTO organizations(id,group_id,name,sector,segment,employees,sme_segment,country,city,default_language,email_domain,benchmark_sharing,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?)`,
      id, b.group_id || null, mlBody(b.name), b.sector || null, b.segment || 'LARGE', b.employees || null, smeSegment(b.employees), b.country || null, b.city || null, b.default_language || 'en', domain, now());
    provisionOrg(id, { packId: b.pack_id || (b.segment === 'SME' ? 'SME-ESS' : 'PK-01'), starterTeam: !!b.starter_team, domain, password: b.initial_password || 'Welcome#2026', lang: b.default_language || 'en', seats: Number(b.seats || 100) });
  });
  clearPermCache(); audit(req, 'Organization', id, 'create', null, b);
  return parseMl(one(`SELECT * FROM organizations WHERE id=?`, id));
}));
function smeSegment(n) { n = Number(n || 0); if (!n) return null; return n <= 10 ? 'Micro' : n <= 50 ? 'Small' : n <= 250 ? 'Medium' : null; }
r.put('/organizations/:id', requirePerm('hierarchy.manage'), ah(req => {
  const o = one(`SELECT * FROM organizations WHERE id=?`, req.params.id);
  if (!o || (!req.user.is_platform && o.id !== req.user.org_id)) throw new HttpError(404, 'err.notFound');
  const b = req.body || {};
  run(`UPDATE organizations SET name=?, group_id=?, sector=?, segment=?, employees=?, sme_segment=?, country=?, city=?, default_language=? WHERE id=?`,
    mlBody(b.name ?? J(o.name)), req.user.is_platform ? (b.group_id === undefined ? o.group_id : b.group_id || null) : o.group_id, b.sector ?? o.sector, b.segment ?? o.segment,
    b.employees ?? o.employees, smeSegment(b.employees ?? o.employees), b.country ?? o.country, b.city ?? o.city, b.default_language ?? o.default_language, o.id);
  audit(req, 'Organization', o.id, 'update', parseMl(o), b); return parseMl(one(`SELECT * FROM organizations WHERE id=?`, o.id));
}));
// Cascade: projects, users and AI activation state of the Organization (FR-DA-TEN-03).
r.delete('/organizations/:id', requirePerm('hierarchy.manage'), ah(req => {
  if (!req.user.is_platform) throw new HttpError(403, 'err.platformOnly');
  run(`DELETE FROM ai_activation WHERE org_id=?`, req.params.id); run(`DELETE FROM organizations WHERE id=?`, req.params.id);
  audit(req, 'Organization', req.params.id, 'delete'); return { ok: true };
}));

// ------------------------------------------------------------------ Projects
r.get('/projects', requirePerm('projects.view'), ah(req => all(`SELECT p.*, (SELECT COUNT(*) FROM e2e_instances e WHERE e.project_id=p.id) e2e_count,
  (SELECT COUNT(*) FROM task_instances t WHERE t.project_id=p.id) task_count, (SELECT COUNT(*) FROM task_instances t WHERE t.project_id=p.id AND t.status='Completed') task_done
  FROM projects p WHERE p.org_id=? ORDER BY p.plan_year DESC, p.focus`, req.orgId).map(parseMl)));
r.get('/projects/:id', requirePerm('projects.view'), ah(req => parseMl(projectOf(req, req.params.id))));
r.post('/projects/score', requirePerm('projects.view'), ah(req => scoreComplexity(req.body?.values || {}, req.body?.vertical)));
r.post('/projects/ai-draft', requirePerm('projects.create'), ah(req => draftProject(req, req.body?.description || '')));
/** One entry point, three creation modes: catalog, manual, ai (FR-DA-PCM-01..05). */
r.post('/projects', requirePerm('projects.create'), ah(req => {
  const b = req.body || {}; checkQuota(req.orgId, 'projects');
  const mode = ['catalog', 'manual', 'ai'].includes(b.creation_mode) ? b.creation_mode : 'manual';
  const org = one(`SELECT * FROM organizations WHERE id=?`, req.orgId);
  const tplRec = b.template_id ? one(`SELECT * FROM records WHERE id=? AND entity='ProjectTemplate' AND (org_id IS NULL OR org_id=?)`, b.template_id, req.orgId) : null;
  const tpl = tplRec ? J(tplRec.data) : null;
  if (mode === 'catalog' && (!tpl || tpl.status !== 'Published')) throw new HttpError(422, 'err.templateNotPublished');
  const vertical = b.vertical_id ?? tpl?.vertical_id ?? org.sector;
  const pMode = b.mode || tpl?.mode || (org.segment === 'SME' ? 'SME' : 'Full');
  const score = scoreComplexity(b.complexity || {}, vertical);
  const track = b.track || tpl?.track || (pMode === 'SME' ? score.recommendedTrack : null);
  if (pMode === 'SME' && b.track && b.track !== score.recommendedTrack && !String(b.track_justification || '').trim()) throw new HttpError(422, 'err.trackOverrideJustification');
  const id = uuid(); const t = now();
  tx(() => {
    run(`INSERT INTO projects(id,org_id,name,description,focus,segment,mode,track,vertical_id,plan_year,status,template_id,creation_mode,complexity,progress,start_date,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?)`,
      id, req.orgId, mlBody(b.name || tpl?.name || 'Project'), mlBody(b.description || tpl?.description || ''), b.focus || tpl?.focus || 'All', org.segment, pMode, track, vertical, Number(b.plan_year || new Date().getFullYear()), 'Active', b.template_id || null, mode, score.score, b.start_date || t, req.user.id, t, t);
    const project = one(`SELECT * FROM projects WHERE id=?`, id);
    let phases = processPlan({ mode: pMode, track, vertical });
    if (Array.isArray(b.e2e) && b.e2e.length) phases = phases.map(p => ({ ...p, e2e: p.e2e.filter(x => b.e2e.includes(x)) }));
    // The template's blueprint is applied exactly (FR-DA-PTB-06): included phases, processes, tasks and steps only.
    const plan = tpl ? applyPlan(tpl, phases) : null; if (plan) phases = plan.phases;
    const users = all(`SELECT u.id, (SELECT group_concat(r.name,'|') FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id) rn FROM users u WHERE u.org_id=?`, req.orgId)
      .map(u => ({ id: u.id, roleNames: String(u.rn || '') }));
    instantiateProject(project, { phases, users, level: 0, excludedTasks: plan?.excludedTasks || null });
    if (plan) applyAfter(req, project, tplRec, tpl, plan.bp);
    // The project is bound to the latest published process design release (FR-DA-PDM).
    run(`UPDATE projects SET design_release_id=? WHERE id=?`, latestPublished(req.orgId), id);
    insertRecord(uuid(), 'ComplexityScore', req.orgId, id, null, { values: score.values, score: score.score, recommended_track: score.recommendedTrack, chosen_track: track, override_justification: b.track_justification || null });
    if (tplRec) run(`UPDATE records SET data=json_set(data,'$.use_count',coalesce(json_extract(data,'$.use_count'),0)+1) WHERE id=?`, tplRec.id);
  });
  audit(req, 'Project', id, 'create', null, { creation_mode: mode, template_id: b.template_id || null, template_version: tplRec?.version || null, ai_accepted: b.ai_accepted || null, complexity: score.score, track }, b.track_justification);
  return parseMl(one(`SELECT * FROM projects WHERE id=?`, id));
}));
r.put('/projects/:id', requirePerm('projects.manage'), ah(req => {
  const p = projectOf(req, req.params.id); const b = req.body || {};
  const closing = b.status === 'Closed' && p.status !== 'Closed';
  run(`UPDATE projects SET name=?, description=?, focus=?, status=?, plan_year=?, updated_at=? WHERE id=?`, mlBody(b.name ?? J(p.name)), mlBody(b.description ?? J(p.description)), b.focus ?? p.focus, b.status ?? p.status, b.plan_year ?? p.plan_year, now(), p.id);
  audit(req, 'Project', p.id, 'update', parseMl(p), b, b._justification);
  return { ...parseMl(one(`SELECT * FROM projects WHERE id=?`, p.id)), rexPrompt: closing }; // REX prompt after closure (FR-DA-REX-01/08)
}));
r.delete('/projects/:id', requirePerm('projects.manage'), ah(req => { const p = projectOf(req, req.params.id); run(`DELETE FROM projects WHERE id=?`, p.id); audit(req, 'Project', p.id, 'delete', parseMl(p)); return { ok: true }; }));
/** Save an existing project as a new template (FR-DA-PTC-05). */
r.post('/projects/:id/save-as-template', requirePerm('templates.manage'), ah(req => {
  const p = projectOf(req, req.params.id);
  const phases = all(`SELECT phase, group_concat(e2e_id) e FROM e2e_instances WHERE project_id=? GROUP BY phase ORDER BY phase`, p.id).map(x => ({ no: x.phase, e2e: x.e.split(',') }));
  const id = uuid(); insertRecord(id, 'ProjectTemplate', req.orgId, null, null, { name: J(p.name), description: J(p.description), scope: p.vertical_id ? 'Vertical' : 'Universal', vertical_id: p.vertical_id, mode: p.mode, track: p.track, focus: p.focus, status: 'Draft', phases, use_count: 0 }, req.user.id);
  audit(req, 'ProjectTemplate', id, 'create', null, { from: p.id }); return { id };
}));

// ------------------------------------------------------------------ OBS (FR-DA-TEN-04..06, 10, 16)
r.get('/obs', ah(req => all(`SELECT n.*, (SELECT COUNT(*) FROM obs_members m WHERE m.node_id=n.id) members,
  (SELECT COUNT(*) FROM records r WHERE r.org_id=n.org_id AND json_extract(r.data,'$.obs_node')=n.id) items FROM obs_nodes n WHERE n.org_id=? ORDER BY n.created_at`, req.orgId).map(parseMl)));
r.post('/obs', requirePerm('hierarchy.manage'), ah(req => {
  checkQuota(req.orgId, 'obs'); const b = req.body || {};
  if (b.parent_id) validateParent(req, null, b.parent_id, b.project_id);
  const id = uuid(); run(`INSERT INTO obs_nodes(id,org_id,project_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?,?)`, id, req.orgId, b.project_id || null, b.parent_id || null, mlBody(b.name), b.type || 'Team', now());
  audit(req, 'ObsNode', id, 'create', null, b); return parseMl(one(`SELECT * FROM obs_nodes WHERE id=?`, id));
}));
function validateParent(req, nodeId, parentId, projectId) {
  const parent = one(`SELECT * FROM obs_nodes WHERE id=? AND org_id=?`, parentId, req.orgId);
  if (!parent) throw new HttpError(404, 'err.notFound');
  if ((parent.project_id || null) !== (projectId || null) && parent.project_id) throw new HttpError(422, 'err.obsCrossTree');
  if (!projectId && parent.project_id) throw new HttpError(422, 'err.obsCrossTree');
  let cur = parent; while (cur) { if (cur.id === nodeId) throw new HttpError(422, 'err.obsCycle'); cur = cur.parent_id ? one(`SELECT * FROM obs_nodes WHERE id=?`, cur.parent_id) : null; }
}
r.put('/obs/:id', requirePerm('hierarchy.manage'), ah(req => {
  const n = one(`SELECT * FROM obs_nodes WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!n) throw new HttpError(404, 'err.notFound');
  const b = req.body || {}; if (b.parent_id) validateParent(req, n.id, b.parent_id, n.project_id);
  run(`UPDATE obs_nodes SET name=?, type=?, parent_id=? WHERE id=?`, mlBody(b.name ?? J(n.name)), b.type ?? n.type, b.parent_id === undefined ? n.parent_id : b.parent_id || null, n.id);
  audit(req, 'ObsNode', n.id, 'update', parseMl(n), b); return parseMl(one(`SELECT * FROM obs_nodes WHERE id=?`, n.id));
}));
// Children are re-parented to the deleted node's parent so references stay valid (FR-DA-TEN-05).
r.delete('/obs/:id', requirePerm('hierarchy.manage'), ah(req => {
  const n = one(`SELECT * FROM obs_nodes WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!n) throw new HttpError(404, 'err.notFound');
  run(`UPDATE obs_nodes SET parent_id=? WHERE parent_id=?`, n.parent_id, n.id); run(`DELETE FROM obs_nodes WHERE id=?`, n.id);
  audit(req, 'ObsNode', n.id, 'delete', parseMl(n)); return { ok: true };
}));
r.get('/obs/:id/members', ah(req => all(`SELECT m.*, u.name, u.email FROM obs_members m JOIN users u ON u.id=m.user_id JOIN obs_nodes n ON n.id=m.node_id WHERE m.node_id=? AND n.org_id=?`, req.params.id, req.orgId)));
r.post('/obs/:id/members', requirePerm('hierarchy.manage'), ah(req => {
  const n = one(`SELECT id FROM obs_nodes WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!n) throw new HttpError(404, 'err.notFound');
  const u = one(`SELECT id FROM users WHERE id=? AND org_id=?`, req.body.user_id, req.orgId); if (!u) throw new HttpError(404, 'err.notFound');
  const id = uuid(); run(`INSERT INTO obs_members(id,node_id,user_id,role_id,node_role) VALUES(?,?,?,?,?)`, id, n.id, u.id, req.body.role_id || null, req.body.node_role || ''); return { id };
}));
r.delete('/obs/:id/members/:mid', requirePerm('hierarchy.manage'), ah(req => { run(`DELETE FROM obs_members WHERE id=? AND node_id IN (SELECT id FROM obs_nodes WHERE org_id=?)`, req.params.mid, req.orgId); return { ok: true }; }));

// ------------------------------------------------------------------ Users (FR-DA-RBAC-01)
r.get('/users', requirePerm('users.manage'), ah(req => all(`SELECT u.id, u.email, u.name, u.title, u.language, u.active, u.last_login, (SELECT group_concat(role_id) FROM user_roles WHERE user_id=u.id) roles FROM users u WHERE u.org_id=? ORDER BY u.name`, req.orgId)
  .map(u => ({ ...u, roles: u.roles ? u.roles.split(',') : [] }))));
r.post('/users', requirePerm('users.manage'), ah(req => {
  const b = req.body || {};
  if (!getLicenceProvider(req.orgId).canCreateUser()) throw new HttpError(409, 'err.licenceSeats');  // RULE-LIC-003
  if (!b.email || !b.name || !b.password) throw new HttpError(422, 'err.required', { field: !b.email ? 'email' : !b.name ? 'name' : 'password' });
  const id = uuid();
  run(`INSERT INTO users(id,org_id,email,name,password_hash,language,title,created_at) VALUES(?,?,?,?,?,?,?,?)`, id, req.orgId, String(b.email).toLowerCase(), b.name, hashPassword(b.password), b.language || null, b.title || '', now());
  for (const role of b.roles || []) run(`INSERT OR IGNORE INTO user_roles(user_id,role_id) VALUES(?,?)`, id, role);
  clearPermCache(); audit(req, 'User', id, 'create', null, { email: b.email, roles: b.roles }); return { id };
}));
r.put('/users/:id', requirePerm('users.manage'), ah(req => {
  const u = one(`SELECT * FROM users WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!u) throw new HttpError(404, 'err.notFound');
  const b = req.body || {};
  run(`UPDATE users SET name=?, title=?, language=?, active=? WHERE id=?`, b.name ?? u.name, b.title ?? u.title, b.language ?? u.language, b.active === undefined ? u.active : (b.active ? 1 : 0), u.id);
  if (b.password) run(`UPDATE users SET password_hash=? WHERE id=?`, hashPassword(b.password), u.id);
  if (Array.isArray(b.roles)) { run(`DELETE FROM user_roles WHERE user_id=?`, u.id); for (const role of b.roles) run(`INSERT OR IGNORE INTO user_roles(user_id,role_id) VALUES(?,?)`, u.id, role); }
  clearPermCache(); audit(req, 'User', u.id, 'update', { name: u.name, active: u.active }, { name: b.name, active: b.active, roles: b.roles }); return { ok: true };
}));
r.delete('/users/:id', requirePerm('users.manage'), ah(req => { run(`DELETE FROM users WHERE id=? AND org_id=?`, req.params.id, req.orgId); audit(req, 'User', req.params.id, 'delete'); clearPermCache(); return { ok: true }; }));

// ------------------------------------------------------------------ Roles & Permission Matrix (FR-DA-RBAC-02)
r.get('/roles', ah(() => all(`SELECT * FROM roles ORDER BY sort`).map(parseMl)));
r.get('/permissions/matrix', requirePerm('permissions.manage'), ah(() => ({
  roles: all(`SELECT * FROM roles ORDER BY sort`).map(parseMl), permissions: all(`SELECT * FROM permissions ORDER BY sort, code`),
  grants: all(`SELECT role_id, code, granted, customized FROM role_permissions`),
})));
r.put('/permissions/matrix', requirePerm('permissions.manage'), ah(req => {
  const { role_id, code, granted } = req.body || {};
  if (!one(`SELECT 1 x FROM permissions WHERE code=?`, code) || !one(`SELECT 1 x FROM roles WHERE id=?`, role_id)) throw new HttpError(404, 'err.notFound');
  run(`INSERT INTO role_permissions(role_id,code,granted,customized) VALUES(?,?,?,1) ON CONFLICT(role_id,code) DO UPDATE SET granted=excluded.granted, customized=1`, role_id, code, granted ? 1 : 0);
  clearPermCache(); audit(req, 'Permission', `${role_id}:${code}`, 'update', null, { granted: !!granted }); return { ok: true }; // effective immediately
}));
r.post('/permissions/matrix/reset', requirePerm('permissions.manage'), ah(req => {
  const role = req.body?.role_id; const g = defaultGrants(role);
  for (const p of permissionCatalog()) run(`UPDATE role_permissions SET granted=?, customized=0 WHERE role_id=? AND code=?`, g.has(p.code) ? 1 : 0, role, p.code);
  clearPermCache(); audit(req, 'Permission', role, 'reset'); return { ok: true };
}));
export default r;
