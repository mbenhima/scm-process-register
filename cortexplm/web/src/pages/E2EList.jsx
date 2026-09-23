import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, useFetch, Skeleton, ErrorNote, Badge } from '../components/ui.jsx';

export default function E2EList() {
  const { t } = useI18n();
  const { data, error } = useFetch('/reference/e2e');
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Process design reference')} title={t('End-to-end processes')} subtitle={t('9 E2E processes, 81 user-facing tasks, 8 exit gates. E2E-09 runs in parallel with all others.')} />
      <div className="chain" style={{ marginBottom: 24 }}>
        {data.map((e) => <Link key={e.id} to={`/e2e/${e.id}`} className="step"><strong>{e.id}</strong><span>{t(e.name)}</span><span className="muted">{e.exitGate !== '—' ? `${t('Exit gate')} ${e.exitGate}` : t('Continuous')}</span></Link>)}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
        {data.map((e) => (
          <Card key={e.id}>
            <div className="eyebrow">{e.id} · {t(e.type)}</div>
            <h3><Link to={`/e2e/${e.id}`}>{t(e.name)}</Link></h3>
            <p className="small" style={{ marginTop: 8 }}>{t(e.goal)}</p>
            <div className="row">
              <Badge tone="accent">{t('{n} tasks', { n: e.taskCount })}</Badge>
              <Badge>{e.exitGate !== '—' ? `${t('Gate')} ${e.exitGate}` : t('No gate')}</Badge>
              <Badge>{t('Full')}: {t(e.trackSummary['Full Track'])}</Badge><Badge>{t('Light')}: {t(e.trackSummary['Light Track'])}</Badge><Badge>{t('Fast')}: {t(e.trackSummary['Fast Track'])}</Badge>
            </div>
            <p className="xs muted" style={{ marginTop: 12, marginBottom: 0 }}>{t(e.chain?.Description)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
