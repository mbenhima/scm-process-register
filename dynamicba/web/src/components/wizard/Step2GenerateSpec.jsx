import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useArtifacts } from '../../hooks/useArtifacts'
import { useAlerts } from '../../hooks/useAlerts'
import { applyFindings } from '../../lib/applyFindings'
import { OBJECT_CLASSES } from '../../lib/schema'
import {
  computeContextCompleteness, evaluateContextModel, evaluateAsIsMap, evaluateBaseline,
  computeFeasibilityScore, computeRoiModel, evaluateCandidate, evaluateExceptionFlow,
  evaluateControlSpec, evaluateBusinessRuleSpec, evaluateKpiSpec,
} from '../../lib/ruleEngine'
import QuickList from './QuickList'

const SUBTABS = [
  { key: 'context', label: 'MP-02 Context Enrichment', module: 'MOD-02' },
  { key: 'current', label: 'MP-03 Current-State Analysis', module: 'MOD-03' },
  { key: 'opportunity', label: 'MP-04 Opportunity Assessment', module: 'MOD-04' },
  { key: 'tobe', label: 'MP-05 To-Be Design', module: 'MOD-05' },
  { key: 'specs', label: 'MP-06 Specs Generation', module: 'MOD-06' },
]

const CLASS_NAMES = OBJECT_CLASSES.map((c) => c.name)

export default function Step2GenerateSpec({ project, onAdvance }) {
  const { orgId, activeClientId, licenceProvider } = useApp()
  const [sub, setSub] = useState('context')
  const args = { orgId, clientId: activeClientId, projectId: project.id }
  const { raiseAlert } = useAlerts(orgId, activeClientId, project.id)

  const { records: candidates } = useArtifacts(orgId, activeClientId, project.id, 'OC-15')
  const canContinue = candidates.length > 0

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {SUBTABS.map((t) => (
          <button key={t.key} onClick={() => setSub(t.key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${sub === t.key ? 'bg-orange text-white border-orange' : 'bg-white text-grey-ink border-grey-line'} ${!licenceProvider.hasModule(t.module) ? 'opacity-50' : ''}`}>
            {t.label} {!licenceProvider.hasModule(t.module) && '🔒'}
          </button>
        ))}
      </div>

      {sub === 'context' && <ContextSection args={args} raiseAlert={raiseAlert} />}
      {sub === 'current' && <CurrentStateSection args={args} raiseAlert={raiseAlert} />}
      {sub === 'opportunity' && <OpportunitySection args={args} raiseAlert={raiseAlert} />}
      {sub === 'tobe' && <ToBeSection args={args} raiseAlert={raiseAlert} />}
      {sub === 'specs' && <SpecsSection args={args} raiseAlert={raiseAlert} />}

      <div className="mt-6 card p-4 flex items-center justify-between">
        <p className="text-sm text-grey-ink">{canContinue ? `${candidates.length} automation candidate(s) captured.` : 'Add at least one Automation Candidate (Opportunity Assessment tab) before continuing.'}</p>
        <button className="btn-primary" disabled={!canContinue} onClick={onAdvance}>Continue to Step 3 →</button>
      </div>
    </div>
  )
}

function ContextSection({ args, raiseAlert }) {
  const { records: stakeholders } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-05')
  const { records: contextModels, addRecord: addContext, updateRecord: updateContext } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-08')
  const [systemsCount, setSystemsCount] = useState(0)
  const [processesCount, setProcessesCount] = useState(0)
  const cm = contextModels[0]

  async function save() {
    const completeness = computeContextCompleteness({ stakeholders, systemsCount: Number(systemsCount), processesCount: Number(processesCount) })
    const payload = { Context_Model_ID: cm?.Context_Model_ID || `CTX-${Date.now()}`, Completeness_Score: completeness, Approved_Date: completeness >= 70 ? new Date().toISOString().slice(0, 10) : '' }
    if (cm) await updateContext(cm.id, payload)
    else await addContext(payload)
    await applyFindings(raiseAlert, evaluateContextModel({ completeness }), 'MP-02.6')
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card p-4 space-y-2">
        <h3 className="font-semibold text-grey-dark">Context Knowledge Model (OC-08)</h3>
        <label className="label">Systems identified in the landscape</label>
        <input className="input" type="number" value={systemsCount} onChange={(e) => setSystemsCount(e.target.value)} />
        <label className="label">Processes identified</label>
        <input className="input" type="number" value={processesCount} onChange={(e) => setProcessesCount(e.target.value)} />
        <button className="btn-primary" onClick={save}>Build Context Knowledge Model</button>
        {cm && <p className="text-sm text-grey-ink">Completeness score: <strong>{cm.Completeness_Score}</strong>/100 (CTRL threshold 70)</p>}
      </div>
      <QuickList {...args} objectClassId="OC-09" title="System Landscape (OC-09)" fields={[{ name: 'System_Landscape_ID', label: 'System name / ID', type: 'text' }]} />
    </div>
  )
}

function CurrentStateSection({ args, raiseAlert }) {
  const [transcriptStepCount, setTranscriptStepCount] = useState(0)
  const [mapStepCount, setMapStepCount] = useState(0)
  const [cycleTimeHours, setCycleTimeHours] = useState(0)
  const [benchmarkHours, setBenchmarkHours] = useState(0)
  const { records: maps, addRecord: addMap, updateRecord: updateMap } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-11')
  const map = maps[0]

  async function validate() {
    const findings = evaluateAsIsMap({ transcriptStepCount: Number(transcriptStepCount), mapStepCount: Number(mapStepCount) })
    const payload = { As_Is_Process_Map_ID: map?.As_Is_Process_Map_ID || `AISM-${Date.now()}`, Version: '1.0', Validated: findings.length === 0 }
    if (map) await updateMap(map.id, payload)
    else await addMap(payload)
    await applyFindings(raiseAlert, findings, 'MP-03.5')
    await applyFindings(raiseAlert, evaluateBaseline({ cycleTimeHours: Number(cycleTimeHours), benchmarkHours: Number(benchmarkHours) }), 'MP-03.8')
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card p-4 space-y-2">
        <h3 className="font-semibold text-grey-dark">As-Is Process Map Validation (OC-11)</h3>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Transcript step count</label><input className="input" type="number" value={transcriptStepCount} onChange={(e) => setTranscriptStepCount(e.target.value)} /></div>
          <div><label className="label">Drafted map step count</label><input className="input" type="number" value={mapStepCount} onChange={(e) => setMapStepCount(e.target.value)} /></div>
          <div><label className="label">Baseline cycle time (h)</label><input className="input" type="number" value={cycleTimeHours} onChange={(e) => setCycleTimeHours(e.target.value)} /></div>
          <div><label className="label">Industry benchmark (h)</label><input className="input" type="number" value={benchmarkHours} onChange={(e) => setBenchmarkHours(e.target.value)} /></div>
        </div>
        <button className="btn-primary" onClick={validate}>Validate Map Against Transcript</button>
        {map && <p className="text-sm">Status: {map.Validated ? <span className="badge badge-good">Validated</span> : <span className="badge badge-medium">Needs review (CTRL-05)</span>}</p>}
      </div>
      <div className="space-y-4">
        <QuickList {...args} objectClassId="OC-13" title="Pain Points (OC-13)" fields={[{ name: 'Description', label: 'Description', type: 'text' }, { name: 'Severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }]} />
        <QuickList {...args} objectClassId="OC-14" title="Baseline Metrics (OC-14)" fields={[{ name: 'Metric_Name', label: 'Metric name', type: 'text' }, { name: 'Value', label: 'Value', type: 'number' }, { name: 'Unit', label: 'Unit', type: 'text' }]} />
      </div>
    </div>
  )
}

function OpportunitySection({ args, raiseAlert }) {
  const { records: candidates, addRecord, deleteRecord } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-15')
  const { addRecord: addRoi } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-17')
  const { addRecord: addFeasibility } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-16')
  const [form, setForm] = useState({ name: '', technical: 70, dataQuality: 70, processStability: 70, strategicFit: 70, annualBenefitUsd: 50000, oneTimeCostUsd: 30000, dataAvailability: 'Medium' })

  async function addCandidate(e) {
    e.preventDefault()
    const feasibilityScore = computeFeasibilityScore(form)
    const roi = computeRoiModel(form)
    const candidateId = `CAND-${Date.now()}`
    await addRecord({ Automation_Candidate_ID: candidateId, Name: form.name, Feasibility_Score: feasibilityScore })
    await addFeasibility({ Feasibility_Assessment_ID: `FA-${candidateId}`, Data_Availability_Rating: form.dataAvailability })
    await addRoi({ ROI_Model_ID: `ROI-${candidateId}`, Payback_Months: roi.paybackMonths, NPV: roi.npv })
    await applyFindings(raiseAlert, evaluateCandidate({ feasibilityScore, paybackMonths: roi.paybackMonths }), 'MP-04.5')
    setForm({ ...form, name: '' })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <form onSubmit={addCandidate} className="card p-4 space-y-2">
        <h3 className="font-semibold text-grey-dark">Automation Candidate (OC-15/16/17)</h3>
        <input className="input" placeholder="Candidate name (e.g. Invoice 3-way match)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        {['technical', 'dataQuality', 'processStability', 'strategicFit'].map((k) => (
          <div key={k}>
            <label className="label">{k.replace(/([A-Z])/g, ' $1')} (0-100): {form[k]}</label>
            <input type="range" min="0" max="100" value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} className="w-full" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Annual benefit (USD)</label><input className="input" type="number" value={form.annualBenefitUsd} onChange={(e) => setForm({ ...form, annualBenefitUsd: Number(e.target.value) })} /></div>
          <div><label className="label">One-time cost (USD)</label><input className="input" type="number" value={form.oneTimeCostUsd} onChange={(e) => setForm({ ...form, oneTimeCostUsd: Number(e.target.value) })} /></div>
        </div>
        <label className="label">Data Availability Rating</label>
        <select className="input" value={form.dataAvailability} onChange={(e) => setForm({ ...form, dataAvailability: e.target.value })}>
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
        <button className="btn-primary w-full">Score &amp; Add Candidate</button>
      </form>
      <div className="card p-4">
        <h3 className="font-semibold text-grey-dark mb-2">Prioritization Matrix</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-grey-medium"><th>Candidate</th><th>Feasibility</th><th></th></tr></thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-t border-grey-line">
                <td className="py-1.5">{c.Name}</td>
                <td><span className={`badge ${c.Feasibility_Score >= 80 ? 'badge-good' : c.Feasibility_Score >= 50 ? 'badge-medium' : 'badge-low'}`}>{c.Feasibility_Score}</span></td>
                <td className="text-right"><button className="text-red-500 text-xs" onClick={() => deleteRecord(c.id)}>Remove</button></td>
              </tr>
            ))}
            {candidates.length === 0 && <tr><td colSpan={3} className="py-3 text-grey-medium">No candidates scored yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ToBeSection({ args, raiseAlert }) {
  const { records: toBeMaps, addRecord: addToBe, updateRecord: updateToBe } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-18')
  const toBe = toBeMaps[0]

  async function markApproved() {
    const payload = { To_Be_Process_Map_ID: toBe?.To_Be_Process_Map_ID || `TBM-${Date.now()}`, Version: '1.0', Status: 'Approved' }
    if (toBe) await updateToBe(toBe.id, payload)
    else await addToBe(payload)
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-grey-dark">Future-State Process Map (OC-18)</h3>
          <p className="text-sm text-grey-ink">Status: {toBe?.Status || 'Draft'}</p>
        </div>
        <button className="btn-secondary" onClick={markApproved}>Mark Approved</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <QuickList {...args} objectClassId="OC-19" title="Use Cases (OC-19)" fields={[{ name: 'Name', label: 'Use case name', type: 'text' }, { name: 'Status', label: 'Status', type: 'select', options: ['Draft', 'Detailed', 'Approved'] }]} />
        <QuickList {...args} objectClassId="OC-21" title="Integration Points (OC-21)" fields={[{ name: 'Target_System', label: 'Target system', type: 'text' }]} />
        <ExceptionFlowSection args={args} raiseAlert={raiseAlert} />
        <ControlSpecSection args={args} raiseAlert={raiseAlert} />
        <QuickList {...args} objectClassId="OC-27" title="Risks / Opportunities (OC-27)" fields={[{ name: 'Category', label: 'Category', type: 'text' }]} />
      </div>
    </div>
  )
}

function ExceptionFlowSection({ args, raiseAlert }) {
  const { addRecord } = useArtifacts(args.orgId, args.clientId, args.projectId, 'OC-20')
  const [form, setForm] = useState({ isAiAssisted: false, handlesSensitiveData: false })
  async function onAfterAdd() {
    await applyFindings(raiseAlert, evaluateExceptionFlow(form), 'MP-05.4')
  }
  return (
    <QuickList
      {...args}
      objectClassId="OC-20"
      title="Exception Flows (OC-20)"
      fields={[
        { name: 'isAiAssisted', label: 'AI-Assisted step', type: 'boolean' },
        { name: 'handlesSensitiveData', label: 'Handles sensitive data', type: 'boolean' },
      ]}
      onAfterAdd={(record) => { setForm(record); return applyFindings(raiseAlert, evaluateExceptionFlow(record), 'MP-05.4') }}
    />
  )
}

function ControlSpecSection({ args, raiseAlert }) {
  return (
    <QuickList
      {...args}
      objectClassId="OC-23"
      title="Control Specs (OC-23)"
      fields={[
        { name: 'Type', label: 'Type', type: 'select', options: ['Preventive', 'Detective'] },
        { name: 'linkedToFinancialAction', label: 'Linked to financial action', type: 'boolean' },
      ]}
      onAfterAdd={(record) => applyFindings(raiseAlert, evaluateControlSpec({ type: record.Type, linkedToFinancialAction: record.linkedToFinancialAction }), 'MP-05.7')}
    />
  )
}

function SpecsSection({ args, raiseAlert }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <QuickList
        {...args} objectClassId="OC-22" title="Business Rule Specs (OC-22)"
        fields={[{ name: 'Status', label: 'Status', type: 'select', options: ['Draft', 'Specified', 'Approved'] }]}
        onAfterAdd={() => applyFindings(raiseAlert, evaluateBusinessRuleSpec(), 'MP-06.2')}
      />
      <KpiSpecSection args={args} raiseAlert={raiseAlert} />
      <QuickList {...args} objectClassId="OC-24" title="Alert Specs (OC-24)" fields={[{ name: 'Severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }]} />
      <QuickList {...args} objectClassId="OC-26" title="Report Specs (OC-26)" fields={[{ name: 'Refresh_Cadence', label: 'Refresh cadence', type: 'select', options: ['Real-time', 'Daily', 'Weekly', 'Monthly', 'On Completion'] }]} />
      <QuickList {...args} objectClassId="OC-28" title="Traceability Links (OC-28)" fields={[{ name: 'Coverage_Percent', label: 'Coverage %', type: 'number' }, { name: 'Source_Paragraph_Ref', label: 'Source paragraph ref', type: 'text' }]} />
    </div>
  )
}

function KpiSpecSection({ args, raiseAlert }) {
  return (
    <QuickList
      {...args} objectClassId="OC-25" title="KPI Specs (OC-25)"
      fields={[{ name: 'Target_Value', label: 'Target value', type: 'text' }, { name: 'dataSource', label: 'Data source (object class)', type: 'select', options: CLASS_NAMES }]}
      onAfterAdd={(record) => applyFindings(raiseAlert, evaluateKpiSpec({ dataSource: record.dataSource }, CLASS_NAMES), 'MP-06.7')}
    />
  )
}
