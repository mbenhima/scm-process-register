import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

const EMPTY = { first_name: '', last_name: '', email: '', password: '', language_preference: 'en', role_codes: [] };

export default function UsersPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modal, setModal] = useState(null);

  function load() {
    api.get('/users').then(setRows).catch(() => {});
    api.get('/roles').then(setRoles).catch(() => {});
  }
  useEffect(load, []);

  async function save(form) {
    if (modal === 'new') await api.post('/users', form);
    else {
      await api.put(`/users/${modal.id}`, form);
      await api.put(`/users/${modal.id}/roles`, { role_codes: form.role_codes });
    }
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/users/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.users')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('users.title')}</h1>
        </div>
        {hasPermission('user.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('users.new')}</button>}
      </div>
      <Card>
        <table className="w-full ncp-table">
          <thead><tr><th>{t('common.name')}</th><th>{t('auth.email')}</th><th>{t('users.roles')}</th><th>{t('users.active')}</th><th></th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.roles.map((r) => r.name).join(', ')}</td>
                <td>{u.is_active ? '✓' : '—'}</td>
                <td className="text-end">
                  {hasPermission('user.edit') && (
                    <button onClick={() => setModal({ ...u, password: '', role_codes: u.roles.map((r) => r.code) })} className="text-xs text-orange-deep font-semibold me-3">{t('common.edit')}</button>
                  )}
                  {hasPermission('user.delete') && <button onClick={() => remove(u.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState message={t('common.noResults')} />}
      </Card>
      {modal && <UserForm initial={modal === 'new' ? EMPTY : modal} roles={roles} onSave={save} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function UserForm({ initial, roles, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function toggleRole(code) {
    setForm((f) => ({ ...f, role_codes: f.role_codes.includes(code) ? f.role_codes.filter((c) => c !== code) : [...f.role_codes, code] }));
  }
  return (
    <Modal open wide title={initial.id ? t('common.edit') : t('users.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('users.firstName')}><input className="input" value={form.first_name} onChange={set('first_name')} required /></Field>
          <Field label={t('users.lastName')}><input className="input" value={form.last_name} onChange={set('last_name')} required /></Field>
        </div>
        {!initial.id && (
          <>
            <Field label={t('auth.email')}><input className="input" type="email" value={form.email} onChange={set('email')} required /></Field>
            <Field label={t('auth.password')}><input className="input" type="password" value={form.password} onChange={set('password')} required /></Field>
          </>
        )}
        <Field label={t('users.language')}>
          <select className="input" value={form.language_preference} onChange={set('language_preference')}>
            <option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option>
          </select>
        </Field>
        <Field label={t('users.roles')}>
          <div className="grid grid-cols-2 gap-1">
            {roles.map((r) => (
              <label key={r.code} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.role_codes.includes(r.code)} onChange={() => toggleRole(r.code)} />
                {r.name}
              </label>
            ))}
          </div>
        </Field>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
