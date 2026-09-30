// Renders a report model to PDF, XLSX, DOCX or CSV with the application's visual
// identity (light page, orange table headers, serif titles, sans body) and full
// Arabic right-to-left support (NFR-DA-UX, NFR-DA-I18N, FR-DA-REP-02/04).
import path from 'node:path';
import { createRequire } from 'node:module';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import * as docx from 'docx';

const require = createRequire(import.meta.url);
const fontFile = (pkg, file) => path.join(path.dirname(require.resolve(`@fontsource/${pkg}/package.json`)), 'files', file);
const FONTS = {
  sans: fontFile('source-sans-3', 'source-sans-3-latin-400-normal.woff'),
  sansBold: fontFile('source-sans-3', 'source-sans-3-latin-700-normal.woff'),
  sansItalic: fontFile('source-sans-3', 'source-sans-3-latin-400-italic.woff'),
  serif: fontFile('source-serif-4', 'source-serif-4-latin-700-normal.woff'),
  ar: fontFile('noto-naskh-arabic', 'noto-naskh-arabic-arabic-400-normal.woff'),
  arBold: fontFile('noto-naskh-arabic', 'noto-naskh-arabic-arabic-700-normal.woff'),
};
export const C = { orange: '#F8931D', deep: '#E07B00', tint: '#FDEEDA', dark: '#3A3A3C', ink: '#58595B', medium: '#808184', light: '#F2F2F3', line: '#E3E3E4', bg: '#FDFDFC', white: '#FFFFFF' };
export const STATUS = ['#F4C7C3', '#FBE0B5', '#FFF3B0', '#D9EAD3', '#B6D7A8'];

const AR = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const clean = (s) => String(s ?? '').replace(/→/g, '->').replace(/←/g, '<-').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/✓/g, 'Yes').replace(/—/g, '-').replace(/[‎‏]/g, '');

// ---------------------------------------------------------------- PDF
function pdfWriter(doc, lang) {
  const rtl = lang === 'ar';
  const latin = (bold, serif, italic) => (italic ? 'sansItalic' : serif ? 'serif' : bold ? 'sansBold' : 'sans');
  const arab = (bold) => (bold ? 'arBold' : 'ar');
  // A word is split into sub-runs by script; Arabic letters use the Arabic font,
  // everything else (digits, Latin, punctuation) the Latin font.
  const subRuns = (word) => {
    const out = [];
    for (const ch of Array.from(word)) {
      const a = AR.test(ch);
      const last = out[out.length - 1];
      if (last && last.a === a) last.t += ch; else out.push({ a, t: ch });
    }
    return out;
  };
  const wWord = (word, size, o) => subRuns(word).reduce((acc, r) => acc + doc.font(r.a ? arab(o.bold) : latin(o.bold, o.serif, o.italic)).fontSize(size).widthOfString(r.t), 0);
  const wSpace = (size, o) => doc.font(latin(o.bold, o.serif, o.italic)).fontSize(size).widthOfString(' ');
  const lineWidth = (line, size, o) => {
    const ws = line.split(' ').filter(Boolean);
    return ws.reduce((a, w) => a + wWord(w, size, o), 0) + Math.max(0, ws.length - 1) * wSpace(size, o);
  };
  const wrap = (s, w, size, o) => {
    const lines = [];
    for (const para of clean(s).split('\n')) {
      let cur = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const cand = cur ? `${cur} ${word}` : word;
        if (cur && lineWidth(cand, size, o) > w) { lines.push(cur); cur = word; } else cur = cand;
      }
      lines.push(cur);
    }
    return lines;
  };
  const drawWord = (word, x, y, size, o, color) => {
    // In a right-to-left context the sub-runs of a mixed word are laid out right to left.
    const runs = subRuns(word);
    const seq = rtl && runs.some(r => r.a) ? [...runs].reverse() : runs;
    let cx = x;
    for (const r of seq) {
      doc.font(r.a ? arab(o.bold) : latin(o.bold, o.serif, o.italic)).fontSize(size).fillColor(color);
      const rw = doc.widthOfString(r.t);
      doc.text(r.t, cx, y + (r.a ? -size * 0.1 : 0), { lineBreak: false });
      cx += rw;
    }
  };
  const text = (s, x, y, w, { size = 10, bold = false, serif = false, color = C.ink, align, italic = false, lineGap = 2 } = {}) => {
    const o = { bold, serif, italic };
    const lines = wrap(s, w, size, o);
    const lh = size * 1.25 + lineGap;
    lines.forEach((ln, i) => {
      const ly = y + i * lh;
      if (!rtl && !AR.test(ln)) {
        doc.font(latin(bold, serif, italic)).fontSize(size).fillColor(color).text(ln, x, ly, { width: w, align: align || 'left', lineBreak: false });
        return;
      }
      // Group consecutive non-Arabic words (kept left-to-right), place groups right to left.
      const words = ln.split(' ').filter(Boolean);
      const groups = [];
      for (const wd of words) {
        const a = AR.test(wd) || (rtl && !/[\p{L}\p{N}]/u.test(wd));
        const last = groups[groups.length - 1];
        if (last && !a && !last.a) last.words.push(wd); else groups.push({ a, words: [wd] });
      }
      const sp = wSpace(size, o);
      const total = lineWidth(ln, size, o);
      let cx = align === 'left' ? x + total : x + w;
      if (!rtl) cx = x;
      groups.forEach((g, gi) => {
        if (g.a) {
          for (const wd of g.words) {
            const ww = wWord(wd, size, o);
            if (rtl) { drawWord(wd, cx - ww, ly, size, o, color); cx -= ww + sp; } else { drawWord(wd, cx, ly, size, o, color); cx += ww + sp; }
          }
        } else {
          const t = g.words.join(' ');
          const tw = lineWidth(t, size, o);
          const gx = rtl ? cx - tw : cx;
          let wx = gx;
          for (const wd of g.words) { drawWord(wd, wx, ly, size, o, color); wx += wWord(wd, size, o) + sp; }
          cx = rtl ? cx - tw - sp : cx + tw + sp;
        }
      });
    });
    return lines.length * lh;
  };
  const height = (s, w, size = 10, bold = false, serif = false, lineGap = 2) => wrap(s, w, size, { bold, serif }).length * (size * 1.25 + lineGap);
  return { text, height, rtl };
}

// Section items: new models carry sec.items; older report models carry sec.text / sec.table.
export const itemsOf = (sec) => sec.items || [...(sec.text ? [{ type: 'text', text: sec.text }] : []), ...(sec.table ? [{ type: 'table', table: sec.table }] : [])];
const cellFill = (t, r, key) => (r._cells && r._cells[key] !== undefined ? STATUS[r._cells[key]] : t.statusKey && key === t.statusKey && r._status !== undefined ? STATUS[r._status] : null);

const hexOk = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
export function palette(layout = {}) {
  return { primary: hexOk(layout.primaryColor) || C.orange, accent: hexOk(layout.accentColor) || C.deep, title: hexOk(layout.titleColor) || C.dark };
}

export function toPdf(model, lang, res) {
  const doc = new PDFDocument({ size: 'A4', layout: model.landscape ? 'landscape' : 'portrait', margins: { top: 54, bottom: 54, left: 48, right: 48 }, bufferPages: true, info: { Title: clean(model.title), Author: 'DynamicMS', Creator: 'DynamicMS' } });
  for (const [k, f] of Object.entries(FONTS)) doc.registerFont(k, f);
  doc.pipe(res);
  const pal = palette(model.layout);
  const W = doc.page.width - 96; const X = 48;
  const w = pdfWriter(doc, lang);
  const rtl = w.rtl;
  let y = 54;
  const bottom = () => doc.page.height - 64;
  const newPage = () => { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.bg); y = 54; };
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.bg);
  const ensure = (hgt) => { if (y + hgt > bottom()) newPage(); };
  const lay = model.layout || {};
  if (model.cover) {
    // Cover page: logo (image or text), eyebrow, title, subtitle and the document identity block.
    y = 110;
    if (lay.logoFile) { try { doc.image(lay.logoFile, rtl ? X + W - 160 : X, 60, { fit: [160, 60] }); } catch { /* unreadable logo */ } }
    else if (lay.logoText) w.text(lay.logoText, X, 64, W, { size: 18, serif: true, bold: true, color: pal.accent });
    y = 250;
    y += w.text((model.eyebrow || '').toUpperCase(), X, y, W, { size: 10, bold: true, color: pal.accent });
    y += 8 + w.text(model.title, X, y, W, { size: 30, serif: true, color: pal.title });
    if (model.subtitle) y += 6 + w.text(model.subtitle, X, y, W, { size: 12, color: C.ink });
    y += 24;
    doc.rect(X, y, W, 3).fill(pal.primary);
    y += 20;
    for (const [k, v] of model.meta || []) { const kw = 150; const kx = rtl ? X + W - kw : X; const vx = rtl ? X : X + kw; const hh = Math.max(w.text(k, kx, y, kw, { size: 10.5, bold: true, color: C.dark }), w.text(String(v ?? ''), vx, y, W - kw, { size: 10.5, color: C.ink })); y += hh + 4; }
    newPage();
  } else {
    // Title block: eyebrow, title, subtitle
    y += w.text((model.eyebrow || '').toUpperCase(), X, y, W, { size: 9, bold: true, color: pal.accent });
    y += 4 + w.text(model.title, X, y, W, { size: 22, serif: true, color: pal.title });
    if (model.subtitle) y += 2 + w.text(model.subtitle, X, y, W, { size: 11, color: C.ink });
    if (model.docLine) y += 2 + w.text(model.docLine, X, y, W, { size: 8.5, color: C.medium });
    y += 10;
    doc.moveTo(X, y).lineTo(X + W, y).lineWidth(0.8).strokeColor(C.line).stroke();
    y += 12;
  }
  let tocPage = null; const tocEntries = [];
  if (model.toc) { if (!model.cover) newPage(); tocPage = doc.bufferedPageRange().count - 1; newPage(); }
  if (model.meta?.length && !model.cover) {
    for (const [k, v] of model.meta) { ensure(16); const kw = 150; const kx = rtl ? X + W - kw : X; const vx = rtl ? X : X + kw; const hh = Math.max(w.text(k, kx, y, kw, { size: 9.5, bold: true, color: C.dark }), w.text(String(v ?? ''), vx, y, W - kw, { size: 9.5, color: C.ink })); y += hh + 2; }
    y += 8;
  }
  if (model.kpis?.length) {
    const n = model.kpis.length; const gap = 10; const cw = (W - gap * (n - 1)) / n;
    ensure(64);
    model.kpis.forEach((k, i) => {
      const cx = rtl ? X + W - (i + 1) * cw - i * gap : X + i * (cw + gap);
      doc.roundedRect(cx, y, cw, 56, 8).fill(C.white).lineWidth(0.6).roundedRect(cx, y, cw, 56, 8).strokeColor(C.line).stroke();
      w.text(String(k.value), cx + 10, y + 8, cw - 20, { size: 18, serif: true, color: C.deep });
      w.text(k.label, cx + 10, y + 34, cw - 20, { size: 8.5, color: C.ink });
    });
    y += 70;
  }
  // Height of the start of an item (header and first row, first line...), so a heading or a
  // table header is never left alone at the bottom of a page.
  const tableGeom = (t) => {
    const cols = t.columns; const tw = cols.reduce((a, c) => a + (c.width || 1), 0);
    const cws = cols.map(c => ((c.width || 1) / tw) * W);
    const fs = cols.length > 11 ? 6.8 : cols.length > 8 ? 7.6 : 8.5;
    const hh = Math.max(...cols.map((c, i) => w.height(c.label, cws[i] - 6, fs, true))) + 8;
    const r0 = t.rows[0] ? Math.max(...cols.map((c, i) => w.height(clean(t.rows[0][c.key] ?? ''), cws[i] - 6, fs))) + 6 : 0;
    return { cols, cws, fs, hh, r0 };
  };
  const diagramSize = (it) => { let dw = Math.min(W, it.width * 0.8); let dh = (it.height / it.width) * dw; const maxH = doc.page.height - 54 - 64 - 30; if (dh > maxH) { dh = maxH; dw = (it.width / it.height) * dh; } return { dw, dh }; };
  const startHeight = (it) => {
    if (!it) return 20;
    if (it.type === 'table') { const g = tableGeom(it.table); return g.hh + Math.min(g.r0, 160); }
    if (it.type === 'kv') return 26;
    if (it.type === 'diagram' && it.png) return diagramSize(it).dh + 16;
    if (it.type === 'sub') return 60;
    return 30;
  };
  const drawTable = (t) => {
    const { cols, cws, fs } = tableGeom(t);
    const colX = (i) => { let acc = 0; for (let j = 0; j < i; j++) acc += cws[j]; return rtl ? X + W - acc - cws[i] : X + acc; };
    const header = () => {
      const hh = Math.max(...cols.map((c, i) => w.height(c.label, cws[i] - 6, fs, true))) + 8;
      const r0 = t.rows[0] ? Math.max(...cols.map((c, i) => w.height(clean(t.rows[0][c.key] ?? ''), cws[i] - 6, fs))) + 6 : 0;
      ensure(hh + Math.min(r0, 160) + 4);
      doc.rect(X, y, W, hh).fill(pal.primary);
      cols.forEach((c, i) => w.text(c.label, colX(i) + 3, y + 4, cws[i] - 6, { size: fs, bold: true, color: C.white }));
      y += hh;
    };
    header();
    t.rows.forEach((r2, ri) => {
      const vals = cols.map(c => clean(r2[c.key] ?? ''));
      const hh = Math.max(...vals.map((v, i) => w.height(v, cws[i] - 6, fs))) + 6;
      if (y + hh > bottom()) { newPage(); header(); }
      doc.rect(X, y, W, hh).fill(ri % 2 ? C.light : C.white);
      vals.forEach((v, i) => {
        const fill = cellFill(t, r2, cols[i].key);
        if (fill) doc.rect(colX(i), y, cws[i], hh).fill(fill);
        w.text(v, colX(i) + 3, y + 3, cws[i] - 6, { size: fs, color: C.dark });
      });
      doc.moveTo(X, y + hh).lineTo(X + W, y + hh).lineWidth(0.4).strokeColor(C.line).stroke();
      y += hh;
    });
    if (t.caption) { y += 4; const ch = w.height(t.caption, W, 8.5); ensure(ch); y += w.text(t.caption, X, y, W, { size: 8.5, italic: true, color: C.ink }); }
    y += 12;
  };
  const drawKv = (rows) => {
    const kw = Math.min(190, W * 0.3); const vw = W - kw;
    rows.forEach(([k, v], ri) => {
      const hh = Math.max(w.height(k, kw - 10, 9, true), w.height(clean(v), vw - 10, 9)) + 8;
      ensure(hh);
      const kx = rtl ? X + vw : X; const vx = rtl ? X : X + kw;
      doc.rect(kx, y, kw, hh).fill(C.tint); doc.rect(vx, y, vw, hh).fill(ri % 2 ? C.light : C.white);
      w.text(k, kx + 5, y + 4, kw - 10, { size: 9, bold: true, color: C.dark });
      w.text(clean(v), vx + 5, y + 4, vw - 10, { size: 9, color: C.dark });
      doc.moveTo(X, y + hh).lineTo(X + W, y + hh).lineWidth(0.4).strokeColor(C.line).stroke();
      y += hh;
    });
    y += 10;
  };
  for (const sec of model.sections || []) {
    ensure(34 + Math.min(startHeight(itemsOf(sec)[0]), doc.page.height - 200));
    tocEntries.push({ heading: sec.heading, page: doc.bufferedPageRange().count });
    y += 4 + w.text(sec.heading, X, y, W, { size: 14, serif: true, color: pal.title });
    y += 4;
    for (const it of itemsOf(sec)) {
      if (it.type === 'sub') { ensure(24 + Math.min(startHeight(itemsOf(sec)[itemsOf(sec).indexOf(it) + 1]), doc.page.height - 200)); y += 4 + w.text(it.text, X, y, W, { size: 11, bold: true, color: pal.accent }); y += 4; }
      else if (it.type === 'text') { for (const chunk of String(it.text || '').split('\n')) { const hh = w.height(chunk || ' ', W, 10); ensure(hh); y += w.text(chunk || ' ', X, y, W, { size: 10 }) + 2; } y += 6; }
      else if (it.type === 'bullets') {
        if (it.intro) { const hh = w.height(it.intro, W, 10); ensure(hh); y += w.text(it.intro, X, y, W, { size: 10, bold: true, color: C.dark }) + 3; }
        for (const b of it.items) { const hh = w.height(b, W - 14, 10); ensure(hh); w.text('•', rtl ? X + W - 8 : X + 2, y, 8, { size: 10, color: pal.primary }); y += w.text(b, rtl ? X : X + 14, y, W - 14, { size: 10 }) + 3; }
        y += 6;
      } else if (it.type === 'kv') drawKv(it.rows);
      else if (it.type === 'table') drawTable(it.table);
      else if (it.type === 'diagram' && it.png) {
        const { dw, dh } = diagramSize(it);
        ensure(dh + 20);
        doc.image(it.png, X + (W - dw) / 2, y, { width: dw, height: dh });
        y += dh + 4;
        if (it.caption) y += w.text(it.caption, X, y, W, { size: 8.5, italic: true, color: C.ink });
        y += 12;
      }
    }
  }
  if (tocPage !== null) {
    doc.switchToPage(tocPage);
    let ty = 60;
    ty += w.text(model.tocLabel || 'Contents', X, ty, W, { size: 18, serif: true, color: pal.title }) + 12;
    for (const e of tocEntries) {
      if (ty > doc.page.height - 90) break;
      const num = String(e.page);
      const nw = 30;
      w.text(e.heading, rtl ? X + nw : X, ty, W - nw - 4, { size: 10.5, color: C.dark });
      w.text(num, rtl ? X : X + W - nw, ty, nw, { size: 10.5, color: C.ink, align: 'right' });
      ty += 18;
      doc.moveTo(X, ty - 4).lineTo(X + W, ty - 4).lineWidth(0.3).strokeColor(C.line).stroke();
    }
  }
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.page.margins.bottom = 0;
    if (lay.headerText && i > 0) w.text(lay.headerText, X, 28, W, { size: 8, color: C.medium });
    const fy = doc.page.height - 38;
    doc.moveTo(X, fy - 6).lineTo(X + W, fy - 6).lineWidth(0.5).strokeColor(C.line).stroke();
    const left = `${model.footer || 'DynamicMS'} · ${model.generatedAt || ''}`;
    const right = `${model.pageLabel || 'Page'} ${i + 1} / ${range.count}`;
    w.text(rtl ? right : left, X, fy, W / 2, { size: 8, color: C.medium });
    w.text(rtl ? left : right, X + W / 2, fy, W / 2, { size: 8, color: C.medium, align: 'right' });
  }
  doc.end();
}

// ---------------------------------------------------------------- XLSX
export async function toXlsx(model, lang) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'DynamicMS'; wb.created = new Date();
  const rtl = lang === 'ar';
  const sheetName = (s, i) => clean(s).replace(/[\\/?*[\]:]/g, ' ').slice(0, 28) || `Sheet ${i + 1}`;
  const pal = palette(model.layout);
  const argb = (hex) => 'FF' + hex.slice(1).toUpperCase();
  const summary = wb.addWorksheet(sheetName(model.summaryLabel || 'Summary', 0), { views: [{ rightToLeft: rtl, showGridLines: false }] });
  summary.getColumn(1).width = 34; summary.getColumn(2).width = 70;
  if (model.layout?.logoText) { summary.addRow([model.layout.logoText]).font = { name: 'Cambria', size: 14, bold: true, color: { argb: argb(pal.accent) } }; summary.addRow([]); }
  summary.addRow([model.eyebrow?.toUpperCase() || '']).font = { name: 'Calibri', size: 10, bold: true, color: { argb: argb(pal.accent) } };
  summary.addRow([model.title]).font = { name: 'Cambria', size: 18, bold: true, color: { argb: argb(pal.title) } };
  if (model.subtitle) summary.addRow([model.subtitle]).font = { name: 'Calibri', size: 11, color: { argb: 'FF58595B' } };
  summary.addRow([]);
  for (const [k, v] of model.meta || []) { const r = summary.addRow([k, v]); r.getCell(1).font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FF3A3A3C' } }; r.getCell(2).font = { name: 'Calibri', size: 10, color: { argb: 'FF58595B' } }; }
  for (const k of model.kpis || []) { const r = summary.addRow([k.label, k.value]); r.getCell(2).font = { name: 'Cambria', bold: true, size: 12, color: { argb: 'FFE07B00' } }; }
  // Text, bullets and key-value items go to the cover sheet; every table gets its own sheet.
  const addText = (label, text, bold) => { const r = summary.addRow([label || '', text ?? '']); if (!text && label) { r.getCell(1).font = { name: 'Cambria', bold: true, size: bold ? 12 : 10.5, color: { argb: argb(pal.title) } }; return; } r.getCell(1).font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FF3A3A3C' } }; r.getCell(2).font = { name: 'Calibri', size: 10, color: { argb: 'FF58595B' } }; r.getCell(2).alignment = { wrapText: true, vertical: 'top' }; r.getCell(1).alignment = { wrapText: true, vertical: 'top' }; };
  const tables = [];
  for (const sec of model.sections || []) {
    const items = itemsOf(sec);
    const nonTable = items.filter(it => it.type !== 'table' && it.type !== 'diagram');
    if (nonTable.length) {
      summary.addRow([]); addText(sec.heading, null, true);
      for (const it of nonTable) {
        if (it.type === 'sub') addText(it.text, null, false);
        else if (it.type === 'text') { const r = summary.addRow([it.text]); summary.mergeCells(r.number, 1, r.number, 2); r.getCell(1).alignment = { wrapText: true, vertical: 'top' }; r.height = Math.min(400, 15 * (1 + Math.ceil(String(it.text).length / 110) + (String(it.text).match(/\n/g) || []).length)); }
        else if (it.type === 'bullets') { if (it.intro) addText(it.intro, null, false); for (const b of it.items) { const r = summary.addRow([`• ${b}`]); summary.mergeCells(r.number, 1, r.number, 2); r.getCell(1).alignment = { wrapText: true, vertical: 'top' }; } }
        else if (it.type === 'kv') for (const [k, v] of it.rows) addText(k, v);
      }
    }
    items.filter(it => it.type === 'table').forEach((it, k, arr) => tables.push({ heading: arr.length > 1 ? `${sec.heading} ${k + 1}` : sec.heading, table: it.table }));
  }
  const used = new Set([summary.name]);
  tables.forEach((tb, si) => {
    let nm = sheetName(tb.heading, si + 1); let n = 2; while (used.has(nm)) nm = `${nm.slice(0, 25)} ${n++}`; used.add(nm);
    const t = tb.table;
    const ws = wb.addWorksheet(nm, { views: [{ rightToLeft: rtl, state: 'frozen', ySplit: 1 }] });
    ws.columns = t.columns.map(c => ({ header: clean(c.label), key: c.key, width: Math.min(60, Math.max(8, (c.width || 1) * 14)) }));
    const hdr = ws.getRow(1);
    hdr.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(pal.primary) } }; cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FFFFFFFF' } }; cell.alignment = { vertical: 'middle', wrapText: true }; });
    t.rows.forEach((r, i) => {
      const row = ws.addRow(Object.fromEntries(t.columns.map(c => [c.key, r[c.key] ?? ''])));
      row.eachCell({ includeEmpty: true }, (cell, cn) => {
        cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF3A3A3C' } };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? 'FFF2F2F3' : 'FFFFFFFF' } };
        const key = t.columns[cn - 1]?.key;
        const f = key ? cellFill(t, r, key) : null;
        if (f) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + f.slice(1) } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE3E3E4' } } };
      });
    });
    if (t.caption) { ws.addRow([]); const cr = ws.addRow([t.caption]); cr.getCell(1).font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF58595B' } }; }
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: t.columns.length } };
  });
  return wb.xlsx.writeBuffer();
}

// ---------------------------------------------------------------- DOCX
export async function toDocx(model, lang) {
  const rtl = lang === 'ar';
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, Header, Footer, PageNumber, BorderStyle, HeadingLevel, TableOfContents } = docx;
  const run = (t, o = {}) => new TextRun({ text: String(t ?? ''), font: o.font || 'Calibri', size: o.size || 20, bold: o.bold, italics: o.italics, color: (o.color || C.ink).slice(1), rightToLeft: rtl });
  const para = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], bidirectional: rtl, alignment: rtl ? AlignmentType.RIGHT : o.align, spacing: { after: o.after ?? 120 }, heading: o.heading });
  const border = { style: BorderStyle.SINGLE, size: 4, color: C.line.slice(1) };
  const pal = palette(model.layout);
  const lay = model.layout || {};
  const children = [];
  if (model.cover) {
    if (lay.logoBuffer) children.push(new Paragraph({ alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [new docx.ImageRun({ data: lay.logoBuffer, transformation: { width: 160, height: 60 }, type: lay.logoType || 'png' })] }));
    else if (lay.logoText) children.push(para(run(lay.logoText, { font: 'Cambria', size: 32, bold: true, color: pal.accent })));
    children.push(new Paragraph({ spacing: { before: 2400 }, children: [] }));
  }
  children.push(para(run((model.eyebrow || '').toUpperCase(), { bold: true, color: pal.accent, size: 18 })));
  children.push(para(run(model.title, { font: 'Cambria', size: model.cover ? 52 : 40, bold: true, color: pal.title })));
  if (model.subtitle) children.push(para(run(model.subtitle, { size: 22 })));
  if (model.docLine) children.push(para(run(model.docLine, { size: 16, color: C.medium })));
  for (const [k, v] of model.meta || []) children.push(para([run(`${k}: `, { bold: true, color: C.dark }), run(v)], { after: 40 }));
  if (model.cover) children.push(new Paragraph({ children: [new docx.PageBreak()] }));
  if (model.kpis?.length) children.push(para(model.kpis.flatMap((k, i) => [run(`${i ? '   ' : ''}${k.value} `, { font: 'Cambria', bold: true, color: C.deep, size: 24 }), run(k.label, { size: 18 })])));
  if (model.toc) {
    if (model.tocLabel) children.push(para(run(model.tocLabel, { font: 'Cambria', size: 32, bold: true, color: pal.title })));
    children.push(new TableOfContents(model.tocLabel || 'TOC', { hyperlink: true, headingStyleRange: '1-2' }));
    children.push(new Paragraph({ children: [new docx.PageBreak()] }));
  }
  const TW = model.landscape ? 14600 : 9600;
  const tableOf = (t) => {
    const cols = t.columns; const tw = cols.reduce((a, c) => a + (c.width || 1), 0);
    const fsz = cols.length > 11 ? 13 : cols.length > 8 ? 15 : 18;
    const cell = (tx2, i, o = {}) => new TableCell({ width: { size: Math.round(((cols[i].width || 1) / tw) * TW), type: WidthType.DXA }, shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill.slice(1) } : undefined, borders: { top: border, bottom: border, left: border, right: border },
      children: String(clean(tx2)).split('\n').map(line => new Paragraph({ bidirectional: rtl, children: [run(line, { size: fsz, bold: o.bold, color: o.color || C.dark })] })) });
    const rows2 = [new TableRow({ tableHeader: true, children: cols.map((c, i) => cell(c.label, i, { fill: pal.primary, bold: true, color: C.white })) })];
    t.rows.slice(0, 1500).forEach((r, ri) => rows2.push(new TableRow({ cantSplit: true, children: cols.map((c, i) => cell(r[c.key] ?? '', i, { fill: cellFill(t, r, c.key) || (ri % 2 ? C.light : C.white) })) })));
    return new Table({ rows: rows2, width: { size: TW, type: WidthType.DXA }, columnWidths: cols.map(c => Math.round(((c.width || 1) / tw) * TW)), visuallyRightToLeft: rtl });
  };
  const kvTable = (rows) => {
    const kw = Math.round(TW * 0.3); const vw = TW - kw;
    const c2 = (tx2, width, o) => new TableCell({ width: { size: width, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: o.fill.slice(1) }, borders: { top: border, bottom: border, left: border, right: border }, children: String(clean(tx2)).split('\n').map(line => new Paragraph({ bidirectional: rtl, children: [run(line, { size: 19, bold: o.bold, color: C.dark })] })) });
    return new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [kw, vw], visuallyRightToLeft: rtl, rows: rows.map(([k, v], i) => new TableRow({ cantSplit: true, children: [c2(k, kw, { fill: C.tint, bold: true }), c2(v, vw, { fill: i % 2 ? C.light : C.white })] })) });
  };
  for (const sec of model.sections || []) {
    children.push(para(run(sec.heading, { font: 'Cambria', size: 28, bold: true, color: pal.title }), { heading: HeadingLevel.HEADING_1 }));
    for (const it of itemsOf(sec)) {
      if (it.type === 'sub') children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, bidirectional: rtl, alignment: rtl ? AlignmentType.RIGHT : undefined, spacing: { before: 200, after: 100 }, children: [run(it.text, { font: 'Cambria', size: 23, bold: true, color: pal.accent })] }));
      else if (it.type === 'text') for (const chunk of String(it.text || '').split('\n')) children.push(para(run(chunk), { after: 80 }));
      else if (it.type === 'bullets') {
        if (it.intro) children.push(para(run(it.intro, { bold: true, color: C.dark }), { after: 60 }));
        for (const b of it.items) children.push(new Paragraph({ bullet: { level: 0 }, bidirectional: rtl, alignment: rtl ? AlignmentType.RIGHT : undefined, spacing: { after: 60 }, children: [run(b)] }));
      } else if (it.type === 'kv') { children.push(kvTable(it.rows)); children.push(para(run(''), { after: 60 })); }
      else if (it.type === 'table') { children.push(tableOf(it.table)); if (it.table.caption) children.push(para(run(it.table.caption, { italics: true, size: 17 }))); else children.push(para(run(''), { after: 60 })); }
      else if (it.type === 'diagram' && it.png) {
        const maxW = model.landscape ? 960 : 630; const maxH = model.landscape ? 520 : 820;
        let dw = Math.min(maxW, Math.round(it.width * 1.05)); let dh = Math.round((it.height / it.width) * dw); if (dh > maxH) { dh = maxH; dw = Math.round((it.width / it.height) * dh); }
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new docx.ImageRun({ data: it.png, type: 'png', transformation: { width: dw, height: dh } })] }));
        if (it.caption) children.push(para(run(it.caption, { italics: true, size: 17 }), { align: AlignmentType.CENTER }));
      }
    }
  }
  const d = new Document({
    creator: 'DynamicMS', title: clean(model.title), features: { updateFields: !!model.toc },
    styles: { default: { document: { run: { font: 'Calibri', size: 20, color: C.ink.slice(1) } } } },
    sections: [{
      properties: { page: { size: model.landscape ? { width: 11906, height: 16838, orientation: docx.PageOrientation.LANDSCAPE } : { width: 11906, height: 16838 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      headers: { default: new Header({ children: [para(run(lay.headerText || model.title, { size: 16, color: C.medium }))] }) },
      footers: { default: new Footer({ children: [new Paragraph({ bidirectional: rtl, alignment: AlignmentType.RIGHT, children: [run(`${model.footer || 'DynamicMS'} · ${model.pageLabel || 'Page'} `, { size: 16, color: C.medium }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.medium.slice(1) }), run(' / ', { size: 16, color: C.medium }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.medium.slice(1) })] })] }) },
      children,
    }],
  });
  return Packer.toBuffer(d);
}

// ---------------------------------------------------------------- CSV
export function toCsv(model) {
  const sec = (model.sections || []).find(s => s.table);
  if (!sec) return '';
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [sec.table.columns.map(c => q(c.label)).join(',')];
  for (const r of sec.table.rows) lines.push(sec.table.columns.map(c => q(r[c.key])).join(','));
  return '﻿' + lines.join('\r\n');
}
