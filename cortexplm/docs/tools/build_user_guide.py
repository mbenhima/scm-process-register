"""Builds the CortexPLM User Guide (.docx) from the walkthrough log written by run-scenarios.mjs.
Run: python3 build_user_guide.py scenario-log.json screenshots-dir out.docx"""
import json, os, sys
from docstyle import new_document, header_footer, cover, toc, h1, para, bullets, numbered, table, callout, figure
from guide_modules import benchmarking_run, module_scenarios

GATE_NAMES = {'T-1': 'T-1', 'T0': 'T0', 'T1': 'T1', 'T2': 'T2', 'T3': 'T3', 'T4': 'T4', 'T5': 'T5', 'T6': 'T6'}
CRITERIA = [('strategic', 'Strategic impact'), ('investment', 'Investment level'), ('novelty', 'Technical novelty'), ('regulatory', 'Regulatory and safety exposure'),
            ('market', 'Market scope'), ('reach', 'Cross-functional reach'), ('integration', 'Product-service integration')]
PROJECTS = {  # what is typed in the New project wizard (mirrors scenarios.mjs)
    1: dict(name='Online Parking Permit Renewal', description='Residents renew their parking permit online in under five minutes, without visiting a counter.', offer='Service', region='Metro City', scores=[2, 1, 2, 2, 1, 2, 1], safety=False),
    2: dict(name='Real-time Bus Crowding Indicator', description='Shows how full the next bus is in the passenger app, using existing automatic passenger counters.', offer='Product-Service', region='Orvane network', scores=[2, 2, 2, 1, 2, 2, 2], safety=False),
    3: dict(name='Lactose-free Greek Yogurt 500 g', description='A lactose-free strained yogurt for the national retail chains, made on the existing cup line.', offer='Product', region='National retail', scores=[3, 3, 2, 3, 3, 3, 2], safety=False),
    4: dict(name='Remote Cardiac Monitoring Patch', description='A wearable ECG patch that sends arrhythmia alerts to the cardiology team.', offer='Product-Service', region='Meridale hospitals', scores=[5, 4, 4, 5, 3, 4, 4], safety=True),
    5: dict(name='Green Hydrogen Refuelling Kit', description='Containerised electrolyser and dispenser that lets fleet depots refuel hydrogen trucks on site.', offer='Product-Service', region='Oman industrial zones', scores=[5, 4, 4, 4, 3, 4, 4], safety=False),
    6: dict(name='Smart Townhouse Collection', description='Townhouses sold off-plan with smart home equipment, solar roof and a resident app.', offer='Product-Service', region='Riyadh region', scores=[3, 4, 3, 3, 2, 4, 3], safety=False),
}
SUB_NAMES = {'PACK-11': 'CortexPLM Enterprise', 'BND-05': 'Innovation Bundle', 'BND-06': 'Regulated Bundle'}
MATRIX = [  # decision matrix (same text as the New project screen)
    ('Strategic impact', ['Incremental change to an existing offer', 'Improvement customers notice, same segment', 'New segment or product-line extension', 'Major extension that changes the competitive position', 'New platform or business model']),
    ('Investment level', ["Within the business unit's delegated authority", 'Up to twice the delegated authority, one budget line', 'Requires portfolio-level approval', 'Funding over several years or a large share of the portfolio budget', 'Requires executive or board approval']),
    ('Technical novelty', ['Known technology; configuration change', 'Known technologies in a new combination', 'Adaptation of existing technology', 'Technology new to the organization but proven elsewhere', 'New technology or architecture']),
    ('Regulatory and safety exposure', ['No new certification needed', 'Update of an existing declaration or file', 'Standard certifications or declarations', 'New approval by an authority or a notified body', 'Regulated or safety-critical product']),
    ('Market scope', ['One market, existing channel', 'One market, new segment or adapted channel', 'Several markets or a new channel', 'Several regions with local adaptations', 'Multi-market or global launch']),
    ('Cross-functional reach', ['1 to 2 functions', '2 to 3 functions with light coordination', '3 to 5 functions', 'More than 5 functions', 'More than 5 functions or external partners']),
    ('Product-service integration', ['Product-only or service-only change', 'Service sold separately around a product', 'Change to an existing bundle', 'New bundle of existing products and services', 'New integrated or outcome-based offer']),
]


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


def sign(doc, who, email, password='Start#2026'):
    para(doc, f'Sign in as **{email}** (password **{password}**), the {who}.', align='left')


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
        if c.get('addedTemplate'):
            at = c['addedTemplate']
            para(doc, f"This gate needs the sector items too. Open the gate (**Gate board**, line {c['gate']} of **{run['code']}**). In **Add to this checklist**, keep **From a template**, choose **{c['gate']} · Light Track · {at['name']}** and select **Add to checklist**: {at['added']} items are added, the mandatory ones marked **Mandatory**.", align='left')
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
                f'Sign in as **{exec_email}** ({exec_name}, Executive Sponsor, password **Start#2026**) and open **Portfolio > Gate board**.',
                f'Open the {g} line of **{run["code"]}**.',
                'Under **Decision**, select **Recycle**. Under **Tasks to rework**, tick **' + ', '.join(dec['recycle']) + '**.',
                f'In **Rationale**, type **{dec["rationale"]}**, then select **Record decision**.',
                f'Sign in again as **{pm_email}**. The reworked task is back to **To do**, and so are the checklist and gate tasks. Complete the task again with the same values, complete the checklist task again (items already complete stay complete), then submit the gate again.',
            ])
        else:
            steps = [f'Sign in as **{exec_email}** ({exec_name}, Executive Sponsor, password **Start#2026**) and open **Portfolio > Gate board**.', f'Open the {g} line of **{run["code"]}**.', 'Under **Decision**, keep **Go**.']
            if dec.get('nextPath'):
                steps.append('Under **Next path (E2E-08)**, select **' + ('Relaunch (Branch A)' if dec['nextPath'] == 'A' else 'Retire (Branch B)') + '**.')
            steps.append(f'In **Rationale**, type **{dec["rationale"]}**, then select **Record decision**.')
            started = dec.get('started') or []
            steps.append('Result: ' + (f"**{', '.join(started)}** start{'s' if len(started) == 1 else ''} automatically." if started else 'no further process starts; see the result of the run below.') + f' Sign in again as **{pm_email}** to continue.')
            numbered(doc, steps)


def run_section(doc, run, shots):
    rid = run['id']
    h1(doc, f"{5 + rid}. Run {rid}: {run['title']}")
    para(doc, run['summary'])
    ten = run['tenancy']; grp = ten.get('group')
    info = [('Tenancy', f"Group: **{'Yes' if grp else 'No'}**{(' (' + grp['name'] + ')') if grp else ''} > **{run['org']}** > project **{run['code']}**"), ('Organization', f"{run['org']} ({run['industry']}), e-mail domain **{ten['org']['domain']}**"), ('Product Manager', f"{run['pm']['name']} · **{run['pm']['email']}**"),
            ('Executive Sponsor', f"{run['exec']['name']} · **{run['exec']['email']}**"), ('Project', f"**{run['code']}** {run['name']}")]
    if run.get('created'): info.append(('Track', f"{run['created']['track']} (total score {run['created']['total']} of 35)"))
    info.append(('End state', run['final']['status'] + (f" · NPV {run['final']['npv']} kUSD, ROI {run['final']['roi']}%" if run['final'].get('npv') is not None else '')))
    table(doc, ['Item', 'Value'], info, widths=[1.7, 5.07])
    n = 1
    doc.add_heading(f'Step 0. Create the tenancy: Group (Yes / No), then the organization', 3)
    sign(doc, 'platform administrator', 'admin@cortexplm.example', 'Admin#2026')
    para(doc, 'Open **Portfolio > Groups, organizations & projects**.', align='left')
    steps = []
    if grp and grp.get('created'):
        steps.append(f"Select **Add group**. Type Name **{grp['name']}** and Description **{grp.get('description', '')}**, then **Save**. The group appears in the tree as **Group: Yes**.")
    elif grp:
        steps.append(f"The group **{grp['name']}** already exists (Group: Yes). You will attach the new organization to it.")
    else:
        steps.append('This organization belongs to no group: it will appear under **Group: No · Independent organizations**.')
    o = ten['org']
    steps.append('Select **Add organization** and fill in the window:')
    numbered(doc, steps)
    rows = [('Belongs to a group?', f"select **{'Yes' if grp else 'No (independent)'}**")]
    if grp: rows.append(('Group', f"select **{grp['name']}**"))
    rows += [('Name', f"**{o['name']}**"), ('Sector', f"select **{o['industry']}**"), ('Country', f"**{o['country']}**"), ('Default language', 'keep **English**'),
             ('Initial subscription', f"select **{o['subscription_id']} {SUB_NAMES.get(o['subscription_id'], '')}**"),
             ('Create the starting team', 'keep the box **ticked**'), ('E-mail domain', f"**{o['domain']}**"), ('Initial password', f"**{o['password']}**")]
    table(doc, ['Field', 'What to type or select'], rows, widths=[2.3, 4.47], size=9.5)
    para(doc, f"Select **Save**. The message reads \"Organization created with {o['users']} accounts.\" The organization receives its OBS departments, the governance catalog, the AI use case library and the checklist templates, and one account per role, for example **pm1@{o['domain']}** (Product Manager) and **exec@{o['domain']}** (Executive Sponsor). Sign out.", align='left')
    n = 1
    if run.get('setup'):
        doc.add_heading(f'Step {n}. Prepare the Light Track observation period', 3); n += 1
        numbered(doc, [
            f"Sign in as **{run['setup']['email']}** (password **Start#2026**), {run['setup']['name']}, Process Owner / Track Administrator.",
            'Open **Process design > Track configuration**.',
            f"In the card **Light Track observation period (Rule R1)**, type **{run['setup']['observationDays']}** in **Observation period (days)** and select **Save**.",
            'Sign out. With 0 days, the performance review (E2E-07) starts right after the T3 Go-Live decision, so you can finish the whole run today. The default is 182 days.',
        ])
    if run.get('created'):
        p = PROJECTS[rid]
        doc.add_heading(f'Step {n}. Create the project', 3); n += 1
        sign(doc, 'Product Manager', run['pm']['email'])
        para(doc, 'Open **Portfolio > Innovation projects** and select **New project**. Fill in the wizard:', align='left')
        rows = [('Step 0. Organization', f"shows **{run['org']}**; Belongs to a group? **{'Yes' if grp else 'No'}**"), ('Project name', f"**{p['name']}**"), ('Description', f"**{p['description']}**"), ('Offer type', f"**{p['offer']}**"), ('Region', f"**{p['region']}**"),
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
        'Open **Portfolio > Portfolio overview**: the project row shows the status of each E2E process.',
        'Open **Reports & cockpits** to see the project counted in the portfolio figures.',
    ])


def decision_matrix(doc, number):
    h1(doc, f'{number}. Decision Matrix: How to Fill In the Fields')
    para(doc, 'Use these tables whenever you are unsure which value to choose. The same scoring matrix opens in the application with the **Decision matrix** button of the New project screen.')
    doc.add_heading(f'{number}.1 Group, organization and project', 2)
    table(doc, ['Field', 'Choose', 'When'], [
        ('Belongs to a group?', '**Yes**', 'The organization is owned by, or reports to, a holding that also owns other organizations using CortexPLM, and they want to compare performance (benchmarking, group portfolio).'),
        ('', '**No (independent)**', 'The organization stands alone. Its data is never compared with anyone else.'),
        ('Create the starting team', '**Ticked**', 'A new organization that needs its people now; one account per role is created and can be renamed later.'),
        ('', '**Not ticked**', 'Accounts will be added one by one in **Users & roles**, or come from an identity provider.'),
        ('Organization of a project', 'The organization that funds and runs the project', 'A project belongs to exactly one organization; other organizations of the group only see it read-only.'),
        ('Offer type', '**Product**', 'The customer buys a physical or digital product.'),
        ('', '**Service**', 'The customer buys a service or an outcome delivered over time.'),
        ('', '**Product-Service**', 'Product and service are sold and supported together.'),
        ('Safety-critical product', '**Ticked**', 'A failure could injure people or damage property (medical device, pressure equipment, vehicle safety function). The Full Track becomes mandatory.'),
    ], widths=[1.6, 1.6, 3.57], size=9)
    doc.add_heading(f'{number}.2 Complexity scores (Step 2 of New project)', 2)
    para(doc, 'Score each criterion from 1 to 5 with the description closest to the project. When the project sits between two descriptions, take the lower score unless the evidence clearly supports the higher one.')
    table(doc, ['Criterion', '1', '2', '3', '4', '5'], [(c, *lv) for c, lv in MATRIX], widths=[1.15, 1.12, 1.12, 1.12, 1.13, 1.13], size=8)
    doc.add_heading(f'{number}.3 From total score to track', 2)
    table(doc, ['Total score', 'Recommended track', 'Rule'], [
        ('7 – 14', 'Fast Track', 'Not allowed if any criterion scores 5.'),
        ('15 – 24', 'Light Track', 'Light is the minimum when regulatory and safety exposure scores 4 or more.'),
        ('25 – 35', 'Full Track', 'Mandatory for any safety-critical product, whatever the total.'),
    ], widths=[1.3, 1.6, 3.87])
    para(doc, 'Choose another allowed track only with a reason (for example a group standard for the product family); the reason is recorded as a track override.')
    doc.add_heading(f'{number}.4 Task fields', 2)
    table(doc, ['Field (task)', 'Value', 'When'], [
        ('Idea source (UFT-01-01)', 'Internal - employee / Internal - strategy / Customer request / Market trend / Partner / Regulation', 'Where the idea first came from; choose Regulation when a new rule forces the change.'),
        ('Strategic-fit score (UFT-01-02)', '0 – 100', '80 or more: core to the strategy; 50 – 79: supports it; below 50: the idea is parked for 90 days (BR-001).'),
        ('Likelihood (UFT-01-04)', '1 – 5', '1 rare (less than once in 10 years) · 2 unlikely · 3 possible (once in the project) · 4 likely · 5 almost certain.'),
        ('Impact (UFT-01-04)', '1 – 5', '1 negligible · 2 minor delay or cost · 3 visible to customers or 10% budget · 4 regulatory breach or 25% budget · 5 safety, legal or reputational crisis.'),
        ('Regulated (UFT-01-04)', 'Yes / No', 'Yes when an authority must approve, certify or be notified before launch.'),
        ('Portfolio position (UFT-01-06)', 'Core / Adjacent / Transformational', 'Core: current customers and offers; Adjacent: new segment or channel; Transformational: new business model or market.'),
        ('Technical feasibility (UFT-02-07)', 'High / Medium / Low', 'High: done before; Medium: prototypes needed; Low: key technology not yet proven.'),
        ('All regulatory approvals obtained? (UFT-05-08)', 'Yes / No', 'Answer No while any approval is missing; go-live is then blocked (BR-030).'),
        ('Recommendation to the T5 gate (UFT-07-04)', 'Continue / Relaunch / Retire', 'Continue: on target; Relaunch: below target but fixable; Retire: demand gone or a successor exists.'),
        ('Relaunch re-entry point (UFT-08-04)', 'E2E-03 / E2E-04 / E2E-05', 'E2E-03 when the design changes, E2E-04 when only development changes, E2E-05 when only the launch is repeated.'),
    ], widths=[1.9, 1.9, 2.97], size=8.5)
    doc.add_heading(f'{number}.5 Gates, checklists, evaluations, lessons and AI', 2)
    table(doc, ['Decision', 'Choose', 'When'], [
        ('Gate decision', '**Go**', 'The evidence answers the gate question and the business case holds.'),
        ('', '**Recycle**', 'The direction is right but named evidence is missing or weak; name the tasks to redo.'),
        ('', '**Hold**', 'An outside event must happen first (budget cycle, regulator, partner); set a re-review date.'),
        ('', '**Kill**', 'The case no longer holds or the risk is unacceptable; record a lesson learned.'),
        ('Checklist item', '**Mandatory** + **Evidence required**', 'The gate cannot be passed without it and a document or reference proves it.'),
        ('', '**Waive**', 'The item does not apply to this project; a board member must approve the waiver and its reason.'),
        ('Checklist template', '**Link to the gate**', 'Every project of that track needs the items at that gate.'),
        ('', 'Not linked', 'Only some projects need the items; add them from the gate screen when needed.'),
        ('Task evaluation', '**Effective** / **Not effective**', 'Effective when the result meets its purpose without rework.'),
        ('Lesson rating', '1 – 5', '1 serious problem · 3 acceptable · 5 exemplary; use the rating for the whole experience.'),
        ('AI use case tier', '**Assistive** / **Augmented**', 'Assistive when the AI only suggests; Augmented when it drafts a result a person approves. Never autonomous.'),
        ('AI suggestion', '**Accept** / **Modify** / **Reject**', 'Accept when correct as is, Modify when useful but imperfect, Reject when wrong or unhelpful.'),
    ], widths=[1.6, 1.9, 3.27], size=9)


def build(log_path, shots, out, bench_path=None):
    runs = json.load(open(log_path))
    bench = json.load(open(bench_path)) if bench_path else None
    from_scen = {1: 'A new independent organization (Group: No) launches a low-complexity citizen service on the Fast Track: E2E-01, E2E-02 and E2E-05 with gates T-1, T0 and T3.',
                 2: 'A new group and a new organization inside it (Group: Yes). A Fast Track feature for bus passengers: one task is skipped under Rule R2, and the board sends the T0 gate back once (Recycle) before approving it.',
                 3: 'A new organization joins an existing group (Group: Yes). A new dairy product runs the whole Light Track: six gate decisions, the E2E-09 market campaign, the performance review (E2E-07) with Rule R1, and a relaunch through E2E-08 Branch A.',
                 4: 'A new independent organization (Group: No). A safety-critical medical device runs the complete Full Track: all nine E2E processes and all eight gates, ending with retirement through E2E-08 Branch B.',
                 5: 'A new organization in an existing group (Group: Yes). A green hydrogen offer runs the Full Track to launch and performance review; the T5 board chooses a relaunch; E2E-08 Branch A loops back to development (E2E-04), and the improved product goes live again at T3.',
                 6: 'A new organization joins Atlas Infrastructure Holding (Group: Yes). A real estate developer launches a new home offer on the Light Track; at gate T2 the sector checklist template "Off-plan launch readiness" is added from the library.'}
    for r in runs: r['summary'] = from_scen[r['id']]
    doc = new_document('CortexPLM User Guide')
    cover(doc, 'User Guide', 'CortexPLM', 'Run innovation projects from group and organization set-up to launch, relaunch or retirement', 'Version 2.0  ·  September 2026')
    header_footer(doc, 'CortexPLM User Guide')
    toc(doc)
    S = lambda f: os.path.join(shots, f)

    h1(doc, '1. About This Guide', new_page=False)
    para(doc, 'This guide shows how to use CortexPLM through complete, worked examples. Every run starts the same way: create the **group** (or decide there is none: Group Yes / No), create the **organization** with its team, then create the **project(s)**. '
         'Six runs then take real projects through their whole lifecycle, in six sectors and all three tracks. Every value you type is given in **bold**, exactly as you enter it. The runs were replayed on a freshly installed demonstration database, so the codes and results match what you will see.')
    table(doc, ['Run', 'Group (Yes / No)', 'Organization (sector)', 'Track', 'To', 'Gate decisions'], [
        ('1', 'No', 'Harbourview City Services (Public Sector)', 'Fast', 'Launched', 'T-1, T0, T3'),
        ('2', 'Yes, new: Meridian Mobility Holding', 'Northline Regional Transit (Transportation)', 'Fast', 'Launched', 'T-1, T0 (Recycle, then Go), T3'),
        ('3', 'Yes: Crescent Agro-Energy Group', 'Oasis Fresh Dairies (Agro-Business – Dairy)', 'Light', 'Relaunched', 'T-1, T0, T1, T2, T3, T5, T3'),
        ('4', 'No', 'Clearwater Medical Devices (Healthcare)', 'Full', 'Retired', 'T-1 to T6'),
        ('5', 'Yes: Crescent Agro-Energy Group', 'Sahara Hydrogen Energy (Oil, Gas & Energy)', 'Full', 'Relaunched', 'T-1 to T5, then T2, T3'),
        ('6', 'Yes: Atlas Infrastructure Holding', 'Palmgrove Residential Developers (Real Estate Development)', 'Light', 'Launched', 'T-1, T0, T1, T2, T3'),
        ('7', 'Yes: Atlas Infrastructure Holding', 'Ridgeway Real Estate Development (seeded)', 'All', 'Benchmarked', 'Within the organization and across the group'),
    ], widths=[0.4, 1.45, 2.05, 0.5, 0.85, 1.52], size=8.5)
    para(doc, 'Chapter 4 is the **decision matrix**: which value to choose in each field. Chapter 13 adds short scenarios for every other module, continuing in the organization created in Run 1.')
    callout(doc, 'Start from a fresh demonstration database (Installation Guide, "Reset the demonstration data") and follow the runs in order: Run 2 creates the group that Run 1 does not need, and the module scenarios use the organization of Run 1.', 'Before you start')
    doc.add_heading('1.1 Conventions', 2)
    table(doc, ['You see', 'Meaning'], [
        ('**Bold text**', 'A value to type, or a button, tab or menu item to select.'),
        ('Menu > Item', 'Open the menu group, then the item, in the navigation bar.'),
        ('UFT-01-02', 'The identifier of a user-facing task from the process reference.'),
        ('T-1 … T6', 'The eight decision gates of the phase-gate process.'),
        ('Group: Yes / No', 'Whether an organization belongs to a group of organizations.'),
    ], widths=[1.6, 5.17])

    h1(doc, '2. Getting Started')
    doc.add_heading('2.1 Sign in', 2)
    numbered(doc, ['Open **http://localhost:5173** in your browser.', 'Type your e-mail and password (seeded demonstration users: **Demo#2026**; teams created in the runs: **Start#2026**; platform administrator: **admin@cortexplm.example** / **Admin#2026**).', 'Select **Sign in**.'])
    figure(doc, S('01_login.png'), 'The sign-in page lists the demonstration accounts.')
    doc.add_heading('2.2 The menu, organized by what you do', 2)
    table(doc, ['Menu group', 'What you find there'], [
        ('Home', 'Dashboard, My tasks, Alerts, Notifications.'),
        ('Portfolio', 'Groups, organizations & projects (tenancy), Portfolio overview, Innovation projects, Gate board, WBS & Gantt, Benchmarking.'),
        ('Process design', 'End-to-end processes (with Tasks and AI), Macro processes (with the Part legend), BPMN diagrams, Checklist templates, Track configuration, Phase-gate reference, Coverage matrix.'),
        ('Governance & risk', 'Business rules, Controls (COSO), Risks & opportunities, KPIs, RACSI matrix.'),
        ('AI & knowledge', 'AI use cases, AI Assistant, Knowledge base, Lessons learned (REX), Project templates.'),
        ('Reports', 'Reports & cockpits, Data model, Role menus.'),
        ('Administration', 'Organizations, OBS & teams, Users & roles, Permission matrix, Configuration & AI model, Commercial catalog, Integrations, Licensing, Audit trail, Requirements traceability.'),
        ('Me', 'Settings (language, menu, password, live AI model) and Help.'),
    ], widths=[1.5, 5.27], size=9.5)
    para(doc, 'You only see the items your roles allow. The dashboard leads with four figures: active projects, gates waiting for a decision, overdue tasks and checklist compliance.')
    figure(doc, S('02_dashboard.png'), 'Dashboard of Harbourview City Services for its Product Manager, after Run 1.')
    doc.add_heading('2.3 The navigation bar: pin, slide and position', 2)
    numbered(doc, [
        'Select the **sliders** icon at the top of the navigation bar to open **Menu position**.',
        'Choose **Left**, **Right**, **Top** or **Bottom**. The menu moves at once and the choice is saved for your account.',
        'Clear **Keep the menu pinned open** to let the menu slide away. It slides back when you point at the edge of the screen. The pin icon next to the sliders does the same.',
        'Select the star next to any item to add it to the favourites at the top of the menu. Select a group title to fold or unfold it.',
    ])
    figure(doc, S('12_nav_settings.png'), 'Menu position settings: four positions and the pin option.')
    doc.add_heading('2.4 Language', 2)
    para(doc, 'Choose **English**, **Français** or **العربية** in the language list of the top bar. Arabic switches the whole layout to right-to-left, and the navigation bar moves to the right. Your choice is saved; the organization default applies otherwise.')
    figure(doc, S('13_arabic.png'), 'The dashboard in Arabic, laid out right to left.')
    doc.add_heading('2.5 Groups, organizations and projects', 2)
    para(doc, 'Open **Portfolio > Groups, organizations & projects**. The tree reads **Group (Yes / No) > Organization > Projects**. Open an organization to list its projects; the **Table** view lists Group (Yes / No), Group, Organization, Sector and Projects in one grid. '
         'A platform administrator sees every organization; an executive or portfolio manager sees the organizations of their group (read-only outside their own); everyone else sees their own organization.')
    table(doc, ['Group (Yes / No)', 'Group', 'Organization', 'Sector', 'E-mail domain', 'Projects'], [
        ('No', '—', 'Metro City Digital Services Agency', 'Public Sector', 'metrocity.example', 'PUB-001 … PUB-021'),
        ('Yes', 'Atlas Infrastructure Holding', 'Cedarline Precast Systems', 'Manufacturing', 'cedarline.example', 'MFG-001 … MFG-021'),
        ('No', '—', 'Meridale Health Network', 'Healthcare', 'meridale.example', 'HLT-001 … HLT-021'),
        ('Yes', 'Crescent Agro-Energy Group', 'Valdora Dairy Cooperative', 'Agro-Business – Dairy Products', 'valdora.example', 'DAI-001 … DAI-021'),
        ('Yes', 'Atlas Infrastructure Holding', 'Orvane Transit Group', 'Transportation', 'orvane.example', 'TRN-001 … TRN-021'),
        ('Yes', 'Crescent Agro-Energy Group', 'Kestrel Energy & Utilities', 'Oil, Gas & Energy', 'kestrel.example', 'ENR-001 … ENR-021'),
        ('Yes', 'Atlas Infrastructure Holding', 'Ridgeway Real Estate Development', 'Real Estate Development', 'ridgeway.example', 'RED-001 … RED-021'),
    ], widths=[0.75, 1.35, 1.6, 1.25, 1.05, 0.77], size=8)
    para(doc, 'Every seeded project also has its own team tree (OBS) with the role of each person: steering committee, project management and delivery teams.')
    figure(doc, S('03_tenancy.png'), 'Groups, organizations & projects: the tree Group (Yes / No) > Organization > Projects.')
    doc.add_heading('2.6 Portfolio overview', 2)
    para(doc, 'Open **Portfolio > Portfolio overview** and choose a scope: a group, one organization, or a set of projects. Each row is a project and each column an end-to-end process; the cell shows the status of that process for the project. The legend explains the colours: **Completed**, **In progress**, **At gate** (waiting for the board), **On hold**, **Stopped**, **Not started** and **Not in track**. **Export CSV** downloads the grid.')
    figure(doc, S('15_portfolio.png'), 'Portfolio overview of Atlas Infrastructure Holding, seen by the Executive Sponsor of Ridgeway.')
    doc.add_heading('2.7 Alerts, notifications and the assistant', 2)
    bullets(doc, [
        'The **bell** in the top bar shows unread alerts, such as overdue tasks or a gate waiting too long. Open **Alerts** for the full list.',
        '**Notifications** holds your inbox and lets you choose, per category, the channels you want (in-app, e-mail, webhook, SMS, push).',
        'The round **assistant** button at the bottom of the screen answers questions about your data within your permissions, for example **How many active projects?**, and explains how to use each screen.',
    ])
    figure(doc, S('14_assistant.png'), 'The assistant answers from live organization data.')

    h1(doc, '3. How a Project Moves Through CortexPLM')
    para(doc, 'Every project belongs to one organization and follows the end-to-end (E2E) processes of its track. Each E2E process is a list of tasks and ends with a gate. At the gate, the Executive Sponsor records one of four decisions.')
    table(doc, ['Track', 'Total score', 'E2E processes', 'Gates', 'Standard checklist items per gate'], [
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
        'The **platform administrator** creates the group (if any) and the organization with its starting team.',
        'The **Product Manager** creates the project, completes the tasks, completes the gate checklist and submits the gate. Each task shows its own owner (for example Finance or Marketing). In daily use each owner completes their task; in these runs the Product Manager completes them on the owners\' behalf, which the role allows.',
        'The **Executive Sponsor** records the gate decision. The project owner can never decide their own gate (control CTL-01).',
        'The **evaluator** of a task (Accountable in the RACSI matrix) rates it Effective or Not effective after completion. Evaluations do not block the process.',
    ])
    doc.add_heading('3.2 Create the organization', 2)
    para(doc, 'In **Groups, organizations & projects**, **Add organization** asks whether the organization belongs to a group (Yes / No), its name, sector, country and subscription. Tick **Create the starting team** and type the e-mail domain and an initial password to create one account per role.')
    figure(doc, S('04_add_org.png'), 'Add organization: Group Yes, the group, and the starting team.', width=5.2)
    doc.add_heading('3.3 Create a project', 2)
    para(doc, 'Open **Innovation projects > New project**. **Step 0** shows the organization the project belongs to and whether it is in a group. Step 1 describes the project, Step 2 scores seven complexity criteria from 1 to 5 (the **Decision matrix** button explains each level), Step 3 confirms the recommended track, and Step 4 adds optional macro processes. Select **Create project**; E2E-01 starts.')
    figure(doc, S('05_wizard.png'), 'The New project wizard: organization, description and scores.', width=5.2)
    figure(doc, S('06_matrix.png'), 'The decision matrix opened from Step 2.', width=5.2)
    doc.add_heading('3.4 Complete a task and attach documents', 2)
    para(doc, 'Open the task from the project page or from **My tasks**. Fill in the fields, type the **Result / output** and select **Complete task**. A window proposes to record a lesson learned: fill it in, or select **Skip**. '
         'In **Attachments**, add several files at once (documents, spreadsheets, presentations, images, drawings and CAD, data, archives, audio and video, e-mails). The **AI for this task** line shows the AI use cases you can run on the task.')
    figure(doc, S('07_task.png'), 'Task UFT-01-01 with its attachments and the AI available for the task.')
    doc.add_heading('3.5 Complete the gate checklist', 2)
    para(doc, 'The last task before each gate is **Complete Gate Checklist**. Its items come from the checklist templates linked to that gate and track. Every **Mandatory** item needs an evidence reference (or an attached file) before **Mark complete** works (BR-005). '
         'On the gate screen, **Add to this checklist** adds items from any template of the library, or typed by hand; **Save as template** keeps the checklist for later projects.')
    figure(doc, S('08_gate_checklist.png'), 'Gate T-1 of HAR-002: the checklist and the Add to this checklist card.', width=5.2)
    doc.add_heading('3.6 Submit the gate and record the decision', 2)
    para(doc, 'When all tasks are done, the project page shows **Submit gate for decision** on the gate card. The Executive Sponsor then opens **Gate board**, opens the gate, chooses the decision, types a rationale and selects **Record decision**.')
    figure(doc, S('09_project.png'), 'Project page: the lifecycle and the tasks of the current process.')
    figure(doc, S('10_gate_board.png'), 'Gate board: gates waiting for a decision, with the working days elapsed.')
    if os.path.exists(S('11_gate_decision.png')): figure(doc, S('11_gate_decision.png'), 'Gate decision page: evidence summary on the left, decision form on the right.', width=5.2)

    decision_matrix(doc, 4)

    h1(doc, '5. Common Values Used in the Runs')
    para(doc, 'The runs use the same patterns so you can type quickly:')
    bullets(doc, [
        'Passwords: the platform administrator uses **Admin#2026**; every team created in the runs uses **Start#2026**.',
        'Result / output of a task: **"<task name> done for <project code>. Summary filed as <project code>-<task number>."** The exact text is given in every table.',
        'Evidence reference of a checklist item: **<project code>-<gate>-<item number>**, for example **HAR-001-T-1-01**.',
        'Dates: any future date works; the tables show the dates used in the example runs.',
        'Fields not listed in a table can stay empty.',
    ])

    for r in runs:
        if r.get('error'): continue
        run_section(doc, r, shots)

    if bench: benchmarking_run(doc, bench, shots, 12)
    module_scenarios(doc, 13)
    figure(doc, S('16_checklist_templates.png'), 'Checklist templates by gate and track.', width=5.2)
    figure(doc, S('17_tasks_ai.png'), 'Tasks and AI: where Assistive AI and Augmented AI support each task.', width=5.2)
    figure(doc, S('18_ai_run.png'), 'Running AIUC-01 from its badge: Accept, Modify or Reject.', width=5.2)
    figure(doc, S('19_library_part.png'), 'Macro processes with the Part legend and the AI column.', width=5.2)
    figure(doc, S('20_bpmn_full.png'), 'A BPMN diagram in full screen with the Shapes palette.', width=5.2)
    figure(doc, S('21_llm.png'), 'Live AI model: provider, model list with a custom choice, key and connection test.', width=5.2)
    figure(doc, S('22_obs_team.png'), 'A project team tree with the people and the role each one plays.', width=5.2)

    h1(doc, '14. Messages You May Meet')
    table(doc, ['Message', 'Why', 'What to do'], [
        ('Evidence is required before this item can be marked complete (BR-005).', 'A mandatory checklist item has no evidence.', 'Type an evidence reference or attach a file, then select **Mark complete**.'),
        ('Gate submission blocked: … mandatory checklist item(s) are open (BR-004).', 'The checklist is not finished.', 'Complete or waive the mandatory items, then complete the checklist task.'),
        ('The person accountable for the project cannot record its gate decision (CTL-01).', 'You own the project.', 'Ask the Executive Sponsor or a Gate Review Board member to decide.'),
        ('Go-live is blocked: final regulatory validation reports incomplete approvals (BR-030).', 'UFT-05-08 answered **No**.', 'Once the approvals are obtained, open **Final Regulatory Validation**, select **Reopen task**, type the reason, answer **Yes**, complete the task and submit the gate again.'),
        ('Strategic-fit score below 50: the idea is parked (BR-001).', 'UFT-01-02 scored below 50.', 'The project goes On Hold for 90 days. Select **Resume project** after re-review.'),
        ('This e-mail domain is already used by another organization.', 'Another organization already has accounts @ that domain.', 'Choose another e-mail domain for the starting team.'),
        ('File type not accepted: …', 'The file is not in the list of accepted types (for example .exe).', 'Convert it (for example to PDF) or zip it.'),
        ('Seeded use cases cannot be deleted. Deactivate it instead.', 'Only custom AI use cases can be deleted.', 'Clear **Active for the organization** instead.'),
        ('… belongs to … You can see it here and in the portfolio overview; only its organization can open it.', 'The project belongs to another organization of your group.', 'Ask a person of that organization, or read it in the portfolio overview.'),
        ('This E2E run has not started yet (observation period, Rule R1).', 'Light Track performance review is scheduled after launch.', 'Wait for the start date, or ask the Track Administrator to shorten the observation period.'),
    ], widths=[2.5, 1.9, 2.37], size=9)
    doc.save(out)


if __name__ == '__main__':
    build(*sys.argv[1:5])
