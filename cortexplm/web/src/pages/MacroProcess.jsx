import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, Badge } from '../components/ui.jsx';

const COV = { '●': ['Mapped', 's4'], '○': ['Proposed', 's3'], E: ['Platform enabler', 'outline'], '◆': ['Conditional', 's2'] };

export default function MacroProcess() {
  const { id } = useParams();
  const { t } = useI18n();
  const { data: m, error } = useFetch(`/reference/macro-processes/${id}`);
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!m) return <div className="page"><Skeleton h={500} /></div>;
  const sipoc = [['Suppliers', m.suppliers], ['Inputs', m.inputs], ['Process', null], ['Outputs', m.outputs], ['Customers', m.customers]];
  return (
    <div className="page">
      <PageHeader eyebrow={`${m.id} · ${t(m.category)}`} title={t(m.name)} subtitle={t(m.goal)}
        actions={<><Badge>{t('Owner')}: {t(m.d01?.Owner_Role)}</Badge>{m.packs.map((p) => <Badge key={p.id} tone="accent">{p.id}</Badge>)}</>} />
      <Card style={{ marginBottom: 24 }}>
        <CardHead title={t('SIPOC')} subtitle={`${t('Trigger')}: ${t(m.d01?.Trigger)} · ${t('Terminal state')}: ${t(m.d01?.Terminal_State)}`} />
        <div className="sipoc">
          {sipoc.map(([k, v]) => (
            <div key={k}><h4>{t(k)}</h4>{k === 'Process' ? <ol style={{ margin: 0, paddingInlineStart: 18 }}>{m.process.map((p) => <li key={p}>{t(p)}</li>)}</ol> : <span>{t(v)}</span>}</div>
          ))}
        </div>
      </Card>
      <div className="grid two">
        <div className="stack">
          <Card>
            <CardHead title={t('Tasks and steps (D02)')} subtitle={t('{n} steps', { n: m.tasks.reduce((a, x) => a + x.steps.length, 0) })} />
            {m.tasks.map((task) => (
              <div key={task.name} style={{ marginBottom: 16 }}>
                <h4>{t(task.name)}</h4>
                <ul className="list-plain">{task.steps.map((s) => <li key={s.Step_ID} className="row between"><span><strong className="strong">{s.Step_ID}</strong> {t(s.Step_Name)}</span><span className="row" style={{ gap: 8 }}><Badge>{t(s.Step_Type)}</Badge><span className="xs muted">{t(s.Responsible_Role)}</span></span></li>)}</ul>
              </div>
            ))}
          </Card>
        </div>
        <div className="stack">
          <Card>
            <CardHead title={t('Coverage across E2E processes')} />
            <div className="row">{Object.entries(m.coverage).filter(([, v]) => v).map(([e, v]) => <span key={e} className={`badge ${COV[v]?.[1]}`}>{e.replace('E', 'E2E-')} · {t(COV[v]?.[0])}</span>)}</div>
            <div className="xs muted" style={{ marginTop: 8 }}>{t('Track activation')}: {t('Full')} {t(m.track.Full)} · {t('Light')} {t(m.track.Light)} · {t('Fast')} {t(m.track.Fast)}</div>
          </Card>
          <Card><CardHead title={t('Business rules (D03)')} />
            <DataTable filterable={false} rows={m.rules} columns={[{ key: 'Rule_ID', label: t('Rule') }, { key: 'Condition', label: t('Condition'), render: (r) => t(r.Condition) }, { key: 'Rule_Type', label: t('Type'), render: (r) => t(r.Rule_Type) }]} empty={t('None')} />
          </Card>
          <Card><CardHead title={t('Controls (D04)')} />
            <DataTable filterable={false} rows={m.controls} columns={[{ key: 'Control_ID', label: t('Control') }, { key: 'Control_Name', label: t('Name'), render: (r) => t(r.Control_Name) }, { key: 'Type', label: t('Type'), render: (r) => t(r.Type) }]} empty={t('None')} />
          </Card>
          <Card><CardHead title={t('KPIs (D06) and AI use cases (D15)')} />
            <ul className="list-plain">{m.kpis.map((k) => <li key={k.KPI_ID}>{k.KPI_ID} {t(k.KPI_Name)} · {t('target')} {k.Target}</li>)}{m.ai.map((a) => <li key={a.AIUC_ID}>{a.AIUC_ID} {t(a.Use_Case_Name)} · {t(a.Risk_Level)}</li>)}</ul>
            {!m.kpis.length && !m.ai.length && <p className="muted">{t('None')}</p>}
          </Card>
          <Card><CardHead title={t('Information classes (D09)')} />
            <ul className="list-plain">{m.classes.map((c) => <li key={c.Object_Class_ID}>{c.Object_Class_ID} {t(c.Class_Name)} · <span className="muted">{t(c.Description)}</span></li>)}</ul>
            <Link to="/data-model">{t('Open the data model')}</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
