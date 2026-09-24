"""User Guide additions: Run 7 (benchmarking) and short scenarios for every other module."""
from docstyle import h1, para, bullets, numbered, table, callout, figure
import os


def benchmarking_run(doc, bench, shots, number):
    S = lambda f: os.path.join(shots, f)
    h1(doc, f'{number}. Run 7: Benchmarking in Real Estate Development, within the organization and across the group')
    para(doc, 'Tenancy of this run: **Group: Yes** (Atlas Infrastructure Holding) > **Ridgeway Real Estate Development** > its 21 projects. Ridgeway belongs to Atlas with Cedarline Precast Systems, Orvane Transit Group and, after Run 6, Palmgrove Residential Developers. '
         'Its Executive Sponsor compares the organization\'s own project types and tracks, then compares the organization with its two sister companies. Comparisons outside the group are not possible: external benchmarking is out of scope.')
    table(doc, ['Item', 'Value'], [
        ('Organization', 'Ridgeway Real Estate Development (Real Estate Development), group Atlas Infrastructure Holding'),
        ('Sign in', '**exec@ridgeway.example** / **Demo#2026** (Executive Sponsor)'),
        ('Screen', '**Portfolio > Benchmarking**'),
    ], widths=[1.7, 5.07])
    o = bench['org']; tr = bench['track']; g = bench['group']
    fmt = lambda v, u='': '—' if v is None else f'{v}{u}'
    doc.add_heading('Step 1. Compare project types', 3)
    numbered(doc, [
        'Sign in as **exec@ridgeway.example** and open **Portfolio > Benchmarking**. The tab **Within the organization** opens, with **Compare by** set to **Project type**.',
        'Read the four figures at the top: projects compared, first-time Go rate, time to market and checklist compliance for the whole organization.',
        'In the chart, open the **Indicator** list and choose **Time to market**, then **Average NPV**. The bars compare Product, Product-Service and Service projects.',
        'Read the **Scorecard by project type**. Green marks the best segment and red the weakest for each indicator.',
    ])
    table(doc, ['Project type', 'Projects', 'First-time Go', 'Time to market', 'Average NPV'],
          [(r['segment'], str(r['metrics']['projects']), fmt(r['metrics']['go_rate'], '%'), fmt(r['metrics']['time_to_market_days'], ' days'), fmt(r['metrics']['avg_npv'], ' kUSD')) for r in o['rows']], widths=[1.8, 0.9, 1.2, 1.5, 1.37], size=9.5)
    para(doc, 'What it tells you: Service projects reach the market fastest and carry the best business cases, while Product-Service projects are sent back most often (lowest first-time Go rate).', align='left')
    figure(doc, S('23_bench_org.png'), 'Benchmarking within the organization, compared by project type.', width=5.0)
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
        'Select the tab **Across the group**. The card shows **Atlas Infrastructure Holding** and its organizations. An organization with fewer than 3 projects, such as Palmgrove after Run 6, is marked not comparable.',
        'Read the note: only aggregated indicators are exchanged. No project, person or document of Cedarline or Orvane is visible.',
        'In the chart, choose **First-time Go rate**, then **Gate decision time**. Your organization is marked **(you)**.',
        'Read the **Scorecard by organization** and the **Median** column.',
    ])
    table(doc, ['Organization', 'First-time Go', 'Recycle', 'Decision time', 'Time to market'],
          [(r['segment'] + (' (you)' if r['self'] else ''), fmt(r['metrics']['go_rate'], '%'), fmt(r['metrics']['recycle_rate'], '%'), fmt(r['metrics']['gate_cycle_days'], ' days'), fmt(r['metrics']['time_to_market_days'], ' days')) for r in g['rows']], widths=[2.4, 1.1, 0.9, 1.2, 1.17], size=9.5)
    para(doc, 'What it tells you: Cedarline passes gates first time most often and decides fastest; Ridgeway can learn from its gate preparation.', align='left')
    figure(doc, S('24_bench_group.png'), 'Benchmarking across Atlas Infrastructure Holding, as seen by Ridgeway.', width=5.0)
    doc.add_heading('Step 4. Stop or resume sharing with the group', 3)
    numbered(doc, [
        'Still on **Across the group**, clear **Share our aggregated indicators with the organizations of our group**. A message confirms **Saved.**',
        'Sign in as **exec@cedarline.example**, open **Benchmarking > Across the group**: Ridgeway now shows **Not shared** in every row.',
        'Sign in again as **exec@ridgeway.example** and tick the box again to resume sharing.',
    ])
    doc.add_heading('Step 5. An independent organization', 3)
    numbered(doc, [
        'Sign in as **exec@meridale.example** (Meridale Health Network, **Group: No**) and open **Portfolio > Benchmarking**.',
        'The tab **Within the organization** works as in Step 1. The tab **Across the group** explains that the organization belongs to no group, so there is no comparison.',
    ])
    figure(doc, S('25_bench_independent.png'), 'An independent organization has no group comparison.', width=5.0)


SCENARIOS = [
    ('Record a business rule', 'process@harbourview.example', [
        'Open **Governance > Business rules** and select **Add rule**.',
        'Type Rule ID **BR-PUB-101**, Triggering step **MP-33.2**, Condition **A service goes live without an accessibility audit**, Action **Block the T3 submission and notify the Quality Manager**.',
        'Choose Rule type **Validation**, Severity **High**, type Owner **Quality Manager** and Process tag **MP-121**.',
        'Select **Save**. In the justification window type **New accessibility policy 2026** and select **Save change**.',
    ]),
    ('Add a control, change it and compare versions', 'process@harbourview.example', [
        'Open **Governance > Controls (COSO)** and select **Add control**.',
        'Type Name **Accessibility audit before go-live**; choose COSO component **Control Activities**, Control type **Preventive**, Testing frequency **Per change**; type Owner **Quality Manager**; choose Effectiveness **Not tested**; type Process tag **MP-121**. Select **Save**, justification **New control for the accessibility policy**.',
        'Open the new control, change Effectiveness to **Effective**, select **Save**, justification **Tested on HAR-001**.',
        'Open it again, select the tab **Version history**. Under **Compare two versions** choose From **Version 1** and To **Version 2**: the row **effectiveness** is marked **Changed**.',
    ]),
    ('Log a risk and read the heat map', 'process@harbourview.example', [
        'Open **Governance > Risks & opportunities** and select **Add**.',
        'Choose Type **Risk**; type Name **Payment provider outage**, Category **Operational**, Likelihood **3**, Impact **4**, Owner **Finance Controller**; choose Status **Open**; type Process tag **MP-121**. Save with the justification **Identified during HAR-001 launch**.',
        'In the heat map, select the cell likelihood 3 × impact 4: the list shows the risks scored 12.',
    ]),
    ('See the governance of one process', 'process@harbourview.example', [
        'Open **Process design > Macro processes** and open **MP-121**.',
        'Scroll to **Governance tagged to this process**: the rule BR-PUB-101, the new control and the new risk appear with the organization\'s other MP-121 records.',
    ]),
    ('Build a RACSI activity', 'process@harbourview.example', [
        'Open **Governance > RACSI matrix** and select **Add activity**. Type Activity **Accessibility audit**, Process tag **MP-121**, then **Save**.',
        'In the row, select **+** under **R** and type **Quality Manager**; select **+** under **A** and type **Product Manager**.',
        'Select **+** under **A** again and type **Executive Sponsor**: the application refuses a second Accountable.',
    ]),
    ('Track a custom KPI', 'process@harbourview.example', [
        'Open **Governance > KPIs**, tab **Custom KPIs**, and select **Add custom KPI**.',
        'Type Name **Online completion rate**, Formula (plain language) **Requests completed online divided by all requests**, Target **85**, Unit **%**, Current value **81**, Owner **Product Manager**, Process tag **MP-12**. Save.',
        'Open the tab **Built-in KPIs** and select **KPI-07 Design review first-pass yield**. Select **Record measurement**, type Period (YYYY-MM) **2026-09** and Value **88**, then **Save**. The trend line shows the measurement against the dashed target.',
    ]),
    ('Edit and exchange a BPMN diagram', 'process@harbourview.example', [
        'Open **Process design > BPMN diagrams** and open the E2E-01 diagram.',
        'In the **Shapes** palette on the left, drag **User task** onto the canvas and name it **Accessibility audit**. Select **Save diagram**.',
        'Select **Export .bpmn** to download the file; **Import .bpmn** loads a file from any BPMN 2.0 tool.',
    ]),
    ('Ask for an AI suggestion on a task', 'pm1@harbourview.example', [
        'Open **My tasks** and open a task in progress.',
        'In the card **AI assistance**, keep the proposed use case, type **Focus on accessibility** in **Add details for the suggestion**, then select **Get suggestion**.',
        'The suggestion is labelled AI-generated with its tier, source and references. Select **Accept**, **Modify** or **Reject**; the decision goes to the usage log (**AI & knowledge > AI use cases > Usage log**).',
    ]),
    ('Search the knowledge base in your language', 'pm2@harbourview.example', [
        'In the language list of the top bar choose **Français**. Open **IA et connaissances > Base de connaissances** (tab **Rechercher**).',
        'In the search box type **preuves checklist jalon**: the French reference articles are ranked first, followed by matching records of your organization.',
        'Open the tab **Articles**: the list shows French articles by default; use the language filter to show **English** or **العربية** articles.',
    ]),
    ('Create a project template and use it', 'process@harbourview.example', [
        'Open **AI & knowledge > Project templates** and select **Add template**. Type Name **Citizen e-service (Fast)**, Kind **Project**.',
        'In **Default values (JSON)** type **{"offer_type":"Service","scores":{"strategic":2,"investment":1,"novelty":2,"regulatory":2,"market":1,"reach":2,"integration":1}}**. Save.',
        'Sign in as **pm1@harbourview.example**, open **New project** and choose the template in **Start from a template**: type and scores are pre-filled and remain editable.',
    ]),
    ('Plan with a WBS and a Gantt chart', 'pm1@harbourview.example', [
        'Open **Portfolio > WBS & Gantt** and select **New WBS**. Type Name **HAR-001 launch plan**, choose Project **HAR-001**, tick **Fill it with all tasks of this project, grouped by E2E run**, then **Create**.',
        'Open the Gantt: bars show planned, in-progress, completed and overdue tasks with dependency lines.',
        'Select **Export PDF** to download the chart.',
    ]),
    ('Record a lesson learned', 'pm1@harbourview.example', [
        'Open **AI & knowledge > Lessons learned (REX)** and select **Add lesson**.',
        'Type Title **Accessibility audit booked too late**, What went well **The audit found no blocking issue**, What did not go well **The audit slot was booked two weeks before go-live**, Root cause **No audit step in the launch plan**, Recommendation **Add the audit to UFT-05-02 Develop Detailed Launch Plan**; choose Category **Governance**; type Effectiveness rating **3**. Save.',
        'The register view groups lessons by category and shows the average rating by month.',
    ]),
    ('Export a report', 'exec@harbourview.example', [
        'Open **Reports & cockpits** and open **RPT-01**.',
        'Select **PDF**, **Excel** or **Word**: the file is named with the report key and today\'s date.',
    ]),
    ('Choose how you are notified', 'pm1@harbourview.example', [
        'Open **Notifications**, tab **Preferences**, and tick **E-mail** for **Gate submissions and decisions**.',
        'Open the tab **Delivery log** to see each delivery with its status and attempts.',
    ]),
    ('Add a user within the licence limit', 'admin@harbourview.example', [
        'Open **Administration > Users & roles** and select **Add user**.',
        'Type Name **Nora Idrissi**, E-mail **nora.idrissi@harbourview.example**, choose Roles **Quality Manager**, Language **Français**, and type Password **Welcome#2026**. Save.',
        'The seat counter increases by one. When all seats are used, the application refuses new users.',
    ]),
    ('Place people in a project team with their roles (OBS)', 'admin@harbourview.example', [
        'Open **Administration > Organizations, OBS & teams**, tab **OBS & project teams of Harbourview City Services**.',
        'In **Tree**, choose **HAR-001 Online Parking Permit Renewal**, then **Add node**. Type Name **HAR-001 project team**, Type **Project**, and Save.',
        'Select **Add node** again: Name **Delivery team**, Type **Team**, Parent **HAR-001 project team**. Save, then open the new node.',
        'Under **People and their role in this node**, choose Person **the Engineering Lead**, Role **R05 Engineering Lead**, type Role played here **Engineering lead**, and select **Add person**. Add the Quality Manager the same way with **Quality lead**.',
        'The column **People and roles** now lists both people with the role they play. Seeded organizations already have a team tree for every project (steering committee, project management, delivery teams).',
    ]),
    ('Back up the database', 'admin@cortexplm.example / Admin#2026 (platform administrator)', [
        'Open **Administration > Configuration & AI model** and scroll to **Backups**.',
        'Select **Back up now**. The new file appears in the list; one automatic backup is also made every day.',
    ]),
    ('Check the audit trail', 'auditor@harbourview.example', [
        'Open **Administration > Audit trail**, type **accessibility** in the search box and select **Search**.',
        'Each line shows who changed what, when, the old and new values and the justification. The trail is read-only.',
    ]),
    ('Create a second project in the same organization', 'pm1@harbourview.example', [
        'Tenancy: **Group: No** > **Harbourview City Services** (created in Run 1) > a second project.',
        'Open **Portfolio > Innovation projects** and select **New project**. **Step 0** shows Organization **Harbourview City Services** and Belongs to a group? **No**.',
        'Type Project name **Street Lighting Fault Reporting**, Description **Residents report broken street lights with a photo; crews receive work orders.**, Offer type **Service**, Executive Sponsor **the Executive Sponsor**.',
        'Select **Decision matrix** to check the scores, then choose **2, 1, 2, 1, 1, 2, 1** (total 10) and keep **Fast Track · recommended**. Select **Create project**: the code is **HAR-002**.',
    ]),
    ('Attach documents to a task', 'pm1@harbourview.example', [
        'Open **HAR-002**, card **E2E-01**, task **UFT-01-01 Capture Strategic Idea**.',
        'In **Attachments**, select **Add files** and choose several files at once, for example a PDF, an Excel sheet and a photo, or drag them onto the box. Accepted: documents, spreadsheets, presentations, images, drawings and CAD (DWG, STEP, IFC), data (JSON, XML, BPMN), archives, audio and video, e-mails; up to 10 files of 25 MB.',
        'Each file shows its type, size, author and date, with **Download** and **Remove**. A file of another type, such as **.exe**, is refused.',
    ]),
    ('Add checklist items at a gate, from a template or by hand', 'pm1@harbourview.example', [
        'Open **Portfolio > Gate board**, filter **Open**, and open the **T-1** line of **HAR-002**.',
        'In **Add to this checklist**, keep **From a template**, choose **T-1 · Fast Track · T-1 Fast Track standard checklist**: its items are already in the checklist, so **Add to checklist** adds nothing twice.',
        'Choose **Manually**, type **Photo of the fault location is mandatory in the form**, tick **Mandatory**, and select **Add to checklist**. The item appears with Source **Added by …**.',
        'Select **Save as template**, keep the name, tick **Link to the gate** only if every Fast Track T-1 gate should receive these items, and select **Save**.',
    ]),
    ('Build a checklist template and link it to a gate', 'process@harbourview.example', [
        'Open **Process design > Checklist templates**. The grid shows, for each gate and track, how many templates exist and how many are linked.',
        'Select **New template**. Type Name **Citizen service accessibility check**, choose Track **Fast**, Gate **T3**.',
        'Type the items: **WCAG 2.1 AA audit report** (tick Mandatory and Evidence required), **Plain-language review of the forms** (Mandatory), **Screen-reader test on mobile**.',
        'Tick **Link to the gate** and select **Save**. From now on, every Fast Track T3 gate of the organization opens with these items in addition to the standard checklist.',
    ]),
    ('See where AI helps in the process design and run a use case', 'pm1@harbourview.example', [
        'Open **Process design > End-to-end processes**, tab **Tasks and AI**. Each task shows its active AI use cases: a grey badge is **Assistive AI**, an orange badge is **Augmented AI**.',
        'Choose **Tasks with AI** in the filter. Select the badge **AIUC-01** on **UFT-01-01 Capture Strategic Idea**.',
        'In the window, type **Street lighting and road safety** in **Context (optional)** and select **Get suggestion**.',
        'Select **Modify**, shorten the text, and select **Save modified version**. The decision is recorded as Edited in the usage log. **Accept** and **Reject** work the same way.',
        'Open **Process design > Macro processes**: the **Legend: Part** card explains the Part letters A to K, and the **AI** column shows the use cases of each macro process. Open **MP-01**: the badges appear next to the steps they support.',
    ]),
    ('Create, change and delete an AI use case', 'data@harbourview.example', [
        'Open **AI & knowledge > AI use cases** and select **Add custom use case**.',
        'Type Name **Fault photo classification**, choose Tier **Assistive**, type Linked to **UFT-01-01**, Human checkpoint **The service agent confirms the fault type**. Select **Create**: it starts inactive and pending approval.',
        'Sign in as **process@harbourview.example**, open the use case, select **Approve**, tick **Active for the organization**: the badge now appears on UFT-01-01.',
        'Open it again, change the Trigger, type **Clarified trigger** in the change note and select **Save new version**. To remove it, select **Delete** (custom use cases only; seeded ones are deactivated instead).',
    ]),
    ('Choose the live AI model', 'pm1@harbourview.example', [
        'Open **Settings** (or **Administration > Configuration & AI model**) and find **Live AI model (optional)**.',
        'Choose AI provider **Anthropic Claude**, then a Model in the list, for example **Claude Opus 5 (default)**. To use another model, choose **Custom model…** and type its name.',
        'Paste your API key and select **Test connection**; the message says whether the key and model work. Select **Save connection**. The key stays in this browser; without a key the built-in engine answers.',
        'For a company gateway, choose **Custom endpoint** and type its URL in **Endpoint**.',
    ]),
    ('Look at a group portfolio', 'exec@ridgeway.example / Demo#2026', [
        'Open **Portfolio > Groups, organizations & projects**. The tree shows **Group: Yes > Atlas Infrastructure Holding** with its organizations; open one to list its projects (read-only outside your organization).',
        'Open **Portfolio > Portfolio overview**. Choose Group **Atlas Infrastructure Holding**, then Organization **Cedarline Precast Systems**, or add several projects with **Add a project to the set**.',
        'Each row is a project, each column an E2E process. Read the legend: Completed, In progress, At gate, On hold, Stopped, Not started, Not in track. Select **Export CSV** to download the grid.',
        'Open **Portfolio > Innovation projects** and filter by Group, Organization and Project in the same way.',
    ]),
    ('Work on a BPMN diagram in full screen', 'process@harbourview.example', [
        'Open **Process design > BPMN diagrams** and open **E2E-02**.',
        'Select **Full screen**. The diagram fills the window with the **Shapes** palette on the left, grouped as Tools, Events, Activities, Gateways, Data and Participants.',
        'Use the zoom slider or **Fit to screen**; slide the palette away with its button to gain space. Select **Back to the page** (or press Escape) to return.',
        'Changing the diagram documents the process; it does not change the tasks of running or future projects, which come from the process reference.',
    ]),
]


def module_scenarios(doc, number):
    h1(doc, f'{number}. Everyday Scenarios by Module')
    para(doc, 'Short scenarios for the modules not used in the runs. Their tenancy is the one created in Run 1: **Group: No** > **Harbourview City Services** > projects **HAR-001** and **HAR-002**; the password of its team is **Start#2026**. '
         'Where a justification is requested, type the text given or your own reason.')
    for i, (title, who, steps) in enumerate(SCENARIOS, 1):
        doc.add_heading(f'{number}.{i} {title}', 2)
        para(doc, f'Sign in as **{who}**.' if '@' in who and ' ' not in who else f'Sign in as **{who}**.', align='left')
        numbered(doc, steps)
