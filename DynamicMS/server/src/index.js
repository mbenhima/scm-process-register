// DynamicMS API server.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config, ROOT } from './config.js';
import { openDb, migrate, isInitialized, get } from './db.js';
import { authenticate } from './auth.js';
import { HttpError, langOf } from './http.js';
import { scan } from './services/alerts.js';
import { scheduleBackups, licenceStatus } from './services/ops.js';
import auth from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import tenancy from './routes/tenancy.js';
import execution from './routes/execution.js';
import governance from './routes/governance.js';
import records from './routes/records.js';
import documents from './routes/documents.js';
import ai from './routes/ai.js';
import design from './routes/design.js';
import reports from './routes/reports.js';
import analytics from './routes/analytics.js';
import admin from './routes/admin.js';
import ptemplates from './routes/ptemplates.js';

// ---- Startup guards
if (process.env.NODE_ENV === 'production' && config.jwtSecret === 'dynamicms-local-dev-secret-change-me') {
  console.error('Refusing to start: set JWT_SECRET to a long random value in production.');
  process.exit(1);
}
openDb();
migrate();
if (!isInitialized()) {
  console.error('The database is empty. Run "npm run seed" first, then "npm run dev".');
  process.exit(1);
}

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: config.corsOrigin.split(','), credentials: false }));
app.use(express.json({ limit: '5mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 1200, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (req, res) => {
  const seeded = get("SELECT value FROM meta WHERE key='seeded_at'")?.value;
  res.json({ status: 'ok', version: '1.0.0', seededAt: seeded, deployment: config.deploymentMode, licence: licenceStatus().valid ? 'valid' : 'invalid', time: new Date().toISOString() });
});
app.use('/api/auth', auth);

// Everything below requires a valid token.
app.use('/api', authenticate, (req, _res, next) => { req.lang = langOf(req); next(); });
// On-premises without a valid licence the platform turns read-only (CD D30).
app.use('/api', (req, _res, next) => {
  if (req.method === 'GET' || req.user?.is_platform_admin || req.path.startsWith('/admin/licence')) return next();
  if (!licenceStatus().valid) return next(new HttpError(402, 'LICENCE_INVALID', 'The licence is not valid; the platform is read-only.'));
  next();
});
app.use('/api/catalog', catalogRoutes);
app.use('/api/tenancy', tenancy);
app.use('/api', tenancy);
app.use('/api', execution);
app.use('/api', governance);
app.use('/api', documents);
app.use('/api', records);
app.use('/api', ai);
app.use('/api', design);
app.use('/api', reports);
app.use('/api', ptemplates);
app.use('/api', analytics);
app.use('/api/admin', admin);
app.use('/api', (req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'Unknown endpoint.')));

// Serves the built web client when present (single-host production mode).
const dist = path.resolve(ROOT, '..', 'web', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Malformed JSON body.' } });
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'Each file must be 10 MB or less.' } });
  if (/CHECK constraint failed/.test(err?.message || '')) return res.status(400).json({ error: { code: 'CONSTRAINT', message: 'The request breaks a data rule (for example owner and evaluator must differ).' } });
  if (/UNIQUE constraint failed: racsi_assignments/.test(err?.message || '')) return res.status(400).json({ error: { code: 'ONE_ACCOUNTABLE', message: 'Each activity has exactly one Accountable.' } });
  console.error(err);
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error. The incident was logged.' } });
});

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, 'src', 'index.js')) {
  app.listen(config.port, () => {
    console.log(`DynamicMS API listening on http://localhost:${config.port} (${config.deploymentMode})`);
    scheduleBackups();
    const tick = () => { try { const n = scan(); if (n) console.log(`[alerts] ${n} new time-based alerts`); } catch (e) { console.error('[alerts]', e.message); } };
    setTimeout(tick, 5000).unref();
    setInterval(tick, 15 * 60_000).unref();
  });
}
