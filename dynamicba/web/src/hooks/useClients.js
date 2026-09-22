import { useApiCollection } from './useApiCollection'
import { api } from '../lib/api'

export function useClients(orgId) {
  const path = orgId ? `/organizations/${orgId}/clients` : null
  const { data, loading, refetch } = useApiCollection(path)
  const clients = data.filter((c) => !c.deleted)
  const deletedClients = data.filter((c) => c.deleted)

  async function addClient({ name, industry }) {
    await api.post(path, { name, industry: industry || '' })
    await refetch()
  }
  async function updateClient(id, patch) {
    await api.patch(`${path}/${id}`, patch)
    await refetch()
  }
  async function softDeleteClient(id) {
    return updateClient(id, { deleted: true, deletedAt: new Date().toISOString() })
  }
  async function restoreClient(id) {
    return updateClient(id, { deleted: false, deletedAt: null })
  }
  async function hardDeleteClient(id) {
    await api.del(`${path}/${id}`)
    await refetch()
  }

  return { clients, deletedClients, loading, addClient, updateClient, softDeleteClient, restoreClient, hardDeleteClient }
}
