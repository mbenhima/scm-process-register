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
  s.addText('journi — Human Change Management Curriculum', {
    x: 0.6, y: 7.14, w: 8, h: 0.3, fontFace: FONT, fontSize: 9,
    color: dark ? 'CFE3DD' : MUTED, align: 'left',
  });
  s.addText(String(pageN).padStart(2, '0'), {
    x: 12.2, y: 7.14, w: 0.55, h: 0.3, fontFace: FONT, fontSize: 9,
    color: dark ? 'CFE3DD' : MUTED, align: 'right',
  });
}
function header(s, kicker, title, opts = {}) {
  const { size = 26, sub = null, kickerColor = ORANGE, titleColor = TEAL_DEEP, titleW = 12.1 } = opts;
  s.addText(kicker.toUpperCase(), {
    x: 0.6, y: 0.35, w: 11, h: 0.32, fontFace: FONT, fontSize: 12, bold: true,
    color: kickerColor, charSpacing: 2,
  });
  s.addText(title, {
    x: 0.6, y: 0.68, w: titleW, h: 0.85, fontFace: FONT, fontSize: size, bold: true,
    color: titleColor, valign: 'top', lineSpacingMultiple: 1.02,
  });
  let top = 1.65;
  if (sub) {
    s.addText(sub, {
      x: 0.6, y: 1.55, w: 12.1, h: 0.42, fontFace: FONT, fontSize: 12.5, color: MUTED,
      valign: 'top', lineSpacingMultiple: 1.15,
    });
    top = 2.05;
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

// =====================================================================
// CURRICULUM DATA
// =====================================================================
const LEVELS = [
  {
    id: 'LVL-F', name: 'Foundation', color: TEAL, tint: MINT, icon: 'book-open',
    tagline: 'Change Management Foundations with journi',
    audience: 'New Change Managers, HR Business Partners, PMO members, People Managers — no prior journi experience required',
    outcome: 'Navigate journi with fluency, explain the 4 core frameworks, and read a project\'s stakeholder, ADKAR and emotional-readiness data correctly',
    days: 6,
    examId: 'EXM-LVL-F', examSpec: '80 MCQ (drawn from TRN-F1–F3) + 1 guided practical in journi · 4h · pass mark 80% · unlocks Practitioner enrollment',
    credential: 'journi Certified Change Practitioner — Foundation',
  },
  {
    id: 'LVL-P', name: 'Practitioner', color: TEAL_DEEP, tint: MINT2, icon: 'chalkboard-user',
    tagline: 'Running a Change Program in journi',
    audience: 'Assigned or certified Change Managers who will own a real Change Management Project end-to-end. Prerequisite: Foundation credential.',
    outcome: 'Govern a program from charter through Phase Gate decisions, manage training/resistance/coaching data, and operate governed AI safely',
    days: 6,
    examId: 'EXM-LVL-P', examSpec: '80 MCQ (drawn from TRN-P1–P3) + 1 integrated practical (Phase Gate + resistance pattern + AI activation decision) · 4.5h · pass mark 80% · unlocks Advanced enrollment',
    credential: 'journi Certified Change Practitioner — Practitioner',
  },
  {
    id: 'LVL-A', name: 'Advanced', color: ORANGE, tint: ORANGE_LIGHT, icon: 'medal',
    tagline: 'Leading Change Portfolios & Sustaining Impact',
    audience: 'Senior Change Managers, Change Management Leads, PMO Directors, Organization/Group Admins managing multiple concurrent initiatives. Prerequisite: Practitioner credential.',
    outcome: 'Report portfolio-level readiness to executives, administer platform governance, and lead a full transformation program end-to-end',
    days: 6,
    examId: 'EXM-LVL-A', examSpec: 'Capstone facilitator rubric (4 workshops, 25 pts each) + 60-MCQ integrative written exam (TRN-A1–A2) · pass: written ≥80% AND rubric ≥75/100',
    credential: 'journi Certified Change Management Practitioner — Advanced',
  },
];

function halfDay(label, theme, sessions, quiz, workshop) {
  return { label, theme, sessions, quiz, workshop };
}

const TRAININGS = [
  // ---------------- FOUNDATION ----------------
  {
    id: 'TRN-F1', level: 'LVL-F', icon: 'sitemap',
    name: 'Change Management Foundations & the journi Platform',
    goals: [
      'Explain why ~70% of transformations fail on the human side and how ADKAR, Kotter, Lewin and Bridges/Kübler-Ross address it',
      'Navigate journi\'s tenant hierarchy (Group / Organization / Project) and role-based access',
      'Read the Organizational Breakdown Structure (OBS) and the Macro Process / SIPOC / RACSI registry',
      'Explain the Assistive / Augmented AI governance model and why Autonomous AI is out of scope',
    ],
    audience: 'New Change Managers, HR Business Partners, PMO members, People Managers',
    halfDays: [
      halfDay('Day 1 · AM', 'Why Change Management, Why journi',
        [['The human side of transformation — the ~70% stat, root causes, the 4 frameworks at a glance', 75],
         ['Platform tour — scope switcher, Sidebar sections, multilingual UI (EN/FR/AR)', 45]],
        { id: 'QZ-F1-1', topic: 'Framework definitions + platform navigation', items: 8 },
        { id: 'WS-F1-1', name: 'Stand Up a Tenant', duration: 90,
          goals: ['Build a correct 4-level tenant hierarchy for a new client', 'Configure an Organization\'s default language'],
          agenda: ['Create a Group and an Organization for a new manufacturing client scenario', 'Register a Main Project and a linked Change Management Project', 'Set the Organization\'s Default Language and explain the precedence rule', 'Review the M2 user list and identify each seeded role\'s scope'] }),
      halfDay('Day 1 · PM', 'The Process Backbone & Governed AI',
        [['Macro Processes, SIPOC & RACSI — the 10 macro processes, E2E registry, reading a RACSI grid', 60],
         ['OBS and the AI Use Case Library — resourcing roster vs. RBAC users; Assistive vs. Augmented tiers', 60]],
        { id: 'QZ-F1-2', topic: 'RACSI role codes + AI tier definitions', items: 8 },
        { id: 'WS-F1-2', name: 'Read the Process Backbone', duration: 90,
          goals: ['Build an OBS roster and trace it into other modules', 'Correctly classify AI use cases by tier and checkpoint'],
          agenda: ['Build a 4-role OBS roster with a reporting chain for the scenario project', 'Trace one End-to-End process chain through its ordered Macro Processes', 'Review 3 AI Use Case Library entries and classify tier + human checkpoint', 'Identify which module each use case plugs into'] }),
      halfDay('Day 2 · AM', 'Reading the Program Layer',
        [['Initiative Registry & CM Charters — how a program is registered and chartered, reading (not yet editing) a charter', 60],
         ['WBS, Gantt & Phase Gates at a glance — reading a program\'s schedule and phase-gate status', 45]],
        { id: 'QZ-F1-3', topic: 'Program layer terms', items: 8 },
        { id: 'WS-F1-3', name: 'Read a Program\'s Status', duration: 90,
          goals: ['Read an Initiative Registry entry and its linked CM Charter', 'Interpret a WBS Gantt view and the current Phase Gate state'],
          agenda: ['Open a seeded Initiative Registry entry and its CM Charter, identify the Lewin macro-state and top charter action', 'Open the linked WBS/Gantt view and identify 2 tasks with a schedule gap', 'Identify the current Phase Gate status and who owns the next decision', 'Summarize the program\'s health in 3 bullet points'] }),
      halfDay('Day 2 · PM', 'Metrics, Dashboards & the Field Notebook',
        [['Metrics & Analytics Dashboard — reading the ADKAR heatmap and adoption curve (reference-only at this level)', 45],
         ['Field Notes — the practitioner\'s scratchpad, and the multilingual UI (EN/FR/AR)', 45]],
        { id: 'QZ-F1-4', topic: 'Dashboard reading + Field Notes scope', items: 8 },
        { id: 'WS-F1-4', name: 'Read a Dashboard, Log a Field Note', duration: 90,
          goals: ['Read a project\'s Metrics & Analytics Dashboard without editing it', 'Add a properly-scoped Field Note'],
          agenda: ['Open the Metrics & Analytics Dashboard for the seeded project and identify the ADKAR heatmap\'s weakest block', 'Identify the adoption curve\'s current trend', 'Add a Field Note capturing an observation from the review (not a structured record)', 'Explain why that observation belongs in Field Notes and not the Risk Register'] }),
    ],
    exam: { id: 'EXM-F1', format: '40 MCQ + 2 short-answer', duration: 75, passMark: 75 },
  },
  {
    id: 'TRN-F2', level: 'LVL-F', icon: 'chart-line',
    name: 'Individual & Emotional Readiness — ADKAR and the Human Journey',
    goals: [
      'Score and interpret the 5 ADKAR blocks with barrier diagnosis',
      'Map stakeholder impact / influence and identify high-impact / low-influence risk populations',
      'Read Bridges Transition and Kübler-Ross sentiment positions and recognize the Divergence Pattern',
      'Interpret the Journey Map as a synthesis of ADKAR, Bridges and Kübler-Ross',
    ],
    audience: 'Change Managers, People Managers / Coaches, Training Leads',
    halfDays: [
      halfDay('Day 3 · AM', 'Stakeholder Mapping & ADKAR',
        [['Stakeholder & Impact Mapping — 5-dimension scoring, influence, the High-Impact/Low-Influence flag', 60],
         ['ADKAR Engine — 5 blocks, barrier diagnosis, stalled-block escalation, the Desire-diagnosis AI coach', 60]],
        { id: 'QZ-F2-1', topic: 'ADKAR blocks + impact scoring', items: 8 },
        { id: 'WS-F2-1', name: 'Map and Score a Cohort', duration: 90,
          goals: ['Produce a correctly-flagged stakeholder map', 'Score and justify an ADKAR baseline'],
          agenda: ['Add a new stakeholder group to the seeded ERP scenario', 'Score its 5-dimension impact and influence', 'Confirm the High-Impact / Low-Influence flag fires correctly', 'Score and justify the cohort\'s ADKAR baseline across all 5 blocks'] }),
      halfDay('Day 3 · PM', 'Emotional Readiness & the Journey Map',
        [['Emotional & Transition Layer — Bridges position, Kübler-Ross sentiment inference, the Divergence Pattern', 60],
         ['Journey Map — reading the visual timeline, event types, organization-level zoom', 60]],
        { id: 'QZ-F2-2', topic: 'Bridges/Kübler-Ross + Divergence Pattern', items: 8 },
        { id: 'WS-F2-2', name: 'Diagnose a Divergence Case', duration: 90,
          goals: ['Recognize and respond to a Divergence Pattern', 'Add a justified Journey Map annotation'],
          agenda: ['Given strong Knowledge/Ability but an "Ending" Bridges read, confirm the Divergence Alert', 'Log a justified sentiment update citing specific evidence', 'Add an annotated Journey Map event for the diagnosis', 'Explain the recommended loss-focused response vs. more training'] }),
      halfDay('Day 4 · AM', 'Journeys & Touchpoints',
        [['Journeys & Analytics — the 8 seeded journeys, touchpoint completion, reference dashboards', 60],
         ['Sentiment & the AI Annotation Assistant — reading and accepting an AI-suggested journey annotation', 45]],
        { id: 'QZ-F2-3', topic: 'Journeys + AI annotation tier', items: 8 },
        { id: 'WS-F2-3', name: 'Read a Journey, Accept an AI Suggestion', duration: 90,
          goals: ['Read a journey\'s touchpoint-completion data', 'Correctly accept or edit an Assistive-tier AI suggestion'],
          agenda: ['Open a seeded journey and identify its touchpoint-completion percentage', 'Identify which touchpoint has the lowest completion', 'Use the Journey Map Annotation Assistant, accept the suggestion, edit it, and log the source annotation', 'Explain why this AI use case is Assistive, not Augmented'] }),
      halfDay('Day 4 · PM', 'Recognizing Resistance Early',
        [['Resistance Management — the type taxonomy, at recognition level (not yet coding it)', 45],
         ['Manager-as-Coach — the team-scoped view a People Manager sees, and how it links to ADKAR', 45]],
        { id: 'QZ-F2-4', topic: 'Resistance types + Manager-as-Coach view', items: 8 },
        { id: 'WS-F2-4', name: 'Recognize a Resistance Type', duration: 90,
          goals: ['Correctly identify a resistance type from a scenario description', 'Read a team-scoped Manager-as-Coach view'],
          agenda: ['Read 3 short resistance scenarios and classify each by type (recognition only, no logging)', 'Open the Manager-as-Coach team-scoped view for a seeded manager', 'Identify the team member with the lowest ADKAR score and the linked resistance entry', 'Explain the escalation path from "recognized" to "logged and coded" (bridge to TRN-P2)'] }),
    ],
    exam: { id: 'EXM-F2', format: '40 MCQ + 2 case-based scenarios', duration: 90, passMark: 75 },
  },
  {
    id: 'TRN-F3', level: 'LVL-F', icon: 'comments',
    name: 'Sponsorship, Communication & Risk Basics',
    goals: [
      'Track sponsor visibility and log sponsor actions',
      'Build a communication matrix and recognize saturation risk',
      'Log and score change risk distinct from generic project risk',
      'Use the Notification Center to monitor live alert conditions',
    ],
    audience: 'Change Managers, Communications Practitioners, PMO',
    halfDays: [
      halfDay('Day 5 · AM', 'Sponsor & Coalition, Communications',
        [['Sponsor & Coalition — visibility tracker, coalition roster, sponsor actions, the weak-visibility alert', 60],
         ['Communications — the message × audience × channel × timing matrix, saturation detection', 60]],
        { id: 'QZ-F3-1', topic: 'Sponsorship visibility + communication matrix', items: 8 },
        { id: 'WS-F3-1', name: 'Plan a Communication Wave', duration: 90,
          goals: ['Build a saturation-aware communication matrix', 'Log a sponsor action addressing a visibility gap'],
          agenda: ['Build a 3-message communication matrix for a target cohort', 'Run the Change Saturation Advisor AI use case and interpret its flag', 'Log a sponsor action addressing an identified visibility gap', 'Justify the linkage between each message and its ADKAR block'] }),
      halfDay('Day 5 · PM', 'Risk & the Notification Center',
        [['Change Risk Register — adoption/sponsorship/capacity/saturation categories, risk score, mitigation', 60],
         ['Notification Center — the 9 live alert conditions, dismiss/restore, tracing an alert to its module', 60]],
        { id: 'QZ-F3-2', topic: 'Risk categories + live alert conditions', items: 8 },
        { id: 'WS-F3-2', name: 'Close the Loop on a Risk', duration: 90,
          goals: ['Log and mitigate a change risk end-to-end', 'Correctly interpret and clear a live alert'],
          agenda: ['Log a saturation risk with likelihood/impact scoring', 'Add a mitigation action with an owner and due date', 'Verify the corresponding alert fires in the Notification Center', 'Dismiss the alert once mitigated and explain when Restore applies'] }),
      halfDay('Day 6 · AM', 'Training & Capability, at a Glance',
        [['Training & Capability — curriculum records, the trained-vs-capable distinction (reading level)', 45],
         ['The Codebook — how resistance and communication data get tagged consistently', 45]],
        { id: 'QZ-F3-3', topic: 'Training records + codebook', items: 8 },
        { id: 'WS-F3-3', name: 'Read a Curriculum Record', duration: 90,
          goals: ['Read a curriculum record and distinguish attendance from certified capability', 'Look up codebook tags used elsewhere in the platform'],
          agenda: ['Open a seeded curriculum record and identify completion % vs. certification status', 'Identify one trainee marked "attended" but not yet "capable" and explain the gap', 'Look up 2 tags in the organization\'s default Codebook and explain what each is used for', 'Explain why the distinction matters for go-live readiness'] }),
      halfDay('Day 6 · PM', 'Sustainment Basics',
        [['Reinforcement & Sustainment — the 30/60/90-day checkpoint cadence (recognition level)', 45],
         ['Putting It Together — reading a project\'s overall readiness across sponsor, comms, risk and training signals', 45]],
        { id: 'QZ-F3-4', topic: 'Sustainment cadence + readiness synthesis', items: 8 },
        { id: 'WS-F3-4', name: 'Assemble a Readiness Snapshot', duration: 90,
          goals: ['Read sustainment checkpoint status', 'Synthesize a one-page readiness snapshot across 4 signal types'],
          agenda: ['Open the sustainment checkpoint tracker and identify the next due checkpoint', 'Pull one signal each from sponsor visibility, communication saturation, risk register, and training completion', 'Draft a 4-line readiness snapshot combining all signals', 'Flag the single weakest signal and justify the flag in writing'] }),
    ],
    exam: { id: 'EXM-F3', format: '40 MCQ', duration: 90, passMark: 75 },
  },

  // ---------------- PRACTITIONER ----------------
  {
    id: 'TRN-P1', level: 'LVL-P', icon: 'route',
    name: 'Program Governance — Charters, WBS & Phase Gates',
    goals: [
      'Register and manage a Change Management Project and its Initiative Registry record',
      'Load a Phase Template and build a WBS spanning PM / CM / Framework tracks',
      'Record and interpret a Phase Gate Joint Decision',
      'Author and manage CM Charter definitions and their compliance log',
    ],
    audience: 'Change Managers, PMO / Program Managers (Foundation credential required)',
    halfDays: [
      halfDay('Day 1 · AM', 'Initiative Registry & Charters',
        [['Initiative Registry — metadata, Lewin macro-state, the justified-change pattern, Composite Readiness Index', 60],
         ['CM Charter Registry — the 8 charters, action mapping, compliance logging, Mentoring Progression reference', 60]],
        { id: 'QZ-P1-1', topic: 'Lewin phases + charter structure', items: 8 },
        { id: 'WS-P1-1', name: 'Register and Charter a New Initiative', duration: 90,
          goals: ['Correctly set up a governed CM Project record', 'Log charter-action compliance evidence'],
          agenda: ['Create a CM Project linked to a Main Project', 'Set its Lewin macro-state with a written justification', 'Log 2 charter-action compliance instances against CHTR-01 and CHTR-03', 'Compute the project\'s Composite Readiness Index by hand and verify it against the dashboard'] }),
      halfDay('Day 1 · PM', 'WBS, Gantt & Phase Gates',
        [['WBS & Gantt — 3 tracks, baseline vs. actual, schedule gap, Load Phase Template', 60],
         ['Phase Checklists & Phase Gates — checklist weighting, the Joint Decision Record, PM↔CM bridge', 60]],
        { id: 'QZ-P1-2', topic: 'WBS tracks + Phase Gate mechanics', items: 8 },
        { id: 'WS-P1-2', name: 'Run a Phase Gate', duration: 90,
          goals: ['Build a working WBS from a template', 'Record a defensible Phase Gate decision'],
          agenda: ['Load TPL-ERP-8 into a project\'s WBS from a chosen start date', 'Mark 2 tasks with actual dates to generate a schedule gap', 'Complete a weighted Phase Checklist', 'Record a Phase Gate Joint Decision naming an Accountable role, independent of either input\'s author'] }),
      halfDay('Day 2 · AM', 'Risk & Stakeholder Integration at Program Level',
        [['Change Risk Register — scoring, mitigation action plans, linking risk to Phase Gate readiness', 60],
         ['Stakeholder & Impact Mapping — refreshing the map at each Phase Gate', 45]],
        { id: 'QZ-P1-3', topic: 'Risk scoring + stakeholder refresh cadence', items: 8 },
        { id: 'WS-P1-3', name: 'Build a Mitigation Action Plan', duration: 90,
          goals: ['Score a change risk with a full mitigation plan', 'Link a risk to an upcoming Phase Gate decision'],
          agenda: ['Log a new change risk with a full 4-category score', 'Build a Mitigation Action Plan with at least 2 actions and owners', 'Link the risk to the upcoming Phase Gate decision', 'Refresh 2 stakeholder impact scores ahead of the gate'] }),
      halfDay('Day 2 · PM', 'Communications Planning for a Gate',
        [['Communications — building a wave plan timed to a Phase Gate decision', 60],
         ['Sponsor & Coalition — briefing the sponsor before a gate', 45]],
        { id: 'QZ-P1-4', topic: 'Communication wave planning + sponsor briefing', items: 8 },
        { id: 'WS-P1-4', name: 'Time a Communication Wave to a Gate', duration: 90,
          goals: ['Build a communication wave plan sequenced to a Phase Gate date', 'Log a sponsor briefing action ahead of a gate'],
          agenda: ['Build a 3-message communication wave ending 2 days before the Phase Gate', 'Check the wave against saturation risk', 'Log a sponsor briefing action ahead of the gate', 'Explain what changes in the communication plan if the gate decision is "hold"'] }),
    ],
    exam: { id: 'EXM-P1', format: '45 MCQ + 1 practical (record a Phase Gate end-to-end)', duration: 120, passMark: 75 },
  },
  {
    id: 'TRN-P2', level: 'LVL-P', icon: 'graduation-cap',
    name: 'Training, Resistance & Coaching',
    goals: [
      'Manage curriculum records and the trained-vs-capable distinction',
      'Log, classify and resolve resistance; use the Qualitative Coding Workbench',
      'Operate the Manager-as-Coach team-scoped view',
      'Apply the 3-stage Mentoring Progression model (Trainee → Observer → Autonomous)',
    ],
    audience: 'Change Managers, Trainers, People Managers / Coaches (Foundation credential required)',
    halfDays: [
      halfDay('Day 3 · AM', 'Training & Capability',
        [['Training & Capability Building — curriculum fields, completion vs. certification, the needs banner', 60],
         ['Mentoring Progression model — 3 stages, entry/exit criteria, the one-stage-back regression path', 60]],
        { id: 'QZ-P2-1', topic: 'Trained vs. capable + mentoring stages', items: 8 },
        { id: 'WS-P2-1', name: 'Build a Curriculum and Mentor a Trainee', duration: 90,
          goals: ['Distinguish attendance from demonstrated capability', 'Advance a mentee correctly through the 3-stage model'],
          agenda: ['Add a curriculum record and track completion percentage', 'Certify it with a justification distinct from completion', 'Move a mentee from Trainee to Observer with logged competency evidence', 'Explain the regression path if a critical error occurs at Observer stage'] }),
      halfDay('Day 3 · PM', 'Resistance & Coaching',
        [['Resistance Management — type classification, systemic-pattern detection, Coding Workbench', 60],
         ['Manager-as-Coach — team-scoped heatmap, manager readiness, coaching scripts', 60]],
        { id: 'QZ-P2-2', topic: 'Resistance types + coaching model', items: 8 },
        { id: 'WS-P2-2', name: 'Code a Pattern, Coach a Manager', duration: 90,
          goals: ['Surface a systemic resistance pattern', 'Log a justified manager-readiness update'],
          agenda: ['Log 2 systemic-type resistance entries to trigger the pattern-detection banner', 'Tag both entries against the organization\'s codebook', 'Cross-reference one tag to an existing resistance-log barrier', 'Log a manager-readiness rating with supporting justification'] }),
      halfDay('Day 4 · AM', 'Systemic Pattern Detection at Scale',
        [['Qualitative Coding Workbench — batch-coding a set of resistance entries, not just one', 60],
         ['Linking Resistance to Training Gaps — using the trained-vs-capable data to explain a resistance pattern', 45]],
        { id: 'QZ-P2-3', topic: 'Batch coding + resistance-training linkage', items: 8 },
        { id: 'WS-P2-3', name: 'Batch-Code a Resistance Set', duration: 90,
          goals: ['Code a batch of resistance entries consistently', 'Link a systemic pattern to a training gap'],
          agenda: ['Code 5 seeded resistance entries against the organization\'s Codebook', 'Confirm the systemic-pattern banner fires correctly', 'Cross-reference the pattern against the curriculum\'s completion data for the affected team', 'Recommend one training intervention with written justification'] }),
      halfDay('Day 4 · PM', 'Coaching a Team, Not Just a Manager',
        [['Manager-as-Coach at team scale — reading a full team heatmap and prioritizing coaching effort', 60],
         ['Mentoring Progression — advancing multiple mentees and handling a regression', 45]],
        { id: 'QZ-P2-4', topic: 'Team-scale coaching + mentee regression', items: 8 },
        { id: 'WS-P2-4', name: 'Prioritize and Coach a Team', duration: 90,
          goals: ['Prioritize coaching effort across a full team heatmap', 'Advance and regress mentees with logged justification'],
          agenda: ['Open the team-scoped Manager-as-Coach heatmap and rank 4 team members by coaching priority', 'Log a coaching script action for the top-priority member', 'Advance one mentee from Observer to Autonomous with logged evidence', 'Regress a different mentee from Observer to Trainee after a critical error, with a written justification'] }),
    ],
    exam: { id: 'EXM-P2', format: '40 MCQ + 1 case study', duration: 90, passMark: 75 },
  },
  {
    id: 'TRN-P3', level: 'LVL-P', icon: 'shield-halved',
    name: 'Governed AI in Change Management',
    goals: [
      'Operate the AI Use Case Library\'s activation / override model (organization vs. project)',
      'Apply the Assistive / Augmented tier discipline correctly to a new use case',
      'Review and audit the AI Usage Log',
      'Configure — safely — the optional Real LLM Provider Connection',
    ],
    audience: 'Change Managers, Organization Admins (Foundation credential required)',
    halfDays: [
      halfDay('Day 5 · AM', 'AI Governance Model',
        [['Tiers & catalog structure — Assistive vs. Augmented vs. out-of-scope Autonomous; prompt templates', 60],
         ['Activation & override — organization-level activation, project-level override, deactivation behavior', 60]],
        { id: 'QZ-P3-1', topic: 'AI tiers + activation model', items: 8 },
        { id: 'WS-P3-1', name: 'Govern a Use Case Rollout', duration: 90,
          goals: ['Activate use cases correctly at the right scope', 'Justify a project-level override'],
          agenda: ['Activate 3 AI use cases for an Organization', 'Override one use case off for a single sensitive project', 'Write a short justification note for the override', 'Explain what happens to prior AI-generated content on deactivation'] }),
      halfDay('Day 5 · PM', 'Usage Audit & Provider Connection',
        [['AI Usage Log — accepted / edited / rejected outcomes, what governance reporting looks for', 60],
         ['Real LLM Provider Connection — browser-local key storage, fallback behavior, when (not) to configure', 60]],
        { id: 'QZ-P3-2', topic: 'Usage audit + provider connection', items: 8 },
        { id: 'WS-P3-2', name: 'Audit and Decide', duration: 90,
          goals: ['Read a usage log for governance signal', 'Produce a short governance recommendation'],
          agenda: ['Review a sample AI Usage Log across several use cases', 'Identify the use case with the highest rejection rate', 'Draft a one-paragraph governance recommendation', 'State where the Real LLM Provider Connection\'s API key is (and is not) stored'] }),
      halfDay('Day 6 · AM', 'Governance at Scale — Conflicts & Escalation',
        [['Resolving activation conflicts — when an org-level activation meets a project-level override', 60],
         ['AI Use Case prompt templates — reading and safely adapting a template', 45]],
        { id: 'QZ-P3-3', topic: 'Activation conflicts + prompt templates', items: 8 },
        { id: 'WS-P3-3', name: 'Resolve an Activation Conflict', duration: 90,
          goals: ['Resolve a conflicting activation/override case', 'Safely adapt a prompt template without breaking governance'],
          agenda: ['Given an org-level activation and a conflicting project override, determine which wins and why', 'Document the resolution with a justification note', 'Open an AI Use Case prompt template and adapt it for a new scenario without changing its tier', 'Explain what would have to change to move this use case from Assistive to Augmented (and why it still can\'t become Autonomous)'] }),
      halfDay('Day 6 · PM', 'Operating the Real LLM Provider Connection',
        [['Key lifecycle — configuring, rotating and removing a Real LLM Provider key; browser-local storage implications', 45],
         ['Fallback behavior — what happens to AI suggestions when the connection is removed or fails', 45]],
        { id: 'QZ-P3-4', topic: 'Key lifecycle + fallback behavior', items: 8 },
        { id: 'WS-P3-4', name: 'Rotate a Provider Key and Verify Fallback', duration: 90,
          goals: ['Safely rotate a Real LLM Provider key', 'Verify correct fallback behavior when the connection is removed'],
          agenda: ['Configure a Real LLM Provider key for a test Organization', 'Rotate the key and confirm the old key no longer works', 'Remove the connection entirely and generate an AI suggestion, confirming fallback behavior', 'Explain, in writing, where the key was stored and why it never touches journi\'s server'] }),
    ],
    exam: { id: 'EXM-P3', format: '35 MCQ + 1 governance-memo exercise', duration: 90, passMark: 75 },
  },

  // ---------------- ADVANCED ----------------
  {
    id: 'TRN-A1', level: 'LVL-A', icon: 'chart-line',
    name: 'Portfolio Analytics, Benchmarking & Executive Reporting',
    goals: [
      'Roll up readiness at Project / Organization / Group level correctly per RBAC',
      'Interpret the Composite Readiness Index and phase-based benchmarking standing',
      'Use the Cross-Type Comparison Matrix to advise on a new transformation type',
      'Produce and review an AI-drafted Executive Readiness Narrative',
    ],
    audience: 'Senior Change Managers, Executive Viewers, PMO Directors (Practitioner credential required)',
    halfDays: [
      halfDay('Day 1 · AM', 'Analytics & Benchmarking',
        [['Metrics & Analytics Dashboard — roll-up levels, ADKAR heatmap, adoption curve, sentiment correlation', 60],
         ['Benchmarking tab — reference bands by Lewin phase, peer average, Behind / In Line / Ahead standing', 60]],
        { id: 'QZ-A1-1', topic: 'Roll-up levels + benchmarking standing', items: 8 },
        { id: 'WS-A1-1', name: 'Benchmark a Portfolio', duration: 90,
          goals: ['Correctly interpret readiness against a reference band', 'Export a defensible analytics artifact'],
          agenda: ['At Organization level, compare 3 seeded projects\' Readiness Index against their phase bands', 'Compare each against the peer average and record its standing', 'Identify the one project reading "Behind" and articulate why', 'Export the ADKAR heatmap to CSV'] }),
      halfDay('Day 1 · PM', 'Journeys, Touchpoints & Executive Narrative',
        [['Journeys, Touchpoints & Analytics — the 8 journeys, live DASH-01/02 metrics, reference-only dashboards', 60],
         ['Cross-Type Comparison Matrix + the Executive Readiness Narrative Generator AI use case', 60]],
        { id: 'QZ-A1-2', topic: 'Journey dashboards + cross-type matrix', items: 8 },
        { id: 'WS-A1-2', name: 'Brief the Steering Committee', duration: 90,
          goals: ['Compute a real touchpoint-completion metric', 'Produce an executive-ready narrative'],
          agenda: ['Compute JRN-01 touchpoint completion for a project', 'Generate an AI-drafted executive narrative and edit it for accuracy', 'Select the correct Cross-Type Matrix row to justify a timeline expectation', 'Present the 3 findings as a 5-minute mock briefing'] }),
      halfDay('Day 2 · AM', 'Group-Level Portfolio Rollups',
        [['Rolling up readiness at Group level across multiple Organizations', 60],
         ['Cross-Type Matrix — advising on 2 different transformation types in the same portfolio', 45]],
        { id: 'QZ-A1-3', topic: 'Group rollups + cross-type advising', items: 8 },
        { id: 'WS-A1-3', name: 'Roll Up a Group Portfolio', duration: 90,
          goals: ['Roll up readiness across multiple Organizations at Group level', 'Give cross-type-matrix-based advice for two different transformation types'],
          agenda: ['At Group level, roll up the Composite Readiness Index across 3 Organizations', 'Identify the weakest Organization and its phase-based benchmarking standing', 'For 2 different transformation types in the portfolio, pull the correct Cross-Type Matrix row for each', 'Draft one portfolio-level recommendation grounded in both readings'] }),
      halfDay('Day 2 · PM', 'Multi-Project Executive Briefing',
        [['Assembling a multi-project executive narrative — combining several AI-drafted narratives into one briefing', 60],
         ['Handling executive questions — defending a readiness number under scrutiny', 45]],
        { id: 'QZ-A1-4', topic: 'Multi-project narrative + defending a number', items: 8 },
        { id: 'WS-A1-4', name: 'Brief on a Multi-Project Portfolio', duration: 90,
          goals: ['Assemble a multi-project executive narrative', 'Defend a readiness figure under questioning'],
          agenda: ['Generate AI-drafted executive narratives for 2 projects and merge them into one briefing', 'Edit the merged narrative for accuracy and tone', 'Prepare 2 backup data points to defend the lowest readiness figure', 'Deliver a 5-minute mock multi-project briefing'] }),
    ],
    exam: { id: 'EXM-A1', format: '35 MCQ + 1 executive-memo practical', duration: 90, passMark: 75 },
  },
  {
    id: 'TRN-A2', level: 'LVL-A', icon: 'server',
    name: 'Sustainment, Governance & Platform Administration',
    goals: [
      'Run 30/60/90-day sustainment checkpoints and institutionalize lessons learned',
      'Administer the runtime Permission Matrix and Justification Governance toggle',
      'Configure multi-tenant hierarchy and manage cross-organization user scope',
      'Use Field Notes appropriately as a practitioner scratchpad, not a system-of-record substitute',
    ],
    audience: 'Senior Change Managers, Organization / Group Admins, Super Admins (Practitioner credential required)',
    halfDays: [
      halfDay('Day 3 · AM', 'Sustainment & Field Notes',
        [['Reinforcement & Sustainment — checkpoints, regression risk, quick wins, the REX lessons-learned log', 60],
         ['Field Notes — when to use it vs. a structured module', 45]],
        { id: 'QZ-A2-1', topic: 'Sustainment checkpoints + Field Notes scope', items: 8 },
        { id: 'WS-A2-1', name: 'Close Out a Program', duration: 90,
          goals: ['Complete a sustainment cycle correctly', 'Institutionalize a lesson learned properly'],
          agenda: ['Record the 90-day sustainment checkpoint', 'Log 2 lessons learned — one linked to a Rule/Charter, one left pending', 'Toggle sustainment sign-off with a written justification', 'Explain why a Field Note is not a substitute for a structured record'] }),
      halfDay('Day 3 · PM', 'Platform Governance & Administration',
        [['Permission Matrix & Governance Settings — 9 roles × 8 capabilities, the Super-Admin-only edit gate', 60],
         ['Multi-tenant hierarchy administration — Group/Organization scope, cascading delete, data isolation', 60]],
        { id: 'QZ-A2-2', topic: 'Permission Matrix + tenant isolation', items: 8 },
        { id: 'WS-A2-2', name: 'Administer a New Business Unit', duration: 90,
          goals: ['Safely extend the tenant hierarchy', 'Grant a scoped capability without over-provisioning'],
          agenda: ['Create a new Organization under an existing Group', 'Grant a Change Manager the manageTemplates capability via the Permission Matrix', 'Verify tenant data isolation from a sibling Organization', 'Explain the cascading-delete behavior at each hierarchy level'] }),
      halfDay('Day 4 · AM', 'Group & Tenant Lifecycle Administration',
        [['Standing up a new Group and its first Organizations, RBAC seeding', 60],
         ['Deactivating and archiving a tenant safely — data retention and cascading effects', 45]],
        { id: 'QZ-A2-3', topic: 'Group setup + safe deactivation', items: 8 },
        { id: 'WS-A2-3', name: 'Stand Up a Group and Retire an Organization', duration: 90,
          goals: ['Stand up a new Group with multiple Organizations and seed RBAC', 'Safely deactivate an Organization'],
          agenda: ['Create a new Group and 2 child Organizations', 'Seed each Organization with a Change Manager and a People Manager role', 'Deactivate a third, older Organization and record what happens to its data', 'Explain the cascading-delete boundary between Group and Organization levels'] }),
      halfDay('Day 4 · PM', 'Governance Policy Design',
        [['Designing a Justification Governance toggle policy for a new client, and the Super-Admin-only edit gate', 60],
         ['Turning a REX lesson-learned into a permanent policy change', 45]],
        { id: 'QZ-A2-4', topic: 'Justification policy design + REX-to-policy', items: 8 },
        { id: 'WS-A2-4', name: 'Turn a Lesson Learned into Policy', duration: 90,
          goals: ['Design a Justification Governance policy', 'Convert a REX lesson-learned entry into a Permission Matrix change'],
          agenda: ['Design a Justification Governance toggle policy for a new client scenario and document the rationale', 'Identify which capabilities should require justification and which should not', 'Take a seeded REX lesson-learned entry and translate it into a specific Permission Matrix change', 'Log the change with a written justification referencing the REX entry'] }),
    ],
    exam: { id: 'EXM-A2', format: '35 MCQ + 1 admin-configuration practical', duration: 90, passMark: 75 },
  },
  {
    id: 'TRN-A3', level: 'LVL-A', icon: 'flag-checkered', capstone: true,
    name: 'Capstone — Leading a Full Transformation Program End-to-End',
    goals: [
      'Integrate every module from M1–M22 into one coherent program simulation',
      'Defend a Phase Gate decision under Steering Committee questioning',
      'Diagnose and resolve an injected multi-module crisis scenario',
      'Present a portfolio-level readiness briefing synthesizing all four frameworks',
    ],
    audience: 'Advanced-level candidates only — TRN-A1 and TRN-A2 completed',
    halfDays: [
      halfDay('Day 5 · AM', 'Program Setup Simulation',
        [['Scenario briefing — a new manufacturing client launching an ERP + culture dual transformation', 75],
         ['Team formation and role assignment (Change Manager, PMO, Sponsor-proxy)', 45]],
        { id: 'QZ-A3-1', topic: 'Scenario comprehension', items: 8 },
        { id: 'WS-A3-1', name: 'Stand Up the Program', duration: 90,
          goals: ['Build the full program foundation under time pressure'],
          agenda: ['Build the M1–M9 chain: hierarchy, charter, OBS, stakeholder map', 'Set an initial ADKAR baseline for the scenario client', 'Assign and document team roles for the simulation'] }),
      halfDay('Day 5 · PM', 'Mid-Program Crisis Injection',
        [['Facilitator injects a crisis packet: Divergence Pattern, 2 systemic resistance entries, a saturation risk, a weak-sponsor-visibility signal', 60]],
        { id: 'QZ-A3-2', topic: 'Crisis diagnosis', items: 8 },
        { id: 'WS-A3-2', name: 'Triage the Crisis', duration: 120,
          goals: ['Diagnose each injected signal in its owning module', 'Produce one coherent joint mitigation plan'],
          agenda: ['Diagnose the Divergence Pattern (M11) and the resistance entries (M16)', 'Assess the saturation risk (M12) and the sponsor-visibility signal (M13)', 'Log a justified response for each', 'Assemble one joint mitigation plan spanning all four modules'] }),
      halfDay('Day 6 · AM', 'Phase Gate Defense',
        [['Phase Gate mechanics recap and Steering Committee role-play briefing', 45]],
        { id: 'QZ-A3-3', topic: 'Phase Gate defense readiness', items: 8 },
        { id: 'WS-A3-3', name: 'Defend the Gate', duration: 150,
          goals: ['Record a defensible Phase Gate decision from crisis-adjusted data', 'Defend it live under panel questioning'],
          agenda: ['Record a Phase Gate Joint Decision reflecting the crisis-adjusted data', 'Name and justify the Accountable role', 'Present the decision to a facilitator/peer panel', 'Respond to live Q&A challenging the call'] }),
      halfDay('Day 6 · PM', 'Executive Briefing & Program Close',
        [['Executive-briefing best practices recap', 45]],
        { id: 'QZ-A3-4', topic: 'Executive communication', items: 8 },
        { id: 'WS-A3-4', name: 'Brief and Close', duration: 150,
          goals: ['Deliver a portfolio-level readiness briefing', 'Close the simulated program correctly'],
          agenda: ['Generate and edit an AI-assisted executive narrative', 'Present a 10-minute portfolio-level readiness briefing', 'Record a sustainment sign-off closing the simulated program', 'Submit a one-page lessons-learned summary'] }),
    ],
    exam: { id: 'EXM-A3', format: 'Facilitator rubric across the 4 capstone workshops (25 pts each, 100 total)', duration: null, passMark: 75, rubric: true },
  },
];

module.exports = { pptx, newSlide, footer, header, iconCircle, card, pillBadge, A,
  TEAL_DEEP, TEAL, TEAL_MID, MINT, MINT2, ORANGE, ORANGE_LIGHT, INK, MUTED, WHITE, RED, RED_LIGHT, FONT,
  LEVELS, TRAININGS };
