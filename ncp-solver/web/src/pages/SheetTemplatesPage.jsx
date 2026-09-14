import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

const EMPTY = {
  title: '', description: '', problem_type: '', default_criticality: 'medium', default_priority: 3,
  title_template: '', description_template: '', is_active: 1,
};

export default function SheetTemplatesPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);

  function load() { api.get('/sheet-templates').then(setRows).catch(() => {}); }
  useEffect(load, []);

  async function save(form) {
    if (modal === 'new') await api.post('/sheet-templates', form);
    else await api.put(`/sheet-templates/${modal.id}`, form);
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/sheet-templates/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.sheetTemplates')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('sheetTemplate.title')}</h1>
          <p className="text-sm text-grey-ink mt-1 max-w-2xl">{t('sheetTemplate.intro')}</p>
        </div>
        {hasPermission('sheetTemplate.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('sheetTemplate.new')}</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <Card key={r.id} className={!r.is_active ? 'opacity-60' : ''}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-grey-medium font-semibold">{r.problem_type || '—'}</div>
                <div className="font-title font-bold text-grey-dark">{r.title}</div>
              </div>
              {!r.is_active && <span className="badge bg-grey-line text-grey-medium">{t('common.inactive')}</span>}
            </div>
            <p className="text-sm text-grey-ink mt-1">{r.description}</p>
            <div className="mt-2 text-xs text-grey-ink bg-grey-light rounded p-2">
              <div className="font-semibold text-grey-dark">{r.title_template}</div>
              <div className="mt-1">{r.description_template}</div>
            </div>
            {(hasPermission('sheetTemplate.edit') || hasPermission('sheetTemplate.delete')) && (
              <div className="mt-3 flex gap-3">
                {hasPermission('sheetTemplate.edit') && <button onClick={() => setModal(r)} className="text-xs text-orange-deep font-semibold">{t('common.edit')}</button>}
                {hasPermission('sheetTemplate.delete') && <button onClick={() => remove(r.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
              </div>
            )}
          </Card>
        ))}
        {rows.length === 0 && <EmptyState message={t('common.noResults')} />}
      </div>

      {modal && <TemplateForm initial={modal === 'new' ? EMPTY : modal} onSave={save} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function TemplateForm({ initial, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open wide title={initial.id ? t('common.edit') : t('sheetTemplate.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('common.name')}><input className="input" value={form.title} onChange={set('title')} required /></Field>
          <Field label={t('sheetTemplate.problemType')}><input className="input" value={form.problem_type || ''} onChange={set('problem_type')} /></Field>
        </div>
        <Field label={t('sheetTemplate.whenToUse')}><textarea className="input" rows={2} value={form.description || ''} onChange={set('description')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('fiche.criticality')}>
            <select className="input" value={form.default_criticality} onChange={set('default_criticality')}>
              <option value="high">{t('fiche.criticality.high')}</option>
              <option value="medium">{t('fiche.criticality.medium')}</option>
              <option value="low">{t('fiche.criticality.low')}</option>
            </select>
          </Field>
          <Field label={t('fiche.priority')}>
            <select className="input" value={form.default_priority} onChange={set('default_priority')}>
              <option value={1}>P1</option><option value={2}>P2</option><option value={3}>P3</option>
            </select>
          </Field>
        </div>
        <Field label={t('sheetTemplate.titleTemplate')}><input className="input" value={form.title_template} onChange={set('title_template')} required /></Field>
        <Field label={t('sheetTemplate.descriptionTemplate')}><textarea className="input" rows={4} value={form.description_template} onChange={set('description_template')} required /></Field>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
