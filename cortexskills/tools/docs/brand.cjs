// Shared document styling for the Word deliverables: palette, Times New Roman type scale, tables,
// headings, cover, header/footer. Generated with docx (npm) from the server's dependencies.
const path = require('path');
const fs = require('fs');
const D = require(path.join(__dirname, '../../server/node_modules/docx'));
const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, TableOfContents, ImageRun, PageBreak, LevelFormat, TabStopType, LineRuleType } = D;

const C = { orange: 'F8931D', deep: 'E07B00', tint: 'FDEEDA', dark: '3A3A3C', ink: '58595B', medium: '808184', light: 'F2F2F3', line: 'E3E3E4', white: 'FFFFFF',
  s1: 'F4C7C3', s2: 'FBE0B5', s3: 'FFF3B0', s4: 'D9EAD3', s5: 'B6D7A8' };
const FONT = 'Times New Roman';
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 1080, CONTENT = PAGE_W - 2 * MARGIN; // A4, 0.75 in margins → 9746 DXA

const run = (text, o = {}) => new TextRun({ text: String(text ?? ''), font: FONT, size: o.size ?? 24, bold: o.bold, italics: o.italics, color: o.color ?? C.ink, ...(o.extra || {}) });
/** Body paragraph; `parts` is a string or an array of strings / {text, bold, italics, color}. */
function P(parts, o = {}) {
  const arr = Array.isArray(parts) ? parts : [parts];
  return new Paragraph({ alignment: o.align ?? AlignmentType.JUSTIFIED, spacing: { line: 276, lineRule: LineRuleType.AUTO, after: o.after ?? 120, before: o.before ?? 0 }, keepNext: o.keepNext,
    children: arr.map(x => (typeof x === 'string' ? run(x, o) : run(x.text, { ...o, ...x }))) });
}
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { before: 0, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.orange, space: 4 } }, children: [run(t, { size: 34, bold: true, color: C.deep })] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 280, after: 120 }, children: [run(t, { size: 27, bold: true, color: C.dark })] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, spacing: { before: 220, after: 80 }, children: [run(t, { size: 24, bold: true, color: C.deep })] });
const bullet = (parts, level = 0) => new Paragraph({ numbering: { reference: 'bullets', level }, spacing: { line: 276, lineRule: LineRuleType.AUTO, after: 60 }, children: (Array.isArray(parts) ? parts : [parts]).map(x => (typeof x === 'string' ? run(x) : run(x.text, x))) });
const numbered = (parts, ref = 'steps') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { line: 276, lineRule: LineRuleType.AUTO, after: 60 }, children: (Array.isArray(parts) ? parts : [parts]).map(x => (typeof x === 'string' ? run(x) : run(x.text, x))) });
const caption = t => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [run(t, { size: 19, italics: true, color: C.ink })] });
const code = t => new Paragraph({ spacing: { after: 80 }, shading: { type: ShadingType.CLEAR, fill: C.light, color: 'auto' }, indent: { left: 240 }, children: [new TextRun({ text: t, font: 'Courier New', size: 20, color: C.dark })] });
/** Callout box: a single-cell table with the orange tint fill (or grey for notes). */
function callout(title, lines, fill = C.tint) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: C.line };
  return new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [CONTENT], rows: [new TableRow({ children: [new TableCell({
    width: { size: CONTENT, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, margins: { top: 120, bottom: 120, left: 180, right: 180 }, borders: { top: b, bottom: b, left: b, right: b },
    children: [new Paragraph({ spacing: { after: 60 }, children: [run(title, { bold: true, color: C.dark, size: 22 })] }), ...lines.map(l => P(l, { size: 22, align: AlignmentType.LEFT, after: 40 }))] })] })] });
}
/** Branded table: orange header with bold white text, alternating white / light-grey rows, thin grey borders. */
function table(headers, rows, widths, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0); const scale = CONTENT / total; const w = widths.map(x => Math.floor(x * scale)); w[w.length - 1] += CONTENT - w.reduce((a, b) => a + b, 0);
  const b = { style: BorderStyle.SINGLE, size: 4, color: C.line }; const borders = { top: b, bottom: b, left: b, right: b };
  const sz = o.size ?? 19;
  const cell = (content, i, fill, head) => new TableCell({ width: { size: w[i], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, borders, margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: (Array.isArray(content) ? content : [content]).map(c => (c instanceof Paragraph ? c : new Paragraph({ spacing: { after: 20 }, children: (Array.isArray(c?.runs) ? c.runs : [c]).map(x => (x && typeof x === 'object' && 'text' in x ? run(x.text, { size: sz, ...x, color: head ? C.white : x.color ?? C.ink, bold: head || x.bold }) : run(x, { size: sz, color: head ? C.white : C.ink, bold: head }))) }))) });
  return new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: w,
    rows: [new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, i, C.orange, true)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: o.cantSplit ?? true, children: r.map((c, i) => cell(c, i, (o.fills?.[ri]?.[i]) || (ri % 2 ? C.light : C.white), false)) }))] });
}
const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });
/** Screenshot scaled to the content width (optionally narrower), with its caption. */
function shot(file, cap, maxW = 620) {
  if (!fs.existsSync(file)) return [P(`[missing screenshot: ${path.basename(file)}]`)];
  const buf = fs.readFileSync(file); const wpx = buf.readUInt32BE(16), hpx = buf.readUInt32BE(20);
  const width = maxW, height = Math.round((hpx / wpx) * width);
  return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true, children: [new ImageRun({ type: 'png', data: buf, transformation: { width, height }, altText: { title: cap, description: cap, name: path.basename(file) } })] }), caption(cap)];
}
/** Text wordmark (the official logo file could not be downloaded in the build environment). */
function wordmark(size = 56) {
  return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [run('POWER', { size, bold: true, color: C.dark, extra: { characterSpacing: 40 } }), run('ACT', { size, bold: true, color: C.orange, extra: { characterSpacing: 40 } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [run('CONSULTING', { size: 20, color: C.medium, extra: { characterSpacing: 120 } })] })];
}
function cover({ eyebrow, title, subtitle, meta, appLogo }) {
  const items = [spacer(1400), ...wordmark(), spacer(1200)];
  if (appLogo && fs.existsSync(appLogo)) { const buf = fs.readFileSync(appLogo); const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20); items.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new ImageRun({ type: 'png', data: buf, transformation: { width: 220, height: Math.round(220 * h / w) }, altText: { title: 'CortexSkills', description: 'CortexSkills logo', name: 'logo' } })] })); }
  items.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [run(eyebrow.toUpperCase(), { size: 22, bold: true, color: C.deep, extra: { characterSpacing: 60 } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [run(title, { size: 52, bold: true, color: C.dark })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1600 }, children: [run(subtitle, { size: 26, color: C.ink })] }),
    ...meta.map(m => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [run(m, { size: 20, color: C.medium })] })),
    new Paragraph({ children: [new PageBreak()] }));
  return items;
}
function tocPage(title = 'Table of Contents') {
  return [new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.orange, space: 4 } }, children: [run(title, { size: 34, bold: true, color: C.deep })] }),
    new TableOfContents(title, { hyperlink: true, headingStyleRange: '1-3' })];
}
function document({ title, credit, sections, lang = 'en-GB' }) {
  const header = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 4 } }, children: [run(credit, { size: 17, color: C.medium })] })] });
  const footer = new Footer({ children: [new Paragraph({ style: 'PAFooter', tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }], children: [run('POWERACT Consulting · ' + title, { size: 17, color: C.medium }), new TextRun({ text: '\t', font: FONT }),
    run(lang.startsWith('fr') ? 'Page ' : 'Page ', { size: 17, color: C.medium }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 17, color: C.medium }), run(lang.startsWith('fr') ? ' sur ' : ' of ', { size: 17, color: C.medium }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 17, color: C.medium })] })] });
  return new Document({
    creator: 'POWERACT Consulting', title, description: title, features: { updateFields: false },
    styles: {
      default: { document: { run: { font: FONT, size: 24, color: C.ink, language: { value: lang } }, paragraph: { spacing: { line: 276, lineRule: LineRuleType.AUTO } } } },
      paragraphStyles: [
        { id: 'PAFooter', name: 'PA Footer', basedOn: 'Normal', run: { font: FONT, size: 17, color: C.medium }, paragraph: { spacing: { after: 0 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 34, bold: true, color: C.deep }, paragraph: { spacing: { before: 0, after: 200 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 27, bold: true, color: C.dark }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true, color: C.deep }, paragraph: { spacing: { before: 220, after: 80 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'bullets', levels: [0, 1].map(l => ({ level: l, format: LevelFormat.BULLET, text: l ? '–' : '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360 + l * 360, hanging: 260 } }, run: { color: C.orange } } })) },
      ...Array.from({ length: 200 }, (_, i) => ({ reference: 'steps' + (i || ''), levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } }, run: { bold: true, color: C.deep } } }] })),
    ] },
    sections: sections.map((children, i) => ({ properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 500, footer: 500 } }, titlePage: i === 0 },
      headers: { default: header, first: new Header({ children: [] }) }, footers: { default: footer, first: new Footer({ children: [] }) }, children })),
  });
}
module.exports = { D, C, CONTENT, P, H1, H2, H3, bullet, numbered, caption, code, callout, table, spacer, shot, cover, tocPage, document, run, wordmark };
