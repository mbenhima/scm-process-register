import { Router } from 'express';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

// Read-only: requirements are seeded reference content per Standard, not user-authored.
router.get('/', requirePermission('standard.view'), (req, res) => {
  let sql = 'SELECT * FROM standard_requirements WHERE organization_id = ?';
  const params = [req.user.organizationId];
  if (req.query.standard_id) { sql += ' AND standard_id = ?'; params.push(req.query.standard_id); }
  sql += ' ORDER BY order_index ASC';
  res.json(db.prepare(sql).all(...params));
});

export default router;
