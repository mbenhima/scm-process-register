import { useState } from 'react';
import { useSession } from '../lib/session.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { Btn, Field } from '../components/ui.jsx';

export default function Login() {
  const { login } = useSession(); const { t, languages, lang, setLang } = useI18n();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => { e.preventDefault(); setErr(''); setBusy(true); try { await login(email.trim(), password); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return (<div className="login">
    <div className="login-art"><img src="/cortexskills-logo.png" alt="CortexSkills" />
      <div><div className="eyebrow">{t('login.eyebrow')}</div><h1>{t('login.headline')}</h1><p className="subtitle">{t('login.lead')}</p></div></div>
    <div className="login-form"><form className="card stack" onSubmit={submit} noValidate>
      <div className="row" style={{ justifyContent: 'space-between' }}><h2>{t('login.title')}</h2>
        <div className="seg" role="group" aria-label={t('header.language')}>{languages.map(l => <button key={l.code} type="button" aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>{l.code.toUpperCase()}</button>)}</div></div>
      <Field label={t('login.email')} id="email"><input id="email" className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
      <Field label={t('login.password')} id="pw"><input id="pw" className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></Field>
      {err && <div className="notice" role="alert">{err}</div>}
      <Btn kind="primary" type="submit" disabled={busy || !email || !password}>{busy ? t('common.loading') : t('login.submit')}</Btn>
      <p className="xs muted">{t('login.demo')}</p></form></div></div>);
}
