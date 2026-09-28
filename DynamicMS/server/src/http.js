// HTTP helpers: typed errors, async handler, language negotiation and tenant scoping.
import { get, P } from './db.js';
import { loc } from './catalog/store.js';

export class HttpError extends Error {
  constructor(status, code, message, details) { super(message || code); this.status = status; this.code = code; this.details = details; }
}
export const bad = (code, msg, details) => new HttpError(400, code, msg, details);
export const forbidden = (code = 'FORBIDDEN', msg = 'You do not have permission for this action.') => new HttpError(403, code, msg);
export const notFound = (what = 'Resource') => new HttpError(404, 'NOT_FOUND', `${what} not found.`);
export const conflict = (code, msg) => new HttpError(409, code, msg);

export const h = (fn) => (req, res, next) => {
  try {
    const r = fn(req, res, next);
    if (r && typeof r.then === 'function') r.catch(next);
  } catch (e) { next(e); }
};

export const LANGS = ['en', 'fr', 'ar'];
export function langOf(req) {
  const q = (req.query.lang || '').toString();
  if (LANGS.includes(q)) return q;
  if (req.user?.lang && LANGS.includes(req.user.lang)) return req.user.lang;
  const a = (req.headers['accept-language'] || '').slice(0, 2);
  return LANGS.includes(a) ? a : 'en';
}

// Sends data localized to the request language unless ?raw=1 (editing needs all languages).
export function send(req, res, data, status = 200) {
  const out = req.query.raw === '1' ? data : loc(data, langOf(req));
  res.status(status).json(out);
}

// Parses JSON TEXT columns of a row.
const JSON_COLS = new Set(['name', 'description', 'title', 'standards', 'industry_packs', 'capability_packs', 'addons', 'compliance_standards', 'roles',
  'fields', 'value', 'task_name', 'comment', 'purpose', 'entry_criteria', 'exit_criteria', 'approvers', 'applicability', 'items', 'levels', 'criteria',
  'condition', 'action', 'step_refs', 'controls', 'treatment', 'kri', 'formula', 'racsi', 'escalation', 'root_cause', 'went_well', 'not_well',
  'recommendation', 'trigger_', 'expected_output', 'checkpoint', 'prompt', 'task_type', 'before_', 'after_', 'justification', 'data', 'config',
  'mapping', 'steps', 'metrics', 'text', 'summary', 'content', 'formats', 'action_ids', 'predecessors', 'verdict', 'phases', 'milestones',
  'complexity', 'city', 'scope', 'notes']);
export function row(r) {
  if (!r) return r;
  const o = {};
  for (const [k, v] of Object.entries(r)) o[k] = JSON_COLS.has(k) && typeof v === 'string' && (v.startsWith('{') || v.startsWith('[') || v.startsWith('"')) ? P(v, v) : v;
  return o;
}
export const rows = (list) => list.map(row);

// ---- Tenant scoping (NFR-DA-SEC: every query is scoped; cross-tenant access returns 404)
export function orgAccess(req, orgId) {
  const u = req.user;
  if (!orgId) return null;
  if (u.is_platform_admin) return 'write';
  if (u.org_id === orgId) return 'write';
  if (u.perms.has('tenancy.group_view') && u.group_id) {
    const o = get('SELECT group_id FROM organizations WHERE id=?', orgId);
    if (o && o.group_id === u.group_id) return 'read';
  }
  return null;
}
export function requireOrg(req, orgId, write = false) {
  const a = orgAccess(req, orgId);
  if (!a || (write && a !== 'write')) throw notFound('Organization');
  return a;
}
export function loadProject(req, projectId, write = false) {
  const p = get('SELECT * FROM projects WHERE id=?', projectId);
  if (!p) throw notFound('Project');
  requireOrg(req, p.org_id, write);
  return row(p);
}
export function loadOrgRow(req, table, id, write = false, what = 'Record') {
  if (!/^[a-z_]+$/.test(table)) throw bad('BAD_TABLE');
  const r = get(`SELECT * FROM ${table} WHERE id=?`, id);
  if (!r) throw notFound(what);
  const a = orgAccess(req, r.org_id);
  if (!a || (write && a !== 'write')) throw notFound(what);
  return row(r);
}

export function paginate(req, max = 500) {
  const limit = Math.min(max, Math.max(1, parseInt(req.query.limit || '100', 10) || 100));
  const offset = Math.max(0, parseInt(req.query.offset || '0', 10) || 0);
  return { limit, offset };
}

export const i18nText = (v, lang) => (v === null || v === undefined ? null : typeof v === 'object' ? v : { [lang]: String(v) });
