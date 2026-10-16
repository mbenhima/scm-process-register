// Design-token check (NFR-DA-VDS-01): no raw color value outside the token file. Fails the
// build when a stylesheet or a component writes a hex, rgb() or hsl() color of its own.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'src');
const TOKEN_FILE = path.join(root, 'styles', 'tokens.css');
const RAW = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g;
// Values that are data, not interface colors: charts and documents receive the palette from
// the server, and SVG ids or anchors are not colors.
const ALLOW = [/href="#/, /url\(#/, /['"]#['"]/, /#[0-9a-fA-F]{3,8}\b(?=['"]?\s*[:,]?\s*\/\/\s*data)/];
const bad = [];
const walk = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!/\.(css|jsx?|tsx?)$/.test(f.name) || p === TOKEN_FILE || /dict\d*\.js$/.test(f.name)) continue;
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line) || line.includes('tokens-allow')) return;
      const hits = (line.match(RAW) || []).filter(h => !ALLOW.some(a => a.test(line)) && !/^#[0-9]+$/.test(h) && !/^#(?:[0-9]{3,8})$/.test(h));
      if (hits.length) bad.push(`${path.relative(root, p)}:${i + 1}: ${hits.join(', ')}`);
    });
  }
};
walk(root);
if (bad.length) { console.error(`Raw colors outside ${path.relative(root, TOKEN_FILE)} (use a --aiv- token):\n${bad.join('\n')}`); process.exit(1); }
console.log('Design tokens: no raw color outside the token file.');
