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
- [Part 2 --- Module-by-Module Feature Tour](#part-2)
- [Part 3 --- All 16 End-to-End Process Walkthroughs](#part-3)
- [Part 4 --- Change Management Scenario Library](#part-4)
- [Part 5 --- Alerts and Analytics Reference](#part-5)

---

<a id="part-0"></a>

## Part 0 --- Purpose and How to Use This Guide

### What this guide is

This is journi's single comprehensive reference: one guide that starts at a genuinely empty tenant, walks through every one of journi's 20 modules, exercises all 16 processes in the End-to-End Process Catalogue, and hosts a library of distinct Change Management scenarios so a reader can see how journi behaves across more than one kind of change --- not only a large technology rollout.

It is organized in five parts:

- **Part 1 --- Tenant and Admin Setup.** How a brand-new journi tenant is actually built, from the License record through the first Change Management Project, using a new scenario organization created for this guide: **Bouregreg Group**, a Moroccan manufacturing group.
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

*Continued in the next subsection: 1B.3, the phase-by-phase playbook.*

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

*This concludes the journi Complete User Guide --- Parts 1 through 5.*
