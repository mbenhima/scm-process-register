journi

Running a Quality Management System Certification Program

A Focused Guide to journi's QMS Transformation Archetype

Case: ISO 9001/14001 Integrated Management System (Manufacturing — Settat Plant)

Tenant Setup Through Ongoing Surveillance — One Program, Followed Week by Week

Version 1.0 · September 2026 · Confidential


## Part 0 — Purpose and How to Use This Guide

### What this guide is

This guide is a single, focused companion to journi's Quality Management System (QMS) archetype, following **ISO 9001/14001 Integrated Management System** — Settat plant's pursuit of integrated quality and environmental certification on one management system — from CM Project creation through the surveillance cycle that, by design, never formally closes. It is the guide in this series where the Sponsor is genuine but structurally isolated: a Quality Manager sponsoring alone, without the broader guiding coalition journi's own ALT-010 alert is built to catch.

It is organized in six parts: Part 0 (this part), Part 1 (Executive Summary), Part 2 (The Four Frameworks and What Is Specific to QMS), Part 3 (Tenant and Admin Setup), Part 4 (Week-by-Week QMS Timeline: Normal Flow and Exceptions, including two Master WBS & Gantt views), and Part 5 (Training Program).

### How to use it

This guide's Bouregreg Group tenant is the same one journi's Master User Guide builds, and the same one this series' other archetype guides extend. A reader with the tenant already set up skips to Part 3, Section 3.2.

### A note on fidelity

Every journi module, field, and role named in this guide is verified against journi's actual source. ISO 9001/14001 Integrated Management System is journi's own stated case for **ALT-010 (Guiding Coalition Gap)** — this guide builds toward that alert firing exactly once the Sponsor & Coalition record shows fewer than two named coalition members, per journi's own threshold, not before.

### A note on the RACSI codes used throughout

Part 4's RACSI tables use journi's 7-code RACSI role taxonomy (ES/CM/PM/FPO/ITL/SUP/EU), distinct from the 9-role platform RBAC enum Part 3 uses for journi user accounts. **ES** = Executive Sponsor, **CM** = Change Manager, **PM** = Program/Project Manager, **FPO** = Functional Process Owner, **ITL** = IT/Technical Lead, **SUP** = Supervisor, **EU** = End User.

### Reading paths, by role

- **A Change Manager running this program day to day:** Part 2 once, then Part 4 in full.
- **A Program/Project Manager:** Part 4's PM Track column and the Master WBS & Gantt (Sections 4.2–4.3).
- **An Executive Sponsor:** Part 1, then Part 4's phase-opening narratives.
- **A Super Admin or Org Admin:** Part 3.


## Part 1 — Executive Summary

### 1.1 Why This Case Matters: A Genuine Sponsor, Structurally Alone

The Quality Manager sponsoring this program is not disengaged — unlike the Cultural archetype guide's Sponsor Coverage Gap, this is not a visibility problem. It is a coalition problem: certification touches plant operations, procurement, HR, and site leadership, but the Sponsor started this program without named allies in any of those functions. journi's ALT-010 exists for exactly this distinction — a Sponsor can be genuinely active and still structurally under-resourced for a program this cross-functional.

Three facts drive this case's specific shape:

- **The deadline is externally real, but not fixed to a single date.** A customer contract requires certification, and a parallel environmental certification is bundled for efficiency — two audits, not one, sharing most of the same evidence base.
- **The Sponsor's authority is real but narrow.** A Quality Manager can mandate documentation changes within quality's own function; certification requires operations, procurement, and HR to change their own practices too, which the Quality Manager alone cannot compel.
- **Surveillance never formally closes.** Unlike every other archetype in this series, this program's final phase — Ongoing Surveillance — has no defined end date, because certification maintenance is a standing condition, not a project outcome.

### 1.2 The Case, in Brief

Settat plant pursues integrated ISO 9001 (quality) and ISO 14001 (environmental) certification on one management system rather than two separate ones. This program (Weeks 1–52+ of Bouregreg Group's own org calendar, run alongside the ERP program's own kickoff) covers Settat's 410-person plant operations and quality function, crossing journi's Guiding Coalition Gap threshold early — and closing it — before the certifying audit.

### 1.3 What This Guide Proves, Concretely

Every claim above is traceable to a real journi record this guide builds: a Sponsor & Coalition record showing fewer than two named members through Implementation, a documented coalition-building response, and a certifying audit passed with a genuinely cross-functional coalition behind it, not the Quality Manager alone.


## Part 2 — The Four Frameworks and What Is Specific to QMS

### 2.1 journi's Four Frameworks, in Their Real Stage Vocabulary

| Framework | Altitude | Stages (in journi's own UI, in order) | Logged on |
|---|---|---|---|
| Lewin | Organizational — one reading per project | Unfreeze → Change → Refreeze | M3 (Initiative Registry) |
| Prosci ADKAR | Individual / cohort — five independently-scored blocks | Awareness → Desire → Knowledge → Ability → Reinforcement | M5 (ADKAR Engine) |
| Bridges' Transition Model | Individual / cohort — emotional position | Ending → Neutral Zone → New Beginning | M6 (Emotional & Transition Layer) |
| Kübler-Ross Change Curve | Individual / cohort — sentiment | Denial → Resistance/Anger → Exploration → Commitment | M6 (Emotional & Transition Layer) |

### 2.2 Why the Weighting Is Different for QMS

- **Knowledge and Ability dominate, and stay dominant through Surveillance.** Certification is fundamentally about staff correctly following documented procedures — a competence question more than a belief question, closer to Automation's profile than BPR's or Cultural's.
- **The Sponsor & Coalition record (M7) is this case's single most important module**, more than in any other archetype guide in this series — because the whole case turns on the difference between a Sponsor being active and a Sponsor having a coalition.
- **Lewin's Refreeze reading is genuinely provisional even after certification.** A passed certifying audit is a real milestone, but "Refreeze" for a QMS program means the system holding through its first full surveillance cycle, not the audit pass itself — this guide states that distinction directly rather than call the audit pass Refreeze.

### 2.3 The Composite Readiness Index and Benchmarking, Read for This Case

This program's Composite Readiness Index shows steady, unremarkable growth through Design and early Implementation, then a visible plateau once the coalition gap is logged — Benchmarking correspondingly reads "Behind" for several weeks until the coalition-building response takes hold, a slower recovery than the Automation or BPR cases in this series, consistent with a structural gap taking longer to close than an individual resistance case.


## Part 3 — Tenant and Admin Setup

### 3.1 The Existing Tenant: Bouregreg Group

This program runs inside the same tenant journi's Master User Guide builds, under the existing Bouregreg Manufacturing Maroc Organization. No new Organization is needed — Settat plant already sits inside it.

### 3.2 Step 1 — Onboarding the Certification Team (M2)

| Name | journi Role (RBAC) | Scope type | Scope | RACSI Code | Notes |
|---|---|---|---|---|---|
| Nadia Fassi | Sponsor | Project | ISO 9001/14001 Integrated Management System *(created in Step 2)* | ES | Quality Manager; sponsors alone at program start, without a named coalition |
| Rania Bensouda | Change Manager | Project | ISO 9001/14001 Integrated Management System | CM | Owns day-to-day program execution |
| Samir Chraibi | Practitioner / Contributor | Project | ISO 9001/14001 Integrated Management System | PM | Certification program lead |
| Mehdi Ouahbi | People Manager | Project | ISO 9001/14001 Integrated Management System | FPO | Settat Plant Quality Lead |
| Yasmine Kadiri | Practitioner / Contributor | Project | ISO 9001/14001 Integrated Management System | ITL | QMS documentation systems |
| Aziz Berrada | People Manager | Project | ISO 9001/14001 Integrated Management System | SUP | Settat Operations Supervisor |

### 3.3 Step 2 — Creating the CM Project (M1)

1. On the Bouregreg Manufacturing Maroc Organization card, click **+ CM Project**. Fill in:
   - Name: "ISO 9001/14001 Integrated Management System"
   - Linked Main Project: **none**
   - Owner: "Rania Bensouda"
   - Change type: **QMS**
   - Target population: "Settat plant operations and quality function (410)"
   - Business driver: "A customer contract requires certified quality management (ISO 9001); a parallel environmental certification (ISO 14001) is bundled on the same management system for efficiency."
2. Save. Lewin opens at **Unfreeze**, justification: "Opening Unfreeze at program start, Week 1, alongside the ERP program's own kickoff."
3. On **Module 17 — WBS & Gantt**, load the **TPL-IMS-7** phase template (Intake & Diagnosis → Design → Implementation → Mock-up Audit → Certifying Audit → Surveillance Prep → Ongoing Surveillance).

### 3.4 Step 3 — Governance (M2)

Permission Matrix and the Governance Setting stay unchanged tenant-wide.

### 3.5 Step 4 — Charters for This Program (M19)

| Charter | Accountable (this program) | Review cadence |
|---|---|---|
| CHTR-01 Sponsorship / Leadership Charter | Nadia Fassi (ES) | Per Phase Gate |
| CHTR-03 Communication Charter | Rania Bensouda (CM) | Per communication wave |
| CHTR-04 Organizational Impact Charter | Rania Bensouda (CM) | On scope change |
| CHTR-05 Team Coaching Charter | Aziz Berrada (SUP) | Per reinforcement cycle |
| CHTR-08 Pulse / Interview Charter | Rania Bensouda (CM) | Per phase gate + ad hoc |

### 3.6 Setup Checklist

- [ ] Base tenant confirmed (Bouregreg Group, Bouregreg Manufacturing Maroc Organization)
- [ ] Certification team accounts created — Section 3.2
- [ ] CM Project created, Lewin opened at Unfreeze — Section 3.3
- [ ] TPL-IMS-7 phase template loaded on M17 — Section 3.3
- [ ] Five applicable Charters reviewed and accountable owners confirmed — Section 3.5

With this checklist complete, Part 4 runs the program forward, week by week.


## Part 4 — Week-by-Week QMS Timeline: Normal Flow and Exceptions

Part 3 ended with ISO 9001/14001 Integrated Management System registered and its Lewin phase opened at Unfreeze, program Week 1 — the same week as Bouregreg Group's own org calendar, since this program opens alongside the ERP program's own kickoff. Every one of the program's 60 individual weeks, through the first full surveillance cycle, is listed on its own row, so a reader can see exactly which week a framework reading, a phase transition, or an exception is active in.

### 4.1 Normal Flow, Phase by Phase

#### Phase 1 — Intake & Diagnosis (Weeks 1–12)

Diagnoses Settat's current quality and environmental practices against both ISO 9001 and ISO 14001 requirements before any design work starts — a dual-standard gap analysis, not two separate ones.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 1** | Samir Chraibi holds program kickoff; confirms Nadia Fassi's sponsorship. | Rania Bensouda briefs the team; plans the dual-standard gap analysis. | M1 (Hierarchy) — verify the CM Project record matches the kickoff agreement. | — | — |
| **Week 2** | Schedule gap-analysis interviews across operations, procurement, and HR. | — | M21 — routine log. | — | — |
| **Week 3** | Begin the ISO 9001/14001 gap analysis against current Settat practices. | Baseline ADKAR pulse for plant operations and quality staff. | M5 (ADKAR Engine) — Awareness 3, Desire 3. | — | — |
| **Week 4** | Continue gap analysis; catalogue findings against both standards' clause sets in parallel. | — | M21 — routine log. | — | — |
| **Week 5** | Continue gap analysis across operations, procurement, and HR touchpoints. | Log Nadia Fassi's coalition status: zero named coalition members beyond herself. | M7 (Sponsor & Coalition) — coalition member count: 0. | — | Coalition member count |
| **Week 6** | Continue gap analysis. | — | M21 — routine log. | — | — |
| **Week 7** | Continue gap analysis. | Map stakeholder cohorts across the four functions certification touches. | M4 (Stakeholder Mapping) — "Settat Operations," "Quality Function," "Procurement," "HR" cohorts logged. | — | — |
| **Week 8** | Draft the dual-standard gap analysis report. | — | M21 — routine log. | — | — |
| **Week 9** | Consolidate gap analysis findings into a single dual-standard report. | — | M21 (Field Notes) — Category: Decision · Title: "Gap Analysis Consolidated." | — | — |
| **Week 10** | Review the consolidated findings with the Steering Committee. | — | M21 — routine log. | (Phase 2 also begins this week) | — |
| **Week 11** | Finalize the gap analysis report for sign-off. | — | M21 — routine log. | — | — |
| **Week 12** | Confirm the Phase 1 gate: gap analysis signed off. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Intake & Diagnosis closes once the dual-standard gap analysis is signed off across all four touched functions.*

#### Phase 2 — Design (Weeks 10–26)

Designs the integrated management system's documented procedures — one system serving both ISO 9001 and ISO 14001, not two parallel document sets.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 10** | Begin designing the integrated management system's procedure set. | — | M21 — routine log. | — | — |
| **Week 11** | Continue procedure design; scope the full document set against both standards. | — | M21 — routine log. | — | — |
| **Week 12** | Continue procedure design. | — | M21 — routine log. | (Phase 1 gate also closes this week) | — |
| **Week 13** | Continue procedure design. | — | M21 — routine log. | — | — |
| **Week 14** | Continue procedure design; confirm which existing procedures can be adapted versus written new. | — | M21 — routine log. | — | — |
| **Week 15** | Continue procedure design across quality and environmental controls. | — | M21 — routine log. | — | — |
| **Week 16** | Continue procedure design. | — | M21 — routine log. | — | — |
| **Week 17** | Draft the first complete procedure set for internal review. | — | M21 — routine log. | — | — |
| **Week 18** | Continue procedure design across operations and environmental controls. | Re-score ADKAR — Knowledge beginning to build as draft procedures circulate. | M5 (ADKAR Engine) — Knowledge 3. | — | — |
| **Week 19** | Review the draft procedure set internally within Quality. | — | M21 — routine log. | — | — |
| **Week 20** | Continue internal review. | — | M21 — routine log. | — | — |
| **Week 21** | Circulate the draft procedure set to Operations, Procurement, and HR for comment. | — | M21 — routine log. | — | — |
| **Week 22** | Review the draft procedure set with Mehdi Ouahbi. | Coalition status unchanged: still zero named members beyond the Sponsor. | M7 (Sponsor & Coalition) — coalition member count: 0. | — | Coalition member count (unchanged) |
| **Week 23** | Incorporate review comments into the procedure set. | — | M21 — routine log. | — | — |
| **Week 24** | Finalize the procedure set for sign-off. | — | M21 — routine log. | (Phase 3 also begins this week) | — |
| **Week 25** | Present the finalized procedure set to the Steering Committee. | — | M21 — routine log. | — | — |
| **Week 26** | Confirm the Phase 2 gate: procedure set signed off. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Design closes once the integrated procedure set is signed off — still with no named coalition beyond the Sponsor, a gap Phase 3 makes impossible to ignore.*

#### Phase 3 — Implementation (Weeks 24–38)

Rolls the new procedures into daily practice across operations, procurement, and HR — the exact point where a Sponsor with real authority only inside quality's own function runs out of road.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 24** | Begin implementation: new procedures roll out to plant operations first. | — | M21 — routine log. | (Phase 2 gate also closes this week) | — |
| **Week 25** | Continue operations rollout. | — | M5 — routine update. | — | — |
| **Week 26** | Continue operations rollout. | — | M5 — routine update. | (Phase 2 gate also closes this week) | — |
| **Week 27** | Confirm operations rollout complete; begin procurement rollout preparation. | — | M21 — routine log. | — | — |
| **Week 28** | Attempt procurement rollout — stalls, since procurement reports to a different function head Nadia Fassi has no authority over. | **Confirm the coalition gap directly: still zero named coalition members. journi's ALT-010 (Guiding Coalition Gap) fires.** | M7 (Sponsor & Coalition) — coalition member count: 0, five weeks into Implementation. | **ALT-010 fires this week** (Section 4.2) | Coalition member count (0) |
| **Week 29** | Escalate to the Steering Committee: procurement and HR rollout both blocked without cross-functional authority. | Begin actively recruiting named coalition members from Procurement and HR leadership. | M21 (Field Notes) — Category: Decision · Title: "Coalition-Building Response Initiated." | ALT-010 resolution in progress | — |
| **Week 30** | Support scheduling introductory sessions with the incoming coalition members. | Continue coalition recruitment conversations with Procurement and HR leadership. | M21 — routine log. | ALT-010 resolution in progress | — |
| **Week 31** | Support onboarding the two new coalition members into the program's governance. | Log the Procurement Director and HR Business Partner as named coalition members. | M7 (Sponsor & Coalition) — coalition member count: 2. | **ALT-010 resolved this week** | Coalition member count (2) |
| **Week 32** | Resume procurement rollout planning with the Procurement Director's direct involvement. | — | M21 — routine log. | — | — |
| **Week 33** | Resume procurement rollout with the Procurement Director's direct backing. | — | M5 — routine update, procurement cohort. | — | — |
| **Week 34** | Continue procurement rollout; begin HR rollout preparation. | — | M5 — routine update. | — | — |
| **Week 35** | Resume HR rollout with the HR Business Partner's direct backing. | — | M5 — routine update, HR cohort. | — | — |
| **Week 36** | Continue HR rollout. | — | M5 — routine update. | (Phase 4 also begins this week) | — |
| **Week 37** | Confirm all four functions have adopted the new procedures. | — | M21 — routine log. | — | — |
| **Week 38** | Confirm the Phase 3 gate: implementation complete across all four functions. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Implementation closes once all four functions have adopted the new procedures — with a real coalition behind it, not the Sponsor working alone.*

#### Phase 4 — Mock-up Audit (Weeks 36–46)

A rehearsal audit against both standards, run internally, before the real certifying audit.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 36** | Prepare the mock-up audit scope and schedule. | — | M21 — routine log. | (Phase 3 active) | — |
| **Week 37** | Confirm the mock-up auditor (internal, cross-functional) and finalize the audit checklist against both standards. | — | M21 — routine log. | — | — |
| **Week 38** | Finalize mock-up audit logistics. | — | M21 — routine log. | (Phase 3 gate also closes this week) | — |
| **Week 39** | Brief all four functions on the mock-up audit process. | — | M21 — routine log. | — | — |
| **Week 40** | Run the mock-up audit across operations, procurement, and HR. | Log findings by function, distinguishing documentation gaps from practice gaps. | M21 (Field Notes) — Category: Other · Title: "Mock-up Audit Findings Logged." | — | Mock-up audit finding count |
| **Week 41** | Consolidate mock-up audit findings into a corrective-action tracker. | — | M21 — routine log. | — | — |
| **Week 42** | Assign owners and deadlines to each corrective action. | — | M21 — routine log. | — | — |
| **Week 43** | Close mock-up audit findings with corrective actions. | — | M10 (Resistance) — n/a; findings tracked separately as corrective actions, not resistance. | — | — |
| **Week 44** | Continue closing corrective actions. | — | M21 — routine log. | (Phase 5 also begins this week) | — |
| **Week 45** | Confirm all corrective actions closed. | — | M21 — routine log. | — | — |
| **Week 46** | Confirm the Phase 4 gate: mock-up findings closed. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Mock-up Audit closes once every finding has a closed corrective action, not just a logged one.*

#### Phase 5 — Certifying Audit (Weeks 44–50)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 44** | Confirm certifying audit readiness against mock-up results. | — | M21 — routine log. | (Phase 4 active) | — |
| **Week 45** | Schedule the certifying body's audit dates. | — | M21 — routine log. | — | — |
| **Week 46** | Final readiness review with all four functions. | — | M21 — routine log. | (Phase 4 gate also closes this week) | — |
| **Week 47** | Host the certifying body's audit across all four functions, with the full coalition present. | — | M21 (Field Notes) — Category: Other · Title: "Certifying Audit Conducted." | — | — |
| **Week 48** | Await the certifying body's formal decision. | — | M21 — routine log. | (Phase 6 also begins this week) | — |
| **Week 49** | Confirm certification decision received. | — | M21 — routine log. | — | — |
| **Week 50** | Confirm the Phase 5 gate: certification granted for both ISO 9001 and ISO 14001. | Set Lewin to **Change** — deliberately not Refreeze, since the system's real test is the first surveillance cycle. | M3 (Initiative Registry) — Lewin: "Change." Justification: "Certification granted; Refreeze reserved for after the first surveillance cycle confirms the system holds." | — | Certification status (granted) |

*Phase gate: Certifying Audit closes once certification is granted for both standards.*

#### Phase 6 — Surveillance Prep (Weeks 48–52)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 48** | Prepare the standing surveillance schedule alongside the final certifying-audit weeks. | — | M21 — routine log. | (Phase 5 active) | — |
| **Week 49** | Draft per-function surveillance owner assignments. | — | M21 — routine log. | — | — |
| **Week 50** | Confirm the surveillance schedule and named ongoing owners per function. | — | M12 (Sustainment) — first standing checkpoint logged, tied to the surveillance calendar rather than a one-time close. | (Phase 5 gate also closes this week) | — |
| **Week 51** | Confirm each function's named owner has accepted their surveillance obligation. | — | M21 — routine log. | — | — |
| **Week 52** | Confirm the Phase 6 gate: surveillance schedule and owners confirmed. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Surveillance Prep closes once every function has a named, standing owner for its own surveillance obligations — not a single centralized owner who eventually moves on.*

#### Phase 7 — Ongoing Surveillance (Weeks 52 onward, open-ended)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 52** | Confirm the first surveillance cycle begins on schedule. | — | M12 (Sustainment) — surveillance cycle 1 opened. | (Phase 6 gate also closes this week) | — |
| **Week 53** | First surveillance spot-check, operations function. | — | M21 — routine log. | — | — |
| **Week 54** | Continue surveillance monitoring. | — | M21 — routine log. | — | — |
| **Week 55** | Surveillance spot-check, quality function. | — | M21 — routine log. | — | — |
| **Week 56** | First surveillance spot-check, procurement function. | Confirm the coalition built in Phase 3 is still active, not quietly reverted to the Sponsor alone. | M7 (Sponsor & Coalition) — coalition member count: still 2 or more. | — | Coalition member count (sustained) |
| **Week 57** | Surveillance spot-check, HR function. | — | M21 — routine log. | — | — |
| **Week 58** | Continue surveillance monitoring across all four functions. | — | M21 — routine log. | — | — |
| **Week 59** | Compile the first full surveillance cycle's results ahead of closure. | — | M21 — routine log. | — | — |
| **Week 60** | First full surveillance cycle closes clean. | Set Lewin to **Refreeze** — the confirmed call this guide reserves until the system has actually held through a real cycle. | M3 (Initiative Registry) — Lewin: "Refreeze." Justification: "First full surveillance cycle closed clean, Week 60; coalition sustained beyond the certifying audit." | — | Lewin state (confirmed Refreeze) |

*Phase gate: Ongoing Surveillance has no formal close — this guide narrates through the first full cycle (Week 60) as the point Lewin's Refreeze call becomes genuinely confirmed, consistent with journi's own framing of certification maintenance as a standing condition, not a project outcome.*

### 4.2 Master WBS & Gantt — Every Task and Step, PM and CM Tracks, Across the Four Frameworks

| ID | Task / Step Name | Track | Week(s) | Lewin | ADKAR | Bridges | Kübler-Ross |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Dual-standard gap analysis | Joint | 1–7 | Unfreeze | Awareness | Ending | Denial |
| T1.1-S2 | Stakeholder mapping and Phase 1 sign-off | CM | 7–12 | Unfreeze | Awareness | Ending | Denial |
| T2.1-S1 | Integrated procedure set design | PM | 10–18 | Unfreeze | Awareness → Knowledge | Ending | Denial |
| T2.1-S2 | Design sign-off | PM | 18–26 | Unfreeze | Knowledge | Ending → Neutral Zone | Denial → Resistance/Anger |
| T3.1-S1 | Operations rollout; coalition gap detected (ALT-010) | CM | 24–29 | Unfreeze | Knowledge | Neutral Zone | Resistance/Anger |
| T3.1-S2 | Coalition built; procurement and HR rollout resumed | Joint | 29–38 | Unfreeze | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration |
| T4.1-S1 | Mock-up audit conducted | PM | 36–40 | Unfreeze | Ability | Neutral Zone | Exploration |
| T4.1-S2 | Mock-up findings closed | PM | 40–46 | Unfreeze | Ability | Neutral Zone | Exploration |
| T5.1-S1 | Certifying audit conducted | Joint | 44–47 | Unfreeze | Ability | Neutral Zone | Exploration |
| T5.1-S2 | Certification granted | Joint | 47–50 | Change | Ability → Reinforcement | Neutral Zone → New Beginning | Exploration → Commitment |
| T6.1-S1 | Surveillance schedule designed | PM | 48–50 | Change | Reinforcement | New Beginning | Commitment |
| T6.1-S2 | Per-function surveillance owners confirmed | Joint | 50–52 | Change | Reinforcement | New Beginning | Commitment |
| T7.1-S1 | First surveillance cycle opens | CM | 52–56 | Change | Reinforcement | New Beginning | Commitment |
| T7.1-S2 | First cycle closes clean; Refreeze confirmed | CM | 56–60 | **Refreeze** | Reinforcement | New Beginning | Commitment |

*Table 4.2.1 — Master WBS & Gantt, framework view. All 14 Task/Step rows through the first full surveillance cycle.*

### 4.3 Master WBS & Gantt — Every Task and Step, Techniques and Tools

| ID | Task / Step Name | Track | Week(s) | Technique Name | Technique Goal | Technique Details | Recommended Tool |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Dual-standard gap analysis | Joint | 1–7 | Combined ISO 9001/14001 gap assessment | Assess current practice against both standards on one pass, not two separate audits. | Cross-reference current documented and observed practice against both standards' clauses simultaneously. | LibreOffice Calc |
| T1.1-S2 | Stakeholder mapping and sign-off | CM | 7–12 | Cross-functional stakeholder mapping | Identify every function certification actually touches, before design work assumes it's quality's problem alone. | Map Operations, Quality, Procurement, and HR as distinct cohorts with their own impact severity. | journi M4 — Stakeholder Mapping |
| T2.1-S1 | Integrated procedure set design | PM | 10–18 | Single-system procedure design | Design one set of procedures serving both standards, not parallel document sets. | Identify which existing procedures adapt versus need to be written new. | BookStack |
| T2.1-S2 | Design sign-off | PM | 18–26 | Design review and sign-off | Confirm the procedure set before implementation begins. | Review with the Quality Lead; sign off per function. | journi M17 — WBS & Gantt |
| T3.1-S1 | Operations rollout; coalition gap detected | CM | 24–29 | Coalition-status monitoring | Detect a structural sponsorship gap directly from the M7 record, not assume authority scales automatically. | Check M7 coalition-member count at each phase checkpoint; confirm the gap once implementation stalls outside quality's own authority. | journi M7 — Sponsor & Coalition |
| T3.1-S2 | Coalition built; rollout resumed | Joint | 29–38 | Cross-functional coalition recruitment | Recruit named allies with real authority in the functions the Sponsor alone cannot compel. | Recruit the Procurement Director and HR Business Partner as named coalition members; resume rollout with their direct backing. | journi M7 — Sponsor & Coalition |
| T4.1-S1 | Mock-up audit conducted | PM | 36–40 | Internal rehearsal audit | Find and fix findings before the real certifying audit, not during it. | Run an internal audit against both standards' full clause set, across all four functions. | journi M21 — Field Notes |
| T4.1-S2 | Mock-up findings closed | PM | 40–46 | Corrective action tracking | Close every mock-up finding with a real corrective action, not just a logged note. | Track each finding to closure with an owner and a date, separate from the resistance log. | LibreOffice Calc |
| T5.1-S1 | Certifying audit conducted | Joint | 44–47 | External certifying audit | Pass the real, external audit with the coalition present, not the Sponsor alone. | Host the certifying body across all four functions; coalition members present for their own function's review. | journi M21 — Field Notes |
| T5.1-S2 | Certification granted | Joint | 47–50 | Lewin state transition (deliberately not Refreeze) | Move to Change, reserving Refreeze for evidence the system holds beyond the audit pass itself. | Set Lewin to Change with a justification explicitly naming why Refreeze is reserved. | journi M3 — Initiative Registry |
| T6.1-S1 | Surveillance schedule designed | PM | 48–50 | Standing surveillance calendar | Design a surveillance cadence before certification is granted, not after. | Define per-function spot-check intervals for the ongoing surveillance cycle. | journi M17 — WBS & Gantt |
| T6.1-S2 | Per-function surveillance owners confirmed | Joint | 50–52 | Distributed ownership confirmation | Name a standing owner per function, avoiding a single centralized owner who eventually moves on. | Confirm and log one named owner per function for their own surveillance obligations. | journi M12 — Sustainment |
| T7.1-S1 | First surveillance cycle opens | CM | 52–56 | Surveillance cycle execution | Begin the standing surveillance obligation the certification actually requires. | Open cycle 1 on the M12 sustainment record, tied to the calendar, not a one-time close. | journi M12 — Sustainment |
| T7.1-S2 | First cycle closes clean; Refreeze confirmed | CM | 56–60 | Confirmed Refreeze | Confirm the system holds through a real cycle, and that the coalition survived beyond the audit. | Verify the Phase 3 coalition is still active before confirming Refreeze — a reverted-to-Sponsor-alone coalition would mean Refreeze isn't earned yet. | journi M3 / M7 |

*Table 4.3.1 — Master WBS & Gantt, technique view. Same 14 rows as Table 4.2.1, with the operational detail behind each step.*

### 4.4 Six Exceptions, in Detail

#### E1 — Guiding Coalition Gap (Phase 3, Weeks 28–31)

**Detailed description.** Five weeks into Implementation, Nadia Fassi's Sponsor & Coalition record still showed zero named coalition members, and procurement/HR rollout had stalled outside her direct authority — journi's ALT-010 condition met exactly.

**Trigger.** Fewer than two named coalition members logged on M7 during an active implementation phase.

**Timeline impact.** No Phase 3 gate delay — resolution completed by Week 31, seven weeks ahead of the Week 38 gate — but it exposed a structural gap that, left open, would have blocked certification entirely.

**Recovery tasks.** Escalate the authority gap explicitly to the Steering Committee (Week 29); recruit the Procurement Director and HR Business Partner as named coalition members with real standing in their own functions (Week 31); resume rollout with their direct backing rather than the Sponsor alone.

**Outputs.** Two new named coalition members on M7; resumed procurement and HR rollout.

**RACSI.** R = CM, ES · A = ES · C = PM · S = FPO · I = SUP, EU

#### E2 — Mock-up Audit Finds a Systemic Documentation Gap (Phase 4, Weeks 40–43)

**Detailed description.** The mock-up audit finds that the Design phase's procedure set never fully addressed ISO 14001's waste-handling documentation clause — not a single missed document, but a systemic gap across the whole environmental half of the integrated system.

**Trigger.** A mock-up audit finding pattern spanning multiple clauses within the same standard, rather than isolated findings.

**Timeline impact.** Would add two to three weeks to Mock-up Audit while the gap is closed, and risks compressing the buffer before the certifying audit if not caught this early.

**Recovery tasks.** Confirm the gap is systemic, not isolated, before treating it as a single finding; return to a focused re-design of the waste-handling documentation specifically, rather than the whole procedure set; re-test the fix against the same mock-up audit criteria before declaring the finding closed.

**Outputs.** A revised waste-handling documentation set; a confirmed, re-tested closure.

**RACSI.** R = FPO, ITL · A = CM · C = PM · S = SUP · I = ES, EU

#### E3 — External Auditor Flags a Nonconformity During Certification (Phase 5, Week 47)

**Detailed description.** The certifying body's own auditor, independent of the mock-up audit, flags a minor nonconformity during the real certifying audit — a specific procedure followed correctly on paper but not consistently in observed practice on the plant floor.

**Trigger.** A nonconformity finding from the external certifying auditor during the live audit.

**Timeline impact.** Minor nonconformities typically allow certification to proceed conditionally, with a defined corrective-action deadline — would add a defined follow-up window (commonly 60–90 days) rather than delaying the Week 50 certification decision itself.

**Recovery tasks.** Accept the finding directly rather than dispute it defensively; design and implement the corrective action within the certifying body's own deadline; document the fix for the first surveillance cycle to verify.

**Outputs.** A documented corrective action with a confirmed deadline; conditional certification proceeding on schedule.

**RACSI.** R = FPO, SUP · A = CM · C = ES · S = PM · I = ITL, EU

#### E4 — A Function Reverts to Old Practice Once the Auditor Leaves (Phase 7, Weeks 54–58)

**Detailed description.** A surveillance spot-check finds that one function — commonly the one furthest from quality's own daily oversight — has quietly reverted to a pre-certification shortcut once the pressure of the audit itself passed, the classic "audit theater" risk every certification program has to guard against.

**Trigger.** A surveillance spot-check finding a documented procedure not actually followed in practice, in a function with no other open issues.

**Timeline impact.** Would not delay the surveillance cycle's own schedule, but requires an out-of-cycle corrective conversation before the next scheduled spot-check.

**Recovery tasks.** Address the reversion directly and specifically with that function's named coalition-era owner, not a general reminder to everyone; investigate whether the reversion reflects a genuine practical problem with the procedure itself, not just non-compliance, and adjust the procedure if the concern is legitimate.

**Outputs.** A closed reversion finding; either confirmed re-compliance or a revised procedure addressing a legitimate practical issue.

**RACSI.** R = FPO, SUP · A = CM · C = ES · S = PM · I = ITL, EU

#### E5 — Environmental Requirements Conflict With an Existing Operations Practice (Phase 2–3, Weeks 18–26)

**Detailed description.** A specific ISO 14001 waste-handling requirement conflicts directly with an existing, longstanding operations practice that was never a problem for ISO 9001 alone — the specific complication a genuinely *integrated* certification introduces that a single-standard program wouldn't face.

**Trigger.** A design-phase or early-implementation conflict between the two standards' requirements and current practice, surfaced during procedure drafting.

**Timeline impact.** Would add one to two weeks to Design while operations and the environmental requirement's actual intent are reconciled, rather than simply picking one standard's letter over the other's.

**Recovery tasks.** Bring Operations directly into resolving the conflict rather than having quality dictate a solution; confirm the actual regulatory intent behind the environmental requirement, since a literal reading and its real intent sometimes diverge; document the resolution as a case study for future integrated-standard conflicts.

**Outputs.** A resolved procedure satisfying both standards' actual intent; a documented resolution case study.

**RACSI.** R = FPO, SUP · A = CM · C = ITL · S = PM · I = ES, EU

#### E6 — A Coalition Member Departs During Surveillance (Phase 7, Weeks 56+)

**Detailed description.** The HR Business Partner recruited as a coalition member during Phase 3's recovery (Exception E1) leaves the organization during Ongoing Surveillance, risking a quiet reversion to the exact structural gap the program worked to close.

**Trigger.** A confirmed departure of a named coalition member during an active surveillance cycle.

**Timeline impact.** No impact to the surveillance calendar itself if the coalition seat is refilled promptly; a genuine risk of ALT-010 firing a second time if it is not.

**Recovery tasks.** Treat the coalition seat, not just the person, as the standing requirement — identify and onboard a successor from the same function before the departure takes effect, not after; confirm the successor has the same real authority the departing member had, not just the title.

**Outputs.** A refilled coalition seat with confirmed real authority; a coalition-continuity practice logged for future departures.

**RACSI.** R = CM, ES · A = ES · C = FPO · S = PM · I = SUP, ITL, EU


## Part 5 — Training Program: Certification Literacy Across Three Tiers

### 5.1 What This Training Covers

Per the E2E-IMS chain, MP-05 is present and directly relevant — certification depends on staff correctly following documented procedures, which is fundamentally a training question, logged on M9.

### 5.2 Tier 1 — Strategic Management (Weeks 1–10)

**Cohort.** Nadia Fassi (Sponsor), and — once recruited — the Procurement Director and HR Business Partner coalition members.

| Curriculum Entry | Content Focus | Weeks | M9 Entry — What to Log | Completion Target |
|---|---|---|---|---|
| Sponsoring a Cross-Functional Certification | Why quality-function authority alone doesn't extend to procurement or HR, and what a real coalition requires structurally, not just personally. | 1–4 | Curriculum: "Sponsoring a Cross-Functional Certification" · Cohort: "Sponsor." | 100% before Week 5 |
| Coalition Governance for New Members | Onboarding for the coalition members recruited in Exception E1 — their real role, not a ceremonial title. | 29–31 | Curriculum: "Coalition Governance for New Members" · Cohort: "Procurement Director, HR Business Partner." | 100% before Week 33 |

### 5.3 Tier 2 — Operational Management (Weeks 10–36)

**Cohort.** Mehdi Ouahbi (FPO), Aziz Berrada (SUP).

| Curriculum Entry | Content Focus | Weeks | M9 Entry — What to Log | Completion Target |
|---|---|---|---|---|
| Leading Integrated Procedure Rollout | Practical rollout leadership for a single procedure set serving two standards, distinct from a single-standard certification. | 10–24 | Curriculum: "Leading Integrated Procedure Rollout" · Cohort: "Quality Lead, Operations Supervisor." | 100% before Week 26 |
| Preparing a Team for Audit — Mock-up Through Certifying | Practical audit-readiness coaching, distinguishing documentation compliance from demonstrated practice. | 32–36 | Curriculum: "Preparing a Team for Audit" · Cohort: "Quality Lead, Operations Supervisor." | 100% before Week 38 |

### 5.4 Tier 3 — Operations (Frontline) (Weeks 20–46)

**Cohort.** All 410 Settat plant operations and quality staff.

| Curriculum Entry | Content Focus | Weeks | M9 Entry — What to Log | Completion Target |
|---|---|---|---|---|
| Following the Integrated Management System | Practical training on the new procedures, using real plant-floor scenarios, not abstract standard language. | 20–34 (per function rollout wave) | Curriculum: "Following the Integrated Management System" · Cohort: "Operations" / "Procurement" / "HR." | 100% within 2 weeks of each function's rollout |
| Sustaining Practice Beyond the Audit | Directly addresses Exception E4's audit-theater risk — why the procedure matters after the auditor leaves, not only during the audit. | 44–46 | Curriculum: "Sustaining Practice Beyond the Audit" · Cohort: "All 410." | 100% before certification, Week 50 |

### 5.5 Training Completion and the Composite Readiness Index

This program's training-completion term rises through Design and Implementation, then plateaus alongside the coalition gap (Section 2.3) — procurement and HR staff cannot meaningfully complete training on procedures their own function hasn't yet adopted. The term resumes climbing once the coalition is built and rollout resumes, a pattern this guide reads as confirming, not contradicting, the M7 coalition record.
