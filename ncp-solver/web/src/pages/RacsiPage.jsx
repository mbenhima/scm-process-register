import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

const MODULE_REFS = ['ncp_process', 'business_rule', 'control', 'risk_opportunity', 'general'];
const NCP_STAGES = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'];
const RACSI_TYPES = ['R', 'A', 'C', 'S', 'I'];
const RACSI_COLOR = {
  A: 'bg-orange text-white', R: 'bg-overlayBlue/15 text-overlayBlue', C: 'bg-status-amber text-amber-900',
  S: 'bg-status-green text-green-900', I: 'bg-grey-light text-grey-ink',
};

const EMPTY = { code: '', title: '', description: '', module_ref: 'ncp_process', ncp_stage: 'E1', linked_record_id: '', obs_node_id: '' };

const LINKED_LIST_ENDPOINT = { business_rule: '/business-rules', control: '/controls', risk_opportunity: '/risks' };

export default function RacsiPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [obsFlat, setObsFlat] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('');

  function load() { api.get('/racsi').then(setRows).catch(() => {}); }
  useEffect(load, []);
  useEffect(() => {
    api.get('/obs').then((d) => setObsFlat(d.flat)).catch(() => {});
    api.get('/users/directory').then(setUsers).catch(() => {});
    api.get('/roles/directory').then(setRoles).catch(() => {});
  }, []);

  const obsName = (id) => obsFlat.find((n) => n.id === id)?.name || '—';

  async function save(form) {
    const body = { ...form, linked_record_id: form.linked_record_id || null, ncp_stage: form.module_ref === 'ncp_process' ? form.ncp_stage : null };
    if (modal === 'new') await api.post('/racsi', body);
    else await api.put(`/racsi/${modal.id}`, body);
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/racsi/${id}`);
    load();
  }

  const filtered = filter ? rows.filter((r) => r.module_ref === filter) : rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.grcGroup')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('racsi.title')}</h1>
          <p className="text-xs text-grey-ink italic mt-0.5">{t('racsi.subtitle')}</p>
        </div>
        {hasPermission('racsi.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('racsi.new')}</button>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${!filter ? 'bg-orange text-white border-orange' : 'bg-white text-grey-ink border-grey-line'}`}>{t('common.all')}</button>
        {MODULE_REFS.map((m) => (
          <button key={m} onClick={() => setFilter(m)} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${filter === m ? 'bg-orange text-white border-orange' : 'bg-white text-grey-ink border-grey-line'}`}>
            {t(`racsi.moduleRef.${m}`)}
          </button>
        ))}
      </div>

      <p className="text-xs text-grey-medium italic">{t('racsi.legend')}</p>

      <div className="grid gap-3">
        {filtered.map((a) => (
          <ActivityCard
            key={a.id} activity={a} obsName={obsName} users={users} roles={roles}
            canEdit={hasPermission('racsi.edit')} canDelete={hasPermission('racsi.delete')}
            onEdit={() => setModal(a)} onDelete={() => remove(a.id)} onChanged={load} t={t}
          />
        ))}
        {filtered.length === 0 && <EmptyState message={t('common.noResults')} />}
      </div>

      {modal && (
        <ActivityForm
          initial={modal === 'new' ? EMPTY : modal} obsFlat={obsFlat} onSave={save} onClose={() => setModal(null)} t={t}
        />
      )}
    </div>
  );
}

function ActivityCard({ activity, obsName, users, roles, canEdit, canDelete, onEdit, onDelete, onChanged, t }) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ kind: 'role', role_id: '', user_id: '', racsi_type: 'R' });

  const byType = Object.fromEntries(RACSI_TYPES.map((rt) => [rt, activity.assignments.filter((x) => x.racsi_type === rt)]));
  const hasAccountable = byType.A.length > 0;

  function assigneeLabel(a) {
    if (a.role_id) return a.role_name;
    return `${a.first_name} ${a.last_name}`;
  }

  async function addAssignment(e) {
    e.preventDefault();
    setError('');
    const body = { racsi_type: form.racsi_type, role_id: form.kind === 'role' ? form.role_id : null, user_id: form.kind === 'user' ? form.user_id : null };
    try {
      await api.post(`/racsi/${activity.id}/assignments`, body);
      setForm({ kind: 'role', role_id: '', user_id: '', racsi_type: 'R' });
      onChanged();
    } catch (err) {
      setError(err.data?.error === 'accountable_already_assigned' ? t('racsi.accountableExists') : (err.message || 'error'));
    }
  }
  async function removeAssignment(id) {
    await api.del(`/racsi/${activity.id}/assignments/${id}`);
    onChanged();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-grey-medium font-semibold">
            {activity.code} · {t(`racsi.moduleRef.${activity.module_ref}`)}
            {activity.ncp_stage ? ` · ${activity.ncp_stage}` : ''} · {t('common.obsUnit')}: {obsName(activity.obs_node_id)}
          </div>
          <div className="font-title font-bold text-grey-dark">{activity.title}</div>
          {activity.description && <p className="text-sm text-grey-ink mt-1">{activity.description}</p>}
          {activity.linked_record_label && (
            <div className="text-xs text-grey-medium mt-1"><span className="font-semibold">{t('racsi.linkedRecord')}:</span> {activity.linked_record_label}</div>
          )}
        </div>
        <div className="flex gap-3 whitespace-nowrap">
          {canEdit && <button onClick={onEdit} className="text-xs text-orange-deep font-semibold">{t('common.edit')}</button>}
          {canDelete && <button onClick={onDelete} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
        {RACSI_TYPES.map((rt) => (
          <div key={rt} className="border border-grey-line rounded-md p-2">
            <div className={`badge ${RACSI_COLOR[rt]} mb-1`}>{rt} — {t(`racsi.type.${rt}`)}</div>
            <div className="flex flex-wrap gap-1">
              {byType[rt].map((a) => (
                <span key={a.id} className="text-[11px] bg-grey-light text-grey-ink rounded px-1.5 py-0.5 flex items-center gap-1">
                  {assigneeLabel(a)}
                  {canEdit && <button onClick={() => removeAssignment(a.id)} className="text-grey-medium hover:text-red-600">×</button>}
                </span>
              ))}
              {byType[rt].length === 0 && <span className="text-[11px] text-grey-medium italic">{t('racsi.noAssignments')}</span>}
            </div>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="mt-3 border-t border-grey-line pt-2">
          <button onClick={() => setExpanded((v) => !v)} className="text-xs text-orange-deep font-semibold">
            + {t('racsi.addAssignment')}
          </button>
          {expanded && (
            <form onSubmit={addAssignment} className="flex flex-wrap items-end gap-2 mt-2">
              <div>
                <div className="label">{t('racsi.assigneeKind')}</div>
                <select className="input" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value, role_id: '', user_id: '' }))}>
                  <option value="role">{t('racsi.assigneeKind.role')}</option>
                  <option value="user">{t('racsi.assigneeKind.user')}</option>
                </select>
              </div>
              {form.kind === 'role' ? (
                <div>
                  <div className="label">{t('racsi.assigneeKind.role')}</div>
                  <select className="input" value={form.role_id} onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))} required>
                    <option value="">{t('racsi.selectRole')}</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <div className="label">{t('racsi.assigneeKind.user')}</div>
                  <select className="input" value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))} required>
                    <option value="">{t('racsi.selectPerson')}</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <div className="label">{t('racsi.racsiType')}</div>
                <select className="input" value={form.racsi_type} onChange={(e) => setForm((f) => ({ ...f, racsi_type: e.target.value }))}>
                  {RACSI_TYPES.map((rt) => <option key={rt} value={rt} disabled={rt === 'A' && hasAccountable}>{rt} — {t(`racsi.type.${rt}`)}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-secondary !py-1.5 !px-3 text-xs">{t('common.add')}</button>
            </form>
          )}
          {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
        </div>
      )}
    </Card>
  );
}

function ActivityForm({ initial, obsFlat, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const [linkedOptions, setLinkedOptions] = useState([]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const endpoint = LINKED_LIST_ENDPOINT[form.module_ref];
    if (!endpoint) { setLinkedOptions([]); return; }
    api.get(endpoint).then(setLinkedOptions).catch(() => setLinkedOptions([]));
  }, [form.module_ref]);

  return (
    <Modal open wide title={initial.id ? t('common.edit') : t('racsi.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('racsi.code')}><input className="input" value={form.code} onChange={set('code')} required /></Field>
          <Field label={t('common.name')}><input className="input" value={form.title} onChange={set('title')} required /></Field>
        </div>
        <Field label={t('common.description')}><textarea className="input" value={form.description || ''} onChange={set('description')} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t('racsi.moduleRef')}>
            <select className="input" value={form.module_ref} onChange={set('module_ref')}>
              {MODULE_REFS.map((v) => <option key={v} value={v}>{t(`racsi.moduleRef.${v}`)}</option>)}
            </select>
          </Field>
          {form.module_ref === 'ncp_process' && (
            <Field label={t('racsi.ncpStage')}>
              <select className="input" value={form.ncp_stage || 'E1'} onChange={set('ncp_stage')}>
                {NCP_STAGES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
          )}
          {LINKED_LIST_ENDPOINT[form.module_ref] && (
            <Field label={t('racsi.linkedRecord')}>
              <select className="input" value={form.linked_record_id || ''} onChange={set('linked_record_id')}>
                <option value="">{t('racsi.noLinkedRecord')}</option>
                {linkedOptions.map((o) => <option key={o.id} value={o.id}>{o.code} — {o.title}</option>)}
              </select>
            </Field>
          )}
          <Field label={t('common.obsUnit')}>
            <select className="input" value={form.obs_node_id || ''} onChange={set('obs_node_id')}>
              <option value="">—</option>
              {obsFlat.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
