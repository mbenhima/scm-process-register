// Typed step forms of a running task (FR-DA-SFM-01..10, FR-DA-MRE, FR-DA-DEU-01..06). Each step of the task shows
// the form its kind calls for: an inline multi-record table (records, matrices, objectives, plans...), a single
// form (decisions, reviews) or a notice for system steps. Field titles name the object of the step; reference
// items are picked from the Organization as "ID (name)" with a Custom value; AI proposals are validated row by row.
import { useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, del } from '../lib/api.js';
import { Btn, Icon, Field, StatusPill, Guard, JustifyDialog, useAction, AiBadge, Brief, Empty } from './ui.jsx';
import { InlineTable, ChoiceField } from './InlineTable.jsx';

/** Options for reference pickers, shown as "ID (name)" (FR-DA-DEU-04). */
function usePickers() {
  const { L } = useI18n(); const p = useData('/obs-pickers'); const k = useData('/records/KpiDefinition?limit=500');
  return useMemo(() => ({
    person: (p.data?.people || []).map(x => ({ value: x.name, label: `${x.name}${x.title ? ' (' + x.title + ')' : ''}` })),
    role: (p.data?.roles || []).map(x => ({ value: L(x.name), label: `${L(x.name)}${x.vacant ? ' · ∅' : ''}` })),
    kpi: (k.data?.items || []).map(x => ({ value: x.code || x.ref, label: `${x.code || x.ref} (${L(x.name)})` })),
  }), [p.data, k.data, L]);
}

/** Converts the step's typed fields into inline-table columns; titles come from the step's object (DEU-01). */
export function columnsOf(fields, L, pickers) {
  return fields.map(f => {
    const base = { key: f.key, label: L(f.label), required: !!f.required, help: L(f.help), min: f.min, max: f.max, carry: !!f.carry };
    if (f.type === 'select') return { ...base, type: 'select', custom: !!f.custom, options: (f.options || []).map(o => ({ value: String(o.value), label: L(o.label) || String(o.value) })) };
    if (['person', 'role', 'kpi'].includes(f.type)) return { ...base, type: 'select', custom: true, options: pickers[f.type] || [] };
    if (f.type === 'textarea') return { ...base, type: 'textarea', wide: true };
    return { ...base, type: ['number', 'date'].includes(f.type) ? f.type : 'text' };
  });
}

export function StepForms({ taskId, readOnly, onChanged }) {
  const { t, L } = useI18n(); const d = useData(`/tasks/${taskId}/steps`, [taskId]); const pickers = usePickers();
  const [open, setOpen] = useState(null);
  return (<Guard state={d}>{x => <div className="stack">
    {x.locked && <div className="notice grey"><Icon name="Lock" /><div className="small">{t('sfm.locked')}</div></div>}
    {x.steps.map((s, i) => { const isOpen = open === s.id || (open == null && i === x.steps.findIndex(y => !y.done));
      return <section key={s.id} className={`step-card ${s.done ? 'done' : ''}`}>
        <button type="button" className="step-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : s.id)}>
          <Icon name={s.done ? 'CircleCheck' : 'Circle'} className={s.done ? 'saved-ico' : 'muted-ico'} />
          <span className="step-title"><span className="mono xs">{s.id}</span> <span className="strong">{L(s.name)}</span><span className="xs muted"> · {L(s.form.kindLabel)} · {L(s.role)}</span></span>
          {s.form.pattern === 'inline' && <span className="pill xs">{t('sfm.rows', { n: s.count })}</span>}
          <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} /></button>
        {isOpen && <StepBody taskId={taskId} step={s} locked={x.locked} readOnly={readOnly || x.locked} pickers={pickers} onChanged={() => { d.reload(); onChanged?.(); }} />}
      </section>; })}
    {!x.steps.length && <Empty icon="ListChecks" title={t('sfm.noSteps')} />}
  </div>}</Guard>);
}

function StepBody({ taskId, step, readOnly, pickers, onChanged }) {
  const { t, L } = useI18n(); const act = useAction(); const { can } = useSession();
  const [reopen, setReopen] = useState(false); const [proposal, setProposal] = useState(null);
  const f = step.form; const cols = useMemo(() => columnsOf(f.fields, L, pickers), [f.fields, L, pickers]);
  const ro = readOnly || step.done;
  const base = `/tasks/${taskId}/steps/${step.id}`;
  const complete = async () => { await act(() => post(`${base}/complete`, {}), 'sfm.completed'); onChanged(); };
  const suggest = async () => { const r = await act(() => post(`${base}/suggest`, {})); setProposal(r); };
  const accept = async row => { await post(`${base}/rows`, { data: row, origin: 'ai' }); setProposal(p => ({ ...p, rows: p.rows.filter(x => x !== row) })); onChanged(); };
  return (<div className="step-body stack">
    <Brief brief={L(f.brief)} details={L(f.details)} />
    {f.register && <p className="xs muted"><Icon name="BookMarked" size={12} /> {t('sfm.feeds', { r: L(f.register.name) })}</p>}
    {f.pattern === 'system' && <div className="notice grey"><Icon name="Cpu" /><div className="small">{t('sfm.system')}</div></div>}
    {f.pattern === 'inline' && <InlineTable id={'step-' + f.kind} columns={cols} rows={step.rows} readOnly={ro} caption={L(f.object)} rowTitle={r => r.item || r.criterion || r.session || L(f.object)}
      countLabel={n => t('sfm.count', { n, o: L(f.object).toLowerCase() })} emptyText={t('sfm.emptyRows', { o: L(f.object).toLowerCase() })}
      onSaveRow={(data, id) => (id ? put(`${base}/rows/${id}`, { data }) : post(`${base}/rows`, { data }))} onDeleteRow={id => del(`${base}/rows/${id}`)} />}
    {f.pattern === 'form' && <StepFormFields base={base} fields={cols} values={step.record?.fields || {}} readOnly={ro} />}
    {proposal && <div className="card tint stack"><div className="row"><Icon name="Sparkles" /><span className="strong small">{t('sfm.aiProposal')}</span><AiBadge tier="Assistive" /><span className="pill xs">{proposal.engine}</span></div>
      {!proposal.rows.length ? <p className="small">{t('sfm.aiNothing')}</p> : <ul className="plain">{proposal.rows.map((r, i) => <li key={i} className="row" style={{ justifyContent: 'space-between' }}>
        <span className="small">{cols.slice(0, 3).map(c => r[c.key]).filter(Boolean).join(' · ')}</span><span className="row"><Btn size="sm" kind="primary" onClick={() => accept(r)}>{t('ai.accept')}</Btn><Btn size="sm" kind="ghost" onClick={() => setProposal(p => ({ ...p, rows: p.rows.filter(x => x !== r) }))}>{t('ai.reject')}</Btn></span></li>)}</ul>}
      <p className="xs muted">{t('sfm.aiCheckpoint')}</p></div>}
    {!readOnly && <div className="row">
      {!step.done && f.pattern === 'inline' && can('ai.run') && <Btn size="sm" icon="Sparkles" onClick={suggest}>{t('sfm.suggest')}</Btn>}
      <span className="spacer" />
      {step.done ? <Btn size="sm" icon="RotateCcw" onClick={() => setReopen(true)}>{t('sfm.reopen')}</Btn> : <Btn size="sm" kind="primary" icon="CircleCheck" onClick={complete}>{t('sfm.complete')}</Btn>}</div>}
    {step.done && <p className="xs muted"><StatusPill value="Completed" /> {step.record?.completed_at ? step.record.completed_at.slice(0, 10) : ''}</p>}
    {reopen && <JustifyDialog title={t('sfm.reopen')} onCancel={() => setReopen(false)} onConfirm={async n => { setReopen(false); await act(() => post(`${base}/reopen`, { _justification: n })); onChanged(); }} />}
  </div>);
}

/** Single form (decision, review): each field saved when the user leaves it; the draft is kept on screen. */
function StepFormFields({ base, fields, values, readOnly }) {
  const { t } = useI18n(); const { toast } = useSession();
  const [v, setV] = useState(() => ({ ...values })); const [errs, setErrs] = useState({}); const [state, setState] = useState('');
  const saveField = async key => {
    if (String(v[key] ?? '') === String(values[key] ?? '')) return;
    setState('saving');
    try { await put(`${base}/fields`, { fields: { [key]: v[key] } }); values[key] = v[key]; setErrs(e => { const n = { ...e }; delete n[key]; return n; }); setState('saved'); }
    catch (e) { setErrs(x => ({ ...x, [key]: e.params?.errors?.[key] ? t('mre.' + e.params.errors[key]) : e.message })); setState(''); toast(e.message, 'error'); }
  };
  return (<div className="form-grid">{fields.map(c => { const id = `${base}-${c.key}`.replace(/[^\w-]/g, '_');
    return <Field key={c.key} id={id} label={c.label} required={c.required} hint={c.help} error={errs[c.key]} className={c.wide ? 'full' : ''}>
      {readOnly ? <div className="ro-value">{v[c.key] || '—'}</div>
        : c.type === 'select' ? <ChoiceField id={id} col={c} value={v[c.key]} onChange={x => setV(s => ({ ...s, [c.key]: x }))} onCommit={() => setTimeout(() => saveField(c.key), 0)} t={t} invalid={!!errs[c.key]} />
        : c.type === 'textarea' ? <textarea id={id} className="input" rows={4} value={v[c.key] ?? ''} onChange={e => setV(s => ({ ...s, [c.key]: e.target.value }))} onBlur={() => saveField(c.key)} />
        : <input id={id} className="input" type={c.type === 'date' ? 'date' : 'text'} inputMode={c.type === 'number' ? 'decimal' : undefined} value={v[c.key] ?? ''} onChange={e => setV(s => ({ ...s, [c.key]: e.target.value }))} onBlur={() => saveField(c.key)} />}
    </Field>; })}
    <p className="xs muted full" aria-live="polite">{state === 'saving' ? t('mre.st.saving') : state === 'saved' ? t('mre.st.saved') : ''}</p></div>);
}

/** Readiness of an E2E instance: inputs, owner, RACSI, document template and KPIs (FR-DA-PDM). */
export function Readiness({ instanceId }) {
  const { t } = useI18n(); const d = useData(`/e2e-instances/${instanceId}/readiness`, [instanceId]);
  return (<Guard state={d}>{x => <ul className="plain readiness">{x.items.map(i => <li key={i.code} className="row"><Icon name={i.ok ? 'CircleCheck' : 'CircleAlert'} className={i.ok ? 'saved-ico' : 'err-ico'} size={16} /><span className="small">{t('readiness.' + i.code)}</span>{i.detail && <span className="xs muted">{i.detail}</span>}</li>)}</ul>}</Guard>);
}
void get;
