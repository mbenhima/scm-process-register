import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, Modal, EmptyState } from '../components/ui.jsx';

const EMPTY_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://ncpsolver.demo/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <omgdc:Bounds x="150" y="150" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`;

const EMPTY = { code: '', title: '', description: '', obs_node_id: '' };

export default function BpmnPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [obsFlat, setObsFlat] = useState([]);
  const [modal, setModal] = useState(null);

  function load() { api.get('/bpmn').then(setRows).catch(() => {}); }
  useEffect(load, []);
  useEffect(() => { api.get('/obs').then((d) => setObsFlat(d.flat)).catch(() => {}); }, []);
  const obsName = (id) => obsFlat.find((n) => n.id === id)?.name || '—';

  async function create(form) {
    await api.post('/bpmn', { ...form, xml: EMPTY_BPMN_XML });
    setModal(null);
    load();
  }
  async function remove(id) {
    if (!confirm(t('common.confirm'))) return;
    await api.del(`/bpmn/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{t('nav.grcGroup')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('bpmn.title')}</h1>
          <p className="text-xs text-grey-ink italic mt-0.5">{t('bpmn.subtitle')}</p>
        </div>
        {hasPermission('bpmn.create') && <button onClick={() => setModal('new')} className="btn-primary">+ {t('bpmn.new')}</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <Card key={r.id} className="h-full">
            <div className="text-xs text-grey-medium font-semibold">{r.code} · {t('common.obsUnit')}: {obsName(r.obs_node_id)}</div>
            <div className="font-title font-bold text-grey-dark mt-1">{r.title}</div>
            {r.description && <p className="text-sm text-grey-ink mt-1">{r.description}</p>}
            <div className="flex items-center justify-between mt-4">
              <Link to={`/bpmn/${r.id}`} className="btn-secondary !py-1.5 !px-3 text-xs">
                {hasPermission('bpmn.edit') ? t('bpmn.openEditor') : t('bpmn.viewDiagram')}
              </Link>
              {hasPermission('bpmn.delete') && <button onClick={() => remove(r.id)} className="text-xs text-red-600 font-semibold">{t('common.delete')}</button>}
            </div>
          </Card>
        ))}
        {rows.length === 0 && <EmptyState message={t('common.noResults')} />}
      </div>

      {modal && <BpmnForm initial={EMPTY} obsFlat={obsFlat} onSave={create} onClose={() => setModal(null)} t={t} />}
    </div>
  );
}

function BpmnForm({ initial, obsFlat, onSave, onClose, t }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open title={t('bpmn.new')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label={t('bpmn.code')}><input className="input" value={form.code} onChange={set('code')} required /></Field>
        <Field label={t('common.name')}><input className="input" value={form.title} onChange={set('title')} required /></Field>
        <Field label={t('common.description')}><textarea className="input" value={form.description || ''} onChange={set('description')} /></Field>
        <Field label={t('common.obsUnit')}>
          <select className="input" value={form.obs_node_id || ''} onChange={set('obs_node_id')}>
            <option value="">—</option>
            {obsFlat.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </Field>
        <p className="text-xs text-grey-medium italic mb-3">{t('bpmn.newDiagramHint')}</p>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" className="btn-primary">{t('common.create')}</button>
        </div>
      </form>
    </Modal>
  );
}
