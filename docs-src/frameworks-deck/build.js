const path = require('path');
const {
  pptx, newSlide, footer, header, iconCircle, card, pillBadge, bullets, stageStrip, tableSlide, A,
  TEAL_DEEP, TEAL, TEAL_MID, MINT, MINT2, ORANGE, ORANGE_LIGHT, INK, MUTED, WHITE, RED, RED_LIGHT,
  BLUE, BLUE_LIGHT, PURPLE, PURPLE_LIGHT, FONT,
} = require('./deck.js');

// =====================================================================
// SLIDE 1 — TITLE
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 0.7, d: 0.85, bg: ORANGE, icon: 'compass', pad: 0.18 });
  s.addText('journi\'s Four Frameworks', { x: 0.7, y: 2.3, w: 11.5, h: 1.1, fontFace: FONT, fontSize: 46, bold: true, color: WHITE });
  s.addText('Lewin · Prosci ADKAR · Bridges\' Transition Model · Kübler-Ross Change Curve', { x: 0.75, y: 3.3, w: 11, h: 0.55, fontFace: FONT, fontSize: 19, italic: true, color: 'B8D4CE' });
  s.addText('How journi reads one population through four independent lenses at once — and combines them into a single, defensible readiness picture', { x: 0.75, y: 3.9, w: 10.5, h: 0.6, fontFace: FONT, fontSize: 14, color: '9FC2BC' });
  const stats = [['4', 'Frameworks'], ['15', 'Stages, Total'], ['3', 'journi Modules'], ['1', 'Composite Index']];
  let x = 0.75;
  for (const [n, l] of stats) {
    s.addText(n, { x, y: 4.85, w: 2.4, h: 0.75, fontFace: FONT, fontSize: 32, bold: true, color: ORANGE });
    s.addText(l.toUpperCase(), { x, y: 5.55, w: 2.4, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: '9FC2BC', charSpacing: 1 });
    x += 2.5;
  }
  s.addText('Manufacturing Sector · Bouregreg Group Scenario Library · Confidential', { x: 0.75, y: 6.85, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A' });
}

// =====================================================================
// SLIDE 2 — WHY FOUR FRAMEWORKS
// =====================================================================
{
  const s = newSlide();
  header(s, 'Why Four, Not One', 'One framework tells you one thing. journi needs four.', { size: 25,
    sub: 'Each framework answers a question the other three cannot — together they cover the organization, the individual\'s skill, the individual\'s emotional position, and the individual\'s sentiment.' });
  const rows = [
    ['organizational altitude', 'Lewin', 'Is the organization itself unfrozen, changing, or refrozen?', 'compass', TEAL],
    ['skill altitude', 'ADKAR', 'Does this specific cohort have the awareness, desire, knowledge, ability, and reinforcement to actually do the new thing?', 'book-open', ORANGE],
    ['emotional altitude', 'Bridges', 'Where is this cohort, psychologically, in letting go of the old way and starting the new one?', 'route', BLUE],
    ['sentiment altitude', 'Kübler-Ross', 'What does this cohort actually feel about the change, right now?', 'chart-line', PURPLE],
  ];
  let y = 2.35;
  for (const [altitude, name, q, icon, color] of rows) {
    card(s, 0.6, y, 12.1, 1.02, { fill: WHITE });
    iconCircle(s, { x: 0.85, y: y + 0.18, d: 0.66, bg: color, icon, pad: 0.15 });
    s.addText(name, { x: 1.8, y: y + 0.1, w: 2.6, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color });
    s.addText(altitude, { x: 1.8, y: y + 0.45, w: 2.6, h: 0.3, fontFace: FONT, fontSize: 9.5, color: MUTED, italic: true });
    s.addText(q, { x: 4.55, y, w: 7.9, h: 1.02, fontFace: FONT, fontSize: 12, color: INK, valign: 'middle', lineSpacingMultiple: 1.2 });
    y += 1.14;
  }
  footer(s);
}

// =====================================================================
// SLIDE 3 — AT A GLANCE
// =====================================================================
{
  const s = newSlide();
  header(s, 'At a Glance', 'The four frameworks, in journi\'s own stage vocabulary', { size: 26 });
  tableSlide(s,
    ['Framework', 'Altitude', 'Stages (in order)', 'Logged on'],
    [
      ['Lewin', 'Organizational — one reading per project', 'Unfreeze → Change → Refreeze', 'M3 (Initiative Registry)'],
      ['Prosci ADKAR', 'Individual / cohort — five independently-scored blocks', 'Awareness → Desire → Knowledge → Ability → Reinforcement', 'M5 (ADKAR Engine)'],
      ['Bridges\' Transition Model', 'Individual / cohort — emotional position', 'Ending → Neutral Zone → New Beginning', 'M6 (Emotional & Transition Layer)'],
      ['Kübler-Ross Change Curve', 'Individual / cohort — sentiment', 'Denial → Resistance/Anger → Exploration → Commitment', 'M6 (Emotional & Transition Layer)'],
    ],
    { colW: [2.6, 3.3, 4.0, 2.2], y: 2.3, fontSize: 11.5 });
  s.addText('Lewin is the only one of the four scored once per project. ADKAR, Bridges, and Kübler-Ross are all scored per cohort, so a single project can carry several distinct readings at once — one per stakeholder group.',
    { x: 0.6, y: 5.9, w: 12.1, h: 0.6, fontFace: FONT, fontSize: 12.5, italic: true, color: MUTED, lineSpacingMultiple: 1.2 });
  footer(s);
}

// =====================================================================
// SLIDE 4 — HOW THEY COMBINE
// =====================================================================
{
  const s = newSlide();
  header(s, 'How They Combine', 'Four independent readings, one traceable record', { size: 25,
    sub: 'journi never asks a Change Manager to reconcile the four frameworks by hand — every one of them writes to a specific module, and journi\'s own computed metrics (Section 36) do the reconciliation live.' });
  const items = [
    'A cohort\'s Lewin phase (M3) sets the organizational backdrop every other reading is interpreted against.',
    'ADKAR (M5) and the emotional layer (M6) are cross-referenced automatically — the Divergence Pattern Detector watches exactly this intersection (Slide 35).',
    'The Composite Readiness Index (M14) blends ADKAR and Kübler-Ross with training completion into one number the Steering Committee reviews at every phase gate.',
    'No framework is optional: every one of journi\'s 8 registered transformation-archetype lifecycles logs all four, just weighted differently by archetype (Slide 38).',
  ];
  bullets(s, 0.6, 2.5, 12.1, 3.5, items, { fontSize: 14, lineSpacingMultiple: 1.35 });
  footer(s);
}

// =====================================================================
// SECTION DIVIDER helper
// =====================================================================
function sectionDivider({ kicker, title, tagline, color, icon, stages }) {
  const s = newSlide(color);
  s.addText(kicker.toUpperCase(), { x: 0.6, y: 0.5, w: 10, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: ORANGE, charSpacing: 2 });
  iconCircle(s, { x: 0.6, y: 0.95, d: 0.95, bg: ORANGE, icon, pad: 0.2 });
  s.addText(title, { x: 1.85, y: 0.95, w: 10, h: 0.95, fontFace: FONT, fontSize: 36, bold: true, color: WHITE, valign: 'middle' });
  s.addText(tagline, { x: 1.85, y: 1.8, w: 10, h: 0.5, fontFace: FONT, fontSize: 15, italic: true, color: 'E3F0EC' });
  stageStrip(s, 0.6, 4.6, 12.1, 0.85, stages, { fontSize: 13 });
  footer(s, true);
  return s;
}

function stageDetailSlide({ kicker, title, color, icon, whatItMeans, inJourni, worksAgainst, example }) {
  const s = newSlide();
  header(s, kicker, title, { size: 27, titleColor: color });
  iconCircle(s, { x: 11.7, y: 0.55, d: 0.75, bg: color, icon, pad: 0.17 });
  s.addText('WHAT IT MEANS', { x: 0.6, y: 2.15, w: 5.8, h: 0.3, fontFace: FONT, fontSize: 11.5, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(whatItMeans, { x: 0.6, y: 2.5, w: 5.8, h: 1.9, fontFace: FONT, fontSize: 13, color: INK, lineSpacingMultiple: 1.25 });
  card(s, 0.6, 4.55, 5.8, 2.15, { fill: MINT, shadow: false });
  s.addText('WORKED EXAMPLE', { x: 0.85, y: 4.72, w: 5.3, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: TEAL_DEEP, charSpacing: 1 });
  s.addText(example, { x: 0.85, y: 5.05, w: 5.3, h: 1.55, fontFace: FONT, fontSize: 11.5, color: INK, lineSpacingMultiple: 1.2 });

  s.addText('IN JOURNI', { x: 6.7, y: 2.15, w: 6.0, h: 0.3, fontFace: FONT, fontSize: 11.5, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(inJourni, { x: 6.7, y: 2.5, w: 6.0, h: 1.9, fontFace: FONT, fontSize: 13, color: INK, lineSpacingMultiple: 1.25 });
  card(s, 6.7, 4.55, 6.0, 2.15, { fill: ORANGE_LIGHT, shadow: false });
  s.addText('WHAT IT WORKS AGAINST', { x: 6.95, y: 4.72, w: 5.5, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(worksAgainst, { x: 6.95, y: 5.05, w: 5.5, h: 1.55, fontFace: FONT, fontSize: 11.5, color: INK, lineSpacingMultiple: 1.2 });
  footer(s);
}

function moduleSlide({ kicker, title, purpose, keyFields, whoCanEdit, screenNote }) {
  const s = newSlide();
  header(s, kicker, title, { size: 25 });
  card(s, 0.6, 2.15, 12.1, 1.0, { fill: MINT, shadow: false });
  s.addText('PURPOSE', { x: 0.85, y: 2.28, w: 2.0, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(purpose, { x: 0.85, y: 2.6, w: 11.6, h: 0.5, fontFace: FONT, fontSize: 12.5, color: INK, lineSpacingMultiple: 1.2 });
  s.addText('KEY FIELDS', { x: 0.6, y: 3.35, w: 5.8, h: 0.3, fontFace: FONT, fontSize: 11.5, bold: true, color: ORANGE, charSpacing: 1 });
  bullets(s, 0.6, 3.7, 5.8, 2.6, keyFields, { fontSize: 12, lineSpacingMultiple: 1.3 });
  s.addText('WHO CAN EDIT', { x: 6.7, y: 3.35, w: 6.0, h: 0.3, fontFace: FONT, fontSize: 11.5, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(whoCanEdit, { x: 6.7, y: 3.7, w: 6.0, h: 1.3, fontFace: FONT, fontSize: 12.5, color: INK, lineSpacingMultiple: 1.25 });
  card(s, 6.7, 5.15, 6.0, 1.55, { fill: ORANGE_LIGHT, shadow: false });
  s.addText('IN THE BOUREGREG SCENARIO', { x: 6.95, y: 5.3, w: 5.5, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(screenNote, { x: 6.95, y: 5.6, w: 5.5, h: 1.0, fontFace: FONT, fontSize: 10.8, color: INK, lineSpacingMultiple: 1.15 });
  footer(s);
}

function pitfallSlide({ kicker, title, color, pitfall, why, fix }) {
  const s = newSlide(color);
  s.addText(kicker.toUpperCase(), { x: 0.6, y: 0.5, w: 10, h: 0.35, fontFace: FONT, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2 });
  iconCircle(s, { x: 0.6, y: 0.9, d: 0.75, bg: ORANGE, icon: 'circle-question', pad: 0.16 });
  s.addText(title, { x: 1.55, y: 0.9, w: 10.5, h: 0.9, fontFace: FONT, fontSize: 26, bold: true, color: WHITE, valign: 'middle' });
  card(s, 0.6, 2.05, 12.1, 1.15, { fill: WHITE, shadow: false });
  s.addText('THE PITFALL', { x: 0.85, y: 2.2, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: RED, charSpacing: 1 });
  s.addText(pitfall, { x: 0.85, y: 2.5, w: 11.6, h: 0.6, fontFace: FONT, fontSize: 12.5, color: INK, lineSpacingMultiple: 1.2 });
  card(s, 0.6, 3.35, 12.1, 1.35, { fill: WHITE, shadow: false });
  s.addText('WHY IT HAPPENS', { x: 0.85, y: 3.5, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(why, { x: 0.85, y: 3.8, w: 11.6, h: 0.85, fontFace: FONT, fontSize: 12, color: INK, lineSpacingMultiple: 1.2 });
  card(s, 0.6, 4.85, 12.1, 1.6, { fill: WHITE, shadow: false });
  s.addText('JOURNI\'S ANSWER', { x: 0.85, y: 5.0, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: TEAL, charSpacing: 1 });
  s.addText(fix, { x: 0.85, y: 5.3, w: 11.6, h: 1.05, fontFace: FONT, fontSize: 12, color: INK, lineSpacingMultiple: 1.2 });
  footer(s, true);
}

// =====================================================================
// LEWIN SECTION
// =====================================================================
sectionDivider({
  kicker: 'Framework 1 of 4', title: 'Lewin\'s Change Model', color: TEAL_DEEP, icon: 'compass',
  tagline: 'The organizational altitude — one reading per project, scored on M3 (Initiative Registry).',
  stages: [{ label: 'Unfreeze', color: TEAL }, { label: 'Change', color: TEAL_MID }, { label: 'Refreeze', color: ORANGE }],
});

stageDetailSlide({
  kicker: 'Lewin · Stage 1 of 3', title: 'Unfreeze', color: TEAL, icon: 'snowflake',
  whatItMeans: 'The organization acknowledges the current way of working can no longer hold — the business driver is named, the case for change is made, and the project is registered. Nothing has changed yet; the point is breaking the status quo\'s grip.',
  inJourni: 'A CM Project\'s Lewin macro-state opens at Unfreeze the moment it is created on M1 and saved to M3. Under Bouregreg Group\'s Governance Setting, opening Unfreeze requires a written justification note, logged to the project\'s audit trail — not a silent default.',
  worksAgainst: 'Denial (Kübler-Ross) and low Awareness (ADKAR) are exactly what Unfreeze is meant to break — this is why Unfreeze rarely opens alone; it is usually accompanied by a first communication wave logged on M8.',
  example: 'Bouregreg ERP Adoption Program opens Unfreeze in Week 1, justification: "Board-approved business case; three-site manual reconciliation cost is the driver." The Kenitra Automation program opens the same week its narrow, low-resistance scope is confirmed.',
});
stageDetailSlide({
  kicker: 'Lewin · Stage 2 of 3', title: 'Change', color: TEAL_MID, icon: 'shuffle',
  whatItMeans: 'The actual transition is underway — new processes, systems, structures, or values are being built, piloted, and rolled out. This is the longest of Lewin\'s three stages in every one of journi\'s 8 archetype lifecycles.',
  inJourni: 'Every Build, Pilot, Rollout, or Implementation phase across journi\'s 7- and 8-phase templates runs under a Lewin state of Change. A phase-gate closing at M17 does not itself move Lewin — Lewin is a deliberate, justified update on M3.',
  worksAgainst: 'This is where ADKAR\'s Knowledge and Ability blocks are built directly, and where Bridges\' Neutral Zone and Kübler-Ross\'s Resistance/Anger and Exploration stages are most active — Change is the stage every other framework does its heaviest lifting in.',
  example: 'The Loi 09-08 Compliance Program\'s Lewin state stays at Change from Week 1 through Week 63 — every one of its seven TPL-COMP-7 phases (regulatory analysis through first monitoring cycle) runs inside this one long Change state.',
});
stageDetailSlide({
  kicker: 'Lewin · Stage 3 of 3', title: 'Refreeze', color: ORANGE, icon: 'anchor',
  whatItMeans: 'The new way of working is locked in as the new normal — not just delivered, but confirmed to hold without active management. This is the stage journi is strictest about: closing it early is the single most common Lewin misuse this guide series warns against.',
  inJourni: 'Refreeze closes only once real evidence — a sustainment checkpoint, a clean monitoring cycle, a certification audit — supports it, never against a calendar date alone. Under Governance Setting, the justification note is mandatory and auditable.',
  worksAgainst: 'A population can look "done" — attendance complete, competency verified — while Reinforcement (ADKAR) is still the weakest block. Refreeze closing before Reinforcement is real is exactly how the Operating Model guide\'s Exception E1 regression happens.',
  example: 'The Training & Skills program closes Refreeze only in Week 43, after two consecutive sustainment checkpoints confirm the skill holds without active coaching — not at Week 29 when full deployment finished, and not at Week 31 when competency was verified.',
});
moduleSlide({
  kicker: 'Lewin in journi', title: 'M3 — Initiative Registry',
  purpose: 'The system of record for every change initiative — business driver, scope, target population, and Lewin macro-state, one reading per project.',
  keyFields: ['Business driver', 'Scope', 'Target population', 'Lewin macro-state (Unfreeze / Change / Refreeze)'],
  whoCanEdit: 'General write access. A Lewin phase change is a scored/state change, so under Bouregreg Group\'s Governance Setting it requires a written justification, logged to the project\'s audit trail — the same discipline applied to every ADKAR and emotional-layer score change.',
  screenNote: 'The Bouregreg ERP Adoption Program\'s project detail page: Lewin opened at Unfreeze in Part 1, and every later Part of the Master User Guide watches this one field move through Change and toward Refreeze.',
});
{
  const s = newSlide();
  header(s, 'Lewin Across the Portfolio', 'What actually closes Refreeze differs by archetype', { size: 24,
    sub: 'Lewin\'s three stages are the same everywhere — but the evidence that justifies moving to Refreeze is archetype-specific, not generic.' });
  tableSlide(s,
    ['Archetype', 'What Closes Refreeze'],
    [
      ['ERP', 'Hypercare exits clean and the Sustain phase\'s own checkpoint confirms adoption holds.'],
      ['BPR', 'Sustainment handoff after rollout, once the resistance record shows no open entries.'],
      ['Automation', 'CoE handover, once exception tuning is complete and the bot runs without manual override.'],
      ['QMS', 'Never closes in this program\'s life — certification surveillance runs ongoing, by design.'],
      ['Cultural', 'Institutionalization, only once the CRI trend — not the calendar — supports it.'],
      ['Operating Model', 'A clean 30-day sustainment checkpoint, after any earlier regression is resolved.'],
      ['Compliance', 'The first monitoring cycle confirms controls hold under real operating conditions.'],
      ['Training & Skills', 'Two consecutive sustainment checkpoints confirm the skill holds without coaching.'],
    ],
    { colW: [3.0, 9.1], y: 2.45, fontSize: 11 });
  footer(s);
}
pitfallSlide({
  kicker: 'Common Pitfall', title: 'Closing Refreeze Too Early', color: RED,
  pitfall: 'A Change Manager closes Lewin at Refreeze because the project\'s calendar milestone says the program is "done" — go-live happened, training attendance hit 100%, the rollout finished — without checking whether the underlying ADKAR and emotional-layer readings actually support it.',
  why: 'Refreeze is the stage with the fewest built-in checks: unlike a Phase Gate on M17, nothing in journi blocks a Lewin update on M3 from being saved. The discipline has to come from the Change Manager\'s own justification-note habit, not from a system lock.',
  fix: 'journi requires a written justification on every Lewin change under Governance Setting — a permanent, auditable trail. The Composite Readiness Index (Slide 36) and a real sustainment checkpoint on M12 are the two pieces of evidence this guide series treats as the minimum bar before Refreeze, not the calendar.',
});

// =====================================================================
// ADKAR SECTION
// =====================================================================
sectionDivider({
  kicker: 'Framework 2 of 4', title: 'Prosci ADKAR', color: TEAL_DEEP, icon: 'book-open',
  tagline: 'The individual/cohort altitude — five independently-scored blocks, 1-5 each, on M5 (ADKAR Engine).',
  stages: [{ label: 'Awareness', color: TEAL }, { label: 'Desire', color: TEAL_MID }, { label: 'Knowledge', color: ORANGE }, { label: 'Ability', color: BLUE }, { label: 'Reinforcement', color: PURPLE }],
});
stageDetailSlide({
  kicker: 'ADKAR · Block 1 of 5', title: 'Awareness', color: TEAL, icon: 'lightbulb',
  whatItMeans: 'Does this cohort understand why the change is happening at all? Awareness is the floor every other block builds on — a cohort cannot develop real Desire, Knowledge, or Ability for a change it does not yet understand the reason for.',
  inJourni: 'Scored 1-5 on M5, per cohort. A score of 2 or below requires a mandatory barrier-reason note and auto-escalates — journi will not let a low Awareness score pass silently into the Composite Readiness Index.',
  worksAgainst: 'Directly opposes Kübler-Ross\'s Denial stage — a communications wave logged on M8 is usually the direct lever a Change Manager pulls to move Awareness, which is also the fastest of the five blocks to shift.',
  example: 'The Compliance program\'s Awareness reads 2 at baseline (Week 3) — HR, Sales, and Customer Service staff know a data-protection law exists but not what it requires of them specifically. By Week 14, following the regulatory requirement mapping, it reads 4.',
});
stageDetailSlide({
  kicker: 'ADKAR · Block 2 of 5', title: 'Desire', color: TEAL_MID, icon: 'heart',
  whatItMeans: 'Does this cohort actually want to make the change personally, not just understand it intellectually? Desire is the block most exposed to "what\'s in it for me" — and the one most likely to stall on a specific, named fear.',
  inJourni: 'Scored 1-5 on M5. Because a Desire stall is almost always tied to a specific, nameable fear, its barrier-reason note (mandatory below 2) is the field this guide series\' exception write-ups quote most often verbatim.',
  worksAgainst: 'The archetype most dependent on Desire is Cultural — the Tangier integration case\'s Exception E2 (Desire Stall) is a direct, named fear ("recurring fear about job security post-integration") logged straight from this field.',
  example: 'One Bouregreg\'s Tangier Dispatch cohort logs a Desire score of 2 in Week 25, with the barrier note: "Recurring fear about job security post-integration, first surfaced in Week 7 diagnosis, unresolved" — triggering the program\'s own Exception E2.',
});
stageDetailSlide({
  kicker: 'ADKAR · Block 3 of 5', title: 'Knowledge', color: ORANGE, icon: 'graduation-cap',
  whatItMeans: 'Does this cohort know *how* to do the new thing — the specific steps, not just that a change is coming? Knowledge is what training (M9) is built to produce, and it is the first of the five blocks a curriculum can move directly.',
  inJourni: 'Scored 1-5 on M5, and cross-referenced automatically with M6\'s Bridges reading — Knowledge climbing while Bridges still reads "Ending" is exactly the combination ALT-001 (Divergence Pattern Detected) is built to catch.',
  worksAgainst: 'Training completion logged on M9 is the direct evidence a Change Manager cites when raising a Knowledge score — this is the block with the tightest, most auditable link to a specific journi module outside M5 itself.',
  example: 'The Training & Skills program\'s Knowledge score climbs sharply during Training Delivery (Weeks 15-29), moving from 1 at baseline to 4 by the time full two-plant deployment closes — the direct, intended effect of the curriculum.',
});
stageDetailSlide({
  kicker: 'ADKAR · Block 4 of 5', title: 'Ability', color: BLUE, icon: 'hand-fist',
  whatItMeans: 'Can this cohort actually perform the new behavior under real conditions — not just describe it? Ability is Knowledge tested against reality, and the gap between the two is exactly what a pilot cohort or shadow-mode period is designed to surface.',
  inJourni: 'Scored 1-5 on M5. Ability is the second input, alongside Knowledge, that ALT-001\'s Divergence Pattern Detector watches — both at 4 or above while Bridges reads "Ending" signals a cohort that has learned but not yet emotionally moved.',
  worksAgainst: 'This is the block a Practical Application phase (as in the Training & Skills archetype) or a UAT/shadow-mode period (Automation) is purpose-built to raise — competency verification exists specifically to confirm Ability, not just attendance.',
  example: 'The Automation program\'s Kenitra AP cohort reaches Ability 4 by Week 32, confirmed through two weeks of shadow-mode running the bot alongside the manual process — not assumed from training completion alone.',
});
stageDetailSlide({
  kicker: 'ADKAR · Block 5 of 5', title: 'Reinforcement', color: PURPLE, icon: 'shield-halved',
  whatItMeans: 'Does the new behavior hold once active support stops? Reinforcement is the slowest-moving, most decay-prone block — and the one this guide series treats as the true test of whether a program actually finished, not just delivered.',
  inJourni: 'Scored 1-5 on M5, and the direct input alongside a clean M12 sustainment checkpoint that justifies closing Lewin at Refreeze. A program can score 4-5 on every other block and still fail here.',
  worksAgainst: 'This is the block the Operating Model guide\'s Exception E1 shows failing in real time — a function head reverts to old decision-making under operational pressure precisely because Reinforcement, not Knowledge or Ability, was never engineered.',
  example: 'The Training & Skills program engineers Reinforcement deliberately through two dedicated phases — Practical Application and On-the-Job Coaching — rather than leaving it to chance, the only archetype in the series to do so explicitly.',
});
moduleSlide({
  kicker: 'ADKAR in journi', title: 'M5 — ADKAR Engine',
  purpose: 'Score cohorts across the five ADKAR blocks — Awareness, Desire, Knowledge, Ability, Reinforcement — with mandatory barrier-point diagnosis on any low score.',
  keyFields: ['Five block scores, 1-5 each: Awareness, Desire, Knowledge, Ability, Reinforcement', 'A barrier-reason note, mandatory on any score of 2 or below'],
  whoCanEdit: 'General write access, with a mandatory justification on every score change under Bouregreg Group\'s Governance Setting — the same auditable discipline Lewin and the emotional layer both apply.',
  screenNote: 'Driss El Amrani logs the Bouregreg ERP program\'s baseline ADKAR pulse here in Week 1, then re-scores each block through the program\'s Build, Test, and Train phases as training and go-live proceed.',
});
{
  const s = newSlide();
  header(s, 'Reading an ADKAR Pulse', 'A worked example: three sites, one blended number', { size: 24,
    sub: 'The Bouregreg ERP program\'s Composite Readiness Index reads a misleading blend until it is disaggregated by site — the exact failure mode Exception E6 (Cohort Divergence Across Sites) is built to catch.' });
  tableSlide(s,
    ['Site', 'Knowledge', 'Ability', 'Bridges Reading', 'What It Signals'],
    [
      ['Casablanca', '4', '4', 'New Beginning', 'Genuinely ready — proximity to the program team helped.'],
      ['Kenitra', '3', '3', 'Neutral Zone', 'On track, following recovery from an earlier E4 regression.'],
      ['Settat', '2', '2', 'Ending', 'Behind, following the E1 Desire stall — needs a second training wave.'],
    ],
    { colW: [2.0, 1.8, 1.8, 2.7, 3.8], y: 2.55, fontSize: 11.5 });
  s.addText('One blended M14 reading (78% / 68% / 54% disaggregated) would have hidden Settat\'s real gap entirely — the reason this guide series treats per-cohort ADKAR scoring, not a single project-level average, as the non-negotiable unit of analysis.',
    { x: 0.6, y: 5.1, w: 12.1, h: 0.7, fontFace: FONT, fontSize: 12, italic: true, color: MUTED, lineSpacingMultiple: 1.2 });
  footer(s);
}
pitfallSlide({
  kicker: 'Common Pitfall', title: 'Averaging Away a Cohort\'s Real Gap', color: RED,
  pitfall: 'A Change Manager reports one project-level ADKAR average to the Steering Committee, blending a strong site or department with a struggling one — the strong number masks the struggling one instead of surfacing it.',
  why: 'M14\'s Composite Readiness Index is computed at the project level by default, and a single clean-looking number is easier to report than three uneven ones — the path of least resistance in a status meeting is exactly the path that hides the real risk.',
  fix: 'M4\'s Stakeholder Mapping carries site/department tags precisely so a Change Manager can disaggregate M14\'s blended number by cohort at any time — the Bouregreg ERP program\'s own Exception E6 shows this disaggregation step performed explicitly, not left implicit.',
});

// =====================================================================
// BRIDGES SECTION
// =====================================================================
sectionDivider({
  kicker: 'Framework 3 of 4', title: 'Bridges\' Transition Model', color: TEAL_DEEP, icon: 'route',
  tagline: 'The emotional altitude — where a cohort stands, psychologically, in letting go and starting over. Logged on M6.',
  stages: [{ label: 'Ending', color: RED }, { label: 'Neutral Zone', color: ORANGE }, { label: 'New Beginning', color: TEAL }],
});
stageDetailSlide({
  kicker: 'Bridges · Stage 1 of 3', title: 'Ending', color: RED, icon: 'door-closed',
  whatItMeans: 'The cohort has not yet let go of the old way of working, psychologically — even if they can already describe the new one. Ending is about loss, not information, and it is the stage most often mistaken for simple resistance.',
  inJourni: 'Scored on M6, alongside a justification note. Ending is the specific Bridges reading ALT-001\'s Divergence Pattern Detector watches for, paired against high Knowledge and Ability on M5 — the combination that signals a cohort trained but not yet emotionally moved.',
  worksAgainst: 'A cohort can score 4-5 on Knowledge and Ability while still reading Ending on Bridges — this is not a contradiction in the data, it is the exact real-world pattern of someone who has learned a skill but not yet accepted why the old one had to go.',
  example: 'The Bouregreg ERP program\'s Casablanca finance cohort reads Ending through most of Build, even as their Knowledge score climbs to 4 — ALT-001 fires at Week 28, correctly flagging the gap before it reaches go-live.',
});
stageDetailSlide({
  kicker: 'Bridges · Stage 2 of 3', title: 'Neutral Zone', color: ORANGE, icon: 'cloud',
  whatItMeans: 'The old way is gone, the new way is not yet fully trusted or habitual — a genuinely uncomfortable, in-between state. Bridges treats this as necessary, not a problem to rush past; real transition happens here, not around it.',
  inJourni: 'Scored on M6. This is the longest-held Bridges reading across every one of journi\'s 8 archetype lifecycles — most cohorts spend more calendar time in Neutral Zone than in either Ending or New Beginning.',
  worksAgainst: 'Rushing a cohort out of Neutral Zone before Reinforcement (ADKAR) is real is a direct path to the Operating Model guide\'s Exception E1 — a premature "New Beginning" reading that reverts under the first real operational pressure.',
  example: 'The Operating Model program\'s Function Heads read Neutral Zone from Week 48 (detailed org design) through the pilot transition at Week 52 — deliberately not rushed to New Beginning until the pilot site\'s own evidence supports it.',
});
stageDetailSlide({
  kicker: 'Bridges · Stage 3 of 3', title: 'New Beginning', color: TEAL, icon: 'sun',
  whatItMeans: 'The cohort has genuinely adopted the new identity, not just the new process — they describe themselves, unprompted, in terms of the new way of working. This is the emotional counterpart to Lewin\'s Refreeze.',
  inJourni: 'Scored on M6. Like Refreeze, journi treats a New Beginning reading claimed without supporting evidence as a real risk — this guide series consistently pairs it with a sustainment checkpoint on M12, not the reading alone.',
  worksAgainst: 'A New Beginning reading that later reverts to Neutral Zone or Ending is exactly what a regression checkpoint (M12) is built to catch — the Operating Model program\'s Exception E1 shows precisely this reversal, caught and logged rather than hidden.',
  example: 'The QMS program\'s Settat quality function reaches New Beginning only after the certifying audit passes clean in Week 46 — not at mock-up audit (Week 38), when the reading was still provisionally Neutral Zone pending real external validation.',
});
moduleSlide({
  kicker: 'Bridges in journi', title: 'M6 — Emotional & Transition Layer (Bridges half)',
  purpose: 'Bridges transition position, cross-referenced automatically with ADKAR — the module where journi\'s Divergence Pattern alert gets its second input.',
  keyFields: ['Bridges stage: Ending / Neutral Zone / New Beginning', 'A justification note on every stage change'],
  whoCanEdit: 'General write access; individual-level detail restricted the same way as M4 and M5 — visible only to Super Admin, Group Admin, Org Admin, Change Manager, and People Manager roles.',
  screenNote: 'This is where the Bouregreg ERP program\'s Divergence Pattern alert actually gets its second input — if Knowledge and Ability read high on M5 while Bridges is still logged Ending here, the two modules together are what ALT-001 is watching.',
});
pitfallSlide({
  kicker: 'Common Pitfall', title: 'Rushing Past the Neutral Zone', color: RED,
  pitfall: 'A Change Manager marks a cohort "New Beginning" the moment go-live happens or training completes — treating Bridges as a calendar milestone rather than a genuine emotional state that has to actually be reached.',
  why: 'Neutral Zone is uncomfortable to sit in, for the cohort and for whoever is reporting status upward — a Steering Committee wants to hear "we\'ve arrived," and New Beginning sounds better in a status readout than an honest Neutral Zone reading.',
  fix: 'journi requires a justification note on every Bridges change, the same auditable discipline as Lewin and ADKAR — and this guide series consistently pairs a New Beginning claim with a real M12 sustainment checkpoint, never the reading in isolation.',
});

// =====================================================================
// KÜBLER-ROSS SECTION
// =====================================================================
sectionDivider({
  kicker: 'Framework 4 of 4', title: 'Kübler-Ross Change Curve', color: TEAL_DEEP, icon: 'chart-line',
  tagline: 'The sentiment altitude — a simplified four-stage model of how a cohort actually feels. Logged on M6, alongside Bridges.',
  stages: [{ label: 'Denial', color: MUTED }, { label: 'Resistance/Anger', color: RED }, { label: 'Exploration', color: ORANGE }, { label: 'Commitment', color: TEAL }],
});
stageDetailSlide({
  kicker: 'Kübler-Ross · Stage 1 of 4', title: 'Denial', color: MUTED, icon: 'face-frown',
  whatItMeans: 'The cohort does not believe the change is really happening, or that it applies to them specifically — a sentiment state, distinct from ADKAR\'s Awareness, which measures understanding rather than belief.',
  inJourni: 'Logged on M6 alongside Bridges. Denial is the sentiment counterpart to Lewin\'s Unfreeze stage — both describe the same early moment from a different altitude, organizational versus individual.',
  worksAgainst: 'A first communications wave (M8) is the direct lever for moving a cohort out of Denial, the same lever used against low Awareness — the two are related but not identical, which is exactly why journi tracks them as separate fields.',
  example: 'The Kenitra Automation program\'s AP staff never register Denial at all — a narrow, well-scoped project with an already-bought-in team starts past this stage, part of why the program closes without any alert firing.',
});
stageDetailSlide({
  kicker: 'Kübler-Ross · Stage 2 of 4', title: 'Resistance / Anger', color: RED, icon: 'triangle-exclamation',
  whatItMeans: 'The cohort actively pushes back — verbally, in behavior, or by working around the new way rather than adopting it. journi treats this as real, trackable data, not a discipline problem to suppress.',
  inJourni: 'This sentiment stage is the direct counterpart to the Resistance Log on M10 — three or more open entries there is what fires ALT-004 (Resistance Escalation Threshold Breached), the alert most directly tied to this Kübler-Ross stage.',
  worksAgainst: 'A BPR-type program is the archetype most built around this stage by design — the Order-to-Cash Process Redesign case is engineered so finance staff who privately own today\'s manual workarounds resist a redesign that makes those workarounds obsolete.',
  example: 'The BPR guide\'s Order-to-Cash program logs its third open resistance entry during the Weeks 20-24 pilot, firing ALT-004 — resolved through a co-designed accuracy safeguard the resisting staff themselves helped define.',
});
stageDetailSlide({
  kicker: 'Kübler-Ross · Stage 3 of 4', title: 'Exploration', color: ORANGE, icon: 'magnifying-glass',
  whatItMeans: 'The cohort starts testing the new way of working, tentatively — trying it out rather than fighting it, but not yet fully committed either. This is where genuine curiosity starts to outweigh resistance.',
  inJourni: 'Logged on M6. Exploration typically overlaps with Bridges\' Neutral Zone — the two frameworks describe the same in-between period from the emotional-position angle (Bridges) and the sentiment angle (Kübler-Ross) respectively.',
  worksAgainst: 'A pilot cohort, in any archetype, is specifically designed to happen during Exploration — the QMS program\'s mock-up audit, the Automation program\'s shadow-mode period, and the Training & Skills program\'s pilot delivery all land here by design.',
  example: 'The Training & Skills program\'s Kenitra pilot cohort moves into Exploration during Weeks 15-19, the same window their hands-on delivery runs — sentiment and skill development advancing together, not sequentially.',
});
stageDetailSlide({
  kicker: 'Kübler-Ross · Stage 4 of 4', title: 'Commitment', color: TEAL, icon: 'handshake',
  whatItMeans: 'The cohort genuinely embraces the new way of working and would choose it again — the sentiment counterpart to Bridges\' New Beginning and Lewin\'s Refreeze, completing the same emotional arc from a third angle.',
  inJourni: 'Logged on M6. Commitment is one of the two direct inputs (alongside training completion) to the Composite Readiness Index\'s Kübler-Ross-sentiment term — a real, weighted 25% of the number the Steering Committee reviews at every phase gate.',
  worksAgainst: 'A Commitment reading that has not been tested against real operating pressure is exactly the risk a sustainment checkpoint on M12 exists to catch — the same discipline applied to a premature New Beginning or Refreeze claim.',
  example: 'The Compliance program\'s HR, Sales, and Customer Service cohorts reach Commitment by the first monitoring cycle (Week 52) — verified not by self-report but by controls holding under real operating conditions for the first time.',
});
moduleSlide({
  kicker: 'Kübler-Ross in journi', title: 'M6 — Emotional & Transition Layer (Kübler-Ross half)',
  purpose: 'Kübler-Ross sentiment, cross-referenced with ADKAR and Bridges — a 25% weighted input to the Composite Readiness Index.',
  keyFields: ['Kübler-Ross sentiment: Denial / Resistance-Anger / Exploration / Commitment', 'A justification note on every sentiment change'],
  whoCanEdit: 'General write access; individual-level detail restricted the same way as M4 and M5 — visible only to Super Admin, Group Admin, Org Admin, Change Manager, and People Manager roles.',
  screenNote: 'One module, two frameworks: M6 carries both the Bridges transition stage and the Kübler-Ross sentiment reading side by side, each independently scored and justified — not a single blended emotional field.',
});
pitfallSlide({
  kicker: 'Common Pitfall', title: 'Treating Resistance as a Problem to Suppress', color: RED,
  pitfall: 'A Change Manager reads a Resistance/Anger sentiment, or open entries on the Resistance Log, as something to shut down quickly — closing entries without addressing the underlying cause, or discouraging staff from raising concerns at all.',
  why: 'Resistance feels, to a program under schedule pressure, like an obstacle to route around rather than data to use — closing the log entry looks like progress, even when the underlying cause is still live and will resurface later.',
  fix: 'journi\'s ALT-004 fires specifically to force attention at three open entries, before resistance becomes unmanageable — and this guide series\' own BPR case shows the better path: a co-designed recovery, built with the resisting staff, not around them.',
});

// =====================================================================
// HOW THEY COMBINE — CLOSING SECTION
// =====================================================================
{
  const s = newSlide();
  header(s, 'One Person, Four Readings', 'The Framework Interaction Map: how a single cohort is read at once', { size: 23,
    sub: 'journi\'s own Framework Interaction Map (v2.3) traces exactly how a signal in one framework propagates to the others — not four disconnected scores.' });
  const items = [
    { label: 'Lewin', v: 'Change', color: TEAL, icon: 'compass' },
    { label: 'ADKAR', v: 'Know. 4 / Abil. 4', color: ORANGE, icon: 'book-open' },
    { label: 'Bridges', v: 'Ending', color: RED, icon: 'route' },
    { label: 'Kübler-Ross', v: 'Exploration', color: PURPLE, icon: 'chart-line' },
  ];
  let x = 0.6;
  const w = 2.92;
  items.forEach(({ label, v, color, icon }, i) => {
    card(s, x, 2.7, w, 2.5, { fill: WHITE });
    iconCircle(s, { x: x + (w - 0.7) / 2, y: 2.95, d: 0.7, bg: color, icon, pad: 0.16 });
    s.addText(label, { x: x + 0.1, y: 3.75, w: w - 0.2, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: TEAL_DEEP, align: 'center' });
    s.addText(v, { x: x + 0.1, y: 4.15, w: w - 0.2, h: 0.5, fontFace: FONT, fontSize: 12.5, bold: true, color, align: 'center' });
    if (i < items.length - 1) s.addShape('rightArrow', { x: x + w + 0.03, y: 3.5, w: 0.28, h: 0.35, fill: { color: MUTED }, line: { type: 'none' } });
    x += w + 0.32;
  });
  s.addText('Read together, not separately: Change + high Knowledge/Ability + Ending + Exploration is a cohort that has learned the new skill and started experimenting with it, but has not yet let go of the old identity — exactly the pattern ALT-001 is built to surface, before it reaches go-live.',
    { x: 0.6, y: 5.55, w: 12.1, h: 1.0, fontFace: FONT, fontSize: 12.5, italic: true, color: MUTED, lineSpacingMultiple: 1.25 });
  footer(s);
}
{
  const s = newSlide();
  header(s, 'Worked Example', 'ALT-001: Divergence Pattern Detected', { size: 25,
    sub: 'The one alert computed directly, live, from two frameworks at once — not a single-module trigger.' });
  card(s, 0.6, 2.35, 5.85, 3.6, { fill: MINT, shadow: false });
  s.addText('THE COMPUTED RULE', { x: 0.85, y: 2.5, w: 5.3, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: TEAL_DEEP, charSpacing: 1 });
  s.addText('Knowledge ≥ 4 AND Ability ≥ 4 on M5, while Bridges reads exactly "Ending" on M6, for the same cohort.', { x: 0.85, y: 2.85, w: 5.3, h: 1.0, fontFace: FONT, fontSize: 13, bold: true, color: INK, lineSpacingMultiple: 1.25 });
  s.addText('Severity: High · Escalation: L2 — Change Manager · SLA: acknowledge within 48h', { x: 0.85, y: 4.0, w: 5.3, h: 0.6, fontFace: FONT, fontSize: 11, color: MUTED, italic: true });
  s.addText('It is not a separate module — it is computed live from M5 and M6 data and surfaces exclusively as ALT-001 in the Notification Center.', { x: 0.85, y: 4.7, w: 5.3, h: 1.1, fontFace: FONT, fontSize: 11.5, color: INK, lineSpacingMultiple: 1.2 });
  card(s, 6.65, 2.35, 6.05, 3.6, { fill: ORANGE_LIGHT, shadow: false });
  s.addText('WHY THIS COMBINATION MATTERS', { x: 6.9, y: 2.5, w: 5.55, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText('A cohort can be fully trained and technically capable, and still not have emotionally accepted the old way is gone. Attendance and competency data alone would miss this entirely — only the Bridges cross-reference surfaces it.', { x: 6.9, y: 2.85, w: 5.55, h: 1.5, fontFace: FONT, fontSize: 12, color: INK, lineSpacingMultiple: 1.25 });
  s.addText('Real case: the Bouregreg ERP program\'s Casablanca finance cohort fires ALT-001 at Week 28 (Test phase) — Exception E2 in the Master User Guide, caught and resolved before go-live rather than discovered after.', { x: 6.9, y: 4.5, w: 5.55, h: 1.3, fontFace: FONT, fontSize: 11.5, italic: true, color: INK, lineSpacingMultiple: 1.2 });
  footer(s);
}
{
  const s = newSlide();
  header(s, 'The Composite Readiness Index', 'One number, three inputs, recalculated live', { size: 25 });
  card(s, 0.6, 2.2, 12.1, 1.3, { fill: TEAL_DEEP, shadow: false });
  s.addText('ADKAR% × 0.50  +  Kübler-Ross sentiment% × 0.25  +  Training completion% × 0.25', { x: 0.85, y: 2.35, w: 11.6, h: 0.6, fontFace: FONT, fontSize: 19, bold: true, color: WHITE, align: 'center', valign: 'middle' });
  s.addText('Computed on M14 (Analytics) · Recalculated live as any of its three inputs change', { x: 0.85, y: 2.95, w: 11.6, h: 0.4, fontFace: FONT, fontSize: 11.5, color: 'B8D4CE', align: 'center' });
  const items = [
    ['50%', 'ADKAR', 'The five-block score, per cohort — the heaviest-weighted input, since it directly measures whether people can actually do the new thing.'],
    ['25%', 'Kübler-Ross Sentiment', 'How the cohort feels right now — a real, not cosmetic, quarter-weight in the final number.'],
    ['25%', 'Training Completion', 'Logged on M9 — the one input that is not itself a framework score, grounding the index in a concrete, auditable fact.'],
  ];
  let x = 0.6;
  const w = 3.95;
  for (const [pct, name, desc] of items) {
    card(s, x, 3.85, w, 2.9, { fill: MINT });
    s.addText(pct, { x: x + 0.2, y: 4.0, w: w - 0.4, h: 0.6, fontFace: FONT, fontSize: 26, bold: true, color: ORANGE });
    s.addText(name, { x: x + 0.2, y: 4.6, w: w - 0.4, h: 0.4, fontFace: FONT, fontSize: 13.5, bold: true, color: TEAL_DEEP });
    s.addText(desc, { x: x + 0.2, y: 5.0, w: w - 0.4, h: 1.6, fontFace: FONT, fontSize: 10.8, color: INK, lineSpacingMultiple: 1.2 });
    x += w + 0.14;
  }
  footer(s);
}
{
  const s = newSlide();
  header(s, 'Benchmarking', 'Reading the CRI trend, not just the number', { size: 25,
    sub: 'M14\'s benchmarking view reads a project\'s CRI trend against the pace this guide series treats as expected for its archetype and week — In Line, Ahead, or Behind.' });
  const rows = [
    ['In Line', TEAL, 'The CRI trend tracks the expected curve for this archetype and week — the default, unremarkable reading most weeks should show.'],
    ['Ahead', BLUE, 'The CRI trend outpaces the expected curve — worth naming explicitly rather than assuming it will simply continue, since an early lead can mask a later-surfacing gap (as in Exception E6\'s disaggregation).'],
    ['Behind', RED, 'The CRI trend lags the expected curve — the reading that should trigger a specific recovery task, not just a note for the next status meeting.'],
  ];
  let y = 2.55;
  for (const [label, color, desc] of rows) {
    card(s, 0.6, y, 12.1, 1.25, { fill: WHITE });
    pillBadge(s, 0.85, y + 0.18, label, color);
    s.addText(desc, { x: 3.2, y, w: 9.3, h: 1.25, fontFace: FONT, fontSize: 12.5, color: INK, valign: 'middle', lineSpacingMultiple: 1.25 });
    y += 1.4;
  }
  footer(s);
}
{
  const s = newSlide();
  header(s, 'Weighting Differs by Archetype', 'The same four frameworks, read with different emphasis', { size: 23,
    sub: 'journi logs all four frameworks on every one of its 8 registered transformation-archetype lifecycles — but which one dominates the real risk differs by type.' });
  tableSlide(s,
    ['Archetype', 'Dominant Framework(s)', 'Why'],
    [
      ['ERP', 'ADKAR + Lewin', 'A system cutover needs both organizational readiness and individual capability at once.'],
      ['BPR', 'Kübler-Ross', 'Staff privately own the workarounds being redesigned away — resistance is the central risk.'],
      ['Automation', 'ADKAR (light touch)', 'A narrow, low-resistance scope means all four frameworks read favorably from the start.'],
      ['QMS', 'Lewin (Refreeze never closes)', 'Certification surveillance runs ongoing — the organizational state never fully "sets."'],
      ['Cultural', 'Bridges + Kübler-Ross', 'Identity and emotional integration matter more than any specific skill.'],
      ['Operating Model', 'ADKAR Reinforcement', 'Reversion under operational pressure, not initial adoption, is the real risk.'],
      ['Compliance', 'ADKAR (Awareness + Ability)', 'Checkable behaviors matter; Desire matters far less than in any other archetype.'],
      ['Training & Skills', 'ADKAR (all five blocks)', 'The entire program exists to move a population through the ADKAR arc itself.'],
    ],
    { colW: [2.4, 3.3, 6.4], y: 2.6, fontSize: 10.5 });
  footer(s);
}
{
  const s = newSlide();
  header(s, 'Which Modules Each Framework Touches', 'A quick cross-reference', { size: 25 });
  tableSlide(s,
    ['Framework', 'Primary Module', 'Feeds Into'],
    [
      ['Lewin', 'M3 (Initiative Registry)', 'Phase Gate context on M17; the organizational backdrop for every other reading'],
      ['ADKAR', 'M5 (ADKAR Engine)', 'M14\'s Composite Readiness Index (50% weight); ALT-001\'s Knowledge/Ability input'],
      ['Bridges', 'M6 (Emotional & Transition Layer)', 'ALT-001\'s emotional-position input; sustainment evidence for Refreeze'],
      ['Kübler-Ross', 'M6 (Emotional & Transition Layer)', 'M14\'s Composite Readiness Index (25% weight); ALT-004 via the Resistance Log (M10)'],
    ],
    { colW: [2.2, 3.8, 6.1], y: 2.35, fontSize: 11.5 });
  s.addText('Training completion (M9), the CRI\'s third input, is the one piece of evidence in the index that is not itself a framework score — a deliberate design choice keeping the index grounded in something concrete and auditable.',
    { x: 0.6, y: 5.1, w: 12.1, h: 0.7, fontFace: FONT, fontSize: 12, italic: true, color: MUTED, lineSpacingMultiple: 1.2 });
  footer(s);
}
{
  const s = newSlide();
  header(s, 'Alerts and the Frameworks', 'Which of the 9 live alerts trace to which framework', { size: 24 });
  tableSlide(s,
    ['Alert', 'Framework Link'],
    [
      ['ALT-001 Divergence Pattern Detected', 'ADKAR (Knowledge, Ability) + Bridges (Ending) — computed jointly'],
      ['ALT-002 Regression Risk Score Critical', 'ADKAR Reinforcement, via a High-risk M12 sustainment checkpoint'],
      ['ALT-003 Sponsor Coverage Gap', 'Not a framework score directly — damages Bridges and Kübler-Ross fastest'],
      ['ALT-004 Resistance Escalation Threshold Breached', 'Kübler-Ross (Resistance/Anger), via the Resistance Log (M10)'],
      ['ALT-008 Change Saturation Threshold Breached', 'Portfolio-level — not tied to a single framework'],
      ['ALT-009 Phase Gate No-Go / Conditional', 'Lewin — a Phase Gate is the organizational-transition checkpoint'],
      ['ALT-010 Guiding Coalition Gap', 'Not a framework score directly — a Sponsor & Coalition (M7) structural gap'],
      ['ALT-011 Communication Overload Detected', 'Portfolio-level — not tied to a single framework'],
      ['ALT-015 Sustainment Sign-Off Blocked', 'ADKAR Reinforcement + Lewin Refreeze, blocked until the regression clears'],
    ],
    { colW: [5.3, 6.8], y: 2.15, fontSize: 10.3 });
  footer(s);
}
{
  const s = newSlide();
  header(s, 'Reading Paths by Role', 'What each stakeholder should actually watch', { size: 25 });
  const rows = [
    ['Change Manager', 'bell', 'The Notification Center bell first, then M14 for the trend behind whatever fired — the day-to-day owner of all four frameworks.'],
    ['Executive Sponsor / Steering Committee', 'user-tie', 'M14\'s benchmarking view for the blended readiness trend; ALT-003, ALT-004, ALT-009, and ALT-010 name them directly as a recipient.'],
    ['PMO / Program Manager', 'users-gear', 'ALT-008 and ALT-009 are PM-facing by design — saturation and gate outcomes are portfolio- and schedule-level concerns first.'],
    ['Super Admin', 'shield-halved', 'None of the 9 live alerts route here by default; their standing responsibility is tenant configuration, not day-to-day alert triage.'],
  ];
  let y = 2.3;
  for (const [role, icon, desc] of rows) {
    card(s, 0.6, y, 12.1, 1.05, { fill: MINT, shadow: false });
    iconCircle(s, { x: 0.85, y: y + 0.18, d: 0.68, bg: TEAL, icon, pad: 0.16 });
    s.addText(role, { x: 1.85, y: y + 0.13, w: 3.2, h: 0.8, fontFace: FONT, fontSize: 13.5, bold: true, color: TEAL_DEEP, valign: 'middle', lineSpacingMultiple: 1.1 });
    s.addText(desc, { x: 5.15, y: y + 0.13, w: 7.4, h: 0.8, fontFace: FONT, fontSize: 11.5, color: MUTED, valign: 'middle', lineSpacingMultiple: 1.18 });
    y += 1.18;
  }
  footer(s);
}
// =====================================================================
// CLOSING
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 2.2, d: 0.85, bg: ORANGE, icon: 'compass', pad: 0.18 });
  s.addText('Four lenses. One traceable record.', { x: 0.7, y: 3.2, w: 11, h: 1.0, fontFace: FONT, fontSize: 34, bold: true, color: WHITE });
  s.addText('journi never asks anyone to reconcile Lewin, ADKAR, Bridges, and Kübler-Ross by hand — every reading is scored, justified, and computed into one auditable picture.', { x: 0.75, y: 4.1, w: 10.7, h: 0.8, fontFace: FONT, fontSize: 15, italic: true, color: 'B8D4CE', lineSpacingMultiple: 1.3 });
  s.addText('Manufacturing Sector · Bouregreg Group Scenario Library · Confidential', { x: 0.75, y: 6.75, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A' });
}

pptx.writeFile({ fileName: path.join(__dirname, 'journi_Four_Frameworks_Deep_Dive.pptx') }).then(async () => {
  console.log('wrote journi_Four_Frameworks_Deep_Dive.pptx, slide count:', pptx.slides.length);
  await require('./fix-pptx.js').fixPptx(path.join(__dirname, 'journi_Four_Frameworks_Deep_Dive.pptx'));
});
