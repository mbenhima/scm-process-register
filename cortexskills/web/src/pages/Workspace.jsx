import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, patch, del, api, download } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Progress, Btn, Icon, Kpi, useAction, Modal, JustifyDialog, AiBadge, KV, Field, IconBadge, Tabs, Legend } from '../components/ui.jsx';
import { RecordEditor, useMeta } from '../components/Records.jsx';

export function ProjectWorkspace() {
  const { id } = useParams(); const { t, L, fmtNum } = useI18n(); const { can, setProject } = useSession(); const d = useData(`/projects/${id}/workspace`); const act = useAction(); const nav = useNavigate();
  const [rex, setRex] = useState(false); const [gate, setGate] = useState(null);
  useEffect(() => { setProject(id); }, [id]); // eslint-disable-line
  const closeProject = async () => { if (!window.confirm(t('ws.confirmClose'))) return; const r = await act(() => put(`/projects/${id}`, { status: 'Closed', _justification: t('ws.closeNote') })); d.reload(); if (r.rexPrompt) setRex(true); };
  return (<Guard state={d}>{x => { const p = x.project; const c = x.counts; return (<>
    <PageHead eyebrow={`${t('focus.' + p.focus)} · ${t('mode.' + p.mode)}${p.track ? ' · ' + p.track : ''} · ${p.plan_year}`} title={L(p.name)} subtitle={L(p.description)}>
      <Link className="btn" to={`/projects/${id}/gantt`}><Icon name="ChartGantt" />{t('nav.gantt')}</Link>
      <Link className="btn" to="/reports"><Icon name="FileText" />{t('nav.reports')}</Link>
      {can('templates.manage') && <Btn icon="LayoutTemplate" onClick={() => act(() => post(`/projects/${id}/save-as-template`), 'ws.templateSaved')}>{t('ws.saveTemplate')}</Btn>}
      {can('projects.manage') && p.status !== 'Closed' && <Btn icon="Archive" onClick={closeProject}>{t('ws.close')}</Btn>}</PageHead>
    <div className="grid g-4">
      <Kpi icon="Gauge" value={Math.round(p.progress) + '%'} label={t('ws.progress')} note={t('ws.tasksDone', { d: fmtNum(c.done), n: fmtNum(c.n) })} />
      <Kpi icon="Activity" value={fmtNum(c.wip)} label={t('status.In progress')} note={t('dash.blocked', { n: c.blocked })} emph={false} />
      <Kpi icon="CalendarClock" value={fmtNum(c.overdue)} label={t('dash.overdue')} emph={false} />
      <Kpi icon="Scale" value={x.complexity ? x.complexity.score : p.complexity} label={t('ws.complexity')} note={x.complexity?.chosen_track || t('mode.' + p.mode)} emph={false} />
    </div>
    {x.phases.filter(ph => ph.items.length).map(ph => { const state = ph.progress === 100 ? 'done' : ph.progress > 0 ? 'active' : ''; const gateRec = ph.checklists.find(c => c.gate_id);
      return (<section key={ph.no} className={`card phase ${state}`} style={{ marginTop: 'var(--sp-4)' }}>
        <div className="card-head"><div><div className="eyebrow">{ph.no ? t('ws.phase', { n: ph.no }) : t('ws.enablers')}</div><h3>{L(ph.name)}</h3></div>
          <div className="row"><span className="mono small">{ph.progress}%</span><div style={{ width: 160 }}><Progress value={ph.progress} lg label={L(ph.name)} /></div>
            {gateRec && <Btn size="sm" icon="DoorOpen" onClick={() => setGate(gateRec)}>{L(gateRec.gate_name)} · <StatusPill value={gateRec.decision || gateRec.state} /></Btn>}</div></div>
        {ph.items.map(e => <Link key={e.id} to={`/runs/${e.id}`} className="e2e-row"><span className="strong small">{e.e2e_id}</span>
          <span><E2EName id={e.e2e_id} /><br /><span className="xs muted">{e.owner_name} · {t('ws.tasksShort', { d: e.done, n: e.tasks })}{e.overdue ? ' · ' + t('ws.overdueN', { n: e.overdue }) : ''}</span></span>
          <Progress value={e.progress} label={e.e2e_id} /><StatusPill value={e.status} /></Link>)}
        {ph.checklists.filter(c => !c.gate_id).map(c => <div key={c.id} className="row small" style={{ marginTop: 'var(--sp-3)' }}><Icon name="ClipboardCheck" />{t('ws.standalone')}: <Btn size="sm" kind="ghost" onClick={() => setGate(c)}>{c.checklist_id} · {c.items.filter(i => i.done).length}/{c.items.length}</Btn></div>)}
      </section>); })}
    {gate && <GateDialog rec={gate} onClose={() => setGate(null)} onSaved={() => { setGate(null); d.reload(); }} />}
    {rex && <RexPrompt project={id} onClose={() => setRex(false)} />}
  </>); }}</Guard>);
}

const e2eCache = {};
function E2EName({ id }) { const { L } = useI18n(); const [n, setN] = useState(e2eCache[id]);
  useEffect(() => { if (!e2eCache.__p) e2eCache.__p = get('/catalog/e2e').then(list => { for (const e of list) e2eCache[e.id] = e.name; }); e2eCache.__p.then(() => setN(e2eCache[id])); }, [id]);
  return <span>{L(n) || id}</span>; }

function GateDialog({ rec, onClose, onSaved }) {
  const { t, L } = useI18n(); const act = useAction(); const [done, setDone] = useState(rec.items.filter(i => i.done).map(i => L(i.text) && i.text.en)); const [decide, setDecide] = useState(null); const [waiver, setWaiver] = useState(''); const [newItem, setNewItem] = useState('');
  const frozen = ['Submitted', 'Signed off'].includes(rec.state);
  const missing = rec.items.filter(i => i.mandatory && !done.includes(i.text.en));
  const saveItems = async () => { await act(() => patch(`/phase-checklists/${rec.id}`, { done, items: newItem ? [{ text: { en: newItem, fr: newItem, ar: newItem }, mandatory: false }] : undefined })); onSaved(); };
  const decision = async (dec, note) => { await act(() => patch(`/phase-checklists/${rec.id}`, { done, decision: dec, waiver: waiver || undefined, _justification: note })); onSaved(); };
  return (<Modal wide title={L(rec.gate_name) || rec.checklist_id} onClose={onClose} footer={!frozen ? <><Btn onClick={saveItems}>{t('common.save')}</Btn>{rec.gate_id && <Btn onClick={async () => { await act(() => patch(`/phase-checklists/${rec.id}`, { done, state: 'Submitted' })); onSaved(); }}>{t('gate.submit')}</Btn>}
    {rec.gate_id && ['Go', 'Hold', 'Recycle', 'No-Go'].map(dd => <Btn key={dd} kind={dd === 'Go' ? 'primary' : ''} onClick={() => setDecide(dd)}>{t('gate.decision.' + dd)}</Btn>)}</> : <Btn onClick={onClose}>{t('common.close')}</Btn>}>
    <div className="row" style={{ marginBottom: 'var(--sp-3)' }}><StatusPill value={rec.state} />{rec.decision && <StatusPill value={rec.decision} />}{rec.enforce && <span className="pill tint">{t('gate.enforced')}</span>}</div>
    <ul className="steps-list">{rec.items.map((i, k) => <li key={k}><input type="checkbox" disabled={frozen} checked={done.includes(i.text.en)} onChange={e => setDone(d => e.target.checked ? [...d, i.text.en] : d.filter(x => x !== i.text.en))} aria-label={L(i.text)} />
      <span style={{ flex: 1 }}>{L(i.text)}</span>{i.mandatory && <span className="pill s2 xs">{t('gate.mandatory')}</span>}{i.evidence && <span className="pill xs"><Icon name="Paperclip" size={12} />{t('gate.evidence')}</span>}</li>)}</ul>
    {!frozen && <div className="row" style={{ marginTop: 'var(--sp-3)', flexWrap: 'nowrap' }}><input className="input" placeholder={t('gate.addItem')} value={newItem} onChange={e => setNewItem(e.target.value)} aria-label={t('gate.addItem')} /></div>}
    {rec.decision_comment && <p className="small" style={{ marginTop: 'var(--sp-3)' }}><span className="strong">{t('col.justification')}:</span> {L(rec.decision_comment)}</p>}
    {missing.length > 0 && !frozen && rec.gate_id && <div className="notice" style={{ marginTop: 'var(--sp-3)' }}><Icon name="TriangleAlert" /><div>{t('gate.missing', { n: missing.length })}<Field label={t('gate.waiver')} id="wv"><input id="wv" className="input" value={waiver} onChange={e => setWaiver(e.target.value)} /></Field></div></div>}
    {decide && <JustifyDialog title={t('gate.decision.' + decide)} onCancel={() => setDecide(null)} onConfirm={n => { setDecide(null); decision(decide, n); }} />}
  </Modal>);
}

function RexPrompt({ project, onClose }) {
  const { t } = useI18n(); const meta = useMeta(); const def = meta?.find(m => m.name === 'RexEntry'); const nav = useNavigate();
  if (!def) return null;
  return (<>{/* Fill now or skip: the closure is already saved (FR-DA-REX-08) */}
    <RecordEditor def={def} project={project} record={{ _new: true, category: '', rating: 4 }} onClose={onClose} onSaved={() => { onClose(); nav('/gov/rex'); }} />
    <div className="toasts" style={{ bottom: 'auto', top: 80 }}><div className="toast"><Icon name="Lightbulb" />{t('rex.prompt')} <Btn size="sm" onClick={onClose}>{t('rex.skip')}</Btn></div></div></>);
}

export function E2EInstance() {
  const { id } = useParams(); const [sp, setSp] = useSearchParams(); const { t, L, fmtDate } = useI18n(); const d = useData(`/e2e-instances/${id}`); const taskId = sp.get('task');
  return (<Guard state={d}>{x => <>
    <PageHead eyebrow={`${x.e2e.id} · ${L(x.e2e.type)}`} title={L(x.e2e.name)} subtitle={L(x.e2e.goal)}>
      <Link className="btn" to={`/projects/${x.project.id}`}><Icon name="ArrowLeft" />{L(x.project.name)}</Link><Link className="btn" to={`/process/e2e/${x.e2e.id}`}><Icon name="Workflow" />{t('run.spec')}</Link></PageHead>
    <div className="grid split"><Card title={t('run.tasks')}>
      <DataTable search={false} rows={x.tasks} onRow={r => setSp({ task: r.id })} columns={[
        { key: 'sort', label: '#', num: true }, { key: 'uft_id', label: t('col.task'), render: r => <span><span className="strong">{r.uft_id}</span><br /><UftName id={r.uft_id} /></span> },
        { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> }, { key: 'owner_name', label: t('col.owner') }, { key: 'due', label: t('col.due'), render: r => <span className={r.status !== 'Completed' && new Date(r.due_date) < new Date() ? 'strong' : ''}>{fmtDate(r.due_date)}</span> }]} /></Card>
      <Card title={t('run.card')}><KV items={[[t('run.trigger'), L(x.e2e.trigger)], [t('run.terminal'), L(x.e2e.terminal)], [t('run.feeds'), x.e2e.feedsInto || '—'], [t('run.consumes'), x.e2e.consumes || '—'], [t('run.supported'), x.e2e.supportedBy || '—'], [t('run.mps'), x.e2e.mps.join(', ')], [t('run.modules'), L(x.e2e.modules)],
        [t('col.progress'), <span className="row"><Progress value={x.instance.progress} /><span>{x.instance.progress}%</span></span>], [t('col.status'), <StatusPill value={x.instance.status} />]]} /></Card></div>
    {taskId && <TaskPanel id={taskId} project={x.project} onClose={() => setSp({})} onChanged={d.reload} />}
  </>}</Guard>);
}
const uftCache = {};
function UftName({ id }) { const { L } = useI18n(); const [n, setN] = useState(uftCache[id]);
  useEffect(() => { if (!uftCache.__p) uftCache.__p = get('/catalog/uft').then(list => { for (const u of list) uftCache[u.id] = u.name; }); uftCache.__p.then(() => setN(uftCache[id])); }, [id]);
  return <span className="small">{L(n)}</span>; }

function TaskPanel({ id, project, onClose, onChanged }) {
  const { t, L, fmtDate, fmtNum } = useI18n(); const { can, me } = useSession(); const act = useAction(); const d = useData(`/tasks/${id}`, [id]); const dir = useData('/directory'); const uc = useData('/ai/use-cases');
  const [out, setOut] = useState(null); const [steps, setSteps] = useState(null); const [reopen, setReopen] = useState(false); const [ai, setAi] = useState(null); const [rex, setRex] = useState(false); const fileRef = useRef(null); const [tab, setTab] = useState('work');
  useEffect(() => { if (d.data) { setOut(L(d.data.task.output) || ''); setSteps(d.data.task.steps.filter(s => s.done).map(s => s.id)); } }, [d.data, L]);
  const readOnly = !can('tasks.execute') || me.foreignReadOnly;
  const save = async (extra = {}) => { const r = await act(() => patch(`/tasks/${id}`, { output: out, steps, ...extra })); d.reload(); onChanged(); if (r.rexPrompt) setRex(true); return r; };
  const upload = async files => { const fd = new FormData(); for (const f of files) fd.append('files', f); await act(() => api(`/attachments/task/${id}`, { method: 'POST', body: fd }), 'run.uploaded'); d.reload(); };
  const runAi = async u => { const r = await act(() => post('/ai/generate', { code: u.code, project_id: project.id }, { llm: true }), null); setAi(r); };
  const aiOutcome = async (outcome, text) => { await post('/ai/usage', { use_case: ai.useCase.code, outcome, project_id: project.id, record_ref: id, source: ai.source, confidence: ai.confidence }); if (outcome !== 'Rejected') { setOut(o => (o ? o + '\n' : '') + text); await patch(`/tasks/${id}`, { ai_used: true }).catch(() => {}); } setAi(null); };
  return (<div className="drawer" role="dialog" aria-modal="false" aria-label={t('run.task')}>
    <Guard state={d}>{x => { const tk = x.task; const u = x.uft; const linkedUc = (uc.data || []).filter(c => u.steps.includes(c.step) && c.effective);
      return (<><div className="card-head" style={{ padding: 'var(--sp-4) var(--sp-5)', margin: 0, borderBottom: '1px solid var(--pa-grey-line)' }}>
        <div><div className="eyebrow">{u.id} · {u.stepId} · {u.bpmn}</div><h3>{L(u.name)}</h3></div><Btn icon="X" kind="ghost" aria-label={t('common.close')} onClick={onClose} /></div>
        <div className="drawer-body stack">
          <div className="row"><StatusPill value={tk.status} /><span className="small muted">{t('col.due')}: {fmtDate(tk.due_date)}</span>{u.ai && <AiBadge tier="Assistive" />}</div>
          <p className="small">{L(u.description)}</p>
          <Tabs value={tab} onChange={setTab} tabs={[{ id: 'work', label: t('run.work') }, { id: 'racsi', label: 'RACSI' }, { id: 'files', label: t('run.files'), count: x.attachments.length }, { id: 'history', label: t('run.history') }]} />
          {tab === 'work' && <>
            <div className="guidance"><span className="label">{t('run.whatToType')}</span>{L(tk.guidance)}</div>
            <KV items={[[t('run.input'), `${L(u.input)} — ${L(u.supplier)}`], [t('run.output'), `${L(u.output)} → ${L(u.beneficiary)}`]]} />
            <div><div className="label">{t('run.steps')}</div><ul className="steps-list">{x.steps.map(s => <li key={s.id}><input type="checkbox" disabled={readOnly || tk.status === 'Completed'} checked={steps?.includes(s.id) || false} onChange={e => setSteps(v => e.target.checked ? [...v, s.id] : v.filter(y => y !== s.id))} aria-label={L(s.name)} />
              <span style={{ flex: 1 }}><span className="strong small">{s.id}</span> {L(s.name)}<br /><span className="xs muted">{L(s.description)} · {L(s.role)} · {t('stepType.' + s.type)}</span></span></li>)}</ul></div>
            <Field label={t('run.outputLabel')} id="out"><textarea id="out" className="input" rows={5} disabled={readOnly || tk.status === 'Completed'} value={out ?? ''} onChange={e => setOut(e.target.value)} placeholder={L(tk.guidance)} /></Field>
            {linkedUc.length > 0 && !readOnly && <div className="card flat"><div className="label" style={{ marginBottom: 8 }}>{t('run.aiHelp')}</div><div className="row">{linkedUc.map(c => <Btn key={c.id} size="sm" icon="Sparkles" onClick={() => runAi(c)}>{L(c.name)} <AiBadge tier={c.tier} /></Btn>)}</div></div>}
            {ai && <div className="card tint stack"><div className="row"><Icon name="Sparkles" /><span className="strong small">{ai.label}</span><AiBadge tier={ai.useCase.tier} /><span className="pill xs">{ai.source}</span><span className="xs muted">{t('ai.confidence')} {Math.round(ai.confidence * 100)}%</span></div>
              <p className="small">{ai.text.startsWith('ai.') ? t(ai.text) : ai.text}</p><ul className="small">{ai.items.map((i, k) => <li key={k}><span className="strong">{i.label}</span>{i.detail && ` — ${i.detail.startsWith?.('ai.') ? t(i.detail) : i.detail}`}</li>)}</ul>
              {ai.references?.length > 0 && <p className="xs muted">{t('ai.references')}: {ai.references.map(r => r.title).join(' · ')}</p>}<p className="xs">{L(ai.useCase.checkpoint)}</p>
              <div className="row"><Btn size="sm" kind="primary" onClick={() => aiOutcome('Accepted', [ai.text.startsWith('ai.') ? t(ai.text) : ai.text, ...ai.items.map(i => '• ' + i.label)].join('\n'))}>{t('ai.accept')}</Btn><Btn size="sm" onClick={() => aiOutcome('Edited', ai.items.map(i => '• ' + i.label).join('\n'))}>{t('ai.edit')}</Btn><Btn size="sm" onClick={() => aiOutcome('Rejected')}>{t('ai.reject')}</Btn></div></div>}
            <div className="form-grid">
              <Field label={t('col.owner')} id="own"><select id="own" className="input" disabled={readOnly || !can('projects.manage')} value={tk.owner_id || ''} onChange={e => save({ owner_id: e.target.value })}>{(dir.data || []).map(p => <option key={p.id} value={p.id}>{p.name} — {p.title}</option>)}</select></Field>
              <Field label={t('col.evaluator')} id="evl" hint={t('run.segregation')}><select id="evl" className="input" disabled={readOnly || !can('projects.manage')} value={tk.evaluator_id || ''} onChange={e => save({ evaluator_id: e.target.value })}>{(dir.data || []).map(p => <option key={p.id} value={p.id}>{p.name} — {p.title}</option>)}</select></Field></div>
          </>}
          {tab === 'racsi' && <DataTable search={false} rows={x.racsi} columns={[{ key: 'letter', label: t('col.role'), render: r => <span className="pill dark">{r.letter}</span> }, { key: 'assignee', label: t('col.assignee'), text: r => r.assignee }]} />}
          {tab === 'files' && <div className="stack"><div className="card flat" style={{ borderStyle: 'dashed', textAlign: 'center' }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!readOnly) upload(e.dataTransfer.files); }}>
            <p className="small">{t('run.drop')}</p><input ref={fileRef} type="file" multiple hidden onChange={e => upload(e.target.files)} /><Btn icon="Upload" disabled={readOnly || tk.status === 'Completed'} onClick={() => fileRef.current.click()}>{t('run.upload')}</Btn></div>
            {x.attachments.map(a => <div key={a.id} className="row" style={{ justifyContent: 'space-between' }}><span className="small"><Icon name="Paperclip" size={14} /> {a.filename} <span className="muted">· {fmtNum(Math.round(a.size / 1024))} KB · {a.author} · {fmtDate(a.created_at)}</span></span>
              <span className="row"><Btn size="sm" icon="Download" aria-label={t('common.download')} onClick={() => download(`/attachments/${a.id}/download`, a.filename)} />{tk.status !== 'Completed' && !readOnly && <Btn size="sm" icon="Trash2" kind="ghost" aria-label={t('common.delete')} onClick={async () => { await act(() => del(`/attachments/${a.id}`), 'common.deleted'); d.reload(); }} />}</span></div>)}</div>}
          {tab === 'history' && <ul className="small">{x.history.map((h, k) => <li key={k}>{fmtDate(h.created_at)} · {h.user_name} · {h.action} {h.after_val?.status ? '→ ' + t('status.' + h.after_val.status) : ''}{h.justification ? ` — ${h.justification}` : ''}</li>)}</ul>}
        </div>
        {!readOnly && <div className="dialog-foot">{tk.status === 'Completed' ? <Btn icon="RotateCcw" onClick={() => setReopen(true)}>{t('run.reopen')}</Btn> : <>
          <Btn onClick={() => save(tk.status === 'Not started' ? { status: 'In progress' } : {})}>{tk.status === 'Not started' ? t('run.start') : t('common.save')}</Btn>
          {tk.status !== 'Blocked' && tk.status !== 'Not started' && <Btn icon="OctagonAlert" onClick={() => save({ status: 'Blocked' })}>{t('run.block')}</Btn>}
          <Btn kind="primary" icon="CircleCheck" disabled={!out?.trim()} onClick={() => save({ status: 'Completed' })}>{t('run.complete')}</Btn></>}</div>}
        {reopen && <JustifyDialog title={t('run.reopen')} onCancel={() => setReopen(false)} onConfirm={async n => { setReopen(false); await save({ status: 'In progress', _justification: n }); }} />}
        {rex && <Modal title={t('rex.promptTitle')} onClose={() => setRex(false)} footer={<><Btn onClick={() => setRex(false)}>{t('rex.skip')}</Btn><Link className="btn primary" to="/gov/rex?new=1">{t('rex.fillNow')}</Link></>}><p>{t('rex.promptTask')}</p></Modal>}
      </>); }}</Guard></div>);
}

export function Gantt() {
  const { id } = useParams(); const { project, projects } = useSession(); const pid = id || project || projects[0]?.id; const { t, L, fmtDate, dir } = useI18n();
  const d = useData(pid ? `/projects/${pid}/gantt` : null); const [open, setOpen] = useState({});
  return (<><PageHead eyebrow={t('navGroup.governance')} title={t('nav.gantt')} subtitle={t('gantt.subtitle')}>{d.data && <Btn icon="Printer" onClick={() => window.print()}>{t('gantt.export')}</Btn>}</PageHead>
    {!pid ? <p className="muted">{t('gantt.pick')}</p> : <Guard state={d}>{x => {
      const all = x.items.flatMap(p => [p, ...p.children, ...p.children.flatMap(c => c.children)]);
      const min = Math.min(...all.map(i => +new Date(i.start))), max = Math.max(...all.map(i => +new Date(i.end))); const span = max - min || 1;
      const pos = i => { const l = ((+new Date(i.start) - min) / span) * 100; const w = Math.max(0.6, ((+new Date(i.end) - +new Date(i.start)) / span) * 100); return dir === 'rtl' ? { right: l + '%', width: w + '%' } : { left: l + '%', width: w + '%' }; };
      const row = (i, depth) => <div key={i.id} className="gantt-row"><div style={{ paddingInlineStart: depth * 16 }} className={`gantt-label ${depth < 2 ? 'strong' : ''}`}>{i.children?.length ? <button className="btn ghost sm icon" aria-expanded={!!open[i.id]} aria-label={t('gantt.toggle')} onClick={() => setOpen(o => ({ ...o, [i.id]: !o[i.id] }))}><Icon name={open[i.id] ? 'ChevronDown' : 'ChevronRight'} size={12} /></button> : null}<span className="gantt-name" title={typeof i.name === 'object' ? L(i.name) : i.name}>{typeof i.name === 'object' ? L(i.name) : i.name}</span>{i.percent != null && <span className="muted">{i.percent}%</span>}</div>
        <div className="gantt-track"><span className={`gantt-bar ${i.kind === 'task' ? i.status : 'summary'}`} style={pos(i)} title={`${fmtDate(i.start)} → ${fmtDate(i.end)}`} /></div></div>;
      return (<Card title={L(x.project.name)}><div className="gantt">{x.items.map(p => <div key={p.id}>{row(p, 0)}{open[p.id] && p.children.map(c => <div key={c.id}>{row(c, 1)}{open[c.id] && c.children.map(tk => row(tk, 2))}</div>)}</div>)}</div>
        <Legend items={[{ label: t('gantt.planned'), color: 'var(--pa-grey-line)' }, { label: t('status.In progress'), color: 'var(--pa-orange)' }, { label: t('status.Completed'), color: 'var(--pa-status-5)' }, { label: t('status.overdue'), color: 'var(--pa-status-1)' }, { label: t('gantt.summary'), color: 'var(--pa-grey-dark)' }]} />
        <p className="caption">{t('gantt.caption', { from: fmtDate(min), to: fmtDate(max) })}</p></Card>);
    }}</Guard>}</>);
}
