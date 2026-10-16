import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

function envInt(name, dflt) {
  const v = parseInt(process.env[name] || '', 10);
  return Number.isFinite(v) ? v : dflt;
}

// Edition compiled into a runtime build (customer or editor); 'dev' when run from the source.
// A runtime edition always runs in production mode; the customer edition always runs on-premises,
// without commercial data (prices) and without licence issuing.
/* global __EDITION__ */
export const EDITION = typeof __EDITION__ !== 'undefined' ? __EDITION__ : 'dev';
const RUNTIME = EDITION !== 'dev';

export const config = {
  port: envInt('PORT', 4000),
  dbFile: process.env.DB_FILE || path.join(ROOT, 'data', 'dynamicms.db'),
  backupDir: process.env.BACKUP_DIR || path.join(ROOT, 'backups'),
  storageDir: process.env.STORAGE_DIR || path.join(ROOT, 'storage'),
  backupRetentionDays: envInt('BACKUP_RETENTION_DAYS', 14),
  jwtSecret: process.env.JWT_SECRET || 'dynamicms-local-dev-secret-change-me',
  jwtTtl: process.env.JWT_TTL || '12h',
  deploymentMode: EDITION === 'customer' ? 'onprem' : (process.env.DEPLOYMENT_MODE || 'saas'), // saas | onprem
  licenceFile: process.env.LICENCE_FILE || path.join(ROOT, 'licence', 'licence.lic'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // demo: development and demonstrations (demo accounts shown on the sign-in page).
  // production: no account shown, administrator from the environment, password change at first sign-in.
  appMode: RUNTIME || process.env.APP_MODE === 'production' ? 'production' : 'demo',
  edition: EDITION,
  commercial: EDITION !== 'customer',
  licenceIssuing: EDITION !== 'customer',
  licenceSigningKey: process.env.LICENCE_SIGNING_KEY || path.join(process.env.LICENCE_KEYS_DIR || path.join(ROOT, 'licence'), 'private.pem'),
  // First start of an empty database in production: 'empty' (catalog and administrator only) or 'demo' (seeded data).
  initData: (process.env.INIT_DATA || (RUNTIME ? 'demo' : 'empty')) === 'demo' ? 'demo' : 'empty',
  demoPassword: process.env.SEED_PASSWORD || 'Demo@2026',
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@dynamicms.example').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@2026',
  adminName: process.env.ADMIN_NAME || 'Platform Administrator',
  setupFile: process.env.SETUP_FILE || '',
  licencePublicKey: EDITION === 'customer' ? '' : (process.env.LICENCE_PUBLIC_KEY || ''),
  cacheTtlMs: 30000,
  minBenchmarkSample: 3,
  // Multi-record entry limits (FR-DA-MRE-22, -29, -30; NFR-DA-SEC-22).
  pasteMaxRows: envInt('PASTE_MAX_ROWS', 1000),
  importMaxRows: envInt('IMPORT_MAX_ROWS', 10000),
  importMaxBytes: envInt('IMPORT_MAX_BYTES', 10 * 1024 * 1024),
  batchSize: envInt('BATCH_SIZE', 300),
};
