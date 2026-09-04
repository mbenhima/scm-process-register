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
