// Token check (NFR-DA-VDS-01): no raw colour value outside src/styles/tokens.css. Run: npm run check:tokens (also in CI).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const RAW = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b(?![-\w])|\b(?:rgba?|hsla?)\(/g;
const bad = [];
const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(jsx?|css)$/.test(f) && !p.endsWith(path.join('styles', 'tokens.css'))) {
  fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => { const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, ''); for (const m of code.matchAll(RAW)) bad.push(`${path.relative(root, p)}:${i + 1}  ${m[0]}  ${line.trim().slice(0, 100)}`); }); } } };
walk(root);
if (bad.length) { console.error(`Raw colour values outside tokens.css (${bad.length}):\n` + bad.join('\n')); process.exit(1); }
console.log('Token check passed: no raw colour outside src/styles/tokens.css.');
