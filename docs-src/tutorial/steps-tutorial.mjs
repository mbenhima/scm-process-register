// Structured task data for the Kenitra Precision Manufacturing tutorial.
// Each phase: { id, name, goals[], pmTasks[], cmTasks[], frameworkUpdate, exitChecklist }
// Each task: { id, name, sipoc, racsi, steps[] }
// Each step: { module, action, userInput, expectedResult, screenshot, before? }
//
// RACSI roles (fixed set, every task): sponsor, superAdmin, pmo, cm, peopleManager, employee
// RACSI values: 'R' Responsible, 'A' Accountable, 'C' Consulted, 'S' Support, 'I' Informed,
// combined codes like 'A/R' are used where one role both owns and does the work.

export const RACSI_ROLES = [
  { key: 'sponsor', label: 'Sponsor' },
  { key: 'superAdmin', label: 'Super Admin' },
  { key: 'pmo', label: 'PMO / Program Manager' },
  { key: 'cm', label: 'Change Manager' },
  { key: 'peopleManager', label: 'People Manager' },
  { key: 'employee', label: 'Employee / End User' },
]

export const TUTORIAL_PHASES = [
  {
    id: 'Phase 0',
    name: 'Set Up Your Multi-Tenant Structure',
    goals: [
      'Stand up the tenant hierarchy from a clean install: a Group, two Organizations under it, one Main Project, and one linked Change Management Project.',
      'Establish the fictional company this tutorial follows throughout — Kenitra Precision Manufacturing, part of Sahara Manufacturing Holdings — so every later screen has real, connected data to show.',
    ],
    pmTasks: [
      {
        id: 'PM0.1',
        name: 'Stand up the tenant hierarchy',
        sipoc: {
          suppliers: 'Super Admin (Amina Idrissi); POWERACT onboarding checklist',
          inputs: 'Group name; Organization names, sectors, site lists, employee counts, default languages',
          process: ['Create the Group', 'Create two Organizations under it (Kenitra plant + Tangier plant)', 'Set each Organization’s default language'],
          outputs: 'A Group with two Organizations, each carrying its own default language and site list',
          customers: 'Every downstream module — everything in this tutorial is scoped under this hierarchy',
        },
        racsi: { sponsor: 'I', superAdmin: 'A/R', pmo: 'C', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'Login', action: 'Sign-in screen', userInput: 'None yet — journi ships with named demo users per role, no password required for this environment.', expectedResult: 'The journi login screen, with a language selector and a grid of demo users grouped by role.', screenshot: '01-login-screen.png' },
          { module: 'M1 · Hierarchy', action: 'Open Hierarchy on a fresh install', userInput: 'Sign in as Amina Idrissi (Super Admin).', expectedResult: 'M1 lists the pre-seeded demo organizations (Atlas, Maghreb, Meridia); nothing Kenitra-specific exists yet.', screenshot: '02-m1-empty-hierarchy-before.png' },
          { module: 'M1 · Hierarchy', action: 'Create a Group', userInput: 'Click "+ Group". Name: "Sahara Manufacturing Holdings". Save.', expectedResult: 'A modal collects the Group name only — Groups are a lightweight container, not a full tenant record.', screenshot: '03-m1-modal-create-group.png' },
          { module: 'M1 · Hierarchy', action: 'Create the first Organization', userInput: 'Click "+ Organization". Name: "Kenitra Precision Manufacturing"; Group: Sahara Manufacturing Holdings; Sector: Manufacturing; Employees: 3100; Sites: Kénitra Atlantic Free Zone Plant; Languages: fr, ar; Default language: FR.', expectedResult: 'The new Organization card shows its sector, headcount, site count, and a "Default language: FR" control.', screenshot: '04-m1-modal-create-org.png' },
          { module: 'M1 · Hierarchy', action: 'Create a second Organization in the same Group', userInput: 'Repeat with Name: "Kenitra Precision Manufacturing — Tangier Plant"; same Group; 850 employees.', expectedResult: 'Two Organizations now sit under one Group — the minimum real structure a Group-level roll-up needs to be meaningful later.', screenshot: '05-m1-two-orgs-under-group.png' },
        ],
      },
      {
        id: 'PM0.2',
        name: 'Register the Main Project',
        sipoc: {
          suppliers: 'Sponsor (Hicham Benjelloun, COO); PMO',
          inputs: 'Project name, type, description, duration, budget band (MAD), executive sponsor',
          process: ['Open the Kenitra Organization card', 'Click + Main Project', 'Fill scope, duration, budget and sponsor'],
          outputs: 'A registered Main Project carrying the delivery timeline and budget, with no people-readiness data of its own',
          customers: 'M4 (links to it), M18 (baseline dates are anchored to its timeline)',
        },
        racsi: { sponsor: 'A', superAdmin: 'R', pmo: 'C/R', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'M1 · Hierarchy', action: 'Create the Main Project', userInput: 'On the Kenitra Precision Manufacturing card, click "+ Main Project". Name: "Enterprise Platform Renewal Program"; Type: ERP Implementation; Description: "Company-wide renewal of the core transactional platform covering finance, procurement, inventory and production planning across both plants. Technical cutover targeted for Month 9 of this 14-month program; Months 10–14 reserved for stabilization and hypercare."; Duration: 14 months; Budget band: MAD 80–120M; Executive sponsor: Hicham Benjelloun, Chief Operating Officer.', expectedResult: 'The Description field is where the delivery timeline actually lives — Month 9 is the one fact this entire tutorial keeps returning to. The Main Project never names a specific vendor or product: journi is deliberately vendor-agnostic.', screenshot: '06-m1-modal-create-main-project.png' },
          { module: 'M1 · Hierarchy', action: 'Main Project created', userInput: '—', expectedResult: 'The Main Project card appears under Kenitra Precision Manufacturing, showing "14mo · MAD 80–120M · Hicham Benjelloun" and no linked CM Project yet.', screenshot: '07-m1-main-project-created.png' },
        ],
      },
    ],
    cmTasks: [
      {
        id: 'CM0.1',
        name: 'Register and link the Change Management Project',
        sipoc: {
          suppliers: 'Change Manager (Karim Chraibi); Main Project record (PM0.2)',
          inputs: 'CM Project name, change type, target population, Main Project link',
          process: ['Click + Change Management Project on the Organization', 'Choose to link it to the Main Project (or leave standalone)', 'Set change type and target population'],
          outputs: 'A Change Management Project explicitly linked to its Main Project, ready to carry ADKAR/sentiment/training/resistance data',
          customers: 'Every Change Management module from M4 onward',
        },
        racsi: { sponsor: 'I', superAdmin: 'S', pmo: 'C', cm: 'A/R', peopleManager: 'I', employee: '' },
        steps: [
          { module: 'M1 · Hierarchy', action: 'Create the linked Change Management Project', userInput: 'Click "+ Change Management Project" on the same Organization. Name: "Enterprise Platform Renewal — People Readiness"; link to the Main Project above; Change Manager: Karim Chraibi; Type: Technology; Target population: Finance, Procurement, Warehouse & Production Planning staff (~1,200 people).', expectedResult: 'A CM Project modal always offers "Standalone" as the default link option — linking to a Main Project is optional by design.', screenshot: '08-m1-modal-create-cm-project.png' },
          { module: 'M1 · Hierarchy', action: 'CM Project created and linked', userInput: '—', expectedResult: 'The Change Management Project column shows "Enterprise Platform Renewal — People Readiness" with "↳ Linked Main Project: Enterprise Platform Renewal Program" underneath.', screenshot: '09-m1-cm-project-created-linked.png' },
        ],
      },
    ],
    frameworkUpdate: {
      lewin: 'Unfreeze (default)',
      prosci: 'Prepare (default)',
      bridges: 'Ending (default)',
      justification: 'No framework state changes yet — the tenant structure and the two project records were just created. Every project starts at Lewin Unfreeze / Prosci Prepare / Bridges Ending by default until a Change Manager observes and stages otherwise.',
    },
    exitChecklist: {
      items: [
        'Group and both Organizations exist with correct default languages',
        'Main Project carries a clear delivery description, duration, budget band and sponsor',
        'Change Management Project is created and explicitly linked to the Main Project',
        'Change Manager (Karim Chraibi) is named and can sign in scoped to this project',
      ],
      decision: 'GO — tenant structure is sound; proceed to Phase 1.',
    },
  },

  {
    id: 'Phase 1',
    name: 'Initiate & Diagnose',
    goals: [
      'Fill in the CM Project’s diagnostic picture: business case, stakeholders, and the sponsor’s starting visibility.',
      'Build the WBS & Gantt baseline — the planning artifact every later phase’s "actual" dates will be measured against.',
    ],
    pmTasks: [
      {
        id: 'PM1.1',
        name: 'Complete the initiative profile & business case',
        sipoc: {
          suppliers: 'Change Manager; Board mandate documentation',
          inputs: 'Change type, business driver, target population, success criteria',
          process: ['Open M4 on the new CM Project', 'Fill business driver, target population, success criteria'],
          outputs: 'A complete initiative profile feeding the Composite Readiness Index',
          customers: 'M15 Analytics (rolls this up); every phase’s Framework Update references it',
        },
        racsi: { sponsor: 'C', superAdmin: '', pmo: 'A/R', cm: 'R', peopleManager: '', employee: '' },
        steps: [
          { module: 'M4 · Initiative Registry', action: 'Open the project profile', userInput: 'Select the new Organization and CM Project from the top bar, then open M4.', expectedResult: 'A blank profile: Lewin phase defaults to Unfreeze, free-text fields are empty.', screenshot: '10-p1-m4-before.png' },
          { module: 'M4 · Initiative Registry', action: 'Fill in the project profile', userInput: 'Change type: Technology; Business driver: "Finance close takes 11 business days on the legacy platform and the vendor stops support in 9 months; the Board mandated a single unified platform across both plants."; Target population and Success criteria filled in similarly.', expectedResult: 'The Composite Readiness Index panel updates live as ADKAR/sentiment/training data arrives in later modules — right now it reflects the project’s untouched baseline.', screenshot: '11-p1-m4-filled.png' },
        ],
      },
      {
        id: 'PM1.2',
        name: 'Build the WBS & Gantt baseline',
        sipoc: {
          suppliers: 'PMO; the Main Project’s delivery timeline (PM0.2); Change Manager’s CM task list',
          inputs: 'Task names, tracks (Project Management / Change Management / Framework), phase labels, baseline start/finish dates',
          process: ['Open M18', 'Add one WBS task per Project Management milestone and Change Management task planned across the 14-month program', 'Set each task’s baseline start/finish — no actual dates yet'],
          outputs: 'A complete baseline WBS — the planned schedule every later phase’s actual dates are measured against',
          customers: 'PM5.4 (schedule-gap review); the Gantt chart itself; the Sponsor’s program-status view',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'A/R', cm: 'C/R', peopleManager: '', employee: '' },
        steps: [
          { module: 'M18 · WBS & Gantt', action: 'Open a fresh WBS', userInput: 'Open M18 on the new CM Project.', expectedResult: 'An empty state: no tasks yet, all stat cards at zero — new CM Projects always start with a blank WBS rather than pre-populated planning data.', screenshot: '12-p1-m18-empty.png' },
          { module: 'M18 · WBS & Gantt', action: 'Add the first Project Management baseline task', userInput: 'Click "+ Add WBS task". Track: Project Management; Phase: "Phase 0"; Name: "Stand up tenant hierarchy & governance"; Baseline start/finish: the two days already spent in Phase 0. Save.', expectedResult: 'The task appears in the Project Management track table and as a bar on the Gantt, positioned at its baseline dates with no actual bar yet (not started).', screenshot: '13-p1-m18-modal-add-task.png' },
          { module: 'M18 · WBS & Gantt', action: 'Add the remaining baseline tasks for both tracks', userInput: 'Repeat for the rest of the Phase 0–4 Project Management milestones and Change Management tasks this tutorial will walk through, each with its planned baseline window.', expectedResult: 'The Gantt now shows the full 14-month baseline across both tracks — sand bars for Project Management, teal bars for Change Management — with every task still "planned" (no actual dates).', screenshot: '14-p1-m18-baseline-populated.png' },
        ],
      },
    ],
    cmTasks: [
      {
        id: 'CM1.1',
        name: 'Map stakeholders & impact',
        sipoc: {
          suppliers: 'Change Manager; org chart; plant HR headcount data',
          inputs: 'Stakeholder group names, headcounts, process/tech/role/location/identity impact ratings, influence',
          process: ['Open M5', 'Log each affected stakeholder group with its impact profile'],
          outputs: 'A stakeholder map flagging the highest-impact, lowest-influence groups for extra attention',
          customers: 'M9 Communications (targets these groups); M11 Resistance (watches them first)',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'I', cm: 'A/R', peopleManager: 'C', employee: '' },
        steps: [
          { module: 'M5 · Stakeholder Mapping', action: 'Log the first two stakeholder groups', userInput: 'Add "Finance & Procurement (HQ)" — 210 headcount, high process/tech impact; add "Shop-Floor Supervisors, both plants" — 260 headcount, high process/location/identity impact, low influence.', expectedResult: 'The impact map flags the shop-floor supervisor group as high-impact/low-influence — exactly the population Kotter’s coalition-building work should prioritize.', screenshot: '15-p1-m5-two-groups-flagged.png' },
        ],
      },
      {
        id: 'CM1.2',
        name: 'Establish baseline sponsor visibility',
        sipoc: {
          suppliers: 'Sponsor (Hicham Benjelloun); Change Manager’s direct observation',
          inputs: 'Current sponsor visibility level, supporting note, justification',
          process: ['Open M8', 'Stage a visibility level', 'Save with justification'],
          outputs: 'A logged, justified sponsor-visibility baseline in the project’s Change Log',
          customers: 'M4’s Readiness Index; M8’s own Sponsor Action Recommender',
        },
        racsi: { sponsor: 'C', superAdmin: '', pmo: 'I', cm: 'A/R', peopleManager: '', employee: '' },
        steps: [
          { module: 'M8 · Sponsor & Coalition', action: 'Open Sponsor & Coalition before any data exists', userInput: 'Open M8.', expectedResult: 'Visibility defaults to "weak" with no note — an honest empty baseline, not a flattering guess.', screenshot: '16-p1-m8-before.png' },
          { module: 'M8 · Sponsor & Coalition', action: 'Stage and save sponsor visibility with justification', userInput: 'Open Sponsor & Coalition ● Stage "Moderate" ● Write a note: "Kick-off town hall held at both plants this week; Hicham personally opened both sessions." ● Save with justification.', expectedResult: 'The stage-then-justify pattern used everywhere in journi: the value and the evidence behind it are recorded together, in the same save, permanently in the Change Log.', screenshot: '17-p1-m8-sponsor-visibility-set.png' },
        ],
      },
    ],
    frameworkUpdate: {
      lewin: 'Unfreeze',
      prosci: 'Prepare',
      bridges: 'Ending',
      justification: 'Still Prepare/Unfreeze/Ending — Phase 1 is diagnostic (profile, stakeholders, sponsor baseline, WBS baseline). Nothing has moved yet; these tasks exist to give later framework moves real evidence to cite.',
    },
    exitChecklist: {
      items: [
        'Initiative profile (business driver, target population, success criteria) is complete',
        'WBS baseline covers every Project Management milestone and Change Management task planned for the program',
        'At least the highest-impact stakeholder groups are logged in M5',
        'Sponsor visibility baseline is staged, justified, and saved',
      ],
      decision: 'GO — diagnostic picture and planning baseline are both in place; proceed to Phase 2.',
    },
  },

  {
    id: 'Phase 2',
    name: 'Plan & Prepare',
    goals: [
      'Score the first real ADKAR reading, log the top adoption risk, and stand up the training curriculum and first communication — the four pillars of preparation.',
    ],
    pmTasks: [],
    cmTasks: [
      {
        id: 'CM2.1',
        name: 'Score initial Awareness (ADKAR)',
        sipoc: {
          suppliers: 'Shop-floor supervisor floor conversations; Change Manager',
          inputs: 'Awareness score (1–5), barrier note, justification',
          process: ['Open M6', 'Stage Awareness score', 'Save with justification'],
          outputs: 'A justified Awareness reading in the ADKAR engine, feeding the Composite Readiness Index',
          customers: 'M12 Manager-as-Coach heatmap; M15 Analytics',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'I', cm: 'A/R', peopleManager: 'C', employee: '' },
        steps: [
          { module: 'M6 · ADKAR Engine', action: 'Open ADKAR Engine (all blocks at baseline 1)', userInput: 'Open M6 on a fresh project.', expectedResult: 'All five ADKAR blocks show a score of 1 with no note — the platform’s honest starting point.', screenshot: '18-p2-m6-before.png' },
          { module: 'M6 · ADKAR Engine', action: 'Stage and save the Awareness score', userInput: 'Open ADKAR Engine (all blocks at baseline 1) ● Stage a score of 3 on Awareness, with a note citing informal floor conversations since the Board mandate ● Save with justification: "Informal floor conversations at both plants this week show the Board mandate has reached supervisors, though most only know ‘something is changing,’ not what or when."', expectedResult: 'Awareness moves to 3/5 with the justification stored in its history; the other four blocks remain at 1 until their own evidence arrives.', screenshot: '19-p2-m6-awareness-scored.png' },
        ],
      },
      {
        id: 'CM2.2',
        name: 'Log the highest-severity adoption risk',
        sipoc: {
          suppliers: 'Change Manager’s own risk-scanning; stakeholder map (CM1.1)',
          inputs: 'Risk category, description, likelihood, impact, owner',
          process: ['Open M14', 'Log the risk with likelihood × impact'],
          outputs: 'A scored, owned risk entry, auto-flagged high-severity if it crosses threshold',
          customers: 'M9 Change Saturation Advisor; M4’s portfolio table',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'C', cm: 'A/R', peopleManager: '', employee: '' },
        steps: [
          { module: 'M14 · Risk Register', action: 'Log the adoption risk', userInput: 'Category: Adoption; Description: "Shop-floor supervisors at the Kénitra plant have no protected time allotted for training once the line is running."; Likelihood: 4; Impact: 4; Owner: Karim Chraibi.', expectedResult: 'The risk is auto-flagged high-severity (likelihood × impact ≥ threshold), shown with a red badge.', screenshot: '20-p2-m14-risk-logged.png' },
        ],
      },
      {
        id: 'CM2.4',
        name: 'Stand up the first training curriculum',
        sipoc: {
          suppliers: 'Training team; identified Knowledge/Ability gaps',
          inputs: 'Curriculum name, target cohort, modules, delivery format',
          process: ['Open M10', 'Create the curriculum and its module list'],
          outputs: 'A published curriculum ready to track completion per cohort',
          customers: 'M12 Manager-as-Coach; M6’s Knowledge/Ability blocks',
        },
        racsi: { sponsor: '', superAdmin: '', pmo: '', cm: 'A', peopleManager: 'C/R', employee: 'I' },
        steps: [
          { module: 'M10 · Training', action: 'Create the first curriculum', userInput: 'Name: "New Platform Fundamentals — Shop Floor"; Target cohort: Shop-Floor Supervisors (both plants); Modules: Navigation basics, Daily transaction entry, Exception handling; Format: In-person, plant floor.', expectedResult: 'The curriculum appears with a 0% completion rate across the target cohort — the number M12’s heatmap and M6’s Knowledge block will move as sessions run.', screenshot: '21-p2-m10-curriculum-created.png' },
        ],
      },
      {
        id: 'CM2.3',
        name: 'Plan the first target-population communication',
        sipoc: {
          suppliers: 'Communications practitioner; stakeholder map (CM1.1)',
          inputs: 'Message theme, channel, audience, timing',
          process: ['Open M9', 'Log the planned communication against its target audience and channel'],
          outputs: 'A scheduled communication entry, cross-checked for saturation against other concurrent projects',
          customers: 'M14 Change Saturation Advisor',
        },
        racsi: { sponsor: 'C', superAdmin: '', pmo: 'I', cm: 'A/R', peopleManager: 'I', employee: 'I' },
        steps: [
          { module: 'M9 · Communications', action: 'Log the first communication', userInput: 'Theme: "Why we’re changing, and what stays the same"; Channel: Town hall + plant-floor poster; Audience: Finance, Procurement, Warehouse & Production Planning; Timing: Week 1 of Month 7.', expectedResult: 'The communication appears on the plan; the Change Saturation Advisor confirms no other active project is targeting the same population that week.', screenshot: '22-p2-m9-communication-logged.png' },
        ],
      },
    ],
    frameworkUpdate: {
      lewin: 'Unfreeze → Change (transitioning)',
      prosci: 'Prepare → Manage (transitioning)',
      bridges: 'Ending',
      justification: 'The first real Awareness score, a logged high-severity risk, a live training curriculum, and a planned communication together mark the shift from pure diagnosis into active preparation — Lewin and Prosci both start transitioning toward their next macro-state, while Bridges stays in Ending: the population hasn’t started letting go of the old process yet, only hearing that it will.',
    },
    exitChecklist: {
      items: [
        'Awareness has a real, justified score above the 1/5 baseline',
        'The highest-severity adoption risk is logged and owned',
        'A training curriculum exists for the target population',
        'A first communication is planned and checked for saturation',
      ],
      decision: 'GO — preparation pillars are in place; proceed to Phase 3.',
    },
  },

  {
    id: 'Phase 3',
    name: 'Mobilize & Execute',
    goals: [
      'Score Desire and diagnose the stall it reveals, move Bridges/Kübler-Ross to reflect surfacing resistance, and begin logging and mitigating that resistance.',
    ],
    pmTasks: [],
    cmTasks: [
      {
        id: 'CM3.1',
        name: 'Score Desire & diagnose the stall',
        sipoc: {
          suppliers: 'Pulse survey results; supervisor 1:1 notes',
          inputs: 'Desire score, barrier note, justification',
          process: ['Open M6', 'Stage Desire score', 'Save with justification'],
          outputs: 'A justified Desire reading showing a stall relative to Awareness',
          customers: 'M7’s Divergence Pattern Detector; M12 coaching scripts',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'I', cm: 'A/R', peopleManager: 'C', employee: '' },
        steps: [
          { module: 'M6 · ADKAR Engine', action: 'Stage and save the Desire score', userInput: 'Open ADKAR Engine ● Stage a score of 2 on Desire, with a note citing this week’s pulse survey ● Save with justification: "This week’s pulse survey shows Awareness has moved but Desire has not — the dominant open comment is ‘why should we trust this will actually work this time.’"', expectedResult: 'Desire sits at 2/5 against Awareness at 3/5 — the gap this task exists to surface.', screenshot: '23-p3-m6-desire-scored.png' },
        ],
      },
      {
        id: 'CM3.2',
        name: 'Update Bridges & Kübler-Ross position',
        sipoc: {
          suppliers: 'Supervisor floor-meeting notes; the stalled Desire reading (CM3.1)',
          inputs: 'Bridges phase, Kübler-Ross stage, sentiment note, justification',
          process: ['Open M7', 'Stage sentiment position (Resistance/Anger)', 'Save with justification'],
          outputs: 'A justified sentiment reading flagging open resistance rather than passive avoidance',
          customers: 'M11 Resistance Management; M7’s Divergence Pattern Detector',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'I', cm: 'A/R', peopleManager: 'C', employee: '' },
        steps: [
          { module: 'M7 · Emotional & Transition', action: 'Stage and save the Kübler-Ross sentiment position', userInput: 'Open Emotional & Transition ● Stage "Resistance / Anger" on the Kübler-Ross curve ● Save with justification: "The stalled Desire score and this week’s ‘wait it out’ comments from the supervisor floor meeting both point to open resistance, not passive avoidance — the first explicit sentiment reading logged for this project."', expectedResult: 'The sentiment marker moves to Resistance/Anger; Bridges stays in Ending for the population that hasn’t started disengaging from the old process, while the curve records the emotional signal separately.', screenshot: '24-p3-m7-sentiment-set.png' },
        ],
      },
      {
        id: 'CM3.3',
        name: 'Log & begin mitigating resistance',
        sipoc: {
          suppliers: 'The sentiment reading (CM3.2); Sponsor visibility (CM1.2)',
          inputs: 'Resistance type, description, owner, mitigation action plan entries',
          process: ['Open M11', 'Log the resistance entry', 'Add a mitigation action with an owner and due date'],
          outputs: 'A tracked resistance entry with an active mitigation plan',
          customers: 'M8 Sponsor Action Recommender; M4’s Change Log',
        },
        racsi: { sponsor: 'C/S', superAdmin: '', pmo: 'I', cm: 'A/R', peopleManager: 'C', employee: '' },
        steps: [
          { module: 'M11 · Resistance', action: 'Log the resistance with its mitigation plan', userInput: 'Type: Will; Source: Shop-floor supervisors, Kénitra plant; Root cause: "Supervisors openly stating they’ll ‘wait it out’ rather than engage with the new process."; Severity: 4; Mitigation action: "Sponsor floor visit + small-group listening session before next town hall"; Owner: Hicham Benjelloun; Due date: next week.', expectedResult: 'The resistance entry is logged with its mitigation action, owner and due date captured in the same form — the same category of tracked, owned action plan used for risk mitigation in M14.', screenshot: '25-p3-m11-resistance-logged.png' },
        ],
      },
    ],
    frameworkUpdate: {
      lewin: 'Change',
      prosci: 'Manage',
      bridges: 'Neutral Zone',
      justification: 'Desire scored and diagnosed as stalled, sentiment explicitly moved to Resistance/Anger, and resistance logged with an active mitigation plan together confirm the population is now actively engaging with (resisting) the change rather than merely hearing about it — Lewin and Prosci settle into Change/Manage, and Bridges moves to Neutral Zone: the old way is being let go of, even if unwillingly.',
    },
    exitChecklist: {
      items: [
        'Desire is scored with a justification that names the specific gap against Awareness',
        'Sentiment position reflects real evidence, not the platform’s default',
        'Resistance is logged with a named owner',
        'A mitigation action exists with an owner and a due date',
      ],
      decision: 'GO if the mitigation action is scheduled within two weeks; NO-GO — escalate to Sponsor — if resistance is logged but no mitigation owner has been assigned.',
    },
  },

  {
    id: 'Phase 4',
    name: 'Reinforce & Adopt',
    goals: [
      'Confirm managers are ready to lead the change, review the sustainment checkpoints that will catch regression, and mark go-live on the journey map.',
    ],
    pmTasks: [],
    cmTasks: [
      {
        id: 'CM4.1',
        name: 'Assess manager readiness',
        sipoc: {
          suppliers: 'Change Manager’s direct observation of the manager cohort',
          inputs: 'Readiness rating (1–5), justification',
          process: ['Open M12', 'Stage a readiness rating', 'Save with justification'],
          outputs: 'A justified manager-readiness rating gating whether the team-scoped coaching flow is trustworthy',
          customers: 'M12’s own Manager Coaching Script Generator',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: '', cm: 'A/R', peopleManager: 'C', employee: '' },
        steps: [
          { module: 'M12 · Manager as Coach', action: 'Stage and save the manager readiness rating', userInput: 'Open Manager as Coach ● Stage a readiness rating of 4 ● Save with justification: "Ran the first cutover briefing unprompted this week and fielded floor questions without escalating — clear improvement from the tentative rating logged at kickoff."', expectedResult: 'Manager readiness moves to 4/5 with the evidence stored alongside it.', screenshot: '26-p4-m12-readiness-scored.png' },
        ],
      },
      {
        id: 'CM4.2',
        name: 'Review sustainment checkpoints',
        sipoc: {
          suppliers: 'Post-go-live adoption data (once available)',
          inputs: '30/60/90-day checkpoint definitions, adoption rate, regression risk',
          process: ['Open M13', 'Review the seeded 30/60/90-day checkpoints ahead of go-live'],
          outputs: 'Confirmed checkpoint dates and owners, ready to receive real adoption data after cutover',
          customers: 'M15 Analytics; the go-live decision itself',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'I', cm: 'A/R', peopleManager: 'C', employee: '' },
        steps: [
          { module: 'M13 · Sustainment', action: 'Review the seeded checkpoints', userInput: 'Open Sustainment and confirm the 30/60/90-day checkpoints are dated relative to the planned go-live.', expectedResult: 'All three checkpoints show status "not due" with adoption rate and regression risk still blank — they activate once go-live is marked.', screenshot: '27-p4-m13-checkpoints-reviewed.png' },
        ],
      },
      {
        id: 'CM4.3',
        name: 'Mark go-live on the journey map',
        sipoc: {
          suppliers: 'PMO cutover confirmation; the Main Project’s Month 9 delivery date',
          inputs: 'Go-live date, journey map event label',
          process: ['Open M16', 'Add the go-live event to the journey map'],
          outputs: 'A visible go-live marker on the journey map, anchoring every "before/after" comparison from here on',
          customers: 'M13 Sustainment (checkpoints activate relative to this date); M18’s Gantt go-live line',
        },
        racsi: { sponsor: 'A', superAdmin: '', pmo: 'R', cm: 'C/R', peopleManager: 'I', employee: 'I' },
        steps: [
          { module: 'M16 · Journey Map', action: 'Mark go-live', userInput: 'Add journey event: "Technical cutover — go-live", dated Month 9, Week 2 — matching the Main Project’s Description from Phase 0.', expectedResult: 'The go-live marker appears on the journey map; the 30/60/90-day sustainment checkpoints in M13 now activate against this date.', screenshot: '28-p4-m16-golive-marked.png' },
        ],
      },
    ],
    frameworkUpdate: {
      lewin: 'Change → Refreeze (transitioning)',
      prosci: 'Manage → Reinforce (transitioning)',
      bridges: 'Neutral Zone → New Beginning (transitioning)',
      justification: 'A justified manager-readiness improvement, confirmed sustainment checkpoints, and the go-live marker itself together signal the population is moving from actively managing the change toward reinforcing it — all three frameworks begin their final transition toward their post-go-live steady state.',
    },
    exitChecklist: {
      items: [
        'Manager readiness is rated with evidence, not a default guess',
        '30/60/90-day sustainment checkpoints are confirmed and dated',
        'Go-live is marked on the journey map at the date named in the Main Project’s Description',
        'No open high-severity risk lacks a mitigation owner heading into cutover',
      ],
      decision: 'GO — cutover readiness confirmed across manager coaching, sustainment and risk; proceed to Phase 5.',
    },
  },

  {
    id: 'Phase 5',
    name: 'Sustain, Analyze & Benchmark',
    goals: [
      'Give the portfolio more than one project so roll-ups are meaningful, confirm the Readiness Index at every level, benchmark against peers, and close the loop on the WBS baseline set in Phase 1.',
    ],
    pmTasks: [
      {
        id: 'PM5.1',
        name: 'Expand the portfolio',
        sipoc: {
          suppliers: 'PMO; Organization Admin',
          inputs: 'Additional CM Project names, types, owners',
          process: ['Add a second CM Project under Kenitra', 'Add a third CM Project under the Tangier Organization'],
          outputs: 'A three-project portfolio spread across two Organizations sharing one Group',
          customers: 'PM5.2 (Readiness Index roll-up); PM5.3 (benchmarking)',
        },
        racsi: { sponsor: 'I', superAdmin: 'S', pmo: 'A/R', cm: 'C', peopleManager: '', employee: '' },
        steps: [
          { module: 'M1 · Hierarchy', action: 'Add two more CM Projects', userInput: 'Under Kenitra Precision Manufacturing: "Warehouse Automation Adoption Track" (Process change, standalone). Under the Tangier Organization: "Tangier Plant Adoption Program" (Technology change).', expectedResult: 'The portfolio now has three CM Projects across two Organizations sharing one Group — enough real data for a Group-level roll-up to mean something.', screenshot: '29-p5-m1-portfolio-three-cm-projects.png' },
        ],
      },
      {
        id: 'PM5.2',
        name: 'Confirm the Readiness Index at every level',
        sipoc: {
          suppliers: 'All three CM Projects’ ADKAR/sentiment/training/risk data',
          inputs: 'Roll-up level selector (Project / Organization / Group)',
          process: ['Open the Portfolio Dashboard', 'Switch between Project, Organization and Group roll-up levels'],
          outputs: 'A confirmed Readiness Index visible at every level the signed-in role is permitted to see',
          customers: 'Executive Viewer; Group Admin',
        },
        racsi: { sponsor: 'I', superAdmin: 'S', pmo: 'A/R', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'Dashboard', action: 'Switch roll-up levels', userInput: 'On the Portfolio Dashboard, switch the level selector from Project → Organization → Group.', expectedResult: 'Each level aggregates only what that role’s scope permits — Group level shows both Organizations’ combined readiness, never a sibling Group.', screenshot: '30-p5-dashboard-rollup-levels.png' },
        ],
      },
      {
        id: 'PM5.3',
        name: 'Benchmark against portfolio peers',
        sipoc: {
          suppliers: 'The three-project portfolio (PM5.1); seeded peer benchmark bands',
          inputs: 'Readiness Index per project, sector reference band',
          process: ['Open M15’s Benchmarking tab', 'Compare each project’s standing against the reference band'],
          outputs: 'A standing label per project — ahead of, in line with, or behind reference',
          customers: 'Executive reporting narratives (M17’s Executive Readiness Narrative Generator)',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'A/R', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'M15 · Benchmarking', action: 'Review standing against the peer reference band', userInput: 'Open M15 · Analytics, switch to the Benchmarking tab.', expectedResult: 'Each project is labeled ahead of / in line with / behind the sector reference band, computed from the same peer-average formula documented in Appendix A.', screenshot: '31-p5-benchmarking-tab.png' },
        ],
      },
      {
        id: 'PM5.4',
        name: 'Review the WBS schedule gap — baseline vs. actual',
        sipoc: {
          suppliers: 'Every task completed since Phase 1 (their real start/finish dates)',
          inputs: 'Actual start/finish dates for each completed WBS task',
          process: ['Open M18', 'Enter actual dates for tasks completed since the baseline was set', 'Review the resulting schedule-gap badges and portfolio average'],
          outputs: 'A confirmed baseline-vs-actual gap per task and a portfolio-level average schedule variance',
          customers: 'PMO status reporting; the Sponsor’s program-status view',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'A/R', cm: 'C', peopleManager: '', employee: '' },
        steps: [
          { module: 'M18 · WBS & Gantt', action: 'Enter actual dates for completed tasks', userInput: 'For each task completed since Phase 1 (e.g. "Score initial Awareness", "Establish baseline sponsor visibility"), edit the task and fill its actual start/finish from what really happened.', expectedResult: 'Each task’s Gantt row now shows both a baseline bar (outlined) and an actual bar (solid) — most land close to plan; the training curriculum, which ran longer than scheduled, shows a visible amber/red gap badge.', screenshot: '32-p5-m18-actuals-entered.png' },
          { module: 'M18 · WBS & Gantt', action: 'Review the portfolio-level schedule gap', userInput: 'Check the stat cards at the top of M18.', expectedResult: 'The "Avg. schedule gap" stat card gives one number for the whole program’s schedule health — the same figure a Sponsor would ask for in a status update.', screenshot: '33-p5-m18-gap-summary.png' },
        ],
      },
    ],
    cmTasks: [],
    frameworkUpdate: {
      lewin: 'Refreeze',
      prosci: 'Reinforce',
      bridges: 'New Beginning (once checkpoint adoption data confirms it)',
      justification: 'Portfolio expansion, a confirmed multi-level Readiness Index, peer benchmarking and a closed-loop schedule-gap review together mark the program settling into its new steady state — Lewin Refreeze and Prosci Reinforce are now justified by real post-go-live structure, not just elapsed time; Bridges reaches New Beginning only once the 30/60/90-day checkpoints (M13) actually confirm adoption is holding.',
    },
    exitChecklist: {
      items: [
        'Portfolio contains enough projects for a Group-level roll-up to be meaningful',
        'Readiness Index is confirmed and correctly scoped at Project, Organization and Group level',
        'Every project has a benchmarking standing against its sector reference band',
        'Every completed WBS task has an actual date entered, with the resulting gap reviewed',
      ],
      decision: 'GO — portfolio, benchmarking and schedule-gap review are all current; proceed to Phase 6.',
    },
  },

  {
    id: 'Phase 6',
    name: 'Governance, Multi-Tenancy, RBAC & Language',
    goals: [
      'Exercise the platform-administration surface: AI governance, user provisioning and RBAC, tenant-language precedence, and cascading delete.',
    ],
    pmTasks: [
      {
        id: 'PM6.1',
        name: 'Govern AI use-case activation',
        sipoc: {
          suppliers: 'Super Admin’s global AI Use Case catalog',
          inputs: 'Use-case activation toggle per Organization',
          process: ['Open M17', 'Activate a use case for Kenitra Precision Manufacturing only'],
          outputs: 'A use case live for one Organization and switched off for the Tangier Organization',
          customers: 'Every module the use case plugs into',
        },
        racsi: { sponsor: '', superAdmin: 'A/R', pmo: 'C', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'M17 · AI Use Case Library', action: 'Activate a use case for one Organization only', userInput: 'Open M17, activate "Divergence Pattern Detector" for Kenitra Precision Manufacturing, leave it off for the Tangier Organization.', expectedResult: 'The catalog shows the use case as active for one Organization and inactive for the other — activation is always per-tenant, never global.', screenshot: '34-p6-m17-activation.png' },
        ],
      },
      {
        id: 'PM6.2',
        name: 'Provision users & verify RBAC',
        sipoc: {
          suppliers: 'Organization Admin; new-hire or role-change requests',
          inputs: 'User name, email, role, scope',
          process: ['Open M2', 'Create a new user scoped to one Project', 'Sign in as that user to verify scope'],
          outputs: 'A correctly scoped user account whose visibility is verifiably limited to their assigned Project',
          customers: 'The platform’s entire RBAC model',
        },
        racsi: { sponsor: '', superAdmin: 'A', pmo: '', cm: '', peopleManager: '', employee: '' },
        steps: [
          { module: 'M2 · Identity & RBAC', action: 'Create a scoped user', userInput: 'Add user "Nadia Squalli", role: People Manager, scope: Project — Enterprise Platform Renewal — People Readiness.', expectedResult: 'The new user appears in the Users tab with her exact role and scope.', screenshot: '35-p6-m2-user-created.png' },
          { module: 'M2 · Identity & RBAC', action: 'Verify scope by signing in as the new user', userInput: 'Sign out, sign back in as Nadia Squalli.', expectedResult: 'Her session only ever shows the one Project she’s scoped to — no other Organization or CM Project is reachable, confirming the role × scope model from the spec.', screenshot: '36-p6-m2-scoped-session.png' },
        ],
      },
      {
        id: 'PM6.3',
        name: 'Verify tenant-language precedence',
        sipoc: {
          suppliers: 'Organization default-language setting; the signed-in user’s personal language',
          inputs: 'Organization switch between Kenitra (FR default) and Tangier',
          process: ['Switch Organization in the top bar', 'Observe which language the UI falls back to'],
          outputs: 'Confirmed precedence: personal choice, then tenant default, then platform fallback',
          customers: 'Every screen in the application',
        },
        racsi: { sponsor: '', superAdmin: 'A/R', pmo: '', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'TopBar', action: 'Switch Organization and observe language precedence', userInput: 'Switch from Kenitra Precision Manufacturing to the Tangier Organization in the top bar.', expectedResult: 'The interface re-applies whichever default language the Tangier Organization is configured with, unless the signed-in user has their own personal language override set — confirming the precedence order documented in Section 3.1.1 of the spec.', screenshot: '37-p6-toplevel-language-switch.png' },
        ],
      },
      {
        id: 'PM6.4',
        name: 'Delete a project & verify cascading cleanup',
        sipoc: {
          suppliers: 'A disposable test CM Project created for this demonstration',
          inputs: 'Delete confirmation',
          process: ['Create a throwaway CM Project', 'Delete it', 'Confirm its user accounts and AI override state are gone too'],
          outputs: 'Confirmed cascading delete behavior, matching the spec’s Section 3.2.1',
          customers: 'Data-integrity confidence for any Admin performing cleanup',
        },
        racsi: { sponsor: '', superAdmin: 'A/R', pmo: 'C', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'M1 · Hierarchy', action: 'Delete the throwaway CM Project and verify cleanup', userInput: 'Create a disposable "Cascade Test Project", then delete it from M1.', expectedResult: 'The project, any user scoped directly to it, and its AI-override state all disappear together — exactly the cascading behavior documented in the spec, verified live rather than taken on faith.', screenshot: '38-p6-m1-cascade-delete.png' },
        ],
      },
    ],
    cmTasks: [],
    frameworkUpdate: {
      lewin: 'n/a — platform/administrative, not a change-lifecycle phase',
      prosci: 'n/a',
      bridges: 'n/a',
      justification: 'Phase 6 exercises platform administration — AI governance, RBAC, localization, cascading delete — none of which is a Change Management Project lifecycle event, so no framework state moves.',
    },
    exitChecklist: {
      items: [
        'AI use-case activation is confirmed per-Organization, not global',
        'A newly provisioned user’s visibility is verified to match their assigned scope exactly',
        'Tenant-language precedence behaves as documented when switching Organizations',
        'Cascading delete removes a project’s users and AI-override state along with it',
      ],
      decision: 'GO — governance and administration surface verified; proceed to Phase 7.',
    },
  },

  {
    id: 'Phase 7',
    name: 'Justification Governance, AI Diagnosis & LLM Connection',
    goals: [
      'Configure the Permission Matrix and the platform-wide justification requirement, activate AI use cases at the Organization level, connect a real LLM provider, and close out the risk mitigation, divergence-detection and coaching workflows.',
    ],
    pmTasks: [
      {
        id: 'PM7.1',
        name: 'Configure the Permission Matrix & justification governance',
        sipoc: {
          suppliers: 'Super Admin; the platform’s default role × capability mapping',
          inputs: 'Capability toggles per role; the platform-wide Require Justification setting',
          process: ['Open M2’s Permission Matrix tab', 'Review or adjust a capability for one role', 'Open the Governance Settings tab', 'Confirm the Require Justification toggle'],
          outputs: 'A documented, runtime-configured permission model and a confirmed justification-governance setting',
          customers: 'Every write-access check across the entire application',
        },
        racsi: { sponsor: '', superAdmin: 'A/R', pmo: 'C', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'M2 · Permission Matrix', action: 'Review the runtime-configurable Permission Matrix', userInput: 'Open M2, switch to the Permission Matrix tab.', expectedResult: 'A grid of nine roles × five capabilities (Manage Hierarchy, Manage Users, Edit CM Project Data, Activate AI Use Cases, Override AI Use Cases), seeded from the documented defaults and editable in place by a Super Admin — changing a cell here changes behavior everywhere, immediately, with no code change.', screenshot: '39-p7-m2-permission-matrix.png' },
          { module: 'M2 · Governance Settings', action: 'Confirm the platform-wide justification requirement', userInput: 'Switch to the Governance Settings tab. Confirm "Require Justification" is ON (the default).', expectedResult: 'Every score/state-change save flow across M4, M6, M7, M8, M10, M11, M12 and M14 reads this same toggle — turning it off makes the justification note optional everywhere at once, rather than per module.', screenshot: '40-p7-m2-governance-settings.png' },
        ],
      },
      {
        id: 'PM7.2',
        name: 'Activate AI use cases for the Organization',
        sipoc: {
          suppliers: 'Organization Admin; the global AI Use Case catalog',
          inputs: 'Use-case activation choices for Kenitra Precision Manufacturing',
          process: ['Open M17', 'Activate the remaining recommended use cases for this Organization'],
          outputs: 'A fuller set of Assistive/Augmented AI use cases live for this Organization',
          customers: 'Change Manager, Trainer, Communications Practitioner (consumption)',
        },
        racsi: { sponsor: '', superAdmin: 'C', pmo: 'A/R', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'M17 · AI Use Case Library', action: 'Activate the remaining recommended use cases', userInput: 'Activate "Sentiment & Emotion Classifier" and "Manager Coaching Script Generator" for Kenitra Precision Manufacturing.', expectedResult: 'Both use cases now show as active, and their assistive/augmented suggestion boxes appear live on M7 and M12 respectively.', screenshot: '41-p7-m17-usecases-activated.png' },
        ],
      },
      {
        id: 'PM7.3',
        name: 'Connect a real LLM provider',
        sipoc: {
          suppliers: 'Organization Admin; the chosen LLM provider’s API key',
          inputs: 'Provider selection, API key, model choice',
          process: ['Open M17’s Provider Connection panel', 'Select a provider and model', 'Save the connection'],
          outputs: 'A live LLM connection routing AI use cases through a real model instead of the built-in generator',
          customers: 'Every AI Use Case in the library',
        },
        racsi: { sponsor: '', superAdmin: 'A/R', pmo: 'C', cm: 'I', peopleManager: '', employee: '' },
        steps: [
          { module: 'M17 · Provider Connection', action: 'Configure the LLM Provider Connection', userInput: 'Open the Provider Connection panel at the top of M17. Provider: Anthropic (Claude); Model: the recommended default from the curated shortlist; API key: pasted into the password-masked field.', expectedResult: 'The panel is ready to test — clicking "Connect" sends the key and a test prompt directly from this browser to the provider; on success every AI Use Case switches from its built-in generator to the real model, and on any failure (bad key, network, CORS) it falls back to the built-in generator automatically rather than blocking the workflow.', screenshot: '42-p7-m17-llm-connected.png' },
        ],
      },
    ],
    cmTasks: [
      {
        id: 'CM7.1',
        name: 'Complete the risk mitigation action plan with justification',
        sipoc: {
          suppliers: 'The high-severity risk logged in CM2.2; its mitigation action owner',
          inputs: 'Mitigation action description, owner, due date; risk status change, justification',
          process: ['Open M14', 'Log the mitigation action against the risk', 'Stage the risk status to closed', 'Save with justification'],
          outputs: 'A closed-loop, justified risk record from open through mitigated',
          customers: 'M4’s Change Log; the Phase 3 exit checklist this risk was tied to',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: 'I', cm: 'A/R', peopleManager: '', employee: '' },
        steps: [
          { module: 'M14 · Risk Register', action: 'Log the mitigation action and close the risk with justification', userInput: 'Expand "Mitigation actions" on the training-time risk. Action: "Protected training time formally added to both plants\' shift schedules"; Owner: Karim Chraibi; Due: 2026-02-20. Add the action, stage risk status "mitigating" → "closed" ● Save with justification: "Protected training time was formally added to both plants\' shift schedules starting this week, confirmed with both Plant Directors."', expectedResult: 'The risk moves to "closed" with its mitigation action and the closing justification both visible in the same panel — the same stage-then-justify pattern used everywhere else in journi, here applied to a risk\'s status field.', screenshot: '43-p7-m14-risk-closed.png' },
        ],
      },
      {
        id: 'CM7.2',
        name: 'Detect hidden-resistance divergence',
        sipoc: {
          suppliers: 'ADKAR Knowledge/Ability scores; Bridges/sentiment position',
          inputs: 'Current ADKAR and Bridges/sentiment readings',
          process: ['Open M7', 'Run the Divergence Pattern Detector'],
          outputs: 'A flagged divergence — strong Knowledge/Ability against a lagging emotional position — for the Change Manager to review',
          customers: 'Change Manager (decides whether to act, no automatic action)',
        },
        racsi: { sponsor: 'I', superAdmin: '', pmo: '', cm: 'A/R', peopleManager: '', employee: '' },
        steps: [
          { module: 'M7 · Divergence Pattern Detector', action: 'Run the divergence check', userInput: 'Open M7 and review the Divergence Pattern Detector panel.', expectedResult: 'The detector flags that Knowledge and Ability are now comparatively strong while the cohort remains near Bridges "Ending" — a classic hidden-resistance pattern surfaced for review, never acted on automatically.', screenshot: '44-p7-m7-divergence-flagged.png' },
        ],
      },
      {
        id: 'CM7.3',
        name: 'Diagnose & coach the stalled Desire block',
        sipoc: {
          suppliers: 'The stalled Desire reading (CM3.1); the Manager Coaching Script Generator (PM7.2)',
          inputs: 'Stalled ADKAR block, manager cohort',
          process: ['Open M12', 'Generate a coaching script targeted at the stalled Desire block', 'Accept it', 'Log the resulting coaching note from M6'],
          outputs: 'A human-reviewed coaching script (recorded to the AI usage audit trail) and a logged coaching note closing the loop from diagnosis to action',
          customers: 'People Manager (delivers the coaching); M6’s coaching-note history',
        },
        racsi: { sponsor: '', superAdmin: '', pmo: '', cm: 'A/C', peopleManager: 'R', employee: 'I' },
        steps: [
          { module: 'M12 · Manager Coaching Script Generator', action: 'Generate and accept a coaching script for the stalled Desire block', userInput: 'Generate a script targeted at the Desire barrier, then review and accept it.', expectedResult: 'The AI-generated script is clearly labeled "AI-generated — review required" until accepted; accepting logs the outcome to the AI usage audit trail on M17 — the human-in-the-loop checkpoint every AI use case in journi goes through.', screenshot: '45-p7-m12-coaching-logged.png' },
          { module: 'M6 · ADKAR Engine', action: 'Log the coaching note this script fed into', userInput: 'Back on M6, add a coaching note: Manager: Nadia Squalli; Cohort: Finance, Procurement, Warehouse & Production Planning; Barrier: Desire; Note: "Used the generated talking points for this week\'s 1:1s — leading with the trust concern directly rather than more process content."', expectedResult: 'The coaching note appears in both M6\'s and M12\'s history — M12\'s AI suggestion informed the conversation; the note itself is a separate, human-authored record of what was actually said, closing the diagnosis-to-coaching loop this tutorial has followed since Phase 3.', screenshot: '46-p7-m6-coaching-note-logged.png' },
        ],
      },
    ],
    frameworkUpdate: {
      lewin: 'n/a — platform/administrative, not a change-lifecycle phase',
      prosci: 'n/a',
      bridges: 'n/a',
      justification: 'Phase 7 closes out governance, AI activation and the risk/divergence/coaching loop rather than advancing the Change Management Project’s own lifecycle — the framework states set at the end of Phase 5 stand as this program’s final reading.',
    },
    exitChecklist: {
      items: [
        'Permission Matrix reflects a deliberate, documented decision for every role × capability cell',
        'Require Justification setting is confirmed and understood platform-wide',
        'A real LLM provider is connected, with confirmed automatic fallback if it fails',
        'The Phase 2 risk is closed with justification, divergence is checked, and the stalled Desire block has a logged coaching action',
      ],
      decision: 'GO — governance, AI connection and the closed-loop diagnosis-to-coaching cycle are all confirmed. Program readiness record is complete end-to-end.',
    },
  },
]
