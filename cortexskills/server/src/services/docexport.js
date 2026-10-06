// Export of generated documents to Word, PDF and Excel (FR-DA-DOC-06, FR-DA-DGC-11, FR-DA-DFP-01 – 05).
// Layout for reading: cover page, table of contents, numbered headings, headers and footers with "Page X of Y",
// landscape pages for wide tables and diagrams, table headers repeated on every page, no heading left alone at the
// bottom of a page. Typography and colours follow the Graphical Chart (Times New Roman body, orange table headers).
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Resvg } from '@resvg/resvg-js';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, BorderStyle, HeadingLevel, Header, Footer, PageNumber, PageBreak,
  TableOfContents, ImageRun, PageOrientation, LineRuleType } from 'docx';
import { ROOT, config } from '../config.js';
import { t } from '../i18n.js';

const C = { orange: 'F8931D', deep: 'E07B00', tint: 'FDEEDA', dark: '3A3A3C', ink: '58595B', medium: '808184', light: 'F2F2F3', line: 'E3E3E4', white: 'FFFFFF' };
const FONT = n => path.join(ROOT, 'assets', 'fonts', n);
const isAr = s => /[؀-ۿ]/.test(String(s || ''));
const MM = 56.7; // twips per millimetre
const TXT = { contents: { en: 'Contents', fr: 'Sommaire', ar: 'المحتويات' }, identification: { en: 'Identification', fr: 'Identification', ar: 'التعريف' }, revisions: { en: 'Revision history', fr: 'Historique des révisions', ar: 'سجل المراجعات' },
  sources: { en: 'Data sources', fr: 'Sources des données', ar: 'مصادر البيانات' }, approval: { en: 'Approval', fr: 'Approbation', ar: 'المصادقة' }, overrides: { en: 'Content specific to this document', fr: 'Contenu propre à ce document', ar: 'محتوى خاص بهذه الوثيقة' },
  page: { en: 'Page', fr: 'Page', ar: 'صفحة' }, of: { en: 'of', fr: 'sur', ar: 'من' }, role: { en: 'Role', fr: 'Rôle', ar: 'الدور' }, name: { en: 'Name', fr: 'Nom', ar: 'الاسم' }, date: { en: 'Date', fr: 'Date', ar: 'التاريخ' }, signature: { en: 'Signature', fr: 'Signature', ar: 'التوقيع' },
  author: { en: 'Author', fr: 'Auteur', ar: 'الكاتب' }, approver: { en: 'Approver', fr: 'Approbateur', ar: 'المصادق' }, field: { en: 'Field', fr: 'Champ', ar: 'الحقل' }, value: { en: 'Value', fr: 'Valeur', ar: 'القيمة' },
  reference: { en: 'Reference', fr: 'Référence', ar: 'المرجع' }, version: { en: 'Version', fr: 'Version', ar: 'الإصدار' }, status: { en: 'Status', fr: 'Statut', ar: 'الحالة' }, owner: { en: 'Owner', fr: 'Propriétaire', ar: 'المالك' },
  dataAsOf: { en: 'Data as of', fr: 'Données au', ar: 'البيانات بتاريخ' }, classification: { en: 'Classification', fr: 'Classification', ar: 'التصنيف' }, project: { en: 'Project', fr: 'Projet', ar: 'المشروع' }, organization: { en: 'Organization', fr: 'Organisation', ar: 'المؤسسة' },
  records: { en: 'Records', fr: 'Enregistrements', ar: 'السجلات' }, step: { en: 'Provided by step', fr: 'Fourni par l’étape', ar: 'تقدمه الخطوة' }, note: { en: 'Change note', fr: 'Note de modification', ar: 'ملاحظة التغيير' } };
const tx = (k, l) => TXT[k][l] || TXT[k].en;

/* ------------------------------------------------------------------------------------------ helpers */
/** Width and height of a PNG or JPEG image, read from its header. */
export function imageSize(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: 'png' };
  if (buf[0] === 0xff && buf[1] === 0xd8) { let i = 2; while (i < buf.length) { if (buf[i] !== 0xff) { i++; continue; } const m = buf[i + 1]; const len = buf.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), type: 'jpg' }; i += 2 + len; } }
  return null;
}
export function assetBuffer(orgId, assetId) {
  if (!assetId) return null; const dir = path.join(config.dataDir, 'assets', String(orgId).replace(/[^\w-]/g, ''));
  const f = fs.existsSync(dir) ? fs.readdirSync(dir).find(x => x.startsWith(String(assetId).replace(/[^\w-]/g, '') + '.')) : null; return f ? fs.readFileSync(path.join(dir, f)) : null;
}
const wrapWords = (s, n) => { const out = []; let cur = ''; for (const w of String(s).split(/\s+/)) { if ((cur + ' ' + w).trim().length > n) { if (cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.slice(0, 4); };
const esc = s => String(s ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
/** Process flow as SVG: one lane per role, start and end events, one task per user task, sequence flows (FR-DA-DGC-06). */
export function diagramSvg(d) {
  const laneH = 120, taskW = 150, taskH = 70, gap = 46, x0 = 150; const n = d.nodes.length; const W = x0 + 60 + n * (taskW + gap) + 90; const H = Math.max(1, d.lanes.length) * laneH + 20;
  const cy = lane => 10 + lane * laneH + laneH / 2; const parts = [];
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`);
  d.lanes.forEach((l, i) => { parts.push(`<rect x="10" y="${10 + i * laneH}" width="${W - 20}" height="${laneH}" fill="${i % 2 ? '#FDFDFC' : '#FFFFFF'}" stroke="#E3E3E4"/>`, `<rect x="10" y="${10 + i * laneH}" width="120" height="${laneH}" fill="#F2F2F3" stroke="#E3E3E4"/>`);
    wrapWords(l, 16).forEach((ln, k, arr) => parts.push(`<text x="70" y="${10 + i * laneH + laneH / 2 - (arr.length - 1) * 8 + k * 16 + 5}" text-anchor="middle" font-family="Source Sans 3, Noto Naskh Arabic" font-size="13" font-weight="700" fill="#3A3A3C">${esc(ln)}</text>`)); });
  const first = d.nodes[0]?.lane ?? 0, last = d.nodes[n - 1]?.lane ?? 0; const sx = x0 + 18, ex = x0 + 60 + n * (taskW + gap) + 18;
  parts.push(`<circle cx="${sx}" cy="${cy(first)}" r="16" fill="#FFFFFF" stroke="#5AA469" stroke-width="2.5"/>`, `<circle cx="${ex}" cy="${cy(last)}" r="16" fill="#FFFFFF" stroke="#3A3A3C" stroke-width="4.5"/>`);
  const pos = d.nodes.map((nd, i) => ({ ...nd, x: x0 + 60 + i * (taskW + gap), y: cy(nd.lane) - taskH / 2 }));
  const arrow = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2; const p = y1 === y2 ? `M${x1},${y1} L${x2 - 8},${y2}` : `M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2 - 8},${y2}`; parts.push(`<path d="${p}" fill="none" stroke="#58595B" stroke-width="1.6"/><path d="M${x2 - 9},${y2 - 5} L${x2},${y2} L${x2 - 9},${y2 + 5} Z" fill="#58595B"/>`); };
  if (pos.length) arrow(sx + 16, cy(first), pos[0].x, cy(pos[0].lane));
  pos.forEach((p, i) => { parts.push(`<rect x="${p.x}" y="${p.y}" width="${taskW}" height="${taskH}" rx="10" fill="#FDEEDA" stroke="#F8931D" stroke-width="1.6"/>`);
    wrapWords(p.label, 22).forEach((ln, k, arr) => parts.push(`<text x="${p.x + taskW / 2}" y="${p.y + taskH / 2 - (arr.length - 1) * 7.5 + k * 15 + 4}" text-anchor="middle" font-family="Source Sans 3, Noto Naskh Arabic" font-size="11.5" fill="#3A3A3C">${esc(ln)}</text>`));
    if (i < pos.length - 1) arrow(p.x + taskW, cy(p.lane), pos[i + 1].x, cy(pos[i + 1].lane)); });
  if (pos.length) arrow(pos[n - 1].x + taskW, cy(last), ex - 16, cy(last));
  if (d.start) parts.push(`<text x="${sx}" y="${cy(first) + 32}" text-anchor="middle" font-family="Source Sans 3, Noto Naskh Arabic" font-size="10" fill="#58595B">${esc(wrapWords(d.start, 22)[0] || '')}</text>`);
  if (d.end) parts.push(`<text x="${ex}" y="${cy(last) + 32}" text-anchor="middle" font-family="Source Sans 3, Noto Naskh Arabic" font-size="10" fill="#58595B">${esc(wrapWords(d.end, 22)[0] || '')}</text>`);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`, w: W, h: H };
}
export function diagramPng(d) {
  const { svg, w, h } = diagramSvg(d);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: Math.min(3200, w * 2) }, font: { fontFiles: [FONT('SourceSans3-400.ttf'), FONT('SourceSans3-700.ttf'), FONT('NotoNaskhArabic-400.ttf')], loadSystemFonts: false, defaultFontFamily: 'Source Sans 3' } }).render().asPng();
  return { png: Buffer.from(png), w, h };
}
/** Heading numbers ("1.", "1.1") when the template asks for numbered headings. */
function numbered(model, fmt) {
  let n = 0; return (model.sections || []).map(s => { if (!s.heading || s.formatting?.hideTitle) return { ...s }; n++; const label = fmt.numbering && !/^\d/.test(s.heading) ? `${n}. ${s.heading}` : s.heading;
    return { ...s, heading: label, subsections: (s.subsections || []).map((x, k) => ({ ...x, heading: fmt.numbering ? `${n}.${k + 1} ${x.heading}` : x.heading })) }; });
}
const wide = table => (table?.columns?.length || 0) > 6;

/* ---------------------------------------------------------------------------------------------- WORD */
export async function toDocx(model, meta) {
  const lang = model.lang; const rtl = lang === 'ar'; const fmt = meta.formatting; const sections = numbered(model, fmt);
  const font = fmt.bodyFont; const hfont = fmt.headingFont; const size = Math.round(fmt.bodySize * 2);
  const align = rtl ? AlignmentType.RIGHT : { justify: AlignmentType.JUSTIFIED, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, left: AlignmentType.LEFT }[fmt.align] || AlignmentType.JUSTIFIED;
  const run = (text, o = {}) => new TextRun({ text: String(text ?? ''), font: o.font || font, size: o.size || size, bold: o.bold, italics: o.italics, color: o.color || C.ink, rightToLeft: rtl, allCaps: o.caps, characterSpacing: o.spacing });
  const para = (text, o = {}) => new Paragraph({ bidirectional: rtl, alignment: o.align ?? align, spacing: { after: o.after ?? 120, line: 276, lineRule: LineRuleType.AUTO }, keepNext: o.keepNext, pageBreakBefore: o.pageBreak, heading: o.heading, border: o.border, shading: o.shading,
    children: String(text ?? '').split('\n').flatMap((ln, i) => (i ? [new TextRun({ break: 1 }), run(ln, o)] : [run(ln, o)])) });
  const b = { style: BorderStyle.SINGLE, size: 4, color: C.line }; const borders = { top: b, bottom: b, left: b, right: b };
  const cell = (text, o = {}) => new TableCell({ borders, shading: { type: ShadingType.CLEAR, color: 'auto', fill: o.fill || C.white }, margins: { top: 60, bottom: 60, left: 90, right: 90 }, children: [para(text, { size: o.size || 19, bold: o.bold, color: o.color || C.ink, align: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT, after: 0 })] });
  const table = (cols, rows, o = {}) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, visuallyRightToLeft: rtl, rows: [
    ...(cols ? [new TableRow({ tableHeader: true, cantSplit: true, children: cols.map(c => cell(c, { fill: fmt.tableHeader || C.orange, color: C.white, bold: true })) })] : []),
    ...rows.map((r, k) => new TableRow({ cantSplit: true, children: r.map((c, j) => cell(c, { fill: o.kv && j === 0 ? C.light : k % 2 ? C.light : C.white, bold: o.kv && j === 0, color: o.kv && j === 0 ? C.dark : C.ink })) }))] });
  const H1 = (text, o = {}) => para(text, { font: hfont, size: Math.round(fmt.h1Size * 2), bold: true, color: fmt.headingColor, heading: HeadingLevel.HEADING_1, keepNext: true, after: 160, pageBreak: o.pageBreak, align: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: fmt.headingColor, space: 4 } } });
  const H2 = text => para(text, { font: hfont, size: Math.round(fmt.h2Size * 2), bold: true, color: fmt.h2Color, heading: HeadingLevel.HEADING_2, keepNext: true, after: 100, align: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT });
  const contentW = (fmt.orientation === 'landscape' ? 297 : 210) - 2 * fmt.margins; // mm
  const img = (buf, pct = 100, wpx, hpx) => { const sz = imageSize(buf) || { w: wpx || 800, h: hpx || 400 }; const wmm = contentW * Math.min(100, pct) / 100; const wpt = wmm * 3.78; return new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: buf, type: sz.type === 'jpg' ? 'jpg' : 'png', transformation: { width: wpt, height: wpt * sz.h / sz.w } })] }); };

  const pages = []; // docx sections: portrait blocks and landscape blocks
  let block = []; const flush = (landscape = false) => { if (block.length) pages.push({ landscape, children: block }); block = []; };
  // Cover page (FR-DA-DFP-01, -02)
  if (fmt.cover) {
    const logo = meta.logo; if (logo && fmt.logo !== 'none') block.push(new Paragraph({ alignment: { 'top-left': AlignmentType.LEFT, 'top-center': AlignmentType.CENTER, 'top-right': AlignmentType.RIGHT }[fmt.logoPosition], spacing: { after: 600 }, children: [new ImageRun({ data: logo, type: imageSize(logo)?.type === 'jpg' ? 'jpg' : 'png', transformation: { width: 150, height: 150 * (imageSize(logo)?.h || 1) / (imageSize(logo)?.w || 1) } })] }));
    else block.push(para(meta.orgName || '', { font: hfont, size: 36, bold: true, color: C.dark, after: 600 }));
    block.push(para(String(meta.categoryLabel || '').toUpperCase(), { size: 20, bold: true, color: C.deep, spacing: 30, after: 120 }), para(model.title, { font: hfont, size: 52, bold: true, color: C.dark, after: 360, align: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT }));
    block.push(table(null, [[tx('organization', lang), meta.orgName || ''], [tx('project', lang), meta.projectName || ''], [tx('reference', lang), meta.reference], [tx('version', lang), meta.versionLabel], [tx('status', lang), meta.statusLabel], [tx('dataAsOf', lang), meta.dataAsOf], [tx('classification', lang), meta.classification]], { kv: true }));
    block.push(new Paragraph({ children: [new PageBreak()] }));
  }
  if (fmt.toc) { block.push(para(tx('contents', lang), { font: hfont, size: Math.round(fmt.h1Size * 2), bold: true, color: fmt.headingColor, align: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT }), new TableOfContents(tx('contents', lang), { hyperlink: true, headingStyleRange: '1-3' }), new Paragraph({ children: [new PageBreak()] })); }
  if (meta.profile?.identification !== false) { block.push(H1(tx('identification', lang)), table([tx('field', lang), tx('value', lang)], meta.identification)); }
  for (const s of sections) {
    const f = s.formatting || {}; const pb = !!f.pageBreak;
    const headPara = s.heading && !f.hideTitle ? H1(s.heading, { pageBreak: pb }) : null;
    const textOpts = { size: f.size ? Math.round(f.size * 2) : size, color: f.color || (s.notice ? C.dark : C.ink), bold: f.bold, italics: f.italic || s.notice, align: f.align ? { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED }[f.align] : undefined, shading: f.callout || s.notice ? { type: ShadingType.CLEAR, color: 'auto', fill: C.tint } : undefined };
    const goesWide = wide(s.table) || s.diagram;
    if (goesWide && fmt.orientation !== 'landscape') { flush(false); }
    if (headPara) block.push(headPara);
    if (s.text) block.push(para(s.text, textOpts));
    if (s.diagram) { try { const d = diagramPng(s.diagram); block.push(img(d.png, 100, d.w, d.h)); } catch { block.push(para(s.diagram.title, textOpts)); } }
    if (s.picture?.buffer) { block.push(img(s.picture.buffer, s.picture.width || 60)); if (s.picture.caption) block.push(para(s.picture.caption, { italics: true, size: 18, align: AlignmentType.CENTER })); }
    if (s.kv?.length) block.push(table(null, s.kv, { kv: true }));
    if (s.table) { block.push(table(s.table.columns, s.table.rows)); block.push(para('', { after: 60 })); }
    for (const x of s.subsections || []) { block.push(H2(x.heading)); if (x.text) block.push(para(x.text, { italics: x.notice, size: x.small ? 20 : size, shading: x.notice ? { type: ShadingType.CLEAR, color: 'auto', fill: C.tint } : undefined })); if (x.kv) block.push(table(null, x.kv, { kv: true })); if (x.table) { block.push(table(x.table.columns, x.table.rows)); block.push(para('', { after: 60 })); } }
    if (s.approval) block.push(table([tx('role', lang), tx('name', lang), tx('date', lang), tx('signature', lang)], meta.approvalRows));
    if (goesWide && fmt.orientation !== 'landscape') flush(true);
  }
  if (meta.overrides?.length) { block.push(H1(tx('overrides', lang)), table([tx('field', lang), tx('value', lang)], meta.overrides)); }
  if (meta.profile?.revisions !== false && meta.revisions?.length) block.push(H1(tx('revisions', lang)), table([tx('version', lang), tx('status', lang), tx('date', lang), tx('author', lang), tx('note', lang)], meta.revisions));
  if (meta.profile?.sources !== false && meta.sources?.length) block.push(H1(tx('sources', lang)), table([tx('sources', lang), tx('records', lang), tx('step', lang)], meta.sources));
  if (meta.profile?.approval !== false) block.push(H1(tx('approval', lang)), table([tx('role', lang), tx('name', lang), tx('date', lang), tx('signature', lang)], meta.approvalRows));
  flush(fmt.orientation === 'landscape');

  const headerText = [fmt.header || model.title, meta.classification].filter(Boolean).join(' · ');
  const footerRuns = [new TextRun({ text: `${fmt.footer ? fmt.footer + ' · ' : ''}${meta.reference} · ${tx('page', lang)} `, size: 16, color: C.medium, font }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.medium, font }), new TextRun({ text: ` ${tx('of', lang)} `, size: 16, color: C.medium, font }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.medium, font })];
  const doc = new Document({ creator: meta.orgName || 'CortexSkills', title: model.title, description: meta.classification, features: { updateFields: !!fmt.toc },
    styles: { default: { document: { run: { font, size, color: C.ink }, paragraph: { spacing: { line: 276 } } } } },
    sections: pages.map(pg => ({ properties: { page: { size: pg.landscape ? { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE } : { width: 11906, height: 16838 }, margin: { top: Math.round(fmt.margins * MM), bottom: Math.round(fmt.margins * MM), left: Math.round(fmt.margins * MM), right: Math.round(fmt.margins * MM) } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: rtl ? AlignmentType.LEFT : AlignmentType.RIGHT, children: [new TextRun({ text: headerText, size: 16, color: C.medium, font })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: fmt.pageNumbers ? footerRuns : [new TextRun({ text: fmt.footer || meta.reference, size: 16, color: C.medium, font })] })] }) },
      children: pg.children })) });
  return Packer.toBuffer(doc);
}

/* ----------------------------------------------------------------------------------------------- PDF */
export async function toPdf(model, meta) {
  const lang = model.lang; const rtl = lang === 'ar'; const fmt = meta.formatting; const sections = numbered(model, fmt);
  const m = fmt.margins * 2.835; const land = fmt.orientation === 'landscape';
  const doc = new PDFDocument({ size: 'A4', layout: land ? 'landscape' : 'portrait', margin: m, bufferPages: true, info: { Title: model.title, Subject: meta.classification, Author: meta.orgName || '' } });
  doc.registerFont('body', FONT('LiberationSerif-Regular.ttf')); doc.registerFont('bodyB', FONT('LiberationSerif-Bold.ttf')); doc.registerFont('bodyI', FONT('LiberationSerif-Italic.ttf'));
  doc.registerFont('ar', FONT('NotoNaskhArabic-400.ttf')); doc.registerFont('arB', FONT('NotoNaskhArabic-700.ttf'));
  const F = (s, bold, italic) => (isAr(s) ? (bold ? 'arB' : 'ar') : bold ? 'bodyB' : italic ? 'bodyI' : 'body');
  const chunks = []; doc.on('data', c => chunks.push(c)); const done = new Promise(r => doc.on('end', () => r(Buffer.concat(chunks))));
  const W = () => doc.page.width - 2 * m; const bottom = () => doc.page.height - m - 24; const al = rtl ? 'right' : fmt.align === 'justify' ? 'justify' : fmt.align;
  const toc = []; const hex = c => '#' + String(c).replace('#', '');
  const text = (s, o = {}) => { doc.fillColor(o.color || hex(C.ink)).font(F(s, o.bold, o.italic)).fontSize(o.size || fmt.bodySize).text(String(s ?? ''), m, doc.y, { width: W(), align: o.align || al, lineGap: 2 }); };
  const ensure = h => { if (doc.y + h > bottom()) doc.addPage({ layout: doc.page.layout }); };
  const H1 = s => { ensure(60); toc.push({ title: s, page: doc.bufferedPageRange().count, level: 1 }); doc.moveDown(0.6); text(s, { bold: true, size: fmt.h1Size, color: hex(fmt.headingColor), align: rtl ? 'right' : 'left' }); doc.moveTo(m, doc.y + 2).lineTo(m + W(), doc.y + 2).lineWidth(1).strokeColor(hex(fmt.headingColor)).stroke(); doc.moveDown(0.5); };
  const H2 = s => { ensure(50); toc.push({ title: s, page: doc.bufferedPageRange().count, level: 2 }); doc.moveDown(0.4); text(s, { bold: true, size: fmt.h2Size, color: hex(fmt.h2Color), align: rtl ? 'right' : 'left' }); doc.moveDown(0.25); };
  const table = (cols, rows, o = {}) => {
    const n = (cols || rows[0] || []).length || 1; const colW = W() / n; const pad = 4; const order = [...Array(n).keys()]; if (rtl) order.reverse();
    const hgt = (row, size, bold) => Math.max(14, ...row.map(c => doc.font(F(c, bold)).fontSize(size).heightOfString(String(c ?? ''), { width: colW - pad * 2 }))) + pad * 2;
    const draw = (row, y, fill, color, size, bold, kvRow) => { const h = hgt(row, size, bold); doc.rect(m, y, W(), h).fill(fill);
      order.forEach((ci, k) => { const x = m + k * colW; const isKey = kvRow && ci === 0; if (isKey) doc.rect(x, y, colW, h).fill(hex(C.light)); doc.fillColor(isKey ? hex(C.dark) : color).font(F(row[ci], bold || isKey)).fontSize(size).text(String(row[ci] ?? ''), x + pad, y + pad, { width: colW - pad * 2, align: rtl ? 'right' : 'left' }); doc.rect(x, y, colW, h).lineWidth(0.5).strokeColor(hex(C.line)).stroke(); });
      return h; };
    let y = doc.y; const head = () => { if (cols) y += draw(cols, y, hex(fmt.tableHeader), '#FFFFFF', 9.5, true); };
    if (y + 40 > bottom()) { doc.addPage({ layout: doc.page.layout }); y = m; } head();
    rows.forEach((r, i) => { const h = hgt(r, 9.5); if (y + h > bottom()) { doc.addPage({ layout: doc.page.layout }); y = m; head(); } y += draw(r, y, i % 2 ? hex(C.light) : '#FFFFFF', hex(C.ink), 9.5, false, o.kv); });
    doc.y = y + 6; doc.x = m;
  };
  const image = (buf, pct = 100) => { const sz = imageSize(buf); if (!sz) return; const w = W() * Math.min(100, pct) / 100; const h = w * sz.h / sz.w; if (doc.y + h > bottom()) doc.addPage({ layout: doc.page.layout }); doc.image(buf, m + (W() - w) / 2, doc.y, { width: w }); doc.y += h + 6; };
  // Cover
  if (fmt.cover) {
    doc.rect(0, 0, doc.page.width, 8).fill(hex(C.orange));
    if (meta.logo && fmt.logo !== 'none') { const sz = imageSize(meta.logo); const w = 150; const x = { 'top-left': m, 'top-center': (doc.page.width - w) / 2, 'top-right': doc.page.width - m - w }[fmt.logoPosition]; doc.image(meta.logo, x, m + 10, { width: w }); doc.y = m + 20 + (sz ? w * sz.h / sz.w : 60); }
    else { doc.y = m + 20; text(meta.orgName || '', { bold: true, size: 18, color: hex(C.dark), align: rtl ? 'right' : 'left' }); }
    doc.y = Math.max(doc.y, doc.page.height * 0.32); text(String(meta.categoryLabel || '').toUpperCase(), { bold: true, size: 10, color: hex(C.deep), align: rtl ? 'right' : 'left' }); doc.moveDown(0.4);
    text(model.title, { bold: true, size: 26, color: hex(C.dark), align: rtl ? 'right' : 'left' }); doc.moveDown(1.2);
    table(null, [[tx('organization', lang), meta.orgName || ''], [tx('project', lang), meta.projectName || ''], [tx('reference', lang), meta.reference], [tx('version', lang), meta.versionLabel], [tx('status', lang), meta.statusLabel], [tx('dataAsOf', lang), meta.dataAsOf], [tx('classification', lang), meta.classification]], { kv: true });
    doc.addPage();
  }
  // Table of contents: pages reserved now, written at the end once page numbers are known.
  let tocPage = null; const tocPages = fmt.toc ? Math.max(1, Math.ceil((sections.length + sections.reduce((s, x) => s + (x.subsections?.length || 0), 0) + 6) / 48)) : 0;
  if (fmt.toc) { tocPage = doc.bufferedPageRange().count - 1; for (let i = 1; i < tocPages; i++) doc.addPage(); doc.addPage(); }
  if (meta.profile?.identification !== false) { H1(tx('identification', lang)); table([tx('field', lang), tx('value', lang)], meta.identification); }
  for (const s of sections) {
    const f = s.formatting || {}; const goesWide = (wide(s.table) || s.diagram) && !land;
    if (goesWide || f.pageBreak) doc.addPage({ layout: goesWide ? 'landscape' : doc.page.layout });
    if (s.heading && !f.hideTitle) H1(s.heading);
    if (s.text) { if (f.callout || s.notice) { const h = doc.font(F(s.text)).fontSize(fmt.bodySize).heightOfString(s.text, { width: W() - 16 }) + 12; ensure(h); doc.rect(m, doc.y, W(), h).fill(hex(C.tint)); doc.y += 6; doc.fillColor(hex(f.color || C.dark)).font(F(s.text, f.bold, true)).fontSize(f.size || fmt.bodySize).text(s.text, m + 8, doc.y, { width: W() - 16, align: rtl ? 'right' : 'left' }); doc.y += 8; }
      else text(s.text, { size: f.size, color: f.color ? hex(f.color) : undefined, bold: f.bold, italic: f.italic, align: f.align }); doc.moveDown(0.4); }
    if (s.diagram) { try { image(diagramPng(s.diagram).png, 100); } catch { text(s.diagram.title); } }
    if (s.picture?.buffer) { image(s.picture.buffer, s.picture.width || 60); if (s.picture.caption) text(s.picture.caption, { italic: true, size: 9, align: 'center' }); }
    if (s.kv?.length) table(null, s.kv, { kv: true });
    if (s.table) table(s.table.columns, s.table.rows);
    for (const x of s.subsections || []) { H2(x.heading); if (x.text) text(x.text, { italic: x.notice, size: x.small ? 10 : undefined }); if (x.kv) table(null, x.kv, { kv: true }); if (x.table) table(x.table.columns, x.table.rows); }
    if (s.approval) table([tx('role', lang), tx('name', lang), tx('date', lang), tx('signature', lang)], meta.approvalRows);
    if (goesWide) doc.addPage({ layout: land ? 'landscape' : 'portrait' });
  }
  if (meta.overrides?.length) { H1(tx('overrides', lang)); table([tx('field', lang), tx('value', lang)], meta.overrides); }
  if (meta.profile?.revisions !== false && meta.revisions?.length) { H1(tx('revisions', lang)); table([tx('version', lang), tx('status', lang), tx('date', lang), tx('author', lang), tx('note', lang)], meta.revisions); }
  if (meta.profile?.sources !== false && meta.sources?.length) { H1(tx('sources', lang)); table([tx('sources', lang), tx('records', lang), tx('step', lang)], meta.sources); }
  if (meta.profile?.approval !== false) { H1(tx('approval', lang)); table([tx('role', lang), tx('name', lang), tx('date', lang), tx('signature', lang)], meta.approvalRows); }
  const range = doc.bufferedPageRange();
  if (fmt.toc && tocPage != null) { let tp = tocPage; doc.switchToPage(tp); doc.y = m; text(tx('contents', lang), { bold: true, size: fmt.h1Size, color: hex(fmt.headingColor), align: rtl ? 'right' : 'left' }); doc.moveDown(0.6);
    for (const e of toc) { if (doc.y > bottom()) { if (tp < tocPage + tocPages - 1) { doc.switchToPage(++tp); doc.y = m; } else break; } const label = (e.level === 2 ? '    ' : '') + e.title; const y = doc.y; doc.fillColor(hex(e.level === 1 ? C.dark : C.ink)).font(F(label, e.level === 1)).fontSize(e.level === 1 ? 10.5 : 9.5).text(label, m, y, { width: W() - 40, align: rtl ? 'right' : 'left' }); doc.text(String(e.page), m + W() - 36, y, { width: 36, align: 'right' }); } }
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i); if (i === 0 && fmt.cover) continue; const pw = doc.page.width - 2 * m;
    doc.fillColor(hex(C.medium)).font(F(model.title)).fontSize(8).text([fmt.header || model.title, meta.classification].filter(Boolean).join(' · '), m, m / 2, { width: pw, align: rtl ? 'left' : 'right', lineBreak: false });
    if (fmt.pageNumbers) doc.fillColor(hex(C.medium)).font('body').fontSize(8).text(`${fmt.footer ? fmt.footer + ' · ' : ''}${meta.reference} · ${tx('page', lang)} ${i + 1} ${tx('of', lang)} ${range.count}`, m, doc.page.height - m / 2 - 10, { width: pw, align: 'center', lineBreak: false });
  }
  doc.end(); return done;
}

/* --------------------------------------------------------------------------------------------- EXCEL */
export async function toXlsx(model, meta) {
  const lang = model.lang; const fmt = meta.formatting; const sections = numbered(model, fmt);
  const wb = new ExcelJS.Workbook(); wb.creator = meta.orgName || 'CortexSkills'; wb.created = new Date(); wb.title = model.title; wb.subject = meta.classification;
  const ws = wb.addWorksheet('Document', { views: [{ rightToLeft: lang === 'ar' }], pageSetup: { paperSize: 9, orientation: fmt.orientation, fitToPage: true, fitToWidth: 1, fitToHeight: 0 }, headerFooter: { oddHeader: `&R${(fmt.header || model.title).replace(/&/g, '&&')} · ${meta.classification}`, oddFooter: `&C${meta.reference} · ${tx('page', lang)} &P ${tx('of', lang)} &N` } });
  const font = { name: fmt.bodyFont === 'Times New Roman' ? 'Calibri' : fmt.bodyFont, size: 10, color: { argb: 'FF' + C.ink } };
  let r = 1; const put = (v, f, fill) => { const c = ws.getCell(r, 1); c.value = v; c.font = f; if (fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + fill } }; c.alignment = { wrapText: true, vertical: 'top' }; r++; };
  put(model.title, { name: 'Cambria', size: 16, bold: true, color: { argb: 'FF' + C.dark } }); put(`${meta.reference} · ${meta.versionLabel} · ${meta.statusLabel} · ${meta.classification}`, { ...font, italic: true }); r++;
  const border = () => { const b = { style: 'thin', color: { argb: 'FF' + C.line } }; return { top: b, left: b, bottom: b, right: b }; };
  const table = (cols, rows) => {
    if (cols) { cols.forEach((c, i) => { const x = ws.getCell(r, i + 1); x.value = c; x.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }; x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + fmt.tableHeader } }; x.border = border(); x.alignment = { wrapText: true, vertical: 'top' }; }); r++; }
    rows.forEach((row, k) => { row.forEach((v, i) => { const x = ws.getCell(r, i + 1); x.value = v; x.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF' + C.ink }, bold: !cols && i === 0 }; x.alignment = { wrapText: true, vertical: 'top' }; x.border = border();
      if (k % 2 || (!cols && i === 0)) x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.light } };
      // Conditional colouring uses the status scale only (NFR-DA-VDS-20).
      const s = { Green: 'D9EAD3', Vert: 'D9EAD3', Amber: 'FBE0B5', Ambre: 'FBE0B5', Red: 'F4C7C3', Rouge: 'F4C7C3' }[String(v).split(' ')[0]]; if (s) x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + s } }; }); r++; });
    r++;
  };
  const image = (buf, wpx, hpx) => { const sz = imageSize(buf); if (!sz) return; const id = wb.addImage({ buffer: buf, extension: sz.type === 'jpg' ? 'jpeg' : 'png' }); const w = Math.min(900, wpx || sz.w); const h = w * sz.h / sz.w; ws.addImage(id, { tl: { col: 0, row: r - 1 }, ext: { width: w, height: h } }); r += Math.ceil(h / 20) + 1; };
  if (meta.profile?.identification !== false) { put(tx('identification', lang), { name: 'Cambria', size: 12, bold: true, color: { argb: 'FF' + fmt.headingColor } }); table([tx('field', lang), tx('value', lang)], meta.identification); }
  for (const s of sections) {
    if (s.heading && !s.formatting?.hideTitle) put(s.heading, { name: 'Cambria', size: 12, bold: true, color: { argb: 'FF' + fmt.headingColor } });
    if (s.text) put(s.text, { ...font, italic: !!s.notice }, s.notice || s.formatting?.callout ? C.tint : null);
    if (s.diagram) { try { const d = diagramPng(s.diagram); image(d.png, 900); } catch { put(s.diagram.title, font); } }
    if (s.picture?.buffer) image(s.picture.buffer, 480);
    if (s.kv?.length) table(null, s.kv);
    if (s.table) table(s.table.columns, s.table.rows);
    for (const x of s.subsections || []) { put(x.heading, { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + C.dark } }); if (x.text) put(x.text, { ...font, italic: !!x.notice }); if (x.kv) table(null, x.kv); if (x.table) table(x.table.columns, x.table.rows); }
    if (s.approval) table([tx('role', lang), tx('name', lang), tx('date', lang), tx('signature', lang)], meta.approvalRows);
  }
  if (meta.overrides?.length) { put(tx('overrides', lang), { name: 'Cambria', size: 12, bold: true, color: { argb: 'FF' + fmt.headingColor } }); table([tx('field', lang), tx('value', lang)], meta.overrides); }
  if (meta.profile?.approval !== false) { put(tx('approval', lang), { name: 'Cambria', size: 12, bold: true, color: { argb: 'FF' + fmt.headingColor } }); table([tx('role', lang), tx('name', lang), tx('date', lang), tx('signature', lang)], meta.approvalRows); }
  ws.columns.forEach((c, i) => { c.width = i === 0 ? 30 : 26; });
  const src = wb.addWorksheet(tx('sources', lang).slice(0, 30)); src.addRow([tx('sources', lang), tx('records', lang), tx('step', lang)]).eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + fmt.tableHeader } }; });
  for (const s of meta.sources || []) src.addRow(s); src.columns.forEach(c => { c.width = 34; });
  return Buffer.from(await wb.xlsx.writeBuffer());
}
export const MIME = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
export async function exportDocument(model, meta, format) {
  if (format === 'pdf') return toPdf(model, meta); if (format === 'xlsx') return toXlsx(model, meta); if (format === 'docx') return toDocx(model, meta); throw new Error('format');
}
void t;
