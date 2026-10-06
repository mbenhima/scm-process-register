// Public response page (Application channel): opened from the link sent by e-mail or WhatsApp, no sign-in.
// The respondent sees only their own form; consent is asked before anything is saved (FR-DA-QLT-06).
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { QForm, completeness } from '../components/QForm.jsx';
import { Btn, Icon, Progress, Empty } from '../components/ui.jsx';

async function call(path, body) {
  const r = await fetch('/api/public/q/' + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(j.message || 'Error'), { code: j.error }); return j;
}

export default function Respond() {
  const { token } = useParams(); const { t, L, lang, setLang, languages } = useI18n();
  const [d, setD] = useState(null); const [err, setErr] = useState(null); const [answers, setAnswers] = useState({}); const [flags, setFlags] = useState({});
  const [consent, setConsent] = useState(false); const [state, setState] = useState(null); const [saving, setSaving] = useState(false); const dirty = useRef(false);
  useEffect(() => { call(token).then(x => { setD(x); setAnswers(x.answers || {}); setFlags(x.flags || {}); setConsent(!!x.consent?.given); if (x.language && x.language !== lang) setLang(x.language); }).catch(setErr); }, [token]); // eslint-disable-line
  const save = async final => {
    setSaving(true);
    try { const r = await call(token, { answers, flags, consent, final }); dirty.current = false; setState(final ? 'done' : 'saved'); if (final) setD(x => ({ ...x, responded: true })); return r; }
    catch (e) { setState({ error: e.message }); } finally { setSaving(false); }
  };
  // Autosave the draft every 30 seconds once consent is given.
  useEffect(() => { const id = setInterval(() => { if (dirty.current && consent && d && !d.responded) save(false); }, 30000); return () => clearInterval(id); }); // eslint-disable-line
  const change = a => { dirty.current = true; setAnswers(a); setState(null); };
  if (err) return <div className="public-page"><Empty icon="Unlink" title={t('respond.invalid')} text={err.message} /></div>;
  if (!d) return <div className="public-page"><p className="muted">{t('common.loading')}</p></div>;
  const pct = completeness(d.form?.sections, answers, flags);
  return (<div className="public-page">
    <header className="public-head"><div className="brand"><img src="/brand/cortexskills-lockup-compact.png" alt="CortexSkills" /></div>
      <div className="seg" role="group" aria-label={t('header.language')}>{languages.map(l => <button key={l.code} aria-pressed={lang === l.code} onClick={() => setLang(l.code)} lang={l.code}>{l.code.toUpperCase()}</button>)}</div></header>
    <div className="page-head"><div><div className="eyebrow">{L(d.organization)}</div><h1>{L(d.questionnaire.label)}</h1>
      <p className="subtitle">{t('respond.hello', { name: d.respondent.name })} · {L(d.form?.name)}{d.questionnaire.due_date ? ' · ' + t('respond.due', { date: new Date(d.questionnaire.due_date).toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-GB') }) : ''}</p></div></div>
    {d.responded ? <div className="card tint"><div className="kpi"><span className="badge-ico emph"><Icon name="CircleCheck" size={20} /></span><div><h3>{t('respond.thanks')}</h3><p className="muted">{t('respond.thanksText')}</p></div></div></div>
      : !d.questionnaire.open ? <div className="card"><p>{t('respond.closed')}</p></div>
      : <>
        <div className="card" style={{ marginBottom: 'var(--aiv-space-4)' }}>
          <label className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 4 }} />
            <span><span className="strong">{t('respond.consent')}</span><br /><span className="small muted">{t('respond.consentText', { org: L(d.organization) })}</span></span></label>
        </div>
        <QForm form={d.form} answers={answers} flags={flags} onChange={change} onFlags={f => { dirty.current = true; setFlags(f); }} />
        <div className="card sticky-actions"><div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ minWidth: 220 }}><div className="small">{t('respond.completeness', { pct })}</div><Progress value={pct} label={t('respond.completenessLabel')} />{pct < (d.questionnaire.threshold ?? 70) && <div className="xs muted">{t('respond.threshold', { n: d.questionnaire.threshold ?? 70 })}</div>}</div>
          <div className="row">{state === 'saved' && <span className="small muted">{t('respond.saved')}</span>}{state?.error && <span className="small" role="alert">{state.error}</span>}
            <Btn kind="ghost" onClick={async () => { if (window.confirm(t('respond.declineConfirm'))) { await call(token, { decline: true }); setD(x => ({ ...x, questionnaire: { ...x.questionnaire, open: false } })); } }}>{t('respond.decline')}</Btn>
            <Btn icon="Save" disabled={!consent || saving} onClick={() => save(false)}>{t('respond.saveDraft')}</Btn>
            <Btn kind="primary" icon="Send" disabled={!consent || saving} onClick={() => save(true)}>{t('respond.submit')}</Btn></div></div>
          {!consent && <p className="xs muted">{t('respond.consentNeeded')}</p>}</div>
      </>}
  </div>);
}
