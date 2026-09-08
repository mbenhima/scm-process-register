import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

const DEFAULT_KPI_THRESHOLDS = {
  kpi1_completion_immediate: 100, kpi2_effectiveness_immediate: 85, kpi3_on_time: 80,
  kpi4_completion_corrective: 100, kpi5_effectiveness_corrective: 80, kpi6_evaluations: 100,
  kpi7_standardization: 70, kpi8_generalization: 40, kpi10_closure: 85,
};
const DEFAULT_ALERTS = { A: true, B: true, C: true, D: true, E: true, F: true, G: true, H: true, I: true, J: true };

router.get('/', requirePermission('governance.view'), (req, res) => {
  let row = db.prepare('SELECT * FROM governance_settings WHERE organization_id = ?').get(req.user.organizationId);
  if (!row) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO governance_settings (id, organization_id, kpi_thresholds_json, alert_config_json)
      VALUES (?, ?, ?, ?)
    `).run(id, req.user.organizationId, JSON.stringify(DEFAULT_KPI_THRESHOLDS), JSON.stringify(DEFAULT_ALERTS));
    row = db.prepare('SELECT * FROM governance_settings WHERE id = ?').get(id);
  }
  res.json({
    ...row,
    kpi_thresholds: JSON.parse(row.kpi_thresholds_json || '{}'),
    alert_config: JSON.parse(row.alert_config_json || '{}'),
  });
});

router.put('/', requirePermission('governance.manage'), (req, res) => {
  const existing = db.prepare('SELECT * FROM governance_settings WHERE organization_id = ?').get(req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { default_language, rca_default_method, require_rex_before_close, kpi_thresholds, alert_config } = req.body || {};
  db.prepare(`
    UPDATE governance_settings SET
      default_language = COALESCE(?, default_language),
      rca_default_method = COALESCE(?, rca_default_method),
      require_rex_before_close = COALESCE(?, require_rex_before_close),
      kpi_thresholds_json = COALESCE(?, kpi_thresholds_json),
      alert_config_json = COALESCE(?, alert_config_json),
      updated_at = datetime('now')
    WHERE organization_id = ?
  `).run(
    default_language, rca_default_method,
    require_rex_before_close === undefined ? undefined : (require_rex_before_close ? 1 : 0),
    kpi_thresholds ? JSON.stringify(kpi_thresholds) : undefined,
    alert_config ? JSON.stringify(alert_config) : undefined,
    req.user.organizationId,
  );
  const row = db.prepare('SELECT * FROM governance_settings WHERE organization_id = ?').get(req.user.organizationId);
  writeAudit(req, 'UPDATE', 'GovernanceSettings', row.id, existing, row);
  res.json({ ...row, kpi_thresholds: JSON.parse(row.kpi_thresholds_json || '{}'), alert_config: JSON.parse(row.alert_config_json || '{}') });
});

export default router;
