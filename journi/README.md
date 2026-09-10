# journi

*the human side of change, mapped as a journey*

journi is a dedicated human change management application that sits alongside — but operates independently of — an organization's project delivery tools. Where a PMO tool tracks tasks and dates, journi tracks people: their awareness, desire, knowledge, ability and reinforcement (ADKAR), their emotional transition through the change (Bridges, Kübler-Ross), and the organizational conditions around them (Kotter's coalition and communication practices, Lewin's Unfreeze-Change-Refreeze macro-state).

This build implements the full functional specification: the three-level Group → Organization → Project hierarchy, RBAC scoped to that hierarchy, English/French/Arabic localization with full RTL mirroring, all seventeen functional modules, and a governed AI Use Case Library (Assistive/Augmented only — no autonomous AI), seeded with the nine illustrative cases from the spec across Manufacturing, Logistics & Transportation, and Health.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL and pick any demo persona on the login screen — no password required. Each persona is pre-scoped to a realistic role/Group/Organization/Project combination (Super Admin, Group Admin, Organization Admin, Sponsor, Change Manager, People Manager, Employee, Executive Viewer) so you can see how RBAC changes what's visible.

```bash
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## What this is (and isn't)

This is a self-contained frontend implementation: all data — the seeded organizations, projects, ADKAR scores, communications, AI activation state — lives in browser `localStorage`, seeded fresh from `src/data/` on first load. There is no backend/API; every module is fully interactive (add/edit records, score ADKAR blocks, toggle AI use cases, etc.) against that local state, which is exactly what the spec's data model calls for, just without a server behind it yet. "Reset demo data" can be added trivially by clearing `localStorage` (`journi.state.v1`).

## Architecture

```
src/
├── data/
│   ├── constants.js        # Enums: roles, ADKAR blocks, Bridges/Kübler-Ross/Lewin stages, risk types...
│   ├── aiUseCases.js       # Module 16 catalog — 14 seeded Assistive/Augmented use cases
│   ├── seed.js             # Combines everything into the initial app state
│   └── cases/
│       ├── atlas.js        # Manufacturing sector — Atlas Industrial Group (3 cases)
│       ├── maghreb.js      # Logistics sector — Maghreb Logistics Hub (3 cases)
│       └── meridia.js      # Health sector — Meridia Health Network (3 cases)
├── state/
│   └── AppStateContext.jsx # Global state (React context + hooks), localStorage-persisted
├── i18n/
│   ├── translations.js     # EN/FR/AR dictionary
│   └── index.jsx           # Language context, sets document dir="rtl" for Arabic
├── utils/
│   ├── rbac.js              # Role → scope → visibility rules
│   ├── compute.js           # Readiness Index, escalation, divergence, risk scoring
│   └── useScoped.js         # Hooks for "current org/project" from the top-bar scope switcher
├── components/              # Layout, Sidebar, TopBar, AiSuggestionBox, shared widgets
└── pages/                   # One page per module (Dashboard + M1, M2, M3–M16)
```

### Organizational hierarchy (Module 1)

`Group (optional) → Organization → Projects`, where Projects split into **Main Projects** (the underlying business initiative — ERP, automation, QMS, etc.) and **Change Management Projects** (the people-side initiative, carrying ADKAR/sentiment/communications/training/resistance/sustainment data). A CM Project may link to zero or one Main Project, or stand alone.

### RBAC (Module 2)

Role × Scope (Group/Organization/Project) determines visibility everywhere — `src/utils/rbac.js` centralizes this so every page (Dashboard, M3, M14, etc.) filters portfolio data through `visibleOrganizations`/`visibleProjects` rather than each page inventing its own rule. M1 (Hierarchy) and M2 (Identity & RBAC) are additionally route-guarded to admin roles.

### AI governance (Module 16)

Every AI-touching feature across the other modules routes through `<AiSuggestionBox>`, which:
- refuses to render an active suggestion unless the use case is activated for the current Organization (or Project-level override),
- always labels output "AI-generated — review required,"
- requires an explicit human Accept / Edit / Reject before anything is written back to the record, and
- logs every decision to the AI usage/override audit trail (visible in M16 → AI Usage & Override Log).

No use case can take an irreversible action on its own — matching the spec's Assistive/Augmented-only, human-in-the-loop design.

### Localization

Language is switchable per-session from the top bar or login screen without losing state. Arabic sets `dir="rtl"` on `<html>`; layout uses logical Tailwind utilities (`ps-`, `pe-`, `text-start`, etc.) so the sidebar, tables, and journey map genuinely mirror rather than just flipping text direction.

## Seed data

Nine cases (3 sectors × 3 project archetypes) are seeded from the specification: Atlas Industrial Group (Manufacturing), Maghreb Logistics Hub (Logistics & Transportation), and Meridia Health Network (Health), each with an ERP Implementation, a Process Automation, and a QMS Implementation case — matching ADKAR baselines, risks, sponsor coalitions, and pre-activated AI use cases as described in Section 6 of the specification.

## Tech stack

React 18 + React Router 6 + Vite 5 + Tailwind CSS 3. No backend dependency, no external API keys required.
