journi

Running a Regional Operating Model Redesign

A Focused Guide to journi's Operating Model Transformation Archetype

Case: Regional Operating Model Redesign (Manufacturing — All Three Bouregreg Sites)

Tenant Setup Through Standing Rhythm Handover — One Program, Followed Week by Week

Version 1.0 · September 2026 · Confidential


## Part 0 — Purpose and How to Use This Guide

### What this guide is

This guide is a single, focused companion to journi's Operating Model transformation archetype, following **Regional Operating Model Redesign** — Bouregreg Group's realignment of reporting lines across all three sites from a site-based structure to a function-based one — from CM Project creation through standing rhythm handover, week by week. It is the guide in this series that shows what happens *after* go-live looks clean: a real regression, caught by journi's own sustainment checkpoint, that blocks formal sign-off until it's actually resolved.

It is organized in six parts: Part 0 (this part), Part 1 (Executive Summary), Part 2 (The Four Frameworks and What Is Specific to Operating Model Change), Part 3 (Tenant and Admin Setup), Part 4 (Week-by-Week Operating Model Timeline: Normal Flow and Exceptions, including two Master WBS & Gantt views), and Part 5 (Training Program).

### How to use it

This guide's Bouregreg Group tenant is the same one journi's Master User Guide builds, and the same one this series' other archetype guides extend. A reader with the tenant already set up skips to Part 3, Section 3.2.

### A note on fidelity

Every journi module, field, and role named in this guide is verified against journi's actual source. Regional Operating Model Redesign is journi's own stated case for **ALT-002 (Regression Risk Score Critical)** and the **ALT-015 (Sustainment Sign-Off Blocked)** it triggers — this guide builds toward both firing at the program's first 30-day sustainment checkpoint, exactly as journi's own scenario library states.

### A note on the RACSI codes used throughout

Part 4's RACSI tables use journi's 7-code RACSI role taxonomy (ES/CM/PM/FPO/ITL/SUP/EU), distinct from the 9-role platform RBAC enum Part 3 uses for journi user accounts. **ES** = Executive Sponsor, **CM** = Change Manager, **PM** = Program/Project Manager, **FPO** = Functional Process Owner, **ITL** = IT/Technical Lead, **SUP** = Supervisor, **EU** = End User.

### Reading paths, by role

- **A Change Manager running this program day to day:** Part 2 once, then Part 4 in full.
- **A Program/Project Manager:** Part 4's PM Track column and the Master WBS & Gantt (Sections 4.2–4.3).
- **An Executive Sponsor:** Part 1, then Part 4's phase-opening narratives.
- **A Super Admin or Org Admin:** Part 3.


## Part 1 — Executive Summary

### 1.1 Why This Case Matters: A Clean Go-Live Is Not the Same as a Sustained One

Every other guide in this series treats its go-live or certification as the moment the hardest work is behind it. This case exists to correct that instinct: Regional Operating Model Redesign's Full Transition phase closes looking clean, and then, exactly 30 days later, its first sustainment checkpoint finds a real regression — reporting lines quietly reverting toward the old site-based habit under real operational pressure. journi's own ALT-002 and ALT-015 exist precisely to catch this pattern and block a premature sign-off, not to be an unusual failure this guide has to manufacture.

Three facts drive this case's specific shape:

- **The business driver came from watching the ERP program, not from a separate diagnosis.** The ERP program's own Build phase exposed how much duplicated decision-making the site-based structure was causing — this program's business case is evidence borrowed from a sibling program, not invented fresh.
- **The population is small but structurally central.** Ninety-five people-manager-level staff across three sites is a small population by headcount, but every one of them sits at exactly the reporting-line boundary this redesign moves.
- **The regression is the point, not a failure of the guide.** ALT-002 and ALT-015 firing here is journi's own scenario library working as designed — catching a real reversion before it's mistaken for a stable new normal.

### 1.2 The Case, in Brief

Bouregreg Group realigns reporting lines across Casablanca, Kenitra, and Settat from a site-based structure — Finance, Operations, and Quality each reporting to their own site director — to a function-based one, where each function reports centrally. This program (Weeks 35–68+ of Bouregreg Group's own org calendar, opening once the ERP program's own Build phase exposed the duplication) covers all 95 people-manager-level staff across the three sites, hitting a real regression at its first sustainment checkpoint and resolving it before the sign-off journi's own ALT-015 blocks.

### 1.3 What This Guide Proves, Concretely

Every claim above is traceable to a real journi record this guide builds: a 30-day checkpoint logging High regression risk, a blocked sustainment sign-off, a documented root-cause and corrective response, and a second, clean checkpoint that finally unblocks it.


## Part 2 — The Four Frameworks and What Is Specific to Operating Model Change

### 2.1 journi's Four Frameworks, in Their Real Stage Vocabulary

| Framework | Altitude | Stages (in journi's own UI, in order) | Logged on |
|---|---|---|---|
| Lewin | Organizational — one reading per project | Unfreeze → Change → Refreeze | M3 (Initiative Registry) |
| Prosci ADKAR | Individual / cohort — five independently-scored blocks | Awareness → Desire → Knowledge → Ability → Reinforcement | M5 (ADKAR Engine) |
| Bridges' Transition Model | Individual / cohort — emotional position | Ending → Neutral Zone → New Beginning | M6 (Emotional & Transition Layer) |
| Kübler-Ross Change Curve | Individual / cohort — sentiment | Denial → Resistance/Anger → Exploration → Commitment | M6 (Emotional & Transition Layer) |

### 2.2 Why the Weighting Is Different for Operating Model Change

- **Reinforcement is this case's real center of gravity.** Awareness, Desire, Knowledge, and Ability can all read cleanly by go-live — people-managers genuinely understand and can operate the new reporting lines. Reinforcement is where this case actually lives or dies, since a new reporting line without daily reinforcement quietly drifts back toward old habit under pressure.
- **Regression risk is a first-class, named concept in journi**, more explicitly than in any other archetype in this series — M12 (Sustainment)'s regression-risk flag exists specifically for this pattern.
- **MP-05 (Training & Capability Enablement) is present**, per the E2E-OM chain (MP-01→02→03→05→07→08→09→10) — Part 5 covers it, focused on the new reporting-line mechanics and decision rights, not on convincing anyone the structure is right.

### 2.3 The Composite Readiness Index and Benchmarking, Read for This Case

This program's Composite Readiness Index reads strong through Full Transition, then drops sharply at the Week 26 checkpoint reading — the exact moment ALT-002 fires — before recovering once the regression is addressed. Benchmarking reads "Behind" for the weeks the sign-off stays blocked, a deliberate, honest reading this guide narrates directly rather than treat the pre-checkpoint reading as the program's real final state.


## Part 3 — Tenant and Admin Setup

### 3.1 The Existing Tenant: Bouregreg Group

This program runs inside the same tenant journi's Master User Guide builds, under the existing Bouregreg Manufacturing Maroc Organization, spanning all three of its existing sites (Casablanca HQ, Kenitra Plant, Settat Plant). No new Organization is needed.

### 3.2 Step 1 — Onboarding the Redesign Team (M2)

| Name | journi Role (RBAC) | Scope type | Scope | RACSI Code | Notes |
|---|---|---|---|---|---|
| Yassine Berrada | Sponsor | Project | Regional Operating Model Redesign *(created in Step 2)* | ES | COO |
| Salma Idrissi | Change Manager | Project | Regional Operating Model Redesign | CM | Owns day-to-day program execution |
| Rachid Alaoui | Practitioner / Contributor | Project | Regional Operating Model Redesign | PM | Org design and transition lead |
| Amina Sqalli | People Manager | Project | Regional Operating Model Redesign | FPO | Finance Function Head |
| Nabil Ouazzani | Practitioner / Contributor | Project | Regional Operating Model Redesign | ITL | Reporting-line systems updates |
| Loubna Tazi | People Manager | Project | Regional Operating Model Redesign | SUP | Casablanca Finance People Manager (pilot site) |

### 3.3 Step 2 — Creating the CM Project (M1)

1. On the Bouregreg Manufacturing Maroc Organization card, click **+ CM Project**. Fill in:
   - Name: "Regional Operating Model Redesign"
   - Linked Main Project: **none**
   - Owner: "Salma Idrissi"
   - Change type: **Operating Model**
   - Target population: "All people-manager-level staff, 3 sites (95)"
   - Business driver: "The ERP program's own Build phase exposed how much duplicated decision-making the site-based structure causes; Finance, Operations, and Quality will report centrally by function rather than to each site's director."
2. Save. Lewin opens at **Unfreeze**, justification: "Opening Unfreeze at program start, Week 1 (org Week 35), once the ERP program's Build phase evidence was confirmed."
3. On **Module 17 — WBS & Gantt**, load the **TPL-OM-7** phase template (Current Operating Model Assessment → TOM Design → Detailed Org Design → Pilot Transition → Full Transition → Governance Adoption Tracking → Standing Rhythm Handover).

### 3.4 Step 3 — Governance (M2)

Permission Matrix and the Governance Setting stay unchanged tenant-wide.

### 3.5 Step 4 — Charters for This Program (M19)

| Charter | Accountable (this program) | Review cadence |
|---|---|---|
| CHTR-01 Sponsorship / Leadership Charter | Yassine Berrada (ES) | Per Phase Gate |
| CHTR-02 Participative Management Charter | Loubna Tazi (SUP) | Quarterly |
| CHTR-03 Communication Charter | Salma Idrissi (CM) | Per communication wave |
| CHTR-04 Organizational Impact Charter | Salma Idrissi (CM) | On scope change |
| CHTR-05 Team Coaching Charter | Loubna Tazi (SUP) | Per reinforcement cycle — directly relevant given this case's regression risk |

### 3.6 Setup Checklist

- [ ] Base tenant confirmed (Bouregreg Group, Bouregreg Manufacturing Maroc Organization)
- [ ] Redesign team accounts created — Section 3.2
- [ ] CM Project created, Lewin opened at Unfreeze — Section 3.3
- [ ] TPL-OM-7 phase template loaded on M17 — Section 3.3
- [ ] Five applicable Charters reviewed and accountable owners confirmed — Section 3.5

With this checklist complete, Part 4 runs the program forward, week by week.


## Part 4 — Week-by-Week Operating Model Timeline: Normal Flow and Exceptions

Part 3 ended with Regional Operating Model Redesign registered and its Lewin phase opened at Unfreeze, program Week 1. This Part runs that program forward for its full duration, against journi's TPL-OM-7 template. Program Week 1 corresponds to Bouregreg Group's own org-calendar Week 35 — add 34 to convert a program week to its org-calendar equivalent. Every one of the program's 34 individual weeks is listed on its own row, so a reader can see exactly which week a framework reading, a phase transition, or an exception is active in.

### 4.1 Normal Flow, Phase by Phase

#### Phase 1 — Current Operating Model Assessment (Weeks 1–8)

Documents the duplicated decision-making the ERP program's own Build phase exposed — borrowed evidence from a sibling program, not a fresh diagnosis.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 1** | Rachid Alaoui holds program kickoff; confirms Yassine Berrada's sponsorship. | Salma Idrissi briefs the team; pulls the ERP program's own Build-phase duplication findings as the starting evidence base. | M1 (Hierarchy) — verify the CM Project record matches the kickoff agreement. | — | — |
| **Week 2** | Schedule interviews with site directors and function heads across all three sites. | — | M21 — routine log. | — | — |
| **Week 3** | Interview site directors and function heads across all three sites about current decision-making duplication. | Baseline ADKAR pulse for the 95-person people-manager population. | M5 (ADKAR Engine) — Awareness 3, Desire 3. | — | — |
| **Week 4** | Continue interviews; begin cataloguing specific duplicated-decision examples per site. | — | M21 — routine log. | — | — |
| **Week 5** | Quantify the duplication: decisions currently made twice — once per site, once per function — with specific examples per site. | Map the people-manager cohort by site and function. | M4 (Stakeholder Mapping) — "Casablanca," "Kenitra," "Settat" people-manager cohorts logged. | — | — |
| **Week 6** | Draft the current-state assessment report. | — | M21 — routine log. | (Phase 2 also begins this week) | — |
| **Week 7** | Review the draft assessment with the Steering Committee ahead of sign-off. | — | M21 — routine log. | — | — |
| **Week 8** | Confirm the Phase 1 gate: current-state assessment signed off. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Current Operating Model Assessment closes once the duplication is quantified with specific, site-attributed examples.*

#### Phase 2 — TOM Design (Weeks 6–14)

Designs the target operating model — function-based reporting — at the conceptual level before detailed org design begins.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 6** | Begin target operating model design workshops with the Steering Committee. | — | M21 — routine log. | (Phase 1 gate also closes this week) | — |
| **Week 7** | Continue TOM design workshops. | — | M21 — routine log. | — | — |
| **Week 8** | Continue TOM design; draft the first candidate model. | — | M21 — routine log. | (Phase 1 gate also closes this week) | — |
| **Week 9** | Review the candidate model against the Phase 1 duplication evidence. | — | M21 — routine log. | — | — |
| **Week 10** | Continue TOM design; confirm which decisions move to central function heads versus stay site-local. | — | M21 — routine log. | — | — |
| **Week 11** | Refine the candidate model based on Steering Committee feedback. | — | M21 — routine log. | — | — |
| **Week 12** | Continue refining the target operating model. | — | M21 — routine log. | (Phase 3 also begins this week) | — |
| **Week 13** | Finalize the target operating model for sign-off. | — | M21 — routine log. | — | — |
| **Week 14** | Confirm the Phase 2 gate: target operating model signed off. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: TOM Design closes once the target operating model — which decisions centralize, which stay site-local — is signed off at the conceptual level.*

#### Phase 3 — Detailed Org Design (Weeks 12–18)

Translates the target operating model into specific reporting lines, named roles, and decision rights.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 12** | Begin detailed org design: specific reporting lines per function per site. | — | M21 — routine log. | — | — |
| **Week 13** | Continue detailed org design; draft named roles per function. | — | M21 — routine log. | — | — |
| **Week 14** | Continue detailed org design. | — | M21 — routine log. | (Phase 2 gate also closes this week) | — |
| **Week 15** | Confirm decision-rights matrix — who decides what, under the new model, without ambiguity. | Re-score ADKAR — Knowledge building as the detailed design circulates. | M5 (ADKAR Engine) — Knowledge 3. | — | — |
| **Week 16** | Review the decision-rights matrix with all three site directors for ambiguity. | — | M21 — routine log. | — | — |
| **Week 17** | Finalize the detailed org design for sign-off. | — | M21 — routine log. | (Phase 4 also begins this week) | — |
| **Week 18** | Confirm the Phase 3 gate: detailed org design and decision-rights matrix signed off. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Detailed Org Design closes once every reporting line and decision right is named specifically, with no ambiguity left for Pilot Transition to surface.*

#### Phase 4 — Pilot Transition (Weeks 17–22)

Casablanca Finance transitions first — a single function, single site, before the full three-site, three-function transition.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 17** | Prepare the Casablanca Finance pilot transition. | — | M21 — routine log. | (Phase 3 gate also closes this week) | — |
| **Week 18** | Finalize pilot logistics and communications with Loubna Tazi. | — | M8 (Communications) — pilot announcement drafted. | — | — |
| **Week 19** | Execute the Casablanca Finance pilot: reporting line moves from site director to central Finance Function Head. | Weekly pulse check begins for the pilot cohort. | M5 (ADKAR Engine) — Casablanca Finance: Ability 3. | — | — |
| **Week 20** | Continue pilot monitoring; log any early friction points. | — | M5 — routine update. | — | — |
| **Week 21** | Continue pilot monitoring. | — | M5 — routine update. | (Phase 5 also begins this week) | — |
| **Week 22** | Confirm the Phase 4 gate: pilot transition stable. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Pilot cohort stability |

*Phase gate: Pilot Transition closes once Casablanca Finance's new reporting line is confirmed stable — the evidence base for the Full Transition decision.*

#### Phase 5 — Full Transition (Weeks 21–27)

Extends the new reporting structure to all three functions across all three sites — the phase that, per journi's own scenario library, closes looking clean right before the regression surfaces.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 21** | Begin full transition planning across all three functions and sites. | — | M21 — routine log. | (Phase 4 active) | — |
| **Week 22** | Finalize full-transition communications and cutover schedule. | — | M8 (Communications) — full-transition briefing drafted. | (Phase 4 gate also closes this week) | — |
| **Week 23** | Execute full transition: Operations and Quality functions, all three sites, move to central function-head reporting. | — | M8 (Communications) — full-transition announcement, all 95 staff. | — | — |
| **Week 24** | Confirm cutover completion across all sites; log any immediate technical issues. | — | M21 — routine log. | — | — |
| **Week 25** | Confirm all 95 people-managers report against the new structure. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Transition completion (95/95) |
| **Week 26** | — | Log the program's first 30-day sustainment checkpoint. **The checkpoint lands High regression risk: several sites' day-to-day decisions are quietly reverting to the old site-director escalation path under real operational pressure. journi's ALT-002 (Regression Risk Score Critical) fires, and ALT-015 (Sustainment Sign-Off Blocked) follows automatically.** | M12 (Sustainment) — Checkpoint 1: regression-risk flag **High**. Sign-off toggle: blocked. | **ALT-002 fires this week, ALT-015 follows** (Section 4.2) | Regression-risk flag (High) |
| **Week 27** | Escalate to the Steering Committee: the checkpoint finding, not the Week 25 transition-completion reading, is the program's real current state. | Begin root-cause investigation into which specific decisions are reverting and why. | M21 (Field Notes) — Category: Decision · Title: "Regression Root-Cause Investigation Opened." | ALT-002/015 active | — |

*Phase gate: Full Transition's own completion (Week 25) is not the same as this phase closing — the phase remains open, and the program's sign-off blocked, until the regression identified at the Week 26 checkpoint is resolved.*

#### Phase 6 — Governance Adoption Tracking (Weeks 26–32)

The regression's real root cause and correction — the phase this program's honesty actually depends on.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 26** | — | (checkpoint 1 lands High regression risk — see Phase 5, Week 26) | M12 (Sustainment) — see Phase 5, Week 26. | (see Phase 5, Week 26) | — |
| **Week 27** | Support the root-cause investigation logistics across all three sites. | (investigation opened — see Phase 5, Week 27) | M21 — routine log. | (see Phase 5, Week 27) | — |
| **Week 28** | — | Confirm the root cause: under real operational pressure (a production issue, a customer escalation), people-managers default to the fastest known path — the old site director — rather than the new, less-practiced central function head. | M21 (Field Notes) — Category: Decision · Title: "Root Cause Confirmed: Pressure-Driven Reversion to Old Escalation Habit." | ALT-002/015 active | — |
| **Week 29** | Support rollout of a reinforcement fix: a simple, visible decision-rights reference card for exactly the pressure moments where reversion happened. | Coach site directors specifically to redirect escalations to the new function-head path rather than quietly absorb them. | M21 (Field Notes) — Category: Decision · Title: "Reinforcement Fix Deployed — Decision-Rights Reference Card." | ALT-002/015 active | — |
| **Week 30** | — | Monitor decision-routing for two weeks against the fix. | M10 (Resistance) — n/a; tracked as adoption metric, not resistance. | ALT-002/015 active | Correct-routing rate |
| **Week 31** | — | Confirm correct-routing rate has recovered across all three sites. | M12 (Sustainment) — pre-checkpoint-2 monitoring reading, trending clean. | ALT-002/015 active (pending second checkpoint) | — |
| **Week 32** | Confirm the Phase 6 gate: a second, clean 30-day-equivalent checkpoint. | Log Checkpoint 2: regression-risk flag downgraded to **Low**. Toggle the sustainment sign-off. | M12 (Sustainment) — Checkpoint 2: regression-risk flag **Low**. Sign-off toggle: **set**. | **ALT-002/015 resolved this week** | Regression-risk flag (Low) |

*Phase gate: Governance Adoption Tracking closes only once a second, independent checkpoint confirms the regression is resolved — not on the corrective action being deployed alone.*

#### Phase 7 — Standing Rhythm Handover (Weeks 30–34)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 30** | Begin drafting the standing governance rhythm handover package alongside the final Phase 6 monitoring weeks. | — | M21 — routine log. | (Phase 6 active) | — |
| **Week 31** | Continue drafting the handover package; confirm the monthly meeting's standing agenda template. | — | M21 — routine log. | (Phase 6 active) | — |
| **Week 32** | Finalize the handover package: standing monthly function-head governance meeting, replacing the program's own weekly cadence. | — | M21 — routine log. | (Phase 6 gate also closes this week) | — |
| **Week 33** | Present the handover package to the Steering Committee for final confirmation. | — | M21 — routine log. | — | — |
| **Week 34** | Confirm program close. | Set Lewin to **Refreeze**, justification citing the second, clean checkpoint. | M3 (Initiative Registry) — Lewin: "Refreeze." Justification: "Two consecutive checkpoints confirm the new reporting structure holds under real pressure, not only in the immediate post-transition weeks." | — | Lewin state (confirmed Refreeze) |

*Phase gate: Standing Rhythm Handover — and the program itself — closes once governance ownership transfers to the standing monthly function-head rhythm. Total program length: 34 weeks, one regression detected and resolved, exactly as journi's own scenario library states.*

### 4.2 Master WBS & Gantt — Every Task and Step, PM and CM Tracks, Across the Four Frameworks

| ID | Task / Step Name | Track | Week(s) | Lewin | ADKAR | Bridges | Kübler-Ross |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Interviews; duplication quantified | Joint | 1–5 | Unfreeze | Awareness | Ending | Denial |
| T1.1-S2 | Phase 1 sign-off | PM | 8 | Unfreeze | Awareness | Ending | Denial |
| T2.1-S1 | TOM design workshops | Joint | 6–10 | Unfreeze | Awareness → Desire | Ending | Denial |
| T2.1-S2 | TOM sign-off | PM | 14 | Unfreeze | Desire | Ending → Neutral Zone | Denial → Resistance/Anger |
| T3.1-S1 | Reporting lines and decision rights designed | PM | 12–15 | Unfreeze | Desire → Knowledge | Neutral Zone | Resistance/Anger |
| T3.1-S2 | Detailed org design sign-off | PM | 18 | Unfreeze | Knowledge | Neutral Zone | Resistance/Anger |
| T4.1-S1 | Casablanca Finance pilot executed | CM | 17–19 | Unfreeze | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration |
| T4.1-S2 | Pilot stability confirmed | PM | 22 | Change | Ability | Neutral Zone | Exploration |
| T5.1-S1 | All functions/sites transition | Joint | 21–25 | Change | Ability | Neutral Zone | Exploration |
| T5.1-S2 | Checkpoint 1: regression detected (ALT-002/015) | CM | 26–27 | Change | Ability | Neutral Zone | Exploration → Resistance/Anger (pressure-driven) |
| T6.1-S1 | Root cause confirmed; reinforcement fix deployed | CM | 28–29 | Change | Ability → Reinforcement | Neutral Zone | Resistance/Anger → Exploration |
| T6.1-S2 | Checkpoint 2 clean; sign-off set | Joint | 30–32 | Change | Reinforcement | Neutral Zone → New Beginning | Exploration → Commitment |
| T7.1-S1 | Standing rhythm handover package | PM | 30–32 | Change | Reinforcement | New Beginning | Commitment |
| T7.1-S2 | Refreeze confirmed; program closes | Joint | 34 | **Refreeze** | Reinforcement | New Beginning | Commitment |

*Table 4.2.1 — Master WBS & Gantt, framework view. All 14 Task/Step rows across the full 34-week program.*

### 4.3 Master WBS & Gantt — Every Task and Step, Techniques and Tools

| ID | Task / Step Name | Track | Week(s) | Technique Name | Technique Goal | Technique Details | Recommended Tool |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Interviews; duplication quantified | Joint | 1–5 | Cross-site duplication interview | Borrow and confirm the ERP program's own Build-phase duplication evidence directly from site leaders. | Interview site directors and function heads across all three sites; quantify specific duplicated decisions per site. | Taguette |
| T1.1-S2 | Phase 1 sign-off | PM | 8 | Evidence-based sign-off | Confirm the current-state assessment before design work starts. | Steering Committee review of the quantified duplication findings. | LibreOffice Impress |
| T2.1-S1 | TOM design workshops | Joint | 6–10 | Target operating model design | Define which decisions centralize and which stay site-local, at the conceptual level. | Structured workshops with the Steering Committee, working from the Phase 1 evidence. | Excalidraw |
| T2.1-S2 | TOM sign-off | PM | 14 | Design review and sign-off | Confirm the target operating model before detailed design begins. | Steering Committee sign-off on the conceptual model. | journi M17 — WBS & Gantt |
| T3.1-S1 | Reporting lines and decision rights designed | PM | 12–15 | Decision-rights matrix design | Remove ambiguity about who decides what before transition, not during it. | Name every reporting line and decision right specifically, per function, per site. | BookStack |
| T3.1-S2 | Detailed org design sign-off | PM | 18 | Design review and sign-off | Confirm the detailed design is unambiguous before Pilot Transition. | Steering Committee review; no open decision-rights questions carried into Phase 4. | journi M17 — WBS & Gantt |
| T4.1-S1 | Casablanca Finance pilot executed | CM | 17–19 | Single-function, single-site pilot | Test the new reporting line on one bounded case before the full three-site transition. | Casablanca Finance moves from site-director to central Finance Function Head reporting. | journi M8 — Communications |
| T4.1-S2 | Pilot stability confirmed | PM | 22 | Pilot stability confirmation | Confirm the pilot holds before using it as evidence for the full transition. | Weekly pulse check across the pilot cohort; stability confirmed before Phase 5 begins. | journi M5 — ADKAR Engine |
| T5.1-S1 | All functions/sites transition | Joint | 21–25 | Full-population transition | Extend the new reporting structure to all 95 people-managers across all three sites and functions. | Org-wide announcement; new reporting lines take effect for Operations and Quality alongside Finance. | journi M8 — Communications |
| T5.1-S2 | Checkpoint 1: regression detected | CM | 26–27 | 30-day sustainment checkpoint | Catch a real regression before it's mistaken for a stable new normal. | Log the first sustainment checkpoint per journi's standard cadence; the regression-risk flag is set from real evidence, not assumed clean. | journi M12 — Sustainment |
| T6.1-S1 | Root cause confirmed; fix deployed | CM | 28–29 | Pressure-moment root-cause analysis | Find the specific moments the reversion happens in, not a general resistance explanation. | Trace reversions to real operational-pressure moments (production issues, customer escalations) where the old path was faster and more familiar. | journi M21 — Field Notes |
| T6.1-S2 | Checkpoint 2 clean; sign-off set | Joint | 30–32 | Second independent checkpoint | Confirm the fix holds under real conditions, not just immediately after deployment. | A second, independently-run checkpoint at the same rigor as the first, not a lighter confirmatory check. | journi M12 — Sustainment |
| T7.1-S1 | Standing rhythm handover package | PM | 30–32 | Standing governance rhythm design | Replace the program's own weekly cadence with a sustainable standing rhythm. | Design a monthly function-head governance meeting as the ongoing home for decisions the program's weekly cadence used to hold. | journi M17 — WBS & Gantt |
| T7.1-S2 | Refreeze confirmed; program closes | Joint | 34 | Confirmed Refreeze | Confirm the structure holds under real pressure, not only in the immediate post-transition weeks. | Set Lewin to Refreeze citing both checkpoints, not the Week 25 transition-completion reading alone. | journi M3 — Initiative Registry |

*Table 4.3.1 — Master WBS & Gantt, technique view. Same 14 rows as Table 4.2.1, with the operational detail behind each step.*

### 4.4 Six Exceptions, in Detail

#### E1 — Regression Risk Score Critical / Sustainment Sign-Off Blocked (Phase 5–6, Weeks 26–32)

**Detailed description.** The program's first 30-day sustainment checkpoint found decisions at several sites quietly reverting to the old site-director escalation path under real operational pressure — journi's ALT-002 condition met exactly, with ALT-015 following automatically to block sign-off.

**Trigger.** A sustainment checkpoint logging a High regression-risk flag.

**Timeline impact.** Added six weeks to the program (Phase 6 in full) before sign-off, though it did not delay the Full Transition phase's own Week 25 completion.

**Recovery tasks.** Root-cause the reversion to specific pressure moments (Week 28); deploy a visible decision-rights reference card and coach site directors to redirect rather than absorb escalations (Week 29); confirm correct-routing recovery over two weeks (Weeks 30–31); pass a second, independent checkpoint before setting sign-off (Week 32).

**Outputs.** A downgraded Low regression-risk flag; a set sustainment sign-off; a documented root cause available for future operating-model programs.

**RACSI.** R = CM, SUP · A = CM · C = FPO · S = PM · I = ES, EU

#### E2 — Pilot Success Masks a Site-Specific Risk (Phase 4–5, Weeks 22–25)

**Detailed description.** Casablanca Finance's pilot succeeds cleanly, but Casablanca's own operational pressure profile — steady, predictable finance-cycle deadlines — doesn't resemble Kenitra or Settat's plant-floor pressure profile (production incidents, unpredictable timing), the exact difference that later drives E1's regression at those sites specifically.

**Trigger.** A pilot success reading generalized to Full Transition without checking whether the pilot site's pressure profile represents the others.

**Timeline impact.** Would add one week to Phase 4 for a targeted pressure-profile comparison across all three sites before declaring the pilot sufficient evidence for Full Transition.

**Recovery tasks.** Compare the pilot site's operational pressure pattern against the other two sites explicitly, not assume Casablanca's clean result generalizes; if profiles differ meaningfully, add a site-specific reinforcement plan to Full Transition's own design rather than wait for a checkpoint to find it.

**Outputs.** A documented pressure-profile comparison; site-specific reinforcement plans built into Full Transition rather than discovered after the fact.

**RACSI.** R = CM, PM · A = CM · C = SUP · S = FPO · I = ES, EU

#### E3 — A Function Head Overwhelmed by Centralized Decision Volume (Phase 5, Weeks 23–26)

**Detailed description.** The Finance Function Head, now receiving escalations from all three sites rather than one, cannot process the real decision volume alone — a capacity problem distinct from E1's habit-reversion problem, though both can look similar from the outside (decisions not reaching the new central path).

**Trigger.** Escalation response-time data showing a genuine backlog at the Function Head level, not staff bypassing the new path.

**Timeline impact.** Would add capacity-planning work to Phase 5, typically resolved by adding a deputy or a defined delegation rule rather than reversing the centralization itself.

**Recovery tasks.** Distinguish a capacity problem from a habit problem before applying E1's reinforcement fix, since the two need different responses; add a delegation rule or deputy capacity where volume genuinely exceeds one person's throughput.

**Outputs.** A capacity-adjusted decision-rights matrix; a documented distinction between this pattern and E1's, so future checkpoints correctly diagnose which one they're seeing.

**RACSI.** R = FPO, PM · A = CM · C = ES · S = SUP · I = ITL, EU

#### E4 — A Site Director Continues Deciding Unofficially (Phase 5–6, Weeks 24–30)

**Detailed description.** A site director who lost formal decision authority continues making the same decisions informally — staff still bring them the question out of habit and relationship, and the director, not wanting to seem unhelpful, answers rather than redirecting.

**Trigger.** A pattern where a specific site director's own team shows no adoption lag in surveys but the formal decision log shows no activity either — a gap between reported and actual routing.

**Timeline impact.** Would add a direct one-on-one conversation cycle to Phase 6, similar in shape to E1's response but rooted in the departing authority-holder's own behavior, not staff habit.

**Recovery tasks.** Address the site director directly and specifically — this is a leadership behavior question, not a staff training question; make the new routing structurally easier to follow than the informal one (for example, removing the director from a distribution list that made the informal path effortless).

**Outputs.** A closed informal-routing pattern; a structural change removing the path of least resistance back to the old habit.

**RACSI.** R = CM, ES · A = ES · C = FPO · S = PM · I = SUP, EU

#### E5 — Reporting-Line Systems Lag Behind the Organizational Change (Phase 5, Weeks 23–26)

**Detailed description.** HR and IT systems still show the old site-based reporting lines for several weeks after the organizational change takes effect, creating confusion about who formally approves what in systems that haven't caught up to the new structure.

**Trigger.** A discrepancy between the announced new reporting lines and what HRIS or approval-workflow systems actually reflect.

**Timeline impact.** Would add one to two weeks to Full Transition for a coordinated systems update, ideally planned into Phase 3's design work rather than discovered at go-live.

**Recovery tasks.** Confirm which systems carry reporting-line data as a Phase 3 design task, not a Phase 5 afterthought; coordinate a single cutover date for all systems together rather than let them drift out of sync with each other.

**Outputs.** A systems-cutover checklist added to future operating-model programs' Phase 3 design work; confirmed system-to-reality alignment.

**RACSI.** R = ITL · A = PM · C = CM · S = FPO · I = ES, SUP, EU

#### E6 — A Second, Smaller Regression Signal After Handover (Phase 7, Weeks 34+)

**Detailed description.** A follow-up check three months after Standing Rhythm Handover finds a partial slip at one site — not the full reversion E1 caught, but a specific decision type quietly drifting back, testing whether the standing monthly governance rhythm actually catches what the dedicated program team used to.

**Trigger.** A finding at a post-handover governance meeting that doesn't rise to a formal checkpoint but resembles E1's pattern at a smaller scale.

**Timeline impact.** No impact to this program's own closed timeline, but it is exactly the test of whether Phase 7's handover actually transferred real ownership, not just a document.

**Recovery tasks.** Treat the finding with the same rigor as E1, at the standing governance meeting rather than escalating it back to a since-disbanded program team; confirm the monthly rhythm itself, not the original program's mechanisms, is what catches and fixes it — the real proof the handover worked.

**Outputs.** A confirmed-working standing governance rhythm; a closed partial-regression finding, resolved without reconvening the original program team.

**RACSI.** R = SUP, FPO · A = ES · C = CM · S = PM · I = ITL, EU


## Part 5 — Training Program: Reporting-Line Literacy Across Three Tiers

### 5.1 What This Training Covers

Per the E2E-OM chain, MP-05 is present — this training focuses on the new reporting-line mechanics and decision rights, not on convincing anyone the structure is correct, logged on M9.

### 5.2 Tier 1 — Strategic Management (Weeks 1–14)

**Cohort.** Yassine Berrada (Sponsor).

| Curriculum Entry | Content Focus | Weeks | M9 Entry — What to Log | Completion Target |
|---|---|---|---|---|
| Sponsoring a Reporting-Line Change | Why an operating model redesign needs sustained reinforcement, not a one-time announcement, to actually hold. | 1–6 | Curriculum: "Sponsoring a Reporting-Line Change" · Cohort: "Sponsor." | 100% before Week 8 |
| Reading M12's Regression-Risk Flag | How to read a sustainment checkpoint as real evidence, not a formality — and why a blocked sign-off is the system working, not failing. | 10–14 | Curriculum: "Reading M12's Regression-Risk Flag" · Cohort: "Sponsor." | 100% before Week 21 |

### 5.3 Tier 2 — Operational Management (Weeks 8–22)

**Cohort.** Amina Sqalli (FPO), Loubna Tazi (SUP), and the other two site directors' successors.

| Curriculum Entry | Content Focus | Weeks | M9 Entry — What to Log | Completion Target |
|---|---|---|---|---|
| Operating the New Decision-Rights Matrix | Practical training on exactly which decisions route where under the new structure — the direct prerequisite to avoiding Exception E1's reversion pattern. | 15–18 | Curriculum: "Operating the New Decision-Rights Matrix" · Cohort: "Function Heads, Site Directors." | 100% before Week 19 |
| Redirecting Under Pressure | Specific coaching for the exact moment E1's regression happens — a real operational-pressure escalation — practicing the new routing rather than defaulting to habit. | 19–22 | Curriculum: "Redirecting Under Pressure" · Cohort: "Function Heads, Site Directors." | 100% before Week 23 |

### 5.4 Tier 3 — Operations (Frontline) (Weeks 15–25)

**Cohort.** All 95 people-manager-level staff.

| Curriculum Entry | Content Focus | Weeks | M9 Entry — What to Log | Completion Target |
|---|---|---|---|---|
| Using the New Reporting Structure | Practical training on who to escalate to under the new model, reinforced with the same decision-rights reference card later redeployed in Exception E1's recovery. | 15–24 (per site) | Curriculum: "Using the New Reporting Structure" · Cohort: "Casablanca" / "Kenitra" / "Settat." | 100% within 2 weeks of each site's transition |

### 5.5 Training Completion and the Composite Readiness Index

This program's training-completion term reaches 100% by Week 25 — before the Week 26 checkpoint reveals the regression. This is the clearest illustration in this whole series of Section 2.3's core point: a fully trained population can still regress under real operational pressure, because Knowledge and Ability were never this case's binding constraint — Reinforcement was, and reinforcement is not something a completed curriculum alone provides.
