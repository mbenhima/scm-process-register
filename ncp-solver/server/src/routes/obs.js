import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

function buildTree(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, { ...n, children: [] }]));
  const roots = [];
  for (const n of byId.values()) {
    if (n.parent_id && byId.has(n.parent_id)) byId.get(n.parent_id).children.push(n);
    else roots.push(n);
  }
  return roots;
}

router.get('/', requirePermission('obs.view'), (req, res) => {
  const nodes = db.prepare('SELECT * FROM obs_nodes WHERE organization_id = ? ORDER BY node_type, name').all(req.user.organizationId);
  res.json({ flat: nodes, tree: buildTree(nodes) });
});

router.post('/', requirePermission('obs.manage'), (req, res) => {
  const { parent_id, node_type, name, name_fr, name_ar, code } = req.body || {};
  if (!node_type || !name) return res.status(400).json({ error: 'node_type_and_name_required' });
  const id = randomUUID();
  db.prepare(`
    INSERT INTO obs_nodes (id, organization_id, parent_id, node_type, name, name_fr, name_ar, code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.organizationId, parent_id || null, node_type, name, name_fr || null, name_ar || null, code || null);
  const row = db.prepare('SELECT * FROM obs_nodes WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'ObsNode', id, null, row);
  res.status(201).json(row);
});

router.put('/:id', requirePermission('obs.manage'), (req, res) => {
  const existing = db.prepare('SELECT * FROM obs_nodes WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { name, name_fr, name_ar, code, node_type, parent_id } = req.body || {};
  db.prepare(`
    UPDATE obs_nodes SET name = COALESCE(?, name), name_fr = COALESCE(?, name_fr), name_ar = COALESCE(?, name_ar),
      code = COALESCE(?, code), node_type = COALESCE(?, node_type), parent_id = ?
    WHERE id = ?
  `).run(name, name_fr, name_ar, code, node_type, parent_id === undefined ? existing.parent_id : parent_id, req.params.id);
  const row = db.prepare('SELECT * FROM obs_nodes WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'ObsNode', req.params.id, existing, row);
  res.json(row);
});

router.delete('/:id', requirePermission('obs.manage'), (req, res) => {
  const existing = db.prepare('SELECT * FROM obs_nodes WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM obs_nodes WHERE id = ?').run(req.params.id);
  writeAudit(req, 'DELETE', 'ObsNode', req.params.id, existing, null);
  res.status(204).end();
});

export default router;
