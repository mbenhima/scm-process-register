const pptxgen = require('pptxgenjs');
const path = require('path');

const A = (name) => path.join(__dirname, 'assets', `${name}.png`);

// ---- palette: grounded in journi's actual product identity ----
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

const FONT = 'Calibri';
const SHADOW = { type: 'outer', color: '1B2E2B', opacity: 0.18, blur: 8, offset: 3, angle: 90 };

const pptx = new pptxgen();
pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE';
const SW = 13.333, SH = 7.5;

let pageN = 0;
function newSlide(bg) {
  const s = pptx.addSlide();
  s.background = { color: bg || WHITE };
  return s;
}
function footer(s, dark) {
  pageN++;
  s.addText('journi — Value Proposition & Customer Fit', {
    x: 0.6, y: 7.14, w: 8, h: 0.3, fontFace: FONT, fontSize: 9,
    color: dark ? 'CFE3DD' : MUTED, align: 'left',
  });
  s.addText(String(pageN).padStart(2, '0'), {
    x: 12.2, y: 7.14, w: 0.55, h: 0.3, fontFace: FONT, fontSize: 9,
    color: dark ? 'CFE3DD' : MUTED, align: 'right',
  });
}
function header(s, kicker, title, opts = {}) {
  const { size = 30, sub = null, kickerColor = ORANGE, titleColor = TEAL_DEEP } = opts;
  s.addText(kicker.toUpperCase(), {
    x: 0.6, y: 0.42, w: 10, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true,
    color: kickerColor, charSpacing: 2,
  });
  s.addText(title, {
    x: 0.6, y: 0.78, w: 12.1, h: 1.05, fontFace: FONT, fontSize: size, bold: true,
    color: titleColor, valign: 'top', lineSpacingMultiple: 1.05,
  });
  let top = 1.9;
  if (sub) {
    s.addText(sub, {
      x: 0.6, y: 1.85, w: 11.8, h: 0.55, fontFace: FONT, fontSize: 14, color: MUTED,
      valign: 'top', lineSpacingMultiple: 1.2,
    });
    top = 2.5;
  }
  return top;
}
function iconCircle(s, { x, y, d = 0.6, bg = TEAL, icon, pad = 0.15 }) {
  s.addShape('ellipse', { x, y, w: d, h: d, fill: { color: bg }, line: { type: 'none' } });
  if (icon) {
    s.addImage({ path: A(icon), x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
  }
}
function card(s, x, y, w, h, opts = {}) {
  const { fill = WHITE, shadow = true, radius = 0.06 } = opts;
  s.addShape('roundRect', {
    x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { type: 'none' },
    shadow: shadow ? SHADOW : undefined,
  });
}

// =====================================================================
// SLIDE 1 — TITLE
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 0.7, d: 0.85, bg: ORANGE, icon: 'compass', pad: 0.19 });
  s.addText('journi', {
    x: 0.7, y: 2.55, w: 10, h: 1.3, fontFace: FONT, fontSize: 60, bold: true, color: WHITE,
  });
  s.addText('the human side of change, mapped as a journey', {
    x: 0.75, y: 3.62, w: 10, h: 0.55, fontFace: FONT, fontSize: 18, italic: true, color: 'B8D4CE',
  });
  card(s, 0.75, 4.35, 6.1, 0.62, { fill: ORANGE, shadow: false, radius: 0.5 });
  s.addText('VALUE PROPOSITION & CUSTOMER FIT', {
    x: 0.75, y: 4.35, w: 6.1, h: 0.62, fontFace: FONT, fontSize: 14, bold: true, color: WHITE,
    align: 'center', valign: 'middle', charSpacing: 1,
  });
  s.addText('Prepared for POWERACT Consulting  ·  Confidential', {
    x: 0.75, y: 6.75, w: 8, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A',
  });
}

// =====================================================================
// SLIDE 2 — THE PROBLEM
// =====================================================================
{
  const s = newSlide();
  header(s, 'The Problem', 'Most transformations still fail on the human side', { size: 28 });

  card(s, 0.6, 2.15, 5.5, 4.55, { fill: TEAL_DEEP });
  s.addText('~70%', { x: 0.95, y: 2.4, w: 4.8, h: 1.35, fontFace: FONT, fontSize: 64, bold: true, color: WHITE });
  s.addText('of large-scale change initiatives fail to fully meet their objectives — not because the technology or process design was wrong, but because the people side was never systematically managed.',
    { x: 0.95, y: 3.7, w: 4.85, h: 1.9, fontFace: FONT, fontSize: 14.5, color: 'D8EAE6', lineSpacingMultiple: 1.25 });
  s.addText('Widely cited across Kotter, Prosci and McKinsey change-management research.',
    { x: 0.95, y: 5.9, w: 4.85, h: 0.6, fontFace: FONT, fontSize: 10.5, italic: true, color: '9FC2BC' });

  const items = [
    ['triangle-exclamation', 'Readiness data lives in spreadsheets and decks — no single, durable source of truth'],
    ['shuffle', 'ADKAR, Kotter, Lewin and Bridges get used inconsistently, project to project'],
    ['ghost', 'Sponsors "ghost" — no record of the visible-sponsorship actions that predict success'],
    ['clock-rotate-left', 'Resistance surfaces after go-live, when it is far more expensive to fix'],
  ];
  let y = 2.15;
  for (const [icon, text] of items) {
    card(s, 6.4, y, 6.35, 0.98, { fill: MINT });
    iconCircle(s, { x: 6.65, y: y + 0.19, d: 0.6, bg: RED, icon, pad: 0.15 });
    s.addText(text, {
      x: 7.45, y: y, w: 5.15, h: 0.98, fontFace: FONT, fontSize: 13, color: INK,
      valign: 'middle', lineSpacingMultiple: 1.15,
    });
    y += 1.13;
  }
  footer(s);
}

// =====================================================================
// SLIDE 3 — MEET JOURNI
// =====================================================================
{
  const s = newSlide();
  header(s, 'Introducing', 'The human change-management system of record', { size: 28,
    sub: 'It sits alongside — never inside — your project-delivery tools, and tracks the one thing they don’t: whether the people affected by the change are actually ready, willing and able.' });

  const cols = [
    ['database', 'System of Record', 'Every score, justification and status change lives in one durable place — not a slide deck that goes stale the moment it is presented.'],
    ['sitemap', 'Framework Engine', 'ADKAR, Kotter, Lewin and Bridges are operational here — scored, justified, and audit-trailed, not reference posters on a wall.'],
    ['shield-halved', 'Governed AI Layer', 'AI drafts and diagnoses across the platform, but every suggestion carries a mandatory human checkpoint before it counts.'],
  ];
  let x = 0.6;
  for (const [icon, title, desc] of cols) {
    card(s, x, 2.65, 3.95, 3.95, { fill: WHITE });
    iconCircle(s, { x: x + 0.35, y: 2.98, d: 0.9, bg: TEAL, icon, pad: 0.22 });
    s.addText(title, { x: x + 0.35, y: 4.05, w: 3.3, h: 0.5, fontFace: FONT, fontSize: 17, bold: true, color: TEAL_DEEP });
    s.addText(desc, { x: x + 0.35, y: 4.6, w: 3.3, h: 1.85, fontFace: FONT, fontSize: 12.5, color: MUTED, lineSpacingMultiple: 1.25 });
    x += 4.19;
  }
  footer(s);
}

// =====================================================================
// SLIDE 4 — CUSTOMER PROFILE: WHO
// =====================================================================
{
  const s = newSlide();
  header(s, 'Customer Profile', 'Who journi is built for', { size: 30 });

  s.addText('ORGANIZATION PROFILE', { x: 0.6, y: 2.35, w: 6, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: ORANGE, charSpacing: 1 });
  const org = [
    ['building', 'Mid-to-large enterprises (500+ employees) running several concurrent transformation programs'],
    ['diagram-project', 'Consulting firms delivering Organizational Change Management as a managed service'],
    ['industry', 'Proven across Manufacturing, Logistics & Transportation, and Health — extensible to any sector'],
    ['globe', 'Francophone / multilingual footprints where English-only tooling is a real adoption barrier'],
  ];
  let y = 2.8;
  for (const [icon, text] of org) {
    iconCircle(s, { x: 0.6, y, d: 0.52, bg: TEAL, icon, pad: 0.13 });
    s.addText(text, { x: 1.32, y: y - 0.06, w: 5.5, h: 0.64, fontFace: FONT, fontSize: 13, color: INK, valign: 'middle', lineSpacingMultiple: 1.15 });
    y += 0.92;
  }

  s.addText('BUYER PERSONAS', { x: 6.95, y: 2.35, w: 6, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: ORANGE, charSpacing: 1 });
  const personas = [
    ['user-tie', 'Change Management Lead / Director', 'Primary user — owns adoption of the tool day to day'],
    ['users-gear', 'PMO / Program Director', 'Co-buyer — wants the PM ↔ CM governance bridge closed'],
    ['chart-line', 'Executive Sponsor / Steering Committee', 'Economic influence — wants defensible go/no-go evidence'],
  ];
  y = 2.8;
  for (const [icon, name, desc] of personas) {
    card(s, 6.95, y, 5.75, 1.28, { fill: MINT });
    iconCircle(s, { x: 7.2, y: y + 0.24, d: 0.8, bg: TEAL_DEEP, icon, pad: 0.19 });
    s.addText(name, { x: 8.2, y: y + 0.16, w: 4.35, h: 0.44, fontFace: FONT, fontSize: 14, bold: true, color: TEAL_DEEP });
    s.addText(desc, { x: 8.2, y: y + 0.6, w: 4.35, h: 0.55, fontFace: FONT, fontSize: 11.5, color: MUTED, lineSpacingMultiple: 1.15 });
    y += 1.48;
  }
  footer(s);
}

// =====================================================================
// SLIDE 5 — JOBS TO BE DONE
// =====================================================================
{
  const s = newSlide();
  header(s, 'Customer Profile', 'What our customer is trying to get done', { size: 28 });
  const cols = [
    ['gear', 'Functional', TEAL, [
      'Score ADKAR readiness per cohort, not just the whole population',
      'Prove sponsorship is active and visible, not assumed',
      'Sequence communications without saturating the population',
      'Resolve resistance to closure, with a documented root cause',
      'Report readiness to executives in language they trust',
    ]],
    ['comments', 'Social', ORANGE, [
      'Be seen as running change management on data, not instinct',
      'Show a Steering Committee real evidence at every phase gate',
      'Speak the vocabulary each stakeholder already knows',
    ]],
    ['heart', 'Emotional', TEAL_MID, [
      'Know nothing is falling through the cracks before go-live',
      'Feel confident defending a go/no-go call after the fact',
    ]],
  ];
  let x = 0.6;
  for (const [icon, title, color, items] of cols) {
    card(s, x, 2.15, 3.95, 4.55, { fill: WHITE });
    iconCircle(s, { x: x + 0.3, y: 2.45, d: 0.72, bg: color, icon, pad: 0.17 });
    s.addText(`${title} job`, { x: x + 1.2, y: 2.55, w: 2.5, h: 0.55, fontFace: FONT, fontSize: 16, bold: true, color: TEAL_DEEP, valign: 'middle' });
    let iy = 3.35;
    for (const it of items) {
      s.addText([{ text: '›  ', options: { color, bold: true } }, { text: it, options: { color: INK } }],
        { x: x + 0.3, y: iy, w: 3.4, h: 0.66, fontFace: FONT, fontSize: 11.8, lineSpacingMultiple: 1.15, valign: 'top' });
      iy += 0.66;
    }
    x += 4.19;
  }
  footer(s);
}

// =====================================================================
// SLIDE 6 — PAINS
// =====================================================================
{
  const s = newSlide();
  header(s, 'Customer Profile', 'Pains — what makes this job hard today', { size: 28 });
  const pains = [
    'Readiness data scattered across spreadsheets, decks and inboxes, with no historical trail',
    'Frameworks (ADKAR, Kotter, Lewin, Bridges) applied inconsistently, project to project',
    'Sponsors "ghost" — no record of the visible-sponsorship actions that predict success',
    'Resistance surfaces late, after go-live, when it is expensive and disruptive to fix',
    'AI pilots deployed with no governance — no audit trail, no human checkpoint',
    'PMO and Change Management run as two disconnected worlds with no shared timeline',
  ];
  let y = 2.1;
  for (const p of pains) {
    card(s, 0.6, y, 12.1, 0.72, { fill: RED_LIGHT, shadow: false });
    iconCircle(s, { x: 0.82, y: y + 0.12, d: 0.48, bg: RED, icon: 'xmark', pad: 0.12 });
    s.addText(p, { x: 1.55, y: y, w: 10.95, h: 0.72, fontFace: FONT, fontSize: 13.5, color: INK, valign: 'middle', lineSpacingMultiple: 1.1 });
    y += 0.83;
  }
  footer(s);
}

// =====================================================================
// SLIDE 7 — GAINS
// =====================================================================
{
  const s = newSlide();
  header(s, 'Customer Profile', 'Gains — what would make this job easy', { size: 28 });
  const gains = [
    'One system of record spanning the full change lifecycle, tenant setup to sustainment',
    'A defensible, timestamped justification trail behind every score and status change',
    'Real-time executive visibility — a Composite Readiness Index benchmarked by phase',
    'Faster, evidence-based resistance resolution with root-cause pattern detection',
    'AI acceleration with governance built in — human checkpoint on every suggestion',
    'A multilingual, RTL-ready interface for global and francophone-Africa teams',
  ];
  let y = 2.1;
  for (const g of gains) {
    card(s, 0.6, y, 12.1, 0.72, { fill: MINT, shadow: false });
    iconCircle(s, { x: 0.82, y: y + 0.12, d: 0.48, bg: TEAL, icon: 'check', pad: 0.12 });
    s.addText(g, { x: 1.55, y: y, w: 10.95, h: 0.72, fontFace: FONT, fontSize: 13.5, color: INK, valign: 'middle', lineSpacingMultiple: 1.1 });
    y += 0.83;
  }
  footer(s);
}

// =====================================================================
// SLIDE 8 — VALUE MAP: PRODUCTS & SERVICES
// =====================================================================
{
  const s = newSlide();
  const top = header(s, 'Value Map', 'What journi delivers: 22 integrated modules', { size: 28,
    sub: 'One shared data model, organized into the platform every project draws on, and the 16-module program lifecycle a practitioner runs day to day.' });

  card(s, 0.6, top, 3.75, 4.2, { fill: TEAL_DEEP });
  iconCircle(s, { x: 0.9, y: top + 0.28, d: 0.62, bg: ORANGE, icon: 'layer-group', pad: 0.15 });
  s.addText('PLATFORM & GOVERNANCE', { x: 1.65, y: top + 0.34, w: 2.6, h: 0.55, fontFace: FONT, fontSize: 12.5, bold: true, color: WHITE, valign: 'middle', lineSpacingMultiple: 1.1 });
  const plat = ['M1 Tenant & Org Hierarchy', 'M2 Identity & RBAC', 'M3 OBS', 'M4 Process Registry', 'M5 CM Charters', 'M6 AI Use Case Library'];
  let iy = top + 1.15;
  for (const it of plat) {
    s.addText([{ text: '›  ', options: { color: ORANGE, bold: true } }, { text: it, options: { color: 'E3F0EC' } }],
      { x: 0.9, y: iy, w: 3.3, h: 0.45, fontFace: FONT, fontSize: 12.5, valign: 'middle' });
    iy += 0.48;
  }

  card(s, 4.55, top, 8.18, 4.2, { fill: MINT });
  iconCircle(s, { x: 4.85, y: top + 0.28, d: 0.62, bg: TEAL, icon: 'route', pad: 0.15 });
  s.addText('CHANGE MANAGEMENT PROGRAM (M7–M22)', { x: 5.6, y: top + 0.34, w: 6.8, h: 0.55, fontFace: FONT, fontSize: 12.5, bold: true, color: TEAL_DEEP, valign: 'middle' });
  const prog = ['M7 Initiative Registry', 'M8 WBS & Gantt', 'M9 Stakeholder Mapping', 'M10 ADKAR Engine', 'M11 Emotional & Transition', 'M12 Risk Register', 'M13 Sponsor & Coalition', 'M14 Communications',
    'M15 Training', 'M16 Resistance', 'M17 Manager as Coach', 'M18 Journey Map', 'M19 Journeys & Analytics', 'M20 Analytics', 'M21 Sustainment', 'M22 Field Notes'];
  const c1 = prog.slice(0, 8), c2 = prog.slice(8);
  iy = top + 1.15;
  for (const it of c1) {
    s.addText([{ text: '›  ', options: { color: TEAL, bold: true } }, { text: it, options: { color: INK } }],
      { x: 4.85, y: iy, w: 3.55, h: 0.38, fontFace: FONT, fontSize: 12, valign: 'middle' });
    iy += 0.39;
  }
  iy = top + 1.15;
  for (const it of c2) {
    s.addText([{ text: '›  ', options: { color: TEAL, bold: true } }, { text: it, options: { color: INK } }],
      { x: 8.6, y: iy, w: 3.9, h: 0.38, fontFace: FONT, fontSize: 12, valign: 'middle' });
    iy += 0.39;
  }
  footer(s);
}

// =====================================================================
// helper: icon-row list slide (used for pain relievers / gain creators)
// =====================================================================
function rowListSlide(kicker, title, rows, accentColor, rowFill) {
  const s = newSlide();
  header(s, kicker, title, { size: 28 });
  let y = 2.05;
  const rh = 0.72;
  for (const [icon, label, desc] of rows) {
    card(s, 0.6, y, 12.1, rh, { fill: rowFill, shadow: false });
    iconCircle(s, { x: 0.8, y: y + 0.09, d: 0.54, bg: accentColor, icon, pad: 0.135 });
    s.addText(label, { x: 1.55, y: y, w: 3.4, h: rh, fontFace: FONT, fontSize: 13, bold: true, color: TEAL_DEEP, valign: 'middle', lineSpacingMultiple: 1.05 });
    s.addText(desc, { x: 5.05, y: y, w: 7.5, h: rh, fontFace: FONT, fontSize: 12.5, color: MUTED, valign: 'middle', lineSpacingMultiple: 1.1 });
    y += rh + 0.08;
  }
  footer(s);
  return s;
}

// SLIDE 9 — PAIN RELIEVERS
rowListSlide('Value Map', 'Pain relievers — how journi removes each pain', [
  ['layer-group', 'Scattered data', 'One project record across 16 lifecycle modules — nothing lives in a separate deck'],
  ['shuffle', 'Inconsistent frameworks', 'ADKAR, Kotter, Lewin, Bridges layered on one shared, framework-agnostic data model'],
  ['ghost', 'Sponsors "ghost"', 'Sponsor visibility tracker + signed Charter compliance log, not a verbal promise'],
  ['clock-rotate-left', 'Late resistance', 'Structured Resistance Log with systemic-pattern detection and an AI root-cause classifier'],
  ['shield-halved', 'Ungoverned AI', '14-use-case governed library — Assistive/Augmented tiers only, mandatory human checkpoint'],
  ['chart-line', 'Executive blind spot', 'Composite Readiness Index, benchmarked by phase, with an AI-drafted executive narrative'],
], RED, RED_LIGHT);

// SLIDE 10 — GAIN CREATORS
rowListSlide('Value Map', 'Gain creators — not just features', [
  ['file-signature', 'Defensible governance', 'A justification-governed audit trail behind every ADKAR, Lewin, Bridges and status change'],
  ['chart-line', 'Executive visibility', 'Composite Readiness Index, benchmarked against phase-appropriate reference bands, live'],
  ['users-gear', 'Adapts without a code change', 'A runtime-editable Permission Matrix — reshape RBAC to your org structure in minutes'],
  ['shield-halved', 'Time saved, no new risk', 'Governed AI drafts, diagnoses and classifies — a human always approves before it counts'],
  ['globe', 'One tool, every geography', '3-language UI (English/French/Arabic) with full right-to-left layout support'],
  ['server', 'Simple to stand up', 'Windows-installable, no forced cloud dependency, no external data-residency questions'],
], TEAL, MINT);

// =====================================================================
// SLIDE 11 — THE FIT (VALUE PROPOSITION CANVAS)
// =====================================================================
{
  const s = newSlide();
  header(s, 'The Fit', 'Customer Profile meets Value Map', { size: 30 });

  const sqX = 1.3, sqY = 2.5, sqW = 4.3, sqH = 4.1;
  card(s, sqX, sqY, sqW, sqH, { fill: ORANGE_LIGHT });
  iconCircle(s, { x: sqX + (sqW - 0.85) / 2, y: sqY + 0.3, d: 0.85, bg: ORANGE, icon: 'cubes', pad: 0.2 });
  s.addText('VALUE MAP', { x: sqX, y: sqY + 1.25, w: sqW, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: ORANGE, align: 'center', charSpacing: 1 });
  const vItems = [['Products', '22 modules, tenant creation to sustainment'], ['Relievers', 'Sponsor tracker, resistance log, governed AI'], ['Creators', 'Readiness Index, justification trail, runtime RBAC']];
  let iy = sqY + 1.8;
  for (const [n, d] of vItems) {
    s.addText([{ text: n + '  ', options: { bold: true, color: ORANGE } }, { text: d, options: { color: MUTED } }],
      { x: sqX + 0.3, y: iy, w: sqW - 0.6, h: 0.7, fontFace: FONT, fontSize: 11.5, lineSpacingMultiple: 1.15, valign: 'top' });
    iy += 0.75;
  }

  s.addShape('rightArrow', { x: 5.75, y: 4.15, w: 1.55, h: 0.55, fill: { color: TEAL_DEEP }, line: { type: 'none' } });

  const cX = 7.5, cY = 2.5, cD = 4.1;
  s.addShape('ellipse', { x: cX, y: cY, w: cD, h: cD, fill: { color: MINT }, line: { type: 'none' } });
  iconCircle(s, { x: cX + (cD - 0.85) / 2, y: cY + 0.3, d: 0.85, bg: TEAL, icon: 'user', pad: 0.2 });
  s.addText('CUSTOMER PROFILE', { x: cX + 0.35, y: cY + 1.25, w: cD - 0.7, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: TEAL_DEEP, align: 'center', charSpacing: 1 });
  const cItems = [['Jobs', 'Track readiness, prove sponsorship, resolve resistance'], ['Pains', 'Scattered data, inconsistent frameworks, late resistance'], ['Gains', 'One system of record, audit trail, governed AI']];
  iy = cY + 1.8;
  for (const [n, d] of cItems) {
    s.addText([{ text: n + '  ', options: { bold: true, color: TEAL } }, { text: d, options: { color: MUTED } }],
      { x: cX + 0.6, y: iy, w: cD - 1.2, h: 0.7, fontFace: FONT, fontSize: 11.5, lineSpacingMultiple: 1.15, valign: 'top' });
    iy += 0.75;
  }

  s.addText('FIT: every pain has a named reliever; every gain has a named creator — the canvas closes on both sides.',
    { x: 0.6, y: 6.75, w: 12.1, h: 0.45, fontFace: FONT, fontSize: 13, bold: true, italic: true, color: TEAL_DEEP, align: 'center' });
  footer(s);
}

// =====================================================================
// SLIDE 12 — FRAMEWORK-AGNOSTIC BY DESIGN
// =====================================================================
{
  const s = newSlide();
  header(s, 'Differentiator 1', 'Framework-agnostic by design', { size: 30,
    sub: 'One shared data model powers every major change framework at once — practitioners work in the vocabulary they already know.' });
  const fw = [
    ['chart-line', 'ADKAR', 'Prosci', 'Individual / cohort readiness — Awareness, Desire, Knowledge, Ability, Reinforcement'],
    ['building-columns', 'Kotter’s 8 Steps', 'Kotter', 'Organizational — sponsorship, coalition, communication, sustaining momentum'],
    ['route', 'Lewin', 'Unfreeze–Change–Refreeze', 'The macro-state every initiative carries, start to close'],
    ['heart', 'Bridges', 'Transition & Kübler-Ross Curve', 'The emotional journey underneath the numbers'],
  ];
  let x = 0.6;
  for (const [icon, name, sub, desc] of fw) {
    card(s, x, 2.9, 2.9, 3.5, { fill: WHITE });
    iconCircle(s, { x: x + 0.3, y: 3.2, d: 0.72, bg: TEAL, icon, pad: 0.17 });
    s.addText(name, { x: x + 0.25, y: 4.0, w: 2.4, h: 0.55, fontFace: FONT, fontSize: 15, bold: true, color: TEAL_DEEP, lineSpacingMultiple: 1.05 });
    s.addText(sub.toUpperCase(), { x: x + 0.25, y: 4.55, w: 2.4, h: 0.35, fontFace: FONT, fontSize: 9.5, bold: true, color: ORANGE, charSpacing: 0.5 });
    s.addText(desc, { x: x + 0.25, y: 4.92, w: 2.4, h: 1.35, fontFace: FONT, fontSize: 11, color: MUTED, lineSpacingMultiple: 1.2 });
    x += 3.05;
  }
  footer(s);
}

// =====================================================================
// SLIDE 13 — GOVERNED AI
// =====================================================================
{
  const s = newSlide();
  header(s, 'Differentiator 2', 'Governed AI, not generic AI', { size: 30,
    sub: '14 seeded use cases, every one restricted to a tier that keeps a human as the decision-maker.' });
  const tiers = [
    ['eye', 'ASSISTIVE', TEAL, MINT, 'The AI observes, analyzes, or suggests. A human performs the task and makes the decision — e.g. flagging a barrier pattern for review.'],
    ['pen-to-square', 'AUGMENTED', ORANGE, ORANGE_LIGHT, 'The AI drafts, classifies or summarizes at scale — but a human must review, edit and approve before it is finalized or sent.'],
    ['ban', 'AUTONOMOUS', RED, RED_LIGHT, 'Deliberately out of scope. No journi use case ever takes an irreversible action on its own.'],
  ];
  let x = 0.6;
  for (const [icon, name, color, bg, desc] of tiers) {
    card(s, x, 2.9, 3.85, 2.75, { fill: bg });
    iconCircle(s, { x: x + 0.28, y: 3.18, d: 0.62, bg: color, icon, pad: 0.15 });
    s.addText(name, { x: x + 1.05, y: 3.24, w: 2.6, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color, valign: 'middle', charSpacing: 1 });
    s.addText(desc, { x: x + 0.28, y: 3.95, w: 3.3, h: 1.55, fontFace: FONT, fontSize: 11.5, color: name === 'AUTONOMOUS' ? RED : MUTED, italic: name === 'AUTONOMOUS', lineSpacingMultiple: 1.22 });
    x += 4.0;
  }
  card(s, 0.6, 5.95, 12.1, 0.95, { fill: TEAL_DEEP });
  s.addText('Every suggestion is labeled "AI-generated — review required." Every outcome — accepted, edited, or rejected — is logged to a full usage and override audit trail an Organization Admin can review.',
    { x: 0.95, y: 5.95, w: 11.4, h: 0.95, fontFace: FONT, fontSize: 12.5, color: 'E3F0EC', valign: 'middle', lineSpacingMultiple: 1.2 });
  footer(s, true);
}

// =====================================================================
// SLIDE 14 — BUILT FOR THE ENTERPRISE
// =====================================================================
{
  const s = newSlide();
  header(s, 'Differentiator 3', 'Built for the enterprise, not just the pilot', { size: 28 });
  const feats = [
    ['sitemap', 'Multi-tenant hierarchy', 'Group → Organization → Project, with hard data isolation — one installation serves many clients or business units safely'],
    ['users-gear', '9-role RBAC + runtime Permission Matrix', 'Reshape who can do what without a code change or a redeploy'],
    ['file-signature', 'Justification governance', 'Every score/state change is stage-then-justify, appended atomically to a per-project audit log'],
    ['server', 'No forced cloud dependency', 'Windows-installable, local SQLite persistence — deploy where your data policy requires'],
  ];
  let y = 2.3;
  for (const [icon, name, desc] of feats) {
    card(s, 0.6, y, 12.1, 1.0, { fill: MINT, shadow: false });
    iconCircle(s, { x: 0.85, y: y + 0.16, d: 0.68, bg: TEAL, icon, pad: 0.16 });
    s.addText(name, { x: 1.85, y: y + 0.13, w: 3.7, h: 0.75, fontFace: FONT, fontSize: 14, bold: true, color: TEAL_DEEP, valign: 'middle', lineSpacingMultiple: 1.1 });
    s.addText(desc, { x: 5.65, y: y + 0.13, w: 6.9, h: 0.75, fontFace: FONT, fontSize: 12, color: MUTED, valign: 'middle', lineSpacingMultiple: 1.15 });
    y += 1.15;
  }
  footer(s);
}

// =====================================================================
// SLIDE 15 — PROVEN ACROSS TRANSFORMATION TYPES
// =====================================================================
{
  const s = newSlide();
  header(s, 'Proof', 'Proven across 8 transformation types, 3 sectors', { size: 26,
    sub: 'journi ships pre-seeded with 14 illustrative cases — evaluation starts from realistic data, not a blank page.' });
  const types = [
    ['rocket', 'ERP Implementation'], ['robot', 'Business Process Automation'], ['certificate', 'QMS Implementation'], ['diagram-project', 'Business Process Reengineering'],
    ['building-columns', 'Operating Model Redesign'], ['people-group', 'Cultural / Values Transformation'], ['scale-balanced', 'Compliance-Driven Change'], ['graduation-cap', 'Training & Skills Development'],
  ];
  const tw = 2.92, th = 1.05, gap = 0.1;
  for (let i = 0; i < types.length; i++) {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * (tw + gap), y = 2.65 + row * (th + gap);
    card(s, x, y, tw, th, { fill: MINT, shadow: false });
    iconCircle(s, { x: x + 0.18, y: y + (th - 0.5) / 2, d: 0.5, bg: TEAL, icon: types[i][0], pad: 0.12 });
    s.addText(types[i][1], { x: x + 0.82, y: y, w: tw - 0.98, h: th, fontFace: FONT, fontSize: 11, bold: true, color: TEAL_DEEP, valign: 'middle', lineSpacingMultiple: 1.05 });
  }
  s.addText('SECTORS SEEDED TODAY', { x: 0.6, y: 5.05, w: 5, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: ORANGE, charSpacing: 1 });
  const sectors = [['industry', 'Manufacturing'], ['truck', 'Logistics & Transportation'], ['heart-pulse', 'Health']];
  let x2 = 0.6;
  for (const [icon, name] of sectors) {
    card(s, x2, 5.5, 3.95, 0.85, { fill: WHITE });
    iconCircle(s, { x: x2 + 0.2, y: 5.63, d: 0.58, bg: ORANGE, icon, pad: 0.14 });
    s.addText(name, { x: x2 + 0.95, y: 5.5, w: 2.9, h: 0.85, fontFace: FONT, fontSize: 13, bold: true, color: INK, valign: 'middle' });
    x2 += 4.13;
  }
  s.addText('The data model is sector-agnostic — new sectors and transformation types extend the same seed pattern.',
    { x: 0.6, y: 6.55, w: 12.1, h: 0.4, fontFace: FONT, fontSize: 11.5, italic: true, color: MUTED });
  footer(s);
}

// =====================================================================
// SLIDE 16 — COMPETITIVE LANDSCAPE
// =====================================================================
{
  const s = newSlide();
  header(s, 'Why journi', 'How journi compares to the status quo', { size: 28 });
  const headRow = [
    { text: '', options: { fill: { color: WHITE } } },
    { text: 'Spreadsheets\n& decks', options: { fill: { color: TEAL_MID }, color: WHITE, bold: true, align: 'center', fontSize: 12 } },
    { text: 'Generic\nPM tools', options: { fill: { color: TEAL_MID }, color: WHITE, bold: true, align: 'center', fontSize: 12 } },
    { text: 'Legacy\nOCM suites', options: { fill: { color: TEAL_MID }, color: WHITE, bold: true, align: 'center', fontSize: 12 } },
    { text: 'journi', options: { fill: { color: ORANGE }, color: WHITE, bold: true, align: 'center', fontSize: 13 } },
  ];
  const dataRows = [
    ['System of record for readiness', '✗', '✗', '~', '✓'],
    ['Framework-agnostic\n(ADKAR+Kotter+Lewin+Bridges)', '✗', '✗', '~ locked-in', '✓'],
    ['Justified, audited change log', '✗', '~', '~', '✓'],
    ['Governed AI (tiered, human checkpoint)', '✗', '✗', '✗', '✓'],
    ['Lightweight, Windows-installable deploy', '✓', '~', '✗ heavy', '✓'],
  ];
  const symColor = (v) => (v.includes('✓') ? TEAL : v.includes('✗') ? RED : ORANGE);
  const rows = [headRow];
  dataRows.forEach((r, i) => {
    const bg = i % 2 === 0 ? WHITE : MINT;
    rows.push([
      { text: r[0], options: { fill: { color: bg }, color: INK, bold: true, fontSize: 11.5, valign: 'middle' } },
      ...r.slice(1).map((v, ci) => ({
        text: v, options: {
          fill: { color: ci === 3 ? ORANGE_LIGHT : bg }, color: symColor(v), bold: true, align: 'center', fontSize: 14, valign: 'middle',
        },
      })),
    ]);
  });
  s.addTable(rows, {
    x: 0.6, y: 2.2, w: 12.1, h: 4.6,
    colW: [4.0, 2.0, 1.9, 1.9, 2.3],
    border: { type: 'solid', color: 'DBE6E3', pt: 0.75 },
    fontFace: FONT, autoPage: false, valign: 'middle',
  });
  footer(s);
}

// =====================================================================
// SLIDE 17 — BUSINESS OUTCOMES / ROI
// =====================================================================
{
  const s = newSlide();
  header(s, 'Business Outcomes', 'What a defensible readiness process protects', { size: 26,
    sub: 'Every failed or delayed transformation carries the full cost of the underlying business case — journi protects that ROI, not just a compliance checkbox.' });
  const outs = [
    ['triangle-exclamation', 'Fewer late surprises', 'Resistance and sponsorship gaps surface while still cheap to fix, not after go-live'],
    ['bolt', 'Faster diagnosis-to-action', 'AI-assisted classification and drafting compress hours of analysis into minutes'],
    ['gavel', 'Defensible go/no-go evidence', 'Phase Gates fuse PM and CM inputs into one named, accountable Joint Decision Record'],
    ['arrow-trend-up', 'Protected business-case ROI', 'The investment only pays off if people adopt it — this is where that risk is managed'],
  ];
  let x = 0.6;
  for (const [icon, t, d] of outs) {
    card(s, x, 2.95, 2.9, 3.35, { fill: WHITE });
    iconCircle(s, { x: x + 0.28, y: 3.25, d: 0.75, bg: TEAL, icon, pad: 0.18 });
    s.addText(t, { x: x + 0.25, y: 4.15, w: 2.4, h: 0.7, fontFace: FONT, fontSize: 13.5, bold: true, color: TEAL_DEEP, lineSpacingMultiple: 1.1 });
    s.addText(d, { x: x + 0.25, y: 4.85, w: 2.4, h: 1.35, fontFace: FONT, fontSize: 11, color: MUTED, lineSpacingMultiple: 1.2 });
    x += 3.05;
  }
  footer(s);
}

// =====================================================================
// SLIDE 18 — IDEAL CUSTOMER FIT CHECKLIST
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  s.addText('THE FIT, SUMMARIZED', { x: 0.6, y: 0.45, w: 10, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: ORANGE, charSpacing: 2 });
  s.addText('journi is the right fit if you...', { x: 0.6, y: 0.82, w: 12, h: 0.85, fontFace: FONT, fontSize: 30, bold: true, color: WHITE });
  const checks = [
    'Run several concurrent transformation initiatives and need one shared view of readiness',
    'Need an audit-ready governance trail behind every readiness score and status change',
    'Want AI acceleration without taking on ungoverned compliance or trust risk',
    'Operate multilingual and/or multi-site teams, including Arabic-speaking or francophone populations',
    'Need a Windows-installable or on-premise-friendly option, not a mandatory cloud subscription',
    'Have a PMO and a Change function that currently don’t share a single timeline',
  ];
  let y = 2.0;
  for (const c of checks) {
    iconCircle(s, { x: 0.6, y: y + 0.05, d: 0.5, bg: ORANGE, icon: 'check', pad: 0.13 });
    s.addText(c, { x: 1.35, y, w: 11.2, h: 0.66, fontFace: FONT, fontSize: 14.5, color: WHITE, valign: 'middle', lineSpacingMultiple: 1.15 });
    y += 0.8;
  }
  footer(s, true);
}

// =====================================================================
// SLIDE 19 — NEXT STEPS
// =====================================================================
{
  const s = newSlide();
  header(s, 'Next Steps', 'A low-risk way to prove the fit', { size: 30 });
  const steps = [
    ['seedling', '01', 'Seed one real project', 'Load journi with one active initiative instead of a demo — real stakeholders, real ADKAR baseline'],
    ['calendar-check', '02', '30-day evaluation window', 'Run a single Phase Gate cycle through journi alongside your current process, side by side'],
    ['scale-balanced', '03', 'Decide on evidence', 'Compare the Joint Decision Record and Readiness Index against what your Steering Committee had before'],
  ];
  let x = 0.6;
  for (const [icon, num, title, desc] of steps) {
    card(s, x, 2.55, 3.85, 3.7, { fill: WHITE });
    s.addText(num, { x: x + 0.3, y: 2.75, w: 1.6, h: 0.9, fontFace: FONT, fontSize: 38, bold: true, color: MINT2 });
    iconCircle(s, { x: x + 2.75, y: 2.85, d: 0.75, bg: ORANGE, icon, pad: 0.18 });
    s.addText(title, { x: x + 0.3, y: 3.75, w: 3.3, h: 0.65, fontFace: FONT, fontSize: 15.5, bold: true, color: TEAL_DEEP, lineSpacingMultiple: 1.1 });
    s.addText(desc, { x: x + 0.3, y: 4.4, w: 3.3, h: 1.7, fontFace: FONT, fontSize: 12, color: MUTED, lineSpacingMultiple: 1.25 });
    x += 4.1;
  }
  footer(s);
}

// =====================================================================
// SLIDE 20 — THANK YOU
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 2.35, d: 0.85, bg: ORANGE, icon: 'paper-plane', pad: 0.19 });
  s.addText('Let’s map the journey.', { x: 0.7, y: 3.35, w: 10.5, h: 1.0, fontFace: FONT, fontSize: 38, bold: true, color: WHITE });
  s.addText('journi — the human side of change, mapped as a journey', { x: 0.75, y: 4.25, w: 9.5, h: 0.55, fontFace: FONT, fontSize: 16, italic: true, color: 'B8D4CE' });
  s.addText('POWERACT Consulting  ·  Confidential', { x: 0.75, y: 6.75, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A' });
}

pptx.writeFile({ fileName: path.join(__dirname, 'journi_Value_Proposition.pptx') }).then(async () => {
  console.log('wrote journi_Value_Proposition.pptx');
  await require('./fix-pptx.js').fixPptx(path.join(__dirname, 'journi_Value_Proposition.pptx'));
});
