import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useArtifacts } from '../../hooks/useArtifacts'
import { useAlerts } from '../../hooks/useAlerts'
import { evaluateSignOffSla } from '../../lib/ruleEngine'
import { applyFindings } from '../../lib/applyFindings'

export default function Step3ReviewValidate({ project, patch, onAdvance }) {
  const { orgId, activeClientId, can } = useApp()
  const args = { orgId, clientId: activeClientId, projectId: project.id }
  const { raiseAlert } = useAlerts(orgId, activeClientId, project.id)

  const { records: sows } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-01')
  const { records: candidates } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-15')
  const { records: useCases } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-19')
  const { records: ruleSpecs } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-22')
  const { records: kpiSpecs } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-25')
  const { records: traceLinks } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-28')
  const { records: specPackages, addRecord: addSpecPackage } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-29')
  const { records: signOffs, addRecord: addSignOff, updateRecord: updateSignOff } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-32')

  const [sponsorName, setSponsorName] = useState('')
  const [checkedSummary, setCheckedSummary] = useState(false)

  const sow = sows[0]
  const specPackage = specPackages[0]
  const signOff = signOffs[0]
  const deliveredDate = project.packageDeliveredDate

  async function compilePackage() {
    const payload = { Spec_Package_ID: specPackage?.Spec_Package_ID || `SPKG-${Date.now()}`, Section_Count: 6 }
    await addSpecPackage(payload)
    await patch({ packageDeliveredDate: new Date().toISOString() })
  }

  async function captureSignOff() {
    const payload = { Client_SignOff_ID: signOff?.Client_SignOff_ID || `SIGN-${Date.now()}`, Status: 'Signed', Signed_Date: new Date().toISOString().slice(0, 10) }
    if (signOff) await updateSignOff(signOff.id, payload)
    else await addSignOff(payload)
    await patch({ signOffSponsor: sponsorName })
  }

  async function checkSla() {
    if (!deliveredDate) return
    const { businessDaysElapsed, findings } = evaluateSignOffSla({ packageDeliveredDate: deliveredDate })
    await applyFindings(raiseAlert, findings, 'MP-07.5')
    return businessDaysElapsed
  }

  const executiveSummary = specPackage
    ? `This engagement analyzed ${sow?.scope || 'the client\'s scope'} and identified ${candidates.length} automation candidate(s), ${useCases.length} elaborated use case(s), ${ruleSpecs.length} business rule specification(s), and ${kpiSpecs.length} KPI specification(s), with ${traceLinks.length} paragraph-level traceability link(s) recorded so far.`
    : null

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card p-4 space-y-3">
        <h3 className="h-card">MP-07.1 — Compile Full Spec Package</h3>
        <ul className="text-sm text-grey-ink list-disc pl-4">
          <li>SOW: {sow ? <span className="badge badge-good">Captured</span> : <span className="badge badge-low">Missing</span>}</li>
          <li>Automation Candidates: {candidates.length}</li>
          <li>Use Cases: {useCases.length}</li>
          <li>Business Rule Specs: {ruleSpecs.length}</li>
          <li>KPI Specs: {kpiSpecs.length}</li>
          <li>Traceability Links: {traceLinks.length} (CTRL-09 requires 100% coverage before export)</li>
        </ul>
        <button className="btn-primary" onClick={compilePackage}>Compile Package for Review</button>
      </div>

      <div className="card p-4 space-y-2">
        <h3 className="h-card">MP-07.2 — Executive Summary for Sponsor</h3>
        {executiveSummary ? <p className="text-sm text-grey-ink">{executiveSummary}</p> : <p className="text-sm text-grey-medium">Compile the package first.</p>}
      </div>

      <div className="card p-4 space-y-2">
        <h3 className="h-card">MP-07.4/07.5 — Present &amp; Obtain Sign-Off</h3>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-orange w-4 h-4" checked={checkedSummary} onChange={(e) => setCheckedSummary(e.target.checked)} /> I have presented the spec package and executive summary to the client sponsor.</label>
        <label className="label">Client Sponsor Name (typed e-signature)</label>
        <input className="input" value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} placeholder="Type full name to sign" disabled={!can('signoff.approve')} />
        <button className="btn-primary" disabled={!checkedSummary || !sponsorName || !can('signoff.approve')} onClick={captureSignOff}>Capture Client Sign-Off</button>
        {signOff?.Status === 'Signed' && <p className="text-sm text-success">Signed by {project.signOffSponsor} on {signOff.Signed_Date}.</p>}
      </div>

      <div className="card p-4 space-y-2">
        <h3 className="h-card">MP-07.6 — SLA &amp; Money-Back Guarantee Window</h3>
        <p className="text-xs text-grey-medium">CTRL-10 monitors a 5-business-day SLA from package delivery to sign-off (rule BR-13).</p>
        <button className="btn-secondary" onClick={async () => { const d = await checkSla(); if (d != null) alert(`${d} business day(s) elapsed since delivery.`) }} disabled={!deliveredDate}>Check SLA Now</button>
      </div>

      <div className="col-span-2 card p-4 flex items-center justify-between">
        <p className="text-sm text-grey-ink">{signOff?.Status === 'Signed' ? 'Client sign-off captured — ready for export.' : 'Client sign-off required before Export & Handoff.'}</p>
        <button className="btn-primary" disabled={signOff?.Status !== 'Signed'} onClick={onAdvance}>Continue to Step 4 <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" /></button>
      </div>
    </div>
  )
}
