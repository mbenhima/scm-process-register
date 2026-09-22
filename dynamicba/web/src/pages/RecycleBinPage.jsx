import React from 'react'
import { useApp } from '../contexts/AppContext'
import { useClients } from '../hooks/useClients'
import { useProjects } from '../hooks/useProjects'

export default function RecycleBinPage() {
  const { orgId, can } = useApp()
  const { clients, deletedClients, restoreClient, hardDeleteClient } = useClients(orgId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-serif font-bold text-grey-dark mb-2">Recycle Bin — Clients</h1>
        <div className="card divide-y divide-grey-line">
          {deletedClients.map((c) => (
            <div key={c.id} className="p-3 flex justify-between items-center">
              <span>{c.name}</span>
              {can('recyclebin.manage') && (
                <span className="space-x-3">
                  <button className="text-orange-deep font-semibold text-sm" onClick={() => restoreClient(c.id)}>Restore</button>
                  <button className="text-red-500 text-sm" onClick={() => hardDeleteClient(c.id)}>Permanently Delete</button>
                </span>
              )}
            </div>
          ))}
          {deletedClients.length === 0 && <p className="p-3 text-grey-medium">No deleted clients.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-serif font-bold text-grey-dark mb-2">Recycle Bin — Projects</h2>
        <div className="space-y-4">
          {clients.map((c) => <DeletedProjectsForClient key={c.id} orgId={orgId} client={c} can={can} />)}
        </div>
      </div>
    </div>
  )
}

function DeletedProjectsForClient({ orgId, client, can }) {
  const { deletedProjects, restoreProject, hardDeleteProject } = useProjects(orgId, client.id)
  if (deletedProjects.length === 0) return null
  return (
    <div className="card divide-y divide-grey-line">
      <div className="p-2 text-xs font-semibold text-grey-medium bg-grey-light">{client.name}</div>
      {deletedProjects.map((p) => (
        <div key={p.id} className="p-3 flex justify-between items-center">
          <span>{p.name}</span>
          {can('recyclebin.manage') && (
            <span className="space-x-3">
              <button className="text-orange-deep font-semibold text-sm" onClick={() => restoreProject(p.id)}>Restore</button>
              <button className="text-red-500 text-sm" onClick={() => hardDeleteProject(p.id)}>Permanently Delete</button>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
