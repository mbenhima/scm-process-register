import React, { useState } from 'react'
import { OBJECT_CLASSES, attributesFor } from '../lib/schema'
import { useArtifacts } from '../hooks/useArtifacts'
import { useApp } from '../contexts/AppContext'

// A schema-driven CRUD browser for all 32 D09 Information Class Model object classes,
// scoped to one project. Every class gets real create/read/update/delete without a
// bespoke page component — the D10 Data Dictionary attribute list is the form definition.
// Write actions are gated by the project.write capability (RBAC); the server enforces the
// same check independently, so this is a UX convenience, never the security boundary.
export default function ArtifactExplorer({ orgId, clientId, projectId }) {
  const { can } = useApp()
  const canWrite = can('project.write')
  const [selected, setSelected] = useState(OBJECT_CLASSES[0].id)
  const objectClass = OBJECT_CLASSES.find((c) => c.id === selected)
  const attrs = attributesFor(selected)
  const { records, loading, addRecord, updateRecord, deleteRecord } = useArtifacts(orgId, clientId, projectId, selected)
  const [draft, setDraft] = useState({})
  const [editingId, setEditingId] = useState(null)

  function emptyDraft() {
    const d = {}
    for (const a of attrs) d[a.name] = a.type === 'boolean' ? false : ''
    return d
  }

  function startAdd() {
    setEditingId('new')
    setDraft(emptyDraft())
  }
  function startEdit(r) {
    setEditingId(r.id)
    setDraft({ ...r })
  }
  async function save() {
    const clean = { ...draft }
    delete clean.id
    for (const a of attrs) {
      if (a.type === 'integer') clean[a.name] = clean[a.name] === '' ? null : Number(clean[a.name])
      if (a.type === 'decimal') clean[a.name] = clean[a.name] === '' ? null : parseFloat(clean[a.name])
    }
    if (editingId === 'new') await addRecord(clean)
    else await updateRecord(editingId, clean)
    setEditingId(null)
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-1 card p-2 max-h-[70vh] overflow-y-auto">
        {OBJECT_CLASSES.map((c) => (
          <button
            key={c.id}
            onClick={() => { setSelected(c.id); setEditingId(null) }}
            className={`w-full text-left px-2 py-1.5 rounded text-xs ${selected === c.id ? 'bg-orange-tint text-orange-deep font-semibold' : 'text-grey-ink hover:bg-grey-light'}`}
          >
            {c.id} · {c.label}
          </button>
        ))}
      </div>

      <div className="col-span-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-semibold text-grey-dark">{objectClass.id} — {objectClass.label}</div>
            <div className="text-xs text-grey-medium">{objectClass.desc}</div>
          </div>
          {canWrite && <button className="btn-primary" onClick={startAdd}>+ New Record</button>}
        </div>

        {editingId && canWrite && (
          <div className="card p-4 mb-4 grid grid-cols-2 gap-3">
            {attrs.map((a) => (
              <div key={a.id}>
                <label className="label">{a.name.replace(/_/g, ' ')} {a.required && <span className="text-orange">*</span>}</label>
                {a.type === 'boolean' ? (
                  <select className="input" value={String(draft[a.name] ?? false)} onChange={(e) => setDraft({ ...draft, [a.name]: e.target.value === 'true' })}>
                    <option value="false">False</option>
                    <option value="true">True</option>
                  </select>
                ) : a.type === 'enum' ? (
                  <select className="input" value={draft[a.name] || ''} onChange={(e) => setDraft({ ...draft, [a.name]: e.target.value })}>
                    <option value="">—</option>
                    {a.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    className="input"
                    type={a.type === 'date' ? 'date' : a.type === 'integer' || a.type === 'decimal' ? 'number' : 'text'}
                    value={draft[a.name] ?? ''}
                    onChange={(e) => setDraft({ ...draft, [a.name]: e.target.value })}
                  />
                )}
                <div className="text-[10px] text-grey-medium mt-0.5">{a.rule}</div>
              </div>
            ))}
            <div className="col-span-2 flex gap-2">
              <button className="btn-primary" onClick={save}>Save</button>
              <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? <p className="text-grey-medium">Loading…</p> : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-grey-medium border-b border-grey-line">
                  {attrs.slice(0, 4).map((a) => <th key={a.id} className="p-2">{a.name.replace(/_/g, ' ')}</th>)}
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-grey-line last:border-0">
                    {attrs.slice(0, 4).map((a) => <td key={a.id} className="p-2">{String(r[a.name] ?? '')}</td>)}
                    <td className="p-2 text-right space-x-2">
                      {canWrite ? (
                        <>
                          <button className="text-orange-deep font-semibold" onClick={() => startEdit(r)}>Edit</button>
                          <button className="text-red-500" onClick={() => deleteRecord(r.id)}>Delete</button>
                        </>
                      ) : <span className="text-grey-medium text-xs">Read-only</span>}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && <tr><td colSpan={5} className="p-4 text-grey-medium">No {objectClass.label} records yet on this project.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
