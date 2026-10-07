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
