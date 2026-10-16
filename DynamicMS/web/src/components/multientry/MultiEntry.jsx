// Multi-Entry (SRS 4.49, FR-DA-MRE-01 to 35): one inline editable table for every place where
// several records of one kind are typed — step record tables, template lists and registers.
// It saves each row about 500 ms after the user leaves it, checks every row on the server
// against its Row Stamp, keeps a Draft Backup in the browser, queues saves while offline, and
// offers paste of complete records, import, export, undo and redo, a Full-Screen Entry Workspace
// with zoom, virtual rows for large tables and a phone list. Rows are keyed by a client key that
// never changes, so typing keeps the focus (NFR-DA-FOC-01 to 13).
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Copy, Trash2, Plus, Check, Loader2, AlertCircle, Save, Maximize2, Minimize2, ZoomIn, ZoomOut, Undo2, Redo2, Filter, Columns3, Upload, Download, ClipboardPaste, Search as SearchIcon, X, MoreHorizontal, Rows3, Wand2, RotateCcw, CloudOff, CornerDownRight, WrapText, Sparkles } from 'lucide-react';
import { useApp } from '../../lib/state.jsx';
import { api, ApiError, getToken } from '../../lib/api.js';
import { tx } from '../ui.jsx';
import { CellEditor, labelText, displayValue } from './cells.jsx';
import { ConfirmDialog, RowEditor, PastePreview, ImportWizard, ConflictsDialog, ColumnChooser, FilterBuilder, IssuesList, filterText } from './dialogs.jsx';
import { newKey, isEmpty, parseClipboard, isBlock, looksLikeHeader, convertValue, validateCell, validateRow, viewRows, nextSort, applyPatches, cmdSet, cmdInsert, cmdRemove, createHistory, runBatches, backoff, isRetryable, makeDraft, mergeDraft, toCsv, toClipboard, exportName } from '../../lib/multientry.js';
import { registerEntry, readTablePrefs, writeTablePrefs, readDraft, writeDraft, changed as notifyGuard } from '../../lib/entrystore.js';

const LOCALES = { en: 'en-GB', fr: 'fr-FR', ar: 'ar-MA' };
const ZOOM_MIN = 0.5; const ZOOM_MAX = 2; const ZOOM_STEP = 0.1;
const clampZoom = (z) => Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) * 10) / 10;
const ROW_H = { comfortable: 52, compact: 40 };
const VIRTUAL_FROM = 60;
const META = (k) => k.startsWith('_');
const stripRow = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== '_key'));
const valuesOf = (r, columns) => Object.fromEntries(columns.filter(c => !c.readOnly && !c.computed && c.key in r).map(c => [c.key, r[c.key]]));
let instances = 0;

function RowStatus({ state, t, errorText }) {
  if (state === 'dirty') return <span className="row-dot" role="img" aria-label={t('Changed, not saved')} title={t('Changed, not saved')} />;
  if (state === 'saving') return <Loader2 size={14} className="spin muted" role="img" aria-label={t('Saving…')} />;
  if (state === 'saved') return <Check size={14} className="row-saved" role="img" aria-label={t('Saved')} />;
  if (state === 'waiting') return <CloudOff size={14} className="muted" role="img" aria-label={t('Waiting for the connection')} title={t('Waiting for the connection')} />;
  if (state === 'error' || state === 'conflict') return <AlertCircle size={14} className="row-error" role="img" aria-label={errorText || t('Error')} title={errorText || t('Error')} />;
  return null;
}

// Overflow menu of a row: the actions other than duplicate, insert and delete (FR-DA-MRE-05).
function RowMenu({ t, n, onEditor, onCopy, onFill }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); setOpen(false); ref.current?.querySelector('button')?.focus(); } };
    document.addEventListener('mousedown', f); document.addEventListener('keydown', k, true);
    setTimeout(() => ref.current?.querySelector('[role=menuitem]')?.focus(), 0);
    return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k, true); };
  }, [open]);
  const pick = (fn) => { setOpen(false); fn(); };
  return (
    <span className="me-pop-anchor" ref={ref}>
      <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-haspopup="menu" aria-expanded={open} aria-label={t('More actions for row {n}', { n })} onClick={() => setOpen(o => !o)}><MoreHorizontal size={24} /></button>
      {open && <div className="popover me-row-menu" role="menu">
        <button type="button" role="menuitem" className="list-btn" onClick={() => pick(onEditor)}>{t('Open in the Row Editor')}</button>
        <button type="button" role="menuitem" className="list-btn" onClick={() => pick(onCopy)}>{t('Copy the row')}</button>
        <button type="button" role="menuitem" className="list-btn" onClick={() => pick(onFill)}>{t('Fill down the row above')}</button>
      </div>}
    </span>
  );
}

// One row of the grid, at module scope and memoized: only the row typed in re-renders.
const GridRow = memo(function GridRow({ row, index, ariaIndex, cols, state, errs, selected, readOnly, wrap, pinned, h, ctx, renderCell, flash }) {
  const { t, lang } = ctx;
  const rowErr = errs?._row;
  return (
    <tr role="row" aria-rowindex={ariaIndex} aria-selected={selected || undefined} data-key={row._key} className={`${flash ? 'row-flash' : ''} ${selected ? 'row-selected' : ''}`} onBlur={h.onRowBlur}>
      <td role="gridcell" aria-colindex={1} className="me-num sticky-start">
        {!readOnly && <input type="checkbox" className="grid-check" aria-label={t('Select row {n}', { n: index + 1 })} checked={!!selected} onChange={() => {}} onClick={(e) => h.onSelect(row._key, e.shiftKey)} />}
        <span className="row-n">{index + 1}</span><RowStatus state={state} t={t} errorText={rowErr} />
      </td>
      {cols.map((c, ci) => {
        const err = errs?.[c.key];
        const ro = readOnly || c.readOnly || c.computed;
        return (
          <td key={c.key} role="gridcell" aria-colindex={ci + 2} data-row={row._key} data-col={c.key} className={`${err ? 'cell-error' : ''} ${ci === 0 && pinned ? 'sticky-first' : ''}`}
            onFocusCapture={h.onCellFocus} onBlurCapture={h.onCellBlur} onKeyDownCapture={h.onCellKey}>
            {ro ? <span className="me-ro" tabIndex={0}>{displayValue(c, row[c.key], row, ctx) || '—'}</span>
              : <CellEditor col={c} value={row[c.key]} row={row} ctx={ctx} wrap={wrap} renderCell={renderCell} aria={`${labelText(c.label, t, lang)}, ${t('row {n}', { n: index + 1 })}`} onChange={(v) => h.onCell(row._key, c.key, v)} />}
            {err && <span className="cell-msg" role="alert"><AlertCircle size={12} aria-hidden="true" /> {err}</span>}
          </td>
        );
      })}
      {!readOnly && (
        <td role="gridcell" className="me-actions sticky-end">
          {state === 'error' && rowErr && <button type="button" className="btn btn-ghost btn-icon btn-sm me-retry" onClick={() => h.retry(row._key)} aria-label={t('Retry saving row {n}', { n: index + 1 })} title={t('Retry')}><RotateCcw size={24} /></button>}
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => h.duplicate(row._key)} aria-label={t('Duplicate row {n}', { n: index + 1 })} title={`${t('Duplicate row')} (Ctrl+D)`}><Copy size={24} /></button>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => h.insertBelow(row._key)} aria-label={t('Insert a row below row {n}', { n: index + 1 })} title={t('Insert row below')}><CornerDownRight size={24} className="flip-rtl" /></button>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => h.remove([row._key])} aria-label={t('Delete row {n}', { n: index + 1 })} title={t('Delete row')}><Trash2 size={24} /></button>
          <RowMenu t={t} n={index + 1} onEditor={() => h.openEditor(row._key)} onCopy={() => h.copyRow(row._key)} onFill={() => h.fillRow(row._key)} />
        </td>
      )}
      {readOnly && <td role="gridcell" className="me-actions"><button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => h.openEditor(row._key)} aria-label={t('Open row {n}', { n: index + 1 })}><Maximize2 size={16} /></button></td>}
    </tr>
  );
});

/**
 * props: source, columns (optional client definitions), renderCell, display, title, context,
 * countLabel(n), newRow(), onRowsChange(rows), extraActions, aiPropose(), readOnly, backLabel
 */
export default function MultiEntry(props) {
  const { source, columns: colsProp, renderCell, title: titleProp, context, countLabel, newRow, onRowsChange, extraActions, aiPropose, readOnly: roProp, backLabel, emptyText } = props;
  const app = useApp();
  const { t, lang, L, toast, me, fmtDate, fmtNum } = app;
  const ctx = useMemo(() => ({ t, lang, L, fmtDate, locale: LOCALES[lang] || 'en-GB', confirm: (c) => setDialog({ kind: 'confirm', ...c }) }), [t, lang, L, fmtDate]);
  const userId = me?.user?.id || 'me';
  const instId = useRef(`me${++instances}`).current;

  const [meta, setMeta] = useState(null); // { title, parent, back, columns, readOnly, reason, limits }
  const [loadError, setLoadError] = useState(null);
  const [rows, setRowsState] = useState([]);
  const [status, setStatus] = useState({}); // key → dirty | saving | saved | error | waiting | conflict
  const [errors, setErrors] = useState({}); // key → { col: message, _row: message }
  const [flash, setFlash] = useState({});
  const [selected, setSelected] = useState(() => new Set());
  const [dialog, setDialog] = useState(null);
  const [editor, setEditor] = useState(null); // row key in the Row Editor
  const [conflicts, setConflicts] = useState([]);
  const [notice, setNotice] = useState(null);
  const [offline, setOffline] = useState(false);
  const [batch, setBatch] = useState(null);
  const [announce, setAnnounce] = useState('');
  const [full, setFull] = useState(false);
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches);
  const [, force] = useState(0);
  const prefs0 = useMemo(() => readTablePrefs(source), [source]);
  const [view, setView] = useState(() => ({ search: '', filters: [], sort: prefs0.sort || null, errorsOnly: false, density: prefs0.density || 'comfortable', wrap: !!prefs0.wrap, mode: prefs0.mode || 'continuous', page: 1, size: prefs0.size || 50, hidden: prefs0.hidden || null, order: prefs0.order || null, widths: prefs0.widths || {}, pinned: prefs0.pinned ?? true, zoom: prefs0.zoom || 1 }));
  const [pop, setPop] = useState(null); // 'columns' | 'filter' | 'issues' | 'export'
  const [scrollTop, setScrollTop] = useState(0);
  const [boxW, setBoxW] = useState(0);

  const latest = useRef({ rows: [], status: {}, errors: {}, deletes: [], deletedRids: new Set() });
  latest.current.rows = rows; latest.current.status = status; latest.current.errors = errors;
  const history = useRef(createHistory());
  const editStart = useRef({}); // `${key}:${col}` → value at focus
  const active = useRef(null); // { key, col }
  const saveTimer = useRef(null);
  const queued = useRef(new Set());
  const retry = useRef({ attempt: 0, timer: null });
  const wrapRef = useRef(null);
  const scrollRef = useRef(null);
  const recordsRef = useRef(null);
  const pendingFocus = useRef(null);
  const expandBtn = useRef(null);
  const cancelled = useRef(false);

  const roleColumns = colsProp || meta?.columns || [];
  const columns = roleColumns;
  const readOnly = roProp || !!meta?.readOnly;
  const title = titleProp || (meta ? labelText(meta.title, t, lang) : '');
  const editable = useMemo(() => columns.filter(c => !c.readOnly && !c.computed), [columns]);

  // ---------------------------------------------------------------- load and Draft Backup
  const load = useCallback(async () => {
    try {
      const d = await api(`/entries/${encodeURIComponent(source)}`);
      setMeta(d); setLoadError(null);
      const server = d.rows.map(r => ({ ...r, _key: r._rid || newKey() }));
      const draft = !d.readOnly ? readDraft(userId, source) : null;
      if (draft) {
        const m = mergeDraft(server, draft);
        setRowsState(m.rows);
        setStatus(Object.fromEntries([...m.pending].map(k => [k, 'dirty'])));
        latest.current.deletes = (draft.deleted || []).filter(x => server.some(r => r._rid === x._rid));
        if (m.conflicts.length) setConflicts(m.conflicts.map(c => ({ ...c, by: c.server?._byName, at: c.server?._at })));
        if (m.pending.size || m.conflicts.length || latest.current.deletes.length) setNotice({ kind: 'draft', at: draft.at });
        else writeDraft(userId, source, null);
      } else setRowsState(server);
    } catch (e) { setLoadError(e); }
  }, [source, userId]);
  useEffect(() => { load(); }, [load]);

  // Keep the parent's copy (e.g. the step form) in line with the rows.
  const onRowsChangeRef = useRef(onRowsChange); onRowsChangeRef.current = onRowsChange;
  const firstSync = useRef(true);
  useEffect(() => { if (firstSync.current) { firstSync.current = false; return; } onRowsChangeRef.current?.(rows.map(stripRow)); }, [rows]);

  const pendingKeys = useMemo(() => new Set(Object.entries(status).filter(([, s]) => ['dirty', 'error', 'waiting', 'conflict', 'saving'].includes(s)).map(([k]) => k)), [status]);
  // Draft Backup: written on every change while rows are pending, removed when none are.
  useEffect(() => {
    if (!meta || readOnly) return undefined;
    const h = setTimeout(() => {
      const pend = new Set(Object.entries(latest.current.status).filter(([, s]) => ['dirty', 'error', 'waiting', 'conflict'].includes(s)).map(([k]) => k));
      const rowsWithBase = latest.current.rows.map(r => (r._rid ? { ...r, _base: r._base || r._stamp } : r));
      if (pend.size || latest.current.deletes.length) writeDraft(userId, source, makeDraft(rowsWithBase, pend, latest.current.deletes));
      else writeDraft(userId, source, null);
    }, 250);
    notifyGuard();
    return () => clearTimeout(h);
  }, [rows, status, meta, readOnly, userId, source]);

  // ---------------------------------------------------------------- preferences
  const setPrefs = useCallback((patch) => {
    setView(v => ({ ...v, ...patch }));
    const keep = ['sort', 'density', 'wrap', 'mode', 'size', 'hidden', 'order', 'widths', 'pinned', 'zoom', 'mapping'];
    writeTablePrefs(source, Object.fromEntries(Object.entries(patch).filter(([k]) => keep.includes(k))));
  }, [source]);
  const order = useMemo(() => {
    const keys = columns.map(c => c.key);
    const o = (view.order || []).filter(k => keys.includes(k));
    return [...o, ...keys.filter(k => !o.includes(k))];
  }, [columns, view.order]);
  // More than six columns: optional long texts go to the Row Editor until shown (FR-DA-MRE-33).
  const hidden = useMemo(() => view.hidden ?? (columns.filter(c => !c.readOnly).length > 6 ? columns.filter((c, i) => i > 0 && !c.required && (c.optional || c.type === 'textarea')).map(c => c.key) : []), [view.hidden, columns]);
  const visible = useMemo(() => order.map(k => columns.find(c => c.key === k)).filter(c => c && !hidden.includes(c.key)), [order, columns, hidden]);

  // ---------------------------------------------------------------- display and view
  const display = useCallback((r, key) => { const c = columns.find(x => x.key === key); return c ? displayValue(c, r[key], r, ctx) : (typeof r[key] === 'object' ? tx(r[key], lang) : String(r[key] ?? '')); }, [columns, ctx, lang]);
  const errorKeys = useMemo(() => new Set(Object.entries(errors).filter(([, e]) => e && Object.keys(e).length).map(([k]) => k)), [errors]);
  const shown = useMemo(() => viewRows(rows, { search: view.search, filters: view.filters, sort: view.sort, errorsOnly: view.errorsOnly, errorKeys, pendingKeys, display }), [rows, view.search, view.filters, view.sort, view.errorsOnly, errorKeys, pendingKeys, display]);
  const pages = view.mode === 'pages' ? Math.max(1, Math.ceil(shown.length / view.size)) : 1;
  const page = Math.min(view.page, pages);
  const virtual = view.mode === 'continuous' && !view.wrap && shown.length > VIRTUAL_FROM && !mobile;
  const rowH = ROW_H[view.density] || 52;
  const viewportH = full ? Math.max(300, window.innerHeight - 200) : Math.min(560, Math.max(240, shown.length * rowH + 48));
  const start = virtual ? Math.max(0, Math.floor(scrollTop / (rowH * view.zoom)) - 10) : 0;
  const end = virtual ? Math.min(shown.length, start + Math.ceil(viewportH / (rowH * view.zoom)) + 24) : shown.length;
  const slice = view.mode === 'pages' ? shown.slice((page - 1) * view.size, page * view.size) : shown.slice(start, end);
  const sliceOffset = view.mode === 'pages' ? (page - 1) * view.size : start;
  const indexOf = useMemo(() => new Map(rows.map((r, i) => [r._key, i])), [rows]);

  // ---------------------------------------------------------------- saving
  const announceNow = (msg) => { setAnnounce(''); requestAnimationFrame(() => setAnnounce(msg)); };
  const doSave = useCallback(async (keysArg, { kind = 'edit', opId = null, mapping = null } = {}) => {
    if (readOnly || !meta) return true;
    const L0 = latest.current;
    const keys = keysArg ? [...keysArg] : Object.entries(L0.status).filter(([, s]) => ['dirty', 'error', 'waiting'].includes(s)).map(([k]) => k);
    const list = keys.map(k => L0.rows.find(r => r._key === k)).filter(Boolean);
    // Rows with an error stay on screen, pending, until they are fixed (never lost).
    const clientErr = {};
    const send = [];
    for (const r of list) {
      if (!r._rid && columns.every(c => isEmpty(r[c.key]) || c.readOnly)) continue; // a new empty row is not saved
      const e = validateRow(r, columns, t);
      if (Object.keys(e).length) clientErr[r._key] = e; else send.push(r);
    }
    if (Object.keys(clientErr).length) { setErrors(er => ({ ...er, ...Object.fromEntries(Object.entries(clientErr).map(([k, e]) => [k, { ...(er[k] || {}), ...e }])) })); setStatus(s => ({ ...s, ...Object.fromEntries(Object.keys(clientErr).map(k => [k, 'error'])) })); }
    const deletes = [...L0.deletes];
    if (!send.length && !deletes.length) return !Object.keys(clientErr).length;
    setStatus(s => ({ ...s, ...Object.fromEntries(send.map(r => [r._key, 'saving'])) }));
    const upserts = send.map(r => ({ ...valuesOf(r, columns), _cid: r._key, ...(r._rid ? { _rid: r._rid, _base: r._stamp } : { _index: L0.rows.indexOf(r) }) }));
    const size = meta.limits?.batchSize || 300;
    const items = [...deletes.map(d => ({ del: d })), ...upserts.map(u => ({ up: u }))];
    const batchId = items.length > size ? newKey() : null;
    const count = Math.ceil(items.length / size);
    if (batchId) { cancelled.current = false; setBatch({ label: kind === 'import' ? t('Import') : kind === 'paste' ? t('Paste') : t('Saving'), done: 0, total: count, failed: 0 }); }
    let networkDown = false;
    const out = await runBatches(items, {
      size, isCancelled: () => cancelled.current,
      onProgress: (p) => { if (batchId) { setBatch(b => ({ ...b, done: p.done, failed: p.failed })); announceNow(t('Batch {d} of {n} saved.', { d: p.done, n: p.total })); } },
      send: async (part) => {
        const body = { kind, opId, mapping, upserts: part.filter(x => x.up).map(x => x.up), deletes: part.filter(x => x.del).map(x => ({ _rid: x.del._rid, _base: x.del._base })), batch: batchId ? { id: batchId, total: items.length, size, count } : undefined };
        try {
          const res = await api(`/entries/${encodeURIComponent(source)}/ops`, { method: 'POST', body });
          applyResults(res.results, body.deletes);
        } catch (e) {
          if (isRetryable(e)) { networkDown = true; setStatus(s => ({ ...s, ...Object.fromEntries(body.upserts.map(u => [u._cid, 'waiting'])) })); throw e; }
          setStatus(s => ({ ...s, ...Object.fromEntries(body.upserts.map(u => [u._cid, 'error'])) }));
          setErrors(er => ({ ...er, ...Object.fromEntries(body.upserts.map(u => [u._cid, { ...(er[u._cid] || {}), _row: e.message }])) }));
          throw e;
        }
      },
    });
    if (batchId) setBatch(b => ({ ...b, finished: !out.cancelled, cancelled: out.cancelled, next: out.next, failedIdx: out.failed.map(f => f.index), resume: out.cancelled || out.failed.length ? () => doSave(keys, { kind, opId, mapping }) : null }));
    if (networkDown) { setOffline(true); scheduleRetry(); } else { setOffline(false); retry.current.attempt = 0; }
    return !out.failed.length && !Object.keys(clientErr).length;
  }, [readOnly, meta, columns, t, source]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyResults = (results, deletes) => {
    const okKeys = []; const errMap = {}; const conf = [];
    const byCid = Object.fromEntries(results.filter(r => r._cid).map(r => [r._cid, r]));
    const goneRids = new Set(results.filter(r => r.deleted || r.gone).map(r => r._rid));
    latest.current.deletes = latest.current.deletes.filter(d => !goneRids.has(d._rid));
    goneRids.forEach(rid => latest.current.deletedRids.add(rid)); // deleted on the server: an Undo creates the row again
    for (const r of results.filter(x => x._rid && !x._cid && x.conflict)) conf.push({ key: `del:${r._rid}`, kind: 'changed', mine: null, server: r.conflict.server, by: r.conflict.by, at: r.conflict.at, del: true });
    setRowsState(list => list.map(row => {
      const r = byCid[row._key];
      if (!r) return row;
      if (r.ok) { okKeys.push(row._key); return { ...row, _rid: r._rid, _stamp: r.stamp, _base: undefined, ...(r.row && 'code' in r.row && !row.code ? { code: r.row.code } : {}) }; }
      if (r.conflict) conf.push({ key: row._key, kind: r.conflict.deleted ? 'deleted' : 'changed', mine: row, server: r.conflict.server, by: r.conflict.by, at: r.conflict.at });
      if (r.errors) errMap[row._key] = r.errors;
      return row;
    }));
    setStatus(s => {
      const n = { ...s };
      for (const k of okKeys) if (n[k] === 'saving') n[k] = 'saved';
      for (const k of Object.keys(errMap)) n[k] = 'error';
      for (const c of conf) if (!c.del) n[c.key] = 'conflict';
      return n;
    });
    if (okKeys.length) {
      setErrors(er => { const n = { ...er }; for (const k of okKeys) delete n[k]; return n; });
      setFlash(f => ({ ...f, ...Object.fromEntries(okKeys.map(k => [k, true])) }));
      setTimeout(() => { setFlash(f => { const n = { ...f }; okKeys.forEach(k => delete n[k]); return n; }); setStatus(s => { const n = { ...s }; okKeys.forEach(k => { if (n[k] === 'saved') delete n[k]; }); return n; }); }, 1600);
      announceNow(t('{n} rows saved.', { n: okKeys.length }));
    }
    if (Object.keys(errMap).length) { setErrors(er => ({ ...er, ...errMap })); announceNow(t('{n} rows could not be saved.', { n: Object.keys(errMap).length })); }
    if (conf.length) setConflicts(c => [...c.filter(x => !conf.some(y => y.key === x.key)), ...conf]);
    if (deletes?.length) notifyGuard();
  };
  const scheduleRetry = () => {
    clearTimeout(retry.current.timer);
    const delay = backoff(retry.current.attempt++);
    retry.current.timer = setTimeout(() => doSave(), delay);
  };
  useEffect(() => {
    const on = () => { if (Object.values(latest.current.status).includes('waiting')) { retry.current.attempt = 0; doSave(); } };
    window.addEventListener('online', on);
    return () => { window.removeEventListener('online', on); clearTimeout(retry.current.timer); };
  }, [doSave]);
  const scheduleSave = useCallback((keys, delay = 500) => {
    keys.forEach(k => queued.current.add(k));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { const ks = [...queued.current]; queued.current.clear(); doSave(ks); }, delay);
  }, [doSave]);
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  // ---------------------------------------------------------------- changes and history
  const setRows = (fn) => setRowsState(fn);
  const markDirty = (keys) => setStatus(s => ({ ...s, ...Object.fromEntries(keys.map(k => [k, 'dirty'])) }));
  const pushCmd = (cmd) => { history.current.push(cmd); force(x => x + 1); };
  const blankRow = useCallback((above) => {
    const base = newRow ? newRow() : {};
    for (const c of columns) if ((c.carry || ['category', 'type', 'kind', 'factor', 'pestle'].includes(c.key)) && above && base[c.key] === undefined && !isEmpty(above[c.key])) base[c.key] = above[c.key];
    return { ...Object.fromEntries(editable.map(c => [c.key, c.type === 'checkbox' ? false : ['obs', 'parties'].includes(c.type) ? [] : ''])), ...base, _key: newKey() };
  }, [newRow, columns, editable]);

  const onCell = useCallback((key, col, value) => {
    setRows(list => list.map(r => (r._key === key ? { ...r, [col]: value } : r)));
    markDirty([key]);
    // After a first error the cell is checked again on each change.
    const er = latest.current.errors[key];
    if (er?.[col]) {
      const r = latest.current.rows.find(x => x._key === key);
      const c = columns.find(x => x.key === col);
      const m = c ? validateCell(value, c, { ...r, [col]: value }, t) : null;
      setErrors(e => { const n = { ...e, [key]: { ...(e[key] || {}) } }; if (m) n[key][col] = m; else delete n[key][col]; return n; });
    }
  }, [columns, t]);
  const onCellFocus = useCallback((e) => {
    const td = e.currentTarget; const key = td.dataset.row; const col = td.dataset.col;
    active.current = { key, col };
    const k = `${key}:${col}`;
    if (!(k in editStart.current)) editStart.current[k] = latest.current.rows.find(r => r._key === key)?.[col];
  }, []);
  const onCellBlur = useCallback((e) => {
    const td = e.currentTarget;
    if (td.contains(e.relatedTarget)) return;
    const key = td.dataset.row; const col = td.dataset.col; const k = `${key}:${col}`;
    const before = editStart.current[k];
    delete editStart.current[k];
    const r = latest.current.rows.find(x => x._key === key);
    if (!r) return;
    const after = r[col];
    if (JSON.stringify(before ?? '') === JSON.stringify(after ?? '')) return; // crossed, not changed
    pushCmd({ redo: [{ op: 'set', key, col, value: after }], undo: [{ op: 'set', key, col, value: before }], label: 'edit' });
    const c = columns.find(x => x.key === col);
    const m = c ? validateCell(after, c, r, t) : null;
    setErrors(er => { const n = { ...er, [key]: { ...(er[key] || {}) } }; if (m) n[key][col] = m; else delete n[key][col]; delete n[key]._row; return n; });
  }, [columns, t]);
  // Leaving a row saves it ~500 ms later.
  const onRowBlur = useCallback((e) => {
    const tr = e.currentTarget;
    if (tr.contains(e.relatedTarget)) return;
    const key = tr.dataset.key;
    if (['dirty', 'error'].includes(latest.current.status[key])) scheduleSave([key]);
  }, [scheduleSave]);

  const focusCell = useCallback((key, col) => {
    const el = wrapRef.current?.querySelector(`td[data-row="${key}"][data-col="${col}"] :is(input:not([type=hidden]), select, textarea, button, [tabindex="0"])`);
    if (el) { el.focus(); if (el.select && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'date', 'number'].includes(el.type)))) el.select(); return true; }
    return false;
  }, []);
  // Focus a row that may be outside the rendered window (virtual rows or another page).
  const reveal = useCallback((key, col) => {
    const i = shownRef.current.findIndex(r => r._key === key);
    if (i < 0) return;
    if (view.mode === 'pages') { const p = Math.floor(i / view.size) + 1; if (p !== page) setView(v => ({ ...v, page: p })); }
    else if (virtual && scrollRef.current) { const top = i * rowH * view.zoom; const el = scrollRef.current; if (top < el.scrollTop || top > el.scrollTop + el.clientHeight - rowH * 2) el.scrollTop = Math.max(0, top - el.clientHeight / 3); }
    pendingFocus.current = [key, col || active.current?.col || visible.find(c => !c.readOnly)?.key];
    force(x => x + 1);
  }, [view.mode, view.size, view.zoom, page, virtual, rowH, visible]);
  const shownRef = useRef(shown); shownRef.current = shown;
  useLayoutEffect(() => { if (pendingFocus.current) { const [k, c] = pendingFocus.current; if (focusCell(k, c)) pendingFocus.current = null; } });

  const addRow = useCallback((afterKey, focus = true) => {
    const list = latest.current.rows;
    const i = afterKey ? list.findIndex(r => r._key === afterKey) : list.length - 1;
    const row = blankRow(list[i]);
    const cmd = cmdInsert(list, [{ index: i + 1, row }]);
    setRows(l => applyPatches(l, cmd.redo)); pushCmd(cmd);
    if (focus) reveal(row._key, visible.find(c => !c.readOnly && !c.computed)?.key);
    announceNow(t('Row {n} added.', { n: i + 2 }));
    return row._key;
  }, [blankRow, reveal, visible, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const duplicate = useCallback((key) => {
    const list = latest.current.rows;
    const i = list.findIndex(r => r._key === key);
    if (i < 0) return;
    const { _key, _rid, _stamp, _base, _by, _byName, _at, _actionId, _registerId, ...copy } = list[i];
    const row = { ...copy, _key: newKey() };
    const cmd = cmdInsert(list, [{ index: i + 1, row }]);
    setRows(l => applyPatches(l, cmd.redo)); pushCmd(cmd); markDirty([row._key]); scheduleSave([row._key]);
    reveal(row._key, visible.find(c => !c.readOnly && !c.computed)?.key);
    announceNow(t('Row {n} duplicated.', { n: i + 1 }));
  }, [reveal, visible, scheduleSave, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const insertBelow = useCallback((key) => addRow(key), [addRow]);

  const removeNow = useCallback((keys) => {
    const list = latest.current.rows;
    const cmd = cmdRemove(list, keys);
    const gone = list.filter(r => keys.includes(r._key));
    const idx = list.findIndex(r => r._key === keys[0]);
    setRows(l => applyPatches(l, cmd.redo)); pushCmd({ ...cmd, label: 'delete' });
    latest.current.deletes = [...latest.current.deletes, ...gone.filter(r => r._rid).map(r => ({ _rid: r._rid, _base: r._stamp }))];
    setStatus(s => { const n = { ...s }; keys.forEach(k => delete n[k]); return n; });
    setErrors(e => { const n = { ...e }; keys.forEach(k => delete n[k]); return n; });
    setSelected(new Set());
    scheduleSave([], 300);
    const multi = keys.length > 1;
    toast(multi ? t('{n} rows deleted.', { n: keys.length }) : t('Row {n} deleted.', { n: idx + 1 }), 'info', { label: t('Undo'), run: () => undoRef.current() }, { duration: multi ? 10000 : 6000 });
    announceNow(multi ? t('{n} rows deleted.', { n: keys.length }) : t('Row {n} deleted.', { n: idx + 1 }));
    // Focus moves to a sensible cell: the row now at that place, or the one above.
    const after = latest.current.rows.filter(r => !keys.includes(r._key));
    const target = after[Math.min(idx, after.length - 1)];
    if (target) reveal(target._key); else setTimeout(() => wrapRef.current?.querySelector('.me-add')?.focus(), 0);
  }, [scheduleSave, toast, t, reveal]); // eslint-disable-line react-hooks/exhaustive-deps
  const remove = useCallback((keys) => {
    if (keys.length > 1) setDialog({ kind: 'confirm', title: t('Delete {n} rows?', { n: keys.length }), message: t('The {n} selected rows will be deleted. You can undo it for 10 seconds.', { n: keys.length }), confirmLabel: t('Delete {n} rows', { n: keys.length }), danger: true, run: () => removeNow(keys) });
    else removeNow(keys);
  }, [removeNow, t]);

  // Undo and redo of every change; the server follows the rows (FR-DA-MRE-35).
  const applyCmd = useCallback(async (cmd, dir) => {
    const patches = dir === 'undo' ? cmd.undo : cmd.redo;
    if (cmd.opId && dir === 'undo' && cmd.serverApplied) {
      try { const r = await api(`/entries/ops/${cmd.opId}/undo`, { method: 'POST' }); cmd.serverApplied = false; setRows(() => r.rows.map(x => ({ ...x, _key: x._rid }))); setStatus({}); setErrors({}); toast(t('Paste or import undone: {a} rows removed, {b} restored.', { a: r.removed, b: r.restored })); return; } catch (e) { toast(e.message, 'error'); return; }
    }
    const list = latest.current.rows;
    const next = applyPatches(list, patches);
    setRows(() => next);
    const removed = list.filter(r => !next.some(x => x._key === r._key));
    latest.current.deletes = [...latest.current.deletes, ...removed.filter(r => r._rid).map(r => ({ _rid: r._rid, _base: r._stamp }))];
    // A row brought back after its deletion is created again on the server (a new identity).
    const back = next.filter(r => !list.some(x => x._key === r._key));
    const wasDeleted = (r) => r._rid && latest.current.deletedRids.has(r._rid);
    latest.current.deletes = latest.current.deletes.filter(d => !back.some(b => b._rid === d._rid));
    if (back.some(wasDeleted)) setRows(l => l.map(r => (back.some(b => b._key === r._key) && wasDeleted(r) ? { ...r, _rid: undefined, _stamp: undefined } : r)));
    const touched = [...new Set(patches.filter(p => p.op !== 'remove').map(p => p.key || p.row?._key))].filter(k => next.some(r => r._key === k));
    markDirty(touched);
    scheduleSave(touched, 300);
  }, [scheduleSave, toast, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const undo = useCallback(() => { const c = history.current.undo(); if (c) { applyCmd(c, 'undo'); force(x => x + 1); announceNow(t('Undone.')); } }, [applyCmd, t]);
  const redo = useCallback(() => { const c = history.current.redo(); if (c) { applyCmd(c, 'redo'); force(x => x + 1); announceNow(t('Redone.')); } }, [applyCmd, t]);
  const undoRef = useRef(undo); undoRef.current = undo;

  const fillDown = useCallback((key, col) => {
    const list = shownRef.current; const i = list.findIndex(r => r._key === key);
    if (i <= 0) return;
    const cmd = cmdSet(latest.current.rows, [{ key, col, value: list[i - 1][col] }]);
    setRows(l => applyPatches(l, cmd.redo)); pushCmd(cmd); markDirty([key]); scheduleSave([key]);
  }, [scheduleSave]);
  const bulkSet = useCallback((keys, col, value) => {
    const cmd = cmdSet(latest.current.rows, keys.map(key => ({ key, col, value })));
    setRows(l => applyPatches(l, cmd.redo)); pushCmd(cmd); markDirty(keys);
    scheduleSave(keys, 2000); // a bulk change is sent about two seconds after the last change
  }, [scheduleSave]);

  // ---------------------------------------------------------------- selection
  const lastSel = useRef(null);
  const onSelect = useCallback((key, shift) => {
    setSelected(sel => {
      const n = new Set(sel);
      if (shift && lastSel.current) {
        const list = shownRef.current; const a = list.findIndex(r => r._key === lastSel.current); const b = list.findIndex(r => r._key === key);
        const [x, y] = a < b ? [a, b] : [b, a];
        for (let i = x; i <= y; i++) n.add(list[i]._key);
      } else if (n.has(key)) n.delete(key); else n.add(key);
      lastSel.current = key;
      return n;
    });
  }, []);

  // ---------------------------------------------------------------- keyboard map (Table 4.49-1)
  const openEditor = useCallback((key) => setEditor(key), []);
  const onCellKey = useCallback((e) => {
    const td = e.currentTarget; const key = td.dataset.row; const col = td.dataset.col;
    const mod = e.ctrlKey || e.metaKey;
    const list = shownRef.current;
    const ri = list.findIndex(r => r._key === key);
    const cols = visibleRef.current;
    const ci = cols.findIndex(c => c.key === col);
    const el = e.target;
    const isText = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && ['text', 'search', ''].includes(el.type));
    const k = `${key}:${col}`;
    const typing = k in editStart.current && JSON.stringify(editStart.current[k] ?? '') !== JSON.stringify(latest.current.rows.find(r => r._key === key)?.[col] ?? '');
    const go = (r, c) => { if (r) reveal(r._key, c); };
    if (e.key === 'Escape') {
      if (typing) { e.preventDefault(); e.stopPropagation(); onCell(key, col, editStart.current[k]); return; }
      return; // no edit to cancel: the workspace handles Escape
    }
    if (mod && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) { if (typing) return; e.preventDefault(); undo(); return; }
    if ((mod && (e.key === 'z' || e.key === 'Z') && e.shiftKey) || (e.ctrlKey && (e.key === 'y' || e.key === 'Y'))) { if (typing) return; e.preventDefault(); redo(); return; }
    if (readOnlyRef.current) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); go(list[ri + (e.key === 'ArrowDown' ? 1 : -1)], col); }
      return;
    }
    if (mod && e.shiftKey && (e.key === 'F' || e.key === 'f')) { e.preventDefault(); setFullRef.current(true); return; }
    if (mod && (e.key === 's' || e.key === 'S')) { e.preventDefault(); doSave(); return; }
    if (mod && e.key === 'Enter') { e.preventDefault(); scheduleSave([key], 0); return; }
    if (mod && !e.shiftKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); duplicate(key); return; }
    if ((mod && e.key === "'") || (mod && e.shiftKey && (e.key === 'd' || e.key === 'D'))) { e.preventDefault(); fillDown(key, col); return; }
    if (mod && (e.key === 'a' || e.key === 'A')) {
      if (isText && el.value && !(el.selectionStart === 0 && el.selectionEnd === el.value.length)) return; // the text first
      e.preventDefault(); setSelected(new Set(list.map(r => r._key))); announceNow(t('{n} rows selected.', { n: list.length })); return;
    }
    if (e.key === 'Tab') {
      const n = e.shiftKey ? (ci > 0 ? [ri, ci - 1] : [ri - 1, cols.length - 1]) : (ci < cols.length - 1 ? [ri, ci + 1] : [ri + 1, 0]);
      if (list[n[0]]) { e.preventDefault(); go(list[n[0]], cols[n[1]].key); }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !el.closest('.combo-menu')) {
      if (el.tagName === 'BUTTON') return;
      e.preventDefault();
      if (ri === list.length - 1) { scheduleSave([key]); if (ci === cols.length - 1) addRow(key); return; }
      go(list[ri + 1], col); return;
    }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && el.tagName !== 'SELECT' && !(el.tagName === 'TEXTAREA' && view.wrap) && el.type !== 'number' && el.type !== 'date') { e.preventDefault(); go(list[ri + (e.key === 'ArrowDown' ? 1 : -1)], col); return; }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !mod) {
      const rtl = document.documentElement.dir === 'rtl';
      const forward = (e.key === 'ArrowRight') !== rtl;
      const atEdge = !isText || (forward ? el.selectionStart === el.value.length && el.selectionEnd === el.value.length : el.selectionStart === 0 && el.selectionEnd === 0);
      if (atEdge && el.tagName !== 'SELECT') { const nc = cols[ci + (forward ? 1 : -1)]; if (nc) { e.preventDefault(); go(list[ri], nc.key); } }
      return;
    }
    if (e.key === 'PageDown' || e.key === 'PageUp') { e.preventDefault(); go(list[Math.max(0, Math.min(list.length - 1, ri + (e.key === 'PageDown' ? 10 : -10)))], col); return; }
    if (mod && (e.key === 'Home' || e.key === 'End')) { e.preventDefault(); go(list[e.key === 'Home' ? 0 : list.length - 1], col); }
  }, [reveal, onCell, undo, redo, doSave, scheduleSave, duplicate, fillDown, addRow, t, view.wrap]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleRef = useRef(visible); visibleRef.current = visible;
  const readOnlyRef = useRef(readOnly); readOnlyRef.current = readOnly;

  // Handlers given to the rows: one stable object, so typing re-renders only the row typed in.
  const retryRow = useCallback((key) => { setErrors(e => { const n = { ...e }; if (n[key]) { n[key] = { ...n[key] }; delete n[key]._row; } return n; }); doSave([key]); }, [doSave]);
  const copyRowRef = useRef(null);
  const copyRow = useCallback((key) => copyRowRef.current?.(key), []);
  const fillRow = useCallback((key) => {
    const list = shownRef.current; const i = list.findIndex(r => r._key === key);
    if (i <= 0) return;
    const cmd = cmdSet(latest.current.rows, editable.map(c => ({ key, col: c.key, value: list[i - 1][c.key] })));
    setRows(l => applyPatches(l, cmd.redo)); pushCmd(cmd); markDirty([key]); scheduleSave([key]);
  }, [editable, scheduleSave]); // eslint-disable-line react-hooks/exhaustive-deps
  const h = useMemo(() => ({ onCell, onCellFocus, onCellBlur, onCellKey, onRowBlur, onSelect, duplicate, insertBelow, remove, openEditor, retry: retryRow, copyRow, fillRow }), [onCell, onCellFocus, onCellBlur, onCellKey, onRowBlur, onSelect, duplicate, insertBelow, remove, openEditor, retryRow, copyRow, fillRow]);

  // ---------------------------------------------------------------- copy and paste (FR-DA-MRE-19 to 23)
  const copyRows = (list, e) => {
    const headers = visible.map(c => labelText(c.label, t, lang));
    const data = list.map(r => visible.map(c => displayValue(c, r[c.key], r, ctx)));
    const { tsv, html } = toClipboard(headers, data);
    if (e?.clipboardData) { e.clipboardData.setData('text/plain', tsv); e.clipboardData.setData('text/html', html); e.preventDefault(); }
    else if (navigator.clipboard?.write && window.ClipboardItem) navigator.clipboard.write([new window.ClipboardItem({ 'text/plain': new Blob([tsv], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]).catch(() => navigator.clipboard.writeText(tsv));
    else navigator.clipboard?.writeText(tsv);
    toast(t('{n} rows copied with their column titles.', { n: list.length }));
  };
  copyRowRef.current = (key) => copyRows(latest.current.rows.filter(r => r._key === key));
  const onCopy = (e) => {
    if (!selected.size) return; // a cell's own text is copied as usual
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.selectionStart !== el.selectionEnd) return;
    copyRows(shown.filter(r => selected.has(r._key)), e);
  };
  const applyPaste = useCallback((block, { mapping, hasHeader, startKey, startCol }) => {
    const list = latest.current.rows;
    const data = hasHeader ? block.slice(1) : block;
    let si = list.findIndex(r => r._key === startKey); if (si < 0) si = list.length;
    const changes = []; const inserts = []; const errs = {}; const touched = [];
    let added = 0; let lastKey = list[list.length - 1]?._key;
    data.forEach((cells, i) => {
      let target = list[si + i];
      if (!target) { const row = blankRow(list[list.length - 1]); inserts.push({ index: list.length + added, row }); added++; target = row; }
      touched.push(target._key);
      mapping.forEach((k, j) => {
        if (!k) return;
        const c = columns.find(x => x.key === k);
        if (!c || c.readOnly || c.computed) return;
        const r = convertValue(cells[j], c, { locale: ctx.locale, lang, t });
        if (target === inserts.find(x => x.row._key === target._key)?.row) target[k] = r.value; else changes.push({ key: target._key, col: k, value: r.value });
        if (r.error) errs[target._key] = { ...(errs[target._key] || {}), [k]: r.error };
      });
      lastKey = target._key;
    });
    const ins = cmdInsert(list, inserts); const set = cmdSet(list, changes);
    const opId = newKey();
    const cmd = { redo: [...ins.redo, ...set.redo], undo: [...set.undo, ...ins.undo], opId, serverApplied: true, label: 'paste' };
    setRows(l => applyPatches(l, cmd.redo)); pushCmd(cmd);
    setErrors(e => ({ ...e, ...errs }));
    setStatus(s => ({ ...s, ...Object.fromEntries(touched.map(k => [k, errs[k] ? 'error' : 'dirty'])) }));
    setTimeout(() => doSave(touched.filter(k => !errs[k]), { kind: 'paste', opId, mapping }), 0);
    toast(t('{n} rows pasted: {a} added, {b} changed; {c} cells to correct.', { n: data.length, a: added, b: data.length - added, c: Object.values(errs).reduce((a, x) => a + Object.keys(x).length, 0) }), 'ok', { label: t('Undo'), run: () => undoRef.current() }, { duration: 10000 });
    announceNow(t('{n} rows pasted.', { n: data.length }));
    if (startCol) reveal(lastKey, startCol);
  }, [columns, blankRow, ctx.locale, lang, t, toast, doSave, reveal]); // eslint-disable-line react-hooks/exhaustive-deps
  const handlePaste = useCallback((parsed, startKey, startCol) => {
    if (readOnly) { toast(`${t('This table is read-only')}: ${meta?.reason || ''}`, 'error'); return; }
    const block = parsed.rows;
    const max = meta?.limits?.pasteMaxRows || 1000;
    if (block.length > max + 1) { toast(t('Up to {n} rows can be pasted at once; use Import for more.', { n: max }), 'error'); return; }
    const list = latest.current.rows;
    let si = list.findIndex(r => r._key === startKey); if (si < 0) si = list.length;
    const ed = visible.filter(c => !c.readOnly && !c.computed);
    const c0 = Math.max(0, ed.findIndex(c => c.key === startCol));
    const width = Math.max(...block.map(r => r.length));
    const header = looksLikeHeader(block[0], ed, lang);
    const fits = width <= ed.length - c0;
    const overwrite = block.some((cells, i) => { const tg = list[si + i]; return tg && cells.some((v, j) => String(v).trim() !== '' && !isEmpty(tg[ed[c0 + j]?.key])); });
    const mapping = Array.from({ length: width }, (_, j) => ed[c0 + j]?.key || null);
    if (!header && fits && !overwrite) applyPaste(block, { mapping, hasHeader: false, startKey: list[si]?._key, startCol: ed[c0]?.key });
    else setDialog({ kind: 'paste', block, startKey: list[si]?._key, startIndex: si, startCol: ed[c0]?.key });
  }, [readOnly, meta, visible, lang, t, toast, applyPaste]);
  const onPaste = (e) => {
    const td = e.target.closest?.('td[data-row]');
    const parsed = parseClipboard({ html: e.clipboardData?.getData('text/html'), text: e.clipboardData?.getData('text/plain') });
    if (!parsed.rows.length || !isBlock(parsed.rows)) return; // one value: typed in the cell as usual
    e.preventDefault();
    handlePaste(parsed, td?.dataset.row || null, td?.dataset.col || active.current?.col);
  };

  // ---------------------------------------------------------------- import and export
  const commitImport = useCallback(async ({ rows: imported, sessionId, mapping }) => {
    setDialog(null);
    const list = latest.current.rows;
    const inserts = imported.map((v, i) => ({ index: list.length + i, row: { ...blankRow(null), ...v, _key: newKey() } }));
    const cmd = { ...cmdInsert(list, inserts), opId: sessionId, serverApplied: true, label: 'import' };
    setRows(l => applyPatches(l, cmd.redo)); pushCmd(cmd);
    const keys = inserts.map(x => x.row._key);
    markDirty(keys);
    setTimeout(async () => {
      const ok = await doSave(keys, { kind: 'import', opId: sessionId, mapping });
      api(`/entries/import/${sessionId}`, { method: 'PUT', body: { stage: 'summary', status: ok ? 'Committed' : 'Partly committed', result: { rows: keys.length } } }).catch(() => {});
      toast(t('{n} rows imported.', { n: keys.length }), 'ok', { label: t('Undo'), run: () => undoRef.current() }, { duration: 60000 });
    }, 0);
  }, [blankRow, doSave, toast, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const exportView = async (format, onlySelected) => {
    const list = onlySelected ? shown.filter(r => selected.has(r._key)) : shown;
    const headers = visible.map(c => labelText(c.label, t, lang));
    const data = list.map(r => visible.map(c => displayValue(c, r[c.key], r, ctx)));
    const name = exportName(meta ? labelText(meta.parent, t, lang) : title);
    setPop(null);
    if (format === 'csv') {
      const blob = new Blob([toCsv(headers, data, lang === 'fr' ? ';' : ',')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      return;
    }
    try {
      const res = await fetch(`/api/entries/${encodeURIComponent(source)}/export?lang=${lang}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ headers, rows: data, format: 'xlsx' }) });
      if (!res.ok) throw new ApiError(res.status, 'EXPORT', res.statusText);
      const blob = await res.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) { toast(e.message, 'error'); }
  };

  // ---------------------------------------------------------------- AI proposal
  const [aiBusy, setAiBusy] = useState(false);
  // An AI proposal is reviewed item by item by the caller, which inserts the accepted rows.
  const runAi = async () => {
    if (!aiPropose) return;
    setAiBusy(true);
    try { await aiPropose(); } finally { setAiBusy(false); }
  };

  // Rows added from outside the table (a library, an AI proposal accepted item by item).
  const insertRows = useCallback((vals) => {
    if (!vals?.length) return;
    const list = latest.current.rows;
    const inserts = vals.map((v, i) => ({ index: list.length + i, row: { ...blankRow(null), ...v, _key: newKey() } }));
    const cmd = cmdInsert(list, inserts);
    setRows(l => applyPatches(l, cmd.redo)); pushCmd(cmd);
    const keys = inserts.map(x => x.row._key);
    markDirty(keys); scheduleSave(keys, 300);
    announceNow(t('{n} rows added.', { n: keys.length }));
  }, [blankRow, scheduleSave, t]); // eslint-disable-line react-hooks/exhaustive-deps
  if (props.apiRef) props.apiRef.current = { insertRows, rows: () => latest.current.rows };

  // ---------------------------------------------------------------- Discard, Leave Guard, conflicts
  const discardAll = useCallback(async () => {
    writeDraft(userId, source, null);
    latest.current.deletes = [];
    setStatus({}); setErrors({}); setConflicts([]); setNotice(null); history.current.clear();
    await load();
    announceNow(t('Changes discarded.'));
  }, [load, userId, source, t]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => registerEntry(instId, {
    title: () => title,
    pending: () => Object.values(latest.current.status).filter(s => ['dirty', 'error', 'waiting', 'conflict', 'saving'].includes(s)).length + latest.current.deletes.length,
    errors: () => Object.values(latest.current.status).filter(s => s === 'error' || s === 'conflict').length,
    saveAll: async () => { const ok = await doSave(); return ok && !Object.values(latest.current.status).some(s => ['error', 'conflict', 'waiting'].includes(s)); },
    discard: () => { writeDraft(userId, source, null); },
  }), [instId, title, doSave, userId, source]);
  const resolveConflict = async (c, choice) => {
    setConflicts(list => list.filter(x => x.key !== c.key));
    if (c.del) { if (choice === 'mine') { latest.current.deletes = [...latest.current.deletes, { _rid: c.server._rid }]; await api(`/entries/${encodeURIComponent(source)}/ops`, { method: 'POST', body: { deletes: [{ _rid: c.server._rid }], force: [c.server._rid] } }).catch(e => toast(e.message, 'error')); } else setRows(l => [...l, { ...c.server, _key: c.server._rid }]); return; }
    if (choice === 'server') {
      if (c.server) setRows(l => l.map(r => (r._key === c.key ? { ...c.server, _key: c.key } : r)));
      else setRows(l => l.filter(r => r._key !== c.key));
      setStatus(s => { const n = { ...s }; delete n[c.key]; return n; });
      return;
    }
    // Keep mine: overwrite the server version (or create the row again when it was deleted).
    const row = latest.current.rows.find(r => r._key === c.key) || c.mine;
    if (!latest.current.rows.some(r => r._key === c.key)) setRows(l => [...l, { ...c.mine, _key: c.key }]);
    setStatus(s => ({ ...s, [c.key]: 'saving' }));
    try {
      const res = await api(`/entries/${encodeURIComponent(source)}/ops`, { method: 'POST', body: { upserts: [{ ...valuesOf(row, columns), _cid: c.key, _rid: row._rid, _base: c.server?._stamp }], force: row._rid ? [row._rid] : [] } });
      applyResults(res.results);
    } catch (e) { toast(e.message, 'error'); setStatus(s => ({ ...s, [c.key]: 'error' })); }
  };

  // ---------------------------------------------------------------- Full-Screen Entry Workspace
  const setFullRef = useRef(null);
  const openFull = useCallback((on) => {
    setFull(on);
    if (on) { try { window.history.pushState({ ...(window.history.state || {}), meWorkspace: instId }, ''); } catch { /* history unavailable */ } }
  }, [instId]);
  setFullRef.current = openFull;
  const closeFull = useCallback((fromPop) => {
    setFull(false);
    if (!fromPop && window.history.state?.meWorkspace === instId) { try { window.history.back(); } catch { /* ignore */ } }
    // Pending rows are saved; focus returns to the active cell or the Expand action.
    if (Object.values(latest.current.status).some(s => s === 'dirty')) doSave();
    setTimeout(() => { if (!(active.current && focusCell(active.current.key, active.current.col))) expandBtn.current?.focus(); active.current && reveal(active.current.key, active.current.col); }, 30);
  }, [instId, doSave, focusCell, reveal]);
  useEffect(() => {
    if (!full) return undefined;
    const onPop = () => closeFull(true);
    const onKey = (e) => {
      if (e.defaultPrevented) return;
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === 'Escape') { if (document.querySelector('.modal-backdrop, .popover')) return; e.preventDefault(); closeFull(false); return; }
      if (mod && (e.key === '+' || e.key === '=')) { e.preventDefault(); setPrefs({ zoom: clampZoom(viewRef.current.zoom + ZOOM_STEP) }); }
      if (mod && e.key === '-') { e.preventDefault(); setPrefs({ zoom: clampZoom(viewRef.current.zoom - ZOOM_STEP) }); }
      if (mod && e.key === '0') { e.preventDefault(); setPrefs({ zoom: 1 }); }
      if (mod && e.shiftKey && (e.key === '1' || e.key === '!')) { e.preventDefault(); fit(); }
      // Focus stays within the workspace (a labelled dialog).
      if (e.key === 'Tab' && wrapRef.current && !wrapRef.current.contains(document.activeElement)) { e.preventDefault(); wrapRef.current.querySelector('button, input, select, textarea')?.focus(); }
    };
    window.addEventListener('popstate', onPop);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('me-full-open');
    setTimeout(() => { if (!(active.current && focusCell(active.current.key, active.current.col))) wrapRef.current?.querySelector('td[data-row] :is(input, select, textarea)')?.focus(); }, 30);
    return () => { window.removeEventListener('popstate', onPop); document.removeEventListener('keydown', onKey); document.body.classList.remove('me-full-open'); };
  }, [full]); // eslint-disable-line react-hooks/exhaustive-deps
  const viewRef = useRef(view); viewRef.current = view;
  const fit = () => {
    const table = recordsRef.current?.querySelector('table'); const box = scrollRef.current;
    if (!table || !box) return;
    const natural = table.scrollWidth / viewRef.current.zoom;
    setPrefs({ zoom: clampZoom(Math.floor((box.clientWidth / natural) * 10) / 10) });
  };
  // Ctrl/Cmd + wheel or a pinch zooms the records; the plain wheel scrolls as on the page.
  useEffect(() => {
    if (!full) return undefined;
    const el = scrollRef.current; if (!el) return undefined;
    const onWheel = (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); setPrefs({ zoom: clampZoom(viewRef.current.zoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)) }); };
    let d0 = null; let z0 = 1;
    const dist = (t0) => Math.hypot(t0[0].clientX - t0[1].clientX, t0[0].clientY - t0[1].clientY);
    const onTs = (e) => { if (e.touches.length === 2) { d0 = dist(e.touches); z0 = viewRef.current.zoom; } };
    const onTm = (e) => { if (d0 && e.touches.length === 2) { e.preventDefault(); setPrefs({ zoom: clampZoom(z0 * (dist(e.touches) / d0)) }); } };
    const onTe = () => { d0 = null; };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTs, { passive: true }); el.addEventListener('touchmove', onTm, { passive: false }); el.addEventListener('touchend', onTe);
    return () => { el.removeEventListener('wheel', onWheel); el.removeEventListener('touchstart', onTs); el.removeEventListener('touchmove', onTm); el.removeEventListener('touchend', onTe); };
  }, [full, setPrefs]);
  // The active cell stays in view when the zoom changes.
  useEffect(() => { if (full && active.current) { const el = wrapRef.current?.querySelector(`td[data-row="${active.current.key}"][data-col="${active.current.col}"]`); el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); } }, [view.zoom, full]);

  useEffect(() => {
    const el = wrapRef.current; if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setBoxW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [meta, full, mobile]);
  useEffect(() => { const mq = window.matchMedia?.('(max-width: 767px)'); if (!mq) return undefined; const f = () => setMobile(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, []);
  // Ctrl/Cmd + Shift + F from anywhere in the Multi-Entry (toolbar included).
  const onRootKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f') && !full) { e.preventDefault(); openFull(true); } };

  // ---------------------------------------------------------------- column resize and reorder
  const startResize = (e, key) => {
    e.preventDefault(); e.stopPropagation();
    const th = e.currentTarget.parentElement; const x0 = e.clientX; const w0 = th.getBoundingClientRect().width / view.zoom;
    const rtl = document.documentElement.dir === 'rtl' ? -1 : 1;
    document.body.classList.add('is-resizing');
    const move = (ev) => setView(v => ({ ...v, widths: { ...v.widths, [key]: Math.max(80, Math.round(w0 + rtl * (ev.clientX - x0) / v.zoom)) } }));
    const up = () => { document.body.classList.remove('is-resizing'); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setView(v => { writeTablePrefs(source, { widths: v.widths }); return v; }); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const dragCol = useRef(null);
  const onDropCol = (key) => { const from = dragCol.current; dragCol.current = null; if (!from || from === key) return; const o = [...order]; o.splice(o.indexOf(from), 1); o.splice(o.indexOf(key), 0, from); setPrefs({ order: o }); };

  // ---------------------------------------------------------------- render
  if (loadError) return <div className="callout bad small" role="alert"><span>{loadError.message}</span><button type="button" className="btn btn-sm" onClick={load}>{t('Retry')}</button></div>;
  if (!meta) return <div className="me-skeleton" aria-busy="true" aria-label={t('Loading…')}>{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div>;
  const pendingCount = [...pendingKeys].filter(k => status[k] !== 'saving').length + latest.current.deletes.length;
  const errorCount = Object.values(status).filter(s => s === 'error' || s === 'conflict').length;
  const issues = rows.flatMap((r, index) => Object.entries(errors[r._key] || {}).map(([col, message]) => ({ key: r._key, col, message, index })));
  const saveState = offline ? t('Waiting for the connection: {n} rows will be saved when it returns.', { n: pendingCount }) : errorCount ? t('{n} rows with errors', { n: errorCount }) : pendingCount ? t('{n} unsaved rows', { n: pendingCount }) : Object.values(status).includes('saving') ? t('Saving…') : t('All changes saved');
  const numCols = visible.filter(c => c.type === 'number' && !c.noTotal);
  const totals = numCols.map(c => [c, shown.reduce((a, r) => a + (Number.isFinite(Number(r[c.key])) && r[c.key] !== '' ? Number(r[c.key]) : 0), 0)]);
  const count = countLabel ? countLabel(rows.length) : t('{n} records.', { n: rows.length });
  const backName = backLabel || (meta.back ? `${meta.back.code ? `${meta.back.code} ` : ''}${tx(meta.back.name, lang) || ''}` : t('the page'));
  const ctxLine = context || (meta.back ? `${tx(meta.parent, lang)}` : '');
  const selKeys = [...selected].filter(k => indexOf.has(k));
  const editorIndex = editor ? rows.findIndex(r => r._key === editor) : -1;

  // Phone: a list of the rows, edited one by one (FR-DA-MRE-34).
  if (mobile) {
    return (
      <div className="me me-mobile" ref={wrapRef}>
        <div className="row-between"><span className="small muted" aria-live="polite">{count}</span><span className="xsmall muted">{saveState}</span></div>
        <ul className="me-list" role="list">
          {rows.map((r, i) => (
            <li key={r._key} className={errors[r._key] && Object.keys(errors[r._key]).length ? 'has-error' : ''}>
              <button type="button" className="list-btn" onClick={() => setEditor(r._key)}>
                <span className="row-n">{i + 1}</span><RowStatus state={status[r._key]} t={t} />
                <span className="stack-8" style={{ gap: 2, minWidth: 0 }}>{visible.slice(0, 3).map(c => <span key={c.key} className={c === visible[0] ? 'small strong' : 'xsmall muted'}>{displayValue(c, r[c.key], r, ctx) || '—'}</span>)}
                  {errors[r._key] && Object.values(errors[r._key]).map((m, j) => <span key={j} className="xsmall row-error"><AlertCircle size={12} aria-hidden="true" /> {m}</span>)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="row">
          {rows.length > 0 && <button type="button" className="btn btn-sm" onClick={() => setEditor(rows[0]._key)}>{t('Edit one by one')}</button>}
          {!readOnly && <button type="button" className="btn btn-sm" onClick={() => setEditor(addRow(null, false))}><Plus size={16} />{t('Add row')}</button>}
          {!readOnly && <button type="button" className="btn btn-sm" onClick={() => setDialog({ kind: 'import' })}><Upload size={16} />{t('Import')}</button>}
        </div>
        {renderDialogs()}
      </div>
    );
  }

  function renderDialogs() {
    return (
      <>
        {editor && editorIndex >= 0 && <RowEditor h={h} title={title} columns={order.map(k => columns.find(c => c.key === k)).filter(Boolean)} rows={rows} index={editorIndex} setIndex={(i) => setEditor(rows[i]?._key)} readOnly={readOnly} ctx={ctx} renderCell={renderCell} errors={Object.fromEntries(Object.entries(errors).flatMap(([k, e]) => Object.entries(e || {}).map(([c, m]) => [`${k}:${c}`, m])))}
          onCell={(key, col, v) => { onCell(key, col, v); }} onClose={() => { const k = editor; setEditor(null); if (['dirty', 'error'].includes(latest.current.status[k])) scheduleSave([k], 300); }}
          onSaveAndNew={() => { const k = editor; if (['dirty', 'error'].includes(latest.current.status[k])) scheduleSave([k], 0); setEditor(addRow(k, false)); }} />}
        {dialog?.kind === 'confirm' && <ConfirmDialog title={dialog.title} onClose={() => setDialog(null)} actions={{ cancelLabel: t('Cancel'), list: [{ label: dialog.confirmLabel, kind: dialog.danger ? 'danger' : 'primary', run: () => { setDialog(null); dialog.run(); } }] }}><p>{dialog.message}</p></ConfirmDialog>}
        {dialog?.kind === 'paste' && <PastePreview block={dialog.block} columns={visible} startKey={dialog.startCol} startIndex={dialog.startIndex} rows={rows} savedMapping={readTablePrefs(source).mapping} ctx={ctx} maxRows={meta.limits?.pasteMaxRows || 1000}
          onCancel={() => setDialog(null)} onApply={({ mapping, hasHeader }) => { setDialog(null); setPrefs({ mapping }); applyPaste(dialog.block, { mapping, hasHeader, startKey: dialog.startKey, startCol: dialog.startCol }); }} />}
        {dialog?.kind === 'pasteBox' && <PasteBox t={t} onClose={() => setDialog(null)} onPaste={(parsed) => { setDialog(null); handlePaste(parsed, active.current?.key || null, active.current?.col || visible.find(c => !c.readOnly)?.key); }} />}
        {dialog?.kind === 'import' && <ImportWizard source={source} columns={columns} existing={rows} limits={meta.limits} ctx={ctx} onClose={() => setDialog(null)} onCommit={commitImport} />}
        {dialog?.kind === 'discard' && <ConfirmDialog title={t('Discard the changes?')} onClose={() => setDialog(null)} actions={{ cancelLabel: t('Keep them'), list: [{ label: t('Discard'), kind: 'danger', run: () => { setDialog(null); discardAll(); } }] }}><p>{t('{n} changed rows return to their saved values and new unsaved rows are removed.', { n: pendingCount })}</p></ConfirmDialog>}
        {dialog?.kind === 'bulk' && <BulkSet columns={editable} ctx={ctx} renderCell={renderCell} count={selKeys.length} onClose={() => setDialog(null)} onApply={(col, value) => { setDialog(null); bulkSet(selKeys, col, value); }} />}
        {conflicts.length > 0 && dialog?.kind === 'conflicts' && <ConflictsDialog conflicts={conflicts} columns={visible} ctx={ctx} onResolve={resolveConflict} onClose={() => setDialog(null)} />}
      </>
    );
  }

  // Widths fit the space available (never below 80 px) so the table reads without scrolling
  // sideways; a width the user set by dragging is kept as set.
  const baseW = (c) => view.widths[c.key] || c.width || (c.wide ? 280 : c.type === 'textarea' ? 240 : ['person', 'kpi', 'obs', 'parties', 'mp', 'combo'].includes(c.type) ? 220 : c.type === 'date' ? 150 : c.type === 'number' || c.type === 'score' ? 110 : c.type === 'checkbox' ? 90 : 170);
  const fixedW = 96 + (readOnly ? 48 : 184);
  const need = visible.reduce((a, c) => a + baseW(c), 0);
  const avail = Math.max(0, (boxW || 0) / (full ? view.zoom : 1) - fixedW - 2);
  const scale = boxW && need > avail ? avail / need : 1;
  const colW = (c) => (view.widths[c.key] ? view.widths[c.key] : Math.max(80, Math.floor(baseW(c) * scale)));
  const tableW = fixedW + visible.reduce((a, c) => a + colW(c), 0);
  const body = (
    <div className="me-records" ref={recordsRef} style={{ zoom: full ? view.zoom : undefined }}>
      <table className={`data grid-table me-table ${view.density === 'compact' ? 'compact' : ''} ${view.wrap ? 'wrap' : 'nowrap'}`} role="grid" aria-label={title} aria-rowcount={shown.length + 1} aria-colcount={visible.length + 2} aria-readonly={readOnly || undefined} style={{ width: tableW, minWidth: '100%', tableLayout: 'fixed' }}>
        <thead><tr role="row" aria-rowindex={1}>
          <th scope="col" role="columnheader" aria-colindex={1} className="me-num sticky-start" style={{ width: 96 }}>
            {!readOnly && <input type="checkbox" className="grid-check" aria-label={t('Select every row shown')} checked={shown.length > 0 && selKeys.length === shown.length} onChange={e => setSelected(e.target.checked ? new Set(shown.map(r => r._key)) : new Set())} />}#
          </th>
          {visible.map((c, ci) => (
            <th key={c.key} scope="col" role="columnheader" aria-colindex={ci + 2} className={ci === 0 && view.pinned ? 'sticky-first' : ''} style={{ width: colW(c) }} draggable onDragStart={() => { dragCol.current = c.key; }} onDragOver={e => e.preventDefault()} onDrop={() => onDropCol(c.key)}
              aria-sort={view.sort?.key === c.key ? (view.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <button type="button" className="th-btn" onClick={() => setPrefs({ sort: nextSort(view.sort, c.key) })} title={t('Sort')}>{c.required && <span className="req" aria-hidden="true">*</span>}{labelText(c.label, t, lang)}{view.sort?.key === c.key ? (view.sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
              <span className="col-resize" onPointerDown={e => startResize(e, c.key)} aria-hidden="true" />
            </th>
          ))}
          <th scope="col" role="columnheader" className="me-actions sticky-end" style={{ width: readOnly ? 48 : 184 }}><span className="sr-only">{t('Actions')}</span></th>
        </tr></thead>
        <tbody>
          {virtual && start > 0 && <tr aria-hidden="true" style={{ height: start * rowH }}><td colSpan={visible.length + 2} /></tr>}
          {slice.map((r, i) => (
            <GridRow key={r._key} row={r} index={indexOf.get(r._key)} ariaIndex={sliceOffset + i + 2} cols={visible} state={status[r._key]} errs={errors[r._key]} selected={selected.has(r._key)} readOnly={readOnly} wrap={view.wrap} pinned={view.pinned} h={h} ctx={ctx} renderCell={renderCell} flash={!!flash[r._key]} />
          ))}
          {virtual && end < shown.length && <tr aria-hidden="true" style={{ height: (shown.length - end) * rowH }}><td colSpan={visible.length + 2} /></tr>}
        </tbody>
      </table>
    </div>
  );

  const empty = !rows.length;
  return (
    <div className={`me ${full ? 'me-full' : ''}`} ref={wrapRef} onKeyDown={onRootKey} onCopy={onCopy} onPaste={readOnly ? undefined : onPaste}
      {...(full ? { role: 'dialog', 'aria-modal': 'true', 'aria-label': `${title} — ${t('Full-screen entry')}` } : {})}>
      {full && (
        <div className="me-full-head">
          <div className="stack-8" style={{ gap: 2, minWidth: 0 }}>
            <span className="eyebrow" style={{ margin: 0 }}>{ctxLine}</span>
            <strong className="me-full-title">{title}</strong>
          </div>
          {meta.back?.status && <span className="tag" title={t('Status of {name}', { name: backName })}>{L(meta.back.status)}</span>}
          <span className="small muted">{count}</span>
          <span className="small muted" aria-live="polite">{saveState}</span>
          <div className="me-zoom" role="group" aria-label={t('Zoom')}>
            <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('Zoom out')} onClick={() => setPrefs({ zoom: clampZoom(view.zoom - ZOOM_STEP) })}><ZoomOut size={18} /></button>
            <input type="range" min={ZOOM_MIN * 100} max={ZOOM_MAX * 100} step={10} value={Math.round(view.zoom * 100)} aria-label={t('Zoom level')} aria-valuetext={`${Math.round(view.zoom * 100)} %`} onChange={e => setPrefs({ zoom: clampZoom(Number(e.target.value) / 100) })} />
            <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('Zoom in')} onClick={() => setPrefs({ zoom: clampZoom(view.zoom + ZOOM_STEP) })}><ZoomIn size={18} /></button>
            <output className="small strong num" aria-live="polite" style={{ minWidth: 48, textAlign: 'center' }}>{Math.round(view.zoom * 100)} %</output>
            <button type="button" className="btn btn-sm" onClick={fit}>{t('Fit')}</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPrefs({ zoom: 1 })}>{t('Reset')}</button>
          </div>
          <button type="button" className="btn btn-primary btn-sm me-back" aria-label={`${t('Return to page')}: ${backName}`} onClick={() => closeFull(false)}><Minimize2 size={16} />{t('Back to {name}', { name: backName })}</button>
        </div>
      )}
      {notice?.kind === 'draft' && (
        <div className="callout small" role="status"><span>{t('Draft restored from {at}.', { at: new Date(notice.at).toLocaleString(ctx.locale) })}{conflicts.length ? ` ${t('{n} rows changed elsewhere since.', { n: conflicts.length })}` : ''}</span>
          {conflicts.length > 0 && <button type="button" className="btn btn-sm" onClick={() => setDialog({ kind: 'conflicts' })}>{t('Review the conflicts')}</button>}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDialog({ kind: 'discard' })}>{t('Discard the draft')}</button>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label={t('Close')} onClick={() => setNotice(null)}><X size={14} /></button></div>
      )}
      {!notice && conflicts.length > 0 && <div className="callout warn small" role="alert"><span>{t('{n} rows were changed by someone else.', { n: conflicts.length })}</span><button type="button" className="btn btn-sm" onClick={() => setDialog({ kind: 'conflicts' })}>{t('Resolve')}</button></div>}
      {offline && <div className="callout warn small" role="status"><CloudOff size={16} aria-hidden="true" /><span>{t('You are offline. Your changes will be saved when the connection returns.')}</span></div>}
      {readOnly && meta.reason && <p className="small muted" style={{ margin: 0 }}>{meta.reason}</p>}

      <div className="me-toolbar" role="toolbar" aria-label={t('{title}: table actions', { title })}>
        <div className="search me-search"><SearchIcon size={16} aria-hidden="true" /><input className="input" type="search" placeholder={t('Search')} aria-label={t('Search in the table')} value={view.search} onChange={e => setView(v => ({ ...v, search: e.target.value, page: 1 }))} /></div>
        <span className="me-pop-anchor"><button type="button" className="btn btn-sm" aria-expanded={pop === 'filter'} onClick={() => setPop(pop === 'filter' ? null : 'filter')}><Filter size={16} />{t('Filter')}{view.filters.length ? <span className="count-badge">{view.filters.length}</span> : null}</button>
          {pop === 'filter' && <FilterBuilder columns={visible} ctx={ctx} onClose={() => setPop(null)} onAdd={(f) => { setView(v => ({ ...v, filters: [...v.filters, f], page: 1 })); setPop(null); }} />}</span>
        <span className="me-pop-anchor"><button type="button" className={`btn btn-sm ${issues.length ? 'btn-danger-outline' : ''}`} aria-expanded={pop === 'issues'} onClick={() => setPop(pop === 'issues' ? null : 'issues')}><AlertCircle size={16} />{t('Issues')}<span className="count-badge">{issues.length}</span></button>
          {pop === 'issues' && <IssuesList issues={issues} columns={columns} ctx={ctx} onClose={() => setPop(null)} onOpen={(x) => { setPop(null); if (x.col === '_row' || hidden.includes(x.col)) setEditor(x.key); else { setView(v => ({ ...v, search: '', filters: [], errorsOnly: false })); reveal(x.key, x.col); } }} />}</span>
        <label className="checkbox small"><input type="checkbox" checked={view.errorsOnly} onChange={e => setView(v => ({ ...v, errorsOnly: e.target.checked, page: 1 }))} /><span>{t('Rows with errors')}</span></label>
        <div className="segmented" role="group" aria-label={t('Density')}>
          <button type="button" aria-pressed={view.density === 'comfortable'} onClick={() => setPrefs({ density: 'comfortable' })}>{t('Comfortable')}</button>
          <button type="button" aria-pressed={view.density === 'compact'} onClick={() => setPrefs({ density: 'compact' })}>{t('Compact')}</button>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" aria-pressed={view.wrap} onClick={() => setPrefs({ wrap: !view.wrap })}><WrapText size={16} />{t('Wrap long text')}</button>
        <div className="segmented" role="group" aria-label={t('View')}>
          <button type="button" aria-pressed={view.mode === 'continuous'} onClick={() => setPrefs({ mode: 'continuous' })}>{t('Continuous')}</button>
          <button type="button" aria-pressed={view.mode === 'pages'} onClick={() => setPrefs({ mode: 'pages', page: 1 })}>{t('Pages')}</button>
        </div>
        <span className="me-pop-anchor"><button type="button" className="btn btn-sm" aria-expanded={pop === 'columns'} onClick={() => setPop(pop === 'columns' ? null : 'columns')}><Columns3 size={16} />{t('Columns')}{hidden.length ? <span className="count-badge">{hidden.length} {t('hidden')}</span> : null}</button>
          {pop === 'columns' && <ColumnChooser columns={columns} order={order} hidden={hidden} pinned={view.pinned} ctx={ctx} onClose={() => setPop(null)} onChange={setPrefs} />}</span>
        {!readOnly && <>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label={t('Undo')} title={`${t('Undo')} (Ctrl+Z)`} disabled={!history.current.canUndo} onClick={undo}><Undo2 size={16} /></button>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label={t('Redo')} title={`${t('Redo')} (Ctrl+Shift+Z)`} disabled={!history.current.canRedo} onClick={redo}><Redo2 size={16} /></button>
          <button type="button" className="btn btn-sm" onClick={() => setDialog({ kind: 'pasteBox' })}><ClipboardPaste size={16} />{t('Paste')}</button>
          <button type="button" className="btn btn-sm" onClick={() => setDialog({ kind: 'import' })}><Upload size={16} />{t('Import')}</button>
          {rows.length > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => duplicate(rows[rows.length - 1]._key)}><Copy size={16} />{t('Duplicate previous row')}</button>}
        </>}
        <span className="me-pop-anchor"><button type="button" className="btn btn-sm" aria-expanded={pop === 'export'} onClick={() => setPop(pop === 'export' ? null : 'export')}><Download size={16} />{t('Export')}</button>
          {pop === 'export' && <div className="popover" role="menu" aria-label={t('Export')}>
            <button type="button" role="menuitem" className="list-btn" onClick={() => exportView('xlsx', false)}>{t('Current view — Excel')}</button>
            <button type="button" role="menuitem" className="list-btn" onClick={() => exportView('csv', false)}>{t('Current view — CSV')}</button>
            {selKeys.length > 0 && <button type="button" role="menuitem" className="list-btn" onClick={() => exportView('xlsx', true)}>{t('Selected rows — Excel')}</button>}
            {selKeys.length > 0 && <button type="button" role="menuitem" className="list-btn" onClick={() => exportView('csv', true)}>{t('Selected rows — CSV')}</button>}
          </div>}</span>
        {aiPropose && !readOnly && <button type="button" className="btn btn-sm" disabled={aiBusy} onClick={runAi}><Sparkles size={16} />{aiBusy ? t('Preparing…') : t('Propose with AI')}</button>}
        {extraActions}
        {!full && !mobile && <button type="button" ref={expandBtn} className="btn btn-sm btn-ghost btn-icon me-expand" aria-label={t('Open full screen')} title={`${t('Open full screen')} (Ctrl+Shift+F)`} onClick={() => openFull(true)}><Maximize2 size={24} /></button>}
      </div>
      {view.filters.length > 0 && <div className="chips" style={{ margin: 0 }}>{view.filters.map((f, i) => <span key={i} className="chip">{filterText(f, columns, ctx)}<button type="button" className="chip-x" aria-label={t('Remove the filter')} onClick={() => setView(v => ({ ...v, filters: v.filters.filter((_, j) => j !== i) }))}><X size={12} /></button></span>)}<button type="button" className="btn btn-sm btn-ghost" onClick={() => setView(v => ({ ...v, filters: [] }))}>{t('Clear all')}</button></div>}
      {selKeys.length > 0 && !readOnly && (
        <div className="me-bulk" role="region" aria-label={t('Selected rows')}>
          <span className="small strong">{t('{n} selected', { n: selKeys.length })}</span>
          <button type="button" className="btn btn-sm" onClick={() => setDialog({ kind: 'bulk' })}><Wand2 size={16} />{t('Set a field')}</button>
          <button type="button" className="btn btn-sm" onClick={() => copyRows(shown.filter(r => selected.has(r._key)))}><Copy size={16} />{t('Copy')}</button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(selKeys)}><Trash2 size={16} />{t('Delete')}</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set())}>{t('Clear the selection')}</button>
        </div>
      )}

      {empty ? (
        <div className="empty me-empty">
          <Rows3 size={48} aria-hidden="true" className="muted" />
          <h4>{emptyText || t('No rows yet.')}</h4>
          {!readOnly && <div className="row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary me-add" onClick={() => addRow(null)}><Plus size={16} />{t('Add the first row')}</button>
            <button type="button" className="btn" onClick={() => setDialog({ kind: 'import' })}><Upload size={16} />{t('Import')}</button>
            <button type="button" className="btn" onClick={() => setDialog({ kind: 'pasteBox' })}><ClipboardPaste size={16} />{t('Paste')}</button>
            {aiPropose && <button type="button" className="btn" disabled={aiBusy} onClick={runAi}><Sparkles size={16} />{t('Propose with AI')}</button>}
          </div>}
        </div>
      ) : (
        <div className={`table-wrap me-scroll ${full ? 'full' : ''}`} ref={scrollRef} style={virtual ? { height: viewportH } : full ? { height: viewportH } : undefined} onScroll={virtual ? (e) => { const top = e.currentTarget.scrollTop; requestAnimationFrame(() => setScrollTop(top)); } : undefined}>
          {body}
        </div>
      )}
      {!readOnly && !empty && <div><button type="button" className="btn btn-sm me-add" onClick={() => addRow(null)}><Plus size={16} />{t('Add row')}</button></div>}

      <div className="me-footer">
        <span className="small muted" aria-live="polite">{count}{shown.length !== rows.length ? ` ${t('{n} shown.', { n: shown.length })}` : ''}{selKeys.length ? ` ${t('{n} selected.', { n: selKeys.length })}` : ''}</span>
        {totals.map(([c, v]) => <span key={c.key} className="small"><span className="muted">{t('Total {c}', { c: labelText(c.label, t, lang) })}: </span><span className="num strong">{fmtNum(v, 2)}</span></span>)}
        {view.mode === 'pages' && pages > 1 && <span className="row small" style={{ gap: 6 }}>
          <button type="button" className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setView(v => ({ ...v, page: page - 1 }))}>{t('Previous page')}</button>
          {t('Page {n} of {total}', { n: page, total: pages })}
          <button type="button" className="btn btn-sm btn-ghost" disabled={page >= pages} onClick={() => setView(v => ({ ...v, page: page + 1 }))}>{t('Next page')}</button>
          <select className="select select-sm" aria-label={t('Rows per page')} value={view.size} onChange={e => setPrefs({ size: Number(e.target.value), page: 1 })}>{[20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}</select></span>}
        <span className={`small ${errorCount ? 'row-error' : 'muted'}`} style={{ marginInlineStart: 'auto' }}>{saveState}</span>
        {batch && <span className="me-batch" role="status" aria-live="polite">
          <progress max={batch.total} value={batch.done} aria-label={t('{label}: batch {d} of {n}', { label: batch.label, d: batch.done, n: batch.total })} />
          <span className="xsmall">{t('{d} of {n} batches', { d: batch.done, n: batch.total })}{batch.failed ? ` · ${t('{n} failed', { n: batch.failed })}` : ''}</span>
          {!batch.finished && !batch.cancelled && <button type="button" className="btn btn-sm btn-ghost" onClick={() => { cancelled.current = true; }}>{t('Cancel')}</button>}
          {batch.resume && <button type="button" className="btn btn-sm" onClick={() => { const r = batch.resume; setBatch(null); r(); }}><RotateCcw size={14} />{t('Resume')}</button>}
          {(batch.finished || batch.cancelled) && <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label={t('Close')} onClick={() => setBatch(null)}><X size={14} /></button>}
        </span>}
        {!readOnly && Object.values(status).includes('error') && <button type="button" className="btn btn-sm" onClick={() => doSave(Object.entries(status).filter(([, s]) => s === 'error').map(([k]) => k))}><RotateCcw size={14} />{t('Retry all failed')}</button>}
        {!readOnly && pendingCount > 0 && <button type="button" className="btn btn-sm btn-primary" onClick={() => doSave()}><Save size={16} />{t('Save all')}</button>}
        {!readOnly && pendingCount > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDialog({ kind: 'discard' })}>{t('Discard')}</button>}
      </div>
      {!full && <p className="xsmall muted me-hint">{t('Tab and Enter move between cells · Esc cancels a cell · Ctrl+Z / Ctrl+Shift+Z undo and redo · Ctrl+D duplicates · Ctrl+S saves · paste rows from Word or Excel · Ctrl+Shift+F full screen')}</p>}
      <div className="sr-only" aria-live="polite" role="status">{announce}</div>
      {renderDialogs()}
    </div>
  );
}

function PasteBox({ t, onPaste, onClose }) {
  const [text, setText] = useState('');
  return (
    <ConfirmDialog title={t('Paste rows')} onClose={onClose} actions={{ cancelLabel: t('Cancel'), list: [{ label: t('Continue'), kind: 'primary', run: () => onPaste(parseClipboard({ text })) }] }}>
      <p className="small">{t('Press Ctrl+V (Cmd+V) in the box to paste the rows copied from Word, Excel, a CSV file, a web page or another application.')}</p>
      <textarea className="textarea" rows={6} aria-label={t('Rows to paste')} value={text} autoFocus
        onPaste={(e) => { const p = parseClipboard({ html: e.clipboardData?.getData('text/html'), text: e.clipboardData?.getData('text/plain') }); if (p.rows.length && p.source === 'html') { e.preventDefault(); onPaste(p); } }}
        onChange={e => setText(e.target.value)} />
    </ConfirmDialog>
  );
}

function BulkSet({ columns, ctx, renderCell, count, onApply, onClose }) {
  const { t, lang } = ctx;
  const [key, setKey] = useState(columns[0]?.key);
  const [value, setValue] = useState('');
  const col = columns.find(c => c.key === key);
  return (
    <ConfirmDialog title={t('Set a field on {n} rows', { n: count })} onClose={onClose} actions={{ cancelLabel: t('Cancel'), list: [{ label: t('Apply to {n} rows', { n: count }), kind: 'primary', run: () => onApply(key, value) }] }}>
      <label className="small strong" htmlFor="bulk-field">{t('Field')}</label>
      <select id="bulk-field" className="select" value={key} onChange={e => { setKey(e.target.value); setValue(''); }}>{columns.map(c => <option key={c.key} value={c.key}>{labelText(c.label, t, lang)}</option>)}</select>
      {col && <CellEditor col={col} big value={value} row={{}} ctx={ctx} renderCell={renderCell} aria={t('Value')} onChange={setValue} />}
    </ConfirmDialog>
  );
}
