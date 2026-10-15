// CortexSkills API server. Startup guards (FR-DA-OPS-05) run before anything else so problems are reported
// in plain language with the command that fixes them.
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 13)) {
  console.error(`\n  CortexSkills needs Node.js 22.13 or newer. This computer has Node.js ${process.versions.node}.\n  Fix: install the current LTS version from https://nodejs.org, then run "npm run dev" again.\n`);
  process.exit(1);
}
const net = await import('node:net');
const { config } = await import('./config.js');
const free = await new Promise(r => { const s = net.createServer().once('error', () => r(false)).once('listening', () => s.close(() => r(true))).listen(config.port); });
if (!free) {
  console.error(`\n  Port ${config.port} is already in use (CortexSkills may already be running in another window).\n  Fix: close the other window, or start on another port:  set PORT=4001 (Windows) / export PORT=4001 (macOS, Linux), then run "npm run dev".\n`);
  process.exit(1);
}
const { migrate, isSeeded } = await import('./db.js');
migrate();
if (!isSeeded()) {
  console.error(`\n  The database is empty.\n  Fix: run "npm run seed" in the server folder, then "npm run dev".\n`);
  process.exit(1);
}
// Data migration of release 1.12: complete the AI Use Case catalog of existing Organizations (stored module, trigger,
// expected output, links; Examples in the Prompt Specifications) — once, each change versioned (FR-DA-AI-01, AIP-07).
{
  const { one, all, run } = await import('./db.js');
  if (!one(`SELECT value FROM meta WHERE key='ai_catalog_1_12'`)) {
    const { completeCatalog } = await import('./services/aicatalog.js'); let n = 0;
    for (const o of all(`SELECT id FROM organizations`)) { try { n += completeCatalog(o.id); } catch (e) { console.error('  AI catalog migration skipped for an organization:', e.message); } }
    run(`INSERT OR REPLACE INTO meta(key,value) VALUES('ai_catalog_1_12', ?)`, String(n));
  }
  // Release 1.13 (NFR-DA-MAINT-11): the guidance of the scope and questionnaire tasks says what to do (no example
  // figures); it is updated in the catalog and in the tasks not yet started, once.
  if (!one(`SELECT value FROM meta WHERE key='guidance_1_13'`)) {
    const fs = await import('node:fs'); const g = JSON.parse(fs.readFileSync(new URL('../seed/content/guidance_3.json', import.meta.url), 'utf8')); let n = 0;
    const { clearCatalogCache } = await import('./catalog.js'); const { guidanceFor } = await import('./services/guidance.js'); const { guidanceContext } = await import('./services/projects.js');
    for (const [id, v] of Object.entries(g).filter(([k]) => /^UFT-3[23]-/.test(k))) run(`UPDATE catalog SET data=json_set(data,'$.text',json(?)) WHERE kind='guidance' AND id=?`, JSON.stringify({ en: v[0], fr: v[1], ar: v[2] }), id);
    clearCatalogCache();
    for (const t of all(`SELECT t.id, t.uft_id, t.project_id FROM task_instances t WHERE t.status='Not started' AND (t.uft_id LIKE 'UFT-32-%' OR t.uft_id LIKE 'UFT-33-%')`)) {
      const p = one(`SELECT * FROM projects WHERE id=?`, t.project_id); if (!p) continue; run(`UPDATE task_instances SET guidance=? WHERE id=?`, JSON.stringify(guidanceFor(t.uft_id, guidanceContext(p))), t.id); n++;
    }
    run(`INSERT OR REPLACE INTO meta(key,value) VALUES('guidance_1_13', ?)`, String(n));
  }
}
// Production mode: refuse to start on an unsafe configuration, naming each problem (NODE_ENV=production).
const { isProduction, productionProblems } = await import('./production.js');
if (isProduction()) {
  const { one } = await import('./db.js');
  const problems = productionProblems(one(`SELECT value FROM meta WHERE key='data_mode'`)?.value || 'demo');
  if (problems.length) { console.error('\n  CortexSkills will not start in production mode:\n' + problems.map(x => '   - ' + x).join('\n') + '\n  Fix the items above (server/.env file or server/tools/keys folder), then start again.\n'); process.exit(1); }
}
const { createApp } = await import('./app.js');
const app = await createApp();
const webBuilt = (await import('node:fs')).existsSync(new URL('../../web/dist/index.html', import.meta.url));
app.listen(config.port, () => console.log(`\n  CortexSkills API is running on http://localhost:${config.port}  (mode: ${config.deploymentMode}${isProduction() ? ', production' : ''})\n  ${webBuilt ? 'Open the application at ' + (config.publicUrl || 'http://localhost:' + config.port) + '.' : 'Now start the web application: open the "web" folder and run "npm run dev".'}\n`));
