**journi**

**The Complete User Guide**

*Tenant Setup · All 21 Modules · All 16 End-to-End Processes · A Change Management Scenario Library*

*A Single Running Organization, Followed From Tenant Creation to Sustainment*

Version 1.0 · August 2026 · Confidential

---

<a id="part-0"></a>

## Part 0 --- Purpose and How to Use This Guide

### What this guide is

This is journi's single comprehensive reference: one guide that starts at a genuinely empty tenant, walks through every one of journi's 21 modules, exercises all 16 processes in the End-to-End Process Catalogue, and hosts a library of distinct Change Management scenarios so a reader can see how journi behaves across more than one kind of change --- not only a large technology rollout.

It is organized in five parts:

- **Part 1 --- Tenant and Admin Setup.** How a brand-new journi tenant is actually built, from the License record through the first Change Management Project, using a new scenario organization created for this guide: **Bouregreg Group**, a Moroccan manufacturing group.
- **Part 1B --- Week-by-Week ERP Implementation Timeline.** The Bouregreg ERP Adoption Program run forward week by week for its full 64-week duration, across all four frameworks' real stage vocabulary, in journi's own 8-phase ERP structure --- normal flow first, then six realistic exception scenarios in the same level of detail.
- **Part 2 --- Module-by-Module Feature Tour.** All 21 modules, each demonstrated against Bouregreg Group's real, growing data set, with CRUD and RBAC behavior called out per role.
- **Part 3 --- All 16 End-to-End Process Walkthroughs.** Every process in the End-to-End Process Catalogue --- the 4 core Change Management chains, the 4 cross-cutting loops, and the 8 transformation-type lifecycles --- each walked through step by step against Bouregreg Group's data.
- **Part 4 --- Change Management Scenario Library.** Several distinct Change Management Projects under the same tenant, each a different archetype (technology, structural, cultural, compliance) and a different readiness pattern, so the guide shows more than one way a program can actually unfold.
- **Part 5 --- Alerts and Analytics Reference.** All of journi's live-computed alerts and dashboards, what triggers each, and where to find them.

### How to use it

Read Part 1 once, at setup time, or skip it if your tenant already exists. From there, use Part 2 as a module-by-module reference, Part 3 when you need to run a specific end-to-end process, and Part 4 when you want to see how journi handles a scenario other than a straightforward technology rollout. Part 5 is a standing reference --- keep it open alongside the Notification Center.

### A note on fidelity

Every screen, field, tab, and button named in this guide is verified against journi's actual source code, not assumed from a spec. Where a feature has a real constraint --- for example, that an Organization's sector is one of exactly three values, or that a Change Management Project may link to zero, one, or more Main Projects --- this guide states that constraint rather than working around it. Nothing here describes a feature journi does not actually have.

### Reading paths, by role

This guide is long by design, and no single reader needs all of it at once. A few starting points:

- **A Super Admin setting up a new tenant:** Part 1 in full, then Part 2 as a standing reference once modules are in use.
- **A Change Manager running a program day to day:** Part 1B in full --- it is written as the operating manual for exactly this role --- then Part 2 for any module whose fields aren't yet familiar, and Part 5 kept open alongside the Notification Center.
- **A Program/Project Manager focused on the PM ↔ CM boundary:** Part 3's E2E-06 (Governance Bridge), Part 1B.3's eight Phase Gates, and Section 5.6's alert cross-reference, which is PM-facing by design for ALT-008 and ALT-009.
- **An Executive Sponsor or Steering Committee member:** Part 0 for orientation, Part 1B.2's calendar and 1B.6's month-by-month account for the shape of the program, and Section 5.5 for which alerts name that role directly.
- **Someone evaluating journi for a new organization, not yet a Change Manager:** Part 0, then Part 4 in full --- the fastest way to see the breadth of what one journi tenant can actually hold.
- **Someone who just needs one fact fast:** the Appendix, A.1 through A.6, is built as a standalone quick-reference and does not require having read the rest of the guide first.

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

With this checklist complete, Bouregreg Group is a fully operational journi tenant with one live Change Management Project. Part 1B walks that project week by week through all four frameworks, normal flow and exceptions; Part 2 then tours all 21 modules against this same, now-real data set.

---

<a id="part-1b"></a>

## Part 1B --- Week-by-Week ERP Implementation Timeline: Normal Flow and Exceptions

Part 1 ended with Bouregreg ERP Adoption Program registered and its Lewin phase opened at Unfreeze. This Part runs that program forward, week by week, for its full 14-month (64-week) duration --- against journi's own 8-phase ERP template (M17 (WBS & Gantt), TPL-ERP-8: Discovery, Design, Build, Test, Train, Deploy, Hypercare, Sustain) and journi's own framework definitions, verified against source rather than assumed. It covers the normal flow through all four frameworks first, then --- in the same level of detail --- six realistic exception patterns, each tied to a specific point in Bouregreg's timeline where a program's readiness signals genuinely go off track.

<a id="p1b-1"></a>

### 1B.1 How the Four Frameworks Actually Read in journi

journi tracks four frameworks, each at a different altitude, and this guide states their real stage vocabulary rather than a textbook approximation of it:

| Framework | Altitude | Stages (in journi's own UI, in order) | Logged on |
|---|---|---|---|
| Lewin | Organizational --- one reading per project | Unfreeze → Change → Refreeze | M3 (Initiative Registry) |
| Prosci ADKAR | Individual / cohort --- five independently-scored blocks | Awareness → Desire → Knowledge → Ability → Reinforcement | M5 (ADKAR Engine) |
| Bridges' Transition Model | Individual / cohort --- emotional position | Ending → Neutral Zone → New Beginning | M6 (Emotional & Transition Layer) |
| Kübler-Ross Change Curve | Individual / cohort --- sentiment | Denial → Resistance/Anger → Exploration → Commitment | M6 (Emotional & Transition Layer) |

A deliberate design choice in journi is worth stating plainly here: it never auto-computes a Lewin, Bridges, or Kübler-Ross reading. All three remain a Change Manager's evidence-based judgment call, logged with a justification under Bouregreg Group's Governance Setting (Part 1, Step 5). Only two things are ever computed automatically --- the Composite Readiness Index (M14 (Analytics), blending ADKAR 50%, Kübler-Ross sentiment 25%, and training completion 25%) and the Divergence Pattern Detector (ALT-001 (Divergence Pattern Detected), firing when Knowledge ≥ 4 and Ability ≥ 4 while Bridges still reads exactly "Ending"). Everything else in the four-framework picture is a human reading, not a system inference --- which is exactly why the timeline below shows a Change Manager actively setting each reading, week by week, rather than journi silently deriving one.

The four frameworks do not move in lockstep, and a well-run program does not expect them to. Lewin is the single organizational headline; ADKAR is where individual barriers actually surface, block by block; Bridges and Kübler-Ross track the emotional undercurrent that a clean ADKAR score can mask entirely --- which is the exact gap the Divergence Pattern Detector exists to catch. The calendar below shows one defensible way these four readings progress together across a normal 64-week ERP program; Section 1B.4's six exceptions show, in detail, the specific and realistic ways that progression stalls, diverges, or reverses.

<a id="p1b-2"></a>

### 1B.2 The 64-Week Program Calendar --- Week by Week

The eight phases below follow M17 (WBS & Gantt)'s TPL-ERP-8 (ERP Implementation --- 8 Phase) template exactly, in the order journi loads them. Every one of the 64 individual weeks below is listed on its own row --- not as a range --- so a reader can see exactly which week a framework reading, a phase transition, or an exception is active in, rather than inferring it from a span. The values are this guide's own illustrative pacing for a 3,400-person, three-site program --- not a value hardcoded anywhere in journi --- built to overlap the way a real ERP program's Project Management and Change Management tracks actually do, and stated as illustrative rather than implied to be a platform default. The final Exception column cross-references Section 1B.4, where each of the six is covered in full detail.

| Week | Phase(s) Active | Lewin | ADKAR Focus | Bridges | Kübler-Ross | Exception |
|---|---|---|---|---|---|---|
| Week 1 | Discovery | Unfreeze | Awareness | Ending | Denial | --- |
| Week 2 | Discovery | Unfreeze | Awareness | Ending | Denial | --- |
| Week 3 | Discovery | Unfreeze | Awareness | Ending | Denial | --- |
| Week 4 | Discovery | Unfreeze | Awareness | Ending | Denial | --- |
| Week 5 | Discovery | Unfreeze | Awareness | Ending | Denial | --- |
| Week 6 | Discovery | Unfreeze | Awareness | Ending | Denial | --- |
| Week 7 | Discovery | Unfreeze | Awareness | Ending | Denial | --- |
| Week 8 | Discovery | Unfreeze | Awareness | Ending | Denial | --- |
| Week 9 | Discovery + Design | Unfreeze | Awareness | Ending | Denial | --- |
| Week 10 | Discovery + Design | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger | --- |
| Week 11 | Discovery + Design | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger | --- |
| Week 12 | Design + Build | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger | --- |
| Week 13 | Design + Build | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger | --- |
| Week 14 | Design + Build | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger | --- |
| Week 15 | Design + Build | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger | --- |
| Week 16 | Design + Build | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger | --- |
| Week 17 | Design + Build | Unfreeze | Awareness → Desire | Ending | Denial → Resistance/Anger | --- |
| Week 18 | Build | Unfreeze | Desire | Ending → Neutral Zone | Denial → Resistance/Anger | --- |
| Week 19 | Build | Unfreeze | Desire | Ending → Neutral Zone | Denial → Resistance/Anger | --- |
| Week 20 | Build | Unfreeze | Desire | Ending → Neutral Zone | Denial → Resistance/Anger | E1 (Desire Stall at Settat) |
| Week 21 | Build | Unfreeze | Desire | Ending → Neutral Zone | Resistance/Anger | E1 (Desire Stall at Settat) |
| Week 22 | Build | Unfreeze | Desire | Ending → Neutral Zone | Resistance/Anger | E1 (Desire Stall at Settat) |
| Week 23 | Build | Unfreeze | Desire | Ending → Neutral Zone | Resistance/Anger | E1 (Desire Stall at Settat) |
| Week 24 | Build | Unfreeze | Desire | Ending → Neutral Zone | Resistance/Anger | E1 (Desire Stall at Settat) |
| Week 25 | Build | Unfreeze | Desire | Ending → Neutral Zone | Resistance/Anger | --- |
| Week 26 | Build | Change | Desire | Ending → Neutral Zone | Resistance/Anger | --- |
| Week 27 | Build | Change | Desire | Ending → Neutral Zone | Resistance/Anger | --- |
| Week 28 | Build + Test | Change | Desire → Knowledge | Ending → Neutral Zone | Resistance/Anger | --- |
| Week 29 | Build + Test | Change | Desire → Knowledge | Ending → Neutral Zone | Resistance/Anger | --- |
| Week 30 | Build + Test + Train | Change | Desire → Knowledge | Neutral Zone | Resistance/Anger | --- |
| Week 31 | Test + Train | Change | Desire → Knowledge | Neutral Zone | Resistance/Anger | E2 (Divergence Pattern at UAT) |
| Week 32 | Test + Train | Change | Desire → Knowledge | Neutral Zone | Resistance/Anger | E2 (Divergence Pattern at UAT) |
| Week 33 | Test + Train | Change | Desire → Knowledge | Neutral Zone | Resistance/Anger | E2 (Divergence Pattern at UAT) |
| Week 34 | Test + Train | Change | Desire → Knowledge | Neutral Zone | Resistance/Anger | --- |
| Week 35 | Test + Train | Change | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration | --- |
| Week 36 | Test + Train | Change | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration | E6 (Cohort Divergence Across Sites) |
| Week 37 | Test + Train | Change | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration | E6 (Cohort Divergence Across Sites) |
| Week 38 | Test + Train | Change | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration | E6 (Cohort Divergence Across Sites) |
| Week 39 | Train | Change | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration | E6 (Cohort Divergence Across Sites) |
| Week 40 | Train | Change | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration | E6 (Cohort Divergence Across Sites) |
| Week 41 | Train | Change | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration | E6 (Cohort Divergence Across Sites) |
| Week 42 | Train | Change | Knowledge → Ability | Neutral Zone | Resistance/Anger → Exploration | E6 (Cohort Divergence Across Sites) |
| Week 43 | Deploy | Change → Refreeze (provisional) | Ability | Neutral Zone → New Beginning (provisional) | Exploration | E6 (Cohort Divergence Across Sites); E3 (Two-Clock Problem at Deploy) |
| Week 44 | Hypercare | Change → Refreeze (provisional) | Ability → Reinforcement | New Beginning | Exploration | E6 (Cohort Divergence Across Sites); E3 (Two-Clock Problem at Deploy) |
| Week 45 | Hypercare | Change → Refreeze (provisional) | Ability → Reinforcement | New Beginning | Exploration | E6 (Cohort Divergence Across Sites); E3 (Two-Clock Problem at Deploy); E4 (Sentiment Regression During Hypercare) |
| Week 46 | Hypercare | Change → Refreeze (provisional) | Ability → Reinforcement | New Beginning | Exploration | E6 (Cohort Divergence Across Sites); E3 (Two-Clock Problem at Deploy); E4 (Sentiment Regression During Hypercare) |
| Week 47 | Hypercare | Change → Refreeze (provisional) | Ability → Reinforcement | New Beginning | Exploration | E6 (Cohort Divergence Across Sites); E3 (Two-Clock Problem at Deploy) |
| Week 48 | Hypercare | Change → Refreeze (provisional) | Ability → Reinforcement | New Beginning | Exploration | E6 (Cohort Divergence Across Sites); E3 (Two-Clock Problem at Deploy) |
| Week 49 | Hypercare | Change → Refreeze (provisional) | Ability → Reinforcement | New Beginning | Exploration → Commitment | E6 (Cohort Divergence Across Sites); E3 (Two-Clock Problem at Deploy) |
| Week 50 | Hypercare | Change → Refreeze (provisional) | Ability → Reinforcement | New Beginning | Exploration → Commitment | E6 (Cohort Divergence Across Sites); E3 (Two-Clock Problem at Deploy) |
| Week 51 | Sustain | Change → Refreeze (provisional) | Reinforcement | New Beginning | Exploration → Commitment | E3 (Two-Clock Problem at Deploy) |
| Week 52 | Sustain | Change → Refreeze (provisional) | Reinforcement | New Beginning | Exploration → Commitment | --- |
| Week 53 | Sustain | Change → Refreeze (provisional) | Reinforcement | New Beginning | Exploration → Commitment | --- |
| Week 54 | Sustain | Change → Refreeze (provisional) | Reinforcement | New Beginning | Exploration → Commitment | --- |
| Week 55 | Sustain | Change → Refreeze (provisional) | Reinforcement | New Beginning | Exploration → Commitment | --- |
| Week 56 | Sustain | Refreeze (confirmed) | Reinforcement | New Beginning (confirmed) | Commitment | E5 (Reinforcement Gap at Sustain) |
| Week 57 | Sustain | Refreeze (confirmed) | Reinforcement | New Beginning (confirmed) | Commitment | E5 (Reinforcement Gap at Sustain) |
| Week 58 | Sustain | Refreeze (confirmed) | Reinforcement | New Beginning (confirmed) | Commitment | E5 (Reinforcement Gap at Sustain) |
| Week 59 | Sustain | Refreeze (confirmed) | Reinforcement | New Beginning (confirmed) | Commitment | E5 (Reinforcement Gap at Sustain) |
| Week 60 | Sustain | Refreeze (confirmed) | Reinforcement | New Beginning (confirmed) | Commitment | E5 (Reinforcement Gap at Sustain) |
| Week 61 | Sustain | Refreeze (confirmed) | Reinforcement | New Beginning (confirmed) | Commitment | E5 (Reinforcement Gap at Sustain) |
| Week 62 | Sustain | Refreeze (confirmed) | Reinforcement | New Beginning (confirmed) | Commitment | E5 (Reinforcement Gap at Sustain) |
| Week 63 | Sustain | Refreeze (confirmed) | Reinforcement | New Beginning (confirmed) | Commitment | E5 (Reinforcement Gap at Sustain) |
| Week 64 | Sustain | Refreeze (confirmed) | Reinforcement | New Beginning (confirmed) | Commitment | E5 (Reinforcement Gap at Sustain) |

Two things about this calendar are deliberate and worth stating rather than leaving implicit. First, phases overlap --- Design starts before Discovery formally closes, Test starts before Build formally closes, and so on --- because Bouregreg's Project Management and Change Management tracks run in parallel, not in strict sequence, the same way E2E-06 (PM ↔ CM Governance Bridge, Part 3) assumes. Second, Lewin is marked "provisional" at Deploy and through most of Hypercare rather than called Refreeze at go-live itself: that gap between the technical go-live milestone and the confirmed Lewin call is Exception E3 (Two-Clock Problem at Deploy) below, and this calendar is built to make that gap visible rather than paper over it. Third, more than one exception can be live in the same week --- Weeks 43 through 46, for instance, carry E3, E4, and E6 simultaneously, exactly the kind of overlapping-signal week a Change Manager needs the Notification Center (Part 5) for, not a single linear checklist.

---

<a id="p1b-3"></a>

### 1B.3 Phase-by-Phase Playbook (Normal Flow)

Each phase below states its weeks, its framework readings at the phase's close, four concrete Tasks with their Steps, and the phase gate outcome recorded on M17 (WBS & Gantt). Every journi module reference is real; every Task is written as something Driss El Amrani, Meryem Sabri, Houda Zerouali, or their teams actually do inside the modules toured in Part 2.

<a id="phase-1"></a>

#### Phase 1 --- Discovery (W1--8)

**Framework readings at close:** Lewin Unfreeze · ADKAR focus Awareness · Bridges Ending · Kübler-Ross Denial.

Discovery is where the business case gets made and the Month-0 baseline gets captured, before any visible change has reached the plant floor. The table below breaks the phase's four Tasks into a Project Manager (PM) track and a Change Manager (CM) track, week by week, with the exact journi entries --- including simulated data to type in --- for each week.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry --- What to Type In | Exception |
|---|---|---|---|---|
| **Week 1** | **[PM]** Hold program kickoff; confirm Executive Sponsor (CFO) attendance; align the three-site workshop schedule with Functional Process Owners. | **[CM]** Brief Meryem Sabri's team on discovery-workshop facilitation method; prepare the workaround-inventory capture sheet. | M1 (Hierarchy) --- verify the CM Project record's scope and dates match the kickoff agreement (no new entry; record already created in Part 1). | --- |
| **Week 2** | **[PM]** Facilitate Discovery Workshop 1 --- Casablanca HQ (Order Management, Finance). Capture current-state process maps. | **[CM]** Observe the Casablanca workshop; begin logging workaround findings neutrally, not yet as resistance entries. | M21 (Field Notes) --- type in: Category: Workshop · Title: "Discovery Workshop 1 --- Casablanca HQ" · Logged by: Meryem Sabri · Body: "Order Management and Finance current-state process maps captured on whiteboard; three workaround patterns already visible (manual re-keying, whiteboard tracking). Full transcription into the Workaround Inventory targeted for Week 4." · Related module: none yet --- becomes an M4 (Stakeholder Mapping) input once the business case is quantified. | --- |
| **Week 3** | **[PM]** Facilitate Discovery Workshop 2 --- Kenitra Plant (Inventory, Plant Operations). | **[CM]** Continue the workaround inventory; note early signs of attachment to the current manual process among Kenitra plant-floor staff. | M21 (Field Notes) --- type in: Category: Workshop · Title: "Discovery Workshop 2 --- Kenitra Plant" · Logged by: Meryem Sabri · Body: "Inventory and Plant Operations workshop complete. Noted early attachment to the current manual process among plant-floor staff --- worth watching once Build reaches the Inventory module (Sprint 2)." · Related module: none yet. | --- |
| **Week 4** | **[PM]** Facilitate Discovery Workshop 3 --- Settat Plant (Inventory, Plant Operations). Discovery workshops complete across all three sites. | **[CM]** Compile the full workaround inventory (Task 1, Step 2) --- type in each finding as a short, neutral description, for example: "Casablanca Finance re-keys invoice data manually into a shadow spreadsheet because the legacy system's export format doesn't match the bank reconciliation tool"; "Kenitra Plant Operations tracks partial shipments on a whiteboard because the legacy inventory module can't split a purchase order"; "Settat Plant Operations emails a paper packing slip photo to Casablanca Finance because the two legacy systems don't share a stock-movement record." | M21 (Field Notes) --- type in: Category: Workshop · Title: "Discovery Workshops Complete --- Workaround Inventory Compiled" · Logged by: Meryem Sabri · Body: "All three site workshops complete; full workaround inventory compiled (see CM Track this week). Staged as the evidentiary basis for the Week 5--6 business case." · Related module: M1 (Hierarchy). | --- |
| **Week 5** | **[PM]** Pull a month of reconciliation time logs from each site's finance/operations team (Task 2, Step 1) --- type in, per site: Casablanca 62 hours/month; Kenitra 21 hours/month; Settat 19 hours/month, all tied to the three workarounds logged in Week 4. | **[CM]** Review the time-log figures against the workaround inventory to confirm each hour figure traces to a specific, named workaround, not a general estimate. | M21 (Field Notes) --- type in: Category: Other · Title: "Reconciliation Time-Log Pull, All Sites" · Logged by: Driss El Amrani · Body: "Casablanca 62 hrs/month; Kenitra 21 hrs/month; Settat 19 hrs/month --- each figure traced to a named Week 4 workaround, not a general estimate. Feeds the Main Project business case on M1 (Hierarchy), Week 6." · Related module: M1 (Hierarchy). | --- |
| **Week 6** | **[PM]** Compute the fully-loaded cost (Task 2, Step 2) --- type in: "102 reconciliation-hours/month across 3 sites at a blended fully-loaded rate of MAD 180/hour = approximately MAD 18,360/month, MAD 220,000/year, attributable to 3 named legacy-system workarounds." Attach to the Main Project business case on M1 (Hierarchy). | **[CM]** Begin Task 3 (Stakeholder Map): open M4 (Stakeholder Mapping) and start entering cohorts. | M4 (Stakeholder Mapping) --- type in these cohort entries: "Casablanca Finance --- Order-to-Cash & Reconciliation" (dimension: Process, severity: High); "Kenitra Plant Operations --- Inventory & Shipping" (dimension: Process, severity: Medium); "Settat Plant Operations --- Inventory & Shipping" (dimension: Process, severity: Medium); "Casablanca HQ --- Executive & Finance Leadership" (dimension: Governance, severity: Medium). | --- |
| **Week 7** | **[PM]** Review the draft business case and Stakeholder Map with the Steering Committee ahead of the Phase 1 gate. | **[CM]** Flag Casablanca Finance and both plants as high-impact (Task 3, Step 2) --- confirm the severity ratings entered in Week 6 against Steering Committee feedback; save the finalized Stakeholder Map. | M4 (Stakeholder Mapping) --- update Casablanca Finance's severity rating from High to Critical after Steering Committee review confirms it carries the deepest workaround exposure. | --- |
| **Week 8** | **[PM]** Confirm the Phase 1 gate: business case and Stakeholder Map both signed off. | **[CM]** Set Lewin = Unfreeze on M3 (Initiative Registry) with a written justification (Task 4, Step 2) --- type in: "Setting Unfreeze. Three discovery workshops complete across all sites; workaround inventory and cost quantification (approximately MAD 220,000/year) confirm the business case; Stakeholder Map complete with Casablanca Finance flagged Critical. Evidence reviewed with Steering Committee 08 [date]; no dissent recorded." | M3 (Initiative Registry) --- Lewin phase field set to Unfreeze, justification note as above. | --- |

**Phase gate (M17 (WBS & Gantt)):** Discovery closes with a clean Go once the Stakeholder Map, business case, and Lewin baseline are all in place --- the state Part 1's setup checklist ends at.

**SIPOC.** Suppliers: Executive Sponsor (CFO); Functional Process Owners at each site; enterprise IT strategy. · Inputs: Strategic mandate and budget approval; current-state process notes; org chart per site. · Process: this phase's four Tasks in sequence · Outputs: Approved business case; Stakeholder Map; baseline Lewin reading (Unfreeze). · Customers: Steering Committee; Program Manager; Change Manager.

**RACSI for this phase.** R = PM, FPO · A = ES · C = CM, ITL · S = SUP · I = EU

<a id="phase-2"></a>

#### Phase 2 --- Design (W6--14)

**Framework readings at close:** Lewin Unfreeze · ADKAR focus Awareness → Desire · Bridges Ending · Kübler-Ross Denial → Resistance/Anger.

Design overlaps Discovery's tail: design principles get drafted and translated into explicit future-state process maps --- the direct counterpart to Discovery's current-state process maps (Phase 1, Week 2) --- while the last discovery findings are still landing. The table below breaks the phase into its PM and CM tracks week by week.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry --- What to Type In | Exception |
|---|---|---|---|---|
| **Week 6** | **[PM]** Facilitate the design-principles workshop with the ITL function and Functional Process Owners --- draft 5--8 non-negotiable constraints (Task 1, Step 1). | **[CM]** Attend the design-principles workshop as a Change Management voice; flag any principle likely to conflict with an already-logged workaround from Phase 1. | M21 (Field Notes) --- type in: Category: Workshop · Title: "Design-Principles Workshop --- Kickoff" · Logged by: Driss El Amrani · Body: "ITL and Functional Process Owners drafted 5--8 non-negotiable constraints; Change Management flagged Principle 2 as a direct conflict-resolver for the Kenitra/Settat workaround pattern logged in Discovery." · Related module: none yet --- becomes the Week 7 M17 (WBS & Gantt) Future-State Process Mapping entry. | --- |
| **Week 7** | **[PM]** Consolidate the design principles into a single written list, then translate them into explicit future-state process maps for Order Management, Inventory, and Finance, each map annotated against the specific principle it satisfies (Task 1, Step 2) --- type in, for example: "Principle 1: No duplicate approvals across sites"; "Principle 2: One stock-movement record shared by Inventory and Finance"; "Principle 3: Every exception path must be visible to a supervisor, not hidden in a workaround." Future-state map note: "Order-to-Cash future-state map --- one shared stock-movement record (Principle 2) replaces Casablanca Finance's shadow spreadsheet and the Kenitra/Settat whiteboard and email-photo workarounds; every exception routes to a visible supervisor queue (Principle 3), not a side channel." | **[CM]** Cross-check the consolidated principles and future-state process maps against Phase 1's workaround inventory --- confirm the Order-to-Cash map's Principle 2 routing directly retires the Kenitra/Settat whiteboard and email-photo workarounds, item by item. | M17 (WBS & Gantt) --- task "Future-State Process Mapping (Order Management, Inventory, Finance)" logged; artifact reference: three future-state process maps, each cross-referenced to the design principle(s) it implements and the specific Phase 1 workaround(s) it retires. | --- |
| **Week 8** | **[PM]** Circulate the design principles and future-state process maps together for Steering Committee review (Task 1, Step 3); collect sign-off on both. | **[CM]** Prepare the Week 9 kickoff town hall script in parallel, so communications can launch the moment principles and maps are signed off. | M21 (Field Notes) --- type in: Category: Sign-Off · Title: "Steering Committee Sign-Off --- Design Principles & Future-State Process Maps" · Logged by: Driss El Amrani · Body: "Unanimous sign-off recorded 08 [date]; no dissent. Clears Communications to launch the Week 9 kickoff town hall." · Related module: M17 (WBS & Gantt). | --- |
| **Week 9** | **[PM]** Confirm design principles signed off; hand off to Build's configuration sprint planning. | **[CM]** Deliver the kickoff town hall at all three sites (Task 2, Step 1) --- log the entry on M8 (Communications). | M8 (Communications) --- type in: Message "Why we're changing: three disconnected systems cost Bouregreg Group approximately MAD 220,000/year in manual work. What's changing: one unified platform, live in 34 weeks. What we need from you: attend your site's training when scheduled." · Audience: All 3,400 staff · Channel: In-person town hall + email follow-up · Timing: Week 9, one session per site · Status: Sent. | --- |
| **Week 10** | **[PM]** Monitor design-principle-related questions surfacing in the FAQ channel; route any scope question back to the Steering Committee. | **[CM]** Open and monitor the FAQ channel (Task 2, Step 2) --- type in and answer, for example: Q: "Will Kenitra lose headcount?" A: "No headcount reductions are planned for this program." Q: "What happens to my login on the old system?" A: "Legacy access is retired only after your site's go-live and a two-week overlap period." | M8 (Communications) --- add a second entry: Message "FAQ digest --- Week 10" · Audience: All 3,400 staff · Channel: Email + site noticeboards · Timing: Week 10 · Status: Sent. | --- |
| **Week 11** | **[PM]** Begin early Build-phase configuration-environment setup in parallel, ahead of Phase 3's formal start in Week 12. | **[CM]** Run the facilitated baseline Awareness pulse per cohort (Task 3, Step 1). | M5 (ADKAR Engine) --- type in Awareness scores: Casablanca Finance = 3 ("most staff attended the town hall and asked FAQ questions"); Kenitra Plant Operations = 2 ("about half the shift attended; night shift missed it"); Settat Plant Operations = 2 ("same night-shift gap as Kenitra"); Casablanca HQ Leadership = 4. | --- |
| **Week 12** | **[PM]** Kick off Build's configuration environment stand-up (Phase 3, Task 1) --- see Phase 3 below. | **[CM]** Log barrier-reason notes for the two Awareness scores of 2 (Task 3, Step 2) --- type in: "Kenitra Plant Operations, Awareness = 2. Barrier reason: night shift (approx. 40% of the plant-floor cohort) did not attend the Week 9 town hall or receive a make-up session. Auto-escalated." Identical note logged for Settat Plant Operations. | M5 (ADKAR Engine) --- barrier-reason notes attached to the Week 11 entries; both auto-escalate per journi's ≤2 rule. | --- |
| **Week 13** | **[PM]** Continue Build configuration sprint 1 in parallel (see Phase 3, Week 13). | **[CM]** Identify candidate champions per site and function (Task 4, Step 1) --- type in nominees: Casablanca Finance --- Amal Ferhati (Senior Accountant); Kenitra Plant Operations --- Yassine Bouhali (Shift Supervisor, night shift); Settat Plant Operations --- Rania Idrissi (Inventory Lead). | M21 (Field Notes) --- type in: Category: Nomination · Title: "Champion Nominees --- Draft List" · Logged by: Driss El Amrani · Body: "Casablanca Finance: Amal Ferhati. Kenitra Plant Operations: Yassine Bouhali (night shift). Settat Plant Operations: Rania Idrissi. Pending manager confirmation before the Week 14 roster entry on M4 (Stakeholder Mapping)." · Related module: M4 (Stakeholder Mapping). | --- |
| **Week 14** | **[PM]** Confirm the Phase 2 gate: design principles signed off, baseline Awareness pulse logged. | **[CM]** Log the champion roster against the Stakeholder Map (Task 4, Step 2). | M4 (Stakeholder Mapping) --- type in, against each cohort entry: Champion "Amal Ferhati" linked to "Casablanca Finance"; Champion "Yassine Bouhali" linked to "Kenitra Plant Operations" (noted: night-shift representative, addressing the Week 12 Awareness gap directly); Champion "Rania Idrissi" linked to "Settat Plant Operations". | --- |

**Phase gate:** Design closes once the design principles and future-state process maps are both signed off by the Steering Committee and the baseline Awareness pulse is logged --- this is also the point where, if the program were instead running as the Order-to-Cash Process Redesign of Part 4, the first Resistance-to-Commitment (E2E-03 (Resistance-to-Commitment)) signals would already be visible in Casablanca finance.

**SIPOC.** Suppliers: Functional Process Owners; ITL; the champion network's first recruits. · Inputs: Discovery findings; current-state process maps; design-principle drafts; first town-hall feedback. · Process: this phase's four Tasks in sequence · Outputs: Signed-off design principles and future-state process maps; first champion roster; baseline Awareness scores. · Customers: Program Manager; Change Manager; Steering Committee.

**RACSI for this phase.** R = CM, FPO · A = ES · C = PM, ITL · S = SUP · I = EU

<a id="phase-3"></a>

#### Phase 3 --- Build (W12--30)

**Framework readings at close:** Lewin Unfreeze → Change · ADKAR focus Desire · Bridges Ending → Neutral Zone · Kübler-Ross Resistance/Anger.

Build is the longest phase and the one where the Lewin call actually moves --- not because 18 weeks have passed, but because the evidence supports it by the phase's end. This is also where Exception E1 (Desire Stall at Settat) plays out in full, integrated into the week-by-week table below rather than treated as a separate track.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry --- What to Type In | Exception |
|---|---|---|---|---|
| **Week 12** | **[PM]** Stand up the configuration environment; begin configuration sprint 1 against the signed-off design principles (Task 1, Step 1). | **[CM]** Monitor the last FAQ-channel questions from Design; hand off the champion nominee list to Build's briefing plan. | No direct journi entry --- configuration sprint decisions are tracked on M17 (WBS & Gantt) task records, not a Change Management module. | --- |
| **Week 13** | **[PM]** Configuration sprint 1 continues --- Order Management module against Principle 2 (one shared stock-movement record). | **[CM]** Prepare the champion briefing agenda for Week 16. | M21 (Field Notes) --- type in: Category: Decision · Title: "Champion Briefing Agenda --- Draft" · Logged by: Driss El Amrani · Body: "Agenda drafted for the Week 16 champion briefing: what floor-level observation is worth logging, how to log it, and the escalation path to M10 (Resistance). Circulated to Amal Ferhati, Yassine Bouhali, and Rania Idrissi ahead of the session." · Related module: M4 (Stakeholder Mapping). | --- |
| **Week 14** | **[PM]** Configuration sprint 1 closes; log each sprint decision against its justifying design principle (Task 1, Step 2) --- type in, for example: "Decision: single stock-movement table shared by Inventory and Finance modules. Justifying principle: Principle 2." | **[CM]** Confirm champion roster availability for the Week 16 briefing (overlaps Design's Phase 2 gate). | M17 (WBS & Gantt) --- task "Configuration Sprint 1" marked complete, actual end date logged against its baseline. | --- |
| **Week 15** | **[PM]** Configuration sprint 2 begins --- Inventory module against Principle 2 and Principle 3 (visible exception paths). | **[CM]** No new activity this week --- holding for the Week 16 champion briefing. | M21 (Field Notes) --- type in: Category: Other · Title: "Holding for Week 16 Champion Briefing" · Logged by: Driss El Amrani · Body: "No new CM activity this week; the champion nominee list from Week 13 is confirmed and the briefing agenda is ready. Holding deliberately so the briefing lands right as Sprint 2 reaches the Inventory module it's meant to prepare champions to observe." · Related module: M4 (Stakeholder Mapping). | --- |
| **Week 16** | **[PM]** Configuration sprint 2 continues in parallel with the champion briefing below. | **[CM]** Run the champion briefing session per site (Task 2, Step 1) --- brief Amal Ferhati, Yassine Bouhali, and Rania Idrissi on what floor-level observation is worth logging, and how. | M21 (Field Notes) --- type in: Category: Workshop · Title: "Champion Briefing Session, All 3 Sites" · Logged by: Driss El Amrani · Body: "Briefed Amal Ferhati, Yassine Bouhali, and Rania Idrissi on floor-level observation and what's worth logging. Facilitated session; output shows up as future M4 (Stakeholder Mapping) and M10 (Resistance) entries once champions actually log something." · Related module: M4 (Stakeholder Mapping). | --- |
| **Week 17** | **[PM]** Configuration sprint 2 closes. | **[CM]** Confirm each champion's observation-logging path (Task 2, Step 2) --- type in, against each champion's Stakeholder Map entry: "Logging path confirmed: floor observation → champion → M4 (Stakeholder Mapping) note → escalated to M10 (Resistance) if it becomes a pattern." | M4 (Stakeholder Mapping) --- add a note field to each of the three champion entries confirming the logging path above. | --- |
| **Week 18** | **[PM]** Configuration sprint 3 begins --- Finance module reconciliation logic. | **[CM]** Re-score Desire per cohort (Task 3, Step 1) --- type in: Casablanca Finance = 3; Kenitra Plant Operations = 3; Settat Plant Operations = 2 (auto-escalates). | M5 (ADKAR Engine) --- Desire scores as above. Settat's score of 2 triggers a mandatory barrier-reason note next week. | E1 (Desire Stall at Settat) --- trigger week |
| **Week 19** | **[PM]** Configuration sprint 3 continues. | **[CM]** Log the mandatory barrier-reason note for Settat's Desire = 2 (Task 3, Step 2) --- type in: "Settat Plant Operations, Desire = 2. Barrier reason: low visibility into what the new inventory workflow will look like on Line 2 specifically; unresolved concern about post-go-live staffing levels. Auto-escalated." Begin Exception E1 (Desire Stall at Settat)'s Recovery Task 1 (cluster barrier notes by root cause). | M5 (ADKAR Engine) --- barrier-reason note attached to the Week 18 Settat entry; auto-escalation flag set. | E1 (Desire Stall at Settat) --- Recovery Task 1 |
| **Week 20** | **[PM]** Configuration sprint 3 continues, unaffected by the Settat exception track. | **[CM]** Run E1's Recovery Task 2 --- targeted listening sessions with the Settat plant-floor cohort; confirm position security, not workflow visibility, is the primary driver. See Exception E1 (Section 1B.4) for the full session detail. | M21 (Field Notes) --- type in: Category: Workshop · Title: "E1 Recovery Task 2 --- Settat Targeted Listening Sessions" · Logged by: Houda Zerouali · Body: "Small-group sessions with the Settat plant-floor cohort confirm position security, not workflow visibility, is the primary driver of the Desire stall. Feeds the Week 21 response design." · Related module: none yet --- feeds the Week 24 M5 (ADKAR Engine)/M6 (Emotional & Transition Layer) re-score. | E1 (Desire Stall at Settat) --- Recovery Task 2 |
| **Week 21** | **[PM]** Configuration sprint 3 closes. | **[CM]** Run E1's Recovery Task 3 --- design a specific, credible staffing commitment with the CFO. | M21 (Field Notes) --- type in: Category: Decision · Title: "E1 Recovery Task 3 --- Staffing Commitment Designed" · Logged by: Driss El Amrani · Body: "Agreed with the CFO: a specific, verifiable commitment on post-go-live staffing levels for the Settat plant-floor cohort --- not a vague reassurance. Delivery scheduled for Week 22." · Related module: M7 (Sponsor & Coalition). | E1 (Desire Stall at Settat) --- Recovery Task 3 |
| **Week 22** | **[PM]** Configuration sprint 4 begins --- integration testing prep. | **[CM]** Run E1's Recovery Task 4 --- the CFO delivers the staffing commitment in person to the Settat cohort. | M7 (Sponsor & Coalition) --- the CFO's staffing-commitment delivery is logged there directly as a sponsor action, cross-referenced from E1; no separate M21 (Field Notes) entry needed since this one already has its real module home. | E1 (Desire Stall at Settat) --- Recovery Task 4 |
| **Week 23** | **[PM]** Configuration sprint 4 continues. | **[CM]** Hold --- allow one week for the CFO's commitment to be felt on the floor before re-scoring. | M21 (Field Notes) --- type in: Category: Decision · Title: "E1 --- Holding One Week Before Re-Score" · Logged by: Houda Zerouali · Body: "Deliberately not re-scoring Desire or Kübler-Ross yet --- the CFO's Week 22 commitment needs a week to actually be felt on the Settat floor before a re-pulse means anything. Re-score scheduled for Week 24 per E1's Recovery Task 5." · Related module: M5 (ADKAR Engine). | --- |
| **Week 24** | **[PM]** Configuration sprint 4 closes. | **[CM]** Run E1's Recovery Task 5 --- re-score Desire and Kübler-Ross sentiment for Settat. | M5 (ADKAR Engine) --- Settat Desire re-scored from 2 to 3, with justification: "Recovered following CFO staffing commitment (Week 22). Re-scored 2 weeks later per E1 protocol." M6 (Emotional & Transition Layer) --- Settat Kübler-Ross re-scored from Denial to Resistance/Anger (moving, not yet Exploration). | E1 (Desire Stall at Settat) --- closes |
| **Week 25** | **[PM]** Configuration sprint 5 begins --- final module: reporting and dashboards. | **[CM]** Confirm Settat's recovery is holding; no further E1 action needed. | M21 (Field Notes) --- type in: Category: Decision · Title: "E1 --- Settat Recovery Confirmed Holding" · Logged by: Houda Zerouali · Body: "Checked in with Yassine Bouhali and the Settat plant-floor cohort informally --- the Week 24 Desire re-score (2 → 3) is holding, no relapse. No further E1 recovery action needed; closing this out as monitoring-only going forward." · Related module: M5 (ADKAR Engine). | --- |
| **Week 26** | **[PM]** Configuration sprint 5 closes; internal configuration testing begins ahead of formal SIT in Phase 4. | **[CM]** Review the full-phase ADKAR picture across all three sites ahead of the Lewin call. | M21 (Field Notes) --- type in: Category: Decision · Title: "Full-Phase ADKAR Review, All Sites" · Logged by: Driss El Amrani · Body: "Reviewed Awareness through Desire trends across Casablanca, Kenitra, and Settat ahead of the Week 29 Lewin call --- confirming the evidence base (including Settat's E1 recovery) is complete before drafting the formal justification in Week 27." · Related module: M5 (ADKAR Engine). | --- |
| **Week 27** | **[PM]** Internal configuration testing continues; defect list compiled for Phase 4's Task 1. | **[CM]** Draft the Lewin phase-call justification for Steering Committee pre-review. | M21 (Field Notes) --- type in: Category: Decision · Title: "Lewin Phase-Call Draft --- Steering Committee Pre-Review" · Logged by: Driss El Amrani · Body: "Drafted the Unfreeze-to-Change justification ahead of the Week 29 formal call: five configuration sprints complete, Desire trending upward across all three sites including Settat's recovery. Circulated for pre-review, not yet the formal M3 (Initiative Registry) entry." · Related module: M3 (Initiative Registry). | --- |
| **Week 28** | **[PM]** Configuration functionally complete; hand off to Phase 4's formal SIT (see Phase 4, Week 28). | **[CM]** Review the evidence against Section 1B.1's signal catalogue (Task 4, Step 1) --- confirm configuration sprints landed, Desire trended upward (including Settat's recovery), and no cohort remains below a Desire of 3. | M21 (Field Notes) --- type in: Category: Decision · Title: "Evidence Review vs. Signal Catalogue" · Logged by: Driss El Amrani · Body: "Confirmed against Section 1B.1's signal catalogue: configuration sprints landed, Desire trended upward including Settat's recovery, no cohort remains below a Desire of 3. Facilitated session ahead of the Week 29 formal Lewin call." · Related module: M3 (Initiative Registry). | --- |
| **Week 29** | **[PM]** Confirm with the Steering Committee that Build's technical scope is complete. | **[CM]** Set Lewin = Change on M3 (Initiative Registry) with a written justification (Task 4, Step 2). | M3 (Initiative Registry) --- type in: "Moving Unfreeze → Change. Configuration sprints 1--5 complete against approved design principles; Desire trending upward across all three sites, including Settat's recovery from the Week 18--24 stall (see E1 log). Evidence reviewed with Steering Committee 29 [date]; no dissent recorded." | --- |
| **Week 30** | **[PM]** Confirm the Phase 3 gate: configuration complete, Lewin = Change on real evidence. | **[CM]** Hand off to Phase 5's Train track, which begins this same week (see Phase 5, Week 30). | M17 (WBS & Gantt) --- Build phase marked complete; Phase Gate recorded as Go. | --- |

**Phase gate:** Build closes once the platform configuration is functionally complete and Lewin has moved to Change on real evidence --- a No-Go or Conditional call here (ALT-009 (Phase Gate No-Go / Conditional), Part 5) means configuration is not ready for Test, and the phase does not advance on schedule alone.

**SIPOC.** Suppliers: ITL; configuration sprint teams; the champion network. · Inputs: Signed-off future-state process maps; design principles; Awareness-stage ADKAR data. · Process: this phase's four Tasks in sequence · Outputs: Functionally complete configured build; briefed champion network; Lewin = Change. · Customers: Program Manager; Change Manager; Test-phase team.

**RACSI for this phase.** R = ITL, CM · A = PM · C = FPO, ES · S = SUP · I = EU

**Configuration Sprint Index.** Build's five sprints are each scoped to one functional area and justified against specific Phase 2 design principles --- the table below is the single place to see all five, their weeks, and their scope of work in one place, cross-referenced to the Master WBS & Gantt table's Task/Step IDs.

| Sprint | Weeks | Scope of Work | Justifying Principle(s) | Task/Step ID |
|---|---|---|---|---|
| Sprint 1 | W12--14 | Order Management module --- one shared stock-movement record replacing Casablanca Finance's shadow spreadsheet. | Principle 2 (one stock-movement record shared by Inventory and Finance) | P3-T1-S1, P3-T1-S2 |
| Sprint 2 | W15--17 | Inventory module --- stock-movement logic extended to Kenitra/Settat, with every exception path routed to a visible supervisor queue. | Principle 2; Principle 3 (every exception path visible to a supervisor) | P3-T2-S1, P3-T2-S2 (runs alongside the champion briefing) |
| Sprint 3 | W18--21 | Finance module --- reconciliation logic against the unified stock-movement record. | Principle 1 (no duplicate approvals); Principle 2 | P3-T3-S1, P3-T3-S2 (interleaved with Exception E1, Desire Stall at Settat) |
| Sprint 4 | W22--24 | Integration testing prep --- cross-module scenario scripts ahead of Phase 4's formal SIT. | Principles 1--3, jointly (integration surfaces every principle at once) | Runs alongside E1's Recovery Tasks 3--5 (no dedicated WBS Task/Step --- prep work between Sprint 3's close and Phase 4) |
| Sprint 5 | W25--26 | Reporting and dashboards --- the final module, closing configuration; internal configuration testing begins the moment Sprint 5 closes (W26), ahead of Phase 4's formal SIT (W28). | Principle 3 (exception visibility surfaces in reporting) | Closes just before P3-T4-S1 (evidence review) |

**RACSI for the sprint sequence.** R = ITL · A = PM · C = CM (principle traceability), FPO · S = SUP · I = ES, EU --- unchanged from the phase RACSI above; sprints are how Build's R = ITL, CM row is actually executed week by week.

<a id="phase-4"></a>

#### Phase 4 --- Test (W28--38)

**Framework readings at close:** Lewin Change · ADKAR focus Knowledge · Bridges Neutral Zone · Kübler-Ross Resistance/Anger → Exploration.

Test is the first point a representative slice of end users gets real hands-on exposure --- and the first honest opportunity to run the Divergence Pattern check. Exception E2 (Divergence Pattern at UAT) plays out inside the week-by-week table below.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry --- What to Type In | Exception |
|---|---|---|---|---|
| **Week 28** | **[PM]** Run the SIT test script against the configured build (Task 1, Step 1) --- ITL executes 40 scripted scenarios across Order Management, Inventory, and Finance. | **[CM]** Observe SIT results for any defect likely to affect a cohort already flagged sensitive (Settat, per Exception E1 (Desire Stall at Settat)'s recovery). | M17 (WBS & Gantt) --- task "System Integration Testing" logged, actual start date recorded. | --- |
| **Week 29** | **[PM]** Triage and close SIT defects by severity (Task 1, Step 2) --- type in, for example: "Defect #14, Critical: stock-movement record duplicates on split shipment. Closed 29 [date]." "Defect #22, Low: report label mismatch. Deferred, not UAT-blocking." | **[CM]** Confirm no open Critical or High defect touches a Settat or Kenitra process step, ahead of UAT recruitment. | M13 (Risk Register) --- log any deferred defect with residual risk (for example, Defect #22) as a low-severity, open Risk Register entry. | --- |
| **Week 30** | **[PM]** Confirm SIT sign-off; hand configured build to UAT. | **[CM]** Select UAT participants proportionate to each site's population (Task 2, Step 1) --- type in: Casablanca Finance --- 5 participants (out of 140 staff); Kenitra Plant Operations --- 3 participants; Settat Plant Operations --- 3 participants. | M21 (Field Notes) --- type in: Category: Nomination · Title: "UAT Participant Names --- Draft" · Logged by: Driss El Amrani · Body: "5 Casablanca Finance, 3 Kenitra Plant Operations, 3 Settat Plant Operations --- names selected, pending site-manager confirmation before the Week 31 roster entry on M4 (Stakeholder Mapping)." · Related module: M4 (Stakeholder Mapping). | --- |
| **Week 31** | **[PM]** Finalize UAT scripts and acceptance criteria with the recruited cohort's managers. | **[CM]** Log the UAT roster and acceptance criteria (Task 2, Step 2). | M4 (Stakeholder Mapping) --- type in the 11 named UAT participants against their existing cohort entries, tagged "UAT Cohort --- Wave 1"; acceptance criteria noted: "Pass = complete order-to-cash cycle end to end with no Critical defect and a self-reported confidence of 3 or higher." | --- |
| **Week 32** | **[PM]** Support the UAT session technically --- on-site ITL presence at Casablanca HQ for the first session. | **[CM]** Run scripted UAT scenarios with the Casablanca Finance cohort (Task 3, Step 1) --- observe and coach in real time. | M5 (ADKAR Engine) --- type in real Knowledge scores from the session: Casablanca Finance UAT participants score Knowledge = 4 (average across the 5 participants). | --- |
| **Week 33** | **[PM]** Support the Kenitra and Settat UAT sessions technically. | **[CM]** Run scripted UAT scenarios with the Kenitra and Settat cohorts; log defects and usability friction as distinct categories (Task 3, Step 2) --- type in: "Friction --- not a defect: Settat participants find the new stock-count screen's confirm button placement unintuitive; workaround exists (double-click), no data-integrity issue." | M5 (ADKAR Engine) --- Kenitra Knowledge = 4; Settat Knowledge = 3 (still building). No new M10 (Resistance) entry --- friction logged separately per the Step 2 technique, not escalated as resistance. | --- |
| **Week 34** | **[PM]** Compile the UAT defect and friction log for the Steering Committee. | **[CM]** Run the Divergence Pattern review against UAT participants' latest scores (Task 4, Step 1) --- cross-check Knowledge/Ability against each participant's Bridges reading. | M6 (Emotional & Transition Layer) --- one Casablanca Finance participant reads Knowledge = 4, Ability = 4, but Bridges = Ending. ALT-001 (Divergence Pattern Detected) fires for this individual. | E2 (Divergence Pattern at UAT) --- trigger week |
| **Week 35** | **[PM]** Continue defect remediation from Week 29's deferred items, unaffected by the E2 track. | **[CM]** Route the flagged case into Exception E2 (Divergence Pattern at UAT)'s Recovery Task 1 and 2 (Task 4, Step 2) --- confirm the alert against supervisor observation; hold a loss-focused 1:1. See Exception E2 (Section 1B.4) for the full conversation detail. | M21 (Field Notes) --- type in: Category: Other · Title: "E2 Recovery --- Loss-Focused 1:1 Held" · Logged by: Driss El Amrani · Body: "1:1 held with the flagged Casablanca Finance UAT participant per E2's Recovery Tasks 1--2. Content is deliberately not logged here or anywhere in journi --- a loss-focused conversation is confidential; only its outcome (the Bridges re-score) becomes a record, on M6 (Emotional & Transition Layer) once it lands." · Related module: M6 (Emotional & Transition Layer). | E2 (Divergence Pattern at UAT) --- Recovery Tasks 1--3 |
| **Week 36** | **[PM]** No E2-related activity --- configuration and defect tracks proceed independently. | **[CM]** Provide the explicit closure moment if the 1:1 confirmed a genuine loss concern (Recovery Task 4); re-check the Bridges reading only (Recovery Task 5). | M6 (Emotional & Transition Layer) --- the flagged participant's Bridges reading re-scored from Ending to Neutral Zone, with justification: "Genuine loss concern (legacy role) acknowledged directly 35 [date]. Re-pulsed per E2 protocol." | E2 (Divergence Pattern at UAT) --- closes |
| **Week 37** | **[PM]** Final defect closure; confirm UAT sign-off criteria met for all three sites. | **[CM]** Confirm the E2 case is cleared to count toward cohort readiness; compile the Test-phase framework summary for the Phase 4 gate. | M14 (Analytics) --- Composite Readiness Index recalculated, now reflecting the resolved E2 case. | --- |
| **Week 38** | **[PM]** Confirm the Phase 4 gate: SIT and UAT both signed off. | **[CM]** Confirm no Divergence Pattern flag remains open; hand off to Phase 5's Train track, already underway since Week 30. | M17 (WBS & Gantt) --- Test phase marked complete; Phase Gate recorded as Go. | --- |

**Phase gate:** Test closes once SIT and UAT sign-off are both recorded and any Divergence Pattern flags from Task 4 are resolved or explicitly accepted, not silently ignored.

**SIPOC.** Suppliers: ITL; the recruited UAT cohort across all three sites. · Inputs: Configured build; UAT participant roster; acceptance criteria. · Process: this phase's four Tasks in sequence · Outputs: SIT/UAT sign-off; defect log; first real Knowledge/Ability scores; Divergence Pattern result. · Customers: Program Manager; Change Manager; Train-phase team.

**RACSI for this phase.** R = ITL, FPO · A = PM · C = CM · S = SUP, EU · I = ES

<a id="phase-5"></a>

#### Phase 5 --- Train (W30--42)

**Framework readings at close:** Lewin Change · ADKAR focus Knowledge → Ability · Bridges Neutral Zone · Kübler-Ross Exploration.

Train runs alongside Test rather than strictly after it --- Knowledge becomes Ability under increasingly realistic conditions while Bridges settles into the Neutral Zone. Exception E6 (Cohort Divergence Across Sites) opens partway through this phase and plays out inside the table below.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry --- What to Type In | Exception |
|---|---|---|---|---|
| **Week 30** | **[PM]** Confirm training-room and sandbox infrastructure availability at all three sites. | **[CM]** Enroll each cohort against its role-based curriculum (Task 1, Step 1) --- type in: "Casablanca Finance --- Order-to-Cash Curriculum (5 modules)"; "Kenitra/Settat Plant Operations --- Inventory & Shipping Curriculum (4 modules)". | M9 (Training) --- three curriculum entries created, one per cohort, status "Enrolled". | --- |
| **Week 31** | **[PM]** No specific activity this week --- infrastructure already confirmed. | **[CM]** Deliver training wave 1 to Casablanca Finance. | M9 (Training) --- Casablanca Finance entry completion percentage updated to 40%. | --- |
| **Week 32** | **[PM]** Support the Kenitra training session technically (sandbox connectivity). | **[CM]** Deliver training wave 1 to Kenitra Plant Operations (overlaps Test's Casablanca UAT session, Week 32). | M9 (Training) --- Kenitra Plant Operations entry completion percentage updated to 35%. | --- |
| **Week 33** | **[PM]** Support the Settat training session technically. | **[CM]** Deliver training wave 1 to Settat Plant Operations (overlaps Test's Kenitra/Settat UAT sessions, Week 33). | M9 (Training) --- Settat Plant Operations entry completion percentage updated to 35%. | --- |
| **Week 34** | **[PM]** Publish job aids per role (Task 2, Step 1) --- ITL formats and distributes. | **[CM]** Review job-aid content for accuracy against the curriculum and the Build-phase design principles. | M21 (Field Notes) --- type in: Category: Handoff · Title: "Job Aids Published, All Roles" · Logged by: Driss El Amrani · Body: "Job aids formatted and distributed by ITL, one per role, reviewed for accuracy against the curriculum and Build-phase design principles. Distributed as documents; referenced by name in M9 (Training) curriculum notes." · Related module: M9 (Training). | --- |
| **Week 35** | **[PM]** Open the sandbox environment for supervised practice (Task 2, Step 2) --- confirm access for all three sites. | **[CM]** Schedule supervised sandbox practice slots per cohort (overlaps Exception E2 (Divergence Pattern at UAT)'s resolution week in Test). | M9 (Training) --- sandbox-practice-hours field added to each cohort's entry, tracked separately from classroom completion. | --- |
| **Week 36** | **[PM]** No specific activity this week. | **[CM]** Score Knowledge and Ability per cohort (Task 3, Step 1) --- type in: Casablanca Finance Knowledge = 4, Ability = 4; Kenitra Knowledge = 4, Ability = 3; Settat Knowledge = 3, Ability = 2. | M5 (ADKAR Engine) --- scores as above. Settat reads meaningfully behind the other two sites --- the spread that opens Exception E6 (Cohort Divergence Across Sites). | E6 (Cohort Divergence Across Sites) --- opens |
| **Week 37** | **[PM]** No specific activity this week. | **[CM]** Flag Settat below the benchmark band for a second training wave (Task 3, Step 2); begin E6's Recovery Task 1 --- disaggregate the Composite Readiness Index by site. | M14 (Analytics) --- Composite Readiness Index pulled apart by site: Casablanca 78%, Kenitra 68%, Settat 54%. See Exception E6 (Section 1B.4) for the full disaggregation. | E6 (Cohort Divergence Across Sites) --- Recovery Task 1 |
| **Week 38** | **[PM]** No specific activity this week (overlaps Test's Phase 4 gate, Week 38). | **[CM]** Deliver training wave 2 (remediation) to Settat Plant Operations; run E6's Recovery Task 3 --- investigate what Casablanca did differently. | M9 (Training) --- Settat Plant Operations entry, second wave logged; completion percentage updated to 70%. | E6 (Cohort Divergence Across Sites) --- Recovery Task 3 |
| **Week 39** | **[PM]** No specific activity this week. | **[CM]** Transfer Casablanca's earlier champion-briefing timing to Settat as a concrete practice (E6's Recovery Task 4); re-score Settat's Knowledge and Ability. | M5 (ADKAR Engine) --- Settat re-scored: Knowledge = 4, Ability = 3 (improved from Week 36's 3/2). | E6 (Cohort Divergence Across Sites) --- Recovery Task 4 |
| **Week 40** | **[PM]** No specific activity this week. | **[CM]** Walk each People Manager through their team's M11 (Manager as Coach) heatmap (Task 4, Step 1) --- Kenitra and Settat supervisors reviewed individually. | M11 (Manager as Coach) --- heatmap reviewed live with each supervisor; no direct data entry, a computed view. | --- |
| **Week 41** | **[PM]** Finalize the go-live runbook draft with Change Management input on coaching readiness. | **[CM]** Confirm each supervisor's go-live-week coaching plan (Task 4, Step 2) --- type in, for Kenitra: "Yassine Bouhali to run a 15-minute floor huddle at shift start, first 2 weeks post-go-live, focused on the stock-movement screen." | M11 (Manager as Coach) --- coaching-plan note logged against each supervisor. | --- |
| **Week 42** | **[PM]** Confirm the Phase 5 gate alongside Change Management's cohort-level readiness call. | **[CM]** Confirm cohort-level go/no-go readiness against benchmarking bands on M14 (Analytics) --- Casablanca and Kenitra clear cleanly; Settat clears with a coaching note attached, reflecting the Week 39 recovery, not full parity. | M14 (Analytics) --- go/no-go status recorded per cohort: Casablanca Go; Kenitra Go; Settat Go with coaching note. | --- |

**Phase gate:** Train closes once cohort-level go/no-go readiness is confirmed against benchmarking bands on M14 (Analytics) --- a per-cohort call, not a single project-wide one, since Bouregreg's three sites are not required to reach readiness on the same week.

**SIPOC.** Suppliers: Training lead; plant supervisors at Kenitra and Settat; ITL (sandbox environment). · Inputs: Curriculum; UAT findings; per-site Knowledge scores. · Process: this phase's four Tasks in sequence · Outputs: Trained, certified cohorts; deployed job aids; cohort-level go/no-go call. · Customers: Steering Committee; Program Manager; Deploy-phase team.

**RACSI for this phase.** R = CM, SUP · A = CM · C = FPO · S = PM · I = ES, EU

<a id="phase-6"></a>

#### Phase 6 --- Deploy (W43)

**Framework readings at close:** Lewin Change (provisional toward Refreeze) · ADKAR focus Ability · Bridges Neutral Zone → New Beginning (provisional) · Kübler-Ross Exploration.

Deploy is a single, sharp week --- the clearest instance in Bouregreg's program of the two-clock problem Exception E3 (Two-Clock Problem at Deploy) exists to manage. Given its single-week span, the breakdown below runs day by day rather than week by week.

| Day | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry --- What to Type In | Exception |
|---|---|---|---|---|
| **Week 43, Day 1 (Mon)** | **[PM]** Freeze legacy-system data entry at the agreed cutoff (Task 1, Step 1) --- type in the freeze notice: "Legacy systems locked for data entry as of 06:00, Day 1. All three sites confirmed." | **[CM]** Stand by; confirm all champions and supervisors are on-site and briefed for go-live week. | M17 (WBS & Gantt) --- task "Data Freeze" marked complete, actual date logged. | --- |
| **Week 43, Day 2 (Tue)** | **[PM]** Run the final migration and reconcile the result (Task 1, Step 2) --- type in: "Final migration run 02:00--05:00. Reconciliation: 100% of frozen records matched migrated records across Order Management, Inventory, Finance. 0 discrepancies." | **[CM]** Hold; prepare the go-live confirmation message draft for Day 4. | M17 (WBS & Gantt) --- task "Final Migration & Reconciliation" marked complete. | --- |
| **Week 43, Day 3 (Wed)** | **[PM]** Execute the cutover runbook step by step (Task 2, Step 1); validate the live platform against acceptance criteria (Task 2, Step 2). | **[CM]** Stand by for the technical validation sign-off before finalizing the Day 4 communication. | M17 (WBS & Gantt) --- task "Cutover Runbook & Technical Validation" marked complete; Phase Gate pre-check recorded as Go. | --- |
| **Week 43, Day 4 (Thu)** | **[PM]** Confirm technical go-live is clean; hand off to Change Management for the go-live announcement. | **[CM]** Draft and send the go-live confirmation to all three sites (Task 3, Steps 1--2), timed against M8 (Communications)'s saturation check. | M8 (Communications) --- type in: Message "Bouregreg's unified platform is live as of today. Your training, job aids, and supervisor support are all in place --- use the system for every transaction from now on." · Audience: All 3,400 staff · Channel: Email + site noticeboards + supervisor cascade · Timing: Day 4, 07:00, ahead of first shift · Status: Sent. Checked against M8 (Communications)'s saturation detection first --- no other communication queued this week. | --- |
| **Week 43, Day 5 (Fri)** | **[PM]** Monitor first-week technical stability; log any Day 1--5 defect to the Risk Register. | **[CM]** Activate the hypercare support model (Task 4, Step 1); mark Lewin as provisional on M3 (Initiative Registry) (Task 4, Step 2). | M3 (Initiative Registry) --- type in: "Setting Change → Refreeze (provisional). Technical go-live clean across all three sites (Days 1--4). Emotional-layer evidence (Bridges, Kübler-Ross) still pending re-pulse --- see Exception E3 (Two-Clock Problem at Deploy). Not calling confirmed Refreeze on the go-live date alone." | E3 (Two-Clock Problem at Deploy) --- opens |

**Phase gate:** Deploy closes on a clean technical go-live; the Lewin call explicitly does not close here, and stays provisional into Hypercare.

**SIPOC.** Suppliers: ITL; Program Manager; Change Manager. · Inputs: Rehearsed migration cycles; cutover runbook; cohort go/no-go calls. · Process: this phase's four Tasks in sequence · Outputs: Live production system; legacy system locked; go-live communication sent; provisional Lewin. · Customers: Steering Committee; all three sites; Hypercare-phase team.

**RACSI for this phase.** R = ITL, PM · A = ES · C = CM · S = SUP · I = EU

<a id="phase-7"></a>

#### Phase 7 --- Hypercare (W43--50)

**Framework readings at close:** Lewin Change → Refreeze (provisional, confirming) · ADKAR focus Ability → Reinforcement · Bridges New Beginning · Kübler-Ross Exploration → Commitment.

The last mile of adoption is won or lost here, and Kübler-Ross regression during this window is normal, expected behavior, not a data error --- Exception E4 (Sentiment Regression During Hypercare) plays out inside the table below. Week 43 itself is covered in full in Phase 6's day-by-day breakdown (hypercare activates on Day 5); this table picks up from Week 44.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry --- What to Type In | Exception |
|---|---|---|---|---|
| **Week 44** | **[PM]** Review the M14 (Analytics) adoption dashboard daily (Task 2, Step 1) --- track transaction volume and error rate per site. | **[CM]** Continue elevated support desk staffing (Task 1); publish the escalation path to every site (Task 1, Step 2) --- type in: "Escalation: floor issue → supervisor → elevated support desk (ext. 4400) → Driss El Amrani if unresolved in 2 hours." | M13 (Risk Register) --- any Day 1--5 defect logged in Week 43 reviewed and triaged; none open above Medium severity. | --- |
| **Week 45** | **[PM]** Triage any defect by severity and route it (Task 2, Step 2) --- type in, for example: "Defect #31, Medium: inventory-matching logic mismatches a partial shipment at Kenitra. Routed to ITL, target fix Week 46." | **[CM]** Re-score Bridges and Kübler-Ross at the 2-week mark (Task 3, Step 1) --- type in: Casablanca Bridges = New Beginning, KR = Exploration; Kenitra Bridges = Neutral Zone, KR = Resistance/Anger (dip, tied to Defect #31); Settat Bridges = New Beginning, KR = Exploration. | M6 (Emotional & Transition Layer) --- scores as above. Kenitra's dip is the trigger for Exception E4 (Sentiment Regression During Hypercare). | E4 (Sentiment Regression During Hypercare) --- trigger week |
| **Week 46** | **[PM]** Resolve Defect #31 (the inventory-matching mismatch) --- type in: "Defect #31 closed 46 [date]. Root cause: split-shipment edge case not covered in Build's Principle 2 configuration. Fix deployed and validated." | **[CM]** Run E4's full recovery --- confirm the regression is tied to Defect #31, not a general readiness failure; have the Kenitra supervisor acknowledge the incident with the team directly; provide targeted coaching on the specific stock-count step affected. See Exception E4 (Section 1B.4) for the full recovery detail. | M11 (Manager as Coach) --- Kenitra supervisor's coaching action logged: "Team huddle held 46 [date], Defect #31 fix explained, stock-count step walked through live." | E4 (Sentiment Regression During Hypercare) --- Recovery Tasks 1--4 |
| **Week 47** | **[PM]** Confirm Defect #31's fix is stable in production; no recurrence. | **[CM]** Repeat the re-pulse at the 4-week mark and compare the trend (Task 3, Step 2); re-pulse Kenitra specifically per E4's Recovery Task 5. | M6 (Emotional & Transition Layer) --- Kenitra re-scored: Bridges = New Beginning, KR = Exploration --- recovered. Casablanca and Settat both confirmed stable or improved. | E4 (Sentiment Regression During Hypercare) --- closes |
| **Week 48** | **[PM]** Begin early Sustain-phase planning in parallel (see Phase 8, Week 48). | **[CM]** Identify any cohort whose re-pulse moved backward (Task 4, Step 1) --- confirm none remain, following Week 47's recovery; close out Exception E6 (Cohort Divergence Across Sites)'s standing disaggregated reporting for this phase. | M14 (Analytics) --- Composite Readiness Index by site: Casablanca 82%, Kenitra 76%, Settat 74% --- the gap from Week 37 has narrowed substantially. | E6 (Cohort Divergence Across Sites) --- closes |
| **Week 49** | **[PM]** Draft the support-taper plan, moving from elevated staffing toward standard service levels. | **[CM]** Run targeted floor coaching on M11 (Manager as Coach) for any residual weak block identified across the three sites' latest scores. | M11 (Manager as Coach) --- final Hypercare-phase coaching actions logged per site. | --- |
| **Week 50** | **[PM]** Confirm the Phase 7 gate: adoption metrics stabilized, support taper plan approved. | **[CM]** Confirm Bridges reads New Beginning and Kübler-Ross reads Exploration or better across all three sites --- Exception E3 (Two-Clock Problem at Deploy)'s confirming evidence is now complete. | M3 (Initiative Registry) --- Lewin justification updated: "Provisional Refreeze confirmed by Week 45/47 re-pulse trend across all three sites. Confirming Refreeze formally in Sustain once 30-day checkpoint data lands." | E3 (Two-Clock Problem at Deploy) --- evidence complete |

**Phase gate:** Hypercare closes once the re-pulse confirms Bridges has genuinely moved to New Beginning and Kübler-Ross reads Exploration or better across all three sites --- not on the calendar alone.

**SIPOC.** Suppliers: Elevated support desk (ITL, CM); plant supervisors. · Inputs: Daily adoption metrics; go-live defect log; provisional Lewin reading. · Process: this phase's four Tasks in sequence · Outputs: Stabilized adoption metrics; confirmed Bridges/Kübler-Ross re-pulse; support taper plan. · Customers: Steering Committee; Sustain-phase team.

**RACSI for this phase.** R = CM, SUP · A = CM · C = ITL, PM · S = FPO · I = ES, EU

<a id="phase-8"></a>

#### Phase 8 --- Sustain (W48--64)

**Framework readings at close:** Lewin Refreeze (confirmed) · ADKAR focus Reinforcement · Bridges New Beginning · Kübler-Ross Commitment.

Sustain is where Refreeze is called from checkpoint evidence, never the calendar --- the discipline that protects against Exception E5 (Reinforcement Gap at Sustain), a Reinforcement gap, which plays out inside the table below. Weeks 48--50 overlap with Hypercare's own closing weeks (Phase 7, already covered there); this table picks up from Week 51.

| Week | Project Manager (PM) Track | Change Manager (CM) Track | journi Entry --- What to Type In | Exception |
|---|---|---|---|---|
| **Week 51** | **[PM]** Formally hand off the ERP Platform Unification Main Project's remaining technical backlog to business-as-usual IT support. | **[CM]** Agree the new-process metrics with HR (Task 1, Step 1) --- type in: "Order-to-cash cycle time (target: under 3 days); inventory reconciliation accuracy (target: 99%); duplicate-entry incidents (target: 0/month)." | M21 (Field Notes) --- type in: Category: Decision · Title: "New-Process Metrics Agreed with HR" · Logged by: Houda Zerouali · Body: "Order-to-cash cycle time (target: under 3 days); inventory reconciliation accuracy (target: 99%); duplicate-entry incidents (target: 0/month) --- agreed with HR outside journi. Confirmed live in the next review cycle, Week 52." · Related module: M12 (Sustainment). | --- |
| **Week 52** | **[PM]** Support HR's integration of the new metrics into the performance-management system. | **[CM]** Confirm the metrics are live in the next review cycle (Task 1, Step 2); run the 60-day checkpoint review. | M12 (Sustainment) --- 60-day checkpoint entry: type in status "Complete", regression risk "Low" for Casablanca and Kenitra, "Low" for Settat (recovered per Weeks 20--24 and 38--39). | --- |
| **Week 53** | **[PM]** No specific activity this week. | **[CM]** Confirm recognition and manager check-in mechanisms are running (Task 2, Step 1) --- type in: "Verified: monthly recognition email active at all 3 sites; weekly manager check-ins confirmed via supervisor sign-off log." | M12 (Sustainment) --- reinforcement-mechanism confirmation logged against the 60-day checkpoint. | --- |
| **Week 54** | **[PM]** Confirm with ITL that legacy-system licenses are scheduled for formal decommission. | **[CM]** Confirm legacy-system access is genuinely revoked (Task 2, Step 2) --- type in: "Legacy system access revoked for all 3,400 users as of 54 [date]. Verified via ITL access log --- 0 active legacy sessions." | M12 (Sustainment) --- fallback-access-closure confirmation logged. | --- |
| **Week 55** | **[PM]** No specific activity this week. | **[CM]** Monitor adoption metrics ahead of the 90-day checkpoint. | M14 (Analytics) --- Composite Readiness Index tracked weekly, no entry change. | --- |
| **Week 56** | **[PM]** No specific activity this week. | **[CM]** Run the 90-day checkpoint review (Task 3, Step 1) --- type in checkpoint result. | M12 (Sustainment) --- 90-day checkpoint entry: status "Complete"; ADKAR Reinforcement score entered as 2.6, below the 3.0 target across all three sites. | E5 (Reinforcement Gap at Sustain) --- trigger week |
| **Week 57** | **[PM]** No specific activity this week. | **[CM]** Flag the Reinforcement stall explicitly (E5's Recovery Task 1) rather than letting Task 4's closure proceed on schedule. | M5 (ADKAR Engine) --- Reinforcement flag logged with justification: "Score 2.6, below target. Root cause: manager check-ins tapered off after the 60-day checkpoint once daily hypercare tracking ended. Not proceeding to Refreeze/closure until resolved." | E5 (Reinforcement Gap at Sustain) --- Recovery Task 1 |
| **Week 58** | **[PM]** Adjust the program closure timeline to reflect the delayed Refreeze call. | **[CM]** Reconvene the CFO to re-authorize a further checkpoint cadence (E5's Recovery Task 2) --- type in: "CFO re-authorized checkpoints at Weeks 61 and 64, extending beyond the original Week 56 close." | M7 (Sponsor & Coalition) --- new sponsor action logged: "Re-authorize extended checkpoint cadence --- 58 [date], CFO." | E5 (Reinforcement Gap at Sustain) --- Recovery Task 2 |
| **Week 59** | **[PM]** No specific activity this week. | **[CM]** Re-activate the champion network specifically for reinforcement (E5's Recovery Task 3) --- type in: "Amal Ferhati, Yassine Bouhali, and Rania Idrissi re-briefed on reinforcement-specific floor observation --- manager check-in consistency, not adoption friction." | M4 (Stakeholder Mapping) --- champion entries updated with the re-activation note. | E5 (Reinforcement Gap at Sustain) --- Recovery Task 3 |
| **Week 60** | **[PM]** No specific activity this week. | **[CM]** Embed adoption metrics into the next performance-review cycle (E5's Recovery Task 4), giving Reinforcement a structural home in HR's cycle beyond the CM project's own lifespan. | M21 (Field Notes) --- type in: Category: Handoff · Title: "E5 Recovery Task 4 --- Reinforcement Embedded in HR Performance-Review Cycle" · Logged by: Houda Zerouali · Body: "Adoption metrics embedded into the next performance-review cycle, giving Reinforcement a structural home in HR's cycle beyond the CM project's own lifespan. Coordinated with HR outside journi." · Related module: M12 (Sustainment). | E5 (Reinforcement Gap at Sustain) --- Recovery Task 4 |
| **Week 61** | **[PM]** No specific activity this week. | **[CM]** Run the first extended checkpoint (per Week 58's re-authorization) --- type in checkpoint result. | M12 (Sustainment) --- checkpoint entry: ADKAR Reinforcement re-scored at 3.1 --- first healthy reading since the Week 56 stall. | --- |
| **Week 62** | **[PM]** No specific activity this week. | **[CM]** Continue monitoring; confirm the Week 61 improvement is holding, not a one-off reading. | M14 (Analytics) --- Composite Readiness Index trend confirmed stable across all three sites. | --- |
| **Week 63** | **[PM]** No specific activity this week. | **[CM]** Run the second extended checkpoint (E5's Recovery Task 5, evidence-gated confirmation) --- type in checkpoint result. | M12 (Sustainment) --- checkpoint entry: ADKAR Reinforcement = 3.3. Two consecutive healthy checkpoints (Weeks 61 and 63) now on record --- E5 closes. | E5 (Reinforcement Gap at Sustain) --- closes |
| **Week 64** | **[PM]** Confirm the Phase 8 gate and formal program closure with the Steering Committee. | **[CM]** Review three consecutive healthy checkpoints (Task 4, Step 1); log Refreeze on M3 (Initiative Registry) and toggle sign-off on M12 (Sustainment) (Task 4, Step 2). | M3 (Initiative Registry) --- type in: "Setting Refreeze (confirmed). Checkpoints at Weeks 52, 61, and 63 all healthy; Week 56's Reinforcement stall (E5) resolved and closed. Evidence reviewed with Steering Committee 64 [date]." M12 (Sustainment) --- sign-off toggle set to complete; Bouregreg ERP Adoption Program formally closed. | --- |

**Phase gate:** Sustain --- and the program --- closes on the sign-off toggle on M12 (Sustainment), blocked by ALT-015 (Part 5) if any checkpoint still carries an open High regression-risk flag.

**SIPOC.** Suppliers: HR (performance-management integration); Change Manager; Executive Sponsor. · Inputs: Hypercare's confirmed readings; 30/60/90-day checkpoint data. · Process: this phase's four Tasks in sequence · Outputs: Confirmed Refreeze; embedded reinforcement; closed CM project; lessons-learned log. · Customers: Executive Sponsor; business-as-usual process owner; future Bouregreg CM projects.

**RACSI for this phase.** R = CM · A = ES · C = PM, FPO · S = SUP · I = EU

<a id="p1b-3-9"></a>

#### Master WBS & Gantt --- Every Task and Step, PM and CM Tracks, Across the Four Frameworks

The table below is the single master schedule for Bouregreg's 64-week program: every Task and Step from all eight phases above, in one place, exactly as M17 (WBS & Gantt)'s real key fields hold them --- **Task name; track (PM/CM/framework); baseline start/end date; actual start/end date; status** (Part 2, M17). Scope is the normal flow only (1B.3): the six exceptions' own Recovery Tasks keep their own numbering in 1B.4 and are cross-referenced here by ID, not re-numbered into this WBS, so the two schemes never collide.

**How to read it.** Each phase's four Tasks appear as a bold row (ID `Pn-Tn`), followed by its Steps (ID `Pn-Tn-Sn`) indented with `↳`. **Track** names who executes it --- PM, CM, or PM+CM where a Task's two Steps split across both. **K-R** is Kübler-Ross. The four framework columns are populated only on the Step that actually sets or moves that framework's reading on M3 (Initiative Registry), M5 (ADKAR Engine), or M6 (Emotional & Transition Layer) --- a blank cell means that Step doesn't touch that framework, not that the framework is undefined at that point in time; read the phase's "Framework readings at close" line (1B.3) for the standing value between movements.

| ID | Task / Step Name | Track | Ph. | Wk(s) | Lewin | ADKAR | Bridges | K-R |
|---|---|---|---|---|---|---|---|---|
| **P1-T1** | **Discovery Workshops & Workaround Inventory** | PM+CM | P1 | W2--4 | | | | |
| P1-T1-S1 | ↳ [PM] Facilitate 3 Discovery Workshops, All Sites | PM | P1 | W2--4 | | | | |
| P1-T1-S2 | ↳ [CM] Compile Workaround Inventory | CM | P1 | W4 | | | | |
| **P1-T2** | **Business Case Quantification** | PM | P1 | W5--6 | | | | |
| P1-T2-S1 | ↳ [PM] Pull Reconciliation Time Logs per Site | PM | P1 | W5 | | | | |
| P1-T2-S2 | ↳ [PM] Compute Fully-Loaded Cost | PM | P1 | W6 | | | | |
| **P1-T3** | **Stakeholder Map & Impact Severity** | CM | P1 | W6--7 | | | | |
| P1-T3-S1 | ↳ [CM] Open Stakeholder Map, Enter Cohorts | CM | P1 | W6 | | | | |
| P1-T3-S2 | ↳ [CM] Flag High-Impact Cohorts, Finalize Severity | CM | P1 | W7 | | | | |
| **P1-T4** | **Business Case Sign-Off & Lewin Baseline** | PM+CM | P1 | W7--8 | | | | |
| P1-T4-S1 | ↳ [PM] Review Business Case & Stakeholder Map with Steering Committee | PM | P1 | W7 | | | | |
| P1-T4-S2 | ↳ [CM] Set Lewin = Unfreeze, with Justification | CM | P1 | W8 | Unfreeze (baseline) | | | Denial (baseline) |
| **P2-T1** | **Design Principles & Future-State Process Mapping** | PM | P2 | W6--8 | | | | |
| P2-T1-S1 | ↳ [PM] Draft Design Principles Workshop | PM | P2 | W6 | | | | |
| P2-T1-S2 | ↳ [PM] Consolidate Principles; Draft Future-State Process Maps | PM | P2 | W7 | | | | |
| P2-T1-S3 | ↳ [PM] Circulate Principles & Maps for Steering Committee Sign-Off | PM | P2 | W8 | | | | |
| **P2-T2** | **Kickoff Communications & FAQ** | CM | P2 | W9--10 | | | | |
| P2-T2-S1 | ↳ [CM] Deliver Kickoff Town Hall, All 3 Sites | CM | P2 | W9 | | | | |
| P2-T2-S2 | ↳ [CM] Open & Monitor FAQ Channel | CM | P2 | W10 | | | | |
| **P2-T3** | **Baseline Awareness Pulse** | CM | P2 | W11--12 | | | | |
| P2-T3-S1 | ↳ [CM] Run Baseline Awareness Pulse per Cohort | CM | P2 | W11 | | Awareness = 3/2/2/4 (baseline, by cohort) | | |
| P2-T3-S2 | ↳ [CM] Log Barrier-Reason Notes, Auto-Escalated Cohorts | CM | P2 | W12 | | | | |
| **P2-T4** | **Champion Recruitment** | CM | P2 | W13--14 | | | | |
| P2-T4-S1 | ↳ [CM] Identify Candidate Champions per Site | CM | P2 | W13 | | | | |
| P2-T4-S2 | ↳ [CM] Log Champion Roster Against Stakeholder Map | CM | P2 | W14 | | | | |
| **P3-T1** | **Configuration Sprint 1 & Principle Traceability** | PM | P3 | W12--14 | | | | |
| P3-T1-S1 | ↳ [PM] Stand Up Config Environment; Begin Sprint 1 | PM | P3 | W12 | | | | |
| P3-T1-S2 | ↳ [PM] Close Sprint 1; Log Decisions vs. Principles | PM | P3 | W14 | | | | |
| **P3-T2** | **Champion Briefing & Observation-Logging Path** | CM | P3 | W16--17 | | | | |
| P3-T2-S1 | ↳ [CM] Run Champion Briefing per Site | CM | P3 | W16 | | | | |
| P3-T2-S2 | ↳ [CM] Confirm Observation-Logging Path per Champion | CM | P3 | W17 | | | | |
| **P3-T3** | **Desire Re-Scoring & Barrier Response (E1)** | CM | P3 | W18--24 | | | | |
| P3-T3-S1 | ↳ [CM] Re-Score Desire per Cohort | CM | P3 | W18 | | Desire = 3/3/2 (Settat auto-escalates) | | |
| P3-T3-S2 | ↳ [CM] Log Mandatory Barrier-Reason Note, Settat --- opens E1 (Recovery Tasks 1--5, 1B.4) | CM | P3 | W19--24 | | Desire Settat 2 → 3 (W24, post-E1) | | Settat Denial → Resistance/Anger (W24) |
| **P3-T4** | **Evidence Review & Lewin = Change Call** | CM | P3 | W28--29 | | | | |
| P3-T4-S1 | ↳ [CM] Review Evidence Against Signal Catalogue | CM | P3 | W28 | | | | |
| P3-T4-S2 | ↳ [CM] Set Lewin = Change, with Justification | CM | P3 | W29 | Unfreeze → Change | | | |
| **P4-T1** | **SIT Execution & Defect Triage** | PM | P4 | W28--29 | | | | |
| P4-T1-S1 | ↳ [PM] Run SIT Test Script, 40 Scenarios | PM | P4 | W28 | | | | |
| P4-T1-S2 | ↳ [PM] Triage & Close SIT Defects by Severity | PM | P4 | W29 | | | | |
| **P4-T2** | **UAT Recruitment & Roster** | CM | P4 | W30--31 | | | | |
| P4-T2-S1 | ↳ [CM] Select UAT Participants, Proportionate to Site | CM | P4 | W30 | | | | |
| P4-T2-S2 | ↳ [CM] Log UAT Roster & Acceptance Criteria | CM | P4 | W31 | | | | |
| **P4-T3** | **UAT Execution & Knowledge Scoring** | CM | P4 | W32--33 | | | | |
| P4-T3-S1 | ↳ [CM] Run UAT Scenarios, Casablanca Finance | CM | P4 | W32 | | Knowledge = 4 (Casablanca) | | |
| P4-T3-S2 | ↳ [CM] Run UAT Scenarios, Kenitra/Settat; Log Defects vs. Friction | CM | P4 | W33 | | Knowledge = 4 (Kenitra), 3 (Settat) | | |
| **P4-T4** | **Divergence Pattern Review (E2)** | CM | P4 | W34--36 | | | | |
| P4-T4-S1 | ↳ [CM] Run Divergence Pattern Review vs. Bridges --- ALT-001 fires, opens E2 | CM | P4 | W34 | | | Ending (flagged participant, Knowledge/Ability ≥ 4) | |
| P4-T4-S2 | ↳ [CM] Route Flagged Case into E2 Recovery Tasks 1--5 (1B.4) | CM | P4 | W35--36 | | | Ending → Neutral Zone (W36, post-E2) | |
| **P5-T1** | **Curriculum Enrollment & Wave-1 Delivery** | CM | P5 | W30--33 | | | | |
| P5-T1-S1 | ↳ [CM] Enroll Cohorts Against Role-Based Curriculum | CM | P5 | W30 | | | | |
| P5-T1-S2 | ↳ [CM] Deliver Training Wave 1, All 3 Sites | CM | P5 | W31--33 | | | | |
| **P5-T2** | **Job Aids & Sandbox Practice** | PM | P5 | W34--35 | | | | |
| P5-T2-S1 | ↳ [PM] Publish Job Aids per Role | PM | P5 | W34 | | | | |
| P5-T2-S2 | ↳ [PM] Open Sandbox for Supervised Practice | PM | P5 | W35 | | | | |
| **P5-T3** | **Knowledge/Ability Scoring & Divergence Flag (E6)** | CM | P5 | W36--39 | | | | |
| P5-T3-S1 | ↳ [CM] Score Knowledge & Ability per Cohort --- opens E6 | CM | P5 | W36 | | Knowledge/Ability = 4/4 (Casa), 4/3 (Kenitra), 3/2 (Settat) | | |
| P5-T3-S2 | ↳ [CM] Flag Settat Below Benchmark for Wave 2 --- E6 Recovery Tasks 1--4 (1B.4) | CM | P5 | W37--39 | | Settat Knowledge/Ability 3/2 → 4/3 (W39, post-E6 Recovery Task 4) | | |
| **P5-T4** | **Coach Readiness & Go/No-Go** | CM | P5 | W40--42 | | | | |
| P5-T4-S1 | ↳ [CM] Walk People Managers Through M11 Heatmap | CM | P5 | W40 | | | | |
| P5-T4-S2 | ↳ [CM] Confirm Supervisor Go-Live Coaching Plans | CM | P5 | W41 | | | | |
| **P6-T1** | **Data Freeze & Migration** | PM | P6 | D1--2 | | | | |
| P6-T1-S1 | ↳ [PM] Freeze Legacy-System Data Entry | PM | P6 | D1 | | | | |
| P6-T1-S2 | ↳ [PM] Run Final Migration & Reconcile | PM | P6 | D2 | | | | |
| **P6-T2** | **Cutover & Technical Validation** | PM | P6 | D3 | | | | |
| P6-T2-S1 | ↳ [PM] Execute Cutover Runbook | PM | P6 | D3 | | | | |
| P6-T2-S2 | ↳ [PM] Validate Live Platform vs. Acceptance Criteria | PM | P6 | D3 | | | | |
| **P6-T3** | **Go-Live Communication** | CM | P6 | D4 | | | | |
| P6-T3-S1 | ↳ [CM] Draft & Send Go-Live Confirmation, All Sites | CM | P6 | D4 | | | | |
| **P6-T4** | **Hypercare Activation & Provisional Lewin (opens E3)** | CM | P6 | D5 | | | | |
| P6-T4-S1 | ↳ [CM] Activate Hypercare Support Model | CM | P6 | D5 | | | | |
| P6-T4-S2 | ↳ [CM] Mark Lewin Provisional --- opens E3 | CM | P6 | D5 | Change → Refreeze (provisional) | | | |
| **P7-T1** | **Elevated Support & Escalation Path** | CM | P7 | W44 | | | | |
| P7-T1-S1 | ↳ [CM] Continue Elevated Support Desk Staffing | CM | P7 | W44 | | | | |
| P7-T1-S2 | ↳ [CM] Publish Escalation Path, All Sites | CM | P7 | W44 | | | | |
| **P7-T2** | **Adoption Dashboard & Defect Triage** | PM | P7 | W44--45 | | | | |
| P7-T2-S1 | ↳ [PM] Review M14 Adoption Dashboard Daily | PM | P7 | W44 | | | | |
| P7-T2-S2 | ↳ [PM] Triage & Route Defects by Severity | PM | P7 | W45 | | | | |
| **P7-T3** | **Bridges/Kübler-Ross Re-Pulse (E4)** | CM | P7 | W45--47 | | | | |
| P7-T3-S1 | ↳ [CM] Re-Score Bridges & Kübler-Ross, 2-Week Mark --- opens E4 | CM | P7 | W45 | | | Casa/Settat New Beginning; Kenitra Neutral Zone (dip) | Casa/Settat Exploration; Kenitra Resistance/Anger (dip) |
| P7-T3-S2 | ↳ [CM] Repeat Re-Pulse, 4-Week Mark --- E4 closes | CM | P7 | W47 | | | Kenitra Neutral Zone → New Beginning | Kenitra Resistance/Anger → Exploration |
| **P7-T4** | **Backward-Movement Check & Phase Gate** | CM | P7 | W48--50 | | | | |
| P7-T4-S1 | ↳ [CM] Identify Any Cohort Moved Backward --- E6 closes | CM | P7 | W48 | | | | |
| P7-T4-S2 | ↳ [CM] Confirm Bridges/Kübler-Ross, All Sites --- E3 evidence complete | CM | P7 | W50 | | | New Beginning (all sites, confirmed) | Exploration or better (all sites, confirmed) |
| **P8-T1** | **New-Process Metrics Agreement** | CM | P8 | W51--52 | | | | |
| P8-T1-S1 | ↳ [CM] Agree New-Process Metrics with HR | CM | P8 | W51 | | | | |
| P8-T1-S2 | ↳ [CM] Confirm Metrics Live; Run 60-Day Checkpoint | CM | P8 | W52 | | | | |
| **P8-T2** | **Reinforcement Mechanisms & Legacy Decommission** | CM | P8 | W53--54 | | | | |
| P8-T2-S1 | ↳ [CM] Confirm Recognition/Check-In Mechanisms Running | CM | P8 | W53 | | | | |
| P8-T2-S2 | ↳ [CM] Confirm Legacy Access Revoked, All Users | CM | P8 | W54 | | | | |
| **P8-T3** | **90-Day Checkpoint & Reinforcement Gap (E5)** | CM | P8 | W56--63 | | | | |
| P8-T3-S1 | ↳ [CM] Run 90-Day Checkpoint Review --- opens E5 | CM | P8 | W56 | | Reinforcement = 2.6 (below 3.0 target) | | |
| P8-T3-S2 | ↳ [CM] Second Extended Checkpoint, Evidence-Gated --- via E5 Recovery Task 5 (1B.4); E5 closes | CM | P8 | W63 | | Reinforcement = 3.3 | | |
| **P8-T4** | **Refreeze Confirmation & Program Closure** | CM | P8 | W64 | | | | |
| P8-T4-S1 | ↳ [CM] Review Three Consecutive Healthy Checkpoints | CM | P8 | W64 | | | | |
| P8-T4-S2 | ↳ [CM] Log Refreeze; Toggle Sustainment Sign-Off | CM | P8 | W64 | Refreeze (confirmed) | | | |

#### Software Build Task Index --- Every Technical/ITL Task, All Eight Phases

The Master WBS & Gantt table above interleaves PM, CM, and framework rows together; the index below pulls out only the software/technical build work --- the tasks ITL actually executes or supports --- across all eight phases in build order, so a technical lead can see the full build path without reading every PM row. Discovery carries no build task (it is pre-scope); every other phase does.

| ID | Phase | Wk(s) | Software / Technical Build Task | Owner |
|---|---|---|---|---|
| P2-T1-S2 | P2 --- Design | W7 | Translate design principles into future-state process maps for Order Management, Inventory, and Finance --- the direct input to Build's five sprints. | PM (ITL input) |
| P3-T1-S1 | P3 --- Build | W12 | Stand up the configuration environment; begin Sprint 1. | ITL/PM |
| Sprint 1 | P3 --- Build | W12--14 | Order Management module configuration against Principle 2. | ITL |
| Sprint 2 | P3 --- Build | W15--17 | Inventory module configuration against Principles 2--3. | ITL |
| Sprint 3 | P3 --- Build | W18--21 | Finance module reconciliation logic. | ITL |
| Sprint 4 | P3 --- Build | W22--24 | Integration testing prep --- cross-module scenario scripts. | ITL |
| Sprint 5 | P3 --- Build | W25--26 | Reporting and dashboards module; internal configuration testing begins on close. | ITL |
| P3-T1-S2 | P3 --- Build | W14 | Log each sprint's configuration decision against its justifying design principle on M17 (WBS & Gantt). | PM/ITL |
| P4-T1-S1 | P4 --- Test | W28 | Run the System Integration Testing script --- 40 scripted scenarios across Order Management, Inventory, and Finance. | ITL |
| P4-T1-S2 | P4 --- Test | W29 | Triage and close SIT defects by severity. | ITL/PM |
| P5-T2-S2 | P5 --- Train | W35 | Open the sandbox environment for supervised practice, all three sites. | ITL |
| P6-T1-S1 | P6 --- Deploy | D1 | Freeze legacy-system data entry at the agreed cutoff. | ITL/PM |
| P6-T1-S2 | P6 --- Deploy | D2 | Run the final migration and reconcile --- 100% of frozen records matched, 0 discrepancies. | ITL/PM |
| P6-T2-S1 | P6 --- Deploy | D3 | Execute the cutover runbook step by step. | ITL/PM |
| P6-T2-S2 | P6 --- Deploy | D3 | Validate the live platform against acceptance criteria. | ITL/PM |
| P7-T2-S1 | P7 --- Hypercare | W44 | Review the M14 (Analytics) adoption dashboard daily --- transaction volume and error rate per site. | PM/ITL |
| P7-T2-S2 | P7 --- Hypercare | W45 | Triage and route go-live defects by severity. | PM/ITL |
| --- | P7 --- Hypercare | W46 | Resolve Defect #31 (inventory-matching mismatch, root cause: split-shipment edge case not covered in Build's Principle 2 configuration) --- fix deployed and validated. | ITL |
| P8-T2-S2 | P8 --- Sustain | W54 | Confirm legacy-system access genuinely revoked for all 3,400 users --- verified via ITL access log, 0 active legacy sessions. | ITL |

<a id="p1b-4"></a>

### 1B.4 Six Exception Scenarios, in Detail

Every exception below is a realistic, specific way one of the four frameworks' normal progression (1B.1--1B.3) stalls, diverges, or reverses --- not a hypothetical. Each is tied to a concrete point in Bouregreg's 64-week timeline and a specific site, cohort, or role, with its trigger, timeline impact, recovery Tasks, and outputs stated in the same detail as the normal-flow phases above.

<a id="exc-e1"></a>

#### E1 --- Desire Stall at Settat (Related to Phase 3 --- Build)

**Trigger:** ADKAR Desire logged at 2 or below for the Settat plant-floor cohort on M5 (ADKAR Engine), auto-escalating; barrier-reason notes cite low visibility into what the new inventory workflow will actually look like on their specific line, and unresolved fear about whether the new system will eliminate positions.

**Timeline impact:** Inserted as a 2--4 week parallel track within Build (around W20--24); Train's Task 1 (role-based delivery) does not open for the Settat cohort while their Desire score remains escalated --- Test's Task 2 UAT recruitment (Part 1B.3) is affected in turn if Settat's representative isn't ready to participate meaningfully.

**Recovery Tasks:**

1. **Cluster barrier-reason notes by root cause.** Houda Zerouali reviews Settat's logged barrier notes and finds the two recurring themes: workflow visibility and position security, not the system itself. *journi: M5 (ADKAR Engine).* Technique: root-cause clustering --- goal: separate the real driver from the noise before designing any response.
2. **Run targeted listening sessions.** Small-group sessions with the Settat plant-floor cohort validate which of the two themes is actually driving the stall --- in this case, position security, not workflow visibility. Technique: targeted listening session --- goal: confirm the clustering with the cohort directly, not assume it.
3. **Design a specific, credible response.** Driss El Amrani and the CFO agree a concrete, verifiable commitment on staffing levels post-go-live --- not a vague reassurance. Technique: credible-response design --- goal: a commitment specific and checkable enough that the cohort can hold the Sponsor to it.
4. **Have the Sponsor deliver the response personally.** The CFO delivers the commitment directly to the Settat cohort, in person, rather than through a written communication alone --- consistent with the CM Charter Sponsor standard (M19 (CM Charters)). Technique: sponsor-delivered response --- goal: the weight of a personal, visible commitment, not a memo.
5. **Re-score Desire and Kübler-Ross sentiment 2--4 weeks later.** Both scores are re-read on M5 (ADKAR Engine)/M6 (Emotional & Transition Layer) to confirm the intervention actually worked, not just that it happened. *journi: M5 (ADKAR Engine)--M6 (Emotional & Transition Layer).* Technique: post-intervention re-scoring --- goal: verify the fix worked, not just that it was attempted.

**Outputs:** root-cause clustering of the Desire stall; a specific, sponsor-delivered response; updated Desire and Kübler-Ross scores; Settat cleared to enter Train's Task 1 on schedule.

**RACSI for this exception.** R = CM · A = CM · C = ES, SUP · S = PM · I = FPO, EU

<a id="exc-e2"></a>

#### E2 --- Divergence Pattern at UAT (Related to Phases 4--5 --- Test, Train)

**Trigger:** ALT-001 (Divergence Pattern Detected) fires --- a UAT participant or cohort logs Knowledge ≥ 4 and Ability ≥ 4 on M5 (ADKAR Engine) while Bridges still reads exactly "Ending" on M6 (Emotional & Transition Layer). In Bouregreg's timeline, this is most likely to first appear among Casablanca finance staff, who move through Knowledge/Ability quickly given their proximity to the program team but whose day-to-day work is the most disrupted by the new process.

**Timeline impact:** A targeted, individual-level intervention runs alongside Train; the flagged individual does not count toward Train's Task 3 cohort-readiness call until Bridges moves off Ending.

**Recovery Tasks:**

1. **Review the alert and confirm it against supervisor observation.** Driss El Amrani checks whether the flagged individual's supervisor has independently noticed anything --- confirming this isn't a false positive from a single bad Bridges reading. *journi: M6 (Emotional & Transition Layer).* Technique: cross-source confirmation --- goal: rule out a false positive before spending a 1:1 on it.
2. **Hold a 1:1 focused on what is being let go of, not on skills.** The conversation deliberately does not revisit training content --- the person already scored Knowledge ≥ 4 and Ability ≥ 4; the gap is emotional, not technical. Technique: loss-focused 1:1 --- goal: address the actual gap, not the one that's easier to talk about.
3. **Distinguish a genuine loss concern from simple reluctance.** The 1:1 surfaces whether this is a real identity/loss concern (for example, a role that existed under the legacy system and doesn't exist in the new one) or ordinary change reluctance. Technique: genuine-loss diagnosis --- goal: don't over-treat ordinary reluctance as a structural loss, or under-treat a real one.
4. **Provide an explicit closure moment if a genuine loss is identified.** If real, the loss is acknowledged explicitly and directly --- not talked around. Technique: explicit closure moment --- goal: name the loss plainly, since an unacknowledged one lingers longer than an acknowledged one.
5. **Re-check the Bridges reading only, at the next scheduled pulse.** Only Bridges is re-scored; Knowledge and Ability are already confirmed and do not need re-testing. *journi: M6 (Emotional & Transition Layer).* Technique: scoped re-check --- goal: confirm movement on the one dimension that was actually in question.

**Outputs:** confirmed or dismissed divergence case; documented loss concern if genuine; updated Bridges reading; the individual cleared for Train's cohort-readiness call once resolved.

**RACSI for this exception.** R = CM · A = CM · C = SUP · S = FPO · I = ES, EU

<a id="exc-e3"></a>

#### E3 --- Two-Clock Problem at Deploy (Related to Phase 6 --- Deploy)

**Trigger:** Lewin is technically eligible to be called "Change → Refreeze" on the Deploy week's calendar date, while Bridges and Kübler-Ross across most cohorts still read Neutral Zone / Resistance-Anger or lower --- the organizational clock (a single go-live date) and the emotional clock (which does not move on a fixed schedule) diverging exactly as 1B.3's Phase 6 anticipates.

**Timeline impact:** Does not delay go-live itself; extends the hypercare and reinforcement budget and staffing window by the observed lag --- commonly 2--6 weeks past the original Hypercare end date.

**Recovery Tasks:**

1. **Separate the technical go-live milestone from the Lewin phase call.** Driss El Amrani and the ITL team agree explicitly: a clean technical cutover is not, by itself, evidence for Refreeze. *journi: M3 (Initiative Registry).* Technique: milestone/phase-call separation --- goal: prevent a technical success from being mistaken for an emotional one.
2. **Mark Lewin as "provisional Refreeze" pending emotional-layer evidence.** Exactly the Phase 6 Task 4 language --- logged as provisional, with a justification stating what evidence is still pending. *journi: M3 (Initiative Registry).* Technique: provisional-state logging --- goal: an honest, auditable holding position rather than a premature confirmed one.
3. **Keep Reinforcement and hypercare fully active.** The hypercare support model (Phase 7 Task 1) is not tapered down just because the Lewin call is provisional rather than confirmed. Technique: sustained support funding --- goal: don't let a budget conversation force the Lewin call before the evidence is ready.
4. **Re-pulse Bridges/Kübler-Ross at 2 and 4 weeks.** Exactly Phase 7's Task 3, run with this exception's resolution specifically in mind. *journi: M6 (Emotional & Transition Layer).* Technique: exception-scoped re-pulse --- goal: the same technique as the normal flow, run with this specific open question in mind.
5. **Confirm or walk back the Refreeze call once evidence supports it.** If the re-pulse shows genuine movement, Refreeze is confirmed; if not, hypercare extends further and the cycle repeats. *journi: M3 (Initiative Registry).* Technique: evidence-gated confirmation --- goal: no fixed number of cycles guaranteed; the evidence decides when this closes.

**Outputs:** an explicit provisional Lewin phase call rather than a premature confirmed one; sustained hypercare funding through the lag; a confirmed or corrected Lewin phase once the re-pulse lands.

**RACSI for this exception.** R = CM, ITL · A = ES · C = PM · S = SUP · I = EU

<a id="exc-e4"></a>

#### E4 --- Sentiment Regression During Hypercare (Related to Phase 7 --- Hypercare)

**Trigger:** A cohort's Kübler-Ross reading moves backward on M6 (Emotional & Transition Layer) --- typically from Exploration back to Resistance/Anger --- following a specific triggering event: in Bouregreg's case, a defect in the Kenitra plant's inventory-matching logic that caused a visible, embarrassing stock-count error in front of a cohort that had just started to trust the new system.

**Timeline impact:** A short, contained recovery cycle of days to roughly two weeks; escalated to Steering Committee only if the pattern recurs across multiple cohorts rather than staying isolated to the one affected.

**Recovery Tasks:**

1. **Confirm the regression is tied to a specific incident.** Houda Zerouali checks whether this is a one-off reaction to the Kenitra defect or a broader readiness failure --- in this case, clearly the former. Technique: incident-scope confirmation --- goal: don't escalate a contained incident into a program-wide panic.
2. **Resolve or clearly communicate the status of the triggering defect.** ITL fixes the inventory-matching defect and Driss El Amrani communicates the fix explicitly to the affected cohort, closing the loop rather than letting it fade unaddressed. Technique: closed-loop defect communication --- goal: the cohort hears the fix was made, not left to assume nothing happened.
3. **Have the supervisor directly acknowledge the setback.** The Kenitra plant supervisor acknowledges the incident with the affected team directly, rather than letting the program office's fix announcement stand in for a floor-level conversation. Technique: supervisor-level acknowledgment --- goal: a floor-level conversation carries more weight than a program-office announcement alone.
4. **Provide targeted, in-context coaching on the specific process step affected.** Coaching is scoped narrowly to the exact inventory-matching step that failed, not a general refresher. Technique: in-context, scoped coaching --- goal: rebuild confidence on the specific step, not a diluted general refresher.
5. **Re-pulse the affected cohort only, at 1--2 weeks.** Only the Kenitra cohort is re-scored --- this is a localized regression, not a program-wide one. *journi: M6 (Emotional & Transition Layer).* Technique: localized re-pulse --- goal: confirm recovery where the regression actually happened.

**Outputs:** the triggering defect resolved and communicated; the regression event and response documented; confirmed recovery, or continued monitoring if the re-pulse doesn't yet show it.

**RACSI for this exception.** R = SUP, ITL · A = CM · C = PM · S = FPO · I = ES, EU

<a id="exc-e5"></a>

#### E5 --- Reinforcement Gap at Sustain (Related to Phase 8 --- Sustain)

**Trigger:** The ADKAR Reinforcement score stalls below 3 on M5 (ADKAR Engine) as the program's formal end date approaches, with no forcing deadline prompting continued attention --- the exact risk Phase 8's discipline (Refreeze called from evidence, never the calendar) exists to prevent.

**Timeline impact:** Extends the formal project-closure date by however long it takes to accumulate 2--3 consecutive healthy checkpoints on M12 (Sustainment) --- commonly 4--8 weeks past the original W60 close.

**Recovery Tasks:**

1. **Flag the Reinforcement stall explicitly.** Driss El Amrani flags the stall on M5 (ADKAR Engine) rather than letting Sustain's Task 4 (call Refreeze; close the project) proceed on schedule regardless. *journi: M5 (ADKAR Engine).* Technique: explicit stall flagging --- goal: interrupt a default-to-close momentum with a documented, deliberate flag.
2. **Reconvene the Sponsor to re-authorize a checkpoint cadence.** The CFO re-authorizes a defined checkpoint cadence beyond the originally planned close date. Technique: checkpoint-cadence re-authorization --- goal: a Sponsor-backed extension, not an informal one the team grants itself.
3. **Re-activate or formally re-charter the champion network.** The champion network, which naturally quiets down as a program matures, is re-activated specifically to reinforce the new process on the floor. Technique: champion network re-activation --- goal: reinforcement needs the same floor-level presence that adoption did.
4. **Embed adoption metrics into the next performance-review cycle.** Adoption metrics are explicitly written into HR's next performance-review cycle, giving Reinforcement a structural home beyond the CM project's own lifespan. Technique: structural metric embedding --- goal: Reinforcement survives the CM project team's own eventual departure.
5. **Delay the formal Refreeze/closure call.** Sustain's Task 4 does not run until checkpoints show target Reinforcement, however long that takes. *journi: M3 (Initiative Registry).* Technique: delayed, evidence-gated closure --- goal: closure waits on evidence, not on a project team's patience running out.

**Outputs:** a documented Reinforcement stall and remediation plan; a re-authorized checkpoint cadence; a re-chartered champion network; a delayed but evidence-based Refreeze call rather than a premature one.

**RACSI for this exception.** R = CM · A = ES · C = SUP, FPO · S = PM · I = EU

<a id="exc-e6"></a>

#### E6 --- Cohort Divergence Across Sites (Cross-Cutting, Phases 4--7 --- Test through Hypercare)

**Trigger:** Casablanca, Kenitra, and Settat read genuinely differently across all four frameworks by mid-Train --- Casablanca ahead on Knowledge/Ability given proximity to the program team, Settat behind following E1's Desire stall, Kenitra solid until E4's regression --- making the project-level Composite Readiness Index on M14 (Analytics) a misleading blend of three very different real situations.

**Timeline impact:** Runs continuously alongside Test, Train, and Hypercare; enables a cohort-by-cohort go/no-go at Phase 5's gate instead of a single all-or-nothing call for all 3,400 people at once.

**Recovery Tasks:**

1. **Disaggregate the Composite Readiness Index by site.** Meryem Sabri pulls the blended M14 (Analytics) number apart into three site-level readings, using the Stakeholder Map's site tags on M4 (Stakeholder Mapping). *journi: M4 (Stakeholder Mapping).* Technique: site-level disaggregation --- goal: replace one misleading average with three honest readings.
2. **Identify which cohorts are driving the spread.** Casablanca high, Settat low, Kenitra mid-but-dipping-post-E4 --- named explicitly rather than averaged away. Technique: explicit spread identification --- goal: name which sites are actually driving the number, not just that it's spread out.
3. **Investigate what Casablanca did differently.** Proximity to the program team and an earlier champion briefing are identified as the concrete, transferable factors --- not an unexplained "Casablanca is just more ready." Technique: root-cause comparison --- goal: a transferable explanation, not an unexplained label.
4. **Transfer concrete practices to Settat and Kenitra.** The earlier champion briefing timing is applied to the next site rollout in the scenario library (Part 4); Settat's dedicated E1 recovery plan is extended to cover the same visibility gap at Kenitra proactively. Technique: cross-site practice transfer --- goal: apply what worked at the strongest site before the weakest site needs its own separate recovery.
5. **Continue reporting cohort-level readiness alongside the project-level number.** Every future Steering Committee readout carries the three-site breakdown, not just the blended figure, through Phase 5's cohort-by-cohort gate and beyond. Technique: standing disaggregated reporting --- goal: the site-level view becomes the default, not a one-time analysis.

**Outputs:** a disaggregated, site-level readiness report; a root-cause comparison between Casablanca and the other two sites; a revised, cohort-by-cohort go/no-go recommendation at Phase 5's gate rather than one all-or-nothing call.

**RACSI for this exception.** R = CM, FPO · A = CM · C = SUP · S = PM · I = ES, EU

<a id="p1b-5"></a>

### 1B.5 What to Track, by Cadence

The tracking model below is the bridge between the phase-by-phase playbook above and the alerts in Part 5 --- what Driss El Amrani and his team actually look at, and how often, across the Bouregreg ERP Adoption Program's 60 weeks.

**Daily (Deploy through Hypercare, W43--50 --- Phase 6 Task 3, Phase 7 Task 2):** adoption-metric dashboard on M14 (Analytics); the elevated support desk's open ticket count by site; any new resistance entry on M10 (Resistance) logged in the last 24 hours.

**Weekly (throughout):** the Notification Center bell, for any of the 9 live alerts (Part 5); ADKAR scores for any cohort currently mid-training or mid-intervention; sponsor-action completion on M7 (Sponsor & Coalition) against that week's roadmap item.

**Bi-Weekly (Hypercare, W43--50 --- Phase 7 Task 3):** the Kübler-Ross/Bridges re-pulse cadence itself; regression coaching outcomes on M11 (Manager as Coach) for any cohort flagged the prior cycle.

**Monthly (throughout, and mandatory from Sustain onward):** the Composite Readiness Index trend line on M14 (Analytics); Lewin phase justification, reviewed against evidence rather than the calendar; Steering Committee readout, carrying the per-site breakdown established in Exception E6 (Cohort Divergence Across Sites).

**Escalation thresholds (the bridge to Part 5's alerts):**

| Signal observed | Threshold | Action required | Linked exception / alert |
|---|---|---|---|
| Desire ≤ 2, auto-escalated, low-visibility barrier notes | 1 occurrence | Log barrier-reason note; begin E1 recovery | E1 · M5 (ADKAR Engine) escalation |
| Knowledge ≥ 4 and Ability ≥ 4 while Bridges = Ending | 1 occurrence | Run E2 recovery; do not count toward cohort readiness | E2 · ALT-001 (Divergence Pattern Detected) |
| Lewin eligible for Refreeze on the calendar, Bridges/KR not yet there | Go-live date reached | Mark Lewin provisional; run E3 | E3 · Phase 6 gate |
| Kübler-Ross reading moves backward after a specific incident | 1 occurrence, 1 cohort | Run E4's contained recovery cycle | E4 |
| ADKAR Reinforcement < 3 as formal close approaches | Any Sustain-phase checkpoint | Flag stall; run E5; delay closure | E5 · ALT-015 (Sustainment Sign-Off Blocked) |
| Site-level readiness spread exceeds one full benchmark band | Any Phase 4--7 checkpoint | Disaggregate M14 (Analytics); run E6 | E6 |
| 3 or more open Resistance Log entries | Any point | Escalate to Steering Committee | ALT-004 (Resistance Escalation Threshold Breached) |
| Sponsor visibility logged "weak" | Any governance week | Escalate to PMO | ALT-003 (Sponsor Coverage Gap) |
| Fewer than 2 named coalition members | Any point | Escalate to PMO | ALT-010 (Guiding Coalition Gap) |

<a id="p1b-6"></a>

### 1B.6 The Program, Month by Month

Sections 1B.3 and 1B.4 gave the Bouregreg ERP Adoption Program's normal flow and its six exceptions as separate, structured references. This subsection puts them back together as one continuous account, month by month, so a reader can see how the two actually interleave over the program's real 14 months --- which is what living through a program week by week actually looks like, rather than a phase table and an exception appendix read separately.

**Month 1 (W1--4).** Discovery opens. Meryem Sabri's team runs the first discovery workshops at Casablanca HQ; Kenitra and Settat follow the week after. Lewin reads Unfreeze from the first week --- not because the program just started, but because the discovery findings already support it.

**Month 2 (W5--8).** Discovery closes with a signed-off business case and a complete Stakeholder Map. Design opens in parallel: the first design-principle draft circulates before Discovery's final workshop has even happened at Settat.

**Month 3 (W9--13).** Design's future-state scope is signed off by the Steering Committee. The first town hall goes out across all three sites, and the first real Awareness scores land on M5 (ADKAR Engine) --- Casablanca reading highest, Settat lowest, exactly the spread Exception E6 (Cohort Divergence Across Sites) will later name explicitly.

**Month 4 (W14--17).** Build opens. Configuration sprints begin against the signed-off design principles, and the first wave of champions is briefed --- the moment Exception E7 (Part 3) becomes an operating loop rather than a theoretical one.

**Month 5 (W18--22).** Mid-Build. Awareness gives way to Desire across most cohorts --- except the Settat plant floor, where Desire drops to 2 and auto-escalates. **Exception E1 (Desire Stall at Settat) opens here.** Houda Zerouali clusters the barrier notes; the theme is position security, not workflow visibility.

**Month 6 (W23--27).** **E1 (Desire Stall at Settat) closes.** The CFO delivers a direct, verifiable staffing commitment to the Settat cohort in person; Desire and Kübler-Ross sentiment both recover within the month. Build closes shortly after: configuration is functionally complete, and Lewin moves from Unfreeze to Change on the strength of that evidence, not the calendar.

**Month 7 (W28--30).** Test opens. SIT runs clean. The UAT cohort is recruited across all three sites, with Settat's representative now genuinely ready to participate meaningfully, thanks to Month 6's recovery.

**Month 8 (W31--35).** UAT runs in earnest. A Casablanca finance participant logs Knowledge ≥ 4 and Ability ≥ 4 while Bridges still reads Ending --- **Exception E2 (Divergence Pattern at UAT) fires** as ALT-001 (Divergence Pattern Detected). Driss El Amrani runs the 1:1; the underlying concern turns out to be genuine, tied to a role that exists under the legacy system and doesn't exist in the new one, and is given an explicit closure moment. Train opens in parallel: role-based training begins by cohort.

**Month 9 (W36--39).** Train continues. Kenitra and Settat's job aids and sandbox environment go live. The Composite Readiness Index on M14 (Analytics), blended across all three sites, starts reading in a range that --- disaggregated --- turns out to mean something different at each site. **Exception E6 (Cohort Divergence Across Sites) is formally opened** as Meryem Sabri pulls the site-level breakdown apart for the first time.

**Month 10 (W40--42).** Train closes. Cohort-level go/no-go is confirmed --- Casablanca and Settat (recovered since Month 6) clear cleanly; Kenitra clears with a coaching note attached, informed directly by E6's site-level comparison. Supervisors at both plant sites are briefed on floor-coaching expectations for the go-live week ahead.

**Month 11 (W43).** Deploy --- a single, sharp week. Data freeze, final migration, cutover runbook, technical validation: all clean. Driss El Amrani sends the go-live confirmation across all three sites, timed against M8 (Communications)'s saturation detection. Hypercare activates on Day 1. Lewin is marked "Change → Refreeze (provisional)," not Refreeze --- **Exception E3 (Two-Clock Problem at Deploy) is, by design, already active** the moment this month begins, and stays active through Month 12.

**Month 12 (W44--47).** Hypercare in full swing. A configuration defect in Kenitra's inventory-matching logic causes a visible stock-count error in front of a cohort that had just started to trust the new system --- **Exception E4 (Sentiment Regression During Hypercare) opens**, isolated to Kenitra. The defect is fixed and communicated within the week; the Kenitra plant supervisor acknowledges the setback directly with the team; a targeted re-pulse at the 1--2 week mark confirms recovery. The broader 2- and 4-week Bridges/Kübler-Ross re-pulse required to resolve **E3 (Two-Clock Problem at Deploy)** also runs this month.

**Month 13 (W48--52).** Hypercare closes: the re-pulse confirms Bridges has genuinely moved to New Beginning and Kübler-Ross reads Exploration or better across all three sites --- **E3 (Two-Clock Problem at Deploy) closes**, Lewin's provisional Refreeze is confirmed rather than walked back. Sustain opens. New-process metrics are embedded into performance management with HR's support; the first 30-day checkpoint runs clean.

**Month 14 (W53--64).** The 60-day checkpoint runs clean. At the 90-day mark, Reinforcement stalls below 3 for the first time --- not a crisis, but exactly the pattern **Exception E5 (Reinforcement Gap at Sustain)** exists to catch before the program closes on schedule regardless. Driss El Amrani flags it explicitly; the CFO re-authorizes a further checkpoint cadence; the champion network is re-chartered specifically for reinforcement. Two further consecutive healthy checkpoints follow. **E5 (Reinforcement Gap at Sustain) closes.** Refreeze is called from that evidence, the Bouregreg ERP Adoption Program's sign-off is recorded on M12 (Sustainment), and ongoing ownership passes to the business-as-usual process owner --- the same close Part 1B.3's Phase 8 describes, now with the full story of how the program actually got there.

<a id="p1b-7"></a>

### 1B.7 CM Charters Across the Program --- Create, Read, Update, Delete

M19 (CM Charters) holds journi's 8 signed, trackable behavioral standards --- not prose guidance, but named actions with an owner role, a governing macro process, and a per-project compliance log. This subsection tracks all 8 charters' full CRUD lifecycle --- create, review, update, and (where it happens) delete --- against Bouregreg's actual 64-week program, phase by phase, rather than describing the CRUD mechanism in the abstract the way Part 2's M19 entry does.

**The 8 charters, their owners, and their governing macro process:**

| Charter | Owner Role | Governs | Created In |
|---|---|---|---|
| CHTR-01 (Sponsorship / Leadership Charter) | Executive Sponsor | MP-02 (Sponsorship & Governance Management) | Phase 1, Week 1 |
| CHTR-04 (Organizational Impact Charter) | Change Manager | MP-01 (Change Impact & Stakeholder Assessment) | Phase 1, Week 6 |
| CHTR-08 (Pulse / Interview Charter) | Change Manager | MP-07 (Readiness Diagnostics & Signal Capture) | Phase 1, Week 8 |
| CHTR-03 (Communication Charter) | Change Manager | MP-03 (Communication & Awareness Management) | Phase 2, Week 9 |
| CHTR-02 (Participative Management Charter) | Frontline Supervisor | MP-04 (Resistance & Barrier Management) | Phase 3, Week 16 |
| CHTR-06 (One-to-One Coaching Charter) | Change Manager | MP-08 (Divergence & Risk Detection) | Phase 4, Week 34 |
| CHTR-07 (Mentoring Charter) | Training Lead | MP-05 (Training & Capability Enablement) | Phase 5, Week 30 |
| CHTR-05 (Team Coaching Charter) | People Manager | MP-09 (Hypercare & Floor Coaching Support) | Phase 7, Week 46 |

**Charter × Task/Step cross-reference, all eight phases.** Every charter action below is cross-referenced to the Master WBS & Gantt table's Task/Step ID (1B.3) --- the same ID scheme, so a reader can trace a charter's compliance action back to the exact PM/CM step it rides alongside.

| Charter | Phase | Week(s) | Task/Step ID | CRUD Action |
|---|---|---|---|---|
| CHTR-01 (Sponsorship / Leadership) | P1 | W1 | Pre-P1-T1 (program kickoff) | Create |
| CHTR-04 (Organizational Impact) | P1 | W6 | P1-T3-S1 | Create |
| CHTR-04 (Organizational Impact) | P1 | W6 | P1-T3-S1 | Delete (duplicate draft, Draft status) |
| CHTR-08 (Pulse / Interview) | P1 | W8 | P1-T4-S1 | Create |
| CHTR-01 (Sponsorship / Leadership) | P1 | W7 | P1-T4-S1 | Read (phase-gate review) |
| CHTR-03 (Communication) | P2 | W9 | P2-T2-S1 | Create |
| CHTR-01 (Sponsorship / Leadership) | P2 | W9 | P2-T2-S1 | Read (compliance log) |
| CHTR-08 (Pulse / Interview) | P2 | W11 | P2-T3-S1 | Read (compliance log) |
| CHTR-02 (Participative Management) | P3 | W16 | P3-T2-S1 | Create |
| CHTR-02 (Participative Management) | P3 | W16--17 | P3-T2-S1, P3-T2-S2 | Read (compliance log) |
| CHTR-01 (Sponsorship / Leadership) | P3 | W22 | E1 Recovery Task 4 (1B.4) | Read (compliance log) |
| CHTR-01 (Sponsorship / Leadership) | P3 | W29--30 | P3-T4-S2 | Read (phase-gate review) |
| CHTR-06 (One-to-One Coaching) | P4 | W34 | P4-T4-S1 | Create |
| CHTR-06 (One-to-One Coaching) | P4 | W35 | P4-T4-S2 | Read (compliance log) |
| CHTR-07 (Mentoring) | P5 | W30 | P5-T1-S1 | Create |
| CHTR-07 (Mentoring) | P5 | W31--33 | P5-T1-S2 | Read (compliance log) |
| CHTR-01 (Sponsorship / Leadership) | P5 | W42 | P5-T4-S2 | Read (phase-gate review) |
| CHTR-01 (Sponsorship / Leadership) | P6 | D4 | P6-T3-S1 | Read (compliance log) |
| CHTR-03 (Communication) | P6 | D4 | P6-T3-S1 | Read (compliance log) |
| CHTR-05 (Team Coaching) | P7 | W46 | Within P7-T3 (E4 recovery window) | Create |
| CHTR-01 (Sponsorship / Leadership) | P7 | W50 | P7-T4-S2 | Read (phase-gate review) |
| CHTR-08 (Pulse / Interview) | P8 | W58 | E5 Recovery Task 2 (1B.4) | Update (v1.0 → v1.1) |
| All 8 charters | P8 | W51--64 | P8-T4-S1, P8-T4-S2 | Update (closing Steering Committee review) |

**Phase-by-phase CRUD detail:**

**Phase 1 --- Discovery.** *Create.* Week 1: Meryem Sabri creates CHTR-01 (Sponsorship / Leadership Charter) on M19 (CM Charters) at kickoff, co-signed by the CFO --- type in: Owner "Executive Sponsor"; RACSI R=CM, A=ES, C=PM/FPO, I=SUP/EU; Status "Active"; Effective Date "Week 1"; Review Frequency "Per Phase Gate." Week 6: create CHTR-04 (Organizational Impact Charter) alongside the Stakeholder Map, owned by the Change Manager. *Delete (administrative correction).* Also Week 6: Meryem Sabri accidentally saves a duplicate draft of CHTR-04 while the Stakeholder Map is being populated; because the duplicate is still in Draft status, she deletes it immediately --- a real example of M19 (CM Charters)'s delete rule (only non-Active charters can be deleted) operating exactly as designed. Week 8: create CHTR-08 (Pulse / Interview Charter), owned by the Change Manager, ahead of Phase 2's baseline pulse.

**Phase 2 --- Design.** *Create.* Week 9: create CHTR-03 (Communication Charter), owned by the Change Manager, alongside the kickoff town hall. *Read / compliance log.* Week 9: log a compliance action against CHTR-01 --- type in: "CFO delivered kickoff town hall in person at all three sites, 9 [date]. Compliant with Sponsorship Charter standard 1 (visible, active sponsorship)." Week 11: log a compliance action against CHTR-08 --- type in: "Baseline ADKAR pulse run per cohort, 11 [date]. Compliant with Pulse/Interview Charter standard 1 (evidence-based, not assumed, readings)."

**Phase 3 --- Build.** *Create.* Week 16: create CHTR-02 (Participative Management Charter), owned by the Frontline Supervisor role, alongside the champion briefing. *Update / compliance log.* Week 22: log a compliance action against CHTR-01 during Exception E1 (Desire Stall at Settat) --- type in: "CFO delivered the staffing commitment to the Settat cohort in person, 22 [date]. Compliant with Sponsorship Charter standard 3 (direct engagement with an affected cohort during a readiness stall)." Week 16--17: log a compliance action against CHTR-02 --- type in: "Champion briefing held per site; each champion's observation-logging path confirmed. Compliant with Participative Management Charter standard 1 (structured frontline listening channel)." Week 29--30: review CHTR-01 at the Phase 3 gate (per its "Per Phase Gate" review frequency) --- no change to its terms, review noted in the compliance log.

**Phase 4 --- Test.** *Create.* Week 34: create CHTR-06 (One-to-One Coaching Charter), owned by the Change Manager, at the exact moment Exception E2 (Divergence Pattern at UAT) opens. *Read / compliance log.* Week 35: log a compliance action against CHTR-06 --- type in: "Loss-focused 1:1 held with the flagged Casablanca Finance UAT participant, 35 [date]. Compliant with One-to-One Coaching Charter standard 2 (address the emotional gap directly, not a skills refresher)."

**Phase 5 --- Train.** *Create.* Week 30 (overlapping Build): create CHTR-07 (Mentoring Charter), owned by the Training Lead, at the start of role-based training delivery. *Read / compliance log.* Week 31--33: log a compliance action against CHTR-07 for each training wave --- type in: "Casablanca Finance training wave 1 delivered per Mentoring Charter's Trainee → Observer → Autonomous progression, 31 [date]." Week 42: review CHTR-01 at the Phase 5 gate.

**Phase 6 --- Deploy.** *Read / compliance log.* Day 4: log a compliance action against CHTR-01 and CHTR-03 jointly --- type in: "Go-live confirmation sent to all three sites, Day 4. Compliant with Sponsorship Charter standard 1 and Communication Charter standard 2 (saturation-aware, single-message timing)."

**Phase 7 --- Hypercare.** *Create.* Week 46: create CHTR-05 (Team Coaching Charter), owned by the People Manager role, at the exact moment Exception E4 (Sentiment Regression During Hypercare) is resolved --- the Kenitra supervisor's team huddle is the charter's first compliance action, logged the same week: "Team huddle held, Defect #31 fix explained. Compliant with Team Coaching Charter standard 1 (direct acknowledgment of a setback with the affected team)." Week 50: review CHTR-01 at the Phase 7 gate.

**Phase 8 --- Sustain.** *Update.* Week 51--64: all 8 charters reviewed for the program's closing Steering Committee readout; CHTR-08 (Pulse / Interview Charter) is updated from v1.0 to v1.1 --- type in the version-history note: "v1.1, 58 [date]: added a mandatory 90-day-mark readiness pulse to the standard cadence, following the Week 56 Reinforcement Gap (Exception E5)." No charter is deleted at program close --- all 8 remain Active, carried forward as the starting governance baseline for the next Bouregreg CM Project in Part 4's scenario library.

**What this demonstrates.** Across the program, every one of M19 (CM Charters)'s CRUD operations is exercised on real, dated program events, not as an abstract capability: 8 Create actions (one per charter), roughly two dozen Read/compliance-log actions tied to specific weeks and exceptions, at least 5 Update/review actions at Phase Gates, a version Update at Week 58, and one Delete of a mistaken duplicate at Week 6 --- the only kind of delete M19 (CM Charters)'s own rule (Active charters cannot be deleted, only Draft or Retired ones) actually permits.

---

<a id="p1b-8"></a>

### 1B.8 Phase Checklists --- All Eight ERP Phases

M17 (WBS & Gantt)'s Phase Checklist is a real feature, distinct from WBS tasks --- PM-track and CM-track items, each with a weight percentage, feeding the Phase Gate's checklist-completion figure (Part 2, M17). The table below is a complete, ready-to-enter checklist for all eight of Bouregreg's ERP phases, weights summing to 100% per phase, so a reader can load these directly rather than inventing items from scratch.

| Phase | Track | Checklist Item | Weight % |
|---|---|---|---|
| P1 --- Discovery | PM | Business case approved by Steering Committee, cost quantified against named workarounds | 40 |
| P1 --- Discovery | PM | Stakeholder Map complete, all cohorts scored (severity finalized) | 30 |
| P1 --- Discovery | CM | Lewin baseline (Unfreeze) logged on M3 with written justification | 30 |
| P2 --- Design | PM | Design principles signed off by Steering Committee | 35 |
| P2 --- Design | PM | Future-state process maps complete, each mapped to a justifying principle | 35 |
| P2 --- Design | CM | Baseline Awareness pulse logged for every cohort | 30 |
| P3 --- Build | PM | All 5 configuration sprints closed | 40 |
| P3 --- Build | PM | Every sprint decision traced to a justifying design principle on M17 | 20 |
| P3 --- Build | CM | Champion network briefed; observation-logging path confirmed per champion | 20 |
| P3 --- Build | CM | Lewin = Change logged on M3 with evidence-based justification | 20 |
| P4 --- Test | PM | SIT sign-off recorded, no open Critical or High defect | 35 |
| P4 --- Test | PM | UAT roster confirmed, proportionate to each site's population | 25 |
| P4 --- Test | CM | Divergence Pattern review complete, no open ALT-001 flag | 40 |
| P5 --- Train | CM | All cohorts enrolled against role-based curriculum on M9 | 25 |
| P5 --- Train | CM | Training wave 1 delivered, all three sites | 25 |
| P5 --- Train | CM | Cohort-level go/no-go confirmed on M14 (Analytics) | 30 |
| P5 --- Train | PM | Sandbox environment open; supervised-practice hours logged | 20 |
| P6 --- Deploy | PM | Data freeze executed, all sites confirmed | 20 |
| P6 --- Deploy | PM | Final migration reconciled, 0 discrepancies | 25 |
| P6 --- Deploy | PM | Cutover runbook executed; technical validation recorded Go | 25 |
| P6 --- Deploy | CM | Go-live communication sent, checked against M8's saturation detector | 30 |
| P7 --- Hypercare | CM | Elevated support desk staffed; escalation path published to every site | 20 |
| P7 --- Hypercare | PM | Adoption dashboard reviewed daily; go-live defects triaged | 25 |
| P7 --- Hypercare | CM | Bridges/Kübler-Ross re-pulse complete at the 2- and 4-week marks | 30 |
| P7 --- Hypercare | CM | No open Divergence Pattern or regression-risk flag remains | 25 |
| P8 --- Sustain | CM | New-process metrics agreed with HR and live in the review cycle | 20 |
| P8 --- Sustain | CM | Legacy-system access revoked, 0 active sessions confirmed | 20 |
| P8 --- Sustain | CM | 90-day checkpoint healthy (Reinforcement score ≥ 3.0) | 30 |
| P8 --- Sustain | CM | Refreeze logged (confirmed) on M3; Sustainment sign-off toggled on M12 | 30 |

---

<a id="part-2"></a>

## Part 2 --- Module-by-Module Feature Tour

Each entry below covers one module: its purpose (in journi's own words), how it plays out in the Bouregreg ERP Adoption Program, what a user can create, update, or delete on the page, and who is allowed to do it. General write access --- the ability to log data on most day-to-day Change Management modules --- belongs to five roles: Super Admin, Group Admin, Org Admin, Change Manager, People Manager, and Practitioner/Contributor. Sponsor, Executive, and Employee accounts are read-only on those same modules by default, seeing dashboards and their own assigned items rather than editing scores. Two roles carry a narrower additional restriction worth stating plainly: Practitioner/Contributor can log data but, unlike the other five, is not one of the roles with individual-level visibility --- on modules with named-person detail, a Practitioner sees aggregated cohort views rather than individual scores.

### M1 --- Hierarchy

**Purpose:** Group → Organization → Projects, with every Change Management Project carrying an optional link to zero, one, or more Main Projects.

**In the Bouregreg scenario:** this is the screen Part 1 used to build Bouregreg Group → Bouregreg Manufacturing Maroc → ERP Platform Unification (Main Project) → Bouregreg ERP Adoption Program (CM Project). As Part 4 adds further CM Projects, they all appear as additional cards under the same Organization.

**Create / update / delete:** create and delete Groups; create, edit (including the default-language selector), and delete Organizations; create and delete Main Projects and CM Projects, including editing which Main Projects a CM Project links to.

**Who can edit:** gated to whoever holds hierarchy-management rights on the Permission Matrix --- by default Super Admin, Group Admin, and Org Admin.

**Key fields:** Group name; Organization name, sector, employee count, sites, languages, default language; Main Project name/type/scope/duration/budget band/executive sponsor; CM Project name/linked Main Projects/owner/change type/target population/business driver.

### M2 --- Identity & RBAC

**Purpose:** role-based access control scoped to Group / Organization / Project, with four tabs: Users & Scope, Permission Matrix, Governance Settings, and License & Plan.

**In the Bouregreg scenario:** this is where Zineb Alaoui (Super Admin) built out Bouregreg Group's team in Part 1, and where Anas Bouzid (Group Admin) or Meryem Sabri (Org Admin) approve any employee who self-registers rather than being added directly.

**Create / update / delete:** create, edit, and remove user accounts (Users & Scope); toggle any role/capability cell (Permission Matrix, Super Admin only); toggle the justification requirement (Governance Settings); upload a new `.lic` file or revert to SaaS mode (License & Plan, Super Admin only).

**Who can edit:** Users & Scope is gated to whoever holds user-management rights (by default Super Admin, Group Admin, Org Admin); the Permission Matrix and License & Plan tabs are Super-Admin-only regardless of the matrix's own settings, since a role should not be able to grant itself more power through the very table that limits it.

**Key fields:** User name, email, role, scope type, scope ID, language; Permission Matrix role × capability checkboxes; Governance justification toggle; License companyName, plan, maxUsers, issueDate, expiryDate, features.

### M3 --- Initiative Registry

**Purpose:** the system of record for every change initiative --- business driver, scope, target population, and Lewin macro-state.

**In the Bouregreg scenario:** the Bouregreg ERP Adoption Program's project detail page. Its Lewin phase opened at **Unfreeze** in Part 1 and is the single field the guide's later Parts watch move through Change and toward Refreeze.

**Create / update / delete:** edit the project's business driver, scope, target population, and Lewin macro-state; the project record itself is created and deleted from M1.

**Who can edit:** general write access; a Lewin phase change is a scored/state change, so under Bouregreg Group's Governance Setting (Part 1, Step 5) it requires a written justification, logged to the project's audit trail.

**Key fields:** Business driver; scope; target population; Lewin macro-state.

### M4 --- Stakeholder Mapping

**Purpose:** who is affected, how heavily, and in what dimension --- impact scores drive tracking depth.

**In the Bouregreg scenario:** Meryem Sabri's team maps all three sites' functional groups (Order Management, Inventory, Finance, Plant Operations at Kenitra and Settat) against impact dimension and severity, so the Casablanca finance team --- losing the most manual workarounds --- gets flagged for the deepest tracking.

**Create / update / delete:** add, edit, and remove stakeholder/cohort entries, each with a name, dimension, impact severity, and site/department.

**Who can edit:** general write access; individual-level detail is visible only to the roles with individual visibility (Super Admin, Group Admin, Org Admin, Change Manager, People Manager) --- a Practitioner sees the aggregated map.

**Key fields:** Cohort name; impact dimension; impact severity; site/department.

### M5 --- ADKAR Engine

**Purpose:** score cohorts across the five ADKAR blocks --- Awareness, Desire, Knowledge, Ability, Reinforcement --- with barrier-point diagnosis.

**In the Bouregreg scenario:** Driss El Amrani logs the Bouregreg program's baseline ADKAR pulse here in Week 1 (Part 1's Step 6), then re-scores each block through Parts 3 and 4 as training and go-live proceed.

**Create / update / delete:** set or update each block's 1--5 score and its note; any score of 2 or below requires a barrier-reason note and auto-escalates.

**Who can edit:** general write access, with a mandatory justification on every score change under Bouregreg Group's Governance Setting.

**Key fields:** Five block scores (1--5): Awareness, Desire, Knowledge, Ability, Reinforcement; a barrier-reason note on any score ≤ 2.

### M6 --- Emotional & Transition Layer

**Purpose:** Bridges transition position and Kübler-Ross sentiment, cross-referenced with ADKAR.

**In the Bouregreg scenario:** this is where Bouregreg's Divergence Pattern alert (Part 5) actually gets its second input --- if Knowledge and Ability read high here on M5 while Bridges is still logged as "Ending" on M6, the two modules together are what the alert is watching.

**Create / update / delete:** set or update the Bridges transition stage and the Kübler-Ross sentiment reading, each with a justification note.

**Who can edit:** general write access, individual-level detail restricted the same way as M4 and M5.

**Key fields:** Bridges stage (Ending / Neutral Zone / New Beginning); Kübler-Ross sentiment (Denial / Resistance-Anger / Exploration / Commitment); justification note.

### M7 --- Sponsor & Coalition

**Purpose:** sponsor roadmap, active-versus-passive sponsorship, and guiding coalition strength.

**In the Bouregreg scenario:** tracks the CFO's (Sponsor) visible actions across the program --- the kickoff town hall, the go-live message, the closing town hall --- and whether the Steering Committee coalition around the CFO is holding or thinning as the program proceeds.

**Create / update / delete:** add sponsor actions to the roadmap and mark each one done; edit sponsorship visibility (active/passive) and coalition-strength notes.

**Who can edit:** general write access for logging and marking actions; the Sponsor role itself can typically mark their own roadmap actions done without needing full write access, since that toggle is a narrower capability than editing every field on the page.

**Key fields:** Sponsor roadmap action and due date; visibility rating (active/weak); coalition member name and role.

### M8 --- Communications

**Purpose:** a message × audience × channel × timing matrix, with saturation detection.

**In the Bouregreg scenario:** every town hall, FAQ update, and go-live announcement across Casablanca, Kenitra, and Settat is logged here; if the same audience is receiving too many messages in too short a window, journi's saturation detection flags it.

**Create / update / delete:** add a new communication (message, audience, channel, timing); delete an existing one. There is no inline "reschedule" on an existing entry --- a superseding communication is logged as a new entry, consistent with the audit trail this module is built to support.

**Who can edit:** general write access.

**Key fields:** Message text; audience/cohort; channel; timing; status (queued/sent).

### M9 --- Training

**Purpose:** curriculum coverage, completion, and demonstrated capability --- trained versus capable.

**In the Bouregreg scenario:** the curriculum built for Casablanca finance, Kenitra plant operations, and Settat plant operations, each entry tracked from enrollment through the Certified toggle once a cohort demonstrates real capability, not just attendance.

**Create / update / delete:** add a new curriculum entry; toggle Certified on an existing one; delete an entry. Completion percentage is not editable in place on an existing row --- as with Communications, a new entry supersedes rather than silently overwrites.

**Who can edit:** general write access.

**Key fields:** Curriculum entry name; cohort; completion percentage; Certified toggle.

### M10 --- Resistance

**Purpose:** log, classify, and resolve resistance, linked to concrete mitigation actions --- with a Qualitative Coding Workbench for tagging interview and free-text evidence.

**In the Bouregreg scenario:** where the Settat plant's early resistance to the new inventory workflow is logged, classified by root cause, and linked to the mitigation actions Houda Zerouali and the plant supervisors run in response; the Coding Workbench is where Ghita Bennis tags supervisor 1:1 notes against a shared codebook so recurring themes surface across entries rather than staying anecdotal.

**Create / update / delete:** log, edit, and resolve resistance entries with linked mitigation actions; add and remove codes from the Organization's codebook; tag and untag evidence against those codes.

**Who can edit:** general write access; the Codebook itself (the set of codes available to tag against) is typically managed by whoever holds hierarchy-management rights, since it is shared across every project in the Organization, not owned by one CM Project.

**Key fields:** Resistance entry description; root cause; status (open/closed); linked mitigation action; Codebook code name; tagged evidence (interview note, free-text source).

### M11 --- Manager as Coach

**Purpose:** a team-scoped ADKAR heatmap with suggested coaching actions per barrier.

**In the Bouregreg scenario:** Kenitra and Settat plant supervisors --- People Manager role --- open this to see their own team's ADKAR heatmap (not the whole program's) and a suggested coaching action for whichever block is weakest, without needing to interpret raw scores themselves.

**Create / update / delete:** the heatmap itself is computed from M5/M6 data already logged elsewhere; a People Manager logs their own coaching actions taken against the suggestions shown.

**Who can edit:** People Managers see their own team's view by default; Change Manager and above see across teams.

**Key fields:** (Computed heatmap, not a data-entry field); logged coaching action per barrier.

### M12 --- Sustainment

**Purpose:** post-go-live adoption audits, regression detection, and sustainment sign-off.

**In the Bouregreg scenario:** the module Driss El Amrani uses from go-live onward --- checkpoint reviews at 30/60/90 days, logged quick wins, a running lessons-learned log, and the formal sign-off that closes the program once evidence, not the calendar, supports it.

**Create / update / delete:** log and update sustainment checkpoints; add quick wins; add and edit lessons-learned entries; toggle the sign-off once criteria are met.

**Who can edit:** general write access; sign-off is typically reserved for the Change Manager and above.

**Key fields:** Checkpoint label and date; status (planned/complete); regression-risk flag (low/high); quick-win entry; lesson-learned entry; sign-off toggle.

### M13 --- Risk Register

**Purpose:** adoption, sponsorship, capacity, and saturation risk --- distinct from generic project risk, which lives in the Main Project's own PM tooling, not in journi.

**In the Bouregreg scenario:** tracks Change-Management-specific risks --- for example, Kenitra's plant-floor capacity to absorb training during peak production weeks --- separately from the ERP Platform Unification Main Project's technical and schedule risk.

**Create / update / delete:** add, edit, and close risk entries, each with a category, severity, and status.

**Who can edit:** general write access.

**Key fields:** Risk description; category; severity; status (open/closed).

### M14 --- Analytics

**Purpose:** the Composite Readiness Index, adoption curves, and correlation analysis --- journi's benchmarking dashboard.

**In the Bouregreg scenario:** the dashboard the Steering Committee reviews at every phase gate --- the blended readiness score (ADKAR 50%, Kübler-Ross sentiment 25%, training completion 25%) trending against the benchmark band expected at that point in the program, and the correlation view showing which input is actually driving the trend.

**Create / update / delete:** this module is entirely computed --- there is nothing to create, update, or delete here; it reads live from M5, M6, and M9.

**Who can edit:** read access follows each role's normal visibility; there is no write capability on this module.

**Key fields:** (Computed) Composite Readiness Index; adoption curve; correlation view --- no direct data entry.

### M15 --- Journey Map

**Purpose:** a literal, visual timeline combining ADKAR stage, Bridges phase, and sentiment.

**In the Bouregreg scenario:** the single visual a Steering Committee member glances at to see, at a point in time, where the Bouregreg program actually sits across all three readings at once, rather than checking three separate modules.

**Create / update / delete:** computed from M5/M6 data already logged; nothing is created or edited directly on this page.

**Who can edit:** read-only, following each role's normal visibility.

**Key fields:** (Computed) combined ADKAR/Bridges/sentiment timeline --- no direct data entry.

### M16 --- AI Use Case Library

**Purpose:** a governed catalog of Assistive and Augmented AI use cases. No use case acts autonomously.

**In the Bouregreg scenario:** Meryem Sabri activates the specific AI-assisted use cases Bouregreg Group's contract permits (for example, drafting a first pass of a communication or summarizing coded resistance themes) at the Organization level; a Change Manager can further restrict which of those activated use cases their own project actually uses. When Bouregreg's practice matures, Driss El Amrani edits a Use Case's trigger/output/human-checkpoint wording directly rather than waiting on a platform release --- and if an edit turns out wrong, reverts it from the version history without losing the original definition.

**Create / update / delete:** full CRUD on the Use Case catalog itself --- create a new Use Case, edit any field, or delete one --- each edit versioned, with a version-history panel per Use Case and a "revert to this version" action against any prior version, including the original (version 1). Separately, and unchanged from before: the activation toggle per Organization, the override toggle per Project, and the usage log every actual AI call writes to.

**Who can edit:** catalog CRUD (create/edit/delete/revert) is gated to whoever holds Use-Case-management rights on the Permission Matrix --- by default Super Admin, Group Admin, Org Admin, and Change Manager. Activation stays gated to Org-Admin-and-above; project-level overrides to the Change Manager on that project.

**Key fields:** Use case name, tier (Assistive/Augmented), module, description, trigger, output, human checkpoint; version number and version history (each entry: version, note, timestamp, full prior snapshot); Use-case activation toggle (per Organization); override toggle (per Project); usage-log entry.

### M17 --- WBS & Gantt

**Purpose:** one Work Breakdown Structure spanning Project Management, Change Management, and the Lewin/Prosci/Bridges/ADKAR framework milestones --- baseline versus actual dates, with the schedule gap called out task by task.

**In the Bouregreg scenario:** Driss El Amrani loads TPL-ERP-8 at kickoff to seed the 64-week program's baseline schedule, then keeps actual dates and status current against it as Parts 3 and 4 of this guide play out --- so a reader can see, task by task, where the real program has drifted from plan. Phase Checklists (1B.8) and Phase Gates carry the per-phase completion and sign-off record; when Bouregreg later needs a template variant TPL-ERP-8 doesn't cover, Driss edits the template library itself rather than working around it, with the same version-history/revert safety net as M16.

**Create / update / delete:** load a phase template to seed the WBS; edit individual task dates and status against the loaded baseline; log and edit Phase Checklist items (phase, track, item, weight %, done) that feed the Phase Gate's checklist-completion figure; Phase Gates are the joint PM/CM sign-off record attached to each phase boundary. Separately, full CRUD on the Phase Template library itself --- create a new template, edit an existing one's name/transformation-type/phase list, or delete one --- each edit versioned with the same version-history/revert-to-any-prior-version panel as M16's AI Use Cases.

**Who can edit:** general write access for WBS tasks, Phase Checklists, and Phase Gates. Phase Template CRUD (create/edit/delete/revert on the shared template library) is gated to whoever holds Template-management rights on the Permission Matrix --- by default Super Admin, Group Admin, Org Admin, and Change Manager.

**Key fields:** Task name; track (PM/CM/framework); baseline start/end date; actual start/end date; status; Phase Gate Joint Decision (Go / Go with Conditions / No-Go).

### M18 --- Process Registry

**Purpose:** the process backbone every module is built on --- the 10 macro processes, the 16 registered end-to-end chains (core lifecycle, cross-cutting loops, and one per transformation type), and who is Responsible / Accountable / Consulted / Sign-off / Informed for each.

**In the Bouregreg scenario:** the reference Part 3 of this guide walks in full --- every one of the 16 processes, read here and then exercised against Bouregreg's live data elsewhere in journi.

**Create / update / delete:** the Macro Process and End-to-End Process catalogs are fixed reference content, shared platform-wide and not editable per tenant. The RACSI grid --- who holds each of the five roles for each macro process --- is editable cell by cell.

**Who can edit:** RACSI grid edits are gated to whoever holds that capability on the Permission Matrix, by default Org-Admin-and-above; the process catalogs themselves are read-only for every role.

**Key fields:** RACSI grid cell (role × macro process); Macro Process and End-to-End Process catalogs (read-only reference).

### M19 --- CM Charters

**Purpose:** the 8 signed, trackable behavioral standards governing sponsorship, frontline engagement, communication, impact assessment, coaching and mentoring, and pulse/interview diagnostics --- with concrete action mapping and a per-project compliance log, so charter governance is trackable, not just aspirational.

**In the Bouregreg scenario:** the CFO's Sponsor Charter is signed at kickoff and its compliance log tracks whether the CFO's actual visible behavior (from M7) matches what was signed up to; new or revised Charters can be drafted here as Bouregreg Group's own governance model matures.

**Create / update / delete:** full Charter CRUD --- create a new Charter, edit an existing one (including its RACSI, status, and review frequency), and delete one, though a Charter must be moved out of Active status (to Draft or Retired) before it can be deleted. Separately, log compliance actions against a Charter's action mapping and delete individual log entries.

**Who can edit:** Charter create/edit is gated to whoever holds Charter-management rights on the Permission Matrix; delete is further restricted to Org-Admin-and-above, matching the sensitivity of removing a governance record outright.

**Key fields:** Charter name; category; RACSI (R/A/C/S/I); status (Active/Draft/Retired); version; effective date; review frequency; compliance-log entry.

### M20 --- Journeys & Analytics

**Purpose:** the experience-layer companion to the score-centric dashboards elsewhere in journi --- 8 persona/exception/system journeys, their concrete touchpoints with success criteria and evidence, 5 journey analytics dashboards, and a project-context overlay distinguishing each case from the generic template.

**In the Bouregreg scenario:** where a reader sees the End User's actual journey through the ERP rollout --- not as a score, but as a sequence of concrete touchpoints (first town hall, first login, first live transaction, first month using the new system unsupervised) each with its own success criteria and logged evidence, overlaid with Bouregreg's real project context rather than the generic template.

**Create / update / delete:** log evidence and mark success criteria met against a journey's touchpoints for the current project; the 8 journey templates themselves are shared reference content.

**Who can edit:** general write access for logging evidence; the underlying journey templates are read-only for every role.

**Key fields:** Journey touchpoint; success criterion; logged evidence.

### M21 --- Field Notes

**Purpose:** a lightweight, freeform log for the knowledge that Part 1B's week-by-week tables keep surfacing but no structured module has a field for yet --- a workshop happened, a decision was made outside journi, a sign-off landed, a nominee list was drafted. Not a substitute for the structured modules: once something becomes a real record there (a Stakeholder Map entry, an ADKAR score, a Communication), it belongs there instead. Field Notes is for the moments in between, so that knowledge doesn't just get lost between the meeting where it happened and the module entry it eventually becomes.

**In the Bouregreg scenario:** every week in Part 1B's timeline that previously had nowhere to record a piece of knowledge now logs an M21 (Field Notes) entry instead --- Discovery Workshop 1 at Casablanca HQ (Week 2), the design-principles workshop (Week 6), the Steering Committee sign-off on principles and future-state maps (Week 8), the champion nominee list before roster confirmation (Week 13), twenty more across the 64-week program, and even the deliberately-quiet weeks (a hold, a wait-and-confirm) get a one-line Field Note saying so, rather than an empty cell. The one week that stays genuinely without a Field Note is Week 22, and the guide says exactly why: the CFO's staffing-commitment action is already a real record on M7 (Sponsor & Coalition), so a second entry would just duplicate it. Even Week 35's confidential 1:1 gets a Field Note --- one that records that the session happened without recording what was actually said, since the conversation itself stays private while its outcome (the Bridges re-score) becomes a real M6 record the following week. Driss El Amrani and Meryem Sabri use Field Notes as their running field journal for everything else.

**Create / update / delete:** full CRUD on a project's Field Notes --- add a note (date, category, optional linked module, author, body text), edit it, or delete it.

**Who can edit:** general write access, matching Part 2's other logging-style modules (M12, M20).

**Key fields:** Date; Category (Workshop / Decision / Sign-Off / Nomination / Handoff / Other); Related Module (optional, M1--M20); Logged By; Note body.

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

**Week reference:** W1--14, spanning Discovery and Design (Part 1B.3, Phases 1--2) --- the same window Part 1B.6's Month 1--3 narrative covers.

#### E2E-02 --- Capability & Divergence Management (Training → Verified Competence)

**Composition:** MP-05 → MP-08 → MP-07 · **Trigger:** curriculum, sandbox, and cohort segmentation confirmed from E2E-01 · **Terminal state:** verified capable and emotionally-ready cohorts; Divergence Pattern log · **RACSI:** R=CM, A=CM, C=FPO/ITL, S=PM/SUP, I=ES/EU

**In the Bouregreg scenario:** the training curriculum built for Casablanca finance, Kenitra plant operations, and Settat plant operations runs through M9 (MP-05); as cohorts show real Knowledge/Ability scores on M5, the Divergence Pattern Detector cross-checks them against the Bridges reading on M6 (MP-08); the result feeds back into the readiness diagnostics on M5/M6/M14 (MP-07). This is the chain a Change Manager runs at UAT time --- the first point a cohort's paper knowledge and their actual emotional readiness can visibly diverge.

**Week reference:** W28--42, spanning Test and Train (Phases 4--5) --- the exact window Exception E2 (Part 1B.4) fires in, Month 8 of Part 1B.6's narrative.

#### E2E-03 --- Resistance-to-Commitment (Barrier Detection → Buy-In)

**Composition:** MP-04 → MP-06 → MP-07 → MP-09 · **Trigger:** a stalled Desire score or negative sentiment pulse is first logged · **Terminal state:** resolved barriers; recovered Desire/sentiment scores; sustained commitment · **RACSI:** R=CM, A=CM, C=ES/SUP, S=PM, I=FPO/EU

**In the Bouregreg scenario:** when Settat's plant floor logs a Desire score of 2 or below on M5, it auto-escalates and is logged as a barrier on M10 (MP-04); the champion network on M4 surfaces the underlying concern (MP-06); the readiness diagnostics on M5/M6 register the drop (MP-07); and Houda Zerouali's floor-coaching response on M11 is what actually moves the score back up (MP-09). This chain is the backbone of Part 4's compliance and cultural scenarios below, where resistance is the central story rather than a side event.

**Week reference:** first opens W18--22 (Build, Phase 3) with Exception E1, and recurs at any later point a Desire or sentiment score stalls --- see also the Order-to-Cash and Settat Restructuring cases in Part 4, both built around this exact chain.

#### E2E-04 --- Adoption-to-Sustainment (Go-Live → Refreeze)

**Composition:** MP-09 → MP-10 → MP-07 · **Trigger:** go-live cutover executed · **Terminal state:** stabilized new-normal performance; embedded reinforcement; confirmed Refreeze; closed project · **RACSI:** R=CM, A=ES, C=PM/FPO, S=SUP, I=ITL/EU

**In the Bouregreg scenario:** from ERP go-live day, hypercare and floor coaching run on M11/M12 (MP-09); reinforcement mechanisms --- recognition, manager check-ins, revoked legacy-system access --- are confirmed active on M12 (MP-10); and the Lewin phase is only called "Refreeze" on M3 once the readiness diagnostics on M14 support it, not on the calendar date (MP-07). This is the same discipline the ERP User Guide's Exception E3 (Two-Clock Problem) and Exception E5 (Reinforcement Gap) protect against.

**Week reference:** W43 through W64, spanning Deploy, Hypercare, and Sustain (Phases 6--8) --- the closing third of Part 1B.6's month-by-month narrative, Months 11 through 14.

### Cross-Cutting Loops (E2E-05 --- E2E-08)

#### E2E-05 --- Signal Aggregation Loop

**Composition:** MP-03 → MP-05 → MP-07 → MP-08 · **Trigger:** new awareness (MP-03) or knowledge/ability (MP-05) signal recorded · **Terminal state:** Composite Readiness Index (MP-07) recalculated and evaluated by the Divergence Pattern Detector (MP-08)

**In the Bouregreg scenario:** this loop is not a separate data-entry screen --- it is the traceable path from a new Communications entry (M8) or Training completion (M9) through to the Composite Readiness Index recalculation on M14 and a fresh Divergence Pattern check on M6. It makes explicit a dependency that already exists in journi's data model: Communications and Training feed ADKAR, and ADKAR feeds the Risk Register.

**Week reference:** continuous, W1 through close --- this loop has no phase of its own because it is the connective tissue running underneath every phase in Part 1B.3.

#### E2E-06 --- PM ↔ CM Governance Bridge

**Composition:** MP-02 → MP-08 · **Trigger:** Main Project schedule slip logged, or a Phase Gate checkpoint reached · **Terminal state:** a Joint Decision Record (Go / Go with Conditions / No-Go), with PM and CM inputs preserved independently and exactly one Accountable role named --- selectable, and may differ from either input's author

**In the Bouregreg scenario:** when the ERP Platform Unification Main Project's technical schedule slips against a Phase Gate on M17, the Joint Decision Record captures both Driss El Amrani's Change Management read and the Main Project's PM read independently, then names one Accountable role for the actual Go/No-Go call --- so a schedule slip never gets silently resolved by whichever discipline happens to write to the record last.

**Week reference:** most active at each phase gate in Part 1B.3 --- W8, W14, W30, W38, W42, W43, W50, and W64 --- since a Phase Gate checkpoint is this loop's most common trigger.

#### E2E-07 --- Champion Early-Warning Loop

**Composition:** MP-06 → MP-04 · **Trigger:** champion floor-level observation logged · **Terminal state:** the observation formalized into a Resistance Log barrier record

**In the Bouregreg scenario:** a Kenitra plant champion notices workaround behavior on the floor before it shows up in any score; logging that observation against the champion network on M4 is what turns it into a formal barrier record on M10 --- the earliest possible point resistance becomes visible to the program, ahead of a score actually moving.

**Week reference:** operational from W12 onward, once Build's Task 2 formally briefs the champion network (Phase 3) --- and the exact mechanism that could have surfaced Exception E1's Settat concern even earlier than the Desire score did.

#### E2E-08 --- Governance Escalation Loop

**Composition:** MP-02 → MP-10 · **Trigger:** a Sponsor escalation action is logged · **Terminal state:** the escalation resolved and reflected in the sustainment sign-off

**In the Bouregreg scenario:** journi's own documentation flags this as its weakest-evidence proposed loop, included for completeness rather than as a distinct workflow --- in practice it is largely covered by the CFO's existing escalation actions on M7 and the sustainment checkpoints on M12, and this guide states that plainly rather than overstate the loop's independence from those two modules.

**Week reference:** no fixed window --- like E2E-05, it runs continuously wherever a Sponsor escalation and a sustainment checkpoint happen to coincide, most plausibly around Exception E5 in Part 1B.6's Month 14.

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

### The Scenario Library at a Glance

| Case | Archetype | Population | Weeks | Alert it exercises |
|---|---|---|---|---|
| Bouregreg ERP Adoption Program | ERP | 3,400 (all sites) | W1--64 | ALT-001, ALT-009 |
| Order-to-Cash Process Redesign | BPR | 140 (Casablanca finance) | W3--52 | ALT-004 |
| Kenitra Invoice-Matching Automation | Automation | 18 (Kenitra AP) | W20--38 | None (clean-close contrast case) |
| ISO 9001/14001 Integrated Management System | QMS | 410 (Settat plant + quality) | W1--52+ | ALT-010 |
| One Bouregreg: Culture Integration | Cultural | 260 + counterparts (Tangier) | W27--58+ | ALT-003 |
| Regional Operating Model Redesign | Operating Model | 95 (people managers, 3 sites) | W35--64 | ALT-002, ALT-015 |
| Loi 09-08 Compliance Program | Compliance | 310 (HR, Sales, CS) | W1--64 | ALT-009 (schedule-critical) |
| Plant Digital Skills Upskilling | Training & Skills | 620 (plant floor, 2 sites) | W16--58 | None (independent of a go-live) |
| Settat Plant Consolidation & Restructuring | Restructuring | 130 (affected line) | W40--64 | ALT-004 |

Read top to bottom, the table also makes a structural point visible at a glance: eight of the nine cases run on a Phase Template with a registered End-to-End lifecycle behind it (Part 3, Appendix A.5); only the last, Restructuring, runs on the generic core chains because no dedicated lifecycle exists for it --- the same gap the case's own write-up below states directly rather than papers over.

### Bouregreg ERP Adoption Program *(archetype: ERP --- E2E-ERP)*

Covered in full in Part 1 (setup) and Part 3 (E2E-01 through E2E-04, and E2E-ERP). Target population: all 3,400 staff across Casablanca, Kenitra, and Settat. Starting Lewin phase: Unfreeze. This is the throughline case, and the one most likely to trigger **ALT-001 (Divergence Pattern Detected)** at UAT if a cohort's Knowledge and Ability scores both reach 4 while Bridges still reads Ending --- and **ALT-009 (Phase Gate No-Go / Conditional)** if a Phase Gate closes as anything other than a clean Go.

### Order-to-Cash Process Redesign *(archetype: BPR --- E2E-BPR)*

Casablanca HQ's finance function has run order-to-cash manually since before the ERP program began; this project redesigns the process itself, independent of any system change. Business driver: three weeks of month-end reconciliation work, self-inflicted by the process design, not the tooling. Target population: Casablanca finance (140 staff). Starting pattern: finance staff who built and privately own today's manual workarounds resist a redesign that makes those workarounds obsolete --- by design, this case is built to cross the resistance-escalation threshold and fire **ALT-004 (Resistance Escalation Threshold Breached)** once three or more open resistance entries accumulate.

**Milestones:** W3 intake and diagnosis opens, running alongside the ERP program's own Discovery; W10 clean-slate design signed off; W18 build complete; W22--26 pilot on a single process step, where the third resistance entry lands and ALT-004 fires; W34 organization-wide rollout; W44 stabilization; W52 sustainment handoff.

### Kenitra Invoice-Matching Automation *(archetype: Automation --- E2E-BPA)*

A narrow, well-scoped robotic process automation project matching supplier invoices against purchase orders at the Kenitra plant. Business driver: a repetitive task with no judgment calls, a strong automation candidate. Target population: Kenitra accounts payable (18 staff). Starting pattern: this is this guide's deliberate low-resistance, fast-moving contrast case --- narrow scope, an already-bought-in team, and a Sponsor who is visibly active from day one. It is designed to close without any of the 9 live alerts firing, which is itself the point: not every Change Management Project needs a recovery playbook, and this guide states that plainly rather than manufacture a crisis where none exists.

**Milestones:** W20 opportunity assessment; W24 architecture design; W29 build; W32 UAT and shadow-mode running the bot alongside the manual process for two weeks; W34 production go-live; W36 exception tuning; W38 CoE handover --- the shortest case in the library, closed in 18 weeks against the ERP program's own Build/Test window.

### ISO 9001/14001 Integrated Management System *(archetype: QMS --- E2E-IMS)*

Settat plant pursues integrated ISO 9001 (quality) and ISO 14001 (environmental) certification on one management system rather than two. Business driver: a customer contract now requires certified quality management; a parallel environmental certification is bundled in for efficiency. Target population: Settat plant operations and quality function (410 staff). Starting pattern: the Quality Manager sponsors the program alone, without a broader guiding coalition behind them --- built to fire **ALT-010 (Guiding Coalition Gap)** once the Sponsor & Coalition record (M7) shows fewer than two named coalition members.

**Milestones:** W1 intake and diagnosis (started alongside the ERP program's own kickoff); W12 design; W26 implementation, where the coalition gap is logged and ALT-010 fires; W38 mock-up audit; W46 certifying audit; W50 surveillance prep; ongoing surveillance beyond W52 --- the longest single-phase tail in the library, since certification surveillance never formally closes.

### One Bouregreg: Post-Acquisition Culture Integration *(archetype: Cultural --- E2E-CULT)*

Six months into the ERP program, Bouregreg Group acquires a smaller regional competitor's Tangier distribution operation. This project is the culture integration that follows --- aligning two distinct ways of working under one set of values, not a system or process change. Business driver: the acquisition's stated synergies depend on the two workforces actually operating as one company within 18 months. Target population: the acquired Tangier team (260 staff) plus their new Bouregreg counterparts. Starting pattern: a newly appointed integration Sponsor has not yet logged any visible activity in the record --- built to fire **ALT-003 (Sponsor Coverage Gap)** in the program's early weeks, before that Sponsor's first town hall is logged.

**Milestones:** W27 (six months into the ERP program) diagnosis opens; W30 target-values design, and ALT-003 fires before the integration Sponsor's first logged action; W38 leadership modeling and reinforcement build begins; W46 pilot cohort (one Tangier team, one legacy Bouregreg team); W58 organization-wide rollout; reinforcement through skepticism and institutionalization continue well past the ERP program's own W60 close, consistent with its 18-month horizon.

### Regional Operating Model Redesign *(archetype: Operating Model --- E2E-OM)*

Realigns reporting lines across all three sites from a site-based structure to a function-based one --- Finance, Operations, and Quality each reporting centrally rather than to a site director. Business driver: the ERP program exposed how much duplicated decision-making the site-based structure was causing. Target population: all people-manager-level staff across the three sites (95 staff). Starting pattern: this case runs past its first 30-day sustainment checkpoint with regression risk logged as high --- built to fire **ALT-002 (Regression Risk Score Critical)** at that checkpoint, and consequently **ALT-015 (Sustainment Sign-Off Blocked)** until the regression is resolved and a clean checkpoint follows.

**Milestones:** W35 current operating model assessment opens, once the ERP program's own Build phase has exposed the duplication; W42 target operating model design; W48 detailed org design; W52 pilot transition (Casablanca Finance first); W56 full transition, where the 30-day checkpoint lands High regression risk and ALT-002/ALT-015 fire; W64 governance adoption tracking and standing rhythm handover, resolved only once a clean checkpoint follows.

### Loi 09-08 Data Protection Compliance Program *(archetype: Compliance --- E2E-COMP)*

Brings Bouregreg Group's customer and employee data handling into compliance with Morocco's Loi n° 09-08 on the protection of personal data, under the national data protection authority's (CNDP) oversight. Business driver: a scheduled CNDP audit with a fixed external deadline, not a discretionary program. Target population: any function touching customer or employee personal data --- HR, Sales, Customer Service (310 staff). This case's SIPOC is fixed by its type: Legal/Compliance is the supplier, the regulator is the customer, a cast this guide names concretely rather than leaves generic. Because its deadline is externally fixed, this is the case in the library where a Phase Gate closing as anything but Go carries the least schedule flexibility --- the practical reason **ALT-009** matters most here even when it does not fire.

**Milestones:** W1 regulatory requirement and gap analysis, run from the very start of the tenant's life given the fixed external deadline; W14 control design; W28 control implementation; W40 internal audit / independent testing; W48 controls go live, timed deliberately ahead of the ERP program's own Deploy week so the two do not compete for the same Legal/Compliance attention; W52 first monitoring cycle; ongoing compliance handover beyond W60.

### Plant Digital Skills Upskilling Program *(archetype: Training & Skills Development --- E2E-TSD)*

A standalone digital-literacy and systems-skills program for plant-floor staff at Kenitra and Settat, run independent of any specific system rollout --- preparing the workforce for the next several years of technology change generally, not one program's go-live. Business driver: a skills gap identified independently of the ERP program, but accelerated once the ERP program made it visible. Target population: plant-floor staff without prior systems training (620 staff). This is the case that most exercises M9 (Training) and M16 (AI Use Case Library, for AI-assisted curriculum drafting) in this guide's library, without a go-live event of its own to anchor to.

**Milestones:** W16 intake and diagnosis; W22 case for change and target-state design; W30 build (curriculum development, AI-assisted drafting via M16); W38 validation with a pilot cohort; W44 deployment across both plants, deliberately staggered a month behind the ERP program's own Train phase so the two curricula don't compete for the same plant-floor hours; W50 stabilization and hypercare; W58 sustainment and closure.

### Settat Plant Consolidation & Workforce Restructuring *(archetype: Restructuring --- no dedicated E2E lifecycle)*

Consolidates two overlapping production lines at the Settat plant into one, with a workforce restructuring as a direct consequence. This case is included deliberately without a dedicated End-to-End lifecycle or Phase Template of its own: Restructuring is one of Main Project's ten available archetypes, but --- unlike ERP, BPR, Automation, QMS, Cultural, Operating Model, Compliance, and Training & Skills --- it is not one of the 8 types the E2E addendum built a registered chain for. It runs on the 4 core chains (E2E-01 through E2E-04) generically instead, and this guide states that gap plainly rather than imply a lifecycle exists where it does not. Business driver: sustained overcapacity on the older of the two lines. Target population: the affected line's 130 staff. Starting pattern: the highest-resistance case in the library by design, expected to cross the resistance threshold early and stay there --- a second, independent source (alongside Order-to-Cash) of **ALT-004** firing in this Organization.

**Milestones:** W40 mobilization (E2E-01, run generically since no dedicated template exists); W44 capability and divergence management as the affected line's staff are assessed for redeployment; W46 resistance crosses the threshold and ALT-004 fires for the second, independent time in the Organization; W50 adoption-to-sustainment begins as the consolidated line stabilizes; W64 ongoing, since a restructuring's emotional tail is realistically the longest in the library relative to its short technical timeline.

### What the portfolio view shows

With nine Change Management Projects now running under one Organization, two alerts become visible that no single project could trigger alone:

- **ALT-008 (Change Saturation Threshold Breached)** fires once a project's population segment is targeted by two or more other concurrent initiatives in the same Organization --- true almost everywhere in this library by design, since the ERP program, the Operating Model redesign, and the Training & Skills program all reach broad, overlapping populations across the same three sites.
- **ALT-011 (Communication Overload Detected)** fires once the combined not-yet-sent communications queued across a population's concurrent initiatives exceed three --- realistic here precisely because nine programs are drafting town halls, FAQs, and go-live messages against overlapping audiences at the same time, which is exactly the condition this alert exists to catch before it reaches an inbox.

Between them, the nine cases above exercise every one of journi's 9 live-computed alerts at least once --- eight through a single project's own data, and the last two only because the portfolio, taken together, is what makes them real. Part 5 covers all 9 in full, plus the 7 reference alerts in journi's D07 catalog that are documented but not live-computed in this build.

This also means Bouregreg Group's Notification Center, viewed from any one project, is genuinely busier than a single-project tenant's would be --- exactly the condition Section 1B.5's weekly-cadence guidance and Section 5.6's cross-reference table exist to help a Change Manager triage rather than be overwhelmed by. A reader working through this guide end to end will notice the same population --- plant-floor staff at Kenitra and Settat, in particular --- named across five or six different cases: the ERP program, the Operating Model redesign, the Training & Skills upskilling program, and potentially the Settat Restructuring case all reach the same people within the same rough window. That overlap is not an oversight in how this library was built; it is the realistic condition ALT-008 and ALT-011 are designed to catch, made visible here rather than left as an abstract rule with no data behind it.

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

### 5.6 Alert-to-Scenario Cross-Reference

Part 4's nine-project library was purpose-built so every live alert has a real, traceable origin in this guide rather than existing only as an abstract rule. This table is the index back to where each one actually fires:

| Alert | Fires in | When (approximate week) |
|---|---|---|
| ALT-001 Divergence Pattern Detected | Bouregreg ERP Adoption Program | W28--38 (Test), Exception E2 |
| ALT-002 Regression Risk Score Critical | Regional Operating Model Redesign | ~W56, first 30-day checkpoint |
| ALT-003 Sponsor Coverage Gap | One Bouregreg: Post-Acquisition Culture Integration | ~W27--30, before the integration Sponsor's first logged action |
| ALT-004 Resistance Escalation Threshold Breached | Order-to-Cash Process Redesign; Settat Plant Consolidation & Workforce Restructuring | W22--26 (Order-to-Cash pilot); W46 (Settat restructuring) |
| ALT-008 Change Saturation Threshold Breached | Portfolio-wide (Part 4, "What the portfolio view shows") | Continuous, once 3+ projects run concurrently |
| ALT-009 Phase Gate No-Go / Conditional | Bouregreg ERP Adoption Program (if triggered); most schedule-sensitive in the Loi 09-08 Compliance Program | Any Phase Gate, Part 1B.3 |
| ALT-010 Guiding Coalition Gap | ISO 9001/14001 Integrated Management System | ~W26, Implementation phase |
| ALT-011 Communication Overload Detected | Portfolio-wide (Part 4, "What the portfolio view shows") | Most acute around W43 (ERP go-live week) |
| ALT-015 Sustainment Sign-Off Blocked | Regional Operating Model Redesign | ~W56, following ALT-002 |

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

### A.4 Module Index (M1--M21)

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
| M21 | Field Notes | Freeform log: category, related module, author, body | CRUD |

### A.5 The 16 End-to-End Processes Index

| ID | Name | Kind | Bouregreg case |
|---|---|---|---|
| E2E-01 | Readiness & Mobilization | Core | ERP Adoption Program, W1--14 |
| E2E-02 | Capability & Divergence Management | Core | ERP Adoption Program, W28--42 |
| E2E-03 | Resistance-to-Commitment | Core | ERP (Exception E1); Order-to-Cash; Settat Restructuring |
| E2E-04 | Adoption-to-Sustainment | Core | ERP Adoption Program, W43--64 |
| E2E-05 | Signal Aggregation Loop | Cross-cutting loop | Continuous, all nine cases |
| E2E-06 | PM ↔ CM Governance Bridge | Cross-cutting loop | Every Phase Gate, Part 1B.3 |
| E2E-07 | Champion Early-Warning Loop | Cross-cutting loop | ERP Adoption Program, W12+ |
| E2E-08 | Governance Escalation Loop | Cross-cutting loop | ERP Adoption Program, Exception E5 |
| E2E-ERP | ERP Implementation Lifecycle | Transformation type | Bouregreg ERP Adoption Program |
| E2E-BPR | Business Process Reengineering Lifecycle | Transformation type | Order-to-Cash Process Redesign |
| E2E-BPA | Business Process Automation Lifecycle | Transformation type | Kenitra Invoice-Matching Automation |
| E2E-IMS | Integrated Management System Lifecycle | Transformation type | ISO 9001/14001 Integrated Management System |
| E2E-CULT | Cultural / Values Transformation Lifecycle | Transformation type | One Bouregreg: Post-Acquisition Culture Integration |
| E2E-OM | Operating Model Redesign Lifecycle | Transformation type | Regional Operating Model Redesign |
| E2E-COMP | Compliance-Driven Change Lifecycle | Transformation type | Loi 09-08 Data Protection Compliance Program |
| E2E-TSD | Training & Skills Development Lifecycle | Transformation type | Plant Digital Skills Upskilling Program |

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

<a id="a7"></a>

### A.7 A Worked RACSI Grid Example (M18)

The RACSI grid on M18 assigns one set of R/A/C/S/I roles per macro process, platform-wide --- editable cell by cell by whoever holds that capability (by default, Org-Admin-and-above). The excerpt below shows how Bouregreg Group's Org Admin, Meryem Sabri, filled in the first five of the ten macro processes after Part 1's tenant setup, before Part 1B's program began:

| Macro Process | R (Responsible) | A (Accountable) | C (Consulted) | S (Support) | I (Informed) |
|---|---|---|---|---|---|
| MP-01 Change Impact & Stakeholder Assessment | PM, FPO | ES | CM | SUP | EU |
| MP-02 Sponsorship & Governance Management | CM | ES | PM | SUP | EU |
| MP-03 Communication & Awareness Management | CM | CM | FPO | SUP | EU, ES |
| MP-04 Resistance & Barrier Management | CM | CM | ES, SUP | PM | FPO, EU |
| MP-05 Training & Capability Enablement | CM, SUP | CM | FPO | PM | ES, EU |

Two things this excerpt is meant to make concrete rather than abstract: first, the Accountable role is not always the Executive Sponsor --- MP-03 through MP-05 name the Change Manager Accountable, since the CFO is Consulted or Informed on communications and training decisions rather than personally accountable for them. Second, the same role can appear in more than one column for the same process only if it is Responsible alongside another Responsible role (M18's own rule, matching A.2) --- Accountable is always exactly one role, with no exception anywhere in this grid.

<a id="a8"></a>

### A.8 Sample journi Entries

The snippets below are the kind of text a Change Manager actually types into journi's justification and note fields --- included here so a first-time user isn't staring at a blank field wondering what "good" looks like.

**A Lewin phase-call justification (M3, Phase 3 --- Build, Part 1B.3):** *"Moving Unfreeze → Change. Configuration sprints 1--4 complete against approved design principles; Desire trending upward across Casablanca and Kenitra (Settat's Desire stall resolved per the Month 5--6 sponsor intervention, see Exception E1 log). Evidence reviewed with Steering Committee 14 [date]; no dissent recorded."*

**An ADKAR barrier-reason note (M5, auto-escalated at Desire = 2, Exception E1):** *"Settat plant-floor cohort, Desire = 2. Listening session (12 [date]) surfaced two themes: (1) low visibility into what the new inventory workflow looks like on Line 2 specifically; (2) unresolved concern about post-go-live staffing levels. Theme 2 confirmed as primary driver. Escalated to CFO for direct response --- see E1 recovery Task 3."*

**A Communications entry (M8, Phase 6 --- Deploy):** *"Go-live confirmation --- all sites. Audience: all 3,400 staff. Channel: email + site noticeboards + supervisor cascade. Timing: Monday W43, 07:00, ahead of first shift. Checked against saturation detection --- no other queued communication this week."*

**A Charter compliance-log entry (M19, Sponsor Charter):** *"CFO delivered Q2 town hall in person at all three sites (Casablanca 14 [date], Kenitra 15 [date], Settat 16 [date]). Visible sponsorship action logged against Sponsor Charter standard 1 (active, visible commitment). Cross-referenced to M7 sponsor roadmap action #4."*

**A Sustainment checkpoint note (M12, 90-day checkpoint, Exception E5):** *"Reinforcement score 2.6, below the 3.0 target. Root cause: manager check-ins tapered off after the 60-day checkpoint once daily hypercare tracking ended. Remediation: CFO re-authorized a further checkpoint cadence at 105 and 120 days; champion network re-chartered for reinforcement specifically. Refreeze call delayed pending two consecutive healthy checkpoints."*

<a id="a9"></a>

### A.9 Frequently Asked Questions

**Why does journi never auto-compute a Lewin, Bridges, or Kübler-Ross reading, when it does compute the Composite Readiness Index?** Because those three are judgment calls about people's actual lived experience of change, and a wrong automated inference would be worse than a human one arrived at deliberately. The Composite Readiness Index and Divergence Pattern Detector are different: both are pure arithmetic over numbers a human already logged, with no interpretive judgment involved.

**If Bouregreg's program overlaps eight other CM Projects, doesn't ALT-008 (Change Saturation) just fire constantly and become noise?** It fires when a population segment is targeted by two or more *other* concurrent initiatives --- a real signal in a nine-project portfolio, not a bug. Part 5's escalation guidance treats it as a PMO-level review item on a 10-business-day SLA, not an urgent interrupt, which is the right severity for a genuinely common but non-critical condition.

**Why does the 64-week calendar in Part 1B.2 show phases overlapping instead of running strictly one after another?** Because a real ERP program's Project Management and Change Management tracks run in parallel --- Design starting before Discovery formally closes reflects how work actually proceeds, not an inconsistency in the calendar.

**Are the six exceptions in Part 1B.4 the only ways a program can go off track?** No --- they are six realistic, well-evidenced patterns, not an exhaustive list. journi's own documentation is explicit that Exception E8 (the Governance Escalation Loop, Part 3) is its own weakest-evidence entry, included for completeness rather than as strong as the other seven.

**Why does Exception E3 (Two-Clock Problem) matter even for a program with no visible sentiment lag?** Because the discipline --- marking Lewin provisional at go-live rather than confirmed --- costs nothing when there is no lag, and catches the case when there is one. Part 1B.3's Phase 6 Task 4 applies it unconditionally, not only when trouble is already visible.

**Does every Change Management Project need to run through all six exceptions?** No --- the Kenitra Invoice-Matching Automation case in Part 4 is deliberately built to close without any of the 9 live alerts firing. Exceptions are named, realistic possibilities to watch for, not a checklist every program must complete.

**Why does the Restructuring case in Part 4 have no dedicated Phase Template, when eight other archetypes do?** Because that is genuinely how the E2E addendum (CR1) was built --- 8 transformation types got a registered chain and Phase Template; Restructuring and M&A did not. This guide states that gap rather than invent a lifecycle journi doesn't actually have.

**Why does the Composite Readiness Index weight ADKAR at 50% and not something else?** That weighting is journi's own hardcoded formula (`ADKAR% × 0.50 + sentiment% × 0.25 + training% × 0.25`, A.3), not a configurable setting exposed anywhere in the platform. This guide states the exact formula rather than a rounded approximation of it, since a Change Manager reading a CRI trend line needs to know precisely what moved it.

**Can a Practitioner/Contributor ever see individual-level ADKAR or sentiment scores?** No, by design --- Practitioner is deliberately excluded from `ROLES_WITH_INDIVIDUAL_VISIBILITY` even though it holds general write access. A Practitioner like Ghita Bennis can log data and tag coded evidence, but the modules that show named-person detail (M4, M5, M6, M11) show her the aggregated view, the same one an Employee or Sponsor sees.

**What happens if the Settat cohort's Desire score recovers in Exception E1 but Kübler-Ross sentiment doesn't move with it?** That is functionally the start of a second, independent exception --- either a fresh Divergence Pattern check (E2) if Knowledge/Ability are also high, or simply a slower-than-expected sentiment recovery worth its own targeted listening session, run the same way E1's Recovery Task 2 was. journi does not merge two separate framework readings into one resolved status; each is tracked and re-scored independently.

**Does Part 4's nine-project library reflect a realistic number of concurrent Change Management Projects for one Organization?** It is on the high end deliberately, to make ALT-008 and ALT-011 (Part 5) genuinely fire rather than stay theoretical --- a real 3,400-person manufacturing group might typically run two to four concurrent CM Projects, not nine. The library's size is a teaching choice, stated as such rather than presented as a typical caseload.

**Why does M11 (Manager as Coach) show a People Manager their own team's ADKAR heatmap instead of a raw list of scores?** Because a heatmap surfaces which of the five ADKAR blocks is weakest at a glance, without requiring the supervisor to interpret five separate numbers per person themselves --- exactly the audience-appropriate framing journi applies throughout: a Change Manager sees the diagnostic detail, a People Manager sees the actionable summary for their own team only.

**If Bouregreg's CFO is the Sponsor on five of the nine Part 4 cases at once, doesn't that overload one person?** In a real deployment it plausibly would, and that concentration is itself worth naming: journi's Sponsor & Coalition module (M7) tracks each project's sponsorship independently, so an overloaded Sponsor shows up as thinning visibility across multiple projects rather than being hidden by one project's own clean-looking record --- exactly the kind of portfolio-level signal ALT-003 (Sponsor Coverage Gap) is built to catch if that CFO's attention genuinely starts to spread too thin.

### About This Version

This is Version 1.0 of the journi Complete User Guide, built around a single new scenario tenant --- Bouregreg Group --- created specifically for this document and not part of journi's other seeded demo data. Every module, field, RBAC rule, alert trigger, macro process, and end-to-end process composition named in it was verified against journi's actual source code at the time of writing, not assumed from a specification. Where this guide states a constraint --- an Organization's sector being one of exactly three values, a Kübler-Ross model with four stages rather than the textbook seven, an alert that never fires for lack of a real backend --- that constraint reflects journi's real, current behavior.

The 64-week program calendar (Part 1B.2), the eight scenario mini-timelines (Part 4), and the month-by-month narrative (Part 1B.6) are this guide's own illustrative pacing, built for a 3,400-person, three-site organization, and are stated as illustrative rather than implied to be a platform default. Everything else --- module behavior, RBAC gating, alert trigger conditions, macro process compositions, framework stage vocabulary --- is verified journi platform fact.

**What this version covers, end to end:** a complete tenant build from a blank deployment (Part 1); a 64-week ERP program run week by week through all four frameworks' real stage vocabulary, normal flow and all six documented exceptions, in full task-and-step detail (Part 1B); every one of journi's 21 modules with its real CRUD and RBAC behavior (Part 2); all 16 registered End-to-End processes, each traced to a real point in the Bouregreg scenario (Part 3); a nine-project scenario library covering eight of journi's ten Main Project archetypes and exercising all 9 live-computed alerts at least once (Part 4); the full alert catalog and the two automated readiness metrics behind it (Part 5); and a nine-section quick-reference appendix, from role and RACSI legends through a worked grid example, sample field entries, and this FAQ.

**What a future version might add:** a second scenario tenant in a different sector (Logistics or Health, the two sectors this version's single Manufacturing tenant does not exercise); a full step-by-step SIPOC/RACSI treatment of the eight Part 4 scenarios at the same depth Part 1B gives the ERP program; and worked examples of the seven catalogued-but-non-live alerts once journi's backend infrastructure exists to compute them for real.

**A closing note on scope discipline.** This guide is long because the request behind it was specific: every module, every registered process, a genuine week-by-week timeline across all four frameworks, and a scenario library broad enough to exercise every live alert --- not because length was a goal in its own right. Every table, worked example, and cross-reference above earns its place by tracing back to a real journi behavior, a real point in Bouregreg's timeline, or a real cross-reference a reader would otherwise have to reconstruct by flipping between Parts. Where this guide could not point to a real, verified journi behavior --- a Restructuring Phase Template that doesn't exist, an alert that never fires, a currency figure this guide itself invented for narrative color --- it says so plainly rather than paper over the gap. That discipline, more than the page count, is what this guide is actually meant to deliver.

---

*This concludes the journi Complete User Guide --- Parts 1, 1B, and 2 through 5, plus this Appendix.*
