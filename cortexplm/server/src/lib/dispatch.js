// Multi-Channel Communication (FR-DA-COMM-01..05): one dispatch interface, pluggable channel adapters.
// A message is composed once per recipient, in the recipient's language, then routed to every channel
// the recipient enabled for that category. A channel failure is retried on its own schedule and never
// blocks another channel.
import nodemailer from 'nodemailer';
import { q } from '../db.js';
import { config } from '../config.js';
import { translate, resolveLanguage } from './i18n.js';
import { decrypt, hmac } from './security.js';

export const CHANNELS = ['inapp', 'email', 'webhook', 'sms', 'push'];
export const CATEGORIES = ['task', 'gate', 'alert', 'system'];
const MAX_ATTEMPTS = 5;

let transport;
const adapters = {
  inapp: async () => 'delivered',
  email: async ({ user, subject, body }) => {
    if (!config.smtp.host) throw new Error('No e-mail provider configured (set SMTP_HOST in the server .env file).');
    transport ||= nodemailer.createTransport({ host: config.smtp.host, port: config.smtp.port, auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined });
    await transport.sendMail({ from: config.smtp.from || config.smtp.user, to: user.email, subject, text: body });
    return 'sent';
  },
  webhook: async ({ user, orgId, subject, body, category, dispatchId }) => {
    const hooks = q.all('SELECT url, secret_enc FROM webhook_endpoints WHERE org_id = ? AND active = 1 AND (user_id IS NULL OR user_id = ?)', orgId, user.id);
    if (!hooks.length) throw new Error('No webhook endpoint configured for this recipient.');
    for (const h of hooks) {
      // Minimum content only (FR-DA-COMM-05): no record data beyond the notification itself.
      const payload = JSON.stringify({ id: dispatchId, category, subject, body, recipient: user.id, sentAt: new Date().toISOString() });
      const res = await fetch(h.url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-cortexplm-signature': hmac(decrypt(h.secret_enc) || '', payload) }, body: payload, signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}.`);
    }
    return 'delivered';
  },
  sms: async () => { throw new Error('No SMS provider configured.'); },
  push: async () => { throw new Error('No push provider configured.'); },
};

export function channelEnabled(userId, category, channel) {
  const r = q.get('SELECT enabled FROM notification_prefs WHERE user_id = ? AND category = ? AND channel = ?', userId, category, channel);
  if (r) return !!r.enabled;
  return channel === 'inapp'; // every category defaults to in-app (FR-DA-COMM-02)
}

export function notifyUsers(orgId, userIds, category, key, params = {}, { entityType = null, entityId = null, now } = {}) {
  const ts = now || new Date().toISOString();
  const ids = [...new Set(userIds.filter(Boolean))];
  for (const uid of ids) {
    const user = q.get('SELECT id, email, language, org_id FROM users WHERE id = ? AND active = 1', uid);
    if (!user || (user.org_id && user.org_id !== orgId)) continue; // tenant-scoped dispatch
    const lang = resolveLanguage(user.language, orgId);
    const subject = translate(lang, `notify.${key}.subject`, params);
    const body = translate(lang, `notify.${key}.body`, params);
    const dispatchId = q.insert('dispatches', { org_id: orgId, user_id: uid, category, subject, body, lang, entity_type: entityType, entity_id: entityId, created_at: ts });
    for (const ch of CHANNELS) {
      if (!channelEnabled(uid, category, ch)) continue;
      q.insert('deliveries', { dispatch_id: dispatchId, channel: ch, status: ch === 'inapp' ? 'delivered' : 'queued', attempts: ch === 'inapp' ? 1 : 0, next_attempt_at: ts, updated_at: ts });
    }
  }
}

export function notifyRoles(orgId, roleNames, category, key, params, opts) {
  const ids = q.all(`SELECT DISTINCT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE u.org_id = ? AND u.active = 1 AND r.name IN (${roleNames.map(() => '?').join(',')})`, orgId, ...roleNames).map((r) => r.id);
  notifyUsers(orgId, ids, category, key, params, opts);
}

let running = false;
export async function processQueue(now = new Date()) {
  if (running) return; running = true;
  try {
    const due = q.all(`SELECT d.id, d.channel, d.attempts, s.id dispatch_id, s.org_id, s.subject, s.body, s.category, s.user_id FROM deliveries d JOIN dispatches s ON s.id = d.dispatch_id
      WHERE d.status IN ('queued','failed') AND d.attempts < ? AND (d.next_attempt_at IS NULL OR d.next_attempt_at <= ?) LIMIT 100`, MAX_ATTEMPTS, now.toISOString());
    for (const d of due) {
      const user = q.get('SELECT id, email FROM users WHERE id = ?', d.user_id);
      try {
        const status = await adapters[d.channel]({ user, orgId: d.org_id, subject: d.subject, body: d.body, category: d.category, dispatchId: d.dispatch_id });
        q.run('UPDATE deliveries SET status = ?, attempts = attempts + 1, last_error = NULL, updated_at = ? WHERE id = ?', status, new Date().toISOString(), d.id);
      } catch (e) {
        const attempts = d.attempts + 1;
        const next = new Date(Date.now() + 60000 * 2 ** attempts).toISOString();
        q.run('UPDATE deliveries SET status = ?, attempts = ?, last_error = ?, next_attempt_at = ?, updated_at = ? WHERE id = ?', 'failed', attempts, String(e.message).slice(0, 300), next, new Date().toISOString(), d.id);
      }
    }
  } finally { running = false; }
}
