import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { RESISTANCE_TYPES } from '../data/constants.js'
import { severityColor } from '../utils/compute.js'
import { canWrite } from '../utils/rbac.js'

const STATUS_TONE = { open: 'red', in_progress: 'amber', closed: 'green' }

function Content({ project }) {
  const { t } = useI18n()
  const { addSubItem, updateSubItem, removeSubItem, currentUser } = useAppState()
  // Employees may submit a concern (per spec, "submission only") even though they
  // cannot otherwise write to this project; only full write roles can manage
  // status, classification, or delete an entry.
  const canManage = canWrite(currentUser?.role)
  const canSubmit = canManage || currentUser?.role === 'employee'
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    type: 'will',
    source: '',
    rootCause: '',
    severity: 3,
    mitigation: '',
    owner: '',
    dueDate: '',
    status: 'open',
    anonymous: false,
  })

  function submit() {
    if (!form.rootCause.trim()) return
    addSubItem(project.id, 'resistanceLog', form)
    setModal(false)
    setForm({ type: 'will', source: '', rootCause: '', severity: 3, mitigation: '', owner: '', dueDate: '', status: 'open', anonymous: false })
  }

  const typeCounts = RESISTANCE_TYPES.map((rt) => ({ type: rt, count: project.resistanceLog.filter((r) => r.type === rt).length }))
  const systemic = typeCounts.find((tc) => tc.type === 'systemic' && tc.count >= 2)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {typeCounts.map((tc) => (
          <div key={tc.type} className="card p-3 text-center">
            <div className="text-2xl font-bold text-brand-700">{tc.count}</div>
            <div className="text-xs text-ink/50">{t(`resistance_${tc.type}`)}</div>
          </div>
        ))}
      </div>

      {systemic && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Pattern detection: {systemic.count} systemic resistance entries logged — this looks organizational, not individual.
          Consider escalating to the Sponsor & Coalition module (M8).
        </div>
      )}

      {canSubmit && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setModal(true)}>
            + {t('resistanceType')}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {project.resistanceLog.length === 0 && <EmptyState />}
        {project.resistanceLog.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge tone="sand">{t(`resistance_${r.type}`)}</Badge>
              <Badge tone={severityColor(r.severity).includes('red') ? 'red' : severityColor(r.severity).includes('amber') ? 'amber' : 'brand'}>
                {t('severity')}: {r.severity}/5
              </Badge>
              <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
              {r.anonymous && <Badge tone="gray">{t('anonymous')}</Badge>}
              <span className="text-xs text-ink/40 ms-auto">{r.source}</span>
            </div>
            <p className="text-sm text-ink/80 mb-2">
              <strong>{t('rootCause')}:</strong> {r.rootCause}
            </p>
            <div className="rounded-lg bg-brand-50/60 p-2 text-sm">
              <strong>{t('mitigationAction')}:</strong> {r.mitigation} — {r.owner} ({r.dueDate})
            </div>
            {canManage && (
              <div className="mt-2 flex gap-2">
                {r.status !== 'closed' && (
                  <button
                    className="btn-secondary text-xs"
                    onClick={() => updateSubItem(project.id, 'resistanceLog', r.id, { status: r.status === 'open' ? 'in_progress' : 'closed' })}
                  >
                    {r.status === 'open' ? 'Mark in progress' : 'Close'}
                  </button>
                )}
                <button className="btn-danger text-xs" onClick={() => removeSubItem(project.id, 'resistanceLog', r.id)}>
                  {t('delete')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-2 text-sm">Resistance Root-Cause Classifier</h3>
        <AiSuggestionBox
          useCaseId="uc-resistance-classifier"
          orgId={project.orgId}
          projectId={project.id}
          ucName="Resistance Root-Cause Classifier"
          tier="assistive"
          buildSuggestion={() => `Suggested classification: will-based — logged description text most closely matches identity/job-security themes.`}
        />
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`+ ${t('resistanceType')}`}
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
        <div className="space-y-3">
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {RESISTANCE_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {t(`resistance_${rt}`)}
              </option>
            ))}
          </select>
          <input className="input" placeholder={t('source')} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <textarea className="input" rows={2} placeholder={t('rootCause')} value={form.rootCause} onChange={(e) => setForm({ ...form, rootCause: e.target.value })} />
          <div>
            <label className="label">{t('severity')} (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className="input"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: Number(e.target.value) })}
            />
          </div>
          <input className="input" placeholder={t('mitigationAction')} value={form.mitigation} onChange={(e) => setForm({ ...form, mitigation: e.target.value })} />
          <input className="input" placeholder={t('owner')} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <input className="input" placeholder={t('dueDate')} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} />
            {t('anonymous')} ({t('submitConcern')})
          </label>
        </div>
      </Modal>
    </div>
  )
}

export default function Module11Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m11_title')} description={t('m11_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
