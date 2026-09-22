import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, FolderKanban, ClipboardList, Network, ShieldCheck,
  BarChart3, Sparkles, Trash2, HelpCircle, Settings, LogOut, MessageCircle, ChevronDown,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useClients } from '../hooks/useClients'
import { useProjects } from '../hooks/useProjects'
import { PLAN_LABELS } from '../lib/catalogue'
import AIAssistantWidget from './AIAssistantWidget'

const NAV = [
  { to: '/dashboard', key: 'nav_dashboard', icon: LayoutDashboard },
  { to: '/clients', key: 'nav_clients', icon: Building2 },
  { to: '/projects', key: 'nav_projects', icon: FolderKanban },
  { to: '/workspace', key: 'nav_workspace', icon: ClipboardList },
  { to: '/catalogue', key: 'nav_catalogue', icon: Network },
  { to: '/governance', key: 'nav_governance', icon: ShieldCheck },
  { to: '/reports', key: 'nav_reports', icon: BarChart3 },
  { to: '/ai-use-cases', key: 'nav_ai', icon: Sparkles },
  { to: '/recycle', key: 'nav_recyclebin', icon: Trash2 },
  { to: '/help', key: 'nav_help', icon: HelpCircle },
]

function navLinkClass({ isActive }) {
  return [
    'flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors duration-150',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep',
    isActive ? 'bg-orange-tint text-orange-deep font-semibold' : 'text-grey-ink hover:bg-grey-light hover:text-grey-dark',
  ].join(' ')
}

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
        <div className="px-4 py-4 border-b border-grey-line">
          <div className="font-serif font-bold text-xl text-grey-dark leading-tight">{t('app_name')}</div>
          <div className="eyebrow mt-1">POWERACT Consulting</div>
          <div className="text-xs text-grey-medium mt-2 truncate">{organization?.name || '—'}</div>
          {licence && <span className="badge badge-good mt-2">{PLAN_LABELS[licence.plan] || licence.plan}</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={navLinkClass}>
              <n.icon size={17} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{t(n.key)}</span>
            </NavLink>
          ))}
          {profile?.roles?.includes('org_admin') && (
            <NavLink to="/admin" className={navLinkClass}>
              <Settings size={17} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{t('nav_admin')}</span>
            </NavLink>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-grey-line space-y-3">
          <div className="relative">
            <select
              className="input text-xs appearance-none pr-8"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Language"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-grey-medium" aria-hidden="true" />
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="btn-ghost w-full !justify-start !px-2 text-grey-medium hover:text-grey-dark"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden="true" />
            {t('nav_logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-grey-line px-6 py-3 flex items-center gap-6">
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
      {showAssistant && <AIAssistantWidget onClose={() => setShowAssistant(false)} />}
    </div>
  )
}
