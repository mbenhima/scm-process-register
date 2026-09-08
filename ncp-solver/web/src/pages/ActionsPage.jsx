import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, StatusBadge, EmptyState } from '../components/ui.jsx';

function ActionRow({ a, t, onDone, canUpdate }) {
  return (
    <tr>
      <td><Link to={`/fiches/${a.fiche_id}`} className="text-orange-deep font-semibold">{a.fiche_number}</Link></td>
      <td className="max-w-sm">{a.description}</td>
      <td>{t(`action.type.${a.action_type}`)}</td>
      <td>{a.planned_completion_date || '—'}</td>
      <td><StatusBadge value={a.status} label={t(`action.status.${a.status}`)} /></td>
      <td>
        {canUpdate && a.status !== 'done' && (
          <button onClick={() => onDone(a.id)} className="btn-secondary !py-1 !px-2 text-xs">{t('action.status.done')}</button>
        )}
      </td>
    </tr>
  );
}

export default function ActionsPage() {
  const { t } = useI18n();
  const { user, hasPermission } = useAuth();
  const [actions, setActions] = useState([]);

  function load() {
    api.get('/actions').then(setActions).catch(() => {});
  }
  useEffect(load, []);

  async function markDone(id) {
    await api.put(`/actions/${id}/progress`, { status: 'done', actual_completion_date: new Date().toISOString().slice(0, 10) });
    load();
  }

  const mine = actions.filter((a) => a.responsible_owner_id === user.id);
  const toEvaluate = actions.filter((a) => a.evaluation?.evaluator_owner_id === user.id && a.evaluation?.review_result === 'pending');
  const others = actions.filter((a) => a.responsible_owner_id !== user.id && a.evaluation?.evaluator_owner_id !== user.id);

  const Table = ({ rows, canUpdate }) => (
    <div className="overflow-x-auto">
      <table className="w-full ncp-table">
        <thead><tr><th>{t('fiche.number')}</th><th>{t('common.description')}</th><th>{t('common.status')}</th><th>{t('action.plannedDate')}</th><th>{t('common.status')}</th><th></th></tr></thead>
        <tbody>{rows.map((a) => <ActionRow key={a.id} a={a} t={t} onDone={markDone} canUpdate={canUpdate} />)}</tbody>
      </table>
      {rows.length === 0 && <EmptyState message={t('common.noResults')} />}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow">{t('nav.actions')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('nav.actions')}</h1>
      </div>

      <Card title={t('action.responsible')}>
        <Table rows={mine} canUpdate={hasPermission('action.updateOwn')} />
      </Card>

      {hasPermission('action.evaluate') && (
        <Card title={t('action.evaluator')}>
          <Table rows={toEvaluate} canUpdate={false} />
        </Card>
      )}

      {hasPermission('action.edit') && (
        <Card title={t('common.all')}>
          <Table rows={others} canUpdate={false} />
        </Card>
      )}
    </div>
  );
}
