import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { canManageHierarchy, canManageProcessGovernance, roleLabelKey } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import VersionHistoryPanel from '../components/VersionHistoryPanel.jsx'
import { RACSI_ROLES, RACSI_VALUES } from '../data/racsi.js'
import { COSO_COMPONENTS } from '../data/constants.js'
import { ALERT_SEVERITIES, CONTROL_TYPES, CONTROL_FREQUENCIES, CONTROL_STATUSES, RO_TYPES, RO_STATUSES } from '../data/processGovernanceSeed.js'
import processKnowledgeBase from '../data/processKnowledgeBase.js'
import { uid } from '../utils/id.js'

const KIND_TONE = { core: 'brand', loop: 'amber', type: 'green' }

function MacroProcessForm({ form, setForm, t }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <div className="space-y-3">
      <div>
        <label className="label">{t('m18_col_name')}</label>
        <input className="input" value={form.name} onChange={set('name')} />
      </div>
      <div>
        <label className="label">{t('m18_col_description')}</label>
        <textarea className="input" rows={3} value={form.description} onChange={set('description')} />
      </div>
      <div>
        <label className="label">{t('m18_owning_modules')}</label>
        <input className="input" value={form.primaryModules} onChange={set('primaryModules')} placeholder="M9, M13" />
      </div>
    </div>
  )
}

function MacroProcessTab({ data, canGovern }) {
  const { t, tv } = useI18n()
  const { addMacroProcess, updateMacroProcess, deleteMacroProcess, revertMacroProcess } = useAppState()
  const [editing, setEditing] = useState(null) // null | 'new' | mp
  const [form, setForm] = useState(null)
  const [historyFor, setHistoryFor] = useState(null)

  const openNew = () => {
    setEditing('new')
    setForm({ name: '', description: '', primaryModules: '' })
  }
  const openEdit = (mp) => {
    setEditing(mp)
    setForm({ name: tv(mp.name), description: tv(mp.description), primaryModules: (mp.primaryModules || []).join(', ') })
  }
  const save = () => {
    const patch = {
      name: { en: form.name, fr: form.name, ar: form.name },
      description: { en: form.description, fr: form.description, ar: form.description },
      primaryModules: form.primaryModules.split(',').map((s) => s.trim()).filter(Boolean),
    }
    if (editing === 'new') addMacroProcess(patch)
    else updateMacroProcess(editing.id, patch, t('m18_process_edited_note'))
    setEditing(null)
    setForm(null)
  }

  return (
    <div className="space-y-3">
      {canGovern && (
        <div className="flex justify-end">
          <button className="btn-primary text-xs py-1.5 px-3" onClick={openNew}>
            {t('m18_add_process')}
          </button>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-600 text-white text-xs uppercase tracking-wide font-semibold">
            <tr>
              <th className="text-start px-4 py-2.5">ID</th>
              <th className="text-start px-4 py-2.5">{t('m18_col_name')}</th>
              <th className="text-start px-4 py-2.5">{t('m18_col_description')}</th>
              <th className="text-start px-4 py-2.5">{t('m18_owning_modules')}</th>
              {canGovern && <th className="text-start px-4 py-2.5">{t('m18_actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {data.macroProcessCatalog.map((mp) => (
              <React.Fragment key={mp.id}>
                <tr className="border-t border-brand-50 align-top">
                  <td className="px-4 py-2.5 font-mono text-xs text-ink/60 whitespace-nowrap">{mp.id}</td>
                  <td className="px-4 py-2.5 font-medium text-brand-950 whitespace-nowrap">{tv(mp.name)}</td>
                  <td className="px-4 py-2.5 text-ink/60 max-w-lg">{tv(mp.description)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
                      {(mp.primaryModules || []).map((m) => (
                        <Badge key={m} tone="gray">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  {canGovern && (
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button className="btn-ghost text-[11px] py-0.5 px-2" onClick={() => openEdit(mp)}>
                          {t('edit')}
                        </button>
                        <button className="btn-ghost text-[11px] py-0.5 px-2" onClick={() => setHistoryFor(historyFor === mp.id ? null : mp.id)}>
                          {t('versionHistory')}
                        </button>
                        <button className="btn-ghost text-[11px] py-0.5 px-2 text-red-600" onClick={() => window.confirm(t('m18_delete_confirm')) && deleteMacroProcess(mp.id)}>
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                {historyFor === mp.id && (
                  <tr>
                    <td colSpan={5} className="px-4 pb-3">
                      <VersionHistoryPanel entity={mp} canRevert={canGovern} onRevert={(v) => revertMacroProcess(mp.id, v)} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t('m18_add_process') : t('edit')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              {t('cancel')}
            </button>
            <button className="btn-primary" onClick={save}>
              {t('save')}
            </button>
          </>
        }
      >
        {form && <MacroProcessForm form={form} setForm={setForm} t={t} />}
      </Modal>
    </div>
  )
}

function E2ECard({ e2e, macroById, phaseTemplateById }) {
  const { t, tv } = useI18n()
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="font-mono text-xs text-ink/60">{e2e.id}</span>
          <h3 className="font-semibold text-brand-950">{tv(e2e.name)}</h3>
        </div>
        <Badge tone={KIND_TONE[e2e.kind]}>{t(`m18_kind_${e2e.kind}`)}</Badge>
      </div>
      <div className="flex items-center flex-wrap gap-1 text-xs">
        {e2e.orderedMacroProcesses.map((mpId, i) => (
          <React.Fragment key={mpId}>
            {i > 0 && <span className="text-ink/30">→</span>}
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-800" title={tv(macroById[mpId]?.name)}>
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
            <strong className="text-ink/80">{t('m18_phase_template')}:</strong> {e2e.phaseTemplateId} — {tv(phaseTemplateById[e2e.phaseTemplateId]?.name)}
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

// D-Config item 8: a small BPMN-style flow builder — a Palette panel of
// available Macro Process "blocks" kept visually and structurally separate
// from the Canvas that renders the chosen chain, instead of the old
// e2e-tab text chips with no editing surface at all.
function FlowTab({ data, canGovern }) {
  const { t, tv } = useI18n()
  const { updateE2eProcessChain } = useAppState()
  const [selectedId, setSelectedId] = useState(data.e2eProcessCatalog[0]?.id || null)
  const selected = data.e2eProcessCatalog.find((e2e) => e2e.id === selectedId)
  const macroById = Object.fromEntries(data.macroProcessCatalog.map((mp) => [mp.id, mp]))

  const chain = selected?.orderedMacroProcesses || []
  const setChain = (next) => updateE2eProcessChain(selected.id, next)
  const addStep = (mpId) => setChain([...chain, mpId])
  const removeStep = (idx) => setChain(chain.filter((_, i) => i !== idx))
  const moveStep = (idx, dir) => {
    const next = [...chain]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setChain(next)
  }

  return (
    <div>
      <div className="mb-3">
        <label className="label">{t('m18_flow_select_chain')}</label>
        <select className="input max-w-md" value={selectedId || ''} onChange={(e) => setSelectedId(e.target.value)}>
          {data.e2eProcessCatalog.map((e2e) => (
            <option key={e2e.id} value={e2e.id}>
              {e2e.id} — {tv(e2e.name)}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <div className="grid md:grid-cols-[220px_1fr] gap-4">
          {/* Palette — deliberately its own panel, not mixed into the canvas */}
          <div className="card p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-2">{t('m18_flow_palette')}</h3>
            <div className="space-y-1.5">
              {data.macroProcessCatalog.map((mp) => (
                <button
                  key={mp.id}
                  disabled={!canGovern}
                  onClick={() => addStep(mp.id)}
                  className="w-full text-start text-xs px-2 py-1.5 rounded-lg border border-brand-100 bg-white hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={tv(mp.description)}
                >
                  <span className="font-mono text-ink/40">{mp.id}</span> {tv(mp.name)}
                </button>
              ))}
            </div>
            {!canGovern && <p className="text-[11px] text-ink/40 italic mt-2">{t('m18_flow_readonly')}</p>}
          </div>

          {/* Canvas — horizontal flow of the chain, separate from the palette */}
          <div className="card p-4 overflow-x-auto">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-3">{t('m18_flow_canvas')}</h3>
            {chain.length === 0 && <p className="text-sm text-ink/40 italic">{t('m18_flow_empty')}</p>}
            <div className="flex items-stretch gap-1 flex-wrap">
              {chain.map((mpId, idx) => (
                <React.Fragment key={`${mpId}-${idx}`}>
                  {idx > 0 && (
                    <div className="flex items-center text-brand-300 text-lg" aria-hidden>
                      →
                    </div>
                  )}
                  <div className="w-40 shrink-0 rounded-xl border-2 border-brand-200 bg-brand-50/60 p-2.5 flex flex-col gap-1">
                    <div className="font-mono text-[10px] text-brand-500">{mpId}</div>
                    <div className="text-xs font-medium text-brand-950 leading-snug">{tv(macroById[mpId]?.name)}</div>
                    {canGovern && (
                      <div className="flex gap-1 mt-1">
                        <button className="btn-ghost text-[10px] py-0.5 px-1.5" onClick={() => moveStep(idx, -1)} aria-label={t('m18_flow_move_left')}>
                          ←
                        </button>
                        <button className="btn-ghost text-[10px] py-0.5 px-1.5" onClick={() => moveStep(idx, 1)} aria-label={t('m18_flow_move_right')}>
                          →
                        </button>
                        <button className="btn-ghost text-[10px] py-0.5 px-1.5 text-red-600 ms-auto" onClick={() => removeStep(idx)}>
                          {t('delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RacsiTab({ data, canEdit }) {
  const { t, tv } = useI18n()
  const { updateRacsiCell } = useAppState()
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/50">{t('m18_racsi_legend')}</p>
      {!canEdit && <p className="text-xs text-ink/40 italic">{t('m18_racsi_readonly')}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-600 text-white text-xs uppercase tracking-wide font-semibold">
            <tr>
              <th className="text-start px-4 py-2.5">{t('m18_col_macroProcess')}</th>
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
                  <span className="font-mono text-xs text-ink/60">{mp.id}</span> {tv(mp.name)}
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

const GOV_FORM_BLANK = {
  alerts: { name: '', condition: '', severity: 'medium' },
  businessRules: { name: '', description: '', trigger: '', action: '', owner: '' },
  controls: { name: '', description: '', cosoComponent: 'control_activities', controlType: 'detective', frequency: 'monthly', status: 'effective', owner: '' },
  kpis: { name: '', description: '', target: '', unit: '', owner: '' },
  reports: { name: '', description: '', audience: '', format: 'dashboard', owner: '' },
  risksOpportunities: { type: 'risk', description: '', likelihood: 3, impact: 3, owner: '', status: 'open' },
}

function GovKindPanel({ mpId, kind, items, canGovern }) {
  const { t } = useI18n()
  const { addProcessGovernanceItem, updateProcessGovernanceItem, deleteProcessGovernanceItem } = useAppState()
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [form, setForm] = useState(null)

  const openNew = () => {
    setEditing('new')
    setForm({ ...GOV_FORM_BLANK[kind] })
  }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ ...item })
  }
  const save = () => {
    if (editing === 'new') addProcessGovernanceItem(mpId, kind, form)
    else updateProcessGovernanceItem(mpId, kind, editing.id, form)
    setEditing(null)
    setForm(null)
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50">{t(`gov_kind_${kind}`)}</h4>
        {canGovern && (
          <button className="btn-ghost text-[11px] py-0.5 px-2" onClick={openNew}>
            + {t('add')}
          </button>
        )}
      </div>
      {items.length === 0 && <p className="text-xs text-ink/40 italic">{t('gov_none_yet')}</p>}
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="border-t border-brand-50 pt-2 first:border-0 first:pt-0 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-brand-900">
                {kind === 'risksOpportunities' ? <Badge tone={it.type === 'risk' ? 'red' : 'green'}>{t(`ro_type_${it.type}`)}</Badge> : it.name}
              </div>
              {canGovern && (
                <div className="flex gap-1 shrink-0">
                  <button className="btn-ghost text-[10px] py-0.5 px-1.5" onClick={() => openEdit(it)}>
                    {t('edit')}
                  </button>
                  <button className="btn-ghost text-[10px] py-0.5 px-1.5 text-red-600" onClick={() => deleteProcessGovernanceItem(mpId, kind, it.id)}>
                    {t('delete')}
                  </button>
                </div>
              )}
            </div>
            {kind === 'alerts' && (
              <p className="text-ink/60 mt-0.5">
                <Badge tone={it.severity === 'critical' || it.severity === 'high' ? 'red' : it.severity === 'medium' ? 'amber' : 'gray'}>{it.severity}</Badge> {it.condition}
              </p>
            )}
            {kind === 'businessRules' && (
              <p className="text-ink/60 mt-0.5">
                {it.description} <span className="text-ink/40">— {t('gov_owner')}: {it.owner}</span>
              </p>
            )}
            {kind === 'controls' && (
              <p className="text-ink/60 mt-0.5">
                <Badge tone="gray">{it.cosoComponent}</Badge> <Badge tone={it.status === 'effective' ? 'green' : it.status === 'needs_review' ? 'amber' : 'red'}>{it.status}</Badge> {it.description}
              </p>
            )}
            {kind === 'kpis' && (
              <p className="text-ink/60 mt-0.5">
                {it.description} <span className="text-ink/40">— {t('gov_target')}: {it.target} {it.unit}</span>
              </p>
            )}
            {kind === 'reports' && (
              <p className="text-ink/60 mt-0.5">
                {it.description} <span className="text-ink/40">— {Array.isArray(it.audience) ? it.audience.join(', ') : it.audience} · {it.format}</span>
              </p>
            )}
            {kind === 'risksOpportunities' && (
              <p className="text-ink/60 mt-0.5">
                {it.description} <span className="text-ink/40">— L{it.likelihood}×I{it.impact} · {it.status}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={t(`gov_kind_${kind}`)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              {t('cancel')}
            </button>
            <button className="btn-primary" onClick={save}>
              {t('save')}
            </button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            {kind !== 'risksOpportunities' && (
              <div>
                <label className="label">{t('gov_name')}</label>
                <input className="input" value={form.name} onChange={set('name')} />
              </div>
            )}
            {kind === 'alerts' && (
              <>
                <div>
                  <label className="label">{t('gov_condition')}</label>
                  <textarea className="input" rows={2} value={form.condition} onChange={set('condition')} />
                </div>
                <div>
                  <label className="label">{t('gov_severity')}</label>
                  <select className="input" value={form.severity} onChange={set('severity')}>
                    {ALERT_SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {(kind === 'businessRules' || kind === 'kpis' || kind === 'reports') && (
              <div>
                <label className="label">{t('gov_description')}</label>
                <textarea className="input" rows={2} value={form.description} onChange={set('description')} />
              </div>
            )}
            {kind === 'businessRules' && (
              <>
                <div>
                  <label className="label">{t('gov_trigger')}</label>
                  <input className="input" value={form.trigger} onChange={set('trigger')} />
                </div>
                <div>
                  <label className="label">{t('gov_action')}</label>
                  <input className="input" value={form.action} onChange={set('action')} />
                </div>
              </>
            )}
            {kind === 'controls' && (
              <>
                <div>
                  <label className="label">{t('gov_description')}</label>
                  <textarea className="input" rows={2} value={form.description} onChange={set('description')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t('gov_coso_component')}</label>
                    <select className="input" value={form.cosoComponent} onChange={set('cosoComponent')}>
                      {COSO_COMPONENTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('gov_control_type')}</label>
                    <select className="input" value={form.controlType} onChange={set('controlType')}>
                      {CONTROL_TYPES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('gov_frequency')}</label>
                    <select className="input" value={form.frequency} onChange={set('frequency')}>
                      {CONTROL_FREQUENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('gov_status')}</label>
                    <select className="input" value={form.status} onChange={set('status')}>
                      {CONTROL_STATUSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
            {kind === 'kpis' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t('gov_target')}</label>
                  <input className="input" value={form.target} onChange={set('target')} />
                </div>
                <div>
                  <label className="label">{t('gov_unit')}</label>
                  <input className="input" value={form.unit} onChange={set('unit')} />
                </div>
              </div>
            )}
            {kind === 'reports' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t('gov_audience')}</label>
                  <input className="input" value={form.audience} onChange={set('audience')} />
                </div>
                <div>
                  <label className="label">{t('gov_format')}</label>
                  <input className="input" value={form.format} onChange={set('format')} />
                </div>
              </div>
            )}
            {kind === 'risksOpportunities' && (
              <>
                <div>
                  <label className="label">{t('gov_type')}</label>
                  <select className="input" value={form.type} onChange={set('type')}>
                    {RO_TYPES.map((tp) => (
                      <option key={tp} value={tp}>
                        {t(`ro_type_${tp}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('gov_description')}</label>
                  <textarea className="input" rows={2} value={form.description} onChange={set('description')} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">{t('gov_likelihood')}</label>
                    <input type="number" min={1} max={5} className="input" value={form.likelihood} onChange={set('likelihood')} />
                  </div>
                  <div>
                    <label className="label">{t('gov_impact')}</label>
                    <input type="number" min={1} max={5} className="input" value={form.impact} onChange={set('impact')} />
                  </div>
                  <div>
                    <label className="label">{t('gov_status')}</label>
                    <select className="input" value={form.status} onChange={set('status')}>
                      {RO_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
            {kind !== 'alerts' && kind !== 'risksOpportunities' && (
              <div>
                <label className="label">{t('gov_owner')}</label>
                <input className="input" value={form.owner} onChange={set('owner')} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function GovernanceTab({ data, canGovern }) {
  const { t, tv } = useI18n()
  const [selectedId, setSelectedId] = useState(data.macroProcessCatalog[0]?.id || null)
  const selected = data.macroProcessCatalog.find((mp) => mp.id === selectedId)
  const bucket = data.processGovernance?.[selectedId] || { alerts: [], businessRules: [], controls: [], kpis: [], reports: [], risksOpportunities: [] }
  const kb = processKnowledgeBase.find((k) => k.mpId === selectedId)

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-4">
      <div className="card p-3 h-fit">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-2">{t('m18_tab_macro')}</h3>
        <div className="space-y-1">
          {data.macroProcessCatalog.map((mp) => (
            <button
              key={mp.id}
              onClick={() => setSelectedId(mp.id)}
              className={`w-full text-start text-xs px-2 py-1.5 rounded-lg ${selectedId === mp.id ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 text-ink/70'}`}
            >
              <span className="font-mono opacity-60">{mp.id}</span> {tv(mp.name)}
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <div className="space-y-4">
          {kb && (
            <div className="card p-3 bg-brand-50/40">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1">{t('gov_kb_heading')}</h4>
              <p className="text-sm font-medium text-brand-950">{tv(kb.title)}</p>
              <p className="text-xs text-ink/60 mt-1">{tv(kb.body)}</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            <GovKindPanel mpId={selectedId} kind="alerts" items={bucket.alerts} canGovern={canGovern} />
            <GovKindPanel mpId={selectedId} kind="businessRules" items={bucket.businessRules} canGovern={canGovern} />
            <GovKindPanel mpId={selectedId} kind="controls" items={bucket.controls} canGovern={canGovern} />
            <GovKindPanel mpId={selectedId} kind="kpis" items={bucket.kpis} canGovern={canGovern} />
            <GovKindPanel mpId={selectedId} kind="reports" items={bucket.reports} canGovern={canGovern} />
            <GovKindPanel mpId={selectedId} kind="risksOpportunities" items={bucket.risksOpportunities} canGovern={canGovern} />
          </div>
        </div>
      )}
    </div>
  )
}

function Content() {
  const { t } = useI18n()
  const { data, currentUser } = useAppState()
  const canEdit = canManageHierarchy(currentUser?.role, data.rolePermissions)
  const canGovern = canManageProcessGovernance(currentUser?.role, data.rolePermissions)
  const [tab, setTab] = useState('macro')

  return (
    <div>
      <PageHeader title={t('m18_title')} description={t('m18_desc')} />
      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={`tab ${tab === 'macro' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('macro')}>
          {t('m18_tab_macro')}
        </button>
        <button className={`tab ${tab === 'e2e' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('e2e')}>
          {t('m18_tab_e2e')}
        </button>
        <button className={`tab ${tab === 'flow' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('flow')}>
          {t('m18_tab_flow')}
        </button>
        <button className={`tab ${tab === 'racsi' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('racsi')}>
          {t('m18_tab_racsi')}
        </button>
        <button className={`tab ${tab === 'governance' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('governance')}>
          {t('m18_tab_governance')}
        </button>
      </div>
      {tab === 'macro' && <MacroProcessTab data={data} canGovern={canGovern} />}
      {tab === 'e2e' && <E2ETab data={data} />}
      {tab === 'flow' && <FlowTab data={data} canGovern={canGovern} />}
      {tab === 'racsi' && <RacsiTab data={data} canEdit={canEdit} />}
      {tab === 'governance' && <GovernanceTab data={data} canGovern={canGovern} />}
    </div>
  )
}

export default function Module18Page() {
  return <Content />
}
