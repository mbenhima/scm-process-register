import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { q, json } from '../db.js';
import { signToken, authenticate, permissionsOf, rolesOf } from '../lib/security.js';
import { effectiveConfig } from '../lib/entitlements.js';
import { getLicenceProvider } from '../licensing/index.js';
import { dictionaries, languages, resolveLanguage } from '../lib/i18n.js';
import { h } from './util.js';
import { audit } from '../lib/audit.js';

const r = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many sign-in attempts. Wait a few minutes and try again.' } });

// Public: languages and dictionaries (needed before sign-in).
r.get('/i18n', (req, res) => res.json(languages()));
r.get('/i18n/:lang', (req, res) => { const d = dictionaries()[req.params.lang]; if (!d) return res.status(404).json({ error: 'Unknown language.' }); res.json(d); });

r.post('/auth/login', limiter, h(async (req, res) => {
  const { email, password } = req.body || {};
  const user = email ? q.get('SELECT * FROM users WHERE email = ?', String(email).trim()) : null;
  if (!user || !user.active || !(await bcrypt.compare(String(password || ''), user.password_hash))) {
    return res.status(401).json({ error: 'E-mail or password is incorrect.' });
  }
  // Licence check on login (D30, MP-18-T002-S001). Platform administrators can always sign in to fix it.
  if (!user.is_platform_admin) {
    const lic = getLicenceProvider(user.org_id).check();
    if (lic.status === 'expired' || lic.status === 'inactive') return res.status(403).json({ error: `Your organization's licence is ${lic.status}. ${lic.reason || 'Contact your administrator.'}` });
  }
  q.run('UPDATE users SET last_login = ? WHERE id = ?', new Date().toISOString(), user.id);
  audit({ user, orgId: user.org_id }, 'user', user.id, 'login');
  return { token: signToken(user) };
}));

r.use(authenticate);

export function mePayload(req) {
  const u = req.user;
  const org = q.get('SELECT o.*, g.name group_name FROM organizations o LEFT JOIN groups_ g ON g.id = o.group_id WHERE o.id = ?', req.orgId);
  const lic = getLicenceProvider(req.orgId).check();
  return {
    user: { id: u.id, name: u.name, email: u.email, title: u.title, language: u.language, isPlatformAdmin: !!u.is_platform_admin, prefs: json(u.prefs, {}) },
    language: resolveLanguage(u.language, req.orgId),
    roles: rolesOf(u.id), permissions: [...permissionsOf(u.id)],
    organization: org, config: effectiveConfig(req.orgId),
    licence: { status: lic.status, daysLeft: lic.daysLeft, reason: lic.reason || null },
    organizations: u.is_platform_admin ? q.all('SELECT id, name, industry FROM organizations ORDER BY id') : [{ id: org.id, name: org.name, industry: org.industry }],
  };
}

r.get('/auth/me', h((req) => mePayload(req)));

// Language and UI preferences (navigation position, pin state, pinned items) persist per user.
r.put('/auth/me', h((req) => {
  const { language, prefs } = req.body || {};
  if (language !== undefined) {
    if (language && !dictionaries()[language]) throw Object.assign(new Error('Unknown language.'), { status: 400 });
    q.run('UPDATE users SET language = ? WHERE id = ?', language || null, req.user.id);
  }
  if (prefs && typeof prefs === 'object') q.run('UPDATE users SET prefs = ? WHERE id = ?', JSON.stringify({ ...json(req.user.prefs, {}), ...prefs }), req.user.id);
  req.user = q.get('SELECT id, org_id, name, email, language, is_platform_admin, obs_node_id, title, active, prefs FROM users WHERE id = ?', req.user.id);
  return mePayload(req);
}));

r.put('/auth/password', h(async (req) => {
  const { current, next } = req.body || {};
  const u = q.get('SELECT password_hash FROM users WHERE id = ?', req.user.id);
  if (!(await bcrypt.compare(String(current || ''), u.password_hash))) throw Object.assign(new Error('Current password is incorrect.'), { status: 400 });
  if (String(next || '').length < 8) throw Object.assign(new Error('The new password needs at least 8 characters.'), { status: 400 });
  q.run('UPDATE users SET password_hash = ? WHERE id = ?', await bcrypt.hash(next, 10), req.user.id);
  return { ok: true };
}));

// Minimal user directory for assignment, independent of user.manage (FR-DA-RBAC-05).
r.get('/directory', h((req) => q.all(`SELECT u.id, u.name, u.email, GROUP_CONCAT(ur.role_id) roles FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
  WHERE u.org_id = ? AND u.active = 1 GROUP BY u.id ORDER BY u.name`, req.orgId).map((x) => ({ ...x, roles: (x.roles || '').split(',').filter(Boolean) }))));

export default r;
