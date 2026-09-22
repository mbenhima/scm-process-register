import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useClients } from '../hooks/useClients'
import { useProjects } from '../hooks/useProjects'

const STEP_LABELS = { 1: 'Step 1: Upload SOW', 2: 'Step 2: AI Generates Spec Package', 3: 'Step 3: Review & Validate', 4: 'Step 4: Export & Handoff' }
const STATUS_LABELS = { completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started' }

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="eyebrow mb-1">Engagements</div>
          <h1 className="h-page">Projects — {client?.name}</h1>
          <p className="text-sm text-grey-ink mt-1">Each project is one scope-to-specs engagement, driven through the 4-step wizard.</p>
        </div>
        {can('hierarchy.manage') && (
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" /> New Project
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-4 mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="label">Project / Engagement Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Order-to-Cash Automation Engagement" />
          </div>
          <button className="btn-primary">Create</button>
        </form>
      )}

      {loading ? <p className="text-grey-medium">Loading…</p> : (
        <div className="card overflow-hidden">
          <table className="table-pa">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Current Step</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className={activeProjectId === p.id ? '!bg-orange-tint' : ''}>
                  <td className="font-medium text-grey-dark">
                    {renamingId === p.id ? (
                      <div className="flex gap-2">
                        <input className="input !py-1" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
                        <button className="row-action" onClick={() => saveRename(p.id)}>Save</button>
                        <button className="text-xs text-grey-medium" onClick={() => setRenamingId(null)}>Cancel</button>
                      </div>
                    ) : p.name}
                  </td>
                  <td><span className={`badge ${p.status === 'completed' ? 'badge-good' : p.status === 'in_progress' ? 'badge-medium' : 'badge-neutral'}`}>{STATUS_LABELS[p.status] || STATUS_LABELS.not_started}</span></td>
                  <td>{STEP_LABELS[p.currentStep || 1]}</td>
                  <td className="text-right space-x-4 whitespace-nowrap">
                    <button className="row-action" onClick={() => selectProject(p.id)}>Open</button>
                    {can('hierarchy.manage') && <button className="row-action" onClick={() => { setRenamingId(p.id); setRenameValue(p.name) }}>Rename</button>}
                    {can('hierarchy.manage') && <button className="btn-danger-text" onClick={() => softDeleteProject(p.id)}>Delete</button>}
                  </td>
                </tr>
              ))}
              {projects.length === 0 && <tr><td colSpan={4} className="text-grey-medium">No projects yet for this client.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
