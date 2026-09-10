// Shared written content for both journi guides: KPI/Index formula appendix
// and the Lewin / Prosci / Bridges framework decision-framework section.
// Kept as plain data (arrays of paragraph specs) so both generate scripts
// can render it with their own docx styling helpers.

export const KPI_SECTIONS = [
  {
    name: 'Composite Readiness Index',
    module: 'Module 15 · Metrics & Analytics Dashboard, Dashboard, Module 4',
    inputs: [
      'ADKAR average — the mean of the five ADKAR block scores (Awareness, Desire, Knowledge, Ability, Reinforcement), each entered by a Change Manager / Practitioner on Module 6 on a 1–5 scale.',
      'Sentiment stage — inferred from the free-text Emotional & Transition snapshot on Module 7 (or set directly), one of Denial / Resistance / Exploration / Commitment.',
      'Training completion — the average completion percentage across every curriculum/track logged on Module 10 for the project.',
    ],
    formula: [
      'adkarPct = (average of the 5 ADKAR block scores ÷ 5) × 100',
      'sentimentPct = a fixed score per sentiment stage — Denial 20, Resistance 40, Exploration 70, Commitment 100',
      'trainingPct = average completion % across all logged curricula',
      'Composite Readiness Index = round( adkarPct × 0.50 + sentimentPct × 0.25 + trainingPct × 0.25 )',
    ],
    why: 'The 50/25/25 weighting deliberately makes individual capability (ADKAR) the dominant signal, since Awareness/Desire/Knowledge/Ability/Reinforcement is the most direct proxy for whether a person can and will actually adopt the change, while sentiment and training are treated as important but secondary corroborating signals. The Index is expressed 0–100 for direct comparability with the Benchmarking reference bands (below).',
    where: 'Shown on Module 4 (Initiative Registry) per project, Module 15 (Analytics) at Project / Organization / Group level, and the Portfolio Dashboard\'s "Avg. Readiness Index" tile.',
  },
  {
    name: 'ADKAR Block Escalation Flag',
    module: 'Module 6 · ADKAR Engine',
    inputs: ['Each ADKAR block score (1–5), entered by a Change Manager or Practitioner, with a free-text barrier-reason note.'],
    formula: ['isBlockStalled = (block score ≤ 2)'],
    why: 'A score of 1 or 2 means the population is, on average, still unaware/unwilling/unable — below the midpoint of the scale. Any block at or below that line is auto-flagged "Escalated — stalled beyond threshold" and surfaced to the Change Manager on Module 6, because a stalled ADKAR block is the single most direct predictor of adoption failure for that step of the change.',
    where: 'Module 6 block cards (amber "Escalated" badge), and the project-level escalation banner listing every stalled block.',
  },
  {
    name: 'Divergence Pattern',
    module: 'Module 7 · Emotional & Transition',
    inputs: [
      'Knowledge and Ability ADKAR scores from Module 6.',
      'Current Bridges Transition phase from Module 7 (Ending / Neutral Zone / New Beginning).',
    ],
    formula: ['hasDivergence = (Knowledge ≥ 3 AND Ability ≥ 3) AND (Bridges phase === "Ending")'],
    why: 'This flags a specific, easy-to-miss failure mode: a cohort that is objectively capable on paper (they know how and are able to perform the new process) but is emotionally still stuck in Bridges\' Ending — grieving what was lost rather than engaging with what is next. Because capability metrics look healthy, this pattern is invisible to a purely skills-based view; cross-referencing Module 6 and Module 7 is what surfaces it. It typically means the emotional/psychological work (listening, acknowledging loss) is lagging the technical enablement work and needs direct attention before the population will act on what it already knows.',
    where: 'Module 7, as a red "Divergence Alert" banner with a one-line explanation, and via the Divergence Pattern Detector AI assistant.',
  },
  {
    name: 'Risk Score & High-Severity Flag',
    module: 'Module 14 · Risk Register',
    inputs: ['Likelihood (1–5) and Impact (1–5), both entered by whoever logs the risk.'],
    formula: ['riskScore = likelihood × impact  (range 1–25)', 'isHighSeverityRisk = (riskScore ≥ 12)'],
    why: 'A simple likelihood × impact product is the standard risk-matrix approach; the ≥12 threshold corresponds to the upper-right quadrant of a 5×5 matrix (e.g. likelihood 3 × impact 4, or likelihood 4 × impact 3, or higher) — risks that are both fairly likely and fairly damaging. Those are prioritized with a red badge over merely "amber" moderate risks (score 8–11).',
    where: 'Module 14 risk table, sorted highest-score-first, with a red/amber/brand-colored score badge.',
  },
  {
    name: 'High-Impact / Low-Influence Stakeholder Flag',
    module: 'Module 5 · Stakeholder & Impact Mapping',
    inputs: [
      'Five impact-dimension scores per stakeholder group (Process, Technology, Role, Location, Identity — each 1–5), entered when the group is created.',
      'Influence score (1–5) for that same group.',
    ],
    formula: [
      'avgImpact = (process + tech + role + location + identity) ÷ 5',
      'isHighImpactLowInfluence = (avgImpact ≥ 3.6) AND (influence ≤ 2)',
    ],
    why: 'This is the classic change-management "vulnerable population" pattern: a group that will be heavily affected by the change (average impact at or above 3.6 out of 5 across all five change dimensions) but has little organizational power to shape or resist it (influence ≤ 2). Because they cannot advocate loudly for themselves, these groups are the ones most likely to be under-communicated-to and under-supported unless explicitly flagged — so the system raises a red "High Impact / Low Influence" badge automatically rather than waiting for someone to notice.',
    where: 'Module 5 stakeholder table, red badge in the Status column.',
  },
  {
    name: 'Training Completion Average',
    module: 'Module 10 · Training, feeds the Composite Readiness Index',
    inputs: ['Completion % (0–100) per curriculum/track, updated as cohorts progress through training.'],
    formula: ['trainingCompletionAvg = average of the completion % across every curriculum logged for the project (0 if none logged yet)'],
    why: 'A simple, unweighted average across curricula was chosen over headcount-weighting to keep the metric transparent and auditable by a non-technical Change Manager — every curriculum counts equally toward the readiness picture regardless of cohort size, since a small but critical specialist cohort left untrained is just as much a go-live risk as a large one.',
    where: 'Feeds directly into the Composite Readiness Index; also shown per-curriculum as a progress bar on Module 10.',
  },
  {
    name: 'Manager Readiness Rating',
    module: 'Module 12 · Manager as Coach',
    inputs: ['A 1–5 self-assessment entered by (or on behalf of) the People Manager for their own reporting line.'],
    formula: ['Stored as-is (managerReadiness, 1–5) — not currently blended into the Composite Readiness Index.'],
    why: 'Deliberately kept as a standalone, manager-scoped signal rather than folded into the org-wide Composite Readiness Index: a manager must be ready to lead the change before their team can be, and mixing that leading indicator into the lagging Index would obscure which lever to pull. It exists to prompt a direct coaching conversation, not to move a dashboard number.',
    where: 'Module 12, alongside the manager\'s own team-scoped ADKAR heat-map (never org-wide data — role-based visibility keeps a People Manager restricted to their own reporting line).',
  },
  {
    name: 'Regression Risk (Post-Go-Live)',
    module: 'Module 13 · Sustainment',
    inputs: ['Adoption rate % recorded at each 30/60/90-day checkpoint by the Change Manager ("Record checkpoint").'],
    formula: [
      'regressionRisk = "low" if adoptionRate > 80',
      'regressionRisk = "moderate" if 60 < adoptionRate ≤ 80',
      'regressionRisk = "high" if adoptionRate ≤ 60',
    ],
    why: 'Adoption below 60% at a post-go-live checkpoint means a majority of the target population has reverted to (or never left) the old way of working — the classic sign that reinforcement is failing and the change may regress entirely without intervention. The three-band split gives the Change Manager an unambiguous signal of how urgently to act.',
    where: 'Module 13 checkpoint cards and the Regression Risk Predictor AI assistant.',
  },
]

export const BENCHMARK_SECTION = {
  name: 'Change Management Benchmarking',
  module: 'Module 15 · Benchmarking tab — Project / Organization / Group level',
  inputs: [
    'Each project\'s Composite Readiness Index (see above) and current Lewin macro-state (Unfreeze / Change / Refreeze).',
    'A seeded reference band per Lewin phase — illustrative, not sourced from an external industry study — expressing a typical low/mid/high Composite Readiness Index range for initiatives currently at that phase: Unfreeze 20–50%, Change 40–70%, Refreeze 60–90%.',
    'The peer average — the mean Composite Readiness Index of every other project in scope at the active roll-up level (Project has no peers, Organization compares against sibling CM projects in the same org, Group compares across every org in the Group).',
  ],
  formula: [
    'standing = "behind" if Composite Readiness Index < band.low',
    'standing = "in line with reference" if band.low ≤ Composite Readiness Index < band.high',
    'standing = "ahead" if Composite Readiness Index ≥ band.high',
  ],
  why: 'Benchmarking answers a different question than the raw Index does: not "is this project healthy in absolute terms" but "is this project tracking normally for where it is in the Lewin lifecycle." A newly-launched Unfreeze-phase project reading 34% is not a red flag — the reference band for Unfreeze (20–50%) expects exactly that range, because Unfreeze is definitionally the phase where readiness is still low. The same 34% reading during Refreeze (band 60–90%) would be a serious problem. Comparing against the phase-appropriate band, rather than a single global threshold, avoids penalizing early-phase projects and avoids missing genuinely stalled late-phase ones.',
  levels: 'Because Benchmarking runs through the same Project / Organization / Group level selector as the rest of Module 15, a Change Manager sees their one project against its own reference band with no peer average (nothing to compare within a single project); an Organization Admin sees every CM project in their Organization compared against each other and the same band; a Group Admin — only where the Organization actually belongs to a Group — sees every project across every Organization in the Group, letting a holding-company-level sponsor spot which subsidiary is lagging without opening each Organization individually.',
}

// -------------------------------------------------------------------------
// Framework decision-framework content: Lewin / Prosci ADKAR / Bridges
// -------------------------------------------------------------------------

export const FRAMEWORK_OVERVIEWS = [
  {
    name: "Lewin's Change Management Model",
    summary:
      'The oldest of the three (Kurt Lewin, 1947) and the coarsest-grained. It describes change at the level of an organizational system moving through three macro-states: Unfreeze (destabilize the current equilibrium — build the case that the status quo is not sustainable), Change / Transition (the system is actively moving — old patterns have been let go, new ones are not yet habitual), and Refreeze (the new state is stabilized and reinforced until it becomes "the way things are done" again). journi uses Lewin as the top-level phase indicator on every CM Project because it maps cleanly onto a Main Project\'s own lifecycle stages (Initiate/Plan → Execute → Close/Hypercare).',
  },
  {
    name: "Prosci's ADKAR / 3-Phase Process",
    summary:
      "Prosci's model operates at two grains simultaneously. At the individual level, ADKAR (Awareness, Desire, Knowledge, Ability, Reinforcement) is a sequential checklist for what one person needs, in order, to change successfully — you cannot build Desire in someone who lacks Awareness, and training (Knowledge) delivered before Desire exists is usually wasted. At the program level, Prosci groups activity into three phases — Prepare (build the approach), Manage (execute the plan — communicate, train, coach, handle resistance), Reinforce (sustain the change, celebrate wins, prevent regression). journi's ADKAR Engine (Module 6) is the individual-level instrument; the Prepare/Manage/Reinforce label shown alongside Lewin is the program-level one.",
  },
  {
    name: "Bridges' Transition Model",
    summary:
      "William Bridges' contribution is explicitly psychological rather than procedural: it describes the emotional journey a person goes through, which is not the same timeline as the technical/organizational rollout. Ending, Losing, Letting Go (grief for what is being given up, even when the change is objectively positive); the Neutral Zone (an uncomfortable in-between where old ways no longer apply and new ways are not yet confident or automatic); and the New Beginning (genuine buy-in and new identity formed around the new way of working). journi tracks Bridges alongside a separate Kübler-Ross-derived sentiment stage (Denial/Resistance/Exploration/Commitment) on Module 7 specifically because emotional readiness frequently lags — or occasionally leads — the technical/procedural readiness that Lewin and ADKAR describe, and the gap between them is itself diagnostic (see \"Divergence Pattern\" in the KPI appendix).",
  },
]

export const FRAMEWORK_DECISION_CRITERIA = [
  'Ask three separate questions, not one: (1) Where is the organizational system as a whole — Lewin? (2) Where is the individual, block by block — ADKAR — and which Prosci program phase does that imply? (3) Where is the population emotionally — Bridges/sentiment? These frequently move at different speeds; forcing them into a single number hides exactly the information a Change Manager needs.',
  'Lewin (Unfreeze / Change / Refreeze) is decided primarily by the Main Project\'s own lifecycle stage and the state of the burning platform: Unfreeze while the case for change is still being built and the population has not yet been asked to do anything differently; Change once the population is actively being asked to work differently (even if imperfectly); Refreeze once the new way is the default and the job is sustaining it, not driving it.',
  'The Prosci phase (Prepare / Manage / Reinforce) is decided primarily by which ADKAR blocks are the current bottleneck: if Awareness/Desire are the stalled blocks, the work is still Prepare — you have not yet earned the right to train or manage execution. If Knowledge/Ability are the active work (training is running, coaching is happening), that is Manage. If Awareness through Ability all read acceptably and the open question is whether it sticks (Reinforcement, checkpoint adoption data), that is Reinforce.',
  'Bridges (Ending / Neutral Zone / New Beginning) is decided from the emotional evidence directly — sentiment snapshots, resistance log themes, coaching notes — not inferred from Lewin or ADKAR. A population can be in Bridges\' Ending (grieving) while Lewin says Change and ADKAR\'s Knowledge/Ability are strong; that combination is exactly the Divergence Pattern the system flags automatically, and it is a signal to invest in listening and acknowledgment, not more training.',
  'When in doubt, weight the emotional/Bridges read as the leading indicator and the ADKAR/Lewin read as the lagging one: skills and process metrics improve first because they can be taught and mandated, while genuine emotional acceptance of the loss and the new identity tends to trail behind and is the harder, slower thing to move.',
]

// Six illustrative phase mappings used across the guides — the "why" text is
// what the tutorial and user guide both quote when justifying a phase label.
export const PHASE_JUSTIFICATIONS = [
  {
    phase: 'Phase 1 — Initiate & Diagnose',
    lewin: 'Unfreeze',
    prosci: 'Prepare',
    bridges: 'Ending',
    why: 'The burning platform is being established (legacy platform losing vendor support, Board mandate) but no one has been asked to work differently yet — that is squarely Unfreeze. ADKAR work has not started (blocks are at or near baseline), so Prosci is still Prepare: building the case, the plan, the sponsor coalition. Even this early, Bridges is scored Ending because announcing a change — however well-justified — starts a loss process for anyone attached to the current way of working; the emotional clock starts before the technical one does.',
  },
  {
    phase: 'Phase 2 — Plan & Prepare',
    lewin: 'Unfreeze → Change (transitioning)',
    prosci: 'Prepare → Manage (transitioning)',
    bridges: 'Ending',
    why: 'Awareness activity (town halls) is underway and Awareness scores begin moving, but Desire, Knowledge and Ability remain untouched — the organization is still assembling its plan (risk register, comms plan, training curriculum) rather than executing it, which keeps Prosci in Prepare with an eye toward Manage. Lewin is transitional: the destabilizing case is landing, but the new state has not been asked of anyone yet. Bridges stays Ending — nothing has happened yet to give the population anything new to hold onto.',
  },
  {
    phase: 'Phase 3 — Mobilize & Execute',
    lewin: 'Change',
    prosci: 'Manage',
    bridges: 'Neutral Zone',
    why: 'The population is now actively being asked to change — Desire work is running into real skepticism (a stalled Desire score with a documented barrier reason), resistance is being logged and mitigated, training is live. That combination — old patterns actively disrupted, new ones not yet habitual, resistance being actively managed — is the textbook definition of Lewin\'s Change/Transition state and Prosci\'s Manage phase. Bridges moves to Neutral Zone: the old way is acknowledged as ending, but the new way is not yet confident or automatic, which is exactly the uncomfortable in-between Bridges describes.',
  },
  {
    phase: 'Phase 4 — Reinforce & Adopt',
    lewin: 'Change → Refreeze (transitioning)',
    prosci: 'Manage → Reinforce (transitioning)',
    bridges: 'Neutral Zone → New Beginning (transitioning)',
    why: 'Manager coaching and go-live milestones appear, and the first post-go-live checkpoints are being scheduled — the work is shifting from driving the change to sustaining it, which is the Manage-to-Reinforce hinge. Lewin mirrors that same hinge toward Refreeze. Bridges should show early movement toward New Beginning as specific milestones (go-live) give the population something concrete to attach identity to, though full New Beginning is not claimed until adoption data at 60–90 days actually confirms it — declaring it earlier would be aspirational rather than evidenced.',
  },
  {
    phase: 'Phase 5 — Sustain, Analyze & Benchmark',
    lewin: 'Refreeze',
    prosci: 'Reinforce',
    bridges: 'New Beginning (once checkpoint adoption data confirms it)',
    why: 'This phase is defined by measurement, not by new intervention: Composite Readiness Index, multi-level roll-ups, and Benchmarking against phase-appropriate reference bands are how the system confirms — rather than assumes — that Refreeze/Reinforce/New Beginning has actually been reached, and by how much of a margin. A project reading "ahead" of its Refreeze-phase reference band is validated as stabilized; one reading "behind" is flagged for continued reinforcement even though the calendar says the project should be done.',
  },
  {
    phase: 'Phase 6 — Governance, Multi-Tenancy & Access',
    lewin: 'n/a — platform/administrative, not a change-lifecycle phase',
    prosci: 'n/a',
    bridges: 'n/a',
    why: 'Hierarchy management, RBAC, AI governance, and tenant language configuration are platform capabilities that exist independently of any single CM Project\'s position in Lewin/ADKAR/Bridges — they are what makes it possible to run many projects, at many phases, across many tenants, correctly and safely at the same time.',
  },
]

// -------------------------------------------------------------------------
// Actions to take BEFORE changing any score or state field. journi never
// validates that a state change is evidence-based — a Change Manager (or any
// write-access role) can click a score button or a phase selector at any
// time. This is deliberate: journi is a record of judgment, not an
// automated survey engine. That makes the discipline of what happens right
// before the click the single biggest determinant of whether the resulting
// data is trustworthy. Each entry below is what should happen first.
// -------------------------------------------------------------------------
export const PRE_ACTION_GUIDANCE = [
  {
    field: 'ADKAR Block Score (1–5)',
    module: 'Module 6 · ADKAR Engine',
    before: [
      'Ground the new score in real evidence gathered since the last update — a recent pulse survey result, 1:1 or coaching-note theme, training completion trend, or direct observation. Never move a score on a gut estimate or because "it feels like it should be higher by now."',
      'Re-read the block\'s current barrier-reason note before touching the score. If you are raising the score, confirm the specific barrier already on file has actually been resolved — if it hasn\'t, the score shouldn\'t move yet, even if some progress is visible elsewhere.',
      'Cross-check against the Bridges phase and sentiment stage on Module 7. A jump in Knowledge or Ability with no corresponding movement in emotional readiness is often a sign you are measuring compliance (people did the training) rather than genuine capability (people can and will use it).',
      'If the score is moving down (a regression), write down why the barrier reappeared before saving — an undocumented regression gives the next reviewer a number with no explanation to act on.',
      'Always update the barrier-reason note in the same action as the score change. A bare number with a stale or empty note is not diagnostic — it just repeats a KPI value without the "why" that makes it actionable.',
    ],
  },
  {
    field: 'Bridges Transition Phase (Ending / Neutral Zone / New Beginning)',
    module: 'Module 7 · Emotional & Transition Layer',
    before: [
      'Base the phase on direct qualitative evidence — free-text pulse comments, resistance-log themes, coaching notes — not on the calendar, and not by inferring it from where Lewin or ADKAR happen to be.',
      'Talk to (or read feedback from) a cross-section of the population, not only leadership or the loudest voices — sentiment frequently varies widely by site, shift or function, and a single vocal group can misrepresent the whole cohort.',
      'Check Module 5\'s stakeholder groups before moving the phase for the whole project: different cohorts can genuinely be in different Bridges phases at the same time, and a single project-level value is always a simplification worth double-checking.',
    ],
  },
  {
    field: 'Kübler-Ross Sentiment Stage',
    module: 'Module 7 · Emotional & Transition Layer',
    before: [
      'Ground the stage in recent free-text feedback rather than carrying the previous reading forward by default — sentiment can move faster than the review cadence.',
      'Be skeptical before advancing to Commitment: premature Commitment readings mask still-active resistance. Check the Resistance Log (Module 11) for open entries before confirming the population has actually arrived, not just gone quiet.',
    ],
  },
  {
    field: 'Lewin Macro-Phase (Unfreeze / Change / Refreeze)',
    module: 'Module 4 · Initiative Registry',
    before: [
      'Confirm the underlying Main Project milestone that justifies the shift (e.g. go-live) has actually occurred — not merely that it is scheduled or imminent.',
      'Let Lewin follow the ADKAR/Bridges evidence, not lead it. Don\'t advance to Refreeze because the project plan says the program is closing if Module 6/7 data still shows active, unresolved resistance — a calendar-driven Lewin phase that contradicts the readiness data is a red flag, not a status update.',
    ],
  },
  {
    field: 'Sponsor Visibility (weak / moderate / strong)',
    module: 'Module 8 · Sponsor & Coalition',
    before: [
      'Verify a specific, observable sponsor action actually took place — a town hall, a floor/site visit, a recorded message reaching the target population — before upgrading visibility. A verbal commitment from the sponsor is not evidence until it is executed.',
      'Cross-reference with stalled Desire scores in Module 6 before changing this field either way: weak sponsor visibility is one of the most common root causes of a stalled Desire block, so the two should usually move together, and a mismatch is worth investigating before saving.',
    ],
  },
  {
    field: 'Risk Status (open / mitigating / closed)',
    module: 'Module 14 · Risk Register',
    before: [
      'Before marking a risk "mitigating," confirm the mitigation action is actually underway, not merely planned or assigned to an owner.',
      'Before closing a risk, confirm the underlying condition that created it no longer holds — closing a risk because the review meeting is ending, without evidence the exposure is gone, just hides it from the register without resolving it.',
    ],
  },
  {
    field: 'Resistance Entry Status (open / in progress / closed)',
    module: 'Module 11 · Resistance Management',
    before: [
      'Before closing a resistance-log entry, verify the documented root cause was actually addressed — not just that the loudest complaint went quiet, which can mean the resistance went underground rather than resolved.',
      'If the entry is systemic (flagged by the pattern-detection banner when ≥2 systemic entries exist), consider whether it needs escalation to Module 8 (Sponsor & Coalition) before closing it as an isolated case.',
    ],
  },
  {
    field: 'Training Certification Toggle',
    module: 'Module 10 · Training',
    before: [
      'Confirm actual completion or assessment evidence exists for the cohort before marking a curriculum certified — attendance alone is not the same as demonstrated capability, and this toggle feeds directly into the Training Completion component of the Composite Readiness Index.',
    ],
  },
  {
    field: 'Manager Readiness Rating (1–5)',
    module: 'Module 12 · Manager as Coach',
    before: [
      'Base the rating on a direct coaching conversation with the manager about their own readiness to lead the change — not on an assumption inferred from their team\'s ADKAR scores, which measure the team, not the manager.',
    ],
  },
  {
    field: 'Sustainment Checkpoint ("Record checkpoint")',
    module: 'Module 13 · Sustainment',
    before: [
      'Only record a checkpoint once its actual days-after-go-live threshold has genuinely passed — recording early to "get ahead" defeats the purpose of a post-go-live adoption read.',
      'Pull real usage/adoption data before recording rather than estimating — the regression-risk band this checkpoint feeds (see the KPI appendix) is only as trustworthy as the number entered here.',
    ],
  },
]

// -------------------------------------------------------------------------
// SIPOC (Suppliers, Inputs, Process, Outputs, Customers) per phase and
// framework. This operationalizes the "why" behind each framework label
// (PHASE_JUSTIFICATIONS above) into concrete, repeatable actions: who feeds
// the read, what evidence to gather, what to actually go do to confirm it
// (Perform / Check / Validate / Run a survey), what value results, and who
// consumes it. Keyed by the exact phase title used in TUTORIAL_PHASES so
// both the tutorial and the user guide render from one source.
// -------------------------------------------------------------------------
export const SIPOC_BY_PHASE = {
  'Phase 1 — Initiate & Diagnose': {
    Lewin: {
      suppliers: 'Executive Sponsor, PMO / Main Project team, Finance & Operations leadership',
      inputs: 'Business driver narrative (M4), Main Project timeline & budget (M1), current-state pain points',
      process: [
        'Perform a discovery session with the Executive Sponsor to document the burning platform in concrete, falsifiable terms (e.g. days-to-close, a vendor end-of-support date) rather than a general sense of urgency.',
        'Check the Main Project\'s own lifecycle stage in M1/M4 to confirm delivery has not yet asked anyone to work differently — that absence is what keeps this Unfreeze rather than Change.',
        'Validate the business driver text against real operational data before it goes into M4, not just leadership\'s framing of it.',
        'Run a survey is not yet warranted at this stage — substitute informal 1:1s with a cross-section of the target population to sense-check the burning platform lands the way leadership expects.',
      ],
      outputs: 'Lewin = Unfreeze',
      customers: 'Change Manager (records in M4), Sponsor, PMO, Executive Viewer (Portfolio Dashboard)',
    },
    Prosci: {
      suppliers: 'Change Manager, Sponsor, HR / Org Design (org chart), Communications lead',
      inputs: 'Target population & org chart, sponsor visibility baseline (M8), ADKAR baseline (M6, still at 1)',
      process: [
        'Perform stakeholder & impact mapping (M5) to identify who is affected and along which dimensions (process, technology, role, location, identity).',
        'Check that ADKAR scores are genuinely still at or near baseline (1) — confirms no Manage-phase activity (training, active communication) has started yet.',
        'Validate the sponsor coalition membership and starting visibility level are actually documented in M8, not assumed.',
        'Run a stakeholder interview round in place of a formal survey — the population is too early in the process for a structured readiness survey to be meaningful yet.',
      ],
      outputs: 'Prosci = Prepare',
      customers: 'Change Manager, Sponsor, Coalition members',
    },
    Bridges: {
      suppliers: 'Employees / target population (informal feedback), People Managers, Communications lead',
      inputs: 'Announcement or first communication of the change (M9), any early informal reactions',
      process: [
        'Perform an initial listening pass — informal conversations, town-hall Q&A — right after the change is first announced.',
        'Check whether any formal communication has actually gone out yet: Bridges\' Ending begins at announcement, not at go-live, so the timing matters.',
        'Validate that the reaction is grief/loss-oriented — this is expected and healthy this early, not a warning sign to escalate.',
        'Run a survey: a first, short sentiment pulse is optional here but worth doing if the announcement reached a broad or dispersed population.',
      ],
      outputs: 'Bridges = Ending',
      customers: 'Change Manager, People Manager / Coach',
    },
  },
  'Phase 2 — Plan & Prepare': {
    Lewin: {
      suppliers: 'PMO / delivery team, Training team, Communications team, Risk owners',
      inputs: 'Communications plan (M9), training curriculum plan (M10), logged risks (M14), Awareness score movement (M6)',
      process: [
        'Perform a plan review across Communications (M9), Training (M10) and the Risk Register (M14) to confirm the Prepare-phase plan is actually complete before execution starts.',
        'Check whether any part of the population has been asked to change yet — if not, this is still Unfreeze, even with an execution date on the calendar.',
        'Validate that Awareness scores are beginning to move in M6 (a healthy sign Unfreeze is progressing) while Desire/Knowledge/Ability remain untouched.',
        'Run a pre-launch readiness checklist review with PMO before greenlighting execution.',
      ],
      outputs: 'Lewin = Unfreeze → Change (transitioning)',
      customers: 'Change Manager, PMO, Sponsor',
    },
    Prosci: {
      suppliers: 'Trainer / Practitioner, Communications Practitioner, Risk owners',
      inputs: 'Curriculum readiness (M10), communications calendar (M9), logged risks (M14)',
      process: [
        'Perform final plan sign-off with the Sponsor before Manage-phase execution begins.',
        'Check that at least the Awareness-stage communications have actually gone out (M9) — Manage-phase work should never start blind to what the population has already heard.',
        'Validate the Risk Register (M14) has no unaddressed high-severity item that should block go-live.',
        'Run a dry-run or pilot of the training curriculum with a small cohort first if the target population is large.',
      ],
      outputs: 'Prosci = Prepare → Manage (transitioning)',
      customers: 'Change Manager, Trainer, PMO',
    },
    Bridges: {
      suppliers: 'Employees, People Managers',
      inputs: 'Ongoing informal feedback, communications delivered so far (M9)',
      process: [
        'Perform a second listening pass after the first wave of planning-stage communications goes out.',
        'Check for any shift away from Ending — none is expected yet, since nothing in daily work has actually changed.',
        'Validate that Ending-stage themes (grief, "what happens to my role") are still dominant before assuming the population has moved on.',
        'Run a survey: an optional short pulse to size how widespread the Ending reaction is before execution begins in earnest.',
      ],
      outputs: 'Bridges = Ending',
      customers: 'Change Manager, People Manager / Coach, Sponsor',
    },
  },
  'Phase 3 — Mobilize & Execute': {
    Lewin: {
      suppliers: 'Training delivery team, Change Manager, Resistance-log contributors (Employees, People Managers)',
      inputs: 'Training completion data (M10), resistance-log entries (M11), updated ADKAR scores (M6)',
      process: [
        'Perform the actual training rollout and track completion in M10 as it happens, not retrospectively.',
        'Check ADKAR Desire/Knowledge/Ability scores for real movement — genuine Change-phase activity should show up here, not just Awareness.',
        'Validate that resistance is being actively logged and triaged (M11) rather than absorbed informally and lost.',
        'Run a mid-rollout pulse survey to confirm the population is genuinely engaging with the new way of working, not merely tolerating it.',
      ],
      outputs: 'Lewin = Change',
      customers: 'Change Manager, PMO, Sponsor, Executive Viewer',
    },
    Prosci: {
      suppliers: 'Change Manager, Trainer, Communications Practitioner, People Managers',
      inputs: 'Resistance-log data (M11), training completion (M10), Desire score trend (M6)',
      process: [
        'Perform targeted 1:1 or small-group interventions for any ADKAR block flagged Escalated in M6.',
        'Check the Resistance Log (M11) for systemic patterns (two or more systemic entries) that need Sponsor-level escalation via M8, not just local handling.',
        'Validate that communications are actually landing (M9) — sample open/response rates or informal feedback rather than assuming delivery equals reception.',
        'Run a barrier-diagnosis review with People Managers coaching their direct reports (M12) using the flagged ADKAR barriers as the agenda.',
      ],
      outputs: 'Prosci = Manage',
      customers: 'Change Manager, People Manager / Coach, Sponsor',
    },
    Bridges: {
      suppliers: 'Employees, People Managers, Resistance-log contributors',
      inputs: 'Sentiment snapshots (M7), resistance themes (M11)',
      process: [
        'Perform a structured sentiment check-in — survey or facilitated session — now that the population is mid-transition.',
        'Check whether the dominant theme has shifted from grief (Ending) toward uncertainty and experimentation (Neutral Zone).',
        'Validate the shift is broad-based, not confined to one vocal team, by cross-referencing the stakeholder groups in M5.',
        'Run a survey: a Kübler-Ross-style pulse is the most direct way to confirm a genuine Neutral Zone read rather than inferring it from anecdote.',
      ],
      outputs: 'Bridges = Neutral Zone',
      customers: 'Change Manager, People Manager / Coach',
    },
  },
  'Phase 4 — Reinforce & Adopt': {
    Lewin: {
      suppliers: 'PMO (go-live milestone owner), Change Manager, Sustainment checkpoint owners',
      inputs: 'Go-live date/status (M1/M4), Journey Map milestones (M16), 30-day checkpoint scheduling (M13)',
      process: [
        'Perform the go-live milestone confirmation with PMO and log it on the Journey Map (M16) as it happens.',
        'Check that manager coaching (M12) and go-live readiness activities are actually complete before declaring the shift toward Refreeze.',
        'Validate the first sustainment checkpoint (30-day) is scheduled with clear success criteria (M13), not left informal.',
        'Run a go-live retrospective with the coalition to confirm the population is genuinely transitioning to steady-state use, not just that the system is live.',
      ],
      outputs: 'Lewin = Change → Refreeze (transitioning)',
      customers: 'Change Manager, PMO, Sponsor, Executive Viewer',
    },
    Prosci: {
      suppliers: 'People Manager / Coach, Change Manager',
      inputs: 'Manager readiness rating (M12), team-scoped ADKAR heatmap (M12), planned checkpoints (M13)',
      process: [
        'Perform a manager-readiness self-assessment conversation (M12) before assuming coaching capacity exists on the ground.',
        'Check the team-scoped ADKAR heatmap for any block still stalled at the manager\'s own reporting-line level.',
        'Validate that reinforcement mechanisms — recognition, visible metrics — are actually planned, not treated as automatic once go-live happens.',
        'Run a coaching-script session with managers, using AI-assisted talking points as a starting draft that the manager reviews and adapts, never delivers unedited.',
      ],
      outputs: 'Prosci = Manage → Reinforce (transitioning)',
      customers: 'People Manager / Coach, Change Manager, Sponsor',
    },
    Bridges: {
      suppliers: 'Employees, People Managers',
      inputs: 'Go-live milestone (M16), early usage signals',
      process: [
        'Perform a post-go-live listening pass to see whether the population is beginning to attach identity to the new way of working ("this is just how we do it now").',
        'Check for concrete New Beginning language versus lingering Neutral Zone uncertainty — the two can coexist across different cohorts.',
        'Validate the shift with real usage/behavior evidence, not just verbal enthusiasm captured at the go-live event itself.',
        'Run a survey: a short "how are you finding the new process" pulse timed shortly after go-live.',
      ],
      outputs: 'Bridges = Neutral Zone → New Beginning (transitioning, not yet confirmed)',
      customers: 'Change Manager, People Manager / Coach',
    },
  },
  'Phase 5 — Sustain, Analyze & Benchmark': {
    Lewin: {
      suppliers: 'Change Manager (via M13 checkpoints), Module 15 Analytics data',
      inputs: '30/60/90-day adoption-rate checkpoints (M13), Composite Readiness Index (M15), Benchmarking standing (M15)',
      process: [
        'Perform the scheduled checkpoint recording only once its days-after-go-live threshold has genuinely passed (M13).',
        'Check the Composite Readiness Index and Benchmarking standing (M15) against the Refreeze-phase reference band before declaring the project stable.',
        'Validate that adoption rate is holding or improving across successive checkpoints, not regressing.',
        'Run a benchmarking review at Project, Organization and — if applicable — Group level to confirm Refreeze is evidenced, not assumed from the calendar.',
      ],
      outputs: 'Lewin = Refreeze (confirmed once checkpoint/benchmark data supports it)',
      customers: 'Change Manager, PMO, Sponsor, Executive Viewer, Group Admin',
    },
    Prosci: {
      suppliers: 'Change Manager, Sustainment checkpoint data',
      inputs: 'Regression-risk score (M13), lessons learned (M13), quick-wins log (M13)',
      process: [
        'Perform quick-win recognition and log it in M13 to reinforce the specific behaviors you want to stick.',
        'Check the regression-risk band produced from the latest checkpoint\'s adoption rate before assuming reinforcement is complete.',
        'Validate that lessons learned are actually captured in M13 so the next initiative does not repeat the same barriers.',
        'Run the Regression Risk Predictor AI assistant as a first-pass check, with the Change Manager reviewing the flag before deciding on intervention.',
      ],
      outputs: 'Prosci = Reinforce',
      customers: 'Change Manager, Sponsor, PMO',
    },
    Bridges: {
      suppliers: 'Employees, checkpoint adoption data',
      inputs: 'Adoption-rate trend across checkpoints (M13), sentiment stage (M7)',
      process: [
        'Perform a final sentiment confirmation pass once 60–90 day checkpoint data is available.',
        'Check that Commitment-stage sentiment in M7 is corroborated by real adoption numbers, not goodwill expressed in isolation.',
        'Validate there is no lingering systemic resistance in M11 that would contradict a New Beginning declaration.',
        'Run a closing survey or retrospective to formally confirm New Beginning and capture what specifically got the population there.',
      ],
      outputs: 'Bridges = New Beginning (evidenced by checkpoint data)',
      customers: 'Change Manager, Sponsor, Executive Viewer',
    },
  },
}
