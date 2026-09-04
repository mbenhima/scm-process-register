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
