import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { invalidate } from '../lib/queryStore'

export function useProjectDoc(orgId, clientId, projectId) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const path = orgId && clientId && projectId ? `/organizations/${orgId}/clients/${clientId}/projects/${projectId}` : null
  const listPath = orgId && clientId ? `/organizations/${orgId}/clients/${clientId}/projects` : null

  const load = useCallback(async () => {
    if (!path) { setProject(null); setLoading(false); return }
    setLoading(true)
    const p = await api.get(path)
    setProject(p)
    setLoading(false)
  }, [path])

  useEffect(() => { load() }, [load])

  async function patch(data) {
    const updated = await api.patch(path, data)
    setProject(updated)
    if (listPath) invalidate(listPath) // keep the Projects list's status/step column live
    return updated
  }

  return { project, loading, patch }
}
