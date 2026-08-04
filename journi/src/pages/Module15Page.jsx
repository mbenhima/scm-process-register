import React from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { visibleOrganizations, visibleProjects } from '../utils/rbac.js'
import { useScopedOrg, useScopedProject } from '../utils/useScoped.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { ADKAR_BLOCKS } from '../data/constants.js'
import { adkarAverage, readinessIndex, trainingCompletionAvg, inferSentimentStage, scoreColor } from '../utils/compute.js'

export default function Module15Page() {
  const { t } = useI18n()
  const { data, currentUser } = useAppState()
  const org = useScopedOrg()
  const project = useScopedProject()

  const orgs = visibleOrganizations(currentUser, data)
  const portfolioProjects = orgs.flatMap((o) => visibleProjects(currentUser, data, o.id))

  const focusProjects = org ? visibleProjects(currentUser, data, org.id) : portfolioProjects

  const ri = project ? readinessIndex(project) : Math.round(portfolioProjects.reduce((a, p) => a + readinessIndex(p), 0) / (portfolioProjects.length || 1))
  const adkarPct = project ? (adkarAverage(project) / 5) * 100 : null
  const trainingPct = project ? trainingCompletionAvg(project) : null

  // simple correlation observation across portfolio: sentiment stage vs completed-checkpoint adoption
  const withAdoption = portfolioProjects
    .map((p) => {
      const latest = [...p.sustainment.checkpoints].reverse().find((c) => c.status === 'complete')
      return latest ? { project: p, adoption: latest.adoptionRate, sentiment: inferSentimentStage(p) } : null
    })
    .filter(Boolean)

  return (
    <div className="space-y-5">
      <PageHeader title={t('m15_title')} description={t('m15_desc')} />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-1">
          <div className="text-xs font-semibold uppercase text-ink/40 mb-1">{t('readinessIndex')}</div>
          <div className="text-5xl font-bold text-brand-700 mb-3">{ri}%</div>
          {project && (
            <div className="space-y-2 text-sm">
              <div>
                <div className="flex justify-between text-xs text-ink/50 mb-0.5">
                  <span>{t('adkar')}</span>
                  <span>{Math.round(adkarPct)}%</span>
                </div>
                <ProgressBar value={adkarPct} />
              </div>
              <div>
                <div className="flex justify-between text-xs text-ink/50 mb-0.5">
                  <span>{t('kubler')}</span>
                  <span>{t(`sentiment_${inferSentimentStage(project)}`)}</span>
                </div>
                <ProgressBar value={{ denial: 20, resistance: 40, exploration: 70, commitment: 100 }[inferSentimentStage(project)]} tone="sand" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-ink/50 mb-0.5">
                  <span>{t('m10_title')}</span>
                  <span>{Math.round(trainingPct)}%</span>
                </div>
                <ProgressBar value={trainingPct} tone="amber" />
              </div>
            </div>
          )}
        </div>

        <div className="card p-5 md:col-span-2">
          <h3 className="font-semibold text-brand-950 mb-3">{t('adoptionCurve')}</h3>
          <div className="flex items-end gap-4 h-32">
            {focusProjects.map((p) => {
              const checkpoints = p.sustainment.checkpoints
              return (
                <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-1 h-24">
                    {checkpoints.map((c) => (
                      <div
                        key={c.id}
                        title={`${c.label}: ${c.adoptionRate ?? '—'}%`}
                        className="w-3 rounded-t bg-brand-500"
                        style={{ height: `${c.adoptionRate || 4}%` }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-ink/40 text-center leading-tight line-clamp-2">{p.name.split(' ')[0]}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card p-5 overflow-x-auto">
        <h3 className="font-semibold text-brand-950 mb-3">{t('heatmapByDept')} — {org ? org.name : 'Portfolio'}</h3>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-ink/40">
            <tr>
              <th className="text-start py-1.5">{t('cmProject')}</th>
              {ADKAR_BLOCKS.map((b) => (
                <th key={b} className="text-center py-1.5">
                  {t(b)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {focusProjects.map((p) => (
              <tr key={p.id} className="border-t border-brand-50">
                <td className="py-1.5 font-medium text-brand-950">{p.name}</td>
                {ADKAR_BLOCKS.map((b) => (
                  <td key={b} className="py-1.5 text-center">
                    <span className={`inline-flex w-8 h-8 items-center justify-center rounded-md text-xs font-semibold ${scoreColor(p.adkar[b].score)}`}>
                      {p.adkar[b].score}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-brand-950 mb-2">Correlation: sentiment vs. adoption speed</h3>
        {withAdoption.length === 0 ? (
          <p className="text-sm text-ink/40 italic">Not enough post-go-live checkpoint data yet across this portfolio.</p>
        ) : (
          <ul className="space-y-1 text-sm text-ink/70">
            {withAdoption.map(({ project: p, adoption, sentiment }) => (
              <li key={p.id}>
                {p.name}: {t(`sentiment_${sentiment}`)} sentiment ↔ {adoption}% adoption at latest checkpoint
                {sentiment === 'exploration' || sentiment === 'commitment' ? (
                  <span className="text-brand-600"> — positive sentiment tracking with faster adoption</span>
                ) : (
                  <span className="text-amber-600"> — early-warning: cautious sentiment, watch next checkpoint</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {project && (
        <div className="card p-4">
          <h3 className="font-semibold text-brand-950 mb-2 text-sm">{t('execNarrative')}</h3>
          <AiSuggestionBox
            useCaseId="uc-exec-narrative"
            orgId={project.orgId}
            projectId={project.id}
            ucName="Executive Readiness Narrative Generator"
            tier="augmented"
            buildSuggestion={() =>
              `${project.name} shows a Composite Readiness Index of ${ri}%. The population is in Bridges "${t(`bridges_${project.bridgesPhase}`)}" / Lewin "${t(`lewin_${project.lewinPhase}`)}". Primary attention area: ${
                ADKAR_BLOCKS.filter((b) => project.adkar[b].score <= 2)[0] ? t(ADKAR_BLOCKS.filter((b) => project.adkar[b].score <= 2)[0]) : 'no blocking barrier currently'
              }. Recommend Sponsor visibility remain a standing agenda item until the next milestone review.`
            }
          />
        </div>
      )}
    </div>
  )
}
