import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

const EMPTY = { code: '', title: '', description: '', version: '1.0', is_active: 1, effective_date: '' };

export default function StandardsPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null); // null | 'new' | row

  function load() { api.get('/standards').then(setRows).catch(() => {}); }
  useEffect(load, []);

  async function save(form) {
    if (modal === 'new') await api.post('/standards', form);
    else await api.put(`/standards/${modal.id}`, form);
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/standards/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.standards')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('standards.title')}</h1>
        </div>
        {hasPermission('standard.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('standards.new')}</button>}
      </div>

      <Card>
        <table className="w-full ncp-table">
          <thead><tr><th>{t('standards.code')}</th><th>{t('common.name')}</th><th>{t('standards.version')}</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td>
                <td>{r.title}</td>
                <td>{r.version}</td>
                <td className="text-end">
                  {hasPermission('standard.edit') && <button onClick={() => setModal(r)} className="text-xs text-orange-deep font-semibold me-3">{t('common.edit')}</button>}
                  {hasPermission('standard.delete') && <button onClick={() => remove(r.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState message={t('common.noResults')} />}
      </Card>

      {modal && <StandardForm initial={modal === 'new' ? EMPTY : modal} onSave={save} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function StandardForm({ initial, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  return (
    <Modal open title={initial.id ? t('common.edit') : t('standards.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label={t('standards.code')}><input className="input" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required /></Field>
        <Field label={t('common.name')}><input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></Field>
        <Field label={t('common.description')}><textarea className="input" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <Field label={t('standards.version')}><input className="input" value={form.version || ''} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} /></Field>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
