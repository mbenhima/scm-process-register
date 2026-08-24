import { uid } from '../utils/id.js'
import { generateDefaultWbs, addDays, todayISO } from '../utils/wbs.js'
import aiUseCaseCatalog from './aiUseCases.js'
import macroProcessCatalog from './macroProcesses.js'
import e2eProcessCatalog from './e2eProcesses.js'
import phaseTemplateCatalog from './phaseTemplates.js'
import defaultRacsiGrid from './racsi.js'
import { DEFAULT_ROLE_PERMISSIONS } from './constants.js'
import * as atlas from './cases/atlas.js'
import * as atlasTangier from './cases/atlasTangier.js'
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
  'phaseGates',
  'phaseChecklists',
  'charterActionLog',
  'touchpointLog',
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
  // ADKAR history seed: a single baseline snapshot per block by default, editable
  // going forward — unless the raw case file supplies its own explicit history
  // (e.g. a pre-populated example of a justified change), which is kept as-is.
  project.adkar = Object.fromEntries(
    Object.entries(raw.adkar).map(([block, val]) => [
      block,
      {
        ...val,
        history: (val.history || [{ date: 'baseline', score: val.score }]).map((h) => ({ id: uid('hist'), ...h })),
      },
    ]),
  )
  project.changeLog = (raw.changeLog || []).map((entry) => ({ id: uid('log'), ...entry }))
  // WBS/Gantt seed: a representative Project Management + Change Management + Framework
  // timeline anchored 90 days before "today", so the demo shows a mix of done, in-progress
  // and planned-only tasks with realistic baseline/actual gaps out of the box.
  project.wbsTasks = (raw.wbsTasks || generateDefaultWbs(addDays(todayISO(), -90))).map((t) => ({ id: uid('wbs'), ...t }))
  return project
}

export function buildSeed() {
  const groups = [{ id: 'grp-atlas', name: 'Atlas Industrial Group', defaultLanguage: 'fr' }]

  const organizations = [atlas.organization, atlasTangier.organization, maghreb.organization, meridia.organization]

  const mainProjects = [...atlas.mainProjects, ...atlasTangier.mainProjects, ...maghreb.mainProjects, ...meridia.mainProjects]

  const cmProjects = [...atlas.cmProjects, ...atlasTangier.cmProjects, ...maghreb.cmProjects, ...meridia.cmProjects].map(normalizeCmProject)

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
    { id: 'u-cm-atlas-tangier', name: 'Imane Fassi-Fihri', email: 'imane.fassifihri@atlas-industrial.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-atlas-tangier', language: 'fr' },
    { id: 'u-cm-maghreb-erp', name: 'Hicham Alaoui', email: 'hicham.alaoui@maghreb-logistics.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-maghreb-erp', language: 'fr' },
    { id: 'u-cm-maghreb-auto', name: 'Salma Benjelloun', email: 'salma.benjelloun@maghreb-logistics.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-maghreb-auto', language: 'ar' },
    { id: 'u-cm-maghreb-qms', name: 'Rachid Ouazzani', email: 'rachid.ouazzani@maghreb-logistics.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-maghreb-qms', language: 'ar' },
    { id: 'u-cm-meridia-erp', name: 'Dr. Yasmine Kadiri', email: 'yasmine.kadiri@meridia-health.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-meridia-erp', language: 'en' },
    { id: 'u-cm-meridia-auto', name: 'Adam Sefrioui', email: 'adam.sefrioui@meridia-health.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-meridia-auto', language: 'en' },
    { id: 'u-cm-meridia-qms', name: 'Dr. Nawal Berrada', email: 'nawal.berrada@meridia-health.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-meridia-qms', language: 'en' },
    { id: 'u-cm-maghreb-bpr', name: 'Nabil Chaoui', email: 'nabil.chaoui@maghreb-logistics.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-maghreb-bpr', language: 'ar' },
    { id: 'u-cm-maghreb-om', name: 'Widad Lahlou', email: 'widad.lahlou@maghreb-logistics.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-maghreb-om', language: 'ar' },
    { id: 'u-cm-meridia-comp', name: 'Dr. Samir Haddad', email: 'samir.haddad@meridia-health.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-meridia-comp', language: 'en' },
    { id: 'u-cm-atlas-tangier-tsd', name: 'Khadija Mansouri', email: 'khadija.mansouri@atlas-industrial.example', role: 'change_manager', scopeType: 'project', scopeId: 'cm-atlas-tangier-tsd', language: 'fr' },
    { id: 'u-pm-atlas', name: 'Mehdi Skalli', email: 'mehdi.skalli@atlas-industrial.example', role: 'people_manager', scopeType: 'project', scopeId: 'cm-atlas-erp', language: 'fr' },
    { id: 'u-sponsor-atlas', name: 'COO, Atlas Industrial Group', email: 'coo@atlas-industrial.example', role: 'sponsor', scopeType: 'project', scopeId: 'cm-atlas-erp', language: 'fr' },
    { id: 'u-exec', name: 'Board Executive Viewer', email: 'exec@journi.app', role: 'executive', scopeType: 'organization', scopeId: 'org-atlas', language: 'en' },
    { id: 'u-employee', name: 'Younes Amrani', email: 'younes.amrani@atlas-industrial.example', role: 'employee', scopeType: 'project', scopeId: 'cm-atlas-erp', language: 'ar' },
  ]

  const rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS))

  // Platform-wide default: any score/state change requires a justification.
  // A Super/Group/Org Admin can flip this off in Module 2's governance settings.
  const requireJustification = true

  // Platform License (D30, proportionate scope): journi has no backend, so this
  // is a lightweight client-side record of the license terms rather than the
  // full multi-platform Ed25519/Firebase licensing SDK the source spec describes —
  // seeded as a demo SaaS-mode license, editable by a Super Admin on Module 2.
  const license = {
    mode: 'saas',
    plan: 'professional',
    companyName: 'journi Demo Tenant',
    maxUsers: 50,
    issueDate: addDays(todayISO(), -90),
    expiryDate: addDays(todayISO(), 275),
    features: ['core_cm_modules', 'wbs_gantt', 'ai_use_case_library', 'process_registry_m19'],
    uploadedFile: null,
  }

  return {
    groups,
    organizations,
    mainProjects,
    cmProjects,
    users,
    aiUseCaseCatalog,
    macroProcessCatalog,
    e2eProcessCatalog,
    phaseTemplateCatalog,
    racsiGrid: JSON.parse(JSON.stringify(defaultRacsiGrid)),
    aiOrgActivation,
    aiProjectOverride,
    aiUsageLog,
    rolePermissions,
    requireJustification,
    license,
  }
}
