// Platform operations: consistent backups with retention, integrity check and the
// licence provider (SaaS vs on-premises signed licence) (FR-DA-OPS, CD D30).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { config, ROOT } from '../config.js';
import { getDb, get } from '../db.js';

export function backupNow(reason = 'manual') {
  fs.mkdirSync(config.backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const file = path.join(config.backupDir, `dynamicms-${stamp}-${reason}.db`);
  getDb().exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  const check = verifyBackup(file);
  prune();
  return { file: path.basename(file), size: fs.statSync(file).size, integrity: check, at: new Date().toISOString() };
}
export function verifyBackup(file) {
  const d = new DatabaseSync(file, { readOnly: true });
  try { return d.prepare('PRAGMA integrity_check').get().integrity_check; } finally { d.close(); }
}
export function listBackups() {
  if (!fs.existsSync(config.backupDir)) return [];
  return fs.readdirSync(config.backupDir).filter(f => f.endsWith('.db')).map(f => { const s = fs.statSync(path.join(config.backupDir, f)); return { file: f, size: s.size, at: s.mtime.toISOString() }; }).sort((a, b) => b.at.localeCompare(a.at));
}
export function prune(days = config.backupRetentionDays) {
  const limit = Date.now() - days * 86400000;
  let n = 0;
  for (const b of listBackups()) if (new Date(b.at).getTime() < limit) { fs.rmSync(path.join(config.backupDir, b.file)); n++; }
  return n;
}
let timer = null;
export function scheduleBackups() {
  const last = listBackups()[0];
  if (!last || Date.now() - new Date(last.at).getTime() > 86400000) { try { backupNow('daily'); } catch (e) { console.error('[backup] failed:', e.message); } }
  timer = setInterval(() => { try { backupNow('daily'); } catch (e) { console.error('[backup] failed:', e.message); } }, 86400000);
  timer.unref();
}

// ---- Licence provider
const PUB = path.join(ROOT, 'licence', 'public.pem');
export function licenceStatus() {
  if (config.deploymentMode !== 'onprem') return { mode: 'saas', valid: true, message: 'Entitlements are managed by the platform configuration.' };
  try {
    const lic = JSON.parse(fs.readFileSync(config.licenceFile, 'utf8'));
    const pub = crypto.createPublicKey(fs.readFileSync(PUB));
    const ok = crypto.verify(null, Buffer.from(JSON.stringify(lic.payload)), pub, Buffer.from(lic.signature, 'base64'));
    if (!ok) return { mode: 'onprem', valid: false, message: 'Licence signature is invalid.' };
    if (lic.payload.expires && lic.payload.expires < new Date().toISOString().slice(0, 10)) return { mode: 'onprem', valid: false, payload: lic.payload, message: 'Licence expired.' };
    const users = get('SELECT COUNT(*) n FROM users WHERE status=?', 'Active').n;
    if (lic.payload.seats && users > lic.payload.seats) return { mode: 'onprem', valid: false, payload: lic.payload, message: `Active users (${users}) exceed licensed seats (${lic.payload.seats}).` };
    return { mode: 'onprem', valid: true, payload: lic.payload, message: 'Licence valid.' };
  } catch (e) {
    return { mode: 'onprem', valid: false, message: `No valid licence file (${e.code || e.message}).` };
  }
}
export function installLicence(text) {
  const lic = JSON.parse(text);
  if (!lic.payload || !lic.signature) throw new Error('Malformed licence file.');
  fs.mkdirSync(path.dirname(config.licenceFile), { recursive: true });
  fs.writeFileSync(config.licenceFile, JSON.stringify(lic, null, 2));
  return licenceStatus();
}
