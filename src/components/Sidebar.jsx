import React from 'react'
import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { canManageHierarchy, canManageUsers } from '../utils/rbac.js'

const CORE_MODULES = [
  { path: '/app/m4', key: 'navM4' },
  { path: '/app/m5', key: 'navM5' },
  { path: '/app/m6', key: 'navM6' },
  { path: '/app/m7', key: 'navM7' },
  { path: '/app/m8', key: 'navM8' },
  { path: '/app/m9', key: 'navM9' },
  { path: '/app/m10', key: 'navM10' },
  { path: '/app/m11', key: 'navM11' },
  { path: '/app/m12', key: 'navM12' },
  { path: '/app/m13', key: 'navM13' },
  { path: '/app/m14', key: 'navM14' },
  { path: '/app/m15', key: 'navM15' },
  { path: '/app/m16', key: 'navM16' },
]

export default function Sidebar({ mobileOpen, onNavigate }) {
  const { t } = useI18n()
  const { currentUser } = useAppState()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-600 text-white' : 'text-brand-900/80 hover:bg-brand-50'
    }`

  return (
    <aside
      className={`${mobileOpen ? 'block' : 'hidden'} md:block w-64 shrink-0 border-e border-brand-100 bg-white h-full overflow-y-auto`}
    >
      <div className="px-4 py-5 flex items-center gap-2 border-b border-brand-100">
        <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center text-white font-bold">j</div>
        <div>
          <div className="font-bold text-brand-950 leading-tight">{t('appName')}</div>
          <div className="text-[10px] text-ink/40 leading-tight">{t('poweredBy')}</div>
        </div>
      </div>

      <nav className="p-3 space-y-4">
        <div>
          <div className="label px-3">{t('sectionPlatform')}</div>
          <div className="space-y-1">
            <NavLink to="/app/dashboard" className={linkClass} onClick={onNavigate}>
              {t('navPortfolio')}
            </NavLink>
            {canManageHierarchy(currentUser?.role) && (
              <NavLink to="/app/m1" className={linkClass} onClick={onNavigate}>
                {t('navM1')}
              </NavLink>
            )}
            {canManageUsers(currentUser?.role) && (
              <NavLink to="/app/m2" className={linkClass} onClick={onNavigate}>
                {t('navM2')}
              </NavLink>
            )}
          </div>
        </div>

        <div>
          <div className="label px-3">{t('sectionCore')}</div>
          <div className="space-y-1">
            {CORE_MODULES.map((m) => (
              <NavLink key={m.path} to={m.path} className={linkClass} onClick={onNavigate}>
                {t(m.key)}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <div className="label px-3">{t('sectionAI')}</div>
          <div className="space-y-1">
            <NavLink to="/app/m17" className={linkClass} onClick={onNavigate}>
              {t('navM17')}
            </NavLink>
          </div>
        </div>
      </nav>
    </aside>
  )
}
