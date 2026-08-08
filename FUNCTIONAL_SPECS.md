# Functional Specifications — mySCM Macro Process Register
## Version 1.0 | Based on the D01 mySCM Specification (Trg-O2D GTM)

---

## Table of Contents

1. Purpose and Scope
2. Glossary
3. Actors and Roles
4. System Overview
5. Functional Requirements
   5.1 Authentication & Account Management
   5.2 Company Management
   5.3 Scenario Management
   5.4 Macro Process Master Data
   5.5 Process Register
   5.6 Process Editor
   5.7 Scoring Engine (Derived Fields)
   5.8 Dashboard
   5.9 Recycle Bin
   5.10 Framework Reference Page
   5.11 Admin Panel
   5.12 Internationalisation (i18n)
   5.13 Data Export
6. Business Rules — Scoring Formulas
7. Data Model
8. Non-Functional Requirements
9. Out of Scope
10. Traceability Matrix

---

## 1. Purpose and Scope

This document specifies the functional behaviour of the **mySCM Macro Process Register**, a web application used to document, score, and prioritise the 55 supply chain macro processes defined by the D01 mySCM specification (Trg-O2D Go-To-Market). It captures **what the system does**, independent of implementation detail already covered in the [README](./README.md), [Setup Guide](./SETUP_GUIDE.md), [User Guide](./USER_GUIDE.md), and [Admin Guide](./ADMIN_GUIDE.md).

The system supports three outcomes for each macro process:
1. Assess **BPMN Readiness** — is the process documented well enough to model?
2. Recommend an **Execution Mode** — Human Mandatory, Workflow, RPA, AI Augmented, or AI Autonomous.
3. Compute an **Automation Priority** — a rank and delivery **Wave** (1, 2, or 3) driven by ROI, VOI, cost, and strategic alignment.

---

## 2. Glossary

| Term | Definition |
|---|---|
| **Macro process** | One of the 55 top-level SCM processes defined by the D01 master data (e.g. `Deliver_01 — Customer order capture`). |
| **Scenario** | One complete set of assessments (scores + financials) applied to all 55 macro processes for a given company. A company can have multiple scenarios. |
| **In Scope** | A boolean flag marking whether a process is included in a given scenario's automation programme. |
| **BPMN Readiness** | A 0–100 score indicating how well a process is documented for BPMN modelling. |
| **Execution Mode** | The recommended automation approach for a process: `Human Mandatory`, `Workflow`, `RPA`, `AI Augmented`, or `AI Autonomous`. |
| **ROI** | Return on Investment percentage, from annualised benefit vs. one-time build cost. |
| **VOI** | Value of Investment — a weighted composite of intangible benefits (risk reduction, agility, brand, employee satisfaction). |
| **Priority Score** | The master ranking metric combining ROI, VOI, cost efficiency, and strategic alignment. |
| **Wave** | A delivery grouping derived from rank: Wave 1 (top 10), Wave 2 (ranks 11–30), Wave 3 (rank 31+). |
| **Heatmap Quadrant** | One of four buckets (`Quick Win`, `High ROI`, `High VOI`, `Strategic`) derived from ROI and VOI thresholds. |
| **RACI** | Responsible / Accountable / Consulted / Supportive / Informed — the ownership model attached to each macro process as read-only master data. |

---

## 3. Actors and Roles

| Role | Description | Granted by |
|---|---|---|
| **User** | Any authenticated account. Can manage their own companies, scenarios, and process assessments. Cannot see other users' data (except via the shared, read-only `users` list needed to render names in the Admin panel — enforced at the UI level only for admins). | Default role on self-registration. |
| **Admin** | Everything a User can do, plus: view all users, activate/deactivate non-admin users, pre-create user accounts, view all scenarios across all users (read-only), and view system-wide insights. | Automatically assigned to the first account that signs up with the email matching the `VITE_ADMIN_EMAIL` environment variable. |

There is exactly one privileged role tier (Admin); there is no per-company or per-scenario sharing between different user accounts — all company/scenario/process data is single-owner.

---

## 4. System Overview

- **Client**: React 18 single-page application (Vite build), styled with Tailwind CSS, client-side routed with `react-router-dom`.
- **Backend**: Serverless — Firebase Authentication (email/password) for identity, Cloud Firestore for all persisted data. There is no custom application server; all business logic (scoring formulas, ranking, validation) runs client-side in the browser.
- **Hosting**: Static hosting (Netlify), auto-deployed from the Git repository.
- **Master data**: The 55 macro processes and their fixed attributes (RACI, inputs/outputs, triggers, capability cluster, etc.) are hard-coded in `src/lib/constants.js` (`MASTER_PROCESSES`) and are identical across all scenarios and companies — they are not stored per-scenario in Firestore, only referenced by `macroId`.

---

## 5. Functional Requirements

### 5.1 Authentication & Account Management

| ID | Requirement |
|---|---|
| FR-1.1 | The system shall allow a new user to self-register with full name, email, and a password of at least 6 characters. |
| FR-1.2 | On registration, the system shall create a `users` document containing email, name, role, status (`active`), and creation timestamp. |
| FR-1.3 | The system shall assign the `admin` role automatically if the registering email matches `VITE_ADMIN_EMAIL` (case-insensitive); otherwise it shall assign `user`. |
| FR-1.4 | The system shall allow a registered user to log in with email and password. |
| FR-1.5 | The system shall allow a logged-in user to log out, which shall end their Firebase Auth session. |
| FR-1.6 | Unauthenticated users shall be redirected to the Login page for any protected route. |
| FR-1.7 | Users whose role is not `admin` shall be redirected away from the `/admin` route. |

### 5.2 Company Management

| ID | Requirement |
|---|---|
| FR-2.1 | The system shall allow a user to create a company with Company Name (required), Sector (dropdown), and Industry (free text). |
| FR-2.2 | The system shall list only companies owned by the current user (filtered by `userId`). |
| FR-2.3 | The system shall allow the user to select one company as the "active company" for the current session (client-side state, not persisted). |
| FR-2.4 | The system shall allow the user to delete a company. Deleting the currently active company shall clear the active company selection. Deleting a company does not cascade-delete its scenarios or processes. |

### 5.3 Scenario Management

| ID | Requirement |
|---|---|
| FR-3.1 | The system shall require an active company to be selected before a scenario can be created or listed. |
| FR-3.2 | The system shall allow a user to create a scenario with Scenario Name (required) and Description (optional), linked to the active company. |
| FR-3.3 | On scenario creation, the system shall atomically create exactly 55 `processes` documents — one per entry in `MASTER_PROCESSES` — each defaulted per `DEFAULT_EDITABLE` (all scores 0, `inScope: false`, all text fields empty), pre-filled with the master's `Process_Type`, `Parent_Cycle`, `Start_Event_Type`, `End_Event_Type`, `Frequency`, `Process_Criticality`, `Audit_Criticality`, and `SLA` where the master record supplies them. |
| FR-3.4 | The system shall allow the user to select one scenario as the "active scenario" for the current session. |
| FR-3.5 | The system shall allow the user to delete a scenario. On delete, the system shall move all of that scenario's process documents into the `recycle` collection (preserving all field values plus `originalScenarioId`, `originalScenarioName`, `companyId`, `companyName`, and an `archivedAt` timestamp), then delete the process documents and the scenario document itself, atomically via a single Firestore batch. |
| FR-3.6 | Deleting the currently active scenario shall clear the active scenario selection. |

### 5.4 Macro Process Master Data

| ID | Requirement |
|---|---|
| FR-4.1 | The system shall define exactly 55 macro processes spanning six SCOR-style parent cycles: Plan (7), Source (8), Make (7), Deliver (15), Return (6), Enable (12)†. |
| FR-4.2 | Each master process shall carry fixed, read-only attributes: `macroId`, `macroName`, `capabilityCluster`, `bpmnPool`, `bpmnLane`, `owningModule`, `sourceModule`, `consumingModules`, `triggerEvent`, `inputs`, `outputs`, `inputsProviders`, `beneficiaries`, RACI fields (`r`, `a`, `c`, `s`, `i`), and `macroGoals`. |
| FR-4.3 | Master attributes shall be identical across every scenario and company and shall not be editable through the UI. |

† Counts as implemented in `src/lib/constants.js`; totals to 55. (Note: earlier product documentation such as the README and User Guide references "49 macro processes" from an earlier revision of the master data; the current codebase defines 55. This document reflects the current code.)

### 5.5 Process Register

| ID | Requirement |
|---|---|
| FR-5.1 | The system shall require an active scenario before displaying the register. |
| FR-5.2 | The system shall display all 55 processes for the active scenario in a table, merging each process document with its corresponding master data by `macroId`. |
| FR-5.3 | The table shall show, per row: Rank, Macro ID, Process Name, Parent Cycle, Cluster, Criticality, SLA, In Scope indicator, BPMN Readiness score bar, Execution Mode, ROI %, Wave, and an Edit action. |
| FR-5.4 | The system shall provide a free-text search filtering by Macro ID, process name, or capability cluster (case-insensitive substring match). |
| FR-5.5 | The system shall provide a scope filter with three states: All Processes, In Scope Only, Out of Scope. |
| FR-5.6 | The register shall update in real time (Firestore `onSnapshot` listener) as process documents change, including from edits made in the modal. |

### 5.6 Process Editor

| ID | Requirement |
|---|---|
| FR-6.1 | The system shall open a modal editor when a user clicks Edit on a process row, pre-populated with that process's current field values. |
| FR-6.2 | The editor shall always show, independent of tab: an "In Scope" checkbox and a free-text "Justification" field. |
| FR-6.3 | The editor shall organise editable fields into 7 tabs: BPMN Readiness, Human, Workflow, RPA, AI, Financial, Other. |
| FR-6.4 | The BPMN Readiness tab shall expose 5 sliders (0–100, step 1): Process Clarity, Exception Logic, Data & Rule Availability, Automation Suitability, Compliance/HITL Readiness. |
| FR-6.5 | The Human tab shall expose 4 sliders (0–4, step 1): Human Judgment, Human Ethics, Human Accountability, Regulatory Sign-off. |
| FR-6.6 | The Workflow tab shall expose 5 sliders (0–4): Approval Chain, SLA Strictness, Exception Paths, Handoff Complexity, Audit Checkpoint. |
| FR-6.7 | The RPA tab shall expose 4 sliders (0–4): Rule-Based, Structured Data, Zero Judgment, Process Stability. |
| FR-6.8 | The AI tab shall expose 5 sliders (0–4): AI Judgment, Unstructured Data, Process Variability, Training Overhead, Risk Inverse (penalty). |
| FR-6.9 | The Financial tab shall expose 8 numeric fields (Benefit Annualized USD, Cost One-Time USD, Automation Cost Estimate USD, Strategic Alignment Score, VOI Risk Reduction, VOI Agility, VOI Brand Reputation, VOI Employee Satisfaction) and 2 dropdowns (ROI Method, VOI Method). |
| FR-6.10 | The Other tab shall expose dropdowns for Process Type, Parent Cycle, Start/End Event Type, Frequency, Process Criticality, Audit Criticality, and Reusable; and free-text fields for SLA, Standard Mapping, Automation KPI IDs, and Workflow Template. |
| FR-6.11 | The editor shall compute and display a live, unsaved preview of all 13 derived scores (§5.7) on every field change, recalculated client-side without a network round-trip. |
| FR-6.12 | On Save, the system shall persist only the editable fields (excluding read-only master data and derived/calculated fields) to the corresponding `processes` document via a partial update. |
| FR-6.13 | The system shall not permit individual process deletion — only whole-scenario deletion (§5.3, FR-3.5) is supported. |

### 5.7 Scoring Engine (Derived Fields)

| ID | Requirement |
|---|---|
| FR-7.1 | The system shall compute 13 derived values for every process, purely as a function of its current field values (no persisted intermediate state): BPMN Readiness Score, BPMN Ready flag, Human Score, Workflow Score, RPA Score, AI Score, Execution Mode, ROI %, VOI Score, Priority Score, Rank, Wave, Heatmap Quadrant. |
| FR-7.2 | Derived values shall never be stored in Firestore; they shall be recomputed on every read/render from the persisted editable fields. |
| FR-7.3 | Rank shall be computed across all 55 processes of the active scenario, ordered by Priority Score descending; a process's rank equals 1 plus the count of processes with a strictly higher Priority Score (ties share the same rank; the next distinct rank is skipped accordingly). |
| FR-7.4 | The exact formulas are specified in §6 and are also rendered to end users on the Framework Reference page (§5.10). |

### 5.8 Dashboard

| ID | Requirement |
|---|---|
| FR-8.1 | The system shall require an active scenario before rendering dashboard content. |
| FR-8.2 | The dashboard shall show summary counts: total processes, in-scope processes, BPMN-ready processes (among in-scope), and Wave 1 count (among in-scope). |
| FR-8.3 | The dashboard shall show a 2×2 heatmap of in-scope process counts by Heatmap Quadrant (Quick Win, High ROI, High VOI, Strategic). |
| FR-8.4 | The dashboard shall show a distribution of in-scope processes by Execution Mode as a set of proportional bars. |
| FR-8.5 | The dashboard shall show a "Wave 1 Pipeline" table listing the top 10 in-scope processes by rank, with Macro ID, name, Execution Mode, ROI %, and Priority Score. |
| FR-8.6 | The dashboard shall show scenario metadata: name, company, description, creation date. |

### 5.9 Recycle Bin

| ID | Requirement |
|---|---|
| FR-9.1 | The system shall list all `recycle` documents owned by the current user, each representing one process archived from a deleted scenario. |
| FR-9.2 | The system shall allow restoring an archived process. If the original scenario (by `originalScenarioId`) still exists, the process shall be restored into it automatically as a new `processes` document. |
| FR-9.3 | If the original scenario no longer exists, the system shall prompt the user to pick any of their existing scenarios as the restore target. |
| FR-9.4 | Restoring shall create a new process document (with a new document ID) carrying forward all editable field values, then remove the corresponding `recycle` document. |
| FR-9.5 | The system shall allow permanently deleting a recycle entry, after user confirmation, which is irreversible. |

### 5.10 Framework Reference Page

| ID | Requirement |
|---|---|
| FR-10.1 | The system shall provide a read-only page listing all 13 scoring formulas (§6), each with an ID, name, mathematical expression, and plain-English description. |
| FR-10.2 | This page shall require no active company or scenario and shall be identical for every user. |

### 5.11 Admin Panel

| ID | Requirement |
|---|---|
| FR-11.1 | The Admin route shall be accessible only to users with role `admin`; all other users shall be redirected to the dashboard. |
| FR-11.2 | The panel shall provide three tabs: User Management, All Scenarios, Global Insights. |
| FR-11.3 | User Management shall list every user with name, email, role, status, scenario count, and creation date. |
| FR-11.4 | User Management shall allow the admin to pre-create a user account (name, email, role) with a default password of `changeme`, creating both a Firebase Auth account and a `users` Firestore document. |
| FR-11.5 | User Management shall allow the admin to toggle a non-admin, non-self user's status between `active` and `inactive`. An admin cannot deactivate their own account or any other admin account through the UI. |
| FR-11.6 | All Scenarios shall list every scenario across every user (read-only), showing scenario name, description, company name, owning user, and creation date. |
| FR-11.7 | Global Insights shall show total users, active users, total companies, and total scenarios as summary cards; a bar breakdown of companies by sector; and a per-user scenario count list. |

### 5.12 Internationalisation (i18n)

| ID | Requirement |
|---|---|
| FR-12.1 | The system shall support English, French, and Arabic UI translations for all interface labels. |
| FR-12.2 | Selecting Arabic shall switch the entire layout to right-to-left (RTL) rendering. |
| FR-12.3 | Language selection shall apply instantly without a page reload and shall be available from a dropdown in the sidebar. |
| FR-12.4 | Master process data, business field values entered by users, and exported JSON keys are not translated — only static UI chrome is localised. |

### 5.13 Data Export

| ID | Requirement |
|---|---|
| FR-13.1 | The system shall allow exporting the active scenario's full process set as a single JSON file, named `<scenarioName>_processes.json`. |
| FR-13.2 | The export shall include scenario metadata, company metadata, an export timestamp, and for every process: all editable input fields plus all 13 derived scores. |
| FR-13.3 | The export shall be generated entirely client-side (Blob + object URL) with no server round-trip. |

---

## 6. Business Rules — Scoring Formulas

These are the authoritative formulas implemented in `src/lib/formulas.js` and mirrored on the in-app Framework Reference page.

**F-COMPOSITE-001 — BPMN Readiness Score (0–100)**
```
Process_Clarity × 0.25 + Exception_Logic × 0.20 + Data_Rule_Availability × 0.20
  + Automation_Suitability × 0.20 + Compliance_HITL_Readiness × 0.15
```

**F-BPMNREADY — BPMN Ready Flag**
```
IF BPMN_Readiness_Score ≥ 80 THEN "Yes" ELSE "No"
```

**F-HUMAN-001 — Human Score (0–100)**
```
raw = (Human_judgment + Human_ethics + Human_accountability + Human_regulatory_signoff) × 2.5   [0–40]
Human_Score = (raw / 40) × 100
```

**F-WF-001 — Workflow Score (0–100)**
```
raw = (Workflow_approval_chain + Workflow_SLA + Workflow_exception_paths
      + Workflow_handoff_complexity + Workflow_audit_checkpoint) × 2   [0–40]
Workflow_Score = (raw / 40) × 100
```

**F-RPA-001 — RPA Score (0–100)**
```
raw = (RPA_rule_based + RPA_structured_data + RPA_zero_judgment + RPA_stable) × 2.5   [0–40]
RPA_Score = (raw / 40) × 100
```

**F-AI-001 — AI Score (0–100)**
```
raw = AI_judgment × 3 + AI_unstructured × 2 + AI_variability × 2
    + AI_training × 1 + AI_risk_inverse × 2   [0–40, AI_risk_inverse is a penalty factor]
AI_Score = (raw / 40) × 100
```

**F-FINALMODE-001 — Recommended Execution Mode**
```
IF Human_Score ≥ 80 → "Human Mandatory"
ELSE, let max = MAX(AI_Score, Workflow_Score, RPA_Score); tie-breaker order AI > Workflow > RPA:
  IF AI_Score == max:
    IF AI_Score ≥ 90 → "AI Autonomous"
    ELSE IF AI_Score ≥ 70 → "AI Augmented"
    ELSE IF Workflow_Score ≥ RPA_Score → "Workflow"    (AI is max but below 70; fall back)
    ELSE → "RPA"
  ELSE IF Workflow_Score == max → "Workflow"
  ELSE → "RPA"
```

**F-ROI-001 — ROI Percentage**
```
IF Cost_OneTime_USD == 0 → ROI = null (undefined)
ELSE ROI% = ((Benefit_Annualized_USD − Cost_OneTime_USD) / Cost_OneTime_USD) × 100
```

**F-VOI-001 — VOI Score (0–100)**
```
VOI_Score = VOI_risk_reduction × 0.4 + VOI_agility × 0.3
          + VOI_brand_reputation × 0.2 + VOI_employee_satisfaction × 0.1
```

**F-PRIORITY-001 — Automation Priority Score**
```
ROI_for_calc = ROI% if defined, else 0
Cost_norm = Automation_Cost_Estimate_USD if > 0, else a negligible epsilon
Priority_Score = ROI_for_calc × 0.4 + VOI_Score × 0.3
               + (1 / (Cost_norm / 1000)) × 0.2 + Strategic_Alignment_Score × 0.1
```

**F-RANK — Top Automation Rank**
```
Rank(process) = 1 + count of processes in the same scenario with a strictly higher Priority_Score
```

**F-WAVE — Automation Wave**
```
Rank 1–10   → Wave 1
Rank 11–30  → Wave 2
Rank 31–55  → Wave 3
```

**F-HEATMAP — Heatmap Quadrant**
```
ROI% ≥ 20 AND VOI_Score ≥ 80  → "Quick Win"
ROI% ≥ 20 AND VOI_Score < 80  → "High ROI"
ROI% < 20 AND VOI_Score ≥ 80  → "High VOI"
ROI% < 20 AND VOI_Score < 80  → "Strategic"
(if ROI is undefined, it is treated as 0 for this test)
```

---

## 7. Data Model

Firestore collections (see [Admin Guide §8](./ADMIN_GUIDE.md#8-firestore-data-structure) for the field-level reference):

| Collection | Purpose | Key relationships |
|---|---|---|
| `users` | One document per account, keyed by Firebase Auth UID. | — |
| `companies` | One document per company. | `userId` → owning user |
| `scenarios` | One document per scenario. | `companyId` → company, `userId` → owning user |
| `processes` | One document per macro process per scenario (55 per scenario). | `scenarioId` → scenario, `companyId` → company, `userId` → owning user, `macroId` → joined at read-time against the hard-coded `MASTER_PROCESSES` array |
| `recycle` | One document per archived process, created when its parent scenario is deleted. | `originalScenarioId`, `originalProcessId`, `companyId`, `userId` |

**Access control** (`firestore.rules`): every collection except `users` restricts read/write to documents whose `userId` matches `request.auth.uid`. The `users` collection is readable by any authenticated user (required so the Admin panel and any user-lookup UI can render names), but writable only by the document's own owner — there is no server-side enforcement that only admins can list all users; this is currently an application-layer (UI) restriction only (see §9, Out of Scope, and the Admin Guide's Security Considerations).

---

## 8. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | The application shall be a static single-page app deployable to any static host (validated against Netlify). |
| NFR-2 | Authentication and authorization shall be delegated to Firebase Authentication; no passwords are stored by the application itself. |
| NFR-3 | All application secrets (Firebase config) shall be supplied via build-time environment variables (`VITE_*`) and never committed to source control. |
| NFR-4 | The UI shall support English, French, and Arabic, including RTL layout for Arabic (§5.12). |
| NFR-5 | Scenario creation (55-document batch write) shall complete in a few seconds under normal network conditions. |
| NFR-6 | Process Register and Dashboard views shall reflect underlying data changes in real time via Firestore listeners, without requiring a manual refresh. |
| NFR-7 | The system targets evergreen desktop and mobile browsers (no legacy browser support is specified). |
| NFR-8 | There is no automated backup on the Firebase free (Spark) tier; data protection relies on user-initiated JSON export or an upgrade to a paid Firebase plan (see Admin Guide §9). |

---

## 9. Out of Scope

The following are explicitly **not** provided by the current system and are noted here to set expectations:

- Multi-user collaboration or sharing of a company/scenario between different accounts.
- Server-side/API-enforced admin authorization (admin gating is currently UI-level only; Firestore rules do not distinguish admin from regular users for the `users` collection).
- Workflow/approval processes for scenario or process changes (no versioning, review, or sign-off flow).
- Automated data backups, audit logging, or change history for process edits.
- Bulk import of process data (only the built-in JSON export exists; there is no corresponding import).
- Editing or extending the set of 55 master macro processes through the UI (they are fixed in source code).
- Any BPMN diagram authoring or modelling tool — the app only tracks readiness scores, not the diagrams themselves.
- Password reset self-service flow beyond what Firebase Authentication provides out of the box.

---

## 10. Traceability Matrix

| Business Goal | Functional Requirements |
|---|---|
| Assess whether processes are ready for BPMN modelling | FR-6.4, FR-7.1, F-COMPOSITE-001, F-BPMNREADY |
| Recommend the right automation approach per process | FR-6.5–FR-6.8, FR-7.1, F-HUMAN-001, F-WF-001, F-RPA-001, F-AI-001, F-FINALMODE-001 |
| Prioritise automation investment | FR-6.9, FR-7.1, F-ROI-001, F-VOI-001, F-PRIORITY-001, F-RANK |
| Plan delivery waves | FR-7.1, F-WAVE, FR-8.5 |
| Give stakeholders a portfolio view | FR-8.1–FR-8.6 |
| Protect against accidental data loss | FR-3.5, FR-9.1–FR-9.5 |
| Support multi-language stakeholders | FR-12.1–FR-12.4 |
| Allow platform owners to manage users and see system-wide status | FR-11.1–FR-11.7 |

---

*End of Functional Specifications*
