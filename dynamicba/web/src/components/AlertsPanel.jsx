import React from 'react'
import { Bell } from 'lucide-react'
import { useAlerts } from '../hooks/useAlerts'
import { useApp } from '../contexts/AppContext'
import IconBadge from './IconBadge'

const SEV_BADGE = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }

export default function AlertsPanel({ orgId, clientId, projectId }) {
  const { alerts, loading, markRead, deleteAlert } = useAlerts(orgId, clientId, projectId)
  const { can } = useApp()
  const canWrite = can('project.write')

  if (loading) return <p className="text-grey-medium">Loading…</p>

  return (
    <div className="card divide-y divide-grey-line">
      {alerts.length === 0 && <p className="p-4 text-grey-medium">No alerts raised on this project yet.</p>}
      {[...alerts].reverse().map((a) => (
        <div key={a.id} className={`p-4 flex items-start gap-3 ${a.read ? 'opacity-60' : ''}`}>
          <IconBadge icon={Bell} tone="ink" size={28} />
          <span className={`badge shrink-0 ${SEV_BADGE[a.severity] || 'badge-medium'}`}>{a.severity}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-grey-dark">{a.alertId} — {a.ruleId}</div>
            <div className="text-sm text-grey-ink">{a.detail}</div>
            <div className="text-xs text-grey-medium mt-1">Escalation: {a.escalation} · Step {a.stepId}</div>
          </div>
          {canWrite && (
            <div className="flex gap-4 shrink-0">
              {!a.read && <button className="row-action" onClick={() => markRead(a.id)}>Mark read</button>}
              <button className="btn-danger-text" onClick={() => deleteAlert(a.id)}>Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
