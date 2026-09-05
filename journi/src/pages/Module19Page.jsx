import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedProject } from '../utils/useScoped.js'
import { canWrite, canManageCharters, canDeleteCharter } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import charterActions from '../data/charterActions.js'
import mentoringStages from '../data/mentoringStages.js'

const STAGE_TONE = { 1: 'gray', 2: 'amber', 3: 'green' }
const PDCA_TONE = { Plan: 'gray', Do: 'brand', Check: 'amber', Act: 'green' }
const CHARTER_STATUSES = ['Active', 'Draft', 'Retired']
const BLANK_CHARTER = {
  name: '', pdcaCycle: 'Full Cycle (Plan-Do-Check-Act)',
  racsi: { R: '', A: '', C: '', S: '', I: '' }, primaryLinkedMacroId: '', governsObsLevel: 'Project',
  status: 'Draft', version: 'v1.0', effectiveDate: '', reviewFrequency: '',
}
const BLANK_ENTRY = { category: '', owner: '', what: '', who: '', when: '', where: '', why: '', how: '', description: '' }

function CharterForm({ form, setForm }) {
  const { t } = useI18n()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setRacsi = (k) => (e) => setForm({ ...form, racsi: { ...form.racsi, [k]: e.target.value } })
  return (
    <div className="space-y-3">
      <input className="input" placeholder="Charter name" value={form.name} onChange={set('name')} />
      <div>
        <label className="label">{t('m18_chain_racsi')}</label>
        <div className="grid grid-cols-5 gap-1.5">
          {['R', 'A', 'C', 'S', 'I'].map((k) => (
            <input key={k} className="input text-xs" placeholder={k} value={form.racsi[k]} onChange={setRacsi(k)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder="Primary linked macro (e.g. MP-02)" value={form.primaryLinkedMacroId} onChange={set('primaryLinkedMacroId')} />
        <select className="input" value={form.governsObsLevel} onChange={set('governsObsLevel')}>
          <option value="Project">Project</option>
          <option value="Organization">Organization</option>
          <option value="Group">Group</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select className="input" value={form.status} onChange={set('status')}>
          {CHARTER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input className="input" placeholder={t('m19_version')} value={form.version} onChange={set('version')} />
        <input className="input" placeholder={t('m19_effective')} value={form.effectiveDate} onChange={set('effectiveDate')} />
      </div>
      <input className="input" placeholder={t('m19_review')} value={form.reviewFrequency} onChange={set('reviewFrequency')} />
      <p className="text-[11px] text-ink/40">
        Category, owner, and the What/Who/When/Where/Why/How/Description content go on this charter's entries — add or edit
        them from the charter card below once it's saved.
      </p>
    </div>
  )
}

function CharterEntryForm({ form, setForm }) {
  const { t } = useI18n()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder="Category" value={form.category} onChange={set('category')} />
        <input className="input" placeholder={t('m19_owner')} value={form.owner} onChange={set('owner')} />
      </div>
      <textarea className="input" rows={2} placeholder={`${t('m19_what')}`} value={form.what} onChange={set('what')} />
      <textarea className="input" rows={2} placeholder={`${t('m19_who')}`} value={form.who} onChange={set('who')} />
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder={t('m19_when')} value={form.when} onChange={set('when')} />
        <input className="input" placeholder={t('m19_where')} value={form.where} onChange={set('where')} />
      </div>
      <textarea className="input" rows={2} placeholder={t('m19_why')} value={form.why} onChange={set('why')} />
      <textarea className="input" rows={2} placeholder={t('m19_how')} value={form.how} onChange={set('how')} />
      <textarea className="input" rows={2} placeholder="Description" value={form.description} onChange={set('description')} />
    </div>
  )
}

function CharterEntryCard({ entry, canManage, onEdit, onDelete }) {
  const { t } = useI18n()
  return (
    <div className="rounded-lg border border-brand-100 p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] text-brand-700">{entry.id}</span>
          <p className="text-xs text-ink/50">{entry.category || <span className="italic text-ink/30">no category</span>} · {t('m19_owner')}: {entry.owner || '—'}</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button className="btn-secondary text-[11px] py-0.5 px-2" onClick={onEdit}>{t('m19_edit')}</button>
            <button className="text-ink/30 hover:text-red-600 text-xs" onClick={onDelete}>✕</button>
          </div>
        )}
      </div>
      {entry.description && <p className="text-sm text-ink/70">{entry.description}</p>}
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <p><strong className="text-ink/80">{t('m19_what')}:</strong> <span className="text-ink/60">{entry.what}</span></p>
        <p><strong className="text-ink/80">{t('m19_who')}:</strong> <span className="text-ink/60">{entry.who}</span></p>
        <p><strong className="text-ink/80">{t('m19_when')}:</strong> <span className="text-ink/60">{entry.when}</span></p>
        <p><strong className="text-ink/80">{t('m19_where')}:</strong> <span className="text-ink/60">{entry.where}</span></p>
        <p className="sm:col-span-2"><strong className="text-ink/80">{t('m19_why')}:</strong> <span className="text-ink/60">{entry.why}</span></p>
        <p className="sm:col-span-2"><strong className="text-ink/80">{t('m19_how')}:</strong> <span className="text-ink/60">{entry.how}</span></p>
      </div>
    </div>
  )
}

function CharterCard({ charter, expanded, onToggle, canManage, canDelete, onEdit, onDelete, onAddEntry, onEditEntry, onDeleteEntry }) {
  const { t } = useI18n()
  const deleteBlocked = charter.status === 'Active'
  const entries = charter.entries || []
  return (
    <div className="card p-4 space-y-2">
      <button className="w-full flex items-start justify-between gap-3 text-start" onClick={onToggle}>
        <div>
          <span className="font-mono text-xs text-brand-700">{charter.id}</span>
          <h3 className="font-semibold text-brand-950">{charter.name}</h3>
          <p className="text-xs text-ink/50">{entries.length} {entries.length === 1 ? t('m19_entry_singular') : t('m19_entries')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge tone={charter.status === 'Active' ? 'green' : 'gray'}>{charter.status}</Badge>
          <span className="text-ink/30 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>
      {expanded && (
        <div className="space-y-2 pt-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="label !mb-0">{t('m19_entries')}</span>
            {canManage && (
              <button className="btn-primary text-[11px] py-0.5 px-2" onClick={onAddEntry}>
                + {t('m19_add_entry')}
              </button>
            )}
          </div>
          {entries.length === 0 && <p className="text-xs text-ink/40 italic">{t('m19_no_entries')}</p>}
          <div className="space-y-2">
            {entries.map((entry) => (
              <CharterEntryCard
                key={entry.id}
                entry={entry}
                canManage={canManage}
                onEdit={() => onEditEntry(entry)}
                onDelete={() => onDeleteEntry(entry.id)}
              />
            ))}
          </div>
          <p className="text-xs text-ink/60 pt-1">
            <strong className="text-ink/80">{t('m18_chain_racsi')}:</strong> R={charter.racsi.R} · A={charter.racsi.A} · C={charter.racsi.C} · S=
            {charter.racsi.S} · I={charter.racsi.I}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-ink/40 pt-1">
            <span>{t('m19_version')}: {charter.version}</span>
            <span>·</span>
            <span>{t('m19_effective')}: {charter.effectiveDate}</span>
            <span>·</span>
            <span>{t('m19_review')}: {charter.reviewFrequency}</span>
            <span>·</span>
            <span>{t('m19_obs_level')}: {charter.governsObsLevel}</span>
            <span>·</span>
            <span>{t('m19_linked_macro')}: {charter.primaryLinkedMacroId}</span>
          </div>
          {(canManage || canDelete) && (
            <div className="flex items-center gap-2 pt-2">
              {canManage && (
                <button className="btn-secondary text-xs" onClick={onEdit}>{t('m19_edit')}</button>
              )}
              {canDelete && (
                <button
                  className="btn-danger text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={deleteBlocked}
                  title={deleteBlocked ? t('m19_delete_retire_first') : undefined}
                  onClick={onDelete}
                >
                  {t('delete')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CharterTab() {
  const { t } = useI18n()
  const { data, currentUser, addCharter, updateCharter, deleteCharter, addCharterEntry, updateCharterEntry, deleteCharterEntry } = useAppState()
  const charters = data.charters
  const canManage = canManageCharters(currentUser?.role, data.rolePermissions)
  const canDelete = canDeleteCharter(currentUser?.role)
  const [expandedId, setExpandedId] = useState(null)
  const [modal, setModal] = useState(null) // { mode: 'add' | 'edit', charterId? }
  const [form, setForm] = useState(BLANK_CHARTER)
  const [entryModal, setEntryModal] = useState(null) // { mode: 'add' | 'edit', charterId, entryId? }
  const [entryForm, setEntryForm] = useState(BLANK_ENTRY)

  function openAdd() {
    setForm(BLANK_CHARTER)
    setModal({ mode: 'add' })
  }
  function openEdit(charter) {
    setForm({ ...BLANK_CHARTER, ...charter, racsi: { ...BLANK_CHARTER.racsi, ...charter.racsi } })
    setModal({ mode: 'edit', charterId: charter.id })
  }
  function submit() {
    if (!form.name.trim()) return
    if (modal.mode === 'add') addCharter(form)
    else updateCharter(modal.charterId, form)
    setModal(null)
  }

  function openAddEntry(charterId) {
    setEntryForm(BLANK_ENTRY)
    setEntryModal({ mode: 'add', charterId })
  }
  function openEditEntry(charterId, entry) {
    setEntryForm({ ...BLANK_ENTRY, ...entry })
    setEntryModal({ mode: 'edit', charterId, entryId: entry.id })
  }
  function submitEntry() {
    if (entryModal.mode === 'add') addCharterEntry(entryModal.charterId, entryForm)
    else updateCharterEntry(entryModal.charterId, entryModal.entryId, entryForm)
    setEntryModal(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-xs text-ink/50 flex-1">{t('m19_charter_desc')}</p>
        {canManage && (
          <button className="btn-primary text-xs shrink-0" onClick={openAdd}>
            + {t('m19_add_charter')}
          </button>
        )}
      </div>
      {charters.map((c) => (
        <CharterCard
          key={c.id}
          charter={c}
          expanded={expandedId === c.id}
          onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
          canManage={canManage}
          canDelete={canDelete}
          onEdit={() => openEdit(c)}
          onDelete={() => deleteCharter(c.id)}
          onAddEntry={() => openAddEntry(c.id)}
          onEditEntry={(entry) => openEditEntry(c.id, entry)}
          onDeleteEntry={(entryId) => deleteCharterEntry(c.id, entryId)}
        />
      ))}

      <Modal
        open={!!entryModal}
        onClose={() => setEntryModal(null)}
        title={entryModal?.mode === 'add' ? `+ ${t('m19_add_entry')}` : t('m19_edit')}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEntryModal(null)}>{t('cancel')}</button>
            <button className="btn-primary" onClick={submitEntry}>{t('save')}</button>
          </>
        }
      >
        {entryModal && <CharterEntryForm form={entryForm} setForm={setEntryForm} />}
      </Modal>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? `+ ${t('m19_add_charter')}` : t('m19_edit')}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(null)}>{t('cancel')}</button>
            <button className="btn-primary" onClick={submit}>{t('save')}</button>
          </>
        }
      >
        {modal && <CharterForm form={form} setForm={setForm} />}
      </Modal>
    </div>
  )
}

function ActionMappingTab({ project, canEdit }) {
  const { t } = useI18n()
  const { data, logCharterAction, deleteCharterActionLog } = useAppState()
  const charters = data.charters
  const [filterCharter, setFilterCharter] = useState('all')
  const rows = charterActions.filter((a) => filterCharter === 'all' || a.charterId === filterCharter)
  const log = project?.charterActionLog || []

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-xs text-ink/50">{t('m19_filter_charter')}</label>
        <select className="input py-1 text-xs w-auto" value={filterCharter} onChange={(e) => setFilterCharter(e.target.value)}>
          <option value="all">{t('m19_all_charters')}</option>
          {charters.map((c) => (
            <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
          ))}
        </select>
      </div>
      {!project && <p className="text-xs text-ink/40 italic">{t('m19_select_project_log')}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-4 py-2.5">ID</th>
              <th className="text-start px-4 py-2.5">{t('m19_action')}</th>
              <th className="text-start px-4 py-2.5">PDCA</th>
              <th className="text-start px-4 py-2.5">{t('m19_linked_task')}</th>
              <th className="text-start px-4 py-2.5">{t('m19_racsi_ra')}</th>
              <th className="text-start px-4 py-2.5">{t('m19_frequency')}</th>
              {project && <th className="text-start px-4 py-2.5">{t('m19_compliance')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const instances = log.filter((l) => l.charterActionId === a.id)
              return (
                <tr key={a.id} className="border-t border-brand-50 align-top">
                  <td className="px-4 py-2.5 font-mono text-xs text-brand-700 whitespace-nowrap">{a.id}</td>
                  <td className="px-4 py-2.5 text-ink/70 max-w-md">{a.name}</td>
                  <td className="px-4 py-2.5"><Badge tone={PDCA_TONE[a.pdcaStage]}>{a.pdcaStage}</Badge></td>
                  <td className="px-4 py-2.5 text-xs text-ink/50 whitespace-nowrap">{a.macroId} / {a.taskId}</td>
                  <td className="px-4 py-2.5 text-xs text-ink/50 whitespace-nowrap">R={a.responsibleRole} · A={a.accountableRole}</td>
                  <td className="px-4 py-2.5 text-xs text-ink/50 whitespace-nowrap">{a.frequency}</td>
                  {project && (
                    <td className="px-4 py-2.5">
                      <div className="space-y-1">
                        {instances.slice(0, 3).map((l) => (
                          <div key={l.id} className="flex items-center gap-1.5 text-xs">
                            <Badge tone="green">{l.date}</Badge>
                            {l.note && <span className="text-ink/50 truncate max-w-[10rem]" title={l.note}>{l.note}</span>}
                            {canEdit && (
                              <button className="text-ink/30 hover:text-red-600" onClick={() => deleteCharterActionLog(project.id, l.id)}>
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        {instances.length > 3 && <p className="text-[10px] text-ink/40">+{instances.length - 3} {t('m19_more')}</p>}
                        {instances.length === 0 && <span className="text-xs text-ink/30 italic">{t('m19_not_logged')}</span>}
                        {canEdit && (
                          <button
                            className="btn-secondary text-[11px] py-0.5 px-2"
                            onClick={() => logCharterAction(project.id, a.id, '')}
                          >
                            {t('m19_log_completion')}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MentoringTab() {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/50">{t('m19_mentoring_desc')}</p>
      <div className="grid md:grid-cols-3 gap-3">
        {mentoringStages.map((s) => (
          <div key={s.id} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-brand-700">{s.id}</span>
              <Badge tone={STAGE_TONE[s.order]}>{t('m19_stage')} {s.order}</Badge>
            </div>
            <h3 className="font-semibold text-brand-950">{s.name}</h3>
            <p className="text-xs text-ink/60">{s.description}</p>
            <div className="space-y-1 text-xs">
              <p><strong className="text-ink/80">{t('m19_entry')}:</strong> <span className="text-ink/60">{s.entryCriteria}</span></p>
              <p><strong className="text-ink/80">{t('m19_exit')}:</strong> <span className="text-ink/60">{s.exitCriteria}</span></p>
              <p><strong className="text-ink/80">{t('m19_duration')}:</strong> <span className="text-ink/60">{s.typicalDuration}</span></p>
              <p><strong className="text-ink/80">{t('m19_setting')}:</strong> <span className="text-ink/60">{s.setting}</span></p>
              <p><strong className="text-ink/80">{t('m19_mentor_involvement')}:</strong> <span className="text-ink/60">{s.mentorInvolvement}</span></p>
              <p><strong className="text-ink/80">{t('m19_evidence')}:</strong> <span className="text-ink/60">{s.competencyEvidenceRequired}</span></p>
              <p className="text-amber-700"><strong>{t('m19_regression')}:</strong> {s.regressionPath}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Module19Page() {
  const { t } = useI18n()
  const { data, currentUser } = useAppState()
  const project = useScopedProject()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
  const [tab, setTab] = useState('charters')

  return (
    <div>
      <PageHeader title={t('m19_title')} description={t('m19_desc')} />
      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={`tab ${tab === 'charters' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('charters')}>
          {t('m19_tab_charters')}
        </button>
        <button className={`tab ${tab === 'actions' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('actions')}>
          {t('m19_tab_actions')}
        </button>
        <button className={`tab ${tab === 'mentoring' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('mentoring')}>
          {t('m19_tab_mentoring')}
        </button>
      </div>
      {tab === 'charters' && <CharterTab />}
      {tab === 'actions' && <ActionMappingTab project={project} canEdit={canEdit} />}
      {tab === 'mentoring' && <MentoringTab />}
    </div>
  )
}
