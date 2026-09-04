journi

Running a Business Process Redesign Program

A Focused Guide to journi's BPR Transformation Archetype

Case: Order-to-Cash Process Redesign (Manufacturing — Casablanca Finance)

Tenant Setup Through Sustainment — One Program, Followed Week by Week

Version 1.0 · September 2026 · Confidential


## Part 0 — Purpose and How to Use This Guide

### What this guide is

This guide is a single, focused companion to journi's Business Process Redesign (BPR) archetype, following **Order-to-Cash Process Redesign** — Bouregreg Manufacturing Maroc's own redesign of a manual, workaround-riddled finance process — from CM Project creation through sustainment, week by week. Unlike the Automation archetype guide in this series, this case is built by journi's own scenario library to cross the resistance-escalation threshold: the finance staff who built and privately own today's manual workarounds resist a redesign that makes those workarounds obsolete, by design.

It is organized in six parts: Part 0 (this part), Part 1 (Executive Summary), Part 2 (The Four Frameworks and What Is Specific to BPR), Part 3 (Tenant and Admin Setup), Part 4 (Week-by-Week BPR Timeline: Normal Flow and Exceptions, including two Master WBS & Gantt views), and Part 5 (Training Program).

### How to use it

This guide's Bouregreg Group tenant is the same one journi's Master User Guide builds, and the same one this series' other archetype guides extend. A reader with the tenant already set up skips to Part 3, Section 3.2.

### A note on fidelity

Every journi module, field, and role named in this guide is verified against journi's actual source. Order-to-Cash Process Redesign is journi's own stated case for **ALT-004 (Resistance Escalation Threshold Breached)** — this guide builds toward that alert firing exactly once three or more open resistance entries accumulate, per journi's own threshold logic, not before.

### A note on the RACSI codes used throughout

Part 4's RACSI tables use journi's 7-code RACSI role taxonomy (ES/CM/PM/FPO/ITL/SUP/EU), distinct from the 9-role platform RBAC enum Part 3 uses for journi user accounts. **ES** = Executive Sponsor, **CM** = Change Manager, **PM** = Program/Project Manager, **FPO** = Functional Process Owner, **ITL** = IT/Technical Lead, **SUP** = Supervisor, **EU** = End User.

### Reading paths, by role

- **A Change Manager running this program day to day:** Part 2 once, then Part 4 in full.
- **A Program/Project Manager:** Part 4's PM Track column and the Master WBS & Gantt (Sections 4.2–4.3).
- **An Executive Sponsor:** Part 1, then Part 4's phase-opening narratives.
- **A Super Admin or Org Admin:** Part 3.


## Part 1 — Executive Summary

### 1.1 Why This Case Matters: Resistance With a Real, Rational Cause

Order-to-Cash Process Redesign is journi's own case for a resistance pattern that is not irrational or merely emotional: Casablanca finance staff built the manual workarounds this redesign eliminates, over years, to cope with a process design that costs the function three weeks of reconciliation work every month. Redesigning the process makes those workarounds — and the specific expertise built around them — obsolete. That is a real, rational stake, and this guide treats it as one rather than reducing it to generic change fatigue.

Three facts drive this case's specific shape:

- **The business driver is quantified and self-inflicted.** Three weeks of month-end reconciliation work per cycle traces directly to the process's own design, not to external tooling limits — a business case with no ambiguity about whether the problem is real.
- **Resistance here is expertise defending itself.** The staff most likely to resist are the same staff whose workaround expertise makes them most valuable today — a direct tension this guide's Phase 2 design work has to resolve, not paper over.
- **The threshold is real, not decorative.** journi's ALT-004 (Resistance Escalation Threshold Breached) fires once three or more open resistance entries accumulate — this program's own record crosses that exact threshold during its pilot phase, and this guide shows the real escalation and response, not a hypothetical one.

### 1.2 The Case, in Brief

Casablanca HQ's finance function has run order-to-cash manually since before Bouregreg Group's ERP program began. This 50-week program (Weeks 3–52 of Bouregreg Group's own org calendar, opening alongside the ERP program's own Discovery phase) redesigns the process itself — independent of any system change — for the 140-person Casablanca finance population, crossing the resistance-escalation threshold once during its pilot and recovering from it using journi's own mitigation mechanism.

### 1.3 What This Guide Proves, Concretely

Every claim above is traceable to a real journi record this guide builds: a quantified, three-workaround business case; a resistance log that crosses three open entries at a specific, named point in the pilot; and a documented mitigation response that closes those entries before rollout.


## Part 2 — The Four Frameworks and What Is Specific to BPR

### 2.1 journi's Four Frameworks, in Their Real Stage Vocabulary

| Framework | Altitude | Stages (in journi's own UI, in order) | Logged on |
|---|---|---|---|
| Lewin | Organizational — one reading per project | Unfreeze → Change → Refreeze | M3 (Initiative Registry) |
| Prosci ADKAR | Individual / cohort — five independently-scored blocks | Awareness → Desire → Knowledge → Ability → Reinforcement | M5 (ADKAR Engine) |
| Bridges' Transition Model | Individual / cohort — emotional position | Ending → Neutral Zone → New Beginning | M6 (Emotional & Transition Layer) |
| Kübler-Ross Change Curve | Individual / cohort — sentiment | Denial → Resistance/Anger → Exploration → Commitment | M6 (Emotional & Transition Layer) |

### 2.2 Why the Weighting Is Different for BPR

- **Desire is the hardest block, and it stays hard.** Unlike Automation's near-zero emotional stakes, BPR asks staff to give up expertise they built themselves. Desire does not move on a logical business case alone — it moves when staff see a real role for their expertise in the redesigned process, not just an ending for the old one.
- **Bridges and Kübler-Ross read closer to the Cultural archetype than to Automation.** A workaround someone built and privately owns is a real Ending in Bridges' sense — not organizational rhetoric, but a specific, personal loss of a specific skill's relevance.
- **MP-05 (Training & Capability Enablement) is present**, per the E2E-BPR chain (MP-01→02→03→05→07→08→09→10) — Part 5 covers it, focused specifically on the new process's mechanics, not on convincing anyone to want the change.

### 2.3 The Composite Readiness Index and Benchmarking, Read for This Case

This program's Composite Readiness Index (Section 4.1) shows a real, visible dip during the pilot phase, coinciding with the resistance-escalation threshold crossing — an honest reading this guide narrates directly rather than smooth over. Benchmarking correspondingly reads "Behind" briefly during the pilot before recovering to "In Line" once the mitigation response closes the open resistance entries.


## Part 3 — Tenant and Admin Setup

### 3.1 The Existing Tenant: Bouregreg Group

This program runs inside the same tenant journi's Master User Guide builds, under the existing Bouregreg Manufacturing Maroc Organization. No new Organization is needed — Casablanca finance already sits inside it.

### 3.2 Step 1 — Onboarding the Redesign Team (M2)

| Name | journi Role (RBAC) | Scope type | Scope | RACSI Code | Notes |
|---|---|---|---|---|---|
| Karim Zniber | Sponsor | Project | Order-to-Cash Process Redesign *(created in Step 2)* | ES | VP Finance |
| Imane Berrada | Change Manager | Project | Order-to-Cash Process Redesign | CM | Owns day-to-day program execution |
| Othmane Rifai | Practitioner / Contributor | Project | Order-to-Cash Process Redesign | PM | Process redesign and build lead |
| Salwa Tazi | People Manager | Project | Order-to-Cash Process Redesign | FPO | Casablanca Finance Process Owner |
| Karim Alami | Practitioner / Contributor | Project | Order-to-Cash Process Redesign | ITL | IT liaison for tooling changes |
| Amina Sebti | People Manager | Project | Order-to-Cash Process Redesign | SUP | AP/AR team lead |

### 3.3 Step 2 — Creating the Order-to-Cash Process Redesign CM Project (M1)

1. On the Bouregreg Manufacturing Maroc Organization card, click **+ CM Project**. Fill in:
   - Name: "Order-to-Cash Process Redesign"
   - Linked Main Project: **none**
   - Owner: "Imane Berrada"
   - Change type: **BPR**
   - Target population: "Casablanca Finance (140)"
   - Business driver: "Three weeks of month-end reconciliation work per cycle, self-inflicted by the current order-to-cash process design, not by any tooling limitation."
2. Save. Lewin opens at **Unfreeze**, justification: "Opening Unfreeze at program start, Week 1 (org Week 3), alongside the ERP program's own Discovery phase."
3. On **Module 17 — WBS & Gantt**, load the **TPL-BPR-7** phase template (Intake & Diagnosis → Clean-Slate Design → Build → Pilot → Rollout → Stabilization → Sustainment).

### 3.4 Step 3 — Governance (M2)

Permission Matrix and the Governance Setting stay unchanged tenant-wide.

### 3.5 Step 4 — Charters for This Program (M19)

| Charter | Accountable (this program) | Review cadence |
|---|---|---|
| CHTR-01 Sponsorship / Leadership Charter | Karim Zniber (ES) | Per Phase Gate |
| CHTR-02 Participative Management Charter | Amina Sebti (SUP) | Quarterly |
| CHTR-03 Communication Charter | Imane Berrada (CM) | Per communication wave |
| CHTR-04 Organizational Impact Charter | Imane Berrada (CM) | On scope change |
| CHTR-06 One-to-One Coaching Charter | Imane Berrada (CM) | Per triggered case — directly relevant given this case's expected resistance |
| CHTR-08 Pulse / Interview Charter | Imane Berrada (CM) | Per phase gate + ad hoc |

CHTR-05 (Team Coaching, hypercare-specific) and CHTR-07 (Mentoring) stay dormant — this program has no hypercare phase of its own and does not run a mentoring cohort.

### 3.6 Setup Checklist

- [ ] Base tenant confirmed (Bouregreg Group, Bouregreg Manufacturing Maroc Organization)
- [ ] Redesign team accounts created — Section 3.2
- [ ] Order-to-Cash Process Redesign CM Project created, Lewin opened at Unfreeze — Section 3.3
- [ ] TPL-BPR-7 phase template loaded on M17 — Section 3.3
- [ ] Six applicable Charters reviewed and accountable owners confirmed — Section 3.5

With this checklist complete, Part 4 runs the program forward, week by week.
