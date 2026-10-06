// Role-based access control with a runtime-editable Permission Matrix (FR-DA-RBAC-02/03/10).
import { all, one, run } from './db.js';
import { HttpError } from './lib/util.js';
import * as cat from './catalog.js';

export const PLATFORM_PERMISSIONS = [
  ['dashboard.view', 'Home'], ['alerts.view', 'Home'], ['assistant.view', 'Home'], ['reports.view', 'Home'], ['help.view', 'Home'], ['profile.edit', 'Home'],
  ['projects.view', 'Portfolio'], ['projects.create', 'Portfolio'], ['projects.manage', 'Portfolio'], ['tasks.execute', 'Portfolio'], ['portfolio.view', 'Portfolio'], ['group.view', 'Portfolio'],
  ['catalog.view', 'Process design'], ['catalog.manage', 'Process design'], ['bpmn.view', 'Process design'], ['bpmn.edit', 'Process design'], ['templates.manage', 'Process design'], ['verticals.manage', 'Process design'], ['sme.manage', 'Process design'],
  ['governance.view', 'Governance'], ['governance.manage', 'Governance'], ['rex.manage', 'Governance'], ['evaluation.view', 'Governance'], ['attachments.manage', 'Governance'],
  ['ai.view', 'AI & knowledge'], ['ai.run', 'AI & knowledge'], ['ai.manage', 'AI & knowledge'], ['kb.manage', 'AI & knowledge'],
  ['reports.export', 'Reports'], ['benchmark.view', 'Reports'], ['benchmark.group', 'Reports'], ['benchmark.manage', 'Reports'],
  ['hierarchy.manage', 'Administration'], ['users.manage', 'Administration'], ['permissions.manage', 'Administration'], ['config.view', 'Administration'], ['config.manage', 'Administration'],
  ['audit.view', 'Administration'], ['backup.manage', 'Administration'], ['integrations.manage', 'Administration'], ['onboarding.manage', 'Administration'], ['traceability.view', 'Administration'],
  // Release 2: process design management, OBS roles, documents, blueprints, audits, prompt specifications, registers
  ['design.manage', 'Process design'], ['design.release', 'Process design'], ['blueprints.manage', 'Process design'],
  ['obs.view', 'Administration'], ['obs.manage', 'Administration'],
  ['documents.manage', 'Reports'], ['documents.approve', 'Reports'], ['layout.manage', 'Reports'],
  ['audits.view', 'Governance'], ['audits.manage', 'Governance'], ['registers.view', 'Governance'],
  ['prompts.manage', 'AI & knowledge'], ['aisettings.manage', 'AI & knowledge'],
];

const BASE_ALL = ['dashboard.view', 'alerts.view', 'assistant.view', 'reports.view', 'help.view', 'profile.edit', 'projects.view', 'portfolio.view', 'catalog.view', 'bpmn.view', 'governance.view', 'ai.view', 'config.view', 'benchmark.view', 'm00.view', 'obs.view', 'audits.view', 'registers.view'];
const BASELINE = {
  admin: null, // every permission
  owner: [...BASE_ALL, 'design.manage', 'design.release', 'blueprints.manage', 'obs.manage', 'documents.manage', 'documents.approve', 'layout.manage', 'audits.manage', 'prompts.manage', 'tasks.execute', 'projects.create', 'projects.manage', 'governance.manage', 'reports.export', 'templates.manage', 'rex.manage', 'ai.run', 'bpmn.edit', 'audit.view', 'benchmark.group', 'evaluation.view', 'attachments.manage', 'kb.manage', 'group.view', 'traceability.view', 'onboarding.manage', 'sme.manage'],
  contributor: [...BASE_ALL, 'documents.manage', 'tasks.execute', 'ai.run', 'reports.export', 'rex.manage', 'attachments.manage'],
  viewer: [...BASE_ALL, 'tasks.execute', 'reports.export', 'evaluation.view'],
  reporter: ['dashboard.view', 'alerts.view', 'assistant.view', 'help.view', 'profile.edit', 'projects.view', 'tasks.execute', 'reports.view', 'config.view', 'm00.view'],
  auditor: [...BASE_ALL, 'audits.manage', 'audit.view', 'reports.export', 'evaluation.view', 'traceability.view', 'group.view', 'benchmark.group'],
};
export const ROLE_BASELINE = {
  'R-01': 'admin', 'R-02': 'owner', 'R-03': 'owner', 'R-20': 'owner', 'R-21': 'owner', 'R-23': 'owner',
  'R-12': 'reporter', 'R-13': 'viewer', 'R-29': 'auditor',
};

export function permissionCatalog() {
  const list = PLATFORM_PERMISSIONS.map(([code, module], i) => ({ code, module, sort: i }));
  for (const m of cat.list('module')) {
    for (const a of ['view', 'edit', 'manage']) list.push({ code: `${m.id.toLowerCase()}.${a}`, module: m.id, sort: 1000 + Number(m.id.slice(1)) * 3 });
  }
  return list;
}

/** Default grants: the baseline class of each role plus the module rights of its D15b role menu. */
export function defaultGrants(roleId) {
  const base = ROLE_BASELINE[roleId] || 'contributor';
  const codes = new Set(BASELINE[base] === null ? permissionCatalog().map(p => p.code) : BASELINE[base]);
  for (const row of cat.list('roleMenu').filter(r => r.roleId === roleId)) {
    const m = (row.visibility || '').match(/Permission ([a-z0-9]+)\.(view|edit|manage)/);
    if (m) {
      const [, mod, lvl] = m; codes.add(`${mod}.${lvl}`);
      if (/^m\d\d$/.test(mod)) { codes.add(`${mod}.view`); if (lvl === 'manage') codes.add(`${mod}.edit`); }
    }
  }
  if (base === 'owner' || base === 'contributor') { codes.add('m53.view'); codes.add('m54.view'); }
  return codes;
}

/** Additive startup migration of the permission catalog: new codes and default grants, never overwriting admin edits. */
export function syncPermissions() {
  let added = 0;
  for (const p of permissionCatalog()) {
    if (!one(`SELECT code FROM permissions WHERE code=?`, p.code)) { run(`INSERT INTO permissions(code,module,sort) VALUES(?,?,?)`, p.code, p.module, p.sort); added++; }
  }
  for (const r of all(`SELECT id FROM roles`)) {
    const g = defaultGrants(r.id);
    for (const p of all(`SELECT code FROM permissions`)) {
      if (!one(`SELECT 1 x FROM role_permissions WHERE role_id=? AND code=?`, r.id, p.code)) {
        run(`INSERT INTO role_permissions(role_id,code,granted,customized) VALUES(?,?,?,0)`, r.id, p.code, g.has(p.code) ? 1 : 0);
      }
    }
  }
  return added;
}

const permCache = new Map();
export function clearPermCache() { permCache.clear(); }
/** Resolved permission set: union across every role the user holds. */
export function userPermissions(userId) {
  if (permCache.has(userId)) return permCache.get(userId);
  const u = one(`SELECT is_platform FROM users WHERE id=?`, userId);
  let set;
  if (u?.is_platform) set = new Set(all(`SELECT code FROM permissions`).map(r => r.code));
  else set = new Set(all(`SELECT DISTINCT rp.code FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id AND rp.granted=1 WHERE ur.user_id=?`, userId).map(r => r.code));
  permCache.set(userId, set);
  return set;
}
export function userRoles(userId) { return all(`SELECT role_id FROM user_roles WHERE user_id=?`, userId).map(r => r.role_id); }

/** Express middleware: every listed permission is required, checked server-side (403 otherwise). */
export function requirePerm(...codes) {
  return (req, res, next) => {
    const p = userPermissions(req.user.id);
    const missing = codes.find(c => !p.has(c));
    if (missing) return next(new HttpError(403, 'err.forbidden', { permission: missing }));
    next();
  };
}
export const has = (req, code) => userPermissions(req.user.id).has(code);
