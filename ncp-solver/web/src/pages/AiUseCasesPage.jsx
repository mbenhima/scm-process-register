import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

const EMPTY = {
  title: '', description: '', business_function: 'quality', ai_technique: 'rag',
  maturity_stage: 1, status: 'idea', expected_impact: '', estimated_roi: '', tags: '',
  inputs: '', prompt: '', expected_output: '', constraints_guardrails: '', model_technique_notes: '',
};
const MATURITY_COLORS = { 1: 'bg-status-red', 2: 'bg-status-amber', 3: 'bg-status-yellow', 4: 'bg-status-green', 5: 'bg-status-darkgreen' };

export default function AiUseCasesPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);

  function load() { api.get('/ai-use-cases').then(setRows).catch(() => {}); }
  useEffect(load, []);

  async function create(form) {
    await api.post('/ai-use-cases', form);
    setModal(null);
    load();
  }

  async function toggleActive(e, row) {
    e.preventDefault();
    e.stopPropagation();
    await api.put(`/ai-use-cases/${row.id}`, { is_active: row.is_active ? 0 : 1 });
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
          <Link key={r.id} to={`/ai-use-cases/${r.id}`}>
            <Card className={`h-full hover:shadow-lg transition-shadow cursor-pointer ${!r.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className={`h-3 w-3 rounded-full mt-1 ${MATURITY_COLORS[r.maturity_stage] || 'bg-grey-line'}`} title={`Maturity ${r.maturity_stage}/5`} />
                <div className="flex items-center gap-2">
                  <span className="badge bg-grey-light text-grey-ink">{t(`aiUseCase.status.${r.status}`)}</span>
                  {!r.is_active && <span className="badge bg-grey-line text-grey-medium">{t('aiUseCase.inactive')}</span>}
                  {hasPermission('aiUseCase.edit') && (
                    <button
                      onClick={(e) => toggleActive(e, r)}
                      title={r.is_active ? t('aiUseCase.deactivate') : t('aiUseCase.activate')}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${r.is_active ? 'bg-orange' : 'bg-grey-line'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${r.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  )}
                </div>
              </div>
              <div className="font-title font-bold text-grey-dark">{r.title}</div>
              <div className="text-xs text-grey-medium mb-2">{r.business_function} · {r.ai_technique}</div>
              <p className="text-sm text-grey-ink">{r.description}</p>
              {r.current_version_number && (
                <div className="mt-3 text-[11px] text-grey-medium">{t('aiUseCase.version')} {r.current_version_number} <span className="badge bg-orange-tint text-orange-deep ms-1">{t('aiUseCase.default')}</span></div>
              )}
            </Card>
          </Link>
        ))}
        {rows.length === 0 && <EmptyState message={t('common.noResults')} />}
      </div>

      {modal && <UseCaseForm initial={EMPTY} onSave={create} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function UseCaseForm({ initial, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open wide title={t('aiUseCase.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <div className="eyebrow mb-2">{t('aiUseCase.metadata')}</div>
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

        <div className="eyebrow mb-2 mt-4 border-t border-grey-line pt-3">{t('aiUseCase.currentVersion')} — {t('aiUseCase.version')} 1 ({t('aiUseCase.default')})</div>
        <Field label={t('aiUseCase.inputs')}><textarea className="input" value={form.inputs} onChange={set('inputs')} /></Field>
        <Field label={t('aiUseCase.prompt')}><textarea className="input" value={form.prompt} onChange={set('prompt')} /></Field>
        <Field label={t('aiUseCase.expectedOutput')}><textarea className="input" value={form.expected_output} onChange={set('expected_output')} /></Field>
        <Field label={t('aiUseCase.constraints')}><textarea className="input" value={form.constraints_guardrails} onChange={set('constraints_guardrails')} /></Field>
        <Field label={t('aiUseCase.modelNotes')}><textarea className="input" value={form.model_technique_notes} onChange={set('model_technique_notes')} /></Field>

        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.create')}</button>
        </div>
      </form>
    </Modal>
  );
}
