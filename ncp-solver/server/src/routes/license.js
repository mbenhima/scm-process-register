import { Router } from 'express';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';
import { getOrgLicense, getEffectiveConfig, PACKS } from '../services/packConfig.js';
import db from '../db/index.js';

const router = Router();

function withSeatsUsed(row, organizationId) {
  const seatsUsed = db.prepare('SELECT COUNT(*) AS c FROM users WHERE organization_id = ? AND is_active = 1').get(organizationId).c;
  if (seatsUsed !== row.seats_used) {
    db.prepare('UPDATE licenses SET seats_used = ? WHERE id = ?').run(seatsUsed, row.id);
    row = { ...row, seats_used: seatsUsed };
  }
  return row;
}

// Configuration Management: this is the evolved License & Plan module —
// selecting a Solution Pack (Resolve/Govern/Assure), toggling Add-Ons and
// Compliance Modules, and seeing the resulting feature/quota matrix live.
router.get('/', requirePermission('license.view'), (req, res) => {
  const row = withSeatsUsed(getOrgLicense(req.user.organizationId), req.user.organizationId);
  res.json(row);
});

// Deliberately open to any authenticated user (no license.view gate): the
// feature-flag matrix itself isn't sensitive, and every role's UI needs it to
// correctly show/hide Pack-gated nav items and actions — the actual
// enforcement is the requirePackFeature/requireBpmnMode 403 on each resource
// route, not this read.
router.get('/config', (req, res) => {
  const row = getOrgLicense(req.user.organizationId);
  res.json(getEffectiveConfig(row));
});

router.get('/packs', (_req, res) => {
  res.json(PACKS);
});

router.get('/usage', requirePermission('license.view'), (req, res) => {
  const orgId = req.user.organizationId;
  const projects = db.prepare('SELECT COUNT(*) AS c FROM projects WHERE organization_id = ?').get(orgId).c;
  const obsNodes = db.prepare('SELECT COUNT(*) AS c FROM obs_nodes WHERE organization_id = ?').get(orgId).c;
  const aiUseCasesActive = db.prepare('SELECT COUNT(*) AS c FROM ai_use_cases WHERE organization_id = ? AND is_active = 1').get(orgId).c;
  const aiUseCasesCustom = db.prepare('SELECT COUNT(*) AS c FROM ai_use_cases WHERE organization_id = ? AND is_custom = 1').get(orgId).c;
  // Only Annex A Standards Library entries (domain IS NOT NULL) count against
  // the Pack's pre-loaded-Standards allotment; sector-specific/customer-supplied
  // standards (domain NULL) are outside that allowance per the Technical Offer.
  const standardsActive = db.prepare("SELECT COUNT(*) AS c FROM standards WHERE organization_id = ? AND is_active = 1 AND domain IS NOT NULL").get(orgId).c;
  res.json({ projects, obsNodes, aiUseCasesActive, aiUseCasesCustom, standardsActive });
});

router.put('/', requirePermission('license.manage'), (req, res) => {
  const existing = getOrgLicense(req.user.organizationId);
  const {
    plan_tier, deployment_model, deployment_option, seats_total, billing_cycle, renewal_date, status,
    onprem_server_region, support_tier,
    addon_capitalization, addon_ai_assistant, addon_bpmn_editing, addon_custom_roles, addon_sovereign_deployment,
    compliance_gdpr, compliance_iso27001, compliance_soc2,
  } = req.body || {};

  if (plan_tier && !PACKS[plan_tier]) return res.status(400).json({ error: 'invalid_plan_tier' });

  const bool = (v, fallback) => (v === undefined ? fallback : (v ? 1 : 0));

  db.prepare(`
    UPDATE licenses SET
      plan_tier = COALESCE(?, plan_tier), deployment_model = COALESCE(?, deployment_model),
      deployment_option = COALESCE(?, deployment_option),
      seats_total = COALESCE(?, seats_total), billing_cycle = COALESCE(?, billing_cycle),
      renewal_date = COALESCE(?, renewal_date), status = COALESCE(?, status),
      onprem_server_region = COALESCE(?, onprem_server_region), support_tier = COALESCE(?, support_tier),
      addon_capitalization = ?, addon_ai_assistant = ?, addon_bpmn_editing = ?,
      addon_custom_roles = ?, addon_sovereign_deployment = ?,
      compliance_gdpr = ?, compliance_iso27001 = ?, compliance_soc2 = ?,
      updated_at = datetime('now')
    WHERE organization_id = ?
  `).run(
    plan_tier, deployment_model, deployment_option, seats_total, billing_cycle, renewal_date, status,
    onprem_server_region, support_tier,
    bool(addon_capitalization, existing.addon_capitalization),
    bool(addon_ai_assistant, existing.addon_ai_assistant),
    bool(addon_bpmn_editing, existing.addon_bpmn_editing),
    bool(addon_custom_roles, existing.addon_custom_roles),
    bool(addon_sovereign_deployment, existing.addon_sovereign_deployment),
    bool(compliance_gdpr, existing.compliance_gdpr),
    bool(compliance_iso27001, existing.compliance_iso27001),
    bool(compliance_soc2, existing.compliance_soc2),
    req.user.organizationId
  );
  const row = db.prepare('SELECT * FROM licenses WHERE organization_id = ?').get(req.user.organizationId);
  writeAudit(req, 'UPDATE', 'License', row.id, existing, row);

  // Activating a compliance module for the first time seeds its supporting
  // Standards/Controls scaffold; deactivating leaves seeded content in place
  // (never silently deletes governance history).
  import('../seed/complianceModules.js').then(({ activateComplianceModule }) => {
    if (compliance_gdpr && !existing.compliance_gdpr) activateComplianceModule(req.user.organizationId, 'gdpr');
    if (compliance_iso27001 && !existing.compliance_iso27001) activateComplianceModule(req.user.organizationId, 'iso27001');
    if (compliance_soc2 && !existing.compliance_soc2) activateComplianceModule(req.user.organizationId, 'soc2');
  }).catch(() => {});

  res.json(row);
});

export default router;
