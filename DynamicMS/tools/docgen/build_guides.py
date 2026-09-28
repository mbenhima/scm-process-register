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
    ('Periodicity', 'Frequency (list), Next due date, Scope / notes'),
    ('Register items', 'Items identified (one per line), Source / evidence'),
    ('Assessment', 'Score 1–5 (buttons), Rationale and facts'),
    ('Decision', 'Decision (Go, No-Go, Hold), Approver (role), Comment — required for No-Go'),
    ('Document', 'Document reference, Version, Summary'),
    ('Communication', 'Audience, Channel (list), Message'),
    ('Training', 'Session, Participants, Effectiveness (%)'),
    ('Monitoring', 'Metric, Value, Target, Comment'),
    ('Plan', 'Planned activities (one per line), Start, End'),
    ('Execution', 'Evidence of execution, Completion (%)'),
    ('Assignment', 'Role (list), Person, Scope'),
    ('Configuration', 'Setting, Value, Notes'),
    ('Update', 'What changed, Reason'),
    ('Closure', 'Closure evidence, Closure date'),
    ('Escalation', 'Escalated to (role), Reason'),
    ('AI-assisted', 'Context given to the AI, Outcome (Accepted, Edited, Rejected), Final validated text'),
    ('Automatic service', 'Result (filled by the DynamicMS Engine; no input)'),
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
    para(doc, 'Seventeen form kinds cover the 1,572 steps of the process design. The table lists the fields of each kind; required fields are marked with an asterisk on screen.')
    table(doc, ['Form', 'Fields'], [[a, b] for a, b in FORMS], [4.5, 13.5], size=10, bold_first=True)


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
        doc.add_heading('Documented information', level=3)
        table(doc, ['Code', 'Title', 'Type', 'Version', 'Status'], [[d['code'], d['title'], d['doc_type'], d['current_version'], d['status']] for d in r['documents']], [4.4, 7.6, 2, 1.6, 2.4], size=9)
        para(doc, 'To revise a document: open it, select New version, choose Minor or Major, type the summary of change and the content, then Submit for review. Another user approves and publishes it; the author cannot approve their own version.')
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
            para(doc, f"{mp['goal']} Owner: {mp['owner']}. Tier {mp['tier']}.", size=11)
            rows = []
            for tk in mp['tasks']:
                for s in tk['steps']:
                    typed = [(f"{f['field']}: ", f['value'] or '—') for f in s['type_']]
                    rows.append([s['id'], [s['name'], ('Task: ', tk['name'])], [s['role'], s['form']], typed])
            table(doc, ['Step', 'Step and task', 'Role · form', 'What to type'], rows, [1.9, 4.6, 3.4, 8.1], size=8.5)
            if first_step_shot:
                shot(doc, shots_code, 'step', 'Figure — A step form: fill the fields, then select Complete step.')
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
        ['Does the AI Assistant send my data outside?', 'No. Answers are built from DynamicMS content and your records; no external AI service is called.'],
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
