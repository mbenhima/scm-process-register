import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, StatusBadge, EmptyState } from '../components/ui.jsx';

const CATEGORIES = ['strategic', 'operational', 'compliance', 'financial', 'reputational', 'technology'];
const STATUSES = ['identified', 'assessing', 'mitigating', 'monitoring', 'closed'];
const LEVELS = [1, 2, 3, 4, 5];

function bandColor(score) {
  if (score >= 15) return '#F4C7C3';
  if (score >= 10) return '#FBE0B5';
  if (score >= 6) return '#FFF3B0';
  if (score >= 3) return '#D9EAD3';
  return '#B6D7A8';
}

const EMPTY = {
  code: '', title: '', description: '', item_type: 'risk', category: 'operational',
  likelihood: 3, impact: 3, response_strategy: '', mitigation_plan: '', status: 'identified',
  residual_likelihood: '', residual_impact: '', target_date: '', control_ids: [], obs_node_id: '',
};

function RiskMatrix({ risks, t }) {
  const cells = {};
  for (const r of risks.filter((x) => x.item_type === 'risk')) {
    const key = `${r.likelihood}-${r.impact}`;
    cells[key] = cells[key] || [];
    cells[key].push(r);
  }
  return (
    <Card title={t('risk.matrix')}>
      <div className="flex">
        <div className="flex flex-col-reverse justify-between mr-2 text-[10px] text-grey-medium font-semibold" style={{ height: '260px' }}>
          {LEVELS.map((l) => <div key={l} className="flex-1 flex items-center">{l}</div>)}
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-1" style={{ height: '260px' }}>
            {[5, 4, 3, 2, 1].map((impact) => (
              LEVELS.map((likelihood) => {
                const key = `${likelihood}-${impact}`;
                const items = cells[key] || [];
                return (
                  <div key={key} className="rounded-md p-1 flex flex-wrap content-start gap-1 overflow-hidden" style={{ background: bandColor(likelihood * impact) }}>
                    {items.map((it) => (
                      <span key={it.id} title={it.title} className="text-[10px] font-bold text-grey-dark bg-white/70 rounded px-1">{it.code}</span>
                    ))}
                  </div>
                );
              })
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-grey-medium font-semibold mt-1">
            {LEVELS.map((l) => <div key={l} className="flex-1 text-center">{l}</div>)}
          </div>
          <div className="text-center text-[11px] text-grey-medium font-semibold mt-1">{t('risk.likelihood')}</div>
        </div>
      </div>
    </Card>
  );
}

export default function RisksPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [controls, setControls] = useState([]);
  const [obsFlat, setObsFlat] = useState([]);
  const [modal, setModal] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  function load() { api.get('/risks').then(setRows).catch(() => {}); }
  useEffect(load, []);
  useEffect(() => { api.get('/controls').then(setControls).catch(() => {}); }, []);
  useEffect(() => { api.get('/obs').then((d) => setObsFlat(d.flat)).catch(() => {}); }, []);
  const obsName = (id) => obsFlat.find((n) => n.id === id)?.name || '—';

  async function openEdit(row) {
    const full = await api.get(`/risks/${row.id}`);
    setModal({ ...full, control_ids: full.controls.map((c) => c.id) });
  }
  async function save(form) {
    if (modal === 'new') await api.post('/risks', form);
    else await api.put(`/risks/${modal.id}`, form);
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/risks/${id}`);
    load();
  }

  const filtered = typeFilter ? rows.filter((r) => r.item_type === typeFilter) : rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.grcGroup')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('risk.title')}</h1>
        </div>
        {hasPermission('riskOpportunity.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('risk.new')}</button>}
      </div>

      <RiskMatrix risks={rows} t={t} />

      <div className="flex gap-2">
        {['', 'risk', 'opportunity'].map((v) => (
          <button key={v} onClick={() => setTypeFilter(v)} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${typeFilter === v ? 'bg-orange text-white border-orange' : 'bg-white text-grey-ink border-grey-line'}`}>
            {v ? t(`risk.itemType.${v}`) : t('common.all')}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-grey-medium font-semibold">{r.code} · {t(`risk.category.${r.category}`)} · {t(`risk.itemType.${r.item_type}`)} · {t('common.obsUnit')}: {obsName(r.obs_node_id)}</div>
                <div className="font-title font-bold text-grey-dark">{r.title}</div>
                <p className="text-sm text-grey-ink mt-1">{r.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                <span className="badge bg-grey-light text-grey-ink">{t('risk.inherentScore')}: {r.inherent_score}</span>
                <StatusBadge value={r.status === 'closed' ? 'done' : 'in_progress'} label={t(`risk.status.${r.status}`)} />
              </div>
            </div>
            {r.mitigation_plan && <div className="mt-2 text-sm text-grey-ink"><span className="font-semibold text-grey-dark">{t('risk.mitigationPlan')}:</span> {r.mitigation_plan}</div>}
            {(hasPermission('riskOpportunity.edit') || hasPermission('riskOpportunity.delete')) && (
              <div className="mt-3 flex gap-3">
                {hasPermission('riskOpportunity.edit') && <button onClick={() => openEdit(r)} className="text-xs text-orange-deep font-semibold">{t('common.edit')}</button>}
                {hasPermission('riskOpportunity.delete') && <button onClick={() => remove(r.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
              </div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && <EmptyState message={t('common.noResults')} />}
      </div>

      {modal && <RiskForm initial={modal === 'new' ? EMPTY : modal} controls={controls} obsFlat={obsFlat} onSave={save} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function RiskForm({ initial, controls, obsFlat, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function toggleControl(id) {
    setForm((f) => ({ ...f, control_ids: f.control_ids.includes(id) ? f.control_ids.filter((c) => c !== id) : [...f.control_ids, id] }));
  }
  return (
    <Modal open wide title={initial.id ? t('common.edit') : t('risk.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('risk.code')}><input className="input" value={form.code} onChange={set('code')} required /></Field>
          <Field label={t('common.name')}><input className="input" value={form.title} onChange={set('title')} required /></Field>
        </div>
        <Field label={t('common.description')}><textarea className="input" value={form.description || ''} onChange={set('description')} /></Field>
        <div className="grid grid-cols-4 gap-3">
          <Field label={t('risk.itemType')}>
            <select className="input" value={form.item_type} onChange={set('item_type')}>
              {['risk', 'opportunity'].map((v) => <option key={v} value={v}>{t(`risk.itemType.${v}`)}</option>)}
            </select>
          </Field>
          <Field label={t('risk.category')}>
            <select className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((v) => <option key={v} value={v}>{t(`risk.category.${v}`)}</option>)}
            </select>
          </Field>
          <Field label={t('risk.likelihood')}>
            <select className="input" value={form.likelihood} onChange={set('likelihood')}>
              {LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label={t('risk.impact')}>
            <select className="input" value={form.impact} onChange={set('impact')}>
              {LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('risk.responseStrategy')}><input className="input" value={form.response_strategy || ''} onChange={set('response_strategy')} placeholder="avoid / reduce / transfer / accept / exploit / enhance" /></Field>
          <Field label={t('common.status')}>
            <select className="input" value={form.status} onChange={set('status')}>
              {STATUSES.map((v) => <option key={v} value={v}>{t(`risk.status.${v}`)}</option>)}
            </select>
          </Field>
        </div>
        <Field label={t('risk.mitigationPlan')}><textarea className="input" value={form.mitigation_plan || ''} onChange={set('mitigation_plan')} /></Field>
        <Field label={t('risk.linkedControls')}>
          <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border border-grey-line rounded-md p-2">
            {controls.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.control_ids.includes(c.id)} onChange={() => toggleControl(c.id)} />
                {c.code} — {c.title}
              </label>
            ))}
          </div>
        </Field>
        <Field label={t('common.obsUnit')}>
          <select className="input" value={form.obs_node_id || ''} onChange={set('obs_node_id')}>
            <option value="">—</option>
            {obsFlat.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
