import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { isHighImpactLowInfluence } from '../utils/compute.js'

const DIMS = ['process', 'tech', 'role', 'location', 'identity']

function impactCellColor(v) {
  if (v >= 4) return 'bg-red-500 text-white'
  if (v === 3) return 'bg-amber-400 text-white'
  return 'bg-brand-100 text-brand-800'
}

function Content({ project }) {
  const { t } = useI18n()
  const { addSubItem } = useAppState()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ headcount: 50, impact: { process: 3, tech: 3, role: 3, location: 3, identity: 3 }, influence: 3 })

  function submit() {
    addSubItem(project.id, 'stakeholderGroups', form)
    setModal(false)
    setForm({ headcount: 50, impact: { process: 3, tech: 3, role: 3, location: 3, identity: 3 }, influence: 3 })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setModal(true)}>
          + {t('stakeholderGroup')}
        </button>
      </div>

      <div className="card overflow-x-auto">
        {project.stakeholderGroups.length === 0 ? (
          <div className="p-4">
            <EmptyState />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-start px-4 py-2.5">{t('stakeholderGroup')}</th>
                <th className="text-start px-4 py-2.5">{t('headcount')}</th>
                {DIMS.map((d) => (
                  <th key={d} className="text-center px-2 py-2.5">
                    {t(`impact${d[0].toUpperCase()}${d.slice(1)}`)}
                  </th>
                ))}
                <th className="text-center px-2 py-2.5">{t('influence')}</th>
                <th className="text-start px-4 py-2.5">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {project.stakeholderGroups.map((sh) => (
                <tr key={sh.id} className="border-t border-brand-50">
                  <td className="px-4 py-2.5 font-medium text-brand-950">{sh.name}</td>
                  <td className="px-4 py-2.5 text-ink/60">{sh.headcount}</td>
                  {DIMS.map((d) => (
                    <td key={d} className="px-2 py-2.5 text-center">
                      <span className={`inline-flex w-7 h-7 items-center justify-center rounded-md text-xs font-semibold ${impactCellColor(sh.impact[d])}`}>
                        {sh.impact[d]}
                      </span>
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-center font-semibold text-brand-800">{sh.influence}</td>
                  <td className="px-4 py-2.5">
                    {isHighImpactLowInfluence(sh) && <Badge tone="red">{t('highImpactLowInfluence')}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-2 text-sm">{t('navM17')}</h3>
        <AiSuggestionBox
          useCaseId="uc-stakeholder-impact"
          orgId={project.orgId}
          projectId={project.id}
          ucName="Stakeholder Impact Drafting Assistant"
          tier="assistive"
          buildSuggestion={() =>
            `Suggested new cohort "Regional Support Staff" — headcount ~${Math.round(30 + Math.random() * 60)}, impact concentrated in Process (4) and Technology (4), low influence (2). Recommend adding to deep ADKAR tracking given high-impact/low-influence pattern.`
          }
        />
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`+ ${t('stakeholderGroup')}`}
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
        <div className="mb-3">
          <label className="label">{t('name')}</label>
          <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="label">{t('headcount')}</label>
          <input
            type="number"
            className="input"
            value={form.headcount}
            onChange={(e) => setForm({ ...form, headcount: Number(e.target.value) })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {DIMS.map((d) => (
            <div key={d}>
              <label className="label">{t(`impact${d[0].toUpperCase()}${d.slice(1)}`)} (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="input"
                value={form.impact[d]}
                onChange={(e) => setForm({ ...form, impact: { ...form.impact, [d]: Number(e.target.value) } })}
              />
            </div>
          ))}
          <div>
            <label className="label">{t('influence')} (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className="input"
              value={form.influence}
              onChange={(e) => setForm({ ...form, influence: Number(e.target.value) })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function Module5Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m5_title')} description={t('m5_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
