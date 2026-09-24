# CortexPLM

Innovation lifecycle management for products and services: groups, organizations and projects (tenancy), a portfolio overview across E2E processes, phase-gate projects on the Full, Light and Fast tracks with a checklist template library and task attachments, internal benchmarking (within an organization and across its group), the 69-macro-process design reference, governance (business rules, COSO controls, risks, KPIs, RACSI, BPMN), governed AI and a data assistant, reports, multi-tenant administration, commercial packaging and SaaS/OnPrem licensing. English, French and Arabic (right-to-left).

## Requirements

- Node.js **22.13 or newer** (LTS from https://nodejs.org). No database server is needed: the server uses the SQLite engine built into Node.js.
- A recent browser (Chrome, Edge or Firefox).

## Start

Two command windows are needed.

**Window 1, `server` folder**

```
npm install
npm run seed
npm run dev
```

`npm run seed` creates the demonstration data (7 organizations in 7 sectors, 147 projects, at least 10 instances of every E2E process per organization). Two groups let their organizations benchmark against each other; two organizations are independent. Run it again at any time to reset the data.

**Window 2, `web` folder**

```
npm install
npm run dev
```

Open http://localhost:5173.

## Sign in

| Account | E-mail | Password |
|---|---|---|
| Platform administrator | admin@cortexplm.example | Admin#2026 |
| Demo users | `<user>@<domain>` | Demo#2026 |

Users: exec, board1, board2, pm1, pm2, portfolio, engineering, operations, quality, compliance, legal, finance, procurement, marketing, service, technician, sustainability, data, process, admin, training, supplier, customer, auditor.

| Domain | Sector | Group |
|---|---|---|
| metrocity.example | Public Sector | Independent |
| cedarline.example | Manufacturing | Atlas Infrastructure Holding |
| meridale.example | Healthcare | Independent |
| valdora.example | Agro-Business – Dairy Products | Crescent Agro-Energy Group |
| orvane.example | Transportation | Atlas Infrastructure Holding |
| kestrel.example | Oil, Gas & Energy | Crescent Agro-Energy Group |
| ridgeway.example | Real Estate Development | Atlas Infrastructure Holding |

## Create your own group, organization and projects

Sign in as the platform administrator and open **Portfolio > Groups, organizations & projects**: add a group (or none), add an organization with its starting team (one account per role, `role@your-domain`, initial password of your choice), then sign in as `pm1@your-domain` and create projects. The User Guide walks through six complete examples.

## Other commands (server folder)

| Command | Purpose |
|---|---|
| `npm start` | Start without watching for file changes |
| `npm test` | Tenant isolation, benchmarking, group portfolio scope, checklist templates, attachments and organization provisioning (17 tests) |
| `npm run backup` | Write a dated database copy to data/backups (one is also made daily) |
| `npm run keys` | Generate a vendor key pair for OnPrem licences |
| `npm run sign-licence` | Sign an OnPrem licence file |

Settings are optional: copy `server/.env.example` to `server/.env` to change the port, secret, SMTP mail server or licensing mode.

## Documentation

- Installation Guide and User Guide (Word and PDF) are delivered with the application.
- `docs/guides/Dynamic_Apps_Standard_SRS_v1.2` (Word/PDF) is the suite standard updated with the generic capabilities proven here; `docs/tools/update_srs.py` (1.1) then `update_srs_v12.py` (1.2) rebuild it.
- `docs/COVERAGE_CHECKLIST.md` maps every source document to the application; the SRS Gap Analysis (Word/PDF) assesses each SRS requirement.
- `docs/tools/bpmn-roundtrip.mjs` and `docs/tools/replay-module-scenarios.mjs` re-run the BPMN and User Guide checks.
- `docs/tools` regenerates the guides: `run-scenarios.mjs` replays the six User Guide walkthroughs (each creates its group and organization first) against a freshly seeded server, and `replay-module-scenarios.mjs` checks the module scenarios.
