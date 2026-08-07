import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedOrg, useScopedProject } from '../utils/useScoped.js'
import { canActivateAiForOrg, canRequestProjectAiOverride } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'

const OUTCOME_TONE = { accepted: 'green', edited: 'amber', rejected: 'red' }

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

export default function Module17Page() {
  const { t } = useI18n()
  const { data, currentUser, toggleAiOrgActivation, toggleAiProjectOverride } = useAppState()
  const org = useScopedOrg()
  const project = useScopedProject()
  const [tab, setTab] = useState('catalog')

  const canOrgToggle = canActivateAiForOrg(currentUser?.role)
  const canProjectToggle = canRequestProjectAiOverride(currentUser?.role)

  return (
    <div>
      <PageHeader title={t('m17_title')} description={t('m17_desc')} />

      <div className="flex gap-2 mb-4">
        <button className={`tab ${tab === 'catalog' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('catalog')}>
          Catalog & Governance
        </button>
        <button className={`tab ${tab === 'log' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('log')}>
          {t('usageLog')}
        </button>
      </div>

      {tab === 'catalog' && (
        <div className="space-y-3">
          {!org && <div className="card p-4 text-sm text-ink/50">{t('selectOrg')}</div>}
          {org &&
            data.aiUseCaseCatalog.map((uc) => {
              const orgActive = data.aiOrgActivation[org.id]?.[uc.id]
              const override = project ? data.aiProjectOverride[project.id]?.[uc.id] : undefined
              const effective = project ? (override ?? orgActive) : orgActive
              return (
                <div key={uc.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-brand-950">{uc.name}</h4>
                        <Badge tone={uc.tier === 'augmented' ? 'sand' : 'brand'}>{t(`tier_${uc.tier}`)}</Badge>
                        <Badge tone="gray">{uc.moduleLabel}</Badge>
                      </div>
                      <p className="text-sm text-ink/70">{uc.description}</p>
                      <div className="grid sm:grid-cols-2 gap-2 mt-2 text-xs text-ink/50">
                        <div>
                          <strong className="text-ink/70">{t('triggerInput')}:</strong> {uc.trigger}
                        </div>
                        <div>
                          <strong className="text-ink/70">{t('output')}:</strong> {uc.output}
                        </div>
                      </div>
                      <div className="mt-2 text-xs rounded-lg bg-brand-50/60 px-2 py-1.5 text-brand-800">
                        <strong>{t('humanCheckpoint')}:</strong> {uc.humanCheckpoint}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink/50">{t('activateForOrg')}</span>
                        <Toggle checked={!!orgActive} disabled={!canOrgToggle} onChange={() => toggleAiOrgActivation(org.id, uc.id)} />
                      </div>
                      {project && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink/50">
                            {t('activateForProject')}
                            {override === undefined && <em className="not-italic text-ink/30"> (inherited)</em>}
                          </span>
                          <Toggle
                            checked={effective}
                            disabled={!canProjectToggle}
                            onChange={(v) => toggleAiProjectOverride(project.id, uc.id, v)}
                          />
                        </div>
                      )}
                      <Badge tone={effective ? 'green' : 'gray'}>{effective ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {tab === 'log' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-start px-4 py-2.5">AI Use Case</th>
                <th className="text-start px-4 py-2.5">{t('output')}</th>
                <th className="text-start px-4 py-2.5">{t('owner')}</th>
                <th className="text-start px-4 py-2.5">{t('status')}</th>
                <th className="text-start px-4 py-2.5">{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {data.aiUsageLog
                .filter((l) => !org || l.orgId === org.id)
                .slice(0, 60)
                .map((l) => {
                  const uc = data.aiUseCaseCatalog.find((u) => u.id === l.useCaseId)
                  return (
                    <tr key={l.id} className="border-t border-brand-50">
                      <td className="px-4 py-2.5 font-medium text-brand-950">{uc?.name}</td>
                      <td className="px-4 py-2.5 max-w-sm text-ink/60 truncate">{l.outputSummary}</td>
                      <td className="px-4 py-2.5 text-ink/60">{l.user}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={OUTCOME_TONE[l.outcome]}>{t(`outcome_${l.outcome}`)}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-ink/40 text-xs">{l.timestamp}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
