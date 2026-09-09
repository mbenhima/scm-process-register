import { Router } from 'express';
import { requirePermission } from '../middleware/rbac.js';
import { runDataQueryAgent, runAppFeatureQueryAgent } from '../services/aiAgents.js';
import { APP_FAQ } from '../data/appFaq.js';

const router = Router();

router.post('/query-data', requirePermission('assistant.view'), (req, res) => {
  const { question } = req.body || {};
  if (!question || !question.trim()) return res.status(400).json({ error: 'question_required' });
  res.json(runDataQueryAgent(req, question));
});

router.post('/query-app', requirePermission('assistant.view'), (req, res) => {
  const { question } = req.body || {};
  if (!question || !question.trim()) return res.status(400).json({ error: 'question_required' });
  res.json(runAppFeatureQueryAgent(req, question, APP_FAQ));
});

export default router;
