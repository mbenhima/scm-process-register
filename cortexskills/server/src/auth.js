import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { one, run } from './db.js';
import { HttpError, now } from './lib/util.js';
import { resolveLang } from './i18n.js';
import { getLicenceProvider } from './licensing/LicenceProvider.js';

export const hashPassword = pw => bcrypt.hashSync(pw, 10);

// Login rate limit per client (NFR-DA-SEC-12): 10 attempts per 5 minutes.
const attempts = new Map();
function rateLimit(key) {
  const t = Date.now(); const w = (attempts.get(key) || []).filter(x => t - x < 300000);
  w.push(t); attempts.set(key, w);
  if (w.length > 10) throw new HttpError(429, 'err.rateLimited');
}

export function login(req) {
  const { email, password } = req.body || {};
  rateLimit((req.ip || '') + '|' + String(email || '').toLowerCase());
  const u = one(`SELECT * FROM users WHERE lower(email)=lower(?) AND active=1`, String(email || ''));
  if (!u || !bcrypt.compareSync(String(password || ''), u.password_hash)) throw new HttpError(401, 'err.badCredentials');
  if (!u.is_platform) {
    const lic = getLicenceProvider(u.org_id).check();
    if (lic.status === 'inactive') throw new HttpError(403, 'err.licenceInactive');
  }
  run(`UPDATE users SET last_login=? WHERE id=?`, now(), u.id);
  const token = jwt.sign({ sub: u.id }, config.jwtSecret, { expiresIn: config.jwtTtl });
  return { token, userId: u.id };
}

/** Bearer token required on every API call except login and health (NFR-DA-SEC-01). */
export function authenticate(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : (req.query.access_token || null);
  if (!token) return next(new HttpError(401, 'err.unauthenticated'));
  let payload;
  try { payload = jwt.verify(token, config.jwtSecret); } catch { return next(new HttpError(401, 'err.sessionExpired')); }
  const u = one(`SELECT id, org_id, email, name, language, title, is_platform FROM users WHERE id=? AND active=1`, payload.sub);
  if (!u) return next(new HttpError(401, 'err.unauthenticated'));
  req.user = { ...u, is_platform: !!u.is_platform };
  const home = u.org_id ? one(`SELECT id, group_id, default_language FROM organizations WHERE id=?`, u.org_id) : null;
  req.lang = resolveLang(u, home);
  // Organization context. Platform administrators may choose any organization; other users work in
  // their own organization and may read (never write) the organizations of their own Group (FR-DA-TEN-15).
  const wanted = req.headers['x-org-id'] || u.org_id;
  req.orgId = u.org_id; req.foreignReadOnly = false;
  if (wanted && wanted !== u.org_id) {
    const target = one(`SELECT id, group_id FROM organizations WHERE id=?`, wanted);
    if (u.is_platform && target) req.orgId = target.id;
    else if (target && home?.group_id && target.group_id === home.group_id) { req.orgId = target.id; req.foreignReadOnly = true; }
    else return next(new HttpError(404, 'err.notFound')); // answer as for a record that does not exist (FR-DA-TEN-11)
  }
  if (!req.orgId && u.is_platform) {
    const first = one(`SELECT id FROM organizations ORDER BY created_at LIMIT 1`); req.orgId = first?.id || null;
  }
  req.projectId = req.headers['x-project-id'] || null;
  const write = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (write && req.foreignReadOnly) {
    const allowed = req.path.startsWith('/me') || req.path.startsWith('/assistant') || req.path.startsWith('/help');
    if (!allowed) return next(new HttpError(403, 'err.foreignReadOnly'));
  }
  if (write && req.orgId && !u.is_platform) {
    const lic = getLicenceProvider(req.orgId).check();
    if (lic.status === 'expired' && !req.path.startsWith('/me')) return next(new HttpError(403, 'err.licenceExpired'));
  }
  next();
}
