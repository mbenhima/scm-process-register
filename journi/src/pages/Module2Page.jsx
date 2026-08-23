import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { visibleOrganizations, roleLabelKey, canManageUsers, canManageHierarchy } from '../utils/rbac.js'
import { CAPABILITIES } from '../data/constants.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-10 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-brand-600' : 'bg-brand-100'} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
      style={{ height: 22 }}
    >
      <span
        className="absolute rounded-full bg-white shadow transition-transform"
        style={{ top: 2, left: 0, width: 18, height: 18, transform: checked ? 'translateX(19px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

function GovernanceSettings({ canEdit }) {
  const { data, setRequireJustification } = useAppState()
  const required = data.requireJustification !== false

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/60">
        Platform-wide controls over how changes are recorded across every Change Management module — not scoped to one Organization.
      </p>
      <div className="card p-4 flex items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-brand-950 text-sm">Require justification for score/state changes</h4>
          <p className="text-xs text-ink/50 mt-1 max-w-2xl">
            When on (the default), every scored or state-changing update — Lewin macro-state, ADKAR scores, Bridges transition,
            Kübler-Ross sentiment, Sponsor visibility, Training certification, Resistance status, Manager readiness rating, and
            Risk status — must be saved with a written justification, logged to that project's audit trail. When off,
            justification is still offered but optional.
          </p>
        </div>
        <Toggle checked={required} onChange={(v) => setRequireJustification(v)} disabled={!canEdit} />
      </div>
    </div>
  )
}

const REQUIRED_LIC_FIELDS = ['version', 'companyId', 'companyName', 'hardwareId', 'expiryDate', 'maxUsers', 'plan', 'features', 'issueDate', 'signature']
const PLAN_TONE = { starter: 'gray', professional: 'brand', enterprise: 'green' }

function LicensePanel({ canEdit }) {
  const { data, updateLicense } = useAppState()
  const license = data.license
  const [uploadError, setUploadError] = useState('')
  const userCount = data.users.length
  const daysToExpiry = Math.round((new Date(license.expiryDate) - new Date()) / 86400000)
  const expiryTone = daysToExpiry < 0 ? 'red' : daysToExpiry < 30 ? 'amber' : 'green'
  const overCapacity = userCount > license.maxUsers

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    const reader = new FileReader()
    reader.onload = () => {
      let parsed
      try {
        parsed = JSON.parse(reader.result)
      } catch {
        setUploadError('Not valid JSON — expected a D30 .lic file.')
        return
      }
      const missing = REQUIRED_LIC_FIELDS.filter((f) => parsed[f] === undefined)
      if (missing.length) {
        setUploadError(`Missing required field(s): ${missing.join(', ')}`)
        return
      }
      updateLicense({
        mode: 'onprem',
        plan: parsed.plan,
        companyName: parsed.companyName,
        maxUsers: parsed.maxUsers,
        issueDate: parsed.issueDate,
        expiryDate: parsed.expiryDate,
        features: parsed.features,
        uploadedFile: { name: file.name, companyId: parsed.companyId, hardwareId: parsed.hardwareId },
      })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/60">
        Platform license terms — journi runs entirely client-side, so this reflects the license record a real deployment would keep
        (D30): SaaS mode by default, or OnPrem mode once a signed <code>.lic</code> file is uploaded. Only a Super Admin can change
        this.
      </p>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={license.mode === 'onprem' ? 'brand' : 'gray'}>{license.mode === 'onprem' ? 'OnPrem' : 'SaaS'}</Badge>
            <Badge tone={PLAN_TONE[license.plan] || 'gray'}>{license.plan}</Badge>
            <span className="font-semibold text-brand-950 text-sm">{license.companyName}</span>
          </div>
          <Badge tone={expiryTone}>{daysToExpiry < 0 ? 'Expired' : `Expires in ${daysToExpiry}d`} — {license.expiryDate}</Badge>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-ink/40 uppercase tracking-wide">Users</div>
            <div className={overCapacity ? 'text-red-600 font-semibold' : 'text-brand-950 font-semibold'}>
              {userCount} / {license.maxUsers}
              {overCapacity && ' — over capacity'}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink/40 uppercase tracking-wide">Issued</div>
            <div className="text-brand-950">{license.issueDate}</div>
          </div>
          {license.uploadedFile && (
            <div>
              <div className="text-xs text-ink/40 uppercase tracking-wide">Source file</div>
              <div className="text-brand-950">{license.uploadedFile.name}</div>
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-ink/40 uppercase tracking-wide mb-1">Feature flags</div>
          <div className="flex gap-1 flex-wrap">
            {license.features.map((f) => (
              <Badge key={f} tone="gray">
                {f}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="card p-4 space-y-2">
          <h4 className="font-semibold text-brand-950 text-sm">Upload license file (.lic)</h4>
          <p className="text-xs text-ink/50">
            A JSON file matching the D30 schema (version, companyId, companyName, hardwareId, expiryDate, maxUsers, plan, features,
            issueDate, signature). This demo checks the required fields are present but does not verify the cryptographic signature —
            a production journi deployment would verify it against the issuer's public key before accepting the file.
          </p>
          <input type="file" accept=".lic,.json,application/json" onChange={handleFile} className="text-sm" />
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          {license.mode === 'onprem' && (
            <button
              className="btn-ghost text-xs"
              onClick={() =>
                updateLicense({
                  mode: 'saas',
                  plan: 'professional',
                  companyName: 'journi Demo Tenant',
                  maxUsers: 50,
                  uploadedFile: null,
                })
              }
            >
              Revert to SaaS mode
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const ROLE_OPTIONS = [
  'super_admin',
  'group_admin',
  'org_admin',
  'sponsor',
  'change_manager',
  'people_manager',
  'practitioner',
  'employee',
  'executive',
]

function PermissionMatrix({ canEditMatrix }) {
  const { t } = useI18n()
  const { data, updateRolePermission } = useAppState()

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/60">
        What each role can do, platform-wide — not scoped to one Organization. Only a Super Admin can change these; every other role sees
        this table read-only, for transparency.
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-4 py-2.5">{t('role')}</th>
              {CAPABILITIES.map((c) => (
                <th key={c.key} className="text-start px-4 py-2.5" title={c.description}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLE_OPTIONS.map((role) => (
              <tr key={role} className="border-t border-brand-50">
                <td className="px-4 py-2.5 font-medium text-brand-950 whitespace-nowrap">{t(roleLabelKey(role))}</td>
                {CAPABILITIES.map((c) => {
                  const checked = !!data.rolePermissions?.[role]?.[c.key]
                  return (
                    <td key={c.key} className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canEditMatrix}
                        onChange={(e) => updateRolePermission(role, c.key, e.target.checked)}
                        className={canEditMatrix ? 'cursor-pointer' : 'cursor-default'}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-ink/40 space-y-1">
        {CAPABILITIES.map((c) => (
          <div key={c.key}>
            <strong className="text-ink/60">{c.label}:</strong> {c.description}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Module2Page() {
  const { t } = useI18n()
  const { data, currentUser, addUser, updateUser, removeUser } = useAppState()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [pending, setPending] = useState(true)
  const [tab, setTab] = useState('users')
  const canEdit = canManageUsers(currentUser?.role, data.rolePermissions)
  const canEditMatrix = currentUser?.role === 'super_admin'
  const canEditGovernance = canManageHierarchy(currentUser?.role, data.rolePermissions)

  const orgs = visibleOrganizations(currentUser, data)
  const orgIds = new Set(orgs.map((o) => o.id))
  const visibleUsers = data.users.filter((u) => {
    if (u.scopeType === 'platform') return currentUser.role === 'super_admin'
    if (u.scopeType === 'group') return true
    if (u.scopeType === 'organization') return orgIds.has(u.scopeId)
    if (u.scopeType === 'project') {
      const proj = data.cmProjects.find((p) => p.id === u.scopeId)
      return proj && orgIds.has(proj.orgId)
    }
    return true
  })

  function submit() {
    addUser({
      name: form.name,
      email: form.email,
      role: form.role || 'employee',
      scopeType: form.scopeType || 'project',
      scopeId: form.scopeId || null,
      language: form.language || 'en',
    })
    setModal(false)
    setForm({})
  }

  return (
    <div>
      <PageHeader
        title={t('navM2')}
        description="Role-based access control scoped to Group / Organization / Project. Self-service sign-ups land as pending Employee accounts until approved."
        actions={
          tab === 'users' &&
          canEdit && (
            <button className="btn-primary" onClick={() => setModal(true)}>
              + {t('add')}
            </button>
          )
        }
      />

      <div className="flex gap-2 mb-4">
        <button className={`tab ${tab === 'users' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('users')}>
          Users & Scope
        </button>
        <button className={`tab ${tab === 'matrix' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('matrix')}>
          Permission Matrix
        </button>
        <button className={`tab ${tab === 'governance' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('governance')}>
          Governance Settings
        </button>
        <button className={`tab ${tab === 'license' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('license')}>
          License & Plan
        </button>
      </div>

      {tab === 'matrix' && <PermissionMatrix canEditMatrix={canEditMatrix} />}
      {tab === 'governance' && <GovernanceSettings canEdit={canEditGovernance} />}
      {tab === 'license' && <LicensePanel canEdit={canEditMatrix} />}

      {tab === 'users' && (
      <>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-4 py-2.5">{t('name')}</th>
              <th className="text-start px-4 py-2.5">{t('role')}</th>
              <th className="text-start px-4 py-2.5">{t('scope')}</th>
              <th className="text-start px-4 py-2.5">{t('language')}</th>
              {canEdit && <th className="text-start px-4 py-2.5">{t('actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((u) => {
              const scopeLabel =
                u.scopeType === 'platform'
                  ? 'Platform'
                  : u.scopeType === 'group'
                    ? data.groups.find((g) => g.id === u.scopeId)?.name
                    : u.scopeType === 'organization'
                      ? data.organizations.find((o) => o.id === u.scopeId)?.name
                      : data.cmProjects.find((p) => p.id === u.scopeId)?.name
              return (
                <tr key={u.id} className="border-t border-brand-50 hover:bg-brand-50/40">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-brand-950">{u.name}</div>
                    <div className="text-xs text-ink/40">{u.email}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    {canEdit ? (
                      <select
                        className="input py-1 text-xs"
                        value={u.role}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {t(roleLabelKey(r))}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge tone="sand">{t(roleLabelKey(u.role))}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink/60">
                    <Badge tone="sand">{u.scopeType}</Badge> {scopeLabel}
                  </td>
                  <td className="px-4 py-2.5 uppercase text-xs text-ink/50">{u.language}</td>
                  {canEdit && (
                    <td className="px-4 py-2.5">
                      <button className="btn-danger text-xs" onClick={() => removeUser(u.id)}>
                        {t('delete')}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="card p-4 mt-6">
        <h3 className="font-semibold text-brand-950 mb-2">Self-service sign-up (demo)</h3>
        <p className="text-sm text-ink/60 mb-3">
          Employees registering with a corporate, domain-verified email land in a pending role until an Admin approves them.
        </p>
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-brand-200 p-3">
          <div className="flex-1">
            <div className="font-medium text-sm text-brand-950">rachid.new@atlas-industrial.example</div>
            <div className="text-xs text-ink/50">Requested access · Atlas ERP People Readiness Program</div>
          </div>
          <Badge tone={pending ? 'amber' : 'green'}>{pending ? 'Pending approval' : 'Approved'}</Badge>
          {pending && canEdit && (
            <button className="btn-primary text-xs" onClick={() => setPending(false)}>
              {t('confirm')}
            </button>
          )}
        </div>
      </div>
      </>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`+ ${t('add')} — ${t('navM2')}`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>
              {t('cancel')}
            </button>
            <button className="btn-primary" onClick={submit}>
              {t('save')}
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="label">{t('name')}</label>
          <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="label">Email</label>
          <input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="label">{t('role')}</label>
          <select className="input" value={form.role || 'employee'} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {t(roleLabelKey(r))}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="label">{t('scope')}</label>
          <select
            className="input"
            value={form.scopeType || 'project'}
            onChange={(e) => setForm({ ...form, scopeType: e.target.value, scopeId: null })}
          >
            <option value="organization">{t('organization')}</option>
            <option value="project">{t('project')}</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="label">
            {form.scopeType === 'organization' ? t('organization') : t('project')}
          </label>
          <select className="input" value={form.scopeId || ''} onChange={(e) => setForm({ ...form, scopeId: e.target.value })}>
            <option value="">—</option>
            {(form.scopeType === 'organization' ? orgs : data.cmProjects.filter((p) => orgIds.has(p.orgId))).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}
