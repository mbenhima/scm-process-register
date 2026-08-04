import { ADKAR_BLOCKS } from '../data/constants.js'

export function adkarAverage(project) {
  const scores = ADKAR_BLOCKS.map((b) => project.adkar[b].score)
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

export function trainingCompletionAvg(project) {
  if (!project.trainings.length) return 0
  return project.trainings.reduce((a, t) => a + (t.completion || 0), 0) / project.trainings.length
}

const SENTIMENT_SCORE = { denial: 20, resistance: 40, exploration: 70, commitment: 100 }

export function inferSentimentStage(project) {
  const text = (project.sentimentSnapshot || '').toLowerCase()
  if (text.includes('commitment')) return 'commitment'
  if (text.includes('exploration')) return 'exploration'
  if (text.includes('denial')) return 'denial'
  if (text.includes('resistance') || text.includes('anger')) return 'resistance'
  return 'exploration'
}

/** Composite Readiness Index (0-100), blending ADKAR, sentiment and training completion — Module 15 */
export function readinessIndex(project) {
  const adkarPct = (adkarAverage(project) / 5) * 100
  const sentimentPct = SENTIMENT_SCORE[inferSentimentStage(project)] ?? 50
  const trainingPct = trainingCompletionAvg(project)
  return Math.round(adkarPct * 0.5 + sentimentPct * 0.25 + trainingPct * 0.25)
}

export function isBlockStalled(block) {
  return block.score <= 2
}

/** Module 6: escalation rule — a block stalled at <=2 is flagged to the Change Manager */
export function stalledBlocks(project) {
  return ADKAR_BLOCKS.filter((b) => isBlockStalled(project.adkar[b]))
}

/** Module 7: divergence — strong capability (Knowledge/Ability) but still emotionally "Ending" */
export function hasDivergence(project) {
  const strongCapability = project.adkar.knowledge.score >= 3 && project.adkar.ability.score >= 3
  const stillEnding = project.bridgesPhase === 'ending'
  return strongCapability && stillEnding
}

export function riskScore(risk) {
  return risk.likelihood * risk.impact
}

export function isHighSeverityRisk(risk) {
  return riskScore(risk) >= 12
}

export function isHighImpactLowInfluence(sh) {
  const avgImpact = (sh.impact.process + sh.impact.tech + sh.impact.role + sh.impact.location + sh.impact.identity) / 5
  return avgImpact >= 3.6 && sh.influence <= 2
}

/** Module 14 — flags orgs where >1 concurrent CM project may be hitting overlapping populations */
export function saturationCandidates(cmProjects, orgId) {
  return cmProjects.filter((p) => p.orgId === orgId)
}

export function lewinLabelOrder(phase) {
  return { unfreeze: 0, change: 1, refreeze: 2 }[phase] ?? 0
}

export function bridgesOrder(phase) {
  return { ending: 0, neutral: 1, beginning: 2 }[phase] ?? 0
}

export function scoreColor(score) {
  if (score <= 2) return 'text-red-600 bg-red-50'
  if (score === 3) return 'text-amber-600 bg-amber-50'
  return 'text-brand-700 bg-brand-50'
}

export function visibilityColor(level) {
  if (level === 'weak') return 'text-red-600 bg-red-50'
  if (level === 'moderate') return 'text-amber-600 bg-amber-50'
  return 'text-brand-700 bg-brand-50'
}

export function severityColor(n) {
  if (n >= 4) return 'text-red-600 bg-red-50'
  if (n === 3) return 'text-amber-600 bg-amber-50'
  return 'text-brand-700 bg-brand-50'
}
