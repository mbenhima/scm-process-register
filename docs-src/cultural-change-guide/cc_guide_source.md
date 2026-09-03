POWERACT CONSULTING

# Leading a Cultural & Values Transformation on journi

A Practical User Guide

*SIPOC, Techniques & RACSI per Task and Step · Tracking Dashboard · Simulated Data Walkthrough*

*Case Study: Cedarbrook Health Network — "Project Concord," a 24-month Just Culture transformation*

Built on journi's Framework Interaction Map v2.1

Frameworks referenced: Lewin's Change Management Model · Prosci ADKAR · Bridges' Transition Model · Kübler-Ross Change Curve

Version 1.0 · September 2026 · Confidential


## Executive Summary

Of journi's eight transformation archetypes, Cultural / Values Transformation is the most complex to run — not by opinion, but by journi's own Cross-Type Comparison Matrix (SRS 10.6.14). Three facts drive that ranking, and this guide is built around all three:

- **No training phase exists to lean on.** The E2E-CULT process chain (MP-01 → MP-02 → MP-03 → MP-04 → MP-06 → MP-07 → MP-08 → MP-09 → MP-10) is the only one of journi's ten archetype chains that skips MP-05, Training & Capability Enablement. You cannot train someone into believing something; every other lever in this guide exists because that one is unavailable.
- **The dominant frameworks are emotional, not procedural.** Where an ERP rollout is read almost entirely through Lewin and ADKAR, a values transformation is read primarily through Bridges' Transition Model and the Kübler-Ross Change Curve — frameworks built for loss and identity, not task competence.
- **It is journi's longest archetype (18–36 months against 12 for ERP) and its most reversibility-fragile** — "High, but slow to fix." A stalled ERP cutover is visible in days. A culture quietly reverting to old norms is invisible until the evidence has already piled up, and expensive in trust to reverse once staff conclude the new values were a phase, not a commitment.

This guide walks a single, fully worked case: **Cedarbrook Health Network**, a fictional but realistic health-sector organization (three hospitals, eleven clinics — journi's real "health" sector), running a 24-month Just Culture transformation internally named **Project Concord**. Cedarbrook's incident-reporting culture is built on blame; its Board has mandated a replacement built on four new values — **Psychological Safety, Shared Accountability, Radical Transparency, and Patient-First Courage** — inside two years, without a single additional day of classroom training. Every SIPOC, every Task and Step, every RACSI table, and the simulated 24-month data walkthrough in this guide trace that one program end to end, exactly as the earlier 120-page ERP Implementation User Guide traced Meridian Industrial's ERP rollout.


## 1. Introduction

### 1.1 Purpose

This guide shows how to plan, govern, and execute a Cultural / Values Transformation end to end inside journi, using Cedarbrook Health Network's Project Concord as the running example throughout. It mirrors the structure of the earlier ERP Implementation User Guide — SIPOC per phase, Task and Step detail with named techniques and recommended tools, and RACSI accountability per Task — but re-weights every framework, metric, and governance rhythm for an archetype where the deliverable is a belief, not a system.

### 1.2 Who This Guide Is For

- **Change Manager (CM)** — owns the day-to-day design and execution of every Task in this guide.
- **Executive Sponsor (ES)** — personally models the target values and owns the Sponsorship Charter.
- **HR Business Partner (HRBP)** — co-owns accountability-process design and equal-application review.
- **Unit Leaders / Supervisors (SUP)** — the primary channel through which values become daily behavior.
- **End Users (EU)** — frontline staff whose lived experience is both the input to diagnosis and the evidence of success.

### 1.3 How This Guide Maps to journi's TPL-CULT-7 Template

journi's default seven-phase template for the cultural archetype (TPL-CULT-7) is Diagnosis, Target Values Design, Leadership Modeling & Reinforcement Build, Pilot Cohort, Organization-Wide Rollout, Reinforcement Through Skepticism, and Institutionalization. Cedarbrook's 24-month calendar maps onto it with deliberately wide phase overlaps — culture work does not hand off cleanly from one phase to the next the way a system cutover does.

**Table 1.1 — TPL-CULT-7 phases mapped to Project Concord's 24-month calendar.**

| Phase | Name | Months |
|---|---|---|
| 1 | Diagnosis | 1–3 |
| 2 | Target Values Design | 2–5 |
| 3 | Leadership Modeling & Reinforcement Build | 4–8 |
| 4 | Pilot Cohort | 7–12 |
| 5 | Organization-Wide Rollout | 11–17 |
| 6 | Reinforcement Through Skepticism | 15–22 |
| 7 | Institutionalization | 20–24, open-ended beyond Month 24 |

*Phase 7 is deliberately shown as open-ended: institutionalization is a state the program transitions into, not a milestone it completes on a fixed date.*


## 2. Getting Started in journi

### 2.1 Core Modules for a Cultural Transformation

A cultural program touches most of journi's platform, but leans hardest on: **M5 (Charters)**, **M7 (Readiness Assessment)**, **M9 (Governance Dashboards)**, **M10 (Process Registry)**, **M11 (Steering & Phase Gates)**, **M12 (Stakeholder Mapping)**, **M13 (Communications)**, **M14 (Champion Network)**, **M16 (Resistance Management)**, **M17 (Manager Readiness Tracking)**, **M20 (Metrics & Benchmarking)**, and **M21 (Framework Interaction Engine)**. Notably absent from that list, because MP-05 does not appear in the E2E-CULT chain: journi's Training Content Library and LMS-integration modules. Anything that looks like a training deliverable elsewhere in journi (a course, a certification, a completion record) has no natural home in this program, and this guide does not manufacture one.

### 2.2 The Justified-Change-Pattern Rule

journi enforces that every Phase Gate advance be backed by a logged, evidence-based justification, not a calendar date. For every other archetype, this mostly guards against moving too slowly. For cultural change it guards against the opposite and more common failure: advancing to Reinforcement or Institutionalization on launch-event enthusiasm rather than sustained behavior evidence, which is the single fastest way to trigger a premature, unrecoverable Refreeze — locking in a culture that only looks changed.

### 2.3 journi's Computed Metrics for This Archetype

Two journi-computed metrics anchor every tracking table in this guide:

- **Composite Readiness Index (CRI)** — a single 0–100 score blending survey-based framework-position readings (Lewin state, Bridges position, ADKAR gaps) with behavioral evidence (incident-reporting patterns, champion activity, resistance-entry trends). Section 8 traces Project Concord's CRI quarter over quarter.
- **Benchmarking** — journi's cultural reference band, built from archetype-specific historical program data, expressing each site's or the org's current CRI trajectory as Behind, In Line, or Ahead of where comparable cultural programs stood at the same elapsed time.

### 2.4 Cross-Reference Note

Every Task and Step in Sections 6 and 9 names the specific journi module it is logged against. Where a Task closely parallels one from the ERP Implementation User Guide's own structure (readiness assessment, Steering Committee cadence, Phase Gate justification), this guide calls that out rather than re-explaining journi mechanics already documented there.


## 3. The Four Frameworks — Quick Primer, Re-Weighted for a Cultural Change

journi's Framework Interaction Engine (M21) always tracks the same four frameworks, but a cultural program reads them in a different order of importance than an ERP or automation program does.

### 3.1 Lewin's Change Management Model (Unfreeze / Change / Refreeze)

Sets the macro state. Cedarbrook stays in Unfreeze far longer than a system rollout would — roughly the first nine months — because unfreezing a blame-oriented safety culture requires dismantling years of learned self-protection, not just announcing a go-live date.

### 3.2 Prosci ADKAR (Awareness, Desire, Knowledge, Ability, Reinforcement)

Still tracked per individual and per unit, but Knowledge and Ability carry less weight here than in a system rollout, because there is no system to learn. Desire and Reinforcement dominate: staff already understand intellectually what "speak up" means long before they believe it is safe to do it.

### 3.3 Bridges' Transition Model (Ending, Neutral Zone, New Beginning) — dominant framework

This is the primary lens for a values program. Ending is not a system being decommissioned; it is staff mourning the loss of a familiar, if flawed, way of protecting themselves. The Neutral Zone — where old norms no longer fully apply and new ones are not yet trusted — is where cultural programs live for most of their duration, and where most of this guide's exception patterns (Section 9) originate.

### 3.4 Kübler-Ross Change Curve (Denial, Anger/Resistance, Exploration, Commitment) — dominant framework

Tracked alongside Bridges as the emotional-state complement to it. journi logs a dominant sentiment reading per unit at every checkpoint in Section 8's simulated walkthrough; a program that skips from Denial straight to a claimed Commitment reading, with no visible Resistance or Exploration in between, is itself a data-quality red flag worth investigating before it is trusted.

### 3.5 The Program / Change-Manager / Joint Task-Nature Tag

The ERP guide tags every Task Project, Change, or Joint. For a cultural transformation, journi's own defaults relabel this the same three-way split with archetype-appropriate ownership: **[ES]** for tasks the Executive Sponsor personally owns, **[CM]** for tasks the Change Manager drives day to day, **[HRBP]** for tasks HR Business Partner co-owns, **[PM]** for Program Manager–owned continuity and governance tasks, and **[Joint]** for tasks requiring shared, simultaneous ownership. Every Task title in Sections 6 and 9 carries one of these tags.
