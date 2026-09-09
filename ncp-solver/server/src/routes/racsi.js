import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

const ACTIVITY_FIELDS = ['code', 'title', 'description', 'module_ref', 'linked_record_id', 'ncp_stage', 'obs_node_id'];
const LINKED_TABLE = { business_rule: 'business_rules', control: 'controls', risk_opportunity: 'risks_opportunities' };
const RACSI_ORDER = { A: 1, R: 2, C: 3, S: 4, I: 5 };

function linkedRecordLabel(moduleRef, recordId, orgId) {
  const table = LINKED_TABLE[moduleRef];
  if (!table || !recordId) return null;
  const row = db.prepare(`SELECT code, title FROM ${table} WHERE id = ? AND organization_id = ?`).get(recordId, orgId);
  return row ? `${row.code} — ${row.title}` : null;
}

function withAssignments(activity, orgId) {
  const assignments = db.prepare(`
    SELECT ra.id, ra.activity_id, ra.racsi_type, ra.role_id, ra.user_id, ra.created_at,
           r.code AS role_code, r.name AS role_name, r.name_fr AS role_name_fr, r.name_ar AS role_name_ar,
           u.first_name, u.last_name, u.email AS user_email
    FROM racsi_assignments ra
    LEFT JOIN roles r ON r.id = ra.role_id
    LEFT JOIN users u ON u.id = ra.user_id
    WHERE ra.activity_id = ?
  `).all(activity.id).sort((a, b) => (RACSI_ORDER[a.racsi_type] - RACSI_ORDER[b.racsi_type]));
  return { ...activity, assignments, linked_record_label: linkedRecordLabel(activity.module_ref, activity.linked_record_id, orgId) };
}

router.get('/', requirePermission('racsi.view'), (req, res) => {
  let sql = 'SELECT * FROM racsi_activities WHERE organization_id = ?';
  const params = [req.user.organizationId];
  if (req.query.module_ref) { sql += ' AND module_ref = ?'; params.push(req.query.module_ref); }
  sql += ' ORDER BY module_ref, code';
  const rows = db.prepare(sql).all(...params).map((a) => withAssignments(a, req.user.organizationId));
  res.json(rows);
});

router.get('/:id', requirePermission('racsi.view'), (req, res) => {
  const row = db.prepare('SELECT * FROM racsi_activities WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(withAssignments(row, req.user.organizationId));
});

router.post('/', requirePermission('racsi.create'), (req, res) => {
  const body = req.body || {};
  if (!body.code || !body.title) return res.status(400).json({ error: 'code_and_title_required' });
  const id = randomUUID();
  const cols = ['id', 'organization_id', ...ACTIVITY_FIELDS];
  const vals = [id, req.user.organizationId, ...ACTIVITY_FIELDS.map((f) => body[f] || null)];
  db.prepare(`INSERT INTO racsi_activities (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...vals);
  const row = db.prepare('SELECT * FROM racsi_activities WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'RacsiActivity', id, null, row);
  res.status(201).json(withAssignments(row, req.user.organizationId));
});

router.put('/:id', requirePermission('racsi.edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM racsi_activities WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const body = req.body || {};
  const setCols = ACTIVITY_FIELDS.filter((f) => f in body);
  if (setCols.length) {
    const setClause = setCols.map((f) => `${f} = ?`).join(', ');
    db.prepare(`UPDATE racsi_activities SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
      .run(...setCols.map((f) => body[f] || null), req.params.id);
  }
  const row = db.prepare('SELECT * FROM racsi_activities WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'RacsiActivity', req.params.id, existing, row);
  res.json(withAssignments(row, req.user.organizationId));
});

router.delete('/:id', requirePermission('racsi.delete'), (req, res) => {
  const existing = db.prepare('SELECT * FROM racsi_activities WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM racsi_activities WHERE id = ?').run(req.params.id);
  writeAudit(req, 'DELETE', 'RacsiActivity', req.params.id, existing, null);
  res.status(204).end();
});

// --- Assignments (Responsible / Accountable / Consulted / Support / Informed) ---
router.post('/:id/assignments', requirePermission('racsi.edit'), (req, res) => {
  const activity = db.prepare('SELECT * FROM racsi_activities WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!activity) return res.status(404).json({ error: 'not_found' });
  const { racsi_type, role_id, user_id } = req.body || {};
  if (!['R', 'A', 'C', 'S', 'I'].includes(racsi_type)) return res.status(400).json({ error: 'invalid_racsi_type' });
  if (!!role_id === !!user_id) return res.status(400).json({ error: 'assign_exactly_one_role_or_user' });
  if (role_id) {
    const role = db.prepare('SELECT id FROM roles WHERE id = ? AND organization_id = ?').get(role_id, req.user.organizationId);
    if (!role) return res.status(400).json({ error: 'role_not_found' });
  }
  if (user_id) {
    const user = db.prepare('SELECT id FROM users WHERE id = ? AND organization_id = ?').get(user_id, req.user.organizationId);
    if (!user) return res.status(400).json({ error: 'user_not_found' });
  }
  const id = randomUUID();
  try {
    db.prepare('INSERT INTO racsi_assignments (id, activity_id, racsi_type, role_id, user_id) VALUES (?, ?, ?, ?, ?)')
      .run(id, activity.id, racsi_type, role_id || null, user_id || null);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT' || String(err.message).includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'accountable_already_assigned', message: 'This activity already has an Accountable (A). Remove it before assigning a new one.' });
    }
    throw err;
  }
  const row = db.prepare('SELECT * FROM racsi_activities WHERE id = ?').get(activity.id);
  writeAudit(req, 'CREATE', 'RacsiAssignment', id, null, { activity_id: activity.id, racsi_type, role_id, user_id });
  res.status(201).json(withAssignments(row, req.user.organizationId));
});

router.delete('/:id/assignments/:assignmentId', requirePermission('racsi.edit'), (req, res) => {
  const activity = db.prepare('SELECT * FROM racsi_activities WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!activity) return res.status(404).json({ error: 'not_found' });
  const existing = db.prepare('SELECT * FROM racsi_assignments WHERE id = ? AND activity_id = ?').get(req.params.assignmentId, activity.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM racsi_assignments WHERE id = ?').run(req.params.assignmentId);
  writeAudit(req, 'DELETE', 'RacsiAssignment', req.params.assignmentId, existing, null);
  const row = db.prepare('SELECT * FROM racsi_activities WHERE id = ?').get(activity.id);
  res.json(withAssignments(row, req.user.organizationId));
});

export default router;
