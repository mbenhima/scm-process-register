import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useApiCollection } from '../hooks/useApiCollection'
import { api } from '../lib/api'
import { ROLES, ROLE_IDS, CAPABILITIES } from '../lib/roles'
import { PLAN_LABELS } from '../lib/catalogue'

const TABS = ['Organization', 'Users & Roles', 'Permission Matrix', 'Licensing', 'Compliance Standards', 'Audit Log', 'Demo Data']

export default function AdminPage() {
  const [tab, setTab] = useState(TABS[0])
  const { orgId, organization, licence, permissionMatrix, complianceStandards, refresh } = useApp()
  const { data: users, refetch: refetchUsers } = useApiCollection(orgId ? `/organizations/${orgId}/users` : null)
  const { data: auditLog } = useApiCollection(orgId ? `/organizations/${orgId}/audit-log` : null)

  return (
    <div>
      <h1 className="text-xl font-serif font-bold text-grey-dark mb-4">Admin</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === tb ? 'bg-orange text-white' : 'bg-grey-light text-grey-ink'}`}>{tb}</button>
        ))}
      </div>

      {tab === 'Organization' && <OrganizationTab orgId={orgId} organization={organization} />}
      {tab === 'Users & Roles' && <UsersTab orgId={orgId} users={users} onChanged={refetchUsers} />}
      {tab === 'Permission Matrix' && <PermissionMatrixTab orgId={orgId} matrix={permissionMatrix} onChanged={refresh} />}
      {tab === 'Licensing' && <LicensingTab orgId={orgId} licence={licence} memberCount={organization?.memberCount} onChanged={refresh} />}
      {tab === 'Compliance Standards' && <ComplianceTab orgId={orgId} standards={complianceStandards} onChanged={refresh} />}
      {tab === 'Audit Log' && <AuditLogTab entries={auditLog} />}
      {tab === 'Demo Data' && <DemoDataTab />}
    </div>
  )
}

function DemoDataTab() {
  return (
    <div className="card p-4 max-w-xl space-y-3 text-sm">
      <p className="text-grey-ink">Demo data (5 example clients across Retail, Healthcare, Manufacturing, Finance, and Telecom, plus 10 example engagement projects at different wizard stages) is seeded from the command line rather than from this screen, so it can populate a fresh database before anyone signs in.</p>
      <p className="text-grey-ink">From the <code>server</code> folder, run:</p>
      <pre className="bg-grey-light rounded p-3 text-xs">npm run seed</pre>
      <p className="text-grey-ink">This also creates a ready-to-use demo admin login: <code>admin@dynamicba.demo</code> / <code>DemoAdmin123!</code>. See the Installation Guide for details.</p>
    </div>
  )
}

function OrganizationTab({ orgId, organization }) {
  return (
    <div className="card p-4 max-w-md space-y-2 text-sm">
      <div><span className="text-grey-medium">Organization ID (share this to invite teammates):</span><div className="font-mono bg-grey-light rounded p-2 mt-1 select-all">{orgId}</div></div>
      <div><span className="text-grey-medium">Name:</span> {organization?.name}</div>
      <div><span className="text-grey-medium">Sector:</span> {organization?.sector || '—'}</div>
      <div><span className="text-grey-medium">Country:</span> {organization?.country || '—'}</div>
      <div><span className="text-grey-medium">Members:</span> {organization?.memberCount}</div>
    </div>
  )
}

function UsersTab({ orgId, users, onChanged }) {
  async function setRoles(userId, roles) {
    await api.patch(`/organizations/${orgId}/users/${userId}`, { roles })
    onChanged()
  }
  return (
    <table className="w-full card text-sm">
      <thead><tr className="text-left text-grey-medium border-b border-grey-line"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Roles</th></tr></thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b border-grey-line last:border-0">
            <td className="p-2">{u.name}</td>
            <td className="p-2">{u.email}</td>
            <td className="p-2">
              <select
                multiple
                className="input h-24"
                value={u.roles || []}
                onChange={(e) => setRoles(u.id, Array.from(e.target.selectedOptions).map((o) => o.value))}
              >
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PermissionMatrixTab({ orgId, matrix, onChanged }) {
  async function toggle(role, capability) {
    const current = !!matrix?.[role]?.[capability]
    await api.put(`/organizations/${orgId}/config/permission-matrix`, { [role]: { ...matrix[role], [capability]: !current } })
    onChanged()
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-grey-medium border-b border-grey-line">
            <th className="p-2">Capability</th>
            {ROLE_IDS.map((r) => <th key={r} className="p-2 text-xs">{r}</th>)}
          </tr>
        </thead>
        <tbody>
          {CAPABILITIES.map((cap) => (
            <tr key={cap} className="border-b border-grey-line last:border-0">
              <td className="p-2 font-mono text-xs">{cap}</td>
              {ROLE_IDS.map((r) => (
                <td key={r} className="p-2 text-center">
                  <input type="checkbox" checked={!!matrix?.[r]?.[cap]} disabled={r === 'org_admin'} onChange={() => toggle(r, cap)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LicensingTab({ orgId, licence, memberCount, onChanged }) {
  async function changePlan(plan) {
    await api.put(`/licences/${orgId}`, { plan })
    onChanged()
  }
  return (
    <div className="card p-4 max-w-xl space-y-3 text-sm">
      <p className="text-xs text-grey-medium italic">Demo build: plan changes are made here directly by an Organization Admin rather than by a Stripe/PayPal webhook (see the Installation Guide's "Licensing in Production" appendix).</p>
      <div>Current plan: <span className="badge badge-good">{PLAN_LABELS[licence?.plan]}</span></div>
      <div>Seats used: {memberCount} of {licence?.maxUsers}</div>
      <div>Entitled modules: {(licence?.features || []).join(', ')}</div>
      <div className="flex gap-2">
        {Object.keys(PLAN_LABELS).map((p) => (
          <button key={p} className={`btn-secondary ${licence?.plan === p ? '!bg-orange !text-white' : ''}`} onClick={() => changePlan(p)}>{PLAN_LABELS[p]}</button>
        ))}
      </div>
    </div>
  )
}

function ComplianceTab({ orgId, standards, onChanged }) {
  async function toggle(key) {
    await api.put(`/organizations/${orgId}/config/compliance-standards`, { [key]: !standards[key] })
    onChanged()
  }
  return (
    <div className="card p-4 max-w-md space-y-2 text-sm">
      <p className="text-xs text-grey-medium italic">Activating a standard seeds GRC scaffolding only — it is not a certification, external audit, or legal attestation (Standard SRS FR-DA-CFG-09).</p>
      {['GDPR', 'ISO27001', 'SOC2'].map((key) => (
        <label key={key} className="flex items-center gap-2">
          <input type="checkbox" checked={!!standards?.[key]} onChange={() => toggle(key)} /> {key}
        </label>
      ))}
    </div>
  )
}

function AuditLogTab({ entries }) {
  return (
    <table className="w-full card text-sm">
      <thead><tr className="text-left text-grey-medium border-b border-grey-line"><th className="p-2">Entity</th><th className="p-2">Actor</th><th className="p-2">Details</th></tr></thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.id} className="border-b border-grey-line last:border-0">
            <td className="p-2">{e.entityType} {e.entityId}</td>
            <td className="p-2">{e.actor}</td>
            <td className="p-2 text-xs">{JSON.stringify(e.before)} → {JSON.stringify(e.after)}</td>
          </tr>
        ))}
        {entries.length === 0 && <tr><td colSpan={3} className="p-4 text-grey-medium">No audit entries yet.</td></tr>}
      </tbody>
    </table>
  )
}
