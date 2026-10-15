// Renders a report or document model to a PowerPoint presentation (16:9) with the AI Value
// graphical chart: a title slide, a KPI slide, one slide per text section and tables split
// over as many slides as their rows need (navy header, alternate rows, status fills).
// Arabic is laid out right to left.
import PptxGenJS from 'pptxgenjs';
import { C, STATUS, itemsOf, palette } from './render.js';

const MADE_WITH = { en: 'Generated with DynamicMS · AI Value — Digital & AI Transformation', fr: 'Généré avec DynamicMS · AI Value — Digital & AI Transformation', ar: 'أُنشئ باستخدام DynamicMS · AI Value' };
const CONT = { en: 'continued', fr: 'suite', ar: 'تابع' };
const HEAD = 'Montserrat'; const BODY = 'Open Sans';
const W = 13.333; const H = 7.5; const M = 0.55;
const hex = (c) => String(c || '').replace('#', '');
const cut = (s, n) => { const t = String(s ?? ''); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

export async function toPptx(model, lang) {
  const rtl = lang === 'ar';
  const pal = palette(model.layout);
  const lay = model.layout || {};
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'DynamicMS'; pres.company = 'AI Value'; pres.title = model.title || 'DynamicMS';
  if (rtl) pres.rtlMode = true;
  const align = rtl ? 'right' : 'left';
  const txt = (o) => ({ fontFace: BODY, fontSize: 14, color: hex(C.ink), align, rtlMode: rtl, valign: 'top', margin: 0, ...o });
  let n = 0;
  const footer = (s) => {
    n += 1;
    s.addShape(pres.ShapeType.line, { x: M, y: H - 0.5, w: W - 2 * M, h: 0, line: { color: hex(C.line), width: 0.75 } });
    s.addText(cut(lay.footerText || model.title, 110), txt({ x: M, y: H - 0.45, w: W - 2 * M - 1, h: 0.3, fontSize: 9, color: hex(C.medium) }));
    s.addText(String(n), txt({ x: W - M - 0.8, y: H - 0.45, w: 0.8, h: 0.3, fontSize: 9, color: hex(C.medium), align: rtl ? 'left' : 'right' }));
  };
  const slide = (eyebrow, title) => {
    const s = pres.addSlide();
    s.background = { color: 'FFFFFF' };
    if (eyebrow) s.addText(cut(eyebrow, 90).toUpperCase(), txt({ x: M, y: 0.35, w: W - 2 * M, h: 0.3, fontSize: 11, bold: true, color: hex(pal.accent), charSpacing: 1 }));
    s.addText(cut(title, 120), txt({ x: M, y: 0.65, w: W - 2 * M, h: 0.7, fontFace: HEAD, fontSize: 24, bold: true, color: hex(pal.title), valign: 'middle' }));
    footer(s);
    return s;
  };

  // ---- Title slide
  const t0 = pres.addSlide();
  t0.background = { color: hex(C.bg) };
  t0.addShape(pres.ShapeType.rect, { x: rtl ? W - 0.25 : 0, y: 0, w: 0.25, h: H, fill: { color: hex(pal.primary) }, line: { color: hex(pal.primary) } });
  if (lay.logoBuffer) {
    const r = lay.logoW && lay.logoH ? Math.min(2.4 / lay.logoW, 0.9 / lay.logoH) : null;
    const lw = r ? lay.logoW * r : 2.4; const lh = r ? lay.logoH * r : 0.9;
    t0.addImage({ data: `data:image/${lay.logoType === 'jpg' ? 'jpeg' : 'png'};base64,${Buffer.from(lay.logoBuffer).toString('base64')}`, x: rtl ? W - M - lw : M + 0.3, y: 0.6, w: lw, h: lh });
  } else if (lay.logoText) t0.addText(lay.logoText, txt({ x: M + 0.3, y: 0.6, w: 6, h: 0.6, fontFace: HEAD, fontSize: 20, bold: true, color: hex(pal.accent) }));
  t0.addText(String(model.eyebrow || '').toUpperCase(), txt({ x: M + 0.3, y: 2.2, w: W - 2 * M - 0.6, h: 0.4, fontSize: 13, bold: true, color: hex(pal.accent), charSpacing: 1 }));
  t0.addText(cut(model.title, 140), txt({ x: M + 0.3, y: 2.65, w: W - 2 * M - 0.6, h: 1.4, fontFace: HEAD, fontSize: 36, bold: true, color: hex(pal.title), valign: 'middle', fit: 'shrink' }));
  if (model.subtitle) t0.addText(cut(model.subtitle, 200), txt({ x: M + 0.3, y: 4.1, w: W - 2 * M - 0.6, h: 0.5, fontSize: 16, color: hex(C.medium) }));
  const meta = (model.meta || []).slice(0, 8);
  if (meta.length) t0.addText(meta.map(([k, v], i) => [{ text: `${k}: `, options: { bold: true, color: hex(C.dark) } }, { text: cut(v, 120), options: { breakLine: i < meta.length - 1 } }]).flat(), txt({ x: M + 0.3, y: 4.75, w: W - 2 * M - 0.6, h: 1.7, fontSize: 12, paraSpaceAfter: 2 }));
  t0.addText(MADE_WITH[lang] || MADE_WITH.en, txt({ x: M + 0.3, y: H - 0.6, w: W - 2 * M, h: 0.3, fontSize: 10, color: hex(C.medium) }));

  // ---- KPI cards
  const kpis = model.kpis || [];
  for (let i = 0; i < kpis.length; i += 8) {
    const s = slide(model.eyebrow, model.summaryLabel || model.title);
    kpis.slice(i, i + 8).forEach((k, j) => {
      const cw = (W - 2 * M - 0.3 * 3) / 4; const x = M + (j % 4) * (cw + 0.3); const y = 1.6 + Math.floor(j / 4) * 2.3;
      const cx = rtl ? W - x - cw : x;
      s.addShape(pres.ShapeType.roundRect, { x: cx, y, w: cw, h: 2, rectRadius: 0.12, fill: { color: 'FFFFFF' }, line: { color: hex(C.line), width: 1 }, shadow: { type: 'outer', color: '9AA5B1', opacity: 0.25, blur: 4, offset: 1.5, angle: 90 } });
      s.addText(cut(k.value, 18), txt({ x: cx + 0.2, y: y + 0.25, w: cw - 0.4, h: 0.9, fontFace: HEAD, fontSize: 30, bold: true, color: hex(pal.accent), valign: 'middle', fit: 'shrink' }));
      s.addText(cut(k.label, 70), txt({ x: cx + 0.2, y: y + 1.2, w: cw - 0.4, h: 0.65, fontSize: 12, color: hex(C.medium) }));
    });
  }

  // ---- Sections
  const BODY_TOP = 1.5; const BODY_H = H - BODY_TOP - 0.7;
  for (const sec of model.sections || []) {
    const items = itemsOf(sec);
    // Text-like items are gathered into paragraphs and spread over slides of ~16 lines.
    let paras = [];
    const flush = () => {
      if (!paras.length) return;
      let chunk = []; let lines = 0;
      const out = () => { if (!chunk.length) return; const s = slide(model.title, sec.heading); s.addText(chunk, txt({ x: M, y: BODY_TOP, w: W - 2 * M, h: BODY_H, fontSize: 14, paraSpaceAfter: 6, fit: 'shrink' })); chunk = []; lines = 0; };
      for (const p of paras) {
        const l = Math.max(1, Math.ceil(String(p.text).length / 120));
        if (lines + l > 16 && chunk.length) out();
        chunk.push({ text: cut(p.text, 1400), options: { ...p.options, breakLine: true } }); lines += l;
      }
      out(); paras = [];
    };
    for (const it of items) {
      if (it.type === 'text') String(it.text || '').split('\n').filter(x => x.trim()).forEach(x => paras.push({ text: x, options: {} }));
      else if (it.type === 'sub') paras.push({ text: it.text, options: { bold: true, fontFace: HEAD, color: hex(pal.title), fontSize: 16 } });
      else if (it.type === 'bullets') { if (it.intro) paras.push({ text: it.intro, options: { bold: true } }); (it.items || []).forEach(b => paras.push({ text: b, options: { bullet: { indent: 18 } } })); }
      else if (it.type === 'kv') (it.rows || []).forEach(([k, v]) => paras.push({ text: `${k}: ${v ?? ''}`, options: {} }));
      else if (it.type === 'table' && it.table?.rows) {
        flush();
        const t = it.table; const cols = t.columns || [];
        const tw = cols.reduce((a, c) => a + (c.width || 1), 0);
        const colW = cols.map(c => ((W - 2 * M) * (c.width || 1)) / tw);
        const rows = t.rows.length ? t.rows : [{}];
        // Rows per slide, balanced so that the last slide is not left with one or two rows.
        const max = cols.length > 6 ? 9 : 11;
        const per = Math.ceil(rows.length / Math.ceil(rows.length / max));
        for (let i = 0; i < rows.length; i += per) {
          const s = slide(model.title, i ? `${sec.heading} (${CONT[lang] || CONT.en})` : sec.heading);
          const head = cols.map(c => ({ text: cut(c.label, 40), options: { bold: true, color: 'FFFFFF', fill: { color: hex(pal.primary) }, fontFace: BODY, fontSize: 11 } }));
          const body = rows.slice(i, i + per).map((r, ri) => cols.map(c => {
            const st = r._cells && r._cells[c.key] !== undefined ? STATUS[r._cells[c.key]] : t.statusKey === c.key && r._status !== undefined ? STATUS[r._status] : null;
            return { text: cut(r[c.key], 160), options: { fill: { color: hex(st || ((i + ri) % 2 ? C.light : '#FFFFFF')) }, fontFace: BODY, fontSize: 10, color: hex(C.ink) } };
          }));
          s.addTable([head, ...body], { x: M, y: BODY_TOP, w: W - 2 * M, colW, border: { type: 'solid', pt: 0.75, color: hex(C.line) }, valign: 'top', align, autoPage: false, margin: 0.05 });
          if (t.caption && i + per >= rows.length) s.addText(cut(t.caption, 200), txt({ x: M, y: H - 0.95, w: W - 2 * M, h: 0.35, fontSize: 10, italic: true, color: hex(C.medium) }));
        }
      } else if ((it.type === 'image' && it.data) || (it.type === 'diagram' && it.png)) {
        flush();
        const data = it.type === 'image' ? it.data : it.png;
        const iw = it.type === 'image' ? it.w : it.width; const ih = it.type === 'image' ? it.h : it.height;
        const s = slide(model.title, sec.heading);
        const maxW = W - 2 * M; const maxH = BODY_H - (it.caption ? 0.4 : 0);
        let w2 = maxW; let h2 = iw && ih ? (ih / iw) * w2 : maxH;
        if (h2 > maxH) { h2 = maxH; w2 = iw && ih ? (iw / ih) * h2 : maxW; }
        s.addImage({ data: `data:image/${it.imgType === 'jpg' ? 'jpeg' : 'png'};base64,${Buffer.from(data).toString('base64')}`, x: (W - w2) / 2, y: BODY_TOP, w: w2, h: h2 });
        if (it.caption) s.addText(cut(it.caption, 200), txt({ x: M, y: BODY_TOP + h2 + 0.05, w: W - 2 * M, h: 0.35, fontSize: 10, italic: true, color: hex(C.medium), align: 'center' }));
      }
    }
    flush();
  }
  return pres.write({ outputType: 'nodebuffer' });
}
