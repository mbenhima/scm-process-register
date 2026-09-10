import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import logoMark from '../assets/ncp-solver-logo.svg';

const DEMO_ACCOUNTS = [
  { org: 'National Infrastructure Authority (Public Infra)', email: 'cipilot@nia.ncpsolver.demo' },
  { org: 'Solaris Precision Manufacturing (Independent)', email: 'cipilot@solaris.ncpsolver.demo' },
  { org: 'GreenValley AgroBusiness (Independent)', email: 'cipilot@greenvalley.ncpsolver.demo' },
  { org: 'Horizon Real Estate (Independent)', email: 'cipilot@horizon.ncpsolver.demo' },
  { org: 'Meridian Industrial Manufacturing (Group)', email: 'admin@meridian-mfg.ncpsolver.demo' },
  { org: 'Meridian AgroBusiness (Group)', email: 'admin@meridian-agro.ncpsolver.demo' },
  { org: 'Meridian Real Estate Development (Group)', email: 'admin@meridian-re.ncpsolver.demo' },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const { t, lang, setLang, languages } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('cipilot@solaris.ncpsolver.demo');
  const [password, setPassword] = useState('Ncp#2026Demo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError(t('auth.invalid'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="absolute top-4 end-4">
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="text-sm border border-grey-line rounded-md px-2 py-1.5 bg-white">
          {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src={logoMark} alt="NCP Solver" className="h-16 w-16 mb-3" />
          <h1 className="font-title font-bold text-2xl text-grey-dark">{t('appName')}</h1>
          <p className="text-sm font-semibold text-orange-deep">{t('tagline')}</p>
          <p className="text-xs text-grey-ink mt-0.5">{t('taglineLong')}</p>
        </div>

        <form onSubmit={onSubmit} className="card p-6">
          <h2 className="eyebrow mb-1">{t('auth.login')}</h2>
          <div className="mb-3 mt-3">
            <label className="label">{t('auth.email')}</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="label">{t('auth.password')}</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{t('auth.signIn')}</button>
        </form>

        <div className="card p-4 mt-4 text-xs">
          <div className="font-semibold text-grey-dark mb-2">{t('auth.demoHint')} <code className="text-orange-deep">Ncp#2026Demo</code></div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => setEmail(a.email)}
                className="block w-full text-start text-grey-ink hover:text-orange-deep hover:underline"
              >
                {a.org} — {a.email}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
