import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { availableRollupLevels, projectsForLevel } from '../utils/rbac.js'
import { useScopedOrg, useScopedProject } from '../utils/useScoped.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import LevelSelector from '../components/LevelSelector.jsx'
import { ADKAR_BLOCKS } from '../data/constants.js'
import { adkarAverage, readinessIndex, trainingCompletionAvg, inferSentimentStage, scoreColor } from '../utils/compute.js'
import { readinessBenchmark, benchmarkStanding } from '../data/benchmarks.js'
import crossTypeMatrix from '../data/crossTypeMatrix.js'

const STANDING_TONE = { ahead: 'green', in_line: 'sand', behind: 'red' }

export default function Module15Page() {
  const { t } = useI18n()
  const { data, currentUser, scope } = useAppState()
  const org = useScopedOrg()
  const project = useScopedProject()
  const [tab, setTab] = useState('analytics')

  const rollupLevels = availableRollupLevels(currentUser, org)
  const levels = [...(scope.cmProjectId ? ['project'] : []), ...rollupLevels]
  const [levelPref, setLevelPref] = useState(null)
  const level = levels.includes(levelPref) ? levelPref : levels[0] || 'organization'

  const focusProjects = org ? projectsForLevel(data, level, scope, org) : []
  const showSingleProject = level === 'project' && project

  const ri = focusProjects.length ? Math.round(focusProjects.reduce((a, p) => a + readinessIndex(p), 0) / focusProjects.length) : 0
  const adkarPct = showSingleProject ? (adkarAverage(project) / 5) * 100 : null
  const trainingPct = showSingleProject ? trainingCompletionAvg(project) : null

  const withAdoption = focusProjects
    .map((p) => {
      const latest = [...p.sustainment.checkpoints].reverse().find((c) => c.status === 'complete')
      return latest ? { project: p, adoption: latest.adoptionRate, sentiment: inferSentimentStage(p) } : null
    })
    .filter(Boolean)

  const levelLabel = level === 'project' ? t('cmProject') : level === 'group' ? t('group') : t('organization')
  const group = org?.groupId ? data.groups.find((g) => g.id === org.groupId) : null
  const scopeName = level === 'project' ? project?.name : level === 'group' ? group?.name : org?.name

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('m15_title')}
        description={t('m15_desc')}
        actions={<LevelSelector levels={levels} value={level} onChange={setLevelPref} />}
      />
      <p className="text-xs text-ink/40 -mt-4">{t('viewingAtLevel')}: {levelLabel}</p>

      <div className="flex gap-2">
        <button className={`tab ${tab === 'analytics' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('analytics')}>
          {t('m15_title')}
        </button>
        <button className={`tab ${tab === 'benchmark' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('benchmark')}>
          {t('benchmarking')}
        </button>
        <button className={`tab ${tab === 'crosstype' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('crosstype')}>
          {t('m15_crosstype_tab')}
        </button>
      </div>

      {tab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-5 md:col-span-1">
              <div className="text-xs font-semibold uppercase text-ink/40 mb-1">{t('readinessIndex')}</div>
              <div className="text-5xl font-bold text-brand-700 mb-3">{ri}%</div>
              {showSingleProject && (
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
              {!showSingleProject && <p className="text-xs text-ink/40">Average across {focusProjects.length} project(s) at {levelLabel} level.</p>}
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
            <h3 className="font-semibold text-brand-950 mb-3">{t('heatmapByDept')} — {scopeName || 'Portfolio'}</h3>
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
              <p className="text-sm text-ink/40 italic">Not enough post-go-live checkpoint data yet at this level.</p>
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

          {showSingleProject && (
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
      )}

      {tab === 'benchmark' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-brand-950 mb-1">{t('benchmarking')} — {levelLabel}</h3>
            <p className="text-xs text-ink/50 mb-4">
              Each project's Composite Readiness Index compared against a seeded reference band for its current Lewin phase, and against the peer average within this level's scope.
            </p>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-ink/40">
                <tr>
                  <th className="text-start py-1.5">{t('cmProject')}</th>
                  <th className="text-start py-1.5">{t('lewin')}</th>
                  <th className="text-center py-1.5">{t('readinessIndex')}</th>
                  <th className="text-center py-1.5">{t('peerAverage')}</th>
                  <th className="text-center py-1.5">{t('referenceBand')}</th>
                  <th className="text-center py-1.5">{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {focusProjects.map((p) => {
                  const pRi = readinessIndex(p)
                  const band = readinessBenchmark(p.lewinPhase)
                  const standing = benchmarkStanding(pRi, band)
                  const peers = focusProjects.filter((x) => x.id !== p.id)
                  const peerAvg = peers.length ? Math.round(peers.reduce((a, x) => a + readinessIndex(x), 0) / peers.length) : null
                  return (
                    <tr key={p.id} className="border-t border-brand-50">
                      <td className="py-1.5 font-medium text-brand-950">{p.name}</td>
                      <td className="py-1.5">
                        <Badge tone="sand">{t(`lewin_${p.lewinPhase}`)}</Badge>
                      </td>
                      <td className="py-1.5 text-center font-semibold">{pRi}%</td>
                      <td className="py-1.5 text-center text-ink/50">{peerAvg == null ? '—' : `${peerAvg}%`}</td>
                      <td className="py-1.5 text-center text-ink/50">{band.low}–{band.high}%</td>
                      <td className="py-1.5 text-center">
                        <Badge tone={STANDING_TONE[standing]}>{t(`standing_${standing}`)}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {focusProjects.length === 0 && <p className="text-sm text-ink/40 italic mt-2">{t('noData')}</p>}
          </div>
        </div>
      )}

      {tab === 'crosstype' && (
        <div className="card p-5 overflow-x-auto">
          <h3 className="font-semibold text-brand-950 mb-1">{t('m15_crosstype_title')}</h3>
          <p className="text-xs text-ink/50 mb-4">{t('m15_crosstype_desc')}</p>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-ink/40">
              <tr>
                <th className="text-start py-1.5">{t('type')}</th>
                <th className="text-start py-1.5">{t('m15_crosstype_duration')}</th>
                <th className="text-start py-1.5">{t('m15_crosstype_gate')}</th>
                <th className="text-start py-1.5">{t('m15_crosstype_external')}</th>
                <th className="text-start py-1.5">{t('m15_crosstype_framework')}</th>
                <th className="text-start py-1.5">{t('m15_crosstype_reversibility')}</th>
                <th className="text-start py-1.5">{t('m15_crosstype_example')}</th>
              </tr>
            </thead>
            <tbody>
              {crossTypeMatrix.map((row) => (
                <tr key={row.transformationType} className="border-t border-brand-50 align-top">
                  <td className="py-2 pe-3 font-medium text-brand-950 whitespace-nowrap">{t(`archetype_${row.transformationType}`)}</td>
                  <td className="py-2 pe-3 text-ink/70">{row.typicalDuration}</td>
                  <td className="py-2 pe-3 text-ink/70">{row.terminalGate}</td>
                  <td className="py-2 pe-3 text-ink/70">{row.externalPartyInvolvement}</td>
                  <td className="py-2 pe-3 text-ink/70">{row.dominantFramework}</td>
                  <td className="py-2 pe-3 text-ink/70">{row.reversibility}</td>
                  <td className="py-2 text-ink/50 text-xs">{row.seedProjectExample}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
