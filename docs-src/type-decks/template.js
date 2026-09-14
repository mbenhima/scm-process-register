const path = require('path');
const { makeDeck, makeHelpers, TEAL_DEEP, TEAL, TEAL_MID, MINT, MINT2, ORANGE, ORANGE_LIGHT, INK, MUTED, WHITE, RED, RED_LIGHT, BLUE, BLUE_LIGHT, PURPLE, PURPLE_LIGHT, FONT } = require('./deck.js');

function buildDeck(t) {
  const pptx = makeDeck();
  const footerLabel = `journi — ${t.name} (${t.caseName})`;
  const { newSlide, footer, header, iconCircle, card, pillBadge, bullets, tableSlide, phaseFlow } = makeHelpers(pptx, footerLabel);
  const C = t.color;

  // ===== 1. TITLE =====
  {
    const s = newSlide(TEAL_DEEP);
    iconCircle(s, { x: 0.75, y: 0.7, d: 0.85, bg: ORANGE, icon: t.icon, pad: 0.18 });
    s.addText(t.name, { x: 0.7, y: 2.2, w: 11.7, h: 1.1, fontFace: FONT, fontSize: 40, bold: true, color: WHITE });
    s.addText(t.caseName, { x: 0.75, y: 3.2, w: 11, h: 0.55, fontFace: FONT, fontSize: 19, italic: true, color: 'B8D4CE' });
    s.addText(t.tagline, { x: 0.75, y: 3.85, w: 11, h: 0.75, fontFace: FONT, fontSize: 13.5, color: '9FC2BC', lineSpacingMultiple: 1.25 });
    const stats = [[String(t.phases.length), 'Phases'], [t.weeksLabel.split(' ')[0], 'Weeks'], ['6', 'Exceptions'], ['3', 'Training Tiers']];
    let x = 0.75;
    for (const [n, l] of stats) {
      s.addText(n, { x, y: 4.95, w: 2.4, h: 0.75, fontFace: FONT, fontSize: 30, bold: true, color: ORANGE });
      s.addText(l.toUpperCase(), { x, y: 5.63, w: 2.4, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: '9FC2BC', charSpacing: 1 });
      x += 2.5;
    }
    s.addText('Manufacturing Sector · Bouregreg Group Scenario Library · Confidential', { x: 0.75, y: 6.85, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A' });
  }

  // ===== 2. PURPOSE: WHAT / HOW =====
  {
    const s = newSlide();
    header(s, 'Part 0 — Purpose', 'What This Guide Is, and How to Use It', { size: 24, titleColor: C });
    s.addText('WHAT THIS GUIDE IS', { x: 0.6, y: 2.15, w: 12.1, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
    s.addText(t.purpose.what, { x: 0.6, y: 2.5, w: 12.1, h: 1.7, fontFace: FONT, fontSize: 13, color: INK, lineSpacingMultiple: 1.3 });
    s.addText('HOW TO USE IT', { x: 0.6, y: 4.35, w: 12.1, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
    s.addText(t.purpose.how, { x: 0.6, y: 4.7, w: 12.1, h: 1.5, fontFace: FONT, fontSize: 13, color: INK, lineSpacingMultiple: 1.3 });
    footer(s);
  }

  // ===== 3. PURPOSE: FIDELITY =====
  {
    const s = newSlide();
    header(s, 'Part 0 — A Note on Fidelity', 'Verified Against journi\'s Real Source', { size: 24, titleColor: C });
    card(s, 0.6, 2.2, 12.1, 2.2, { fill: MINT, shadow: false });
    s.addText(t.purpose.fidelity, { x: 0.85, y: 2.45, w: 11.6, h: 1.7, fontFace: FONT, fontSize: 13.5, color: INK, lineSpacingMultiple: 1.3 });
    s.addText('RACSI CODES USED THROUGHOUT', { x: 0.6, y: 4.7, w: 12.1, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
    s.addText('ES = Executive Sponsor · CM = Change Manager · PM = Program/Project Manager · FPO = Functional Process Owner · ITL = IT/Technical Lead · SUP = Supervisor · EU = End User', { x: 0.6, y: 5.05, w: 12.1, h: 0.8, fontFace: FONT, fontSize: 12.5, color: MUTED, lineSpacingMultiple: 1.25 });
    footer(s);
  }

  // ===== 4-6. EXEC SUMMARY =====
  {
    const s = newSlide();
    header(s, 'Part 1 — Executive Summary', 'Why This Case Matters', { size: 24, titleColor: C });
    card(s, 0.6, 2.2, 12.1, 3.5, { fill: WHITE });
    s.addText(t.execSummary.why, { x: 0.9, y: 2.5, w: 11.5, h: 2.9, fontFace: FONT, fontSize: 15, color: INK, lineSpacingMultiple: 1.4 });
    footer(s);
  }
  {
    const s = newSlide();
    header(s, 'Part 1 — Executive Summary', 'The Case, in Brief', { size: 24, titleColor: C });
    card(s, 0.6, 2.2, 12.1, 1.6, { fill: MINT, shadow: false });
    s.addText(t.population, { x: 0.85, y: 2.35, w: 5.6, h: 0.5, fontFace: FONT, fontSize: 14, bold: true, color: C });
    s.addText(t.weeksLabel, { x: 6.6, y: 2.35, w: 5.6, h: 0.5, fontFace: FONT, fontSize: 14, bold: true, color: C });
    s.addText(t.execSummary.brief, { x: 0.6, y: 4.0, w: 12.1, h: 2.2, fontFace: FONT, fontSize: 14, color: INK, lineSpacingMultiple: 1.35 });
    footer(s);
  }
  {
    const s = newSlide();
    header(s, 'Part 1 — Executive Summary', 'What This Guide Proves, Concretely', { size: 24, titleColor: C });
    card(s, 0.6, 2.2, 12.1, 3.5, { fill: WHITE });
    s.addText(t.execSummary.proof, { x: 0.9, y: 2.5, w: 11.5, h: 2.9, fontFace: FONT, fontSize: 15, italic: true, color: INK, lineSpacingMultiple: 1.4 });
    footer(s);
  }

  // ===== 7-8. FRAMEWORKS =====
  {
    const s = newSlide();
    header(s, 'Part 2 — The Four Frameworks', 'Weighting for This Archetype', { size: 24, titleColor: C });
    card(s, 0.6, 2.2, 12.1, 3.5, { fill: MINT, shadow: false });
    s.addText(t.frameworks.weighting, { x: 0.9, y: 2.5, w: 11.5, h: 2.9, fontFace: FONT, fontSize: 14, color: INK, lineSpacingMultiple: 1.35 });
    footer(s);
  }
  {
    const s = newSlide();
    header(s, 'Part 2 — The Four Frameworks', 'The Composite Readiness Index, Read for This Case', { size: 22, titleColor: C });
    card(s, 0.6, 2.2, 12.1, 3.5, { fill: WHITE });
    s.addText(t.frameworks.cri, { x: 0.9, y: 2.5, w: 11.5, h: 2.9, fontFace: FONT, fontSize: 14, color: INK, lineSpacingMultiple: 1.35 });
    footer(s);
  }

  // ===== 9. SETUP: TENANT + READING PATHS =====
  {
    const s = newSlide();
    header(s, 'Part 3 — Tenant and Admin Setup', 'The Existing Tenant, and Reading Paths by Role', { size: 22, titleColor: C });
    s.addText('THE EXISTING TENANT', { x: 0.6, y: 2.15, w: 12.1, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
    s.addText('This program runs inside the same tenant journi\'s Master User Guide builds, under the existing Bouregreg Manufacturing Maroc Organization — no new Organization needed.', { x: 0.6, y: 2.5, w: 12.1, h: 0.7, fontFace: FONT, fontSize: 13, color: INK, lineSpacingMultiple: 1.25 });
    s.addText('READING PATHS, BY ROLE', { x: 0.6, y: 3.4, w: 12.1, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
    bullets(s, 0.6, 3.75, 12.1, 2.6, [
      'A Change Manager running this program day to day: Part 2 once, then Part 4 in full.',
      'A Program/Project Manager: Part 4\'s PM Track column and the Master WBS & Gantt.',
      'An Executive Sponsor: Part 1, then Part 4\'s phase-opening narratives.',
      'A Super Admin or Org Admin: Part 3.',
    ], { fontSize: 13, lineSpacingMultiple: 1.3 });
    footer(s);
  }

  // ===== 10. SETUP: TEAM =====
  {
    const s = newSlide();
    header(s, 'Part 3 — Tenant and Admin Setup', 'The RACSI Team for This Program', { size: 24, titleColor: C });
    tableSlide(s, ['Name', 'RACSI Code', 'Role'], t.setup.team, { colW: [3.4, 1.8, 6.9], y: 2.4, fontSize: 12, headFill: C });
    footer(s);
  }

  // ===== 11. SETUP: STEPS =====
  {
    const s = newSlide();
    header(s, 'Part 3 — Tenant and Admin Setup', 'Creating the CM Project', { size: 24, titleColor: C });
    let y = 2.25;
    t.setup.steps.forEach((step, i) => {
      card(s, 0.6, y, 12.1, 0.95, { fill: i % 2 === 0 ? MINT : WHITE, shadow: false });
      s.addText(String(i + 1), { x: 0.8, y: y + 0.18, w: 0.5, h: 0.6, fontFace: FONT, fontSize: 20, bold: true, color: C });
      s.addText(step, { x: 1.5, y: y + 0.08, w: 11.0, h: 0.8, fontFace: FONT, fontSize: 12, color: INK, valign: 'middle', lineSpacingMultiple: 1.2 });
      y += 1.08;
    });
    footer(s);
  }

  // ===== 12. SETUP: CHARTERS =====
  {
    const s = newSlide();
    header(s, 'Part 3 — Tenant and Admin Setup', 'Charters for This Program', { size: 24, titleColor: C });
    tableSlide(s, ['Charter', 'Accountable', 'Review Cadence'], t.setup.charters, { colW: [5.5, 3.5, 3.1], y: 2.4, fontSize: 12, headFill: C });
    footer(s);
  }

  // ===== 13. SETUP: CHECKLIST =====
  {
    const s = newSlide();
    header(s, 'Part 3 — Tenant and Admin Setup', 'Setup Checklist', { size: 24, titleColor: C });
    let y = 2.3;
    t.setup.checklist.forEach((item) => {
      s.addShape('roundRect', { x: 0.6, y: y + 0.05, w: 0.32, h: 0.32, rectRadius: 0.06, fill: { color: MINT }, line: { color: C, width: 1.5 } });
      s.addImage({ path: path.join(__dirname, 'assets', 'check.png'), x: 0.66, y: y + 0.11, w: 0.2, h: 0.2 });
      s.addText(item, { x: 1.1, y, w: 11.6, h: 0.55, fontFace: FONT, fontSize: 13, color: INK, valign: 'middle' });
      y += 0.62;
    });
    footer(s);
  }

  // ===== 14. PART 4 INTRO =====
  {
    const s = newSlide();
    header(s, 'Part 4 — Week-by-Week Timeline', `${t.phases.length} Phases, In Order`, { size: 22, titleColor: C });
    const phaseNames = t.phases.map((p) => p.name);
    phaseFlow(s, 0.6, 2.3, 12.1, phaseNames, C);
    s.addText(`Total program length: ${t.weeksLabel}. Every phase below is walked in detail across the next slides — normal flow first, then six exceptions in full operational detail.`, { x: 0.6, y: 5.7, w: 12.1, h: 0.8, fontFace: FONT, fontSize: 12.5, italic: true, color: MUTED, lineSpacingMultiple: 1.25 });
    footer(s);
  }

  // ===== 15+. PHASES (3 slides each) =====
  t.phases.forEach((p, i) => {
    // A: divider/narrative
    {
      const s = newSlide(C);
      s.addText(`PHASE ${i + 1} OF ${t.phases.length}`, { x: 0.6, y: 0.5, w: 10, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: WHITE, charSpacing: 2 });
      s.addText(p.name, { x: 0.6, y: 0.95, w: 12, h: 0.9, fontFace: FONT, fontSize: 30, bold: true, color: WHITE });
      s.addText(p.weeks, { x: 0.6, y: 1.75, w: 12, h: 0.4, fontFace: FONT, fontSize: 15, italic: true, color: 'F0F0F0' });
      card(s, 0.6, 2.5, 12.1, 3.7, { fill: WHITE, shadow: false });
      s.addText('NARRATIVE', { x: 0.85, y: 2.7, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: C, charSpacing: 1 });
      s.addText(p.narrative, { x: 0.85, y: 3.05, w: 11.6, h: 3.0, fontFace: FONT, fontSize: 15, color: INK, lineSpacingMultiple: 1.4 });
      footer(s, true);
    }
    // B: key moments table
    {
      const s = newSlide();
      header(s, `Phase ${i + 1} · ${p.name}`, 'Key Moments in This Phase', { size: 22, titleColor: C });
      tableSlide(s, ['Week', 'What Happens'], p.keyMoments, { colW: [2.0, 10.1], y: 2.3, fontSize: 12.5, headFill: C });
      footer(s);
    }
    // C: framework snapshot
    {
      const wbsRow = t.wbs[i] || ['', '', '', '', '', ''];
      const s = newSlide();
      header(s, `Phase ${i + 1} · ${p.name}`, 'Framework Snapshot', { size: 22, titleColor: C });
      const labels = ['Lewin', 'ADKAR', 'Bridges', 'Kübler-Ross'];
      const colors = [TEAL, ORANGE, BLUE, PURPLE];
      let x = 0.6;
      const w = 2.92;
      labels.forEach((lbl, li) => {
        card(s, x, 2.4, w, 2.4, { fill: MINT });
        s.addText(lbl.toUpperCase(), { x: x + 0.15, y: 2.55, w: w - 0.3, h: 0.35, fontFace: FONT, fontSize: 11, bold: true, color: colors[li], charSpacing: 1 });
        s.addText(wbsRow[li + 2] || '—', { x: x + 0.15, y: 3.0, w: w - 0.3, h: 1.6, fontFace: FONT, fontSize: 13, bold: true, color: INK, lineSpacingMultiple: 1.2 });
        x += w + 0.15;
      });
      const techRow = t.techniques[i] || ['', '', '', '', ''];
      card(s, 0.6, 5.1, 12.1, 1.5, { fill: WHITE, shadow: false });
      s.addText('KEY TECHNIQUE THIS PHASE', { x: 0.85, y: 5.25, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: ORANGE, charSpacing: 1 });
      s.addText([{ text: (techRow[2] || '') + ': ', options: { bold: true, color: C } }, { text: techRow[3] || '', options: { color: INK } }], { x: 0.85, y: 5.58, w: 11.6, h: 0.9, fontFace: FONT, fontSize: 12.5, lineSpacingMultiple: 1.25 });
      footer(s);
    }
  });

  // ===== WBS & GANTT (2 slides) =====
  {
    const s = newSlide();
    header(s, 'Part 4 — Master WBS & Gantt', 'Every Phase, Across the Four Frameworks', { size: 22, titleColor: C });
    tableSlide(s, ['Phase', 'Week(s)', 'Lewin', 'ADKAR', 'Bridges', 'Kübler-Ross'], t.wbs, { colW: [3.1, 1.7, 1.9, 1.9, 1.7, 1.8], y: 2.3, fontSize: 10 });
    footer(s);
  }
  {
    const s = newSlide();
    header(s, 'Part 4 — Master WBS & Gantt', 'Every Phase, Techniques and Tools', { size: 22, titleColor: C });
    tableSlide(s, ['Phase', 'Week(s)', 'Technique', 'Goal', 'Tool'], t.techniques, { colW: [2.6, 1.4, 2.6, 3.6, 2.0], y: 2.3, fontSize: 9.8 });
    footer(s);
  }

  // ===== EXCEPTIONS (6 slides) =====
  {
    const s = newSlide(C);
    s.addText('PART 4 — SIX EXCEPTIONS, IN DETAIL', { x: 0.6, y: 2.6, w: 12.1, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: 'F0F0F0', charSpacing: 2, align: 'center' });
    s.addText(t.alerts.fires.length ? 'Six Realistic Ways This Program Could Have Gone Differently' : 'Six Realistic Contingencies — None of Which Actually Occurred', { x: 0.6, y: 3.1, w: 12.1, h: 1.0, fontFace: FONT, fontSize: 26, bold: true, color: WHITE, align: 'center' });
    footer(s, true);
  }
  t.exceptions.forEach((e) => {
    const s = newSlide();
    header(s, `${e.id} · ${e.phase}`, e.title, { size: 19, titleColor: C });
    s.addText('DESCRIPTION', { x: 0.6, y: 2.1, w: 5.75, h: 0.28, fontFace: FONT, fontSize: 10, bold: true, color: ORANGE, charSpacing: 1 });
    s.addText(e.desc, { x: 0.6, y: 2.4, w: 5.75, h: 1.9, fontFace: FONT, fontSize: 10.8, color: INK, lineSpacingMultiple: 1.2 });
    s.addText('TRIGGER', { x: 0.6, y: 4.35, w: 5.75, h: 0.28, fontFace: FONT, fontSize: 10, bold: true, color: ORANGE, charSpacing: 1 });
    s.addText(e.trigger, { x: 0.6, y: 4.65, w: 5.75, h: 0.9, fontFace: FONT, fontSize: 10.8, color: INK, lineSpacingMultiple: 1.2 });
    s.addText('TIMELINE IMPACT', { x: 6.7, y: 2.1, w: 6.0, h: 0.28, fontFace: FONT, fontSize: 10, bold: true, color: ORANGE, charSpacing: 1 });
    s.addText(e.timeline, { x: 6.7, y: 2.4, w: 6.0, h: 1.0, fontFace: FONT, fontSize: 10.8, color: INK, lineSpacingMultiple: 1.2 });
    s.addText('RECOVERY TASKS', { x: 6.7, y: 3.5, w: 6.0, h: 0.28, fontFace: FONT, fontSize: 10, bold: true, color: ORANGE, charSpacing: 1 });
    s.addText(e.recovery, { x: 6.7, y: 3.8, w: 6.0, h: 1.3, fontFace: FONT, fontSize: 10.5, color: INK, lineSpacingMultiple: 1.18 });
    card(s, 0.6, 5.65, 12.1, 1.05, { fill: MINT, shadow: false });
    s.addText([{ text: 'OUTPUTS: ', options: { bold: true, color: C } }, { text: e.outputs + '   ', options: { color: INK } }, { text: 'RACSI: ', options: { bold: true, color: C } }, { text: e.racsi, options: { color: INK } }], { x: 0.85, y: 5.78, w: 11.6, h: 0.8, fontFace: FONT, fontSize: 10.2, lineSpacingMultiple: 1.2, valign: 'top' });
    footer(s);
  });

  // ===== TRAINING (intro + 3 tiers + closing) =====
  {
    const s = newSlide();
    header(s, 'Part 5 — Training Program', 'What This Training Covers', { size: 24, titleColor: C });
    card(s, 0.6, 2.2, 12.1, 3.2, { fill: MINT, shadow: false });
    s.addText(t.training.intro, { x: 0.9, y: 2.5, w: 11.5, h: 2.6, fontFace: FONT, fontSize: 14.5, color: INK, lineSpacingMultiple: 1.35 });
    footer(s);
  }
  t.training.tiers.forEach((tier, i) => {
    const s = newSlide();
    header(s, `Part 5 · Tier ${i + 1} of 3`, tier.name, { size: 23, titleColor: C,
      sub: `Cohort: ${tier.cohort}  ·  ${tier.weeks}` });
    tableSlide(s, ['Curriculum Entry', 'Content Focus'], tier.rows, { colW: [4.5, 7.6], y: 2.6, fontSize: 11.5, headFill: C });
    footer(s);
  });
  {
    const s = newSlide();
    header(s, 'Part 5 — Training Program', 'Why This Curriculum Is Shaped This Way', { size: 22, titleColor: C });
    card(s, 0.6, 2.2, 12.1, 3.2, { fill: WHITE });
    s.addText(t.training.closing, { x: 0.9, y: 2.5, w: 11.5, h: 2.6, fontFace: FONT, fontSize: 14, italic: true, color: INK, lineSpacingMultiple: 1.35 });
    footer(s);
  }

  // ===== MODULE USAGE =====
  {
    const s = newSlide();
    header(s, 'Cross-Reference', 'Which journi Modules Dominate This Archetype', { size: 22, titleColor: C });
    let y = 2.25;
    for (const [mod, note] of t.moduleUsage) {
      card(s, 0.6, y, 12.1, 0.78, { fill: MINT, shadow: false });
      s.addText(mod, { x: 0.85, y: y + 0.08, w: 3.3, h: 0.62, fontFace: FONT, fontSize: 12, bold: true, color: C, valign: 'middle', lineSpacingMultiple: 1.1 });
      s.addText(note, { x: 4.25, y: y + 0.08, w: 8.25, h: 0.62, fontFace: FONT, fontSize: 11, color: INK, valign: 'middle', lineSpacingMultiple: 1.15 });
      y += 0.86;
    }
    footer(s);
  }

  // ===== ALERTS (2 slides) =====
  {
    const s = newSlide(C);
    s.addText('ALERTS & PROOF', { x: 0.6, y: 0.5, w: 11, h: 0.35, fontFace: FONT, fontSize: 12.5, bold: true, color: WHITE, charSpacing: 2 });
    s.addText(t.alerts.fires.length ? 'What This Case Fires' : 'What This Case Proves By Not Firing', { x: 0.6, y: 0.88, w: 12, h: 0.85, fontFace: FONT, fontSize: 27, bold: true, color: WHITE });
    card(s, 0.6, 2.1, 12.1, 1.9, { fill: WHITE, shadow: false });
    if (t.alerts.fires.length) {
      s.addText('ALERTS THIS CASE EXERCISES', { x: 0.85, y: 2.3, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: C, charSpacing: 1 });
      s.addText(t.alerts.fires.join('\n'), { x: 0.85, y: 2.65, w: 11.6, h: 1.2, fontFace: FONT, fontSize: 14, bold: true, color: INK, lineSpacingMultiple: 1.35 });
    } else {
      s.addText('NO LIVE ALERT FIRES IN THIS PROGRAM\'S REAL RECORD', { x: 0.85, y: 2.3, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: C, charSpacing: 1 });
      s.addText('Stated plainly, not manufactured — a clean record reported as a clean record.', { x: 0.85, y: 2.65, w: 11.6, h: 1.2, fontFace: FONT, fontSize: 14, bold: true, color: INK, lineSpacingMultiple: 1.35 });
    }
    card(s, 0.6, 4.2, 12.1, 2.5, { fill: WHITE, shadow: false });
    s.addText('WHY', { x: 0.85, y: 4.35, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 10.5, bold: true, color: C, charSpacing: 1 });
    s.addText(t.alerts.note, { x: 0.85, y: 4.68, w: 11.6, h: 1.9, fontFace: FONT, fontSize: 13, color: INK, lineSpacingMultiple: 1.3 });
    footer(s, true);
  }
  {
    const s = newSlide();
    header(s, 'Key Takeaways', 'What to Remember About This Archetype', { size: 24, titleColor: C });
    bullets(s, 0.6, 2.3, 12.1, 3.5, [
      t.execSummary.proof,
      t.frameworks.weighting,
      t.alerts.note,
    ], { fontSize: 13.5, lineSpacingMultiple: 1.4 });
    footer(s);
  }

  // ===== CLOSING =====
  {
    const s = newSlide(TEAL_DEEP);
    iconCircle(s, { x: 0.75, y: 2.2, d: 0.85, bg: ORANGE, icon: t.icon, pad: 0.18 });
    s.addText(t.name, { x: 0.7, y: 3.2, w: 11.2, h: 0.8, fontFace: FONT, fontSize: 30, bold: true, color: WHITE });
    s.addText(t.caseName, { x: 0.75, y: 4.0, w: 10.8, h: 0.5, fontFace: FONT, fontSize: 16, italic: true, color: 'B8D4CE' });
    s.addText('Manufacturing Sector · Bouregreg Group Scenario Library · Confidential', { x: 0.75, y: 6.75, w: 10, h: 0.4, fontFace: FONT, fontSize: 11.5, color: '7FA39A' });
  }

  return pptx;
}

module.exports = { buildDeck };
