import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { api } from '../lib/api.js';

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-orange-tint text-orange-deep' : 'text-grey-ink hover:bg-grey-light'
        }`
      }
    >
      <span className="w-5 text-center">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function NavSection({ title, children }) {
  return (
    <div className="mt-5">
      {title && <div className="px-3 mb-1 text-[11px] font-bold uppercase tracking-widest text-grey-medium">{title}</div>}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export default function Layout() {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const { t, lang, setLang, languages, dir } = useI18n();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadAlerts() {
      if (!hasPermission('alert.view')) return;
      try {
        const rows = await api.get('/alerts?unread=true');
        if (!cancelled) setUnreadCount(rows.length);
      } catch { /* noop */ }
    }
    loadAlerts();
    const id = setInterval(loadAlerts, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [hasPermission]);

  const orgName = lang === 'fr' ? (user?.organization?.name_fr || user?.organization?.name)
    : lang === 'ar' ? (user?.organization?.name_ar || user?.organization?.name)
    : user?.organization?.name;

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-64 shrink-0 border-e border-grey-line bg-white flex flex-col">
        <div className="px-4 py-5 border-b border-grey-line">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-orange flex items-center justify-center text-white font-title font-bold text-lg">N</div>
            <div>
              <div className="font-title font-bold text-grey-dark leading-tight">{t('appName')}</div>
              <div className="text-[11px] text-grey-medium leading-tight">{t('tagline')}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <NavSection>
            <NavItem to="/dashboard" label={t('nav.dashboard')} icon="◧" />
            {hasPermission('fiche.view') && <NavItem to="/fiches" label={t('nav.fiches')} icon="📄" />}
            {hasPermission('action.view') && <NavItem to="/actions" label={t('nav.actions')} icon="✓" />}
            {hasPermission('capitalization.view') && <NavItem to="/capitalization" label={t('nav.capitalization')} icon="🔍" />}
            {hasPermission('standard.view') && <NavItem to="/standards" label={t('nav.standards')} icon="📘" />}
            {hasPermission('aiUseCase.view') && <NavItem to="/ai-use-cases" label={t('nav.aiUseCases')} icon="✦" />}
            {hasPermission('report.view') && <NavItem to="/reports" label={t('nav.reports')} icon="📊" />}
            {hasPermission('alert.view') && (
              <NavItem
                to="/alerts"
                label={<span className="flex items-center justify-between w-full">{t('nav.alerts')}
                  {unreadCount > 0 && <span className="ms-2 rounded-full bg-orange text-white text-[10px] px-1.5 py-0.5">{unreadCount}</span>}
                </span>}
                icon="🔔"
              />
            )}
          </NavSection>

          {hasAnyPermission('hierarchy.view', 'obs.view') && (
            <NavSection title={t('nav.identityGroup')}>
              {hasPermission('hierarchy.view') && <NavItem to="/hierarchy" label={t('nav.hierarchy')} icon="🏢" />}
              {hasPermission('obs.view') && <NavItem to="/obs" label={t('nav.obs')} icon="🗂" />}
              {hasPermission('user.view') && <NavItem to="/users" label={t('nav.users')} icon="👤" />}
              {hasPermission('role.view') && <NavItem to="/permissions" label={t('nav.permissionMatrix')} icon="🛡" />}
            </NavSection>
          )}

          {hasAnyPermission('governance.view', 'license.view') && (
            <NavSection title={t('nav.governanceGroup')}>
              {hasPermission('governance.view') && <NavItem to="/governance" label={t('nav.governance')} icon="⚙" />}
              {hasPermission('license.view') && <NavItem to="/license" label={t('nav.license')} icon="🔑" />}
            </NavSection>
          )}
        </nav>

        <div className="px-4 py-3 border-t border-grey-line text-[10px] text-grey-medium">{t('poweredBy')}</div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-grey-line bg-white flex items-center justify-between px-6">
          <div>
            <div className="text-sm font-semibold text-grey-dark">{orgName}</div>
            {user?.organization?.sector && (
              <div className="text-[11px] text-grey-medium">{t(`sector.${user.organization.sector}`)}</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="text-sm border border-grey-line rounded-md px-2 py-1.5 bg-white"
            >
              {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <div className="text-end">
              <div className="text-sm font-semibold text-grey-dark">{user?.firstName} {user?.lastName}</div>
              <div className="text-[11px] text-grey-medium">{user?.roles?.[0]?.name}</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="btn-secondary !px-3 !py-1.5 text-xs"
            >
              {t('auth.signOut')}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6" dir={dir}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
