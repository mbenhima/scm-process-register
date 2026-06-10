// src/lib/formulas.js
// All 13 formulas from the D01 specification

export function calcBpmnReadiness(p) {
  return (
    (p.Process_Clarity || 0) * 0.25 +
    (p.Exception_Logic || 0) * 0.20 +
    (p.Data_Rule_Availability || 0) * 0.20 +
    (p.Automation_Suitability || 0) * 0.20 +
    (p.Compliance_HITL_Readiness || 0) * 0.15
  )
}

export function calcBpmnReady(score) {
  return score >= 80 ? 'Yes' : 'No'
}

export function calcHumanScore(p) {
  const raw = (
    (p.Human_judgment || 0) +
    (p.Human_ethics || 0) +
    (p.Human_accountability || 0) +
    (p.Human_regulatory_signoff || 0)
  ) * 2.5 // 0–40
  return (raw / 40) * 100 // normalise to 0–100
}

export function calcWorkflowScore(p) {
  const raw = (
    (p.Workflow_approval_chain || 0) +
    (p.Workflow_SLA || 0) +
    (p.Workflow_exception_paths || 0) +
    (p.Workflow_handoff_complexity || 0) +
    (p.Workflow_audit_checkpoint || 0)
  ) * 2 // 0–40
  return (raw / 40) * 100
}

export function calcRpaScore(p) {
  const raw = (
    (p.RPA_rule_based || 0) +
    (p.RPA_structured_data || 0) +
    (p.RPA_zero_judgment || 0) +
    (p.RPA_stable || 0)
  ) * 2.5 // 0–40
  return (raw / 40) * 100
}

export function calcAiScore(p) {
  const raw =
    (p.AI_judgment || 0) * 3 +
    (p.AI_unstructured || 0) * 2 +
    (p.AI_variability || 0) * 2 +
    (p.AI_training || 0) * 1 +
    (p.AI_risk_inverse || 0) * 2 // max = 40
  return (raw / 40) * 100
}

export function calcExecutionMode(human, ai, rpa, workflow) {
  if (human >= 80) return 'Human Mandatory'

  // Determine highest with tie-breaker: AI > Workflow > RPA
  let highest = 'Workflow'
  let highestScore = workflow

  if (rpa > highestScore) { highest = 'RPA'; highestScore = rpa }
  // AI beats RPA at same score (tie-breaker: AI > RPA)
  if (ai >= highestScore) { highest = 'AI'; highestScore = ai }
  // Workflow beats RPA but loses to AI (already handled above)
  // Re-apply: if workflow == ai, ai wins; if workflow > rpa but < ai, ai wins
  // Final tie-breaker pass: AI > Workflow > RPA
  // If AI == Workflow, AI wins (already assigned above since ai >= highestScore)
  // If Workflow > RPA and AI < Workflow, Workflow stays
  // Recompute cleanly:
  const scores = { AI: ai, Workflow: workflow, RPA: rpa }
  const maxScore = Math.max(ai, workflow, rpa)
  if (scores.AI === maxScore) highest = 'AI'
  else if (scores.Workflow === maxScore) highest = 'Workflow'
  else highest = 'RPA'

  if (highest === 'AI') {
    if (ai >= 90) return 'AI Autonomous'
    if (ai >= 70) return 'AI Augmented'
    // AI is highest but < 70: fall to Workflow (next in tie-breaker)
    if (workflow >= rpa) return 'Workflow'
    return 'RPA'
  }
  if (highest === 'RPA') return 'RPA'
  return 'Workflow'
}

export function calcROI(benefit, cost) {
  if (!cost || cost === 0) return null
  return ((benefit - cost) / cost) * 100
}

export function calcVoiScore(p) {
  return (
    (p.VOI_risk_reduction_score || 0) * 0.4 +
    (p.VOI_agility_score || 0) * 0.3 +
    (p.VOI_brand_reputation_score || 0) * 0.2 +
    (p.VOI_employee_satisfaction_score || 0) * 0.1
  )
}

export function calcPriorityScore(roi, voi, costEst, strategic) {
  const roiVal = roi !== null ? roi : 0
  const costNorm = (costEst && costEst > 0) ? costEst : 1e-6
  return (
    roiVal * 0.4 +
    voi * 0.3 +
    (1 / (costNorm / 1000)) * 0.2 +
    (strategic || 0) * 0.1
  )
}

export function calcWave(rank) {
  if (rank <= 10) return 'Wave 1'
  if (rank <= 30) return 'Wave 2'
  return 'Wave 3'
}

export function calcHeatmapQuadrant(roi, voi) {
  const roiVal = roi !== null ? roi : 0
  if (roiVal >= 20 && voi >= 80) return 'Quick Win'
  if (roiVal >= 20 && voi < 80) return 'High ROI'
  if (roiVal < 20 && voi >= 80) return 'High VOI'
  return 'Strategic'
}

// Assign ranks across all processes (descending priority score)
export function assignRanks(processes) {
  const sorted = [...processes].sort((a, b) => b.priorityScore - a.priorityScore)
  let rank = 1
  return processes.map(proc => {
    const position = sorted.findIndex(s => s.id === proc.id)
    // Count how many have higher score
    const higherCount = sorted.filter(s => s.priorityScore > proc.priorityScore).length
    return { ...proc, rank: higherCount + 1 }
  })
}

// Calculate all derived fields for a single process
export function deriveAll(p) {
  const bpmnScore = calcBpmnReadiness(p)
  const bpmnReady = calcBpmnReady(bpmnScore)
  const humanScore = calcHumanScore(p)
  const workflowScore = calcWorkflowScore(p)
  const rpaScore = calcRpaScore(p)
  const aiScore = calcAiScore(p)
  const executionMode = calcExecutionMode(humanScore, aiScore, rpaScore, workflowScore)
  const roi = calcROI(p.Benefit_Annualized_USD || 0, p.Cost_OneTime_USD || 0)
  const voiScore = calcVoiScore(p)
  const priorityScore = calcPriorityScore(roi, voiScore, p.Automation_Cost_Estimate_USD || 0, p.Strategic_Alignment_Score || 0)
  const heatmapQuadrant = calcHeatmapQuadrant(roi, voiScore)
  return { bpmnScore, bpmnReady, humanScore, workflowScore, rpaScore, aiScore, executionMode, roi, voiScore, priorityScore, heatmapQuadrant }
}

export const FORMULA_REFERENCE = [
  {
    id: 'F-COMPOSITE-001',
    name: 'BPMN Readiness Score',
    expression: '(Process_Clarity × 0.25) + (Exception_Logic × 0.20) + (Data_Rule_Availability × 0.20) + (Automation_Suitability × 0.20) + (Compliance_HITL_Readiness × 0.15)',
    description: 'Aggregates five readiness dimensions into a single 0–100 score. Weights reflect relative importance: Process_Clarity is highest (25%) because an unclear process cannot be modelled. Exception_Logic, Data_Rule_Availability and Automation_Suitability are equally important (20% each). Compliance_HITL_Readiness carries 15% weight. Score ≥ 80 = BPMN Ready (go/no-go gate).',
  },
  {
    id: 'F-BPMNREADY',
    name: 'BPMN Ready Flag',
    expression: 'IF(BPMN_Readiness_Score ≥ 80, "Yes", "No")',
    description: 'Simple threshold gate on F-COMPOSITE-001. A score of 80 represents a process where all essential BPMN artefacts — trigger, end event, inputs/outputs, RACI, and exception paths — are sufficiently documented. "Yes" unlocks the process for modelling sprint scheduling.',
  },
  {
    id: 'F-HUMAN-001',
    name: 'Human Score',
    expression: '(Human_judgment + Human_ethics + Human_accountability + Human_regulatory_signoff) × 2.5 → normalise: (raw / 40) × 100',
    description: 'Measures the degree to which a process requires irreplaceable human involvement. Each of the four factors is scored 0–4 and the sum is scaled by ×2.5 to yield a 0–40 range, then normalised to 0–100. When the normalised Human Score ≥ 80, the Execution Mode is automatically set to "Human Mandatory" regardless of other scores.',
  },
  {
    id: 'F-WF-001',
    name: 'Workflow Score',
    expression: '(Workflow_approval_chain + Workflow_SLA + Workflow_exception_paths + Workflow_handoff_complexity + Workflow_audit_checkpoint) × 2 → normalise: (raw / 40) × 100',
    description: 'Captures the process characteristics that make structured workflow automation the right choice: multi-step approval chains, strict SLA enforcement, complex exception branching, cross-system handoffs, and mandatory audit checkpoints. Each factor scored 0–4; scaled ×2 to 0–40, then normalised. Workflow is the default "safe" mode in the tie-breaker logic.',
  },
  {
    id: 'F-RPA-001',
    name: 'RPA Score',
    expression: '(RPA_rule_based + RPA_structured_data + RPA_zero_judgment + RPA_stable) × 2.5 → normalise: (raw / 40) × 100',
    description: 'Assesses how well-suited the process is for Robotic Process Automation. The four factors target the classic RPA sweet spot: fully codifiable rules, clean structured data inputs, no requirement for human judgment, and a stable process. Scored 0–4 each; scaled ×2.5 to 0–40, then normalised to 0–100.',
  },
  {
    id: 'F-AI-001',
    name: 'AI Score',
    expression: '(AI_judgment × 3) + (AI_unstructured × 2) + (AI_variability × 2) + (AI_training × 1) + (AI_risk_inverse × 2) → normalise: (raw / 40) × 100',
    description: 'Evaluates suitability for AI/ML automation using weighted factors. AI_judgment carries the highest weight (×3) as the core differentiator. AI_risk_inverse acts as a penalty — high failure-risk processes score high on this factor, reducing the total AI Score. Normalised score ≥ 90 → AI Autonomous; ≥ 70 → AI Augmented.',
  },
  {
    id: 'F-FINALMODE-001',
    name: 'Recommended Execution Mode',
    expression: 'IF(Human ≥ 80) → Human Mandatory; ELSE MAX(AI, Workflow, RPA): AI ≥ 90 → AI Autonomous; AI ≥ 70 → AI Augmented; RPA highest → RPA; ELSE → Workflow. Tie-breaker: AI > Workflow > RPA',
    description: 'The master decision formula. Step 1: check Human Score override (≥ 80 = Human Mandatory). Step 2: identify the highest normalised score among RPA, AI, and Workflow. AI wins ties over Workflow, Workflow wins over RPA. Tie-breaker order reflects strategic preference: AI investment is prioritised; Workflow is preferred over raw RPA for maintainability and auditability.',
  },
  {
    id: 'F-ROI-001',
    name: 'ROI Percentage',
    expression: '((Benefit_Annualized_USD − Cost_OneTime_USD) / Cost_OneTime_USD) × 100',
    description: 'Standard financial return formula comparing net annual benefit against one-time implementation cost. A result of 100% means the automation pays back its implementation cost in one year. This is a simple ROI, not NPV. Use conservative (not optimistic) benefit estimates.',
  },
  {
    id: 'F-VOI-001',
    name: 'VOI Score',
    expression: '(VOI_risk_reduction × 0.4) + (VOI_agility × 0.3) + (VOI_brand_reputation × 0.2) + (VOI_employee_satisfaction × 0.1)',
    description: 'Captures intangible benefits of automation that ROI% cannot. Risk reduction is weighted highest (40%) because eliminating operational, compliance, or safety risk often outweighs financial savings. Agility (30%) reflects strategic importance of faster response. Brand reputation (20%) captures customer-facing improvements. Employee satisfaction (10%) reflects workforce quality-of-life gains.',
  },
  {
    id: 'F-PRIORITY-001',
    name: 'Automation Priority Score',
    expression: '(ROI% × 0.4) + (VOI_Score × 0.3) + (1 / (Automation_Cost_Estimate / 1000)) × 0.2 + (Strategic_Alignment_Score × 0.1)',
    description: 'The master prioritisation index. Financial return (ROI%, 40%) is weighted highest as the most objective benefit. Intangible value (VOI_Score, 30%) is second. Cost efficiency (20%) uses the inverse of cost (per $1,000) so lower-cost automations score higher. Strategic alignment (10%) ensures top-priority strategic processes are not deprioritised purely on financial grounds.',
  },
  {
    id: 'F-RANK',
    name: 'Top Automation Rank',
    expression: 'RANK(Automation_Priority_Score, descending across all 49 macros)',
    description: 'Assigns each macro an integer rank from 1 (highest priority) downward based on Automation Priority Score. Ties receive the same rank and the next rank is skipped. The rank is dynamic — updating scores will automatically re-rank all rows. Programme managers can filter by rank to produce a prioritised automation backlog.',
  },
  {
    id: 'F-WAVE',
    name: 'Automation Wave',
    expression: 'Rank 1–10 → Wave 1 | Rank 11–30 → Wave 2 | Rank > 30 → Wave 3',
    description: 'Translates the numeric rank into a delivery wave label. Wave 1 (top 10): immediate automation sprint — highest-value, highest-readiness processes. Wave 2 (ranks 11–30): medium-term pipeline, typically 2–4 increments. Wave 3 (rank > 30): strategic backlog. Thresholds are configurable (10 and 30 are defaults).',
  },
  {
    id: 'F-HEATMAP',
    name: 'Heatmap Quadrant',
    expression: 'ROI% ≥ 20 & VOI ≥ 80 → Quick Win | ROI% ≥ 20 & VOI < 80 → High ROI | ROI% < 20 & VOI ≥ 80 → High VOI | else → Strategic',
    description: 'Maps each macro to one of four quadrants in a classic 2×2 value/return matrix. Quick Win (high ROI + high VOI): automate immediately. High ROI (high financial return, lower intangible): prioritise for cost savings. High VOI (lower financial return, high intangible): prioritise for strategic/brand/risk value. Strategic (lower on both): long-term investment or deprioritise.',
  },
]
