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
