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
import JustifyPanel from '../components/JustifyPanel.jsx'
import { canWrite } from '../utils/rbac.js'

const LEVELS = ['Foundation', 'Practitioner', 'Advanced']
const BLANK_FORM = {
  curriculum: '', track: '', level: 'Foundation', module: '', objectives: '', prerequisites: '',
  agenda: '', targetAudience: '', expectedResults: '', workshops: '',
  facilitator: '', format: 'Classroom', completion: 0, certified: false,
}
const listify = (text) => (text || '').split('\n').map((s) => s.trim()).filter(Boolean)

function CurriculumDetail({ tr }) {
  const rows = [
    ['Module', tr.module],
    ['Objectives', listify(tr.objectives)],
    ['Prerequisites', listify(tr.prerequisites)],
    ['Agenda', listify(tr.agenda)],
    ['Expected Results', listify(tr.expectedResults)],
    ['Workshops', listify(tr.workshops)],
  ]
  return (
    <div className="bg-brand-50/30 rounded-lg p-3 space-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid sm:grid-cols-[140px_1fr] gap-1">
          <div className="text-xs font-semibold text-brand-800 uppercase tracking-wide">{label}</div>
          {Array.isArray(value) ? (
            value.length === 0 ? (
              <span className="text-ink/30 italic text-xs">not specified</span>
            ) : (
              <ul className="list-disc pl-4 text-ink/80">
                {value.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            )
          ) : (
            <span className="text-ink/80">{value || <span className="text-ink/30 italic">not specified</span>}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function Content({ project }) {
  const { t } = useI18n()
  const { data, addSubItem, removeSubItem, logJustifiedChange, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [expanded, setExpanded] = useState(null)
  const [certJustifyId, setCertJustifyId] = useState(null)
  const [certJustification, setCertJustification] = useState('')

  function startCertToggle(tr) {
    setCertJustifyId(tr.id)
    setCertJustification('')
  }
  function cancelCertToggle() {
    setCertJustifyId(null)
    setCertJustification('')
  }
  function saveCertToggle(tr) {
    const nextCertified = !tr.certified
    logJustifiedChange(project.id, {
      module: 'M10 · Training & Certification',
      field: `Certification — ${tr.curriculum}`,
      oldValue: tr.certified ? t('certification') : 'trained only',
      newValue: nextCertified ? t('certification') : 'trained only',
      justification: certJustification,
      applyPatch: (p) => ({ ...p, trainings: p.trainings.map((t2) => (t2.id === tr.id ? { ...t2, certified: nextCertified } : t2)) }),
    })
    cancelCertToggle()
  }

  function submit() {
    if (!form.curriculum.trim()) return
    addSubItem(project.id, 'trainings', form)
    setModal(false)
    setForm(BLANK_FORM)
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
                <th className="text-start px-4 py-2.5">Level</th>
                <th className="text-start px-4 py-2.5">Target Audience</th>
                <th className="text-start px-4 py-2.5 w-40">{t('completion')}</th>
                <th className="text-start px-4 py-2.5">{t('certification')}</th>
                <th className="px-2 py-2.5" />
                {canEdit && <th className="px-2 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {project.trainings.map((tr) => (
                <React.Fragment key={tr.id}>
                  <tr className="border-t border-brand-50">
                    <td className="px-4 py-2.5 font-medium text-brand-950">{tr.curriculum}</td>
                    <td className="px-4 py-2.5 text-ink/60">{tr.track}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone="sand">{tr.level || 'Foundation'}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-ink/60">{tr.targetAudience}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={tr.completion} />
                        <span className="text-xs text-ink/50 w-9">{tr.completion}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        disabled={!canEdit}
                        onClick={() => startCertToggle(tr)}
                        className={canEdit ? 'cursor-pointer' : 'cursor-default'}
                      >
                        <Badge tone={tr.certified ? 'green' : 'gray'}>{tr.certified ? t('certification') : 'trained only'}</Badge>
                      </button>
                    </td>
                    <td className="px-2 py-2.5">
                      <button className="btn-ghost text-xs whitespace-nowrap" onClick={() => setExpanded(expanded === tr.id ? null : tr.id)}>
                        {expanded === tr.id ? 'Hide' : 'View'} details
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
                  {certJustifyId === tr.id && (
                    <tr className="border-t border-brand-50">
                      <td colSpan={canEdit ? 8 : 7} className="px-4 py-3">
                        <JustifyPanel
                          justification={certJustification}
                          onJustificationChange={setCertJustification}
                          onSave={() => saveCertToggle(tr)}
                          onCancel={cancelCertToggle}
                          saveLabel={tr.certified ? 'Revoke certification with justification' : 'Certify with justification'}
                          placeholder="Why is this cohort's certification status changing?"
                        />
                      </td>
                    </tr>
                  )}
                  {expanded === tr.id && (
                    <tr className="border-t border-brand-50">
                      <td colSpan={canEdit ? 8 : 7} className="px-4 py-3">
                        <CurriculumDetail tr={tr} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
              ...BLANK_FORM,
              curriculum: text.slice(0, 60),
              track: 'Recommended by AI',
              facilitator: 'TBD',
              format: 'Blended',
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
          <div>
            <label className="label">Curriculum</label>
            <input className="input" placeholder={t('curriculum')} value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Track</label>
              <input className="input" placeholder={t('cohort')} value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} />
            </div>
            <div>
              <label className="label">Level</label>
              <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Module</label>
            <input className="input" placeholder="e.g. Module 3 — Order-to-Cash Processing" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} />
          </div>
          <div>
            <label className="label">Objectives (one per line)</label>
            <textarea className="input" rows={2} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
          </div>
          <div>
            <label className="label">Prerequisites (one per line)</label>
            <textarea className="input" rows={2} value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} />
          </div>
          <div>
            <label className="label">Agenda (one item per line)</label>
            <textarea className="input" rows={2} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
          </div>
          <div>
            <label className="label">Target Audience</label>
            <input className="input" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
          </div>
          <div>
            <label className="label">Expected Results (one per line)</label>
            <textarea className="input" rows={2} value={form.expectedResults} onChange={(e) => setForm({ ...form, expectedResults: e.target.value })} />
          </div>
          <div>
            <label className="label">Workshops (one per line)</label>
            <textarea className="input" rows={2} value={form.workshops} onChange={(e) => setForm({ ...form, workshops: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('facilitator')}</label>
            <input className="input" placeholder={t('facilitator')} value={form.facilitator} onChange={(e) => setForm({ ...form, facilitator: e.target.value })} />
          </div>
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
