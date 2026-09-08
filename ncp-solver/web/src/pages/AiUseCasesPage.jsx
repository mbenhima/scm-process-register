import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

const EMPTY = {
  title: '', description: '', business_function: 'quality', ai_technique: 'rag',
  maturity_stage: 1, status: 'idea', expected_impact: '', estimated_roi: '', tags: '',
};
const MATURITY_COLORS = { 1: 'bg-status-red', 2: 'bg-status-amber', 3: 'bg-status-yellow', 4: 'bg-status-green', 5: 'bg-status-darkgreen' };

export default function AiUseCasesPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);

  function load() { api.get('/ai-use-cases').then(setRows).catch(() => {}); }
  useEffect(load, []);

  async function save(form) {
    if (modal === 'new') await api.post('/ai-use-cases', form);
    else await api.put(`/ai-use-cases/${modal.id}`, form);
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/ai-use-cases/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.aiUseCases')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('aiUseCase.title')}</h1>
        </div>
        {hasPermission('aiUseCase.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('aiUseCase.new')}</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between mb-2">
              <div className={`h-3 w-3 rounded-full mt-1 ${MATURITY_COLORS[r.maturity_stage] || 'bg-grey-line'}`} title={`Maturity ${r.maturity_stage}/5`} />
              <span className="badge bg-grey-light text-grey-ink">{t(`aiUseCase.status.${r.status}`)}</span>
            </div>
            <div className="font-title font-bold text-grey-dark">{r.title}</div>
            <div className="text-xs text-grey-medium mb-2">{r.business_function} · {r.ai_technique}</div>
            <p className="text-sm text-grey-ink">{r.description}</p>
            {(hasPermission('aiUseCase.edit') || hasPermission('aiUseCase.delete')) && (
              <div className="mt-3 flex gap-3">
                {hasPermission('aiUseCase.edit') && <button onClick={() => setModal(r)} className="text-xs text-orange-deep font-semibold">{t('common.edit')}</button>}
                {hasPermission('aiUseCase.delete') && <button onClick={() => remove(r.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
              </div>
            )}
          </Card>
        ))}
        {rows.length === 0 && <EmptyState message={t('common.noResults')} />}
      </div>

      {modal && <UseCaseForm initial={modal === 'new' ? EMPTY : modal} onSave={save} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function UseCaseForm({ initial, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open wide title={initial.id ? t('common.edit') : t('aiUseCase.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label={t('common.name')}><input className="input" value={form.title} onChange={set('title')} required /></Field>
        <Field label={t('common.description')}><textarea className="input" value={form.description} onChange={set('description')} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('aiUseCase.businessFunction')}>
            <select className="input" value={form.business_function} onChange={set('business_function')}>
              {['quality', 'maintenance', 'supply_chain', 'hr', 'finance', 'operations', 'customer_service'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label={t('aiUseCase.aiTechnique')}>
            <select className="input" value={form.ai_technique} onChange={set('ai_technique')}>
              {['predictive_analytics', 'nlp', 'computer_vision', 'rag', 'optimization', 'anomaly_detection'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label={t('aiUseCase.maturity')}>
            <select className="input" value={form.maturity_stage} onChange={set('maturity_stage')}>
              {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label={t('common.status')}>
            <select className="input" value={form.status} onChange={set('status')}>
              {['idea', 'pilot', 'production', 'retired'].map((v) => <option key={v} value={v}>{t(`aiUseCase.status.${v}`)}</option>)}
            </select>
          </Field>
        </div>
        <Field label={t('aiUseCase.expectedImpact')}><textarea className="input" value={form.expected_impact || ''} onChange={set('expected_impact')} /></Field>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
