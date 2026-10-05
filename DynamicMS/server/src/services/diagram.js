// Diagrams for generated documents: BPMN-style swimlane flows (procedures, process sheets)
// and the process map. Diagrams are built as SVG from a small spec, then rasterized to PNG
// with a WebAssembly renderer (no native toolchain) for the PDF and Word outputs.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { C } from './render.js';

const require = createRequire(import.meta.url);
const fontFile = (pkg, file) => path.join(path.dirname(require.resolve(`@fontsource/${pkg}/package.json`)), 'files', file);

// WOFF 1.0 -> TrueType/OpenType (the renderer reads sfnt fonts only).
function woffToSfnt(buf) {
  const n = buf.readUInt16BE(12); const flavor = buf.readUInt32BE(4);
  const tables = [];
  for (let i = 0; i < n; i++) { const o = 44 + i * 20; tables.push({ tag: buf.readUInt32BE(o), off: buf.readUInt32BE(o + 4), comp: buf.readUInt32BE(o + 8), orig: buf.readUInt32BE(o + 12), cs: buf.readUInt32BE(o + 16) }); }
  const datas = tables.map(t => { const raw = buf.subarray(t.off, t.off + t.comp); return t.comp < t.orig ? zlib.inflateSync(raw) : raw; });
  let es = 1; while (es * 2 <= n) es *= 2;
  const hdr = Buffer.alloc(12 + 16 * n);
  hdr.writeUInt32BE(flavor, 0); hdr.writeUInt16BE(n, 4); hdr.writeUInt16BE(es * 16, 6); hdr.writeUInt16BE(Math.log2(es), 8); hdr.writeUInt16BE(n * 16 - es * 16, 10);
  let off = hdr.length; const parts = [hdr];
  tables.forEach((t, i) => { const o = 12 + i * 16; hdr.writeUInt32BE(t.tag, o); hdr.writeUInt32BE(t.cs, o + 4); hdr.writeUInt32BE(off, o + 8); hdr.writeUInt32BE(t.orig, o + 12); const pad = (4 - (t.orig % 4)) % 4; parts.push(datas[i], Buffer.alloc(pad)); off += t.orig + pad; });
  return Buffer.concat(parts);
}

let ready = null;
let resvg = null;
let fonts = null;
async function init() {
  if (!ready) ready = (async () => {
    resvg = await import('@resvg/resvg-wasm');
    const wasm = require.resolve('@resvg/resvg-wasm/index_bg.wasm');
    await resvg.initWasm(fs.readFileSync(wasm));
    fonts = [
      fontFile('open-sans', 'open-sans-latin-400-normal.woff'), fontFile('open-sans', 'open-sans-latin-700-normal.woff'),
      fontFile('noto-naskh-arabic', 'noto-naskh-arabic-arabic-400-normal.woff'), fontFile('noto-naskh-arabic', 'noto-naskh-arabic-arabic-700-normal.woff'),
    ].map(f => woffToSfnt(fs.readFileSync(f)));
  })();
  return ready;
}

export async function svgToPng(svg, zoom = 2) {
  await init();
  const r = new resvg.Resvg(svg, { font: { fontBuffers: fonts, loadSystemFonts: false, defaultFontFamily: 'Open Sans' }, fitTo: { mode: 'zoom', value: zoom } });
  return Buffer.from(r.render().asPng());
}

// Converts every diagram of a render model to PNG (call before toPdf / toDocx).
export async function materialize(model) {
  for (const sec of model.sections || []) for (const it of sec.items || []) if (it.type === 'diagram' && it.svg && !it.png) it.png = await svgToPng(it.svg);
  return model;
}

// ---------------------------------------------------------------- SVG helpers
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const AR = /[؀-ۿ]/;
const FONT = (s) => (AR.test(s) ? 'Noto Naskh Arabic, Open Sans' : 'Open Sans, Noto Naskh Arabic');
// Word wrap by an approximate average glyph width.
function wrap(text, maxW, size) {
  const cw = size * (AR.test(text) ? 0.5 : 0.52);
  const max = Math.max(4, Math.floor(maxW / cw));
  const lines = []; let cur = '';
  for (const w of String(text ?? '').split(/\s+/).filter(Boolean)) {
    const cand = cur ? `${cur} ${w}` : w;
    if (cand.length > max && cur) { lines.push(cur); cur = w; } else cur = cand;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}
function textBlock(text, cx, cy, maxW, { size = 11, bold = false, color = C.dark, maxLines = 4, anchor = 'middle' } = {}) {
  let lines = wrap(text, maxW, size);
  if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, '…'); }
  const lh = size * 1.2; const y0 = cy - ((lines.length - 1) * lh) / 2 + size * 0.35;
  return lines.map((l, i) => `<text x="${cx}" y="${y0 + i * lh}" text-anchor="${anchor}" font-family="${FONT(l)}" font-size="${size}" ${bold ? 'font-weight="700"' : ''} fill="${color}">${esc(l)}</text>`).join('');
}

// ---------------------------------------------------------------- BPMN swimlane
// spec: { lanes: [{ id, name }], nodes: [{ id, type: 'start'|'end'|'task'|'gateway'|'sub', lane, label, col? }],
//         flows: [{ from, to, label?, back? }], legend? }
export function bpmnSvg(spec) {
  const laneH = 96; const colW = 150; const laneLabelW = 120; const pad = 16; const taskW = 124; const taskH = 60;
  const lanes = spec.lanes.length ? spec.lanes : [{ id: '_', name: '' }];
  const laneIdx = Object.fromEntries(lanes.map((l, i) => [l.id, i]));
  let col = 0; const pos = {};
  for (const n of spec.nodes) { const c = n.col ?? col; pos[n.id] = { c, l: laneIdx[n.lane] ?? 0, n }; col = c + 1; }
  const cols = Math.max(...Object.values(pos).map(p => p.c)) + 1;
  const W = laneLabelW + pad * 2 + cols * colW; const poolBottom = 20 + lanes.length * laneH; const H = poolBottom + (spec.flows.some(f => f.back) ? 30 : 14);
  const cx = (p) => laneLabelW + pad + p.c * colW + colW / 2;
  const cy = (p) => 20 + p.l * laneH + laneH / 2;
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  out.push(`<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.ink}"/></marker></defs>`);
  out.push(`<rect width="${W}" height="${H}" fill="#FFFFFF"/>`);
  // pool and lanes
  out.push(`<rect x="4" y="20" width="${W - 8}" height="${lanes.length * laneH}" fill="none" stroke="${C.medium}" stroke-width="1.2"/>`);
  lanes.forEach((l, i) => {
    const y = 20 + i * laneH;
    out.push(`<rect x="4" y="${y}" width="${W - 8}" height="${laneH}" fill="${i % 2 ? C.light : '#FFFFFF'}" stroke="${C.line}"/>`);
    out.push(`<rect x="4" y="${y}" width="${laneLabelW - 4}" height="${laneH}" fill="${C.tint}" stroke="${C.line}"/>`);
    out.push(textBlock(l.name, 4 + (laneLabelW - 4) / 2, y + laneH / 2, laneLabelW - 16, { size: 10.5, bold: true, color: C.dark, maxLines: 5 }));
  });
  // flows (under the nodes)
  const edge = (p, dir) => {
    const t = p.n.type; const x = cx(p); const y = cy(p);
    const hw = t === 'task' || t === 'sub' ? taskW / 2 : t === 'gateway' ? 24 : 16; // start, end and link events: r = 16
    const hh = t === 'task' || t === 'sub' ? taskH / 2 : t === 'gateway' ? 24 : 16;
    return { r: [x + hw, y], l: [x - hw, y], t: [x, y - hh], b: [x, y + hh] }[dir];
  };
  for (const f of spec.flows) {
    const a = pos[f.from]; const b = pos[f.to]; if (!a || !b) continue;
    let d;
    if (f.back) {
      const s = edge(a, 'b'); const e = edge(b, 'b'); const yy = poolBottom + 14;
      d = `M${s[0]},${s[1]} L${s[0]},${yy} L${e[0]},${yy} L${e[0]},${e[1]}`;
    } else if (a.l === b.l) { const s = edge(a, 'r'); const e = edge(b, 'l'); d = `M${s[0]},${s[1]} L${e[0]},${e[1]}`; }
    else { const s = edge(a, 'r'); const e = edge(b, 'l'); const mx = e[0] - 14; d = `M${s[0]},${s[1]} L${mx},${s[1]} L${mx},${e[1]} L${e[0]},${e[1]}`; }
    out.push(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="1.3" ${f.back ? 'stroke-dasharray="5 3"' : ''} marker-end="url(#arr)"/>`);
    if (f.label) {
      const s = f.back ? edge(a, 'b') : edge(a, 'r');
      const lx = f.back ? s[0] + 6 : s[0] + 6; const ly = f.back ? poolBottom + 10 : s[1] - 6;
      out.push(`<text x="${lx}" y="${ly}" text-anchor="start" font-family="${FONT(f.label)}" font-size="9.5" font-weight="700" fill="${f.back ? '#B3261E' : C.deep}">${esc(f.label)}</text>`);
    }
  }
  // nodes
  for (const p of Object.values(pos)) {
    const x = cx(p); const y = cy(p); const n = p.n;
    if (n.type === 'start') { out.push(`<circle cx="${x}" cy="${y}" r="16" fill="#FFFFFF" stroke="#5AA469" stroke-width="2"/>`); }
    else if (n.type === 'end') { out.push(`<circle cx="${x}" cy="${y}" r="16" fill="#FFFFFF" stroke="#B3261E" stroke-width="4"/>`); }
    else if (n.type === 'link') {
      out.push(`<circle cx="${x}" cy="${y}" r="16" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="12.5" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.2"/>`);
      out.push(`<text x="${x}" y="${y + 4.5}" text-anchor="middle" font-family="Open Sans" font-size="12" font-weight="700" fill="${C.dark}">${esc(n.letter || 'A')}</text>`);
    }
    else if (n.type === 'gateway') {
      out.push(`<path d="M${x},${y - 24} L${x + 24},${y} L${x},${y + 24} L${x - 24},${y} z" fill="${C.tint}" stroke="${C.orange}" stroke-width="1.6"/>`);
      out.push(`<text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Open Sans" font-size="18" font-weight="700" fill="${C.deep}">×</text>`);
    } else {
      const sub = n.type === 'sub';
      out.push(`<rect x="${x - taskW / 2}" y="${y - taskH / 2}" width="${taskW}" height="${taskH}" rx="9" fill="${sub ? C.tint : '#FFFFFF'}" stroke="${sub ? C.deep : C.orange}" stroke-width="${sub ? 1.8 : 1.4}"/>`);
      if (sub) out.push(`<rect x="${x - 6}" y="${y + taskH / 2 - 13}" width="12" height="11" fill="none" stroke="${C.deep}"/><text x="${x}" y="${y + taskH / 2 - 4}" text-anchor="middle" font-size="10" font-family="Open Sans" fill="${C.deep}">+</text>`);
      if (n.code) out.push(`<text x="${x - taskW / 2 + 6}" y="${y - taskH / 2 + 11}" font-family="Open Sans" font-size="8.5" fill="${C.medium}">${esc(n.code)}</text>`);
    }
    if (n.type === 'task' || n.type === 'sub') out.push(textBlock(n.label, x, y + (n.code ? 4 : 0) - (n.type === 'sub' ? 5 : 0), taskW - 12, { size: 10, maxLines: n.type === 'sub' ? 3 : 4 }));
    else if (n.label) out.push(textBlock(n.label, x, y + (n.type === 'gateway' ? -36 : 30), colW - 14, { size: 9.5, bold: n.type === 'gateway', color: n.type === 'gateway' ? C.deep : C.ink, maxLines: 2 }));
  }
  out.push('</svg>');
  return { svg: out.join(''), width: W, height: H };
}

// ---------------------------------------------------------------- Process map
// spec: { left, right, groups: [{ name, items: [label] }] } — management, core, support bands
export function processMapSvg(spec) {
  const W = 980; const sideW = 110; const inner = W - sideW * 2 - 40;
  const bands = spec.groups.map(g => 40 + Math.ceil(Math.min(12, g.items.length) / 6) * 56);
  const H = bands.reduce((a, b) => a + b + 14, 0) + 16;
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>`];
  out.push(`<defs><marker id="big" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${C.orange}"/></marker></defs>`);
  // side arrows (customer requirements -> satisfaction)
  const side = (x, label) => { out.push(`<rect x="${x}" y="15" width="${sideW - 10}" height="${H - 30}" rx="10" fill="${C.tint}" stroke="${C.orange}"/>`); out.push(textBlock(label, x + (sideW - 10) / 2, H / 2, sideW - 24, { size: 11, bold: true, color: C.deep, maxLines: 6 })); };
  side(10, spec.left); side(W - sideW, spec.right);
  let yAcc = 15;
  spec.groups.forEach((g, gi) => {
    const bandH = bands[gi]; const y = yAcc; yAcc += bandH + 14; const x = sideW + 10;
    const fill = gi === 1 ? '#FFF7EC' : C.light;
    out.push(`<rect x="${x}" y="${y}" width="${inner + 20}" height="${bandH}" rx="10" fill="${fill}" stroke="${gi === 1 ? C.orange : C.line}" stroke-width="${gi === 1 ? 1.6 : 1}"/>`);
    out.push(textBlock(g.name, x + 12, y + 14, inner, { size: 12, bold: true, color: C.dark, anchor: 'start', maxLines: 1 }));
    const items = g.items.slice(0, 12); const per = Math.min(6, Math.max(1, items.length)); const rows = Math.ceil(items.length / per);
    const bw = (inner - (per - 1) * 10) / per; const bh = 48;
    items.forEach((it, i) => {
      const r = Math.floor(i / per); const c = i % per;
      const bx = x + 10 + c * (bw + 10); const by = y + 28 + r * (bh + 8);
      if (gi === 1) out.push(`<path d="M${bx},${by} L${bx + bw - 12},${by} L${bx + bw},${by + bh / 2} L${bx + bw - 12},${by + bh} L${bx},${by + bh} L${bx + 12},${by + bh / 2} z" fill="#FFFFFF" stroke="${C.orange}" stroke-width="1.3"/>`);
      else out.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="7" fill="#FFFFFF" stroke="${C.medium}"/>`);
      out.push(textBlock(it, bx + bw / 2, by + bh / 2, bw - 26, { size: 9.5, maxLines: 3 }));
    });
  });
  out.push('</svg>');
  return { svg: out.join(''), width: W, height: H };
}

// ---------------------------------------------------------------- BPMN, vertical swimlanes
// Same spec as bpmnSvg; lanes are columns and the flow goes down, which fits portrait pages.
export function bpmnSvgVertical(spec) {
  const lanes = spec.lanes.length ? spec.lanes : [{ id: '_', name: '' }];
  const laneW = lanes.length <= 3 ? 190 : lanes.length <= 4 ? 165 : 140; const headH = 42; const rowH = 68; const taskW = laneW - 34; const taskH = 50;
  const laneIdx = Object.fromEntries(lanes.map((l, i) => [l.id, i]));
  let row = 0; const pos = {};
  for (const n of spec.nodes) { const r = n.row ?? row; pos[n.id] = { r, l: laneIdx[n.lane] ?? 0, n }; row = r + 1; }
  const rows = Math.max(...Object.values(pos).map(p => p.r)) + 1;
  const hasBack = spec.flows.some(f => f.back);
  const W = lanes.length * laneW + 8 + (hasBack ? 40 : 0); const poolH = headH + rows * rowH; const H = poolH + 12;
  const cx = (p) => 4 + p.l * laneW + laneW / 2;
  const cy = (p) => 4 + headH + p.r * rowH + rowH / 2;
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`];
  out.push(`<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.ink}"/></marker></defs>`);
  out.push(`<rect width="${W}" height="${H}" fill="#FFFFFF"/>`);
  lanes.forEach((l, i) => {
    const x = 4 + i * laneW;
    out.push(`<rect x="${x}" y="4" width="${laneW}" height="${poolH}" fill="${i % 2 ? C.light : '#FFFFFF'}" stroke="${C.line}"/>`);
    out.push(`<rect x="${x}" y="4" width="${laneW}" height="${headH}" fill="${C.tint}" stroke="${C.line}"/>`);
    out.push(textBlock(l.name, x + laneW / 2, 4 + headH / 2, laneW - 14, { size: 11, bold: true, color: C.dark, maxLines: 2 }));
  });
  out.push(`<rect x="4" y="4" width="${lanes.length * laneW}" height="${poolH}" fill="none" stroke="${C.medium}" stroke-width="1.2"/>`);
  const half = (p) => { const t = p.n.type; return t === 'task' || t === 'sub' ? [taskW / 2, taskH / 2] : t === 'gateway' ? [24, 24] : [16, 16]; };
  const pt = (p, dir) => { const [hw, hh] = half(p); const x = cx(p); const y = cy(p); return { t: [x, y - hh], b: [x, y + hh], l: [x - hw, y], r: [x + hw, y] }[dir]; };
  const edgeX = lanes.length * laneW + 4;
  for (const f of spec.flows) {
    const a = pos[f.from]; const b = pos[f.to]; if (!a || !b) continue;
    let d; let lab = null;
    if (f.back) {
      const s = pt(a, 'r'); const e = pt(b, 'r'); const xx = edgeX + 20;
      d = `M${s[0]},${s[1]} L${xx},${s[1]} L${xx},${e[1]} L${e[0]},${e[1]}`; lab = [s[0] + 6, s[1] - 6, '#B3261E'];
    } else if (a.l === b.l) { const s = pt(a, 'b'); const e = pt(b, 't'); d = `M${s[0]},${s[1]} L${e[0]},${e[1]}`; lab = [s[0] + 6, s[1] + 13, C.deep]; }
    else { const s = pt(a, 'b'); const e = pt(b, 't'); const my = (s[1] + e[1]) / 2; d = `M${s[0]},${s[1]} L${s[0]},${my} L${e[0]},${my} L${e[0]},${e[1]}`; lab = [s[0] + 6, s[1] + 13, C.deep]; }
    out.push(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="1.3" ${f.back ? 'stroke-dasharray="5 3"' : ''} marker-end="url(#arr)"/>`);
    if (f.label) out.push(`<text x="${lab[0]}" y="${lab[1]}" font-family="${FONT(f.label)}" font-size="10" font-weight="700" fill="${lab[2]}">${esc(f.label)}</text>`);
  }
  for (const p of Object.values(pos)) {
    const x = cx(p); const y = cy(p); const n = p.n;
    if (n.type === 'start') out.push(`<circle cx="${x}" cy="${y}" r="16" fill="#FFFFFF" stroke="#5AA469" stroke-width="2"/>`);
    else if (n.type === 'end') out.push(`<circle cx="${x}" cy="${y}" r="16" fill="#FFFFFF" stroke="#B3261E" stroke-width="4"/>`);
    else if (n.type === 'link') out.push(`<circle cx="${x}" cy="${y}" r="16" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="12.5" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.2"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-family="Open Sans" font-size="12" font-weight="700" fill="${C.dark}">${esc(n.letter || 'A')}</text>`);
    else if (n.type === 'gateway') out.push(`<path d="M${x},${y - 24} L${x + 24},${y} L${x},${y + 24} L${x - 24},${y} z" fill="${C.tint}" stroke="${C.orange}" stroke-width="1.6"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Open Sans" font-size="18" font-weight="700" fill="${C.deep}">×</text>`);
    else {
      const sub = n.type === 'sub';
      out.push(`<rect x="${x - taskW / 2}" y="${y - taskH / 2}" width="${taskW}" height="${taskH}" rx="9" fill="${sub ? C.tint : '#FFFFFF'}" stroke="${sub ? C.deep : C.orange}" stroke-width="${sub ? 1.8 : 1.4}"/>`);
      if (sub) out.push(`<rect x="${x - 6}" y="${y + taskH / 2 - 13}" width="12" height="11" fill="none" stroke="${C.deep}"/><text x="${x}" y="${y + taskH / 2 - 4}" text-anchor="middle" font-size="10" font-family="Open Sans" fill="${C.deep}">+</text>`);
      if (n.code) out.push(`<text x="${x - taskW / 2 + 6}" y="${y - taskH / 2 + 11}" font-family="Open Sans" font-size="9" fill="${C.medium}">${esc(n.code)}</text>`);
      out.push(textBlock(n.label, x, y + (n.code ? 5 : 0) - (sub ? 5 : 0), taskW - 12, { size: 10.5, maxLines: 3 }));
    }
    if (n.type === 'gateway' && n.label) out.push(textBlock(n.label, x - 30, y + 4, laneW / 2 - 12, { size: 9.5, bold: true, color: C.deep, anchor: 'end', maxLines: 2 }));
    else if (['start', 'end'].includes(n.type) && n.label) out.push(textBlock(n.label, x + 22, y + 4, laneW / 2 - 6, { size: 9.5, color: C.ink, anchor: 'start', maxLines: 2 }));
  }
  out.push('</svg>');
  return { svg: out.join(''), width: W, height: H };
}
