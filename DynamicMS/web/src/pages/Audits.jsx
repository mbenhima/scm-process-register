import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Table, tx, Modal, Field } from '../components/ui.jsx';
import Attachments from '../components/Attachments.jsx';
import { NoProject } from './Home.jsx';

const TYPES = ['Internal', 'Supplier', 'Mock', 'Certification', 'Surveillance'];

export default function Audits() {
  const { t, L, lang, projectId, project, fmtDate, toast, can, readOnly } = useApp();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/audits` : null);
  const [nw, setNw] = useState(null);
  if (!projectId) return <NoProject />;
  const create = async () => { try { await api(`/projects/${projectId}/audits`, { method: 'POST', body: nw }); toast(t('Audit planned.')); setNw(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  return (
    <>
      <PageHead eyebrow={t('Records')} title={t('Audits')} subtitle={t('Internal, supplier, mock and certification audits of the run, with their findings and corrective actions.')} actions={can('records.manage') && !readOnly && <button className="btn btn-primary" onClick={() => setNw({ title: '', type: 'Internal', standard: (project.standards || ['ISO 9001'])[0], plannedDate: '' })}><Plus size={16} />{t('Plan an audit')}</button>} />
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table rows={data} onRowClick={(a) => navigate(`/audits/${a.id}`)} initialSort={{ key: 'planned_date', dir: 'asc' }} columns={[
          { key: 'code', label: t('Code'), width: 170 }, { key: 'title', label: t('Title'), render: a => <span className="strong">{tx(a.title, lang)}</span>, sortValue: a => tx(a.title, lang) },
          { key: 'type', label: t('Type'), render: a => L(a.type) }, { key: 'standard', label: t('Standard') },
          { key: 'planned_date', label: t('Planned'), render: a => fmtDate(a.planned_date) }, { key: 'lead_name', label: t('Lead auditor') },
          { key: 'findings', label: t('Findings'), width: 80 }, { key: 'status', label: t('Status'), render: a => <Status value={a.status} /> },
        ]} />
      )}
      {nw && (
        <Modal title={t('Plan an audit')} onClose={() => setNw(null)} footer={<><button className="btn" onClick={() => setNw(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nw.title || !nw.plannedDate} onClick={create}>{t('Create')}</button></>}>
          <div className="stack">
            <Field label={t('Title')} required>{(id) => <input id={id} className="input" value={nw.title} onChange={e => setNw({ ...nw, title: e.target.value })} />}</Field>
            <div className="form-grid">
              <Field label={t('Type')}>{(id) => <select id={id} className="select" value={nw.type} onChange={e => setNw({ ...nw, type: e.target.value })}>{TYPES.map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
              <Field label={t('Standard')}>{(id) => <select id={id} className="select" value={nw.standard} onChange={e => setNw({ ...nw, standard: e.target.value })}>{(project.standards || ['ISO 9001']).map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>
              <Field label={t('Planned date')} required>{(id) => <input id={id} className="input" type="date" value={nw.plannedDate} onChange={e => setNw({ ...nw, plannedDate: e.target.value })} />}</Field>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export function AuditDetail() {
  const { id } = useParams();
  const { t, L, lang, fmtDate, toast, can, project, readOnly } = useApp();
  const { data: a, loading, error, reload } = useData(`/audits/${id}`);
  const { data: users } = useData(project ? `/orgs/${project.org.id}/users` : null);
  const [nf, setNf] = useState(null);
  if (loading && !a) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const manage = can('records.manage') && !readOnly;
  const complete = async () => { try { await api(`/audits/${a.id}`, { method: 'PUT', body: { status: 'Completed' } }); toast(t('Audit completed.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const addF = async () => { try { await api(`/audits/${a.id}/findings`, { method: 'POST', body: nf }); toast(t('Finding recorded.')); setNf(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const needsAction = nf && ['Major', 'Minor'].includes(nf.type);
  return (
    <>
      <PageHead eyebrow={`${L(a.type)} · ${a.code}`} title={tx(a.title, lang)} subtitle={`${a.standard} · ${t('Planned')} ${fmtDate(a.planned_date)}${a.done_date ? ` · ${t('Done')} ${fmtDate(a.done_date)}` : ''}`} actions={<><Link className="btn" to="/audits">{t('All audits')}</Link>{manage && a.status !== 'Completed' && <button className="btn" onClick={complete}>{t('Mark completed')}</button>}{manage && <button className="btn btn-primary" onClick={() => setNf({ type: 'Minor', clause: '', text: '', ownerUser: '', evaluatorUser: '' })}><Plus size={16} />{t('Add finding')}</button>}</>} />
      <div className="grid-main">
        <Card title={t('Findings')}>
          <Table rows={a.findings} columns={[{ key: 'type', label: t('Type'), render: f => <Status value={f.type} /> }, { key: 'clause', label: t('Clause'), width: 80 }, { key: 'text', label: t('Finding'), render: f => tx(f.text, lang) }, { key: 'status', label: t('Status'), render: f => <Status value={f.status} /> }, { key: 'action_status', label: t('Action'), render: f => (f.action_id ? <Status value={f.action_status} /> : '—') }]} empty={t('No finding recorded.')} />
        </Card>
        <div className="stack"><Card title={t('Scope')}><p className="small">{tx(a.scope, lang)}</p><p className="small"><span className="strong">{t('Lead auditor')}: </span>{a.lead?.name}</p></Card><Card><Attachments entityType="audit" entityId={a.id} /></Card></div>
      </div>
      {nf && (
        <Modal title={t('Add finding')} onClose={() => setNf(null)} footer={<><button className="btn" onClick={() => setNf(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nf.text || (needsAction && (!nf.ownerUser || !nf.evaluatorUser || nf.ownerUser === nf.evaluatorUser))} onClick={addF}>{t('Save')}</button></>}>
          <div className="stack">
            <div className="form-grid">
              <Field label={t('Type')}>{(id) => <select id={id} className="select" value={nf.type} onChange={e => setNf({ ...nf, type: e.target.value })}>{['Major', 'Minor', 'Observation', 'OFI'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
              <Field label={t('Clause')}>{(id) => <input id={id} className="input" value={nf.clause} onChange={e => setNf({ ...nf, clause: e.target.value })} />}</Field>
            </div>
            <Field label={t('Finding')} required>{(id) => <textarea id={id} className="textarea" value={nf.text} onChange={e => setNf({ ...nf, text: e.target.value })} />}</Field>
            {needsAction && <div className="form-grid">
              <Field label={t('Action owner')} required>{(id) => <select id={id} className="select" value={nf.ownerUser} onChange={e => setNf({ ...nf, ownerUser: e.target.value })}><option value="">{t('Choose…')}</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}</Field>
              <Field label={t('Evaluator')} required>{(id) => <select id={id} className="select" value={nf.evaluatorUser} onChange={e => setNf({ ...nf, evaluatorUser: e.target.value })}><option value="">{t('Choose…')}</option>{(users || []).map(u => <option key={u.id} value={u.id} disabled={u.id === nf.ownerUser}>{u.name}</option>)}</select>}</Field>
            </div>}
          </div>
        </Modal>
      )}
    </>
  );
}
