// Exports any of the 4 standard Reports to PDF, Excel (.xlsx) or Word (.docx),
// styled to the POWERACT Consulting graphical chart (orange header rows,
// Times New Roman body). Built on pdfkit / exceljs / docx — all pure-JS, no
// native/compiled dependencies, consistent with this project's zero-build
// philosophy (see README "Requirements").
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType, HeadingLevel } from 'docx';

const BRAND = {
  orange: 'F8931D', orangeDeep: 'E07B00', greyDark: '3A3A3C', greyInk: '58595B',
  greyLine: 'E3E3E4', greyLight: 'F2F2F3', white: 'FFFFFF',
};

// --- PDF (pdfkit) -----------------------------------------------------

function pdfTable(doc, columns, rows) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  // Column widths are declared as relative proportions (see shapeReport); scale
  // them to fill exactly usableWidth so the header bar and every cell line up,
  // regardless of how many columns a given report declares.
  const declaredTotal = columns.reduce((s, c) => s + (c.width || 80), 0);
  const scale = usableWidth / declaredTotal;
  const colWidths = columns.map((c) => (c.width || 80) * scale);
  const rowHeight = 20;
  const cellTextOpts = (w) => ({ width: w - 8, height: rowHeight - 8, ellipsis: true, lineBreak: false });

  function drawHeader(y) {
    doc.rect(startX, y, usableWidth, rowHeight).fill(`#${BRAND.orange}`);
    doc.font('Helvetica-Bold').fontSize(8.5);
    let x = startX;
    columns.forEach((c, i) => {
      doc.fillColor(`#${BRAND.white}`).text(c.label, x + 4, y + 6, cellTextOpts(colWidths[i]));
      x += colWidths[i];
    });
    return y + rowHeight;
  }

  let y = drawHeader(doc.y);
  doc.font('Times-Roman').fontSize(8.5);
  rows.forEach((row, idx) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = drawHeader(doc.page.margins.top);
      doc.font('Times-Roman').fontSize(8.5);
    }
    if (idx % 2 === 1) doc.rect(startX, y, usableWidth, rowHeight).fill(`#${BRAND.greyLight}`);
    let x = startX;
    columns.forEach((c, i) => {
      doc.fillColor(`#${BRAND.greyInk}`).text(String(row[c.key] ?? ''), x + 4, y + 6, cellTextOpts(colWidths[i]));
      x += colWidths[i];
    });
    doc.moveTo(startX, y + rowHeight).lineTo(startX + usableWidth, y + rowHeight).strokeColor(`#${BRAND.greyLine}`).lineWidth(0.5).stroke();
    y += rowHeight;
  });
  doc.y = y + 10;
}

export function buildPdf({ title, subtitle, sections }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${BRAND.orangeDeep}`).text('POWERACT CONSULTING', { characterSpacing: 1 });
    doc.font('Times-Bold').fontSize(20).fillColor(`#${BRAND.greyDark}`).text(title, { paragraphGap: 2 });
    if (subtitle) doc.font('Times-Italic').fontSize(10).fillColor(`#${BRAND.greyInk}`).text(subtitle);
    doc.moveDown(1);

    for (const section of sections) {
      if (doc.y > doc.page.height - 120) doc.addPage();
      doc.font('Times-Bold').fontSize(12).fillColor(`#${BRAND.orangeDeep}`).text(section.heading);
      doc.moveDown(0.3);
      if (section.rows.length === 0) {
        doc.font('Times-Italic').fontSize(9).fillColor(`#${BRAND.greyInk}`).text('No data.');
      } else {
        pdfTable(doc, section.columns, section.rows);
      }
      doc.moveDown(0.5);
    }
    doc.end();
  });
}

// --- Excel (.xlsx via exceljs) -----------------------------------------

export async function buildXlsx({ title, sections }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NCP Solver — DynamicMS Suite (POWERACT Consulting)';
  wb.created = new Date();

  for (const section of sections) {
    const sheet = wb.addWorksheet(section.heading.slice(0, 31) || 'Report');
    sheet.columns = section.columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(12, Math.round((c.width || 90) / 6)) }));
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: `FF${BRAND.white}` } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND.orange}` } };
      cell.border = { bottom: { style: 'thin', color: { argb: `FF${BRAND.greyLine}` } } };
    });
    section.rows.forEach((row, idx) => {
      const r = sheet.addRow(row);
      if (idx % 2 === 1) {
        r.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND.greyLight}` } }; });
      }
      r.eachCell((cell) => { cell.border = { bottom: { style: 'thin', color: { argb: `FF${BRAND.greyLine}` } } }; });
    });
  }
  return wb.xlsx.writeBuffer();
}

// --- Word (.docx via docx) ---------------------------------------------

function docxTable(columns, rows) {
  const totalWidth = 9360;
  const colWidths = columns.map((c) => Math.round((c.width || 90) * (totalWidth / columns.reduce((s, cc) => s + (cc.width || 90), 0))));
  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map((c, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: BRAND.orange, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: c.label, bold: true, color: BRAND.white, font: 'Times New Roman', size: 18 })] })],
    })),
  });
  const bodyRows = rows.map((row, idx) => new TableRow({
    children: columns.map((c, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: idx % 2 === 1 ? { fill: BRAND.greyLight, type: ShadingType.CLEAR } : undefined,
      margins: { top: 50, bottom: 50, left: 80, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: String(row[c.key] ?? ''), font: 'Times New Roman', size: 17, color: BRAND.greyInk })] })],
    })),
  }));
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: BRAND.greyLine }, bottom: { style: BorderStyle.SINGLE, size: 2, color: BRAND.greyLine },
      left: { style: BorderStyle.SINGLE, size: 2, color: BRAND.greyLine }, right: { style: BorderStyle.SINGLE, size: 2, color: BRAND.greyLine },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: BRAND.greyLine }, insideVertical: { style: BorderStyle.SINGLE, size: 2, color: BRAND.greyLine },
    },
    rows: [headerRow, ...bodyRows],
  });
}

export function buildDocx({ title, subtitle, sections }) {
  const children = [
    new Paragraph({ children: [new TextRun({ text: 'POWERACT CONSULTING', bold: true, color: BRAND.orangeDeep, font: 'Times New Roman', size: 18 })] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 100, after: 100 },
      border: { bottom: { color: BRAND.orangeDeep, space: 4, style: BorderStyle.SINGLE, size: 8 } },
      children: [new TextRun({ text: title, bold: true, color: BRAND.orangeDeep, font: 'Times New Roman', size: 34 })] }),
  ];
  if (subtitle) children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: subtitle, italics: true, font: 'Times New Roman', size: 20, color: BRAND.greyInk })] }));

  for (const section of sections) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 },
      children: [new TextRun({ text: section.heading, bold: true, color: BRAND.greyDark, font: 'Times New Roman', size: 24 })] }));
    if (section.rows.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'No data.', italics: true, font: 'Times New Roman', size: 20, color: BRAND.greyInk })] }));
    } else {
      children.push(docxTable(section.columns, section.rows));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 20, color: BRAND.greyInk } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children }],
  });
  return Packer.toBuffer(doc);
}

// --- Report -> {title, subtitle, sections} shaping ----------------------

export function shapeReport(reportKey, payload) {
  const now = new Date().toLocaleDateString();
  switch (reportKey) {
    case 'operational':
      return {
        title: 'Operational NCP Dashboard', subtitle: `Open / in-progress NCP Sheets — generated ${now}`,
        sections: [{
          heading: 'Open & In-Progress Sheets',
          columns: [
            { key: 'fiche_number', label: 'Sheet #', width: 70 }, { key: 'title', label: 'Title', width: 200 },
            { key: 'current_stage', label: 'Stage', width: 45 }, { key: 'ageingDays', label: 'Ageing (d)', width: 55 },
            { key: 'criticality', label: 'Criticality', width: 60 }, { key: 'priority', label: 'Priority', width: 45 },
            { key: 'immediateProgress', label: 'AI %', width: 45 }, { key: 'correctiveProgress', label: 'AC %', width: 45 },
          ],
          rows: payload,
        }],
      };
    case 'action-plan':
      return {
        title: 'Action Plan Monitoring Report', subtitle: `All actions — generated ${now}`,
        sections: [{
          heading: 'Actions',
          columns: [
            { key: 'fiche_number', label: 'Sheet #', width: 65 }, { key: 'description', label: 'Description', width: 220 },
            { key: 'ownerName', label: 'Owner', width: 90 }, { key: 'planned_completion_date', label: 'Planned Date', width: 65 },
            { key: 'status', label: 'Status', width: 55 }, { key: 'overdue', label: 'Overdue', width: 45 },
          ],
          rows: payload.map((a) => ({ ...a, overdue: a.overdue ? 'Yes' : 'No' })),
        }],
      };
    case 'scorecard':
      return {
        title: 'Strategic Problem-Solving Scorecard', subtitle: `Generated ${now}`,
        sections: [
          {
            heading: 'Key Performance Indicators', columns: [{ key: 'name', label: 'KPI', width: 260 }, { key: 'value', label: 'Value', width: 80 }],
            rows: Object.entries(payload.kpis).filter(([k]) => k !== 'raw')
              .map(([k, v]) => ({ name: k, value: typeof v === 'number' && k !== 'kpi9_nc_count_total' ? `${v}%` : v })),
          },
          { heading: 'Priority Distribution', columns: [{ key: 'priority', label: 'Priority', width: 100 }, { key: 'c', label: 'Count', width: 80 }], rows: payload.priorityDist },
          { heading: 'Non-Conformities by Department', columns: [{ key: 'department', label: 'Department', width: 200 }, { key: 'c', label: 'Count', width: 80 }], rows: payload.byDepartment },
          { heading: 'Criticality Distribution', columns: [{ key: 'criticality', label: 'Criticality', width: 100 }, { key: 'c', label: 'Count', width: 80 }], rows: payload.criticalityDist },
        ],
      };
    case 'capitalization':
      return {
        title: 'Capitalization & Lessons Learned Log', subtitle: `Closed sheets — generated ${now}`,
        sections: [{
          heading: 'Lessons Learned',
          columns: [
            { key: 'fiche_number', label: 'Sheet #', width: 65 }, { key: 'title', label: 'Title', width: 180 },
            { key: 'closure_date', label: 'Closed', width: 60 }, { key: 'lessons_learned', label: 'Lessons Learned', width: 260 },
            { key: 'needs_standardization', label: 'Standardized', width: 60 }, { key: 'needs_generalization', label: 'Generalized', width: 60 },
          ],
          rows: payload.map((r) => ({ ...r, needs_standardization: r.needs_standardization ? 'Yes' : 'No', needs_generalization: r.needs_generalization ? 'Yes' : 'No' })),
        }],
      };
    default:
      throw new Error('unknown_report');
  }
}
