const pptxgen = require('pptxgenjs');
const path = require('path');

const A = (name) => path.join(__dirname, 'assets', `${name}.png`);

const TEAL_DEEP = '15423A';
const TEAL = '1F6459';
const TEAL_MID = '2C7A6B';
const MINT = 'EAF2EF';
const MINT2 = 'DCEEE8';
const ORANGE = 'C2661C';
const ORANGE_LIGHT = 'F7E4D2';
const INK = '16221F';
const MUTED = '5C6D68';
const WHITE = 'FFFFFF';
const RED = 'B4463B';
const RED_LIGHT = 'F7E1DD';
const BLUE = '2E5F8A';
const BLUE_LIGHT = 'DCE7F0';
const PURPLE = '6B4C8A';
const PURPLE_LIGHT = 'E7DFF0';

const FONT = 'Calibri';
const SHADOW = { type: 'outer', color: '1B2E2B', opacity: 0.18, blur: 8, offset: 3, angle: 90 };

const pptx = new pptxgen();
pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE';

let pageN = 0;
function newSlide(bg) {
  const s = pptx.addSlide();
  s.background = { color: bg || WHITE };
  return s;
}
function footer(s, dark) {
  pageN++;
  s.addText('journi — The Four Frameworks', {
    x: 0.6, y: 7.14, w: 8, h: 0.3, fontFace: FONT, fontSize: 9,
    color: dark ? 'CFE3DD' : MUTED, align: 'left',
  });
  s.addText(String(pageN).padStart(2, '0'), {
    x: 12.2, y: 7.14, w: 0.55, h: 0.3, fontFace: FONT, fontSize: 9,
    color: dark ? 'CFE3DD' : MUTED, align: 'right',
  });
}
function header(s, kicker, title, opts = {}) {
  const { size = 27, sub = null, kickerColor = ORANGE, titleColor = TEAL_DEEP, titleW = 12.1 } = opts;
  s.addText(kicker.toUpperCase(), {
    x: 0.6, y: 0.35, w: 11.5, h: 0.32, fontFace: FONT, fontSize: 12, bold: true,
    color: kickerColor, charSpacing: 2,
  });
  s.addText(title, {
    x: 0.6, y: 0.68, w: titleW, h: 0.85, fontFace: FONT, fontSize: size, bold: true,
    color: titleColor, valign: 'top', lineSpacingMultiple: 1.02,
  });
  let top = 1.65;
  if (sub) {
    s.addText(sub, {
      x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontFace: FONT, fontSize: 12.5, color: MUTED,
      valign: 'top', lineSpacingMultiple: 1.15,
    });
    top = 2.15;
  }
  return top;
}
function iconCircle(s, { x, y, d = 0.6, bg = TEAL, icon, pad = 0.15 }) {
  s.addShape('ellipse', { x, y, w: d, h: d, fill: { color: bg }, line: { type: 'none' } });
  if (icon) s.addImage({ path: A(icon), x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
}
function card(s, x, y, w, h, opts = {}) {
  const { fill = WHITE, shadow = true, radius = 0.05 } = opts;
  s.addShape('roundRect', { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { type: 'none' }, shadow: shadow ? SHADOW : undefined });
}
function pillBadge(s, x, y, text, color) {
  const w = 0.28 + text.length * 0.082;
  s.addShape('roundRect', { x, y, w, h: 0.3, rectRadius: 0.5, fill: { color }, line: { type: 'none' } });
  s.addText(text, { x, y, w, h: 0.3, fontFace: FONT, fontSize: 9.5, bold: true, color: WHITE, align: 'center', valign: 'middle' });
  return w;
}
function bullets(s, x, y, w, h, items, opts = {}) {
  const { fontSize = 12.5, color = INK, bulletColor = TEAL, lineSpacingMultiple = 1.25 } = opts;
  const runs = [];
  items.forEach((it, i) => {
    runs.push({ text: '›  ', options: { color: bulletColor, bold: true, breakLine: false } });
    runs.push({ text: it, options: { color, breakLine: true } });
  });
  s.addText(runs, { x, y, w, h, fontFace: FONT, fontSize, valign: 'top', lineSpacingMultiple, paraSpaceAfter: 8 });
}
function stageStrip(s, x, y, w, h, stages, opts = {}) {
  // stages: [{label, color}], drawn as connected chevrons left to right
  const { fontSize = 12 } = opts;
  const gap = 0.12;
  const segW = (w - gap * (stages.length - 1)) / stages.length;
  let cx = x;
  stages.forEach((st, i) => {
    s.addShape('chevron', { x: cx, y, w: segW, h, fill: { color: st.color }, line: { type: 'none' } });
    s.addText(st.label, { x: cx, y, w: segW, h, fontFace: FONT, fontSize, bold: true, color: WHITE, align: 'center', valign: 'middle' });
    cx += segW + gap;
  });
}
function tableSlide(s, headRow, rows, opts = {}) {
  const { x = 0.6, y = 2.1, w = 12.1, colW, fontSize = 11.5, headFill = TEAL_DEEP } = opts;
  const table = [headRow.map((h) => ({ text: h, options: { fill: { color: headFill }, color: WHITE, bold: true, fontSize: 11.5, valign: 'middle' } }))];
  rows.forEach((r, i) => {
    const bg = i % 2 === 0 ? WHITE : MINT;
    table.push(r.map((v) => ({ text: v, options: { fill: { color: bg }, color: INK, fontSize, valign: 'middle' } })));
  });
  s.addTable(table, { x, y, w, colW, border: { type: 'solid', color: 'DBE6E3', pt: 0.75 }, fontFace: FONT, autoPage: false, valign: 'middle' });
}

module.exports = {
  pptx, newSlide, footer, header, iconCircle, card, pillBadge, bullets, stageStrip, tableSlide, A,
  TEAL_DEEP, TEAL, TEAL_MID, MINT, MINT2, ORANGE, ORANGE_LIGHT, INK, MUTED, WHITE, RED, RED_LIGHT,
  BLUE, BLUE_LIGHT, PURPLE, PURPLE_LIGHT, FONT,
};
