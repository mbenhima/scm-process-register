**journi**

*the human side of change, mapped as a journey*

**User Acceptance Testing**

Test Plan & Test Cases — Version 2.0

Prepared for POWERACT Consulting

Chief Innovation Officer — Mounire

August 2026

**Table of Contents**

- [1. Test Plan](#1-test-plan)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
  - [1.3 Objectives](#13-objectives)
  - [1.4 Test Approach](#14-test-approach)
  - [1.5 Roles & Responsibilities](#15-roles--responsibilities)
  - [1.6 Test Environment & Real Application Path](#16-test-environment--real-application-path)
  - [1.7 Entry Criteria](#17-entry-criteria)
  - [1.8 Exit Criteria](#18-exit-criteria)
  - [1.9 Note on This Revision](#19-note-on-this-revision)
- [2. Status Legend](#2-status-legend)
- [3. Simulated ERP Program Timeline — Week by Week](#3-simulated-erp-program-timeline--week-by-week)
- [4. UAT Traceability & Executive Summary](#4-uat-traceability--executive-summary)
- [5. Detailed UAT Test Cases](#5-detailed-uat-test-cases)
  - [UAT-00 — Creating Tenants](#uat-00--creating-tenants)
  - [UAT-01 — E2E-01: Readiness & Mobilization](#uat-01--e2e-01-readiness--mobilization)
  - [UAT-02 — E2E-02: Capability & Divergence Management](#uat-02--e2e-02-capability--divergence-management)
  - [UAT-03 — E2E-03: Resistance-to-Commitment](#uat-03--e2e-03-resistance-to-commitment)
  - [UAT-04 — E2E-04: Adoption-to-Sustainment](#uat-04--e2e-04-adoption-to-sustainment)
  - [UAT-05 — E2E-05: Signal Aggregation Loop](#uat-05--e2e-05-signal-aggregation-loop)
  - [UAT-06 — E2E-06: PM ↔ CM Governance Bridge](#uat-06--e2e-06-pm--cm-governance-bridge)
  - [UAT-07 — E2E-07: Champion Early-Warning Loop](#uat-07--e2e-07-champion-early-warning-loop)
  - [UAT-08 — E2E-08: Governance Escalation Loop](#uat-08--e2e-08-governance-escalation-loop)
  - [UAT-09 — E2E-ERP: ERP Implementation Lifecycle](#uat-09--e2e-erp-erp-implementation-lifecycle)
  - [UAT-10 — E2E-BPR: Business Process Reengineering Lifecycle](#uat-10--e2e-bpr-business-process-reengineering-lifecycle)
  - [UAT-11 — E2E-BPA: Business Process Automation Lifecycle](#uat-11--e2e-bpa-business-process-automation-lifecycle)
  - [UAT-12 — E2E-IMS: Integrated Management System Lifecycle](#uat-12--e2e-ims-integrated-management-system-lifecycle)
  - [UAT-13 — E2E-CULT: Cultural / Values Transformation Lifecycle](#uat-13--e2e-cult-cultural--values-transformation-lifecycle)
  - [UAT-14 — E2E-OM: Operating Model Redesign Lifecycle](#uat-14--e2e-om-operating-model-redesign-lifecycle)
  - [UAT-15 — E2E-COMP: Compliance-Driven Change Lifecycle](#uat-15--e2e-comp-compliance-driven-change-lifecycle)
  - [UAT-16 — E2E-TSD: Training & Skills Development Lifecycle](#uat-16--e2e-tsd-training--skills-development-lifecycle)
- [6. Sign-Off](#6-sign-off)

## 1. Test Plan

### 1.1 Purpose

This document defines the User Acceptance Testing (UAT) plan for journi, the Human Change Management platform. It establishes the scope, approach, roles, environment, entry/exit criteria, and status conventions for testing, and provides the complete set of detailed UAT test cases organized by End-to-End (E2E) Process, in line with the journi End-to-End Process Catalogue v1.1 and the journi Framework Interaction Map v2.3.

This is Version 2.0. It absorbs POWERACT Consulting's *journi UAT Test Plan & Test Cases v1.0* in full — the same Test Plan structure, the same 16 End-to-End processes, the same six-state Status convention, the same per-case field set (Related Macro Processes, Related Modules, Trigger, Goals, Detailed Numbered Steps, RACSI, Expected Results, Status, Responses/Tester Comments, Attached Documents) — corrected throughout to match journi's actual, currently-implemented behavior, and extended with three additions: a new UAT-00 covering tenant creation, a verified real application access path, and a week-by-week simulated program timeline for the Atlas ERP People Readiness Program. Section 1.9 below details exactly what changed and why.

### 1.2 Scope

UAT coverage spans all 16 End-to-End processes defined for journi: the 4 processes formally registered in D32h (E2E-01 through E2E-04), the 4 cross-cutting loop extensions (E2E-05 through E2E-08), and the 8 transformation-type-specific lifecycle chains (E2E-ERP, E2E-BPR, E2E-BPA, E2E-IMS, E2E-CULT, E2E-OM, E2E-COMP, E2E-TSD). Together these 16 processes exercise all ten macro processes (MP-01 through MP-10) and every core module of the platform. Version 2.0 additionally scopes in tenant/hierarchy creation (Module 1) as its own UAT case, since every one of the other 16 cases presupposes a Group, Organization, Main Project and CM Project already exist.

### 1.3 Objectives

- Verify that each End-to-End process behaves as designed, from its defined trigger through to its defined terminal state.
- Verify that every macro process step within each chain produces the expected system output and is correctly attributed to the responsible role (RACSI).
- Confirm that data recorded at one step (e.g. readiness scores, barrier records, sign-offs) is correctly consumed by the next step in the chain.
- Provide traceability between each UAT case and the E2E process(es) and macro process(es) it covers.
- Confirm the platform can be stood up from nothing — a new tenant created, populated, and driven through a realistic multi-month change program — using only the application itself, with no hidden setup step.

### 1.4 Test Approach

Testing is organized by End-to-End process rather than by individual screen or module, so that each UAT case validates a complete business chain rather than an isolated feature. Each UAT case decomposes its E2E process into numbered, sequential steps traceable to the underlying macro-process tasks. Testers execute each UAT case end-to-end in the environment described in §1.6, populated with representative cohort, sponsor, and champion data, and record one of the six statuses defined in Section 2 against each case.

Five cases — UAT-00 and UAT-01 through UAT-04, plus UAT-09 — are additionally woven into **one continuous, realistic 64-week program timeline** (Section 3): the Atlas ERP People Readiness Program, journi's own seeded change management case for the S/4HANA Unification Program at Atlas Industrial Group. A tester who runs UAT-00 through UAT-04 and UAT-09 in week order has taken one change management engagement from tenant creation through kickoff, mobilization, training, resistance management, go-live, hypercare and a formally signed-off close — inside journi, start to finish. The remaining 10 cases (UAT-05 through UAT-08, UAT-10 through UAT-16) are scoped narrower by design: the 4 loops are cross-cutting dependencies rather than a fresh multi-week arc of their own, and the 7 non-ERP transformation types are tested against journi's *other* seeded projects, since journi does not model one project as being simultaneously an ERP program and, say, a compliance program.

### 1.5 Roles & Responsibilities

Each UAT case carries a five-column RACSI (Responsible, Accountable, Consulted, Sign-off, Informed) reflecting the roles defined in the journi Framework Interaction Map: Change Manager (CM), Program/Project Manager (PM), Executive Sponsor (ES), Functional Process Owner (FPO), IT/Technical Lead (ITL), Supervisor (SUP), and End User (EU). This is D17 CAT-02's 7-code RACSI taxonomy — distinct from journi's own platform login roles (Super Admin, Group Admin, Organization Admin, Sponsor, Change Manager, People Manager, Practitioner, Employee, Executive), which is what a tester actually logs in as. The Change Manager is Responsible for executing the large majority of test steps; the Executive Sponsor or Change Manager is Accountable depending on the chain; UAT sign-off for each case requires agreement from that case's Accountable role.

### 1.6 Test Environment & Real Application Path

journi is a self-contained, client-side-only application — no backend, no server-hosted UAT environment to provision. All data lives in the browser's `localStorage`, seeded fresh from the application's own source on first load. This is the **real, verified path** to reach it:

1. Obtain `journi_app.zip` (the delivered build) and unzip it. The result is a `journi/` folder containing a standard Vite + React project.
2. Open a terminal in the `journi/` folder and run:
   ```
   npm install
   npm run dev
   ```
3. Vite prints a local URL — verified as **`http://localhost:5173/`** — open it in a browser. The app redirects to `/login`.
4. The login screen lists every seeded demo persona by name and role (Super Admin, Group Admin, Organization Admin, Sponsor, Change Manager, People Manager, Practitioner, Employee, Executive Viewer). No password is required — click a name to sign in as that persona, pre-scoped to a realistic Group/Organization/Project combination.
5. Use the top-bar Organization and Project selectors to change scope; use "Reset Demo Data" (top bar) to discard any changes made during testing and restore the original seed state.
6. For a production-style build instead of the dev server, run `npm run build` then `npm run preview` (Vite's default preview port is `4173`, printed the same way at startup).

There is no separate "UAT environment" distinct from this — the same build a tester runs locally is the same build delivered to the client, seeded with the same representative stakeholder maps, cohorts, sponsor and champion records described throughout this plan.

### 1.7 Entry Criteria

- The `journi_app.zip` build is available and unzips cleanly; `npm install` completes without error.
- The application starts via `npm run dev` and reaches the login screen at the URL Vite prints (§1.6).
- The seeded demo dataset is present and unmodified (fresh unzip, or "Reset Demo Data" run) — Group/Organization/Main Project/CM Project hierarchy, users for every role, and the Atlas ERP People Readiness Program at its Day-0 baseline (§3).

### 1.8 Exit Criteria

- Every UAT case in Section 5 has a recorded status of Pass, or an approved Deferred status with documented justification.
- No UAT case remains in Blocked, In Progress, or Not Run status without an agreed remediation or deferral plan.
- All Fail results have a linked defect record and re-test outcome.

### 1.9 Note on This Revision

Version 1.0 (the source document this revision absorbs) was written directly from the journi End-to-End Process Catalogue v1.1 and the original functional specification's module list. Two things have moved since then, and this revision corrects both rather than silently carrying them forward:

1. **E2E-01 through E2E-04's compositions.** The Framework Interaction Map v2.3 §11 issued a "Corrected" macro-process composition, name, and RACSI for each of the four core chains, superseding the Process Catalogue's original reading. journi's E2E Process Registry (Module 18) implements the corrected version. Where this revision's steps differ from v1.0's, it is because v1.0 tested the superseded reading — for example, v1.0's UAT-02 composition (MP-05 → MP-06 → MP-07, "Capability Build") is now MP-05 → MP-08 → MP-07 ("Capability & Divergence Management"), with MP-06 (Champion Network) no longer part of this chain.
2. **Module numbering.** v1.0 references modules as "M-05" through "M-14" — an early specification-stage numbering that predates both journi's actual build and a later in-application renumbering that closed a gap (Module 3 had been reserved for localization but never built as its own page; every module from the old Module 4 onward shifted down by one). This revision uses journi's real, current module numbers and names throughout (M1–M20), verified against the running application, not the specification's original list.

Nothing in v1.0's Goals, RACSI, or overall intent has changed — only the concrete steps and module references, so that each case tests what the software actually does today.

## 2. Status Legend

Every UAT case in Section 5 carries all six statuses below, pre-listed for the tester to select the applicable one during execution.

| Status | Definition |
|---|---|
| Pass | The software meets all acceptance criteria and works as expected. |
| Fail | The system behaves incorrectly or fails to meet a business requirement. |
| Blocked | A critical defect or missing dependency prevents the tester from running the test. |
| In Progress | The user is currently executing the test steps but has not finished. |
| Not Run | The test case is assigned but execution has not started yet. |
| Deferred | The test is skipped for the current cycle and postponed to a future release. |

Status legend applied uniformly to every UAT case in this document.

## 3. Simulated ERP Program Timeline — Week by Week

The Atlas ERP People Readiness Program (S/4HANA Unification Program, Atlas Industrial Group) is seeded at a single point in time — Day 0, "today," Unfreeze, baseline assessment (see UAT-01 for the exact seeded values). Everything before Day 0 in the table below is real seed data (two milestones: kick-off at Day −60, plant town halls at Day −30). Everything from Day 0 onward that is not one of the application's own seeded future milestones (training launch Day +60, go-live Day +270) is **illustrative weekly pacing** for a tester to type into journi as they roleplay the week — realistic, internally consistent, and aligned to the 8-phase ERP template (TPL-ERP-8: Discovery, Design, Build, Test, Train, Deploy, Hypercare, Sustain) journi itself offers for this project type, but not literally pre-loaded in the app. Where a week's row says "(seeded)," the value is real; every other row is guidance for what a tester should simulate.

| Week | Day Offset | Phase (TPL-ERP-8) | Key Activity | UAT |
|---|---|---|---|---|
| 1 | Day −60 to −54 | Discovery | Tenant created (Group/Org/Main Project/CM Project); program kick-off (seeded) | UAT-00, UAT-01 |
| 2 | Day −53 to −47 | Discovery | Stakeholder cohort identification begins | UAT-01 |
| 3 | Day −46 to −40 | Discovery | 5-dimension impact scoring workshop (4 cohorts) | UAT-01 |
| 4 | Day −39 to −33 | Discovery | Sponsor coalition formed — COO + 3 Plant Directors + Finance VP | UAT-01 |
| 5 | Day −32 to −26 | Discovery | Plant town halls at all 3 plants (seeded) | UAT-01 |
| 6 | Day −25 to −19 | Discovery | Awareness pulse — Awareness score rises 1→2 (seeded history) | UAT-01 |
| 7 | Day −18 to −12 | Discovery | Champion network activity logged via Sponsor Coalition roadmap | UAT-01, UAT-07 |
| 8 | Day −11 to −5 | Discovery | Discovery phase gate recorded | UAT-01, UAT-06 |
| 9 | Day −4 to +2 | Design | **Day 0 baseline** — full seeded ADKAR/risk/resistance state (today) | UAT-01, UAT-09 |
| 10 | Day 3–9 | Design | Target-state design workshops begin | UAT-01 |
| 11 | Day 10–16 | Design | Communication matrix built out; wave 2 scheduled | UAT-01 |
| 12 | Day 17–23 | Design | Early resistance signals logged (will/systemic barriers, seeded) | UAT-03 |
| 13 | Day 24–30 | Design | Coding Workbench tagging of early qualitative signals | UAT-03 |
| 14 | Day 31–37 | Design | Target-state design review with Functional Process Owners | UAT-01 |
| 15 | Day 38–44 | Design | Sponsorship / Leadership Charter (CHTR-01) signed | UAT-01 |
| 16 | Day 45–51 | Design | Design phase gate recorded | UAT-06 |
| 17 | Day 52–58 | Build | Training curriculum design finalized | UAT-02 |
| 18 | Day 59–65 | Build | **Training curriculum launch** (seeded milestone) — first cohort begins | UAT-02, UAT-09 |
| 19 | Day 66–72 | Build | Sandbox environment live; hands-on practice begins | UAT-02 |
| 20 | Day 73–79 | Build | Cohort rollout — Production Planning track begins | UAT-02 |
| 21 | Day 80–86 | Build | Cohort segmentation confirmed; Knowledge/Ability scores begin rising | UAT-02 |
| 22 | Day 87–93 | Build | Training delivery continues across all 3 plants | UAT-02 |
| 23 | Day 94–100 | Build | Mid-curriculum competency check | UAT-02 |
| 24 | Day 101–107 | Build | Champion floor observation formalized into Resistance Log entry | UAT-07 |
| 25 | Day 108–114 | Build | Resistance mitigation actions in progress | UAT-03 |
| 26 | Day 115–121 | Build | Divergence Pattern check (Knowledge/Ability vs. Bridges) | UAT-02, UAT-05 |
| 27 | Day 122–128 | Build | Build phase gate — second Governance Bridge Joint Decision | UAT-06 |
| 28 | Day 129–135 | Test | UAT/sandbox hands-on practice sessions | UAT-02 |
| 29 | Day 136–142 | Test | Assessment dry-runs | UAT-02 |
| 30 | Day 143–149 | Test | First certification wave — Finance Essentials certified | UAT-02 |
| 31 | Day 150–156 | Test | Competency verification — Production Planning cohort | UAT-02 |
| 32 | Day 157–163 | Test | Remediation assigned to below-threshold cohorts | UAT-02 |
| 33 | Day 164–170 | Test | Manager-as-Coach readiness preparation begins | UAT-04 |
| 34 | Day 171–177 | Test | Composite Readiness Index recalculated (Signal Aggregation Loop) | UAT-05 |
| 35 | Day 178–184 | Test | Test phase gate recorded | UAT-06 |
| 36 | Day 185–191 | Train | Mass training rollout — Wave 1 | UAT-02 |
| 37 | Day 192–198 | Train | Mass training rollout — Wave 2 | UAT-02 |
| 38 | Day 199–205 | Train | Mass training rollout — Wave 3 | UAT-02 |
| 39 | Day 206–212 | Train | Org-wide training completion tracking | UAT-02, UAT-09 |
| 40 | Day 213–219 | Train | Union/HR briefing — Desire recovery begins (2→3) | UAT-03 |
| 41 | Day 220–226 | Train | Final resistance resolution push | UAT-03 |
| 42 | Day 227–233 | Train | Cutover readiness checks | UAT-03 |
| 43 | Day 234–240 | Train | Go/No-Go readiness review — final Joint Decision Record | UAT-06 |
| 44 | Day 241–247 | Deploy | Cutover dry-run 1 | UAT-04 |
| 45 | Day 248–254 | Deploy | Cutover dry-run 2 | UAT-04 |
| 46 | Day 255–261 | Deploy | Final data migration pass | UAT-04 |
| 47 | Day 262–268 | Deploy | Cutover readiness sign-off | UAT-04, UAT-09 |
| 48 | Day 269–275 | Deploy | **Go-live, Plant 1** (seeded milestone) | UAT-04, UAT-09 |
| 49 | Day 276–282 | Hypercare | Daily floor coaching — Week 1 | UAT-04 |
| 50 | Day 283–289 | Hypercare | Floor coaching tapering begins | UAT-04 |
| 51 | Day 290–296 | Hypercare | Stabilization monitoring | UAT-04 |
| 52 | Day 297–303 | Hypercare | **30-day post-go-live checkpoint** | UAT-04 |
| 53 | Day 304–310 | Hypercare | First Quick Win logged | UAT-04 |
| 54 | Day 311–317 | Hypercare | Continued stabilization | UAT-04 |
| 55 | Day 318–324 | Hypercare | Regression-risk review | UAT-04 |
| 56 | Day 325–331 | Hypercare | **60-day post-go-live checkpoint** | UAT-04 |
| 57 | Day 332–338 | Sustain | Reinforcement embedding begins | UAT-04 |
| 58 | Day 339–345 | Sustain | Performance-review integration | UAT-04 |
| 59 | Day 346–352 | Sustain | Sponsor escalation (union briefing follow-up) | UAT-08 |
| 60 | Day 353–359 | Sustain | **90-day post-go-live checkpoint** | UAT-04 |
| 61 | Day 360–366 | Sustain | Lessons learned logged | UAT-04 |
| 62 | Day 367–373 | Sustain | REX log closure — lesson linked to CHTR-01 | UAT-04 |
| 63 | Day 374–380 | Sustain | Governance escalation loop closure | UAT-08 |
| 64 | Day 381–387 | Sustain | **Sustainment sign-off — project formally closed, Refreeze confirmed** | UAT-04, UAT-09 |

## 4. UAT Traceability & Executive Summary

| UAT ID | Related E2E Process(es) | UAT Name | UAT Goals |
|---|---|---|---|
| UAT-00 | — (Module 1) | Creating Tenants | Group, Organization, Main Project, and CM Project created and correctly related, forming the tenant every other UAT case operates inside. |
| UAT-01 | E2E-01 | Readiness & Mobilization | Stakeholder map published, sponsor coalition active, communications launched, and baseline readiness diagnosed. |
| UAT-02 | E2E-02 | Capability & Divergence Management | Cohorts trained and certified, Knowledge/Ability verified, and a genuine Divergence Pattern correctly detected. |
| UAT-03 | E2E-03 | Resistance-to-Commitment | Flagged resistance barriers tracked from Open through Closed, with Desire recovering in parallel. |
| UAT-04 | E2E-04 | Adoption-to-Sustainment | Go-live, hypercare checkpoints, quick wins, lessons learned, and a formal Sustainment sign-off all recorded. |
| UAT-05 | E2E-05 | Signal Aggregation Loop | Communications/Training updates provably flow into the Risk Register and Notification Center with no separate action. |
| UAT-06 | E2E-06 | PM ↔ CM Governance Bridge | A Phase Gate reached with independent PM/CM inputs and a single, freely-selectable Accountable role on the Joint Decision. |
| UAT-07 | E2E-07 | Champion Early-Warning Loop | A champion-sourced observation traced through to a formal Resistance Log barrier record. |
| UAT-08 | E2E-08 | Governance Escalation Loop | A sponsor escalation logged and reflected in the same audit trail Sustainment sign-off closes out. |
| UAT-09 | E2E-ERP | ERP Implementation Lifecycle | The type-level registry entry and 8-phase template correctly roll up everything UAT-00 through UAT-06 already exercised. |
| UAT-10 | E2E-BPR | Business Process Reengineering Lifecycle | Registry entry, SIPOC and phase template verified against a real BPR seeded project. |
| UAT-11 | E2E-BPA | Business Process Automation Lifecycle | Registry entry, SIPOC and phase template verified against a real Automation seeded project. |
| UAT-12 | E2E-IMS | Integrated Management System Lifecycle | Registry entry, SIPOC and phase template verified against a real QMS seeded project. |
| UAT-13 | E2E-CULT | Cultural / Values Transformation Lifecycle | Registry entry, SIPOC and phase template verified against a real Culture seeded project. |
| UAT-14 | E2E-OM | Operating Model Redesign Lifecycle | Registry entry, SIPOC and phase template verified against a real Operating Model seeded project. |
| UAT-15 | E2E-COMP | Compliance-Driven Change Lifecycle | Registry entry, SIPOC and phase template verified against a real Compliance seeded project. |
| UAT-16 | E2E-TSD | Training & Skills Development Lifecycle | Registry entry, SIPOC and phase template verified against a real Training & Skills seeded project. |

UAT Traceability and Executive Summary — 17 UAT cases: tenant creation plus all 16 End-to-End processes.

## 5. Detailed UAT Test Cases

Each subsection below is one UAT case. Every case provides the UAT ID and Name, its related E2E process and status, related macro processes and modules, trigger, Goals, detailed numbered steps, RACSI, Expected Results, the full six-state Status legend for the tester to mark, a free-text Responses/Tester Comments field, and an Attached Documents field for supporting evidence (e.g. a screenshot of a CSV export, or a saved JSON state snapshot).

### UAT-00 — Creating Tenants

**Related E2E Process(es)**: None directly — this precedes all 16. Every other case in this plan presupposes the tenant this case creates.

**Related Macro Processes**: None (platform/foundation layer, Module 1).

**Related Modules**: M1 · Hierarchy.

**Trigger**: A new client engagement is being stood up in journi for the first time.

**Goals**: A Group, an Organization belonging to it, a Main Project (PM-track) belonging to the Organization, and a Change Management Project (CM-track) linked to that Main Project all exist, correctly related, and visible to a Super Admin — the minimum tenant structure every other UAT case in this plan operates inside.

**Detailed Numbered Steps**:

1. Log in as **Amina Idrissi** (Super Admin) — see §1.6 for the real application path. Open **M1 · Hierarchy**.
2. Click **"+ Group"**. Enter Name: "POWERACT Client Demo Group". Save.
3. Click **"+ Organization"**. Enter Name: "Northbridge Manufacturing Co."; Group: "POWERACT Client Demo Group"; Type (sector): Manufacturing; Employees: 2,400; Sites: "Plant A, Plant B" (comma separated); Language: "en,fr"; Default Language: EN. Save.
4. On the new Organization's card, click **"+ Main Project"**. Enter Name: "S/4HANA Rollout — Northbridge"; Type: ERP; Description: "Consolidate two plant ERPs onto SAP S/4HANA"; Duration: 14 (months); Budget Band: "€3.1M band"; Executive Sponsor: "COO, Northbridge". Save.
5. On the same Organization's card, click **"+ Change Management Project"**. Enter Name: "Northbridge ERP People Readiness Program"; Linked Main Project: check "S/4HANA Rollout — Northbridge"; Owner: "Test Change Manager"; Change Type: Technology; Target Population: "~600 plant and back-office staff"; Business Driver: "Unify plant-level ERPs ahead of group reporting". Save.
6. Confirm the new Organization's card shows both the Main Project (with its type badge) and the CM Project (with its Lewin-phase badge, defaulting to Unfreeze), and that the CM Project shows "↳ Linked Main Project: S/4HANA Rollout — Northbridge" rather than "↳ Standalone".
7. Set the Organization's Default Language to FR using the inline selector on its card (no separate edit modal — this field is editable directly from the hierarchy view).
8. Sign out and sign back in as a **Change Manager** persona *not* scoped to this new tenant (e.g. Nadia Chraibi, scoped to Atlas). Confirm the new Group/Organization/Project do **not** appear in her Organization selector — RBAC scope correctly isolates tenants from each other.
9. Sign back in as Amina Idrissi and delete the CM Project just created (Delete button on its card), then the Main Project, then the Organization, then the Group — confirming deletion cascades cleanly with no orphaned reference left in the hierarchy view.

**RACSI**:

| R | A | C | S | I |
|---|---|---|---|---|
| Change Manager (CM) / Super Admin | Executive Sponsor (ES) | Program/Project Manager (PM), Functional Process Owner (FPO) | — | End User (EU) |

RACSI for UAT-00. R = Responsible · A = Accountable · C = Consulted · S = Sign-off · I = Informed. In practice this step is performed by whichever platform role carries the `manageHierarchy` capability (Super Admin, Group Admin, or Organization Admin by default, per Module 2's Permission Matrix) — not necessarily the Change Manager who will later own the CM Project's day-to-day data.

**Expected Results**: A Group, Organization, Main Project and CM Project exist, correctly nested and cross-linked, editable and deletable by a role with `manageHierarchy`, and invisible to a user scoped to a different tenant.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-01 — E2E-01: Readiness & Mobilization

**Status of Related E2E Process**: Registered in D32h — composition corrected by Framework Interaction Map v2.3 §11 (see §1.9). journi's Process Registry (M18) reflects the corrected version tested here.

**Related Macro Processes**: MP-01 → MP-02 → MP-03 → MP-06 → MP-07.

**Related Modules**: M4 Stakeholder & Impact Mapping, M7 Sponsor & Coalition Module, M8 Communication Planning & Execution, M5 ADKAR Engine, M18 Process Registry.

**Trigger**: Business case and stakeholder map opened (Week 1, Day −60 — see §3).

**Goals**: Stakeholder map published, sponsor coalition active, communications launched, champion activity logged, and baseline readiness diagnosed — the corrected terminal state: mobilized sponsorship, informed and diagnosed population, active champion network.

**Detailed Numbered Steps** (program weeks per §3 in parentheses):

1. **(Week 1)** Log in as **Nadia Chraibi** (Change Manager). Scope to Atlas Industrial Group / Atlas ERP People Readiness Program. Confirm the seeded kick-off milestone at Day −60.
2. **(Weeks 2–3)** Open **M4 · Stakeholder Mapping**. Confirm all 4 seeded cohorts and their 5-dimension impact scores: Finance & Procurement (HQ) — 210 headcount; Plant Warehouse Supervisors — 90; Production Planning — 140; Shop-floor Supervisors (all 3 plants) — 260.
3. **(Week 4)** Open **M7 · Sponsor & Coalition**. Confirm the Sponsor is the COO, visibility rated **Moderate**, and the coalition roster lists 5 named members (COO + 3 Plant Directors + Finance VP) with influence/engagement scores.
4. **(Week 5)** Open **M8 · Communications**. Confirm the seeded Town Hall communication ("Why S/4HANA…") is logged **sent**, feeding the Awareness ADKAR block, matching the Day −30 plant town halls milestone.
5. **(Week 6)** Open **M5 · ADKAR Engine**. Confirm Awareness = 3 with a justification history showing two logged increases dated just before Day 0 (1→2, then 2→3), each citing the town-hall waves.
6. **(Week 7)** Open **M7 · Sponsor & Coalition** and log a new Sponsor Action representing champion-network activity surfaced through the coalition: "Champion network coverage confirmed across all 3 plants ahead of Discovery close", phase = Manage, mark done.
7. **(Week 8)** Open **M17 · WBS & Gantt**, phase filter **P1 — Intake & Diagnosis**, and add a Phase Gate recording the Discovery-phase Joint Decision (see UAT-06 for the full independent-PM/CM-input mechanics).
8. **(Week 9, Day 0)** Confirm the program is now at its documented baseline: Lewin Unfreeze, Bridges Ending, sentiment mixed Denial/Resistance (shop-floor) and Exploration (finance).
9. Open **M18 · Process Registry**, E2E Process Registry tab, and locate **E2E-01**. Confirm it displays "Readiness & Mobilization (Awareness → Launch-Readiness)", composition MP-01 → MP-02 → MP-03 → MP-06 → MP-07, and RACSI R=CM · A=ES · C=FPO, PM · S=SUP · I=EU.

**RACSI**:

| R | A | C | S | I |
|---|---|---|---|---|
| Change Manager (CM) | Executive Sponsor (ES) | Functional Process Owner (FPO), Program/Project Manager (PM) | Supervisor (SUP) | End User (EU) |

**Expected Results**: The stakeholder map, sponsor coalition record, communications log, and baseline readiness score all exist in journi, are internally consistent with each other and with the Day-0 state documented in §3, and are visible to the Change Manager and Executive Sponsor.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-02 — E2E-02: Capability & Divergence Management

**Status of Related E2E Process**: Registered in D32h — composition corrected (see §1.9); v1.0 tested MP-05 → MP-06 → MP-07 ("Capability Build"), the superseded reading. The corrected composition drops MP-06 and adds MP-08.

**Related Macro Processes**: MP-05 → MP-08 → MP-07.

**Related Modules**: M9 Training & Capability Building, M5 ADKAR Engine, M6 Emotional & Transition Layer, M16 AI Use Case Library, M18 Process Registry.

**Trigger**: Curriculum, sandbox, and cohort segmentation confirmed from E2E-01 / UAT-01 (Week 17).

**Goals**: Cohorts trained and certified, Knowledge/Ability verified, and a genuine Knowledge/Ability-vs-Bridges Divergence Pattern correctly detected — the corrected terminal state: verified capable and emotionally-ready cohorts; Divergence Pattern log.

**Detailed Numbered Steps** (program weeks per §3):

1. **(Week 17)** Open **M9 · Training**. Confirm the two seeded curricula: "S/4HANA Finance Essentials" (15% complete) and "S/4HANA Production Planning" (5% complete).
2. **(Week 18)** Add a new curriculum entry representing the launch wave: "S/4HANA Finance Essentials — Cohort 2", track "Finance & Procurement", level Practitioner, format Blended, completion 60%, facilitator "POWERACT DPSK Track".
3. **(Weeks 19–23)** Confirm training delivery is tracked per curriculum via its own completion %, not a single program-wide number — each new wave/cohort is its own row (there is no inline "edit completion" on an existing row, only creation, the Certified toggle, and Delete).
4. **(Week 30)** Click "trained only" on "S/4HANA Finance Essentials" to mark it **certified**, supplying a justification (e.g. "First cohort of 40 finance analysts completed and passed the certification assessment."). Confirm a justification panel is required (Module 2 Governance Settings default) and the save button reads "Certify with justification".
5. **(Week 31)** Open **M5 · ADKAR Engine** and raise Knowledge to 4 and Ability to 4, each with a justification referencing the certification milestone.
6. **(Week 34)** Note Bridges (**M6 · Emotional & Transition**) is still **Ending**. journi's Divergence Pattern condition (Knowledge ≥4 and Ability ≥4 while Bridges still reads Ending) is now satisfied.
7. Click the bell icon (Notification Center). Confirm **ALT-001 — Divergence Pattern Detected** is now listed, with severity, SLA and a Dismiss control.
8. Open **M18 · Process Registry** and locate **E2E-02**. Confirm it displays "Capability & Divergence Management (Training → Verified Competence)", composition MP-05 → MP-08 → MP-07 — **not** the v1.0 composition — and terminal state "Verified capable and emotionally-ready cohorts; Divergence Pattern log".

**RACSI**:

| R | A | C | S | I |
|---|---|---|---|---|
| Change Manager (CM) | Change Manager (CM) | Functional Process Owner (FPO), IT/Technical Lead (ITL) | Program/Project Manager (PM), Supervisor (SUP) | Executive Sponsor (ES), End User (EU) |

**Expected Results**: Certification requires justification when the governance toggle is on; ALT-001 fires only once the Knowledge/Ability-vs-Bridges condition is genuinely met, not before or by default.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-03 — E2E-03: Resistance-to-Commitment

**Status of Related E2E Process**: Registered in D32h — composition corrected (see §1.9); v1.0 tested MP-04 → MP-08 → MP-09. The corrected composition is MP-04 → MP-06 → MP-07 → MP-09.

**Related Macro Processes**: MP-04 → MP-06 → MP-07 → MP-09.

**Related Modules**: M10 Resistance Management, M5 ADKAR Engine, M18 Process Registry.

**Trigger**: A stalled Desire score or negative sentiment pulse is first logged (Week 12).

**Goals**: A logged resistance barrier tracked from Open through Closed, with the ADKAR Desire block recovering in parallel — the corrected terminal state: resolved barriers; recovered Desire/sentiment scores; sustained commitment.

**Detailed Numbered Steps** (program weeks per §3):

1. **(Week 12)** Open **M10 · Resistance**, Resistance Log tab. Confirm the two seeded entries: a **will**-type barrier from Shop-floor Supervisors ("Fear that ERP consolidation precedes headcount reduction", severity 4, in progress), and a **systemic**-type barrier ("Legacy system maturity gap creates uneven readiness across 3 plants", severity 3, open).
2. Confirm the type-count summary shows 1 systemic entry — below the ≥2 threshold that would trigger the systemic-pattern warning banner, so the banner does not appear.
3. **(Week 25)** Click "Mark in progress" → "Close" on the systemic barrier, justification: "Ain Sebaâ (most digitally mature plant) sequenced first per the mitigation plan; readiness gap closing."
4. **(Week 13)** Open **M10 · Resistance**, Coding Workbench tab. Confirm the seeded coaching note from Plant Director — Nouaceur is taggable.
5. Tag it with a code from the codebook (e.g. "fear-of-obsolescence") and link it to the open will-type entry via "Cross-reference to an existing barrier (optional)". Confirm the 🔗 icon appears and the Code Frequency count increases.
6. **(Week 40)** Open **M5 · ADKAR Engine** and raise Desire from 2 to 3, justification: "Joint HR/Union briefing held at all 3 plants confirming no headcount impact; shop-floor sentiment shifting from Denial toward Exploration."
7. Open **M18 · Process Registry** and locate **E2E-03**. Confirm it displays "Resistance-to-Commitment (Barrier Detection → Buy-In)", composition MP-04 → MP-06 → MP-07 → MP-09 — **not** the v1.0 composition.

**RACSI**:

| R | A | C | S | I |
|---|---|---|---|---|
| Change Manager (CM) | Change Manager (CM) | Executive Sponsor (ES), Supervisor (SUP) | Program/Project Manager (PM) | Functional Process Owner (FPO), End User (EU) |

**Expected Results**: Status transitions are justification-gated; the Coding Workbench tag genuinely cross-references the Resistance Log entry, not just a free-text mention.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-04 — E2E-04: Adoption-to-Sustainment

**Status of Related E2E Process**: Registered in D32h — composition corrected (see §1.9); v1.0 named this case "Sustainment & Closure" with composition MP-10 alone. The corrected composition is MP-09 → MP-10 → MP-07.

**Related Macro Processes**: MP-09 → MP-10 → MP-07.

**Related Modules**: M11 Manager as Coach, M12 Sustainment, M16 AI Use Case Library, M19 CM Charters, M18 Process Registry.

**Trigger**: Go-live cutover executed (Week 48, Day +270 — seeded milestone).

**Goals**: Stabilized new-normal performance, embedded reinforcement, confirmed Refreeze, and a closed project — the one chain the Day-0 seed data has not yet reached, so this case is where the tester's own actions carry the program the rest of the way through §3's remaining weeks.

**Detailed Numbered Steps** (program weeks per §3):

1. **(Week 33)** Open **M11 · Manager as Coach**. Set manager readiness to 4, justification: "Plant Directors completed sponsor-shadowing sessions ahead of cutover."
2. **(Weeks 44–47)** Open **M17 · WBS & Gantt** and log cutover dry-run and data-migration milestones on the Project Management track (freeform task entries — see UAT-06 for Phase Gate mechanics specifically).
3. **(Week 48)** Confirm go-live: open **M12 · Sustainment**. All three checkpoints (30/60/90-day) show **not due** — the seeded Day-0 state — confirming the terminal state genuinely has not been reached before this case starts acting.
4. **(Week 52)** Click "Record checkpoint" on the 30-day checkpoint. Confirm an adoption rate and regression-risk are generated and status becomes **complete**.
5. **(Week 56)** Repeat for the 60-day checkpoint.
6. **(Week 53)** Add a Quick Win: "First plant (Ain Sebaâ) closes month-end 2 days faster on S/4HANA than on the legacy system."
7. **(Week 60)** Repeat "Record checkpoint" for the 90-day checkpoint — all three now **complete**.
8. **(Weeks 61–62)** Add a lesson learned: "Sequencing the most digitally mature plant first materially reduced go-live support tickets" — in the "Linked Rule / Control / Charter" field, enter **CHTR-01**. Confirm status shows **Applied** (green), not Pending — the D25 REX gate is real.
9. If any checkpoint shows regression risk **High**, review the Regression Risk Predictor AI suggestion box and accept/edit/reject it — confirm it logs to the AI usage audit trail (M16) regardless of the action taken.
10. **(Week 64)** Toggle **Sustainment Sign-off**. Confirm the button changes to "✓ Signed off".
11. Open **M18 · Process Registry** and locate **E2E-04**. Confirm it displays "Adoption-to-Sustainment (Go-Live → Refreeze)", composition MP-09 → MP-10 → MP-07, terminal state "Stabilized new-normal performance; embedded reinforcement; confirmed Refreeze; closed project" — the exact state the program is now in.

**RACSI**:

| R | A | C | S | I |
|---|---|---|---|---|
| Change Manager (CM) | Executive Sponsor (ES) | Program/Project Manager (PM), Functional Process Owner (FPO) | Supervisor (SUP) | IT/Technical Lead (ITL), End User (EU) |

**Expected Results**: Sign-off is only reachable after all checkpoints are addressed; a lesson without a linked Rule/Control/Charter remains visibly Pending.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-05 — E2E-05: Signal Aggregation Loop

**Status of Related E2E Process**: Proposed extension surfaced by cross-referencing the macro processes' own dependencies — not a separate screen, a documented data-flow.

**Related Macro Processes**: MP-03 → MP-05 → MP-07 → MP-08.

**Related Modules**: M13 Change Risk Register, M8 Communications, M18 Process Registry.

**Trigger**: New Awareness (MP-03) or Knowledge/Ability (MP-05) signal recorded (Week 34, following UAT-02).

**Goals**: Confirm a Communications or Training update genuinely changes what the Risk Register and Notification Center report, with no separate "push" action needed.

**Detailed Numbered Steps**:

1. With the program at the state left by UAT-02 (Knowledge = 4, Ability = 4, Awareness = 3), open **M13 · Risk Register**. Confirm the seeded saturation risk (likelihood 4 × impact 4 = 16) is present.
2. Return to **M8 · Communications** and add a new entry marking the previously-scheduled "What changes for your role on day one" message as sent (no inline status edit on existing rows — see UAT-01).
3. Re-open **M13 · Risk Register** and the Notification Center bell. Confirm ALT-001 (from UAT-02) is still listed if its condition is still true — the alert evaluates live on every render, not cached.
4. Open **M18 · Process Registry** and locate **E2E-05**. Confirm it displays "Signal Aggregation Loop", composition MP-03 → MP-05 → MP-07 → MP-08.

**RACSI**: Not separately assigned in D32h — inherits R=CM/A=CM from the macro processes it traces (MP-03, MP-05, MP-07, MP-08).

**Expected Results**: No "aggregate signals" button exists anywhere in the app — the loop's terminal state is confirmed purely by re-reading already-live data.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-06 — E2E-06: PM ↔ CM Governance Bridge

**Status of Related E2E Process**: Proposed extension; terminal-state mechanics corrected by D32e (see §1.9).

**Related Macro Processes**: MP-02 → MP-08.

**Related Modules**: M17 WBS & Gantt, M18 Process Registry.

**Trigger**: Main Project schedule slip logged OR Phase Gate checkpoint reached (Weeks 8, 16, 27, 35, 43 per §3).

**Goals**: A Phase Gate reached with PM and CM inputs captured independently, and a single Accountable role assigned to the Joint Decision that may differ from both authors.

**Detailed Numbered Steps**:

1. Open **M17 · WBS & Gantt**; filter to the relevant phase (e.g. **P2 — Case for Change & Target-State Design** for the Week-16 gate).
2. Click **"+ Add Phase Gate"**. In the **PM input** box: recommendation Go with Conditions, note "Schedule holding to baseline; data migration dry-run 90% complete, contingent on finance sign-off." In the separate **CM input** box: recommendation Go with Conditions, note "Readiness index below target for shop-floor cohort", Readiness Index 55, Checklist % 70, Open flags "Union briefing not yet closed".
3. Set **Joint Decision** to Go with Conditions; enter Conditions text; set **Accountable role (exactly one)** to a value that is neither PM nor CM (e.g. **ES**). Click "Record joint decision".
4. Open the Notification Center. Confirm **ALT-009 — Phase Gate No-Go / Conditional** is listed.
5. Open **M18 · Process Registry** and locate **E2E-06**. Confirm the terminal state references the Joint Decision Record and "may differ from either input's author" (JD-05) verbatim.

**RACSI**: Governed by D32e's Accountable-role rule rather than a fixed RACSI row — the Accountable role is selected per gate (step 3), not pre-assigned.

**Expected Results**: The Accountable role selector is genuinely unrestricted; ALT-009 fires from real Phase Gate state.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-07 — E2E-07: Champion Early-Warning Loop

**Status of Related E2E Process**: Proposed extension.

**Related Macro Processes**: MP-06 → MP-04.

**Related Modules**: M7 Sponsor & Coalition Module, M10 Resistance Management, M18 Process Registry.

**Trigger**: A champion raises an early sentiment or resistance signal (Week 24 per §3).

**Goals**: A champion-sourced observation traced through to a formal, structured Resistance Log entry.

**Detailed Numbered Steps**:

1. Open **M7 · Sponsor & Coalition** and add a Sponsor Action capturing a floor-level observation: "Plant Director — Ain Sebaâ reports informal pushback among senior warehouse staff about the new putaway workflow — flag to Change Manager for follow-up."
2. Open **M10 · Resistance**, Resistance Log tab, and formalize it as a new entry: type role, source "Plant Warehouse Supervisors", root cause "Senior warehouse staff uncertain how the new putaway workflow affects their supervisory role", severity 3, mitigation "Role-mapping session confirming supervisory scope is unchanged", owner "Plant Director — Ain Sebaâ", status open.
3. Open **M18 · Process Registry** and locate **E2E-07**. Confirm terminal state "Observation formalized into a Resistance Log barrier record".

**RACSI**: R=SUP (champion-adjacent) → A=CM at the hand-off into the Resistance Log; inherits MP-06/MP-04's owning roles.

**Expected Results**: M7 and M10 are genuinely separate screens with no automatic conversion between them — this hand-off is a deliberate manual step, exercising exactly what the catalogue flags as previously undocumented.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-08 — E2E-08: Governance Escalation Loop

**Status of Related E2E Process**: Proposed extension — weaker evidence than E2E-05/06/07; included for completeness.

**Related Macro Processes**: MP-02 → MP-10.

**Related Modules**: M7 Sponsor & Coalition Module, M12 Sustainment, M18 Process Registry.

**Trigger**: A Change Management risk is escalated to the Executive Sponsor (Week 59 per §3).

**Goals**: A sponsor escalation logged and reflected in the same audit trail Sustainment sign-off closes out.

**Detailed Numbered Steps**:

1. Open **M7 · Sponsor & Coalition** and log a Sponsor Action: "COO escalation: directed Finance VP to personally close out the union briefing before Plant 1 go-live", phase Manage, mark done.
2. Return to **M12 · Sustainment** (signed off per UAT-04). Confirm sign-off remains recorded and the escalation is part of the same project's audit trail — there is no separate escalation ledger to reconcile.
3. Open **M18 · Process Registry** and locate **E2E-08**. Confirm the entry itself carries the "weaker evidence… included for completeness" caveat verbatim.

**RACSI**: R=CM, A=ES for the escalation itself; inherits MP-10's Sustainment ownership for the closure half.

**Expected Results**: The application is honest about the strength of this chain's own justification, not just functionally correct.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-09 — E2E-ERP: ERP Implementation Lifecycle

**Status of Related E2E Process**: CR1 transformation-type extension.

**Related Macro Processes**: MP-01 → MP-02 → MP-03 → MP-05 → MP-07 → MP-09 → MP-10.

**Related Modules**: M18 Process Registry, M17 WBS & Gantt.

**Trigger**: ERP project charter approved, Executive Sponsor confirmed (Week 1, same trigger as UAT-00/UAT-01).

**Goals**: Confirm the type-level registry entry, its SIPOC, and its 8-phase template correctly roll up everything UAT-00 through UAT-06 already exercised across the full 64-week program.

**Detailed Numbered Steps**:

1. **(Week 1)** Open **M18 · Process Registry**, Transformation-Type Lifecycle group, and locate **E2E-ERP**. Confirm composition MP-01 → MP-02 → MP-03 → MP-05 → MP-07 → MP-09 → MP-10, SIPOC Suppliers (Executive Sponsor, Program/Project Manager, Change Manager), Customers (Steering Committee, End Users, Sustainment Team), phase template **TPL-ERP-8**.
2. Confirm the composition names exactly the macro processes exercised across UAT-01 through UAT-04 and UAT-06 — nothing new is introduced at the type level.
3. **(Week 1 or 9)** Open **M17 · WBS & Gantt** and click "Load phase template". Confirm TPL-ERP-8 is pre-selected with "Recommended for this project's linked Main Project and transformation type" shown, since the linked Main Project's type is `erp`.
4. Click "Load into PM track". Confirm the 8 phases (Discovery, Design, Build, Test, Train, Deploy, Hypercare, Sustain) are added as one skeleton task each, 30 days apart.
5. **(Week 64)** At program close, confirm the loaded phase-template tasks and every Phase Gate created across UAT-06's instances (Weeks 8/16/27/35/43) coexist in the same WBS view without conflict.

**RACSI**: R=CM, A=ES, C=PM/FPO, S=SUP, I=ITL/EU — the same RACSI as UAT-01/04, since E2E-ERP is the roll-up of those chains.

**Expected Results**: The "Recommended" flag on TPL-ERP-8 is driven by the linked Main Project's real `type` field, not hardcoded.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-10 — E2E-BPR: Business Process Reengineering Lifecycle

**Related Macro Processes**: MP-01→02→03→05→07→08→09→10. **Related Modules**: M18, M17, M10. **Trigger**: Redesigned process approved and old-process retirement date set.

**Goals**: Registry entry, SIPOC and phase template TPL-BPR-7 (P1 Intake & Diagnosis → P2 Clean-Slate Design → P3 Build → P4 Pilot → P5 Rollout → P6 Stabilization → P7 Sustainment) verified against the Maghreb Logistics Hub clean-slate fulfillment redesign (`cm-maghreb-bpr`) — this project genuinely is a BPR case, unlike the ERP scenario.

**Detailed Numbered Steps**:

1. Switch Organization to Maghreb Logistics Hub, Project to the BPR case. Open **M18** and locate **E2E-BPR**; confirm SIPOC (Executive Sponsor / Functional Process Owners / Change Manager → Steering Committee / Process Owner / End Users) and TPL-BPR-7.
2. Open **M17** Phase Template picker; confirm TPL-BPR-7 recommended, TPL-ERP-8 is not.
3. Open **M10 · Resistance**; confirm the seeded barrier about Dispatch Planners' dissolved role — BPR-shaped resistance, distinct from an ERP adoption barrier.

**RACSI**: Per E2E-BPR's own SIPOC roles (Executive Sponsor / Functional Process Owners / Change Manager).

**Expected Results**: All three checks pass against real seeded data for this project, not invented data.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-11 — E2E-BPA: Business Process Automation Lifecycle

**Related Macro Processes**: MP-01→02→03→05→07→08→09→10. **Related Modules**: M18, M17, M13. **Trigger**: Automation solution approved for full-volume deployment.

**Goals**: Registry entry, SIPOC and phase template TPL-BPA-7 (P1 Automation-Opportunity Assessment → P2 Architecture Design → P3 Build → P4 UAT & Shadow-Mode → P5 Production Go-Live → P6 Exception Tuning → P7 CoE Handover) verified against the Atlas Automation Adoption Track (`cm-atlas-auto`).

**Detailed Numbered Steps**:

1. Switch Project to Atlas Automation Adoption Track. Open **M18** and locate **E2E-BPA**; confirm SIPOC (Executive Sponsor, IT/Technical Lead, Functional Process Owner → Steering Committee, Center of Excellence, End Users) and TPL-BPA-7.
2. Open **M17** Phase Template picker; confirm TPL-BPA-7 recommended.
3. Open **M13 · Risk Register**; confirm "Resistance driven by perceived job loss rather than skill or awareness gaps" (16 score) is present.

**RACSI**: Per E2E-BPA's SIPOC roles.

**Expected Results**: This project's own risk profile is distinct from, but comparable to, the ERP scenario's saturation risk.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-12 — E2E-IMS: Integrated Management System Lifecycle

**Related Macro Processes**: MP-01→02→03→05→07→08→09→10. **Related Modules**: M18, M12. **Trigger**: QHSE management system design approved, certification audit scheduled.

**Goals**: Registry entry, SIPOC and phase template TPL-IMS-7 (P1 Intake & Diagnosis → P2 Design → P3 Implementation → P4 Mock-up Audit → P5 Certifying Audit → P6 Surveillance Prep → P7 Ongoing Surveillance) verified against the Atlas Quality Culture Program (`cm-atlas-qms`).

**Detailed Numbered Steps**:

1. Switch Project to Atlas Quality Culture Program. Open **M18** and locate **E2E-IMS**; confirm SIPOC (Certification Body, Functional Process Owners, Change Manager → Steering Committee, Quality Function, External Auditor) and TPL-IMS-7's P4/P5 audit-gate phases.
2. Open **M12 · Sustainment**; confirm the 30- and 60-day checkpoints are already complete (78%/84% adoption).
3. Open the lessons-learned list; confirm the seeded lesson displays status **Pending** (no linked Rule/Control/Charter) — the REX gate exercised from the read side.

**RACSI**: Per E2E-IMS's SIPOC roles.

**Expected Results**: A second reference point (beyond UAT-04) for what a completed checkpoint and an un-closed REX lesson both look like.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-13 — E2E-CULT: Cultural / Values Transformation Lifecycle

**Related Macro Processes**: MP-01→02→03→04→06→07→08→09→10 — the only type lifecycle routing through MP-04 and MP-06 directly. **Related Modules**: M18, M9, M12. **Trigger**: Target culture/values statement approved by leadership.

**Goals**: Registry entry, SIPOC and phase template TPL-CULT-7 (P1 Diagnosis → P2 Target Values Design → P3 Leadership Modeling & Reinforcement Build → P4 Pilot Cohort → P5 Organization-Wide Rollout → P6 Reinforcement Through Skepticism → P7 Institutionalization) verified against the Atlas Safety-First Leadership Culture Program (`cm-atlas-safety-culture`).

**Detailed Numbered Steps**:

1. Switch Project to Atlas Safety-First Leadership Culture Program. Open **M18** and locate **E2E-CULT**; confirm composition explicitly includes MP-04 and MP-06 — the only type-lifecycle row that does.
2. Open **M9 · Training**; confirm no curriculum/certification records dominate this project the way they do the ERP scenario — coaching-led, not classroom-led.
3. Open **M12 · Sustainment**; confirm 30-/60-day checkpoints complete (62%/71%) with 90-day still due — a third independent checkpoint reference alongside UAT-04 (not yet reached) and UAT-12 (complete through 60-day).

**RACSI**: Per E2E-CULT's SIPOC roles (Executive Sponsor, HR Business Partner, Change Manager).

**Expected Results**: The composition and the data both confirm this project is coaching/resistance-led, not training-led.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-14 — E2E-OM: Operating Model Redesign Lifecycle

**Related Macro Processes**: MP-01→02→03→05→07→08→09→10. **Related Modules**: M18, M10. **Trigger**: New organizational structure and governance model approved.

**Goals**: Registry entry, SIPOC and phase template TPL-OM-7 (P1 Current Operating Model Assessment → P2 TOM Design → P3 Detailed Org Design → P4 Pilot Transition → P5 Full Transition → P6 Governance Adoption Tracking → P7 Standing Rhythm Handover) verified against the Maghreb Logistics Hub regional operating committee redesign (`cm-maghreb-om`).

**Detailed Numbered Steps**:

1. Switch Organization to Maghreb Logistics Hub, Project to the Operating Model case. Open **M18** and locate **E2E-OM**; confirm SIPOC (Executive Sponsor, Function Heads, HR Business Partner → Steering Committee, Standing Operating Committee, All Employees) and TPL-OM-7.
2. Open **M10 · Resistance**; confirm the seeded barrier about Hub Managers' perceived loss of decision authority — governance-authority resistance, not system-adoption resistance.

**RACSI**: Per E2E-OM's SIPOC roles.

**Expected Results**: This project's resistance data is authority-shaped, distinct from every other seeded project in this plan.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-15 — E2E-COMP: Compliance-Driven Change Lifecycle

**Related Macro Processes**: MP-01→02→03→05→07→08→09→10. **Related Modules**: M18. **Trigger**: Regulatory requirement confirmed with a fixed, non-negotiable enforcement date.

**Goals**: Registry entry, SIPOC and phase template TPL-COMP-7 (P1 Regulatory Requirement & Gap Analysis → P2 Control Design → P3 Control Implementation → P4 Internal Audit / Independent Testing → P5 Controls Go Live → P6 First Monitoring Cycle → P7 Ongoing Compliance Handover) verified against the Meridia Health Network patient-consent workflow program (`cm-meridia-comp`).

**Detailed Numbered Steps**:

1. Switch Organization to Meridia Health Network, Project to the Compliance case. Open **M18** and locate **E2E-COMP**; confirm SIPOC (Legal/Compliance, Functional Process Owners, Change Manager → Steering Committee, Compliance Function, Regulator) and TPL-COMP-7.
2. Open the journey events/timeline; confirm the seeded "Regulatory enforcement date" milestone (Day +240) has no flexibility noted, contrasting with the ERP scenario's own go-live, which UAT-04 was free to advance through checkpoints at will.

**RACSI**: Per E2E-COMP's SIPOC roles.

**Expected Results**: A compliance deadline is not something Sustainment sign-off timing can be negotiated around, and the seeded data reflects that.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

---

### UAT-16 — E2E-TSD: Training & Skills Development Lifecycle

**Related Macro Processes**: MP-01→02→03→05→06→07→08→09→10 — the only type lifecycle other than CULT routing through MP-06. **Related Modules**: M18, M19. **Trigger**: Skills-gap analysis approved as the primary driver of the initiative.

**Goals**: Registry entry, SIPOC and phase template TPL-TSD-7 (P1 Skills Gap Diagnosis → P2 Curriculum Design → P3 Training Delivery → P4 Competency Verification → P5 Practical Application → P6 On-the-Job Coaching → P7 Skills Sustainment) verified against Atlas Tangier's digital-literacy certification program (`cm-atlas-tangier-tsd`).

**Detailed Numbered Steps**:

1. Switch Organization to Atlas Industrial Group — Tangier Free Zone Plant, Project to the Training & Skills case. Open **M18** and locate **E2E-TSD**; confirm composition includes MP-06 and SIPOC (Training Lead, Functional Process Owners, Change Manager → Steering Committee, End Users, Business-as-Usual Owner).
2. Open **M19 · CM Charters**, Mentoring Progression tab; confirm the 3-stage model (MENT-01 Trainee → MENT-02 Observer → MENT-03 Autonomous) — the natural fit for this project type.
3. Open the journey events/timeline; confirm the seeded digital-literacy baseline, floor walk, first certification cohort (Day +30) and all-operator certification target (Day +120) — a self-contained certification narrative distinct from the ERP scenario's broader program.

**RACSI**: Per E2E-TSD's SIPOC roles.

**Expected Results**: Every element specific to this type — the MP-06 inclusion, the Mentoring model, the certification-only timeline — is present and internally consistent.

**Status** (tester to check one): ☐ Pass ☐ Fail ☐ Blocked ☐ In Progress ☐ Not Run ☐ Deferred

**Responses / Tester Comments**: _________________________________________________________________________

**Attached Documents (if required)**: _________________________________________________________________________

## 6. Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| Change Manager (tester) | | | |
| QA / UAT Lead | | | |
| Product Owner | | | |

**Overall Result**: ☐ Accepted ☐ Accepted with noted defects ☐ Rejected

**Notes**:

