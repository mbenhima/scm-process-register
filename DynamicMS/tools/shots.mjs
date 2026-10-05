// Takes screenshots of the running application (server on :4000 serving web/dist).
// Usage: node tools/shots.mjs <outDir> <email> <lang> <route1,route2,...> [projectCode] [width]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js'));
const { chromium } = require('playwright');

const [outDir, email, lang = 'en', routes = '/', projectCode = '', width = '1440'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:4000';
const password = email.startsWith('admin@dynamicms') ? 'Admin@2026' : 'Demo@2026';
fs.mkdirSync(outDir, { recursive: true });

const login = await (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })).json();
const token = login.token;
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
let projectId = null;
if (projectCode) {
  const tree = await (await fetch(`${BASE}/api/tenancy/tree`, { headers: H })).json();
  for (const o of [...tree.groups.flatMap(g => g.orgs), ...tree.independent]) for (const p of o.projects) if (p.code === projectCode) projectId = p.id;
  await fetch(`${BASE}/api/auth/prefs`, { method: 'PUT', headers: H, body: JSON.stringify({ projectId, lang }) });
}
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const ctx = await browser.newContext({ viewport: { width: +width, height: 900 }, deviceScaleFactor: 1, locale: lang === "fr" ? "fr-FR" : "en-GB" });
await ctx.addInitScript(([tk, lg]) => { sessionStorage.setItem('dms.token', tk); localStorage.setItem('dms.lang', lg); localStorage.setItem('dms.lang.chosen', '1'); }, [token, lang]);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`pageerror ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console ${m.text()}`); });
for (const r of routes.split(',')) {
  const [route, nameClick] = r.split('=');
  const [name, click] = (nameClick || '').split('@');
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  if (click) { await page.getByRole('tab', { name: click }).first().click().catch(() => page.getByText(click, { exact: false }).first().click()); await page.waitForLoadState('networkidle'); await page.waitForTimeout(1500); }
  const file = path.join(outDir, `${name || route.replace(/\W+/g, '_') || 'home'}.png`);
  await page.screenshot({ path: file, fullPage: process.env.FULL === '1' });
  console.log('shot', file);
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
await browser.close();
