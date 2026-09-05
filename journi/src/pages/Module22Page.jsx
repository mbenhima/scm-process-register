import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedProject } from '../utils/useScoped.js'
import { canWrite } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'

const BLANK_ENTRY = { role: '', name: '', reportsTo: '', notes: '' }

// Orders entries top-down (roots first, then their reports, depth-first) so
// the roster reads as an actual hierarchy rather than creation order.
function sortByHierarchy(entries) {
  const byParent = new Map()
  for (const e of entries) {
    const parent = e.reportsTo && entries.some((x) => x.id === e.reportsTo) ? e.reportsTo : null
    if (!byParent.has(parent)) byParent.set(parent, [])
    byParent.get(parent).push(e)
  }
  const out = []
  function visit(parentId, depth) {
    for (const e of byParent.get(parentId) || []) {
      out.push({ ...e, depth })
      visit(e.id, depth + 1)
    }
  }
  visit(null, 0)
  return out
}

function ObsForm({ form, setForm, entries, excludeId }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const candidates = entries.filter((e) => e.id !== excludeId)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder="Role (e.g. Change Manager)" value={form.role} onChange={set('role')} />
        <input className="input" placeholder="Name (e.g. Amina Idrissi)" value={form.name} onChange={set('name')} />
      </div>
      <div>
        <label className="label">Reports to</label>
        <select className="input" value={form.reportsTo || ''} onChange={set('reportsTo')}>
          <option value="">— Top of structure —</option>
          {candidates.map((e) => (
            <option key={e.id} value={e.id}>
              {e.role || '(no role)'} — {e.name || '(unnamed)'}
            </option>
          ))}
        </select>
      </div>
      <textarea className="input" rows={2} placeholder="Notes (scope, allocation, backup contact, etc.)" value={form.notes} onChange={set('notes')} />
    </div>
  )
}

export default function Module22Page() {
  const { t } = useI18n()
  const { data, currentUser, addObsEntry, updateObsEntry, deleteObsEntry } = useAppState()
  const project = useScopedProject()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
  const [modal, setModal] = useState(null) // { mode: 'add' | 'edit', entryId? }
  const [form, setForm] = useState(BLANK_ENTRY)

  const entries = project?.obsEntries || []
  const sorted = sortByHierarchy(entries)

  function openAdd() {
    setForm(BLANK_ENTRY)
    setModal({ mode: 'add' })
  }
  function openEdit(entry) {
    setForm({ role: entry.role, name: entry.name, reportsTo: entry.reportsTo || '', notes: entry.notes || '' })
    setModal({ mode: 'edit', entryId: entry.id })
  }
  function submit() {
    if (!form.role.trim() && !form.name.trim()) return
    if (!project) return
    const payload = { ...form, reportsTo: form.reportsTo || null }
    if (modal.mode === 'add') addObsEntry(project.id, payload)
    else updateObsEntry(project.id, modal.entryId, payload)
    setModal(null)
  }

  return (
    <div>
      <PageHeader
        title={t('m22_title')}
        description={t('m22_desc')}
        actions={
          canEdit &&
          project && (
            <button className="btn-primary text-xs" onClick={openAdd}>
              + {t('m22_add_entry')}
            </button>
          )
        }
      />
      {!project && <p className="text-xs text-ink/40 italic mb-3">{t('m21_select_project')}</p>}
      {project && (
        <div className="card overflow-x-auto">
          {sorted.length === 0 ? (
            <p className="text-xs text-ink/40 italic p-4">{t('m22_empty')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-start px-4 py-2.5">{t('m22_role')}</th>
                  <th className="text-start px-4 py-2.5">{t('name')}</th>
                  <th className="text-start px-4 py-2.5">{t('m22_reports_to')}</th>
                  <th className="text-start px-4 py-2.5">{t('m21_body')}</th>
                  {canEdit && <th className="text-end px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {sorted.map((e) => {
                  const parent = entries.find((x) => x.id === e.reportsTo)
                  return (
                    <tr key={e.id} className="border-t border-brand-50">
                      <td className="px-4 py-2.5 font-medium text-brand-950" style={{ paddingInlineStart: `${16 + e.depth * 20}px` }}>
                        {e.depth > 0 && <span className="text-ink/20 me-1">↳</span>}
                        {e.role || <span className="text-ink/30 italic">{t('m22_no_role')}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-ink/70">{e.name || <span className="text-ink/30 italic">{t('m22_no_name')}</span>}</td>
                      <td className="px-4 py-2.5 text-ink/50">
                        {parent ? <Badge tone="gray">{parent.role || parent.name}</Badge> : <span className="text-ink/30">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-ink/50 max-w-xs truncate">{e.notes}</td>
                      {canEdit && (
                        <td className="px-4 py-2.5 text-end whitespace-nowrap">
                          <button className="btn-secondary text-xs me-1.5" onClick={() => openEdit(e)}>
                            {t('m19_edit')}
                          </button>
                          <button className="text-ink/30 hover:text-red-600 text-xs" onClick={() => deleteObsEntry(project.id, e.id)}>
                            {t('delete')}
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? `+ ${t('m22_add_entry')}` : t('m19_edit')}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(null)}>{t('cancel')}</button>
            <button className="btn-primary" onClick={submit}>{t('save')}</button>
          </>
        }
      >
        {modal && <ObsForm form={form} setForm={setForm} entries={entries} excludeId={modal.entryId} />}
      </Modal>
    </div>
  )
}
