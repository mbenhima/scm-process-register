// Shared interface components. Every component takes its colours, sizes and spacing from the design tokens
// (styles/tokens.css) and follows the focus contract of NFR-DA-FOC-01 – 13: components are defined at module scope,
// keys are record identifiers, autofocus runs once, validation and saving never move focus or reset a draft.
import { Children, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession } from '../lib/session.jsx';
import { downloadCsv } from '../lib/api.js';

/* ----------------------------------------------------------------------------------------------- icons */
/** Lucide line icon, 2-pixel stroke, at a size of the icon scale (NFR-DA-VDS-10). */
export const Icon = ({ name, size = 16, className, ...p }) => { const C = Icons[name] || Icons.Circle; return <C size={size} strokeWidth={2} aria-hidden="true" className={className} {...p} />; };
export function IconBadge({ name, emph, size = '', tone }) { return <span className={`badge-ico ${emph ? 'emph' : ''} ${tone === 'muted' ? 'muted-badge' : ''} ${size}`}><Icon name={name} size={20} /></span>; }
export const Spinner = ({ size = 16 }) => <Icons.LoaderCircle size={size} strokeWidth={2} className="spinner" aria-hidden="true" />;

/* ------------------------------------------------------------------------------------------- overlays */
// Escape closes the topmost overlay only (NFR-DA-FOC-03): every open overlay registers on this stack.
const overlayStack = [];
function useOverlay(onEscape, enabled = true) {
  const id = useId(); const cb = useRef(onEscape); cb.current = onEscape;
  useEffect(() => {
    if (!enabled) return undefined;
    overlayStack.push(id);
    const k = e => { if (e.key === 'Escape' && overlayStack[overlayStack.length - 1] === id && cb.current) { e.preventDefault(); cb.current(e); } };
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('keydown', k); const i = overlayStack.lastIndexOf(id); if (i >= 0) overlayStack.splice(i, 1); };
  }, [id, enabled]);
}
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
/** Traps Tab inside a container and returns focus to the element that opened it (NFR-DA-VDS-14, NFR-DA-UX-17). */
function useFocusTrap(ref, initial = 'field') {
  useEffect(() => {
    const opener = document.activeElement; const el = ref.current; if (!el) return undefined;
    // One-shot initial focus (C3, C10): the first field of the body, otherwise the container.
    const first = initial === 'field' ? el.querySelector(':is(.dialog-body,.drawer-body) :is(input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([disabled]),textarea:not([disabled]))') : null;
    (first || el).focus({ preventScroll: true });
    const trap = e => {
      if (e.key !== 'Tab') return; const items = [...el.querySelectorAll(FOCUSABLE)].filter(x => x.offsetParent !== null || x === document.activeElement); if (!items.length) return;
      const a = items[0], b = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); } else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    };
    el.addEventListener('keydown', trap);
    return () => { el.removeEventListener('keydown', trap); if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true }); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Dialog: Navy overlay at 45 %, 16 px radius, 560 / 720 / 960 px, title and actions always in view, content scrolls. */
export function Modal({ title, onClose, children, footer, footerStart, wide, size, destructive, describedBy }) {
  const ref = useRef(null); const { t } = useI18n(); const titleId = useId();
  useOverlay(() => { if (!destructive) onClose?.(); });
  useFocusTrap(ref);
  return createPortal(<div className="overlay" onMouseDown={e => e.target === e.currentTarget && !destructive && onClose?.()}>
    <div className={`dialog ${wide ? 'lg' : size || ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={describedBy} ref={ref} tabIndex={-1}>
      <div className="dialog-head"><h2 id={titleId}>{title}</h2><Btn icon="X" kind="ghost" aria-label={t('common.close')} onClick={onClose} /></div>
      <div className="dialog-body">{children}</div>
      {(footer || footerStart) && <div className="dialog-foot">{footerStart && <div className="start">{footerStart}</div>}{footer}</div>}
    </div></div>, document.body);
}
/** Side panel (drawer) of 320, 400 or 480 px with a fixed header and footer. */
export function Drawer({ title, subtitle, onClose, children, footer, size = '' }) {
  const ref = useRef(null); const { t } = useI18n(); const titleId = useId();
  useOverlay(() => onClose?.());
  useFocusTrap(ref);
  return createPortal(<><div className="scrim" onClick={onClose} /><aside className={`drawer ${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
    <div className="drawer-head"><div style={{ minWidth: 0 }}><h3 id={titleId}>{title}</h3>{subtitle && <div className="xs muted">{subtitle}</div>}</div><Btn icon="X" kind="ghost" aria-label={t('common.close')} onClick={onClose} /></div>
    <div className="drawer-body">{children}</div>{footer && <div className="drawer-foot">{footer}</div>}</aside></>, document.body);
}
/** Stage-then-justify: the new value is staged, a justification note is written, then saved (Section 3.7). */
export function JustifyDialog({ title, required = true, onCancel, onConfirm, extra }) {
  const { t } = useI18n(); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const ok = async () => { setBusy(true); try { await onConfirm(note); } finally { setBusy(false); } };
  return (<Modal title={title || t('justify.title')} onClose={onCancel} footer={<><Btn onClick={onCancel}>{t('common.cancel')}</Btn><Btn kind="primary" loading={busy} disabled={required && !note.trim()} onClick={ok}>{t('common.save')}</Btn></>}>
    {extra}<Field label={t('justify.label')} id="justify-note" required={required} hint={required ? t('justify.required') : t('justify.optional')}><textarea id="justify-note" className="input" value={note} onChange={e => setNote(e.target.value)} placeholder={t('justify.placeholder')} /></Field></Modal>);
}
export function ConfirmDialog({ title, text, confirmLabel, danger, onCancel, onConfirm }) {
  const { t } = useI18n(); const [busy, setBusy] = useState(false);
  return (<Modal title={title} onClose={onCancel} destructive={danger} footer={<><Btn onClick={onCancel}>{t('common.cancel')}</Btn><Btn kind={danger ? 'danger' : 'primary'} loading={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}>{confirmLabel || t('common.confirm')}</Btn></>}><p>{text}</p></Modal>);
}

/* --------------------------------------------------------------------------------------------- layout */
export function PageHead({ eyebrow, title, subtitle, children }) {
  return (<div className="page-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle && <p className="subtitle">{subtitle}</p>}</div>{children && <div className="actions">{children}</div>}</div>);
}
export function Card({ title, actions, children, className = '', tint, flat, id }) {
  return (<section className={`card ${tint ? 'tint' : ''} ${flat ? 'flat' : ''} ${className}`} id={id} aria-label={typeof title === 'string' ? title : undefined}>{(title || actions) && <div className="card-head">{title && <h3>{title}</h3>}{actions && <div className="actions">{actions}</div>}</div>}{children}</section>);
}

/* -------------------------------------------------------------------------------------------- buttons */
/** Button: Primary, Success, Secondary, Ghost or Danger; 32, 40 or 48 px; loading keeps its width (NFR-DA-VDS-11). */
export function Btn({ icon, children, kind = '', size = '', loading, title, className = '', type = 'button', ...p }) {
  const iconOnly = !children;
  const tip = title || (iconOnly ? p['aria-label'] : undefined);
  return <button type={type} className={`btn ${kind} ${size} ${iconOnly ? 'icon' : ''} ${loading ? 'loading' : ''} ${className}`} data-tip={tip} aria-busy={loading || undefined} {...p} disabled={p.disabled || loading}>
    {icon && <Icon name={icon} />}{children}{loading && <Spinner />}</button>;
}
/** Runs an async handler with a spinner in the button that started it, never blocking the page (FR-DA-STA-01). */
export function AsyncBtn({ onClick, ...p }) { const [busy, setBusy] = useState(false); return <Btn {...p} loading={busy} onClick={async e => { setBusy(true); try { await onClick?.(e); } catch { /* reported by the action */ } finally { setBusy(false); } }} />; }

/* ------------------------------------------------------------------------------------- KPI, progress */
/** KPI Tile (FR-DA-VIZ-05): label, value, change with an arrow, optional 24 px trend line. */
export function Kpi({ value, label, note, icon, emph = true, change, spark }) {
  return (<div className="card kpi"><div className="kpi-top"><div className="kpi-label">{label}</div>{icon && <IconBadge name={icon} emph={emph} size="sm" />}</div>
    <div className={`kpi-value ${emph ? '' : 'neutral'}`}>{value}</div>
    {change && <div className="kpi-change"><span className={`chg ${change.favorable ? 'chip-up' : 'chip-down'}`}><Icon name={change.up ? 'ArrowUp' : 'ArrowDown'} size={12} />{change.value}</span>{change.label && <span className="kpi-note">{change.label}</span>}</div>}
    {note && <div className="kpi-note">{note}</div>}
    {spark?.length > 1 && <Sparkline values={spark} />}</div>);
}
export function Sparkline({ values, label }) {
  const max = Math.max(...values), min = Math.min(...values); const W = 120, H = 24;
  const pts = values.map((v, i) => `${(i * W) / (values.length - 1)},${H - 2 - ((v - min) / (max - min || 1)) * (H - 4)}`).join(' ');
  return <svg className="kpi-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label || values.join(', ')}><polyline fill="none" stroke="var(--aiv-azure)" strokeWidth="2" points={pts} vectorEffect="non-scaling-stroke" /></svg>;
}
export function Progress({ value, lg, label }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className={`progress ${lg ? 'lg' : ''}`} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><span style={{ width: v + '%' }} /></div>;
}

/* ------------------------------------------------------------------------------------------- status */
// Status values map to the five-level scale, always shown with their label (NFR-DA-VDS-04, NFR-DA-UX-18).
const STATUS_CLASS = { 'Completed': 's5', 'Done': 's5', 'Green': 's4', 'Approved': 's5', 'Published': 's5', 'Active': 's4', 'Validated': 's4', 'Signed off': 's5', 'Go': 's5', 'Effective': 's4', 'Valid': 's4', 'Given': 's4', 'Matched': 's4', 'Locked': 's5', 'Filled': 's5', 'Met': 's4', 'Closed': 's4', 'Responded': 's4', 'Ready': 's4', 'Saved': 's4', 'Included': 's4', 'Current': 's4', 'Released': 's5', 'Implemented': 's4', 'Verified': 's5', 'Compliant': 's4',
  'In progress': 'tint', 'In Review': 's3', 'In review': 's3', 'Submitted': 's3', 'Pending Validation': 's3', 'Pending Re-validation': 's2', 'Amber': 's2', 'Expiring': 's2', 'Partially effective': 's2', 'Hold': 's2', 'Partial': 's2', 'Distributed': 's3', 'Open': 's3', 'Review': 's3', 'Shortlisting': 's3', 'Planned': 's3', 'Invited': 's3', 'Opened': 's3', 'Scheduled': 's3', 'Minor nonconformity': 's2', 'Observation': 's3', 'Opportunity for improvement': 's4',
  'Blocked': 's1', 'Red': 's1', 'Rejected': 's1', 'Expired': 's1', 'No-Go': 's1', 'Ineffective': 's1', 'Refused': 's1', 'Unmatched': 's1', 'Not met': 's1', 'Overdue': 's1', 'Major nonconformity': 's1', 'Failed': 's1', 'Not ready': 's2',
  'Deprecated': 's2', 'Retired': '', 'Draft': '', 'Not started': '', 'Superseded': '', 'Deployment responsibility': 'tint' };
export function StatusPill({ value, level }) { const { t } = useI18n(); if (value == null || value === '') return <span className="muted">—</span>; const tr = t('status.' + value); return <span className={`pill ${level ? 's' + level : STATUS_CLASS[value] ?? ''}`}>{level ? <span className="lvl">{level}</span> : null}{tr === 'status.' + value ? value : tr}</span>; }
export function LevelPill({ level, label }) { return <span className={`pill s${Math.max(1, Math.min(5, Math.round(level || 1)))}`}><span className="lvl">{level}</span>{label}</span>; }
export function AiBadge({ tier }) { const { t } = useI18n(); return <span className="pill tint ai" data-tip={t('ai.tier.' + tier + '.hint')}><Icon name={tier === 'Augmented' ? 'Sparkles' : 'Wand2'} size={12} />{t('ai.tier.' + tier)}</span>; }
export function OriginPill({ origin }) { const { t } = useI18n(); if (!origin) return null; return <span className={`pill ${origin === 'ai' || origin === 'AI' ? 'tint ai' : 'outline'}`}>{t('origin.' + String(origin).toLowerCase())}</span>; }

/* ----------------------------------------------------------------------------------- tabs and segments */
/** Tabs moved between with the arrow keys (FR-DA-NAV-20). */
export function Tabs({ tabs, value, onChange, label }) {
  const ref = useRef(null);
  const key = e => {
    const i = tabs.findIndex(x => x.id === value); let n = -1;
    if (e.key === 'ArrowRight') n = (i + (document.dir === 'rtl' ? -1 : 1) + tabs.length) % tabs.length; else if (e.key === 'ArrowLeft') n = (i + (document.dir === 'rtl' ? 1 : -1) + tabs.length) % tabs.length; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
    if (n >= 0) { e.preventDefault(); onChange(tabs[n].id); ref.current?.querySelectorAll('[role="tab"]')[n]?.focus(); }
  };
  return <div className="tabs" role="tablist" aria-label={label} ref={ref} onKeyDown={key}>{tabs.map(tb => <button key={tb.id} role="tab" type="button" className="tab" aria-selected={value === tb.id} tabIndex={value === tb.id ? 0 : -1} onClick={() => onChange(tb.id)}>{tb.label}{tb.count != null && <span className="count"> · {tb.count}</span>}</button>)}</div>;
}
export function Seg({ options, value, onChange, label, size }) {
  return <div className={`seg ${size || ''}`} role="group" aria-label={label}>{options.map(o => <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>)}</div>;
}

/* ---------------------------------------------------------------------------------------------- forms */
/** Field: 13 px label above, help text below, required marked with an asterisk before the label (NFR-DA-VDS-12). */
export function Field({ label, hint, children, id, required, optional, error, className = '' }) {
  const { t } = useI18n();
  return <div className={`field ${className}`}>{label && <label htmlFor={id}>{required && <span className="req" aria-hidden="true">*</span>}{label}{optional && <span className="opt"> ({t('common.optional')})</span>}</label>}{children}
    {error ? <span className="field-error" id={id ? id + '-err' : undefined} role="alert"><Icon name="CircleAlert" size={12} />{error}</span> : hint && <span className="hint">{hint}</span>}</div>;
}
export function Search({ value, onChange, placeholder, id }) { return <div className="search"><Icon name="Search" /><input id={id} className="input md" type="search" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>; }
export function Toggle({ checked, onChange, label, disabled, id }) { return <label className="toggle"><input type="checkbox" role="switch" id={id} checked={!!checked} disabled={disabled} onChange={e => onChange(e.target.checked)} /><span>{label}</span></label>; }

/** Flattens <option> / <optgroup> children (the same markup as a native select) into a list of options. */
function optionsFrom(children, options) {
  if (options) return options.map(o => (typeof o === 'object' ? { value: String(o.value ?? o.id ?? ''), label: String(o.label ?? o.value ?? ''), group: o.group, disabled: !!o.disabled } : { value: String(o), label: String(o) }));
  const out = []; const text = c => (Array.isArray(c) ? c.map(text).join('') : c == null || c === false ? '' : typeof c === 'object' ? text(c.props?.children) : String(c));
  const walk = (nodes, group) => Children.forEach(nodes, el => {
    if (!isValidElement(el)) return;
    if (el.type === 'optgroup') walk(el.props.children, el.props.label);
    else if (el.type === 'option') out.push({ value: String(el.props.value ?? text(el.props.children)), label: text(el.props.children), group, disabled: !!el.props.disabled });
    else if (el.props?.children) walk(el.props.children, group);
  });
  walk(children); return out;
}
/**
 * Select (NFR-DA-VDS-13): field-styled button with a white menu (8 px radius, card shadow, 320 px max, 40 px options,
 * hover in the tint, a check on the selected option, a filter at the top for long lists). It accepts native
 * <option> children and calls onChange({ target: { value } }) so it replaces a native select one for one.
 * Options use onMouseDown + preventDefault so the field is never blurred before the choice completes (C23).
 */
export function Select({ value, onChange, children, options, id, disabled, placeholder, className = '', style, invalid, size, filter, arrowOpens = true, onKeyDown: extKey, ...aria }) {
  const { t } = useI18n(); const opts = useMemo(() => optionsFrom(children, options), [children, options]);
  const [open, setOpen] = useState(false); const [active, setActive] = useState(0); const [q, setQ] = useState(''); const [pos, setPos] = useState(null);
  const btn = useRef(null); const list = useRef(null); const typed = useRef({ s: '', t: 0 }); const listId = useId();
  const val = value == null ? '' : String(value);
  const current = opts.find(o => o.value === val);
  const showFilter = filter ?? opts.length > 10;
  const shown = useMemo(() => { if (!q) return opts; const s = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); return opts.filter(o => o.label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(s)); }, [opts, q]);
  const place = useCallback(() => { const r = btn.current?.getBoundingClientRect(); if (!r) return; const below = window.innerHeight - r.bottom; const up = below < 240 && r.top > below; setPos({ left: r.left, width: r.width, top: up ? undefined : r.bottom + 4, bottom: up ? window.innerHeight - r.top + 4 : undefined }); }, []);
  const openList = () => { if (disabled) return; place(); setQ(''); setActive(Math.max(0, opts.findIndex(o => o.value === val))); setOpen(true); };
  const close = (refocus = true) => { setOpen(false); if (refocus) btn.current?.focus({ preventScroll: true }); };
  const choose = o => { if (!o || o.disabled) return; close(); if (o.value !== val) onChange?.({ target: { value: o.value }, currentTarget: { value: o.value } }); };
  useOverlay(() => close(), open);
  useLayoutEffect(() => { if (!open) return undefined; const h = () => place(); window.addEventListener('resize', h); window.addEventListener('scroll', h, true); return () => { window.removeEventListener('resize', h); window.removeEventListener('scroll', h, true); }; }, [open, place]);
  useEffect(() => { if (!open) return undefined; const out = e => { if (!btn.current?.contains(e.target) && !list.current?.contains(e.target)) close(false); }; document.addEventListener('mousedown', out); return () => document.removeEventListener('mousedown', out); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' }); }, [active, open]);
  useEffect(() => { if (open && showFilter) list.current?.querySelector('input')?.focus({ preventScroll: true }); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const move = d => setActive(a => { let n = a; for (let k = 0; k < shown.length; k++) { n = (n + d + shown.length) % shown.length; if (!shown[n]?.disabled) break; } return n; });
  const keyList = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); } else if (e.key === 'End') { e.preventDefault(); setActive(shown.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(shown[active]); } else if (e.key === 'Tab') { close(false); }
  };
  const keyBtn = e => {
    if (open) { keyList(e); return; }
    // In a table cell the arrow keys and Enter belong to the table's keyboard map; Space or Alt+Down opens the list.
    const opens = arrowOpens ? ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) : e.key === ' ' || e.key === 'F4' || (e.altKey && e.key === 'ArrowDown');
    if (opens) { e.preventDefault(); openList(); return; }
    if (!arrowOpens && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) { extKey?.(e); return; }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { // type-ahead without opening, as a native select does
      const now = Date.now(); typed.current = { s: (now - typed.current.t < 700 ? typed.current.s : '') + e.key.toLowerCase(), t: now };
      const i = opts.findIndex(o => o.label.toLowerCase().startsWith(typed.current.s)); if (i >= 0 && opts[i].value !== val) onChange?.({ target: { value: opts[i].value }, currentTarget: { value: opts[i].value } });
      return;
    }
    extKey?.(e);
  };
  let lastGroup;
  return (<div className={`select ${className.replace(/\binput\b|\bheader-select\b/g, '')}`} style={style}>
    <button ref={btn} type="button" id={id} className={`select-btn ${size || ''}`} role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-invalid={invalid || undefined} disabled={disabled} onClick={() => (open ? close() : openList())} onKeyDown={keyBtn} {...aria}>
      <span className={`value ${current ? '' : 'placeholder'}`}>{current ? current.label : placeholder || t('select.placeholder')}</span><Icon name="ChevronDown" className="chev" /></button>
    {open && pos && createPortal(<div ref={list} className="listbox" id={listId} role="listbox" aria-label={aria['aria-label']} style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: Math.max(pos.width, 200) }} onKeyDown={keyList}>
      {showFilter && <div className="lb-filter"><input className="input sm" value={q} onChange={e => { setQ(e.target.value); setActive(0); }} placeholder={t('select.filter')} aria-label={t('select.filter')} /></div>}
      {shown.map((o, i) => { const g = o.group !== lastGroup && o.group ? o.group : null; lastGroup = o.group; return <div key={o.value + '|' + (o.group || '')}>{g && <div className="lb-group">{g}</div>}
        <div data-i={i} role="option" aria-selected={o.value === val} aria-disabled={o.disabled || undefined} className={`option ${i === active ? 'active' : ''}`} onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => choose(o)}>
          <span className="chk">{o.value === val && <Icon name="Check" />}</span><span>{o.label}</span></div></div>; })}
      {!shown.length && <div className="lb-empty">{t('select.none')}</div>}
    </div>, document.body)}
  </div>);
}

/* -------------------------------------------------------------------------------------- system states */
/** Empty state (FR-DA-STA-02): centred, 400 px, 48 px Muted icon, title, one sentence and the primary action. */
export function Empty({ icon = 'Inbox', title, text, children, action }) {
  return <div className="empty"><Icon name={icon} size={48} className="empty-ico" /><h3>{title}</h3>{text && <p>{text}</p>}{(children || action) && <div className="actions">{action}{children}</div>}</div>;
}
export function Skeleton({ kind = 'line', style }) { return <span className={`skeleton ${kind}`} style={style} aria-hidden="true" />; }
/** Page skeleton of the main content region while it loads (FR-DA-STA-01). */
export function Loading() { const { t } = useI18n(); return <div className="page-skeleton" aria-busy="true" aria-live="polite"><span className="sr-only">{t('common.loading')}</span><Skeleton kind="title" /><div className="cards">{[0, 1, 2, 3].map(i => <Skeleton key={i} kind="block" />)}</div><Skeleton kind="block" /></div>; }
/** Full-page error state with a headline and a primary action (FR-DA-STA-03, NFR-DA-REL-09). */
export function ErrorState({ title, text, onRetry, icon = 'TriangleAlert', home = true }) {
  const { t } = useI18n();
  return <div className="full-page-state" role="alert"><div className="empty"><Icon name={icon} size={48} className="empty-ico" /><h1>{title || t('state.error.title')}</h1><p>{text || t('state.error.text')}</p>
    <div className="actions">{onRetry && <Btn kind="primary" icon="RotateCw" onClick={onRetry}>{t('common.retry')}</Btn>}{home && <a className="btn" href="/">{t('state.goHome')}</a>}</div></div></div>;
}
/** Access notice with a Request access action (FR-DA-RBAC-08, FR-DA-STA-07). */
export function AccessNotice({ error }) {
  const { t } = useI18n(); const { toast } = useSession(); const [sent, setSent] = useState(false);
  const p = error?.params || {};
  if (error && error.status && error.status !== 403) return <ErrorState title={error.status === 404 ? t('state.notFound.title') : t('state.error.title')} text={error.message} onRetry={error.retry} />;
  return (<div className="full-page-state" role="alert"><div className="empty"><Icon name="Lock" size={48} className="empty-ico" /><h1>{t('access.title')}</h1><p>{error?.message || t('access.text')}</p>
    <p className="xs">{p.permission ? t('access.permission', { permission: p.permission }) : p.feature ? t('access.feature', { feature: p.feature }) : ''} {t('access.whom')}</p>
    <div className="actions"><Btn kind="primary" icon="Send" disabled={sent} onClick={() => { setSent(true); toast(t('access.requested')); }}>{sent ? t('access.requested') : t('access.request')}</Btn></div></div></div>);
}
export function Guard({ state, children, skeleton }) {
  if (state.loading && !state.data) return skeleton || <Loading />;
  if (state.error) return <AccessNotice error={{ ...state.error, retry: state.reload }} />;
  return children(state.data);
}

/* ------------------------------------------------------------------------------------- notifications */
/** Notifications (FR-DA-STA-05): bottom end on desktop, top centre on mobile; errors stay until dismissed. */
export function Toasts() {
  const { toasts, dismiss } = useSession(); const { t } = useI18n();
  return <div className="toasts" role="status" aria-live="polite">{toasts.map(x => <div key={x.id} className={`toast ${x.kind}`} role={x.kind === 'error' ? 'alert' : undefined}>
    <Icon name={x.kind === 'error' ? 'CircleAlert' : x.kind === 'warning' ? 'TriangleAlert' : x.kind === 'info' ? 'Info' : 'CircleCheck'} size={20} /><span className="toast-text">{x.text}</span>
    {x.action && <Btn size="sm" onClick={() => { x.action.onClick(); dismiss(x.id); }}>{x.action.label}</Btn>}
    <Btn icon="X" kind="ghost" size="sm" aria-label={t('toast.dismiss')} onClick={() => dismiss(x.id)} /></div>)}</div>;
}
/** Wraps an async action: the translated server message on error, a confirmation on success. */
export function useAction() {
  const { toast } = useSession(); const { t } = useI18n();
  return useCallback(async (fn, okKey = 'common.saved') => { try { const r = await fn(); if (okKey) toast(t(okKey)); return r; } catch (e) { toast(e.message || t('err.server'), 'error'); throw e; } }, [toast, t]);
}

/* -------------------------------------------------------------------------------------------- tooltips */
/** One tooltip layer for the whole application: Navy, white 12 px text, 240 px max, shown after 300 ms. */
export function TooltipLayer() {
  const [tip, setTip] = useState(null); const timer = useRef(null);
  useEffect(() => {
    const show = e => { const el = e.target.closest?.('[data-tip]'); if (!el || !el.dataset.tip) return; clearTimeout(timer.current);
      timer.current = setTimeout(() => { const r = el.getBoundingClientRect(); setTip({ text: el.dataset.tip, x: r.left + r.width / 2, y: r.bottom + 8, up: r.bottom > window.innerHeight - 64, top: r.top - 8 }); }, 300); };
    const hide = () => { clearTimeout(timer.current); setTip(null); };
    document.addEventListener('mouseover', show); document.addEventListener('focusin', show); document.addEventListener('mouseout', hide); document.addEventListener('focusout', hide); document.addEventListener('keydown', hide);
    return () => { document.removeEventListener('mouseover', show); document.removeEventListener('focusin', show); document.removeEventListener('mouseout', hide); document.removeEventListener('focusout', hide); document.removeEventListener('keydown', hide); };
  }, []);
  if (!tip) return null;
  return createPortal(<div className="tooltip" role="tooltip" style={{ left: Math.min(window.innerWidth - 248, Math.max(8, tip.x - 120)), top: tip.up ? undefined : tip.y, bottom: tip.up ? window.innerHeight - tip.top : undefined }}>{tip.text}</div>, document.body);
}

/* ------------------------------------------------------------------------------------------- misc data */
export function Legend({ items }) { return <div className="legend">{items.map(i => <span key={i.label}><i className={i.dashed ? 'dashed' : i.status ? 'status' : ''} style={i.dashed ? undefined : { background: i.color }} />{i.label}</span>)}</div>; }
export function KV({ items }) { return <dl className="kv">{items.filter(Boolean).map(([k, v]) => <KVPair key={String(k)} k={k} v={v} />)}</dl>; }
function KVPair({ k, v }) { return <><dt>{k}</dt><dd>{v ?? '—'}</dd></>; }
/** Brief shown by default with an expandable detailed description (FR-DA-NAM-03, NFR-DA-UX-12). */
export function Brief({ brief, details }) {
  const { t } = useI18n(); const [open, setOpen] = useState(false); const id = useId();
  return <div>{brief && <p className="brief">{brief}</p>}{details && <><button type="button" className="details-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}><Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} />{open ? t('common.hideDetails') : t('common.showDetails')}</button>
    <div id={id} hidden={!open} className="small" style={{ whiteSpace: 'pre-line', marginTop: 'var(--aiv-space-2)' }}>{details}</div></>}</div>;
}

export { DataTable } from './DataTable.jsx';
export { downloadCsv };
