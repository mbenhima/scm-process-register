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

With this checklist complete, Bouregreg Group is a fully operational journi tenant with one live Change Management Project. Part 2 picks up from here and tours all 20 modules against this same, now-real data set.
