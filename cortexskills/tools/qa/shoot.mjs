// Screenshot tool: node shoot.mjs <base> <email> <password> <lang> <outDir> name=/path ...
// Path tokens: :project (first project, or :project:ai / :project:digital), :run (first E2E instance of that project), :task (first open task, else first task).
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const [base, email, password, lang, out, ...shots] = process.argv.slice(2);
const W = +(process.env.W || 1440), H = +(process.env.H || 900);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: +(process.env.DPR || 1) });
await page.goto(base + '/login');
await page.fill('input[type=email], input[name=email]', email); await page.fill('input[type=password]', password);
await page.click('button[type=submit]'); await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 15000 });
const token = await page.evaluate(() => Object.entries(localStorage).find(([k]) => /token/i.test(k))?.[1]);
const api = (p, opt = {}) => page.evaluate(async ([p, t, o]) => (await fetch('/api' + p, { ...o, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', ...(o.headers || {}) } })).json(), [p, token, opt]);
await api('/me/language', { method: 'PUT', body: JSON.stringify({ language: lang }) });
{ const b = page.getByRole('button', { name: lang.toUpperCase(), exact: true }); if (await b.count()) { await b.first().click(); await page.waitForTimeout(500); } } // the locally chosen language wins over the profile
const projects = await api('/projects');
const pick = f => (f ? projects.find(p => String(p.focus).toLowerCase() === f) : projects[0]) || projects[0];
fs.mkdirSync(out, { recursive: true });
for (const s of shots) {
  const eq = s.indexOf('='); let name = s.slice(0, eq), path = s.slice(eq + 1); const m = path.match(/:project(?::(\w+))?/);
  const f = process.env.FOCUS;
  if (m || /:run|:task/.test(path)) {
    const p = pick(m?.[1] || f); if (m) path = path.replace(m[0], p.id);
    if (path.includes(':run') || path.includes(':task')) {
      const ws = await api('/projects/' + p.id + '/workspace');
      const runs = (ws.phases || []).flatMap(ph => ph.items || []);
      const run = runs.find(r => r.status === 'In progress') || runs[0];
      path = path.replace(':run', run?.id);
      if (path.includes(':task')) { const inst = await api('/e2e-instances/' + run.id); const tk = (inst.tasks || []).find(t => t.status === 'In progress') || (inst.tasks || [])[0]; path = path.replace(':task', tk?.id); }
    }
  }
  await page.goto(base + path); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(900);
  if (process.env.CLICK) { const el = page.locator(process.env.CLICK).first(); if (await el.count()) { await el.click(); await page.waitForTimeout(600); } }
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: !!process.env.FULL });
  console.log('shot', name, path);
}
await browser.close();
