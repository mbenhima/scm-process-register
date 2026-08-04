import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { visibleOrganizations } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export default function Module1Page() {
  const { t } = useI18n()
  const { data, currentUser, addGroup, addOrganization, addMainProject, addCmProject } = useAppState()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})

  const orgs = visibleOrganizations(currentUser, data)

  function openModal(kind, defaults = {}) {
    setForm(defaults)
    setModal(kind)
  }
  function closeModal() {
    setModal(null)
    setForm({})
  }
  function submit() {
    if (modal === 'group') addGroup({ name: form.name })
    if (modal === 'org')
      addOrganization({
        groupId: form.groupId || null,
        name: form.name,
        sector: form.sector || 'manufacturing',
        employeeCount: Number(form.employeeCount) || 0,
        sites: (form.sites || '').split(',').map((s) => s.trim()).filter(Boolean),
        languages: (form.languages || 'en').split(',').map((s) => s.trim()),
      })
    if (modal === 'mp')
      addMainProject({
        orgId: form.orgId,
        name: form.name,
        type: form.type || 'erp',
        scope: form.scope || '',
        durationMonths: Number(form.durationMonths) || 6,
        budgetBand: form.budgetBand || '',
        executiveSponsor: form.executiveSponsor || '',
      })
    if (modal === 'cm')
      addCmProject({
        orgId: form.orgId,
        mainProjectId: form.mainProjectId || null,
        name: form.name,
        changeManager: form.changeManager || '',
        changeType: form.changeType || 'technology',
        targetPopulation: form.targetPopulation || '',
        businessDriver: form.businessDriver || '',
        successCriteria: form.successCriteria || '',
      })
    closeModal()
  }

  return (
    <div>
      <PageHeader
        title={t('navM1')}
        description="Group → Organization → Projects. Every Change Management Project carries an optional link to zero or one Main Project."
        actions={
          <>
            <button className="btn-secondary" onClick={() => openModal('group')}>
              + {t('group')}
            </button>
            <button className="btn-secondary" onClick={() => openModal('org')}>
              + {t('organization')}
            </button>
          </>
        }
      />

      <div className="space-y-4">
        {data.groups.map((g) => (
          <div key={g.id} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge tone="sand">{t('group')}</Badge>
              <h3 className="font-semibold text-brand-950">{g.name}</h3>
            </div>
          </div>
        ))}

        {orgs.map((org) => {
          const mps = data.mainProjects.filter((mp) => mp.orgId === org.id)
          const cms = data.cmProjects.filter((cm) => cm.orgId === org.id)
          const group = data.groups.find((g) => g.id === org.groupId)
          return (
            <div key={org.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge>{t('organization')}</Badge>
                    {group ? <Badge tone="sand">{group.name}</Badge> : <Badge tone="gray">{t('noGroup')}</Badge>}
                  </div>
                  <h3 className="font-semibold text-brand-950 text-lg mt-1">{org.name}</h3>
                  <p className="text-xs text-ink/50 mt-1">
                    {t(`sector_${org.sector}`)} · {org.employeeCount.toLocaleString()} employees · {org.sites?.length || 0} sites ·{' '}
                    {org.languages?.join(', ').toUpperCase()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost text-xs" onClick={() => openModal('mp', { orgId: org.id })}>
                    + {t('mainProject')}
                  </button>
                  <button className="btn-ghost text-xs" onClick={() => openModal('cm', { orgId: org.id })}>
                    + {t('cmProject')}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="label">{t('mainProject')}</div>
                  {mps.length === 0 && <EmptyState />}
                  <div className="space-y-2">
                    {mps.map((mp) => {
                      const linked = cms.filter((cm) => cm.mainProjectId === mp.id)
                      return (
                        <div key={mp.id} className="rounded-lg border border-brand-100 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-brand-950">{mp.name}</span>
                            <Badge tone="sand">{t(`archetype_${mp.type}`)}</Badge>
                          </div>
                          <p className="text-xs text-ink/50 mt-1">
                            {mp.durationMonths}mo · {mp.budgetBand} · {mp.executiveSponsor}
                          </p>
                          {linked.length > 0 && (
                            <p className="text-[11px] text-brand-600 mt-1">
                              ↳ {linked.length} linked CM project{linked.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <div className="label">{t('cmProject')}</div>
                  {cms.length === 0 && <EmptyState />}
                  <div className="space-y-2">
                    {cms.map((cm) => {
                      const mp = data.mainProjects.find((m) => m.id === cm.mainProjectId)
                      return (
                        <div key={cm.id} className="rounded-lg border border-brand-100 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-brand-950">{cm.name}</span>
                            <Badge tone="sand">{t(`lewin_${cm.lewinPhase}`)}</Badge>
                          </div>
                          <p className="text-xs text-ink/50 mt-1">{cm.changeManager}</p>
                          <p className="text-[11px] mt-1">{mp ? `↳ ${t('linkedMainProject')}: ${mp.name}` : `↳ ${t('standalone')}`}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={modal === 'group'}
        onClose={closeModal}
        title={`+ ${t('group')}`}
        footer={
          <>
            <button className="btn-ghost" onClick={closeModal}>
              {t('cancel')}
            </button>
            <button className="btn-primary" onClick={submit}>
              {t('save')}
            </button>
          </>
        }
      >
        <Field label={t('name')}>
          <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
      </Modal>

      <Modal
        open={modal === 'org'}
        onClose={closeModal}
        title={`+ ${t('organization')}`}
        footer={
          <>
            <button className="btn-ghost" onClick={closeModal}>
              {t('cancel')}
            </button>
            <button className="btn-primary" onClick={submit}>
              {t('save')}
            </button>
          </>
        }
      >
        <Field label={t('name')}>
          <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label={t('group')}>
          <select className="input" value={form.groupId || ''} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
            <option value="">{t('noGroup')}</option>
            {data.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('type')}>
          <select className="input" value={form.sector || 'manufacturing'} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
            <option value="manufacturing">{t('sector_manufacturing')}</option>
            <option value="logistics">{t('sector_logistics')}</option>
            <option value="health">{t('sector_health')}</option>
          </select>
        </Field>
        <Field label="Employees">
          <input
            type="number"
            className="input"
            value={form.employeeCount || ''}
            onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
          />
        </Field>
        <Field label="Sites (comma separated)">
          <input className="input" value={form.sites || ''} onChange={(e) => setForm({ ...form, sites: e.target.value })} />
        </Field>
        <Field label={`${t('language')} (en,fr,ar)`}>
          <input className="input" value={form.languages || 'en'} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
        </Field>
      </Modal>

      <Modal
        open={modal === 'mp'}
        onClose={closeModal}
        title={`+ ${t('mainProject')}`}
        footer={
          <>
            <button className="btn-ghost" onClick={closeModal}>
              {t('cancel')}
            </button>
            <button className="btn-primary" onClick={submit}>
              {t('save')}
            </button>
          </>
        }
      >
        <Field label={t('name')}>
          <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label={t('type')}>
          <select className="input" value={form.type || 'erp'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="erp">{t('archetype_erp')}</option>
            <option value="automation">{t('archetype_automation')}</option>
            <option value="qms">{t('archetype_qms')}</option>
            <option value="restructuring">Restructuring</option>
            <option value="ma">M&A</option>
          </select>
        </Field>
        <Field label={t('description')}>
          <textarea className="input" rows={2} value={form.scope || ''} onChange={(e) => setForm({ ...form, scope: e.target.value })} />
        </Field>
        <Field label={`${t('duration')} (months)`}>
          <input
            type="number"
            className="input"
            value={form.durationMonths || ''}
            onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
          />
        </Field>
        <Field label={t('budgetBand')}>
          <input className="input" value={form.budgetBand || ''} onChange={(e) => setForm({ ...form, budgetBand: e.target.value })} />
        </Field>
        <Field label={t('executiveSponsor')}>
          <input
            className="input"
            value={form.executiveSponsor || ''}
            onChange={(e) => setForm({ ...form, executiveSponsor: e.target.value })}
          />
        </Field>
      </Modal>

      <Modal
        open={modal === 'cm'}
        onClose={closeModal}
        title={`+ ${t('cmProject')}`}
        footer={
          <>
            <button className="btn-ghost" onClick={closeModal}>
              {t('cancel')}
            </button>
            <button className="btn-primary" onClick={submit}>
              {t('save')}
            </button>
          </>
        }
      >
        <Field label={t('name')}>
          <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label={t('linkedMainProject')}>
          <select
            className="input"
            value={form.mainProjectId || ''}
            onChange={(e) => setForm({ ...form, mainProjectId: e.target.value })}
          >
            <option value="">{t('standalone')}</option>
            {data.mainProjects.filter((mp) => mp.orgId === form.orgId).map((mp) => (
              <option key={mp.id} value={mp.id}>
                {mp.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('owner')}>
          <input
            className="input"
            value={form.changeManager || ''}
            onChange={(e) => setForm({ ...form, changeManager: e.target.value })}
          />
        </Field>
        <Field label={t('changeType')}>
          <select className="input" value={form.changeType || 'technology'} onChange={(e) => setForm({ ...form, changeType: e.target.value })}>
            <option value="technology">Technology</option>
            <option value="process">Process</option>
            <option value="structural">Structural</option>
            <option value="cultural">Cultural</option>
          </select>
        </Field>
        <Field label={t('targetPopulation')}>
          <input
            className="input"
            value={form.targetPopulation || ''}
            onChange={(e) => setForm({ ...form, targetPopulation: e.target.value })}
          />
        </Field>
        <Field label={t('businessDriver')}>
          <textarea
            className="input"
            rows={2}
            value={form.businessDriver || ''}
            onChange={(e) => setForm({ ...form, businessDriver: e.target.value })}
          />
        </Field>
      </Modal>
    </div>
  )
}
