import { cloneElement, isValidElement, createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { X, Download, ArrowUpDown, Search, AlertCircle, CheckCircle2, Inbox } from 'lucide-react';
import { useT } from '../lib/i18n.jsx';
import { api } from '../lib/api.js';
import { downloadCsv } from '../lib/csv.js';

// ------------------------------------------------------------------ layout
export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </header>
  );
}
export const Card = ({ className = '', children, ...p }) => <section className={`card ${className}`} {...p}>{children}</section>;
export function CardHead({ title, subtitle, actions }) {
  return (
    <div className="card-head">
      <div><h3>{title}</h3>{subtitle && <div className="muted">{subtitle}</div>}</div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}
export function IconBadge({ icon: Icon, size = 40, accent = false, label }) {
  return <span className={`icon-badge ${accent ? 'accent' : ''}`} style={{ width: size, height: size }} aria-hidden={!label} aria-label={label}><Icon /></span>;
}
export function Kpi({ value, label, meta, neutral = false, icon }) {
  return (
    <Card className="kpi">
      <div className="row between">
        <span className={`value ${neutral ? 'neutral' : ''}`}>{value ?? '—'}</span>
        {icon && <IconBadge icon={icon} size={40} accent={!neutral} />}
      </div>
      <span className="label">{label}</span>
      {meta && <span className="meta">{meta}</span>}
    </Card>
  );
}

// ------------------------------------------------------------------ buttons
export function Button({ variant = 'secondary', size, icon: Icon, children, busy, ...p }) {
  return (
    <button type="button" className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''}`} disabled={busy || p.disabled} {...p}>
      {Icon && <Icon aria-hidden />}{children}
    </button>
  );
}
export function IconButton({ icon: Icon, label, size, pressed, ...p }) {
  return (
    <button type="button" className={`icon-btn ${size === 'sm' ? 'sm' : ''}`} aria-label={label} title={label} aria-pressed={pressed} {...p}>
      <Icon aria-hidden />{p.children}
    </button>
  );
}

// ------------------------------------------------------------------ status vocabulary (one scale everywhere, NFR-DA-UX-04)
const STATUS = {
  s5: ['Done', 'Completed', 'Complete', 'Effective', 'Go', 'Approved', 'Healthy', 'delivered', 'sent', 'Launched', 'met', 'active', 'Accepted', 'Mitigated', 'Mandatory', 'Selected'],
  s4: ['Decided', 'Low', 'Continue', 'Assistive', 'On', 'Yes'],
  s3: ['Recycle', 'Waived', 'Medium', 'Scheduled', 'Edited', 'Waiver requested', 'Partially effective', 'Augmented', 'Pending Approval'],
  s2: ['In progress', 'Submitted', 'Hold', 'On Hold', 'On hold', 'queued', 'near', 'warning', 'High', 'Not tested', 'Optional', 'Retiring'],
  s1: ['Killed', 'Kill', 'Not effective', 'failed', 'Overdue', 'missed', 'expired', 'inactive', 'Authentication failure', 'Unreachable', 'Rejected', 'Critical', 'Cancelled', 'Not activated', 'Deselected', 'Off', 'No'],
};
const CLASS_OF = Object.fromEntries(Object.entries(STATUS).flatMap(([c, list]) => list.map((s) => [s, c])));
export function StatusBadge({ value, children }) {
  const t = useT();
  if (value == null || value === '') return <span className="muted">—</span>;
  return <span className={`badge ${CLASS_OF[value] || 'outline'}`}>{children || t(String(value))}</span>;
}
export const Badge = ({ tone = 'outline', children, ...p }) => <span className={`badge ${tone}`} {...p}>{children}</span>;
export function Progress({ value, label }) {
  return <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}><i style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} /></div>;
}

// ------------------------------------------------------------------ form fields
export function Field({ label, hint, error, required, children, full, className = '' }) {
  const id = useId();
  const child = typeof children === 'function' ? children(id) : children;
  return (
    <label className={`field ${full ? 'full' : ''} ${className}`} htmlFor={id}>
      <span className="lbl">{label}{required && <span className="req" aria-hidden>*</span>}</span>
      {isValidElement(child) && typeof children !== 'function' ? cloneElement(child, { id, 'aria-invalid': !!error || undefined, required: required || child.props.required }) : child}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="err" role="alert">{error}</span>}
    </label>
  );
}
export const Input = (p) => <input className="input" {...p} />;
export const Textarea = (p) => <textarea className="textarea" {...p} />;
export function Select({ options, placeholder, ...p }) {
  return (
    <select className="select" {...p}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === 'object' ? <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option> : <option key={o} value={o}>{o}</option>))}
    </select>
  );
}
export function Check({ label, ...p }) { return <label className="check"><input type="checkbox" {...p} />{label}</label>; }
export function SearchBox({ value, onChange, placeholder }) {
  const t = useT();
  return <div className="search"><Search aria-hidden /><input className="input" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || t('Search')} aria-label={placeholder || t('Search')} /></div>;
}
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  );
}

// ------------------------------------------------------------------ modal, tabs
export function Modal({ title, subtitle, onClose, children, footer, wide }) {
  const t = useT();
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('.modal-body input, .modal-body select, .modal-body textarea')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head">
          <div><h2>{title}</h2>{subtitle && <p className="subtitle">{subtitle}</p>}</div>
          <IconButton icon={X} label={t('Close')} onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tb) => <button key={tb.value} role="tab" type="button" aria-selected={value === tb.value} onClick={() => onChange(tb.value)}>{tb.label}</button>)}
    </div>
  );
}

// ------------------------------------------------------------------ data table with sort, filter, paging and CSV
export function DataTable({ columns, rows, onRowClick, csvName, pageSize = 50, filterable = true, empty, toolbar }) {
  const t = useT();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [q, rows]);
  const filtered = useMemo(() => {
    let r = rows || [];
    if (q) { const s = q.toLowerCase(); r = r.filter((row) => columns.some((c) => String(c.csv ? c.csv(row) : row[c.key] ?? '').toLowerCase().includes(s))); }
    if (sort) {
      const c = columns.find((x) => x.key === sort.key);
      const val = (row) => (c.sortValue ? c.sortValue(row) : c.csv ? c.csv(row) : row[c.key]);
      r = [...r].sort((a, b) => { const x = val(a); const y = val(b); const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }); return sort.dir * cmp; });
    }
    return r;
  }, [rows, q, sort, columns]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice(page * pageSize, page * pageSize + pageSize);
  return (
    <div>
      {(filterable || csvName || toolbar) && (
        <div className="table-tools">
          <div className="row grow">{filterable && <div style={{ minWidth: 240 }}><SearchBox value={q} onChange={setQ} placeholder={t('Filter rows')} /></div>}{toolbar}</div>
          <div className="row">
            <span className="muted">{t('{n} rows', { n: filtered.length })}</span>
            {csvName && <Button size="sm" icon={Download} onClick={() => downloadCsv(csvName, columns.filter((c) => !c.noCsv), view)}>{t('CSV')}</Button>}
          </div>
        </div>
      )}
      <div className="table-wrap">
        <table className="data">
          <thead><tr>{columns.map((c) => (
            <th key={c.key} className={c.num ? 'num' : ''} style={c.width ? { width: c.width } : undefined} aria-sort={sort?.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}>
              {c.sortable === false ? c.label : <button type="button" onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: -s.dir } : { key: c.key, dir: 1 }))}>{c.label}<ArrowUpDown size={12} aria-hidden /></button>}
            </th>))}</tr></thead>
          <tbody>
            {view.map((row, i) => (
              <tr key={row.id ?? i} className={onRowClick ? 'clickable' : ''} onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined} onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row); } : undefined}>
                {columns.map((c) => <td key={c.key} className={c.num ? 'num' : ''}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!view.length && <Empty text={empty || t('No records match.')} />}
      </div>
      {pages > 1 && (
        <div className="pager">
          <Button size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>{t('Previous')}</Button>
          <span className="muted">{t('Page {p} of {n}', { p: page + 1, n: pages })}</span>
          <Button size="sm" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>{t('Next')}</Button>
        </div>
      )}
    </div>
  );
}

export function Empty({ text, action }) {
  return <div className="empty"><Inbox size={32} aria-hidden /><div>{text}</div>{action}</div>;
}
export const Skeleton = ({ h = 160 }) => <div className="skeleton" style={{ minHeight: h }} aria-busy="true" />;
export function ErrorNote({ error }) {
  const t = useT();
  if (!error) return null;
  return <div className="callout bad" role="alert"><AlertCircle size={20} aria-hidden /><div>{t(error.message || String(error))}</div></div>;
}

// ------------------------------------------------------------------ toasts
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const t = useT();
  const [items, setItems] = useState([]);
  const push = useCallback((text, kind = 'ok') => {
    const id = Math.random();
    setItems((x) => [...x, { id, text, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);
  const api2 = useMemo(() => ({ ok: (m) => push(m, 'ok'), err: (e) => push(t(e?.message || String(e)), 'error') }), [push, t]);
  return (
    <ToastCtx.Provider value={api2}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((i) => <div key={i.id} className={`toast ${i.kind === 'error' ? 'error' : ''}`}>{i.kind === 'error' ? <AlertCircle size={18} aria-hidden /> : <CheckCircle2 size={18} aria-hidden />}<span>{i.text}</span></div>)}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// ------------------------------------------------------------------ data hook
export function useFetch(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try { const data = await api(path); setState({ data, error: null, loading: false }); }
    catch (error) { setState({ data: null, error, loading: false }); }
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: load, setData: (d) => setState((s) => ({ ...s, data: typeof d === 'function' ? d(s.data) : d })) };
}

// Stage-then-justify: collect the justification note before saving a governed change.
export function JustifyModal({ title, onCancel, onConfirm, required = true, busy }) {
  const t = useT();
  const [note, setNote] = useState('');
  return (
    <Modal title={title || t('Justify this change')} onClose={onCancel}
      footer={<><Button onClick={onCancel}>{t('Cancel')}</Button><Button variant="primary" busy={busy} disabled={required && !note.trim()} onClick={() => onConfirm(note)}>{t('Save change')}</Button></>}>
      <Field label={t('Justification')} required={required} hint={t('The note is saved with the change in the audit trail.')}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Why is this change needed?')} />
      </Field>
    </Modal>
  );
}

export const fmtDate = (d) => (d ? String(d).slice(0, 10) : '—');
export const fmtNum = (v, digits = 0) => (v == null || v === '' ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: digits }));
