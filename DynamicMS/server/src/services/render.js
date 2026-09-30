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

const hexOk = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
export function palette(layout = {}) {
  return { primary: hexOk(layout.primaryColor) || C.orange, accent: hexOk(layout.accentColor) || C.deep, title: hexOk(layout.titleColor) || C.dark };
}

export function toPdf(model, lang, res) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 54, bottom: 54, left: 48, right: 48 }, bufferPages: true, info: { Title: clean(model.title), Author: 'DynamicMS', Creator: 'DynamicMS' } });
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
  for (const sec of model.sections || []) {
    ensure(60);
    tocEntries.push({ heading: sec.heading, page: doc.bufferedPageRange().count });
    y += 4 + w.text(sec.heading, X, y, W, { size: 14, serif: true, color: pal.title });
    y += 4;
    if (sec.text) {
      for (const chunk of String(sec.text).split('\n')) { const hh = w.height(chunk || ' ', W, 10); ensure(hh); y += w.text(chunk || ' ', X, y, W, { size: 10 }) + 2; }
      y += 6;
    }
    if (sec.table) {
      const cols = sec.table.columns; const tw = cols.reduce((a, c) => a + (c.width || 1), 0);
      const cws = cols.map(c => ((c.width || 1) / tw) * W);
      const colX = (i) => { let acc = 0; for (let j = 0; j < i; j++) acc += cws[j]; return rtl ? X + W - acc - cws[i] : X + acc; };
      const header = () => {
        const hh = Math.max(...cols.map((c, i) => w.height(c.label, cws[i] - 8, 8.5, true))) + 8;
        ensure(hh + 18);
        doc.rect(X, y, W, hh).fill(pal.primary);
        cols.forEach((c, i) => w.text(c.label, colX(i) + 4, y + 4, cws[i] - 8, { size: 8.5, bold: true, color: C.white }));
        y += hh;
      };
      header();
      sec.table.rows.forEach((r2, ri) => {
        const vals = cols.map(c => clean(r2[c.key] ?? ''));
        const hh = Math.max(...vals.map((v, i) => w.height(v, cws[i] - 8, 8.5))) + 6;
        if (y + hh > bottom()) { newPage(); header(); }
        doc.rect(X, y, W, hh).fill(ri % 2 ? C.light : C.white);
        vals.forEach((v, i) => {
          const fill = sec.table.statusKey && cols[i].key === sec.table.statusKey && r2._status !== undefined ? STATUS[r2._status] : null;
          if (fill) doc.rect(colX(i), y, cws[i], hh).fill(fill);
          w.text(v, colX(i) + 4, y + 3, cws[i] - 8, { size: 8.5, color: C.dark });
        });
        doc.moveTo(X, y + hh).lineTo(X + W, y + hh).lineWidth(0.4).strokeColor(C.line).stroke();
        y += hh;
      });
      if (sec.table.caption) { y += 4; y += w.text(sec.table.caption, X, y, W, { size: 8.5, italic: true, color: C.ink }); }
      y += 12;
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
  const textSecs = (model.sections || []).filter(x => x.text && !x.table);
  if (textSecs.length) {
    summary.addRow([]);
    for (const sec of textSecs) {
      const hr = summary.addRow([sec.heading]); hr.getCell(1).font = { name: 'Cambria', bold: true, size: 12, color: { argb: argb(pal.title) } };
      const tr2 = summary.addRow([sec.text]); summary.mergeCells(tr2.number, 1, tr2.number, 2); tr2.getCell(1).alignment = { wrapText: true, vertical: 'top' }; tr2.height = Math.min(400, 15 * (1 + Math.ceil(String(sec.text).length / 110) + (String(sec.text).match(/\n/g) || []).length));
    }
  }
  (model.sections || []).filter(s => s.table).forEach((sec, si) => {
    const ws = wb.addWorksheet(sheetName(sec.heading, si + 1), { views: [{ rightToLeft: rtl, state: 'frozen', ySplit: 1 }] });
    ws.columns = sec.table.columns.map(c => ({ header: clean(c.label), key: c.key, width: Math.min(60, Math.max(10, (c.width || 1) * 14)) }));
    const hdr = ws.getRow(1);
    hdr.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(pal.primary) } }; cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FFFFFFFF' } }; cell.alignment = { vertical: 'middle', wrapText: true }; });
    sec.table.rows.forEach((r, i) => {
      const row = ws.addRow(Object.fromEntries(sec.table.columns.map(c => [c.key, r[c.key] ?? ''])));
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF3A3A3C' } };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? 'FFF2F2F3' : 'FFFFFFFF' } };
        const key = sec.table.columns[col - 1]?.key;
        if (sec.table.statusKey && key === sec.table.statusKey && r._status !== undefined) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + STATUS[r._status].slice(1) } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE3E3E4' } } };
      });
    });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sec.table.columns.length } };
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
  for (const [k, v] of model.meta || []) children.push(para([run(`${k}: `, { bold: true, color: C.dark }), run(v)], { after: 40 }));
  if (model.cover) children.push(new Paragraph({ children: [new docx.PageBreak()] }));
  if (model.kpis?.length) children.push(para(model.kpis.flatMap((k, i) => [run(`${i ? '   ' : ''}${k.value} `, { font: 'Cambria', bold: true, color: C.deep, size: 24 }), run(k.label, { size: 18 })])));
  if (model.toc) {
    if (model.tocLabel) children.push(para(run(model.tocLabel, { font: 'Cambria', size: 32, bold: true, color: pal.title })));
    children.push(new TableOfContents(model.tocLabel || 'TOC', { hyperlink: true, headingStyleRange: '1-2' }));
    children.push(new Paragraph({ children: [new docx.PageBreak()] }));
  }
  for (const sec of model.sections || []) {
    children.push(para(run(sec.heading, { font: 'Cambria', size: 28, bold: true, color: pal.title }), { heading: HeadingLevel.HEADING_1 }));
    if (sec.text) for (const chunk of String(sec.text).split('\n')) children.push(para(run(chunk), { after: 60 }));
    if (sec.table) {
      const cols = sec.table.columns; const tw = cols.reduce((a, c) => a + (c.width || 1), 0);
      const cell = (t, i, o = {}) => new TableCell({ width: { size: Math.round(((cols[i].width || 1) / tw) * 9600), type: WidthType.DXA }, shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill.slice(1) } : undefined, borders: { top: border, bottom: border, left: border, right: border },
        children: [new Paragraph({ bidirectional: rtl, children: [run(clean(t), { size: 18, bold: o.bold, color: o.color || C.dark })] })] });
      const rows2 = [new TableRow({ tableHeader: true, children: cols.map((c, i) => cell(c.label, i, { fill: pal.primary, bold: true, color: C.white })) })];
      sec.table.rows.slice(0, 1500).forEach((r, ri) => rows2.push(new TableRow({ children: cols.map((c, i) => cell(r[c.key] ?? '', i, { fill: sec.table.statusKey === c.key && r._status !== undefined ? STATUS[r._status] : ri % 2 ? C.light : C.white })) })));
      children.push(new Table({ rows: rows2, width: { size: 9600, type: WidthType.DXA }, visuallyRightToLeft: rtl }));
      if (sec.table.caption) children.push(para(run(sec.table.caption, { italics: true, size: 18 })));
    }
  }
  const d = new Document({
    creator: 'DynamicMS', title: clean(model.title), features: { updateFields: !!model.toc },
    styles: { default: { document: { run: { font: 'Calibri', size: 20, color: C.ink.slice(1) } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
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
