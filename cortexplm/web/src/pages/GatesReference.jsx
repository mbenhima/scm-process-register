import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, StatusBadge } from '../components/ui.jsx';

export default function GatesReference() {
  const { t } = useI18n();
  const { data, error } = useFetch('/reference/gates');
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Skeleton h={400} /></div>;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Process design reference · Part 8')} title={t('Phase-gate reference')} subtitle={t('One line per decision: what each gate asks and the minimum evidence it needs.')} />
      <Card style={{ marginBottom: 24 }}>
        <DataTable csvName="gates" filterable={false} rows={data.gates} columns={[
          { key: 'id', label: t('Gate'), render: (g) => <strong className="strong">{g.id}</strong> }, { key: 'closes', label: t('Closes'), render: (g) => t(g.closes) },
          { key: 'question', label: t('Decision question'), render: (g) => t(g.question) }, { key: 'evidence', label: t('Minimum evidence'), render: (g) => <span className="small">{t(g.evidence)}</span> },
          { key: 'tracks', label: t('Tracks'), csv: (g) => g.tracks.join(', '), render: (g) => g.tracks.map((x) => t(x)).join(', ') },
        ]} />
      </Card>
      <div className="grid two">
        <Card><CardHead title={t('Decision outcomes')} />
          <ul className="list-plain">{data.outcomes.map((o) => <li key={o.id} className="row" style={{ alignItems: 'flex-start' }}><StatusBadge value={o.id} /><span>{t(o.text)}</span></li>)}</ul>
        </Card>
        <Card className="tint"><CardHead title={t('Gate roles')} /><p className="small">{t(data.roles)}</p></Card>
      </div>
    </div>
  );
}
