import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Play, CheckCircle2, SkipForward, Paperclip, UserCog, ShieldQuestion, RotateCcw } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { api, post, put, download } from '../lib/api.js';
import {
  PageHeader, Card, CardHead, useFetch, Skeleton, ErrorNote, StatusBadge, Button, Field, Input, Textarea, Select, Modal, Badge, useToast, fmtDate,
  JustifyModal,
} from '../components/ui.jsx';
import AiSuggest from '../components/AiSuggest.jsx';
import RexForm from '../components/RexForm.jsx';

function Upload({ entityType, entityId, onDone, label }) {
  const { t } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.append('entity_type', entityType); form.append('entity_id', entityId); form.append('file', file);
    setBusy(true);
    try { await api('/evidence', { method: 'POST', form }); toast.ok(t('File attached: {f}', { f: file.name })); onDone?.(); } catch (err) { toast.err(err); } finally { setBusy(false); e.target.value = ''; }
  };
  return <label className="btn btn-secondary btn-sm" aria-busy={busy}><Paperclip aria-hidden />{label || t('Attach file')}<input type="file" className="sr-only" onChange={pick} /></label>;
}

function Checklist({ task, reload }) {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [ev, setEv] = useState({});
  const [waive, setWaive] = useState(null);
  const frozen = !['Open', 'On hold'].includes(task.gate?.status);
  const act = async (item, body) => { try { await put(`/checklist/${item.id}`, body); reload(); } catch (e) { toast.err(e); } };
  const items = task.checklist || [];
  const mand = items.filter((i) => i.mandatory); const ok = mand.filter((i) => ['Complete', 'Waived'].includes(i.status)).length;
  return (
    <Card>
      <CardHead title={t('Gate {g} checklist', { g: task.gate.gate })} subtitle={t('{ok} of {m} mandatory items complete or waived · {n} items in total ({tr} Track)', { ok, m: mand.length, n: items.length, tr: t(task.project.track) })} />
      <div className="callout neutral" style={{ marginBottom: 16 }}><div><strong className="strong">{t('Decision question')}:</strong> {t(task.gate.question)}</div></div>
      <div className="stack">
        {items.map((it) => (
          <div key={it.id} className="card quiet" style={{ padding: 16 }}>
            <div className="row between">
              <div className="grow">
                <div className="strong small">{it.seq}. {t(it.text)} {it.mandatory ? <Badge tone="dark">{t('Mandatory')}</Badge> : <Badge>{t('Optional')}</Badge>}</div>
                <div className="xs muted">{t('Source')}: {it.source}{it.completed_by_name ? ` · ${t('Completed by {n}', { n: it.completed_by_name })}` : ''}{it.waiver_reason ? ` · ${t('Waiver')}: ${it.waiver_reason}` : ''}</div>
                {it.evidence && <div className="xs" style={{ marginTop: 4 }}>{t('Evidence')}: {it.evidence}</div>}
                {it.files?.map((f) => <button key={f.id} type="button" className="btn btn-ghost btn-sm" onClick={() => download(`/evidence/${f.id}`)}><Paperclip aria-hidden />{f.filename}</button>)}
              </div>
              <StatusBadge value={it.status} />
            </div>
            {!frozen && can('checklist.edit') && task.project.status === 'Active' && (
              <div className="row" style={{ marginTop: 12 }}>
                {it.status !== 'Complete' && it.status !== 'Waived' && (
                  <>
                    <input className="input grow" style={{ flex: '1 1 260px' }} aria-label={t('Evidence reference')} placeholder={it.evidence_required ? t('Evidence reference (required)') : t('Evidence reference')} value={ev[it.id] ?? ''} onChange={(e) => setEv((x) => ({ ...x, [it.id]: e.target.value }))} />
                    <Button size="sm" variant="primary" onClick={() => act(it, { action: 'complete', evidence: ev[it.id] })}>{t('Mark complete')}</Button>
                    <Upload entityType="checklist_item" entityId={it.id} onDone={reload} />
                    <Button size="sm" icon={ShieldQuestion} onClick={() => setWaive(it)}>{can('gate.decide') ? t('Waive') : t('Request waiver')}</Button>
                  </>
                )}
                {(it.status === 'Complete' || it.status === 'Waived' || it.status === 'Waiver requested') && <Button size="sm" icon={RotateCcw} onClick={() => act(it, { action: 'reopen' })}>{t('Reopen')}</Button>}
              </div>
            )}
          </div>
        ))}
      </div>
      {waive && <WaiveModal item={waive} onClose={() => setWaive(null)} onConfirm={async (reason) => { await act(waive, { action: 'waive', reason }); setWaive(null); }} />}
    </Card>
  );
}

function WaiveModal({ item, onClose, onConfirm }) {
  const { t } = useI18n();
  const [r, setR] = useState('');
  return (
    <Modal title={t('Waiver for item {n}', { n: item.seq })} subtitle={t('Waivers need Gate Review Board approval (CTL-04). Other users can only request one.')} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('Cancel')}</Button><Button variant="primary" disabled={!r.trim()} onClick={() => onConfirm(r)}>{t('Save')}</Button></>}>
      <Field label={t('Reason')} required><Textarea value={r} onChange={(e) => setR(e.target.value)} /></Field>
    </Modal>
  );
}

function Assign({ task, onClose, onSaved }) {
  const { t } = useI18n();
  const toast = useToast();
  const people = useFetch('/directory');
  const [f, setF] = useState({ owner_id: task.owner_id || '', evaluator_id: task.evaluator_id || '', due_date: task.due_date || '' });
  const save = async () => { try { await put(`/tasks/${task.id}/assign`, { owner_id: Number(f.owner_id) || null, evaluator_id: Number(f.evaluator_id) || null, due_date: f.due_date }); toast.ok(t('Assignment saved.')); onSaved(); onClose(); } catch (e) { toast.err(e); } };
  const opts = (people.data || []).map((p) => ({ value: p.id, label: p.name }));
  return (
    <Modal title={t('Assign task')} onClose={onClose} footer={<><Button onClick={onClose}>{t('Cancel')}</Button><Button variant="primary" onClick={save} disabled={f.owner_id && String(f.owner_id) === String(f.evaluator_id)}>{t('Save')}</Button></>}>
      <div className="form-grid">
        <Field label={t('Owner (Responsible)')}><Select value={f.owner_id} onChange={(e) => setF({ ...f, owner_id: e.target.value })} options={opts} /></Field>
        <Field label={t('Evaluator (Accountable)')} hint={t('Must be a different person from the owner.')} error={f.owner_id && String(f.owner_id) === String(f.evaluator_id) ? t('Owner and evaluator must be different people.') : null}>
          <Select value={f.evaluator_id} onChange={(e) => setF({ ...f, evaluator_id: e.target.value })} placeholder={t('None')} options={opts} />
        </Field>
        <Field label={t('Due date')}><Input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

export default function Task() {
  const { id } = useParams();
  const { t } = useI18n();
  const { me, can } = useAuth();
  const toast = useToast();
  const { data: task, error, reload } = useFetch(`/tasks/${id}`);
  const [data, setData] = useState({});
  const [output, setOutput] = useState('');
  const [errs, setErrs] = useState(null);
  const [effects, setEffects] = useState(null);
  const [rex, setRex] = useState(false);
  const [assign, setAssign] = useState(false);
  const [skip, setSkip] = useState(false);
  const [reopen, setReopen] = useState(false);
  const [verdict, setVerdict] = useState({ verdict: 'Effective', notes: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (task) { setData(task.data || {}); setOutput(task.output || ''); } }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!task) return <div className="page"><Skeleton h={500} /></div>;
  const mine = task.owner_id === me.user.id;
  const canWork = task.project.status === 'Active' && task.run.status === 'In progress' && (mine || can('project.edit')) && can('task.edit');
  const open = ['To do', 'In progress'].includes(task.status);
  const run = async (fn) => { setBusy(true); setErrs(null); try { await fn(); } catch (e) { setErrs(e); } finally { setBusy(false); } };
  const complete = () => run(async () => {
    const r = await post(`/tasks/${task.id}/complete`, { data, output });
    setEffects(r.effects); toast.ok(t('Task completed.')); reload();
    if (r.rexPrompt && can('rex.manage')) setRex(true);
  });
  const u = task.uft || {};
  return (
    <div className="page">
      <PageHeader eyebrow={`${task.uft_id} · ${task.run.e2e_id} ${t(task.run.e2e_name)}${task.run.run_no > 1 ? ` · ${t('run {n}', { n: task.run.run_no })}` : ''}`}
        title={t(task.name)} subtitle={<>{t(u.description || '')} · <Link to={`/projects/${task.project.id}`}>{task.project.code} {task.project.name}</Link></>}
        actions={<><StatusBadge value={task.status} />{can('task.assign') && open && <Button icon={UserCog} onClick={() => setAssign(true)}>{t('Assign')}</Button>}</>} />
      {task.run.status === 'Scheduled' && <div className="callout warn" style={{ marginBottom: 16 }}>{t('This run starts after the Light Track observation period (Rule R1).')}</div>}
      <div className="grid two">
        <div className="stack">
          {task.kind === 'work' && (
            <Card>
              <CardHead title={open ? t('Record the result') : t('Recorded result')} subtitle={open ? t('Fill in the fields, write the result, then select Complete task.') : t('Completed on {d}', { d: fmtDate(task.completed_at) })} />
              {open && canWork && task.status === 'To do' && <div style={{ marginBottom: 16 }}><Button icon={Play} onClick={() => run(async () => { await post(`/tasks/${task.id}/start`); reload(); })}>{t('Start task')}</Button></div>}
              <div className="form-grid">
                {task.form.map((f) => (
                  <Field key={f.key} label={t(f.label)} required={f.required} hint={f.hint ? t(f.hint) : null} full={f.type === 'text' && !f.min}>
                    {f.type === 'select' ? <Select value={data[f.key] ?? ''} disabled={!open || !canWork} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} placeholder={t('Choose')} options={f.options.map((o) => ({ value: o, label: t(o) }))} />
                      : <Input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} step={f.step || 'any'} min={f.min} max={f.max} value={data[f.key] ?? ''} disabled={!open || !canWork} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} />}
                  </Field>
                ))}
                <Field label={t('Result / output')} required full hint={t('Describe what was done and the outcome. This text goes into the gate evidence.')}>
                  <Textarea value={output} disabled={!open || !canWork} onChange={(e) => setOutput(e.target.value)} rows={5} />
                </Field>
              </div>
              <ErrorNote error={errs} />
              {effects?.length > 0 && <div className="stack tight" style={{ marginTop: 12 }}>{effects.map((e) => <div key={e.rule} className="callout good"><div><strong className="strong">{e.rule}{e.action ? ` → ${e.action}` : ''}:</strong> {t(e.message)}</div></div>)}</div>}
              <div className="row" style={{ marginTop: 16 }}>
                {open && canWork && <Button variant="primary" icon={CheckCircle2} busy={busy} onClick={complete}>{t('Complete task')}</Button>}
                {open && canWork && task.data?.r2Skippable && <Button icon={SkipForward} onClick={() => setSkip(true)}>{t('Skip (Rule R2)')}</Button>}
                {!open && ['Done', 'Skipped'].includes(task.status) && task.project.status === 'Active' && task.run.status === 'In progress' && can('project.edit') && (!task.gate || ['Open', 'On hold'].includes(task.gate.status))
                  && <Button icon={RotateCcw} onClick={() => setReopen(true)}>{t('Reopen task')}</Button>}
                <Upload entityType="task" entityId={task.id} onDone={reload} label={t('Attach evidence file')} />
                {task.files.map((f) => <button key={f.id} type="button" className="btn btn-ghost btn-sm" onClick={() => download(`/evidence/${f.id}`)}><Paperclip aria-hidden />{f.filename}</button>)}
              </div>
              {task.skip_reason && <p className="muted" style={{ marginTop: 12 }}>{t('Skipped')}: {task.skip_reason}</p>}
            </Card>
          )}
          {task.kind === 'checklist' && task.gate && (
            <>
              <Checklist task={task} reload={reload} />
              <Card>
                <ErrorNote error={errs} />
                <div className="row between">
                  <span className="muted">{t('When every mandatory item is complete or waived, close the checklist task (BR-004).')}</span>
                  {open && canWork && <Button variant="primary" icon={CheckCircle2} busy={busy} onClick={complete}>{t('Complete checklist task')}</Button>}
                </div>
              </Card>
            </>
          )}
          {task.kind === 'gate' && task.gate && (
            <Card className="tint">
              <h3>{t('Gate decision')}</h3>
              <p>{t('This task closes when the Gate Review Board records its decision. The project owner cannot record it (CTL-01).')}</p>
              <div className="row"><StatusBadge value={task.gate.status} />{task.gate.decision && <StatusBadge value={task.gate.decision} />}<Link to={`/gates/${task.gate.id}`}>{t('Open gate review')}</Link></div>
            </Card>
          )}
          {task.status === 'Done' && task.kind === 'work' && (
            <Card>
              <CardHead title={t('Evaluation')} subtitle={t('Owner and evaluator are always different people.')} />
              {task.evaluation?.restricted ? <p className="small muted">{t('Evaluated. The verdict is visible only to the people involved and to authorized roles.')}</p> : task.evaluation ? (
                <div className="row"><StatusBadge value={task.evaluation.verdict} /><span>{task.evaluation.notes}</span><span className="muted">{fmtDate(task.evaluated_at)}</span></div>
              ) : (task.evaluator_id === me.user.id || (!task.evaluator_id && can('task.evaluate'))) && !mine ? (
                <div className="form-grid">
                  <Field label={t('Verdict')}><Select value={verdict.verdict} onChange={(e) => setVerdict({ ...verdict, verdict: e.target.value })} options={['Effective', 'Not effective'].map((v) => ({ value: v, label: t(v) }))} /></Field>
                  <Field label={t('Notes')}><Input value={verdict.notes} onChange={(e) => setVerdict({ ...verdict, notes: e.target.value })} /></Field>
                  <div className="full"><Button variant="primary" onClick={() => run(async () => { await post(`/tasks/${task.id}/evaluate`, verdict); toast.ok(t('Evaluation recorded.')); reload(); })}>{t('Record evaluation')}</Button></div>
                </div>
              ) : <p className="muted">{t('Waiting for {n} to evaluate.', { n: task.evaluator_name || t('the evaluator') })}</p>}
            </Card>
          )}
        </div>
        <div className="stack">
          <Card>
            <CardHead title={t('Accountability (RACSI)')} />
            <dl className="kv">
              <dt>{t('Owner')}</dt><dd>{task.owner_name || '—'}</dd><dt>{t('Evaluator')}</dt><dd>{task.evaluator_name || '—'}</dd>
              <dt>{t('Due date')}</dt><dd>{fmtDate(task.due_date)}</dd>
              {['R', 'A', 'C', 'S', 'I'].map((l) => [<dt key={`${l}t`}>{{ R: t('Responsible'), A: t('Accountable'), C: t('Consulted'), S: t('Supportive'), I: t('Informed') }[l]}</dt>, <dd key={`${l}d`}>{t(u[l] || '—')}</dd>])}
              <dt>{t('Macro processes')}</dt><dd>{(u.macroProcesses || '').split(', ').map((m) => <div key={m}><Link to={`/library/${m.split(' ')[0]}`}>{t(m)}</Link></div>)}</dd>
              <dt>{t('Module')}</dt><dd>{t(u.module)}</dd><dt>{t('Chain link')}</dt><dd>{t(u.chainLink)}</dd>
            </dl>
          </Card>
          {task.kind === 'work' && open && canWork && (
            <Card><CardHead title={t('AI assistance')} subtitle={t('Use a suggestion as a starting point for the result.')} />
              <AiSuggest projectId={task.project.id} recordType="task" recordId={task.id} preferred={['AIUC-20', 'AIUC-02', 'AIUC-12']} onUse={(txt) => setOutput((o) => (o ? `${o}\n\n${txt}` : txt))} />
            </Card>
          )}
        </div>
      </div>
      {rex && <RexForm projectId={task.project.id} taskId={task.id} processTag={task.run.e2e_id} defaultTitle={`${task.uft_id} ${t(task.name)}`} onClose={() => setRex(false)} />}
      {assign && <Assign task={task} onClose={() => setAssign(false)} onSaved={reload} />}
      {skip && <SkipModal onClose={() => setSkip(false)} onConfirm={(reason) => run(async () => { await post(`/tasks/${task.id}/skip`, { reason }); setSkip(false); reload(); })} />}
      {reopen && <JustifyModal title={t('Reopen task')} onCancel={() => setReopen(false)} onConfirm={(reason) => run(async () => { await post(`/tasks/${task.id}/reopen`, { reason }); setReopen(false); toast.ok(t('Task reopened.')); reload(); })} />}
    </div>
  );
}

function SkipModal({ onClose, onConfirm }) {
  const { t } = useI18n();
  const [r, setR] = useState('');
  return (
    <Modal title={t('Skip this task')} subtitle={t('Allowed in the Fast Track for tasks that depend on non-activated macro processes (Rule R2).')} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('Cancel')}</Button><Button variant="primary" disabled={!r.trim()} onClick={() => onConfirm(r)}>{t('Skip task')}</Button></>}>
      <Field label={t('Reason')} required><Textarea value={r} onChange={(e) => setR(e.target.value)} /></Field>
    </Modal>
  );
}
