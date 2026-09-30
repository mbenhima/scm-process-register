import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Circle, Clock, ClipboardCheck, Pencil } from 'lucide-react';
import { api } from '../lib/api.js';
import { RacsiGrid } from '../components/StepInputs.jsx';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Card, Loading, ErrorBox, Status, Progress, Tabs, Table, tx, Modal, Field, IconBadge } from '../components/ui.jsx';
import Bpmn from '../components/Bpmn.jsx';
import { NoProject } from './Home.jsx';

export function Sipoc({ sipoc, lang, t }) {
  const cols = [['S', t('Suppliers')], ['I', t('Inputs')], ['P', t('Process steps')], ['O', t('Outputs')], ['C', t('Customers')]];
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
      {cols.map(([k, label]) => (
        <div key={k} className="card flat tight" style={k === 'P' ? { gridColumn: 'span 2' } : undefined}>
          <div className="row" style={{ marginBottom: 8 }}><span className="badge-icon sm accent serif" style={{ fontWeight: 700 }}>{k}</span><span className="strong small">{label}</span></div>
          <ol className="small" style={{ margin: 0, paddingInlineStart: 20 }}>{(sipoc?.[k] || []).map((x, i) => <li key={i}>{tx(x, lang)}</li>)}</ol>
        </div>
      ))}
    </div>
  );
}

// Optional checklist of what should be in place before starting the macro process.
function Readiness({ projectId, mpId }) {
  const { t, lang, toast, fmtDate, readOnly } = useApp();
  const { data, reload } = useData(`/projects/${projectId}/mps/${mpId}/readiness`);
  if (!data) return null;
  const tick = async (it, done) => { try { await api(`/projects/${projectId}/mps/${mpId}/readiness`, { method: 'PUT', body: { itemId: it.id, done } }); reload(); } catch (e) { toast(e.message, 'error'); } };
  return (
    <Card title={t('Before you start (optional checklist)')} action={<span className="small muted">{data.ready} / {data.total}</span>}>
      <ul className="list small">{data.items.map(it => (
        <li key={it.id}><label className="checkbox"><input type="checkbox" checked={!!it.done} disabled={!data.canEdit || readOnly} onChange={e => tick(it, e.target.checked)} /><span>{tx(it.text, lang)}{it.doneBy ? <span className="xsmall muted"> · {it.doneBy} · {fmtDate(it.doneAt)}</span> : it.auto !== undefined && it.done ? <span className="xsmall muted"> · {t('checked by the system')}</span> : null}</span></label></li>
      ))}</ul>
      <p className="caption">{t('Not blocking: it helps check the inputs, owners, templates and KPIs before the first step.')}</p>
    </Card>
  );
}

function RacsiEditor({ projectId, data, reload }) {
  const { t, lang, toast, readOnly } = useApp();
  const { data: pick } = useData(projectId ? `/projects/${projectId}/pickers` : null);
  const [ed, setEd] = useState(null);
  const roles = pick?.roles || [];
  const lettersOf = (a) => { const o = { R: [], A: [], C: [], S: [], I: [] }; for (const x of a?.assignments || []) o[x.letter].push(x.assignee); return o; };
  const mpAct = data.racsi.find(a => a.level === 'mp');
  const stepActs = data.racsi.filter(a => a.level === 'step');
  const steps = data.tasks.flatMap(tk => tk.steps);
  const save = async () => { try { await api(`/projects/${projectId}/mps/${data.mp.id}/racsi`, { method: 'PUT', body: { letters: ed.letters, stepId: ed.stepId || undefined } }); toast(t('RACSI saved.')); setEd(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const rowsTbl = [{ id: 'mp', name: `${data.mp.code} — ${tx(data.mp.name, lang)}`, level: 'mp', act: mpAct }, ...stepActs.map(a => ({ id: a.id, name: `${a.stepId} — ${tx(steps.find(s => s.id === a.stepId)?.name || a.name, lang)}`, level: 'step', stepId: a.stepId, act: a }))];
  const nm = (c) => tx(roles.find(r => r.code === c)?.name, lang) || c;
  return (
    <Card title={t('RACSI of the macro process')} action={data.canEditRacsi && !readOnly && <button className="btn btn-sm" onClick={() => setEd({ stepId: '', letters: lettersOf(null), isNew: true })}>{t('Set a step-level RACSI')}</button>}>
      <Table rows={rowsTbl} columns={[
        { key: 'name', label: t('Macro process or step'), render: r => <span className={r.level === 'mp' ? 'strong' : ''}>{r.name}</span> },
        ...['R', 'A', 'C', 'S', 'I'].map(Lt => ({ key: Lt, label: Lt, sortable: false, render: r => lettersOf(r.act)[Lt].map(nm).join(', ') })),
        ...(data.canEditRacsi && !readOnly ? [{ key: 'edit', label: '', sortable: false, render: r => <button className="btn btn-sm btn-ghost" aria-label={t('Edit')} onClick={() => setEd({ stepId: r.stepId || '', letters: lettersOf(r.act) })}><Pencil size={16} /></button> }] : []),
      ]} />
      <p className="caption">{t('The macro process RACSI applies to all its steps by default; set a step-level RACSI only where a step differs. R responsible, A accountable (exactly one), C consulted, S support, I informed.')}</p>
      {ed && (
        <Modal wide title={ed.stepId ? t('Step-level RACSI') : t('RACSI of the macro process')} onClose={() => setEd(null)} footer={<><button className="btn" onClick={() => setEd(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={ed.isNew && !ed.stepId} onClick={save}>{t('Save')}</button></>}>
          <div className="stack">
            {ed.isNew && <Field label={t('Step')} required>{(id) => <select id={id} className="select" value={ed.stepId} onChange={e => setEd({ ...ed, stepId: e.target.value, letters: e.target.value ? lettersOf(data.racsi.find(a => a.stepId === e.target.value) || mpAct) : lettersOf(null) })}><option value="">{t('Choose a step…')}</option>{steps.map(s => <option key={s.id} value={s.id}>{s.id} — {tx(s.name, lang)}</option>)}</select>}</Field>}
            <RacsiGrid value={ed.letters} onChange={(v) => setEd({ ...ed, letters: v })} roles={roles} t={t} lang={lang} />
            {ed.stepId && <p className="hint">{t('Leave all columns empty to remove the step-level RACSI (the macro process RACSI then applies).')}</p>}
          </div>
        </Modal>
      )}
    </Card>
  );
}

export default function MacroProcess() {
  const { mpId } = useParams();
  const { t, L, lang, projectId, project, fmtDate } = useApp();
  const [tab, setTab] = useState('steps');
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/mps/${mpId}` : null);
  if (!projectId) return <NoProject />;
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const m = data.mp;
  const today = new Date().toISOString().slice(0, 10);
  const nSteps = data.tasks.reduce((a, tk) => a + tk.steps.length, 0);
  return (
    <>
      <PageHead eyebrow={`${m.e2e} · ${tx(m.e2eName, lang)}`} title={`${m.code} — ${tx(m.name, lang)}`} subtitle={tx(m.goal, lang)}
        actions={<Link className="btn" to={`/lifecycle/${m.e2e}`}>{t('Back to phase')}</Link>}>
        <div className="row small" style={{ marginTop: 12 }}>
          <Status value={data.status} /><span className="muted">{t('Tier {n}', { n: m.tier })} · {tx(m.ownerRoleName, lang)} · {t('{n} steps', { n: nSteps })}</span>
          {m.standards?.slice(0, 4).map(s => <span key={s} className="tag outline">{s}</span>)}
        </div>
        <div style={{ maxWidth: 360, marginTop: 12 }}><Progress value={data.progress} label={t('Progress')} /></div>
      </PageHead>
      <Tabs label={t('Macro process views')} value={tab} onChange={setTab} tabs={[{ id: 'steps', label: t('Tasks and steps') }, { id: 'sipoc', label: 'SIPOC' }, { id: 'diagram', label: t('BPMN diagram') }, { id: 'racsi', label: 'RACSI' }, { id: 'gov', label: t('Governance') }]} />
      {tab === 'steps' && (
        <div className="grid-main">
          <div className="stack">
            {data.tasks.map(tk => (
              <Card key={tk.id} title={`${t('Task')} ${tk.seq} — ${tx(tk.name, lang)}`}>
                <ol className="steps-list">
                  {tk.steps.map(s => {
                    const st = s.exec?.status || 'Todo';
                    const overdue = st !== 'Done' && s.exec?.due_date < today;
                    return (
                      <li key={s.id}>
                        <Link className="step-row" to={s.exec ? `/steps/${s.exec.id}` : '#'}>
                          <span className={`step-state ${st}`} aria-label={L(st)}>{st === 'Done' ? <Check /> : st === 'InProgress' ? <Clock /> : <Circle style={{ opacity: 0 }} />}</span>
                          <span style={{ minWidth: 0 }}><span className="strong small">{s.seq}. {tx(s.name, lang)}</span><br /><span className="xsmall muted">{s.id} · {tx(s.role, lang)} · {tx(s.type, lang)}{s.exec?.value ? ` — ${tx(s.exec.value, lang)}` : ''}</span></span>
                          <span className="xsmall" style={{ textAlign: 'end' }}>{overdue ? <Status value="Overdue" /> : <Status value={st} />}<br /><span className="muted">{st === 'Done' ? fmtDate(s.exec?.completed_at) : fmtDate(s.exec?.due_date)}</span></span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            ))}
          </div>
          <div className="stack">
            <Readiness projectId={projectId} mpId={m.id} />
            <Card title={t('Objective')}><p className="small">{tx(m.objective, lang)}</p><p className="small"><span className="strong">{t('Trigger')}: </span>{tx(m.trigger, lang)}</p><p className="small" style={{ margin: 0 }}><span className="strong">{t('Terminal event')}: </span>{tx(m.terminal, lang)}</p></Card>
            <Card title={t('KPIs of this process')}>{data.kpis.length ? <ul className="list small">{data.kpis.map(k => <li key={k.id}><Link to="/kpis">{k.code}</Link> — {tx(k.name, lang)} <span className="muted ltr">({k.target_text})</span></li>)}</ul> : <p className="small muted">{t('No KPI linked.')}</p>}</Card>
          </div>
        </div>
      )}
      {tab === 'sipoc' && <Card><Sipoc sipoc={m.sipoc} lang={lang} t={t} /><p className="caption">{t('SIPOC of the macro process as defined in the process design (D01).')}</p></Card>}
      {tab === 'diagram' && <Card><Bpmn projectId={projectId} mpId={m.id} code={m.code} /></Card>}
      {tab === 'racsi' && <RacsiEditor projectId={projectId} data={data} reload={reload} />}
      {tab === 'gov' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Card title={t('Business rules')}>{data.rules.length ? <ul className="list small">{data.rules.map(r => <li key={r.id}><span className="strong">{r.id}</span> · {L(r.type)}<br />{tx(r.condition, lang)} → <span className="muted">{tx(r.action, lang)}</span></li>)}</ul> : <p className="small muted">{t('No rule on this process.')}</p>}</Card>
          <Card title={t('Controls')}>{data.controls.length ? <ul className="list small">{data.controls.map(c => <li key={c.id}><span className="strong">{c.id}</span> · {L(c.coso)}<br />{tx(c.name, lang)}</li>)}</ul> : <p className="small muted">{t('No control on this process.')}</p>}</Card>
          <Card title={t('AI use cases')}>{data.aiUseCases.length ? <ul className="list small">{data.aiUseCases.map(a => <li key={a.id}><span className="strong">{a.id}</span> · {L(a.tier)}<br />{tx(a.name, lang)}<br /><span className="muted">{tx(a.checkpoint, lang)}</span></li>)}</ul> : <p className="small muted">{t('No AI use case on this process.')}</p>}</Card>
        </div>
      )}
    </>
  );
}
