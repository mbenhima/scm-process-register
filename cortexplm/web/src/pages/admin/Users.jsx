import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '../../lib/i18n.jsx';
import { post, put, del } from '../../lib/api.js';
import { PageHeader, Card, DataTable, useFetch, Skeleton, Button, Modal, Field, Input, Select, Check, useToast, Badge, ErrorNote, fmtDate } from '../../components/ui.jsx';

export default function Users() {
  const { t } = useI18n();
  const toast = useToast();
  const users = useFetch('/users');
  const roles = useFetch('/roles');
  const obs = useFetch('/obs');
  const lic = useFetch('/licence');
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState(null);
  if (users.error) return <div className="page"><PageHeader eyebrow={t('Administration')} title={t('Users')} /><ErrorNote error={users.error} /></div>;
  if (!users.data || !roles.data) return <div className="page"><Skeleton h={400} /></div>;
  const roleName = Object.fromEntries(roles.data.map((r) => [r.id, r.name]));
  const save = async () => {
    setErr(null);
    try { if (edit.id) await put(`/users/${edit.id}`, edit); else await post('/users', edit); toast.ok(t('Saved.')); setEdit(null); users.reload(); lic.reload(); } catch (e) { setErr(e); }
  };
  return (
    <div className="page">
      <PageHeader eyebrow={t('Administration')} title={t('Users & roles')} subtitle={lic.data ? t('{u} of {m} licences used.', { u: lic.data.seatsUsed, m: lic.data.maxUsers }) : ''}
        actions={<Button variant="primary" icon={Plus} onClick={() => { setErr(null); setEdit({ name: '', email: '', password: '', roles: [], language: '' }); }}>{t('Add user')}</Button>} />
      <Card>
        <DataTable csvName="users" rows={users.data} onRowClick={(u) => { setErr(null); setEdit({ ...u, password: '' }); }} columns={[
          { key: 'name', label: t('Name'), render: (u) => <><div className="strong">{u.name}</div><div className="xs muted">{u.email}</div></> }, { key: 'title', label: t('Title'), render: (u) => t(u.title) },
          { key: 'roles', label: t('Roles'), csv: (u) => u.roles.join(' '), render: (u) => <div className="row" style={{ gap: 4 }}>{u.roles.map((r) => <Badge key={r}>{r} {t(roleName[r])}</Badge>)}</div> },
          { key: 'language', label: t('Language'), render: (u) => u.language || t('Organization default') }, { key: 'active', label: t('Active'), render: (u) => (u.active ? t('Yes') : t('No')) },
          { key: 'last_login', label: t('Last sign-in'), render: (u) => fmtDate(u.last_login) },
        ]} />
      </Card>
      {edit && (
        <Modal wide title={edit.id ? t('Edit user') : t('Add user')} onClose={() => setEdit(null)} footer={<>
          {edit.id && <Button variant="danger" onClick={async () => { if (!window.confirm(t('Delete this user?'))) return; try { await del(`/users/${edit.id}`); setEdit(null); users.reload(); } catch (e) { toast.err(e); } }}>{t('Delete')}</Button>}
          <div className="grow" /><Button onClick={() => setEdit(null)}>{t('Cancel')}</Button><Button variant="primary" onClick={save}>{t('Save')}</Button></>}>
          <div className="form-grid">
            <Field label={t('Name')} required><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label={t('E-mail')} required><Input type="email" value={edit.email} disabled={!!edit.id} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label={edit.id ? t('New password (optional)') : t('Password')} required={!edit.id} hint={t('At least 8 characters.')}><Input type="password" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></Field>
            <Field label={t('Title')}><Input value={edit.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label={t('Language')}><Select value={edit.language || ''} onChange={(e) => setEdit({ ...edit, language: e.target.value })} placeholder={t('Organization default')} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} /></Field>
            <Field label={t('Department (OBS)')}><Select value={edit.obs_node_id || ''} onChange={(e) => setEdit({ ...edit, obs_node_id: e.target.value })} placeholder={t('None')} options={(obs.data || []).map((n) => ({ value: n.id, label: n.name }))} /></Field>
            {edit.id && <Check label={t('Active account')} checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />}
            <Field label={t('Roles')} full>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 4 }}>
                {roles.data.map((r) => <Check key={r.id} label={`${r.id} ${t(r.name)}`} checked={edit.roles.includes(r.id)} onChange={(e) => setEdit({ ...edit, roles: e.target.checked ? [...edit.roles, r.id] : edit.roles.filter((x) => x !== r.id) })} />)}
              </div>
            </Field>
          </div>
          <ErrorNote error={err} />
        </Modal>
      )}
    </div>
  );
}
