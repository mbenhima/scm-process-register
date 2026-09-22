import { api } from '../lib/api'
import { useApiCollection } from './useApiCollection'
import { invalidate } from '../lib/queryStore'

// Per-project alert inbox: instances of D07's Alert Catalogue, raised by the
// deterministic rule engine (src/lib/ruleEngine.js) as it evaluates D03 Business Rules
// against real wizard input.
export function useAlerts(orgId, clientId, projectId) {
  const path = orgId && clientId && projectId ? `/organizations/${orgId}/clients/${clientId}/projects/${projectId}/alerts` : null
  const { data, loading } = useApiCollection(path)

  async function raiseAlert({ alertId, severity, escalation, ruleId, detail, stepId }) {
    await api.post(path, { alertId, severity, escalation, ruleId, detail, stepId })
    invalidate(path)
  }
  async function markRead(id) {
    await api.patch(`${path}/${id}`, { read: true })
    invalidate(path)
  }
  async function deleteAlert(id) {
    await api.del(`${path}/${id}`)
    invalidate(path)
  }

  return { alerts: data, loading, raiseAlert, markRead, deleteAlert }
}
