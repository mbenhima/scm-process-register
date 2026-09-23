"""Builds the CortexPLM User Guide (.docx) from the walkthrough log written by run-scenarios.mjs.
Run: python3 build_user_guide.py scenario-log.json screenshots-dir out.docx"""
import json, os, sys
from docstyle import new_document, header_footer, cover, toc, h1, para, bullets, numbered, table, callout, figure

GATE_NAMES = {'T-1': 'T-1', 'T0': 'T0', 'T1': 'T1', 'T2': 'T2', 'T3': 'T3', 'T4': 'T4', 'T5': 'T5', 'T6': 'T6'}
CRITERIA = [('strategic', 'Strategic impact'), ('investment', 'Investment level'), ('novelty', 'Technical novelty'), ('regulatory', 'Regulatory and safety exposure'),
            ('market', 'Market scope'), ('reach', 'Cross-functional reach'), ('integration', 'Product-service integration')]
PROJECTS = {  # what is typed in the New project wizard (mirrors scenarios.mjs)
    1: dict(name='Online Parking Permit Renewal', description='Residents renew their parking permit online in under five minutes, without visiting a counter.', offer='Service', region='Metro City', scores=[2, 1, 2, 2, 1, 2, 1], safety=False),
    2: dict(name='Real-time Bus Crowding Indicator', description='Shows how full the next bus is in the passenger app, using existing automatic passenger counters.', offer='Product-Service', region='Orvane network', scores=[2, 2, 2, 1, 2, 2, 2], safety=False),
    3: dict(name='Lactose-free Greek Yogurt 500 g', description='A lactose-free strained yogurt for the national retail chains, made on the existing cup line.', offer='Product', region='National retail', scores=[3, 3, 2, 3, 3, 3, 2], safety=False),
    4: dict(name='Remote Cardiac Monitoring Patch', description='A wearable ECG patch that sends arrhythmia alerts to the cardiology team.', offer='Product-Service', region='Meridale hospitals', scores=[5, 4, 4, 5, 3, 4, 4], safety=True),
}


def fmt(v):
    if isinstance(v, float) and v.is_integer(): v = int(v)
    return str(v)


def field_text(fields):
    if not fields: return '—'
    out = []
    for f in fields:
        if f['type'] == 'date': out.append(f"{f['label']}: **{f['value']}** (any future date)")
        else: out.append(f"{f['label']}: **{fmt(f['value'])}**")
    return '\n'.join(out)


def sign(doc, who, email):
    para(doc, f'Sign in as **{email}** (password **Demo#2026**), the {who}.', align='left')


def phase_blocks(steps):
    """Groups consecutive steps of the same E2E run into phases; decisions close the phase."""
    blocks, cur = [], None
    for s in steps:
        if s['type'] == 'decision':
            if cur is None: cur = {'e2e': s['e2e'], 'steps': []}
            cur['decision'] = s; blocks.append(cur); cur = None; continue
        key = (s['e2e'], s['runNo'])
        if cur is None or cur['key'] != key:
            if cur is not None: blocks.append(cur)
            cur = {'key': key, 'e2e': s['e2e'], 'name': s['e2eName'], 'runNo': s['runNo'], 'branch': s.get('branch'), 'steps': []}
        cur['steps'].append(s)
    if cur is not None: blocks.append(cur)
    return blocks


def write_phase(doc, run, b, n, pm_email, exec_email, exec_name):
    work = [s for s in b['steps'] if s['type'] == 'work']
    checklists = [s for s in b['steps'] if s['type'] == 'checklist']
    dec = b.get('decision')
    title = b.get('name') or ''
    extra = f" (run {b['runNo']})" if b.get('runNo', 1) > 1 else ''
    branch = f" · Branch {b['branch']}" if b.get('branch') else ''
    doc.add_heading(f"Step {n}. {b['e2e']} {title}{extra}{branch}", 3)
    if work:
        para(doc, f'Open the project, tab **Lifecycle & tasks**, card **{b["e2e"]}**. Open each task in turn, fill in the fields shown, type the **Result / output**, then select **Complete task**. '
                  'In the **Record a lesson learned** window that follows, select **Skip**.', align='left')
        rows = []
        for i, s in enumerate(work, 1):
            name = f"{s['uft']} {s['name']}" + (' (light form, Rule R1)' if s.get('light') else '')
            if s.get('skipped'):
                rows.append((str(i), name, 'Select **Skip (Rule R2)**. Reason: **' + s['skipReason'] + '**', 'Select **Skip task**.'))
            else:
                rows.append((str(i), name, field_text(s.get('fields')), f"**{s['output']}**"))
        table(doc, ['#', 'Task', 'Fields to fill', 'Result / output to type'], rows, widths=[0.3, 1.75, 2.2, 2.52], size=9)
        eff = [e for s in work for e in (s.get('effects') or [])]
        if eff:
            callout(doc, ' '.join(f'{e}' for e in eff), 'What you will see')
        ev = [s for s in work if s.get('evaluation')]
        for s in ev:
            para(doc, f"Evaluation example: {s['evaluation']['by']} is the evaluator of **{s['name']}**. Sign in as **{exec_email}**, open **My tasks**, filter **To evaluate**, open the task, choose Verdict **Effective**, type Notes **{s['evaluation']['notes']}** and select **Record evaluation**. Then sign in again as **{pm_email}**.", align='left')
    for c in checklists:
        mand = [it for it in c['items'] if it['mandatory']]
        para(doc, f"Open the task **{c['name']}**. The gate {c['gate']} checklist has {len(c['items'])} items; {len(mand)} are **Mandatory**. For each mandatory item, type the evidence reference below in its field and select **Mark complete**. Optional items can stay open. Then select **Complete checklist task** (and **Skip** in the lesson window).", align='left')
        code = run['code']
        table(doc, ['Item', 'Checklist item (mandatory)', 'Evidence reference to type'],
              [(str(it['seq']), it['text'], f"**{code}-{c['gate']}-{it['seq']:02d}**") for it in mand], widths=[0.5, 4.1, 2.17], size=9)
    if dec:
        g = dec['gate']
        para(doc, f"Submit the gate: on the project page, card **Gate {g}**, select **Submit gate for decision**. Sign out.", align='left')
        if dec['decision'] == 'Recycle':
            numbered(doc, [
                f'Sign in as **{exec_email}** ({exec_name}, Executive Sponsor) and open **Gate board**.',
                f'Open the {g} line of **{run["code"]}**.',
                'Under **Decision**, select **Recycle**. Under **Tasks to rework**, tick **' + ', '.join(dec['recycle']) + '**.',
                f'In **Rationale**, type **{dec["rationale"]}**, then select **Record decision**.',
                f'Sign in again as **{pm_email}**. The reworked task is back to **To do**, and so are the checklist and gate tasks. Complete the task again with the same values, complete the checklist task again (items already complete stay complete), then submit the gate again.',
            ])
        else:
            steps = [f'Sign in as **{exec_email}** ({exec_name}, Executive Sponsor) and open **Gate board**.', f'Open the {g} line of **{run["code"]}**.', 'Under **Decision**, keep **Go**.']
            if dec.get('nextPath'):
                steps.append('Under **Next path (E2E-08)**, select **' + ('Relaunch (Branch A)' if dec['nextPath'] == 'A' else 'Retire (Branch B)') + '**.')
            steps.append(f'In **Rationale**, type **{dec["rationale"]}**, then select **Record decision**.')
            started = dec.get('started') or []
            steps.append('Result: ' + (f"**{', '.join(started)}** start{'s' if len(started) == 1 else ''} automatically." if started else 'no further process starts; see the result of the run below.') + f' Sign in again as **{pm_email}** to continue.')
            numbered(doc, steps)


def run_section(doc, run, shots):
    rid = run['id']
    h1(doc, f"{4 + rid}. Run {rid}: {run['title']}")
    para(doc, run['summary'])
    info = [('Organization', f"{run['org']} ({run['industry']})"), ('Product Manager', f"{run['pm']['name']} · **{run['pm']['email']}**"),
            ('Executive Sponsor', f"{run['exec']['name']} · **{run['exec']['email']}**"), ('Project', f"**{run['code']}** {run['name']}")]
    if run.get('created'): info.append(('Track', f"{run['created']['track']} (total score {run['created']['total']} of 35)"))
    info.append(('End state', run['final']['status'] + (f" · NPV {run['final']['npv']} kUSD, ROI {run['final']['roi']}%" if run['final'].get('npv') is not None else '')))
    table(doc, ['Item', 'Value'], info, widths=[1.7, 5.07])
    n = 1
    if run.get('setup'):
        doc.add_heading(f'Step {n}. Prepare the Light Track observation period', 3); n += 1
        numbered(doc, [
            f"Sign in as **{run['setup']['email']}** ({run['setup']['name']}, Process Owner / Track Administrator).",
            'Open **Process design > Track configuration**.',
            f"In the card **Light Track observation period (Rule R1)**, type **{run['setup']['observationDays']}** in **Observation period (days)** and select **Save**.",
            'Sign out. With 0 days, the performance review (E2E-07) starts right after the T3 Go-Live decision, so you can finish the whole run today. The default is 182 days.',
        ])
    if run.get('created'):
        p = PROJECTS[rid]
        doc.add_heading(f'Step {n}. Create the project', 3); n += 1
        sign(doc, 'Product Manager', run['pm']['email'])
        para(doc, 'Open **Innovation projects** and select **New project**. Fill in the wizard:', align='left')
        rows = [('Project name', f"**{p['name']}**"), ('Description', f"**{p['description']}**"), ('Offer type', f"**{p['offer']}**"), ('Region', f"**{p['region']}**"),
                ('Product Manager (owner)', f"keep **{run['pm']['name']}**"), ('Executive Sponsor', f"**{run['created']['sponsor']}**")]
        rows += [(label, f'select **{v}**') for (k, label), v in zip(CRITERIA, p['scores'])]
        if p['safety']: rows.append(('Safety-critical product', 'tick the box'))
        rows.append(('Step 3. Confirm the track', f"Total score {run['created']['total']} of 35: select **{run['created']['recommended']} Track · recommended**"))
        rows.append(('Step 4. Optional macro processes', 'leave all unticked'))
        table(doc, ['Field', 'What to type or select'], rows, widths=[2.3, 4.47], size=9.5)
        para(doc, f"Select **Create project**. The message reads \"Project {run['code']} created. E2E-01 has started.\" and the project page opens.", align='left')
    else:
        doc.add_heading(f'Step {n}. Open the project', 3); n += 1
        sign(doc, 'Product Manager', run['pm']['email'])
        para(doc, f"Open **Innovation projects**, type **{run['code']}** in **Filter rows** and open the project. It belongs to another product manager; as Product Manager you can complete its tasks on the owners' behalf.", align='left')
    for b in phase_blocks(run['steps']):
        write_phase(doc, run, b, n, run['pm']['email'], run['exec']['email'], run['exec']['name']); n += 1
    doc.add_heading('Result of the run', 3)
    f = run['final']
    res = {
        'Launched': 'The project status is **Launched**. The Fast Track ends at T3; performance and retirement follow the parent product (Rule R3).',
        'Retired': 'The project status is **Retired**. The whole Full Track, from idea to end of life, is recorded in the tab **History**.',
    }.get(f['status'], f"The project stays **{f['status']}**, now in {f['currentE2E']} after gate {f['currentGate']}. {run.get('finalStatus', '')}")
    para(doc, res)
    bullets(doc, [
        'Open the tab **Business case & risks** to see NPV, ROI and payback calculated from your entries (BR-002), and the risk created by "Assess Risks & Compliance".',
        'Open the tab **History** to read every change with its author and time.',
        'Open **Reports & cockpits** to see the project counted in the portfolio figures.',
    ])


def build(log_path, shots, out):
    runs = json.load(open(log_path))
    from_scen = {1: 'A low-complexity citizen service goes from idea to launch in the Fast Track: E2E-01, E2E-02 and E2E-05 with gates T-1, T0 and T3.',
                 2: 'A Fast Track feature for bus passengers. One task is skipped under Rule R2, and the board sends the T0 gate back once (Recycle) before approving it.',
                 3: 'A new dairy product runs the whole Light Track: six gate decisions, the E2E-09 market campaign, the performance review (E2E-07) with Rule R1, and a relaunch through E2E-08 Branch A that loops back to launch (E2E-05).',
                 4: 'A safety-critical medical device runs the complete Full Track: all nine E2E processes and all eight gates, ending with retirement through E2E-08 Branch B.',
                 5: 'The seeded project ENR-012 is live and waiting in its performance review. You finish its open market campaign (E2E-09) and review (E2E-07); the T5 board chooses a relaunch; E2E-08 Branch A loops back to development (E2E-04), and the improved product goes live again at T3.'}
    for r in runs: r['summary'] = from_scen[r['id']]
    doc = new_document('CortexPLM User Guide')
    cover(doc, 'User Guide', 'CortexPLM', 'Run innovation projects from idea to launch, relaunch or retirement', 'Version 1.0  ·  September 2026')
    header_footer(doc, 'CortexPLM User Guide')
    toc(doc)
    S = lambda f: os.path.join(shots, f)

    h1(doc, '1. About This Guide', new_page=False)
    para(doc, 'This guide shows how to use CortexPLM through complete, worked examples. Five runs take real projects through their whole lifecycle, in five industries and all three tracks. '
         'Every value you type is given in **bold**, exactly as you enter it. The runs were replayed on a freshly installed demonstration database, so the codes and results match what you will see.')
    table(doc, ['Run', 'Industry', 'Track', 'From', 'To', 'Gate decisions'], [
        ('1', 'Public Sector', 'Fast', 'New idea', 'Launched', 'T-1, T0, T3'),
        ('2', 'Transportation', 'Fast', 'New idea', 'Launched', 'T-1, T0 (Recycle, then Go), T3'),
        ('3', 'Agro-Business – Dairy', 'Light', 'New idea', 'Relaunched', 'T-1, T0, T1, T2, T3, T5, T3'),
        ('4', 'Healthcare', 'Full', 'New idea', 'Retired', 'T-1, T0, T1, T2, T3, T4, T5, T6'),
        ('5', 'Oil, Gas & Energy', 'Full', 'Live product', 'Relaunched', 'T5, T2, T3'),
    ], widths=[0.45, 1.6, 0.6, 1.0, 1.0, 2.12])
    callout(doc, 'Start from a fresh demonstration database (Installation Guide, "Reset the demonstration data") so the project codes match: PUB-022, TRN-022, DAI-022 and HLT-022. If you already created projects, your codes will simply have a higher number.', 'Before you start')
    doc.add_heading('1.1 Conventions', 2)
    table(doc, ['You see', 'Meaning'], [
        ('**Bold text**', 'A value to type, or a button, tab or menu item to select.'),
        ('Menu > Item', 'Open the menu group, then the item, in the navigation bar.'),
        ('UFT-01-02', 'The identifier of a user-facing task from the process reference.'),
        ('T-1 … T6', 'The eight decision gates of the phase-gate process.'),
    ], widths=[1.6, 5.17])

    h1(doc, '2. Getting Started')
    doc.add_heading('2.1 Sign in', 2)
    numbered(doc, ['Open **http://localhost:5173** in your browser.', 'Type your e-mail and password (demonstration users: password **Demo#2026**).', 'Select **Sign in**.'])
    figure(doc, S('01_login.png'), 'The sign-in page lists the demonstration accounts.')
    doc.add_heading('2.2 The dashboard', 2)
    para(doc, 'The dashboard leads with four figures: active projects, gates waiting for a decision, overdue tasks and checklist compliance. Charts below show E2E instances and gate decisions.')
    figure(doc, S('02_dashboard.png'), 'Dashboard of Metro City Digital Services Agency for a Product Manager.')
    doc.add_heading('2.3 The navigation bar: pin, slide and position', 2)
    numbered(doc, [
        'Select the **sliders** icon at the top of the navigation bar to open **Menu position**.',
        'Choose **Left**, **Right**, **Top** or **Bottom**. The menu moves at once and the choice is saved for your account.',
        'Clear **Keep the menu pinned open** to let the menu slide away. It slides back when you point at the edge of the screen. The pin icon next to the sliders does the same.',
        'Select the star next to any item to add it to **Pinned** favourites at the top of the menu. Select a group title to fold or unfold it.',
    ])
    figure(doc, S('09_nav_settings.png'), 'Menu position settings: four positions and the pin option.')
    doc.add_heading('2.4 Language', 2)
    para(doc, 'Choose **English**, **Français** or **العربية** in the language list of the top bar. Arabic switches the whole layout to right-to-left, and the navigation bar moves to the right. Your choice is saved; the organization default applies otherwise.')
    figure(doc, S('10_arabic.png'), 'The dashboard in Arabic, laid out right to left.')
    doc.add_heading('2.5 Alerts, notifications and the assistant', 2)
    bullets(doc, [
        'The **bell** in the top bar shows unread alerts, such as overdue tasks or a gate waiting too long. Open **Alerts** for the full list.',
        '**Notifications** holds your inbox and lets you choose, per category, the channels you want (in-app, e-mail, webhook, SMS, push).',
        'The round **assistant** button at the bottom of the screen answers questions about your data within your permissions, for example **How many active projects?**, and explains how to use each screen.',
    ])
    figure(doc, S('11_assistant.png'), 'The assistant answers from live organization data and says which permission it used.')

    h1(doc, '3. How a Project Moves Through CortexPLM')
    para(doc, 'Every project follows the end-to-end (E2E) processes of its track. Each E2E process is a list of tasks and ends with a gate. At the gate, the Executive Sponsor records one of four decisions.')
    table(doc, ['Track', 'Total score', 'E2E processes', 'Gates', 'Checklist items per gate'], [
        ('Fast', '7 to 14', 'E2E-01, E2E-02, E2E-05', 'T-1, T0, T3', '6'),
        ('Light', '15 to 24', 'E2E-01 to E2E-05, E2E-07, E2E-08 (relaunch only), E2E-09', 'T-1, T0, T1, T2, T3, T5', '15'),
        ('Full', '25 to 35, or any safety-critical product', 'All nine', 'All eight', '30'),
    ], widths=[0.7, 1.4, 2.4, 1.3, 0.97])
    table(doc, ['Decision', 'What happens'], [
        ('**Go**', 'The gate is passed and the next E2E process starts automatically.'),
        ('**Kill**', 'The project stops. You are invited to record a lesson learned.'),
        ('**Hold**', 'The project pauses until a re-review date. **Resume project** reopens the gate.'),
        ('**Recycle**', 'Named tasks go back to To do; the gate is reviewed again afterwards.'),
    ], widths=[1.2, 5.57])
    doc.add_heading('3.1 Who does what in the runs', 2)
    bullets(doc, [
        'The **Product Manager** creates the project, completes the tasks, completes the gate checklist and submits the gate. Each task shows its own owner (for example Finance or Marketing). In daily use each owner completes their task; in these runs the Product Manager completes them on the owners\' behalf, which the role allows.',
        'The **Executive Sponsor** records the gate decision. The project owner can never decide their own gate (control CTL-01).',
        'The **evaluator** of a task (Accountable in the RACSI matrix) rates it Effective or Not effective after completion. Evaluations do not block the process.',
    ])
    doc.add_heading('3.2 Create a project', 2)
    para(doc, 'Open **Innovation projects > New project**. Step 1 describes the project, Step 2 scores seven complexity criteria from 1 to 5, Step 3 confirms the recommended track, and Step 4 adds optional macro processes. Select **Create project**; E2E-01 starts.')
    figure(doc, S('03_wizard.png'), 'The New project wizard with the scores of Run 1 and the Fast Track selected.', width=5.2)
    doc.add_heading('3.3 Complete a task', 2)
    para(doc, 'Open the task from the project page or from **My tasks**. Fill in the fields, type the **Result / output** and select **Complete task**. A window proposes to record a lesson learned: fill it in, or select **Skip**. You may select **Start task** first to show that work has begun; it is optional.')
    figure(doc, S('04_task.png'), 'Task UFT-01-02 Assess Market Opportunity with its fields filled in.')
    doc.add_heading('3.4 Complete the gate checklist', 2)
    para(doc, 'The last task before each gate is **Complete Gate Checklist**. Every **Mandatory** item needs an evidence reference (or an attached file) before **Mark complete** works (BR-005). When all mandatory items are complete or waived, select **Complete checklist task** (BR-004).')
    figure(doc, S('05_checklist.png'), 'The T-1 checklist: mandatory items need an evidence reference.', width=5.2)
    doc.add_heading('3.5 Submit the gate and record the decision', 2)
    para(doc, 'When all tasks are done, the project page shows **Submit gate for decision** on the gate card. The Executive Sponsor then opens **Gate board**, opens the gate, chooses the decision, types a rationale and selects **Record decision**.')
    figure(doc, S('06_project_submit.png'), 'Project page: E2E-01 tasks done and the gate ready to submit.')
    figure(doc, S('07_gate_board.png'), 'Gate board: gates waiting for a decision, with the working days elapsed.')
    figure(doc, S('08_gate_decision.png'), 'Gate decision page: evidence summary on the left, decision form on the right.', width=5.2)

    h1(doc, '4. Common Values Used in the Runs')
    para(doc, 'The runs use the same patterns so you can type quickly:')
    bullets(doc, [
        'Result / output of a task: **"<task name> done for <project code>. Summary filed as <project code>-<task number>."** The exact text is given in every table.',
        'Evidence reference of a checklist item: **<project code>-<gate>-<item number>**, for example **PUB-022-T-1-01**.',
        'Dates: any future date works; the tables show the dates used in the example runs.',
        'Fields not listed in a table can stay empty.',
    ])

    for r in runs:
        if r.get('error'): continue
        run_section(doc, r, shots)

    h1(doc, '10. Messages You May Meet')
    table(doc, ['Message', 'Why', 'What to do'], [
        ('Evidence is required before this item can be marked complete (BR-005).', 'A mandatory checklist item has no evidence.', 'Type an evidence reference or attach a file, then select **Mark complete**.'),
        ('Gate submission blocked: … mandatory checklist item(s) are open (BR-004).', 'The checklist is not finished.', 'Complete or waive the mandatory items, then complete the checklist task.'),
        ('The person accountable for the project cannot record its gate decision (CTL-01).', 'You own the project.', 'Ask the Executive Sponsor or a Gate Review Board member to decide.'),
        ('Go-live is blocked: final regulatory validation reports incomplete approvals (BR-030).', 'UFT-05-08 answered **No**.', 'Once the approvals are obtained, open **Final Regulatory Validation**, select **Reopen task**, type the reason, answer **Yes**, complete the task and submit the gate again.'),
        ('Strategic-fit score below 50: the idea is parked (BR-001).', 'UFT-01-02 scored below 50.', 'The project goes On Hold for 90 days. Select **Resume project** after re-review.'),
        ('Only the task owner or a process manager can update this task.', 'You are not the owner and lack project edit rights.', 'Ask the owner, or sign in as the Product Manager.'),
        ('This E2E run has not started yet (observation period, Rule R1).', 'Light Track performance review is scheduled after launch.', 'Wait for the start date, or ask the Track Administrator to shorten the observation period.'),
    ], widths=[2.5, 1.9, 2.37], size=9)
    doc.save(out)


if __name__ == '__main__':
    build(*sys.argv[1:4])
