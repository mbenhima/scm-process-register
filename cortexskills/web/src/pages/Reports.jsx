import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { put, download } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, Btn, Icon, useAction, Seg, Field } from '../components/ui.jsx';
import { BarChart } from '../components/charts.jsx';

export function Reports() {
  const { t, L } = useI18n(); const { project, projects, can } = useSession(); const list = useData('/reports'); const [sel, setSel] = useState('RPT-001'); const [pid, setPid] = useState(project || projects[0]?.id || '');
  const rep = useData(sel ? `/reports/${sel}${pid ? '?project=' + pid : ''}` : null, [sel, pid]); const act = useAction();
  const exp = fmt => act(() => download(`/reports/${sel}/export?format=${fmt}${pid ? '&project=' + pid : ''}`, `${sel}.${fmt}`), 'reports.downloaded');
  return (<><PageHead eyebrow={t('navGroup.reports')} title={t('nav.reports')} subtitle={t('reports.subtitle')} />
    <div className="grid split-r"><Card title={t('reports.catalog')}><Guard state={list}>{rows => <div style={{ maxHeight: '70vh', overflow: 'auto' }}>{rows.map(r => <button key={r.id} className="nav-item" style={{ width: '100%', border: 0, background: 'none', textAlign: 'start' }} aria-current={sel === r.id ? 'page' : undefined} onClick={() => setSel(r.id)}><span className="xs muted" style={{ minWidth: 60 }}>{r.id}</span><span>{L(r.name)}</span></button>)}</div>}</Guard></Card>
      <div className="stack"><Card><div className="row" style={{ justifyContent: 'space-between' }}><Field label={t('col.project')} id="rp"><select id="rp" className="input" value={pid} onChange={e => setPid(e.target.value)}><option value="">{t('report.allProjects')}</option>{projects.map(p => <option key={p.id} value={p.id}>{L(p.name)}</option>)}</select></Field>
        {can('reports.export') && <div className="actions">{['pdf', 'xlsx', 'docx'].map(f => <Btn key={f} icon={f === 'pdf' ? 'FileText' : f === 'xlsx' ? 'Sheet' : 'FileType'} onClick={() => exp(f)}>{f === 'pdf' ? 'PDF' : f === 'xlsx' ? 'Excel' : 'Word'}</Btn>)}</div>}</div></Card>
        <Guard state={rep}>{m => <Card><div className="eyebrow">{m.id} · {m.cadence}</div><h2>{m.title}</h2><p className="subtitle">{m.subtitle}</p><p className="muted small">{t('report.audience')}: {m.audience}</p>
          {m.sections.map((s, i) => <div key={i} style={{ marginTop: 'var(--sp-5)' }}><h3>{s.heading}</h3>{s.text && <p className="small">{s.text}</p>}{s.table && <DataTable search={false} pageSize={20} rows={s.table.rows.map((r, k) => ({ id: k, r }))} columns={s.table.columns.map((c, ci) => ({ key: 'c' + ci, label: c, text: row => row.r[ci] }))} />}</div>)}</Card>}</Guard></div></div></>);
}

export function Benchmark() {
  const { t, L, fmtNum } = useI18n(); const { can, me, reload } = useSession(); const [dim, setDim] = useState('focus'); const within = useData('/benchmark/within?dimension=' + dim, [dim]); const group = useData(can('benchmark.group') ? '/benchmark/group' : null); const act = useAction(); const [view, setView] = useState('within');
  return (<><PageHead eyebrow={t('navGroup.reports')} title={t('nav.benchmark')} subtitle={t('bmk.subtitle')}><Seg value={view} onChange={setView} options={[{ id: 'within', label: t('bmk.within') }, ...(can('benchmark.group') ? [{ id: 'group', label: t('bmk.group') }] : [])]} label={t('bmk.view')} />
    {can('benchmark.manage') && me.group && <Btn icon={me.org?.benchmark_sharing ? 'EyeOff' : 'Eye'} onClick={async () => { await act(() => put('/benchmark/sharing', { enabled: !me.org?.benchmark_sharing })); reload(); group.reload?.(); }}>{me.org?.benchmark_sharing ? t('bmk.withdraw') : t('bmk.rejoin')}</Btn>}</PageHead>
    <p className="notice grey small" style={{ marginBottom: 'var(--sp-4)' }}><Icon name="Info" />{t('bmk.rules')}</p>
    {view === 'within' ? <><div className="row" style={{ marginBottom: 'var(--sp-3)' }}><Seg value={dim} onChange={setDim} options={['focus', 'mode', 'track', 'phase'].map(d => ({ id: d, label: t('bmk.dim.' + d) }))} label={t('bmk.dimension')} /></div>
      <Guard state={within}>{ms => <div className="grid g-2">{ms.map(m => <Card key={m.metric} title={t('bmk.metric.' + m.metric)} actions={<span className="xs muted">{t('bmk.better.' + m.better)}</span>}>
        <BarChart unit={m.unit === '%' ? '%' : ''} data={m.segments.map(s => ({ label: dim === 'focus' ? t('focus.' + s.segment) : dim === 'mode' ? t('mode.' + s.segment) : s.segment, value: s.comparable ? s.value : 0, org: m.organization }))} series={[{ key: 'value', label: t('bmk.segment') }, { key: 'org', label: t('bmk.orgValue') }]}
          caption={t('bmk.caption', { org: fmtNum(m.organization), median: m.median == null ? '—' : fmtNum(m.median), n: m.segments.filter(s => !s.comparable).length })} /></Card>)}</div>}</Guard></>
      : <Guard state={group}>{g => g.independent ? <div className="notice">{t('bmk.independent')}</div> : <div className="stack">{g.withdrawn && <div className="notice">{t('bmk.withdrawnNote')}</div>}{g.metrics.map(m => <Card key={m.metric} title={t('bmk.metric.' + m.metric)} actions={<span className="xs muted">{t('bmk.median')}: {m.median == null ? '—' : fmtNum(m.median)}</span>}>
        <DataTable search={false} rows={m.organizations.map((o, i) => ({ ...o, id: i }))} columns={[{ key: 'rank', label: t('bmk.rank'), num: true, text: o => o.comparable ? o.rank : t('bmk.notComparable') }, { key: 'name', label: t('col.organization'), render: o => <span className={o.self ? 'strong' : ''}>{L(typeof o.name === 'string' && o.name.startsWith('{') ? JSON.parse(o.name) : o.name)}{o.self && ' · ' + t('bmk.you')}</span> },
          { key: 'sector', label: t('col.sector') }, { key: 'value', label: t('col.value'), num: true, text: o => o.value == null ? '—' : fmtNum(o.value) }, { key: 'n', label: t('bmk.sample'), num: true }]} /></Card>)}</div>}</Guard>}</>);
}
