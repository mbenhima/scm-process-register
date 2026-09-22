import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy as fbOrderBy, where } from 'firebase/firestore'
import { db } from '../firebase'

// Generic realtime Firestore collection subscription. `pathSegments` is an array of
// path parts (e.g. ['organizations', orgId, 'clients']); pass null/undefined segments
// to skip subscribing until the path is fully known (e.g. before an org is selected).
// `whereClauses` is an optional array of [field, op, value] triples.
export function useCollection(pathSegments, { orderByField, whereClauses } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const ready = pathSegments && pathSegments.every((s) => !!s) && !(whereClauses || []).some(([, , v]) => v === undefined || v === null)
  const key = ready ? pathSegments.join('/') + JSON.stringify(whereClauses || []) : null

  useEffect(() => {
    if (!ready) { setData([]); setLoading(false); return }
    setLoading(true)
    let q = collection(db, ...pathSegments)
    if (whereClauses) for (const [field, op, value] of whereClauses) q = query(q, where(field, op, value))
    if (orderByField) q = query(q, fbOrderBy(orderByField))
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, orderByField])

  return { data, loading }
}
