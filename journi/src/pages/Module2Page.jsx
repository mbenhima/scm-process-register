import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { visibleOrganizations, roleLabelKey } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'

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

export default function Module2Page() {
  const { t } = useI18n()
  const { data, currentUser, addUser, updateUser, removeUser } = useAppState()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [pending, setPending] = useState(true)

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
          <button className="btn-primary" onClick={() => setModal(true)}>
            + {t('add')}
          </button>
        }
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-4 py-2.5">{t('name')}</th>
              <th className="text-start px-4 py-2.5">{t('role')}</th>
              <th className="text-start px-4 py-2.5">{t('scope')}</th>
              <th className="text-start px-4 py-2.5">{t('language')}</th>
              <th className="text-start px-4 py-2.5">{t('actions')}</th>
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
                  </td>
                  <td className="px-4 py-2.5 text-ink/60">
                    <Badge tone="sand">{u.scopeType}</Badge> {scopeLabel}
                  </td>
                  <td className="px-4 py-2.5 uppercase text-xs text-ink/50">{u.language}</td>
                  <td className="px-4 py-2.5">
                    <button className="btn-danger text-xs" onClick={() => removeUser(u.id)}>
                      {t('delete')}
                    </button>
                  </td>
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
          {pending && (
            <button className="btn-primary text-xs" onClick={() => setPending(false)}>
              {t('confirm')}
            </button>
          )}
        </div>
      </div>

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
