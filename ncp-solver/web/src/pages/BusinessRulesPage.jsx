import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, StatusBadge, EmptyState } from '../components/ui.jsx';

const RULE_TYPES = ['validation', 'workflow', 'approval', 'naming', 'threshold', 'escalation'];
const MODULES = ['fiche', 'action', 'rootcause', 'rex', 'standard', 'general'];
const SEVERITIES = ['blocking', 'warning', 'info'];
const SEVERITY_BADGE = { blocking: 'not_effective', warning: 'pending', info: 'to_do' };

const EMPTY = { code: '', title: '', rule_type: 'workflow', applies_to_module: 'fiche', condition_text: '', action_text: '', severity: 'warning', obs_node_id: '' };

export default function BusinessRulesPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [obsFlat, setObsFlat] = useState([]);
  const [modal, setModal] = useState(null);

  function load() { api.get('/business-rules').then(setRows).catch(() => {}); }
  useEffect(load, []);
  useEffect(() => { api.get('/obs').then((d) => setObsFlat(d.flat)).catch(() => {}); }, []);
  const obsName = (id) => obsFlat.find((n) => n.id === id)?.name || '—';

  async function save(form) {
    if (modal === 'new') await api.post('/business-rules', form);
    else await api.put(`/business-rules/${modal.id}`, form);
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/business-rules/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.grcGroup')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('businessRule.title')}</h1>
        </div>
        {hasPermission('businessRule.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('businessRule.new')}</button>}
      </div>

      <div className="grid gap-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-grey-medium font-semibold">{r.code} · {t(`businessRule.ruleType.${r.rule_type}`)} · {r.applies_to_module} · {t('common.obsUnit')}: {obsName(r.obs_node_id)}</div>
                <div className="font-title font-bold text-grey-dark">{r.title}</div>
              </div>
              <StatusBadge value={SEVERITY_BADGE[r.severity]} label={t(`businessRule.severity.${r.severity}`)} />
            </div>
            <div className="mt-2 text-sm text-grey-ink space-y-1">
              <div><span className="font-semibold text-grey-dark">{t('businessRule.condition')}:</span> {r.condition_text}</div>
              <div><span className="font-semibold text-grey-dark">{t('businessRule.actionText')}:</span> {r.action_text}</div>
            </div>
            {(hasPermission('businessRule.edit') || hasPermission('businessRule.delete')) && (
              <div className="mt-3 flex gap-3">
                {hasPermission('businessRule.edit') && <button onClick={() => setModal(r)} className="text-xs text-orange-deep font-semibold">{t('common.edit')}</button>}
                {hasPermission('businessRule.delete') && <button onClick={() => remove(r.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
              </div>
            )}
          </Card>
        ))}
        {rows.length === 0 && <EmptyState message={t('common.noResults')} />}
      </div>

      {modal && <RuleForm initial={modal === 'new' ? EMPTY : modal} obsFlat={obsFlat} onSave={save} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function RuleForm({ initial, obsFlat, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open wide title={initial.id ? t('common.edit') : t('businessRule.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('businessRule.code')}><input className="input" value={form.code} onChange={set('code')} required /></Field>
          <Field label={t('common.name')}><input className="input" value={form.title} onChange={set('title')} required /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t('businessRule.ruleType')}>
            <select className="input" value={form.rule_type} onChange={set('rule_type')}>
              {RULE_TYPES.map((v) => <option key={v} value={v}>{t(`businessRule.ruleType.${v}`)}</option>)}
            </select>
          </Field>
          <Field label={t('businessRule.appliesTo')}>
            <select className="input" value={form.applies_to_module} onChange={set('applies_to_module')}>
              {MODULES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label={t('businessRule.severity')}>
            <select className="input" value={form.severity} onChange={set('severity')}>
              {SEVERITIES.map((v) => <option key={v} value={v}>{t(`businessRule.severity.${v}`)}</option>)}
            </select>
          </Field>
        </div>
        <Field label={t('businessRule.condition')}><textarea className="input" value={form.condition_text || ''} onChange={set('condition_text')} /></Field>
        <Field label={t('businessRule.actionText')}><textarea className="input" value={form.action_text || ''} onChange={set('action_text')} /></Field>
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
