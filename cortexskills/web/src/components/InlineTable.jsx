// Inline Editable Table for multi-record entry (FR-DA-MRE-01 – 14, NFR-DA-REL-10, NFR-DA-FOC-01 – 13).
// One row per record and one column per field; the first column shows the row status (clean, changed, saving, saved,
// invalid). A row is saved about 500 ms after the user leaves it; a deleted row can be restored for 5 seconds; a
// block copied from a spreadsheet is expanded into rows; a cell is validated when the user leaves it, never while
// typing, and its value is never reset. Keys are stable record identifiers, so focus stays in the active cell.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession } from '../lib/session.jsx';
import { Btn, Icon, Select, Spinner, Search, Drawer, Field, useOverlay } from './ui.jsx';
import { post } from '../lib/api.js';
import { EntryWorkspace } from './EntryWorkspace.jsx';
import { usePaste } from './PastePreview.jsx';
import { toClipboard, writeClipboard } from '../lib/paste.js';

let seqKey = 0;
const newKey = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `k${Date.now()}${++seqKey}`);
const toRow = (r, status = 'clean') => ({ _key: r.id || newKey(), id: r.id || null, data: { ...r }, status, errors: {} });
const CUSTOM = '__custom__';
const isEmpty = v => v == null || String(v).trim() === '';

function validateCell(col, value, data, t) {
  if (col.required && isEmpty(value)) return t('mre.required', { field: col.label });
  if (col.type === 'number' && !isEmpty(value) && Number.isNaN(Number(value))) return t('mre.number');
  if (col.type === 'number' && !isEmpty(value) && col.min != null && Number(value) < col.min) return t('mre.min', { min: col.min });
  if (col.type === 'number' && !isEmpty(value) && col.max != null && Number(value) > col.max) return t('mre.max', { max: col.max });
  if (col.type === 'date' && !isEmpty(value) && Number.isNaN(Date.parse(value))) return t('mre.date');
  if (col.type === 'select' && !col.custom && !isEmpty(value) && col.options && !col.options.some(o => String(o.value ?? o) === String(value))) return t('mre.notInList');
  return col.validate ? col.validate(value, data) || null : null;
}

export function InlineTable({ id, columns, rows: initial, onSaveRow, onDeleteRow, newRow, countLabel, readOnly, readOnlyReason, carry, caption, context, emptyText, bulkSet = true, search, newInEditor = false, rowTitle, pasteTarget, onPasted }) {
  const { t } = useI18n(); const { toast, prefs, queuePrefs } = useSession();
  const [rows, setRows] = useState(() => (initial || []).map(r => toRow(r)));
  const rowsRef = useRef(rows); rowsRef.current = rows;
  // Handlers from the parent are read through refs, so a parent re-render never re-renders every row (NFR-DA-PERF-13).
  const saveRowRef = useRef(onSaveRow); saveRowRef.current = onSaveRow; const deleteRowRef = useRef(onDeleteRow); deleteRowRef.current = onDeleteRow;
  const timers = useRef({}); const pendingDeletes = useRef({}); const tableRef = useRef(null); const editStart = useRef({});
  const [touched, setTouched] = useState({}); // cells validated once: re-validated on change after a first error (FR-DA-MRE-08)
  const [editorKey, setEditorKey] = useState(null); // Row Editor (FR-DA-DEU-03)
  const [sel, setSel] = useState(() => new Set()); const [q, setQ] = useState(''); const [bulk, setBulk] = useState(null); const [flash, setFlash] = useState(null);
  const density = prefs?.density || 'comfortable';
  const tp = prefs?.tables?.[id] || {}; const [widths, setWidths] = useState(tp.widths || {});
  const hidden = useMemo(() => new Set(tp.hidden || []), [tp.hidden]);
  const visible = useMemo(() => columns.filter(c => !hidden.has(c.key)), [columns, hidden]);

  // Server data is merged only for rows the user is not editing (the Active Draft wins — C21, NFR-DA-FOC-10).
  useEffect(() => { setRows(cur => { const byId = Object.fromEntries(cur.filter(r => r.id).map(r => [r.id, r])); const incoming = (initial || []).map(r => (byId[r.id] && byId[r.id].status !== 'clean' ? byId[r.id] : byId[r.id] ? { ...byId[r.id], data: { ...r } } : toRow(r))); const local = cur.filter(r => !r.id); return [...incoming, ...local]; }); }, [initial]);

  const setRow = useCallback((key, fn) => setRows(rs => rs.map(r => (r._key === key ? fn(r) : r))), []);
  const validateRow = useCallback(r => { const errors = {}; for (const c of columns) { const e = validateCell(c, r.data[c.key], r.data, t); if (e) errors[c.key] = e; } return errors; }, [columns, t]);

  const save = useCallback(async key => {
    clearTimeout(timers.current[key]); const r = rowsRef.current.find(x => x._key === key); if (!r || r.status === 'clean' || r.status === 'saving' || r.status === 'saved') return;
    const errors = validateRow(r);
    if (Object.keys(errors).length) { setRow(key, x => ({ ...x, errors, status: 'error' })); setTouched(tc => ({ ...tc, ...Object.fromEntries(Object.keys(errors).map(c => [key + '|' + c, true])) })); return; }
    setRow(key, x => ({ ...x, status: 'saving', errors: {} }));
    try {
      const saved = await saveRowRef.current(r.data, r.id);
      // The typed values are kept: only the identifier and server-computed fields are taken from the answer (C17).
      setRow(key, x => ({ ...x, id: saved?.id || x.id, data: { ...x.data, id: saved?.id || x.id }, status: x.status === 'saving' ? 'saved' : x.status }));
      setFlash(key); setTimeout(() => setFlash(f => (f === key ? null : f)), 400);
    } catch (e) { setRow(key, x => ({ ...x, status: 'error', errors: { _row: e.message } })); toast(e.message || t('err.server'), 'error'); }
  }, [setRow, toast, t, validateRow]);
  const schedule = useCallback(key => { clearTimeout(timers.current[key]); timers.current[key] = setTimeout(() => save(key), 500); }, [save]);
  const saveAll = useCallback(() => { for (const r of rowsRef.current) if (r.status === 'dirty' || r.status === 'error') save(r._key); }, [save]);
  const pendingCount = rows.filter(r => r.status === 'dirty' || r.status === 'error' || r.status === 'saving').length;

  const saveNow = () => { if (!pendingCount) { toast(t('mre.allSaved'), 'ok'); return; } saveAll(); };
  // Leaving the Full-Screen Entry Workspace: pending rows are saved, rows with errors stay pending (FR-DA-MRE-18).
  const beforeReturn = useCallback(() => { saveAll(); const errs = rowsRef.current.filter(r => r.status === 'error').length; if (errs) toast(t('mre.fullErrors', { n: errs }), 'warning'); }, [saveAll, toast, t]);

  // Warn before leaving a page with unsaved rows; flush pending deletes when the table goes away (FR-DA-MRE-09).
  useEffect(() => { const h = e => { if (rowsRef.current.some(r => r.status === 'dirty' || r.status === 'error')) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, []);
  useEffect(() => () => { for (const k of Object.keys(pendingDeletes.current)) { const d = pendingDeletes.current[k]; clearTimeout(d.timer); d.run(); } for (const r of rowsRef.current) if (r.status === 'dirty') onSaveRow?.(r.data, r.id)?.catch?.(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const change = useCallback((key, col, value) => {
    setRow(key, r => { const data = { ...r.data, [col.key]: value }; const errors = { ...r.errors }; if (touched[key + '|' + col.key]) { const e = validateCell(col, value, data, t); if (e) errors[col.key] = e; else delete errors[col.key]; } return { ...r, data, errors, status: 'dirty' }; });
  }, [setRow, touched, t]);
  const blurCell = useCallback((key, col) => {
    const r = rowsRef.current.find(x => x._key === key); if (!r) return; const e = validateCell(col, r.data[col.key], r.data, t);
    setTouched(tc => ({ ...tc, [key + '|' + col.key]: true }));
    setRow(key, x => { const errors = { ...x.errors }; if (e) errors[col.key] = e; else delete errors[col.key]; return { ...x, errors }; });
  }, [setRow, t]);
  const leaveRow = useCallback((key, e) => { const tr = e.currentTarget; if (e.relatedTarget && tr.contains(e.relatedTarget)) return; if (e.relatedTarget?.closest?.('.listbox')) return; const r = rowsRef.current.find(x => x._key === key); if (r && (r.status === 'dirty' || r.status === 'error')) schedule(key); }, [schedule]);

  const focusCell = (key, colKey) => requestAnimationFrame(() => tableRef.current?.querySelector(`[data-cell="${key}|${colKey}"]`)?.focus());
  const addRow = useCallback((after, focus = true, values) => {
    const prev = after ? rowsRef.current.find(r => r._key === after) : rowsRef.current[rowsRef.current.length - 1];
    const base = { ...Object.fromEntries(columns.filter(c => c.default != null).map(c => [c.key, c.default])), ...(newRow ? newRow() : {}) };
    // Carry-over of the categorizing value from the row above when the user leaves it unset (FR-DA-MRE-06).
    for (const c of columns) if ((c.carry || carry === c.key) && prev && isEmpty(base[c.key])) base[c.key] = prev.data[c.key];
    const row = { _key: newKey(), id: null, data: { ...base, ...(values || {}) }, status: values ? 'dirty' : 'clean', errors: {} };
    setRows(rs => { if (!after) return [...rs, row]; const i = rs.findIndex(r => r._key === after); const n = [...rs]; n.splice(i + 1, 0, row); return n; });
    if (focus) focusCell(row._key, visible[0]?.key);
    return row;
  }, [newRow, columns, carry, visible]);
  const duplicate = useCallback(key => { const r = rowsRef.current.find(x => x._key === key); if (!r) return; const { id: _drop, ...data } = r.data; const row = addRow(key, false, data); focusCell(row._key, visible.find(c => !c.readOnly)?.key); schedule(row._key); }, [addRow, schedule, visible]);
  const remove = useCallback(key => {
    const i = rowsRef.current.findIndex(x => x._key === key); const r = rowsRef.current[i]; if (!r) return;
    setRows(rs => rs.filter(x => x._key !== key));
    const run = () => { delete pendingDeletes.current[key]; if (r.id) deleteRowRef.current?.(r.id, r.data)?.catch?.(e => toast(e.message, 'error')); };
    const timer = setTimeout(run, 5000); pendingDeletes.current[key] = { timer, run };
    toast(t('mre.deleted'), 'info', { duration: 5000, action: { label: t('common.undo'), onClick: () => { clearTimeout(timer); delete pendingDeletes.current[key]; setRows(rs => { const n = [...rs]; n.splice(Math.min(i, n.length), 0, r); return n; }); } } });
  }, [t, toast]);

  // Keyboard map of Table 4.49-1
  const onKey = useCallback((e, key, col) => {
    const rs = rowsRef.current; const ri = rs.findIndex(r => r._key === key); const ci = visible.findIndex(c => c.key === col.key);
    const mod = e.ctrlKey || e.metaKey; const el = e.target; const multi = el.tagName === 'TEXTAREA';
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveAll(); return; }
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(key); return; }
    if (mod && e.key === 'Enter') { e.preventDefault(); blurCell(key, col); save(key); return; }
    // Esc cancels the cell edit; with nothing to cancel it is left to the workspace, which returns to the page (FR-DA-MRE-18).
    if (e.key === 'Escape' && el.tagName !== 'BUTTON') { const start = editStart.current[key + '|' + col.key]; const cur = rowsRef.current.find(r => r._key === key)?.data[col.key] ?? ''; if (start !== undefined && String(start) !== String(cur)) { e.preventDefault(); e.stopPropagation(); change(key, col, start); } return; }
    if (e.key === 'Enter' && !e.shiftKey && el.tagName !== 'BUTTON') {
      e.preventDefault(); blurCell(key, col);
      if (ri === rs.length - 1 && ci === visible.length - 1) { save(key); addRow(null); } else if (ri < rs.length - 1) focusCell(rs[ri + 1]._key, col.key); else { save(key); addRow(null); }
      return;
    }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !e.altKey) {
      if (multi) { const v = el.value; const atStart = el.selectionStart === 0 || !v.slice(0, el.selectionStart).includes('\n'); const atEnd = !v.slice(el.selectionEnd).includes('\n'); if ((e.key === 'ArrowUp' && !atStart) || (e.key === 'ArrowDown' && !atEnd)) return; }
      const n = ri + (e.key === 'ArrowDown' ? 1 : -1); if (n >= 0 && n < rs.length) { e.preventDefault(); focusCell(rs[n]._key, col.key); }
    }
  }, [visible, saveAll, duplicate, blurCell, save, change, addRow]);

  // Paste of complete records from Word, Excel, CSV or text, web pages (FR-DA-MRE-19 – 22): each copied row becomes
  // a record from the active cell; rows are added when the paste outnumbers the rows below. With a server target the
  // rows are saved as one audited, undoable operation; invalid rows stay in the table, marked, never discarded.
  const editableCols = useMemo(() => visible.filter(c => !c.readOnly), [visible]);
  const startIndex = at => { const i = rowsRef.current.findIndex(r => r._key === at?.row); return i < 0 ? rowsRef.current.length : i; };
  const pasteTargets = useCallback((n, at) => { const rs = rowsRef.current; const i = startIndex(at); let k = 0; for (let j = 0; j < n && i + j < rs.length; j++) { const r = rs[i + j]; if ((r.id || r.status !== 'clean') && columns.some(c => !isEmpty(r.data[c.key]) && r.data[c.key] !== c.default)) k++; } return k; }, [columns]);
  const applyPaste = useCallback(async ({ rows: built, mapping, format, at }) => {
    const snapshot = rowsRef.current; const i0 = startIndex(at);
    const defaults = Object.fromEntries(columns.filter(c => c.default != null).map(c => [c.key, c.default]));
    const plan = built.map((b, j) => { const tgt = snapshot[i0 + j]; return { tgt, data: { ...(tgt ? tgt.data : { ...defaults, ...(newRow ? newRow() : {}) }), ...b.data } }; });
    const strip = d => { const { id: _i, _origin, ...x } = d; return x; };
    if (pasteTarget) {
      const res = await post('/bulk-entry/apply', { target: pasteTarget, format, mapping, rows: plan.map(p => ({ id: p.tgt?.id || undefined, data: strip(p.data) })) });
      const rej = Object.fromEntries((res.rejected || []).map(r => [r.index, r.errors])); const ok = Object.fromEntries((res.saved || []).map(r => [r.index, r]));
      const next = [...snapshot]; const touch = {};
      plan.forEach((p, j) => {
        const errors = rej[j]; const sv = ok[j];
        const row = sv ? { _key: p.tgt?._key || newKey(), id: sv.id, data: { ...strip(p.data), ...strip(sv), id: sv.id }, status: 'saved', errors: {} }
          : { _key: p.tgt?._key || newKey(), id: p.tgt?.id || null, data: p.data, status: 'error', errors: errors || {} };
        if (errors) for (const c of Object.keys(errors)) touch[row._key + '|' + c] = true;
        if (p.tgt) next[next.findIndex(r => r._key === p.tgt._key)] = row; else next.push(row);
      });
      setRows(next); setTouched(tc => ({ ...tc, ...touch }));
      const bad = (res.rejected || []).length; const n = (res.created || []).length + (res.changed || []).length;
      toast(bad ? t('paste.appliedBad', { n, bad }) : t('paste.applied', { n }), bad ? 'warning' : 'ok', { duration: 10000, action: { label: t('common.undo'), onClick: async () => { try { await post(`/bulk-entry/${res.id}/undo`, {}); setRows(snapshot); toast(t('paste.undone'), 'info'); onPasted?.(); } catch (e) { toast(e.message, 'error'); } } } });
      onPasted?.();
      return;
    }
    // Local table: rows marked as changed and saved like typed rows; Undo restores the table and removes new rows.
    const next = [...snapshot]; const created = [];
    plan.forEach(p => { const errors = {}; for (const c of columns) { const e = validateCell(c, p.data[c.key], p.data, t); if (e && c.key in (built[0]?.data || {})) errors[c.key] = e; }
      const row = { _key: p.tgt?._key || newKey(), id: p.tgt?.id || null, data: p.data, status: 'dirty', errors };
      if (p.tgt) next[next.findIndex(r => r._key === p.tgt._key)] = row; else { next.push(row); created.push(row._key); } });
    setRows(next); for (const p of next) if (p.status === 'dirty') schedule(p._key);
    toast(t('paste.applied', { n: plan.length }), 'ok', { duration: 10000, action: { label: t('common.undo'), onClick: () => { for (const k of created) { const r = rowsRef.current.find(x => x._key === k); if (r?.id) onDeleteRow?.(r.id, r.data)?.catch?.(() => {}); } setRows(snapshot.map(r => ({ ...r, status: r.id ? 'dirty' : r.status }))); for (const r of snapshot) if (r.id) schedule(r._key); toast(t('paste.undone'), 'info'); } } });
  }, [columns, newRow, pasteTarget, onPasted, schedule, toast, t, onDeleteRow]);
  const validatePaste = useCallback((c, v, data) => validateCell(c, v, data, t), [t]);
  const paste = usePaste({ id, columns: visible, readOnly: readOnly ? (readOnlyReason || t('paste.readOnly')) : null, targets: pasteTargets, apply: applyPaste, validate: validatePaste });
  const pasteRef = useRef(paste); pasteRef.current = paste;
  const onPaste = useCallback((e, key, col) => { pasteRef.current.onPaste(e, { row: key, col: col.key }); }, []);
  const toggleSel = useCallback(k => setSel(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; }), []);
  // Copy out: the selected rows with their column titles, as TSV and an HTML table (FR-DA-MRE-23).
  const labelOf = (c, v) => (c.type === 'select' ? (c.options || []).find(o => String(o.value ?? o) === String(v))?.label ?? v : v);
  const copyRows = useCallback(async (e, keys) => {
    const list = rowsRef.current.filter(r => (keys || sel).has(r._key)); if (!list.length) return false;
    const ok = await writeClipboard(toClipboard(visible, list.map(r => Object.fromEntries(visible.map(c => [c.key, labelOf(c, r.data[c.key]) ?? ''])))), e);
    if (ok) toast(t('copy.done', { n: list.length }), 'ok'); return ok;
  }, [sel, visible, toast, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const onCopyTable = e => { const a = document.activeElement; const textSel = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.selectionStart !== a.selectionEnd; if (sel.size && !textSel && !String(window.getSelection?.() || '')) copyRows(e); };
  const onPasteTable = e => { if (e.target.closest?.('td.cell, .cell')) return; paste.onPaste(e, { row: null, col: editableCols[0]?.key }); };

  const resize = (e, key) => { e.preventDefault(); const th = e.currentTarget.parentElement; const x0 = e.clientX, w0 = th.getBoundingClientRect().width; const rtl = document.dir === 'rtl';
    const mv = ev => setWidths(ws => ({ ...ws, [key]: Math.max(80, Math.round(w0 + (rtl ? x0 - ev.clientX : ev.clientX - x0))) }));
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); setWidths(ws => { queuePrefs({ tables: { [id]: { ...tp, widths: ws } } }); return ws; }); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); };
  const toggleCol = key => { const h = new Set(hidden); h.has(key) ? h.delete(key) : h.add(key); queuePrefs({ tables: { [id]: { ...tp, hidden: [...h] } } }); };
  const [colMenu, setColMenu] = useState(false);
  useOverlay(() => setColMenu(false), colMenu); // Esc closes the menu before the workspace (FR-DA-MRE-18)

  const shown = useMemo(() => { if (!q) return rows; const s = q.toLowerCase(); return rows.filter(r => columns.some(c => String(r.data[c.key] ?? '').toLowerCase().includes(s))); }, [rows, q, columns]);
  const allSel = shown.length > 0 && shown.every(r => sel.has(r._key));
  const applyBulk = () => { if (!bulk) return; setRows(rs => rs.map(r => (sel.has(r._key) ? { ...r, data: { ...r.data, [bulk.key]: bulk.value }, status: 'dirty' } : r))); for (const k of sel) schedule(k); setBulk(null); };
  const deleteSelected = () => { if (!window.confirm(t('mre.confirmDelete', { n: sel.size }))) return; for (const k of sel) remove(k); setSel(new Set()); };
  const typedValues = useMemo(() => { const m = {}; for (const c of columns) if (c.type === 'select' && c.custom) m[c.key] = [...new Set(rows.map(r => r.data[c.key]).filter(v => !isEmpty(v) && !(c.options || []).some(o => String(o.value ?? o) === String(v))))]; return m; }, [rows, columns]);

  const addRowAction = () => { const r = addRow(null, !newInEditor); if (newInEditor) setEditorKey(r._key); };
  const status = pendingCount ? t('ws.unsaved', { n: pendingCount }) : rows.some(r => r.status === 'saving') ? t('ws.saving') : t('mre.allSavedShort');
  return (<EntryWorkspace id={id} title={caption} context={context} meta={<>{t('ws.records', { n: rows.length })}<span aria-live="polite"> · {status}</span></>} onBeforeClose={beforeReturn} className="dt itable-host"
    actions={!readOnly && <><Btn icon="Plus" onClick={addRowAction}>{t('mre.addRow')}</Btn><Btn kind="primary" icon="Save" onClick={saveNow}>{pendingCount ? t('mre.saveAll', { n: pendingCount }) : t('common.save')}</Btn></>}>
    {({ full, expand, records }) => <>
    <div className="dt-toolbar">
      {search !== false && rows.length > 8 && <Search value={q} onChange={setQ} placeholder={t('common.search')} />}
      {!readOnly && <Btn size="sm" icon="CopyPlus" disabled={!rows.length} onClick={() => duplicate(rows[rows.length - 1]._key)}>{t('mre.duplicatePrevious')}</Btn>}
      <span className="spacer" />
      {!readOnly && pendingCount > 0 && !full && <Btn size="sm" kind="primary" icon="Save" onClick={saveAll}>{t('mre.saveAll', { n: pendingCount })}</Btn>}
      {!readOnly && <Btn size="sm" kind="ghost" icon="ClipboardPaste" data-tip={t('paste.hint')} onClick={() => paste.openPaste({ row: null, col: editableCols[0]?.key })}>{t('paste.action')}</Btn>}
      <Btn size="sm" kind="ghost" icon="Copy" disabled={!sel.size} data-tip={t('copy.hint')} onClick={() => copyRows()}>{t('copy.action')}</Btn>
      {!readOnly && <div className="rel"><Btn icon="Columns3" size="sm" kind="ghost" aria-label={t('dt.columns')} aria-expanded={colMenu} onClick={() => setColMenu(m => !m)} />
        {colMenu && <div className="menu" role="dialog" aria-label={t('dt.columns')} onMouseLeave={() => setColMenu(false)}><div className="col-menu">{columns.map((c, i) => <label key={c.key}><input type="checkbox" disabled={i === 0} checked={i === 0 || !hidden.has(c.key)} onChange={() => toggleCol(c.key)} />{c.label}</label>)}</div></div>}</div>}
      {expand}
    </div>
    <div {...records} className={`table-wrap ${full ? 'ws-records' : 'auto-h'}`} onCopy={onCopyTable} onPaste={onPasteTable}><table className={`tbl itable ${density === 'compact' ? 'compact' : ''}`} ref={tableRef}>{caption && <caption className="sr-only">{caption}</caption>}
      <thead><tr>
        {!readOnly && <th className="sel-col sticky-col" scope="col"><input type="checkbox" aria-label={t('dt.selectAll')} checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(shown.map(r => r._key)))} /></th>}
        <th className="status-col" scope="col"><span className="sr-only">{t('mre.status')}</span>#</th>
        {visible.map(c => <th key={c.key} scope="col" style={widths[c.key] || c.width ? { width: widths[c.key] || c.width, minWidth: widths[c.key] || c.width } : undefined}><div className="th"><span className="th-label">{c.required && '* '}{c.label}</span></div>
          <span className="col-resize" role="separator" aria-orientation="vertical" aria-label={t('dt.resizeCol', { c: c.label })} tabIndex={-1} onPointerDown={e => resize(e, c.key)} /></th>)}
        <th scope="col" className="row-actions"><span className="sr-only">{t('mre.actions')}</span></th></tr></thead>
      <tbody>{shown.map((r, i) => <EditRow key={r._key} row={r} index={i} columns={visible} readOnly={readOnly} selected={sel.has(r._key)} flash={flash === r._key} typedValues={typedValues}
        onSelect={toggleSel} onChange={change} onBlurCell={blurCell} onLeave={leaveRow} onKey={onKey} onPaste={onPaste} onDuplicate={duplicate} onDelete={remove} onOpen={setEditorKey} editStart={editStart} t={t} />)}
        {!rows.length && <tr><td colSpan={visible.length + 3}><div className="empty" style={{ padding: 'var(--aiv-space-5)' }}><p>{emptyText || t('mre.empty')}</p></div></td></tr>}</tbody></table></div>
    <div className="itable-foot">{!readOnly ? <Btn icon="Plus" onClick={() => { const r = addRow(null, !newInEditor); if (newInEditor) setEditorKey(r._key); }}>{t('mre.addRow')}</Btn> : <span />}
      <span className="itable-count" aria-live="polite">{countLabel ? countLabel(rows.filter(r => r.id || r.status !== 'clean').length) : t('mre.count', { n: rows.length })}{pendingCount ? ' · ' + t('mre.pending', { n: pendingCount }) : ''}</span></div>
    {editorKey && (() => { const i = rows.findIndex(r => r._key === editorKey); const r = rows[i]; if (!r) return null;
      const close = () => { if (r.status === 'dirty') schedule(r._key); setEditorKey(null); };
      const go = d => { if (r.status === 'dirty') schedule(r._key); const n = rows[i + d]; if (n) setEditorKey(n._key); };
      return <RowEditor row={r} index={i} total={rows.length} columns={columns} readOnly={readOnly} title={rowTitle ? rowTitle(r.data) : null} typedValues={typedValues} onChange={change} onBlurCell={blurCell} onPrev={() => go(-1)} onNext={() => go(1)} onClose={close} t={t} />; })()}
    {paste.ui}
    </>}
  </EntryWorkspace>);
}

/**
 * Row Editor (FR-DA-DEU-03, -06): one large field per column, previous and next row, and Back to the table. The
 * editor edits the table's own draft of the row, so closing it never loses the input; the row is saved like any
 * other edit once the user leaves it.
 */
function RowEditor({ row, index, total, columns, readOnly, title, typedValues, onChange, onBlurCell, onPrev, onNext, onClose, t }) {
  const errs = row.errors || {};
  return (<Drawer size="lg" title={title || t('mre.rowN', { n: index + 1, total })} subtitle={t('mre.rowN', { n: index + 1, total }) + (row.status === 'dirty' ? ' · ' + t('mre.st.dirty') : row.status === 'saved' ? ' · ' + t('mre.st.saved') : '')} onClose={onClose}
    footer={<><Btn icon="ArrowLeft" onClick={onClose}>{t('mre.backToTable')}</Btn><span className="spacer" /><Btn icon="ChevronLeft" disabled={index === 0} onClick={onPrev}>{t('mre.prevRow')}</Btn><Btn icon="ChevronRight" disabled={index >= total - 1} onClick={onNext}>{t('mre.nextRow')}</Btn></>}>
    <div className="stack">{columns.map(c => { const v = row.data[c.key]; const fid = `re-${row._key}-${c.key}`;
      return <Field key={c.key} id={fid} label={c.label} required={c.required} error={errs[c.key]} hint={c.help}>
        {readOnly || c.readOnly ? <div className="ro-value">{c.type === 'select' ? ((c.options || []).find(o => String(o.value ?? o) === String(v))?.label ?? v ?? '—') : (v == null || v === '' ? '—' : String(v))}</div>
          : c.type === 'select' ? <ChoiceField id={fid} col={c} value={v} typed={typedValues[c.key]} onChange={x => onChange(row._key, c, x)} onCommit={() => onBlurCell(row._key, c)} t={t} />
          : c.type === 'textarea' || c.wide ? <textarea id={fid} className="input" rows={6} value={v ?? ''} onChange={e => onChange(row._key, c, e.target.value)} onBlur={() => onBlurCell(row._key, c)} />
          : <input id={fid} className="input" type={c.type === 'number' ? 'text' : c.type === 'date' ? 'date' : 'text'} inputMode={c.type === 'number' ? 'decimal' : undefined} value={v ?? ''} onChange={e => onChange(row._key, c, e.target.value)} onBlur={() => onBlurCell(row._key, c)} />}
      </Field>; })}</div>
  </Drawer>);
}

/** Controlled List with a Custom value that opens a free text field; values typed before are offered again (FR-DA-DEU-02). */
export function ChoiceField({ id, col, value, typed, onChange, onCommit, t, invalid }) {
  const known = v => (col.options || []).some(o => String(o.value ?? o) === String(v)) || (typed || []).includes(v);
  const [custom, setCustom] = useState(() => col.custom && value != null && value !== '' && !known(value));
  if (custom) return <div className="row"><input id={id} className="input" value={value ?? ''} aria-invalid={invalid || undefined} placeholder={t('mre.customPlaceholder')} onChange={e => onChange(e.target.value)} onBlur={onCommit} style={{ flex: 1 }} /><Btn size="sm" kind="ghost" icon="List" aria-label={t('mre.backToList')} data-tip={t('mre.backToList')} onClick={() => { setCustom(false); onChange(''); }} /></div>;
  const opts = [...(col.options || []).map(o => (typeof o === 'object' ? { value: String(o.value), label: o.label } : { value: String(o), label: String(o) })), ...(typed || []).map(x => ({ value: String(x), label: String(x), group: t('mre.typedBefore') })), ...(col.custom ? [{ value: CUSTOM, label: t('mre.custom') }] : [])];
  return <Select id={id} value={value ?? ''} options={opts} invalid={invalid} placeholder={col.placeholder || t('select.placeholder')} onChange={e => { if (e.target.value === CUSTOM) { setCustom(true); onChange(''); requestAnimationFrame(() => document.getElementById(id)?.focus()); } else { onChange(e.target.value); onCommit?.(); } }} />;
}

function BulkValue({ col, value, onChange }) {
  const { t } = useI18n(); if (!col) return null;
  if (col.type === 'select') return <Select size="sm" aria-label={col.label} value={value} onChange={e => onChange(e.target.value)} options={(col.options || []).map(o => (typeof o === 'object' ? o : { value: o, label: o }))} placeholder={t('mre.value')} />;
  return <input className="input sm" aria-label={col.label} value={value} onChange={e => onChange(e.target.value)} placeholder={t('mre.value')} style={{ width: 200 }} />;
}

// Row component at module scope with a stable key: typing never remounts the row or its cells (C1, C2, C4).
const EditRow = memo(function EditRow({ row, columns, readOnly, selected, flash, typedValues, onSelect, onChange, onBlurCell, onLeave, onKey, onPaste, onDuplicate, onDelete, onOpen, editStart, t, index }) {
  const st = row.status; const hasErr = Object.keys(row.errors).length > 0;
  return (<tr aria-selected={selected || undefined} className={flash ? 'saved-flash' : ''} onBlur={e => onLeave(row._key, e)}>
    {!readOnly && <td className="sel-col sticky-col"><input type="checkbox" aria-label={t('dt.selectRow')} checked={selected} onChange={() => onSelect(row._key)} /></td>}
    <td className="status-col"><span className="row-status" aria-label={t('mre.st.' + (hasErr ? 'error' : st))}>
      {hasErr || st === 'error' ? <Icon name="CircleAlert" size={16} className="err-ico" /> : st === 'dirty' ? <span className="dirty-dot" /> : st === 'saving' ? <Spinner /> : st === 'saved' ? <Icon name="CircleCheck" size={16} className="saved-ico" /> : <span>{index + 1}</span>}</span></td>
    {columns.map(c => <Cell key={c.key} rowKey={row._key} col={c} value={row.data[c.key]} data={row.data} error={row.errors[c.key]} readOnly={readOnly || c.readOnly} typed={typedValues[c.key]} onChange={onChange} onBlurCell={onBlurCell} onKey={onKey} onPaste={onPaste} editStart={editStart} t={t} />)}
    <td className="row-actions"><div className="acts"><Btn icon="Maximize2" kind="ghost" size="sm" aria-label={t('mre.openRow')} data-tip={t('mre.openRow')} onClick={() => onOpen(row._key)} />{!readOnly && <><Btn icon="Copy" kind="ghost" size="sm" aria-label={t('mre.duplicate')} onClick={() => onDuplicate(row._key)} /><Btn icon="Trash2" kind="ghost" size="sm" aria-label={t('mre.delete')} onClick={() => onDelete(row._key)} /></>}</div></td>
  </tr>);
});

const Cell = memo(function Cell({ rowKey, col, value, data, error, readOnly, typed, onChange, onBlurCell, onKey, onPaste, editStart, t }) {
  const cellId = `${rowKey}|${col.key}`;
  // A custom value switches the cell to a text field only after the choice is committed, never while typing (C7).
  const [customMode, setCustomMode] = useState(() => col.type === 'select' && col.custom && value != null && value !== '' && !(col.options || []).some(o => String(o.value ?? o) === String(value)) && !(typed || []).includes(value));
  const v = value == null ? '' : String(value); // controlled with a primitive, never undefined (C6, C22)
  const common = { 'data-cell': cellId, 'aria-label': col.label, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? cellId + '-e' : undefined,
    onFocus: () => { editStart.current[cellId] = value ?? ''; }, onBlur: () => onBlurCell(rowKey, col), onKeyDown: e => onKey(e, rowKey, col), onPaste: e => onPaste(e, rowKey, col) };
  if (readOnly) return <td className="cell"><span className="small">{col.render ? col.render(value, data) : v || '—'}</span></td>;
  let control;
  if (col.type === 'select' && !customMode) {
    const opts = [...(col.options || []).map(o => (typeof o === 'object' ? { value: String(o.value), label: o.label } : { value: String(o), label: String(o) })), ...(typed || []).map(x => ({ value: String(x), label: String(x), group: t('mre.typedBefore') })), ...(col.custom ? [{ value: CUSTOM, label: t('mre.custom') }] : [])];
    control = <Select {...common} arrowOpens={false} size="md" value={v} options={opts} placeholder={col.placeholder || t('select.placeholder')} invalid={!!error} onChange={e => { if (e.target.value === CUSTOM) { setCustomMode(true); onChange(rowKey, col, ''); requestAnimationFrame(() => document.querySelector(`[data-cell="${cellId}"]`)?.focus()); } else onChange(rowKey, col, e.target.value); }} />;
  } else if (col.type === 'textarea') control = <textarea {...common} className="input" rows={col.rows || 2} value={v} placeholder={col.placeholder} onChange={e => onChange(rowKey, col, e.target.value)} />;
  else control = <input {...common} className="input md" type={col.type === 'number' ? 'text' : col.type === 'date' ? 'date' : 'text'} inputMode={col.type === 'number' ? 'decimal' : undefined} value={v} placeholder={col.placeholder} onChange={e => onChange(rowKey, col, e.target.value)} />;
  return <td className={`cell ${error ? 'invalid' : ''}`}>{control}{error && <span className="field-error" id={cellId + '-e'} role="status"><Icon name="CircleAlert" size={12} />{error}</span>}</td>;
});
