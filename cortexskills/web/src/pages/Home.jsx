import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { post } from '../lib/api.js';
import { PageHead, Card, Kpi, Guard, DataTable, StatusPill, Progress, Btn, Icon, useAction, Seg } from '../components/ui.jsx';
import { BarChart, LineChart, StackBar, STATUS_COLORS } from '../components/charts.jsx';

export function Dashboard() {
  const { t, L, fmtNum } = useI18n(); const { me, project } = useSession();
  const d = useData('/dashboard' + (project ? `?project=${project}` : ''));
  return (<Guard state={d}>{x => {
    const c = x.counts; const pct = c.n ? Math.round((c.done * 100) / c.n) : 0;
    const months = [...new Set([...x.planned.map(p => p.month), ...x.trend.map(p => p.month)])].sort().slice(-8);
    const rag = Object.fromEntries(x.rag.map(r => [r.status, r.n]));
    return (<>
      <PageHead eyebrow={t('dash.eyebrow')} title={L(me.org?.name)} subtitle={t('dash.subtitle', { done: fmtNum(c.done), total: fmtNum(c.n), pct })}>
        <Link className="btn" to="/my-tasks"><Icon name="ListChecks" />{t('dash.myTasks', { n: x.mine })}</Link><Link className="btn primary" to="/projects"><Icon name="FolderKanban" />{t('nav.projects')}</Link></PageHead>
      <div className="grid g-4">
        <Kpi icon="Gauge" value={pct + '%'} label={t('dash.completion')} note={t('dash.completionNote', { n: fmtNum(c.n) })} />
        <Kpi icon="CalendarClock" value={fmtNum(c.overdue)} label={t('dash.overdue')} note={t('dash.blocked', { n: c.blocked })} emph={false} />
        <Kpi icon="Bell" value={fmtNum(x.alerts)} label={t('dash.unreadAlerts')} emph={false} />
        <Kpi icon="MessagesSquare" value={x.stakeholders ? Math.round((x.responses * 100) / x.stakeholders) + '%' : '—'} label={t('dash.responseRate')} note={t('dash.responses', { n: x.responses, s: x.stakeholders })} emph={false} />
      </div>
      <div className="grid split" style={{ marginTop: 'var(--sp-4)' }}>
        <Card title={t('dash.phaseProgress')}><BarChart unit="%" max={100} data={x.phases.map(p => ({ label: t('phase.short.' + p.phase), value: p.progress }))} caption={t('dash.phaseCaption')} /></Card>
        <Card title={t('dash.kpiHealth')}><StackBar parts={['Green', 'Amber', 'Red'].map(s => ({ label: t('status.' + s), value: rag[s] || 0, color: STATUS_COLORS[s] }))} caption={t('dash.kpiCaption')} />
          <hr className="divider" /><StackBar parts={[{ label: t('status.Completed'), value: c.done, color: STATUS_COLORS.Completed }, { label: t('status.In progress'), value: c.wip, color: STATUS_COLORS['In progress'] }, { label: t('status.Blocked'), value: c.blocked, color: STATUS_COLORS.Blocked }, { label: t('status.Not started'), value: c.n - c.done - c.wip - c.blocked, color: STATUS_COLORS['Not started'] }]} caption={t('dash.taskCaption')} /></Card>
      </div>
      <div className="grid split-r" style={{ marginTop: 'var(--sp-4)' }}>
        <Card title={t('nav.projects')}>{x.projects.map(p => <Link key={p.id} to={`/projects/${p.id}`} className="e2e-row" style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 48px' }}>
          <span><span className="strong">{L(p.name)}</span><br /><span className="xs muted">{t('focus.' + p.focus)} · {t('mode.' + p.mode)}{p.track ? ' · ' + p.track : ''}</span></span><Progress value={p.progress} label={L(p.name)} /><span className="mono small">{Math.round(p.progress)}%</span></Link>)}</Card>
        <Card title={t('dash.throughput')}><LineChart labels={months.map(m => m.slice(2))} lines={[{ label: t('dash.completed'), values: months.map(m => x.trend.find(y => y.month === m)?.n || 0) }, { label: t('dash.planned'), values: months.map(m => x.planned.find(y => y.month === m)?.n || 0), dashed: true }]} caption={t('dash.throughputCaption')} /></Card>
      </div>
      <Card title={t('dash.e2eProgress')} className="" ><div style={{ marginTop: 'var(--sp-2)' }}><BarChart unit="%" max={100} height={200} data={x.topE2e.slice(0, 36).map(e => ({ label: e.e2e_id.replace('E2E-', ''), value: e.progress }))} caption={t('dash.e2eCaption')} /></div></Card>
    </>);
  }}</Guard>);
}

export function MyTasks() {
  const { t, L, fmtDate } = useI18n(); const nav = useNavigate(); const d = useData('/tasks/mine');
  const cat = useData('/catalog/uft');
  const u = id => cat.data?.find(x => x.id === id);
  return (<><PageHead eyebrow={t('navGroup.home')} title={t('nav.myTasks')} subtitle={t('mytasks.subtitle')} />
    <Guard state={d}>{rows => <DataTable csvName="my_tasks" rows={rows} onRow={r => nav(`/runs/${r.e2e_instance_id}?task=${r.id}`)} columns={[
      { key: 'uft_id', label: t('col.task'), render: r => <span><span className="strong">{r.uft_id}</span> {L(u(r.uft_id)?.name)}</span>, text: r => `${r.uft_id} ${L(u(r.uft_id)?.name)}` },
      { key: 'e2e_id', label: 'E2E' }, { key: 'project', label: t('col.project'), text: r => L(r.project_name) },
      { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} />, text: r => r.status },
      { key: 'due_date', label: t('col.due'), render: r => <span className={new Date(r.due_date) < new Date() ? 'strong' : ''}>{fmtDate(r.due_date)}{new Date(r.due_date) < new Date() && ' · ' + t('status.overdue')}</span>, text: r => r.due_date?.slice(0, 10) }]} />}</Guard></>);
}

export function Alerts() {
  const { t, L, fmtDate } = useI18n(); const { project } = useSession(); const d = useData('/alerts' + (project ? `?project=${project}` : '')); const act = useAction(); const [f, setF] = useState('unread');
  const read = async (a, dismiss) => { await act(() => post(`/alerts/${a.id}/read`, { dismiss }), null); d.reload(); };
  return (<><PageHead eyebrow={t('navGroup.home')} title={t('nav.alerts')} subtitle={t('alerts.subtitle')}>
    <Seg value={f} onChange={setF} options={[{ id: 'unread', label: t('alerts.unread') }, { id: 'all', label: t('alerts.all') }]} label={t('alerts.filter')} />
    <Btn icon="RefreshCw" onClick={async () => { const r = await act(() => post('/alerts/run'), null); d.reload(); return r; }}>{t('alerts.recompute')}</Btn>
    <Btn icon="CheckCheck" onClick={async () => { await act(() => post('/alerts/read-all'), 'alerts.allRead'); d.reload(); }}>{t('alerts.markAll')}</Btn></PageHead>
    <Guard state={d}>{rows => <DataTable csvName="alerts" rows={rows.filter(a => f === 'all' || !a.read)} columns={[
      { key: 'severity', label: t('col.severity'), render: a => <span className={`pill ${a.severity === 'High' || a.severity === 'Critical' ? 's1' : a.severity === 'Medium' ? 's2' : 's3'}`}>{t('severity.' + a.severity)}</span>, text: a => a.severity },
      { key: 'type', label: t('col.type'), render: a => <span><span className="strong">{a.type}</span><br /><span className="xs muted">{L(a.catalog?.name)}</span></span>, text: a => a.type },
      { key: 'text', label: t('col.message') }, { key: 'step', label: t('col.step'), text: a => a.step_id || '—' },
      { key: 'esc', label: t('col.escalation'), text: a => L(a.catalog?.escalation) },
      { key: 'created_at', label: t('col.date'), text: a => fmtDate(a.created_at), sortValue: a => a.created_at },
      { key: 'act', label: '', noSort: true, noCsv: true, render: a => <div className="row" style={{ flexWrap: 'nowrap' }}>{!a.read && <Btn size="sm" onClick={e => { e.stopPropagation(); read(a, false); }}>{t('alerts.markRead')}</Btn>}<Btn size="sm" kind="ghost" icon="EyeOff" aria-label={t('alerts.dismiss')} onClick={e => { e.stopPropagation(); read(a, true); }} /></div> }]} />}</Guard></>);
}

export function AssistantPage() {
  const { t } = useI18n(); const [q, setQ] = useState(''); const [items, setItems] = useState([]); const [mode, setMode] = useState('auto'); const intents = useData('/assistant/intents');
  const ask = async e => { e.preventDefault(); if (!q.trim()) return; const question = q; setQ('');
    try { const r = await post('/assistant/ask', { question, mode }); setItems(i => [{ question, ...r }, ...i]); } catch (x) { setItems(i => [{ question, answer: x.message }, ...i]); } };
  const examples = ['assistant.ex1', 'assistant.ex2', 'assistant.ex3', 'assistant.ex4'];
  return (<><PageHead eyebrow={t('navGroup.home')} title={t('nav.assistant')} subtitle={t('assistant.subtitle')} />
    <div className="grid split"><div className="stack"><Card><form onSubmit={ask} className="stack"><Seg value={mode} onChange={setMode} options={[{ id: 'auto', label: t('assistant.auto') }, { id: 'data', label: t('assistant.data') }, { id: 'help', label: t('assistant.help') }]} label={t('assistant.mode')} />
      <div className="row" style={{ flexWrap: 'nowrap' }}><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={t('assistant.placeholder')} aria-label={t('assistant.placeholder')} /><Btn kind="primary" type="submit" icon="Send">{t('assistant.send')}</Btn></div>
      <div className="row">{examples.map(k => <Btn key={k} size="sm" onClick={() => setQ(t(k))}>{t(k)}</Btn>)}</div></form></Card>
      {items.map((it, i) => <Card key={i}><p className="muted small">{it.question}</p><p className="strong">{it.answer}</p>
        <div className="row">{it.mode && <span className="pill">{t('assistant.mode.' + it.mode)}</span>}{it.intent && <span className="pill tint">{it.intent}</span>}{it.refused && <span className="pill s1">{it.permission}</span>}</div>
        {it.references?.length > 0 && <ul className="small">{it.references.map((r, k) => <li key={k}>{r.route ? <Link to={r.route}>{r.title}</Link> : r.title} <span className="muted">({r.source}, {r.score})</span></li>)}</ul>}</Card>)}</div>
      <Card title={t('assistant.intents')}><p className="muted small">{t('assistant.intentsText')}</p><ul className="small">{(intents.data || []).map(i => <li key={i.id}><span className="strong">{t('assistant.intentName.' + i.id)}</span> — <code>{i.permission}</code></li>)}</ul></Card></div></>);
}
