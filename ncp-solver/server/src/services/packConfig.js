import { randomUUID } from 'node:crypto';
import db from '../db/index.js';

// Single source of truth for the 3 NCP Solver Solution Packs' feature and
// quota matrix, transcribed from the Technical & Solution Offer (Section 3
// "Solution Packs Overview" and Section 4 "Configuration & Scale Options").
// Every number/flag below traces to a specific row in that document.
export const PACKS = {
  resolve: {
    label: 'Resolve (Essentials)',
    aiUseCasesIncluded: 3,          // "Governed AI Use Cases" row
    customAiUseCasesAllowed: 0,     // "Custom AI Use Cases" row — Not available
    maxAiUseCasesCombined: 3,       // "Maximum AI Use Cases (library + custom combined)"
    grcModules: false,              // Business Rules / Controls / Risks / RACSI — Not included
    capitalization: false,          // Add-On
    bpmnMode: 'none',               // none | view | edit
    aiAssistant: false,             // Add-On
    customRoles: false,             // Add-On
    integrationsIncluded: 0,
    standardsIncluded: 3,
    maxProjects: 10,
    maxObsNodes: 100,
    hierarchyDepth: 'org_project',  // org_project | group_org_project
    reportingScope: 'single_org',
  },
  govern: {
    label: 'Govern (Professional)',
    aiUseCasesIncluded: 7,
    customAiUseCasesAllowed: 5,
    maxAiUseCasesCombined: 12,
    grcModules: true,
    capitalization: true,
    bpmnMode: 'view',
    aiAssistant: false,             // Add-On
    customRoles: true,
    integrationsIncluded: 2,
    standardsIncluded: 5,
    maxProjects: 30,
    maxObsNodes: 500,
    hierarchyDepth: 'org_project',
    reportingScope: 'single_org',
  },
  assure: {
    label: 'Assure (Enterprise)',
    aiUseCasesIncluded: 14,
    customAiUseCasesAllowed: 25,
    maxAiUseCasesCombined: Infinity,
    grcModules: true,
    capitalization: true,
    bpmnMode: 'edit',
    aiAssistant: true,
    customRoles: true,
    integrationsIncluded: 5,
    standardsIncluded: 7,
    maxProjects: Infinity,
    maxObsNodes: Infinity,
    hierarchyDepth: 'group_org_project',
    reportingScope: 'group_wide',
  },
};

const ADDON_TO_FEATURE = {
  addon_capitalization: 'capitalization',
  addon_ai_assistant: 'aiAssistant',
  addon_custom_roles: 'customRoles',
};

/**
 * Effective feature/quota matrix for an Organization: the Pack's defaults,
 * raised by any Add-On the Organization has purchased. Add-Ons only ever
 * grant, never remove, capability (an Organization is never worse off than
 * its Pack's own baseline).
 */
export function getEffectiveConfig(license) {
  const pack = PACKS[license.plan_tier] || PACKS.govern;
  const effective = { ...pack, pack: license.plan_tier };

  for (const [column, feature] of Object.entries(ADDON_TO_FEATURE)) {
    if (license[column]) effective[feature] = true;
  }
  if (license.addon_bpmn_editing) effective.bpmnMode = 'edit';
  effective.sovereignDeployment = !!license.addon_sovereign_deployment || license.plan_tier === 'assure';

  effective.compliance = {
    gdpr: !!license.compliance_gdpr,
    iso27001: !!license.compliance_iso27001,
    soc2: !!license.compliance_soc2,
  };
  effective.supportTier = license.support_tier;
  effective.deploymentOption = license.deployment_option;

  return effective;
}

export function getOrgLicense(organizationId) {
  let row = db.prepare('SELECT * FROM licenses WHERE organization_id = ?').get(organizationId);
  if (!row) {
    const id = randomUUID();
    db.prepare('INSERT INTO licenses (id, organization_id) VALUES (?, ?)').run(id, organizationId);
    row = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id);
  }
  return row;
}

export function getOrgConfig(organizationId) {
  return getEffectiveConfig(getOrgLicense(organizationId));
}

/**
 * Express middleware: blocks the request with 403 pack_feature_not_included
 * unless the Organization's effective config has the given boolean feature
 * flag set (e.g. 'grcModules', 'capitalization', 'aiAssistant', 'customRoles').
 */
export function requirePackFeature(featureKey) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    const config = getOrgConfig(req.user.organizationId);
    if (config[featureKey]) return next();
    return res.status(403).json({ error: 'pack_feature_not_included', feature: featureKey, pack: config.pack });
  };
}

/**
 * Express middleware: blocks the request with 403 unless the Organization's
 * effective bpmnMode is at least 'view' ('view' or 'edit' for GET routes,
 * 'edit' only for write routes).
 */
export function requireBpmnMode(minMode) {
  const rank = { none: 0, view: 1, edit: 2 };
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    const config = getOrgConfig(req.user.organizationId);
    if (rank[config.bpmnMode] >= rank[minMode]) return next();
    return res.status(403).json({ error: 'pack_feature_not_included', feature: 'bpmn:' + minMode, pack: config.pack });
  };
}

/**
 * Quota checks (Section 4.9 "Scale & Quotas"). Each returns { ok, used, max }.
 * Callers issue a 409 quota_exceeded when ok is false, before the INSERT.
 */
export function checkProjectQuota(organizationId) {
  const config = getOrgConfig(organizationId);
  const used = db.prepare('SELECT COUNT(*) AS c FROM projects WHERE organization_id = ?').get(organizationId).c;
  return { ok: used < config.maxProjects, used, max: config.maxProjects };
}

export function checkObsNodeQuota(organizationId) {
  const config = getOrgConfig(organizationId);
  const used = db.prepare('SELECT COUNT(*) AS c FROM obs_nodes WHERE organization_id = ?').get(organizationId).c;
  return { ok: used < config.maxObsNodes, used, max: config.maxObsNodes };
}

// AI Use Cases quota is three-dimensional: how many library (non-custom) use
// cases are org-active, how many custom use cases exist at all, and the
// combined active total — each independently capped per Pack.
// creatingCustom: about to INSERT a new custom (org-authored) use case.
// activating: about to flip is_active 0 -> 1 for an existing use case
// (isCustom says whether that use case is a library or custom one).
export function checkAiUseCaseQuota(organizationId, { creatingCustom = false, activating = false, isCustom = false } = {}) {
  const config = getOrgConfig(organizationId);
  const libraryActive = db.prepare(
    "SELECT COUNT(*) AS c FROM ai_use_cases WHERE organization_id = ? AND is_custom = 0 AND is_active = 1"
  ).get(organizationId).c;
  const customTotal = db.prepare(
    'SELECT COUNT(*) AS c FROM ai_use_cases WHERE organization_id = ? AND is_custom = 1'
  ).get(organizationId).c;
  const combinedActive = db.prepare(
    'SELECT COUNT(*) AS c FROM ai_use_cases WHERE organization_id = ? AND is_active = 1'
  ).get(organizationId).c;

  if (creatingCustom && customTotal >= config.customAiUseCasesAllowed) {
    return { ok: false, reason: 'custom_ai_use_case_quota', used: customTotal, max: config.customAiUseCasesAllowed };
  }
  if (activating && !isCustom && libraryActive >= config.aiUseCasesIncluded) {
    return { ok: false, reason: 'library_ai_use_case_quota', used: libraryActive, max: config.aiUseCasesIncluded };
  }
  if ((creatingCustom || activating) && combinedActive >= config.maxAiUseCasesCombined) {
    return { ok: false, reason: 'combined_ai_use_case_quota', used: combinedActive, max: config.maxAiUseCasesCombined };
  }
  return { ok: true, libraryActive, customTotal, combinedActive, config };
}
