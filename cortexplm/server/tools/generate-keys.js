// Vendor tool: generate an Ed25519 key pair for signing OnPrem licence files (D30 section 8).
// The private key stays with the vendor. The public key is copied into the server.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
fs.mkdirSync(path.join(here, 'keys'), { recursive: true });
fs.writeFileSync(path.join(here, 'keys', 'private-key.pem'), privateKey.export({ type: 'pkcs8', format: 'pem' }));
fs.writeFileSync(path.join(here, '..', 'src', 'licensing', 'vendor-public-key.pem'), publicKey.export({ type: 'spki', format: 'pem' }));
console.log('New key pair written. Keep tools/keys/private-key.pem secret; the public key is in src/licensing/.');
