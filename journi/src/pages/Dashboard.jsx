import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { availableRollupLevels, projectsForLevel } from '../utils/rbac.js'
import { useScopedOrg } from '../utils/useScoped.js'
import { readinessIndex, stalledBlocks, hasDivergence } from '../utils/compute.js'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import Badge from '../components/Badge.jsx'
import LevelSelector from '../components/LevelSelector.jsx'

export default function Dashboard() {
  const { t } = useI18n()
  const { data, currentUser, scope, setScope } = useAppState()
  const navigate = useNavigate()
  const org = useScopedOrg()

  const rollupLevels = availableRollupLevels(currentUser, org)
  const levels = [...(scope.cmProjectId ? ['project'] : []), ...rollupLevels]
  const [levelPref, setLevelPref] = useState(null)
  const level = levels.includes(levelPref) ? levelPref : levels[0] || 'organization'

  const projects = org ? projectsForLevel(data, level, scope, org) : []

  const avgReadiness = projects.length
    ? Math.round(projects.reduce((a, p) => a + readinessIndex(p), 0) / projects.length)
    : 0
  const totalPeople = projects.reduce((a, p) => a + (parseInt((p.targetPopulation || '').match(/[\d,]+/)?.[0].replace(/,/g, '')) || 0), 0)
  const openRisks = projects.reduce((a, p) => a + p.risks.filter((r) => r.status === 'open').length, 0)

  const byPhase = { unfreeze: [], change: [], refreeze: [] }
  for (const p of projects) byPhase[p.lewinPhase]?.push(p)

  function openProject(p) {
    setScope({ orgId: p.orgId, cmProjectId: p.id })
    navigate('/app/m6')
  }

  const levelLabel = level === 'project' ? t('cmProject') : level === 'group' ? t('group') : t('organization')

  return (
    <div>
      <PageHeader
        title={t('navPortfolio')}
        description={t('appTagline')}
        actions={<LevelSelector levels={levels} value={level} onChange={setLevelPref} />}
      />
      <p className="text-xs text-ink/40 -mt-4 mb-4">{t('viewingAtLevel')}: {levelLabel}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label={t('activeInitiatives')} value={projects.length} />
        <StatCard label={t('avgReadiness')} value={`${avgReadiness}%`} tone={avgReadiness < 50 ? 'red' : avgReadiness < 70 ? 'amber' : 'brand'} />
        <StatCard label={t('openRisks')} value={openRisks} tone={openRisks > 5 ? 'red' : 'amber'} />
        <StatCard label={t('peopleInScope')} value={totalPeople.toLocaleString()} />
      </div>

      <div className="card p-4 mb-6">
        <h2 className="font-semibold text-brand-950 mb-3">{t('portfolioByPhase')}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {['unfreeze', 'change', 'refreeze'].map((phase) => (
            <div key={phase} className="rounded-xl border border-brand-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge tone={phase === 'unfreeze' ? 'red' : phase === 'change' ? 'amber' : 'green'}>{t(`lewin_${phase}`)}</Badge>
                <span className="text-xs text-ink/40">{byPhase[phase].length}</span>
              </div>
              <div className="space-y-1">
                {byPhase[phase].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openProject(p)}
                    className="w-full text-start text-sm px-2 py-1.5 rounded-lg hover:bg-brand-50 text-brand-900"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-4 py-2.5">{t('cmProject')}</th>
              <th className="text-start px-4 py-2.5">{t('organization')}</th>
              <th className="text-start px-4 py-2.5">{t('readinessIndex')}</th>
              <th className="text-start px-4 py-2.5">{t('bridges')}</th>
              <th className="text-start px-4 py-2.5">{t('lewin')}</th>
              <th className="text-start px-4 py-2.5">{t('m14_title')}</th>
              <th className="text-start px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const ri = readinessIndex(p)
              const projOrg = data.organizations.find((o) => o.id === p.orgId)
              const stalled = stalledBlocks(p)
              const divergence = hasDivergence(p)
              return (
                <tr key={p.id} className="border-t border-brand-50 hover:bg-brand-50/40">
                  <td className="px-4 py-2.5 font-medium text-brand-950">{p.name}</td>
                  <td className="px-4 py-2.5 text-ink/60">{projOrg?.name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-semibold ${ri < 50 ? 'text-red-600' : ri < 70 ? 'text-amber-600' : 'text-brand-700'}`}>{ri}%</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge>{t(`bridges_${p.bridgesPhase}`)}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone="sand">{t(`lewin_${p.lewinPhase}`)}</Badge>
                  </td>
                  <td className="px-4 py-2.5 space-x-1 rtl:space-x-reverse">
                    {stalled.length > 0 && <Badge tone="amber">{stalled.length} {t('escalated')}</Badge>}
                    {divergence && <Badge tone="red">{t('divergenceAlert')}</Badge>}
                    {p.risks.some((r) => r.status === 'open' && r.likelihood * r.impact >= 16) && <Badge tone="red">{t('openRisks')}</Badge>}
                  </td>
                  <td className="px-4 py-2.5">
                    <button className="btn-ghost text-xs" onClick={() => openProject(p)}>
                      {t('back')} →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
