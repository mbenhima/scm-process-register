// Office Open XML packages that open without a repair prompt (FR-DA-DOC-12): every generated
// Word, Excel and PowerPoint file is rewritten without directory entries and checked — content
// types declared, every XML part well-formed, every internal relationship resolved, shape and
// drawing identifiers unique, every chart axis referenced by a series declared.
import JSZip from 'jszip';
import { SaxesParser } from 'saxes';

const isXml = (n) => /\.(xml|rels|vml)$/i.test(n);

/**
 * Rebuilds the package so that it opens without repair: file entries only (no directory
 * entries), [Content_Types].xml first and without overrides of missing parts, shape ids
 * renumbered uniquely on each slide, and chart axis references limited to declared axes.
 */
export async function cleanPackage(buf) {
  const src = await JSZip.loadAsync(buf);
  const out = new JSZip();
  const names = Object.keys(src.files).filter(n => !src.files[n].dir && !n.endsWith('/'));
  names.sort((a, b) => (a === '[Content_Types].xml' ? -1 : b === '[Content_Types].xml' ? 1 : 0));
  const present = new Set(names);
  for (const n of names) {
    let data = await src.files[n].async(isXml(n) ? 'string' : 'uint8array');
    if (n === '[Content_Types].xml') data = data.replace(/<Override\b[^>]*PartName="\/([^"]+)"[^>]*\/>/g, (m, part) => (present.has(part) ? m : ''));
    else if (/^ppt\/(slides|slideLayouts|slideMasters)\/[^/]+\.xml$/.test(n)) { let k = 0; data = data.replace(/(<p:cNvPr\b[^>]*?\sid=")(\d+)(")/g, (m, a, id, c) => `${a}${++k}${c}`); }
    else if (/\/charts\/chart[^/]*\.xml$/.test(n)) {
      const declared = new Set([...data.matchAll(/<c:(valAx|catAx|dateAx|serAx)>[\s\S]*?<c:axId val="(\d+)"/g)].map(m => m[2]));
      data = data.replace(/<c:(barChart|lineChart|areaChart|scatterChart|radarChart|bubbleChart|stockChart)>([\s\S]*?)<\/c:\1>/g, (m, tag, body) => `<c:${tag}>${body.replace(/<c:axId val="(\d+)"\/>/g, (x, id) => (declared.has(id) ? x : ''))}</c:${tag}>`);
    }
    out.file(n, data, { createFolders: false, date: new Date('2026-01-01T00:00:00Z') });
  }
  return out.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: 'application/zip' });
}

function wellFormed(text) {
  const p = new SaxesParser({ xmlns: false });
  let err = null;
  p.on('error', (e) => { err = err || e.message; });
  try { p.write(text).close(); } catch (e) { err = err || e.message; }
  return err;
}
const attrs = (text, tag, attr) => [...text.matchAll(new RegExp(`<${tag}\\b[^>]*\\s${attr}="([^"]*)"`, 'g'))].map(m => m[1]);
const dirOf = (n) => n.slice(0, n.lastIndexOf('/') + 1);
function resolve(base, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = (base + target).split('/');
  const out = [];
  for (const p of parts) { if (p === '..') out.pop(); else if (p !== '.') out.push(p); }
  return out.join('/');
}

/** Checks a package; returns { ok, errors: [string], parts }. */
export async function checkPackage(buf) {
  const errors = [];
  const zip = await JSZip.loadAsync(buf);
  const all = Object.keys(zip.files);
  const dirs = all.filter(n => zip.files[n].dir || n.endsWith('/'));
  if (dirs.length) errors.push(`directory entries: ${dirs.slice(0, 5).join(', ')}`);
  const files = all.filter(n => !zip.files[n].dir && !n.endsWith('/'));
  const text = {};
  for (const n of files.filter(isXml)) text[n] = await zip.files[n].async('string');
  const ct = text['[Content_Types].xml'];
  if (!ct) errors.push('[Content_Types].xml missing');
  else {
    const defaults = new Set(attrs(ct, 'Default', 'Extension').map(x => x.toLowerCase()));
    const overrides = new Set(attrs(ct, 'Override', 'PartName').map(x => x.replace(/^\//, '')));
    for (const n of files) {
      if (n === '[Content_Types].xml') continue;
      const ext = n.split('.').pop().toLowerCase();
      if (!defaults.has(ext) && !overrides.has(n)) errors.push(`no content type for ${n}`);
    }
    for (const o of overrides) if (!files.includes(o)) errors.push(`content type declared for a missing part ${o}`);
  }
  for (const [n, t] of Object.entries(text)) { const e = wellFormed(t); if (e) errors.push(`${n} is not well-formed: ${e}`); }
  // Relationships: every internal target exists.
  for (const n of files.filter(x => x.endsWith('.rels'))) {
    const source = n.replace(/_rels\/([^/]+)\.rels$/, '$1');
    const base = n === '_rels/.rels' ? '' : dirOf(source);
    for (const m of text[n].matchAll(/<Relationship\b([^>]*)\/?>/g)) {
      const a = m[1];
      if (/TargetMode="External"/.test(a)) continue;
      const target = (a.match(/Target="([^"]*)"/) || [])[1];
      if (!target) continue;
      const p = resolve(base, decodeURIComponent(target));
      if (!files.includes(p)) errors.push(`${n}: relationship target ${target} not found`);
    }
  }
  // Shapes of a slide and drawings of a document part: unique identifiers.
  for (const [n, t] of Object.entries(text)) {
    if (/^ppt\/(slides|slideLayouts|slideMasters)\/[^/]+\.xml$/.test(n)) {
      const ids = attrs(t, 'p:cNvPr', 'id'); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      if (dup.length) errors.push(`${n}: duplicate shape ids ${[...new Set(dup)].join(', ')}`);
    }
    if (/^word\/(document|header\d*|footer\d*)\.xml$/.test(n)) {
      const ids = attrs(t, 'wp:docPr', 'id'); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      if (dup.length) errors.push(`${n}: duplicate drawing ids ${[...new Set(dup)].join(', ')}`);
    }
    if (/\/charts\/chart[^/]*\.xml$/.test(n)) {
      const declared = new Set([...t.matchAll(/<c:(valAx|catAx|dateAx|serAx)>[\s\S]*?<c:axId val="(\d+)"/g)].map(m => m[2]));
      const plots = [...t.matchAll(/<c:(barChart|lineChart|areaChart|scatterChart|radarChart|bubbleChart|bar3DChart|line3DChart|area3DChart|stockChart|surfaceChart)>([\s\S]*?)<\/c:\1>/g)];
      for (const pm of plots) for (const ax of pm[2].matchAll(/<c:axId val="(\d+)"/g)) if (!declared.has(ax[1])) errors.push(`${n}: axis ${ax[1]} referenced but not declared`);
    }
  }
  return { ok: !errors.length, errors, parts: files.length };
}

/** Cleans then checks; returns the clean buffer, or throws listing what would trigger a repair. */
export async function safePackage(buf) {
  const clean = await cleanPackage(buf);
  const r = await checkPackage(clean);
  if (!r.ok) {
    const e = new Error(`Generated Office file failed its check: ${r.errors.slice(0, 5).join('; ')}`);
    e.ooxml = r.errors;
    throw e;
  }
  return clean;
}
