import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection } from './useCollection'
import { createDoc, updateDocAt, deleteDocAt } from '../lib/firestoreHelpers'

export function useProjects(orgId, clientId) {
  const { data, loading } = useCollection(orgId && clientId ? ['organizations', orgId, 'clients', clientId, 'projects'] : null)
  const projects = data.filter((p) => !p.deleted)
  const deletedProjects = data.filter((p) => p.deleted)

  async function addProject({ name }) {
    return createDoc(['organizations', orgId, 'clients', clientId, 'projects'], {
      name, clientId, status: 'not_started', currentStep: 1, deleted: false,
    })
  }
  async function updateProject(id, patch) {
    return updateDocAt(['organizations', orgId, 'clients', clientId, 'projects', id], patch)
  }
  async function softDeleteProject(id) {
    return updateDocAt(['organizations', orgId, 'clients', clientId, 'projects', id], { deleted: true, deletedAt: new Date().toISOString() })
  }
  async function restoreProject(id) {
    return updateDocAt(['organizations', orgId, 'clients', clientId, 'projects', id], { deleted: false, deletedAt: null })
  }
  async function hardDeleteProject(id) {
    return deleteDocAt(['organizations', orgId, 'clients', clientId, 'projects', id])
  }

  return { projects, deletedProjects, loading, addProject, updateProject, softDeleteProject, restoreProject, hardDeleteProject }
}

// Aggregates projects across every client in the org — used by the Dashboard. Avoids a
// Firestore collectionGroup query (whose security-rule semantics for cross-tenant
// isolation are subtler to reason about) by fanning out one listener per client instead,
// which is fine at the scale a demo/most real consulting-firm tenants operate at.
export function useAllProjects(orgId, clients) {
  const [byClient, setByClient] = useState({})

  useEffect(() => {
    if (!orgId || !clients?.length) { setByClient({}); return }
    const unsubs = clients.map((c) =>
      onSnapshot(collection(db, 'organizations', orgId, 'clients', c.id, 'projects'), (snap) => {
        setByClient((prev) => ({ ...prev, [c.id]: snap.docs.map((d) => ({ id: d.id, clientId: c.id, clientName: c.name, ...d.data() })) }))
      })
    )
    return () => unsubs.forEach((u) => u())
  }, [orgId, JSON.stringify(clients?.map((c) => c.id))])

  const all = Object.values(byClient).flat()
  return { projects: all.filter((p) => !p.deleted) }
}
