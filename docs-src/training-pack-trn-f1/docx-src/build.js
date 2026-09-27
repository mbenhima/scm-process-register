const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, PageBreak, TableOfContents,
  LevelFormat, convertInchesToTwip, Header, Footer, PageNumber, VerticalAlign,
  NumberFormat, Bookmark,
} = require('docx');

const TEAL_DEEP = '15423A';
const TEAL = '1F6459';
const MINT = 'EAF2EF';
const ORANGE = 'C2661C';
const ORANGE_LIGHT = 'F7E4D2';
const INK = '16221F';
const MUTED = '5C6D68';
const WHITE = 'FFFFFF';

const FONT = 'Calibri';

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, color: TEAL_DEEP, size: 32, font: FONT })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, color: TEAL, size: 26, font: FONT })] });
}
function h3(text, color = ORANGE) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, color, size: 22, font: FONT })] });
}
function body(text, opts = {}) {
  return new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text, font: FONT, size: 22, color: INK, ...opts })] });
}
function bodyRuns(runs, opts = {}) {
  return new Paragraph({ spacing: { after: 160 }, children: runs.map((r) => new TextRun({ font: FONT, size: 22, color: INK, ...r })) , ...opts});
}
function bullet(text, level = 0) {
  return new Paragraph({ numbering: { reference: 'bullets', level }, spacing: { after: 100 },
    children: [new TextRun({ text, font: FONT, size: 22, color: INK })] });
}
function numbered(text, ref = 'numbers') {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 100 },
    children: [new TextRun({ text, font: FONT, size: 22, color: INK })] });
}
function calloutBox(title, text, opts = {}) {
  const { fill = MINT, titleColor = ORANGE } = opts;
  return new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: [9350],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: fill }, bottom: { style: BorderStyle.SINGLE, size: 2, color: fill },
      left: { style: BorderStyle.SINGLE, size: 2, color: fill }, right: { style: BorderStyle.SINGLE, size: 2, color: fill },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9350, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill },
      margins: { top: 160, bottom: 160, left: 200, right: 200 },
      children: [
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: title.toUpperCase(), bold: true, color: titleColor, size: 19, font: FONT })] }),
        ...text.split('\n').map((t) => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: t, font: FONT, size: 21, color: INK })] })),
      ],
    })] })],
  });
}
function specTable(rows) {
  return new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: [3115, 6235],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'DBE6E3' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DBE6E3' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'DBE6E3' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'DBE6E3' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'DBE6E3' }, insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'DBE6E3' },
    },
    rows: rows.map(([k, v], i) => new TableRow({ children: [
      new TableCell({ width: { size: 3115, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: i === 0 ? TEAL_DEEP : MINT },
        verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 150, right: 150 },
        children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, font: FONT, size: 21, color: i === 0 ? WHITE : TEAL_DEEP })] })] }),
      new TableCell({ width: { size: 6235, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: i === 0 ? TEAL_DEEP : WHITE },
        verticalAlign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 150, right: 150 },
        children: [new Paragraph({ children: [new TextRun({ text: v, font: FONT, size: 21, color: i === 0 ? WHITE : INK })] })] }),
    ] })),
  });
}
function spacer(h = 200) { return new Paragraph({ spacing: { after: h }, children: [] }); }

// =====================================================================
// CONTENT DATA (mirrors docs-src/curriculum-deck/deck.js TRN-F1)
// =====================================================================
const halfDays = [
  {
    label: 'Day 1 · AM', theme: 'Why Change Management, Why journi',
    sessions: [
      ['The human side of transformation — the ~70% stat, root causes, the 4 frameworks at a glance', 75,
        'Open with a show of hands: who has lived through a change effort that "failed" even though the system worked fine? Use their answers to introduce the ~70% stat, then walk the 4-framework quick-reference (ADKAR, Kotter, Lewin, Bridges/Kübler-Ross) before opening journi.'],
      ['Platform tour — scope switcher, Sidebar sections, multilingual UI (EN/FR/AR)', 45,
        'Run this as a live projected walkthrough in the seeded Atlas Industrial Group demo tenant. Have participants follow along on their own laptop rather than just watching.'],
    ],
    quiz: { id: 'QZ-F1-1', topic: 'Framework definitions + platform navigation', items: 8 },
    workshop: {
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
    },
  },
  {
    label: 'Day 1 · PM', theme: 'The Process Backbone & Governed AI',
    sessions: [
      ['Macro Processes, SIPOC & RACSI — the 10 macro processes, E2E registry, reading a RACSI grid', 60,
        'Project a real RACSI grid from the seeded scenario and cold-call participants to identify who is "Accountable" vs. "Responsible" on two different rows — this is the single most commonly confused pair of role codes.'],
      ['OBS and the AI Use Case Library — resourcing roster vs. RBAC users; Assistive vs. Augmented tiers', 60,
        "Emphasize this distinction early: it recurs in every later module. Memory hook — 'Assistive suggests, Augmented drafts, Autonomous decides — and journi never ships the third one.'"],
    ],
    quiz: { id: 'QZ-F1-2', topic: 'RACSI role codes + AI tier definitions', items: 8 },
    workshop: {
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
    },
  },
  {
    label: 'Day 2 · AM', theme: 'Reading the Program Layer',
    sessions: [
      ['Initiative Registry & CM Charters — how a program is registered and chartered, reading (not yet editing) a charter', 60,
        "Stress the phrase 'justified-change pattern' — every macro-state change in journi requires a written justification, which is a governance habit worth calling out explicitly here."],
      ['WBS, Gantt & Phase Gates at a glance — reading a program\'s schedule and phase-gate status', 45,
        'Use a real Gantt view with one deliberately late task to demonstrate a schedule gap live, then walk straight into the linked Phase Gate to show the two are connected.'],
    ],
    quiz: { id: 'QZ-F1-3', topic: 'Program layer terms', items: 8 },
    workshop: {
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
    },
  },
  {
    label: 'Day 2 · PM', theme: 'Metrics, Dashboards & the Field Notebook',
    sessions: [
      ['Metrics & Analytics Dashboard — reading the ADKAR heatmap and adoption curve (reference-only at this level)', 45,
        "Pull up a project whose ADKAR heatmap has a clearly weak block and ask participants to name it before you point it out — this builds the reading habit faster than lecturing it."],
      ['Field Notes — the practitioner\'s scratchpad, and the multilingual UI (EN/FR/AR)', 45,
        "Give a concrete contrast: 'I noticed the sponsor seemed disengaged in today's meeting' is a Field Note. 'Sponsor visibility risk, likelihood 3/5, impact 4/5, owner: PMO' is a Risk Register entry. Same observation, different destination."],
    ],
    quiz: { id: 'QZ-F1-4', topic: 'Dashboard reading + Field Notes scope', items: 8 },
    workshop: {
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
    },
  },
];

// =====================================================================
// BUILD DOCUMENT
// =====================================================================
const children = [];

// --- Cover page ---
children.push(
  new Paragraph({ spacing: { before: 2400, after: 200 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: 'FOUNDATION · TRN-F1', bold: true, color: ORANGE, size: 22, font: FONT })] }),
  new Paragraph({ spacing: { after: 200 },
    children: [new TextRun({ text: 'Facilitator Guide', bold: true, color: TEAL_DEEP, size: 56, font: FONT })] }),
  new Paragraph({ spacing: { after: 100 },
    children: [new TextRun({ text: 'Change Management Foundations & the journi Platform', bold: true, color: TEAL, size: 32, font: FONT })] }),
  new Paragraph({ spacing: { after: 600 },
    children: [new TextRun({ text: '2 days · 4 half-days · 4 quizzes · 4 workshops · 1 training exam', italics: true, color: MUTED, size: 24, font: FONT })] }),
  spacer(1600),
  new Paragraph({ spacing: { after: 100 },
    children: [new TextRun({ text: 'journi Academy', bold: true, color: INK, size: 22, font: FONT })] }),
  new Paragraph({ spacing: { after: 100 },
    children: [new TextRun({ text: 'Prepared for POWERACT Consulting', color: MUTED, size: 22, font: FONT })] }),
  new Paragraph({ children: [new TextRun({ text: 'Confidential', color: MUTED, size: 22, italics: true, font: FONT })] }),
  new Paragraph({ children: [new PageBreak()] }),
);

// --- TOC ---
children.push(
  h1('Contents'),
  new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-3' }),
  new Paragraph({ children: [new PageBreak()] }),
);

// --- Training Overview ---
children.push(
  h1('1. Training Overview'),
  specTable([
    ['Field', 'Value'],
    ['Training ID', 'TRN-F1'],
    ['Name', 'Change Management Foundations & the journi Platform'],
    ['Level', 'Foundation (LVL-F)'],
    ['Prerequisite', 'None — this is the entry training for the Foundation level'],
    ['Duration', '2 days (4 half-days)'],
    ['Target audience', 'New Change Managers, HR Business Partners, PMO members, People Managers — no prior journi experience required'],
    ['Training exam', 'EXM-F1 — 40 MCQ + 2 short-answer, 75 min, pass mark 75%'],
  ]),
  spacer(),
  h2('Goals'),
  bullet('Explain why ~70% of transformations fail on the human side and how ADKAR, Kotter, Lewin and Bridges/Kübler-Ross address it'),
  bullet("Navigate journi's tenant hierarchy (Group / Organization / Project) and role-based access"),
  bullet('Read the Organizational Breakdown Structure (OBS) and the Macro Process / SIPOC / RACSI registry'),
  bullet('Explain the Assistive / Augmented AI governance model and why Autonomous AI is out of scope'),
  spacer(),
  h2('Golden Rule'),
  body('Every half-day pairs exactly one formative quiz with one hands-on workshop: content is taught, immediately checked (quiz), then immediately applied (workshop), then debriefed. No half-day skips either half of that pairing.'),
  spacer(),
  h2('Agenda at a Glance'),
  specTable([
    ['Half-Day', 'Theme'],
    ...halfDays.map((hd) => [hd.label, hd.theme]),
  ]),
);

// --- Delivery Logistics ---
children.push(
  h1('2. Delivery Logistics'),
  h2('Cohort & Environment'),
  bullet('Cap at 12 participants per journi environment so every workshop step is individually completable, not just observed.'),
  bullet('Each cohort gets its own seeded Windows-installed journi instance (Atlas Industrial Group demo tenant); run "Reset Demo Data" between cohorts, never mid-cohort.'),
  bullet('One lead facilitator per cohort is sufficient for TRN-F1 (no second facilitator required, unlike the Advanced capstone).'),
  bullet('Half-days run 3.5–4 hours including breaks; the golden-rule blocks (content → quiz → workshop → debrief) are not compressible.'),
  spacer(),
  h2('Materials Checklist'),
  bullet('Projector / screen-share for the instructional slide deck (TRN-F1_Training_Slides.pptx)'),
  bullet('One journi demo environment per participant, freshly reset'),
  bullet('Printed or digital copy of the Quiz Bank (Excel workbook) — facilitator use only, do not distribute the answer key'),
  bullet('Manufacturing-client scenario brief (1-pager) for the Day 1 workshops'),
  bullet('Workshop Checklist tab of the Excel workbook, one copy per cohort, to track completion'),
);

// --- Per half-day sections ---
halfDays.forEach((hd, idx) => {
  children.push(h1(`${3 + idx}. ${hd.label} — ${hd.theme}`));

  children.push(h2('Session Plan'));
  children.push(specTable([
    ['Session', 'Duration'],
    ...hd.sessions.map((s) => [s[0], `${s[1]} min`]),
  ]));
  children.push(spacer());
  hd.sessions.forEach((s) => {
    children.push(h3(s[0].split(' — ')[0]));
    children.push(calloutBox('Facilitator Note', s[2]));
    children.push(spacer());
  });

  children.push(h2(`Quiz ${hd.quiz.id} — ${hd.quiz.topic}`));
  children.push(specTable([
    ['Format', `${hd.quiz.items} MCQ, closed-book, 15 min`],
    ['Pass mark', 'Formative only — no pass mark'],
    ['Answer key', 'Quiz Bank tab of TRN-F1_Training_Pack.xlsx'],
  ]));
  children.push(body('Read each question aloud or project it; do not distribute the answer key beforehand. Debrief any missed items in under 2 minutes before moving into the workshop.', { italics: true, color: MUTED }));
  children.push(spacer());

  const ws = hd.workshop;
  children.push(h2(`Workshop ${ws.id} — ${ws.name} (${ws.duration} min)`));
  children.push(h3('Goals', TEAL));
  ws.goals.forEach((g) => children.push(bullet(g)));
  children.push(h3('Materials Needed', TEAL));
  children.push(body(ws.materials));
  children.push(h3('Facilitation Steps', TEAL));
  ws.agenda.forEach((a) => children.push(numbered(a, `numbers-${ws.id}`)));
  children.push(calloutBox('Debrief', ws.debrief, { fill: ORANGE_LIGHT, titleColor: ORANGE }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
});

// --- Assessment ---
children.push(
  h1('7. Training Exam — EXM-F1'),
  specTable([
    ['Format', '40 MCQ + 2 short-answer'],
    ['Duration', '75 minutes'],
    ['Pass mark', '75%'],
    ['Retake policy', 'One free retake after a 48-hour review period'],
  ]),
  spacer(),
  h2('Scope'),
  bullet('Drawn from all 4 half-day quizzes: framework definitions, RACSI + AI tiers, program-layer terms, dashboard reading + Field Notes scope.'),
  bullet('The 2 short-answer questions ask participants to justify a governance decision in writing (e.g. why a Phase Gate needs an independent Accountable role).'),
  bullet('Passing EXM-F1 is one of three training exams required before the Foundation Level Exam (EXM-LVL-F).'),
  spacer(),
  h2('Administering the Exam'),
  bullet('Distribute the exam only after all 4 workshops are complete.'),
  bullet('Closed-book, closed-device except the live journi environment where a question explicitly requires it.'),
  bullet('Score using the Exam Blueprint tab of the Excel workbook; record results in the cohort tracker.'),
  spacer(),
  h2('Next Training'),
  body('TRN-F2 — Individual & Emotional Readiness: ADKAR and the Human Journey. Open TRN-F2 with a 10-minute recap addressing whichever journi screen this cohort flagged as least confident at the close of TRN-F1.'),
);

const doc = new Document({
  features: { updateFields: true },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }] },
      ...halfDays.map((hd) => ({ reference: `numbers-${hd.workshop.id}`,
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }] })),
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: 'TRN-F1 Facilitator Guide — journi Academy', color: MUTED, size: 16, font: FONT })] })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], color: MUTED, size: 16, font: FONT })] })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, '..', 'TRN-F1_Facilitator_Guide.docx');
  fs.writeFileSync(out, buf);
  console.log('wrote', out);
});
