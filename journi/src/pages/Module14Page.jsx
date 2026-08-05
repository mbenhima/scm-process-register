import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useOrgProjects } from '../utils/useScoped.js'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { RISK_CATEGORIES } from '../data/constants.js'
import { riskScore, isHighSeverityRisk } from '../utils/compute.js'
import { canWrite } from '../utils/rbac.js'

const STATUS_TONE = { open: 'red', mitigating: 'amber', closed: 'green' }

function Content({ project }) {
  const { t } = useI18n()
  const { addSubItem, updateSubItem, removeSubItem, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role)
  const orgProjects = useOrgProjects(project.orgId)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ category: 'adoption', description: '', likelihood: 3, impact: 3, owner: '', status: 'open' })

  function submit() {
    if (!form.description.trim()) return
    addSubItem(project.id, 'risks', form)
    setModal(false)
    setForm({ category: 'adoption', description: '', likelihood: 3, impact: 3, owner: '', status: 'open' })
  }

  const saturationOverlap = orgProjects.filter((p) => p.id !== project.id)
  const sorted = [...project.risks].sort((a, b) => riskScore(b) - riskScore(a))

  return (
    <div className="space-y-4">
      {saturationOverlap.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Portfolio cross-reference: population also targeted by {saturationOverlap.map((p) => p.name).join(', ')} — potential
          saturation risk.
        </div>
      )}

      {canEdit && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setModal(true)}>
            + {t('riskCategory')}
          </button>
        </div>
      )}

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
                {canEdit && <th className="px-2 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className="border-t border-brand-50">
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
                        value={r.status}
                        onChange={(e) => updateSubItem(project.id, 'risks', r.id, { status: e.target.value })}
                      >
                        <option value="open">open</option>
                        <option value="mitigating">mitigating</option>
                        <option value="closed">closed</option>
                      </select>
                    ) : (
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-2 py-2.5">
                      <button className="btn-danger text-xs" onClick={() => removeSubItem(project.id, 'risks', r.id)}>
                        {t('delete')}
                      </button>
                    </td>
                  )}
                </tr>
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

export default function Module14Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m14_title')} description={t('m14_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
