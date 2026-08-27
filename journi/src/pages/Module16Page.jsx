import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedOrg, useScopedProject } from '../utils/useScoped.js'
import { canActivateAiForOrg, canRequestProjectAiOverride, canManageAiUseCases } from '../utils/rbac.js'
import { PROVIDERS, MODEL_OPTIONS, recommendedModel, providerLabel } from '../utils/llmProviders.js'
import { AI_TIERS } from '../data/constants.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import VersionHistoryPanel from '../components/VersionHistoryPanel.jsx'

const OUTCOME_TONE = { accepted: 'green', edited: 'amber', rejected: 'red' }
const TIER_OPTIONS = Object.values(AI_TIERS)
const BLANK_USE_CASE = {
  name: '', tier: AI_TIERS.ASSISTIVE, module: '', moduleLabel: '', description: '', trigger: '', output: '', humanCheckpoint: '',
}

function UseCaseForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <div className="space-y-3">
      <input className="input" placeholder="Use case name" value={form.name} onChange={set('name')} />
      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={form.tier} onChange={set('tier')}>
          {TIER_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input className="input" placeholder="Module code (e.g. M4)" value={form.module} onChange={set('module')} />
      </div>
      <input className="input" placeholder="Module label (e.g. M4 Stakeholder & Impact Mapping)" value={form.moduleLabel} onChange={set('moduleLabel')} />
      <textarea className="input" rows={2} placeholder="Description" value={form.description} onChange={set('description')} />
      <textarea className="input" rows={2} placeholder="Trigger input" value={form.trigger} onChange={set('trigger')} />
      <textarea className="input" rows={2} placeholder="Output" value={form.output} onChange={set('output')} />
      <textarea className="input" rows={2} placeholder="Human checkpoint" value={form.humanCheckpoint} onChange={set('humanCheckpoint')} />
    </div>
  )
}

function ProviderConnectionPanel({ canEdit }) {
  const { llmConfig, setLlmConfig, testAndConnectLlm, disconnectLlm } = useAppState()
  const [testing, setTesting] = useState(false)
  const providerMeta = PROVIDERS.find((p) => p.id === llmConfig.provider)
  const modelOptions = MODEL_OPTIONS[llmConfig.provider] || []
  const isKnownModel = modelOptions.some((m) => m.id === llmConfig.model)
  const showCustomModelInput = modelOptions.length === 0 || !isKnownModel

  async function handleConnect() {
    setTesting(true)
    await testAndConnectLlm()
    setTesting(false)
  }

  function handleProviderChange(providerId) {
    setLlmConfig({ provider: providerId, model: recommendedModel(providerId) })
  }

  function handleModelSelect(value) {
    if (value === '__custom__') {
      setLlmConfig({ model: '' })
    } else {
      setLlmConfig({ model: value })
    }
  }

  return (
    <div className="card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-brand-950 text-sm">LLM Provider Connection</h3>
        {llmConfig.connected ? (
          <Badge tone="green">Connected — {providerLabel(llmConfig.provider)} ({llmConfig.model || providerMeta?.defaultModel})</Badge>
        ) : (
          <Badge tone="gray">Not connected — using built-in example generators</Badge>
        )}
      </div>
      <p className="text-xs text-ink/50">
        journi has no backend: connecting sends your API key and every generated prompt directly from this browser to the
        provider you choose. The key is stored only in this browser's local storage — never in the seeded demo data, and never
        cleared by "Reset Demo Data." Do not use a production key on a shared or public machine. Once connected, every AI Use
        Case across the app calls this provider instead of its canned example text; the review/accept/edit/reject checkpoint is
        unchanged either way.
      </p>

      {!canEdit ? (
        <p className="text-xs text-ink/40 italic">Only an Organization Admin or broader can configure this.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Provider</label>
            <select className="input" value={llmConfig.provider} onChange={(e) => handleProviderChange(e.target.value)}>
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Model</label>
            {modelOptions.length > 0 && (
              <select className="input" value={showCustomModelInput ? '__custom__' : llmConfig.model} onChange={(e) => handleModelSelect(e.target.value)}>
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                    {m.recommended ? ' (recommended for journi)' : ''}
                  </option>
                ))}
                <option value="__custom__">Custom…</option>
              </select>
            )}
            {showCustomModelInput && (
              <input
                className="input mt-1.5"
                placeholder="model id"
                value={llmConfig.model}
                onChange={(e) => setLlmConfig({ model: e.target.value })}
              />
            )}
          </div>
          {llmConfig.provider === 'custom' && (
            <div>
              <label className="label">Base URL</label>
              <input
                className="input"
                placeholder="https://your-endpoint.example.com/v1"
                value={llmConfig.baseUrl}
                onChange={(e) => setLlmConfig({ baseUrl: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="label">API Key</label>
            <input
              className="input"
              type="password"
              placeholder={providerMeta?.keyPlaceholder}
              value={llmConfig.apiKey}
              onChange={(e) => setLlmConfig({ apiKey: e.target.value })}
            />
          </div>
        </div>
      )}

      {canEdit && (
        <div className="flex items-center gap-2 flex-wrap">
          {!llmConfig.connected ? (
            <button className="btn-primary text-xs" onClick={handleConnect} disabled={testing}>
              {testing ? 'Testing connection…' : 'Connect'}
            </button>
          ) : (
            <button className="btn-danger text-xs" onClick={disconnectLlm}>
              Disconnect
            </button>
          )}
          {llmConfig.lastError && <span className="text-xs text-red-600">{llmConfig.lastError}</span>}
        </div>
      )}
    </div>
  )
}

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

export default function Module16Page() {
  const { t } = useI18n()
  const { data, currentUser, toggleAiOrgActivation, toggleAiProjectOverride, addAiUseCase, updateAiUseCase, deleteAiUseCase, revertAiUseCase } = useAppState()
  const org = useScopedOrg()
  const project = useScopedProject()
  const [tab, setTab] = useState('catalog')
  const [modal, setModal] = useState(null) // { mode: 'add' | 'edit', useCaseId? }
  const [form, setForm] = useState(BLANK_USE_CASE)
  const [historyId, setHistoryId] = useState(null)

  const canOrgToggle = canActivateAiForOrg(currentUser?.role, data.rolePermissions)
  const canProjectToggle = canRequestProjectAiOverride(currentUser?.role, data.rolePermissions)
  const canManage = canManageAiUseCases(currentUser?.role, data.rolePermissions)

  function openAdd() {
    setForm(BLANK_USE_CASE)
    setModal({ mode: 'add' })
  }
  function openEdit(uc) {
    setForm({ ...BLANK_USE_CASE, ...uc })
    setModal({ mode: 'edit', useCaseId: uc.id })
  }
  function submit() {
    if (!form.name.trim()) return
    if (modal.mode === 'add') addAiUseCase(form)
    else updateAiUseCase(modal.useCaseId, form)
    setModal(null)
  }

  return (
    <div>
      <PageHeader title={t('m16_title')} description={t('m16_desc')} />

      <ProviderConnectionPanel canEdit={canOrgToggle} />

      <div className="flex gap-2 mb-4 items-center justify-between flex-wrap">
        <div className="flex gap-2">
          <button className={`tab ${tab === 'catalog' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('catalog')}>
            Catalog & Governance
          </button>
          <button className={`tab ${tab === 'log' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('log')}>
            {t('usageLog')}
          </button>
        </div>
        {tab === 'catalog' && canManage && (
          <button className="btn-primary text-xs" onClick={openAdd}>
            + Add AI Use Case
          </button>
        )}
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
                        <Badge tone="gray">v{uc.version || 1}</Badge>
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
                      {canManage && (
                        <div className="flex items-center gap-2 mt-2">
                          <button className="btn-secondary text-xs" onClick={() => openEdit(uc)}>{t('m19_edit')}</button>
                          <button className="btn-ghost text-xs" onClick={() => setHistoryId(historyId === uc.id ? null : uc.id)}>
                            {historyId === uc.id ? 'Hide history' : `History (${(uc.versionHistory || []).length + 1})`}
                          </button>
                          <button className="text-ink/30 hover:text-red-600 text-xs" onClick={() => deleteAiUseCase(uc.id)}>{t('delete')}</button>
                        </div>
                      )}
                      {historyId === uc.id && (
                        <div className="mt-2">
                          <VersionHistoryPanel entity={uc} canRevert={canManage} onRevert={(v) => revertAiUseCase(uc.id, v)} />
                        </div>
                      )}
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

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? '+ Add AI Use Case' : t('m19_edit')}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(null)}>{t('cancel')}</button>
            <button className="btn-primary" onClick={submit}>{t('save')}</button>
          </>
        }
      >
        {modal && <UseCaseForm form={form} setForm={setForm} />}
      </Modal>

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
