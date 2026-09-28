import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gauge, ListChecks, AlarmClock, AlertOctagon, Bell, Sparkles, FolderOpen } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Card, Kpi, Loading, ErrorBox, Status, Empty, tx, IconBadge } from '../components/ui.jsx';
import { BarList, LineChart, Heatmap, Columns } from '../components/charts.jsx';

export function NoProject() {
  const { t } = useApp();
  return <Empty icon={FolderOpen} title={t('No project selected')}>{t('Choose a project in the header switcher.')}</Empty>;
}

export default function Home() {
  const { t, L, lang, project, projectId, fmtDate, fmtNum } = useApp();
  const navigate = useNavigate();
  const { data: d, loading, error, reload } = useData(projectId ? `/projects/${projectId}/dashboard` : null);
  const [kpiId, setKpiId] = useState(null);
  if (!projectId) return <NoProject />;
  if (loading && !d) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const kpi = d.kpis.find(k => k.id === kpiId) || d.kpis.find(k => k.onTarget === false) || d.kpis[0];
  const unread = d.alerts.reduce((a, b) => a + b.n, 0);
  const openNc = d.ncs.filter(n => n.stage !== 'Closed').reduce((a, b) => a + b.n, 0);
  const off = d.kpis.filter(k => k.onTarget === false).length;
  return (
    <>
      <PageHead eyebrow={`${tx(project.org.name, lang)} · ${L(project.ms_type)}`} title={tx(project.name, lang)}
        subtitle={t('{mode} · {n} of {total} steps completed · current phase {phase}', { mode: `${L(project.mode)}${project.track ? ' · ' + L(project.track) : ''}`, n: fmtNum(d.steps.done, 0), total: fmtNum(d.steps.n, 0), phase: d.phases.find(p => ['Active', 'AtGate'].includes(p.status))?.e2e_id || '—' })}
        actions={<><Link className="btn" to="/lifecycle">{t('Open lifecycle')}</Link><Link className="btn btn-primary" to="/tasks">{t('My tasks')}</Link></>} />
      <div className="grid-kpi" style={{ marginBottom: 'var(--sp-24)' }}>
        <Kpi value={`${d.progress}%`} label={t('Lifecycle progress')} icon={Gauge} accent foot={t('{n} steps in progress', { n: d.steps.prog })} />
        <Kpi value={fmtNum(d.mine, 0)} label={t('Open steps for my roles')} icon={ListChecks} />
        <Kpi value={fmtNum(d.steps.overdue, 0)} label={t('Overdue steps')} icon={AlarmClock} />
        <Kpi value={fmtNum(openNc, 0)} label={t('Open nonconformities')} icon={AlertOctagon} />
        <Kpi value={`${off}/${d.kpis.length}`} label={t('KPIs off target')} icon={Bell} foot={t('{n} unread alerts', { n: unread })} />
      </div>
      <div className="grid-main">
        <div className="stack">
          <Card title={t('Progress by lifecycle phase')} action={<Link to="/lifecycle" className="small">{t('Details')}</Link>}>
            <BarList items={d.phases.map(p => ({ key: p.e2e_id, label: `${p.e2e_id} · ${tx(p.name, lang)}`, value: p.progress }))} caption={t('Share of completed steps in each end-to-end phase of the run.')} />
          </Card>
          {kpi && (
            <Card title={t('KPI trend')} action={<select className="select" style={{ width: 'auto', maxWidth: 280 }} aria-label={t('Choose a KPI')} value={kpi.id} onChange={e => setKpiId(e.target.value)}>{d.kpis.map(k => <option key={k.id} value={k.id}>{k.code} — {tx(k.name, lang)}</option>)}</select>}>
              <div className="row small" style={{ marginBottom: 8 }}><span className="strong">{tx(kpi.name, lang)}</span><Status value={kpi.onTarget === null ? null : kpi.onTarget ? 'On track' : 'At risk'} /><span className="muted">{t('Target')} <span className="ltr">{kpi.target_text}</span></span></div>
              <LineChart series={kpi.series} target={kpi.target} unit={kpi.unit} seriesLabel={t('Measured value')} targetLabel={t('Target')} caption={t('Monthly values of {kpi} against its target (dashed line).', { kpi: kpi.code })} />
            </Card>
          )}
          <Card title={t('Steps completed per month')}>
            <Columns items={d.monthly.filter(m => m.m)} label={t('steps')} caption={t('Number of workflow steps completed each month since the start of the run.')} />
          </Card>
        </div>
        <div className="stack">
          <Card title={t('Next steps')} action={<Link to="/tasks" className="small">{t('All')}</Link>}>
            <ul className="list">
              {d.upcoming.map(s => (
                <li key={s.id}><button className="list-btn" onClick={() => navigate(`/steps/${s.id}`)}>
                  <span className="stack-8" style={{ gap: 2, minWidth: 0 }}><span className="strong small">{tx(s.name, lang)}</span><span className="xsmall muted">{s.mpCode} · {s.step_id} · {fmtDate(s.due_date)}</span></span>
                  <span style={{ marginInlineStart: 'auto' }}><Status value={s.due_date < new Date().toISOString().slice(0, 10) ? 'Overdue' : s.status} /></span>
                </button></li>
              ))}
            </ul>
          </Card>
          <Card title={t('Risk heatmap')} action={<Link to="/risks" className="small">{t('Register')}</Link>}>
            <Heatmap cells={d.heat} likelihoodLabel={t('Likelihood')} impactLabel={t('Impact')} caption={t('Number of risks, hazards and aspects per likelihood and impact score.')} />
          </Card>
          <Card title={t('Upcoming audits')}>
            {d.audits.length ? <ul className="list">{d.audits.map(a => <li key={a.id}><Link to={`/audits/${a.id}`} className="strong small">{tx(a.title, lang)}</Link><div className="xsmall muted">{a.code} · {fmtDate(a.planned_date)}</div></li>)}</ul> : <p className="small muted">{t('No audit planned.')}</p>}
          </Card>
          <Card tight className="tint">
            <div className="row"><IconBadge icon={Sparkles} accent /><div><div className="strong">{t('AI suggestions')}</div><div className="small">{t('{a} accepted, {e} edited, {r} rejected out of {n}', { a: d.ai.acc || 0, e: d.ai.ed || 0, r: d.ai.rej || 0, n: d.ai.n || 0 })}</div></div></div>
          </Card>
        </div>
      </div>
    </>
  );
}
