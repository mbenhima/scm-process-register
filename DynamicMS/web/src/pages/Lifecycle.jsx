import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flag, CheckCircle2 } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Progress, Table, tx, Modal, Field, IconBadge } from '../components/ui.jsx';
import { NoProject } from './Home.jsx';

function GatePanel({ phaseId, onChange }) {
  const { t, lang, fmtDate, toast, readOnly } = useApp();
  const { data: ph, loading, reload } = useData(`/phases/${phaseId}`);
  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading && !ph) return <Loading />;
  if (!ph) return null;
  if (!ph.gate) return <Card title={t('Gate')}><p className="small muted">{t('No gate on this phase for the project track. The phase closes when its steps are complete.')}</p></Card>;
  const toggle = async (it) => {
    try { await api(`/checklist-items/${it.id}`, { method: 'PUT', body: { done: !it.done, evidenceNote: it.evidence_required ? t('Evidence recorded in the step records') : undefined } }); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const decide = async () => {
    setBusy(true);
    try { await api(`/phases/${phaseId}/gate`, { method: 'POST', body: { decision, comment } }); toast(t('Gate decision recorded.')); setDecision(null); reload(); onChange(); } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Card title={tx(ph.gate.name, lang)} action={ph.gate_decision ? <Status value={ph.gate_decision} /> : <Status value="Pending" />}>
      <p className="small">{tx(ph.gate.exit_criteria, lang)}</p>
      {ph.gate_decision && <p className="small muted">{t('Decided by {who} on {date}', { who: ph.decidedBy || '—', date: fmtDate(ph.decided_at) })}{ph.comment ? ` — ${tx(ph.comment, lang)}` : ''}</p>}
      {ph.checklists.map(cl => (
        <div key={cl.id} className="stack-8" style={{ marginTop: 16 }}>
          <div className="row-between"><span className="strong small">{tx(cl.title, lang)}</span>{cl.frozen ? <span className="tag">{t('Frozen')}</span> : null}</div>
          {cl.items.map(it => (
            <label key={it.id} className="checkbox small">
              <input type="checkbox" checked={!!it.done} disabled={!!cl.frozen || readOnly} onChange={() => toggle(it)} />
              <span>{tx(it.text, lang)}{it.mandatory ? <span className="muted"> · {t('mandatory')}</span> : ''}{it.done ? <span className="xsmall muted"> — {it.done_by_name} {fmtDate(it.done_at)}</span> : ''}</span>
            </label>
          ))}
        </div>
      ))}
      {!ph.gate_decision || ph.gate_decision !== 'Go' ? (
        <div className="stack-8" style={{ marginTop: 16 }}>
          <p className="xsmall muted">{t('{n} steps still open in this phase.', { n: ph.openSteps })}</p>
          {ph.canDecide && !readOnly && <div className="row">{['Go', 'Hold', 'No-Go'].map(d => <button key={d} className={`btn btn-sm ${d === 'Go' ? 'btn-primary' : ''}`} disabled={d === 'Go' && ph.openSteps > 0} onClick={() => { setDecision(d); setComment(''); }}>{t(d)}</button>)}</div>}
        </div>
      ) : null}
      {decision && (
        <Modal title={t('Gate decision: {d}', { d: t(decision) })} onClose={() => setDecision(null)} footer={<><button className="btn" onClick={() => setDecision(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={busy || (decision !== 'Go' && !comment.trim())} onClick={decide}>{t('Record decision')}</button></>}>
          <Field label={t('Comment')} required={decision !== 'Go'} hint={t('Required for No-Go and Hold.')}>{(id) => <textarea id={id} className="textarea" value={comment} onChange={e => setComment(e.target.value)} />}</Field>
        </Modal>
      )}
    </Card>
  );
}

export default function Lifecycle() {
  const { t, L, lang, projectId, project } = useApp();
  const { e2e } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/lifecycle` : null);
  if (!projectId) return <NoProject />;
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const current = data.find(p => p.e2e_id === e2e) || data.find(p => ['Active', 'AtGate'].includes(p.status)) || data[0];
  const done = data.filter(p => p.status === 'Closed').length;
  const steps = data.reduce((a, p) => a + p.steps, 0); const doneSteps = data.reduce((a, p) => a + p.done, 0);
  return (
    <>
      <PageHead eyebrow={`${project.code} · ${L(project.ms_type)}`} title={t('Lifecycle')} subtitle={t('The end-to-end phases of the management system, in execution order. Open a phase to see its macro processes and its gate.')} />
      <section className="divider-band" style={{ marginBottom: 'var(--sp-24)' }} aria-label={t('Run summary')}>
        <div><p className="eyebrow">{t('Full run')}</p><h2>{t('{done} of {n} phases closed', { done, n: data.length })}</h2><p style={{ margin: '8px 0 0' }}>{t('{d} of {s} workflow steps completed across {m} macro processes.', { d: doneSteps, s: steps, m: data.reduce((a, p) => a + p.mps.length, 0) })}</p></div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><span className="serif" style={{ fontSize: 36, fontWeight: 700, color: 'var(--aiv-azure)' }}>{Math.round((100 * doneSteps) / Math.max(1, steps))}%</span></div>
      </section>
      <nav className="timeline" aria-label={t('Phases')} style={{ marginBottom: 'var(--sp-24)' }}>
        {data.map(p => (
          <button key={p.id} className="phase-card" aria-current={p.e2e_id === current.e2e_id} onClick={() => navigate(`/lifecycle/${p.e2e_id}`)}>
            <span className="row-between"><span className="phase-id">{p.e2e_id}</span>{p.gate_decision === 'Go' ? <CheckCircle2 size={18} color="var(--aiv-navy)" aria-label={t('Gate passed')} /> : p.gate ? <Flag size={16} color="var(--aiv-muted)" aria-label={t('Gate')} /> : null}</span>
            <span className="strong small">{tx(p.name, lang)}</span>
            <Progress value={p.progress} label={tx(p.name, lang)} />
            <span className="row-between xsmall"><Status value={p.status} /><span className="muted">{p.done}/{p.steps}</span></span>
          </button>
        ))}
      </nav>
      <div className="grid-main">
        <Card title={`${current.e2e_id} — ${tx(current.name, lang)}`}>
          <p className="small">{tx(current.goals, lang)}</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '16px 0' }}>
            <div className="card flat tight"><div className="xsmall muted">{t('Trigger')}</div><div className="small strong">{tx(current.trigger, lang)}</div></div>
            <div className="card flat tight"><div className="xsmall muted">{t('Terminal event')}</div><div className="small strong">{tx(current.terminal, lang)}</div></div>
          </div>
          <Table rows={current.mps} onRowClick={(m) => navigate(`/mp/${m.id}`)} columns={[
            { key: 'code', label: t('Code'), width: 90 },
            { key: 'name', label: t('Macro process'), render: m => <span className="strong">{tx(m.name, lang)}</span>, sortValue: m => tx(m.name, lang) },
            { key: 'tier', label: t('Tier'), width: 60 },
            { key: 'owner', label: t('Owner'), render: m => tx(m.owner, lang) },
            { key: 'progress', label: t('Progress'), render: m => <div style={{ minWidth: 90 }}><Progress value={m.progress} label={m.code} /><span className="xsmall muted">{m.progress}%</span></div> },
            { key: 'status', label: t('Status'), render: m => <Status value={m.status} /> },
          ]} />
        </Card>
        <div className="stack">
          <GatePanel key={current.id} phaseId={current.id} onChange={reload} />
          <Card tight className="flat">
            <div className="row"><IconBadge icon={Flag} size="sm" /><span className="small">{t('A gate passes with Go only when every step of the phase is complete and every mandatory checklist item is ticked. Completed steps of a passed phase are locked.')}</span></div>
          </Card>
        </div>
      </div>
    </>
  );
}
