import { useEffect, useMemo, useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession } from '../lib/session.jsx';
import { downloadCsv } from '../lib/api.js';

export const Icon = ({ name, size = 16, ...p }) => { const C = Icons[name] || Icons.Circle; return <C size={size} strokeWidth={1.75} aria-hidden="true" {...p} />; };
export function IconBadge({ name, emph, size = '' }) { return <span className={`badge-ico ${emph ? 'emph' : ''} ${size}`}><Icon name={name} size={20} /></span>; }

export function PageHead({ eyebrow, title, subtitle, children }) {
  return (<div className="page-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle && <p className="subtitle">{subtitle}</p>}</div>{children && <div className="actions">{children}</div>}</div>);
}
export function Card({ title, actions, children, className = '', tint }) {
  return (<section className={`card ${tint ? 'tint' : ''} ${className}`}>{(title || actions) && <div className="card-head">{title && <h3>{title}</h3>}{actions && <div className="actions">{actions}</div>}</div>}{children}</section>);
}
export function Btn({ icon, children, kind = '', size = '', ...p }) {
  return <button type="button" className={`btn ${kind} ${size} ${!children ? 'icon' : ''}`} {...p}>{icon && <Icon name={icon} />}{children}</button>;
}
export function Kpi({ value, label, note, icon, emph = true, small }) {
  return (<div className="card kpi">{icon && <IconBadge name={icon} emph={emph} />}<div><div className={`kpi-value ${small ? 'sm' : ''}`}>{value}</div><div className="kpi-label">{label}</div>{note && <div className="kpi-note">{note}</div>}</div></div>);
}
export function Progress({ value, lg, label }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className={`progress ${lg ? 'lg' : ''}`} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><span style={{ width: v + '%' }} /></div>;
}

const STATUS_CLASS = { 'Completed': 's5', 'Done': 's5', 'Green': 's4', 'Approved': 's5', 'Published': 's5', 'Active': 's4', 'Validated': 's4', 'Signed off': 's5', 'Go': 's5', 'Effective': 's4', 'Valid': 's4', 'Given': 's4', 'Matched': 's4', 'Locked': 's5', 'Filled': 's5', 'Met': 's4', 'Closed': 's4',
  'In progress': 'tint', 'In Review': 's3', 'Submitted': 's3', 'Pending Validation': 's3', 'Pending Re-validation': 's2', 'Amber': 's2', 'Expiring': 's2', 'Partially effective': 's2', 'Hold': 's2', 'Partial': 's2', 'Distributed': 's3', 'Open': 's3', 'Review': 's3', 'Shortlisting': 's3',
  'Blocked': 's1', 'Red': 's1', 'Rejected': 's1', 'Expired': 's1', 'No-Go': 's1', 'Ineffective': 's1', 'Refused': 's1', 'Unmatched': 's1', 'Deprecated': 's2', 'Retired': '', 'Draft': '', 'Not started': '', 'Deployment responsibility': 'tint' };
export function StatusPill({ value }) { const { t } = useI18n(); if (value == null || value === '') return <span className="muted">—</span>; return <span className={`pill ${STATUS_CLASS[value] ?? ''}`}>{t('status.' + value)}</span>; }
export function AiBadge({ tier }) { const { t } = useI18n(); return <span className={`pill tint ai ${tier === 'Augmented' ? 'aug' : ''}`} title={t('ai.tier.' + tier + '.hint')}><Icon name={tier === 'Augmented' ? 'Sparkles' : 'Wand2'} size={12} />{t('ai.tier.' + tier)}</span>; }

export function Tabs({ tabs, value, onChange }) {
  return <div className="tabs" role="tablist">{tabs.map(tb => <button key={tb.id} role="tab" className="tab" aria-selected={value === tb.id} onClick={() => onChange(tb.id)}>{tb.label}{tb.count != null && <span className="muted"> · {tb.count}</span>}</button>)}</div>;
}
export function Seg({ options, value, onChange, label }) {
  return <div className="seg" role="group" aria-label={label}>{options.map(o => <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>)}</div>;
}

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose?.(); document.addEventListener('keydown', k); ref.current?.querySelector('input,textarea,select,button')?.focus(); return () => document.removeEventListener('keydown', k); }, [onClose]);
  return (<div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose?.()}><div className={`dialog ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
    <div className="dialog-head"><h2 style={{ fontSize: 'var(--fs-20)' }}>{title}</h2><Btn icon="X" kind="ghost" aria-label="Close" onClick={onClose} /></div>
    <div className="dialog-body">{children}</div>{footer && <div className="dialog-foot">{footer}</div>}</div></div>);
}
/** Stage-then-justify: the new value is staged, a justification note is written, then saved (Section 3.7). */
export function JustifyDialog({ title, required = true, onCancel, onConfirm, extra }) {
  const { t } = useI18n(); const [note, setNote] = useState('');
  return (<Modal title={title || t('justify.title')} onClose={onCancel} footer={<><Btn onClick={onCancel}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={required && !note.trim()} onClick={() => onConfirm(note)}>{t('common.save')}</Btn></>}>
    {extra}<div className="field"><label htmlFor="just">{t('justify.label')}</label><textarea id="just" className="input" value={note} onChange={e => setNote(e.target.value)} placeholder={t('justify.placeholder')} /><span className="hint">{required ? t('justify.required') : t('justify.optional')}</span></div></Modal>);
}

export function Field({ label, hint, children, id }) { return <div className="field"><label htmlFor={id}>{label}</label>{children}{hint && <span className="hint">{hint}</span>}</div>; }
export function Search({ value, onChange, placeholder }) { return <div className="search"><Icon name="Search" /><input className="input" type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>; }

export function Empty({ icon = 'Inbox', title, text, children }) { return <div className="empty"><IconBadge name={icon} size="lg" /><h3>{title}</h3>{text && <p className="muted">{text}</p>}{children}</div>; }
export function Loading() { const { t } = useI18n(); return <div className="empty" aria-live="polite"><p className="muted">{t('common.loading')}</p></div>; }
/** Access notice instead of a blank page (FR-DA-RBAC-08). */
export function AccessNotice({ error }) {
  const { t } = useI18n();
  const p = error?.params || {};
  return (<div className="card" role="alert"><div className="kpi"><IconBadge name="Lock" /><div><h3>{t('access.title')}</h3><p>{error?.message || t('access.text')}</p>
    <p className="muted">{p.permission ? t('access.permission', { permission: p.permission }) : p.feature ? t('access.feature', { feature: p.feature }) : ''} {t('access.whom')}</p></div></div></div>);
}
export function Guard({ state, children }) {
  if (state.loading && !state.data) return <Loading />;
  if (state.error) return <AccessNotice error={state.error} />;
  return children(state.data);
}

/** Data table: sortable headers, search, CSV export of what is on screen, first column kept visible. */
export function DataTable({ columns, rows, onRow, csvName, search = true, pageSize = 50, empty, dense }) {
  const { t } = useI18n(); const [q, setQ] = useState(''); const [sort, setSort] = useState(null); const [limit, setLimit] = useState(pageSize);
  const filtered = useMemo(() => {
    let r = rows || [];
    if (q) { const s = q.toLowerCase(); r = r.filter(x => columns.some(c => String(c.text ? c.text(x) : c.value ? c.value(x) : x[c.key] ?? '').toLowerCase().includes(s))); }
    if (sort) { const c = columns.find(c => c.key === sort.key); const val = x => (c.sortValue ? c.sortValue(x) : c.text ? c.text(x) : c.value ? c.value(x) : x[c.key]) ?? ''; r = [...r].sort((a, b) => { const A = val(a), B = val(b); const n = typeof A === 'number' && typeof B === 'number' ? A - B : String(A).localeCompare(String(B)); return sort.dir * n; }); }
    return r;
  }, [rows, q, sort, columns]);
  const csv = () => downloadCsv(csvName || 'export', columns.filter(c => !c.noCsv).map(c => c.label), filtered.map(x => columns.filter(c => !c.noCsv).map(c => c.text ? c.text(x) : c.value ? c.value(x) : x[c.key])));
  return (<div className="stack">
    {(search || csvName) && <div className="row" style={{ justifyContent: 'space-between' }}>{search ? <div style={{ flex: '1 1 260px', maxWidth: 420 }}><Search value={q} onChange={setQ} placeholder={t('common.search')} /></div> : <span />}
      <div className="row"><span className="muted">{t('common.rows', { n: filtered.length })}</span>{csvName && <Btn icon="Download" size="sm" onClick={csv}>CSV</Btn>}</div></div>}
    <div className="table-wrap"><table className="tbl"><thead><tr>{columns.map((c, i) => <th key={c.key} className={`${i === 0 ? 'sticky-col' : ''} ${c.num ? 'num' : ''}`} scope="col" aria-sort={sort?.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>
      {c.noSort ? c.label : <button onClick={() => setSort(s => ({ key: c.key, dir: s?.key === c.key ? -s.dir : 1 }))}>{c.label}{sort?.key === c.key && <Icon name={sort.dir > 0 ? 'ChevronUp' : 'ChevronDown'} size={12} />}</button>}</th>)}</tr></thead>
      <tbody>{filtered.slice(0, limit).map((x, ri) => <tr key={x.id || ri} className={onRow ? 'clickable' : ''} onClick={onRow ? () => onRow(x) : undefined} tabIndex={onRow ? 0 : undefined} onKeyDown={onRow ? e => e.key === 'Enter' && onRow(x) : undefined}>
        {columns.map((c, i) => <td key={c.key} className={`${i === 0 ? 'sticky-col' : ''} ${c.num ? 'num' : ''} ${c.nowrap || /^(id|code|ref|key|uft|mp|e2e)$/i.test(c.key) ? 'nowrap' : ''}`} style={dense ? { padding: 'var(--sp-2)' } : undefined}>{c.render ? c.render(x) : c.text ? c.text(x) : c.value ? c.value(x) : x[c.key] ?? '—'}</td>)}</tr>)}
        {!filtered.length && <tr><td colSpan={columns.length}><span className="muted">{empty || t('common.noRows')}</span></td></tr>}</tbody></table></div>
    {filtered.length > limit && <Btn onClick={() => setLimit(l => l + pageSize * 2)}>{t('common.showMore', { n: filtered.length - limit })}</Btn>}
  </div>);
}

export function Legend({ items }) { return <div className="legend">{items.map(i => <span key={i.label}><i style={{ background: i.color }} />{i.label}</span>)}</div>; }
export function KV({ items }) { return <dl className="kv">{items.filter(Boolean).map(([k, v], i) => <FragmentKV key={i} k={k} v={v} />)}</dl>; }
const FragmentKV = ({ k, v }) => <><dt>{k}</dt><dd>{v ?? '—'}</dd></>;

export function Toasts() {
  const { toasts } = useSession();
  return <div className="toasts" role="status" aria-live="polite">{toasts.map(x => <div key={x.id} className={`toast ${x.kind}`}><Icon name={x.kind === 'error' ? 'CircleAlert' : 'CircleCheck'} />{x.text}</div>)}</div>;
}
/** Wraps an async action: shows the translated server message on error, a confirmation on success. */
export function useAction() {
  const { toast } = useSession(); const { t } = useI18n();
  return async (fn, okKey = 'common.saved') => { try { const r = await fn(); if (okKey) toast(t(okKey)); return r; } catch (e) { toast(e.message || t('err.server'), 'error'); throw e; } };
}
