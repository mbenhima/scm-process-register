import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { get, all, run, now, J, P } from '../db.js';
import { sign, authenticate } from '../auth.js';
import { h, HttpError, send, langOf, row } from '../http.js';
import { orgConfig } from '../packs.js';
import { ROLES } from '../permissions.js';

const r = Router();
const limiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Wait one minute.' } } });

r.post('/login', limiter, h((req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const u = get('SELECT * FROM users WHERE lower(email)=?', email);
  if (!u || u.status !== 'Active' || !bcrypt.compareSync(password, u.password_hash)) throw new HttpError(401, 'BAD_CREDENTIALS', 'Email or password is incorrect.');
  run('UPDATE users SET last_login=? WHERE id=?', now(), u.id);
  res.json({ token: sign(u) });
}));

export const DEFAULT_PREFS = { dock: 'start', pinned: true, collapsed: [], favorites: ['home', 'lifecycle', 'alerts'], density: 'comfortable', projectId: null };

r.get('/me', authenticate, h((req, res) => {
  const u = req.user;
  const org = u.org_id ? row(get('SELECT * FROM organizations WHERE id=?', u.org_id)) : null;
  const group = org?.group_id ? row(get('SELECT * FROM groups_ WHERE id=?', org.group_id)) : null;
  const prefs = { ...DEFAULT_PREFS, ...(P(get('SELECT data FROM user_prefs WHERE user_id=?', u.id)?.data) || {}) };
  const cfg = org ? orgConfig(org) : null;
  send(req, res, {
    user: { id: u.id, name: u.name, email: u.email, roles: u.roles, roleNames: u.roles.map(c => ROLES.find(x => x.code === c)?.name), lang: langOf(req), isPlatformAdmin: u.is_platform_admin },
    org: org && { id: org.id, name: org.name, code: org.short_code, sector: org.sector, size: org.size, lang: org.default_lang, groupId: org.group_id },
    group: group && { id: group.id, name: group.name },
    permissions: [...u.perms].sort(),
    features: cfg ? cfg.features : ['core', 'governance', 'bpmn_edit', 'ai_assistive', 'ai_augmented', 'assistant', 'benchmark', 'benchmark_group', 'wbs', 'integrations', 'verticals', 'multi_site', 'certification', 'esg'],
    aiTier: cfg?.aiTier || 'Assistive+Augmented',
    prefs,
  });
}));

r.put('/prefs', authenticate, h((req, res) => {
  const cur = P(get('SELECT data FROM user_prefs WHERE user_id=?', req.user.id)?.data) || {};
  const allowed = ['dock', 'pinned', 'collapsed', 'favorites', 'density', 'projectId'];
  const next = { ...DEFAULT_PREFS, ...cur };
  for (const k of allowed) if (k in (req.body || {})) next[k] = req.body[k];
  if (!['start', 'end', 'top', 'bottom'].includes(next.dock)) next.dock = 'start';
  run('INSERT INTO user_prefs(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data', req.user.id, J(next));
  if (req.body?.lang && ['en', 'fr', 'ar'].includes(req.body.lang)) run('UPDATE users SET lang=? WHERE id=?', req.body.lang, req.user.id);
  res.json(next);
}));

r.put('/password', authenticate, h((req, res) => {
  const u = get('SELECT * FROM users WHERE id=?', req.user.id);
  if (!bcrypt.compareSync(String(req.body?.current || ''), u.password_hash)) throw new HttpError(400, 'BAD_CREDENTIALS', 'Current password is incorrect.');
  const pw = String(req.body?.next || '');
  if (pw.length < 8 || !/[A-Z]/.test(pw) || !/\d/.test(pw)) throw new HttpError(400, 'WEAK_PASSWORD', 'Use at least 8 characters with a capital letter and a digit.');
  run('UPDATE users SET password_hash=? WHERE id=?', bcrypt.hashSync(pw, 10), u.id);
  res.json({ ok: true });
}));

export default r;

