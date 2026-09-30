import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ObsRoles from '../components/ObsRoles.jsx';
import { Plus, Building2, FolderTree } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Tabs, Table, tx, Modal, Field, Progress, IconBadge } from '../components/ui.jsx';

function Quota({ label, used, max }) {
  const { fmtNum } = useApp();
  return <div className="stack-8" style={{ gap: 4 }}><div className="row-between small"><span className="strong">{label}</span><span className="num muted">{fmtNum(used, 0)} / {fmtNum(max, 0)}</span></div><Progress value={(100 * used) / max} label={label} /></div>;
}

export default function Organization() {
  const { t, L, lang, project, me, tree, toast, can, setProjectId, fmtDate } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'profile');
  const orgId = project?.org?.id || me.org?.id;
  const org = useData(orgId ? `/orgs/${orgId}` : null);
  const obs = useData(tab === 'obs' && orgId ? `/orgs/${orgId}/obs` : null);
  const users = useData(tab === 'users' && orgId ? `/orgs/${orgId}/users` : null);
  const { data: roles } = useData('/roles');
  const [uf, setUf] = useState(null);
  const [nn, setNn] = useState(null);
  if (!orgId) return <Loading />;
  if (org.error) return <ErrorBox error={org.error} />;
  if (!org.data) return <Loading />;
  const o = org.data;
  const write = o.access === 'write';
  const saveUser = async () => {
    try { if (uf.id) await api(`/users/${uf.id}`, { method: 'PUT', body: { name: uf.name, roles: uf.roles, lang: uf.lang, status: uf.status } }); else await api(`/orgs/${orgId}/users`, { method: 'POST', body: uf }); toast(t('Saved.')); setUf(null); users.reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const addNode = async () => { try { await api(`/orgs/${orgId}/obs`, { method: 'POST', body: nn }); toast(t('Node added.')); setNn(null); obs.reload(); } catch (e) { toast(e.message, 'error'); } };
  const renderNode = (n, depth, nodes) => (
    <li key={n.id} style={{ paddingInlineStart: depth * 20 }}>
      <div className="row"><IconBadge icon={n.type === 'Project' ? FolderTree : Building2} size="sm" accent={n.type === 'Organization'} /><span className="strong small">{tx(n.name, lang)}</span><span className="tag outline">{L(n.type)}</span>{n.members.length > 0 && <span className="xsmall muted">{n.members.map(m => m.name).join(', ')}</span>}</div>
      <ul className="list" style={{ borderTop: 0 }}>{nodes.filter(c => c.parent_id === n.id).map(c => renderNode(c, depth + 1, nodes))}</ul>
    </li>
  );
  return (
    <>
      <PageHead eyebrow={o.group ? tx(o.group.name, lang) : t('Independent organization')} title={tx(o.name, lang)} subtitle={`${o.short_code} · ${o.sector} · ${L(o.size)}${o.sme_class ? ` (${L(o.sme_class)})` : ''} · ${o.employees} ${t('employees')} · ${tx(o.city, lang)}`}>{o.access === 'read' && <span className="tag s2" style={{ marginTop: 8 }}>{t('Read-only view of a group organization')}</span>}</PageHead>
      <Tabs label={t('Organization views')} value={tab} onChange={setTab} tabs={[{ id: 'profile', label: t('Profile and configuration') }, { id: 'projects', label: t('Projects'), count: o.projects.length }, { id: 'obs', label: t('Structure (OBS)') }, { id: 'roles', label: t('Roles and functions') }, { id: 'users', label: t('Users') }, { id: 'tenancy', label: t('Tenancy') }]} />
      {tab === 'profile' && (
        <div className="grid-main">
          <div className="stack">
            <Card title={t('Configuration')}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div><div className="xsmall muted">{t('Solution pack')}</div><div className="strong">{o.config.pack}</div></div>
                <div><div className="xsmall muted">{t('Industry packs')}</div><div className="strong">{o.config.industryPacks.join(', ') || '—'}</div></div>
                <div><div className="xsmall muted">{t('Capability packs')}</div><div className="strong">{o.config.capabilityPacks.join(', ') || '—'}</div></div>
                <div><div className="xsmall muted">{t('Add-ons')}</div><div className="strong">{o.config.addons.join(', ') || '—'}</div></div>
                <div><div className="xsmall muted">{t('Compliance & security standards')}</div><div className="strong">{o.config.complianceStandards.join(', ') || '—'}</div></div>
                <div><div className="xsmall muted">{t('AI tier')}</div><div className="strong">{o.config.aiTier}</div></div>
                <div><div className="xsmall muted">{t('Deployment')}</div><div className="strong">{o.config.deploymentMode}</div></div>
                <div><div className="xsmall muted">{t('Licensed macro processes')}</div><div className="strong">{o.entitledMps}</div></div>
              </div>
              <p className="small" style={{ marginTop: 16 }}>{t('Features')}: {o.config.features.join(' · ')}</p>
              {o.price && <p className="small"><span className="strong">{t('Monthly price')}: </span>{o.price.totalMonthly} USD ({t('bundle discount {b}%', { b: o.price.bundleDiscountPct })})</p>}
            </Card>
            {o.onboarding && (
              <Card title={t('SME onboarding')} action={<Status value={o.onboarding.status} />}>
                <p className="small">{t('Target {d} days · time to first value {v} days · {u} users activated', { d: o.onboarding.target_days, v: o.onboarding.metrics?.daysToFirstValue, u: o.onboarding.metrics?.usersActivated })}</p>
                <ol className="small">{(o.onboarding.steps || []).map(s => <li key={s.step}>{tx(s.name, lang)} <span className="muted">· {t('day {d}', { d: s.day })}</span></li>)}</ol>
              </Card>
            )}
          </div>
          <div className="stack">
            <Card title={t('Usage against quotas')}><div className="stack"><Quota label={t('Users')} used={o.usage.users} max={o.config.quotas.users} /><Quota label={t('Projects')} used={o.usage.projects} max={o.config.quotas.projects} /><Quota label={t('OBS nodes')} used={o.usage.obsNodes} max={o.config.quotas.obsNodes} /><Quota label={t('Custom AI use cases')} used={o.usage.customAi} max={o.config.quotas.customAi} /></div></Card>
            <Card title={t('Verticals')}>{o.verticals.length ? o.verticals.map(v => <div key={v.id} className="row small"><span className="tag s5">{v.vertical}</span><span className="muted">v{v.version} · {v.validation} · {fmtDate(v.activated_at)}</span></div>) : <p className="small muted">{t('No vertical activated; universal processes only.')}</p>}</Card>
            <Card title={t('Group benchmarking')}><p className="small">{o.benchmark_sharing ? t('This organization shares its aggregated metrics with its group.') : t('This organization does not share its metrics with its group.')}</p></Card>
          </div>
        </div>
      )}
      {tab === 'roles' && <ObsRoles orgId={orgId} write={write} />}
      {tab === 'projects' && <Table rows={o.projects} onRowClick={(p) => { setProjectId(p.id); navigate('/'); }} columns={[{ key: 'code', label: t('Code') }, { key: 'name', label: t('Project'), render: p => <span className="strong">{tx(p.name, lang)}</span> }, { key: 'ms_type', label: t('System') }, { key: 'mode', label: t('Mode'), render: p => L(p.mode) }, { key: 'track', label: t('Track'), render: p => (p.track ? L(p.track) : '—') }, { key: 'progress', label: t('Progress'), render: p => <div style={{ minWidth: 100 }}><Progress value={p.progress} /><span className="xsmall muted">{p.progress}%</span></div> }, { key: 'currentPhase', label: t('Current phase') }, { key: 'unreadAlerts', label: t('Unread alerts') }]} />}
      {tab === 'obs' && (obs.data ? (
        <Card title={t('Organizational breakdown structure')} action={can('obs.manage') && write && <button className="btn btn-sm" onClick={() => setNn({ name: '', type: 'Department', parentId: obs.data.find(n => !n.parent_id)?.id })}><Plus size={16} />{t('Add node')}</button>}>
          <ul className="list">{obs.data.filter(n => !n.parent_id).map(n => renderNode(n, 0, obs.data))}</ul>
        </Card>
      ) : <Loading />)}
      {tab === 'users' && (users.data ? (
        <>
          {can('users.manage') && write && <div className="row" style={{ marginBottom: 16 }}><button className="btn btn-primary" onClick={() => setUf({ name: '', email: '', roles: ['employee'], lang })}><Plus size={16} />{t('Add user')}</button></div>}
          <Table rows={users.data} onRowClick={can('users.manage') && write ? (u) => setUf({ ...u }) : undefined} columns={[{ key: 'name', label: t('Name'), render: u => <span className="strong">{u.name}</span> }, { key: 'email', label: t('Email') }, { key: 'roleNames', label: t('Roles'), render: u => (u.roleNames || []).map(r => tx(r, lang)).join(', ') }, { key: 'lang', label: t('Language'), render: u => u.lang?.toUpperCase() }, { key: 'status', label: t('Status'), render: u => <Status value={u.status} /> }, { key: 'last_login', label: t('Last sign-in'), render: u => fmtDate(u.last_login) }]} />
        </>
      ) : <Loading />)}
      {tab === 'tenancy' && (
        <div className="stack">
          <div className="callout neutral"><span>{t('New groups and organizations (member of a group or independent) are created in Administration > Groups and organizations.')} <Link to="/admin">{t('Open Administration')}</Link></span></div>
          {[...(tree?.groups || []).map(g => ({ key: g.id, title: tx(g.name, lang), orgs: g.orgs })), { key: 'ind', title: t('Independent organizations'), orgs: tree?.independent || [] }].filter(g => g.orgs.length).map(g => (
            <Card key={g.key} title={g.title}>
              <Table rows={g.orgs} columns={[{ key: 'code', label: t('Code'), width: 90 }, { key: 'name', label: t('Organization'), render: x => <span className="strong">{tx(x.name, lang)}</span> }, { key: 'sector', label: t('Vertical') }, { key: 'size', label: t('Size'), render: x => L(x.size) }, { key: 'projects', label: t('Projects'), render: x => x.projects.map(p => p.code).join(', ') }, { key: 'access', label: t('Access'), render: x => (x.access === 'write' ? t('Full') : t('Read-only')) }]} />
            </Card>
          ))}
        </div>
      )}
      {uf && (
        <Modal title={uf.id ? uf.name : t('Add user')} onClose={() => setUf(null)} footer={<><button className="btn" onClick={() => setUf(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!uf.name || (!uf.id && !uf.email) || !uf.roles?.length} onClick={saveUser}>{t('Save')}</button></>}>
          <div className="stack">
            <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={uf.name} onChange={e => setUf({ ...uf, name: e.target.value })} />}</Field>
            {!uf.id && <Field label={t('Email')} required hint={t('The initial password is the demonstration password; the user changes it in Settings.')}>{(id) => <input id={id} className="input" type="email" value={uf.email} onChange={e => setUf({ ...uf, email: e.target.value })} />}</Field>}
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="strong small" style={{ marginBottom: 8 }}>{t('Roles')}</legend>
              <div className="form-grid">{(roles || []).filter(r => r.code !== 'platform_admin').map(r => <label key={r.code} className="checkbox small"><input type="checkbox" checked={uf.roles.includes(r.code)} onChange={e => setUf({ ...uf, roles: e.target.checked ? [...uf.roles, r.code] : uf.roles.filter(x => x !== r.code) })} /><span>{tx(r.name, lang)}</span></label>)}</div>
            </fieldset>
            <div className="form-grid">
              <Field label={t('Language')}>{(id) => <select id={id} className="select" value={uf.lang || 'en'} onChange={e => setUf({ ...uf, lang: e.target.value })}><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select>}</Field>
              {uf.id && <Field label={t('Status')}>{(id) => <select id={id} className="select" value={uf.status} onChange={e => setUf({ ...uf, status: e.target.value })}><option value="Active">{L('Active')}</option><option value="Disabled">{L('Disabled')}</option></select>}</Field>}
            </div>
          </div>
        </Modal>
      )}
      {nn && (
        <Modal title={t('Add node')} onClose={() => setNn(null)} footer={<><button className="btn" onClick={() => setNn(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nn.name} onClick={addNode}>{t('Save')}</button></>}>
          <div className="stack">
            <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={nn.name} onChange={e => setNn({ ...nn, name: e.target.value })} />}</Field>
            <div className="form-grid">
              <Field label={t('Type')}>{(id) => <select id={id} className="select" value={nn.type} onChange={e => setNn({ ...nn, type: e.target.value })}>{['Site', 'Department'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
              <Field label={t('Parent')}>{(id) => <select id={id} className="select" value={nn.parentId} onChange={e => setNn({ ...nn, parentId: e.target.value })}>{obs.data.filter(n => n.type !== 'Project').map(n => <option key={n.id} value={n.id}>{tx(n.name, lang)}</option>)}</select>}</Field>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
