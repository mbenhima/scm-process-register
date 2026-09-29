// Report exporters. Every file follows the application's visual identity: serif titles, humanist sans body,
// orange table headers with white bold text, alternating white / light-grey rows, thin grey borders.
import path from 'node:path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, BorderStyle, HeadingLevel, Footer, PageNumber } from 'docx';
import { ROOT } from '../config.js';
import { t } from '../i18n.js';

const C = { orange: 'F8931D', orangeDeep: 'E07B00', tint: 'FDEEDA', dark: '3A3A3C', ink: '58595B', medium: '808184', light: 'F2F2F3', line: 'E3E3E4', white: 'FFFFFF' };
const F = n => path.join(ROOT, 'assets', 'fonts', n);
const isAr = s => /[؀-ۿ]/.test(String(s));

export async function toPdf(model) {
  const rtl = model.lang === 'ar';
  const doc = new PDFDocument({ size: 'A4', margin: 54, bufferPages: true, info: { Title: model.title } });
  doc.registerFont('serif', F('SourceSerif4-700.ttf')); doc.registerFont('sans', F('SourceSans3-400.ttf'));
  doc.registerFont('sansB', F('SourceSans3-700.ttf')); doc.registerFont('italic', F('SourceSans3-400i.ttf'));
  doc.registerFont('ar', F('NotoNaskhArabic-400.ttf')); doc.registerFont('arB', F('NotoNaskhArabic-700.ttf'));
  const font = (s, bold, serif) => (isAr(s) ? (bold || serif ? 'arB' : 'ar') : serif ? 'serif' : bold ? 'sansB' : 'sans');
  const align = rtl ? 'right' : 'left';
  const W = doc.page.width - 108;
  const chunks = []; doc.on('data', c => chunks.push(c));
  const done = new Promise(r => doc.on('end', () => r(Buffer.concat(chunks))));

  doc.rect(0, 0, doc.page.width, 6).fill('#' + C.orange);
  doc.fillColor('#' + C.orangeDeep).font(font(model.id, true)).fontSize(10).text(`${model.id} · ${model.cadence}`.toUpperCase(), 54, 40, { align, characterSpacing: 1 });
  doc.moveDown(0.3).fillColor('#' + C.dark).font(font(model.title, true, true)).fontSize(22).text(model.title, { align });
  doc.fillColor('#' + C.ink).font(font(model.subtitle)).fontSize(11).text(model.subtitle, { align });
  doc.fillColor('#' + C.medium).fontSize(9).font(font(model.audience)).text(`${t('report.audience', model.lang)}: ${model.audience}`, { align });
  doc.moveDown(1);
  for (const s of model.sections) {
    if (doc.y > doc.page.height - 140) doc.addPage();
    doc.fillColor('#' + C.orangeDeep).font(font(s.heading, true, true)).fontSize(14).text(s.heading, 54, doc.y, { align, width: W });
    doc.moveTo(54, doc.y + 2).lineTo(54 + W, doc.y + 2).lineWidth(0.8).strokeColor('#' + C.line).stroke(); doc.moveDown(0.5);
    if (s.text) doc.fillColor('#' + C.ink).font(font(s.text)).fontSize(10).text(s.text, { align, width: W }).moveDown(0.4);
    if (s.table) drawTable(doc, s.table, W, font, rtl);
    doc.moveDown(0.8);
  }
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#' + C.medium).font('sans').fontSize(8).text(`CortexSkills · ${model.id} · ${model.generated.slice(0, 10)} · ${i + 1} / ${range.count}`, 54, doc.page.height - 36, { width: W, align: 'center', lineBreak: false });
  }
  doc.end();
  return done;
}
function drawTable(doc, table, W, font, rtl) {
  const n = table.columns.length; const colW = W / n; const pad = 4;
  let cols = table.columns.map((_, i) => i); if (rtl) cols = cols.reverse();
  const rowH = (row, size, bold) => Math.max(...row.map(c => doc.font(font(c, bold)).fontSize(size).heightOfString(String(c ?? ''), { width: colW - pad * 2 }))) + pad * 2;
  const draw = (row, y, fill, color, size, bold) => {
    const h = rowH(row, size, bold);
    doc.rect(54, y, W, h).fill(fill);
    cols.forEach((ci, k) => {
      const x = 54 + k * colW;
      doc.fillColor(color).font(font(row[ci], bold)).fontSize(size).text(String(row[ci] ?? ''), x + pad, y + pad, { width: colW - pad * 2, align: rtl ? 'right' : 'left' });
      doc.rect(x, y, colW, h).lineWidth(0.5).strokeColor('#' + C.line).stroke();
    });
    return h;
  };
  let y = doc.y; y += draw(table.columns, y, '#' + C.orange, '#FFFFFF', 9, true);
  table.rows.forEach((r, i) => {
    const h = rowH(r, 8.5);
    if (y + h > doc.page.height - 60) { doc.addPage(); y = 54; y += draw(table.columns, y, '#' + C.orange, '#FFFFFF', 9, true); }
    y += draw(r, y, i % 2 ? '#' + C.light : '#FFFFFF', '#' + C.ink, 8.5, false);
  });
  doc.y = y + 4; doc.x = 54;
}

export async function toXlsx(model) {
  const wb = new ExcelJS.Workbook(); wb.creator = 'CortexSkills'; wb.created = new Date();
  const ws = wb.addWorksheet(model.id, { views: [{ rightToLeft: model.lang === 'ar', state: 'frozen', ySplit: 3 }] });
  ws.getCell('A1').value = model.title; ws.getCell('A1').font = { name: 'Cambria', size: 16, bold: true, color: { argb: 'FF' + C.dark } };
  ws.getCell('A2').value = model.subtitle; ws.getCell('A2').font = { name: 'Calibri', size: 10, color: { argb: 'FF' + C.ink } };
  let r = 4;
  for (const s of model.sections) {
    const h = ws.getCell(r, 1); h.value = s.heading; h.font = { name: 'Cambria', size: 12, bold: true, color: { argb: 'FF' + C.orangeDeep } }; r++;
    if (s.text) { ws.getCell(r, 1).value = s.text; ws.getCell(r, 1).font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF' + C.ink } }; r++; }
    if (!s.table) { r++; continue; }
    s.table.columns.forEach((c, i) => {
      const x = ws.getCell(r, i + 1); x.value = c;
      x.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } }; x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.orange } };
      x.border = border(); x.alignment = { wrapText: true, vertical: 'top' };
    });
    r++;
    s.table.rows.forEach((row, k) => {
      row.forEach((v, i) => {
        const x = ws.getCell(r, i + 1); const num = Number(String(v).replace('%', ''));
        x.value = v !== '' && !Number.isNaN(num) && /^[\d.\-]+%?$/.test(String(v)) ? num : v;
        x.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF' + C.ink } }; x.alignment = { wrapText: true, vertical: 'top' }; x.border = border();
        if (k % 2) x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.light } };
        const rag = { Green: 'D9EAD3', Amber: 'FBE0B5', Red: 'F4C7C3' }[v]; if (rag) x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rag } };
      });
      r++;
    });
    r++;
  }
  ws.columns.forEach((c, i) => { c.width = i === 0 ? 22 : 28; });
  return Buffer.from(await wb.xlsx.writeBuffer());
}
const border = () => { const b = { style: 'thin', color: { argb: 'FF' + C.line } }; return { top: b, left: b, bottom: b, right: b }; };

export async function toDocx(model) {
  const rtl = model.lang === 'ar';
  const P = (text, o = {}) => new Paragraph({ bidirectional: rtl, alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { after: 120 }, ...o.p,
    children: [new TextRun({ text: String(text ?? ''), font: o.font || 'Calibri', size: o.size || 22, bold: o.bold, italics: o.italics, color: o.color || C.ink, rightToLeft: rtl, allCaps: o.caps, characterSpacing: o.spacing })] });
  const children = [
    P(`${model.id} · ${model.cadence}`, { bold: true, color: C.orangeDeep, size: 18, caps: true, spacing: 20 }),
    P(model.title, { font: 'Cambria', bold: true, size: 40, color: C.dark, p: { heading: HeadingLevel.TITLE } }),
    P(model.subtitle, { color: C.ink }), P(`${t('report.audience', model.lang)}: ${model.audience}`, { color: C.medium, size: 18 }),
  ];
  for (const s of model.sections) {
    children.push(P(s.heading, { font: 'Cambria', bold: true, size: 28, color: C.orangeDeep, p: { heading: HeadingLevel.HEADING_1, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.line } } } }));
    if (s.text) children.push(P(s.text, { italics: true }));
    if (s.table) {
      const b = { style: BorderStyle.SINGLE, size: 4, color: C.line }; const borders = { top: b, bottom: b, left: b, right: b };
      const row = (cells, head, k) => new TableRow({ tableHeader: head, children: cells.map(c => new TableCell({ borders,
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: head ? C.orange : k % 2 ? C.light : C.white },
        children: [P(c, { bold: head, color: head ? C.white : C.ink, size: 18 })] })) });
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, visuallyRightToLeft: rtl, rows: [row(s.table.columns, true, 0), ...s.table.rows.map((r, k) => row(r, false, k))] }));
      children.push(P(''));
    }
  }
  const doc = new Document({ creator: 'CortexSkills', title: model.title,
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CortexSkills · ${model.id} · `, size: 16, color: C.medium, font: 'Calibri' }), new TextRun({ children: [PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], size: 16, color: C.medium, font: 'Calibri' })] })] }) },
      children }] });
  return Packer.toBuffer(doc);
}

export const MIME = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
export async function exportModel(model, format) {
  if (format === 'pdf') return toPdf(model);
  if (format === 'xlsx') return toXlsx(model);
  if (format === 'docx') return toDocx(model);
  throw new Error('format');
}
