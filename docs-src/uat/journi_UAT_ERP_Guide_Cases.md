**POWERACT CONSULTING**

**UAT Test Cases --- Running an ERP Implementation on journi**

*Derived from "Running an ERP Implementation on journi --- A Practical User Guide" (Sections 6 and 9)*

Version 1.0 · August 2026 · Confidential

**Table of Contents**

- [Executive Summary](#executive-summary)
- [Scope and How to Use This Document](#scope-and-how-to-use-this-document)
- [Part A --- Phase UAT Cases](#part-a-phase-uat-cases)
  - [UAT-P1 --- Phase 1: Discovery & Design](#uat-p1)
  - [UAT-P2 --- Phase 2: Build & Configuration](#uat-p2)
  - [UAT-P3 --- Phase 3: Data Migration & Integration](#uat-p3)
  - [UAT-P4 --- Phase 4: Testing (SIT / UAT)](#uat-p4)
  - [UAT-P5 --- Phase 5: Training & Change Readiness](#uat-p5)
  - [UAT-P6 --- Phase 6: Cutover & Go-Live](#uat-p6)
  - [UAT-P7 --- Phase 7: Hypercare & Stabilization](#uat-p7)
  - [UAT-P8 --- Phase 8: Sustainment & Closure](#uat-p8)
- [Part B --- Exception UAT Cases](#part-b-exception-uat-cases)
  - [UAT-E1 --- Desire Stall During Data Migration & Integration](#uat-e1)
  - [UAT-E2 --- Divergence Pattern Detected During Testing / Training](#uat-e2)
  - [UAT-E3 --- Two-Clock Problem at Cutover & Go-Live](#uat-e3)
  - [UAT-E4 --- Sentiment Regression During Hypercare](#uat-e4)
  - [UAT-E5 --- Reinforcement Gap at Sustainment & Closure](#uat-e5)
  - [UAT-E6 --- Cohort Divergence Across Sites or Departments](#uat-e6)

---

## Executive Summary

This document converts the operational content of *Running an ERP Implementation on journi* (POWERACT Consulting's ERP User Guide) into a set of executable UAT test cases. It does not introduce a new scope: every case here is drawn directly from the guide's own two operational sections --- Section 6, the eight Detailed Phase Playbooks that carry a 12-month ERP program from Discovery through Sustainment, and Section 9, the six Exception Playbooks that cover the recurring ways a program's readiness signals go off track (a Desire stall, a Divergence Pattern, the two-clock problem at go-live, sentiment regression, a Reinforcement gap, and cross-cohort divergence).

The result is **14 UAT cases**: eight Phase cases (UAT-P1 through UAT-P8), one per implementation phase, and six Exception cases (UAT-E1 through UAT-E6), one per recovery playbook. Each case is reduced to exactly six fields --- **ID, Name, Main Goal, Steps, Expected Outputs, Status** --- stripped of the RACSI tables, technique catalogues, and recommended-tool references that the source guide carries for training and reference purposes but that a tester does not need to execute an acceptance test.

Each case's **Steps** are the guide's own five Tasks for that phase or exception, in the sequence the guide defines them, each carrying the journi module path exactly where the guide itself specifies one (a Task with no journi note in the source guide is, per the guide's own convention, executed outside journi and is stepped accordingly here). Each case's **Expected Outputs** are the guide's own SIPOC Outputs for that phase or exception, not a rewritten summary. **Main Goal** is a one-sentence acceptance statement built directly from the guide's phase introduction (for Phase cases) or from its Trigger and Timeline Impact definition (for Exception cases). Nothing in the underlying Task, Step, or outcome language has been altered from the source guide beyond this restructuring; where a phase or exception references a journi module, that reference already carries the corrected, current journi module numbering (M1--M20) established in the source guide.

**How to use this document:** work Part A in phase order to test the main program flow end to end, and use Part B whenever a program actually exhibits one of the six trigger conditions --- each Exception case is independently executable and does not need to run in sequence. Each case's Status line is a checklist for the tester to mark on execution; there is no separate test-plan front matter, RACSI matrix, or timeline calendar in this document by design, since the six-field format above is the only content requested for these UAT cases.

## Scope and How to Use This Document

**Scope.** The scope of this UAT set is exactly the scope of the source guide's operational sections: the eight implementation phases of Section 6 (Discovery & Design through Sustainment & Closure) and the six exception/recovery playbooks of Section 9. This supersedes any other UAT scope used in earlier journi UAT documents (such as the 16-process End-to-End Process Catalogue) --- those are not part of this document.

**Field definitions.**

- **ID** --- the case identifier: `UAT-P#` for a Phase case, `UAT-E#` for an Exception case, matching the guide's own Section 6/9.# numbering.
- **Name** --- the phase or exception title exactly as titled in the source guide.
- **Main Goal** --- the single acceptance condition this case verifies.
- **Steps** --- the five ordered Tasks the guide defines for this phase or exception, each noting the journi module path where the guide specifies one.
- **Expected Outputs** --- the guide's own SIPOC Outputs for this phase or exception: the artifacts and readings that must exist once the case is complete.
- **Status** --- for the tester to mark at execution: Not Started, In Progress, Passed, Failed, or Blocked.

---

## Part A --- Phase UAT Cases

<a id="uat-p1"></a>

### UAT-P1

**Name:** Phase 1 --- Discovery & Design (Weeks 1--12)

**Main Goal:** Confirm that Phase 1 establishes the business case, opens the journi project, and captures the Month-0 baseline across all four frameworks (Lewin, ADKAR, Bridges, Kübler-Ross) before any visible change has happened.

**Steps:**

1. Run current-state discovery workshops per impacted function.
2. Quantify pain points and the cost of inaction.
3. Define future-state process scope and design principles.
4. Open the Change Management project and set the Lewin phase. *(journi: M3.)*
5. Run the baseline ADKAR / Bridges / Kübler-Ross pulse. *(journi: M5--M6.)*

**Expected Outputs:** Approved future-state design; RAID log; Stakeholder Map; baseline framework readings.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-p2"></a>

### UAT-P2

**Name:** Phase 2 --- Build & Configuration (Weeks 5--24)

**Main Goal:** Confirm that technical configuration proceeds in parallel with the first communications wave and the recruitment of the change champion network.

**Steps:**

1. Configure the platform against the approved future-state design.
2. Run design-review checkpoints with functional owners.
3. Launch Phase-1 communications and an FAQ channel.
4. Recruit and brief the change champion network. *(journi: M4.)*
5. Re-run the ADKAR pulse (Awareness / early Desire). *(journi: M5.)*

**Expected Outputs:** Configured build (pre-migration); approved design-decision log; champion-network roster; updated ADKAR scores.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-p3"></a>

### UAT-P3

**Name:** Phase 3 --- Data Migration & Integration (Weeks 13--28)

**Main Goal:** Confirm that this highest-risk, least-visible phase completes migration and integration while readiness data is actively watched for the Desire stall pattern (Exception E1).

**Steps:**

1. Cleanse and map legacy data to the future-state model.
2. Build and test integrations with adjacent systems.
3. Run mock data-migration cycles and reconcile results.
4. Log Desire-block barrier reasons from low end-user visibility. *(journi: M5.)*
5. Update the Composite Readiness Index ahead of Testing. *(journi: M5--M6.)*

**Expected Outputs:** Migrated and reconciled data set; tested integrations; data-quality sign-off; updated Composite Readiness Index.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-p4"></a>

### UAT-P4

**Name:** Phase 4 --- Testing (SIT / UAT) (Weeks 25--32)

**Main Goal:** Confirm that a representative slice of end users gets real hands-on exposure through SIT and UAT, and that the Divergence Pattern check (Exception E2) is run against their first real Knowledge/Ability scores.

**Steps:**

1. Execute system integration testing (SIT).
2. Recruit a representative cohort for user acceptance testing. *(journi: M4.)*
3. Run UAT sessions and log defects and usability friction.
4. Cross-check Knowledge / Ability against Bridges (Divergence Pattern check). *(journi: M6.)*
5. Triage and remediate defects before sign-off.

**Expected Outputs:** SIT / UAT sign-off; defect log (closed or accepted); first real Knowledge / Ability scores; Divergence Pattern Detector result.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-p5"></a>

### UAT-P5

**Name:** Phase 5 --- Training & Change Readiness (Weeks 25--36)

**Main Goal:** Confirm that Knowledge becomes Ability under increasingly realistic conditions, that Bridges settles into the Neutral Zone, and that a cohort-level go/no-go readiness call is reached.

**Steps:**

1. Deliver role-based training to all impacted cohorts. *(journi: M5.)*
2. Deploy job aids and a sandbox practice environment.
3. Run readiness assessments per cohort (Knowledge / Ability scoring). *(journi: M5.)*
4. Brief supervisors on real-time floor-coaching expectations for go-live.
5. Confirm go/no-go readiness by cohort against benchmarking bands. *(journi: M14.)*

**Expected Outputs:** Trained cohorts with logged Ability scores; job aids in circulation; cohort-level go/no-go readiness call; supervisor coaching plan.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-p6"></a>

### UAT-P6

**Name:** Phase 6 --- Cutover & Go-Live (Week 37)

**Main Goal:** Confirm that cutover and go-live execute cleanly, and that the Lewin phase call is handled as provisional to guard against the two-clock problem (Exception E3) rather than declared final on the calendar date alone.

**Steps:**

1. Execute the data freeze and final migration.
2. Run the cutover runbook and technical validation checks.
3. Decommission or lock access to the legacy system per plan.
4. Communicate go-live confirmation to all cohorts.
5. Activate the hypercare support model on Day 1; mark Lewin as "Change → Refreeze (provisional)." *(journi: M3.)*

**Expected Outputs:** Live production system; legacy system locked / decommissioned; go-live communication sent; active hypercare support model.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-p7"></a>

### UAT-P7

**Name:** Phase 7 --- Hypercare & Stabilization (Weeks 37--48)

**Main Goal:** Confirm that adoption is stabilized during the last-mile hypercare window, with sentiment regression (Exception E4) treated as normal, expected behavior rather than a data error.

**Steps:**

1. Staff an elevated support desk for the first weeks post-go-live.
2. Track adoption metrics daily and triage defects by severity.
3. Run a Kübler-Ross / Bridges re-pulse at 2 and 4 weeks post-go-live. *(journi: M6.)*
4. Coach any cohort showing regression.
5. Taper support toward standard service levels as metrics stabilize.

**Expected Outputs:** Closed or triaged defect log; stabilized adoption metrics; updated Bridges / Kübler-Ross readings; support taper plan.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-p8"></a>

### UAT-P8

**Name:** Phase 8 --- Sustainment & Closure (Weeks 45--52+)

**Main Goal:** Confirm that Refreeze is called from checkpoint evidence, never the calendar, and that the discipline protecting against a Reinforcement gap (Exception E5) is demonstrably in place before the CM project closes.

**Steps:**

1. Embed new-process metrics into standard performance management.
2. Confirm Reinforcement mechanisms are active (recognition, manager check-ins, revoked legacy access). *(journi: M5.)*
3. Run 60-day and 90-day checkpoint reviews against benchmarking bands. *(journi: M14.)*
4. Call Refreeze formally once checkpoint evidence, not the calendar, supports it. *(journi: M3.)*
5. Close the Change Management project and hand off ongoing ownership.

**Expected Outputs:** Confirmed Refreeze call with supporting checkpoint data; reinforcement mechanisms embedded in business-as-usual; closed CM project; lessons-learned log.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

## Part B --- Exception UAT Cases

<a id="uat-e1"></a>

### UAT-E1

**Name:** E1 --- Desire Stall During Data Migration & Integration *(Related to Phase 3)*

**Main Goal:** Verify that when ADKAR Desire is logged at 2 or below on M5 (auto-escalated), with barrier-reason notes citing low visibility into progress and/or unresolved fear, the Change Manager runs the E1 recovery playbook and demonstrably improves Desire and Kübler-Ross sentiment within the expected 2--4 week window --- before a training or testing entry gate opens for that cohort.

**Steps:**

1. Cluster barrier-reason notes by root cause. *(journi: M5.)*
2. Run targeted listening sessions to validate the root cause.
3. Design a specific, credible response to the concrete fear identified.
4. Have the Sponsor deliver the response personally to the affected cohort.
5. Re-score Desire and Kübler-Ross sentiment 2--4 weeks after the intervention. *(journi: M5--M6.)*

**Expected Outputs:** Root-cause clustering of the Desire stall; a specific, sponsor-delivered response; updated Desire and Kübler-Ross scores.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-e2"></a>

### UAT-E2

**Name:** E2 --- Divergence Pattern Detected During Testing / Training *(Related to Phases 4--5)*

**Main Goal:** Verify that when Knowledge ≥ 3 and Ability ≥ 3 while Bridges reads exactly "Ending" for the same individual or cohort, the Change Manager confirms the alert against supervisor observation, resolves whether it reflects a genuine loss concern, and does not count the flagged individual toward "readiness" until Bridges moves off Ending.

**Steps:**

1. Review the alert and confirm it against supervisor observation. *(journi: M6.)*
2. Hold a 1:1 focused explicitly on what is being let go of, not on skills.
3. Distinguish a genuine identity/loss concern from simple reluctance.
4. Provide an explicit closure moment if a genuine loss is identified.
5. Re-check the Bridges reading only, at the next scheduled pulse. *(journi: M6.)*

**Expected Outputs:** Confirmed or dismissed divergence case; documented identity/loss concern (if genuine); updated Bridges reading.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-e3"></a>

### UAT-E3

**Name:** E3 --- Two-Clock Problem at Cutover & Go-Live *(Related to Phase 6)*

**Main Goal:** Verify that when Lewin is called "Change → Refreeze" on schedule at the go-live date while Bridges and Kübler-Ross remain at Neutral Zone / Resistance or lower, the Lewin phase call is kept explicitly provisional and the hypercare/reinforcement budget is extended by the observed lag rather than go-live itself being delayed.

**Steps:**

1. Separate the technical go-live milestone from the Lewin phase call. *(journi: M3.)*
2. Mark the Lewin phase as "provisional Refreeze" pending emotional-layer evidence. *(journi: M3.)*
3. Keep Reinforcement and the hypercare support model fully active.
4. Re-pulse Bridges / Kübler-Ross at 2 and 4 weeks. *(journi: M6.)*
5. Confirm or walk back the Refreeze call once evidence supports it. *(journi: M3.)*

**Expected Outputs:** Explicit provisional Lewin phase call; sustained hypercare/reinforcement funding; confirmed or corrected Lewin phase after re-pulse.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-e4"></a>

### UAT-E4

**Name:** E4 --- Sentiment Regression During Hypercare *(Related to Phase 7)*

**Main Goal:** Verify that when a cohort's Kübler-Ross reading moves backward following a specific triggering event, the Change Manager runs a short, contained recovery cycle (days to roughly two weeks) and escalates only if the pattern recurs across multiple teams.

**Steps:**

1. Confirm the regression is tied to a specific incident, not a general readiness failure.
2. Resolve or clearly communicate the status of the triggering defect.
3. Have the supervisor directly acknowledge the setback with the affected team.
4. Provide targeted, in-context coaching on the specific process step affected.
5. Re-pulse the affected cohort only, at 1--2 weeks. *(journi: M6.)*

**Expected Outputs:** Resolved or communicated incident; documented regression event and response; confirmed recovery or continued monitoring.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-e5"></a>

### UAT-E5

**Name:** E5 --- Reinforcement Gap at Sustainment & Closure *(Related to Phase 8)*

**Main Goal:** Verify that when the ADKAR Reinforcement score stalls below 3 as the program's formal end date approaches, the Change Manager flags the stall explicitly, re-authorizes a checkpoint cadence with the Sponsor, and delays the formal Refreeze/closure call until checkpoints show target Reinforcement --- rather than letting the project close on schedule regardless.

**Steps:**

1. Flag the Reinforcement stall explicitly rather than letting the project close on schedule. *(journi: M5.)*
2. Reconvene the Sponsor to re-authorize a defined checkpoint cadence.
3. Re-activate or formally re-charter the champion network.
4. Embed adoption metrics into the next performance-review cycle.
5. Delay the formal Refreeze / closure call until checkpoints show target Reinforcement. *(journi: M3.)*

**Expected Outputs:** Documented Reinforcement stall and remediation plan; re-authorized checkpoint cadence; re-chartered champion network; delayed, evidence-based Refreeze call.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked

---

<a id="uat-e6"></a>

### UAT-E6

**Name:** E6 --- Cohort Divergence Across Sites or Departments *(Cross-cutting, Phases 4--7)*

**Main Goal:** Verify that when a single project-level framework reading becomes misleading because different cohorts are genuinely in different places across all four frameworks, the Change Manager disaggregates the Composite Readiness Index and produces a cohort-by-cohort go/no-go instead of relying on a single all-or-nothing gate.

**Steps:**

1. Disaggregate the Composite Readiness Index by stakeholder group. *(journi: M4.)*
2. Identify the specific cohorts driving the spread, high and low.
3. Investigate what the strongest cohort did differently and what the weakest is missing.
4. Transfer specific, concrete practices from the strongest cohort to the weakest.
5. Continue reporting cohort-level readiness alongside the project-level number.

**Expected Outputs:** Disaggregated, cohort-level readiness report; root-cause comparison between strongest and weakest cohorts; revised go/no-go recommendation by cohort.

**Status:** ☐ Not Started&nbsp;&nbsp;☐ In Progress&nbsp;&nbsp;☐ Passed&nbsp;&nbsp;☐ Failed&nbsp;&nbsp;☐ Blocked
