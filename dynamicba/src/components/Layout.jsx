import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useClients } from '../hooks/useClients'
import { useProjects } from '../hooks/useProjects'
import { PLAN_LABELS } from '../lib/catalogue'
import AIAssistantWidget from './AIAssistantWidget'

const NAV = [
  { to: '/dashboard', key: 'nav_dashboard' },
  { to: '/clients', key: 'nav_clients' },
  { to: '/projects', key: 'nav_projects' },
  { to: '/workspace', key: 'nav_workspace' },
  { to: '/catalogue', key: 'nav_catalogue' },
  { to: '/governance', key: 'nav_governance' },
  { to: '/reports', key: 'nav_reports' },
  { to: '/ai-use-cases', key: 'nav_ai' },
  { to: '/recycle', key: 'nav_recyclebin' },
  { to: '/help', key: 'nav_help' },
]

export default function Layout() {
  const { profile, logout } = useAuth()
  const { orgId, organization, licence, activeClientId, activeProjectId, selectClient, selectProject } = useApp()
  const { t, lang, setLang } = useLanguage()
  const { clients } = useClients(orgId)
  const { projects } = useProjects(orgId, activeClientId)
  const navigate = useNavigate()
  const [showAssistant, setShowAssistant] = useState(false)

  return (
    <div className="flex h-screen bg-bg">
      <aside className="w-64 bg-white border-r border-grey-line flex flex-col">
        <div className="p-4 border-b border-grey-line">
          <div className="font-serif font-bold text-xl text-grey-dark">{t('app_name')}</div>
          <div className="text-xs text-grey-medium mt-1">{organization?.name || '—'}</div>
          {licence && (
            <span className="badge badge-good mt-2">{PLAN_LABELS[licence.plan] || licence.plan}</span>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm font-medium ${isActive ? 'bg-orange-tint text-orange-deep border-r-2 border-orange' : 'text-grey-ink hover:bg-grey-light'}`
              }
            >
              {t(n.key)}
            </NavLink>
          ))}
          {profile?.roles?.includes('org_admin') && (
            <NavLink to="/admin" className={({ isActive }) => `block px-4 py-2 text-sm font-medium ${isActive ? 'bg-orange-tint text-orange-deep border-r-2 border-orange' : 'text-grey-ink hover:bg-grey-light'}`}>
              {t('nav_admin')}
            </NavLink>
          )}
        </nav>
        <div className="p-4 border-t border-grey-line space-y-2">
          <select className="input text-xs" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
          <button onClick={() => { logout(); navigate('/login') }} className="text-xs text-grey-medium hover:text-orange-deep">
            {t('nav_logout')} →
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-grey-line px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="label !mb-0 text-grey-medium">{t('select_client')}</label>
            <select className="input !w-48" value={activeClientId || ''} onChange={(e) => selectClient(e.target.value || null)}>
              <option value="">—</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="label !mb-0 text-grey-medium">{t('select_project')}</label>
            <select className="input !w-56" value={activeProjectId || ''} onChange={(e) => selectProject(e.target.value || null)} disabled={!activeClientId}>
              <option value="">—</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex-1" />
          <button className="btn-secondary text-xs" onClick={() => setShowAssistant((s) => !s)}>{t('nav_assistant')}</button>
          <div className="text-xs text-grey-medium">{profile?.name} · {profile?.roles?.join(', ')}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      {showAssistant && <AIAssistantWidget onClose={() => setShowAssistant(false)} />}
    </div>
  )
}
