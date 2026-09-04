journi

Building a Plant-Floor Digital Skills Program

A Focused Guide to journi's Training & Skills Development Transformation Archetype

Case: Plant Digital Skills Upskilling Program (Manufacturing — Plant Floor, Kenitra and Settat)

Tenant Setup Through Skills Sustainment — One Program, Followed Week by Week

Version 1.0 · September 2026 · Confidential


## Part 0 — Purpose and How to Use This Guide

### What this guide is

This guide is a single, focused companion to journi's Training & Skills Development transformation archetype, following **Plant Digital Skills Upskilling Program** — Bouregreg Group's standalone digital-literacy and systems-skills program for plant-floor staff at Kenitra and Settat — from CM Project creation through skills sustainment, week by week. It is the guide in this series where training is not a supporting track running alongside another program's own milestones; training **is** the program, and every phase in Part 4 is itself a step in building, delivering, verifying, and locking in a skill, not a parallel activity to a go-live somewhere else.

It is organized in six parts: Part 0 (this part), Part 1 (Executive Summary), Part 2 (The Four Frameworks and What Is Specific to Training & Skills), Part 3 (Tenant and Admin Setup), Part 4 (Week-by-Week Skills Timeline: Normal Flow and Exceptions, including two Master WBS & Gantt views), and Part 5 (Curriculum Reference: The Full Course Catalog by Tier).

### How to use it

This guide's Bouregreg Group tenant is the same one journi's Master User Guide builds, and the same one this series' other archetype guides extend. A reader with the tenant already set up skips to Part 3, Section 3.2.

### A note on fidelity

Every journi module, field, and role named in this guide is verified against journi's actual source. Plant Digital Skills Upskilling Program is journi's own stated case with no alerts in its real record — not because the program is trivial, but because it runs independent of any single go-live event, and none of journi's 9 live alert conditions are built around a standalone skills program the way they are around a system cutover or a resistance-log threshold. This guide states that plainly, the same way the Automation and Compliance archetype guides in this series state their own clean records, rather than manufacture alerts that would not actually fire.

### A note on the RACSI codes used throughout

Part 4's RACSI tables use journi's 7-code RACSI role taxonomy (ES/CM/PM/FPO/ITL/SUP/EU), distinct from the 9-role platform RBAC enum Part 3 uses for journi user accounts. **ES** = Executive Sponsor, **CM** = Change Manager, **PM** = Program/Project Manager, **FPO** = Functional Process Owner, **ITL** = IT/Technical Lead, **SUP** = Supervisor, **EU** = End User.

### Reading paths, by role

- **A Change Manager running this program day to day:** Part 2 once, then Part 4 in full.
- **A Program/Project Manager:** Part 4's PM Track column and the Master WBS & Gantt (Sections 4.2–4.3).
- **An Executive Sponsor:** Part 1, then Part 4's phase-opening narratives.
- **A Super Admin or Org Admin:** Part 3.


## Part 1 — Executive Summary

### 1.1 Why This Case Matters: Training Is the Program, Not a Track Beside It

Every other guide in this series treats training as MP-05 — a track that runs alongside a redesign, a rollout, or a compliance deadline, closing when the surrounding program's own milestone closes. This case has no surrounding program. There is no system cutover, no process redesign, and no regulatory deadline driving its schedule — the schedule is the curriculum's own, built around what it actually takes for 620 plant-floor staff at two sites to acquire, apply, and retain a durable digital skill. That difference reshapes Part 4 itself: where this series' other guides show training rows inside a phase table built around some other milestone, this guide's seven phases are all directly about skill — diagnosis, design, delivery, verification, application, coaching, and sustainment — with nothing else to anchor to.

Three facts drive this case's specific shape:

- **The business driver was identified independently of the ERP program**, then accelerated once the ERP program made the underlying skills gap visible — a realistic origin story this guide states plainly rather than invent a false urgency.
- **Deployment is deliberately staggered a month behind the ERP program's own Train phase**, so the two curricula never compete for the same plant-floor hours — the same population-overlap discipline Section 1.3 of the Master User Guide's portfolio view names directly.
- **This is the case that most exercises M9 (Training) and M16 (AI Use Case Library)** in journi's module library — M16's AI-assisted curriculum drafting is a real, named step in Phase 2, not a background detail.

### 1.2 The Case, in Brief

Bouregreg Group builds a standalone digital-literacy and systems-skills program for 620 plant-floor staff without prior systems training, split across the Kenitra and Settat plants, preparing the workforce for the next several years of technology change generally rather than for one program's own go-live. This 43-week program (Weeks 16–58 of Bouregreg Group's own org calendar — this guide numbers its own weeks 1–43, each 15 weeks behind the org-calendar equivalent) runs from skills-gap diagnosis through a sustained, coached competency the population keeps using long after the program itself closes.

### 1.3 What This Guide Proves, Concretely

Every claim above is traceable to a real journi record this guide builds: an AI-assisted curriculum drafted and refined through M16, a pilot cohort's validation before full two-plant deployment, a competency-verification record distinct from mere attendance, and a sustainment record showing skill retention measured, not assumed, months after delivery closed.


## Part 2 — The Four Frameworks and What Is Specific to Training & Skills

### 2.1 journi's Four Frameworks, in Their Real Stage Vocabulary

| Framework | Altitude | Stages (in journi's own UI, in order) | Logged on |
|---|---|---|---|
| Lewin | Organizational — one reading per project | Unfreeze → Change → Refreeze | M3 (Initiative Registry) |
| Prosci ADKAR | Individual / cohort — five independently-scored blocks | Awareness → Desire → Knowledge → Ability → Reinforcement | M5 (ADKAR Engine) |
| Bridges' Transition Model | Individual / cohort — emotional position | Ending → Neutral Zone → New Beginning | M6 (Emotional & Transition Layer) |
| Kübler-Ross Change Curve | Individual / cohort — sentiment | Denial → Resistance/Anger → Exploration → Commitment | M6 (Emotional & Transition Layer) |

### 2.2 Why the Weighting Is Different for Training & Skills

- **Knowledge and Ability dominate the whole program, not just one phase.** Unlike Compliance's checkable-behavior training or the Cultural archetype's persuasion-heavy curriculum, this program's entire seven phases exist to move a population from not-knowing to durably able — Awareness and Desire matter far less here, because nobody is being asked to accept a change to how their own job is structured, only to gain a skill.
- **Reinforcement is engineered by two dedicated phases, not left to chance.** Practical Application and On-the-Job Coaching (Phases 5 and 6) exist specifically because skill decay, not resistance, is this archetype's real risk — the deliberate design answer to the same problem the Operating Model guide's Exception E1 shows happening by accident when reinforcement is left unplanned.
- **MP-05 (Training & Capability Enablement) is not a supporting track here — it is this program's entire content.** Per the E2E-TSD chain (MP-01→02→03→05→06→07→08→09→10), MP-05 and MP-06 (AI-assisted content generation) both run at full weight throughout, not as an add-on to some other MP.
- **Lewin's Refreeze has no go-live to anchor to.** Every other guide in this series closes Refreeze against a cutover, a controls-go-live date, or a transition milestone owned by some other function. This program closes Refreeze against its own Phase 7 Skills Sustainment gate — the skill itself, verified as retained, is the only milestone this framework has to close against.

### 2.3 The Composite Readiness Index and Benchmarking, Read for This Case

This program's Composite Readiness Index climbs steadily and predictably: Awareness and Knowledge move first during Curriculum Design and Training Delivery, Ability climbs sharply once hands-on delivery begins, and Reinforcement is the slowest-moving block by design, closing only after Practical Application and On-the-Job Coaching have both run their full course. Benchmarking reads "In Line" throughout, and — consistent with this guide's honesty standard, the same one the Automation and Compliance guides in this series apply to their own records — no alert fires in this program's real data, because none of journi's 9 live alert conditions are built around a standalone skills program with no go-live and no resistance log of its own.


## Part 3 — Tenant and Admin Setup

### 3.1 The Existing Tenant: Bouregreg Group

This program runs inside the same tenant journi's Master User Guide builds, under the existing Bouregreg Manufacturing Maroc Organization. No new Organization is needed — the Kenitra and Settat plant floors already sit inside it.

### 3.2 Step 1 — Onboarding the Skills Program Team (M2)

| Name | journi Role (RBAC) | Scope type | Scope | RACSI Code | Notes |
|---|---|---|---|---|---|
| Fouad Belghazi | Sponsor | Project | Plant Digital Skills Upskilling Program *(created in Step 2)* | ES | VP Manufacturing Operations |
| Houda Amrani | Change Manager | Project | Plant Digital Skills Upskilling Program | CM | Owns day-to-day program execution |
| Tarik Benjelloun | Practitioner / Contributor | Project | Plant Digital Skills Upskilling Program | PM | Skills program lead |
| Leila Ouahbi | People Manager | Project | Plant Digital Skills Upskilling Program | FPO | Learning & Development Lead |
| Younes Berrada | Practitioner / Contributor | Project | Plant Digital Skills Upskilling Program | ITL | Learning-systems and AI-drafting-tool lead |
| Karima Semlali | People Manager | Project | Plant Digital Skills Upskilling Program | SUP | Kenitra Plant Floor Supervisor |
| Mustapha Idrissi | People Manager | Project | Plant Digital Skills Upskilling Program | SUP | Settat Plant Floor Supervisor |

### 3.3 Step 2 — Creating the CM Project (M1)

1. On the Bouregreg Manufacturing Maroc Organization card, click **+ CM Project**. Fill in:
   - Name: "Plant Digital Skills Upskilling Program"
   - Linked Main Project: **none**
   - Owner: "Houda Amrani"
   - Change type: **Training & Skills Development**
   - Target population: "Plant-floor staff without prior systems training, Kenitra and Settat (620)"
   - Business driver: "A skills gap identified independently of the ERP program, accelerated once the ERP program made it visible."
2. Save. Lewin opens at **Unfreeze**, justification: "Opening Unfreeze at program start, Week 1 (org-calendar Week 16) — a standalone skills program with no go-live of its own to align to."
3. On **Module 17 — WBS & Gantt**, load the **TPL-TSD-7** phase template (Skills Gap Diagnosis → Curriculum Design → Training Delivery → Competency Verification → Practical Application → On-the-Job Coaching → Skills Sustainment).

### 3.4 Step 3 — Governance (M2)

Permission Matrix and the Governance Setting stay unchanged tenant-wide.

### 3.5 Step 4 — Charters for This Program (M19)

| Charter | Accountable (this program) | Review cadence |
|---|---|---|
| CHTR-01 Sponsorship / Leadership Charter | Fouad Belghazi (ES) | Per Phase Gate |
| CHTR-03 Communication Charter | Houda Amrani (CM) | Per communication wave |
| CHTR-04 Organizational Impact Charter | Houda Amrani (CM) | On scope change |
| CHTR-08 Pulse / Interview Charter | Houda Amrani (CM) | Per phase gate + ad hoc |

### 3.6 Setup Checklist

- [ ] Base tenant confirmed (Bouregreg Group, Bouregreg Manufacturing Maroc Organization)
- [ ] Skills program team accounts created — Section 3.2
- [ ] CM Project created, Lewin opened at Unfreeze — Section 3.3
- [ ] TPL-TSD-7 phase template loaded on M17 — Section 3.3
- [ ] Four applicable Charters reviewed and accountable owners confirmed — Section 3.5

With this checklist complete, Part 4 runs the program forward, week by week.


## Part 4 — Week-by-Week Skills Timeline: Normal Flow and Exceptions

Part 3 ended with Plant Digital Skills Upskilling Program registered and its Lewin phase opened at Unfreeze, program Week 1 — org-calendar Week 16, since this program starts once the underlying skills gap becomes visible rather than at the tenant's own founding. Every one of the program's 43 individual weeks is listed on its own row, so a reader can see exactly which week a framework reading, a phase transition, or an exception is active in.

### 4.1 Normal Flow, Phase by Phase

#### Phase 1 — Skills Gap Diagnosis (Weeks 1–7)

Establishes exactly what digital and systems skills gap exists across plant-floor staff at Kenitra and Settat, independent of any specific system rollout.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 1** | Tarik Benjelloun holds program kickoff; confirms Fouad Belghazi's sponsorship and the program's standalone, non-go-live-anchored scope. | Houda Amrani briefs the team on the business driver — a skills gap identified independently of the ERP program, accelerated once that program made it visible. | M1 (Hierarchy) — verify the CM Project record matches the kickoff agreement. | — | — |
| **Week 2** | Set the program's own 43-week schedule; confirm the deliberate month-long stagger behind the ERP program's own Train phase. | — | M17 (WBS & Gantt) — baseline schedule loaded from TPL-TSD-7. | — | — |
| **Week 3** | Begin the plant-floor skills assessment at Kenitra. | Baseline ADKAR pulse for Kenitra plant-floor staff. | M5 (ADKAR Engine) — Awareness 2, Ability 1. | — | — |
| **Week 4** | Continue the skills assessment at Kenitra; begin at Settat. | — | M21 — routine log. | — | — |
| **Week 5** | Continue the skills assessment at Settat. | Map stakeholder cohorts across both plants. | M4 (Stakeholder Mapping) — "Kenitra Plant Floor," "Settat Plant Floor" cohorts logged. | — | — |
| **Week 6** | Consolidate skills-gap findings across both plants. *(Phase 2 also begins this week.)* | — | M21 (Field Notes) — Category: Decision · Title: "Skills Gap Consolidated, Both Plants." | — | — |
| **Week 7** | Confirm the Phase 1 gate: skills-gap diagnosis signed off, on schedule. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Schedule variance vs. baseline (0) |

*Phase gate: Skills Gap Diagnosis closes once the consolidated findings across Kenitra and Settat are signed off — the direct input to Phase 2's curriculum design.*

#### Phase 2 — Curriculum Design (Weeks 6–15)

Designs the specific curriculum — modules, delivery format, and AI-assisted content drafting via M16 — that closes the gaps Phase 1 found.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 6** | Begin curriculum design against the skills-gap findings. *(Phase 1 also consolidates this week.)* | — | M21 — routine log. | — | — |
| **Week 7** | Continue curriculum design. *(Phase 1 gate also closes this week.)* | — | M21 — routine log. | — | — |
| **Week 8** | Draft the initial module list — systems navigation, basic data entry, digital work instructions. | — | M21 — routine log. | — | — |
| **Week 9** | Begin AI-assisted curriculum drafting for Module 1. | — | M16 (AI Use Case Library) — AI-assisted draft, "Digital Skills Curriculum, Module 1: Systems Navigation Basics." | — | — |
| **Week 10** | Continue AI-assisted drafting for Modules 2 and 3. | — | M16 (AI Use Case Library) — AI-assisted draft, Modules 2–3. | — | — |
| **Week 11** | Review drafted content with Karima Semlali and Mustapha Idrissi for plant-floor accuracy and relevance. | — | M21 — routine log. | — | — |
| **Week 12** | Refine curriculum based on supervisor feedback. | — | M21 — routine log. | — | — |
| **Week 13** | Finalize curriculum structure. *(Phase 3 also begins this week — pilot cohort selection.)* | — | M21 — routine log. | — | — |
| **Week 14** | Run a train-the-trainer session for the delivery team. | — | M9 (Training) — Curriculum: "Train-the-Trainer, Digital Skills Program" · Cohort: "Delivery Team." | — | — |
| **Week 15** | Confirm the Phase 2 gate: curriculum design signed off, built via M16-assisted drafting. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Schedule variance vs. baseline (0) |

*Phase gate: Curriculum Design closes once the full curriculum is finalized and the delivery team is trained — the direct input to Phase 3's pilot and full-plant delivery.*

#### Phase 3 — Training Delivery (Weeks 13–29)

Delivers the finalized curriculum, first to a pilot cohort for validation, then in full across both plants — deliberately staggered a month behind the ERP program's own Train phase so the two curricula never compete for the same plant-floor hours.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 13** | Select the pilot cohort — a 40-person subset of Kenitra plant-floor staff. *(Phase 2 also finalizes structure this week.)* | — | M21 — routine log. | — | — |
| **Week 14** | Confirm delivery-team readiness ahead of pilot delivery. *(Train-the-trainer also logged under Phase 2 this week.)* | — | M21 — routine log. | — | — |
| **Week 15** | Begin pilot cohort delivery — Module 1. *(Phase 2 gate also closes this week.)* | — | M9 (Training) — Curriculum: "Module 1: Systems Navigation Basics" · Cohort: "Kenitra Pilot." | — | — |
| **Week 16** | Pilot cohort delivery — Module 2. | — | M9 (Training) — Curriculum: "Module 2: Digital Data Entry" · Cohort: "Kenitra Pilot." | — | — |
| **Week 17** | Pilot cohort delivery — Module 3. | Gather pilot cohort feedback. | M9 (Training) — Curriculum: "Module 3: Digital Work Instructions" · Cohort: "Kenitra Pilot." | — | — |
| **Week 18** | Pilot cohort completes delivery. | — | M21 — routine log. | — | — |
| **Week 19** | Consolidate pilot cohort feedback. | — | M21 (Field Notes) — Category: Decision · Title: "Pilot Feedback Consolidated." | — | — |
| **Week 20** | Refine curriculum based on pilot feedback ahead of full deployment. | — | M21 — routine log. | — | — |
| **Week 21** | Finalize curriculum for full two-plant deployment. | — | M21 — routine log. | — | — |
| **Week 22** | Confirm full-deployment schedule against the one-month stagger behind the ERP program's own Train phase. | — | M21 — routine log. | — | — |
| **Week 23** | Pilot cohort validation confirmed complete. *(Phase 4 also begins this week, for the pilot cohort.)* | — | M21 (Field Notes) — Category: Milestone · Title: "Pilot Validated, Curriculum Confirmed for Full Deployment." | — | — |
| **Week 24** | Full deployment begins — Kenitra, wave 1. | — | M9 (Training) — Curriculum: "Modules 1–3, Full Curriculum" · Cohort: "Kenitra, Wave 1." | — | — |
| **Week 25** | Full deployment — Kenitra, wave 2. | — | M9 (Training) — Curriculum: "Modules 1–3, Full Curriculum" · Cohort: "Kenitra, Wave 2." | — | — |
| **Week 26** | Full deployment begins — Settat, wave 1. | — | M9 (Training) — Curriculum: "Modules 1–3, Full Curriculum" · Cohort: "Settat, Wave 1." | — | — |
| **Week 27** | Full deployment — Settat, wave 2. | — | M9 (Training) — Curriculum: "Modules 1–3, Full Curriculum" · Cohort: "Settat, Wave 2." | — | — |
| **Week 28** | Run make-up sessions for staff absent from their scheduled wave. | — | M9 (Training) — Curriculum: "Modules 1–3, Make-Up Session" · Cohort: "Kenitra, Settat." | — | — |
| **Week 29** | Confirm the Phase 3 gate: training delivery complete across both plants, on schedule against the stagger. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Schedule variance vs. baseline (0) |

*Phase gate: Training Delivery closes once every wave across both plants has completed delivery, including make-up sessions — the direct input to Phase 4's competency verification.*

#### Phase 4 — Competency Verification (Weeks 23–31)

Verifies that delivered training actually produced usable skill — a distinct check from mere attendance, run first against the pilot cohort and then against each full-deployment wave.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 23** | Begin competency verification for the pilot cohort — a hands-on systems test, not a written quiz. *(Phase 3 also confirms pilot validation this week.)* | — | M21 — routine log. | — | — |
| **Week 24** | Confirm pilot cohort competency results; refine the verification method if needed before full-deployment use. | — | M21 — routine log. | — | — |
| **Week 25** | Begin competency verification — Kenitra, wave 1. | — | M21 — routine log. | — | — |
| **Week 26** | Competency verification — Kenitra, wave 2. | — | M21 — routine log. | — | — |
| **Week 27** | Competency verification — Settat, wave 1. | — | M21 — routine log. | — | — |
| **Week 28** | Competency verification — Settat, wave 2. | — | M21 — routine log. | — | — |
| **Week 29** | Consolidate competency results across both plants. *(Phase 3 gate also closes this week.)* | — | M21 (Field Notes) — Category: Decision · Title: "Competency Results Consolidated, Both Plants." | — | — |
| **Week 30** | Address competency gaps found in the results with targeted refresher sessions. | — | M9 (Training) — Curriculum: "Targeted Refresher" · Cohort: as identified by verification results. | — | — |
| **Week 31** | Confirm the Phase 4 gate: competency verification complete, 620 staff certified competent. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Competency certification rate (target 100%) |

*Phase gate: Competency Verification closes once every trained staff member's hands-on competency is confirmed, refresher sessions included — the direct input to Phase 5's practical application.*

#### Phase 5 — Practical Application (Weeks 29–35)

Moves verified skill into real day-to-day plant-floor use — the first of two dedicated reinforcement phases this archetype builds deliberately, rather than leaving reinforcement to chance.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 29** | Begin the structured practical-application period on the floor. *(Phase 4 also continues this week.)* | — | M21 — routine log. | — | — |
| **Week 30** | Monitor real-world system use — Kenitra. | — | M21 — routine log. | — | — |
| **Week 31** | Monitor real-world system use — Settat. *(Phase 4 gate also closes this week.)* | — | M21 — routine log. | — | — |
| **Week 32** | Identify practical-application friction points from floor observation. | — | M21 (Field Notes) — Category: Risk · Title: "Practical-Application Friction Points Identified." | — | — |
| **Week 33** | Address friction points with targeted micro-coaching, ahead of the formal coaching phase. | — | M21 — routine log. | — | — |
| **Week 34** | Continue practical-application monitoring across both plants. | — | M21 — routine log. | — | — |
| **Week 35** | Confirm the Phase 5 gate: practical application complete, skill in active daily use. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Daily active system-use rate |

*Phase gate: Practical Application closes once real-world system use is confirmed as active daily practice, not just post-training competency — the direct input to Phase 6's formal coaching.*

#### Phase 6 — On-the-Job Coaching (Weeks 31–39)

Locks in the skill through supervisor-led coaching on the floor — the second of the two dedicated reinforcement phases.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 31** | Train Karima Semlali and Mustapha Idrissi as on-the-job coaches. *(Phase 5 also continues this week.)* | — | M9 (Training) — Curriculum: "Coaching the New Skill On the Floor" · Cohort: "Kenitra, Settat Supervisors." | — | — |
| **Week 32** | Begin structured coaching rounds — Kenitra. | — | M21 — routine log. | — | — |
| **Week 33** | Coaching rounds continue — Kenitra. | — | M21 — routine log. | — | — |
| **Week 34** | Begin structured coaching rounds — Settat. | — | M21 — routine log. | — | — |
| **Week 35** | Coaching rounds continue — Settat. *(Phase 5 gate also closes this week.)* | — | M21 — routine log. | — | — |
| **Week 36** | Consolidate coaching observations from both plants. | — | M21 (Field Notes) — Category: Decision · Title: "Coaching Observations Consolidated." | — | — |
| **Week 37** | Address recurring skill gaps found during coaching with a further targeted session. | — | M9 (Training) — Curriculum: "Targeted Coaching Follow-Up" · Cohort: as identified. | — | — |
| **Week 38** | Continue coaching, tapering frequency as staff demonstrate sustained independent use. | — | M21 — routine log. | — | — |
| **Week 39** | Confirm the Phase 6 gate: on-the-job coaching complete, skill reinforced under real supervision. | — | M17 (WBS & Gantt) — Phase Gate Joint Decision: **Go**. | — | Coached-staff independent-use rate |

*Phase gate: On-the-Job Coaching closes once staff demonstrate sustained independent use under supervisor observation — the direct input to Phase 7's sustainment checks.*

#### Phase 7 — Skills Sustainment (Weeks 35–43)

Confirms the skill holds without active coaching — this program's actual close, and the milestone Lewin's Refreeze reading anchors to in the absence of any go-live event.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry — What to Type In | Exception | What to Track |
|---|---|---|---|---|---|
| **Week 35** | Begin sustainment planning. *(Phase 5 gate also closes this week.)* | — | M21 — routine log. | — | — |
| **Week 36** | Define sustainment checkpoints and metrics for post-program skill retention. | — | M12 (Sustainment) — checkpoint schedule confirmed, first check Week 37. | — | — |
| **Week 37** | Run the first sustainment check — Kenitra. | — | M12 (Sustainment) — checkpoint logged, regression risk: Low. | — | — |
| **Week 38** | Run the first sustainment check — Settat. | — | M12 (Sustainment) — checkpoint logged, regression risk: Low. | — | — |
| **Week 39** | Consolidate sustainment check results across both plants. *(Phase 6 gate also closes this week.)* | — | M21 (Field Notes) — Category: Decision · Title: "First Sustainment Check Consolidated, Both Plants." | — | — |
| **Week 40** | Address any retention gaps found in the sustainment check. | — | M21 — routine log. | — | — |
| **Week 41** | Run the second sustainment check — both plants. | — | M12 (Sustainment) — checkpoint logged, regression risk: Low. | — | — |
| **Week 42** | Finalize the sustainment record ahead of program closure. | — | M21 — routine log. | — | — |
| **Week 43** | Confirm the Phase 7 gate: skills sustainment confirmed, program closes. | Close Lewin at **Refreeze**, justification: "Two consecutive sustainment checks confirm the skill holds without active coaching — the program's own milestone, in the absence of a go-live to anchor to." | M3 (Initiative Registry) — Lewin: **Refreeze**. M17 — Phase Gate Joint Decision: **Go**. | — | Two-check sustained retention rate |

*Phase gate: Skills Sustainment closes, and the program closes with it, once two consecutive checkpoints confirm the skill holds without active coaching.*
