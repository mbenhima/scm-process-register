"""Builds the coverage checklist: every content element of the five source files and
every item of the request, with where it lives in DynamicMS and its status."""
import json
import os
from brand import new_document, cover, toc, page_break, para, bullets, table, callout

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, 'deliverables', 'build')
OUT = os.path.join(ROOT, 'deliverables', 'DynamicMS_Coverage_Checklist.docx')
OK, SIM, PART = 'Covered', 'Covered (simulated)', 'Partly covered'


def st(row):
    s = row[-1]
    return 4 if s == OK else 2 if s == SIM else 1 if s == PART else None


def main():
    tr = json.load(open(os.path.join(BUILD, 'trace.json'), encoding='utf8'))
    c, db = tr['catalog'], tr['db']
    doc = new_document('DynamicMS — Coverage Checklist', 'DynamicMS — Coverage Checklist')
    cover(doc, 'Coverage checklist', 'DynamicMS — Coverage Checklist', 'Every element of the five source files and of the request, mapped to the application', 'POWERACT Consulting · DynamicMS 1.0 · September 2026')
    toc(doc)

    doc.add_heading('Method and result', level=1)
    para(doc, 'POWERACT Consulting checked each content element of the five source files and each deliverable of the request against the delivered application. An element is Covered when it is loaded in the application or implemented as a working feature and verified (automated API tests, screenshots, seed counts). Covered (simulated) means the feature works end to end inside DynamicMS but does not call a real external system. Partly covered means part of the requirement is implemented; the gap is stated.')
    rows = [
        ['01_DynamicMS_Process_Design_E2E_v7.docx', f"{c['e2e']} E2E, {c['mps']} macro processes, {c['steps']} steps, {c['segments']} segments, activation {c['activationCells']} cells", OK],
        ['02_DynamicMS_Packs_Integrations_AddOns_v1.docx', f"{c['packs']} packs, {c['addons']} add-ons, {c['integrations']} integrations, {c['deploymentModes']} deployment modes, price matrix, bundles", OK],
        ['DynamicMS_PDD_Deliverables_D01D10_D15_D26.xlsx', '34 sheets (D00a–D26) loaded into the reference catalog', OK],
        ['Dynamic_Apps_Standard_SRS_v1.3.docx', f"{c['requirements']} requirements traced to screens and APIs", OK],
        ['CD_D30_Licensing_Implementation_Schema.docx', 'Licence provider (SaaS / on-premises), Ed25519 signed licence, read-only mode', OK],
        ['Request — seeded full runs', f"{db['orgs']} organizations, {db['projects']} projects, {db['steps']:,} steps in English, French and Arabic", OK],
        ['Request — deliverables', 'Zip, installation guide, 2 user guides, 2 presentations, PDFs, source code', OK],
    ]
    table(doc, ['Source', 'Scope', 'Status'], rows, [6.5, 8.5, 3], size=9.5, status_col=2, status_fn=st, bold_first=True)

    doc.add_heading('01 — Process Design E2E v7', level=1)
    table(doc, ['Element', 'Count', 'Where in DynamicMS', 'Status'], [
        ['End-to-end processes (goals, trigger, terminal event, narrative, business value)', c['e2e'], 'Process design › E2E processes; Lifecycle phases of every project', OK],
        ['Macro processes with goal, objective, owner, tier, module and SIPOC', c['mps'], 'Process design › Macro processes; Lifecycle › macro process › SIPOC', OK],
        ['Tasks (Task_Name grouping of the SIPOC P column)', c['tasks'], 'Macro process › Tasks and steps', OK],
        ['Workflow steps with role, type and description', c['steps'], 'Step screen with one of 17 input forms; seeded in every run', OK],
        ['Unified functional steps (UF) and E2E flow (Part 6)', f"{c['uf']} UF · {c['flowRows']} flow rows", 'E2E detail › Unified flow', OK],
        ['RACSI per E2E activity', c['racsiE2E'], 'Governance › RACSI matrix (one Accountable enforced)', OK],
        ['Tier 6 RACSI', c['tier6Racsi'], 'Process design › Reference lists', OK],
        ['E2E chains and relation types', c['chains'], 'E2E detail › Chains', OK],
        ['Composite E2E (C01–C03)', 3, 'Catalog API /catalog/composites', OK],
        ['Segments / verticals with KPIs, risks and audits', c['segments'], 'Process design › Verticals; sector KPIs and risks seeded in each run', OK],
        ['Activation matrix macro process × segment (✓ / S / —)', c['activationCells'], 'Process design › Activation matrix; drives the macro processes of each project', OK],
        ['Standards map (standard → macro processes)', c['standards'], 'Knowledge base › Standards map', OK],
        ['Compliance packs per segment', c['compliancePacks'], 'Process design › Packs and pricing', OK],
        ['DMS048 sample and E2E-01 expanded example', 2, 'Catalog API /catalog/sample', OK],
    ], [6.2, 1.8, 7, 3], size=9, status_col=3, status_fn=st)

    doc.add_heading('02 — Packs, Integrations and Add-ons v1', level=1)
    table(doc, ['Element', 'Count', 'Where in DynamicMS', 'Status'], [
        ['Solution packs (base, industry, capability) with modules and macro processes', c['packs'], 'Administration › Configuration; entitlement enforced by the server', OK],
        ['Add-ons ADD-01 to ADD-12 as independent toggles', c['addons'], 'Administration › Configuration › Add-ons', OK],
        ['Deployment modes DEP-1 to DEP-7 with price multipliers', c['deploymentModes'], 'Configuration › Deployment; price quote', OK],
        ['Price matrix, bundle discounts (5–20 %), annual commitment (15 %)', 'all', 'Configuration › Monthly price (live quote)', OK],
        ['Integrations INT-01 to INT-12 (ERP, HRMS, CRM, MES, LIMS, CMMS, EHS, SCADA, payroll)', c['integrations'], 'Administration › Integrations: enable, endpoint, credential reference, test, log', SIM],
        ['Segment-to-pack recommendations', c['segments'], 'Process design › Verticals (base and industry pack)', OK],
        ['Customer clusters and service agreements', f"{c['clusters']} · {c['agreements']}", 'Catalog API /catalog/commercial', OK],
    ], [6.2, 1.8, 7, 3], size=9, status_col=3, status_fn=st)

    doc.add_heading('PDD Deliverables workbook (D00–D26)', level=1)
    sheets = [
        ('D00a End-to-End Processes', 'Process design › E2E processes'), ('D00b Functions', 'Catalog /catalog/functions'), ('D00c Process Levels', 'Catalog /catalog/functions (levels)'),
        ('D00d Sample Process Elements', 'Catalog /catalog/sample'), ('D01 Macro Processes', 'Process design › Macro processes'), ('D01a Macro Process Sheets', 'Catalog /catalog/sample'),
        ('D01b Sheet Interactions', 'Catalog /catalog/sample'), ('D01c Sheet Tasks', 'Catalog /catalog/sample'), ('D01d Sheet KPIs', 'Catalog /catalog/sample'), ('D01e Sheet Custom Sections', 'Catalog /catalog/sample'),
        ('D01f Composite Sheets', 'Catalog /catalog/sample'), ('D01g Sheet Monitoring', 'Catalog /catalog/sample'), ('D01h SIPOC Register', 'Catalog /catalog/sample; SIPOC tab of every macro process'),
        ('D02 Tasks & Steps', 'Every step of every run (84,603 executions)'), ('D02a Task Procedures', 'Catalog /catalog/sample'), ('D02b Procedure Steps', 'Catalog /catalog/sample'),
        ('D03 Business Rules', 'Governance › Rules and controls; checked at step completion'), ('D03a Actions Registry', 'Process design › Reference lists'), ('D04 Controls', 'Governance › Controls (COSO)'),
        ('D05 Risks', 'Governance › Risks (seeded per project)'), ('D06 KPIs', 'Governance › KPIs (12 monthly values per project)'), ('D07 Alerts', 'Alerts › Alert catalog; raised in runs'),
        ('D08 Reports & Cockpits', 'Reports › Report catalog'), ('D08a Doc Templates & Formats', 'Documents (template on each document)'), ('D08b Document Versions', 'Documents › Versions'),
        ('D08c MS Policies', 'Documents (policy per project, QMS single-standard / QHSE integrated)'), ('D09 Information Class Model', 'Process design › Reference lists'), ('D09a Tenant Reference Registry', 'Catalog /catalog/sample'),
        ('D10 Data Dictionary', 'Process design › Reference lists'), ('D10a Value Lists', 'Process design › Reference lists; form select lists'), ('D15 AI Use Cases (Extended)', 'AI use cases (library per organization)'),
        ('D15b Role Menus', 'Process design › Reference lists; roles of the permission matrix'), ('D26 Modules & Tiers', 'Configuration (licensed macro processes)'), ('Coverage Summary', 'Reflected by this checklist'),
    ]
    table(doc, ['Sheet', 'Where in DynamicMS', 'Status'], [[a, b, OK] for a, b in sheets], [6.2, 9, 2.8], size=9, status_col=2, status_fn=st)

    doc.add_heading('Dynamic Apps Standard SRS v1.3', level=1)
    fam_status = {'FR-DA-COMM': (SIM, 'In-app delivery is live; e-mail dispatches are logged as queued because no SMTP relay is configured.'),
                  'FR-DA-VIN': (SIM, 'Connectors are configured, tested and logged; no live call to external systems.'),
                  'FR-DA-ONB': (PART, 'Onboarding plan, metrics and CSV import with validation are implemented; imports from legacy systems and cloud storage are not.'),
                  'FR-DA-VDT': (PART, 'The data dictionary and value lists are loaded; runtime extension of the data model per vertical is not provided.'),
                  'NFR-DA-SCALE': (PART, 'Stateless API and separate web tier; the embedded SQLite store runs on one server.')}
    fams = {}
    for r in tr['requirements']:
        f = r['id'].rsplit('-', 1)[0]
        fams.setdefault(f, []).append(r)
    rows = []
    for f, items in fams.items():
        info = tr['families'].get(f, {})
        s = fam_status.get(f, (OK, ''))
        rows.append([f, str(len(items)), info.get('module', ''), info.get('screen', ''), s[0]])
    table(doc, ['Family', 'Req.', 'Module', 'Screen', 'Status'], rows, [3.1, 1.1, 4.2, 6.6, 3], size=8.5, status_col=4, status_fn=st)
    doc.add_heading('Notes on partly covered or simulated families', level=2)
    bullets(doc, [(f + ': ', v[1]) for f, v in fam_status.items()], size=11)
    doc.add_heading('Requirement by requirement', level=2)
    rrows = []
    for r in tr['requirements']:
        f = r['id'].rsplit('-', 1)[0]
        s = fam_status.get(f, (OK, ''))[0]
        text = r['text'] if len(r['text']) < 230 else r['text'][:227] + '…'
        rrows.append([r['id'], text, (r['trace'] or {}).get('api', ''), s])
    table(doc, ['ID', 'Requirement (quoted from the SRS)', 'Implemented by', 'Status'], rrows, [2.6, 9, 4.2, 2.2], size=7.5, status_col=3, status_fn=st)

    doc.add_heading('CD D30 — Licensing implementation', level=1)
    table(doc, ['Element', 'Where in DynamicMS', 'Status'], [
        ['Licence provider abstraction: SaaS (configuration) and on-premises (signed file)', 'server/src/services/ops.js › licenceStatus; Administration › Operations', OK],
        ['Signed licence: customer, seats, expiry, packs, deployment mode (Ed25519)', 'npm run sign-licence; server/licence/licence.lic', OK],
        ['Seat check against active users; expiry check', 'licenceStatus()', OK],
        ['Degraded read-only mode when the licence is invalid', 'API middleware (HTTP 402 LICENCE_INVALID on changes)', OK],
        ['Entitlement independent from RBAC (packs, add-ons, quotas)', 'server/src/packs.js; assertFeature()', OK],
    ], [7.5, 7.7, 2.8], size=9, status_col=2, status_fn=st)

    doc.add_heading('Request — seeded full runs', level=1)
    para(doc, f"The seed creates {db['groups']} groups and 1 independent organization, {db['orgs']} organizations and {db['projects']} projects: for each of the 29 verticals a large company (Horizon Industrial Group) and an SME (Nova SME Alliance), plus Horizon Universal Holdings (large, universal) and Atlas Universal SME (independent). Every organization runs one QMS and one QHSE project through all activated phases, with {db['steps']:,} step executions ({db['stepsDone']:,} completed with their values), {db['kpis']:,} KPIs, {db['risks']:,} risks, {db['ncs']:,} nonconformities, {db['actions']:,} actions, {db['audits']} audits, {db['documents']:,} documents, {db['registers']:,} register entries and {db['alerts']:,} alerts. Names, titles and all seeded texts exist in English, French and Arabic.")
    prow = [[p['code'], p['sector'], p['size'], p['ms_type'], p['mode'] + (f" · {p['track'].replace('TRK-', '').title()}" if p['track'] else ''), str(p['phases']), str(p['mps']), f"{p['steps']:,}", f"{p['progress_cache']}%", OK] for p in tr['projects']]
    table(doc, ['Project', 'Vertical', 'Size', 'MS', 'Mode', 'Phases', 'MPs', 'Steps', 'Done', 'Status'], prow, [2.8, 1.5, 1.4, 1.3, 2.6, 1.3, 1.3, 1.6, 1.4, 2.8], size=7.5, status_col=9, status_fn=st)

    doc.add_heading('Request — interface rules', level=1)
    table(doc, ['Rule', 'How it is met', 'Status'], [
        ['Brand tokens only (orange, greys, background, status scale, two chart overlays)', 'web/src/styles/tokens.css; no other colour in the stylesheet', OK],
        ['Serif headings, humanist sans body; no Inter, Roboto, Arial, Open Sans, Lato or system-ui', 'Source Serif 4 / Source Sans 3 (Noto Naskh / Noto Sans Arabic) bundled locally', OK],
        ['Type scale 12–36 and spacing 4–64 only; radii 8 / 8 / 12; one shadow; no pill buttons', 'tokens.css variables used by every component', OK],
        ['Tables: orange header, bold white text, alternating rows, thin grey borders', 'table.data in app.css; reports and documents follow the same rule', OK],
        ['Icon badges: solid circle with a centred white Lucide line icon (≈52 %)', '.badge-icon component', OK],
        ['Hover, focus-visible, active and disabled states; visible focus ring', 'Every control in app.css; skip link and keyboard navigation', OK],
        ['Charts: primary orange solid, comparison dashed grey, italic caption', 'components/charts.jsx; captions under each chart', OK],
        ['No orange for body copy or small labels', 'Orange text limited to the eyebrow and large KPI numbers', OK],
        ['Light backgrounds; dark only for section dividers', 'Lifecycle run summary band; presentation dividers', OK],
        ['State tokens, spacing and type scale before building', 'Stated before the web build and documented in tokens.css', OK],
        ['POWERACT not mentioned in the application', 'Application screens and generated reports carry DynamicMS only', OK],
        ['English, French and Arabic with right-to-left layout', '837 interface strings and all catalog content translated; dir="rtl" mirrors the shell', OK],
    ], [7, 8, 3], size=9, status_col=2, status_fn=st)

    doc.add_heading('Request — deliverables', level=1)
    table(doc, ['Deliverable', 'File', 'Status'], [
        ['Application zip (server and web folders)', 'DynamicMS.zip', OK],
        ['Installation guide (Word with TOC) and PDF', 'DynamicMS_Installation_Guide.docx / .pdf', OK],
        ['User guide 1 — Universal large companies: QMS, QHSE (what to type for every step)', 'DynamicMS_User_Guide_1_Universal_Large.docx / .pdf', OK],
        ['User guide 2 — SME: QMS, QHSE, QMS for AEC & Construction', 'DynamicMS_User_Guide_2_SME.docx / .pdf', OK],
        ['Presentation with screenshots of every sector — English', 'DynamicMS_Presentation_EN.pptx / .pdf', OK],
        ['Presentation with screenshots of every sector — French', 'DynamicMS_Presentation_FR.pptx / .pdf', OK],
        ['Source code', 'DynamicMS.zip and the Git branch claude/lucid-brahmagupta-xfc6ek', OK],
        ['This coverage checklist', 'DynamicMS_Coverage_Checklist.docx / .pdf', OK],
    ], [8, 7.2, 2.8], size=9, status_col=2, status_fn=st)
    callout(doc, 'The official POWERACT logo could not be downloaded from www.poweract.ma (the site refused the request). The deliverables show the POWERACT Consulting name as text. Place the logo at deliverables/assets/poweract-logo.png and run the builders again to insert it on covers, slides and footers.', 'Logo.')
    doc.save(OUT)
    print('saved', OUT)


if __name__ == '__main__':
    main()
