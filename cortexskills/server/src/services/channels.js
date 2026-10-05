// External message channels for questionnaires (FR-DA-COMM-06..08): Email (SMTP) and WhatsApp (WhatsApp Business
// Cloud API), behind one send() interface so another channel can be added without touching questionnaire logic.
// Each Organization configures its own provider; without one, the platform defaults from the environment apply;
// without either, the channel runs in sandbox mode: the message is composed and kept in the outbox, not sent.
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { all, one, run } from '../db.js';
import { uuid, now, J, S, HttpError } from '../lib/util.js';
import { config } from '../config.js';
import { seal, open, mask } from './secrets.js';

export const EXTERNAL_CHANNELS = ['email', 'whatsapp'];
const FIELDS = {
  email: { config: ['host', 'port', 'secure', 'user', 'from', 'replyTo'], secret: 'pass' },
  whatsapp: { config: ['phoneNumberId', 'businessAccountId', 'template', 'templateLang', 'verifyToken', 'defaultCountryCode', 'apiBase'], secret: 'token', secret2: 'appSecret' },
};

function row(orgId, channel) { return one(`SELECT * FROM channel_settings WHERE org_id=? AND channel=?`, orgId, channel); }

/** Settings as shown to an administrator: no secret value, only whether it is set (FR-DA-COMM-05, NFR-DA-SEC). */
export function getSettings(orgId) {
  return EXTERNAL_CHANNELS.map(ch => {
    const r = row(orgId, ch); const cfg = J(r?.config, {}); const sec = J(open(r?.secret), {}) || {};
    const platform = platformReady(ch);
    return { channel: ch, enabled: !!r?.enabled, mode: r?.mode || 'sandbox', config: cfg, secretSet: !!sec.value, secretHint: mask(sec.value), secret2Set: !!sec.value2,
      platformDefault: platform, effective: effectiveMode(orgId, ch), updatedAt: r?.updated_at || null,
      webhookUrl: ch === 'whatsapp' ? '/api/public/whatsapp/webhook' : null };
  });
}
function platformReady(ch) {
  if (ch === 'email') return !!(config.smtp.host && config.smtp.from);
  if (ch === 'whatsapp') return !!(config.whatsapp.token && config.whatsapp.phoneNumberId);
  return false;
}
/** 'live' when a provider is configured and enabled, 'platform' when the platform default applies, otherwise 'sandbox'. */
export function effectiveMode(orgId, ch) {
  const r = row(orgId, ch);
  if (r?.enabled && r.mode === 'live') return 'live';
  if (r?.enabled && r.mode === 'sandbox') return 'sandbox';
  return platformReady(ch) ? 'platform' : 'sandbox';
}

export function saveSettings(orgId, userId, channel, body = {}) {
  if (!EXTERNAL_CHANNELS.includes(channel)) throw new HttpError(404, 'err.notFound');
  const f = FIELDS[channel]; const cur = row(orgId, channel);
  const cfg = { ...J(cur?.config, {}) };
  for (const k of f.config) if (body.config?.[k] !== undefined) cfg[k] = typeof body.config[k] === 'string' ? body.config[k].trim() : body.config[k];
  if (channel === 'email' && cfg.port) cfg.port = Number(cfg.port);
  const sec = J(open(cur?.secret), {}) || {};
  if (body.secret !== undefined && body.secret !== '') sec.value = String(body.secret);
  if (body.secret2 !== undefined && body.secret2 !== '') sec.value2 = String(body.secret2);
  if (body.clearSecret) { delete sec.value; delete sec.value2; }
  const mode = ['live', 'sandbox'].includes(body.mode) ? body.mode : (cur?.mode || 'sandbox');
  const enabled = body.enabled === undefined ? !!cur?.enabled : !!body.enabled;
  if (enabled && mode === 'live') {
    const missing = channel === 'email' ? ['host', 'from'].filter(k => !cfg[k]) : ['phoneNumberId'].filter(k => !cfg[k]);
    if (channel === 'whatsapp' && !sec.value) missing.push('token');
    if (missing.length) throw new HttpError(422, 'err.channelIncomplete', { fields: missing.join(', ') });
  }
  run(`INSERT INTO channel_settings(org_id,channel,enabled,mode,config,secret,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(org_id,channel) DO UPDATE SET enabled=excluded.enabled, mode=excluded.mode, config=excluded.config, secret=excluded.secret, updated_by=excluded.updated_by, updated_at=excluded.updated_at`,
    orgId, channel, enabled ? 1 : 0, mode, S(cfg), Object.keys(sec).length ? seal(S(sec)) : null, userId, now());
  transports.delete(orgId);
  return getSettings(orgId).find(x => x.channel === channel);
}

/** Resolved provider configuration for sending (secrets decrypted in memory only). */
function provider(orgId, ch) {
  const mode = effectiveMode(orgId, ch);
  if (mode === 'sandbox') return { mode };
  if (mode === 'platform') return ch === 'email' ? { mode, ...config.smtp } : { mode, ...config.whatsapp };
  const r = row(orgId, ch); const cfg = J(r.config, {}); const sec = J(open(r.secret), {}) || {};
  return ch === 'email' ? { mode, ...cfg, pass: sec.value } : { mode, apiBase: cfg.apiBase || config.whatsapp.apiBase, ...cfg, token: sec.value, appSecret: sec.value2 };
}

// ------------------------------------------------------------------ addresses
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''));
/** WhatsApp numbers in international format without "+": a leading 0 is replaced by the country code (212 by default). */
export function normalizePhone(p, cc = '212') {
  let d = String(p || '').replace(/[^\d+]/g, '');
  if (!d) return null;
  if (d.startsWith('+')) d = d.slice(1); else if (d.startsWith('00')) d = d.slice(2); else if (d.startsWith('0')) d = cc + d.slice(1);
  return /^\d{8,15}$/.test(d) ? d : null;
}

// ------------------------------------------------------------------ send
const transports = new Map();
function mailer(orgId, p) {
  const key = orgId + '|' + crypto.createHash('sha1').update(S(p)).digest('hex');
  let t = transports.get(orgId);
  if (!t || t.key !== key) {
    t = { key, tx: nodemailer.createTransport({ host: p.host, port: Number(p.port) || 587, secure: p.secure === true || p.secure === 'true' || Number(p.port) === 465,
      auth: p.user ? { user: p.user, pass: p.pass || '' } : undefined, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 }) };
    transports.set(orgId, t);
  }
  return t.tx;
}

async function sendEmail(orgId, msg) {
  const p = provider(orgId, 'email');
  if (p.mode === 'sandbox') return { status: 'simulated', provider: 'sandbox' };
  const info = await mailer(orgId, p).sendMail({ from: p.from, replyTo: p.replyTo || undefined, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html,
    headers: { 'X-CortexSkills-Message': msg.id } });
  return { status: 'sent', provider: p.mode === 'platform' ? 'smtp:platform' : 'smtp', providerId: info.messageId };
}

async function sendWhatsApp(orgId, msg) {
  const p = provider(orgId, 'whatsapp');
  if (p.mode === 'sandbox') return { status: 'simulated', provider: 'sandbox' };
  const url = `${p.apiBase || config.whatsapp.apiBase}/${encodeURIComponent(p.phoneNumberId)}/messages`;
  // Business-initiated messages need an approved template; free text is only accepted inside the 24 h service window.
  const body = p.template
    ? { messaging_product: 'whatsapp', to: msg.to, type: 'template', template: { name: p.template, language: { code: p.templateLang || waLang(msg.lang) }, components: [{ type: 'body', parameters: (msg.params || []).map(text => ({ type: 'text', text: String(text).slice(0, 900) })) }] } }
    : { messaging_product: 'whatsapp', to: msg.to, type: 'text', text: { preview_url: true, body: msg.text.slice(0, 4000) } };
  const res = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${p.token}`, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(out?.error?.message || `WhatsApp ${res.status}`), { code: out?.error?.code, status: res.status });
  return { status: 'sent', provider: p.mode === 'platform' ? 'whatsapp:platform' : 'whatsapp', providerId: out?.messages?.[0]?.id || null };
}
const waLang = l => ({ fr: 'fr', ar: 'ar', en: 'en' }[l] || 'en');
const SENDERS = { email: sendEmail, whatsapp: sendWhatsApp };

/**
 * Queue and deliver one message. The message row is the delivery-status record (queued → sent / simulated → delivered /
 * read, or failed with its error); failures are retried on this channel only (FR-DA-COMM-04).
 */
export async function send({ orgId, projectId = null, questionnaireId = null, invitationId = null, kind = 'message', channel, to, subject = '', text, html, lang = 'en', params, userId = null }) {
  if (!SENDERS[channel]) throw new HttpError(422, 'err.invalidOption', { field: 'channel', value: channel });
  const id = uuid(); const t = now();
  run(`INSERT INTO messages(id,org_id,project_id,questionnaire_id,invitation_id,kind,channel,recipient,subject,body,lang,status,attempts,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,'queued',0,?,?,?)`,
    id, orgId, projectId, questionnaireId, invitationId, kind, channel, to, subject, text, lang, userId, t, t);
  pending.set(id, { html, params });
  await attempt(id);
  return one(`SELECT * FROM messages WHERE id=?`, id);
}
const pending = new Map(); // html / template parameters kept in memory for retries of this process

async function attempt(id) {
  const m = one(`SELECT * FROM messages WHERE id=?`, id); if (!m) return;
  const extra = pending.get(id) || {};
  try {
    const r = await SENDERS[m.channel](m.org_id, { id, to: m.recipient, subject: m.subject, text: m.body, html: extra.html, lang: m.lang, params: extra.params });
    run(`UPDATE messages SET status=?, provider=?, provider_id=?, attempts=attempts+1, error=NULL, next_retry=NULL, updated_at=? WHERE id=?`, r.status, r.provider, r.providerId || null, now(), id);
    pending.delete(id);
  } catch (e) {
    const n = (m.attempts || 0) + 1;
    run(`UPDATE messages SET status='failed', attempts=?, error=?, next_retry=?, updated_at=? WHERE id=?`, n, String(e.message || e).slice(0, 300), n < 4 ? new Date(Date.now() + n * n * 60000).toISOString() : null, now(), id);
  }
}
/** Retry failed external messages on each channel's own schedule (1, 4 and 9 minutes). */
export async function retryMessages() {
  for (const m of all(`SELECT id FROM messages WHERE status='failed' AND next_retry IS NOT NULL AND next_retry < ? LIMIT 50`, now())) await attempt(m.id);
}

/** Connection test from the settings screen, reported in plain language (FR-DA-AI-20 applied to channels). */
export async function testChannel(orgId, userId, channel, to) {
  if (channel === 'email' && !validEmail(to)) throw new HttpError(422, 'err.invalidEmail');
  const dest = channel === 'whatsapp' ? normalizePhone(to, J(row(orgId, 'whatsapp')?.config, {}).defaultCountryCode || '212') : to;
  if (!dest) throw new HttpError(422, 'err.invalidPhone');
  const m = await send({ orgId, kind: 'test', channel, to: dest, subject: 'CortexSkills — test message', text: 'This is a test message from CortexSkills. Your channel settings work.', html: '<p>This is a test message from <b>CortexSkills</b>. Your channel settings work.</p>', params: ['CortexSkills', 'test', '—', '—'], userId });
  return { status: m.status, error: m.error, mode: effectiveMode(orgId, channel), messageId: m.id };
}

// ------------------------------------------------------------------ WhatsApp webhook (delivery statuses and replies)
export function verifyWebhook(query) {
  const tokens = new Set([config.whatsapp.verifyToken, ...all(`SELECT config FROM channel_settings WHERE channel='whatsapp'`).map(r => J(r.config, {}).verifyToken)].filter(Boolean));
  return query['hub.mode'] === 'subscribe' && tokens.has(query['hub.verify_token']) ? String(query['hub.challenge'] || '') : null;
}
/** The request must be signed with the app secret of the Organization that owns the phone number (X-Hub-Signature-256). */
export function signatureOk(orgId, rawBody, header) {
  const r = row(orgId, 'whatsapp'); const sec = J(open(r?.secret), {}) || {};
  const secret = sec.value2 || config.whatsapp.appSecret;
  if (!secret) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody || '').digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(String(header || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function orgForPhoneNumberId(phoneNumberId) {
  if (!phoneNumberId) return null;
  const hit = all(`SELECT org_id, config FROM channel_settings WHERE channel='whatsapp'`).find(r => J(r.config, {}).phoneNumberId === String(phoneNumberId));
  if (hit) return hit.org_id;
  return config.whatsapp.phoneNumberId && config.whatsapp.phoneNumberId === String(phoneNumberId) ? '*platform*' : null;
}
export const STATUS_RANK = { queued: 0, simulated: 1, sent: 1, delivered: 2, read: 3, failed: 4 };
export function applyStatus(providerId, status, error) {
  const m = one(`SELECT * FROM messages WHERE provider_id=?`, providerId); if (!m) return null;
  if (status !== 'failed' && (STATUS_RANK[status] ?? 0) <= (STATUS_RANK[m.status] ?? 0)) return m;
  run(`UPDATE messages SET status=?, error=?, updated_at=? WHERE id=?`, status, error || null, now(), m.id);
  return { ...m, status };
}

export function listMessages(orgId, { questionnaireId, channel, limit = 200 } = {}) {
  const w = ['org_id=?']; const p = [orgId];
  if (questionnaireId) { w.push('questionnaire_id=?'); p.push(questionnaireId); }
  if (channel) { w.push('channel=?'); p.push(channel); }
  return all(`SELECT id, questionnaire_id, invitation_id, kind, channel, recipient, subject, body, lang, status, provider, error, attempts, created_at, updated_at FROM messages WHERE ${w.join(' AND ')} ORDER BY created_at DESC LIMIT ?`, ...p, Number(limit));
}
