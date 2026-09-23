import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { post, put, del } from '../../lib/api.js';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, Button, Modal, Field, Input, Select, useToast, Tabs, Badge } from '../../components/ui.jsx';

const INDUSTRIES = ['Public Sector', 'Manufacturing in Construction', 'Healthcare', 'Agro-Business - Dairy Products', 'Transportation', 'Oil, Gas & Energy', 'Construction'];

function Obs() {
  const { t } = useI18n();
  const toast = useToast();
  const { data: all, reload } = useFetch('/obs');
  const projects = useFetch('/projects');
  const [edit, setEdit] = useState(null);
  const [scope, setScope] = useState('');
  if (!all) return <Skeleton />;
  const data = all.filter((n) => String(n.project_id || '') === String(scope));
  const byParent = (pid) => data.filter((n) => (n.parent_id || null) === pid);
  const rows = [];
  const walk = (pid, depth) => byParent(pid).forEach((n) => { rows.push({ ...n, depth }); walk(n.id, depth + 1); });
  walk(null, 0);
  const save = async () => { try { if (edit.id) await put(`/obs/${edit.id}`, edit); else await post('/obs', edit); toast.ok(t('Saved.')); setEdit(null); reload(); } catch (e) { toast.err(e); } };
  return (
    <Card>
      <CardHead title={t('Organizational breakdown structure')} subtitle={t('Sites, departments and teams. Counts show linked records so ownership is visible at a glance.')} actions={<Button variant="primary" icon={Plus} onClick={() => setEdit({ name: '', type: 'Department', parent_id: '', project_id: scope || null })}>{t('Add node')}</Button>} />
      <div style={{ maxWidth: 420, marginBottom: 12 }}><Field label={t('Tree')} hint={t('Each organization has its own tree; a project can also have its own team tree.')}>
        <Select value={scope} onChange={(e) => setScope(e.target.value)} placeholder={t('Organization tree')} options={(projects.data || []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}${all.some((n) => n.project_id === p.id) ? '' : ` (${t('empty')})`}` }))} />
      </Field></div>
      <DataTable csvName="obs" rows={rows} pageSize={80} onRowClick={setEdit} columns={[
        { key: 'name', label: t('Node'), render: (n) => <span style={{ paddingInlineStart: n.depth * 20 }} className={n.depth ? '' : 'strong'}>{n.name}</span> }, { key: 'type', label: t('Type'), render: (n) => t(n.type) },
        ...['users', 'projects', 'rules', 'controls', 'risks', 'racsi', 'bpmn', 'rex'].map((k) => ({ key: k, label: t(k === 'racsi' ? 'RACSI' : k === 'bpmn' ? 'BPMN' : k === 'rex' ? 'REX' : k.charAt(0).toUpperCase() + k.slice(1)), num: true, csv: (n) => n.linked[k], sortValue: (n) => n.linked[k], render: (n) => n.linked[k] || '·' })),
      ]} />
      {edit && (
        <Modal title={edit.id ? t('Edit node') : t('Add node')} onClose={() => setEdit(null)} footer={<>
          {edit.id && <Button variant="danger" onClick={async () => { try { await del(`/obs/${edit.id}`); toast.ok(t('Node deleted; children moved up one level.')); setEdit(null); reload(); } catch (e) { toast.err(e); } }}>{t('Delete')}</Button>}
          <div className="grow" /><Button onClick={() => setEdit(null)}>{t('Cancel')}</Button><Button variant="primary" onClick={save} disabled={!edit.name}>{t('Save')}</Button></>}>
          <div className="form-grid">
            <Field label={t('Name')} required full><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label={t('Type')} hint={t('Choose a type or type your own.')}><Input list="obs-types" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })} /><datalist id="obs-types">{['Site', 'Department', 'Team', 'Service', 'Work package'].map((v) => <option key={v} value={v}>{t(v)}</option>)}</datalist></Field>
            <Field label={t('Parent')}><Select value={edit.parent_id || ''} onChange={(e) => setEdit({ ...edit, parent_id: e.target.value })} placeholder={t('Top level')} options={data.filter((n) => n.id !== edit.id).map((n) => ({ value: n.id, label: n.name }))} /></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export default function Organizations() {
  const { t } = useI18n();
  const { me } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('orgs');
  const orgs = useFetch('/organizations');
  const groups = useFetch('/groups');
  const [edit, setEdit] = useState(null);
  const [g, setG] = useState(null);
  const admin = me.user.isPlatformAdmin;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Administration')} title={t('Organizations & OBS')} subtitle={t('Groups contain organizations; each organization is an isolated tenant with its own projects, users and data.')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'orgs', label: t('Organizations') }, { value: 'groups', label: t('Groups') }, { value: 'obs', label: t('OBS of {o}', { o: me.organization.name }) }]} />
      {tab === 'orgs' && (orgs.data ? (
        <Card>
          <DataTable csvName="organizations" rows={orgs.data} onRowClick={setEdit} toolbar={admin && <Button variant="primary" icon={Plus} onClick={() => setEdit({ name: '', industry: INDUSTRIES[0], country: '', default_language: 'en', subscription_id: 'PACK-01' })}>{t('Add organization')}</Button>} columns={[
            { key: 'uid', label: t('ID') }, { key: 'name', label: t('Organization'), render: (o) => <span className="strong">{o.name}</span> }, { key: 'industry', label: t('Industry'), render: (o) => t(o.industry) },
            { key: 'group_name', label: t('Group'), render: (o) => o.group_name || <Badge>{t('Independent')}</Badge> }, { key: 'country', label: t('Country') }, { key: 'subscription', label: t('Subscription') },
            { key: 'projects', label: t('Projects'), num: true }, { key: 'users', label: t('Users'), num: true }, { key: 'default_language', label: t('Default language') },
          ]} />
        </Card>) : <Skeleton />)}
      {tab === 'groups' && (groups.data ? (
        <Card><DataTable csvName="groups" rows={groups.data} onRowClick={setG} toolbar={<Button variant="primary" icon={Plus} onClick={() => setG({ name: '', description: '' })}>{t('Add group')}</Button>}
          columns={[{ key: 'name', label: t('Group') }, { key: 'description', label: t('Description') }, { key: 'orgs', label: t('Organizations'), num: true }]} />
          <p className="muted" style={{ marginTop: 12 }}>{t('Deleting a group keeps its organizations; they become independent.')}</p></Card>) : <Skeleton />)}
      {tab === 'obs' && <Obs />}
      {edit && (
        <Modal title={edit.id ? t('Edit organization') : t('Add organization')} onClose={() => setEdit(null)} footer={<>
          {edit.id && admin && <Button variant="danger" onClick={async () => { if (!window.confirm(t('Delete this organization with all its projects, users and data?'))) return; try { await del(`/organizations/${edit.id}`); setEdit(null); orgs.reload(); } catch (e) { toast.err(e); } }}>{t('Delete')}</Button>}
          <div className="grow" /><Button onClick={() => setEdit(null)}>{t('Cancel')}</Button>
          <Button variant="primary" onClick={async () => { try { if (edit.id) await put(`/organizations/${edit.id}`, edit); else await post('/organizations', edit); toast.ok(t('Saved.')); setEdit(null); orgs.reload(); } catch (e) { toast.err(e); } }}>{t('Save')}</Button></>}>
          <div className="form-grid">
            <Field label={t('Name')} required full><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label={t('Industry')}><Select value={edit.industry} onChange={(e) => setEdit({ ...edit, industry: e.target.value })} options={INDUSTRIES.map((i) => ({ value: i, label: t(i) }))} /></Field>
            <Field label={t('Country')}><Input value={edit.country || ''} onChange={(e) => setEdit({ ...edit, country: e.target.value })} /></Field>
            <Field label={t('Group')}><Select value={edit.group_id || ''} onChange={(e) => setEdit({ ...edit, group_id: e.target.value })} placeholder={t('Independent')} options={(groups.data || []).map((x) => ({ value: x.id, label: x.name }))} /></Field>
            <Field label={t('Default language')}><Select value={edit.default_language} onChange={(e) => setEdit({ ...edit, default_language: e.target.value })} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} /></Field>
            {!edit.id && <Field label={t('Initial subscription')}><Input value={edit.subscription_id} onChange={(e) => setEdit({ ...edit, subscription_id: e.target.value })} /></Field>}
          </div>
        </Modal>
      )}
      {g && (
        <Modal title={g.id ? t('Edit group') : t('Add group')} onClose={() => setG(null)} footer={<>
          {g.id && <Button variant="danger" onClick={async () => { await del(`/groups/${g.id}`); setG(null); groups.reload(); orgs.reload(); }}>{t('Delete')}</Button>}
          <div className="grow" /><Button onClick={() => setG(null)}>{t('Cancel')}</Button>
          <Button variant="primary" disabled={!g.name} onClick={async () => { try { if (g.id) await put(`/groups/${g.id}`, g); else await post('/groups', g); setG(null); groups.reload(); } catch (e) { toast.err(e); } }}>{t('Save')}</Button></>}>
          <div className="form-grid"><Field label={t('Name')} required full><Input value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} /></Field><Field label={t('Description')} full><Input value={g.description || ''} onChange={(e) => setG({ ...g, description: e.target.value })} /></Field></div>
        </Modal>
      )}
    </div>
  );
}
