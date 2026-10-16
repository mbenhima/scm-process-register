// Licence management (editor edition): the editor issues, re-issues, revokes and deletes the
// licences of its on-premises customers. A licence is a JSON payload signed with the editor's
// Ed25519 private key; customer installations verify it with the public key compiled into them.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { get, all, run, uid, now, J, P, tx } from '../db.js';
import { HttpError } from '../http.js';
import { catalog } from '../catalog/store.js';
import { BASE_PACKS, CAPABILITY_FEATURES, ADDON_FEATURES, COMPLIANCE_STANDARDS } from '../packs.js';
import { EMBEDDED_PUBLIC_KEY } from './ops.js';

const fingerprint = (pubKey) => crypto.createHash('sha256').update(pubKey.export({ type: 'spki', format: 'der' })).digest('hex').slice(0, 16).replace(/(.{4})(?!$)/g, '$1:');

/** State of the signing key: present, readable, and matching the key compiled into customer installations. */
export function keyStatus() {
  const file = config.licenceSigningKey;
  if (!fs.existsSync(file)) return { present: false, path: file, message: 'No signing key: place the editor private key at this path.' };
  try {
    const priv = crypto.createPrivateKey(fs.readFileSync(file));
    const pub = crypto.createPublicKey(priv);
    const embedded = EMBEDDED_PUBLIC_KEY ? crypto.createPublicKey(EMBEDDED_PUBLIC_KEY) : null;
    const matches = embedded ? fingerprint(embedded) === fingerprint(pub) : null;
    return { present: true, path: file, fingerprint: fingerprint(pub), matches, message: matches === false ? 'This key does not match the key of the customer installations: their licences would be refused.' : 'Signing key ready.' };
  } catch (e) {
    return { present: true, path: file, message: `The key cannot be read: ${e.message}` };
  }
}

function privateKey() {
  const k = keyStatus();
  if (!k.present || !k.fingerprint) throw new HttpError(409, 'NO_SIGNING_KEY', k.message);
  if (k.matches === false) throw new HttpError(409, 'KEY_MISMATCH', k.message);
  return crypto.createPrivateKey(fs.readFileSync(config.licenceSigningKey));
}

export function publicKeyPem() {
  if (EMBEDDED_PUBLIC_KEY) return EMBEDDED_PUBLIC_KEY;
  return crypto.createPublicKey(privateKey()).export({ type: 'spki', format: 'pem' });
}

/** Every item a licence can grant: base, industry and capability packs, add-ons, standards. */
export function licensableItems() {
  const c = catalog();
  return {
    base: Object.keys(BASE_PACKS),
    industry: c.packs.filter(p => /Industry/.test(p.type || '')).map(p => p.id),
    capability: Object.keys(CAPABILITY_FEATURES),
    addons: Object.keys(ADDON_FEATURES),
    standards: COMPLIANCE_STANDARDS.map(s => s.id),
    deploymentModes: ['DEP-4', 'DEP-5', 'DEP-6', 'DEP-7'],
  };
}

function validate(b) {
  const items = licensableItems();
  const allItems = new Set([...items.base, ...items.industry, ...items.capability, ...items.addons, ...items.standards]);
  const customer = String(b.customer || '').trim();
  if (!customer) throw new HttpError(400, 'CUSTOMER_REQUIRED', 'Customer name is required.');
  const seats = Number(b.seats);
  if (!Number.isInteger(seats) || seats < 1 || seats > 1000000) throw new HttpError(400, 'BAD_SEATS', 'Seats: a whole number from 1.');
  const expires = String(b.expires || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expires) || expires <= now().slice(0, 10)) throw new HttpError(400, 'BAD_EXPIRY', 'Expiry: a date after today (YYYY-MM-DD).');
  const packs = [...new Set(Array.isArray(b.packs) ? b.packs : [])];
  const unknown = packs.filter(x => !allItems.has(x));
  if (unknown.length) throw new HttpError(400, 'BAD_ITEM', `Unknown items: ${unknown.join(', ')}.`);
  if (!packs.some(x => items.base.includes(x))) throw new HttpError(400, 'BASE_PACK_REQUIRED', 'A licence includes at least one base pack (DMS-SME, DMS-PRO or DMS-ENT).');
  const mode = b.deploymentMode || 'DEP-5';
  if (!items.deploymentModes.includes(mode)) throw new HttpError(400, 'BAD_MODE', 'Deployment mode: DEP-4 to DEP-7 (on-premises modes).');
  return { customer, contact: String(b.contact || '').trim(), seats, expires, packs, deploymentMode: mode, notes: String(b.notes || '').trim() };
}

function sign(l, version, issuedBy) {
  const payload = { id: l.id, code: l.code, version, customer: l.customer, seats: l.seats, expires: l.expires, packs: l.packs, issued: now().slice(0, 10), deploymentMode: l.deploymentMode };
  const signature = crypto.sign(null, Buffer.from(JSON.stringify(payload)), privateKey()).toString('base64');
  return { payload, signature, issuedBy };
}

const out = (r) => r && ({
  id: r.id, code: r.code, customer: r.customer, contact: r.contact, seats: r.seats, expires: r.expires, packs: P(r.packs) || [], deploymentMode: r.deployment_mode,
  notes: r.notes, status: r.status === 'Active' && r.expires < now().slice(0, 10) ? 'Expired' : r.status, version: r.version, issuedAt: r.issued_at,
  issuedBy: r.issued_by ? get('SELECT name FROM users WHERE id=?', r.issued_by)?.name : null, revokedAt: r.revoked_at, revokeReason: r.revoke_reason, downloads: r.downloads, createdAt: r.created_at, updatedAt: r.updated_at,
});

export const listLicences = () => all('SELECT * FROM licences ORDER BY created_at DESC').map(out);
export function getLicence(id) {
  const r = get('SELECT * FROM licences WHERE id=?', id);
  if (!r) throw new HttpError(404, 'NOT_FOUND', 'Licence not found.');
  return { ...out(r), versions: all('SELECT version, issued_at, reason, (SELECT name FROM users WHERE id=issued_by) AS issued_by FROM licence_versions WHERE licence_id=? ORDER BY version DESC', id) };
}

export function createLicence(b, user) {
  const v = validate(b);
  const id = uid();
  const year = now().slice(0, 4);
  const n = get("SELECT COUNT(*) n FROM licences WHERE code LIKE ?", `LIC-${year}-%`).n + 1;
  const code = `LIC-${year}-${String(n).padStart(3, '0')}`;
  const s = sign({ id, code, ...v }, 1, user.id);
  tx(() => {
    run(`INSERT INTO licences(id,code,customer,contact,seats,expires,packs,deployment_mode,notes,status,version,payload,signature,issued_at,issued_by,created_at,updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,'Active',1,?,?,?,?,?,?)`, id, code, v.customer, v.contact, v.seats, v.expires, J(v.packs), v.deploymentMode, v.notes, J(s.payload), s.signature, now(), user.id, now(), now());
    run('INSERT INTO licence_versions(id,licence_id,version,payload,signature,issued_at,issued_by,reason) VALUES(?,?,?,?,?,?,?,?)', uid(), id, 1, J(s.payload), s.signature, now(), user.id, 'Issued');
  });
  return getLicence(id);
}

/** Changing a licence issues a new signed version; the customer installs the new file. */
export function updateLicence(id, b, user) {
  const r = get('SELECT * FROM licences WHERE id=?', id);
  if (!r) throw new HttpError(404, 'NOT_FOUND', 'Licence not found.');
  if (r.status === 'Revoked') throw new HttpError(409, 'REVOKED', 'A revoked licence cannot be changed; issue a new licence.');
  const v = validate({ customer: r.customer, contact: r.contact, seats: r.seats, expires: r.expires, packs: P(r.packs), deploymentMode: r.deployment_mode, notes: r.notes, ...b });
  const version = r.version + 1;
  const s = sign({ id, code: r.code, ...v }, version, user.id);
  tx(() => {
    run('UPDATE licences SET customer=?, contact=?, seats=?, expires=?, packs=?, deployment_mode=?, notes=?, version=?, payload=?, signature=?, issued_at=?, issued_by=?, updated_at=? WHERE id=?',
      v.customer, v.contact, v.seats, v.expires, J(v.packs), v.deploymentMode, v.notes, version, J(s.payload), s.signature, now(), user.id, now(), id);
    run('INSERT INTO licence_versions(id,licence_id,version,payload,signature,issued_at,issued_by,reason) VALUES(?,?,?,?,?,?,?,?)', uid(), id, version, J(s.payload), s.signature, now(), user.id, String(b.reason || 'Changed'));
  });
  return getLicence(id);
}

export function revokeLicence(id, reason) {
  const r = get('SELECT * FROM licences WHERE id=?', id);
  if (!r) throw new HttpError(404, 'NOT_FOUND', 'Licence not found.');
  if (!String(reason || '').trim()) throw new HttpError(400, 'REASON_REQUIRED', 'Give the reason of the revocation.');
  run("UPDATE licences SET status='Revoked', revoked_at=?, revoke_reason=?, updated_at=? WHERE id=?", now(), String(reason).trim(), now(), id);
  return getLicence(id);
}

export function deleteLicence(id) {
  const r = get('SELECT * FROM licences WHERE id=?', id);
  if (!r) throw new HttpError(404, 'NOT_FOUND', 'Licence not found.');
  if (r.status === 'Active' && r.downloads > 0 && r.expires >= now().slice(0, 10)) throw new HttpError(409, 'IN_USE', 'This licence was delivered and is still valid: revoke it before deleting it.');
  run('DELETE FROM licences WHERE id=?', id);
  return { ok: true };
}

export function licenceFile(id) {
  const r = get('SELECT * FROM licences WHERE id=?', id);
  if (!r) throw new HttpError(404, 'NOT_FOUND', 'Licence not found.');
  if (r.status === 'Revoked') throw new HttpError(409, 'REVOKED', 'A revoked licence cannot be downloaded.');
  run('UPDATE licences SET downloads=downloads+1 WHERE id=?', id);
  return { name: `Licence_${r.code}_v${r.version}_${r.customer.replace(/[^A-Za-z0-9]+/g, '_')}.lic`, text: JSON.stringify({ payload: P(r.payload), signature: r.signature }, null, 2) };
}
