// Rows, cells and column headers of the bulk-entry grid (W3C ARIA grid pattern: role grid / row / gridcell /
// columnheader with aria-rowindex and aria-colindex; FR-DA-MRE-02 – 05, -11; NFR-DA-FOC-01, -06, -07).
// Components live at module scope with stable keys (the record key and the column name), so typing never remounts
// a row or a cell and focus stays in the active cell.
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Btn, Icon, MultiSelect, Select, Spinner, splitMulti } from '../ui.jsx';

export const CUSTOM = '__custom__';
export const optionList = (col, typed, t) => [...(col.options || []).map(o => (typeof o === 'object' ? { value: String(o.value), label: o.label } : { value: String(o), label: String(o) })), ...(typed || []).map(x => ({ value: String(x), label: String(x), group: t('mre.typedBefore') })), ...(col.custom ? [{ value: CUSTOM, label: t('mre.custom') }] : [])];

/** Virtual rows: only the visible rows (and a small buffer) are rendered; row heights are uniform when text does not wrap. */
export function useVirtualRows({ enabled, count, scrollEl, overscan = 8, estimate = 46 }) {
  const [range, setRange] = useState({ start: 0, end: 60 }); const h = useRef(estimate);
  const measure = useCallback(el => { if (el && el.offsetHeight > 10) h.current = el.offsetHeight; }, []);
  useLayoutEffect(() => {
    if (!enabled) return undefined; const el = scrollEl(); if (!el) return undefined;
    const upd = () => {
      const table = el.querySelector('table'); const k = table && table.offsetHeight ? table.getBoundingClientRect().height / table.offsetHeight || 1 : 1;
      const head = table?.tHead?.offsetHeight || 0; const top = Math.max(0, el.scrollTop / k - head); const vh = el.clientHeight / k;
      const s = Math.max(0, Math.floor(top / h.current) - overscan); const e = Math.min(count, Math.ceil((top + vh) / h.current) + overscan);
      setRange(r => (r.start === s && r.end === e ? r : { start: s, end: e }));
    };
    upd(); el.addEventListener('scroll', upd, { passive: true }); const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(upd) : null; ro?.observe(el);
    return () => { el.removeEventListener('scroll', upd); ro?.disconnect(); };
  }, [enabled, count, scrollEl, overscan]);
  const scrollTo = useCallback(i => { const el = scrollEl(); if (!el) return; const table = el.querySelector('table'); const k = table && table.offsetHeight ? table.getBoundingClientRect().height / table.offsetHeight || 1 : 1; const head = table?.tHead?.offsetHeight || 0; el.scrollTop = Math.max(0, (head + i * h.current) * k - el.clientHeight / 2); }, [scrollEl]);
  if (!enabled) return { start: 0, end: count, padTop: 0, padBottom: 0, measure, scrollTo, on: false };
  const end = Math.min(range.end, count); const start = Math.min(range.start, end);
  return { start, end, padTop: start * h.current, padBottom: Math.max(0, count - end) * h.current, measure, scrollTo, on: true };
}

/** Column header: three-step sort, drag to reorder, resize from the edge (FR-DA-MRE-11). */
export function HeaderCell({ col, index, width, sort, onSort, onResize, onDragStart, onDrop, dragOver, t }) {
  const dir = sort?.key === col.key ? sort.dir : 0;
  return <th scope="col" role="columnheader" aria-colindex={index} aria-sort={dir === 1 ? 'ascending' : dir === -1 ? 'descending' : 'none'} className={`${col.type === 'boolean' ? 'th-bool' : ''} ${dragOver ? 'drag-over' : ''}`}
    style={width ? { width, minWidth: width } : undefined} draggable onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(col.key); }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onDrop(col.key); }}>
    <button type="button" className="th th-sort" onClick={() => onSort(col.key)} aria-label={dir ? `${col.label} — ${t(dir === 1 ? 'mre.sortedAsc' : 'mre.sortedDesc')}` : t('dt.sortBy', { c: col.label })}>
      <span className="th-label">{col.required && '* '}{col.label}</span><Icon name={dir === 1 ? 'ArrowUp' : dir === -1 ? 'ArrowDown' : 'ArrowUpDown'} size={14} className={dir ? '' : 'muted-ico'} /></button>
    <span className="col-resize" role="separator" aria-orientation="vertical" aria-label={t('dt.resizeCol', { c: col.label })} tabIndex={-1} onPointerDown={e => onResize(e, col.key)} />
  </th>;
}

export const StatusMark = ({ row, index, t }) => {
  const st = row.status; const hasErr = Object.keys(row.errors).length > 0 || st === 'error';
  const label = t('mre.st.' + (hasErr ? 'error' : st));
  return <span className="row-status" aria-label={label} data-tip={hasErr ? Object.values(row.errors)[0] : st === 'queued' ? t('mre.st.queued') : undefined}>
    {hasErr ? <Icon name="TriangleAlert" size={16} className="err-ico" /> : st === 'queued' ? <Icon name="CloudOff" size={16} className="muted-ico" /> : st === 'dirty' ? <span className="dirty-dot" /> : st === 'saving' ? <Spinner /> : st === 'saved' ? <Icon name="CircleCheck" size={16} className="saved-ico" /> : <span>{index + 1}</span>}</span>;
};

// Row at module scope with a stable key: typing never remounts the row or its cells (C1, C2, C4).
export const EditRow = memo(function EditRow({ row, index, ariaIndex, columns, readOnly, selected, flash, wrap, typedValues, h, onSelect, onRetry, onOverwrite, onDuplicate, onInsert, onDelete, onOpen, measure, t }) {
  return (<tr role="row" aria-rowindex={ariaIndex} aria-selected={selected || undefined} ref={index === 0 ? measure : undefined} className={`${flash ? 'saved-flash' : ''} ${row.status === 'error' || Object.keys(row.errors).length ? 'row-invalid' : ''}`} onBlur={e => h.leaveRow(row._key, e)}>
    {!readOnly && <td role="gridcell" aria-colindex={1} className="sel-col sticky-col"><input type="checkbox" aria-label={t('dt.selectRow')} checked={selected} onClick={e => onSelect(row._key, e)} onChange={() => {}} /></td>}
    <td role="gridcell" aria-colindex={readOnly ? 1 : 2} className="status-col"><StatusMark row={row} index={index} t={t} />
      {row.errors._row && <span className="sr-only">{row.errors._row}</span>}</td>
    {columns.map((c, ci) => <Cell key={c.key} rowKey={row._key} col={c} colIndex={ci + (readOnly ? 2 : 3)} value={row.data[c.key]} data={row.data} error={row.errors[c.key]} readOnly={readOnly || c.readOnly} typed={typedValues[c.key]} wrap={wrap} h={h} t={t} />)}
    <td role="gridcell" className="row-actions"><div className="acts">
      {(row.status === 'error' || row.status === 'queued') && row.errors._row && !readOnly && (row.conflict ? <Btn icon="Replace" kind="ghost" size="sm" aria-label={t('mre.overwrite')} data-tip={`${row.errors._row} — ${t('mre.overwrite')}`} onClick={() => onOverwrite(row._key)} /> : <Btn icon="RotateCw" kind="ghost" size="sm" aria-label={t('mre.retry')} data-tip={`${row.errors._row} — ${t('mre.retry')}`} onClick={() => onRetry(row._key)} />)}
      <Btn icon="SquarePen" kind="ghost" size="sm" aria-label={t('mre.openRow')} data-tip={t('mre.openRow')} onClick={() => onOpen(row._key)} />
      {!readOnly && <><Btn icon="ListPlus" kind="ghost" size="sm" aria-label={t('mre.insertBelow')} data-tip={t('mre.insertBelow')} onClick={() => onInsert(row._key)} /><Btn icon="Copy" kind="ghost" size="sm" aria-label={t('mre.duplicate')} data-tip={`${t('mre.duplicate')} (Ctrl+D)`} onClick={() => onDuplicate(row._key)} /><Btn icon="Trash2" kind="ghost" size="sm" aria-label={t('mre.delete')} data-tip={t('mre.delete')} onClick={() => onDelete(row._key)} /></>}</div></td>
  </tr>);
});

const Cell = memo(function Cell({ rowKey, col, colIndex, value, data, error, readOnly, typed, wrap, h, t }) {
  const cellId = `${rowKey}|${col.key}`;
  // A custom value switches the cell to a text field only after the choice is committed, never while typing (C7).
  const [customMode, setCustomMode] = useState(() => col.type === 'select' && col.custom && value != null && value !== '' && !(col.options || []).some(o => String(o.value ?? o) === String(value)) && !(typed || []).includes(value));
  const v = value == null ? '' : typeof value === 'object' ? (value.en ?? '') : String(value); // a primitive, never undefined (C6, C22)
  const common = { 'data-cell': cellId, 'aria-label': col.label, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? cellId + '-e' : undefined,
    onFocus: () => h.focusStart(rowKey, col, value), onBlur: () => h.blurCell(rowKey, col), onKeyDown: e => h.onKey(e, rowKey, col), onPaste: e => h.onPaste(e, rowKey, col) };
  const td = (children, extra = '') => <td role="gridcell" aria-colindex={colIndex} className={`cell ${error ? 'invalid' : ''} ${extra}`} title={!wrap && v.length > 30 ? v : undefined}>{children}{error && <span className="field-error" id={cellId + '-e'}><Icon name="CircleAlert" size={12} />{error}</span>}</td>;
  if (col.type === 'boolean') { const on = value === true || value === 'true';
    if (readOnly) return <td role="gridcell" aria-colindex={colIndex} className="cell center"><span className="small">{on ? '✓' : '—'}</span><span className="sr-only">{on ? t('common.yes') : t('common.no')}</span></td>;
    return td(<input {...common} type="checkbox" className="cell-check" checked={on} onChange={e => h.change(rowKey, col, e.target.checked)} />, 'center'); }
  if (col.type === 'multi') {
    const lbl = x => (col.options || []).find(o => String(o.value ?? o) === x)?.label ?? x;
    if (readOnly) return <td role="gridcell" aria-colindex={colIndex} className={`cell ${wrap ? '' : 'nowrap'}`}><span className="small">{splitMulti(v).map(lbl).join(', ') || '—'}</span></td>;
    return td(<MultiSelect {...common} size="md" value={v} options={col.options || []} custom={col.custom} placeholder={col.placeholder || t('select.placeholder')} invalid={!!error} onChange={e => h.change(rowKey, col, e.target.value)} />);
  }
  if (readOnly) return <td role="gridcell" aria-colindex={colIndex} className={`cell ${wrap ? '' : 'nowrap'}`}><span className="small">{col.render ? col.render(value, data) : (col.type === 'select' ? (col.options || []).find(o => String(o.value ?? o) === v)?.label ?? v : v) || '—'}</span></td>;
  if (col.type === 'select' && !customMode) return td(<Select {...common} arrowOpens={false} size="md" value={v} options={optionList(col, typed, t)} placeholder={col.placeholder || t('select.placeholder')} invalid={!!error}
    onChange={e => { if (e.target.value === CUSTOM) { setCustomMode(true); h.change(rowKey, col, ''); requestAnimationFrame(() => document.querySelector(`[data-cell="${cellId}"]`)?.focus()); } else h.change(rowKey, col, e.target.value); }} />);
  if (col.type === 'textarea' && wrap) return td(<textarea {...common} className="input" rows={col.rows || 2} value={v} placeholder={col.placeholder} onChange={e => h.change(rowKey, col, e.target.value)} />);
  return td(<input {...common} className="input md" type={col.type === 'date' ? 'date' : 'text'} inputMode={col.type === 'number' ? 'decimal' : undefined} value={v} placeholder={col.placeholder} onChange={e => h.change(rowKey, col, e.target.value)} />);
});
