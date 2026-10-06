// Component library built on the design tokens (no third-party UI styling).
import { useEffect, useMemo, useRef, useState, useId } from 'react';
import { X, Loader2, AlertTriangle, Inbox, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, CheckCircle2, Info, AlertCircle } from 'lucide-react';
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

// Page sizes offered on long lists (graphical chart §8.9 and §18.1): 20 by default, then 50,
// 100 or all records. The choice persists per user in this browser.
export const PAGE_SIZES = [20, 50, 100, 0];
const readPref = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const writePref = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };
export function usePageSize() {
  const [size, setSize] = useState(() => Number(readPref('layout.pageSize', '20')));
  return [size, (v) => { setSize(v); writePref('layout.pageSize', String(v)); }];
}
export function useDensity() {
  const [d, setD] = useState(() => readPref('layout.density', 'comfortable'));
  return [d, (v) => { setD(v); writePref('layout.density', v); }];
}

/** Pager: "1–20 of 345", rows per page (20, 50, 100, All), previous / next and "Page X of Y". */
export function Pager({ total, page, size, onPage, onSize, density, onDensity }) {
  const { t, fmtNum } = useApp();
  const pages = size ? Math.max(1, Math.ceil(total / size)) : 1;
  const from = total ? (size ? (page - 1) * size + 1 : 1) : 0;
  const to = size ? Math.min(total, page * size) : total;
  return (
    <div className="pager" role="navigation" aria-label={t('Pagination')}>
      <span className="small muted">{t('{from}–{to} of {total}', { from: fmtNum(from, 0), to: fmtNum(to, 0), total: fmtNum(total, 0) })}</span>
      <label className="small muted pager-size">{t('Rows per page')}
        <select className="select select-sm" value={size} onChange={e => onSize(Number(e.target.value))}>
          {PAGE_SIZES.map(n => <option key={n} value={n}>{n || t('All')}</option>)}
        </select>
      </label>
      {onDensity && (
        <div className="segmented" role="group" aria-label={t('Density')}>
          <button type="button" aria-pressed={density === 'comfortable'} onClick={() => onDensity('comfortable')}>{t('Comfortable')}</button>
          <button type="button" aria-pressed={density === 'compact'} onClick={() => onDensity('compact')}>{t('Compact')}</button>
        </div>
      )}
      {pages > 1 && (
        <div className="pager-pages">
          <button type="button" className="btn btn-icon btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t('Previous page')}><ChevronLeft size={16} className="flip-rtl" /></button>
          <span className="small muted">{t('Page {n} of {total}', { n: page, total: pages })}</span>
          <button type="button" className="btn btn-icon btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label={t('Next page')}><ChevronRight size={16} className="flip-rtl" /></button>
        </div>
      )}
    </div>
  );
}

/** Paginates any list: returns the visible slice and the pager props. */
export function usePaged(list, resetKey) {
  const [size, setSize] = usePageSize();
  const [page, setPage] = useState(1);
  const total = list?.length || 0;
  const pages = size ? Math.max(1, Math.ceil(total / size)) : 1;
  useEffect(() => { setPage(1); }, [resetKey, size]);
  const p = Math.min(page, pages);
  const shown = size ? (list || []).slice((p - 1) * size, p * size) : (list || []);
  return { shown, pager: { total, page: p, size, onPage: setPage, onSize: setSize }, needed: total > PAGE_SIZES[0] };
}

// Sortable data table: navy header, alternating rows, thin line borders, sticky header,
// three-state sort (none, ascending, descending) and pagination on long lists.
export function Table({ columns, rows, onRowClick, empty, caption, initialSort, rowKey = 'id', maxRows, paginate = true }) {
  const { t } = useApp();
  const [sort, setSort] = useState(initialSort || null);
  const [density, setDensity] = useDensity();
  const sorted = useMemo(() => {
    if (!sort) return rows || [];
    const col = columns.find(c => c.key === sort.key);
    const val = col?.sortValue || ((r) => r[sort.key]);
    return [...(rows || [])].sort((a, b) => { const x = val(a); const y = val(b); if (x === y) return 0; if (x === null || x === undefined) return 1; if (y === null || y === undefined) return -1; return (x > y ? 1 : -1) * (sort.dir === 'asc' ? 1 : -1); });
  }, [rows, sort, columns]);
  // A small maxRows is a preview (e.g. a top 10); larger lists are paginated instead.
  const preview = maxRows && maxRows <= 12;
  const { shown: paged, pager, needed } = usePaged(sorted, rows);
  const shown = preview ? sorted.slice(0, maxRows) : paginate ? paged : sorted;
  const cycle = (key) => setSort(s => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));
  if (!rows?.length) return <Empty title={empty || t('No records yet.')} />;
  return (
    <div className="table-block">
      <div className={`table-wrap ${density === 'compact' ? 'compact' : ''}`}>
        <table className="data">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead><tr>{columns.map(c => (
            <th key={c.key} scope="col" style={{ width: c.width }} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
              {c.sortable === false ? c.label : <button className="th-btn" onClick={() => cycle(c.key)}>{c.label}{sort?.key === c.key && (sort.dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}</button>}
            </th>))}</tr></thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={r[rowKey] ?? i} className={onRowClick ? 'clickable' : ''} tabIndex={onRowClick ? 0 : undefined} onClick={onRowClick ? () => onRowClick(r) : undefined} onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(r); } : undefined}>
                {columns.map(c => <td key={c.key} className={c.cellClass ? c.cellClass(r) : ''}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview && sorted.length > maxRows && <p className="small muted" style={{ padding: 'var(--sp-8) var(--sp-12)', margin: 0 }}>{t('Showing {n} of {total}', { n: maxRows, total: sorted.length })}</p>}
      {!preview && paginate && needed && <Pager {...pager} density={density} onDensity={setDensity} />}
    </div>
  );
}

export function Field({ label, hint, error, required, children, id }) {
  const gen = useId();
  const fid = id || gen;
  const child = typeof children === 'function' ? children(fid) : children;
  return (
    <div className="field">
      <label htmlFor={fid}>{required && <span className="req" aria-hidden="true">*</span>}{label}</label>
      {child}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="error" role="alert">{error}</span>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide, full }) {
  const ref = useRef(null);
  // Callers pass a new onClose on every render: read it through a ref so the focus effect runs
  // once per opening (initial focus and focus return), not on every keystroke in the dialog.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    const el = ref.current;
    el?.querySelector('input, select, textarea, button:not([data-close])')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, []);
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
  const { dismissToast } = useApp();
  const Icon = { ok: CheckCircle2, error: AlertCircle, warn: AlertTriangle, info: Info };
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map(x => {
        const I = Icon[x.kind] || CheckCircle2;
        return (
          <div key={x.id} className={`toast ${x.kind || 'ok'}`}>
            <I size={18} aria-hidden="true" />
            <span>{x.message}</span>
            {x.action && <button type="button" className="toast-action" onClick={() => { x.action.run(); dismissToast(x.id); }}>{x.action.label}</button>}
            <button type="button" className="toast-close" aria-label="×" onClick={() => dismissToast(x.id)}><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
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
