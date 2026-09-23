# CortexPLM

Innovation lifecycle management for products and services: phase-gate projects on the Full, Light and Fast tracks, the 69-macro-process design reference, governance (business rules, COSO controls, risks, KPIs, RACSI, BPMN), governed AI and a data assistant, reports, multi-tenant administration, commercial packaging and SaaS/OnPrem licensing. English, French and Arabic (right-to-left).

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

`npm run seed` creates the demonstration data (6 organizations, 126 projects, at least 10 instances of every E2E process per industry). Run it again at any time to reset the data.

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

Domains: metrocity.example (Public Sector), cedarline.example (Manufacturing in Construction), meridale.example (Healthcare), valdora.example (Agro-Business – Dairy), orvane.example (Transportation), kestrel.example (Oil, Gas & Energy).

## Other commands (server folder)

| Command | Purpose |
|---|---|
| `npm start` | Start without watching for file changes |
| `npm test` | Tenant isolation tests |
| `npm run keys` | Generate a vendor key pair for OnPrem licences |
| `npm run sign-licence` | Sign an OnPrem licence file |

Settings are optional: copy `server/.env.example` to `server/.env` to change the port, secret, SMTP mail server or licensing mode.

## Documentation

- Installation Guide and User Guide (Word and PDF) are delivered with the application.
- `docs/COVERAGE_CHECKLIST.md` maps every source document to the application.
- `docs/tools` regenerates the guides: `run-scenarios.mjs` replays the five User Guide walkthroughs against a freshly seeded server.
