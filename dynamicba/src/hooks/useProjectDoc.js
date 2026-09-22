import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { updateDocAt } from '../lib/firestoreHelpers'

export function useProjectDoc(orgId, clientId, projectId) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const path = orgId && clientId && projectId ? ['organizations', orgId, 'clients', clientId, 'projects', projectId] : null

  useEffect(() => {
    if (!path) { setProject(null); setLoading(false); return }
    setLoading(true)
    return onSnapshot(doc(db, ...path), (s) => { setProject(s.exists() ? { id: s.id, ...s.data() } : null); setLoading(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path?.join('/')])

  async function patch(data) {
    return updateDocAt(path, data)
  }

  return { project, loading, patch }
}
