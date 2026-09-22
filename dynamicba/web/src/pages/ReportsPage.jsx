import React from 'react'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'
import { REPORTS_CATALOGUE, KPIS } from '../lib/catalogue'
import { useApp } from '../contexts/AppContext'
import { useArtifacts } from '../hooks/useArtifacts'

export default function ReportsPage() {
  const { orgId, activeClientId, activeProjectId } = useApp()
  const haveProject = !!(orgId && activeClientId && activeProjectId)
  const { records: sows } = useArtifacts(orgId, activeClientId, activeProjectId, 'OC-01')
  const { records: candidates } = useArtifacts(orgId, activeClientId, activeProjectId, 'OC-15')
  const { records: traceLinks } = useArtifacts(orgId, activeClientId, activeProjectId, 'OC-28')
  const { records: signOffs } = useArtifacts(orgId, activeClientId, activeProjectId, 'OC-32')

  const liveValues = haveProject ? {
    'KPI-02': sows[0]?.Completeness_Score ?? '—',
    'KPI-05': candidates.length ? `${Math.round((candidates.filter((c) => c.Feasibility_Score >= 80).length / candidates.length) * 100)}%` : '—',
    'KPI-08': traceLinks.length ? `${Math.round(traceLinks.reduce((s, t) => s + (t.Coverage_Percent || 0), 0) / traceLinks.length)}%` : '—',
    'KPI-09': signOffs[0]?.Status === 'Signed' ? '100%' : '0%',
  } : {}

  function exportKpiSummary() {
    const rows = KPIS.map((k) => ({ KPI_ID: k.id, Name: k.name, Type: k.type, Target: k.target, Live_Value: liveValues[k.id] ?? '' }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'KPI Summary')
    XLSX.writeFile(wb, 'DynamicBA_KPI_Summary.xlsx')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-1">Cockpits</div>
          <h1 className="h-page">Reports &amp; Cockpits</h1>
          <p className="text-sm text-grey-ink mt-1 italic">D08 reporting cockpits. {haveProject ? 'Live values shown are computed from the selected project.' : 'Select a project in the top bar to see live KPI values.'}</p>
        </div>
        <button className="btn-secondary" onClick={exportKpiSummary}>
          <Download size={15} strokeWidth={2} aria-hidden="true" /> Export KPI Summary (Excel)
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {REPORTS_CATALOGUE.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="h-card">{r.id} — {r.name}</div>
            <div className="text-xs text-grey-medium mb-2">Audience: {r.audience} · Refresh: {r.cadence}</div>
            <ul className="text-sm text-grey-ink list-disc pl-4 space-y-1">
              {r.fields.map((f) => (
                <li key={f}>{f}{liveValues[f] !== undefined && <span className="ml-2 badge badge-good">{liveValues[f]}</span>}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
