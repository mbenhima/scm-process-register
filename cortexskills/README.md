# CortexSkills

Training engineering platform: 33 end-to-end processes in seven phases, from the scope of work to the evaluation of results, for large companies and SMEs in 29 sectors, in English, French and Arabic.

## What is new in 1.10

- **Process design management**: your organization's copy of the reference design, with naming rules in three languages, versions, compare and restore, usage, retire, releases published by a second person, export/import (JSON, Excel, BPMN).
- **Typed step forms**: every step asks for what it produces (records, matrices, objectives, plans, decisions, reviews…), in inline tables with autosave, Undo, spreadsheet paste and a Row Editor; completed steps feed the project registers.
- **Organization (OBS)**: functions, roles, dated assignments, views on any date, organization chart and role-based RACSI with one Accountable per step.
- **Documented information**: 37 templates, organization layout, sections and overrides, versions, two-person publication, master list and the documents each standard requires; Word, PDF and Excel.
- **AI**: twelve-field prompt specifications per use case, organization model settings with a sealed key and an exact connection test.
- **Project template blueprints, audits with graded findings, attachment versions, search filters, retention and anonymized questionnaires.**
- **Design system**: SRS v1.10 tokens with the POWERACT Graphical Chart values, bundled fonts, data tables, charts and system states; tested at 390–1280 px and in English, French and Arabic.
- **Demonstration data**: 59 organizations (a large company and an SME in each of 29 sectors, plus the multi-sector Horizon Services Group), each with two complete runs.

## What was new in 1.1

- **Questionnaires (IF-PAC)**: General Manager, Management and Team member forms; choose who responds and the channel to respond (Face-to-Face, E-mail, WhatsApp, Application or a Combination in sequence); consent, offline capture, completeness and consolidation into the needs analysis.
- **E-mail and WhatsApp channels**: SMTP and WhatsApp Business Cloud API per organization, encrypted secrets, test, outbox, retries and delivery webhooks; sandbox when no provider is set.
- **Training plan**: programs, trainings (level, ID, name, objectives, duration, prerequisites), half-day agendas of lectures, quizzes and workshops, and the value proposition per persona. Golden rules: one quiz and one workshop per half-day.
- **Training Engineering Report**: generated from the data, checked, published by a second person, in Word, PDF and Excel.
- **Global search** (Ctrl+K) and traceability against SRS v1.6.

E-mail and WhatsApp settings are described in the Installation Guide, section 9.1.

## Start in three steps

You need **Node.js 22.13 or newer** (free, from https://nodejs.org — choose the LTS version).

**1. Server** — open a terminal in the `server` folder:

```
npm install
npm run seed
npm run dev
```

**2. Web application** — open a second terminal in the `web` folder:

```
npm install
npm run dev
```

**3. Open** http://localhost:5173 and sign in.

| Account | E-mail | Password |
|---|---|---|
| Platform administrator | admin@cortexskills.app | Admin#2026 |
| Head of L&D, large company (automotive) | headld@atlasmotorskenitra.ma | CortexSkills#2026 |
| Head of L&D, SME (automotive) | headld@tangerautoparts.ma | CortexSkills#2026 |
| Head of L&D, SME (construction) | headld@soussbtpsolutions.ma | CortexSkills#2026 |
| Head of L&D, SME (healthcare) | headld@cliniquealamal.ma | CortexSkills#2026 |

`npm run seed` erases all data and recreates the demonstration data: run it only the first time, or when you want to start again. Next time, just run `npm run dev` in each folder.

See the Installation Guide and the User Guide (Word and PDF) for details.

## Other commands (server folder)

| Command | Purpose |
|---|---|
| `npm start` | Production mode; serves the built web application (`npm run build` in `web`) on http://localhost:4000 |
| `npm test` | Cross-tenant and security tests (run after `npm run seed`) |
| `npm run backup` | Backup now (automatic backups run daily, kept 14 days) |
| `npm run sign-licence` | Produce a signed licence file for an on-premises installation |

Settings go in `server/.env` (PORT, DEPLOYMENT_MODE=saas|onprem, DATA_DIR, JWT_SECRET, LICENSE_HMAC_SECRET, BACKUP_RETENTION_DAYS, CORS_ORIGIN).
