import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, Skeleton, ErrorNote, StatusBadge, Tabs, Progress, fmtDate, Badge } from '../components/ui.jsx';

const workingDays = (from) => { let n = 0; const d = new Date(from); const now = new Date(); while (d < now) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n += 1; } return n; };

export default function GateBoard() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [status, setStatus] = useState('Submitted');
  const { data, error } = useFetch(`/gates?status=${status}`);
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  return (
    <div className="page">
      <PageHeader eyebrow={t('MP-121 Innovation phase-gate management')} title={t('Gate board')}
        subtitle={status === 'Submitted' && data ? t('{n} gate packs wait for a Go, Kill, Hold or Recycle decision. Decisions pending more than 10 working days are escalated (BR-008).', { n: data.length }) : t('All gate reviews by status.')} />
      <Tabs value={status} onChange={setStatus} tabs={['Submitted', 'Open', 'On hold', 'Decided'].map((s) => ({ value: s, label: t(s === 'Submitted' ? 'Awaiting decision' : s) }))} />
      {!data ? <Skeleton /> : (
        <Card>
          <DataTable csvName={`gates_${status}`} rows={data} onRowClick={(g) => nav(`/gates/${g.id}`)} columns={[
            { key: 'gate', label: t('Gate'), render: (g) => <strong className="strong">{g.gate}</strong> },
            { key: 'code', label: t('Project'), csv: (g) => `${g.code} ${g.project_name}`, render: (g) => <><div className="strong">{g.code} · {g.project_name}</div><div className="xs muted">{t(`${g.track} Track`)}</div></> },
            { key: 'question', label: t('Decision question'), render: (g) => <span className="small">{t(g.question)}</span> },
            { key: 'checklist', label: t('Checklist'), sortValue: (g) => g.checklist_done / (g.checklist_total || 1), csv: (g) => `${g.checklist_done}/${g.checklist_total}`, render: (g) => <div className="row" style={{ gap: 8 }}><Progress value={(g.checklist_done / (g.checklist_total || 1)) * 100} label={t('Checklist')} /><span className="xs num">{g.checklist_done}/{g.checklist_total}</span></div> },
            { key: 'submitted_at', label: t('Submitted'), render: (g) => (g.submitted_at ? <>{fmtDate(g.submitted_at)}{status === 'Submitted' && <div>{workingDays(g.submitted_at) > 10 ? <Badge tone="s1">{t('{n} working days', { n: workingDays(g.submitted_at) })}</Badge> : <span className="xs muted">{t('{n} working days', { n: workingDays(g.submitted_at) })}</span>}</div>}</> : '—') },
            { key: 'decision', label: t('Decision'), render: (g) => <><StatusBadge value={g.decision} />{g.decided_by_name && <div className="xs muted">{g.decided_by_name} · {fmtDate(g.decided_at)}</div>}</> },
            { key: 'status', label: t('Status'), render: (g) => <StatusBadge value={g.status} /> },
          ]} empty={t('No gate review in this state.')} />
        </Card>
      )}
    </div>
  );
}
