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
    days: 3,
    examId: 'EXM-LVL-F', examSpec: '60 MCQ (drawn from TRN-F1–F3) + 1 guided practical in journi · 3h · pass mark 80% · unlocks Practitioner enrollment',
    credential: 'journi Certified Change Practitioner — Foundation',
  },
  {
    id: 'LVL-P', name: 'Practitioner', color: TEAL_DEEP, tint: MINT2, icon: 'chalkboard-user',
    tagline: 'Running a Change Program in journi',
    audience: 'Assigned or certified Change Managers who will own a real Change Management Project end-to-end. Prerequisite: Foundation credential.',
    outcome: 'Govern a program from charter through Phase Gate decisions, manage training/resistance/coaching data, and operate governed AI safely',
    days: 3,
    examId: 'EXM-LVL-P', examSpec: '60 MCQ (drawn from TRN-P1–P3) + 1 integrated practical (Phase Gate + resistance pattern + AI activation decision) · 3.5h · pass mark 80% · unlocks Advanced enrollment',
    credential: 'journi Certified Change Practitioner — Practitioner',
  },
  {
    id: 'LVL-A', name: 'Advanced', color: ORANGE, tint: ORANGE_LIGHT, icon: 'medal',
    tagline: 'Leading Change Portfolios & Sustaining Impact',
    audience: 'Senior Change Managers, Change Management Leads, PMO Directors, Organization/Group Admins managing multiple concurrent initiatives. Prerequisite: Practitioner credential.',
    outcome: 'Report portfolio-level readiness to executives, administer platform governance, and lead a full transformation program end-to-end',
    days: 4,
    examId: 'EXM-LVL-A', examSpec: 'Capstone facilitator rubric (4 workshops, 25 pts each) + 40-MCQ integrative written exam (TRN-A1–A2) · pass: written ≥80% AND rubric ≥75/100',
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
    ],
    exam: { id: 'EXM-F1', format: '30 MCQ + 2 short-answer', duration: 60, passMark: 75 },
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
      halfDay('Day 2 · AM', 'Stakeholder Mapping & ADKAR',
        [['Stakeholder & Impact Mapping — 5-dimension scoring, influence, the High-Impact/Low-Influence flag', 60],
         ['ADKAR Engine — 5 blocks, barrier diagnosis, stalled-block escalation, the Desire-diagnosis AI coach', 60]],
        { id: 'QZ-F2-1', topic: 'ADKAR blocks + impact scoring', items: 8 },
        { id: 'WS-F2-1', name: 'Map and Score a Cohort', duration: 90,
          goals: ['Produce a correctly-flagged stakeholder map', 'Score and justify an ADKAR baseline'],
          agenda: ['Add a new stakeholder group to the seeded ERP scenario', 'Score its 5-dimension impact and influence', 'Confirm the High-Impact / Low-Influence flag fires correctly', 'Score and justify the cohort\'s ADKAR baseline across all 5 blocks'] }),
      halfDay('Day 2 · PM', 'Emotional Readiness & the Journey Map',
        [['Emotional & Transition Layer — Bridges position, Kübler-Ross sentiment inference, the Divergence Pattern', 60],
         ['Journey Map — reading the visual timeline, event types, organization-level zoom', 60]],
        { id: 'QZ-F2-2', topic: 'Bridges/Kübler-Ross + Divergence Pattern', items: 8 },
        { id: 'WS-F2-2', name: 'Diagnose a Divergence Case', duration: 90,
          goals: ['Recognize and respond to a Divergence Pattern', 'Add a justified Journey Map annotation'],
          agenda: ['Given strong Knowledge/Ability but an "Ending" Bridges read, confirm the Divergence Alert', 'Log a justified sentiment update citing specific evidence', 'Add an annotated Journey Map event for the diagnosis', 'Explain the recommended loss-focused response vs. more training'] }),
    ],
    exam: { id: 'EXM-F2', format: '30 MCQ + 1 case-based scenario', duration: 75, passMark: 75 },
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
      halfDay('Day 3 · AM', 'Sponsor & Coalition, Communications',
        [['Sponsor & Coalition — visibility tracker, coalition roster, sponsor actions, the weak-visibility alert', 60],
         ['Communications — the message × audience × channel × timing matrix, saturation detection', 60]],
        { id: 'QZ-F3-1', topic: 'Sponsorship visibility + communication matrix', items: 8 },
        { id: 'WS-F3-1', name: 'Plan a Communication Wave', duration: 90,
          goals: ['Build a saturation-aware communication matrix', 'Log a sponsor action addressing a visibility gap'],
          agenda: ['Build a 3-message communication matrix for a target cohort', 'Run the Change Saturation Advisor AI use case and interpret its flag', 'Log a sponsor action addressing an identified visibility gap', 'Justify the linkage between each message and its ADKAR block'] }),
      halfDay('Day 3 · PM', 'Risk & the Notification Center',
        [['Change Risk Register — adoption/sponsorship/capacity/saturation categories, risk score, mitigation', 60],
         ['Notification Center — the 9 live alert conditions, dismiss/restore, tracing an alert to its module', 60]],
        { id: 'QZ-F3-2', topic: 'Risk categories + live alert conditions', items: 8 },
        { id: 'WS-F3-2', name: 'Close the Loop on a Risk', duration: 90,
          goals: ['Log and mitigate a change risk end-to-end', 'Correctly interpret and clear a live alert'],
          agenda: ['Log a saturation risk with likelihood/impact scoring', 'Add a mitigation action with an owner and due date', 'Verify the corresponding alert fires in the Notification Center', 'Dismiss the alert once mitigated and explain when Restore applies'] }),
    ],
    exam: { id: 'EXM-F3', format: '30 MCQ', duration: 60, passMark: 75 },
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
    ],
    exam: { id: 'EXM-P1', format: '30 MCQ + 1 practical (record a Phase Gate end-to-end)', duration: 90, passMark: 75 },
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
      halfDay('Day 2 · AM', 'Training & Capability',
        [['Training & Capability Building — curriculum fields, completion vs. certification, the needs banner', 60],
         ['Mentoring Progression model — 3 stages, entry/exit criteria, the one-stage-back regression path', 60]],
        { id: 'QZ-P2-1', topic: 'Trained vs. capable + mentoring stages', items: 8 },
        { id: 'WS-P2-1', name: 'Build a Curriculum and Mentor a Trainee', duration: 90,
          goals: ['Distinguish attendance from demonstrated capability', 'Advance a mentee correctly through the 3-stage model'],
          agenda: ['Add a curriculum record and track completion percentage', 'Certify it with a justification distinct from completion', 'Move a mentee from Trainee to Observer with logged competency evidence', 'Explain the regression path if a critical error occurs at Observer stage'] }),
      halfDay('Day 2 · PM', 'Resistance & Coaching',
        [['Resistance Management — type classification, systemic-pattern detection, Coding Workbench', 60],
         ['Manager-as-Coach — team-scoped heatmap, manager readiness, coaching scripts', 60]],
        { id: 'QZ-P2-2', topic: 'Resistance types + coaching model', items: 8 },
        { id: 'WS-P2-2', name: 'Code a Pattern, Coach a Manager', duration: 90,
          goals: ['Surface a systemic resistance pattern', 'Log a justified manager-readiness update'],
          agenda: ['Log 2 systemic-type resistance entries to trigger the pattern-detection banner', 'Tag both entries against the organization\'s codebook', 'Cross-reference one tag to an existing resistance-log barrier', 'Log a manager-readiness rating with supporting justification'] }),
    ],
    exam: { id: 'EXM-P2', format: '30 MCQ + 1 case study', duration: 75, passMark: 75 },
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
      halfDay('Day 3 · AM', 'AI Governance Model',
        [['Tiers & catalog structure — Assistive vs. Augmented vs. out-of-scope Autonomous; prompt templates', 60],
         ['Activation & override — organization-level activation, project-level override, deactivation behavior', 60]],
        { id: 'QZ-P3-1', topic: 'AI tiers + activation model', items: 8 },
        { id: 'WS-P3-1', name: 'Govern a Use Case Rollout', duration: 90,
          goals: ['Activate use cases correctly at the right scope', 'Justify a project-level override'],
          agenda: ['Activate 3 AI use cases for an Organization', 'Override one use case off for a single sensitive project', 'Write a short justification note for the override', 'Explain what happens to prior AI-generated content on deactivation'] }),
      halfDay('Day 3 · PM', 'Usage Audit & Provider Connection',
        [['AI Usage Log — accepted / edited / rejected outcomes, what governance reporting looks for', 60],
         ['Real LLM Provider Connection — browser-local key storage, fallback behavior, when (not) to configure', 60]],
        { id: 'QZ-P3-2', topic: 'Usage audit + provider connection', items: 8 },
        { id: 'WS-P3-2', name: 'Audit and Decide', duration: 90,
          goals: ['Read a usage log for governance signal', 'Produce a short governance recommendation'],
          agenda: ['Review a sample AI Usage Log across several use cases', 'Identify the use case with the highest rejection rate', 'Draft a one-paragraph governance recommendation', 'State where the Real LLM Provider Connection\'s API key is (and is not) stored'] }),
    ],
    exam: { id: 'EXM-P3', format: '25 MCQ + 1 governance-memo exercise', duration: 60, passMark: 75 },
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
    ],
    exam: { id: 'EXM-A1', format: '25 MCQ + 1 executive-memo practical', duration: 75, passMark: 75 },
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
      halfDay('Day 2 · AM', 'Sustainment & Field Notes',
        [['Reinforcement & Sustainment — checkpoints, regression risk, quick wins, the REX lessons-learned log', 60],
         ['Field Notes — when to use it vs. a structured module', 45]],
        { id: 'QZ-A2-1', topic: 'Sustainment checkpoints + Field Notes scope', items: 8 },
        { id: 'WS-A2-1', name: 'Close Out a Program', duration: 90,
          goals: ['Complete a sustainment cycle correctly', 'Institutionalize a lesson learned properly'],
          agenda: ['Record the 90-day sustainment checkpoint', 'Log 2 lessons learned — one linked to a Rule/Charter, one left pending', 'Toggle sustainment sign-off with a written justification', 'Explain why a Field Note is not a substitute for a structured record'] }),
      halfDay('Day 2 · PM', 'Platform Governance & Administration',
        [['Permission Matrix & Governance Settings — 9 roles × 8 capabilities, the Super-Admin-only edit gate', 60],
         ['Multi-tenant hierarchy administration — Group/Organization scope, cascading delete, data isolation', 60]],
        { id: 'QZ-A2-2', topic: 'Permission Matrix + tenant isolation', items: 8 },
        { id: 'WS-A2-2', name: 'Administer a New Business Unit', duration: 90,
          goals: ['Safely extend the tenant hierarchy', 'Grant a scoped capability without over-provisioning'],
          agenda: ['Create a new Organization under an existing Group', 'Grant a Change Manager the manageTemplates capability via the Permission Matrix', 'Verify tenant data isolation from a sibling Organization', 'Explain the cascading-delete behavior at each hierarchy level'] }),
    ],
    exam: { id: 'EXM-A2', format: '25 MCQ + 1 admin-configuration practical', duration: 75, passMark: 75 },
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
      halfDay('Day 3 · AM', 'Program Setup Simulation',
        [['Scenario briefing — a new manufacturing client launching an ERP + culture dual transformation', 75],
         ['Team formation and role assignment (Change Manager, PMO, Sponsor-proxy)', 45]],
        { id: 'QZ-A3-1', topic: 'Scenario comprehension', items: 8 },
        { id: 'WS-A3-1', name: 'Stand Up the Program', duration: 90,
          goals: ['Build the full program foundation under time pressure'],
          agenda: ['Build the M1–M9 chain: hierarchy, charter, OBS, stakeholder map', 'Set an initial ADKAR baseline for the scenario client', 'Assign and document team roles for the simulation'] }),
      halfDay('Day 3 · PM', 'Mid-Program Crisis Injection',
        [['Facilitator injects a crisis packet: Divergence Pattern, 2 systemic resistance entries, a saturation risk, a weak-sponsor-visibility signal', 60]],
        { id: 'QZ-A3-2', topic: 'Crisis diagnosis', items: 8 },
        { id: 'WS-A3-2', name: 'Triage the Crisis', duration: 120,
          goals: ['Diagnose each injected signal in its owning module', 'Produce one coherent joint mitigation plan'],
          agenda: ['Diagnose the Divergence Pattern (M11) and the resistance entries (M16)', 'Assess the saturation risk (M12) and the sponsor-visibility signal (M13)', 'Log a justified response for each', 'Assemble one joint mitigation plan spanning all four modules'] }),
      halfDay('Day 4 · AM', 'Phase Gate Defense',
        [['Phase Gate mechanics recap and Steering Committee role-play briefing', 45]],
        { id: 'QZ-A3-3', topic: 'Phase Gate defense readiness', items: 8 },
        { id: 'WS-A3-3', name: 'Defend the Gate', duration: 150,
          goals: ['Record a defensible Phase Gate decision from crisis-adjusted data', 'Defend it live under panel questioning'],
          agenda: ['Record a Phase Gate Joint Decision reflecting the crisis-adjusted data', 'Name and justify the Accountable role', 'Present the decision to a facilitator/peer panel', 'Respond to live Q&A challenging the call'] }),
      halfDay('Day 4 · PM', 'Executive Briefing & Program Close',
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
