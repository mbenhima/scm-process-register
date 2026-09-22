import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { subscribe } from '../lib/queryStore'

// Fetches a list from the API and stays in sync with other components reading the same
// path: after any component mutates that path (via lib/api's mutate helpers, or by
// calling invalidate() from queryStore directly), every subscribed instance refetches —
// see queryStore.js for why this exists. `path` may be null/undefined to skip fetching
// until it is known.
export function useApiCollection(path) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!path) { setData([]); setLoading(false); return }
    setLoading(true)
    try {
      const result = await api.get(path)
      setData(result || [])
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => { refetch() }, [refetch])

  useEffect(() => {
    if (!path) return
    return subscribe(path, refetch)
  }, [path, refetch])

  return { data, loading, refetch }
}
