// Renders Lucide line icons as brand icon badges (white glyph centred on a solid
// orange or grey-ink circle, glyph at ~52% of the diameter) for the slide decks.
// Usage: node tools/icons.mjs <outDir> name1 name2 ...
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js'));
const { chromium } = require('playwright');
const [outDir, ...names] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const ICONS = path.join(here, '..', 'web', 'node_modules', 'lucide-react', 'dist', 'esm', 'icons');

function svgOf(name) {
  let src = fs.readFileSync(path.join(ICONS, `${name}.js`), 'utf8');
  const alias = src.match(/export \{ default \} from '\.\/([\w-]+)\.js'/);
  if (alias) src = fs.readFileSync(path.join(ICONS, `${alias[1]}.js`), 'utf8');
  const arr = src.match(/createLucideIcon\("[^"]+",\s*(\[[\s\S]*?\])\);/)[1];
  const nodes = Function(`return ${arr}`)();
  const inner = nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
for (const name of names) {
  for (const [variant, color] of [['orange', '#F8931D'], ['grey', '#58595B']]) {
    await page.setContent(`<html><body style="margin:0;background:transparent"><div id="b" style="width:256px;height:256px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center"><div style="width:52%;height:52%">${svgOf(name).replace('<svg ', '<svg width="100%" height="100%" ')}</div></div></body></html>`);
    await page.locator('#b').screenshot({ path: path.join(outDir, `${name}-${variant}.png`), omitBackground: true });
  }
}
await browser.close();
console.log('icons', names.length * 2, '->', outDir);
