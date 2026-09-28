// npm run backup            -> takes a consistent backup and prunes old ones
// npm run backup -- --list  -> lists backups
// npm run backup -- --verify <file> -> runs an integrity check on a backup file
import path from 'node:path';
import { openDb, closeDb } from '../db.js';
import { config } from '../config.js';
import { backupNow, listBackups, verifyBackup } from '../services/ops.js';

const args = process.argv.slice(2);
if (args[0] === '--list') {
  for (const b of listBackups()) console.log(`${b.at}  ${(b.size / 1048576).toFixed(1)} MB  ${b.file}`);
} else if (args[0] === '--verify') {
  const f = path.isAbsolute(args[1] || '') ? args[1] : path.join(config.backupDir, args[1] || '');
  console.log(`integrity_check: ${verifyBackup(f)}`);
} else {
  openDb();
  const r = backupNow('cli');
  console.log(`Backup written: ${r.file} (${(r.size / 1048576).toFixed(1)} MB), integrity: ${r.integrity}. Retention: ${config.backupRetentionDays} days.`);
  closeDb();
}
