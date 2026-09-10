import { Router } from 'express';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { requireActiveUseCase } from '../services/aiActivation.js';
import {
  runClassificationAgent, runProblemStructuringAgent, runContainmentAdvisor,
  runRootCauseMining, runActionRecommendation, runEvaluationAssistant,
} from '../services/aiAgents.js';

const router = Router();

function getFiche(req) {
  return db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.ficheId, req.user.organizationId);
}

// Every route below accepts an optional { connection, projectId } in the body:
// - connection: the browser-local Real LLM Provider Connection, forwarded for
//   this one request only (never persisted server-side — see aiGeneration.js).
// - projectId: which Project this Sheet belongs to, for the activation check.
// requireActiveUseCase blocks with 403 if the matching AI Use Case is
// deactivated for this Organization/Project (FR-M6-05); req.aiUseCase is then
// available for the response payload (used_case_id, tier) if needed.

router.post('/:ficheId/classification', requirePermission('fiche.view'), requireActiveUseCase('fiche_s1'), async (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  res.json({ useCaseId: req.aiUseCase?.id, ...(await runClassificationAgent(req, fiche, req.body?.connection)) });
});

router.post('/:ficheId/problem-structuring', requirePermission('fiche.view'), requireActiveUseCase('fiche_s2'), async (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  res.json({ useCaseId: req.aiUseCase?.id, ...(await runProblemStructuringAgent(req, fiche, req.body?.connection)) });
});

router.post('/:ficheId/containment-advisor', requirePermission('action.view'), requireActiveUseCase('fiche_s3'), async (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  res.json({ useCaseId: req.aiUseCase?.id, ...(await runContainmentAdvisor(req, fiche, req.body?.connection)) });
});

router.post('/:ficheId/root-cause-mining', requirePermission('rootcause.view'), requireActiveUseCase('fiche_s4'), async (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  res.json({ useCaseId: req.aiUseCase?.id, ...(await runRootCauseMining(req, fiche, req.body?.connection)) });
});

router.post('/:ficheId/action-recommendation', requirePermission('action.view'), requireActiveUseCase('fiche_s5'), async (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const { root_cause_text, connection } = req.body || {};
  res.json({ useCaseId: req.aiUseCase?.id, ...(await runActionRecommendation(req, fiche, root_cause_text || fiche.description, connection)) });
});

router.post('/:ficheId/evaluation-assistant', requirePermission('action.view'), requireActiveUseCase('fiche_s6'), async (req, res) => {
  const fiche = getFiche(req);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  res.json({ useCaseId: req.aiUseCase?.id, ...(await runEvaluationAssistant(req, fiche, req.body?.connection)) });
});

router.get('/:ficheId/logs', requirePermission('fiche.view'), (req, res) => {
  res.json(db.prepare('SELECT * FROM ai_agent_logs WHERE fiche_id = ? AND organization_id = ? ORDER BY created_at DESC')
    .all(req.params.ficheId, req.user.organizationId));
});

export default router;
