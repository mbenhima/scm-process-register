import jwt from 'jsonwebtoken';
import db from '../db/index.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'ncp-solver-dev-secret-change-in-production';

export function signToken(user) {
  return jwt.sign({ sub: user.id, organizationId: user.organization_id }, JWT_SECRET, { expiresIn: '12h' });
}

/** Loads the user's permission codes (union across all assigned roles). */
function loadPermissions(userId) {
  const rows = db.prepare(`
    SELECT DISTINCT p.code
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ?
  `).all(userId);
  return new Set(rows.map((r) => r.code));
}

function loadRoles(userId) {
  const rows = db.prepare(`
    SELECT r.code, r.name, ur.project_id, ur.obs_node_id
    FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `).all(userId);
  return rows;
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'unauthenticated' });
    const roles = loadRoles(user.id);
    req.user = {
      id: user.id,
      organizationId: user.organization_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      languagePreference: user.language_preference,
      roles,
      roleCodes: roles.map((r) => r.code),
      permissions: loadPermissions(user.id),
    };
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}
