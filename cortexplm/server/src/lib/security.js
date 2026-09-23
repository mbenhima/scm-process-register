// Authentication (signed, time-boxed JWT), RBAC resolution and tenant scoping.
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { q } from '../db.js';
import { config } from '../config.js';

export const signToken = (user) => jwt.sign({ sub: user.id }, config.secret, { expiresIn: config.tokenTtl });

export function permissionsOf(userId) {
  return new Set(q.all(`SELECT DISTINCT rp.permission_code c FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id WHERE ur.user_id = ?`, userId).map((r) => r.c));
}
export const rolesOf = (userId) => q.all('SELECT r.id, r.name, r.baseline_class FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? ORDER BY r.id', userId);

// Authenticate the bearer token and resolve the tenant. Platform administrators may act in any
// organization via the X-Org-Id header; everyone else is pinned to their own organization.
export function authenticate(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : req.query.token;
  if (!token) return res.status(401).json({ error: 'Sign in required.' });
  let payload;
  try { payload = jwt.verify(token, config.secret); } catch { return res.status(401).json({ error: 'Your session has expired. Sign in again.' }); }
  const user = q.get('SELECT id, org_id, name, email, language, is_platform_admin, obs_node_id, title, active, prefs FROM users WHERE id = ?', payload.sub);
  if (!user || !user.active) return res.status(401).json({ error: 'Account inactive.' });
  req.user = user;
  req.perms = permissionsOf(user.id);
  let orgId = user.org_id;
  if (user.is_platform_admin) {
    const hdr = Number(req.headers['x-org-id']);
    if (hdr && q.get('SELECT id FROM organizations WHERE id = ?', hdr)) orgId = hdr;
    if (!orgId) orgId = q.get('SELECT id FROM organizations ORDER BY id LIMIT 1')?.id;
  }
  req.orgId = orgId;
  next();
}

// RBAC gate (FR-DA-RBAC-03): 403 when the union of the user's role permissions lacks the code.
export const requirePerm = (...codes) => (req, res, next) => {
  if (codes.some((c) => req.perms.has(c))) return next();
  res.status(403).json({ error: `Permission required: ${codes.join(' or ')}.`, permission: codes[0] });
};

export const has = (req, code) => req.perms.has(code);

// Symmetric encryption for stored secrets (integration credentials, webhook secrets). Never logged.
const key = () => crypto.createHash('sha256').update('cortexplm-secrets:' + config.secret).digest();
export function encrypt(text) {
  if (text == null || text === '') return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
}
export function decrypt(b64) {
  if (!b64) return null;
  const buf = Buffer.from(b64, 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
}
export const hmac = (secret, body) => crypto.createHmac('sha256', secret).update(body).digest('hex');
