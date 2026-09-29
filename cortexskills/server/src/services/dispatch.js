// Multi-channel Communication Dispatch (Section 3.9, FR-DA-COMM-01..05). A message is composed once in the
// recipient's language and routed to every channel the recipient enabled for its category. Each channel is
// independent: a failure is recorded and retried on that channel only.
import fs from 'node:fs';
import path from 'node:path';
import { all, one, run } from '../db.js';
import { uuid, now, J, addDays } from '../lib/util.js';
import { t, resolveLang } from '../i18n.js';
import { config } from '../config.js';

export const CHANNELS = ['inapp', 'email', 'webhook', 'sms', 'push'];
export const CATEGORIES = ['alerts', 'tasks', 'approvals', 'questionnaires', 'system'];

const channelHandlers = {
  inapp: () => 'delivered',
  // Without an SMTP/SMS/push provider configured, messages are written to the local outbox (data/outbox).
  email: (msg, user) => outbox('email', user.email, msg),
  sms: (msg, user) => outbox('sms', user.phone || user.email, msg),
  push: (msg, user) => outbox('push', user.id, msg),
  webhook: async (msg, user, orgId) => {
    const hooks = all(`SELECT data FROM records WHERE entity='Webhook' AND org_id=?`, orgId).map(r => J(r.data)).filter(h => h.enabled && h.url);
    if (!hooks.length) return 'skipped';
    for (const h of hooks) {
      // Minimum content only (FR-DA-COMM-05): category and subject, no record payload.
      const res = await fetch(h.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ category: msg.category, subject: msg.subject, at: now() }), signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('webhook ' + res.status);
    }
    return 'delivered';
  },
};
function outbox(channel, to, msg) {
  const dir = path.join(config.dataDir, 'outbox'); fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, channel + '.log'), `${now()}\t${to}\t${msg.subject}\n`);
  return 'sent';
}

export function userChannels(userId, category) {
  const p = one(`SELECT data FROM user_prefs WHERE user_id=?`, userId);
  const ch = J(p?.data, {})?.channels?.[category];
  return Array.isArray(ch) && ch.length ? [...new Set(['inapp', ...ch])] : ['inapp'];
}

export function dispatch({ orgId, userId, category, subjectKey, params = {} }) {
  const user = one(`SELECT * FROM users WHERE id=?`, userId); if (!user) return null;
  const org = one(`SELECT default_language FROM organizations WHERE id=?`, orgId);
  const lang = resolveLang(user, org);
  const subject = t(subjectKey, lang, params);
  const id = uuid();
  run(`INSERT INTO dispatches(id,org_id,user_id,category,subject,body,lang,created_at) VALUES(?,?,?,?,?,?,?,?)`, id, orgId, userId, category, subject, subject, lang, now());
  for (const ch of userChannels(userId, category)) {
    const did = uuid();
    run(`INSERT INTO delivery_status(id,dispatch_id,channel,status,attempts,updated_at) VALUES(?,?,?,?,0,?)`, did, id, ch, 'queued', now());
    deliver(did, ch, { category, subject }, user, orgId);
  }
  return id;
}

async function deliver(did, ch, msg, user, orgId) {
  const row = one(`SELECT attempts FROM delivery_status WHERE id=?`, did);
  try {
    const status = await channelHandlers[ch](msg, user, orgId);
    run(`UPDATE delivery_status SET status=?, attempts=?, updated_at=? WHERE id=?`, status, (row?.attempts || 0) + 1, now(), did);
  } catch {
    const attempts = (row?.attempts || 0) + 1;
    run(`UPDATE delivery_status SET status='failed', attempts=?, next_retry=?, updated_at=? WHERE id=?`, attempts, attempts < 5 ? new Date(Date.now() + attempts * 60000).toISOString() : null, now(), did);
  }
}
/** Retry failed deliveries on their own channel schedule. */
export function retryFailed() {
  for (const d of all(`SELECT ds.id, ds.channel, di.category, di.subject, di.user_id, di.org_id FROM delivery_status ds JOIN dispatches di ON di.id=ds.dispatch_id WHERE ds.status='failed' AND ds.next_retry IS NOT NULL AND ds.next_retry < ?`, now())) {
    const user = one(`SELECT * FROM users WHERE id=?`, d.user_id); if (user) deliver(d.id, d.channel, { category: d.category, subject: d.subject }, user, d.org_id);
  }
}
