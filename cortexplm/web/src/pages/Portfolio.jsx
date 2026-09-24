// Portfolio overview: for a chosen scope (group, organizations, a set of projects) one row per project,
// one column per E2E process, and the status of that process at the intersection, with a legend.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, useFetch, Skeleton, ErrorNote, Select, StatusBadge, IconButton, Kpi, useToast } from '../components/ui.jsx';
import { ScopeFilters } from './Projects.jsx';
import { downloadCsv } from '../lib/csv.js';

const ABBR = { Completed: '✓', 'In progress': '•', 'At gate': 'G', 'On hold': 'H', Stopped: '✕', 'Not started': '', 'Not in track': '—' };

export default function Portfolio() {
  const { t } = useI18n();
  const { me, switchOrg } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const scope = useFetch('/portfolio/scope');
  const [sc, setSc] = useState({ group: '', org: '', project: '' });
  const [picked, setPicked] = useState([]);
  const [track, setTrack] = useState('');
  const qs = useMemo(() => new URLSearchParams(Object.entries({ group: sc.group, org: sc.org, projects: picked.join(','), track }).filter(([, v]) => v)).toString(), [sc, picked, track]);
  const { data, error } = useFetch(`/portfolio/matrix?${qs}`);
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  const projectsInScope = (scope.data?.projects || []).filter((p) => (!sc.org || String(p.org_id) === sc.org) && (!sc.group || (scope.data.orgs.find((o) => o.id === p.org_id)?.group_id ?? 'none') == (sc.group === 'none' ? 'none' : Number(sc.group))));
  const open = async (row) => {
    if (row.own) { nav(`/projects/${row.id}`); return; }
    if (me.user.isPlatformAdmin) { await switchOrg(row.org_id); nav(`/projects/${row.id}`); return; }
    toast.ok(t('{p} belongs to {o}. You can see it here and in the portfolio overview; only its organization can open it.', { p: row.code, o: row.org_name }));
  };
  const exportCsv = () => downloadCsv('portfolio_overview', [
    { label: 'Organization', key: 'org_name' }, { label: 'Group', csv: (r) => r.group_name || 'No group' }, { label: 'Code', key: 'code' }, { label: 'Project', key: 'name' },
    { label: 'Track', key: 'track' }, { label: 'Project status', key: 'status' }, ...data.e2e.map((e) => ({ label: `${e.id} ${e.name}`, csv: (r) => r.cells[e.id].status })),
  ], data.rows);
  const multiOrg = new Set((data?.rows || []).map((r) => r.org_id)).size > 1;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Portfolio')} title={t('Portfolio overview')}
        subtitle={t('Rows are projects, columns are the end-to-end processes; each cell shows where the project stands in that process.')} />
      <Card style={{ marginBottom: 16 }}>
        <CardHead title={t('Scope')} subtitle={t('Choose a group, one organization, or a set of projects. Only what your permissions allow is listed.')} />
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <ScopeFilters scope={scope.data} value={sc} onChange={(v) => { setSc(v); setPicked([]); }} withProject={false} />
          <Select aria-label={t('Add a project to the set')} value="" onChange={(e) => e.target.value && setPicked((x) => [...new Set([...x, e.target.value])])} placeholder={t('Add a project to the set')} style={{ width: 'auto', maxWidth: 300 }}
            options={projectsInScope.filter((p) => !picked.includes(String(p.id))).map((p) => ({ value: String(p.id), label: `${p.code} ${p.name}` }))} />
          <Select aria-label={t('Track')} value={track} onChange={(e) => setTrack(e.target.value)} placeholder={t('All tracks')} options={['Full', 'Light', 'Fast'].map((s) => ({ value: s, label: t(`${s} Track`) }))} style={{ width: 'auto' }} />
        </div>
        {picked.length > 0 && (
          <div className="chips" style={{ marginTop: 8 }}>
            {picked.map((id) => { const p = scope.data.projects.find((x) => String(x.id) === id); return <span key={id} className="chip row" style={{ gap: 4 }}>{p?.code}<IconButton size="sm" icon={X} label={t('Remove {p}', { p: p?.code })} onClick={() => setPicked((x) => x.filter((y) => y !== id))} /></span>; })}
          </div>
        )}
      </Card>
      {!data ? <Skeleton h={500} /> : (
        <>
          <div className="grid kpis" style={{ marginBottom: 16 }}>
            <Kpi value={data.rows.length} label={t('Projects in scope')} />
            <Kpi value={new Set(data.rows.map((r) => r.org_id)).size} label={t('Organizations')} neutral />
            <Kpi value={data.rows.reduce((s, r) => s + Object.values(r.cells).filter((c) => c.status === 'At gate').length, 0)} label={t('Waiting for a gate decision')} neutral />
            <Kpi value={data.rows.reduce((s, r) => s + Object.values(r.cells).filter((c) => c.status === 'On hold' || c.status === 'Stopped').length, 0)} label={t('On hold or stopped')} neutral />
          </div>
          <Card>
            <CardHead title={t('Projects × end-to-end processes')} actions={<button type="button" className="btn btn-secondary btn-sm" onClick={exportCsv}>{t('Export CSV')}</button>} />
            <div className="legend pm-legend" aria-label={t('Legend')}>
              {data.legend.map((l) => <span key={l.key} title={t(l.description)}><i className={`pm-cell ${l.tone}`} aria-hidden>{ABBR[l.key]}</i>{t(l.key)}</span>)}
            </div>
            <div className="table-wrap pm-wrap">
              <table className="data pm">
                <thead><tr>
                  <th className="pm-sticky">{t('Project')}</th>
                  {data.e2e.map((e) => <th key={e.id} className="pm-col" title={`${e.id} ${t(e.name)}`}><div>{e.id}</div><div className="xs pm-sub">{t(e.name)}</div>{e.gate && <div className="xs pm-sub">{t('Gate')} {e.gate}</div>}</th>)}
                </tr></thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="pm-sticky">
                        <button type="button" className="link-button strong" onClick={() => open(r)}>{r.code}</button> <span className="small">{r.name}</span>
                        <div className="xs muted">{multiOrg ? `${r.org_name} · ` : ''}{t(`${r.track} Track`)} · <StatusBadge value={r.status} /></div>
                      </td>
                      {data.e2e.map((e) => { const c = r.cells[e.id]; return (
                        <td key={e.id} className="pm-td"><span className={`pm-cell ${data.legend.find((l) => l.key === c.status)?.tone}`} title={`${r.code} · ${e.id}: ${t(c.status)}${c.runs > 1 ? ` (${t('{n} runs', { n: c.runs })})` : ''}`}>
                          {ABBR[c.status]}{c.runs > 1 && <sup>×{c.runs}</sup>}<span className="sr-only">{t(c.status)}</span></span></td>
                      ); })}
                    </tr>
                  ))}
                  {!data.rows.length && <tr><td colSpan={10} className="muted">{t('No project in this scope.')}</td></tr>}
                </tbody>
                <tfoot><tr>
                  <td className="pm-sticky strong">{t('Completed')} / {t('In progress')}</td>
                  {data.e2e.map((e) => <td key={e.id} className="xs num">{data.totals[e.id].Completed} / {data.totals[e.id]['In progress'] + data.totals[e.id]['At gate']}</td>)}
                </tr></tfoot>
              </table>
            </div>
            <p className="chart-caption">{t('Hover a cell for details. ×2 means the process ran twice (for example after a Recycle decision or a relaunch).')}</p>
          </Card>
        </>
      )}
    </div>
  );
}
