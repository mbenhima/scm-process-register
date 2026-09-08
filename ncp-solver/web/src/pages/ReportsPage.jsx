import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { Card, StatTile, StageProgress, StatusBadge, EmptyState } from '../components/ui.jsx';

const PIE_COLORS = ['#F8931D', '#3A6EA5', '#5AA469', '#808184'];

export default function ReportsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState('operational');
  const [operational, setOperational] = useState([]);
  const [actionPlan, setActionPlan] = useState([]);
  const [scorecard, setScorecard] = useState(null);
  const [capLog, setCapLog] = useState([]);

  useEffect(() => {
    api.get('/reports/operational').then(setOperational).catch(() => {});
    api.get('/reports/action-plan').then(setActionPlan).catch(() => {});
    api.get('/reports/scorecard').then(setScorecard).catch(() => {});
    api.get('/reports/capitalization').then(setCapLog).catch(() => {});
  }, []);

  const TABS = ['operational', 'actionPlan', 'scorecard', 'capitalizationLog'];

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.reports')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('reports.title')}</h1>
      </div>

      <div className="flex gap-1 border-b border-grey-line overflow-x-auto">
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 ${tab === tb ? 'border-orange text-orange-deep' : 'border-transparent text-grey-ink'}`}>
            {t(`reports.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'operational' && (
        <Card title={t('reports.operational')}>
          <table className="w-full ncp-table">
            <thead><tr><th>{t('fiche.number')}</th><th>{t('fiche.title')}</th><th>{t('fiche.stage')}</th><th>Ageing</th><th>AI %</th><th>AC %</th></tr></thead>
            <tbody>
              {operational.map((f) => (
                <tr key={f.id}>
                  <td>{f.fiche_number}</td><td className="max-w-xs truncate">{f.title}</td>
                  <td className="w-32"><StageProgress stage={f.current_stage} /></td>
                  <td>{f.ageingDays}d</td><td>{f.immediateProgress}%</td><td>{f.correctiveProgress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {operational.length === 0 && <EmptyState message={t('common.noResults')} />}
        </Card>
      )}

      {tab === 'actionPlan' && (
        <Card title={t('reports.actionPlan')}>
          <table className="w-full ncp-table">
            <thead><tr><th>{t('fiche.number')}</th><th>{t('common.description')}</th><th>{t('common.owner')}</th><th>{t('action.plannedDate')}</th><th>{t('common.status')}</th></tr></thead>
            <tbody>
              {actionPlan.map((a) => (
                <tr key={a.id} className={a.overdue ? 'bg-status-red/20' : ''}>
                  <td>{a.fiche_number}</td><td className="max-w-sm truncate">{a.description}</td>
                  <td>{a.ownerName || '—'}</td><td>{a.planned_completion_date || '—'}</td>
                  <td><StatusBadge value={a.status} label={t(`action.status.${a.status}`)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {actionPlan.length === 0 && <EmptyState message={t('common.noResults')} />}
        </Card>
      )}

      {tab === 'scorecard' && scorecard && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatTile label="KPI2 Eff. Immediate" value={`${scorecard.kpis.kpi2_effectiveness_immediate}%`} />
            <StatTile label="KPI5 Eff. Corrective" value={`${scorecard.kpis.kpi5_effectiveness_corrective}%`} />
            <StatTile label="KPI7 Standardization" value={`${scorecard.kpis.kpi7_standardization_rate}%`} />
            <StatTile label="KPI8 Generalization" value={`${scorecard.kpis.kpi8_generalization_rate}%`} />
            <StatTile label="KPI10 Closure Rate" value={`${scorecard.kpis.kpi10_closure_rate}%`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Priority distribution">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={scorecard.priorityDist} dataKey="c" nameKey="priority" outerRadius={80} label>
                    {scorecard.priorityDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Non-conformities by department">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scorecard.byDepartment}>
                  <CartesianGrid stroke="#E3E3E4" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="c" fill="#3A6EA5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {tab === 'capitalizationLog' && (
        <Card title={t('reports.capitalizationLog')}>
          <div className="grid gap-3">
            {capLog.map((r, i) => (
              <div key={i} className="border-b border-grey-line pb-3 last:border-0">
                <div className="font-semibold text-grey-dark">{r.fiche_number} — {r.title}</div>
                <p className="text-sm text-grey-ink mt-1 italic">{r.lessons_learned}</p>
              </div>
            ))}
            {capLog.length === 0 && <EmptyState message={t('common.noResults')} />}
          </div>
        </Card>
      )}
    </div>
  );
}
