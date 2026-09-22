import React from 'react'
import { Building2, FolderKanban, CheckCircle2, Clock, Zap, GaugeCircle, ShieldCheck } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useClients } from '../hooks/useClients'
import { useAllProjects } from '../hooks/useProjects'
import { PLAN_LABELS } from '../lib/catalogue'
import IconBadge from '../components/IconBadge'

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
        <div className="eyebrow mb-1">Practice Overview</div>
        <h1 className="h-page">Welcome to {organization?.name || 'DynamicBA'}</h1>
        <p className="text-sm text-grey-ink mt-1">AI-assisted scope-to-specs automation platform for management consulting engagements.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Building2} label="Clients" value={clients.length} />
        <StatCard icon={FolderKanban} label="Total Projects" value={projects.length} />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} />
        <StatCard icon={Clock} label="In Progress" value={inProgress} />
        <StatCard icon={Zap} label="Hours Saved (KPI-10)" value={totalHoursSaved} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge icon={GaugeCircle} tone="ink" size={28} />
            <h2 className="h-section !text-base">Pipeline Status</h2>
          </div>
          <div className="space-y-3">
            <BarRow label="Not started" value={notStarted} total={projects.length} />
            <BarRow label="In progress" value={inProgress} total={projects.length} />
            <BarRow label="Completed" value={completed} total={projects.length} />
          </div>
          <p className="caption mt-3">Share of engagements at each wizard stage, across every client.</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge icon={ShieldCheck} tone="ink" size={28} />
            <h2 className="h-section !text-base">Licensing</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-grey-ink">Plan</dt>
              <dd><span className="badge badge-good">{PLAN_LABELS[licence?.plan] || '—'}</span></dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-grey-ink shrink-0">Modules entitled</dt>
              <dd className="text-grey-dark text-right">{licenceProvider.getFeatureFlags().join(', ') || '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-grey-ink">Licence status</dt>
              <dd>
                <span className={`badge ${check.status === 'active' ? 'badge-good' : check.status === 'warning' ? 'badge-medium' : 'badge-critical'}`}>{check.status}</span>
                {Number.isFinite(check.daysLeft) && <span className="text-grey-medium text-xs ml-2">{check.daysLeft} days left</span>}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="card p-4">
      <IconBadge icon={icon} size={28} className="mb-3" />
      <div className="kpi-number text-2xl">{value}</div>
      <div className="text-xs text-grey-medium mt-1">{label}</div>
    </div>
  )
}

function BarRow({ label, value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-grey-ink mb-1"><span>{label}</span><span className="font-semibold text-grey-dark">{value}</span></div>
      <div className="w-full bg-grey-light rounded-full h-2"><div className="bg-orange h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
