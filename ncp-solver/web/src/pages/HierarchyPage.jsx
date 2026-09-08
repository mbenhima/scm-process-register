import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

export default function HierarchyPage() {
  const { t } = useI18n();
  const { hasPermission, refresh } = useAuth();
  const [tree, setTree] = useState(null);
  const [orgModal, setOrgModal] = useState(false);
  const [projectModal, setProjectModal] = useState(null);

  function load() { api.get('/hierarchy/tree').then(setTree).catch(() => {}); }
  useEffect(load, []);

  if (!tree) return <EmptyState message={t('common.loading')} />;

  async function saveOrg(form) {
    await api.put('/hierarchy/organization', form);
    setOrgModal(false);
    load();
    refresh();
  }
  async function saveProject(form) {
    if (projectModal === 'new') await api.post('/hierarchy/projects', form);
    else await api.put(`/hierarchy/projects/${projectModal.id}`, form);
    setProjectModal(null);
    load();
  }
  async function deleteProject(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/hierarchy/projects/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.hierarchy')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('hierarchy.title')}</h1>
      </div>

      <Card title={t('hierarchy.group')}>
        {tree.hasGroup ? (
          <>
            <div className="font-semibold text-grey-dark mb-2">{tree.group.name}</div>
            <p className="text-sm text-grey-ink mb-3">{tree.group.description}</p>
            <div className="text-xs font-bold uppercase text-grey-medium mb-1">{t('hierarchy.siblingOrgs')}</div>
            <div className="flex flex-wrap gap-2">
              {tree.siblingOrganizations.map((o) => (
                <span key={o.id} className={`badge ${o.id === tree.organization.id ? 'bg-orange text-white' : 'bg-grey-light text-grey-ink'}`}>{o.name}</span>
              ))}
            </div>
          </>
        ) : <EmptyState message={t('hierarchy.noGroup')} />}
      </Card>

      <Card
        title={t('hierarchy.organization')}
        action={hasPermission('hierarchy.manage') && <button onClick={() => setOrgModal(true)} className="btn-secondary text-xs">{t('common.edit')}</button>}
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-grey-medium">{t('common.name')}:</span> {tree.organization.name}</div>
          <div><span className="text-grey-medium">Sector:</span> {t(`sector.${tree.organization.sector}`) || tree.organization.sector}</div>
          <div><span className="text-grey-medium">Country:</span> {tree.organization.country}</div>
          <div><span className="text-grey-medium">Type:</span> {tree.organization.sector_type}</div>
        </div>
      </Card>

      <Card
        title={t('hierarchy.project')}
        action={hasPermission('hierarchy.manage') && <button onClick={() => setProjectModal('new')} className="btn-secondary text-xs">+ {t('hierarchy.newProject')}</button>}
      >
        <table className="w-full ncp-table">
          <thead><tr><th>{t('common.name')}</th><th>{t('common.status')}</th><th></th></tr></thead>
          <tbody>
            {tree.projects.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td><td>{p.status}</td>
                <td className="text-end">
                  {hasPermission('hierarchy.manage') && (
                    <>
                      <button onClick={() => setProjectModal(p)} className="text-xs text-orange-deep font-semibold me-3">{t('common.edit')}</button>
                      <button onClick={() => deleteProject(p.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tree.projects.length === 0 && <EmptyState message={t('common.noResults')} />}
      </Card>

      {orgModal && <OrgForm initial={tree.organization} onSave={saveOrg} onClose={() => setOrgModal(false)} t={t} />}
      {projectModal && (
        <ProjectForm
          initial={projectModal === 'new' ? { name: '', description: '', status: 'active', start_date: '', end_date: '' } : projectModal}
          onSave={saveProject} onClose={() => setProjectModal(null)} t={t}
        />
      )}
    </div>
  );
}

function OrgForm({ initial, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  return (
    <Modal open title={t('hierarchy.organization')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label={t('common.name')}><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Country"><input className="input" value={form.country || ''} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></Field>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectForm({ initial, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  return (
    <Modal open title={t('hierarchy.newProject')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label={t('common.name')}><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></Field>
        <Field label={t('common.description')}><textarea className="input" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <Field label={t('common.status')}>
          <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="active">active</option><option value="on_hold">on_hold</option><option value="closed">closed</option>
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
