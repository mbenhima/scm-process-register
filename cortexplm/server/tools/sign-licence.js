// Vendor signing tool (D30 section 8). ONE licence file per customer; maxUsers controls seats.
// Usage: npm run sign-licence -- --companyId ORG-PUB-001 --company "Metro City Digital Services Agency" \
//        --expiry 2027-12-31 --maxUsers 50 --plan PACK-11 --features projects,reports --hardwareId "*" --output ./licence/licence.lic
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical } from '../src/licensing/index.js';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []));
const need = ['companyId', 'company', 'expiry', 'maxUsers', 'plan'];
const missing = need.filter((k) => !args[k]);
if (missing.length) { console.error('Missing: ' + missing.map((m) => '--' + m).join(', ')); process.exit(1); }
const licence = {
  version: 1, companyId: args.companyId, companyName: args.company, hardwareId: args.hardwareId || '*',
  expiryDate: new Date(args.expiry + 'T23:59:59Z').toISOString(), maxUsers: Number(args.maxUsers), plan: args.plan,
  features: (args.features || '').split(',').filter(Boolean), addOns: (args.addOns || '').split(',').filter(Boolean),
  issueDate: new Date().toISOString(),
};
const privateKey = fs.readFileSync(path.join(here, 'keys', 'private-key.pem'), 'utf8');
licence.signature = crypto.sign(null, Buffer.from(canonical(licence)), privateKey).toString('base64');
const out = path.resolve(args.output || `./${args.companyId}.lic`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(licence, null, 2));
console.log('Licence written to ' + out);
