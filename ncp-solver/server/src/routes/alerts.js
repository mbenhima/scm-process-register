import { Router } from 'express';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { runMonitoringAgent } from '../services/aiAgents.js';

const router = Router();

router.get('/', requirePermission('alert.view'), (req, res) => {
  let sql = 'SELECT * FROM notification_alerts WHERE organization_id = ?';
  const params = [req.user.organizationId];
  if (req.query.unread === 'true') { sql += ' AND read_at IS NULL'; }
  if (req.query.target_user_id) { sql += ' AND target_user_id = ?'; params.push(req.query.target_user_id); }
  sql += ' ORDER BY created_at DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params));
});

router.post('/run', requirePermission('alert.manage'), (req, res) => {
  const alerts = runMonitoringAgent(req.user.organizationId);
  res.json({ generated: alerts.length, alerts });
});

router.put('/:id/read', requirePermission('alert.view'), (req, res) => {
  db.prepare(`UPDATE notification_alerts SET read_at = datetime('now') WHERE id = ? AND organization_id = ?`)
    .run(req.params.id, req.user.organizationId);
  res.json({ ok: true });
});

export default router;
