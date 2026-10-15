// Typed step forms of a running task (FR-DA-SFM-01..10, FR-DA-MRE, FR-DA-DEU-01..06). Each step of the task shows
// the form its kind calls for: an inline multi-record table (records, matrices, objectives, plans...), a single
// form (decisions, reviews) or a notice for system steps. Field titles name the object of the step; reference
// items are picked from the Organization as "ID (name)" with a Custom value; AI proposals are validated row by row.
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, del } from '../lib/api.js';
import { Btn, Icon, Field, StatusPill, Guard, JustifyDialog, useAction, AiBadge, Brief, Empty, MultiSelect, splitMulti } from './ui.jsx';
import { InlineTable, ChoiceField } from './InlineTable.jsx';
import { QuestionnaireStep, DocPanel, FlowPanel } from './StepModules.jsx';

/** Options for reference pickers, shown as "ID (name)" (FR-DA-DEU-04). */
function usePickers() {
  const { L } = useI18n(); const p = useData('/obs-pickers'); const k = useData('/records/KpiDefinition?limit=500');
  return useMemo(() => ({
    person: (p.data?.people || []).map(x => ({ value: x.name, label: `${x.name}${x.title ? ' (' + x.title + ')' : ''}` })),
    role: (p.data?.roles || []).map(x => ({ value: L(x.name), label: `${L(x.name)}${x.vacant ? ' · ∅' : ''}` })),
    kpi: (k.data?.items || []).map(x => ({ value: x.code || x.ref, label: `${x.code || x.ref} (${L(x.name)})` })),
    function: (p.data?.functions || []).map(x => ({ value: L(x.name), label: x.code ? `${x.code} (${L(x.name)})` : L(x.name) })),
  }), [p.data, k.data, L]);
}

/** Converts the step's typed fields into inline-table columns; titles come from the step's object (DEU-01). */
export function columnsOf(fields, L, pickers) {
  return fields.map(f => {
    const base = { key: f.key, label: L(f.label), required: !!f.required, help: L(f.help), min: f.min, max: f.max, carry: !!f.carry, default: f.default, width: f.width, ...(f.total === false ? { total: false } : {}) };
    const opts = (f.options || []).map(o => ({ value: String(o.value), label: L(o.label) || String(o.value) }));
    if (f.type === 'select') return { ...base, type: 'select', custom: !!f.custom, options: opts };
    if (f.type === 'multi') return { ...base, type: 'multi', custom: !!f.custom, options: opts, width: f.width || 220 };
    if (['person', 'role', 'kpi', 'function'].includes(f.type)) return { ...base, type: f.multi ? 'multi' : 'select', custom: true, options: pickers[f.type] || [], ...(f.type === 'function' && !f.width ? { width: 190 } : {}) };
    if (f.type === 'email') return { ...base, type: 'text', width: f.width || 220, validate: v => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? L({ en: 'Enter a valid e-mail address.', fr: 'Saisissez une adresse e-mail valide.', ar: 'أدخل بريدًا إلكترونيًا صالحًا.' }) : null) };
    if (f.type === 'phone') return { ...base, type: 'text', width: f.width || 170, validate: v => (v && String(v).replace(/[^\d]/g, '').length < 9 ? L({ en: 'Enter the number with its country code, e.g. +212 6 12 34 56 78.', fr: 'Saisissez le numéro avec l’indicatif, par exemple +212 6 12 34 56 78.', ar: 'أدخل الرقم مع رمز البلد، مثل ‎+212 6 12 34 56 78.' }) : null) };
    if (f.type === 'boolean') return { ...base, type: 'boolean', width: 88 };
    if (f.type === 'textarea') return { ...base, type: 'textarea', wide: true };
    return { ...base, type: ['number', 'date'].includes(f.type) ? f.type : 'text' };
  });
}

export function StepForms({ taskId, readOnly, onChanged, context, parent }) {
  const { t, L } = useI18n(); const d = useData(`/tasks/${taskId}/steps`, [taskId]); const pickers = usePickers();
  const [open, setOpen] = useState(null);
  return (<Guard state={d}>{x => <div className="stack">
    {x.locked && <div className="notice grey"><Icon name="Lock" /><div className="small">{t('sfm.locked')}</div></div>}
    {x.steps.map((s, i) => { const isOpen = open === s.id || (open == null && i === x.steps.findIndex(y => !y.done));
      return <section key={s.id} className={`step-card ${s.done ? 'done' : ''}`}>
        <button type="button" className="step-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : s.id)}>
          <Icon name={s.done ? 'CircleCheck' : 'Circle'} className={s.done ? 'saved-ico' : 'muted-ico'} />
          <span className="step-title"><span className="mono xs">{s.id}</span> <span className="strong">{L(s.name)}</span><span className="xs muted"> · {L(s.form.kindLabel)} · {L(s.role)}</span></span>
          {(s.form.pattern === 'inline' || s.form.pattern === 'master-detail') && <span className="pill xs">{t('sfm.rows', { n: s.count })}</span>}
          <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} /></button>
        {isOpen && <StepBody taskId={taskId} projectId={x.project?.id} questionnaireId={x.questionnaire} parent={parent} step={s} locked={x.locked} readOnly={readOnly || x.locked} pickers={pickers} context={context} onChanged={() => { d.reload(); onChanged?.(); }} />}
      </section>; })}
    {!x.steps.length && <Empty icon="ListChecks" title={t('sfm.noSteps')} />}
  </div>}</Guard>);
}

function StepBody({ taskId, projectId, questionnaireId, parent, step, locked, readOnly, pickers, onChanged, context }) {
  const { t, L } = useI18n(); const act = useAction(); const { can } = useSession();
  const [reopen, setReopen] = useState(false); const [proposal, setProposal] = useState(null); const [formProp, setFormProp] = useState(null); const [formKey, setFormKey] = useState(0);
  const f = step.form; const inline = f.pattern === 'inline' || f.pattern === 'master-detail'; const single = f.pattern === 'form' || f.pattern === 'sectioned'; const cols = useMemo(() => columnsOf(f.fields, L, pickers), [f.fields, L, pickers]);
  const ro = readOnly || step.done;
  const base = `/tasks/${taskId}/steps/${step.id}`;
  const complete = async () => { await act(() => post(`${base}/complete`, {}), 'sfm.completed'); onChanged(); };
  // AI through the use case linked to the step only (FR-DA-AI-12, FR-DA-AIP-01): its tier, engine and sources are shown,
  // and each proposal is accepted, edited or rejected by a person, the outcome logged (FR-DA-AI-07, FR-DA-AIP-10).
  const ucs = step.aiUseCases || []; const runnable = ucs.find(u => u.effective);
  const suggest = async code => { const r = await act(() => post(`${base}/suggest`, { use_case: code || runnable?.code }), null); if (r.fields) return setFormProp(r); setProposal({ ...r, rows: (r.rows || []).map((x, i) => ({ _k: i, data: x, orig: x })) }); };
  // Template of the library: rows (or form values) proposed from the library and the project's data, accepted one by one.
  const fromTemplate = async () => { const r = await act(() => post(`${base}/template`, {}), null); if (r.fields) return setFormProp(r); setProposal({ ...r, useCase: null, rows: (r.rows || []).map((x, i) => ({ _k: i, data: x, orig: x })) }); };
  const applyForm = async () => { const vals = Object.fromEntries(Object.entries(formProp.fields).filter(([k]) => f.fields.some(x => x.key === k))); await act(() => put(`${base}/fields`, { fields: vals }), 'flow.applied'); if (formProp.useCase) post('/ai/usage', { use_case: formProp.useCase.code, outcome: 'Accepted', project_id: projectId, record_ref: formProp.recordRef, source: 'built-in', spec_version: formProp.specVersion, engine: formProp.engine, model: formProp.model, n: 1 }).catch(() => {}); setFormProp(null); setFormKey(k => k + 1); onChanged(); };
  const hasTpl = (f.fill || []).includes('template');
  const logOutcome = (outcome, n = 1) => proposal?.useCase && post('/ai/usage', { use_case: proposal.useCase.code, outcome, project_id: projectId, record_ref: proposal.recordRef, source: proposal.engine === 'live' ? 'live:' + proposal.model : 'built-in', spec_version: proposal.specVersion, engine: proposal.engine, model: proposal.model, n }).catch(() => {});
  const suggestUseCase = async () => { await act(() => post('/ai/use-cases/suggest', { step_id: step.id }), 'aiuc.suggested'); onChanged(); };
  const missingFns = f.kind === 'levels' ? (pickers.function || []).map(o => o.value).filter(v => !(step.rows || []).some(r => r.function === v)) : [];
  const addAllFunctions = async () => { await act(async () => { for (const fn of missingFns) await post(`${base}/rows`, { data: { function: fn, ms: false, mo: false, op: false } }); }, 'mre.functionsAdded'); onChanged(); };
  const changed = r => Object.keys(r.data).some(k => String(r.data[k] ?? '') !== String(r.orig[k] ?? ''));
  const accept = async r => { await act(() => post(`${base}/rows`, { data: r.data, origin: proposal.useCase ? 'ai' : 'library' }), null); logOutcome(changed(r) ? 'Edited' : 'Accepted'); setProposal(p => ({ ...p, rows: p.rows.filter(x => x._k !== r._k) })); onChanged(); };
  const reject = r => { logOutcome('Rejected'); setProposal(p => ({ ...p, rows: p.rows.filter(x => x._k !== r._k) })); };
  const editProp = (r, k, v) => setProposal(p => ({ ...p, rows: p.rows.map(x => (x._k === r._k ? { ...x, data: { ...x.data, [k]: v } } : x)) }));
  return (<div className="step-body stack">
    <Brief brief={L(f.brief)} details={L(f.details)} />
    {f.register && <p className="xs muted"><Icon name="BookMarked" size={12} /> {t('sfm.feeds', { r: L(f.register.name) })}</p>}
    {f.pattern === 'system' && <div className="notice grey"><Icon name="Cpu" /><div className="small">{t('sfm.system')}</div></div>}
    {f.pattern === 'module' && f.module === 'document' && <DocPanel projectId={projectId} code={f.doc} report={f.report} readOnly={ro} onChanged={onChanged} />}
    {f.pattern === 'module' && f.module === 'flow' && <FlowPanel taskId={taskId} stepId={step.id} readOnly={readOnly} onChanged={onChanged} />}
    {(f.fill || []).length > 0 && !ro && <p className="xs muted"><Icon name="Info" size={12} /> {t('flow.ways')}</p>}
    {f.pattern === 'module' && f.module !== 'document' && f.module !== 'flow' && <QuestionnaireStep module={f.module} questionnaireId={questionnaireId} projectId={projectId} form={f} readOnly={ro} onChanged={onChanged} />}
    {f.questionnaire === 'create' && questionnaireId && <p className="small"><Icon name="ClipboardList" size={14} /> {t('qstep.created')} <Link to={`/questionnaires/${questionnaireId}`}>{t('qstep.open')}</Link></p>}
    {inline && <InlineTable id={'step-' + f.kind} context={[context, `${step.id} · ${L(step.name)}`].filter(Boolean).join(' · ')} pasteTarget={{ kind: 'step', task: taskId, step: step.id }} onPasted={onChanged}
      readOnlyReason={locked ? t('sfm.locked') : step.done ? t('paste.stepDone') : readOnly ? t('paste.readOnly') : null} newInEditor={f.pattern === 'master-detail'} columns={cols} rows={step.rows} readOnly={ro} caption={L(f.object)} rowTitle={r => r.function || r.item || r.criterion || r.session || L(f.object)}
      toolbarExtra={f.kind === 'levels' && !ro && missingFns.length > 0 ? <Btn size="sm" icon="ListPlus" onClick={addAllFunctions}>{t('mre.addAllFunctions', { n: missingFns.length })}</Btn> : null}
      emptyActions={!ro ? <span className="row" style={{ gap: 6 }}>{hasTpl && <Btn size="sm" icon="LibraryBig" onClick={fromTemplate} data-tip={t('flow.templateTip')}>{t('flow.fromTemplate')}</Btn>}{can('ai.run') && runnable && <Btn size="sm" icon="Sparkles" onClick={() => suggest()}>{t('sfm.suggest')}</Btn>}</span> : null}
      countLabel={n => t('sfm.count', { n, o: L(f.object).toLowerCase() })} emptyText={t('sfm.emptyRows', { o: L(f.object).toLowerCase() })}
      onSaveRow={(data, id, o) => (id ? put(`${base}/rows/${id}`, { data, expected: o?.expected || undefined }) : post(`${base}/rows`, { data }))} parent={parent} onDeleteRow={id => del(`${base}/rows/${id}`)} />}
    {inline && f.panel && <FlowPanel taskId={taskId} stepId={step.id} readOnly={readOnly} onChanged={onChanged} />}
    {single && <StepFormFields key={formKey} base={base} fields={cols} values={step.record?.fields || {}} readOnly={ro} objectLabel={L(f.object)} />}
    {formProp && <div className="card tint stack form-proposal" role="region" aria-label={formProp.useCase ? t('sfm.aiProposal') : t('flow.templateProposal')}>
      <div className="row"><Icon name={formProp.useCase ? 'Sparkles' : 'LibraryBig'} /><span className="strong small">{formProp.useCase ? t('sfm.aiProposal') : t('flow.templateProposal')}</span>{formProp.useCase && <><AiBadge tier={formProp.useCase.tier} /><Link className="pill xs" to={`/ai/use-cases/${formProp.useCase.id}`}>{formProp.useCase.code}</Link></>}</div>
      {formProp.useCase && <p className="xs ai-label"><Icon name="TriangleAlert" size={12} /> {t('ai.reviewLabel')}</p>}
      <dl>{f.fields.filter(x => formProp.fields[x.key] != null && formProp.fields[x.key] !== '').map(x => { const c = cols.find(y => y.key === x.key); const v = String(formProp.fields[x.key]); return <div key={x.key} style={{ display: 'contents' }}><dt>{c?.label}</dt><dd>{c?.options ? (c.options.find(o => o.value === v)?.label ?? v) : v}</dd></div>; })}</dl>
      <div className="row"><Btn size="sm" kind="primary" icon="Check" onClick={applyForm}>{t('flow.applyValues')}</Btn><Btn size="sm" kind="ghost" onClick={() => { if (formProp.useCase) post('/ai/usage', { use_case: formProp.useCase.code, outcome: 'Rejected', project_id: projectId, record_ref: formProp.recordRef, source: 'built-in', spec_version: formProp.specVersion, engine: formProp.engine, model: formProp.model, n: 1 }).catch(() => {}); setFormProp(null); }}>{t('ai.reject')}</Btn></div></div>}
    {proposal && <div className="card tint stack ai-proposal" role="region" aria-label={proposal.useCase ? t('sfm.aiProposal') : t('flow.templateProposal')}>
      {proposal.useCase ? <div className="row"><Icon name="Sparkles" /><span className="strong small">{t('sfm.aiProposal')}</span><AiBadge tier={proposal.useCase.tier} />
        <Link className="pill xs" to={`/ai/use-cases/${proposal.useCase.id}`}>{proposal.useCase.code}</Link>
        <span className="pill xs" data-tip={t('ai.engineTip')}>{proposal.engine === 'live' ? t('ai.engine.live', { m: proposal.model }) : t('ai.engine.builtIn')}</span>
        <span className="spacer" /><Link className="xs" to={`/ai/use-cases/${proposal.useCase.id}?tab=prompt`}><Icon name="FileCode2" size={12} /> {t('ai.viewPrompt')}</Link></div>
        : <div className="row"><Icon name="LibraryBig" /><span className="strong small">{t('flow.templateProposal')}</span></div>}
      {proposal.useCase && <p className="xs ai-label"><Icon name="TriangleAlert" size={12} /> {t('ai.reviewLabel')}</p>}
      {proposal.reason && <p className="xs muted" role="status">{t('ai.reason.' + proposal.reason, { d: proposal.reasonDetail || '' })} {can('aisettings.manage') && proposal.reason !== 'promptVariable' && <Link to="/ai/settings">{t('ai.modelSettings')}</Link>}</p>}
      {!proposal.rows.length ? <p className="small">{t(proposal.emptyReason === 'allCovered' ? 'sfm.aiAllCovered' : 'sfm.aiNothing')}</p> : <>
        <ul className="plain stack ai-rows">{proposal.rows.map(r => <li key={r._k} className="row ai-row">
          {cols.filter(c => c.type !== 'boolean').slice(0, 3).map(c => <input key={c.key} className="input sm" aria-label={`${c.label} — ${t('sfm.aiProposal')}`} value={String(r.data[c.key] ?? '')} onChange={e => editProp(r, c.key, e.target.value)} />)}
          {cols.filter(c => c.type === 'boolean').map(c => <label key={c.key} className="check xs"><input type="checkbox" checked={r.data[c.key] === true || r.data[c.key] === 'true'} onChange={e => editProp(r, c.key, e.target.checked)} />{c.label.split(' ')[0]}</label>)}
          <span className="spacer" />{changed(r) && <span className="pill xs">{t('ai.edited')}</span>}
          <Btn size="sm" kind="primary" onClick={() => accept(r)}>{changed(r) ? t('ai.addEdited') : t('ai.accept')}</Btn><Btn size="sm" kind="ghost" onClick={() => reject(r)}>{t('ai.reject')}</Btn></li>)}</ul>
        <div className="row"><Btn size="sm" icon="CheckCheck" onClick={async () => { for (const r of proposal.rows) await accept(r); }}>{t('ai.acceptAll', { n: proposal.rows.length })}</Btn><Btn size="sm" kind="ghost" onClick={() => { logOutcome('Rejected', proposal.rows.length); setProposal(p => ({ ...p, rows: [] })); }}>{t('ai.rejectAll')}</Btn></div></>}
      {proposal.references?.length > 0 && <p className="xs muted">{t('ai.references')}: {proposal.references.map(x => x.title).join(' · ')}</p>}
      {proposal.useCase && <p className="xs muted">{L(proposal.useCase.checkpoint) || t('sfm.aiCheckpoint')}</p>}</div>}
    {!readOnly && <div className="row">
      {!step.done && (inline || single) && hasTpl && <Btn size="sm" icon="LibraryBig" onClick={fromTemplate} data-tip={t('flow.templateTip')}>{t('flow.fromTemplate')}</Btn>}
      {!step.done && (inline || (single && (f.fill || []).includes('ai'))) && ucs.length > 0 && <span className="row ai-ucs" style={{ gap: 6 }}>{ucs.map(u => <span key={u.id} className="row" style={{ gap: 4 }}>
        {can('ai.run') && u.effective ? <Btn size="sm" icon="Sparkles" onClick={() => suggest(u.code)} data-tip={`${u.code} · ${L(u.name)}`}>{t('sfm.suggest')}</Btn> : <span className="xs muted">{u.code} · {t('aiuc.f.inactive')}</span>}
        <Link className="pill xs" to={`/ai/use-cases/${u.id}`} data-tip={L(u.name)}>{u.code}</Link><AiBadge tier={u.tier} /></span>)}</span>}
      {!step.done && inline && !ucs.length && can('prompts.manage') && <span className="row xs muted" style={{ gap: 6 }}><Icon name="Info" size={14} />{t('sfm.noUseCase')}<Btn size="sm" kind="ghost" icon="Sparkles" onClick={suggestUseCase}>{t('sfm.suggestUseCase')}</Btn></span>}
      <span className="spacer" />
      {step.done ? <Btn size="sm" icon="RotateCcw" onClick={() => setReopen(true)}>{t('sfm.reopen')}</Btn> : <Btn size="sm" kind="primary" icon="CircleCheck" onClick={complete}>{t('sfm.complete')}</Btn>}</div>}
    {step.done && <p className="xs muted"><StatusPill value="Completed" /> {step.record?.completed_at ? step.record.completed_at.slice(0, 10) : ''}</p>}
    {reopen && <JustifyDialog title={t('sfm.reopen')} onCancel={() => setReopen(false)} onConfirm={async n => { setReopen(false); await act(() => post(`${base}/reopen`, { _justification: n })); onChanged(); }} />}
  </div>);
}

/** Single form (decision, review): each field saved when the user leaves it; the draft is kept on screen. */
function StepFormFields({ base, fields, values, readOnly, onSaved, objectLabel }) {
  const { t, fmtDate } = useI18n(); const { toast } = useSession();
  // Empty fields show their default (today, the user, the object of the step...); it is saved at completion if kept.
  const [v, setV] = useState(() => ({ ...Object.fromEntries(fields.filter(c => c.default != null && c.default !== '').map(c => [c.key, c.default === '{object}' ? objectLabel : c.default])), ...Object.fromEntries(Object.entries(values).filter(([, x]) => x != null && x !== '')) })); const [errs, setErrs] = useState({}); const [state, setState] = useState('');
  // The latest typed values, read when a field is committed: a choice is saved by the same click that makes it.
  const cur = useRef(v); cur.current = v; const saved = useRef({ ...values });
  const setVal = (key, x) => { cur.current = { ...cur.current, [key]: x }; setV(cur.current); };
  const saveField = async key => {
    const val = cur.current[key];
    if (String(val ?? '') === String(saved.current[key] ?? '')) return;
    setState('saving');
    try { await put(`${base}/fields`, { fields: { [key]: val } }); saved.current[key] = val; values[key] = val; setErrs(e => { const n = { ...e }; delete n[key]; return n; }); setState('saved'); onSaved?.(); }
    catch (e) { setErrs(x => ({ ...x, [key]: e.params?.errors?.[key] ? t('mre.' + e.params.errors[key]) : e.message })); setState(''); toast(e.message, 'error'); }
  };
  const shown = c => { const x = v[c.key]; if (x == null || x === '') return '—'; const lbl = y => (c.options || []).find(o => String(o.value) === String(y))?.label ?? y;
    if (c.type === 'multi') return splitMulti(x).map(lbl).join(', '); if (c.type === 'select') return lbl(x); if (c.type === 'boolean') return x === true || x === 'true' ? t('common.yes') : t('common.no'); if (c.type === 'date' && /^\d{4}-\d{2}-\d{2}/.test(String(x))) return fmtDate(x); return String(x); };
  return (<div className="form-grid">{fields.map(c => { const id = `${base}-${c.key}`.replace(/[^\w-]/g, '_');
    return <Field key={c.key} id={id} label={c.label} required={c.required} hint={c.help} error={errs[c.key]} className={c.wide ? 'full' : ''}>
      {readOnly ? <div className="ro-value">{shown(c)}</div>
        : c.type === 'multi' ? <MultiSelect id={id} value={v[c.key] ?? ''} options={c.options || []} custom={c.custom} invalid={!!errs[c.key]} onChange={e => setVal(c.key, e.target.value)} onCommit={() => saveField(c.key)} />
        : c.type === 'select' ? <ChoiceField id={id} col={c} value={v[c.key]} onChange={x => setVal(c.key, x)} onCommit={() => saveField(c.key)} t={t} invalid={!!errs[c.key]} />
        : c.type === 'boolean' ? <label className="check"><input id={id} type="checkbox" checked={v[c.key] === true || v[c.key] === 'true'} onChange={e => { setVal(c.key, e.target.checked); saveField(c.key); }} />{v[c.key] === true || v[c.key] === 'true' ? t('common.yes') : t('common.no')}</label>
        : c.type === 'textarea' ? <textarea id={id} className="input" rows={4} value={v[c.key] ?? ''} onChange={e => setVal(c.key, e.target.value)} onBlur={() => saveField(c.key)} />
        : <input id={id} className="input" type={c.type === 'date' ? 'date' : 'text'} inputMode={c.type === 'number' ? 'decimal' : undefined} value={v[c.key] ?? ''} onChange={e => setVal(c.key, e.target.value)} onBlur={() => saveField(c.key)} />}
    </Field>; })}
    <p className="xs muted full" aria-live="polite">{state === 'saving' ? t('mre.st.saving') : state === 'saved' ? t('mre.st.saved') : ''}</p></div>);
}

/** Readiness of an E2E instance: inputs, owner, RACSI, document template and KPIs (FR-DA-PDM). */
export function Readiness({ instanceId }) {
  const { t } = useI18n(); const d = useData(`/e2e-instances/${instanceId}/readiness`, [instanceId]);
  return (<Guard state={d}>{x => <ul className="plain readiness">{x.items.map(i => <li key={i.code} className="row"><Icon name={i.ok ? 'CircleCheck' : 'CircleAlert'} className={i.ok ? 'saved-ico' : 'err-ico'} size={16} /><span className="small">{t('readiness.' + i.code)}</span>{i.detail && <span className="xs muted">{i.detail}</span>}</li>)}</ul>}</Guard>);
}
void get;
