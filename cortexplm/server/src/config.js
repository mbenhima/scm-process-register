import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

export const config = {
  port: Number(process.env.PORT || 4000),
  webOrigin: (process.env.WEB_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  secret: process.env.APP_SECRET || 'cortexplm-development-secret-change-me',
  deploymentMode: (process.env.DEPLOYMENT_MODE || 'saas').toLowerCase(),
  licensePath: path.resolve(ROOT, process.env.LICENSE_PATH || './licence/licence.lic'),
  dbPath: path.resolve(ROOT, process.env.DB_PATH || './data/cortexplm.db'),
  uploadDir: path.resolve(ROOT, process.env.UPLOAD_DIR || './data/uploads'),
  tokenTtl: process.env.TOKEN_TTL || '8h',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
  },
};

export const dataDir = path.join(here, 'data');
