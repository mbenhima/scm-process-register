// src/pages/RecycleBinPage.jsx
import React, { useState, useEffect } from 'react'
import {
  collection, query, where, getDocs, deleteDoc, doc,
  setDoc, getDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'

export default function RecycleBinPage() {
  const { user } = useAuth()
  const { t } = useLang()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState([])
  const [restoreTarget, setRestoreTarget] = useState(null) // { itemId, item }

  const fetchItems = async () => {
    setLoading(true)
    const q = query(collection(db, 'recycle'), where('userId', '==', user.uid))
    const snap = await getDocs(q)
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))

    // Also fetch available scenarios for restore
    const sq = query(collection(db, 'scenarios'), where('userId', '==', user.uid))
    const ssnap = await getDocs(sq)
    setScenarios(ssnap.docs.map(d => ({ id: d.id, ...d.data() })))

    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [user])

  const handlePermanentDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    await deleteDoc(doc(db, 'recycle', id))
    fetchItems()
  }

  const handleRestore = async (item) => {
    // Check if original scenario still exists
    const scenarioRef = doc(db, 'scenarios', item.originalScenarioId)
    const scenarioSnap = await getDoc(scenarioRef)

    if (scenarioSnap.exists()) {
      // Restore directly
      await doRestore(item, item.originalScenarioId)
    } else {
      // Prompt user to pick a new scenario
      setRestoreTarget({ itemId: item.id, item })
    }
  }

  const doRestore = async (item, scenarioId) => {
    const {
      id: recycleId, originalProcessId, originalScenarioId, originalScenarioName,
      archivedAt, companyId: itemCompanyId, companyName, ...processData
    } = item
    // Create new process doc
    const newProcessRef = doc(collection(db, 'processes'))
    await setDoc(newProcessRef, {
      ...processData,
      scenarioId,
      updatedAt: serverTimestamp(),
    })
    // Remove from recycle
    await deleteDoc(doc(db, 'recycle', recycleId))
    setRestoreTarget(null)
    fetchItems()
    alert(t('restoreSuccess'))
  }

  const handleRestoreToSelected = async (scenarioId) => {
    if (!restoreTarget) return
    await doRestore(restoreTarget.item, scenarioId)
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('recycleBinTitle')}</h1>
        <p className="text-gray-500 text-sm mt-1">{items.length} archived {items.length === 1 ? 'process' : 'processes'}</p>
      </div>

      {/* Restore picker modal */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Original scenario not found</h3>
            <p className="text-sm text-gray-500 mb-4">
              The original scenario for <strong>{restoreTarget.item.macroName}</strong> no longer exists. Select a scenario to restore to:
            </p>
            {scenarios.length === 0 ? (
              <p className="text-sm text-gray-400">No scenarios available. Please create a scenario first.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scenarios.map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => handleRestoreToSelected(sc.id)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-brand-50 hover:border-brand-300 transition-colors text-sm"
                  >
                    <div className="font-medium text-gray-800">{sc.scenarioName}</div>
                    <div className="text-xs text-gray-400">{sc.description}</div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setRestoreTarget(null)}
              className="mt-4 btn-secondary w-full"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">{t('loading')}</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-3">🗑️</span>
          <p>{t('noRecycledItems')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[t('macroId'), t('archivedProcess'), t('originalScenario'), 'Company', t('archivedDate'), t('actions')].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-brand-700">{item.macroId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.macroName || item.macroId}</td>
                  <td className="px-4 py-3 text-gray-600">{item.originalScenarioName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.companyName || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {item.archivedAt?.toDate?.()?.toLocaleDateString?.() || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestore(item)}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        {t('restore')}
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(item.id)}
                        className="btn-danger text-xs py-1 px-3"
                      >
                        {t('permanentDelete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
