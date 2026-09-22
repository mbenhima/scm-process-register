# DynamicBA

AI-assisted scope-to-specs automation platform for management-consulting engagements —
a self-contained full-stack application: a `server/` (API + database) and a `web/`
(browser UI), designed to run entirely on your own computer with nothing to sign up for.

Full installation and user documentation is delivered as two Word documents, each with
an auto-generated table of contents, in `docs/`: `docs/DynamicBA_Installation_Guide.docx`
and `docs/DynamicBA_User_Guide.docx` (the latter includes a library of complete usage
scenarios with suggested sample data). This README is a developer quickstart only.

## Tech stack

- `server/`: Node.js + Express, a built-in JSON-file database (no native compiled
  dependency, no database server to install), JWT authentication.
- `web/`: React 18 + Vite + Tailwind CSS, talking to the server over a REST API.
- No cloud account of any kind is required. Everything runs on `localhost`.

## Quick start (two terminals)

```bash
# Terminal 1 — the server
cd server
npm install
cp .env.example .env
npm run seed   # optional: 5 demo clients + 10 example engagements + a demo login
npm run dev    # starts the API on http://localhost:4000

# Terminal 2 — the web app
cd web
npm install
npm run dev    # starts the UI on http://localhost:5173, proxying /api to the server
```

Open http://localhost:5173. If you ran `npm run seed`, sign in with
`admin@dynamicba.demo` / `DemoAdmin123!`; otherwise click "Create one" to found a new
Organization.

## What's implemented

- Multi-tenant hierarchy: Organization (consulting firm) → Client → Project (engagement)
- The 4-step user-facing wizard (Upload SOW → AI Generates Spec Package → Review &
  Validate → Export & Handoff) over the internal 7-macro-process / 63-step backbone
  (`web/src/lib/catalogue.js`, transcribed from D01/D02)
- A deterministic, explainable rule engine (`web/src/lib/ruleEngine.js`) implementing D03
  Business Rules / D03a Actions — no external LLM call required
- A schema-driven Project Artifact Explorer covering all 32 D09/D10 object classes
- Licensing: a `LicenceProvider` abstraction (`web/src/licensing/`) per D30, gating the
  D26 Starter/Professional/Enterprise/Pay-Per-Project modules, enforced by the API server
- Governance reference catalogue (Business Rules, Controls, Risks, KPIs, Alerts) plus
  live per-project instances raised by the rule engine
- The 16-entry D15 AI Use Case Library with org/project activation
- Admin: Organization settings, Users & Roles, a runtime-editable Permission Matrix,
  Licensing, Compliance Standards toggles, and an Audit Log
- EN/FR/AR navigation with Arabic RTL layout
- `npm run seed` (in `server/`): 5 demo clients and 10 example engagements at different
  wizard stages, plus a ready-to-use demo admin login

See the Installation Guide's "Known Simplifications" appendix for what is explicitly
out of scope in this build (an OnPrem signed-licence-file mode, live LLM provider
connections, a full BPMN 2.0 editor, real-time multi-user sync, and Visio/Jira/Azure
DevOps native export).
