POWERACT CONSULTING

# Leading a Cultural & Values Transformation on journi

A Practical User Guide

*SIPOC, Techniques & RACSI per Task and Step · Tracking Dashboard · Simulated Data Walkthrough*

*Case Study: Cedarbrook Health Network — "Project Concord," a 24-month Just Culture transformation*

Built on journi's Framework Interaction Map v2.1

Frameworks referenced: Lewin's Change Management Model · Prosci ADKAR · Bridges' Transition Model · Kübler-Ross Change Curve

Version 1.0 · September 2026 · Confidential


## Executive Summary

Of journi's eight transformation archetypes, Cultural / Values Transformation is the most complex to run — not by opinion, but by journi's own Cross-Type Comparison Matrix (SRS 10.6.14). Three facts drive that ranking, and this guide is built around all three:

- **No training phase exists to lean on.** The E2E-CULT process chain (MP-01 → MP-02 → MP-03 → MP-04 → MP-06 → MP-07 → MP-08 → MP-09 → MP-10) is the only one of journi's ten archetype chains that skips MP-05, Training & Capability Enablement. You cannot train someone into believing something; every other lever in this guide exists because that one is unavailable.
- **The dominant frameworks are emotional, not procedural.** Where an ERP rollout is read almost entirely through Lewin and ADKAR, a values transformation is read primarily through Bridges' Transition Model and the Kübler-Ross Change Curve — frameworks built for loss and identity, not task competence.
- **It is journi's longest archetype (18–36 months against 12 for ERP) and its most reversibility-fragile** — "High, but slow to fix." A stalled ERP cutover is visible in days. A culture quietly reverting to old norms is invisible until the evidence has already piled up, and expensive in trust to reverse once staff conclude the new values were a phase, not a commitment.

This guide walks a single, fully worked case: **Cedarbrook Health Network**, a fictional but realistic health-sector organization (three hospitals, eleven clinics — journi's real "health" sector), running a 24-month Just Culture transformation internally named **Project Concord**. Cedarbrook's incident-reporting culture is built on blame; its Board has mandated a replacement built on four new values — **Psychological Safety, Shared Accountability, Radical Transparency, and Patient-First Courage** — inside two years, without a single additional day of classroom training. Every SIPOC, every Task and Step, every RACSI table, and the simulated 24-month data walkthrough in this guide trace that one program end to end, exactly as the earlier 120-page ERP Implementation User Guide traced Meridian Industrial's ERP rollout.


## 1. Introduction

### 1.1 Purpose

This guide shows how to plan, govern, and execute a Cultural / Values Transformation end to end inside journi, using Cedarbrook Health Network's Project Concord as the running example throughout. It mirrors the structure of the earlier ERP Implementation User Guide — SIPOC per phase, Task and Step detail with named techniques and recommended tools, and RACSI accountability per Task — but re-weights every framework, metric, and governance rhythm for an archetype where the deliverable is a belief, not a system.

### 1.2 Who This Guide Is For

- **Change Manager (CM)** — owns the day-to-day design and execution of every Task in this guide.
- **Executive Sponsor (ES)** — personally models the target values and owns the Sponsorship Charter.
- **HR Business Partner (HRBP)** — co-owns accountability-process design and equal-application review.
- **Unit Leaders / Supervisors (SUP)** — the primary channel through which values become daily behavior.
- **End Users (EU)** — frontline staff whose lived experience is both the input to diagnosis and the evidence of success.

### 1.3 How This Guide Maps to journi's TPL-CULT-7 Template

journi's default seven-phase template for the cultural archetype (TPL-CULT-7) is Diagnosis, Target Values Design, Leadership Modeling & Reinforcement Build, Pilot Cohort, Organization-Wide Rollout, Reinforcement Through Skepticism, and Institutionalization. Cedarbrook's 24-month calendar maps onto it with deliberately wide phase overlaps — culture work does not hand off cleanly from one phase to the next the way a system cutover does.

**Table 1.1 — TPL-CULT-7 phases mapped to Project Concord's 24-month calendar.**

| Phase | Name | Months |
|---|---|---|
| 1 | Diagnosis | 1–3 |
| 2 | Target Values Design | 2–5 |
| 3 | Leadership Modeling & Reinforcement Build | 4–8 |
| 4 | Pilot Cohort | 7–12 |
| 5 | Organization-Wide Rollout | 11–17 |
| 6 | Reinforcement Through Skepticism | 15–22 |
| 7 | Institutionalization | 20–24, open-ended beyond Month 24 |

*Phase 7 is deliberately shown as open-ended: institutionalization is a state the program transitions into, not a milestone it completes on a fixed date.*


## 2. Getting Started in journi

### 2.1 Core Modules for a Cultural Transformation

A cultural program touches most of journi's platform, but leans hardest on: **M5 (Charters)**, **M7 (Readiness Assessment)**, **M9 (Governance Dashboards)**, **M10 (Process Registry)**, **M11 (Steering & Phase Gates)**, **M12 (Stakeholder Mapping)**, **M13 (Communications)**, **M14 (Champion Network)**, **M16 (Resistance Management)**, **M17 (Manager Readiness Tracking)**, **M20 (Metrics & Benchmarking)**, and **M21 (Framework Interaction Engine)**. Notably absent from that list, because MP-05 does not appear in the E2E-CULT chain: journi's Training Content Library and LMS-integration modules. Anything that looks like a training deliverable elsewhere in journi (a course, a certification, a completion record) has no natural home in this program, and this guide does not manufacture one.

### 2.2 The Justified-Change-Pattern Rule

journi enforces that every Phase Gate advance be backed by a logged, evidence-based justification, not a calendar date. For every other archetype, this mostly guards against moving too slowly. For cultural change it guards against the opposite and more common failure: advancing to Reinforcement or Institutionalization on launch-event enthusiasm rather than sustained behavior evidence, which is the single fastest way to trigger a premature, unrecoverable Refreeze — locking in a culture that only looks changed.

### 2.3 journi's Computed Metrics for This Archetype

Two journi-computed metrics anchor every tracking table in this guide:

- **Composite Readiness Index (CRI)** — a single 0–100 score blending survey-based framework-position readings (Lewin state, Bridges position, ADKAR gaps) with behavioral evidence (incident-reporting patterns, champion activity, resistance-entry trends). Section 8 traces Project Concord's CRI quarter over quarter.
- **Benchmarking** — journi's cultural reference band, built from archetype-specific historical program data, expressing each site's or the org's current CRI trajectory as Behind, In Line, or Ahead of where comparable cultural programs stood at the same elapsed time.

### 2.4 Cross-Reference Note

Every Task and Step in Sections 6 and 9 names the specific journi module it is logged against. Where a Task closely parallels one from the ERP Implementation User Guide's own structure (readiness assessment, Steering Committee cadence, Phase Gate justification), this guide calls that out rather than re-explaining journi mechanics already documented there.


## 3. The Four Frameworks — Quick Primer, Re-Weighted for a Cultural Change

journi's Framework Interaction Engine (M21) always tracks the same four frameworks, but a cultural program reads them in a different order of importance than an ERP or automation program does.

### 3.1 Lewin's Change Management Model (Unfreeze / Change / Refreeze)

Sets the macro state. Cedarbrook stays in Unfreeze far longer than a system rollout would — roughly the first nine months — because unfreezing a blame-oriented safety culture requires dismantling years of learned self-protection, not just announcing a go-live date.

### 3.2 Prosci ADKAR (Awareness, Desire, Knowledge, Ability, Reinforcement)

Still tracked per individual and per unit, but Knowledge and Ability carry less weight here than in a system rollout, because there is no system to learn. Desire and Reinforcement dominate: staff already understand intellectually what "speak up" means long before they believe it is safe to do it.

### 3.3 Bridges' Transition Model (Ending, Neutral Zone, New Beginning) — dominant framework

This is the primary lens for a values program. Ending is not a system being decommissioned; it is staff mourning the loss of a familiar, if flawed, way of protecting themselves. The Neutral Zone — where old norms no longer fully apply and new ones are not yet trusted — is where cultural programs live for most of their duration, and where most of this guide's exception patterns (Section 9) originate.

### 3.4 Kübler-Ross Change Curve (Denial, Anger/Resistance, Exploration, Commitment) — dominant framework

Tracked alongside Bridges as the emotional-state complement to it. journi logs a dominant sentiment reading per unit at every checkpoint in Section 8's simulated walkthrough; a program that skips from Denial straight to a claimed Commitment reading, with no visible Resistance or Exploration in between, is itself a data-quality red flag worth investigating before it is trusted.

### 3.5 The Program / Change-Manager / Joint Task-Nature Tag

The ERP guide tags every Task Project, Change, or Joint. For a cultural transformation, journi's own defaults relabel this the same three-way split with archetype-appropriate ownership: **[ES]** for tasks the Executive Sponsor personally owns, **[CM]** for tasks the Change Manager drives day to day, **[HRBP]** for tasks HR Business Partner co-owns, **[PM]** for Program Manager–owned continuity and governance tasks, and **[Joint]** for tasks requiring shared, simultaneous ownership. Every Task title in Sections 6 and 9 carries one of these tags.


## 4. Process Map

### 4.1 The 21 Tasks Across journi's E2E-CULT Chain

Project Concord's full operational scope is 21 Tasks across the seven TPL-CULT-7 phases — three Tasks per phase, each broken into two Steps in Section 6. Table 4.1 maps every Task to its owning Macro Process, its Program/Change-Manager/Joint nature tag, its phase, and the journi module it is logged against.

**Table 4.1 — Full process map.**

| Task | Macro Process | Nature | Phase | journi Module |
|---|---|---|---|---|
| T1.1 Baseline Culture & Values Diagnosis | MP-01 Discovery & Diagnosis | CM | 1. Diagnosis | M7 |
| T1.2 Blame-Incident & Near-Miss Pattern Review | MP-01 Discovery & Diagnosis | CM | 1. Diagnosis | M7, M20 |
| T1.3 Diagnosis Readout & Sponsor Commitment | MP-01 Discovery & Diagnosis | Joint | 1. Diagnosis | M5, M9 |
| T2.1 Values Co-Design Workshops | MP-02 Design | CM | 2. Target Values Design | M12, M13 |
| T2.2 Sponsorship & Governance Charter Set-Up | MP-02 Design | Joint | 2. Target Values Design | M5 |
| T2.3 Values Definition & Behavior Anchors | MP-02 Design | CM | 2. Target Values Design | M10, M13 |
| T3.1 Executive Modeling Commitment & 360 Baseline | MP-03 Build & Prepare | ES | 3. Leadership Modeling | M5, M17 |
| T3.2 Reinforcement System Design | MP-03 Build & Prepare | CM | 3. Leadership Modeling | M14, M16 |
| T3.3 Manager Readiness Enablement | MP-03 Build & Prepare | Joint | 3. Leadership Modeling | M17 |
| T4.1 Pilot Unit Selection & Baseline | MP-04 Pilot | CM | 4. Pilot Cohort | M7, M11 |
| T4.2 Pilot Execution & Resistance Pattern Monitoring | MP-04 Pilot | CM | 4. Pilot Cohort | M16, M20 |
| T4.3 Pilot Go/No-Go Readout | MP-04 Pilot | Joint | 4. Pilot Cohort | M9, M11 |
| T5.1 Champion Network Scale-Up | MP-06 Rollout | CM | 5. Organization-Wide Rollout | M14 |
| T5.2 Org-Wide Launch Sequencing by Site | MP-06 Rollout | Joint | 5. Organization-Wide Rollout | M11, M13 |
| T5.3 Systemic-Pattern Alert Response | MP-06 Rollout | CM | 5. Organization-Wide Rollout | M16, M20 |
| T6.1 Cynicism Pulse Monitoring & Response | MP-07 Reinforcement & Resistance Mgmt. | CM | 6. Reinforcement Through Skepticism | M16, M20 |
| T6.2 Divergence Review Board Operations | MP-07 Reinforcement & Resistance Mgmt. | Joint | 6. Reinforcement Through Skepticism | M9, M20 |
| T6.3 Manager Coaching Sprint for Declining Readiness | MP-07 Reinforcement & Resistance Mgmt. | CM | 6. Reinforcement Through Skepticism | M17 |
| T7.1 Policy & Hiring Criteria Institutionalization | MP-08/09 Sustainment & Governance Handover | HRBP | 7. Institutionalization | M5, M10 |
| T7.2 Refreeze Justification & Steering Committee Sign-Off | MP-09 Governance Handover | Joint | 7. Institutionalization | M9, M11 |
| T7.3 Governance Handover & Benefits Realization Report | MP-10 Closure & Benefits Realization | PM | 7. Institutionalization | M9, M20 |

*Table 4.1 — Every Task in Section 6, mapped to Macro Process, nature, phase, and journi module. MP-05 (Training & Capability Enablement) does not appear: it is the one Macro Process the E2E-CULT chain skips.*

Seven of journi's eight Charter Registry entries actively govern this archetype's Macro Processes, each reviewed at the cadence its charter defines — most on a quarterly or per-Phase-Gate rhythm, consolidated into the Steering Committee sessions described in Section 10. The eighth, CHTR-07 (the Mentoring Charter), governs MP-05 Training & Capability Enablement — the one Macro Process this program's E2E-CULT chain does not use, so that charter stays dormant for the life of Project Concord.


## 5. Month-by-Month Implementation Timeline

### 5.1 Phase 1 — Diagnosis (Months 1–3)

Establishes the evidence base before any design work starts. All three Tasks run inside a tight twelve-week window because a slow diagnosis lets the Board's mandate lose momentum before Phase 2 even begins.

| Task | Weeks | Nature |
|---|---|---|
| T1.1 Baseline Culture & Values Diagnosis | 1–5 | CM |
| T1.2 Blame-Incident & Near-Miss Pattern Review | 4–9 | CM |
| T1.3 Diagnosis Readout & Sponsor Commitment | 9–12 | Joint |

### 5.2 Phase 2 — Target Values Design (Months 2–5)

Overlaps Phase 1 deliberately: co-design workshops can begin on partial diagnosis data while the incident-pattern review is still running, so the four values are not held hostage to the last data point.

| Task | Weeks | Nature |
|---|---|---|
| T2.1 Values Co-Design Workshops | 5–10 | CM |
| T2.2 Sponsorship & Governance Charter Set-Up | 8–14 | Joint |
| T2.3 Values Definition & Behavior Anchors | 12–20 | CM |

### 5.3 Phase 3 — Leadership Modeling & Reinforcement Build (Months 4–8)

The longest single-phase overlap in the program: executive modeling commitments (T3.1) start while values are still being finalized, because a sponsor who has not begun modeling by the time values are announced is already behind.

| Task | Weeks | Nature |
|---|---|---|
| T3.1 Executive Modeling Commitment & 360 Baseline | 13–18 | ES |
| T3.2 Reinforcement System Design | 16–26 | CM |
| T3.3 Manager Readiness Enablement | 24–32 | Joint |

### 5.4 Phase 4 — Pilot Cohort (Months 7–12)

Two units carry the pilot; everything the rest of the organization eventually receives in Phase 5 is proven or revised here first.

| Task | Weeks | Nature |
|---|---|---|
| T4.1 Pilot Unit Selection & Baseline | 25–30 | CM |
| T4.2 Pilot Execution & Resistance Pattern Monitoring | 28–44 | CM |
| T4.3 Pilot Go/No-Go Readout | 42–48 | Joint |

### 5.5 Phase 5 — Organization-Wide Rollout (Months 11–17)

Sequenced by site rather than launched everywhere on one date, so the systemic-pattern alert response process (T5.3) can absorb what the first wave of sites surfaces before the last wave goes live.

| Task | Weeks | Nature |
|---|---|---|
| T5.1 Champion Network Scale-Up | 41–48 | CM |
| T5.2 Org-Wide Launch Sequencing by Site | 46–60 | Joint |
| T5.3 Systemic-Pattern Alert Response | 50–68 | CM |

### 5.6 Phase 6 — Reinforcement Through Skepticism (Months 15–22)

The phase built to absorb Section 8's Q6 dip and Section 9's Exceptions E1 through E4; all three Tasks run continuously rather than sequentially, since skepticism does not arrive on a schedule.

| Task | Weeks | Nature |
|---|---|---|
| T6.1 Cynicism Pulse Monitoring & Response | 57–88 | CM |
| T6.2 Divergence Review Board Operations | 60–88 | Joint |
| T6.3 Manager Coaching Sprint for Declining Readiness | 65–88 | CM |

### 5.7 Phase 7 — Institutionalization (Months 20–24, open-ended beyond)

Deliberately overlaps Phase 6 by several months: policy and hiring-criteria changes (T7.1) begin while reinforcement work is still active, so institutionalization is not a separate final sprint bolted onto the end.

| Task | Weeks | Nature |
|---|---|---|
| T7.1 Policy & Hiring Criteria Institutionalization | 77–90 | HRBP |
| T7.2 Refreeze Justification & Steering Committee Sign-Off | 88–96 | Joint |
| T7.3 Governance Handover & Benefits Realization Report | 94–96+ | PM |


## 6. Detailed Phase Playbooks — SIPOC, Timeline, Tasks, Steps & RACSI

### 6.1 Phase 1 — Diagnosis (Months 1–3)

Establishes, in evidence rather than assumption, how deep Cedarbrook's blame-oriented reporting culture actually runs before anyone designs a replacement for it. Nothing in this phase touches the future state; its only job is to make the current state impossible to argue with.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Board mandate; External safety review; HR disciplinary records; Incident-reporting system | Board resolution and budget approval; 24 months of incident/near-miss data; org chart across 3 hospitals and 11 clinics | 1. Baseline Culture & Values Diagnosis<br>2. Blame-Incident & Near-Miss Pattern Review<br>3. Diagnosis Readout & Sponsor Commitment | Quantified culture baseline; incident-vs-report gap analysis; signed Sponsorship Charter | Executive team; Board; Change Manager; HR Business Partner |

*SIPOC for Phase 1 — Diagnosis. The Process column lists this phase's three Tasks in sequence.*

**Tasks, Steps, Techniques & RACSI**

**Task T1.1 — [CM] Baseline Culture & Values Diagnosis**

**Step 1 — Org-wide culture assessment survey**

The first data point has to be quantitative and anonymous, or staff who have spent years learning that reporting is unsafe will not tell the truth in it.

| Element | Detail |
|---|---|
| Technique Name | Validated safety-climate survey |
| Technique Goal | Quantify the current blame-versus-safety orientation, org-wide and by unit. |
| Technique Details | Administer an anonymous survey built on a validated safety-culture instrument (modeled on the AHRQ Hospital Survey on Patient Safety Culture), stratified by unit, role, and tenure; target a minimum 60% response rate before treating results as representative. |
| Recommended Tool | LimeSurvey (open-source) |

**Step 2 — Cross-seniority focus groups**

Junior staff routinely under-report candor in a survey their manager might plausibly see the aggregate of; focus groups stratified by seniority band recover what the survey alone will miss.

| Element | Detail |
|---|---|
| Technique Name | Structured, seniority-stratified focus groups |
| Technique Goal | Surface the qualitative texture behind the survey numbers, especially from junior staff. |
| Technique Details | Run 6–8 cross-unit focus groups of 6–8 participants each, grouped so no one shares a room with their own direct supervisor; use a fixed discussion guide and code transcripts for recurring themes. |
| Recommended Tool | Taguette (open-source qualitative coding) |

*RACSI for Task T1.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | HRBP, SUP | ES | EU |

**Task T1.2 — [CM] Blame-Incident & Near-Miss Pattern Review**

**Step 1 — Incident-report archive cross-reference**

The single most important number in this whole program is the gap between incidents staff privately admit happened and incidents that were ever formally reported — and whether reporting has historically correlated with disciplinary action against the reporter.

| Element | Detail |
|---|---|
| Technique Name | Retrospective data cross-reference |
| Technique Goal | Quantify the reporting-versus-true-incident gap, and whether reporting has predicted disciplinary consequences. |
| Technique Details | Pull 24 months of incident-reporting system records and HR disciplinary records; cross-tabulate to see whether staff who filed a report were more likely to face subsequent disciplinary action than staff who did not. |
| Recommended Tool | Metabase (open-source BI/cross-tab tool) |

**Step 2 — "Near-miss silence" interviews**

The cross-reference gives you the shape of the problem; these interviews give you the mechanism — the exact moment a staff member decided not to report, and what they were afraid would happen if they did.

| Element | Detail |
|---|---|
| Technique Name | Critical-incident interview |
| Technique Goal | Map the actual decision process behind a withheld near-miss report. |
| Technique Details | From survey and focus-group respondents who admitted anonymously to withholding a report, recruit a willing subset for confidential 1:1 interviews under a strict non-disciplinary protocol, agreed with HR and the Union/staff-association in advance. |
| Recommended Tool | Nextcloud Forms (consent tracking) + Taguette (coding) |

*RACSI for Task T1.2.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | HRBP | SUP | ES, EU |

**Task T1.3 — [Joint] Diagnosis Readout & Sponsor Commitment**

**Step 1 — Evidence-based executive readout**

The readout has to make the cost of the status quo impossible to wave away — patient-safety exposure and litigation risk land harder with a Board than an engagement score does.

| Element | Detail |
|---|---|
| Technique Name | Evidence-based briefing |
| Technique Goal | Convert diagnosis findings into a business case the executive team cannot dismiss as anecdote. |
| Technique Details | Present the quantified survey scores, the incident-versus-report gap, and 3–5 anonymized illustrative quotes, framed explicitly against patient-safety exposure and litigation cost rather than morale alone. |
| Recommended Tool | Metabase for the data; LibreOffice Impress for the briefing deck |

**Step 2 — Sponsorship charter signing**

Verbal executive agreement is not sponsorship. A specific, personally-owned behavior commitment, logged and revisited at every Phase Gate, is.

| Element | Detail |
|---|---|
| Technique Name | Charter co-signing session |
| Technique Goal | Convert verbal buy-in into a documented, individually-owned commitment before design work begins. |
| Technique Details | Walk the CEO and executive team through CHTR-01 (Sponsorship / Leadership Charter) line by line; ask each executive to name one specific behavior they will personally change, and log each commitment in journi's Charter Registry. |
| Recommended Tool | journi M5 — CM Charters |

*RACSI for Task T1.3.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM, ES | ES | HRBP, SUP | CM | EU |


### 6.2 Phase 2 — Target Values Design (Months 2–5)

Turns the diagnosis into four named, behaviorally-specific values — not a poster. This phase's most important design constraint: values imposed top-down by the executive team, without frontline input, reliably produce exactly the cynicism Phase 6 of this guide exists to manage. Co-design is not a nicety here; it is risk mitigation for eighteen months from now.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Phase 1 diagnosis findings; Executive team; Frontline staff volunteers | Quantified culture baseline; incident-vs-report gap analysis; illustrative quotes | 1. Values Co-Design Workshops<br>2. Sponsorship & Governance Charter Set-Up<br>3. Values Definition & Behavior Anchors | Four named target values; activated Charter Registry; behaviorally-anchored value definitions | Executive team; Steering Committee; Unit Leaders; Change Manager |

*SIPOC for Phase 2 — Target Values Design.*

**Tasks, Steps, Techniques & RACSI**

**Task T2.1 — [CM] Values Co-Design Workshops**

**Step 1 — Cross-level co-design workshop series**

A value staff helped name survives contact with a bad shift far better than one handed down in a memo; the workshop series exists to make co-authorship real, not ceremonial.

| Element | Detail |
|---|---|
| Technique Name | Cross-level co-design workshop |
| Technique Goal | Generate candidate values and behavioral language directly from staff across every seniority band, not just leadership. |
| Technique Details | Run a series of half-day workshops mixing frontline staff, Unit Leaders, and executives in fixed small groups; each group proposes candidate values with a one-sentence behavioral description, then the full set is affinity-mapped for overlap. |
| Recommended Tool | Excalidraw (affinity mapping) + BigBlueButton (remote sessions for smaller clinic sites) |

**Step 2 — Candidate values prioritization and narrowing**

Twenty candidate values is not a values program; narrowing to four forces the organization to actually choose what matters most, rather than trying to be everything to everyone.

| Element | Detail |
|---|---|
| Technique Name | Weighted prioritization exercise |
| Technique Goal | Narrow the affinity-mapped candidates to four final target values with broad cross-level support. |
| Technique Details | Score the shortlisted candidate clusters against diagnosis-derived criteria (directly addresses the reporting-gap finding, is behaviorally observable, is distinct from the others); Steering Committee ratifies the final four. |
| Recommended Tool | LibreOffice Calc (scoring matrix) |

*RACSI for Task T2.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | SUP, EU | HRBP | ES |

**Task T2.2 — [Joint] Sponsorship & Governance Charter Set-Up**

**Step 1 — Charter Registry activation**

Seven of journi's eight charters govern this archetype; activating them together, rather than one at a time as needed, means governance structure is in place before Phase 3's higher-stakes leadership work begins.

| Element | Detail |
|---|---|
| Technique Name | Charter Registry activation |
| Technique Goal | Formally activate every Charter Registry entry this archetype uses, with a named accountable role per charter. |
| Technique Details | For each applicable charter, work with the role journi's default RACSI names as Accountable to complete Cedarbrook-specific What/Who/When/Where/Why/How detail, then formally activate it. |
| Recommended Tool | journi M5 — CM Charters |

**Step 2 — Steering Committee charter and cadence formation**

The Steering Committee's own governance rhythm has to exist before the first Phase Gate decision, not be improvised at the gate itself.

| Element | Detail |
|---|---|
| Technique Name | Steering Committee formation |
| Technique Goal | Stand up the Steering Committee's membership, decision rights, and meeting cadence ahead of the first Phase Gate. |
| Technique Details | Confirm Steering Committee membership (Executive Sponsor, Change Manager, Program Manager, HR Business Partner, and two rotating Unit Leaders), and set the governance cadence detailed in Section 10. |
| Recommended Tool | journi M9/M11 — Governance Dashboards & Phase Gates |

*RACSI for Task T2.2.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM, ES | ES | HRBP, PM | SUP | EU |

**Task T2.3 — [CM] Values Definition & Behavior Anchors**

**Step 1 — Behavioral anchor drafting**

"Radical Transparency" means nothing operational until someone can say exactly what doing it, and not doing it, looks like on an ordinary Tuesday shift.

| Element | Detail |
|---|---|
| Technique Name | Behaviorally-anchored value definition |
| Technique Goal | Convert each of the four values into 3–5 concrete, observable "looks like / does not look like" behavior statements. |
| Technique Details | For each value, run a working session with a mixed group of Unit Leaders and frontline staff to draft specific behavior anchors, tested against real incidents surfaced in Phase 1 rather than hypothetical scenarios. |
| Recommended Tool | BookStack (behavior anchor documentation) |

**Step 2 — Definition publication and feedback loop**

Publishing without a feedback channel turns co-design into theater at the last step; a short open-comment window before final lock-in keeps it real.

| Element | Detail |
|---|---|
| Technique Name | Open-comment publication cycle |
| Technique Goal | Publish draft behavior anchors org-wide and incorporate feedback before final lock-in. |
| Technique Details | Publish drafts to all staff with a two-week open-comment window via a structured feedback form; Change Manager triages comments and brings material revisions back to the co-design group before the Steering Committee locks the final language. |
| Recommended Tool | Nextcloud Forms + BookStack |

*RACSI for Task T2.3.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | SUP, EU, HRBP | ES | EU |


### 6.3 Phase 3 — Leadership Modeling & Reinforcement Build (Months 4–8)

Builds the two structures a values program cannot survive without: visible, measured executive modeling, and a reinforcement system that rewards the new behaviors before the org-wide rollout gives everyone a reason to test whether leadership means it. This is also where Exception E1 (Section 9.1) most often first appears, and where the 360 baseline this phase establishes becomes that exception's detection mechanism.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Executive team; Phase 2 behavior anchors; Champion Network volunteers | Four behaviorally-anchored values; signed Sponsorship Charter | 1. Executive Modeling Commitment & 360 Baseline<br>2. Reinforcement System Design<br>3. Manager Readiness Enablement | Executive 360 modeling baseline; recognition and escalation reinforcement system; enabled Unit Leader cohort | Executive team; Unit Leaders; Champion Network; Change Manager |

*SIPOC for Phase 3 — Leadership Modeling & Reinforcement Build.*

**Tasks, Steps, Techniques & RACSI**

**Task T3.1 — [ES] Executive Modeling Commitment & 360 Baseline**

**Step 1 — Behavior-specific executive commitments**

A generic "I will champion transparency" commitment cannot be measured and cannot be held to; a specific one — naming a recurring meeting, a recurring decision, a recurring moment — can.

| Element | Detail |
|---|---|
| Technique Name | Specific behavior-commitment drafting |
| Technique Goal | Convert each executive's Phase 1 charter commitment into a specific, observable behavior tied to a recurring situation. |
| Technique Details | One-on-one session between the Change Manager and each executive to name one concrete, recurring behavior per value (for example, publicly naming their own near-miss in the next three leadership meetings); log each in the Charter Registry against CHTR-01. |
| Recommended Tool | journi M5 — CM Charters |

**Step 2 — Baseline 360 modeling assessment**

Establishing the baseline now, before the org-wide rollout, is what makes Exception E1's detection mechanism (Section 9.1) possible eighteen months from now — you cannot flag a gap against a baseline that was never measured.

| Element | Detail |
|---|---|
| Technique Name | Self-vs-peer 360 modeling assessment |
| Technique Goal | Establish each executive's baseline self-vs-team modeling score before rollout begins. |
| Technique Details | Administer the quarterly self-vs-peer modeling survey (the same instrument Exception E1 later uses to detect drift) to every executive and their direct team, per behavior anchor. |
| Recommended Tool | LimeSurvey + Metabase |

*RACSI for Task T3.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| ES | ES | CM | HRBP | SUP, EU |

**Task T3.2 — [CM] Reinforcement System Design**

**Step 1 — Recognition system design**

Reinforcement has to be visible and frequent, not an annual award, or ADKAR's Reinforcement stage never actually gets built — it stays a slide in a deck.

| Element | Detail |
|---|---|
| Technique Name | Peer-nominated recognition system |
| Technique Goal | Design a lightweight, frequent recognition mechanism tied directly to the four behavior anchors. |
| Technique Details | Build a simple peer-nomination form where any staff member can log a specific instance of a colleague demonstrating one of the four values; nominations are reviewed weekly by Unit Leaders and shared at unit huddles. |
| Recommended Tool | Nextcloud Forms |

**Step 2 — Non-disciplinary escalation path design**

The reinforcement system also has to include the mirror case — what happens when someone speaks up and it goes badly — or Psychological Safety stays theoretical the first time it is tested.

| Element | Detail |
|---|---|
| Technique Name | Non-disciplinary escalation path |
| Technique Goal | Design and publish a clear path for staff to escalate a case where speaking up was met with retaliation or blame, protected from the normal disciplinary chain. |
| Technique Details | Design an escalation path routing directly to HR Business Partner and the Change Manager rather than the reporting staff member's own chain of command, with a defined response-time SLA. |
| Recommended Tool | Nextcloud Forms + journi M16 — Resistance Management |

*RACSI for Task T3.2.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | HRBP, SUP | ES | EU |

**Task T3.3 — [Joint] Manager Readiness Enablement**

**Step 1 — Coaching-based readiness sessions**

This is deliberately not training: MP-05 does not exist in this chain, and a lecture on "how to model psychological safety" would itself contradict the value it is trying to teach. Coaching, built around the manager's own real situations, is the substitute.

| Element | Detail |
|---|---|
| Technique Name | Peer coaching circles |
| Technique Goal | Build Unit Leaders' capability to model and reinforce the new values through practice on their own real situations, without a formal training curriculum. |
| Technique Details | Group Unit Leaders into small peer coaching circles that meet biweekly through the rest of the program, working through real, current situations from their own units against the behavior anchors, facilitated by the Change Manager for the first two sessions only. |
| Recommended Tool | BigBlueButton / Jitsi |

**Step 2 — Manager readiness baseline rating**

Section 7's monthly manager-readiness cadence, and Exception E6's succession protocol, both depend on a baseline rating existing before rollout — otherwise "declining" has nothing to be measured against.

| Element | Detail |
|---|---|
| Technique Name | Manager readiness baseline rating |
| Technique Goal | Establish a documented readiness rating for every Unit Leader before the pilot begins. |
| Technique Details | Change Manager rates each Unit Leader on a defined readiness rubric (modeling behavior, coaching capability, escalation-path fluency), logged in journi and revisited monthly from Phase 4 onward. |
| Recommended Tool | journi M17 — Manager Readiness Tracking |

*RACSI for Task T3.3.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM, SUP | CM | ES | HRBP | EU |


### 6.4 Phase 4 — Pilot Cohort (Months 7–12)

Proves the model on two units before the org-wide rollout multiplies any design flaw across fourteen sites. This is also where the resistance systemic-pattern threshold from Section 7.5 is first exercised for real, and where Exception E2 (Section 9.2) most often surfaces.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Phase 3 reinforcement system; Unit Leader readiness ratings; candidate pilot units | Behavior anchors; recognition and escalation systems; manager readiness baseline | 1. Pilot Unit Selection & Baseline<br>2. Pilot Execution & Resistance Pattern Monitoring<br>3. Pilot Go/No-Go Readout | Two live pilot units; resistance pattern log; documented Go/No-Go decision | Steering Committee; remaining twelve sites; Change Manager |

*SIPOC for Phase 4 — Pilot Cohort.*

**Tasks, Steps, Techniques & RACSI**

**Task T4.1 — [CM] Pilot Unit Selection & Baseline**

**Step 1 — Pilot unit selection**

Choosing the friendliest unit produces a pilot that tells you nothing about the fourteen sites that are not friendly; choosing on readiness spread instead produces evidence that actually generalizes.

| Element | Detail |
|---|---|
| Technique Name | Readiness-spread pilot selection |
| Technique Goal | Select two pilot units that together represent Cedarbrook's real range of readiness, not its two most favorable units. |
| Technique Details | Rank all fourteen sites' units by Phase 1 diagnosis scores and Phase 3 manager readiness ratings; select one above-median and one below-median unit, avoiding the single most enthusiastic or most resistant outliers at either end. |
| Recommended Tool | LibreOffice Calc (ranking matrix) |

**Step 2 — Pilot baseline capture**

Without a clean pre-pilot baseline, the Go/No-Go readout in Step 2 of Task T4.3 has nothing rigorous to compare against.

| Element | Detail |
|---|---|
| Technique Name | Pilot baseline capture |
| Technique Goal | Capture each pilot unit's pre-pilot readings across every metric the pilot will later be judged against. |
| Technique Details | Log each pilot unit's current Bridges position, dominant sentiment, incident-reporting volume, and manager readiness rating in journi immediately before pilot launch. |
| Recommended Tool | journi M7 — Readiness Assessment |

*RACSI for Task T4.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | SUP | PM | ES, HRBP |

**Task T4.2 — [CM] Pilot Execution & Resistance Pattern Monitoring**

**Step 1 — Weekly pilot pulse check**

A monthly check leaves too much room for a small, fixable problem to compound into a resistance pattern before anyone notices; weekly is the minimum cadence for a live pilot.

| Element | Detail |
|---|---|
| Technique Name | Weekly pilot pulse check |
| Technique Goal | Track pilot-unit sentiment and behavior-anchor adoption on a tight enough cadence to catch problems while they are still small. |
| Technique Details | Short weekly pulse survey to pilot unit staff (3–4 questions, under two minutes), reviewed by the Change Manager every Friday alongside that week's incident-reporting volume. |
| Recommended Tool | LimeSurvey + Metabase |

**Step 2 — Resistance entry coding and pattern detection**

An individual complaint and an emerging systemic pattern look identical as single entries; coding every entry consistently is what lets journi's threshold logic (Section 7.5) tell them apart.

| Element | Detail |
|---|---|
| Technique Name | Structured resistance-entry coding |
| Technique Goal | Log every resistance signal from the pilot in a consistent, structured format so systemic patterns are detectable rather than anecdotal. |
| Technique Details | Every resistance signal — a complaint, a pulse-survey flag, a manager observation — is logged with a standard category code; three or more similarly-coded entries within 30 days trigger the systemic-pattern threshold defined in Section 7.5. |
| Recommended Tool | journi M16 — Resistance Management |

*RACSI for Task T4.2.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | SUP | HRBP | ES, EU |

**Task T4.3 — [Joint] Pilot Go/No-Go Readout**

**Step 1 — Baseline-to-current comparison analysis**

The whole point of Task T4.1's baseline capture is spent here: the Go/No-Go decision has to rest on the measured delta, not on how the pilot felt to the people running it.

| Element | Detail |
|---|---|
| Technique Name | Baseline-to-current comparison analysis |
| Technique Goal | Quantify the pilot's actual movement on every metric captured at baseline. |
| Technique Details | Compare each pilot unit's current Bridges position, sentiment, incident-reporting volume, and manager readiness rating against its Task T4.1 baseline; present the delta, not just the current state. |
| Recommended Tool | Metabase |

**Step 2 — Steering Committee Go/No-Go decision**

A pilot that produced real evidence — including real resistance, honestly logged — is worth more to this decision than one that looked clean because problems went unreported.

| Element | Detail |
|---|---|
| Technique Name | Evidence-based Go/No-Go decision |
| Technique Goal | Make an explicit, minuted Steering Committee decision to proceed to org-wide rollout, extend the pilot, or revise the design. |
| Technique Details | Present the comparison analysis and the full resistance-entry log, including any systemic-pattern alerts and how they were resolved, to the Steering Committee for a documented Phase Gate decision. |
| Recommended Tool | journi M9/M11 — Governance Dashboards & Phase Gates |

*RACSI for Task T4.3.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM, ES | ES | PM, HRBP, SUP | CM | EU |


### 6.5 Phase 5 — Organization-Wide Rollout (Months 11–17)

Extends the pilot's proven design to all fourteen sites, sequenced rather than launched all at once, so the Champion Network and the systemic-pattern alert process can absorb what the earliest sites surface before the last sites go live. This is the phase in which the Champion Network scales from 45 to roughly 95 people, and in which Section 8.1's Q5 night-shift-reporting-form incident occurs.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Pilot Go decision; remaining twelve sites; pilot-tested reinforcement system | Documented Go decision; pilot resistance-entry log; behavior anchors | 1. Champion Network Scale-Up<br>2. Org-Wide Launch Sequencing by Site<br>3. Systemic-Pattern Alert Response | Scaled Champion Network (~95 people); sequenced 14-site launch; resolved systemic-pattern alerts | All 14 sites; Steering Committee; Change Manager |

*SIPOC for Phase 5 — Organization-Wide Rollout.*

**Tasks, Steps, Techniques & RACSI**

**Task T5.1 — [CM] Champion Network Scale-Up**

**Step 1 — Champion recruitment and role definition**

Forty-five champions from two pilot units does not cover fourteen sites; recruitment has to happen deliberately, site by site, not by hoping volunteers surface on their own.

| Element | Detail |
|---|---|
| Technique Name | Structured champion recruitment |
| Technique Goal | Recruit and onboard enough champions, distributed across all 14 sites, to sustain org-wide coverage. |
| Technique Details | Each Unit Leader nominates 2–3 champion candidates per site; Change Manager screens for credibility with peers (not just enthusiasm) and onboards roughly 50 additional champions, bringing the network to approximately 95. |
| Recommended Tool | journi M14 — Champion Network |

**Step 2 — Champion community of practice**

An isolated champion at a single clinic site loses momentum fast; a shared forum across all 95 keeps the role visible and mutually reinforcing.

| Element | Detail |
|---|---|
| Technique Name | Champion community-of-practice forum |
| Technique Goal | Give the scaled champion network a shared space to share observations and sustain momentum across sites. |
| Technique Details | Stand up a monthly cross-site community-of-practice session where champions share real observations (the source of Section 7.6's "at least one case shared" healthy-month signal) and troubleshoot together. |
| Recommended Tool | BigBlueButton / Jitsi + BookStack (shared case log) |

*RACSI for Task T5.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | SUP | HRBP | ES, EU |

**Task T5.2 — [Joint] Org-Wide Launch Sequencing by Site**

**Step 1 — Site sequencing plan**

Launching all fourteen sites on one date means any design flaw the pilot did not catch gets multiplied everywhere simultaneously; sequencing in waves lets the first wave's lessons reach the last wave before it launches.

| Element | Detail |
|---|---|
| Technique Name | Wave-based launch sequencing |
| Technique Goal | Sequence the 14 remaining sites into launch waves that let early lessons reach later waves before they go live. |
| Technique Details | Group the twelve remaining sites into three waves of roughly four sites each, spaced six weeks apart; each wave's launch briefing includes a summary of what the previous wave's first two weeks surfaced. |
| Recommended Tool | journi M11 — Steering & Phase Gates |

**Step 2 — Site launch communications**

The four values need to arrive at each site as a continuation of the pilot's evidence, not as a fresh corporate announcement — otherwise sites treat it as this quarter's initiative rather than a program that already has a track record.

| Element | Detail |
|---|---|
| Technique Name | Evidence-based site launch briefing |
| Technique Goal | Introduce each launching site to the program using the pilot's actual evidence, not generic messaging. |
| Technique Details | Each site's launch communication package includes the pilot's real before/after data and at least one named pilot-unit staff testimonial, delivered by that site's own Unit Leader rather than a corporate email. |
| Recommended Tool | journi M13 — Communications |

*RACSI for Task T5.2.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM, SUP | CM | ES | PM | EU |

**Task T5.3 — [CM] Systemic-Pattern Alert Response**

**Step 1 — Cross-site pattern triage**

A single site's complaint is a local issue; the same complaint from three different sites in the same window is a structural design flaw — and only cross-site triage, not per-site triage, can tell the difference.

| Element | Detail |
|---|---|
| Technique Name | Cross-site systemic-pattern triage |
| Technique Goal | Detect when resistance entries from multiple sites describe the same structural problem, not three unrelated local issues. |
| Technique Details | When journi's systemic-pattern threshold fires (three or more similarly-coded entries within 30 days, per Section 7.5), Change Manager pulls the full entry set across all reporting sites to confirm whether it is one structural cause. |
| Recommended Tool | journi M16 — Resistance Management + Metabase |

**Step 2 — Structural fix within SLA**

Cedarbrook's actual Q5 example — night-shift staff across three sites all describing the incident-report form as punitive to fill out without a same-shift co-signer — was fixed inside this five-day window precisely because the fix targeted the form, not the staff who complained about it.

| Element | Detail |
|---|---|
| Technique Name | Rapid structural fix |
| Technique Goal | Ship a structural fix to a confirmed systemic pattern within a defined service-level window, and confirm it does not recur. |
| Technique Details | Design and ship the structural fix within five business days of confirmation (per Section 9's escalation discipline); monitor the same entry category for 30 days afterward to confirm the pattern does not recur. |
| Recommended Tool | journi M16 — Resistance Management |

*RACSI for Task T5.3.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | SUP, HRBP | ITL | ES, EU |


### 6.6 Phase 6 — Reinforcement Through Skepticism (Months 15–22)

The phase this entire guide is built around. Every archetype eventually meets a "flavor of the month" moment — the point where the launch-event enthusiasm has worn off and staff start testing, consciously or not, whether the new values actually hold under pressure. For cultural change this moment is not a risk to be avoided; it is a structurally certain, plannable event, which is exactly why journi tracks a dedicated cynicism pulse metric and a Divergence Review Board rather than leaving Phase 6 to informal monitoring. Section 8.1's Q6 dip and Exceptions E3 and E4 (Sections 9.3–9.4) are this phase's data, not an aberration from it.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| All 14 rolled-out sites; Champion Network; Divergence Pattern alerts | Org-wide behavior-anchor adoption data; resistance-entry log; manager readiness ratings | 1. Cynicism Pulse Monitoring & Response<br>2. Divergence Review Board Operations<br>3. Manager Coaching Sprint for Declining Readiness | Monthly cynicism trend; resolved divergence cases; recovered manager readiness ratings | Executive Sponsor; Steering Committee; all staff |

*SIPOC for Phase 6 — Reinforcement Through Skepticism.*

**Tasks, Steps, Techniques & RACSI**

**Task T6.1 — [CM] Cynicism Pulse Monitoring & Response**

**Step 1 — Monthly cynicism pulse survey**

A quarterly reading is too slow to catch a spike before it hardens into settled disbelief; monthly is the minimum cadence once org-wide rollout is complete.

| Element | Detail |
|---|---|
| Technique Name | Monthly cynicism pulse survey |
| Technique Goal | Track org-wide belief that the values program is genuine, on a cadence tight enough to catch a spike early. |
| Technique Details | Short monthly survey (4–5 items plus free text) measuring perceived leadership sincerity and perceived durability of the program, trended by site and org-wide against the defined floor threshold from Section 7.5. |
| Recommended Tool | LimeSurvey + Metabase |

**Step 2 — Threshold-triggered executive response**

The response protocol exercised in Exception E3 (Section 9.3) is defined here, not improvised in the moment it is needed.

| Element | Detail |
|---|---|
| Technique Name | Threshold-triggered executive open forum |
| Technique Goal | Guarantee a fast, visible executive response the moment the cynicism pulse crosses its defined floor. |
| Technique Details | When the pulse score drops below the defined floor for two consecutive months, the Executive Sponsor is contractually committed (via CHTR-01) to an unscripted open Q&A within two weeks, following the protocol detailed as Exception E3. |
| Recommended Tool | BigBlueButton / Jitsi |

*RACSI for Task T6.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | ES | HRBP, SUP | EU |

**Task T6.2 — [Joint] Divergence Review Board Operations**

**Step 1 — Divergence Pattern alert triage**

High stated awareness with zero measured behavior change (the pattern behind Exception E2, Section 9.2) can originate anywhere across fourteen sites; a standing board, not an ad hoc response, is what keeps triage consistent.

| Element | Detail |
|---|---|
| Technique Name | Divergence Pattern alert triage |
| Technique Goal | Review every journi Divergence Pattern alert (high awareness, no measured behavior change) within its 5-business-day SLA. |
| Technique Details | A standing Divergence Review Board — Change Manager, one rotating Unit Leader, and HR Business Partner — reviews every open alert weekly, ensuring none ages past the 5-business-day threshold defined in Section 7.5. |
| Recommended Tool | journi M20 — Metrics & Benchmarking |

**Step 2 — Quarterly Composite Readiness Index and Benchmarking report**

The Board's real product, beyond individual alerts, is the quarterly trend line that tells the Steering Committee whether Phase 6 as a whole is on track — this is where Section 8's own Table 8.1 data would be assembled inside Cedarbrook's own program.

| Element | Detail |
|---|---|
| Technique Name | Quarterly CRI and Benchmarking report |
| Technique Goal | Give the Steering Committee and the Board a full quarterly trend view against journi's cultural reference band. |
| Technique Details | Compile the quarter's Composite Readiness Index, Bridges/Kübler-Ross readings, and Benchmarking standing into a single report, explicitly framed against the cultural reference band rather than a straight-line target. |
| Recommended Tool | journi M20 — Metrics & Benchmarking; LibreOffice Impress for the Board deck |

*RACSI for Task T6.2.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM, HRBP | CM | SUP | ES | EU |

**Task T6.3 — [CM] Manager Coaching Sprint for Declining Readiness**

**Step 1 — Declining-trend detection**

A single bad month is noise; two consecutive declining months for the same Unit Leader is the signal Section 7.5 defines as the trigger for intervention.

| Element | Detail |
|---|---|
| Technique Name | Manager readiness trend review |
| Technique Goal | Detect any Unit Leader whose readiness rating has declined for two consecutive months. |
| Technique Details | Monthly automated review of every Unit Leader's readiness rating trend against their own Phase 3 baseline; any two-consecutive-month decline auto-flags for the coaching sprint. |
| Recommended Tool | journi M17 — Manager Readiness Tracking |

**Step 2 — Intensive coaching sprint**

A declining manager is often the earliest visible warning of a site-level problem the pulse survey has not caught yet; the sprint exists to catch and correct it before it becomes a site-wide pattern.

| Element | Detail |
|---|---|
| Technique Name | Intensive coaching sprint |
| Technique Goal | Reverse a declining manager readiness trend through focused, short-cycle coaching before it becomes a site-wide pattern. |
| Technique Details | Change Manager runs a focused three-session coaching sprint with the flagged Unit Leader over two weeks, addressing their specific declining behaviors directly, then re-rates readiness at the end of the sprint. |
| Recommended Tool | BigBlueButton / Jitsi |

*RACSI for Task T6.3.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | SUP | HRBP | ES, EU |


### 6.7 Phase 7 — Institutionalization (Months 20–24, open-ended beyond)

Locks the four values into the systems that outlast any individual sponsor or champion — hiring, onboarding, and policy — and produces the evidentiary record the Steering Committee needs to justify a Refreeze that will actually hold. This phase deliberately overlaps Phase 6: institutionalizing hiring criteria begins while reinforcement work against skepticism is still active, because waiting for skepticism to fully resolve before institutionalizing anything would mean never starting.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| HR policy and hiring functions; Phase 6 quarterly reports; full 24-month evidence record | Recovered readiness trend; Q7–Q8 Benchmarking data; behavior anchors | 1. Policy & Hiring Criteria Institutionalization<br>2. Refreeze Justification & Steering Committee Sign-Off<br>3. Governance Handover & Benefits Realization Report | Updated hiring/onboarding criteria; signed Refreeze justification; governance handover package | HR; Steering Committee; Board; incoming site-level owners |

*SIPOC for Phase 7 — Institutionalization.*

**Tasks, Steps, Techniques & RACSI**

**Task T7.1 — [HRBP] Policy & Hiring Criteria Institutionalization**

**Step 1 — Hiring and onboarding criteria redesign**

A values program that never touches hiring is only managing the population it already has; new hires who were never assessed against the four values quietly dilute five years of reinforcement work.

| Element | Detail |
|---|---|
| Technique Name | Behavior-anchored hiring criteria redesign |
| Technique Goal | Embed the four behavior anchors into hiring interview guides and onboarding curricula going forward. |
| Technique Details | HR Business Partner redesigns interview guides to include a structured behavioral question per value, and rewrites the new-hire onboarding package to introduce the values through the same behavior anchors used org-wide, not fresh corporate language. |
| Recommended Tool | BookStack |

**Step 2 — Policy and performance-review integration**

Institutionalization is not complete until the values appear in the systems staff are actually evaluated against — a poster in the break room does not survive a leadership transition; a performance-review criterion does.

| Element | Detail |
|---|---|
| Technique Name | Performance-review criteria integration |
| Technique Goal | Embed the four values into the standing performance-review process so they persist independent of any single program owner. |
| Technique Details | Add one behavior-anchored rating item per value to the standard performance-review template, effective the next full review cycle, with calibration guidance for Unit Leaders. |
| Recommended Tool | BookStack + LibreOffice Calc (calibration guide) |

*RACSI for Task T7.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| HRBP | HRBP | CM, SUP | ES | EU |

**Task T7.2 — [Joint] Refreeze Justification & Steering Committee Sign-Off**

**Step 1 — Full evidentiary record compilation**

The justified-change-pattern rule (Section 2.2) exists precisely to stop this decision from being made on launch-event memory; the record compiled here has to span the whole 24 months, Q6 dip included, not just the strongest quarter.

| Element | Detail |
|---|---|
| Technique Name | Full evidentiary record compilation |
| Technique Goal | Assemble the complete 24-month evidence record — including the Q6 setback and its resolution — into a single Refreeze justification package. |
| Technique Details | Compile every quarterly CRI and Benchmarking reading, the Q6 dip and its documented resolution, the resistance-entry and Divergence Pattern logs, and current hiring/policy institutionalization status into one package. |
| Recommended Tool | journi M20 — Metrics & Benchmarking; LibreOffice Impress |

**Step 2 — Steering Committee Refreeze sign-off**

Signing off on the evidence, including the setback, is what makes this Refreeze different from a premature one signed on launch-day enthusiasm — the exact trap Section 2.2 warns against.

| Element | Detail |
|---|---|
| Technique Name | Documented Refreeze sign-off |
| Technique Goal | Obtain an explicit, minuted Steering Committee and Board decision to formally Refreeze, citing the full evidentiary record. |
| Technique Details | Present the full record to the Steering Committee and Board; the Refreeze justification is signed only once Benchmarking has read "Ahead" for at least two consecutive quarters and no open systemic-pattern alerts remain unresolved. |
| Recommended Tool | journi M9/M11 — Governance Dashboards & Phase Gates |

*RACSI for Task T7.2.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM, ES | ES | PM, HRBP, SUP | CM | EU |

**Task T7.3 — [PM] Governance Handover & Benefits Realization Report**

**Step 1 — Site-level ownership handover**

A central Change Management team cannot sustain fourteen sites' values reinforcement indefinitely; ownership has to transfer to standing site leadership before the program team stands down.

| Element | Detail |
|---|---|
| Technique Name | Site-level ownership handover |
| Technique Goal | Transfer day-to-day values reinforcement ownership from the central program team to standing Unit Leader and HR structures. |
| Technique Details | Formal handover package per site documenting the local champion roster, open items, and the standing monthly/quarterly cadence from Section 10, signed off by the receiving Unit Leader. |
| Recommended Tool | BookStack |

**Step 2 — Benefits realization report**

The Board mandated this program on a patient-safety and litigation-risk business case in Phase 1; closing the loop against that same case, not a generic culture narrative, is what proves the eighteen months delivered what was promised.

| Element | Detail |
|---|---|
| Technique Name | Benefits realization report |
| Technique Goal | Report the program's outcomes against the original Phase 1 diagnosis business case. |
| Technique Details | Report the final incident-versus-report gap, patient-safety-relevant metrics, and CRI/Benchmarking trajectory directly against the baseline and business case established in Section 6.1, Task T1.3. |
| Recommended Tool | journi M20 — Metrics & Benchmarking; LibreOffice Impress |

*RACSI for Task T7.3.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| PM | PM | CM, HRBP | ES | SUP, EU |


## 7. What to Track — By Cadence

### 7.1 Daily

- Incident-reporting system volume and tone, spot-checked by the Change Manager for early signs of a form or process becoming punitive to use (the pattern behind the Q5 night-shift fix in Section 8.1).
- Non-disciplinary escalation path (Section 6.3, Task T3.2) intake, reviewed same-day to keep the response-time SLA honest.

### 7.2 Weekly

- Pilot pulse check during Phase 4 (Section 6.4, Task T4.2) and, once org-wide, a rolling sample of site-level sentiment.
- Resistance-entry log review for any category approaching the systemic-pattern threshold before it formally trips.
- Champion Network coverage check — any unit that has gone quiet (no logged observations in 10+ days) flagged for a check-in call, not assumed to be problem-free.

### 7.3 Monthly

- Cynicism pulse survey administration and trend review, from Phase 6 onward (Section 6.6, Task T6.1).
- Divergence Review Board session (Section 6.6, Task T6.2).
- Manager readiness rating review across all Unit Leaders (M17).
- Steering Committee governance meeting, per the cadence defined in Section 6.2's Task T2.2.

### 7.4 Quarterly

- Full Composite Readiness Index and Benchmarking trend report to the Board, explicitly framed against the cultural reference band (Section 6.6, Task T6.2).
- Charter review cycle — most of the seven active charters carry a quarterly or per-Phase-Gate review frequency; batch the quarterly-cadence charters into one Steering Committee session.
- Champion Network health check — recruitment gaps, burnout risk, and rotation of long-serving champions.

### 7.5 Escalation Thresholds

| Signal | Threshold | Escalation |
|---|---|---|
| Cynicism pulse score | Drops below the defined floor for 2 consecutive months | Executive Sponsor hosts an unscripted open Q&A within 2 weeks (Section 6.6, T6.1) |
| Divergence Pattern alert | Any single alert older than 5 business days without a logged response plan | Change Manager escalates directly to the Divergence Review Board, out of cycle |
| Site Benchmarking standing | "Behind" for 2 consecutive weeks during rollout | Site added to the following week's Steering Committee agenda by name |
| Manager readiness rating | Declining for 2 consecutive months for the same Unit Leader | Intensive coaching sprint triggered (Section 6.6, T6.3) |
| Resistance systemic-pattern banner | 3 or more similarly-coded entries within a 30-day window | Root-cause structural response convened within 5 business days (Section 6.4, T4.2) |
| Champion silence | No logged observation from a champion for 10+ days | Change Manager places a direct, non-disciplinary check-in call |

### 7.6 Monthly Dashboard — What a Healthy Month Looks Like

A month should show: a stable or improving cynicism pulse score; zero Divergence Pattern alerts older than five business days; no site reading "Behind" on Benchmarking for more than one consecutive week; at least one Champion Network case shared and discussed at the community-of-practice forum; and no Unit Leader newly flagged on a declining manager-readiness trend without an already-assigned coaching plan. A month that is missing one of these is not automatically a crisis — Section 9's exception patterns cover the recognizable, recoverable ways a month goes wrong — but a month missing two or more at once is the trigger for an out-of-cycle Steering Committee review.


## 8. Simulated Data Walkthrough — Project Concord

Project Concord is Cedarbrook Health Network's internal name for its 24-month Cultural / Values Transformation program. This section walks through what the framework readings, the Composite Readiness Index, and journi's alerts actually looked like quarter over quarter — including a real setback in Quarter 6, because a walkthrough with no setback in it would not prepare a reader for the one their own program will have.

| Quarter | Months | Lewin State | Bridges Position (org avg.) | Dominant Sentiment | Composite Readiness Index | Benchmarking |
|---|---|---|---|---|---|---|
| Q1 | 1–3 | Unfreeze | Ending | Denial | 32 | In Line |
| Q2 | 4–6 | Unfreeze | Ending | Denial → Resistance | 36 | In Line |
| Q3 | 7–9 | Unfreeze → Change | Ending (org); Neutral Zone (pilot units) | Resistance | 41 | In Line |
| Q4 | 10–12 | Change | Neutral Zone (pilot); Ending (rest) | Exploration (pilot); Resistance (rest) | 47 | In Line |
| Q5 | 13–15 | Change | Neutral Zone | Exploration | 52 | In Line |
| Q6 | 16–18 | Change | Neutral Zone, with regression risk flagged | Exploration dipping toward Resistance | 49 | In Line |
| Q7 | 19–21 | Change | Neutral Zone → New Beginning (early cohorts) | Exploration; Commitment (early cohorts) | 58 | Ahead |
| Q8 | 22–24 | Change → Refreeze | New Beginning (org avg.) | Commitment | 64 | Ahead |

*Table 8.1 — Project Concord's quarter-over-quarter framework readings across the full 24-month program.*

### 8.1 Reading the Simulation

**Q1–Q2 (Diagnosis and Target Values Design).** The Composite Readiness Index climbs slowly and unremarkably, from 32 to 36 — exactly as expected for a phase that is measuring the current state, not yet changing it. The Sponsorship Charter is signed at the end of Q1 with eleven specific, named executive commitments logged in M5; by the end of Q2, four target values are finalized and behaviorally anchored.

**Q3–Q4 (Leadership Modeling, Pilot Cohort).** The Bridges position begins to diverge visibly between the two pilot units and the rest of the organization — exactly what a pilot is supposed to produce. By the Q4 Go/No-Go decision, the pilot units read Neutral Zone with Exploration-stage sentiment, while the remaining twelve sites are still reading Ending with Resistance. The Steering Committee's Go decision at the end of Q4 is made on this evidence, not on the calendar.

**Q5 (Organization-Wide Rollout).** The Champion Network scales from 45 to roughly 95 people. The first enterprise-wide systemic-pattern alert fires mid-quarter — three near-identical resistance entries from night-shift staff at three different sites, all describing the incident-report form itself as feeling punitive to fill out during a night shift with no supervisor immediately available to co-sign. The structural fix (a night-shift-appropriate reporting path that does not require same-shift co-signature) ships within the five-business-day SLA, and the pattern does not recur.

**Q6 (the dip).** The Composite Readiness Index falls for the only time in the program, from 52 to 49, and the monthly cynicism pulse crosses its threshold. This is the "flavor of the month" moment Section 6.6 is built around, and it is documented in full as Exception E3 in Section 9.3. The Executive Sponsor's unscripted Q&A session, run within the two-week escalation window, directly names a specific incident where Cedarbrook fell short — a case where a well-known, high-performing surgeon's disclosure was quietly waived through the new process without the same scrutiny an ordinary staff member's would receive. Naming it, rather than avoiding it, is what starts the index moving upward again the following quarter; the incident itself becomes the basis for Exception E4 in Section 9.4.

**Q7–Q8 (Reinforcement, Institutionalization).** The Benchmarking standing crosses from "In Line" to "Ahead" in Q7 — not because the program accelerated, but because journi's cultural reference band already expects a Q5–Q6 dip for this archetype, and Cedarbrook's recovery from it outpaces the reference curve. By Q8, the org-wide Bridges average reads New Beginning with Commitment-stage sentiment, hiring and onboarding criteria have been permanently updated, and the Steering Committee signs a written Refreeze justification at Month 24 — citing the full evidentiary record, not the launch-event enthusiasm from eighteen months earlier.


## 9. Exception Playbook — Six Patterns Specific to Cultural Change

The Cross-Type Comparison Matrix (SRS 10.6.14) rates cultural change as journi's most reversibility-fragile archetype — "High, but slow to fix." A missed ERP cutover or a failed automation pilot is usually visible and correctable within days. A values program that quietly drifts backward is neither: the drift is gradual, socially invisible until it is not, and expensive in trust to reverse once staff have concluded the new values were a phase rather than a commitment. The six patterns below are not hypothetical; each is either the general shape of, or (Exceptions E3 and E4) the exact incident behind, an event already narrated in Section 8's Project Concord walkthrough.

### 9.1 Exception E1 — Values Espoused But Not Modeled by Leadership (Say-Do Gap)

**Pattern.** An executive publicly champions a value — most often during Phase 3, Leadership Modeling & Reinforcement Build — while their own visible behavior contradicts it: praising "Radical Transparency" in a town hall, then privately reprimanding a manager for surfacing a bad number in the next leadership meeting. Nothing damages a values program faster than its own sponsors being the first visible counter-example, because staff read leadership behavior, not leadership language, as the real policy.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Champion Network observation log; Peer/360 modeling assessment | Self-vs-peer modeling score gap; specific witnessed incident | 1. Say-Do Gap Detection & Corrective Reset | Verified gap finding; logged charter breach; witnessed corrective behavior | Executive Sponsor; Change Manager; affected unit staff |

*SIPOC for Exception E1.*

**Tasks, Steps, Techniques & RACSI**

**Task E1.1 — [ES] Say-Do Gap Detection & Corrective Reset**

**Step 1 — Self-vs-peer modeling gap detection**

An executive is structurally the worst-positioned person to notice their own gap; only a peer/team comparison reliably surfaces it before staff have already drawn their own conclusions.

| Element | Detail |
|---|---|
| Technique Name | Self-vs-peer 360 modeling assessment |
| Technique Goal | Quantify the gap between an executive's self-rated value-modeling and how their own team actually rates them, per behavior anchor. |
| Technique Details | Run the quarterly journi-tracked modeling survey comparing each executive's self-score against their team's average score on every behaviorally-anchored value definition from Section 6.2; any anchor with a gap beyond the defined threshold auto-flags for review. |
| Recommended Tool | LimeSurvey + Metabase |

**Step 2 — Sponsor-to-sponsor accountability conversation**

A gap raised by HR lands as compliance; the same gap raised by a peer executive, referencing the specific incident, lands as accountability — and where staff visibly saw the contradiction, only a visible acknowledgment repairs it.

| Element | Detail |
|---|---|
| Technique Name | Sponsor-to-sponsor accountability conversation |
| Technique Goal | Convert a flagged gap into a specific, witnessed behavior change, with public repair where the incident was public. |
| Technique Details | The Executive Sponsor — not HRBP — has the conversation directly with the flagged executive, citing the specific Champion Network entry; where staff visibly witnessed the contradiction, the executive is asked to acknowledge it in that same forum, not a private one. |
| Recommended Tool | journi M5 — CM Charters (breach logged); BigBlueButton for the public forum |

*RACSI for Task E1.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| ES | ES | CM, HRBP | SUP | EU |

### 9.2 Exception E2 — Divergence Pattern: High Awareness, Zero Behavior Change

**Pattern.** Pilot units score high on "I understand what Radical Transparency means" while showing no measurable change in incident-report tone or volume — the classic ADKAR Knowledge-without-Ability-or-Reinforcement gap, and precisely what journi's Divergence Pattern alert exists to catch during Phase 4's Pilot Cohort.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Pilot unit behavior logs; Divergence Pattern alert | High-awareness/zero-behavior-change sample | 1. Divergence Root-Cause Interview & Micro-Practice Redesign | Root-cause classification (capability / permission / reinforcement); redesigned job aids | Change Manager; Unit Leaders; pilot staff |

*SIPOC for Exception E2.*

**Tasks, Steps, Techniques & RACSI**

**Task E2.1 — [CM] Divergence Root-Cause Interview & Micro-Practice Redesign**

**Step 1 — Divergence root-cause interviews**

Awareness-without-behavior has three very different causes — staff cannot, staff do not feel safe to, or the reinforcement design never asked for a concrete action — and each needs a different fix, so guessing which one applies wastes the pilot's remaining runway.

| Element | Detail |
|---|---|
| Technique Name | Divergence root-cause interview |
| Technique Goal | Distinguish whether the awareness-behavior gap is a capability, permission, or reinforcement-design failure. |
| Technique Details | From the flagged high-awareness/zero-behavior-change sample, run structured 1:1 interviews using a fixed "what stopped you" prompt set, sorting responses into capability, permission, or reinforcement-design buckets. |
| Recommended Tool | Taguette |

**Step 2 — Behavior-specific micro-practice redesign**

Abstract value language does not tell anyone what to do differently at 2am on a busy ward; a redesigned job aid that names the single next concrete behavior does.

| Element | Detail |
|---|---|
| Technique Name | Behavior-specific micro-practice redesign |
| Technique Goal | Replace abstract value language in unit job aids with the single concrete next behavior expected in the moment. |
| Technique Details | Rewrite the affected unit's job aids and prompts to name one specific next action per scenario; re-test against the same behavior-log metric two weeks later before scaling the fix beyond the pilot. |
| Recommended Tool | BookStack (job aid authoring) + Excalidraw (behavior-flow diagram) |

*RACSI for Task E2.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| CM | CM | SUP, HRBP | ITL | ES, EU |

### 9.3 Exception E3 — Backlash / Cynicism Spike at Org-Wide Rollout

**Pattern.** The monthly cynicism pulse crosses its threshold for two consecutive months during Organization-Wide Rollout — the exact pattern narrated in Section 8.1 as Project Concord's Q6 dip, where the Composite Readiness Index fell from 52 to 49. This is Section 6.6's "flavor of the month" moment: staff conclude the values program is a phase, not a commitment, unless leadership visibly names and answers the specific thing that triggered the spike.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Monthly cynicism pulse survey; free-text comments | Two consecutive below-floor pulse readings; coded free-text themes | 1. Cynicism Source Triage & Executive Open Forum | Triaged incident list; recorded, unscripted Q&A response | Executive Sponsor; Change Manager; all staff |

*SIPOC for Exception E3.*

**Tasks, Steps, Techniques & RACSI**

**Task E3.1 — [Joint] Cynicism Source Triage & Executive Open Forum**

**Step 1 — Cynicism pulse free-text triage**

A generic "change fatigue" reading and a specific, credible say-do-gap complaint look identical in the topline score; only the free text tells you which one you actually have, and they need completely different responses.

| Element | Detail |
|---|---|
| Technique Name | Cynicism pulse free-text triage |
| Technique Goal | Separate generic change fatigue from a specific, credible incident-based complaint before responding. |
| Technique Details | Code every free-text comment attached to the monthly cynicism pulse survey; any comment referencing a specific named incident, rather than a generic complaint, is escalated directly to the Executive Sponsor within 48 hours. |
| Recommended Tool | LimeSurvey (free text) + Taguette (coding) |

**Step 2 — Unscripted executive open Q&A**

A generic reassurance message reads as confirmation that leadership is dodging the real issue; naming the specific incident, inside the escalation window Section 7.5 defines, is what actually starts trust moving back up.

| Element | Detail |
|---|---|
| Technique Name | Unscripted executive open Q&A |
| Technique Goal | Directly name the specific incident driving the cynicism spike, and state what is changing as a result. |
| Technique Details | Within the two-week escalation window, the Executive Sponsor runs a live, unscripted, org-wide Q&A that explicitly names the triggering incident and the concrete response to it; the session is recorded for staff who could not attend live. |
| Recommended Tool | BigBlueButton / Jitsi (live session) + Nextcloud (recording archive) |

*RACSI for Task E3.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| ES, CM | ES | HRBP | SUP | EU |

### 9.4 Exception E4 — Star Performer Exempted from New Values

**Pattern.** A high-status individual is quietly waived through the accountability process everyone else is held to — the specific incident behind Section 8.1's Q6 dip, where a well-known, high-performing surgeon's disclosure was processed with visibly less scrutiny than an ordinary staff member's would receive. This is often the single most credibility-destroying event in a values program: it proves the say-do gap at a personal, gossiped-about level rather than an abstract policy level, and it is exactly the kind of evidence a cynical staff member needed to conclude the values are aspirational rather than real.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Accountability process outcome records; the flagged incident report | Reported instance of unequal application; 6 months of process outcomes | 1. Equal-Application Review & Public Correction | Equal-application audit finding; corrected process outcome; public standard statement | HR Business Partner; Executive Sponsor; all staff |

*SIPOC for Exception E4.*

**Tasks, Steps, Techniques & RACSI**

**Task E4.1 — [Joint] Equal-Application Review & Public Correction**

**Step 1 — Equal-application audit**

One reported incident could be a genuine one-off or the first visible instance of a pattern; the difference matters enormously to what the correction needs to say.

| Element | Detail |
|---|---|
| Technique Name | Equal-application audit |
| Technique Goal | Verify whether accountability process outcomes correlate with staff seniority or status, not just confirm the single reported incident. |
| Technique Details | Cross-tabulate the last six months of accountability-process outcomes triggered by the new values framework against staff seniority, tenure, and status proxies, to determine whether the flagged incident is isolated or part of a pattern. |
| Recommended Tool | Metabase |

**Step 2 — Corrective re-application and public standard statement**

Quietly fixing the one case without saying anything leaves the rumor uncorrected; the correction has to be at least as visible as the original waiver was, without turning into a public identification of the individual involved.

| Element | Detail |
|---|---|
| Technique Name | Corrective re-application + visible policy statement |
| Technique Goal | Re-apply the accountability process to the flagged incident without exception, and state publicly that the standard applies regardless of seniority. |
| Technique Details | HR Business Partner and Executive Sponsor jointly re-run the waived process to its normal conclusion; the Executive Sponsor states at the next open forum — this can be the same forum as Exception E3 — that the standard applies to every role, without naming the individual involved. |
| Recommended Tool | journi M5 — CM Charters (breach and remediation logged); BigBlueButton |

*RACSI for Task E4.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| HRBP, ES | ES | CM | SUP | EU |

### 9.5 Exception E5 — Merger/Reorg Interrupts the Culture Program

**Pattern.** An external structural event — Cedarbrook announcing the acquisition of an additional clinic network, for example — forces the culture program to either pause or absorb a new, unassessed population mid-program. Unlike a training rollout, which can simply be re-run for new hires, a values program's Neutral Zone and Bridges progress cannot be handed to a newly-merged unit that never went through Phase 1 with everyone else.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| Corporate development / M&A announcement; incoming unit's own culture data (if any) | Merger/reorg announcement; incoming population headcount and site list | 1. Program Continuity Reassessment | Incoming-population re-baseline; minuted Steering Committee continuity decision | Steering Committee; Program Manager; Change Manager |

*SIPOC for Exception E5.*

**Tasks, Steps, Techniques & RACSI**

**Task E5.1 — [PM] Program Continuity Reassessment**

**Step 1 — Rapid re-baseline of the incoming population**

Assuming the new population starts wherever Cedarbrook's original sites currently are is the single most common way a merger quietly resets eighteen months of progress; a fast, direct comparison against the original Q1 baseline prevents that assumption from going unchecked.

| Element | Detail |
|---|---|
| Technique Name | Rapid re-baseline survey |
| Technique Goal | Establish whether the incoming population's baseline culture is close enough to proceed at the current pace, or needs a compressed diagnosis of its own. |
| Technique Details | Administer the Phase 1 safety-climate survey (Section 6.1, Task T1.1) to the incoming population only, on an accelerated two-week timeline, and compare the result directly against Cedarbrook's own Q1 baseline. |
| Recommended Tool | LimeSurvey + Metabase |

**Step 2 — Steering Committee continuity decision**

Left unaddressed, a merger does not pause a culture program cleanly — it lets it drift while everyone assumes someone else is handling it; an explicit, minuted decision is what actually prevents that drift.

| Element | Detail |
|---|---|
| Technique Name | Steering Committee continuity decision |
| Technique Goal | Make an explicit, documented decision to absorb at pace, insert a compressed onboarding track, or formally pause the org-wide timeline. |
| Technique Details | The Steering Committee reviews the re-baseline data against Table 1.1's original timeline and the merger's own integration schedule, and issues one of the three documented decisions before the next Phase Gate. |
| Recommended Tool | journi M9/M11 governance dashboards; LibreOffice Impress for the decision brief |

*RACSI for Task E5.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| PM, CM | ES | HRBP, SUP | ITL | EU |

### 9.6 Exception E6 — Regression After Sponsor Departure or Turnover

**Pattern.** The Executive Sponsor leaves — resignation, promotion, reassignment — before Month 24, and Bridges and Kübler-Ross readings begin drifting backward within weeks. Per the Cross-Type Comparison Matrix, cultural change is journi's most reversibility-fragile archetype: high reversibility risk that is slow, not fast, to fix once it starts — which is exactly why a sponsor gap cannot be left to resolve itself.

**SIPOC**

| Suppliers | Inputs | Process (Tasks) | Outputs | Customers |
|---|---|---|---|---|
| HR executive transition record; Charter Registry (CHTR-01) | Confirmed sponsor departure; diagnosis-to-date program history | 1. Sponsor Succession & Recommitment | Re-signed Sponsorship Charter; visible recommitment event | Incoming Executive Sponsor; Change Manager; all staff |

*SIPOC for Exception E6.*

**Tasks, Steps, Techniques & RACSI**

**Task E6.1 — [ES] Sponsor Succession & Recommitment**

**Step 1 — Accelerated successor onboarding to the Charter Registry**

A gap of even a few weeks with no visible sponsor is long enough for the Bridges position to start sliding backward, so the new sponsor's own commitment has to be captured before the drift compounds, not once things "settle down."

| Element | Detail |
|---|---|
| Technique Name | Accelerated successor charter onboarding |
| Technique Goal | Get the incoming Executive Sponsor to personally re-sign and re-own CHTR-01 within days of the departure being confirmed. |
| Technique Details | Within five business days of a confirmed sponsor departure, walk the incoming executive — interim or permanent — through the full Sponsorship Charter and the program's diagnosis-to-date history, and ask them to name their own specific behavior commitments, exactly as in Section 6.1's Task T1.3. |
| Recommended Tool | journi M5 — CM Charters |

**Step 2 — Visible recommitment event**

A silent leadership transition reads to staff as quiet abandonment; a visible one, referencing the program's actual evidence, reads as continuity.

| Element | Detail |
|---|---|
| Technique Name | Visible recommitment event |
| Technique Goal | Make the leadership transition itself a visible recommitment moment rather than a gap staff notice and interpret as abandonment. |
| Technique Details | The new sponsor holds a short, live all-hands or unit-by-unit session within three weeks of onboarding, explicitly reaffirming the four target values and referencing the program's evidence to date. |
| Recommended Tool | BigBlueButton / Jitsi |

*RACSI for Task E6.1.*

| R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|
| ES, CM | ES | PM, HRBP | SUP | EU |


## 10. Governance & Reporting Cadence

### 10.1 Steering Committee

Formed under Section 6.2's Task T2.2, the Steering Committee — Executive Sponsor, Change Manager, Program Manager, HR Business Partner, and two rotating Unit Leaders — is Project Concord's single governance body from Phase 2 through the Section 6.7 handover. It meets monthly throughout the program, per Section 7.3, with three of its sessions carrying formal Phase Gate authority: the Diagnosis Readout (end of Phase 1), the Pilot Go/No-Go (end of Phase 4), and the Refreeze sign-off (end of Phase 7). Every other monthly session reviews the Section 7.6 dashboard and any open escalations from Section 7.5.

### 10.2 Divergence Review Board

A standing sub-body of the Steering Committee, active from Phase 6 onward (Section 6.6, Task T6.2): Change Manager, one rotating Unit Leader, and HR Business Partner, meeting weekly to keep every open Divergence Pattern alert inside its five-business-day SLA. The Board reports its own trend — alert volume, resolution time, recurrence rate — into every monthly Steering Committee session.

### 10.3 Charter Registry Review Cadence

Seven of journi's eight charters are active for this archetype (Section 4.1). Each carries its own default review frequency; in practice, Project Concord batches the quarterly-cadence charters into the same Steering Committee session as the quarterly CRI and Benchmarking report (Section 6.6, Task T6.2), and reviews any charter with a per-Phase-Gate cadence at that Phase Gate specifically, rather than scheduling a separate charter-only meeting.

### 10.4 Board Reporting

The Board receives the full quarterly report compiled under Task T6.2 — Composite Readiness Index, Bridges/Kübler-Ross readings, and Benchmarking standing, framed against journi's cultural reference band rather than a straight-line target — at the same cadence throughout Phases 2 through 7. Two sessions carry additional weight: the Phase 1 Diagnosis Readout (Task T1.3), which sets the original business case, and the Phase 7 Benefits Realization Report (Task T7.3), which closes the loop against it.

### 10.5 Escalation Chain

Section 7.5's six escalation thresholds each name a specific responder and a specific time window; none of them route through the monthly Steering Committee cycle, because a monthly cadence is too slow for any of the six. The Steering Committee's role in escalations is retrospective, not first-response: it reviews, at its next regular session, how each out-of-cycle escalation in the prior month was resolved, and whether the underlying pattern requires a structural fix beyond the individual incident.

### 10.6 Reporting Ownership Summary

**Table 10.1 — Who owns each recurring governance artifact.**

| Artifact | Cadence | Owner | Reviewed By |
|---|---|---|---|
| Cynicism pulse trend | Monthly | Change Manager | Steering Committee |
| Divergence Pattern alert log | Weekly | Divergence Review Board | Steering Committee (monthly) |
| Manager readiness ratings | Monthly | Change Manager | Steering Committee |
| Composite Readiness Index & Benchmarking report | Quarterly | Change Manager | Steering Committee, Board |
| Charter Registry status | Quarterly / per Phase Gate | Executive Sponsor | Steering Committee |
| Phase Gate decision record | Per Phase Gate | Change Manager, Executive Sponsor | Steering Committee, Board |
| Benefits realization report | End of program (Phase 7) | Program Manager | Steering Committee, Board |
