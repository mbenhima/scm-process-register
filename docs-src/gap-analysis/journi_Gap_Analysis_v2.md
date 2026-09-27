# journi — Gap Analysis (v2)

**Comparing the delivered application against the full requirement source set**

Prepared for POWERACT Consulting — Chief Innovation Officer, Mounire
Prepared by: Claude (development session)
Date: August 2026 · Supersedes the v1 Gap Analysis (this version incorporates it in full, plus five additional sources)

---

## Table of Contents

- [Purpose and Sources](#purpose-and-sources)
- [1. Executive Summary](#1-executive-summary)
- [2. Critical Source-Consistency Findings](#2-critical-source-consistency-findings)
  - [Finding A — The 4 core E2E processes](#finding-a)
  - [Finding B — 7 vs. 8 transformation types](#finding-b)
  - [Finding C — "RACSI" vs "RASCI" naming](#finding-c)
  - [Finding D — The Solution Architecture deck's own headline requirement count is stale](#finding-d)
- [3. Requirement-by-Requirement Status (D13)](#3-requirement-by-requirement-status-d13)
- [4. Gaps Beyond the REQ-001–024 List](#4-gaps-beyond-the-req-001024-list)
  - [4.1 CM Charters](#41-cm-charters)
  - [4.2 Stakeholder Journeys, Touchpoints & Journey Analytics](#42-stakeholder-journeys-touchpoints--journey-analytics)
  - [4.3 Refinements to the Module 18 Phase Gate / Checklist feature](#43-refinements-to-the-module-18-phase-gate--checklist-feature)
  - [4.4 Cross-Type Comparison Matrix](#44-cross-type-comparison-matrix)
  - [4.5 Report export formats & Alerts/notification channels](#45-report-export-formats--alertsnotification-channels)
  - [4.6 REX Institutionalization Log (D25)](#46-rex-institutionalization-log-d25)
  - [4.7 Project Context Overlay (D24)](#47-project-context-overlay-d24)
  - [4.8 AI Engine Specifications — NLP Theme-Mining & Qualitative Coding Workbench (D32j, D32k)](#48-ai-engine-specifications--nlp-theme-mining--qualitative-coding-workbench-d32j-d32k)
  - [4.9 Enterprise SSO / Identity Integration (D11 IFC-14)](#49-enterprise-sso--identity-integration-d11-ifc-14)
  - [4.10 Tenant/Organization seeding structure (D16)](#410-tenantorganization-seeding-structure-d16)
- [5. What's Fully Aligned](#5-whats-fully-aligned)
- [6. Architectural Divergence, By Design](#6-architectural-divergence-by-design-not-re-scored-above)
- [7. Recommendations, in Priority Order](#7-recommendations-in-priority-order)
- [Appendix — Document Set Reconciliation Map](#appendix--document-set-reconciliation-map)

---

## Purpose and Sources

This report compares journi's **current implementation** (the application in `journi/`, as described by `journi_spec.md` v1.4) against the **complete** requirement source set supplied across this engagement — the five documents behind the first gap analysis, plus five more supplied since:

| # | Source | What it is | Analyzed in |
|---|---|---|---|
| 1 | `01_CR1_E2E_addendum.docx` | The Change Request that extended journi from 3 to 8 transformation types, each with a Default E2E Process and Phase Template. **Already fully implemented.** | v1 |
| 2 | `02__journi_EndtoEnd_Process_Catalogue.docx` (v1.1) | The narrative catalogue of all 16 End-to-End (E2E) processes — 4 registered core chains, 4 proposed cross-cutting loops, 8 transformation-type lifecycles. | v1 |
| 3 | `journi — Framework Interaction Map v2.3.docx` | The framework-to-framework interaction model; §11 is the authoritative source for the 4 core E2E processes' composition. | v1 |
| 4 | `journi_Deliverables_D01-D10_D15_D26.xlsx` | Macro Processes, Tasks/Steps, Business Rules, Controls, Risks, KPIs, Alerts, Reports, Info Model, Data Dictionary, AI Use Cases, Modules & Tiers. | v1 |
| 5 | `journi_Deliverables_D11-D29_ExclD15D26.xlsx` | Tools/Interfaces, Physical Data Model, **Application Requirements (D13 — the master REQ-001–024 list)**, BPMN Orchestration, Charters (D31 family), Journeys (D27–D29), WBS/Phase governance (D32a–D32k). | v1 |
| 6 | `CD_D30_Licensing_Implementation_Schema.docx` | The `LicenceProvider` abstraction, SaaS/OnPrem dual-mode licensing, `.lic` file format, hardware binding, signing tool. | v1 (light), **v2 (deep-dive)** |
| 7 | `Integration_Handbook.docx` | REST API surface, module-to-macro-process ownership map, event/webhook interface, canonical integration payload classes. | v1 (light, via M19 build), **v2 (deep-dive)** |
| 8 | `journi_ERP_User_Guide_POWERACT.docx` | A 12-month, week-by-week operational playbook for running an ERP implementation *on* journi — SIPOC/Task/Step/RACSI detail per phase. | **v2 (new)** |
| 9 | `journi_Transformation_Aditional_Types_User_Guide_POWERACT.docx` | The equivalent operational playbook for the other **six** transformation types, plus the Common Transformation Lifecycle (P1–P7) and the Cross-Type Comparison Matrix source data. | **v2 (new)** |
| 10 | `Solution_Architecture_Presentation.pptx` | A 57-slide, application-agnostic architecture deck synthesizing all 46 deliverables (D01–D32k) into one traceability narrative, with headline metrics, integration patterns, and a wave-based implementation roadmap. | **v2 (new)** |

**Standing architectural note, unchanged from v1:** journi is deliberately a **client-side-only** reference build (browser `localStorage`, no backend). Several source documents describe a server-backed platform with a BPMN/DMN workflow engine, a COSO-style control-testing framework, and durable server persistence. That divergence is **by design and already documented** in `journi_spec.md` §2.4; it is not re-litigated item-by-item in Section 3, and is consolidated in Section 6.

---

## 1. Executive Summary

**Scorecard, unchanged from v1** (the five new sources did not shift any REQ-001–024 status — they corroborate existing findings and add new gap areas outside that list):

- **Fully implements 14 of 24** D13 requirements (58%)
- **Partially implements 2** (8%)
- **Does not implement 6** (25%), of which one (REQ-024, server-side persistence) is an intentional architectural divergence
- **1 requirement's realization needs correction, not just completion** (REQ-022 — Finding A)
- **1 requirement's underlying data model is internally inconsistent across sources** (transformation-type count — Finding B)

**What the five new sources change:**

1. **Finding B (7 vs. 8 transformation types) is now much more heavily evidenced on the "7" side.** The Transformation Types User Guide is explicitly titled around "**The Six Transformation Types**" (plus ERP as its own guide = 7 total) and never mentions Training & Skills Development. The Solution Architecture deck's own D21 slide states "13 seed projects | 3 ERP · 3 Process Automation · 3 QMS · **4 additional transformation types**" — the same 7-type, 13-project count as D21/D32b/D32i from v1. That is now **five independent sources** (D21, D32b, D32i, the Transformation Types Guide, the Solution Architecture deck) agreeing on 7 types with no Training & Skills Development, against **two** (CR1, the Process Catalogue) specifying 8. This does not resolve the conflict — CR1 is a formal Change Request and shouldn't be silently overridden — but the weight of evidence is now clear enough to warrant a decision soon.
2. **Finding A (superseded E2E-01–04 compositions) is corroborated as a live, unresolved inconsistency, not a one-off.** The Solution Architecture deck's own example on slide 42 still cites "E2E-01 Readiness & Mobilization = MP-01 → MP-02 → MP-03" — the exact composition D32h labels "**Corrected**" and says was wrong. The correction has not propagated to every document that cites it, including one produced after D32h.
3. **A new, source-internal inconsistency was found** (Finding D): the Solution Architecture deck's own headline dashboard undercounts D13 by 9 requirements, evidence that the deck was drafted before REQ-016–024 (the whole D32-series-driven requirement set) was added and never refreshed.
4. **Five new gap areas** outside the REQ-001–024 list, none overlapping v1's findings: the REX Institutionalization Log (D25), Project Context Overlay (D24), the two AI-engine specifications behind 5 of the 16 AI use cases (D32j/D32k), Enterprise SSO/Identity integration (D11 IFC-14), and a minor structural note on how many Organizations the seed tenant hierarchy implies (D16).
5. **One confirmed strength found**: journi's Module 17 LLM Provider Connection panel matches the Integration Handbook's IFC-13 description almost verbatim (browser-local credential isolation, outbound-only call pattern) — added to Section 5.

---

## 2. Critical Source-Consistency Findings

### Finding A — The 4 core E2E processes (E2E-01–04) that journi currently implements are the *superseded* version

`journi/src/data/e2eProcesses.js`, built directly from the End-to-End Process Catalogue and CR1, currently registers:

| E2E ID | journi's current composition | Corrected composition (D32h, sourced verbatim from Framework Interaction Map v2.3 §11) |
|---|---|---|
| E2E-01 | MP-01 → MP-02 → MP-03 | MP-01, MP-02, MP-03, **MP-06, MP-07** |
| E2E-02 | MP-05 → MP-06 → MP-07 | MP-05, **MP-08**, MP-07 (MP-06 removed) |
| E2E-03 | MP-04 → MP-08 → MP-09 | MP-04, **MP-06**, MP-07, MP-09 (MP-08 removed) |
| E2E-04 | MP-10 only | MP-09, MP-10, **MP-07** |

D32h is explicitly titled "**Corrected**" and states: *"the prior revision listed only MP-01→MP-02→MP-03 and omitted MP-06/MP-07, which the authoritative source includes"* (with equivalent corrections for E2E-02–04). Names also changed: **E2E-02 → "Capability & Divergence Management"**, **E2E-04 → "Adoption-to-Sustainment (Go-Live → Refreeze)"**.

**New in v2 — this is a live, unresolved inconsistency, not a one-time fix already absorbed elsewhere in the source set.** The Solution Architecture presentation (slide 42, "NEW — MODULE 19... D32h + D32i") illustrates its own point with: *"E2E-01 Readiness & Mobilization = MP-01 -> MP-02 -> MP-03"* — the exact **uncorrected** composition D32h itself flags as wrong. Either the deck predates the correction and was never refreshed, or the correction is understood inconsistently even among the documents that reference it. Either way, journi should not treat "matching the Process Catalogue" as sufficient evidence of correctness going forward — D32h is the more authoritative, more recently revised source.

**Also affected:** per-chain RACSI (D32h carries full R/A/C/S/I columns per core E2E chain, e.g. E2E-01: R=CM, A=ES, C=FPO+PM, S=SUP, I=EU) — journi's `e2eProcesses.js` has no chain-level RACSI at all (only the platform-wide MP-by-MP grid in Module 19).

**Recommendation:** update `e2eProcesses.js`'s four core entries to the corrected compositions/names above; add per-chain RACSI. Data-only fix, no new UI, low effort, high correctness value.

### Finding B — The requirement documents disagree on whether there are 7 or 8 transformation types

The single most consequential inconsistency in the source set — journi's shipped CR1 implementation is built on the 8-type answer.

**The 8-type side** (2 sources, both already implemented in journi): CR1 addendum + End-to-End Process Catalogue v1.1 — ERP, Business Process Reengineering, Business Process Automation, Integrated Management System (QMS), Cultural/Values Transformation, Operating Model Redesign, Compliance-Driven Change, **Training & Skills Development** — each with its own E2E chain and Phase Template (`TPL-TSD-7` included).

**The 7-type side** (now **5 corroborating sources**): D21 Project Registry (13 seed projects, none for Training & Skills Development), D32b Phase Template Library (7 templates; Business Process Automation runs on the generic `TPL-CL-7`, not a dedicated one), D32i Cross-Type Comparison Matrix (7 rows), the **Transformation Types User Guide** (its own Section 4 header is literally "**The Six Transformation Types**" — plus ERP's separate guide makes 7 total; Training & Skills Development is never mentioned as a transformation type anywhere in its ~15,000-line text), and the **Solution Architecture deck** (slide 29: *"13 seed projects | 3 ERP · 3 Process Automation · 3 QMS · 4 additional transformation types"* — the same 7-type, 13-project arithmetic).

journi's current implementation (8 types, dedicated `TPL-BPA-7` and `TPL-TSD-7`) matches the 2-source side and diverges from the 5-source side. **This is still not a bug to silently fix** — CR1 is a formal, explicit Change Request, and overriding it because five *other* documents disagree would be presumptuous without a product decision. But the evidence balance is now lopsided enough that this should be resolved soon, one way or the other:

- **Option 1 — Keep 8 types** (current state). Treat D21/D32b/D32i/the Transformation Types Guide/the Solution Architecture deck as not-yet-updated for CR1, and route the correction back to those five sources.
- **Option 2 — Drop to 7 types.** Remove `training_skills` as an archetype, retire `TPL-TSD-7` and the Atlas Tangier training-skills seed case, fold Business Process Automation onto the generic Common Lifecycle template instead of `TPL-BPA-7`.

No action taken in this report; flagged for a decision.

### Finding C (minor) — "RACSI" vs "RASCI" naming

The Integration Handbook and D32h/D17 CAT-02 use **RACSI** (Responsible/Accountable/Consulted/Sign-off/Informed) — what journi's Module 19 grid implements. The End-to-End Process Catalogue's own per-process diagrams are titled "**BPMN Diagram — RASCI**" (C/S order swapped in the acronym; same five roles underneath). Cosmetic; worth a single find-and-replace pass across the source documents.

### Finding D (new) — The Solution Architecture deck's own headline requirement count is stale

Slide 3 ("Solution at a Glance") and slide 19 ("D13 — Application Requirements") both state **"15 requirements | 7 P0 · 3 P1 · 5 P2."** The actual D13 sheet in `journi_Deliverables_D11-D29_ExclD15D26.xlsx` has **24 rows** (REQ-001 through REQ-024). The missing 9 — REQ-016 through REQ-024 — are precisely the requirements the D32 series was written to satisfy (Phase Templates, Checklists, Gates, Joint Decisions, PMO Import, Project/Change/Joint tagging, Common-Lifecycle phase tagging, the E2E Registry, the Cross-Type Matrix, and server-side persistence). The same deck's own Part 4b (slides 39–43) discusses the D32 series in detail and even explicitly frames it as *"closing the v1.3 gap"* — so the deck's authors clearly knew about these 9 additional requirements, but the headline dashboard slides were evidently drafted earlier and never refreshed to match. This is a documentation-currency issue internal to the source set, not a journi implementation gap — noted for completeness and because an external reviewer skimming only the deck's headline numbers would materially undercount the requirement scope.

---

## 3. Requirement-by-Requirement Status (D13)

Legend: ✅ Implemented · 🟡 Partial · ❌ Not implemented · ⚪ Not applicable (architectural choice, documented)

Unchanged from v1 — the five new sources corroborated and deepened these findings but did not shift any status.

| REQ | Feature | Status | Evidence / Notes |
|---|---|---|---|
| REQ-001 | Stakeholder Impact Scoring (AI-drafted) | ✅ | Module 5 impact grid + `uc-stakeholder-impact` AI use case, human-confirm gate. |
| REQ-002 | Individual & Cohort ADKAR Scoring | ✅ | Module 6, `ADKAR_BLOCKS`, `readinessIndex()` (KPI-001 equivalent). |
| REQ-003 | AI-Assisted Barrier Root-Cause Classification | ✅ | Module 11 + `uc-adkar-barrier`/resistance classifier use cases. |
| REQ-004 | Automated Divergence Pattern Check | ✅ | `hasDivergence()` in `utils/compute.js`, surfaced in Module 7/14 and Module 18's Phase Gate open flags. |
| REQ-005 | Post-Go-Live Regression Audit (AI risk score) | 🟡 | Module 13 checkpoints capture `adoptionRate`/`regressionRisk` **manually**; no AI-generated score (D06 KPI-006's "Regression Risk Predictor, AIUC-14" has no journi use-case counterpart). |
| REQ-006 | Human-in-the-Loop AI Checkpoint Enforcement | ✅ | Universal accept/edit/reject pattern (`AiSuggestionBox`), audited via `aiUsageLog`. |
| REQ-007 | Custom AI Use Case Authoring (Org Admin, approval workflow) | ❌ | No authoring UI; Module 17 is a fixed, seeded 16-entry catalog. |
| REQ-008 | Prompt Template Versioning & Override | ❌ | No prompt-template registry or per-project override exists. |
| REQ-009 | Runtime-Configurable Permission Matrix | ✅ | Module 2 Permission Matrix tab, `data.rolePermissions`. |
| REQ-010 | Mandatory Justification on Score/State Change | ✅ | Module 2 Governance Settings, `requireJustification`, `logJustifiedChange()`. |
| REQ-011 | Phase Gate Go/No-Go Decision | ✅ | Module 18 Phase Gate feature. |
| REQ-012 | CM Charter Registry (D31 family) | ❌ | No equivalent exists anywhere in journi. See §4.1. |
| REQ-013 | Stakeholder Journey & Touchpoint Tracking | 🟡 | Module 16's visual timeline exists but lacks D27/D28's structured Journey→Touchpoint model (`Success_Criteria`/`Evidence_Required`). |
| REQ-014 | Multi-Tenant Hierarchy Management | ✅ | Module 1, Group/Organization/Project, cascading delete. |
| REQ-015 | Journey Analytics Dashboard | ❌ | None of D29's 5 dashboards exist; Module 15 is score-centric only. |
| REQ-016 | Phase Template Library | ✅ | Module 18 "Load phase template," `phaseTemplates.js` (see Finding B re: 7-vs-8 count). |
| REQ-017 | Phase Checklists (PM + CM) | ✅ | Module 18 Phase Checklist section. Simpler than D32c: items are unweighted (D32c specifies `Weight_%` per item). |
| REQ-018 | Joint Decision Records | ✅ | Module 18 Phase Gate modal — independent PM/CM inputs, fused decision. Gap vs. D32e/JD-05: Accountable role is **hardcoded** to "PM," not selectable. |
| REQ-019 | PMO Import Hook (CSV) | ❌ | No import feature; WBS tasks are entered manually or via "Load phase template" only. |
| REQ-020 | Project/Change/Joint Tagging on WBS tasks | ❌ | journi's `track` field (`pm`/`cm`/`framework`) conflates delivery track with accountability tag; D32a specifies these as two distinct fields. **Corroborated in v2** by the ERP User Guide §3.5, which tags every one of its ~100 tasks `[PROJECT]`/`[CHANGE]`/`[JOINT]` at the task level. |
| REQ-021 | Common-Lifecycle Phase Tagging (P1–P7, cross-module filter) | 🟡 | `phase` exists on WBS tasks/Checklists/Gates as free text, not a constrained P1–P7 enum, and no other module filters by it. |
| REQ-022 | End-to-End Process Registry | 🟡 | Module 19 built and functioning, **but registers the superseded E2E-01–04 compositions** — see Finding A (now doubly corroborated in v2). |
| REQ-023 | Cross-Type Comparison Matrix | ❌ | No dedicated UI; `e2eProcesses.js` links `phaseTemplateId` per type but not `Typical_Duration`/`Terminal_Gate`/`External_Party_Involvement`/`Dominant_Framework`/`Reversibility`. |
| REQ-024 | Server-Side Persistence | ⚪ | Deliberate architectural choice (`journi_spec.md` §2.4); browser `localStorage` only. |

---

## 4. Gaps Beyond the REQ-001–024 List

### 4.1 CM Charters (D31, D31a, D31b, D31c) — entirely new capability, not present in journi

8 charters (Sponsorship/Leadership, Participative Management, Communication, Organizational Impact, Team Coaching, One-to-One Coaching, Mentoring [Trainee→Observer→Autonomous], Pulse/Interview), each a structured PDCA-governed commitment with a named accountable role, a many-to-many action mapping to specific macro-process tasks/steps (D31a), a CRUD/RBAC layer (D31b), and a 3-stage mentoring progression model (D31c). None of this exists in journi; it is a governance layer sitting above the existing modules.

**Scope note:** a substantial addition, closer in size to Module 19 than to a single field — reasonably its own module ("Module 20") if pursued.

### 4.2 Stakeholder Journeys, Touchpoints & Journey Analytics (D27, D28, D29)

8 named persona journeys, each broken into touchpoints carrying `Days_From_Trigger`, `Automation_Level`, `Success_Criteria`, and `Evidence_Required`, plus 5 dedicated analytics dashboards. Module 16's Journey Map is the closest analog but lacks the touchpoint/success-criteria/evidence structure or any of the 5 dashboards.

### 4.3 Refinements to the Module 18 Phase Gate / Checklist feature (small, targeted)

- Weighted checklist items (`Weight_%` per item) instead of equal-weight completion %.
- Accountable role on a Phase Gate should be **selectable**, not hardcoded to "PM."
- WBS tasks need a distinct `Project_Change_Joint_Tag` separate from `track` (REQ-020) — the ERP User Guide's task-by-task `[PROJECT]`/`[CHANGE]`/`[JOINT]` tagging (§3.5) is a ready-made worked example of exactly this field in use, task by task, across all 8 ERP phases.
- Common-Lifecycle Phase should be a constrained, cross-module-filterable P1–P7 enum (REQ-021).

### 4.4 Cross-Type Comparison Matrix (REQ-023 / D32i)

A filterable table/view — proposed location: a new Module 15 tab — comparing the 7 (or 8, pending Finding B) transformation types on Typical Duration, Terminal Gate, External Party Involvement, Dominant Framework, and Reversibility. **v2 note:** the Transformation Types User Guide's own Section 6 is the primary narrative source D32i's CSV cites verbatim — both agree on the same 5 comparison dimensions and the same 7-type scope, reinforcing that this feature and Finding B are the same underlying gap viewed from two documents.

### 4.5 Report export formats & Alerts/notification channels (D07, D08)

No PDF/Excel/CSV/PowerPoint export exists anywhere in journi (`package.json` has no export library). No outbound alert notification of any kind (D07 specifies Email/Push/Teams channels; journi surfaces the equivalent conditions only as in-app badges). **v2 note:** the Integration Handbook's §6 "Event & Webhook Interface" independently confirms this is meant to be a first-class capability — every D07 Alert is described as "a natural webhook/event trigger candidate" with a defined retry/dead-letter policy — reinforcing that this is a documented, intentional integration surface journi doesn't yet expose, not an oversight in D07/D08 alone.

### 4.6 REX Institutionalization Log (D25) — *new in v2*

The Solution Architecture deck (slide 33) and the underlying D25 deliverable describe a **lessons-learned repository with an explicit closure discipline**: every logged lesson must name exactly which Rule, Control, or Charter now encodes it, and carries a Status that should read "Applied" once it has. journi's closest equivalent is Module 13's `lessonsLearned` array (free-text entries per Sustainment section) — it captures the lesson but not the closure loop back to a specific rule/control/charter. Low-effort gap: could be closed by adding a `linkedRuleOrControl` free-text field and a status toggle to the existing `lessonsLearned` entries, without a new module.

### 4.7 Project Context Overlay (D24) — *new in v2*

D24 defines a pattern where a project **inherits** the generic J0–J8 journey template and **selectively overrides** only what's distinct about it (e.g., a healthcare project flagging "patient-safety-critical cutover windows" as a deployment-phase constraint), rather than each project carrying a full independent copy. journi has no equivalent concept — the closest parallel is that each seeded CM Project's narrative fields (`businessDriver`, `bridgesNote`, etc.) are already project-specific free text, but there is no formal "base template + overlay" data structure, and no UI surfacing "what makes this project's journey different from the generic template" as its own view. This is tightly coupled to §4.2 (Journeys) — not a separate build if that section is pursued, but worth naming as a specific design detail within it.

### 4.8 AI Engine Specifications — NLP Theme-Mining & Qualitative Coding Workbench (D32j, D32k) — *new in v2*

Two backend AI-engine specifications, newly added in the D32 series, describing the actual capability behind 5 of journi's 16 seeded AI use cases: D32j (NLP Theme-Mining Engine, behind AIUC-02/04/06) and D32k (Qualitative Coding Workbench, behind AIUC-12/13, notably including a **per-Organization configurable codebook** rather than a fixed platform-wide taxonomy). journi's current AI use cases are canned example generators (or real LLM passthrough calls once a provider is connected in Module 17) — there is no dedicated engine, and specifically no Coding Workbench screen where an Organization Admin could define or edit a custom qualitative codebook. Most of D32j's content is backend-infrastructure (embeddings, clustering, no UI implied) and falls under the architectural divergence in Section 6; the Coding Workbench's per-Organization codebook, however, is the one piece of this pair that reads as a genuine, addressable UI gap if the underlying AI use cases (resistance root-cause coding, qualitative pulse-response coding) are prioritized.

### 4.9 Enterprise SSO / Identity Integration (D11 IFC-14) — *new in v2*

Both the Integration Handbook (§7, §10) and the Solution Architecture deck (slide 50) describe SAML 2.0/OIDC single sign-on and directory sync as a first-class integration point, alongside an audit-log export to a SIEM pipeline. journi's authentication is a demo-mode "pick a seeded user" screen with no real credential flow, SSO, MFA, or directory sync of any kind. This is consistent with, and effectively a specific instance of, the client-side/no-backend architectural divergence (Section 6) — named separately here because the source documents treat it as its own integration point rather than folding it into general backend infrastructure.

### 4.10 Tenant/Organization seeding structure (D16) — *new in v2, minor*

D16 (via the Solution Architecture deck, slide 22) describes "9 tenants — 3 primary sector Organizations (Manufacturing, Logistics, Health) + 4 additional transformation-type Organizations + 2 Groups." journi's actual seed data has **4 Organizations** (Atlas Industrial Group, Atlas Tangier, Maghreb Logistics Hub, Meridia Health Network) and **1 Group** (Atlas Industrial Group), because the 4 new CR1 transformation-type cases (BPR, Cultural, Operating Model, Compliance) were added as **additional Main/CM Projects inside the existing 3 sector Organizations** (plus one new Project on the existing Atlas Tangier Organization for Training & Skills Development) rather than as **4 brand-new, dedicated Organizations**. This is not necessarily wrong — reusing existing tenants keeps the seed data lighter and is arguably a more realistic demo (a real client rarely spins up a whole new Organization for one project) — but it is a structural difference from what D16 describes, worth flagging as a design choice rather than an oversight.

---

## 5. What's Fully Aligned

- **CR1's 8-transformation-type expansion mechanism** (archetype → Default E2E Process → Phase Template) is correctly built and functioning, independent of the Finding B count question.
- **Modules 1–17** match D01–D10/D15/D26 at the functional level, modulo the BPMN/DMN/COSO infrastructure layer (Section 6).
- **Module 18** WBS/Gantt + Phase Templates + Phase Checklists + Phase Gates/Joint Decision Records — REQ-011/016/017/018 functioning end-to-end, Playwright-verified.
- **Module 19** Macro Process catalog + E2E Registry browser + editable RACSI grid — structurally correct (REQ-022), pending Finding A's data correction.
- **License & Plan panel** (Module 2) — a proportionate, correctly-scoped reflection of D30's licensing model for a client-side app; re-verified in v2 against the full D30 document (SaaS/OnPrem duality, `.lic` schema, feature flags all correctly modeled; hardware binding, the vendor signing tool, and cross-platform implementations correctly and explicitly out of scope for a web-only demo).
- **Module 17's LLM Provider Connection panel matches the Integration Handbook's IFC-13 description closely** — *new in v2*: both specify credentials isolated to browser-local storage, never transiting a backend, and an outbound-only call pattern to the provider. A rare case of the implementation matching a source document's description almost word-for-word.
- **13 (or 14, pending Finding B) seed projects** — D21's Project Registry IDs (PRJ-001–013) match journi's seeded case set 1:1 by name, type, and organization; independently re-confirmed by the Solution Architecture deck's own D21 slide.

---

## 6. Architectural Divergence, By Design (not re-scored above)

Source material describing infrastructure a **server-backed, enterprise-deployed** journi would have, which the current **client-side, browser-only reference build** intentionally does not implement — documented in `journi_spec.md` §2.4:

- **D02/D03 BPMN/DMN workflow and decision-table engine** — journi's logic lives in plain JavaScript (`utils/compute.js`, `utils/rbac.js`), not executable BPMN/DMN with hit-policies and audit-grade rule versioning.
- **D04 Controls / COSO control-testing framework** — no formal control-testing cadence or "Line of Defense" model; journi's equivalent is the Permission Matrix + justification logging.
- **D09/D10/D12 Info Model, Data Dictionary, Physical Data Model** — plain JS objects in `localStorage`, not a normalized relational schema.
- **D14/D18/D20 BPMN Orchestration, Components, BPMN Execution Pack** — no service-oriented backend to orchestrate.
- **D19/D19b Automation Decision Engine, Formula Registry** — journi's few formulas are hardcoded functions, not a registered, versioned formula catalog.
- **D24/REQ-024 Server-Side Persistence** — the foundational item everything above assumes.
- **D32j NLP Theme-Mining Engine** (embeddings/clustering layer) — *new in v2*; the AI use cases it underpins exist in journi as simpler prompt-based generators.
- **Integration Handbook §6 Event & Webhook Interface** — *new in v2*; no outbound webhook delivery, retry policy, or dead-letter queue exists (folds into §4.5's alert-notification gap).
- **D11 IFC-14 Enterprise SSO / Identity, SIEM audit export** — *new in v2*; see §4.9.

None of this is a defect in the delivered application — it is the documented cost of the client-side-only architecture choice, and reversing it is a platform decision, not a feature addition.

---

## 7. Recommendations, in Priority Order

**Do first (data corrections, no new UI, low effort/high correctness):**
1. Correct `e2eProcesses.js`'s four core E2E entries (E2E-01–04) to D32h's corrected macro-process compositions and names (Finding A); add per-chain RACSI. Treat the Solution Architecture deck's still-uncorrected example as confirmation this needs to happen, not as a reason to leave it as-is.
2. Resolve Finding B (7 vs. 8 transformation types) as a product decision — the evidence now favors 7 by a 5-to-2 source margin, but CR1's formal status means this is a decision to make explicitly, not infer from vote-counting.

**Do next (small, scoped additions consistent with existing patterns):**
3. Build the Cross-Type Comparison Matrix (REQ-023/D32i) as a Module 15 tab.
4. Add `Project_Change_Joint_Tag` to WBS tasks (REQ-020) and promote `phase` to a constrained P1–P7 enum filterable from other modules (REQ-021).
5. Make Phase Gate Accountable role selectable rather than hardcoded (D32e/JD-05); add per-item checklist weighting (D32c).
6. Add a `linkedRuleOrControl` field + closure status to Module 13's `lessonsLearned` entries (D25 REX Log) — small, high-leverage relative to effort.

**Consider as a larger, separately-scoped addition:**
7. CM Charters (D31 family) — likely its own module.
8. Stakeholder Journey/Touchpoint model + the 5 Journey Analytics dashboards (D27–D29), including the Project Context Overlay pattern (D24) as part of the same effort — a substantial extension of Module 16/15.
9. A Qualitative Coding Workbench screen (D32k) with a per-Organization codebook, if the resistance/pulse-response coding AI use cases it underpins are prioritized.

**Explicitly out of scope without a platform decision:**
10. Server-side persistence, BPMN/DMN workflow engine, COSO control-testing framework, report export formats, outbound alert/webhook notifications, Enterprise SSO/SIEM export, the NLP Theme-Mining engine's backend — all downstream of "does journi get a backend," which is a scope conversation, not an implementation task.

---

## Appendix — Document Set Reconciliation Map

A quick-reference index of which source documents agree, disagree, or are silent on the two Critical Findings, for anyone who needs to trace a specific claim back to its origin document.

| Document | Finding A (E2E-01–04 composition) | Finding B (7 vs. 8 types) |
|---|---|---|
| CR1 addendum | Silent (doesn't touch the 4 core chains) | **8 types** (source of the 8th, Training & Skills Development) |
| End-to-End Process Catalogue v1.1 | Registers the **uncorrected** composition | **8 types** |
| Framework Interaction Map v2.3 §11 | Source of the **corrected** composition (per D32h) | Silent |
| D01–D10/D15/D26 xlsx | Silent | Silent |
| D11–D29 xlsx — D21, D32b, D32i | Silent | **7 types** |
| D11–D29 xlsx — D32h | States its own composition is **corrected** | Silent |
| D30 Licensing Schema | Silent | Silent |
| Integration Handbook | Silent | Silent |
| ERP User Guide | Silent (ERP is a shared type across both counts) | Silent (single-type guide) |
| Transformation Types User Guide | Silent | **7 types** ("The Six Transformation Types" + ERP) |
| Solution Architecture presentation | Cites the **uncorrected** composition (slide 42) | **7 types** (slide 29) |

Reading across the table: every document that touches Finding B says 7 except CR1 and the Process Catalogue; every document that touches Finding A's actual composition (not just registry structure) is split exactly one-for-one between the old and corrected versions, with D32h being the only source that explicitly flags the discrepancy rather than silently picking a side.
