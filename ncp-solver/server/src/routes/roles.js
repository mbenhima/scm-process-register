import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

router.get('/', requirePermission('role.view'), (req, res) => {
  const roles = db.prepare('SELECT * FROM roles WHERE organization_id = ? ORDER BY is_system_role DESC, name').all(req.user.organizationId);
  res.json(roles);
});

router.post('/', requirePermission('role.create'), (req, res) => {
  const { code, name, name_fr, name_ar, description } = req.body || {};
  if (!code || !name) return res.status(400).json({ error: 'code_and_name_required' });
  const id = randomUUID();
  db.prepare(`
    INSERT INTO roles (id, organization_id, code, name, name_fr, name_ar, description, is_system_role)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `).run(id, req.user.organizationId, code, name, name_fr || null, name_ar || null, description || null);
  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'Role', id, null, row);
  res.status(201).json(row);
});

router.put('/:id', requirePermission('role.edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM roles WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { name, name_fr, name_ar, description } = req.body || {};
  db.prepare(`
    UPDATE roles SET name = COALESCE(?, name), name_fr = COALESCE(?, name_fr), name_ar = COALESCE(?, name_ar),
      description = COALESCE(?, description) WHERE id = ?
  `).run(name, name_fr, name_ar, description, req.params.id);
  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'Role', req.params.id, existing, row);
  res.json(row);
});

router.delete('/:id', requirePermission('role.delete'), (req, res) => {
  const existing = db.prepare('SELECT * FROM roles WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  if (existing.is_system_role) return res.status(400).json({ error: 'cannot_delete_system_role' });
  db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
  writeAudit(req, 'DELETE', 'Role', req.params.id, existing, null);
  res.status(204).end();
});

// --- Permission catalog + full role x permission matrix ---
router.get('/permissions/catalog', requirePermission('role.view'), (req, res) => {
  res.json(db.prepare('SELECT * FROM permissions ORDER BY module, action').all());
});

router.get('/permissions/matrix', requirePermission('role.view'), (req, res) => {
  const roles = db.prepare('SELECT * FROM roles WHERE organization_id = ? ORDER BY is_system_role DESC, name').all(req.user.organizationId);
  const grants = db.prepare(`
    SELECT rp.role_id, p.code FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    JOIN roles r ON r.id = rp.role_id WHERE r.organization_id = ?
  `).all(req.user.organizationId);
  const matrix = {};
  for (const g of grants) {
    matrix[g.role_id] = matrix[g.role_id] || new Set();
    matrix[g.role_id].add(g.code);
  }
  res.json({
    roles,
    permissions: db.prepare('SELECT * FROM permissions ORDER BY module, action').all(),
    matrix: Object.fromEntries(roles.map((r) => [r.id, Array.from(matrix[r.id] || [])])),
  });
});

router.put('/:id/permissions', requirePermission('role.managePermissions'), (req, res) => {
  const role = db.prepare('SELECT * FROM roles WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!role) return res.status(404).json({ error: 'not_found' });
  const { codes = [] } = req.body || {};
  db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(req.params.id);
  const insert = db.prepare('INSERT INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions WHERE code = ?');
  const tx = db.transaction((list) => { for (const c of list) insert.run(req.params.id, c); });
  tx(codes);
  writeAudit(req, 'UPDATE', 'RolePermissions', req.params.id, null, { codes });
  res.json({ ok: true, codes });
});

export default router;
