#!/usr/bin/env node
// Entry point of the delivered runtimes (Linux and Windows), called by the cortexskills / cortexskills.cmd scripts:
//   start                  first start: production database (+ reference data unless REFERENCE_DATA=non), then the server
//   admin <command> …      installation console (org-create, licence-request, licence-install, password, …)
//   secrets                two new secrets for .env (JWT_SECRET, CHANNEL_SECRET_KEY)
//   backup | restore [f]   on-demand backup; restore a backup (server stopped)
//   version                version, edition, Node.js
// The package layout: <package>/.env, <package>/data, <package>/app/server (this folder's parent), <package>/licence.
import path from 'node:path'; import fs from 'node:fs'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const SERVER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG = path.resolve(SERVER, '..', '..');
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 13)) { console.error(`  CortexSkills needs Node.js 22.13 or newer (found ${process.versions.node}).`); process.exit(1); }
process.env.CORTEXSKILLS_ENV ||= path.join(PKG, '.env');
process.env.NODE_ENV = 'production';
process.env.CORTEXSKILLS_CMD ||= 'cortexskills admin';   // command names in the console's help and messages
// Data in <package>/data unless DATA_DIR is set (environment or .env), decided before config.js fixes the paths.
if (!process.env.DATA_DIR) {
  const line = fs.existsSync(process.env.CORTEXSKILLS_ENV) && fs.readFileSync(process.env.CORTEXSKILLS_ENV, 'utf8').split(/\r?\n/).find(l => /^\s*DATA_DIR\s*=\s*\S/.test(l));
  process.env.DATA_DIR = line ? path.resolve(PKG, line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '')) : path.join(PKG, 'data');
}
const { config } = await import('../src/config.js');   // reads .env (ADMIN_*, secrets, …)
process.env.NODE_COMPILE_CACHE ||= path.join(process.env.DATA_DIR, '.node-compile-cache');
const node = (script, args = [], opts = {}) => spawnSync(process.execPath, ['--no-warnings', ...script, ...args], { stdio: 'inherit', cwd: SERVER, env: process.env, ...opts }).status ?? 1;
const [cmd = 'help', ...raw] = process.argv.slice(2);
// File arguments are given from the user's folder; the tools run in app/server.
const args = raw.map((v, i) => ((raw[i - 1] === '--file' || (cmd === 'restore' && i === 0 && !v.startsWith('-'))) && !path.isAbsolute(v) ? path.resolve(v) : v));
const edition = (() => { try { return JSON.parse(fs.readFileSync(path.join(SERVER, 'edition.json'), 'utf8')).edition; } catch { return 'source'; } })();
switch (cmd) {
  case 'start': {
    // The database is checked in a separate process: the seed replaces the file, which this process then opens.
    const seeded = node(['--input-type=module', '-e', "const d = await import('./src/db.js'); d.migrate(); process.exit(d.isSeeded() ? 0 : 3)"]);
    if (seeded === 3) {
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) { console.error('\n  First start: set ADMIN_EMAIL and ADMIN_PASSWORD in .env (premier démarrage : renseignez ADMIN_EMAIL et ADMIN_PASSWORD).\n'); process.exit(1); }
      const ref = String(process.env.REFERENCE_DATA || 'oui').toLowerCase() !== 'non';
      console.log(ref ? '\n  First start: production database with the reference data of every vertical and SME (5 to 15 minutes)…' : '\n  First start: production database…');
      const r = node(['seed/seed.js', '--production', ...(ref ? ['--reference-data'] : [])]); if (r) process.exit(r);
      console.log('  Done. Remove ADMIN_PASSWORD from .env (effacez ADMIN_PASSWORD du fichier .env).\n');
    } else if (seeded) process.exit(seeded);
    await import('../src/index.js'); break;
  }
  case 'admin': process.exit(node(['tools/admin.js'], args));
  case 'secrets': process.exit(node(['tools/secrets.js'], args));
  case 'backup': process.exit(node(['tools/backup.js'], args));
  case 'restore': process.exit(node(['tools/restore.js'], args));
  case 'version': console.log(`CortexSkills ${JSON.parse(fs.readFileSync(path.join(SERVER, 'package.json'), 'utf8')).version} · ${edition} edition · Node.js ${process.versions.node} · data ${config.dataDir}`); break;
  default: console.log('Usage: cortexskills start | admin <command> | secrets | backup | restore [file.db] | version   (cortexskills admin help: console commands)');
}
