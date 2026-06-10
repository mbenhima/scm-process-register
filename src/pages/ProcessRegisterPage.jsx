// src/pages/ProcessRegisterPage.jsx
import React, { useState, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useProcesses } from '../hooks/useProcesses'
import ProcessEditModal from '../components/ProcessEditModal'

const MODE_COLORS = {
  'AI Autonomous': 'bg-purple-100 text-purple-800',
  'AI Augmented': 'bg-blue-100 text-blue-800',
  'RPA': 'bg-green-100 text-green-800',
  'Workflow': 'bg-amber-100 text-amber-800',
  'Human Mandatory': 'bg-red-100 text-red-800',
}

const WAVE_COLORS = {
  'Wave 1': 'bg-emerald-100 text-emerald-800',
  'Wave 2': 'bg-blue-100 text-blue-800',
  'Wave 3': 'bg-gray-100 text-gray-600',
}

const CRIT_COLORS = {
  'Critical': 'bg-red-100 text-red-700',
  'High': 'bg-orange-100 text-orange-700',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'Low': 'bg-gray-100 text-gray-600',
}

function ScoreBar({ value }) {
  const pct = Math.min(100, Math.round(value || 0))
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-16">
        <div className={`h-1.5 ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-7 text-right">{pct}</span>
    </div>
  )
}

export default function ProcessRegisterPage() {
  const { activeScenario, activeCompany } = useApp()
  const { user } = useAuth()
  const { t } = useLang()
  const { processes, loading } = useProcesses(activeScenario?.id, user?.uid)
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [editProcess, setEditProcess] = useState(null)

  const filtered = useMemo(() => {
    return processes.filter(p => {
      const matchSearch =
        !search ||
        p.macroId?.toLowerCase().includes(search.toLowerCase()) ||
        p.macroName?.toLowerCase().includes(search.toLowerCase()) ||
        p.capabilityCluster?.toLowerCase().includes(search.toLowerCase())
      const matchScope =
        scopeFilter === 'all' ||
        (scopeFilter === 'inscope' && p.inScope) ||
        (scopeFilter === 'outofscope' && !p.inScope)
      return matchSearch && matchScope
    })
  }, [processes, search, scopeFilter])

  const handleExport = () => {
    const data = {
      scenario: activeScenario,
      company: activeCompany,
      exportedAt: new Date().toISOString(),
      processes: processes.map(p => ({
        ...p,
        bpmnScore: p.bpmnScore,
        bpmnReady: p.bpmnReady,
        humanScore: p.humanScore,
        workflowScore: p.workflowScore,
        rpaScore: p.rpaScore,
        aiScore: p.aiScore,
        executionMode: p.executionMode,
        roi: p.roi,
        voiScore: p.voiScore,
        priorityScore: p.priorityScore,
        rank: p.rank,
        wave: p.wave,
        heatmapQuadrant: p.heatmapQuadrant,
      }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeScenario?.scenarioName || 'scenario'}_processes.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!activeScenario) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
        <span className="text-5xl">📊</span>
        <p className="text-lg font-medium">{t('selectScenario')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('processRegister')}</h1>
          <p className="text-gray-500 text-sm">
            {activeCompany?.companyName} — {activeScenario?.scenarioName} · {filtered.length} processes
          </p>
        </div>
        <button onClick={handleExport} className="btn-secondary text-sm">⬇ {t('export')}</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('search') + '…'}
          className="input-field max-w-xs"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: t('allProcesses') },
            { key: 'inscope', label: t('inScopeOnly') },
            { key: 'outofscope', label: t('outOfScope') },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setScopeFilter(opt.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                scopeFilter === opt.key ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 py-8">{t('loading')}</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    t('rank'), t('macroId'), t('name_col'), t('parentCycle'), t('cluster'),
                    t('criticality'), t('sla'), t('scope'), t('bpmnScore'),
                    t('executionMode'), t('roiPct'), t('wave'), t('actions')
                  ].map(col => (
                    <th key={col} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-gray-400">{t('noData')}</td>
                  </tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.inScope ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-brand-600 text-white text-xs rounded-full font-bold">
                        {p.rank || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-brand-700 whitespace-nowrap">{p.macroId}</td>
                    <td className="px-3 py-3 max-w-[180px]">
                      <div className="font-medium text-gray-900 truncate" title={p.macroName}>{p.macroName}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{p.Parent_Cycle || p.parentCycle || '—'}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap max-w-[120px]">
                      <span className="truncate block" title={p.capabilityCluster}>{p.capabilityCluster}</span>
                    </td>
                    <td className="px-3 py-3">
                      {p.Process_Criticality ? (
                        <span className={`badge ${CRIT_COLORS[p.Process_Criticality] || 'bg-gray-100 text-gray-600'}`}>
                          {p.Process_Criticality}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{p.SLA || '—'}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block w-4 h-4 rounded-full ${p.inScope ? 'bg-emerald-400' : 'bg-gray-200'}`} title={p.inScope ? 'In Scope' : 'Out of Scope'} />
                    </td>
                    <td className="px-3 py-3 min-w-[100px]">
                      <ScoreBar value={p.bpmnScore} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`badge ${MODE_COLORS[p.executionMode] || 'bg-gray-100 text-gray-600'}`}>
                        {p.executionMode || 'Workflow'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap font-medium">
                      {p.roi !== null && p.roi !== undefined ? `${Math.round(p.roi)}%` : '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`badge ${WAVE_COLORS[p.wave] || 'bg-gray-100 text-gray-600'}`}>
                        {p.wave || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setEditProcess(p)}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        {t('edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editProcess && (
        <ProcessEditModal
          process={editProcess}
          onClose={() => setEditProcess(null)}
          onSaved={() => setEditProcess(null)}
        />
      )}
    </div>
  )
}
