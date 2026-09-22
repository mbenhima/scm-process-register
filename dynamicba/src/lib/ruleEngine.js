// src/lib/ruleEngine.js
// A deterministic, explainable rule engine implementing D03 (Business Rules) firing
// D03a (Actions) against real project data — this is DynamicBA's "AI Engine" path that
// runs with no external LLM call, per Standard SRS NFR-DA-DATA-01 / FR-DA-AI-09
// (deterministic fallback that a live model could one day sit in front of, unchanged).
// Every function here is intentionally plain arithmetic/string logic so its output is
// reproducible and auditable — never a black box.

import { ACTIONS, BUSINESS_RULES } from './catalogue'

function actionFor(id) {
  return ACTIONS.find((a) => a.id === id)
}
function ruleFor(id) {
  return BUSINESS_RULES.find((r) => r.id === id)
}

function fire(ruleId, extra = {}) {
  const rule = ruleFor(ruleId)
  const action = actionFor(rule.action)
  return { ruleId, rule: rule.condition, actionId: action.id, action: action.name, type: rule.type, at: new Date().toISOString(), ...extra }
}

// --- MP-01: SOW Ingestion & Understanding -----------------------------------

const SOW_SECTIONS = ['objectives', 'scope', 'deliverables', 'timeline', 'constraints']

export function computeSowCompleteness(sow) {
  const weights = { objectives: 20, scope: 20, deliverables: 20, timeline: 15, constraints: 10, stakeholdersText: 15 }
  let score = 0
  for (const [field, weight] of Object.entries(weights)) {
    const v = sow[field]
    if (!v) continue
    const len = String(v).trim().length
    if (len === 0) continue
    // full credit past a reasonable amount of detail, partial credit below it
    score += weight * Math.min(1, len / 60)
  }
  return Math.round(score)
}

export function evaluateSowIntake(sow) {
  const findings = []
  const filledSections = SOW_SECTIONS.filter((s) => (sow[s] || '').trim().length > 0)
  if (filledSections.length < 3) {
    findings.push(fire('BR-01', { detail: `Only ${filledSections.length} of 5 structural sections could be parsed.` }))
  }
  const completeness = computeSowCompleteness(sow)
  if (completeness < 70) {
    findings.push(fire('BR-02', { detail: `Pre-flight completeness score is ${completeness} (threshold 70).`, completeness }))
  }
  return { completeness, findings }
}

export function generateClarifyingQuestions(sow) {
  const qs = []
  const prompts = {
    objectives: 'What business objective(s) is this engagement expected to achieve?',
    scope: 'Which processes, departments, or systems are explicitly in scope — and out of scope?',
    deliverables: 'What are the concrete deliverables and their acceptance criteria?',
    timeline: 'What is the target start date, key milestones, and go-live date?',
    constraints: 'Are there budget, regulatory, or resourcing constraints we should design around?',
    stakeholdersText: 'Who is the client sponsor, and which SMEs/process owners should be interviewed?',
  }
  for (const [field, question] of Object.entries(prompts)) {
    if (!(sow[field] || '').trim() || String(sow[field]).trim().length < 40) qs.push({ field, question })
  }
  return qs
}

// --- MP-02: Context Enrichment ----------------------------------------------

export function evaluateStakeholders(stakeholders) {
  const findings = []
  const hasSponsor = stakeholders.some((s) => /sponsor/i.test(s.role || ''))
  const hasOwner = stakeholders.some((s) => /owner/i.test(s.role || ''))
  if (!hasSponsor || !hasOwner) {
    findings.push(fire('BR-03', { detail: 'No client sponsor or process owner has been identified yet.' }))
  }
  return findings
}

export function computeContextCompleteness({ stakeholders, systemsCount, processesCount }) {
  let score = 0
  score += Math.min(40, stakeholders.length * 10)
  score += Math.min(30, (systemsCount || 0) * 6)
  score += Math.min(30, (processesCount || 0) * 6)
  return Math.round(score)
}

export function evaluateContextModel(contextModel) {
  const findings = []
  if (contextModel.completeness < 70) {
    findings.push(fire('BR-04', { detail: `Context Model completeness score is ${contextModel.completeness} (threshold 70).` }))
  }
  return findings
}

// --- MP-03: Current-State Process Analysis ----------------------------------

export function evaluateAsIsMap({ transcriptStepCount, mapStepCount }) {
  const findings = []
  if (transcriptStepCount > 0) {
    const deviation = Math.abs(mapStepCount - transcriptStepCount) / transcriptStepCount
    if (deviation > 0.1) {
      findings.push(fire('BR-05', { detail: `Map step count (${mapStepCount}) deviates ${(deviation * 100).toFixed(0)}% from transcript step count (${transcriptStepCount}).` }))
    }
  }
  return findings
}

export function evaluateBaseline({ cycleTimeHours, benchmarkHours }) {
  const findings = []
  if (benchmarkHours > 0 && cycleTimeHours > benchmarkHours * 1.25) {
    findings.push(fire('BR-06', { detail: `Baseline cycle time (${cycleTimeHours}h) exceeds the benchmark (${benchmarkHours}h) by more than 25%.` }))
  }
  return findings
}

// --- MP-04: Automation Opportunity Assessment -------------------------------

// Composite feasibility score from four 0-100 sub-scores, weighted per the plain-English
// D06/D05 formula descriptions (technical + data + process-stability + strategic fit).
export function computeFeasibilityScore({ technical, dataQuality, processStability, strategicFit }) {
  return Math.round(technical * 0.3 + dataQuality * 0.25 + processStability * 0.2 + strategicFit * 0.25)
}

export function computeRoiModel({ annualBenefitUsd, oneTimeCostUsd }) {
  const paybackMonths = oneTimeCostUsd > 0 ? (oneTimeCostUsd / Math.max(1, annualBenefitUsd)) * 12 : 0
  const roiPercent = oneTimeCostUsd > 0 ? ((annualBenefitUsd - oneTimeCostUsd) / oneTimeCostUsd) * 100 : 0
  const npv = annualBenefitUsd * 3 - oneTimeCostUsd // simple 3-year horizon, no discount rate — flagged as provisional pending Document 2's Formula Registry
  return { paybackMonths: Math.round(paybackMonths * 10) / 10, roiPercent: Math.round(roiPercent), npv: Math.round(npv) }
}

export function evaluateCandidate(candidate) {
  const findings = []
  if (candidate.feasibilityScore >= 80) findings.push(fire('BR-07', { detail: `Feasibility score ${candidate.feasibilityScore} >= 80 — promoted to prioritization matrix.` }))
  if (candidate.paybackMonths > 18) findings.push(fire('BR-08', { detail: `Projected payback ${candidate.paybackMonths} months exceeds 18-month threshold — deprioritized.` }))
  return findings
}

// --- MP-05: To-Be Process Design --------------------------------------------

export function evaluateExceptionFlow({ isAiAssisted, handlesSensitiveData }) {
  const findings = []
  if (isAiAssisted && handlesSensitiveData) {
    findings.push(fire('BR-09', { detail: 'AI-Assisted step processes client financial or personal data — mandatory human checkpoint inserted.' }))
  }
  return findings
}

export function evaluateControlSpec({ type, linkedToFinancialAction }) {
  const findings = []
  if (type === 'Preventive' && linkedToFinancialAction) {
    findings.push(fire('BR-10', { detail: 'Preventive control linked to a financial action — segregation-of-duties check attached.' }))
  }
  return findings
}

// --- MP-06: Automation Specs Generation --------------------------------------

// Document 2 (the Formula Registry, D19b/D19c) was not supplied with the source
// documents — every business-rule/KPI formula reference is therefore flagged pending
// per BR-11/BR-12, exactly as the Deliverables Workbook itself flags it, rather than
// silently fabricating a Formula_ID.
export function evaluateBusinessRuleSpec() {
  return [fire('BR-11', { detail: "Formula_ID not yet present in Document 2's Formula Registry — flagged pending, not fabricated." })]
}

export function evaluateKpiSpec({ dataSource }, validClassNames) {
  const findings = []
  if (dataSource && !validClassNames.includes(dataSource)) {
    findings.push(fire('BR-12', { detail: `Data source "${dataSource}" does not resolve to the approved Information Class Model.` }))
  }
  return findings
}

// --- MP-07: Validation & Handoff ---------------------------------------------

export function businessDaysBetween(from, to) {
  let count = 0
  const cur = new Date(from)
  const end = new Date(to)
  while (cur < end) {
    cur.setDate(cur.getDate() + 1)
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

export function evaluateSignOffSla({ packageDeliveredDate, now = new Date() }) {
  const findings = []
  const days = businessDaysBetween(packageDeliveredDate, now)
  if (days > 5) {
    findings.push(fire('BR-13', { detail: `${days} business days have elapsed since package delivery (SLA: 5).` }))
  }
  return { businessDaysElapsed: days, findings }
}

const SUPPORTED_EXPORT_FORMATS = ['Word', 'Excel', 'PDF', 'JSON']
export function evaluateExportFormat(format) {
  const findings = []
  if (!SUPPORTED_EXPORT_FORMATS.includes(format)) {
    findings.push(fire('BR-14', { detail: `Export target "${format}" is not supported by the current export engine (Word, Excel, PDF, JSON only); routed to manual export fallback.` }))
  }
  return findings
}
