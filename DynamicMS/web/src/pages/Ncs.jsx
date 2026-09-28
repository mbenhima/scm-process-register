import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Table, tx, Modal, Field, Tabs } from '../components/ui.jsx';
import Attachments from '../components/Attachments.jsx';
import { VersionsButton } from '../components/Versions.jsx';
import { NoProject } from './Home.jsx';

const SOURCES = ['Customer', 'Audit', 'Process', 'Supplier', 'Incident'];

export function ActionModal({ projectId, orgId, source, onClose, onDone }) {
  const { t, toast } = useApp();
  const { data: users } = useData(`/orgs/${orgId}/users`);
  const [f, setF] = useState({ title: '', kind: 'Corrective', ownerUser: '', evaluatorUser: '', dueDate: '' });
  const same = f.ownerUser && f.ownerUser === f.evaluatorUser;
  const save = async () => {
    try { await api(`/projects/${projectId}/actions`, { method: 'POST', body: { ...f, sourceType: source?.type, sourceId: source?.id } }); toast(t('Action created.')); onDone(); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <Modal title={t('New action')} onClose={onClose} footer={<><button className="btn" onClick={onClose}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!f.title || !f.ownerUser || !f.evaluatorUser || !f.dueDate || same} onClick={save}>{t('Create')}</button></>}>
      <div className="stack">
        <Field label={t('Title')} required>{(id) => <input id={id} className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />}</Field>
        <div className="form-grid">
          <Field label={t('Kind')}>{(id) => <select id={id} className="select" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}>{['Containment', 'Corrective', 'Preventive', 'Improvement'].map(k => <option key={k} value={k}>{t(k)}</option>)}</select>}</Field>
          <Field label={t('Due date')} required>{(id) => <input id={id} className="input" type="date" value={f.dueDate} onChange={e => setF({ ...f, dueDate: e.target.value })} />}</Field>
          <Field label={t('Owner')} required>{(id) => <select id={id} className="select" value={f.ownerUser} onChange={e => setF({ ...f, ownerUser: e.target.value })}><option value="">{t('Choose…')}</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}</Field>
          <Field label={t('Evaluator')} required error={same ? t('The owner and the evaluator must be different users.') : null}>{(id) => <select id={id} className="select" value={f.evaluatorUser} aria-invalid={same} onChange={e => setF({ ...f, evaluatorUser: e.target.value })}><option value="">{t('Choose…')}</option>{(users || []).map(u => <option key={u.id} value={u.id} disabled={u.id === f.ownerUser}>{u.name}</option>)}</select>}</Field>
        </div>
      </div>
    </Modal>
  );
}

export default function Ncs() {
  const { t, L, lang, projectId, fmtDate, toast, can, readOnly } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('open');
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/ncs` : null);
  const [nw, setNw] = useState(null);
  if (!projectId) return <NoProject />;
  const create = async () => {
    try { const r = await api(`/projects/${projectId}/ncs`, { method: 'POST', body: nw }); toast(t('Problem reported as {code}.', { code: r.code })); setNw(null); navigate(`/ncs/${r.id}`); } catch (e) { toast(e.message, 'error'); }
  };
  const rows = (data || []).filter(n => (tab === 'open' ? n.status !== 'Closed' : tab === 'closed' ? n.status === 'Closed' : true));
  return (
    <>
      <PageHead eyebrow={t('Records')} title={t('Nonconformities')} subtitle={t('Problems move through five stages: open, analysis, action, verification and closure with lessons learned.')} actions={can('records.create') && !readOnly && <button className="btn btn-primary" onClick={() => setNw({ title: '', description: '', source: 'Process', criticality: 'Minor', category: 'Product' })}><Plus size={16} />{t('Report a problem')}</button>} />
      <Tabs label={t('Filter')} value={tab} onChange={setTab} tabs={[{ id: 'open', label: t('Open'), count: (data || []).filter(n => n.status !== 'Closed').length }, { id: 'closed', label: t('Closed'), count: (data || []).filter(n => n.status === 'Closed').length }, { id: 'all', label: t('All') }]} />
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table rows={rows} onRowClick={(n) => navigate(`/ncs/${n.id}`)} columns={[
          { key: 'code', label: t('Code'), width: 170 },
          { key: 'title', label: t('Title'), render: n => <span className="strong">{tx(n.title, lang)}</span>, sortValue: n => tx(n.title, lang) },
          { key: 'source', label: t('Source'), render: n => L(n.source) },
          { key: 'criticality', label: t('Criticality'), render: n => <Status value={n.criticality} /> },
          { key: 'stage', label: t('Stage'), render: n => <Status value={n.stage} /> },
          { key: 'detected_at', label: t('Detected'), render: n => fmtDate(n.detected_at) },
          { key: 'owner_name', label: t('Owner') },
          { key: 'actions', label: t('Actions'), width: 70 },
        ]} />
      )}
      {nw && (
        <Modal title={t('Report a problem')} onClose={() => setNw(null)} footer={<><button className="btn" onClick={() => setNw(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nw.title || !nw.description} onClick={create}>{t('Submit')}</button></>}>
          <div className="stack">
            <Field label={t('Title')} required>{(id) => <input id={id} className="input" value={nw.title} onChange={e => setNw({ ...nw, title: e.target.value })} />}</Field>
            <Field label={t('Description')} required hint={t('What happened, where, when, and what you did immediately.')}>{(id) => <textarea id={id} className="textarea" value={nw.description} onChange={e => setNw({ ...nw, description: e.target.value })} />}</Field>
            <div className="form-grid">
              <Field label={t('Source')}>{(id) => <select id={id} className="select" value={nw.source} onChange={e => setNw({ ...nw, source: e.target.value })}>{SOURCES.map(s => <option key={s} value={s}>{L(s)}</option>)}</select>}</Field>
              <Field label={t('Criticality')} hint={t('Critical raises an alert to the Quality Manager and top management.')}>{(id) => <select id={id} className="select" value={nw.criticality} onChange={e => setNw({ ...nw, criticality: e.target.value })}>{['Minor', 'Major', 'Critical'].map(s => <option key={s} value={s}>{L(s)}</option>)}</select>}</Field>
              <Field label={t('Category')}>{(id) => <select id={id} className="select" value={nw.category} onChange={e => setNw({ ...nw, category: e.target.value })}>{['Product', 'Documentation', 'Supplier', 'Competence', 'Metrology', 'OH&S', 'Environment'].map(s => <option key={s} value={s}>{L(s)}</option>)}</select>}</Field>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

const STAGES = ['Open', 'Analysis', 'Action', 'Verification', 'Closed'];
export function NcDetail() {
  const { id } = useParams();
  const { t, L, lang, fmtDate, toast, can, projectId, project, readOnly } = useApp();
  const { data: n, loading, error, reload } = useData(`/ncs/${id}`);
  const [rc, setRc] = useState(null);
  const [rex, setRex] = useState(null);
  const [act, setAct] = useState(false);
  if (loading && !n) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const si = STAGES.indexOf(n.stage);
  const next = STAGES[si + 1];
  const manage = can('records.manage') && !readOnly;
  const advance = async (body = {}) => {
    try { await api(`/ncs/${n.id}`, { method: 'PUT', body: { stage: next, ...body } }); toast(t('Moved to {s}.', { s: L(next) })); setRc(null); setRex(null); reload(); }
    catch (e) { if (e.code === 'ROOT_CAUSE_REQUIRED') setRc(''); else if (e.code === 'REX_REQUIRED') setRex({ wentWell: '', notWell: '', recommendation: '', rating: 4 }); else toast(e.message, 'error'); }
  };
  return (
    <>
      <PageHead eyebrow={`${t('Nonconformity')} · ${n.code}`} title={tx(n.title, lang)} subtitle={tx(n.description, lang)} actions={<><VersionsButton type="nc" id={n.id} onReverted={reload} /><Link className="btn" to="/ncs">{t('All nonconformities')}</Link></>}>
        <div className="row small" style={{ marginTop: 12 }}><Status value={n.criticality} /><span className="muted">{L(n.source)} · {L(n.category)} · {t('Detected')} {fmtDate(n.detected_at)} · {t('Due')} {fmtDate(n.due_date)}</span></div>
      </PageHead>
      <ol className="row" style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', gap: 8 }} aria-label={t('Stages')}>
        {STAGES.map((s, i) => <li key={s} className={`tag ${i < si ? 's5' : i === si ? 's3' : ''}`} aria-current={i === si ? 'step' : undefined} style={{ padding: '6px 12px', fontSize: 14 }}>{i < si && <Check size={14} aria-hidden="true" />}{i + 1}. {L(s)}</li>)}
      </ol>
      <div className="grid-main">
        <div className="stack">
          <Card title={t('Actions')} action={manage && n.stage !== 'Closed' && <button className="btn btn-sm" onClick={() => setAct(true)}><Plus size={16} />{t('Add action')}</button>}>
            <Table rows={n.actions} columns={[
              { key: 'kind', label: t('Kind'), render: a => L(a.kind) }, { key: 'title', label: t('Title'), render: a => tx(a.title, lang) },
              { key: 'owner_name', label: t('Owner') }, { key: 'evaluator_name', label: t('Evaluator') },
              { key: 'due_date', label: t('Due'), render: a => fmtDate(a.due_date) }, { key: 'status', label: t('Status'), render: a => <Status value={a.status} /> },
              { key: 'effectiveness', label: t('Effectiveness'), render: a => (a.verdictHidden ? <span className="muted xsmall">{t('Restricted')}</span> : <Status value={a.effectiveness} />) },
            ]} empty={t('No action yet.')} />
          </Card>
          {n.rex.length > 0 && <Card title={t('Lessons learned (REX)')}>{n.rex.map(r => <div key={r.id} className="small stack-8"><div><span className="strong">{t('What went well')}: </span>{tx(r.went_well, lang)}</div><div><span className="strong">{t('What did not go well')}: </span>{tx(r.not_well, lang)}</div><div><span className="strong">{t('Recommendation')}: </span>{tx(r.recommendation, lang)}</div></div>)}</Card>}
        </div>
        <div className="stack">
          <Card title={t('Analysis')}>
            <p className="small"><span className="strong">{t('Root cause')}: </span>{tx(n.root_cause, lang) || <span className="muted">{t('Not recorded yet')}</span>}</p>
            <p className="small"><span className="strong">{t('Owner')}: </span>{n.owner?.name || '—'}</p>
            {n.cost ? <p className="small"><span className="strong">{t('Cost of the problem')}: </span>{n.cost}</p> : null}
            {manage && next && <button className="btn btn-primary" onClick={() => (n.stage === 'Analysis' && !n.root_cause ? setRc('') : next === 'Closed' && !n.rex.length ? setRex({ wentWell: '', notWell: '', recommendation: '', rating: 4 }) : advance())}>{t('Move to {s}', { s: L(next) })}</button>}
          </Card>
          <Card><Attachments entityType="nc" entityId={n.id} /></Card>
        </div>
      </div>
      {rc !== null && (
        <Modal title={t('Root cause')} onClose={() => setRc(null)} footer={<><button className="btn" onClick={() => setRc(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!rc.trim()} onClick={() => advance({ rootCause: rc })}>{t('Save and continue')}</button></>}>
          <Field label={t('Root cause (5 whys, fishbone…)')} required>{(fid) => <textarea id={fid} className="textarea" value={rc} onChange={e => setRc(e.target.value)} />}</Field>
        </Modal>
      )}
      {rex && (
        <Modal title={t('Lessons learned before closure')} onClose={() => setRex(null)} footer={<><button className="btn" onClick={() => setRex(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!rex.recommendation.trim()} onClick={() => advance({ rex })}>{t('Close the nonconformity')}</button></>}>
          <div className="stack">
            <Field label={t('What went well')}>{(fid) => <textarea id={fid} className="textarea" value={rex.wentWell} onChange={e => setRex({ ...rex, wentWell: e.target.value })} />}</Field>
            <Field label={t('What did not go well')}>{(fid) => <textarea id={fid} className="textarea" value={rex.notWell} onChange={e => setRex({ ...rex, notWell: e.target.value })} />}</Field>
            <Field label={t('Recommendation')} required>{(fid) => <textarea id={fid} className="textarea" value={rex.recommendation} onChange={e => setRex({ ...rex, recommendation: e.target.value })} />}</Field>
          </div>
        </Modal>
      )}
      {act && <ActionModal projectId={projectId} orgId={project.org.id} source={{ type: 'nc', id: n.id }} onClose={() => setAct(false)} onDone={() => { setAct(false); reload(); }} />}
    </>
  );
}
