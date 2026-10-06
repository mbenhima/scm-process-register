// Inline editable table (AI Value graphical chart §14 and §15): one row per record, sticky
// header and first column, Add row below the table, duplicate / delete (with Undo) per row,
// keyboard map (Tab, Enter, ↑ ↓, Esc, Ctrl+Enter, Ctrl+D, Ctrl+S), paste from a spreadsheet,
// validation on blur, autosave per row (debounced) and a row status marker. Cells are defined
// at module scope and rows are keyed by a stable id so typing never loses focus.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Trash2, Plus, Check, Loader2, AlertCircle, Save } from 'lucide-react';
import { useApp } from '../lib/state.jsx';
import { usePaged, Pager } from './ui.jsx';

let seq = 0;
const newKey = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`;
const colWidthsKey = (id) => `layout.columns.${id}`;
const readWidths = (id) => { try { return JSON.parse(localStorage.getItem(colWidthsKey(id)) || '{}'); } catch { return {}; } };
const saveWidths = (id, w) => { try { localStorage.setItem(colWidthsKey(id), JSON.stringify(w)); } catch { /* storage blocked */ } };

// One editable cell; the input keeps its identity across renders (stable key, module scope).
const Cell = memo(function Cell({ col, value, rowKey, onChange, onBlur, onKeyDown, error, disabled, t }) {
  const common = {
    id: `cell-${rowKey}-${col.key}`, 'data-row': rowKey, 'data-col': col.key, disabled,
    'aria-label': col.label, 'aria-invalid': error ? 'true' : undefined,
    onBlur: () => onBlur(rowKey, col.key), onKeyDown: (e) => onKeyDown(e, rowKey, col.key),
  };
  if (col.type === 'select') {
    return (
      <select className="grid-input" {...common} value={value ?? ''} onChange={e => onChange(rowKey, col.key, e.target.value)}>
        {!col.required && <option value="">—</option>}
        {(col.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (col.type === 'checkbox') {
    return <input type="checkbox" className="grid-check" {...common} checked={!!value} onChange={e => onChange(rowKey, col.key, e.target.checked)} />;
  }
  if (col.type === 'number') {
    return <input type="number" className="grid-input num" {...common} min={col.min} max={col.max} value={value ?? ''} onChange={e => onChange(rowKey, col.key, e.target.value === '' ? '' : Number(e.target.value))} />;
  }
  if (col.type === 'textarea') {
    return <textarea className="grid-input" rows={2} {...common} value={value ?? ''} onChange={e => onChange(rowKey, col.key, e.target.value)} />;
  }
  return <input className="grid-input" {...common} value={value ?? ''} placeholder={col.placeholder ? t(col.placeholder) : undefined} onChange={e => onChange(rowKey, col.key, e.target.value)} />;
});

function RowStatus({ state, t }) {
  if (state === 'dirty') return <span className="row-dot" title={t('Not saved yet')} aria-label={t('Not saved yet')} />;
  if (state === 'saving') return <Loader2 size={14} className="spin muted" aria-label={t('Saving…')} />;
  if (state === 'saved') return <Check size={14} className="row-saved" aria-label={t('Saved')} />;
  if (state === 'error') return <AlertCircle size={14} className="row-error" aria-label={t('Error')} />;
  return null;
}

/**
 * props: id (for persisted column widths), columns [{key,label,type,options,required,width,validate,carry}],
 * rows (records with an `id`), onSave(rows) → Promise, readOnly, countLabel(n), newRow(), idPrefix
 */
export default function InlineGrid({ id, columns, rows, onSave, readOnly, countLabel, newRow, addLabel }) {
  const { t, toast } = useApp();
  const wrap = useRef(null);
  const [data, setData] = useState(() => (rows || []).map(r => ({ ...r, _key: r._key || r.id || newKey() })));
  const [state, setState] = useState({}); // rowKey → dirty | saving | saved | error
  const [errors, setErrors] = useState({}); // `${rowKey}:${col}` → message
  const [widths, setWidths] = useState(() => readWidths(id));
  const latest = useRef(data); latest.current = data;
  const stateRef = useRef(state); stateRef.current = state;
  const timer = useRef(null);
  const queued = useRef(new Set());
  const edited = useRef({}); // value before editing a cell, for Esc
  const pendingFocus = useRef(null);

  // Reload when the source changes from elsewhere. The echo of this grid's own save is ignored:
  // reloading it would overwrite what was typed while the save was in flight and re-key the rows.
  const ownSig = useRef(null);
  const srcSig = useMemo(() => JSON.stringify(rows || []), [rows]);
  useEffect(() => {
    if (srcSig === ownSig.current) return;
    setData((rows || []).map(r => ({ ...r, _key: r._key || r.id || newKey() }))); setState({}); setErrors({});
  }, [srcSig]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = Object.values(state).some(s => s === 'dirty' || s === 'error');
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const validateRow = useCallback((r) => {
    const errs = {};
    for (const c of columns) {
      const v = r[c.key];
      if (c.required && (v === undefined || v === null || String(v).trim() === '')) errs[c.key] = t('Required');
      else if (c.validate) { const m = c.validate(v, r); if (m) errs[c.key] = m; }
    }
    return errs;
  }, [columns, t]);

  const saveAll = useCallback(async (keys) => {
    if (!onSave) return;
    const list = latest.current;
    // Rows with an error stay local (never lost) and are not sent until fixed.
    const bad = new Set(list.filter(r => Object.keys(validateRow(r)).length).map(r => r._key));
    const keysToMark = (keys || list.map(r => r._key)).filter(k => !bad.has(k));
    setState(s => ({ ...s, ...Object.fromEntries(keysToMark.map(k => [k, 'saving'])) }));
    try {
      const payload = list.filter(r => !bad.has(r._key) || r.id).map(({ _key, ...r }) => ({ ...r, _key }));
      ownSig.current = JSON.stringify(payload.map(({ _key, ...r }) => r));
      await onSave(payload);
      setState(s => ({ ...s, ...Object.fromEntries(keysToMark.map(k => [k, 'saved'])) }));
      setTimeout(() => setState(s => Object.fromEntries(Object.entries(s).filter(([k, v]) => !(keysToMark.includes(k) && v === 'saved')))), 1600);
    } catch (e) {
      setState(s => ({ ...s, ...Object.fromEntries(keysToMark.map(k => [k, 'error'])) }));
      toast(e.message, 'error');
    }
  }, [onSave, toast, validateRow]);

  // Autosave per row after blur, debounced ~500 ms; rows blurred meanwhile are saved together.
  const scheduleSave = useCallback((key) => {
    queued.current.add(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { const keys = [...queued.current]; queued.current.clear(); saveAll(keys); }, 500);
  }, [saveAll]);

  const onChange = useCallback((key, col, value) => {
    setData(d => d.map(r => (r._key === key ? { ...r, [col]: value } : r)));
    setState(s => ({ ...s, [key]: 'dirty' }));
    // Re-validate on change only after a first error on that cell.
    setErrors(er => (er[`${key}:${col}`] ? (() => { const n = { ...er }; delete n[`${key}:${col}`]; return n; })() : er));
  }, []);

  const onBlur = useCallback((key, col) => {
    const r = latest.current.find(x => x._key === key);
    if (!r) return;
    const errs = validateRow(r);
    setErrors(er => {
      const n = { ...er };
      for (const c of columns) delete n[`${key}:${c.key}`];
      if (errs[col]) n[`${key}:${col}`] = errs[col];
      return n;
    });
    delete edited.current[`${key}:${col}`];
    const st = stateRef.current[key];
    if (Object.keys(errs).length) { if (st === 'dirty') setState(s => ({ ...s, [key]: 'error' })); return; }
    if (st === 'dirty' || st === 'error') scheduleSave(key);
  }, [columns, validateRow, scheduleSave]);

  const focusCell = (key, col) => {
    const el = wrap.current?.querySelector(`[data-row="${key}"][data-col="${col}"]`);
    if (el) { el.focus(); if (el.select && el.tagName === 'INPUT' && el.type !== 'checkbox') el.select(); }
  };
  useEffect(() => { if (pendingFocus.current) { const [k, c] = pendingFocus.current; pendingFocus.current = null; focusCell(k, c); } });

  const makeRow = useCallback((above) => {
    const base = newRow ? newRow() : {};
    // Carry-over: a new row inherits the carry columns of the row above when left unset.
    for (const c of columns) if (c.carry && above && base[c.key] === undefined) base[c.key] = above[c.key];
    return { ...base, id: base.id || '', _key: newKey() };
  }, [newRow, columns]);

  const addRow = useCallback((afterKey) => {
    const list = latest.current;
    const i = afterKey ? list.findIndex(r => r._key === afterKey) : list.length - 1;
    const row = makeRow(list[i]);
    setData(d => { const n = [...d]; n.splice(i + 1, 0, row); return n; });
    setState(s => ({ ...s, [row._key]: 'dirty' }));
    pendingFocus.current = [row._key, columns.find(c => !c.readOnly)?.key];
  }, [makeRow, columns]);

  const duplicate = useCallback((key) => {
    const list = latest.current;
    const i = list.findIndex(r => r._key === key);
    if (i < 0) return;
    const row = { ...list[i], id: '', _key: newKey() };
    setData(d => { const n = [...d]; n.splice(i + 1, 0, row); return n; });
    setState(s => ({ ...s, [row._key]: 'dirty' }));
    pendingFocus.current = [row._key, columns.find(c => !c.readOnly)?.key];
    scheduleSave(row._key);
  }, [columns, scheduleSave]);

  const remove = useCallback((key) => {
    const list = latest.current;
    const i = list.findIndex(r => r._key === key);
    if (i < 0) return;
    const row = list[i];
    setData(d => d.filter(r => r._key !== key));
    setTimeout(() => saveAll([]), 0);
    toast(t('Row deleted.'), 'info', { label: t('Undo'), run: () => { setData(d => { const n = [...d]; n.splice(Math.min(i, n.length), 0, row); return n; }); setTimeout(() => saveAll([row._key]), 0); } });
  }, [saveAll, toast, t]);

  const onKeyDown = useCallback((e, key, col) => {
    const list = latest.current;
    const ri = list.findIndex(r => r._key === key);
    const editable = columns.filter(c => !c.readOnly);
    const ci = editable.findIndex(c => c.key === col);
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveAll(); return; }
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(key); return; }
    if (mod && e.key === 'Enter') { e.preventDefault(); onBlur(key, col); return; }
    if (e.key === 'Escape') {
      const k = `${key}:${col}`;
      if (k in edited.current) { e.preventDefault(); onChange(key, col, edited.current[k]); }
      return;
    }
    const isText = e.target.tagName === 'TEXTAREA';
    if (e.key === 'Enter' && !isText && !e.shiftKey) {
      e.preventDefault();
      if (ri === list.length - 1 && ci === editable.length - 1) { onBlur(key, col); addRow(key); return; }
      const next = list[ri + 1];
      if (next) focusCell(next._key, col); else { onBlur(key, col); addRow(key); }
      return;
    }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.tagName === 'INPUT' && e.target.type !== 'number') {
      const n = list[ri + (e.key === 'ArrowDown' ? 1 : -1)];
      if (n) { e.preventDefault(); focusCell(n._key, col); }
    }
  }, [columns, saveAll, duplicate, onBlur, onChange, addRow]);

  // Remember the value of a cell when it gets focus (Esc reverts to it).
  const onFocusCapture = (e) => {
    const k = e.target.dataset?.row && `${e.target.dataset.row}:${e.target.dataset.col}`;
    if (k && !(k in edited.current)) { const r = latest.current.find(x => x._key === e.target.dataset.row); edited.current[k] = r?.[e.target.dataset.col]; }
  };

  // Paste from a spreadsheet: tab-separated columns, one line per row, from the focused cell.
  const onPaste = (e) => {
    const text = e.clipboardData?.getData('text/plain');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;
    const key = e.target.dataset?.row; const col = e.target.dataset?.col;
    if (!key) return;
    e.preventDefault();
    const lines = text.replace(/\r/g, '').split('\n').filter((l, i, a) => l.length || i < a.length - 1);
    const editable = columns.filter(c => !c.readOnly);
    const c0 = editable.findIndex(c => c.key === col);
    setData(d => {
      const n = [...d];
      let ri = n.findIndex(r => r._key === key);
      const touched = [];
      for (const line of lines) {
        if (ri >= n.length) n.push(makeRow(n[n.length - 1]));
        const cells = line.split('\t');
        const r = { ...n[ri] };
        cells.forEach((v, j) => { const c = editable[c0 + j]; if (!c) return; r[c.key] = c.type === 'number' ? (v.trim() === '' ? '' : Number(v.replace(',', '.'))) : c.type === 'checkbox' ? /^(1|true|yes|oui|x)$/i.test(v.trim()) : c.type === 'select' ? ((c.options || []).find(o => o.value === v.trim() || String(o.label).toLowerCase() === v.trim().toLowerCase())?.value ?? r[c.key]) : v; });
        n[ri] = r; touched.push(r._key); ri += 1;
      }
      setTimeout(() => {
        const errs = {};
        for (const k of touched) { const row = latest.current.find(x => x._key === k); for (const [c, m] of Object.entries(validateRow(row || {}))) errs[`${k}:${c}`] = m; }
        setErrors(er => ({ ...er, ...errs }));
        setState(s => ({ ...s, ...Object.fromEntries(touched.map(k => [k, Object.keys(errs).some(x => x.startsWith(`${k}:`)) ? 'error' : 'dirty'])) }));
        saveAll(touched);
      }, 0);
      return n;
    });
  };

  // Column resize (min 80 px), persisted per grid.
  const startResize = (e, key) => {
    e.preventDefault();
    const th = e.currentTarget.parentElement;
    const x0 = e.clientX; const w0 = th.getBoundingClientRect().width;
    const rtl = document.documentElement.dir === 'rtl' ? -1 : 1;
    document.body.classList.add('is-resizing');
    const move = (ev) => setWidths(w => ({ ...w, [key]: Math.max(80, Math.round(w0 + rtl * (ev.clientX - x0))) }));
    const up = () => { document.body.classList.remove('is-resizing'); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setWidths(w => { saveWidths(id, w); return w; }); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  const { shown, pager, needed } = usePaged(data, id);
  const pendingCount = Object.values(state).filter(s => s === 'dirty' || s === 'error').length;

  return (
    <div className="inline-grid stack-8">
      <div className="row-between">
        <span className="small muted" aria-live="polite">{countLabel ? countLabel(data.length) : t('{n} rows', { n: data.length })}</span>
        {!readOnly && (
          <div className="row">
            {pendingCount > 0 && <button type="button" className="btn btn-sm btn-primary" onClick={() => saveAll()}><Save size={16} />{t('Save all')} ({pendingCount})</button>}
            <button type="button" className="btn btn-sm" disabled={!data.length} onClick={() => duplicate(data[data.length - 1]?._key)}><Copy size={16} />{t('Duplicate previous row')}</button>
          </div>
        )}
      </div>
      <div className="table-wrap" ref={wrap} onFocusCapture={onFocusCapture} onPaste={readOnly ? undefined : onPaste}>
        <table className="data grid-table" style={{ width: 56 + columns.reduce((a, c) => a + (widths[c.key] || c.width || 160), 0) + (readOnly ? 0 : 84), minWidth: '100%', tableLayout: 'fixed' }}>
          <thead><tr>
            <th scope="col" className="grid-num">#</th>
            {columns.map(c => <th key={c.key} scope="col" style={{ width: widths[c.key] || c.width || 160 }}>{c.required && <span className="req" aria-hidden="true">*</span>}{c.label}<span className="col-resize" onPointerDown={e => startResize(e, c.key)} aria-hidden="true" /></th>)}
            {!readOnly && <th scope="col" className="grid-actions"><span className="sr-only">{t('Actions')}</span></th>}
          </tr></thead>
          <tbody>
            {shown.map((r) => {
              const i = data.indexOf(r);
              return (
                <tr key={r._key} className={state[r._key] === 'saved' ? 'row-flash' : ''}>
                  <td className="grid-num"><span className="row-n">{i + 1}</span><RowStatus state={state[r._key]} t={t} /></td>
                  {columns.map(c => {
                    const err = errors[`${r._key}:${c.key}`];
                    return (
                      <td key={c.key} className={err ? 'cell-error' : ''}>
                        {c.readOnly || readOnly ? <span>{c.render ? c.render(r) : (c.type === 'select' ? (c.options || []).find(o => o.value === r[c.key])?.label : c.type === 'checkbox' ? (r[c.key] ? '✓' : '—') : r[c.key]) ?? '—'}</span>
                          : <Cell col={c} value={r[c.key]} rowKey={r._key} onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} error={err} t={t} />}
                        {err && <span className="cell-msg" role="alert">{err}</span>}
                      </td>
                    );
                  })}
                  {!readOnly && (
                    <td className="grid-actions">
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => duplicate(r._key)} aria-label={t('Duplicate row')} title={`${t('Duplicate row')} (Ctrl+D)`}><Copy size={16} /></button>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(r._key)} aria-label={t('Delete row')} title={t('Delete row')}><Trash2 size={16} /></button>
                    </td>
                  )}
                </tr>
              );
            })}
            {!data.length && <tr><td colSpan={columns.length + 2} className="muted small" style={{ padding: 16 }}>{t('No records yet.')}</td></tr>}
          </tbody>
        </table>
      </div>
      {needed && <Pager {...pager} />}
      {!readOnly && (
        <div className="row-between">
          <button type="button" className="btn btn-sm" onClick={() => addRow(data[data.length - 1]?._key)}><Plus size={16} />{addLabel || t('Add row')}</button>
          <span className="xsmall muted">{t('Tab and Enter move between cells · Esc reverts · Ctrl+D duplicates · Ctrl+S saves · paste rows from a spreadsheet')}</span>
        </div>
      )}
    </div>
  );
}
