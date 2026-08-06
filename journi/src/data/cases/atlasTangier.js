// Second Organization under the Atlas Industrial Group — added specifically to give
// Group-level roll-up (Module 15 / Dashboard "Group" view) a real second tenant to
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
]
