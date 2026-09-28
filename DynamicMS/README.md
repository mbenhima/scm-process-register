# DynamicMS — Integrated Management System

DynamicMS runs the whole lifecycle of a management system (QMS or QHSE): 12 end-to-end phases, 162 macro processes and 1,572 workflow steps. Each step has its own input form. The platform also handles gates and checklists, governance (rules, COSO controls, risks, RACSI, KPIs), records (nonconformities, actions, audits, documents, registers), alerts, AI use cases with a human checkpoint, reports, portfolio and benchmarking. It works in English, French and Arabic (right to left).

## Quick start

Requirement: Node.js 22.13 or later. The built-in `node:sqlite` module is the database, so no database server is needed.

```bash
cd server
npm install
npm run seed      # creates data/dynamicms.db: 60 organizations, 120 full-run projects, 84,603 steps
npm run dev       # API on http://localhost:4000

cd ../web
npm install
npm run dev       # open http://localhost:5173
```

Sign in with `quality@horizon-universal.example`, `ims@atlas-sme.example` or `quality@nova-aec.example`. The password for every organization account is `Demo@2026`. The platform administrator is `admin@dynamicms.example` with password `Admin@2026`.

## Demonstration data

| Tenancy | Organizations | Projects |
|---|---|---|
| Horizon Industrial Group | 29 large companies (one per vertical) + Horizon Universal Holdings | QMS and QHSE full runs each |
| Nova SME Alliance | 29 SMEs (one per vertical) | QMS and QHSE full runs each |
| Independent | Atlas Universal SME | QMS and QHSE full runs |

Each organization has 19 accounts named `role@domain`: ims, quality, hse, risk, compliance, audit, hr, documents, it, operations, performance, esg, transformation, process, admin, ceo, employee, aigov and auditor. All names and texts are fictional and exist in the three languages.

## Structure

- `server/`: Express REST API, SQLite schema and migrations, catalog builder, full-run seed generator, reports (PDF, Excel, Word, CSV), AI engine (rules plus retrieval, no external provider), backups, licence tools and tests (`npm test`).
- `web/`: React + Vite client. It uses design tokens in `src/styles/tokens.css`, a navigation shell that can be docked on any edge, and bundled fonts.
- `tools/`: extraction of the source documents, translation tables, screenshot and document generators.
- `docs/sources/`: the five source documents.
- `deliverables/`: installation guide, user guides, presentations (EN, FR), coverage checklist and the application zip.

## Production

```bash
cd web && npm run build
cd ../server && JWT_SECRET=<long random value> NODE_ENV=production npm start   # serves the API and the web client on port 4000
```

See `deliverables/DynamicMS_Installation_Guide.pdf` for configuration, backups, on-premises licensing and troubleshooting.
