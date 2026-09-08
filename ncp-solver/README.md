# NCP Solver

A full-stack **Non-Conformity & Problem Resolution** platform, built from the NCP Solver
project scope, definition & design (PDD), information model, and knowledge-base
documents. It implements the complete E1→E7 resolution workflow, role-based access
control, multi-tenant hierarchy, an organizational breakdown structure, a RAG-powered
Capitalization Library, an AI Use Cases Library, and governance/licensing administration —
seeded with realistic simulated non-compliance data across four industry sectors.

## Stack

- **Backend**: Node.js + Express + `better-sqlite3` (single-file relational DB, zero
  external services required). JWT auth, bcrypt password hashing, a permission-catalog
  RBAC layer, and a dependency-free TF-IDF/cosine-similarity RAG engine standing in for a
  vector-DB + embedding pipeline (see `server/src/services/rag.js` and `aiAgents.js`).
- **Frontend**: React 18 + Vite + Tailwind CSS, styled to the POWERACT Consulting
  graphical chart (orange `#F8931D` primary, Cambria/Calibri type, RAG status scale, card
  layout). Custom EN/FR/AR i18n context with full RTL support for Arabic.

## Getting started

```bash
# Terminal 1 — API (auto-seeds a fresh SQLite DB on first run)
cd server
npm install
npm run dev        # http://localhost:4000

# Terminal 2 — Web app
cd web
npm install
npm run dev         # http://localhost:5173 (proxies /api to :4000)
```

To wipe and reseed demo data at any time: `cd server && npm run seed`.

**Demo login** — password for every seeded account: `Ncp#2026Demo`. The login screen
lists one account per seeded organization (e.g. `cipilot@solaris.ncpsolver.demo`); each
organization also has `admin@`, `quality@`, `team1@`/`team2@`, `owner1@`/`owner2@`,
`evaluator@`, `depthead@`, `reporter@`, and `auditor@` accounts covering all 9 standard
roles.

## Seeded scenario

- **Independent companies** (no group): National Infrastructure Authority (Public Sector
  – Infrastructure), Solaris Precision Manufacturing, GreenValley AgroBusiness Co.,
  Horizon Real Estate Developers.
- **Group of companies**: Meridian Group Holding, with three subsidiaries — Meridian
  Industrial Manufacturing, Meridian AgroBusiness, Meridian Real Estate Development —
  demonstrating the optional Group → Organization → Project hierarchy.

Each organization is seeded with its own OBS (site/department tree), standards, license &
governance settings, an AI Use Cases Library, and 6 realistic non-conformity fiches
spanning the full E1–E7 lifecycle (open, mid-workflow, and closed-with-REX) so the
Capitalization Library RAG search, KPIs, and alerts all have real data to work with.

## Modules

| Module | Notes |
|---|---|
| Dashboard | Role-aware KPI tiles, recent fiches, unread alerts, department chart |
| NCP Fiches | Full E1–E7 workflow: understanding (5W2H), immediate/corrective actions, root causes (6M), REX/capitalization, AI-agent suggestions |
| My Actions | Action Owner (RR) / Evaluator (RE) task queues |
| Capitalization Library | RAG semantic search over closed fiches |
| Standards | Standards knowledge base (ISO, internal procedures) |
| AI Use Cases Library | Full CRUD, RBAC-gated, independent of the NCP capitalization library |
| Reports | The 4 standard reports (Operational, Action Plan, Strategic Scorecard, Capitalization Log) + 10 KPIs |
| Alerts | Alerts A–J, computed by the rule-based Monitoring Agent |
| Hierarchy | Group (optional) → Organization → Project (optional) |
| OBS | Organizational breakdown structure (site/department/service/team tree) |
| Users & Scope | User directory + role assignment |
| Permission Matrix | Full role × permission grid (9 roles, ~50 permission codes) |
| Governance Settings | KPI thresholds, alert toggles, default RCA method, REX-before-close policy |
| License & Plan | SaaS/OnPrem, plan tier, seats, billing cycle |

## Notes on the "AI" layer

There is no external LLM API call in this build (no key is configured in this
environment). The 8 AI agents described in the NCP Solver Knowledge Base are implemented
as deterministic, explainable, RAG-grounded services (`server/src/services/aiAgents.js`):
keyword/rule-based classification, TF-IDF similarity search over the tenant's own closed
fiches for containment/root-cause/action suggestions, and template-based REX drafting.
Every suggestion is logged to `ai_agent_logs` with a confidence score, exactly as the
information model's `AIAgentLog` entity specifies, so the mechanism can be swapped for a
real LLM/vector-DB call later without changing the API contract.
