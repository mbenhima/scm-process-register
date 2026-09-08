import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

function TreeNode({ node, depth = 0, onEdit, onDelete, canManage }) {
  return (
    <div>
      <div className="flex items-center justify-between py-1.5 border-b border-grey-line" style={{ paddingInlineStart: depth * 20 }}>
        <div className="flex items-center gap-2">
          <span className="badge bg-grey-light text-grey-ink">{node.node_type}</span>
          <span className="text-sm text-grey-dark font-medium">{node.name}</span>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => onEdit(node)} className="text-xs text-orange-deep font-semibold">edit</button>
            <button onClick={() => onDelete(node.id)} className="text-xs text-red-600 font-semibold">delete</button>
          </div>
        )}
      </div>
      {node.children?.map((c) => <TreeNode key={c.id} node={c} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} canManage={canManage} />)}
    </div>
  );
}

export default function ObsPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [data, setData] = useState(null);
  const [modal, setModal] = useState(null);

  function load() { api.get('/obs').then(setData).catch(() => {}); }
  useEffect(load, []);

  async function save(form) {
    if (modal === 'new') await api.post('/obs', form);
    else await api.put(`/obs/${modal.id}`, form);
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/obs/${id}`);
    load();
  }

  if (!data) return <EmptyState message={t('common.loading')} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.obs')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('obs.title')}</h1>
        </div>
        {hasPermission('obs.manage') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('obs.new')}</button>}
      </div>
      <Card>
        {data.tree.map((n) => <TreeNode key={n.id} node={n} onEdit={setModal} onDelete={remove} canManage={hasPermission('obs.manage')} />)}
        {data.tree.length === 0 && <EmptyState message={t('common.noResults')} />}
      </Card>
      {modal && (
        <ObsForm
          initial={modal === 'new' ? { node_type: 'department', name: '', parent_id: '' } : modal}
          flat={data.flat} onSave={save} onClose={() => setModal(null)} t={t}
        />
      )}
    </div>
  );
}

function ObsForm({ initial, flat, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  return (
    <Modal open title={t('obs.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label={t('common.name')}><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></Field>
        <Field label="Type">
          <select className="input" value={form.node_type} onChange={(e) => setForm((f) => ({ ...f, node_type: e.target.value }))}>
            <option value="site">{t('obs.site')}</option>
            <option value="department">{t('obs.department')}</option>
            <option value="service">{t('obs.service')}</option>
            <option value="team">{t('obs.team')}</option>
          </select>
        </Field>
        <Field label="Parent">
          <select className="input" value={form.parent_id || ''} onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value || null }))}>
            <option value="">—</option>
            {flat.filter((n) => n.id !== form.id).map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
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
