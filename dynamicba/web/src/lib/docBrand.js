// src/lib/docBrand.js
// Brand styling for DynamicBA's own generated Word documents (Times New Roman,
// orange/grey palette, Heading 1-3 styles, auto TOC, running header/footer) — the
// same visual identity used for the Installation/User Guides, applied here to the
// app's own Export & Handoff output.
import {
  Document, Paragraph, TextRun, HeadingLevel, Header, Footer, PageNumber, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, TableOfContents,
  PageBreak, VerticalAlign,
} from 'docx'

export const COLOR = {
  orange: 'F8931D',
  orangeDeep: 'E07B00',
  orangeTint: 'FDEEDA',
  greyDark: '3A3A3C',
  greyInk: '58595B',
  greyMedium: '808184',
  greyLight: 'F2F2F3',
  greyLine: 'E3E3E4',
  white: 'FFFFFF',
}
export const FONT = 'Times New Roman'

const styles = {
  default: {
    document: {
      run: { font: FONT, size: 24, color: COLOR.greyInk }, // 12pt body per the brand guide
      paragraph: { spacing: { line: 276, after: 160 }, alignment: AlignmentType.JUSTIFIED },
    },
  },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: FONT, size: 34, bold: true, color: COLOR.orangeDeep }, // 17pt
      paragraph: { spacing: { before: 360, after: 200 }, border: { bottom: { color: COLOR.orangeDeep, space: 4, style: BorderStyle.SINGLE, size: 6 } }, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: FONT, size: 27, bold: true, color: COLOR.greyDark }, // 13.5pt
      paragraph: { spacing: { before: 260, after: 140 }, outlineLevel: 1 } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: FONT, size: 24, bold: true, color: COLOR.orangeDeep }, // 12pt
      paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
  ],
}

export function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: FONT, size: 34, bold: true, color: COLOR.orangeDeep })] }) }
export function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: FONT, size: 27, bold: true, color: COLOR.greyDark })] }) }
export function h3(text) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: COLOR.orangeDeep })] }) }
export function pPara(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { line: 276, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 24, color: COLOR.greyInk, bold: !!opts.bold, italics: !!opts.italics })],
  })
}
export function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 100 }, children: [new TextRun({ text, font: FONT, size: 24, color: COLOR.greyInk })] })
}
export function caption(text) {
  return new Paragraph({ spacing: { before: 60, after: 200 }, children: [new TextRun({ text, font: FONT, size: 19, italics: true, color: COLOR.greyInk })] })
}
export function spacer(h = 100) { return new Paragraph({ spacing: { after: h }, children: [] }) }
export function pageBreak() { return new Paragraph({ children: [new PageBreak()] }) }

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shade ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.shade } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ''), font: FONT, size: 19, bold: !!opts.bold, color: opts.color || COLOR.greyInk })] })], // 9.5pt table text
  })
}

export function brandTable(headers, rows, columnWidths) {
  const total = columnWidths.reduce((a, b) => a + b, 0)
  const headerRow = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { width: columnWidths[i], shade: COLOR.orange, bold: true, color: COLOR.white })) })
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((v, i) => cell(v, { width: columnWidths[i], shade: ri % 2 === 1 ? COLOR.greyLight : undefined })),
  }))
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: COLOR.greyLine }, bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR.greyLine },
      left: { style: BorderStyle.SINGLE, size: 2, color: COLOR.greyLine }, right: { style: BorderStyle.SINGLE, size: 2, color: COLOR.greyLine },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: COLOR.greyLine }, insideVertical: { style: BorderStyle.SINGLE, size: 2, color: COLOR.greyLine },
    },
    rows: [headerRow, ...bodyRows],
  })
}

export function coverPage({ title, subtitle, client, project, preparedFor, preparedBy, date, status }) {
  return [
    spacer(500),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Dynamic', font: FONT, size: 40, bold: true, color: COLOR.greyDark }), new TextRun({ text: 'BA', font: FONT, size: 40, bold: true, color: COLOR.orange })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 }, children: [new TextRun({ text: 'AI-assisted scope-to-specs automation', font: FONT, size: 18, italics: true, color: COLOR.greyMedium })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 150 }, border: { bottom: { color: COLOR.orangeDeep, space: 8, style: BorderStyle.SINGLE, size: 8 } }, children: [new TextRun({ text: title, font: FONT, size: 48, bold: true, color: COLOR.orangeDeep })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: subtitle, font: FONT, size: 26, color: COLOR.greyDark })] }),
    spacer(400),
    coverRow('Client', client), coverRow('Project / Engagement', project), coverRow('Prepared for', preparedFor),
    coverRow('Prepared by', preparedBy), coverRow('Date', date), coverRow('Sign-Off Status', status),
    pageBreak(),
  ]
}
function coverRow(label, value) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 110 }, children: [
    new TextRun({ text: `${label}:  `, font: FONT, size: 20, bold: true, color: COLOR.greyMedium }),
    new TextRun({ text: String(value ?? '—'), font: FONT, size: 20, color: COLOR.greyDark }),
  ] })
}

export function tocPage() {
  return [h1('Table of Contents'), new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }), pageBreak()]
}

function headerFooter(docTitle) {
  const header = new Header({ children: [new Paragraph({
    border: { bottom: { color: COLOR.greyLine, space: 4, style: BorderStyle.SINGLE, size: 4 } },
    children: [new TextRun({ text: `DynamicBA — ${docTitle}`, font: FONT, size: 14, color: COLOR.greyMedium })],
  })] })
  const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
    new TextRun({ text: 'DynamicBA Specification Package — Page ', font: FONT, size: 14, color: COLOR.greyMedium }),
    new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 14, color: COLOR.greyMedium }),
    new TextRun({ text: ' of ', font: FONT, size: 14, color: COLOR.greyMedium }),
    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 14, color: COLOR.greyMedium }),
  ] })] })
  return { header, footer }
}

export function buildBrandedDocument({ title, subtitle, client, project, preparedFor, preparedBy, date, status, children }) {
  const { header, footer } = headerFooter(title)
  return new Document({
    styles,
    sections: [
      { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        children: [...coverPage({ title, subtitle, client, project, preparedFor, preparedBy, date, status }), ...tocPage()] },
      { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        headers: { default: header }, footers: { default: footer }, children },
    ],
  })
}
