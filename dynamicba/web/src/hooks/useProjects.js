import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useApiCollection } from './useApiCollection'
import { invalidate, subscribe } from '../lib/queryStore'

export function useProjects(orgId, clientId) {
  const path = orgId && clientId ? `/organizations/${orgId}/clients/${clientId}/projects` : null
  const { data, loading } = useApiCollection(path)
  const projects = data.filter((p) => !p.deleted)
  const deletedProjects = data.filter((p) => p.deleted)

  async function addProject({ name }) {
    await api.post(path, { name })
    invalidate(path)
  }
  async function updateProject(id, patch) {
    await api.patch(`${path}/${id}`, patch)
    invalidate(path)
  }
  async function softDeleteProject(id) {
    return updateProject(id, { deleted: true, deletedAt: new Date().toISOString() })
  }
  async function restoreProject(id) {
    return updateProject(id, { deleted: false, deletedAt: null })
  }
  async function hardDeleteProject(id) {
    await api.del(`${path}/${id}`)
    invalidate(path)
  }

  return { projects, deletedProjects, loading, addProject, updateProject, softDeleteProject, restoreProject, hardDeleteProject }
}

// Aggregates projects across every client in the org — used by the Dashboard. Fans out
// one fetch per client rather than a single cross-tenant query, matching the server's
// per-client REST resource shape, and re-fetches a client's projects whenever anything
// invalidates that client's project-list path (e.g. a new project created elsewhere).
export function useAllProjects(orgId, clients) {
  const [all, setAll] = useState([])
  const key = JSON.stringify(clients?.map((c) => c.id) || [])

  useEffect(() => {
    let cancelled = false
    const paths = (clients || []).map((c) => `/organizations/${orgId}/clients/${c.id}/projects`)

    async function loadOne(client, path) {
      const list = await api.get(path)
      if (cancelled) return
      setAll((prev) => [
        ...prev.filter((p) => p.clientId !== client.id),
        ...list.map((p) => ({ ...p, clientId: client.id, clientName: client.name })),
      ])
    }

    async function loadAll() {
      if (!orgId || !clients?.length) { setAll([]); return }
      await Promise.all(clients.map((c, i) => loadOne(c, paths[i])))
    }
    loadAll()

    const unsubs = (clients || []).map((c, i) => subscribe(paths[i], () => loadOne(c, paths[i])))
    return () => { cancelled = true; unsubs.forEach((u) => u()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, key])

  return { projects: all.filter((p) => !p.deleted) }
}
