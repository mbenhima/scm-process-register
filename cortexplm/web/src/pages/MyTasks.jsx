import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, Skeleton, ErrorNote, StatusBadge, Segmented, fmtDate } from '../components/ui.jsx';

export default function MyTasks() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { data, error } = useFetch('/tasks/mine');
  const [who, setWho] = useState('all');
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  const today = new Date().toISOString().slice(0, 10);
  const rows = (data || []).filter((r) => who === 'all' || r.my_role === who);
  return (
    <div className="page">
      <PageHeader eyebrow={t('Home')} title={t('My tasks')} subtitle={data ? t('{n} tasks need your action: {o} as owner and {e} as evaluator.', { n: data.length, o: data.filter((x) => x.my_role === 'Owner').length, e: data.filter((x) => x.my_role === 'Evaluator').length }) : ''} />
      {!data ? <Skeleton h={320} /> : (
        <Card>
          <DataTable csvName="my_tasks" rows={rows} onRowClick={(r) => nav(`/tasks/${r.id}`)}
            toolbar={<Segmented label={t('Show')} value={who} onChange={setWho} options={[{ value: 'all', label: t('All') }, { value: 'Owner', label: t('As owner') }, { value: 'Evaluator', label: t('To evaluate') }]} />}
            columns={[
              { key: 'due_date', label: t('Due'), render: (r) => <span className={r.due_date < today ? 'strong' : ''}>{fmtDate(r.due_date)}{r.due_date < today ? ` · ${t('Overdue')}` : ''}</span> },
              { key: 'name', label: t('Task'), render: (r) => <><div className="strong">{t(r.name)}</div><div className="xs muted">{r.uft_id}</div></> },
              { key: 'code', label: t('Project'), csv: (r) => `${r.code} ${r.project_name}`, render: (r) => `${r.code} · ${r.project_name}` },
              { key: 'e2e_id', label: t('E2E') },
              { key: 'my_role', label: t('My role'), render: (r) => t(r.my_role) },
              { key: 'status', label: t('Status'), render: (r) => <StatusBadge value={r.my_role === 'Evaluator' ? 'Pending Approval' : r.status}>{r.my_role === 'Evaluator' ? t('Evaluation pending') : undefined}</StatusBadge> },
            ]} empty={t('Nothing to do right now.')} />
        </Card>
      )}
    </div>
  );
}
