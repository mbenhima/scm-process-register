import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Table, Loading, ErrorBox, Status, Tabs, tx } from '../components/ui.jsx';
import { NoProject } from './Home.jsx';

export default function Tasks() {
  const { t, lang, projectId, fmtDate } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('mine');
  const [page, setPage] = useState(0);
  const q = filter === 'mine' ? 'mine=1&open=1' : filter === 'overdue' ? 'overdue=1' : filter === 'open' ? 'open=1' : 'status=Done';
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/steps?${q}&limit=50&offset=${page * 50}` : null, [filter, page]);
  if (!projectId) return <NoProject />;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageHead eyebrow={t('Work')} title={t('My tasks')} subtitle={t('Workflow steps assigned to your roles, sorted by due date.')} />
      <Tabs label={t('Filter')} value={filter} onChange={(v) => { setFilter(v); setPage(0); }} tabs={[{ id: 'mine', label: t('Assigned to me') }, { id: 'overdue', label: t('Overdue') }, { id: 'open', label: t('All open') }, { id: 'done', label: t('Completed') }]} />
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : data && (
        <>
          <p className="small muted">{t('{n} steps', { n: data.total })}</p>
          <Table rows={data.items} onRowClick={(r) => navigate(`/steps/${r.id}`)} columns={[
            { key: 'step_id', label: t('Step'), width: 110 },
            { key: 'name', label: t('Name'), render: r => <span className="strong">{tx(r.name, lang)}</span>, sortValue: r => tx(r.name, lang) },
            { key: 'mpCode', label: t('Macro process'), render: r => <span title={tx(r.mpName, lang)}>{r.mpCode}</span> },
            { key: 'roleName', label: t('Role'), render: r => tx(r.roleName, lang) },
            { key: 'due_date', label: t('Due'), render: r => fmtDate(r.due_date) },
            { key: 'status', label: t('Status'), render: r => <Status value={r.status !== 'Done' && r.due_date < today ? 'Overdue' : r.status} /> },
          ]} />
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t('Previous')}</button>
            <span className="small muted">{t('Page {p}', { p: page + 1 })}</span>
            <button className="btn btn-sm" disabled={(page + 1) * 50 >= data.total} onClick={() => setPage(p => p + 1)}>{t('Next')}</button>
          </div>
        </>
      )}
    </>
  );
}
