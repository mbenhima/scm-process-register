// Builds the runtime of CortexSkills without readable source code: every server JavaScript file is minified (names
// shortened, comments and formatting removed) in place of the original, the folder layout is kept so the runtime finds
// its data files, and the built web client is copied as is (already minified by Vite, no source maps).
// Excluded: tests, the vendor signing tool and keys, translation sources, data, settings, dependencies (npm ci).
// Edition "customer" also removes every price from the reference catalog (no commercial content in the database): prices,
// price rules, packaging rules and the priced licensing text of the modules.
// Usage: node tools/build-runtime.mjs <outDir> [customer|editor]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'web', 'package.json'));
const esbuild = require('esbuild');
const [out, edition = 'customer'] = process.argv.slice(2);
if (!out) { console.error('Usage: node tools/build-runtime.mjs <outDir> [customer|editor]'); process.exit(1); }
const SRV = path.join(ROOT, 'server'); const DST = path.join(out, 'server');
const SKIP = [/^node_modules\//, /^data\//, /^test\//, /^tools\/keys\//, /^tools\/sign-licence\.js$/, /^i18n\/src\//, /^\.env/, /\.log$/, /^\.?coverage\//];
const PRICE_KEYS = new Set(['price', 'priceDetail', 'priceRule', 'overage', 'list', 'discount', 'listPrice', 'priceText']);
const strip = x => (Array.isArray(x) ? x.map(strip) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).filter(([k]) => !PRICE_KEYS.has(k)).map(([k, v]) => [k, strip(v)])) : x);

let js = 0, other = 0, bytesIn = 0, bytesOut = 0;
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
for (const f of walk(SRV)) {
  const rel = path.relative(SRV, f).split(path.sep).join('/');
  if (SKIP.some(r => r.test(rel))) continue;
  const to = path.join(DST, rel); fs.mkdirSync(path.dirname(to), { recursive: true });
  if (/\.(m?js)$/.test(rel)) {
    const src = fs.readFileSync(f, 'utf8'); const shebang = src.startsWith('#!') ? src.slice(0, src.indexOf('\n') + 1) : '';
    const r = esbuild.transformSync(shebang ? src.slice(shebang.length) : src, { loader: 'js', format: 'esm', target: 'node22', platform: 'node', minify: true, treeShaking: true, drop: ['debugger'], legalComments: 'none', charset: 'utf8' });
    fs.writeFileSync(to, shebang + r.code); js++; bytesIn += src.length; bytesOut += r.code.length;
  } else if (rel === 'i18n/dictionary.json') {
    // Delivered runtimes name no demonstration account anywhere (the sign-in hint is removed from the dictionary).
    const dct = JSON.parse(fs.readFileSync(f, 'utf8')); delete dct['login.demo'];
    fs.writeFileSync(to, JSON.stringify(dct)); other++;
  } else if (edition === 'customer' && rel === 'seed/data/catalog.json') {
    const c = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const k of ['packs', 'bundles', 'addOns', 'smePacks']) if (c[k]) c[k] = strip(c[k]);
    // No sales rule and no price in the module licensing text: the packaging rules go, a module shows its tier only.
    c.packagingRules = [];
    for (const m of c.modules || []) { m.Licensing_Model = m.Tier; m.Rate_Limit = String(m.Rate_Limit || '').replace(/ ?\(\$[^)]*\)/g, ''); }
    fs.writeFileSync(to, JSON.stringify(c)); other++;
  } else if (edition === 'customer' && rel === 'seed/content/framework.json') {
    const c = JSON.parse(fs.readFileSync(f, 'utf8')); c.smePacks = strip(c.smePacks || []);
    fs.writeFileSync(to, JSON.stringify(c)); other++;
  } else { fs.copyFileSync(f, to); other++; }
}
// Edition marker read by the server (config.js): a delivered runtime is always on-premises, and the customer edition never
// shows commercial information.
fs.writeFileSync(path.join(DST, 'edition.json'), JSON.stringify({ edition, deploymentMode: 'onprem', commercialInfo: edition === 'customer' ? 'hidden' : 'shown' }));
// The built web client (npm run build in web/ before).
const dist = path.join(ROOT, 'web', 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error('Build the web client first: cd web && npm run build'); process.exit(1); }
fs.cpSync(dist, path.join(out, 'web', 'dist'), { recursive: true });
const maps = walk(path.join(out, 'web', 'dist')).filter(f => f.endsWith('.map')); for (const m of maps) fs.rmSync(m);
// Nothing readable left behind: no test, no signing tool, no private key, no source map.
const all = walk(out).map(f => path.relative(out, f));
const bad = all.filter(f => /(^|\/)test\/|sign-licence|vendor-private|\.map$/.test(f));
if (/Admin#2026|CortexSkills#2026/.test(fs.readFileSync(path.join(out, 'server/i18n/dictionary.json'), 'utf8'))) bad.push('demonstration password in the dictionary');
if (bad.length) { console.error('Unexpected files in the runtime:', bad); process.exit(1); }
console.log(`runtime (${edition}): ${js} JavaScript files minified (${Math.round(bytesIn / 1024)} KB → ${Math.round(bytesOut / 1024)} KB), ${other} data files, web client copied → ${out}`);
