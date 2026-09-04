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
