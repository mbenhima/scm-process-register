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


## Part 4 — Week-by-Week BPR Timeline: Normal Flow and Exceptions

Part 3 ended with Order-to-Cash Process Redesign registered and its Lewin phase opened at Unfreeze, program Week 1. This Part runs that program forward for its full 50-week duration, against journi's TPL-BPR-7 template. Program Week 1 corresponds to Bouregreg Group's own org-calendar Week 3 — add 2 to convert a program week to its org-calendar equivalent. Every week carrying a phase transition, a Phase Gate, or an exception gets its own row; a pure-monitoring stretch with no distinct activity is shown at a lighter, still-regular cadence rather than repeating an identical row every single week — the same economy journi's own Master User Guide calendar uses for its steadier stretches.

### 4.1 Normal Flow, Phase by Phase

#### Phase 1 — Intake & Diagnosis (Weeks 1–7)

Quantifies the real cost of the current process before any redesign work starts — the business case this program runs on has to be unambiguous, since the redesign will ask staff to give up real expertise.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 1** | Othmane Rifai holds program kickoff; confirms Karim Zniber's sponsorship. | Imane Berrada briefs the team; plans the workaround-inventory capture method. | M1 (Hierarchy) — verify the CM Project record matches the kickoff agreement. | — | — |
| **Week 2** | Interview finance staff (AR and AP) about the current order-to-cash process, step by step. | Begin logging workaround findings neutrally, not yet as resistance entries. | M21 (Field Notes) — Category: Workshop · Title: "Order-to-Cash Interviews Begin." | — | — |
| **Week 3** | Continue interviews across the full AR/AP cycle. | Compile the workaround inventory: manual credit-note re-keying, whiteboard-tracked partial shipments, manual bank-reconciliation matching. | M21 (Field Notes) — Body: "Four distinct workarounds identified, each traced to a specific process gap." | — | Workaround count |
| **Week 4** | Pull reconciliation time logs across the full monthly cycle. | Quantify: three weeks of reconciliation work per month, traced to the four named workarounds. | M21 (Field Notes) — Body: "3 weeks/month, all four workarounds implicated, fully traced not estimated." | — | — |
| **Week 5** | Draft the business case. | Begin stakeholder mapping. | M4 (Stakeholder Mapping) — "Casablanca Finance — AR" and "Casablanca Finance — AP" (dimension: Process, severity: High). | — | — |
| **Week 6** | Present the draft business case to the Steering Committee. | Flag which sub-team (AR or AP) carries the deepest workaround exposure for the design phase's priority order. | M4 (Stakeholder Mapping) — AR cohort severity updated to Critical. | — | — |
| **Week 7** | Finalize the business case for sign-off — Phase 1 gate. | Prepare for the design phase's co-design recruitment. | M21 (Field Notes) — Category: Decision · Title: "Business Case Finalized." | — | — |

*Phase gate: Intake & Diagnosis closes once the business case is quantified against named, traced workarounds — not a general estimate.*

#### Phase 2 — Clean-Slate Design (Weeks 5–8)

Deliberately designs from the ideal future state, not the current process — and deliberately recruits the workaround-owning staff themselves into the design work, converting the program's biggest resistance risk into design expertise instead of excluding it.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 5** | Launch clean-slate design workshops, explicitly not anchored to the current process. | Recruit the workaround-owning staff into the design workshops directly — the core mitigation for this program's central risk. | M21 (Field Notes) — Category: Workshop · Title: "Clean-Slate Design Workshops Begin, Workaround-Owners Included." | (Phase 1 gate also closes this week) | — |
| **Week 6** | Continue design workshops; map the future-state process end to end. | — | M21 — routine log. | — | — |
| **Week 7** | Draft the future-state process map for review. | — | M21 — routine log. | — | — |
| **Week 8** | Confirm the Phase 2 gate: clean-slate design signed off. | Log Lewin justification citing the co-designed process map. | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Clean-Slate Design closes once the future-state process is mapped end to end and signed off — with the same staff who built today's workarounds having helped design its replacement.*

#### Phase 3 — Build (Weeks 8–16)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 8** | Begin build: configure the new process steps and any supporting tooling changes. | — | M17 (WBS & Gantt) — task status "In Progress." | (Phase 2 gate also closes this week) | — |
| **Week 9** | Continue build; confirm integration points with existing finance systems. | — | M21 — routine log. | — | — |
| **Week 10** | Continue build. | — | M21 — routine log. | — | — |
| **Week 11** | Continue build; draft the new process's job aids. | — | M21 — routine log. | — | — |
| **Week 12** | Continue build. | Review the draft job aids with Salwa Tazi for accuracy. | M21 — routine log. | — | — |
| **Week 13** | Continue build; internal review of the configured process against the design map. | — | M21 — routine log. | — | — |
| **Week 14** | Finalize build; select the single process step (credit-note issuance) for the Phase 4 pilot. | Capture the pilot baseline: current resistance log at zero, current cycle time for credit-note issuance. | M10 (Resistance) — baseline: 0 open entries. | — | Baseline resistance-entry count (0) |
| **Week 15** | — | — | M21 — routine log. | — | — |
| **Week 16** | Confirm the Phase 3 gate: build complete. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | — |

*Phase gate: Build closes once the new process is fully configured and its job aids reviewed with the Process Owner.*

#### Phase 4 — Pilot (Weeks 14–24)

Runs the new process on a single step — credit-note issuance — with the AR team who most directly owns today's manual workaround for it. This is where the program's central risk actually surfaces, on schedule.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 14** | Prepare the pilot launch with the AR credit-note team. | — | M21 — routine log. | (Phase 3 gate also closes this week) | — |
| **Week 15** | — | — | M21 — routine log. | — | — |
| **Week 16** | Launch the pilot: credit-note issuance runs on the new process. | Weekly pulse check begins. | M5 (ADKAR Engine) — Awareness 4, Desire 3. | — | — |
| **Week 17** | — | Continue weekly monitoring. | M5 — routine update. | — | — |
| **Week 18** | — | — | M5 — routine update. | — | — |
| **Week 19** | — | — | M5 — routine update. | — | — |
| **Week 20** | — | First resistance entry logged: a senior AR staff member objects to losing manual control over credit-note approval, citing accuracy concerns. | M10 (Resistance) — Entry 1: "Manual-control loss objection, senior AR staff — accuracy concern cited." | — | Open resistance-entry count (1) |
| **Week 21** | — | Second resistance entry logged: a related objection from a second AR staff member, same root theme. | M10 (Resistance) — Entry 2: "Same root theme — accuracy concern, second AR staff member." | — | Open resistance-entry count (2) |
| **Week 22** | Escalate to Imane Berrada and the Steering Committee. | Third resistance entry lands — **journi's ALT-004 (Resistance Escalation Threshold Breached) fires**, three open entries within the pilot. | M10 (Resistance) — Entry 3: "Same root theme, third AR staff member — threshold crossed." | **ALT-004 fires this week** (Section 4.2) | Open resistance-entry count (3) |
| **Week 23** | Support the mitigation response logistics. | Run direct, individual conversations with all three staff; co-design an accuracy safeguard (a secondary review step) directly with them rather than overriding the objection. | M21 (Field Notes) — Category: Decision · Title: "Accuracy Safeguard Co-Designed With Resisting Staff." | ALT-004 resolution in progress | — |
| **Week 24** | Confirm the Phase 4 gate: pilot complete, resistance entries closed. | Close all three resistance entries, each linked to the new safeguard as its mitigation action. | M10 (Resistance) — all 3 entries: status "Closed," linked mitigation: "Secondary accuracy review step added." | **ALT-004 resolved this week** | Open resistance-entry count (0) |

*Phase gate: Pilot closes once the resistance entries are not just counted but closed, each with a real, co-designed mitigation — not simply overridden.*

#### Phase 5 — Rollout (Weeks 22–32)

Extends the redesigned process, including the accuracy safeguard the pilot's resistance directly produced, to the remaining Casablanca finance population.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 22** | Begin rollout planning, incorporating the pilot's accuracy safeguard into the rollout design. | (ALT-004 active — see Phase 4, Week 22) | M21 — routine log. | (see Phase 4, Week 22) | — |
| **Week 23** | Continue rollout planning. | (ALT-004 resolution in progress — see Phase 4, Week 23) | M21 — routine log. | (see Phase 4, Week 23) | — |
| **Week 24** | Confirm rollout plan, sequenced by finance sub-team. | (ALT-004 resolved — see Phase 4, Week 24) | M17 (WBS & Gantt) — rollout sequence logged. | (see Phase 4, Week 24) | — |
| **Week 25** | Prepare rollout communications for the AR function beyond the pilot team. | — | M8 (Communications) — rollout announcement drafted. | — | — |
| **Week 26** | Launch rollout to the AR function beyond the pilot team. | Monitor resistance log — none of the pilot's three closed entries recur elsewhere in AR. | M10 (Resistance) — 0 open entries, AR rollout. | — | — |
| **Week 27** | Continue AR rollout monitoring. | — | M5 — routine update. | — | — |
| **Week 28** | Begin rollout to the AP function. | — | M5 — routine update, AP cohort. | — | — |
| **Week 29** | Continue AP rollout. | — | M5 — routine update. | — | — |
| **Week 30** | Continue rollout across remaining AP teams. | — | M5 — routine update. | — | — |
| **Week 31** | Confirm all sub-teams live on the redesigned process. | — | M21 — routine log. | — | — |
| **Week 32** | Confirm the Phase 5 gate: rollout complete across all 140 finance staff. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Rollout completion (140/140) |

*Phase gate: Rollout closes once the redesigned process — including the safeguard the pilot's resistance produced — is live across all of Casablanca finance.*

#### Phase 6 — Stabilization (Weeks 30–42)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 30** | Begin stabilization monitoring alongside the final rollout weeks. | — | M21 — routine log. | (Phase 5 active) | — |
| **Week 32** | Continue monitoring. | — | M21 — routine log. | (Phase 5 gate also closes this week) | — |
| **Week 34** | Monitor reconciliation cycle time against the pre-redesign baseline. | — | M14 (Analytics) — first post-rollout reconciliation-time reading. | — | Reconciliation time vs. baseline |
| **Week 36** | Continue monitoring; confirm the accuracy safeguard has not introduced a new bottleneck. | — | M21 — routine log. | — | — |
| **Week 38** | Continue monitoring; confirm the accuracy safeguard is being used correctly, not skipped. | — | M21 — routine log. | — | — |
| **Week 40** | Continue monitoring alongside Phase 7's own start (Section 4.1, Phase 7). | — | M14 (Analytics) — second reconciliation-time reading, trending favorably. | — | — |
| **Week 42** | Confirm the Phase 6 gate: reconciliation time reduced and holding, no new resistance patterns. | Set Lewin to **Change**. | M3 (Initiative Registry) — Lewin: "Change." | — | Reconciliation time reduction (weeks/month) |

*Phase gate: Stabilization closes once the reduced reconciliation time holds for a full monthly cycle, not just a single favorable reading.*

#### Phase 7 — Sustainment (Weeks 40–50)

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 40** | Begin sustainment planning alongside the final stabilization weeks. | Log the first sustainment checkpoint. | M12 (Sustainment) — first checkpoint logged. | (Phase 6 active) | — |
| **Week 45** | — | Log quick wins from the redesigned process's first full quarter. | M12 (Sustainment) — quick wins logged. | — | — |
| **Week 48** | Finalize the sustainment handover package. | Confirm the reconciliation-time reduction holds for a second consecutive cycle. | M14 (Analytics) — second consecutive favorable reading. | — | — |
| **Week 50** | Confirm program close. | Set Lewin to **Refreeze**; toggle the sustainment sign-off. | M3 (Initiative Registry) — Lewin: "Refreeze." M12 (Sustainment) — sign-off toggle: **set**. | — | Sustainment sign-off (toggled) |

*Phase gate: Sustainment — and the program itself — closes once the reconciliation-time reduction holds for two consecutive cycles and the sign-off is set. Total program length: 50 weeks, one resistance-escalation alert fired and resolved.*

### 4.2 Master WBS & Gantt — Every Task and Step, PM and CM Tracks, Across the Four Frameworks

| ID | Task / Step Name | Track | Week(s) | Lewin | ADKAR | Bridges | Kübler-Ross |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Interviews and workaround inventory | Joint | 1–4 | Unfreeze | Awareness | Ending | Denial |
| T1.1-S2 | Business case and stakeholder map | CM | 5–7 | Unfreeze | Awareness | Ending | Denial |
| T2.1-S1 | Co-design workshops with workaround-owners | Joint | 5–7 | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger |
| T2.1-S2 | Design sign-off | PM | 8 | Unfreeze | Desire | Ending → Neutral Zone | Resistance/Anger |
| T3.1-S1 | Process and tooling configuration | PM | 8–13 | Unfreeze | Desire | Neutral Zone | Resistance/Anger |
| T3.1-S2 | Job aids and build complete | CM | 14–16 | Unfreeze | Desire → Knowledge | Neutral Zone | Resistance/Anger |
| T4.1-S1 | Pilot launch and weekly monitoring | CM | 14–19 | Unfreeze | Knowledge | Neutral Zone | Resistance/Anger |
| T4.1-S2 | Resistance escalation (ALT-004) detected and resolved | CM | 20–24 | Unfreeze | Knowledge → Ability | Neutral Zone | Resistance/Anger |
| T5.1-S1 | AR rollout | Joint | 22–27 | Unfreeze | Ability | Neutral Zone | Resistance/Anger → Exploration |
| T5.1-S2 | AP rollout and completion | Joint | 28–32 | Unfreeze → Change | Ability | Neutral Zone | Exploration |
| T6.1-S1 | Reconciliation-time monitoring | CM | 30–38 | Change | Ability → Reinforcement | Neutral Zone | Exploration |
| T6.1-S2 | Change state confirmed | CM | 40–42 | Change | Reinforcement | Neutral Zone → New Beginning | Exploration → Commitment |
| T7.1-S1 | Sustainment checkpoints and quick wins | CM | 40–48 | Change | Reinforcement | New Beginning | Commitment |
| T7.1-S2 | Refreeze confirmed; sustainment sign-off | Joint | 50 | **Refreeze** | Reinforcement | New Beginning | Commitment |

*Table 4.2.1 — Master WBS & Gantt, framework view. All 14 Task/Step rows across the full 50-week program.*

### 4.3 Master WBS & Gantt — Every Task and Step, Techniques and Tools

| ID | Task / Step Name | Track | Week(s) | Technique Name | Technique Goal | Technique Details | Recommended Tool |
|---|---|---|---|---|---|---|---|
| T1.1-S1 | Interviews and workaround inventory | Joint | 1–4 | Structured process interviews | Capture the current process and its workarounds directly from the staff who run it. | Step-by-step interviews across the full AR/AP cycle; each workaround logged with its specific process gap. | Taguette |
| T1.1-S2 | Business case and stakeholder map | CM | 5–7 | Quantified business case | Convert traced workarounds into a business case with no ambiguity about the problem's reality. | Time-and-motion study across the full monthly cycle; three weeks/month traced to four named workarounds, not estimated. | LibreOffice Calc |
| T2.1-S1 | Co-design workshops with workaround-owners | Joint | 5–7 | Clean-slate co-design | Design the future state from the workaround-owners' own expertise, not around them. | Workshops explicitly not anchored to the current process; workaround-owning staff recruited directly into the design work. | Excalidraw |
| T2.1-S2 | Design sign-off | PM | 8 | Future-state process map sign-off | Confirm the redesigned process end to end before build begins. | Steering Committee review of the full process map, with the co-design group's direct input already incorporated. | BookStack |
| T3.1-S1 | Process and tooling configuration | PM | 8–13 | Iterative build | Configure the new process steps and supporting tooling against the signed-off design. | Standard build cycle; status tracked against baseline dates. | journi M17 — WBS & Gantt |
| T3.1-S2 | Job aids and build complete | CM | 14–16 | Staff-facing job aid development | Give staff a clear, reviewed reference for the new process before the pilot. | Draft job aids reviewed directly with Salwa Tazi (Process Owner) for accuracy. | BookStack |
| T4.1-S1 | Pilot launch and weekly monitoring | CM | 14–19 | Single-step pilot with weekly pulse | Test the redesigned process on one real, bounded step before wider rollout. | Credit-note issuance run on the new process with the AR team; weekly ADKAR pulse. | LimeSurvey + Metabase |
| T4.1-S2 | Resistance escalation detected and resolved | CM | 20–24 | Individual conversation + co-designed safeguard | Resolve resistance rooted in a real, rational concern rather than override it. | Direct 1:1 conversations with each resisting staff member; a secondary accuracy-review step co-designed with them as the actual mitigation. | journi M10 — Resistance |
| T5.1-S1 | AR rollout | Joint | 22–27 | Evidence-based rollout | Extend the redesigned process, including the pilot's safeguard, to the rest of AR. | Rollout communications cite the pilot's real resolution, not a generic announcement. | journi M8 — Communications |
| T5.1-S2 | AP rollout and completion | Joint | 28–32 | Sequenced rollout | Complete rollout across the remaining finance sub-teams. | AP rollout follows AR, in the same sequence order set during Phase 3. | journi M8 — Communications |
| T6.1-S1 | Reconciliation-time monitoring | CM | 30–38 | Baseline-to-current comparison | Confirm the business case's promised reduction is actually materializing. | Monthly reconciliation-time reading compared against the Phase 1 baseline. | journi M14 — Analytics |
| T6.1-S2 | Change state confirmed | CM | 40–42 | Lewin state confirmation | Move the organizational reading forward once evidence, not the calendar, supports it. | Confirm reconciliation-time reduction holds for a full cycle before setting Lewin to Change. | journi M3 — Initiative Registry |
| T7.1-S1 | Sustainment checkpoints and quick wins | CM | 40–48 | Standing checkpoint cadence | Confirm the reduction holds beyond the first favorable reading. | Checkpoints logged at defined intervals; quick wins captured as evidence for the eventual sign-off. | journi M12 — Sustainment |
| T7.1-S2 | Refreeze confirmed; sustainment sign-off | Joint | 50 | Sustainment sign-off | Formally close the program once two consecutive cycles confirm the reduction holds. | Toggle the M12 sign-off; set Lewin to Refreeze with the two-cycle evidence as justification. | journi M12 / M3 |

*Table 4.3.1 — Master WBS & Gantt, technique view. Same 14 rows as Table 4.2.1, with the operational detail behind each step.*
