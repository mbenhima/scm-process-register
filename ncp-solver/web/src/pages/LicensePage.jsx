import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, EmptyState, StatTile } from '../components/ui.jsx';

const PACK_ORDER = ['resolve', 'govern', 'assure'];
const ADDONS = [
  { key: 'addon_capitalization', feature: 'capitalization', label: 'license.addon.capitalization' },
  { key: 'addon_ai_assistant', feature: 'aiAssistant', label: 'license.addon.aiAssistant' },
  { key: 'addon_bpmn_editing', feature: null, label: 'license.addon.bpmnEditing' },
  { key: 'addon_custom_roles', feature: 'customRoles', label: 'license.addon.customRoles' },
  { key: 'addon_sovereign_deployment', feature: null, label: 'license.addon.sovereignDeployment' },
];
const COMPLIANCE = [
  { key: 'compliance_gdpr', label: 'GDPR', fee: '€8,000 one-time · €2,500/yr' },
  { key: 'compliance_iso27001', label: 'ISO/IEC 27001', fee: '€12,000 one-time · €4,000/yr' },
  { key: 'compliance_soc2', label: 'SOC 2 Type II', fee: '€15,000 one-time · €5,000/yr' },
];

function Toggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-orange' : 'bg-grey-line'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

function QuotaBar({ label, used, max }) {
  const unlimited = !isFinite(max);
  const pct = unlimited ? 0 : Math.min(100, max > 0 ? (used / max) * 100 : 0);
  const over = !unlimited && used >= max;
  return (
    <div>
      <div className="flex justify-between text-xs text-grey-ink mb-1">
        <span>{label}</span>
        <span className={over ? 'text-status-red font-semibold' : ''}>{used} / {unlimited ? '∞' : max}</span>
      </div>
      <div className="h-2 rounded-full bg-grey-light overflow-hidden">
        {!unlimited && <div className={`h-full ${over ? 'bg-status-red' : 'bg-orange'}`} style={{ width: `${pct}%` }} />}
        {unlimited && <div className="h-full bg-status-green" style={{ width: '8%' }} />}
      </div>
    </div>
  );
}

export default function LicensePage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [license, setLicense] = useState(null);
  const [packs, setPacks] = useState(null);
  const [config, setConfig] = useState(null);
  const [usage, setUsage] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([
      api.get('/license'), api.get('/license/packs'), api.get('/license/config'), api.get('/license/usage'),
    ]).then(([l, p, c, u]) => { setLicense(l); setPacks(p); setConfig(c); setUsage(u); }).catch(() => {});
  }
  useEffect(load, []);

  if (!license || !packs || !config || !usage) return <EmptyState message={t('common.loading')} />;

  const canManage = hasPermission('license.manage');

  async function patch(fields) {
    setSaving(true);
    try {
      const updated = await api.put('/license', fields);
      setLicense(updated);
      const [c, u] = await Promise.all([api.get('/license/config'), api.get('/license/usage')]);
      setConfig(c); setUsage(u);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.license')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('license.title')}</h1>
        <p className="text-sm text-grey-ink mt-1 max-w-2xl">{t('license.intro')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label={t('license.planTier')} value={packs[license.plan_tier]?.label || license.plan_tier} />
        <StatTile label={t('license.seats')} value={`${license.seats_used}/${license.seats_total}`} accent={license.seats_used >= license.seats_total ? 'red' : 'orange'} />
        <StatTile label={t('license.supportTier')} value={t(`license.support.${license.support_tier}`)} />
        <StatTile label={t('license.status')} value={license.status} accent="green" />
      </div>

      <Card title={t('license.packSelector')} subtitle={t('license.packSelectorSubtitle')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACK_ORDER.map((key) => {
            const p = packs[key];
            const active = license.plan_tier === key;
            return (
              <button
                key={key}
                disabled={!canManage || saving}
                onClick={() => patch({ plan_tier: key })}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${active ? 'border-orange bg-orange-tint' : 'border-grey-line bg-white hover:border-grey-medium'} ${!canManage ? 'cursor-default' : ''}`}
              >
                <div className={`font-title font-bold ${active ? 'text-orange-deep' : 'text-grey-dark'}`}>{p.label}</div>
                <ul className="mt-2 text-xs text-grey-ink space-y-1">
                  <li>{p.aiUseCasesIncluded} {t('license.metric.aiUseCases')}</li>
                  <li>{p.grcModules ? t('common.yes') : t('common.no')} — {t('license.metric.grc')}</li>
                  <li>{t(`license.metric.bpmn.${p.bpmnMode}`)}</li>
                  <li>{p.standardsIncluded} {t('license.metric.standards')}</li>
                  <li>{p.integrationsIncluded} {t('license.metric.integrations')}</li>
                </ul>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t('license.addOns')} subtitle={t('license.addOnsSubtitle')}>
          <div className="space-y-3">
            {ADDONS.map((a) => {
              const standard = a.feature ? config[a.feature] && !license[a.key] : false;
              return (
                <div key={a.key} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-grey-dark">{t(a.label)}</div>
                    {standard && <div className="text-xs text-status-darkgreen">{t('license.standardInPack')}</div>}
                  </div>
                  <Toggle
                    checked={!!license[a.key] || standard}
                    disabled={!canManage || saving || standard}
                    onChange={(v) => patch({ [a.key]: v })}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card title={t('license.complianceModules')} subtitle={t('license.complianceModulesSubtitle')}>
          <div className="space-y-3">
            {COMPLIANCE.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-grey-dark">{c.label}</div>
                  <div className="text-xs text-grey-medium">{c.fee}</div>
                </div>
                <Toggle checked={!!license[c.key]} disabled={!canManage || saving} onChange={(v) => patch({ [c.key]: v })} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={t('license.usage')} subtitle={t('license.usageSubtitle')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-3xl">
          <QuotaBar label={t('license.metric.aiUseCasesActive')} used={usage.aiUseCasesActive} max={config.maxAiUseCasesCombined} />
          <QuotaBar label={t('license.metric.aiUseCasesCustom')} used={usage.aiUseCasesCustom} max={config.customAiUseCasesAllowed} />
          <QuotaBar label={t('license.metric.projects')} used={usage.projects} max={config.maxProjects} />
          <QuotaBar label={t('license.metric.obsNodes')} used={usage.obsNodes} max={config.maxObsNodes} />
          <QuotaBar label={t('license.metric.standardsActive')} used={usage.standardsActive} max={config.standardsIncluded} />
        </div>
      </Card>

      <Card title={t('license.deploymentSupport')}>
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <Field label={t('license.deploymentOption')}>
            <select className="input" disabled={!canManage} value={license.deployment_option} onChange={(e) => patch({ deployment_option: e.target.value })}>
              {['dedicated_cloud', 'group_cloud', 'hybrid_shield', 'sovereign_core', 'sovereign_vault'].map((v) => (
                <option key={v} value={v} disabled={(v === 'hybrid_shield' || v === 'sovereign_core' || v === 'sovereign_vault') && !config.sovereignDeployment}>
                  {t(`license.deploymentOption.${v}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('license.supportTier')}>
            <select className="input" disabled={!canManage} value={license.support_tier} onChange={(e) => patch({ support_tier: e.target.value })}>
              <option value="standard">{t('license.support.standard')}</option>
              <option value="priority">{t('license.support.priority')}</option>
              <option value="premium">{t('license.support.premium')}</option>
            </select>
          </Field>
          <Field label={t('license.seats')}>
            <input className="input" type="number" disabled={!canManage} value={license.seats_total}
              onChange={(e) => setLicense((l) => ({ ...l, seats_total: e.target.value }))}
              onBlur={(e) => patch({ seats_total: Number(e.target.value) })} />
          </Field>
          <Field label={t('license.billingCycle')}>
            <select className="input" disabled={!canManage} value={license.billing_cycle} onChange={(e) => patch({ billing_cycle: e.target.value })}>
              <option value="monthly">{t('license.billing.monthly')}</option>
              <option value="annual">{t('license.billing.annual')}</option>
            </select>
          </Field>
        </div>
      </Card>
    </div>
  );
}
