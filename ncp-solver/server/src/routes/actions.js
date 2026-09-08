import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

function nextActionNumber(orgId) {
  const year = new Date().getFullYear();
  const row = db.prepare(`SELECT COUNT(*) AS c FROM actions WHERE organization_id = ? AND action_number LIKE ?`)
    .get(orgId, `A-${year}-%`);
  return `A-${year}-${String(row.c + 1).padStart(4, '0')}`;
}

router.get('/', requirePermission('action.view'), (req, res) => {
  let sql = 'SELECT a.*, f.fiche_number, f.title AS fiche_title FROM actions a JOIN ncp_fiches f ON f.id = a.fiche_id WHERE a.organization_id = ?';
  const params = [req.user.organizationId];
  if (req.query.fiche_id) { sql += ' AND a.fiche_id = ?'; params.push(req.query.fiche_id); }
  if (req.query.owner_id) { sql += ' AND a.responsible_owner_id = ?'; params.push(req.query.owner_id); }
  if (req.query.status) { sql += ' AND a.status = ?'; params.push(req.query.status); }
  if (req.query.action_type) { sql += ' AND a.action_type = ?'; params.push(req.query.action_type); }
  sql += ' ORDER BY a.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  const evalStmt = db.prepare('SELECT * FROM action_evaluations WHERE action_id = ?');
  res.json(rows.map((r) => ({ ...r, evaluation: evalStmt.get(r.id) || null })));
});

router.post('/', requirePermission('action.create'), (req, res) => {
  const { fiche_id, action_type, root_cause_id, description, tasks, required_means, responsible_owner_id, planned_completion_date } = req.body || {};
  if (!fiche_id || !action_type || !description) return res.status(400).json({ error: 'missing_fields' });
  const fiche = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(fiche_id, req.user.organizationId);
  if (!fiche) return res.status(404).json({ error: 'fiche_not_found' });
  const id = randomUUID();
  const actionNumber = nextActionNumber(req.user.organizationId);
  db.prepare(`
    INSERT INTO actions (id, organization_id, fiche_id, action_number, action_type, root_cause_id, description, tasks, required_means, responsible_owner_id, planned_completion_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'to_do')
  `).run(id, req.user.organizationId, fiche_id, actionNumber, action_type, root_cause_id || null, description, tasks || null, required_means || null, responsible_owner_id || null, planned_completion_date || null);
  const row = db.prepare('SELECT * FROM actions WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'Action', id, null, row);
  res.status(201).json(row);
});

router.put('/:id', requirePermission('action.edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM actions WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { description, tasks, required_means, responsible_owner_id, planned_completion_date, status, actual_completion_date, root_cause_id } = req.body || {};
  db.prepare(`
    UPDATE actions SET description = COALESCE(?, description), tasks = COALESCE(?, tasks),
      required_means = COALESCE(?, required_means), responsible_owner_id = COALESCE(?, responsible_owner_id),
      planned_completion_date = COALESCE(?, planned_completion_date), status = COALESCE(?, status),
      actual_completion_date = COALESCE(?, actual_completion_date), root_cause_id = COALESCE(?, root_cause_id),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(description, tasks, required_means, responsible_owner_id, planned_completion_date, status, actual_completion_date, root_cause_id, req.params.id);
  const row = db.prepare('SELECT * FROM actions WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'Action', req.params.id, existing, row);
  res.json(row);
});

// Action Owner (RR) self-service update: status + completion date only.
router.put('/:id/progress', requirePermission('action.updateOwn'), (req, res) => {
  const existing = db.prepare('SELECT * FROM actions WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  if (existing.responsible_owner_id !== req.user.id && !req.user.permissions.has('action.edit')) {
    return res.status(403).json({ error: 'not_action_owner' });
  }
  const { status, actual_completion_date } = req.body || {};
  db.prepare(`UPDATE actions SET status = COALESCE(?, status), actual_completion_date = COALESCE(?, actual_completion_date), updated_at = datetime('now') WHERE id = ?`)
    .run(status, actual_completion_date, req.params.id);
  const row = db.prepare('SELECT * FROM actions WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'ActionProgress', req.params.id, existing, row);
  res.json(row);
});

router.delete('/:id', requirePermission('action.delete'), (req, res) => {
  const existing = db.prepare('SELECT * FROM actions WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM actions WHERE id = ?').run(req.params.id);
  writeAudit(req, 'DELETE', 'Action', req.params.id, existing, null);
  res.status(204).end();
});

// --- Evaluation (RE) ---
router.put('/:id/evaluation', requirePermission('action.evaluate'), (req, res) => {
  const action = db.prepare('SELECT * FROM actions WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!action) return res.status(404).json({ error: 'not_found' });
  if (action.responsible_owner_id === req.user.id) {
    return res.status(400).json({ error: 'rr_and_re_must_differ' });
  }
  const { planned_review_date, actual_review_date, efficiency_criteria, measurement_method, review_result, review_comments } = req.body || {};
  const existing = db.prepare('SELECT * FROM action_evaluations WHERE action_id = ?').get(action.id);
  if (existing) {
    db.prepare(`
      UPDATE action_evaluations SET evaluator_owner_id = ?, planned_review_date = COALESCE(?, planned_review_date),
        actual_review_date = COALESCE(?, actual_review_date), efficiency_criteria = COALESCE(?, efficiency_criteria),
        measurement_method = COALESCE(?, measurement_method), review_result = COALESCE(?, review_result),
        review_comments = COALESCE(?, review_comments), updated_at = datetime('now')
      WHERE action_id = ?
    `).run(req.user.id, planned_review_date, actual_review_date, efficiency_criteria, measurement_method, review_result, review_comments, action.id);
  } else {
    db.prepare(`
      INSERT INTO action_evaluations (id, action_id, evaluator_owner_id, planned_review_date, actual_review_date, efficiency_criteria, measurement_method, review_result, review_comments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), action.id, req.user.id, planned_review_date || null, actual_review_date || null, efficiency_criteria || null, measurement_method || null, review_result || 'pending', review_comments || null);
  }
  writeAudit(req, existing ? 'UPDATE' : 'CREATE', 'ActionEvaluation', action.id, existing, req.body);
  res.json(db.prepare('SELECT * FROM action_evaluations WHERE action_id = ?').get(action.id));
});

// --- Evidence ---
router.post('/:id/evidence', requirePermission('action.updateOwn'), (req, res) => {
  const action = db.prepare('SELECT * FROM actions WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!action) return res.status(404).json({ error: 'not_found' });
  const { file_name, file_type, evidence_type } = req.body || {};
  if (!file_name) return res.status(400).json({ error: 'file_name_required' });
  const id = randomUUID();
  db.prepare(`
    INSERT INTO action_evidence (id, action_id, file_name, file_type, uploaded_by_id, evidence_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, action.id, file_name, file_type || null, req.user.id, evidence_type || 'execution_proof');
  writeAudit(req, 'CREATE', 'ActionEvidence', id, null, req.body);
  res.status(201).json(db.prepare('SELECT * FROM action_evidence WHERE id = ?').get(id));
});

router.get('/:id/evidence', requirePermission('action.view'), (req, res) => {
  res.json(db.prepare('SELECT * FROM action_evidence WHERE action_id = ? ORDER BY uploaded_at DESC').all(req.params.id));
});

export default router;
