import { Router } from 'express';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.get('/', requirePermission('dashboard.view'), (req, res) => {
  const orgId = req.user.organizationId;
  const counts = db.prepare(`
    SELECT status, COUNT(*) c FROM ncp_fiches WHERE organization_id = ? GROUP BY status
  `).all(orgId).reduce((acc, r) => ({ ...acc, [r.status]: r.c }), {});

  const myActions = db.prepare(`
    SELECT COUNT(*) c FROM actions WHERE organization_id = ? AND responsible_owner_id = ? AND status != 'done'
  `).get(orgId, req.user.id).c;

  const overdueActions = db.prepare(`
    SELECT COUNT(*) c FROM actions WHERE organization_id = ? AND status != 'done' AND status != 'cancelled'
      AND planned_completion_date IS NOT NULL AND planned_completion_date < date('now')
  `).get(orgId).c;

  const myFiches = db.prepare(`SELECT COUNT(*) c FROM ncp_fiches WHERE organization_id = ? AND detector_id = ?`).get(orgId, req.user.id).c;

  const recentFiches = db.prepare(`
    SELECT id, fiche_number, title, current_stage, status, criticality, priority, detection_date
    FROM ncp_fiches WHERE organization_id = ? ORDER BY created_at DESC LIMIT 8
  `).all(orgId);

  const unreadAlerts = db.prepare(`
    SELECT * FROM notification_alerts WHERE organization_id = ? AND (target_user_id = ? OR target_user_id IS NULL)
      AND read_at IS NULL ORDER BY created_at DESC LIMIT 10
  `).all(orgId, req.user.id);

  const byDepartment = db.prepare(`
    SELECT COALESCE(o.name, 'Unassigned') AS department, COUNT(*) c
    FROM ncp_fiches f LEFT JOIN obs_nodes o ON o.id = f.obs_node_id
    WHERE f.organization_id = ? GROUP BY department ORDER BY c DESC LIMIT 8
  `).all(orgId);

  res.json({
    ficheCounts: { open: counts.open || 0, in_progress: counts.in_progress || 0, closed: counts.closed || 0, cancelled: counts.cancelled || 0 },
    myOpenActions: myActions,
    overdueActions,
    myFiches,
    recentFiches,
    unreadAlerts,
    byDepartment,
  });
});

export default router;
