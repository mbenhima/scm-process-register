// Screenshots of an installed editor runtime (production, reference data, a licensed customer organization) for the
// editor user guide, in English or French (SHOT_LANG=en|fr).
// Usage: node shoot-editor.mjs <baseUrl> <outDir> <platform admin e-mail> <password> <customer admin e-mail> <password>
import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW || 'playwright');
const [base, out, pEmail, pPass, cEmail, cPass] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const LG = process.env.SHOT_LANG === 'fr' ? 'fr' : 'en';
const b = await chromium.launch(); const errors = [];
const session = async (email, pass) => {
  const ctx = await b.newContext({ viewport: { width: 1360, height: 860 }, locale: LG === 'fr' ? 'fr-FR' : 'en-GB' }); const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(base + '/login'); await p.evaluate(l => localStorage.setItem('cs.lang', l), LG); await p.reload(); await p.waitForLoadState('networkidle');
  if (!email) return p;
  await p.fill('input[type=email]', email); await p.fill('input[type=password]', pass); await p.click('button[type=submit]');
  await p.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 });
  await p.evaluate(async l => { const t = Object.entries(localStorage).find(([k]) => /token/i.test(k))?.[1]; await fetch('/api/me/language', { method: 'PUT', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ language: l }) }); localStorage.setItem('cs.lang', l); }, LG);
  await p.reload(); await p.waitForLoadState('networkidle').catch(() => {}); return p;
};
const go = async (p, url, name, { wait = 1500, full = false } = {}) => { await p.goto(base + url); await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(wait); await p.screenshot({ path: `${out}/${name}.png`, fullPage: full }); };
const api = (p, path) => p.evaluate(async path => { const t = Object.entries(localStorage).find(([k]) => /token/i.test(k))?.[1]; return (await fetch('/api' + path, { headers: { Authorization: 'Bearer ' + t } })).json(); }, path);
{ const p = await session(); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/e01_signin.png` }); }
{ const p = await session(pEmail, pPass);
  await go(p, '/', 'e02_home');
  await go(p, '/tenancy', 'e03_reference_orgs', { wait: 2500 });
  // A reference project: the first project of the portfolio, read-only for the platform administrator.
  const projects = await api(p, '/projects'); const first = (Array.isArray(projects) ? projects : projects.items || [])[0];
  if (first) await go(p, `/projects/${first.id}`, 'e04_reference_project', { wait: 2500 });
  await go(p, '/admin/pricing', 'e05_pricing', { wait: 2000 });
  await p.mouse.wheel(0, 900); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/e05b_pricing_more.png` });
  await go(p, '/admin/users', 'e06_users');
  await go(p, '/process/templates', 'e09_project_templates');
  await go(p, '/admin/channels', 'e10_channels');
  await go(p, '/ai/settings', 'e11_ai_settings');
  await go(p, '/documents/templates', 'e12_document_templates');
  await go(p, '/admin/audit', 'e13_audit_log');
  await go(p, '/admin/backups', 'e14_backups'); }
if (cEmail) { const p = await session(cEmail, cPass);
  await go(p, '/admin/config', 'e07_licence', { wait: 2000 });
  await go(p, '/projects/new', 'e08_new_project'); }
console.log(JSON.stringify({ shots: fs.readdirSync(out).length, errors: [...new Set(errors)].slice(0, 10) }));
await b.close();
