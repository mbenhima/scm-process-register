"""Builds the two DynamicMS user guides (Word, with TOC) from the seeded full runs:
  1. Universal — large and big companies: Scenario 1 QMS, Scenario 2 QHSE
  2. SME: Scenario 1 SME QMS, Scenario 2 SME QHSE, Scenario 3 SME QMS for AEC & Construction
Every step of every macro process is listed with what to type in each field."""
import json
import os
import sys
from brand import (new_document, cover, toc, page_break, para, bullets, numbered, table, caption, callout, image, DEEP, DARK, INK)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, 'deliverables', 'build')
OUT = os.path.join(ROOT, 'deliverables')
SHOTS = os.path.join(BUILD, 'shots')
URL = 'http://localhost:5173'

FORMS = [
    ('Standards and scope', 'Standards applied (tick boxes), Scope type (single standard or integrated), Organization units covered (OBS), Why these standards. Selected once per project, before the policy is drafted.'),
    ('Periodicity', 'Frequency (list), Next due date, Review chaired by (role), Organization units in scope (OBS picker), Review inputs and notes'),
    ('Register items', 'Items identified: a table, one row per item, with Item, Category, Description and impact, Relevance and Source / evidence (each row has its own source)'),
    ('Assessment', 'Decision matrix: one row per criterion with Weight (%), Score 1–5 and the facts that justify it; the weighted score is computed; Conclusion'),
    ('Decision', 'Decision criteria checked (table: criterion, met yes/partly/no, evidence), Decision (Go, No-Go, Hold), Approver (role), Comment and conditions'),
    ('Document', 'Document template (list), Document reference, Version, Content summary, Generated document (link). Use Generate document to create it from the project data.'),
    ('Communication', 'Communication records: one row per audience with Channel, Date, Key message and Communicated by (ISO 9001 §7.4)'),
    ('Training', 'Session, Date, Units trained (OBS), Participants, Effectiveness evaluation method, Effectiveness (%)'),
    ('Measurement', 'Indicators measured: one row per KPI chosen from the project list (or a new KPI), with Why this KPI for this step, Measured value and Target; Analysis'),
    ('Review', 'Review frequency, Review date, Next review, Chaired by, Participants (roles), Inputs reviewed (table), Decisions and actions (table: each decision becomes an action)'),
    ('Plan', 'Planned activities: one row per activity with Owner (person), Start, Due date and Deliverable; each row becomes an action of the Action plan'),
    ('SMART objectives', 'One row per objective: Specific objective, Measure (KPI), Baseline, Achievable target, Relevant to, Owner, Time-bound deadline, Resources; each row becomes an entry of the objectives register'),
    ('Execution', 'What was done, Records that prove it (links), Completion (%)'),
    ('Assignment', 'Role, Person (from the OBS), Organization units covered, RACSI of the macro process in five columns (one Accountable)'),
    ('Configuration', 'Settings table (setting, value, reason), Tested before use'),
    ('Change', 'Change made, Reason, Documents or records updated (links)'),
    ('Closure', 'Closure evidence, Records that prove effectiveness, Closure date'),
    ('Escalation', 'Escalated to (role), Reason'),
    ('AI-assisted draft', 'Context given to the assistant, Suggestion outcome (Accepted, Edited, Rejected), Final validated text'),
    ('Automated service task', 'System result confirmed, Records produced (links); filled by the DynamicMS Engine'),
]


def shot(doc, code, name, cap):
    image(doc, os.path.join(SHOTS, code, f'{name}.png'), 17, cap)


def getting_started(doc, example_email):
    doc.add_heading('Getting started', level=1)
    doc.add_heading('Sign in', level=2)
    numbered(doc, [
        f'Open {URL} in Chrome, Edge, Firefox or Safari.',
        f'Type your e-mail (for example {example_email}) and the password Demo@2026, then select Sign in.',
        'Choose the language with the EN / FR / ع selector at the top right. Arabic switches the whole layout to right-to-left.',
        'Check the project shown in the header switcher. Every screen works on the selected project; change it at any time.',
    ])
    doc.add_heading('The navigation shell', level=2)
    bullets(doc, [
        ('Menu groups. ', 'Work, Governance, Records, Insight, Intelligence, Design and Organization. Select a group title to collapse or expand it.'),
        ('Favorites. ', 'Point at a menu item and select the star; favorites appear in the first group.'),
        ('Dock and pin. ', 'The buttons at the bottom of the menu dock it at the start, end, top or bottom, and pin or unpin it. Unpinned, the menu slides in from the edge handle.'),
        ('Mobile. ', 'Below tablet width the menu becomes a drawer opened with the menu button; Escape closes it.'),
        ('Alerts bell. ', 'Shows the number of unread alerts of the project; select it to open the notification center.'),
    ])
    doc.add_heading('How a lifecycle runs', level=2)
    para(doc, 'Each project runs the end-to-end (E2E) processes of its management system in order, from E2E-01 Context To Strategy to E2E-12 Correction To Innovation. An E2E phase groups macro processes (MP); each macro process is made of tasks, and each task of workflow steps. Every step has one input form. When all steps of a phase are complete, its gate is decided (Go, Hold or No-Go) after the gate checklist is ticked.')
    numbered(doc, [
        'Open Lifecycle and select the phase card (E2E-01 first).',
        'Select a macro process in the table to see its tasks and steps.',
        'Select a step. Read What to record, fill in the fields as shown in this guide, then select Complete step. Use Save draft to keep partial input.',
        'The application moves you to the next step. When a phase is complete, tick its gate checklist and record the gate decision (top management or the IMS Manager).',
        'To correct a completed step, select Reopen and type a justification; the previous value is kept as a version. A step cannot be reopened once its phase gate is passed.',
    ])
    doc.add_heading('Input forms', level=2)
    para(doc, 'Twenty form kinds cover the 1,572 steps of the process design. Lists of items are record tables: add, edit or delete one row per item, each with its own source. The table lists the fields of each kind; required fields are marked with an asterisk on screen.')
    table(doc, ['Form', 'Fields'], [[a, b] for a, b in FORMS], [4.5, 13.5], size=9.5, bold_first=True)
    doc.add_heading('The step page', level=2)
    bullets(doc, [
        ('Name and description. ', 'Every task and step name starts with a verb and names its object (for example "Fix quality policy review periodicity"). Under the name, a brief description; select Show the detailed description for the purpose, how to fill the form, the inputs, the expected result and the ISO clause.'),
        ('Record tables. ', 'Select Add a row, fill each column, and use the bin to delete a row. People come from the organization structure (OBS); organization units can be picked or typed; KPIs are chosen from the project list or created with New KPI.'),
        ('Records produced. ', 'On completion, plans and review decisions become actions of the Action plan, SMART objectives become entries of the objectives register, and the RACSI is written to the RACSI matrix. The step shows links to these records.'),
        ('Documents of this step. ', 'Select Generate document, choose a template (suggested for the macro process first): the document is created as a draft, filled with the data already recorded in the project, and follows the review and approval workflow. Download it in PDF or Word from the step.'),
        ('Attachments. ', 'Attach files to the step; select New version on a file to replace it while keeping the history (version, author, date, note).'),
        ('AI assistance. ', 'Only the AI use case of this step is shown. Select View prompt to read exactly what is sent (step, form, values already typed, previous steps), then Suggest. Accept, edit or reject: nothing is saved without you.'),
    ])
    doc.add_heading('Macro process page', level=2)
    bullets(doc, [
        ('Before you start. ', 'An optional checklist lists the inputs, previous macro processes, owner and RACSI, document templates and KPIs to have in place. Items checked by the system are ticked automatically; tick the others yourself.'),
        ('RACSI. ', 'The RACSI tab shows the RACSI of the macro process in five columns (R, A, C, S, I; exactly one A). It applies to all steps; select Set a step-level RACSI only for a step that differs.'),
        ('BPMN diagram. ', 'Select Full screen to see the diagram on the whole screen; select Exit full screen or press Escape to come back.'),
    ])
    doc.add_heading('Documents and templates', level=2)
    numbered(doc, [
        'Open Records › Documents. The Documents tab lists the documented information with its version, status, next review and download buttons (PDF, Word, Excel).',
        'The Required by the standards tab lists the documented information that ISO 9001, ISO 14001 and ISO 45001 require for the standards of the project ("maintain" = a document, "retain" = a record), and the document that answers each one. Select Create for a missing one.',
        'The Templates tab lists the IMS templates (policy, scope, manual, context analysis, registers, procedures, plans, reports). Select a template to see its structure; select Copy to edit to adapt the sections and texts for your organization, or New template to create one.',
        'The Layout tab sets the logo, colors, header and footer applied to every generated document, like a Word template.',
        'Documents follow market practice: the policy is a signed statement with the strategic axes and their objectives; procedures contain BPMN diagrams, the SIPOC of each step and the Go / No-Go decision of the phase; each audit has its own report with the detailed nonconformities; each major nonconformity has an 8D report; registers are laid out landscape.',
        'Open a document to see its structure section by section, edit its title and review frequency, create a new version (regenerated from the current project data or copied), edit the structure of a draft, submit, approve (by another person) and download it.',
    ])
    doc.add_heading('Administration', level=2)
    bullets(doc, [
        ('Groups and organizations. ', 'The platform administrator (admin@dynamicms.example) opens Administration › Groups and organizations: New group, and New organization with the question Part of a group? (No — independent organization, or Yes — member of a group). The organization is created with its administrator and a default structure (head office and departments).'),
        ('AI models. ', 'Administration › AI models: choose a standard provider and model (Anthropic Claude, OpenAI, Azure OpenAI, Google Gemini, Mistral) or a custom model with an OpenAI-compatible endpoint, type the API key (stored encrypted), test the connection and enable it. A use case can use another model of the same provider. Without a provider, the built-in engine answers.'),
    ])
    deck = os.path.join(BUILD, 'deck-en')
    doc.add_heading('Search', level=2)
    bullets(doc, [
        ('Search button. ', 'The Search button is at the top of the left menu, in every dock position; when the menu is unpinned, a round Search button stays on the edge. Ctrl+K (Cmd+K on a Mac) opens the search from any screen.'),
        ('What is searched. ', 'Steps and macro processes of the project, nonconformities, actions, audits, documents, register entries, attachments, risks, KPIs, rules and controls, AI use cases, people, units and roles, the process design and the Help topics. Codes such as MP-001.2 or NC-… are matched exactly and listed first.'),
        ('Results. ', 'Results are grouped by type and can be filtered by type; use the arrow keys and Enter, or select a result to open it. You only see what you are allowed to open.'),
        ('Menu filter. ', 'Type in the field under the Search button to filter the menu items; press Enter to search everywhere for the same words.'),
    ])
    image(doc, os.path.join(deck, 'f-search.png'), 16, 'Figure — Global search: results grouped by type, with the words found highlighted.')
    doc.add_heading('Process design editor', level=2)
    numbered(doc, [
        'Open Design › Process design editor and choose the element type: functions, end-to-end processes (phases), macro processes, tasks, steps, gates or checklists. For tasks and steps, choose the macro process.',
        'Select an element to open it. The card shows how many project runs, child elements, documents and AI use cases use it.',
        'Change the fields and type a change note, then select Save as new version. Every change is a new version; nothing is overwritten.',
        'Select History to see every version with its author, date and note, compare two versions field by field, and restore any version (a restore creates a new version with the old content).',
        'Select New element to create your own function, phase, macro process, task, step, gate or checklist. Steps and tasks must be named with a verb and their object.',
        'Select Retire or delete: an element of your own that no project uses is deleted (and can be restored from its history); a reference element, or one used by projects, is retired.',
    ])
    callout(doc, 'Projects keep the version of the process design they started with. A change applies to the projects started after it; the steps of a new project then show the new names and descriptions.', 'Versions and running projects.')
    image(doc, os.path.join(deck, 'f-design-edit.png'), 16, 'Figure — Editing a step: fields, usage, change note and history.')
    doc.add_heading('Roles and functions', level=2)
    bullets(doc, [
        ('Model. ', 'The organization structure (OBS) is made of units, roles and people. A role is defined in a unit and linked to one or more functions (for example Quality Management and Documentation & Knowledge). A person can play several roles, as holder, deputy or acting, with an allocation and start and end dates.'),
        ('Views. ', 'Organization › Roles and functions shows the roles (unit, functions, people), the functions (roles and people of each function) and the people (roles each person plays). Vacant roles are flagged.'),
        ('Changes. ', 'New role, Edit and Retire create versions of the role (History to compare and restore). Assign adds a person to a role; End assignment closes it and lists the open actions of the person that need a new owner.'),
        ('Access rights. ', 'A role proposes an access role to its holders, but access is always decided by the permission matrix.'),
    ])
    image(doc, os.path.join(deck, 'f-roles.png'), 16, 'Figure — Roles and functions: roles with their functions and the people who play them.')
    doc.add_heading('Prompt specification of the AI use cases', level=2)
    para(doc, 'Every AI use case is linked to the step it assists and carries its prompt as twelve separate fields, populated for that step: Role (persona), Context, Task (instruction), Inputs (variables), Knowledge sources, Constraints, Examples, Output format, Tone and language, Quality criteria, Human checkpoint and Model parameters.')
    numbered(doc, [
        'Open Intelligence › AI use cases, select a use case, then Prompt specification.',
        'Edit any field and select Save changes: each field changed gets its own version, and the whole prompt a new version.',
        'Select History on a field to compare and restore one of its versions, or History of the whole prompt to restore a complete version.',
        'The completeness bar shows the required fields (role, context, task, constraints, output format, human checkpoint). A use case with an incomplete specification cannot be activated.',
        'Select View the assembled prompt to see what is sent to the model, section by section.',
    ])
    image(doc, os.path.join(deck, 'f-prompt.png'), 16, 'Figure — Prompt specification: one field per aspect, each with its history.')
    doc.add_heading('Audits: frequency and detailed findings', level=2)
    bullets(doc, [
        ('Frequency. ', 'When you plan an audit, choose its frequency in the list (monthly, quarterly, semi-annual, annual, every 2 years, every 3 years) or Custom and describe it (for example "once, 6 weeks before the certification audit"). Change it later on the audit page.'),
        ('Findings. ', 'A finding is graded major nonconformity, minor nonconformity, observation or opportunity for improvement, with the clause, the requirement, the objective evidence and, for a nonconformity, the response due date (30 days for a major, 60 for a minor by default) and the corrective action.'),
        ('Reports. ', 'Each audit carried out has its own internal audit report with the detailed report of every nonconformity; each major or critical nonconformity has an 8D corrective action report.'),
    ])
    image(doc, os.path.join(deck, 'f-audit-detail.png'), 16, 'Figure — An audit: scope, criteria, frequency and graded findings with their objective evidence.')
    doc.add_heading('Registers', level=2)
    para(doc, 'Records › Registers holds the registers of the project, including measuring equipment, training records, communication plan and log, changes, control plan, requirement reviews, releases, nonconforming outputs and 8D reports. Select an entry to see all its fields.')
    image(doc, os.path.join(deck, 'f-register-entry.png'), 14, 'Figure — A measuring equipment entry with all its fields.')


def users_table(doc, data):
    doc.add_heading('Accounts of the organization', level=3)
    para(doc, 'All accounts use the password Demo@2026. Sign in with the account whose role owns the step you want to complete; the IMS Manager and process owners can complete any step.')
    table(doc, ['Role', 'Name', 'E-mail to type'], [[u['role'], u['name'], u['email']] for u in data['users']], [6, 4.5, 7.5], size=9.5)


def records_section(doc, data, prefix):
    r = data['records']
    doc.add_heading(f'{prefix}Records created along the run', level=2)
    para(doc, 'Besides the workflow steps, the run creates records in the Records and Governance menus. The examples below are the ones seeded in the demonstration; type the same values to reproduce them.')
    if r['ncs']:
        n = r['ncs'][0]
        doc.add_heading('Report a problem (nonconformity)', level=3)
        numbered(doc, ['Open Records › Nonconformities and select Report a problem.', f"Title: type “{n['title']}”.", f"Description: type “{n['description']}”.", f"Source: choose {n['source']}. Criticality: choose {n['criticality']}.", 'Select Submit. A Critical problem raises an alert to the Quality Manager and top management.',
                        'Open the nonconformity and select Move to Analysis, then type the root cause' + (f" (“{n['rootCause']}”)" if n['rootCause'] else '') + '.',
                        'Select Add action: type the title, choose an owner and a different evaluator, and a due date.',
                        'When all actions are closed, move to Verification then Closed; type the lessons learned (what went well, what did not, recommendation).'])
    if r['risks']:
        doc.add_heading('Record a risk', level=3)
        k = r['risks'][0]
        numbered(doc, ['Open Governance › Risks and opportunities and select Add.', f"Title: “{k['title']}”; kind {k['kind']}; likelihood {k['l']}; impact {k['i']}.", f"Treatment: “{k['treatment'] or 'Reduce'}”, then select Save. The heatmap updates immediately."])
        table(doc, ['Code', 'Kind', 'Title', 'L × I'], [[x['code'], x['kind'], x['title'], f"{x['l']} × {x['i']} = {x['l'] * x['i']}"] for x in r['risks']], [2.2, 2.2, 11, 2.6], size=9.5)
    if r['kpis']:
        doc.add_heading('Record a KPI measurement', level=3)
        k = r['kpis'][0]
        numbered(doc, [f"Open Governance › KPIs and select {k['code']} — {k['name']}.", f"In Record a measurement, type the period (for example 2026-09) and the value (for example {k['last']}); target {k['target']}.", 'Select Record. A value off target raises a KPI alert to the Performance Manager and the IMS Manager.'])
    if r['audits']:
        doc.add_heading('Audit programme', level=3)
        table(doc, ['Code', 'Audit', 'Standard', 'Planned', 'Status'], [[a['code'], a['title'], a['standard'], a['planned_date'], a['status']] for a in r['audits']], [3.6, 7, 3.4, 2.2, 1.8], size=9)
        para(doc, 'To add a finding: open the audit, select Add finding, choose the type (Major, Minor, Observation, OFI), type the clause and the finding; for Major and Minor choose the action owner and a different evaluator.')
    if r['documents']:
        doc.add_heading('Documented information generated from the templates', level=3)
        para(doc, 'Every document below is generated from an IMS template and filled with the data of this run (issues, interested parties, objectives, RACSI, KPIs, risks, audits, nonconformities...). Open Records › Documents and select Download to get it in PDF, Word or Excel.')
        table(doc, ['Code', 'Title', 'Template', 'Version', 'Status'], [[d['code'], d['title'], d.get('template_id') or '—', d['current_version'], d['status']] for d in r['documents']], [4.6, 7.2, 2.6, 1.4, 2.2], size=8.5)
        para(doc, 'To revise a document: open it, select New version, choose Minor or Major, type the summary of change and choose whether to regenerate the content from the current project data; then Submit for review. Another user approves and publishes it; the author cannot approve their own version.')
    doc.add_heading('Export the management review report', level=3)
    numbered(doc, ['Open Insight › Reports.', 'Choose the format (PDF, Excel, Word or CSV) and the language.', 'Select Download on Management review input. The report compiles objectives, KPIs, audit results, nonconformities and phase status.'])


def scenario(doc, n, title, data, shots_code):
    p = data['project']; o = data['org']
    doc.add_heading(f'Scenario {n} — {title}', level=1)
    para(doc, f"Organization: {o['name']} ({o['code']}), {o['size']} company, vertical {o['sector']}, {o['employees']} employees" + (f", member of {o['group']}" if o['group'] else ', independent organization') + '.')
    para(doc, f"Project: {p['code']} — {p['name']}. Management system {p['ms']}, mode {p['mode']}" + (f", track {p['track']}" if p['track'] else '') + f". Standards: {', '.join(p['standards'])}. Start {p['start']}, end {p['end']}.")
    para(doc, f"Configuration: Solution Pack {o['pack']}" + (f", industry pack {', '.join(o['industry'])}" if o['industry'] else '') + f", capability packs {', '.join(o['caps']) or '—'}, add-ons {', '.join(o['addons']) or '—'}.")
    shot(doc, shots_code, 'home', f"Figure — Home dashboard of {p['code']}: progress by phase, KPI trend and next steps.")
    doc.add_heading('Before you start', level=2)
    users_table(doc, data)
    doc.add_heading('Create the project', level=3)
    crit = data.get('criteria') or []
    if p['creation'] == 'catalog':
        numbered(doc, ['Sign in as the IMS Manager (or the Quality Manager) and open Organization › New project.', 'Select From the catalog.',
                       f"Name: type “{p['name']}”. Management system: {p['ms']}. Start date: {p['start']}.",
                       f"Template: choose {data['template']['code']} — {data['template']['name']}." if data.get('template') else 'Template: choose the template of your vertical.',
                       'Complexity score: set each criterion level as listed below, then select Create project.'])
    elif p['creation'] == 'ai':
        numbered(doc, ['Sign in as the IMS Manager and open Organization › New project.', 'Select With AI.',
                       f"Short description: type “{p['ms']} certification for {o['name']} before the customer audit, with a small team.”", 'Select Draft the project, keep the suggested items ticked, select Apply accepted items.',
                       f"Name: type “{p['name']}”; check the track ({p['track']}) and the complexity levels below, then select Create project."])
    else:
        numbered(doc, ['Sign in as the IMS Manager and open Organization › New project.', 'Select Manual.', f"Name: type “{p['name']}”. Management system: {p['ms']}. Start date: {p['start']}.",
                       'Tick the phases that need a gate (for an SME, the track decides: Light E2E-01 and E2E-10; Standard adds E2E-04 and E2E-09; Advanced adds E2E-03 and E2E-08).', f"Set the complexity levels below and keep the recommended track ({p['track']}); select Create project."])
    if crit:
        table(doc, ['Criterion', 'Weight', 'Level to choose'], [[c['code'], str(c['weight']), str(c['level'])] for c in crit], [6, 4, 8], size=9.5)
        para(doc, f"Resulting complexity score: {data['score']['score'] if data.get('score') else ''} / 100" + (f"; recommended track {data['score']['recommended_track']}, chosen {data['score']['chosen_track']}." if data.get('score') and data['score'].get('recommended_track') else '.'))
    callout(doc, 'The demonstration database already contains this project with its full run. To practise, create a copy with another name, or open the seeded project and follow the steps that are still open.', 'Note.')
    shot(doc, shots_code, 'lifecycle', 'Figure — Lifecycle screen: phase cards with progress and gate status.')
    total = sum(len(t['steps']) for ph in data['phases'] for m in ph['mps'] for t in m['tasks'])
    doc.add_heading('Run the lifecycle, phase by phase', level=2)
    para(doc, f"The run has {len(data['phases'])} phases, {sum(len(ph['mps']) for ph in data['phases'])} macro processes and {total} steps. For each step the tables give the step identifier, the responsible role, the form and what to type in each field. Values between quotes are typed as shown; choose list values as written.")
    first_step_shot = True
    for ph in data['phases']:
        doc.add_heading(f"{ph['id']} — {ph['name']}", level=2)
        para(doc, ph['goals'], 'Goals: ')
        para(doc, f"{ph['trigger']} → {ph['terminal']}", 'From trigger to terminal event: ')
        for mp in ph['mps']:
            doc.add_heading(f"{mp['code']} ({mp['id']}) — {mp['name']}", level=3)
            para(doc, f"{mp['goal']} Owner: {mp['owner']}. Tier {mp['tier']}." + (f" Requirements answered: {mp['clauses']}." if mp.get('clauses') else ''), size=11)
            if mp.get('documents'):
                para(doc, '; '.join(f"{d['code']} ({d['title']})" for d in mp['documents'][:6]) + '.', 'Documents of this macro process: ', size=10)
            rows = []
            details = []
            for tk in mp['tasks']:
                for s in tk['steps']:
                    typed = []
                    for f in s['type_']:
                        if f.get('columns') is not None:
                            n = len(f.get('rows') or [])
                            if f['type'] == 'racsi':
                                r0 = (f.get('rows') or [[]])[0]
                                typed.append((f"{f['field']}: ", ' · '.join(f"{k}: {v}" for k, v in zip(f['columns'], r0) if v) or '—'))
                            else:
                                typed.append((f"{f['field']}: ", f"{n} row{'s' if n != 1 else ''} — see the table below" if n else '—'))
                                if n:
                                    details.append((s, f))
                        else:
                            typed.append((f"{f['field']}: ", f.get('value') or '—'))
                    if s.get('creates'):
                        typed.append(('On completion: ', ' and '.join('rows become actions' if c == 'actions' else 'rows become objectives' for c in s['creates']) + '.'))
                    rows.append([s['id'], [s['name'], ('Task: ', tk['name']), s['brief']], [s['role'], s['form']], typed])
            table(doc, ['Step', 'Step, task and purpose', 'Role · form', 'What to type'], rows, [1.9, 5.0, 3.1, 8.0], size=8.5)
            for s, f in details:
                cols = f['columns']
                w = [0.7] + [max(1.6, (17.3 / len(cols)) * (1.5 if any(k in c for k in ('Description', 'Facts', 'message', 'Finding', 'Why', 'objective')) else 0.85)) for c in cols]
                tot = sum(w); w = [x * 18 / tot for x in w]
                para(doc, f"{s['id']} — {s['name']} · {f['field']}", size=9.5, bold_lead=None)
                table(doc, ['#'] + cols, [[str(i + 1)] + [str(x) for x in r] for i, r in enumerate(f['rows'])], w, size=8)
            if first_step_shot:
                shot(doc, shots_code, 'step', 'Figure — A step form with a record table: one row per item, each with its own source; add, edit or delete rows.')
                first_step_shot = False
        if ph['gate']:
            g = ph['gate']
            doc.add_heading(f"Gate — {g['name']}", level=3)
            para(doc, g['exit'], 'Exit criteria: ')
            items = [f"{it['text']}{' (mandatory' + (', evidence required' if it['evidence'] else '') + ')' if it['mandatory'] else ''}" for cl in g['checklists'] for it in cl['items']]
            numbered(doc, ['Open Lifecycle and select the phase card; the gate panel is on the right.'] + [f'Tick “{x}”.' for x in items] + ['Sign in as Top Management (ceo@…) or the IMS Manager and select Go. For Hold or No-Go, type a comment explaining why.'])
        else:
            para(doc, 'This phase has no gate for the project track; it closes when its last step is completed.', italic=True)
    records_section(doc, data, '')
    shot(doc, shots_code, 'ncs', 'Figure — Nonconformity register of the project.')
    shot(doc, shots_code, 'documents', 'Figure — Documents: documented information generated from the templates, with versions and downloads.')
    shot(doc, shots_code, 'reports', 'Figure — Reports: choose the format and language, then download.')


def build(file_no, title, subtitle, scenarios, fname, example_email):
    doc = new_document(title, f'DynamicMS — User Guide {file_no}')
    cover(doc, f'User Guide {file_no}', title, subtitle, 'POWERACT Consulting · DynamicMS 1.0 · September 2026')
    toc(doc)
    doc.add_heading('About this guide', level=1)
    para(doc, 'This guide, written by POWERACT Consulting, walks through complete runs of a management system in DynamicMS: every end-to-end phase, macro process, task and step, with the values to type in each form. The values come from the demonstration data seeded with the application, so the screens match the guide.')
    bullets(doc, [('Audience. ', 'IMS, quality and HSE managers, process owners, auditors and top management.'),
                  ('Conventions. ', 'Menu paths are written Menu › Screen. Values to type are shown after the field name; list values are chosen as written.'),
                  ('Scenarios. ', '; '.join(f'Scenario {i + 1}: {s[0]}' for i, s in enumerate(scenarios)) + '.')])
    getting_started(doc, example_email)
    for i, (stitle, code) in enumerate(scenarios, 1):
        data = json.load(open(os.path.join(BUILD, f'{code}.json'), encoding='utf8'))
        page_break(doc)
        scenario(doc, i, stitle, data, code)
    page_break(doc)
    doc.add_heading('Appendix — Frequent questions', level=1)
    table(doc, ['Question', 'Answer'], [
        ['I cannot complete a step.', 'The step is assigned to another role, or its phase gate is passed. Sign in with the role shown on the step, or ask the IMS Manager.'],
        ['The Go button is disabled.', 'Some steps of the phase are still open. The gate panel shows how many.'],
        ['Can the same person own and evaluate an action?', 'No. The application refuses it on screen and on the server.'],
        ['Where are my changes recorded?', 'Every change is written to the audit trail (Administration › Audit trail) and versioned records keep their history.'],
        ['Does the AI send my data outside?', 'Only if your administrator enables an external language model in Administration › AI models. Otherwise answers are built from DynamicMS content and your records. View prompt shows what would be sent.'],
        ['Where are the records produced by a step?', 'The step shows them under Records produced by this step and Documents of this step: actions (Action plan), objectives (Registers), RACSI (RACSI matrix), KPI values (KPIs) and documents (Documents).'],
    ], [6, 12], size=10, bold_first=True)
    path = os.path.join(OUT, fname)
    doc.save(path)
    print('saved', path)


if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if which in ('1', 'all'):
        build(1, 'Universal — Large and Big Companies', 'Scenario 1 Universal QMS · Scenario 2 Universal QHSE',
              [('Universal QMS (ISO 9001)', 'HZ-UNI-QMS'), ('Universal QHSE (ISO 9001, 14001, 45001)', 'HZ-UNI-QHSE')], 'DynamicMS_User_Guide_1_Universal_Large.docx', 'quality@horizon-universal.example')
    if which in ('2', 'all'):
        build(2, 'Small and Medium Enterprises', 'Scenario 1 SME QMS · Scenario 2 SME QHSE · Scenario 3 SME QMS for AEC & Construction',
              [('SME QMS, any sector (ISO 9001)', 'AT-UNI-QMS'), ('SME QHSE (ISO 9001, 14001, 45001)', 'AT-UNI-QHSE'), ('SME QMS for AEC & Construction (ISO 9001, ISO 19650, EN 1090)', 'NV-AEC-QMS')], 'DynamicMS_User_Guide_2_SME.docx', 'ims@atlas-sme.example')
