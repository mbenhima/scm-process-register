import React from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { canManageHierarchy, canManageUsers } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'

// Same module list/order as Sidebar.jsx (Section 1.6 of the SRS) — kept as a
// separate local copy since Sidebar doesn't export its arrays and this list
// only needs path + i18n key, not any nav-rendering behavior.
const PLATFORM_MODULES = [
  { path: '/app/m22', navKey: 'navM22', descKey: 'm22_desc' },
  { path: '/app/m18', navKey: 'navM18', descKey: 'm18_desc' },
  { path: '/app/m19', navKey: 'navM19', descKey: 'm19_desc' },
  { path: '/app/m16', navKey: 'navM16', descKey: 'm16_desc' },
]

const PROGRAM_MODULES = [
  { path: '/app/m3', navKey: 'navM3', descKey: 'm3_desc' },
  { path: '/app/m17', navKey: 'navM17', descKey: 'm17_desc' },
  { path: '/app/m4', navKey: 'navM4', descKey: 'm4_desc' },
  { path: '/app/m5', navKey: 'navM5', descKey: 'm5_desc' },
  { path: '/app/m6', navKey: 'navM6', descKey: 'm6_desc' },
  { path: '/app/m13', navKey: 'navM13', descKey: 'm13_desc' },
  { path: '/app/m7', navKey: 'navM7', descKey: 'm7_desc' },
  { path: '/app/m8', navKey: 'navM8', descKey: 'm8_desc' },
  { path: '/app/m9', navKey: 'navM9', descKey: 'm9_desc' },
  { path: '/app/m10', navKey: 'navM10', descKey: 'm10_desc' },
  { path: '/app/m11', navKey: 'navM11', descKey: 'm11_desc' },
  { path: '/app/m15', navKey: 'navM15', descKey: 'm15_desc' },
  { path: '/app/m20', navKey: 'navM20', descKey: 'm20_desc' },
  { path: '/app/m14', navKey: 'navM14', descKey: 'm14_desc' },
  { path: '/app/m12', navKey: 'navM12', descKey: 'm12_desc' },
  { path: '/app/m21', navKey: 'navM21', descKey: 'm21_desc' },
]

function ModuleRow({ path, title, description }) {
  return (
    <Link to={path} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2 hover:bg-brand-50 transition-colors">
      <div>
        <div className="text-sm font-semibold text-brand-950">{title}</div>
        <div className="text-xs text-ink/50">{description}</div>
      </div>
      <span className="text-ink/30 shrink-0">→</span>
    </Link>
  )
}

function Section({ title, children }) {
  return (
    <div className="card p-5 space-y-2">
      <h3 className="font-semibold text-brand-950">{title}</h3>
      {children}
    </div>
  )
}

export default function HelpPage() {
  const { t } = useI18n()
  const { currentUser, data } = useAppState()

  return (
    <div className="space-y-4">
      <PageHeader title={t('help_title')} description={t('help_desc')} />

      <Section title={t('help_gettingStarted')}>
        <p className="text-sm text-ink/70">{t('help_gettingStartedBody')}</p>
      </Section>

      <Section title={t('help_roles')}>
        <p className="text-sm text-ink/70">{t('help_rolesBody')}</p>
      </Section>

      <Section title={t('help_aiTiers')}>
        <p className="text-sm text-ink/70">{t('help_aiAssistiveBody')}</p>
        <p className="text-sm text-ink/70">{t('help_aiAugmentedBody')}</p>
        <p className="text-sm text-ink/50 italic">{t('help_aiNever')}</p>
      </Section>

      <Section title={t('help_askJourni')}>
        <p className="text-sm text-ink/70 mb-2">{t('help_askJourniBody')}</p>
        <div className="flex gap-2">
          <Link to="/app/query-data" className="btn-secondary text-xs">{t('navQueryData')}</Link>
          <Link to="/app/query-features" className="btn-secondary text-xs">{t('navQueryFeatures')}</Link>
        </div>
      </Section>

      <div className="card p-5 space-y-1">
        <h3 className="font-semibold text-brand-950 mb-2">{t('help_moduleDirectory')}</h3>
        <div className="text-xs font-semibold uppercase tracking-wide text-ink/40 px-3">{t('sectionPlatform')}</div>
        {canManageHierarchy(currentUser?.role, data.rolePermissions) && (
          <ModuleRow path="/app/m1" title={t('navM1')} description={t('m1_desc')} />
        )}
        {canManageUsers(currentUser?.role, data.rolePermissions) && (
          <ModuleRow path="/app/m2" title={t('navM2')} description={t('m2_desc')} />
        )}
        {PLATFORM_MODULES.map((m) => (
          <ModuleRow key={m.path} path={m.path} title={t(m.navKey)} description={t(m.descKey)} />
        ))}
        <div className="text-xs font-semibold uppercase tracking-wide text-ink/40 px-3 pt-2">{t('sectionCore')}</div>
        {PROGRAM_MODULES.map((m) => (
          <ModuleRow key={m.path} path={m.path} title={t(m.navKey)} description={t(m.descKey)} />
        ))}
      </div>
    </div>
  )
}
