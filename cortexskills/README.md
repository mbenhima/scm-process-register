# CortexSkills

Training engineering platform: 33 end-to-end processes in seven phases, from the scope of work to the evaluation of results, for large companies and SMEs in 29 sectors, in English, French and Arabic.

## What is new in 1.13

- **Steps that work on real data** (E2E-32 scope and E2E-33 questionnaire campaign): each step has a typed form with lists wherever possible (group yes/no, organization, sector, decision levels, orientation all/digital/AI/custom), and every list accepts a custom value. Stakeholders typed at MP-53.8 (name, e-mail, phone, role, function, level, site, preferred channel, category, description, owner, source) become the questionnaire's respondents.
- **Questionnaire campaign inside the tasks**: MP-54.1 creates the questionnaire from the chosen templates; MP-54.2 shows, edits and tailors its questions (AI questions must be validated at MP-54.3); MP-54.4 is a RACSI table (role, R, A, C, S, I, sections) with exactly one A per section; MP-54.5 sets the channels per decision level (MS/MO/OP, several channels) and the reminder cadence; MP-54.6 to 54.11 distribute by e-mail or WhatsApp, send reminders, collect the answers from each respondent's link, consolidate them and feed the needs analysis.
- **Documents in the steps**: MP-53.10 and MP-54.12 generate the specification (DT-E2E-32 with report RPT-033) and the campaign report (DT-E2E-33 with RPT-034), with versions and DOCX/PDF/XLSX downloads; each task has a Documents tab.
- **Task flow**: Previous/Next task buttons, "Task N of M", the task result pre-filled from the step entries and editable, the next owner notified, enabler processes that wait for their gate (E2E-17 after G3).
- **New projects**: fields in the order Name, Focus, Description, Template; the template list covers the whole library (own, sector, universal); the gates' checklists are attached at creation; the simple-path template (six processes) is honoured.
- **HRIS sync**: CSV upload or inbound records with field mapping, a report of created/updated/rejected rows.
- **Fixes**: first click on a list now saved; option labels and dates shown in read-only views; "{variables}" error of the prompt test; object names of the steps; Office files cleaned (no directory entries) for strict readers.
- **Conformity check**: `tools/qa/run-checks.mjs` and `tools/qa/srs-check.mjs` check the 636 requirements of SRS v1.9.

## What is new in 1.12

- **AI use case library** (SRS 4.4 and 4.40) on one page: figures (use cases, active ones, custom ones against the Solution Pack quota, prompt completeness, tasks supported by AI), the library filtered by tier, state and origin, and the **coverage of the process design** — every task with the use cases that support it, and a draft use case suggested for a step that has none. A dedicated form creates and edits a use case in English, French and Arabic, with its primary step and further links to steps, tasks, macro processes or end-to-end processes; custom use cases are duplicated or deleted, standard ones are deactivated. Each use case opens on its full page: identification, link to the process, Prompt Specification, assembled prompt, versions and usage.
- **Governed AI on the steps**: a step proposes rows only through the AI use case linked to it, with its tier, the engine that answered and why the live model was not used, the sources it relied on and a link to the prompt; each proposal is accepted, edited or rejected and logged with the specification version. Existing databases are completed at the first start (stored module, trigger, expected output, links, prompt examples).
- **Bulk entry grid** for every multi-record table — virtual rows for thousands of rows, sort, reorder, filters, rows with errors, undo and redo, fill down, duplicate and delete of the selection, totals, CSV and Excel export, a five-stage **import** from Excel, CSV or a paste with column mapping, in-place corrections and Undo, batched saving with progress, Cancel and Resume, browser drafts restored after a refresh, edit conflicts detected, an offline queue, a guard when leaving with unsaved rows, and a list view on phones. See [web/BULK_ENTRY.md](web/BULK_ENTRY.md) (architecture note, shortcuts, exit flow, import, drafts, paging).
- Settings: `IMPORT_MAX_BYTES` (5 MB), `IMPORT_MAX_ROWS` (10,000) and `IMPORT_BATCH` (250).

## What is new in 1.11 (Standard Application SRS v1.8)

- **Full-Screen Entry Workspace** for every multi-record table — step tables, record lists, registers, the permission and RACSI matrices and the design editors: the Expand icon (or Ctrl/Cmd+Shift+F) opens the same table over the whole screen with its title, context, record count and save status; Zoom from 50 % to 200 % (Ctrl/Cmd + wheel, pinch, slider, Fit, 100 %), kept per user and per table; add, edit, Row Editor, delete with Undo, Save all, filters and columns work as on the page; **Return to page**, Escape (after a cell edit or an open menu) or the browser Back button bring you back to the same row.
- **Paste of complete records** from Word, Excel, a CSV or text file or a web page (Ctrl/Cmd+V or Paste): one record per copied row; the rows are applied at once, with Undo, when the columns match, otherwise a Paste Preview shows the column mapping (by title, then position), the ignored columns, the rows added and overwritten and the cells to correct. Dates and numbers are read in your language, list values ignore case and accents, “ID (name)” references are resolved; pasted markup and scripts are discarded, and a paste is saved, audited and undone as one operation (at most `PASTE_MAX_ROWS` rows, 1,000 by default).
- **Copy** of the selected rows with their column titles, as text and as a table, to paste into Word, Excel or another table.
- **Currencies**: every amount carries its currency; Configuration › Currencies sets the default currency, the enabled currencies and dated exchange rates; documents never add different currencies without a stated rate and date. Spreadsheet formulas in exported text are neutralized.

## What is new in 1.10

- **Process design management**: your organization's copy of the reference design, with naming rules in three languages, versions, compare and restore, usage, retire, releases published by a second person, export/import (JSON, Excel, BPMN).
- **Typed step forms**: every step asks for what it produces (records, matrices, objectives, plans, decisions, reviews…), in inline tables with autosave, Undo, spreadsheet paste and a Row Editor; completed steps feed the project registers.
- **Organization (OBS)**: functions, roles, dated assignments, views on any date, organization chart and role-based RACSI with one Accountable per step.
- **Documented information**: 37 templates, organization layout, sections and overrides, versions, two-person publication, master list and the documents each standard requires; Word, PDF and Excel.
- **AI**: twelve-field prompt specifications per use case, organization model settings with a sealed key and an exact connection test.
- **Project template blueprints, audits with graded findings, attachment versions, search filters, retention and anonymized questionnaires.**
- **Design system**: SRS v1.10 tokens with the AI Value Graphical Chart values (Appendix J), CortexSkills and AI Value logos, bundled fonts, data tables, charts and system states; tested at 390–1280 px and in English, French and Arabic.
- **Demonstration data**: 61 organizations — a large company and an SME in each of 29 sectors, the multi-sector Horizon Services Group and two healthcare showcases — each with two runs (Digital and AI), all data and documents in English, French and Arabic.
- **Complete examples** (every task and every step done, every document published): Atlas Motors Kénitra (automotive, `headld@atlasmotorskenitra.ma`), Oasis Telecom (telecommunications, `headld@oasistelecom.ma`), Horizon Logistics Tanger Med (logistics, `headld@horizonlogisticsta.ma`) and the SME Coopérative Laitière Al Baraka (food and dairy, `headld@cooperativelaitier.ma`), plus Santéora Private Clinics (`headld@santeora.ma`), the Regional Hospital Centre (`headld@chr-sante.ma`) and Horizon Services Group (`headld@horizonservices.ma`). Password: `CortexSkills#2026`.

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

Settings go in `server/.env` (PORT, DEPLOYMENT_MODE=saas|onprem, DATA_DIR, JWT_SECRET, LICENSE_HMAC_SECRET, BACKUP_RETENTION_DAYS, CORS_ORIGIN, PASTE_MAX_ROWS).
