import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from './audit.js';

/**
 * Generic CRUD router factory for simple tenant-scoped tables.
 * Handles list/get/create/update/delete with RBAC + audit logging.
 */
export function makeCrudRouter({
  table,
  entityType,
  fields,           // array of column names writable via API
  permView,
  permCreate,
  permEdit,
  permDelete,
  tenantColumn = 'organization_id',
  orderBy = 'created_at DESC',
  extraFilters,     // (req) => { clause, params }
  beforeCreate,     // (body, req) => body
  afterList,        // (rows, req) => rows
}) {
  const router = Router();

  router.get('/', requirePermission(permView), (req, res) => {
    let sql = `SELECT * FROM ${table} WHERE ${tenantColumn} = ?`;
    const params = [req.user.organizationId];
    if (extraFilters) {
      const f = extraFilters(req);
      if (f) { sql += ` AND ${f.clause}`; params.push(...f.params); }
    }
    sql += ` ORDER BY ${orderBy}`;
    let rows = db.prepare(sql).all(...params);
    if (afterList) rows = afterList(rows, req);
    res.json(rows);
  });

  router.get('/:id', requirePermission(permView), (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND ${tenantColumn} = ?`)
      .get(req.params.id, req.user.organizationId);
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json(row);
  });

  router.post('/', requirePermission(permCreate), (req, res) => {
    let body = { ...req.body };
    if (beforeCreate) body = beforeCreate(body, req);
    const id = body.id || randomUUID();
    const cols = ['id', tenantColumn, ...fields];
    const vals = [id, req.user.organizationId, ...fields.map((f) => body[f] ?? null)];
    const placeholders = cols.map(() => '?').join(',');
    db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`).run(...vals);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    writeAudit(req, 'CREATE', entityType, id, null, row);
    res.status(201).json(row);
  });

  router.put('/:id', requirePermission(permEdit), (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND ${tenantColumn} = ?`)
      .get(req.params.id, req.user.organizationId);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    const body = req.body;
    const setCols = fields.filter((f) => f in body);
    if (setCols.length) {
      const setClause = setCols.map((f) => `${f} = ?`).join(', ');
      const hasUpdatedAt = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === 'updated_at');
      const sql = `UPDATE ${table} SET ${setClause}${hasUpdatedAt ? ", updated_at = datetime('now')" : ''} WHERE id = ?`;
      db.prepare(sql).run(...setCols.map((f) => body[f]), req.params.id);
    }
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    writeAudit(req, 'UPDATE', entityType, req.params.id, existing, row);
    res.json(row);
  });

  router.delete('/:id', requirePermission(permDelete), (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND ${tenantColumn} = ?`)
      .get(req.params.id, req.user.organizationId);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    writeAudit(req, 'DELETE', entityType, req.params.id, existing, null);
    res.status(204).end();
  });

  return router;
}
