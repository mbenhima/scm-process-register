import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Lock } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, Skeleton, ErrorNote, StatusBadge, Button, Select, Progress, fmtNum, Badge, useToast } from '../components/ui.jsx';

// Scope filters shared by the project list and the portfolio overview: group, organization, projects.
// The options only contain what the user may see (own organization; its group with portfolio.group; all for a platform administrator).
export function ScopeFilters({ scope, value, onChange, withProject = true }) {
  const { t } = useI18n();
  if (!scope) return null;
  const orgs = scope.orgs.filter((o) => !value.group || (value.group === 'none' ? !o.group_id : String(o.group_id) === value.group));
  const projects = scope.projects.filter((p) => orgs.some((o) => o.id === p.org_id) && (!value.org || String(p.org_id) === value.org));
  return (
    <>
      {scope.orgs.length > 1 && (
        <Select aria-label={t('Group')} value={value.group} onChange={(e) => onChange({ group: e.target.value, org: '', project: '' })} placeholder={t('All groups')} style={{ width: 'auto' }}
          options={[...scope.groups.map((g) => ({ value: String(g.id), label: `${t('Group')}: ${g.name}` })), ...(scope.hasIndependent ? [{ value: 'none', label: t('No group (independent)') }] : [])]} />
      )}
      {scope.orgs.length > 1 && (
        <Select aria-label={t('Organization')} value={value.org} onChange={(e) => onChange({ ...value, org: e.target.value, project: '' })} placeholder={t('All organizations')} style={{ width: 'auto' }}
          options={orgs.map((o) => ({ value: String(o.id), label: o.name }))} />
      )}
      {withProject && (
        <Select aria-label={t('Project')} value={value.project} onChange={(e) => onChange({ ...value, project: e.target.value })} placeholder={t('All projects')} style={{ width: 'auto', maxWidth: 260 }}
          options={projects.map((p) => ({ value: String(p.id), label: `${p.code} ${p.name}` }))} />
      )}
    </>
  );
}

export const scopeQuery = (v) => new URLSearchParams(Object.entries({ group: v.group, org: v.org, projects: v.project }).filter(([, x]) => x)).toString();

export default function Projects() {
  const { can, me, switchOrg } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const [track, setTrack] = useState('');
  const [sc, setSc] = useState({ group: '', org: '', project: '' });
  const scope = useFetch('/portfolio/scope');
  const qs = useMemo(() => [scopeQuery(sc), status && `status=${status}`, track && `track=${track}`].filter(Boolean).join('&'), [sc, status, track]);
  const { data, error } = useFetch(`/portfolio/projects?${qs}`);
  const multi = (scope.data?.orgs.length || 0) > 1;
  const open = async (p) => {
    if (p.own) { nav(`/projects/${p.id}`); return; }
    if (me.user.isPlatformAdmin) { await switchOrg(p.org_id); nav(`/projects/${p.id}`); return; }
    toast.ok(t('{p} belongs to {o}. You can see it here and in the portfolio overview; only its organization can open it.', { p: p.code, o: p.org_name }));
  };
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Portfolio')} title={t('Innovation projects')}
        subtitle={data ? t('{n} projects. Each moves through the E2E processes of its track, gate by gate.', { n: data.length }) : ''}
        actions={can('project.create') && <Button variant="primary" icon={Plus} onClick={() => nav('/projects/new')}>{t('New project')}</Button>} />
      {multi && <p className="muted small" style={{ marginTop: -8 }}>{t('You can see the projects of {n} organizations. Projects of another organization are read-only.', { n: scope.data.orgs.length })}</p>}
      {!data ? <Skeleton h={400} /> : (
        <Card>
          <DataTable csvName="projects" rows={data} onRowClick={open}
            toolbar={<>
              <ScopeFilters scope={scope.data} value={sc} onChange={setSc} />
              <Select aria-label={t('Status')} value={status} onChange={(e) => setStatus(e.target.value)} placeholder={t('All statuses')} options={['Active', 'On Hold', 'Launched', 'Retired', 'Killed'].map((s) => ({ value: s, label: t(s) }))} style={{ width: 'auto' }} />
              <Select aria-label={t('Track')} value={track} onChange={(e) => setTrack(e.target.value)} placeholder={t('All tracks')} options={['Full', 'Light', 'Fast'].map((s) => ({ value: s, label: t(`${s} Track`) }))} style={{ width: 'auto' }} />
            </>}
            columns={[
              { key: 'code', label: t('Code'), render: (p) => <span className="row" style={{ gap: 4 }}>{p.code}{!p.own && <Lock size={12} aria-label={t('Read-only')} />}</span> },
              { key: 'name', label: t('Project'), render: (p) => <><div className="strong">{p.name}</div><div className="xs muted">{t(p.offer_type)} · {p.owner_name}</div></> },
              ...(multi ? [{ key: 'org_name', label: t('Organization'), render: (p) => <><div>{p.org_name}</div><div className="xs muted">{p.group_name ? `${t('Group')}: ${p.group_name}` : t('Independent')}</div></>, csv: (p) => p.org_name }] : []),
              { key: 'track', label: t('Track'), render: (p) => t(`${p.track} Track`) },
              { key: 'current_e2e', label: t('Current E2E'), csv: (p) => `${p.current_e2e} ${p.e2e_name}`, render: (p) => <><div>{p.current_e2e}</div><div className="xs muted">{t(p.e2e_name)}</div></> },
              { key: 'current_gate', label: t('Last gate passed'), render: (p) => p.current_gate || '—' },
              { key: 'status', label: t('Status'), render: (p) => <StatusBadge value={p.status} /> },
              { key: 'progress', label: t('Tasks done'), sortValue: (p) => p.progress, render: (p) => <div className="row" style={{ gap: 8 }}><Progress value={p.progress} label={t('Tasks done')} /><span className="xs num">{p.progress}%</span></div> },
              { key: 'overdue', label: t('Overdue'), num: true },
              { key: 'npv', label: t('NPV (kUSD)'), num: true, render: (p) => fmtNum(p.npv) },
            ]} />
          {multi && <div className="row" style={{ marginTop: 8 }}><Badge><Lock size={12} aria-hidden /> {t('Read-only: belongs to another organization')}</Badge></div>}
        </Card>
      )}
    </div>
  );
}
