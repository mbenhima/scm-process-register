// src/pages/ScenariosPage.jsx
import React, { useState, useEffect } from 'react'
import {
  collection, query, where, getDocs, addDoc, deleteDoc, doc,
  serverTimestamp, writeBatch, getDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useApp } from '../contexts/AppContext'
import { MASTER_PROCESSES, DEFAULT_EDITABLE } from '../lib/constants'

export default function ScenariosPage() {
  const { user, userDoc } = useAuth()
  const { t } = useLang()
  const { activeCompany, activeScenario, setActiveScenario } = useApp()
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ scenarioName: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const fetchScenarios = async () => {
    if (!activeCompany) return
    setLoading(true)
    const q = query(
      collection(db, 'scenarios'),
      where('userId', '==', user.uid),
      where('companyId', '==', activeCompany.id)
    )
    const snap = await getDocs(q)
    setScenarios(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { fetchScenarios() }, [activeCompany])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.scenarioName.trim() || !activeCompany) return
    setSaving(true)
    try {
      // Create scenario doc
      const scenarioRef = await addDoc(collection(db, 'scenarios'), {
        scenarioName: form.scenarioName.trim(),
        description: form.description.trim(),
        companyId: activeCompany.id,
        userId: user.uid,
        createdAt: serverTimestamp(),
        createdBy: userDoc?.name || user.email,
      })

      // Auto-populate 49 processes using batch writes
      const batch = writeBatch(db)
      MASTER_PROCESSES.forEach(master => {
        const processRef = doc(collection(db, 'processes'))
        batch.set(processRef, {
          macroId: master.macroId,
          scenarioId: scenarioRef.id,
          companyId: activeCompany.id,
          userId: user.uid,
          ...DEFAULT_EDITABLE,
          // Pre-fill some fields from master defaults
          Process_Type: master.processType || '',
          Parent_Cycle: master.parentCycle || '',
          Start_Event_Type: master.startEventType || '',
          End_Event_Type: master.endEventType || '',
          Frequency: master.frequency || '',
          Process_Criticality: master.processCriticality || '',
          Audit_Criticality: master.auditCriticality || '',
          SLA: master.sla || '',
          createdAt: serverTimestamp(),
        })
      })
      await batch.commit()

      setForm({ scenarioName: '', description: '' })
      setShowForm(false)
      setSaving(false)
      fetchScenarios()
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  const handleDelete = async (scenario) => {
    if (!window.confirm(t('deleteScenarioConfirm'))) return
    setDeleting(scenario.id)
    try {
      // Move all processes to recycle bin
      const q = query(
        collection(db, 'processes'),
        where('scenarioId', '==', scenario.id),
        where('userId', '==', user.uid)
      )
      const snap = await getDocs(q)
      const batch = writeBatch(db)

      snap.docs.forEach(processDoc => {
        const recycleRef = doc(collection(db, 'recycle'))
        batch.set(recycleRef, {
          ...processDoc.data(),
          originalProcessId: processDoc.id,
          originalScenarioId: scenario.id,
          originalScenarioName: scenario.scenarioName,
          companyId: activeCompany?.id,
          companyName: activeCompany?.companyName,
          userId: user.uid,
          archivedAt: serverTimestamp(),
        })
        batch.delete(processDoc.ref)
      })

      // Delete scenario
      batch.delete(doc(db, 'scenarios', scenario.id))
      await batch.commit()

      if (activeScenario?.id === scenario.id) setActiveScenario(null)
      fetchScenarios()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  if (!activeCompany) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
        <span className="text-5xl">🏢</span>
        <p>Please select a company first.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('myScenarios')}</h1>
          <p className="text-gray-500 text-sm mt-1">{activeCompany.companyName}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ {t('addScenario')}</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">{t('addScenario')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('scenarioName')} *</label>
                <input
                  type="text"
                  value={form.scenarioName}
                  onChange={e => setForm(f => ({ ...f, scenarioName: e.target.value }))}
                  required
                  className="input-field"
                  placeholder="e.g. Baseline 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input-field"
                  placeholder="Brief description"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">Creating a scenario will auto-populate 49 macro processes.</p>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating…' : t('create')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">{t('loading')}</p>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-3">📋</span>
          <p>{t('noScenarios')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scenarios.map(sc => (
            <div
              key={sc.id}
              className={`card p-5 cursor-pointer transition-all ${activeScenario?.id === sc.id ? 'ring-2 ring-brand-500' : 'hover:shadow-md'}`}
              onClick={() => setActiveScenario(sc)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{sc.scenarioName}</h3>
                  {sc.description && <p className="text-sm text-gray-500 mt-1 truncate">{sc.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    By {sc.createdBy} · {sc.createdAt?.toDate?.()?.toLocaleDateString?.() || ''}
                  </p>
                </div>
                {activeScenario?.id === sc.id && <span className="text-brand-600 text-lg">✓</span>}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={e => { e.stopPropagation(); setActiveScenario(sc) }}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  {activeScenario?.id === sc.id ? 'Active' : 'Select'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(sc) }}
                  disabled={deleting === sc.id}
                  className="text-red-400 hover:text-red-600 text-xs px-2"
                >
                  {deleting === sc.id ? 'Deleting…' : t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
