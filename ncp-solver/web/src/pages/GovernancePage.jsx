import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, EmptyState } from '../components/ui.jsx';

const ALERT_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export default function GovernancePage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => { api.get('/governance').then(setSettings).catch(() => {}); }, []);
  if (!settings) return <EmptyState message={t('common.loading')} />;

  async function save() {
    const updated = await api.put('/governance', {
      rca_default_method: settings.rca_default_method,
      require_rex_before_close: settings.require_rex_before_close,
      kpi_thresholds: settings.kpi_thresholds,
      alert_config: settings.alert_config,
    });
    setSettings(updated);
  }

  const canManage = hasPermission('governance.manage');

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.governance')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('governance.title')}</h1>
      </div>

      <Card title={t('governance.rcaMethod')}>
        <select
          className="input max-w-xs"
          value={settings.rca_default_method}
          disabled={!canManage}
          onChange={(e) => setSettings((s) => ({ ...s, rca_default_method: e.target.value }))}
        >
          <option value="5_why">5-Why</option>
          <option value="ishikawa">Ishikawa</option>
        </select>
        <label className="flex items-center gap-2 text-sm mt-4">
          <input
            type="checkbox"
            disabled={!canManage}
            checked={!!settings.require_rex_before_close}
            onChange={(e) => setSettings((s) => ({ ...s, require_rex_before_close: e.target.checked }))}
          />
          {t('governance.requireRex')}
        </label>
      </Card>

      <Card title={t('governance.kpiThresholds')}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(settings.kpi_thresholds || {}).map(([key, val]) => (
            <Field key={key} label={key}>
              <input
                className="input" type="number" value={val} disabled={!canManage}
                onChange={(e) => setSettings((s) => ({ ...s, kpi_thresholds: { ...s.kpi_thresholds, [key]: Number(e.target.value) } }))}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card title={t('governance.alertConfig')}>
        <div className="grid grid-cols-5 gap-3">
          {ALERT_CODES.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox" disabled={!canManage}
                checked={!!settings.alert_config?.[code]}
                onChange={(e) => setSettings((s) => ({ ...s, alert_config: { ...s.alert_config, [code]: e.target.checked } }))}
              />
              Alert {code}
            </label>
          ))}
        </div>
      </Card>

      {canManage && <button onClick={save} className="btn-primary">{t('common.save')}</button>}
    </div>
  );
}
