import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildSeed } from '../data/seed.js'
import macroProcessCatalog from '../data/macroProcesses.js'
import e2eProcessCatalog from '../data/e2eProcesses.js'
import phaseTemplateCatalog from '../data/phaseTemplates.js'
import defaultRacsiGrid from '../data/racsi.js'
import { DEFAULT_ROLE_PERMISSIONS } from '../data/constants.js'
import { uid } from '../utils/id.js'
import { addDays, todayISO } from '../utils/wbs.js'
import { useI18n } from '../i18n/index.jsx'
import { callLLM, recommendedModel } from '../utils/llmProviders.js'

const AppStateContext = createContext(null)
const STORAGE_KEY = 'journi.state.v1'
// Deliberately a separate localStorage key from STORAGE_KEY: an LLM connection
// is a browser-level setting, not seeded demo data, so it must survive
// Reset Demo Data untouched and never gets bundled into a data export/reset.
const LLM_CONFIG_KEY = 'journi.llmConfig.v1'

function loadLlmConfig() {
  try {
    const raw = localStorage.getItem(LLM_CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through to default
  }
  return { provider: 'anthropic', apiKey: '', model: recommendedModel('anthropic'), baseUrl: '', connected: false, lastError: null }
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.cmProjects && parsed.organizations) {
        // A browser session persisted before the Permission Matrix feature shipped
        // won't have this field — back-fill the default matrix rather than let every
        // capability check silently fail closed (matrix[role]?.write === undefined).
        if (!parsed.rolePermissions) parsed.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS))
        if (parsed.requireJustification === undefined) parsed.requireJustification = true
        // A browser session persisted before CR1 (8-type E2E addendum) shipped
        // won't have these reference catalogs — back-fill from the seed rather
        // than let Module 19 / the phase-template picker render empty.
        if (!parsed.macroProcessCatalog) parsed.macroProcessCatalog = macroProcessCatalog
        if (!parsed.e2eProcessCatalog) parsed.e2eProcessCatalog = e2eProcessCatalog
        if (!parsed.phaseTemplateCatalog) parsed.phaseTemplateCatalog = phaseTemplateCatalog
        if (!parsed.racsiGrid) parsed.racsiGrid = JSON.parse(JSON.stringify(defaultRacsiGrid))
        if (!parsed.license) {
          parsed.license = {
            mode: 'saas',
            plan: 'professional',
            companyName: 'journi Demo Tenant',
            maxUsers: 50,
            issueDate: addDays(todayISO(), -90),
            expiryDate: addDays(todayISO(), 275),
            features: ['core_cm_modules', 'wbs_gantt', 'ai_use_case_library', 'process_registry_m19'],
            uploadedFile: null,
          }
        }
        parsed.cmProjects = parsed.cmProjects.map((p) => ({
          ...p,
          phaseGates: p.phaseGates || [],
          phaseChecklists: p.phaseChecklists || [],
        }))
        return parsed
      }
    }
  } catch {
    // fall through to fresh seed
  }
  return buildSeed()
}

function updateProjectIn(list, projectId, fn) {
  return list.map((p) => (p.id === projectId ? fn(p) : p))
}

export function AppStateProvider({ children }) {
  const { setLang } = useI18n()
  const [data, setData] = useState(loadInitialState)
  const [llmConfig, setLlmConfigState] = useState(loadLlmConfig)
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('journi.currentUser') || null)
  const [scope, setScopeState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('journi.scope') || 'null') || { orgId: null, cmProjectId: null }
    } catch {
      return { orgId: null, cmProjectId: null }
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    // Never persist a raw API key to disk without the user's own action having
    // written it — this effect just mirrors whatever setLlmConfigState already
    // holds, so the key lives only as long as the browser profile does.
    localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(llmConfig))
  }, [llmConfig])

  useEffect(() => {
    if (currentUserId) localStorage.setItem('journi.currentUser', currentUserId)
    else localStorage.removeItem('journi.currentUser')
  }, [currentUserId])

  useEffect(() => {
    localStorage.setItem('journi.scope', JSON.stringify(scope))
  }, [scope])

  const currentUser = useMemo(() => data.users.find((u) => u.id === currentUserId) || null, [data.users, currentUserId])

  // Switching Organization re-applies that tenant's configured default language —
  // a personal language choice should not permanently "supersede" every
  // Organization/Group's own setting once you move between tenants.
  const setScope = useCallback(
    (next) => {
      if (next.orgId) {
        setScopeState((prev) => {
          if (next.orgId !== prev.orgId) {
            const org = data.organizations.find((o) => o.id === next.orgId)
            if (org?.defaultLanguage) setLang(org.defaultLanguage)
          }
          return { ...prev, ...next }
        })
      } else {
        setScopeState((prev) => ({ ...prev, ...next }))
      }
    },
    [data.organizations, setLang],
  )

  const signIn = useCallback(
    (userId) => {
      setCurrentUserId(userId)
      const user = data.users.find((u) => u.id === userId)
      if (user) {
        let org = null
        if (user.scopeType === 'project') {
          const proj = data.cmProjects.find((p) => p.id === user.scopeId)
          org = data.organizations.find((o) => o.id === proj?.orgId) || null
          setScopeState({ orgId: proj?.orgId || null, cmProjectId: user.scopeId })
        } else if (user.scopeType === 'organization') {
          org = data.organizations.find((o) => o.id === user.scopeId) || null
          setScopeState({ orgId: user.scopeId, cmProjectId: null })
        } else if (user.scopeType === 'group') {
          org = data.organizations.find((o) => o.groupId === user.scopeId) || null
          setScopeState({ orgId: org?.id || null, cmProjectId: null })
        } else {
          org = data.organizations[0]
          const proj = data.cmProjects.find((p) => p.orgId === org.id)
          setScopeState({ orgId: org.id, cmProjectId: proj?.id || null })
        }
        // Precedence: explicit per-user preference, then the tenant's configured
        // default, then the platform fallback — never a stray leftover session value.
        setLang(user.language || org?.defaultLanguage || 'en')
      }
    },
    [data, setLang],
  )

  const signOut = useCallback(() => setCurrentUserId(null), [])

  const resetDemoData = useCallback(() => {
    const fresh = buildSeed()
    setData(fresh)
  }, [])

  // ---------- Mutators ----------
  const updateProjectMeta = useCallback((projectId, patch) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({ ...p, ...patch })),
    }))
  }, [])

  const updateAdkar = useCallback((projectId, block, { score, note }) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => {
        const current = p.adkar[block]
        const changed = score !== undefined && score !== current.score
        const justification = note ?? current.note
        return {
          ...p,
          adkar: {
            ...p.adkar,
            [block]: {
              score: score ?? current.score,
              note: justification,
              history: changed
                ? [...current.history, { id: uid('hist'), date: new Date().toISOString().slice(0, 10), score, justification }]
                : current.history,
            },
          },
          changeLog: changed
            ? [
                ...(p.changeLog || []),
                {
                  id: uid('log'),
                  date: new Date().toISOString().slice(0, 10),
                  module: 'M6 · ADKAR Engine',
                  field: block,
                  oldValue: String(current.score),
                  newValue: String(score),
                  justification,
                },
              ]
            : p.changeLog || [],
        }
      }),
    }))
  }, [])

  /**
   * General-purpose justified change: applies `applyPatch` to the project and
   * appends one changeLog entry in the same update, so a score/state change
   * and the evidence behind it are always recorded together — never as two
   * separate, driftable steps. Used by M4 (Lewin), M7 (Bridges / Kübler-Ross).
   */
  const logJustifiedChange = useCallback((projectId, { module, field, oldValue, newValue, justification, applyPatch }) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...applyPatch(p),
        changeLog: [
          ...(p.changeLog || []),
          { id: uid('log'), date: new Date().toISOString().slice(0, 10), module, field, oldValue, newValue, justification },
        ],
      })),
    }))
  }, [])

  const addSubItem = useCallback((projectId, collection, item) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        [collection]: [...(p[collection] || []), { id: uid(collection), ...item }],
      })),
    }))
  }, [])

  const updateSubItem = useCallback((projectId, collection, itemId, patch) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        [collection]: (p[collection] || []).map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      })),
    }))
  }, [])

  const removeSubItem = useCallback((projectId, collection, itemId) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        [collection]: (p[collection] || []).filter((it) => it.id !== itemId),
      })),
    }))
  }, [])

  /**
   * Seeds the PM track with one skeleton task per phase of a Phase Template
   * (D32b), spaced evenly from `startISO` — a starting point the user then
   * breaks down into real tasks, not a finished plan.
   */
  const loadPhaseTemplate = useCallback((projectId, templateId, startISO, phaseDurationDays = 30) => {
    setData((prev) => {
      const template = prev.phaseTemplateCatalog.find((tpl) => tpl.id === templateId)
      if (!template) return prev
      const newTasks = template.phases.map((phase, i) => ({
        id: uid('wbsTasks'),
        track: 'pm',
        phase,
        name: phase,
        baselineStart: addDays(startISO, i * phaseDurationDays),
        baselineEnd: addDays(startISO, (i + 1) * phaseDurationDays - 1),
        actualStart: null,
        actualEnd: null,
        status: 'planned',
      }))
      return {
        ...prev,
        cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
          ...p,
          wbsTasks: [...(p.wbsTasks || []), ...newTasks],
        })),
      }
    })
  }, [])

  const updateSustainment = useCallback((projectId, patchFn) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        sustainment: patchFn(p.sustainment),
      })),
    }))
  }, [])

  const updateCheckpoint = useCallback(
    (projectId, checkpointId, patch) => {
      updateSustainment(projectId, (s) => ({
        ...s,
        checkpoints: s.checkpoints.map((c) => (c.id === checkpointId ? { ...c, ...patch } : c)),
      }))
    },
    [updateSustainment],
  )

  const addQuickWin = useCallback(
    (projectId, win) => {
      updateSustainment(projectId, (s) => ({ ...s, quickWins: [...s.quickWins, { id: uid('win'), ...win }] }))
    },
    [updateSustainment],
  )

  const addLesson = useCallback(
    (projectId, text) => {
      updateSustainment(projectId, (s) => ({ ...s, lessonsLearned: [...s.lessonsLearned, { id: uid('lesson'), text }] }))
    },
    [updateSustainment],
  )

  const toggleSignoff = useCallback(
    (projectId) => {
      updateSustainment(projectId, (s) => ({ ...s, signoff: !s.signoff }))
    },
    [updateSustainment],
  )

  const toggleSponsorAction = useCallback((projectId, actionId) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        sponsor: {
          ...p.sponsor,
          actions: p.sponsor.actions.map((a) => (a.id === actionId ? { ...a, done: !a.done } : a)),
        },
      })),
    }))
  }, [])

  const addSponsorAction = useCallback((projectId, action) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        sponsor: { ...p.sponsor, actions: [...p.sponsor.actions, { id: uid('spact'), done: false, ...action }] },
      })),
    }))
  }, [])

  const setRequireJustification = useCallback((value) => {
    setData((prev) => ({ ...prev, requireJustification: value }))
  }, [])

  const updateRolePermission = useCallback((role, capabilityKey, value) => {
    setData((prev) => ({
      ...prev,
      rolePermissions: {
        ...prev.rolePermissions,
        [role]: { ...prev.rolePermissions[role], [capabilityKey]: value },
      },
    }))
  }, [])

  const updateRacsiCell = useCallback((macroProcessId, role, value) => {
    setData((prev) => ({
      ...prev,
      racsiGrid: {
        ...prev.racsiGrid,
        [macroProcessId]: { ...prev.racsiGrid[macroProcessId], [role]: value },
      },
    }))
  }, [])

  const updateLicense = useCallback((patch) => {
    setData((prev) => ({ ...prev, license: { ...prev.license, ...patch } }))
  }, [])

  // ---------- LLM provider connection (browser-local, no backend) ----------
  const setLlmConfig = useCallback((patch) => {
    setLlmConfigState((prev) => ({ ...prev, ...patch, connected: false, lastError: null }))
  }, [])

  const testAndConnectLlm = useCallback(async () => {
    setLlmConfigState((prev) => ({ ...prev, lastError: null }))
    try {
      const reply = await callLLM(llmConfig, 'Reply with exactly one word: OK')
      if (!reply) throw new Error('Empty response from provider.')
      setLlmConfigState((prev) => ({ ...prev, connected: true, lastError: null }))
      return { ok: true }
    } catch (err) {
      setLlmConfigState((prev) => ({ ...prev, connected: false, lastError: err.message }))
      return { ok: false, error: err.message }
    }
  }, [llmConfig])

  const disconnectLlm = useCallback(() => {
    setLlmConfigState((prev) => ({ ...prev, connected: false, lastError: null }))
  }, [])

  const generateWithLlm = useCallback(
    (prompt) => {
      if (!llmConfig.connected) return Promise.reject(new Error('No LLM provider connected.'))
      return callLLM(llmConfig, prompt)
    },
    [llmConfig],
  )

  const toggleAiOrgActivation = useCallback((orgId, useCaseId) => {
    setData((prev) => ({
      ...prev,
      aiOrgActivation: {
        ...prev.aiOrgActivation,
        [orgId]: { ...prev.aiOrgActivation[orgId], [useCaseId]: !prev.aiOrgActivation[orgId][useCaseId] },
      },
    }))
  }, [])

  const toggleAiProjectOverride = useCallback((projectId, useCaseId, value) => {
    setData((prev) => ({
      ...prev,
      aiProjectOverride: {
        ...prev.aiProjectOverride,
        [projectId]: { ...prev.aiProjectOverride[projectId], [useCaseId]: value },
      },
    }))
  }, [])

  const logAiUsage = useCallback((entry) => {
    setData((prev) => ({
      ...prev,
      aiUsageLog: [{ id: uid('log'), timestamp: new Date().toISOString(), ...entry }, ...prev.aiUsageLog],
    }))
  }, [])

  const addGroup = useCallback((group) => {
    setData((prev) => ({ ...prev, groups: [...prev.groups, { id: uid('grp'), ...group }] }))
  }, [])

  const addOrganization = useCallback((org) => {
    setData((prev) => {
      const id = uid('org')
      return {
        ...prev,
        organizations: [...prev.organizations, { id, ...org }],
        aiOrgActivation: {
          ...prev.aiOrgActivation,
          [id]: Object.fromEntries(prev.aiUseCaseCatalog.map((uc) => [uc.id, false])),
        },
      }
    })
  }, [])

  const addMainProject = useCallback((mp) => {
    setData((prev) => ({ ...prev, mainProjects: [...prev.mainProjects, { id: uid('mp'), ...mp }] }))
  }, [])

  const addCmProject = useCallback((cm) => {
    setData((prev) => {
      const id = uid('cm')
      const blank = { score: 1, note: '', history: [{ id: uid('hist'), date: 'baseline', score: 1 }] }
      const project = {
        id,
        mainProjectIds: [],
        lewinPhase: 'unfreeze',
        bridgesPhase: 'ending',
        bridgesNote: '',
        sentimentSnapshot: '',
        aiUseCases: [],
        changeLog: [],
        adkar: { awareness: blank, desire: { ...blank }, knowledge: { ...blank }, ability: { ...blank }, reinforcement: { ...blank } },
        risks: [],
        stakeholderGroups: [],
        communications: [],
        trainings: [],
        resistanceLog: [],
        coachingNotes: [],
        journeyEvents: [],
        wbsTasks: [],
        phaseGates: [],
        phaseChecklists: [],
        sponsor: { name: '', visibility: 'weak', visibilityNote: '', members: [], actions: [] },
        sustainment: {
          checkpoints: [
            { id: uid('chk'), label: '30-day', daysAfterGoLive: 30, adoptionRate: null, regressionRisk: null, status: 'not_due' },
            { id: uid('chk'), label: '60-day', daysAfterGoLive: 60, adoptionRate: null, regressionRisk: null, status: 'not_due' },
            { id: uid('chk'), label: '90-day', daysAfterGoLive: 90, adoptionRate: null, regressionRisk: null, status: 'not_due' },
          ],
          quickWins: [],
          lessonsLearned: [],
          signoff: false,
        },
        ...cm,
      }
      return {
        ...prev,
        cmProjects: [...prev.cmProjects, project],
        aiProjectOverride: { ...prev.aiProjectOverride, [id]: {} },
      }
    })
  }, [])

  const updateOrganization = useCallback((orgId, patch) => {
    setData((prev) => ({ ...prev, organizations: prev.organizations.map((o) => (o.id === orgId ? { ...o, ...patch } : o)) }))
  }, [])

  const deleteGroup = useCallback((groupId) => {
    setData((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== groupId),
      organizations: prev.organizations.map((o) => (o.groupId === groupId ? { ...o, groupId: null } : o)),
    }))
  }, [])

  const deleteMainProject = useCallback((mainProjectId) => {
    setData((prev) => ({
      ...prev,
      mainProjects: prev.mainProjects.filter((mp) => mp.id !== mainProjectId),
      cmProjects: prev.cmProjects.map((cm) =>
        (cm.mainProjectIds || []).includes(mainProjectId)
          ? { ...cm, mainProjectIds: cm.mainProjectIds.filter((id) => id !== mainProjectId) }
          : cm,
      ),
    }))
  }, [])

  const deleteCmProject = useCallback((cmProjectId) => {
    setData((prev) => {
      const { [cmProjectId]: _drop, ...aiProjectOverride } = prev.aiProjectOverride
      return {
        ...prev,
        cmProjects: prev.cmProjects.filter((cm) => cm.id !== cmProjectId),
        aiProjectOverride,
        users: prev.users.filter((u) => !(u.scopeType === 'project' && u.scopeId === cmProjectId)),
      }
    })
  }, [])

  const deleteOrganization = useCallback((orgId) => {
    setData((prev) => {
      const cmIdsInOrg = new Set(prev.cmProjects.filter((cm) => cm.orgId === orgId).map((cm) => cm.id))
      const aiProjectOverride = Object.fromEntries(Object.entries(prev.aiProjectOverride).filter(([id]) => !cmIdsInOrg.has(id)))
      const { [orgId]: _drop, ...aiOrgActivation } = prev.aiOrgActivation
      return {
        ...prev,
        organizations: prev.organizations.filter((o) => o.id !== orgId),
        mainProjects: prev.mainProjects.filter((mp) => mp.orgId !== orgId),
        cmProjects: prev.cmProjects.filter((cm) => cm.orgId !== orgId),
        aiOrgActivation,
        aiProjectOverride,
        users: prev.users.filter((u) => {
          if (u.scopeType === 'organization' && u.scopeId === orgId) return false
          if (u.scopeType === 'project' && cmIdsInOrg.has(u.scopeId)) return false
          return true
        }),
      }
    })
  }, [])

  const addUser = useCallback((user) => {
    setData((prev) => ({ ...prev, users: [...prev.users, { id: uid('u'), ...user }] }))
  }, [])

  const updateUser = useCallback((userId, patch) => {
    setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) }))
  }, [])

  const removeUser = useCallback((userId) => {
    setData((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== userId) }))
  }, [])

  const value = useMemo(
    () => ({
      data,
      currentUser,
      scope,
      setScope,
      signIn,
      signOut,
      resetDemoData,
      updateProjectMeta,
      updateAdkar,
      logJustifiedChange,
      addSubItem,
      updateSubItem,
      removeSubItem,
      loadPhaseTemplate,
      updateCheckpoint,
      addQuickWin,
      addLesson,
      toggleSignoff,
      toggleSponsorAction,
      addSponsorAction,
      updateRolePermission,
      updateRacsiCell,
      updateLicense,
      setRequireJustification,
      llmConfig,
      setLlmConfig,
      testAndConnectLlm,
      disconnectLlm,
      generateWithLlm,
      toggleAiOrgActivation,
      toggleAiProjectOverride,
      logAiUsage,
      addGroup,
      addOrganization,
      updateOrganization,
      deleteGroup,
      deleteOrganization,
      deleteMainProject,
      deleteCmProject,
      addMainProject,
      addCmProject,
      addUser,
      updateUser,
      removeUser,
    }),
    [
      data,
      currentUser,
      scope,
      setScope,
      signIn,
      signOut,
      resetDemoData,
      updateProjectMeta,
      updateAdkar,
      logJustifiedChange,
      addSubItem,
      updateSubItem,
      removeSubItem,
      loadPhaseTemplate,
      updateCheckpoint,
      addQuickWin,
      addLesson,
      toggleSignoff,
      toggleSponsorAction,
      addSponsorAction,
      updateRolePermission,
      updateRacsiCell,
      updateLicense,
      setRequireJustification,
      llmConfig,
      setLlmConfig,
      testAndConnectLlm,
      disconnectLlm,
      generateWithLlm,
      toggleAiOrgActivation,
      toggleAiProjectOverride,
      logAiUsage,
      addGroup,
      addOrganization,
      updateOrganization,
      deleteGroup,
      deleteOrganization,
      deleteMainProject,
      deleteCmProject,
      addMainProject,
      addCmProject,
      addUser,
      updateUser,
      removeUser,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
