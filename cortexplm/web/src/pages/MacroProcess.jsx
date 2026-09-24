import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, Badge } from '../components/ui.jsx';
import { useProcessAi, AiBadges, AiLegend } from '../components/ProcessAi.jsx';

const COV = { '●': ['Mapped', 's4'], '○': ['Proposed', 's3'], E: ['Platform enabler', 'outline'], '◆': ['Conditional', 's2'] };

// This organization's own governance records tagged to the macro process (FR-DA-GOV-08).
function TaggedGovernance({ tag }) {
  const { t } = useI18n();
  const { data } = useFetch(`/governance/by-process/${tag}`);
  if (!data) return null;
  const sections = [
    ['Business rules', data.rules, '/business-rules', (r) => `${r.code} · ${r.condition} → ${r.action}`, (r) => r.severity],
    ['Controls', data.controls, '/controls', (r) => `${r.code} · ${r.name}`, (r) => r.effectiveness],
    ['Risks & opportunities', data.risks, '/risks', (r) => `${r.code} · ${r.name}`, (r) => `${t('Score')} ${r.score}`],
    ['RACSI activities', data.racsi, '/racsi', (r) => r.name, () => null],
    ['Lessons learned', data.rex, '/rex', (r) => r.title, (r) => (r.rating ? `${r.rating}/5` : null)],
  ];
  const total = sections.reduce((s, x) => s + x[1].length, 0);
  return (
    <Card style={{ marginTop: 24 }}>
      <CardHead title={t('Governance tagged to this process')} subtitle={t('{n} records of your organization carry the tag {tag}.', { n: total, tag })} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {sections.filter((x) => x[1].length).map(([label, rows, to, text, meta]) => (
          <div key={label}>
            <h4><Link to={to}>{t(label)}</Link> <span className="muted small">({rows.length})</span></h4>
            <ul className="list-plain">{rows.slice(0, 8).map((r) => <li key={r.id} className="small">{text(r)}{meta(r) && <> <Badge>{t(String(meta(r)))}</Badge></>}</li>)}</ul>
            {rows.length > 8 && <Link className="small" to={to}>{t('Show all {n}', { n: rows.length })}</Link>}
          </div>
        ))}
      </div>
      {!total && <p className="muted small">{t('No governance record is tagged to this process yet.')}</p>}
    </Card>
  );
}

export default function MacroProcess() {
  const { id } = useParams();
  const { t } = useI18n();
  const { can } = useAuth();
  const { data: m, error } = useFetch(`/reference/macro-processes/${id}`);
  const ai = useProcessAi();
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
            <AiLegend />
            {m.tasks.map((task) => (
              <div key={task.name} style={{ marginBottom: 16 }}>
                <h4>{t(task.name)}</h4>
                <ul className="list-plain">{task.steps.map((s) => <li key={s.Step_ID} className="row between"><span><strong className="strong">{s.Step_ID}</strong> {t(s.Step_Name)} <AiBadges list={ai.forStep(s.Step_ID)} /></span><span className="row" style={{ gap: 8 }}><Badge>{t(s.Step_Type)}</Badge><span className="xs muted">{t(s.Responsible_Role)}</span></span></li>)}</ul>
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
            <ul className="list-plain">{m.kpis.map((k) => <li key={k.KPI_ID}>{k.KPI_ID} {t(k.KPI_Name)} · {t('target')} {k.Target}</li>)}</ul>
            <div style={{ marginTop: 8 }}><AiBadges list={ai.forMp(m.id)} empty={m.ai.length ? <p className="muted small">{t('The AI use cases of this process are not active in your organization.')}</p> : null} /></div>
            {!m.kpis.length && !m.ai.length && !ai.forMp(m.id).length && <p className="muted">{t('None')}</p>}
          </Card>
          <Card><CardHead title={t('Information classes (D09)')} />
            <ul className="list-plain">{m.classes.map((c) => <li key={c.Object_Class_ID}>{c.Object_Class_ID} {t(c.Class_Name)} · <span className="muted">{t(c.Description)}</span></li>)}</ul>
            <Link to="/data-model">{t('Open the data model')}</Link>
          </Card>
        </div>
      </div>
      {can('governance.view', 'racsi.view', 'rex.view') && <TaggedGovernance tag={m.id} />}
    </div>
  );
}
