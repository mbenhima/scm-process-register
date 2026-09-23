import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, Badge } from '../components/ui.jsx';

export default function E2EDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const { data: e, error } = useFetch(`/reference/e2e/${id}`);
  const bp = useFetch('/bpmn');
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!e) return <div className="page"><Skeleton h={500} /></div>;
  const diagram = bp.data?.find((d) => d.e2e_id === e.id);
  return (
    <div className="page">
      <PageHeader eyebrow={`${e.id} · ${t(e.type)}`} title={t(e.name)} subtitle={t(e.goal)}
        actions={<>{e.exitGate !== '—' && <Badge tone="accent">{t('Exit gate')} {e.exitGate}</Badge>}{diagram && <Link to={`/bpmn/${diagram.id}`}>{t('Open BPMN diagram')}</Link>}</>} />
      <div className="grid three" style={{ marginBottom: 24 }}>
        <Card><h4>{t('Trigger')}</h4><p className="small">{t(e.trigger)}</p></Card>
        <Card><h4>{t('Terminal state')}</h4><p className="small">{t(e.terminal)}</p></Card>
        <Card><h4>{t('Chain relationship')}</h4><p className="small">{t(e.chain?.['Relationship type'])} → {e.chain?.['Related to']}</p><p className="xs muted">{t(e.chain?.Description)}</p></Card>
      </div>
      <Card style={{ marginBottom: 24 }}>
        <CardHead title={t('User-facing tasks and RACSI')} subtitle={t('R = Responsible, A = Accountable, C = Consulted, S = Supportive, I = Informed')} />
        <DataTable csvName={`${e.id}_tasks`} rows={e.tasks} filterable={false} pageSize={20} columns={[
          { key: 'id', label: t('Task ID') }, { key: 'name', label: t('Task'), render: (x) => <><div className="strong">{t(x.name)}</div><div className="xs muted">{t(x.description)}</div></> },
          { key: 'chainLink', label: t('Chain link'), render: (x) => t(x.chainLink) }, { key: 'macroProcesses', label: t('Macro processes'), render: (x) => <span className="xs">{t(x.macroProcesses)}</span> },
          { key: 'module', label: t('Module'), render: (x) => t(x.module) },
          ...['R', 'A', 'C', 'S', 'I'].map((l) => ({ key: l, label: l, render: (x) => <span className="xs">{t(x[l])}</span> })),
        ]} />
      </Card>
      {e.bpmn && (
        <Card style={{ marginBottom: 24 }}>
          <CardHead title={t('Activity-level BPMN flow (template for all E2E processes)')} />
          <DataTable filterable={false} rows={e.bpmn} columns={Object.keys(e.bpmn[0]).map((k) => ({ key: k, label: t(k), render: (r) => <span className="xs">{t(r[k])}</span> }))} />
        </Card>
      )}
      <Card>
        <CardHead title={t('User-facing steps (UFS)')} />
        <ul className="list-plain">{e.ufs.map((u) => <li key={u.id}><strong className="strong">{u.id}</strong> {t(u.name)} · <span className="muted">{t(u.macroProcesses)}</span></li>)}</ul>
      </Card>
    </div>
  );
}
