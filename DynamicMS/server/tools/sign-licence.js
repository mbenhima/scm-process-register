// Issues a signed on-premises licence (Ed25519). The vendor keeps licence/private.pem;
// the server only needs licence/public.pem.
// Usage: npm run sign-licence -- --customer "Horizon Industrial Group" --seats 1200 --expires 2027-12-31 --packs DMS-ENT,DMS-AI
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'licence');
fs.mkdirSync(dir, { recursive: true });
const priv = path.join(dir, 'private.pem'); const pub = path.join(dir, 'public.pem');
if (!fs.existsSync(priv)) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(priv, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  fs.writeFileSync(pub, publicKey.export({ type: 'spki', format: 'pem' }));
  console.log('Generated a new Ed25519 key pair in licence/.');
}
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const payload = { customer: arg('customer', 'Demo customer'), seats: +arg('seats', 2000), expires: arg('expires', '2027-12-31'), packs: arg('packs', 'DMS-ENT').split(','), issued: new Date().toISOString().slice(0, 10), deploymentMode: arg('mode', 'DEP-5') };
const signature = crypto.sign(null, Buffer.from(JSON.stringify(payload)), crypto.createPrivateKey(fs.readFileSync(priv))).toString('base64');
const out = path.join(dir, 'licence.lic');
fs.writeFileSync(out, JSON.stringify({ payload, signature }, null, 2));
console.log(`Licence written to ${out}`);
