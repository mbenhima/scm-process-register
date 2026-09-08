import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

function withRoles(user) {
  const roles = db.prepare(`
    SELECT ur.id AS user_role_id, r.id AS role_id, r.code, r.name, ur.project_id, ur.obs_node_id
    FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?
  `).all(user.id);
  const { password_hash, ...safe } = user;
  return { ...safe, roles };
}

router.get('/', requirePermission('user.view'), (req, res) => {
  const rows = db.prepare('SELECT * FROM users WHERE organization_id = ? ORDER BY created_at DESC').all(req.user.organizationId);
  res.json(rows.map(withRoles));
});

// Minimal directory (id/name/email only) so any authenticated user can pick an
// owner/evaluator/team member without needing full user.view rights.
router.get('/directory', (req, res) => {
  const rows = db.prepare(`
    SELECT id, first_name, last_name, email FROM users WHERE organization_id = ? AND is_active = 1 ORDER BY first_name
  `).all(req.user.organizationId);
  res.json(rows);
});

router.get('/:id', requirePermission('user.view'), (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(withRoles(row));
});

router.post('/', requirePermission('user.create'), (req, res) => {
  const { username, email, password, first_name, last_name, language_preference, role_codes } = req.body || {};
  if (!email || !password || !first_name || !last_name) return res.status(400).json({ error: 'missing_fields' });
  const id = randomUUID();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (id, organization_id, username, email, password_hash, first_name, last_name, language_preference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.organizationId, username || email.split('@')[0], email, hash, first_name, last_name, language_preference || 'en');

  for (const code of role_codes || []) {
    const role = db.prepare('SELECT * FROM roles WHERE organization_id = ? AND code = ?').get(req.user.organizationId, code);
    if (role) db.prepare('INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)').run(randomUUID(), id, role.id);
  }
  db.prepare(`UPDATE licenses SET seats_used = (SELECT COUNT(*) FROM users WHERE organization_id = ?) WHERE organization_id = ?`)
    .run(req.user.organizationId, req.user.organizationId);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'User', id, null, { ...row, password_hash: undefined });
  res.status(201).json(withRoles(row));
});

router.put('/:id', requirePermission('user.edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { first_name, last_name, language_preference, is_active, password } = req.body || {};
  db.prepare(`
    UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
      language_preference = COALESCE(?, language_preference), is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(first_name, last_name, language_preference, is_active === undefined ? undefined : (is_active ? 1 : 0), req.params.id);
  if (password) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), req.params.id);
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'User', req.params.id, { ...existing, password_hash: undefined }, { ...row, password_hash: undefined });
  res.json(withRoles(row));
});

router.delete('/:id', requirePermission('user.delete'), (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare("UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  writeAudit(req, 'DELETE', 'User', req.params.id, { ...existing, password_hash: undefined }, null);
  res.status(204).end();
});

router.put('/:id/roles', requirePermission('user.manageRoles'), (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { role_codes = [], project_id = null, obs_node_id = null } = req.body || {};
  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(req.params.id);
  for (const code of role_codes) {
    const role = db.prepare('SELECT * FROM roles WHERE organization_id = ? AND code = ?').get(req.user.organizationId, code);
    if (role) db.prepare('INSERT INTO user_roles (id, user_id, role_id, project_id, obs_node_id) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), req.params.id, role.id, project_id, obs_node_id);
  }
  writeAudit(req, 'UPDATE', 'UserRoles', req.params.id, null, { role_codes });
  res.json(withRoles(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)));
});

export default router;
