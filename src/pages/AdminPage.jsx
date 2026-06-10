// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react'
import {
  collection, getDocs, query, updateDoc, doc,
  where, addDoc, serverTimestamp
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../firebase'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

const ADMIN_TABS = ['userManagement', 'allScenarios', 'globalInsights']

export default function AdminPage() {
  const { t } = useLang()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [users, setUsers] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'user' })
  const [addingUser, setAddingUser] = useState(false)
  const [addError, setAddError] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    const [usersSnap, scenSnap, coSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'scenarios')),
      getDocs(collection(db, 'companies')),
    ])
    setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setScenarios(scenSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setCompanies(coSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const toggleStatus = async (uid, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await updateDoc(doc(db, 'users', uid), { status: newStatus })
    fetchAll()
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setAddError('')
    setAddingUser(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, newUser.email, 'changeme')
      await addDoc(collection(db, 'users'), {
        uid: cred.user.uid,
        email: newUser.email,
        name: newUser.name || newUser.email.split('@')[0],
        role: newUser.role,
        status: 'active',
        createdAt: serverTimestamp(),
      })
      setNewUser({ email: '', name: '', role: 'user' })
      setShowAddUser(false)
      fetchAll()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAddingUser(false)
    }
  }

  // Insights
  const totalInScope = scenarios.reduce(() => 0, 0) // will be computed differently
  const sectorCounts = {}
  companies.forEach(c => {
    if (c.sector) sectorCounts[c.sector] = (sectorCounts[c.sector] || 0) + 1
  })
  const scenariosPerUser = {}
  scenarios.forEach(s => {
    scenariosPerUser[s.userId] = (scenariosPerUser[s.userId] || 0) + 1
  })

  const companyMap = {}
  companies.forEach(c => { companyMap[c.id] = c })

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('adminPanel')}</h1>
        <p className="text-gray-500 text-sm mt-1">System administration — all data visible</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {ADMIN_TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === idx ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">{t('loading')}</p>
      ) : (
        <>
          {/* Tab 0: User Management */}
          {activeTab === 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">{users.length} Users</h2>
                <button onClick={() => setShowAddUser(true)} className="btn-primary text-sm">+ {t('addUser')}</button>
              </div>

              {showAddUser && (
                <div className="card p-5">
                  <h3 className="font-medium text-gray-800 mb-4">{t('addUser')}</h3>
                  {addError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-3">{addError}</div>}
                  <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('name')}</label>
                      <input type="text" value={newUser.name} onChange={e => setNewUser(u => ({...u, name: e.target.value}))} className="input-field" placeholder="Full name" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('userEmail')} *</label>
                      <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({...u, email: e.target.value}))} required className="input-field" placeholder="user@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('role')}</label>
                      <select value={newUser.role} onChange={e => setNewUser(u => ({...u, role: e.target.value}))} className="input-field">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3 text-xs text-gray-400">Initial password will be set to <code>changeme</code></div>
                    <div className="sm:col-span-3 flex gap-3">
                      <button type="submit" disabled={addingUser} className="btn-primary">{addingUser ? 'Creating…' : t('create')}</button>
                      <button type="button" onClick={() => setShowAddUser(false)} className="btn-secondary">{t('cancel')}</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Name', t('email'), t('role'), t('status'), 'Scenarios', t('createdAt'), t('actions')].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => {
                      const scenCount = scenariosPerUser[u.id] || 0
                      const isCurrentUser = u.id === currentUser?.uid
                      return (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{u.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${u.role === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{scenCount}</td>
                          <td className="px-4 py-3 text-gray-500">{u.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}</td>
                          <td className="px-4 py-3">
                            {!isCurrentUser && u.role !== 'admin' && (
                              <button
                                onClick={() => toggleStatus(u.id, u.status)}
                                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                                  u.status === 'active'
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}
                              >
                                {u.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            {isCurrentUser && <span className="text-xs text-gray-400">You</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 1: All Scenarios */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">{scenarios.length} Scenarios across all users</h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {[t('scenarioName'), t('description'), 'Company', 'User', t('createdAt')].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {scenarios.map(sc => {
                      const co = companyMap[sc.companyId]
                      const u = users.find(u => u.id === sc.userId)
                      return (
                        <tr key={sc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{sc.scenarioName}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{sc.description || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{co?.companyName || sc.companyId}</td>
                          <td className="px-4 py-3 text-gray-600">{u?.email || sc.userId}</td>
                          <td className="px-4 py-3 text-gray-500">{sc.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Global Insights */}
          {activeTab === 2 && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: t('totalUsers'), value: users.length, color: 'brand' },
                  { label: t('activeUsers'), value: users.filter(u => u.status === 'active').length, color: 'green' },
                  { label: t('totalCompanies'), value: companies.length, color: 'purple' },
                  { label: t('totalScenarios'), value: scenarios.length, color: 'amber' },
                ].map(card => (
                  <div key={card.label} className="card p-4">
                    <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Companies by Sector */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Companies by Sector</h3>
                <div className="space-y-2">
                  {Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]).map(([sector, count]) => {
                    const pct = Math.round((count / companies.length) * 100)
                    return (
                      <div key={sector}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700">{sector}</span>
                          <span className="text-gray-500">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className="h-2 bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(sectorCounts).length === 0 && <p className="text-sm text-gray-400">No sector data yet.</p>}
                </div>
              </div>

              {/* Scenarios per User */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Scenarios per User</h3>
                <div className="space-y-2">
                  {Object.entries(scenariosPerUser).map(([uid, count]) => {
                    const u = users.find(u => u.id === uid)
                    return (
                      <div key={uid} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-gray-700">{u?.name || u?.email || uid}</span>
                        <span className="badge bg-brand-50 text-brand-700">{count} scenario{count !== 1 ? 's' : ''}</span>
                      </div>
                    )
                  })}
                  {Object.keys(scenariosPerUser).length === 0 && <p className="text-sm text-gray-400">No scenarios yet.</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
