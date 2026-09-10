import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

// Append-only (FR-M6-07): no PUT/PATCH/DELETE route is ever exposed for this
// log, by design - it is a durable record of what every AI suggestion in the
// Library actually produced and what the human reviewer did with it.
// Writing an entry requires no separate permission beyond authentication:
// it is always a side effect of a suggestion the user already legitimately
// saw through the properly RBAC-gated agent endpoint that produced it.
router.post('/', (req, res) => {
  const { use_case_id, project_id, fiche_id, output_summary, outcome, generated_by } = req.body || {};
  if (!use_case_id || !output_summary || !['accepted', 'edited', 'rejected'].includes(outcome)) {
    return res.status(400).json({ error: 'use_case_id_output_summary_and_valid_outcome_required' });
  }
  const useCase = db.prepare('SELECT id FROM ai_use_cases WHERE id = ? AND organization_id = ?').get(use_case_id, req.user.organizationId);
  if (!useCase) return res.status(404).json({ error: 'use_case_not_found' });
  const id = randomUUID();
  db.prepare(`
    INSERT INTO ai_usage_log (id, use_case_id, organization_id, project_id, fiche_id, output_summary, outcome, generated_by, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, use_case_id, req.user.organizationId, project_id || null, fiche_id || null,
    String(output_summary).slice(0, 500), outcome, generated_by === 'llm' ? 'llm' : 'deterministic', req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM ai_usage_log WHERE id = ?').get(id));
});

router.get('/', requirePermission('aiUseCase.viewUsageLog'), (req, res) => {
  const { useCaseId, limit } = req.query;
  const rows = useCaseId
    ? db.prepare(`
        SELECT l.*, u.first_name, u.last_name, uc.title AS use_case_title FROM ai_usage_log l
        LEFT JOIN users u ON u.id = l.user_id LEFT JOIN ai_use_cases uc ON uc.id = l.use_case_id
        WHERE l.organization_id = ? AND l.use_case_id = ? ORDER BY l.created_at DESC LIMIT ?
      `).all(req.user.organizationId, useCaseId, Number(limit) || 100)
    : db.prepare(`
        SELECT l.*, u.first_name, u.last_name, uc.title AS use_case_title FROM ai_usage_log l
        LEFT JOIN users u ON u.id = l.user_id LEFT JOIN ai_use_cases uc ON uc.id = l.use_case_id
        WHERE l.organization_id = ? ORDER BY l.created_at DESC LIMIT ?
      `).all(req.user.organizationId, Number(limit) || 100);
  res.json(rows);
});

export default router;
