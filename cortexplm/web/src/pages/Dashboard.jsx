import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, Gavel, Clock3, ClipboardCheck, Plus } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, Kpi, useFetch, Skeleton, ErrorNote, Button, StatusBadge, fmtNum, fmtDate } from '../components/ui.jsx';
import { BarChart, HBars, LineChart } from '../components/charts.jsx';

export default function Dashboard() {
  const { me, can } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const { data, error } = useFetch('/dashboard');
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Skeleton h={480} /></div>;
  const k = Object.fromEntries(data.kpis.map((x) => [x.id, x]));
  const c = data.counts;
  return (
    <div className="page">
      <PageHeader eyebrow={`${t(me.organization.industry)} · ${me.organization.name}`} title={t('Portfolio dashboard')}
        subtitle={t('{a} active projects, {g} gates waiting for a decision and {o} overdue tasks, computed from current records.', { a: c.active, g: c.pendingGates, o: c.overdue })}
        actions={can('project.create') && <Button variant="primary" icon={Plus} onClick={() => nav('/projects/new')}>{t('New project')}</Button>} />
      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi value={c.active} label={t('Active projects')} meta={t('{h} on hold · {l} launched · {r} retired', { h: c.onHold, l: c.launched, r: c.retired })} icon={FolderKanban} />
        <Kpi value={c.pendingGates} label={t('Gates awaiting decision')} meta={t('Gate cycle time: {v} days (target {tg})', { v: k['KPI-02']?.value ?? '—', tg: k['KPI-02']?.target })} icon={Gavel} />
        <Kpi value={c.overdue} label={t('Overdue tasks')} meta={t('{n} open tasks are assigned to you', { n: c.myTasks })} icon={Clock3} neutral />
        <Kpi value={k['KPI-38']?.value != null ? `${k['KPI-38'].value}%` : '—'} label={t('Checklist compliance')} meta={t('Mandatory items complete with evidence (target {tg})', { tg: k['KPI-38']?.target })} icon={ClipboardCheck} />
      </div>
      <div className="grid two" style={{ marginBottom: 24 }}>
        <Card>
          <CardHead title={t('E2E process instances')} subtitle={t('{n} instances across the nine end-to-end processes', { n: c.runs })} />
          <BarChart data={data.byE2E.map((r) => ({ label: r.e2e_id.replace('E2E-', 'E'), value: r.total, secondary: r.completed }))} primaryLabel={t('All instances')} secondaryLabel={t('Completed')}
            caption={t('Instances started per E2E process (orange) against instances completed (grey).')} />
        </Card>
        <Card>
          <CardHead title={t('Gate decisions')} subtitle={t('All decisions recorded to date')} />
          <HBars data={['Go', 'Recycle', 'Hold', 'Kill'].map((d) => ({ label: t(d), value: data.decisions.find((x) => x.decision === d)?.n || 0, muted: d !== 'Go' }))}
            caption={t('Go decisions dominate; Recycle shows where evidence was incomplete.')} />
        </Card>
      </div>
      <div className="grid two" style={{ marginBottom: 24 }}>
        <Card>
          <CardHead title={t('Gate decisions per month')} subtitle={t('Last 12 months')} />
          {data.trend.length > 1 ? <LineChart data={data.trend.map((r) => ({ label: r.month, value: r.decided }))} caption={t('Number of gate decisions recorded each month.')} /> : <p className="muted">{t('Not enough history yet.')}</p>}
        </Card>
        <Card>
          <CardHead title={t('Waiting for the Gate Review Board')} actions={<Link to="/gate-board">{t('Open gate board')}</Link>} />
          {data.submitted.length ? (
            <ul className="list-plain">
              {data.submitted.map((g) => <li key={g.id} className="row between"><Link to={`/gates/${g.id}`}>{g.code} · {g.name}</Link><span className="row" style={{ gap: 8 }}><StatusBadge value="Submitted">{g.gate}</StatusBadge><span className="muted">{fmtDate(g.submitted_at)}</span></span></li>)}
            </ul>
          ) : <p className="muted">{t('No gate is waiting for a decision.')}</p>}
        </Card>
      </div>
      <div className="grid three">
        <Card>
          <CardHead title={t('Projects by track')} />
          <HBars data={['Full', 'Light', 'Fast'].map((tr) => ({ label: t(`${tr} Track`), value: data.byTrack.find((x) => x.track === tr)?.n || 0 }))} caption={t('Track assignment follows the complexity score (7 to 35).')} />
        </Card>
        <Card>
          <CardHead title={t('Average gate cycle time')} />
          <HBars data={data.gateCycle.map((g) => ({ label: g.gate, value: g.days }))} format={(v) => `${fmtNum(v, 1)} ${t('d')}`} caption={t('Days from submission to decision, by gate.')} />
        </Card>
        <Card>
          <CardHead title={t('Key indicators')} actions={<Link to="/kpis">{t('All KPIs')}</Link>} />
          <ul className="list-plain">
            {data.kpis.filter(Boolean).map((x) => (
              <li key={x.id} className="row between"><span>{x.id} {t(x.name)}</span><span className="row" style={{ gap: 8 }}><strong className="strong num">{x.value != null ? `${fmtNum(x.value, 1)} ${x.unit === '%' ? '%' : t(x.unit)}` : '—'}</strong><StatusBadge value={x.status}>{t(x.status === 'met' ? 'On target' : x.status === 'near' ? 'Near target' : x.status === 'missed' ? 'Off target' : 'No target')}</StatusBadge></span></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
