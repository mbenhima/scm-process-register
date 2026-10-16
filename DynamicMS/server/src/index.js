// DynamicMS API server.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config, ROOT } from './config.js';
import { openDb, closeDb, migrate, isInitialized, get } from './db.js';
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
import entries from './routes/entries.js';
import { runMigrations } from './services/migrations.js';
import { SETUP_SECRET, applySetupFile } from './ops/setup.js';

// ---- Startup guards
const PROD = config.appMode === 'production';
const refuse = (msg) => { console.error(`Refusing to start: ${msg}`); process.exit(1); };
if ((PROD || process.env.NODE_ENV === 'production') && (config.jwtSecret === 'dynamicms-local-dev-secret-change-me' || config.jwtSecret.length < 32)) refuse('set JWT_SECRET to a random value of at least 32 characters.');
openDb();
migrate();
// The database is ready at once when it exists; a production first start creates it (asynchronous).
async function firstStart() {
  // Production first start: the database is created here (FR-DA-OPS-01).
  const strong = (pw) => pw.length >= 12 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw);
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) refuse('set ADMIN_EMAIL and ADMIN_PASSWORD for the first start.');
  if (!strong(config.adminPassword)) refuse('ADMIN_PASSWORD needs at least 12 characters with upper case, lower case and a digit.');
  if (config.initData === 'demo' && (!process.env.SEED_PASSWORD || !strong(config.demoPassword))) refuse('The seeded data needs SEED_PASSWORD (at least 12 characters with upper case, lower case and a digit).');
  closeDb();
  console.log(`First start: creating the database (${config.initData === 'demo' ? 'seeded data of every vertical and SME' : 'catalog and administrator only'}).`);
  const { seedDatabase } = await import('./seed/run.js');
  await seedDatabase({ demo: config.initData === 'demo' });
  openDb();
  migrate();
}
const migrateData = () => { for (const m of runMigrations()) console.log(`Migration ${m.id}: ${m.summary}`); };
export let ready;
if (isInitialized()) {
  // Versioned data migrations of an upgrade, each run once and recorded (NFR-DA-MAINT-11).
  migrateData();
  ready = Promise.resolve();
} else if (!PROD) {
  console.error('The database is empty. Run "npm run seed" first, then "npm run dev".');
  process.exit(1);
} else {
  ready = firstStart().then(migrateData);
}

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: config.corsOrigin.split(','), credentials: false }));
// gzip of JSON, HTML, CSS and JavaScript responses (files already compressed are left as they are).
app.use(compression({ threshold: 1024 }));
app.use(express.json({ limit: '5mb' }));
// Customer edition: no commercial data leaves the server (prices, price matrix, bundles,
// discounts, commercial agreements); the commercial catalog and the price quote do not exist.
const COMMERCIAL_KEYS = new Set(['price', 'prices', 'priceMatrix', 'annualPrice', 'totalMonthly', 'subtotal', 'bundleDiscountPct', 'annualDiscountPct', 'multiplier', 'bundles', 'bundleDiscounts', 'agreements', 'clusters', 'licensingLinks', 'licensing', 'recommendedAddons']);
const stripCommercial = (v) => {
  if (Array.isArray(v)) return v.map(stripCommercial);
  if (v && typeof v === 'object' && v.constructor === Object) {
    const o = {};
    for (const [k, x] of Object.entries(v)) if (!COMMERCIAL_KEYS.has(k)) o[k] = stripCommercial(x);
    return o;
  }
  return v;
};
if (!config.commercial) {
  app.use('/api', (req, res, next) => {
    if (/^\/(catalog\/commercial|admin\/pricing)\b/.test(req.path)) return next(new HttpError(404, 'NOT_FOUND', 'Unknown endpoint.'));
    const json = res.json.bind(res);
    res.json = (body) => json(stripCommercial(body));
    next();
  });
}
app.use('/api', rateLimit({ windowMs: 60_000, limit: 1200, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (req, res) => {
  const seeded = get("SELECT value FROM meta WHERE key='seeded_at'")?.value;
  res.json({ status: 'ok', version: '1.0.0', mode: config.appMode, demo: config.appMode === 'demo', seededAt: seeded, deployment: config.deploymentMode, licence: licenceStatus().valid ? 'valid' : 'invalid', time: new Date().toISOString() });
});
app.use('/api/auth', auth);

// Everything below requires a valid token.
app.use('/api', authenticate, (req, _res, next) => { req.lang = langOf(req); next(); });
// An account created with an initial password must set its own before anything else.
app.use('/api', (req, _res, next) => {
  if (req.user?.must_change_password && req.headers['x-dms-setup'] !== SETUP_SECRET) return next(new HttpError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your password before continuing.'));
  next();
});
// On-premises without a valid licence the platform turns read-only (CD D30). In production nobody
// bypasses it, the platform administrator included; only installing a licence stays possible.
app.use('/api', (req, _res, next) => {
  if (req.method === 'GET' || req.path.startsWith('/admin/licence')) return next();
  if (!PROD && req.user?.is_platform_admin) return next();
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
app.use('/api', entries);
app.use('/api', analytics);
app.use('/api/admin', admin);
app.use('/api', (req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'Unknown endpoint.')));

// Serves the built web client when present (single-host production mode).
const dist = path.resolve(ROOT, '..', 'web', 'dist');
if (fs.existsSync(dist)) {
  // Built assets carry a content hash in their name: cached for a year; index.html is revalidated.
  // A production build ships Brotli and gzip copies of its text assets: served as they are, so no
  // CPU is spent compressing them on each request.
  const TYPES = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
  app.get(/^\/assets\/[\w.-]+\.(js|css|svg|json)$/, (req, res, next) => {
    const accept = String(req.headers['accept-encoding'] || '');
    for (const [enc, ext] of [['br', '.br'], ['gzip', '.gz']]) {
      const file = path.join(dist, req.path + ext);
      if (accept.includes(enc) && fs.existsSync(file)) {
        res.set({ 'Content-Type': TYPES[path.extname(req.path)], 'Content-Encoding': enc, 'Vary': 'Accept-Encoding', 'Cache-Control': 'public, max-age=31536000, immutable' });
        return res.sendFile(file);
      }
    }
    next();
  });
  app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '365d', immutable: true, index: false }));
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } }));
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

// A runtime build always serves; from the source, only when this file is the entry point.
if (config.edition !== 'dev' || (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, 'src', 'index.js'))) {
  ready.then(() => app.listen(config.port, () => {
    console.log(`DynamicMS API listening on http://localhost:${config.port} (${config.deploymentMode}, ${config.appMode})`);
    if (config.setupFile) applySetupFile().catch(e => console.error('[setup]', e.message));
    scheduleBackups();
    const tick = () => { try { const n = scan(); if (n) console.log(`[alerts] ${n} new time-based alerts`); } catch (e) { console.error('[alerts]', e.message); } };
    setTimeout(tick, 5000).unref();
    setInterval(tick, 15 * 60_000).unref();
  })).catch(e => { console.error(e); process.exit(1); });
}
