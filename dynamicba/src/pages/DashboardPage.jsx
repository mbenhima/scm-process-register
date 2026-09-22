import React from 'react'
import { useApp } from '../contexts/AppContext'
import { useClients } from '../hooks/useClients'
import { useAllProjects } from '../hooks/useProjects'
import { PLAN_LABELS } from '../lib/catalogue'

export default function DashboardPage() {
  const { orgId, organization, licence, licenceProvider } = useApp()
  const { clients } = useClients(orgId)
  const { projects } = useAllProjects(orgId, clients)

  const completed = projects.filter((p) => p.status === 'completed').length
  const inProgress = projects.filter((p) => p.status === 'in_progress').length
  const notStarted = projects.filter((p) => !p.status || p.status === 'not_started').length
  const totalHoursSaved = projects.reduce((sum, p) => sum + (p.hoursSaved || 0), 0)
  const check = licenceProvider.check()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-serif font-bold text-grey-dark">Welcome to {organization?.name || 'DynamicBA'}</h1>
        <p className="text-sm text-grey-medium">AI-assisted scope-to-specs automation platform for management consulting engagements.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Clients" value={clients.length} />
        <StatCard label="Total Projects" value={projects.length} />
        <StatCard label="Completed" value={completed} good />
        <StatCard label="In Progress" value={inProgress} />
        <StatCard label="Hours Saved (KPI-10)" value={totalHoursSaved} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold text-grey-dark mb-3">Pipeline Status</h2>
          <div className="space-y-2 text-sm">
            <BarRow label="Not started" value={notStarted} total={projects.length} />
            <BarRow label="In progress" value={inProgress} total={projects.length} />
            <BarRow label="Completed" value={completed} total={projects.length} />
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold text-grey-dark mb-3">Licensing</h2>
          <p className="text-sm">Plan: <span className="badge badge-good">{PLAN_LABELS[licence?.plan] || '—'}</span></p>
          <p className="text-sm mt-2">Modules entitled: {licenceProvider.getFeatureFlags().join(', ') || '—'}</p>
          <p className="text-sm mt-2">Licence status: <span className={`badge ${check.status === 'active' ? 'badge-good' : check.status === 'warning' ? 'badge-medium' : 'badge-critical'}`}>{check.status}</span> {Number.isFinite(check.daysLeft) && `(${check.daysLeft} days left)`}</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, good }) {
  return (
    <div className="card p-4">
      <div className={`text-2xl font-serif font-bold ${good ? 'text-orange-deep' : 'text-grey-dark'}`}>{value}</div>
      <div className="text-xs text-grey-medium mt-1">{label}</div>
    </div>
  )
}

function BarRow({ label, value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-grey-ink mb-1"><span>{label}</span><span>{value}</span></div>
      <div className="w-full bg-grey-light rounded-full h-2"><div className="bg-orange h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
