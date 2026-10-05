// QA crawler: signs in, visits every menu route in each language, reports runtime errors,
// failed API calls and raw i18n keys left in the page. Usage: node crawl.mjs <baseUrl> <email> <password> [langs] [outDir]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const [base = 'http://localhost:4000', email = 'admin@cortexskills.app', password = 'Admin#2026', langs = 'en', out = ''] = process.argv.slice(2);
const KEY = /\b(?:nav|navGroup|common|col|status|field|entity|err|ai|assistant|alert|notify|report|settings|help|page|header|login|home|portfolio|process|workspace|governance|admin|dashboard|enum|mode|focus|severity|channel|gate|racsi|quota|coso|segment|phase|bmk|chain|coverage|licence|config|scope|stepType|pf|sipoc|tpl|task|run|rex|bpmn|kpi|ops|user|org|project|q|qch|qev|qact|qplan|qmsg|pop|doc|docf|ch|channelMode|search|rule|ter|tr|persona|lvl|item)\.[a-zA-Z][\w.]*\b/g;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const issues = [];
page.on('pageerror', e => issues.push({ type: 'pageerror', url: page.url(), msg: e.message }));
page.on('console', m => { if (m.type() === 'error') issues.push({ type: 'console', url: page.url(), msg: m.text().slice(0, 300) }); });
page.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) issues.push({ type: 'api', url: page.url(), msg: `${r.status()} ${r.request().method()} ${r.url().replace(base, '')}` }); });
await page.goto(base + '/login');
await page.fill('input[type=email], input[name=email]', email);
await page.fill('input[type=password]', password);
await page.click('button[type=submit]');
await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 15000 });
const token = await page.evaluate(() => Object.entries(localStorage).find(([k]) => /token/i.test(k))?.[1]);
const nav = await page.evaluate(async t => (await fetch('/api/nav', { headers: { Authorization: 'Bearer ' + t } })).json(), token);
const routes = [...new Set((nav.items || nav).map(i => i.route))];
for (const lang of langs.split(',')) {
  await page.evaluate(async ([t, l]) => fetch('/api/me/language', { method: 'PUT', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ language: l }) }), [token, lang]);
  for (const r of routes) {
    await page.goto(base + r); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(400);
    const text = await page.evaluate(() => document.querySelector('main')?.innerText || document.body.innerText);
    const keys = [...new Set(text.match(KEY) || [])].filter(k => !/\.(com|ma|app|js|json|lic|png|csv|xlsx|docx|pdf|bpmn)$/.test(k));
    if (keys.length) issues.push({ type: 'rawkey', url: r, lang, msg: keys.slice(0, 12).join(' ') });
    if (out) { fs.mkdirSync(out, { recursive: true }); await page.screenshot({ path: `${out}/${lang}${r.replace(/\//g, '_') || '_home'}.png` }); }
  }
}
console.log(JSON.stringify({ routes: routes.length, issues }, null, 1));
await browser.close();
