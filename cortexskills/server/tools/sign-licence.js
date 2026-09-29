#!/usr/bin/env node
// Vendor signing tool (D30 §8). Generates the Ed25519 key pair on first use and signs one licence per customer.
// Usage: npm run sign-licence -- --company "Acme Corp" --companyId <organization id> --expiry 2027-12-31 --maxUsers 100 --plan PK-01 --features analytics,export --output ./data/license.lic
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const keyDir = path.join(here, 'keys');
export function ensureKeys() {
  fs.mkdirSync(keyDir, { recursive: true });
  const priv = path.join(keyDir, 'vendor-private.pem'), pub = path.join(keyDir, 'vendor-public.pem');
  if (!fs.existsSync(priv)) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(priv, privateKey.export({ type: 'pkcs8', format: 'pem' }));
    fs.writeFileSync(pub, publicKey.export({ type: 'spki', format: 'pem' }));
  }
  return { privateKey: fs.readFileSync(priv, 'utf8'), publicKey: fs.readFileSync(pub, 'utf8') };
}
export function signLicence(data) {
  const { privateKey } = ensureKeys();
  const payload = JSON.stringify(data);
  return { ...data, signature: crypto.sign(null, Buffer.from(payload), privateKey).toString('base64') };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = {}; const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) a[argv[i].replace(/^--/, '')] = argv[i + 1];
  if (!a.company || !a.companyId) { console.log('Usage: npm run sign-licence -- --company "Acme Corp" --companyId <id> --expiry 2027-12-31 --maxUsers 100 --plan PK-01 --features analytics,export --output ./data/license.lic'); process.exit(1); }
  const lic = signLicence({
    version: 1, companyId: a.companyId, companyName: a.company, hardwareId: a.hardwareId || null,
    expiryDate: new Date((a.expiry || '2027-12-31') + 'T23:59:59Z').toISOString(), maxUsers: Number(a.maxUsers || 100),
    plan: a.plan || 'PK-01', features: (a.features || '').split(',').filter(Boolean), issueDate: new Date().toISOString(),
  });
  const out = a.output || `./${a.company.replace(/\W+/g, '')}.lic`;
  fs.writeFileSync(out, JSON.stringify(lic, null, 2));
  console.log('Licence written to', out);
}
