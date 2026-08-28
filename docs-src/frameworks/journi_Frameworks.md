journi

Change Management Frameworks

*Lewin · Prosci ADKAR · Bridges' Transition Model · Kübler-Ross Change Curve*

*Definitions · Interaction · Signals & Decision Matrix · KPI/Index Formula Reference*

Version 1.0 · August 2026 · Confidential

---

<a id="part-0"></a>

## Part 0 --- Purpose and Scope

This document is journi's standalone reference for the four Change Management frameworks the platform tracks. It answers four questions in order: what each framework actually measures; how the four interact across a real program rather than in isolation; what concrete, observable signals justify moving from one state to the next, sorted into what a Change Manager must have in hand versus what merely helps; and exactly how journi's two auto-computed metrics are calculated, field by field, so a reader can reproduce or audit them without opening the source code.

Everything here is checked against journi's actual implementation, not assumed from a textbook description of the four frameworks. Where journi's own reading of a framework is a deliberate simplification of the textbook version --- as it is for Kübler-Ross --- this document says so explicitly rather than silently presenting the simplification as the standard model.

**A note on the worked example.** Part 2's illustration uses a generic Enterprise Resource Planning (ERP) platform rollout at a fictional mid-sized manufacturer. No commercial ERP product is named or implied --- the example is written to be true of any ERP implementation, on any vendor's platform, because the interaction pattern between the four frameworks does not depend on which system is being deployed.

<a id="part-1"></a>

## Part 1 --- The Four Frameworks, in Detail

journi tracks four frameworks side by side, each answering a different question at a different altitude:

| Framework | Altitude | Question it answers | Logged on |
|---|---|---|---|
| Lewin | Organizational --- one reading per project | Has the organization actually changed? | M3 (Initiative Registry) |
| Prosci ADKAR | Individual / cohort --- five scored blocks | Is each person capable of changing? | M5 (ADKAR Engine) |
| Bridges' Transition Model | Individual / cohort --- emotional position | What is each person letting go of, and have they? | M6 (Emotional & Transition Layer) |
| Kübler-Ross Change Curve | Individual / cohort --- sentiment | How does each person feel about the change right now? | M6 (Emotional & Transition Layer) |

A design choice that shapes everything downstream in this document is worth stating once, plainly: **journi never auto-computes a Lewin, Bridges, or Kübler-Ross reading.** All three are a Change Manager's evidence-based judgment call, entered directly (not inferred), and --- when Governance Settings requires it (Part 1, Step 5 of the Complete User Guide) --- accompanied by a written justification that is preserved in the project's change log. journi computes exactly two things automatically: the Composite Readiness Index and the Divergence Pattern Detector, both covered in full in Part 4. Every other reading in this document is a human call, logged, not derived.

<a id="p1-1"></a>

### 1.1 Lewin's Change Management Model

**What it measures.** A single, organization-wide reading of where the change effort stands as a whole --- the "headline" state of the project, not any one person's experience of it.

**The three stages, as journi implements them:**

- **Unfreeze.** The organization has accepted that the current state is not sustainable and mobilized to change it. In practice this means a business case exists and has been approved, the people affected have been identified and mapped, and a baseline understanding of "why now" is established --- not that anyone has started doing anything differently yet.
- **Change.** The organization is actively transitioning --- new processes, systems, or structures are being built and adopted, and the evidence for this state is technical and behavioral progress happening in parallel, not a calendar date being reached.
- **Refreeze.** The new state has stabilized and become "how things are done here" rather than a project still in motion --- support has tapered from elevated to standard, the new process shows up in ordinary performance management, and there is no longer a meaningful population still operating the old way.

**How it is logged in journi.** A single field on M3 (Initiative Registry), set directly by the Change Manager from a fixed set of three values. There is no scoring, no sub-components, and no auto-advance: the CM selects the new stage and (when required) writes a justification naming the specific evidence behind the call. That justification is preserved permanently in the project's change log alongside the old value, the new value, the date, and who made the call --- so a Lewin reading is always auditable after the fact, not just a label that silently changed.

**Why a single organizational reading, when ADKAR/Bridges/Kübler-Ross are all individual-level?** Lewin is deliberately the one reading a Steering Committee can see at a glance without reading a cohort breakdown --- the "is this program on track, broadly" signal. The individual-level frameworks exist precisely because a single organizational headline can look fine while specific cohorts are actually struggling; Part 2 covers exactly how that gap shows up and gets caught.

<a id="p1-2"></a>

### 1.2 Prosci ADKAR Model

**What it measures.** Five independently-scored blocks, each a distinct precondition for an individual (or cohort) to actually change, on a 1--5 scale:

- **Awareness** --- does the person understand why the change is happening?
- **Desire** --- do they personally want to participate and support it?
- **Knowledge** --- do they know how to change (the training, the new process)?
- **Ability** --- can they actually demonstrate the new skills or behaviors in practice, not just describe them?
- **Reinforcement** --- are there mechanisms in place (recognition, corrected metrics, manager check-ins) that make the new way stick rather than erode back to the old one?

**Why five separate blocks instead of one score.** ADKAR's whole premise is that these five are independent barriers, not stages of the same thing --- a cohort can be high on Awareness and Desire while stuck on Knowledge (they want to change but haven't been trained yet), or high on Knowledge and Ability while low on Desire (they know how, but don't want to). Averaging them into one number would erase exactly the diagnostic information ADKAR exists to surface, which is why journi scores and displays all five independently rather than collapsing them (the *average* is still computed, but only as one input to the Composite Readiness Index in Part 4 --- never as the primary way ADKAR itself is read).

**How it is logged in journi.** Each of the five blocks is scored 1--5 per cohort on M5 (ADKAR Engine), with a barrier-reason note. **A score of 2 or below on any block auto-escalates** --- journi flags it for the Change Manager without waiting for a human to notice, and (per journi's governance rule) the barrier-reason note becomes mandatory at that point, not optional, so the record captures *why* the block stalled, not just that it did.

**Re-scoring.** ADKAR blocks are re-scored as evidence changes --- after a training wave, after a targeted intervention, at a phase gate --- and every re-score preserves the prior score, so a block's trajectory over the life of the project is always visible, not just its current reading.

<a id="p1-3"></a>

### 1.3 Bridges' Transition Model

**What it measures.** An individual's or cohort's emotional position in the transition, independent of whether they are technically capable of the new way of working. This is the framework that answers "have they actually let go," which a skills assessment cannot answer on its own.

**The three zones, as journi implements them:**

- **Ending** --- the person is still holding onto (or grieving) what is being replaced: the old system, the old role definition, the old way of being competent at their job.
- **Neutral Zone** --- the old way is gone or going, the new way isn't fully internalized yet; this is the disorienting middle, often the longest and least comfortable zone, and not a sign that something has gone wrong.
- **New Beginning** --- the person has genuinely taken up the new identity/way of working as their own, not merely complied with it.

**How it is logged in journi.** A single field on M6 (Emotional & Transition Layer), set directly by the Change Manager from the three zones above, with a notes field capturing what's actually being observed (e.g. "Finance team entering Neutral Zone; shop floor still in Ending") and --- when required --- a justification before the change is saved.

**Why this matters alongside ADKAR.** A cohort can score high on ADKAR's Knowledge and Ability blocks --- they can demonstrably operate the new system --- while Bridges still reads Ending, because technical competence and emotional letting-go are genuinely different things. This specific combination is common enough, and important enough to catch, that journi computes it automatically as the Divergence Pattern (Part 2.4 and Part 4.2) rather than relying on a Change Manager to notice the mismatch unaided.

<a id="p1-4"></a>

### 1.4 Kübler-Ross Change Curve

**A fidelity note before anything else:** the textbook Kübler-Ross model (adapted from grief theory) has seven stages. **journi implements a deliberately simplified four-stage reading** --- Denial, Resistance/Anger, Exploration, Commitment --- collapsing Bargaining and Depression into the broader Resistance/Anger stage and treating Acceptance and Commitment as the same terminal state. This is a genuine design simplification, not an oversight, and this document states it plainly so a reader comparing journi to the source model isn't caught by an unstated gap.

**The four stages, as journi implements them:**

- **Denial** --- "this isn't really happening" or "this won't affect me/my team specifically."
- **Resistance/Anger** --- active pushback, frustration, or grief made visible --- the person has stopped denying the change is real and is now reacting to it.
- **Exploration** --- testing the new way, asking questions, trying things out --- no longer resisting, not yet fully committed.
- **Commitment** --- genuine, durable buy-in --- the person advocates for the change rather than merely tolerating it.

**How it is logged in journi.** A single field on M6 (Emotional & Transition Layer), set directly from the four stages above via the same pattern as Bridges --- a Change Manager's explicit call, with a notes field and, when required, a justification.

**A distinct, narrower helper worth knowing about.** journi also contains a small internal function that infers a likely Kübler-Ross stage from the free-text notes field by keyword match (looking for words like "commitment," "exploration," "denial," "resistance," or "anger" in what the Change Manager typed) and defaults to Exploration if none of those words appear. **This inference is not what sets the stage a project actually carries** --- the stage itself is always the CM's direct button selection. The inference exists only as one input to the Composite Readiness Index's sentiment component, and Part 4.7 documents exactly how it behaves, including the specific case where it can silently default to a mid-range reading if the justification note happens not to contain a matching keyword.

<a id="part-2"></a>

## Part 2 --- How the Four Frameworks Interact

<a id="p2-1"></a>

### 2.1 Three Altitudes, One Program

The four frameworks are not four independent trackers running in parallel by coincidence --- they read the same underlying transformation at three different altitudes, and a well-run program expects them to move at different speeds, not in lockstep:

- **Lewin** is the single organizational headline --- the one reading a Steering Committee reads without wanting a cohort breakdown.
- **ADKAR** is where individual barriers actually surface, block by block, and where a stalled program usually shows its first hard evidence --- not a vague sense that "adoption feels slow," but a specific block, in a specific cohort, stalled at a specific score.
- **Bridges and Kübler-Ross together** track the emotional undercurrent beneath both of the above --- undercurrent that a clean Lewin reading and a clean ADKAR score can both mask entirely, because neither framework asks "how does this actually feel to the people going through it."

A program can look healthy on Lewin and ADKAR while Bridges and Kübler-Ross are telling a different story --- and that gap is not a data-quality problem to be cleaned up. It is the single most important thing a Change Manager is watching for, and it is precisely the gap the Divergence Pattern (2.4) exists to catch automatically rather than leave to be noticed by chance.

<a id="p2-2"></a>

### 2.2 The Interaction Map

The table below states, for each Lewin stage, what the other three frameworks typically read alongside it in a normally-progressing program --- and, critically, what each framework is actually *for* at that point, since the four are not simply moving in parallel for no reason.

| Lewin Stage | ADKAR Focus | Bridges Reading | Kübler-Ross Reading | What's Actually Happening |
|---|---|---|---|---|
| Unfreeze | Awareness building, moving toward Desire | Ending | Denial → Resistance/Anger | The organization is making the case for change; individuals are first hearing about it and beginning to react, not yet capable of anything new. |
| Change | Knowledge building, moving toward Ability | Ending → Neutral Zone | Resistance/Anger → Exploration | The technical build and training are happening; people are starting to try the new way while still emotionally attached to the old one --- this is where the gap between capability and readiness is widest and most consequential. |
| Refreeze | Ability solidifying into Reinforcement | Neutral Zone → New Beginning | Exploration → Commitment | The new way is becoming normal; reinforcement mechanisms (recognition, corrected metrics, manager habits) are what keep it from eroding back, and the emotional frameworks are confirming the technical capability is actually sticking, not just present on paper. |

**The two gaps this map exists to make visible.** First, the **capability-versus-readiness gap** within the Change stage --- Knowledge and Ability can climb months before Bridges and Kübler-Ross catch up, and that lag is normal, not a fault, provided it is being watched rather than assumed away. Second, the **calendar-versus-evidence gap** at the Refreeze transition --- a technical go-live date is not evidence that the organization has emotionally arrived at New Beginning/Commitment, and calling Refreeze on the date alone rather than on Bridges/Kübler-Ross evidence is the single most common way this interaction goes wrong in practice (Part 2.3 walks through exactly this).

<a id="p2-3"></a>

### 2.3 Worked Example --- An ERP Platform Rollout

Consider a mid-sized manufacturer, roughly 3,000 employees across a headquarters and two plants, replacing three disconnected legacy systems with one unified ERP platform (no vendor named --- the pattern below holds regardless of which platform is chosen). The rollout runs a typical eight-phase lifecycle: Discovery, Design, Build, Test, Train, Deploy, Hypercare, Sustain.

**Discovery.** The business case is built and the Stakeholder Map is populated. Lewin is set to **Unfreeze**, justified by the approved business case and completed stakeholder analysis --- not by any technical work having started, because none has. ADKAR's Awareness block has not been scored yet; there is no cohort to score until Design's kickoff communications reach them. Bridges reads **Ending** for every cohort by default (no one has begun letting go of anything, because nothing has visibly changed yet), and Kübler-Ross reads **Denial** for the same reason.

**Design and early Build.** Kickoff communications land, and the first Awareness scores come in --- typically uneven across sites: a headquarters function close to the program team often scores Awareness higher, early, than a plant floor cohort several communication layers removed. This unevenness is normal and expected, not a red flag on its own. As configuration work begins, Knowledge scores start to climb for cohorts directly involved in design workshops, while Bridges for those same cohorts often has not moved from Ending yet --- they understand what's changing intellectually before they've emotionally let go of the old process, and that lag is exactly what Section 2.2's capability-versus-readiness gap describes in the abstract.

**Build and Test.** This is where the **Divergence Pattern** (2.4) most often fires for the first time: a cohort close to the program team --- frequently finance or another function with above-average exposure to the new system during testing --- reaches Knowledge and Ability scores of 4 or higher while Bridges still reads exactly Ending. The temptation is to read the high ADKAR scores as "this cohort is ready" and move on. journi's Divergence Pattern computation exists specifically to interrupt that read: high capability with an unmoved Bridges reading is not readiness, it is a person who can operate the new system while still grieving the old one, and the recommended response is a targeted, loss-focused conversation --- not more training, since more training addresses a gap that isn't actually the one present.

**Deploy.** Cutover happens on a fixed date: legacy systems are frozen, data is migrated, the new platform goes live. This is where the **calendar-versus-evidence gap** from 2.2 shows up hardest: the technical go-live is real and dateable, but it is not, by itself, evidence for Lewin's Refreeze. The disciplined move is to mark Lewin as **Change, provisional toward Refreeze** --- explicit about what's confirmed (the cutover) and what's still pending (the emotional evidence) --- rather than calling Refreeze on the go-live date and being wrong.

**Hypercare.** Elevated support continues while Bridges and Kübler-Ross are re-pulsed on a fixed cadence (commonly at the two-week and four-week marks post-go-live) specifically to confirm or correct the provisional Refreeze call. A defect discovered during this window --- even a minor one --- can cause a real, temporary regression in Kübler-Ross sentiment for the cohort affected by it; recognizing that regression as a contained, explainable dip tied to a specific incident (rather than treating it as the whole program stalling) is what keeps a Change Manager from over-reacting to normal noise in the data.

**Sustain.** Refreeze is confirmed only once Bridges and Kübler-Ross re-pulses across all affected cohorts actually show New Beginning and Commitment, and reinforcement mechanisms (recognition, corrected KPIs, manager check-in habits) are verified running rather than assumed. A checkpoint cadence (commonly at 30/60/90 days post-go-live) exists precisely to catch a **Reinforcement gap** --- ADKAR's Reinforcement block reading low even after the other four blocks are healthy, meaning the new behavior hasn't yet been given a durable, structural reason to persist. Refreeze is not confirmed until that gap, if present, is closed.

<a id="p2-4"></a>

### 2.4 The Divergence Pattern --- The Interaction's Signature Failure Mode

Every interaction described above ultimately funnels into one specific, catchable failure mode, and it is worth naming as its own concept: **strong demonstrated capability (ADKAR Knowledge and Ability) coexisting with an unmoved emotional position (Bridges still reading Ending).** It is the single most common way a program's four framework readings genuinely diverge from each other rather than moving together, and it is common enough, and consequential enough, that journi computes it automatically rather than relying on a Change Manager to notice the specific combination by eye across a busy dashboard. Part 4.2 gives the exact formula, and Part 3 gives the signal-level detail behind each framework's own state calls.

<a id="part-3"></a>

## Part 3 --- Signals Catalog and Decision Matrix

<a id="p3-1"></a>

### 3.1 How to Read This Catalog

For each framework state, this catalog lists the concrete, observable evidence a Change Manager should have before calling that state --- split into **Must Have** (the call should not be made without this) and **Nice to Have** (strengthens the call; its absence is not disqualifying on its own). Every signal has an ID, a name, and a detailed description of what "present" actually looks like in practice, not just a label.

This catalog is journi's own judgment framework, built from how the platform's fields, auto-escalation rules, and phase-gate mechanics actually work (Parts 1 and 2) --- it is not a separate data model inside the app. A Change Manager applies it manually when writing the justification a Lewin, Bridges, or Kübler-Ross change requires; nothing here is auto-checked by journi itself, consistent with the platform's design choice never to auto-compute these three frameworks.

<a id="p3-2"></a>

### 3.2 Lewin Signals

**Unfreeze**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-LEW-U1 | Approved business case | Must Have | A quantified case for change exists and has been reviewed and approved by the Steering Committee --- not drafted, approved. Logged on M1 (Hierarchy) against the Main Project. |
| SIG-LEW-U2 | Completed Stakeholder Map | Must Have | Every affected cohort is entered on M4 (Stakeholder Mapping) with an impact dimension and severity rating --- not a partial list covering only the most visible groups. |
| SIG-LEW-U3 | Named Executive Sponsor | Must Have | A specific individual, not a title or committee, is recorded as Executive Sponsor and has taken at least one visible sponsorship action (M7, Sponsor & Coalition). |
| SIG-LEW-U4 | Baseline Awareness pulse | Nice to Have | An initial Awareness score exists for at least the highest-severity cohorts on M5 (ADKAR Engine) --- confirms the "why now" message has actually reached people, not just been sent. |
| SIG-LEW-U5 | Guiding coalition beyond the sponsor | Nice to Have | At least one additional coalition member beyond the named sponsor is recorded on M7, reducing single-person dependency on the change's momentum. |

**Change**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-LEW-C1 | Design principles signed off | Must Have | The constraints the build must satisfy are documented and formally approved, not merely drafted or verbally agreed. |
| SIG-LEW-C2 | Configuration/build traceable to principles | Must Have | Each major build decision is logged against the specific design principle it satisfies (M17, WBS & Gantt) --- a build with no recorded rationale is not evidence of a disciplined Change stage. |
| SIG-LEW-C3 | ADKAR Desire trending upward, all cohorts | Must Have | No cohort remains below the platform's stall threshold on Desire without an active, logged recovery response --- a stalled Desire block left unaddressed means "Change" is not actually happening for that population, whatever the rest of the project shows. |
| SIG-LEW-C4 | Champion network active | Nice to Have | Champions are named, briefed, and have a confirmed observation-logging path (M4) --- strengthens the evidence base for everything else in this list without being independently required. |
| SIG-LEW-C5 | No open High/Critical technical defect | Nice to Have | Outstanding defects at Critical or High severity are closed or have an accepted mitigation --- relevant to Change because unresolved technical instability makes emotional and capability evidence harder to read cleanly, not because it's itself a Change Management signal. |

**Refreeze**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-LEW-R1 | Bridges reads New Beginning, all affected cohorts | Must Have | Not the organizational average --- every cohort with meaningful exposure to the change, confirmed via re-pulse, not assumed from an early reading. |
| SIG-LEW-R2 | Kübler-Ross reads Exploration or better, all affected cohorts | Must Have | Commitment is the target; Exploration is the acceptable floor for calling Refreeze, provided the trend is upward, not flat or regressing. |
| SIG-LEW-R3 | ADKAR Reinforcement score above stall threshold | Must Have | Reinforcement is the block most likely to lag the other four --- confirming it explicitly prevents a premature Refreeze call based only on Knowledge/Ability having been healthy for a while. |
| SIG-LEW-R4 | Reinforcement mechanisms verified running, not assumed | Must Have | Recognition programs, corrected performance metrics, and manager check-in habits are confirmed actually happening (e.g. via a supervisor sign-off log), not inferred from having been designed. |
| SIG-LEW-R5 | Legacy system access formally revoked | Nice to Have | Confirms there is no remaining fallback path making a return to the old way physically possible --- a strong but not strictly required signal, since some programs run a deliberate parallel period. |
| SIG-LEW-R6 | Multiple consecutive healthy sustainment checkpoints | Nice to Have | Two or more checkpoints (e.g. 30/60/90-day) reading healthy in sequence, not just the most recent one --- guards against calling Refreeze on a single good data point. |

<a id="p3-3"></a>

### 3.3 ADKAR Signals

Because ADKAR's five blocks are independently scored, the signals below apply per block, per cohort --- not once per project.

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-ADK-A1 | Score ≥ 3 on the block being assessed | Must Have | The block's numeric score itself, direct from M5 (ADKAR Engine) --- the foundational signal every other one on this list contextualizes. |
| SIG-ADK-A2 | Barrier-reason note present for any score ≤ 2 | Must Have | Mandatory the moment a block auto-escalates --- a stalled score with no logged reason is an incomplete record, not just a low score. |
| SIG-ADK-A3 | Re-score after an intervention, not just an initial read | Must Have (for a stalled block being called recovered) | A block that stalled and is now being treated as resolved needs a second, later score confirming the intervention worked --- the initial low score followed immediately by "fixed" with no re-measurement is not evidence of recovery. |
| SIG-ADK-A4 | Score trend upward over at least two readings | Nice to Have | A single good score is weaker evidence than a confirmed upward trend across two or more measurements over time. |
| SIG-ADK-A5 | Consistent scoring across comparable cohorts | Nice to Have | Similar cohorts (e.g. two plants doing the same job) reading similarly on the same block --- a large unexplained gap between comparable cohorts is worth investigating even if neither individual score has stalled. |

<a id="p3-4"></a>

### 3.4 Bridges Signals

**Ending**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-BRG-E1 | Explicit note naming what is being let go of | Must Have | The notes field names the specific thing (a role, a system, a way of working) rather than a generic "resistance is present" --- Ending is defined by loss, and the loss should be nameable. |
| SIG-BRG-E2 | No premature advance to Neutral Zone without cause | Nice to Have | A cohort that has not yet had a concrete reason to start letting go (a communication, a training session, a visible technical change) should not be marked past Ending on optimism alone. |

**Neutral Zone**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-BRG-N1 | A specific triggering event is named | Must Have | Something concretely happened that moved the cohort out of Ending --- a training wave, a go-live, a direct conversation --- named in the notes, not inferred from time having passed. |
| SIG-BRG-N2 | Disorientation/questions logged as expected, not alarming | Nice to Have | Confusion and questions during Neutral Zone are the expected texture of this stage, not evidence something has gone wrong --- logging them as such keeps the record honest rather than falsely reassuring. |

**New Beginning**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-BRG-B1 | Voluntary advocacy or teaching behavior observed | Must Have | The person is observed helping others adopt the change, not merely complying themselves --- the clearest behavioral evidence Bridges has genuinely completed, distinct from ADKAR capability. |
| SIG-BRG-B2 | Confirmed via re-pulse, not a single observation | Must Have | One good moment is not the same as a confirmed state --- New Beginning is confirmed on a second, later read agreeing with the first. |
| SIG-BRG-B3 | No coexisting Divergence Pattern flag | Nice to Have | The absence of an open ALT-001 (Divergence Pattern Detected) flag for this cohort strengthens confidence that the New Beginning call reflects genuine alignment between capability and emotional position. |

<a id="p3-5"></a>

### 3.5 Kübler-Ross Signals

**Denial**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-KR-D1 | Direct statements minimizing personal relevance | Must Have | Comments to the effect of "this won't really change how I work" or "this always gets cancelled" --- the defining texture of Denial, and worth quoting directly in the notes field rather than paraphrased. |

**Resistance/Anger**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-KR-R1 | Active, specific pushback --- not passive disengagement | Must Have | Named objections, complaints, or visible frustration --- distinguishes genuine Resistance/Anger from a cohort that has simply gone quiet, which is a different (and often more concerning) signal not well captured by this stage alone. |
| SIG-KR-R2 | The specific driver of the resistance is identified | Nice to Have | Naming *what* is driving the reaction (role security, workload, loss of autonomy) turns a Resistance/Anger reading into something a Change Manager can actually respond to, rather than a label alone. |

**Exploration**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-KR-X1 | Questions have shifted from "why" to "how" | Must Have | The content of what people are asking has moved from justifying the change to operating within it --- the clearest linguistic marker that Denial and Resistance/Anger have genuinely passed. |
| SIG-KR-X2 | Voluntary use of the new system/process observed | Nice to Have | Using the new way when not strictly required to yet is stronger evidence of Exploration than compliance-only usage. |

**Commitment**

| ID | Name | Type | Detailed Description |
|---|---|---|---|
| SIG-KR-C1 | Unprompted positive advocacy to peers | Must Have | The person is observed recommending or defending the change to others without being asked --- the sentiment-side equivalent of Bridges' New Beginning advocacy signal, and the two should generally agree. |
| SIG-KR-C2 | Sustained over multiple pulses, not a single high point | Must Have | A single enthusiastic moment (e.g. right after a successful go-live) is not the same as durable Commitment --- confirmed only once it holds across a second, later pulse. |
| SIG-KR-C3 | Agreement with the cohort's Bridges reading | Nice to Have | Commitment alongside a Bridges reading still at Neutral Zone (rather than New Beginning) is not necessarily wrong, but is worth a second look --- the two frameworks usually, though not always, move together at this end state. |

<a id="p3-6"></a>

### 3.6 Master Decision Matrix

The matrix below states the minimum evidence bar for each framework's state transitions in one place --- the "Must Have" columns are non-negotiable; the "Nice to Have" column states how many are recommended to support the call, without being individually required.

| Framework | Transition | Must-Have Signals Required | Nice-to-Have Recommended | Who Makes the Call |
|---|---|---|---|---|
| Lewin | → Unfreeze | SIG-LEW-U1, U2, U3 (all 3) | 1 of 2 (U4, U5) | Change Manager, reviewed with Steering Committee |
| Lewin | → Change | SIG-LEW-C1, C2, C3 (all 3) | 1 of 2 (C4, C5) | Change Manager, reviewed with Steering Committee |
| Lewin | → Refreeze | SIG-LEW-R1, R2, R3, R4 (all 4) | 1 of 2 (R5, R6) | Change Manager, reviewed with Steering Committee |
| ADKAR | Any block scored ≥ 3 | SIG-ADK-A1 | A4, A5 both strengthen but neither is required | Change Manager |
| ADKAR | Stalled block called recovered | SIG-ADK-A1, A2, A3 (all 3) | A4 | Change Manager |
| Bridges | → Ending (baseline) | SIG-BRG-E1 | E2 | Change Manager |
| Bridges | → Neutral Zone | SIG-BRG-N1 | N2 | Change Manager |
| Bridges | → New Beginning | SIG-BRG-B1, B2 (both) | B3 | Change Manager |
| Kübler-Ross | → Denial (baseline) | SIG-KR-D1 | --- | Change Manager |
| Kübler-Ross | → Resistance/Anger | SIG-KR-R1 | R2 | Change Manager |
| Kübler-Ross | → Exploration | SIG-KR-X1 | X2 | Change Manager |
| Kübler-Ross | → Commitment | SIG-KR-C1, C2 (both) | C3 | Change Manager |

**Reading the matrix.** A transition backed by every listed Must-Have signal but zero Nice-to-Haves is a *defensible* call --- it will withstand a later audit of the change log. A transition missing even one Must-Have is not ready to log yet, regardless of how many Nice-to-Haves are present; Nice-to-Have signals exist to strengthen an already-defensible call, not to substitute for a missing one.

<a id="part-4"></a>

## Part 4 --- KPI and Index Formula Reference

<a id="p4-1"></a>

### 4.1 Composite Readiness Index

| Field | Value |
|---|---|
| **ID** | KPI-01 |
| **Name** | Composite Readiness Index |
| **Inputs** | (1) Average of the 5 ADKAR block scores for the project/cohort in scope, each 1--5. (2) The project's current Kübler-Ross sentiment reading, mapped to a percentage via KPI-07 (Part 4.7). (3) The average completion percentage across all logged training records for the project. |
| **Formula** | `Index = round( (ADKAR_avg / 5 × 100) × 0.50 + Sentiment_pct × 0.25 + Training_completion_avg × 0.25 )`, where `Sentiment_pct` comes from the fixed mapping Denial = 20, Resistance/Anger = 40, Exploration = 70, Commitment = 100. Result is an integer, 0--100. |
| **Why this design** | ADKAR carries the majority weight (50%) because it is the most granular, most frequently re-measured input and the one most directly under a Change Manager's influence week to week. Sentiment and Training Completion split the remainder evenly (25% each) as corroborating, slower-moving signals --- present so a cohort with strong ADKAR scores but genuinely poor sentiment, or strong scores with training still incomplete, doesn't read as fully ready on ADKAR alone. |
| **Worked example** | ADKAR block scores 4, 3, 4, 3, 3 → average 3.4 → 68%. Sentiment reads Exploration → 70%. Training completion averages 82%. Index = round(68 × 0.50 + 70 × 0.25 + 82 × 0.25) = round(34 + 17.5 + 20.5) = **72**. |
| **Where to see it** | M14 (Analytics), as the primary readiness figure per project; also surfaced on the Portfolio Dashboard rolled up across projects, and referenced by Phase Gate records (M17) as a snapshot value captured at each gate. |

<a id="p4-2"></a>

### 4.2 Divergence Pattern Detector

| Field | Value |
|---|---|
| **ID** | KPI-02 (alert ALT-001) |
| **Name** | Divergence Pattern Detected |
| **Inputs** | (1) ADKAR Knowledge block score. (2) ADKAR Ability block score. (3) Current Bridges reading. |
| **Formula** | Fires when `Knowledge_score ≥ 4 AND Ability_score ≥ 4 AND Bridges == "Ending"`. Boolean, not a scored index --- the alert either fires for a given individual/cohort or it doesn't. |
| **Why this design** | The threshold is deliberately set at 4, not 3, on both ADKAR blocks --- a stricter bar than the general "healthy" reading of 3+ used elsewhere in the platform (see the note in 4.2's related-metric callout below), because the alert is meant to catch a genuinely striking mismatch (near-maximum demonstrated capability alongside zero emotional movement), not a borderline one that would fire too often to stay meaningful. Requiring Bridges to read *exactly* Ending, rather than "not yet New Beginning," keeps the alert scoped to the specific, actionable case --- a cohort already in Neutral Zone is progressing, even if slowly, and doesn't need the same intervention. |
| **Worked example** | A UAT participant scores Knowledge = 4 and Ability = 4 after a strong testing session, while their Bridges reading (last set three weeks earlier, before UAT began) still shows Ending. The alert fires. The recommended response is a loss-focused conversation, not additional training --- the gap here is not capability. |
| **Where to see it** | The Notification Center (bell icon, top bar) as ALT-001; also computed as a softer, phase-gate-facing flag (threshold 3, not 4, on both ADKAR blocks --- see the note below) surfaced as an open flag on M17 (WBS & Gantt) Phase Gate records. |
| **A related metric worth distinguishing** | journi actually computes this pattern at two thresholds for two different audiences: the strict version above (Knowledge/Ability ≥ 4) drives the real-time ALT-001 notification, while a softer version (Knowledge/Ability ≥ 3, same Bridges = Ending condition) auto-populates as a suggested open flag when a Program/Project Manager opens a new Phase Gate record --- worth knowing both exist, since they can legitimately disagree (a cohort at Knowledge/Ability = 3 will show on a Phase Gate flag without ever triggering the ALT-001 notification). |

<a id="p4-3"></a>

### 4.3 ADKAR Block Stall Flag

| Field | Value |
|---|---|
| **ID** | KPI-03 |
| **Name** | ADKAR Block Stall Flag |
| **Inputs** | A single ADKAR block's current score, 1--5. |
| **Formula** | `Stalled = (score ≤ 2)`. Boolean, evaluated independently per block, per cohort. |
| **Why this design** | The threshold is set at 2, not 1, deliberately erring toward over-flagging rather than under-flagging --- a score of 2 ("barely present") is treated as needing intervention now rather than waiting for it to fall all the way to 1 ("absent") before acting, since by the time a block reads 1 the barrier has typically been present, unaddressed, for longer than ideal. |
| **Worked example** | A cohort's Desire block is scored 2 following a reorganization rumor. The flag fires immediately, and journi requires a barrier-reason note before the score can be saved --- the record captures not just that Desire stalled, but the specific driver (in this case, role-security concern). |
| **Where to see it** | M5 (ADKAR Engine), as a visual flag directly on the stalled block; feeds the stalled-block count shown on M11 (Manager as Coach)'s team heatmap. |

<a id="p4-4"></a>

### 4.4 Risk Severity Score

| Field | Value |
|---|---|
| **ID** | KPI-04 |
| **Name** | Risk Severity Score |
| **Inputs** | A logged risk's Likelihood rating (1--5) and Impact rating (1--5). |
| **Formula** | `Severity = Likelihood × Impact`. Range 1--25. `High severity = Severity ≥ 12`. |
| **Why this design** | A simple product, not a weighted formula, deliberately --- Change Management risk scoring benefits from being immediately explainable to a Steering Committee without a formula to defend; a 5×5 grid is a widely understood shape, and the ≥12 threshold for "high" sits just above the grid's median (a 3×4 or 4×3 combination), catching risks that are meaningfully above average on either dimension without requiring both to be extreme. |
| **Worked example** | A risk ("plant-floor cohort rejects new inventory workflow due to speed concerns") rated Likelihood 4, Impact 3 → Severity = 12 → flagged High. |
| **Where to see it** | M13 (Risk Register), sorted by Severity descending by default; High-severity risks surface on the Portfolio Dashboard's risk summary. |

<a id="p4-5"></a>

### 4.5 High-Impact / Low-Influence Stakeholder Flag

| Field | Value |
|---|---|
| **ID** | KPI-05 |
| **Name** | High-Impact / Low-Influence Stakeholder Flag |
| **Inputs** | A stakeholder/cohort's five impact-dimension ratings (Process, Technology, Role, Location, Identity, each 1--5) and its Influence rating (1--5). |
| **Formula** | `avg_impact = (process + tech + role + location + identity) / 5`. `Flagged = (avg_impact ≥ 3.6 AND influence ≤ 2)`. |
| **Why this design** | This flag exists to surface exactly the cohort a change program is most likely to under-serve: one being changed a great deal (high average impact across all five dimensions, not just one) while having little formal say in how the change is designed (low influence). The 3.6 threshold sits above the midpoint of the 1--5 scale deliberately, so the flag catches cohorts genuinely heavily affected across the board rather than moderately affected on one dimension alone; ≤2 on Influence catches anyone with materially below-average voice in the process. |
| **Worked example** | A plant-floor cohort rates Process 5, Technology 4, Role 4, Location 3, Identity 2 → average 3.6 → meets the impact bar. Influence rated 2 (informed, not consulted). Flagged. |
| **Where to see it** | M4 (Stakeholder Mapping), as a badge on the affected cohort's card; used as an input when prioritizing which cohorts get direct engagement (town halls, listening sessions) versus broadcast-only communication. |

<a id="p4-6"></a>

### 4.6 Training Completion Average

| Field | Value |
|---|---|
| **ID** | KPI-06 |
| **Name** | Training Completion Average |
| **Inputs** | The completion percentage of every training record logged against the project. |
| **Formula** | `Average = sum(completion_pct for each training) / count(trainings)`. Simple arithmetic mean; a project with no logged trainings yet reads 0, not undefined. |
| **Why this design** | An unweighted average is deliberate --- weighting by cohort size or curriculum length would make the figure harder to reconcile by eye against the individual training records it's built from, and Training Completion is meant to be a fast corroborating signal for KPI-01, not a precision metric in its own right. |
| **Worked example** | Three logged curricula at 100%, 70%, and 40% completion → average = (100+70+40)/3 = **70%**. |
| **Where to see it** | M9 (Training), as a summary figure across all curricula for the project; feeds directly into KPI-01's Composite Readiness Index calculation. |

<a id="p4-7"></a>

### 4.7 Sentiment Stage Inference (internal helper)

| Field | Value |
|---|---|
| **ID** | KPI-07 |
| **Name** | Sentiment Stage Inference |
| **Inputs** | The free-text justification note most recently written when the project's Kübler-Ross reading was last saved. |
| **Formula** | Keyword match against the note text, checked in this order, first match wins: contains "commitment" → Commitment; else contains "exploration" → Exploration; else contains "denial" → Denial; else contains "resistance" or "anger" → Resistance/Anger; **else → Exploration (default)**. |
| **Why this design** | This is not a general-purpose classifier and is not presented to a user as one --- it exists solely to give KPI-01's sentiment component a percentage to work with, cheaply, without a separate data model. It deliberately does **not** read the actual Kübler-Ross stage field the Change Manager explicitly selected (Part 1.4) --- it re-derives a stage from the justification note's wording instead. This is the one place in this document where a documented behavior is worth flagging as a genuine sharp edge rather than a considered design tradeoff: if a Change Manager selects Commitment as the stage but writes a justification note that happens not to contain any of the four keywords above, KPI-07 silently returns Exploration (70%) rather than Commitment (100%) for the Index calculation --- the stage shown on M6 and the stage used inside KPI-01 can disagree. |
| **Worked example** | A Change Manager sets the stage to Commitment and writes: "Team is fully bought in and advocating for the new process to peers." No keyword match (the word "commitment" itself isn't in the note) → KPI-07 returns Exploration → KPI-01 uses 70%, not the 100% the selected stage would suggest. Writing the note as "Team has reached commitment --- fully bought in and advocating to peers" avoids the mismatch. |
| **Where to see it** | Not surfaced directly in any module's UI --- it runs internally as part of KPI-01's calculation on M14 (Analytics). The Kübler-Ross stage a user actually sees and sets is always the direct field on M6, described in Part 1.4. |

---

<a id="appendix"></a>

## Appendix --- Quick ID Index

| ID Range | What It Covers |
|---|---|
| SIG-LEW-U1 -- U5 | Lewin, Unfreeze signals |
| SIG-LEW-C1 -- C5 | Lewin, Change signals |
| SIG-LEW-R1 -- R6 | Lewin, Refreeze signals |
| SIG-ADK-A1 -- A5 | ADKAR signals (apply per block, per cohort) |
| SIG-BRG-E1 -- E2 | Bridges, Ending signals |
| SIG-BRG-N1 -- N2 | Bridges, Neutral Zone signals |
| SIG-BRG-B1 -- B3 | Bridges, New Beginning signals |
| SIG-KR-D1 | Kübler-Ross, Denial signal |
| SIG-KR-R1 -- R2 | Kübler-Ross, Resistance/Anger signals |
| SIG-KR-X1 -- X2 | Kübler-Ross, Exploration signals |
| SIG-KR-C1 -- C3 | Kübler-Ross, Commitment signals |
| KPI-01 | Composite Readiness Index |
| KPI-02 (ALT-001) | Divergence Pattern Detector |
| KPI-03 | ADKAR Block Stall Flag |
| KPI-04 | Risk Severity Score |
| KPI-05 | High-Impact / Low-Influence Stakeholder Flag |
| KPI-06 | Training Completion Average |
| KPI-07 | Sentiment Stage Inference (internal helper to KPI-01) |
