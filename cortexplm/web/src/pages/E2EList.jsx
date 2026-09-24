import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, useFetch, Skeleton, ErrorNote, Badge, Tabs, DataTable, Select } from '../components/ui.jsx';
import { useProcessAi, AiBadges, AiLegend } from '../components/ProcessAi.jsx';

// Every user-facing task of the nine E2E processes, with the AI use cases that support it.
function TasksAndAi({ data }) {
  const { t } = useI18n();
  const ai = useProcessAi();
  const [only, setOnly] = useState('');
  const rows = data.flatMap((e) => e.tasks.map((x) => ({ ...x, e2e: e.id, e2eName: e.name, ai: ai.forTask(x) })))
    .filter((x) => !only || (only === 'any' ? x.ai.length : x.ai.some((u) => u.tier === only)));
  const withAi = data.flatMap((e) => e.tasks).filter((x) => ai.forTask(x).length).length;
  return (
    <Card>
      <CardHead title={t('Tasks and where AI is used')} subtitle={t('{a} of {n} tasks are supported by at least one active AI use case.', { a: withAi, n: data.reduce((s, e) => s + e.tasks.length, 0) })} />
      <AiLegend />
      <DataTable csvName="tasks_and_ai" rows={rows} pageSize={100}
        toolbar={<Select aria-label={t('AI filter')} value={only} onChange={(e) => setOnly(e.target.value)} placeholder={t('All tasks')} style={{ width: 'auto' }} options={[{ value: 'any', label: t('Tasks with AI') }, { value: 'Assistive', label: t('With Assistive AI') }, { value: 'Augmented', label: t('With Augmented AI') }]} />}
        columns={[
          { key: 'e2e', label: t('E2E'), render: (x) => <Link to={`/e2e/${x.e2e}`}>{x.e2e}</Link> },
          { key: 'id', label: t('Task ID') },
          { key: 'name', label: t('Task'), render: (x) => <><div className="strong">{t(x.name)}</div><div className="xs muted">{t(x.macroProcesses)}</div></> },
          { key: 'R', label: t('Responsible'), render: (x) => <span className="xs">{t(x.R)}</span> },
          { key: 'ai', label: t('AI'), sortValue: (x) => x.ai.length, csv: (x) => x.ai.map((u) => `${u.code} ${u.tier}`).join('; '), render: (x) => <AiBadges list={x.ai} empty={<span className="muted xs">—</span>} /> },
        ]} />
    </Card>
  );
}

export default function E2EList() {
  const { t } = useI18n();
  const { data, error } = useFetch('/reference/e2e');
  const [tab, setTab] = useState('processes');
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Process design reference')} title={t('End-to-end processes')} subtitle={t('9 E2E processes, 81 user-facing tasks, 8 exit gates. E2E-09 runs in parallel with all others.')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'processes', label: t('Processes') }, { value: 'tasks', label: t('Tasks and AI') }]} />
      {tab === 'tasks' ? <TasksAndAi data={data} /> : <>
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
      </>}
    </div>
  );
}
