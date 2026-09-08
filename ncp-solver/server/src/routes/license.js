import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

router.get('/', requirePermission('license.view'), (req, res) => {
  let row = db.prepare('SELECT * FROM licenses WHERE organization_id = ?').get(req.user.organizationId);
  if (!row) {
    const id = randomUUID();
    db.prepare(`INSERT INTO licenses (id, organization_id) VALUES (?, ?)`).run(id, req.user.organizationId);
    row = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id);
  }
  const seatsUsed = db.prepare('SELECT COUNT(*) AS c FROM users WHERE organization_id = ? AND is_active = 1').get(req.user.organizationId).c;
  if (seatsUsed !== row.seats_used) {
    db.prepare('UPDATE licenses SET seats_used = ? WHERE id = ?').run(seatsUsed, row.id);
    row = { ...row, seats_used: seatsUsed };
  }
  res.json(row);
});

router.put('/', requirePermission('license.manage'), (req, res) => {
  const existing = db.prepare('SELECT * FROM licenses WHERE organization_id = ?').get(req.user.organizationId);
  const { plan_tier, deployment_model, seats_total, billing_cycle, renewal_date, status, onprem_server_region } = req.body || {};
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare(`
    UPDATE licenses SET
      plan_tier = COALESCE(?, plan_tier), deployment_model = COALESCE(?, deployment_model),
      seats_total = COALESCE(?, seats_total), billing_cycle = COALESCE(?, billing_cycle),
      renewal_date = COALESCE(?, renewal_date), status = COALESCE(?, status),
      onprem_server_region = COALESCE(?, onprem_server_region), updated_at = datetime('now')
    WHERE organization_id = ?
  `).run(plan_tier, deployment_model, seats_total, billing_cycle, renewal_date, status, onprem_server_region, req.user.organizationId);
  const row = db.prepare('SELECT * FROM licenses WHERE organization_id = ?').get(req.user.organizationId);
  writeAudit(req, 'UPDATE', 'License', row.id, existing, row);
  res.json(row);
});

export default router;
