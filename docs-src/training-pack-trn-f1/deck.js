const pptxgen = require('pptxgenjs');
const path = require('path');

const A = (name) => path.join(__dirname, 'assets', `${name}.png`);

const TEAL_DEEP = '15423A';
const TEAL = '1F6459';
const MINT = 'EAF2EF';
const MINT2 = 'DCEEE8';
const ORANGE = 'C2661C';
const ORANGE_LIGHT = 'F7E4D2';
const INK = '16221F';
const MUTED = '5C6D68';
const WHITE = 'FFFFFF';

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
  s.addText('TRN-F1 Training Pack — journi Academy', {
    x: 0.6, y: 7.14, w: 8, h: 0.3, fontFace: FONT, fontSize: 9,
    color: dark ? 'CFE3DD' : MUTED, align: 'left', isTextBox: true,
  });
  s.addText(String(pageN).padStart(2, '0'), {
    x: 12.2, y: 7.14, w: 0.55, h: 0.3, fontFace: FONT, fontSize: 9,
    color: dark ? 'CFE3DD' : MUTED, align: 'right', isTextBox: true,
  });
}
function header(s, kicker, title, opts = {}) {
  const { size = 26, sub = null, kickerColor = ORANGE, titleColor = TEAL_DEEP, titleW = 12.1 } = opts;
  s.addText(kicker.toUpperCase(), {
    x: 0.6, y: 0.35, w: 11, h: 0.32, fontFace: FONT, fontSize: 12, bold: true,
    color: kickerColor, charSpacing: 2, isTextBox: true,
  });
  s.addText(title, {
    x: 0.6, y: 0.68, w: titleW, h: 0.85, fontFace: FONT, fontSize: size, bold: true,
    color: titleColor, valign: 'top', lineSpacingMultiple: 1.02, isTextBox: true,
  });
  let top = 1.65;
  if (sub) {
    s.addText(sub, {
      x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontFace: FONT, fontSize: 12.5, color: MUTED,
      valign: 'top', lineSpacingMultiple: 1.15, isTextBox: true,
    });
    top = 2.1;
  }
  return top;
}
function iconCircle(s, { x, y, d = 0.6, bg = TEAL, icon, pad = 0.15 }) {
  s.addShape('ellipse', { x, y, w: d, h: d, fill: { color: bg }, line: { type: 'none' } });
  if (icon) s.addImage({ path: A(icon), x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
}
function card(s, x, y, w, h, opts = {}) {
  const { fill = WHITE, shadow = true, radius = 0.05 } = opts;
  s.addShape('roundRect', { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { type: 'none' }, shadow: shadow ? { ...SHADOW } : undefined });
}
function pillBadge(s, x, y, text, color) {
  const w = 0.28 + text.length * 0.082;
  s.addShape('roundRect', { x, y, w, h: 0.3, rectRadius: 0.5, fill: { color }, line: { type: 'none' } });
  s.addText(text, { x, y, w, h: 0.3, fontFace: FONT, fontSize: 9.5, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  return w;
}
function bulletList(s, items, opts) {
  const { x, y, w, h, size = 13, color = INK, gap = 8, bold = false } = opts;
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: { code: '2022', indent: 18 }, breakLine: i < items.length - 1, color, bold } })),
    { x, y, w, h, fontFace: FONT, fontSize: size, valign: 'top', lineSpacingMultiple: 1.15, paraSpaceAfter: gap, isTextBox: true });
}

// =====================================================================
// SLIDE 1 — TITLE
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 0.7, d: 0.85, bg: ORANGE, icon: 'sitemap', pad: 0.19 });
  s.addText('FOUNDATION · TRN-F1', { x: 0.75, y: 1.72, w: 10, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true });
  s.addText('Change Management Foundations\n& the journi Platform', { x: 0.7, y: 2.15, w: 11.5, h: 1.7, fontFace: FONT, fontSize: 40, bold: true, color: WHITE, lineSpacingMultiple: 1.05, isTextBox: true });
  s.addText('Training Delivery Pack — Instructional Slides, Facilitator Guide & Quiz Bank', { x: 0.75, y: 3.95, w: 10.5, h: 0.5, fontFace: FONT, fontSize: 16, italic: true, color: 'B8D4CE', isTextBox: true });
  const stats = [['2', 'Days'], ['4', 'Half-Days'], ['4', 'Quizzes'], ['4', 'Workshops'], ['1', 'Training Exam']];
  let x = 0.75;
  for (const [n, l] of stats) {
    s.addText(n, { x, y: 4.85, w: 1.9, h: 0.6, fontFace: FONT, fontSize: 26, bold: true, color: ORANGE, isTextBox: true });
    s.addText(l.toUpperCase(), { x, y: 5.42, w: 1.9, h: 0.3, fontFace: FONT, fontSize: 9.5, bold: true, color: '9FC2BC', charSpacing: 1, isTextBox: true });
    x += 1.95;
  }
  s.addText('journi Academy · Prepared for POWERACT Consulting · Confidential', { x: 0.75, y: 6.85, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A', isTextBox: true });
}

// =====================================================================
// SLIDE 2 — TRAINING OVERVIEW
// =====================================================================
{
  const s = newSlide();
  header(s, 'Training Overview', 'What this training covers', { size: 27 });
  s.addText('GOALS', { x: 0.6, y: 2.1, w: 5.7, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true });
  bulletList(s, [
    'Explain why ~70% of transformations fail on the human side and how ADKAR, Kotter, Lewin and Bridges/Kübler-Ross address it',
    "Navigate journi's tenant hierarchy (Group / Organization / Project) and role-based access",
    'Read the Organizational Breakdown Structure (OBS) and the Macro Process / SIPOC / RACSI registry',
    'Explain the Assistive / Augmented AI governance model and why Autonomous AI is out of scope',
  ], { x: 0.6, y: 2.45, w: 5.9, h: 3.4, size: 12.5 });

  card(s, 6.75, 2.1, 6.0, 1.5, { fill: MINT, shadow: false });
  s.addText('TARGET AUDIENCE', { x: 7.0, y: 2.28, w: 5.5, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true });
  s.addText('New Change Managers, HR Business Partners, PMO members, People Managers — no prior journi experience required.', { x: 7.0, y: 2.6, w: 5.5, h: 0.95, fontFace: FONT, fontSize: 12, color: INK, lineSpacingMultiple: 1.2, isTextBox: true });

  card(s, 6.75, 3.7, 6.0, 2.15, { fill: WHITE, shadow: true });
  s.addText('AGENDA AT A GLANCE', { x: 7.0, y: 3.86, w: 5.5, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true });
  const agendaRows = [
    ['Day 1 AM', 'Why Change Management, Why journi'],
    ['Day 1 PM', 'The Process Backbone & Governed AI'],
    ['Day 2 AM', 'Reading the Program Layer'],
    ['Day 2 PM', 'Metrics, Dashboards & the Field Notebook'],
  ];
  let ay = 4.2;
  for (const [d, t] of agendaRows) {
    s.addText([{ text: d + '  ', options: { bold: true, color: TEAL } }, { text: t, options: { color: INK } }],
      { x: 7.0, y: ay, w: 5.5, h: 0.36, fontFace: FONT, fontSize: 11.5, isTextBox: true });
    ay += 0.4;
  }
  card(s, 0.6, 6.15, 12.15, 0.75, { fill: TEAL_DEEP, shadow: false });
  s.addText([{ text: 'Prerequisite:  ', options: { bold: true, color: ORANGE } }, { text: 'None — this is the entry training for the Foundation level. Golden rule: every half-day pairs one quiz with one workshop.', options: { color: WHITE } }],
    { x: 0.85, y: 6.15, w: 11.65, h: 0.75, fontFace: FONT, fontSize: 12, valign: 'middle', isTextBox: true });
  footer(s);
}

// ---------------------------------------------------------------------
function dividerSlide(dayLabel, theme, sessionsSummary) {
  const s = newSlide(TEAL);
  s.addText(dayLabel.toUpperCase(), { x: 0.6, y: 2.3, w: 11, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true });
  s.addText(theme, { x: 0.6, y: 2.75, w: 12, h: 1.3, fontFace: FONT, fontSize: 36, bold: true, color: WHITE, isTextBox: true });
  s.addText(sessionsSummary, { x: 0.6, y: 4.05, w: 11, h: 0.6, fontFace: FONT, fontSize: 14, italic: true, color: 'CFE3DD', isTextBox: true });
  footer(s, true);
}

function contentSlide(kicker, title, duration, bullets, opts = {}) {
  const s = newSlide();
  header(s, kicker, title, { size: 24 });
  s.addText(`${duration} min`, { x: 10.9, y: 0.42, w: 1.8, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: TEAL, align: 'right', isTextBox: true });
  bulletList(s, bullets, { x: 0.6, y: 1.95, w: 8.1, h: 4.7, size: 14, gap: 12 });

  const noteX = 9.0, noteW = 3.7;
  card(s, noteX, 1.95, noteW, 4.7, { fill: MINT, shadow: false });
  s.addText('FACILITATOR NOTE', { x: noteX + 0.25, y: 2.15, w: noteW - 0.5, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true });
  s.addText(opts.note || '', { x: noteX + 0.25, y: 2.5, w: noteW - 0.5, h: 4.0, fontFace: FONT, fontSize: 11.5, color: INK, lineSpacingMultiple: 1.25, valign: 'top', isTextBox: true });
  footer(s);
}

function quizSlide(quiz, dayLabel) {
  const s = newSlide(MINT2);
  iconCircle(s, { x: 0.75, y: 0.7, d: 0.85, bg: ORANGE, icon: 'circle-question', pad: 0.19 });
  s.addText(`${dayLabel} · FORMATIVE CHECK`, { x: 1.85, y: 0.78, w: 9, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: ORANGE, charSpacing: 1.5, isTextBox: true });
  s.addText(`Quiz ${quiz.id}`, { x: 1.85, y: 1.15, w: 9, h: 0.6, fontFace: FONT, fontSize: 30, bold: true, color: TEAL_DEEP, isTextBox: true });
  s.addText(quiz.topic, { x: 1.85, y: 1.75, w: 9.5, h: 0.4, fontFace: FONT, fontSize: 15, italic: true, color: MUTED, isTextBox: true });

  const specs = [['8', 'ITEMS'], ['15', 'MIN'], ['CLOSED', 'BOOK'], ['N/A', 'PASS MARK']];
  let x = 0.75;
  for (const [n, l] of specs) {
    card(s, x, 2.6, 2.75, 1.2, { fill: WHITE, shadow: true });
    s.addText(n, { x, y: 2.72, w: 2.75, h: 0.55, fontFace: FONT, fontSize: 22, bold: true, color: TEAL, align: 'center', isTextBox: true });
    s.addText(l, { x, y: 3.28, w: 2.75, h: 0.35, fontFace: FONT, fontSize: 9.5, bold: true, color: MUTED, align: 'center', charSpacing: 1, isTextBox: true });
    x += 2.95;
  }

  card(s, 0.75, 4.15, 11.85, 2.15, { fill: WHITE, shadow: false });
  s.addText('HOW TO RUN THIS QUIZ', { x: 1.0, y: 4.35, w: 11.3, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true });
  bulletList(s, [
    'Full 8-question set and answer key: Quiz Bank tab of the TRN-F1 Excel workbook.',
    'Formative only — no pass mark. It checks whether the concept landed before the workshop applies it.',
    'Read each question aloud or project it; do not distribute the answer key beforehand.',
    'Debrief any missed items in under 2 minutes before moving into the workshop.',
  ], { x: 1.0, y: 4.68, w: 11.3, h: 1.5, size: 12.5, color: INK });
  footer(s);
}

function workshopSlide(ws, dayLabel) {
  const s = newSlide();
  iconCircle(s, { x: 0.6, y: 0.4, d: 0.7, bg: TEAL, icon: 'users', pad: 0.16 });
  s.addText(`${dayLabel} · HANDS-ON WORKSHOP`, { x: 1.5, y: 0.42, w: 9, h: 0.32, fontFace: FONT, fontSize: 12, bold: true, color: ORANGE, charSpacing: 1.5, isTextBox: true });
  s.addText([{ text: ws.id + '  ', options: { color: TEAL } }, { text: ws.name, options: { color: TEAL_DEEP } }],
    { x: 1.5, y: 0.72, w: 10.5, h: 0.6, fontFace: FONT, fontSize: 24, bold: true, isTextBox: true });
  s.addText(`${ws.duration} min`, { x: 11.3, y: 0.5, w: 1.4, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: TEAL, align: 'right', isTextBox: true });

  s.addText('GOALS', { x: 0.6, y: 1.65, w: 5.6, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true });
  bulletList(s, ws.goals, { x: 0.6, y: 1.98, w: 5.6, h: 1.3, size: 12.5 });

  s.addText('MATERIALS NEEDED', { x: 0.6, y: 3.35, w: 5.6, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true });
  s.addText(ws.materials, { x: 0.6, y: 3.68, w: 5.6, h: 1.2, fontFace: FONT, fontSize: 12, color: MUTED, lineSpacingMultiple: 1.25, isTextBox: true });

  card(s, 6.55, 1.65, 6.15, 5.15, { fill: MINT, shadow: false });
  s.addText('FACILITATION STEPS', { x: 6.8, y: 1.85, w: 5.65, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true });
  let sy = 2.2;
  ws.agenda.forEach((step, i) => {
    s.addShape('ellipse', { x: 6.8, y: sy, w: 0.4, h: 0.4, fill: { color: TEAL }, line: { type: 'none' } });
    s.addText(`${i + 1}`, { x: 6.8, y: sy, w: 0.4, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText(step, { x: 7.35, y: sy - 0.02, w: 5.15, h: 0.85, fontFace: FONT, fontSize: 11.5, color: INK, lineSpacingMultiple: 1.2, valign: 'top', isTextBox: true });
    sy += 0.95;
  });
  s.addText([{ text: 'Debrief:  ', options: { bold: true, color: TEAL_DEEP } }, { text: ws.debrief, options: { color: INK, italic: true } }],
    { x: 6.8, y: sy + 0.05, w: 5.65, h: 0.65, fontFace: FONT, fontSize: 11, lineSpacingMultiple: 1.2, isTextBox: true });
  footer(s);
}

// =====================================================================
// DAY 1 · AM
// =====================================================================
dividerSlide('Day 1 · AM', 'Why Change Management, Why journi', '120 min content · 15 min quiz (QZ-F1-1) · 90 min workshop (WS-F1-1)');

{
  const s = newSlide();
  header(s, 'Day 1 · AM · Session 1', 'The Human Side of Transformation', { size: 24 });
  s.addText('75 min', { x: 10.9, y: 0.42, w: 1.8, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: TEAL, align: 'right', isTextBox: true });
  bulletList(s, [
    '~70% of transformations are estimated to fall short primarily because of the human side of change, not the technical build — the widely-cited benchmark this training opens with.',
    'Common root causes: no visible sponsorship, communication that stops after kickoff, resistance that is never surfaced, and no reinforcement plan once go-live passes.',
    'journi teaches four frameworks side by side — each answers a different question about the same change:',
  ], { x: 0.6, y: 1.95, w: 12.1, h: 1.85, size: 13.5, gap: 10 });

  const frameworks = [
    ['ADKAR (Prosci)', 'Is this individual ready?', 'Awareness → Desire → Knowledge → Ability → Reinforcement'],
    ["Kotter's 8-Step Model", 'Is the organization moving in the right sequence?', 'From urgency to anchoring the change in culture'],
    ["Lewin's Change Model", 'What macro-state is the initiative in?', 'Unfreeze → Change → Refreeze'],
    ['Bridges & Kübler-Ross', 'What is the emotional arc?', 'Ending → Neutral Zone → New Beginning'],
  ];
  const gw = 5.95, gh = 1.32, gx0 = 0.6, gy0 = 3.95, gxg = 0.2, gyg = 0.14;
  frameworks.forEach(([name, q, path_], i) => {
    const gx = gx0 + (i % 2) * (gw + gxg);
    const gy = gy0 + Math.floor(i / 2) * (gh + gyg);
    card(s, gx, gy, gw, gh, { fill: MINT, shadow: false });
    s.addText(name, { x: gx + 0.25, y: gy + 0.14, w: gw - 0.5, h: 0.32, fontFace: FONT, fontSize: 14.5, bold: true, color: TEAL_DEEP, isTextBox: true });
    s.addText(q, { x: gx + 0.25, y: gy + 0.5, w: gw - 0.5, h: 0.3, fontFace: FONT, fontSize: 11, italic: true, color: ORANGE, isTextBox: true });
    s.addText(path_, { x: gx + 0.25, y: gy + 0.84, w: gw - 0.5, h: 0.48, fontFace: FONT, fontSize: 10.5, color: INK, lineSpacingMultiple: 1.1, isTextBox: true });
  });
  footer(s);
}

contentSlide('Day 1 · AM · Session 2', 'Platform Tour', 45, [
  "journi's tenant hierarchy has four levels: Group → Organization → Project, with a Change Management Project always linked to a Main Project.",
  'The scope switcher in the top bar moves you between Group, Organization and Project scope — what you can see and do is always filtered by this scope plus your RBAC role.',
  "The Sidebar's modules are ordered around the change lifecycle: process backbone first, then charters and initiative registration, then planning, then readiness, then sustainment.",
  "journi's UI is fully multilingual (English / French / Arabic). An Organization sets a Default Language; an individual user's own language preference takes precedence over it.",
], { note: 'Do this as a live projected walkthrough in the seeded Atlas Industrial Group demo tenant. Have participants follow along on their own laptop rather than just watching.' });

quizSlide({ id: 'QZ-F1-1', topic: 'Framework definitions + platform navigation' }, 'Day 1 · AM');
workshopSlide({
  id: 'WS-F1-1', name: 'Stand Up a Tenant', duration: 90,
  goals: ["Build a correct 4-level tenant hierarchy for a new client", "Configure an Organization's default language"],
  materials: 'A clean journi demo environment with "Reset Demo Data" run beforehand; the manufacturing-client scenario brief (1-pager); each participant logged in with a Change Manager or Org Admin seed account.',
  agenda: [
    'Create a Group and an Organization for a new manufacturing client scenario.',
    'Register a Main Project and a linked Change Management Project.',
    "Set the Organization's Default Language and explain the precedence rule to a neighbor.",
    "Review the M2 user list and identify each seeded role's scope.",
  ],
  debrief: 'Ask one pair to explain, in their own words, why the CM Project is linked to the Main Project rather than standing alone.',
}, 'Day 1 · AM');

// =====================================================================
// DAY 1 · PM
// =====================================================================
dividerSlide('Day 1 · PM', 'The Process Backbone & Governed AI', '120 min content · 15 min quiz (QZ-F1-2) · 90 min workshop (WS-F1-2)');

contentSlide('Day 1 · PM · Session 1', 'Macro Processes, SIPOC & RACSI', 60, [
  "journi ships a seeded Macro Process Catalog of 10 Macro Processes — the reusable building blocks of the organization's operating model.",
  'A SIPOC diagram documents a process boundary before change impact is mapped: Suppliers, Inputs, Process, Outputs, Customers.',
  'An End-to-End (E2E) process chain is an ordered sequence of Macro Processes representing one full business process, registered in the E2E Process Registry.',
  'A RACSI grid assigns Responsible, Accountable, Consulted, Support and Informed roles at each step of a process — the backbone that later modules (OBS, stakeholder mapping) plug into.',
], { note: 'Project a real RACSI grid from the seeded scenario and cold-call participants to identify who is "Accountable" vs. "Responsible" on two different rows — this is the single most commonly confused pair of role codes.' });

contentSlide('Day 1 · PM · Session 2', 'OBS and the AI Use Case Library', 60, [
  'The Organizational Breakdown Structure (OBS) is a resourcing and reporting roster for the process backbone — distinct from the RBAC user list, which controls platform login and permissions.',
  'The AI Use Case Library catalogs every governed AI capability across journi, each tagged with a tier and a human checkpoint.',
  'Assistive tier: the AI only suggests; a human must explicitly accept, edit, or reject the suggestion before anything is saved.',
  'Augmented tier: the AI plays a larger role in producing content or a recommendation, but still inside a defined, governed human checkpoint.',
  'Autonomous tier is explicitly out of scope in journi — no AI use case is allowed to act without a human checkpoint.',
], { note: "Emphasize this distinction early: it recurs in every later module. A quick memory hook — 'Assistive suggests, Augmented drafts, Autonomous decides — and journi never ships the third one.'" });

quizSlide({ id: 'QZ-F1-2', topic: 'RACSI role codes + AI tier definitions' }, 'Day 1 · PM');
workshopSlide({
  id: 'WS-F1-2', name: 'Read the Process Backbone', duration: 90,
  goals: ['Build an OBS roster and trace it into other modules', 'Correctly classify AI use cases by tier and checkpoint'],
  materials: 'Same demo tenant as the morning workshop, now populated from WS-F1-1; a printed or projected AI Use Case Library excerpt (3 entries) for the classification exercise.',
  agenda: [
    'Build a 4-role OBS roster with a reporting chain for the scenario project.',
    'Trace one End-to-End process chain through its ordered Macro Processes.',
    'Review 3 AI Use Case Library entries and classify tier + human checkpoint for each.',
    'Identify which module each of the 3 use cases plugs into.',
  ],
  debrief: 'Poll the room on the 3 AI use case classifications before revealing the answers — disagreement here is the most useful teaching moment of the day.',
}, 'Day 1 · PM');

// =====================================================================
// DAY 2 · AM
// =====================================================================
dividerSlide('Day 2 · AM', 'Reading the Program Layer', '105 min content · 15 min quiz (QZ-F1-3) · 90 min workshop (WS-F1-3)');

contentSlide('Day 2 · AM · Session 1', 'Initiative Registry & CM Charters', 60, [
  'The Initiative Registry records program-level metadata for every Change Management program: its Lewin macro-state, the justified-change pattern, and the Composite Readiness Index.',
  'The CM Charter Registry holds 8 charters, each mapped to specific charter-actions with a compliance log.',
  'At Foundation level, the goal is to read an existing charter fluently — not yet author or edit one; charter authorship is a Practitioner-level skill (TRN-P1).',
], { note: "Stress the phrase 'justified-change pattern' — every macro-state change in journi requires a written justification, which is a governance habit worth calling out explicitly here." });

contentSlide('Day 2 · AM · Session 2', 'WBS, Gantt & Phase Gates at a Glance', 45, [
  'A Work Breakdown Structure (WBS) spans three tracks: PM, CM, and Framework — so the project plan, the change plan, and the framework milestones stay visible together.',
  'The Gantt view compares baseline (planned) dates against actual dates; a mismatch surfaces as a schedule gap.',
  'A Phase Gate is a governed checkpoint: a Joint Decision Record captures whether the program proceeds, holds, or escalates.',
  "The Accountable role on a Phase Gate decision must be independent of either input's author — this is what makes the decision defensible later.",
], { note: 'Use a real Gantt view with one deliberately late task to demonstrate a schedule gap live, then walk straight into the linked Phase Gate to show the two are connected.' });

quizSlide({ id: 'QZ-F1-3', topic: 'Program layer terms' }, 'Day 2 · AM');
workshopSlide({
  id: 'WS-F1-3', name: "Read a Program's Status", duration: 90,
  goals: ['Read an Initiative Registry entry and its linked CM Charter', 'Interpret a WBS Gantt view and the current Phase Gate state'],
  materials: 'The seeded program record from Day 1 (or a facilitator-provided backup record); no new setup required.',
  agenda: [
    'Open a seeded Initiative Registry entry and its CM Charter; identify the Lewin macro-state and the top charter action.',
    'Open the linked WBS/Gantt view and identify 2 tasks with a schedule gap.',
    'Identify the current Phase Gate status and who owns the next decision.',
    "Summarize the program's health in 3 bullet points, as if briefing a manager who has 60 seconds.",
  ],
  debrief: "Have 2 participants read their 3-bullet summaries aloud — compare how differently the same data can be framed, and agree on what 'good' looks like.",
}, 'Day 2 · AM');

// =====================================================================
// DAY 2 · PM
// =====================================================================
dividerSlide('Day 2 · PM', 'Metrics, Dashboards & the Field Notebook', '90 min content · 15 min quiz (QZ-F1-4) · 90 min workshop (WS-F1-4)');

contentSlide('Day 2 · PM · Session 1', 'Metrics & Analytics Dashboard', 45, [
  "The dashboard's ADKAR heatmap visualizes readiness across the 5 ADKAR blocks for a cohort or project — colour intensity flags where the barrier sits.",
  'The adoption curve tracks the trend of usage/adoption over time, not a single point-in-time number.',
  'At Foundation level, the dashboard is reference-only: read it to inform a conversation, do not edit the underlying data here.',
], { note: 'Pull up a project whose ADKAR heatmap has a clearly weak block and ask participants to name it before you point it out — this builds the reading habit faster than lecturing it.' });

contentSlide('Day 2 · PM · Session 2', 'Field Notes', 45, [
  "Field Notes are a lightweight practitioner scratchpad — for an observation that doesn't yet belong in a structured module.",
  'They are not a substitute for a structured record: a Risk Register entry, a charter compliance log, or a Phase Gate decision all carry scoring, ownership and workflow that a Field Note lacks.',
  'Field Notes are available in the same EN/FR/AR multilingual UI as the rest of journi.',
], { note: "Give a concrete contrast: 'I noticed the sponsor seemed disengaged in today's meeting' is a Field Note. 'Sponsor visibility risk, likelihood 3/5, impact 4/5, owner: PMO' is a Risk Register entry. Same observation, different destination." });

quizSlide({ id: 'QZ-F1-4', topic: 'Dashboard reading + Field Notes scope' }, 'Day 2 · PM');
workshopSlide({
  id: 'WS-F1-4', name: 'Read a Dashboard, Log a Field Note', duration: 90,
  goals: ["Read a project's Metrics & Analytics Dashboard without editing it", 'Add a properly-scoped Field Note'],
  materials: 'The seeded project used throughout the training; no additional setup.',
  agenda: [
    "Open the Metrics & Analytics Dashboard for the seeded project and identify the ADKAR heatmap's weakest block.",
    "Identify the adoption curve's current trend.",
    'Add a Field Note capturing an observation from the review (not a structured record).',
    'Explain, in writing, why that observation belongs in Field Notes and not the Risk Register.',
  ],
  debrief: 'Close the day by asking each participant to name the one journi screen they feel least confident navigating — capture it for a 10-minute recap at the start of TRN-F2.',
}, 'Day 2 · PM');

// =====================================================================
// ASSESSMENT
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 0.6, d: 0.85, bg: ORANGE, icon: 'clipboard-check', pad: 0.19 });
  s.addText('TRAINING EXAM', { x: 1.85, y: 0.68, w: 9, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true });
  s.addText('EXM-F1', { x: 1.85, y: 1.05, w: 9, h: 0.75, fontFace: FONT, fontSize: 36, bold: true, color: WHITE, isTextBox: true });

  card(s, 0.6, 2.15, 12.15, 1.3, { fill: '1D4F45', shadow: false });
  const specs = [['40', 'MCQ'], ['2', 'SHORT-ANSWER'], ['75', 'MINUTES'], ['75%', 'PASS MARK']];
  let x = 0.9;
  for (const [n, l] of specs) {
    s.addText(n, { x, y: 2.35, w: 2.6, h: 0.55, fontFace: FONT, fontSize: 26, bold: true, color: ORANGE, isTextBox: true });
    s.addText(l, { x, y: 2.92, w: 2.6, h: 0.35, fontFace: FONT, fontSize: 10, bold: true, color: 'B8D4CE', charSpacing: 1, isTextBox: true });
    x += 2.95;
  }

  s.addText('SCOPE', { x: 0.6, y: 3.75, w: 11.9, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true });
  bulletList(s, [
    'Drawn from all 4 half-day quizzes: framework definitions, RACSI + AI tiers, program-layer terms, dashboard reading + Field Notes scope.',
    'The 2 short-answer questions ask participants to justify a governance decision in writing (e.g. why a Phase Gate needs an independent Accountable role).',
    'One free retake is available after a 48-hour review period.',
    'Passing EXM-F1 is one of three training exams required before the Foundation Level Exam (EXM-LVL-F).',
  ], { x: 0.6, y: 4.08, w: 11.9, h: 2.3, size: 13, color: 'E3F0EC' });
  footer(s, true);
}

// =====================================================================
// CLOSING
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 2.35, d: 0.85, bg: ORANGE, icon: 'flag-checkered', pad: 0.19 });
  s.addText('Next: TRN-F2', { x: 0.7, y: 3.35, w: 11, h: 0.9, fontFace: FONT, fontSize: 32, bold: true, color: WHITE, isTextBox: true });
  s.addText('Individual & Emotional Readiness — ADKAR and the Human Journey', { x: 0.75, y: 4.15, w: 11, h: 0.55, fontFace: FONT, fontSize: 17, italic: true, color: 'B8D4CE', isTextBox: true });
  s.addText('journi Academy — Foundation Level  ·  POWERACT Consulting  ·  Confidential', { x: 0.75, y: 6.75, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A', isTextBox: true });
}

pptx.writeFile({ fileName: path.join(__dirname, 'TRN-F1_Training_Slides.pptx') }).then(async () => {
  console.log('wrote TRN-F1_Training_Slides.pptx');
  await require('./fix-pptx.js').fixPptx(path.join(__dirname, 'TRN-F1_Training_Slides.pptx'));
});
