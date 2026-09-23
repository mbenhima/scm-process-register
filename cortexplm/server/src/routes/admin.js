import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { q, json } from '../db.js';
import { requirePerm, encrypt, decrypt, hmac } from '../lib/security.js';
import { effectiveConfig, usage, checkQuota, addonCompatible, integrationCompatible, requireFeatureFor, subscriptionPacks } from '../lib/entitlements.js';
import { PACK, BUNDLE, ADDON, INTEGRATION, COMPLIANCE_STANDARDS, NON_CERT_DISCLOSURE } from '../lib/ref.js';
import { getLicenceProvider, SaasLicenceProvider, OnPremLicenceProvider } from '../licensing/index.js';
import { audit, diff, versionsOf } from '../lib/audit.js';
import { CHANNELS, CATEGORIES, processQueue } from '../lib/dispatch.js';
import { PERMISSIONS } from '../lib/perms.js';
import { h, ctxOf, badRequest, notFound } from './util.js';
import { config as appConfig } from '../config.js';

const r = Router();
const admin = requirePerm('hierarchy.manage');

// ------------------------------------------------------------------ Groups & organizations (FR-DA-TEN-01..03)
r.get('/groups', requirePerm('hierarchy.manage', 'config.view'), h(() => q.all('SELECT g.*, (SELECT COUNT(*) FROM organizations WHERE group_id = g.id) orgs FROM groups_ g ORDER BY id')));
r.post('/groups', admin, h((req) => { if (!req.body.name) throw badRequest('Name is required.'); const id = q.insert('groups_', { name: req.body.name, description: req.body.description }); audit(ctxOf(req), 'group', id, 'create', { name: [null, req.body.name] }); return { id }; }));
r.put('/groups/:id', admin, h((req) => { q.update('groups_', req.params.id, { name: req.body.name, description: req.body.description }); audit(ctxOf(req), 'group', req.params.id, 'update'); return { ok: true }; }));
r.delete('/groups/:id', admin, h((req) => { q.run('DELETE FROM groups_ WHERE id = ?', req.params.id); audit(ctxOf(req), 'group', req.params.id, 'delete'); return { ok: true }; })); // member orgs keep existing (group_id set null)

// Platform administrators see every organization; others see only their own (FR-DA-TEN-08).
r.get('/organizations', requirePerm('hierarchy.manage', 'config.view'), h((req) => {
  const rows = req.user.is_platform_admin ? q.all('SELECT o.*, g.name group_name FROM organizations o LEFT JOIN groups_ g ON g.id = o.group_id ORDER BY o.id')
    : q.all('SELECT o.*, g.name group_name FROM organizations o LEFT JOIN groups_ g ON g.id = o.group_id WHERE o.id = ?', req.orgId);
  return rows.map((o) => ({ ...o, subscription: q.get('SELECT subscription_id FROM org_config WHERE org_id = ?', o.id)?.subscription_id, projects: q.get('SELECT COUNT(*) n FROM projects WHERE org_id = ?', o.id).n, users: q.get('SELECT COUNT(*) n FROM users WHERE org_id = ?', o.id).n }));
}));
r.post('/organizations', admin, h((req) => {
  if (!req.user.is_platform_admin) throw Object.assign(new Error('Only a platform administrator can create organizations.'), { status: 403 });
  const { name, industry, country, group_id, default_language = 'en', subscription_id = 'PACK-01' } = req.body;
  if (!name || !industry) throw badRequest('Name and industry are required.');
  const uid = `ORG-${industry.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const id = q.insert('organizations', { uid, name, industry, country, group_id: group_id || null, default_language });
  q.insert('org_config', { org_id: id, subscription_id, seats: 25, issue_date: new Date().toISOString(), expiry_date: new Date(Date.now() + 365 * 86400000).toISOString() });
  new SaasLicenceProvider(id).resign();
  audit({ ...ctxOf(req), orgId: id }, 'organization', id, 'create', { name: [null, name] });
  return { id };
}));
r.put('/organizations/:id', admin, h((req) => {
  const id = req.user.is_platform_admin ? Number(req.params.id) : req.orgId;
  const o = q.get('SELECT * FROM organizations WHERE id = ?', id); if (!o) throw notFound();
  const d = Object.fromEntries(['name', 'industry', 'country', 'group_id', 'default_language', 'profile'].filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k] === '' ? null : req.body[k]]));
  q.update('organizations', id, d); audit({ ...ctxOf(req), orgId: id }, 'organization', id, 'update', diff(o, d));
  return { ok: true };
}));
r.delete('/organizations/:id', admin, h((req) => {
  if (!req.user.is_platform_admin) throw Object.assign(new Error('Only a platform administrator can delete organizations.'), { status: 403 });
  q.run('DELETE FROM organizations WHERE id = ?', req.params.id); // cascades projects, users, AI state (FR-DA-TEN-03)
  audit(ctxOf(req), 'organization', req.params.id, 'delete');
  return { ok: true };
}));

// ------------------------------------------------------------------ OBS (FR-DA-TEN-04..07)
r.get('/obs', h((req) => q.all('SELECT * FROM obs_nodes WHERE org_id = ? ORDER BY parent_id IS NOT NULL, parent_id, name', req.orgId).map((n) => ({
  ...n, linked: {
    users: q.get('SELECT COUNT(*) n FROM users WHERE obs_node_id = ?', n.id).n, projects: q.get('SELECT COUNT(*) n FROM projects WHERE obs_node_id = ?', n.id).n,
    rules: q.get('SELECT COUNT(*) n FROM business_rules WHERE obs_node_id = ?', n.id).n, controls: q.get('SELECT COUNT(*) n FROM controls WHERE obs_node_id = ?', n.id).n,
    risks: q.get('SELECT COUNT(*) n FROM risks WHERE obs_node_id = ?', n.id).n, racsi: q.get('SELECT COUNT(*) n FROM racsi_activities WHERE obs_node_id = ?', n.id).n,
    bpmn: q.get('SELECT COUNT(*) n FROM bpmn_diagrams WHERE obs_node_id = ?', n.id).n, rex: q.get('SELECT COUNT(*) n FROM rex_entries WHERE obs_node_id = ?', n.id).n,
  },
}))));
r.post('/obs', admin, h((req) => {
  if (!req.body.name) throw badRequest('Name is required.');
  checkQuota(req.orgId, 'obsNodes');
  if (req.body.parent_id && !q.get('SELECT id FROM obs_nodes WHERE id = ? AND org_id = ?', req.body.parent_id, req.orgId)) throw badRequest('Unknown parent.');
  const id = q.insert('obs_nodes', { org_id: req.orgId, name: req.body.name, type: req.body.type || 'Department', parent_id: req.body.parent_id || null });
  audit(ctxOf(req), 'obs_node', id, 'create', { name: [null, req.body.name] });
  return { id };
}));
r.put('/obs/:id', admin, h((req) => {
  const n = q.get('SELECT * FROM obs_nodes WHERE id = ? AND org_id = ?', req.params.id, req.orgId); if (!n) throw notFound();
  if (Number(req.body.parent_id) === n.id) throw badRequest('A node cannot be its own parent.');
  const d = { name: req.body.name ?? n.name, type: req.body.type ?? n.type, parent_id: req.body.parent_id === '' ? null : req.body.parent_id ?? n.parent_id };
  q.update('obs_nodes', n.id, d); audit(ctxOf(req), 'obs_node', n.id, 'update', diff(n, d));
  return { ok: true };
}));
r.delete('/obs/:id', admin, h((req) => {
  const n = q.get('SELECT * FROM obs_nodes WHERE id = ? AND org_id = ?', req.params.id, req.orgId); if (!n) throw notFound();
  q.run('UPDATE obs_nodes SET parent_id = ? WHERE parent_id = ?', n.parent_id, n.id); // re-parent children (FR-DA-TEN-05)
  q.run('DELETE FROM obs_nodes WHERE id = ?', n.id); // dependent records keep existing (ON DELETE SET NULL)
  audit(ctxOf(req), 'obs_node', n.id, 'delete');
  return { ok: true };
}));

// ------------------------------------------------------------------ Users (FR-DA-RBAC-01, D30 maxUsers)
const userOut = (u) => ({ id: u.id, name: u.name, email: u.email, title: u.title, language: u.language, active: !!u.active, obs_node_id: u.obs_node_id, last_login: u.last_login, roles: q.all('SELECT role_id FROM user_roles WHERE user_id = ?', u.id).map((x) => x.role_id) });
r.get('/users', requirePerm('user.manage'), h((req) => q.all('SELECT * FROM users WHERE org_id = ? ORDER BY name', req.orgId).map(userOut)));
r.post('/users', requirePerm('user.manage'), h(async (req) => {
  const { name, email, password, roles = [], language, title, obs_node_id } = req.body;
  if (!name || !email || String(password || '').length < 8) throw badRequest('Name, e-mail and a password of at least 8 characters are required.');
  if (!getLicenceProvider(req.orgId).canCreateUser()) throw Object.assign(new Error('All licensed seats are used (RULE-LIC-003). Increase seats before adding users.'), { status: 409 });
  if (q.get('SELECT id FROM users WHERE email = ?', email)) throw Object.assign(new Error('This e-mail is already used.'), { status: 409 });
  const id = q.insert('users', { org_id: req.orgId, name, email, password_hash: await bcrypt.hash(password, 10), language: language || null, title, obs_node_id: obs_node_id || null });
  for (const role of roles) if (q.get('SELECT id FROM roles WHERE id = ?', role)) q.insert('user_roles', { user_id: id, role_id: role });
  audit(ctxOf(req), 'user', id, 'create', { email: [null, email], roles: [null, roles.join(',')] });
  return userOut(q.get('SELECT * FROM users WHERE id = ?', id));
}));
r.put('/users/:id', requirePerm('user.manage'), h(async (req) => {
  const u = q.get('SELECT * FROM users WHERE id = ? AND org_id = ?', req.params.id, req.orgId); if (!u) throw notFound();
  const d = Object.fromEntries(['name', 'title', 'language', 'obs_node_id', 'active'].filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k] === '' ? null : req.body[k]]));
  if (d.active && !u.active && !getLicenceProvider(req.orgId).canCreateUser()) throw Object.assign(new Error('All licensed seats are used.'), { status: 409 });
  if (req.body.password) { if (String(req.body.password).length < 8) throw badRequest('Password needs at least 8 characters.'); d.password_hash = await bcrypt.hash(req.body.password, 10); }
  q.update('users', u.id, d);
  if (Array.isArray(req.body.roles)) {
    const before = q.all('SELECT role_id FROM user_roles WHERE user_id = ?', u.id).map((x) => x.role_id).join(',');
    q.run('DELETE FROM user_roles WHERE user_id = ?', u.id);
    for (const role of req.body.roles) if (q.get('SELECT id FROM roles WHERE id = ?', role)) q.insert('user_roles', { user_id: u.id, role_id: role });
    audit(ctxOf(req), 'user', u.id, 'roles', { roles: [before, req.body.roles.join(',')] });
  }
  audit(ctxOf(req), 'user', u.id, 'update', diff(u, { ...d, password_hash: undefined }));
  return userOut(q.get('SELECT * FROM users WHERE id = ?', u.id));
}));
r.delete('/users/:id', requirePerm('user.manage'), h((req) => {
  const u = q.get('SELECT * FROM users WHERE id = ? AND org_id = ?', req.params.id, req.orgId); if (!u) throw notFound();
  if (u.id === req.user.id) throw badRequest('You cannot delete your own account.');
  q.run('DELETE FROM users WHERE id = ?', u.id); audit(ctxOf(req), 'user', u.id, 'delete', { email: [u.email, null] });
  return { ok: true };
}));

// ------------------------------------------------------------------ Roles & Permission Matrix (FR-DA-RBAC-02)
r.get('/roles', h(() => q.all('SELECT * FROM roles ORDER BY id')));
r.get('/permission-matrix', requirePerm('permission.manage', 'audit.view'), h(() => ({
  roles: q.all('SELECT * FROM roles ORDER BY id'), permissions: PERMISSIONS.map(([code, module, description]) => ({ code, module, description })),
  grants: q.all('SELECT role_id, permission_code FROM role_permissions').map((g) => `${g.role_id}|${g.permission_code}`),
})));
r.put('/permission-matrix', requirePerm('permission.manage'), h((req) => {
  const { role_id, permission_code, granted } = req.body;
  if (!q.get('SELECT id FROM roles WHERE id = ?', role_id) || !q.get('SELECT code FROM permissions WHERE code = ?', permission_code)) throw badRequest('Unknown role or permission.');
  if (role_id === 'R18' && ['permission.manage'].includes(permission_code) && !granted) throw badRequest('The Platform Administrator must keep permission management (fail-safe).');
  if (granted) q.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_code) VALUES (?, ?)', role_id, permission_code);
  else q.run('DELETE FROM role_permissions WHERE role_id = ? AND permission_code = ?', role_id, permission_code);
  audit(ctxOf(req), 'permission_matrix', `${role_id}:${permission_code}`, granted ? 'grant' : 'revoke', { granted: [!granted, !!granted] });
  return { ok: true };
}));

// ------------------------------------------------------------------ Configuration management (FR-DA-CFG-01..09)
r.get('/config', requirePerm('config.view', 'catalog.view', 'dashboard.view'), h((req) => {
  const eff = effectiveConfig(req.orgId); const used = usage(req.orgId);
  return { ...eff, usage: used, quotaFlags: Object.fromEntries(Object.keys(eff.quotas).map((k) => [k, used[k] >= eff.quotas[k]])), disclosure: NON_CERT_DISCLOSURE, deploymentMode: appConfig.deploymentMode };
}));
r.put('/config', requirePerm('config.manage'), h((req) => {
  const cfg = q.get('SELECT * FROM org_config WHERE org_id = ?', req.orgId);
  if (appConfig.deploymentMode === 'onprem' && req.body.subscription_id) throw badRequest('In OnPrem mode the subscription comes from the signed licence file.');
  const d = {};
  if (req.body.subscription_id) { if (!PACK[req.body.subscription_id] && !BUNDLE[req.body.subscription_id]) throw badRequest('Unknown pack or bundle.'); d.subscription_id = req.body.subscription_id; }
  for (const k of ['deployment_option', 'support_tier', 'billing_cycle']) if (req.body[k]) d[k] = req.body[k];
  if (req.body.seats !== undefined) { const s = Number(req.body.seats); const min = PACK[d.subscription_id || cfg.subscription_id]?.minUsers || 5; if (!(s >= min)) throw badRequest(`Seats must be at least ${min} (pack minimum).`); d.seats = s; }
  if (req.body.expiry_date) d.expiry_date = new Date(req.body.expiry_date + 'T23:59:59Z').toISOString();
  q.update('org_config', req.orgId, d, 'org_id');
  // Drop add-ons no longer compatible with the new subscription.
  const packs = subscriptionPacks(d.subscription_id || cfg.subscription_id);
  for (const a of q.all('SELECT addon_id FROM org_addons WHERE org_id = ?', req.orgId)) if (!addonCompatible(a.addon_id, packs)) q.run('DELETE FROM org_addons WHERE org_id = ? AND addon_id = ?', req.orgId, a.addon_id);
  new SaasLicenceProvider(req.orgId).resign();
  audit(ctxOf(req), 'configuration', req.orgId, 'update', diff(cfg, d), req.body.justification || null);
  return effectiveConfig(req.orgId);
}));
r.put('/config/addons/:id', requirePerm('config.manage'), h((req) => {
  const a = ADDON[req.params.id]; if (!a) throw notFound('Unknown add-on.');
  const eff = effectiveConfig(req.orgId);
  if (req.body.active) {
    if (!addonCompatible(a.id, eff.packs)) throw badRequest(`${a.id} is not available with ${eff.subscriptionId}. Compatible packs: ${a.packs.join(', ')}.`);
    q.run('INSERT OR IGNORE INTO org_addons (org_id, addon_id) VALUES (?, ?)', req.orgId, a.id); // idempotent (RULE-LIC-004)
  } else q.run('DELETE FROM org_addons WHERE org_id = ? AND addon_id = ?', req.orgId, a.id);
  new SaasLicenceProvider(req.orgId).resign();
  audit(ctxOf(req), 'configuration', req.orgId, req.body.active ? 'addon_on' : 'addon_off', { [a.id]: [null, !!req.body.active] });
  return effectiveConfig(req.orgId);
}));
// Compliance & Security Standards: independent of pack; idempotent scaffold; mandatory disclosure (CTRL-017).
r.put('/config/compliance/:id', requirePerm('config.manage'), h((req) => {
  const s = COMPLIANCE_STANDARDS.find((x) => x.id === req.params.id); if (!s) throw notFound('Unknown standard.');
  if (req.body.active) {
    if (!req.body.disclosureAcknowledged) throw badRequest(`Acknowledge the disclosure to continue: ${NON_CERT_DISCLOSURE}`);
    const already = q.get('SELECT 1 FROM org_compliance WHERE org_id = ? AND standard_id = ?', req.orgId, s.id);
    if (!already) q.insert('org_compliance', { org_id: req.orgId, standard_id: s.id, disclosure_ack_by: req.user.id });
    let seeded = 0;
    for (const [name, coso, type, freq] of s.controls) {
      if (!q.get('SELECT id FROM controls WHERE org_id = ? AND standard_tag = ? AND name = ?', req.orgId, s.id, name)) {
        q.insert('controls', { org_id: req.orgId, code: `${s.id}-${String(++seeded).padStart(2, '0')}`, name, control_type: type, coso_component: coso, testing_frequency: freq, owner: 'Regulatory & Compliance Officer', effectiveness: 'Not tested', standard_tag: s.id, description: `Starting control seeded by the ${s.name} module.` });
      }
    }
    audit(ctxOf(req), 'configuration', req.orgId, 'compliance_on', { [s.id]: [null, true] }, 'Non-certification disclosure acknowledged.');
    new SaasLicenceProvider(req.orgId).resign();
    return { ok: true, seeded, alreadyActive: !!already, disclosure: NON_CERT_DISCLOSURE };
  }
  q.run('DELETE FROM org_compliance WHERE org_id = ? AND standard_id = ?', req.orgId, s.id); // tagged controls are kept (FR-DA-CFG-05)
  new SaasLicenceProvider(req.orgId).resign();
  audit(ctxOf(req), 'configuration', req.orgId, 'compliance_off', { [s.id]: [true, false] });
  return { ok: true };
}));

// ------------------------------------------------------------------ Licensing (D30)
r.get('/licence', requirePerm('license.manage', 'config.view'), h((req) => {
  const p = getLicenceProvider(req.orgId); const c = p.check();
  const used = q.get('SELECT COUNT(*) n FROM users WHERE org_id = ? AND active = 1', req.orgId).n;
  const { signature, ...lic } = c.licence || {};
  return { mode: p.getMode(), status: c.status, daysLeft: c.daysLeft, reason: c.reason || null, licence: lic, signed: !!signature, seatsUsed: used, maxUsers: p.getMaxUsers(), canCreateUser: p.canCreateUser(), addOns: p.getActiveAddOns(), features: p.getFeatureFlags(), plan: p.getPlan() };
}));
r.post('/licence/upload', requirePerm('license.manage'), h((req) => {
  if (appConfig.deploymentMode !== 'onprem') throw badRequest('Licence files are used in OnPrem mode only (DEPLOYMENT_MODE=onprem). In SaaS mode, change the subscription in Configuration.');
  const l = OnPremLicenceProvider.install(String(req.body.content || ''));
  audit(ctxOf(req), 'licence', l.companyId, 'upload', { plan: [null, l.plan], maxUsers: [null, l.maxUsers] });
  return { ok: true };
}));

// ------------------------------------------------------------------ External Integration Registry (FR-DA-CFG-10..14)
const intOut = (i) => ({ ...i, credentials_enc: undefined, inbound_secret_enc: undefined, hasCredentials: !!i.credentials_enc, catalog: INTEGRATION[i.catalog_id], mappings: q.all('SELECT * FROM integration_mappings WHERE integration_id = ?', i.id) });
r.get('/integrations', requirePerm('integration.view'), h((req) => q.all('SELECT * FROM integrations WHERE org_id = ? ORDER BY name', req.orgId).map(intOut)));
r.post('/integrations', requirePerm('integration.manage'), h((req) => {
  const eff = requireFeatureFor(req.orgId, 'integrations');
  const cat = INTEGRATION[req.body.catalog_id]; if (!cat) throw badRequest('Choose a connector from the catalog.');
  if (!integrationCompatible(cat.id, eff.packs)) throw Object.assign(new Error(`${cat.id} is not included in ${eff.subscriptionId}. It comes with ${cat.packs.join(', ')}.`), { status: 403 });
  const secret = crypto.randomBytes(24).toString('hex');
  const id = q.insert('integrations', { org_id: req.orgId, catalog_id: cat.id, name: req.body.name || cat.name, endpoint: req.body.endpoint || null, enabled: 0, credentials_enc: encrypt(req.body.credentials), inbound_secret_enc: encrypt(secret) });
  audit(ctxOf(req), 'integration', id, 'create', { connector: [null, cat.id] });
  return { ...intOut(q.get('SELECT * FROM integrations WHERE id = ?', id)), inboundSecret: secret, inboundUrl: `/api/integrations/${id}/inbound` };
}));
const intFor = (req) => { const i = q.get('SELECT * FROM integrations WHERE id = ? AND org_id = ?', req.params.id, req.orgId); if (!i) throw notFound(); return i; };
r.put('/integrations/:id', requirePerm('integration.manage'), h((req) => {
  const i = intFor(req);
  const d = {};
  if (req.body.name !== undefined) d.name = req.body.name;
  if (req.body.endpoint !== undefined) d.endpoint = req.body.endpoint;
  if (req.body.enabled !== undefined) d.enabled = req.body.enabled ? 1 : 0;
  if (req.body.credentials) d.credentials_enc = encrypt(req.body.credentials);
  q.update('integrations', i.id, d);
  audit(ctxOf(req), 'integration', i.id, 'update', diff(i, { ...d, credentials_enc: d.credentials_enc ? '(changed)' : undefined }));
  return intOut(q.get('SELECT * FROM integrations WHERE id = ?', i.id));
}));
r.delete('/integrations/:id', requirePerm('integration.manage'), h((req) => { const i = intFor(req); q.run('DELETE FROM integrations WHERE id = ?', i.id); audit(ctxOf(req), 'integration', i.id, 'delete'); return { ok: true }; }));
r.post('/integrations/:id/test', requirePerm('integration.manage'), h(async (req) => {
  const i = intFor(req);
  let status = 'Unreachable';
  if (i.endpoint) {
    try {
      const res = await fetch(i.endpoint, { method: 'GET', headers: i.credentials_enc ? { authorization: `Bearer ${decrypt(i.credentials_enc)}` } : {}, signal: AbortSignal.timeout(5000) });
      status = res.ok ? 'Healthy' : res.status === 401 || res.status === 403 ? 'Authentication failure' : 'Unreachable';
    } catch { status = 'Unreachable'; } // provider detail is not exposed (FR-DA-CFG-12)
  }
  const ts = new Date().toISOString();
  q.run('UPDATE integrations SET health_status = ?, health_checked_at = ? WHERE id = ?', status, ts, i.id);
  q.insert('integration_log', { org_id: req.orgId, integration_id: i.id, direction: 'health-check', record: i.endpoint || '(no endpoint)', result: status === 'Healthy' ? 'success' : status.toLowerCase(), created_at: ts });
  return { status, checkedAt: ts };
}));
r.post('/integrations/:id/mappings', requirePerm('integration.manage'), h((req) => {
  const i = intFor(req);
  const { external_field, internal_entity, internal_field } = req.body;
  if (!external_field || !internal_entity || !internal_field) throw badRequest('External field, entity and internal field are required.');
  const id = q.insert('integration_mappings', { integration_id: i.id, external_field, internal_entity, internal_field });
  audit(ctxOf(req), 'integration', i.id, 'mapping', { [external_field]: [null, `${internal_entity}.${internal_field}`] });
  return { id };
}));
r.delete('/integrations/:id/mappings/:mid', requirePerm('integration.manage'), h((req) => { const i = intFor(req); q.run('DELETE FROM integration_mappings WHERE id = ? AND integration_id = ?', req.params.mid, i.id); return { ok: true }; }));
r.post('/integrations/:id/sync', requirePerm('integration.manage'), h((req) => {
  const i = intFor(req);
  if (!i.enabled) throw badRequest('Enable the integration first.');
  const ts = new Date().toISOString();
  const result = i.health_status === 'Healthy' ? 'success' : 'failed: connection not healthy';
  q.insert('integration_log', { org_id: req.orgId, integration_id: i.id, direction: 'outbound', record: req.body.record || 'Manual sync request', result, created_at: ts });
  return { result };
}));
r.get('/integrations/:id/log', requirePerm('integration.view'), h((req) => { const i = intFor(req); return q.all('SELECT * FROM integration_log WHERE integration_id = ? ORDER BY id DESC LIMIT 200', i.id); }));

// ------------------------------------------------------------------ Audit trail & versions (FR-DA-AUD-03: read-only)
r.get('/audit', requirePerm('audit.view'), h((req) => {
  const where = ['org_id = ?']; const args = [req.orgId];
  if (req.query.entity_type) { where.push('entity_type = ?'); args.push(req.query.entity_type); }
  if (req.query.entity_id) { where.push('entity_id = ?'); args.push(String(req.query.entity_id)); }
  if (req.query.q) { where.push('(user_name LIKE ? OR action LIKE ? OR field LIKE ? OR justification LIKE ? OR after_value LIKE ?)'); args.push(...Array(5).fill(`%${req.query.q}%`)); }
  return q.all(`SELECT * FROM audit_log WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT ${Math.min(1000, Number(req.query.limit) || 300)}`, ...args);
}));
r.get('/versions/:type/:id', requirePerm('audit.view', 'ai.view', 'template.view', 'rex.view'), h((req) => {
  const v = versionsOf(req.params.type, Number(req.params.id));
  if (v.length && q.get('SELECT org_id FROM entity_versions WHERE id = ?', v[0].id).org_id !== req.orgId) throw notFound();
  return v;
}));

// ------------------------------------------------------------------ Notifications & channels (FR-DA-COMM)
r.get('/notifications', h((req) => q.all(`SELECT s.id, s.category, s.subject, s.body, s.created_at, d.read_at FROM dispatches s JOIN deliveries d ON d.dispatch_id = s.id AND d.channel = 'inapp'
  WHERE s.user_id = ? AND s.org_id = ? ORDER BY s.id DESC LIMIT 100`, req.user.id, req.orgId)));
r.post('/notifications/:id/read', h((req) => { q.run("UPDATE deliveries SET read_at = ? WHERE dispatch_id = (SELECT id FROM dispatches WHERE id = ? AND user_id = ?) AND channel = 'inapp'", new Date().toISOString(), req.params.id, req.user.id); return { ok: true }; }));
r.get('/notification-prefs', h((req) => ({ channels: CHANNELS, categories: CATEGORIES,
  prefs: Object.fromEntries(CATEGORIES.flatMap((c) => CHANNELS.map((ch) => [`${c}|${ch}`, (q.get('SELECT enabled FROM notification_prefs WHERE user_id = ? AND category = ? AND channel = ?', req.user.id, c, ch)?.enabled ?? (ch === 'inapp' ? 1 : 0)) === 1]))) })));
r.put('/notification-prefs', h((req) => {
  const { category, channel, enabled } = req.body;
  if (!CATEGORIES.includes(category) || !CHANNELS.includes(channel)) throw badRequest('Unknown category or channel.');
  q.run('INSERT INTO notification_prefs (user_id, category, channel, enabled) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, category, channel) DO UPDATE SET enabled = excluded.enabled', req.user.id, category, channel, enabled ? 1 : 0);
  return { ok: true };
}));
r.get('/deliveries', h((req) => q.all(`SELECT d.id, d.channel, d.status, d.attempts, d.last_error, d.updated_at, s.subject, s.category, s.created_at FROM deliveries d JOIN dispatches s ON s.id = d.dispatch_id
  WHERE s.org_id = ? ${req.perms.has('alert.manage') && req.query.all ? '' : 'AND s.user_id = ?'} ORDER BY d.id DESC LIMIT 300`, req.orgId, ...(req.perms.has('alert.manage') && req.query.all ? [] : [req.user.id]))));
r.post('/deliveries/retry', h(async () => { await processQueue(new Date(Date.now() + 3600e3)); return { ok: true }; }));
r.get('/webhooks', h((req) => q.all('SELECT id, url, active, user_id FROM webhook_endpoints WHERE org_id = ? AND (user_id = ? OR user_id IS NULL)', req.orgId, req.user.id)));
r.post('/webhooks', h((req) => {
  if (!/^https?:\/\//.test(req.body.url || '')) throw badRequest('Give a valid http(s) URL.');
  const secret = crypto.randomBytes(16).toString('hex');
  const id = q.insert('webhook_endpoints', { org_id: req.orgId, user_id: req.user.id, url: req.body.url, secret_enc: encrypt(secret) });
  return { id, secret, note: 'Keep this signing secret: requests carry an x-cortexplm-signature HMAC-SHA256 header.' };
}));
r.delete('/webhooks/:id', h((req) => { q.run('DELETE FROM webhook_endpoints WHERE id = ? AND org_id = ? AND user_id = ?', req.params.id, req.orgId, req.user.id); return { ok: true }; }));

export default r;

// Inbound integration events: authenticated by HMAC signature, scoped to the registering org (FR-DA-CFG-14).
export function inboundHandler(req, res) {
  const i = q.get('SELECT * FROM integrations WHERE id = ?', req.params.id);
  const raw = JSON.stringify(req.body || {});
  const sig = req.headers['x-cortexplm-signature'];
  const expected = i ? hmac(decrypt(i.inbound_secret_enc) || '', raw) : null;
  if (!i || !sig || !expected || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return res.status(401).json({ error: 'Invalid signature.' });
  if (!i.enabled) return res.status(409).json({ error: 'Integration disabled.' });
  q.insert('integration_log', { org_id: i.org_id, integration_id: i.id, direction: 'inbound', record: raw.slice(0, 500), result: 'success', created_at: new Date().toISOString() });
  res.json({ ok: true });
}
