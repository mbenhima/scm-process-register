import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildSeed } from '../data/seed.js'
import macroProcessCatalog from '../data/macroProcesses.js'
import e2eProcessCatalog from '../data/e2eProcesses.js'
import phaseTemplateCatalog from '../data/phaseTemplates.js'
import defaultRacsiGrid from '../data/racsi.js'
import defaultCodebook from '../data/defaultCodebook.js'
import defaultCharters from '../data/charters.js'
import { DEFAULT_ROLE_PERMISSIONS } from '../data/constants.js'
import { uid } from '../utils/id.js'
import { addDays, todayISO } from '../utils/wbs.js'
import { withVersionBump, revertEntityToVersion } from '../utils/versioning.js'
import { useI18n } from '../i18n/index.jsx'
import { callLLM, recommendedModel } from '../utils/llmProviders.js'

const AppStateContext = createContext(null)
// An LLM connection is a browser-level setting, not seeded demo data — kept in
// localStorage (not the backend) so it survives Reset Demo Data untouched and
// never gets bundled into a data export or synced across machines.
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

// journi persists its app-wide state to a small local backend (Express +
// SQLite, see /server) instead of the browser's localStorage — this is what
// makes data survive a reinstall, a different browser, or being opened from a
// second PC on the same network. migrateOrSeed() takes whatever the backend
// last saved (or null, on a brand-new install) and either back-fills it
// against every schema change journi has shipped since, or falls back to a
// fresh demo seed.
function migrateOrSeed(parsed) {
  try {
    if (parsed && parsed.cmProjects && parsed.organizations) {
      // A browser session persisted before the Permission Matrix feature shipped
      // won't have this field — back-fill the default matrix rather than let every
      // capability check silently fail closed (matrix[role]?.write === undefined).
      if (!parsed.rolePermissions) parsed.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS))
      if (parsed.requireJustification === undefined) parsed.requireJustification = true
      // A browser session persisted before CR1 (8-type E2E addendum) shipped
      // won't have these reference catalogs — back-fill from the seed rather
      // than let Module 18 / the phase-template picker render empty.
      if (!parsed.macroProcessCatalog) parsed.macroProcessCatalog = macroProcessCatalog
      if (!parsed.e2eProcessCatalog) parsed.e2eProcessCatalog = e2eProcessCatalog
      if (!parsed.phaseTemplateCatalog) parsed.phaseTemplateCatalog = phaseTemplateCatalog
      // D33/D34: AI Use Cases and Phase Templates became full versioned CRUD
      // after these catalogs first shipped — back-fill version/versionHistory
      // onto every existing entry so the version panel has something to show.
      parsed.aiUseCaseCatalog = (parsed.aiUseCaseCatalog || []).map((uc) => ({
        version: 1,
        versionHistory: [],
        // A session persisted before the catalog gained an editable prompt
        // template (Part 4.7-adjacent feature) won't have this field yet.
        promptTemplate: '',
        ...uc,
      }))
      parsed.phaseTemplateCatalog = parsed.phaseTemplateCatalog.map((tpl) => ({
        version: 1,
        versionHistory: [],
        ...tpl,
        // A session persisted before phases gained a CM track / checklist /
        // gate criteria won't have those fields yet, and older sessions kept
        // each phase as a plain name string rather than an object.
        phases: (tpl.phases || []).map((phase) =>
          typeof phase === 'string'
            ? { name: phase, cmTrack: [], checklist: [], gate: [] }
            : { cmTrack: [], checklist: [], gate: [], ...phase },
        ),
      }))
      if (!parsed.racsiGrid) parsed.racsiGrid = JSON.parse(JSON.stringify(defaultRacsiGrid))
      // D32k QCW-01: a session persisted before the Qualitative Coding
      // Workbench shipped won't have a codebook per Organization yet.
      if (!parsed.codebooks) {
        parsed.codebooks = {}
        for (const org of parsed.organizations) {
          parsed.codebooks[org.id] = defaultCodebook.map((c) => ({ id: uid('code'), ...c }))
        }
      }
      // D31b: a session persisted before Charter CRUD shipped won't have
      // data.charters yet — back-fill from the same default set Module 19
      // used to render as a static import.
      if (!parsed.charters) parsed.charters = JSON.parse(JSON.stringify(defaultCharters))
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
        charterActionLog: p.charterActionLog || [],
        touchpointLog: p.touchpointLog || [],
        codeTags: p.codeTags || [],
        dismissedAlerts: p.dismissedAlerts || [],
        // Module 21 — Field Notes: a session persisted before this shipped
        // won't have the array yet. A session persisted before the related-
        // module field became multi-select won't have relatedModules — back-
        // fill it from the old single relatedModule string.
        fieldNotes: (p.fieldNotes || []).map((n) => ({
          relatedModules: n.relatedModules || (n.relatedModule ? [n.relatedModule] : []),
          ...n,
        })),
        // Module 22 — OBS (Organizational Breakdown Structure): a session
        // persisted before this shipped won't have the array yet.
        obsEntries: p.obsEntries || [],
      }))
      return parsed
    }
  } catch {
    // fall through to fresh seed
  }
  return buildSeed()
}

// The backend (server/index.js) serves both the built frontend and this API
// from the same origin, so a relative path works whether journi is opened via
// the production server or the Vite dev server (which proxies /api to it —
// see vite.config.js). A backend that never responds (not started, or a
// frontend-only checkout with no /server running) degrades gracefully: these
// helpers resolve to null / fail silently, and the app keeps running on the
// in-memory demo seed for that session.
const API_BASE = '/api'

async function fetchServerState() {
  try {
    const res = await fetch(`${API_BASE}/state`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function saveServerState(payload) {
  try {
    await fetch(`${API_BASE}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Best-effort — a save that can't reach the backend right now is retried
    // on the next state change (the debounced effect below fires again), so
    // nothing is lost as long as the tab stays open and the backend recovers.
  }
}

function updateProjectIn(list, projectId, fn) {
  return list.map((p) => (p.id === projectId ? fn(p) : p))
}

export function AppStateProvider({ children }) {
  const { setLang } = useI18n()
  // Renders immediately on a fresh demo seed so there is no loading-spinner
  // flash; the effect below swaps in the backend's real persisted state (if
  // any) as soon as it resolves, typically well under 100ms on localhost.
  const [data, setData] = useState(buildSeed)
  const [llmConfig, setLlmConfigState] = useState(loadLlmConfig)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [scope, setScopeState] = useState({ orgId: null, cmProjectId: null })
  // Guards the save effect below from firing before we've actually checked
  // what the backend has — without this, the seed data rendered above could
  // race a slow-resolving fetch and overwrite real persisted state with it.
  const [loadedFromServer, setLoadedFromServer] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchServerState().then((server) => {
      if (cancelled) return
      if (server && server.data) {
        setData(migrateOrSeed(server.data))
        setCurrentUserId(server.currentUserId || null)
        setScopeState(server.scope || { orgId: null, cmProjectId: null })
      }
      // else: first run against a brand-new database, or backend unreachable —
      // keep the seed already in state; the save effect below pushes it to the
      // backend as soon as loadedFromServer flips true.
      setLoadedFromServer(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const saveTimer = useRef(null)
  useEffect(() => {
    if (!loadedFromServer) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    // Debounced: mutators fire in quick succession (e.g. typing a note), and
    // saving on every keystroke would flood the backend with writes for no
    // benefit — 400ms coalesces a burst of changes into a single save.
    saveTimer.current = setTimeout(() => {
      saveServerState({ data, currentUserId, scope })
    }, 400)
    return () => clearTimeout(saveTimer.current)
  }, [data, currentUserId, scope, loadedFromServer])

  useEffect(() => {
    // Never persist a raw API key to the backend without the user's own action
    // having written it — an LLM connection is a browser-level setting, kept
    // in localStorage only, so it survives Reset Demo Data untouched and is
    // never bundled into a data export or shared across machines.
    localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(llmConfig))
  }, [llmConfig])

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
                  module: 'M5 · ADKAR Engine',
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
   * separate, driftable steps. Used by M3 (Lewin), M6 (Bridges / Kübler-Ross).
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
        accountabilityTag: 'PROJECT',
        phase: phase.name,
        name: phase.name,
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

  // Phase Template Library CRUD (D32b) — templates were previously shared,
  // read-only reference content; a new template definition now carries its own
  // version history so a bad edit can be reverted without losing the original.
  const addPhaseTemplate = useCallback((tpl) => {
    setData((prev) => ({
      ...prev,
      phaseTemplateCatalog: [...prev.phaseTemplateCatalog, { ...tpl, id: tpl.id || uid('tpl'), version: 1, versionHistory: [] }],
    }))
  }, [])

  const updatePhaseTemplate = useCallback((templateId, patch, note) => {
    setData((prev) => ({
      ...prev,
      phaseTemplateCatalog: prev.phaseTemplateCatalog.map((tpl) =>
        tpl.id === templateId ? withVersionBump(tpl, patch, note) : tpl,
      ),
    }))
  }, [])

  const deletePhaseTemplate = useCallback((templateId) => {
    setData((prev) => ({
      ...prev,
      phaseTemplateCatalog: prev.phaseTemplateCatalog.filter((tpl) => tpl.id !== templateId),
    }))
  }, [])

  const revertPhaseTemplate = useCallback((templateId, targetVersion) => {
    setData((prev) => ({
      ...prev,
      phaseTemplateCatalog: prev.phaseTemplateCatalog.map((tpl) =>
        tpl.id === templateId ? revertEntityToVersion(tpl, targetVersion) : tpl,
      ),
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
    (projectId, text, linkedRuleOrControl = '') => {
      updateSustainment(projectId, (s) => ({
        ...s,
        lessonsLearned: [...s.lessonsLearned, { id: uid('lesson'), text, linkedRuleOrControl, status: linkedRuleOrControl ? 'applied' : 'pending' }],
      }))
    },
    [updateSustainment],
  )

  // D25 REX Institutionalization Log: a lesson only closes the loop once it names
  // exactly which Rule, Control, or Charter now encodes it — this toggles that.
  const updateLesson = useCallback(
    (projectId, lessonId, patch) => {
      updateSustainment(projectId, (s) => ({
        ...s,
        lessonsLearned: s.lessonsLearned.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)),
      }))
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

  // Module 19 — D31a Charter Action Mapping compliance tracking: a Change
  // Manager (or, within their module scope, another role per D31b) logs
  // completion of a specific charter-governed action for their project,
  // giving REQ-012's charter compliance something trackable rather than
  // only static reference content.
  const logCharterAction = useCallback((projectId, charterActionId, note) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        charterActionLog: [
          { id: uid('chtrlog'), charterActionId, date: todayISO(), note: note || '' },
          ...(p.charterActionLog || []),
        ],
      })),
    }))
  }, [])

  const deleteCharterActionLog = useCallback((projectId, logId) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        charterActionLog: (p.charterActionLog || []).filter((l) => l.id !== logId),
      })),
    }))
  }, [])

  // Module 21 — Field Notes: a lightweight, freeform log for the knowledge that
  // every phase's week-by-week table keeps surfacing but no structured module
  // has a field for yet — a workshop happened, a decision was made outside
  // journi, a sign-off landed, a nominee list was drafted. Not a substitute for
  // the structured modules (M4, M5, M8, etc.) — once something becomes a real
  // record there, it belongs there — this is for the in-between moments that
  // would otherwise just be lost.
  const addFieldNote = useCallback((projectId, note) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        fieldNotes: [
          { id: uid('fnote'), date: todayISO(), category: 'Other', relatedModules: [], title: '', body: '', author: '', ...note },
          ...(p.fieldNotes || []),
        ],
      })),
    }))
  }, [])

  const updateFieldNote = useCallback((projectId, noteId, patch) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        fieldNotes: (p.fieldNotes || []).map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
      })),
    }))
  }, [])

  const deleteFieldNote = useCallback((projectId, noteId) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        fieldNotes: (p.fieldNotes || []).filter((n) => n.id !== noteId),
      })),
    }))
  }, [])

  // Module 22 — Organizational Breakdown Structure: the project's resourcing
  // roster (role + named person + who they report to), distinct from M2
  // Users (login/RBAC accounts) — an OBS entry does not need a journi login
  // at all. reportsTo is the id of another entry in the same project's OBS
  // (or null for a top-of-structure role), giving the roster an actual
  // hierarchy rather than a flat list.
  const addObsEntry = useCallback((projectId, entry) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        obsEntries: [...(p.obsEntries || []), { id: uid('obs'), role: '', name: '', reportsTo: null, notes: '', ...entry }],
      })),
    }))
  }, [])

  const updateObsEntry = useCallback((projectId, entryId, patch) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        obsEntries: (p.obsEntries || []).map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
      })),
    }))
  }, [])

  const deleteObsEntry = useCallback((projectId, entryId) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        obsEntries: (p.obsEntries || [])
          .filter((e) => e.id !== entryId)
          // Orphaned reports move up to whatever the deleted entry itself
          // reported to, rather than pointing at a now-missing id.
          .map((e) => (e.reportsTo === entryId ? { ...e, reportsTo: (p.obsEntries.find((x) => x.id === entryId) || {}).reportsTo || null } : e)),
      })),
    }))
  }, [])

  // D31b Charter RBAC x OBS CRUD matrix: create/edit charter definitions
  // themselves (distinct from logCharterAction above, which tracks
  // per-project completion of an existing charter's D31a actions).
  const addCharter = useCallback((charter) => {
    setData((prev) => ({ ...prev, charters: [...prev.charters, { ...charter, id: uid('chtr') }] }))
  }, [])

  const updateCharter = useCallback((charterId, patch) => {
    setData((prev) => ({
      ...prev,
      charters: prev.charters.map((c) => (c.id === charterId ? { ...c, ...patch } : c)),
    }))
  }, [])

  const deleteCharter = useCallback((charterId) => {
    setData((prev) => ({ ...prev, charters: prev.charters.filter((c) => c.id !== charterId) }))
  }, [])

  // Module 20 — D28 Journey Touchpoints: records which touchpoints an
  // employee/cohort actually reached for this project, giving D29's Journey
  // Analytics dashboards a real completion rate to compute rather than a
  // narrative description.
  const logTouchpoint = useCallback((projectId, touchpointId, note) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        touchpointLog: [{ id: uid('tplog'), touchpointId, date: todayISO(), note: note || '' }, ...(p.touchpointLog || [])],
      })),
    }))
  }, [])

  const deleteTouchpointLog = useCallback((projectId, logId) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        touchpointLog: (p.touchpointLog || []).filter((l) => l.id !== logId),
      })),
    }))
  }, [])

  // Module 10 — D32k Qualitative Coding Workbench.
  // QCW-01: codebook is Organization-scoped, not a fixed platform-wide taxonomy.
  const addCode = useCallback((orgId, code) => {
    setData((prev) => ({
      ...prev,
      codebooks: { ...prev.codebooks, [orgId]: [...(prev.codebooks[orgId] || []), { id: uid('code'), ...code }] },
    }))
  }, [])

  const removeCode = useCallback((orgId, codeId) => {
    setData((prev) => ({
      ...prev,
      codebooks: { ...prev.codebooks, [orgId]: (prev.codebooks[orgId] || []).filter((c) => c.id !== codeId) },
    }))
  }, [])

  // QCW-02/04: tags a coaching note or resistance-log entry with a code from
  // the active codebook; linkedResistanceId (QCW-04) optionally cross-references
  // an existing Resistance Log barrier when the tagged source is a coaching note.
  const tagItem = useCallback((projectId, { codeId, sourceType, sourceId, linkedResistanceId }) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        codeTags: [
          { id: uid('ctag'), codeId, sourceType, sourceId, linkedResistanceId: linkedResistanceId || null, date: todayISO() },
          ...(p.codeTags || []),
        ],
      })),
    }))
  }, [])

  const removeCodeTag = useCallback((projectId, tagId) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        codeTags: (p.codeTags || []).filter((tg) => tg.id !== tagId),
      })),
    }))
  }, [])

  // Notification Center (D07, proportionate closure): dismissal state persists
  // per project; the alerts themselves are computed live from current project
  // data (utils/alertEngine.js), not stored, so they always reflect current state.
  const dismissAlert = useCallback((projectId, alertId) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        dismissedAlerts: p.dismissedAlerts.includes(alertId) ? p.dismissedAlerts : [...p.dismissedAlerts, alertId],
      })),
    }))
  }, [])

  const undismissAlert = useCallback((projectId, alertId) => {
    setData((prev) => ({
      ...prev,
      cmProjects: updateProjectIn(prev.cmProjects, projectId, (p) => ({
        ...p,
        dismissedAlerts: p.dismissedAlerts.filter((id) => id !== alertId),
      })),
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

  // AI Use Case Catalog CRUD (D33) — the catalog was previously a fixed,
  // read-only list with only per-org/per-project activation toggles; it now
  // carries full CRUD and the same version-history/revert pattern as Phase
  // Templates, so a Change Manager can adapt a Use Case's trigger/output/
  // human-checkpoint wording without losing the original definition.
  const addAiUseCase = useCallback((uc) => {
    setData((prev) => {
      const id = uc.id || uid('uc')
      return {
        ...prev,
        aiUseCaseCatalog: [...prev.aiUseCaseCatalog, { ...uc, id, version: 1, versionHistory: [] }],
        aiOrgActivation: Object.fromEntries(
          Object.entries(prev.aiOrgActivation).map(([orgId, flags]) => [orgId, { ...flags, [id]: false }]),
        ),
      }
    })
  }, [])

  const updateAiUseCase = useCallback((useCaseId, patch, note) => {
    setData((prev) => ({
      ...prev,
      aiUseCaseCatalog: prev.aiUseCaseCatalog.map((uc) => (uc.id === useCaseId ? withVersionBump(uc, patch, note) : uc)),
    }))
  }, [])

  const deleteAiUseCase = useCallback((useCaseId) => {
    setData((prev) => ({
      ...prev,
      aiUseCaseCatalog: prev.aiUseCaseCatalog.filter((uc) => uc.id !== useCaseId),
      aiOrgActivation: Object.fromEntries(
        Object.entries(prev.aiOrgActivation).map(([orgId, flags]) => {
          const { [useCaseId]: _removed, ...rest } = flags
          return [orgId, rest]
        }),
      ),
      aiProjectOverride: Object.fromEntries(
        Object.entries(prev.aiProjectOverride).map(([projectId, flags]) => {
          const { [useCaseId]: _removed, ...rest } = flags
          return [projectId, rest]
        }),
      ),
    }))
  }, [])

  const revertAiUseCase = useCallback((useCaseId, targetVersion) => {
    setData((prev) => ({
      ...prev,
      aiUseCaseCatalog: prev.aiUseCaseCatalog.map((uc) => (uc.id === useCaseId ? revertEntityToVersion(uc, targetVersion) : uc)),
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
        charterActionLog: [],
        touchpointLog: [],
        codeTags: [],
        dismissedAlerts: [],
        fieldNotes: [],
        obsEntries: [],
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

  const updateGroup = useCallback((groupId, patch) => {
    setData((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)) }))
  }, [])

  const updateMainProject = useCallback((mainProjectId, patch) => {
    setData((prev) => ({ ...prev, mainProjects: prev.mainProjects.map((mp) => (mp.id === mainProjectId ? { ...mp, ...patch } : mp)) }))
  }, [])

  const updateCmProject = useCallback((cmProjectId, patch) => {
    setData((prev) => ({ ...prev, cmProjects: prev.cmProjects.map((cm) => (cm.id === cmProjectId ? { ...cm, ...patch } : cm)) }))
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
      addPhaseTemplate,
      updatePhaseTemplate,
      deletePhaseTemplate,
      revertPhaseTemplate,
      updateCheckpoint,
      addQuickWin,
      addLesson,
      updateLesson,
      toggleSignoff,
      toggleSponsorAction,
      addSponsorAction,
      updateRolePermission,
      updateRacsiCell,
      logCharterAction,
      deleteCharterActionLog,
      addCharter,
      updateCharter,
      deleteCharter,
      addFieldNote,
      updateFieldNote,
      deleteFieldNote,
      addObsEntry,
      updateObsEntry,
      deleteObsEntry,
      logTouchpoint,
      deleteTouchpointLog,
      addCode,
      removeCode,
      tagItem,
      removeCodeTag,
      dismissAlert,
      undismissAlert,
      updateLicense,
      setRequireJustification,
      llmConfig,
      setLlmConfig,
      testAndConnectLlm,
      disconnectLlm,
      generateWithLlm,
      toggleAiOrgActivation,
      toggleAiProjectOverride,
      addAiUseCase,
      updateAiUseCase,
      deleteAiUseCase,
      revertAiUseCase,
      logAiUsage,
      addGroup,
      addOrganization,
      updateOrganization,
      updateGroup,
      updateMainProject,
      updateCmProject,
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
      addPhaseTemplate,
      updatePhaseTemplate,
      deletePhaseTemplate,
      revertPhaseTemplate,
      updateCheckpoint,
      addQuickWin,
      addLesson,
      updateLesson,
      toggleSignoff,
      toggleSponsorAction,
      addSponsorAction,
      updateRolePermission,
      updateRacsiCell,
      logCharterAction,
      deleteCharterActionLog,
      addCharter,
      updateCharter,
      deleteCharter,
      addFieldNote,
      updateFieldNote,
      deleteFieldNote,
      addObsEntry,
      updateObsEntry,
      deleteObsEntry,
      logTouchpoint,
      deleteTouchpointLog,
      addCode,
      removeCode,
      tagItem,
      removeCodeTag,
      dismissAlert,
      undismissAlert,
      updateLicense,
      setRequireJustification,
      llmConfig,
      setLlmConfig,
      testAndConnectLlm,
      disconnectLlm,
      generateWithLlm,
      toggleAiOrgActivation,
      toggleAiProjectOverride,
      addAiUseCase,
      updateAiUseCase,
      deleteAiUseCase,
      revertAiUseCase,
      logAiUsage,
      addGroup,
      addOrganization,
      updateOrganization,
      updateGroup,
      updateMainProject,
      updateCmProject,
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
