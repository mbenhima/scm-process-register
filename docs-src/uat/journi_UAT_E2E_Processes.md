**journi**

*the human side of change, mapped as a journey*

**User Acceptance Test Scripts**

The 16 End-to-End Processes — Simulated Scenario: Atlas ERP People Readiness Program

Prepared for POWERACT Consulting

Chief Innovation Officer — Mounire

August 2026

**Table of Contents**

- [1. Purpose & Scope](#1-purpose--scope)
- [2. Test Environment, Roles & Preconditions](#2-test-environment-roles--preconditions)
- [3. E2E Process Registry Reference](#3-e2e-process-registry-reference)
- [4. The Simulated Scenario — Atlas ERP People Readiness Program](#4-the-simulated-scenario--atlas-erp-people-readiness-program)
- [5. Core Lifecycle Chain](#5-core-lifecycle-chain)
  - [UAT-E2E-01 — Readiness & Mobilization](#uat-e2e-01--readiness--mobilization)
  - [UAT-E2E-02 — Capability & Divergence Management](#uat-e2e-02--capability--divergence-management)
  - [UAT-E2E-03 — Resistance-to-Commitment](#uat-e2e-03--resistance-to-commitment)
  - [UAT-E2E-04 — Adoption-to-Sustainment](#uat-e2e-04--adoption-to-sustainment)
- [6. Cross-Cutting Loops](#6-cross-cutting-loops)
  - [UAT-E2E-05 — Signal Aggregation Loop](#uat-e2e-05--signal-aggregation-loop)
  - [UAT-E2E-06 — PM ↔ CM Governance Bridge](#uat-e2e-06--pm--cm-governance-bridge)
  - [UAT-E2E-07 — Champion Early-Warning Loop](#uat-e2e-07--champion-early-warning-loop)
  - [UAT-E2E-08 — Governance Escalation Loop](#uat-e2e-08--governance-escalation-loop)
- [7. ERP Transformation-Type Lifecycle](#7-erp-transformation-type-lifecycle)
  - [UAT-E2E-ERP — ERP Implementation Lifecycle](#uat-e2e-erp--erp-implementation-lifecycle)
- [8. The Other Seven Transformation-Type Lifecycles](#8-the-other-seven-transformation-type-lifecycles)
  - [UAT-E2E-BPR — Business Process Reengineering](#uat-e2e-bpr--business-process-reengineering)
  - [UAT-E2E-BPA — Business Process Automation](#uat-e2e-bpa--business-process-automation)
  - [UAT-E2E-IMS — Integrated Management System](#uat-e2e-ims--integrated-management-system)
  - [UAT-E2E-CULT — Cultural / Values Transformation](#uat-e2e-cult--cultural--values-transformation)
  - [UAT-E2E-OM — Operating Model Redesign](#uat-e2e-om--operating-model-redesign)
  - [UAT-E2E-COMP — Compliance-Driven Change](#uat-e2e-comp--compliance-driven-change)
  - [UAT-E2E-TSD — Training & Skills Development](#uat-e2e-tsd--training--skills-development)
- [9. UAT Index](#9-uat-index)
- [10. Sign-Off](#10-sign-off)

## 1. Purpose & Scope

This suite of User Acceptance Test scripts exercises journi against all 16 End-to-End (E2E) processes documented in the source catalogue *02\_\_journi\_End-to-End\_Process\_Catalogue v1.1* — the 4 core lifecycle chains registered in D32h, the 4 cross-cutting loop extensions, and the 8 transformation-type lifecycles (one per project archetype). Each UAT is recorded as a single record with six fields — **ID, Name, Goals, Steps, Expected Results, Status** — so a tester can print or copy each one and fill in real values (dates, actual results, pass/fail) as they run it.

Rather than 16 disconnected walkthroughs, Sections 5–7 (E2E-01 through E2E-04, the 4 loops, and E2E-ERP — 9 UATs in total) are woven into **one continuous, realistic scenario**: the Atlas ERP People Readiness Program, journi's own seeded change management case for the S/4HANA Unification Program at Atlas Industrial Group. The scenario starts exactly where the seed data leaves it — Unfreeze, baseline assessment, Day 0 — and each UAT's steps are the real actions a Change Manager would take to carry the program forward, phase by phase, through to go-live, hypercare and a formally signed-off close. A tester who works through Sections 5–7 in order has run one uninterrupted change management engagement from kickoff to closure inside journi.

Section 8's 7 remaining transformation-type UATs (BPR, Automation, QMS, Cultural, Operating Model, Compliance, Training & Skills) do not fit the ERP narrative — journi doesn't model an ERP project as also being a compliance project — so each instead verifies the E2E Process Registry's rendering of that type's SIPOC and phase template, cross-referenced against one of journi's other seeded case-study projects that genuinely is that type. This keeps every one of the 16 UATs anchored to real application behavior and real seeded data throughout, with nothing fabricated to fill a gap.

Note on E2E-01–04: this catalogue's own text for these four chains predates a later correction. The Framework Interaction Map v2.3 §11 issued a "Corrected" macro-process composition, name and RACSI for each of the four core chains, and journi's E2E Process Registry (Module 18) implements that corrected version, not the catalogue's original reading. Each UAT below tests what the application actually does today — the corrected version — and calls out the supersession explicitly so a tester comparing this document against the original catalogue PDF isn't misled into filing a false defect.

## 2. Test Environment, Roles & Preconditions

- **Application under test**: journi (client-side only, no backend — see the Functional Specification §2.4). All data referenced below is journi's seeded demo dataset; no external system is involved.
- **Tenant**: Atlas Industrial Group — Casablanca Plant Cluster (`org-atlas`), part of the Atlas Group (`grp-atlas`).
- **Primary test persona**: **Nadia Chraibi**, Change Manager, scoped to the Atlas ERP People Readiness Program. Log in from the journi login screen by selecting her name from the demo-user list, then set Organization = *Atlas Industrial Group — Casablanca Plant Cluster* and Project = *Atlas ERP People Readiness Program* in the top bar. Nadia's role (`change_manager`) carries write access to every Change Management module and, as of this build, the `manageCharters` capability (Module 19), so no role-switching is needed for the great majority of steps below.
- **Secondary persona**: **Amina Idrissi**, Super Admin — only needed where a step is deliberately checking platform-wide or cross-role behavior.
- **Language**: set the top-bar language selector to English before starting, for step text to match this document exactly. The application is fully functional in French and Arabic as well (Atlas's own tenant default is French) — that is a separate localization concern, not part of these scripts.
- **Reset Demo Data**: if a prior test run has already advanced the Atlas ERP program's state, use the "Reset Demo Data" control in the top bar before starting Section 5, so every UAT below starts from the documented Day 0 baseline.
- **Browser storage**: journi persists state to the browser's `localStorage`. Running this suite in a fresh/private browser window guarantees a clean baseline without an explicit reset.

## 3. E2E Process Registry Reference

The table below is the ground truth this entire test suite is written against — Module 18's E2E Process Registry (E2E Process Registry tab), current as of this build.

| ID | Name | Kind | Composition | UAT |
|---|---|---|---|---|
| E2E-01 | Readiness & Mobilization | Core | MP-01→02→03→06→07 | §5.1 |
| E2E-02 | Capability & Divergence Management | Core | MP-05→08→07 | §5.2 |
| E2E-03 | Resistance-to-Commitment | Core | MP-04→06→07→09 | §5.3 |
| E2E-04 | Adoption-to-Sustainment | Core | MP-09→10→07 | §5.4 |
| E2E-05 | Signal Aggregation Loop | Loop | MP-03→05→07→08 | §6.1 |
| E2E-06 | PM ↔ CM Governance Bridge | Loop | MP-02→08 | §6.2 |
| E2E-07 | Champion Early-Warning Loop | Loop | MP-06→04 | §6.3 |
| E2E-08 | Governance Escalation Loop | Loop | MP-02→10 | §6.4 |
| E2E-ERP | ERP Implementation Lifecycle | Type | MP-01→02→03→05→07→09→10 | §7 |
| E2E-BPR | Business Process Reengineering Lifecycle | Type | MP-01→02→03→05→07→08→09→10 | §8.1 |
| E2E-BPA | Business Process Automation Lifecycle | Type | MP-01→02→03→05→07→08→09→10 | §8.2 |
| E2E-IMS | Integrated Management System Lifecycle | Type | MP-01→02→03→05→07→08→09→10 | §8.3 |
| E2E-CULT | Cultural / Values Transformation Lifecycle | Type | MP-01→02→03→04→06→07→08→09→10 | §8.4 |
| E2E-OM | Operating Model Redesign Lifecycle | Type | MP-01→02→03→05→07→08→09→10 | §8.5 |
| E2E-COMP | Compliance-Driven Change Lifecycle | Type | MP-01→02→03→05→07→08→09→10 | §8.6 |
| E2E-TSD | Training & Skills Development Lifecycle | Type | MP-01→02→03→05→06→07→08→09→10 | §8.7 |

Macro process reference (MP-01 through MP-10), with the journi module that actually captures each one:

| Macro Process | Name | Module(s) |
|---|---|---|
| MP-01 | Change Impact & Stakeholder Assessment | M4 |
| MP-02 | Sponsorship & Governance Management | M3, M7 |
| MP-03 | Communication & Awareness Management | M8 |
| MP-04 | Resistance & Barrier Management | M10 |
| MP-05 | Training & Capability Enablement | M9 |
| MP-06 | Champion Network Management | M7 |
| MP-07 | Readiness Diagnostics & Signal Capture | M5, M6 |
| MP-08 | Divergence & Risk Detection | M6, M13 |
| MP-09 | Hypercare & Floor Coaching Support | M11, M12 |
| MP-10 | Reinforcement & Sustainment Management | M3, M12 |

## 4. The Simulated Scenario — Atlas ERP People Readiness Program

| Attribute | Value |
|---|---|
| Organization | Atlas Industrial Group — Casablanca Plant Cluster (3,100 employees; Plants at Ain Sebaâ, Nouaceur, Mohammedia + Shared Services Center) |
| Linked Main Project | S/4HANA Unification Program — consolidating 3 legacy plant ERPs onto one SAP S/4HANA instance (Finance, Procurement, Production Planning, Inventory); 16 months; €4.2M band; Executive Sponsor: COO |
| CM Project | Atlas ERP People Readiness Program |
| Change Manager | Nadia Chraibi |
| Business Driver | Unify fragmented plant-level ERPs ahead of group-wide reporting consolidation |
| Target Population | ~1,200 plant and back-office staff (finance, procurement, planning, warehouse supervisors) |
| Success Criteria | 90% of target population trained and certified; finance close cycle reduced by 3 days; adoption rate >85% at day 90 |
| Day 0 state (baseline, "today") | Lewin: Unfreeze · Bridges: Ending (finance early-adopters entering Neutral Zone) · Sentiment: mixed Denial/Resistance (shop-floor supervisors), Exploration (finance leadership) |
| Prior milestones already logged | Day −60: program kick-off · Day −30: plant town halls completed at all 3 plants |
| Planned future milestones (seeded) | Day +60: training curriculum launch · Day +270: planned go-live, Plant 1 |

This is where every UAT in Sections 5–7 begins. Nothing about this starting state needs to be created by the tester — it is the seed data itself, and the first steps of UAT-E2E-01 confirm it is present and correct before any new action is taken.

## 5. Core Lifecycle Chain

### UAT-E2E-01 — Readiness & Mobilization

**ID**: UAT-E2E-01

**Name**: Readiness & Mobilization

**Goals**: Confirm that stakeholder assessment, sponsor coalition formation, awareness communication and champion mobilization all roll up into a single, coherent readiness picture at the start of the Atlas ERP program. Catalogue composition: MP-01 → MP-02 → MP-03 → MP-06 → MP-07. Trigger: business case and stakeholder map opened. Terminal state (D32h, corrected): mobilized sponsorship, informed and diagnosed population, active champion network. RACSI: R = Change Manager · A = Executive Sponsor · C = Functional Process Owner, Program Manager · S = Supervisor · I = End User. Preconditions: logged in as Nadia Chraibi; scope set to Atlas Industrial Group / Atlas ERP People Readiness Program; demo data at Day 0 baseline (§4).

**Steps**:

1. Open M4 · Stakeholder Mapping.
2. Open M7 · Sponsor & Coalition.
3. In the Sponsor Actions list, check whether "Kick-off town hall at each of 3 plants" is marked done, and whether "Monthly plant-floor walk with visible Q&A" and "Sponsor-led go/no-go review at each cutover" are done or not done.
4. As Nadia, log a new sponsor action: "First monthly plant-floor walk completed at Ain Sebaâ", phase = Manage, mark done.
5. Open M8 · Communications.
6. Add a new communication superseding the draft one: message "No headcount reduction tied to this program — live Q&A follow-up", audience "Shop-floor Supervisors", channel "Toolbox Talk", sender "Plant Directors", timing "M+2", ADKAR block Desire, status sent. Then export the communications log to CSV using the Export CSV control.
7. Open M5 · ADKAR Engine.
8. Open M7 · Sponsor & Coalition again and locate the Champion Network activity (MP-06 is captured here per the macro-process table in §3).
9. Open M18 · Process Registry, E2E Process Registry tab, and locate E2E-01.

**Expected Results**:

1. Four stakeholder groups are listed: Finance & Procurement (HQ) — 210 headcount; Plant Warehouse Supervisors — 90; Production Planning — 140; Shop-floor Supervisors (all 3 plants) — 260. Each shows its 5-dimension impact score (process/tech/role/location/identity) and influence rating.
2. Sponsor is the COO, visibility rated Moderate, with the note "Guiding coalition formed (COO, 3 plant directors, Finance VP); visibility rated Moderate — plant-floor presence still limited." The coalition roster lists all 5 named members with influence/engagement scores.
3. Matches the Day 0 state — the kick-off is behind the program (done), the ongoing cadence is still ahead of it (not done).
4. The new action appears in the roster; sponsor visibility data now reflects an active second cadence item.
5. Three communications are listed: "Why S/4HANA…" (Town Hall, sent, feeds Awareness), "What changes for your role on day one" (Team Briefing, scheduled), "No headcount reduction tied to this program — Q&A recording" (Intranet + Toolbox Talk, draft).
6. A 4th row appears (existing rows have no inline status-edit control — only Delete — so a superseding entry is the correct way to represent the message having gone out). The CSV download contains all 4 rows including the new one, with UTF-8 encoding that renders the accented French text correctly in Excel.
7. Awareness score = 3, with justification history showing two logged increases (Aug 4: 1→2, "First-wave town hall held at Ain Sebaâ…"; Aug 5: 2→3, "Second wave of town halls completed at all three plants…").
8. Champion-related activity is visible as part of the M7 coalition/engagement picture — there is no separate "champion roster" screen in this build; MP-06 is exercised through this same module, matching the macro-process-to-module map.
9. Displays as "Readiness & Mobilization (Awareness → Launch-Readiness)", composition MP-01 → MP-02 → MP-03 → MP-06 → MP-07, trigger "Business case and stakeholder map opened", terminal state "Mobilized sponsorship, informed and diagnosed population, active champion network", and RACSI R=CM · A=ES · C=FPO, PM · S=SUP · I=EU.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-02 — Capability & Divergence Management

**ID**: UAT-E2E-02

**Name**: Capability & Divergence Management

**Goals**: Confirm training delivery (Knowledge/Ability) is tracked to completion and certification, and that a Knowledge/Ability-vs-Bridges divergence is correctly detected and surfaced. Catalogue composition: MP-05 → MP-08 → MP-07. Trigger: curriculum, sandbox and cohort segmentation confirmed from E2E-01. Terminal state (D32h, corrected): verified capable and emotionally-ready cohorts; Divergence Pattern log. RACSI: R = Change Manager · A = Change Manager · C = Functional Process Owner, IT/Technical Lead · S = Program Manager, Supervisor · I = Executive Sponsor, End User. Preconditions: continues directly from UAT-E2E-01.

**Steps**:

1. Open M9 · Training.
2. Add a new curriculum entry: "S/4HANA Finance Essentials — Cohort 2", track "Finance & Procurement", level Practitioner, format Blended, completion 60%, facilitator "POWERACT DPSK Track" — representing the next wave now that the pilot cohort (15% complete) has moved on.
3. Click "trained only" on "S/4HANA Finance Essentials" to mark it certified, supplying a justification when prompted (e.g. "First cohort of 40 finance analysts completed and passed the certification assessment.").
4. Open M5 · ADKAR Engine, and raise Knowledge to 4 and Ability to 4, each with a justification referencing the certification milestone just logged.
5. Note the current Bridges phase (M6 · Emotional & Transition) is still Ending, and cross-check against Module 18's E2E-01 terminal-state note.
6. Click the bell icon (Notification Center) in the top bar.
7. Open M18 · Process Registry and locate E2E-02.

**Expected Results**:

1. Two curricula listed: "S/4HANA Finance Essentials" (Finance & Procurement track, Blended, 15% complete, not certified) and "S/4HANA Production Planning" (Planning & Warehouse track, Classroom, 5% complete, not certified).
2. New row appears in the training table alongside the two seeded curricula, with its own progress bar at 60%. Completion % is set at creation; there is no separate inline "edit completion" control on an existing row — only View Details, the Certified toggle, and Delete.
3. A justification panel appears (Require Justification is on by default per Module 2 Governance Settings), with the save button labelled "Certify with justification". On save, the badge changes to green Certified and the change is logged to the project's audit trail.
4. Both scores update with visible history entries; Awareness (3) and Desire (2) remain unchanged from UAT-E2E-01.
5. journi's Divergence Pattern condition (Knowledge ≥ 4 and Ability ≥ 4 while Bridges still reads Ending) is now satisfied for this project — this is exactly the seeded condition the Notification Center's ALT-001 alert is built to detect.
6. ALT-001 — Divergence Pattern Detected is now listed, with message referencing the Atlas ERP target population, severity and SLA shown, and a Dismiss control.
7. Displays as "Capability & Divergence Management (Training → Verified Competence)", composition MP-05 → MP-08 → MP-07, trigger "Curriculum, sandbox, and cohort segmentation confirmed from E2E-01", terminal state "Verified capable and emotionally-ready cohorts; Divergence Pattern log".

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-03 — Resistance-to-Commitment

**ID**: UAT-E2E-03

**Name**: Resistance-to-Commitment

**Goals**: Confirm a logged resistance barrier can be tracked from Open through Closed, with the ADKAR Desire block recovering in parallel. Catalogue composition: MP-04 → MP-06 → MP-07 → MP-09. Trigger: a stalled Desire score or negative sentiment pulse is first logged. Terminal state (D32h, corrected): resolved barriers; recovered Desire/sentiment scores; sustained commitment. RACSI: R = Change Manager · A = Change Manager · C = Executive Sponsor, Supervisor · S = Program Manager · I = Functional Process Owner, End User. Preconditions: continues from UAT-E2E-02.

**Steps**:

1. Open M10 · Resistance, Resistance Log tab.
2. Check the type-count summary at the top of the page for the systemic count.
3. Click "Mark in progress" → "Close" on the systemic barrier, supplying the justification "Ain Sebaâ (most digitally mature plant) sequenced first per the mitigation plan; readiness gap closing."
4. Open M10 · Resistance, Coding Workbench tab.
5. Tag the coaching note with a code from the Organization's codebook (e.g. "fear-of-obsolescence"), and link it to the open will-type resistance entry using the "Cross-reference to an existing barrier (optional)" control.
6. Open M5 · ADKAR Engine and raise Desire from 2 to 3, justification: "Joint HR/Union briefing held at all 3 plants confirming no headcount impact; shop-floor sentiment shifting from Denial toward Exploration."
7. Open M18 · Process Registry and locate E2E-03.

**Expected Results**:

1. Two entries are seeded: a will-type barrier from Shop-floor Supervisors ("Fear that ERP consolidation precedes headcount reduction", severity 4, status in progress), and a systemic-type barrier ("Legacy system maturity gap creates uneven readiness across 3 plants", severity 3, status open).
2. Shows 1 systemic entry — below the 2-entry threshold that would trigger the systemic-pattern warning banner, so the banner does not appear.
3. Status moves open → in progress → closed, each transition logged with its justification to the audit trail.
4. The seeded coaching note from Plant Director — Nouaceur ("Team still associates any system change with the 2024 automation layoffs…") appears as a taggable item alongside the still-open will-type resistance entry.
5. The tag appears on the note with a 🔗 link icon; the Code Frequency panel's count for that code increases by 1.
6. Desire score and history update; this recovery is the terminal-state condition the catalogue defines for this chain.
7. Displays as "Resistance-to-Commitment (Barrier Detection → Buy-In)", composition MP-04 → MP-06 → MP-07 → MP-09, terminal state "Resolved barriers; recovered Desire/sentiment scores; sustained commitment".

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-04 — Adoption-to-Sustainment

**ID**: UAT-E2E-04

**Name**: Adoption-to-Sustainment

**Goals**: This is the one chain the Day-0 seed data has not yet reached — go-live is seeded 270 days out. This UAT is where the tester's own actions carry the Atlas ERP program the rest of the way to a formally closed engagement, exercising every state this chain is meant to cover. Catalogue composition: MP-09 → MP-10 → MP-07. Trigger: go-live cutover executed. Terminal state (D32h, corrected): stabilized new-normal performance; embedded reinforcement; confirmed Refreeze; closed project. RACSI: R = Change Manager · A = Executive Sponsor · C = Program Manager, Functional Process Owner · S = Supervisor · I = IT/Technical Lead, End User. Preconditions: continues from UAT-E2E-03; in a real 270-day program this chain would begin at go-live, but for test purposes perform these steps immediately after §5.3 to complete the full lifecycle walkthrough in one sitting.

**Steps**:

1. Open M11 · Manager as Coach. Set manager readiness to 4, with justification "Plant Directors completed sponsor-shadowing sessions ahead of cutover."
2. Open M12 · Sustainment and check the status of all three checkpoints (30-day, 60-day, 90-day).
3. Click "Record checkpoint" on the 30-day checkpoint.
4. Repeat for the 60-day and 90-day checkpoints.
5. Add a Quick Win: "First plant (Ain Sebaâ) closes month-end 2 days faster on S/4HANA than on the legacy system."
6. Add a lesson learned: "Sequencing the most digitally mature plant first materially reduced go-live support tickets" — and, in the field placeholder "Linked Rule / Control / Charter (e.g. RULE-008, CTRL-012, CHTR-05)", enter CHTR-01 (Sponsorship / Leadership Charter — see M19).
7. If any checkpoint shows regression risk High, review the Regression Risk Predictor's AI suggestion box on this page and accept, edit or reject its recommendation.
8. Toggle Sustainment Sign-off.
9. Open M18 · Process Registry and locate E2E-04.

**Expected Results**:

1. Readiness rating updates with a logged justification, matching the hypercare floor-coaching enablement MP-09 covers.
2. All three checkpoints show status not due — this is the seeded Day-0 state, since go-live has not happened yet, confirming the terminal state genuinely has not been reached before this UAT begins acting.
3. An adoption rate and regression-risk are generated and the checkpoint status becomes complete — simulating go-live having occurred and the first post-go-live milestone being reached.
4. All three checkpoints now show status complete, each with its own adoption rate and regression-risk rating.
5. Appears in the Quick Wins list with today's date.
6. The lesson shows status Applied (green) rather than Pending, since a linked Rule/Control/Charter was named — the D25 REX Institutionalization Log rule: a lesson only "closes the loop" once it names what now encodes it.
7. The suggestion is logged to the AI usage/override audit trail (Module 16) regardless of which action is taken.
8. Button changes to "✓ Signed off" — the formal hand-off from project to Business-as-Usual ownership (Lewin's Refreeze) is now recorded for the Atlas ERP People Readiness Program.
9. Displays as "Adoption-to-Sustainment (Go-Live → Refreeze)", composition MP-09 → MP-10 → MP-07, terminal state "Stabilized new-normal performance; embedded reinforcement; confirmed Refreeze; closed project" — the exact state the program is now in after step 8.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

## 6. Cross-Cutting Loops

### UAT-E2E-05 — Signal Aggregation Loop

**ID**: UAT-E2E-05

**Name**: Signal Aggregation Loop

**Goals**: Confirm the dependency this loop documents is real, not just documented — that a Communications or Training update genuinely changes what the Risk Register and Notification Center report, with no separate action needed to "push" the update through. Catalogue composition: MP-03 → MP-05 → MP-07 → MP-08. Trigger: new Awareness (MP-03) or Knowledge/Ability (MP-05) signal recorded. Terminal state: Composite Readiness Index (MP-07) recalculated and evaluated by the Divergence Pattern Detector (MP-08). No new data-entry UI is required for this chain — it documents a dependency that already exists in journi's data model (Communications + Training feeding ADKAR, ADKAR feeding the Risk Register).

**Steps**:

1. With the Atlas ERP program at the state left by UAT-E2E-02 (Knowledge = 4, Ability = 4, Awareness = 3), open M13 · Risk Register.
2. Return to M8 · Communications and mark the previously-scheduled "What changes for your role on day one" communication as sent (add a new entry, since status is not inline-editable — see UAT-E2E-01 step 6).
3. Re-open M13 · Risk Register and the Notification Center bell.
4. Open M18 · Process Registry and locate E2E-05.

**Expected Results**:

1. The seeded saturation risk ("Change saturation — concurrent Process Automation initiative targets an overlapping population", likelihood 4 × impact 4 = 16) is present and correctly scored.
2. No explicit "recalculate" step exists or is needed.
3. ALT-001 (from UAT-E2E-02) is still listed if its underlying condition (Knowledge/Ability ≥4 while Bridges reads Ending) is still true — confirming the alert is evaluated live against current data on every render, not cached from when it first fired.
4. Displays as "Signal Aggregation Loop", composition MP-03 → MP-05 → MP-07 → MP-08, with the note explaining this is traceability over an existing dependency rather than a separate screen.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-06 — PM ↔ CM Governance Bridge

**ID**: UAT-E2E-06

**Name**: PM ↔ CM Governance Bridge

**Goals**: Confirm a Phase Gate can be reached, a PM input and a CM input can be captured independently without overwriting each other, and a single Accountable role can be assigned to the Joint Decision that differs from both authors. Catalogue composition: MP-02 → MP-08. Trigger: Main Project schedule slip logged OR Phase Gate checkpoint reached. Terminal state (D32e, corrected): Joint Decision Record produced (Go / Go with Conditions / No-Go); PM and CM inputs preserved independently; exactly one Accountable role named, selectable and may differ from either input's author.

**Steps**:

1. Open M17 · WBS & Gantt.
2. Use the phase filter to select P2 — Case for Change & Target-State Design.
3. Click "+ Add Phase Gate". In the PM input box, set the recommendation to Go with Conditions and enter the note "Schedule holding to baseline; data migration dry-run 90% complete, contingent on finance sign-off." In the separate CM input box, set its own recommendation to Go with Conditions, note "Readiness index below target for shop-floor cohort; recommend proceeding only once the union briefing closes", Readiness Index = 55, Checklist % = 70, Open flags = "Union briefing not yet closed".
4. Set Joint Decision to Go with Conditions, enter the Conditions text that appears once that option is selected ("Close the union briefing before Plant 1 cutover"), and set Accountable role (exactly one) to a value that is neither PM nor CM — e.g. ES. Click "Record joint decision".
5. Open the Notification Center.
6. Open M18 · Process Registry and locate E2E-06.

**Expected Results**:

1. The default seeded WBS is present for the Atlas ERP People Readiness Program, spanning Project Management, Change Management and Framework-milestone tracks.
2. Only tasks, checklist items and Phase Gates mapped to P2 are shown; a note explains the filter is scoped to this generic 7-phase lifecycle.
3. PM and CM inputs are two visibly separate boxes on the same form, each with its own recommendation dropdown and notes field — confirming they are recorded independently rather than merged into one shared field.
4. The gate saves with the Accountable role exactly as selected; the interface does not silently force it back to PM, confirming D32e's "may differ from either input's author" rule (JD-05) is implemented, not just documented.
5. ALT-009 — Phase Gate No-Go / Conditional is now listed for the Atlas ERP People Readiness Program, since the Joint Decision was not a clean Go.
6. Displays as "PM ↔ CM Governance Bridge", composition MP-02 → MP-08, terminal state referencing the Joint Decision Record and the "may differ from either input's author" rule verbatim, with a note that this is implemented in M17 as the Phase Gate / Joint Decision Record feature.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-07 — Champion Early-Warning Loop

**ID**: UAT-E2E-07

**Name**: Champion Early-Warning Loop

**Goals**: Confirm a champion-sourced observation can be traced through to a formal, structured Resistance Log entry — the specific hand-off the catalogue calls out as previously undocumented. Catalogue composition: MP-06 → MP-04. Trigger: champion floor-level observation logged. Terminal state: observation formalized into a Resistance Log barrier record.

**Steps**:

1. Open M7 · Sponsor & Coalition and add a new Sponsor Action capturing a floor-level observation surfaced through the coalition network: "Plant Director — Ain Sebaâ reports informal pushback among senior warehouse staff about the new putaway workflow shown in this week's sandbox demo — flag to Change Manager for follow-up."
2. Open M10 · Resistance, Resistance Log tab, and formalize that observation as a new entry: type = role, source = "Plant Warehouse Supervisors", root cause = "Senior warehouse staff uncertain how the new putaway workflow affects their supervisory role", severity 3, mitigation = "Role-mapping session confirming supervisory scope is unchanged", owner = "Plant Director — Ain Sebaâ", status = open.
3. Open M18 · Process Registry and locate E2E-07.

**Expected Results**:

1. Entry is logged in the Sponsor Action roadmap against the Atlas ERP People Readiness Program — this is the only observation-logging surface M7 exposes (there is no separate freeform notes field; MP-06 Champion Network activity is captured through this same roadmap).
2. New entry appears in the Resistance Log, now type-counted under "role" alongside the existing will/systemic entries from UAT-E2E-03.
3. Displays as "Champion Early-Warning Loop", composition MP-06 → MP-04, terminal state "Observation formalized into a Resistance Log barrier record" — the exact hand-off just performed in steps 1–2.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-08 — Governance Escalation Loop

**ID**: UAT-E2E-08

**Name**: Governance Escalation Loop

**Goals**: Confirm this weakest-evidence loop is still genuinely testable, not merely asserted — that a sponsor escalation can be logged and that it is visible from the Sustainment module by the time sign-off is considered. Catalogue composition: MP-02 → MP-10. Trigger: sponsor escalation action logged. Terminal state: escalation resolved and reflected in the sustainment sign-off. Status in the catalogue: *proposed extension — weaker evidence than E2E-05/06/07*, included for completeness. Preconditions: run after UAT-E2E-04, so Sustainment Sign-off is available to check against.

**Steps**:

1. Open M7 · Sponsor & Coalition and log a new sponsor action: "COO escalation: directed Finance VP to personally close out the union briefing before Plant 1 go-live", phase = Manage, mark done.
2. Return to M12 · Sustainment (already signed off, from UAT-E2E-04 step 8).
3. Open M18 · Process Registry and locate E2E-08.

**Expected Results**:

1. Entry appears in the sponsor action list, timestamped and attributed.
2. Sign-off remains recorded; the escalation logged in step 1 is part of the same project's audit trail the sign-off closes out — there is no separate "escalation ledger" to reconcile, consistent with the catalogue's note that this loop is "largely covered by existing Sponsor Coalition escalation actions (M7) and Sustainment checkpoints (M12)."
3. Displays as "Governance Escalation Loop", composition MP-02 → MP-10, terminal state "Escalation resolved and reflected in the sustainment signoff", with the note flagging it as the weakest-evidence proposed loop, included for completeness.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

## 7. ERP Transformation-Type Lifecycle

### UAT-E2E-ERP — ERP Implementation Lifecycle

**ID**: UAT-E2E-ERP

**Name**: ERP Implementation Lifecycle

**Goals**: Having walked the Atlas ERP People Readiness Program through every core chain and loop above, confirm the type-level view ties it all together correctly — the registry entry, its SIPOC, and the ability to load its 8-phase template into the linked Main Project's WBS. Catalogue composition: MP-01 → MP-02 → MP-03 → MP-05 → MP-07 → MP-09 → MP-10. SIPOC Suppliers: Executive Sponsor, Program/Project Manager, Change Manager. SIPOC Customers: Steering Committee, End Users, Sustainment Team. Phase template: TPL-ERP-8 (Discovery, Design, Build, Test, Train, Deploy, Hypercare, Sustain).

**Steps**:

1. Open M18 · Process Registry, E2E Process Registry tab, Transformation-Type Lifecycle group, and locate E2E-ERP.
2. Confirm the composition names exactly the macro processes exercised across UAT-E2E-01 through UAT-E2E-04 and UAT-E2E-06 — MP-01, MP-02, MP-03, MP-05, MP-07, MP-09, MP-10.
3. Open M17 · WBS & Gantt and click "Load phase template".
4. Leave the start date at today and click "Load into PM track".
5. Confirm the newly-loaded phases coexist with the Phase Gate created in UAT-E2E-06 without conflict.

**Expected Results**:

1. Displays as "ERP Implementation Lifecycle", composition MP-01 → MP-02 → MP-03 → MP-05 → MP-07 → MP-09 → MP-10, SIPOC Suppliers (Executive Sponsor, Program/Project Manager, Change Manager) and Customers (Steering Committee, End Users, Sustainment Team), and phase template TPL-ERP-8.
2. Every macro process this scenario has already exercised in Sections 5–6 is accounted for in E2E-ERP's own composition — the type-level chain is not introducing anything new, it is the roll-up of everything already tested.
3. The Load Phase Template dialog opens with TPL-ERP-8 already pre-selected in the dropdown (not just present as one option among many) and the note "Recommended for this project's linked Main Project and transformation type" shown beneath it — because the Atlas ERP People Readiness Program is linked to the S/4HANA Unification Program, whose type is `erp`.
4. The 8 ERP phases (Discovery, Design, Build, Test, Train, Deploy, Hypercare, Sustain) are added to the Project Management track of the WBS as one skeleton task per phase, spaced 30 days apart from the start date.
5. Both the loaded phase-template tasks and the manually-created Phase Gate are visible in the same WBS view, correctly attributed to their respective tracks.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

## 8. The Other Seven Transformation-Type Lifecycles

Each of the remaining 7 type-specific E2E chains follows the same registry-verification pattern: confirm the E2E Process Registry entry's composition, SIPOC and phase template render correctly, and cross-check against one of journi's other seeded case-study projects that is genuinely that type — rather than forcing an artificial full walkthrough onto data that was never meant to carry it.

### UAT-E2E-BPR — Business Process Reengineering

**ID**: UAT-E2E-BPR

**Name**: Business Process Reengineering Lifecycle

**Goals**: Confirm the E2E-BPR registry entry and its reference project are consistent. Composition: MP-01→02→03→05→07→08→09→10. Phase template: TPL-BPR-7 (P1 Intake & Diagnosis → P2 Clean-Slate Design → P3 Build → P4 Pilot → P5 Rollout → P6 Stabilization → P7 Sustainment). Reference project: Maghreb Logistics Hub's clean-slate fulfillment redesign (`cm-maghreb-bpr`).

**Steps**:

1. Switch Organization to Maghreb Logistics Hub and Project to the BPR case. Open M18 · Process Registry and locate E2E-BPR.
2. Open M17 · WBS & Gantt Phase Template picker.
3. Open M10 · Resistance and check for the seeded role-based barrier about Dispatch Planners.

**Expected Results**:

1. Composition, SIPOC (Executive Sponsor / Functional Process Owners / Change Manager → Steering Committee / Process Owner / End Users) and phase template TPL-BPR-7 display correctly.
2. TPL-BPR-7 shows as Recommended for this project (linked Main Project type = `bpr`); TPL-ERP-8 does not.
3. The barrier ("Dispatch Planners… current role dissolved into the new fulfillment-owner position") is present, confirming this project genuinely carries BPR-shaped resistance data (a dissolved role, not a system-adoption barrier), distinct from the ERP scenario's barriers.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-BPA — Business Process Automation

**ID**: UAT-E2E-BPA

**Name**: Business Process Automation Lifecycle

**Goals**: Confirm the E2E-BPA registry entry and its reference project are consistent. Composition: MP-01→02→03→05→07→08→09→10. Phase template: TPL-BPA-7 (P1 Automation-Opportunity Assessment → P2 Architecture Design → P3 Build → P4 UAT & Shadow-Mode → P5 Production Go-Live → P6 Exception Tuning → P7 CoE Handover). Reference project: Atlas Automation Adoption Track (`cm-atlas-auto`).

**Steps**:

1. Switch Project to Atlas Automation Adoption Track. Open M18 · Process Registry and locate E2E-BPA.
2. Open M17 · WBS & Gantt Phase Template picker.
3. Open M13 · Risk Register.

**Expected Results**:

1. SIPOC Suppliers (Executive Sponsor, IT/Technical Lead, Functional Process Owner) and Customers (Steering Committee, Center of Excellence, End Users) display; phase template TPL-BPA-7 shown.
2. TPL-BPA-7 recommended for this project.
3. Seeded risk "Resistance driven by perceived job loss rather than skill or awareness gaps" is present, likelihood 4 × impact 4 — confirming this project's own risk profile is distinct from, but comparable to, the ERP scenario's saturation risk.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-IMS — Integrated Management System

**ID**: UAT-E2E-IMS

**Name**: Integrated Management System Lifecycle

**Goals**: Confirm the E2E-IMS registry entry and its reference project are consistent, and exercise the REX-log gate from the read side. Composition: MP-01→02→03→05→07→08→09→10. Phase template: TPL-IMS-7 (P1 Intake & Diagnosis → P2 Design → P3 Implementation → P4 Mock-up Audit → P5 Certifying Audit → P6 Surveillance Prep → P7 Ongoing Surveillance). Reference project: Atlas Quality Culture Program (`cm-atlas-qms`).

**Steps**:

1. Switch Project to Atlas Quality Culture Program. Open M18 · Process Registry and locate E2E-IMS.
2. Open M12 · Sustainment.
3. Open the lessons-learned list.

**Expected Results**:

1. SIPOC Suppliers (Certification Body, Functional Process Owners, Change Manager) and Customers (Steering Committee, Quality Function, External Auditor) display; phase template TPL-IMS-7 shown, its P4/P5 audit-gate phases distinguishing it from every other type's template.
2. The 30-day and 60-day checkpoints are already complete in the seed data (78% and 84% adoption, moderate then low regression risk) — a second reference point for what a completed checkpoint looks like.
3. The seeded lesson "Peer champions from the pilot plant were more persuasive than top-down VP communication for skeptical inspectors" is present, with no linked Rule/Control/Charter — it displays status Pending, exercising the same REX-log gate tested in UAT-E2E-04 step 6 but from the read side.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-CULT — Cultural / Values Transformation

**ID**: UAT-E2E-CULT

**Name**: Cultural / Values Transformation Lifecycle

**Goals**: Confirm the E2E-CULT registry entry and its reference project are consistent. Composition: MP-01→02→03→04→06→07→08→09→10 — the only type lifecycle that routes through MP-04 (Resistance) and MP-06 (Champion Network) directly, reflecting that a culture change has no underlying system to train people on. Phase template: TPL-CULT-7 (P1 Diagnosis → P2 Target Values Design → P3 Leadership Modeling & Reinforcement Build → P4 Pilot Cohort → P5 Organization-Wide Rollout → P6 Reinforcement Through Skepticism → P7 Institutionalization). Reference project: Atlas Safety-First Leadership Culture Program (`cm-atlas-safety-culture`).

**Steps**:

1. Switch Project to Atlas Safety-First Leadership Culture Program. Open M18 · Process Registry and locate E2E-CULT.
2. Open M9 · Training.
3. Open M12 · Sustainment.

**Expected Results**:

1. Composition explicitly includes MP-04 and MP-06 — the only type-lifecycle row in §3 containing both.
2. No curriculum-and-certification records dominate this project the way they do the ERP scenario — cultural change is coaching-led, not classroom-led; the seeded resistance and coaching data (not training data) carries the weight of this project's narrative instead.
3. 30-day and 60-day checkpoints already complete (62% and 71% adoption) with a 90-day checkpoint still due — a third, independent reference point for checkpoint progression alongside the ERP scenario (not yet reached) and the QMS project (fully complete through 60-day).

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-OM — Operating Model Redesign

**ID**: UAT-E2E-OM

**Name**: Operating Model Redesign Lifecycle

**Goals**: Confirm the E2E-OM registry entry and its reference project are consistent. Composition: MP-01→02→03→05→07→08→09→10. Phase template: TPL-OM-7 (P1 Current Operating Model Assessment → P2 TOM Design → P3 Detailed Org Design → P4 Pilot Transition → P5 Full Transition → P6 Governance Adoption Tracking → P7 Standing Rhythm Handover). Reference project: Maghreb Logistics Hub's regional operating committee redesign (`cm-maghreb-om`).

**Steps**:

1. Switch Organization to Maghreb Logistics Hub, Project to the Operating Model case. Open M18 · Process Registry and locate E2E-OM.
2. Open M10 · Resistance.

**Expected Results**:

1. SIPOC Suppliers (Executive Sponsor, Function Heads, HR Business Partner) and Customers (Steering Committee, Standing Operating Committee, All Employees) display; phase template TPL-OM-7 shown.
2. Seeded role-based barrier ("Longest-tenured Hub Managers… perceived loss of decision authority held for years") is present — confirming this project's resistance is about governance authority, not system adoption.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-COMP — Compliance-Driven Change

**ID**: UAT-E2E-COMP

**Name**: Compliance-Driven Change Lifecycle

**Goals**: Confirm the E2E-COMP registry entry and its reference project are consistent. Composition: MP-01→02→03→05→07→08→09→10. Phase template: TPL-COMP-7 (P1 Regulatory Requirement & Gap Analysis → P2 Control Design → P3 Control Implementation → P4 Internal Audit / Independent Testing → P5 Controls Go Live → P6 First Monitoring Cycle → P7 Ongoing Compliance Handover). Reference project: Meridia Health Network's patient-consent workflow program (`cm-meridia-comp`).

**Steps**:

1. Switch Organization to Meridia Health Network, Project to the Compliance case. Open M18 · Process Registry and locate E2E-COMP.
2. Open journey events / timeline for this project.

**Expected Results**:

1. SIPOC Suppliers (Legal/Compliance, Functional Process Owners, Change Manager) and Customers (Steering Committee, Compliance Function, Regulator) display; phase template TPL-COMP-7 shown, anchored to a fixed regulatory enforcement date rather than a program-chosen go-live.
2. The seeded milestone "Regulatory enforcement date" at Day +240 is present with no flexibility noted — contrast against the ERP scenario's own Day +270 go-live, which the tester was free to advance through checkpoints at will; a compliance deadline is not something Sustainment sign-off can be timed around.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

---

### UAT-E2E-TSD — Training & Skills Development

**ID**: UAT-E2E-TSD

**Name**: Training & Skills Development Lifecycle

**Goals**: Confirm the E2E-TSD registry entry and its reference project are consistent. Composition: MP-01→02→03→05→06→07→08→09→10 — the only type lifecycle other than CULT that routes through MP-06 (Champion Network), reflecting the Gap Closure Summary's Finding B decision to keep this as an explicit 8th transformation type. Phase template: TPL-TSD-7 (P1 Skills Gap Diagnosis → P2 Curriculum Design → P3 Training Delivery → P4 Competency Verification → P5 Practical Application → P6 On-the-Job Coaching → P7 Skills Sustainment). Reference project: Atlas Tangier's digital-literacy certification program (`cm-atlas-tangier-tsd`).

**Steps**:

1. Switch Organization to Atlas Industrial Group — Tangier Free Zone Plant, Project to the Training & Skills case. Open M18 · Process Registry and locate E2E-TSD.
2. Open M19 · CM Charters, Mentoring Progression tab.
3. Open journey events / timeline for this project.

**Expected Results**:

1. Composition includes MP-06 alongside the standard MP-01/02/03/05/07/08/09/10 spine; SIPOC Suppliers (Training Lead, Functional Process Owners, Change Manager) and Customers (Steering Committee, End Users, Business-as-Usual Owner) display; phase template TPL-TSD-7 shown.
2. The 3-stage model (MENT-01 Trainee → MENT-02 Observer → MENT-03 Autonomous) is visible — the natural fit for a Training & Skills Development project, more so than for any other seeded case in this suite.
3. Seeded milestones show a digital-literacy baseline assessment, a Plant Director floor walk, a first certification cohort (Day +30) and an all-operator certification target (Day +120) — a self-contained certification narrative distinct from the ERP scenario's broader change program.

**Status**: ☐ Not Started ☐ In Progress ☐ Pass ☐ Fail — Tester: _______________ Date: _______________ Notes: _______________________________________________

## 9. UAT Index

| ID | Name | Section | Modules Exercised |
|---|---|---|---|
| UAT-E2E-01 | Readiness & Mobilization | §5.1 | M4, M7, M8, M5, M18 |
| UAT-E2E-02 | Capability & Divergence Management | §5.2 | M9, M5, M6, M16, M18 |
| UAT-E2E-03 | Resistance-to-Commitment | §5.3 | M10, M5, M18 |
| UAT-E2E-04 | Adoption-to-Sustainment | §5.4 | M11, M12, M16, M18 |
| UAT-E2E-05 | Signal Aggregation Loop | §6.1 | M13, M8, M18 |
| UAT-E2E-06 | PM ↔ CM Governance Bridge | §6.2 | M17, M18 |
| UAT-E2E-07 | Champion Early-Warning Loop | §6.3 | M7, M10, M18 |
| UAT-E2E-08 | Governance Escalation Loop | §6.4 | M7, M12, M18 |
| UAT-E2E-ERP | ERP Implementation Lifecycle | §7 | M18, M17 |
| UAT-E2E-BPR | Business Process Reengineering | §8.1 | M18, M17, M10 |
| UAT-E2E-BPA | Business Process Automation | §8.2 | M18, M17, M13 |
| UAT-E2E-IMS | Integrated Management System | §8.3 | M18, M12 |
| UAT-E2E-CULT | Cultural / Values Transformation | §8.4 | M18, M9, M12 |
| UAT-E2E-OM | Operating Model Redesign | §8.5 | M18, M10 |
| UAT-E2E-COMP | Compliance-Driven Change | §8.6 | M18 |
| UAT-E2E-TSD | Training & Skills Development | §8.7 | M18, M19 |

Each row's Status lives on its own UAT record in Sections 5–8 above, not in this index — use this table only to navigate and to confirm nothing was skipped.

## 10. Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| Change Manager (tester) | | | |
| QA / UAT Lead | | | |
| Product Owner | | | |

**Overall Result**: ☐ Accepted ☐ Accepted with noted defects ☐ Rejected

**Notes**:

