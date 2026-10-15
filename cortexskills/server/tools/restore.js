#!/usr/bin/env node
// Restores a backup (FR-DA-OPS-03): stop the server first, then  npm run restore -- <backup file name or path>
// (in a container: docker compose run --rm --no-deps --entrypoint cortexskills-admin cortexskills restore <file>).
// The current database is kept beside the backups as before-restore-<date>.db; startup migrations upgrade a backup
// from an earlier release automatically.
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/config.js';

const arg = process.argv[2];
const list = fs.existsSync(config.backupDir) ? fs.readdirSync(config.backupDir).filter(f => f.endsWith('.db')).sort() : [];
if (!arg) { console.log(`\n  Usage: restore <backup file>\n  Backups in ${config.backupDir}:\n${list.map(f => '   ' + f).join('\n') || '   (none)'}\n`); process.exit(1); }
const file = fs.existsSync(arg) ? path.resolve(arg) : path.join(config.backupDir, path.basename(arg));
if (!fs.existsSync(file)) { console.error(`\n  No backup named ${arg}. Run restore without a name to list them.\n`); process.exit(1); }
const head = Buffer.alloc(16); const fd = fs.openSync(file, 'r'); fs.readSync(fd, head, 0, 16, 0); fs.closeSync(fd);
if (head.toString('latin1') !== 'SQLite format 3\u0000') { console.error('\n  This file is not a CortexSkills backup (not an SQLite database).\n'); process.exit(1); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
if (fs.existsSync(config.dbFile)) fs.copyFileSync(config.dbFile, path.join(config.backupDir, `before-restore-${stamp}.db`));
for (const ext of ['-wal', '-shm']) fs.rmSync(config.dbFile + ext, { force: true });
fs.copyFileSync(file, config.dbFile);
console.log(`\n  Restored ${path.basename(file)} into ${config.dbFile}.\n  The previous database is kept as before-restore-${stamp}.db. Start the server again.\n`);
