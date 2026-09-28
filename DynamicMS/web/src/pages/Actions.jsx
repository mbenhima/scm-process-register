import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, Status, Table, tx, Modal, Field, Tabs, Progress } from '../components/ui.jsx';
import Attachments from '../components/Attachments.jsx';
import { VersionsButton } from '../components/Versions.jsx';
import { ActionModal } from './Ncs.jsx';
import { NoProject } from './Home.jsx';

export default function Actions() {
  const { t, L, lang, projectId, project, me, fmtDate, toast, can, readOnly } = useApp();
  const [tab, setTab] = useState('open');
  const q = tab === 'mine' ? '?mine=1' : tab === 'open' ? '?open=1' : '';
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/actions${q}` : null, [tab]);
  const [sel, setSel] = useState(null);
  const [f, setF] = useState({});
  const [nw, setNw] = useState(false);
  if (!projectId) return <NoProject />;
  const today = new Date().toISOString().slice(0, 10);
  const open = (a) => { setSel(a); setF({ pct: a.pct, status: a.status, dueDate: a.due_date, effectiveness: a.effectiveness || '', verdict: tx(a.verdict, lang) }); };
  const isOwner = sel && sel.owner_user === me.user.id; const isEval = sel && sel.evaluator_user === me.user.id;
  const save = async () => {
    const body = { pct: +f.pct, status: f.status, dueDate: f.dueDate };
    if (isEval && f.effectiveness) { body.effectiveness = f.effectiveness; body.verdict = f.verdict; }
    try { await api(`/actions/${sel.id}`, { method: 'PUT', body }); toast(t('Saved.')); setSel(null); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <PageHead eyebrow={t('Records')} title={t('Actions')} subtitle={t('Every action has an owner who carries it out and a different evaluator who verifies its effectiveness.')} actions={can('records.manage') && !readOnly && <button className="btn btn-primary" onClick={() => setNw(true)}><Plus size={16} />{t('New action')}</button>} />
      <Tabs label={t('Filter')} value={tab} onChange={setTab} tabs={[{ id: 'open', label: t('Open') }, { id: 'mine', label: t('Mine (owner or evaluator)') }, { id: 'all', label: t('All') }]} />
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table rows={data} onRowClick={open} columns={[
          { key: 'kind', label: t('Kind'), render: a => L(a.kind) },
          { key: 'title', label: t('Title'), render: a => <span className="strong">{tx(a.title, lang)}</span>, sortValue: a => tx(a.title, lang) },
          { key: 'source_type', label: t('Source'), render: a => a.source_type },
          { key: 'owner_name', label: t('Owner') }, { key: 'evaluator_name', label: t('Evaluator') },
          { key: 'due_date', label: t('Due'), render: a => fmtDate(a.due_date) },
          { key: 'pct', label: t('Progress'), render: a => <div style={{ minWidth: 80 }}><Progress value={a.pct} /><span className="xsmall muted">{a.pct}%</span></div> },
          { key: 'status', label: t('Status'), render: a => <Status value={a.status !== 'Closed' && a.due_date < today ? 'Overdue' : a.status} /> },
          { key: 'effectiveness', label: t('Effectiveness'), render: a => (a.verdictHidden ? <span className="xsmall muted">{t('Restricted')}</span> : <Status value={a.effectiveness} />) },
        ]} />
      )}
      {sel && (
        <Modal wide title={tx(sel.title, lang)} onClose={() => setSel(null)} footer={<><VersionsButton type="action" id={sel.id} onReverted={reload} /><button className="btn" onClick={() => setSel(null)}>{t('Close')}</button>{(isOwner || isEval || can('records.manage')) && !readOnly && <button className="btn btn-primary" onClick={save}>{t('Save')}</button>}</>}>
          <p className="small muted">{t('Owner')}: {sel.owner_name} · {t('Evaluator')}: {sel.evaluator_name} · {L(sel.kind)}</p>
          <div className="form-grid">
            <Field label={t('Progress (%)')}>{(id) => <input id={id} className="input" type="number" min="0" max="100" value={f.pct} disabled={!(isOwner || can('records.manage'))} onChange={e => setF({ ...f, pct: e.target.value })} />}</Field>
            <Field label={t('Status')}>{(id) => <select id={id} className="select" value={f.status} disabled={!(isOwner || can('records.manage'))} onChange={e => setF({ ...f, status: e.target.value })}>{['Open', 'InProgress', 'Closed'].map(s => <option key={s} value={s}>{L(s)}</option>)}</select>}</Field>
            <Field label={t('Due date')}>{(id) => <input id={id} className="input" type="date" value={f.dueDate} disabled={!can('records.manage')} onChange={e => setF({ ...f, dueDate: e.target.value })} />}</Field>
          </div>
          <hr className="divider" />
          <h4 style={{ marginBottom: 8 }}>{t('Effectiveness verification')}</h4>
          {isEval ? (
            <div className="stack">
              <Field label={t('Verdict')} hint={t('Available once the owner reports 100% progress.')}>{(id) => <select id={id} className="select" value={f.effectiveness} onChange={e => setF({ ...f, effectiveness: e.target.value })}><option value="">{t('Choose…')}</option>{['Effective', 'Partially effective', 'Not effective'].map(s => <option key={s} value={s}>{L(s)}</option>)}</select>}</Field>
              <Field label={t('Evidence of effectiveness')}>{(id) => <textarea id={id} className="textarea" value={f.verdict} onChange={e => setF({ ...f, verdict: e.target.value })} />}</Field>
            </div>
          ) : <p className="small">{sel.verdictHidden ? t('The verdict is visible to the owner, the evaluator and process owners.') : sel.effectiveness ? <><Status value={sel.effectiveness} /> {tx(sel.verdict, lang)}</> : t('Only the evaluator records the verdict.')}</p>}
          <hr className="divider" />
          <Attachments entityType="action" entityId={sel.id} />
        </Modal>
      )}
      {nw && <ActionModal projectId={projectId} orgId={project.org.id} onClose={() => setNw(false)} onDone={() => { setNw(false); reload(); }} />}
    </>
  );
}
