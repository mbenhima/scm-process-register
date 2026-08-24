import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedOrg } from '../utils/useScoped.js'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import JustifyPanel from '../components/JustifyPanel.jsx'
import { RESISTANCE_TYPES } from '../data/constants.js'
import { severityColor } from '../utils/compute.js'
import { canWrite } from '../utils/rbac.js'

const STATUS_TONE = { open: 'red', in_progress: 'amber', closed: 'green' }
const STATUS_LABEL = { open: 'open', in_progress: 'in progress', closed: 'closed' }

function CodingWorkbenchTab({ project, canManage }) {
  const { t } = useI18n()
  const { data, addCode, removeCode, tagItem, removeCodeTag } = useAppState()
  const org = useScopedOrg()
  const codebook = (org && data.codebooks[org.id]) || []
  const [newCode, setNewCode] = useState({ label: '', description: '' })
  const [tagSource, setTagSource] = useState(null) // { sourceType, sourceId }
  const [tagCodeId, setTagCodeId] = useState('')
  const [tagLinkId, setTagLinkId] = useState('')

  const codeTags = project.codeTags || []
  const codeById = Object.fromEntries(codebook.map((c) => [c.id, c]))
  const frequency = codebook
    .map((c) => ({ code: c, count: codeTags.filter((tg) => tg.codeId === c.id).length }))
    .sort((a, b) => b.count - a.count)

  const taggableNotes = [
    ...project.coachingNotes.map((n) => ({ sourceType: 'coaching', sourceId: n.id, label: `${n.managerName} → ${n.cohort}`, text: n.note })),
    ...project.resistanceLog.map((r) => ({ sourceType: 'resistance', sourceId: r.id, label: t(`resistance_${r.type}`), text: r.rootCause })),
  ]

  function openTag(source) {
    setTagSource(source)
    setTagCodeId(codebook[0]?.id || '')
    setTagLinkId('')
  }

  function submitTag() {
    if (!tagCodeId || !tagSource) return
    tagItem(project.id, {
      codeId: tagCodeId,
      sourceType: tagSource.sourceType,
      sourceId: tagSource.sourceId,
      linkedResistanceId: tagSource.sourceType === 'coaching' ? tagLinkId || null : null,
    })
    setTagSource(null)
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink/50">{t('m11_qcw_desc')}</p>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-1 text-sm">{t('m11_qcw_codebook')}</h3>
        <p className="text-xs text-ink/40 mb-3">{t('m11_qcw_codebook_desc')}</p>
        {!org && <p className="text-xs text-ink/40 italic">{t('selectOrg')}</p>}
        {org && (
          <>
            <div className="space-y-1.5 mb-3">
              {codebook.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 rounded-lg border border-brand-100 p-2">
                  <div>
                    <span className="font-mono text-xs text-brand-700">{c.label}</span>
                    <p className="text-xs text-ink/50">{c.description}</p>
                  </div>
                  {canManage && (
                    <button className="text-ink/30 hover:text-red-600 text-xs shrink-0" onClick={() => removeCode(org.id, c.id)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {codebook.length === 0 && <p className="text-xs text-ink/40 italic">{t('noData')}</p>}
            </div>
            {canManage && (
              <div className="flex gap-2 flex-wrap">
                <input
                  className="input text-xs py-1 w-40"
                  placeholder={t('m11_qcw_code_label')}
                  value={newCode.label}
                  onChange={(e) => setNewCode({ ...newCode, label: e.target.value })}
                />
                <input
                  className="input text-xs py-1 flex-1 min-w-[10rem]"
                  placeholder={t('m11_qcw_code_desc')}
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                />
                <button
                  className="btn-secondary text-xs"
                  onClick={() => {
                    if (!newCode.label.trim()) return
                    addCode(org.id, newCode)
                    setNewCode({ label: '', description: '' })
                  }}
                >
                  + {t('add')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-1 text-sm">{t('m11_qcw_tagging')}</h3>
        <p className="text-xs text-ink/40 mb-3">{t('m11_qcw_tagging_desc')}</p>
        <div className="space-y-2">
          {taggableNotes.map((src) => {
            const tags = codeTags.filter((tg) => tg.sourceType === src.sourceType && tg.sourceId === src.sourceId)
            return (
              <div key={`${src.sourceType}-${src.sourceId}`} className="rounded-lg border border-brand-100 p-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <Badge tone="gray">{src.sourceType === 'coaching' ? t('coachingNote') : t('resistanceType')}</Badge>
                    <span className="text-xs text-ink/50 ms-1">{src.label}</span>
                  </div>
                  {canManage && (
                    <button className="btn-secondary text-[11px] py-0.5 px-2" onClick={() => openTag(src)}>
                      + {t('m11_qcw_tag_button')}
                    </button>
                  )}
                </div>
                <p className="text-xs text-ink/60 mt-1">{src.text}</p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {tags.map((tg) => (
                      <span key={tg.id} className="inline-flex items-center gap-1 text-[11px] rounded-full bg-brand-50 text-brand-800 px-2 py-0.5">
                        {codeById[tg.codeId]?.label || '?'}
                        {tg.linkedResistanceId && <span title={t('m11_qcw_linked')}>🔗</span>}
                        {canManage && (
                          <button className="text-brand-400 hover:text-red-600" onClick={() => removeCodeTag(project.id, tg.id)}>✕</button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {taggableNotes.length === 0 && <p className="text-xs text-ink/40 italic">{t('noData')}</p>}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-1 text-sm">{t('m11_qcw_frequency')}</h3>
        <p className="text-xs text-ink/40 mb-3">{t('m11_qcw_frequency_desc')}</p>
        <div className="space-y-1.5">
          {frequency.map(({ code, count }) => (
            <div key={code.id} className="flex items-center gap-2">
              <span className="text-xs text-ink/70 w-40 shrink-0 truncate">{code.label}</span>
              <div className="flex-1 h-2 rounded-full bg-brand-50 overflow-hidden">
                <div
                  className="h-full bg-brand-500"
                  style={{ width: `${frequency[0]?.count ? (count / frequency[0].count) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-ink/50 w-6 text-end">{count}</span>
            </div>
          ))}
          {frequency.length === 0 && <p className="text-xs text-ink/40 italic">{t('noData')}</p>}
        </div>
      </div>

      <Modal
        open={!!tagSource}
        onClose={() => setTagSource(null)}
        title={t('m11_qcw_tag_button')}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setTagSource(null)}>{t('cancel')}</button>
            <button className="btn-primary" onClick={submitTag}>{t('save')}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">{t('m11_qcw_codebook')}</label>
            <select className="input" value={tagCodeId} onChange={(e) => setTagCodeId(e.target.value)}>
              {codebook.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          {tagSource?.sourceType === 'coaching' && (
            <div>
              <label className="label">{t('m11_qcw_link_barrier')}</label>
              <select className="input" value={tagLinkId} onChange={(e) => setTagLinkId(e.target.value)}>
                <option value="">{t('m11_qcw_flag_new')}</option>
                {project.resistanceLog.map((r) => (
                  <option key={r.id} value={r.id}>{r.rootCause.slice(0, 60)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function ResistanceLogTab({ project }) {
  const { t } = useI18n()
  const { data, addSubItem, removeSubItem, logJustifiedChange, currentUser } = useAppState()
  // Employees may submit a concern (per spec, "submission only") even though they
  // cannot otherwise write to this project; only full write roles can manage
  // status, classification, or delete an entry.
  const canManage = canWrite(currentUser?.role, data.rolePermissions)
  const canSubmit = canManage || currentUser?.role === 'employee'
  const [modal, setModal] = useState(false)
  const [statusJustifyId, setStatusJustifyId] = useState(null)
  const [statusJustification, setStatusJustification] = useState('')
  const [form, setForm] = useState({
    type: 'will',
    source: '',
    rootCause: '',
    severity: 3,
    mitigation: '',
    owner: '',
    dueDate: '',
    status: 'open',
    anonymous: false,
  })

  function submit() {
    if (!form.rootCause.trim()) return
    addSubItem(project.id, 'resistanceLog', form)
    setModal(false)
    setForm({ type: 'will', source: '', rootCause: '', severity: 3, mitigation: '', owner: '', dueDate: '', status: 'open', anonymous: false })
  }

  const typeCounts = RESISTANCE_TYPES.map((rt) => ({ type: rt, count: project.resistanceLog.filter((r) => r.type === rt).length }))
  const systemic = typeCounts.find((tc) => tc.type === 'systemic' && tc.count >= 2)

  function startStatusChange(r) {
    setStatusJustifyId(r.id)
    setStatusJustification('')
  }
  function cancelStatusChange() {
    setStatusJustifyId(null)
    setStatusJustification('')
  }
  function saveStatusChange(r) {
    const nextStatus = r.status === 'open' ? 'in_progress' : 'closed'
    logJustifiedChange(project.id, {
      module: 'M11 · Resistance Tracker',
      field: `Resistance status — ${r.rootCause.slice(0, 40)}`,
      oldValue: STATUS_LABEL[r.status],
      newValue: STATUS_LABEL[nextStatus],
      justification: statusJustification,
      applyPatch: (p) => ({ ...p, resistanceLog: p.resistanceLog.map((r2) => (r2.id === r.id ? { ...r2, status: nextStatus } : r2)) }),
    })
    cancelStatusChange()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {typeCounts.map((tc) => (
          <div key={tc.type} className="card p-3 text-center">
            <div className="text-2xl font-bold text-brand-700">{tc.count}</div>
            <div className="text-xs text-ink/50">{t(`resistance_${tc.type}`)}</div>
          </div>
        ))}
      </div>

      {systemic && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Pattern detection: {systemic.count} systemic resistance entries logged — this looks organizational, not individual.
          Consider escalating to the Sponsor & Coalition module (M8).
        </div>
      )}

      {canSubmit && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setModal(true)}>
            + {t('resistanceType')}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {project.resistanceLog.length === 0 && <EmptyState />}
        {project.resistanceLog.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge tone="sand">{t(`resistance_${r.type}`)}</Badge>
              <Badge tone={severityColor(r.severity).includes('red') ? 'red' : severityColor(r.severity).includes('amber') ? 'amber' : 'brand'}>
                {t('severity')}: {r.severity}/5
              </Badge>
              <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
              {r.anonymous && <Badge tone="gray">{t('anonymous')}</Badge>}
              <span className="text-xs text-ink/40 ms-auto">{r.source}</span>
            </div>
            <p className="text-sm text-ink/80 mb-2">
              <strong>{t('rootCause')}:</strong> {r.rootCause}
            </p>
            <div className="rounded-lg bg-brand-50/60 p-2 text-sm">
              <strong>{t('mitigationAction')}:</strong> {r.mitigation} — {r.owner} ({r.dueDate})
            </div>
            {canManage && (
              <div className="mt-2 flex gap-2">
                {r.status !== 'closed' && (
                  <button className="btn-secondary text-xs" onClick={() => startStatusChange(r)}>
                    {r.status === 'open' ? 'Mark in progress' : 'Close'}
                  </button>
                )}
                <button className="btn-danger text-xs" onClick={() => removeSubItem(project.id, 'resistanceLog', r.id)}>
                  {t('delete')}
                </button>
              </div>
            )}
            {statusJustifyId === r.id && (
              <div className="mt-2">
                <JustifyPanel
                  justification={statusJustification}
                  onJustificationChange={setStatusJustification}
                  onSave={() => saveStatusChange(r)}
                  onCancel={cancelStatusChange}
                  saveLabel={r.status === 'open' ? 'Mark in progress with justification' : 'Close with justification'}
                  placeholder="What changed to justify this status move?"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-2 text-sm">Resistance Root-Cause Classifier</h3>
        <AiSuggestionBox
          useCaseId="uc-resistance-classifier"
          orgId={project.orgId}
          projectId={project.id}
          ucName="Resistance Root-Cause Classifier"
          tier="assistive"
          buildSuggestion={() => `Suggested classification: will-based — logged description text most closely matches identity/job-security themes.`}
        />
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`+ ${t('resistanceType')}`}
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
        <div className="space-y-3">
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {RESISTANCE_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {t(`resistance_${rt}`)}
              </option>
            ))}
          </select>
          <input className="input" placeholder={t('source')} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <textarea className="input" rows={2} placeholder={t('rootCause')} value={form.rootCause} onChange={(e) => setForm({ ...form, rootCause: e.target.value })} />
          <div>
            <label className="label">{t('severity')} (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className="input"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: Number(e.target.value) })}
            />
          </div>
          <input className="input" placeholder={t('mitigationAction')} value={form.mitigation} onChange={(e) => setForm({ ...form, mitigation: e.target.value })} />
          <input className="input" placeholder={t('owner')} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <input className="input" placeholder={t('dueDate')} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} />
            {t('anonymous')} ({t('submitConcern')})
          </label>
        </div>
      </Modal>
    </div>
  )
}

function Content({ project }) {
  const { t } = useI18n()
  const { data, currentUser } = useAppState()
  const canManage = canWrite(currentUser?.role, data.rolePermissions)
  const [tab, setTab] = useState('log')

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className={`tab ${tab === 'log' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('log')}>
          {t('m11_tab_log')}
        </button>
        <button className={`tab ${tab === 'coding' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('coding')}>
          {t('m11_tab_coding')}
        </button>
      </div>
      {tab === 'log' && <ResistanceLogTab project={project} />}
      {tab === 'coding' && <CodingWorkbenchTab project={project} canManage={canManage} />}
    </div>
  )
}

export default function Module11Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m11_title')} description={t('m11_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
