// D30 Licensing Implementation Schema: one LicenceProvider interface, two implementations, chosen by
// DEPLOYMENT_MODE. No "if onprem" branches elsewhere in the code base.
//   check() -> { status: active|warning|expired|inactive, daysLeft, licence, reason }
//   canCreateUser(), getMode(), getMaxUsers(), getExpiryDate(), getPlan(), getFeatureFlags(),
//   hasAddOn(id), getActiveAddOns()
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { q } from '../db.js';
import { config } from '../config.js';
import { effectiveConfig } from '../lib/entitlements.js';

const WARNING_DAYS = 30; // CTRL-003 License Expiry Prevention

function statusFor(expiry, now = new Date()) {
  if (!expiry) return { status: 'active', daysLeft: null };
  const daysLeft = Math.ceil((new Date(expiry) - now) / 86400000);
  if (daysLeft < 0) return { status: 'expired', daysLeft };
  if (daysLeft <= WARNING_DAYS) return { status: 'warning', daysLeft };
  return { status: 'active', daysLeft };
}

// Canonical payload shared by both providers so the same fields are protected everywhere.
export const canonical = (l) => JSON.stringify({
  version: l.version ?? 1, companyId: l.companyId, companyName: l.companyName, hardwareId: l.hardwareId ?? '*',
  expiryDate: l.expiryDate, maxUsers: Number(l.maxUsers), plan: l.plan, features: [...(l.features || [])].sort(),
  addOns: [...(l.addOns || [])].sort(), issueDate: l.issueDate,
});

export function generateHardwareId() {
  const nets = Object.values(os.networkInterfaces()).flat().filter((n) => n && !n.internal && n.mac && n.mac !== '00:00:00:00:00:00');
  const mac = nets[0]?.mac || '';
  const fingerprint = `${mac}|${os.cpus()[0]?.model || ''}|${os.hostname()}|${os.totalmem()}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

class LicenceProvider {
  constructor(orgId) { this.orgId = orgId; }
  canCreateUser() {
    const used = q.get('SELECT COUNT(*) n FROM users WHERE org_id = ? AND active = 1', this.orgId).n;
    return used < this.getMaxUsers();
  }
  getExpiryDate() { const l = this.check().licence; return l?.expiryDate ? new Date(l.expiryDate) : null; }
  getMaxUsers() { return Number(this.check().licence?.maxUsers || 0); }
  getPlan() { return this.check().licence?.plan || null; }
  getFeatureFlags() { return this.check().licence?.features || []; }
  hasAddOn(id) { return this.getActiveAddOns().includes(id); }
  getActiveAddOns() { return this.check().licence?.addOns || []; }
}

// SaaS: the licence record lives in the database (org_config) and is HMAC-signed by the server so a
// direct database edit is detected (integrity check, CTRL-016 equivalent for SaaS).
export class SaasLicenceProvider extends LicenceProvider {
  getMode() { return 'saas'; }
  record() {
    const org = q.get('SELECT uid, name FROM organizations WHERE id = ?', this.orgId);
    const cfg = q.get('SELECT * FROM org_config WHERE org_id = ?', this.orgId);
    if (!org || !cfg) return null;
    const eff = effectiveConfig(this.orgId);
    return {
      version: 1, companyId: org.uid, companyName: org.name, hardwareId: '*', expiryDate: cfg.expiry_date,
      maxUsers: cfg.seats, plan: cfg.subscription_id, features: Object.keys(eff.features).filter((k) => eff.features[k]),
      addOns: [...eff.addons, ...eff.compliance.map((c) => 'COMPLIANCE-' + c)], issueDate: cfg.issue_date, signature: cfg.signature,
    };
  }
  static sign(l) { return crypto.createHmac('sha256', config.secret).update(canonical(l)).digest('base64'); }
  resign() {
    const l = this.record();
    if (l) q.run('UPDATE org_config SET signature = ?, updated_at = ? WHERE org_id = ?', SaasLicenceProvider.sign(l), new Date().toISOString(), this.orgId);
  }
  check(now = new Date()) {
    const l = this.record();
    if (!l) return { status: 'inactive', daysLeft: 0, reason: 'No licence record for this organization.' };
    if (l.signature !== SaasLicenceProvider.sign(l)) return { status: 'inactive', daysLeft: 0, licence: l, reason: 'Licence integrity check failed (record changed outside the application).' };
    return { ...statusFor(l.expiryDate, now), licence: l };
  }
}

// OnPrem: a vendor-signed .lic file (Ed25519) read from LICENSE_PATH, optionally hardware-bound.
export class OnPremLicenceProvider extends LicenceProvider {
  getMode() { return 'onprem'; }
  static publicKey() {
    const p = path.join(path.dirname(fileURLToPath(import.meta.url)), 'vendor-public-key.pem');
    return fs.readFileSync(p, 'utf8');
  }
  static verify(licence) {
    if (!licence?.signature) return 'Licence file is not signed.';
    const ok = crypto.verify(null, Buffer.from(canonical(licence)), OnPremLicenceProvider.publicKey(), Buffer.from(licence.signature, 'base64'));
    if (!ok) return 'Licence signature is invalid (RULE-LIC-001).';
    if (licence.hardwareId && licence.hardwareId !== '*' && licence.hardwareId !== generateHardwareId()) return 'Licence is bound to a different machine.';
    return null;
  }
  read() {
    if (!fs.existsSync(config.licensePath)) return null;
    try { return JSON.parse(fs.readFileSync(config.licensePath, 'utf8')); } catch { return null; }
  }
  check(now = new Date()) {
    const l = this.read();
    if (!l) return { status: 'inactive', daysLeft: 0, reason: `No licence file found at ${config.licensePath}. Upload one in Administration > Licensing.` };
    const err = OnPremLicenceProvider.verify(l);
    if (err) return { status: 'inactive', daysLeft: 0, licence: l, reason: err };
    const org = q.get('SELECT uid FROM organizations WHERE id = ?', this.orgId);
    if (org && l.companyId !== org.uid) return { status: 'inactive', daysLeft: 0, licence: l, reason: 'This licence file was issued for another organization.' };
    return { ...statusFor(l.expiryDate, now), licence: l };
  }
  // Strategy A2: the backend stores the uploaded file where it reads it from.
  static install(text) {
    const l = JSON.parse(text);
    const err = OnPremLicenceProvider.verify(l);
    if (err) throw new Error(err);
    fs.mkdirSync(path.dirname(config.licensePath), { recursive: true });
    fs.writeFileSync(config.licensePath, JSON.stringify(l, null, 2));
    return l;
  }
}

export function getLicenceProvider(orgId) {
  return config.deploymentMode === 'onprem' ? new OnPremLicenceProvider(orgId) : new SaasLicenceProvider(orgId);
}
