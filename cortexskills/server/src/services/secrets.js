// Symmetric protection of stored secrets (channel credentials, response-link tokens): AES-256-GCM with a key
// derived from CHANNEL_SECRET_KEY. Secrets are never returned by the API; only whether one is set.
import crypto from 'node:crypto';
import { config } from '../config.js';

const KEY = crypto.createHash('sha256').update('cortexskills:secrets:' + config.secretKey).digest();

export function seal(plain) {
  if (plain == null || plain === '') return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}
export function open(sealed) {
  if (!sealed) return null;
  try {
    const [v, iv, tag, data] = String(sealed).split('.'); if (v !== 'v1') return null;
    const d = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(iv, 'base64url'));
    d.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([d.update(Buffer.from(data, 'base64url')), d.final()]).toString('utf8');
  } catch { return null; }
}
/** Opaque, unguessable token for a response link, and the hash under which it is looked up. */
export function newToken() { const token = crypto.randomBytes(24).toString('base64url'); return { token, hash: hashToken(token) }; }
export const hashToken = t => crypto.createHash('sha256').update(String(t)).digest('hex');
export const mask = s => (s ? '••••' + String(s).slice(-4) : '');
