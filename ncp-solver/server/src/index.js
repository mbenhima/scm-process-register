import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/auth.js';
import { isEmpty } from './db/index.js';
import { runSeed } from './seed/seed.js';

import authRoutes from './routes/auth.js';
import hierarchyRoutes from './routes/hierarchy.js';
import obsRoutes from './routes/obs.js';
import usersRoutes from './routes/users.js';
import rolesRoutes from './routes/roles.js';
import licenseRoutes from './routes/license.js';
import governanceRoutes from './routes/governance.js';
import standardsRoutes from './routes/standards.js';
import fichesRoutes from './routes/fiches.js';
import actionsRoutes from './routes/actions.js';
import alertsRoutes from './routes/alerts.js';
import aiUseCasesRoutes from './routes/aiUseCases.js';
import aiAgentRoutes from './routes/aiAgentRoutes.js';
import capitalizationRoutes from './routes/capitalization.js';
import reportsRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import businessRulesRoutes from './routes/businessRules.js';
import controlsRoutes from './routes/controls.js';
import risksRoutes from './routes/risks.js';

if (isEmpty()) {
  console.log('Empty database detected - running seed...');
  runSeed();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'ncp-solver-api' }));

app.use('/api/auth', authRoutes);

// Everything below requires a valid JWT.
app.use('/api', authenticate);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/obs', obsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/standards', standardsRoutes);
app.use('/api/fiches', fichesRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/ai-use-cases', aiUseCasesRoutes);
app.use('/api/ai-agents', aiAgentRoutes);
app.use('/api/capitalization', capitalizationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/business-rules', businessRulesRoutes);
app.use('/api/controls', controlsRoutes);
app.use('/api/risks', risksRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error', message: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`NCP Solver API listening on http://localhost:${PORT}`));
