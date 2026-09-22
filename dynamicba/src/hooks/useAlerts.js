import { useCollection } from './useCollection'
import { createDoc, updateDocAt } from '../lib/firestoreHelpers'

// Per-project alert inbox (Standard SRS FR-DA-ALT-*): instances of D07's Alert Catalogue,
// raised by the deterministic rule engine (src/lib/ruleEngine.js) as it evaluates D03
// Business Rules against real wizard input.
export function useAlerts(orgId, clientId, projectId) {
  const path = orgId && clientId && projectId ? ['organizations', orgId, 'clients', clientId, 'projects', projectId, 'alerts'] : null
  const { data, loading } = useCollection(path, { orderByField: 'raisedAt' })

  async function raiseAlert({ alertId, severity, escalation, ruleId, detail, stepId }) {
    return createDoc(path, {
      alertId, severity, escalation, ruleId, detail, stepId, read: false, raisedAt: new Date().toISOString(),
    })
  }
  async function markRead(id) {
    return updateDocAt([...path, id], { read: true })
  }

  return { alerts: data, loading, raiseAlert, markRead }
}
