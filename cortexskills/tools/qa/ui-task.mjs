// UI check: opens a task that can be completed, uses the AI help, types the output and completes it; expects the REX prompt.
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW || 'playwright');
const base = process.argv[2] || 'http://localhost:4000', email = process.argv[3] || 'headld@atlasmotorskenitra.ma', out = process.argv[4];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.goto(base + '/login'); await p.fill('input[type=email]', email); await p.fill('input[type=password]', 'CortexSkills#2026'); await p.click('button[type=submit]'); await p.waitForURL(u => !u.pathname.startsWith('/login'));
const token = await p.evaluate(() => Object.entries(localStorage).find(([k]) => /token/i.test(k))?.[1]);
const api = path => p.evaluate(async ([path, t]) => (await fetch('/api' + path, { headers: { Authorization: 'Bearer ' + t } })).json(), [path, token]);
const projects = await api('/projects'); const ws = await api(`/projects/${projects[0].id}/workspace`);
let run, task;
for (const ph of ws.phases) for (const r of ph.items) { if (task) break; const inst = await api(`/e2e-instances/${r.id}`); const i = inst.tasks.findIndex((t, k) => t.status === 'In progress' && (k === 0 || inst.tasks[k - 1].status === 'Completed')); if (i >= 0) { run = r; task = inst.tasks[i]; } }
await p.goto(`${base}/runs/${run.id}?task=${task.id}`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(600);
const aiBtn = p.locator('.drawer .card.flat button').first();
if (await aiBtn.count()) { await aiBtn.click(); await p.waitForTimeout(1200); if (out) await p.screenshot({ path: out + '/ui_ai.png' }); const acc = p.locator('.drawer button.primary', { hasText: /Accept|Accepter|قبول/ }).first(); if (await acc.count()) await acc.click(); await p.waitForTimeout(500); }
const ta = p.locator('#out'); if (!(await ta.inputValue()).trim()) await ta.fill('UI walkthrough output');
await p.locator('.dialog-foot button.primary').click(); await p.waitForTimeout(1200);
const rex = await p.locator('[role=dialog]').filter({ has: p.locator('a.btn.primary[href*="/gov/rex"]') }).count();
if (out) await p.screenshot({ path: out + '/ui_rex.png' });
const status = (await api(`/tasks/${task.id}`)); const st = status.status || status.task?.status;
console.log(JSON.stringify({ task: task.uft_id, status: st, rexPrompt: rex > 0, errors }));
await b.close(); process.exit(st === 'Completed' && rex > 0 && !errors.length ? 0 : 1);
