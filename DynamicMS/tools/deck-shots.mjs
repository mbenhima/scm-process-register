// Captures the screenshots used by the presentations and user guides.
// Requires the server on :4000 serving the built web client.
// Usage: node tools/deck-shots.mjs <lang> <outDir>
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js'));
const { chromium } = require('playwright');
const [lang = 'en', outDir = 'deliverables/build/deck-en'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:4000';
fs.mkdirSync(outDir, { recursive: true });

async function tokenFor(email, password = 'Demo@2026') {
  const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return (await r.json()).token;
}
const admin = await tokenFor('admin@dynamicms.example', 'Admin@2026');
const H = (t) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });
const tree = await (await fetch(`${BASE}/api/tenancy/tree`, { headers: H(admin) })).json();
const orgs = [...tree.groups.flatMap(g => g.orgs), ...tree.independent];
const projByCode = {}; for (const o of orgs) for (const p of o.projects) projByCode[p.code] = p.id;

const browser = await chromium.launch();
const errors = [];
async function session(email, password) {
  const tk = await tokenFor(email, password);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.5 });
  await ctx.addInitScript(([t, l]) => { sessionStorage.setItem('dms.token', t); localStorage.setItem('dms.lang', l); localStorage.setItem('dms.lang.chosen', '1'); }, [tk, lang]);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  return { tk, page, ctx };
}
async function shoot(s, projectCode, route, name, opts = {}) {
  await fetch(`${BASE}/api/auth/prefs`, { method: 'PUT', headers: H(s.tk), body: JSON.stringify({ projectId: projByCode[projectCode], lang }) });
  await s.page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await s.page.waitForTimeout(600);
  if (opts.tab) { await s.page.getByRole('tab', { name: opts.tab }).first().click(); await s.page.waitForLoadState('networkidle'); await s.page.waitForTimeout(opts.wait || 900); }
  if (opts.click) { await s.page.getByText(opts.click, { exact: false }).first().click(); await s.page.waitForTimeout(700); }
  if (opts.scroll) { await s.page.evaluate((y) => window.scrollTo(0, y), opts.scroll); await s.page.waitForTimeout(300); }
  await s.page.screenshot({ path: path.join(outDir, `${name}.png`) });
  process.stdout.write('.');
}

// 1) One lifecycle screenshot per sector (large company QMS run) + SME dashboard
const verticalOrgs = orgs.filter(o => o.size === 'Large');
const adminS = await session('admin@dynamicms.example', 'Admin@2026');
for (const o of verticalOrgs) {
  const code = o.projects.find(p => p.ms_type === 'QMS')?.code;
  await shoot(adminS, code, '/lifecycle', `sector-${o.sector}`, { scroll: 250 });
}
for (const o of orgs.filter(x => x.size === 'SME')) {
  const code = o.projects.find(p => p.ms_type === 'QHSE')?.code;
  await shoot(adminS, code, '/', `sme-${o.code}`);
}

// 2) Feature screenshots on the scenario projects
const t = {
  en: { bpmn: 'BPMN diagram', sipoc: 'SIPOC', group: 'Across my group' },
  fr: { bpmn: 'Diagramme BPMN', sipoc: 'SIPOC', group: 'Dans mon groupe' },
}[lang] || {};
const q = await session('quality@horizon-universal.example');
const stepsTodo = await (await fetch(`${BASE}/api/projects/${projByCode['HZ-UNI-QMS']}/steps?status=Todo&limit=1`, { headers: H(q.tk) })).json();
const stepsDone = await (await fetch(`${BASE}/api/projects/${projByCode['HZ-UNI-QMS']}/steps?status=Done&limit=60`, { headers: H(q.tk) })).json();
const doneAssess = stepsDone.items.find(x => x.form_kind === 'assess') || stepsDone.items[0];
await shoot(q, 'HZ-UNI-QMS', '/', 'f-home');
await shoot(q, 'HZ-UNI-QMS', '/lifecycle', 'f-lifecycle');
await shoot(q, 'HZ-UNI-QMS', '/lifecycle/E2E-11', 'f-gate', { scroll: 700 });
await shoot(q, 'HZ-UNI-QMS', `/steps/${stepsTodo.items[0].id}`, 'f-step');
await shoot(q, 'HZ-UNI-QMS', `/steps/${doneAssess.id}`, 'f-step-done');
await shoot(q, 'HZ-UNI-QMS', '/mp/MP-018', 'f-mp');
await shoot(q, 'HZ-UNI-QMS', '/mp/MP-018', 'f-sipoc', { tab: t.sipoc });
await shoot(q, 'HZ-UNI-QMS', '/mp/MP-002', 'f-bpmn', { tab: t.bpmn, wait: 2500 });
await shoot(q, 'HZ-UNI-QHSE', '/risks', 'f-risks');
await shoot(q, 'HZ-UNI-QMS', '/kpis', 'f-kpis');
await shoot(q, 'HZ-UNI-QMS', '/racsi', 'f-racsi');
await shoot(q, 'HZ-UNI-QMS', '/ncs', 'f-ncs');
await shoot(q, 'HZ-UNI-QMS', '/documents', 'f-documents');
await shoot(q, 'HZ-UNI-QMS', '/planning', 'f-planning');
await shoot(q, 'HZ-UNI-QMS', '/reports', 'f-reports');
await shoot(q, 'HZ-UNI-QMS', '/alerts', 'f-alerts');
await shoot(q, 'HZ-UNI-QMS', '/ai', 'f-ai');
await shoot(q, 'HZ-UNI-QMS', '/process', 'f-process');
const ceo = await session('ceo@horizon-aut.example');
await shoot(ceo, 'HZ-AUT-QMS', '/portfolio', 'f-portfolio');
await shoot(ceo, 'HZ-AUT-QMS', '/benchmark', 'f-benchmark', { tab: t.group, wait: 2500 });
const sme = await session('ims@atlas-sme.example');
await shoot(sme, 'AT-UNI-QMS', '/projects/new', 'f-newproject', { click: lang === 'fr' ? 'Avec l' : 'With AI' });
const asst = await session('quality@nova-aec.example');
await asst.page.goto(`${BASE}/assistant`, { waitUntil: 'networkidle' });
process.stdout.write('\n');
if (errors.length) console.log('ERRORS', [...new Set(errors)].join('\n'));
await browser.close();
console.log('done', outDir);
