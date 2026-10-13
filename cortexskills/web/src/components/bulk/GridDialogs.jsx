// Dialogs and notices of the bulk-entry grid: delete confirmation (accessible modal, never window.confirm), the
// conflicts of a restored draft, the progress of a batched operation with Cancel and Resume, and the banners
// (draft restored, offline queue, read-only reason).
import { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n.jsx';
import { Modal, Btn, Icon } from '../ui.jsx';

export function ConfirmDelete({ n, onCancel, onConfirm }) {
  const { t } = useI18n();
  return <Modal title={t('mre.deleteTitle', { n })} onClose={onCancel} destructive describedBy="del-text"
    footer={<><Btn onClick={onCancel}>{t('common.cancel')}</Btn><Btn kind="danger" icon="Trash2" onClick={onConfirm} autoFocus>{t('mre.deleteN', { n })}</Btn></>}>
    <p id="del-text" className="small">{t('mre.deleteText', { s: 10 })}</p></Modal>;
}
export function ConfirmDiscard({ n, onCancel, onConfirm }) {
  const { t } = useI18n();
  return <Modal title={t('mre.discardTitle')} onClose={onCancel} destructive describedBy="disc-text"
    footer={<><Btn onClick={onCancel}>{t('common.cancel')}</Btn><Btn kind="danger" icon="Undo2" onClick={onConfirm}>{t('mre.discard')}</Btn></>}>
    <p id="disc-text" className="small">{t('mre.discardConfirm', { n })}</p></Modal>;
}

/** Rows of a restored draft that changed on the server since: keep mine (overwrite) or take the server version. */
export function ConflictDialog({ conflicts, columns, onResolve, onClose }) {
  const { t } = useI18n(); const [choice, setChoice] = useState(() => Object.fromEntries(conflicts.map((c, i) => [i, 'mine'])));
  const show = v => (v == null ? '—' : typeof v === 'object' ? v.en ?? JSON.stringify(v) : String(v));
  const diff = c => columns.filter(col => show(c.mine?.[col.key]) !== show(c.theirs?.[col.key]));
  return <Modal wide title={t('mre.conflictTitle', { n: conflicts.length })} onClose={onClose}
    footer={<><Btn onClick={() => conflicts.forEach(c => onResolve(c, 'theirs'))}>{t('mre.takeAllServer')}</Btn><Btn onClick={() => conflicts.forEach(c => onResolve(c, 'mine'))}>{t('mre.keepAllMine')}</Btn><span className="spacer" /><Btn kind="primary" onClick={() => conflicts.forEach((c, i) => onResolve(c, choice[i]))}>{t('mre.applyChoices')}</Btn></>}>
    <p className="small">{t('mre.conflictText')}</p>
    <div className="stack">{conflicts.map((c, i) => <div key={i} className="card flat stack conflict-card">
      <div className="row"><span className="strong small">{show(c.mine?.[columns[0]?.key])}</span><span className="pill xs">{t(c.kind === 'deleted' ? 'mre.conflictDeleted' : 'mre.conflictChanged')}</span></div>
      {c.kind === 'changed' && <table className="tbl compact"><thead><tr><th scope="col">{t('col.field')}</th><th scope="col">{t('mre.mine')}</th><th scope="col">{t('mre.theirs')}</th></tr></thead>
        <tbody>{diff(c).map(col => <tr key={col.key}><td>{col.label}</td><td>{show(c.mine?.[col.key])}</td><td>{show(c.theirs?.[col.key])}</td></tr>)}</tbody></table>}
      <div className="row" role="radiogroup" aria-label={t('mre.conflictChoice')}>
        <label className="check"><input type="radio" name={`cf-${i}`} checked={choice[i] === 'mine'} onChange={() => setChoice(s => ({ ...s, [i]: 'mine' }))} />{t(c.kind === 'deleted' ? 'mre.recreate' : 'mre.keepMine')}</label>
        <label className="check"><input type="radio" name={`cf-${i}`} checked={choice[i] === 'theirs'} onChange={() => setChoice(s => ({ ...s, [i]: 'theirs' }))} />{t(c.kind === 'deleted' ? 'mre.dropMine' : 'mre.takeServer')}</label></div></div>)}</div>
  </Modal>;
}

/** Progress of a batched operation, announced to assistive technologies, with Cancel, Resume and Close. */
export function ProgressPanel({ p, onClose }) {
  const { t } = useI18n();
  useEffect(() => { if (!p?.finished || p.failed || p.cancelled) return undefined; const h = setTimeout(onClose, 6000); return () => clearTimeout(h); }, [p, onClose]);
  if (!p) return null; const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  return <div className={`batch-panel ${p.failed ? 'has-failed' : ''}`} role="status" aria-live="polite">
    <Icon name={p.finished ? (p.failed || p.cancelled ? 'TriangleAlert' : 'CircleCheck') : 'Loader'} size={16} className={p.finished ? (p.failed ? 'err-ico' : 'saved-ico') : 'spinner'} />
    <span className="small strong">{p.label || t('mre.batch')}</span>
    <span className="batch-bar" aria-hidden="true"><span style={{ width: pct + '%' }} /></span>
    <span className="xs">{t('mre.batchOf', { done: p.done, total: p.total })}{p.failed ? ' · ' + t('mre.batchFailed', { n: p.failed }) : ''}{p.cancelled ? ' · ' + t('mre.batchCancelled') : ''}</span>
    {!p.finished && p.cancel && <Btn size="sm" kind="ghost" onClick={p.cancel}>{t('common.cancel')}</Btn>}
    {p.finished && p.resume && <Btn size="sm" icon="RotateCw" onClick={p.resume}>{t('mre.resume')}</Btn>}
    {p.finished && <Btn size="sm" kind="ghost" icon="X" aria-label={t('common.close')} onClick={onClose} />}
  </div>;
}

export function Banner({ icon, tone = 'grey', children, actions }) {
  return <div className={`notice ${tone} grid-banner`} role="status"><Icon name={icon} /><div className="small" style={{ flex: 1 }}>{children}</div>{actions}</div>;
}
