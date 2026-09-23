import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { Button, Field, Input, Select, ErrorNote } from '../components/ui.jsx';
import { BrandMark } from '../components/Shell.jsx';

const DOMAINS = [
  ['metrocity.example', 'Public Sector'], ['cedarline.example', 'Manufacturing in Construction'], ['meridale.example', 'Healthcare'],
  ['valdora.example', 'Agro-Business - Dairy Products'], ['orvane.example', 'Transportation'], ['kestrel.example', 'Oil, Gas & Energy'],
];
const ROLES = [['pm1', 'Product Manager'], ['board1', 'Gate Review Board Member'], ['quality', 'Quality Manager'], ['exec', 'Executive Sponsor'], ['process', 'Process Owner / Track Administrator'], ['admin', 'Platform Administrator']];

export default function Login() {
  const { login } = useAuth();
  const { t, languages, lang, setLang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState(DOMAINS[0][0]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try { await login(email.trim(), password); } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <div className="login">
      <div className="login-art">
        <span className="ring" style={{ width: 420, height: 420, insetInlineEnd: -140, top: -120 }} aria-hidden />
        <span className="ring" style={{ width: 180, height: 180, insetInlineStart: -60, bottom: 64 }} aria-hidden />
        <div className="brand" style={{ position: 'relative' }}><BrandMark size={40} /><span>CortexPLM</span></div>
        <div style={{ position: 'relative', maxWidth: 560 }}>
          <div className="eyebrow">{t('Product-Service Lifecycle Management')}</div>
          <h1 style={{ fontSize: 'var(--fs-36)' }}>{t('69 macro processes. 9 end-to-end processes. 8 gates.')}</h1>
          <p className="subtitle">{t('Run innovation projects from idea to relaunch or retirement, with the rigor of the Full, Light or Fast Track.')}</p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', position: 'relative', maxWidth: 560 }}>
          {[['81', t('user-facing tasks with RACSI')], ['3', t('innovation tracks')], ['11', t('solution packs')]].map(([n, l]) => (
            <div key={l} className="kpi"><span className="value">{n}</span><span className="label">{l}</span></div>
          ))}
        </div>
      </div>
      <div className="login-form">
        <div className="row between">
          <h2>{t('Sign in')}</h2>
          <select className="select" style={{ width: 'auto' }} value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('Language')}>
            {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
        <form className="stack" onSubmit={submit}>
          <Field label={t('E-mail')} required><Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label={t('Password')} required><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <ErrorNote error={error} />
          <Button type="submit" variant="primary" icon={LogIn} busy={busy}>{t('Sign in')}</Button>
        </form>
        <div className="card quiet stack tight">
          <div className="strong small">{t('Demo accounts')}</div>
          <p className="muted" style={{ margin: 0 }}>{t('Platform administrator: admin@cortexplm.example / Admin#2026. Other demo users: password Demo#2026.')}</p>
          <Select value={domain} onChange={(e) => setDomain(e.target.value)} aria-label={t('Industry')} options={DOMAINS.map(([d, i]) => ({ value: d, label: t(i) }))} />
          <div className="cred-list">
            {ROLES.map(([alias, role]) => (
              <button type="button" key={alias} onClick={() => { setEmail(`${alias}@${domain}`); setPassword('Demo#2026'); }}>
                <strong>{t(role)}</strong>{alias}@{domain}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
