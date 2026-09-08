import { Router } from 'express';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { searchCapitalization } from '../services/aiAgents.js';

const router = Router();

// RAG-powered semantic search over the tenant's Capitalization Library (KB-014).
router.get('/search', requirePermission('capitalization.view'), (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) return res.json([]);
  res.json(searchCapitalization(req.user.organizationId, q, Number(req.query.limit) || 8));
});

router.get('/', requirePermission('capitalization.view'), (req, res) => {
  const rows = db.prepare(`
    SELECT f.id, f.fiche_number, f.title, f.description, f.closure_date, r.lessons_learned, r.needs_standardization, r.needs_generalization, r.tags
    FROM ncp_fiches f JOIN rex_entries r ON r.fiche_id = f.id
    WHERE f.organization_id = ? AND f.status = 'closed'
    ORDER BY f.closure_date DESC
  `).all(req.user.organizationId);
  res.json(rows);
});

export default router;
