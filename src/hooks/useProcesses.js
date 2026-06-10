// src/hooks/useProcesses.js
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { MASTER_PROCESSES } from '../lib/constants'
import { deriveAll, calcWave } from '../lib/formulas'

// Sort processes by priority score desc, assign ranks
function enrichWithRanks(processes) {
  const withDerived = processes.map(p => {
    const d = deriveAll(p)
    return { ...p, ...d }
  })
  // Rank by priorityScore desc
  const sorted = [...withDerived].sort((a, b) => b.priorityScore - a.priorityScore)
  const enriched = withDerived.map(p => {
    const higherCount = sorted.filter(s => s.priorityScore > p.priorityScore).length
    const rank = higherCount + 1
    return { ...p, rank, wave: calcWave(rank) }
  })
  return enriched
}

export function useProcesses(scenarioId, userId) {
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!scenarioId || !userId) { setProcesses([]); return }
    setLoading(true)
    const q = query(
      collection(db, 'processes'),
      where('scenarioId', '==', scenarioId),
      where('userId', '==', userId)
    )
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Merge with MASTER read-only data
      const merged = docs.map(doc => {
        const master = MASTER_PROCESSES.find(m => m.macroId === doc.macroId) || {}
        return { ...master, ...doc }
      })
      setProcesses(enrichWithRanks(merged))
      setLoading(false)
    })
    return unsub
  }, [scenarioId, userId])

  return { processes, loading }
}
