import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { canManageConfiguration } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import { PACKS, PACK_DEFINITIONS, DEPLOYMENT_OPTIONS } from '../data/packDefinitions.js'
import { COMPLIANCE_STANDARDS } from '../data/complianceStandards.js'

// M<n> display number -> internal /app/<routeId> path segment, per the split
// documented in Sidebar.jsx (display order M1-M22 follows the Technical
// Offer; routing kept its original, unrelated numbering to avoid churn).
const MODULE_ROWS = [
  { m: 1, routeId: 'm1', key: 'navM1' },
  { m: 2, routeId: 'm2', key: 'navM2' },
  { m: 3, routeId: 'm22', key: 'navM22' },
  { m: 4, routeId: 'm18', key: 'navM18' },
  { m: 5, routeId: 'm19', key: 'navM19' },
  { m: 6, routeId: 'm16', key: 'navM16' },
  { m: 7, routeId: 'm3', key: 'navM3' },
  { m: 8, routeId: 'm17', key: 'navM17' },
  { m: 9, routeId: 'm4', key: 'navM4' },
  { m: 10, routeId: 'm5', key: 'navM5' },
  { m: 11, routeId: 'm6', key: 'navM6' },
  { m: 12, routeId: 'm13', key: 'navM13' },
  { m: 13, routeId: 'm7', key: 'navM7' },
  { m: 14, routeId: 'm8', key: 'navM8' },
  { m: 15, routeId: 'm9', key: 'navM9' },
  { m: 16, routeId: 'm10', key: 'navM10' },
  { m: 17, routeId: 'm11', key: 'navM11' },
  { m: 18, routeId: 'm15', key: 'navM15' },
  { m: 19, routeId: 'm20', key: 'navM20' },
  { m: 20, routeId: 'm14', key: 'navM14' },
  { m: 21, routeId: 'm12', key: 'navM12' },
  { m: 22, routeId: 'm21', key: 'navM21' },
]

function PackCard({ packKey, active, onSelect, canEdit }) {
  const { t } = useI18n()
  const def = PACK_DEFINITIONS[packKey]
  return (
    <button
      type="button"
      disabled={!canEdit}
      onClick={() => onSelect(packKey)}
      className={`card p-4 text-start w-full transition-colors ${active ? 'ring-2 ring-brand-600 bg-brand-50/50' : 'hover:bg-brand-50/30'} ${!canEdit ? 'cursor-default' : ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-950">{t(`config_pack_${packKey}_name`)}</h3>
        {active && <Badge tone="brand">{t('config_active')}</Badge>}
      </div>
      <p className="text-xs text-ink/60 mt-1">{t(`config_pack_${packKey}_desc`)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-ink/60">
        <dt>{t('config_modules_heading')}</dt>
        <dd className="text-end font-medium text-brand-900">{def.modules.length} / 22</dd>
        <dt>{t('config_ai_heading')}</dt>
        <dd className="text-end font-medium text-brand-900">{def.aiUseCaseCount}</dd>
        <dt>{t('config_max_orgs')}</dt>
        <dd className="text-end font-medium text-brand-900">{def.maxOrganizations ?? t('config_unlimited')}</dd>
      </dl>
    </button>
  )
}

function ModuleTogglePanel({ data, canEdit }) {
  const { t } = useI18n()
  const { toggleConfigModule } = useAppState()
  const enabled = new Set(data.packConfig.enabledModules)
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-brand-950">{t('config_modules_heading')}</h3>
        {data.packConfig.customOverride && <Badge tone="amber">{t('config_customized')}</Badge>}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {MODULE_ROWS.map((row) => (
          <label key={row.routeId} className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg ${enabled.has(row.routeId) ? 'bg-brand-50/60' : ''}`}>
            <input
              type="checkbox"
              checked={enabled.has(row.routeId)}
              disabled={!canEdit}
              onChange={() => toggleConfigModule(row.routeId)}
              className="accent-brand-600"
            />
            <span className="font-mono text-xs text-ink/40 w-8 shrink-0">M{row.m}</span>
            <span className="text-ink/80">{t(row.key)}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function AiTierPanel({ data, canEdit }) {
  const { t } = useI18n()
  const { setConfigAiTier } = useAppState()
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-brand-950 mb-3">{t('config_ai_tier_heading')}</h3>
      <div className="space-y-2">
        {['assistive', 'augmented'].map((tier) => (
          <label key={tier} className="flex items-start gap-2 text-sm">
            <input type="radio" className="accent-brand-600 mt-0.5" checked={data.packConfig.aiTier === tier} disabled={!canEdit} onChange={() => setConfigAiTier(tier)} />
            <span>
              <span className="font-medium text-brand-900">{t(`config_ai_tier_${tier}`)}</span>
              <span className="block text-xs text-ink/60">{t(`config_ai_tier_${tier}_desc`)}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

function CompliancePanel({ data, canEdit }) {
  const { t } = useI18n()
  const { toggleComplianceStandard } = useAppState()
  const active = data.packConfig.complianceStandards || {}
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-brand-950 mb-1">{t('config_compliance_heading')}</h3>
      <p className="text-xs text-ink/60 mb-3">{t('config_compliance_hint')}</p>
      <div className="space-y-2">
        {COMPLIANCE_STANDARDS.map((std) => (
          <label key={std.key} className="flex items-start gap-2 text-sm border-t border-brand-50 pt-2 first:border-t-0 first:pt-0">
            <input type="checkbox" className="accent-brand-600 mt-0.5" checked={!!active[std.key]} disabled={!canEdit} onChange={() => toggleComplianceStandard(std.key)} />
            <span className="flex-1">
              <span className="font-medium text-brand-900">{std.name}</span>
              <span className="text-ink/40 text-xs"> — {std.fullName}</span>
              <span className="block text-xs text-ink/60">{t(`compliance_${std.key}_focus`)}</span>
            </span>
            {std.priced && <Badge tone="gray">{t('config_compliance_priced')}</Badge>}
          </label>
        ))}
      </div>
    </div>
  )
}

function DeploymentPanel({ data }) {
  const { t } = useI18n()
  const def = PACK_DEFINITIONS[data.packConfig.activePack]
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-brand-950 mb-1">{t('config_deployment_heading')}</h3>
      <p className="text-xs text-ink/60 mb-3">{t('config_deployment_hint')}</p>
      <div className="space-y-1.5 text-sm">
        {DEPLOYMENT_OPTIONS.map((opt) => {
          const on = def.deploymentOptions.includes(opt.key)
          return (
            <div key={opt.key} className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${on ? 'bg-brand-50/60' : 'opacity-40'}`}>
              <span>{t(`deployment_${opt.key}`)}</span>
              <Badge tone={on ? 'green' : 'gray'}>{on ? t('config_available') : t('config_via_addon')}</Badge>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-ink/50 mt-3">
        {t('config_current_license_mode')}: <span className="font-medium text-brand-900">{data.license?.mode?.toUpperCase()}</span>
      </p>
    </div>
  )
}

function Content() {
  const { t } = useI18n()
  const { data, currentUser, setActivePack } = useAppState()
  const canEdit = canManageConfiguration(currentUser?.role, data.rolePermissions)
  const [pendingPack, setPendingPack] = useState(null)

  const handleSelectPack = (packKey) => {
    if (packKey === data.packConfig.activePack) return
    setPendingPack(packKey)
  }
  const confirmSwitch = () => {
    setActivePack(pendingPack)
    setPendingPack(null)
  }

  return (
    <div>
      <PageHeader title={t('config_title')} description={t('config_desc')} />
      {!canEdit && <p className="text-xs text-ink/40 italic mb-4">{t('config_readonly_notice')}</p>}

      <h2 className="text-sm font-semibold text-brand-950 mb-2">{t('config_pack_heading')}</h2>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {PACKS.map((packKey) => (
          <PackCard key={packKey} packKey={packKey} active={data.packConfig.activePack === packKey} onSelect={handleSelectPack} canEdit={canEdit} />
        ))}
      </div>

      {pendingPack && (
        <div className="card p-4 mb-6 border-2 border-amber-300 bg-amber-50/40">
          <p className="text-sm text-ink/80">{t('config_confirm_switch').replace('{pack}', t(`config_pack_${pendingPack}_name`))}</p>
          <div className="flex gap-2 mt-3">
            <button className="btn-primary" onClick={confirmSwitch}>
              {t('confirm')}
            </button>
            <button className="btn-secondary" onClick={() => setPendingPack(null)}>
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <ModuleTogglePanel data={data} canEdit={canEdit} />
        <div className="space-y-4">
          <AiTierPanel data={data} canEdit={canEdit} />
          <DeploymentPanel data={data} />
        </div>
        <div className="lg:col-span-2">
          <CompliancePanel data={data} canEdit={canEdit} />
        </div>
      </div>
    </div>
  )
}

export default function ConfigurationPage() {
  return <Content />
}
