import React from 'react'
import { NavLink } from 'react-router-dom'
import { useI18n, LANGUAGES } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { visibleOrganizations, visibleProjects, roleLabelKey } from '../utils/rbac.js'
import NotificationBell from './NotificationBell.jsx'

export default function TopBar({ onMenuClick }) {
  const { t, lang, setLang } = useI18n()
  const { data, currentUser, scope, setScope, signOut } = useAppState()

  const orgs = visibleOrganizations(currentUser, data)
  const projects = scope.orgId ? visibleProjects(currentUser, data, scope.orgId) : []

  function handleOrgChange(orgId) {
    const projs = visibleProjects(currentUser, data, orgId)
    setScope({ orgId, cmProjectId: projs[0]?.id || null })
  }

  return (
    <header className="h-16 shrink-0 border-b border-brand-100 bg-white flex items-center gap-3 px-4">
      <button className="md:hidden btn-ghost px-2" onClick={onMenuClick} aria-label="menu">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <select
          className="input max-w-[220px]"
          value={scope.orgId || ''}
          onChange={(e) => handleOrgChange(e.target.value)}
        >
          <option value="" disabled>
            {t('selectOrg')}
          </option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          className="input max-w-[240px] hidden sm:block"
          value={scope.cmProjectId || ''}
          onChange={(e) => setScope({ cmProjectId: e.target.value })}
        >
          <option value="">{t('selectProject')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <select className="input w-auto" value={lang} onChange={(e) => setLang(e.target.value)}>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      <NotificationBell />

      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-sm font-semibold text-brand-950">{currentUser?.name}</span>
        <span className="text-[11px] text-ink/50">{t(roleLabelKey(currentUser?.role))}</span>
      </div>
      <NavLink to="/app/help" className="btn-ghost px-2" title={t('help')} aria-label={t('help')}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7.6 7.8c0-1.3 1-2.3 2.4-2.3s2.4.9 2.4 2.1c0 1-.6 1.5-1.4 2.1-.7.5-1 .9-1 1.6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="14.2" r="0.9" fill="currentColor" />
        </svg>
      </NavLink>
      <button className="btn-ghost text-sm" onClick={signOut}>
        {t('logout')}
      </button>
    </header>
  )
}
