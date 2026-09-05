**journi**

**Software Requirements Specification**

*Human Change Management Application — Rebuild-Grade Technical Reference*

Prepared for POWERACT Consulting

Version 1.0 · August 2026 · Confidential

TOCPLACEHOLDERXYZ

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) documents journi — a human change-management web application — at a level of technical and functional detail sufficient for an independent development team to rebuild it from scratch: the same 22 modules, the same data model, the same access-control and localization behavior, and the same installable Windows deployment, without access to the original source code.

It is a companion to, and supersedes for rebuild purposes, the earlier *journi Functional & Module Specification*: that document describes the product's intent and framework rationale in narrative form; this one adds the missing engineering layers — data model, API surface, non-functional requirements, and per-module functional requirements with unique identifiers — and corrects two things that changed since it was written: the module numbering (all 22 modules now run in one continuous logical sequence, M1–M22, described in Section 1.6) and the persistence architecture (journi now ships with a real local backend, not a browser-only reference build — Section 3).

### 1.2 Scope

journi is a standalone, multi-tenant human change-management application. It sits alongside — but does not replace or integrate with — an organization's project-delivery/PMO tooling, and tracks the people side of a change initiative: individual and cohort readiness (ADKAR), emotional trajectory (Bridges, Kübler-Ross), organizational sponsorship and coalition strength (Kotter), and overall program state (Lewin), layered onto one shared, framework-agnostic data model.

In scope for this document: the full functional behavior of all 22 modules; the organizational hierarchy, role-based access control, and localization architecture; the data model and REST API; the Windows installation and deployment model; the governed AI Use Case Library; and the non-functional requirements (performance, security, portability, usability) the reference implementation satisfies.

In scope, in addition to the above: a full-page screenshot of every module (Section 10.7) as a visual reference alongside the prose UI conventions; the complete i18n string catalog in English/French/Arabic (Section 10.5); the complete content of every shared reference/catalog dataset (Macro Processes, E2E chains, Phase Templates, Charters, Journeys, Touchpoints, AI Use Case prompt templates, alert definitions, and more — Section 10.6); a recommended target REST API design for a rebuild, since the reference build's own API is a whole-state store not meant to be replicated (Section 5.2.2); and one acceptance test case per functional requirement (Section 10.8).

Out of scope: pixel-level visual design beyond the screenshots in Section 10.7 (see the companion UI Palette artifact for a proposed alternative color direction, not yet adopted), the illustrative seed-data narratives' full prose form (Section 9 and 10.6 give structured/condensed content; full narratives live in the Master User Guide), and any integration with a specific third-party PMO, HRIS, or LMS system (journi exposes CSV export and a documented API surface as its integration points, but ships no pre-built connector).

### 1.3 Intended Audience

A development team tasked with rebuilding, extending, or re-platforming journi; a QA team writing test plans against its functional requirements; a solutions architect scoping a production (multi-tenant, cloud-hosted) deployment beyond the reference Windows installation described here.

### 1.4 Definitions, Acronyms, Abbreviations

| Term | Meaning |
|---|---|
| ADKAR | Prosci's five-block individual change model: Awareness, Desire, Knowledge, Ability, Reinforcement |
| Bridges | William Bridges' Transition Model: Ending → Neutral Zone → New Beginning |
| Kübler-Ross | The Change Curve, adapted here for organizational (not grief) sentiment: denial, resistance, exploration, commitment |
| Kotter | Kotter's 8-Step organizational change process |
| Lewin | Unfreeze–Change–Refreeze macro-state model |
| RBAC | Role-Based Access Control |
| RACSI | Responsible / Accountable / Consulted / Sign-off / Informed — journi's extended RASCI variant |
| SIPOC | Suppliers–Inputs–Process–Outputs–Customers process-mapping notation |
| OBS | Organizational Breakdown Structure (Module M3) — the roster of named resources/roles a project draws on |
| WBS | Work Breakdown Structure (Module M8) |
| CM | Change Management (as opposed to PM, Project Management) |
| E2E | End-to-End (process chain, Module M4) |
| MP | Macro Process — an atomic unit of journi's process model (Module M4) |
| FR-M*n*-*nn* | Functional requirement identifier: module number, then a sequential requirement number within that module |
| NFR-*nn* | Non-functional requirement identifier |

### 1.5 References

- *journi Functional & Module Specification* (docs-src/spec/journi_spec.md) — narrative predecessor to this document; module numbers there use the pre-renumbering internal sequence (see the translation table in Section 1.6).
- *journi — The Complete User Guide* (docs-src/master-guide) — worked walkthroughs of every module against a running scenario tenant.
- *WINDOWS_INSTALL.md* (repository root) — end-user installation instructions.
- *journi Gap Analysis* and *Gap Closure Summary* (deliverables/) — historical record of functional gaps identified and closed prior to this SRS.

### 1.6 Module Numbering Convention

journi's 22 modules are organized into one continuous logical sequence, M1 through M22, running from tenant creation through platform governance, the full change-management project lifecycle, and sustainment. This visible numbering is intentionally decoupled from the source file names (`Module<N>Page.jsx`) and route paths (`/app/m<N>`), which are permanent internal identifiers chosen when each module was first built and never renumbered — so a developer locating a module's code should always use the file-path column below, not the displayed module number, to search the repository history.

| Displayed # | Module Name | Source File |
|---|---|---|
| M1 | Tenant & Org Hierarchy | `Module1Page.jsx` |
| M2 | Identity & RBAC | `Module2Page.jsx` |
| M3 | Organizational Breakdown Structure (OBS) | `Module22Page.jsx` |
| M4 | Macro Process, SIPOC, RACSI & E2E Process Registry | `Module18Page.jsx` |
| M5 | Change Management Charter Registry | `Module19Page.jsx` |
| M6 | AI Use Case Library & Governance | `Module16Page.jsx` |
| M7 | Initiative (CM Project) Registry | `Module3Page.jsx` |
| M8 | Work Breakdown Structure & Gantt | `Module17Page.jsx` |
| M9 | Stakeholder & Impact Mapping | `Module4Page.jsx` |
| M10 | ADKAR Engine | `Module5Page.jsx` |
| M11 | Emotional & Transition Layer (Bridges / Kübler-Ross) | `Module6Page.jsx` |
| M12 | Change Risk Register | `Module13Page.jsx` |
| M13 | Sponsor & Coalition | `Module7Page.jsx` |
| M14 | Communication Planning & Execution | `Module8Page.jsx` |
| M15 | Training & Capability Building | `Module9Page.jsx` |
| M16 | Resistance Management | `Module10Page.jsx` |
| M17 | Manager-as-Coach Enablement | `Module11Page.jsx` |
| M18 | Journey Map / Visual Core | `Module15Page.jsx` |
| M19 | Stakeholder Journeys, Touchpoints & Analytics | `Module20Page.jsx` |
| M20 | Metrics & Analytics Dashboard | `Module14Page.jsx` |
| M21 | Reinforcement & Sustainment | `Module12Page.jsx` |
| M22 | Field Notes | `Module21Page.jsx` |

The sidebar groups these into two sections: **Platform & Governance** (M1–M6 — tenant setup, identity, and the reference data every project draws on) and **Change Management Program** (M7–M22 — the working lifecycle of a single Change Management Project, in the order a practitioner actually touches them).

---

## 2. Overall Description

### 2.1 Product Perspective

journi is a self-contained, single-tenant-installable web application, not a module of a larger suite. It runs as a Node.js server process (bundled frontend + REST API) backed by a local SQLite database file, distributed today as a Windows-installable package (`install.bat` / `start-journi.bat`) but architecturally portable to any environment able to run Node.js 18+. It has no required external service dependency — the optional exception is the AI Use Case Library's Real LLM Provider Connection (Section 6.6, M6), which is opt-in and falls back to a deterministic built-in generator when not configured.

### 2.2 Product Functions (Summary)

- Multi-tenant organizational hierarchy (Group → Organization → Projects) with hard data isolation between Organizations (Section 2, M1).
- Role-based access control with a runtime-editable Permission Matrix and a justification-governed audit trail for every score/state change (Section 3, M2).
- A 16-module Change Management Program lifecycle covering stakeholder mapping, ADKAR readiness, emotional/transition tracking, sponsorship, communications, training, resistance, coaching, risk, journey mapping, analytics, and sustainment (M7–M22).
- A shared, cross-cutting reference layer — Macro Processes/SIPOC/RACSI, WBS & Gantt, OBS, and a Change Management Charter Registry — that every program module draws on rather than duplicating (M3–M6, M8).
- A governed, tiered (Assistive/Augmented — never Autonomous) AI Use Case Library plugged into most modules (M6).
- Multilingual (English/French/Arabic, including full RTL) UI with tenant-default and personal-override language precedence.
- Client-side CSV export on high-traffic tables and an in-app Notification Center surfacing live-computed alert conditions.

### 2.3 User Classes and Characteristics

See Section 3.2 (RBAC) for the authoritative role table. In summary: platform-wide administrators (Super Admin), organization/group administrators, project-scoped practitioners (Change Manager, PMO, Trainer, Communications Practitioner), team-scoped People Managers/Coaches, read-only Sponsors and Executive Viewers, and Employees with self-service, submission-only access to their own data.

### 2.4 Operating Environment

- **Server**: Node.js ≥ 18 (tested through Node 24), running an Express HTTP server on a configurable port (default 4000), serving both the built frontend (static assets) and the REST API from the same origin.
- **Database**: a single local SQLite file (`server/data/journi.db`), opened via one of two interchangeable drivers — see Section 3.3.
- **Client**: any evergreen desktop browser (Chrome, Edge, Firefox); no mobile-specific layout is shipped beyond standard responsive breakpoints, though Module M17's UI is deliberately lightweight for frontline-supervisor use on a phone browser.
- **OS**: primary packaging target is Windows 10/11 (install.bat), but the Node/Express/SQLite stack is OS-agnostic; the same source runs on macOS/Linux with `npm install && npm start` in `server/`.

### 2.5 Design and Implementation Constraints

- **Frontend**: React 18 (function components + hooks only), Vite as the build tool, React Router for client-side routing, Tailwind CSS for styling, all state read from a single React Context (`AppStateContext`) rather than a state-management library.
- **Backend**: Express, minimal middleware, a single persisted JSON document per tenant-scope rather than a normalized relational schema (Section 4).
- **Persistence portability**: the backend must run without requiring a native-compiled dependency to succeed at `npm install` — this is why two interchangeable SQLite drivers exist (Section 3.3); a rebuild targeting only modern Node (≥ 22, where `node:sqlite` is stable) could drop the fallback, but the dual-driver approach is the current constraint for Windows install reliability across a wide range of installed Node versions.
- **No required cloud dependency**: the reference build must remain fully functional offline, with the sole opt-in exception of the Real LLM Provider Connection.
- **Localization-first**: every user-facing string must exist in `translations.js` for all three languages; no hardcoded UI string is acceptable outside that file.

### 2.6 Assumptions and Dependencies

- A single journi installation serves one physical/virtual machine and one SQLite file; horizontal scaling or multi-instance deployment is out of scope for the reference build (Section 8.3 discusses what a production re-platform would need).
- The application assumes trusted network access to the machine it runs on (e.g. a LAN or a single user's desktop) — the reference build does not implement TLS termination, rate limiting, or a WAF; a production, internet-facing deployment must add these at the infrastructure layer.
- Demo/seed data (Section 9) is fictional and is not a substitute for real organizational data before go-live, per the Closing Notes of the predecessor Functional Specification.

---

## 3. System Architecture

### 3.1 High-Level Architecture

journi is a single Node.js process that both serves the compiled frontend and exposes the API the frontend calls, backed by one local SQLite file:

```
Browser (React SPA)
   │  GET  /api/state    (whole application state, once on load)
   │  PUT  /api/state    (whole application state, debounced 400ms after any change)
   ▼
Express server (server/index.js)  ──serves──▶  journi/dist (built frontend, static + SPA fallback)
   │
   ▼
server/db.js  (dual SQLite driver)
   │
   ▼
server/data/journi.db  →  table app_state, single row (id = 1)
```

There is deliberately no per-entity REST surface: the entire application's data — every organization, project, and sub-record — lives in one JSON document, and the client and server exchange that whole document rather than individual resources. Section 3.4 explains why, and what a normalized-schema rebuild would need to change.

### 3.2 Frontend Architecture

- **Framework**: React 18, function components and hooks only, built with Vite.
- **Routing**: React Router; each of the 22 modules is a top-level route (`/app/m1` … `/app/m22`), rendered inside a shared `Layout` (TopBar + Sidebar + routed content).
- **State**: a single React Context, `AppStateContext` (`journi/src/state/AppStateContext.jsx`), is the sole source of truth for all persisted application data (Section 4) and exposes every mutation as a function via `useAppState()` — no separate state-management library, no per-page local copies of server data.
- **Component library**: a small shared set used across all 22 module pages — `PageHeader`, `Modal` (the standard Add/Edit dialog shell), `Badge` (status/tone pill), `EmptyState`, `ExportCsvButton`, `AiSuggestionBox` (the standard AI-use-case card, Section 6.6), `ProgressBar`, `JustifyPanel` (the stage-then-justify governance widget, Section 6.6.5), `RequireProject` / `RequireRole` (route guards).
- **Internationalization**: `journi/src/i18n/` — a single `translations.js` dictionary keyed by string id, each with `en`/`fr`/`ar` values; `useI18n()` resolves the active language and returns a `t(key)` function. Arabic renders full right-to-left, including navigation, tables and the Journey Map chart, not just mirrored text direction.
- **Data-entry pattern**: every module's Create/Edit flow follows the same shape — a `modal` state of `{ mode: 'add' | 'edit', id? } | null`, a `form` state seeded from a `BLANK_*` constant (add) or the selected record (edit), and a `submit()` that branches into `addSubItem` or `updateSubItem` (Section 4.3) — a deliberate, repeated convention so a developer who has read one module's CRUD code has read all of them.

### 3.3 Backend Architecture & Persistence Model

**Server**: a single Express app (`server/index.js`) with one JSON body-parsing middleware (25MB limit, raised well above Express's 100kb default since a data-rich tenant's full state can run to several MB) and no CORS, session, or authentication middleware of any kind — see the security note in Section 8.2.

**Dual SQLite driver** (`server/db.js`): journi's own Windows-installability requirement — `npm install` must succeed without a native C++ toolchain on a machine that may be running anything from Node 18 to the very latest release — is met by trying two interchangeable drivers in order:

1. **`node:sqlite`** (Node's built-in `DatabaseSync`, stable from Node 22.5+) — zero npm dependency, tried first.
2. **`better-sqlite3`** — kept as an `optionalDependency` specifically so a failed native build (e.g. no Visual Studio Build Tools on a fresh Windows machine, or no prebuilt binary for a very new Node ABI) never aborts `npm install` as a whole; it is the fallback for Node versions below 22.5.

If neither driver loads, the server fails fast with one actionable error at import time rather than an unintelligible crash later. `driver.supportsPragma` distinguishes the two — only `better-sqlite3` receives `PRAGMA journal_mode = WAL`.

**Schema** — one table, one row, a JSON-blob key-value store rather than a normalized relational schema:

```sql
CREATE TABLE IF NOT EXISTS app_state (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  data             TEXT,       -- JSON.stringify of the entire frontend `data` object (Section 4)
  current_user_id  TEXT,
  scope             TEXT,       -- JSON.stringify of { orgId, cmProjectId }
  updated_at       TEXT NOT NULL
)
```

This is a deliberate design choice, not an oversight: the frontend's own evolving state shape (`migrateOrSeed()` in `AppStateContext.jsx`) is treated as the single source of truth for what the data looks like, so a normalized SQL schema would be a second, driftable copy of the same shape. A production re-platform that needs per-entity querying, reporting joins, or multi-writer concurrency should normalize this into real tables (Section 8.3 discusses the tradeoff explicitly) — but should preserve the JSON field shapes in Section 4 as the schema-design input, since every module's frontend code is written directly against them.

**Storage location**: `${JOURNI_DATA_DIR:-<server>/data}/journi.db`, directory auto-created if missing.

### 3.4 State Synchronization

Persistence is debounced client-side, not per-mutation, and every write is a full-document overwrite:

1. On app load, the client fetches `GET /api/state` once. If the backend already holds data, it replaces the initial in-memory demo seed (rendered immediately for a no-flash first paint) with the server's data, `currentUserId`, and `scope`.
2. Every subsequent state change re-arms a 400ms debounce timer; when it elapses, the client sends the **entire** current `{ data, currentUserId, scope }` object as the body of `PUT /api/state`, coalescing bursts of rapid edits (e.g. typing in a field) into one write.
3. The server does not merge or patch — it JSON-stringifies the body and upserts the single `app_state` row. There is no optimistic-locking or versioning at the transport level: the last write to finish wins.
4. A failed save is swallowed silently and simply retried on the next state change; nothing is queued client-side beyond ordinary React state.

A developer tracing "why did my edit not save": check that the 400ms debounce elapsed, that `loadedFromServer` was already true when the edit happened (edits made before the initial `GET /api/state` resolves are held in memory and included in the next debounced save once it does), and that the server process could reach its SQLite file.

### 3.5 Deployment & Installation

The distributed package (`deliverables/journi_fullstack_windows.zip`) ships source only — `journi/` (frontend source, no `node_modules` or `dist`) and `server/` (backend source, no `node_modules`) — plus `install.bat`, `start-journi.bat`, and `WINDOWS_INSTALL.md`. `install.bat` runs `npm install` in both `journi/` and `server/`, then `npm run build` in `journi/` to produce `journi/dist`, which `server/index.js` serves statically with an SPA fallback (any unmatched path returns `index.html` so client-side routing works on a hard refresh/deep link). `start-journi.bat` launches `node server/index.js`, which listens on `process.env.PORT || 4000` and logs the resolved SQLite file path on startup. A rebuild targeting a different OS needs only `npm install && npm run build` (in `journi/`) and `npm start` (in `server/`) — the batch files are a Windows-convenience wrapper around otherwise standard Node tooling.

### 3.6 Internationalization Architecture

Every user-facing string is keyed in `journi/src/i18n/translations.js` with `en`/`fr`/`ar` values — no hardcoded UI string is acceptable outside that file (Section 2.5). Language precedence, resolved on every sign-in and every Organization switch: (1) the signed-in user's own explicit language preference, if set; (2) the newly-scoped Organization's configured Default Language (set on M1 by a Super Admin, Group Admin, or Organization Admin); (3) English as the platform fallback. A manual in-session language switch applies immediately but is session-local only — it never overwrites the stored user preference or the Organization default, and is re-resolved from the precedence order above on the next sign-in or Organization switch. Arabic renders full right-to-left: navigation, tables, and the Journey Map's chart mirror correctly, not just text direction.

### 3.7 Access Control Architecture

See Section 6.6.1–6.6.3 (M2) for the full Permission Matrix and Justification Governance functional requirements; this section summarizes the architecture. RBAC is enforced **entirely client-side** (`journi/src/utils/rbac.js`) — the API itself performs no authorization check of any kind (Section 5.2, Section 8.2). Nine roles (`super_admin, group_admin, org_admin, sponsor, change_manager, people_manager, practitioner, employee, executive`) are each scoped to one level of the Group → Organization → Project hierarchy. Each write/manage capability check (`canWrite`, `canManageHierarchy`, `canManageUsers`, `canActivateAiForOrg`, `canManageCharters`, `canManageAiUseCases`, `canManageTemplates`, `canRequestProjectAiOverride`) reads first from the runtime-editable Permission Matrix (`data.rolePermissions`, a role × capability grid seeded with sensible defaults and editable in place by a Super Admin on M2), falling back to hardcoded default logic only where a matrix entry is missing — so the matrix is a fail-safe override, never a bypass of the underlying model.

---

## 4. Data Model

journi persists one JSON document per installation (Section 3.3). This section is the authoritative field-level schema a rebuild must reproduce; every field name below is drawn directly from the reference implementation's default-object constants and seed data, not inferred.

### 4.1 Top-Level State Shape

| Key | Holds |
|---|---|
| `groups` | Array of Group objects — optional top tier of the hierarchy (a holding company / multi-entity corporate group). |
| `organizations` | Array of Organization objects — the primary tenant boundary. |
| `mainProjects` | Array of Main Project objects — the underlying business/IT initiative (e.g. an ERP rollout), distinct from a Change Management Project. |
| `cmProjects` | Array of Change Management Project objects — the core, heavily-nested working entity (Section 4.3). |
| `users` | Array of platform user/account objects (identity + RBAC scope). |
| `aiUseCaseCatalog` | Array of AI Use Case definitions — the shared, versioned catalog (M6). |
| `macroProcessCatalog` | Array of Macro Process reference entries (M4, MP-01…MP-10). |
| `e2eProcessCatalog` | Array of End-to-End Process Registry entries (M4, E2E-xx). |
| `phaseTemplateCatalog` | Array of Phase Template definitions — shared, versioned (M8). |
| `racsiGrid` | Object keyed by Macro Process id → `{ [role]: 'R'\|'A'\|'C'\|'S'\|'I'\|'' }` (M4 RACSI grid, editable). |
| `aiOrgActivation` | Object keyed by `orgId` → `{ [useCaseId]: boolean }` — whether an AI use case is switched on for an Organization (M6). |
| `aiProjectOverride` | Object keyed by `cmProjectId` → `{ [useCaseId]: boolean }` — per-project override of the Organization default (M6). |
| `aiUsageLog` | Array of AI usage/outcome audit-log entries, platform-wide (not nested per project). |
| `codebooks` | Object keyed by `orgId` → array of qualitative-coding Code objects (M16 Coding Workbench, org-scoped taxonomy). |
| `charters` | Array of CM Charter definitions (M5), each with a nested `entries[]` (Section 4.4). |
| `rolePermissions` | Object keyed by role → `{ [capabilityKey]: boolean }` — the runtime-editable Permission Matrix (M2). |
| `requireJustification` | Boolean — platform-wide Justification Governance flag (M2). |
| `license` | Single License object — SaaS-mode demo license record (M2). |

`currentUserId` and `scope` (`{ orgId, cmProjectId }`) are persisted alongside `data` (same server row, sibling fields) but are not part of `data` itself.

**Not persisted server-side by design**: the Real LLM Provider Connection's configuration (`{ provider, apiKey, model, baseUrl }`) lives only in the browser's `localStorage`, under a separate key from the rest of the application's data, so an API key is never bundled into a data export, never synced across machines, and survives a "Reset Demo Data" action untouched.

### 4.2 Reference/Catalog Data (Cross-Cutting, Not Nested Per Project)

These arrays back M3–M6 and M8 and are shared across every Organization and Project rather than duplicated per tenant: `aiUseCaseCatalog`, `macroProcessCatalog`, `e2eProcessCatalog`, `phaseTemplateCatalog`, `racsiGrid`, `charters` (definitions; compliance logging is per-project, Section 4.3), plus the constant reference tables described per-module in Section 6 (ADKAR block list, resistance types, RESISTANCE_TYPES, journeys/journeyTouchpoints, macroProcesses, e2eProcesses, crossTypeMatrix, benchmarks, mentoringStages, defaultCodebook, alertDefinitions — each a static JS module under `journi/src/data/`, not a database table, since they change only with a product release, not per-tenant).

### 4.3 Change Management Project — Field Reference

A `cmProject` object's own top-level fields: `id, orgId, mainProjectIds[]` (many-to-many link to zero, one, or more Main Projects — Section 6.1, M1), `name, changeManager, changeType, businessDriver, targetPopulation, successCriteria, lewinPhase, bridgesPhase, bridgesNote, sentimentSnapshot, aiUseCases[]` (activated-use-case-id strings), `changeLog[]`, `adkar{}`, `sponsor{}`, `sustainment{}`, plus every sub-collection array below.

| Collection | Module | Item shape |
|---|---|---|
| `adkar` (object, keyed by block) | M10 | `{ score: 1-5, note, history: [{ id, date, score, justification? }] }` |
| `changeLog` | M2 (governance) | `{ id, date, module, field, oldValue, newValue, justification }` — the Justification Governance audit trail (Section 6.6.2) |
| `risks` | M12 | `{ id, category: 'adoption'\|'sponsorship'\|'capacity'\|'saturation', description, likelihood: 1-5, impact: 1-5, owner, status: 'open'\|'mitigating'\|'closed', actions?: [{ id, description, owner, dueDate, status: 'open'\|'in_progress'\|'closed' }] }` — `actions[]` is the Mitigation Action Plan |
| `stakeholderGroups` | M9 | `{ id, name, headcount, impact: { process, tech, role, location, identity } (each 1-5), influence: 1-5 }` |
| `communications` | M14 | `{ id, message, audience, channel, sender, timing, adkarBlock, status: 'draft'\|'scheduled'\|'sent' }` |
| `trainings` | M15 | `{ id, curriculum, track, level: 'Foundation'\|'Practitioner'\|'Advanced', module, objectives, prerequisites, agenda, targetAudience, expectedResults, workshops, facilitator, format, completion: 0-100, certified: boolean }` |
| `resistanceLog` | M16 | `{ id, type: 'role'\|'skill'\|'will'\|'systemic', source, rootCause, severity: 1-5, mitigation, owner, dueDate, status: 'open'\|'in_progress'\|'closed', anonymous: boolean }` |
| `coachingNotes` | M16 / M17 | `{ id, managerName, cohort, barrierBlock, note }` |
| `journeyEvents` | M18 | `{ id, offsetDays, label, type: 'milestone'\|'communication'\|'assessment'\|'training' }` |
| `wbsTasks` | M8 | `{ id, track: 'pm'\|'cm'\|'framework', phase, name, baselineStart, baselineEnd, actualStart, actualEnd, accountabilityTag: 'PROJECT'\|'CHANGE'\|'JOINT', status: 'planned'\|'in_progress'\|'done'\|'at_risk', percentComplete: 0-100 }` |
| `phaseGates` | M8 | `{ id, phase, date, jointDecision: 'go'\|'go_with_conditions'\|'no_go', conditions, accountable: 'PM'\|'CM'\|'ES'\|'FPO'\|'ITL'\|'SUP', pmInput: { recommendation, notes }, cmInput: { recommendation, notes, readinessIndexSnapshot, checklistCompletionPct, openFlags } }` |
| `phaseChecklists` | M8 | `{ id, phase, track: 'pm'\|'cm', item, weight: 1-100, done: boolean }` |
| `charterActionLog` | M5 | `{ id, charterActionId (FK → static charter-actions catalog), date, note }` |
| `touchpointLog` | M19 | `{ id, touchpointId (FK → static journeyTouchpoints catalog), date, note }` |
| `codeTags` | M16 | `{ id, codeId (FK → codebooks[orgId]), sourceType, sourceId, linkedResistanceId: FK → resistanceLog \| null, date }` |
| `dismissedAlerts` | Notification Center | array of alert-id **strings** — the alerts themselves are always computed live (Section 6.6.4), never persisted; only dismissal state is |
| `fieldNotes` | M22 | `{ id, date, category, relatedModules: string[] (multi-select), title, body, author }` |
| `obsEntries` | M3 | `{ id, role, name, reportsTo: FK → another entry in the same project's obsEntries \| null, notes }` |
| `sponsor` (object) | M13 | `{ name, visibility: 'weak'\|'moderate'\|'strong', visibilityNote, members: [{ id, name, role, influence: 1-5, engagement: 1-5 }], actions: [{ id, action, phase: 'Prepare'\|'Manage'\|'Reinforce', done: boolean }] }` |
| `sustainment` (object) | M21 | `{ checkpoints: [{ id, label: '30-day'\|'60-day'\|'90-day', daysAfterGoLive, adoptionRate, regressionRisk: 'low'\|'moderate'\|'high'\|null, status: 'not_due'\|'complete' }], quickWins: [{ id, title, date }], lessonsLearned: [{ id, text, linkedRuleOrControl?, status?: 'pending'\|'applied' }], signoff: boolean }` |

Computed-only values (never stored — recomputed from the fields above on every render): `riskScore`/`isHighSeverityRisk` (M12), `taskGapDays`/`gapTone` (M8), phase-checklist completion percentage (M8), the Composite Readiness Index and divergence flags (M20), and every live alert condition (Notification Center).

### 4.4 Charter Definitions (M5, Shared Catalog)

`charters[]` (top-level, not per-project): `{ id, name, category, what, who, when, where, why, how, ownerRole, racsi, governingScope, version, reviewCadence, status: 'Active'\|'Retired', entries: [{ ...action-mapping fields — pdcaStage, sequence, linkedMacroProcess/Task/Phase, responsibleRole, accountableRole, frequency }] }`.

### 4.5 Entity Relationship Summary

```
Group (0..1) ──< Organization >── License (per-org context via M2)
Organization ──< MainProject
Organization ──< CmProject
MainProject  >──< CmProject          (many-to-many via cmProject.mainProjectIds[])
Organization ──< User                 (scoped by scopeType/scopeId to org, group, or a specific project)
CmProject    ──< every sub-collection in Section 4.3 (1-to-many, embedded arrays — not separate tables)
Organization ──< aiOrgActivation entry
CmProject    ──< aiProjectOverride entry
Organization ──< codebooks entry ──< codeTags (per CmProject, referencing codebooks[orgId])
```

No sub-collection item is ever referenced from more than one `cmProject` — every relationship below the CmProject level is a plain embedded array, not a foreign-keyed table, which is what makes the single-JSON-document persistence model in Section 3.3 a faithful fit rather than a shortcut.

---

## 5. External Interface Requirements

### 5.1 User Interface Conventions

- **Shell**: a fixed TopBar (wordmark, Organization/Project scope selector, Notification Center bell, current user) and a Sidebar (Section 1.6's two-section module list), with routed content filling the remaining viewport.
- **CRUD pattern**: every module's Add/Edit flow opens the shared `Modal` component; every list view pairs an `Edit` (secondary-style) and `Delete` (danger-style) button per row, gated by the same role/capability check as the module's own write access (Section 3.7).
- **Status encoding**: the shared `Badge` component renders a colored pill (tone: brand/green/amber/red/gray/sand) for every status, severity, or classification field across all 22 modules — journi's shared visual vocabulary for "attention needed."
- **RTL**: every layout listed above mirrors correctly under Arabic (Section 3.6), not just inline text.

### 5.2 API Interface

#### 5.2.1 Reference Implementation API (as-built)

The backend exposes exactly two functional endpoints — this is a whole-state store, not a per-resource REST API; all entity-level create/update/delete logic lives client-side (Section 3.2, 4.3) and is expressed on the wire only as the net effect on the one JSON document below.

| Method | Path | Request Body | Response | Notes |
|---|---|---|---|---|
| GET | `/api/health` | — | `{ ok: true }` | Liveness check. |
| GET | `/api/state` | — | `{ data, currentUserId, scope }`, or `{ data: null, currentUserId: null, scope: { orgId: null, cmProjectId: null } }` on an empty database; `500 { error }` on failure | Reads the entire application state. No authentication, no scoping/filtering by caller — returns everything. |
| PUT | `/api/state` | `{ data, currentUserId, scope }` (the client's entire in-memory state) | `{ ok: true }`; `500 { error }` on failure | Full blind overwrite of the single stored row — no merge, no shape validation, no optimistic-locking/versioning. |
| GET | `*` | — | Static file from `journi/dist` if present, else `index.html` (SPA fallback) | Frontend hosting; if `journi/dist` is missing, returns `500` with an actionable build-reminder message instead. |

This is sufficient for the reference build's single-machine, single-tenant-session usage pattern, but is explicitly not a target to replicate for a multi-user or production rebuild (Section 8.2, NFR-05, NFR-09). Section 5.2.2 specifies the resource-oriented API a rebuild should implement instead.

#### 5.2.2 Recommended Target API for a Rebuild

A rebuild should replace the whole-blob store with a conventional resource-oriented REST API, one route family per entity/sub-collection in Section 4, so that per-entity access control, partial updates, transport-level audit logging, and multi-writer concurrency (NFR-09) all become possible. The table below is the recommended route set; request/response bodies follow the field shapes already specified in Section 4.3 — nothing here changes what data looks like, only how it is addressed and mutated.

**Conventions**: all routes are prefixed `/api/v1`; authentication is a bearer token or session cookie issued by `POST /api/v1/auth/login` (Section 8.2, NFR-03 closure); every mutating request must carry `Authorization`; every response uses standard HTTP status codes (200/201/204/400/401/403/404/409/500); every entity carries a server-assigned `updatedAt` and an opaque `version` (or `ETag`), and an Update request must send `If-Match`/`version` — a mismatch returns `409 Conflict` with the current server copy, closing the last-write-wins gap in NFR-09; list endpoints support `?orgId=`/`?cmProjectId=` scoping query parameters so a client never has to fetch data outside its own tenant boundary, and the server — not the client — enforces that boundary per the signed-in user's role and scope (Section 3.7), closing NFR-03.

| Resource | Routes | Notes |
|---|---|---|
| Auth / session | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Replaces the reference build's client-side-only "sign in as a demo persona" picker with real credential verification. |
| Groups | `GET/POST /groups`, `GET/PATCH/DELETE /groups/:id` | M1. |
| Organizations | `GET/POST /organizations`, `GET/PATCH/DELETE /organizations/:id` | M1; `DELETE` cascades per FR-M1-04. |
| Main Projects | `GET/POST /organizations/:orgId/main-projects`, `GET/PATCH/DELETE /main-projects/:id` | M1. |
| Change Management Projects | `GET/POST /organizations/:orgId/cm-projects`, `GET/PATCH/DELETE /cm-projects/:id` | M1/M7; `mainProjectIds[]` managed via `PATCH`. |
| Users | `GET/POST /users`, `GET/PATCH/DELETE /users/:id` | M2. |
| Permission Matrix | `GET /role-permissions`, `PATCH /role-permissions/:role` | M2, FR-M2-02/03; `super_admin` only. |
| Governance settings | `GET/PATCH /governance` | M2, `requireJustification` toggle. |
| License | `GET/PATCH /license` | M2. |
| OBS entries | `GET/POST /cm-projects/:id/obs-entries`, `PATCH/DELETE /obs-entries/:entryId` | M3. |
| Macro Process / E2E / RACSI catalogs | `GET /catalog/macro-processes`, `GET /catalog/e2e-processes`, `GET /racsi-grid`, `PATCH /racsi-grid/:macroProcessId` | M4; catalogs are read-only per FR-M4-01, RACSI grid is the one editable piece. |
| Charters | `GET/POST /charters`, `GET/PATCH/DELETE /charters/:id`, `GET/POST /charters/:id/entries`, `PATCH/DELETE /charter-entries/:entryId` | M5; `DELETE /charters/:id` returns `409` if status is Active (FR-M5-02). |
| Charter Action catalog | `GET /catalog/charter-actions` | M5; read-only. |
| Charter Action Log | `GET/POST /cm-projects/:id/charter-action-log`, `DELETE /charter-action-log/:logId` | M5; no `PATCH` — append/delete only, per FR-M5-04. |
| Mentoring stages | `GET /catalog/mentoring-stages` | M5; read-only. |
| AI Use Case catalog | `GET/POST /ai-use-cases`, `GET/PATCH/DELETE /ai-use-cases/:id`, `POST /ai-use-cases/:id/revert` | M6. |
| AI activation | `GET/PATCH /organizations/:orgId/ai-activation`, `GET/PATCH /cm-projects/:id/ai-override` | M6. |
| AI usage log | `GET/POST /ai-usage-log` | M6; append-only. |
| Initiative metadata / Change Log | `PATCH /cm-projects/:id/meta`, `GET/POST /cm-projects/:id/change-log` | M7; Change Log is append-only, written by every module's justified-change flow. |
| WBS tasks | `GET/POST /cm-projects/:id/wbs-tasks`, `PATCH/DELETE /wbs-tasks/:taskId` | M8. |
| Phase Checklists | `GET/POST /cm-projects/:id/phase-checklist`, `PATCH/DELETE /phase-checklist/:itemId` | M8. |
| Phase Gates | `GET/POST /cm-projects/:id/phase-gates`, `DELETE /phase-gates/:gateId` | M8; no `PATCH`, per FR-M8-03. |
| Phase Template library | `GET/POST /phase-templates`, `GET/PATCH/DELETE /phase-templates/:id`, `POST /phase-templates/:id/revert`, `POST /cm-projects/:id/wbs-tasks/load-template` | M8. |
| Stakeholder Groups | `GET/POST /cm-projects/:id/stakeholder-groups`, `PATCH/DELETE /stakeholder-groups/:groupId` | M9. |
| ADKAR | `GET /cm-projects/:id/adkar`, `PATCH /cm-projects/:id/adkar/:block` | M10; `PATCH` requires `justification` in the body whenever `requireJustification` is true (FR-X-10). |
| Coaching Notes | `GET/POST /cm-projects/:id/coaching-notes`, `PATCH/DELETE /coaching-notes/:noteId` | M10/M17; a rebuild should add the `PATCH`/`DELETE` the reference build is missing (Section 10.3, item 1). |
| Bridges / Sentiment | `PATCH /cm-projects/:id/bridges`, `PATCH /cm-projects/:id/sentiment` | M11; justified-change. |
| Risks | `GET/POST /cm-projects/:id/risks`, `PATCH/DELETE /risks/:riskId`, `GET/POST /risks/:riskId/actions`, `PATCH/DELETE /risk-actions/:actionId` | M12; a rebuild should allow full `PATCH` on a risk's core fields, not status only (Section 10.3, item 4). |
| Sponsor / Coalition | `GET/PATCH /cm-projects/:id/sponsor`, `GET/POST /sponsor/:id/members`, `PATCH/DELETE /coalition-members/:memberId`, `GET/POST /sponsor/:id/actions`, `PATCH/DELETE /sponsor-actions/:actionId` | M13; a rebuild should add coalition-member and sponsor-action CRUD the reference build is missing (Section 10.3, items 2–3). |
| Communications | `GET/POST /cm-projects/:id/communications`, `PATCH/DELETE /communications/:commId` | M14. |
| Trainings | `GET/POST /cm-projects/:id/trainings`, `PATCH/DELETE /trainings/:trainingId` | M15; certification `PATCH` is justified-change. |
| Resistance Log | `GET/POST /cm-projects/:id/resistance-log`, `PATCH/DELETE /resistance-log/:entryId` | M16. |
| Codebook (org-scoped) | `GET/POST /organizations/:orgId/codebook`, `PATCH/DELETE /codebook/:codeId` | M16; a rebuild should add `PATCH`, missing in the reference build (Section 10.3, item 7). |
| Code Tags | `GET/POST /cm-projects/:id/code-tags`, `DELETE /code-tags/:tagId` | M16. |
| Manager Readiness | `PATCH /cm-projects/:id/manager-readiness` | M17; justified-change. |
| Journey Events | `GET/POST /cm-projects/:id/journey-events`, `PATCH/DELETE /journey-events/:eventId` | M18. |
| Journeys / Touchpoints / Dashboards / Context Overlay catalogs | `GET /catalog/journeys`, `GET /catalog/journey-touchpoints`, `GET /catalog/journey-dashboards`, `GET /catalog/project-context-overlay` | M19; read-only. |
| Touchpoint Log | `GET/POST /cm-projects/:id/touchpoint-log`, `DELETE /touchpoint-log/:logId` | M19; no `PATCH`, per FR-M19-02. |
| Analytics roll-ups | `GET /organizations/:orgId/analytics?level=project\|organization\|group`, `GET /catalog/benchmarks`, `GET /catalog/cross-type-matrix` | M20; server computes and returns the Readiness Index/benchmarking values rather than the client, closing the trust boundary the reference build's client-side computation implies. |
| Sustainment | `GET/PATCH /cm-projects/:id/sustainment`, `POST /sustainment/:id/checkpoints/:label/record`, `GET/POST /sustainment/:id/quick-wins`, `PATCH/DELETE /quick-wins/:winId`, `GET/POST /sustainment/:id/lessons`, `PATCH/DELETE /lessons/:lessonId`, `PATCH /sustainment/:id/signoff` | M21; a rebuild should add full Quick Win and Lesson CRUD the reference build is missing (Section 10.3, items 5–6). |
| Field Notes | `GET/POST /cm-projects/:id/field-notes`, `PATCH/DELETE /field-notes/:noteId` | M22. |
| Alert definitions | `GET /catalog/alerts` | Cross-cutting; read-only. |
| Alerts (computed) | `GET /cm-projects/:id/alerts`, `POST /cm-projects/:id/alerts/:alertId/dismiss`, `POST /cm-projects/:id/alerts/:alertId/restore` | Cross-cutting, FR-X-04 through FR-X-08; the server computes live conditions rather than the client. |
| CSV export | `GET /cm-projects/:id/{collection}/export.csv`, `GET /organizations/:orgId/analytics/export.csv` | Cross-cutting, FR-X-01 through FR-X-03; may remain a server-generated file instead of the reference build's client-side Blob generation. |

A rebuild is not obligated to implement every route above before shipping — Section 10.3's known-gaps table already flags which sub-resources (coaching notes, coalition members, sponsor actions, quick wins, lessons, codebook entries, phase gates) the reference build itself ships without full CRUD, and the API design above simply makes each of those a first-class route so closing a gap later is additive, not a redesign.

### 5.3 Hardware Interfaces

None. journi is a standard web application with no direct hardware interface requirement.

### 5.4 Software Interfaces

- **Node.js** ≥ 18 runtime (Section 2.4).
- **SQLite**, via `node:sqlite` or `better-sqlite3` (Section 3.3) — no external database server.
- **Optional**: a third-party LLM provider (Anthropic, OpenAI, Google, or a custom OpenAI-compatible endpoint) for M6's Real LLM Provider Connection, called directly from the browser — deliberately bypassing journi's own backend even though one now exists for state persistence, so that a production, multi-user deployment is not forced to store third-party API keys server-side; the connection is opt-in and every AI use case falls back to a deterministic built-in generator if it is not configured or a call fails.

---

## 6. Functional Requirements

### 6.0 Conventions

Each module below lists: its purpose and the framework(s) it operationalizes; the fields it captures; numbered functional requirements (`FR-M`*n*`-`*nn*); the business rules/computations it applies; its role gating; and its cross-module integration points. Every module follows the same shared CRUD, RBAC, and AI-governance conventions described in Sections 3.2, 3.7, and 6.6 — those are not repeated per module except where a module's actual behavior deviates from them, which is called out explicitly rather than silently assumed. Section 10.3 (Known Functional Gaps) collects every such deviation in one place for planning purposes.

### 6.1 Platform & Governance (M1–M6)

#### 6.1.1 M1 — Tenant & Org Hierarchy

**Purpose.** The structural backbone of journi: Group (optional) → Organization → Projects, and within Projects, a Main Project (the underlying business/IT initiative) many-to-many linked to zero or more Change Management Projects (the people-side initiative that manages its adoption).

**Data captured.** Group: name. Organization: name, groupId, sector, employeeCount, sites, languages, defaultLanguage. Main Project: name, type (one of ten values — the eight transformation types plus Restructuring and M&A), scope, durationMonths, budgetBand, executiveSponsor. Change Management Project: name, orgId, `mainProjectIds[]`, changeManager, changeType, targetPopulation, businessDriver, successCriteria.

**Functional requirements.**
- FR-M1-01: The system shall support full Create, Read, Update, and Delete on Group, Organization, Main Project, and Change Management Project records, gated by `canManageHierarchy` (Section 3.7).
- FR-M1-02: A Change Management Project shall link to zero, one, or more Main Projects via `mainProjectIds[]` — a many-to-many relationship, not the one-to-one link of earlier product iterations — supporting both a fully independent OCM initiative (no Main Project link) and a multi-site rollout where several regional CM Projects share one Main Project.
- FR-M1-03: Deleting a Group shall not delete its member Organizations; it shall null their `groupId`, converting them to standalone Organizations.
- FR-M1-04: Deleting an Organization shall cascade-delete its Main Projects, Change Management Projects, associated AI activation/override state, and any user accounts scoped directly inside it.
- FR-M1-05: Deleting a Main Project shall unlink it from (not delete) any Change Management Project that referenced it via `mainProjectIds[]`.
- FR-M1-06: Deleting a Change Management Project shall also remove any user accounts scoped directly to that project.
- FR-M1-07: The Organization record shall carry a Default Language field, editable by the same role set, driving the language-precedence rule in Section 3.6.
- FR-M1-08: The hierarchy view shall display, for each Main Project, the count of Change Management Projects currently linked to it, and shall badge a Change Management Project with no Main Project link as "standalone."

**Frameworks integrated.** None directly — this is the structural layer every framework-bearing module (M7 onward) is scoped against.

**Primary users.** Super Admin, Group Admin, Organization Admin, PMO.

#### 6.1.2 M2 — Identity & RBAC

**Purpose.** User account management, the runtime-editable Permission Matrix, platform-wide governance toggles, and a lightweight license/plan record. Organized into four tabs: Users & Scope, Permission Matrix, Governance Settings, License & Plan.

**Data captured.** User: name, email, role (one of the nine roles in Section 3.7), scopeType, scopeId, language. Permission Matrix: 9 roles × 8 capabilities (`manageHierarchy, manageUsers, write, activateAiForOrg, requestProjectAiOverride, manageCharters, manageAiUseCases, manageTemplates`). Governance: `requireJustification` (platform-wide boolean). License: mode (SaaS/OnPrem), plan, companyName, maxUsers, issueDate, expiryDate, features[], and (OnPrem) an uploaded `.lic` JSON file's companyId/hardwareId.

**Functional requirements.**
- FR-M2-01: The system shall support Create, Update (role only), and Delete on User records, gated by `canManageUsers`. Name, email, and scope are set at creation and are not independently editable after — a rebuild targeting fuller account-lifecycle management should add this.
- FR-M2-02: The Permission Matrix tab shall render all 9 roles × 8 capabilities as an editable grid, editing gated to `super_admin` only regardless of any Permission Matrix entry (this one gate is intentionally hardcoded, not itself matrix-driven, to prevent a misconfiguration from locking every admin out of the matrix).
- FR-M2-03: Every edit to a Permission Matrix cell shall take effect immediately, platform-wide, for every Organization, without a code change or restart.
- FR-M2-04: The Governance Settings tab shall expose a single `requireJustification` toggle, defaulting to true, gated by `canManageHierarchy`.
- FR-M2-05: The License & Plan tab shall display current plan, seat usage against `maxUsers` with an over-capacity flag when exceeded, and an expiry countdown color-coded red (expired), amber (<30 days), or green (otherwise).
- FR-M2-06: Uploading a `.lic` file shall validate the presence of required fields (version, companyId, companyName, hardwareId, expiryDate, maxUsers, plan, features, issueDate) but does not verify a cryptographic signature — this is a reference-build simplification, not a production licensing control; a Super Admin may revert to SaaS mode at any time.

**Frameworks integrated.** None directly — this module is the control plane every other module's write-gating reads from.

**Primary users.** Super Admin, Group/Organization Admin, all downstream roles (read of their own account).

#### 6.1.3 M3 — Organizational Breakdown Structure (OBS)

**Purpose.** A per-project resourcing roster — role, named person, and reporting line — distinct from M2's login/RBAC user accounts: an OBS entry needs no journi login, since it exists to be *referenced* (as an assignee) by other modules, not to authenticate.

**Data captured.** role (free text), name, `reportsTo` (id of another OBS entry in the same project, or null for the top of the structure), notes.

**Functional requirements.**
- FR-M3-01: The system shall support full Create, Read, Update, and Delete on OBS entries, gated by `canWrite`.
- FR-M3-02: Deleting an OBS entry shall re-parent its direct reports to the deleted entry's own manager (`reportsTo`) rather than leaving them orphaned.
- FR-M3-03: The roster view shall render depth-first, roots first, with indentation reflecting reporting depth, not creation order.
- FR-M3-04: The OBS roster shall be consumable as an "Assigned to" source by other modules (M8's WBS tasks, at minimum), so a task can name a specific person from this project's own resourcing structure rather than free text.

**Frameworks integrated.** None directly — supporting reference data for M8.

**Primary users.** Change Manager, PMO, Practitioner, People Manager.

#### 6.1.4 M4 — Macro Process, SIPOC, RACSI & End-to-End Process Registry

**Purpose.** The process backbone every other module is built on, made browsable in one place. Ten Macro Processes (MP-01–MP-10) are the atomic units of journi's process model; every module owns one or more of them. Seventeen End-to-End (E2E) Process chains are registered against that backbone, grouped by kind: core lifecycle chains spanning the whole engagement, cross-cutting loop chains making an existing cross-module dependency explicit as its own registered chain (e.g. the PM ↔ CM Governance Bridge realized by M8's Phase Gates), and one E2E lifecycle per transformation type, each with its own rolled-up SIPOC and linked Phase Template (M8).

**Data captured (reference, mostly read-only).** Macro Process: id, name, description, primary modules. E2E Process: id, name, kind, ordered Macro Process chain, trigger, terminal state, RACSI (using the 7-code role taxonomy ES/CM/PM/FPO/ITL/SUP/EU), related modules, and — for transformation-type entries — SIPOC suppliers/customers and a linked Phase Template id. RACSI Grid: one row per Macro Process × 6 platform roles.

**Functional requirements.**
- FR-M4-01: The Macro Process Catalog and E2E Process Registry shall be read-accessible to every role; this reference data is not user-editable in the current build (a future release adding admin-editable process taxonomy should preserve read access for all roles as a baseline).
- FR-M4-02: The RACSI Grid tab shall be editable in place, one cell at a time, gated by `canManageHierarchy`; every other role sees it read-only.
- FR-M4-03: An E2E Process entry of kind "transformation type" shall resolve and display its linked Phase Template by id, and its rolled-up SIPOC.

**Frameworks integrated.** Cross-cutting — the canonical source for the Macro Process and E2E Process vocabulary referenced throughout this document; also hosts the RACSI governance layer referenced by M8's Phase Gates.

**Primary users.** All roles (read); Super Admin, Group/Organization Admin (RACSI grid edits).

#### 6.1.5 M5 — Change Management Charter Registry

**Purpose.** Eight signed, trackable behavioral standards — one each for sponsorship, participative management, communication, organizational impact, team coaching, one-to-one coaching, mentoring, and pulse/interview discipline — each naming specific, observable actions with a concrete mapping to the Macro Processes/tasks that generate them, plus a per-project compliance log. Organized into three tabs: Charters, Charter Action Mapping, and a read-only Mentoring Progression reference (the three-stage Trainee → Observer → Autonomous competency model).

**Data captured.** Charter: name, PDCA cycle, RACSI, primary linked Macro Process, governing scope (Project/Organization/Group), status (Active/Draft/Retired), version, effective date, review frequency, and one or more Entries (category, owner, What/Who/When/Where/Why/How). Charter Action (static reference): PDCA stage, sequence, category, linked Macro Process/task/step/lifecycle phase, responsible/accountable role, frequency. Charter Action Log (per project): charterActionId, date, note.

**Functional requirements.**
- FR-M5-01: The system shall support full Create, Read, Update, and Delete on Charters and their Entries, gated by `canManageCharters`.
- FR-M5-02: A Charter with status "Active" shall not be deletable; it must be transitioned to "Retired" before its Delete control is enabled. Delete itself is gated separately by `canDeleteCharter`, a fixed set (Super/Group/Org Admin) that deliberately excludes Change Manager even though Change Managers can create and edit charters.
- FR-M5-03: The Charter Action catalog and Mentoring Progression model are static reference data with no CRUD UI.
- FR-M5-04: The system shall support Create and Delete (not Update) on Charter Action Log entries, gated by `canWrite`; correcting a logged entry is done by delete-and-relog rather than in-place edit.
- FR-M5-05: The Action Mapping & Compliance tab shall be filterable by charter and shall show, per action, up to three recent log instances plus a count of any remainder.

**Frameworks integrated.** Prosci Sponsor Model and Kotter Step 2 (Sponsorship Charter); Kotter Step 5 (Participative Management); Kotter Step 4 (Communication); Prosci Impact & Stakeholder Analysis (Organizational Impact); the Divergence Case recovery workflow (One-to-One Coaching); M15's trained-versus-capable distinction (Mentoring).

**Primary users.** Change Manager, Training Lead, People Manager (compliance logging); all roles (read).

#### 6.1.6 M6 — AI Use Case Library & Governance

**Purpose.** The governed catalog and control plane for every AI capability in journi. Every use case is restricted to one of two tiers — Assistive or Augmented — deliberately excluding Autonomous AI: no use case may take an irreversible action on its own. Also hosts the optional Real LLM Provider Connection every `AiSuggestionBox` instance across the program modules calls into.

**AI tiers.** *Assistive*: the AI observes, analyzes, or suggests; a human performs the task and decision (e.g. flagging a barrier pattern). *Augmented*: the AI performs a substantial part of the task — drafting, classifying, summarizing at scale — but a human must review, edit, and approve before it is finalized or distributed (e.g. drafting an executive readiness narrative). Autonomous AI is out of scope entirely; a future release adding it must govern it as a separate, explicitly-gated tier rather than folding it into these two.

**Data captured.** AI Use Case (14 seeded, versioned): id, name, tier, module, description, trigger, output, an editable `promptTemplate` (the literal text sent to the LLM), humanCheckpoint, version history. LLM Provider Connection (browser-local only — Section 4.1): provider, apiKey, model, baseUrl. AI Usage Log: useCaseId, orgId, cmProjectId, outputSummary, outcome (accepted/edited/rejected), user, timestamp.

**Functional requirements.**
- FR-M6-01: The system shall support full Create, Read, Update, Delete, and version-revert on the AI Use Case catalog, gated by `canManageAiUseCases`.
- FR-M6-02: Deleting a use case shall also purge its keys from the organization and project activation maps.
- FR-M6-03: An Organization Admin or above (`canActivateAiForOrg`) shall be able to activate or deactivate each use case independently per Organization.
- FR-M6-04: A Change Manager or above (`canRequestProjectAiOverride`) shall be able to override the Organization's activation state for one specific project, as a tri-state choice (inherit / on / off); effective activation is the project override if set, else the Organization's activation.
- FR-M6-05: Deactivating a use case shall immediately stop new AI-generated suggestions in that scope; previously generated and human-approved content shall never be retroactively removed.
- FR-M6-06: Every AI-generated output shall be visually labeled as AI-generated and requiring review, wherever it appears in the interface.
- FR-M6-07: Every AI suggestion's outcome — accepted as-is, edited, or rejected — shall be logged to the AI Usage Log for governance reporting; the log itself is append-only, with no edit or delete UI.
- FR-M6-08: The Real LLM Provider Connection shall store its configuration, including the API key, only in the browser's `localStorage`, under a key namespace separate from the rest of the application's data, so it is never included in a data export, never synced to the backend, and survives a "Reset Demo Data" action untouched (Section 4.1, Section 5.4).
- FR-M6-09: If a configured LLM call fails for any reason (missing key, network/CORS error, unexpected response), the calling use case shall fall back to its deterministic built-in generator automatically, so a misconfigured or absent connection never blocks a workflow.
- FR-M6-10: An AI use case shall never grant a user visibility they would not otherwise have under RBAC — it operates strictly within the data-visibility boundary of the module it plugs into.

**Frameworks integrated.** Cross-cutting — accelerates the analysis/drafting work within every framework-bearing module; tier discipline follows POWERACT's own AI-training-curriculum vocabulary.

**Primary users.** Super Admin, Group/Organization Admin (activation, provider connection, catalog authoring); Change Manager, Trainer, Communications Practitioner, People Manager (consumption, all program modules).

### 6.2 Change Management Program (M7–M22)

#### 6.2.1 M7 — Initiative Registry

**Purpose.** The single-project detail view and organization-wide portfolio table for a Change Management Project: core metadata, the Lewin macro-state (Unfreeze/Change/Refreeze) under justified-change governance, the live Composite Readiness Index, and the full justified-change audit log (the "Change Log").

**Data captured.** changeType, lewinPhase (justified), businessDriver, targetPopulation, successCriteria; linked Main Project(s), read-only here (edited on M1); Change Log entries (date, module, field, oldValue, newValue, justification).

**Functional requirements.**
- FR-M7-01: businessDriver, targetPopulation, successCriteria, and changeType shall be editable in place (auto-saved on blur) via `updateProjectMeta`, gated by `canWrite`.
- FR-M7-02: A change to `lewinPhase` shall follow the stage-then-justify pattern (Section 6.6.2): a pending value plus a justification note, saved atomically to the Change Log, with Save disabled until a justification is present whenever `requireJustification` is on.
- FR-M7-03: The Change Log shall be append-only — no edit or delete of a logged entry — and shall aggregate justified changes logged from this module and from every other module that calls the shared `logJustifiedChange`/`updateAdkar` mutators (M10, M11, M13, M15, M16, M17, M12).
- FR-M7-04: The system shall compute a Composite Readiness Index per project as `(ADKAR average % × 0.5) + (sentiment score × 0.25) + (training completion average % × 0.25)`, displayed both on the single-project view and in the organization-wide portfolio table.
- FR-M7-05: The portfolio table shall list every Change Management Project visible to the signed-in role within the current Organization, with its Lewin phase and Readiness Index.

**Frameworks integrated.** Lewin (Unfreeze–Change–Refreeze) as the organizing macro-state; Prosci's 3-Phase Process (Prepare, Manage, Reinforce) as the default project lifecycle.

**Primary users.** PMO, Change Manager, Sponsor.

#### 6.2.2 M8 — Work Breakdown Structure & Gantt

**Purpose.** A single Work Breakdown Structure spanning three tracks — Project Management, Change Management, and the Lewin/Prosci/Bridges/ADKAR framework milestones — so a Change Manager, PMO, and Sponsor share one timeline. Every task carries a baseline and an optional actual date pair, surfacing a schedule gap task-by-task and as a portfolio average. Also hosts Phase Checklists, Phase Gate joint-decision records, a read-only cross-reference into M5's Charter Actions log, and the shared Phase Template library.

**Data captured.** WBS Task: track (pm/cm/framework), accountability tag (Project/Change/Joint — deliberately distinct from track), phase, name, assignee (from M3's OBS roster), baseline start/finish, optional actual start/finish, status. Phase Checklist item: phase, track, item, weight%, done. Phase Gate ("Joint Decision Record"): phase, date, independent PM and CM recommendations with notes (the CM input auto-carrying a Composite Readiness Index snapshot, checklist completion %, and open flags), the fused joint decision (Go / Go with Conditions / No-Go), and exactly one Accountable role selected from the RACSI role-code list. Phase Template (shared, versioned, 8 seeded): per-phase name, CM-track actions, checklist items, gate review questions.

**Functional requirements.**
- FR-M8-01: The system shall support full Create, Read, Update, and Delete on WBS tasks.
- FR-M8-02: The system shall support Create, Read, and Delete (done-toggle counts as the only field-level update) on Phase Checklist items.
- FR-M8-03: The system shall support Create and Delete on Phase Gates; a recorded Joint Decision is treated as immutable once logged and has no Edit — correcting one requires deleting and re-recording it. A rebuild wanting mutable gate records should add this deliberately, not assume it already exists.
- FR-M8-04: "Load Phase Template" shall seed the PM track with one skeleton task per phase of a selected Phase Template, evenly spaced from a chosen start date, defaulting to the template matching the linked Main Project's transformation type; this is a starting skeleton, not a finished plan, and does not itself constitute editing the template.
- FR-M8-05: The Phase Template library shall support full Create, Update, Delete, and version-revert, gated by `canManageTemplates`, independent of the per-project WBS CRUD above.
- FR-M8-06: The system shall compute, per task with an actual date recorded, a schedule-gap value in days, and shall render it color-coded (on-time/ahead, minor slip, significant slip); a portfolio-level summary shall show total tasks, tasks on-track or ahead, tasks at risk, and the average gap.
- FR-M8-07: A framework-track task may be zero-duration (baseline start equals finish), rendered as a marker rather than a bar, for discrete state transitions (e.g. "Unfreeze → Change") rather than continuous work.
- FR-M8-08: Every task, checklist item, and gate shall additionally be filterable against the seven generic P1–P7 lifecycle phases that every type-specific Phase Template rolls up into, auto-mapped from the task's own phase label.
- FR-M8-09: A Phase Gate's CM input fields (readiness index snapshot, checklist completion %, open flags) shall auto-populate from live computed values (M7's Readiness Index, this module's own checklist completion, and M11/M16's divergence/stalled-block flags) at the moment the gate modal opens.
- **Known deviation** (Section 10.3): this module's write-access check calls `canWrite(currentUser?.role)` without passing the Permission Matrix, unlike every other module — so a Super Admin's runtime edits to the Permission Matrix do not affect M8's write gating, which always falls back to the hardcoded default role set. A rebuild should pass the matrix here for consistency with the rest of the application, unless this is confirmed as an intentional exception.

**Frameworks integrated.** Cross-cutting — gives Lewin, Prosci, Bridges, and ADKAR a shared timeline alongside the Project Management delivery track; Phase Gates implement the PM ↔ CM Governance Bridge cross-cutting E2E chain (M4).

**Primary users.** PMO, Change Manager, Sponsor.

#### 6.2.3 M9 — Stakeholder & Impact Mapping

**Purpose.** Identifies who is affected by a change, how heavily, and in what dimension, so effort (deep ADKAR tracking versus light-touch communication) is proportional to risk.

**Data captured.** name, headcount, impact across five dimensions (process, technology, role, location, identity, each 1–5), influence (1–5).

**Functional requirements.**
- FR-M9-01: The system shall support full Create, Read, Update, and Delete on stakeholder groups, gated by `canWrite`.
- FR-M9-02: The system shall automatically flag a stakeholder group as "High Impact / Low Influence" when its average impact across the five dimensions is ≥ 3.6 and its influence is ≤ 2 — the population most at risk of being under-supported.
- FR-M9-03: Each impact-dimension cell shall be color-coded by severity (red ≥ 4, amber = 3, brand-neutral < 3).

**Frameworks integrated.** Prosci Impact & Stakeholder Analysis; determines which cohorts receive deep ADKAR tracking on M10.

**Primary users.** Change Manager, People Managers, PMO.

#### 6.2.4 M10 — ADKAR Engine

**Purpose.** The heart of person/cohort-level tracking: the five ADKAR building blocks (Awareness, Desire, Knowledge, Ability, Reinforcement), each under justified-change governance, plus an AI-assisted Desire-barrier diagnosis-and-coaching workflow and manager coaching-note capture.

**Data captured.** Per block: score (1–5), justification note, history (date, score, justification). Coaching Note: manager name, cohort, barrier block, note.

**Functional requirements.**
- FR-M10-01: A change to any ADKAR block's score shall follow the stage-then-justify pattern, appended to that block's own history and to the project Change Log.
- FR-M10-02: The system shall flag any block scoring ≤ 2 as "stalled," shown with an amber badge and an auto-flag banner.
- FR-M10-03: The system shall support Create (not Update or Delete) on Coaching Notes via the generic sub-item Add — this is a known gap (Section 10.3): a coaching note, once logged, cannot be corrected or removed from this module, and is displayed read-only again in M17.
- FR-M10-04: The Desire-diagnosis workflow shall be a bespoke two-step assistive flow, distinct from the generic AI Use Case card pattern: step one diagnoses the stalled Desire score citing Resistance Log and sentiment evidence; on confirmation, step two offers to draft a manager coaching script. Each step requires an explicit Confirm/Discard decision.

**Frameworks integrated.** ADKAR (Prosci) — the primary individual-level model this module powers directly.

**Primary users.** Change Manager, People Manager/Coach, Employee (self-report).

#### 6.2.5 M11 — Emotional & Transition Layer

**Purpose.** Where ADKAR reports what capability or motivation is missing, this layer reports what someone is actually feeling: the Bridges Transition position (Ending → Neutral Zone → New Beginning) and a Kübler-Ross-derived sentiment stage, both under justified-change governance, plus the Divergence Pattern alert that gives journi its "hidden resistance" early-warning signal.

**Data captured.** bridgesPhase (justified), bridgesNote; sentimentStage (justified, or inferred from `sentimentSnapshot` free text via keyword match when not explicitly set), sentimentSnapshot note.

**Functional requirements.**
- FR-M11-01: Both `bridgesPhase` and `sentimentStage` shall follow the stage-then-justify pattern.
- FR-M11-02: When `sentimentStage` is not explicitly set, the system shall infer one of commitment/exploration/denial/resistance from keyword matching against the free-text sentiment snapshot, defaulting to "exploration" if no keyword matches.
- FR-M11-03: The system shall raise a Divergence Alert whenever Knowledge ≥ 3 AND Ability ≥ 3 (strong demonstrated capability, per M10) while the Bridges position still reads "Ending" — a classic hidden-resistance pattern — and shall surface this same flag to M8's Phase Gate open-flags field.

**Frameworks integrated.** William Bridges' Transition Model; Kübler-Ross Change Curve (adapted for organizational, not grief, context).

**Primary users.** Change Manager, People Manager/Coach.

#### 6.2.6 M12 — Change Risk Register

**Purpose.** A risk register purpose-built for the people side of change — adoption risk, sponsor-attrition risk, and change-saturation risk from concurrent initiatives targeting the same population — distinct from generic project risk, with a per-risk Mitigation Action Plan tracked to closure.

**Data captured.** Risk: category (adoption/sponsorship/capacity/saturation), description, likelihood (1–5), impact (1–5), owner, status (justified-change). Mitigation Action (nested per risk): description, owner, dueDate, status.

**Functional requirements.**
- FR-M12-01: The system shall support Create and Delete on risk records; a risk's core fields (category, description, likelihood, impact, owner) have no in-place Edit once created in the current build — only `status` is changeable post-creation, via the justified-change flow. This is a known gap (Section 10.3) for a rebuild targeting full risk-record editability.
- FR-M12-02: The system shall support full Create, Update, and Delete on a risk's nested Mitigation Actions.
- FR-M12-03: The system shall compute Risk Score as likelihood × impact, flag scores ≥ 12 as high-severity (red) and ≥ 8 as elevated (amber), and sort the risk list by score descending.
- FR-M12-04: The system shall surface a saturation banner whenever other active Change Management Projects exist in the same Organization.

**Frameworks integrated.** Extends standard project-risk practice with change-saturation and adoption-risk categories.

**Primary users.** Change Manager, PMO, Sponsor.

#### 6.2.7 M13 — Sponsor & Coalition

**Purpose.** Tracks Executive Sponsor visibility under justified-change governance, the guiding-coalition roster, and a sponsor-action roadmap — the single factor Prosci research identifies as the top predictor of change success, and the substance of Kotter's Step 2.

**Data captured.** sponsor.visibility (weak/moderate/strong, justified), visibilityNote; Coalition Member: name, role, influence (1–5), engagement (1–5); Sponsor Action: action text, phase, done.

**Functional requirements.**
- FR-M13-01: `sponsor.visibility` shall follow the stage-then-justify pattern.
- FR-M13-02: The system shall support Create (not Update or Delete) on Sponsor Actions, plus a done-toggle. This is a known gap (Section 10.3): once added, a sponsor action's text cannot be edited or removed.
- FR-M13-03: The Coalition Member roster has no Add/Edit/Delete UI in the current build — it is read-only display only, populated at seed time. This is a more significant known gap (Section 10.3) given the module's name; a rebuild should treat coalition-roster CRUD as a real requirement even though the reference implementation does not yet expose it.
- FR-M13-04: The system shall raise a red alert banner whenever `sponsor.visibility === 'weak'`, cross-referencing M10's stalled Desire scores in the alert text.

**Frameworks integrated.** Prosci Sponsor Model (active/visible sponsorship); Kotter Step 2 — Build a Guiding Coalition.

**Primary users.** Change Manager, Sponsor, PMO.

#### 6.2.8 M14 — Communication Planning & Execution

**Purpose.** Plans and tracks the message–audience–channel–timing matrix driving Awareness and Desire, and operationalizes Kotter's Step 4.

**Data captured.** message, audience, channel, sender, timing, linked ADKAR block, status (draft/scheduled/sent).

**Functional requirements.**
- FR-M14-01: The system shall support full Create, Read, Update, and Delete on communications, gated by `canWrite`.
- FR-M14-02: The system shall surface a change-saturation banner whenever other active Change Management Projects exist in the same Organization, matching M12's saturation logic.
- FR-M14-03: The communications log shall offer client-side CSV export (Section 6.6.6) to every role, independent of write access.

**Frameworks integrated.** Kotter Step 4 — Communicate the Vision; feeds ADKAR Awareness/Desire.

**Primary users.** Change Manager, Communications Practitioner, Sponsor.

#### 6.2.9 M15 — Training & Capability Building

**Purpose.** Maps directly to ADKAR's Knowledge and Ability blocks, tracking curriculum coverage, completion, and demonstrated capability — "trained" versus "certified/capable" as two distinct, separately-governed states.

**Data captured.** curriculum, track, level (Foundation/Practitioner/Advanced), module, objectives/prerequisites/agenda/expectedResults/workshops, targetAudience, facilitator, format, completion (0–100%), certified (justified-change, distinct from completion).

**Functional requirements.**
- FR-M15-01: The system shall support full Create, Read, Update, and Delete on training/curriculum records, gated by `canWrite`.
- FR-M15-02: A change to `certified` shall follow the stage-then-justify pattern, independent of the general record-edit flow, since certification is a governed capability claim, not a data-entry field.
- FR-M15-03: The system shall surface a training-needs banner whenever M10 reports Knowledge or Ability ≤ 2, citing the gap's source module.

**Frameworks integrated.** ADKAR Knowledge & Ability blocks; Kotter Step 5 — Enable Action by Removing Barriers.

**Primary users.** Change Manager, Trainer/Practitioner, People Manager.

#### 6.2.10 M16 — Resistance Management

**Purpose.** Structured logging and resolution of resistance by type (role/skill/will/systemic), with root cause, severity, and mitigation tracked under justified-change status governance, systemic-pattern detection across cohorts, and a Qualitative Coding Workbench for tagging free-text coaching notes and resistance entries against an organization-scoped codebook.

**Data captured.** Resistance entry: type, source, rootCause, severity (1–5), mitigation, owner, dueDate, status (justified-change), anonymous flag. Codebook entry (org-scoped): label, description. Code Tag: codeId, sourceType, sourceId, optional linkedResistanceId.

**Functional requirements.**
- FR-M16-01: The system shall support full Create, Read, Update, and Delete on resistance-log entries, gated by `canManage` (= `canWrite`).
- FR-M16-02: A change to `status` (open → in progress → closed) shall follow the stage-then-justify pattern, separate from the general record-edit flow.
- FR-M16-03: An Employee role shall be permitted to submit a resistance/concern entry (optionally anonymous) via a "submission only" path (`canSubmit = canWrite OR role === 'employee'`), without gaining status-management, classification-edit, or delete rights.
- FR-M16-04: The system shall raise a red pattern-detection banner when two or more systemic-type entries are logged, framing the pattern as organizational rather than individual and pointing to M13.
- FR-M16-05: The Qualitative Coding Workbench shall support Create and Delete (not Update) on codebook entries — a known gap (Section 10.3) — and Create/Delete on code tags, drawing taggable source material live from this project's own resistance-log entries and M10's coaching notes, with an optional cross-link from a coaching-note tag to a specific resistance-log entry.
- FR-M16-06: The Workbench shall compute a tag-frequency rollup relative to the most-used code, surfacing recurring themes a single practitioner reading each note individually would likely miss.

**Frameworks integrated.** Kübler-Ross resistance/anger stage; Kotter Step 5.

**Primary users.** Change Manager, People Manager, Employee (submission only).

#### 6.2.11 M17 — Manager-as-Coach Enablement

**Purpose.** Operationalizes the research finding that a direct manager is the single most influential factor in individual adoption: a team-scoped ADKAR heatmap restricted to a People Manager's own direct reports, a justified Manager Readiness rating, and a read-only view of coaching notes and AI-generated coaching scripts, without exposing organization-wide change data the manager doesn't need.

**Data captured.** managerReadiness (1–5, justified-change, default 3).

**Functional requirements.**
- FR-M17-01: `managerReadiness` shall follow the stage-then-justify pattern; the ADKAR heatmap and coaching-note list are always view-only in this module regardless of role, by design — this module deliberately has no add/edit/delete UI of its own for coaching notes, directing users to M10 instead.
- FR-M17-02: The heatmap shall be scoped strictly to the manager's own direct reports; it must never expose organization-wide change data through this module.

**Frameworks integrated.** Prosci Manager/Coach research; ADKAR at the team level.

**Primary users.** People Manager/Coach.

#### 6.2.12 M18 — Journey Map / Visual Core

**Purpose.** The signature interface of journi: a literal, visual SVG timeline (the Bridges Ending → Neutral Zone → New Beginning curve) plotting project- or organization-level events with a "Today" marker — deliberately distinct from the tabular dashboards elsewhere, and the visual identity the product takes its name from.

**Data captured.** Journey Event: label, offsetDays (relative to today), type (milestone/communication/training/assessment).

**Functional requirements.**
- FR-M18-01: The system shall support full Create, Read, Update, and Delete on journey events, gated by `canWrite`.
- FR-M18-02: An Organization-level zoom shall aggregate journey events across every Change Management Project in the Organization onto one chart, in addition to the default single-project view.
- FR-M18-03: The "Share Snapshot" control is a demo-only confirmation in the current build with no real export/share backend; a production rebuild wanting an actual shareable artifact must implement this as new functionality, not assume it exists.

**Frameworks integrated.** Visual synthesis of ADKAR, Bridges, and Kübler-Ross on a single timeline.

**Primary users.** All roles, at the scope permitted by RBAC.

#### 6.2.13 M19 — Stakeholder Journeys, Touchpoints & Analytics

**Purpose.** The experience-layer companion to M20's score-centric dashboards: eight persona/exception/sector-specific/system journeys, twenty-four concrete touchpoints across six of those journeys with auditable success criteria, five journey-analytics dashboard definitions (two with genuinely live computed metrics), and a per-project context-overlay reference table.

**Data captured (mostly static reference).** Journey: id, predecessorId, name, type, trigger, audience, duration, linked modules. Touchpoint: journeyId, PDCA sub-phase, sequence, day offset from trigger, owner role, success criterion, evidence requirement. Touchpoint Log (per project, user-writable): touchpointId, date, note.

**Functional requirements.**
- FR-M19-01: Journeys, Touchpoints, Dashboards, and the Context Overlay are static reference data with no CRUD UI; only the Touchpoint Log is user-writable.
- FR-M19-02: The system shall support Create (not Update) and Delete on Touchpoint Log entries, gated by `canWrite`.
- FR-M19-03: The "End User Journey Completion" dashboard shall compute, live, the percentage of the End User Adoption journey's touchpoints with at least one log entry for the current project.
- FR-M19-04: The "Sponsor & Charter Compliance" dashboard shall compute, live, the percentage of all M5 Charter Actions with at least one completion log entry for the current project, reading M5's `charterActionLog` directly.
- FR-M19-05: The remaining three dashboards (Mentoring Progression, Divergence Case Resolution, Executive Roll-Up) shall render as descriptive reference cards, since the reference build does not model per-mentee or per-case granularity separately from the underlying M5/M12 logs a BI-connected deployment would aggregate.

**Frameworks integrated.** Cross-cutting — realizes M18's Journey Map at the persona-definition and touchpoint level of detail; the Divergence Case journey operationalizes M11's Divergence Alert as a recovery workflow; the Mentee journey operationalizes M5's Mentoring Progression model.

**Primary users.** Change Manager, Training Lead (touchpoint logging); all roles (read).

#### 6.2.14 M20 — Metrics & Analytics Dashboard

**Purpose.** The analytical brain of journi: the Composite Readiness Index, ADKAR heatmaps, an adoption-curve chart, sentiment/adoption-speed correlation, benchmarking against seeded reference bands, and a cross-transformation-type comparison matrix — rolled up at Project, Organization, or Group level depending on the signed-in role.

**Data captured.** Purely a computed/aggregated reporting surface — no user-entered fields beyond the roll-up level selector.

**Functional requirements.**
- FR-M20-01: The level selector shall offer Project level to every role; Organization level only to a role scoped Organization-or-broader; Group level only additionally when the scoped Organization actually belongs to a Group and the role is Super Admin or Group Admin — an ungrouped Organization must never show a Group tab, for any role.
- FR-M20-02: The system shall compute a benchmarking standing (Behind / In Line / Ahead) per project against a seeded reference band for its current Lewin phase and against the peer average of every other project in scope at the active level.
- FR-M20-03: The Cross-Type Comparison Matrix shall contrast all eight transformation types side by side — typical duration, terminal gate, external-party involvement, dominant framework, and reversibility — each row linked to a seed-project example.
- FR-M20-04: The Analytics heatmap and Benchmarking tables shall offer client-side CSV export (Section 6.6.6).
- FR-M20-05: This module shall perform no write operations of its own — it is read-only by design, at every roll-up level.

**Frameworks integrated.** Synthesizes every framework in the platform into one readiness signal, benchmarked against phase-appropriate reference bands.

**Primary users.** Change Manager, Sponsor, Executive Viewer, PMO.

#### 6.2.15 M21 — Reinforcement & Sustainment

**Purpose.** The most commonly neglected stage of change work: post-go-live adoption checkpoints, Quick Wins celebration, a lessons-learned (REX) institutionalization log, and the formal sustainment sign-off — Lewin's Refreeze.

**Data captured.** Checkpoint (fixed set of three: 30/60/90-day): adoptionRate, regressionRisk, status. Quick Win: title, date. Lesson Learned: text, linkedRuleOrControl (naming which rule/control/charter now encodes it), status (auto-derived). Sign-off: boolean.

**Functional requirements.**
- FR-M21-01: "Record checkpoint" shall be a one-click completion action that generates an adoption-rate value and derives `regressionRisk` from it (> 80% low, > 60% moderate, else high); the three checkpoints are a fixed set with no add/delete.
- FR-M21-02: The system shall support Create (not Update or Delete) on Quick Wins — a known gap (Section 10.3).
- FR-M21-03: The system shall support Create and Update (limited to the `linkedRuleOrControl` field) on Lessons Learned, with no Delete — a known gap (Section 10.3); a lesson's status shall auto-flip to "applied" the moment a link is entered, "pending" otherwise.
- FR-M21-04: Sign-off shall be a simple boolean toggle representing the Lewin Refreeze state, referenced by M8's Phase Template "Sustain" phase-gate criteria.

**Frameworks integrated.** Lewin Refreeze; Kotter Steps 6 (Generate Short-Term Wins) and 8 (Anchor New Approaches).

**Primary users.** Change Manager, People Manager, Sponsor.

#### 6.2.16 M22 — Field Notes

**Purpose.** A lightweight freeform log for change-management knowledge that doesn't fit a structured module — workshops, decisions, sign-offs, nominations, handoffs — explicitly positioned as a scratchpad, not a substitute for a structured module: once something becomes a real record elsewhere, it belongs there instead.

**Data captured.** date, category (Workshop/Decision/Sign-Off/Nomination/Handoff/Other), relatedModules (multi-select across all M1–M22), title, body, author.

**Functional requirements.**
- FR-M22-01: The system shall support full Create, Read, Update, and Delete on field notes, gated by `canWrite`.
- FR-M22-02: `relatedModules` shall be a free multi-select tag against the current M1–M22 module list — a descriptive cross-reference only, not a structural foreign key into another module's data.
- FR-M22-03: The list shall be filterable by category, with each category color-coded (Workshop = brand, Decision/Sign-Off = green, Nomination = amber, Handoff/Other = gray).

**Frameworks integrated.** None directly — a cross-cutting practitioner utility.

**Primary users.** All roles with project write access.

---

## 7. Cross-Cutting Functional Requirements

These requirements are not owned by any single module — they are shared infrastructure that most or all of M1–M22 draw on identically.

### 7.1 CSV Export

- FR-X-01: journi's highest-traffic tables shall offer a client-side CSV export — Sponsor Coalition (M13), Communications (M14), Training & Certification (M15), Risk Register (M12), and the Analytics readiness heatmap and benchmarking tables (M20) — built entirely in the browser via a Blob download, with no backend export service required.
- FR-X-02: Each export shall reflect exactly the rows and columns currently on screen, respecting the same RBAC and scope filtering as the table itself.
- FR-X-03: Every export shall be written with a UTF-8 byte-order mark, so accented French and Arabic content opens correctly in Excel.

### 7.2 Notification Center (Alerts)

- FR-X-04: A bell icon in the TopBar shall surface the platform's defined alert conditions as a persistent, dismissible, per-project in-app log.
- FR-X-05: The following conditions shall fire live, computed client-side from data journi already holds, whenever true for the scoped Change Management Project: a Divergence Pattern (M11); a Critical post-go-live regression-risk score (M21); a Sponsor Coverage Gap — visibility rated Weak (M13); a Resistance Escalation Threshold breach — three or more open resistance-log entries (M16); a Change Saturation breach — two or more other concurrent initiatives targeting the same Organization (M12/M14); a Communication Overload — more than three not-yet-sent communications scheduled across a project and its concurrent same-Organization initiatives (M14); a Phase Gate closed No-Go or Go-with-Conditions (M8); a Guiding Coalition Gap — fewer than two named coalition members (M13); and a blocked Sustainment sign-off (M21).
- FR-X-06: Dismissing an alert shall persist per Change Management Project (in `dismissedAlerts[]`, Section 4.3) and survive a page reload; a Restore control shall bring a dismissed alert back into view.
- FR-X-07: The alerts themselves shall never be persisted — only the dismissal state is; every alert is recomputed live on each render from current project data.
- FR-X-08: The following conditions are catalogued for traceability but depend on backend/data-model infrastructure the reference build does not have, and never fire: survey-exception retries, AI-confidence scoring, import integrity, administrative account lock-out, GDPR request SLA, AI provider fallback, and Champion Coverage Below Target (the last excluded because journi has no structured champion-tracking data model, not a backend gap). A rebuild adding real outbound delivery (email/push/Teams) for the live-firing conditions above should treat that as new infrastructure, not an existing capability being exposed.

### 7.3 Justification Governance

- FR-X-09: Every score or state change to a Change Management Project's ADKAR block (M10), Lewin macro-state (M7), Bridges/Kübler-Ross position (M11), sponsor visibility (M13), manager readiness (M17), training certification (M15), resistance status (M16), or risk status (M12) shall follow the same stage-then-justify pattern: the practitioner stages the new value, writes a justification note, then saves — at which point the new value and its justification are appended together, in one atomic update, to that project's Change Log (M7).
- FR-X-10: A platform-wide `requireJustification` toggle (M2, Governance Settings, default on) shall determine whether the justification note is a hard requirement before Save enables, or merely offered and recorded when given.
- FR-X-11: Justification text is expected to cite evidence already observed, never a plan for future evidence; journi does not enforce this discipline programmatically, by design — it is a record of practitioner judgment, and the tool's role is to make that judgment easy to capture and impossible to lose, not to police its content.

### 7.4 Permission Matrix

See Section 3.7 and FR-M2-02 through FR-M2-03 for the full specification; in summary, the role × capability grid on M2 is the single runtime override every `can*` check in Sections 3.7 and 6 reads from, editable in place by a Super Admin, taking effect immediately and platform-wide without a code change. Section 10.3 notes the one known module (M8) that does not currently read from it.

### 7.5 AI Governance Tiers

See Section 6.1.6 (M6) FR-M6-01 through FR-M6-10 for the full specification of the Assistive/Augmented tier model and its activation, override, and audit-logging requirements.

### 7.6 Framework-to-Module Mapping

journi does not force a single change methodology; each established framework is mapped onto the module(s) where it is operationally expressed, so practitioners trained in any one methodology find their vocabulary represented in the tool. Module numbers below use the current M1–M22 sequence (Section 1.6).

| Framework | Primary Level | Modules Where Applied |
|---|---|---|
| ADKAR (Prosci) | Individual / Cohort | M10 ADKAR Engine; M15 Training; M17 Manager as Coach; M20 Analytics |
| Kotter's 8 Steps | Organizational | M13 Sponsor & Coalition; M14 Communications; M15 Training; M21 Sustainment |
| Lewin (Unfreeze–Change–Refreeze) | Organizational (macro-state) | M7 Initiative Registry; M21 Sustainment |
| Bridges Transition Model | Individual / Emotional | M11 Emotional & Transition; M18 Journey Map |
| Kübler-Ross Change Curve | Individual / Emotional | M11 Emotional & Transition; M16 Resistance Management |
| Prosci Sponsor & Manager Research | Organizational / Team | M13 Sponsor & Coalition; M17 Manager-as-Coach |
| AI Tiers — Assistive & Augmented | Cross-cutting | M6 AI Use Case Library; expressed inside M9, M10, M11, M13, M14, M15, M16, M17, M18, M20, M21 |

M8 (WBS & Gantt) is deliberately cross-cutting rather than tied to one row above: it gives every framework in this table a single baseline-vs-actual calendar alongside the Project Management delivery track, next to the Lewin macro-state owned by M7, the Bridges/Kübler-Ross position owned by M11, and the ADKAR scores owned by M10. M5 (Charter Registry) and M19 (Journeys, Touchpoints & Analytics) are cross-cutting in the same sense — rather than introducing frameworks of their own, they operationalize the Prosci and Kotter rows above as signed, trackable behavioral standards (M5) and give the Bridges/Kübler-Ross journey M18 already visualizes a touchpoint-level completion record (M19).

---

## 8. Non-Functional Requirements

### 8.1 Performance

- NFR-01: The frontend build shall load and render the largest single-project view within normal broadband/LAN latency without a loading spinner exceeding a few seconds — the entire application ships as one JS bundle (currently ~660KB minified, ~180KB gzipped) with no code-splitting; a rebuild adding substantially more module content should consider `manualChunks` splitting if the bundle grows enough to trigger Vite's default 500KB warning meaningfully.
- NFR-02: State-save shall be debounced 400ms after the last change (Section 3.4) to avoid saturating the backend with a write per keystroke, at the deliberate cost of up to 400ms of unsaved-edit exposure if the process is killed mid-edit.

### 8.2 Security

- NFR-03: **The reference build has no authentication at the HTTP layer.** `GET`/`PUT /api/state` accept any caller with no login, session, token, or credential check whatsoever — RBAC (Section 3.7) is enforced entirely client-side, in the React app, as a UX/workflow control, not a security boundary. A user with direct HTTP access to the server (or its port) can read or overwrite the *entire* application's data for every tenant, regardless of role. This is acceptable for the reference build's intended context — a single machine on a trusted LAN or a single user's desktop — but is not a production security posture. A production or multi-tenant-hosted rebuild must add real server-side authentication and per-request authorization before RBAC can be considered anything more than a workflow convenience.
- NFR-04: The reference build implements no TLS termination, rate limiting, or web-application-firewall behavior; these must be added at the infrastructure layer for any internet-facing deployment.
- NFR-05: The API performs no request-body shape validation on `PUT /api/state` — a malformed body will overwrite the stored state with whatever was sent. A production rebuild should validate the body against the Section 4 schema before persisting it.
- NFR-06: An AI use case shall never grant a user visibility they would not otherwise have (FR-M6-10); the Real LLM Provider Connection's API key shall never be persisted server-side or included in any data export (FR-M6-08).
- NFR-07: Individual-level ADKAR scores and sentiment data shall be restricted, by RBAC default, to roles in `ROLES_WITH_INDIVIDUAL_VISIBILITY` (Super Admin, Group Admin, Organization Admin, Change Manager, People Manager); Sponsors and Executives see aggregated, de-identified views only, per M20's roll-up logic.

### 8.3 Reliability & Data Integrity

- NFR-08: The reference build's persistence layer is a single SQLite file with no replication and no automated backup; `journi.db` is the entire durability boundary. A production deployment should add scheduled backups with a defined retention policy at minimum, and should evaluate whether the single-writer-row model (Section 3.3) meets its concurrency needs before scaling beyond one small team's usage.
- NFR-09: Every write is a full-document overwrite with no optimistic-locking or versioning at the transport level (Section 3.4) — two browser tabs editing the same tenant concurrently will silently clobber each other's changes on the losing tab's next debounced save. A rebuild targeting concurrent multi-user editing of the same project must add conflict detection or move to per-entity writes (Section 5.2).
- NFR-10: `better-sqlite3` is deliberately kept as an `optionalDependency` (Section 3.3) specifically so a failed native build never aborts `npm install` as a whole, given `node:sqlite` is tried first and covers the common case.

### 8.4 Usability & Accessibility

- NFR-11: Every layout (navigation, tables, charts, the Journey Map) shall render correctly mirrored under Arabic RTL, not just with mirrored text direction (Section 3.6).
- NFR-12: Status, severity, and classification fields shall use the shared `Badge` component's consistent color vocabulary across all 22 modules (Section 5.1), so a user who has learned the color meaning in one module recognizes it in every other.
- NFR-13: M17's interface shall remain lightweight enough for a time-constrained frontline supervisor to use on a mobile browser, per its stated design intent, even though no dedicated mobile layout exists elsewhere in the application.

### 8.5 Localization

See Section 3.6 for the full specification. In summary: English, French, and Arabic (with full RTL) are first-class, not translated-as-afterthought; every UI string lives in one dictionary file; language precedence resolves user preference → Organization default → English fallback on every sign-in and Organization switch.

### 8.6 Portability / Installability

- NFR-14: `npm install` must succeed on a fresh Windows machine with only Node.js installed — no Visual Studio Build Tools, no Python, no C++ toolchain requirement — across the range of Node 18 through the latest release, satisfied by the dual SQLite driver strategy (Section 3.3).
- NFR-15: The same source must run unmodified on macOS/Linux via standard `npm install && npm run build` / `npm start`, without requiring the Windows batch-file wrappers.

### 8.7 Maintainability / Extensibility

- NFR-16: Adding a new module shall follow the established pattern: a new `Module<N>Page.jsx` (internal identifier, Section 1.6), a route entry, a Sidebar entry with a `navM<N>` translation key (whose *value*, not key, carries the visible module number), i18n keys for every user-facing string in all three languages, and — if it needs its own persisted sub-collection — a new array on the `cmProject` object (Section 4.3) plus `addSubItem`/`updateSubItem`/`removeSubItem` wiring rather than a bespoke mutator, unless the module's data genuinely doesn't fit the generic sub-item shape (as with M2's Permission Matrix or M7's Change Log).
- NFR-17: A module's visible number and its internal file/route identifier are permanently decoupled (Section 1.6) specifically so a future renumbering never requires a mechanical rename sweep across the codebase — only the translation dictionary's *values* change.

### 8.8 Compatibility

- NFR-18: The application targets evergreen desktop browsers (Chrome, Edge, Firefox); no legacy-browser support (e.g. Internet Explorer) is in scope.

---

## 9. Seed / Reference Data Requirements

### 9.1 Reference Tenant

The reference build seeds one Group ("Atlas Industrial Group") containing four Organizations, each carrying its own Main Project(s) and linked Change Management Project(s), for a total of 20 seeded Change Management Projects — one per seeded `change_manager`-role user. Fourteen of these are illustrative "cases" spanning three sectors (Manufacturing, Logistics & Transportation, Health) crossed with eight transformation types, documented in full narrative detail in the predecessor Functional Specification (Section 6) and in the Master User Guide. The remaining seeded projects support the guide's own running scenario tenant. All seeded organizations, individuals, and figures are fictional composites; they are not a substitute for real organizational data before go-live.

| Sector | Transformation Types Covered |
|---|---|
| Manufacturing | ERP Implementation; Business Process Automation; Integrated Management System (QMS); Cultural / Values Transformation; Training & Skills Development |
| Logistics & Transportation | ERP Implementation; Business Process Automation; Integrated Management System (QMS); Business Process Reengineering; Operating Model Redesign |
| Health | ERP Implementation; Business Process Automation; Integrated Management System (QMS); Compliance-Driven Change |

### 9.2 Demo User / Role Matrix

The seed data includes 24 platform users spanning all nine roles (Section 3.7): one Super Admin, one Group Admin, one Organization Admin per seeded Organization, one Change Manager per seeded Change Management Project, one People Manager, one Sponsor, one Executive, and one Employee — each with a fixed `scopeType`/`scopeId` demonstrating every scope level the RBAC model supports (Section 3.7).

### 9.3 Shared Catalogs

Seeded once, shared across every tenant rather than duplicated per-Organization: the AI Use Case catalog (14 entries, M6), the Macro Process catalog (10 entries, M4), the E2E Process Registry (17 entries, M4), the Phase Template library (8 entries, M8), the RACSI grid default, the Charter Registry's 8 charter definitions (M5), and the default Permission Matrix (`DEFAULT_ROLE_PERMISSIONS`, M2).

---

## 10. Appendices

### 10.1 Glossary

See Section 1.4 for framework and access-control acronyms. Module-specific vocabulary is defined inline in each module's Section 6 entry on first use.

### 10.2 Requirement Traceability

Section 1.6's module table is the authoritative map from a displayed module number to its source file; Section 4 is the authoritative field-level schema; Section 6 is the authoritative functional-requirement list, one `FR-M`*n*`-`*nn* per testable behavior. A QA team writing test cases against this document should trace each test to one FR id; a dev team scoping a rebuild task should trace each task to one module's FR block plus its Section 4 data-model entry.

### 10.3 Known Functional Gaps (Reference Implementation)

These are honest, verified-against-source gaps in the current reference build, not aspirational shortcomings — each is called out at its owning module in Section 6 and collected here for rebuild-planning convenience. None blocks the application's core workflows; each represents either a deliberate scope decision (e.g. an immutable Phase Gate record) or an incompletely-extended CRUD pattern worth completing in a rebuild.

| # | Module | Gap | Type |
|---|---|---|---|
| 1 | M10 ADKAR Engine | Coaching Notes are Add-only — no Edit or Delete, in this module or in M17 where they are also displayed. | Incomplete CRUD |
| 2 | M13 Sponsor & Coalition | Coalition Member roster has no Add/Edit/Delete UI at all — read-only display, populated only at seed time. | Missing CRUD |
| 3 | M13 Sponsor & Coalition | Sponsor Actions support Add and a done-toggle only — no Edit or Delete of the action text. | Incomplete CRUD |
| 4 | M12 Risk Register | A risk's core fields (category, description, likelihood, impact, owner) have no Edit once created — only `status` is changeable, via the justified-change flow. | Incomplete CRUD |
| 5 | M21 Sustainment | Quick Wins are Add-only — no Edit or Delete. | Incomplete CRUD |
| 6 | M21 Sustainment | Lessons Learned support Add and a partial Edit (`linkedRuleOrControl` only) — no Delete. | Incomplete CRUD |
| 7 | M16 Resistance Management | Codebook entries support Add and Delete only — no Edit of an existing code's label/description. | Incomplete CRUD |
| 8 | M8 WBS & Gantt | Phase Gates support Add and Delete only — no Edit of a recorded joint decision (may be intentional: a gate record is arguably meant to be immutable once logged). | Design decision or gap — confirm intent before rebuilding |
| 9 | M8 WBS & Gantt | Write-access checks call `canWrite(currentUser?.role)` without passing the Permission Matrix, unlike every other module — Super Admin edits to the matrix do not affect this module's write gating. | Inconsistency |
| 10 | M18 Journey Map | "Share Snapshot" is a demo-only confirmation message with no real export/share backend. | Stub, not a regression |
| 11 | Cross-module | Some in-code comments and the AI Use Case catalog's `moduleLabel` strings still reference the pre-renumbering module numbers in places; the Section 1.6 table (sourced from `Sidebar.jsx`/`translations.js`, not from code comments) is the authoritative current mapping and should be used for any further documentation work. | Documentation drift |

### 10.4 Default Permission Matrix

The seeded default state of `data.rolePermissions` (Section 4.1), editable at runtime on M2:

| Role | manageHierarchy | manageUsers | write | activateAiForOrg | requestProjectAiOverride | manageCharters | manageAiUseCases | manageTemplates |
|---|---|---|---|---|---|---|---|---|
| super_admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| group_admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| org_admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| change_manager | | | ✓ | | ✓ | ✓ | ✓ | ✓ |
| people_manager | | | ✓ | | | | | |
| practitioner | | | ✓ | | | | | |
| sponsor | | | | | | | | |
| employee | | | | | | | | |
| executive | | | | | | | | |

### 10.5 Full i18n String Catalog

The complete content of `journi/src/i18n/translations.js` — every user-facing string key, in English, French, and Arabic — reproduced verbatim so a rebuild in another language/stack can achieve text-identical parity without needing separate access to the original source. Tables are grouped exactly as the source file groups them (its own section comments); several groups mix strings from multiple current modules because the source file organizes by when a string was added, not strictly by module. Where a source comment names a module by its old pre-renumbering internal number (e.g. "Module 7"), that is a source code-comment artifact, not the current displayed number — Section 1.6 is authoritative for the current mapping.

**App shell**

| Key | English | French | Arabic |
|---|---|---|---|
| appName | journi | journi | journi |
| appTagline | the human side of change, mapped as a journey | le côté humain du changement, cartographié comme un parcours | الجانب الإنساني للتغيير، بشكل رحلة مرسومة |
| poweredBy | Human Change Management Platform | Plateforme de gestion humaine du changement | منصة إدارة التغيير البشري |
| search | Search | Rechercher | بحث |
| logout | Sign out | Déconnexion | تسجيل الخروج |
| resetDemoData | Reset Demo Data | Réinitialiser les données | إعادة تعيين البيانات |
| resetDemoDataConfirm | This will discard every change made in this browser and restore the original seed data for all Organizations. This cannot be undone. Continue? | Cette action supprimera toutes les modifications effectuées dans ce navigateur et restaurera les données d'origine pour toutes les Organisations. Cette action est irréversible. Continuer ? | سيؤدي هذا إلى إلغاء كل التغييرات التي تمت في هذا المتصفح واستعادة البيانات الأصلية لجميع المؤسسات. لا يمكن التراجع عن هذا الإجراء. هل تريد المتابعة؟ |
| language | Language | Langue | اللغة |
| role | Role | Rôle | الدور |
| scope | Scope | Périmètre | النطاق |
| viewingAtLevel | Viewing at | Vue au niveau | العرض على مستوى |
| benchmarking | Benchmarking | Analyse comparative | المقارنة المرجعية |
| peerAverage | Peer average | Moyenne des pairs | متوسط الأقران |
| referenceBand | Reference band | Fourchette de référence | النطاق المرجعي |
| standing_ahead | Ahead of reference | Au-dessus de la référence | أعلى من المرجع |
| standing_in_line | In line with reference | Conforme à la référence | مطابق للمرجع |
| standing_behind | Behind reference | En retard sur la référence | أقل من المرجع |
| defaultLanguage | Default language | Langue par défaut | اللغة الافتراضية |
| save | Save | Enregistrer | حفظ |
| cancel | Cancel | Annuler | إلغاء |
| add | Add | Ajouter | إضافة |
| edit | Edit | Modifier | تعديل |
| delete | Delete | Supprimer | حذف |
| close | Close | Fermer | إغلاق |
| confirm | Confirm | Confirmer | تأكيد |
| actions | Actions | Actions | إجراءات |
| status | Status | Statut | الحالة |
| owner | Owner | Responsable | المسؤول |
| date | Date | Date | التاريخ |
| notes | Notes | Notes | ملاحظات |
| name | Name | Nom | الاسم |
| description | Description | Description | الوصف |
| type | Type | Type | النوع |
| loading | Loading… | Chargement… | جارٍ التحميل… |
| noData | No records yet. | Aucune donnée pour le moment. | لا توجد بيانات بعد. |
| all | All | Tous | الكل |
| back | Back | Retour | رجوع |
| export | Export | Exporter | تصدير |
| aiGenerated | AI-generated — review required | Généré par IA — vérification requise | مُولَّد بالذكاء الاصطناعي — يتطلب مراجعة |
| accept | Accept | Accepter | قبول |
| reject | Reject | Rejeter | رفض |
| generate | Generate | Générer | توليد |

**Scope switcher**

| Key | English | French | Arabic |
|---|---|---|---|
| group | Group | Groupe | المجموعة |
| organization | Organization | Organisation | المؤسسة |
| project | Project | Projet | المشروع |
| mainProject | Main Project | Projet principal | المشروع الرئيسي |
| cmProject | Change Management Project | Projet de gestion du changement | مشروع إدارة التغيير |
| noGroup | No Group (standalone) | Sans groupe (autonome) | بدون مجموعة (مستقلة) |
| selectOrg | Select organization… | Choisir une organisation… | اختر مؤسسة… |
| selectProject | Select project… | Choisir un projet… | اختر مشروعًا… |

**Nav / Modules** (values shown are the CURRENT displayed labels; key names retain their internal/legacy numbering per Section 1.6)

| Key | English | French | Arabic |
|---|---|---|---|
| navPortfolio | Portfolio Dashboard | Tableau de bord du portefeuille | لوحة المحفظة |
| navM1 | M1 · Hierarchy | M1 · Hiérarchie | م1 · الهيكل التنظيمي |
| navM2 | M2 · Identity & RBAC | M2 · Identité et RBAC | م2 · الهوية والصلاحيات |
| navM3 | M7 · Initiative Registry | M7 · Registre des initiatives | م7 · سجل المبادرات |
| navM17 | M8 · WBS & Gantt | M8 · SDP et Gantt | م8 · هيكل تجزئة العمل وغانت |
| navM4 | M9 · Stakeholder Mapping | M9 · Cartographie des parties prenantes | م9 · خريطة أصحاب المصلحة |
| navM5 | M10 · ADKAR Engine | M10 · Moteur ADKAR | م10 · محرك ADKAR |
| navM6 | M11 · Emotional & Transition | M11 · Transition émotionnelle | م11 · الانتقال العاطفي |
| navM7 | M13 · Sponsor & Coalition | M13 · Sponsor et coalition | م13 · الراعي والتحالف |
| navM8 | M14 · Communications | M14 · Communications | م14 · الاتصالات |
| navM9 | M15 · Training | M15 · Formation | م15 · التدريب |
| navM10 | M16 · Resistance | M16 · Résistance | م16 · المقاومة |
| navM11 | M17 · Manager as Coach | M17 · Manager-coach | م17 · المدير كموجه |
| navM12 | M21 · Sustainment | M21 · Pérennisation | م21 · الاستدامة |
| navM13 | M12 · Risk Register | M12 · Registre des risques | م12 · سجل المخاطر |
| navM14 | M20 · Analytics | M20 · Analytique | م20 · التحليلات |
| navM15 | M18 · Journey Map | M18 · Carte du parcours | م18 · خريطة الرحلة |
| navM16 | M6 · AI Use Case Library | M6 · Bibliothèque de cas d'usage IA | م6 · مكتبة حالات استخدام الذكاء الاصطناعي |
| navM18 | M4 · Process Registry | M4 · Registre des processus | م4 · سجل العمليات |
| navM19 | M5 · CM Charters | M5 · Chartes GC | م5 · مواثيق إدارة التغيير |
| navM20 | M19 · Journeys & Analytics | M19 · Parcours & analytique | م19 · الرحلات والتحليلات |
| navM21 | M22 · Field Notes | M22 · Notes de terrain | م22 · ملاحظات ميدانية |
| navM22 | M3 · OBS | M3 · OBS | م3 · الهيكل التنظيمي |
| sectionPlatform | Platform & Governance | Plateforme et gouvernance | المنصة والحوكمة |
| sectionCore | Change Management Program | Programme de gestion du changement | برنامج إدارة التغيير |

**Login**

| Key | English | French | Arabic |
|---|---|---|---|
| loginTitle | Welcome to journi | Bienvenue sur journi | مرحبًا بك في journi |
| loginSubtitle | Sign in to track the human side of your change portfolio. | Connectez-vous pour suivre le côté humain de votre portefeuille de changement. | سجّل الدخول لمتابعة الجانب الإنساني لمحفظة التغيير لديك. |
| chooseDemoUser | Choose a demo persona to sign in as | Choisissez un profil de démonstration | اختر ملفًا تجريبيًا لتسجيل الدخول |
| signIn | Sign in | Se connecter | تسجيل الدخول |
| demoNotice | Demo environment — no password required. Data is stored locally in your browser. | Environnement de démonstration — aucun mot de passe requis. Les données sont stockées localement dans votre navigateur. | بيئة تجريبية — لا حاجة لكلمة مرور. تُخزَّن البيانات محليًا في متصفحك. |

**Roles**

| Key | English | French | Arabic |
|---|---|---|---|
| role_super_admin | Super Admin | Super administrateur | المسؤول الأعلى |
| role_group_admin | Group Admin | Administrateur de groupe | مسؤول المجموعة |
| role_org_admin | Organization Admin | Administrateur d'organisation | مسؤول المؤسسة |
| role_sponsor | Project Sponsor | Sponsor du projet | راعي المشروع |
| role_change_manager | Change Manager / Lead | Change Manager / Responsable | مدير التغيير |
| role_people_manager | People Manager / Coach | Manager d'équipe / Coach | مدير الأفراد / موجه |
| role_practitioner | Practitioner / Contributor | Praticien / Contributeur | ممارس / مساهم |
| role_employee | Employee / End User | Employé / Utilisateur final | موظف / مستخدم نهائي |
| role_executive | Executive Viewer | Observateur exécutif | مشاهد تنفيذي |

**Frameworks**

| Key | English | French | Arabic |
|---|---|---|---|
| adkar | ADKAR | ADKAR | ADKAR |
| awareness | Awareness | Sensibilisation | الوعي |
| desire | Desire | Désir | الرغبة |
| knowledge | Knowledge | Connaissance | المعرفة |
| ability | Ability | Capacité | القدرة |
| reinforcement | Reinforcement | Renforcement | التعزيز |
| bridges | Bridges Transition | Transition de Bridges | انتقال بريدجز |
| bridges_ending | Ending | Fin | الانتهاء |
| bridges_neutral | Neutral Zone | Zone neutre | المنطقة المحايدة |
| bridges_beginning | New Beginning | Nouveau départ | بداية جديدة |
| kubler | Kübler-Ross Curve | Courbe de Kübler-Ross | منحنى كوبلر-روس |
| sentiment_denial | Denial | Déni | الإنكار |
| sentiment_resistance | Resistance / Anger | Résistance / Colère | المقاومة / الغضب |
| sentiment_exploration | Exploration | Exploration | الاستكشاف |
| sentiment_commitment | Commitment | Engagement | الالتزام |
| lewin | Lewin Macro-State | État macro de Lewin | حالة لوين الكلية |
| lewin_unfreeze | Unfreeze | Décristallisation | إذابة الجمود |
| lewin_change | Change | Changement | التغيير |
| lewin_refreeze | Refreeze | Recristallisation | إعادة التجميد |
| kotter | Kotter's 8 Steps | Les 8 étapes de Kotter | خطوات كوتر الثماني |

**AI tiers**

| Key | English | French | Arabic |
|---|---|---|---|
| tier_assistive | Assistive | Assistif | مساعد |
| tier_augmented | Augmented | Augmenté | معزز |
| tier_autonomous | Autonomous (out of scope) | Autonome (hors périmètre) | مستقل (خارج النطاق) |

**M7 (Initiative Registry) / M8 (WBS & Gantt) / M4 (Process Registry) / M5 (CM Charters) / M19 (Journeys & Analytics) / M22 (Field Notes) / M3 (OBS) / M16 (Resistance Coding Workbench) / shared CM Project fields**

| Key | English | French | Arabic |
|---|---|---|---|
| m3_title | Initiative & Portfolio Registry | Registre des initiatives et du portefeuille | سجل المبادرات والمحفظة |
| m3_desc | System of record for every change initiative — business driver, scope, target population, and Lewin macro-state. | Registre de toutes les initiatives de changement — moteur métier, périmètre, population cible et état macro de Lewin. | سجل شامل لكل مبادرات التغيير — الدافع، النطاق، الفئة المستهدفة، وحالة لوين الكلية. |
| m17_title | Work Breakdown Structure & Gantt | Structure de découpage du projet et Gantt | هيكل تجزئة العمل ومخطط غانت |
| m17_desc | One WBS spanning Project Management, Change Management and the Lewin/Prosci/Bridges/ADKAR framework milestones — baseline vs. actual dates, with the schedule gap called out task by task. | Un SDP unique couvrant la gestion de projet, la conduite du changement et les jalons des cadres Lewin/Prosci/Bridges/ADKAR — dates de référence et réelles, avec l'écart calendaire par tâche. | هيكل تجزئة عمل واحد يغطي إدارة المشروع وإدارة التغيير ومعالم أطر لوين وبروسكي وبريدجز و ADKAR — التواريخ المرجعية مقابل الفعلية، مع إبراز الفجوة الزمنية لكل مهمة. |
| m17_load_template | Load phase template | Charger un modèle de phases | تحميل نموذج المراحل |
| m17_load_template_title | Load phase template | Charger un modèle de phases | تحميل نموذج المراحل |
| m17_load_template_desc | Seeds one skeleton task per phase into the Project Management track, spaced 30 days apart from the start date below — a starting point to break down into real tasks, not a finished plan. | Ajoute une tâche squelette par phase dans la piste Gestion de projet, espacées de 30 jours à partir de la date de début ci-dessous — un point de départ à détailler, pas un plan final. | يضيف مهمة أولية واحدة لكل مرحلة إلى مسار إدارة المشروع، بفاصل 30 يومًا ابتداءً من تاريخ البدء أدناه — نقطة انطلاق لتفصيلها لاحقًا، وليست خطة نهائية. |
| m17_template_label | Phase template | Modèle de phases | نموذج المراحل |
| m17_recommended_for | Recommended for this project's linked Main Project and transformation type. | Recommandé pour le projet principal lié et le type de transformation de ce projet. | موصى به للمشروع الرئيسي المرتبط ونوع التحول لهذا المشروع. |
| m17_start_date | Start date | Date de début | تاريخ البدء |
| m17_load_button | Load into PM track | Charger dans la piste GP | تحميل في مسار إدارة المشروع |
| m18_title | Macro Process, SIPOC, RACSI & E2E Registry | Registre des macro-processus, SIPOC, RACSI et E2E | سجل العمليات الكلية وSIPOC وRACSI والعمليات الشاملة |
| m18_desc | The process backbone every module is built on: the 10 macro processes, the 16 registered end-to-end chains, and who is Responsible / Accountable / Consulted / Sign-off / Informed for each. | L'ossature de processus sur laquelle chaque module est construit : les 10 macro-processus, les 16 chaînes de bout en bout enregistrées, et qui est Responsable / Redevable / Consulté / Validateur / Informé pour chacune. | العمود الفقري للعمليات الذي تُبنى عليه كل وحدة: العمليات الكلية العشر، وسلاسل العمليات الشاملة الـ16 المسجلة، ومن هو المسؤول التنفيذي / المعتمد / المستشار / المصادق / المطلع لكل منها. |
| m18_tab_macro | Macro Processes | Macro-processus | العمليات الكلية |
| m18_tab_e2e | E2E Process Registry | Registre des processus E2E | سجل العمليات الشاملة |
| m18_tab_racsi | RACSI Grid | Grille RACSI | شبكة RACSI |
| m18_kind_core | Core lifecycle | Cycle de vie principal | دورة الحياة الأساسية |
| m18_kind_loop | Cross-cutting loop | Boucle transversale | حلقة متقاطعة |
| m18_kind_type | Transformation-type lifecycle | Cycle de vie par type de transformation | دورة حياة حسب نوع التحول |
| m18_trigger | Trigger | Déclencheur | المحفز |
| m18_terminal | Terminal state | État final | الحالة النهائية |
| m18_sipoc_supplier | SIPOC Suppliers | Fournisseurs SIPOC | موردو SIPOC |
| m18_sipoc_customer | SIPOC Customers | Clients SIPOC | عملاء SIPOC |
| m18_phase_template | Phase template | Modèle de phases | نموذج المراحل |
| m18_owning_modules | Owning module(s) | Module(s) propriétaire(s) | الوحدة (الوحدات) المالكة |
| m18_racsi_legend | R = Responsible · A = Accountable · C = Consulted · S = Sign-off · I = Informed | R = Responsable · A = Redevable · C = Consulté · S = Validateur · I = Informé | R = المسؤول التنفيذي · A = المعتمد · C = المستشار · S = المصادق · I = المطلع |
| m18_chain_racsi | RACSI (ES/CM/PM/FPO/ITL/SUP/EU) | RACSI (ES/CM/PM/FPO/ITL/SUP/EU) | RACSI (ES/CM/PM/FPO/ITL/SUP/EU) |
| m18_racsi_readonly | Only a Group/Org/Super Admin can edit this grid. Every other role sees it read-only. | Seul un administrateur Groupe/Organisation/Super Admin peut modifier cette grille. Tout autre rôle la voit en lecture seule. | يمكن فقط لمسؤول المجموعة/المؤسسة/المسؤول الأعلى تعديل هذه الشبكة. تظهر لبقية الأدوار للقراءة فقط. |
| m19_title | Change Management Charter Registry | Registre des chartes de gestion du changement | سجل مواثيق إدارة التغيير |
| m19_desc | The 8 signed, trackable behavioral standards governing sponsorship, frontline engagement, communication, impact assessment, coaching and mentoring, and pulse/interview diagnostics. | Les 8 standards comportementaux signés et suivables régissant le sponsoring, l'engagement de première ligne, la communication, l'évaluation d'impact, le coaching et le mentorat, et les diagnostics de type pulse/entretien. | المعايير السلوكية الثمانية الموقعة والقابلة للتتبع التي تحكم الرعاية، إشراك الخط الأمامي، التواصل، تقييم الأثر، التدريب والتوجيه، وتشخيصات النبض/المقابلات. |
| m19_tab_charters | Charters | Chartes | المواثيق |
| m19_tab_actions | Action Mapping & Compliance | Cartographie des actions & conformité | خريطة الإجراءات والامتثال |
| m19_tab_mentoring | Mentoring Progression | Progression du mentorat | تقدم التوجيه |
| m19_charter_desc | Each charter names specific, observable behaviors rather than generic guidance. | Chaque charte nomme des comportements spécifiques et observables plutôt qu'une orientation générique. | يحدد كل ميثاق سلوكيات محددة وقابلة للملاحظة بدلاً من توجيه عام. |
| m19_add_charter | Add Charter | Ajouter une charte | إضافة ميثاق |
| m19_entries | Entries | Entrées | الإدخالات |
| m19_entry_singular | entry | entrée | إدخال |
| m19_add_entry | Add Entry | Ajouter une entrée | إضافة إدخال |
| m19_no_entries | No entries yet on this charter. | Aucune entrée pour cette charte pour le moment. | لا توجد إدخالات لهذا الميثاق بعد. |
| m19_edit | Edit | Modifier | تعديل |
| m19_delete_retire_first | Set status to Draft or Retired before deleting an Active charter. | Passez le statut à Brouillon ou Retirée avant de supprimer une charte Active. | غيّر الحالة إلى مسودة أو متقاعد قبل حذف ميثاق نشط. |
| m19_owner | Owner | Propriétaire | المالك |
| m19_what | What | Quoi | ماذا |
| m19_who | Who | Qui | من |
| m19_when | When | Quand | متى |
| m19_where | Where | Où | أين |
| m19_why | Why | Pourquoi | لماذا |
| m19_how | How | Comment | كيف |
| m19_version | Version | Version | الإصدار |
| m19_effective | Effective | Date d'effet | تاريخ السريان |
| m19_review | Review | Révision | المراجعة |
| m19_obs_level | Governs | Régit | يحكم |
| m19_linked_macro | Primary macro process | Macro-processus principal | العملية الكلية الرئيسية |
| m19_filter_charter | Filter by charter | Filtrer par charte | تصفية حسب الميثاق |
| m19_all_charters | All charters | Toutes les chartes | كل المواثيق |
| m19_select_project_log | Select a CM Project (top bar) to log and see per-project compliance. | Sélectionnez un projet GC (barre supérieure) pour consigner et voir la conformité par projet. | اختر مشروع إدارة تغيير (الشريط العلوي) لتسجيل ورؤية الامتثال الخاص بالمشروع. |
| m19_action | Action | Action | الإجراء |
| m19_linked_task | Linked task | Tâche liée | المهمة المرتبطة |
| m19_racsi_ra | Responsible / Accountable | Responsable / Redevable | المسؤول التنفيذي / المعتمد |
| m19_frequency | Frequency | Fréquence | التكرار |
| m19_compliance | Compliance log | Journal de conformité | سجل الامتثال |
| m19_log_completion | + Log completion | + Consigner la réalisation | + تسجيل الإنجاز |
| m19_not_logged | Not yet logged | Pas encore consigné | لم يُسجَّل بعد |
| m19_more | more | de plus | أخرى |
| m19_mentoring_desc | The 3-stage progressive competency model behind CHTR-07: Trainee → Observer → Autonomous. A regression routes back one stage, not to zero. | Le modèle progressif de compétence en 3 étapes derrière CHTR-07 : Stagiaire → Observateur → Autonome. Une régression revient d'une étape, pas à zéro. | نموذج الكفاءة التدريجي ذو المراحل الثلاث وراء CHTR-07: متدرب ← مراقِب ← مستقل. يعود التراجع خطوة واحدة إلى الوراء، لا إلى الصفر. |
| m19_stage | Stage | Étape | المرحلة |
| m19_entry | Entry criteria | Critères d'entrée | معايير الدخول |
| m19_exit | Exit criteria | Critères de sortie | معايير الخروج |
| m19_duration | Typical duration | Durée typique | المدة النموذجية |
| m19_setting | Setting | Cadre | البيئة |
| m19_mentor_involvement | Mentor involvement | Implication du mentor | مشاركة الموجّه |
| m19_evidence | Competency evidence | Preuve de compétence | دليل الكفاءة |
| m19_regression | Regression path | Voie de régression | مسار التراجع |
| m20_title | Stakeholder Journeys, Touchpoints & Analytics | Parcours des parties prenantes, points de contact & analytique | رحلات أصحاب المصلحة ونقاط الاتصال والتحليلات |
| m20_desc | The experience-layer companion to the score-centric dashboards elsewhere in journi. | Le complément expérientiel aux tableaux de bord centrés score du reste de journi. | المكمل القائم على التجربة للوحات المعلومات القائمة على النقاط في بقية journi. |
| m20_tab_journeys | Journeys | Parcours | الرحلات |
| m20_tab_touchpoints | Touchpoints & Completion | Points de contact & réalisation | نقاط الاتصال والإنجاز |
| m20_tab_dashboards | Analytics Dashboards | Tableaux de bord analytiques | لوحات معلومات التحليلات |
| m20_tab_overlay | Project Context Overlay | Surcouche de contexte projet | طبقة سياق المشروع |
| m20_specializes | Specializes | Spécialise | يخصص |
| m20_trigger | Trigger | Déclencheur | المحفز |
| m20_audience | Audience | Audience | الجمهور |
| m20_duration | Duration | Durée | المدة |
| m20_owner | Owner | Propriétaire | المالك |
| m20_filter_journey | Filter by journey | Filtrer par parcours | تصفية حسب الرحلة |
| m20_all_journeys | All journeys | Tous les parcours | كل الرحلات |
| m20_select_project_log | Select a CM Project (top bar) to log and see per-project completion. | Sélectionnez un projet GC (barre supérieure) pour consigner et voir la réalisation par projet. | اختر مشروع إدارة تغيير (الشريط العلوي) لتسجيل ورؤية الإنجاز الخاص بالمشروع. |
| m20_touchpoint | Touchpoint | Point de contact | نقطة الاتصال |
| m20_day | Day | Jour | اليوم |
| m20_success_criteria | Success criteria | Critères de succès | معايير النجاح |
| m20_dashboard_desc | DASH-01 and DASH-02 compute a live metric from this project's own touchpoint and charter-action logs. The remaining dashboards are shown as reference cards. | DASH-01 et DASH-02 calculent une métrique en direct à partir des journaux de points de contact et d'actions de charte de ce projet. Les autres tableaux de bord sont présentés comme des fiches de référence. | يحسب DASH-01 وDASH-02 مقياسًا حيًا من سجلات نقاط الاتصال وإجراءات المواثيق الخاصة بهذا المشروع. تُعرض بقية لوحات المعلومات كبطاقات مرجعية. |
| m20_live_metric | Live metric | Métrique en direct | مقياس حي |
| m20_touchpoint_completion | JRN-01 touchpoint completion | Réalisation des points de contact JRN-01 | إنجاز نقاط اتصال JRN-01 |
| m20_charter_completion | Charter action completion | Réalisation des actions de charte | إنجاز إجراءات المواثيق |
| m20_kpis | Journey KPIs | ICP de parcours | مؤشرات أداء الرحلة |
| m20_visualisation | Visualisation | Visualisation | التصور |
| m20_linked_report | Linked report | Rapport lié | التقرير المرتبط |
| m20_reference_only | Reference card only — no per-mentee/per-case data model in this demo. | Fiche de référence uniquement — aucun modèle de données par mentoré/cas dans cette démonstration. | بطاقة مرجعية فقط — لا يوجد نموذج بيانات لكل متدرب/حالة في هذا العرض التوضيحي. |
| m20_overlay_desc | What makes each of the source framework's 13 illustrative seed projects distinct from the generic journey template. | Ce qui distingue chacun des 13 projets pilotes illustratifs du référentiel source du modèle de parcours générique. | ما يميز كل مشروع من المشاريع النموذجية التوضيحية الثلاثة عشر للإطار المصدر عن نموذج الرحلة العام. |
| m21_title | Field Notes | Notes de terrain | ملاحظات ميدانية |
| m21_desc | A lightweight, freeform log for the knowledge that doesn't fit a structured module yet. | Un journal léger et libre pour les connaissances qui ne rentrent pas encore dans un module structuré. | سجل خفيف وحر للمعرفة التي لا تنتمي بعد إلى وحدة منظمة. |
| m21_select_project | Select a Change Management Project to view or add Field Notes. | Sélectionnez un projet de gestion du changement pour consulter ou ajouter des notes de terrain. | اختر مشروع إدارة تغيير لعرض أو إضافة ملاحظات ميدانية. |
| m21_filter | Category | Catégorie | الفئة |
| m21_all_categories | All categories | Toutes les catégories | كل الفئات |
| m21_add_note | Add Field Note | Ajouter une note de terrain | إضافة ملاحظة ميدانية |
| m21_empty | No Field Notes logged yet for this project. | Aucune note de terrain consignée pour ce projet. | لا توجد ملاحظات ميدانية مسجَّلة لهذا المشروع بعد. |
| m21_untitled | Untitled note | Note sans titre | ملاحظة بدون عنوان |
| m21_title_field | Short title (e.g. "Discovery Workshop 1 — Casablanca HQ") | Titre court (ex. « Atelier de découverte 1 — siège de Casablanca ») | عنوان قصير (مثال: "ورشة الاكتشاف 1 — المقر الرئيسي بالدار البيضاء") |
| m21_author | Logged by | Consigné par | سجَّله |
| m21_related_module_none | Not yet linked to a module | Pas encore lié à un module | غير مرتبط بوحدة بعد |
| m21_body | What happened, and what it feeds into later | Ce qui s'est passé, et ce que cela alimente par la suite | ما حدث، وما الذي يغذّيه لاحقًا |
| m22_title | Organizational Breakdown Structure | Structure organisationnelle du projet (OBS) | الهيكل التنظيمي للمشروع |
| m22_desc | The project's resourcing roster: who fills which role, and who they report to. | Le registre des ressources du projet : qui occupe quel rôle, et à qui il ou elle rend compte. | سجل موارد المشروع: من يشغل أي دور، ولمن يرفع تقاريره. |
| m22_add_entry | Add Role | Ajouter un rôle | إضافة دور |
| m22_empty | No roles logged yet for this project. | Aucun rôle consigné pour ce projet. | لا توجد أدوار مسجَّلة لهذا المشروع بعد. |
| m22_role | Role | Rôle | الدور |
| m22_reports_to | Reports to | Rend compte à | يرفع تقاريره إلى |
| m22_no_role | No role set | Rôle non défini | لم يُحدَّد الدور |
| m22_no_name | Unnamed | Sans nom | بدون اسم |
| m10_tab_log | Resistance Log | Registre des résistances | سجل المقاومة |
| m10_tab_coding | Coding Workbench | Atelier de codage | مساحة عمل الترميز |
| m10_qcw_desc | Tags 1:1 coaching notes and resistance-log entries against a configurable codebook. | Étiquette les notes de coaching en tête-à-tête et les entrées du registre des résistances par rapport à un référentiel de codes configurable. | يقوم بترميز ملاحظات التدريب الفردي وسجلات المقاومة وفق دفتر رموز قابل للتخصيص. |
| m10_qcw_codebook | Codebook | Référentiel de codes | دفتر الرموز |
| m10_qcw_codebook_desc | Organization-scoped, not a fixed platform-wide taxonomy. | Défini au niveau de l'Organisation, non une taxonomie fixe à l'échelle de la plateforme. | محدد على مستوى المؤسسة، وليس تصنيفًا ثابتًا على مستوى المنصة. |
| m10_qcw_code_label | Code label | Libellé du code | تسمية الرمز |
| m10_qcw_code_desc | Code description | Description du code | وصف الرمز |
| m10_qcw_tagging | Tagging | Étiquetage | الترميز |
| m10_qcw_tagging_desc | Apply codes to coaching notes and resistance-log entries. | Appliquez des codes aux notes de coaching et aux entrées du registre des résistances. | طبّق الرموز على ملاحظات التدريب وسجلات المقاومة. |
| m10_qcw_tag_button | Tag | Étiqueter | ترميز |
| m10_qcw_linked | Linked to a Resistance Log barrier | Lié à un obstacle du registre des résistances | مرتبط بعائق في سجل المقاومة |
| m10_qcw_link_barrier | Cross-reference to an existing barrier (optional) | Lien vers un obstacle existant (optionnel) | ربط بعائق قائم (اختياري) |
| m10_qcw_flag_new | — Flag as a new barrier (no link) — | — Signaler comme nouvel obstacle (sans lien) — | — الإبلاغ كعائق جديد (بدون ربط) — |
| m10_qcw_frequency | Code frequency rollup | Cumul de fréquence des codes | إجمالي تكرار الرموز |
| m10_qcw_frequency_desc | How often each code has been applied across this project's tagged material. | Fréquence d'application de chaque code sur l'ensemble du matériel étiqueté de ce projet. | عدد مرات تطبيق كل رمز على المواد المرمزة في هذا المشروع. |
| exportCsv | Export CSV | Exporter en CSV | تصدير CSV |
| notif_title | Notification Center | Centre de notifications | مركز الإشعارات |
| notif_select_project | Select a CM Project (top bar) to see its alerts. | Sélectionnez un projet GC (barre supérieure) pour voir ses alertes. | اختر مشروع إدارة تغيير (الشريط العلوي) لرؤية تنبيهاته. |
| notif_none | No active alerts for this project. | Aucune alerte active pour ce projet. | لا توجد تنبيهات نشطة لهذا المشروع. |
| notif_dismiss | Dismiss | Ignorer | تجاهل |
| notif_dismissed | Dismissed | Ignorées | المتجاهلة |
| notif_restore | Restore | Restaurer | استعادة |
| changeType | Change Type | Type de changement | نوع التغيير |
| businessDriver | Business Driver | Moteur métier | الدافع التجاري |
| targetPopulation | Target Population | Population cible | الفئة المستهدفة |
| successCriteria | Success Criteria | Critères de succès | معايير النجاح |
| linkedMainProject | Linked Main Project | Projet principal lié | المشروع الرئيسي المرتبط |
| standalone | Standalone (no Main Project) | Autonome (sans projet principal) | مستقل (بدون مشروع رئيسي) |
| budgetBand | Budget Band | Fourchette budgétaire | نطاق الميزانية |
| duration | Duration | Durée | المدة |
| executiveSponsor | Executive Sponsor | Sponsor exécutif | الراعي التنفيذي |

**M9 (Stakeholder Mapping)**

| Key | English | French | Arabic |
|---|---|---|---|
| m4_title | Stakeholder & Impact Mapping | Cartographie des parties prenantes et de l'impact | خريطة أصحاب المصلحة والتأثير |
| m4_desc | Who is affected, how heavily, and in what dimension. Impact scores drive tracking depth. | Qui est impacté, à quel degré et selon quelle dimension. Les scores d'impact déterminent le niveau de suivi. | من المتأثر، وبأي درجة، وفي أي بُعد. تحدد درجات التأثير مستوى المتابعة. |
| stakeholderGroup | Stakeholder Group | Groupe de parties prenantes | مجموعة أصحاب المصلحة |
| headcount | Headcount | Effectif | عدد الأفراد |
| impactProcess | Process | Processus | العملية |
| impactTech | Technology | Technologie | التقنية |
| impactRole | Role | Rôle | الدور |
| impactLocation | Location | Localisation | الموقع |
| impactIdentity | Identity | Identité | الهوية |
| influence | Influence | Influence | التأثير |
| highImpactLowInfluence | High-impact / Low-influence | Impact élevé / Influence faible | تأثر عالٍ / نفوذ منخفض |
| atRiskFlag | At risk of being under-supported | Risque de manque de soutien | معرّض لخطر نقص الدعم |

**M10 (ADKAR Engine)**

| Key | English | French | Arabic |
|---|---|---|---|
| m5_title | ADKAR Engine — Individual Readiness Core | Moteur ADKAR — Cœur de préparation individuelle | محرك ADKAR — جاهزية الأفراد |
| m5_desc | Score cohorts across the five ADKAR blocks with barrier-point diagnosis. | Évaluez les cohortes sur les cinq blocs ADKAR avec diagnostic des points de blocage. | قيّم المجموعات عبر عناصر ADKAR الخمسة مع تشخيص نقاط العائق. |
| buildingBlock | Building Block | Bloc | العنصر |
| score | Score | Score | الدرجة |
| barrierReason | Barrier Reason | Motif du blocage | سبب العائق |
| cohort | Cohort | Cohorte | المجموعة |
| history | History | Historique | السجل الزمني |
| escalated | Escalated — stalled beyond threshold | Escaladé — bloqué au-delà du seuil | تمت التصعيد — متوقف لفترة تتجاوز الحد |
| addAssessment | Add Assessment | Ajouter une évaluation | إضافة تقييم |
| coachingNote | Coaching Note | Note de coaching | ملاحظة توجيهية |
| addCoachingNote | Add coaching note | Ajouter une note de coaching | إضافة ملاحظة توجيهية |

**M11 (Emotional & Transition)**

| Key | English | French | Arabic |
|---|---|---|---|
| m6_title | Emotional & Transition Layer | Couche émotionnelle et de transition | طبقة الانتقال العاطفي |
| m6_desc | Bridges transition position and Kübler-Ross sentiment, cross-referenced with ADKAR. | Position de transition de Bridges et sentiment de Kübler-Ross, croisés avec ADKAR. | موقع انتقال بريدجز ومشاعر كوبلر-روس، مقارنة مع ADKAR. |
| divergenceAlert | Divergence Alert | Alerte de divergence | تنبيه تباين |
| divergenceDesc | Strong ADKAR score but still emotionally in Ending — classic hidden-resistance pattern. | Bon score ADKAR mais encore émotionnellement en phase de Fin — signal classique de résistance cachée. | درجة ADKAR جيدة لكن لا يزال عاطفيًا في مرحلة الانتهاء — نمط كلاسيكي للمقاومة الخفية. |

**M13 (Sponsor & Coalition)**

| Key | English | French | Arabic |
|---|---|---|---|
| m7_title | Sponsor & Coalition Module | Module Sponsor et coalition | وحدة الراعي والتحالف |
| m7_desc | Sponsor roadmap, active-vs-passive sponsorship, and guiding coalition strength. | Feuille de route du sponsor, sponsoring actif vs passif, et solidité de la coalition directrice. | خارطة طريق الراعي، الرعاية الفعالة مقابل السلبية، وقوة التحالف الموجّه. |
| coalitionMember | Coalition Member | Membre de la coalition | عضو التحالف |
| visibility | Visibility | Visibilité | الظهور |
| engagement | Engagement | Engagement | الانخراط |
| sponsorAction | Sponsor Action | Action du sponsor | إجراء الراعي |
| visibilityWeak | Weak | Faible | ضعيف |
| visibilityModerate | Moderate | Modéré | متوسط |
| visibilityStrong | Strong | Fort | قوي |

**M14 (Communications)**

| Key | English | French | Arabic |
|---|---|---|---|
| m8_title | Communication Planning & Execution | Planification et exécution des communications | تخطيط وتنفيذ الاتصالات |
| m8_desc | Message × audience × channel × timing matrix, with saturation detection. | Matrice message × audience × canal × calendrier, avec détection de saturation. | مصفوفة الرسالة × الجمهور × القناة × التوقيت، مع كشف التشبع. |
| message | Message | Message | الرسالة |
| audience | Audience | Audience | الجمهور |
| channel | Channel | Canal | القناة |
| sender | Sender | Expéditeur | المُرسِل |
| timing | Timing | Calendrier | التوقيت |
| linkedAdkarBlock | Linked ADKAR Block | Bloc ADKAR lié | عنصر ADKAR المرتبط |
| saturationWarning | Change saturation risk — overlapping population | Risque de saturation — population qui se chevauche | خطر تشبع التغيير — تداخل في الفئة المستهدفة |

**M15 (Training)**

| Key | English | French | Arabic |
|---|---|---|---|
| m9_title | Training & Capability Building | Formation et développement des compétences | التدريب وبناء القدرات |
| m9_desc | Curriculum coverage, completion, and demonstrated capability — trained vs. capable. | Couverture du curriculum, achèvement et capacité démontrée — formé vs. capable. | تغطية المنهج، الإتمام، والقدرة الفعلية — مُدرَّب مقابل قادر. |
| curriculum | Curriculum / Track | Curriculum / Parcours | المنهج / المسار |
| facilitator | Facilitator | Animateur | الميسر |
| format | Format | Format | الصيغة |
| completion | Completion | Achèvement | نسبة الإنجاز |
| certification | Certified / Capable | Certifié / Capable | معتمد / قادر |

**M16 (Resistance)**

| Key | English | French | Arabic |
|---|---|---|---|
| m10_title | Resistance Management | Gestion de la résistance | إدارة المقاومة |
| m10_desc | Log, classify and resolve resistance, linked to concrete mitigation actions. | Enregistrez, classez et résolvez la résistance, avec des actions de mitigation concrètes. | سجّل وصنّف وعالج المقاومة، مع إجراءات تخفيف ملموسة. |
| resistanceType | Type | Type | النوع |
| resistance_role | Role-based | Liée au rôle | مرتبطة بالدور |
| resistance_skill | Skill-based | Liée aux compétences | مرتبطة بالمهارة |
| resistance_will | Will-based | Liée à la volonté | مرتبطة بالإرادة |
| resistance_systemic | Systemic | Systémique | منهجية |
| source | Source | Source | المصدر |
| rootCause | Root Cause | Cause racine | السبب الجذري |
| severity | Severity | Gravité | الخطورة |
| mitigationAction | Mitigation Action | Action de mitigation | إجراء التخفيف |
| dueDate | Due Date | Date d'échéance | تاريخ الاستحقاق |
| anonymous | Anonymous | Anonyme | مجهول |
| submitConcern | Submit a concern | Signaler une préoccupation | إرسال ملاحظة |

**M17 (Manager as Coach)**

| Key | English | French | Arabic |
|---|---|---|---|
| m11_title | Manager-as-Coach Enablement | Activation du manager-coach | تمكين المدير كموجه |
| m11_desc | Team-scoped ADKAR heatmap with suggested coaching actions per barrier. | Carte thermique ADKAR de l'équipe avec actions de coaching suggérées par blocage. | خريطة حرارية لفريقك مع إجراءات توجيهية مقترحة لكل عائق. |
| managerReadiness | Manager Readiness Self-Assessment | Auto-évaluation de préparation du manager | تقييم ذاتي لجاهزية المدير |
| coachingScript | Suggested Coaching Script | Script de coaching suggéré | نص توجيه مقترح |

**M21 (Sustainment)**

| Key | English | French | Arabic |
|---|---|---|---|
| m12_title | Reinforcement & Sustainment | Renforcement et pérennisation | التعزيز والاستدامة |
| m12_desc | Post-go-live adoption audits, regression detection, and sustainment sign-off. | Audits d'adoption post-déploiement, détection de régression et validation de pérennisation. | تدقيقات التبني بعد الإطلاق، كشف التراجع، والتوقيع على الاستدامة. |
| checkpoint | Checkpoint | Point de contrôle | نقطة التحقق |
| adoptionRate | Adoption Rate | Taux d'adoption | معدل التبني |
| regressionRisk | Regression Risk | Risque de régression | خطر التراجع |
| quickWin | Quick Win / Milestone | Gain rapide / Jalon | إنجاز سريع / معلم |
| sustainmentSignoff | Sustainment Sign-off | Validation de pérennisation | توقيع الاستدامة |
| lessonsLearned | Lessons Learned | Leçons apprises | الدروس المستفادة |
| m12_rex_desc | A lesson counts as closed only once it names the specific Rule, Control, or Charter that now encodes it. | Une leçon n'est considérée close que lorsqu'elle nomme la règle, le contrôle ou la charte qui l'encode désormais. | لا يُعتبر الدرس مغلقًا إلا عند تسمية القاعدة أو الضابط أو الميثاق الذي أصبح يجسده. |
| m12_rex_applied | Applied | Appliquée | مطبّق |
| m12_rex_pending | Pending | En attente | قيد الانتظار |
| m12_rex_link_placeholder | Linked Rule / Control / Charter (e.g. RULE-008, CTRL-012, CHTR-05) | Règle / Contrôle / Charte liée (ex. RULE-008, CTRL-012, CHTR-05) | القاعدة/الضابط/الميثاق المرتبط (مثال RULE-008, CTRL-012, CHTR-05) |
| m12_rex_link_label | Linked to | Liée à | مرتبط بـ |

**M12 (Risk Register)**

| Key | English | French | Arabic |
|---|---|---|---|
| m13_title | Change Risk Register | Registre des risques de changement | سجل مخاطر التغيير |
| m13_desc | Adoption, sponsorship, capacity and saturation risk — distinct from generic project risk. | Risques d'adoption, de sponsoring, de capacité et de saturation — distincts du risque projet générique. | مخاطر التبني، الرعاية، القدرة والتشبع — مختلفة عن مخاطر المشروع العامة. |
| riskCategory | Category | Catégorie | الفئة |
| risk_adoption | Adoption | Adoption | التبني |
| risk_sponsorship | Sponsorship | Sponsoring | الرعاية |
| risk_capacity | Capacity | Capacité | القدرة |
| risk_saturation | Saturation | Saturation | التشبع |
| likelihood | Likelihood | Probabilité | الاحتمالية |
| impact | Impact | Impact | الأثر |
| riskScore | Risk Score | Score de risque | درجة الخطر |

**M20 (Analytics)**

| Key | English | French | Arabic |
|---|---|---|---|
| m14_title | Metrics & Analytics Dashboard | Tableau de bord des indicateurs et analyses | لوحة المقاييس والتحليلات |
| m14_desc | Composite Readiness Index, adoption curves, and correlation analysis. | Indice composite de préparation, courbes d'adoption et analyse de corrélation. | مؤشر الجاهزية المركب، منحنيات التبني، وتحليل الارتباط. |
| m14_crosstype_tab | Cross-Type Matrix | Matrice comparative des types | مصفوفة مقارنة الأنواع |
| m14_crosstype_title | Cross-Type Comparison Matrix | Matrice de comparaison entre types de transformation | مصفوفة مقارنة أنواع التحول |
| m14_crosstype_desc | How the 8 transformation types compare on duration, terminal gate, external involvement, dominant framework and reversibility. | Comparaison des 8 types de transformation selon la durée, la porte de sortie, l'implication externe, le cadre dominant et la réversibilité. | مقارنة أنواع التحول الثمانية من حيث المدة، بوابة الإنجاز، المشاركة الخارجية، الإطار السائد، وقابلية الرجوع. |
| m14_crosstype_duration | Typical Duration | Durée typique | المدة النموذجية |
| m14_crosstype_gate | Terminal Gate | Porte finale | البوابة النهائية |
| m14_crosstype_external | External Party Involvement | Implication d'une partie externe | مشاركة طرف خارجي |
| m14_crosstype_framework | Dominant Framework | Cadre dominant | الإطار السائد |
| m14_crosstype_reversibility | Reversibility | Réversibilité | قابلية الرجوع |
| m14_crosstype_example | Seed Project Example | Exemple de projet type | مثال مشروع نموذجي |
| readinessIndex | Composite Readiness Index | Indice composite de préparation | مؤشر الجاهزية المركب |
| adoptionCurve | Adoption Curve | Courbe d'adoption | منحنى التبني |
| heatmapByDept | ADKAR Heatmap | Carte thermique ADKAR | خريطة ADKAR الحرارية |
| execNarrative | Executive Readiness Narrative | Narratif de préparation exécutif | سرد الجاهزية التنفيذي |

**M18 (Journey Map)**

| Key | English | French | Arabic |
|---|---|---|---|
| m15_title | Journey Map / Visual Core | Carte du parcours / Cœur visuel | خريطة الرحلة / النواة البصرية |
| m15_desc | A literal, visual timeline combining ADKAR stage, Bridges phase and sentiment. | Une chronologie visuelle combinant l'étape ADKAR, la phase de Bridges et le sentiment. | جدول زمني بصري يجمع مرحلة ADKAR وطور بريدجز والمشاعر. |
| zoomLevel | Zoom Level | Niveau de zoom | مستوى التكبير |
| shareSnapshot | Share Snapshot | Partager l'instantané | مشاركة لقطة |

**M6 (AI Use Case Library)**

| Key | English | French | Arabic |
|---|---|---|---|
| m16_title | AI Use Case Library & Governance | Bibliothèque et gouvernance des cas d'usage IA | مكتبة وحوكمة حالات استخدام الذكاء الاصطناعي |
| m16_desc | A governed catalog of Assistive and Augmented AI use cases. No use case acts autonomously. | Un catalogue gouverné de cas d'usage IA assistifs et augmentés. Aucun cas n'agit de façon autonome. | كتالوج محكوم لحالات استخدام الذكاء الاصطناعي المساعد والمعزز. لا تعمل أي حالة بشكل مستقل. |
| activateForOrg | Active for this Organization | Actif pour cette organisation | مفعّل لهذه المؤسسة |
| activateForProject | Project-level override | Dérogation au niveau du projet | استثناء على مستوى المشروع |
| humanCheckpoint | Human Checkpoint | Point de contrôle humain | نقطة التحقق البشرية |
| triggerInput | Trigger / Input | Déclencheur / Entrée | المُحفِّز / المُدخل |
| output | Output | Sortie | المُخرج |
| usageLog | AI Usage & Override Log | Journal d'utilisation et de dérogation IA | سجل استخدام وتجاوز الذكاء الاصطناعي |
| outcome_accepted | Accepted as-is | Accepté tel quel | مقبول كما هو |
| outcome_edited | Edited | Modifié | مُعدَّل |
| outcome_rejected | Rejected | Rejeté | مرفوض |

**Dashboard / Sectors / Archetypes**

| Key | English | French | Arabic |
|---|---|---|---|
| activeInitiatives | Active Initiatives | Initiatives actives | المبادرات النشطة |
| avgReadiness | Avg. Readiness Index | Indice de préparation moyen | متوسط مؤشر الجاهزية |
| openRisks | Open Risks | Risques ouverts | المخاطر المفتوحة |
| peopleInScope | People in Scope | Personnes concernées | الأشخاص المعنيون |
| portfolioByPhase | Portfolio by Lewin Phase | Portefeuille par phase de Lewin | المحفظة حسب مرحلة لوين |
| sector_manufacturing | Manufacturing | Industrie manufacturière | الصناعة التحويلية |
| sector_logistics | Logistics & Transportation | Logistique et transport | الخدمات اللوجستية والنقل |
| sector_health | Health | Santé | الصحة |
| archetype_erp | ERP Implementation | Mise en œuvre ERP | تنفيذ نظام تخطيط الموارد |
| archetype_automation | Process Automation | Automatisation des processus | أتمتة العمليات |
| archetype_qms | QMS Implementation | Mise en œuvre SMQ | تنفيذ نظام إدارة الجودة |
| archetype_bpr | Business Process Reengineering | Réingénierie des processus métier | إعادة هندسة العمليات |
| archetype_cultural | Cultural / Values Transformation | Transformation culturelle / des valeurs | التحول الثقافي / القيمي |
| archetype_operating_model | Operating Model Redesign | Refonte du modèle opérationnel | إعادة تصميم نموذج التشغيل |
| archetype_compliance | Compliance-Driven Change | Changement réglementaire / de conformité | التغيير المدفوع بالامتثال |
| archetype_training_skills | Training & Skills Development | Formation et développement des compétences | التدريب وتطوير المهارات |

### 10.6 Full Static Reference/Catalog Data

The complete content of every shared reference dataset under `journi/src/data/` — reproduced in full so a rebuild can seed identical demo/reference data without access to the original source files. These are the datasets summarized structurally in Section 4.2 and referenced throughout Section 6; this appendix is their content, verbatim.

**10.6.1 Enumerated Value Sets** (`data/constants.js`, beyond the roles/capabilities already in Sections 3.7 and 10.4)

| Set | Values |
|---|---|
| ADKAR_BLOCKS | awareness, desire, knowledge, ability, reinforcement |
| BRIDGES_PHASES | ending, neutral, beginning |
| SENTIMENT_STAGES | denial, resistance, exploration, commitment |
| LEWIN_PHASES | unfreeze, change, refreeze |
| AI_TIERS | assistive, augmented |
| RISK_CATEGORIES | adoption, sponsorship, capacity, saturation |
| RESISTANCE_TYPES | role, skill, will, systemic |
| SECTORS | manufacturing, logistics, health |
| ARCHETYPES (transformation types) | erp, automation, qms, bpr, cultural, operating_model, compliance, training_skills |
| VISIBILITY_LEVELS | weak, moderate, strong |

**10.6.2 Macro Process Catalog** (`data/macroProcesses.js`, M4) — 10 entries, the atomic units of journi's process model.

| ID | Name | Description | Primary Module(s) |
|---|---|---|---|
| MP-01 | Change Impact & Stakeholder Assessment | Maps stakeholder groups and scores change impact (process, technology, role, location, identity) to establish the baseline scope of who is affected and how. | M9 |
| MP-02 | Sponsorship & Governance Management | Builds and tracks the sponsor coalition, escalation actions, and governance cadence that keep executive backing visible and active. | M7, M13 |
| MP-03 | Communication & Awareness Management | Plans and logs the communications cadence that drives the Awareness block of ADKAR across stakeholder cohorts. | M14 |
| MP-04 | Resistance & Barrier Management | Logs resistance signals by type (role, skill, will, systemic) and tracks mitigation actions through to resolution. | M16 |
| MP-05 | Training & Capability Enablement | Delivers the curriculum that builds the Knowledge and Ability ADKAR blocks, tracked by cohort and completion status. | M15 |
| MP-06 | Champion Network Management | Manages the change-champion network — floor-level advocates who surface early signals into the Sponsor Coalition and Resistance Log. | M13 |
| MP-07 | Readiness Diagnostics & Signal Capture | Aggregates ADKAR scores, sentiment, and other signals into the Composite Readiness Index used to judge go/no-go readiness. | M10, M11 |
| MP-08 | Divergence & Risk Detection | Detects divergence patterns between plan and reality (schedule slips, adoption risk, saturation) and logs them to the Risk Register. | M11, M12 |
| MP-09 | Hypercare & Floor Coaching Support | Provides manager-led floor coaching and hypercare support immediately after go-live, while adoption is still fragile. | M17, M21 |
| MP-10 | Reinforcement & Sustainment Management | Locks in the change through checkpoints, quick wins, and lessons learned so gains outlast the project close-out. | M7, M21 |

**10.6.3 End-to-End Process Registry** (`data/e2eProcesses.js`, M4) — 17 entries: 4 core lifecycle chains, 4 cross-cutting loops, 8 transformation-type lifecycles. RACSI role codes (ES/CM/PM/FPO/ITL/SUP/EU) are a separate 7-code taxonomy from journi's own 9-role platform enum: ES = Executive Sponsor, CM = Change Manager, PM = Program/Project Manager, FPO = Functional Process Owner, ITL = IT/Technical Lead, SUP = Supervisor, EU = End User.

*Core lifecycle chains:*

| ID | Name | Macro Process Chain | Trigger | Terminal State | RACSI |
|---|---|---|---|---|---|
| E2E-01 | Readiness & Mobilization | MP-01→02→03→06→07 | Business case and stakeholder map opened | Mobilized sponsorship, informed and diagnosed population, active champion network | R=CM, A=ES, C=FPO/PM, S=SUP, I=EU |
| E2E-02 | Capability & Divergence Management | MP-05→08→07 | Curriculum, sandbox, and cohort segmentation confirmed from E2E-01 | Verified capable and emotionally-ready cohorts; Divergence Pattern log | R=CM, A=CM, C=FPO/ITL, S=PM/SUP, I=ES/EU |
| E2E-03 | Resistance-to-Commitment | MP-04→06→07→09 | A stalled Desire score or negative sentiment pulse is first logged | Resolved barriers; recovered Desire/sentiment scores; sustained commitment | R=CM, A=CM, C=ES/SUP, S=PM, I=FPO/EU |
| E2E-04 | Adoption-to-Sustainment | MP-09→10→07 | Go-live cutover executed | Stabilized new-normal performance; embedded reinforcement; confirmed Refreeze; closed project | R=CM, A=ES, C=PM/FPO, S=SUP, I=ITL/EU |

*Cross-cutting loop chains:*

| ID | Name | Macro Process Chain | Trigger | Terminal State | Related Modules |
|---|---|---|---|---|---|
| E2E-05 | Signal Aggregation Loop | MP-03→05→07→08 | New awareness (MP-03) or knowledge/ability (MP-05) signal recorded | Composite Readiness Index (MP-07) recalculated and evaluated by the Divergence Pattern Detector (MP-08) | M14, M15, M10, M11, M12 |
| E2E-06 | PM ↔ CM Governance Bridge | MP-02→08 | Main Project schedule slip logged OR Phase Gate checkpoint reached | Joint Decision Record produced (Go / Go with Conditions / No-Go); PM and CM inputs preserved independently; exactly one Accountable role named | M13, M12, M8 |
| E2E-07 | Champion Early-Warning Loop | MP-06→04 | Champion floor-level observation logged | Observation formalized into a Resistance Log barrier record | M13, M16 |
| E2E-08 | Governance Escalation Loop | MP-02→10 | Sponsor escalation action logged | Escalation resolved and reflected in the sustainment signoff | M13, M21 |

*Transformation-type lifecycles* (each links a Phase Template, Section 10.6.4):

| ID | Transformation Type | Macro Process Chain | SIPOC Suppliers | SIPOC Customers | Phase Template |
|---|---|---|---|---|---|
| E2E-ERP | erp | MP-01→02→03→05→07→09→10 | Executive Sponsor, PM, Change Manager | Steering Committee, End Users, Sustainment Team | TPL-ERP-8 |
| E2E-BPR | bpr | MP-01→02→03→05→07→08→09→10 | Executive Sponsor, FPOs, Change Manager | Steering Committee, Process Owner, End Users | TPL-BPR-7 |
| E2E-BPA | automation | MP-01→02→03→05→07→08→09→10 | Executive Sponsor, ITL, FPO | Steering Committee, Center of Excellence, End Users | TPL-BPA-7 |
| E2E-IMS | qms | MP-01→02→03→05→07→08→09→10 | Certification Body, FPOs, Change Manager | Steering Committee, Quality Function, External Auditor | TPL-IMS-7 |
| E2E-CULT | cultural | MP-01→02→03→04→06→07→08→09→10 | Executive Sponsor, HR Business Partner, Change Manager | Steering Committee, Leadership Team, All Employees | TPL-CULT-7 |
| E2E-OM | operating_model | MP-01→02→03→05→07→08→09→10 | Executive Sponsor, Function Heads, HR Business Partner | Steering Committee, Standing Operating Committee, All Employees | TPL-OM-7 |
| E2E-COMP | compliance | MP-01→02→03→05→07→08→09→10 | Legal/Compliance, FPOs, Change Manager | Steering Committee, Compliance Function, Regulator | TPL-COMP-7 |
| E2E-TSD | training_skills | MP-01→02→03→05→06→07→08→09→10 | Training Lead, FPOs, Change Manager | Steering Committee, End Users, BAU Owner | TPL-TSD-7 |

**10.6.4 Default RACSI Grid** (`data/racsi.js`, M4) — one row per Macro Process, one column per role (sponsor, change_manager, people_manager, practitioner, employee, executive); values are R/A/C/S/I or blank.

| Macro Process | Sponsor | Change Manager | People Manager | Practitioner | Employee | Executive |
|---|---|---|---|---|---|---|
| MP-01 | A | R | I | C | I | |
| MP-02 | A | R | I | | I | C |
| MP-03 | A | R | C | | I | |
| MP-04 | A | R | C | | I | |
| MP-05 | | A | C | R | I | |
| MP-06 | A | R | C | | I | |
| MP-07 | A | R | | C | I | I |
| MP-08 | A | R | I | | | C |
| MP-09 | | A | R | | C | |
| MP-10 | S | A | C | | I | I |

**10.6.5 Phase Template Library** (`data/phaseTemplates.js`, M8) — 8 templates. TPL-ERP-8 ships fully populated as the flagship reference example; the 7 Common Lifecycle variants ship with phase names only, ready to be filled in per engagement.

*TPL-ERP-8 — ERP Implementation, 8 phases (fully populated):*

| Phase | CM Track (sample) | Checklist (sample) | Gate Question (sample) |
|---|---|---|---|
| Discovery | Build CM business case; populate Stakeholder Map (M9); name Executive Sponsor with a visible action (M13) | Business case approved, not just drafted | Is the business case approved by the Steering Committee? |
| Design | Run kickoff communications, capture baseline Awareness (M10); recruit Champion network; log design decisions | Baseline Awareness score exists for highest-severity cohorts | Is there a baseline Awareness reading for high-severity cohorts? |
| Build | Track ADKAR Desire trend, open recovery response for stalled blocks; run first communications wave; log resistance | No cohort below Desire stall threshold without a logged recovery response | Is ADKAR Desire trending upward across all cohorts? |
| Test | Re-score Knowledge/Ability for UAT cohorts; watch for Divergence Pattern; confirm training mapped to gaps | UAT participant ADKAR scores re-measured, not assumed | Has UAT capability been re-measured, not assumed? |
| Train | Deliver training waves, track completion; coach managers on team barriers; re-pulse Bridges/Kübler-Ross | Manager coaching actions logged for any flagged team barrier | Have flagged team barriers received a coaching response? |
| Deploy | Mark Lewin as provisional Change at cutover; run go-live communications; log cutover as justified change | Go-live communications sent to every affected cohort | Has go-live communication reached every affected cohort? |
| Hypercare | Re-pulse Bridges/Kübler-Ross at 2- and 4-week marks; track defect-linked sentiment dips; confirm Readiness trend | Two- and four-week re-pulses completed for all affected cohorts | Have the scheduled re-pulses been completed? |
| Sustain | Confirm Bridges/Kübler-Ross reads New Beginning/Commitment before calling Refreeze; verify reinforcement; run 30/60/90-day checkpoints | Refreeze called on emotional/behavioral evidence, not the go-live date | Is Refreeze backed by confirmed evidence across all cohorts? |

*(Each phase in the source carries 3 full CM Track actions, 3 checklist items, and 3 gate questions — the table above shows one representative sample of each per phase; the complete text is in `journi/src/data/phaseTemplates.js` and should be transcribed verbatim by a rebuild team seeding this data, since it is prescriptive practitioner guidance, not filler.)*

*The 7 Common Lifecycle variants* (phase names only — `cmTrack`/`checklist`/`gate` arrays ship empty, ready for per-engagement authoring via M8's template editor):

| Template ID | Transformation Type | Phases (P1–P7) |
|---|---|---|
| TPL-BPR-7 | bpr | Intake & Diagnosis · Clean-Slate Design · Build · Pilot · Rollout · Stabilization · Sustainment |
| TPL-BPA-7 | automation | Automation-Opportunity Assessment · Architecture Design · Build · UAT & Shadow-Mode · Production Go-Live · Exception Tuning · CoE Handover |
| TPL-IMS-7 | qms | Intake & Diagnosis · Design · Implementation · Mock-up Audit · Certifying Audit · Surveillance Prep · Ongoing Surveillance |
| TPL-CULT-7 | cultural | Diagnosis · Target Values Design · Leadership Modeling & Reinforcement Build · Pilot Cohort · Organization-Wide Rollout · Reinforcement Through Skepticism · Institutionalization |
| TPL-OM-7 | operating_model | Current Operating Model Assessment · TOM Design · Detailed Org Design · Pilot Transition · Full Transition · Governance Adoption Tracking · Standing Rhythm Handover |
| TPL-COMP-7 | compliance | Regulatory Requirement & Gap Analysis · Control Design · Control Implementation · Internal Audit/Independent Testing · Controls Go Live · First Monitoring Cycle · Ongoing Compliance Handover |
| TPL-TSD-7 | training_skills | Skills Gap Diagnosis · Curriculum Design · Training Delivery · Competency Verification · Practical Application · On-the-Job Coaching · Skills Sustainment |

**10.6.6 Charter Registry — full text** (`data/charters.js`, M5) — 8 charters, each with one primary entry (What/Who/When/Where/Why/How).

| ID | Name | RACSI | Governs | Status | Primary Macro | Review Frequency |
|---|---|---|---|---|---|---|
| CHTR-01 | Sponsorship / Leadership Charter | R=CM, A=ES, C=PM/FPO, I=SUP/EU | Project | Active | MP-02 | Per Phase Gate |
| CHTR-02 | Participative Management Charter | R=SUP, A=CM, C=FPO/PM, I=ES/EU | Project | Active | MP-04 | Quarterly |
| CHTR-03 | Communication Charter | R=CM, A=CM, C=ES/FPO, S=PM, I=SUP/EU | Project | Active | MP-03 | Per communication wave |
| CHTR-04 | Organizational Impact Charter | R=CM, A=CM, C=FPO/SUP, S=PM, I=ES/EU | Project | Active | MP-01 | On scope change |
| CHTR-05 | Team Coaching Charter | R=SUP, A=CM, C=ITL, S=PM, I=ES/FPO/EU | Project | Active | MP-09 | Per hypercare phase |
| CHTR-06 | One-to-One Coaching Charter | R=CM, A=CM, C=FPO, S=SUP, I=ES/PM/EU | Project | Active | MP-08 | Per triggered case |
| CHTR-07 | Mentoring Charter (Trainee→Observer→Autonomous) | R=CM, A=CM, C=FPO/ITL, S=PM/SUP, I=ES/EU | Project | Active | MP-05 | Per mentee cohort |
| CHTR-08 | Pulse / Interview Charter | R=CM, A=CM, S=PM/SUP, I=ES/FPO/EU | Project | Active | MP-07 | Per phase gate + ad hoc |

Full "What" text per charter (the "Who/When/Where/Why/How" fields are equally detailed in the source and should be transcribed verbatim; shown here condensed to the core commitment each charter defines):

- **CHTR-01**: Defines the specific, observable sponsorship behaviors expected of the Executive Sponsor and Steering Committee across the initiative lifecycle.
- **CHTR-02**: Defines how Frontline Supervisors and People Managers involve their teams in decisions that affect them, rather than announcing decisions top-down.
- **CHTR-03**: Defines the message-audience-channel-timing discipline and the FAQ/reply-protocol standard every communication wave must follow.
- **CHTR-04**: Defines the methodology and sign-off standard for assessing how the change affects process, technology, role, location and professional identity.
- **CHTR-05**: Defines the standard for group/team-level floor coaching delivered by People Managers during hypercare, distinct from individual 1:1 coaching.
- **CHTR-06**: Defines the standard for individual, identity-focused coaching conversations — most notably divergence-case 1:1s.
- **CHTR-07**: Defines the three-stage progressive mentoring model (Trainee, Observer, Autonomous) that carries an individual from initial training through to independent, unsupervised competence.
- **CHTR-08**: Defines the cadence, instrument standard and consent protocol for every structured pulse survey, rapid pulse, and 1:1 interview used to capture readiness signals.

**10.6.7 Charter Action Mapping** (`data/charterActions.js`, M5) — the many-to-many mapping from each charter to concrete PDCA-staged actions across macro processes/tasks/phases. 35 entries total; representative excerpt (full list in source):

| ID | Charter | Name | PDCA | Phase | Responsible / Accountable | Frequency |
|---|---|---|---|---|---|---|
| CHTRACT-0101 | CHTR-01 | Log weekly visible-sponsorship activity | Do | P2 | ES / ES | Weekly |
| CHTRACT-0102 | CHTR-01 | Review sponsor coverage gate and coach on gaps | Check | P2 | CM / CM | Weekly |
| CHTRACT-0103 | CHTR-01 | Escalate unresolved CM risks to Sponsor | Act | P4 | CM / ES | Ad hoc |
| CHTRACT-0301 | CHTR-03 | Build the persona × channel × cadence communication matrix | Plan | P2 | CM / CM | Once, revised per wave |
| CHTRACT-0302 | CHTR-03 | Run saturation check before scheduling a new wave | Check | P3 | CM / CM | Per wave |
| CHTRACT-0601 | CHTR-06 | Triage the divergence alert against supervisor observation | Plan | P6 | SUP / CM | Per triggered case |
| CHTRACT-0602 | CHTR-06 | Hold identity-focused 1:1 conversation | Do | P6 | CM / CM | Per triggered case |
| CHTRACT-0701 | CHTR-07 | Diagnosis — assess mentee's starting Knowledge/Ability | Plan | P4 | Training Lead / Training Lead | Once per mentee |
| CHTRACT-0703 | CHTR-07 | Execution — Stage 1: Trainee (maps to MENT-01) | Do | P4 | Training Lead / Training Lead | Per mentee |
| CHTRACT-0704 | CHTR-07 | Execution — Stage 2: Observer (maps to MENT-02) | Do | P4 | Training Lead / Training Lead | Per mentee |
| CHTRACT-0705 | CHTR-07 | Execution — Stage 3: Autonomous (maps to MENT-03) | Do | P4 | Training Lead / FPO | Per mentee, ongoing |
| CHTRACT-0706 | CHTR-07 | Closure — formal Autonomous sign-off and hand-off | Act | P4 | Training Lead / FPO | Once per mentee |
| CHTRACT-0801 | CHTR-08 | Run baseline ADKAR/Bridges/Kübler-Ross pulse | Plan | P1 | CM / CM | Once |
| CHTRACT-0804 | CHTR-08 | Consolidate all readings into the Composite Readiness Index | Check | P2–P6 | CM / CM | Per phase gate |

Each of CHTR-01 through CHTR-08 has 3–6 mapped actions in the source (35 total); the full ID/name/PDCA-stage/sequence/macro-process/task/step/phase/role/frequency table should be transcribed verbatim from `journi/src/data/charterActions.js` for exact rebuild parity.

**10.6.8 Mentoring Progression Model** (`data/mentoringStages.js`, M5) — the 3-stage model behind CHTR-07.

| ID | Stage | Entry Criteria | Exit Criteria | Typical Duration | Mentor Involvement | Regression Path |
|---|---|---|---|---|---|---|
| MENT-01 | Trainee | Completed role-based curriculum (M15); assigned to a named Mentor | Consistent, accurate sandbox task completion across defined repetitions | 1–2 weeks | Continuous — instructs and corrects in real time | Below-threshold performance triggers remedial training before re-attempting |
| MENT-02 | Observer | Mentor confirms consistent sandbox performance | Defined live repetitions with zero critical-error interventions | 1–2 weeks | Passive — observes and logs, intervenes only on critical error | Repeated critical-error interventions return the mentee to Trainee (MENT-01) |
| MENT-03 | Autonomous | Mentor confirms zero critical-error live repetitions; FPO co-signs | Formal Autonomous sign-off recorded; handed off to regular People Manager | Ongoing from transition date | Minimal — periodic spot-audit only | A spot-audit failure or a Sustainment regression flag returns the individual to Observer (MENT-02) |

**10.6.9 Default Qualitative Coding Workbench Codebook** (`data/defaultCodebook.js`, M16) — the starter codebook every Organization is seeded with (org-editable thereafter).

| Label | Description |
|---|---|
| fear-of-obsolescence | Concern that a skill, role, or way of working is being made redundant. |
| trust-in-leadership | Comments referencing confidence (or lack of it) in sponsors/leadership follow-through. |
| workload-concern | The change is perceived as adding work without removing anything in return. |
| skill-gap-anxiety | Fear of not being able to learn or perform the new way of working. |
| process-ownership-loss | A sense of losing control or authorship over a process the person used to own. |
| external-comparison | Comparing unfavorably to how another site, team, or a prior employer handled a similar change. |

**10.6.10 Stakeholder Journeys** (`data/journeys.js`, M19) — 8 journeys.

| ID | Name | Type | Trigger | Audience | Duration | Linked Modules |
|---|---|---|---|---|---|---|
| JRN-01 | End User Adoption Journey | Persona | Change scope communicated to affected population | Employee / End User | J0–J8 (full lifecycle) | M9, M10, M11, M14, M15, M18 |
| JRN-02 | Executive Sponsor Journey | Persona | CM Project opened, Sponsor named | Executive Sponsor | J0–J8 | M7, M13 |
| JRN-03 | Frontline Supervisor / People Manager Journey | Persona | Team assigned to Supervisor | Frontline Supervisor / People Manager | J3–J8 | M16, M17 |
| JRN-04 | Champion Journey | Persona | Champion nominated | Employee (Champion role) | J1–J7 | M13 |
| JRN-05 | Mentee Journey (specializes JRN-01) | Persona | Assigned to a Mentor at Training entry | Employee / End User (mentored role) | J4, extending into J6 | M15 |
| JRN-06 | Divergence Case Journey | Exception | Divergence Pattern Detector flags a case | Employee / End User (flagged) | Ad hoc, per case | M11, M12 |
| JRN-07 | QMS Certification Journey (specializes JRN-01) | Sector-Specific | Certification requirement confirmed (QMS) | FPO / QHSE Champion | J1–J8, extended by audit gates | M9, M13 |
| JRN-08 | AI Suggestion Lifecycle Journey | System | An AI Use Case Library entry generates a suggestion | N/A — human-facing at review step | Minutes to days | M6 |

**10.6.11 Journey Touchpoints** (`data/journeyTouchpoints.js`, M19) — 24 touchpoints across JRN-01, 02, 04, 05, 06.

*JRN-01 (End User Adoption, 6 touchpoints):* Receives kickoff communication (day 0, CM) → Completes baseline pulse (day 7, CM) → Attends role-based training (day 90, Trainer) → Experiences go-live cutover (day 150, ITL) → Receives hypercare floor coaching (day 157, People Manager) → Reinforcement embedded into performance review (day 240, HR Business Partner).

*JRN-02 (Executive Sponsor, 4 touchpoints):* Signs the Sponsorship/Leadership Charter (day 0) → Logs first visible-sponsorship activity (day 7) → Attends Phase Gate reviews (day 60) → Confirms sustainment sign-off (day 240).

*JRN-04 (Champion, 4 touchpoints):* Nominated as champion (day 0) → Onboarded and equipped (day 5) → Participates in listening session (day 30) → Network re-chartered post-go-live (day 180).

*JRN-05 (Mentee, 5 touchpoints):* Diagnosis assessment completed (day 0) → Enters Trainee stage/sandbox (day 3) → Advances to Observer stage (day 17) → Advances to Autonomous stage (day 31) → Formal Autonomous sign-off & hand-off (day 35).

*JRN-06 (Divergence Case, 4 touchpoints):* Case flagged and triaged (day 0) → Identity-focused 1:1 held (day 3) → Closure moment delivered (day 4) → Bridges re-checked, case closed (day 14).

Each touchpoint additionally carries a PDCA sub-phase, owner role, automation level, and a concrete success criterion/evidence requirement — see `journi/src/data/journeyTouchpoints.js` for the full 24-row table with every field.

**10.6.12 Journey Analytics Dashboards** (`data/journeyDashboards.js`, M19) — 5 dashboards; DASH-01/02 compute live metrics, DASH-03/04/05 are reference cards.

| ID | Name | Live Metric Source | Visualisation | Refresh |
|---|---|---|---|---|
| DASH-01 | End User Journey Completion Dashboard | JRN-01 touchpoint log | Funnel, Gantt, Bar | Weekly |
| DASH-02 | Sponsor & Charter Compliance Dashboard | charterActionLog | KPI Cards, Bar, Radar | Weekly |
| DASH-03 | Mentoring Progression Dashboard | Reference only | Funnel, Bar, KPI Cards | Weekly |
| DASH-04 | Divergence Case Resolution Dashboard | Reference only | Bar, Heatmap, Line | Real-time |
| DASH-05 | Journey Analytics — Executive Roll-Up | Reference only | Radar, KPI Cards | Monthly |

**10.6.13 Change Management Benchmarking Reference Bands** (`data/benchmarks.js`, M20) — illustrative, not sourced from a real industry study.

| Lewin Phase | Low | Mid | High | (Readiness Index band) |
|---|---|---|---|---|
| unfreeze | 20 | 35 | 50 | |
| change | 40 | 55 | 70 | |
| refreeze | 60 | 75 | 90 | |

| Checkpoint | Low | Mid | High | (Adoption Rate band) |
|---|---|---|---|---|
| 30-day | 40 | 60 | 75 | |
| 60-day | 55 | 72 | 85 | |
| 90-day | 65 | 80 | 92 | |

Standing formula: below `low` = "behind"; between `low` and `high` = "in line"; at or above `high` = "ahead."

**10.6.14 Cross-Type Comparison Matrix** (`data/crossTypeMatrix.js`, M20) — all 8 transformation types.

| Type | Typical Duration | Terminal Gate | External Party | Dominant Framework | Reversibility |
|---|---|---|---|---|---|
| erp | 12 months (illustrative) | Cutover & Go-Live | Not typically | Knowledge / Ability (balanced) | Low once live |
| bpr | 6–12 months per process | Full rollout | Not typically | Ability | Moderate |
| automation | 3–9 months per workflow | Production go-live | Not typically | Ability / Reinforcement | Low once live |
| qms | 6–14 months | Certifying audit (external) | Yes — certification body | Knowledge | Low — audit is external |
| cultural | 18–36 months | Org-wide rollout | Not typically | Bridges / Kübler-Ross | High — but slow to fix |
| operating_model | 9–18 months from diagnosis | Full transition | Not typically | Awareness / Ability | Low once transitioned |
| compliance | Driven by external deadline | Enforceable date (external) | Often — regulator | Awareness / Knowledge | None — fixed deadline |
| training_skills | 3–6 months per curriculum wave | Competency verification sign-off | Not typically | Knowledge / Ability | High — gap can be re-addressed |

**10.6.15 Project Context Overlay** (`data/projectContextOverlay.js`, M19) — reference-framework worked examples, not journi's own seeded demo projects.

| Project | Attribute | Value |
|---|---|---|
| PRJ-001 | Dominant Tension | Historical, diffuse skepticism (multi-plant legacy ERP consolidation) |
| PRJ-001 | Exception Pattern Most Likely | E3 — Two-Clock Problem at Cutover & Go-Live |
| PRJ-002 | Dominant Tension | Concrete, specific fear of headcount reduction (RPA automation) |
| PRJ-002 | Exception Pattern Most Likely | E1 — Desire Stall During Data Migration & Integration |
| PRJ-003 | Dominant Tension | Low job change, but certification adds external audit pressure |
| PRJ-003 | Exception Pattern Most Likely | E6 — Cohort Divergence Across Sites or Departments |
| PRJ-004 | Digital Literacy Risk | High — 24/7 operations, mixed digital-literacy workforce |
| PRJ-006 | Constraint Type | 24/7 shift-based operations complicate synchronized training |
| PRJ-007 | Constraint Type | Patient-safety-critical cutover windows constrain go-live timing |
| PRJ-009 | Certification Anchor | JCI accreditation — external pass/fail gate |
| PRJ-011 | Timeline Risk | No forcing deadline — 18–36 month standalone culture program |
| PRJ-013 | Timeline Risk | Fixed, non-negotiable regulatory compliance deadline |

**10.6.16 AI Use Case Catalog — full prompt templates** (`data/aiUseCases.js`, M6) — all 14 seeded use cases with their literal prompt text, for exact behavioral parity in a rebuild.

| ID | Name | Tier | Module | Prompt Template |
|---|---|---|---|---|
| uc-stakeholder-impact | Stakeholder Impact Drafting Assistant | Assistive | M9 | "You are a Change Management analyst. Given the attached org chart and the change scope description below, propose per-group impact scores (1-5) across Process, Technology, Role, Location, and Identity, and group affected staff into 3-6 named cohorts. Return a short table, not prose. Do not invent org units not present in the input." |
| uc-adkar-barrier | ADKAR Barrier Diagnosis Assistant | Assistive | M10 | "Read the open-text survey response below. Identify which single ADKAR block ... it most likely reflects a barrier in, and summarize the barrier in one short phrase (e.g. 'Desire — fear of role redundancy'). If the text does not clearly indicate a barrier, say so rather than guessing." |
| uc-cohort-summarizer | Cohort Readiness Summarizer | Augmented | M10 | "Given the five ADKAR block scores (1-5) for this cohort below, write a 3-4 sentence readiness narrative suitable for a Sponsor update: name the strongest and weakest blocks, state the overall trajectory, and avoid restating the raw numbers verbatim. Plain business prose, no bullet points." |
| uc-sentiment-classifier | Sentiment & Emotion Classifier | Augmented | M11 | "Classify each pulse-survey comment below into exactly one of: Denial, Resistance/Anger, Exploration, Commitment ... Return one classification per comment with a one-line justification quoting the relevant phrase. If a comment is ambiguous between two stages, pick the earlier one." |
| uc-divergence-detector | Divergence Pattern Detector | Assistive | M11 | "Given a cohort's ADKAR Knowledge and Ability scores and its current Bridges transition reading below, state in one sentence whether this looks like the Divergence Pattern ... and, if so, recommend a loss-focused conversation rather than additional training." |
| uc-sponsor-recommender | Sponsor Action Recommender | Assistive | M13 | "Given this sponsor's current visibility score and their most recent logged sponsorship actions below, suggest one concrete next action ... that would most improve visibility. One sentence, specific, not generic advice." |
| uc-comm-draft | Communication Draft Generator | Augmented | M14 | "Draft a message for the persona, channel, and language specified below ... Match tone and length to the channel — an email can run 150-200 words, a chat/SMS-style channel under 40. Do not include a subject line unless the channel is email. Plain text only." |
| uc-saturation-advisor | Change Saturation Advisor | Assistive | M14 | "Given the list of scheduled communications below (date, target population, initiative), identify any population that would receive more than one significant communication within the same week from different initiatives, and suggest a specific alternate week for the lower-priority one. List conflicts only." |
| uc-training-mapper | Training Gap-to-Curriculum Mapper | Assistive | M15 | "Given the ADKAR Knowledge and Ability scores below for this cohort, and the list of available curriculum tracks, recommend which 1-3 tracks would most directly close the gap. Reference the track names exactly as given; do not invent tracks that aren't in the list." |
| uc-coaching-script | Manager Coaching Script Generator | Assistive | M17 | "Write a short coaching talking-points script (4-6 bullet points) a people manager could use in a 1:1 to address the flagged ADKAR barrier described below. Tone: supportive, specific to the barrier named, not generic change-management platitudes. Include one open-ended question the manager should ask." |
| uc-resistance-classifier | Resistance Root-Cause Classifier | Assistive | M16 | "Classify the logged resistance description below into exactly one of: Role (concern about job/role security), Skill (concern about ability to perform), Will (unwillingness despite capability), or Systemic (structural/process obstacle outside the individual's control). One-word classification plus a one-sentence justification quoting the description." |
| uc-regression-predictor | Regression Risk Predictor | Augmented | M21 | "Given the post-go-live usage trend data below ..., produce a regression-risk score from 1 (low) to 5 (high) and a two-sentence explanation naming the specific trend that drove the score. Do not score above 3 unless the data shows an actual declining trend, not just a low absolute level." |
| uc-exec-narrative | Executive Readiness Narrative Generator | Augmented | M20 | "Write a 4-5 sentence executive-summary narrative for a Steering Committee update, given the Composite Readiness Index and the underlying ADKAR/sentiment/training figures below. Lead with the headline number and trend, name the single biggest risk or blocker if one is evident in the data, and close with the recommended next checkpoint. No jargon beyond what a non-CM executive would recognize." |
| uc-journey-annotation | Journey Map Annotation Assistant | Assistive | M18 | "Given the timeline event described below (what changed, and when), suggest a short annotation label (under 8 words) suitable for a visual journey map marker. Favor concrete, specific labels ('UAT go-live delayed 2 weeks') over vague ones ('timeline change')." |

**10.6.17 Alert Definitions** (`data/alertDefinitions.js`, Notification Center) — all 16 catalogued conditions; see Section 7.2 for which 9 compute live in the reference build and why the other 7 do not.

| ID | Name | Severity | SLA | Recipient Roles |
|---|---|---|---|---|
| ALT-001 | Divergence Pattern Detected | High | Acknowledge within 48h | CM |
| ALT-002 | Regression Risk Score Critical | Critical | Acknowledge within 24h | CM, SUP |
| ALT-003 | Sponsor Coverage Gap | Medium | Acknowledge within 5 business days | PMO, ES |
| ALT-004 | Resistance Escalation Threshold Breached | High | Acknowledge within 3 business days | CM, ES |
| ALT-005 | Survey Exception Escalated to Admin | Medium | Resolve within 1 business day | Admin |
| ALT-006 | Champion Coverage Below Target | Low | Review within 14 days | CM |
| ALT-007 | AI Use Case Confidence Below Threshold | Informational | Review at next session | CM |
| ALT-008 | Change Saturation Threshold Breached | Medium | Review within 10 business days | PMO |
| ALT-009 | Phase Gate No-Go / Conditional | High | Review within 3 business days | PM, CM, PMO |
| ALT-010 | Guiding Coalition Gap | Medium | Review within 10 business days | PMO, ES |
| ALT-011 | Communication Overload Detected | Low | Review within 5 business days | CM, PMO |
| ALT-012 | Import Integrity Check Failed | Medium | Resolve within 1 business day | ITL |
| ALT-013 | Administrative Account Locked | High | Review within 4 business hours | Super Admin |
| ALT-014 | GDPR Request SLA at Risk | High | Review within 5 business days of receipt | Super Admin |
| ALT-015 | Sustainment Sign-Off Blocked | Medium | Review within 5 business days | CM, ES |
| ALT-016 | AI Provider Fallback Triggered | Informational | Review at next session | ITL |

### 10.7 UI Visual Reference

Full-page screenshots of every one of journi's 22 modules, captured against the seeded Atlas Industrial Group demo tenant, plus one showing the shared Add/Edit modal pattern (Section 3.2) in use. These give a rebuild team an actual visual reference to match — layout, density, the Sidebar/TopBar shell, table and badge styling — alongside the prose UI conventions in Section 5.1. The current color palette is the one described in Section 5.1; a proposed alternative palette direction was shared separately with the client and is not yet adopted, so it is not reflected here.

**M1 — Tenant & Org Hierarchy**

![M1 Tenant & Org Hierarchy](screenshots/m01.png)

**M2 — Identity & RBAC**

![M2 Identity & RBAC](screenshots/m02.png)

**M3 — Organizational Breakdown Structure**

![M3 OBS](screenshots/m03.png)

**M4 — Macro Process, SIPOC, RACSI & E2E Process Registry**

![M4 Process Registry](screenshots/m04.png)

**M5 — Change Management Charter Registry**

![M5 CM Charters](screenshots/m05.png)

**M6 — AI Use Case Library & Governance**

![M6 AI Use Case Library](screenshots/m06.png)

**M7 — Initiative Registry**

![M7 Initiative Registry](screenshots/m07.png)

**M8 — Work Breakdown Structure & Gantt**

![M8 WBS and Gantt](screenshots/m08.png)

**M9 — Stakeholder & Impact Mapping**

![M9 Stakeholder Mapping](screenshots/m09.png)

**M10 — ADKAR Engine**

![M10 ADKAR Engine](screenshots/m10.png)

**M11 — Emotional & Transition Layer**

![M11 Emotional and Transition](screenshots/m11.png)

**M12 — Change Risk Register**

![M12 Risk Register](screenshots/m12.png)

**M13 — Sponsor & Coalition**

![M13 Sponsor and Coalition](screenshots/m13.png)

**M14 — Communication Planning & Execution**

![M14 Communications](screenshots/m14.png)

**M15 — Training & Capability Building**

![M15 Training](screenshots/m15.png)

**M16 — Resistance Management**

![M16 Resistance](screenshots/m16.png)

**M17 — Manager-as-Coach Enablement**

![M17 Manager as Coach](screenshots/m17.png)

**M18 — Journey Map / Visual Core**

![M18 Journey Map](screenshots/m18.png)

**M19 — Stakeholder Journeys, Touchpoints & Analytics**

![M19 Journeys and Analytics](screenshots/m19.png)

**M20 — Metrics & Analytics Dashboard**

![M20 Analytics](screenshots/m20.png)

**M21 — Reinforcement & Sustainment**

![M21 Sustainment](screenshots/m21.png)

**M22 — Field Notes**

![M22 Field Notes](screenshots/m22.png)

**Shared CRUD modal pattern** (illustrated on M9's "+ Stakeholder Group" Add dialog — every module's Add/Edit flow uses this same shell, per Section 3.2)

![Shared Add/Edit modal example](screenshots/modal-example.png)

### 10.8 Test Plan / Acceptance Criteria

One acceptance test case per functional requirement in Section 6, in Given/When/Then form, so a QA team can verify a rebuild against this document without re-deriving test intent from prose. Every row traces to exactly one `FR-M`*n*`-`*nn* or `FR-X-`*nn* id; NFR verification notes follow in Section 10.8.4. Roles referenced are the 9 platform roles (Section 3.7); "a write-capable role" means any role for which the cited capability check returns true under the default Permission Matrix (Section 10.4).

**10.8.1 Platform & Governance (M1–M6)**

| FR | Given | When | Then |
|---|---|---|---|
| FR-M1-01 | Signed in as `org_admin` in a scoped Organization | Creating/editing/deleting a Group, Organization, Main Project, or Change Management Project | The operation succeeds and the record list reflects the change immediately |
| FR-M1-02 | A Change Management Project with an empty `mainProjectIds[]` | Linking it to two different Main Projects | Both links persist; the project is no longer flagged "standalone" |
| FR-M1-03 | A Group with two member Organizations | Deleting the Group | Both Organizations remain, each with `groupId` cleared (now standalone) |
| FR-M1-04 | An Organization with Main/CM Projects, AI activation state, and scoped users | Deleting the Organization | All of the above are removed; no orphaned records remain |
| FR-M1-05 | A Main Project linked to one Change Management Project | Deleting the Main Project | The Change Management Project persists, now with the link removed (standalone) |
| FR-M1-06 | A Change Management Project with one user scoped directly to it | Deleting the Change Management Project | That user account is also removed |
| FR-M1-07 | An Organization with Default Language = French | A user with no personal language preference signs in | The UI renders in French |
| FR-M1-08 | A Main Project linked to two Change Management Projects, another with none | Viewing the M1 hierarchy | The first shows "2 linked CM projects"; the second is badged "standalone" |
| FR-M2-01 | Signed in as `org_admin` | Creating a user, then attempting to edit their name/email after creation | Role edits succeed; no UI control exists to edit name/email post-creation |
| FR-M2-02 | Signed in as `change_manager` (not `super_admin`) | Viewing the Permission Matrix tab | The grid renders read-only; no edit control is enabled, even if the matrix grants other capabilities to this role |
| FR-M2-03 | `super_admin` grants `people_manager` the `write` capability | Any `people_manager` user reloads any write-gated module | Write controls that were previously hidden are now visible, with no code deploy |
| FR-M2-04 | `requireJustification` is toggled off by `org_admin` | A Change Manager changes an ADKAR score with no justification text | Save succeeds without a justification note |
| FR-M2-05 | A license with `maxUsers: 20` and 22 seeded users | Viewing the License & Plan tab | An over-capacity flag is shown; expiry countdown is color-coded per its threshold |
| FR-M2-06 | Uploading a `.lic` file missing the `hardwareId` field | Attempting the upload | The upload is rejected for a missing required field (not a signature check) |
| FR-M3-01 | Signed in as `change_manager` | Adding, editing, and deleting an OBS entry | All three operations succeed and the roster updates |
| FR-M3-02 | An OBS entry "Site Lead" with two direct reports | Deleting "Site Lead" | Both direct reports now report to whoever "Site Lead" reported to (not orphaned) |
| FR-M3-03 | An OBS roster with a 3-level reporting chain, entries added out of order | Viewing the roster | Entries render depth-first, roots first, indented by depth — not in creation order |
| FR-M3-04 | An OBS roster with at least one entry | Opening M8's "Assigned to" field on a WBS task | The OBS entry appears as a selectable assignee |
| FR-M4-01 | Signed in as `employee` | Viewing the Macro Process Catalog and E2E Process Registry tabs | Both are fully readable; no write control is present for any role |
| FR-M4-02 | Signed in as `practitioner` (not hierarchy-capable) | Viewing the RACSI Grid tab | The grid renders read-only; a `super_admin`/`group_admin`/`org_admin` sees it editable |
| FR-M4-03 | Viewing E2E-ERP (a "type" entry) | Opening its detail | Its linked Phase Template (TPL-ERP-8) and SIPOC supplier/customer lists resolve and display |
| FR-M5-01 | Signed in as `change_manager` | Creating a Charter, adding an Entry, editing both, then deleting the Entry | All operations succeed |
| FR-M5-02 | A Charter with status "Active" | Attempting to delete it, then setting status to "Retired" and retrying | First attempt is blocked with an explanatory message; retry after retiring succeeds, and only for Super/Group/Org Admin |
| FR-M5-03 | Any role | Viewing the Charter Action catalog or Mentoring Progression tab | No add/edit/delete control is present for either |
| FR-M5-04 | A logged Charter Action Log entry | Attempting to edit it in place, then deleting and re-logging it | No edit control exists; delete-then-relog succeeds |
| FR-M5-05 | A Charter Action with 5 logged compliance instances | Viewing the Action Mapping & Compliance tab, filtered to that charter | The 3 most recent instances show, plus "+2 more" |
| FR-M6-01 | Signed in as `change_manager` | Creating, editing, deleting, and reverting a version of an AI Use Case | All four operations succeed |
| FR-M6-02 | A use case activated for two Organizations and one project override | Deleting the use case | Its keys are removed from `aiOrgActivation` and `aiProjectOverride` for every Organization/project |
| FR-M6-03 | Signed in as `org_admin` | Toggling a use case off for the Organization | The use case stops producing new suggestions org-wide |
| FR-M6-04 | A use case active for the Organization | A `change_manager` sets a project override to "off" | That project's instances stop suggesting; sibling projects in the same org are unaffected |
| FR-M6-05 | A use case with a previously-accepted, human-approved suggestion on record | Deactivating the use case | The prior approved content remains visible; no new suggestions appear |
| FR-M6-06 | Any AI suggestion box, anywhere in the app | Rendered on screen | It carries the "AI-generated — review required" label |
| FR-M6-07 | A user accepts, edits, and rejects three different AI suggestions | Viewing the AI Usage Log | All three outcomes are recorded; none can be edited or deleted from the log |
| FR-M6-08 | A configured LLM provider API key | Exporting/inspecting the backend's persisted state, or triggering "Reset Demo Data" | The API key is absent from the exported/persisted state and survives the reset (browser-local only) |
| FR-M6-09 | An LLM provider configured with an invalid API key | Triggering any AI use case | The use case falls back to its built-in generator and completes without error |
| FR-M6-10 | An `employee` role with project-only visibility | Triggering an AI use case on a project they can see | The suggestion never surfaces data outside what that role could already see via RBAC |

**10.8.2 Change Management Program (M7–M22)**

| FR | Given | When | Then |
|---|---|---|---|
| FR-M7-01 | Signed in as `change_manager` | Editing `businessDriver` and clicking away (blur) | The field saves without a separate Save button |
| FR-M7-02 | `requireJustification` is on | Attempting to change `lewinPhase` with no justification text | Save stays disabled until justification text is entered |
| FR-M7-03 | A justified Lewin-phase change and an ADKAR score change on the same project | Viewing the Change Log | Both entries appear, each with old value, new value, module, date, and justification; neither is editable |
| FR-M7-04 | A project with ADKAR average 80%, sentiment score 60, training completion 70% | Viewing the Readiness Index | It computes to `80×0.5 + 60×0.25 + 70×0.25 = 72.5` |
| FR-M7-05 | Three Change Management Projects in one Organization, a `change_manager` scoped to only one | That user views the M7 portfolio table | Only their own project appears (RBAC-scoped), while an `org_admin` sees all three |
| FR-M8-01 | Signed in as a write-capable role | Adding, editing, and deleting a WBS task | All three succeed |
| FR-M8-02 | A Phase Checklist item | Toggling its done state, then attempting to edit its text | The toggle works; no other field is editable, matching the Create/Delete-only spec |
| FR-M8-03 | A recorded Phase Gate | Attempting to edit it, then deleting and re-recording it | No edit control exists; delete-then-re-record succeeds |
| FR-M8-04 | A Main Project of type "erp" with no WBS tasks yet | Clicking "Load Phase Template" with the default selection | TPL-ERP-8 is pre-selected; confirming seeds 8 skeleton PM-track tasks spaced from the chosen start date |
| FR-M8-05 | Signed in as `change_manager` (has `manageTemplates`) | Editing a Phase Template's phase text and reverting to a prior version | Both operations succeed independently of any project's own WBS data |
| FR-M8-06 | A task with baseline finish in the past and no actual finish recorded | Viewing the WBS table | The task shows a red "significant slip" gap badge, and the portfolio summary's "at risk" count includes it |
| FR-M8-07 | A framework-track task with baseline start = baseline finish | Viewing the Gantt chart | It renders as a marker, not a bar |
| FR-M8-08 | Tasks with phase labels matching two different P1–P7 mappings | Applying the P3 lifecycle filter | Only tasks (and checklist items, gates) auto-mapped to P3 are shown |
| FR-M8-09 | A project with a stalled ADKAR block and an open Divergence Alert | Opening the Phase Gate "Add" modal | `readinessIndexSnapshot`, `checklistCompletionPct`, and `openFlags` pre-fill from current live values |
| FR-M9-01 | Signed in as a write-capable role | Adding, editing, and deleting a stakeholder group | All three succeed |
| FR-M9-02 | A group with impact scores averaging 4.0 and influence 2 | Viewing the stakeholder table | It is flagged "High Impact / Low Influence" |
| FR-M9-03 | Impact cells at values 5, 3, and 2 | Viewing the table | They render red, amber, and neutral respectively |
| FR-M10-01 | `requireJustification` is on | Changing the Awareness block's score | Save is blocked until justification text is present; on save, both the block's history and the project Change Log record the change |
| FR-M10-02 | A block scored at 2 | Viewing the ADKAR panel | It shows an amber "stalled" badge and the auto-flag banner |
| FR-M10-03 | A logged coaching note | Attempting to edit or delete it from M10 | No such control exists (Create-only, a known gap) |
| FR-M10-04 | A stalled Desire block | Opening the Desire-diagnosis assistant | Step one produces a diagnosis citing Resistance Log/sentiment evidence; confirming offers a draft coaching script, each step requiring explicit Confirm/Discard |
| FR-M11-01 | `requireJustification` is on | Changing Bridges phase or sentiment stage | Both follow the same pending-value-plus-justification pattern as M10 |
| FR-M11-02 | A sentiment snapshot containing the word "excited" and no explicit `sentimentStage` set | Viewing the module | The inferred stage reads "commitment" (or the nearest matching keyword category); an unmatched snapshot defaults to "exploration" |
| FR-M11-03 | Knowledge = 4, Ability = 4, Bridges = "ending" | Viewing the module | A Divergence Alert banner appears, and M8's Phase Gate open-flags field reflects it |
| FR-M12-01 | An existing risk | Attempting to edit its category/description/likelihood/impact/owner | No such control exists; only `status` is changeable, via the justified-change flow (a known gap) |
| FR-M12-02 | A risk with no mitigation actions | Adding, updating the status of, and deleting a mitigation action | All three succeed |
| FR-M12-03 | A risk with likelihood 4, impact 3 | Viewing the risk table | Risk Score = 12, shown red (high-severity); the list is sorted by score descending |
| FR-M12-04 | Two other active CM Projects in the same Organization | Viewing the Risk Register | A saturation banner is shown |
| FR-M13-01 | `requireJustification` is on | Changing sponsor visibility | Follows the stage-then-justify pattern |
| FR-M13-02 | An existing sponsor action | Toggling done, then attempting to edit its text | Toggle works; no edit/delete control exists (a known gap) |
| FR-M13-03 | The Coalition Member table | Attempting to add, edit, or delete a member | No such control exists anywhere in M13 (a known gap) |
| FR-M13-04 | `sponsor.visibility = 'weak'` | Viewing M13 | A red alert banner appears, referencing M10's stalled Desire scores |
| FR-M14-01 | Signed in as a write-capable role | Adding, editing, deleting a communication | All three succeed |
| FR-M14-02 | Two other active CM Projects in the same Organization | Viewing the Communications log | A saturation banner is shown, matching M12's condition |
| FR-M14-03 | Signed in as `sponsor` (read-only role) | Clicking Export CSV on the Communications table | The export succeeds despite no write access |
| FR-M15-01 | Signed in as a write-capable role | Adding, editing, deleting a training record | All three succeed |
| FR-M15-02 | `requireJustification` is on | Toggling `certified` | Follows the stage-then-justify pattern, separate from the general edit modal |
| FR-M15-03 | M10 reports Knowledge = 2 for this project | Viewing M15 | A training-needs banner appears citing M10 as the gap source |
| FR-M16-01 | Signed in as `change_manager` (`canManage`) | Adding, editing, deleting a resistance-log entry | All three succeed |
| FR-M16-02 | An open resistance entry, `requireJustification` on | Advancing status to "in progress" | Follows the stage-then-justify pattern |
| FR-M16-03 | Signed in as `employee` | Submitting an anonymous concern | Submission succeeds; the same user cannot change status, classification, or delete any entry |
| FR-M16-04 | Two systemic-type entries logged | Viewing the Resistance Log | A red pattern-detection banner appears, pointing to M13 |
| FR-M16-05 | The org codebook | Adding a code, then attempting to edit its label | Add succeeds; no edit control exists (a known gap); a code tag can be added/deleted and optionally cross-linked to a resistance entry |
| FR-M16-06 | Three tags using code A, one using code B | Viewing the frequency rollup | Code A's bar renders larger, proportioned against the most-used code |
| FR-M17-01 | `requireJustification` is on | Changing Manager Readiness | Follows the stage-then-justify pattern; the ADKAR heatmap and coaching-note list show no add/edit/delete control regardless of the signed-in role |
| FR-M17-02 | A `people_manager` with 3 direct reports out of 40 project staff | Viewing the M17 heatmap | Only the 3 direct reports' data appears |
| FR-M18-01 | Signed in as a write-capable role | Adding, editing, deleting a journey event | All three succeed |
| FR-M18-02 | Two CM Projects in the same Organization, each with journey events | Switching the zoom selector to "Organization" | Events from both projects render on one chart |
| FR-M18-03 | Any user | Clicking "Share Snapshot" | A confirmation message appears; no file or link is actually produced |
| FR-M19-01 | Any role | Viewing Journeys, Touchpoints, Dashboards, Context Overlay tabs | No add/edit/delete control is present on any of them |
| FR-M19-02 | A write-capable role | Logging a touchpoint completion, then attempting to edit it, then deleting it | Log and delete succeed; no edit control exists |
| FR-M19-03 | 6 of JRN-01's touchpoints logged out of 6 total | Viewing DASH-01 | It computes and displays 100% |
| FR-M19-04 | 4 of 35 total Charter Actions logged for this project | Viewing DASH-02 | It computes the live percentage from `charterActionLog`, matching that ratio |
| FR-M19-05 | Viewing DASH-03, 04, 05 | No touchpoint/case data exists for these | They render as static reference cards, not live metrics |
| FR-M20-01 | A `change_manager` (project-scoped) and an `org_admin` viewing the same ungrouped Organization | Both open M20's level selector | The Change Manager sees only Project; the Org Admin sees Project and Organization but never Group |
| FR-M20-02 | A project's Readiness Index below its Lewin-phase reference band's low threshold | Viewing Benchmarking | Standing shows "Behind" |
| FR-M20-03 | Viewing the Cross-Type Matrix | For each of the 8 transformation types | Duration, terminal gate, external involvement, dominant framework, reversibility, and a seed-project link are all shown |
| FR-M20-04 | Any role | Clicking Export CSV on the Analytics heatmap or Benchmarking table | The export succeeds |
| FR-M20-05 | Any role, including write-capable ones | Viewing any M20 tab | No add/edit/delete control exists anywhere in the module |
| FR-M21-01 | The 30-day checkpoint, not yet recorded | Clicking "Record checkpoint" | An adoption rate is generated and `regressionRisk` derives from it per the stated thresholds; no manual field entry is offered |
| FR-M21-02 | An existing Quick Win | Attempting to edit or delete it | No such control exists (a known gap) |
| FR-M21-03 | A Lesson Learned with no `linkedRuleOrControl` | Adding a link value, then attempting to delete the lesson | Status flips to "applied" on adding the link; no delete control exists (a known gap) |
| FR-M21-04 | Sign-off is currently false | Toggling it | It flips to true/false with no other side effect beyond the boolean state |
| FR-M22-01 | Signed in as a write-capable role | Adding, editing, deleting a field note | All three succeed |
| FR-M22-02 | A field note tagged to M9 and M14 | Viewing the note | Both tags display as descriptive labels; no navigation or foreign-key behavior is implied |
| FR-M22-03 | Notes across 3 different categories | Filtering by "Decision" | Only Decision-category notes show, color-coded green |

**10.8.3 Cross-Cutting Requirements**

| FR | Given | When | Then |
|---|---|---|---|
| FR-X-01 | The Sponsor Coalition, Communications, Training, Risk Register, or Analytics tables | Clicking Export CSV | A CSV file downloads client-side, with no server round-trip |
| FR-X-02 | A table filtered/sorted to a subset of its rows | Exporting | The CSV contains exactly the filtered/visible rows and columns, respecting RBAC scope |
| FR-X-03 | A communications record containing French/Arabic accented text | Exporting and opening in Excel | Accented characters render correctly (UTF-8 BOM present) |
| FR-X-04 | An active project with at least one live alert condition true | Viewing the TopBar bell icon | The alert appears in a persistent, dismissible list |
| FR-X-05 | Each of the 9 live-computable conditions (Divergence Pattern, Critical Regression Risk, Sponsor Coverage Gap, Resistance Escalation, Change Saturation, Communication Overload, Phase Gate No-Go/Conditional, Guiding Coalition Gap, blocked Sustainment sign-off) | Its underlying data condition becomes true | The corresponding alert fires without a page reload |
| FR-X-06 | An active alert | Dismissing it, then reloading the page | It stays dismissed; a Restore control brings it back |
| FR-X-07 | Two open resistance entries becoming three | Viewing the Notification Center without any explicit save action | The Resistance Escalation alert appears automatically, confirming it is computed live, not stored |
| FR-X-08 | Any of the 7 non-live conditions (survey-exception retries, AI-confidence scoring, import integrity, account lock-out, GDPR SLA, AI provider fallback, Champion Coverage) | Any state change in the app | None of these 7 ever fire, by design |
| FR-X-09 | `requireJustification` on, an ADKAR/Lewin/Bridges/sentiment/sponsor-visibility/readiness/certification/resistance-status/risk-status change staged | Saving | The new value and justification are appended together, atomically, to the Change Log |
| FR-X-10 | `requireJustification` toggled off by an admin | Staging the same kind of change with no justification | Save succeeds without a justification note |
| FR-X-11 | A justification note is entered | Saving | journi accepts and stores the text verbatim; it performs no content validation against "evidence already observed" |

**10.8.4 Non-Functional Requirement Verification Notes**

| NFR | Verification approach |
|---|---|
| NFR-01 | Load the built bundle over a throttled connection profile; confirm first meaningful paint of the largest module view completes without a multi-second stall. |
| NFR-02 | Make 5 rapid successive edits to the same field within 400ms; confirm exactly one `PUT /api/state` fires, timed ~400ms after the last edit. |
| NFR-03 | Attempt `GET`/`PUT /api/state` directly (e.g. via curl) with no credentials; confirm the reference build accepts it — then confirm a rebuild targeting NFR-03 closure rejects it without a valid session/token. |
| NFR-04 | Confirm no TLS/rate-limiting/WAF behavior exists in the reference build's own process (these are expected to be infrastructure-layer, not application-layer). |
| NFR-05 | Send a `PUT /api/state` body missing required fields or with an invalid type; confirm the reference build stores it as-is (documenting the gap), and confirm a rebuild rejects it with `400`. |
| NFR-06 | Confirm no AI suggestion ever renders data outside the viewer's RBAC scope; confirm an exported/persisted state file never contains an LLM provider API key. |
| NFR-07 | Sign in as `sponsor`/`executive`; confirm ADKAR/sentiment views show aggregated data only, never an individual/cohort-level breakdown reserved for `ROLES_WITH_INDIVIDUAL_VISIBILITY`. |
| NFR-08 | Confirm `journi.db` is a single file with no replication configured in the reference build; document backup/retention as a deployment-owner responsibility. |
| NFR-09 | Open the same project in two browser tabs, edit the same field differently in each within the debounce window; confirm the reference build's last write silently wins, and confirm a rebuild against Section 5.2.2 returns `409 Conflict` on the losing write instead. |
| NFR-10 | Simulate a `better-sqlite3` native build failure (e.g. remove its prebuilt binary) on a machine with Node ≥ 22.5; confirm `npm install` still succeeds and the server starts on `node:sqlite`. |
| NFR-11 | Switch language to Arabic; confirm the Sidebar, every table, and the M18 Journey Map chart all mirror layout direction, not just text. |
| NFR-12 | Sample 5 different modules' status/severity badges of the same semantic meaning (e.g. "high severity"); confirm consistent color use across all 5. |
| NFR-13 | Load M17 on a narrow mobile-width viewport; confirm the layout remains usable without horizontal scrolling or unreadably small controls. |
| NFR-14 | On a fresh Windows VM with only Node.js 18 installed and no Visual Studio Build Tools, run `install.bat`; confirm it completes successfully. |
| NFR-15 | On a clean macOS or Linux machine, run `npm install && npm run build` in `journi/` and `npm install && npm start` in `server/` with no batch-file wrapper; confirm the app starts and serves correctly. |
| NFR-16 | Add a new module following the pattern in NFR-16's own text (new page + route + Sidebar entry + i18n keys + sub-collection wiring); confirm no existing module's behavior changes as a side effect. |
| NFR-17 | Change a module's displayed number in `translations.js` only (not its file name or route); confirm no other file requires a corresponding edit. |
| NFR-18 | Load the app in Chrome, Edge, and Firefox current-stable releases; confirm no console errors and consistent rendering across all three. |

### 10.9 Closing Notes

The module set and hierarchy described in this document are designed to scale from a single standalone Change Management Project run by one consultant, up to a multi-Organization Group portfolio managed by a central Center of Excellence, without changing the underlying data model. A rebuild team's practical next steps, in order: (1) stand up the target resource-oriented API (Section 5.2.2) and a persistence layer preserving the Section 4 field shapes, since every module's frontend logic assumes that shape; (2) rebuild the 22 module pages against Section 6's functional requirements and Section 10.7's visual reference, reusing the shared component/CRUD conventions in Section 3.2 rather than inventing per-module patterns; (3) seed reference/demo data from Sections 9 and 10.6 and localized strings from Section 10.5 for parity with the reference build; (4) verify against Section 10.8's test plan; (5) close the gaps in Section 10.3 opportunistically as each owning module is rebuilt, rather than as a separate pass; (6) treat Section 8.2's authentication gap as the first production-hardening item before any internet-facing deployment, implementing the auth routes and per-request authorization described in Section 5.2.2.

