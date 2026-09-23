"""User Guide additions: Run 6 (benchmarking) and short scenarios for every other module."""
from docstyle import h1, para, bullets, numbered, table, callout, figure
import os


def benchmarking_run(doc, bench, shots, number):
    S = lambda f: os.path.join(shots, f)
    h1(doc, f'{number}. Run 6: Benchmarking in Construction, within the organization and across the group')
    para(doc, 'Ridgeway Construction Contractors (Construction) belongs to Atlas Infrastructure Holding with Cedarline Precast Systems and Orvane Transit Group. '
         'Its Executive Sponsor compares the organization\'s own project types and tracks, then compares the organization with its two sister companies. Comparisons outside the group are not possible: external benchmarking is out of scope.')
    table(doc, ['Item', 'Value'], [
        ('Organization', 'Ridgeway Construction Contractors (Construction), group Atlas Infrastructure Holding'),
        ('Sign in', '**exec@ridgeway.example** / **Demo#2026** (Executive Sponsor)'),
        ('Screen', '**Reports > Benchmarking**'),
    ], widths=[1.7, 5.07])
    o = bench['org']; tr = bench['track']; g = bench['group']
    fmt = lambda v, u='': '—' if v is None else f'{v}{u}'
    doc.add_heading('Step 1. Compare project types', 3)
    numbered(doc, [
        'Sign in as **exec@ridgeway.example** and open **Reports > Benchmarking**. The tab **Within the organization** opens, with **Compare by** set to **Project type**.',
        'Read the four figures at the top: projects compared, first-time Go rate, time to market and checklist compliance for the whole organization.',
        'In the chart, open the **Indicator** list and choose **Time to market**, then **Average NPV**. The bars compare Product, Product-Service and Service projects.',
        'Read the **Scorecard by project type**. Green marks the best segment and red the weakest for each indicator.',
    ])
    table(doc, ['Project type', 'Projects', 'First-time Go', 'Time to market', 'Average NPV'],
          [(r['segment'], str(r['metrics']['projects']), fmt(r['metrics']['go_rate'], '%'), fmt(r['metrics']['time_to_market_days'], ' days'), fmt(r['metrics']['avg_npv'], ' kUSD')) for r in o['rows']], widths=[1.8, 0.9, 1.2, 1.5, 1.37], size=9.5)
    para(doc, 'What it tells you: Service projects reach the market fastest and carry the best business cases, while Product-Service projects are sent back most often (lowest first-time Go rate).', align='left')
    figure(doc, S('12_bench_org.png'), 'Benchmarking within the organization, compared by project type.', width=5.0)
    doc.add_heading('Step 2. Compare tracks and filter', 3)
    numbered(doc, [
        'Under **Compare by**, select **Track**. The scorecard now compares the Full, Light and Fast tracks.',
        'In **Project type**, choose **Service** to compare tracks for Service projects only. Choose **All project types** to reset.',
        'Select **CSV** above the scorecard to download the figures.',
    ])
    table(doc, ['Track', 'Projects', 'First-time Go', 'Time to market', 'Average NPV'],
          [(r['segment'], str(r['metrics']['projects']), fmt(r['metrics']['go_rate'], '%'), fmt(r['metrics']['time_to_market_days'], ' days'), fmt(r['metrics']['avg_npv'], ' kUSD')) for r in tr['rows']], widths=[1.8, 0.9, 1.2, 1.5, 1.37], size=9.5)
    doc.add_heading('Step 3. Compare with the organizations of the group', 3)
    numbered(doc, [
        'Select the tab **Across the group**. The card shows **Atlas Infrastructure Holding** and its three organizations.',
        'Read the note: only aggregated indicators are exchanged. No project, person or document of Cedarline or Orvane is visible.',
        'In the chart, choose **First-time Go rate**, then **Gate decision time**. Your organization is marked **(you)**.',
        'Read the **Scorecard by organization** and the **Median** column.',
    ])
    table(doc, ['Organization', 'First-time Go', 'Recycle', 'Decision time', 'Time to market'],
          [(r['segment'] + (' (you)' if r['self'] else ''), fmt(r['metrics']['go_rate'], '%'), fmt(r['metrics']['recycle_rate'], '%'), fmt(r['metrics']['gate_cycle_days'], ' days'), fmt(r['metrics']['time_to_market_days'], ' days')) for r in g['rows']], widths=[2.4, 1.1, 0.9, 1.2, 1.17], size=9.5)
    para(doc, 'What it tells you: Cedarline passes gates first time most often and decides fastest; Ridgeway can learn from its gate preparation.', align='left')
    figure(doc, S('13_bench_group.png'), 'Benchmarking across Atlas Infrastructure Holding, as seen by Ridgeway.', width=5.0)
    doc.add_heading('Step 4. Stop or resume sharing with the group', 3)
    numbered(doc, [
        'Still on **Across the group**, clear **Share our aggregated indicators with the organizations of our group**. A message confirms **Saved.**',
        'Sign in as **exec@cedarline.example**, open **Benchmarking > Across the group**: Ridgeway now shows **Not shared** in every row.',
        'Sign in again as **exec@ridgeway.example** and tick the box again to resume sharing.',
    ])
    doc.add_heading('Step 5. An independent organization', 3)
    numbered(doc, [
        'Sign in as **exec@meridale.example** (Meridale Health Network, no group) and open **Reports > Benchmarking**.',
        'The tab **Within the organization** works as in Step 1. The tab **Across the group** explains that the organization belongs to no group, so there is no comparison.',
    ])
    figure(doc, S('14_bench_independent.png'), 'An independent organization has no group comparison.', width=5.0)


SCENARIOS = [
    ('Record a business rule', 'process@metrocity.example', [
        'Open **Governance > Business rules** and select **Add rule**.',
        'Type Rule ID **BR-PUB-101**, Triggering step **MP-33.2**, Condition **A service goes live without an accessibility audit**, Action **Block the T3 submission and notify the Quality Manager**.',
        'Choose Rule type **Validation**, Severity **High**, type Owner **Quality Manager** and Process tag **MP-121**.',
        'Select **Save**. In the justification window type **New accessibility policy 2026** and select **Save change**.',
    ]),
    ('Add a control, change it and compare versions', 'process@metrocity.example', [
        'Open **Governance > Controls (COSO)** and select **Add control**.',
        'Type Name **Accessibility audit before go-live**; choose COSO component **Control Activities**, Control type **Preventive**, Testing frequency **Per change**; type Owner **Quality Manager**; choose Effectiveness **Not tested**; type Process tag **MP-121**. Select **Save**, justification **New control for the accessibility policy**.',
        'Open the new control, change Effectiveness to **Effective**, select **Save**, justification **Tested on PUB-022**.',
        'Open it again, select the tab **Version history**. Under **Compare two versions** choose From **Version 1** and To **Version 2**: the row **effectiveness** is marked **Changed**.',
    ]),
    ('Log a risk and read the heat map', 'process@metrocity.example', [
        'Open **Governance > Risks & opportunities** and select **Add**.',
        'Choose Type **Risk**; type Name **Payment provider outage**, Category **Operational**, Likelihood **3**, Impact **4**, Owner **Finance Controller**; choose Status **Open**; type Process tag **MP-121**. Save with the justification **Identified during PUB-022 launch**.',
        'In the heat map, select the cell likelihood 3 × impact 4: the list shows the risks scored 12.',
    ]),
    ('See the governance of one process', 'process@metrocity.example', [
        'Open **Process design > Macro processes** and open **MP-121**.',
        'Scroll to **Governance tagged to this process**: the rule BR-PUB-101, the new control and the new risk appear with the organization\'s other MP-121 records.',
    ]),
    ('Build a RACSI activity', 'process@metrocity.example', [
        'Open **Governance > RACSI matrix** and select **Add activity**. Type Activity **Accessibility audit**, Process tag **MP-121**, then **Save**.',
        'In the row, select **+** under **R** and type **Quality Manager**; select **+** under **A** and type **Product Manager**.',
        'Select **+** under **A** again and type **Executive Sponsor**: the application refuses a second Accountable.',
    ]),
    ('Track a custom KPI', 'process@metrocity.example', [
        'Open **Governance > KPIs**, tab **Custom KPIs**, and select **Add custom KPI**.',
        'Type Name **Online completion rate**, Formula (plain language) **Requests completed online divided by all requests**, Target **85**, Unit **%**, Current value **81**, Owner **Product Manager**, Process tag **MP-12**. Save.',
        'Open the tab **Built-in KPIs** and select **KPI-07 Design review first-pass yield**. Select **Record measurement**, type Period (YYYY-MM) **2026-09** and Value **88**, then **Save**. The trend line shows the measurement against the dashed target.',
    ]),
    ('Edit and exchange a BPMN diagram', 'process@metrocity.example', [
        'Open **Governance > BPMN diagrams** and open the E2E-01 diagram.',
        'Drag a task from the palette on the left onto the canvas and name it **Accessibility audit**. Select **Save diagram**.',
        'Select **Export .bpmn** to download the file; **Import .bpmn** loads a file from any BPMN 2.0 tool.',
    ]),
    ('Ask for an AI suggestion on a task', 'pm1@metrocity.example', [
        'Open **My tasks** and open a task in progress.',
        'In the card **AI assistance**, keep the proposed use case, type **Focus on accessibility** in **Add details for the suggestion**, then select **Get suggestion**.',
        'The suggestion is labelled AI-generated with its tier, source and references. Select **Accept**, **Edit** or **Reject**; the decision goes to the usage log (**Intelligence > AI use cases > Usage log**).',
    ]),
    ('Search the knowledge base in your language', 'pm2@metrocity.example (French interface)', [
        'Open **Intelligence > Base de connaissances** (tab **Rechercher**).',
        'In the search box type **preuves checklist jalon**: the French reference articles are ranked first, followed by matching records of your organization.',
        'Open the tab **Articles**: the list shows French articles by default; use the language filter to show **English** or **العربية** articles.',
    ]),
    ('Create a project template and use it', 'process@metrocity.example', [
        'Open **Intelligence > Templates** and select **Add template**. Type Name **Citizen e-service (Fast)**, Kind **Project**.',
        'In **Default values (JSON)** type **{"offer_type":"Service","scores":{"strategic":2,"investment":1,"novelty":2,"regulatory":2,"market":1,"reach":2,"integration":1}}**. Save.',
        'Sign in as **pm1@metrocity.example**, open **New project** and choose the template in **Start from a template**: type and scores are pre-filled and remain editable.',
    ]),
    ('Plan with a WBS and a Gantt chart', 'pm1@metrocity.example', [
        'Open **Lifecycle > WBS & Gantt** and select **New WBS**. Type Name **PUB-022 launch plan**, choose Project **PUB-022**, tick **Fill it with all tasks of this project, grouped by E2E run**, then **Create**.',
        'Open the Gantt: bars show planned, in-progress, completed and overdue tasks with dependency lines.',
        'Select **Export PDF** to download the chart.',
    ]),
    ('Record a lesson learned', 'pm1@metrocity.example', [
        'Open **Lifecycle > Lessons learned (REX)** and select **Add lesson**.',
        'Type Title **Accessibility audit booked too late**, What went well **The audit found no blocking issue**, What did not go well **The audit slot was booked two weeks before go-live**, Root cause **No audit step in the launch plan**, Recommendation **Add the audit to UFT-05-02 Develop Detailed Launch Plan**; choose Category **Governance**; type Effectiveness rating **3**. Save.',
        'The register view groups lessons by category and shows the average rating by month.',
    ]),
    ('Export a report', 'exec@metrocity.example', [
        'Open **Reports & cockpits** and open **RPT-01**.',
        'Select **PDF**, **Excel** or **Word**: the file is named with the report key and today\'s date.',
    ]),
    ('Choose how you are notified', 'pm1@metrocity.example', [
        'Open **Notifications**, tab **Preferences**, and tick **E-mail** for **Gate submissions and decisions**.',
        'Open the tab **Delivery log** to see each delivery with its status and attempts.',
    ]),
    ('Add a user within the licence limit', 'admin@metrocity.example', [
        'Open **Administration > Users & roles** and select **Add user**.',
        'Type Name **Nora Idrissi**, E-mail **nora.idrissi@metrocity.example**, choose Roles **Quality Manager**, Language **Français**, and type Password **Welcome#2026**. Save.',
        'The seat counter increases by one. When all seats are used, the application refuses new users.',
    ]),
    ('Give a project its own team tree (OBS)', 'admin@metrocity.example', [
        'Open **Administration > Organizations & OBS**, tab **OBS of Metro City Digital Services Agency**.',
        'In **Tree**, choose **PUB-022 Online Parking Permit Renewal**, then **Add node**. Type Name **Permit delivery team**, Type **Team**, and Save.',
        'Choose **Organization tree** in **Tree** to return to the organization\'s own structure.',
    ]),
    ('Back up the database', 'admin@cortexplm.example / Admin#2026 (platform administrator)', [
        'Open **Administration > Configuration** and scroll to **Backups**.',
        'Select **Back up now**. The new file appears in the list; one automatic backup is also made every day.',
    ]),
    ('Check the audit trail', 'auditor@metrocity.example', [
        'Open **Administration > Audit trail**, type **accessibility** in the search box and select **Search**.',
        'Each line shows who changed what, when, the old and new values and the justification. The trail is read-only.',
    ]),
]


def module_scenarios(doc, number):
    h1(doc, f'{number}. Everyday Scenarios by Module')
    para(doc, 'Short scenarios for the modules not used in the runs. All take place in Metro City Digital Services Agency unless stated; the password is **Demo#2026**. '
         'Where a justification is requested, type the text given or your own reason.')
    for i, (title, who, steps) in enumerate(SCENARIOS, 1):
        doc.add_heading(f'{number}.{i} {title}', 2)
        para(doc, f'Sign in as **{who}**.' if '@' in who and ' ' not in who else f'Sign in as **{who}**.', align='left')
        numbered(doc, steps)
