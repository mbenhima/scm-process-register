// Second Organization under the Atlas Industrial Group — added specifically to give
// Group-level roll-up (Module 14 / Dashboard "Group" view) a real second tenant to
// aggregate, alongside the Casablanca Plant Cluster.
export const organization = {
  id: 'org-atlas-tangier',
  groupId: 'grp-atlas',
  name: 'Atlas Industrial Group — Tangier Free Zone Plant',
  sector: 'manufacturing',
  employeeCount: 950,
  sites: ['Tangier Free Zone Plant'],
  languages: ['fr', 'ar'],
  defaultLanguage: 'fr',
}

export const mainProjects = [
  {
    id: 'mp-atlas-tangier-erp',
    orgId: 'org-atlas-tangier',
    name: 'Tangier Plant ERP Extension',
    type: 'erp',
    scope: 'Extend the group-wide S/4HANA rollout to the newly acquired Tangier Free Zone plant, aligning it onto the same finance and inventory backbone as Casablanca.',
    durationMonths: 9,
    budgetBand: '€1.6M band',
    executiveSponsor: 'Plant Director, Tangier Free Zone',
  },
  {
    id: 'mp-atlas-tangier-tsd',
    orgId: 'org-atlas-tangier',
    name: 'Frontline Digital Skills Certification Program',
    type: 'training_skills',
    scope: 'Close a digital-literacy gap on the plant floor ahead of the ERP extension: certify all frontline operators on core digital-device and data-entry skills before any system-specific training begins.',
    durationMonths: 5,
    budgetBand: '€180K band',
    executiveSponsor: 'Plant Director, Tangier Free Zone',
  },
]

export const cmProjects = [
  {
    id: 'cm-atlas-tangier',
    orgId: 'org-atlas-tangier',
    mainProjectIds: ['mp-atlas-tangier-erp'],
    name: 'Tangier Plant Adoption Program',
    changeManager: 'Change Manager, Tangier Plant Program',
    changeType: 'technology',
    businessDriver: 'Bring the recently-acquired Tangier plant onto the same group-wide ERP backbone as the Casablanca cluster ahead of consolidated group reporting.',
    targetPopulation: '~600 plant and back-office staff at the Tangier Free Zone site',
    successCriteria: 'Full cutover from the legacy site system; adoption rate >80% at day 90; group-wide reporting consolidation unblocked.',
    lewinPhase: 'unfreeze',
    bridgesPhase: 'ending',
    bridgesNote: 'Newly onboarded site — kickoff communications just beginning',
    sentimentSnapshot: 'Mostly Denial — plant was only recently acquired and staff are still absorbing what group membership means operationally',
    sponsor: {
      name: 'Plant Director, Tangier Free Zone',
      visibility: 'weak',
      visibilityNote: 'Plant Director newly briefed by group COO; visibility not yet established with the wider plant population',
      members: [
        { name: 'Plant Director, Tangier Free Zone', role: 'Executive Sponsor', influence: 4, engagement: 2 },
        { name: 'COO, Atlas Industrial Group', role: 'Coalition Member', influence: 5, engagement: 3 },
      ],
      actions: [{ action: 'Group COO site visit and kickoff town hall', phase: 'Prepare', done: false }],
    },
    aiUseCases: [],
    adkar: {
      awareness: { score: 2, note: 'Only leadership briefed so far; plant-wide kickoff not yet held' },
      desire: { score: 2, note: 'Uncertainty about what group-wide systems will mean for local autonomy' },
      knowledge: { score: 1, note: 'No training curriculum defined yet' },
      ability: { score: 1, note: 'Too early to assess' },
      reinforcement: { score: 1, note: 'Pre-project' },
    },
    risks: [
      { category: 'adoption', description: 'Newly acquired site may resist group-wide standardization perceived as loss of local autonomy', likelihood: 3, impact: 4, owner: 'Plant Director, Tangier Free Zone', status: 'open' },
      { category: 'saturation', description: 'Group-wide S/4HANA program (Casablanca) and this extension could compete for the same shared-services support capacity', likelihood: 2, impact: 3, owner: 'PMO', status: 'open' },
    ],
    stakeholderGroups: [
      { name: 'Plant Operations', headcount: 420, impact: { process: 4, tech: 4, role: 3, location: 2, identity: 3 }, influence: 2 },
      { name: 'Finance & Admin', headcount: 180, impact: { process: 5, tech: 4, role: 3, location: 1, identity: 2 }, influence: 3 },
    ],
    communications: [
      { message: 'Welcome to the Atlas group-wide systems program', audience: 'All target population', channel: 'Email', sender: 'Plant Director, Tangier Free Zone', timing: 'Prepare phase — completed', adkarBlock: 'awareness', status: 'sent' },
    ],
    trainings: [],
    resistanceLog: [],
    coachingNotes: [],
    journeyEvents: [
      { offsetDays: -20, label: 'Acquisition integration kickoff', type: 'milestone' },
      { offsetDays: -10, label: 'Welcome communication sent', type: 'communication' },
      { offsetDays: 0, label: 'Today — baseline assessment', type: 'assessment' },
      { offsetDays: 270, label: 'Planned go-live', type: 'milestone' },
    ],
  },
  {
    id: 'cm-atlas-tangier-tsd',
    orgId: 'org-atlas-tangier',
    mainProjectIds: ['mp-atlas-tangier-tsd'],
    name: 'Tangier Frontline Digital Skills Program',
    changeManager: 'Change Manager, Tangier Digital Skills Program',
    changeType: 'process',
    businessDriver: 'A digital-literacy assessment ahead of the ERP extension found most frontline operators had never used a tablet or scanner device for work tasks — this program builds that baseline capability first, decoupled from any single system.',
    targetPopulation: '~420 frontline plant operators at the Tangier Free Zone site',
    successCriteria: '95% of operators certified on core digital-device skills before ERP-specific training begins; certification failure rate <5% on re-test.',
    lewinPhase: 'unfreeze',
    bridgesPhase: 'ending',
    bridgesNote: 'Ending phase — operators moving from paper-only workflows to device-based ones for the first time',
    sentimentSnapshot: 'Denial among longer-tenured operators who have never used a work device; Exploration among younger operators already device-comfortable outside work',
    sponsor: {
      name: 'Plant Director, Tangier Free Zone',
      visibility: 'moderate',
      visibilityNote: 'Plant Director sponsoring; shift supervisors form the coalition but not yet visible on the floor daily',
      members: [
        { name: 'Plant Director, Tangier Free Zone', role: 'Executive Sponsor', influence: 4, engagement: 3 },
        { name: 'Shift Supervisor — Day', role: 'Coalition Member', influence: 2, engagement: 3 },
        { name: 'Shift Supervisor — Night', role: 'Coalition Member', influence: 2, engagement: 2 },
      ],
      actions: [{ action: 'Plant Director floor walk introducing the certification program', phase: 'Prepare', done: true }],
    },
    aiUseCases: [],
    adkar: {
      awareness: { score: 3, note: 'Floor walk introduced the program; individual certification schedule not yet communicated' },
      desire: { score: 2, note: 'Longer-tenured operators worry that "not being good with devices" will be held against them' },
      knowledge: { score: 1, note: 'Curriculum designed; first cohort not yet started' },
      ability: { score: 1, note: 'No practice devices on the floor yet' },
      reinforcement: { score: 1, note: 'Pre-cohort' },
    },
    risks: [
      { category: 'capacity', description: 'Certification must complete before ERP-specific training can start, creating a hard sequencing dependency', likelihood: 3, impact: 4, owner: 'Change Manager, Tangier Digital Skills Program', status: 'open' },
      { category: 'adoption', description: 'Longer-tenured operators may perceive the certification as a proxy performance review rather than a skills investment', likelihood: 3, impact: 3, owner: 'Plant Director, Tangier Free Zone', status: 'open' },
    ],
    stakeholderGroups: [
      { name: 'Frontline Operators — Day Shift', headcount: 220, impact: { process: 3, tech: 5, role: 2, location: 1, identity: 3 }, influence: 1 },
      { name: 'Frontline Operators — Night Shift', headcount: 200, impact: { process: 3, tech: 5, role: 2, location: 1, identity: 3 }, influence: 1 },
    ],
    communications: [
      { message: 'This is a skills investment, not a performance review', audience: 'All target population', channel: 'Floor walk + poster', sender: 'Plant Director, Tangier Free Zone', timing: 'Prepare phase — completed', adkarBlock: 'desire', status: 'sent' },
    ],
    trainings: [
      { curriculum: 'Core Digital Device & Data-Entry Skills', track: 'Frontline Operators', facilitator: 'Internal L&D Team', format: 'Hands-on floor session', completion: 10, certified: false },
    ],
    resistanceLog: [],
    coachingNotes: [],
    sustainment: {
      checkpoints: [
        { label: '30-day', daysAfterGoLive: 30, adoptionRate: null, regressionRisk: null, status: 'not_due' },
        { label: '60-day', daysAfterGoLive: 60, adoptionRate: null, regressionRisk: null, status: 'not_due' },
        { label: '90-day', daysAfterGoLive: 90, adoptionRate: null, regressionRisk: null, status: 'not_due' },
      ],
      quickWins: [],
      signoff: false,
      lessonsLearned: [],
    },
    journeyEvents: [
      { offsetDays: -15, label: 'Digital-literacy baseline assessment completed', type: 'assessment' },
      { offsetDays: -5, label: 'Plant Director floor walk introducing the program', type: 'communication' },
      { offsetDays: 0, label: 'Today — baseline assessment', type: 'assessment' },
      { offsetDays: 30, label: 'First certification cohort begins', type: 'training' },
      { offsetDays: 120, label: 'All-operator certification target date', type: 'milestone' },
    ],
  },
]
