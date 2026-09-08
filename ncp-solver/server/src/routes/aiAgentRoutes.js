import { Router } from 'express';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { runClassificationAgent, runContainmentAdvisor, runRootCauseMining, runActionRecommendation } from '../services/aiAgents.js';

const router = Router();

function getFiche(req) {
  return db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.ficheId, req.user.organizationId);
}

// E1: (re-)run the Classification Agent on demand — e.g. for fiches seeded/imported
// without an initial classification pass, or to refresh suggestions after an edit.
router.post('/:ficheId/classification', requirePermission('fiche.view'), (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  res.json(runClassificationAgent(req, fiche));
});

router.post('/:ficheId/containment-advisor', requirePermission('action.view'), (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  res.json(runContainmentAdvisor(req, fiche));
});

router.post('/:ficheId/root-cause-mining', requirePermission('rootcause.view'), (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  res.json(runRootCauseMining(req, fiche));
});

router.post('/:ficheId/action-recommendation', requirePermission('action.view'), (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const { root_cause_text } = req.body || {};
  res.json(runActionRecommendation(req, fiche, root_cause_text || fiche.description));
});

router.get('/:ficheId/logs', requirePermission('fiche.view'), (req, res) => {
  res.json(db.prepare('SELECT * FROM ai_agent_logs WHERE fiche_id = ? AND organization_id = ? ORDER BY created_at DESC')
    .all(req.params.ficheId, req.user.organizationId));
});

export default router;
