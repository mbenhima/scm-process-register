import React, { useState, useEffect } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import StatCard from '../components/StatCard.jsx'
import GanttChart from '../components/GanttChart.jsx'
import { canWrite, canManageTemplates } from '../utils/rbac.js'
import VersionHistoryPanel from '../components/VersionHistoryPanel.jsx'
import {
  WBS_TRACKS,
  WBS_STATUSES,
  ACCOUNTABILITY_TAGS,
  PHASE_IDS,
  PHASE_NAMES,
  lifecyclePhaseFromLabel,
  taskGapDays,
  gapTone,
  todayISO,
  phaseChecklistCompletion,
} from '../utils/wbs.js'
import { readinessIndex, hasDivergence, stalledBlocks } from '../utils/compute.js'

const TRACK_TITLE = { pm: 'Project Management', cm: 'Change Management', framework: 'Framework' }
const STATUS_TONE = { planned: 'gray', in_progress: 'amber', done: 'green', at_risk: 'red' }
const GAP_TONE_BADGE = { green: 'green', amber: 'amber', red: 'red', gray: 'gray' }
const GATE_DECISIONS = ['go', 'go_conditions', 'no_go']
const GATE_DECISION_TONE = { go: 'green', go_conditions: 'amber', no_go: 'red' }
const GATE_DECISION_LABEL = { go: 'Go', go_conditions: 'Go with Conditions', no_go: 'No-Go' }
const TAG_TONE = { PROJECT: 'brand', CHANGE: 'sand', JOINT: 'amber' }

const BLANK_FORM = {
  track: 'pm',
  accountabilityTag: 'PROJECT',
  phase: '',
  name: '',
  baselineStart: todayISO(),
  baselineEnd: todayISO(),
  actualStart: '',
  actualEnd: '',
  status: 'planned',
}

function TaskFormFields({ form, setForm }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Track</label>
          <select className="input" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}>
            {WBS_TRACKS.map((tr) => (
              <option key={tr} value={tr}>
                {TRACK_TITLE[tr]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Accountability tag</label>
          <select className="input" value={form.accountabilityTag || 'PROJECT'} onChange={(e) => setForm({ ...form, accountabilityTag: e.target.value })}>
            {ACCOUNTABILITY_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Phase</label>
        <input className="input" placeholder="e.g. Phase 2" value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} />
        <p className="text-[11px] text-ink/40 mt-1">
          {lifecyclePhaseFromLabel(form.phase)
            ? `Maps to lifecycle ${lifecyclePhaseFromLabel(form.phase)} — ${PHASE_NAMES[lifecyclePhaseFromLabel(form.phase)]}`
            : 'Free text — won’t be filterable by lifecycle phase unless it starts with P1–P7 or matches an ERP phase name.'}
        </p>
      </div>
      <div>
        <label className="label">Task name</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Baseline start</label>
          <input type="date" className="input" value={form.baselineStart} onChange={(e) => setForm({ ...form, baselineStart: e.target.value })} />
        </div>
        <div>
          <label className="label">Baseline finish</label>
          <input type="date" className="input" value={form.baselineEnd} onChange={(e) => setForm({ ...form, baselineEnd: e.target.value })} />
        </div>
      </div>
      <p className="text-[11px] text-ink/40">Set both baseline dates equal for a framework milestone (renders as a diamond, not a bar).</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Actual start (optional)</label>
          <input type="date" className="input" value={form.actualStart || ''} onChange={(e) => setForm({ ...form, actualStart: e.target.value })} />
        </div>
        <div>
          <label className="label">Actual finish (optional)</label>
          <input type="date" className="input" value={form.actualEnd || ''} onChange={(e) => setForm({ ...form, actualEnd: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {WBS_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function TaskTable({ project, tasks, canEdit, onEdit }) {
  const { removeSubItem } = useAppState()
  if (tasks.length === 0) return <EmptyState text="No tasks logged in this track yet." />
  return (
    <table className="w-full text-sm">
      <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
        <tr>
          <th className="text-start px-3 py-2">Phase</th>
          <th className="text-start px-3 py-2">Tag</th>
          <th className="text-start px-3 py-2">Task</th>
          <th className="text-start px-3 py-2">Baseline</th>
          <th className="text-start px-3 py-2">Actual</th>
          <th className="text-start px-3 py-2">Gap</th>
          <th className="text-start px-3 py-2">Status</th>
          {canEdit && <th className="px-2 py-2" />}
        </tr>
      </thead>
      <tbody>
        {tasks.map((t) => {
          const gap = taskGapDays(t)
          const lifecyclePhase = lifecyclePhaseFromLabel(t.phase)
          return (
            <tr key={t.id} className="border-t border-brand-50">
              <td className="px-3 py-2 text-ink/60 whitespace-nowrap">
                {t.phase}
                {lifecyclePhase && <span className="text-ink/30"> · {lifecyclePhase}</span>}
              </td>
              <td className="px-3 py-2">{t.accountabilityTag && <Badge tone={TAG_TONE[t.accountabilityTag]}>{t.accountabilityTag}</Badge>}</td>
              <td className="px-3 py-2 text-brand-950 font-medium max-w-xs">{t.name}</td>
              <td className="px-3 py-2 text-ink/60 whitespace-nowrap text-xs">
                {t.baselineStart}
                {t.baselineEnd !== t.baselineStart ? ` → ${t.baselineEnd}` : ''}
              </td>
              <td className="px-3 py-2 text-ink/60 whitespace-nowrap text-xs">
                {t.actualStart ? `${t.actualStart}${t.actualEnd ? ` → ${t.actualEnd}` : ' → …'}` : <span className="italic text-ink/30">not started</span>}
              </td>
              <td className="px-3 py-2">
                <Badge tone={GAP_TONE_BADGE[gapTone(gap)]}>{gap === null || gap === undefined ? '—' : gap === 0 ? 'on time' : gap > 0 ? `+${gap}d` : `${gap}d`}</Badge>
              </td>
              <td className="px-3 py-2">
                <Badge tone={STATUS_TONE[t.status]}>{t.status.replace('_', ' ')}</Badge>
              </td>
              {canEdit && (
                <td className="px-2 py-2 whitespace-nowrap">
                  <button className="btn-ghost text-xs mr-1" onClick={() => onEdit(t)}>
                    Edit
                  </button>
                  <button className="btn-danger text-xs" onClick={() => removeSubItem(project.id, 'wbsTasks', t.id)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function TemplateModal({ open, onClose, project, data, loadPhaseTemplate }) {
  const { t } = useI18n()
  const linkedMainProject = data.mainProjects.find((mp) => (project.mainProjectIds || []).includes(mp.id))
  const defaultTemplate =
    data.e2eProcessCatalog.find((e2e) => e2e.transformationType === linkedMainProject?.type)?.phaseTemplateId ||
    data.phaseTemplateCatalog[0].id
  const [templateId, setTemplateId] = useState(defaultTemplate)
  const [startISO, setStartISO] = useState(todayISO())
  const template = data.phaseTemplateCatalog.find((tpl) => tpl.id === templateId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('m17_load_template_title')}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            {t('cancel')}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              loadPhaseTemplate(project.id, templateId, startISO)
              onClose()
            }}
          >
            {t('m17_load_button')}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[11px] text-ink/40">{t('m17_load_template_desc')}</p>
        <div>
          <label className="label">{t('m17_template_label')}</label>
          <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {data.phaseTemplateCatalog.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.id} — {tpl.name}
              </option>
            ))}
          </select>
          {linkedMainProject && templateId === defaultTemplate && <p className="text-[11px] text-ink/40 mt-1">{t('m17_recommended_for')}</p>}
        </div>
        <div>
          <label className="label">{t('m17_start_date')}</label>
          <input type="date" className="input" value={startISO} onChange={(e) => setStartISO(e.target.value)} />
        </div>
        {template && (
          <ul className="text-xs text-ink/60 list-disc ps-4 space-y-0.5">
            {template.phases.map((phase) => (
              <li key={phase.name}>{phase.name}</li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}

const TRANSFORMATION_TYPES = ['erp', 'bpr', 'automation', 'qms', 'cultural', 'operating_model', 'compliance', 'training_skills']
const BLANK_TEMPLATE = { id: '', name: '', transformationType: 'erp', phasesText: '' }

// Phase templates are edited as one plain-text block rather than a nested
// form — a phase name starts at the left margin; an indented "CM:",
// "CHECKLIST:", or "GATE:" line adds one entry of that kind to the phase
// above it. This keeps editing (including reordering, and adding/removing
// items freely) a single textarea rather than a deeply nested per-phase
// form, while still round-tripping the same structured data the rest of
// the app reads (Change Management track, checklist, gate criteria).
function serializePhasesText(phases) {
  return phases
    .map((phase) => {
      const lines = [phase.name]
      for (const item of phase.cmTrack || []) lines.push(`  CM: ${item}`)
      for (const item of phase.checklist || []) lines.push(`  CHECKLIST: ${item}`)
      for (const item of phase.gate || []) lines.push(`  GATE: ${item}`)
      return lines.join('\n')
    })
    .join('\n')
}

function parsePhasesText(text) {
  const phases = []
  let current = null
  for (const rawLine of text.split('\n')) {
    if (!rawLine.trim()) continue
    const indented = /^\s/.test(rawLine)
    const line = rawLine.trim()
    if (!indented) {
      current = { name: line, cmTrack: [], checklist: [], gate: [] }
      phases.push(current)
      continue
    }
    if (!current) continue
    const cmMatch = line.match(/^CM:\s*(.*)$/i)
    const checklistMatch = line.match(/^CHECKLIST:\s*(.*)$/i)
    const gateMatch = line.match(/^GATE:\s*(.*)$/i)
    if (cmMatch && cmMatch[1]) current.cmTrack.push(cmMatch[1])
    else if (checklistMatch && checklistMatch[1]) current.checklist.push(checklistMatch[1])
    else if (gateMatch && gateMatch[1]) current.gate.push(gateMatch[1])
  }
  return phases
}

function TemplateForm({ form, setForm, isNew }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <div className="space-y-3">
      {isNew && (
        <div>
          <label className="label">Template ID (e.g. TPL-CUSTOM-6)</label>
          <input className="input" value={form.id} onChange={set('id')} />
        </div>
      )}
      <div>
        <label className="label">Name</label>
        <input className="input" value={form.name} onChange={set('name')} />
      </div>
      <div>
        <label className="label">Transformation type</label>
        <select className="input" value={form.transformationType} onChange={set('transformationType')}>
          {TRANSFORMATION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Phases</label>
        <p className="text-[11px] text-ink/40 mb-1">
          One phase name per line, at the left margin. Under each phase, add indented lines starting with{' '}
          <code className="text-[10px]">CM:</code> for a Change Management track action, <code className="text-[10px]">CHECKLIST:</code> for an
          exit-criteria checklist item, or <code className="text-[10px]">GATE:</code> for a Phase Gate review question. Any number of each, any
          order — none are required.
        </p>
        <textarea
          className="input font-mono text-xs"
          rows={14}
          placeholder={'Discovery\n  CM: Populate the Stakeholder Map\n  CHECKLIST: Business case approved\n  GATE: Is the business case approved?\nDesign\n  CM: ...'}
          value={form.phasesText}
          onChange={set('phasesText')}
        />
      </div>
    </div>
  )
}

function TemplateManagerModal({ open, onClose, data, addPhaseTemplate, updatePhaseTemplate, deletePhaseTemplate, revertPhaseTemplate }) {
  const [editing, setEditing] = useState(null) // { mode: 'add' | 'edit', templateId? } | null
  const [form, setForm] = useState(BLANK_TEMPLATE)
  const [historyId, setHistoryId] = useState(null)

  function openAdd() {
    setForm(BLANK_TEMPLATE)
    setEditing({ mode: 'add' })
  }
  function openEdit(tpl) {
    setForm({ id: tpl.id, name: tpl.name, transformationType: tpl.transformationType, phasesText: serializePhasesText(tpl.phases) })
    setEditing({ mode: 'edit', templateId: tpl.id })
  }
  function submit() {
    const phases = parsePhasesText(form.phasesText)
    if (!form.name.trim() || phases.length === 0) return
    if (editing.mode === 'add') {
      if (!form.id.trim()) return
      addPhaseTemplate({ id: form.id.trim(), name: form.name, transformationType: form.transformationType, phases })
    } else {
      updatePhaseTemplate(editing.templateId, { name: form.name, transformationType: form.transformationType, phases })
    }
    setEditing(null)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setEditing(null)
        onClose()
      }}
      title="Manage Phase Templates"
      footer={
        <button className="btn-ghost" onClick={() => {
          setEditing(null)
          onClose()
        }}>
          Close
        </button>
      }
    >
      {!editing ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="btn-primary text-xs" onClick={openAdd}>+ New Template</button>
          </div>
          {data.phaseTemplateCatalog.map((tpl) => (
            <div key={tpl.id} className="border border-brand-100 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <span className="font-mono text-xs text-brand-700">{tpl.id}</span>{' '}
                  <span className="font-semibold text-brand-950">{tpl.name}</span>{' '}
                  <Badge tone="gray">{tpl.transformationType}</Badge>{' '}
                  <Badge tone="gray">v{tpl.version || 1}</Badge>{' '}
                  <span className="text-xs text-ink/40">{tpl.phases.length} phases</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="btn-secondary text-xs" onClick={() => openEdit(tpl)}>Edit</button>
                  <button className="btn-ghost text-xs" onClick={() => setHistoryId(historyId === tpl.id ? null : tpl.id)}>
                    {historyId === tpl.id ? 'Hide history' : `History (${(tpl.versionHistory || []).length + 1})`}
                  </button>
                  <button className="text-ink/30 hover:text-red-600 text-xs" onClick={() => deletePhaseTemplate(tpl.id)}>Delete</button>
                </div>
              </div>
              <ul className="text-xs text-ink/60 list-disc ps-4 space-y-1">
                {tpl.phases.map((phase, i) => (
                  <li key={i}>
                    {phase.name}
                    {(phase.cmTrack?.length || phase.checklist?.length || phase.gate?.length) ? (
                      <span className="ms-1.5 space-x-1">
                        {phase.cmTrack?.length > 0 && <Badge tone="brand">CM {phase.cmTrack.length}</Badge>}
                        {phase.checklist?.length > 0 && <Badge tone="green">Checklist {phase.checklist.length}</Badge>}
                        {phase.gate?.length > 0 && <Badge tone="amber">Gate {phase.gate.length}</Badge>}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {historyId === tpl.id && (
                <VersionHistoryPanel entity={tpl} canRevert onRevert={(v) => revertPhaseTemplate(tpl.id, v)} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <TemplateForm form={form} setForm={setForm} isNew={editing.mode === 'add'} />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button className="btn-ghost" onClick={() => setEditing(null)}>Back to list</button>
            <button className="btn-primary" onClick={submit}>Save</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

const BLANK_CHECKLIST_ITEM = { phase: '', track: 'pm', item: '', weight: 50, done: false }

function ChecklistSection({ project, canEdit, phaseFilter }) {
  const { addSubItem, updateSubItem, removeSubItem } = useAppState()
  const [form, setForm] = useState(BLANK_CHECKLIST_ITEM)
  const allItems = project.phaseChecklists || []
  const items = phaseFilter === 'all' ? allItems : allItems.filter((c) => lifecyclePhaseFromLabel(c.phase) === phaseFilter)
  const phaseOptions = [...new Set((project.wbsTasks || []).filter((t) => t.track === 'pm').map((t) => t.phase))]

  function submit() {
    if (!form.phase.trim() || !form.item.trim()) return
    addSubItem(project.id, 'phaseChecklists', form)
    setForm({ ...BLANK_CHECKLIST_ITEM, phase: form.phase, track: form.track })
  }

  return (
    <div className="card overflow-x-auto">
      <div className="px-4 py-3 border-b border-brand-50 font-semibold text-sm text-brand-950">
        Phase Checklist <span className="font-normal text-ink/40 text-xs">(PM-track + CM-track, distinct from WBS tasks — feeds Phase Gate completion %)</span>
      </div>
      {items.length === 0 ? (
        <div className="p-4">
          <EmptyState text="No checklist items logged yet." />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-3 py-2">Phase</th>
              <th className="text-start px-3 py-2">Track</th>
              <th className="text-start px-3 py-2">Item</th>
              <th className="text-start px-3 py-2">Weight %</th>
              <th className="text-start px-3 py-2">Done</th>
              {canEdit && <th className="px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-brand-50">
                <td className="px-3 py-2 text-ink/60 whitespace-nowrap">{c.phase}</td>
                <td className="px-3 py-2">
                  <Badge tone="gray">{c.track === 'pm' ? 'PM' : 'CM'}</Badge>
                </td>
                <td className="px-3 py-2 text-brand-950">{c.item}</td>
                <td className="px-3 py-2 text-ink/60">{c.weight ?? 100}</td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!c.done}
                    disabled={!canEdit}
                    onChange={(e) => updateSubItem(project.id, 'phaseChecklists', c.id, { done: e.target.checked })}
                  />
                </td>
                {canEdit && (
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button className="btn-danger text-xs" onClick={() => removeSubItem(project.id, 'phaseChecklists', c.id)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {canEdit && (
        <div className="p-3 border-t border-brand-50 grid sm:grid-cols-[1fr_auto_2fr_auto_auto] gap-2">
          <input
            className="input"
            list="m18-phase-options"
            placeholder="Phase (e.g. P1 Intake & Diagnosis)"
            value={form.phase}
            onChange={(e) => setForm({ ...form, phase: e.target.value })}
          />
          <datalist id="m18-phase-options">
            {phaseOptions.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <select className="input" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}>
            <option value="pm">PM-track</option>
            <option value="cm">CM-track</option>
          </select>
          <input className="input" placeholder="Checklist item" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          <input
            type="number"
            min="1"
            max="100"
            className="input w-20"
            title="Weight %"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
          />
          <button className="btn-primary text-sm" onClick={submit}>
            + Add
          </button>
        </div>
      )}
    </div>
  )
}

// D17 CAT-02 RACSI role codes — the Accountable role on a Joint Decision Record
// (D32e/JD-05) may be any single one of these, not necessarily the PM.
const ACCOUNTABLE_ROLE_OPTIONS = ['PM', 'CM', 'ES', 'FPO', 'ITL', 'SUP']

const BLANK_GATE_FORM = {
  phase: '',
  date: todayISO(),
  pmRecommendation: 'go',
  pmNotes: '',
  cmRecommendation: 'go',
  cmNotes: '',
  readinessIndexSnapshot: 0,
  checklistCompletionPct: 0,
  openFlags: '',
  jointDecision: 'go',
  conditions: '',
  accountable: 'PM',
}

function PhaseGateModal({ open, onClose, project }) {
  const { addSubItem } = useAppState()
  const [form, setForm] = useState(BLANK_GATE_FORM)
  const phaseOptions = [...new Set((project.wbsTasks || []).filter((t) => t.track === 'pm').map((t) => t.phase))]

  useEffect(() => {
    if (!open) return
    const flags = []
    if (hasDivergence(project)) flags.push('Divergence pattern: strong Knowledge/Ability but still in Ending (Bridges)')
    const stalled = stalledBlocks(project)
    if (stalled.length) flags.push(`Stalled ADKAR block(s): ${stalled.join(', ')}`)
    setForm({
      ...BLANK_GATE_FORM,
      readinessIndexSnapshot: readinessIndex(project),
      checklistCompletionPct: phaseChecklistCompletion(project.phaseChecklists, phaseOptions[0] || '') ?? 0,
      openFlags: flags.join('; '),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function submit() {
    if (!form.phase.trim()) return
    addSubItem(project.id, 'phaseGates', {
      ...form,
      pmInput: { recommendation: form.pmRecommendation, notes: form.pmNotes },
      cmInput: {
        recommendation: form.cmRecommendation,
        notes: form.cmNotes,
        readinessIndexSnapshot: form.readinessIndexSnapshot,
        checklistCompletionPct: form.checklistCompletionPct,
        openFlags: form.openFlags,
      },
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="+ Add Phase Gate"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit}>
            Record joint decision
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[11px] text-ink/40">
          E2E-06 · PM ↔ CM Governance Bridge (D32d/D32e): triggered by a Main Project schedule slip or a phase-gate checkpoint. PM and CM
          record their inputs independently below; the fused Joint Decision has exactly one Accountable role, selected below — it may
          differ from either input's author (D32e/JD-05).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phase</label>
            <input
              className="input"
              list="m18-gate-phase-options"
              value={form.phase}
              onChange={(e) => setForm({ ...form, phase: e.target.value })}
            />
            <datalist id="m18-gate-phase-options">
              {phaseOptions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="border border-brand-100 rounded-lg p-3 space-y-2">
            <div className="text-xs font-semibold text-brand-950">PM input</div>
            <select className="input" value={form.pmRecommendation} onChange={(e) => setForm({ ...form, pmRecommendation: e.target.value })}>
              {GATE_DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {GATE_DECISION_LABEL[d]}
                </option>
              ))}
            </select>
            <textarea className="input" rows={2} placeholder="Schedule / delivery notes" value={form.pmNotes} onChange={(e) => setForm({ ...form, pmNotes: e.target.value })} />
          </div>
          <div className="border border-brand-100 rounded-lg p-3 space-y-2">
            <div className="text-xs font-semibold text-brand-950">CM input</div>
            <select className="input" value={form.cmRecommendation} onChange={(e) => setForm({ ...form, cmRecommendation: e.target.value })}>
              {GATE_DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {GATE_DECISION_LABEL[d]}
                </option>
              ))}
            </select>
            <textarea className="input" rows={2} placeholder="Adoption-risk notes" value={form.cmNotes} onChange={(e) => setForm({ ...form, cmNotes: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Readiness Index</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={form.readinessIndexSnapshot}
                  onChange={(e) => setForm({ ...form, readinessIndexSnapshot: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Checklist %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={form.checklistCompletionPct}
                  onChange={(e) => setForm({ ...form, checklistCompletionPct: Number(e.target.value) })}
                />
              </div>
            </div>
            <input className="input text-xs" placeholder="Open flags" value={form.openFlags} onChange={(e) => setForm({ ...form, openFlags: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Joint Decision</label>
            <select className="input" value={form.jointDecision} onChange={(e) => setForm({ ...form, jointDecision: e.target.value })}>
              {GATE_DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {GATE_DECISION_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Accountable role (exactly one)</label>
            <select className="input" value={form.accountable} onChange={(e) => setForm({ ...form, accountable: e.target.value })}>
              {ACCOUNTABLE_ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        {form.jointDecision === 'go_conditions' && (
          <div>
            <label className="label">Conditions</label>
            <textarea className="input" rows={2} value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} />
          </div>
        )}
      </div>
    </Modal>
  )
}

function PhaseGateSection({ project, canEdit, phaseFilter }) {
  const { removeSubItem } = useAppState()
  const [modal, setModal] = useState(false)
  const allGates = project.phaseGates || []
  const gates = phaseFilter === 'all' ? allGates : allGates.filter((g) => lifecyclePhaseFromLabel(g.phase) === phaseFilter)

  return (
    <div className="card overflow-x-auto">
      <div className="px-4 py-3 border-b border-brand-50 flex items-center justify-between flex-wrap gap-2">
        <div className="font-semibold text-sm text-brand-950">
          Phase Gates <span className="font-normal text-ink/40 text-xs">(Joint Decision Record — PM ↔ CM Governance Bridge, E2E-06)</span>
        </div>
        {canEdit && (
          <button className="btn-primary text-sm" onClick={() => setModal(true)}>
            + Add Phase Gate
          </button>
        )}
      </div>
      {gates.length === 0 ? (
        <div className="p-4">
          <EmptyState text="No phase gate decisions recorded yet." />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-3 py-2">Phase</th>
              <th className="text-start px-3 py-2">Date</th>
              <th className="text-start px-3 py-2">PM</th>
              <th className="text-start px-3 py-2">CM</th>
              <th className="text-start px-3 py-2">Readiness / Checklist</th>
              <th className="text-start px-3 py-2">Joint Decision</th>
              <th className="text-start px-3 py-2">Accountable</th>
              {canEdit && <th className="px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {gates.map((g) => (
              <tr key={g.id} className="border-t border-brand-50 align-top">
                <td className="px-3 py-2 text-ink/60 whitespace-nowrap">{g.phase}</td>
                <td className="px-3 py-2 text-ink/60 whitespace-nowrap text-xs">{g.date}</td>
                <td className="px-3 py-2">
                  <Badge tone={GATE_DECISION_TONE[g.pmInput?.recommendation]}>{GATE_DECISION_LABEL[g.pmInput?.recommendation]}</Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge tone={GATE_DECISION_TONE[g.cmInput?.recommendation]}>{GATE_DECISION_LABEL[g.cmInput?.recommendation]}</Badge>
                </td>
                <td className="px-3 py-2 text-xs text-ink/60 whitespace-nowrap">
                  {g.cmInput?.readinessIndexSnapshot ?? '—'} / {g.cmInput?.checklistCompletionPct ?? '—'}%
                  {g.cmInput?.openFlags && <div className="text-red-600 mt-0.5">{g.cmInput.openFlags}</div>}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={GATE_DECISION_TONE[g.jointDecision]}>{GATE_DECISION_LABEL[g.jointDecision]}</Badge>
                  {g.conditions && <div className="text-xs text-ink/60 mt-1 max-w-xs">{g.conditions}</div>}
                </td>
                <td className="px-3 py-2 text-ink/60 whitespace-nowrap">{g.accountable}</td>
                {canEdit && (
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button className="btn-danger text-xs" onClick={() => removeSubItem(project.id, 'phaseGates', g.id)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PhaseGateModal open={modal} onClose={() => setModal(false)} project={project} />
    </div>
  )
}

function Content({ project }) {
  const { t } = useI18n()
  const { addSubItem, updateSubItem, currentUser, data, loadPhaseTemplate, addPhaseTemplate, updatePhaseTemplate, deletePhaseTemplate, revertPhaseTemplate } = useAppState()
  const canEdit = canWrite(currentUser?.role)
  const canManageTpl = canManageTemplates(currentUser?.role, data.rolePermissions)
  const allTasks = project.wbsTasks || []
  const [modal, setModal] = useState(false)
  const [templateModal, setTemplateModal] = useState(false)
  const [templateManagerModal, setTemplateManagerModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [phaseFilter, setPhaseFilter] = useState('all')
  const tasks = phaseFilter === 'all' ? allTasks : allTasks.filter((t) => lifecyclePhaseFromLabel(t.phase) === phaseFilter)

  const gaps = tasks.map((t) => taskGapDays(t)).filter((g) => g !== null && g !== undefined)
  const onTrack = gaps.filter((g) => g <= 0).length
  const atRisk = gaps.filter((g) => g > 7).length
  const avgGap = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0

  function openNew() {
    setEditingId(null)
    setForm(BLANK_FORM)
    setModal(true)
  }
  function openEdit(task) {
    setEditingId(task.id)
    setForm({ ...task, actualStart: task.actualStart || '', actualEnd: task.actualEnd || '' })
    setModal(true)
  }
  function submit() {
    if (!form.name.trim() || !form.phase.trim()) return
    const payload = { ...form, actualStart: form.actualStart || null, actualEnd: form.actualEnd || null }
    if (editingId) updateSubItem(project.id, 'wbsTasks', editingId, payload)
    else addSubItem(project.id, 'wbsTasks', payload)
    setModal(false)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total tasks" value={tasks.length} tone="brand" />
        <StatCard label="On track / ahead" value={onTrack} tone="brand" sub="gap ≤ 0 days" />
        <StatCard label="At risk (>7d slip)" value={atRisk} tone="red" />
        <StatCard label="Avg. schedule gap" value={`${avgGap >= 0 ? '+' : ''}${avgGap}d`} tone={avgGap > 7 ? 'red' : avgGap > 0 ? 'amber' : 'brand'} />
      </div>

      <div className="flex justify-end gap-2 items-center">
        <label className="text-xs text-ink/50">Lifecycle phase (REQ-021):</label>
        <select className="input w-auto" value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}>
          <option value="all">All phases</option>
          {PHASE_IDS.map((p) => (
            <option key={p} value={p}>
              {p} — {PHASE_NAMES[p]}
            </option>
          ))}
        </select>
        {canEdit && (
          <>
            <button className="btn-ghost" onClick={() => setTemplateModal(true)}>
              {t('m17_load_template')}
            </button>
            {canManageTpl && (
              <button className="btn-ghost" onClick={() => setTemplateManagerModal(true)}>
                Manage Templates
              </button>
            )}
            <button className="btn-primary" onClick={openNew}>
              + Add WBS task
            </button>
          </>
        )}
      </div>
      {phaseFilter !== 'all' && (
        <p className="text-xs text-ink/40 -mt-3">
          Filtering WBS tasks, Phase Checklist items, and Phase Gates to {phaseFilter} — {PHASE_NAMES[phaseFilter]}.
        </p>
      )}

      <GanttChart tasks={tasks} />

      {WBS_TRACKS.map((tr) => (
        <div key={tr} className="card overflow-x-auto">
          <div className="px-4 py-3 border-b border-brand-50 font-semibold text-sm text-brand-950">{TRACK_TITLE[tr]} track</div>
          <TaskTable project={project} tasks={tasks.filter((t) => t.track === tr)} canEdit={canEdit} onEdit={openEdit} />
        </div>
      ))}

      <ChecklistSection project={project} canEdit={canEdit} phaseFilter={phaseFilter} />
      <PhaseGateSection project={project} canEdit={canEdit} phaseFilter={phaseFilter} />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editingId ? 'Edit WBS task' : '+ Add WBS task'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>
              {t('cancel')}
            </button>
            <button className="btn-primary" onClick={submit}>
              {t('save')}
            </button>
          </>
        }
      >
        <TaskFormFields form={form} setForm={setForm} />
      </Modal>

      <TemplateModal open={templateModal} onClose={() => setTemplateModal(false)} project={project} data={data} loadPhaseTemplate={loadPhaseTemplate} />

      <TemplateManagerModal
        open={templateManagerModal}
        onClose={() => setTemplateManagerModal(false)}
        data={data}
        addPhaseTemplate={addPhaseTemplate}
        updatePhaseTemplate={updatePhaseTemplate}
        deletePhaseTemplate={deletePhaseTemplate}
        revertPhaseTemplate={revertPhaseTemplate}
      />
    </div>
  )
}

export default function Module17Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m17_title')} description={t('m17_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
