// Groups, organizations, projects, OBS and users (FR-DA-TEN, FR-DA-RBAC-01, FR-DA-PCM).
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { all, get, run, uid, now, J, P, tx } from '../db.js';
import { requirePerm, assertPerm, can } from '../auth.js';
import { h, send, row, rows, bad, notFound, forbidden, requireOrg, loadProject, orgAccess, HttpError } from '../http.js';
import { orgConfig, computePrice, entitledMps } from '../packs.js';
import { createProject, scoreComplexity, draftFromDescription } from '../services/lifecycle.js';
import { audit, snapshot } from '../services/audit.js';
import { ROLES } from '../permissions.js';
import { catalog } from '../catalog/store.js';
import { config } from '../config.js';

const r = Router();

function projectBrief(p) {
  const phase = get(`SELECT e2e_id, status FROM phases WHERE project_id=? AND status IN ('Active','AtGate','OnHold') ORDER BY seq LIMIT 1`, p.id);
  const alerts = get('SELECT COUNT(*) n FROM alerts WHERE project_id=? AND dismissed=0 AND read_at IS NULL', p.id).n;
  return { id: p.id, org_id: p.org_id, code: p.code, name: P(p.name), ms_type: p.ms_type, mode: p.mode, track: p.track, vertical: p.vertical, status: p.status, progress: p.progress_cache, start_date: p.start_date, end_date: p.end_date, scenario: p.scenario, currentPhase: phase?.e2e_id || null, phaseStatus: phase?.status || null, unreadAlerts: alerts, standards: P(p.standards) };
}

r.get('/tree', requirePerm('tenancy.view', 'dashboard.view'), h((req, res) => {
  const orgs = all('SELECT * FROM organizations ORDER BY size DESC, short_code').filter(o => orgAccess(req, o.id));
  const groups = all('SELECT * FROM groups_ ORDER BY name');
  const projs = all('SELECT * FROM projects ORDER BY code');
  const byOrg = {};
  for (const p of projs) (byOrg[p.org_id] ||= []).push(p);
  const orgOut = (o) => ({ id: o.id, name: P(o.name), code: o.short_code, sector: o.sector, size: o.size, access: orgAccess(req, o.id), groupId: o.group_id, projects: (byOrg[o.id] || []).map(p => ({ id: p.id, code: p.code, name: P(p.name), ms_type: p.ms_type, mode: p.mode, progress: p.progress_cache, scenario: p.scenario })) });
  const out = groups.map(g => ({ id: g.id, name: P(g.name), description: P(g.description), orgs: orgs.filter(o => o.group_id === g.id).map(orgOut) })).filter(g => g.orgs.length);
  const independent = orgs.filter(o => !o.group_id).map(orgOut);
  send(req, res, { groups: out, independent });
}));

// ---- Groups (platform administration)
r.get('/groups', requirePerm('tenancy.view'), h((req, res) => {
  const list = rows(all('SELECT * FROM groups_ ORDER BY name')).filter(g => req.user.is_platform_admin || g.id === req.user.group_id);
  send(req, res, list.map(g => ({ ...g, orgCount: get('SELECT COUNT(*) n FROM organizations WHERE group_id=?', g.id).n })));
}));
r.post('/groups', requirePerm('tenancy.manage'), h((req, res) => {
  if (!req.user.is_platform_admin) throw forbidden();
  if (!req.body?.name) throw bad('NAME_REQUIRED', 'Name is required.');
  const id = uid();
  run('INSERT INTO groups_(id,name,description,created_at) VALUES(?,?,?,?)', id, J({ [req.lang]: req.body.name }), J({ [req.lang]: req.body.description || '' }), now());
  audit(req, null, 'group', id, 'create', null, req.body, null);
  res.status(201).json({ id });
}));
r.put('/groups/:id', requirePerm('tenancy.manage'), h((req, res) => {
  if (!req.user.is_platform_admin) throw forbidden();
  const g = get('SELECT * FROM groups_ WHERE id=?', req.params.id);
  if (!g) throw notFound('Group');
  const name = { ...P(g.name), ...(req.body.name ? { [req.lang]: req.body.name } : {}) };
  run('UPDATE groups_ SET name=?, description=? WHERE id=?', J(name), J({ ...P(g.description), ...(req.body.description !== undefined ? { [req.lang]: req.body.description } : {}) }), g.id);
  audit(req, null, 'group', g.id, 'update', row(g), req.body, null);
  res.json({ ok: true });
}));
r.delete('/groups/:id', requirePerm('tenancy.manage'), h((req, res) => {
  if (!req.user.is_platform_admin) throw forbidden();
  const n = get('SELECT COUNT(*) n FROM organizations WHERE group_id=?', req.params.id).n;
  if (n) throw new HttpError(409, 'GROUP_NOT_EMPTY', 'Move or delete the organizations of this group first.');
  run('DELETE FROM groups_ WHERE id=?', req.params.id);
  audit(req, null, 'group', req.params.id, 'delete', null, null, null);
  res.json({ ok: true });
}));

// ---- Organizations
r.get('/orgs/:id', requirePerm('tenancy.view', 'dashboard.view'), h((req, res) => {
  const access = requireOrg(req, req.params.id);
  const o = row(get('SELECT * FROM organizations WHERE id=?', req.params.id));
  const cfg = orgConfig(o);
  const usage = { users: get('SELECT COUNT(*) n FROM users WHERE org_id=?', o.id).n, projects: get('SELECT COUNT(*) n FROM projects WHERE org_id=?', o.id).n, obsNodes: get('SELECT COUNT(*) n FROM obs_nodes WHERE org_id=?', o.id).n, customAi: get('SELECT COUNT(*) n FROM ai_usecases WHERE org_id=? AND custom=1', o.id).n };
  send(req, res, {
    ...o, access, group: o.group_id ? row(get('SELECT id, name FROM groups_ WHERE id=?', o.group_id)) : null, config: cfg, usage, entitledMps: entitledMps(o).size,
    price: can(req, 'config.manage') ? computePrice(o) : null,
    verticals: rows(all('SELECT * FROM vertical_activations WHERE org_id=?', o.id)),
    onboarding: row(get('SELECT * FROM onboarding_plans WHERE org_id=?', o.id)) || null,
    projects: all('SELECT * FROM projects WHERE org_id=? ORDER BY code', o.id).map(projectBrief),
  });
}));
r.post('/orgs', requirePerm('tenancy.manage'), h((req, res) => {
  if (!req.user.is_platform_admin) throw forbidden();
  const b = req.body || {};
  if (!b.name || !b.sector || !b.size || !b.emailDomain) throw bad('FIELDS_REQUIRED', 'Name, sector, size and e-mail domain are required.');
  if (!catalog().segById[b.sector] && b.sector !== 'UNI') throw bad('BAD_SECTOR', 'Unknown vertical.');
  if (get('SELECT 1 FROM organizations WHERE email_domain=?', b.emailDomain)) throw new HttpError(409, 'DOMAIN_TAKEN', 'This e-mail domain is already used.');
  const id = uid();
  const code = (b.code || b.name.replace(/[^A-Za-z]/g, '').slice(0, 6)).toUpperCase();
  tx(() => {
    run(`INSERT INTO organizations(id,group_id,name,short_code,sector,size,sme_class,employees,country,city,default_lang,email_domain,benchmark_sharing,deployment_mode,pack,industry_packs,capability_packs,addons,compliance_standards,support_tier,seats,currency,created_at,logo_text)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?,?,?,?,?,?)`, id, b.groupId || null, J({ [req.lang]: b.name }), code, b.sector, b.size, b.size === 'SME' ? (+b.employees < 10 ? 'Micro' : +b.employees < 50 ? 'Small' : 'Medium') : null,
    +b.employees || null, b.country || null, J({ [req.lang]: b.city || '' }), b.lang || 'en', b.emailDomain, 'DEP-1', b.size === 'SME' ? 'DMS-SME' : 'DMS-PRO', J([]), J([]), J([]), J([]), 'Standard', 25, 'USD', now(), code.slice(0, 3));
    run('INSERT INTO obs_nodes(id,org_id,project_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?,?)', uid(), id, null, null, J({ [req.lang]: b.name }), 'Organization', now());
    for (const t of ['STEP_OVERDUE', 'KPI_OFF_TARGET', 'NC_CRITICAL', 'ACTION_OVERDUE', 'DOC_REVIEW_DUE', 'GATE_PENDING']) run('INSERT INTO alert_settings(org_id,type,enabled) VALUES(?,?,1)', id, t);
    // Tenant provisioning: the organization's first administrator
    if (b.adminEmail) run('INSERT INTO users(id,org_id,email,name,password_hash,roles,lang,is_platform_admin,status,created_at) VALUES(?,?,?,?,?,?,?,0,?,?)', uid(), id, b.adminEmail.toLowerCase(), b.adminName || 'Administrator', bcrypt.hashSync(b.adminPassword || config.demoPassword, 10), J(['tenant_admin']), b.lang || 'en', 'Active', now());
    const c = catalog();
    for (const a of c.aiUseCases) run('INSERT INTO ai_usecases(id,org_id,code,name,tier,module,trigger_,expected_output,checkpoint,task_type,risk_level,linked_step,linked_mp,custom,active,approval,version,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,0,1,?,1,?)',
      uid(), id, a.id, J(a.name), a.tier, null, null, J(a.name), J(a.checkpoint), J(a.taskType), a.risk, a.step, a.mp, a.approval, now());
    for (const b2 of c.rules) run('INSERT INTO business_rules(id,org_id,code,step_ref,mp_id,condition,action_code,action,rule_type,severity,owner_role,active,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?)', uid(), id, b2.id, b2.step, b2.mp, J(b2.condition), b2.actionId, J(b2.action), b2.type, 'Medium', c.mpById[b2.mp]?.ownerRoleCode || 'ims_manager', now());
    for (const ct of c.controls) run('INSERT INTO controls(id,org_id,code,name,description,type,coso,frequency,owner_role,effectiveness,standard,step_refs,mp_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', uid(), id, ct.id, J(ct.name), J(ct.description), ct.type, ct.coso, 'Quarterly', 'ims_manager', 'Not tested', 'ISO 9001', J(ct.steps), ct.steps[0]?.split('.')[0] || null, now());
    audit(req, id, 'organization', id, 'create', null, b, null);
  });
  res.status(201).json({ id });
}));
r.put('/orgs/:id', requirePerm('tenancy.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  const b = req.body || {};
  const name = b.name ? { ...P(o.name), [req.lang]: b.name } : P(o.name);
  run('UPDATE organizations SET name=?, employees=COALESCE(?,employees), country=COALESCE(?,country), default_lang=COALESCE(?,default_lang), benchmark_sharing=COALESCE(?,benchmark_sharing) WHERE id=?',
    J(name), b.employees ?? null, b.country ?? null, b.lang ?? null, b.benchmarkSharing === undefined ? null : (b.benchmarkSharing ? 1 : 0), o.id);
  audit(req, o.id, 'organization', o.id, 'update', row(o), b, null);
  snapshot(req, o.id, 'organization', o.id, row(get('SELECT * FROM organizations WHERE id=?', o.id)), null);
  res.json({ ok: true });
}));
r.delete('/orgs/:id', requirePerm('tenancy.manage'), h((req, res) => {
  if (!req.user.is_platform_admin) throw forbidden();
  if (req.body?.confirm !== 'DELETE') throw bad('CONFIRM_REQUIRED', 'Send {"confirm":"DELETE"} to delete an organization and all its data.');
  run('DELETE FROM organizations WHERE id=?', req.params.id);
  audit(req, null, 'organization', req.params.id, 'delete', null, null, null);
  res.json({ ok: true });
}));

// ---- Projects
r.get('/orgs/:id/projects', requirePerm('tenancy.view', 'execution.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  send(req, res, all('SELECT * FROM projects WHERE org_id=? ORDER BY code', req.params.id).map(projectBrief));
}));
r.post('/orgs/:id/projects/score', requirePerm('project.create'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  send(req, res, scoreComplexity(req.body?.levels || {}, o.sector));
}));
r.post('/orgs/:id/projects/draft', requirePerm('project.create'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = row(get('SELECT * FROM organizations WHERE id=?', req.params.id));
  const d = draftFromDescription(o, req.body?.description || '');
  run('INSERT INTO ai_usage_log(id,org_id,project_id,usecase_id,record_type,record_id,user_id,outcome,confidence,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)', uid(), o.id, null, null, 'project-draft', null, req.user.id, 'Pending', d.confidence, 'rules', now());
  send(req, res, d);
}));
r.get('/orgs/:id/templates', requirePerm('project.create', 'templates.manage'), h((req, res) => {
  requireOrg(req, req.params.id);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  const mode = o.size === 'SME' ? 'SME' : req.query.mode || null;
  const list = rows(all(`SELECT * FROM project_templates WHERE status='Published' AND (vertical IS NULL OR vertical=?) ${mode ? 'AND mode=?' : ''} ORDER BY vertical IS NULL, code`, o.sector, ...(mode ? [mode] : [])));
  send(req, res, list);
}));
r.post('/orgs/:id/projects', requirePerm('project.create'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = row(get('SELECT * FROM organizations WHERE id=?', req.params.id));
  const id = createProject(req, o, req.body || {});
  res.status(201).json({ id });
}));
r.get('/projects/:id', requirePerm('execution.view', 'dashboard.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const brief = projectBrief(get('SELECT * FROM projects WHERE id=?', p.id));
  const counts = get(`SELECT COUNT(*) n, SUM(status='Done') done, SUM(status='InProgress') prog, SUM(status<>'Done' AND due_date < date('now')) overdue FROM step_exec WHERE project_id=?`, p.id);
  const org = row(get('SELECT id, name, short_code, sector, size FROM organizations WHERE id=?', p.org_id));
  send(req, res, { ...p, ...brief, org, counts, complexity: row(get('SELECT * FROM complexity_scores WHERE project_id=?', p.id)), access: orgAccess(req, p.org_id),
    template: p.template_id ? row(get('SELECT id, code, name, version FROM project_templates WHERE id=?', p.template_id)) : null,
    owner: p.owner_user ? get('SELECT id, name, email FROM users WHERE id=?', p.owner_user) : null });
}));
r.put('/projects/:id', requirePerm('project.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const b = req.body || {};
  const name = b.name ? { ...(p.name || {}), [req.lang]: b.name } : p.name;
  const desc = b.description !== undefined ? { ...(p.description || {}), [req.lang]: b.description } : p.description;
  if (b.status && !['Active', 'On hold', 'Closed', 'Cancelled'].includes(b.status)) throw bad('BAD_STATUS', 'Unknown status.');
  run('UPDATE projects SET name=?, description=?, status=COALESCE(?,status), start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date) WHERE id=?', J(name), J(desc), b.status || null, b.startDate || null, b.endDate || null, p.id);
  audit(req, p.org_id, 'project', p.id, 'update', { name: p.name, status: p.status }, b, b.justification || null);
  snapshot(req, p.org_id, 'project', p.id, row(get('SELECT * FROM projects WHERE id=?', p.id)), b.justification || null);
  res.json({ ok: true });
}));
r.delete('/projects/:id', requirePerm('tenancy.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  if (req.body?.confirm !== 'DELETE') throw bad('CONFIRM_REQUIRED', 'Send {"confirm":"DELETE"} to delete a project and all its records.');
  run('DELETE FROM projects WHERE id=?', p.id);
  audit(req, p.org_id, 'project', p.id, 'delete', { code: p.code }, null, null);
  res.json({ ok: true });
}));

// ---- OBS
r.get('/orgs/:id/obs', requirePerm('tenancy.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const nodes = rows(all('SELECT * FROM obs_nodes WHERE org_id=? ORDER BY type, created_at', req.params.id));
  const members = all('SELECT m.node_id, m.role_in_node, u.id, u.name, u.email FROM obs_members m JOIN users u ON u.id = m.user_id WHERE m.org_id=?', req.params.id);
  send(req, res, nodes.map(n => ({ ...n, members: members.filter(m => m.node_id === n.id) })));
}));
r.post('/orgs/:id/obs', requirePerm('obs.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = row(get('SELECT * FROM organizations WHERE id=?', req.params.id));
  const n = get('SELECT COUNT(*) n FROM obs_nodes WHERE org_id=?', o.id).n;
  if (n >= orgConfig(o).quotas.obsNodes) throw new HttpError(402, 'QUOTA_EXCEEDED', 'OBS node quota reached.');
  const parent = get('SELECT * FROM obs_nodes WHERE id=? AND org_id=?', req.body?.parentId, o.id);
  if (!parent) throw bad('PARENT_REQUIRED', 'Choose a parent node.');
  if (!req.body?.name) throw bad('NAME_REQUIRED', 'Name is required.');
  const id = uid();
  run('INSERT INTO obs_nodes(id,org_id,project_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?,?)', id, o.id, null, parent.id, J({ [req.lang]: req.body.name }), req.body.type || 'Department', now());
  audit(req, o.id, 'obs', id, 'create', null, req.body, null);
  res.status(201).json({ id });
}));
r.put('/obs/:id', requirePerm('obs.manage'), h((req, res) => {
  const n = get('SELECT * FROM obs_nodes WHERE id=?', req.params.id);
  if (!n) throw notFound('Node');
  requireOrg(req, n.org_id, true);
  run('UPDATE obs_nodes SET name=?, type=COALESCE(?,type) WHERE id=?', J({ ...P(n.name), [req.lang]: req.body?.name || P(n.name)[req.lang] }), req.body?.type || null, n.id);
  if (Array.isArray(req.body?.members)) {
    run('DELETE FROM obs_members WHERE node_id=?', n.id);
    for (const m of req.body.members) {
      const u = get('SELECT id FROM users WHERE id=? AND org_id=?', m.userId, n.org_id);
      if (u) run('INSERT INTO obs_members(id,org_id,node_id,user_id,role_in_node) VALUES(?,?,?,?,?)', uid(), n.org_id, n.id, u.id, m.role || null);
    }
  }
  audit(req, n.org_id, 'obs', n.id, 'update', row(n), req.body, null);
  res.json({ ok: true });
}));
r.delete('/obs/:id', requirePerm('obs.manage'), h((req, res) => {
  const n = get('SELECT * FROM obs_nodes WHERE id=?', req.params.id);
  if (!n) throw notFound('Node');
  requireOrg(req, n.org_id, true);
  if (!n.parent_id) throw bad('ROOT_NODE', 'The organization root cannot be deleted.');
  if (get('SELECT 1 FROM obs_nodes WHERE parent_id=?', n.id)) throw new HttpError(409, 'HAS_CHILDREN', 'Delete or move the child nodes first.');
  run('DELETE FROM obs_nodes WHERE id=?', n.id);
  audit(req, n.org_id, 'obs', n.id, 'delete', row(n), null, null);
  res.json({ ok: true });
}));

// ---- Users (FR-DA-RBAC-01)
r.get('/orgs/:id/users', requirePerm('tenancy.view', 'users.manage'), h((req, res) => {
  requireOrg(req, req.params.id);
  send(req, res, all('SELECT id, email, name, roles, lang, status, last_login, created_at FROM users WHERE org_id=? ORDER BY name', req.params.id).map(u => ({ ...u, roles: JSON.parse(u.roles), roleNames: JSON.parse(u.roles).map(c => ROLES.find(x => x.code === c)?.name) })));
}));
r.get('/roles', h((req, res) => send(req, res, ROLES)));
r.post('/orgs/:id/users', requirePerm('users.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = row(get('SELECT * FROM organizations WHERE id=?', req.params.id));
  const b = req.body || {};
  const n = get('SELECT COUNT(*) n FROM users WHERE org_id=?', o.id).n;
  if (n >= orgConfig(o).quotas.users) throw new HttpError(402, 'QUOTA_EXCEEDED', 'User quota reached.');
  if (!b.email || !b.name || !Array.isArray(b.roles) || !b.roles.length) throw bad('FIELDS_REQUIRED', 'Name, e-mail and at least one role are required.');
  if (b.roles.some(x => !ROLES.find(r2 => r2.code === x) || x === 'platform_admin')) throw bad('BAD_ROLE', 'Unknown role.');
  if (get('SELECT 1 FROM users WHERE lower(email)=?', b.email.toLowerCase())) throw new HttpError(409, 'EMAIL_TAKEN', 'This e-mail is already used.');
  const id = uid();
  run('INSERT INTO users(id,org_id,email,name,password_hash,roles,lang,is_platform_admin,status,created_at) VALUES(?,?,?,?,?,?,?,0,?,?)', id, o.id, b.email.toLowerCase(), b.name, bcrypt.hashSync(b.password || config.demoPassword, 10), J(b.roles), b.lang || o.default_lang, 'Active', now());
  audit(req, o.id, 'user', id, 'create', null, { email: b.email, roles: b.roles }, null);
  res.status(201).json({ id });
}));
r.put('/users/:id', requirePerm('users.manage'), h((req, res) => {
  const u = get('SELECT * FROM users WHERE id=?', req.params.id);
  if (!u || !u.org_id) throw notFound('User');
  requireOrg(req, u.org_id, true);
  const b = req.body || {};
  if (b.roles && (b.roles.some(x => !ROLES.find(r2 => r2.code === x) || x === 'platform_admin') || !b.roles.length)) throw bad('BAD_ROLE', 'Unknown role.');
  if (u.id === req.user.id && b.status === 'Disabled') throw bad('SELF_DISABLE', 'You cannot disable your own account.');
  run('UPDATE users SET name=COALESCE(?,name), roles=COALESCE(?,roles), lang=COALESCE(?,lang), status=COALESCE(?,status) WHERE id=?', b.name || null, b.roles ? J(b.roles) : null, b.lang || null, b.status || null, u.id);
  if (b.password) run('UPDATE users SET password_hash=? WHERE id=?', bcrypt.hashSync(b.password, 10), u.id);
  audit(req, u.org_id, 'user', u.id, 'update', { roles: JSON.parse(u.roles), status: u.status }, { roles: b.roles, status: b.status }, null);
  res.json({ ok: true });
}));
r.delete('/users/:id', requirePerm('users.manage'), h((req, res) => {
  const u = get('SELECT * FROM users WHERE id=?', req.params.id);
  if (!u || !u.org_id) throw notFound('User');
  requireOrg(req, u.org_id, true);
  if (u.id === req.user.id) throw bad('SELF_DELETE', 'You cannot delete your own account.');
  run(`UPDATE users SET status='Disabled' WHERE id=?`, u.id);
  audit(req, u.org_id, 'user', u.id, 'disable', null, null, null);
  res.json({ ok: true });
}));

export default r;
export { projectBrief, assertPerm };
