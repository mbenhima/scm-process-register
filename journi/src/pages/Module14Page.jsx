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
import ExportCsvButton from '../components/ExportCsvButton.jsx'
import { ADKAR_BLOCKS } from '../data/constants.js'
import { adkarAverage, readinessIndex, trainingCompletionAvg, inferSentimentStage, scoreColor } from '../utils/compute.js'
import { readinessBenchmark, adoptionBenchmark, benchmarkStanding } from '../data/benchmarks.js'
import crossTypeMatrix from '../data/crossTypeMatrix.js'

const STANDING_TONE = { ahead: 'green', in_line: 'sand', behind: 'red' }
const STANDING_BAR_COLOR = { ahead: 'bg-emerald-500', in_line: 'bg-brand-500', behind: 'bg-red-500' }
const CHART_HEIGHT = 96

function AdoptionBar({ checkpoint }) {
  const { t } = useI18n()
  if (checkpoint.status !== 'complete' || checkpoint.adoptionRate == null) {
    return (
      <div className="flex flex-col items-center gap-1 w-9 shrink-0">
        <span className="text-[9px] text-ink/30">—</span>
        <div
          className="w-6 rounded-t border-2 border-dashed border-ink/15"
          style={{ height: CHART_HEIGHT }}
          title={`${checkpoint.label}: ${t('notDueYet')}`}
        />
        <span className="text-[9px] text-ink/40 whitespace-nowrap">{checkpoint.label}</span>
      </div>
    )
  }
  const band = adoptionBenchmark(checkpoint.label)
  const standing = band ? benchmarkStanding(checkpoint.adoptionRate, band) : null
  const color = standing ? STANDING_BAR_COLOR[standing] : 'bg-brand-500'
  return (
    <div className="flex flex-col items-center gap-1 w-9 shrink-0">
      <span className="text-[10px] font-semibold text-ink/70">{checkpoint.adoptionRate}%</span>
      <div className="relative w-6" style={{ height: CHART_HEIGHT }}>
        {band && (
          <div
            className="absolute left-[-3px] right-[-3px] border-t border-dashed border-ink/40"
            style={{ bottom: `${band.mid}%` }}
            title={`${t('referenceBand')}: ${band.low}-${band.high}% (mid ${band.mid}%)`}
          />
        )}
        <div className={`absolute bottom-0 w-full rounded-t ${color}`} style={{ height: `${checkpoint.adoptionRate}%` }} />
      </div>
      <span className="text-[9px] text-ink/40 whitespace-nowrap">{checkpoint.label}</span>
    </div>
  )
}

function AdoptionCurveChart({ focusProjects }) {
  const { t } = useI18n()
  const gridLines = [0, 25, 50, 75, 100]
  return (
    <div className="card p-5 md:col-span-2">
      <h3 className="font-semibold text-brand-950">{t('adoptionCurve')}</h3>
      <p className="text-xs text-ink/50 mt-0.5 mb-3">{t('adoptionCurveDesc')}</p>
      <div className="flex items-center gap-3 text-[10px] text-ink/50 mb-3 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> {t('standing_ahead')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-500 inline-block" /> {t('standing_in_line')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> {t('standing_behind')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm border-2 border-dashed border-ink/20 inline-block" /> {t('notDueYet')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 border-t border-dashed border-ink/40" /> {t('referenceBand')} (mid)
        </span>
      </div>
      {focusProjects.length === 0 ? (
        <p className="text-sm text-ink/40 italic">{t('noData')}</p>
      ) : (
        <div className="flex gap-2">
          <div className="flex flex-col justify-between text-[9px] text-ink/30 text-end shrink-0" style={{ height: CHART_HEIGHT }}>
            {[...gridLines].reverse().map((g) => (
              <span key={g} className="leading-none">
                {g}%
              </span>
            ))}
          </div>
          <div className="flex-1 overflow-x-auto pb-2">
            <div className="relative inline-flex gap-6" style={{ minWidth: '100%' }}>
              <div className="absolute inset-x-0 top-0 flex flex-col justify-between pointer-events-none" style={{ height: CHART_HEIGHT }}>
                {gridLines.map((g) => (
                  <div key={g} className="border-t border-ink/10" />
                ))}
              </div>
              {focusProjects.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-1.5 pt-1">
                  <div className="flex items-end gap-1.5">
                    {p.sustainment.checkpoints.map((c) => (
                      <AdoptionBar key={c.id} checkpoint={c} />
                    ))}
                  </div>
                  <span className="text-[10px] text-ink/60 text-center max-w-[110px] leading-tight" title={p.name}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdoptionBenchmarkTable({ focusProjects }) {
  const { t } = useI18n()
  const rows = focusProjects.flatMap((p) =>
    p.sustainment.checkpoints
      .filter((c) => c.status === 'complete' && c.adoptionRate != null)
      .map((c) => ({ project: p, checkpoint: c })),
  )
  const csvColumns = [
    { label: t('cmProject'), value: (r) => r.project.name },
    { label: t('checkpoint'), value: (r) => r.checkpoint.label },
    { label: t('adoptionRate'), value: (r) => r.checkpoint.adoptionRate },
    {
      label: t('referenceBand'),
      value: (r) => {
        const band = adoptionBenchmark(r.checkpoint.label)
        return band ? `${band.low}-${band.high}` : ''
      },
    },
    {
      label: t('status'),
      value: (r) => {
        const band = adoptionBenchmark(r.checkpoint.label)
        return band ? t(`standing_${benchmarkStanding(r.checkpoint.adoptionRate, band)}`) : ''
      },
    },
  ]
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
        <h3 className="font-semibold text-brand-950">{t('adoptionBenchmarking')}</h3>
        <ExportCsvButton filename="adoption-benchmark.csv" rows={rows} columns={csvColumns} />
      </div>
      <p className="text-xs text-ink/50 mb-4">{t('adoptionBenchmarkingDesc')}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/40 italic">{t('noData')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-ink/40">
            <tr>
              <th className="text-start py-1.5">{t('cmProject')}</th>
              <th className="text-start py-1.5">{t('checkpoint')}</th>
              <th className="text-center py-1.5">{t('adoptionRate')}</th>
              <th className="text-center py-1.5">{t('referenceBand')}</th>
              <th className="text-center py-1.5">{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project: p, checkpoint: c }) => {
              const band = adoptionBenchmark(c.label)
              const standing = band ? benchmarkStanding(c.adoptionRate, band) : null
              return (
                <tr key={`${p.id}-${c.id}`} className="border-t border-brand-50">
                  <td className="py-1.5 font-medium text-brand-950">{p.name}</td>
                  <td className="py-1.5">
                    <Badge tone="sand">{c.label}</Badge>
                  </td>
                  <td className="py-1.5 text-center font-semibold">{c.adoptionRate}%</td>
                  <td className="py-1.5 text-center text-ink/50">{band ? `${band.low}–${band.high}%` : '—'}</td>
                  <td className="py-1.5 text-center">
                    {standing ? <Badge tone={STANDING_TONE[standing]}>{t(`standing_${standing}`)}</Badge> : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function Module14Page() {
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
        title={t('m14_title')}
        description={t('m14_desc')}
        actions={<LevelSelector levels={levels} value={level} onChange={setLevelPref} />}
      />
      <p className="text-xs text-ink/40 -mt-4">{t('viewingAtLevel')}: {levelLabel}</p>

      <div className="flex gap-2">
        <button className={`tab ${tab === 'analytics' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('analytics')}>
          {t('m14_title')}
        </button>
        <button className={`tab ${tab === 'benchmark' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('benchmark')}>
          {t('benchmarking')}
        </button>
        <button className={`tab ${tab === 'crosstype' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('crosstype')}>
          {t('m14_crosstype_tab')}
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
                      <span>{t('m9_title')}</span>
                      <span>{Math.round(trainingPct)}%</span>
                    </div>
                    <ProgressBar value={trainingPct} tone="amber" />
                  </div>
                </div>
              )}
              {!showSingleProject && (
                <p className="text-xs text-ink/40">
                  {t('averageAcrossProjects').replace('{count}', focusProjects.length).replace('{level}', levelLabel)}
                </p>
              )}
            </div>

            <AdoptionCurveChart focusProjects={focusProjects} />
          </div>

          <div className="card p-5 overflow-x-auto">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-semibold text-brand-950">{t('heatmapByDept')} — {scopeName || 'Portfolio'}</h3>
              <ExportCsvButton
                filename={`readiness-heatmap-${level}.csv`}
                rows={focusProjects}
                columns={[
                  { label: t('cmProject'), value: 'name' },
                  ...ADKAR_BLOCKS.map((b) => ({ label: t(b), value: (p) => p.adkar[b].score })),
                  { label: t('readinessIndex'), value: (p) => readinessIndex(p) },
                ]}
              />
            </div>
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
            <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-brand-950">{t('benchmarking')} — {levelLabel}</h3>
              <ExportCsvButton
                filename={`readiness-benchmark-${level}.csv`}
                rows={focusProjects}
                columns={[
                  { label: t('cmProject'), value: 'name' },
                  { label: t('lewin'), value: (p) => t(`lewin_${p.lewinPhase}`) },
                  { label: t('readinessIndex'), value: (p) => readinessIndex(p) },
                  {
                    label: t('peerAverage'),
                    value: (p) => {
                      const peers = focusProjects.filter((x) => x.id !== p.id)
                      return peers.length ? Math.round(peers.reduce((a, x) => a + readinessIndex(x), 0) / peers.length) : ''
                    },
                  },
                  {
                    label: t('referenceBand'),
                    value: (p) => {
                      const band = readinessBenchmark(p.lewinPhase)
                      return `${band.low}-${band.high}`
                    },
                  },
                  {
                    label: t('status'),
                    value: (p) => t(`standing_${benchmarkStanding(readinessIndex(p), readinessBenchmark(p.lewinPhase))}`),
                  },
                ]}
              />
            </div>
            <p className="text-xs text-ink/50 mb-4">{t('readinessBenchmarkingDesc')}</p>
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

          <AdoptionBenchmarkTable focusProjects={focusProjects} />
        </div>
      )}

      {tab === 'crosstype' && (
        <div className="card p-5 overflow-x-auto">
          <h3 className="font-semibold text-brand-950 mb-1">{t('m14_crosstype_title')}</h3>
          <p className="text-xs text-ink/50 mb-4">{t('m14_crosstype_desc')}</p>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-ink/40">
              <tr>
                <th className="text-start py-1.5">{t('type')}</th>
                <th className="text-start py-1.5">{t('m14_crosstype_duration')}</th>
                <th className="text-start py-1.5">{t('m14_crosstype_gate')}</th>
                <th className="text-start py-1.5">{t('m14_crosstype_external')}</th>
                <th className="text-start py-1.5">{t('m14_crosstype_framework')}</th>
                <th className="text-start py-1.5">{t('m14_crosstype_reversibility')}</th>
                <th className="text-start py-1.5">{t('m14_crosstype_example')}</th>
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
