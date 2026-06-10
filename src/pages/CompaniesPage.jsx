// src/pages/CompaniesPage.jsx
import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useApp } from '../contexts/AppContext'
import { SECTORS } from '../lib/constants'

export default function CompaniesPage() {
  const { user } = useAuth()
  const { t } = useLang()
  const { activeCompany, setActiveCompany } = useApp()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ companyName: '', sector: '', industry: '' })
  const [saving, setSaving] = useState(false)

  const fetchCompanies = async () => {
    setLoading(true)
    const q = query(collection(db, 'companies'), where('userId', '==', user.uid))
    const snap = await getDocs(q)
    setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { fetchCompanies() }, [user])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.companyName.trim()) return
    setSaving(true)
    await addDoc(collection(db, 'companies'), {
      ...form,
      userId: user.uid,
      createdAt: serverTimestamp(),
    })
    setForm({ companyName: '', sector: '', industry: '' })
    setShowForm(false)
    setSaving(false)
    fetchCompanies()
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    await deleteDoc(doc(db, 'companies', id))
    if (activeCompany?.id === id) setActiveCompany(null)
    fetchCompanies()
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('myCompanies')}</h1>
          <p className="text-gray-500 text-sm mt-1">{companies.length} {companies.length === 1 ? 'company' : 'companies'}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ {t('addCompany')}</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">{t('addCompany')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('companyName')} *</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  required
                  className="input-field"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sector')}</label>
                <select
                  value={form.sector}
                  onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select sector</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('industry')}</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Automotive"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? t('loading') : t('save')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">{t('loading')}</p>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-3">🏢</span>
          <p>{t('noCompanies')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(co => (
            <div
              key={co.id}
              className={`card p-5 cursor-pointer transition-all ${activeCompany?.id === co.id ? 'ring-2 ring-brand-500' : 'hover:shadow-md'}`}
              onClick={() => setActiveCompany(co)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{co.companyName}</h3>
                  {co.sector && (
                    <span className="badge bg-brand-50 text-brand-700 mt-1">{co.sector}</span>
                  )}
                  {co.industry && <p className="text-xs text-gray-400 mt-1">{co.industry}</p>}
                </div>
                {activeCompany?.id === co.id && (
                  <span className="text-brand-600 text-lg ml-2">✓</span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={e => { e.stopPropagation(); setActiveCompany(co) }}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  {activeCompany?.id === co.id ? 'Selected' : t('selectCompany')}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(co.id) }}
                  className="text-red-400 hover:text-red-600 text-xs px-2"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
