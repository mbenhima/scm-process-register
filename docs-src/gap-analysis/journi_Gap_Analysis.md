# journi — Gap Analysis

**Comparing the delivered application against the requirement source set**

Prepared for POWERACT Consulting — Chief Innovation Officer, Mounire
Prepared by: Claude (development session)
Date: August 2026

---

## Purpose and Sources

This report compares journi's **current implementation** (the application in `journi/`, as described by `journi_spec.md` v1.4) against the requirement source set supplied across this engagement:

| # | Source | What it is |
|---|---|---|
| 1 | `01_CR1_E2E_addendum.docx` | The Change Request that extended journi from 3 to 8 transformation types, each with a Default E2E Process and Phase Template. **Already fully implemented** in a prior session. |
| 2 | `02__journi_EndtoEnd_Process_Catalogue.docx` (v1.1) | The narrative catalogue of all 16 End-to-End (E2E) processes — the 4 registered core chains, 4 proposed cross-cutting loops, and 8 transformation-type lifecycles — each with description, related macro processes/modules, stakeholders, a BPMN-style flow, and a RASCI table. |
| 3 | `journi — Framework Interaction Map v2.3.docx` | The framework-to-framework interaction model; Section 11 is the authoritative source for the 4 core E2E processes' macro-process composition. |
| 4 | `journi_Deliverables_D01-D10_D15_D26.xlsx` | Macro Processes, Tasks/Steps, Business Rules, Actions Registry, Controls, Risks, KPI Library, Alerts, Reports, Info Model, Data Dictionary, AI Use Cases + governance, Modules & Tiers. |
| 5 | `journi_Deliverables_D11-D29_ExclD15D26.xlsx` | Tools/Interfaces, Physical Data Model, **Application Requirements (D13 — the master REQ-001–REQ-024 traceability list)**, BPMN Orchestration, Tenant Hierarchy, Catalogs, Components, Automation Decision, Project Registry, Org Profile, Journey Stage Templates, Charters (D31 family), Journeys/Touchpoints/Analytics (D27–D29), and the WBS/Phase governance family (D32a–D32k). |
| — | `CD_D30_Licensing_Implementation_Schema.docx` | Cross-referenced where relevant (License & Plan panel, Module 2). |

**Standing architectural note, carried forward from `journi_spec.md` Section 2.4:** journi is deliberately a **client-side-only** reference build (browser `localStorage`, no backend). Several source documents — most visibly D02–D05, D09–D12, D14, D18–D20, and REQ-024 itself — describe a server-backed platform with a BPMN/DMN workflow engine, a COSO-style control-testing framework, and durable server persistence. That gap is **by design and already documented**, not re-litigated item-by-item below; it is called out once, in Section 6.

---

## 1. Executive Summary

Of the 24 requirements in D13 (the master Application Requirements list), journi's current build:

- **Fully implements 14** (58%)
- **Partially implements 2** (8%)
- **Does not implement 6** (25%), of which one (REQ-024, server-side persistence) is an intentional architectural divergence rather than an oversight
- **1 requirement's realization needs correction**, not just completion (REQ-022 — see Finding A below)
- **1 requirement's underlying data model is itself internally inconsistent across sources** (the transformation-type count — see Finding B below)

Beyond the REQ-001–024 list, the D11–D29 deliverable pack introduces three entire capability domains journi does not yet have any equivalent of: **CM Charters** (D31 family), the **Stakeholder Journey / Touchpoint / Journey-Analytics layer** (D27–D29), and a small set of governance refinements to the Phase Gate feature built last session (weighted checklist items, a flexible rather than fixed Accountable role, a distinct Project/Change/Joint tag). These are documented in Section 4.

Before the requirement-by-requirement table, two findings need to be read first, because they affect how several "gaps" below should actually be closed.

---

## 2. Critical Source-Consistency Findings

### Finding A — The 4 core E2E processes (E2E-01–04) that journi currently implements are the *superseded* version

`journi/src/data/e2eProcesses.js`, built in the prior session directly from the End-to-End Process Catalogue and CR1, currently registers:

| E2E ID | journi's current composition | Corrected composition (D32h, sourced verbatim from Framework Interaction Map v2.3 §11) |
|---|---|---|
| E2E-01 | MP-01 → MP-02 → MP-03 | MP-01, MP-02, MP-03, **MP-06, MP-07** |
| E2E-02 | MP-05 → MP-06 → MP-07 | MP-05, **MP-08**, MP-07 (MP-06 removed) |
| E2E-03 | MP-04 → MP-08 → MP-09 | MP-04, **MP-06**, MP-07, MP-09 (MP-08 removed) |
| E2E-04 | MP-10 only | MP-09, MP-10, **MP-07** |

D32h in the D11–D29 pack is explicitly titled "**Corrected**" and states outright: *"the prior revision listed only MP-01→MP-02→MP-03 and omitted MP-06/MP-07, which the authoritative source includes"* (and equivalent corrections for E2E-02 through E2E-04). The names also changed: **E2E-02 → "Capability & Divergence Management"** and **E2E-04 → "Adoption-to-Sustainment (Go-Live → Refreeze)"**.

**Why this happened:** last session, when the Process Catalogue was only partially available, I treated the *original* Process Catalogue registration as authoritative over the Framework Interaction Map v2.3, because the Catalogue explicitly stated its own compositions were "formally registered today in D32h." The D11–D29 pack now shows that registration itself was wrong, and has been corrected against the Framework Interaction Map directly.

**Also affected:** the RASCI/RACSI role breakdown per core E2E process (D32h carries full R/A/C/S/I columns per chain, e.g. E2E-01: R=CM, A=ES, C=FPO+PM, S=SUP, I=EU) — journi's `e2eProcesses.js` currently has no RACSI assignment at the individual-chain level at all (only the platform-wide MP-by-MP RACSI grid in Module 19 exists).

**Recommendation:** update `e2eProcesses.js`'s four core entries to the corrected compositions/names above, and add per-chain RACSI to each. This is a data-only fix (no new UI), low effort, high correctness value.

### Finding B — The requirement documents disagree on whether there are 7 or 8 transformation types

This is the single most consequential inconsistency in the source set, because journi's entire CR1 implementation (already shipped) is built on the 8-type answer.

**The 8-type side** (CR1 addendum + End-to-End Process Catalogue v1.1, both of which journi currently follows):
ERP, Business Process Reengineering, Business Process Automation, Integrated Management System (QMS), Cultural/Values Transformation, Operating Model Redesign, Compliance-Driven Change, **Training & Skills Development** — each with its own E2E chain (E2E-ERP…E2E-TSD) and, per CR1, its own Phase Template (TPL-TSD-7 included).

**The 7-type side** (D13, D17 CAT-09, D21 Project Registry, D32b Phase Template Library, D32i Cross-Type Matrix — all in the D11–D29 pack):
The same list **minus Training & Skills Development**. D21's Project Registry seed data stops at PRJ-013 (Compliance-Driven Change) with no Training & Skills Development project. D32b's Phase Template Library defines only 7 templates and states explicitly that Business Process Automation runs on the **generic** 7-phase Common Lifecycle template (`TPL-CL-7`) rather than a dedicated one — journi currently has a dedicated `TPL-BPA-7`. D32i's Cross-Type Comparison Matrix likewise has only 7 rows.

journi's current implementation (8 types, dedicated BPA and TSD templates) matches the CR1/Catalogue side and diverges from the D13/D17/D21/D32b/D32i side. **This is not a bug to silently fix** — it is a genuine conflict between two parts of the source set that were evidently authored or revised at different times without being reconciled against each other. It needs a product decision:

- **Option 1 — Keep 8 types** (current state). Treat D21/D32b/D32i as not-yet-updated for the CR1 addendum, and flag them back to the source for correction.
- **Option 2 — Drop to 7 types.** Remove `training_skills` as an archetype, retire `TPL-TSD-7` and the Atlas Tangier training-skills seed case, and fold Business Process Automation onto the generic Common Lifecycle template instead of its own `TPL-BPA-7`.

No action taken in this report; flagged for a decision before either side is touched further.

### Finding C (minor) — "RACSI" vs "RASCI" naming

The Integration Handbook and D32h/D17 CAT-02 use **RACSI** (Responsible / Accountable / Consulted / Sign-off / Informed) — this is what journi's Module 19 grid implements. The End-to-End Process Catalogue's own per-process diagrams are titled "**BPMN Diagram — RASCI**" (swapping the C/S order in the acronym, though the underlying five roles are the same). Cosmetic, but worth a single find-and-replace pass in the source documents for internal consistency.

---

## 3. Requirement-by-Requirement Status (D13)

Legend: ✅ Implemented · 🟡 Partial · ❌ Not implemented · ⚪ Not applicable (architectural choice, documented)

| REQ | Feature | Status | Evidence / Notes |
|---|---|---|---|
| REQ-001 | Stakeholder Impact Scoring (AI-drafted) | ✅ | Module 5 impact grid + `uc-stakeholder-impact` AI use case, human-confirm gate. |
| REQ-002 | Individual & Cohort ADKAR Scoring | ✅ | Module 6, `ADKAR_BLOCKS`, `readinessIndex()` (KPI-001 equivalent). |
| REQ-003 | AI-Assisted Barrier Root-Cause Classification | ✅ | Module 11 + `uc-adkar-barrier`/resistance classifier use cases. |
| REQ-004 | Automated Divergence Pattern Check | ✅ | `hasDivergence()` in `utils/compute.js`, surfaced in Module 7/14 and now also in the Phase Gate's auto-populated open flags (Module 18). |
| REQ-005 | Post-Go-Live Regression Audit (AI risk score) | 🟡 | Module 13 sustainment checkpoints capture `adoptionRate`/`regressionRisk`, but these are **manually entered**, not an AI-generated score (KPI-006's "Regression Risk Predictor, AIUC-14" has no corresponding use case in journi's seeded AI catalog). |
| REQ-006 | Human-in-the-Loop AI Checkpoint Enforcement | ✅ | Universal accept/edit/reject pattern (`AiSuggestionBox`), audited via `aiUsageLog`. |
| REQ-007 | Custom AI Use Case Authoring (Org Admin, with approval workflow) | ❌ | No authoring UI; the AI Use Case Library (Module 17) is a fixed, seeded 16-entry catalog. |
| REQ-008 | Prompt Template Versioning & Override | ❌ | No prompt-template registry or per-project override exists. |
| REQ-009 | Runtime-Configurable Permission Matrix | ✅ | Module 2 Permission Matrix tab, `data.rolePermissions`. |
| REQ-010 | Mandatory Justification on Score/State Change | ✅ | Module 2 Governance Settings, `requireJustification`, `logJustifiedChange()`. |
| REQ-011 | Phase Gate Go/No-Go Decision | ✅ | Module 18 Phase Gate feature (built last session). |
| REQ-012 | CM Charter Registry (D31 family) | ❌ | No equivalent exists anywhere in journi. See Section 4. |
| REQ-013 | Stakeholder Journey & Touchpoint Tracking | 🟡 | Module 16 has a visual per-person/cohort event timeline, but not the structured Journey→Touchpoint model with `Success_Criteria`/`Evidence_Required` fields D27/D28 specify. |
| REQ-014 | Multi-Tenant Hierarchy Management | ✅ | Module 1, Group/Organization/Project, cascading delete. |
| REQ-015 | Journey Analytics Dashboard | ❌ | None of D29's 5 dashboards exist; Module 15 is score-centric only, no experience/touchpoint-completion view. |
| REQ-016 | Phase Template Library | ✅ | Module 18 "Load phase template," `phaseTemplates.js` (built last session — see Finding B for the 7-vs-8 count question). |
| REQ-017 | Phase Checklists (PM + CM) | ✅ | Module 18 Phase Checklist section (built last session). Simpler than D32c: items are unweighted (D32c specifies a `Weight_%` per item); journi treats every item as equal weight. |
| REQ-018 | Joint Decision Records | ✅ | Module 18 Phase Gate modal — PM/CM inputs captured independently, fused decision, single Accountable role. One gap vs. D32e/JD-05: journi **hardcodes** Accountable = "PM," where the spec allows it to be any single role, potentially different from either input's author. |
| REQ-019 | PMO Import Hook (CSV) | ❌ | No import feature; WBS tasks are entered manually or via "Load phase template" only. |
| REQ-020 | Project/Change/Joint Tagging on WBS tasks | ❌ | journi's WBS `track` field (`pm`/`cm`/`framework`) conflates delivery track with accountability tag; D32a specifies these as two distinct fields (`Task_Track` and `Project_Change_Joint_Tag`). |
| REQ-021 | Common-Lifecycle Phase Tagging (P1–P7, cross-module filter) | 🟡 | The `phase` field exists on every WBS task (free text, not a constrained P1–P7 enum) and on Phase Checklists/Gates, but no other module (M4–M17) carries or filters by it — D32g's "filter any module's data by the same P1-P7 phase" is not realized. |
| REQ-022 | End-to-End Process Registry | 🟡 | Module 19 built and functioning, **but registers the superseded E2E-01–04 compositions** — see Finding A. Data-model fix required, not a missing feature. |
| REQ-023 | Cross-Type Comparison Matrix | ❌ | No dedicated UI. `e2eProcesses.js` links a `phaseTemplateId` per type but does not carry `Typical_Duration`/`Terminal_Gate`/`External_Party_Involvement`/`Dominant_Framework`/`Reversibility`, and there is no comparison view on Module 15 as D32i specifies. |
| REQ-024 | Server-Side Persistence | ⚪ | Deliberate architectural choice (`journi_spec.md` §2.4); browser `localStorage` only. Not a gap to close without a scope conversation — it's the single foundational assumption every other REQ-024-adjacent row (durability, multi-device, backup) silently depends on. |

---

## 4. Gaps Beyond the REQ-001–024 List

### 4.1 CM Charters (D31, D31a, D31b, D31c) — entirely new capability, not present in journi

The D11–D29 pack defines **8 charters** (Sponsorship/Leadership, Participative Management, Communication, Organizational Impact, Team Coaching, One-to-One Coaching, Mentoring [Trainee→Observer→Autonomous], Pulse/Interview) — each a structured PDCA-governed commitment with a named accountable role, a many-to-many action mapping to specific macro-process tasks/steps (D31a, ~30+ rows), a CRUD/RBAC layer (D31b), and a 3-stage mentoring progression model (D31c). None of this exists in journi today; it is a distinct governance layer sitting above the existing modules (e.g., CHTR-01 Sponsorship Charter governs the same MP-02 territory as Module 8, but as a signed, trackable commitment rather than free-text sponsor-visibility notes).

**Scope note:** this is a substantial addition — closer in size to Module 19 than to a single field. If pursued, it would reasonably become its own module (a natural "Module 20").

### 4.2 Stakeholder Journeys, Touchpoints & Journey Analytics (D27, D28, D29)

8 named personas journeys (End User, Executive Sponsor, Frontline Supervisor, Champion, Mentee, Divergence Case, QMS Certification, AI Suggestion Lifecycle), each broken into touchpoints carrying `Days_From_Trigger`, `Automation_Level`, `Success_Criteria`, and `Evidence_Required` — plus 5 dedicated analytics dashboards (End User Journey Completion, Sponsor & Charter Compliance, Mentoring Progression, Divergence Case Resolution, Journey Analytics Executive Roll-Up). Module 16's existing Journey Map is the closest analog but is a simpler visual timeline without the touchpoint/success-criteria/evidence structure or any of the 5 dashboards.

### 4.3 Refinements to the Module 18 Phase Gate / Checklist feature (small, targeted)

These are precise deltas against D32a/c/d/e now that the field-level specs are available (they weren't when the feature was built last session from CR1 alone):

- Weighted checklist items (`Weight_%` per item) instead of equal-weight completion %.
- Accountable role on a Phase Gate should be **selectable** (any single role), not hardcoded to "PM."
- WBS tasks need a distinct `Project_Change_Joint_Tag` (Project/Change/Joint) separate from the existing `track` field (REQ-020).
- Common-Lifecycle Phase should be a constrained P1–P7 enum, filterable across other modules (REQ-021), not free text scoped to Module 18 alone.

### 4.4 Cross-Type Comparison Matrix (REQ-023 / D32i) — repeated here as a concrete build target

A filterable table/view — proposed location: a new tab on Module 15 — comparing the 7 or 8 transformation types (pending Finding B) on Typical Duration, Terminal Gate, External Party Involvement, Dominant Framework, and Reversibility, each row citing its seed-project example.

### 4.5 Report export formats & Alerts/notification channels (D07, D08)

No PDF/Excel/CSV/PowerPoint export exists anywhere in journi (confirmed: `package.json` has no export library — `react`, `react-dom`, `react-router-dom` only), where D08 specifies export formats per report. Similarly, D07's 7 alerts specify escalation via Email/Push/Teams notification channels; journi's equivalent conditions (e.g., divergence detected, sponsor coverage gap) surface only as in-app badges/flags, with no outbound notification of any kind. Both are consistent with the client-side-only architecture (Finding, Section 6) — a notification channel needs a backend to send from — but are worth naming explicitly since D07/D08 assume them.

---

## 5. What's Fully Aligned

For balance: the following areas are in strong, verified alignment with the source set, most of it delivered in the prior CR1 implementation session and re-verified in this analysis:

- **CR1's 8-transformation-type expansion** (Finding B's "which side is right" question aside, the *mechanism* — archetype → Default E2E Process → Phase Template — is correctly built and functioning).
- **Modules 1–17** (hierarchy, RBAC, initiative registry, ADKAR, Bridges/Kübler-Ross, sponsor/coalition, communications, training, resistance, coaching, sustainment, risk register, analytics, journey map, AI governance) match D01–D10/D15/D26 at the functional level, modulo the BPMN/DMN/COSO infrastructure layer discussed in Section 6.
- **Module 18** WBS/Gantt + Phase Templates + Phase Checklists + Phase Gates/Joint Decision Records — REQ-011, 016, 017, 018 all functioning end-to-end, verified via Playwright.
- **Module 19** Macro Process catalog + E2E Registry browser + editable RACSI grid — structurally correct (REQ-022), pending Finding A's data correction.
- **License & Plan panel** (Module 2) — a proportionate, correctly-scoped reflection of D30's licensing model for a client-side app (SaaS/OnPrem mode, `.lic` upload, feature flags), not the literal Ed25519/Firebase SDK D30 specifies for a server-backed deployment.
- **13 (or 14, pending Finding B) seed projects** — `journi_Deliverables_D01D10_D15_D26.xlsx`'s D21 Project Registry IDs (PRJ-001–013) match journi's seeded case set 1:1 by name, type, and organization.

---

## 6. Architectural Divergence, By Design (not re-scored above)

The following source material describes infrastructure a **server-backed, enterprise-deployed** journi would have, which the current **client-side, browser-only reference build** intentionally does not implement. This is documented in `journi_spec.md` Section 2.4 and is not treated as a per-item gap in Section 3:

- **D02/D03 BPMN/DMN workflow and decision-table engine** — journi's business logic (justification gating, divergence detection, competency thresholds) is implemented directly in JavaScript (`utils/compute.js`, `utils/rbac.js`), not as executable BPMN processes or DMN decision tables with hit-policies and audit-grade rule versioning.
- **D04 Controls / COSO control-testing framework** — no formal control-testing cadence, evidence-retention period, or "Line of Defense" model; journi's equivalent governance is the Permission Matrix + justification logging.
- **D09/D10/D12 Info Model, Data Dictionary, Physical Data Model** — journi's data shapes are plain JS objects in `localStorage`, not a normalized relational schema with foreign keys and a formal object-class catalog.
- **D14/D18/D20 BPMN Orchestration, Components, BPMN Execution Pack** — no service-oriented backend components exist to orchestrate.
- **D19/D19b Automation Decision Engine, Formula Registry** — journi's few formulas (readiness index, divergence check) are hardcoded functions, not a registered, versioned formula catalog.
- **D24/REQ-024 Server-Side Persistence** — the foundational item; every one of the above assumes it.

None of this is a defect in the delivered application — it is the documented cost of the client-side-only architecture choice, and reversing it would be a platform decision (adopt a backend), not a feature addition.

---

## 7. Recommendations, in Priority Order

**Do first (data corrections, no new UI, low effort/high correctness):**
1. Correct `e2eProcesses.js`'s four core E2E entries (E2E-01–04) to D32h's corrected macro-process compositions and names (Finding A); add per-chain RACSI.
2. Resolve Finding B (7 vs. 8 transformation types) as a product decision, then align whichever side loses.

**Do next (small, scoped additions consistent with existing patterns):**
3. Build the Cross-Type Comparison Matrix (REQ-023/D32i) as a Module 15 tab.
4. Add `Project_Change_Joint_Tag` to WBS tasks (REQ-020) and promote `phase` to a constrained P1–P7 enum filterable from other modules (REQ-021).
5. Make Phase Gate Accountable role selectable rather than hardcoded (D32e/JD-05); add per-item checklist weighting (D32c).

**Consider as a larger, separately-scoped addition:**
6. CM Charters (D31 family) — likely its own module.
7. Stakeholder Journey/Touchpoint model + the 5 Journey Analytics dashboards (D27–D29) — a substantial extension of Module 16/15.

**Explicitly out of scope without a platform decision:**
8. Server-side persistence, BPMN/DMN workflow engine, COSO control-testing framework, report export formats, outbound alert notifications — all downstream of "does journi get a backend," which is a scope conversation, not an implementation task.
