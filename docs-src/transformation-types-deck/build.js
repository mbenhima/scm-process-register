const path = require('path');
const {
  pptx, newSlide, footer, header, iconCircle, card, pillBadge, bullets, tableSlide, phaseFlow, A,
  TEAL_DEEP, TEAL, TEAL_MID, MINT, MINT2, ORANGE, ORANGE_LIGHT, INK, MUTED, WHITE, RED, RED_LIGHT,
  BLUE, BLUE_LIGHT, PURPLE, PURPLE_LIGHT, FONT,
} = require('./deck.js');
const { TYPES } = require('./data.js');

// =====================================================================
// SLIDE 1 — TITLE
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 0.7, d: 0.85, bg: ORANGE, icon: 'cubes', pad: 0.18 });
  s.addText('journi\'s 8 Transformation Types', { x: 0.7, y: 2.2, w: 11.7, h: 1.1, fontFace: FONT, fontSize: 42, bold: true, color: WHITE });
  s.addText('How journi implements each archetype, end to end', { x: 0.75, y: 3.2, w: 11, h: 0.55, fontFace: FONT, fontSize: 19, italic: true, color: 'B8D4CE' });
  s.addText('ERP · Cultural / Values · BPR · Automation · QMS · Operating Model · Compliance · Training & Skills — one manufacturing tenant, Bouregreg Group', { x: 0.75, y: 3.85, w: 11, h: 0.65, fontFace: FONT, fontSize: 13.5, color: '9FC2BC', lineSpacingMultiple: 1.2 });
  const stats = [['8', 'Archetypes'], ['9', 'Live Alerts'], ['21', 'journi Modules'], ['1', 'Shared Tenant']];
  let x = 0.75;
  for (const [n, l] of stats) {
    s.addText(n, { x, y: 4.9, w: 2.4, h: 0.75, fontFace: FONT, fontSize: 30, bold: true, color: ORANGE });
    s.addText(l.toUpperCase(), { x, y: 5.58, w: 2.4, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: '9FC2BC', charSpacing: 1 });
    x += 2.5;
  }
  s.addText('Manufacturing Sector · Bouregreg Group Scenario Library · Confidential', { x: 0.75, y: 6.85, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A' });
}

// =====================================================================
// SLIDE 2 — WHY 8 TYPES, ONE TENANT
// =====================================================================
{
  const s = newSlide();
  header(s, 'One Tenant, Eight Kinds of Change', 'journi\'s data model makes this the natural way to show "more than one kind of change"', { size: 22,
    sub: 'Bouregreg Group\'s single tenant holds one Organization, under which every Change Management Project runs — several CM Projects share one Stakeholder Map, one Codebook, and one Permission Matrix, while each keeps its own Lewin phase, ADKAR scores, resistance log, and sustainment record.' });
  const items = [
    'Every one of the 8 archetypes below runs on a Phase Template with a registered End-to-End lifecycle behind it — not an ad-hoc project structure invented per case.',
    'Two of journi\'s live alerts — Change Saturation (ALT-008) and Communication Overload (ALT-011) — only fire when several of these projects target the same population at once, which is exactly what running all 8 concurrently under one Organization makes real.',
    'A ninth case in the same library, Settat Plant Consolidation & Restructuring, runs on journi\'s 4 generic core chains instead, since no dedicated lifecycle exists for Restructuring — this guide states that gap plainly rather than imply otherwise.',
  ];
  bullets(s, 0.6, 2.55, 12.1, 3.6, items, { fontSize: 13, lineSpacingMultiple: 1.35 });
  footer(s);
}

// =====================================================================
// SLIDE 3 — OVERVIEW GRID
// =====================================================================
{
  const s = newSlide();
  header(s, 'The 8 Types, at a Glance', 'Every archetype journi implements with a dedicated lifecycle', { size: 24 });
  const cols = 4, w = 2.92, h = 2.15, gapX = 0.14, gapY = 0.18;
  TYPES.forEach((t, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = 0.6 + col * (w + gapX), y = 2.15 + row * (h + gapY);
    card(s, x, y, w, h, { fill: MINT });
    iconCircle(s, { x: x + (w - 0.62) / 2, y: y + 0.2, d: 0.62, bg: t.color, icon: t.icon, pad: 0.14 });
    s.addText(t.name, { x: x + 0.12, y: y + 0.95, w: w - 0.24, h: 0.6, fontFace: FONT, fontSize: 11.5, bold: true, color: TEAL_DEEP, align: 'center', valign: 'top', lineSpacingMultiple: 1.05 });
    s.addText(t.templateId, { x: x + 0.12, y: y + 1.65, w: w - 0.24, h: 0.3, fontFace: FONT, fontSize: 9, bold: true, color: MUTED, align: 'center' });
  });
  footer(s);
}

// =====================================================================
// PER-TYPE SLIDE BUILDERS
// =====================================================================
function typeDivider(t, n) {
  const s = newSlide(t.color);
  s.addText(`TRANSFORMATION TYPE ${n} OF 8`, { x: 0.6, y: 0.5, w: 10, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: WHITE, charSpacing: 2 });
  iconCircle(s, { x: 0.6, y: 0.95, d: 0.95, bg: WHITE, icon: t.icon, pad: 0.2 });
  s.addText(t.name, { x: 1.85, y: 0.95, w: 10, h: 0.95, fontFace: FONT, fontSize: 32, bold: true, color: WHITE, valign: 'middle' });
  s.addText(t.oneLiner, { x: 0.6, y: 2.15, w: 12.1, h: 0.95, fontFace: FONT, fontSize: 15.5, italic: true, color: 'F0F0F0', lineSpacingMultiple: 1.3 });
  card(s, 0.6, 3.35, 5.85, 2.9, { fill: 'FFFFFF', shadow: false });
  s.addText('BUSINESS DRIVER', { x: 0.85, y: 3.5, w: 5.3, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: t.color, charSpacing: 1 });
  s.addText(t.businessDriver, { x: 0.85, y: 3.85, w: 5.3, h: 1.2, fontFace: FONT, fontSize: 12, color: INK, lineSpacingMultiple: 1.25 });
  s.addText('TARGET POPULATION PATTERN', { x: 0.85, y: 5.15, w: 5.3, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: t.color, charSpacing: 1 });
  s.addText(t.population, { x: 0.85, y: 5.5, w: 5.3, h: 0.7, fontFace: FONT, fontSize: 11.5, color: INK, lineSpacingMultiple: 1.2 });
  card(s, 6.65, 3.35, 6.05, 2.9, { fill: 'FFFFFF', shadow: false });
  s.addText('PHASE TEMPLATE', { x: 6.9, y: 3.5, w: 5.55, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: t.color, charSpacing: 1 });
  s.addText(`${t.templateId} — ${t.phaseCount} phases`, { x: 6.9, y: 3.85, w: 5.55, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: INK });
  let py = 4.35;
  t.phases.slice(0, 4).forEach((p, i) => {
    s.addText(`${i + 1}. ${p}`, { x: 6.9, y: py, w: 5.55, h: 0.3, fontFace: FONT, fontSize: 10.8, color: INK });
    py += 0.32;
  });
  s.addText(`… ${t.phases.length - 4} more (next slide)`, { x: 6.9, y: py + 0.05, w: 5.55, h: 0.3, fontFace: FONT, fontSize: 10, italic: true, color: MUTED });
  footer(s, true);
}

function phaseTemplateSlide(t) {
  const s = newSlide();
  header(s, `${t.id} · journi Phase Template`, `${t.templateId}: ${t.phaseCount} Phases, In Order`, { size: 22, titleColor: t.color });
  const usedH = phaseFlow(s, 0.6, 2.3, 12.1, t.phases, t.color);
  s.addText(t.weighting, { x: 0.6, y: 2.3 + usedH + 0.5, w: 12.1, h: 2.4, fontFace: FONT, fontSize: 13, color: INK, lineSpacingMultiple: 1.3, italic: false });
  s.addText('FRAMEWORK WEIGHTING FOR THIS ARCHETYPE', { x: 0.6, y: 2.3 + usedH + 0.15, w: 12.1, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: ORANGE, charSpacing: 1 });
  footer(s);
}

function modulesSlide(t) {
  const s = newSlide();
  header(s, `${t.id} · journi Modules`, 'Which modules dominate this archetype', { size: 24, titleColor: t.color });
  let y = 2.25;
  for (const [mod, note] of t.modules) {
    card(s, 0.6, y, 12.1, 1.02, { fill: MINT, shadow: false });
    s.addText(mod, { x: 0.85, y: y + 0.12, w: 3.5, h: 0.78, fontFace: FONT, fontSize: 13, bold: true, color: t.color, valign: 'middle', lineSpacingMultiple: 1.1 });
    s.addText(note, { x: 4.45, y: y + 0.12, w: 8.05, h: 0.78, fontFace: FONT, fontSize: 11.8, color: INK, valign: 'middle', lineSpacingMultiple: 1.2 });
    y += 1.14;
  }
  footer(s);
}

function scenarioSlide(t) {
  const s = newSlide();
  const sc = t.scenario;
  header(s, `${t.id} · Real Scenario`, sc.name, { size: 21, titleColor: t.color,
    sub: `${sc.population}  ·  ${sc.weeks}` });
  const rows = sc.milestones.map(([wk, text]) => [wk, text]);
  tableSlide(s, ['Week', 'Milestone'], rows, { colW: [1.6, 10.5], y: 2.55, fontSize: 11.5, headFill: t.color });
  const tableH = 0.4 * (rows.length + 1) + 0.3;
  footer(s);
}

function alertsSlide(t) {
  const s = newSlide(t.color);
  s.addText(`${t.id.toUpperCase()} · ALERTS & PROOF`, { x: 0.6, y: 0.5, w: 11, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: WHITE, charSpacing: 2 });
  s.addText(t.alerts.fires.length ? 'What This Case Fires' : 'What This Case Proves By Not Firing', { x: 0.6, y: 0.88, w: 12, h: 0.75, fontFace: FONT, fontSize: 26, bold: true, color: WHITE });
  card(s, 0.6, 1.9, 12.1, 1.6, { fill: WHITE, shadow: false });
  if (t.alerts.fires.length) {
    s.addText('ALERTS THIS CASE EXERCISES', { x: 0.85, y: 2.05, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: t.color, charSpacing: 1 });
    s.addText(t.alerts.fires.join('   ·   '), { x: 0.85, y: 2.38, w: 11.6, h: 1.0, fontFace: FONT, fontSize: 13.5, bold: true, color: INK, lineSpacingMultiple: 1.25 });
  } else {
    s.addText('NO LIVE ALERT FIRES IN THIS PROGRAM\'S REAL RECORD', { x: 0.85, y: 2.05, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: t.color, charSpacing: 1 });
    s.addText('Stated plainly, not manufactured — a clean record reported as a clean record.', { x: 0.85, y: 2.38, w: 11.6, h: 1.0, fontFace: FONT, fontSize: 13.5, bold: true, color: INK, lineSpacingMultiple: 1.25 });
  }
  card(s, 0.6, 3.7, 12.1, 1.55, { fill: WHITE, shadow: false });
  s.addText('WHY', { x: 0.85, y: 3.85, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: t.color, charSpacing: 1 });
  s.addText(t.alerts.note, { x: 0.85, y: 4.18, w: 11.6, h: 1.0, fontFace: FONT, fontSize: 12.5, color: INK, lineSpacingMultiple: 1.25 });
  card(s, 0.6, 5.45, 12.1, 1.55, { fill: WHITE, shadow: false });
  s.addText('WHAT THIS GUIDE PROVES, CONCRETELY', { x: 0.85, y: 5.6, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: t.color, charSpacing: 1 });
  s.addText(t.scenario.proof, { x: 0.85, y: 5.93, w: 11.6, h: 1.0, fontFace: FONT, fontSize: 12, italic: true, color: INK, lineSpacingMultiple: 1.2 });
  footer(s, true);
}

function teamSlide(t) {
  const s = newSlide();
  header(s, `${t.id} · Tenant Setup`, 'The RACSI Team for This Case', { size: 25, titleColor: t.color,
    sub: 'journi\'s 7-code RACSI role taxonomy (ES/CM/PM/FPO/ITL/SUP/EU), assigned to real, named accounts for this program.' });
  tableSlide(s, ['Name', 'RACSI Code', 'Role'], t.team, { colW: [3.4, 1.8, 6.9], y: 2.55, fontSize: 12, headFill: t.color });
  footer(s);
}

// Build all per-type sections
TYPES.forEach((t, i) => {
  typeDivider(t, i + 1);
  phaseTemplateSlide(t);
  teamSlide(t);
  modulesSlide(t);
  scenarioSlide(t);
  alertsSlide(t);
});

// =====================================================================
// CROSS-TYPE COMPARISON
// =====================================================================
{
  const s = newSlide();
  header(s, 'Cross-Type Comparison', 'Population, duration, and dominant framework, side by side', { size: 23 });
  const rows = TYPES.map((t) => [t.id, t.scenario.population.split(',')[0], t.scenario.weeks, t.weighting.split('.')[0].replace(/^ADKAR|^Kübler-Ross|^Bridges|^Lewin/, (m) => m)]);
  tableSlide(s, ['Archetype', 'Population', 'Duration', 'Dominant Framework'],
    TYPES.map((t) => [t.id, t.scenario.population.split(',')[0], t.scenario.weeks, t.weighting.split('.')[0]]),
    { colW: [2.3, 2.9, 2.2, 4.7], y: 2.2, fontSize: 10.2 });
  footer(s);
}

// =====================================================================
// ALERTS ACROSS THE PORTFOLIO
// =====================================================================
{
  const s = newSlide();
  header(s, 'Alerts Across the Portfolio', 'Which of the 9 live alerts each archetype exercises', { size: 23 });
  const rows = TYPES.map((t) => [t.id, t.alerts.fires.length ? t.alerts.fires.map((a) => a.split(' (')[0]).join(', ') : 'None (by design)']);
  tableSlide(s, ['Archetype', 'Alerts Exercised'], rows, { colW: [2.6, 9.5], y: 2.3, fontSize: 11.5 });
  footer(s);
}

// =====================================================================
// PORTFOLIO-WIDE ALERTS
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  s.addText('THE PORTFOLIO VIEW', { x: 0.6, y: 0.5, w: 10, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: ORANGE, charSpacing: 2 });
  s.addText('Two alerts only the portfolio, not any single project, can trigger', { x: 0.6, y: 0.88, w: 12, h: 0.85, fontFace: FONT, fontSize: 25, bold: true, color: WHITE, lineSpacingMultiple: 1.1 });
  const items = [
    ['ALT-008', 'Change Saturation Threshold Breached', 'Fires once a project\'s population segment is targeted by 2 or more other concurrent initiatives — true almost everywhere in this library by design, since the ERP program, the Operating Model redesign, and the Training & Skills program all reach broad, overlapping populations across the same three sites.'],
    ['ALT-011', 'Communication Overload Detected', 'Fires once combined not-yet-sent communications queued across a population\'s concurrent initiatives exceed three — realistic here precisely because 8 programs are drafting town halls, FAQs, and go-live messages against overlapping audiences at the same time.'],
  ];
  let y = 2.1;
  for (const [id, name, desc] of items) {
    card(s, 0.6, y, 12.1, 2.3, { fill: WHITE, shadow: false });
    pillBadge(s, 0.85, y + 0.2, id, ORANGE);
    s.addText(name, { x: 2.15, y: y + 0.15, w: 10.3, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: TEAL_DEEP });
    s.addText(desc, { x: 0.85, y: y + 0.65, w: 11.6, h: 1.55, fontFace: FONT, fontSize: 12, color: INK, lineSpacingMultiple: 1.25 });
    y += 2.5;
  }
  footer(s, true);
}

// =====================================================================
// CLOSING
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 2.2, d: 0.85, bg: ORANGE, icon: 'cubes', pad: 0.18 });
  s.addText('Eight kinds of change. One system of record.', { x: 0.7, y: 3.2, w: 11.2, h: 1.0, fontFace: FONT, fontSize: 32, bold: true, color: WHITE });
  s.addText('journi implements every archetype with the same rigor: a real phase template, real modules, real frameworks — and honesty about which alerts actually fire, and which don\'t.', { x: 0.75, y: 4.15, w: 10.8, h: 0.85, fontFace: FONT, fontSize: 15, italic: true, color: 'B8D4CE', lineSpacingMultiple: 1.3 });
  s.addText('Manufacturing Sector · Bouregreg Group Scenario Library · Confidential', { x: 0.75, y: 6.75, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A' });
}

pptx.writeFile({ fileName: path.join(__dirname, 'journi_Transformation_Types_Deep_Dive.pptx') }).then(async () => {
  console.log('wrote journi_Transformation_Types_Deep_Dive.pptx, slide count:', pptx.slides.length);
  await require('./fix-pptx.js').fixPptx(path.join(__dirname, 'journi_Transformation_Types_Deep_Dive.pptx'));
});
