import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';
import { requireBpmnMode } from '../services/packConfig.js';

const router = Router();
const FIELDS = ['code', 'title', 'description', 'xml', 'obs_node_id', 'updated_by'];

// Read routes need at least 'view' mode (Resolve has none, Govern+ have view/edit);
// write routes need 'edit' mode (Assure standard, or the BPMN Full Editing Modeler Add-On).
router.get('/', requireBpmnMode('view'), requirePermission('bpmn.view'), (req, res) => {
  const rows = db.prepare('SELECT * FROM bpmn_diagrams WHERE organization_id = ? ORDER BY code ASC').all(req.user.organizationId);
  res.json(rows);
});

router.get('/:id', requireBpmnMode('view'), requirePermission('bpmn.view'), (req, res) => {
  const row = db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(row);
});

router.post('/', requireBpmnMode('edit'), requirePermission('bpmn.create'), (req, res) => {
  const body = { ...req.body, updated_by: req.user.id };
  const id = body.id || randomUUID();
  const providedFields = FIELDS.filter((f) => f in body);
  const cols = ['id', 'organization_id', ...providedFields];
  const vals = [id, req.user.organizationId, ...providedFields.map((f) => (body[f] === '' ? null : body[f]))];
  db.prepare(`INSERT INTO bpmn_diagrams (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...vals);
  const row = db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'BpmnDiagram', id, null, row);
  res.status(201).json(row);
});

router.put('/:id', requireBpmnMode('edit'), requirePermission('bpmn.edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const body = { ...req.body, updated_by: req.user.id };
  const setCols = FIELDS.filter((f) => f in body);
  if (setCols.length) {
    const setClause = setCols.map((f) => `${f} = ?`).join(', ');
    db.prepare(`UPDATE bpmn_diagrams SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
      .run(...setCols.map((f) => (body[f] === '' ? null : body[f])), req.params.id);
  }
  const row = db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'BpmnDiagram', req.params.id, existing, row);
  res.json(row);
});

router.delete('/:id', requireBpmnMode('edit'), requirePermission('bpmn.delete'), (req, res) => {
  const existing = db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM bpmn_diagrams WHERE id = ?').run(req.params.id);
  writeAudit(req, 'DELETE', 'BpmnDiagram', req.params.id, existing, null);
  res.status(204).end();
});

export default router;
