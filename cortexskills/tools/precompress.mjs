// Writes a Brotli (.br) and a gzip (.gz) copy next to every compressible file of the built web client, at the highest
// levels: the server sends these copies as they are (no compression work per request). Usage: node precompress.mjs <dist>
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
const dir = path.resolve(process.argv[2] || 'dist');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
let n = 0, before = 0, after = 0;
for (const f of walk(dir)) {
  if (!/\.(js|css|html|svg|json|txt|ttf|eot|map)$/.test(f) || /\.(br|gz)$/.test(f)) continue;
  const buf = fs.readFileSync(f); if (buf.length < 1024) continue;
  const br = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
  const gz = zlib.gzipSync(buf, { level: 9 });
  fs.writeFileSync(f + '.br', br); fs.writeFileSync(f + '.gz', gz); n++; before += buf.length; after += br.length;
}
console.log(`precompressed ${n} files: ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB (Brotli)`);
