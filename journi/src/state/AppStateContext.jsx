import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildSeed } from '../data/seed.js'
import { uid } from '../utils/id.js'
import { useI18n } from '../i18n/index.jsx'

const AppStateContext = createContext(null)
const STORAGE_KEY = 'journi.state.v1'

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.cmProjects && parsed.organizations) return parsed
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
      updateCheckpoint,
      addQuickWin,
      addLesson,
      toggleSignoff,
      toggleSponsorAction,
      addSponsorAction,
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
      updateCheckpoint,
      addQuickWin,
      addLesson,
      toggleSignoff,
      toggleSponsorAction,
      addSponsorAction,
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
