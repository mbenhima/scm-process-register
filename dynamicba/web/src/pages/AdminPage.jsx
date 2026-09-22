import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useApiCollection } from '../hooks/useApiCollection'
import { api } from '../lib/api'
import { invalidate } from '../lib/queryStore'
import { ROLES, ROLE_IDS, CAPABILITIES } from '../lib/roles'
import { PLAN_LABELS } from '../lib/catalogue'

const TABS = ['Organization', 'Users & Roles', 'Permission Matrix', 'Licensing', 'Compliance Standards', 'Audit Log', 'Demo Data']

export default function AdminPage() {
  const [tab, setTab] = useState(TABS[0])
  const { orgId, organization, licence, permissionMatrix, complianceStandards, refresh, can } = useApp()
  const usersPath = orgId ? `/organizations/${orgId}/users` : null
  const { data: users } = useApiCollection(usersPath)
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
      {tab === 'Users & Roles' && <UsersTab orgId={orgId} users={users} usersPath={usersPath} can={can} />}
      {tab === 'Permission Matrix' && <PermissionMatrixTab orgId={orgId} matrix={permissionMatrix} onChanged={refresh} can={can} />}
      {tab === 'Licensing' && <LicensingTab orgId={orgId} licence={licence} memberCount={organization?.memberCount} onChanged={refresh} can={can} />}
      {tab === 'Compliance Standards' && <ComplianceTab orgId={orgId} standards={complianceStandards} onChanged={refresh} can={can} />}
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

function UsersTab({ orgId, users, usersPath, can }) {
  const canManage = can('users.manage')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', roles: ['business_analyst'] })
  const [created, setCreated] = useState(null)
  const [error, setError] = useState('')

  async function setRoles(userId, roles) {
    await api.patch(`${usersPath}/${userId}`, { roles })
    invalidate(usersPath)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post(usersPath, form)
      invalidate(usersPath)
      setCreated({ email: form.email, password: form.password })
      setForm({ name: '', email: '', password: '', roles: ['business_analyst'] })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(userId) {
    if (!confirm('Remove this user’s access? This cannot be undone.')) return
    try {
      await api.del(`${usersPath}/${userId}`)
      invalidate(usersPath)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="card p-4">
          <button className="btn-secondary" onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : '+ Create User'}</button>
          {showForm && (
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3 mt-3">
              <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><label className="label">Temporary Password</label><input className="input" type="text" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.roles[0]} onChange={(e) => setForm({ ...form, roles: [e.target.value] })}>
                  {ROLES.filter((r) => r.id !== 'org_admin').map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <div className="col-span-2"><button className="btn-primary">Create User</button></div>
              {error && <div className="col-span-2 text-sm text-red-600">{error}</div>}
            </form>
          )}
          {created && (
            <p className="text-sm text-green-700 mt-3">Created {created.email}. Share this temporary password with them: <span className="font-mono bg-grey-light px-1 rounded">{created.password}</span></p>
          )}
        </div>
      )}
      <table className="w-full card text-sm">
        <thead><tr className="text-left text-grey-medium border-b border-grey-line"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Roles</th><th className="p-2"></th></tr></thead>
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
                  disabled={!canManage}
                  onChange={(e) => setRoles(u.id, Array.from(e.target.selectedOptions).map((o) => o.value))}
                >
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </td>
              <td className="p-2 text-right">
                {canManage && <button className="text-red-500 text-xs" onClick={() => handleDelete(u.id)}>Remove</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PermissionMatrixTab({ orgId, matrix, onChanged, can }) {
  const canManage = can('permissions.manage')
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
                  <input type="checkbox" checked={!!matrix?.[r]?.[cap]} disabled={!canManage || r === 'org_admin'} onChange={() => toggle(r, cap)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LicensingTab({ orgId, licence, memberCount, onChanged, can }) {
  const canManage = can('config.manage')
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
          <button key={p} disabled={!canManage} className={`btn-secondary ${licence?.plan === p ? '!bg-orange !text-white' : ''}`} onClick={() => changePlan(p)}>{PLAN_LABELS[p]}</button>
        ))}
      </div>
    </div>
  )
}

function ComplianceTab({ orgId, standards, onChanged, can }) {
  const canManage = can('config.manage')
  async function toggle(key) {
    await api.put(`/organizations/${orgId}/config/compliance-standards`, { [key]: !standards[key] })
    onChanged()
  }
  return (
    <div className="card p-4 max-w-md space-y-2 text-sm">
      <p className="text-xs text-grey-medium italic">Activating a standard seeds GRC scaffolding only — it is not a certification, external audit, or legal attestation (Standard SRS FR-DA-CFG-09).</p>
      {['GDPR', 'ISO27001', 'SOC2'].map((key) => (
        <label key={key} className="flex items-center gap-2">
          <input type="checkbox" disabled={!canManage} checked={!!standards?.[key]} onChange={() => toggle(key)} /> {key}
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
