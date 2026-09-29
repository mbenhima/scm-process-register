import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

// Optional .env file (KEY=VALUE lines) next to package.json. Real environment variables win.
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');

export const config = {
  port: Number(process.env.PORT || 4000),
  dataDir,
  dbFile: path.join(dataDir, 'cortexskills.db'),
  backupDir: path.join(dataDir, 'backups'),
  attachmentDir: path.join(dataDir, 'attachments'),
  licenceFile: process.env.LICENSE_PATH || path.join(dataDir, 'license.lic'),
  jwtSecret: process.env.JWT_SECRET || 'cortexskills-local-development-secret-change-me',
  jwtTtl: process.env.JWT_TTL || '12h',
  hmacSecret: process.env.LICENSE_HMAC_SECRET || 'cortexskills-licence-hmac-local-secret',
  deploymentMode: (process.env.DEPLOYMENT_MODE || 'saas').toLowerCase(),
  backupRetentionDays: Number(process.env.BACKUP_RETENTION_DAYS || 14),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  minNode: '22.13.0',
  cacheTtlMs: 30000,
};

for (const d of [config.dataDir, config.backupDir, config.attachmentDir]) fs.mkdirSync(d, { recursive: true });
