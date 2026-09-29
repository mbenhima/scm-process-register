// Merges i18n/src/*.json ({key: [en, fr, ar]}) into i18n/dictionary.json ({key: {en, fr, ar}}).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = {}; const dup = [];
for (const f of fs.readdirSync(path.join(dir, 'src')).filter(f => f.endsWith('.json')).sort()) {
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(dir, 'src', f), 'utf8')))) {
    if (out[k]) dup.push(k);
    out[k] = Array.isArray(v) ? { en: v[0], fr: v[1] || v[0], ar: v[2] || v[0] } : v;
  }
}
fs.writeFileSync(path.join(dir, 'dictionary.json'), JSON.stringify(out));
console.log(`i18n: ${Object.keys(out).length} keys${dup.length ? `, ${dup.length} duplicate(s): ${dup.slice(0, 10).join(', ')}` : ''}`);
