// Bulk-entry grid of a Multi-Entry (SRS 4.49 FR-DA-MRE-01 – 23, NFR-DA-REL-10, NFR-DA-FOC-01 – 13), shown on the page and,
// as the same instance, full screen (FR-DA-MRE-15 – 18). Toolbar: Add row, Duplicate and Delete selected, Import,
// Export, Paste, Copy, search, filter chips, "only rows with errors", wrap, density, columns, pager and full
// screen. Grid: ARIA grid with sticky header and first column, three-step sort, reorder and resize of columns,
// virtual rows (uniform row height when text does not wrap) or pages. Footer: totals, counts and the save state.
// Saving, drafts, undo, retries and batching are in useBulkRows; the import workflow in ImportWizard.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n.jsx';
import { useSession } from '../../lib/session.jsx';
import { post, api, get } from '../../lib/api.js';
import { Btn, Icon, Select, Spinner, Search, Seg, useOverlay, Skeleton } from '../ui.jsx';
import { EntryWorkspace } from '../EntryWorkspace.jsx';
import { usePaste } from '../PastePreview.jsx';
import { FilterPopover, matches } from '../DataTable.jsx';
import { toClipboard, writeClipboard } from '../../lib/paste.js';
import { validateCell, isEmpty } from '../../lib/bulk/validate.js';
import { runBatches } from '../../lib/bulk/batch.js';
import { toCSV, table as exportTable, exportName } from '../../lib/bulk/exporter.js';
import { useNavGuard } from '../../lib/navguard.jsx';
import { useBulkRows, newKey } from './useBulkRows.js';
import { EditRow, HeaderCell, useVirtualRows } from './GridParts.jsx';
import { RowEditor, BulkValue } from './RowEditor.jsx';
import { ConfirmDelete, ConfirmDiscard, ConflictDialog, ProgressPanel, Banner } from './GridDialogs.jsx';
import { ImportWizard } from './ImportWizard.jsx';
import { MobileList, useNarrow } from './MobileList.jsx';

const VIRTUAL_FROM = 40;
const textOf = (c, v) => (v == null ? '' : typeof v === 'object' ? v.en ?? '' : c.type === 'select' ? (c.options || []).find(o => String(o.value ?? o) === String(v))?.label ?? String(v) : String(v));

export function BulkGrid({ id, columns, rows: initial, onSaveRow, onDeleteRow, newRow, countLabel, readOnly, readOnlyReason, carry, caption, context, emptyText, bulkSet = true, search, newInEditor = false, rowTitle, pasteTarget, onPasted, emptyActions, toolbarExtra, parent, loading }) {
  const { t, lang, fmtDateTime } = useI18n(); const { toast, prefs, queuePrefs, me } = useSession();
  const [said, setSaid] = useState(''); const announce = useCallback(m => { setSaid(''); setTimeout(() => setSaid(m), 30); }, []);
  const [limits, setLimits] = useState(null); useEffect(() => { get('/bulk-entry/limits').then(setLimits).catch(() => {}); }, []);
  const uid = me?.user?.id || me?.id; const draftId = uid ? `${id}|${pasteTarget ? `${pasteTarget.kind}:${pasteTarget.task || pasteTarget.entity}:${pasteTarget.step || pasteTarget.project || ''}` : context || ''}|${uid}` : null;
  const B = useBulkRows({ id, draftId, initial, columns, t, toast, announce, onSaveRow, onDeleteRow, pasteTarget, batchSize: limits?.batch || 250 });
  const { rows, rowsRef, counts } = B;
  useNavGuard(draftId || id, () => ({ pending: () => ({ n: B.counts.pending, errors: B.counts.errors }), save: () => B.saveAll(), discard: () => B.discardAll(), label: caption }));

  // ---- view preferences kept per user and table: order, hidden, widths, wrap, pager, page size (FR-DA-MRE-11, -13)
  const density = prefs?.density || 'comfortable'; const tp = prefs?.tables?.[id] || {}; const [widths, setWidths] = useState(tp.widths || {});
  const savePref = patch => queuePrefs({ tables: { [id]: { ...(prefs?.tables?.[id] || {}), widths, ...patch } } });
  const ordered = useMemo(() => { const order = tp.order?.length ? tp.order : columns.map(c => c.key); const byKey = Object.fromEntries(columns.map(c => [c.key, c])); const list = [...order.map(k => byKey[k]).filter(Boolean), ...columns.filter(c => !order.includes(c.key))]; return [columns[0], ...list.filter(c => c.key !== columns[0]?.key)].filter(Boolean); }, [columns, tp.order]);
  // Low-priority columns (optional long text) are kept for the row form when there are many columns (Fiori pop-in).
  const autoHidden = useMemo(() => (columns.length > 6 ? columns.filter((c, i) => i > 0 && !c.required && (c.type === 'textarea' || c.wide)).map(c => c.key) : []), [columns]);
  const hidden = useMemo(() => new Set(tp.hidden || autoHidden), [tp.hidden, autoHidden]);
  const visible = useMemo(() => ordered.filter((c, i) => i === 0 || !hidden.has(c.key)), [ordered, hidden]);
  const [wrap, setWrap] = useState(!!tp.wrap); const [pager, setPager] = useState(!!tp.pager); const [size, setSize] = useState(tp.size || 50); const [page, setPage] = useState(0);
  const [q, setQ] = useState(''); const [filters, setFilters] = useState([]); const [adding, setAdding] = useState(null); const [errorsOnly, setErrorsOnly] = useState(false); const [sort, setSort] = useState(tp.sort || null);
  const [sel, setSel] = useState(() => new Set()); const anchor = useRef(null); const [bulk, setBulk] = useState(null);
  const [editorKey, setEditorKey] = useState(null); const [menu, setMenu] = useState(null); const [confirm, setConfirm] = useState(null); const [showConflicts, setShowConflicts] = useState(false); const [importing, setImporting] = useState(false);
  const [dragKey, setDragKey] = useState(null); const narrow = useNarrow(); const tableRef = useRef(null); const recordsEl = useRef(null);
  useOverlay(() => setMenu(null), !!menu);

  // ---- rows on screen: search, filter chips, errors only, sort; then a page or a virtual window
  const fcols = useMemo(() => visible.map(c => ({ ...c, text: x => textOf(c, x.data[c.key]) })), [visible]);
  const shown = useMemo(() => {
    let r = rows;
    if (q) { const s = q.toLowerCase(); r = r.filter(x => columns.some(c => textOf(c, x.data[c.key]).toLowerCase().includes(s))); }
    for (const f of filters) { const c = fcols.find(x => x.key === f.key); if (c) r = r.filter(x => matches(f, c, x)); }
    if (errorsOnly) r = r.filter(x => x.status === 'error' || x.status === 'queued' || Object.keys(x.errors).length);
    // Sort: saved rows are ordered; rows not saved yet stay at the end, in the order they were added (no jump while typing).
    if (sort) { const c = columns.find(x => x.key === sort.key); const fresh = r.filter(x => !x.id); if (c) r = [...r.filter(x => x.id)].sort((a, b) => { const A = c.type === 'number' ? Number(a.data[c.key]) || 0 : textOf(c, a.data[c.key]); const B2 = c.type === 'number' ? Number(b.data[c.key]) || 0 : textOf(c, b.data[c.key]); return sort.dir * (typeof A === 'number' ? A - B2 : String(A).localeCompare(String(B2), lang, { numeric: true })); }).concat(fresh); }
    return r;
  }, [rows, q, filters, errorsOnly, sort, columns, fcols, lang]);
  const pages = pager ? Math.max(1, Math.ceil(shown.length / size)) : 1; const cur = Math.min(page, pages - 1);
  const paged = pager ? shown.slice(cur * size, cur * size + size) : shown;
  const scrollEl = useCallback(() => recordsEl.current, []);
  const V = useVirtualRows({ enabled: !pager && !wrap && paged.length > VIRTUAL_FROM, count: paged.length, scrollEl });
  const windowRows = paged.slice(V.start, V.end);
  const shownRef = useRef(shown); shownRef.current = shown;

  // ---- focus: the target row is scrolled into the window or its page first (virtual rows)
  const viewRef = useRef({}); viewRef.current = { pager, size, cur, V };
  const focusCell = useCallback((key, colKey) => {
    let n = 0; let moved = false;
    const go = () => {
      const el = tableRef.current?.querySelector(`[data-cell="${key}|${colKey}"]`);
      if (el) { el.focus(); el.scrollIntoView?.({ block: 'nearest' }); return; }
      const { pager: pg, size: sz, cur: cu, V: v } = viewRef.current; const i = shownRef.current.findIndex(r => r._key === key);
      if (i >= 0 && !moved) { moved = true; if (pg && Math.floor(i / sz) !== cu) setPage(Math.floor(i / sz)); else if (v.on) v.scrollTo(i); }
      if (n++ < 30) requestAnimationFrame(go);
    };
    requestAnimationFrame(go);
  }, []);

  // ---- adding, duplicating, inserting (recorded for Undo)
  const blank = useCallback(prev => { const base = { ...Object.fromEntries(columns.filter(c => c.default != null).map(c => [c.key, c.default])), ...(newRow ? newRow() : {}) }; for (const c of columns) if ((c.carry || carry === c.key) && prev && isEmpty(base[c.key])) base[c.key] = prev.data[c.key]; return base; }, [columns, newRow, carry]);
  const addRow = useCallback((after, focus = true, values, recordIt = true) => {
    const rs = rowsRef.current; const prev = after ? rs.find(r => r._key === after) : rs[rs.length - 1];
    const row = { _key: newKey(), id: null, data: { ...blank(prev), ...(values || {}) }, status: values ? 'dirty' : 'clean', errors: {} };
    const index = after ? rs.findIndex(r => r._key === after) + 1 : rs.length;
    B.setRows(x => { const n = [...x]; n.splice(index, 0, row); return n; });
    if (recordIt) B.record({ kind: 'add', rows: [{ row, index }] });
    if (focus) focusCell(row._key, visible[0]?.key); announce(t('mre.a.added'));
    return row;
  }, [blank, B, focusCell, visible, announce, t, rowsRef]);
  const duplicate = useCallback(keys => {
    const list = (Array.isArray(keys) ? keys : [keys]).map(k => rowsRef.current.find(r => r._key === k)).filter(Boolean); if (!list.length) return;
    const made = []; let next = [...rowsRef.current];
    for (const src of list) { const { id: _i, ...data } = src.data; const row = { _key: newKey(), id: null, data, status: 'dirty', errors: {} }; const index = next.findIndex(r => r._key === src._key) + 1; next.splice(index, 0, row); made.push({ row, index }); }
    B.setRows(next); B.record({ kind: 'add', rows: made }); for (const m of made) B.schedule(m.row._key);
    focusCell(made[0].row._key, visible.find(c => !c.readOnly)?.key); announce(t('mre.a.duplicated', { n: made.length }));
  }, [B, focusCell, visible, announce, t, rowsRef]);
  const removeRows = useCallback(keys => {
    const before = shown.findIndex(r => r._key === keys[0]); const e = B.remove(keys); if (!e) return;
    setSel(s => { const n = new Set(s); for (const k of keys) n.delete(k); return n; });
    toast(t('mre.deletedN', { n: keys.length }), 'info', { duration: 10000, action: { label: t('common.undo'), onClick: () => B.undo() } });
    const nextRow = shown.filter(r => !keys.includes(r._key))[Math.max(0, before - (before >= shown.length - keys.length ? 1 : 0))]; if (nextRow) focusCell(nextRow._key, visible[0]?.key);
  }, [B, shown, toast, t, focusCell, visible]);
  const fillDown = useCallback((key, col) => {
    const i = shown.findIndex(r => r._key === key); const above = shown[i - 1]; if (!above || col.readOnly) return;
    const r = shown[i]; const before = r.data[col.key]; const after = above.data[col.key];
    B.record({ kind: 'set', key, col: col.key, before, after }); B.setRow(key, x => ({ ...x, data: { ...x.data, [col.key]: after }, status: 'dirty' })); B.schedule(key);
    announce(t('mre.a.filled'));
  }, [shown, B, announce, t]);

  // ---- keyboard map (Table 4.49-1, completed with spreadsheet moves)
  const editing = (key, col, el) => (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.type !== 'checkbox' && String(B.editStart.current[key + '|' + col.key] ?? '') !== String(el.value ?? '');
  const onKey = useCallback((e, key, col) => {
    const list = shown; const ri = list.findIndex(r => r._key === key); const ci = visible.findIndex(c => c.key === col.key);
    const mod = e.ctrlKey || e.metaKey; const el = e.target; const k = e.key; const lower = k.toLowerCase(); const text = el.tagName === 'INPUT' && el.type !== 'checkbox' || el.tagName === 'TEXTAREA';
    const moveRow = d => { const n = Math.min(list.length - 1, Math.max(0, ri + d)); if (n !== ri) { e.preventDefault(); B.blurCell(key, col); focusCell(list[n]._key, col.key); } };
    if (mod && lower === 's') { e.preventDefault(); B.saveAll(); return; }
    if (mod && k === 'Enter') { e.preventDefault(); B.blurCell(key, col); B.save(key); return; }
    if (mod && !e.shiftKey && lower === 'd') { e.preventDefault(); if (!readOnly) duplicate(key); return; }
    if (mod && (k === "'" || (e.shiftKey && lower === 'd'))) { e.preventDefault(); if (!readOnly) fillDown(key, col); return; }
    if (mod && !e.shiftKey && lower === 'z' && !editing(key, col, el)) { e.preventDefault(); if (!B.undo()) announce(t('mre.a.nothingToUndo')); return; }
    if (mod && ((e.shiftKey && lower === 'z') || lower === 'y')) { e.preventDefault(); B.redo(); return; }
    if (mod && lower === 'a' && (!text || !el.value || (el.selectionStart === 0 && el.selectionEnd === String(el.value).length))) { e.preventDefault(); setSel(new Set(list.map(r => r._key))); announce(t('dt.selected', { n: list.length })); return; }
    if (k === 'Escape' && el.tagName !== 'BUTTON') { if (B.cancelEdit(key, col)) { e.preventDefault(); e.stopPropagation(); } return; }
    if (k === 'Enter' && !e.shiftKey && el.tagName !== 'BUTTON' && el.tagName !== 'TEXTAREA') {
      e.preventDefault(); B.blurCell(key, col);
      if (ri === list.length - 1) { B.save(key); if (!readOnly) addRow(null); } else focusCell(list[ri + 1]._key, col.key);
      return;
    }
    if ((k === 'ArrowDown' || k === 'ArrowUp') && !e.altKey) {
      if (el.tagName === 'TEXTAREA') { const v = el.value; const atStart = !v.slice(0, el.selectionStart).includes('\n'); const atEnd = !v.slice(el.selectionEnd).includes('\n'); if ((k === 'ArrowUp' && !atStart) || (k === 'ArrowDown' && !atEnd)) return; }
      moveRow(k === 'ArrowDown' ? 1 : -1); return;
    }
    if ((k === 'ArrowLeft' || k === 'ArrowRight') && !mod && !e.shiftKey) {
      const rtl = document.dir === 'rtl'; const fwd = (k === 'ArrowRight') !== rtl;
      const atEdge = !text || (fwd ? el.selectionEnd === String(el.value ?? '').length : el.selectionStart === 0);
      const nc = visible[ci + (fwd ? 1 : -1)]; if (atEdge && nc && el.type !== 'date') { e.preventDefault(); focusCell(key, nc.key); } return;
    }
    if (k === 'PageDown' || k === 'PageUp') { moveRow(k === 'PageDown' ? 10 : -10); return; }
    if ((k === 'Home' || k === 'End') && mod) { e.preventDefault(); focusCell(list[k === 'Home' ? 0 : list.length - 1]._key, col.key); return; }
    if ((k === 'Home' || k === 'End') && !text) { e.preventDefault(); focusCell(key, visible[k === 'Home' ? 0 : visible.length - 1].key); }
  }, [shown, visible, B, focusCell, duplicate, fillDown, addRow, readOnly, announce, t]);

  // ---- paste of records (FR-DA-MRE-19 – 22): saved as audited operations, in batches, undoable in one action
  const editableCols = useMemo(() => visible.filter(c => !c.readOnly), [visible]);
  const startIndex = at => { const i = rowsRef.current.findIndex(r => r._key === at?.row); return i < 0 ? rowsRef.current.length : i; };
  const pasteTargets = useCallback((n, at) => { const rs = rowsRef.current; const i = startIndex(at); let k = 0; for (let j = 0; j < n && i + j < rs.length; j++) { const r = rs[i + j]; if ((r.id || r.status !== 'clean') && columns.some(c => !isEmpty(r.data[c.key]) && r.data[c.key] !== c.default)) k++; } return k; }, [columns]); // eslint-disable-line react-hooks/exhaustive-deps
  const applyRows = useCallback(async ({ rows: built, mapping = [], format = 'text', at, label }) => {
    const snapshot = rowsRef.current; const i0 = at === 'end' ? snapshot.length : startIndex(at); const strip = d => { const { id: _i, _origin, ...x } = d; return x; };
    const plan = built.map((b, j) => { const tgt = at === 'end' ? null : snapshot[i0 + j]; return { tgt, data: { ...(tgt ? tgt.data : blank(snapshot[snapshot.length - 1])), ...b.data } }; });
    if (pasteTarget) {
      const next = [...snapshot]; const opIds = []; const ctl = new AbortController(); const batch = limits?.batch || 250; let ok = 0, bad = 0;
      const put1 = (p, row) => { if (p.tgt) next[next.findIndex(r => r._key === p.tgt._key)] = row; else next.push(row); };
      const res = await runBatches(plan, async (b, bi) => {
        const out = await post('/bulk-entry/apply', { target: pasteTarget, format, mapping, rows: b.map(p => ({ id: p.tgt?.id || undefined, data: strip(p.data) })) }); opIds.push(out.id);
        const rej = Object.fromEntries((out.rejected || []).map(r => [r.index, r.errors])); const sv = Object.fromEntries((out.saved || []).map(r => [r.index, r]));
        b.forEach((p, j) => { const s = sv[j]; if (s) ok++; else bad++; put1(p, s ? { _key: p.tgt?._key || newKey(), id: s.id, data: { ...strip(p.data), ...strip(s), id: s.id }, base: s._updated ?? null, status: 'saved', errors: {} } : { _key: p.tgt?._key || newKey(), id: p.tgt?.id || null, data: p.data, status: 'error', errors: rej[j] || {} }); });
        B.setRows([...next]); void bi; return out;
      }, { size: batch, signal: ctl.signal, onProgress: p => (plan.length > batch ? B.setProgress({ label: label || t('paste.action'), ...p, cancel: () => ctl.abort() }) : null) });
      for (const f of res.failed) for (const p of f.items) put1(p, { _key: p.tgt?._key || newKey(), id: p.tgt?.id || null, data: p.data, status: 'error', errors: { _row: f.error?.message || t('err.server') } });
      B.setRows([...next]); if (plan.length > batch) B.setProgress({ label: label || t('paste.action'), done: res.done, total: res.total, failed: res.failed.length, finished: true, cancelled: res.cancelled });
      const undoAll = async () => { try { for (const id of [...opIds].reverse()) await post(`/bulk-entry/${id}/undo`, {}); B.setRows(snapshot); toast(t('paste.undone'), 'info'); onPasted?.(); } catch (e) { toast(e.message, 'error'); } };
      B.record({ kind: 'paste', undo: undoAll });
      toast(bad ? t('paste.appliedBad', { n: ok, bad }) : t('paste.applied', { n: ok }), bad ? 'warning' : 'ok', { duration: 60000, action: { label: t('common.undo'), onClick: undoAll } });
      onPasted?.(); return { ok, bad, undo: undoAll };
    }
    // A table without a server target: rows are marked changed and saved like typed rows.
    const next = [...snapshot]; const made = [];
    plan.forEach(p => { const row = { _key: p.tgt?._key || newKey(), id: p.tgt?.id || null, data: p.data, status: 'dirty', errors: {} }; if (p.tgt) next[next.findIndex(r => r._key === p.tgt._key)] = row; else { next.push(row); made.push({ row, index: next.length - 1 }); } });
    B.setRows(next); B.record({ kind: 'add', rows: made }); for (const p of next) if (p.status === 'dirty') B.schedule(p._key);
    toast(t('paste.applied', { n: plan.length }), 'ok'); return { ok: plan.length, bad: 0, undo: () => B.undo() };
  }, [pasteTarget, limits, B, blank, toast, t, onPasted, rowsRef]); // eslint-disable-line react-hooks/exhaustive-deps
  const validatePaste = useCallback((c, v, data) => validateCell(c, v, data, t), [t]);
  const paste = usePaste({ id, columns: visible, readOnly: readOnly ? (readOnlyReason || t('paste.readOnly')) : null, targets: pasteTargets, apply: applyRows, validate: validatePaste });
  const pasteRef = useRef(paste); pasteRef.current = paste;

  // ---- handlers given to every row through one stable object (no re-render of every row on a change)
  const hRef = useRef({}); Object.assign(hRef.current, { change: B.change, blurCell: B.blurCell, focusStart: B.focusStart, onKey, onPaste: (e, key, col) => pasteRef.current.onPaste(e, { row: key, col: col.key }),
    leaveRow: (key, e) => { const tr = e.currentTarget; if (e.relatedTarget && (tr.contains(e.relatedTarget) || e.relatedTarget.closest?.('.listbox'))) return; const r = B.find(key); if (r && (r.status === 'dirty' || r.status === 'error')) B.schedule(key); } });
  const h = useMemo(() => ({ change: (...a) => hRef.current.change(...a), blurCell: (...a) => hRef.current.blurCell(...a), focusStart: (...a) => hRef.current.focusStart(...a), onKey: (...a) => hRef.current.onKey(...a), onPaste: (...a) => hRef.current.onPaste(...a), leaveRow: (...a) => hRef.current.leaveRow(...a) }), []);
  const onSelect = useCallback((k, e) => setSel(s => { const n = new Set(s); const list = shownRef.current; if (e?.shiftKey && anchor.current) { const a = list.findIndex(r => r._key === anchor.current), b = list.findIndex(r => r._key === k); if (a >= 0 && b >= 0) { for (let i = Math.min(a, b); i <= Math.max(a, b); i++) n.add(list[i]._key); return n; } } n.has(k) ? n.delete(k) : n.add(k); anchor.current = k; return n; }), []);
  const rowCb = useRef({}); Object.assign(rowCb.current, { retry: k => B.save(k), overwrite: k => B.overwrite(k), duplicate, insert: k => addRow(k, true), del: k => removeRows([k]), open: setEditorKey });
  const cb = useMemo(() => ({ retry: k => rowCb.current.retry(k), overwrite: k => rowCb.current.overwrite(k), duplicate: k => rowCb.current.duplicate(k), insert: k => rowCb.current.insert(k), del: k => rowCb.current.del(k), open: k => rowCb.current.open(k) }), []);

  // ---- copy, export (current view or selection), columns
  const labelRows = list => list.map(r => Object.fromEntries(visible.map(c => [c.key, textOf(c, r.data[c.key])])));
  const copyRows = async e => { const list = shown.filter(r => sel.has(r._key)); if (!list.length) return false; const ok = await writeClipboard(toClipboard(visible, labelRows(list)), e); if (ok) toast(t('copy.done', { n: list.length }), 'ok'); return ok; };
  const onCopyTable = e => { const a = document.activeElement; const textSel = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.selectionStart !== a.selectionEnd; if (sel.size && !textSel && !String(window.getSelection?.() || '')) copyRows(e); };
  const onPasteTable = e => { if (e.target.closest?.('td.cell, .cell')) return; paste.onPaste(e, { row: null, col: editableCols[0]?.key }); };
  const exportRows = only => (only && sel.size ? shown.filter(r => sel.has(r._key)) : shown).map(r => r.data);
  const parentName = parent?.name || caption || 'export';
  const doExport = async (fmt, only) => {
    setMenu(null); const data = exportRows(only); const cols = visible;
    if (fmt === 'csv') { const url = URL.createObjectURL(new Blob([toCSV(cols, data, t)], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = exportName(parentName, 'csv'); a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
    else { const tb = exportTable(cols, data, t); const res = await api('/bulk-entry/export', { method: 'POST', body: { name: exportName(parentName, 'xlsx'), sheet: caption, header: tb.header, rows: tb.rows }, raw: true }); const url = URL.createObjectURL(await res.blob()); const a = document.createElement('a'); a.href = url; a.download = exportName(parentName, 'xlsx'); a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
    toast(t('mre.exported', { n: data.length }), 'ok');
  };
  const resize = (e, key) => { e.preventDefault(); const th = e.currentTarget.parentElement; const x0 = e.clientX, w0 = th.getBoundingClientRect().width; const rtl = document.dir === 'rtl';
    const mv = ev => setWidths(ws => ({ ...ws, [key]: Math.max(80, Math.round(w0 + (rtl ? x0 - ev.clientX : ev.clientX - x0))) }));
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); setWidths(ws => { queuePrefs({ tables: { [id]: { ...tp, widths: ws } } }); return ws; }); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); };
  const reorder = to => { if (!dragKey || dragKey === to || to === columns[0]?.key) { setDragKey(null); return; } const keys = ordered.map(c => c.key); const from = keys.indexOf(dragKey); keys.splice(from, 1); keys.splice(keys.indexOf(to), 0, dragKey); savePref({ order: keys }); setDragKey(null); };
  const onSort = key => { const n = !sort || sort.key !== key ? { key, dir: 1 } : sort.dir === 1 ? { key, dir: -1 } : null; setSort(n); savePref({ sort: n }); };
  const toggleCol = key => { const hs = new Set([...hidden]); hs.has(key) ? hs.delete(key) : hs.add(key); savePref({ hidden: [...hs] }); };
  const applyBulk = () => { if (!bulk) return; const keys = [...sel]; const col = bulk.key; const entries = keys.map(k => ({ kind: 'set', key: k, col, before: B.find(k)?.data[col], after: bulk.value }));
    B.record({ kind: 'batch', entries }); B.setRows(rs => rs.map(r => (sel.has(r._key) ? { ...r, data: { ...r.data, [col]: bulk.value }, status: 'dirty' } : r))); setBulk(null);
    clearTimeout(bulkTimer.current); bulkTimer.current = setTimeout(() => B.saveMany(keys, { label: t('mre.setField') }), 2000); announce(t('mre.a.bulkSet', { n: keys.length })); };
  const bulkTimer = useRef(null);
  const typedValues = useMemo(() => { const m = {}; for (const c of columns) if (c.type === 'select' && c.custom) m[c.key] = [...new Set(rows.map(r => r.data[c.key]).filter(v => !isEmpty(v) && typeof v !== 'object' && !(c.options || []).some(o => String(o.value ?? o) === String(v))))]; return m; }, [rows, columns]);
  const issues = rows.flatMap((r, i) => Object.entries(r.errors).map(([c, m]) => ({ key: r._key, row: i + 1, col: c, label: c === '_row' ? t('mre.row') : columns.find(x => x.key === c)?.label || c, msg: m })));
  const goTo = it => { setMenu(null); if (it.col === '_row' || hidden.has(it.col)) { setEditorKey(it.key); return; } focusCell(it.key, it.col); };
  const addRowAction = () => { const r = addRow(null, !newInEditor && !narrow); if (newInEditor || narrow) setEditorKey(r._key); };
  const totals = visible.filter(c => c.type === 'number' && c.total !== false).map(c => ({ c, sum: shown.reduce((a, r) => a + (Number(r.data[c.key]) || 0), 0) })).filter(x => x.sum);
  const allSel = shown.length > 0 && shown.every(r => sel.has(r._key));
  const saveState = counts.saving ? <><Spinner /> {t('mre.st.saving')}</> : counts.errors ? <><Icon name="TriangleAlert" size={14} className="err-ico" /> {t('mre.nErrors', { n: counts.errors })}</> : counts.pending ? <><span className="dirty-dot" /> {t('mre.unsaved', { n: counts.pending })}</> : <><Icon name="CloudCheck" size={16} className="saved-ico" /> {t('mre.allSavedLong')}</>;
  const colOffset = readOnly ? 2 : 3;

  const body = ({ full, expand, records }) => <>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{said}</div>
    {readOnly && readOnlyReason && <Banner icon="Lock">{readOnlyReason}</Banner>}
    {B.draftInfo && <Banner icon="History" actions={<>{B.conflicts.length > 0 && <Btn size="sm" kind="primary" onClick={() => setShowConflicts(true)}>{t('mre.reviewConflicts', { n: B.conflicts.length })}</Btn>}<Btn size="sm" kind="ghost" onClick={() => setConfirm({ kind: 'discard' })}>{t('mre.discardDraft')}</Btn><Btn size="sm" kind="ghost" icon="X" aria-label={t('common.close')} onClick={B.dismissDraft} /></>}>{t('mre.draftRestored', { n: B.draftInfo.n, at: fmtDateTime(new Date(B.draftInfo.at).toISOString()) })}</Banner>}
    {(B.offline || counts.queued > 0) && <Banner icon="CloudOff" tone="warn">{t('mre.offline', { n: counts.queued || counts.pending })}</Banner>}
    <ProgressPanel p={B.progress} onClose={() => B.setProgress(null)} />
    {narrow && !full ? <MobileList rows={shown} columns={visible} readOnly={readOnly} title={rowTitle} onOpen={setEditorKey} onAdd={addRowAction} onImport={() => setImporting(true)} t={t} /> : <>
    <div className="dt-toolbar itable-toolbar" role="toolbar" aria-label={t('mre.toolbar')}>
      {!readOnly && <Btn size="sm" kind="primary" icon="Plus" onClick={addRowAction}>{t('mre.addRow')}</Btn>}
      {!readOnly && <Btn size="sm" kind="ghost" icon="CopyPlus" disabled={!sel.size && !rows.length} onClick={() => duplicate(sel.size ? shown.filter(r => sel.has(r._key)).map(r => r._key) : [rows[rows.length - 1]._key])}>{sel.size ? t('mre.duplicateSelected', { n: sel.size }) : t('mre.duplicatePrevious')}</Btn>}
      {!readOnly && sel.size > 0 && <Btn size="sm" kind="ghost" icon="Trash2" onClick={() => setConfirm({ kind: 'delete', keys: [...sel] })}>{t('mre.deleteSelected', { n: sel.size })}</Btn>}
      {search !== false && <Search value={q} onChange={setQ} placeholder={t('common.search')} />}
      <div className="rel"><Btn icon="ListFilter" size="sm" kind="ghost" aria-expanded={!!adding} onClick={() => setAdding(a => (a ? null : { key: visible[0].key, op: 'contains', value: '' }))}>{t('dt.filter')}{filters.length > 0 && <span className="count-badge">{filters.length}</span>}</Btn>
        {adding && <FilterPopover columns={fcols} draft={adding} setDraft={setAdding} onAdd={() => { setFilters(f => [...f, adding]); setAdding(null); }} onClose={() => setAdding(null)} />}</div>
      <Btn size="sm" kind={errorsOnly ? 'primary' : 'ghost'} icon="TriangleAlert" aria-pressed={errorsOnly} onClick={() => setErrorsOnly(v => !v)} disabled={!counts.errors && !errorsOnly}>{t('mre.errorsOnly')}{counts.errors > 0 && <span className="count-badge">{counts.errors}</span>}</Btn>
      {toolbarExtra}
      <span className="spacer" />
      {issues.length > 0 && <div className="rel"><Btn size="sm" kind="ghost" className="issues-btn" icon="CircleAlert" aria-expanded={menu === 'issues'} onClick={() => setMenu(m => (m === 'issues' ? null : 'issues'))}>{t('mre.issues', { n: issues.length })}</Btn>
        {menu === 'issues' && <div className="menu issues-menu" role="dialog" aria-label={t('mre.issuesTitle')}><div className="eyebrow">{t('mre.issuesTitle')}</div>
          <ul className="plain">{issues.slice(0, 50).map((it, k) => <li key={k}><button type="button" className="issue-item" onClick={() => goTo(it)}><span className="mono xs">#{it.row}</span> <span className="strong small">{it.label}</span><span className="xs">{it.msg}</span></button></li>)}</ul>
          {counts.errors > 0 && <Btn size="sm" icon="RotateCw" onClick={() => { setMenu(null); B.retryFailed(); }}>{t('mre.retryAll')}</Btn>}</div>}</div>}
      {!readOnly && <Btn size="sm" kind="ghost" icon="FileUp" onClick={() => setImporting(true)}>{t('imp.action')}</Btn>}
      <div className="rel"><Btn size="sm" kind="ghost" icon="Download" aria-haspopup="menu" aria-expanded={menu === 'export'} onClick={() => setMenu(m => (m === 'export' ? null : 'export'))}>{t('mre.export')}</Btn>
        {menu === 'export' && <div className="menu" role="menu" aria-label={t('mre.export')}>
          <button type="button" role="menuitem" onClick={() => doExport('csv')}><Icon name="FileText" size={16} />{t('mre.exportCsv', { n: shown.length })}</button>
          <button type="button" role="menuitem" onClick={() => doExport('xlsx')}><Icon name="Sheet" size={16} />{t('mre.exportXlsx', { n: shown.length })}</button>
          {sel.size > 0 && <><button type="button" role="menuitem" onClick={() => doExport('csv', true)}><Icon name="FileText" size={16} />{t('mre.exportSelCsv', { n: sel.size })}</button><button type="button" role="menuitem" onClick={() => doExport('xlsx', true)}><Icon name="Sheet" size={16} />{t('mre.exportSelXlsx', { n: sel.size })}</button></>}</div>}</div>
      {!readOnly && <Btn size="sm" kind="ghost" icon="ClipboardPaste" aria-label={t('paste.action')} data-tip={t('paste.hint')} onClick={() => paste.openPaste({ row: null, col: editableCols[0]?.key })} />}
      <Btn size="sm" kind="ghost" icon="Copy" aria-label={t('copy.action')} disabled={!sel.size} data-tip={t('copy.hint')} onClick={() => copyRows()} />
      <Btn size="sm" kind="ghost" icon="Undo2" aria-label={t('mre.undo')} data-tip={`${t('mre.undo')} (Ctrl+Z)`} disabled={!B.canUndo} onClick={() => B.undo()} />
      <Btn size="sm" kind="ghost" icon="Redo2" aria-label={t('mre.redo')} data-tip={`${t('mre.redo')} (Ctrl+Shift+Z)`} disabled={!B.canRedo} onClick={() => B.redo()} />
      <div className="rel"><Btn icon="Settings2" size="sm" kind="ghost" aria-label={t('mre.view')} data-tip={t('mre.view')} aria-expanded={menu === 'view'} onClick={() => setMenu(m => (m === 'view' ? null : 'view'))} />
        {menu === 'view' && <div className="menu" role="dialog" aria-label={t('mre.view')}><div className="col-menu">
          <div className="eyebrow">{t('dt.columns')}</div>
          {ordered.map((c, i) => <label key={c.key}><input type="checkbox" disabled={i === 0} checked={i === 0 || !hidden.has(c.key)} onChange={() => toggleCol(c.key)} />{c.label}</label>)}
          {hidden.size > 0 && <p className="xs muted">{t('mre.hiddenInForm')}</p>}
          <hr className="divider" />
          <label><input type="checkbox" checked={wrap} onChange={e => { setWrap(e.target.checked); savePref({ wrap: e.target.checked }); }} />{t('mre.wrap')}</label>
          <label><input type="checkbox" checked={pager} onChange={e => { setPager(e.target.checked); setPage(0); savePref({ pager: e.target.checked }); }} />{t('mre.pager')}</label>
          <p className="xs muted">{t('mre.pagerHint')}</p>
          <Seg size="sm" label={t('dt.density')} value={density} onChange={v => queuePrefs({ density: v })} options={[{ id: 'comfortable', label: t('dt.comfortable') }, { id: 'compact', label: t('dt.compact') }]} />
          <Btn size="sm" kind="ghost" icon="RotateCcw" onClick={() => savePref({ order: null, hidden: null, widths: {}, sort: null })}>{t('dt.resetView')}</Btn></div></div>}</div>
      {expand}
    </div>
    {filters.length > 0 && <div className="dt-filters">{filters.map((f, i) => { const c = visible.find(x => x.key === f.key); return <span key={i} className="filter-chip">{c?.label} · {t('dt.op.' + f.op)}{!['empty', 'notEmpty'].includes(f.op) && <> “{f.value}”</>}<button type="button" aria-label={t('dt.removeFilter')} onClick={() => setFilters(fs => fs.filter((_, k) => k !== i))}><Icon name="X" size={12} /></button></span>; })}<Btn size="sm" kind="ghost" onClick={() => setFilters([])}>{t('dt.clearAll')}</Btn></div>}
    {!readOnly && sel.size > 0 && <div className="bulk-bar" role="region" aria-label={t('dt.bulk')}><span>{t('dt.selected', { n: sel.size })}</span>
      {bulkSet && <><Select size="sm" aria-label={t('mre.setField')} value={bulk?.key || ''} placeholder={t('mre.setField')} onChange={e => setBulk({ key: e.target.value, value: '' })} options={columns.filter(c => !c.readOnly).map(c => ({ value: c.key, label: c.label }))} />
        {bulk && <BulkValue col={columns.find(c => c.key === bulk.key)} value={bulk.value} onChange={v => setBulk(b => ({ ...b, value: v }))} />}{bulk && <Btn size="sm" onClick={applyBulk}>{t('mre.apply')}</Btn>}</>}
      <Btn size="sm" icon="Copy" onClick={() => copyRows()}>{t('copy.action')}</Btn><Btn size="sm" kind="ghost" onClick={() => setSel(new Set())}>{t('dt.clearSelection')}</Btn></div>}
    <div {...records} ref={el => { records.ref.current = el; recordsEl.current = el; }} className={`table-wrap ${full ? 'ws-records' : V.on ? 'vgrid' : 'auto-h'}`} onCopy={onCopyTable} onPaste={onPasteTable}>
      <table role="grid" aria-rowcount={shown.length + 1} aria-colcount={visible.length + colOffset} aria-label={caption} aria-multiselectable={!readOnly || undefined} className={`tbl itable ${density === 'compact' ? 'compact' : ''} ${wrap ? 'wrap' : 'nowrap'}`} ref={tableRef}>{caption && <caption className="sr-only">{caption}</caption>}
        <thead><tr role="row" aria-rowindex={1}>
          {!readOnly && <th scope="col" role="columnheader" aria-colindex={1} className="sel-col sticky-col"><input type="checkbox" aria-label={t('dt.selectAll')} checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(shown.map(r => r._key)))} /></th>}
          <th scope="col" role="columnheader" aria-colindex={readOnly ? 1 : 2} className="status-col"><span className="sr-only">{t('mre.status')}</span>#</th>
          {visible.map((c, i) => <HeaderCell key={c.key} col={c} index={i + colOffset} width={widths[c.key] || c.width} sort={sort} onSort={onSort} onResize={resize} onDragStart={setDragKey} onDrop={reorder} dragOver={dragKey && dragKey !== c.key} t={t} />)}
          <th scope="col" role="columnheader" className="row-actions"><span className="sr-only">{t('mre.actions')}</span></th></tr></thead>
        <tbody>
          {V.padTop > 0 && <tr aria-hidden="true" className="v-pad"><td colSpan={visible.length + colOffset + 1} style={{ height: V.padTop }} /></tr>}
          {loading && !rows.length && [0, 1, 2, 3, 4].map(i => <tr key={'sk' + i} aria-hidden="true">{[...Array(visible.length + colOffset)].map((_, j) => <td key={j}><Skeleton /></td>)}<td /></tr>)}
          {windowRows.map((r, i) => { const index = V.start + i + (pager ? cur * size : 0); return <EditRow key={r._key} row={r} index={index} ariaIndex={index + 2} columns={visible} readOnly={readOnly} selected={sel.has(r._key)} flash={B.flash === r._key} wrap={wrap} typedValues={typedValues} h={h} measure={V.measure}
            onSelect={onSelect} onRetry={cb.retry} onOverwrite={cb.overwrite} onDuplicate={cb.duplicate} onInsert={cb.insert} onDelete={cb.del} onOpen={cb.open} t={t} />; })}
          {V.padBottom > 0 && <tr aria-hidden="true" className="v-pad"><td colSpan={visible.length + colOffset + 1} style={{ height: V.padBottom }} /></tr>}
          {!rows.length && !loading && <tr><td colSpan={visible.length + colOffset + 1}><div className="empty itable-empty"><Icon name="TableProperties" size={28} /><p className="strong">{emptyText || t('mre.empty')}</p>
            {!readOnly && <div className="row" style={{ justifyContent: 'center' }}><Btn kind="primary" icon="Plus" onClick={addRowAction}>{t('mre.addFirst')}</Btn><Btn icon="FileUp" onClick={() => setImporting(true)}>{t('imp.action')}</Btn><Btn icon="ClipboardPaste" onClick={() => paste.openPaste({ row: null, col: editableCols[0]?.key })}>{t('mre.pasteRows')}</Btn>{emptyActions}</div>}
            {!readOnly && <p className="xs muted">{t('mre.emptyHint')}</p>}</div></td></tr>}
          {rows.length > 0 && !shown.length && <tr><td colSpan={visible.length + colOffset + 1}><div className="empty itable-empty"><Icon name="SearchX" size={24} /><p className="small">{t('dt.noMatch')}</p><Btn size="sm" onClick={() => { setQ(''); setFilters([]); setErrorsOnly(false); }}>{t('dt.clearFilters')}</Btn></div></td></tr>}
        </tbody></table></div></>}
    <div className="itable-foot">
      {!readOnly && !narrow ? <Btn icon="Plus" onClick={addRowAction}>{t('mre.addRow')}</Btn> : <span />}
      <span className="itable-count" aria-live="polite">{countLabel ? countLabel(rows.filter(r => r.id || r.status !== 'clean').length) : t('mre.count', { n: rows.length })}{sel.size > 0 && ` · ${t('dt.selected', { n: sel.size })}`}{shown.length !== rows.length && ` · ${t('mre.shownN', { n: shown.length })}`}</span>
      {totals.map(x => <span key={x.c.key} className="xs foot-total"><span className="muted">Σ {x.c.label}</span> <span className="mono strong">{x.sum.toLocaleString(lang)}</span></span>)}
      {pager && <span className="row pager" style={{ gap: 4 }}><Btn size="sm" kind="ghost" icon="ChevronLeft" aria-label={t('dt.prev')} disabled={cur === 0} onClick={() => setPage(cur - 1)} /><span className="xs">{t('dt.page', { p: cur + 1, n: pages })}</span><Btn size="sm" kind="ghost" icon="ChevronRight" aria-label={t('dt.next')} disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} />
        <Select size="sm" aria-label={t('dt.pageSize')} value={String(size)} onChange={e => { setSize(Number(e.target.value)); setPage(0); savePref({ size: Number(e.target.value) }); }} options={['25', '50', '100', '250'].map(v => ({ value: v, label: v }))} /></span>}
      <span className="spacer" />
      {!readOnly && <span className={`save-state ${counts.pending ? 'pending' : ''} ${counts.errors ? 'has-errors' : ''}`} role="status" aria-live="polite">{saveState}</span>}
      {!readOnly && counts.errors > 0 && <Btn size="sm" kind="ghost" icon="RotateCw" onClick={B.retryFailed}>{t('mre.retryAll')}</Btn>}
      {!readOnly && counts.pending > 0 && <><Btn size="sm" kind="ghost" icon="Undo2" onClick={() => setConfirm({ kind: 'discard' })}>{t('mre.discard')}</Btn><Btn size="sm" kind="primary" icon="Save" onClick={B.saveAll}>{t('mre.saveAll', { n: counts.pending })}</Btn></>}</div>
    {editorKey && (() => { const list = narrow ? shown : rows; const i = list.findIndex(r => r._key === editorKey); const r = list[i]; if (!r) return null;
      const close = () => { if (r.status === 'dirty') B.schedule(r._key); setEditorKey(null); };
      const go = d => { if (r.status === 'dirty') B.schedule(r._key); const n = list[i + d]; if (n) setEditorKey(n._key); };
      const addNew = () => { if (r.status === 'dirty') B.schedule(r._key); const n = addRow(null, false); setEditorKey(n._key); };
      return <RowEditor row={r} index={i} total={list.length} columns={columns} readOnly={readOnly} title={rowTitle ? rowTitle(r.data) : null} typedValues={typedValues} h={h} onPrev={() => go(-1)} onNext={() => go(1)} onNew={addNew} onClose={close} t={t} />; })()}
    {confirm?.kind === 'delete' && <ConfirmDelete n={confirm.keys.length} onCancel={() => setConfirm(null)} onConfirm={() => { const k = confirm.keys; setConfirm(null); removeRows(k); }} />}
    {confirm?.kind === 'discard' && <ConfirmDiscard n={counts.pending} onCancel={() => setConfirm(null)} onConfirm={() => { setConfirm(null); B.discardAll(); toast(t('mre.discarded'), 'info'); }} />}
    {showConflicts && B.conflicts.length > 0 && <ConflictDialog conflicts={B.conflicts} columns={columns} onResolve={B.resolve} onClose={() => setShowConflicts(false)} />}
    {importing && <ImportWizard columns={columns.filter(c => !c.readOnly)} existing={rows} parentName={parentName} limits={limits} onClose={() => setImporting(false)} onCommit={(list, o) => applyRows({ rows: list.map(d => ({ data: d })), at: 'end', format: o?.format || 'text', mapping: o?.mapping || [], label: t('imp.importing') })} />}
    {paste.ui}
  </>;
  return (<EntryWorkspace id={id} title={caption} context={context} returnLabel={parent?.name ? t('mre.backTo', { name: parent.name }) : undefined} badge={parent?.status ? <span className="pill xs" style={{ marginInlineStart: 8 }}>{parent.id ? `${parent.id} · ` : ''}{parent.status}</span> : null}
    meta={<>{t('ws.records', { n: rows.length })}<span aria-live="polite"> · {counts.pending ? t('ws.unsaved', { n: counts.pending }) : t('mre.allSavedShort')}</span></>} onBeforeClose={() => { if (counts.errors) toast(t('mre.fullErrors', { n: counts.errors }), 'warning'); }} className="dt itable-host"
    disabled={narrow} actions={!readOnly && <>{counts.pending > 0 && <Btn kind="primary" icon="Save" onClick={B.saveAll}>{t('mre.saveAll', { n: counts.pending })}</Btn>}</>}>
    {body}
  </EntryWorkspace>);
}
