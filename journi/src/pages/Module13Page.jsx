import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useOrgProjects } from '../utils/useScoped.js'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import JustifyPanel from '../components/JustifyPanel.jsx'
import ExportCsvButton from '../components/ExportCsvButton.jsx'
import { RISK_CATEGORIES } from '../data/constants.js'
import { riskScore, isHighSeverityRisk } from '../utils/compute.js'
import { canWrite } from '../utils/rbac.js'
import { uid } from '../utils/id.js'

const STATUS_TONE = { open: 'red', mitigating: 'amber', closed: 'green' }
const ACTION_STATUS_TONE = { open: 'red', in_progress: 'amber', closed: 'green' }

function MitigationActions({ project, risk, canEdit }) {
  const { updateSubItem } = useAppState()
  const [form, setForm] = useState({ description: '', owner: '', dueDate: '', status: 'open' })
  const actions = risk.actions || []

  function addAction() {
    if (!form.description.trim()) return
    updateSubItem(project.id, 'risks', risk.id, { actions: [...actions, { id: uid('act'), ...form }] })
    setForm({ description: '', owner: '', dueDate: '', status: 'open' })
  }
  function updateAction(actionId, patch) {
    updateSubItem(project.id, 'risks', risk.id, {
      actions: actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
    })
  }
  function removeAction(actionId) {
    updateSubItem(project.id, 'risks', risk.id, { actions: actions.filter((a) => a.id !== actionId) })
  }

  return (
    <div className="bg-brand-50/30 rounded-lg p-3 space-y-2">
      <div className="text-xs font-semibold text-brand-800 uppercase tracking-wide">Mitigation Action Plan</div>
      {actions.length === 0 && <p className="text-xs text-ink/40 italic">No mitigation actions logged yet.</p>}
      {actions.length > 0 && (
        <table className="w-full text-xs">
          <thead className="text-ink/40 uppercase tracking-wide">
            <tr>
              <th className="text-start py-1">Action</th>
              <th className="text-start py-1">Owner</th>
              <th className="text-start py-1">Due</th>
              <th className="text-start py-1">Status</th>
              {canEdit && <th className="py-1" />}
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id} className="border-t border-brand-100/60">
                <td className="py-1.5 pr-2 text-ink/80">{a.description}</td>
                <td className="py-1.5 pr-2 text-ink/60">{a.owner}</td>
                <td className="py-1.5 pr-2 text-ink/60 whitespace-nowrap">{a.dueDate}</td>
                <td className="py-1.5 pr-2">
                  {canEdit ? (
                    <select className="input py-0.5 px-1 text-xs w-auto" value={a.status} onChange={(e) => updateAction(a.id, { status: e.target.value })}>
                      <option value="open">open</option>
                      <option value="in_progress">in progress</option>
                      <option value="closed">closed</option>
                    </select>
                  ) : (
                    <Badge tone={ACTION_STATUS_TONE[a.status]}>{a.status.replace('_', ' ')}</Badge>
                  )}
                </td>
                {canEdit && (
                  <td className="py-1.5">
                    <button className="btn-danger text-xs" onClick={() => removeAction(a.id)}>
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {canEdit && (
        <div className="grid sm:grid-cols-4 gap-1.5 pt-1">
          <input
            className="input py-1 text-xs sm:col-span-2"
            placeholder="Action description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input className="input py-1 text-xs" placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <input className="input py-1 text-xs" placeholder="Due date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <button className="btn-secondary text-xs sm:col-span-4" onClick={addAction}>
            + Add mitigation action
          </button>
        </div>
      )}
    </div>
  )
}

function Content({ project }) {
  const { t } = useI18n()
  const { data, addSubItem, removeSubItem, logJustifiedChange, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
  const orgProjects = useOrgProjects(project.orgId)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ category: 'adoption', description: '', likelihood: 3, impact: 3, owner: '', status: 'open' })
  const [statusJustifyId, setStatusJustifyId] = useState(null)
  const [pendingStatus, setPendingStatus] = useState('open')
  const [statusJustification, setStatusJustification] = useState('')

  function startStatusChange(r, nextStatus) {
    setStatusJustifyId(r.id)
    setPendingStatus(nextStatus)
    setStatusJustification('')
  }
  function cancelStatusChange() {
    setStatusJustifyId(null)
    setStatusJustification('')
  }
  function saveStatusChange(r) {
    logJustifiedChange(project.id, {
      module: 'M12 · Risk Register',
      field: `Risk status — ${r.description.slice(0, 40)}`,
      oldValue: r.status,
      newValue: pendingStatus,
      justification: statusJustification,
      applyPatch: (p) => ({ ...p, risks: p.risks.map((r2) => (r2.id === r.id ? { ...r2, status: pendingStatus } : r2)) }),
    })
    cancelStatusChange()
  }

  function submit() {
    if (!form.description.trim()) return
    addSubItem(project.id, 'risks', form)
    setModal(false)
    setForm({ category: 'adoption', description: '', likelihood: 3, impact: 3, owner: '', status: 'open' })
  }

  const saturationOverlap = orgProjects.filter((p) => p.id !== project.id)
  const sorted = [...project.risks].sort((a, b) => riskScore(b) - riskScore(a))
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="space-y-4">
      {saturationOverlap.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Portfolio cross-reference: population also targeted by {saturationOverlap.map((p) => p.name).join(', ')} — potential
          saturation risk.
        </div>
      )}

      <div className="flex justify-end gap-2">
        <ExportCsvButton
          filename={`${project.name.replace(/\s+/g, '_')}-risk-register.csv`}
          rows={sorted}
          columns={[
            { label: 'Category', value: (r) => t(`risk_${r.category}`) },
            { label: 'Description', value: 'description' },
            { label: 'Likelihood', value: 'likelihood' },
            { label: 'Impact', value: 'impact' },
            { label: 'Risk Score', value: (r) => riskScore(r) },
            { label: 'Owner', value: 'owner' },
            { label: 'Status', value: 'status' },
          ]}
        />
        {canEdit && (
          <button className="btn-primary" onClick={() => setModal(true)}>
            + {t('riskCategory')}
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        {sorted.length === 0 ? (
          <div className="p-4">
            <EmptyState />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-start px-4 py-2.5">{t('riskCategory')}</th>
                <th className="text-start px-4 py-2.5">{t('description')}</th>
                <th className="text-start px-4 py-2.5">{t('likelihood')}</th>
                <th className="text-start px-4 py-2.5">{t('impact')}</th>
                <th className="text-start px-4 py-2.5">{t('riskScore')}</th>
                <th className="text-start px-4 py-2.5">{t('owner')}</th>
                <th className="text-start px-4 py-2.5">{t('status')}</th>
                <th className="px-2 py-2.5" />
                {canEdit && <th className="px-2 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <React.Fragment key={r.id}>
                  <tr className="border-t border-brand-50">
                    <td className="px-4 py-2.5">
                      <Badge tone="sand">{t(`risk_${r.category}`)}</Badge>
                    </td>
                    <td className="px-4 py-2.5 max-w-sm text-ink/80">{r.description}</td>
                    <td className="px-4 py-2.5 text-center">{r.likelihood}</td>
                    <td className="px-4 py-2.5 text-center">{r.impact}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={isHighSeverityRisk(r) ? 'red' : riskScore(r) >= 8 ? 'amber' : 'brand'}>{riskScore(r)}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-ink/60">{r.owner}</td>
                    <td className="px-4 py-2.5">
                      {canEdit ? (
                        <select
                          className="input py-1 text-xs"
                          value={statusJustifyId === r.id ? pendingStatus : r.status}
                          onChange={(e) => startStatusChange(r, e.target.value)}
                        >
                          <option value="open">open</option>
                          <option value="mitigating">mitigating</option>
                          <option value="closed">closed</option>
                        </select>
                      ) : (
                        <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        className="btn-ghost text-xs whitespace-nowrap"
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      >
                        {expanded === r.id ? 'Hide' : 'Mitigation'} actions ({(r.actions || []).length})
                      </button>
                    </td>
                    {canEdit && (
                      <td className="px-2 py-2.5">
                        <button className="btn-danger text-xs" onClick={() => removeSubItem(project.id, 'risks', r.id)}>
                          {t('delete')}
                        </button>
                      </td>
                    )}
                  </tr>
                  {statusJustifyId === r.id && (
                    <tr className="border-t border-brand-50">
                      <td colSpan={canEdit ? 8 : 7} className="px-4 py-3">
                        <JustifyPanel
                          justification={statusJustification}
                          onJustificationChange={setStatusJustification}
                          onSave={() => saveStatusChange(r)}
                          onCancel={cancelStatusChange}
                          saveLabel={`Set to ${pendingStatus} with justification`}
                          placeholder="Why is this risk's status changing?"
                        />
                      </td>
                    </tr>
                  )}
                  {expanded === r.id && (
                    <tr className="border-t border-brand-50">
                      <td colSpan={canEdit ? 8 : 7} className="px-4 py-3">
                        <MitigationActions project={project} risk={r} canEdit={canEdit} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`+ ${t('riskCategory')}`}
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
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {RISK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`risk_${c}`)}
              </option>
            ))}
          </select>
          <textarea className="input" rows={2} placeholder={t('description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('likelihood')} (1-5)</label>
              <input type="number" min={1} max={5} className="input" value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">{t('impact')} (1-5)</label>
              <input type="number" min={1} max={5} className="input" value={form.impact} onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })} />
            </div>
          </div>
          <input className="input" placeholder={t('owner')} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}

export default function Module13Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m13_title')} description={t('m13_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
