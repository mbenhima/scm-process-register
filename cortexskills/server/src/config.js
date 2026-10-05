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
  // Base URL of the web client, used in the response links sent by email and WhatsApp (falls back to the request origin).
  publicUrl: (process.env.PUBLIC_URL || '').replace(/\/$/, ''),
  // Key protecting stored channel credentials and response links (AES-256-GCM). Set it in production.
  secretKey: process.env.CHANNEL_SECRET_KEY || process.env.JWT_SECRET || 'cortexskills-local-development-secret-change-me',
  // Platform-wide channel defaults, used by an Organization that has not configured its own provider.
  smtp: { host: process.env.SMTP_HOST || '', port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '', from: process.env.SMTP_FROM || '' },
  whatsapp: { apiBase: (process.env.WHATSAPP_API_BASE || 'https://graph.facebook.com/v21.0').replace(/\/$/, ''), token: process.env.WHATSAPP_TOKEN || '', phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '', appSecret: process.env.WHATSAPP_APP_SECRET || '', template: process.env.WHATSAPP_TEMPLATE || '', templateLang: process.env.WHATSAPP_TEMPLATE_LANG || '' },
  minNode: '22.13.0',
  cacheTtlMs: 30000,
};

for (const d of [config.dataDir, config.backupDir, config.attachmentDir]) fs.mkdirSync(d, { recursive: true });
