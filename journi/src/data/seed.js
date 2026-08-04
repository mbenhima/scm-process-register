import { uid } from '../utils/id.js'
import aiUseCaseCatalog from './aiUseCases.js'
import * as atlas from './cases/atlas.js'
import * as maghreb from './cases/maghreb.js'
import * as meridia from './cases/meridia.js'

const SUB_COLLECTIONS = [
  'risks',
  'stakeholderGroups',
  'communications',
  'trainings',
  'resistanceLog',
  'coachingNotes',
  'journeyEvents',
]

function normalizeCmProject(raw) {
  const project = { ...raw }
  for (const key of SUB_COLLECTIONS) {
    project[key] = (raw[key] || []).map((item) => ({ id: uid(key), ...item }))
  }
  project.sustainment = {
    ...raw.sustainment,
    checkpoints: (raw.sustainment?.checkpoints || []).map((c) => ({ id: uid('chk'), ...c })),
    quickWins: (raw.sustainment?.quickWins || []).map((q) => ({ id: uid('win'), ...q })),
    lessonsLearned: (raw.sustainment?.lessonsLearned || []).map((l) => ({ id: uid('lesson'), ...l })),
  }
  project.sponsor = {
    ...raw.sponsor,
    members: (raw.sponsor?.members || []).map((m) => ({ id: uid('coal'), ...m })),
    actions: (raw.sponsor?.actions || []).map((a) => ({ id: uid('spact'), ...a })),
  }
  // ADKAR history seed: one baseline snapshot ("today") per block, editable going forward
  project.adkar = Object.fromEntries(
    Object.entries(raw.adkar).map(([block, val]) => [
      block,
      { ...val, history: [{ id: uid('hist'), date: 'baseline', score: val.score }] },
    ]),
  )
  return project
}

export function buildSeed() {
  const groups = [{ id: 'grp-atlas', name: 'Atlas Industrial Group' }]

  const organizations = [atlas.organization, maghreb.organization, meridia.organization]

  const mainProjects = [...atlas.mainProjects, ...maghreb.mainProjects, ...meridia.mainProjects]

  const cmProjects = [...atlas.cmProjects, ...maghreb.cmProjects, ...meridia.cmProjects].map(normalizeCmProject)

  // AI Use Case Governance: org-level activation = union of everything any of its projects use.
  // Project-level entries mirror the seeded "activated (example)" list; undefined = inherit org default.
  const aiOrgActivation = {}
  const aiProjectOverride = {}
  for (const org of organizations) {
    aiOrgActivation[org.id] = Object.fromEntries(aiUseCaseCatalog.map((uc) => [uc.id, false]))
  }
  for (const proj of cmProjects) {
    aiProjectOverride[proj.id] = {}
    for (const ucId of proj.aiUseCases) {
      aiOrgActivation[proj.orgId][ucId] = true
      aiProjectOverride[proj.id][ucId] = true
    }
  }

  // Seed AI usage/override audit log — a handful of illustrative entries per activated use case
  const aiUsageLog = []
  const outcomes = ['accepted', 'edited', 'rejected']
  let logSeed = 0
  for (const proj of cmProjects) {
    proj.aiUseCases.forEach((ucId, idx) => {
      const uc = aiUseCaseCatalog.find((u) => u.id === ucId)
      logSeed += 1
      aiUsageLog.push({
        id: uid('log'),
        useCaseId: ucId,
        orgId: proj.orgId,
        cmProjectId: proj.id,
        outputSummary: `${uc.name} suggestion generated for ${proj.name}`,
        outcome: outcomes[logSeed % outcomes.length],
        user: proj.changeManager,
        timestamp: `baseline -${(idx + 1) * 4}d`,
      })
    })
  }

  const users = [
    { id: 'u-super', name: 'Amina Idrissi', email: 'amina.idrissi@journi.app', role: 'super_admin', scopeType: 'platform', scopeId: null, language: 'en' },
    { id: 'u-group', name: 'Youssef Bennani', email: 'youssef.bennani@atlas-industrial.example', role: 'group_admin', scopeType: 'group', scopeId: 'grp-atlas', language: 'fr' },
    { id: 'u-orgadmin-atlas', name: 'Sara El Fassi', email: 'sara.elfassi@atlas-industrial.example', role: 'org_admin', scopeType: 'organization', scopeId: 'org-atlas', language: 'fr' },
    { id: 'u-orgadmin-maghreb', name: 'Karim Ziani', email: 'karim.ziani@maghreb-logistics.example', role: 'org_admin', scopeType: 'organization', scopeId: 'org-maghreb', language: 'fr' },
    { id: 'u-orgadmin-meridia', name: 'Dr. Leila Amrani', email: 'leila.amrani@meridia-health.example', role: 'org_admin', scopeType: 'organization', scopeId: 'org-meridia', language: 'en' },
    { id: 'u-cm-atlas-erp', name: 'Nadia Chraibi', email: 'nadia.chraibi@atlas-industrial.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-atlas-erp', language: 'fr' },
    { id: 'u-cm-atlas-auto', name: 'Omar Tazi', email: 'omar.tazi@atlas-industrial.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-atlas-auto', language: 'fr' },
    { id: 'u-cm-atlas-qms', name: 'Fatima Zahra Naciri', email: 'fz.naciri@atlas-industrial.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-atlas-qms', language: 'fr' },
    { id: 'u-cm-atlas-safety', name: 'Yassine Berrada', email: 'yassine.berrada@atlas-industrial.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-atlas-safety-culture', language: 'fr' },
    { id: 'u-cm-maghreb-erp', name: 'Hicham Alaoui', email: 'hicham.alaoui@maghreb-logistics.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-maghreb-erp', language: 'fr' },
    { id: 'u-cm-maghreb-auto', name: 'Salma Benjelloun', email: 'salma.benjelloun@maghreb-logistics.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-maghreb-auto', language: 'ar' },
    { id: 'u-cm-maghreb-qms', name: 'Rachid Ouazzani', email: 'rachid.ouazzani@maghreb-logistics.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-maghreb-qms', language: 'ar' },
    { id: 'u-cm-meridia-erp', name: 'Dr. Yasmine Kadiri', email: 'yasmine.kadiri@meridia-health.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-meridia-erp', language: 'en' },
    { id: 'u-cm-meridia-auto', name: 'Adam Sefrioui', email: 'adam.sefrioui@meridia-health.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-meridia-auto', language: 'en' },
    { id: 'u-cm-meridia-qms', name: 'Dr. Nawal Berrada', email: 'nawal.berrada@meridia-health.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-meridia-qms', language: 'en' },
    { id: 'u-pm-atlas', name: 'Mehdi Skalli', email: 'mehdi.skalli@atlas-industrial.example', role: 'people_manager', scopeType: 'project', scopeId: 'cm-atlas-erp', language: 'fr' },
    { id: 'u-sponsor-atlas', name: 'COO, Atlas Industrial Group', email: 'coo@atlas-industrial.example', role: 'sponsor', scopeType: 'project', scopeId: 'cm-atlas-erp', language: 'fr' },
    { id: 'u-exec', name: 'Board Executive Viewer', email: 'exec@journi.app', role: 'executive', scopeType: 'organization', scopeId: 'org-atlas', language: 'en' },
    { id: 'u-employee', name: 'Younes Amrani', email: 'younes.amrani@atlas-industrial.example', role: 'employee', scopeType: 'project', scopeId: 'cm-atlas-erp', language: 'ar' },
  ]

  return { groups, organizations, mainProjects, cmProjects, users, aiUseCaseCatalog, aiOrgActivation, aiProjectOverride, aiUsageLog }
}
