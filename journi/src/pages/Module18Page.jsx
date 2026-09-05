import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { canManageHierarchy, roleLabelKey } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import { RACSI_ROLES, RACSI_VALUES } from '../data/racsi.js'

const KIND_TONE = { core: 'brand', loop: 'amber', type: 'green' }

function MacroProcessTab({ data }) {
  const { t } = useI18n()
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-start px-4 py-2.5">ID</th>
            <th className="text-start px-4 py-2.5">Name</th>
            <th className="text-start px-4 py-2.5">Description</th>
            <th className="text-start px-4 py-2.5">{t('m18_owning_modules')}</th>
          </tr>
        </thead>
        <tbody>
          {data.macroProcessCatalog.map((mp) => (
            <tr key={mp.id} className="border-t border-brand-50 align-top">
              <td className="px-4 py-2.5 font-mono text-xs text-brand-700 whitespace-nowrap">{mp.id}</td>
              <td className="px-4 py-2.5 font-medium text-brand-950 whitespace-nowrap">{mp.name}</td>
              <td className="px-4 py-2.5 text-ink/60 max-w-lg">{mp.description}</td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                <div className="flex gap-1 flex-wrap">
                  {mp.primaryModules.map((m) => (
                    <Badge key={m} tone="gray">
                      {m}
                    </Badge>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function E2ECard({ e2e, macroById, phaseTemplateById }) {
  const { t } = useI18n()
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="font-mono text-xs text-brand-700">{e2e.id}</span>
          <h3 className="font-semibold text-brand-950">{e2e.name}</h3>
        </div>
        <Badge tone={KIND_TONE[e2e.kind]}>{t(`m18_kind_${e2e.kind}`)}</Badge>
      </div>
      <div className="flex items-center flex-wrap gap-1 text-xs">
        {e2e.orderedMacroProcesses.map((mpId, i) => (
          <React.Fragment key={mpId}>
            {i > 0 && <span className="text-ink/30">→</span>}
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-800" title={macroById[mpId]?.name}>
              {mpId}
            </span>
          </React.Fragment>
        ))}
      </div>
      {e2e.trigger && (
        <p className="text-xs text-ink/60">
          <strong className="text-ink/80">{t('m18_trigger')}:</strong> {e2e.trigger}
        </p>
      )}
      {e2e.terminalState && (
        <p className="text-xs text-ink/60">
          <strong className="text-ink/80">{t('m18_terminal')}:</strong> {e2e.terminalState}
        </p>
      )}
      {e2e.note && <p className="text-xs text-ink/40 italic">{e2e.note}</p>}
      {e2e.racsi && (
        <p className="text-xs text-ink/60">
          <strong className="text-ink/80">{t('m18_chain_racsi')}:</strong> R={e2e.racsi.R} · A={e2e.racsi.A} · C={e2e.racsi.C} · S=
          {e2e.racsi.S} · I={e2e.racsi.I}
        </p>
      )}
      {e2e.kind === 'type' && (
        <div className="grid sm:grid-cols-2 gap-2 pt-1 text-xs">
          <p className="text-ink/60">
            <strong className="text-ink/80">{t('m18_sipoc_supplier')}:</strong> {e2e.sipocSupplier.join(', ')}
          </p>
          <p className="text-ink/60">
            <strong className="text-ink/80">{t('m18_sipoc_customer')}:</strong> {e2e.sipocCustomer.join(', ')}
          </p>
          <p className="text-ink/60 sm:col-span-2">
            <strong className="text-ink/80">{t('m18_phase_template')}:</strong> {e2e.phaseTemplateId} — {phaseTemplateById[e2e.phaseTemplateId]?.name}
          </p>
        </div>
      )}
      {e2e.relatedModules && (
        <div className="flex gap-1 flex-wrap pt-1">
          {e2e.relatedModules.map((m) => (
            <Badge key={m} tone="gray">
              {m}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function E2ETab({ data }) {
  const macroById = Object.fromEntries(data.macroProcessCatalog.map((mp) => [mp.id, mp]))
  const phaseTemplateById = Object.fromEntries(data.phaseTemplateCatalog.map((tpl) => [tpl.id, tpl]))
  const kinds = ['core', 'loop', 'type']
  const { t } = useI18n()
  return (
    <div className="space-y-6">
      {kinds.map((kind) => (
        <div key={kind}>
          <h3 className="text-sm font-semibold text-brand-950 mb-2">{t(`m18_kind_${kind}`)}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {data.e2eProcessCatalog
              .filter((e2e) => e2e.kind === kind)
              .map((e2e) => (
                <E2ECard key={e2e.id} e2e={e2e} macroById={macroById} phaseTemplateById={phaseTemplateById} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RacsiTab({ data, canEdit }) {
  const { t } = useI18n()
  const { updateRacsiCell } = useAppState()
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/50">{t('m18_racsi_legend')}</p>
      {!canEdit && <p className="text-xs text-ink/40 italic">{t('m18_racsi_readonly')}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-4 py-2.5">Macro Process</th>
              {RACSI_ROLES.map((role) => (
                <th key={role} className="text-start px-3 py-2.5 whitespace-nowrap">
                  {t(roleLabelKey(role))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.macroProcessCatalog.map((mp) => (
              <tr key={mp.id} className="border-t border-brand-50">
                <td className="px-4 py-2.5 font-medium text-brand-950 whitespace-nowrap">
                  <span className="font-mono text-xs text-brand-700">{mp.id}</span> {mp.name}
                </td>
                {RACSI_ROLES.map((role) => {
                  const value = data.racsiGrid[mp.id]?.[role] || ''
                  return (
                    <td key={role} className="px-3 py-2.5">
                      {canEdit ? (
                        <select className="input py-1 text-xs" value={value} onChange={(e) => updateRacsiCell(mp.id, role, e.target.value)}>
                          {RACSI_VALUES.map((v) => (
                            <option key={v} value={v}>
                              {v || '—'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-ink/70">{value || '—'}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Content() {
  const { t } = useI18n()
  const { data, currentUser } = useAppState()
  const canEdit = canManageHierarchy(currentUser?.role, data.rolePermissions)
  const [tab, setTab] = useState('macro')

  return (
    <div>
      <PageHeader title={t('m18_title')} description={t('m18_desc')} />
      <div className="flex gap-2 mb-4">
        <button className={`tab ${tab === 'macro' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('macro')}>
          {t('m18_tab_macro')}
        </button>
        <button className={`tab ${tab === 'e2e' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('e2e')}>
          {t('m18_tab_e2e')}
        </button>
        <button className={`tab ${tab === 'racsi' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('racsi')}>
          {t('m18_tab_racsi')}
        </button>
      </div>
      {tab === 'macro' && <MacroProcessTab data={data} />}
      {tab === 'e2e' && <E2ETab data={data} />}
      {tab === 'racsi' && <RacsiTab data={data} canEdit={canEdit} />}
    </div>
  )
}

export default function Module18Page() {
  return <Content />
}
