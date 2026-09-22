import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useArtifacts } from '../../hooks/useArtifacts'
import { useAlerts } from '../../hooks/useAlerts'
import { evaluateExportFormat } from '../../lib/ruleEngine'
import { applyFindings } from '../../lib/applyFindings'
import { exportHandoffPackageDocx, exportHandoffPackageXlsx, exportHandoffPackagePdf, exportHandoffPackageJson } from '../../lib/exporters'
import QuickList from './QuickList'

export default function Step4ExportHandoff({ project, patch, onComplete }) {
  const { orgId, activeClientId } = useApp()
  const args = { orgId, clientId: activeClientId, projectId: project.id }
  const { raiseAlert } = useAlerts(orgId, activeClientId, project.id)

  const { records: sows } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-01')
  const { records: candidates } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-15')
  const { records: useCases } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-19')
  const { records: ruleSpecs } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-22')
  const { records: kpiSpecs } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-25')
  const { records: backlogItems } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-31')
  const { records: signOffs } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-32')
  const { addRecord: addHandoff } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-30')

  const [format, setFormat] = useState('Word')
  const [hoursSaved, setHoursSaved] = useState(58)

  const bundle = { sow: sows[0], candidates, useCases, ruleSpecs, kpiSpecs, backlogItems, signOff: signOffs[0] }

  async function doExport() {
    const findings = evaluateExportFormat(format)
    await applyFindings(raiseAlert, findings, 'MP-07.7')
    const effectiveFormat = findings.length ? 'JSON' : format
    if (effectiveFormat === 'Word') await exportHandoffPackageDocx(project, bundle)
    else if (effectiveFormat === 'Excel') exportHandoffPackageXlsx(project, bundle)
    else if (effectiveFormat === 'PDF') exportHandoffPackagePdf(project, bundle)
    else exportHandoffPackageJson(project, bundle)
    const docFormat = effectiveFormat === 'Word' || effectiveFormat === 'Excel' ? effectiveFormat : 'Jira'
    await addHandoff({ Handoff_Package_ID: `HP-${Date.now()}`, Delivered_Date: new Date().toISOString().slice(0, 10), Format: docFormat })
  }

  function finish() {
    onComplete()
    patch({ hoursSaved })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-grey-dark">MP-07.7 — Export Package</h3>
        <p className="text-xs text-grey-medium">Word and Excel export natively in-browser. Visio, Jira and Azure DevOps targets route to the manual export fallback (rule BR-14) — use the JSON export to import into those tools.</p>
        <select className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
          <option>Word</option><option>Excel</option><option>PDF</option><option>JSON</option><option>Visio</option><option>Jira</option><option>Azure DevOps</option>
        </select>
        <button className="btn-primary" onClick={doExport}>Export Handoff Package</button>
      </div>

      <QuickList {...args} objectClassId="OC-31" title="MP-07.8 — Development Backlog (OC-31)" fields={[{ name: 'Development_Backlog_Item_ID', label: 'Backlog item', type: 'text' }, { name: 'Priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] }]} />

      <div className="col-span-2 card p-4 space-y-2">
        <h3 className="font-semibold text-grey-dark">MP-07.9 — Handoff Readiness &amp; Time Savings Report</h3>
        <label className="label">Consultant hours saved on this engagement (KPI-10, target ≥ 58h)</label>
        <input className="input w-40" type="number" value={hoursSaved} onChange={(e) => setHoursSaved(Number(e.target.value))} />
        <div className="flex items-center gap-4 mt-2">
          <span className={`badge ${hoursSaved >= 58 ? 'badge-good' : 'badge-medium'}`}>{hoursSaved}h saved</span>
          <button className="btn-primary" onClick={finish}>Mark Engagement Complete</button>
        </div>
        {project.status === 'completed' && <p className="text-sm text-green-700">This engagement is complete. Its full spec package remains available under Project Artifacts.</p>}
      </div>
    </div>
  )
}
