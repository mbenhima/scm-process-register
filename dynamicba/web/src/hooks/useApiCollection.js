import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

// Fetches a list from the API and exposes a `refetch` for hooks to call after a mutation
// (there is no realtime push in this local full-stack build — see README "Known
// Simplifications"). `path` may be null/undefined to skip fetching until it is known.
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

  return { data, loading, refetch }
}
