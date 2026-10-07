import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { config, ROOT } from './config.js';
import { loadDictionary } from './i18n.js';
import { syncPermissions } from './rbac.js';
import { migrate } from './db.js';
import { authenticate } from './auth.js';
import { errorHandler, securityHeaders } from './lib/http.js';
import { scheduleDailyBackup } from './services/ops.js';
import { retryFailed } from './services/dispatch.js';
import publicRoutes from './routes/public.js';
import coreRoutes from './routes/core.js';
import tenancyRoutes from './routes/tenancy.js';
import processRoutes from './routes/process.js';
import runRoutes from './routes/runs.js';
import governanceRoutes from './routes/governance.js';
import aiRoutes from './routes/ai.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import questionnaireRoutes from './routes/questionnaires.js';
import trainingRoutes from './routes/training.js';
import searchRoutes from './routes/search.js';
import documentRoutes from './routes/documents.js';
import designRoutes from './routes/design.js';
import stepRoutes from './routes/steps.js';
import obsRoutes from './routes/obs.js';
import blueprintRoutes from './routes/blueprints.js';
import { retryMessages } from './services/channels.js';
import { tickAll, purgeResponses } from './services/questionnaires.js';

export async function createApp({ background = true } = {}) {
  migrate();
  loadDictionary();
  syncPermissions(); // additive permission-catalog migration (FR-DA-RBAC-10)
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  // Behind a reverse proxy (HTTPS termination), trust its address so client IPs and HTTPS are seen correctly.
  if (process.env.TRUST_PROXY) app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
  const prod = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  if (prod) app.use((req, res, next) => { res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); next(); });
  // Request log, one JSON line per API call (no query string, no body, no token): LOG_REQUESTS=true or production mode.
  if (prod || process.env.LOG_REQUESTS === 'true') app.use('/api', (req, res, next) => { const t0 = Date.now(); res.on('finish', () => console.log(JSON.stringify({ t: new Date().toISOString(), m: req.method, p: req.baseUrl + req.path, s: res.statusCode, ms: Date.now() - t0, ip: req.ip, u: req.user?.id || null }))); next(); });
  app.use(securityHeaders);
  app.use(compression({ filter: (req, res) => !String(res.getHeader('Content-Type') || '').match(/pdf|zip|officedocument|image\//) && compression.filter(req, res) }));
  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','), exposedHeaders: ['Content-Disposition'] }));
  // The raw body is kept for webhook signature checks (WhatsApp X-Hub-Signature-256).
  app.use(express.json({ limit: '5mb', verify: (req, res, buf) => { if (req.url.startsWith('/api/public/')) req.rawBody = buf; } }));
  app.use('/api', publicRoutes);          // login, health, dictionary (no token)
  app.use('/api', authenticate);
  for (const r of [coreRoutes, tenancyRoutes, processRoutes, runRoutes, governanceRoutes, aiRoutes, reportRoutes, adminRoutes, questionnaireRoutes, trainingRoutes, searchRoutes, documentRoutes, designRoutes, stepRoutes, obsRoutes, blueprintRoutes]) app.use('/api', r);
  app.use('/api', (req, res, next) => next(Object.assign(new Error('nf'), { status: 404 })));
  // Optional production mode: serve the built web client from ../web/dist when present.
  const dist = path.resolve(ROOT, '..', 'web', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.use((err, req, res, next) => (err.status === 404 && err.message === 'nf') ? res.status(404).json({ error: 'err.notFound', message: 'Not found' }) : errorHandler(err, req, res, next));
  if (background) {
    scheduleDailyBackup(); setInterval(retryFailed, 60000).unref();
    setInterval(() => retryMessages().catch(() => {}), 60000).unref();
    setInterval(() => tickAll().catch(() => {}), 10 * 60000).unref(); // questionnaire plans and reminders
    setInterval(() => { try { purgeResponses(); } catch (e) { console.warn('[retention]', e.message); } }, 24 * 3600000).unref(); // NFR-DA-QLT-02
  }
  return app;
}
