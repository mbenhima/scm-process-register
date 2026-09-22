import React, { useEffect, useState } from 'react'
import { ArrowRight, Users } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useArtifacts } from '../../hooks/useArtifacts'
import { useAlerts } from '../../hooks/useAlerts'
import { evaluateSowIntake, evaluateStakeholders, generateClarifyingQuestions } from '../../lib/ruleEngine'
import { applyFindings } from '../../lib/applyFindings'
import IconBadge from '../IconBadge'

const FIELDS = [
  { key: 'objectives', label: 'Objectives' },
  { key: 'scope', label: 'Scope' },
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'constraints', label: 'Constraints' },
]

export default function Step1UploadSOW({ project, onAdvance }) {
  const { orgId, activeClientId, can, licenceProvider } = useApp()
  const { records: sows, addRecord: addSow, updateRecord: updateSow } = useArtifacts(orgId, activeClientId, project.id, 'OC-01')
  const { records: stakeholders, addRecord: addStakeholder, deleteRecord: deleteStakeholder } = useArtifacts(orgId, activeClientId, project.id, 'OC-05')
  const { raiseAlert } = useAlerts(orgId, activeClientId, project.id)

  const sow = sows[0]
  const [form, setForm] = useState({ objectives: '', scope: '', deliverables: '', timeline: '', constraints: '', signedDate: '' })
  const [newStakeholder, setNewStakeholder] = useState({ Name: '', Role: '', Influence_Level: 'Medium' })
  const [result, setResult] = useState(null)
  const canWrite = can('project.write')
  const moduleAllowed = licenceProvider.hasModule('MOD-01')

  useEffect(() => {
    if (sow) setForm({ objectives: sow.objectives || '', scope: sow.scope || '', deliverables: sow.deliverables || '', timeline: sow.timeline || '', constraints: sow.constraints || '', signedDate: sow.Signed_Date || '' })
  }, [sow?.id])

  async function runPreflight() {
    const stakeholdersText = stakeholders.map((s) => `${s.Name} ${s.Role}`).join(' ')
    const { completeness, findings } = evaluateSowIntake({ ...form, stakeholdersText })
    const stakeholderFindings = evaluateStakeholders(stakeholders)
    const allFindings = [...findings, ...stakeholderFindings]
    const questions = completeness < 70 ? generateClarifyingQuestions({ ...form, stakeholdersText }) : []

    const payload = {
      SOW_ID: sow?.SOW_ID || `SOW-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-3)}`,
      Status: completeness >= 70 ? 'Quality-Checked' : 'Ingested',
      Completeness_Score: completeness,
      Signed_Date: form.signedDate || new Date().toISOString().slice(0, 10),
      ...form,
    }
    if (sow) await updateSow(sow.id, payload)
    else await addSow(payload)

    await applyFindings(raiseAlert, allFindings, 'MP-01.5')
    setResult({ completeness, questions })
  }

  async function handleAddStakeholder(e) {
    e.preventDefault()
    await addStakeholder({
      Stakeholder_ID: `STK-${Date.now()}`,
      Name: newStakeholder.Name,
      Role: newStakeholder.Role,
      Influence_Level: newStakeholder.Influence_Level,
    })
    setNewStakeholder({ Name: '', Role: '', Influence_Level: 'Medium' })
  }

  const completeness = result?.completeness ?? sow?.Completeness_Score ?? 0

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        {!moduleAllowed && (
          <div className="card-highlight p-3 text-sm text-orange-deep">Your current plan does not include the SOW Ingestion Module. Ask your admin to check Admin → Licensing.</div>
        )}
        <div className="card p-4 space-y-3">
          <h2 className="h-card">MP-01 — SOW Ingestion &amp; Understanding</h2>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <textarea className="input" rows={2} disabled={!canWrite} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={`Describe the ${f.label.toLowerCase()}…`} />
            </div>
          ))}
          <div>
            <label className="label">Signed Date</label>
            <input className="input" type="date" disabled={!canWrite} value={form.signedDate} onChange={(e) => setForm({ ...form, signedDate: e.target.value })} />
          </div>
          <button className="btn-primary" disabled={!canWrite} onClick={runPreflight}>Run Pre-Flight Quality Check</button>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <IconBadge icon={Users} tone="ink" size={28} />
            <h3 className="h-card">Stakeholders (OC-05)</h3>
          </div>
          {canWrite && (
            <form onSubmit={handleAddStakeholder} className="flex gap-2 mb-3">
              <input className="input" placeholder="Name" value={newStakeholder.Name} onChange={(e) => setNewStakeholder({ ...newStakeholder, Name: e.target.value })} required />
              <input className="input" placeholder="Role (e.g. Client Sponsor, Process Owner)" value={newStakeholder.Role} onChange={(e) => setNewStakeholder({ ...newStakeholder, Role: e.target.value })} required />
              <select className="input" value={newStakeholder.Influence_Level} onChange={(e) => setNewStakeholder({ ...newStakeholder, Influence_Level: e.target.value })}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
              <button className="btn-secondary whitespace-nowrap">Add</button>
            </form>
          )}
          <ul className="text-sm divide-y divide-grey-line">
            {stakeholders.map((s) => (
              <li key={s.id} className="py-2 flex justify-between items-center">
                <span className="text-grey-dark">{s.Name} — <span className="text-grey-medium">{s.Role}</span></span>
                <span className="flex items-center gap-3">
                  <span className="badge badge-medium">{s.Influence_Level}</span>
                  {canWrite && <button className="btn-danger-text" onClick={() => deleteStakeholder(s.id)}>Remove</button>}
                </span>
              </li>
            ))}
            {stakeholders.length === 0 && <li className="py-2 text-grey-medium">No stakeholders identified yet — add the client sponsor and at least one process owner.</li>}
          </ul>
        </div>
      </div>

      <div className="col-span-1">
        <div className="card p-4 sticky top-0">
          <h3 className="h-card mb-2">SOW Completeness Score</h3>
          <div className="kpi-number text-3xl">{completeness}<span className="text-base font-sans font-normal text-grey-medium">/100</span></div>
          <div className="w-full bg-grey-light rounded-full h-2 mt-2">
            <div className="bg-orange h-2 rounded-full transition-all duration-300" style={{ width: `${completeness}%` }} />
          </div>
          {result?.questions?.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-grey-dark mb-1">Clarifying Questions (BR-02)</div>
              <ul className="text-xs text-grey-ink list-disc pl-4 space-y-1">
                {result.questions.map((q, i) => <li key={i}>{q.question}</li>)}
              </ul>
            </div>
          )}
          <button className="btn-primary w-full mt-4" disabled={completeness < 70} onClick={onAdvance}>
            Continue to Step 2 <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </button>
          {completeness < 70 && <p className="text-xs text-grey-medium mt-2">Completeness must reach 70 (CTRL-01 gate) before context enrichment can start.</p>}
        </div>
      </div>
    </div>
  )
}
