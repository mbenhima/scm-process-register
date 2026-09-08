import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, EmptyState, StatTile } from '../components/ui.jsx';

export default function LicensePage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [license, setLicense] = useState(null);

  useEffect(() => { api.get('/license').then(setLicense).catch(() => {}); }, []);
  if (!license) return <EmptyState message={t('common.loading')} />;

  const canManage = hasPermission('license.manage');

  async function save() {
    const updated = await api.put('/license', {
      plan_tier: license.plan_tier, deployment_model: license.deployment_model,
      seats_total: Number(license.seats_total), billing_cycle: license.billing_cycle, status: license.status,
    });
    setLicense(updated);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.license')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('license.title')}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label={t('license.planTier')} value={t(`license.plan.${license.plan_tier}`)} />
        <StatTile label={t('license.deploymentModel')} value={t(`license.deployment.${license.deployment_model}`)} />
        <StatTile label={t('license.seats')} value={`${license.seats_used}/${license.seats_total}`} accent={license.seats_used >= license.seats_total ? 'red' : 'orange'} />
        <StatTile label={t('license.status')} value={license.status} accent="green" />
      </div>

      <Card title={t('common.edit')}>
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <Field label={t('license.planTier')}>
            <select className="input" disabled={!canManage} value={license.plan_tier} onChange={(e) => setLicense((l) => ({ ...l, plan_tier: e.target.value }))}>
              <option value="starter">{t('license.plan.starter')}</option>
              <option value="professional">{t('license.plan.professional')}</option>
              <option value="enterprise">{t('license.plan.enterprise')}</option>
            </select>
          </Field>
          <Field label={t('license.deploymentModel')}>
            <select className="input" disabled={!canManage} value={license.deployment_model} onChange={(e) => setLicense((l) => ({ ...l, deployment_model: e.target.value }))}>
              <option value="saas">{t('license.deployment.saas')}</option>
              <option value="onprem">{t('license.deployment.onprem')}</option>
            </select>
          </Field>
          <Field label={t('license.seats')}>
            <input className="input" type="number" disabled={!canManage} value={license.seats_total} onChange={(e) => setLicense((l) => ({ ...l, seats_total: e.target.value }))} />
          </Field>
          <Field label={t('license.billingCycle')}>
            <select className="input" disabled={!canManage} value={license.billing_cycle} onChange={(e) => setLicense((l) => ({ ...l, billing_cycle: e.target.value }))}>
              <option value="monthly">monthly</option>
              <option value="annual">annual</option>
            </select>
          </Field>
        </div>
        {canManage && <button onClick={save} className="btn-primary mt-4">{t('common.save')}</button>}
      </Card>
    </div>
  );
}
