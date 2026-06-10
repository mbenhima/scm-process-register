// src/components/Layout.jsx
import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useApp } from '../contexts/AppContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const NAV_ITEMS = [
  { key: 'dashboard', path: '/dashboard', icon: '⊞' },
  { key: 'companies', path: '/companies', icon: '🏢' },
  { key: 'scenarios', path: '/scenarios', icon: '📋' },
  { key: 'register', path: '/register', icon: '📊' },
  { key: 'recycleBin', path: '/recycle', icon: '🗑' },
  { key: 'framework', path: '/framework', icon: '📐' },
]

export default function Layout() {
  const { user, userDoc, logout, isAdmin } = useAuth()
  const { t, lang, setLang } = useLang()
  const { activeCompany, setActiveCompany, activeScenario, setActiveScenario } = useApp()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchCompanies = async () => {
      const q = query(collection(db, 'companies'), where('userId', '==', user.uid))
      const snap = await getDocs(q)
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setCompanies(list)
    }
    fetchCompanies()
  }, [user])

  useEffect(() => {
    if (!activeCompany) { setScenarios([]); return }
    const fetchScenarios = async () => {
      const q = query(collection(db, 'scenarios'),
        where('userId', '==', user.uid),
        where('companyId', '==', activeCompany.id))
      const snap = await getDocs(q)
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setScenarios(list)
    }
    fetchScenarios()
  }, [activeCompany, user])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isRtl = lang === 'ar'

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed top-0 ${isRtl ? 'right-0' : 'left-0'} h-full w-60 bg-brand-950 text-white flex flex-col z-40
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-brand-800">
          <div className="text-lg font-bold text-white tracking-tight">mySCM</div>
          <div className="text-xs text-brand-400 mt-0.5">Process Register</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {t(item.key)}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                }`
              }
            >
              <span>⚙️</span>{t('admin')}
            </NavLink>
          )}
        </nav>

        {/* Language Switcher */}
        <div className="px-4 py-3 border-t border-brand-800">
          <label className="text-xs text-brand-400 block mb-1">{t('language')}</label>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="w-full bg-brand-800 text-white text-sm rounded-lg px-2 py-1.5 border border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="en">{t('langEn')}</option>
            <option value="fr">{t('langFr')}</option>
            <option value="ar">{t('langAr')}</option>
          </select>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-t border-brand-800">
          <div className="text-xs text-brand-400 truncate">{userDoc?.name || user?.email}</div>
          {isAdmin && <div className="text-xs text-brand-500">Admin</div>}
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-left text-xs text-brand-400 hover:text-red-400 transition-colors"
          >
            {t('logout')} →
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? (isRtl ? 'mr-60' : 'ml-60') : ''} min-w-0`}>
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            ☰
          </button>

          {/* Company selector */}
          <select
            value={activeCompany?.id || ''}
            onChange={e => {
              const co = companies.find(c => c.id === e.target.value)
              setActiveCompany(co || null)
              setActiveScenario(null)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 max-w-[180px]"
          >
            <option value="">{t('selectCompany')}</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>

          {/* Scenario selector */}
          <select
            value={activeScenario?.id || ''}
            onChange={e => {
              const sc = scenarios.find(s => s.id === e.target.value)
              setActiveScenario(sc || null)
            }}
            disabled={!activeCompany}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 max-w-[200px] disabled:opacity-50"
          >
            <option value="">{t('selectScenarioLabel')}</option>
            {scenarios.map(s => (
              <option key={s.id} value={s.id}>{s.scenarioName}</option>
            ))}
          </select>

          <div className="flex-1" />
          <span className="text-xs text-gray-400 hidden sm:block">{userDoc?.name || user?.email}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
