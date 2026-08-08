import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import StatCard from '../components/StatCard.jsx'
import GanttChart from '../components/GanttChart.jsx'
import { canWrite } from '../utils/rbac.js'
import { WBS_TRACKS, WBS_STATUSES, taskGapDays, gapTone, todayISO } from '../utils/wbs.js'

const TRACK_TITLE = { pm: 'Project Management', cm: 'Change Management', framework: 'Framework' }
const STATUS_TONE = { planned: 'gray', in_progress: 'amber', done: 'green', at_risk: 'red' }
const GAP_TONE_BADGE = { green: 'green', amber: 'amber', red: 'red', gray: 'gray' }

const BLANK_FORM = {
  track: 'pm',
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
          <label className="label">Phase</label>
          <input className="input" placeholder="e.g. Phase 2" value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} />
        </div>
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
          return (
            <tr key={t.id} className="border-t border-brand-50">
              <td className="px-3 py-2 text-ink/60 whitespace-nowrap">{t.phase}</td>
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

function Content({ project }) {
  const { t } = useI18n()
  const { addSubItem, updateSubItem, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role)
  const tasks = project.wbsTasks || []
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)

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

      {canEdit && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={openNew}>
            + Add WBS task
          </button>
        </div>
      )}

      <GanttChart tasks={tasks} />

      {WBS_TRACKS.map((tr) => (
        <div key={tr} className="card overflow-x-auto">
          <div className="px-4 py-3 border-b border-brand-50 font-semibold text-sm text-brand-950">{TRACK_TITLE[tr]} track</div>
          <TaskTable project={project} tasks={tasks.filter((t) => t.track === tr)} canEdit={canEdit} onEdit={openEdit} />
        </div>
      ))}

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
    </div>
  )
}

export default function Module18Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m18_title')} description={t('m18_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
