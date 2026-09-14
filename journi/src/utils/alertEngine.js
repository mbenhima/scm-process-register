import alertDefinitions from '../data/alertDefinitions.js'

export const SEVERITY_TONE = { Critical: 'red', High: 'red', Medium: 'amber', Low: 'sand', Informational: 'gray' }

// The 9 of 16 D07 alerts with a condition directly computable from journi's
// existing client-side data model — see alertDefinitions.js for why the
// remaining 7 are listed but never fire.
const evaluators = {
  'ALT-001': {
    test: (p) => p.adkar.knowledge.score >= 4 && p.adkar.ability.score >= 4 && p.bridgesPhase === 'ending',
    message: (p) => `Divergence detected for ${p.targetPopulation || p.name}: Knowledge/Ability verified but Bridges still reads Ending.`,
  },
  'ALT-002': {
    test: (p) => (p.sustainment?.checkpoints || []).some((c) => c.status === 'complete' && c.regressionRisk === 'high'),
    message: (p) => {
      const c = p.sustainment.checkpoints.find((c) => c.status === 'complete' && c.regressionRisk === 'high')
      return `Regression risk score for ${p.targetPopulation || p.name} crossed Critical threshold at the ${c?.label} checkpoint.`
    },
  },
  'ALT-003': {
    test: (p) => p.sponsor?.visibility === 'weak',
    message: (p) => `No logged sponsor activity for ${p.name} in the current governance week.`,
  },
  'ALT-004': {
    test: (p) => (p.resistanceLog || []).filter((r) => r.status !== 'closed').length >= 3,
    message: (p) => {
      const n = p.resistanceLog.filter((r) => r.status !== 'closed').length
      return `Resistance in ${p.targetPopulation || p.name} exceeded the escalation threshold (${n} open entries).`
    },
  },
  'ALT-008': {
    test: (p, ctx) => (ctx.otherOrgProjects || []).length >= 2,
    message: (p, ctx) => `Population segment for ${p.name} is targeted by ${ctx.otherOrgProjects.length} other concurrent initiative(s) in this Organization.`,
  },
  'ALT-009': {
    test: (p) => (p.phaseGates || []).some((g) => g.jointDecision && g.jointDecision !== 'go'),
    message: (p) => {
      const g = [...(p.phaseGates || [])].reverse().find((g) => g.jointDecision && g.jointDecision !== 'go')
      return `Phase Gate for ${p.name} closed as ${g.jointDecision === 'no_go' ? 'No-Go' : 'Go with Conditions'}.`
    },
  },
  'ALT-010': {
    test: (p) => (p.sponsor?.members || []).length < 2,
    message: (p) => `Guiding coalition for ${p.name} has fewer than 2 named members.`,
  },
  'ALT-011': {
    test: (p, ctx) => {
      const queued = (list) => (list || []).filter((c) => c.status !== 'sent').length
      return queued(p.communications) + (ctx.otherOrgProjects || []).reduce((sum, o) => sum + queued(o.communications), 0) > 3
    },
    message: (p, ctx) => {
      const queued = (list) => (list || []).filter((c) => c.status !== 'sent').length
      const total = queued(p.communications) + (ctx.otherOrgProjects || []).reduce((sum, o) => sum + queued(o.communications), 0)
      return `${p.targetPopulation || p.name} is scheduled to receive ${total} communications across concurrent initiatives in this Organization.`
    },
  },
  'ALT-015': {
    test: (p) => !p.sustainment?.signoff && (p.sustainment?.checkpoints || []).some((c) => c.status === 'complete' && c.regressionRisk === 'high'),
    message: (p) => `Sustainment sign-off for ${p.name} blocked — open regression flag.`,
  },
}

/** Returns the alert definitions currently firing for a project, each with a filled message. */
export function evaluateAlerts(project, ctx = {}) {
  if (!project) return []
  return alertDefinitions
    .filter((a) => evaluators[a.id]?.test(project, ctx))
    .map((a) => ({ ...a, message: evaluators[a.id].message(project, ctx) }))
}
