// Application dialogs in the design system (NFR-DA-VDS-14) instead of the browser's confirm,
// prompt and alert; the offline banner (FR-DA-STA-06); the "Sign in again" dialog shown when
// the session has expired (FR-DA-STA-03).
import { useEffect, useState } from 'react';
import { WifiOff, LogIn } from 'lucide-react';
import { useApp } from '../lib/state.jsx';
import { Modal, Field } from './ui.jsx';

let push = null;
/** Opens a confirmation (or, with input, a prompt); resolves true/false, or the typed text/null. */
export function confirmDialog({ title, message, confirmLabel, danger = false, input = null }) {
  return new Promise((resolve) => { if (!push) { resolve(input ? null : false); return; } push({ title, message, confirmLabel, danger, input, resolve }); });
}

export function DialogHost() {
  const { t } = useApp();
  const [d, setD] = useState(null);
  const [text, setText] = useState('');
  useEffect(() => { push = (x) => { setText(''); setD(x); }; return () => { push = null; }; }, []);
  if (!d) return null;
  const close = (v) => { d.resolve(v); setD(null); };
  const needText = !!d.input;
  return (
    <Modal title={d.title || t('Confirm')} onClose={() => close(needText ? null : false)}
      footer={<><button type="button" className="btn" onClick={() => close(needText ? null : false)}>{t('Cancel')}</button>
        <button type="button" className={`btn ${d.danger ? 'btn-danger' : 'btn-primary'}`} disabled={needText && d.input.required !== false && !text.trim()} onClick={() => close(needText ? text.trim() : true)}>{d.confirmLabel || t('Confirm')}</button></>}>
      {d.message && <p className="small">{d.message}</p>}
      {needText && <Field label={d.input.label} required={d.input.required !== false}>{(id) => <input id={id} className="input" value={text} onChange={e => setText(e.target.value)} />}</Field>}
    </Modal>
  );
}

export function OfflineBanner() {
  const { t } = useApp();
  const [off, setOff] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOff(false); const offF = () => setOff(true);
    window.addEventListener('online', on); window.addEventListener('offline', offF);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', offF); };
  }, []);
  if (!off) return null;
  return <div className="offline-banner" role="status"><WifiOff size={16} aria-hidden="true" />{t('You\'re offline. Changes will sync when you\'re back.')}</div>;
}

export function SessionExpired() {
  const { t, sessionExpired, logout } = useApp();
  if (!sessionExpired) return null;
  return (
    <Modal title={t('Your session has expired')} onClose={logout} footer={<button type="button" className="btn btn-primary" onClick={logout}><LogIn size={16} />{t('Sign in again')}</button>}>
      <p className="small">{t('For your security, you were signed out after a period of inactivity. Unsaved table rows are kept in this browser and restored after you sign in.')}</p>
    </Modal>
  );
}
