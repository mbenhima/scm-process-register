import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useCollection } from '../hooks/useCollection'
import { setDocAt, updateDocAt } from '../lib/firestoreHelpers'
import { ROLES, ROLE_IDS, CAPABILITIES } from '../lib/roles'
import { PLAN_LABELS, PLAN_MODULES } from '../lib/catalogue'
import { seedDemoData } from '../lib/seedDemoData'

const TABS = ['Organization', 'Users & Roles', 'Permission Matrix', 'Licensing', 'Compliance Standards', 'Audit Log', 'Demo Data']
const PLAN_MAX_USERS = { starter: 5, professional: 15, enterprise: 100, pay_per_project: 3 }

export default function AdminPage() {
  const [tab, setTab] = useState(TABS[0])
  const { orgId, organization, licence, permissionMatrix, complianceStandards } = useApp()
  const { data: users } = useCollection(orgId ? ['users'] : null, { whereClauses: [['orgId', '==', orgId]] })
  const { data: auditLog } = useCollection(orgId ? ['organizations', orgId, 'auditLog'] : null)

  return (
    <div>
      <h1 className="text-xl font-serif font-bold text-grey-dark mb-4">Admin</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === tb ? 'bg-orange text-white' : 'bg-grey-light text-grey-ink'}`}>{tb}</button>
        ))}
      </div>

      {tab === 'Organization' && <OrganizationTab orgId={orgId} organization={organization} />}
      {tab === 'Users & Roles' && <UsersTab orgId={orgId} users={users} />}
      {tab === 'Permission Matrix' && <PermissionMatrixTab orgId={orgId} matrix={permissionMatrix} />}
      {tab === 'Licensing' && <LicensingTab orgId={orgId} licence={licence} memberCount={organization?.memberCount} />}
      {tab === 'Compliance Standards' && <ComplianceTab orgId={orgId} standards={complianceStandards} />}
      {tab === 'Audit Log' && <AuditLogTab entries={auditLog} />}
      {tab === 'Demo Data' && <DemoDataTab orgId={orgId} />}
    </div>
  )
}

function DemoDataTab({ orgId }) {
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState([])
  const [done, setDone] = useState(false)

  async function run() {
    setBusy(true)
    setLog([])
    setDone(false)
    try {
      await seedDemoData(orgId, (msg) => setLog((l) => [...l, msg]))
      setDone(true)
    } catch (err) {
      setLog((l) => [...l, `Error: ${err.message}`])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-4 max-w-xl space-y-3 text-sm">
      <p className="text-grey-ink">Seeds 5 demo clients (Retail, Healthcare, Manufacturing, Finance, Telecom) and 10 example engagement projects at different wizard stages, using the same rule engine and Firestore paths as normal use — good for exploring the app or for a live demo.</p>
      <button className="btn-primary" disabled={busy || done} onClick={run}>{busy ? 'Seeding…' : done ? 'Seeded ✓' : 'Seed Demo Data'}</button>
      <div className="text-xs text-grey-medium max-h-48 overflow-y-auto space-y-0.5">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
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

function UsersTab({ orgId, users }) {
  async function setRoles(uid, roles) {
    await updateDocAt(['users', uid], { roles })
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

function PermissionMatrixTab({ orgId, matrix }) {
  async function toggle(role, capability) {
    const current = !!matrix?.[role]?.[capability]
    await setDocAt(['organizations', orgId, 'config', 'permissionMatrix'], { [role]: { ...matrix[role], [capability]: !current } })
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

function LicensingTab({ orgId, licence, memberCount }) {
  async function changePlan(plan) {
    await setDocAt(['licences', orgId], { plan, maxUsers: PLAN_MAX_USERS[plan], features: PLAN_MODULES[plan] })
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

function ComplianceTab({ orgId, standards }) {
  async function toggle(key) {
    await setDocAt(['organizations', orgId, 'config', 'complianceStandards'], { [key]: !standards[key] })
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
