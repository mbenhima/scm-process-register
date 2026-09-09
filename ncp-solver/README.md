# NCP Solver — DynamicMS Suite

A full-stack **Non-Conformity & Problem Resolution** platform, built from the NCP Solver
project scope, definition & design (PDD), information model, and knowledge-base
documents. It implements the complete E1→E7 resolution workflow on an **NCP Sheet**
(the non-conformity/problem record — called "NCP Fiche" in the source specification),
role-based access control, multi-tenant hierarchy, an organizational breakdown structure,
a RAG-powered Capitalization Library, an AI Use Cases Library, and governance/licensing
administration — seeded with realistic simulated non-compliance data across four industry
sectors.

## Stack

- **Backend**: Node.js + Express + Node's built-in `node:sqlite` module (single-file
  relational DB, zero external services and zero native/compiled dependencies — nothing to
  build). JWT auth, bcrypt password hashing, a permission-catalog RBAC layer, and a
  dependency-free TF-IDF/cosine-similarity RAG engine standing in for a vector-DB +
  embedding pipeline (see `server/src/services/rag.js` and `aiAgents.js`).
- **Frontend**: React 18 + Vite + Tailwind CSS, styled to the POWERACT Consulting
  graphical chart (orange `#F8931D` primary, Cambria/Calibri type, RAG status scale, card
  layout). Custom EN/FR/AR i18n context with full RTL support for Arabic.

## Requirements

- **Node.js 22.5 or newer** (Node 22 LTS recommended; Node 24 also works) and npm — check
  with `node --version`. Download from [nodejs.org](https://nodejs.org) if needed. This is
  the *only* requirement: the database layer (`node:sqlite`) is built into Node itself, so
  there is nothing to compile and no C/C++ build toolchain, Visual Studio, or Xcode Command
  Line Tools is ever needed — `npm install` only downloads plain JavaScript packages.
- No database server, Docker, or external API key is required — everything runs locally.

## Installation

1. **Unzip** the project archive, then open a terminal in the extracted `ncp-solver/`
   folder (it contains a `server/` and a `web/` subfolder).

2. **Install and start the backend API** (Terminal 1):

   ```bash
   cd server
   npm install
   npm run dev
   ```

   On first run this automatically creates a local SQLite database
   (`server/data/ncp-solver.sqlite3`) and seeds it with the full demo scenario. You should
   see `NCP Solver API listening on http://localhost:4000`.

3. **Install and start the web app** (Terminal 2, new tab/window, same project root):

   ```bash
   cd web
   npm install
   npm run dev
   ```

   Vite will print a local URL — open **http://localhost:5173** in your browser (the dev
   server proxies `/api` requests to the backend on port 4000, so both must be running).

4. **Log in** with any seeded demo account — password `Ncp#2026Demo` for every account
   (see below). The login screen lists one account per seeded organization; click one to
   fill it in automatically.

That's it — no build step, database setup, or configuration file is required for local
use. To stop either server, press `Ctrl+C` in its terminal.

### Resetting the demo data

To wipe and reseed fresh demo data at any time (useful after experimenting with the app):

```bash
cd server
npm run seed
```

### Running a production build of the web app

```bash
cd web
npm run build      # outputs static files to web/dist/
npm run preview    # serves the production build locally for a quick check
```

For a real deployment, serve `web/dist/` from any static host/CDN and run the `server/`
API behind it (e.g. via `npm start` in `server/`, with a process manager like `pm2`), or
place a reverse proxy in front of Express to serve both the API and the built frontend.
Set `JWT_SECRET` and `PORT` environment variables in production (see `server/src/middleware/auth.js`
and `server/src/index.js`).

### Troubleshooting

- **Port already in use**: another process is using 4000 or 5173. Stop it, or set
  `PORT=4001 npm run dev` for the API (and update `web/vite.config.js`'s proxy target to
  match).
- **`Invalid email or password` on every login attempt**: this almost always means the demo
  data was never seeded (or `npm install` in `server/` never completed). Re-run
  `npm install` in `server/` and watch for errors, then `npm run seed`, and confirm you see
  `Seed complete.` before retrying the login.
- **`node:internal/... SQLite is an experimental feature` warning**: harmless — `node:sqlite`
  prints this on every start. If instead you get an error saying `node:sqlite` cannot be
  found, your Node.js version is older than 22.5; upgrade Node (see Requirements above).
- **Blank page / API errors in the browser console**: confirm the backend terminal shows
  "listening on http://localhost:4000" before opening the web app.

## Demo accounts

Password for **every** seeded account: `Ncp#2026Demo`. Each seeded organization has one
account per standard role: `admin@`, `quality@`, `cipilot@`, `team1@`/`team2@`,
`owner1@`/`owner2@`, `evaluator@`, `depthead@`, `reporter@`, and `auditor@`, e.g.
`cipilot@solaris.ncpsolver.demo`.

## Seeded scenario

- **Independent companies** (no group): National Infrastructure Authority (Public Sector
  – Infrastructure), Solaris Precision Manufacturing, GreenValley AgroBusiness Co.,
  Horizon Real Estate Developers.
- **Group of companies**: Meridian Group Holding, with three subsidiaries — Meridian
  Industrial Manufacturing, Meridian AgroBusiness, Meridian Real Estate Development —
  demonstrating the optional Group → Organization → Project hierarchy.

Each organization is seeded with its own OBS (site/department tree), standards, license &
governance settings, an AI Use Cases Library, and 6 realistic NCP Sheets spanning the full
E1–E7 lifecycle (open, mid-workflow, and closed-with-REX) so the Capitalization Library RAG
search, KPIs, and alerts all have real data to work with.

## The NCP Sheet — full E1→E7 process coverage

Every NCP Sheet detail page exposes all seven process stages as dedicated tabs, each wired
to the stage-appropriate AI agent from the Knowledge Base (KB-010):

| Tab | Stage | What it covers | AI Agent |
|---|---|---|---|
| E1 - Detail | Detection & Registration | Header fields, criticality/priority, detector, NCP team | Classification Agent (criticality/priority suggestion + similar past sheets) |
| E2 - Understanding | Problem Understanding | 5W2H / QQOQCCP structured analysis | Problem Structuring (via 5W2H form) |
| E3 - Immediate Actions | Immediate Containment | Create, execute, evidence, effectiveness evaluation | Containment Advisor (suggests actions from similar past sheets) |
| E4 - Root Causes | Root Cause Analysis | 6M-categorized root causes, RCA method | Root Cause Mining (suggests probable causes) |
| E5 - Corrective Action Plan | Corrective Action Plan | Define actions linked to root causes (planning only) | Action Recommendation (proven corrective actions for similar causes) |
| E6 - Execution & Evaluation | Execution & Monitoring | Mark actions done, upload evidence, record RR/RE effectiveness verdict | Monitoring & Alert Agent (via the Alerts module, always on) |
| E7 - Capitalization (REX) | Capitalization | Lessons learned, standardization/generalization decisions | REX Generation Agent (auto-drafts the narrative) |

Advancing a sheet through the stages, closing it (REX required by default — configurable
in Governance Settings), team assignment, and the RR/RE separation rule (an evaluator can
never be the same person as the action owner) are all enforced server-side.

## Modules

| Module | Notes |
|---|---|
| Dashboard | Role-aware KPI tiles, recent NCP sheets, unread alerts, department chart |
| NCP Sheets | Full E1–E7 workflow — see table above |
| My Actions | Action Owner (RR) / Evaluator (RE) task queues |
| Capitalization Library | RAG semantic search over closed NCP sheets |
| Standards | Standards knowledge base (ISO, internal procedures) |
| AI Use Cases Library | Full CRUD, RBAC-gated; versioned edit history (default v1, labeled sections, revert to any version) |
| Reports | The 4 standard reports (Operational, Action Plan, Strategic Scorecard, Capitalization Log) + 10 KPIs |
| Alerts | Alerts A–J, computed by the rule-based Monitoring Agent |
| Hierarchy | Group (optional) → Organization → Project (optional) |
| OBS | Organizational breakdown structure (site → department → service → team); every node shows linked-item counts (people, sheets, business rules, controls, risks, RACSI activities) |
| Users & Scope | User directory + role assignment, scoped to an OBS node |
| Permission Matrix | Full role × permission grid (9 roles, ~55 permission codes) |
| Business Rules | Full CRUD, RBAC-gated; validation/workflow/approval/naming/threshold/escalation rules with severity, owned by an OBS unit |
| Controls | Full CRUD, RBAC-gated; COSO Internal Control – Integrated Framework (5 components), type/frequency/effectiveness tracking |
| Risks & Opportunities | Full CRUD, RBAC-gated; 5×5 likelihood × impact matrix, linked Controls, inherent/residual scoring |
| RACSI Matrix | Full CRUD, RBAC-gated; Responsible/Accountable/Consulted/Support/Informed per NCP process step (E1–E7) or per Business Rule/Control/Risk record; assignees are OBS roles or named people; exactly one Accountable enforced client- and server-side |
| Governance Settings | KPI thresholds, alert toggles, default RCA method, REX-before-close policy |
| License & Plan | SaaS/OnPrem, plan tier, seats, billing cycle |
| Help | In-app, searchable multi-language user guide covering every module |

## Notes on the "AI" layer

There is no external LLM API call in this build (no key is configured in this
environment). The 8 AI agents described in the NCP Solver Knowledge Base are implemented
as deterministic, explainable, RAG-grounded services (`server/src/services/aiAgents.js`):
keyword/rule-based classification, TF-IDF similarity search over the tenant's own closed
sheets for containment/root-cause/action suggestions, and template-based REX drafting.
Every suggestion is logged to `ai_agent_logs` with a confidence score, exactly as the
information model's `AIAgentLog` entity specifies, so the mechanism can be swapped for a
real LLM/vector-DB call later without changing the API contract.
