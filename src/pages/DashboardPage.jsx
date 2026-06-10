// src/pages/DashboardPage.jsx
import React, { useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useProcesses } from '../hooks/useProcesses'

const MODE_COLORS = {
  'AI Autonomous': 'bg-purple-100 text-purple-800',
  'AI Augmented': 'bg-blue-100 text-blue-800',
  'RPA': 'bg-green-100 text-green-800',
  'Workflow': 'bg-amber-100 text-amber-800',
  'Human Mandatory': 'bg-red-100 text-red-800',
}

const QUADRANT_COLORS = {
  'Quick Win': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', num: 'text-emerald-600' },
  'High ROI': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', num: 'text-blue-600' },
  'High VOI': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', num: 'text-purple-600' },
  'Strategic': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', num: 'text-amber-600' },
}

function StatCard({ label, value, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <div className={`card p-5 border ${colorMap[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1 opacity-75">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { activeScenario, activeCompany } = useApp()
  const { user } = useAuth()
  const { t } = useLang()
  const { processes, loading } = useProcesses(activeScenario?.id, user?.uid)

  const stats = useMemo(() => {
    if (!processes.length) return null
    const inScope = processes.filter(p => p.inScope)
    const bpmnReady = inScope.filter(p => p.bpmnReady === 'Yes')
    const wave1 = inScope.filter(p => p.wave === 'Wave 1')

    const modeCounts = {}
    inScope.forEach(p => {
      modeCounts[p.executionMode] = (modeCounts[p.executionMode] || 0) + 1
    })

    const quadrantCounts = {}
    inScope.forEach(p => {
      quadrantCounts[p.heatmapQuadrant] = (quadrantCounts[p.heatmapQuadrant] || 0) + 1
    })

    const top10 = [...inScope]
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 10)

    return { total: processes.length, inScope: inScope.length, bpmnReady: bpmnReady.length, wave1: wave1.length, modeCounts, quadrantCounts, top10 }
  }, [processes])

  if (!activeScenario) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
        <span className="text-5xl">📋</span>
        <p className="text-lg font-medium">{t('selectScenario')}</p>
      </div>
    )
  }

  if (loading) return <div className="text-gray-400 p-8">{t('loading')}</div>

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {activeCompany?.companyName} — {activeScenario?.scenarioName}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('totalProcesses')} value={stats?.total ?? 0} color="brand" />
        <StatCard label={t('inScope')} value={stats?.inScope ?? 0} color="green" />
        <StatCard label={t('bpmnReady')} value={stats?.bpmnReady ?? 0} color="purple" />
        <StatCard label={t('wave1Count')} value={stats?.wave1 ?? 0} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">{t('heatmap')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {['Quick Win', 'High ROI', 'High VOI', 'Strategic'].map(q => {
              const c = QUADRANT_COLORS[q]
              const count = stats?.quadrantCounts?.[q] || 0
              return (
                <div key={q} className={`${c.bg} ${c.border} border rounded-xl p-4`}>
                  <div className={`text-2xl font-bold ${c.num}`}>{count}</div>
                  <div className={`text-xs font-medium ${c.text} mt-1`}>{t(q.toLowerCase().replace(' ', '') === 'quickwin' ? 'quickWin' : q.toLowerCase().replace(' ', '') === 'highroi' ? 'highROI' : q.toLowerCase().replace(' ', '') === 'highvoi' ? 'highVOI' : 'strategic')}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 text-xs text-gray-400 text-center">ROI% vs VOI Score matrix</div>
        </div>

        {/* Execution Mode Distribution */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">{t('executionModes')}</h2>
          {stats?.modeCounts && Object.keys(stats.modeCounts).length > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(stats.modeCounts).sort((a, b) => b[1] - a[1]).map(([mode, count]) => {
                const pct = Math.round((count / (stats.inScope || 1)) * 100)
                return (
                  <div key={mode}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`badge ${MODE_COLORS[mode] || 'bg-gray-100 text-gray-700'}`}>{mode}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-1.5 bg-brand-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No in-scope processes yet.</p>
          )}
        </div>
      </div>

      {/* Wave 1 Pipeline */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">{t('wave1Pipeline')}</h2>
        {stats?.top10?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('rank')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('macroId')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('name_col')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('executionMode')}</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">{t('roiPct')}</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody>
                {stats.top10.map((p, i) => (
                  <tr key={p.id || p.macroId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-brand-600 text-white text-xs rounded-full font-bold">{p.rank}</span>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-brand-700">{p.macroId}</td>
                    <td className="py-2.5 pr-3 font-medium text-gray-800 max-w-[200px] truncate">{p.macroName}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`badge ${MODE_COLORS[p.executionMode] || 'bg-gray-100 text-gray-600'}`}>{p.executionMode}</span>
                    </td>
                    <td className="py-2.5 text-right text-gray-700">
                      {p.roi !== null && p.roi !== undefined ? `${Math.round(p.roi)}%` : '—'}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-brand-600">
                      {p.priorityScore?.toFixed(1) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No in-scope processes yet. Edit processes to set them in scope.</p>
        )}
      </div>

      {/* Scenario Info */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-3">{t('scenarioInfo')}</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><dt className="text-gray-500">{t('scenarioName')}</dt><dd className="font-medium">{activeScenario.scenarioName}</dd></div>
          <div><dt className="text-gray-500">{t('companies')}</dt><dd className="font-medium">{activeCompany?.companyName}</dd></div>
          <div><dt className="text-gray-500">{t('description')}</dt><dd className="font-medium">{activeScenario.description || '—'}</dd></div>
          <div><dt className="text-gray-500">{t('createdAt')}</dt><dd className="font-medium">{activeScenario.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}</dd></div>
        </dl>
      </div>
    </div>
  )
}
