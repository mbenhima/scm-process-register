// Single source of truth for Solution Pack, Add-On and Compliance entitlement and quotas
// (FR-DA-CFG-01, NFR-DA-MAINT-03). Every enforcing route calls into this module.
import { one, all } from './db.js';
import { J, HttpError } from './lib/util.js';
import * as cat from './catalog.js';

/** Solution Pack variants: the 8 packs, the 5 bundles and the SME packs (FR-DA-PKG-01). */
export function solutionPacks() { return cat.list('solutionPack'); }
export function solutionPack(id) { return cat.get('solutionPack', id); }

export function orgConfig(orgId) {
  const c = one(`SELECT * FROM org_config WHERE org_id=?`, orgId);
  if (!c) return null;
  return { ...c, addons: J(c.addons, []), compliance: J(c.compliance, []), justification_required: !!c.justification_required, sme_mode: !!c.sme_mode };
}

/** Modules the organization is entitled to, given its pack, add-ons and compliance standards. */
export function entitledModules(orgId) {
  const cfg = orgConfig(orgId);
  if (!cfg) return new Set(['M00']);
  const sp = solutionPack(cfg.pack_id);
  const packs = new Set(sp ? sp.packs : []);
  const out = new Set();
  for (const m of cat.list('module')) {
    if (m.core) out.add(m.id);
    else if (m.packs.some(p => packs.has(p))) out.add(m.id);
    else if (m.addons.some(a => cfg.addons.includes(a))) out.add(m.id);
    else if (m.id === 'M52' && cfg.compliance.length) out.add(m.id);
  }
  if (sp && sp.allModules) for (const m of cat.list('module')) if (m.id !== 'M52' || cfg.compliance.length) out.add(m.id);
  return out;
}

export function aiTier(orgId) {
  const cfg = orgConfig(orgId); const sp = cfg && solutionPack(cfg.pack_id);
  return sp?.aiTier || 'Assistive';
}

export function quotas(orgId) {
  const cfg = orgConfig(orgId); const sp = cfg && solutionPack(cfg.pack_id);
  const q = { ...(sp?.quotas || { projects: 10, obs: 50, aiCustom: 3, questionnaires: 100 }) };
  if (cfg?.addons.includes('AD-11')) q.questionnaires = null; // AD-11 lifts the questionnaire limit
  q.users = licenceMaxUsers(orgId);
  return q;
}
function licenceMaxUsers(orgId) {
  const l = one(`SELECT data FROM licences WHERE org_id=?`, orgId);
  return l ? J(l.data).maxUsers : null;
}

export function usage(orgId) {
  const month = new Date().toISOString().slice(0, 7);
  return {
    projects: one(`SELECT COUNT(*) n FROM projects WHERE org_id=?`, orgId).n,
    obs: one(`SELECT COUNT(*) n FROM obs_nodes WHERE org_id=?`, orgId).n,
    aiCustom: one(`SELECT COUNT(*) n FROM records WHERE entity='AIUseCase' AND org_id=? AND json_extract(data,'$.isCustom')=1`, orgId).n,
    questionnaires: one(`SELECT COUNT(*) n FROM records WHERE entity='Questionnaire' AND org_id=? AND substr(created_at,1,7)=?`, orgId, month).n,
    users: one(`SELECT COUNT(*) n FROM users WHERE org_id=? AND active=1`, orgId).n,
  };
}

/** Server-side quota check at creation (FR-DA-TEN-07, NFR-DA-SEC-08): rejects with 409. */
export function checkQuota(orgId, dim) {
  const q = quotas(orgId)[dim]; if (q == null) return;
  const u = usage(orgId)[dim];
  if (u >= q) throw new HttpError(409, 'err.quota', { dimension: dim, limit: q });
}

/** Express middleware: the organization must be entitled to a module (FR-DA-CFG-06, NFR-DA-SEC-09). */
export function requireModule(moduleId) {
  return (req, res, next) => {
    if (!req.orgId) return next(new HttpError(400, 'err.noOrg'));
    if (!entitledModules(req.orgId).has(moduleId)) return next(new HttpError(403, 'err.notEntitled', { feature: moduleId }));
    next();
  };
}
export function requireAddon(addonId) {
  return (req, res, next) => {
    const cfg = orgConfig(req.orgId);
    const sp = cfg && solutionPack(cfg.pack_id);
    if (cfg && (cfg.addons.includes(addonId) || sp?.includedAddons?.includes(addonId))) return next();
    next(new HttpError(403, 'err.notEntitled', { feature: addonId }));
  };
}

export function effectiveConfig(orgId) {
  const cfg = orgConfig(orgId);
  return { config: cfg, pack: cfg && solutionPack(cfg.pack_id), modules: [...entitledModules(orgId)], aiTier: aiTier(orgId), quotas: quotas(orgId), usage: usage(orgId) };
}

export function priceOf(packId, users) {
  const sp = solutionPack(packId); if (!sp) return null;
  const extra = Math.max(0, users - (sp.includedUsers || 0));
  const base = sp.price, overage = +(extra * (sp.overage || 0)).toFixed(2);
  return { base, overage, total: +(base + overage).toFixed(2), explanation: sp.priceRule };
}

export const listOrgsWithPack = packId => all(`SELECT org_id FROM org_config WHERE pack_id=?`, packId).map(r => r.org_id);
