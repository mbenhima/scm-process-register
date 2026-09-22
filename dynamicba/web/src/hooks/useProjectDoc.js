import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useProjectDoc(orgId, clientId, projectId) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const path = orgId && clientId && projectId ? `/organizations/${orgId}/clients/${clientId}/projects/${projectId}` : null

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
    return updated
  }

  return { project, loading, patch }
}
