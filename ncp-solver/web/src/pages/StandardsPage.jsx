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
  const [expanded, setExpanded] = useState(null); // standard id whose requirements are shown
  const [requirements, setRequirements] = useState({}); // standardId -> rows[] (cached)
  const [loadingReq, setLoadingReq] = useState(null);

  function load() { api.get('/standards').then(setRows).catch(() => {}); }
  useEffect(load, []);

  async function toggleExpand(r) {
    if (expanded === r.id) { setExpanded(null); return; }
    setExpanded(r.id);
    if (!requirements[r.id]) {
      setLoadingReq(r.id);
      try {
        const reqs = await api.get(`/standard-requirements?standard_id=${r.id}`);
        setRequirements((m) => ({ ...m, [r.id]: reqs }));
      } finally { setLoadingReq(null); }
    }
  }

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
          <thead><tr><th>{t('standards.code')}</th><th>{t('common.name')}</th><th>{t('standards.domain')}</th><th>{t('common.status')}</th><th>{t('standards.version')}</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <React.Fragment key={r.id}>
                <tr>
                  <td>{r.code}</td>
                  <td>{r.title}</td>
                  <td className="text-grey-medium text-xs">{r.domain || '—'}</td>
                  <td>
                    <span className={`badge ${r.is_active ? 'bg-status-green text-green-900' : 'bg-grey-light text-grey-medium'}`}>
                      {r.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td>{r.version}</td>
                  <td className="text-end whitespace-nowrap">
                    <button onClick={() => toggleExpand(r)} className="text-xs text-orange-deep font-semibold me-3">
                      {expanded === r.id ? t('standards.hideRequirements') : t('standards.showRequirements')}
                    </button>
                    {hasPermission('standard.edit') && <button onClick={() => setModal(r)} className="text-xs text-orange-deep font-semibold me-3">{t('common.edit')}</button>}
                    {hasPermission('standard.delete') && <button onClick={() => remove(r.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr>
                    <td colSpan={6} className="bg-grey-light/50 !py-3">
                      {loadingReq === r.id && <div className="text-xs text-grey-medium">{t('common.loading')}</div>}
                      {loadingReq !== r.id && (requirements[r.id]?.length ? (
                        <div className="space-y-3">
                          <div className="text-[11px] font-bold uppercase tracking-widest text-grey-medium">{t('standards.requirements')}</div>
                          {requirements[r.id].map((req) => (
                            <div key={req.id} className="bg-white border border-grey-line rounded-md p-3">
                              <div className="flex items-baseline gap-2">
                                <span className="badge bg-orange-tint text-orange-deep shrink-0">{req.clause_code}</span>
                                <span className="font-semibold text-grey-dark text-sm">{req.title}</span>
                              </div>
                              <p className="text-sm text-grey-ink mt-1">{req.requirement_text}</p>
                              {req.example_nonconformity && (
                                <div className="mt-2 text-xs">
                                  <span className="font-semibold text-red-700">{t('standards.exampleNc')}: </span>
                                  <span className="text-grey-ink">{req.example_nonconformity}</span>
                                </div>
                              )}
                              {req.example_problem && (
                                <div className="mt-1 text-xs">
                                  <span className="font-semibold text-grey-dark">{t('standards.exampleProblem')}: </span>
                                  <span className="text-grey-ink italic">{req.example_problem}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState message={t('standards.noRequirements')} />)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
