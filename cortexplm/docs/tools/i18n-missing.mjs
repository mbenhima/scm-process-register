// Lists user-facing strings of the web client (t('...') calls and the label data files) and server messages
// that are missing from the French or Arabic dictionary. Usage: node docs/tools/i18n-missing.mjs [out.json]
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const keys = new Set();
const lit = /(?<![\w$])t\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
for (const f of walk(path.join(root, 'web/src')).filter((f) => /\.(jsx?|mjs)$/.test(f))) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(lit)) if (!m[2].includes('${')) keys.add(m[2].replace(/\\'/g, "'").replace(/\\"/g, '"'));
  // label data: label: '...', group: '...', and array tuples in data modules
  if (/navModel|decisionMatrix|Tenancy|Bpmn|Library|Attachments|Portfolio/.test(f)) {
    for (const m of s.matchAll(/(?:label|group|title|description):\s*(['"])((?:\\.|(?!\1).)*)\1/g)) keys.add(m[2].replace(/\\'/g, "'"));
    for (const m of s.matchAll(/levels:\s*\[([^\]]*)\]/g)) for (const x of m[1].matchAll(/(['"])((?:\\.|(?!\1).)*)\1/g)) keys.add(x[2].replace(/\\'/g, "'"));
  }
}
// Server-side data shown to users
const srv = ['server/src/routes/portfolio.js', 'server/src/lib/ai.js', 'server/src/routes/projects.js', 'server/src/lib/lifecycle.js', 'server/src/routes/admin.js', 'server/src/routes/intelligence.js'];
for (const f of srv) {
  const s = fs.readFileSync(path.join(root, f), 'utf8');
  for (const m of s.matchAll(/(?:key|description|label|reason):\s*'((?:\\.|[^'])*)'/g)) keys.add(m[1].replace(/\\'/g, "'"));
  for (const m of s.matchAll(/(?:AppError\(\d+,\s*|new Error\(|badRequest\(|notFound\()'((?:\\.|[^'])*)'/g)) keys.add(m[1].replace(/\\'/g, "'"));
}
for (const x of ['Documents', 'Spreadsheets', 'Presentations', 'Images', 'Drawings & CAD', 'Data & models', 'Archives', 'Audio & video', 'E-mails']) keys.add(x);
const dict = (l) => JSON.parse(fs.readFileSync(path.join(root, `server/src/i18n/${l}.json`), 'utf8')).strings;
const fr = dict('fr'); const ar = dict('ar');
const missing = [...keys].filter((k) => k && k.length > 1 && /[A-Za-z]/.test(k) && (!fr[k] || !ar[k])).sort();
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(missing, null, 1));
console.log(`${keys.size} strings, ${missing.length} missing in fr or ar`);
