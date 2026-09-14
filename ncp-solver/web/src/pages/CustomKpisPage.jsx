import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

const NCP_STAGES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
const EMPTY = { code: '', title: '', description: '', formula_desc: '', target_value: '', ncp_stage: '', is_active: 1 };

export default function CustomKpisPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);

  function load() { api.get('/custom-kpis').then(setRows).catch(() => {}); }
  useEffect(load, []);

  async function save(form) {
    if (modal === 'new') await api.post('/custom-kpis', form);
    else await api.put(`/custom-kpis/${modal.id}`, form);
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/custom-kpis/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.customKpis')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('customKpi.title')}</h1>
          <p className="text-sm text-grey-ink mt-1 max-w-2xl">{t('customKpi.intro')}</p>
        </div>
        {hasPermission('customKpi.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('customKpi.new')}</button>}
      </div>

      <Card>
        <table className="w-full ncp-table">
          <thead>
            <tr>
              <th>{t('customKpi.code')}</th><th>{t('common.name')}</th><th>{t('customKpi.formula')}</th>
              <th>{t('customKpi.target')}</th><th>{t('common.ncpStage')}</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k) => (
              <tr key={k.id} className={!k.is_active ? 'opacity-50' : ''}>
                <td>{k.code}</td>
                <td className="max-w-xs">{k.title}</td>
                <td className="text-xs text-grey-ink">{k.formula_desc}</td>
                <td>{k.target_value}</td>
                <td>{k.ncp_stage && <span className="badge bg-orange-tint text-orange-deep">{k.ncp_stage}</span>}</td>
                <td className="text-end whitespace-nowrap">
                  {hasPermission('customKpi.edit') && <button onClick={() => setModal(k)} className="text-xs text-orange-deep font-semibold me-3">{t('common.edit')}</button>}
                  {hasPermission('customKpi.delete') && <button onClick={() => remove(k.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState message={t('common.noResults')} />}
      </Card>

      {modal && <KpiForm initial={modal === 'new' ? EMPTY : modal} onSave={save} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function KpiForm({ initial, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open title={initial.id ? t('common.edit') : t('customKpi.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('customKpi.code')}><input className="input" value={form.code} onChange={set('code')} required /></Field>
          <Field label={t('common.name')}><input className="input" value={form.title} onChange={set('title')} required /></Field>
        </div>
        <Field label={t('common.description')}><textarea className="input" value={form.description || ''} onChange={set('description')} /></Field>
        <Field label={t('customKpi.formula')}><input className="input" value={form.formula_desc} onChange={set('formula_desc')} required placeholder="(A / B) x 100" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('customKpi.target')}><input className="input" value={form.target_value || ''} onChange={set('target_value')} placeholder=">= 85%" /></Field>
          <Field label={t('common.ncpStage')}>
            <select className="input" value={form.ncp_stage || ''} onChange={set('ncp_stage')}>
              <option value="">—</option>
              {NCP_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
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
