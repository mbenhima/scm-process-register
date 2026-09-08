import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, EmptyState } from '../components/ui.jsx';

export default function AlertsPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [running, setRunning] = useState(false);

  function load() { api.get('/alerts').then(setAlerts).catch(() => {}); }
  useEffect(load, []);

  async function run() {
    setRunning(true);
    try { await api.post('/alerts/run', {}); load(); } finally { setRunning(false); }
  }
  async function markRead(id) {
    await api.put(`/alerts/${id}/read`, {});
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.alerts')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('alerts.title')}</h1>
        </div>
        {hasPermission('alert.manage') && <button onClick={run} disabled={running} className="btn-primary">{t('alerts.runNow')}</button>}
      </div>
      <Card>
        <div className="divide-y divide-grey-line">
          {alerts.map((a) => (
            <div key={a.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <span className="badge bg-orange-tint text-orange-deep me-2">{a.alert_type}</span>
                <span className="text-sm text-grey-dark">{a.message}</span>
                <div className="text-[11px] text-grey-medium">{new Date(a.created_at).toLocaleString()}</div>
              </div>
              {!a.read_at && <button onClick={() => markRead(a.id)} className="btn-secondary !py-1 !px-2 text-xs whitespace-nowrap">{t('alerts.markRead')}</button>}
            </div>
          ))}
        </div>
        {alerts.length === 0 && <EmptyState message={t('alerts.empty')} />}
      </Card>
    </div>
  );
}
