import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useClients } from '../hooks/useClients'

export default function ClientsPage() {
  const { orgId, activeClientId, selectClient, can } = useApp()
  const { clients, loading, addClient, softDeleteClient } = useClients(orgId)
  const [form, setForm] = useState({ name: '', industry: '' })
  const [showForm, setShowForm] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    await addClient(form)
    setForm({ name: '', industry: '' })
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-serif font-bold text-grey-dark">Clients</h1>
        {can('hierarchy.manage') && (
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>+ Add Client</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Client Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Meridian Retail Group" />
          </div>
          <div className="flex-1">
            <label className="label">Industry</label>
            <input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Retail" />
          </div>
          <button className="btn-primary">Save</button>
        </form>
      )}

      {loading ? <p className="text-grey-medium">Loading…</p> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div key={c.id} className={`card p-4 cursor-pointer ${activeClientId === c.id ? 'ring-2 ring-orange' : ''}`} onClick={() => selectClient(c.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-grey-dark">{c.name}</div>
                  <div className="text-xs text-grey-medium">{c.industry || 'No industry set'}</div>
                </div>
                {activeClientId === c.id && <span className="text-orange">✓</span>}
              </div>
              {can('hierarchy.manage') && (
                <button className="text-xs text-red-500 mt-3" onClick={(e) => { e.stopPropagation(); softDeleteClient(c.id) }}>Delete</button>
              )}
            </div>
          ))}
          {clients.length === 0 && <p className="text-grey-medium">No clients yet. Add your first client to get started.</p>}
        </div>
      )}
    </div>
  )
}
