// Tenancy: Group (Yes / No) > Organization > Projects, for every organization the user may see.
// A new project is always created inside one organization, chosen here or on the new-project form.
import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Plus, Building2, Boxes, FolderKanban, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { post } from '../lib/api.js';
import { PageHeader, Card, CardHead, Kpi, useFetch, Skeleton, ErrorNote, Button, Badge, StatusBadge, Modal, Field, Input, Select, Check, useToast, Segmented, SearchBox } from '../components/ui.jsx';

export const SECTORS = ['Public Sector', 'Manufacturing', 'Healthcare', 'Agro-Business - Dairy Products', 'Transportation', 'Oil, Gas & Energy', 'Real Estate Development'];

function ProjectList({ org, onOpen }) {
  const { t } = useI18n();
  if (!org.projects.length) return <p className="muted small">{t('No project yet.')}</p>;
  return (
    <div className="table-wrap"><table className="data compact">
      <thead><tr><th>{t('Code')}</th><th>{t('Project')}</th><th>{t('Offer type')}</th><th>{t('Track')}</th><th>{t('Current E2E')}</th><th>{t('Status')}</th></tr></thead>
      <tbody>{org.projects.map((p) => (
        <tr key={p.id}>
          <td className="nowrap">{org.own ? <Link to={`/projects/${p.id}`}>{p.code}</Link> : <button type="button" className="link-button" onClick={() => onOpen(org, p)}>{p.code}</button>}</td>
          <td>{p.name}</td><td>{t(p.offer_type)}</td><td className="nowrap">{t(`${p.track} Track`)}</td><td className="nowrap">{p.current_e2e}</td><td><StatusBadge value={p.status} /></td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

export default function Tenancy() {
  const { t } = useI18n();
  const { me, can, switchOrg } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { data, error, reload } = useFetch('/tenancy');
  const subs = useFetch(me.user.isPlatformAdmin ? '/subscriptions' : null);
  const [open, setOpen] = useState({});
  const [view, setView] = useState('tree');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null);
  const admin = me.user.isPlatformAdmin;
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  const allOrgs = [...data.groups.flatMap((g) => g.orgs), ...data.independent];
  const match = (o) => !q || `${o.name} ${o.industry} ${o.group_name || ''} ${o.projects.map((p) => `${p.code} ${p.name}`).join(' ')}`.toLowerCase().includes(q.toLowerCase());
  const toggle = (k) => setOpen((x) => ({ ...x, [k]: !x[k] }));
  const openForeign = async (org, p) => {
    if (!admin) { toast.ok(t('{p} belongs to {o}. You can see it here and in the portfolio overview; only its organization can open it.', { p: p.code, o: org.name })); return; }
    await switchOrg(org.id); nav(`/projects/${p.id}`);
  };
  const createIn = async (orgId) => {
    if (Number(orgId) !== me.organization.id) await switchOrg(orgId);
    nav('/projects/new');
  };
  const orgRow = (o) => (
    <Fragment key={o.id}>
      <tr className="tree-org">
        <td><button type="button" className="tree-toggle" aria-expanded={!!open[`o${o.id}`]} onClick={() => toggle(`o${o.id}`)}>{open[`o${o.id}`] ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}<Building2 size={16} aria-hidden /><span className="strong">{o.name}</span></button>{o.own && <Badge tone="accent">{t('You are here')}</Badge>}</td>
        <td>{t(o.industry)}</td><td>{o.country}</td><td className="num">{o.users}</td>
        <td className="num"><button type="button" className="link-button" onClick={() => toggle(`o${o.id}`)}>{o.projects.length}</button></td>
        <td><div className="row nowrap-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          {admin && !o.own && <Button size="sm" icon={ArrowRightLeft} onClick={() => switchOrg(o.id).then(reload)}>{t('Switch to')}</Button>}
          {can('project.create') && (admin || o.own) && <Button size="sm" icon={Plus} onClick={() => createIn(o.id)}>{t('Project')}</Button>}
        </div></td>
      </tr>
      {open[`o${o.id}`] && <tr className="tree-projects"><td colSpan={6}><ProjectList org={o} onOpen={openForeign} /></td></tr>}
    </Fragment>
  );
  return (
    <div className="page">
      <PageHeader eyebrow={t('Portfolio')} title={t('Groups, organizations & projects')}
        subtitle={t('Group (Yes / No) > Organization > Projects. An organization belongs to at most one group; every project belongs to exactly one organization.')}
        actions={<>
          {admin && <Button icon={Plus} onClick={() => setModal({ kind: 'group', name: '', description: '' })}>{t('Add group')}</Button>}
          {admin && <Button icon={Plus} onClick={() => setModal({ kind: 'org', name: '', industry: SECTORS[0], country: '', inGroup: 'no', group_id: '', default_language: 'en', subscription_id: 'BND-05', domain: '', starter_team: true, initial_password: '' })}>{t('Add organization')}</Button>}
          {can('project.create') && <Button variant="primary" icon={Plus} onClick={() => setModal({ kind: 'project', org_id: me.organization.id })}>{t('New project')}</Button>}
        </>} />
      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi value={data.totals.groups} label={t('Groups')} icon={Boxes} />
        <Kpi value={data.totals.orgs} label={t('Organizations')} meta={t('{a} in a group, {b} independent', { a: allOrgs.filter((o) => o.inGroup).length, b: data.independent.length })} icon={Building2} neutral />
        <Kpi value={data.totals.projects} label={t('Projects')} icon={FolderKanban} neutral />
        <Kpi neutral value={<span className="kpi-text">{t(data.scope === 'platform' ? 'All organizations' : data.scope === 'group' ? 'Your group' : 'Your organization')}</span>} label={t('What you can see')} />
      </div>
      <Card>
        <CardHead title={t('Tenancy')} subtitle={t('Open an organization to list its projects. Projects of other organizations are read-only.')}
          actions={<><SearchBox value={q} onChange={setQ} placeholder={t('Find an organization or a project')} /><Segmented label={t('View')} value={view} onChange={setView} options={[{ value: 'tree', label: t('Tree') }, { value: 'table', label: t('Table') }]} /></>} />
        {view === 'tree' ? (
          <div className="table-wrap"><table className="data tree">
            <thead><tr><th>{t('Group (Yes / No) > Organization')}</th><th>{t('Sector')}</th><th>{t('Country')}</th><th className="num">{t('Users')}</th><th className="num">{t('Projects')}</th><th /></tr></thead>
            <tbody>
              {data.groups.map((g) => {
                const orgs = g.orgs.filter(match);
                if (q && !orgs.length) return null;
                const k = `g${g.id}`; const shut = open[k] === false;
                return (
                  <Fragment key={g.id}>
                    <tr className="tree-group"><td colSpan={6}><button type="button" className="tree-toggle" aria-expanded={!shut} onClick={() => setOpen((x) => ({ ...x, [k]: shut }))}>{shut ? <ChevronRight size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}<Badge tone="s5">{t('Group: Yes')}</Badge><span className="strong">{g.name}</span><span className="muted small">{g.description}</span></button></td></tr>
                    {!shut && orgs.map(orgRow)}
                  </Fragment>
                );
              })}
              {data.independent.filter(match).length > 0 && (
                <>
                  <tr className="tree-group"><td colSpan={6}><span className="tree-toggle"><Badge>{t('Group: No')}</Badge><span className="strong">{t('Independent organizations')}</span></span></td></tr>
                  {data.independent.filter(match).map(orgRow)}
                </>
              )}
            </tbody>
          </table></div>
        ) : (
          <div className="table-wrap"><table className="data">
            <thead><tr><th>{t('Group (Yes / No)')}</th><th>{t('Group')}</th><th>{t('Organization')}</th><th>{t('Sector')}</th><th>{t('Projects')}</th></tr></thead>
            <tbody>{allOrgs.filter(match).map((o) => (
              <tr key={o.id}>
                <td><StatusBadge value={o.inGroup ? 'Yes' : 'No'} /></td><td>{o.group_name || '—'}</td><td className="strong">{o.name}</td><td>{t(o.industry)}</td>
                <td><div className="chips">{o.projects.map((p) => <span key={p.id} className="chip" title={p.name}>{p.code}</span>)}</div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      {modal?.kind === 'project' && (
        <Modal title={t('New project')} subtitle={t('Choose the organization the project belongs to. The project, its team and its data stay in that organization.')} onClose={() => setModal(null)}
          footer={<><Button onClick={() => setModal(null)}>{t('Cancel')}</Button><Button variant="primary" onClick={() => createIn(modal.org_id)}>{t('Continue')}</Button></>}>
          <div className="form-grid">
            <Field label={t('Organization')} full hint={admin ? t('As platform administrator you can create a project in any organization.') : t('You can create projects in your own organization.')}>
              <Select value={modal.org_id} disabled={!admin} onChange={(e) => setModal({ ...modal, org_id: e.target.value })} options={allOrgs.filter((o) => admin || o.own).map((o) => ({ value: o.id, label: `${o.name} (${o.group_name ? t('Group: {g}', { g: o.group_name }) : t('Independent')})` }))} />
            </Field>
          </div>
        </Modal>
      )}
      {modal?.kind === 'group' && (
        <Modal title={t('Add group')} onClose={() => setModal(null)} footer={<><Button onClick={() => setModal(null)}>{t('Cancel')}</Button>
          <Button variant="primary" disabled={!modal.name.trim()} onClick={async () => { try { await post('/groups', modal); toast.ok(t('Saved.')); setModal(null); reload(); } catch (e) { toast.err(e); } }}>{t('Save')}</Button></>}>
          <div className="form-grid">
            <Field label={t('Name')} required full><Input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></Field>
            <Field label={t('Description')} full><Input value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
      {modal?.kind === 'org' && (
        <Modal title={t('Add organization')} onClose={() => setModal(null)} footer={<><Button onClick={() => setModal(null)}>{t('Cancel')}</Button>
          <Button variant="primary" disabled={!modal.name.trim() || (modal.inGroup === 'yes' && !modal.group_id) || (modal.starter_team && (!modal.domain || modal.initial_password.length < 8))} onClick={async () => { try { const r = await post('/organizations', { ...modal, group_id: modal.inGroup === 'yes' ? modal.group_id : null }); toast.ok(r.users ? t('Organization created with {n} accounts.', { n: r.users }) : t('Saved.')); setModal(null); reload(); } catch (e) { toast.err(e); } }}>{t('Save')}</Button></>}>
          <div className="form-grid">
            <Field label={t('Belongs to a group?')} full><Segmented label={t('Belongs to a group?')} value={modal.inGroup} onChange={(v) => setModal({ ...modal, inGroup: v })} options={[{ value: 'yes', label: t('Yes') }, { value: 'no', label: t('No (independent)') }]} /></Field>
            {modal.inGroup === 'yes' && <Field label={t('Group')} required full><Select value={modal.group_id} onChange={(e) => setModal({ ...modal, group_id: e.target.value })} placeholder={t('Choose a group')} options={data.groups.map((g) => ({ value: g.id, label: g.name }))} /></Field>}
            <Field label={t('Name')} required full><Input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></Field>
            <Field label={t('Sector')}><Select value={modal.industry} onChange={(e) => setModal({ ...modal, industry: e.target.value })} options={SECTORS.map((s) => ({ value: s, label: t(s) }))} /></Field>
            <Field label={t('Country')}><Input value={modal.country} onChange={(e) => setModal({ ...modal, country: e.target.value })} /></Field>
            <Field label={t('Default language')}><Select value={modal.default_language} onChange={(e) => setModal({ ...modal, default_language: e.target.value })} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} /></Field>
            <Field label={t('Initial subscription')}><Select value={modal.subscription_id} onChange={(e) => setModal({ ...modal, subscription_id: e.target.value })} options={(subs.data || [{ id: modal.subscription_id, name: '' }]).map((x) => ({ value: x.id, label: `${x.id} ${x.name}` }))} /></Field>
            <Field full><Check label={t('Create the starting team: one account per standard role (24 people), placed in their departments')} checked={modal.starter_team} onChange={(e) => setModal({ ...modal, starter_team: e.target.checked })} /></Field>
            {modal.starter_team && <>
              <Field label={t('E-mail domain')} required hint={t('Accounts are created as role@domain, for example pm1@{d}.', { d: modal.domain || 'example.org' })}><Input value={modal.domain} placeholder="example.org" onChange={(e) => setModal({ ...modal, domain: e.target.value.trim().toLowerCase() })} /></Field>
              <Field label={t('Initial password')} required hint={t('At least 8 characters. Give it to the team; each person changes it in Settings.')}><Input type="password" autoComplete="new-password" value={modal.initial_password} onChange={(e) => setModal({ ...modal, initial_password: e.target.value })} /></Field>
            </>}
            <p className="small muted full" style={{ margin: 0 }}>{t('Every new organization also receives the standard content: OBS departments, business rules, controls, risks, RACSI, BPMN diagrams, the AI use case library, checklist templates and project templates.')}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
