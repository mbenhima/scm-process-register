import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useApiCollection } from './useApiCollection'

export function useProjects(orgId, clientId) {
  const path = orgId && clientId ? `/organizations/${orgId}/clients/${clientId}/projects` : null
  const { data, loading, refetch } = useApiCollection(path)
  const projects = data.filter((p) => !p.deleted)
  const deletedProjects = data.filter((p) => p.deleted)

  async function addProject({ name }) {
    await api.post(path, { name })
    await refetch()
  }
  async function updateProject(id, patch) {
    await api.patch(`${path}/${id}`, patch)
    await refetch()
  }
  async function softDeleteProject(id) {
    return updateProject(id, { deleted: true, deletedAt: new Date().toISOString() })
  }
  async function restoreProject(id) {
    return updateProject(id, { deleted: false, deletedAt: null })
  }
  async function hardDeleteProject(id) {
    await api.del(`${path}/${id}`)
    await refetch()
  }

  return { projects, deletedProjects, loading, addProject, updateProject, softDeleteProject, restoreProject, hardDeleteProject }
}

// Aggregates projects across every client in the org — used by the Dashboard. Fans out
// one fetch per client rather than a single cross-tenant query, matching the server's
// per-client REST resource shape.
export function useAllProjects(orgId, clients) {
  const [all, setAll] = useState([])
  const key = JSON.stringify(clients?.map((c) => c.id) || [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!orgId || !clients?.length) { setAll([]); return }
      const lists = await Promise.all(
        clients.map((c) => api.get(`/organizations/${orgId}/clients/${c.id}/projects`).then((list) => list.map((p) => ({ ...p, clientId: c.id, clientName: c.name }))))
      )
      if (!cancelled) setAll(lists.flat())
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, key])

  return { projects: all.filter((p) => !p.deleted) }
}
