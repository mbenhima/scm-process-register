// Component library built on the design tokens (no third-party UI styling).
import { useEffect, useMemo, useRef, useState, useId } from 'react';
import { X, Loader2, AlertTriangle, Inbox, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../lib/state.jsx';

export function IconBadge({ icon: Icon, accent = false, size = '', label }) {
  return <span className={`badge-icon ${accent ? 'accent' : ''} ${size}`} aria-hidden={label ? undefined : true} title={label}><Icon /></span>;
}

export function PageHead({ eyebrow, title, subtitle, actions, children }) {
  return (
    <header className="page-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Card({ title, action, children, className = '', tight, as: As = 'section', ...rest }) {
  return (
    <As className={`card ${tight ? 'tight' : ''} ${className}`} {...rest}>
      {(title || action) && <div className="section-title">{title && <h3>{title}</h3>}{action}</div>}
      {children}
    </As>
  );
}

const SCALE = {
  s5: ['Done', 'Completed', 'Closed', 'Published', 'Effective', 'Valid', 'Approved', 'Implemented', 'Held', 'Accepted', 'Go', 'OK'],
  s4: ['On track', 'Treated', 'Active', 'Noted', 'Edited', 'Partially effective', 'Low'],
  s3: ['InProgress', 'In progress', 'In review', 'Monitoring', 'Verification', 'Action', 'Medium', 'Minor', 'Observation', 'OFI', 'Conditional'],
  s2: ['AtGate', 'At gate', 'Planned', 'Pending', 'Draft', 'Analysis', 'Proposed', 'OnHold', 'On hold', 'Hold', 'Under review', 'Major', 'High', 'Todo', 'NotStarted', 'Not started'],
  s1: ['Overdue', 'Critical', 'At risk', 'Rejected', 'Open', 'No-Go', 'Failed', 'Not effective', 'Stopped', 'Superseded'],
};
export const scaleOf = (status) => Object.keys(SCALE).find(k => SCALE[k].includes(status)) || '';
export function Status({ value, scale }) {
  const { L } = useApp();
  if (value === null || value === undefined || value === '') return <span className="muted">—</span>;
  return <span className={`tag ${scale || scaleOf(value)}`}>{L(value)}</span>;
}

export function Progress({ value, label }) {
  const v = Math.max(0, Math.min(100, Math.round(value || 0)));
  return <div className={`progress ${v === 100 ? 'done' : ''}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}><span style={{ width: `${v}%` }} /></div>;
}

export function Kpi({ value, label, foot, icon, accent }) {
  return (
    <div className="card tight kpi">
      <div className="row-between">
        <span className="value num">{value}</span>
        {icon && <IconBadge icon={icon} accent={accent} size="sm" />}
      </div>
      <span className="label">{label}</span>
      {foot && <span className="foot">{foot}</span>}
    </div>
  );
}

export function Loading({ label }) {
  const { t } = useApp();
  return <div className="empty" role="status" aria-live="polite"><Loader2 className="spin" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }} /><p className="small">{label || t('Loading…')}</p></div>;
}
export function ErrorBox({ error, onRetry }) {
  const { t } = useApp();
  if (!error) return null;
  return (
    <div className="callout bad" role="alert">
      <AlertTriangle aria-hidden="true" />
      <div className="stack-8"><strong>{error.status === 404 ? t('Not found or not accessible.') : error.status === 403 ? t('You do not have permission for this action.') : error.status === 402 ? t('This feature is not included in your configuration.') : t('Something went wrong.')}</strong><span>{error.message}</span>{onRetry && <button className="btn btn-sm" onClick={onRetry}>{t('Try again')}</button>}</div>
    </div>
  );
}
export function Empty({ icon: Icon = Inbox, title, children, action }) {
  return <div className="empty"><IconBadge icon={Icon} size="lg" /><h4>{title}</h4>{children && <p className="small">{children}</p>}{action}</div>;
}

export function Tabs({ tabs, value, onChange, label }) {
  const refs = useRef([]);
  const onKey = (e, i) => {
    const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
    let n = null;
    if (e.key === 'ArrowRight') n = (i + dir + tabs.length) % tabs.length;
    if (e.key === 'ArrowLeft') n = (i - dir + tabs.length) % tabs.length;
    if (n !== null) { e.preventDefault(); onChange(tabs[n].id); refs.current[n]?.focus(); }
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tb, i) => (
        <button key={tb.id} ref={el => { refs.current[i] = el; }} role="tab" className="tab" aria-selected={value === tb.id} tabIndex={value === tb.id ? 0 : -1} onClick={() => onChange(tb.id)} onKeyDown={e => onKey(e, i)}>
          {tb.label}{tb.count !== undefined && <span className="muted"> · {tb.count}</span>}
        </button>
      ))}
    </div>
  );
}

// Sortable data table: orange header, alternating rows, thin grey borders.
export function Table({ columns, rows, onRowClick, empty, caption, initialSort, rowKey = 'id', maxRows }) {
  const { t } = useApp();
  const [sort, setSort] = useState(initialSort || null);
  const sorted = useMemo(() => {
    if (!sort) return rows || [];
    const col = columns.find(c => c.key === sort.key);
    const val = col?.sortValue || ((r) => r[sort.key]);
    return [...(rows || [])].sort((a, b) => { const x = val(a); const y = val(b); if (x === y) return 0; if (x === null || x === undefined) return 1; if (y === null || y === undefined) return -1; return (x > y ? 1 : -1) * (sort.dir === 'asc' ? 1 : -1); });
  }, [rows, sort, columns]);
  const shown = maxRows ? sorted.slice(0, maxRows) : sorted;
  if (!rows?.length) return <Empty title={empty || t('No records yet.')} />;
  return (
    <div className="table-wrap">
      <table className="data">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead><tr>{columns.map(c => (
          <th key={c.key} scope="col" style={{ width: c.width }} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
            {c.sortable === false ? c.label : <button className="th-btn" onClick={() => setSort(s => ({ key: c.key, dir: s?.key === c.key && s.dir === 'asc' ? 'desc' : 'asc' }))}>{c.label}{sort?.key === c.key && (sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</button>}
          </th>))}</tr></thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={r[rowKey] ?? i} className={onRowClick ? 'clickable' : ''} tabIndex={onRowClick ? 0 : undefined} onClick={onRowClick ? () => onRowClick(r) : undefined} onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(r); } : undefined}>
              {columns.map(c => <td key={c.key} className={c.cellClass ? c.cellClass(r) : ''}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {maxRows && sorted.length > maxRows && <p className="small muted" style={{ padding: 'var(--sp-8) var(--sp-12)', margin: 0 }}>{t('Showing {n} of {total}', { n: maxRows, total: sorted.length })}</p>}
    </div>
  );
}

export function Field({ label, hint, error, required, children, id }) {
  const gen = useId();
  const fid = id || gen;
  const child = typeof children === 'function' ? children(fid) : children;
  return (
    <div className="field">
      <label htmlFor={fid}>{label}{required && <span className="req" aria-hidden="true">*</span>}</label>
      {child}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="error" role="alert">{error}</span>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide, full }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const el = ref.current;
    el?.querySelector('input, select, textarea, button:not([data-close])')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  const { t } = useApp();
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${full ? "full" : wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head"><h3>{title}</h3><button className="btn btn-ghost btn-icon btn-sm" data-close onClick={onClose} aria-label={t('Close')}><X size={18} /></button></div>
        <div className="modal-body" tabIndex={-1}>{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return <div className="toasts" role="status" aria-live="polite">{toasts.map(x => <div key={x.id} className={`toast ${x.kind === 'error' ? 'error' : ''}`}>{x.message}</div>)}</div>;
}

export function Search({ value, onChange, placeholder }) {
  return <div className="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg><input className="input" type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>;
}

// Localized text for API values that may still be {en,fr,ar} objects.
export function tx(v, lang) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && !Array.isArray(v)) return v[lang] ?? v.en ?? v.fr ?? v.ar ?? '';
  if (Array.isArray(v)) return v.map(x => tx(x, lang)).join('; ');
  return String(v);
}
