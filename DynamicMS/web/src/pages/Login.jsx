import { useState } from 'react';
import { LogIn, Workflow, Layers, ListChecks } from 'lucide-react';
import { useApp } from '../lib/state.jsx';
import { Field, IconBadge } from '../components/ui.jsx';

const DEMO = [
  ['quality@horizon-universal.example', 'Horizon Universal Holdings — Quality Manager'],
  ['ims@atlas-sme.example', 'Atlas Universal SME — IMS Manager'],
  ['quality@nova-aec.example', 'Nova Build & Construct — Quality Manager'],
  ['ceo@horizon-aut.example', 'Horizon Automotive Systems — Top Management'],
  ['admin@dynamicms.example', 'Platform Administrator (Admin@2026)'],
];

export default function Login() {
  const { t, login, lang, setLang, toast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await login(email, password); } catch (err) { setError(err.code === 'RATE_LIMITED' ? t('Too many attempts. Wait one minute.') : t('Email or password is incorrect.')); } finally { setBusy(false); }
  };
  return (
    <div className="login">
      <div className="login-panel">
        <div className="row-between">
          <img className="login-logo" src="/dynamicms-logo.png" alt="DynamicMS" width="112" height="112" />
          <label className="sr-only" htmlFor="login-lang">{t('Language')}</label>
          <select id="login-lang" className="select" style={{ width: 'auto' }} value={lang} onChange={e => setLang(e.target.value)}><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select>
        </div>
        <div>
          <p className="eyebrow">{t('Integrated management system')}</p>
          <h1>{t('Sign in')}</h1>
          <p className="subtitle muted">{t('Run your QMS and QHSE lifecycle from context analysis to continual improvement.')}</p>
        </div>
        <form className="stack" onSubmit={submit} noValidate>
          <Field label={t('Email')} required>{(id) => <input id={id} className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required aria-invalid={!!error} />}</Field>
          <Field label={t('Password')} required error={error}>{(id) => <input id={id} className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required aria-invalid={!!error} />}</Field>
          <div className="row"><button className="btn btn-primary" type="submit" disabled={busy || !email || !password}><LogIn size={18} />{busy ? t('Signing in…') : t('Sign in')}</button></div>
        </form>
        <details className="card flat tight">
          <summary className="strong" style={{ cursor: 'pointer' }}>{t('Demonstration accounts')}</summary>
          <p className="small muted" style={{ marginTop: 8 }}>{t('Password for every organization account: {pw}', { pw: 'Demo@2026' })}</p>
          <ul className="list small">
            {DEMO.map(([e, d]) => <li key={e}><button type="button" className="link-btn" onClick={() => { setEmail(e); setPassword(e.startsWith('admin@dynamicms') ? 'Admin@2026' : 'Demo@2026'); toast(t('Account filled in. Select Sign in.')); }}>{e}</button><div className="muted xsmall">{d}</div></li>)}
          </ul>
        </details>
      </div>
      <aside className="login-aside">
        <span className="ring" style={{ width: 420, height: 420, insetInlineEnd: -140, top: -120 }} />
        <span className="ring" style={{ width: 260, height: 260, insetInlineStart: -90, bottom: -60 }} />
        <div style={{ position: 'relative', maxWidth: 520 }} className="stack">
          <h2 className="serif">{t('One lifecycle, every step traced')}</h2>
          <p>{t('Each project runs the end-to-end processes of its management system. Every step records who did what, when, and with which evidence.')}</p>
          <div className="stack">
            {[[Workflow, '12', t('end-to-end processes, from strategy to improvement')], [Layers, '162', t('macro processes across seven tiers and 29 verticals')], [ListChecks, '1,572', t('workflow steps, each with its own input form')]].map(([I, n, l]) => (
              <div key={n} className="row" style={{ alignItems: 'center' }}><IconBadge icon={I} accent /><span className="serif" style={{ fontSize: 30, fontWeight: 900, color: 'var(--aiv-navy)' }}>{n}</span><span className="small" style={{ color: 'var(--aiv-navy)', maxWidth: 260 }}>{l}</span></div>
            ))}
          </div>
          <div className="login-by"><span className="xsmall muted">{t('A solution by')}</span><img src="/aivalue-logo.png" alt="AI Value — Digital & AI Transformation" width="180" /></div>
        </div>
      </aside>
    </div>
  );
}
