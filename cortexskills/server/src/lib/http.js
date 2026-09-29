import { HttpError, J, pick } from './util.js';
import { t } from '../i18n.js';
import { one } from '../db.js';

/** Wrap an async route handler so thrown errors reach the error middleware. */
export const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).then(v => { if (v !== undefined && !res.headersSent) res.json(v); }).catch(next);

/** Every error leaves the server translated into the user's language, with its machine code (FR-DA-I18N-07). */
export function errorHandler(err, req, res, next) {
  const lang = req.lang || String(req.headers['accept-language'] || 'en').slice(0, 2);
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.code, message: t(err.code, lang, err.params), params: err.params });
  if (err?.message?.includes('UNIQUE constraint failed: racsi_assignments')) return res.status(409).json({ error: 'err.oneAccountable', message: t('err.oneAccountable', lang) });
  if (err?.message?.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'err.duplicate', message: t('err.duplicate', lang) });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'err.badJson', message: t('err.badJson', lang) });
  console.error('[error]', err);
  res.status(500).json({ error: 'err.server', message: t('err.server', lang) });
}

/** Standard security headers (NFR-DA-SEC-12). */
export function securityHeaders(req, res, next) {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Cross-Origin-Resource-Policy': 'same-site', 'Referrer-Policy': 'no-referrer', 'X-XSS-Protection': '0' });
  next();
}

/** Loads a project and verifies it belongs to the organization in context (404 otherwise). */
export function projectOf(req, id) {
  const p = one(`SELECT * FROM projects WHERE id=? AND org_id=?`, id, req.orgId);
  if (!p) throw new HttpError(404, 'err.notFound');
  return p;
}
export const parseMl = row => row && Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'string' && v.startsWith('{"en"') ? J(v) : v]));
export { pick };
