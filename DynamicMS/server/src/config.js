import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

function envInt(name, dflt) {
  const v = parseInt(process.env[name] || '', 10);
  return Number.isFinite(v) ? v : dflt;
}

export const config = {
  port: envInt('PORT', 4000),
  dbFile: process.env.DB_FILE || path.join(ROOT, 'data', 'dynamicms.db'),
  backupDir: process.env.BACKUP_DIR || path.join(ROOT, 'backups'),
  storageDir: process.env.STORAGE_DIR || path.join(ROOT, 'storage'),
  backupRetentionDays: envInt('BACKUP_RETENTION_DAYS', 14),
  jwtSecret: process.env.JWT_SECRET || 'dynamicms-local-dev-secret-change-me',
  jwtTtl: process.env.JWT_TTL || '12h',
  deploymentMode: process.env.DEPLOYMENT_MODE || 'saas', // saas | onprem
  licenceFile: process.env.LICENCE_FILE || path.join(ROOT, 'licence', 'licence.lic'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  demoPassword: 'Demo@2026',
  adminEmail: 'admin@dynamicms.example',
  adminPassword: 'Admin@2026',
  cacheTtlMs: 30000,
  minBenchmarkSample: 3,
};
