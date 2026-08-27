import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedProject } from '../utils/useScoped.js'
import { canWrite } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'

const CATEGORIES = ['Workshop', 'Decision', 'Sign-Off', 'Nomination', 'Handoff', 'Other']
const CATEGORY_TONE = { Workshop: 'brand', Decision: 'green', 'Sign-Off': 'green', Nomination: 'amber', Handoff: 'gray', Other: 'gray' }
const MODULE_OPTIONS = Array.from({ length: 20 }, (_, i) => `M${i + 1}`)
const BLANK_NOTE = { date: '', category: 'Workshop', relatedModule: '', title: '', body: '', author: '' }

function NoteForm({ form, setForm }) {
  const { t } = useI18n()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <div className="space-y-3">
      <input className="input" placeholder={t('m21_title_field')} value={form.title} onChange={set('title')} />
      <div className="grid grid-cols-2 gap-2">
        <input className="input" type="date" value={form.date} onChange={set('date')} />
        <select className="input" value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder={t('m21_author')} value={form.author} onChange={set('author')} />
        <select className="input" value={form.relatedModule} onChange={set('relatedModule')}>
          <option value="">{t('m21_related_module_none')}</option>
          {MODULE_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <textarea className="input" rows={4} placeholder={t('m21_body')} value={form.body} onChange={set('body')} />
    </div>
  )
}

function NoteCard({ note, canEdit, onEdit, onDelete }) {
  const { t } = useI18n()
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={CATEGORY_TONE[note.category] || 'gray'}>{note.category}</Badge>
            <span className="text-xs text-ink/40">{note.date}</span>
            {note.relatedModule && <span className="text-xs text-ink/40">· {note.relatedModule}</span>}
          </div>
          <h3 className="font-semibold text-brand-950 mt-1">{note.title || t('m21_untitled')}</h3>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <button className="btn-secondary text-xs" onClick={onEdit}>{t('m19_edit')}</button>
            <button className="text-ink/30 hover:text-red-600 text-xs" onClick={onDelete}>✕</button>
          </div>
        )}
      </div>
      {note.body && <p className="text-sm text-ink/70 whitespace-pre-wrap">{note.body}</p>}
      {note.author && <p className="text-xs text-ink/40">{t('m21_author')}: {note.author}</p>}
    </div>
  )
}

export default function Module21Page() {
  const { t } = useI18n()
  const { data, currentUser, addFieldNote, updateFieldNote, deleteFieldNote } = useAppState()
  const project = useScopedProject()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
  const [filterCategory, setFilterCategory] = useState('all')
  const [modal, setModal] = useState(null) // { mode: 'add' | 'edit', noteId? }
  const [form, setForm] = useState(BLANK_NOTE)

  const notes = (project?.fieldNotes || []).filter((n) => filterCategory === 'all' || n.category === filterCategory)

  function openAdd() {
    setForm({ ...BLANK_NOTE, date: new Date().toISOString().slice(0, 10) })
    setModal({ mode: 'add' })
  }
  function openEdit(note) {
    setForm({ ...BLANK_NOTE, ...note })
    setModal({ mode: 'edit', noteId: note.id })
  }
  function submit() {
    if (!form.title.trim() && !form.body.trim()) return
    if (!project) return
    if (modal.mode === 'add') addFieldNote(project.id, form)
    else updateFieldNote(project.id, modal.noteId, form)
    setModal(null)
  }

  return (
    <div>
      <PageHeader title={t('m21_title')} description={t('m21_desc')} />
      {!project && <p className="text-xs text-ink/40 italic mb-3">{t('m21_select_project')}</p>}
      {project && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink/50">{t('m21_filter')}</label>
              <select className="input py-1 text-xs w-auto" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">{t('m21_all_categories')}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {canEdit && (
              <button className="btn-primary text-xs shrink-0" onClick={openAdd}>
                + {t('m21_add_note')}
              </button>
            )}
          </div>
          {notes.length === 0 && <p className="text-xs text-ink/40 italic">{t('m21_empty')}</p>}
          {notes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              canEdit={canEdit}
              onEdit={() => openEdit(n)}
              onDelete={() => deleteFieldNote(project.id, n.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? `+ ${t('m21_add_note')}` : t('m19_edit')}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(null)}>{t('cancel')}</button>
            <button className="btn-primary" onClick={submit}>{t('save')}</button>
          </>
        }
      >
        {modal && <NoteForm form={form} setForm={setForm} />}
      </Modal>
    </div>
  )
}
