// Scheduled backups (NFR-DA-REL-04): a consistent copy of the SQLite database (VACUUM INTO) is written to
// BACKUP_DIR once a day, and copies older than BACKUP_RETENTION_DAYS are removed.
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { openDb } from '../db.js';

export const backupDir = () => path.resolve(config.dbPath, '..', process.env.BACKUP_DIR || 'backups');
const retention = () => Number(process.env.BACKUP_RETENTION_DAYS || 14);

export function listBackups() {
  const dir = backupDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^cortexplm-\d{8}-\d{6}\.db$/.test(f)).sort().reverse()
    .map((f) => ({ file: f, size: fs.statSync(path.join(dir, f)).size, created: fs.statSync(path.join(dir, f)).mtime.toISOString() }));
}

export function runBackup() {
  const dir = backupDir(); fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const file = path.join(dir, `cortexplm-${stamp}.db`);
  openDb().exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  const limit = Date.now() - retention() * 86400000;
  const removed = [];
  for (const b of listBackups()) if (new Date(b.created).getTime() < limit) { fs.rmSync(path.join(dir, b.file)); removed.push(b.file); }
  return { file: path.basename(file), dir, removed, retentionDays: retention() };
}

// Called by the background tick: at most one automatic backup per calendar day.
export function dailyBackup() {
  if ((process.env.BACKUP_DAILY || 'on') === 'off') return null;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (listBackups().some((b) => b.file.includes(`-${today}-`))) return null;
  return runBackup();
}
