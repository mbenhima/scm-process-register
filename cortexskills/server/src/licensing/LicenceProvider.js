// D30 Licensing Implementation Schema: one abstract interface, two implementations chosen at boot by DEPLOYMENT_MODE.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { config } from '../config.js';
import { one, all } from '../db.js';
import { J } from '../lib/util.js';

const WARN_DAYS = 30;
let cache = { key: null, list: [] };
function evaluate(licence, signatureOk, activeUsers) {
  if (!licence) return { status: 'inactive', daysLeft: 0, licence: null, reason: 'missing' };
  if (!signatureOk) return { status: 'inactive', daysLeft: 0, licence, reason: 'signature' };            // RULE-LIC-001
  const daysLeft = Math.ceil((new Date(licence.expiryDate) - Date.now()) / 86400000);
  if (daysLeft < 0) return { status: 'expired', daysLeft, licence, reason: 'expired', readOnly: true };   // RULE-LIC-002 / CTRL-003
  return { status: daysLeft <= WARN_DAYS ? 'warning' : 'active', daysLeft, licence, activeUsers };      // RULE-074
}

/** Interface (documented): check(), canCreateUser(), getMode(), getMaxUsers(), getExpiryDate(), getPlan(), getFeatureFlags(), hasAddOn(), getActiveAddOns(). */
class BaseProvider {
  constructor(orgId) { this.orgId = orgId; }
  activeUsers() { return one(`SELECT COUNT(*) n FROM users WHERE org_id=? AND active=1`, this.orgId).n; }
  canCreateUser() { const c = this.check(); return c.status !== 'inactive' && c.status !== 'expired' && this.activeUsers() < this.getMaxUsers(); } // RULE-LIC-003
  getMaxUsers() { return this.check().licence?.maxUsers ?? 0; }
  getExpiryDate() { const l = this.check().licence; return l ? new Date(l.expiryDate) : null; }
  getPlan() { return this.check().licence?.plan ?? null; }
  getFeatureFlags() { return this.check().licence?.features ?? []; }
  hasAddOn(addOnId) { return this.getActiveAddOns().includes(addOnId); }
  getActiveAddOns() {
    const c = one(`SELECT addons, compliance FROM org_config WHERE org_id=?`, this.orgId);
    return c ? [...J(c.addons, []), ...J(c.compliance, [])] : [];
  }
}

/** SaaS: licence record per organization in the database, protected by an HMAC signature. */
export class SaasLicenceProvider extends BaseProvider {
  getMode() { return 'saas'; }
  static sign(data) { return crypto.createHmac('sha256', config.hmacSecret).update(JSON.stringify(data)).digest('hex'); }
  check() {
    const row = one(`SELECT data, signature FROM licences WHERE org_id=?`, this.orgId);
    if (!row) return evaluate(null);
    const data = J(row.data);
    const expected = SaasLicenceProvider.sign(data);
    const ok = expected.length === row.signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(row.signature));
    return evaluate(data, ok, this.activeUsers());
  }
}

/** OnPrem: one signed .lic file per customer, verified with the vendor's Ed25519 public key (CTRL-016). */
export class OnPremLicenceProvider extends BaseProvider {
  getMode() { return 'onprem'; }
  static publicKey() {
    const p = config.vendorPublicKeyFile();
    return p ? fs.readFileSync(p, 'utf8') : null;
  }
  static verify(licence) {
    try {
      const { signature, ...payload } = licence; const pk = OnPremLicenceProvider.publicKey();
      if (!pk || !signature) return false;
      return crypto.verify(null, Buffer.from(JSON.stringify(payload)), pk, Buffer.from(signature, 'base64'));
    } catch { return false; }
  }
  /** Every licence of the installation file (one per organization), read again only when the file changes. */
  static all() {
    let st; try { st = fs.statSync(config.licenceFile); } catch { cache = { key: null, list: [] }; return []; }
    const key = `${st.mtimeMs}:${st.size}`;
    if (cache.key !== key) { const all = J(fs.readFileSync(config.licenceFile, 'utf8')); cache = { key, list: (Array.isArray(all) ? all : [all]).filter(Boolean).map(l => ({ licence: l, valid: OnPremLicenceProvider.verify(l) })) }; }
    return cache.list;
  }
  read() { return OnPremLicenceProvider.all().find(x => x.licence.companyId === this.orgId)?.licence || null; }
  check() { const l = this.read(); return evaluate(l, l ? OnPremLicenceProvider.verify(l) : false, this.activeUsers()); }
  /** Add-ons of the signed licence and the standards activated by the customer. */
  getActiveAddOns() { const c = one(`SELECT compliance FROM org_config WHERE org_id=?`, this.orgId); return [...(licensedTerms(this.orgId)?.addons || []), ...J(c?.compliance, [])]; }
}

/** OnPrem: the terms of the organization's valid licence — plan, users, add-ons — or null in SaaS mode. */
export function licensedTerms(orgId) {
  if (config.deploymentMode !== 'onprem') return null;
  const x = OnPremLicenceProvider.all().find(l => l.licence.companyId === orgId && l.valid);
  if (!x) return { plan: null, maxUsers: 0, addons: [] };
  const l = x.licence;
  return { plan: l.plan || null, maxUsers: Number(l.maxUsers) || 0, addons: Array.isArray(l.addons) ? l.addons : [], expiryDate: l.expiryDate };
}

export function getLicenceProvider(orgId) {
  return config.deploymentMode === 'onprem' ? new OnPremLicenceProvider(orgId) : new SaasLicenceProvider(orgId);
}
export function licenceStatusAll() {
  return all(`SELECT id FROM organizations`).map(o => ({ orgId: o.id, ...getLicenceProvider(o.id).check() }));
}
