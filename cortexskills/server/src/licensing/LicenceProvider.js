// D30 Licensing Implementation Schema: one abstract interface, two implementations chosen at boot by DEPLOYMENT_MODE.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config, ROOT } from '../config.js';
import { one, all } from '../db.js';
import { J } from '../lib/util.js';

const WARN_DAYS = 30;
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
    const p = path.join(ROOT, 'tools', 'keys', 'vendor-public.pem');
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  }
  static verify(licence) {
    try {
      const { signature, ...payload } = licence; const pk = OnPremLicenceProvider.publicKey();
      if (!pk || !signature) return false;
      return crypto.verify(null, Buffer.from(JSON.stringify(payload)), pk, Buffer.from(signature, 'base64'));
    } catch { return false; }
  }
  read() {
    if (!fs.existsSync(config.licenceFile)) return null;
    const all = J(fs.readFileSync(config.licenceFile, 'utf8'));
    // A .lic file may hold one licence or a list of licences (one per organization of the installation).
    const list = Array.isArray(all) ? all : [all];
    return list.find(l => l && l.companyId === this.orgId) || null;
  }
  check() { const l = this.read(); return evaluate(l, l ? OnPremLicenceProvider.verify(l) : false, this.activeUsers()); }
}

export function getLicenceProvider(orgId) {
  return config.deploymentMode === 'onprem' ? new OnPremLicenceProvider(orgId) : new SaasLicenceProvider(orgId);
}
export function licenceStatusAll() {
  return all(`SELECT id FROM organizations`).map(o => ({ orgId: o.id, ...getLicenceProvider(o.id).check() }));
}
