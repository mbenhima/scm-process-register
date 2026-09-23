import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, Skeleton, ErrorNote, Select, Badge } from '../components/ui.jsx';
import { HBars } from '../components/charts.jsx';

export default function Library() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { data, error } = useFetch('/reference/macro-processes');
  const [cat, setCat] = useState('');
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  const cats = [...new Set(data.map((m) => m.category))];
  return (
    <div className="page">
      <PageHeader eyebrow={t('Process design reference')} title={t('Macro processes')} subtitle={t('69 reusable building blocks, each described as a SIPOC card with {s} tasks and steps.', { s: data.reduce((a, m) => a + m.stepCount, 0) })} />
      <div className="grid two">
        <Card>
          <DataTable csvName="macro_processes" rows={data.filter((m) => !cat || m.category === cat)} pageSize={70} onRowClick={(m) => nav(`/library/${m.id}`)}
            toolbar={<Select aria-label={t('Category')} value={cat} onChange={(e) => setCat(e.target.value)} placeholder={t('All categories')} options={cats.map((c) => ({ value: c, label: t(c) }))} style={{ width: 'auto' }} />}
            columns={[
              { key: 'id', label: t('ID'), sortValue: (m) => Number(m.id.slice(3)) },
              { key: 'name', label: t('Macro process'), render: (m) => <><div className="strong">{t(m.name)}</div><div className="xs muted">{t(m.goal)}</div></> },
              { key: 'category', label: t('Part'), render: (m) => <Badge>{m.part}</Badge>, csv: (m) => m.category },
              { key: 'owner', label: t('Owner role'), csv: (m) => m.d01?.Owner_Role, render: (m) => t(m.d01?.Owner_Role) },
              { key: 'stepCount', label: t('Steps'), num: true },
              { key: 'usedIn', label: t('Used in'), render: (m) => <span className="xs">{t(m.usedIn)}</span> },
            ]} />
        </Card>
        <Card>
          <h3>{t('Macro processes by category')}</h3>
          <HBars data={cats.map((c) => ({ label: t(c), value: data.filter((m) => m.category === c).length }))} caption={t('Parts A to K of the Process Design Reference; parts F to H are not used.')} />
        </Card>
      </div>
    </div>
  );
}
