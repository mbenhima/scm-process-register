import { api } from '../lib/api'
import { useApiCollection } from './useApiCollection'

// Generic, schema-driven CRUD for any of the 32 D09 Information Class Model object
// classes, scoped to one project. Powers both the wizard steps (which call addRecord
// directly with structured data) and the generic Project Artifact Explorer.
export function useArtifacts(orgId, clientId, projectId, objectClassId) {
  const path = orgId && clientId && projectId && objectClassId
    ? `/organizations/${orgId}/clients/${clientId}/projects/${projectId}/artifacts/${objectClassId}/records`
    : null
  const { data, loading, refetch } = useApiCollection(path)

  async function addRecord(fields) {
    const record = await api.post(path, fields)
    await refetch()
    return record
  }
  async function updateRecord(id, patch) {
    await api.patch(`${path}/${id}`, patch)
    await refetch()
  }
  async function deleteRecord(id) {
    await api.del(`${path}/${id}`)
    await refetch()
  }

  return { records: data, loading, addRecord, updateRecord, deleteRecord }
}
