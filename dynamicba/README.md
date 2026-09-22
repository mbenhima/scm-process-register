# DynamicBA

AI-assisted scope-to-specs automation platform for management-consulting engagements —
built as a multi-tenant SaaS web application on the DynamicMS Suite platform pattern.

Full installation and user documentation is delivered as two Word documents:
`DynamicBA_Installation_Guide.docx` and `DynamicBA_User_Guide.docx` (with table of
contents). This README is a developer quickstart only.

## Tech stack

- React 18 + Vite + Tailwind CSS
- Firebase Authentication (Email/Password) + Cloud Firestore
- `docx` / `xlsx` / `jspdf` for in-browser Word/Excel/PDF export (no backend server)
- Firestore Security Rules enforce tenant isolation, RBAC, and licence seat quotas
  server-side (see `firestore.rules`)

## Quick start (local development)

```bash
npm install
cp .env.example .env
# fill in your Firebase project values in .env
npm run dev
```

## What's implemented

- Multi-tenant hierarchy: Organization (consulting firm) → Client → Project (engagement)
- The 4-step user-facing wizard (Upload SOW → AI Generates Spec Package → Review &
  Validate → Export & Handoff) over the internal 7-macro-process / 63-step backbone
  (`src/lib/catalogue.js`, transcribed from D01/D02)
- A deterministic, explainable rule engine (`src/lib/ruleEngine.js`) implementing D03
  Business Rules / D03a Actions — no external LLM call required
- A schema-driven Project Artifact Explorer covering all 32 D09/D10 object classes
- Licensing: a `LicenceProvider` abstraction (`src/licensing/`) per D30, SaaS-only in
  this build, gating the D26 Starter/Professional/Enterprise/Pay-Per-Project modules
- Governance reference catalogue (Business Rules, Controls, Risks, KPIs, Alerts) plus
  live per-project instances raised by the rule engine
- The 16-entry D15 AI Use Case Library with org/project activation
- Admin: Organization settings, Users & Roles, a runtime-editable Permission Matrix,
  Licensing, Compliance Standards toggles, Audit Log, and a "Seed Demo Data" action
  (5 demo clients, 10 example engagements at different wizard stages)
- EN/FR/AR navigation with Arabic RTL layout

See the Installation Guide's "Known Simplifications" appendix for what is explicitly
out of scope in this build (OnPrem licensing mode, live LLM provider connections, a
full BPMN 2.0 editor, and Visio/Jira/Azure DevOps native export).
