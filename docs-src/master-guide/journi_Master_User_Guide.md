**journi**

**The Complete User Guide**

*Tenant Setup · All 20 Modules · All 16 End-to-End Processes · A Change Management Scenario Library*

*A Single Running Organization, Followed From Tenant Creation to Sustainment*

Version 1.0 · August 2026 · Confidential

---

## Table of Contents

- [Part 0 --- Purpose and How to Use This Guide](#part-0)
- [Part 1 --- Tenant and Admin Setup](#part-1)
  - [1.1 journi's Tenant Model](#p1-1)
  - [1.2 The Scenario Organization: Bouregreg Group](#p1-2)
  - [1.3 Step 1 --- First Access and the License Record (M2)](#p1-3)
  - [1.4 Step 2 --- Building the Group / Organization Hierarchy (M1)](#p1-4)
  - [1.5 Step 3 --- Creating User Accounts and Scopes (M2)](#p1-5)
  - [1.6 Step 4 --- The Permission Matrix (M2)](#p1-6)
  - [1.7 Step 5 --- Governance Settings (M2)](#p1-7)
  - [1.8 Step 6 --- Creating the First Main Project and CM Project (M1)](#p1-8)
  - [1.9 Tenant Setup Checklist](#p1-9)
- [Part 1B --- Week-by-Week ERP Implementation Timeline: Normal Flow and Exceptions](#part-1b)
  - [1B.1 How the Four Frameworks Actually Read in journi](#p1b-1)
  - [1B.2 The 60-Week Program Calendar](#p1b-2)
  - [1B.3 Phase-by-Phase Playbook (Normal Flow)](#p1b-3)
    - [Phase 1 --- Discovery (W1--8)](#phase-1)
    - [Phase 2 --- Design (W6--14)](#phase-2)
    - [Phase 3 --- Build (W12--30)](#phase-3)
    - [Phase 4 --- Test (W28--38)](#phase-4)
    - [Phase 5 --- Train (W30--42)](#phase-5)
    - [Phase 6 --- Deploy (W43)](#phase-6)
    - [Phase 7 --- Hypercare (W43--50)](#phase-7)
    - [Phase 8 --- Sustain (W48--60+)](#phase-8)
  - [1B.4 Six Exception Scenarios, in Detail](#p1b-4)
    - [E1 --- Desire Stall at Settat](#exc-e1)
    - [E2 --- Divergence Pattern at UAT](#exc-e2)
    - [E3 --- Two-Clock Problem at Deploy](#exc-e3)
    - [E4 --- Sentiment Regression During Hypercare](#exc-e4)
    - [E5 --- Reinforcement Gap at Sustain](#exc-e5)
    - [E6 --- Cohort Divergence Across Sites](#exc-e6)
  - [1B.5 What to Track, by Cadence](#p1b-5)
  - [1B.6 The Program, Month by Month](#p1b-6)
- [Part 2 --- Module-by-Module Feature Tour](#part-2)
- [Part 3 --- All 16 End-to-End Process Walkthroughs](#part-3)
- [Part 4 --- Change Management Scenario Library](#part-4)
- [Part 5 --- Alerts and Analytics Reference](#part-5)
- [Appendix --- Quick Reference](#appendix)

---

<a id="part-0"></a>

## Part 0 --- Purpose and How to Use This Guide

### What this guide is

This is journi's single comprehensive reference: one guide that starts at a genuinely empty tenant, walks through every one of journi's 20 modules, exercises all 16 processes in the End-to-End Process Catalogue, and hosts a library of distinct Change Management scenarios so a reader can see how journi behaves across more than one kind of change --- not only a large technology rollout.

It is organized in five parts:

- **Part 1 --- Tenant and Admin Setup.** How a brand-new journi tenant is actually built, from the License record through the first Change Management Project, using a new scenario organization created for this guide: **Bouregreg Group**, a Moroccan manufacturing group.
- **Part 1B --- Week-by-Week ERP Implementation Timeline.** The Bouregreg ERP Adoption Program run forward week by week for its full 60-week duration, across all four frameworks' real stage vocabulary, in journi's own 8-phase ERP structure --- normal flow first, then six realistic exception scenarios in the same level of detail.
- **Part 2 --- Module-by-Module Feature Tour.** All 20 modules, each demonstrated against Bouregreg Group's real, growing data set, with CRUD and RBAC behavior called out per role.
- **Part 3 --- All 16 End-to-End Process Walkthroughs.** Every process in the End-to-End Process Catalogue --- the 4 core Change Management chains, the 4 cross-cutting loops, and the 8 transformation-type lifecycles --- each walked through step by step against Bouregreg Group's data.
- **Part 4 --- Change Management Scenario Library.** Several distinct Change Management Projects under the same tenant, each a different archetype (technology, structural, cultural, compliance) and a different readiness pattern, so the guide shows more than one way a program can actually unfold.
- **Part 5 --- Alerts and Analytics Reference.** All of journi's live-computed alerts and dashboards, what triggers each, and where to find them.

### How to use it

Read Part 1 once, at setup time, or skip it if your tenant already exists. From there, use Part 2 as a module-by-module reference, Part 3 when you need to run a specific end-to-end process, and Part 4 when you want to see how journi handles a scenario other than a straightforward technology rollout. Part 5 is a standing reference --- keep it open alongside the Notification Center.

### A note on fidelity

Every screen, field, tab, and button named in this guide is verified against journi's actual source code, not assumed from a spec. Where a feature has a real constraint --- for example, that an Organization's sector is one of exactly three values, or that a Change Management Project may link to zero, one, or more Main Projects --- this guide states that constraint rather than working around it. Nothing here describes a feature journi does not actually have.

---

<a id="part-1"></a>

## Part 1 --- Tenant and Admin Setup

<a id="p1-1"></a>

### 1.1 journi's Tenant Model

journi is deployed one tenant at a time. Everything a tenant contains --- its Groups, Organizations, Main Projects, Change Management Projects, users, role permissions, and license terms --- lives in a single record, held in the browser's local storage under a fixed key (`journi.state.v1`) and, in a real deployment, in that tenant's own database. There is no in-app "switch tenant" control, because there is nothing to switch between: one journi deployment is one tenant, in the same way one browser profile is one tenant in this demo build.

Two consequences follow directly from this model, and this guide states them plainly rather than gloss over them:

- **Creating a new tenant means starting from a blank deployment**, not filling out a "New Tenant" wizard inside an existing one. In this demo build, a blank deployment surfaces as journi's default seeded data the first time the app loads; a production deployment would instead start truly empty, with only a Super Admin account provisioned by journi's implementation team. Either way, the *steps* a Super Admin then takes are identical, and those steps are what this Part walks through.
- **A tenant can hold more than one Organization.** The License record (Module 2, License & Plan tab) is tenant-wide --- one company name, one plan, one user cap, one set of feature flags for the whole deployment. Underneath that single License, Module 1's Group → Organization hierarchy can hold several distinct Organizations (business units, subsidiaries, plants), each with its own sector, employee count, sites, and default language. Part 4 of this guide uses that same single-tenant, multi-Organization capacity to host a scenario library without inventing a second tenant.

<a id="p1-2"></a>

### 1.2 The Scenario Organization: Bouregreg Group

This guide is built around one new organization, invented for this guide and not part of journi's other seeded demo data (Atlas Industrial Group, Maghreb Logistics, and Meridia Health remain available separately as journi's standard demo tenant, and are not used here).

| Element | Value |
|---|---|
| Group | Bouregreg Group |
| Organization | Bouregreg Manufacturing Maroc |
| Sector | Manufacturing (journi's Organization sector is one of exactly three values: Manufacturing, Logistics, or Health --- this guide uses Manufacturing) |
| Employees | 3,400 |
| Sites | Casablanca HQ; Kenitra Plant; Settat Plant |
| Languages | French, Arabic |
| Default language | French |
| License plan | Professional |
| License user cap | 60 |

Bouregreg Group makes three disconnected legacy systems (order management, inventory, and finance) redundant across its three sites and is 14 months into replacing them with a single unified platform --- the Main Project and Change Management Project this Part ends by creating, and that Parts 2 and 3 use as the throughline scenario. Part 4 later adds further Change Management Projects under this same Organization --- a plant restructuring, a post-acquisition culture integration, and others --- to build out the scenario library without inventing a second tenant.

<a id="p1-3"></a>

### 1.3 Step 1 --- First Access and the License Record (M2)

A brand-new deployment's very first user is a Super Admin, provisioned outside the app by journi's implementation team (in this demo build, by picking the Super Admin persona at the login screen --- journi's demo login has no password, only a persona picker). Everything else in this Part is done signed in as that Super Admin.

1. Sign in as Super Admin.
2. Open **Module 2 --- Users & Roles**, then the **License & Plan** tab. Only a Super Admin can edit this tab; every other role sees it read-only.
3. journi runs entirely client-side, so this tab reflects the license record a real deployment keeps: **SaaS mode** by default, or **OnPrem mode** once a signed `.lic` file is uploaded. Leave the deployment in SaaS mode for this walkthrough.
4. There is no inline edit form for the License fields --- the panel is populated either by the platform default or by uploading a `.lic` file (a JSON file carrying `version`, `companyId`, `companyName`, `hardwareId`, `expiryDate`, `maxUsers`, `plan`, `features`, `issueDate`, and `signature`). For Bouregreg Group, the Super Admin uploads a `.lic` file with:
   - `companyName`: "Bouregreg Group"
   - `plan`: "professional"
   - `maxUsers`: 60
   - `features`: the feature flags Bouregreg Group's contract enables (for example `core_cm_modules`, `wbs_gantt`, `ai_use_case_library`, `process_registry_m18`)
5. journi checks that the required fields are present before accepting the file. It does **not** verify the cryptographic signature in this demo build --- a production deployment would verify `signature` against the issuer's public key before accepting it. This is stated plainly here rather than implied to be more secure than it is.
6. Once accepted, the License panel shows Bouregreg Group's company name, plan badge, user count against the 60-seat cap, issue and expiry dates, and the feature-flag list --- this is the tenant's identity from this point forward.

<a id="p1-4"></a>

### 1.4 Step 2 --- Building the Group / Organization Hierarchy (M1)

1. Open **Module 1 --- Group / Organization / Projects**.
2. Click **+ Group**, name it "Bouregreg Group", save.
3. Click **+ Organization**. Fill in:
   - Name: "Bouregreg Manufacturing Maroc"
   - Group: Bouregreg Group
   - Type (sector): Manufacturing
   - Employees: 3400
   - Sites (comma-separated): "Casablanca HQ, Kenitra Plant, Settat Plant"
   - Language(s): "fr, ar"
   - Default language: French
4. Save. The Organization card now shows its sector, employee count, site count, and languages, and --- for anyone with hierarchy-management rights --- an inline default-language selector that future users in this Organization inherit unless they set a personal language preference.

<a id="p1-5"></a>

### 1.5 Step 3 --- Creating User Accounts and Scopes (M2)

Every journi user carries exactly three things beyond name, email, and language: a **role** (one of nine), a **scope type** (`platform`, `group`, `organization`, or `project`), and a **scope ID** (which Group, Organization, or Project that scope resolves to). Scope is what actually limits what a user sees --- role determines *capability* (can this person edit the Permission Matrix), scope determines *reach* (which Organizations' and Projects' data this person's role applies to).

Open **Module 2 --- Users & Roles**, **Users & Scope** tab, and click **+ Add** for each of the following, seeding Bouregreg Group's initial team:

| Name | Role | Scope type | Scope | Language |
|---|---|---|---|---|
| Zineb Alaoui | Super Admin | Platform | (whole deployment) | French |
| Anas Bouzid | Group Admin | Group | Bouregreg Group | French |
| Meryem Sabri | Org Admin | Organization | Bouregreg Manufacturing Maroc | French |
| Driss El Amrani | Change Manager | Project | Bouregreg ERP Adoption Program *(created in Step 6 below)* | French |
| Houda Zerouali | People Manager | Project | Bouregreg ERP Adoption Program | Arabic |
| CFO, Bouregreg Group | Sponsor | Project | Bouregreg ERP Adoption Program | French |
| Board Executive Viewer | Executive | Organization | Bouregreg Manufacturing Maroc | French |
| Reda Loukili | Employee | Project | Bouregreg ERP Adoption Program | Arabic |
| Ghita Bennis | Practitioner / Contributor | Project | Bouregreg ERP Adoption Program | French |

A practical note this guide carries over from journi's own behavior rather than invents: a Change Manager, People Manager, Sponsor, Employee, or Practitioner account can only be scoped to a Project, so the four project-scoped rows above are created (or their scope corrected) once the Bouregreg ERP Adoption Program project exists in Step 6 --- in practice, a Super Admin typically completes Steps 2--3's Organization-level and Group-level accounts first, creates the first Project, and only then finishes scoping the project-level team. Self-service sign-ups, separately, land as pending Employee accounts awaiting approval rather than being created directly through this screen.

<a id="p1-6"></a>

### 1.6 Step 4 --- The Permission Matrix (M2)

1. Open the **Permission Matrix** tab. This table is platform-wide, not scoped to one Organization, and only a Super Admin may edit it --- every other role sees it read-only, for transparency.
2. Each row is one of the nine roles; each column is a capability (for example, managing the Group/Organization hierarchy, managing users, managing Charters, editing the RACSI grid). journi ships with a sensible default matrix already checked in; Bouregreg Group's Super Admin reviews it and adjusts only where the default doesn't match their governance model --- for instance, tightening which role may delete a Charter, or widening which role may edit the Codebook.
3. Every checkbox change here takes effect immediately across the whole tenant --- there is no separate "publish" step.

<a id="p1-7"></a>

### 1.7 Step 5 --- Governance Settings (M2)

1. Open the **Governance Settings** tab.
2. The one platform-wide control here is **"Require justification for score/state changes."** On by default, it forces every scored or state-changing update anywhere in journi --- a Lewin macro-state change, an ADKAR score, a Bridges transition, a Kübler-Ross sentiment reading, Sponsor visibility, Training certification, a Resistance status change, a Manager readiness rating, or a Risk status change --- to be saved with a written justification, logged to that Project's audit trail. Turning it off makes justification optional rather than mandatory; it is still offered either way.
3. Bouregreg Group's Super Admin leaves this on: the scenario in Parts 2--4 depends on every framework reading carrying a real, auditable reason, not a bare number.

<a id="p1-8"></a>

### 1.8 Step 6 --- Creating the First Main Project and CM Project (M1)

1. Back in **Module 1**, on the Bouregreg Manufacturing Maroc Organization card, click **+ Main Project**. Fill in:
   - Name: "ERP Platform Unification"
   - Type: ERP
   - Description: "Replace three disconnected legacy systems (order management, inventory, finance) across all three sites with one unified platform."
   - Duration: 14 months
   - Budget band: "MAD 42M"
   - Executive Sponsor: "CFO, Bouregreg Group"
2. Click **+ CM Project** on the same Organization card. Fill in:
   - Name: "Bouregreg ERP Adoption Program"
   - Linked Main Project: check "ERP Platform Unification" (a CM Project may link to zero, one, or more Main Projects --- this one links to exactly one)
   - Owner: "Driss El Amrani"
   - Change type: Technology
   - Target population: "All plant and HQ staff (3,400)"
   - Business driver: "Three disconnected legacy systems create manual reconciliation, delayed month-end close, and duplicate data entry across all three sites."
3. Save. The Organization card now shows the Main Project (with its archetype badge and linked CM Project count) and the CM Project (with its current Lewin phase badge, starting at Unfreeze) side by side.
4. Return to Step 3 and finish creating or re-scoping the four project-level user accounts (Driss El Amrani, Houda Zerouali, the Sponsor, Reda Loukili, and Ghita Bennis) against this now-existing Project.

<a id="p1-9"></a>

### 1.9 Tenant Setup Checklist

- [ ] License record set (company name, plan, user cap, feature flags) --- Module 2, License & Plan
- [ ] Group created --- Module 1
- [ ] Organization created (sector, employees, sites, languages, default language) --- Module 1
- [ ] Initial user accounts created with correct role, scope type, and scope --- Module 2, Users & Scope
- [ ] Permission Matrix reviewed and adjusted from defaults where needed --- Module 2, Permission Matrix
- [ ] Governance setting (justification requirement) confirmed --- Module 2, Governance Settings
- [ ] First Main Project created --- Module 1
- [ ] First Change Management Project created and linked --- Module 1
- [ ] Project-scoped user accounts finalized against the new Project --- Module 2, Users & Scope

With this checklist complete, Bouregreg Group is a fully operational journi tenant with one live Change Management Project. Part 1B walks that project week by week through all four frameworks, normal flow and exceptions; Part 2 then tours all 20 modules against this same, now-real data set.

---

<a id="part-1b"></a>

## Part 1B --- Week-by-Week ERP Implementation Timeline: Normal Flow and Exceptions

Part 1 ended with Bouregreg ERP Adoption Program registered and its Lewin phase opened at Unfreeze. This Part runs that program forward, week by week, for its full 14-month (60-week) duration --- against journi's own 8-phase ERP template (M17, TPL-ERP-8: Discovery, Design, Build, Test, Train, Deploy, Hypercare, Sustain) and journi's own framework definitions, verified against source rather than assumed. It covers the normal flow through all four frameworks first, then --- in the same level of detail --- six realistic exception patterns, each tied to a specific point in Bouregreg's timeline where a program's readiness signals genuinely go off track.

<a id="p1b-1"></a>

### 1B.1 How the Four Frameworks Actually Read in journi

journi tracks four frameworks, each at a different altitude, and this guide states their real stage vocabulary rather than a textbook approximation of it:

| Framework | Altitude | Stages (in journi's own UI, in order) | Logged on |
|---|---|---|---|
| Lewin | Organizational --- one reading per project | Unfreeze → Change → Refreeze | M3 |
| Prosci ADKAR | Individual / cohort --- five independently-scored blocks | Awareness → Desire → Knowledge → Ability → Reinforcement | M5 |
| Bridges' Transition Model | Individual / cohort --- emotional position | Ending → Neutral Zone → New Beginning | M6 |
| Kübler-Ross Change Curve | Individual / cohort --- sentiment | Denial → Resistance/Anger → Exploration → Commitment | M6 |

A deliberate design choice in journi is worth stating plainly here: it never auto-computes a Lewin, Bridges, or Kübler-Ross reading. All three remain a Change Manager's evidence-based judgment call, logged with a justification under Bouregreg Group's Governance Setting (Part 1, Step 5). Only two things are ever computed automatically --- the Composite Readiness Index (M14, blending ADKAR 50%, Kübler-Ross sentiment 25%, and training completion 25%) and the Divergence Pattern Detector (ALT-001, firing when Knowledge ≥ 4 and Ability ≥ 4 while Bridges still reads exactly "Ending"). Everything else in the four-framework picture is a human reading, not a system inference --- which is exactly why the timeline below shows a Change Manager actively setting each reading, week by week, rather than journi silently deriving one.

The four frameworks do not move in lockstep, and a well-run program does not expect them to. Lewin is the single organizational headline; ADKAR is where individual barriers actually surface, block by block; Bridges and Kübler-Ross track the emotional undercurrent that a clean ADKAR score can mask entirely --- which is the exact gap the Divergence Pattern Detector exists to catch. The calendar below shows one defensible way these four readings progress together across a normal 60-week ERP program; Section 1B.4's six exceptions show, in detail, the specific and realistic ways that progression stalls, diverges, or reverses.

<a id="p1b-2"></a>

### 1B.2 The 60-Week Program Calendar

The eight phases below follow M17's TPL-ERP-8 template exactly, in the order journi loads them. Their week ranges are this guide's own illustrative pacing for a 3,400-person, three-site program --- not a value hardcoded anywhere in journi --- built to overlap the way a real ERP program's Project Management and Change Management tracks actually do, and stated as illustrative rather than implied to be a platform default.

| Phase | Weeks | Lewin (at phase end) | ADKAR focus | Bridges (at phase end) | Kübler-Ross (at phase end) |
|---|---|---|---|---|---|
| Discovery | W1--8 | Unfreeze | Awareness | Ending | Denial |
| Design | W6--14 | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger |
| Build | W12--30 | Unfreeze → Change | Desire | Ending → Neutral Zone | Resistance/Anger |
| Test | W28--38 | Change | Knowledge | Neutral Zone | Resistance/Anger → Exploration |
| Train | W30--42 | Change | Knowledge → Ability | Neutral Zone | Exploration |
| Deploy | W43 | Change | Ability | Neutral Zone → New Beginning (provisional) | Exploration |
| Hypercare | W43--50 | Change → Refreeze (provisional) | Ability → Reinforcement | New Beginning | Exploration → Commitment |
| Sustain | W48--60+ | Refreeze (confirmed) | Reinforcement | New Beginning | Commitment |

Two things about this calendar are deliberate and worth stating rather than leaving implicit. First, phases overlap --- Design starts before Discovery formally closes, Test starts before Build formally closes, and so on --- because Bouregreg's Project Management and Change Management tracks run in parallel, not in strict sequence, the same way E2E-06 (the PM ↔ CM Governance Bridge, Part 3) assumes. Second, Lewin is marked "provisional" at Deploy and through most of Hypercare rather than called Refreeze at go-live itself: that gap between the technical go-live milestone and the confirmed Lewin call is Exception E3 below, and this calendar is built to make that gap visible rather than paper over it.

---

<a id="p1b-3"></a>

### 1B.3 Phase-by-Phase Playbook (Normal Flow)

Each phase below states its weeks, its framework readings at the phase's close, four concrete Tasks with their Steps, and the phase gate outcome recorded on M17. Every journi module reference is real; every Task is written as something Driss El Amrani, Meryem Sabri, Houda Zerouali, or their teams actually do inside the modules toured in Part 2.

<a id="phase-1"></a>

#### Phase 1 --- Discovery (W1--8)

**Framework readings at close:** Lewin Unfreeze · ADKAR focus Awareness · Bridges Ending · Kübler-Ross Denial.

Discovery is where the business case gets made and the Month-0 baseline gets captured, before any visible change has reached the plant floor.

**Task 1 --- Run current-state discovery workshops per site.** Meryem Sabri's team runs facilitated workshops at Casablanca HQ, Kenitra, and Settat to document how order management, inventory, and finance actually work today, warts and workarounds included.
  - *Step 1 --- Schedule and facilitate one workshop per site per function.* Technique: current-state process mapping --- goal: a shared, visual record of how work actually happens today, not how a procedure document says it happens.
  - *Step 2 --- Capture every manual workaround as a discovery finding.* Technique: structured workaround inventory --- goal: surface the informal fixes staff have built around the legacy systems' gaps, logged neutrally as findings rather than prematurely as resistance entries.

**Task 2 --- Quantify the cost of inaction.** The three legacy systems' manual reconciliation, delayed month-end close, and duplicate data entry are costed out in hours and dirhams, giving the CFO's business case real numbers rather than a general sense that "the systems are old."
  - *Step 1 --- Pull a month of reconciliation time logs from each site.* Technique: time-and-motion sampling --- goal: an evidence-based hours figure per site, not an estimate.
  - *Step 2 --- Compute the fully-loaded cost and attach it to the business case.* Technique: cost quantification --- goal: translate hours into a dirham figure the CFO can defend to the Steering Committee.

**Task 3 --- Build the Stakeholder Map.** Every affected function and cohort across the three sites is entered on M4, each with an impact dimension and severity --- Casablanca finance flagged for the deepest tracking, since it loses the most manual workarounds.
  - *Step 1 --- Enter each cohort with site, function, and impact severity.* Technique: impact/influence mapping --- goal: a complete, dimensioned record of who is affected and how heavily, before any framework scoring begins.
  - *Step 2 --- Flag Casablanca finance and both plants as high-impact; save.* Technique: severity triage --- goal: tell M14's later tracking depth which cohorts warrant the closest attention.

**Task 4 --- Open the Change Management project; set Lewin.** Driss El Amrani opens the Bouregreg ERP Adoption Program formally and logs Lewin as Unfreeze on M3, with a justification tied to the discovery findings rather than the calendar.
  - *Step 1 --- Create the CM Project record.* (Done in Part 1.) Technique: initiative registration --- goal: a formally registered project with scope, sponsor, and timeline.
  - *Step 2 --- Set Lewin = Unfreeze with a justification note.* Technique: evidence-based phase-call review --- goal: the discipline of citing discovery-workshop findings, not program start date, as the reason. *journi: M3.*

**Phase gate (M17):** Discovery closes with a clean Go once the Stakeholder Map, business case, and Lewin baseline are all in place --- the state Part 1's setup checklist ends at.

**SIPOC.** Suppliers: Executive Sponsor (CFO); Functional Process Owners at each site; enterprise IT strategy. · Inputs: Strategic mandate and budget approval; current-state process notes; org chart per site. · Process: this phase's four Tasks in sequence · Outputs: Approved business case; Stakeholder Map; baseline Lewin reading (Unfreeze). · Customers: Steering Committee; Program Manager; Change Manager.

**RACSI for this phase.** R = PM, FPO · A = ES · C = CM, ITL · S = SUP · I = EU

<a id="phase-2"></a>

#### Phase 2 --- Design (W6--14)

**Framework readings at close:** Lewin Unfreeze · ADKAR focus Awareness → Desire · Bridges Ending · Kübler-Ross Denial → Resistance/Anger.

Design overlaps Discovery's tail: future-state process scope gets drafted while the last discovery findings are still landing.

**Task 1 --- Draft future-state process scope and design principles.** Meryem Sabri's team and the ITL function agree 5--8 written design principles (for example, "no duplicate approvals across sites") that every later configuration decision must satisfy.
  - *Step 1 --- Facilitate a design-principles workshop.* Technique: design-principles workshop --- goal: agree the non-negotiable constraints before configuration starts, so Build does not re-litigate them sprint by sprint.
  - *Step 2 --- Circulate the draft for Steering Committee review.* Technique: structured design-review --- goal: sign-off before configuration effort is committed against the wrong assumptions.

**Task 2 --- Launch the first communications wave.** Driss El Amrani opens M8 with the program's first town hall message across all three sites --- why now, what's changing, when --- and an FAQ channel for questions the town hall didn't answer.
  - *Step 1 --- Deliver the kickoff town hall per site.* Technique: cascading town hall --- goal: a consistent core message, delivered live rather than only in writing.
  - *Step 2 --- Open and monitor the FAQ channel.* Technique: structured Q&A capture --- goal: surface the specific questions a town hall alone leaves unanswered. *journi: M8.*

**Task 3 --- Score the baseline ADKAR pulse.** The first real Awareness scores are logged on M5 per cohort; Casablanca finance, further along in the discovery conversation, reads higher than Kenitra and Settat plant floor, who have heard less so far.
  - *Step 1 --- Run a facilitated Awareness pulse per cohort.* Technique: structured pulse scoring --- goal: a defensible first Awareness reading, not a guess.
  - *Step 2 --- Log any score of 2 or below with a barrier note.* Technique: mandatory barrier-reason capture --- goal: an early warning, not a silent low score. *journi: M5.*

**Task 4 --- Recruit the champion network.** A first cohort of champions --- one per site, per major function --- is recruited and logged against the Stakeholder Map on M4, ahead of their formal briefing in Build.
  - *Step 1 --- Identify candidate champions per site and function.* Technique: peer-nomination --- goal: champions the floor already trusts, not ones appointed from above.
  - *Step 2 --- Log the roster against the Stakeholder Map.* Technique: structured roster capture --- goal: a traceable record ahead of Build's formal briefing. *journi: M4.*

**Phase gate:** Design closes once the future-state scope is signed off by the Steering Committee and the baseline Awareness pulse is logged --- this is also the point where, if the program were instead running as the Order-to-Cash Process Redesign of Part 4, the first Resistance-to-Commitment (E2E-03) signals would already be visible in Casablanca finance.

**SIPOC.** Suppliers: Functional Process Owners; ITL; the champion network's first recruits. · Inputs: Discovery findings; design-principle drafts; first town-hall feedback. · Process: this phase's four Tasks in sequence · Outputs: Signed-off future-state scope; first champion roster; baseline Awareness scores. · Customers: Program Manager; Change Manager; Steering Committee.

**RACSI for this phase.** R = CM, FPO · A = ES · C = PM, ITL · S = SUP · I = EU

<a id="phase-3"></a>

#### Phase 3 --- Build (W12--30)

**Framework readings at close:** Lewin Unfreeze → Change · ADKAR focus Desire · Bridges Ending → Neutral Zone · Kübler-Ross Resistance/Anger.

Build is the longest phase and the one where the Lewin call actually moves --- not because 18 weeks have passed, but because the evidence supports it by the phase's end.

**Task 1 --- Configure the platform against the approved design.** Iterative configuration sprints run against the Design-phase principles; each sprint's decisions are logged so later audits can trace a configuration choice back to the principle that justified it.
  - *Step 1 --- Run configuration sprints in iterative cycles.* Technique: agile configuration sprints --- goal: a build that can absorb a UAT finding without a full re-plan.
  - *Step 2 --- Log each sprint's decisions against its justifying design principle.* Technique: decision-traceability logging --- goal: a defensible answer, months later, to "why was it built this way."

**Task 2 --- Brief and activate the champion network.** The champions recruited in Design are formally briefed on what to watch for on the floor and how to log an observation --- this is the point Exception E7 (Part 3's Champion Early-Warning Loop) becomes operational, not just theoretical.
  - *Step 1 --- Run a champion briefing session per site.* Technique: structured briefing --- goal: champions who know exactly what an "observation worth logging" looks like.
  - *Step 2 --- Confirm each champion's observation-logging path.* Technique: workflow confirmation --- goal: no ambiguity about where a floor-level observation actually goes.

**Task 3 --- Re-run the ADKAR pulse; log barrier reasons.** As Awareness gives way to Desire, any block scoring 2 or below is required to carry a barrier-reason note and auto-escalates --- the mechanism that catches a stalling Desire score before it becomes Exception E1 below.
  - *Step 1 --- Re-score Desire per cohort.* Technique: structured re-pulse --- goal: a current reading, not a stale Design-phase one.
  - *Step 2 --- Log a barrier-reason note on any score ≤ 2.* Technique: mandatory escalation capture --- goal: catch a stall while it is still one cohort's problem, not the whole program's. *journi: M5.*

**Task 4 --- Log the Lewin phase transition.** Once discovery evidence, not the calendar, supports it, Driss El Amrani moves Lewin from Unfreeze to Change on M3, with a justification citing the specific evidence --- configuration sprints landing, Desire trending rather than stalling.
  - *Step 1 --- Review the evidence against Section 1B.1's signal catalogue.* Technique: evidence-based phase-call review --- goal: a Lewin call the Steering Committee can defend, not assert.
  - *Step 2 --- Set Lewin = Change with a justification note.* Technique: justified state-change logging --- goal: an auditable record of exactly what evidence supported the call. *journi: M3.*

**Phase gate:** Build closes once the platform configuration is functionally complete and Lewin has moved to Change on real evidence --- a No-Go or Conditional call here (ALT-009, Part 5) means configuration is not ready for Test, and the phase does not advance on schedule alone.

**SIPOC.** Suppliers: ITL; configuration sprint teams; the champion network. · Inputs: Signed-off future-state scope; design principles; Awareness-stage ADKAR data. · Process: this phase's four Tasks in sequence · Outputs: Functionally complete configured build; briefed champion network; Lewin = Change. · Customers: Program Manager; Change Manager; Test-phase team.

**RACSI for this phase.** R = ITL, CM · A = PM · C = FPO, ES · S = SUP · I = EU

<a id="phase-4"></a>

#### Phase 4 --- Test (W28--38)

**Framework readings at close:** Lewin Change · ADKAR focus Knowledge · Bridges Neutral Zone · Kübler-Ross Resistance/Anger → Exploration.

Test is the first point a representative slice of end users gets real hands-on exposure --- and the first honest opportunity to run the Divergence Pattern check.

**Task 1 --- Execute system integration testing.** ITL runs SIT across the configured build before any end user touches it, closing defects that would otherwise surface as usability friction later.
  - *Step 1 --- Run the SIT test script against the configured build.* Technique: system integration testing --- goal: catch a technical defect before it becomes a end user's bad first impression.
  - *Step 2 --- Triage and close defects before UAT opens.* Technique: defect triage by severity --- goal: UAT tests the process, not a known technical bug.

**Task 2 --- Recruit a representative UAT cohort.** A cohort spanning Casablanca finance, Kenitra plant operations, and Settat plant operations is recruited on M4 so UAT findings represent all three sites, not just headquarters.
  - *Step 1 --- Select participants proportionate to each site's population.* Technique: representative sampling --- goal: UAT findings that generalize, not a Casablanca-only view.
  - *Step 2 --- Log the roster and acceptance criteria.* Technique: structured cohort registration --- goal: a clear, shared definition of what "passing" UAT means. *journi: M4.*

**Task 3 --- Run UAT sessions; log defects and friction.** Real Knowledge scores are logged as the cohort works through real scenarios; usability friction distinct from outright defects is logged separately so it doesn't get silently fixed by a workaround instead of a design change.
  - *Step 1 --- Run scripted UAT scenarios per cohort.* Technique: scenario-based acceptance testing --- goal: real Knowledge evidence, not a self-reported confidence rating.
  - *Step 2 --- Log defects and usability friction as distinct categories.* Technique: friction/defect separation --- goal: a friction pattern doesn't get papered over by a workaround instead of a genuine fix.

**Task 4 --- Cross-check Knowledge/Ability against Bridges.** The Divergence Pattern check runs here for the first time with real data: if a cohort's Knowledge and Ability both read 4 or higher while Bridges still reads Ending, ALT-001 fires --- exactly Exception E2 below.
  - *Step 1 --- Run the Divergence Pattern review against UAT participants' latest scores.* Technique: Divergence Pattern review --- goal: flag strong capability paired with an unmoved Bridges reading before it is mistaken for readiness.
  - *Step 2 --- Route any flagged case into Exception E2's recovery Tasks.* Technique: exception routing --- goal: a flagged individual does not silently count toward cohort readiness. *journi: M6.*

**Phase gate:** Test closes once SIT and UAT sign-off are both recorded and any Divergence Pattern flags from Task 4 are resolved or explicitly accepted, not silently ignored.

**SIPOC.** Suppliers: ITL; the recruited UAT cohort across all three sites. · Inputs: Configured build; UAT participant roster; acceptance criteria. · Process: this phase's four Tasks in sequence · Outputs: SIT/UAT sign-off; defect log; first real Knowledge/Ability scores; Divergence Pattern result. · Customers: Program Manager; Change Manager; Train-phase team.

**RACSI for this phase.** R = ITL, FPO · A = PM · C = CM · S = SUP, EU · I = ES

<a id="phase-5"></a>

#### Phase 5 --- Train (W30--42)

**Framework readings at close:** Lewin Change · ADKAR focus Knowledge → Ability · Bridges Neutral Zone · Kübler-Ross Exploration.

Train runs alongside Test rather than strictly after it --- Knowledge becomes Ability under increasingly realistic conditions while Bridges settles into the Neutral Zone.

**Task 1 --- Deliver role-based training by cohort.** Curriculum built for Casablanca finance, Kenitra plant operations, and Settat plant operations runs through M9, tracked from enrollment through the Certified toggle once a cohort demonstrates real capability, not just attendance.
  - *Step 1 --- Enroll each cohort against its role-based curriculum.* Technique: role-based curriculum mapping --- goal: Casablanca finance and plant-floor staff each get training scoped to what they actually do, not one generic course.
  - *Step 2 --- Certify only on demonstrated capability.* Technique: capability-based certification --- goal: "trained" and "capable" are not treated as synonyms. *journi: M9.*

**Task 2 --- Deploy job aids and a sandbox practice environment.** Plant-floor staff at Kenitra and Settat get hands-on sandbox practice ahead of go-live rather than a first live transaction being their first real attempt.
  - *Step 1 --- Publish job aids per role.* Technique: quick-reference job aids --- goal: a fallback reference that doesn't require remembering the full training.
  - *Step 2 --- Open the sandbox environment for supervised practice.* Technique: sandbox rehearsal --- goal: the first mistake happens in practice, not on a live transaction.

**Task 3 --- Run readiness assessments per cohort.** Knowledge/Ability scoring by cohort surfaces which sites are ready and which need another training wave --- Settat, further from HQ and later to receive the champion briefing, typically reads behind Casablanca here.
  - *Step 1 --- Score Knowledge and Ability per cohort.* Technique: structured readiness assessment --- goal: a defensible per-cohort score, not a project-wide average that hides a lagging site.
  - *Step 2 --- Flag any cohort below the benchmark band for a second training wave.* Technique: benchmark-band comparison --- goal: catch a training gap before Train's phase gate, not after. *journi: M5.*

**Task 4 --- Brief supervisors on floor-coaching expectations.** Kenitra and Settat plant supervisors --- People Manager role --- are briefed on real-time floor coaching for go-live week, using the M11 heatmap to see their own team's weakest ADKAR block before it becomes a go-live incident.
  - *Step 1 --- Walk each supervisor through their team's M11 heatmap.* Technique: team-scoped heatmap review --- goal: a supervisor who knows their team's specific weak block, not a generic coaching reminder.
  - *Step 2 --- Confirm each supervisor's go-live-week coaching plan.* Technique: coaching-plan confirmation --- goal: a concrete plan in place before go-live week, not improvised during it.

**Phase gate:** Train closes once cohort-level go/no-go readiness is confirmed against benchmarking bands on M14 --- a per-cohort call, not a single project-wide one, since Bouregreg's three sites are not required to reach readiness on the same week.

**SIPOC.** Suppliers: Training lead; plant supervisors at Kenitra and Settat; ITL (sandbox environment). · Inputs: Curriculum; UAT findings; per-site Knowledge scores. · Process: this phase's four Tasks in sequence · Outputs: Trained, certified cohorts; deployed job aids; cohort-level go/no-go call. · Customers: Steering Committee; Program Manager; Deploy-phase team.

**RACSI for this phase.** R = CM, SUP · A = CM · C = FPO · S = PM · I = ES, EU

<a id="phase-6"></a>

#### Phase 6 --- Deploy (W43)

**Framework readings at close:** Lewin Change (provisional toward Refreeze) · ADKAR focus Ability · Bridges Neutral Zone → New Beginning (provisional) · Kübler-Ross Exploration.

Deploy is a single, sharp week --- the clearest instance in Bouregreg's program of the two-clock problem Exception E3 exists to manage.

**Task 1 --- Execute the data freeze and final migration.** The last legacy-system data cutover runs against the mock-migration cycles rehearsed in Build.
  - *Step 1 --- Freeze legacy-system data entry at the agreed cutoff.* Technique: coordinated data freeze --- goal: a clean, unambiguous migration source.
  - *Step 2 --- Run the final migration and reconcile the result.* Technique: migration reconciliation --- goal: confirm what moved matches what was frozen, before any site logs in.

**Task 2 --- Run the cutover runbook and technical validation.** ITL validates the live platform against the runbook before any site is told to start using it.
  - *Step 1 --- Execute the cutover runbook step by step.* Technique: scripted cutover runbook --- goal: a repeatable, auditable go-live rather than an improvised one.
  - *Step 2 --- Validate the live platform against acceptance criteria.* Technique: go-live technical validation --- goal: confirm the platform is genuinely ready before any end user is told it is.

**Task 3 --- Communicate go-live confirmation to all cohorts.** Driss El Amrani sends the go-live confirmation across Casablanca, Kenitra, and Settat --- a single message, timed carefully against M8's saturation detection (ALT-011, Part 5), since this is the highest-traffic communications week in the program.
  - *Step 1 --- Draft one confirmation message per site, timed against the saturation check.* Technique: saturation-aware communication timing --- goal: the message lands clearly, not lost in a pile-up of other go-live-week traffic.
  - *Step 2 --- Send and log the confirmation on M8.* Technique: logged communication dispatch --- goal: an auditable record of exactly when and how go-live was confirmed to each site.

**Task 4 --- Activate hypercare; mark Lewin as provisional.** The hypercare support model goes live on Day 1, and Lewin is marked "Change → Refreeze (provisional)" on M3 rather than called Refreeze outright --- the exact discipline Exception E3 protects.
  - *Step 1 --- Activate the hypercare support model across all three sites.* Technique: hypercare activation --- goal: visible, elevated support from the first live hour, not a delayed ramp-up.
  - *Step 2 --- Log Lewin as "Change → Refreeze (provisional)" with a justification.* Technique: provisional phase-call logging --- goal: separate the technical milestone from the emotional-layer evidence still pending. *journi: M3.*

**Phase gate:** Deploy closes on a clean technical go-live; the Lewin call explicitly does not close here, and stays provisional into Hypercare.

**SIPOC.** Suppliers: ITL; Program Manager; Change Manager. · Inputs: Rehearsed migration cycles; cutover runbook; cohort go/no-go calls. · Process: this phase's four Tasks in sequence · Outputs: Live production system; legacy system locked; go-live communication sent; provisional Lewin. · Customers: Steering Committee; all three sites; Hypercare-phase team.

**RACSI for this phase.** R = ITL, PM · A = ES · C = CM · S = SUP · I = EU

<a id="phase-7"></a>

#### Phase 7 --- Hypercare (W43--50)

**Framework readings at close:** Lewin Change → Refreeze (provisional, confirming) · ADKAR focus Ability → Reinforcement · Bridges New Beginning · Kübler-Ross Exploration → Commitment.

The last mile of adoption is won or lost here, and Kübler-Ross regression during this window is normal, expected behavior, not a data error --- Exception E4 below covers exactly this.

**Task 1 --- Staff an elevated support desk.** ITL and Driss El Amrani's team staff visibly elevated support for the first weeks post-go-live across all three sites.
  - *Step 1 --- Staff the support desk at elevated capacity.* Technique: elevated hypercare staffing --- goal: a visibly fast response in the highest-anxiety weeks of the program.
  - *Step 2 --- Publish the escalation path to every site.* Technique: escalation-path communication --- goal: no site left guessing who to contact when something breaks.

**Task 2 --- Track adoption metrics daily; triage by severity.** Daily tracking on M14 catches a stalling site early rather than at the 30-day checkpoint.
  - *Step 1 --- Review the M14 adoption dashboard daily.* Technique: daily metric review --- goal: catch a stalling site in days, not weeks.
  - *Step 2 --- Triage any defect by severity and route it.* Technique: severity-based triage --- goal: a critical defect gets same-day attention; a cosmetic one doesn't crowd it out.

**Task 3 --- Run a Kübler-Ross/Bridges re-pulse at 2 and 4 weeks.** Real post-go-live sentiment is re-scored on M6 --- the number that either confirms the provisional Refreeze call or flags Exception E3 as still active.
  - *Step 1 --- Re-score Bridges and Kübler-Ross at the 2-week mark.* Technique: scheduled re-pulse --- goal: an early read on whether the emotional layer is moving.
  - *Step 2 --- Repeat at 4 weeks and compare the trend.* Technique: trend comparison --- goal: distinguish real movement from noise in a single reading. *journi: M6.*

**Task 4 --- Coach any cohort showing regression.** People Managers at Kenitra and Settat run targeted coaching on M11 for any cohort whose re-pulse moved backward rather than forward.
  - *Step 1 --- Identify any cohort whose re-pulse moved backward.* Technique: regression flagging --- goal: catch a specific cohort's setback before it is averaged away in the project-level number.
  - *Step 2 --- Run targeted floor coaching on M11.* Technique: in-context coaching --- goal: address the specific step or incident behind the regression, not a general refresher.

**Phase gate:** Hypercare closes once the re-pulse confirms Bridges has genuinely moved to New Beginning and Kübler-Ross reads Exploration or better across all three sites --- not on the calendar alone.

**SIPOC.** Suppliers: Elevated support desk (ITL, CM); plant supervisors. · Inputs: Daily adoption metrics; go-live defect log; provisional Lewin reading. · Process: this phase's four Tasks in sequence · Outputs: Stabilized adoption metrics; confirmed Bridges/Kübler-Ross re-pulse; support taper plan. · Customers: Steering Committee; Sustain-phase team.

**RACSI for this phase.** R = CM, SUP · A = CM · C = ITL, PM · S = FPO · I = ES, EU

<a id="phase-8"></a>

#### Phase 8 --- Sustain (W48--60+)

**Framework readings at close:** Lewin Refreeze (confirmed) · ADKAR focus Reinforcement · Bridges New Beginning · Kübler-Ross Commitment.

Sustain is where Refreeze is called from checkpoint evidence, never the calendar --- the discipline that protects against Exception E5, a Reinforcement gap, below.

**Task 1 --- Embed new-process metrics into performance management.** The new ERP-based process metrics are embedded into standard performance management with HR support, so the new way of working is measured, not just trained.
  - *Step 1 --- Agree the new-process metrics with HR.* Technique: performance-metric integration --- goal: the new way of working is what gets measured, not the old one by habit.
  - *Step 2 --- Confirm the metrics are live in the next review cycle.* Technique: cycle-integration confirmation --- goal: the change survives the program team's own eventual departure.

**Task 2 --- Confirm Reinforcement mechanisms are active.** Recognition, manager check-ins, and revoked legacy-system access are all confirmed active on M12 --- Reinforcement without a revoked fallback option is Reinforcement in name only.
  - *Step 1 --- Confirm recognition and manager check-in mechanisms are running.* Technique: reinforcement mechanism audit --- goal: verify these exist in practice, not just on a plan document.
  - *Step 2 --- Confirm legacy-system access is genuinely revoked.* Technique: fallback-access closure --- goal: no quiet path back to the old way of working. *journi: M12.*

**Task 3 --- Run 30/60/90-day checkpoint reviews.** Checkpoints against the benchmarking bands on M14 are the evidence base for the eventual Refreeze call --- three consecutive healthy checkpoints, not a date on the calendar.
  - *Step 1 --- Run each checkpoint against the benchmarking bands.* Technique: benchmark-band checkpoint review --- goal: an objective pass/fail per checkpoint, not a subjective sense of "things seem fine."
  - *Step 2 --- Flag any checkpoint carrying a High regression-risk score.* Technique: regression-risk flagging --- goal: this is exactly what blocks ALT-015's sign-off until resolved. *journi: M14.*

**Task 4 --- Call Refreeze; close the CM project.** Once checkpoint evidence supports it, Driss El Amrani formally calls Refreeze on M3 and closes the Bouregreg ERP Adoption Program on M12, handing ongoing ownership to the business-as-usual process owner.
  - *Step 1 --- Review three consecutive healthy checkpoints before calling Refreeze.* Technique: evidence-based closure review --- goal: Refreeze called from data, never the calendar.
  - *Step 2 --- Log Refreeze and toggle project sign-off.* Technique: formal project closure --- goal: a clean, auditable handoff to business-as-usual ownership. *journi: M3, M12.*

**Phase gate:** Sustain --- and the program --- closes on the sign-off toggle on M12, blocked by ALT-015 (Part 5) if any checkpoint still carries an open High regression-risk flag.

**SIPOC.** Suppliers: HR (performance-management integration); Change Manager; Executive Sponsor. · Inputs: Hypercare's confirmed readings; 30/60/90-day checkpoint data. · Process: this phase's four Tasks in sequence · Outputs: Confirmed Refreeze; embedded reinforcement; closed CM project; lessons-learned log. · Customers: Executive Sponsor; business-as-usual process owner; future Bouregreg CM projects.

**RACSI for this phase.** R = CM · A = ES · C = PM, FPO · S = SUP · I = EU

<a id="p1b-4"></a>

### 1B.4 Six Exception Scenarios, in Detail

Every exception below is a realistic, specific way one of the four frameworks' normal progression (1B.1--1B.3) stalls, diverges, or reverses --- not a hypothetical. Each is tied to a concrete point in Bouregreg's 60-week timeline and a specific site, cohort, or role, with its trigger, timeline impact, recovery Tasks, and outputs stated in the same detail as the normal-flow phases above.

<a id="exc-e1"></a>

#### E1 --- Desire Stall at Settat (Related to Phase 3 --- Build)

**Trigger:** ADKAR Desire logged at 2 or below for the Settat plant-floor cohort on M5, auto-escalating; barrier-reason notes cite low visibility into what the new inventory workflow will actually look like on their specific line, and unresolved fear about whether the new system will eliminate positions.

**Timeline impact:** Inserted as a 2--4 week parallel track within Build (around W20--24); Train's Task 1 (role-based delivery) does not open for the Settat cohort while their Desire score remains escalated --- Test's Task 2 UAT recruitment (Part 1B.3) is affected in turn if Settat's representative isn't ready to participate meaningfully.

**Recovery Tasks:**
1. **Cluster barrier-reason notes by root cause.** Houda Zerouali reviews Settat's logged barrier notes and finds the two recurring themes: workflow visibility and position security, not the system itself. *journi: M5.*
2. **Run targeted listening sessions.** Small-group sessions with the Settat plant-floor cohort validate which of the two themes is actually driving the stall --- in this case, position security, not workflow visibility.
3. **Design a specific, credible response.** Driss El Amrani and the CFO agree a concrete, verifiable commitment on staffing levels post-go-live --- not a vague reassurance.
4. **Have the Sponsor deliver the response personally.** The CFO delivers the commitment directly to the Settat cohort, in person, rather than through a written communication alone --- consistent with the CM Charter Sponsor standard (M19).
5. **Re-score Desire and Kübler-Ross sentiment 2--4 weeks later.** Both scores are re-read on M5/M6 to confirm the intervention actually worked, not just that it happened. *journi: M5--M6.*

**Outputs:** root-cause clustering of the Desire stall; a specific, sponsor-delivered response; updated Desire and Kübler-Ross scores; Settat cleared to enter Train's Task 1 on schedule.

**RACSI for this exception.** R = CM · A = CM · C = ES, SUP · S = PM · I = FPO, EU

<a id="exc-e2"></a>

#### E2 --- Divergence Pattern at UAT (Related to Phases 4--5 --- Test, Train)

**Trigger:** ALT-001 fires --- a UAT participant or cohort logs Knowledge ≥ 4 and Ability ≥ 4 on M5 while Bridges still reads exactly "Ending" on M6. In Bouregreg's timeline, this is most likely to first appear among Casablanca finance staff, who move through Knowledge/Ability quickly given their proximity to the program team but whose day-to-day work is the most disrupted by the new process.

**Timeline impact:** A targeted, individual-level intervention runs alongside Train; the flagged individual does not count toward Train's Task 3 cohort-readiness call until Bridges moves off Ending.

**Recovery Tasks:**
1. **Review the alert and confirm it against supervisor observation.** Driss El Amrani checks whether the flagged individual's supervisor has independently noticed anything --- confirming this isn't a false positive from a single bad Bridges reading. *journi: M6.*
2. **Hold a 1:1 focused on what is being let go of, not on skills.** The conversation deliberately does not revisit training content --- the person already scored Knowledge ≥ 4 and Ability ≥ 4; the gap is emotional, not technical.
3. **Distinguish a genuine loss concern from simple reluctance.** The 1:1 surfaces whether this is a real identity/loss concern (for example, a role that existed under the legacy system and doesn't exist in the new one) or ordinary change reluctance.
4. **Provide an explicit closure moment if a genuine loss is identified.** If real, the loss is acknowledged explicitly and directly --- not talked around.
5. **Re-check the Bridges reading only, at the next scheduled pulse.** Only Bridges is re-scored; Knowledge and Ability are already confirmed and do not need re-testing. *journi: M6.*

**Outputs:** confirmed or dismissed divergence case; documented loss concern if genuine; updated Bridges reading; the individual cleared for Train's cohort-readiness call once resolved.

**RACSI for this exception.** R = CM · A = CM · C = SUP · S = FPO · I = ES, EU

<a id="exc-e3"></a>

#### E3 --- Two-Clock Problem at Deploy (Related to Phase 6 --- Deploy)

**Trigger:** Lewin is technically eligible to be called "Change → Refreeze" on the Deploy week's calendar date, while Bridges and Kübler-Ross across most cohorts still read Neutral Zone / Resistance-Anger or lower --- the organizational clock (a single go-live date) and the emotional clock (which does not move on a fixed schedule) diverging exactly as 1B.3's Phase 6 anticipates.

**Timeline impact:** Does not delay go-live itself; extends the hypercare and reinforcement budget and staffing window by the observed lag --- commonly 2--6 weeks past the original Hypercare end date.

**Recovery Tasks:**
1. **Separate the technical go-live milestone from the Lewin phase call.** Driss El Amrani and the ITL team agree explicitly: a clean technical cutover is not, by itself, evidence for Refreeze. *journi: M3.*
2. **Mark Lewin as "provisional Refreeze" pending emotional-layer evidence.** Exactly the Phase 6 Task 4 language --- logged as provisional, with a justification stating what evidence is still pending. *journi: M3.*
3. **Keep Reinforcement and hypercare fully active.** The hypercare support model (Phase 7 Task 1) is not tapered down just because the Lewin call is provisional rather than confirmed.
4. **Re-pulse Bridges/Kübler-Ross at 2 and 4 weeks.** Exactly Phase 7's Task 3, run with this exception's resolution specifically in mind. *journi: M6.*
5. **Confirm or walk back the Refreeze call once evidence supports it.** If the re-pulse shows genuine movement, Refreeze is confirmed; if not, hypercare extends further and the cycle repeats. *journi: M3.*

**Outputs:** an explicit provisional Lewin phase call rather than a premature confirmed one; sustained hypercare funding through the lag; a confirmed or corrected Lewin phase once the re-pulse lands.

**RACSI for this exception.** R = CM, ITL · A = ES · C = PM · S = SUP · I = EU

<a id="exc-e4"></a>

#### E4 --- Sentiment Regression During Hypercare (Related to Phase 7 --- Hypercare)

**Trigger:** A cohort's Kübler-Ross reading moves backward on M6 --- typically from Exploration back to Resistance/Anger --- following a specific triggering event: in Bouregreg's case, a defect in the Kenitra plant's inventory-matching logic that caused a visible, embarrassing stock-count error in front of a cohort that had just started to trust the new system.

**Timeline impact:** A short, contained recovery cycle of days to roughly two weeks; escalated to Steering Committee only if the pattern recurs across multiple cohorts rather than staying isolated to the one affected.

**Recovery Tasks:**
1. **Confirm the regression is tied to a specific incident.** Houda Zerouali checks whether this is a one-off reaction to the Kenitra defect or a broader readiness failure --- in this case, clearly the former.
2. **Resolve or clearly communicate the status of the triggering defect.** ITL fixes the inventory-matching defect and Driss El Amrani communicates the fix explicitly to the affected cohort, closing the loop rather than letting it fade unaddressed.
3. **Have the supervisor directly acknowledge the setback.** The Kenitra plant supervisor acknowledges the incident with the affected team directly, rather than letting the program office's fix announcement stand in for a floor-level conversation.
4. **Provide targeted, in-context coaching on the specific process step affected.** Coaching is scoped narrowly to the exact inventory-matching step that failed, not a general refresher.
5. **Re-pulse the affected cohort only, at 1--2 weeks.** Only the Kenitra cohort is re-scored --- this is a localized regression, not a program-wide one. *journi: M6.*

**Outputs:** the triggering defect resolved and communicated; the regression event and response documented; confirmed recovery, or continued monitoring if the re-pulse doesn't yet show it.

**RACSI for this exception.** R = SUP, ITL · A = CM · C = PM · S = FPO · I = ES, EU

<a id="exc-e5"></a>

#### E5 --- Reinforcement Gap at Sustain (Related to Phase 8 --- Sustain)

**Trigger:** The ADKAR Reinforcement score stalls below 3 on M5 as the program's formal end date approaches, with no forcing deadline prompting continued attention --- the exact risk Phase 8's discipline (Refreeze called from evidence, never the calendar) exists to prevent.

**Timeline impact:** Extends the formal project-closure date by however long it takes to accumulate 2--3 consecutive healthy checkpoints on M12 --- commonly 4--8 weeks past the original W60 close.

**Recovery Tasks:**
1. **Flag the Reinforcement stall explicitly.** Driss El Amrani flags the stall on M5 rather than letting Sustain's Task 4 (call Refreeze; close the project) proceed on schedule regardless. *journi: M5.*
2. **Reconvene the Sponsor to re-authorize a checkpoint cadence.** The CFO re-authorizes a defined checkpoint cadence beyond the originally planned close date.
3. **Re-activate or formally re-charter the champion network.** The champion network, which naturally quiets down as a program matures, is re-activated specifically to reinforce the new process on the floor.
4. **Embed adoption metrics into the next performance-review cycle.** Adoption metrics are explicitly written into HR's next performance-review cycle, giving Reinforcement a structural home beyond the CM project's own lifespan.
5. **Delay the formal Refreeze/closure call.** Sustain's Task 4 does not run until checkpoints show target Reinforcement, however long that takes. *journi: M3.*

**Outputs:** a documented Reinforcement stall and remediation plan; a re-authorized checkpoint cadence; a re-chartered champion network; a delayed but evidence-based Refreeze call rather than a premature one.

**RACSI for this exception.** R = CM · A = ES · C = SUP, FPO · S = PM · I = EU

<a id="exc-e6"></a>

#### E6 --- Cohort Divergence Across Sites (Cross-Cutting, Phases 4--7 --- Test through Hypercare)

**Trigger:** Casablanca, Kenitra, and Settat read genuinely differently across all four frameworks by mid-Train --- Casablanca ahead on Knowledge/Ability given proximity to the program team, Settat behind following E1's Desire stall, Kenitra solid until E4's regression --- making the project-level Composite Readiness Index on M14 a misleading blend of three very different real situations.

**Timeline impact:** Runs continuously alongside Test, Train, and Hypercare; enables a cohort-by-cohort go/no-go at Phase 5's gate instead of a single all-or-nothing call for all 3,400 people at once.

**Recovery Tasks:**
1. **Disaggregate the Composite Readiness Index by site.** Meryem Sabri pulls the blended M14 number apart into three site-level readings, using the Stakeholder Map's site tags on M4. *journi: M4.*
2. **Identify which cohorts are driving the spread.** Casablanca high, Settat low, Kenitra mid-but-dipping-post-E4 --- named explicitly rather than averaged away.
3. **Investigate what Casablanca did differently.** Proximity to the program team and an earlier champion briefing are identified as the concrete, transferable factors --- not an unexplained "Casablanca is just more ready."
4. **Transfer concrete practices to Settat and Kenitra.** The earlier champion briefing timing is applied to the next site rollout in the scenario library (Part 4); Settat's dedicated E1 recovery plan is extended to cover the same visibility gap at Kenitra proactively.
5. **Continue reporting cohort-level readiness alongside the project-level number.** Every future Steering Committee readout carries the three-site breakdown, not just the blended figure, through Phase 5's cohort-by-cohort gate and beyond.

**Outputs:** a disaggregated, site-level readiness report; a root-cause comparison between Casablanca and the other two sites; a revised, cohort-by-cohort go/no-go recommendation at Phase 5's gate rather than one all-or-nothing call.

**RACSI for this exception.** R = CM, FPO · A = CM · C = SUP · S = PM · I = ES, EU

<a id="p1b-5"></a>

### 1B.5 What to Track, by Cadence

The tracking model below is the bridge between the phase-by-phase playbook above and the alerts in Part 5 --- what Driss El Amrani and his team actually look at, and how often, across the Bouregreg ERP Adoption Program's 60 weeks.

**Daily (Deploy through Hypercare, W43--50 --- Phase 6 Task 3, Phase 7 Task 2):** adoption-metric dashboard on M14; the elevated support desk's open ticket count by site; any new resistance entry on M10 logged in the last 24 hours.

**Weekly (throughout):** the Notification Center bell, for any of the 9 live alerts (Part 5); ADKAR scores for any cohort currently mid-training or mid-intervention; sponsor-action completion on M7 against that week's roadmap item.

**Bi-Weekly (Hypercare, W43--50 --- Phase 7 Task 3):** the Kübler-Ross/Bridges re-pulse cadence itself; regression coaching outcomes on M11 for any cohort flagged the prior cycle.

**Monthly (throughout, and mandatory from Sustain onward):** the Composite Readiness Index trend line on M14; Lewin phase justification, reviewed against evidence rather than the calendar; Steering Committee readout, carrying the per-site breakdown established in Exception E6.

**Escalation thresholds (the bridge to Part 5's alerts):**

| Signal observed | Threshold | Action required | Linked exception / alert |
|---|---|---|---|
| Desire ≤ 2, auto-escalated, low-visibility barrier notes | 1 occurrence | Log barrier-reason note; begin E1 recovery | E1 · M5 escalation |
| Knowledge ≥ 4 and Ability ≥ 4 while Bridges = Ending | 1 occurrence | Run E2 recovery; do not count toward cohort readiness | E2 · ALT-001 |
| Lewin eligible for Refreeze on the calendar, Bridges/KR not yet there | Go-live date reached | Mark Lewin provisional; run E3 | E3 · Phase 6 gate |
| Kübler-Ross reading moves backward after a specific incident | 1 occurrence, 1 cohort | Run E4's contained recovery cycle | E4 |
| ADKAR Reinforcement < 3 as formal close approaches | Any Sustain-phase checkpoint | Flag stall; run E5; delay closure | E5 · ALT-015 |
| Site-level readiness spread exceeds one full benchmark band | Any Phase 4--7 checkpoint | Disaggregate M14; run E6 | E6 |
| 3 or more open Resistance Log entries | Any point | Escalate to Steering Committee | ALT-004 |
| Sponsor visibility logged "weak" | Any governance week | Escalate to PMO | ALT-003 |
| Fewer than 2 named coalition members | Any point | Escalate to PMO | ALT-010 |

<a id="p1b-6"></a>

### 1B.6 The Program, Month by Month

Sections 1B.3 and 1B.4 gave the Bouregreg ERP Adoption Program's normal flow and its six exceptions as separate, structured references. This subsection puts them back together as one continuous account, month by month, so a reader can see how the two actually interleave over the program's real 14 months --- which is what living through a program week by week actually looks like, rather than a phase table and an exception appendix read separately.

**Month 1 (W1--4).** Discovery opens. Meryem Sabri's team runs the first discovery workshops at Casablanca HQ; Kenitra and Settat follow the week after. Lewin reads Unfreeze from the first week --- not because the program just started, but because the discovery findings already support it.

**Month 2 (W5--8).** Discovery closes with a signed-off business case and a complete Stakeholder Map. Design opens in parallel: the first design-principle draft circulates before Discovery's final workshop has even happened at Settat.

**Month 3 (W9--13).** Design's future-state scope is signed off by the Steering Committee. The first town hall goes out across all three sites, and the first real Awareness scores land on M5 --- Casablanca reading highest, Settat lowest, exactly the spread Exception E6 will later name explicitly.

**Month 4 (W14--17).** Build opens. Configuration sprints begin against the signed-off design principles, and the first wave of champions is briefed --- the moment Exception E7 (Part 3) becomes an operating loop rather than a theoretical one.

**Month 5 (W18--22).** Mid-Build. Awareness gives way to Desire across most cohorts --- except the Settat plant floor, where Desire drops to 2 and auto-escalates. **Exception E1 opens here.** Houda Zerouali clusters the barrier notes; the theme is position security, not workflow visibility.

**Month 6 (W23--27).** **E1 closes.** The CFO delivers a direct, verifiable staffing commitment to the Settat cohort in person; Desire and Kübler-Ross sentiment both recover within the month. Build closes shortly after: configuration is functionally complete, and Lewin moves from Unfreeze to Change on the strength of that evidence, not the calendar.

**Month 7 (W28--30).** Test opens. SIT runs clean. The UAT cohort is recruited across all three sites, with Settat's representative now genuinely ready to participate meaningfully, thanks to Month 6's recovery.

**Month 8 (W31--35).** UAT runs in earnest. A Casablanca finance participant logs Knowledge ≥ 4 and Ability ≥ 4 while Bridges still reads Ending --- **Exception E2 fires** as ALT-001. Driss El Amrani runs the 1:1; the underlying concern turns out to be genuine, tied to a role that exists under the legacy system and doesn't exist in the new one, and is given an explicit closure moment. Train opens in parallel: role-based training begins by cohort.

**Month 9 (W36--39).** Train continues. Kenitra and Settat's job aids and sandbox environment go live. The Composite Readiness Index on M14, blended across all three sites, starts reading in a range that --- disaggregated --- turns out to mean something different at each site. **Exception E6 is formally opened** as Meryem Sabri pulls the site-level breakdown apart for the first time.

**Month 10 (W40--42).** Train closes. Cohort-level go/no-go is confirmed --- Casablanca and Settat (recovered since Month 6) clear cleanly; Kenitra clears with a coaching note attached, informed directly by E6's site-level comparison. Supervisors at both plant sites are briefed on floor-coaching expectations for the go-live week ahead.

**Month 11 (W43).** Deploy --- a single, sharp week. Data freeze, final migration, cutover runbook, technical validation: all clean. Driss El Amrani sends the go-live confirmation across all three sites, timed against M8's saturation detection. Hypercare activates on Day 1. Lewin is marked "Change → Refreeze (provisional)," not Refreeze --- **Exception E3 is, by design, already active** the moment this month begins, and stays active through Month 12.

**Month 12 (W44--47).** Hypercare in full swing. A configuration defect in Kenitra's inventory-matching logic causes a visible stock-count error in front of a cohort that had just started to trust the new system --- **Exception E4 opens**, isolated to Kenitra. The defect is fixed and communicated within the week; the Kenitra plant supervisor acknowledges the setback directly with the team; a targeted re-pulse at the 1--2 week mark confirms recovery. The broader 2- and 4-week Bridges/Kübler-Ross re-pulse required to resolve **E3** also runs this month.

**Month 13 (W48--52).** Hypercare closes: the re-pulse confirms Bridges has genuinely moved to New Beginning and Kübler-Ross reads Exploration or better across all three sites --- **E3 closes**, Lewin's provisional Refreeze is confirmed rather than walked back. Sustain opens. New-process metrics are embedded into performance management with HR's support; the first 30-day checkpoint runs clean.

**Month 14 (W53--60+).** The 60-day checkpoint runs clean. At the 90-day mark, Reinforcement stalls below 3 for the first time --- not a crisis, but exactly the pattern **Exception E5** exists to catch before the program closes on schedule regardless. Driss El Amrani flags it explicitly; the CFO re-authorizes a further checkpoint cadence; the champion network is re-chartered specifically for reinforcement. Two further consecutive healthy checkpoints follow. **E5 closes.** Refreeze is called from that evidence, the Bouregreg ERP Adoption Program's sign-off is recorded on M12, and ongoing ownership passes to the business-as-usual process owner --- the same close Part 1B.3's Phase 8 describes, now with the full story of how the program actually got there.

---

<a id="part-2"></a>

## Part 2 --- Module-by-Module Feature Tour

Each entry below covers one module: its purpose (in journi's own words), how it plays out in the Bouregreg ERP Adoption Program, what a user can create, update, or delete on the page, and who is allowed to do it. General write access --- the ability to log data on most day-to-day Change Management modules --- belongs to five roles: Super Admin, Group Admin, Org Admin, Change Manager, People Manager, and Practitioner/Contributor. Sponsor, Executive, and Employee accounts are read-only on those same modules by default, seeing dashboards and their own assigned items rather than editing scores. Two roles carry a narrower additional restriction worth stating plainly: Practitioner/Contributor can log data but, unlike the other five, is not one of the roles with individual-level visibility --- on modules with named-person detail, a Practitioner sees aggregated cohort views rather than individual scores.

### M1 --- Hierarchy

**Purpose:** Group → Organization → Projects, with every Change Management Project carrying an optional link to zero, one, or more Main Projects.

**In the Bouregreg scenario:** this is the screen Part 1 used to build Bouregreg Group → Bouregreg Manufacturing Maroc → ERP Platform Unification (Main Project) → Bouregreg ERP Adoption Program (CM Project). As Part 4 adds further CM Projects, they all appear as additional cards under the same Organization.

**Create / update / delete:** create and delete Groups; create, edit (including the default-language selector), and delete Organizations; create and delete Main Projects and CM Projects, including editing which Main Projects a CM Project links to.

**Who can edit:** gated to whoever holds hierarchy-management rights on the Permission Matrix --- by default Super Admin, Group Admin, and Org Admin.

### M2 --- Identity & RBAC

**Purpose:** role-based access control scoped to Group / Organization / Project, with four tabs: Users & Scope, Permission Matrix, Governance Settings, and License & Plan.

**In the Bouregreg scenario:** this is where Zineb Alaoui (Super Admin) built out Bouregreg Group's team in Part 1, and where Anas Bouzid (Group Admin) or Meryem Sabri (Org Admin) approve any employee who self-registers rather than being added directly.

**Create / update / delete:** create, edit, and remove user accounts (Users & Scope); toggle any role/capability cell (Permission Matrix, Super Admin only); toggle the justification requirement (Governance Settings); upload a new `.lic` file or revert to SaaS mode (License & Plan, Super Admin only).

**Who can edit:** Users & Scope is gated to whoever holds user-management rights (by default Super Admin, Group Admin, Org Admin); the Permission Matrix and License & Plan tabs are Super-Admin-only regardless of the matrix's own settings, since a role should not be able to grant itself more power through the very table that limits it.

### M3 --- Initiative Registry

**Purpose:** the system of record for every change initiative --- business driver, scope, target population, and Lewin macro-state.

**In the Bouregreg scenario:** the Bouregreg ERP Adoption Program's project detail page. Its Lewin phase opened at **Unfreeze** in Part 1 and is the single field the guide's later Parts watch move through Change and toward Refreeze.

**Create / update / delete:** edit the project's business driver, scope, target population, and Lewin macro-state; the project record itself is created and deleted from M1.

**Who can edit:** general write access; a Lewin phase change is a scored/state change, so under Bouregreg Group's Governance Setting (Part 1, Step 5) it requires a written justification, logged to the project's audit trail.

### M4 --- Stakeholder Mapping

**Purpose:** who is affected, how heavily, and in what dimension --- impact scores drive tracking depth.

**In the Bouregreg scenario:** Meryem Sabri's team maps all three sites' functional groups (Order Management, Inventory, Finance, Plant Operations at Kenitra and Settat) against impact dimension and severity, so the Casablanca finance team --- losing the most manual workarounds --- gets flagged for the deepest tracking.

**Create / update / delete:** add, edit, and remove stakeholder/cohort entries, each with a name, dimension, impact severity, and site/department.

**Who can edit:** general write access; individual-level detail is visible only to the roles with individual visibility (Super Admin, Group Admin, Org Admin, Change Manager, People Manager) --- a Practitioner sees the aggregated map.

### M5 --- ADKAR Engine

**Purpose:** score cohorts across the five ADKAR blocks --- Awareness, Desire, Knowledge, Ability, Reinforcement --- with barrier-point diagnosis.

**In the Bouregreg scenario:** Driss El Amrani logs the Bouregreg program's baseline ADKAR pulse here in Week 1 (Part 1's Step 6), then re-scores each block through Parts 3 and 4 as training and go-live proceed.

**Create / update / delete:** set or update each block's 1--5 score and its note; any score of 2 or below requires a barrier-reason note and auto-escalates.

**Who can edit:** general write access, with a mandatory justification on every score change under Bouregreg Group's Governance Setting.

### M6 --- Emotional & Transition Layer

**Purpose:** Bridges transition position and Kübler-Ross sentiment, cross-referenced with ADKAR.

**In the Bouregreg scenario:** this is where Bouregreg's Divergence Pattern alert (Part 5) actually gets its second input --- if Knowledge and Ability read high here on M5 while Bridges is still logged as "Ending" on M6, the two modules together are what the alert is watching.

**Create / update / delete:** set or update the Bridges transition stage and the Kübler-Ross sentiment reading, each with a justification note.

**Who can edit:** general write access, individual-level detail restricted the same way as M4 and M5.

### M7 --- Sponsor & Coalition

**Purpose:** sponsor roadmap, active-versus-passive sponsorship, and guiding coalition strength.

**In the Bouregreg scenario:** tracks the CFO's (Sponsor) visible actions across the program --- the kickoff town hall, the go-live message, the closing town hall --- and whether the Steering Committee coalition around the CFO is holding or thinning as the program proceeds.

**Create / update / delete:** add sponsor actions to the roadmap and mark each one done; edit sponsorship visibility (active/passive) and coalition-strength notes.

**Who can edit:** general write access for logging and marking actions; the Sponsor role itself can typically mark their own roadmap actions done without needing full write access, since that toggle is a narrower capability than editing every field on the page.

### M8 --- Communications

**Purpose:** a message × audience × channel × timing matrix, with saturation detection.

**In the Bouregreg scenario:** every town hall, FAQ update, and go-live announcement across Casablanca, Kenitra, and Settat is logged here; if the same audience is receiving too many messages in too short a window, journi's saturation detection flags it.

**Create / update / delete:** add a new communication (message, audience, channel, timing); delete an existing one. There is no inline "reschedule" on an existing entry --- a superseding communication is logged as a new entry, consistent with the audit trail this module is built to support.

**Who can edit:** general write access.

### M9 --- Training

**Purpose:** curriculum coverage, completion, and demonstrated capability --- trained versus capable.

**In the Bouregreg scenario:** the curriculum built for Casablanca finance, Kenitra plant operations, and Settat plant operations, each entry tracked from enrollment through the Certified toggle once a cohort demonstrates real capability, not just attendance.

**Create / update / delete:** add a new curriculum entry; toggle Certified on an existing one; delete an entry. Completion percentage is not editable in place on an existing row --- as with Communications, a new entry supersedes rather than silently overwrites.

**Who can edit:** general write access.

### M10 --- Resistance

**Purpose:** log, classify, and resolve resistance, linked to concrete mitigation actions --- with a Qualitative Coding Workbench for tagging interview and free-text evidence.

**In the Bouregreg scenario:** where the Settat plant's early resistance to the new inventory workflow is logged, classified by root cause, and linked to the mitigation actions Houda Zerouali and the plant supervisors run in response; the Coding Workbench is where Ghita Bennis tags supervisor 1:1 notes against a shared codebook so recurring themes surface across entries rather than staying anecdotal.

**Create / update / delete:** log, edit, and resolve resistance entries with linked mitigation actions; add and remove codes from the Organization's codebook; tag and untag evidence against those codes.

**Who can edit:** general write access; the Codebook itself (the set of codes available to tag against) is typically managed by whoever holds hierarchy-management rights, since it is shared across every project in the Organization, not owned by one CM Project.

### M11 --- Manager as Coach

**Purpose:** a team-scoped ADKAR heatmap with suggested coaching actions per barrier.

**In the Bouregreg scenario:** Kenitra and Settat plant supervisors --- People Manager role --- open this to see their own team's ADKAR heatmap (not the whole program's) and a suggested coaching action for whichever block is weakest, without needing to interpret raw scores themselves.

**Create / update / delete:** the heatmap itself is computed from M5/M6 data already logged elsewhere; a People Manager logs their own coaching actions taken against the suggestions shown.

**Who can edit:** People Managers see their own team's view by default; Change Manager and above see across teams.

### M12 --- Sustainment

**Purpose:** post-go-live adoption audits, regression detection, and sustainment sign-off.

**In the Bouregreg scenario:** the module Driss El Amrani uses from go-live onward --- checkpoint reviews at 30/60/90 days, logged quick wins, a running lessons-learned log, and the formal sign-off that closes the program once evidence, not the calendar, supports it.

**Create / update / delete:** log and update sustainment checkpoints; add quick wins; add and edit lessons-learned entries; toggle the sign-off once criteria are met.

**Who can edit:** general write access; sign-off is typically reserved for the Change Manager and above.

### M13 --- Risk Register

**Purpose:** adoption, sponsorship, capacity, and saturation risk --- distinct from generic project risk, which lives in the Main Project's own PM tooling, not in journi.

**In the Bouregreg scenario:** tracks Change-Management-specific risks --- for example, Kenitra's plant-floor capacity to absorb training during peak production weeks --- separately from the ERP Platform Unification Main Project's technical and schedule risk.

**Create / update / delete:** add, edit, and close risk entries, each with a category, severity, and status.

**Who can edit:** general write access.

### M14 --- Analytics

**Purpose:** the Composite Readiness Index, adoption curves, and correlation analysis --- journi's benchmarking dashboard.

**In the Bouregreg scenario:** the dashboard the Steering Committee reviews at every phase gate --- the blended readiness score (ADKAR 50%, Kübler-Ross sentiment 25%, training completion 25%) trending against the benchmark band expected at that point in the program, and the correlation view showing which input is actually driving the trend.

**Create / update / delete:** this module is entirely computed --- there is nothing to create, update, or delete here; it reads live from M5, M6, and M9.

**Who can edit:** read access follows each role's normal visibility; there is no write capability on this module.

### M15 --- Journey Map

**Purpose:** a literal, visual timeline combining ADKAR stage, Bridges phase, and sentiment.

**In the Bouregreg scenario:** the single visual a Steering Committee member glances at to see, at a point in time, where the Bouregreg program actually sits across all three readings at once, rather than checking three separate modules.

**Create / update / delete:** computed from M5/M6 data already logged; nothing is created or edited directly on this page.

**Who can edit:** read-only, following each role's normal visibility.

### M16 --- AI Use Case Library

**Purpose:** a governed catalog of Assistive and Augmented AI use cases. No use case acts autonomously.

**In the Bouregreg scenario:** Meryem Sabri activates the specific AI-assisted use cases Bouregreg Group's contract permits (for example, drafting a first pass of a communication or summarizing coded resistance themes) at the Organization level; a Change Manager can further restrict which of those activated use cases their own project actually uses.

**Create / update / delete:** the catalog of use cases itself is a fixed reference list, not editable; what is editable is the activation toggle per Organization and the override toggle per Project, plus the usage log every actual AI call writes to.

**Who can edit:** activation is gated to Org-Admin-and-above; project-level overrides to the Change Manager on that project.

### M17 --- WBS & Gantt

**Purpose:** one Work Breakdown Structure spanning Project Management, Change Management, and the Lewin/Prosci/Bridges/ADKAR framework milestones --- baseline versus actual dates, with the schedule gap called out task by task.

**In the Bouregreg scenario:** Driss El Amrani loads a phase template at kickoff to seed the 14-month program's baseline schedule, then keeps actual dates and status current against it as Parts 3 and 4 of this guide play out --- so a reader can see, task by task, where the real program has drifted from plan.

**Create / update / delete:** load a phase template to seed the WBS; edit individual task dates and status against the loaded baseline; Phase Gates are the checklist/sign-off items attached to each phase boundary.

**Who can edit:** general write access.

### M18 --- Process Registry

**Purpose:** the process backbone every module is built on --- the 10 macro processes, the 16 registered end-to-end chains (core lifecycle, cross-cutting loops, and one per transformation type), and who is Responsible / Accountable / Consulted / Sign-off / Informed for each.

**In the Bouregreg scenario:** the reference Part 3 of this guide walks in full --- every one of the 16 processes, read here and then exercised against Bouregreg's live data elsewhere in journi.

**Create / update / delete:** the Macro Process and End-to-End Process catalogs are fixed reference content, shared platform-wide and not editable per tenant. The RACSI grid --- who holds each of the five roles for each macro process --- is editable cell by cell.

**Who can edit:** RACSI grid edits are gated to whoever holds that capability on the Permission Matrix, by default Org-Admin-and-above; the process catalogs themselves are read-only for every role.

### M19 --- CM Charters

**Purpose:** the 8 signed, trackable behavioral standards governing sponsorship, frontline engagement, communication, impact assessment, coaching and mentoring, and pulse/interview diagnostics --- with concrete action mapping and a per-project compliance log, so charter governance is trackable, not just aspirational.

**In the Bouregreg scenario:** the CFO's Sponsor Charter is signed at kickoff and its compliance log tracks whether the CFO's actual visible behavior (from M7) matches what was signed up to; new or revised Charters can be drafted here as Bouregreg Group's own governance model matures.

**Create / update / delete:** full Charter CRUD --- create a new Charter, edit an existing one (including its RACSI, status, and review frequency), and delete one, though a Charter must be moved out of Active status (to Draft or Retired) before it can be deleted. Separately, log compliance actions against a Charter's action mapping and delete individual log entries.

**Who can edit:** Charter create/edit is gated to whoever holds Charter-management rights on the Permission Matrix; delete is further restricted to Org-Admin-and-above, matching the sensitivity of removing a governance record outright.

### M20 --- Journeys & Analytics

**Purpose:** the experience-layer companion to the score-centric dashboards elsewhere in journi --- 8 persona/exception/system journeys, their concrete touchpoints with success criteria and evidence, 5 journey analytics dashboards, and a project-context overlay distinguishing each case from the generic template.

**In the Bouregreg scenario:** where a reader sees the End User's actual journey through the ERP rollout --- not as a score, but as a sequence of concrete touchpoints (first town hall, first login, first live transaction, first month using the new system unsupervised) each with its own success criteria and logged evidence, overlaid with Bouregreg's real project context rather than the generic template.

**Create / update / delete:** log evidence and mark success criteria met against a journey's touchpoints for the current project; the 8 journey templates themselves are shared reference content.

**Who can edit:** general write access for logging evidence; the underlying journey templates are read-only for every role.

---

---

<a id="part-3"></a>

## Part 3 --- All 16 End-to-End Process Walkthroughs

Module 18's Process Registry holds 16 registered end-to-end chains: 4 core chains spanning the whole Change Management lifecycle, 4 cross-cutting loops that make an existing cross-module dependency explicit and traceable, and 8 transformation-type lifecycles --- one per archetype, each with its own Phase Template in M17. Every chain is built from journi's 10 Macro Processes (MP-01 through MP-10); this Part walks each of the 16 against Bouregreg Group's data, and for the 8 transformation-type lifecycles, against the specific Change Management Project in Part 4 that archetype belongs to.

### The 10 Macro Processes (reference)

| Code | Macro Process |
|---|---|
| MP-01 | Change Impact & Stakeholder Assessment |
| MP-02 | Sponsorship & Governance Management |
| MP-03 | Communication & Awareness Management |
| MP-04 | Resistance & Barrier Management |
| MP-05 | Training & Capability Enablement |
| MP-06 | Champion Network Management |
| MP-07 | Readiness Diagnostics & Signal Capture |
| MP-08 | Divergence & Risk Detection |
| MP-09 | Hypercare & Floor Coaching Support |
| MP-10 | Reinforcement & Sustainment Management |

### Core Chains (E2E-01 --- E2E-04)

#### E2E-01 --- Readiness & Mobilization (Awareness → Launch-Readiness)

**Composition:** MP-01 → MP-02 → MP-03 → MP-06 → MP-07 · **Trigger:** business case and stakeholder map opened · **Terminal state:** mobilized sponsorship, informed and diagnosed population, active champion network · **RACSI:** R=CM, A=ES, C=FPO/PM, S=SUP, I=EU

**In the Bouregreg scenario:** Meryem Sabri opens the Stakeholder Map (M4) for all three sites (MP-01); the CFO's Sponsor roadmap and Steering Committee are stood up on M7 (MP-02); Driss El Amrani launches the kickoff communications wave on M8 (MP-03); the champion network across Casablanca, Kenitra, and Settat is recruited and logged on M4 (MP-06); and the baseline ADKAR/Bridges/Kübler-Ross pulse is read on M5/M6 (MP-07). The chain closes when the CFO's sponsorship is visibly active, the population is informed, and the champion network is live --- exactly the state Part 1's tenant setup ends at.

#### E2E-02 --- Capability & Divergence Management (Training → Verified Competence)

**Composition:** MP-05 → MP-08 → MP-07 · **Trigger:** curriculum, sandbox, and cohort segmentation confirmed from E2E-01 · **Terminal state:** verified capable and emotionally-ready cohorts; Divergence Pattern log · **RACSI:** R=CM, A=CM, C=FPO/ITL, S=PM/SUP, I=ES/EU

**In the Bouregreg scenario:** the training curriculum built for Casablanca finance, Kenitra plant operations, and Settat plant operations runs through M9 (MP-05); as cohorts show real Knowledge/Ability scores on M5, the Divergence Pattern Detector cross-checks them against the Bridges reading on M6 (MP-08); the result feeds back into the readiness diagnostics on M5/M6/M14 (MP-07). This is the chain a Change Manager runs at UAT time --- the first point a cohort's paper knowledge and their actual emotional readiness can visibly diverge.

#### E2E-03 --- Resistance-to-Commitment (Barrier Detection → Buy-In)

**Composition:** MP-04 → MP-06 → MP-07 → MP-09 · **Trigger:** a stalled Desire score or negative sentiment pulse is first logged · **Terminal state:** resolved barriers; recovered Desire/sentiment scores; sustained commitment · **RACSI:** R=CM, A=CM, C=ES/SUP, S=PM, I=FPO/EU

**In the Bouregreg scenario:** when Settat's plant floor logs a Desire score of 2 or below on M5, it auto-escalates and is logged as a barrier on M10 (MP-04); the champion network on M4 surfaces the underlying concern (MP-06); the readiness diagnostics on M5/M6 register the drop (MP-07); and Houda Zerouali's floor-coaching response on M11 is what actually moves the score back up (MP-09). This chain is the backbone of Part 4's compliance and cultural scenarios below, where resistance is the central story rather than a side event.

#### E2E-04 --- Adoption-to-Sustainment (Go-Live → Refreeze)

**Composition:** MP-09 → MP-10 → MP-07 · **Trigger:** go-live cutover executed · **Terminal state:** stabilized new-normal performance; embedded reinforcement; confirmed Refreeze; closed project · **RACSI:** R=CM, A=ES, C=PM/FPO, S=SUP, I=ITL/EU

**In the Bouregreg scenario:** from ERP go-live day, hypercare and floor coaching run on M11/M12 (MP-09); reinforcement mechanisms --- recognition, manager check-ins, revoked legacy-system access --- are confirmed active on M12 (MP-10); and the Lewin phase is only called "Refreeze" on M3 once the readiness diagnostics on M14 support it, not on the calendar date (MP-07). This is the same discipline the ERP User Guide's Exception E3 (Two-Clock Problem) and Exception E5 (Reinforcement Gap) protect against.

### Cross-Cutting Loops (E2E-05 --- E2E-08)

#### E2E-05 --- Signal Aggregation Loop

**Composition:** MP-03 → MP-05 → MP-07 → MP-08 · **Trigger:** new awareness (MP-03) or knowledge/ability (MP-05) signal recorded · **Terminal state:** Composite Readiness Index (MP-07) recalculated and evaluated by the Divergence Pattern Detector (MP-08)

**In the Bouregreg scenario:** this loop is not a separate data-entry screen --- it is the traceable path from a new Communications entry (M8) or Training completion (M9) through to the Composite Readiness Index recalculation on M14 and a fresh Divergence Pattern check on M6. It makes explicit a dependency that already exists in journi's data model: Communications and Training feed ADKAR, and ADKAR feeds the Risk Register.

#### E2E-06 --- PM ↔ CM Governance Bridge

**Composition:** MP-02 → MP-08 · **Trigger:** Main Project schedule slip logged, or a Phase Gate checkpoint reached · **Terminal state:** a Joint Decision Record (Go / Go with Conditions / No-Go), with PM and CM inputs preserved independently and exactly one Accountable role named --- selectable, and may differ from either input's author

**In the Bouregreg scenario:** when the ERP Platform Unification Main Project's technical schedule slips against a Phase Gate on M17, the Joint Decision Record captures both Driss El Amrani's Change Management read and the Main Project's PM read independently, then names one Accountable role for the actual Go/No-Go call --- so a schedule slip never gets silently resolved by whichever discipline happens to write to the record last.

#### E2E-07 --- Champion Early-Warning Loop

**Composition:** MP-06 → MP-04 · **Trigger:** champion floor-level observation logged · **Terminal state:** the observation formalized into a Resistance Log barrier record

**In the Bouregreg scenario:** a Kenitra plant champion notices workaround behavior on the floor before it shows up in any score; logging that observation against the champion network on M4 is what turns it into a formal barrier record on M10 --- the earliest possible point resistance becomes visible to the program, ahead of a score actually moving.

#### E2E-08 --- Governance Escalation Loop

**Composition:** MP-02 → MP-10 · **Trigger:** a Sponsor escalation action is logged · **Terminal state:** the escalation resolved and reflected in the sustainment sign-off

**In the Bouregreg scenario:** journi's own documentation flags this as its weakest-evidence proposed loop, included for completeness rather than as a distinct workflow --- in practice it is largely covered by the CFO's existing escalation actions on M7 and the sustainment checkpoints on M12, and this guide states that plainly rather than overstate the loop's independence from those two modules.

### Transformation-Type Lifecycles (8 archetypes, each with its own Phase Template)

Each of the following pairs one of the 8 registered transformation types with the specific Change Management Project in Part 4 that exercises it. Two of Main Project's ten available archetypes --- Restructuring and M&A --- do not have a dedicated lifecycle or Phase Template of their own; Part 4 states that distinction explicitly where it matters.

| E2E ID | Lifecycle | Composition | Phase Template | Part 4 case |
|---|---|---|---|---|
| E2E-ERP | ERP Implementation | MP-01→02→03→05→07→09→10 | TPL-ERP-8 | Bouregreg ERP Adoption Program (Part 1's throughline) |
| E2E-BPR | Business Process Reengineering | MP-01→02→03→05→07→08→09→10 | TPL-BPR-7 | Order-to-Cash Process Redesign |
| E2E-BPA | Business Process Automation | MP-01→02→03→05→07→08→09→10 | TPL-BPA-7 | Kenitra Invoice-Matching Automation |
| E2E-IMS | Integrated Management System | MP-01→02→03→05→07→08→09→10 | TPL-IMS-7 | ISO 9001/14001 Integrated Management System |
| E2E-CULT | Cultural / Values Transformation | MP-01→02→03→04→06→07→08→09→10 | TPL-CULT-7 | One Bouregreg: Post-Acquisition Culture Integration |
| E2E-OM | Operating Model Redesign | MP-01→02→03→05→07→08→09→10 | TPL-OM-7 | Regional Operating Model Redesign |
| E2E-COMP | Compliance-Driven Change | MP-01→02→03→05→07→08→09→10 | TPL-COMP-7 | Loi 09-08 Data Protection Compliance Program |
| E2E-TSD | Training & Skills Development | MP-01→02→03→05→06→07→08→09→10 | TPL-TSD-7 | Plant Digital Skills Upskilling Program |

Each lifecycle's SIPOC supplier/customer roles are fixed by its type (for example, ERP names the Executive Sponsor, PM, and Change Manager as suppliers and the Steering Committee, End Users, and Sustainment Team as customers; Compliance instead names Legal/Compliance as supplier and the Regulator as customer) --- Part 4 walks each case with its own supplier/customer cast named concretely rather than generically.

---

---

<a id="part-4"></a>

## Part 4 --- Change Management Scenario Library

Bouregreg Group's single tenant (Part 1) holds one Organization, Bouregreg Manufacturing Maroc, under which every Change Management Project in this Part runs. journi's own data model makes this the natural way to show "more than one kind of change" without a second tenant: several CM Projects share one Organization, one Stakeholder Map, one Codebook, and one Permission Matrix, while each keeps its own Lewin phase, ADKAR scores, resistance log, and sustainment record. Running eight further projects alongside the ERP program also does something no single scenario can: two of journi's live alerts --- Change Saturation and Communication Overload --- only fire when several projects target the same population at once, so this library is what actually makes those two alerts real rather than theoretical.

Each case below states its archetype, business driver, target population, starting readiness pattern, and --- concretely, not abstractly --- which of journi's 9 live-computed alerts it is built to exercise.

### Bouregreg ERP Adoption Program *(archetype: ERP --- E2E-ERP)*

Covered in full in Part 1 (setup) and Part 3 (E2E-01 through E2E-04, and E2E-ERP). Target population: all 3,400 staff across Casablanca, Kenitra, and Settat. Starting Lewin phase: Unfreeze. This is the throughline case, and the one most likely to trigger **ALT-001 (Divergence Pattern Detected)** at UAT if a cohort's Knowledge and Ability scores both reach 4 while Bridges still reads Ending --- and **ALT-009 (Phase Gate No-Go / Conditional)** if a Phase Gate closes as anything other than a clean Go.

### Order-to-Cash Process Redesign *(archetype: BPR --- E2E-BPR)*

Casablanca HQ's finance function has run order-to-cash manually since before the ERP program began; this project redesigns the process itself, independent of any system change. Business driver: three weeks of month-end reconciliation work, self-inflicted by the process design, not the tooling. Target population: Casablanca finance (140 staff). Starting pattern: finance staff who built and privately own today's manual workarounds resist a redesign that makes those workarounds obsolete --- by design, this case is built to cross the resistance-escalation threshold and fire **ALT-004 (Resistance Escalation Threshold Breached)** once three or more open resistance entries accumulate.

### Kenitra Invoice-Matching Automation *(archetype: Automation --- E2E-BPA)*

A narrow, well-scoped robotic process automation project matching supplier invoices against purchase orders at the Kenitra plant. Business driver: a repetitive task with no judgment calls, a strong automation candidate. Target population: Kenitra accounts payable (18 staff). Starting pattern: this is this guide's deliberate low-resistance, fast-moving contrast case --- narrow scope, an already-bought-in team, and a Sponsor who is visibly active from day one. It is designed to close without any of the 9 live alerts firing, which is itself the point: not every Change Management Project needs a recovery playbook, and this guide states that plainly rather than manufacture a crisis where none exists.

### ISO 9001/14001 Integrated Management System *(archetype: QMS --- E2E-IMS)*

Settat plant pursues integrated ISO 9001 (quality) and ISO 14001 (environmental) certification on one management system rather than two. Business driver: a customer contract now requires certified quality management; a parallel environmental certification is bundled in for efficiency. Target population: Settat plant operations and quality function (410 staff). Starting pattern: the Quality Manager sponsors the program alone, without a broader guiding coalition behind them --- built to fire **ALT-010 (Guiding Coalition Gap)** once the Sponsor & Coalition record (M7) shows fewer than two named coalition members.

### One Bouregreg: Post-Acquisition Culture Integration *(archetype: Cultural --- E2E-CULT)*

Six months into the ERP program, Bouregreg Group acquires a smaller regional competitor's Tangier distribution operation. This project is the culture integration that follows --- aligning two distinct ways of working under one set of values, not a system or process change. Business driver: the acquisition's stated synergies depend on the two workforces actually operating as one company within 18 months. Target population: the acquired Tangier team (260 staff) plus their new Bouregreg counterparts. Starting pattern: a newly appointed integration Sponsor has not yet logged any visible activity in the record --- built to fire **ALT-003 (Sponsor Coverage Gap)** in the program's early weeks, before that Sponsor's first town hall is logged.

### Regional Operating Model Redesign *(archetype: Operating Model --- E2E-OM)*

Realigns reporting lines across all three sites from a site-based structure to a function-based one --- Finance, Operations, and Quality each reporting centrally rather than to a site director. Business driver: the ERP program exposed how much duplicated decision-making the site-based structure was causing. Target population: all people-manager-level staff across the three sites (95 staff). Starting pattern: this case runs past its first 30-day sustainment checkpoint with regression risk logged as high --- built to fire **ALT-002 (Regression Risk Score Critical)** at that checkpoint, and consequently **ALT-015 (Sustainment Sign-Off Blocked)** until the regression is resolved and a clean checkpoint follows.

### Loi 09-08 Data Protection Compliance Program *(archetype: Compliance --- E2E-COMP)*

Brings Bouregreg Group's customer and employee data handling into compliance with Morocco's Loi n° 09-08 on the protection of personal data, under the national data protection authority's (CNDP) oversight. Business driver: a scheduled CNDP audit with a fixed external deadline, not a discretionary program. Target population: any function touching customer or employee personal data --- HR, Sales, Customer Service (310 staff). This case's SIPOC is fixed by its type: Legal/Compliance is the supplier, the regulator is the customer, a cast this guide names concretely rather than leaves generic. Because its deadline is externally fixed, this is the case in the library where a Phase Gate closing as anything but Go carries the least schedule flexibility --- the practical reason **ALT-009** matters most here even when it does not fire.

### Plant Digital Skills Upskilling Program *(archetype: Training & Skills Development --- E2E-TSD)*

A standalone digital-literacy and systems-skills program for plant-floor staff at Kenitra and Settat, run independent of any specific system rollout --- preparing the workforce for the next several years of technology change generally, not one program's go-live. Business driver: a skills gap identified independently of the ERP program, but accelerated once the ERP program made it visible. Target population: plant-floor staff without prior systems training (620 staff). This is the case that most exercises M9 (Training) and M16 (AI Use Case Library, for AI-assisted curriculum drafting) in this guide's library, without a go-live event of its own to anchor to.

### Settat Plant Consolidation & Workforce Restructuring *(archetype: Restructuring --- no dedicated E2E lifecycle)*

Consolidates two overlapping production lines at the Settat plant into one, with a workforce restructuring as a direct consequence. This case is included deliberately without a dedicated End-to-End lifecycle or Phase Template of its own: Restructuring is one of Main Project's ten available archetypes, but --- unlike ERP, BPR, Automation, QMS, Cultural, Operating Model, Compliance, and Training & Skills --- it is not one of the 8 types the E2E addendum built a registered chain for. It runs on the 4 core chains (E2E-01 through E2E-04) generically instead, and this guide states that gap plainly rather than imply a lifecycle exists where it does not. Business driver: sustained overcapacity on the older of the two lines. Target population: the affected line's 130 staff. Starting pattern: the highest-resistance case in the library by design, expected to cross the resistance threshold early and stay there --- a second, independent source (alongside Order-to-Cash) of **ALT-004** firing in this Organization.

### What the portfolio view shows

With nine Change Management Projects now running under one Organization, two alerts become visible that no single project could trigger alone:

- **ALT-008 (Change Saturation Threshold Breached)** fires once a project's population segment is targeted by two or more other concurrent initiatives in the same Organization --- true almost everywhere in this library by design, since the ERP program, the Operating Model redesign, and the Training & Skills program all reach broad, overlapping populations across the same three sites.
- **ALT-011 (Communication Overload Detected)** fires once the combined not-yet-sent communications queued across a population's concurrent initiatives exceed three --- realistic here precisely because nine programs are drafting town halls, FAQs, and go-live messages against overlapping audiences at the same time, which is exactly the condition this alert exists to catch before it reaches an inbox.

Between them, the nine cases above exercise every one of journi's 9 live-computed alerts at least once --- eight through a single project's own data, and the last two only because the portfolio, taken together, is what makes them real. Part 5 covers all 9 in full, plus the 7 reference alerts in journi's D07 catalog that are documented but not live-computed in this build.

---

---

<a id="part-5"></a>

## Part 5 --- Alerts and Analytics Reference

### 5.1 How alerts work in journi

journi has no backend to send real email, push, or Teams notifications, so the Notification Center --- reached from the bell icon in the TopBar --- is the client-side equivalent: a persistent, dismissible in-app log. journi's alert catalog registers 16 alerts total; of those, **9 have a condition directly computable from data already in journi's client-side model, and are live** --- they actually fire, dismiss, and re-evaluate as Bouregreg Group's data changes. The other 7 are documented for traceability but never fire in this build, for two different reasons stated plainly rather than left implicit: 6 depend on infrastructure journi does not have (a real backend, AI confidence scoring, authentication lockout, a request-tracking system), and the 7th --- Champion Coverage Below Target --- is excluded because journi has no structured champion-tracking data model to compute it from (a coalition member carries a free-text role field, not a governed Champion entity), so there is no genuine signal to compute, only one that could be faked.

### 5.2 The 9 live alerts

| ID | Name | Severity | Trigger condition (as actually computed) | Escalation | SLA |
|---|---|---|---|---|---|
| ALT-001 | Divergence Pattern Detected | High | Knowledge ≥ 4 **and** Ability ≥ 4 on M5, while Bridges reads exactly "Ending" on M6, for the same cohort | L2 --- Change Manager | Acknowledge within 48h |
| ALT-002 | Regression Risk Score Critical | Critical | A sustainment checkpoint on M12 is marked complete with regression risk logged as High | L2 --- Change Manager | Acknowledge within 24h |
| ALT-003 | Sponsor Coverage Gap | Medium | Sponsor visibility on M7 is logged as "weak" | L1 --- PMO | Acknowledge within 5 business days |
| ALT-004 | Resistance Escalation Threshold Breached | High | 3 or more open (non-closed) entries in the Resistance Log on M10 | L2 --- Steering Committee | Acknowledge within 3 business days |
| ALT-008 | Change Saturation Threshold Breached | Medium | A project's population segment is targeted by 2 or more other concurrent CM Projects in the same Organization | L1 --- PMO | Review within 10 business days |
| ALT-009 | Phase Gate No-Go / Conditional | High | A Phase Gate on M17 records a Joint Decision other than a clean "Go" | L2 --- Program/Project Manager | Review within 3 business days |
| ALT-010 | Guiding Coalition Gap | Medium | The Sponsor & Coalition record on M7 names fewer than 2 coalition members | L1 --- PMO | Review within 10 business days |
| ALT-011 | Communication Overload Detected | Low | More than 3 not-yet-sent communications are queued for one population across this and other concurrent projects in the same Organization | L1 --- Change Manager | Review within 5 business days |
| ALT-015 | Sustainment Sign-Off Blocked | Medium | Sign-off on M12 is not yet given, and a checkpoint carries a High regression-risk flag | L1 --- Change Manager | Review within 5 business days |

Part 4's nine-project scenario library was deliberately designed so that every one of these 9 fires at least once against Bouregreg Group's real data --- seven from a single project's own record, and ALT-008 and ALT-011 only because several projects are genuinely running concurrently against overlapping populations.

### 5.3 The 7 catalogued but non-live alerts

| ID | Name | Why it never fires here |
|---|---|---|
| ALT-005 | Survey Exception Escalated to Admin | Depends on a real backend to run and retry surveys |
| ALT-006 | Champion Coverage Below Target | No governed Champion data entity exists to compute against --- see 5.1 |
| ALT-007 | AI Use Case Confidence Below Threshold | Depends on a real AI confidence-scoring pipeline |
| ALT-012 | Import Integrity Check Failed | Depends on a real backend data-import pipeline |
| ALT-013 | Administrative Account Locked | Depends on real authentication/lockout infrastructure |
| ALT-014 | GDPR Request SLA at Risk | Depends on a real request-tracking system |
| ALT-016 | AI Provider Fallback Triggered | Depends on a real multi-provider AI backend |

### 5.4 The two computed metrics behind the alerts

Two numbers drive several of the alerts and dashboards above, and journi computes both automatically rather than leave them to a Change Manager's arithmetic:

- **Composite Readiness Index** (M14): `ADKAR% × 0.50 + Kübler-Ross sentiment% × 0.25 + Training completion% × 0.25`. Recalculated live as any of its three inputs change; this is the number the Steering Committee reviews at every phase gate in Part 3 and Part 4.
- **Divergence Pattern Detector**: the same boolean rule that drives ALT-001 --- Knowledge ≥ 4 and Ability ≥ 4 while Bridges reads exactly "Ending." It is not a separate module; it is computed live from M5 and M6 data and surfaces exclusively as ALT-001 in the Notification Center.

### 5.5 Where to look, by role

- **Change Manager** (Driss El Amrani, Houda Zerouali on their own scenarios): the Notification Center bell first, then M14 for the trend behind whatever fired.
- **Executive Sponsor / Steering Committee**: M14's benchmarking view for the blended readiness trend; ALT-003, ALT-004, ALT-009, and ALT-010 are the four most likely to name them directly as a recipient.
- **PMO / Program Manager**: ALT-008 and ALT-009 are PM-facing by design --- saturation and gate outcomes are portfolio- and schedule-level concerns first.
- **Super Admin**: none of the 9 live alerts route to Super Admin by default; their standing responsibility is Part 1's tenant configuration (License, Permission Matrix, Governance Settings), not day-to-day alert triage.

---

---

<a id="appendix"></a>

## Appendix --- Quick Reference

### A.1 Role Legend

| Role | Scope level | Individual visibility? | General write access? | Bouregreg example |
|---|---|---|---|---|
| Super Admin | Platform | Yes | Yes (plus License, Permission Matrix) | Zineb Alaoui |
| Group Admin | Group | Yes | Yes (plus hierarchy management) | Anas Bouzid |
| Org Admin | Organization | Yes | Yes (plus hierarchy management) | Meryem Sabri |
| Change Manager | Project | Yes | Yes | Driss El Amrani |
| People Manager | Project | Yes | Yes | Houda Zerouali |
| Practitioner / Contributor | Project | No (aggregated only) | Yes | Ghita Bennis |
| Sponsor | Project | No | No (own roadmap actions only) | CFO, Bouregreg Group |
| Executive | Organization | No | No | Board Executive Viewer |
| Employee | Project | No | No | Reda Loukili |

### A.2 RACSI Legend

journi's RACSI convention (D17 CAT-02) uses seven role codes rather than the generic five RACI roles, so a Change Management responsibility and a Project Management one can be named separately in the same grid:

| Code | Meaning | Rule |
|---|---|---|
| **R** | Responsible | May be more than one role per Task or process |
| **A** | Accountable | Exactly one role, always |
| **C** | Consulted | Two-way input sought before the decision |
| **S** | Support | Contributes effort but is not Responsible |
| **I** | Informed | One-way notification after the fact |

Role-code abbreviations used throughout this guide: **ES** Executive Sponsor · **CM** Change Manager · **PM** Program/Project Manager · **FPO** Functional Process Owner · **ITL** IT/Technical Lead · **SUP** Supervisor · **EU** End User.

### A.3 The Four Frameworks, One Page

| Framework | Altitude | Stages, in order | Logged on | Auto-computed? |
|---|---|---|---|---|
| Lewin | Organizational | Unfreeze → Change → Refreeze | M3 | No --- judgment call |
| Prosci ADKAR | Individual / cohort | Awareness → Desire → Knowledge → Ability → Reinforcement | M5 | No --- judgment call, per block |
| Bridges' Transition Model | Individual / cohort | Ending → Neutral Zone → New Beginning | M6 | No --- judgment call |
| Kübler-Ross Change Curve | Individual / cohort | Denial → Resistance/Anger → Exploration → Commitment | M6 | No --- judgment call |
| *(derived)* Composite Readiness Index | Blended | 0--100%, ADKAR 50% + sentiment 25% + training 25% | M14 | **Yes** --- live |
| *(derived)* Divergence Pattern Detector | Blended | Boolean: Knowledge ≥ 4 and Ability ≥ 4 while Bridges = Ending | Surfaces as ALT-001 | **Yes** --- live |

### A.4 Module Index (M1--M20)

| Module | Name | Primarily holds | Editable? |
|---|---|---|---|
| M1 | Hierarchy | Groups, Organizations, Main/CM Projects | CRUD |
| M2 | Identity & RBAC | Users, Permission Matrix, Governance, License | CRUD |
| M3 | Initiative Registry | Business driver, scope, Lewin phase | CRUD |
| M4 | Stakeholder Mapping | Cohorts, impact dimension/severity, champions | CRUD |
| M5 | ADKAR Engine | Five block scores, barrier notes | CRUD |
| M6 | Emotional & Transition | Bridges stage, Kübler-Ross sentiment | CRUD |
| M7 | Sponsor & Coalition | Sponsor roadmap, coalition members | CRUD |
| M8 | Communications | Message × audience × channel × timing | CRUD |
| M9 | Training | Curriculum, completion, certification | CRUD |
| M10 | Resistance | Resistance log, Qualitative Coding Workbench | CRUD |
| M11 | Manager as Coach | Team ADKAR heatmap, coaching actions | Computed view + logged actions |
| M12 | Sustainment | Checkpoints, quick wins, lessons, sign-off | CRUD |
| M13 | Risk Register | CM-specific risk entries | CRUD |
| M14 | Analytics | Composite Readiness Index, adoption curves | Read-only (computed) |
| M15 | Journey Map | Combined ADKAR/Bridges/sentiment timeline | Read-only (computed) |
| M16 | AI Use Case Library | Governed AI use-case catalog | Activation toggles only |
| M17 | WBS & Gantt | Baseline vs. actual schedule, Phase Gates | CRUD |
| M18 | Process Registry | 10 macro processes, 16 E2E chains, RACSI grid | RACSI grid editable; catalogs read-only |
| M19 | CM Charters | 8 signed behavioral standards, compliance log | CRUD |
| M20 | Journeys & Analytics | 8 experience journeys, touchpoint evidence | Evidence logging; templates read-only |

### A.5 The 16 End-to-End Processes Index

| ID | Name | Kind |
|---|---|---|
| E2E-01 | Readiness & Mobilization | Core |
| E2E-02 | Capability & Divergence Management | Core |
| E2E-03 | Resistance-to-Commitment | Core |
| E2E-04 | Adoption-to-Sustainment | Core |
| E2E-05 | Signal Aggregation Loop | Cross-cutting loop |
| E2E-06 | PM ↔ CM Governance Bridge | Cross-cutting loop |
| E2E-07 | Champion Early-Warning Loop | Cross-cutting loop |
| E2E-08 | Governance Escalation Loop | Cross-cutting loop |
| E2E-ERP | ERP Implementation Lifecycle | Transformation type |
| E2E-BPR | Business Process Reengineering Lifecycle | Transformation type |
| E2E-BPA | Business Process Automation Lifecycle | Transformation type |
| E2E-IMS | Integrated Management System Lifecycle | Transformation type |
| E2E-CULT | Cultural / Values Transformation Lifecycle | Transformation type |
| E2E-OM | Operating Model Redesign Lifecycle | Transformation type |
| E2E-COMP | Compliance-Driven Change Lifecycle | Transformation type |
| E2E-TSD | Training & Skills Development Lifecycle | Transformation type |

### A.6 Glossary

- **ADKAR** --- Prosci's individual-change model: Awareness, Desire, Knowledge, Ability, Reinforcement.
- **Bridges' Transition Model** --- William Bridges' three-stage emotional model: Ending, Neutral Zone, New Beginning.
- **Composite Readiness Index (CRI)** --- journi's single blended readiness number; ADKAR 50% + Kübler-Ross sentiment 25% + training completion 25%.
- **Divergence Pattern Detector** --- journi's automated check for a cohort whose demonstrated capability (Knowledge/Ability) has outpaced their emotional transition (Bridges still "Ending"); surfaces as ALT-001.
- **E2E** --- End-to-End (process chain), registered on M18.
- **Kübler-Ross Change Curve** --- as implemented in journi, a simplified four-stage sentiment model: Denial, Resistance/Anger, Exploration, Commitment.
- **Lewin's Change Model** --- Kurt Lewin's organizational three-stage model: Unfreeze, Change, Refreeze.
- **MP** --- Macro Process (one of journi's 10 registered process categories, MP-01 through MP-10).
- **RACSI** --- journi's seven-role responsibility grid; see A.2.
- **SIPOC** --- Suppliers, Inputs, Process, Outputs, Customers --- the process-mapping frame used throughout Part 1B and Part 3.
- **TPL-ERP-8** --- journi's 8-phase ERP implementation Phase Template (M17): Discovery, Design, Build, Test, Train, Deploy, Hypercare, Sustain.
- **WBS** --- Work Breakdown Structure, M17's combined Project Management / Change Management schedule.

---

*This concludes the journi Complete User Guide --- Parts 1, 1B, and 2 through 5, plus this Appendix.*
