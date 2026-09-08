import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, CriticalityBadge, StatusBadge, StageProgress, EmptyState } from '../components/ui.jsx';

export default function FichesListPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    api.get(`/fiches${qs}`).then(setFiches).finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.fiches')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('nav.fiches')}</h1>
        </div>
        {hasPermission('fiche.create') && <Link to="/fiches/new" className="btn-primary">+ {t('fiche.newFiche')}</Link>}
      </div>

      <div className="flex gap-2">
        {['', 'open', 'in_progress', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${status === s ? 'bg-orange text-white border-orange' : 'bg-white text-grey-ink border-grey-line hover:bg-grey-light'}`}
          >
            {s ? t(`fiche.status.${s}`) : t('common.all')}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full ncp-table">
            <thead>
              <tr>
                <th>{t('fiche.number')}</th>
                <th>{t('fiche.title')}</th>
                <th>{t('fiche.department')}</th>
                <th>{t('fiche.stage')}</th>
                <th>{t('fiche.criticality')}</th>
                <th>{t('fiche.priority')}</th>
                <th>{t('fiche.status')}</th>
                <th>{t('fiche.detectionDate')}</th>
              </tr>
            </thead>
            <tbody>
              {fiches.map((f) => (
                <tr key={f.id}>
                  <td><Link to={`/fiches/${f.id}`} className="text-orange-deep font-semibold">{f.fiche_number}</Link></td>
                  <td className="max-w-sm">{f.title}</td>
                  <td>{f.obs_node_id ? '—' : '—'}</td>
                  <td className="w-32"><StageProgress stage={f.current_stage} /></td>
                  <td><CriticalityBadge value={f.criticality} label={t(`fiche.criticality.${f.criticality}`)} /></td>
                  <td>P{f.priority}</td>
                  <td><StatusBadge value={f.status} label={t(`fiche.status.${f.status}`)} /></td>
                  <td>{f.detection_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && fiches.length === 0 && <EmptyState message={t('common.noResults')} />}
        </div>
      </Card>
    </div>
  );
}
