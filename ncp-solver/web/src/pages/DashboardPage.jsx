import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, StatTile, CriticalityBadge, StatusBadge, StageProgress, EmptyState } from '../components/ui.jsx';

export default function DashboardPage() {
  const { t } = useI18n();
  const { user, hasPermission } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(setData).catch(() => {});
  }, []);

  if (!data) return <EmptyState message={t('common.loading')} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.dashboard')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('dashboard.welcome')}, {user?.firstName}</h1>
        </div>
        {hasPermission('fiche.create') && (
          <Link to="/fiches/new" className="btn-primary">+ {t('dashboard.newFiche')}</Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile label={t('dashboard.openFiches')} value={data.ficheCounts.open} accent="orange" />
        <StatTile label={t('dashboard.inProgressFiches')} value={data.ficheCounts.in_progress} accent="grey" />
        <StatTile label={t('dashboard.closedFiches')} value={data.ficheCounts.closed} accent="green" />
        <StatTile label={t('dashboard.myOpenActions')} value={data.myOpenActions} accent="grey" />
        <StatTile label={t('dashboard.overdueActions')} value={data.overdueActions} accent="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={t('dashboard.recentFiches')} className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full ncp-table">
              <thead>
                <tr>
                  <th>{t('fiche.number')}</th>
                  <th>{t('fiche.title')}</th>
                  <th>{t('fiche.stage')}</th>
                  <th>{t('fiche.criticality')}</th>
                  <th>{t('fiche.status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentFiches.map((f) => (
                  <tr key={f.id} className="hover:bg-orange-tint/40 cursor-pointer">
                    <td><Link to={`/fiches/${f.id}`} className="text-orange-deep font-semibold">{f.fiche_number}</Link></td>
                    <td className="max-w-xs truncate">{f.title}</td>
                    <td className="w-32"><StageProgress stage={f.current_stage} /></td>
                    <td><CriticalityBadge value={f.criticality} label={t(`fiche.criticality.${f.criticality}`)} /></td>
                    <td><StatusBadge value={f.status} label={t(`fiche.status.${f.status}`)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.recentFiches.length === 0 && <EmptyState message={t('common.noResults')} />}
          </div>
        </Card>

        <Card title={t('dashboard.unreadAlerts')}>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.unreadAlerts.map((a) => (
              <div key={a.id} className="text-sm border-s-2 border-orange ps-3 py-1">
                <div className="font-semibold text-grey-dark">{a.alert_type} — {a.message}</div>
                <div className="text-[11px] text-grey-medium">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
            {data.unreadAlerts.length === 0 && <EmptyState message={t('alerts.empty')} />}
          </div>
        </Card>
      </div>

      <Card title={t('dashboard.byDepartment')} subtitle="">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.byDepartment} margin={{ left: 0, right: 20 }}>
            <CartesianGrid stroke="#E3E3E4" vertical={false} />
            <XAxis dataKey="department" tick={{ fill: '#808184', fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: '#808184', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderColor: '#E3E3E4', fontSize: 12 }} />
            <Bar dataKey="c" fill="#F8931D" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
