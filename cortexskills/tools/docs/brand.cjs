// Shared document styling for the Word deliverables, following the AI Value Graphical Chart v1.2 (§13.1, §8.17, §9):
// A4 with 2 cm margins, Open Sans 11 pt Ink body, Montserrat Navy headings, Navy table headers with white/#F5F8FB rows,
// 1 px Line borders, Lucide-style restraint, the AI Value logo on the cover and the horizontal lockup in the header.
// Generated with docx (npm) from the server's dependencies.
const path = require('path');
const fs = require('fs');
const D = require(path.join(__dirname, '../../server/node_modules/docx'));
const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, TableOfContents, ImageRun, PageBreak, LevelFormat, TabStopType, LineRuleType } = D;

/** AI Value core palette (§3.1, §17). The former names stay as aliases so every builder keeps working. */
const P_ = { navy: '123A5F', navyDark: '0D2A47', azure: '1876C6', green: '28C87C', teal: '17A2B8', ink: '2C3E50', muted: '5A6B7B',
  white: 'FFFFFF', bg: 'F5F8FB', line: 'E1E8F0', azureTint: 'E8F1FB', greenTint: 'E7F9F0', tealTint: 'E6F6F8' };
const C = { ...P_, orange: P_.azure, deep: P_.navy, tint: P_.azureTint, dark: P_.navy, medium: P_.muted, light: P_.bg,
  s1: 'F4C7C3', s2: 'FBE0B5', s3: 'FFF3B0', s4: 'D9EAD3', s5: 'B6D7A8' };
const FONT = 'Open Sans', HEAD = 'Montserrat', MONO = 'JetBrains Mono';
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 1134, CONTENT = PAGE_W - 2 * MARGIN; // A4, 2 cm margins → 9638 DXA
const BRAND = path.join(__dirname, 'brand');
const LOGO_FULL = path.join(BRAND, 'aivalue-logo-900.png'), LOGO_HOR = path.join(BRAND, 'aivalue-lockup.png');
const FONTS_DIR = path.join(__dirname, 'fonts');

const run = (text, o = {}) => new TextRun({ text: String(text ?? ''), font: o.font || FONT, size: o.size ?? 22, bold: o.bold, italics: o.italics, color: o.color ?? C.ink, ...(o.extra || {}) });
/** Body paragraph; `parts` is a string or an array of strings / {text, bold, italics, color}. */
function P(parts, o = {}) {
  const arr = Array.isArray(parts) ? parts : [parts];
  return new Paragraph({ alignment: o.align ?? AlignmentType.LEFT, spacing: { line: 288, lineRule: LineRuleType.AUTO, after: o.after ?? 160, before: o.before ?? 0 }, keepNext: o.keepNext,
    children: arr.map(x => (typeof x === 'string' ? run(x, o) : run(x.text, { ...o, ...x }))) });
}
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { before: 0, after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.line, space: 6 } }, children: [run(t, { font: HEAD, size: 40, bold: true, color: C.navy })] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 320, after: 120 }, children: [run(t, { font: HEAD, size: 32, bold: true, color: C.navy })] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, spacing: { before: 240, after: 80 }, children: [run(t, { font: HEAD, size: 26, bold: true, color: C.navy })] });
const bullet = (parts, level = 0) => new Paragraph({ numbering: { reference: 'bullets', level }, spacing: { line: 288, lineRule: LineRuleType.AUTO, after: 80 }, children: (Array.isArray(parts) ? parts : [parts]).map(x => (typeof x === 'string' ? run(x) : run(x.text, x))) });
const numbered = (parts, ref = 'steps') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { line: 288, lineRule: LineRuleType.AUTO, after: 80 }, children: (Array.isArray(parts) ? parts : [parts]).map(x => (typeof x === 'string' ? run(x) : run(x.text, x))) });
/** Chart and figure caption: short, italic, Muted (§9.3). */
const caption = t => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [run(t, { size: 18, italics: true, color: C.muted })] });
const code = t => new Paragraph({ spacing: { after: 80 }, shading: { type: ShadingType.CLEAR, fill: C.bg, color: 'auto' }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.azure, space: 8 } }, indent: { left: 240 }, children: [new TextRun({ text: t, font: MONO, size: 18, color: C.navy })] });
/** Callout box: a single-cell table on the Azure tint (or Background for notes), 1 px Line border. */
function callout(title, lines, fill = C.azureTint) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: C.line };
  return new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [CONTENT], rows: [new TableRow({ children: [new TableCell({
    width: { size: CONTENT, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, margins: { top: 160, bottom: 160, left: 220, right: 220 }, borders: { top: b, bottom: b, left: b, right: b },
    children: [new Paragraph({ spacing: { after: 80 }, children: [run(title, { font: HEAD, bold: true, color: C.navy, size: 22 })] }), ...lines.map(l => P(l, { size: 21, after: 60 }))] })] })] });
}
/** Branded table (§8.17): Navy header with bold white text, alternating White / Background rows, 1 px Line borders. */
function table(headers, rows, widths, o = {}) {
  const CW = o.width ?? CONTENT; const total = widths.reduce((a, b) => a + b, 0); const scale = CW / total; const w = widths.map(x => Math.floor(x * scale)); w[w.length - 1] += CW - w.reduce((a, b) => a + b, 0);
  const b = { style: BorderStyle.SINGLE, size: 4, color: C.line }; const borders = { top: b, bottom: b, left: b, right: b };
  const sz = o.size ?? 18;
  const cell = (content, i, fill, head) => new TableCell({ width: { size: w[i], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, borders, margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: (Array.isArray(content) ? content : [content]).map(c => (c instanceof Paragraph ? c : new Paragraph({ spacing: { after: 20 }, children: (Array.isArray(c?.runs) ? c.runs : [c]).map(x => (x && typeof x === 'object' && 'text' in x ? run(x.text, { size: sz, ...x, color: head ? C.white : x.color ?? C.ink, bold: head || x.bold }) : run(x, { size: sz, color: head ? C.white : C.ink, bold: head }))) }))) });
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: w,
    rows: [new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, i, C.navy, true)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: o.cantSplit ?? true, children: r.map((c, i) => cell(c, i, (o.fills?.[ri]?.[i]) || (ri % 2 ? C.bg : C.white), false)) }))] });
}
const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });
const png = file => { const buf = fs.readFileSync(file); return { buf, w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; };
const image = (file, width, o = {}) => { const { buf, w, h } = png(file); return new ImageRun({ type: 'png', data: buf, transformation: { width, height: Math.round(width * h / w) }, altText: { title: o.alt || 'AI Value', description: o.alt || 'AI Value logo', name: path.basename(file) } }); };
/** Screenshot scaled to the content width (optionally narrower), with its caption. */
function shot(file, cap, maxW = 620) {
  if (!fs.existsSync(file)) return [P(`[missing screenshot: ${path.basename(file)}]`)];
  return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true, children: [image(file, maxW, { alt: cap })] }), caption(cap)];
}
/** Company logo (AI Value full lockup, never recoloured or stretched; ≥ 150 px). */
function wordmark(width = 260) { return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [image(LOGO_FULL, width)] })]; }
function cover({ eyebrow, title, subtitle, meta, appLogo }) {
  const items = [spacer(600), ...wordmark(250), spacer(900)];
  if (appLogo && fs.existsSync(appLogo)) items.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [image(appLogo, 200, { alt: 'CortexSkills' })] }));
  items.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: [run(eyebrow.toUpperCase(), { size: 28, bold: true, color: C.azure, extra: { characterSpacing: 60 } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [run(title, { font: HEAD, size: 56, bold: true, color: C.navy })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1400 }, children: [run(subtitle, { size: 26, color: C.ink })] }),
    ...meta.map(m => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [run(m.replace(/POWERACT Consulting/g, 'AI Value'), { size: 20, color: C.muted })] })),
    new Paragraph({ children: [new PageBreak()] }));
  return items;
}
function tocPage(title = 'Table of Contents') {
  return [new Paragraph({ spacing: { after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.line, space: 6 } }, children: [run(title, { font: HEAD, size: 40, bold: true, color: C.navy })] }),
    new TableOfContents(title, { hyperlink: true, headingStyleRange: '1-3' })];
}
function docFonts() {
  const f = n => path.join(FONTS_DIR, n);
  return [['Open Sans', 'OpenSans-400.ttf'], ['Montserrat', 'Montserrat-700.ttf'], ['JetBrains Mono', 'JetBrainsMono-Regular.ttf']].filter(([, n]) => fs.existsSync(f(n))).map(([name, n]) => ({ name, data: fs.readFileSync(f(n)) }));
}
function document({ title, credit, sections, lang = 'en-GB', landscape = false }) {
  const fr = lang.startsWith('fr'); 
  const mkHeader = CW => new Header({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: CW }], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 6 } },
    children: [image(LOGO_HOR, 150), new TextRun({ text: '\t', font: FONT }), run(String(credit).replace(/POWERACT Consulting/g, 'AI Value'), { size: 16, color: C.muted })] })] });
  const mkFooter = CW => new Footer({ children: [new Paragraph({ style: 'AIVFooter', tabStops: [{ type: TabStopType.RIGHT, position: CW }], children: [run('AI Value · ' + title, { size: 16, color: C.muted }), new TextRun({ text: '\t', font: FONT }),
    run('Page ', { size: 16, color: C.muted }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.muted }), run(fr ? ' sur ' : ' of ', { size: 16, color: C.muted }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: C.muted })] })] });
  return new Document({
    creator: 'AI Value', title, description: title, features: { updateFields: false }, fonts: docFonts(),
    styles: {
      default: { document: { run: { font: FONT, size: 22, color: C.ink, language: { value: lang } }, paragraph: { spacing: { line: 288, lineRule: LineRuleType.AUTO } } } },
      paragraphStyles: [
        { id: 'AIVFooter', name: 'AI Value Footer', basedOn: 'Normal', run: { font: FONT, size: 16, color: C.muted }, paragraph: { spacing: { after: 0 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: HEAD, size: 40, bold: true, color: C.navy }, paragraph: { spacing: { before: 0, after: 240 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: HEAD, size: 32, bold: true, color: C.navy }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: HEAD, size: 26, bold: true, color: C.navy }, paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2 } },
        ...[1, 2, 3].map(l => ({ id: 'TOC' + l, name: 'toc ' + l, basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: l === 1 ? 22 : 20, bold: l === 1, color: l === 1 ? C.navy : C.ink }, paragraph: { indent: { left: (l - 1) * 360 }, spacing: { before: l === 1 ? 120 : 0, after: 40 } } })),
      ],
    },
    numbering: { config: [
      { reference: 'bullets', levels: [0, 1].map(l => ({ level: l, format: LevelFormat.BULLET, text: l ? '–' : '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360 + l * 360, hanging: 260 } }, run: { color: C.azure } } })) },
      ...Array.from({ length: 200 }, (_, i) => ({ reference: 'steps' + (i || ''), levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } }, run: { bold: true, color: C.navy } } }] })),
    ] },
    // A section is an array of children, or { landscape: true, children } for a page turned sideways (wide tables).
    sections: sections.map((sec, i) => { const children = Array.isArray(sec) ? sec : sec.children; const land = Array.isArray(sec) ? landscape : !!sec.landscape;
      const pw = land ? PAGE_H : PAGE_W, ph = land ? PAGE_W : PAGE_H, cw = pw - 2 * MARGIN;
      return { properties: { page: { size: { width: land ? ph : pw, height: land ? pw : ph, ...(land ? { orientation: D.PageOrientation.LANDSCAPE } : {}) }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 560, footer: 560 } }, titlePage: i === 0 },
        headers: { default: mkHeader(cw), first: new Header({ children: [] }) }, footers: { default: mkFooter(cw), first: new Footer({ children: [] }) }, children }; }),
  });
}
module.exports = { D, C, CONTENT, CONTENT_LAND: PAGE_H - 2 * MARGIN, P, H1, H2, H3, bullet, numbered, caption, code, callout, table, spacer, shot, cover, tocPage, document, run, wordmark, image, LOGO_FULL, LOGO_HOR };
