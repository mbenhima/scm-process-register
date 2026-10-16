// Screenshots of an installed Docker package for the French installation guides: the sign-in page (no demonstration
// account named), the configuration and licence page, the packs without prices, the pricing page unavailable
// (customer edition) and the reference organizations seen by the platform administrator.
// Usage: node shoot-docker.mjs <baseUrl> <outDir> <customer admin e-mail> <password> <platform admin e-mail> <password>
import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW || 'playwright');
const [base, out, cEmail, cPass, pEmail, pPass] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const session = async (email, pass) => {
  const ctx = await b.newContext({ viewport: { width: 1360, height: 860 }, locale: 'fr-FR', ignoreHTTPSErrors: true }); const p = await ctx.newPage();
  await p.goto(base + '/login'); await p.evaluate(() => localStorage.setItem('cs.lang', 'fr')); await p.reload(); await p.waitForLoadState('networkidle');
  if (!email) return p;
  await p.fill('input[type=email]', email); await p.fill('input[type=password]', pass); await p.click('button[type=submit]');
  await p.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 }); return p;
};
const go = async (p, url, name, wait = 1500) => { await p.goto(base + url); await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(wait); await p.screenshot({ path: `${out}/${name}.png` }); };
{ const p = await session(); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/01_connexion.png` }); }
{ const p = await session(cEmail, cPass);
  await go(p, '/admin/config', '02_licence');
  await p.locator('h2, h3', { hasText: 'Packs' }).first().scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/03_packs_sans_prix.png` });
  await go(p, '/admin/pricing', '04_tarifs_indisponibles'); }
if (pEmail) { const p = await session(pEmail, pPass); await go(p, '/tenancy', '05_organisations_reference', 2500); }
console.log('shots', fs.readdirSync(out).length); await b.close();
