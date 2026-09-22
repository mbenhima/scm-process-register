import { alertForRule } from './catalogue'

// Bridges the deterministic rule engine's findings (src/lib/ruleEngine.js) to the
// project's Alert inbox (D07), looking up each rule's cataloged alert definition.
export async function applyFindings(raiseAlert, findings, stepId) {
  for (const f of findings) {
    const alertDef = alertForRule(f.ruleId)
    if (!alertDef) continue
    await raiseAlert({
      alertId: alertDef.id,
      severity: alertDef.severity,
      escalation: alertDef.escalation,
      ruleId: f.ruleId,
      detail: f.detail || f.rule,
      stepId: stepId || alertDef.step,
    })
  }
}
