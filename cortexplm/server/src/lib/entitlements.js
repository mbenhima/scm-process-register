// Single source of truth for Solution Pack / Bundle entitlements, feature gates and quotas
// (FR-DA-CFG-01/02, NFR-DA-MAINT-03). Every enforcing route calls into this module.
import { q } from '../db.js';
import { PACK, BUNDLE, D26, ADDON, INTEGRATION, COMPLIANCE_STANDARDS, PROC } from './ref.js';

const TIER_RANK = { Foundation: 1, Professional: 2, Advanced: 3, 'Advanced (Industry)': 3, Enterprise: 4 };
const QUOTAS = {
  1: { projects: 40, obsNodes: 40, customAiUseCases: 2 },
  2: { projects: 120, obsNodes: 120, customAiUseCases: 5 },
  3: { projects: 300, obsNodes: 300, customAiUseCases: 10 },
  4: { projects: 5000, obsNodes: 5000, customAiUseCases: 100 },
};

// Feature -> macro processes, any one of which unlocks it. null = always available (standard).
export const FEATURES = {
  projects: { label: 'Innovation projects, E2E runs and gates', mps: null },
  trackConfig: { label: 'Track & process configuration (edit)', mps: ['MP-123', 'MP-124'] },
  governance: { label: 'Business rules, controls, risks (GRC)', mps: ['MP-12'] },
  bpmnEdit: { label: 'BPMN full editing', mps: ['MP-29'] },
  ai: { label: 'AI Use Case suggestions', mps: ['MP-15', 'MP-57'] },
  assistant: { label: 'AI Assistant', mps: ['MP-15', 'MP-20'] },
  integrations: { label: 'External Integration Registry', mps: ['MP-28'] },
  customKpis: { label: 'Custom KPIs', mps: null },
  reports: { label: 'Standard reports', mps: null },
  templates: { label: 'Template libraries', mps: null },
  wbs: { label: 'WBS & Gantt scheduling', mps: null },
  rex: { label: 'Return on Experience', mps: null },
};

export function subscriptionPacks(subscriptionId) {
  if (!subscriptionId) return [];
  if (subscriptionId === 'PACK-11' || subscriptionId === 'BND-08') return Object.keys(PACK);
  if (BUNDLE[subscriptionId]) return BUNDLE[subscriptionId].packs;
  if (PACK[subscriptionId]) return [subscriptionId];
  return [];
}

export function packMacroProcesses(packId) {
  if (packId === 'PACK-11') return PROC.macroProcesses.map((m) => m.id);
  return (D26[packId]?.Included_Macro_Process_IDs || '').match(/MP-\d+/g) || [];
}

export function effectiveConfig(orgId) {
  const cfg = q.get('SELECT * FROM org_config WHERE org_id = ?', orgId);
  if (!cfg) return null;
  const packs = subscriptionPacks(cfg.subscription_id);
  const mps = new Set(packs.flatMap(packMacroProcesses));
  const tier = Math.max(1, ...packs.map((p) => TIER_RANK[D26[p]?.Tier] || 1));
  const addons = q.all('SELECT addon_id FROM org_addons WHERE org_id = ?', orgId).map((r) => r.addon_id);
  const compliance = q.all('SELECT standard_id FROM org_compliance WHERE org_id = ?', orgId).map((r) => r.standard_id);
  const features = Object.fromEntries(Object.entries(FEATURES).map(([k, f]) => [k, !f.mps || f.mps.some((m) => mps.has(m))]));
  // An AI add-on grants AI use cases to a pack that does not include them standard (FR-DA-CFG-03).
  if (addons.some((a) => a.startsWith('ADD-AI-'))) { features.ai = true; features.assistant = true; }
  const quotas = { ...QUOTAS[tier] };
  return {
    subscriptionId: cfg.subscription_id,
    subscriptionName: PACK[cfg.subscription_id]?.name || BUNDLE[cfg.subscription_id]?.name,
    packs, tier, tierName: Object.keys(TIER_RANK).find((k) => TIER_RANK[k] === tier),
    aiTier: tier >= 3 ? 'Assistive + Augmented' : 'Assistive only',
    augmentedAllowed: tier >= 3,
    macroProcesses: [...mps].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))),
    features, quotas, addons, compliance,
    seats: cfg.seats, expiryDate: cfg.expiry_date, deploymentOption: cfg.deployment_option,
    supportTier: cfg.support_tier, billingCycle: cfg.billing_cycle,
  };
}

export function usage(orgId) {
  const c = (sql) => q.get(sql, orgId).n;
  return {
    projects: c('SELECT COUNT(*) n FROM projects WHERE org_id = ?'),
    obsNodes: c('SELECT COUNT(*) n FROM obs_nodes WHERE org_id = ?'),
    customAiUseCases: c('SELECT COUNT(*) n FROM ai_use_cases WHERE org_id = ? AND is_custom = 1'),
    seats: c('SELECT COUNT(*) n FROM users WHERE org_id = ? AND active = 1'),
  };
}

export class EntitlementError extends Error {
  constructor(message, status = 403) { super(message); this.status = status; }
}

export function requireFeatureFor(orgId, feature) {
  const eff = effectiveConfig(orgId);
  if (!eff?.features[feature]) {
    const f = FEATURES[feature];
    throw new EntitlementError(`Feature not included in your subscription: ${f.label}. It requires one of ${f.mps.join(', ')}.`);
  }
  return eff;
}

// Express middleware: Pack gate, enforced server-side independently of RBAC (FR-DA-CFG-06, NFR-DA-SEC-09).
export const requireFeature = (feature) => (req, res, next) => {
  try { requireFeatureFor(req.orgId, feature); next(); } catch (e) { res.status(e.status || 403).json({ error: e.message, feature }); }
};

export function checkQuota(orgId, dimension) {
  const eff = effectiveConfig(orgId);
  const used = usage(orgId)[dimension];
  if (used >= eff.quotas[dimension]) {
    throw new EntitlementError(`Quota reached for ${dimension}: ${used} of ${eff.quotas[dimension]} used. Upgrade the subscription to add more.`, 409);
  }
}

export function addonCompatible(addonId, packs) {
  const a = ADDON[addonId];
  if (!a) return false;
  return a.packs.includes('ALL') || packs.includes('PACK-11') || a.packs.some((p) => packs.includes(p));
}

export function integrationCompatible(intId, packs) {
  const i = INTEGRATION[intId];
  if (!i) return false;
  return packs.includes('PACK-11') || i.packs.some((p) => packs.includes(p));
}

export const complianceCatalog = () => COMPLIANCE_STANDARDS.map(({ controls, ...s }) => ({ ...s, controlCount: controls.length }));
