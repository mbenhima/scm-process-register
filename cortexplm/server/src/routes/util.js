import { q } from '../db.js';
import { audit, diff, justificationRequired, snapshot, versionsOf } from '../lib/audit.js';
import { requirePerm } from '../lib/security.js';
import { requireFeatureFor } from '../lib/entitlements.js';
import { invalidate } from '../lib/rag.js';

export const ctxOf = (req) => ({ user: req.user, orgId: req.orgId, perms: req.perms });

// Wrap async handlers; map domain errors (status property) to HTTP responses.
export const h = (fn) => async (req, res, next) => {
  try { const out = await fn(req, res, next); if (out !== undefined && !res.headersSent) res.json(out); }
  catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message, rule: e.rule, control: e.control, errors: e.errors });
    if (String(e.message).includes('UNIQUE constraint failed: racsi_assignments.activity_id')) return res.status(409).json({ error: 'This activity already has an Accountable (A). An activity can have only one.' });
    if (String(e.message).includes('constraint')) return res.status(409).json({ error: 'The change conflicts with existing data.' });
    next(e);
  }
};

export const badRequest = (msg) => Object.assign(new Error(msg), { status: 400 });
export const notFound = (msg = 'Not found.') => Object.assign(new Error(msg), { status: 404 });

const pickFields = (body, fields) => Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f] === '' ? null : body[f]]));

// Generic tenant-scoped CRUD with RBAC, Pack gating, audit, stage-then-justify and version snapshots.
export function crud(router, path, { table, entity, fields, required = [], view, manage, feature, versioned = false, order = 'id', filter, validate, map = (r) => r, searchable = [], ragOrg = false }) {
  const gate = (req) => { if (feature) requireFeatureFor(req.orgId, feature); };
  router.get(path, requirePerm(view), h((req) => {
    gate(req);
    const where = ['org_id = ?']; const args = [req.orgId];
    if (req.query.process) { where.push('process_tag = ?'); args.push(req.query.process); }
    if (filter) filter(req, where, args);
    return q.all(`SELECT * FROM ${table} WHERE ${where.join(' AND ')} ORDER BY ${order}`, ...args).map(map);
  }));
  router.get(`${path}/:id`, requirePerm(view), h((req) => {
    gate(req);
    const r = q.get(`SELECT * FROM ${table} WHERE id = ? AND org_id = ?`, req.params.id, req.orgId);
    if (!r) throw notFound();
    return { ...map(r), versions: versioned ? versionsOf(entity, r.id) : undefined };
  }));
  router.post(path, requirePerm(manage), h((req) => {
    gate(req);
    const data = pickFields(req.body, fields);
    for (const f of required) if (data[f] == null || data[f] === '') throw badRequest(`${f.replace(/_/g, ' ')} is required.`);
    validate?.(data, req);
    const id = q.insert(table, { ...data, org_id: req.orgId });
    const row = q.get(`SELECT * FROM ${table} WHERE id = ?`, id);
    audit(ctxOf(req), entity, id, 'create', diff({}, data));
    if (versioned) snapshot(ctxOf(req), entity, id, row, req.body.justification || null);
    if (ragOrg) invalidate(req.orgId);
    return map(row);
  }));
  router.put(`${path}/:id`, requirePerm(manage), h((req) => {
    gate(req);
    const before = q.get(`SELECT * FROM ${table} WHERE id = ? AND org_id = ?`, req.params.id, req.orgId);
    if (!before) throw notFound();
    const data = pickFields(req.body, fields);
    validate?.({ ...before, ...data }, req);
    const changes = diff(before, data);
    if (Object.keys(changes).length && justificationRequired(req.orgId) && !String(req.body.justification || '').trim()) {
      throw Object.assign(new Error('A justification note is required before saving this change.'), { status: 400 });
    }
    q.update(table, before.id, data);
    audit(ctxOf(req), entity, before.id, 'update', changes, req.body.justification || null);
    const row = q.get(`SELECT * FROM ${table} WHERE id = ?`, before.id);
    if (versioned && Object.keys(changes).length) snapshot(ctxOf(req), entity, before.id, row, req.body.justification || null);
    if (ragOrg) invalidate(req.orgId);
    return map(row);
  }));
  router.delete(`${path}/:id`, requirePerm(manage), h((req) => {
    gate(req);
    const before = q.get(`SELECT * FROM ${table} WHERE id = ? AND org_id = ?`, req.params.id, req.orgId);
    if (!before) throw notFound();
    q.run(`DELETE FROM ${table} WHERE id = ?`, before.id);
    audit(ctxOf(req), entity, before.id, 'delete', {}, req.body?.justification || null);
    if (ragOrg) invalidate(req.orgId);
    return { ok: true };
  }));
  if (versioned) {
    router.post(`${path}/:id/revert/:version`, requirePerm(manage), h((req) => {
      gate(req);
      const before = q.get(`SELECT * FROM ${table} WHERE id = ? AND org_id = ?`, req.params.id, req.orgId);
      if (!before) throw notFound();
      const v = q.get('SELECT data FROM entity_versions WHERE entity_type = ? AND entity_id = ? AND version = ?', entity, before.id, req.params.version);
      if (!v) throw notFound('Version not found.');
      const data = pickFields(JSON.parse(v.data), fields);
      q.update(table, before.id, data);
      const row = q.get(`SELECT * FROM ${table} WHERE id = ?`, before.id);
      const nv = snapshot(ctxOf(req), entity, before.id, row, `Reverted to version ${req.params.version}. ${req.body.justification || ''}`.trim());
      audit(ctxOf(req), entity, before.id, 'revert', diff(before, data), `Reverted to version ${req.params.version} (new version ${nv}).`);
      return map(row);
    }));
  }
}
