// First sign-in with an initial password (production mode): the person sets their own password
// before reaching the application. The server refuses every other request until then.
import { useState } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { useApp } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { Field } from '../components/ui.jsx';

export default function FirstPassword() {
  const { t, me, reloadTree, logout, toast } = useApp();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const mismatch = f.confirm && f.next !== f.confirm;
  const submit = async (e) => {
    e.preventDefault();
    if (f.next !== f.confirm) return;
    setBusy(true); setError(null);
    try {
      await api('/auth/password', { method: 'PUT', body: { current: f.current, next: f.next } });
      toast(t('Password changed.'));
      await reloadTree();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="login">
      <div className="login-panel">
        <img className="login-logo" src="/dynamicms-logo.png" alt="DynamicMS" width="112" height="112" />
        <div>
          <p className="eyebrow">{me.user.email}</p>
          <h1>{t('Choose your password')}</h1>
          <p className="subtitle muted">{t('Your account was created with an initial password. Choose your own password to continue.')}</p>
        </div>
        <form className="stack" onSubmit={submit} noValidate>
          <Field label={t('Initial password')} required>{(id) => <input id={id} className="input" type="password" autoComplete="current-password" value={f.current} onChange={e => setF({ ...f, current: e.target.value })} />}</Field>
          <Field label={t('New password')} required hint={t('At least 12 characters with upper case, lower case and a digit.')}>{(id) => <input id={id} className="input" type="password" autoComplete="new-password" value={f.next} onChange={e => setF({ ...f, next: e.target.value })} />}</Field>
          <Field label={t('Confirm the new password')} required error={mismatch ? t('The two passwords differ.') : error}>{(id) => <input id={id} className="input" type="password" autoComplete="new-password" value={f.confirm} onChange={e => setF({ ...f, confirm: e.target.value })} aria-invalid={!!(mismatch || error)} />}</Field>
          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={busy || !f.current || !f.next || f.next !== f.confirm}><KeyRound size={18} />{t('Save the password')}</button>
            <button className="btn btn-ghost" type="button" onClick={logout}><LogOut size={18} />{t('Sign out')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
