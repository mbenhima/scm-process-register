import { Router } from 'express';
import { ah } from '../lib/http.js';
import { login } from '../auth.js';
import { isSeeded, one, all, run } from '../db.js';
import { config } from '../config.js';
import { getDictionary, getLanguages } from '../i18n.js';
import { HttpError, J, S, now, pick } from '../lib/util.js';
import * as Q from '../services/questionnaires.js';
import * as CH from '../services/channels.js';

const r = Router();
r.post('/auth/login', ah(req => login(req)));
// Liveness only: no tenant data (FR-DA-OPS-06).
r.get('/health', (req, res) => res.json({ status: 'ok', initialized: isSeeded(), mode: config.deploymentMode, version: one(`SELECT value FROM meta WHERE key='version'`)?.value || '1.0.0' }));
r.get('/i18n', (req, res) => res.json({ languages: getLanguages(), dictionary: getDictionary() }));

// ------------------------------------------------------------------ respondent link (Application channel)
// The link carries an opaque token; the page shows only this respondent's form and draft, never other data.
const hits = new Map();
function limit(req) { const k = req.ip || 'x'; const t = Date.now(); const w = (hits.get(k) || []).filter(x => t - x < 60000); w.push(t); hits.set(k, w); if (w.length > 120) throw new HttpError(429, 'err.rateLimited'); }
function byToken(token) {
  const inv = one(`SELECT * FROM q_invitations WHERE token_hash=?`, Q.hashToken(token));
  if (!inv) throw new HttpError(404, 'err.linkInvalid');
  const q = Q.getQuestionnaire(inv.org_id, inv.questionnaire_id);
  return { inv, q };
}
r.get('/public/q/:token', ah(req => {
  limit(req); const { inv, q } = byToken(req.params.token);
  const org = one(`SELECT name, default_language FROM organizations WHERE id=?`, inv.org_id);
  const open = q.status === 'Distributed' && !['Declined', 'Expired'].includes(inv.status) && !(q.due_date && Date.now() > new Date(q.due_date).getTime() + 7 * 86400000);
  if (!inv.opened_at) { run(`UPDATE q_invitations SET opened_at=?, status=CASE WHEN status IN ('Planned','Invited') THEN 'Opened' ELSE status END WHERE id=?`, now(), inv.id); Q.event(inv.org_id, q.id, inv.id, 'opened', { channel: 'Application', recipient: inv.name, status: 'opened' }); }
  const draft = J(inv.draft, null);
  return { organization: J(org.name, org.name), language: inv.lang || org.default_language || 'en', respondent: { name: inv.name, population: inv.population },
    questionnaire: { label: q.label, due_date: q.due_date, status: q.status, open, threshold: q.threshold }, form: Q.formOf(q, inv.template_code),
    status: inv.status, responded: inv.status === 'Responded', answers: draft?.answers || {}, flags: draft?.flags || {}, consent: J(inv.consent, null) };
}));
r.post('/public/q/:token', ah(req => {
  limit(req); const { inv, q } = byToken(req.params.token); const b = req.body || {};
  if (q.status !== 'Distributed' || ['Declined', 'Expired'].includes(inv.status)) throw new HttpError(409, 'err.questionnaireClosed');
  if (b.decline) {
    run(`UPDATE q_invitations SET status='Declined', opted_out=1, draft=NULL, updated_at=? WHERE id=?`, now(), inv.id);
    Q.event(inv.org_id, q.id, inv.id, 'declined', { channel: 'Application', recipient: inv.name, status: 'declined' }); return { declined: true };
  }
  const size = JSON.stringify(b.answers || {}).length; if (size > 200000) throw new HttpError(413, 'err.tooLarge');
  return Q.storeResponse(inv.org_id, q, inv, { answers: b.answers || {}, flags: b.flags || {}, consent: b.consent === true, final: !!b.final, channel: 'Application', source: 'respondent' });
}));

// ------------------------------------------------------------------ WhatsApp Cloud API webhook
r.get('/public/whatsapp/webhook', (req, res) => { const c = CH.verifyWebhook(req.query); return c == null ? res.status(403).send('forbidden') : res.type('text/plain').send(c); });
r.post('/public/whatsapp/webhook', ah((req, res) => {
  const b = req.body || {}; let handled = 0;
  for (const entry of b.entry || []) for (const ch of entry.changes || []) {
    const v = ch.value || {}; const org = CH.orgForPhoneNumberId(v.metadata?.phone_number_id);
    if (!org) continue;
    const orgId = org === '*platform*' ? null : org;
    // Signed by the app secret of the owner of the number; unsigned or badly signed calls are ignored.
    if (!CH.signatureOk(orgId, req.rawBody, req.get('x-hub-signature-256'))) continue;
    for (const s of v.statuses || []) {
      const m = CH.applyStatus(s.id, s.status, s.errors?.[0]?.title); if (!m) continue; handled++;
      if (m.questionnaire_id) Q.event(m.org_id, m.questionnaire_id, m.invitation_id, 'status', { channel: 'WhatsApp', recipient: m.recipient, status: s.status, detail: s.errors?.[0]?.title || null });
    }
    for (const msg of v.messages || []) {
      const from = String(msg.from || ''); const text = msg.text?.body || msg.button?.text || '';
      const inv = all(`SELECT * FROM q_invitations WHERE phone=? ${orgId ? 'AND org_id=?' : ''} ORDER BY updated_at DESC LIMIT 1`, ...[from, ...(orgId ? [orgId] : [])])[0];
      if (!inv) continue; handled++;
      const stop = /^\s*(stop|arr[eê]t|توقف)\s*$/i.test(text);
      if (stop) run(`UPDATE q_invitations SET opted_out=1, updated_at=? WHERE id=?`, now(), inv.id);
      Q.event(inv.org_id, inv.questionnaire_id, inv.id, stop ? 'opt-out' : 'inbound', { channel: 'WhatsApp', recipient: inv.name, status: stop ? 'opted-out' : 'received', detail: text.slice(0, 500) });
    }
  }
  res.json({ ok: true, handled });
}));
export default r;
