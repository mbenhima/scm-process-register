// Screenshots of the Santéora private clinic full run for the case presentation (every end-to-end process): the
// project, each process page, one task of each process opened with its steps, and the main result screens.
// Usage: node shoot-clinic-flow.mjs <baseUrl> <clinic-flow.json> <outDir> <en|fr>
import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW || 'playwright');
const [base = 'http://localhost:4000', flowFile, out, lang = 'fr'] = process.argv.slice(2);
const flow = JSON.parse(fs.readFileSync(flowFile, 'utf8')); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: lang === 'fr' ? 'fr-FR' : 'en-GB', deviceScaleFactor: 1.5 });
const p = await ctx.newPage(); const errors = [];
p.on('pageerror', e => errors.push(e.message)); p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) errors.push(`${r.status()} ${r.url().replace(base, '')}`); });
await p.goto(base + '/login'); await p.fill('input[type=email]', 'headld@santeora.ma'); await p.fill('input[type=password]', 'CortexSkills#2026'); await p.click('button[type=submit]');
await p.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 });
const token = await p.evaluate(() => Object.entries(localStorage).find(([k]) => /token/i.test(k))?.[1]);
await p.evaluate(async ([t, l]) => fetch('/api/me/language', { method: 'PUT', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ language: l }) }), [token, lang]);
// The interface language is kept in the browser (cs.lang): set it before the first screen.
await p.evaluate(l => { for (const k of ['cs.lang']) { try { localStorage.setItem(k, l); } catch {} } }, lang);
const go = async (url, wait = 1200) => { await p.goto(base + url); await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(wait); };
const shot = async (name, opts = {}) => p.screenshot({ path: `${out}/${name}.png`, fullPage: !!opts.full }).catch(e => errors.push(name + ': ' + e.message));
const pid = flow.project.id;
await go('/'); await shot('00_dashboard');
await go(`/projects/${pid}`, 2500); await shot('01_project'); await shot('01_project_full', { full: true });
await go(`/projects/${pid}/gantt`, 2000); await shot('02_gantt');
await go('/process/chain', 2000); await shot('03_chain');
await go('/process/gates', 1500); await shot('04_gates');
// Each process: its page, then the task with the longest output opened in the drawer with its steps unfolded.
for (const r of flow.runs) {
  const e = r.e2e.id;
  await go(`/runs/${r.id}`, 1500); await shot(`run_${e}`);
  const t = [...r.tasks].sort((a, b) => (b.output?.[lang]?.length || 0) - (a.output?.[lang]?.length || 0))[0];
  await go(`/runs/${r.id}?task=${t.id}`, 1500);
  // The first step unfolded, the panel read from its top.
  const h = p.locator('.drawer .step-head').first();
  if ((await h.getAttribute('aria-expanded').catch(() => null)) === 'false') { await h.click().catch(() => {}); await p.waitForTimeout(500); }
  await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(600);
  await p.locator('.drawer .drawer-body').evaluate(el => { el.scrollTop = 0; }).catch(() => {}); await p.waitForTimeout(300);
  await p.locator('.drawer').screenshot({ path: `${out}/task_${e}.png` }).catch(() => shot(`task_${e}`));
  r.shotTask = t.uft;
}
fs.writeFileSync(`${out}/tasks.json`, JSON.stringify(Object.fromEntries(flow.runs.map(r => [r.e2e.id, r.shotTask]))));
// Results screens.
for (const [url, name, wait] of [['/questionnaires', '10_questionnaires'], ['/training-plan', '11_training_plan', 2500], ['/documents', '12_documents'], ['/reports', '13_reports'], ['/gov/kpis', '14_kpis'], ['/gov/racsi', '15_racsi'], ['/process/coverage', '16_coverage'], ['/my-tasks', '17_my_tasks']])
  { await go(url, wait || 1500); await shot(name); }
console.log(JSON.stringify({ shots: fs.readdirSync(out).length, errors: [...new Set(errors)].slice(0, 30) }, null, 1));
await b.close();
