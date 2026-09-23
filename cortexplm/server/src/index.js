import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config.js';
import { openDb, q } from './db.js';
import auth from './routes/auth.js';
import reference from './routes/reference.js';
import projects from './routes/projects.js';
import governance from './routes/governance.js';
import intelligence from './routes/intelligence.js';
import admin, { inboundHandler } from './routes/admin.js';
import reports from './routes/reports.js';
import { processQueue } from './lib/dispatch.js';
import { computeAlerts, raiseAlert } from './lib/alerts.js';
import { activateScheduledRuns } from './lib/lifecycle.js';
import { getLicenceProvider } from './licensing/index.js';

export function createApp() {
  openDb();
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cors({ origin: config.webOrigin, exposedHeaders: ['Content-Disposition'] }));
  app.use(express.json({ limit: '3mb' }));
  app.get('/api/health', (req, res) => res.json({ ok: true, seeded: !!q.get("SELECT value FROM meta WHERE key = 'seeded_at'"), mode: config.deploymentMode }));
  app.post('/api/integrations/:id/inbound', inboundHandler); // HMAC-authenticated webhook
  app.use('/api', auth); // public i18n + login, then authenticate()
  app.use('/api', reference, projects, governance, intelligence, admin, reports);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route.' }));
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error('[error]', err);
    res.status(500).json({ error: 'Something went wrong on the server. Your data was not changed.' });
  });
  return app;
}

function background() {
  const tick = () => {
    try {
      activateScheduledRuns({ now: new Date().toISOString(), notify: false });
      for (const o of q.all('SELECT id, name FROM organizations')) {
        computeAlerts(o.id);
        const lic = getLicenceProvider(o.id).check(); // CTRL-003 licence expiry prevention
        if (lic.status === 'warning') raiseAlert(o.id, 'SYS-02', { entityType: 'licence', entityId: o.id, message: `${o.name}: licence expires in ${lic.daysLeft} days.`, periodKey: `w${Math.floor(lic.daysLeft / 7)}` });
      }
    } catch (e) { console.error('[background]', e.message); }
  };
  setInterval(() => processQueue().catch(() => {}), 60 * 1000).unref();
  setInterval(tick, 15 * 60 * 1000).unref();
  setTimeout(tick, 5000).unref();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = createApp();
  if (!q.get("SELECT value FROM meta WHERE key = 'seeded_at'")) {
    console.log('\n  The database is empty. Stop the server (Ctrl+C), run "npm run seed", then "npm run dev" again.\n');
  }
  app.listen(config.port, () => {
    console.log(`\n  CortexPLM API is running on http://localhost:${config.port}`);
    console.log(`  Licensing mode: ${config.deploymentMode}. Open the web app at ${config.webOrigin[0]}\n`);
  });
  background();
}
