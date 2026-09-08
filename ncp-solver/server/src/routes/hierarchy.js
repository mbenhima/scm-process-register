import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

// Full hierarchy context for the current user's organization:
// Group (optional, "yes/no") -> Organization -> Projects (optional, "yes/no")
router.get('/tree', requirePermission('hierarchy.view'), (req, res) => {
  const organization = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.user.organizationId);
  let group = null;
  let siblingOrganizations = [];
  if (organization?.group_id) {
    group = db.prepare('SELECT * FROM groups WHERE id = ?').get(organization.group_id);
    siblingOrganizations = db.prepare('SELECT * FROM organizations WHERE group_id = ? ORDER BY name').all(organization.group_id);
  }
  const projects = db.prepare('SELECT * FROM projects WHERE organization_id = ? ORDER BY created_at DESC').all(req.user.organizationId);
  res.json({ group, organization, siblingOrganizations, projects, hasGroup: !!group, hasProjects: projects.length > 0 });
});

router.put('/organization', requirePermission('hierarchy.manage'), (req, res) => {
  const { name, name_fr, name_ar, sector, country, logo_color } = req.body || {};
  const existing = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.user.organizationId);
  db.prepare(`
    UPDATE organizations SET name = COALESCE(?, name), name_fr = COALESCE(?, name_fr), name_ar = COALESCE(?, name_ar),
      sector = COALESCE(?, sector), country = COALESCE(?, country), logo_color = COALESCE(?, logo_color)
    WHERE id = ?
  `).run(name, name_fr, name_ar, sector, country, logo_color, req.user.organizationId);
  const row = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.user.organizationId);
  writeAudit(req, 'UPDATE', 'Organization', req.user.organizationId, existing, row);
  res.json(row);
});

// Create a sibling organization within the same group (group-of-companies scenario).
router.post('/organizations', requirePermission('hierarchy.manage'), (req, res) => {
  const current = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.user.organizationId);
  if (!current.group_id) return res.status(400).json({ error: 'organization_not_in_a_group' });
  const { name, name_fr, name_ar, sector, sector_type, country } = req.body || {};
  if (!name || !sector) return res.status(400).json({ error: 'name_and_sector_required' });
  const id = randomUUID();
  db.prepare(`
    INSERT INTO organizations (id, group_id, name, name_fr, name_ar, sector, sector_type, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, current.group_id, name, name_fr || null, name_ar || null, sector, sector_type || 'private', country || current.country);
  const row = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'Organization', id, null, row);
  res.status(201).json(row);
});

// --- Projects (optional sub-entity of an organization) ---
router.get('/projects', requirePermission('hierarchy.view'), (req, res) => {
  const rows = db.prepare('SELECT * FROM projects WHERE organization_id = ? ORDER BY created_at DESC').all(req.user.organizationId);
  res.json(rows);
});

router.post('/projects', requirePermission('hierarchy.manage'), (req, res) => {
  const { name, name_fr, name_ar, description, status, start_date, end_date } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name_required' });
  const id = randomUUID();
  db.prepare(`
    INSERT INTO projects (id, organization_id, name, name_fr, name_ar, description, status, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.organizationId, name, name_fr || null, name_ar || null, description || null, status || 'active', start_date || null, end_date || null);
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'Project', id, null, row);
  res.status(201).json(row);
});

router.put('/projects/:id', requirePermission('hierarchy.manage'), (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { name, name_fr, name_ar, description, status, start_date, end_date } = req.body || {};
  db.prepare(`
    UPDATE projects SET name = COALESCE(?, name), name_fr = COALESCE(?, name_fr), name_ar = COALESCE(?, name_ar),
      description = COALESCE(?, description), status = COALESCE(?, status),
      start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date)
    WHERE id = ?
  `).run(name, name_fr, name_ar, description, status, start_date, end_date, req.params.id);
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'Project', req.params.id, existing, row);
  res.json(row);
});

router.delete('/projects/:id', requirePermission('hierarchy.manage'), (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  writeAudit(req, 'DELETE', 'Project', req.params.id, existing, null);
  res.status(204).end();
});

export default router;
