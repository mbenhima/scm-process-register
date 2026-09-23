// Lists every literal passed to t('...') in the web sources and reports which ones are missing
// from each dictionary in server/src/i18n. Run: node scripts/i18n-check.mjs [--write-en]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dictDir = path.join(root, '..', 'server', 'src', 'i18n');
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(jsx?|mjs)$/.test(e.name)) files.push(p); });
walk(path.join(root, 'src'));
const keys = new Set();
const re = /\bt\(\s*(['"`])((?:\\.|(?!\1).)*?)\1/g;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(re)) if (!m[2].includes('${')) keys.add(m[2].replace(/\\'/g, "'").replace(/\\"/g, '"'));
  // literals inside t(...) expressions, e.g. t(done ? 'Completed' : 'Open')
  for (const m of src.matchAll(/\bt\(([^()]*\?[^()]*)\)/g)) for (const l of m[1].matchAll(/'((?:\\.|[^'])+)'/g)) keys.add(l[1].replace(/\\'/g, "'"));
  // label: '...' entries of static option/menu lists are translated where they are rendered
  for (const m of src.matchAll(/\b(?:label|group|title|hint|subtitle|text|name):\s*'((?:\\.|[^'])+)'/g)) keys.add(m[1].replace(/\\'/g, "'"));
}
const list = [...keys].filter((k) => /[A-Za-z]/.test(k)).sort();
if (process.argv.includes('--json')) { process.stdout.write(JSON.stringify(list, null, 1)); process.exit(0); }
for (const file of fs.readdirSync(dictDir).filter((f) => f.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(dictDir, file), 'utf8'));
  const missing = list.filter((k) => !(k in (d.strings || {})));
  console.log(`${file}: ${list.length - missing.length}/${list.length} strings${missing.length ? `, ${missing.length} missing` : ''}`);
}
