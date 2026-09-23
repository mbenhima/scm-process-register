import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, Skeleton, ErrorNote, StatusBadge, Button, Select, Progress, fmtNum } from '../components/ui.jsx';

export default function Projects() {
  const { can } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const [track, setTrack] = useState('');
  const { data, error } = useFetch(`/projects?status=${status}&track=${track}`);
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Lifecycle')} title={t('Innovation projects')}
        subtitle={data ? t('{n} projects. Each moves through the E2E processes of its track, gate by gate.', { n: data.length }) : ''}
        actions={can('project.create') && <Button variant="primary" icon={Plus} onClick={() => nav('/projects/new')}>{t('New project')}</Button>} />
      {!data ? <Skeleton h={400} /> : (
        <Card>
          <DataTable csvName="projects" rows={data} onRowClick={(p) => nav(`/projects/${p.id}`)}
            toolbar={<>
              <Select aria-label={t('Status')} value={status} onChange={(e) => setStatus(e.target.value)} placeholder={t('All statuses')} options={['Active', 'On Hold', 'Launched', 'Retired', 'Killed'].map((s) => ({ value: s, label: t(s) }))} style={{ width: 'auto' }} />
              <Select aria-label={t('Track')} value={track} onChange={(e) => setTrack(e.target.value)} placeholder={t('All tracks')} options={['Full', 'Light', 'Fast'].map((s) => ({ value: s, label: t(`${s} Track`) }))} style={{ width: 'auto' }} />
            </>}
            columns={[
              { key: 'code', label: t('Code') },
              { key: 'name', label: t('Project'), render: (p) => <><div className="strong">{p.name}</div><div className="xs muted">{t(p.offer_type)} · {p.owner_name}</div></> },
              { key: 'track', label: t('Track'), render: (p) => t(`${p.track} Track`) },
              { key: 'current_e2e', label: t('Current E2E'), csv: (p) => `${p.current_e2e} ${p.e2e_name}`, render: (p) => <><div>{p.current_e2e}</div><div className="xs muted">{t(p.e2e_name)}</div></> },
              { key: 'current_gate', label: t('Last gate passed'), render: (p) => p.current_gate || '—' },
              { key: 'status', label: t('Status'), render: (p) => <StatusBadge value={p.status} /> },
              { key: 'progress', label: t('Tasks done'), sortValue: (p) => p.progress, render: (p) => <div className="row" style={{ gap: 8 }}><Progress value={p.progress} label={t('Tasks done')} /><span className="xs num">{p.progress}%</span></div> },
              { key: 'overdue', label: t('Overdue'), num: true },
              { key: 'npv', label: t('NPV (kUSD)'), num: true, render: (p) => fmtNum(p.npv) },
            ]} />
        </Card>
      )}
    </div>
  );
}
