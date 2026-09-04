journi

Running a Data Protection Compliance Program

A Focused Guide to journi's Compliance Transformation Archetype

Case: Loi 09-08 Data Protection Compliance Program (Manufacturing — HR, Sales, Customer Service)

Tenant Setup Through Ongoing Compliance Handover — One Program, Followed Week by Week

Version 1.0 · September 2026 · Confidential


## Part 0 — Purpose and How to Use This Guide

### What this guide is

This guide is a single, focused companion to journi's Compliance transformation archetype, following **Loi 09-08 Data Protection Compliance Program** — Bouregreg Group's program to bring its customer and employee data handling into compliance with Morocco's Loi n° 09-08 on the protection of personal data, under the national data protection authority's (CNDP) oversight — from CM Project creation through ongoing compliance handover, week by week. It is the guide in this series where the deadline is not a program choice but an external, fixed one, and where the cost of a Phase Gate closing as anything less than a clean Go is highest precisely because there is no schedule slack to absorb it.

It is organized in six parts: Part 0 (this part), Part 1 (Executive Summary), Part 2 (The Four Frameworks and What Is Specific to Compliance), Part 3 (Tenant and Admin Setup), Part 4 (Week-by-Week Compliance Timeline: Normal Flow and Exceptions, including two Master WBS & Gantt views), and Part 5 (Training Program).

### How to use it

This guide's Bouregreg Group tenant is the same one journi's Master User Guide builds, and the same one this series' other archetype guides extend. A reader with the tenant already set up skips to Part 3, Section 3.2.

### A note on fidelity

Every journi module, field, and role named in this guide is verified against journi's actual source. Loi 09-08 Data Protection Compliance Program is journi's own stated case where **ALT-009 (Phase Gate No-Go / Conditional)** matters most precisely because it does not fire — this guide's every Phase Gate closes Go, on schedule, and states plainly why that matters more here than in any other case in this series, rather than manufacture a false crisis.

### A note on the RACSI codes used throughout

Part 4's RACSI tables use journi's 7-code RACSI role taxonomy (ES/CM/PM/FPO/ITL/SUP/EU), distinct from the 9-role platform RBAC enum Part 3 uses for journi user accounts. **ES** = Executive Sponsor, **CM** = Change Manager, **PM** = Program/Project Manager, **FPO** = Functional Process Owner, **ITL** = IT/Technical Lead, **SUP** = Supervisor, **EU** = End User.

### Reading paths, by role

- **A Change Manager running this program day to day:** Part 2 once, then Part 4 in full.
- **A Program/Project Manager:** Part 4's PM Track column and the Master WBS & Gantt (Sections 4.2–4.3).
- **An Executive Sponsor:** Part 1, then Part 4's phase-opening narratives.
- **A Super Admin or Org Admin:** Part 3.


## Part 1 — Executive Summary

### 1.1 Why This Case Matters: The Deadline Is Not a Choice

Every other program in this series can, in principle, slip a phase gate by a few weeks without an external consequence. This one cannot. The CNDP's own audit schedule is fixed and external — journi's ALT-009 (Phase Gate No-Go / Conditional) is built into this case's design not because it fires, but because the cost of it firing here is categorically different from anywhere else in this series: there is no schedule buffer to absorb a Conditional or No-Go decision without missing a regulatory deadline.

Three facts drive this case's specific shape:

- **The SIPOC is fixed by the case's own type.** Legal/Compliance is the supplier, the regulator is the customer — a cast this guide names concretely, not a generic "stakeholders" placeholder.
- **The deadline pressure shapes every phase's own internal schedule discipline**, more than any resistance pattern or coalition gap does in this specific case.
- **Every Phase Gate in this program's real record closes Go.** This guide states that plainly, the same way the Automation archetype guide in this series states its own clean-close record — and Part 4.4 covers, in the same operational detail as this series' other exception sections, the six realistic ways a Phase Gate here could have closed as Conditional or No-Go, and what the recovery would have required.

### 1.2 The Case, in Brief

Bouregreg Group brings its customer and employee personal-data handling into compliance with Loi 09-08, under CNDP oversight, for any function that touches personal data — HR, Sales, and Customer Service (310 staff). This 64-week program (Weeks 1–64 of Bouregreg Group's own org calendar, run from the very start of the tenant's life given the fixed external deadline) closes every phase gate on schedule, with controls live weeks ahead of the ERP program's own Deploy week so the two programs never compete for the same Legal/Compliance attention.

### 1.3 What This Guide Proves, Concretely

Every claim above is traceable to a real journi record this guide builds: seven consecutive clean Phase Gate decisions, a controls-go-live date sequenced deliberately ahead of a sibling program's own critical week, and a first monitoring cycle confirming the controls hold under real operating conditions, not just at go-live.


## Part 2 — The Four Frameworks and What Is Specific to Compliance

### 2.1 journi's Four Frameworks, in Their Real Stage Vocabulary

| Framework | Altitude | Stages (in journi's own UI, in order) | Logged on |
|---|---|---|---|
| Lewin | Organizational — one reading per project | Unfreeze → Change → Refreeze | M3 (Initiative Registry) |
| Prosci ADKAR | Individual / cohort — five independently-scored blocks | Awareness → Desire → Knowledge → Ability → Reinforcement | M5 (ADKAR Engine) |
| Bridges' Transition Model | Individual / cohort — emotional position | Ending → Neutral Zone → New Beginning | M6 (Emotional & Transition Layer) |
| Kübler-Ross Change Curve | Individual / cohort — sentiment | Denial → Resistance/Anger → Exploration → Commitment | M6 (Emotional & Transition Layer) |

### 2.2 Why the Weighting Is Different for Compliance

- **Awareness and Ability dominate, for a specific reason.** Staff do not need to *want* to comply the way a values or process program needs buy-in — they need to know the rule (Awareness) and be able to follow it correctly (Ability). Desire matters far less here than in any other archetype in this series.
- **The Phase Gate itself is the framework that matters most**, more than Lewin, ADKAR, Bridges, or Kübler-Ross individually — because this program's real risk is schedule risk, not adoption risk.
- **MP-05 (Training & Capability Enablement) is present**, per the E2E-COMP chain (MP-01→02→03→05→07→08→09→10) — Part 5 covers it, focused on specific, checkable compliance behaviors (data handling, retention, access requests), not persuasion.

### 2.3 The Composite Readiness Index and Benchmarking, Read for This Case

This program's Composite Readiness Index reads high and stable throughout — Knowledge and Ability both clear quickly against specific, checkable rules, and there is no real emotional undercurrent for Bridges or Kübler-Ross to track. Benchmarking reads "In Line" or "Ahead" for the program's whole life, and this guide's own honesty standard applies here just as it did for the Automation archetype guide: a clean record is reported as a clean record, not dramatized.


## Part 3 — Tenant and Admin Setup

### 3.1 The Existing Tenant: Bouregreg Group

This program runs inside the same tenant journi's Master User Guide builds, under the existing Bouregreg Manufacturing Maroc Organization. No new Organization is needed — HR, Sales, and Customer Service already sit inside it.

### 3.2 Step 1 — Onboarding the Compliance Team (M2)

| Name | journi Role (RBAC) | Scope type | Scope | RACSI Code | Notes |
|---|---|---|---|---|---|
| Karim Idrissi | Sponsor | Project | Loi 09-08 Data Protection Compliance Program *(created in Step 2)* | ES | General Counsel / Chief Compliance Officer |
| Sanaa Bouzoubaa | Change Manager | Project | Loi 09-08 Data Protection Compliance Program | CM | Owns day-to-day program execution |
| Hamza Alaoui | Practitioner / Contributor | Project | Loi 09-08 Data Protection Compliance Program | PM | Compliance program lead |
| Nadia Squalli | People Manager | Project | Loi 09-08 Data Protection Compliance Program | FPO | HR Data Privacy Lead |
| Reda Fassi | Practitioner / Contributor | Project | Loi 09-08 Data Protection Compliance Program | ITL | Data systems and access-control lead |
| Amine Tazi | People Manager | Project | Loi 09-08 Data Protection Compliance Program | SUP | Sales Operations Manager |

### 3.3 Step 2 — Creating the CM Project (M1)

1. On the Bouregreg Manufacturing Maroc Organization card, click **+ CM Project**. Fill in:
   - Name: "Loi 09-08 Data Protection Compliance Program"
   - Linked Main Project: **none**
   - Owner: "Sanaa Bouzoubaa"
   - Change type: **Compliance**
   - Target population: "Any function touching personal data — HR, Sales, Customer Service (310)"
   - Business driver: "A scheduled CNDP audit against Morocco's Loi n° 09-08 carries a fixed external deadline, not a discretionary program timeline."
2. Save. Lewin opens at **Unfreeze**, justification: "Opening Unfreeze at program start, Week 1, run from the very start of the tenant's life given the fixed external deadline."
3. On **Module 17 — WBS & Gantt**, load the **TPL-COMP-7** phase template (Regulatory Requirement & Gap Analysis → Control Design → Control Implementation → Internal Audit/Independent Testing → Controls Go Live → First Monitoring Cycle → Ongoing Compliance Handover).

### 3.4 Step 3 — Governance (M2)

Permission Matrix and the Governance Setting stay unchanged tenant-wide.

### 3.5 Step 4 — Charters for This Program (M19)

| Charter | Accountable (this program) | Review cadence |
|---|---|---|
| CHTR-01 Sponsorship / Leadership Charter | Karim Idrissi (ES) | Per Phase Gate |
| CHTR-03 Communication Charter | Sanaa Bouzoubaa (CM) | Per communication wave |
| CHTR-04 Organizational Impact Charter | Sanaa Bouzoubaa (CM) | On scope change |
| CHTR-08 Pulse / Interview Charter | Sanaa Bouzoubaa (CM) | Per phase gate + ad hoc |

### 3.6 Setup Checklist

- [ ] Base tenant confirmed (Bouregreg Group, Bouregreg Manufacturing Maroc Organization)
- [ ] Compliance team accounts created — Section 3.2
- [ ] CM Project created, Lewin opened at Unfreeze — Section 3.3
- [ ] TPL-COMP-7 phase template loaded on M17 — Section 3.3
- [ ] Four applicable Charters reviewed and accountable owners confirmed — Section 3.5

With this checklist complete, Part 4 runs the program forward, week by week.


## Part 4 — Week-by-Week Compliance Timeline: Normal Flow and Exceptions

Part 3 ended with Loi 09-08 Data Protection Compliance Program registered and its Lewin phase opened at Unfreeze, program Week 1 — the same week as Bouregreg Group's own org calendar, run from the very start of the tenant's life given the fixed external deadline. Every one of the program's 64 individual weeks is listed on its own row, so a reader can see exactly which week a framework reading, a phase transition, or an exception is active in.

### 4.1 Normal Flow, Phase by Phase

#### Phase 1 — Regulatory Requirement & Gap Analysis (Weeks 1–14)

Establishes exactly what Loi 09-08 requires and where Bouregreg Group's current data-handling practice falls short, across HR, Sales, and Customer Service.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 1** | Hamza Alaoui holds program kickoff; confirms Karim Idrissi's sponsorship and the fixed CNDP audit deadline. | Sanaa Bouzoubaa briefs the team; confirms the regulatory scope against Loi 09-08's actual text. | M1 (Hierarchy) — verify the CM Project record matches the kickoff agreement. | — | — |
| **Week 2** | Confirm the CNDP audit's fixed date and work backward to set every phase gate's own hard deadline. | — | M17 (WBS & Gantt) — baseline schedule loaded from TPL-COMP-7, every phase gate dated against the fixed audit deadline. | — | — |
| **Week 3** | Begin the regulatory requirement mapping against Loi 09-08's specific articles. | Baseline ADKAR pulse for HR, Sales, and Customer Service staff. | M5 (ADKAR Engine) — Awareness 3, Ability 2. | — | — |
| **Week 4** | Continue regulatory mapping. | — | M21 — routine log. | — | — |
| **Week 5** | Begin the current-state gap analysis: where existing data-handling practice falls short of Loi 09-08. | Map stakeholder cohorts across the three functions. | M4 (Stakeholder Mapping) — "HR," "Sales," "Customer Service" cohorts logged. | — | — |
| **Week 6** | Continue gap analysis. | — | M21 — routine log. | — | — |
| **Week 7** | Continue gap analysis; catalogue specific data-handling practices requiring change. | — | M21 — routine log. | — | — |
| **Week 8** | Continue gap analysis. | — | M21 — routine log. | — | — |
| **Week 9** | Consolidate gap analysis findings by function. | — | M21 (Field Notes) — Category: Decision · Title: "Gap Analysis Consolidated by Function." | — | — |
| **Week 10** | Draft the gap analysis report for Legal review. | — | M21 — routine log. | (Phase 2 also begins this week) | — |
| **Week 11** | Review the draft report with Karim Idrissi and Legal. | — | M21 — routine log. | — | — |
| **Week 12** | Finalize the gap analysis report. | — | M21 — routine log. | — | — |
| **Week 13** | Present the gap analysis to the Steering Committee ahead of sign-off. | — | M21 — routine log. | — | — |
| **Week 14** | Confirm the Phase 1 gate: gap analysis signed off, on schedule against the fixed deadline. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Schedule variance vs. fixed deadline (0) |

*Phase gate: Regulatory Requirement & Gap Analysis closes once the gap analysis is signed off exactly against its dated milestone — no schedule slippage, since none is available.*

#### Phase 2 — Control Design (Weeks 12–28)

Designs the specific controls — data retention rules, access restrictions, consent and subject-access-request processes — that close the gaps Phase 1 found.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 12** | Begin control design against the gap analysis findings. | — | M21 — routine log. | — | — |
| **Week 13** | Continue control design. | — | M21 — routine log. | — | — |
| **Week 14** | Continue control design. | — | M21 — routine log. | (Phase 1 gate also closes this week) | — |
| **Week 15** | Design data-retention controls for HR personnel records. | — | M21 — routine log. | — | — |
| **Week 16** | Design data-retention controls for Sales and Customer Service records. | — | M21 — routine log. | — | — |
| **Week 17** | Design access-restriction controls across all three functions. | — | M21 — routine log. | — | — |
| **Week 18** | Continue access-control design; confirm technical feasibility with Reda Fassi. | — | M21 — routine log. | — | — |
| **Week 19** | Design the subject-access-request process — how an individual requests their own data. | — | M21 — routine log. | — | — |
| **Week 20** | Continue subject-access-request process design. | Re-score ADKAR — Knowledge building as control designs circulate for review. | M5 (ADKAR Engine) — Knowledge 3. | — | — |
| **Week 21** | Design the consent-management process for new data collection. | — | M21 — routine log. | — | — |
| **Week 22** | Continue consent-management design. | — | M21 — routine log. | — | — |
| **Week 23** | Consolidate all designed controls into a single control catalogue. | — | M21 — routine log. | — | — |
| **Week 24** | Review the control catalogue with Legal for regulatory sufficiency. | — | M21 — routine log. | (Phase 3 also begins this week) | — |
| **Week 25** | Incorporate Legal's review feedback. | — | M21 — routine log. | — | — |
| **Week 26** | Finalize the control catalogue. | — | M21 — routine log. | — | — |
| **Week 27** | Present the control catalogue to the Steering Committee. | — | M21 — routine log. | — | — |
| **Week 28** | Confirm the Phase 2 gate: control catalogue signed off, on schedule. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Schedule variance vs. fixed deadline (0) |

*Phase gate: Control Design closes once every control in the catalogue is specific enough to implement directly — no design ambiguity carried into Phase 3.*

#### Phase 3 — Control Implementation (Weeks 26–40)

Builds and configures the designed controls across HR, Sales, and Customer Service systems and processes.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 26** | Begin implementing data-retention controls in HR systems. | — | M21 — routine log. | — | — |
| **Week 27** | Continue HR retention-control implementation. | — | M21 — routine log. | — | — |
| **Week 28** | Continue HR retention-control implementation. | — | M21 — routine log. | (Phase 2 gate also closes this week) | — |
| **Week 29** | Begin implementing retention controls in Sales and Customer Service systems. | — | M21 — routine log. | — | — |
| **Week 30** | Continue Sales/CS retention-control implementation. | — | M21 — routine log. | — | — |
| **Week 31** | Implement access-restriction controls across all three functions. | — | M21 — routine log. | — | — |
| **Week 32** | Continue access-restriction implementation. | — | M21 — routine log. | — | — |
| **Week 33** | Implement the subject-access-request process end to end. | — | M21 — routine log. | — | — |
| **Week 34** | Test the subject-access-request process with a simulated request. | — | M21 (Field Notes) — Category: Other · Title: "Subject-Access-Request Process Tested." | — | — |
| **Week 35** | Implement the consent-management process. | — | M21 — routine log. | — | — |
| **Week 36** | Continue consent-management implementation. | — | M21 — routine log. | (Phase 4 also begins this week) | — |
| **Week 37** | Confirm all designed controls are implemented across all three functions. | — | M21 — routine log. | — | — |
| **Week 38** | Run an internal readiness check across all controls. | — | M21 — routine log. | — | — |
| **Week 39** | Address any readiness-check findings. | — | M21 — routine log. | — | — |
| **Week 40** | Confirm the Phase 3 gate: implementation complete, on schedule. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Schedule variance vs. fixed deadline (0) |

*Phase gate: Control Implementation closes once every control in the catalogue is live in the actual systems and processes, not just designed.*

#### Phase 4 — Internal Audit / Independent Testing (Weeks 38–48)

An internal, independent test of every implemented control before the real CNDP audit — independent specifically meaning run by staff not involved in implementation.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 38** | Confirm the independent testing team, drawn from outside the implementation team. | — | M21 — routine log. | (Phase 3 active) | — |
| **Week 39** | Finalize the independent test plan against every control in the catalogue. | — | M21 — routine log. | — | — |
| **Week 40** | Begin independent testing of HR controls. | — | M21 — routine log. | (Phase 3 gate also closes this week) | — |
| **Week 41** | Continue HR control testing. | — | M21 — routine log. | — | — |
| **Week 42** | Test Sales and Customer Service controls. | — | M21 — routine log. | — | — |
| **Week 43** | Continue Sales/CS control testing. | — | M21 — routine log. | — | — |
| **Week 44** | Test the subject-access-request and consent-management processes end to end. | — | M21 (Field Notes) — Category: Other · Title: "Process Controls Independently Tested." | — | — |
| **Week 45** | Consolidate independent testing findings. | — | M21 — routine log. | — | — |
| **Week 46** | Close any testing findings with corrective actions. | — | M10 (Resistance) — n/a; findings tracked as corrective actions. | — | — |
| **Week 47** | Confirm all findings closed ahead of Controls Go Live. | — | M21 — routine log. | — | — |
| **Week 48** | Confirm the Phase 4 gate: independent testing complete, all findings closed, on schedule. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Schedule variance vs. fixed deadline (0) |

*Phase gate: Internal Audit / Independent Testing closes once every control has been tested by staff independent of its own implementation, and every finding closed.*

#### Phase 5 — Controls Go Live (Weeks 46–52)

Controls go live for real — sequenced deliberately relative to the ERP program's own critical weeks so the two programs never compete for the same Legal/Compliance attention.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 46** | Confirm go-live readiness against the closed testing findings. | — | M21 — routine log. | (Phase 4 active) | — |
| **Week 47** | Finalize go-live communications to all three functions. | — | M8 (Communications) — go-live briefing drafted. | (Phase 4 gate also closes this week) | — |
| **Week 48** | Controls go live across HR, Sales, and Customer Service. | Set Lewin to **Change**. | M3 (Initiative Registry) — Lewin: "Change." Justification: "Controls live, Week 48, sequenced against the ERP program's own critical weeks to avoid competing for Legal/Compliance attention." | — | — |
| **Week 49** | Monitor go-live for immediate issues. | — | M21 — routine log. | — | — |
| **Week 50** | Continue monitoring. | — | M21 — routine log. | — | — |
| **Week 51** | Confirm no unresolved go-live issues remain. | — | M21 — routine log. | — | — |
| **Week 52** | Confirm the Phase 5 gate: controls live and stable, on schedule. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Schedule variance vs. fixed deadline (0) |

*Phase gate: Controls Go Live closes once every control is confirmed live and stable across all three functions.*

#### Phase 6 — First Monitoring Cycle (Weeks 50–58)

Confirms the controls hold under real operating conditions, not just at the moment of go-live — the evidence base for the CNDP audit itself.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 50** | Begin the first monitoring cycle alongside the final go-live weeks. | — | M21 — routine log. | (Phase 5 active) | — |
| **Week 51** | Continue monitoring. | — | M21 — routine log. | (Phase 5 active) | — |
| **Week 52** | Log the first formal monitoring checkpoint. | — | M12 (Sustainment) — checkpoint 1 logged, no control failures. | (Phase 5 gate also closes this week) | — |
| **Week 53** | Continue monitoring across all three functions. | — | M21 — routine log. | — | — |
| **Week 54** | Continue monitoring. | — | M21 — routine log. | — | — |
| **Week 55** | Spot-check the subject-access-request process against a real request. | — | M21 — routine log. | — | — |
| **Week 56** | Continue monitoring. | — | M21 — routine log. | — | — |
| **Week 57** | Compile the first monitoring cycle's results ahead of the CNDP audit. | — | M21 — routine log. | — | — |
| **Week 58** | Confirm the Phase 6 gate: first monitoring cycle complete, controls confirmed holding. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Control failure count (0) |

*Phase gate: First Monitoring Cycle closes once a full cycle confirms the controls hold under real conditions — the direct evidentiary basis for the CNDP audit.*

#### Phase 7 — Ongoing Compliance Handover (Weeks 56–64, open-ended beyond)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 56** | Begin drafting the ongoing compliance handover package alongside the final monitoring weeks. | — | M21 — routine log. | (Phase 6 active) | — |
| **Week 57** | Continue drafting the handover package. | — | M21 — routine log. | (Phase 6 active) | — |
| **Week 58** | Finalize named ongoing owners per function for standing compliance monitoring. | — | M21 — routine log. | (Phase 6 gate also closes this week) | — |
| **Week 59** | Confirm the standing monitoring cadence for the handover. | — | M21 — routine log. | — | — |
| **Week 60** | Present the handover package to the Steering Committee. | — | M21 — routine log. | — | — |
| **Week 61** | Incorporate Steering Committee feedback into the handover package. | — | M21 — routine log. | — | — |
| **Week 62** | Confirm the CNDP audit is scheduled and the program's evidentiary record is complete. | — | M21 (Field Notes) — Category: Decision · Title: "CNDP Audit Readiness Confirmed." | — | — |
| **Week 63** | Finalize governance transfer to standing function owners. | — | M21 — routine log. | — | — |
| **Week 64** | Confirm program close. | Set Lewin to **Refreeze**; toggle the sustainment sign-off. | M3 (Initiative Registry) — Lewin: "Refreeze." M12 (Sustainment) — sign-off toggle: **set**. | — | Sustainment sign-off (toggled) |

*Phase gate: Ongoing Compliance Handover — and the program itself — closes once governance transfers to standing function owners. Total program length: 64 weeks, seven consecutive clean Phase Gate decisions, no ALT-009 firing. Standing compliance monitoring continues beyond Week 64, consistent with a regulatory obligation that does not have a project end date.*

### 4.2 Master WBS & Gantt — Every Task and Step, PM and CM Tracks, Across the Four Frameworks

| ID | Task / Step Name | Track | Week(s) | Lewin | ADKAR | Bridges | Kübler-Ross |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Regulatory requirement mapping | PM | 1–4 | Unfreeze | Awareness | Neutral Zone | Exploration |
| T1.1-S2 | Gap analysis and Phase 1 sign-off | Joint | 5–14 | Unfreeze | Awareness | Neutral Zone | Exploration |
| T2.1-S1 | Controls designed | PM | 12–23 | Unfreeze | Awareness → Knowledge | Neutral Zone | Exploration |
| T2.1-S2 | Control catalogue sign-off | PM | 24–28 | Unfreeze | Knowledge | Neutral Zone | Exploration |
| T3.1-S1 | Controls implemented | PM | 26–37 | Unfreeze | Knowledge → Ability | Neutral Zone | Exploration |
| T3.1-S2 | Internal readiness check | CM | 38–40 | Unfreeze | Ability | Neutral Zone | Exploration |
| T4.1-S1 | Independent testing conducted | CM | 40–45 | Unfreeze | Ability | Neutral Zone | Exploration |
| T4.1-S2 | Testing findings closed | CM | 46–48 | Unfreeze | Ability | Neutral Zone | Exploration |
| T5.1-S1 | Controls go live | CM | 46–48 | Change | Ability | Neutral Zone | Exploration |
| T5.1-S2 | Go-live stability confirmed | PM | 49–52 | Change | Ability → Reinforcement | Neutral Zone | Exploration |
| T6.1-S1 | First monitoring cycle conducted | CM | 50–56 | Change | Reinforcement | Neutral Zone → New Beginning | Exploration → Commitment |
| T6.1-S2 | Monitoring cycle closed clean | CM | 57–58 | Change | Reinforcement | New Beginning | Commitment |
| T7.1-S1 | Ongoing handover package | PM | 56–62 | Change | Reinforcement | New Beginning | Commitment |
| T7.1-S2 | Refreeze confirmed; program closes | Joint | 63–64 | **Refreeze** | Reinforcement | New Beginning | Commitment |

*Table 4.2.1 — Master WBS & Gantt, framework view. All 14 Task/Step rows across the full 64-week program.*

### 4.3 Master WBS & Gantt — Every Task and Step, Techniques and Tools

| ID | Task / Step Name | Track | Week(s) | Technique Name | Technique Goal | Technique Details | Recommended Tool |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Regulatory requirement mapping | PM | 1–4 | Statutory clause mapping | Establish exactly what Loi 09-08 requires before assessing current practice against it. | Map every relevant Loi 09-08 article to a specific business process it governs. | LibreOffice Calc |
| T1.1-S2 | Gap analysis and sign-off | Joint | 5–14 | Cross-functional gap analysis | Quantify exactly where current practice falls short, by function. | Assess HR, Sales, and CS data-handling practice against every mapped requirement; consolidate into one report for Legal review. | Taguette |
| T2.1-S1 | Controls designed | PM | 12–23 | Control catalogue design | Design specific, implementable controls closing every gap found. | Retention, access-restriction, subject-access-request, and consent-management controls, each specific enough to implement directly. | BookStack |
| T2.1-S2 | Control catalogue sign-off | PM | 24–28 | Legal sufficiency review | Confirm every designed control actually satisfies the regulatory requirement it targets. | Legal review of the full control catalogue before implementation begins. | journi M17 — WBS & Gantt |
| T3.1-S1 | Controls implemented | PM | 26–37 | Phased control implementation | Build and configure controls in the real systems and processes, function by function. | HR first, then Sales/CS, then process controls (subject-access-request, consent). | journi M17 — WBS & Gantt |
| T3.1-S2 | Internal readiness check | CM | 38–40 | Pre-audit readiness review | Confirm implementation completeness before independent testing begins. | Internal check across all controls against the signed-off catalogue. | LibreOffice Calc |
| T4.1-S1 | Independent testing conducted | CM | 40–45 | Independent control testing | Test every control with staff not involved in its own implementation. | Structured test plan against the full control catalogue, run by an independent team. | journi M21 — Field Notes |
| T4.1-S2 | Testing findings closed | CM | 46–48 | Corrective action tracking | Close every testing finding before Controls Go Live, not after. | Track each finding to closure with an owner and a date. | LibreOffice Calc |
| T5.1-S1 | Controls go live | CM | 46–48 | Sequenced go-live | Launch controls at a date deliberately sequenced against the ERP program's own critical weeks. | Controls go live for all three functions on one confirmed date. | journi M8 — Communications |
| T5.1-S2 | Go-live stability confirmed | PM | 49–52 | Post-go-live stability monitoring | Confirm no immediate control failures before declaring the phase closed. | Monitor for issues in the first weeks after go-live. | journi M21 — Field Notes |
| T6.1-S1 | First monitoring cycle conducted | CM | 50–56 | Standing monitoring cycle | Confirm controls hold under real operating conditions, not just at go-live. | Monthly-equivalent monitoring across all three functions, including a real subject-access-request spot-check. | journi M12 — Sustainment |
| T6.1-S2 | Monitoring cycle closed clean | CM | 57–58 | Cycle closure and evidence compilation | Compile the monitoring cycle's results as direct evidence for the CNDP audit. | Consolidate all monitoring findings into the audit evidence package. | journi M12 — Sustainment |
| T7.1-S1 | Ongoing handover package | PM | 56–62 | Standing ownership handover | Transfer ongoing compliance monitoring to named function owners before the program team stands down. | Package names owners per function and a standing monitoring cadence. | BookStack |
| T7.1-S2 | Refreeze confirmed; program closes | Joint | 63–64 | Confirmed Refreeze | Formally close the program while standing compliance monitoring continues indefinitely. | Set Lewin to Refreeze; toggle sustainment sign-off. | journi M3 / M12 |

*Table 4.3.1 — Master WBS & Gantt, technique view. Same 14 rows as Table 4.2.1, with the operational detail behind each step.*

### 4.4 Six Contingency Patterns, in Detail

None of the six patterns below actually occurred in Loi 09-08 Data Protection Compliance Program's own record — Section 4.1 and journi's own scenario library are explicit that every Phase Gate in this program closed Go, on schedule, with ALT-009 never firing. What follows is a contingency playbook: six realistic ways a Phase Gate here could have closed as Conditional or No-Go, written in the same operational detail as this series' other exception sections — and, because this program's deadline is externally fixed, each carries a schedule-impact statement more consequential than in any other guide in this series, since there is no buffer to absorb it.

#### C1 — A Regulatory Clause Misread During Gap Analysis (would map to Phase 1, Weeks 5–14)

**Detailed description.** The gap analysis initially reads a Loi 09-08 retention-period clause more leniently than the CNDP's own published guidance actually requires, a misreading that would only surface when Legal's own independent review catches it late in Phase 1.

**Trigger.** A Legal review during Phase 1 sign-off (Week 13) finding a regulatory interpretation gap in the draft report.

**Timeline impact.** With no schedule buffer, this would force compressing Phase 2's own start by the exact number of days needed to correct the interpretation and re-run the affected part of the gap analysis — the single most damaging possible timing for a finding like this in the whole program.

**Recovery tasks.** Correct the interpretation directly against CNDP's own published guidance, not an internal assumption; re-run only the specifically affected part of the gap analysis; compress, rather than skip, the Phase 1 sign-off review to absorb the correction within the existing Week 14 gate date.

**Outputs.** A corrected regulatory interpretation; a gap analysis re-validated against CNDP's actual guidance; the Week 14 gate held without slippage.

**RACSI.** R = CM, ES · A = ES · C = FPO · S = PM · I = ITL, SUP, EU

#### C2 — Control Design Insufficient for a Specific Data Type (would map to Phase 2, Weeks 15–23)

**Detailed description.** The general control catalogue, designed for standard HR and customer data, turns out insufficient for a narrower category — health-related data HR holds for occupational-medicine purposes — which Loi 09-08 treats with stricter requirements the general catalogue didn't anticipate.

**Trigger.** A control-design review finding one data category requires materially stricter controls than the catalogue's general design.

**Timeline impact.** Would require a targeted, parallel design sprint for the narrower data category rather than redesigning the whole catalogue, ideally absorbed within Phase 2's existing window rather than delaying Phase 2's own gate.

**Recovery tasks.** Identify every data category the general catalogue doesn't adequately cover, not just the one found; design category-specific controls in parallel with the general catalogue's own remaining design work; confirm with Legal that the stricter controls actually satisfy the specific requirement.

**Outputs.** Category-specific controls added to the catalogue; a documented category-by-category sufficiency check for future compliance programs to reuse.

**RACSI.** R = FPO, ITL · A = CM · C = ES · S = PM · I = SUP, EU

#### C3 — A Third-Party Data Processor Missed From Scope (would map to Phase 1–2, Weeks 5–20)

**Detailed description.** A payroll vendor processing HR personal data on Bouregreg's behalf is missed from the original scope, discovered only when the control catalogue's access-restriction design realizes it has no way to actually govern a third party's own systems.

**Trigger.** A control-design gap specifically pointing to a data flow the program's scope never named.

**Timeline impact.** Would require an out-of-cycle vendor-contract review (adding data-processing terms if the existing contract lacks them) that could realistically run past this program's own Phase 4 gate, given third-party legal negotiation timelines are outside the program's direct control.

**Recovery tasks.** Confirm every third party touching personal data as part of Phase 1's own scope-setting, not discovered downstream; if a vendor is missed, prioritize the contractual fix immediately given its longer lead time; consider a documented, time-bound risk acceptance for the CNDP audit if the vendor fix genuinely cannot complete before the fixed deadline, rather than let it silently block the whole program.

**Outputs.** A complete third-party processor inventory; either a completed contract amendment or a documented, time-bound risk acceptance.

**RACSI.** R = ES, ITL · A = ES · C = CM · S = PM · I = FPO, SUP, EU

#### C4 — The Independent Testing Team Isn't Genuinely Independent (would map to Phase 4, Weeks 40–45)

**Detailed description.** A staff member assigned to the "independent" testing team turns out to have also done configuration work on one of the controls being tested — a genuine independence failure that would undermine the audit-readiness value of the whole testing exercise if it went unnoticed.

**Trigger.** A pre-testing conflict-of-interest check (or its absence) revealing overlap between the testing team and the implementation team.

**Timeline impact.** Would require reassigning the affected control's testing to a genuinely independent reviewer and re-running just that control's test — a targeted delay, not a full Phase 4 restart, if caught early in the phase.

**Recovery tasks.** Run an explicit conflict-of-interest check before testing begins, not assume independence by role title alone; reassign and re-test only the specifically affected control; document the independence check itself as part of the audit evidence package, since CNDP auditors may ask how independence was actually verified.

**Outputs.** A documented independence-verification process; a re-tested control with confirmed independent review.

**RACSI.** R = CM · A = CM · C = ES · S = PM · I = FPO, ITL, SUP, EU

#### C5 — A Data Incident During Implementation, Before Controls Are Live (would map to Phase 3, Weeks 26–37)

**Detailed description.** A data-handling incident (not necessarily a full breach — a misdirected email containing personal data, for example) occurs while implementation is still in progress and the new controls aren't live yet, forcing an unplanned test of whether the program's own incident-response process works before it was scheduled to be tested.

**Trigger.** A reportable data-handling incident during the Implementation phase, before Controls Go Live.

**Timeline impact.** Would not delay the program's own schedule directly, but would force an immediate, out-of-cycle incident response running in parallel with ongoing implementation work — a real capacity strain on the same team.

**Recovery tasks.** Run the incident response using whatever process exists at that point, even if not the final designed one, rather than wait for Phase 3 to formally complete; document the incident and response as direct evidence the organization takes data protection seriously even before formal go-live; accelerate implementation of whichever specific control would have prevented this particular incident.

**Outputs.** A documented incident response; an accelerated fix for the specific control gap the incident exposed; a real (not hypothetical) incident-response case for the audit evidence package.

**RACSI.** R = ITL, FPO · A = ES · C = CM · S = PM · I = SUP, EU

#### C6 — CNDP Shifts the Audit Date or Scope Mid-Program (would map to any phase, Weeks 1–64)

**Detailed description.** The CNDP itself moves the audit date earlier, or expands its stated scope, partway through the program — an external schedule shock this program's own design has no control over, testing whether the program's schedule discipline (Section 2.2) can actually absorb a change to the one constraint it was built entirely around.

**Trigger.** A formal notice from CNDP changing the audit date or scope.

**Timeline impact.** Depends entirely on the direction and size of the change; an earlier date would force compressing every remaining phase proportionally, the single hardest scenario in this whole contingency list, since there is no reserve schedule to draw on.

**Recovery tasks.** Immediately re-baseline the WBS against the new date, identifying which phases can compress without losing real content versus which cannot; escalate to the Sponsor and Steering Committee for an explicit decision on which lower-priority controls, if any, get deferred past the new audit date with a documented risk acceptance, rather than silently under-deliver across everything equally.

**Outputs.** A re-baselined schedule; an explicit, documented prioritization decision if full scope cannot be met by the new date.

**RACSI.** R = PM, CM · A = ES · C = FPO, ITL · S = SUP · I = EU
