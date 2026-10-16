// Leave Guard (FR-DA-MRE-32): leaving a page that holds rows not saved — a link, the browser
// Back action or a programmatic navigation — asks Save and leave, Discard and leave, or Stay,
// with the number of rows and of rows with errors. Closing the browser tab uses the browser's
// own warning (the only one a page may show then); the Draft Backup keeps the rows anyway.
import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useApp } from '../lib/state.jsx';
import { Modal } from './ui.jsx';
import { pendingEntries } from '../lib/entrystore.js';

export default function LeaveGuard() {
  const { t } = useApp();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname && pendingEntries().length > 0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const warn = (e) => { if (pendingEntries().length) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  useEffect(() => { if (blocker.state !== 'blocked') { setFailed(false); setBusy(false); } }, [blocker.state]);
  if (blocker.state !== 'blocked') return null;
  const list = pendingEntries();
  const rows = list.reduce((a, e) => a + e.pending, 0);
  const errs = list.reduce((a, e) => a + e.errors, 0);
  const save = async () => {
    setBusy(true);
    const ok = (await Promise.all(list.map(e => e.saveAll().catch(() => false)))).every(Boolean);
    setBusy(false);
    if (ok) blocker.proceed(); else setFailed(true);
  };
  const discard = () => { list.forEach(e => e.discard()); blocker.proceed(); };
  return (
    <Modal title={t('Leave this page?')} onClose={() => blocker.reset()} footer={<>
      <button type="button" className="btn" onClick={() => blocker.reset()}>{t('Stay on the page')}</button>
      <button type="button" className="btn btn-danger" onClick={discard}>{t('Discard and leave')}</button>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>{busy ? t('Saving…') : t('Save and leave')}</button>
    </>}>
      <p>{t('{n} rows are not saved', { n: rows })}{errs ? ` — ${t('{n} with errors', { n: errs })}` : ''}{list.length ? ` (${list.map(e => e.title()).filter(Boolean).join(', ')})` : ''}.</p>
      {failed && <div className="callout bad small" role="alert"><span>{t('Some rows could not be saved: correct them or discard them before leaving.')}</span></div>}
    </Modal>
  );
}
