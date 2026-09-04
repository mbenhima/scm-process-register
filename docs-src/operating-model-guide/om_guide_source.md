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
