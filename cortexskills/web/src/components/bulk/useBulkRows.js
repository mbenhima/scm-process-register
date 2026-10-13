// Row state of a Multi-Entry (FR-DA-MRE-03, -05, -08, -09, NFR-DA-REL-10): typed values, row status, validation on
// leaving a cell, autosave of a row ~500 ms after the user leaves it, Save all, undo and redo, deletion with Undo,
// the browser draft, conflicts, the offline queue with retries, and batched bulk saves and deletes with progress.
//
// Row: { _key, id, data, base (server stamp), status: clean | dirty | saving | saved | error | queued, errors }.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { post } from '../../lib/api.js';
import { validateCell, validateRow, isEmpty } from '../../lib/bulk/validate.js';
import { createHistory, applyEntry, keysOf } from '../../lib/bulk/history.js';
import { saveDraft, loadDraft, clearDraft, mergeDraft, resolveConflict } from '../../lib/bulk/draft.js';
import { runBatches } from '../../lib/bulk/batch.js';
import { backoff, isNetworkError } from '../../lib/bulk/net.js';

let seq = 0;
export const newKey = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `k${Date.now()}${++seq}`);
const meta = r => { const { _origin, _author, _updated, ...d } = r || {}; return d; };
export const toRow = (r, status = 'clean') => ({ _key: r.id || newKey(), id: r.id || null, data: meta(r), base: r._updated ?? null, origin: r._origin || null, status, errors: {} });
const PENDING = new Set(['dirty', 'error', 'queued']);
const store = () => { try { return window.localStorage; } catch { return null; } };
const strip = d => { const { id: _i, ...x } = d || {}; return x; };
export const DELETE_UNDO_MS = 10000;

export function useBulkRows({ id, draftId, initial, columns, t, toast, announce, onSaveRow, onDeleteRow, pasteTarget, batchSize = 250 }) {
  // ---- rows, with the browser draft merged on first render (restored rows are marked changed)
  const draftRef = useRef(null);
  const [rows, setRowsState] = useState(() => {
    const server = (initial || []).map(r => toRow(r)); const d = draftId ? loadDraft(store(), draftId) : null;
    if (!d) return server; const m = mergeDraft(server, d); draftRef.current = { at: d.savedAt, n: m.restored, conflicts: m.conflicts }; return m.rows;
  });
  const [draftInfo, setDraftInfo] = useState(() => draftRef.current);
  const [conflicts, setConflicts] = useState(() => draftRef.current?.conflicts || []);
  const rowsRef = useRef(rows); rowsRef.current = rows;
  const setRows = useCallback(fn => setRowsState(rs => { const n = typeof fn === 'function' ? fn(rs) : fn; rowsRef.current = n; return n; }), []);
  const setRow = useCallback((key, fn) => setRows(rs => rs.map(r => (r._key === key ? fn(r) : r))), [setRows]);
  const find = key => rowsRef.current.find(r => r._key === key);
  const saveRef = useRef(onSaveRow); saveRef.current = onSaveRow; const delRef = useRef(onDeleteRow); delRef.current = onDeleteRow;
  const colsRef = useRef(columns); colsRef.current = columns; const tRef = useRef(t); tRef.current = t;
  const timers = useRef({}); const retries = useRef({}); const pendingDeletes = useRef({}); const hist = useRef(createHistory()); const [histTick, setHistTick] = useState(0);
  const [touched, setTouched] = useState({}); const touchedRef = useRef(touched); touchedRef.current = touched;
  const [flash, setFlash] = useState(null); const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  const [progress, setProgress] = useState(null); // { label, done, total, items, of, failed, cancel, resume }
  const edited = useRef({}); const editStart = useRef({});

  // ---- server data merged for rows the user is not editing (the Active Draft wins — NFR-DA-FOC-10)
  useEffect(() => { setRows(cur => {
    const byId = Object.fromEntries(cur.filter(r => r.id).map(r => [r.id, r]));
    const incoming = (initial || []).map(r => { const c = byId[r.id]; if (!c) return toRow(r); return c.status !== 'clean' && c.status !== 'saved' ? c : { ...c, data: meta(r), base: r._updated ?? c.base, origin: r._origin || c.origin }; });
    const ids = new Set(incoming.map(r => r.id)); const local = cur.filter(r => !r.id || (!ids.has(r.id) && PENDING.has(r.status)));
    return [...incoming, ...local.filter(r => !incoming.some(x => x._key === r._key))];
  }); }, [initial, setRows]);

  // ---- browser draft of the pending rows, versioned and timestamped (NFR-DA-REL-10)
  useEffect(() => { if (!draftId) return undefined; const h = setTimeout(() => saveDraft(store(), draftId, rowsRef.current), 300); return () => clearTimeout(h); }, [rows, draftId]);
  const dismissDraft = useCallback(() => setDraftInfo(null), []);

  // ---- counts
  const counts = useMemo(() => { let pending = 0, errors = 0, saving = 0, queued = 0; for (const r of rows) { if (PENDING.has(r.status)) pending++; if (r.status === 'error' || Object.keys(r.errors).length) errors++; if (r.status === 'saving') saving++; if (r.status === 'queued') queued++; } return { pending, errors, saving, queued }; }, [rows]);

  // ---- save of one row; network failures are queued and retried with backoff, refusals stay on the row
  const save = useCallback(async key => {
    clearTimeout(timers.current[key]); const r = find(key); if (!r || !PENDING.has(r.status)) return;
    const errors = validateRow(colsRef.current, r.data, tRef.current);
    if (Object.keys(errors).length) { setRow(key, x => ({ ...x, errors, status: 'error' })); setTouched(tc => ({ ...tc, ...Object.fromEntries(Object.keys(errors).map(c => [key + '|' + c, true])) })); return; }
    setRow(key, x => ({ ...x, status: 'saving', errors: {} }));
    try {
      const saved = await saveRef.current(r.data, r.id, { expected: r.force ? null : r.base });
      retries.current[key] = 0; setOffline(false);
      // The typed values are kept: only the identifier and the server stamp come from the answer (C17).
      setRow(key, x => ({ ...x, id: saved?.id || x.id, data: { ...x.data, id: saved?.id || x.id }, base: saved?._updated ?? x.base, force: false, status: x.status === 'saving' ? 'saved' : x.status }));
      setFlash(key); setTimeout(() => setFlash(f => (f === key ? null : f)), 400); announce?.(tRef.current('mre.a.saved'));
    } catch (e) {
      if (isNetworkError(e)) {
        const n = (retries.current[key] = (retries.current[key] || 0) + 1); setOffline(true);
        setRow(key, x => ({ ...x, status: 'queued' }));
        clearTimeout(timers.current[key]); timers.current[key] = setTimeout(() => save(key), backoff(n - 1));
        return;
      }
      const conflict = e.status === 409 && e.code === 'err.rowConflict';
      setRow(key, x => ({ ...x, status: 'error', conflict, errors: { _row: e.message || tRef.current('err.server') } })); announce?.(tRef.current('mre.a.failed'));
      if (!conflict) toast?.(e.message || tRef.current('err.server'), 'error');
    }
  }, [setRow, toast, announce]); // eslint-disable-line react-hooks/exhaustive-deps
  const schedule = useCallback((key, ms = 500) => { clearTimeout(timers.current[key]); timers.current[key] = setTimeout(() => save(key), ms); }, [save]);
  const saveAll = useCallback(async () => { const keys = rowsRef.current.filter(r => PENDING.has(r.status)).map(r => r._key); await Promise.all(keys.map(save)); }, [save]);
  const retryFailed = useCallback(() => { for (const r of rowsRef.current) if (r.status === 'error' || r.status === 'queued') { retries.current[r._key] = 0; save(r._key); } }, [save]);
  const overwrite = useCallback(key => { setRow(key, x => ({ ...x, force: true, status: 'dirty', conflict: false })); setTimeout(() => save(key), 0); }, [setRow, save]);
  // Connection back: the queue is sent at once.
  useEffect(() => { const on = () => { setOffline(false); for (const r of rowsRef.current) if (r.status === 'queued') save(r._key); }; const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); }; }, [save]);

  // ---- typing: no validation while typing; validation when the cell is left after a change (FR-DA-MRE-08)
  const change = useCallback((key, col, value) => {
    edited.current[key + '|' + col.key] = true;
    if (col.type === 'boolean') { const before = find(key)?.data[col.key]; hist.current.push({ kind: 'set', key, col: col.key, before, after: value }); setHistTick(x => x + 1); setTimeout(() => schedule(key), 0); }
    setRow(key, r => { const data = { ...r.data, [col.key]: value }; const errors = { ...r.errors }; if (touchedRef.current[key + '|' + col.key]) { const e = validateCell(col, value, data, tRef.current); if (e) errors[col.key] = e; else delete errors[col.key]; } return { ...r, data, errors, status: r.status === 'saving' ? 'dirty' : 'dirty' }; });
  }, [setRow, schedule]);
  const focusStart = useCallback((key, col, value) => { editStart.current[key + '|' + col.key] = value ?? ''; }, []);
  const blurCell = useCallback((key, col) => {
    const r = find(key); if (!r) return; const k = key + '|' + col.key; const start = editStart.current[k]; const cur = r.data[col.key] ?? '';
    if (start !== undefined && String(start ?? '') !== String(cur) && col.type !== 'boolean') { hist.current.push({ kind: 'set', key, col: col.key, before: start, after: cur }); setHistTick(x => x + 1); editStart.current[k] = cur; }
    if (!touchedRef.current[k] && !edited.current[k] && !r.errors[col.key] && String(start ?? '') === String(cur)) return;
    const e = validateCell(col, r.data[col.key], r.data, tRef.current);
    setTouched(tc => ({ ...tc, [k]: true }));
    setRow(key, x => { const errors = { ...x.errors }; if (e) errors[col.key] = e; else delete errors[col.key]; return { ...x, errors }; });
  }, [setRow]);
  const cancelEdit = useCallback((key, col) => { const k = key + '|' + col.key; const start = editStart.current[k]; const cur = find(key)?.data[col.key] ?? ''; if (start === undefined || String(start) === String(cur)) return false; setRow(key, r => ({ ...r, data: { ...r.data, [col.key]: start } })); delete edited.current[k]; return true; }, [setRow]);

  // ---- history entries recorded by the grid (add, duplicate, insert, bulk set, fill, paste)
  const record = useCallback(entry => { hist.current.push(entry); setHistTick(x => x + 1); }, []);
  const flushDelete = useCallback(async list => {
    const withId = list.filter(x => x.row.id); if (!withId.length) return;
    const fail = (x, msg) => setRows(rs => { const n = [...rs]; n.splice(Math.min(x.index, n.length), 0, { ...x.row, status: 'error', errors: { _row: msg } }); return n; });
    if (pasteTarget && withId.length > 1) {
      const res = await runBatches(withId, b => post('/bulk-entry/delete', { target: pasteTarget, ids: b.map(x => x.row.id) }), { size: batchSize });
      for (const f of res.failed) for (const x of f.items) fail(x, f.error?.message || tRef.current('err.server'));
      for (const r of res.results.filter(Boolean)) for (const f of r.failed || []) { const x = withId.find(y => y.row.id === f.id); if (x) fail(x, f.error); }
      return;
    }
    for (const x of withId) { try { await delRef.current?.(x.row.id, x.row.data); } catch (e) { fail(x, e.message); toast?.(e.message, 'error'); } }
  }, [pasteTarget, batchSize, setRows, toast]);
  /** Delete rows at once on screen; the server delete waits 10 s so Undo (button or Ctrl+Z) can cancel it (FR-DA-MRE-05). */
  const remove = useCallback((keys, { recordIt = true } = {}) => {
    const list = keys.map(k => ({ row: find(k), index: rowsRef.current.findIndex(r => r._key === k) })).filter(x => x.row);
    if (!list.length) return null;
    setRows(rs => rs.filter(r => !keys.includes(r._key)));
    const entry = { kind: 'delete', rows: list }; if (recordIt) record(entry);
    const timer = setTimeout(() => { for (const x of list) delete pendingDeletes.current[x.row._key]; flushDelete(list); }, DELETE_UNDO_MS);
    for (const x of list) pendingDeletes.current[x.row._key] = { timer, list };
    announce?.(tRef.current('mre.a.deleted', { n: list.length }));
    return entry;
  }, [setRows, record, flushDelete, announce]);

  // ---- undo / redo (Table 4.49-1): side effects on the server follow the rows
  const step = useCallback(dir => {
    const e = dir < 0 ? hist.current.undo() : hist.current.redo(); setHistTick(x => x + 1); if (!e) return false;
    if (e.kind === 'paste') { if (dir < 0) e.undo?.(); return true; }
    let next = applyEntry(rowsRef.current, e, dir);
    const back = e.kind === 'delete' ? dir < 0 : e.kind === 'add' ? dir > 0 : false; // rows coming back
    const gone = e.kind === 'delete' ? dir > 0 : e.kind === 'add' ? dir < 0 : false; // rows leaving
    if (back) next = next.map(r => { if (!e.rows.some(x => x.row._key === r._key)) return r; const p = pendingDeletes.current[r._key]; if (p) { clearTimeout(p.timer); for (const x of p.list) delete pendingDeletes.current[x.row._key]; return r; } return r.id && e.kind === 'delete' ? { ...r, id: null, data: strip(r.data), status: 'dirty' } : r; });
    setRows(next);
    if (gone) { const list = e.rows.map(x => ({ ...x, row: next.find(r => r._key === x.row._key) || x.row })); const timer = setTimeout(() => flushDelete(list.filter(x => x.row.id)), 0); void timer; }
    for (const k of keysOf(e)) { const r = next.find(x => x._key === k); if (r && (r.status === 'dirty' || (back && !r.id))) schedule(k); }
    announce?.(tRef.current(dir < 0 ? 'mre.a.undone' : 'mre.a.redone'));
    return true;
  }, [setRows, schedule, flushDelete, announce]);
  const undo = useCallback(() => step(-1), [step]); const redo = useCallback(() => step(+1), [step]);

  // ---- batched save of many rows (bulk set, fill down, import): chunks with progress, cancel and resume
  const saveMany = useCallback(async (keys, { label } = {}) => {
    const list = keys.map(find).filter(r => r && PENDING.has(r.status));
    const valid = []; for (const r of list) { const errors = validateRow(colsRef.current, r.data, tRef.current); if (Object.keys(errors).length) setRow(r._key, x => ({ ...x, errors, status: 'error' })); else valid.push(r); }
    if (!valid.length) return;
    if (!pasteTarget || valid.length <= 20) { for (const r of valid) save(r._key); return; }
    const ctl = new AbortController(); const keysV = valid.map(r => r._key);
    const run = async from => {
      for (const k of keysV.slice(from * batchSize)) setRow(k, x => ({ ...x, status: 'saving' }));
      const res = await runBatches(valid, async b => {
        const out = await post('/bulk-entry/apply', { target: pasteTarget, format: 'text', mapping: [], rows: b.map(r => ({ id: r.id || undefined, data: strip(r.data) })) });
        const rej = Object.fromEntries((out.rejected || []).map(x => [x.index, x.errors])); const ok = Object.fromEntries((out.saved || []).map(x => [x.index, x]));
        b.forEach((r, i) => setRow(r._key, x => (ok[i] ? { ...x, id: ok[i].id, data: { ...x.data, id: ok[i].id }, base: ok[i]._updated ?? x.base, status: 'saved', errors: {} } : { ...x, status: 'error', errors: rej[i] || { _row: tRef.current('err.server') } })));
        return out;
      }, { size: batchSize, signal: ctl.signal, from, onProgress: p => setProgress(s => ({ ...(s || {}), label, ...p, cancel: () => ctl.abort() })) });
      for (const f of res.failed) for (const r of f.items) setRow(r._key, x => ({ ...x, status: isNetworkError(f.error) ? 'queued' : 'error', errors: { _row: f.error?.message || tRef.current('err.server') } }));
      if (res.cancelled) for (const k of keysV.slice(res.next * batchSize)) setRow(k, x => (x.status === 'saving' ? { ...x, status: 'dirty' } : x));
      setProgress({ label, done: res.done, total: res.total, failed: res.failed.length, finished: true, cancelled: res.cancelled, resume: res.cancelled || res.failed.length ? () => run(res.cancelled ? res.next : res.failed[0].index) : null });
      announce?.(tRef.current('mre.a.batchDone', { n: res.done, total: res.total }));
    };
    await run(0);
  }, [pasteTarget, batchSize, save, setRow, announce]);

  // ---- discard: changed rows return to their saved values, new unsaved rows are removed (draft model)
  const discardAll = useCallback(() => {
    const byId = Object.fromEntries((initial || []).map(r => [r.id, r]));
    for (const r of rowsRef.current) clearTimeout(timers.current[r._key]);
    setRows(rs => rs.filter(r => r.id || !PENDING.has(r.status)).map(r => (r.id && PENDING.has(r.status) && byId[r.id] ? { ...toRow(byId[r.id]), _key: r._key } : r)));
    setTouched({}); hist.current.clear(); setHistTick(x => x + 1); if (draftId) clearDraft(store(), draftId); setDraftInfo(null); setConflicts([]);
  }, [initial, setRows, draftId]);
  const resolve = useCallback((c, choice) => { setRows(rs => resolveConflict(rs, c, choice)); setConflicts(cs => cs.filter(x => x !== c)); if (choice === 'mine') setTimeout(() => { const r = rowsRef.current.find(x => x._key === c.key) || rowsRef.current.find(x => !x.id && x.data === c.mine); if (r) save(r._key); }, 0); }, [setRows, save]);

  // ---- leaving: pending deletes are sent, changed rows saved (fire and forget); the draft keeps the rest
  useEffect(() => () => { for (const k of Object.keys(pendingDeletes.current)) { const p = pendingDeletes.current[k]; clearTimeout(p.timer); } const lists = new Set(Object.values(pendingDeletes.current).map(p => p.list)); for (const l of lists) flushDelete(l); for (const r of rowsRef.current) if (r.status === 'dirty' && !Object.keys(validateRow(colsRef.current, r.data, tRef.current)).length) saveRef.current?.(r.data, r.id, { expected: r.base })?.catch?.(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { rows, rowsRef, setRows, setRow, find, counts, save, schedule, saveAll, saveMany, retryFailed, overwrite, change, blurCell, focusStart, cancelEdit, editStart, edited, touched, setTouched,
    remove, record, undo, redo, canUndo: hist.current.canUndo(), canRedo: hist.current.canRedo(), histTick, discardAll, draftInfo, dismissDraft, conflicts, resolve, offline, progress, setProgress, flash, isEmpty };
}
