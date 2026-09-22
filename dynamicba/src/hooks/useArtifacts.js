import { useCollection } from './useCollection'
import { createDoc, updateDocAt, deleteDocAt } from '../lib/firestoreHelpers'

const base = (orgId, clientId, projectId, objectClassId) =>
  ['organizations', orgId, 'clients', clientId, 'projects', projectId, 'artifacts', objectClassId, 'records']

// Generic, schema-driven CRUD for any of the 32 D09 Information Class Model object
// classes, scoped to one project. This is what powers both the wizard steps (which call
// addRecord directly with structured data) and the generic Project Artifact Explorer.
export function useArtifacts(orgId, clientId, projectId, objectClassId) {
  const { data, loading } = useCollection(
    orgId && clientId && projectId && objectClassId ? base(orgId, clientId, projectId, objectClassId) : null
  )

  async function addRecord(fields) {
    return createDoc(base(orgId, clientId, projectId, objectClassId), fields)
  }
  async function updateRecord(id, patch) {
    return updateDocAt([...base(orgId, clientId, projectId, objectClassId), id], patch)
  }
  async function deleteRecord(id) {
    return deleteDocAt([...base(orgId, clientId, projectId, objectClassId), id])
  }

  return { records: data, loading, addRecord, updateRecord, deleteRecord }
}
