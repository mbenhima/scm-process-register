import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useClients } from '../hooks/useClients'
import { useProjects } from '../hooks/useProjects'
import { useLayoutPrefs } from '../hooks/useLayoutPrefs'
import NavMenu from './NavMenu'
import AIAssistantWidget from './AIAssistantWidget'

export default function Layout() {
  const { profile, logout } = useAuth()
  const { orgId, organization, licence, activeClientId, activeProjectId, selectClient, selectProject } = useApp()
  const { t, lang, setLang } = useLanguage()
  const { clients } = useClients(orgId)
  const { projects } = useProjects(orgId, activeClientId)
  const { position, pinned, setPosition, togglePinned } = useLayoutPrefs()
  const navigate = useNavigate()
  const [showAssistant, setShowAssistant] = useState(false)

  const vertical = position === 'left' || position === 'right'
  const navFirst = position === 'left' || position === 'top'

  const menu = (
    <NavMenu
      position={position}
      pinned={pinned}
      onSetPosition={setPosition}
      onTogglePinned={togglePinned}
      t={t}
      lang={lang}
      setLang={setLang}
      organization={organization}
      licence={licence}
      isAdmin={profile?.roles?.includes('org_admin')}
      onLogout={() => { logout(); navigate('/login') }}
    />
  )

  return (
    <div className={`flex h-screen bg-bg ${vertical ? 'flex-row' : 'flex-col'}`}>
      {navFirst && menu}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-grey-line px-6 py-3 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="label !mb-0 text-grey-medium whitespace-nowrap">{t('select_client')}</label>
            <select className="input !w-48" value={activeClientId || ''} onChange={(e) => selectClient(e.target.value || null)}>
              <option value="">—</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="label !mb-0 text-grey-medium whitespace-nowrap">{t('select_project')}</label>
            <select className="input !w-56" value={activeProjectId || ''} onChange={(e) => selectProject(e.target.value || null)} disabled={!activeClientId}>
              <option value="">—</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex-1" />
          <button className="btn-secondary text-xs" onClick={() => setShowAssistant((s) => !s)}>
            <MessageCircle size={15} strokeWidth={2} aria-hidden="true" />
            {t('nav_assistant')}
          </button>
          <div className="text-xs text-grey-medium text-right leading-snug">
            <div className="font-semibold text-grey-dark">{profile?.name}</div>
            <div>{profile?.roles?.join(', ')}</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {!navFirst && menu}
      {showAssistant && <AIAssistantWidget onClose={() => setShowAssistant(false)} />}
    </div>
  )
}
