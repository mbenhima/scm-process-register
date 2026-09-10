journi

Running an Automation (RPA) Program

A Focused Guide to journi's Automation Transformation Archetype

Case: Kenitra Invoice-Matching Automation (Manufacturing — Accounts Payable)

Tenant Setup Through CoE Handover — One Program, Followed Week by Week

Version 1.0 · September 2026 · Confidential


## Part 0 — Purpose and How to Use This Guide

### What this guide is

This guide is a single, focused companion to journi's Automation transformation archetype — the deliberate contrast case in journi's own scenario library: narrow scope, an already-bought-in team, and a Sponsor visibly active from day one. Where the Cultural archetype guide in this series shows journi's longest, most reversibility-fragile transformation, this guide shows the opposite end of the spectrum — a well-scoped, low-resistance program that closes without a single one of journi's 9 live alerts firing. It follows **Kenitra Invoice-Matching Automation** — Bouregreg Manufacturing Maroc's own accounts-payable robotic process automation project — from CM Project creation through Center of Excellence handover, week by week, in the same operational depth a Change Manager would actually need to run it.

It is organized in six parts:

- **Part 0 — Purpose and How to Use This Guide.** This part.
- **Part 1 — Executive Summary.** Why this specific case matters precisely because it is easy — journi's own built-in evidence that not every Change Management Project needs a recovery playbook.
- **Part 2 — The Four Frameworks and What Is Specific to Automation.** journi's four change frameworks, re-weighted for an archetype where Knowledge and Ability move fast and the emotional layer barely registers.
- **Part 3 — Tenant and Admin Setup.** Adding this CM Project to the existing Bouregreg Group tenant, using journi's own manufacturing-sector scenario organization.
- **Part 4 — Week-by-Week Automation Timeline: Normal Flow and Contingencies.** The full 19-week program run forward week by week, Project Manager and Change Manager tracks side by side, with the exact journi entries to type in; then six realistic contingency patterns this archetype could hit, in the same level of detail, with an explicit note that none of them actually occurred in Kenitra's own record; then two Master WBS & Gantt views of the whole program's task and step structure.
- **Part 5 — Training Program: RPA Literacy Across Three Tiers.** The functional training this automation genuinely requires — process owners, the Center of Excellence, and the 18 affected AP staff — logged on M9 (Training).

### How to use it

This guide's Bouregreg Group tenant is the same one journi's Master User Guide builds for its own ERP program, and the same one this series' Cultural archetype guide (One Bouregreg: Post-Acquisition Culture Integration) extends. A reader with either tenant already set up skips straight to Part 3, Section 3.2. Part 4 is written as the day-to-day operating manual for the Change Manager and Program Manager running this program together.

### A note on fidelity

Every journi module, field, and role named in this guide is verified against journi's actual source and the same tenant model journi's Master User Guide uses. Kenitra Invoice-Matching Automation is journi's own stated "clean-close contrast case" (Master User Guide, Part 4): this guide does not manufacture drama where journi's own scenario library deliberately has none, and states that plainly in Part 4 rather than invent a crisis to fill the space.

### A note on the RACSI codes used throughout

Part 4's RACSI tables use journi's separate 7-code RACSI role taxonomy (ES/CM/PM/FPO/ITL/SUP/EU), distinct from the 9-role platform RBAC enum Part 3 uses to create real journi user accounts. **ES** = Executive Sponsor, **CM** = Change Manager, **PM** = Program/Project Manager, **FPO** = Functional Process Owner, **ITL** = IT/Technical Lead, **SUP** = Supervisor, **EU** = End User.

### Reading paths, by role

- **A Change Manager running this program day to day:** Part 2 once for orientation, then Part 4 in full.
- **A Program/Project Manager or ITL focused on the build:** Part 4's PM Track column throughout, and the Master WBS & Gantt (Sections 4.2–4.3).
- **An Executive Sponsor:** Part 1 for why this case matters, then Part 4's phase-opening narratives.
- **A Super Admin or Org Admin setting up the tenant:** Part 3.


## Part 1 — Executive Summary

### 1.1 Why This Case Matters Precisely Because It Is Easy

journi's scenario library needs at least one program that closes clean, or a reader would reasonably conclude that every Change Management Project eventually needs a resistance-escalation response, a divergence fix, or a sustainment recovery. **Kenitra Invoice-Matching Automation** is that program. It is deliberately narrow (18 people, one function, one process), deliberately well-sponsored (an Executive Sponsor visibly active from Week 1, not a Sponsor Coverage Gap to close), and deliberately built on a task with no judgment calls — matching a supplier invoice to a purchase order is either correct or it isn't, which makes it one of the strongest realistic RPA candidates in Bouregreg Group's whole portfolio.

Three facts make this the right contrast case for journi's own alert system:

- **The population is small and homogeneous.** Eighteen accounts-payable staff at one plant, doing one well-understood task, is about as far as a Change Management Project gets from the kind of large, heterogeneous population that produces resistance spread or cohort divergence.
- **The task itself removes the emotional stakes other archetypes carry.** Nobody's job identity, reporting line, or belief system is at stake in whether invoice-matching is automated — only whether a repetitive task disappears from a Tuesday. ADKAR's Desire block, usually the hardest to move, is close to a non-issue here.
- **The Sponsor is active from day one, not appointed under pressure.** Unlike the Cultural archetype's newly appointed integration Sponsor, this program's Sponsor volunteered for it, because it visibly removes a task their own team complained about.

### 1.2 The Case, in Brief

Kenitra's accounts-payable team spends real time every week manually matching supplier invoices to purchase orders — a repetitive, judgment-free task with no upside to doing it by hand. This 19-week program (Weeks 20–38 of Bouregreg Group's own org calendar, running inside the ERP program's own Build/Test window) automates that match with a bounded robotic process, built, shadow-tested, and handed to a Center of Excellence for ongoing ownership — closing, by design, without a single one of journi's 9 live alerts firing.

### 1.3 What This Guide Proves, Concretely

Every claim above is traceable to a real journi record this guide builds: a Sponsor & Coalition record with logged actions from Week 20 onward, not a gap to close; an ADKAR trajectory that clears all five blocks inside seven weeks; and a Composite Readiness Index that never dips, because there is nothing here for it to dip against.


## Part 2 — The Four Frameworks and What Is Specific to Automation

### 2.1 journi's Four Frameworks, in Their Real Stage Vocabulary

| Framework | Altitude | Stages (in journi's own UI, in order) | Logged on |
|---|---|---|---|
| Lewin | Organizational — one reading per project | Unfreeze → Change → Refreeze | M3 (Initiative Registry) |
| Prosci ADKAR | Individual / cohort — five independently-scored blocks | Awareness → Desire → Knowledge → Ability → Reinforcement | M5 (ADKAR Engine) |
| Bridges' Transition Model | Individual / cohort — emotional position | Ending → Neutral Zone → New Beginning | M6 (Emotional & Transition Layer) |
| Kübler-Ross Change Curve | Individual / cohort — sentiment | Denial → Resistance/Anger → Exploration → Commitment | M6 (Emotional & Transition Layer) |

None of the four is auto-computed. All four remain a Change Manager's evidence-based judgment call, logged with a written justification under Bouregreg Group's Governance Setting.

### 2.2 Why the Weighting Is Different for Automation

- **ADKAR moves fast and evenly.** With no genuine loss and a Sponsor visibly in favor, Awareness and Desire clear inside the first two or three weeks. Knowledge and Ability — the blocks that usually dominate a technology rollout — are the ones this program actually has to earn, since staff do need to learn the new exception-handling workflow around the bot.
- **Bridges and Kübler-Ross barely move.** There is no real Ending here — nobody's role disappears, only a task within it. Most of the 18 AP staff read Neutral Zone almost immediately and stay there; sentiment tracks closer to mild Exploration than any real Denial or Resistance stage.
- **MP-05 (Training & Capability Enablement) is fully present, unlike the Cultural archetype.** Automation's E2E-BPA chain (MP-01→02→03→05→07→08→09→10) uses training directly — Part 5 covers it, and unlike the Cultural archetype guide's parallel-track training, this program's training is part of the core chain itself.

### 2.3 The Composite Readiness Index and Benchmarking, Read for This Case

M14's blended score (ADKAR 50% / Kübler-Ross sentiment 25% / training completion 25%) was built for exactly this kind of program, and this guide's own Composite Readiness Index reading (Section 4.1) moves smoothly upward with no dip worth narrating — the honest, if less dramatic, reading this program's real evidence supports. Benchmarking reads "In Line" or "Ahead" throughout; this guide does not manufacture a "Behind" reading to give Benchmarking something to recover from.


## Part 3 — Tenant and Admin Setup

### 3.1 The Existing Tenant: Bouregreg Group

This program runs inside the same tenant journi's Master User Guide builds for the Bouregreg ERP Adoption Program, under the existing Bouregreg Manufacturing Maroc Organization (Manufacturing sector, 3,400 employees, sites including Kenitra Plant). No new Organization is needed — unlike the Cultural archetype guide's Tangier acquisition, Kenitra's accounts-payable function already sits inside the existing Organization. A reader without this tenant yet follows journi's Master User Guide, Part 1, before continuing here.

### 3.2 Step 1 — Onboarding the Automation Team (M2)

| Name | journi Role (RBAC) | Scope type | Scope | RACSI Code | Notes |
|---|---|---|---|---|---|
| Hakim Berrada | Sponsor | Project | Kenitra Invoice-Matching Automation *(created in Step 2)* | ES | Kenitra Plant Controller; volunteered as Sponsor |
| Salma Ouazzani | Change Manager | Project | Kenitra Invoice-Matching Automation | CM | Owns day-to-day program execution |
| Amine Sqalli | Practitioner / Contributor | Project | Kenitra Invoice-Matching Automation | PM | RPA build and technical delivery lead |
| Yassine Kabbaj | Practitioner / Contributor | Project | Kenitra Invoice-Matching Automation | ITL | Systems integration, bot deployment |
| Nawal Fassi | People Manager | Project | Kenitra Invoice-Matching Automation | FPO, SUP | Kenitra AP team lead; both functional owner and on-site supervisor given the team's small size |

### 3.3 Step 2 — Creating the Kenitra Invoice-Matching Automation CM Project (M1)

1. On the Bouregreg Manufacturing Maroc Organization card, click **+ CM Project**. Fill in:
   - Name: "Kenitra Invoice-Matching Automation"
   - Linked Main Project: **none** — this program's technical build is small and self-contained enough to run entirely inside this CM Project's own PM track, unlike the ERP program's dedicated Main Project.
   - Owner: "Salma Ouazzani"
   - Change type: **Automation**
   - Target population: "Kenitra Accounts Payable (18)"
   - Business driver: "Manual invoice-to-purchase-order matching is a repetitive, judgment-free task with no upside performed by hand — a strong RPA candidate with minimal disruption risk to the wider AP function."
2. Save. Lewin opens at **Unfreeze**, justification: "Opening Unfreeze at program start, Week 20. Sponsor active from day one; no diagnosis-phase resistance expected given the task's low judgment content."
3. On **Module 17 — WBS & Gantt**, load the **TPL-BPA-7** phase template (Automation-Opportunity Assessment → Architecture Design → Build → UAT & Shadow-Mode → Production Go-Live → Exception Tuning → CoE Handover).

### 3.4 Step 3 — Governance (M2)

Permission Matrix and the Governance Setting ("Require justification for score/state changes") stay unchanged tenant-wide from the base ERP setup — this program adds no new governance configuration.

### 3.5 Step 4 — Charters for This Program (M19)

| Charter | Accountable (this program) | Review cadence |
|---|---|---|
| CHTR-01 Sponsorship / Leadership Charter | Hakim Berrada (ES) | Per Phase Gate |
| CHTR-03 Communication Charter | Salma Ouazzani (CM) | Per communication wave |
| CHTR-04 Organizational Impact Charter | Salma Ouazzani (CM) | On scope change |
| CHTR-08 Pulse / Interview Charter | Salma Ouazzani (CM) | Per phase gate + ad hoc |

The remaining four charters (CHTR-02, CHTR-05, CHTR-06, CHTR-07) stay dormant for this program — its scope is too narrow and its population too small to justify a participative-management charter, dedicated coaching charters, or a mentoring program; this guide states that plainly rather than force charters onto a program too small to need them.

### 3.6 Setup Checklist

- [ ] Base tenant confirmed (Bouregreg Group, Bouregreg Manufacturing Maroc Organization)
- [ ] Automation team accounts created with correct RBAC role, scope, and RACSI code — Section 3.2
- [ ] Kenitra Invoice-Matching Automation CM Project created, Lewin opened at Unfreeze — Section 3.3
- [ ] TPL-BPA-7 phase template loaded on M17 — Section 3.3
- [ ] Four applicable Charters reviewed and accountable owners confirmed — Section 3.5

With this checklist complete, Bouregreg Group's tenant holds a live Automation archetype Change Management Project. Part 4 runs it forward, week by week, from here.


## Part 4 — Week-by-Week Automation Timeline: Normal Flow and Contingencies

Part 3 ended with Kenitra Invoice-Matching Automation registered and its Lewin phase opened at Unfreeze, program Week 1. This Part runs that program forward for its full 19-week duration, against journi's TPL-BPA-7 template. Program Week 1 corresponds to Bouregreg Group's own org-calendar Week 20 — inside the ERP program's own Build/Test window — so add 19 to convert a program week to its org-calendar equivalent.

### 4.1 Normal Flow, Phase by Phase

#### Phase 1 — Automation-Opportunity Assessment (Weeks 1–4)

Confirms Kenitra invoice-matching actually meets RPA's real suitability criteria — repetitive, rules-based, high-volume, low exception rate — before any design work starts, so the program isn't automating a process that turns out to need judgment after all.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 1** | Amine Sqalli holds program kickoff; confirms Hakim Berrada's active sponsorship and the AP team's availability for the assessment. | Salma Ouazzani runs the baseline ADKAR pulse for Kenitra AP (18 staff) — expected high from the start, given the task's low judgment content. | M5 (ADKAR Engine) — Awareness 4, Desire 4 (baseline, both already high). | — | Baseline ADKAR scores |
| **Week 2** | Run a time-and-motion study quantifying hours spent on manual invoice-to-PO matching. | Log Hakim Berrada's first visible sponsor action — already active, unlike a program that opens with a coverage gap to close. | M7 (Sponsor & Coalition) — first action logged, Week 2: "Attended AP team briefing, personally explained the automation's purpose." | — | Sponsor first-action timing (Week 2, no gap) |
| **Week 3** | Confirm RPA suitability against journi's own criteria: repetitive, rules-based, high-volume, low exception rate. | Map the Kenitra AP cohort on the Stakeholder Map. | M4 (Stakeholder Mapping) — "Kenitra Accounts Payable" (dimension: Process, severity: Low — deliberately low, given the task's minimal disruption risk). | — | — |
| **Week 4** | Confirm the Phase 1 gate: opportunity assessment signed off. | Hakim Berrada signs CHTR-01 with a specific commitment: personally introducing the bot's exception-handling workflow at the next AP team meeting. | M19 (CM Charters) — CHTR-01 status Active, one named commitment logged. | — | — |

*Phase gate: Automation-Opportunity Assessment closes once RPA suitability is confirmed against journi's own criteria and the Sponsor has a logged commitment, not just a title.*

#### Phase 2 — Architecture Design (Weeks 4–9)

Designs the bot's matching rules, exception thresholds, and integration points — and, just as importantly, drafts the exception-handling workflow the 18 AP staff will actually need to learn, since that workflow (not the bot itself) is where their real Knowledge and Ability gap sits.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 4** | Begin bot architecture design: matching rules, exception thresholds, integration points. | Draft the exception-handling workflow documentation AP staff will use once the bot is live. | M21 (Field Notes) — Category: Decision · Title: "Bot Architecture Design Begun." | (Phase 1 gate also closes this week) | — |
| **Week 5** | Continue matching-rule design; confirm the exception threshold (any invoice-PO variance above a defined tolerance routes to a human). | Share the draft exception-handling workflow with Nawal Fassi for AP-team review. | M21 (Field Notes) — Category: Other · Title: "Exception Threshold Confirmed with AP Team." | — | — |
| **Week 6** | Design the bot's integration points with the legacy invoice and purchase-order systems. | — | M21 — routine log. | — | — |
| **Week 7** | Review the full architecture with Yassine Kabbaj and IT. | — | M21 — routine log. | — | — |
| **Week 8** | Finalize the architecture document ahead of sign-off. | Re-score ADKAR — Awareness and Desire holding at 4; Knowledge beginning to build as staff review the exception-workflow draft. | M5 (ADKAR Engine) — Awareness 4, Desire 4, Knowledge 3. | — | Knowledge score trend |
| **Week 9** | Confirm the Phase 2 gate: architecture signed off. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Architecture Design closes once the matching rules, exception thresholds, and integration points are signed off, and the exception-handling workflow AP staff will use has already been reviewed with them — not written in isolation and handed over later.*

#### Phase 3 — Build (Weeks 9–12)

The bot itself gets built and tested internally against historical invoice data, before any AP staff interact with it directly.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 9** | Yassine Kabbaj begins bot development against the signed-off architecture. | — | M17 (WBS & Gantt) — task status updated to "In Progress." | (Phase 2 gate also closes this week) | — |
| **Week 10** | Continue bot development. | — | M21 — routine log. | — | — |
| **Week 11** | Internal testing against six months of historical invoice data; log match-accuracy results. | — | M21 (Field Notes) — Category: Other · Title: "Internal Test — 97% Match Accuracy Against Historical Data." | — | Internal test match-accuracy rate |
| **Week 12** | Confirm build complete, ready for UAT. | Prepare the UAT/shadow-mode plan with the AP team. | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Build closes once the bot clears internal testing against historical data at a defined accuracy threshold.*

#### Phase 4 — UAT & Shadow-Mode (Weeks 12–14)

The bot runs alongside the manual process for two weeks — its real first contact with the 18 AP staff, who verify its outputs daily rather than trusting it blind.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 12** | Launch UAT: bot runs alongside the manual process; AP staff verify bot output against their own manual match each day. | Re-score ADKAR as staff work directly with the bot's output for the first time. | M5 (ADKAR Engine) — Knowledge 4, Ability 3. | — | — |
| **Week 13** | Continue shadow-mode; log any discrepancy between bot output and manual match. | Confirm the resistance log stays empty — no entries logged, by design. | M10 (Resistance) — no entries. Field Note: "Zero resistance entries through Week 13 of shadow-mode, consistent with this program's low-disruption profile." | — | Resistance-entry count (0) |
| **Week 14** | Confirm shadow-mode results: bot output matched manual output on 99% of invoices, all discrepancies explainable. | Final pre-go-live ADKAR re-score — Ability now 4. | M5 (ADKAR Engine) — Ability 4. | — | Shadow-mode accuracy rate |

*Phase gate: UAT & Shadow-Mode closes once two full weeks of shadow-mode confirm the bot's output reliably matches the manual process.*

#### Phase 5 — Production Go-Live (Weeks 14–16)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 14** | Confirm go-live readiness against the shadow-mode results. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | (Phase 4 gate also closes this week) | — |
| **Week 15** | Finalize go-live communications and cutover timing with the AP team. | Prepare Lewin transition to Change, effective go-live. | M8 (Communications) — Message: "Invoice-matching bot goes live Monday — manual process retired for standard-format invoices." | — | — |
| **Week 16** | Production go-live: the bot takes over invoice matching for real. | Set Lewin to **Change**. | M3 (Initiative Registry) — Lewin: "Change." Justification: "Production go-live, Week 16; shadow-mode results support the transition." | — | — |

*Phase gate: Production Go-Live closes once the bot is live and handling real invoices, with the manual process formally retired for standard-format cases.*

#### Phase 6 — Exception Tuning (Weeks 16–18)

Real production volume surfaces edge cases shadow-mode's smaller sample didn't — normal for any new automation, and this phase exists specifically to absorb it.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 16** | Monitor bot performance in production; log any edge case the exception rules don't yet handle cleanly. | — | M21 (Field Notes) — Category: Other · Title: "Production Edge Cases Logged for Tuning." | — | Exception rate (production) |
| **Week 17** | Tune the exception-handling rules based on real production edge cases. | — | M21 — routine log. | — | — |
| **Week 18** | Confirm the exception rate has stabilized below the defined threshold. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Exception rate vs. threshold |

*Phase gate: Exception Tuning closes once the production exception rate stabilizes below the threshold set in Phase 2.*

#### Phase 7 — CoE Handover (Weeks 18–19)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 18** | Prepare the Center of Excellence handover package — bot ownership, monitoring dashboard, and escalation path. | — | M12 (Sustainment) — log the first sustainment checkpoint. | (Phase 6 gate also closes this week) | — |
| **Week 19** | Confirm program close — bot ownership formally transferred to the Center of Excellence. | Set Lewin to **Refreeze**; toggle the sustainment sign-off. | M3 (Initiative Registry) — Lewin: "Refreeze." M12 (Sustainment) — sign-off toggle: **set**. | — | Sustainment sign-off (toggled) |

*Phase gate: CoE Handover — and the program itself — closes once bot ownership is formally with the Center of Excellence and the sustainment sign-off is set. Total program length: 19 weeks, no live alert fired.*

### 4.2 Master WBS & Gantt — Every Task and Step, PM and CM Tracks, Across the Four Frameworks

| ID | Task / Step Name | Track | Week(s) | Lewin | ADKAR | Bridges | Kübler-Ross |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Kickoff and baseline ADKAR pulse | Joint | 1 | Unfreeze | Awareness | Neutral Zone | Exploration |
| T1.1-S2 | RPA suitability confirmed; CHTR-01 signed | CM | 2–4 | Unfreeze | Awareness → Desire | Neutral Zone | Exploration |
| T2.1-S1 | Bot architecture and integration design | PM | 4–7 | Unfreeze | Desire | Neutral Zone | Exploration |
| T2.1-S2 | Exception-handling workflow drafted and reviewed | CM | 5–9 | Unfreeze | Desire → Knowledge | Neutral Zone | Exploration |
| T3.1-S1 | Bot development | PM | 9–11 | Unfreeze | Knowledge | Neutral Zone | Exploration |
| T3.1-S2 | Internal testing vs. historical data (97% accuracy) | PM | 11–12 | Unfreeze | Knowledge | Neutral Zone | Exploration |
| T4.1-S1 | UAT / shadow-mode launched | Joint | 12–13 | Unfreeze → Change | Knowledge → Ability | Neutral Zone | Exploration |
| T4.1-S2 | Shadow-mode results confirmed (99% match) | CM | 14 | Change | Ability | Neutral Zone | Exploration |
| T5.1-S1 | Go-live readiness and communications | Joint | 14–15 | Change | Ability | Neutral Zone | Exploration |
| T5.1-S2 | Production go-live | CM | 16 | Change | Ability → Reinforcement | Neutral Zone | Exploration → Commitment |
| T6.1-S1 | Production edge cases logged | PM | 16–17 | Change | Reinforcement | Neutral Zone | Commitment |
| T6.1-S2 | Exception rate stabilized below threshold | PM | 18 | Change | Reinforcement | Neutral Zone | Commitment |
| T7.1-S1 | CoE handover package prepared | PM | 18 | Change | Reinforcement | New Beginning | Commitment |
| T7.1-S2 | Sustainment sign-off; Lewin confirmed Refreeze | Joint | 19 | **Refreeze** | Reinforcement | New Beginning | Commitment |

*Table 4.2.1 — Master WBS & Gantt, framework view. All 14 Task/Step rows across the full 19-week program.*

### 4.3 Master WBS & Gantt — Every Task and Step, Techniques and Tools

| ID | Task / Step Name | Track | Week(s) | Technique Name | Technique Goal | Technique Details | Recommended Tool |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Kickoff and baseline ADKAR | Joint | 1 | Baseline readiness pulse | Establish a starting ADKAR reading before any design work. | Short survey to all 18 AP staff; expect high Awareness/Desire given low task judgment content. | LimeSurvey |
| T1.1-S2 | RPA suitability confirmed | CM | 2–4 | Suitability criteria checklist | Confirm the task genuinely fits RPA before committing design effort. | Score against: repetitive, rules-based, high-volume, low exception rate; time-and-motion study quantifies current manual hours. | LibreOffice Calc |
| T2.1-S1 | Bot architecture design | PM | 4–7 | Rules-based architecture design | Define the bot's matching rules, exception thresholds, and system integration points. | Design session with IT covering legacy invoice/PO system connection points and the variance-tolerance rule. | BookStack |
| T2.1-S2 | Exception-handling workflow drafted | CM | 5–9 | Staff-facing workflow documentation | Give AP staff a clear, reviewed procedure for what happens when the bot flags an exception. | Draft the workflow, review it directly with the AP team lead before architecture sign-off, not after. | BookStack |
| T3.1-S1 | Bot development | PM | 9–11 | Iterative bot build | Build the bot against the signed-off architecture. | Standard RPA development cycle; status tracked on the WBS against baseline dates. | journi M17 — WBS & Gantt |
| T3.1-S2 | Internal testing | PM | 11–12 | Historical-data regression test | Validate match accuracy against real historical invoices before any live staff exposure. | Six months of historical invoice/PO data run through the bot; accuracy logged. | Metabase |
| T4.1-S1 | UAT / shadow-mode launch | Joint | 12–13 | Parallel shadow-mode run | Let staff verify the bot's real output against their own manual match, daily. | Bot runs alongside the manual process; AP staff check every match for two weeks before go-live. | journi M5 — ADKAR Engine |
| T4.1-S2 | Shadow-mode results confirmed | CM | 14 | Shadow-mode accuracy review | Confirm the bot is ready for production based on real parallel-run evidence. | Review the two-week discrepancy log; confirm all discrepancies are explainable, not systemic. | Metabase |
| T5.1-S1 | Go-live readiness and comms | Joint | 14–15 | Go-live communication | Tell the AP team plainly when the manual process stops and the bot takes over. | Single, clear communication naming the cutover date. | journi M8 — Communications |
| T5.1-S2 | Production go-live | CM | 16 | Lewin state transition | Move the organizational reading from Unfreeze to Change at the real cutover point. | Set Lewin to Change with a justification citing the shadow-mode evidence, not the calendar date alone. | journi M3 — Initiative Registry |
| T6.1-S1 | Production edge cases logged | PM | 16–17 | Production exception logging | Capture real edge cases shadow-mode's smaller sample didn't surface. | Log each production exception with its specific cause. | journi M21 — Field Notes |
| T6.1-S2 | Exception rate stabilized | PM | 18 | Threshold confirmation | Confirm tuning has brought the exception rate below the Phase 2 threshold. | Compare current exception rate against the threshold set during architecture design. | Metabase |
| T7.1-S1 | CoE handover package | PM | 18 | Standing ownership handover | Transfer bot ownership to a permanent owner before the program team stands down. | Package includes the monitoring dashboard, escalation path, and named CoE owner. | journi M12 — Sustainment |
| T7.1-S2 | Sustainment sign-off | Joint | 19 | Sustainment sign-off | Formally close the program once evidence supports it. | Toggle the M12 sign-off; set Lewin to Refreeze. | journi M12 / M3 |

*Table 4.3.1 — Master WBS & Gantt, technique view. Same 14 rows as Table 4.2.1, with the operational detail behind each step.*

### 4.4 Six Contingency Patterns, in Detail

None of the six patterns below actually occurred in Kenitra Invoice-Matching Automation's own record — Section 4.1 and journi's own scenario library are explicit that this program closed clean, with zero live alerts fired. What follows is a contingency playbook: six realistic ways an automation program of this type *could* go off track, written in the same operational detail as this series' other guides, so a Change Manager running a similar program has a real recovery plan ready rather than discovering the need for one mid-crisis. Each pattern names where in this program's own timeline it would most plausibly have appeared, had it happened.

#### C1 — Hidden Exception Volume Underestimated (would map to Phase 3, Weeks 9–12)

**Detailed description.** The Phase 1 suitability assessment concludes the task is low-exception; internal testing then reveals the real exception rate is meaningfully higher than assumed, because the historical data sample under-represented a seasonal invoice pattern (for example, year-end bulk supplier invoices with irregular formatting).

**Trigger.** Internal test exception rate exceeds the threshold set during architecture design.

**Timeline impact.** Would delay the Phase 3 gate by one to two weeks while the exception-handling rules are redesigned for the newly discovered pattern, and would likely push UAT's shadow-mode window from two weeks to three, to capture the seasonal case directly.

**Recovery tasks.** Re-run the historical-data sample across a full 12-month cycle rather than six months; redesign the exception rules for the newly found pattern; extend shadow-mode to directly observe the seasonal case if the redesign can't be validated from historical data alone.

**Outputs.** A revised exception-rate threshold; an updated architecture document; a documented reason for the extended shadow-mode window.

**RACSI.** R = PM, ITL · A = CM · C = FPO · S = ES · I = SUP, EU

#### C2 — Shadow-Mode Discrepancy Traced to a Data Quality Issue, Not the Bot (would map to Phase 4, Weeks 12–14)

**Detailed description.** A shadow-mode discrepancy initially looks like a bot logic error; investigation instead finds the discrepancy traces to inconsistent supplier-name formatting in the source purchase-order system — a data quality issue the bot correctly flagged, not a bot defect.

**Trigger.** A shadow-mode discrepancy rate above the expected noise floor.

**Timeline impact.** No phase-gate delay if resolved within shadow-mode's existing window, but it would consume investigation time that would otherwise go toward confirming a clean result early.

**Recovery tasks.** Root-cause each discrepancy before assuming bot error; where the cause is upstream data quality, log it as a data-quality finding, not a bot defect, and route it to the system-of-record owner rather than the automation team.

**Outputs.** A discrepancy log correctly attributing cause; a data-quality finding routed to its actual owner.

**RACSI.** R = ITL · A = CM · C = FPO · S = PM · I = ES, SUP

#### C3 — A Single Vocal Staff Member Resists Despite Overall Buy-In (would map to Phase 2–4, Weeks 4–14)

**Detailed description.** One of the 18 AP staff — often the person who has done the manual match longest and takes the most pride in their accuracy — resists the automation individually, even though the rest of the team and the Sponsor are genuinely supportive. Unlike the Cultural archetype's population-wide patterns, this is a single-person case that a program this small could plausibly still hit.

**Trigger.** A single resistance entry from one staff member, with no similar entries from the rest of the cohort.

**Timeline impact.** None to the program timeline if handled directly and early; risks becoming a Phase 5 go-live morale issue if left unaddressed.

**Recovery tasks.** A direct, individual conversation — not a team-wide response to what is genuinely an individual concern; consider offering the individual a role in UAT verification specifically, converting their expertise into a program asset rather than leaving it as a source of resistance.

**Outputs.** A closed, individually-resolved resistance entry; where used, a logged UAT verification role for the individual.

**RACSI.** R = CM, FPO · A = CM · C = ES · S = SUP · I = PM, EU

#### C4 — IT Change-Freeze Delays Integration (would map to Phase 3, Weeks 9–12)

**Detailed description.** Bouregreg Group's IT function declares a change freeze — commonly tied to a fiscal period close or an unrelated system event — that blocks the bot's integration work during the Build phase.

**Trigger.** An IT-declared change freeze overlapping the Build phase's planned integration window.

**Timeline impact.** A direct delay equal to the freeze's duration, typically one to three weeks, pushed straight through to the UAT and go-live dates rather than absorbed elsewhere, since Build's integration work has no slack to compress.

**Recovery tasks.** Confirm the freeze's exact end date early; resequence non-integration Build tasks (internal logic testing against historical data) to run during the freeze so the delay isn't pure dead time; communicate the revised go-live date to the Sponsor and AP team as soon as the freeze is confirmed, not after it lifts.

**Outputs.** A revised WBS schedule reflecting the freeze; non-integration work completed during the freeze window; an updated go-live communication.

**RACSI.** R = PM, ITL · A = PM · C = CM · S = ES · I = FPO, SUP, EU

#### C5 — Platform Licensing or Technical Limitation Discovered Mid-Build (would map to Phase 3, Weeks 9–12)

**Detailed description.** The RPA platform's licensing terms or a technical limitation (for example, a rate limit on the legacy system's API) is discovered mid-Build to constrain the bot's design in a way the Architecture Design phase didn't anticipate.

**Trigger.** A platform constraint discovered during active development that the signed-off architecture didn't account for.

**Timeline impact.** Would reopen part of the Architecture Design phase gate, typically adding one to two weeks while the design is adjusted within the newly discovered constraint.

**Recovery tasks.** Confirm the exact nature and scope of the constraint; redesign only the affected portion of the architecture rather than the whole document; re-confirm the revised design with IT before resuming Build.

**Outputs.** A documented constraint and its resolution; a revised (not fully rewritten) architecture document; a reopened-and-reclosed Phase 2 gate entry on the WBS.

**RACSI.** R = ITL · A = PM · C = CM · S = FPO · I = ES, SUP, EU

#### C6 — Post-Go-Live Complacency: CoE Ownership Never Really Transfers (would map to Phase 7, Weeks 18–19)

**Detailed description.** The Center of Excellence handover happens on paper — the package is delivered, the sign-off is toggled — but the bot's actual day-to-day monitoring quietly stays with Yassine Kabbaj rather than genuinely transferring, because the CoE was never given real capacity for it. Six months later, a bot failure goes unnoticed for days because no one was actually watching.

**Trigger.** A sustainment checkpoint (M12) shows the named CoE owner has logged no monitoring activity since handover.

**Timeline impact.** No impact to this program's own 19-week timeline, since it manifests after formal close — but it is exactly the kind of finding a post-handover checkpoint (following this series' own precedent from the Cultural archetype guide) exists to catch.

**Recovery tasks.** Confirm the CoE genuinely has assigned capacity for this bot, not just nominal ownership; if it does not, escalate to the CoE's own management for a real capacity commitment rather than let ownership stay silently with the original build team.

**Outputs.** A confirmed, capacity-backed CoE ownership; a scheduled post-handover checkpoint (30/90 days) to verify it holds.

**RACSI.** R = FPO · A = ES · C = PM, ITL · S = CM · I = SUP, EU


## Part 5 — Training Program: RPA Literacy Across Three Tiers

### 5.1 Why Training Looks Different Here Than in the Cultural Archetype Guide

Unlike the Cultural archetype, where MP-05 (Training & Capability Enablement) is absent from the process chain entirely, journi's E2E-BPA chain (MP-01→02→03→05→07→08→09→10) uses MP-05 directly — training is not a parallel track bolted onto this program, it is part of the registered chain itself. What follows is that training, logged on M9, timed against the same phases Section 4.1 already walks through.

### 5.2 Tier 1 — Strategic Management (Weeks 1–3)

**Cohort.** Hakim Berrada (Sponsor).

| Curriculum Entry | Content Focus | Weeks | M9 Entry — What to Log | Completion Target |
|---|---|---|---|---|
| Sponsoring an RPA Program | What active, credible sponsorship looks like for a small, technical automation program — distinct from a large system rollout's sponsorship demands. | 1–2 | Curriculum: "Sponsoring an RPA Program" · Cohort: "Sponsor." | 100% before Week 3 |
| Reading journi's Automation Readiness Dashboards | How to read M14's Composite Readiness Index and M10's resistance log for a program this size, without over-interpreting a small population's normal statistical noise. | 2–3 | Curriculum: "Reading journi's Automation Readiness Dashboards" · Cohort: "Sponsor." | 100% before Week 4 |

### 5.3 Tier 2 — Operational Management (Weeks 3–6)

**Cohort.** Nawal Fassi (AP team lead, FPO/SUP).

| Curriculum Entry | Content Focus | Weeks | M9 Entry — What to Log | Completion Target |
|---|---|---|---|---|
| Managing a Team Through Automation | Practical supervisory skills for a team whose task is being automated — distinct from a layoff conversation, since no roles are eliminated here, only a repetitive task. | 3–4 | Curriculum: "Managing a Team Through Automation" · Cohort: "AP Team Lead." | 100% before Week 5 |
| Exception-Escalation Ownership | Practical ownership of the new exception-handling workflow once the bot is live — who decides, who escalates, and when. | 5–6 | Curriculum: "Exception-Escalation Ownership" · Cohort: "AP Team Lead." | 100% before Week 9 |

### 5.4 Tier 3 — Operations (Frontline) (Weeks 5–13)

**Cohort.** All 18 Kenitra AP staff.

| Curriculum Entry | Content Focus | Weeks | M9 Entry — What to Log | Completion Target |
|---|---|---|---|---|
| Using the New Exception-Handling Workflow | Practical training on the workflow drafted in Phase 2 — what to do when the bot flags an invoice, not abstract process theory. | 5–9 | Curriculum: "Using the New Exception-Handling Workflow" · Cohort: "Kenitra AP (18)." | 100% before Week 12 |
| Verifying Bot Output During Shadow-Mode | Hands-on training for the specific daily verification task shadow-mode requires (Section 4.1, Phase 4). | 12–13 | Curriculum: "Verifying Bot Output During Shadow-Mode" · Cohort: "Kenitra AP (18)." | 100% before shadow-mode begins, Week 12 |

### 5.5 Training Completion and the Composite Readiness Index

Because this archetype's chain uses MP-05 directly, M14's training-completion term reflects real numbers from early in the program, unlike the Cultural archetype's guide, where it stays near zero until a parallel track is introduced. Given the small, well-defined curricula above, this program's training-completion term is expected to reach 100% well before go-live (Week 16) — consistent with, and one of the concrete reasons behind, this program's clean-close, zero-alert profile.
