// Server-side report exporters (FR-DA-REP-02/03): PDF, Excel (.xlsx) and Word (.docx), pure JavaScript,
// styled to the suite's visual identity (orange header rows, alternating white / light grey rows).
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType, Footer, PageNumber } from 'docx';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const font = (pkg, file) => path.join(path.dirname(require.resolve(`${pkg}/package.json`)), 'files', file);
const FONTS = {
  sans: font('@fontsource/source-sans-3', 'source-sans-3-latin-400-normal.woff'),
  sansBold: font('@fontsource/source-sans-3', 'source-sans-3-latin-700-normal.woff'),
  serif: font('@fontsource/source-serif-4', 'source-serif-4-latin-700-normal.woff'),
};
const C = { orange: '#F8931D', deep: '#E07B00', tint: '#FDEEDA', dark: '#3A3A3C', ink: '#58595B', medium: '#808184', light: '#F2F2F3', line: '#E3E3E4', white: '#FFFFFF' };
const STATUS_FILL = { met: '#D9EAD3', near: '#FBE0B5', missed: '#F4C7C3', info: '#F2F2F3', none: '#F2F2F3' };
const fmt = (v) => (v == null || v === '' ? '—' : String(v));
const kpiRows = (r) => r.kpis.map((k) => [k.id, k.name, k.value == null ? 'No data' : `${k.value} ${k.unit}`, k.target, k.source]);

export function fileName(key, ext) { return `${key}_${new Date().toISOString().slice(0, 10)}.${ext}`; }

// ------------------------------------------------------------------ PDF
export function toPdf(report) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40, bufferPages: true, info: { Title: `${report.id} ${report.name}` } });
  doc.registerFont('sans', FONTS.sans); doc.registerFont('sansB', FONTS.sansBold); doc.registerFont('serif', FONTS.serif);
  const W = doc.page.width - 80;
  doc.rect(40, 40, 32, 4).fill(C.orange);
  doc.font('sansB').fontSize(9).fillColor(C.dark).text(`${report.id}  ·  ${report.audience.toUpperCase()}  ·  ${report.cadence.toUpperCase()}`, 40, 50, { characterSpacing: 1 });
  doc.font('serif').fontSize(22).fillColor(C.dark).text(report.name, 40, 66);
  doc.font('sans').fontSize(10).fillColor(C.ink).text(`${report.organization} (${report.industry})  ·  generated ${report.generatedAt.slice(0, 16).replace('T', ' ')} UTC`);
  doc.moveDown(1);
  const table = (title, columns, rows, statusCol) => {
    doc.font('serif').fontSize(13).fillColor(C.dark).text(title, 40); doc.moveDown(0.3);
    const cw = W / columns.length; const rowH = 18;
    const header = () => {
      const y = doc.y; doc.rect(40, y, W, rowH).fill(C.orange);
      columns.forEach((c, i) => doc.font('sansB').fontSize(8.5).fillColor(C.white).text(c, 44 + i * cw, y + 5, { width: cw - 8, ellipsis: true, lineBreak: false }));
      doc.y = y + rowH;
    };
    header();
    if (!rows.length) { doc.font('sans').fontSize(9).fillColor(C.ink).text('No records.', 44, doc.y + 4); doc.moveDown(1); return; }
    rows.forEach((r, ri) => {
      if (doc.y + rowH > doc.page.height - 50) { doc.addPage(); header(); }
      const y = doc.y;
      doc.rect(40, y, W, rowH).fill(statusCol != null ? STATUS_FILL[r[statusCol]] || C.white : ri % 2 ? C.light : C.white);
      doc.moveTo(40, y + rowH).lineTo(40 + W, y + rowH).lineWidth(0.5).stroke(C.line);
      r.forEach((v, i) => { if (i !== statusCol) doc.font('sans').fontSize(8.5).fillColor(C.dark).text(fmt(v), 44 + i * cw, y + 5, { width: cw - 8, ellipsis: true, lineBreak: false }); });
      doc.y = y + rowH;
    });
    doc.moveDown(1);
  };
  if (report.kpis.length) table('Key performance indicators', ['KPI', 'Name', 'Value', 'Target', 'Source', ''], report.kpis.map((k) => [...kpiRows({ kpis: [k] })[0], k.status]), 5);
  for (const t of report.tables) table(t.title, t.columns, t.rows);
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(i);
    doc.font('sans').fontSize(8).fillColor(C.medium).text(`CortexPLM  ·  ${report.id} ${report.name}  ·  Page ${i + 1} of ${range.count}`, 40, doc.page.height - 30, { width: W, align: 'right', lineBreak: false });
  }
  doc.end();
  return doc; // stream
}

// ------------------------------------------------------------------ Excel
export async function toXlsx(report) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CortexPLM'; wb.created = new Date();
  const sheet = (name, title, columns, rows) => {
    const ws = wb.addWorksheet(name.slice(0, 31));
    ws.addRow([title]).font = { name: 'Cambria', size: 14, bold: true, color: { argb: 'FF3A3A3C' } };
    ws.addRow([`${report.organization} · ${report.generatedAt.slice(0, 10)}`]).font = { name: 'Calibri', size: 9.5, color: { argb: 'FF58595B' } };
    ws.addRow([]);
    const h = ws.addRow(columns);
    h.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8931D' } }; c.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; c.alignment = { wrapText: true, vertical: 'middle' }; });
    rows.forEach((r, i) => {
      const row = ws.addRow(r.map((v) => (v == null ? '' : v)));
      row.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF3A3A3C' } }; c.alignment = { wrapText: true, vertical: 'top' };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? 'FFF2F2F3' : 'FFFFFFFF' } };
        c.border = { bottom: { style: 'thin', color: { argb: 'FFE3E3E4' } } };
      });
    });
    ws.columns.forEach((c, i) => { c.width = Math.min(48, Math.max(12, String(columns[i] || '').length + 4, ...rows.map((r) => String(r[i] ?? '').length * 0.9))); });
    ws.views = [{ state: 'frozen', ySplit: 4 }];
    return ws;
  };
  if (report.kpis.length) {
    const ws = sheet('KPIs', `${report.id} ${report.name} - KPIs`, ['KPI', 'Name', 'Value', 'Target', 'Source'], kpiRows(report));
    report.kpis.forEach((k, i) => { ws.getRow(5 + i).getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + STATUS_FILL[k.status].slice(1) } }; });
  }
  report.tables.forEach((t, i) => sheet(`Data ${i + 1}`, t.title, t.columns, t.rows));
  return wb.xlsx.writeBuffer();
}

// ------------------------------------------------------------------ Word
export async function toDocx(report) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'E3E3E4' };
  const cell = (text, { header = false, fill } = {}) => new TableCell({
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: header ? 'F8931D' : fill || 'FFFFFF' },
    borders: { top: border, bottom: border, left: border, right: border },
    children: [new Paragraph({ children: [new TextRun({ text: fmt(text), bold: header, color: header ? 'FFFFFF' : '3A3A3C', font: 'Calibri', size: 19 })] })],
  });
  const table = (columns, rows) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ tableHeader: true, children: columns.map((c) => cell(c, { header: true })) }),
      ...rows.map((r, i) => new TableRow({ children: r.map((v) => cell(v, { fill: i % 2 ? 'F2F2F3' : 'FFFFFF' })) }))],
  });
  const h = (text, size = 28) => new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text, font: 'Cambria', bold: true, size, color: '3A3A3C' })] });
  const children = [
    new Paragraph({ children: [new TextRun({ text: `${report.id} · ${report.audience} · ${report.cadence}`.toUpperCase(), bold: true, font: 'Calibri', size: 18, color: '3A3A3C' })] }),
    new Paragraph({ children: [new TextRun({ text: report.name, font: 'Cambria', bold: true, size: 40, color: '3A3A3C' })] }),
    new Paragraph({ children: [new TextRun({ text: `${report.organization} (${report.industry}) · generated ${report.generatedAt.slice(0, 10)}`, font: 'Calibri', size: 20, color: '58595B' })] }),
  ];
  if (report.kpis.length) children.push(h('Key performance indicators'), table(['KPI', 'Name', 'Value', 'Target', 'Source'], kpiRows(report)));
  for (const t of report.tables) children.push(h(t.title), table(t.columns, t.rows.slice(0, 300)));
  const doc = new Document({
    creator: 'CortexPLM', title: report.name,
    sections: [{ properties: { page: { size: { orientation: 'landscape' } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `CortexPLM · ${report.id} · Page `, size: 16, color: '808184' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '808184' }), new TextRun({ text: ' of ', size: 16, color: '808184' }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '808184' })] })] }) },
      children }],
  });
  return Packer.toBuffer(doc);
}

// ------------------------------------------------------------------ Gantt PDF (FR-DA-WBS-06)
export function ganttPdf(wbs, nodes) {
  const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: 36 });
  doc.registerFont('sans', FONTS.sans); doc.registerFont('sansB', FONTS.sansBold); doc.registerFont('serif', FONTS.serif);
  doc.rect(36, 36, 32, 4).fill(C.orange);
  doc.font('sansB').fontSize(9).fillColor(C.dark).text('WORK BREAKDOWN STRUCTURE', 36, 46, { characterSpacing: 1 });
  doc.font('serif').fontSize(20).fillColor(C.dark).text(wbs.name, 36, 60);
  const dated = nodes.filter((n) => n.start && n.end);
  if (!dated.length) { doc.font('sans').fontSize(10).text('No scheduled items.'); doc.end(); return doc; }
  const min = new Date(Math.min(...dated.map((n) => +new Date(n.start)))); const max = new Date(Math.max(...dated.map((n) => +new Date(n.end))));
  const span = Math.max(1, (max - min) / 86400000);
  const left = 36 + 300; const W = doc.page.width - left - 36; const top = 110; const rowH = 16;
  const x = (d) => left + ((new Date(d) - min) / 86400000 / span) * W;
  doc.font('sans').fontSize(7).fillColor(C.medium);
  for (let m = new Date(min.getFullYear(), min.getMonth(), 1); m <= max; m.setMonth(m.getMonth() + 1)) {
    if (m >= min) { doc.moveTo(x(m), top - 4).lineTo(x(m), top + nodes.length * rowH).lineWidth(0.4).stroke(C.line); doc.text(m.toISOString().slice(0, 7), x(m) + 2, top - 12, { lineBreak: false }); }
  }
  const fill = { Completed: '#B6D7A8', 'In progress': C.orange, Overdue: '#F4C7C3', Planned: C.line };
  const pos = {};
  nodes.forEach((n, i) => {
    const y = top + i * rowH; pos[n.id] = { y, n };
    if (i % 2) doc.rect(36, y, doc.page.width - 72, rowH).fill(C.light);
    doc.font(n.summary ? 'sansB' : 'sans').fontSize(8).fillColor(C.dark).text(`${'   '.repeat(n.depth)}${n.name}`, 40, y + 4, { width: 290, ellipsis: true, lineBreak: false });
    if (n.start && n.end) {
      const x1 = x(n.start); const w = Math.max(3, x(n.end) - x1);
      doc.rect(x1, y + 3, w, rowH - 6).fill(n.summary ? C.dark : fill[n.state] || C.line);
      if (!n.summary && n.pct) doc.rect(x1, y + rowH - 5, (w * n.pct) / 100, 2).fill(C.dark);
    }
  });
  doc.lineWidth(0.6);
  nodes.forEach((n) => (n.predecessors || []).forEach((pid) => {
    const a = pos[pid]; const b = pos[n.id];
    if (a?.n.end && b?.n.start) { doc.moveTo(x(a.n.end), a.y + rowH / 2).lineTo(x(a.n.end) + 4, a.y + rowH / 2).lineTo(x(a.n.end) + 4, b.y + rowH / 2).lineTo(x(b.n.start), b.y + rowH / 2).stroke(C.ink); }
  }));
  doc.font('sans').fontSize(8).fillColor(C.ink).text('Grey: planned  ·  Orange: in progress  ·  Green: completed  ·  Red: overdue  ·  Dark: summary', 36, doc.page.height - 40, { oblique: true });
  doc.end();
  return doc;
}
