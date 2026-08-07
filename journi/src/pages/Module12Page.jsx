import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { ADKAR_BLOCKS } from '../data/constants.js'
import { scoreColor, isBlockStalled } from '../utils/compute.js'
import { canWrite } from '../utils/rbac.js'

function Content({ project }) {
  const { t } = useI18n()
  const { data, updateProjectMeta, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
  const [readiness, setReadiness] = useState(project.managerReadiness ?? 3)
  const stalled = ADKAR_BLOCKS.filter((b) => isBlockStalled(project.adkar[b]))

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-semibold text-brand-950 mb-3">Team-scoped ADKAR Heatmap — {project.targetPopulation}</h3>
        <div className="grid grid-cols-5 gap-2">
          {ADKAR_BLOCKS.map((b) => (
            <div key={b} className={`rounded-lg p-3 text-center ${scoreColor(project.adkar[b].score)}`}>
              <div className="text-xs font-semibold">{t(b)}</div>
              <div className="text-2xl font-bold">{project.adkar[b].score}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink/40 mt-2">Restricted to this manager's own reporting line — no org-wide change data exposed.</p>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-brand-950 mb-2">{t('managerReadiness')}</h3>
        <p className="text-xs text-ink/50 mb-3">A manager must be ready to lead the change before their team can be.</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              disabled={!canEdit}
              onClick={() => {
                setReadiness(n)
                updateProjectMeta(project.id, { managerReadiness: n })
              }}
              className={`flex-1 h-10 rounded-lg text-sm font-semibold ${
                n === readiness ? 'bg-brand-600 text-white' : 'bg-brand-50 text-ink/40 hover:bg-brand-100'
              } ${!canEdit ? 'cursor-default' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-2 text-sm">{t('coachingScript')} — Manager Coaching Script Generator</h3>
        <AiSuggestionBox
          useCaseId="uc-coaching-script"
          orgId={project.orgId}
          projectId={project.id}
          ucName="Manager Coaching Script Generator"
          tier="assistive"
          buildSuggestion={() =>
            stalled.length
              ? `Talking points for a ${t(stalled[0])} barrier 1:1: (1) Ask an open question about what's blocking them specifically. (2) Acknowledge the concern without minimizing it. (3) Connect the change to something they already care about. (4) Agree on one small next step together.`
              : `No stalled block currently flagged for this team — consider a light-touch check-in to sustain momentum.`
          }
        />
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-3">{t('coachingNote')}</h3>
        <div className="space-y-2">
          {project.coachingNotes.length === 0 && <p className="text-sm text-ink/40 italic">{t('noData')}</p>}
          {project.coachingNotes.map((n) => (
            <div key={n.id} className="rounded-lg border border-brand-100 p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-brand-950">
                  {n.managerName} → {n.cohort}
                </span>
                <Badge tone="sand">{t(n.barrierBlock)}</Badge>
              </div>
              <p className="text-ink/70">{n.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink/40 mt-2">Add new coaching notes from M6 · ADKAR Engine.</p>
      </div>
    </div>
  )
}

export default function Module12Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m12_title')} description={t('m12_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
