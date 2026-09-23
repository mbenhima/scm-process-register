// npm run backup: writes a dated copy of the database to data/backups and applies the retention period.
// Restore: stop the server and copy a backup file over data/cortexplm.db.
import { runBackup, listBackups } from '../src/lib/backup.js';

const r = runBackup();
console.log(`\n  Backup written: ${r.dir}/${r.file}`);
if (r.removed.length) console.log(`  Removed ${r.removed.length} backup(s) older than ${r.retentionDays} days.`);
console.log(`  ${listBackups().length} backup(s) kept. To restore, stop the server and copy a backup over data/cortexplm.db.\n`);
