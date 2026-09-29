#!/usr/bin/env node
// On-demand backup from the command line (FR-DA-OPS-01): npm run backup
// Restore: stop the server, copy a file from data/backups over data/cortexskills.db, start the server again.
// Startup migrations upgrade a restored backup from an earlier release automatically (FR-DA-OPS-03/04).
const { migrate, isSeeded } = await import('../src/db.js');
migrate();
if (!isSeeded()) { console.error('The database is empty. Run "npm run seed" first.'); process.exit(1); }
const { backupNow } = await import('../src/services/ops.js');
const b = backupNow('on-demand');
console.log(`Backup written: data/backups/${b.file} (${Math.round(b.size / 1024)} KB)`);
