// src/components/ProcessEditModal.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useLang } from '../contexts/LanguageContext'
import { deriveAll } from '../lib/formulas'
import {
  PROCESS_TYPES, PARENT_CYCLES, START_EVENT_TYPES, END_EVENT_TYPES,
  FREQUENCIES, CRITICALITIES, ROI_METHODS, VOI_METHODS, REUSABLE_OPTIONS
} from '../lib/constants'

const TABS = ['tabBpmn', 'tabHuman', 'tabWorkflow', 'tabRpa', 'tabAi', 'tabFinancial', 'tabOther']

function SliderField({ label, name, value, min = 0, max = 4, step = 1, onChange, hint }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{value}</span>
      </div>
      {hint && <p className="text-xs text-gray-400 leading-tight">{hint}</p>}
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(name, parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600"
      />
      <div className="flex justify-between text-xs text-gray-300">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

function NumberField({ label, name, value, onChange, prefix = '', hint }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
        <input
          type="number"
          value={value || 0}
          onChange={e => onChange(name, parseFloat(e.target.value) || 0)}
          className={`input-field ${prefix ? 'pl-6' : ''}`}
          min={0}
        />
      </div>
    </div>
  )
}

function SelectField({ label, name, value, options, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <select value={value || ''} onChange={e => onChange(name, e.target.value)} className="input-field">
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextField({ label, name, value, onChange, placeholder = '' }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(name, e.target.value)}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  )
}

const MODE_COLORS = {
  'AI Autonomous': 'bg-purple-100 text-purple-800',
  'AI Augmented': 'bg-blue-100 text-blue-800',
  'RPA': 'bg-green-100 text-green-800',
  'Workflow': 'bg-amber-100 text-amber-800',
  'Human Mandatory': 'bg-red-100 text-red-800',
}

function ScoreBar({ label, value, max = 100, colorClass = 'bg-brand-500' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className={`h-1.5 ${colorClass} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ProcessEditModal({ process, onClose, onSaved }) {
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState(0)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (process) setForm({ ...process })
  }, [process])

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const derived = useMemo(() => deriveAll(form), [form])

  const handleSave = async () => {
    setSaving(true)
    try {
      const processRef = doc(db, 'processes', process.id)
      const {
        id, macroId, macroName, capabilityCluster, bpmnPool, bpmnLane,
        owningModule, sourceModule, consumingModules, triggerEvent,
        inputs, outputs, inputsProviders, beneficiaries,
        r, a, c, s, i, macroGoals,
        // derived — don't store
        bpmnScore, bpmnReady, humanScore, workflowScore, rpaScore, aiScore,
        executionMode, roi, voiScore, priorityScore, heatmapQuadrant, rank, wave,
        ...editableFields
      } = form
      await updateDoc(processRef, editableFields)
      onSaved?.()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!process) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="font-mono text-xs text-brand-600 font-medium">{process.macroId}</div>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">{process.macroName}</h2>
            <div className="text-xs text-gray-400">{process.capabilityCluster}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Form */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex gap-1 px-4 pt-3 border-b border-gray-100 overflow-x-auto flex-shrink-0">
              {TABS.map((tab, idx) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                    activeTab === idx
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t(tab)}
                </button>
              ))}
            </div>

            {/* Scope + Justification (always visible) */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-4 flex-shrink-0">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.inScope || false}
                  onChange={e => handleChange('inScope', e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                <span className="text-sm font-medium text-gray-700">{t('scope')}</span>
              </label>
              <input
                type="text"
                value={form.Justification || ''}
                onChange={e => handleChange('Justification', e.target.value)}
                placeholder={t('justification')}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Tab 0: BPMN Readiness */}
              {activeTab === 0 && (
                <div className="grid grid-cols-1 gap-5">
                  <SliderField label="Process Clarity (0–100)" name="Process_Clarity" value={form.Process_Clarity || 0} min={0} max={100} step={1} onChange={handleChange} hint="0=undocumented; 100=full BPMN-ready with sub-processes decomposed" />
                  <SliderField label="Exception Logic (0–100)" name="Exception_Logic" value={form.Exception_Logic || 0} min={0} max={100} step={1} onChange={handleChange} hint="0=no exceptions; 100=all paths with timeout/retry/SLA" />
                  <SliderField label="Data & Rule Availability (0–100)" name="Data_Rule_Availability" value={form.Data_Rule_Availability || 0} min={0} max={100} step={1} onChange={handleChange} hint="0=no data/rules; 100=all rules versioned and validated" />
                  <SliderField label="Automation Suitability (0–100)" name="Automation_Suitability" value={form.Automation_Suitability || 0} min={0} max={100} step={1} onChange={handleChange} hint="0=fully manual; 100=perfectly automatable" />
                  <SliderField label="Compliance / HITL Readiness (0–100)" name="Compliance_HITL_Readiness" value={form.Compliance_HITL_Readiness || 0} min={0} max={100} step={1} onChange={handleChange} hint="0=no controls; 100=all compliance mapped, no blockers" />
                </div>
              )}

              {/* Tab 1: Human */}
              {activeTab === 1 && (
                <div className="grid grid-cols-1 gap-5">
                  <SliderField label="Human Judgment (0–4)" name="Human_judgment" value={form.Human_judgment || 0} min={0} max={4} onChange={handleChange} hint="0=no judgment needed; 4=very high (strategic/complex)" />
                  <SliderField label="Human Ethics (0–4)" name="Human_ethics" value={form.Human_ethics || 0} min={0} max={4} onChange={handleChange} hint="0=no ethical implication; 4=critical ethical decisions" />
                  <SliderField label="Human Accountability (0–4)" name="Human_accountability" value={form.Human_accountability || 0} min={0} max={4} onChange={handleChange} hint="0=no accountability; 4=full legal/regulatory" />
                  <SliderField label="Regulatory Sign-off (0–4)" name="Human_regulatory_signoff" value={form.Human_regulatory_signoff || 0} min={0} max={4} onChange={handleChange} hint="0=no signoff required; 4=mandatory by regulated authority" />
                </div>
              )}

              {/* Tab 2: Workflow */}
              {activeTab === 2 && (
                <div className="grid grid-cols-1 gap-5">
                  <SliderField label="Approval Chain (0–4)" name="Workflow_approval_chain" value={form.Workflow_approval_chain || 0} min={0} max={4} onChange={handleChange} hint="0=no approvals; 4=multi-level cross-org" />
                  <SliderField label="SLA Strictness (0–4)" name="Workflow_SLA" value={form.Workflow_SLA || 0} min={0} max={4} onChange={handleChange} hint="0=no SLA; 4=strict SLA with automatic escalation" />
                  <SliderField label="Exception Paths (0–4)" name="Workflow_exception_paths" value={form.Workflow_exception_paths || 0} min={0} max={4} onChange={handleChange} hint="0=no exceptions; 4=many interacting with recovery" />
                  <SliderField label="Handoff Complexity (0–4)" name="Workflow_handoff_complexity" value={form.Workflow_handoff_complexity || 0} min={0} max={4} onChange={handleChange} hint="0=no handoff; 4=many across organisations" />
                  <SliderField label="Audit Checkpoint (0–4)" name="Workflow_audit_checkpoint" value={form.Workflow_audit_checkpoint || 0} min={0} max={4} onChange={handleChange} hint="0=none; 4=mandatory audit trail with hash" />
                </div>
              )}

              {/* Tab 3: RPA */}
              {activeTab === 3 && (
                <div className="grid grid-cols-1 gap-5">
                  <SliderField label="Rule-Based (0–4)" name="RPA_rule_based" value={form.RPA_rule_based || 0} min={0} max={4} onChange={handleChange} hint="0=no rules; 4=fully rule-deterministic" />
                  <SliderField label="Structured Data (0–4)" name="RPA_structured_data" value={form.RPA_structured_data || 0} min={0} max={4} onChange={handleChange} hint="0=free text; 4=fully structured DB/CSV" />
                  <SliderField label="Zero Judgment (0–4)" name="RPA_zero_judgment" value={form.RPA_zero_judgment || 0} min={0} max={4} onChange={handleChange} hint="0=judgment at every step; 4=zero judgment needed" />
                  <SliderField label="Process Stability (0–4)" name="RPA_stable" value={form.RPA_stable || 0} min={0} max={4} onChange={handleChange} hint="0=changes daily; 4=stable for years" />
                </div>
              )}

              {/* Tab 4: AI */}
              {activeTab === 4 && (
                <div className="grid grid-cols-1 gap-5">
                  <SliderField label="AI Judgment (0–4) ×3 weight" name="AI_judgment" value={form.AI_judgment || 0} min={0} max={4} onChange={handleChange} hint="0=no AI judgment; 4=advanced cognitive (NLP/vision)" />
                  <SliderField label="Unstructured Data (0–4) ×2 weight" name="AI_unstructured" value={form.AI_unstructured || 0} min={0} max={4} onChange={handleChange} hint="0=only structured; 4=fully unstructured (audio/video/text)" />
                  <SliderField label="Process Variability (0–4) ×2 weight" name="AI_variability" value={form.AI_variability || 0} min={0} max={4} onChange={handleChange} hint="0=identical each time; 4=extremely variable" />
                  <SliderField label="Training Overhead (0–4) ×1 weight" name="AI_training" value={form.AI_training || 0} min={0} max={4} onChange={handleChange} hint="0=no training needed; 4=continuous online learning" />
                  <SliderField label="Risk Inverse — AI Penalty (0–4) ×2 weight" name="AI_risk_inverse" value={form.AI_risk_inverse || 0} min={0} max={4} onChange={handleChange} hint="⚠ Higher = penalises AI Score. 0=no risk if AI fails; 4=life-critical" />
                </div>
              )}

              {/* Tab 5: Financial */}
              {activeTab === 5 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberField label="Benefit Annualized (USD)" name="Benefit_Annualized_USD" value={form.Benefit_Annualized_USD} onChange={handleChange} prefix="$" hint="Conservative annual FTE + error savings net of run costs" />
                  <NumberField label="Cost One-Time (USD)" name="Cost_OneTime_USD" value={form.Cost_OneTime_USD} onChange={handleChange} prefix="$" hint="Build cost: licences, dev, testing, training" />
                  <NumberField label="Automation Cost Estimate (USD)" name="Automation_Cost_Estimate_USD" value={form.Automation_Cost_Estimate_USD} onChange={handleChange} prefix="$" hint="Total first-year cost (build + run)" />
                  <NumberField label="Strategic Alignment Score (0–100)" name="Strategic_Alignment_Score" value={form.Strategic_Alignment_Score} onChange={handleChange} hint="0=not aligned; 100=critical enabler of top priority" />
                  <NumberField label="VOI Risk Reduction (0–100)" name="VOI_risk_reduction_score" value={form.VOI_risk_reduction_score} onChange={handleChange} hint="0=no risk reduction; 100=eliminates major risk" />
                  <NumberField label="VOI Agility (0–100)" name="VOI_agility_score" value={form.VOI_agility_score} onChange={handleChange} hint="0=reduces agility; 100=greatly improves time-to-respond" />
                  <NumberField label="VOI Brand Reputation (0–100)" name="VOI_brand_reputation_score" value={form.VOI_brand_reputation_score} onChange={handleChange} hint="0=no brand impact; 100=major trust/reputation gain" />
                  <NumberField label="VOI Employee Satisfaction (0–100)" name="VOI_employee_satisfaction_score" value={form.VOI_employee_satisfaction_score} onChange={handleChange} hint="0=lowers morale; 100=eliminates tedious tasks" />
                  <SelectField label="ROI Method" name="ROI_Method" value={form.ROI_Method} options={ROI_METHODS} onChange={handleChange} />
                  <SelectField label="VOI Method" name="VOI_Method" value={form.VOI_Method} options={VOI_METHODS} onChange={handleChange} />
                </div>
              )}

              {/* Tab 6: Other */}
              {activeTab === 6 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField label="Process Type" name="Process_Type" value={form.Process_Type} options={PROCESS_TYPES} onChange={handleChange} />
                  <SelectField label="Parent Cycle" name="Parent_Cycle" value={form.Parent_Cycle} options={PARENT_CYCLES} onChange={handleChange} />
                  <SelectField label="Start Event Type" name="Start_Event_Type" value={form.Start_Event_Type} options={START_EVENT_TYPES} onChange={handleChange} />
                  <SelectField label="End Event Type" name="End_Event_Type" value={form.End_Event_Type} options={END_EVENT_TYPES} onChange={handleChange} />
                  <SelectField label="Frequency" name="Frequency" value={form.Frequency} options={FREQUENCIES} onChange={handleChange} />
                  <SelectField label="Process Criticality" name="Process_Criticality" value={form.Process_Criticality} options={CRITICALITIES} onChange={handleChange} />
                  <SelectField label="Audit Criticality" name="Audit_Criticality" value={form.Audit_Criticality} options={CRITICALITIES} onChange={handleChange} />
                  <TextField label="SLA" name="SLA" value={form.SLA} onChange={handleChange} placeholder="e.g. 5min, 1h, 24h" />
                  <SelectField label="Reusable" name="Reusable" value={form.Reusable} options={REUSABLE_OPTIONS} onChange={handleChange} />
                  <TextField label="Standard Mapping" name="Standard_Mapping" value={form.Standard_Mapping} onChange={handleChange} placeholder="e.g. APICS OTC, SCOR D1.1" />
                  <TextField label="Automation KPI IDs" name="Automation_KPI_IDs" value={form.Automation_KPI_IDs} onChange={handleChange} placeholder="e.g. KPI_OrderLeadTime, KPI_OTIF" />
                  <TextField label="Workflow Template" name="Workflow_Template" value={form.Workflow_Template} onChange={handleChange} placeholder="e.g. SCM_CustomerOrder_v1" />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : t('save')}
              </button>
              <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="w-64 border-l border-gray-100 bg-gray-50 flex-shrink-0 overflow-y-auto p-4 hidden lg:block">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('livePreview')}</h3>

            <div className="space-y-3">
              {/* Execution Mode */}
              <div className="card p-3">
                <div className="text-xs text-gray-500 mb-1">Execution Mode</div>
                <span className={`badge text-xs ${MODE_COLORS[derived.executionMode] || 'bg-gray-100 text-gray-700'}`}>
                  {derived.executionMode || 'Workflow'}
                </span>
              </div>

              {/* BPMN */}
              <div className="card p-3">
                <div className="text-xs text-gray-500 mb-2">BPMN Readiness</div>
                <ScoreBar label="Score" value={derived.bpmnScore} colorClass="bg-brand-500" />
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-gray-500">Ready?</span>
                  <span className={`font-bold ${derived.bpmnReady === 'Yes' ? 'text-emerald-600' : 'text-red-500'}`}>{derived.bpmnReady}</span>
                </div>
              </div>

              {/* Scores */}
              <div className="card p-3 space-y-2.5">
                <div className="text-xs text-gray-500 mb-1">Automation Scores</div>
                <ScoreBar label="Human" value={derived.humanScore} colorClass="bg-red-400" />
                <ScoreBar label="Workflow" value={derived.workflowScore} colorClass="bg-amber-400" />
                <ScoreBar label="RPA" value={derived.rpaScore} colorClass="bg-green-400" />
                <ScoreBar label="AI" value={derived.aiScore} colorClass="bg-purple-500" />
              </div>

              {/* Financial */}
              <div className="card p-3 space-y-2">
                <div className="text-xs text-gray-500 mb-1">Financial</div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">ROI %</span>
                  <span className="font-semibold text-gray-800">
                    {derived.roi !== null ? `${Math.round(derived.roi)}%` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">VOI Score</span>
                  <span className="font-semibold text-gray-800">{Math.round(derived.voiScore)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Priority</span>
                  <span className="font-semibold text-brand-600">{derived.priorityScore?.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Quadrant</span>
                  <span className="font-semibold text-gray-700">{derived.heatmapQuadrant}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
