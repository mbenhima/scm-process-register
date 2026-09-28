// Authentication (JWT) and authorization: RBAC permission matrix and pack entitlement
// are two independent checks (FR-DA-RBAC-02, FR-DA-CFG-03).
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { all, get } from './db.js';
import { HttpError, forbidden } from './http.js';
import { hasFeature } from './packs.js';

let matrix = null;
export function loadMatrix() {
  matrix = new Map();
  for (const r of all('SELECT role, perm, granted FROM role_permissions')) {
    if (!matrix.has(r.role)) matrix.set(r.role, new Set());
    if (r.granted) matrix.get(r.role).add(r.perm);
  }
  return matrix;
}
export function invalidateMatrix() { matrix = null; }
export function permsOf(roles, isPlatformAdmin) {
  if (!matrix) loadMatrix();
  const out = new Set();
  for (const r of isPlatformAdmin ? ['platform_admin', ...roles] : roles) for (const p of matrix.get(r) || []) out.add(p);
  return out;
}

export function sign(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtTtl, issuer: 'dynamicms' });
}

export function authenticate(req, _res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : (req.query.token || '').toString();
  if (!token) return next(new HttpError(401, 'UNAUTHENTICATED', 'Sign in required.'));
  let payload;
  try { payload = jwt.verify(token, config.jwtSecret, { issuer: 'dynamicms' }); } catch { return next(new HttpError(401, 'TOKEN_INVALID', 'Session expired. Sign in again.')); }
  const u = get(`SELECT u.*, o.group_id AS group_id FROM users u LEFT JOIN organizations o ON o.id = u.org_id WHERE u.id = ?`, payload.sub);
  if (!u || u.status !== 'Active') return next(new HttpError(401, 'USER_DISABLED', 'Account disabled.'));
  const roles = JSON.parse(u.roles || '[]');
  req.user = { id: u.id, org_id: u.org_id, group_id: u.group_id, email: u.email, name: u.name, roles, lang: u.lang, is_platform_admin: !!u.is_platform_admin, perms: permsOf(roles, !!u.is_platform_admin) };
  next();
}

export const requirePerm = (...perms) => (req, _res, next) => {
  if (perms.some(p => req.user.perms.has(p))) return next();
  next(forbidden('PERMISSION_DENIED', `Missing permission: ${perms.join(' or ')}`));
};
export const can = (req, perm) => req.user.perms.has(perm);
export function assertPerm(req, perm) { if (!can(req, perm)) throw forbidden('PERMISSION_DENIED', `Missing permission: ${perm}`); }

// Entitlement check against the organization's configuration (independent from RBAC).
export function assertFeature(orgId, feature) {
  const org = get('SELECT * FROM organizations WHERE id=?', orgId);
  if (!org || !hasFeature(org, feature)) throw new HttpError(402, 'NOT_ENTITLED', `This feature (${feature}) is not included in the organization's configuration.`);
}
