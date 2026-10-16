// Builds the production runtime of one edition (customer or editor) into runtime/out/<edition>:
//   server/app.cjs   the server bundled, tree-shaken and minified into one CommonJS file; the
//                    Docker build compiles it to V8 bytecode (app.jsc) and deletes it, so no
//                    JavaScript of the application reaches the image;
//   server/package.json, server/package-lock.json   third-party dependencies only;
//   web/dist         the web client minified (JavaScript and CSS), split into chunks loaded on
//                    demand, no source maps, with gzip and Brotli copies of the text assets.
// Usage: node build.mjs customer|editor
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import zlib from 'node:zlib';

const edition = process.argv[2];
if (!['customer', 'editor'].includes(edition)) { console.error('Usage: node build.mjs customer|editor'); process.exit(1); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out', edition);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'server'), { recursive: true });
const publicKey = fs.readFileSync(path.join(HERE, 'keys', 'editor-licence-public.pem'), 'utf8');

// ---- 1. Server: one minified CommonJS bundle of the application code (dependencies stay external).
const embedSources = {
  name: 'embed-catalog-sources',
  setup(b) {
    b.onResolve({ filter: /\/sources\.js$/ }, (a) => (a.importer.includes(`${path.sep}catalog${path.sep}`) ? { path: path.join(path.dirname(a.importer), 'sources.embedded.js') } : undefined));
  },
};
await esbuild.build({
  entryPoints: [path.join(ROOT, 'server', 'src', 'index.js')],
  outfile: path.join(OUT, 'server', 'app.cjs'),
  bundle: true, platform: 'node', target: 'node22', format: 'cjs', packages: 'external',
  minify: true, keepNames: true, treeShaking: true, drop: ['debugger'], sourcemap: false, legalComments: 'none', charset: 'utf8', logLevel: 'warning',
  loader: { '.json': 'json' },
  define: { __EDITION__: JSON.stringify(edition), __LICENCE_PUBLIC_KEY__: JSON.stringify(publicKey), 'import.meta.url': '__runtimeUrl' },
  banner: { js: 'const __runtimeUrl = require("node:url").pathToFileURL(__filename).href;' },
  plugins: [embedSources],
});
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'package.json'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'server', 'package.json'), JSON.stringify({ name: 'dynamicms', version: '2026.10.0', private: true, dependencies: pkg.dependencies }, null, 2));
fs.copyFileSync(path.join(ROOT, 'server', 'package-lock.json'), path.join(OUT, 'server', 'package-lock.json'));

// ---- 2. Web client: minified production build.
const webOut = path.join(OUT, 'web', 'dist');
execFileSync(process.execPath, [path.join(ROOT, 'web', 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--logLevel', 'warn'], {
  cwd: path.join(ROOT, 'web'), stdio: 'inherit', env: { ...process.env, RUNTIME_BUILD: '1', RUNTIME_OUT: webOut, BUILD_EDITION: edition },
});
const assets = path.join(webOut, 'assets');
for (const f of fs.readdirSync(assets).filter(n => n.endsWith('.map'))) fs.rmSync(path.join(assets, f));
// Pre-compressed copies (Brotli, gzip) of the text assets, served as they are by the server.
for (const f of fs.readdirSync(assets).filter(n => /\.(js|css|svg|json)$/.test(n))) {
  const buf = fs.readFileSync(path.join(assets, f));
  if (buf.length < 1024) continue;
  fs.writeFileSync(path.join(assets, f + '.gz'), zlib.gzipSync(buf, { level: 9 }));
  fs.writeFileSync(path.join(assets, f + '.br'), zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }));
}
const size = (d) => fs.readdirSync(d, { recursive: true }).reduce((a, f) => { const p = path.join(d, f); return a + (fs.statSync(p).isFile() ? fs.statSync(p).size : 0); }, 0);
console.log(`runtime/${edition}: server bundle ${(fs.statSync(path.join(OUT, 'server', 'app.cjs')).size / 1e6).toFixed(1)} MB, web ${(size(webOut) / 1e6).toFixed(1)} MB`);
