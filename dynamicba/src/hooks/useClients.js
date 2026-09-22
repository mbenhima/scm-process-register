import { useCollection } from './useCollection'
import { createDoc, updateDocAt, deleteDocAt } from '../lib/firestoreHelpers'

export function useClients(orgId) {
  const { data, loading } = useCollection(orgId ? ['organizations', orgId, 'clients'] : null)
  const clients = data.filter((c) => !c.deleted)
  const deletedClients = data.filter((c) => c.deleted)

  async function addClient({ name, industry }) {
    return createDoc(['organizations', orgId, 'clients'], { name, industry: industry || '', deleted: false })
  }
  async function updateClient(id, patch) {
    return updateDocAt(['organizations', orgId, 'clients', id], patch)
  }
  async function softDeleteClient(id) {
    return updateDocAt(['organizations', orgId, 'clients', id], { deleted: true, deletedAt: new Date().toISOString() })
  }
  async function restoreClient(id) {
    return updateDocAt(['organizations', orgId, 'clients', id], { deleted: false, deletedAt: null })
  }
  async function hardDeleteClient(id) {
    return deleteDocAt(['organizations', orgId, 'clients', id])
  }

  return { clients, deletedClients, loading, addClient, updateClient, softDeleteClient, restoreClient, hardDeleteClient }
}
