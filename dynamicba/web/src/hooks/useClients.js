import { useApiCollection } from './useApiCollection'
import { api } from '../lib/api'
import { invalidate } from '../lib/queryStore'

export function useClients(orgId) {
  const path = orgId ? `/organizations/${orgId}/clients` : null
  const { data, loading } = useApiCollection(path)
  const clients = data.filter((c) => !c.deleted)
  const deletedClients = data.filter((c) => c.deleted)

  async function addClient({ name, industry }) {
    await api.post(path, { name, industry: industry || '' })
    invalidate(path)
  }
  async function updateClient(id, patch) {
    await api.patch(`${path}/${id}`, patch)
    invalidate(path)
  }
  async function softDeleteClient(id) {
    return updateClient(id, { deleted: true, deletedAt: new Date().toISOString() })
  }
  async function restoreClient(id) {
    return updateClient(id, { deleted: false, deletedAt: null })
  }
  async function hardDeleteClient(id) {
    await api.del(`${path}/${id}`)
    invalidate(path)
  }

  return { clients, deletedClients, loading, addClient, updateClient, softDeleteClient, restoreClient, hardDeleteClient }
}
