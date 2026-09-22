import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useClients } from '../hooks/useClients'
import { useProjects } from '../hooks/useProjects'

const STEP_LABELS = { 1: 'Step 1: Upload SOW', 2: 'Step 2: AI Generates Spec Package', 3: 'Step 3: Review & Validate', 4: 'Step 4: Export & Handoff' }

export default function ProjectsPage() {
  const { orgId, activeClientId, activeProjectId, selectProject, can } = useApp()
  const { clients } = useClients(orgId)
  const { projects, loading, addProject, updateProject, softDeleteProject } = useProjects(orgId, activeClientId)
  const [name, setName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const client = clients.find((c) => c.id === activeClientId)

  async function saveRename(id) {
    await updateProject(id, { name: renameValue })
    setRenamingId(null)
  }

  async function handleAdd(e) {
    e.preventDefault()
    await addProject({ name })
    setName('')
    setShowForm(false)
  }

  if (!activeClientId) {
    return <p className="text-grey-medium">Select a client in the top bar (or the Clients page) to view its projects.</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-grey-dark">Projects — {client?.name}</h1>
          <p className="text-xs text-grey-medium">Each project is one scope-to-specs engagement, driven through the 4-step wizard.</p>
        </div>
        {can('hierarchy.manage') && <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>+ New Project</button>}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Project / Engagement Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Order-to-Cash Automation Engagement" />
          </div>
          <button className="btn-primary">Create</button>
        </form>
      )}

      {loading ? <p className="text-grey-medium">Loading…</p> : (
        <table className="w-full card text-sm">
          <thead>
            <tr className="text-left text-grey-medium border-b border-grey-line">
              <th className="p-3">Project</th>
              <th className="p-3">Status</th>
              <th className="p-3">Current Step</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className={`border-b border-grey-line last:border-0 ${activeProjectId === p.id ? 'bg-orange-tint' : ''}`}>
                <td className="p-3 font-medium text-grey-dark">
                  {renamingId === p.id ? (
                    <div className="flex gap-2">
                      <input className="input !py-1" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                      <button className="text-orange-deep text-xs font-semibold" onClick={() => saveRename(p.id)}>Save</button>
                      <button className="text-grey-medium text-xs" onClick={() => setRenamingId(null)}>Cancel</button>
                    </div>
                  ) : p.name}
                </td>
                <td className="p-3"><span className={`badge ${p.status === 'completed' ? 'badge-good' : 'badge-medium'}`}>{p.status || 'not_started'}</span></td>
                <td className="p-3 text-grey-ink">{STEP_LABELS[p.currentStep || 1]}</td>
                <td className="p-3 text-right space-x-3">
                  <button className="text-orange-deep font-semibold" onClick={() => selectProject(p.id)}>Open</button>
                  {can('hierarchy.manage') && <button className="text-grey-ink" onClick={() => { setRenamingId(p.id); setRenameValue(p.name) }}>Rename</button>}
                  {can('hierarchy.manage') && <button className="text-red-500" onClick={() => softDeleteProject(p.id)}>Delete</button>}
                </td>
              </tr>
            ))}
            {projects.length === 0 && <tr><td colSpan={4} className="p-4 text-grey-medium">No projects yet for this client.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
