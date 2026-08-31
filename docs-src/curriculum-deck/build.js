const {
  pptx, newSlide, footer, header, iconCircle, card, pillBadge, A,
  TEAL_DEEP, TEAL, TEAL_MID, MINT, MINT2, ORANGE, ORANGE_LIGHT, INK, MUTED, WHITE, RED, RED_LIGHT, FONT,
  LEVELS, TRAININGS,
} = require('./deck.js');

function levelOf(id) { return LEVELS.find((l) => l.id === id); }
function trainingsOf(levelId) { return TRAININGS.filter((t) => t.level === levelId); }

// =====================================================================
// SLIDE 1 — TITLE
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 0.7, d: 0.85, bg: ORANGE, icon: 'graduation-cap', pad: 0.19 });
  s.addText('journi Academy', { x: 0.7, y: 2.35, w: 11, h: 1.1, fontFace: FONT, fontSize: 50, bold: true, color: WHITE });
  s.addText('A Detailed Curriculum for Human Change Management', { x: 0.75, y: 3.35, w: 10.5, h: 0.55, fontFace: FONT, fontSize: 20, italic: true, color: 'B8D4CE' });
  s.addText('Delivered through hands-on workshops in journi', { x: 0.75, y: 3.9, w: 9, h: 0.45, fontFace: FONT, fontSize: 14, color: '9FC2BC' });
  const stats = [['3', 'Levels'], ['9', 'Trainings'], ['20', 'Half-Days'], ['20', 'Workshops'], ['12', 'Exams']];
  let x = 0.75;
  for (const [n, l] of stats) {
    s.addText(n, { x, y: 4.7, w: 1.9, h: 0.75, fontFace: FONT, fontSize: 32, bold: true, color: ORANGE });
    s.addText(l.toUpperCase(), { x, y: 5.4, w: 1.9, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: '9FC2BC', charSpacing: 1 });
    x += 1.95;
  }
  s.addText('Prepared for POWERACT Consulting  ·  Confidential', { x: 0.75, y: 6.85, w: 8, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A' });
}

// =====================================================================
// SLIDE 2 — CURRICULUM OVERVIEW
// =====================================================================
{
  const s = newSlide();
  header(s, 'Curriculum Overview', 'Three levels, one continuous certification pathway', { size: 27,
    sub: 'Each level builds on the credential before it — Foundation fluency, Practitioner ownership, Advanced portfolio leadership.' });
  let x = 0.6;
  const w = 3.95;
  for (const lvl of LEVELS) {
    card(s, x, 2.35, w, 4.35, { fill: lvl.tint });
    iconCircle(s, { x: x + 0.28, y: 2.63, d: 0.78, bg: lvl.color, icon: lvl.icon, pad: 0.19 });
    s.addText(lvl.name, { x: x + 1.2, y: 2.7, w: w - 1.5, h: 0.65, fontFace: FONT, fontSize: 19, bold: true, color: lvl.color, valign: 'middle' });
    s.addText(lvl.tagline, { x: x + 0.28, y: 3.55, w: w - 0.56, h: 0.7, fontFace: FONT, fontSize: 12.5, bold: true, color: INK, lineSpacingMultiple: 1.15 });
    const trs = trainingsOf(lvl.id);
    let iy = 4.35;
    for (const t of trs) {
      s.addText([{ text: '›  ', options: { color: lvl.color, bold: true } }, { text: t.name, options: { color: INK } }],
        { x: x + 0.28, y: iy, w: w - 0.56, h: 0.55, fontFace: FONT, fontSize: 10.8, lineSpacingMultiple: 1.1, valign: 'top' });
      iy += 0.58;
    }
    s.addText(`${lvl.days} days  ·  ${trs.length} trainings  ·  ${trs.reduce((a, t) => a + t.halfDays.length, 0)} half-days`,
      { x: x + 0.28, y: 6.3, w: w - 0.56, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: lvl.color });
    x += w + 0.14;
  }
  footer(s);
}

// =====================================================================
// SLIDE 3 — GOLDEN RULE & METHODOLOGY
// =====================================================================
{
  const s = newSlide();
  header(s, 'Methodology', 'The Golden Rule: every half-day, one quiz, one workshop', { size: 26,
    sub: 'Content is always immediately checked, then immediately applied — no half-day passes without both.' });
  const steps = [
    ['book-open', 'Content', TEAL, '60–75 min per session. Concepts taught directly against the live journi application, not slides alone.'],
    ['circle-question', 'Quiz', ORANGE, '15 min, 8 items. A short formative check — did the concept land before we apply it?'],
    ['users', 'Workshop', TEAL, '90–150 min. Hands-on in journi against a realistic scenario. This is where the skill is actually built.'],
    ['list-check', 'Debrief', ORANGE, '15 min. What worked, what didn\'t, and how it connects to the next half-day.'],
  ];
  let x = 0.6;
  const w = 2.92;
  for (let i = 0; i < steps.length; i++) {
    const [icon, name, color, desc] = steps[i];
    card(s, x, 2.55, w, 3.0, { fill: WHITE });
    iconCircle(s, { x: x + (w - 0.75) / 2, y: 2.8, d: 0.75, bg: color, icon, pad: 0.18 });
    s.addText(name, { x: x + 0.15, y: 3.7, w: w - 0.3, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: TEAL_DEEP, align: 'center' });
    s.addText(desc, { x: x + 0.2, y: 4.15, w: w - 0.4, h: 1.3, fontFace: FONT, fontSize: 10.8, color: MUTED, align: 'center', lineSpacingMultiple: 1.2 });
    if (i < steps.length - 1) {
      s.addShape('rightArrow', { x: x + w + 0.02, y: 3.75, w: 0.32, h: 0.35, fill: { color: MUTED }, line: { type: 'none' } });
    }
    x += w + 0.35;
  }
  s.addText('Assessment stack: formative Quiz (per half-day) → summative Training Exam (per training) → integrative Level Exam (per level, gates progression to the next level).',
    { x: 0.6, y: 5.95, w: 12.1, h: 0.65, fontFace: FONT, fontSize: 13, bold: true, italic: true, color: TEAL_DEEP, align: 'center', lineSpacingMultiple: 1.2 });
  footer(s);
}

// =====================================================================
// SLIDE 4 — ASSESSMENT & CERTIFICATION POLICY
// =====================================================================
{
  const s = newSlide();
  header(s, 'Assessment Policy', 'Pass marks, retakes and credentials', { size: 27 });
  const headRow = [
    { text: 'Assessment', options: { fill: { color: TEAL_DEEP }, color: WHITE, bold: true, fontSize: 12 } },
    { text: 'Frequency', options: { fill: { color: TEAL_DEEP }, color: WHITE, bold: true, fontSize: 12, align: 'center' } },
    { text: 'Typical Format', options: { fill: { color: TEAL_DEEP }, color: WHITE, bold: true, fontSize: 12 } },
    { text: 'Pass Mark', options: { fill: { color: ORANGE }, color: WHITE, bold: true, fontSize: 12, align: 'center' } },
    { text: 'Retake Policy', options: { fill: { color: TEAL_DEEP }, color: WHITE, bold: true, fontSize: 12 } },
  ];
  const rows = [
    ['Quiz', '1 per half-day (20 total)', '8 MCQ, closed-book, 15 min', 'Formative — no pass mark', 'N/A — for facilitator pacing only'],
    ['Training Exam', '1 per training (9 total)', '25–30 MCQ + 1 practical/case', '75%', 'One free retake after 48h review'],
    ['Level Exam', '1 per level (3 total)', '40–60 MCQ + integrated practical', '80%', 'One retake after a 1-week remediation plan'],
    ['Capstone Rubric', 'TRN-A3 only', 'Facilitator-scored, 4 × 25 pts', '75 / 100', 'Re-attempt at next capstone cohort'],
  ];
  const table = [headRow];
  rows.forEach((r, i) => {
    const bg = i % 2 === 0 ? WHITE : MINT;
    table.push(r.map((v, ci) => ({
      text: v, options: { fill: { color: ci === 3 ? ORANGE_LIGHT : bg }, color: ci === 3 ? ORANGE : INK, bold: ci === 0 || ci === 3, fontSize: 11.5, align: ci === 1 || ci === 3 ? 'center' : 'left', valign: 'middle' },
    })));
  });
  s.addTable(table, { x: 0.6, y: 2.15, w: 12.1, h: 3.2, colW: [2.0, 2.3, 3.5, 1.5, 2.8], border: { type: 'solid', color: 'DBE6E3', pt: 0.75 }, fontFace: FONT, autoPage: false, valign: 'middle' });
  s.addText('Credentials awarded: journi Certified Change Practitioner — Foundation / Practitioner, and journi Certified Change Management Practitioner — Advanced, each on passing that level\'s Level Exam.',
    { x: 0.6, y: 5.65, w: 12.1, h: 0.6, fontFace: FONT, fontSize: 12, color: MUTED, italic: true, lineSpacingMultiple: 1.2 });
  footer(s);
}

// =====================================================================
// LEVEL SECTIONS
// =====================================================================
function levelIntroSlide(lvl) {
  const s = newSlide(lvl.color);
  s.addText(lvl.id + '  ·  LEVEL', { x: 0.6, y: 0.45, w: 10, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: ORANGE === lvl.color ? TEAL_DEEP : ORANGE, charSpacing: 2 });
  iconCircle(s, { x: 0.6, y: 0.85, d: 0.9, bg: lvl.color === ORANGE ? TEAL_DEEP : ORANGE, icon: lvl.icon, pad: 0.2 });
  // recolor icon circle bg to the contrasting brand hue so the white icon glyph stays legible against any level's slide-background color
  s.addText(lvl.name, { x: 1.75, y: 0.85, w: 9, h: 0.9, fontFace: FONT, fontSize: 34, bold: true, color: WHITE, valign: 'middle' });
  s.addText(lvl.tagline, { x: 1.75, y: 1.65, w: 10, h: 0.5, fontFace: FONT, fontSize: 16, italic: true, color: 'E3F0EC' });

  card(s, 0.6, 2.35, 5.85, 2.05, { fill: WHITE, shadow: false });
  s.addText('TARGET AUDIENCE', { x: 0.85, y: 2.52, w: 5.3, h: 0.32, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(lvl.audience, { x: 0.85, y: 2.85, w: 5.3, h: 1.45, fontFace: FONT, fontSize: 12, color: INK, lineSpacingMultiple: 1.2 });

  card(s, 6.6, 2.35, 6.15, 2.05, { fill: WHITE, shadow: false });
  s.addText('LEARNING OUTCOME', { x: 6.85, y: 2.52, w: 5.6, h: 0.32, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(lvl.outcome, { x: 6.85, y: 2.85, w: 5.6, h: 1.45, fontFace: FONT, fontSize: 12, color: INK, lineSpacingMultiple: 1.2 });

  s.addText('TRAININGS IN THIS LEVEL', { x: 0.6, y: 4.6, w: 6, h: 0.32, fontFace: FONT, fontSize: 11, bold: true, color: 'E3F0EC', charSpacing: 1 });
  let y = 5.0;
  for (const t of trainingsOf(lvl.id)) {
    s.addText([{ text: t.id + '  ', options: { bold: true, color: WHITE } }, { text: t.name, options: { color: 'D8EAE6' } }],
      { x: 0.6, y, w: 12.1, h: 0.35, fontFace: FONT, fontSize: 13, lineSpacingMultiple: 1.05 });
    y += 0.38;
  }
  card(s, 0.6, 6.35, 12.1, 0.75, { fill: TEAL_DEEP, shadow: false });
  s.addText([{ text: lvl.examId + '  ', options: { bold: true, color: ORANGE } }, { text: lvl.examSpec, options: { color: WHITE } }],
    { x: 0.85, y: 6.35, w: 11.6, h: 0.75, fontFace: FONT, fontSize: 11, valign: 'middle', lineSpacingMultiple: 1.1 });
  footer(s, true);
}

function trainingProfileSlide(t) {
  const lvl = levelOf(t.level);
  const s = newSlide();
  header(s, `${lvl.name} · ${t.id}`, t.name, { size: 22, titleColor: lvl.color, titleW: 10.9 });
  iconCircle(s, { x: 11.85, y: 0.4, d: 0.62, bg: lvl.color, icon: t.icon, pad: 0.14 });

  s.addText('GOALS', { x: 0.6, y: 1.65, w: 5.7, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
  let gy = 1.98;
  for (const g of t.goals) {
    s.addText([{ text: '›  ', options: { color: lvl.color, bold: true } }, { text: g, options: { color: INK } }],
      { x: 0.6, y: gy, w: 5.75, h: 0.6, fontFace: FONT, fontSize: 10.8, lineSpacingMultiple: 1.12, valign: 'top' });
    gy += 0.62;
  }
  s.addText('TARGET AUDIENCE', { x: 0.6, y: gy + 0.08, w: 5.7, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
  s.addText(t.audience, { x: 0.6, y: gy + 0.4, w: 5.75, h: 0.85, fontFace: FONT, fontSize: 10.8, color: MUTED, lineSpacingMultiple: 1.2 });

  // half-day agenda table on the right — compact spacing when a training runs more than 2 half-days (the capstone)
  const compact = t.halfDays.length > 2;
  const hFont = compact ? 9.8 : 10.8, bFont = compact ? 8.3 : 9;
  const headH = compact ? 0.26 : 0.32, lineH = compact ? 0.24 : 0.3, examLineH = compact ? 0.22 : 0.28, blockGap = compact ? 0.06 : 0.1;
  const tx = 6.55, tw = 6.15;
  s.addText('DETAILED AGENDA', { x: tx, y: 1.65, w: tw, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
  let y = 2.0;
  for (const hd of t.halfDays) {
    const blockH = headH + hd.sessions.length * lineH + examLineH * 2;
    card(s, tx, y, tw, blockH, { fill: lvl.tint, shadow: false });
    s.addText([{ text: hd.label + '  ', options: { bold: true, color: lvl.color } }, { text: hd.theme, options: { color: INK, bold: true } }],
      { x: tx + 0.15, y: y + 0.04, w: tw - 0.3, h: headH, fontFace: FONT, fontSize: hFont });
    let sy = y + headH + 0.02;
    for (const [title, dur] of hd.sessions) {
      s.addText(`• ${title} (${dur}m)`, { x: tx + 0.2, y: sy, w: tw - 0.4, h: lineH, fontFace: FONT, fontSize: bFont, color: MUTED, lineSpacingMultiple: 1.0 });
      sy += lineH;
    }
    s.addText([{ text: `${hd.quiz.id}  `, options: { bold: true, color: ORANGE } }, { text: `Quiz — ${hd.quiz.topic} (${hd.quiz.items} items, 15m)`, options: { color: INK } }],
      { x: tx + 0.2, y: sy, w: tw - 0.4, h: examLineH, fontFace: FONT, fontSize: bFont });
    sy += examLineH;
    s.addText([{ text: `${hd.workshop.id}  `, options: { bold: true, color: lvl.color } }, { text: `Workshop — ${hd.workshop.name} (${hd.workshop.duration}m)`, options: { color: INK } }],
      { x: tx + 0.2, y: sy, w: tw - 0.4, h: examLineH, fontFace: FONT, fontSize: bFont });
    y += blockH + blockGap;
  }
  card(s, tx, y, tw, 0.55, { fill: TEAL_DEEP, shadow: false });
  s.addText([{ text: `${t.exam.id}  `, options: { bold: true, color: ORANGE } }, { text: `${t.exam.format} · ${t.exam.duration ? t.exam.duration + ' min · ' : ''}pass mark ${t.exam.passMark}${t.exam.rubric ? '/100' : '%'}`, options: { color: WHITE } }],
    { x: tx + 0.15, y, w: tw - 0.3, h: 0.55, fontFace: FONT, fontSize: 10, valign: 'middle', lineSpacingMultiple: 1.05 });
  footer(s);
}

function workshopCard(s, x, y, w, h, ws, color) {
  card(s, x, y, w, h, { fill: WHITE });
  pillBadge(s, x + 0.2, y + 0.18, ws.id, color);
  s.addText(`${ws.duration} min`, { x: x + w - 1.3, y: y + 0.18, w: 1.1, h: 0.3, fontFace: FONT, fontSize: 9.5, bold: true, color: MUTED, align: 'right' });
  s.addText(ws.name, { x: x + 0.2, y: y + 0.58, w: w - 0.4, h: 0.5, fontFace: FONT, fontSize: 14, bold: true, color: TEAL_DEEP, lineSpacingMultiple: 1.05 });
  s.addText('GOALS', { x: x + 0.2, y: y + 1.12, w: w - 0.4, h: 0.25, fontFace: FONT, fontSize: 9, bold: true, color: ORANGE, charSpacing: 0.5 });
  let gy = y + 1.38;
  for (const g of ws.goals) {
    s.addText(`• ${g}`, { x: x + 0.2, y: gy, w: w - 0.4, h: 0.3, fontFace: FONT, fontSize: 9.3, color: INK, lineSpacingMultiple: 1.1 });
    gy += 0.28;
  }
  s.addText('DETAILED AGENDA', { x: x + 0.2, y: gy + 0.06, w: w - 0.4, h: 0.25, fontFace: FONT, fontSize: 9, bold: true, color: ORANGE, charSpacing: 0.5 });
  let ay = gy + 0.32;
  ws.agenda.forEach((step, i) => {
    s.addText(`${i + 1}. ${step}`, { x: x + 0.2, y: ay, w: w - 0.4, h: 0.34, fontFace: FONT, fontSize: 9.1, color: MUTED, lineSpacingMultiple: 1.05 });
    ay += 0.32;
  });
}

function trainingWorkshopsSlide(t) {
  const lvl = levelOf(t.level);
  const s = newSlide();
  header(s, `${t.id} · Workshops in Detail`, t.name, { size: 20, titleColor: lvl.color });
  const wss = t.halfDays.map((hd) => hd.workshop);
  if (wss.length <= 2) {
    const w = 5.95;
    let x = 0.6;
    for (const ws of wss) {
      workshopCard(s, x, 2.1, w, 4.85, ws, lvl.color);
      x += w + 0.2;
    }
  } else {
    const w = 5.95, h = 2.35;
    const pos = [[0.6, 2.1], [6.75, 2.1], [0.6, 4.6], [6.75, 4.6]];
    wss.forEach((ws, i) => workshopCardCompact(s, pos[i][0], pos[i][1], w, h, ws, lvl.color));
  }
  footer(s);
}
function workshopCardCompact(s, x, y, w, h, ws, color) {
  card(s, x, y, w, h, { fill: WHITE });
  pillBadge(s, x + 0.18, y + 0.15, ws.id, color);
  s.addText(`${ws.duration}m`, { x: x + w - 0.9, y: y + 0.15, w: 0.7, h: 0.28, fontFace: FONT, fontSize: 9, bold: true, color: MUTED, align: 'right' });
  s.addText(ws.name, { x: x + 0.18, y: y + 0.48, w: w - 0.36, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: TEAL_DEEP, lineSpacingMultiple: 1.0 });
  let ay = y + 0.92;
  ws.agenda.slice(0, 3).forEach((step, i) => {
    s.addText(`${i + 1}. ${step}`, { x: x + 0.18, y: ay, w: w - 0.36, h: 0.4, fontFace: FONT, fontSize: 8.6, color: MUTED, lineSpacingMultiple: 1.05 });
    ay += 0.38;
  });
}

for (const lvl of LEVELS) {
  levelIntroSlide(lvl);
  for (const t of trainingsOf(lvl.id)) {
    trainingProfileSlide(t);
    trainingWorkshopsSlide(t);
  }
}

// =====================================================================
// LOGISTICS / DELIVERY NOTES
// =====================================================================
{
  const s = newSlide();
  header(s, 'Delivery Notes', 'Facilitator logistics', { size: 27 });
  const items = [
    ['users', 'Cohort size', 'Cap at 12 participants per journi environment so every workshop step is individually completable, not just observed.'],
    ['server', 'Environment', 'Each cohort gets its own seeded Windows-installed journi instance (Atlas Industrial Group demo tenant); "Reset Demo Data" between cohorts, never mid-cohort.'],
    ['user-graduate', 'Facilitator ratio', 'One lead facilitator per cohort; the Capstone (TRN-A3) requires a second facilitator to run the crisis-injection and panel-defense roles.'],
    ['clock', 'Pacing', 'Half-days run 3.5–4 hours including breaks; the golden-rule blocks (content → quiz → workshop → debrief) are not compressible.'],
  ];
  let y = 2.15;
  for (const [icon, name, desc] of items) {
    card(s, 0.6, y, 12.1, 1.0, { fill: MINT, shadow: false });
    iconCircle(s, { x: 0.85, y: y + 0.16, d: 0.68, bg: TEAL, icon, pad: 0.16 });
    s.addText(name, { x: 1.85, y: y + 0.13, w: 3.0, h: 0.75, fontFace: FONT, fontSize: 14, bold: true, color: TEAL_DEEP, valign: 'middle', lineSpacingMultiple: 1.1 });
    s.addText(desc, { x: 5.05, y: y + 0.13, w: 7.5, h: 0.75, fontFace: FONT, fontSize: 11.5, color: MUTED, valign: 'middle', lineSpacingMultiple: 1.15 });
    y += 1.15;
  }
  footer(s);
}

// =====================================================================
// CERTIFICATION PATHWAY SUMMARY
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  s.addText('THE PATHWAY', { x: 0.6, y: 0.45, w: 10, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: ORANGE, charSpacing: 2 });
  s.addText('Three credentials, one continuous journey', { x: 0.6, y: 0.82, w: 12, h: 0.85, fontFace: FONT, fontSize: 28, bold: true, color: WHITE });
  let x = 0.6;
  const w = 3.85;
  LEVELS.forEach((lvl, i) => {
    card(s, x, 2.3, w, 3.9, { fill: WHITE, shadow: false });
    iconCircle(s, { x: x + (w - 0.85) / 2, y: 2.6, d: 0.85, bg: lvl.color, icon: lvl.icon, pad: 0.2 });
    s.addText(lvl.name, { x: x + 0.2, y: 3.55, w: w - 0.4, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: lvl.color, align: 'center' });
    s.addText(lvl.credential, { x: x + 0.3, y: 4.0, w: w - 0.6, h: 0.9, fontFace: FONT, fontSize: 10.5, color: INK, align: 'center', lineSpacingMultiple: 1.2 });
    s.addText(`${lvl.days} days · ${trainingsOf(lvl.id).length} trainings`, { x: x + 0.3, y: 5.75, w: w - 0.6, h: 0.35, fontFace: FONT, fontSize: 10, bold: true, color: MUTED, align: 'center' });
    if (i < LEVELS.length - 1) {
      s.addShape('rightArrow', { x: x + w + 0.05, y: 3.95, w: 0.4, h: 0.4, fill: { color: ORANGE }, line: { type: 'none' } });
    }
    x += w + 0.45;
  });
  footer(s, true);
}

// =====================================================================
// CLOSING
// =====================================================================
{
  const s = newSlide(TEAL_DEEP);
  iconCircle(s, { x: 0.75, y: 2.35, d: 0.85, bg: ORANGE, icon: 'award', pad: 0.19 });
  s.addText('Build the practice, not just the project.', { x: 0.7, y: 3.35, w: 11, h: 1.0, fontFace: FONT, fontSize: 34, bold: true, color: WHITE });
  s.addText('journi Academy — Human Change Management Curriculum', { x: 0.75, y: 4.25, w: 9.5, h: 0.55, fontFace: FONT, fontSize: 16, italic: true, color: 'B8D4CE' });
  s.addText('POWERACT Consulting  ·  Confidential', { x: 0.75, y: 6.75, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A' });
}

pptx.writeFile({ fileName: path_out() }).then(() => console.log('wrote', path_out()));
function path_out() { return require('path').join(__dirname, 'journi_Curriculum_HCM.pptx'); }
