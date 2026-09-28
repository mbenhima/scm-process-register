import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, CheckCircle2, RotateCcw, Sparkles, Lock, History } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Field, Modal, tx, IconBadge } from '../components/ui.jsx';

const FREQ = ['Annual', 'Semi-annual', 'Quarterly', 'Monthly', 'Weekly'];

function toText(v, lang) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(x => tx(x, lang)).join('; ');
  if (typeof v === 'object') return tx(v, lang);
  return String(v);
}

export function StepField({ f, value, onChange, disabled, roles, lang, t, L, error }) {
  const label = tx(f.label, lang);
  const common = { disabled, 'aria-invalid': !!error };
  return (
    <Field label={label} required={f.required} error={error}>
      {(id) => {
        if (f.type === 'textarea') return <textarea id={id} className="textarea" value={value} onChange={e => onChange(e.target.value)} {...common} />;
        if (f.type === 'number') return <input id={id} className="input num" type="number" value={value} onChange={e => onChange(e.target.value)} {...common} />;
        if (f.type === 'date') return <input id={id} className="input" type="date" value={value} onChange={e => onChange(e.target.value)} {...common} />;
        if (f.type === 'score') return <div className="score" role="group" aria-labelledby={id}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" id={n === 1 ? id : undefined} aria-pressed={+value === n} disabled={disabled} onClick={() => onChange(n)}>{n}</button>)}</div>;
        if (f.type === 'role') return <select id={id} className="select" value={value} onChange={e => onChange(e.target.value)} {...common}><option value="">{t('Choose…')}</option>{roles.map(r => <option key={r.code} value={r.code}>{tx(r.name, lang)}</option>)}</select>;
        if (f.type === 'select') {
          const opts = f.options || (f.list === 'LST-FREQ' ? FREQ : []);
          return <select id={id} className="select" value={value} onChange={e => onChange(e.target.value)} {...common}><option value="">{t('Choose…')}</option>{opts.map(o => <option key={o} value={o}>{L(o)}</option>)}</select>;
        }
        return <input id={id} className="input" value={value} onChange={e => onChange(e.target.value)} {...common} />;
      }}
    </Field>
  );
}

export default function Step() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, L, lang, fmtDate, toast, readOnly } = useApp();
  const { data: s, loading, error, reload } = useData(`/steps/${id}`);
  const { data: roles } = useData('/roles');
  const [vals, setVals] = useState({});
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [reopen, setReopen] = useState(false);
  const [just, setJust] = useState('');
  const [ai, setAi] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const fields = s?.step?.form?.fields || [];
  useEffect(() => {
    if (!s) return;
    const f = s.fields || {};
    setVals(Object.fromEntries(fields.map(fd => [fd.key, toText(f[fd.key], lang)])));
    setErrs({}); setAi(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, lang]);
  const editable = s && s.status !== 'Done' && s.canPerform && !s.locked && !readOnly;
  const aiUc = useMemo(() => s?.aiUseCases?.[0], [s]);

  const submit = async (complete) => {
    const missing = complete ? fields.filter(f => f.required && !String(vals[f.key] ?? '').trim()) : [];
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
  const askAi = async () => {
    setAiBusy(true);
    try {
      const orgUcs = await api(`/orgs/${s.org_id}/ai/usecases`);
      const uc = orgUcs.items.find(u => u.code === aiUc.id) || orgUcs.items.find(u => u.linked_mp === s.mp.id);
      if (!uc) throw new Error(t('No AI use case is configured for this step.'));
      const out = await api('/ai/suggest', { method: 'POST', body: { projectId: s.project_id, usecaseId: uc.id, recordType: 'step', recordId: s.id, input: Object.values(vals).filter(Boolean).join('. ') } });
      setAi(out);
    } catch (e) { toast(e.message, 'error'); } finally { setAiBusy(false); }
  };
  const aiOutcome = async (outcome) => {
    try {
      await api('/ai/feedback', { method: 'POST', body: { logId: ai.logId, outcome } });
      if (outcome !== 'Rejected') {
        const target = fields.find(f => f.type === 'textarea') || fields.find(f => f.type === 'text');
        if (target) setVals(v => ({ ...v, [target.key]: `${v[target.key] ? v[target.key] + '\n' : ''}${ai.items.join('\n')}` }));
      }
      toast(outcome === 'Rejected' ? t('Suggestion rejected and logged.') : t('Suggestion inserted. Review it before completing the step.'));
      setAi(null);
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading && !s) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const overdue = s.status !== 'Done' && s.due_date < new Date().toISOString().slice(0, 10);
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
      <div className="grid-main">
        <div className="stack">
          <Card title={t('What to record')}>
            <p className="small">{tx(s.step.description, lang)}</p>
            {s.locked && <div className="callout neutral" style={{ marginBottom: 16 }}><Lock size={18} aria-hidden="true" /><span>{t('The gate of this phase is passed; the step is locked.')}</span></div>}
            {!s.canPerform && s.status !== 'Done' && <div className="callout neutral" style={{ marginBottom: 16 }}><span>{t('This step is assigned to another role. You can read it but not complete it.')}</span></div>}
            {s.status === 'Done' && s.completedBy && <div className="callout good" style={{ marginBottom: 16 }}><CheckCircle2 size={18} aria-hidden="true" /><span>{t('Completed by {who} on {date}.', { who: s.completedBy.name, date: fmtDate(s.completed_at) })}</span></div>}
            <form className="stack" onSubmit={e => { e.preventDefault(); submit(true); }}>
              {fields.map(f => <StepField key={f.key} f={f} value={vals[f.key] ?? ''} onChange={(v) => { setVals(x => ({ ...x, [f.key]: v })); setErrs(x => ({ ...x, [f.key]: undefined })); }} disabled={!editable} roles={roles || []} lang={lang} t={t} L={L} error={errs[f.key]} />)}
              <div className="row">
                {editable && <button type="button" className="btn" disabled={busy} onClick={() => submit(false)}><Save size={16} />{t('Save draft')}</button>}
                {editable && <button type="submit" className="btn btn-primary" disabled={busy}><CheckCircle2 size={16} />{t('Complete step')}</button>}
                {s.canReopen && !readOnly && <button type="button" className="btn" onClick={() => setReopen(true)}><RotateCcw size={16} />{t('Reopen')}</button>}
              </div>
            </form>
          </Card>
          {aiUc && editable && (
            <Card className="tint" title={t('AI assistance')} action={<button className="btn btn-sm" disabled={aiBusy} onClick={askAi}><Sparkles size={16} />{aiBusy ? t('Preparing…') : t('Suggest')}</button>}>
              <p className="small">{tx(aiUc.name, lang)} · <span className="muted">{tx(aiUc.checkpoint, lang)}</span></p>
              {ai && (
                <div className="card tight stack-8">
                  <ul className="small" style={{ margin: 0, paddingInlineStart: 20 }}>{ai.items.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  <p className="xsmall muted" style={{ margin: 0 }}>{t('Confidence {c}%', { c: Math.round(ai.confidence * 100) })}{ai.sources?.length ? ` · ${t('Sources')}: ${ai.sources.map(x => x.title).join(', ')}` : ''}</p>
                  <div className="row"><button className="btn btn-sm btn-primary" onClick={() => aiOutcome('Accepted')}>{t('Accept')}</button><button className="btn btn-sm" onClick={() => aiOutcome('Edited')}>{t('Insert and edit')}</button><button className="btn btn-sm btn-danger" onClick={() => aiOutcome('Rejected')}>{t('Reject')}</button></div>
                </div>
              )}
            </Card>
          )}
        </div>
        <div className="stack">
          <Card title={t('Context')}>
            <dl className="small stack-8" style={{ margin: 0 }}>
              <div><dt className="muted xsmall">{t('Phase')}</dt><dd style={{ margin: 0 }}>{s.mp.e2e} — {tx(s.mp.e2eName, lang)}</dd></div>
              <div><dt className="muted xsmall">{t('Macro process')}</dt><dd style={{ margin: 0 }}>{s.mp.code} — {tx(s.mp.name, lang)}</dd></div>
              <div><dt className="muted xsmall">{t('Step type')}</dt><dd style={{ margin: 0 }}>{tx(s.step.typeName, lang)}</dd></div>
              <div><dt className="muted xsmall">{t('Inputs')}</dt><dd style={{ margin: 0 }}>{(s.mp.sipoc?.I || []).slice(0, 4).map(x => tx(x, lang)).join('; ')}</dd></div>
              <div><dt className="muted xsmall">{t('Outputs')}</dt><dd style={{ margin: 0 }}>{(s.mp.sipoc?.O || []).slice(0, 4).map(x => tx(x, lang)).join('; ')}</dd></div>
              {s.mp.standards?.length > 0 && <div><dt className="muted xsmall">{t('Standards')}</dt><dd style={{ margin: 0 }}>{s.mp.standards.join(', ')}</dd></div>}
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
      </div>
      {reopen && (
        <Modal title={t('Reopen step')} onClose={() => setReopen(false)} footer={<><button className="btn" onClick={() => setReopen(false)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={just.trim().length < 5} onClick={doReopen}>{t('Reopen')}</button></>}>
          <p className="small">{t('Reopening keeps the previous value as a version and writes your justification to the audit trail.')}</p>
          <Field label={t('Justification')} required>{(fid) => <textarea id={fid} className="textarea" value={just} onChange={e => setJust(e.target.value)} />}</Field>
        </Modal>
      )}
    </>
  );
}
