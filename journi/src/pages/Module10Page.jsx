import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { canWrite } from '../utils/rbac.js'

function Content({ project }) {
  const { t } = useI18n()
  const { addSubItem, updateSubItem, removeSubItem, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ curriculum: '', track: '', facilitator: '', format: 'Classroom', completion: 0, certified: false })

  function submit() {
    if (!form.curriculum.trim()) return
    addSubItem(project.id, 'trainings', form)
    setModal(false)
    setForm({ curriculum: '', track: '', facilitator: '', format: 'Classroom', completion: 0, certified: false })
  }

  const gapBlocks = ['knowledge', 'ability'].filter((b) => project.adkar[b].score <= 2)

  return (
    <div className="space-y-4">
      {gapBlocks.length > 0 && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-sm text-brand-900">
          Training-needs assessment: {gapBlocks.map((b) => t(b)).join(' & ')} gap identified from M6 — see recommendation below.
        </div>
      )}

      {canEdit && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setModal(true)}>
            + {t('curriculum')}
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        {project.trainings.length === 0 ? (
          <div className="p-4">
            <EmptyState />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-start px-4 py-2.5">{t('curriculum')}</th>
                <th className="text-start px-4 py-2.5">{t('cohort')}</th>
                <th className="text-start px-4 py-2.5">{t('facilitator')}</th>
                <th className="text-start px-4 py-2.5">{t('format')}</th>
                <th className="text-start px-4 py-2.5 w-40">{t('completion')}</th>
                <th className="text-start px-4 py-2.5">{t('certification')}</th>
                {canEdit && <th className="px-2 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {project.trainings.map((tr) => (
                <tr key={tr.id} className="border-t border-brand-50">
                  <td className="px-4 py-2.5 font-medium text-brand-950">{tr.curriculum}</td>
                  <td className="px-4 py-2.5 text-ink/60">{tr.track}</td>
                  <td className="px-4 py-2.5 text-ink/60">{tr.facilitator}</td>
                  <td className="px-4 py-2.5 text-ink/60">{tr.format}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={tr.completion} />
                      <span className="text-xs text-ink/50 w-9">{tr.completion}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      disabled={!canEdit}
                      onClick={() => updateSubItem(project.id, 'trainings', tr.id, { certified: !tr.certified })}
                      className={canEdit ? 'cursor-pointer' : 'cursor-default'}
                    >
                      <Badge tone={tr.certified ? 'green' : 'gray'}>{tr.certified ? t('certification') : 'trained only'}</Badge>
                    </button>
                  </td>
                  {canEdit && (
                    <td className="px-2 py-2.5">
                      <button className="btn-danger text-xs" onClick={() => removeSubItem(project.id, 'trainings', tr.id)}>
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

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-2 text-sm">Training Gap-to-Curriculum Mapper</h3>
        <AiSuggestionBox
          useCaseId="uc-training-mapper"
          orgId={project.orgId}
          projectId={project.id}
          ucName="Training Gap-to-Curriculum Mapper"
          tier="assistive"
          buildSuggestion={() =>
            gapBlocks.length
              ? `Recommend adding a hands-on practice track targeting ${gapBlocks.map((b) => t(b)).join(' and ')} — sandbox-based, facilitator-led, 2x 90-minute sessions per cohort.`
              : `No significant Knowledge/Ability gap detected — current curriculum coverage looks adequate.`
          }
          onAccept={(text) =>
            addSubItem(project.id, 'trainings', {
              curriculum: text.slice(0, 60),
              track: 'Recommended by AI',
              facilitator: 'TBD',
              format: 'Blended',
              completion: 0,
              certified: false,
            })
          }
        />
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`+ ${t('curriculum')}`}
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
          <input className="input" placeholder={t('curriculum')} value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} />
          <input className="input" placeholder={t('cohort')} value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} />
          <input className="input" placeholder={t('facilitator')} value={form.facilitator} onChange={(e) => setForm({ ...form, facilitator: e.target.value })} />
          <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
            <option>Classroom</option>
            <option>Blended</option>
            <option>Mobile e-learning</option>
            <option>On-the-floor</option>
          </select>
          <div>
            <label className="label">{t('completion')} %</label>
            <input
              type="number"
              min={0}
              max={100}
              className="input"
              value={form.completion}
              onChange={(e) => setForm({ ...form, completion: Number(e.target.value) })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function Module10Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m10_title')} description={t('m10_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
