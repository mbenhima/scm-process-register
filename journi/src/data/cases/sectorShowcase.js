// D-Deck: five additional lightweight sector tenants, seeded specifically to
// give the cross-sector PPT showcase (English/French) real, non-empty
// screens to photograph — Public Sector, Manufacturing in Construction,
// Agro-Business (Dairy), Oil/Gas/Energy, and Construction — alongside the
// existing Manufacturing (Atlas), Logistics/Transportation (Maghreb), and
// Health (Meridia) tenants. Each carries one CM Project, deliberately at a
// different point on the Lewin/ADKAR lifecycle, so the seven sectors read as
// seven different moments in the same end-to-end change journey rather than
// seven copies of the same screen. Standalone organizations (no groupId),
// same shape/fields as cases/atlasTangier.js.

export const organizations = [
  {
    id: 'org-public-sahara',
    name: 'Sahara Public Services Authority',
    sector: 'public_sector',
    employeeCount: 3200,
    sites: ['Rabat Headquarters', '6 Regional Service Centers'],
    languages: ['fr', 'ar'],
    defaultLanguage: 'fr',
  },
  {
    id: 'org-buildtech-atlas',
    name: 'Atlas BuildTech Materials Group',
    sector: 'manufacturing_construction',
    employeeCount: 1450,
    sites: ['Berrechid Precast Plant', 'Nouaceur Aggregates Site'],
    languages: ['fr', 'ar'],
    defaultLanguage: 'fr',
  },
  {
    id: 'org-meknes-dairy',
    name: 'Meknes Dairy Cooperative',
    sector: 'agro_business',
    employeeCount: 780,
    sites: ['Meknes Processing Plant', '4 Collection Centers'],
    languages: ['fr', 'ar'],
    defaultLanguage: 'fr',
  },
  {
    id: 'org-sahara-energy',
    name: 'Sahara Energy Holding',
    sector: 'oil_gas_energy',
    employeeCount: 2100,
    sites: ['Mohammedia Refinery', 'Laayoune Field Operations'],
    languages: ['fr', 'en'],
    defaultLanguage: 'en',
  },
  {
    id: 'org-rif-construction',
    name: 'Rif Construction Group',
    sector: 'construction',
    employeeCount: 1620,
    sites: ['Tetouan Regional Office', '5 Active Project Sites'],
    languages: ['fr', 'ar'],
    defaultLanguage: 'fr',
  },
]

export const mainProjects = [
  { id: 'mp-public-egov', orgId: 'org-public-sahara', name: 'Citizen e-Services Platform', type: 'erp', scope: 'Replace paper-based citizen service requests across 6 regional centers with a unified digital platform.', durationMonths: 14, budgetBand: '€4.2M band', executiveSponsor: 'Director General, Public Services Authority' },
  { id: 'mp-buildtech-mes', orgId: 'org-buildtech-atlas', name: 'Plant Digital Production Control', type: 'automation', scope: 'Automate batch tracking and quality control across the precast and aggregates lines.', durationMonths: 10, budgetBand: '€1.1M band', executiveSponsor: 'COO, Atlas BuildTech' },
  { id: 'mp-dairy-traceability', orgId: 'org-meknes-dairy', name: 'Cold-Chain Traceability Program', type: 'compliance', scope: 'Deploy farm-to-shelf traceability and cold-chain monitoring to meet new export-market food-safety standards.', durationMonths: 8, budgetBand: '€650K band', executiveSponsor: 'General Manager, Meknes Dairy Cooperative' },
  { id: 'mp-energy-safety', orgId: 'org-sahara-energy', name: 'Digital Safety & Operations Program', type: 'operating_model', scope: 'Modernize permit-to-work and incident-reporting processes across refinery and field operations.', durationMonths: 12, budgetBand: '€3.5M band', executiveSponsor: 'VP Operations, Sahara Energy Holding' },
  { id: 'mp-rif-bim', orgId: 'org-rif-construction', name: 'BIM & Project Controls Adoption', type: 'bpr', scope: 'Move site engineering and project controls from 2D drawings and spreadsheets onto a shared BIM and scheduling platform.', durationMonths: 11, budgetBand: '€980K band', executiveSponsor: 'Managing Director, Rif Construction Group' },
]

export const cmProjects = [
  {
    id: 'cm-public-egov',
    orgId: 'org-public-sahara',
    mainProjectIds: ['mp-public-egov'],
    name: 'Citizen e-Services Adoption Program',
    changeManager: 'Change Manager, Citizen e-Services Program',
    obsEntries: [
      { id: 'obs-public-cm', role: 'Change Manager, Citizen e-Services Program', name: 'Nadia Ferhat', reportsTo: null, notes: 'Leads the readiness and mobilization workstream across all 6 regional centers.' },
      { id: 'obs-public-pmo', role: 'PMO', name: 'Youssef Amrani', reportsTo: 'obs-public-cm', notes: 'Coordinates rollout schedule with the platform vendor.' },
      { id: 'obs-public-sponsor', role: 'Director General, Public Services Authority', name: 'Hassan Belkadi', reportsTo: 'obs-public-cm', notes: 'Executive sponsor; reports progress to the regional governor\'s office.' },
    ],
    changeType: 'technology',
    businessDriver: 'Citizen satisfaction surveys show 40% of service requests are abandoned due to in-person queue times; the platform targets same-day digital resolution.',
    targetPopulation: '~450 front-desk staff across 6 regional service centers, serving the general public',
    successCriteria: '70% of routine requests filed digitally within 6 months; front-desk queue time cut by half.',
    lewinPhase: 'unfreeze',
    bridgesPhase: 'ending',
    bridgesNote: 'Staff still processing what the platform means for their daily counter-service role',
    sentimentSnapshot: 'Denial among longer-tenured counter staff; cautious Exploration among younger regional-center hires',
    sponsor: {
      name: 'Director General, Public Services Authority',
      visibility: 'weak',
      visibilityNote: 'Sponsor has approved budget but has not yet appeared at a regional center in person',
      members: [
        { name: 'Director General, Public Services Authority', role: 'Executive Sponsor', influence: 5, engagement: 2 },
        { name: 'Regional Centers Coordinator', role: 'Coalition Member', influence: 3, engagement: 3 },
      ],
      actions: [{ action: 'Director General regional-center walk-through and staff Q&A', phase: 'Prepare', done: false }],
    },
    aiUseCases: [],
    adkar: {
      awareness: { score: 2, note: 'Memo circulated; no in-person briefing held yet' },
      desire: { score: 2, note: 'Staff worry digital self-service will be seen as reducing headcount need' },
      knowledge: { score: 1, note: 'Platform training curriculum still in design' },
      ability: { score: 1, note: 'No sandbox environment available yet' },
      reinforcement: { score: 1, note: 'Pre-rollout' },
    },
    risks: [
      { category: 'adoption', description: 'Front-desk staff may quietly steer citizens back to in-person queues rather than the new platform', likelihood: 4, impact: 4, owner: 'Change Manager, Citizen e-Services Program', status: 'open' },
      { category: 'capacity', description: 'Regional centers have uneven internet connectivity, risking inconsistent platform performance', likelihood: 3, impact: 3, owner: 'PMO', status: 'open' },
    ],
    stakeholderGroups: [
      { name: 'Front-Desk Service Agents', headcount: 310, impact: { process: 5, tech: 4, role: 4, location: 1, identity: 3 }, influence: 2 },
      { name: 'Regional Center Managers', headcount: 24, impact: { process: 4, tech: 3, role: 3, location: 1, identity: 2 }, influence: 4 },
      { name: 'Back-Office Case Processors', headcount: 116, impact: { process: 4, tech: 4, role: 2, location: 1, identity: 1 }, influence: 2 },
    ],
    communications: [
      { message: 'Introducing the Citizen e-Services Platform — what it means for your role', audience: 'All target population', channel: 'Internal memo', sender: 'Director General, Public Services Authority', timing: 'Prepare phase — completed', adkarBlock: 'awareness', status: 'sent' },
    ],
    trainings: [],
    resistanceLog: [
      { type: 'will', rootCause: 'Front-desk staff fear reduced relevance if citizens self-serve online', mitigation: 'Reframe role toward complex-case handling and digital-assistance coaching', status: 'open' },
    ],
    coachingNotes: [],
    journeyEvents: [
      { offsetDays: -30, label: 'Citizen satisfaction survey findings presented to leadership', type: 'milestone' },
      { offsetDays: -10, label: 'Introductory memo sent to all regional centers', type: 'communication' },
      { offsetDays: 0, label: 'Today — baseline readiness assessment', type: 'assessment' },
      { offsetDays: 420, label: 'Planned platform go-live, all regions', type: 'milestone' },
    ],
  },
  {
    id: 'cm-buildtech-mes',
    orgId: 'org-buildtech-atlas',
    mainProjectIds: ['mp-buildtech-mes'],
    name: 'BuildTech Production Control Rollout',
    changeManager: 'Change Manager, Production Control Program',
    obsEntries: [
      { id: 'obs-buildtech-cm', role: 'Change Manager, Production Control Program', name: 'Othmane Ziani', reportsTo: null, notes: 'Owns the shift-supervisor enablement track.' },
      { id: 'obs-buildtech-pmo', role: 'PMO', name: 'Rania Kabbaj', reportsTo: 'obs-buildtech-cm', notes: 'Coordinates with the automation vendor\'s integration team.' },
    ],
    changeType: 'process',
    businessDriver: 'Manual batch logs cause a 2-day delay in quality-hold decisions, directly slowing dispatch to construction-site customers.',
    targetPopulation: '~340 plant-floor operators and shift supervisors across two sites',
    successCriteria: 'Batch quality-hold decision time under 4 hours; digital batch log adoption above 90% by day 90.',
    lewinPhase: 'change',
    bridgesPhase: 'neutral',
    bridgesNote: 'Pilot line running dual paper-and-digital logging; crews adjusting to the overlap',
    sentimentSnapshot: 'Exploration on the pilot line; Resistance-Anger on lines not yet touched, over "why do it twice"',
    sponsor: {
      name: 'COO, Atlas BuildTech',
      visibility: 'moderate',
      visibilityNote: 'COO visible at pilot-line launch; not yet visited the second site',
      members: [
        { name: 'COO, Atlas BuildTech', role: 'Executive Sponsor', influence: 5, engagement: 3 },
        { name: 'Plant Manager, Berrechid', role: 'Coalition Member', influence: 3, engagement: 4 },
      ],
      actions: [{ action: 'COO plant floor walk at pilot line launch', phase: 'Prepare', done: true }],
    },
    aiUseCases: [],
    adkar: {
      awareness: { score: 4, note: 'Pilot line fully briefed; second site aware via cascade but not yet engaged directly' },
      desire: { score: 3, note: 'Pilot crew see the time savings; second-site crews skeptical until they see it themselves' },
      knowledge: { score: 3, note: 'Pilot crew trained; second-site training not yet scheduled' },
      ability: { score: 2, note: 'Pilot crew comfortable with the tablet interface after two weeks' },
      reinforcement: { score: 2, note: 'Daily huddle reinforcement on pilot line only' },
    },
    risks: [
      { category: 'adoption', description: 'Second-site crews may resist once dual paper-and-digital logging reaches their line', likelihood: 3, impact: 3, owner: 'Change Manager, Production Control Program', status: 'mitigating' },
      { category: 'capacity', description: 'Shift supervisors juggling pilot support with normal duties, risking coaching quality', likelihood: 3, impact: 3, owner: 'Plant Manager, Berrechid', status: 'open' },
    ],
    stakeholderGroups: [
      { name: 'Pilot Line Operators', headcount: 60, impact: { process: 5, tech: 4, role: 2, location: 1, identity: 2 }, influence: 2 },
      { name: 'Second-Site Operators (not yet live)', headcount: 180, impact: { process: 4, tech: 4, role: 2, location: 2, identity: 2 }, influence: 2 },
      { name: 'Shift Supervisors', headcount: 18, impact: { process: 4, tech: 3, role: 3, location: 1, identity: 2 }, influence: 4 },
    ],
    communications: [
      { message: 'Pilot line results: 6-hour faster quality-hold decisions', audience: 'All target population', channel: 'Plant-wide screen board', sender: 'Plant Manager, Berrechid', timing: 'Change phase — ongoing', adkarBlock: 'desire', status: 'sent' },
    ],
    trainings: [
      { curriculum: 'Digital Batch Logging — Tablet Interface', track: 'Plant Operators', facilitator: 'Automation Vendor Trainer', format: 'On-line hands-on session', completion: 35, certified: false },
    ],
    resistanceLog: [
      { type: 'systemic', rootCause: 'Dual paper-and-digital logging during transition doubles the operator\'s workload', mitigation: 'Set a hard cutover date per line rather than an open-ended overlap', status: 'mitigating' },
    ],
    coachingNotes: [],
    journeyEvents: [
      { offsetDays: -45, label: 'Quality-hold delay root-cause analysis', type: 'assessment' },
      { offsetDays: -20, label: 'Pilot line launch, Berrechid', type: 'milestone' },
      { offsetDays: 0, label: 'Today — pilot line dual-logging in progress', type: 'assessment' },
      { offsetDays: 60, label: 'Second-site (Nouaceur) rollout begins', type: 'training' },
      { offsetDays: 150, label: 'Planned full cutover, both sites', type: 'milestone' },
    ],
  },
  {
    id: 'cm-dairy-traceability',
    orgId: 'org-meknes-dairy',
    mainProjectIds: ['mp-dairy-traceability'],
    name: 'Dairy Cold-Chain Traceability Program',
    changeManager: 'Change Manager, Traceability Program',
    obsEntries: [
      { id: 'obs-dairy-cm', role: 'Change Manager, Traceability Program', name: 'Samira Ouahbi', reportsTo: null, notes: 'Leads collection-center and plant enablement.' },
      { id: 'obs-dairy-quality', role: 'Quality Assurance Lead', name: 'Mehdi Tazi', reportsTo: 'obs-dairy-cm', notes: 'Owns the export-market compliance requirements the program must satisfy.' },
    ],
    changeType: 'process',
    businessDriver: 'A new export-market buyer requires farm-to-shelf batch traceability and continuous cold-chain temperature logs before it will sign a supply contract.',
    targetPopulation: '~210 plant-floor and collection-center staff across 4 collection centers and the main plant',
    successCriteria: 'Full batch traceability live before the export buyer\'s Q3 audit; zero cold-chain excursions unlogged.',
    lewinPhase: 'unfreeze',
    bridgesPhase: 'ending',
    bridgesNote: 'Collection-center staff used to paper delivery slips only; digital logging is a first for most',
    sentimentSnapshot: 'Denial at collection centers ("we\'ve always done it this way"); cautious Exploration at the main plant where quality staff pushed for the change',
    sponsor: {
      name: 'General Manager, Meknes Dairy Cooperative',
      visibility: 'moderate',
      visibilityNote: 'GM personally briefed the plant; collection-center visits not yet scheduled',
      members: [
        { name: 'General Manager, Meknes Dairy Cooperative', role: 'Executive Sponsor', influence: 5, engagement: 3 },
        { name: 'Quality Assurance Lead', role: 'Coalition Member', influence: 3, engagement: 4 },
      ],
      actions: [{ action: 'GM briefing at main plant on export contract stakes', phase: 'Prepare', done: true }],
    },
    aiUseCases: [],
    adkar: {
      awareness: { score: 3, note: 'Plant staff aware via GM briefing; collection centers only informed by memo' },
      desire: { score: 2, note: 'Collection-center staff see extra logging as pure added work with no visible benefit to them' },
      knowledge: { score: 2, note: 'Plant staff trained on the new scanners; collection centers not yet trained' },
      ability: { score: 1, note: 'Handheld scanners not yet distributed to collection centers' },
      reinforcement: { score: 1, note: 'Too early' },
    },
    risks: [
      { category: 'adoption', description: 'Collection-center staff may under-log temperature checks if perceived as pure paperwork', likelihood: 4, impact: 5, owner: 'Change Manager, Traceability Program', status: 'open' },
      { category: 'capacity', description: 'Export buyer\'s Q3 audit date is fixed, leaving little schedule slack for a slow rollout', likelihood: 3, impact: 5, owner: 'General Manager, Meknes Dairy Cooperative', status: 'open' },
    ],
    stakeholderGroups: [
      { name: 'Collection Center Staff', headcount: 68, impact: { process: 5, tech: 5, role: 2, location: 3, identity: 2 }, influence: 1 },
      { name: 'Plant Quality & Processing Staff', headcount: 142, impact: { process: 4, tech: 3, role: 2, location: 1, identity: 2 }, influence: 3 },
    ],
    communications: [
      { message: 'Why the export contract depends on full traceability', audience: 'All target population', channel: 'Team briefing', sender: 'General Manager, Meknes Dairy Cooperative', timing: 'Prepare phase — completed', adkarBlock: 'awareness', status: 'sent' },
    ],
    trainings: [],
    resistanceLog: [
      { type: 'skill', rootCause: 'Collection-center staff have never used a handheld scanning device', mitigation: 'Peer-led hands-on session before go-live, not just a manual handout', status: 'open' },
    ],
    coachingNotes: [],
    journeyEvents: [
      { offsetDays: -25, label: 'Export buyer traceability requirement received', type: 'milestone' },
      { offsetDays: -8, label: 'GM briefing at main plant', type: 'communication' },
      { offsetDays: 0, label: 'Today — collection-center readiness assessment', type: 'assessment' },
      { offsetDays: 75, label: 'Export buyer Q3 audit', type: 'milestone' },
    ],
  },
  {
    id: 'cm-energy-safety',
    orgId: 'org-sahara-energy',
    mainProjectIds: ['mp-energy-safety'],
    name: 'Digital Safety & Operations Adoption',
    changeManager: 'Change Manager, Safety & Operations Program',
    obsEntries: [
      { id: 'obs-energy-cm', role: 'Change Manager, Safety & Operations Program', name: 'Karim Fassi', reportsTo: null, notes: 'Leads refinery and field-operations enablement jointly.' },
      { id: 'obs-energy-hse', role: 'HSE Director', name: 'Laila Benomar', reportsTo: 'obs-energy-cm', notes: 'Accountable for the permit-to-work compliance standard the program must meet.' },
      { id: 'obs-energy-pmo', role: 'PMO', name: 'Anas Tahiri', reportsTo: 'obs-energy-cm', notes: 'Coordinates the phased rollout across refinery and field sites.' },
    ],
    changeType: 'process',
    businessDriver: 'Paper-based permit-to-work approvals average 45 minutes during high-risk maintenance windows; a digital workflow targets under 10 minutes without weakening safety review.',
    targetPopulation: '~640 refinery and field operations staff, supervisors, and HSE reviewers',
    successCriteria: 'Permit approval time under 10 minutes for 80% of requests; zero safety-review steps skipped.',
    lewinPhase: 'change',
    bridgesPhase: 'neutral',
    bridgesNote: 'Refinery live on the digital workflow for 6 weeks; field operations still transitioning',
    sentimentSnapshot: 'Exploration at the refinery, where the new workflow is already saving time; Resistance-Anger in field operations, where connectivity is patchier',
    sponsor: {
      name: 'VP Operations, Sahara Energy Holding',
      visibility: 'strong',
      visibilityNote: 'VP chairs a biweekly steering review and has visited both the refinery and Laayoune field site',
      members: [
        { name: 'VP Operations, Sahara Energy Holding', role: 'Executive Sponsor', influence: 5, engagement: 5 },
        { name: 'HSE Director', role: 'Coalition Member', influence: 4, engagement: 5 },
        { name: 'Field Operations Manager, Laayoune', role: 'Coalition Member', influence: 3, engagement: 3 },
      ],
      actions: [
        { action: 'VP steering review — refinery results readout', phase: 'Change', done: true },
        { action: 'VP site visit to Laayoune field operations', phase: 'Change', done: false },
      ],
    },
    aiUseCases: [],
    adkar: {
      awareness: { score: 5, note: 'Fully briefed at both sites via HSE-led sessions' },
      desire: { score: 4, note: 'Refinery staff strong desire after seeing approval-time savings; field staff more cautious' },
      knowledge: { score: 4, note: 'Refinery certified; field operations training underway' },
      ability: { score: 3, note: 'Refinery proficient; field operations limited by intermittent connectivity' },
      reinforcement: { score: 3, note: 'Weekly HSE scorecard now includes permit-turnaround time' },
    },
    risks: [
      { category: 'capacity', description: 'Field site connectivity gaps could force a fallback to paper permits, undermining the digital-only target', likelihood: 4, impact: 4, owner: 'Field Operations Manager, Laayoune', status: 'mitigating' },
      { category: 'adoption', description: 'A near-miss during the transition period could trigger a safety-driven full reversion to paper', likelihood: 2, impact: 5, owner: 'HSE Director', status: 'open' },
    ],
    stakeholderGroups: [
      { name: 'Refinery Operations Staff', headcount: 310, impact: { process: 4, tech: 3, role: 2, location: 1, identity: 2 }, influence: 3 },
      { name: 'Field Operations Staff, Laayoune', headcount: 220, impact: { process: 4, tech: 4, role: 2, location: 3, identity: 2 }, influence: 2 },
      { name: 'HSE Reviewers', headcount: 32, impact: { process: 5, tech: 3, role: 3, location: 1, identity: 2 }, influence: 4 },
    ],
    communications: [
      { message: 'Refinery results: permit approval time down from 45 to 8 minutes', audience: 'All target population', channel: 'HSE scorecard + town hall', sender: 'HSE Director', timing: 'Change phase — ongoing', adkarBlock: 'desire', status: 'sent' },
    ],
    trainings: [
      { curriculum: 'Digital Permit-to-Work Workflow', track: 'Field Operations', facilitator: 'Internal HSE Team', format: 'On-site hands-on + offline-mode drill', completion: 55, certified: false },
    ],
    resistanceLog: [
      { type: 'systemic', rootCause: 'Field connectivity gaps make the digital workflow unreliable exactly when speed matters most', mitigation: 'Ship an offline-first mobile mode that syncs once connectivity returns', status: 'mitigating' },
    ],
    coachingNotes: [],
    journeyEvents: [
      { offsetDays: -60, label: 'Permit approval time-and-motion study', type: 'assessment' },
      { offsetDays: -42, label: 'Refinery go-live', type: 'milestone' },
      { offsetDays: -14, label: 'Refinery results readout to steering committee', type: 'milestone' },
      { offsetDays: 0, label: 'Today — field operations training underway', type: 'assessment' },
      { offsetDays: 90, label: 'Planned field operations go-live', type: 'milestone' },
    ],
  },
  {
    id: 'cm-rif-bim',
    orgId: 'org-rif-construction',
    mainProjectIds: ['mp-rif-bim'],
    name: 'Rif BIM Adoption Program',
    changeManager: 'Change Manager, BIM Adoption Program',
    obsEntries: [
      { id: 'obs-rif-cm', role: 'Change Manager, BIM Adoption Program', name: 'Yassine Berrada', reportsTo: null, notes: 'Now supporting sustainment across all 5 active project sites.' },
      { id: 'obs-rif-pmo', role: 'PMO', name: 'Imane Saadi', reportsTo: 'obs-rif-cm', notes: 'Tracks BIM model handoff quality across sites.' },
    ],
    changeType: 'technology',
    businessDriver: 'Rework caused by drawing-version conflicts cost an estimated 8% of project margin; a shared BIM model eliminates version conflicts at the source.',
    targetPopulation: '~280 site engineers and project controllers across 5 active project sites',
    successCriteria: 'Drawing-version rework incidents down 70%; all 5 sites on the shared model by go-live plus 90 days.',
    lewinPhase: 'refreeze',
    bridgesPhase: 'beginning',
    bridgesNote: 'All 5 sites now on the shared model; focus has shifted to habit reinforcement, not initial adoption',
    sentimentSnapshot: 'Commitment across most site teams; a residual pocket of Resistance-Anger among senior engineers who preferred the old drawing-issue process',
    sponsor: {
      name: 'Managing Director, Rif Construction Group',
      visibility: 'strong',
      visibilityNote: 'MD references the rework-reduction numbers in every monthly all-sites call',
      members: [
        { name: 'Managing Director, Rif Construction Group', role: 'Executive Sponsor', influence: 5, engagement: 5 },
        { name: 'Site Director rotation (5 sites)', role: 'Coalition Member', influence: 4, engagement: 4 },
      ],
      actions: [{ action: 'MD recognition of best-performing site team at monthly all-sites call', phase: 'Refreeze', done: true }],
    },
    aiUseCases: [],
    adkar: {
      awareness: { score: 5, note: 'Fully embedded in onboarding for any new site engineer' },
      desire: { score: 4, note: 'Rework-reduction results have converted most skeptics' },
      knowledge: { score: 5, note: 'All 5 sites certified on the shared model workflow' },
      ability: { score: 4, note: 'Day-to-day use is now routine at 4 of 5 sites' },
      reinforcement: { score: 3, note: 'Monthly all-sites recognition call; no formal reinforcement plan beyond that yet' },
    },
    risks: [
      { category: 'adoption', description: 'A small group of senior engineers still maintain shadow drawing sets outside the shared model', likelihood: 2, impact: 3, owner: 'Change Manager, BIM Adoption Program', status: 'mitigating' },
    ],
    stakeholderGroups: [
      { name: 'Site Engineers', headcount: 190, impact: { process: 5, tech: 4, role: 3, location: 2, identity: 3 }, influence: 3 },
      { name: 'Project Controllers', headcount: 45, impact: { process: 4, tech: 3, role: 2, location: 1, identity: 1 }, influence: 3 },
      { name: 'Senior Engineers (legacy process)', headcount: 22, impact: { process: 5, tech: 4, role: 4, location: 1, identity: 5 }, influence: 5 },
    ],
    communications: [
      { message: 'Six months in: rework down 65% across all sites', audience: 'All target population', channel: 'Monthly all-sites call', sender: 'Managing Director, Rif Construction Group', timing: 'Refreeze phase — ongoing', adkarBlock: 'reinforcement', status: 'sent' },
    ],
    trainings: [
      { curriculum: 'Shared BIM Model Workflow — Advanced Practices', track: 'Site Engineers', facilitator: 'Internal BIM Champions', format: 'On-site refresher session', completion: 88, certified: true },
    ],
    resistanceLog: [
      { type: 'will', rootCause: 'A handful of senior engineers see the shared model as diminishing their traditional drawing-authority role', mitigation: 'Give senior engineers a formal model-review sign-off role instead of removing their authority entirely', status: 'mitigating' },
    ],
    coachingNotes: [],
    sustainment: {
      checkpoints: [
        { label: '30-day', daysAfterGoLive: 30, adoptionRate: 62, regressionRisk: 'moderate', status: 'complete' },
        { label: '60-day', daysAfterGoLive: 60, adoptionRate: 78, regressionRisk: 'low', status: 'complete' },
        { label: '90-day', daysAfterGoLive: 90, adoptionRate: 85, regressionRisk: 'low', status: 'complete' },
      ],
      quickWins: [{ description: 'First site to fully retire paper drawing sets recognized company-wide', date: 'baseline -40d' }],
      signoff: false,
      lessonsLearned: [{ note: 'Give senior technical staff an elevated role in the new process rather than only asking them to adopt it', linkedRuleOrControl: '' }],
    },
    journeyEvents: [
      { offsetDays: -180, label: 'Rework cost analysis presented to leadership', type: 'assessment' },
      { offsetDays: -150, label: 'Shared model go-live, first 2 sites', type: 'milestone' },
      { offsetDays: -90, label: 'All 5 sites on shared model', type: 'milestone' },
      { offsetDays: -30, label: '90-day sustainment checkpoint — 85% adoption', type: 'milestone' },
      { offsetDays: 0, label: 'Today — reinforcement and habit-building phase', type: 'assessment' },
    ],
  },
]
