# CortexPLM Coverage Checklist

Every content block of the five source documents is covered; the SRS blocks are partial (148 of 155 requirements met, see the SRS Gap Analysis). Counts are measured on the running application after a fresh seed.

## Process Design Reference v2 (CortexPLM_Process_Design_Reference_v2.docx)

| Source content | Implemented as | Where to see it | Measured | Status |
|---|---|---|---|---|
| Identifier conventions, RACSI codes, status of content | Glossary, RACSI matrix screen, task accountability card | Process design, Governance > RACSI matrix | 33 glossary terms | Covered |
| Part 1 Executive summary: key figures, lifecycle, E2E inventory, three levels of steps | Macro processes and E2E pages, dashboard | Process design > Macro processes / End-to-end processes | 9 E2E, 81 tasks, 727 steps | Covered |
| Part 2 Macro processes repository (Parts A, B, C, D, E, I, J) with SIPOC | One page per macro process with SIPOC, goal, steps | Process design > Macro processes | 69 of 69, 69 with full SIPOC | Covered |
| Parts 3 to 5 E2E processes, user-facing tasks, UFS, BPMN flow template | E2E pages, task forms, BPMN modeler (one diagram per E2E) | End-to-end processes; Governance > BPMN diagrams | 81 tasks, 30 UFS, 9 BPMN per organization | Covered |
| Part 6 Coverage statement and 16 unmapped macro processes | Coverage matrix with resolutions | Process design > Coverage matrix | 69 × 9 matrix, 16 findings | Covered |
| Part 7 Track modes, mode-to-MP matrix, activation summary, scoring model, rules R1–R4 | Track configuration (versioned), project wizard scoring, lifecycle engine enforcing R1–R4 | Process design > Track configuration; New project | 69 rows, 7 criteria, 4 rules, 3 thresholds | Covered |
| Part 8 Phase-gate reference: gate summary, decision outcomes, gate roles | Gate reference, checklists by track, Go/Kill/Hold/Recycle engine, CTL-01 | Process design > Phase-gate reference; Gate board | 8 gates, 4 outcomes | Covered |
| Part 9 Design review findings and next steps; Appendix A glossary | Findings and glossary pages | Coverage matrix > Findings; Glossary | 16 findings, 33 terms | Covered |

## Deliverables workbook (CortexPLM_Deliverables_D01D10_D15_D15b_D26.xlsx)

| Source content | Implemented as | Where to see it | Measured | Status |
|---|---|---|---|---|
| Cover | Workbook cover data | Reference API /reference/workbook | Loaded | Covered |
| D01 Macro Processes | Macro process pages (owner role, category, tier) | Macro processes | 69 of 69 | Covered |
| D02 Tasks & Steps | Steps under each macro process; checklist evidence items | Macro processes; gate checklists | 727 of 727 | Covered |
| D03 Business Rules | Business rules register (versioned); BR-001/002/004/005/008/009/011/030 enforced live | Governance > Business rules | 64 / 64 / 64 / 64 / 64 / 64 / 64 per organization (60 reference + organization rules) | Covered |
| D03a Actions Registry | Actions registry (ACT-01..) | Governance > Business rules > Actions | 50 of 50 | Covered |
| D04 Controls | Controls register with COSO components; CTL-01, CTL-04 enforced | Governance > Controls (COSO) | 58 / 53 / 59 / 53 / 54 / 57 / 57 per organization (47 reference + compliance starters) | Covered |
| D05 Risks | Risks & opportunities register, heat map, project risks | Governance > Risks & opportunities | 50 / 48 / 50 / 48 / 49 / 48 / 48 per organization (27 reference + project risks) | Covered |
| D06 KPIs | Built-in KPIs computed live or recorded, custom KPIs | Governance > KPIs | 38 / 38 / 38 / 38 / 38 / 38 / 38 per organization (38 of 38) | Covered |
| D07 Alerts | Alert catalog, background checks, multi-channel dispatch | Alerts; Notifications | 31 alert types (25 D07 + 6 system) | Covered |
| D08 Reports & Cockpits | Report screens with PDF, Excel and Word export | Reports & cockpits | 24 of 24 | Covered |
| D09 Information Class Model | Data model page | Reports > Data model | 58 of 58 | Covered |
| D10 Data Dictionary | Data dictionary with types and validation rules | Reports > Data model | 189 of 189 | Covered |
| D15 AI Use Cases | Governed AI use cases, suggestions, append-only usage log | Intelligence > AI use cases | 23 / 23 / 23 / 23 / 23 / 23 / 23 per organization (23 of 23) | Covered |
| D15b Role Menus | Role menus reference; navigation filtered by role permissions | Reports > Role menus | 309 of 309 | Covered |
| D26 Modules & Tiers | Tiers, feature gating and quotas per subscription | Administration > Configuration | 11 modules | Covered |

## Packs, Integrations & Add-Ons Catalog (CortexPLM_Packs_Integrations_AddOns_Catalog.docx)

| Source content | Implemented as | Where to see it | Measured | Status |
|---|---|---|---|---|
| Part 1 Executive summary, packaging philosophy, pack summary | Catalog page, principles | Administration > Catalog | Loaded | Covered |
| Part 2 Packs 01–11 (segment, behavior, pain points, hopes, fit, macro processes, price) | Pack cards; subscription entitlements drive features | Administration > Catalog > Packs; Configuration | 11 of 11 | Covered |
| Part 3 Integrations catalog (11 categories) | Integration registry: register, encrypted credentials, health check, mappings, sync, signed inbound events | Administration > Integrations | 40 of 40 | Covered |
| Part 4 Add-ons catalog (7 families) | Add-on toggles compatible with the subscription | Administration > Configuration; Catalog > Add-ons | 28 of 28 | Covered |
| Part 5 Pricing summary, bundles, volume discounts, differentiators | Bundles with stated and recalculated savings, quote builder | Administration > Catalog > Bundles & pricing / Quote builder | 8 of 8 bundles, 6 discount bands | Covered |
| Appendix A review notes (confirmed, recalculated savings, points for decision) | Review notes shown with the bundles | Catalog > Bundles & pricing | 7 review notes | Covered |
| Appendices B and C quick reference and glossary | Pack quick reference in the catalog | Administration > Catalog | Loaded | Covered |

## Dynamic Apps Standard SRS (Dynamic_Apps_Standard_SRS.docx)

| Source content | Implemented as | Where to see it | Measured | Status |
|---|---|---|---|---|
| Sections 1–3 introduction, principles, common platform architecture | Multi-tenant server, RBAC, commercial gating, AI governance, RAG, i18n, justification, versions, communication, REX | Whole application | Implemented | Covered |
| Section 4 functional requirements FR-DA-* (18 groups) | Each requirement assessed individually (see the SRS Gap Analysis) | Administration > Traceability | 110 of 112 met; partial: FR-DA-TEN-08, FR-DA-I18N-01 | Partial |
| Section 5 non-functional requirements NFR-DA-* | Measured: response times, 100 concurrent users, BPMN round trip, WCAG scan, phone width; tests in CI | Administration > Traceability | 38 of 43 met; partial or hosting: NFR-DA-REL-02, NFR-DA-SCALE-03, NFR-DA-UX-03, NFR-DA-PORT-02, NFR-DA-MAINT-01 | Partial |
| Sections 6–7 data model and interface conventions; Appendix A | REST JSON API, UI conventions, data model page | Data model; API /api/* | Implemented | Covered |

## D30 Licensing Implementation Schema (CD_D30_Licensing_Implementation_Schema.docx)

| Source content | Implemented as | Where to see it | Measured | Status |
|---|---|---|---|---|
| One LicenceProvider interface, SaaS and OnPrem implementations | SaasLicenceProvider (signed record) and OnPremLicenceProvider (Ed25519 .lic file) | Administration > Licensing | saas active 25/60 / saas active 24/40 / saas active 24/40 / saas active 24/30 / saas warning 24/30 / saas active 24/30 / saas active 24/40 | Covered |
| Add-on licensing as independent toggles (compliance standards) | Compliance standards activation with non-certification disclosure | Administration > Configuration | Implemented | Covered |
| Hardware binding, licence file format, vendor signing tool | hardwareId field, npm run keys / npm run sign-licence | server/tools | Implemented | Covered |
| maxUsers enforcement and expiry warning (CTRL-003) | User creation blocked at the limit; banner 30 days before expiry | Users & roles; top banner | Orvane licence expires in 22 days | Covered |

## Seed data requirement (request)

| Source content | Implemented as | Where to see it | Measured | Status |
|---|---|---|---|---|
| Seven sectors: Public Sector, Manufacturing, Healthcare, Agro-Business – Dairy, Transportation, Oil/Gas/Energy, Real Estate Development | One organization per sector with 24–25 users and 21 projects | Organization switcher (platform admin) | Public Sector / Manufacturing / Healthcare / Agro-Business - Dairy Products / Transportation / Oil, Gas & Energy / Construction | Covered |
| Tenant model: Group (Yes/No), Organization, Project | Atlas Infrastructure Holding (Cedarline, Ridgeway, Orvane); Crescent Agro-Energy Group (Valdora, Kestrel); Metro City and Meridale independent | Administration > Organizations & OBS | 2 groups, 5 members, 2 independent | Covered |
| Benchmarking within the organization and within the group (external out of scope) | Project type, track and department comparison; group comparison of aggregates with opt-out; 5 automated tests | Reports > Benchmarking | 13 indicators | Covered |
| At least 10 instances of each E2E process per industry | E2E-01:21 02:19 03:16 04:14 05:16 06:12 07:12 08:10 09:13 in every organization | Dashboard, E2E pages | Minimum 10 met | Covered |
| Pin and slide menu; top, bottom, left and right positions | Navigation bar settings, saved per user; RTL aware | Sliders icon in the navigation bar | Implemented | Covered |

## Request of this round (tenancy, portfolio, checklists, attachments, AI, BPMN)

| Request | Implemented as | Where to see it | Status |
|---|---|---|---|
| Tenancy: Group (Yes, No), Organization, Projects; create projects linked to an organization | Tree and table Group (Yes/No) > Organization > Projects; Add group, Add organization (Group Yes/No, starting team), New project with Organization step | Portfolio > Groups, organizations & projects; New project, Step 0 | Covered |
| See all seeded groups, organizations and projects | Platform administrator sees 2 groups, 7 organizations, 147 projects; group executives see their group | Same screen | Covered |
| OBS seeded for all projects, with roles | 147 project team trees (steering committee, project management, delivery teams) with 2,400+ people-role placements; department members | Administration > Organizations, OBS & teams | Covered |
| LLM configuration with model drop-down and custom choice | Provider list, model list (Claude Opus 5 default, Opus 5.5, Fable 5.1, Sonnet 5, Haiku 4.5), Custom model…, custom endpoint, Test connection | Settings; Administration > Configuration & AI model | Covered |
| Overall view for a scope: columns E2E, rows projects, status at the intersection, legend | Portfolio overview with group / organization / set-of-projects scope, 7-status legend, totals, CSV | Portfolio > Portfolio overview | Covered |
| Process design: legend for Part; tasks with Assistive/Augmented AI | Legend: Part card; AI column; Tasks and AI tab listing 81 tasks with AI badges | Process design > Macro processes; End-to-end processes | Covered |
| AI use cases CRUD; visible and runnable (Accept, Modify, Reject) on E2E, macro processes, tasks and steps | Create, edit (versioned), delete (custom), activate; sparkle badges run the use case in place | AI use cases; E2E detail; macro process steps; task page | Covered |
| Checklist template library per gate per track; link to gates; create at the gate from a template or manually | 145 standard + sector templates; linked templates copied when a gate opens; Add to this checklist; Save as template | Process design > Checklist templates; gate page | Covered |
| Attach documents in many formats to all tasks | Multi-file upload and drag-and-drop, 9 format families, 25 MB, delete, audit; 440+ seeded attachments | Every task page | Covered |
| Filter Innovation projects by group / organization / project within permissions | Scope filters limited to permitted organizations; foreign projects read-only | Portfolio > Innovation projects | Covered |
| Seed all application aspects | Every table populated (custom AI use cases, overrides, alert settings, reads, webhooks, attachments, teams) | Whole application | Covered |
| BPMN palette section; full screen with palette and return | Shapes palette panel (legend when view-only), slide-away palette, zoom slider, Full screen / Back to the page | Process design > BPMN diagrams | Covered |
| Organize the modules for a better experience | Menu regrouped: Home, Portfolio, Process design, Governance & risk, AI & knowledge, Reports, Administration, Me | Navigation bar | Covered |
| User Guide: every scenario starts with Group (Yes/No), Organization, then Project(s); decision matrix | Six runs each with Step 0 (tenancy); Chapter 4 Decision Matrix; in-app Decision matrix button | User Guide | Covered |
| Sectors: Public Sector, Manufacturing, Healthcare, Agro-Business – Dairy, Transportation, Oil/Gas/Energy, Real Estate Development | One seeded organization per sector (MFG and RED codes for the two renamed sectors) | Tenancy screen | Covered |

## End-to-end verification

Replayed on a fresh seed with docs/tools/run-scenarios.mjs; each run first creates its group (if any) and organization.

| Run | Tenancy | Project | Track | Steps | End state |
|---|---|---|---|---|---|
| 1 | Group: No > Harbourview City Services | HAR-001 Online Parking Permit Renewal | Fast | 29 | Launched |
| 2 | Group: Yes (new: Meridian Mobility Holding) > Northline Regional Transit | NOR-001 Real-time Bus Crowding Indicator | Fast | 32 | Launched |
| 3 | Group: Yes (Crescent) > Oasis Fresh Dairies | OAS-001 Lactose-free Greek Yogurt 500 g | Light | 78 | Active (relaunched) |
| 4 | Group: No > Clearwater Medical Devices | CLE-001 Remote Cardiac Monitoring Patch | Full | 77 | Retired |
| 5 | Group: Yes (Crescent) > Sahara Hydrogen Energy | SAH-001 Green Hydrogen Refuelling Kit | Full | 92 | Active (relaunched) |
| 6 | Group: Yes (Atlas) > Palmgrove Residential Developers | PAL-001 Smart Townhouse Collection | Light | 48 | Launched |

Module scenarios: 43 checks passed (docs/tools/replay-module-scenarios.mjs). Server tests: 17 passed.
