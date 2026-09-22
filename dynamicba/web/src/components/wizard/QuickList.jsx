import React, { useState } from 'react'
import { useArtifacts } from '../../hooks/useArtifacts'

// A compact add/list/delete widget for one D09 object class, used to keep Step 2's five
// sub-sections (Context, Current-State, Opportunities, To-Be, Specs) from repeating the
// same CRUD boilerplate across ~12 classes. Full editing lives in the Project Artifacts
// tab (ArtifactExplorer), which is schema-driven for every field on every class.
export default function QuickList({ orgId, clientId, projectId, objectClassId, title, fields, onAfterAdd, renderExtra }) {
  const { records, addRecord, deleteRecord } = useArtifacts(orgId, clientId, projectId, objectClassId)
  const [draft, setDraft] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.type === 'boolean' ? false : ''])))

  async function handleAdd(e) {
    e.preventDefault()
    const record = { ...draft }
    for (const f of fields) if (f.type === 'number') record[f.name] = parseFloat(record[f.name]) || 0
    const saved = await addRecord(record)
    if (onAfterAdd) await onAfterAdd(record, saved)
    setDraft(Object.fromEntries(fields.map((f) => [f.name, f.type === 'boolean' ? false : ''])))
  }

  return (
    <div className="card p-4">
      <h3 className="h-card mb-2">{title}</h3>
      <form onSubmit={handleAdd} className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${fields.length}, 1fr) auto` }}>
        {fields.map((f) => (
          f.type === 'select' ? (
            <select key={f.name} className="input" value={draft[f.name]} onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}>
              <option value="">{f.label}</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === 'boolean' ? (
            <label key={f.name} className="flex items-center gap-2 text-xs text-grey-ink self-center">
              <input type="checkbox" className="accent-orange w-4 h-4" checked={draft[f.name]} onChange={(e) => setDraft({ ...draft, [f.name]: e.target.checked })} /> {f.label}
            </label>
          ) : (
            <input key={f.name} className="input" type={f.type === 'number' ? 'number' : 'text'} placeholder={f.label} value={draft[f.name]} onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })} />
          )
        ))}
        <button className="btn-secondary">Add</button>
      </form>
      <ul className="text-sm divide-y divide-grey-line">
        {records.map((r) => (
          <li key={r.id} className="py-1.5 flex justify-between items-center">
            <span className="flex-1">
              {fields.map((f) => `${r[f.name]}`).filter(Boolean).join(' · ')}
              {renderExtra && renderExtra(r)}
            </span>
            <button className="btn-danger-text ml-2" onClick={() => deleteRecord(r.id)}>Remove</button>
          </li>
        ))}
        {records.length === 0 && <li className="py-2 text-grey-medium">None added yet.</li>}
      </ul>
    </div>
  )
}
