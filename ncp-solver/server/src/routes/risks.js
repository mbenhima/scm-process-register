import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

const FIELDS = [
  'code', 'title', 'description', 'item_type', 'category', 'likelihood', 'impact',
  'response_strategy', 'mitigation_plan', 'owner_id', 'status',
  'residual_likelihood', 'residual_impact', 'target_date', 'related_fiche_id', 'obs_node_id',
];

function withScores(row) {
  if (!row) return row;
  return {
    ...row,
    inherent_score: (row.likelihood || 0) * (row.impact || 0),
    residual_score: row.residual_likelihood && row.residual_impact ? row.residual_likelihood * row.residual_impact : null,
  };
}

// An empty string from an unselected <select> (e.g. the optional OBS Unit picker)
// must become NULL, not '', or it violates the FOREIGN KEY constraint on obs_node_id.
const normalize = (v) => (v === '' ? null : v);

function linkedControls(riskId) {
  return db.prepare(`
    SELECT c.* FROM risk_controls rc JOIN controls c ON c.id = rc.control_id WHERE rc.risk_id = ?
  `).all(riskId);
}

router.get('/', requirePermission('riskOpportunity.view'), (req, res) => {
  let sql = 'SELECT * FROM risks_opportunities WHERE organization_id = ?';
  const params = [req.user.organizationId];
  if (req.query.item_type) { sql += ' AND item_type = ?'; params.push(req.query.item_type); }
  if (req.query.status) { sql += ' AND status = ?'; params.push(req.query.status); }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params).map(withScores);
  res.json(rows);
});

router.get('/:id', requirePermission('riskOpportunity.view'), (req, res) => {
  const row = db.prepare('SELECT * FROM risks_opportunities WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ ...withScores(row), controls: linkedControls(row.id) });
});

router.post('/', requirePermission('riskOpportunity.create'), (req, res) => {
  const body = req.body || {};
  if (!body.title) return res.status(400).json({ error: 'title_required' });
  const id = randomUUID();
  const cols = ['id', 'organization_id', ...FIELDS];
  const vals = [id, req.user.organizationId, ...FIELDS.map((f) => normalize(body[f] ?? null))];
  db.prepare(`INSERT INTO risks_opportunities (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...vals);
  if (Array.isArray(body.control_ids)) {
    const ins = db.prepare('INSERT INTO risk_controls (risk_id, control_id) VALUES (?, ?)');
    for (const cid of body.control_ids) ins.run(id, cid);
  }
  const row = db.prepare('SELECT * FROM risks_opportunities WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'RiskOpportunity', id, null, row);
  res.status(201).json({ ...withScores(row), controls: linkedControls(id) });
});

router.put('/:id', requirePermission('riskOpportunity.edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM risks_opportunities WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const body = req.body || {};
  const setCols = FIELDS.filter((f) => f in body);
  if (setCols.length) {
    const setClause = setCols.map((f) => `${f} = ?`).join(', ');
    db.prepare(`UPDATE risks_opportunities SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
      .run(...setCols.map((f) => normalize(body[f])), req.params.id);
  }
  if (Array.isArray(body.control_ids)) {
    db.prepare('DELETE FROM risk_controls WHERE risk_id = ?').run(req.params.id);
    const ins = db.prepare('INSERT INTO risk_controls (risk_id, control_id) VALUES (?, ?)');
    for (const cid of body.control_ids) ins.run(req.params.id, cid);
  }
  const row = db.prepare('SELECT * FROM risks_opportunities WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'RiskOpportunity', req.params.id, existing, row);
  res.json({ ...withScores(row), controls: linkedControls(req.params.id) });
});

router.delete('/:id', requirePermission('riskOpportunity.delete'), (req, res) => {
  const existing = db.prepare('SELECT * FROM risks_opportunities WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM risks_opportunities WHERE id = ?').run(req.params.id);
  writeAudit(req, 'DELETE', 'RiskOpportunity', req.params.id, existing, null);
  res.status(204).end();
});

export default router;
