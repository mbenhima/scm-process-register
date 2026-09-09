import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

const COSO_COMPONENTS = ['control_environment', 'risk_assessment', 'control_activities', 'information_communication', 'monitoring_activities'];
const CONTROL_TYPES = ['preventive', 'detective', 'corrective'];
const FREQUENCIES = ['continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annual'];
const EFFECTIVENESS = ['effective', 'partially_effective', 'ineffective', 'not_tested'];
const EFFECTIVENESS_COLOR = {
  effective: 'bg-status-green text-green-900',
  partially_effective: 'bg-status-amber text-amber-900',
  ineffective: 'bg-status-red text-red-800',
  not_tested: 'bg-grey-light text-grey-ink',
};

const EMPTY = {
  code: '', title: '', description: '', coso_component: 'control_activities', control_type: 'preventive',
  frequency: 'monthly', control_owner_id: '', effectiveness: 'not_tested', last_tested_date: '', next_test_date: '', evidence_notes: '',
};

export default function ControlsPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('');

  function load() { api.get('/controls').then(setRows).catch(() => {}); }
  useEffect(load, []);
  useEffect(() => { api.get('/users/directory').then(setUsers).catch(() => {}); }, []);

  async function save(form) {
    if (modal === 'new') await api.post('/controls', form);
    else await api.put(`/controls/${modal.id}`, form);
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/controls/${id}`);
    load();
  }

  const filtered = filter ? rows.filter((r) => r.coso_component === filter) : rows;
  const ownerName = (id) => { const u = users.find((x) => x.id === id); return u ? `${u.first_name} ${u.last_name}` : '—'; };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.grcGroup')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('control.title')}</h1>
        </div>
        {hasPermission('control.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('control.new')}</button>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${!filter ? 'bg-orange text-white border-orange' : 'bg-white text-grey-ink border-grey-line'}`}>{t('common.all')}</button>
        {COSO_COMPONENTS.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${filter === c ? 'bg-orange text-white border-orange' : 'bg-white text-grey-ink border-grey-line'}`}>
            {t(`control.cosoComponent.${c}`)}
          </button>
        ))}
      </div>

      <Card>
        <table className="w-full ncp-table">
          <thead>
            <tr>
              <th>{t('control.code')}</th><th>{t('common.name')}</th><th>{t('control.cosoComponent')}</th>
              <th>{t('control.controlType')}</th><th>{t('control.frequency')}</th><th>{t('control.effectiveness')}</th><th>{t('control.owner')}</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td className="max-w-xs">{c.title}</td>
                <td>{t(`control.cosoComponent.${c.coso_component}`)}</td>
                <td>{t(`control.controlType.${c.control_type}`)}</td>
                <td>{t(`control.frequency.${c.frequency}`)}</td>
                <td><span className={`badge ${EFFECTIVENESS_COLOR[c.effectiveness]}`}>{t(`control.effectiveness.${c.effectiveness}`)}</span></td>
                <td>{ownerName(c.control_owner_id)}</td>
                <td className="text-end whitespace-nowrap">
                  {hasPermission('control.edit') && <button onClick={() => setModal(c)} className="text-xs text-orange-deep font-semibold me-3">{t('common.edit')}</button>}
                  {hasPermission('control.delete') && <button onClick={() => remove(c.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState message={t('common.noResults')} />}
      </Card>

      {modal && <ControlForm initial={modal === 'new' ? EMPTY : modal} users={users} onSave={save} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function ControlForm({ initial, users, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open wide title={initial.id ? t('common.edit') : t('control.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('control.code')}><input className="input" value={form.code} onChange={set('code')} required /></Field>
          <Field label={t('common.name')}><input className="input" value={form.title} onChange={set('title')} required /></Field>
        </div>
        <Field label={t('common.description')}><textarea className="input" value={form.description || ''} onChange={set('description')} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t('control.cosoComponent')}>
            <select className="input" value={form.coso_component} onChange={set('coso_component')}>
              {COSO_COMPONENTS.map((v) => <option key={v} value={v}>{t(`control.cosoComponent.${v}`)}</option>)}
            </select>
          </Field>
          <Field label={t('control.controlType')}>
            <select className="input" value={form.control_type} onChange={set('control_type')}>
              {CONTROL_TYPES.map((v) => <option key={v} value={v}>{t(`control.controlType.${v}`)}</option>)}
            </select>
          </Field>
          <Field label={t('control.frequency')}>
            <select className="input" value={form.frequency} onChange={set('frequency')}>
              {FREQUENCIES.map((v) => <option key={v} value={v}>{t(`control.frequency.${v}`)}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t('control.owner')}>
            <select className="input" value={form.control_owner_id || ''} onChange={set('control_owner_id')}>
              <option value="">—</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
            </select>
          </Field>
          <Field label={t('control.effectiveness')}>
            <select className="input" value={form.effectiveness} onChange={set('effectiveness')}>
              {EFFECTIVENESS.map((v) => <option key={v} value={v}>{t(`control.effectiveness.${v}`)}</option>)}
            </select>
          </Field>
          <Field label={t('control.nextTest')}>
            <input className="input" type="date" value={form.next_test_date || ''} onChange={set('next_test_date')} />
          </Field>
        </div>
        <Field label={t('control.evidence')}><textarea className="input" value={form.evidence_notes || ''} onChange={set('evidence_notes')} /></Field>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
