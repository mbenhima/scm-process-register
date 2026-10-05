import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, CheckCircle2, RotateCcw, Sparkles, Lock, History, ChevronDown, ChevronUp, FilePlus2, Download, Eye } from 'lucide-react';
import { Split } from '../lib/layout.jsx';
import { useApp, useData } from '../lib/state.jsx';
import { api, download } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Field, Modal, tx, IconBadge } from '../components/ui.jsx';
import { StepField, RecordsList, isEmptyValue } from '../components/StepInputs.jsx';
import Attachments from '../components/Attachments.jsx';

export default function Step() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, L, lang, fmtDate, toast, readOnly, can } = useApp();
  // raw=1: values keep all their languages, so untouched cells are not reduced to one language.
  const { data: s, loading, error, reload } = useData(`/steps/${id}?raw=1`);
  const [pickers, setPickers] = useState(null);
  const [vals, setVals] = useState({});
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [reopen, setReopen] = useState(false);
  const [just, setJust] = useState('');
  const [ai, setAi] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const [details, setDetails] = useState(false);
  const [gen, setGen] = useState(null);
  const fields = s?.step?.form?.fields || [];
  const loadPickers = useCallback(async () => { if (s?.project_id) setPickers(await api(`/projects/${s.project_id}/pickers`)); }, [s?.project_id]);
  useEffect(() => { loadPickers().catch(() => {}); }, [loadPickers]);
  useEffect(() => {
    if (!s) return;
    const f = s.fields || {};
    setVals(Object.fromEntries(fields.map(fd => [fd.key, f[fd.key] ?? (['rows', 'kpis', 'matrix', 'obs', 'roles', 'standards'].includes(fd.type) ? [] : '')])));
    setErrs({}); setAi(null); setPrompt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);
  const editable = s && s.status !== 'Done' && s.canPerform && !s.locked && !readOnly;
  const aiUc = useMemo(() => s?.aiUseCases?.[0], [s]);
  const ctx = { t, lang, L, pickers, mpId: s?.mp?.id, stepId: s?.id, role: s?.assignee_role, templates: s?.templates || [], reloadPickers: loadPickers };

  const submit = async (complete) => {
    const missing = complete ? fields.filter(f => f.required && !f.computed && isEmptyValue(vals[f.key])) : [];
    if (missing.length) { setErrs(Object.fromEntries(missing.map(f => [f.key, t('Required')]))); toast(t('Complete the required fields.'), 'error'); return; }
    setBusy(true);
    try {
      const out = await api(`/steps/${id}${complete ? '/complete' : ''}`, { method: complete ? 'POST' : 'PUT', body: { fields: vals } });
      toast(complete ? t('Step completed.') : t('Draft saved.'));
      if (out.rulesApplied?.length) toast(t('{n} business rule(s) checked on this step.', { n: out.rulesApplied.length }));
      if (complete && s.next) navigate(`/steps/${s.next}`); else reload();
    } catch (e) {
      if (e.details?.fields) setErrs(Object.fromEntries(e.details.fields.map(k => [k, t('Required')])));
      toast(e.message, 'error');
    } finally { setBusy(false); }
  };
  const doReopen = async () => {
    try { await api(`/steps/${id}/reopen`, { method: 'POST', body: { justification: just } }); toast(t('Step reopened.')); setReopen(false); setJust(''); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const orgUc = async () => {
    const orgUcs = await api(`/orgs/${s.org_id}/ai/usecases`);
    const uc = orgUcs.items.find(u => u.code === aiUc.id) || orgUcs.items.find(u => u.linked_step === s.step_id);
    if (!uc) throw new Error(t('No AI use case is configured for this step.'));
    return uc;
  };
  const askAi = async () => {
    setAiBusy(true);
    try {
      const uc = await orgUc();
      // Only what the user typed in text fields is sent (not list choices such as "Edited").
      const input = fields.filter(f => ['text', 'textarea'].includes(f.type) && f.key !== 'final').map(f => (typeof vals[f.key] === 'string' ? vals[f.key] : tx(vals[f.key], lang) || '')).map(x => x.trim().replace(/[.\s]+$/, '')).filter(Boolean).join('. ');
      const out = await api('/ai/suggest', { method: 'POST', body: { projectId: s.project_id, usecaseId: uc.id, recordType: 'step', recordId: s.id, input } });
      setAi(out);
      if (out.warning && !String(out.engine).startsWith('rules')) toast(out.warning, 'error');
    } catch (e) { toast(e.message, 'error'); } finally { setAiBusy(false); }
  };
  const showPrompt = async () => { try { const uc = await orgUc(); setPrompt(await api(`/ai/usecases/${uc.id}/prompt?projectId=${s.project_id}&stepId=${s.id}`)); } catch (e) { toast(e.message, 'error'); } };
  const aiOutcome = async (outcome) => {
    try {
      await api('/ai/feedback', { method: 'POST', body: { logId: ai.logId, outcome } });
      if (outcome !== 'Rejected') {
        const rowsF = fields.find(f => f.type === 'rows');
        const target = fields.find(f => f.key === 'final') || fields.find(f => f.type === 'textarea') || fields.find(f => f.type === 'text');
        if (rowsF) { const k0 = rowsF.columns[0].key; setVals(v => ({ ...v, [rowsF.key]: [...(v[rowsF.key] || []), ...ai.items.map(x => ({ [k0]: x }))] })); }
        else if (target) setVals(v => ({ ...v, [target.key]: `${typeof v[target.key] === 'string' && v[target.key] ? v[target.key] + '\n' : tx(v[target.key], lang) ? tx(v[target.key], lang) + '\n' : ''}${ai.items.join('\n')}` }));
      }
      toast(outcome === 'Rejected' ? t('Suggestion rejected and logged.') : t('Suggestion inserted. Review it before completing the step.'));
      setAi(null);
    } catch (e) { toast(e.message, 'error'); }
  };
  const generate = async () => {
    try {
      const r = await api(`/projects/${s.project_id}/documents`, { method: 'POST', body: { templateCode: gen.template, stepId: s.id, mpId: s.mp.id, summary: gen.summary || undefined } });
      toast(t('Document {code} generated from the project data.', { code: r.code }));
      if (editable && fields.some(f => f.key === 'records')) setVals(v => ({ ...v, records: [...(Array.isArray(v.records) ? v.records : []), { type: 'document', id: r.id, code: r.code, title: gen.templateName }] }));
      if (editable && fields.some(f => f.key === 'docRef') && !vals.docRef) setVals(v => ({ ...v, docRef: r.code, version: '0.1', template: gen.template }));
      setGen(null); reload();
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading && !s) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const overdue = s.status !== 'Done' && s.due_date < new Date().toISOString().slice(0, 10);
  const links = s.fields?._links || [];
  return (
    <>
      <PageHead eyebrow={`${s.mp.code} · ${t('Step {i} of {n}', { i: s.position, n: s.count })} · ${s.step_id}`} title={tx(s.step.name, lang)} subtitle={tx(s.task, lang)}
        actions={<>
          <button className="btn btn-icon" disabled={!s.prev} onClick={() => navigate(`/steps/${s.prev}`)} aria-label={t('Previous step')}>{lang === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
          <button className="btn btn-icon" disabled={!s.next} onClick={() => navigate(`/steps/${s.next}`)} aria-label={t('Next step')}>{lang === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>
          <Link className="btn" to={`/mp/${s.mp.id}`}>{t('Macro process')}</Link>
        </>}>
        <div className="row small" style={{ marginTop: 12 }}><Status value={overdue ? 'Overdue' : s.status} /><span className="tag outline">{tx(s.step.form.label, lang)}</span><span className="muted">{tx(s.roleName, lang)}{s.assignee ? ` · ${s.assignee.name}` : ''} · {t('Due')} {fmtDate(s.due_date)}</span></div>
      </PageHead>
      <Split label={t('Resize the context panel')}>
        <div className="stack">
          <Card title={t('What to record')}>
            <div className="step-desc">
              <p className="small" style={{ margin: 0 }}>{tx(s.step.brief, lang)}</p>
              <button type="button" className="btn btn-ghost btn-sm" aria-expanded={details} onClick={() => setDetails(d => !d)}>{details ? <ChevronUp size={16} /> : <ChevronDown size={16} />}{details ? t('Hide the detailed description') : t('Show the detailed description')}</button>
              {details && <div className="callout neutral small" style={{ whiteSpace: 'pre-line' }}>{tx(s.step.description, lang)}</div>}
            </div>
            {s.locked && <div className="callout neutral" style={{ margin: '16px 0' }}><Lock size={18} aria-hidden="true" /><span>{t('The gate of this phase is passed; the step is locked.')}</span></div>}
            {!s.canPerform && s.status !== 'Done' && <div className="callout neutral" style={{ margin: '16px 0' }}><span>{t('This step is assigned to another role. You can read it but not complete it.')}</span></div>}
            {s.status === 'Done' && s.completedBy && <div className="callout good" style={{ margin: '16px 0' }}><CheckCircle2 size={18} aria-hidden="true" /><span>{t('Completed by {who} on {date}.', { who: s.completedBy.name, date: fmtDate(s.completed_at) })}</span></div>}
            <form className="stack" style={{ marginTop: 16 }} onSubmit={e => { e.preventDefault(); submit(true); }}>
              {fields.map(f => <StepField key={f.key} f={f} value={vals[f.key]} ctx={ctx} scale={s.step.form.scale} onChange={(v) => { setVals(x => ({ ...x, [f.key]: v })); setErrs(x => ({ ...x, [f.key]: undefined })); }} disabled={!editable} lang={lang} t={t} L={L} error={errs[f.key]} />)}
              {links.length > 0 && <Field label={t('Records produced by this step')}>{() => <RecordsList value={links} t={t} lang={lang} />}</Field>}
              <div className="row">
                {editable && <button type="button" className="btn" disabled={busy} onClick={() => submit(false)}><Save size={16} />{t('Save draft')}</button>}
                {editable && <button type="submit" className="btn btn-primary" disabled={busy}><CheckCircle2 size={16} />{t('Complete step')}</button>}
                {s.canReopen && !readOnly && <button type="button" className="btn" onClick={() => setReopen(true)}><RotateCcw size={16} />{t('Reopen')}</button>}
              </div>
            </form>
          </Card>
          {aiUc && (
            <Card className="tint" title={t('AI assistance')} action={<div className="row" style={{ gap: 8 }}><button className="btn btn-sm" onClick={showPrompt}><Eye size={16} />{t('View prompt')}</button>{editable && <button className="btn btn-sm" disabled={aiBusy} onClick={askAi}><Sparkles size={16} />{aiBusy ? t('Preparing…') : t('Suggest')}</button>}</div>}>
              <p className="small">{aiUc.id} · {tx(aiUc.name, lang)} · <span className="muted">{tx(aiUc.checkpoint, lang)}</span></p>
              {ai && (
                <div className="card tight stack-8">
                  {ai.items.length === 1 ? <p className="small" style={{ margin: 0, whiteSpace: 'pre-line' }}>{ai.items[0]}</p> : <ul className="small" style={{ margin: 0, paddingInlineStart: 20 }}>{ai.items.map((x, i) => <li key={i}>{x}</li>)}</ul>}
                  {ai.warning && <div className="callout warn small" role="status"><span>{ai.warning} {can('ai.manage') && <Link to="/admin?tab=llm">{t('Open AI models')}</Link>}</span></div>}
                  <p className="xsmall muted" style={{ margin: 0 }}>{t('Confidence {c}%', { c: Math.round(ai.confidence * 100) })} · {t('Engine')}: {String(ai.engine).startsWith('rules') ? t('built-in engine (rules and retrieval)') : ai.engine}{ai.sources?.length ? ` · ${t('Sources')}: ${ai.sources.map(x => x.title).join(', ')}` : ''}</p>
                  <div className="row"><button className="btn btn-sm btn-primary" onClick={() => aiOutcome('Accepted')}>{t('Accept')}</button><button className="btn btn-sm" onClick={() => aiOutcome('Edited')}>{t('Insert and edit')}</button><button className="btn btn-sm btn-danger" onClick={() => aiOutcome('Rejected')}>{t('Reject')}</button></div>
                </div>
              )}
            </Card>
          )}
          <Card title={t('Documents of this step')} action={can('records.manage') && !readOnly && <button className="btn btn-sm" onClick={() => setGen({ template: s.templates?.[0]?.code || '', templateName: s.templates?.[0]?.name || '', summary: '' })}><FilePlus2 size={16} />{t('Generate document')}</button>}>
            {s.documents?.length ? <ul className="list small">{s.documents.map(d => <li key={d.id} className="row-between"><Link to={`/documents/${d.id}`}><span className="strong">{d.code}</span> — {tx(d.title, lang)} <span className="muted">v{d.current_version}</span></Link><span className="row" style={{ gap: 6 }}><Status value={d.status} /><button className="btn btn-sm btn-ghost" aria-label={t('Download PDF')} onClick={() => download(`/documents/${d.id}/download?format=pdf`, `${d.code}.pdf`)}><Download size={16} />PDF</button><button className="btn btn-sm btn-ghost" aria-label={t('Download Word')} onClick={() => download(`/documents/${d.id}/download?format=docx`, `${d.code}.docx`)}><Download size={16} />DOCX</button></span></li>)}</ul> : <p className="small muted">{t('No document linked yet. Generate one from a template: it is filled with the data recorded in the project.')}</p>}
          </Card>
          <Card><Attachments entityType="step" entityId={s.id} /></Card>
        </div>
        <div className="stack">
          <Card title={t('Context')}>
            <dl className="small stack-8" style={{ margin: 0 }}>
              <div><dt className="muted xsmall">{t('Phase')}</dt><dd style={{ margin: 0 }}>{s.mp.e2e} — {tx(s.mp.e2eName, lang)}</dd></div>
              <div><dt className="muted xsmall">{t('Macro process')}</dt><dd style={{ margin: 0 }}>{s.mp.code} — {tx(s.mp.name, lang)}</dd></div>
              <div><dt className="muted xsmall">{t('Step type')}</dt><dd style={{ margin: 0 }}>{tx(s.step.typeName, lang)}</dd></div>
              <div><dt className="muted xsmall">{t('Inputs')}</dt><dd style={{ margin: 0 }}>{(s.mp.sipoc?.I || []).slice(0, 5).map(x => tx(x, lang)).join('; ')}</dd></div>
              <div><dt className="muted xsmall">{t('Outputs')}</dt><dd style={{ margin: 0 }}>{(s.mp.sipoc?.O || []).slice(0, 5).map(x => tx(x, lang)).join('; ')}</dd></div>
              {s.mp.standards?.length > 0 && <div><dt className="muted xsmall">{t('Standards of the project')}</dt><dd style={{ margin: 0 }}>{s.mp.standards.join(', ')}</dd></div>}
              {s.mp.clauses && <div><dt className="muted xsmall">{t('Requirements answered')}</dt><dd style={{ margin: 0 }}>{s.mp.clauses}</dd></div>}
              {s.stepRacsi && <div><dt className="muted xsmall">{t('RACSI of this step')}</dt><dd style={{ margin: 0 }}>{['R', 'A', 'C', 'S', 'I'].filter(l => s.stepRacsi[l]?.length).map(l => `${l}: ${s.stepRacsi[l].map(c => tx(pickers?.roles.find(r => r.code === c)?.name, lang) || c).join(', ')}`).join(' · ')}</dd></div>}
            </dl>
          </Card>
          {(s.rules.length > 0 || s.controls.length > 0) && (
            <Card title={t('Rules and controls on this step')}>
              <ul className="list small">{s.rules.map(r => <li key={r.id}><span className="strong">{r.id}</span> · {L(r.type)} — {tx(r.condition, lang)}</li>)}{s.controls.map(c => <li key={c.id}><span className="strong">{c.id}</span> — {tx(c.name, lang)}</li>)}</ul>
            </Card>
          )}
          <Card title={t('History')} action={<IconBadge icon={History} size="sm" />}>
            {s.history.length ? <ul className="list small">{s.history.map((h, i) => <li key={i}><span className="strong">{t(h.action)}</span> · {h.user_name || '—'} · <span className="muted">{fmtDate(h.at)}</span>{h.justification ? <div className="xsmall">“{tx(h.justification, lang)}”</div> : null}</li>)}</ul> : <p className="small muted">{t('No change recorded yet.')}</p>}
            {s.versions.length > 0 && <p className="xsmall muted" style={{ margin: '8px 0 0' }}>{t('{n} versions kept.', { n: s.versions.length })}</p>}
          </Card>
        </div>
      </Split>
      {reopen && (
        <Modal title={t('Reopen step')} onClose={() => setReopen(false)} footer={<><button className="btn" onClick={() => setReopen(false)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={just.trim().length < 5} onClick={doReopen}>{t('Reopen')}</button></>}>
          <p className="small">{t('Reopening keeps the previous value as a version and writes your justification to the audit trail.')}</p>
          <Field label={t('Justification')} required>{(fid) => <textarea id={fid} className="textarea" value={just} onChange={e => setJust(e.target.value)} />}</Field>
        </Modal>
      )}
      {gen && (
        <Modal title={t('Generate document')} onClose={() => setGen(null)} footer={<><button className="btn" onClick={() => setGen(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!gen.template} onClick={generate}><FilePlus2 size={16} />{t('Generate')}</button></>}>
          <div className="stack">
            <p className="small">{t('The document is created as a draft (version 0.1) from the template and filled with the data already recorded in the project. It then follows the review and approval workflow in Documents.')}</p>
            <Field label={t('Template')} required>{(fid) => <select id={fid} className="select" value={gen.template} onChange={e => { const x = [...(s.templates || []), ...(pickers?.templates || [])].find(y => y.code === e.target.value); setGen({ ...gen, template: e.target.value, templateName: x?.name }); }}><option value="">{t('Choose a template…')}</option>{s.templates?.length > 0 && <optgroup label={t('Suggested for this macro process')}>{s.templates.map(x => <option key={x.code} value={x.code}>{x.code} — {tx(x.name, lang)}</option>)}</optgroup>}<optgroup label={t('All templates')}>{(pickers?.templates || []).map(x => <option key={x.code} value={x.code}>{x.code} — {tx(x.name, lang)}</option>)}</optgroup></select>}</Field>
            <Field label={t('Summary of the version (optional)')}>{(fid) => <input id={fid} className="input" value={gen.summary} onChange={e => setGen({ ...gen, summary: e.target.value })} />}</Field>
          </div>
        </Modal>
      )}
      {prompt && (
        <Modal wide title={t('Prompt sent for this step')} onClose={() => setPrompt(null)} footer={<button className="btn" onClick={() => setPrompt(null)}>{t('Close')}</button>}>
          <div className="stack">
            <Field label={t('Instructions (system)')}>{(fid) => <textarea id={fid} className="textarea" readOnly style={{ minHeight: 120 }} value={prompt.system} />}</Field>
            <Field label={t('Context of the step (user)')}>{(fid) => <textarea id={fid} className="textarea" readOnly style={{ minHeight: 200 }} value={prompt.user} />}</Field>
          </div>
        </Modal>
      )}
    </>
  );
}
