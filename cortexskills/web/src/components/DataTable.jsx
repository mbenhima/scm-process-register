// Data table (FR-DA-TBL-01 – 07, FR-DA-MRE-11 – 13, NFR-DA-VDS-15).
// Toolbar: search, filter chips (field, operator, value), density toggle, column chooser, bulk-action bar.
// Table: sticky header and first column, three-state sort, columns resized (≥ 80 px) and reordered by dragging.
// Footer: "1–20 of 345", Page X of Y, page size 20 / 50 / 100 / all. Column settings, density and page size are
// user preferences kept on the server per table (TableViewPreference).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession } from '../lib/session.jsx';
import { downloadCsv } from '../lib/api.js';
import { Btn, Icon, Search, Select, Empty, Skeleton, Seg } from './ui.jsx';

const OPS = ['contains', 'eq', 'neq', 'gt', 'lt', 'empty', 'notEmpty'];
const cellText = (c, x) => { const v = c.text ? c.text(x) : c.value ? c.value(x) : x[c.key]; return v == null ? '' : typeof v === 'object' ? (v.en ?? JSON.stringify(v)) : String(v); };
const sortVal = (c, x) => (c.sortValue ? c.sortValue(x) : c.text ? c.text(x) : c.value ? c.value(x) : x[c.key]) ?? '';
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function matches(f, c, x) {
  const raw = cellText(c, x); const v = norm(raw); const q = norm(f.value ?? '');
  switch (f.op) {
    case 'contains': return v.includes(q);
    case 'eq': return v === q; case 'neq': return v !== q;
    case 'gt': return Number(sortVal(c, x)) > Number(f.value) || (isNaN(Number(f.value)) && raw > f.value);
    case 'lt': return Number(sortVal(c, x)) < Number(f.value) || (isNaN(Number(f.value)) && raw < f.value);
    case 'empty': return !raw || raw === '—'; case 'notEmpty': return !!raw && raw !== '—';
    default: return true;
  }
}
const keyOf = (x, i, rowKey) => (rowKey ? rowKey(x) : x.id ?? x.key ?? x.code ?? x.ref ?? `row-${i}`);

export function DataTable({ columns, rows, onRow, csvName, search = true, empty, id, rowKey, selectable, bulkActions, loading, error, onRetry, toolbar, pageSize: initialSize, dense, autoHeight, caption, pin: pinDefault = true }) {
  const { t } = useI18n(); const { prefs, queuePrefs } = useSession();
  const tableId = id || csvName || columns.map(c => c.key).join('-').slice(0, 60);
  const tp = prefs?.tables?.[tableId] || {};
  const density = dense ? 'compact' : prefs?.density || 'comfortable';
  const [q, setQ] = useState(''); const [filters, setFilters] = useState([]); const [adding, setAdding] = useState(null);
  const [sort, setSort] = useState(tp.sort || null); const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialSize ?? prefs?.pageSize ?? 20);
  const [sel, setSel] = useState(() => new Set()); const anchor = useRef(null);
  const [colMenu, setColMenu] = useState(false); const [dragKey, setDragKey] = useState(null); const [overKey, setOverKey] = useState(null);
  const [widths, setWidths] = useState(tp.widths || {});
  const savePref = useCallback(patch => queuePrefs({ tables: { [tableId]: { ...tp, widths, sort, ...patch } } }), [queuePrefs, tableId, tp, widths, sort]);

  // Column order and visibility from the user's preference; the first column is pinned and cannot be hidden.
  const ordered = useMemo(() => {
    const order = tp.order?.length ? tp.order : columns.map(c => c.key);
    const byKey = Object.fromEntries(columns.map(c => [c.key, c]));
    const list = [...order.map(k => byKey[k]).filter(Boolean), ...columns.filter(c => !order.includes(c.key))];
    const first = columns[0]; if (!first) return []; return [first, ...list.filter(c => c.key !== first.key)];
  }, [columns, tp.order]);
  const hidden = useMemo(() => new Set(tp.hidden || []), [tp.hidden]);
  const visible = ordered.filter((c, i) => i === 0 || !hidden.has(c.key));
  const pin = tp.pin ?? pinDefault;

  const filtered = useMemo(() => {
    let r = rows || [];
    if (q) { const s = norm(q); r = r.filter(x => columns.some(c => norm(cellText(c, x)).includes(s))); }
    for (const f of filters) { const c = columns.find(c => c.key === f.key); if (c) r = r.filter(x => matches(f, c, x)); }
    if (sort) { const c = columns.find(c => c.key === sort.key); if (c) r = [...r].sort((a, b) => { const A = sortVal(c, a), B = sortVal(c, b); const n = typeof A === 'number' && typeof B === 'number' ? A - B : String(A).localeCompare(String(B), undefined, { numeric: true }); return sort.dir * n; }); }
    return r;
  }, [rows, q, filters, sort, columns]);
  const pages = size ? Math.max(1, Math.ceil(filtered.length / size)) : 1;
  const cur = Math.min(page, pages - 1);
  const shown = size ? filtered.slice(cur * size, cur * size + size) : filtered;
  useEffect(() => { setPage(0); }, [q, filters, size]);

  const cycleSort = key => setSort(s => { const n = !s || s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null; savePref({ sort: n }); return n; });
  const setDensity = d => queuePrefs({ density: d });
  const setPageSize = v => { const n = Number(v); setSize(n); queuePrefs({ pageSize: n }); };
  const toggleCol = key => { const h = new Set(hidden); h.has(key) ? h.delete(key) : h.add(key); savePref({ hidden: [...h] }); };
  const reorder = (from, to) => { if (!from || !to || from === to || to === columns[0].key) return; const keys = ordered.map(c => c.key).filter(k => k !== from); keys.splice(keys.indexOf(to), 0, from); savePref({ order: keys }); };
  const resetView = () => { setWidths({}); setSort(null); queuePrefs({ tables: { [tableId]: { order: undefined, hidden: [], widths: {}, sort: null, pin: true } } }); };

  // Column resize from the edge of the header, by pointer or keyboard (minimum 80 px).
  const startResize = (e, key) => {
    e.preventDefault(); e.stopPropagation(); const th = e.currentTarget.parentElement; const x0 = e.clientX; const w0 = th.getBoundingClientRect().width; const rtl = document.dir === 'rtl';
    const move = ev => { const w = Math.max(80, Math.round(w0 + (rtl ? x0 - ev.clientX : ev.clientX - x0))); setWidths(ws => ({ ...ws, [key]: w })); };
    const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); setWidths(ws => { savePref({ widths: ws }); return ws; }); };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  };
  const keyResize = (e, key) => { if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return; e.preventDefault(); const th = e.currentTarget.parentElement; const w = Math.max(80, Math.round((widths[key] || th.getBoundingClientRect().width) + (e.key === 'ArrowRight' ? 16 : -16) * (document.dir === 'rtl' ? -1 : 1))); const next = { ...widths, [key]: w }; setWidths(next); savePref({ widths: next }); };

  // Selection: checkbox per row, Shift-click selects a range, the header checkbox selects every filtered row (FR-DA-MRE-12).
  const keys = filtered.map((x, i) => keyOf(x, i, rowKey));
  const toggleRow = (k, e) => { setSel(s => { const n = new Set(s); if (e?.shiftKey && anchor.current != null) { const a = keys.indexOf(anchor.current), b = keys.indexOf(k); const [lo, hi] = a < b ? [a, b] : [b, a]; for (let i = lo; i <= hi; i++) n.add(keys[i]); } else n.has(k) ? n.delete(k) : n.add(k); return n; }); anchor.current = k; };
  const allSel = keys.length > 0 && keys.every(k => sel.has(k)); const someSel = !allSel && keys.some(k => sel.has(k));
  const selectedRows = filtered.filter((x, i) => sel.has(keys[i]));

  const csv = () => { const cols = visible.filter(c => !c.noCsv); downloadCsv(csvName || 'export', cols.map(c => (typeof c.label === 'string' ? c.label : c.key)), filtered.map(x => cols.map(c => cellText(c, x)))); };
  const filterable = columns.filter(c => c.label && typeof c.label === 'string' && !c.noFilter);
  const from = filtered.length ? cur * (size || filtered.length) + 1 : 0; const to = size ? Math.min(filtered.length, (cur + 1) * size) : filtered.length;
  const isEmpty = !loading && !error && !(rows || []).length; const isFilteredEmpty = !loading && !error && (rows || []).length > 0 && !filtered.length;

  return (<div className="dt">
    {(search || csvName || toolbar || filterable.length > 0) && <div className="dt-toolbar">
      {search && <Search value={q} onChange={setQ} placeholder={t('common.search')} />}
      {filterable.length > 0 && <div className="rel"><Btn icon="ListFilter" size="sm" aria-expanded={!!adding} onClick={() => setAdding(a => (a ? null : { key: filterable[0].key, op: 'contains', value: '' }))}>{t('dt.filter')}{filters.length > 0 && <span className="count-badge">{filters.length}</span>}</Btn>
        {adding && <FilterPopover columns={filterable} draft={adding} setDraft={setAdding} onAdd={() => { setFilters(f => [...f, adding]); setAdding(null); }} onClose={() => setAdding(null)} />}</div>}
      <span className="spacer" />
      {toolbar}
      <Seg size="sm" label={t('dt.density')} value={density} onChange={setDensity} options={[{ id: 'comfortable', label: t('dt.comfortable') }, { id: 'compact', label: t('dt.compact') }]} />
      <div className="rel"><Btn icon="Columns3" size="sm" kind="ghost" aria-label={t('dt.columns')} aria-expanded={colMenu} onClick={() => setColMenu(m => !m)} />
        {colMenu && <ColumnMenu columns={ordered} hidden={hidden} pin={pin} onToggle={toggleCol} onPin={v => savePref({ pin: v })} onReset={resetView} onClose={() => setColMenu(false)} />}</div>
      {csvName && <Btn icon="Download" size="sm" kind="ghost" onClick={csv}>CSV</Btn>}
    </div>}
    {filters.length > 0 && <div className="dt-filters">{filters.map((f, i) => { const c = columns.find(x => x.key === f.key); return <span key={f.key + f.op + i} className="filter-chip">{c?.label} · {t('dt.op.' + f.op)}{!['empty', 'notEmpty'].includes(f.op) && <> “{f.value}”</>}<button type="button" aria-label={t('dt.removeFilter')} onClick={() => setFilters(fs => fs.filter((_, j) => j !== i))}><Icon name="X" size={14} /></button></span>; })}
      <Btn size="sm" kind="ghost" onClick={() => setFilters([])}>{t('dt.clearAll')}</Btn></div>}
    {selectable && sel.size > 0 && <div className="bulk-bar" role="region" aria-label={t('dt.bulk')}><span>{t('dt.selected', { n: sel.size })}</span>{(bulkActions || []).map(a => <Btn key={a.label} size="sm" icon={a.icon} kind={a.danger ? 'danger' : ''} onClick={async () => { await a.onClick(selectedRows); setSel(new Set()); }}>{a.label}</Btn>)}<Btn size="sm" kind="ghost" onClick={() => setSel(new Set())}>{t('dt.clearSelection')}</Btn></div>}
    {error ? <div className="table-wrap auto-h"><Empty icon="TriangleAlert" title={t('dt.errorTitle')} text={error.message || t('err.server')} action={onRetry && <Btn kind="primary" icon="RotateCw" onClick={onRetry}>{t('common.retry')}</Btn>} /></div>
      : isEmpty ? <div className="table-wrap auto-h">{typeof empty === 'object' && empty ? <Empty icon={empty.icon || 'Inbox'} title={empty.title} text={empty.text} action={empty.action} /> : <Empty title={empty || t('common.noRows')} text={t('dt.emptyText')} />}</div>
      : isFilteredEmpty ? <div className="table-wrap auto-h"><Empty icon="SearchX" title={t('dt.noMatch')} text={t('dt.noMatchText')} action={<Btn kind="primary" onClick={() => { setQ(''); setFilters([]); }}>{t('dt.clearFilters')}</Btn>} /></div>
      : <div className={`table-wrap ${autoHeight ? 'auto-h' : ''}`}><table className={`tbl ${density === 'compact' ? 'compact' : ''}`}>{caption && <caption className="sr-only">{caption}</caption>}
        <thead><tr>
          {selectable && <th className="sel-col sticky-col" scope="col"><input type="checkbox" aria-label={t('dt.selectAll')} checked={allSel} ref={el => { if (el) el.indeterminate = someSel; }} onChange={() => setSel(allSel ? new Set() : new Set(keys))} /></th>}
          {visible.map((c, i) => { const s = sort?.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'; const w = widths[c.key] || c.width;
            return <th key={c.key} scope="col" aria-sort={c.noSort ? undefined : s} className={`${i === 0 && pin && !selectable ? 'sticky-col' : ''} ${c.num ? 'num' : ''} ${overKey === c.key ? 'drop-target' : ''}`} style={w ? { width: w, minWidth: w, maxWidth: w } : undefined}
              draggable={i > 0} onDragStart={e => { setDragKey(c.key); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={e => { if (dragKey && i > 0) { e.preventDefault(); setOverKey(c.key); } }} onDragLeave={() => setOverKey(null)} onDrop={e => { e.preventDefault(); reorder(dragKey, c.key); setDragKey(null); setOverKey(null); }} onDragEnd={() => { setDragKey(null); setOverKey(null); }}>
              <div className="th">{c.noSort ? <span className="th-label">{c.label}</span> : <button type="button" className="sort" onClick={() => cycleSort(c.key)} aria-label={typeof c.label === 'string' ? t('dt.sortBy', { c: c.label }) : undefined}><span className="th-label">{c.label}</span><Icon className="sort-ico" size={14} name={s === 'ascending' ? 'ArrowUp' : s === 'descending' ? 'ArrowDown' : 'ArrowUpDown'} /></button>}</div>
              <span className="col-resize" role="separator" aria-orientation="vertical" tabIndex={0} aria-label={t('dt.resizeCol', { c: typeof c.label === 'string' ? c.label : c.key })} onPointerDown={e => startResize(e, c.key)} onKeyDown={e => keyResize(e, c.key)} onClick={e => e.stopPropagation()} /></th>; })}</tr></thead>
        <tbody>
          {loading && !(rows || []).length ? [0, 1, 2, 3, 4, 5].map(i => <tr key={'sk' + i} className="skeleton-row">{selectable && <td />}{visible.map(c => <td key={c.key}><Skeleton /></td>)}</tr>)
            : shown.map((x, ri) => { const k = keyOf(x, cur * (size || 0) + ri, rowKey); return <tr key={k} aria-selected={selectable ? sel.has(k) : undefined} className={onRow ? 'clickable' : ''} onClick={onRow ? () => onRow(x) : undefined} tabIndex={onRow ? 0 : undefined} onKeyDown={onRow ? e => e.key === 'Enter' && e.target === e.currentTarget && onRow(x) : undefined}>
              {selectable && <td className="sel-col sticky-col" onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={t('dt.selectRow')} checked={sel.has(k)} onChange={() => {}} onClick={e => toggleRow(k, e)} /></td>}
              {visible.map((c, i) => <td key={c.key} className={`${i === 0 && pin && !selectable ? 'sticky-col' : ''} ${c.num ? 'num' : ''} ${c.nowrap || /^(id|code|ref|key|uft|mp|e2e)$/i.test(c.key) ? 'nowrap' : ''} ${c.wrap !== false ? 'wrap-cell' : ''}`}>{c.render ? c.render(x) : cellText(c, x) || '—'}</td>)}</tr>; })}
        </tbody></table></div>}
    {!error && !isEmpty && !isFilteredEmpty && (filtered.length > 20 || size !== 20) && <div className="dt-footer">
      <span>{t('dt.range', { from, to, n: filtered.length })}</span>
      <div className="pager"><span>{t('dt.pageSize')}</span><Select size="sm" value={String(size)} onChange={e => setPageSize(e.target.value)} aria-label={t('dt.pageSize')} options={[{ value: '20', label: '20' }, { value: '50', label: '50' }, { value: '100', label: '100' }, { value: '0', label: t('dt.all') }]} />
        <Btn icon={document.dir === 'rtl' ? 'ChevronRight' : 'ChevronLeft'} size="sm" kind="ghost" aria-label={t('dt.prev')} disabled={cur === 0} onClick={() => setPage(cur - 1)} /><span>{t('dt.page', { p: cur + 1, n: pages })}</span><Btn icon={document.dir === 'rtl' ? 'ChevronLeft' : 'ChevronRight'} size="sm" kind="ghost" aria-label={t('dt.next')} disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} /></div></div>}
    {!error && !isEmpty && !isFilteredEmpty && filtered.length <= 20 && size === 20 && <div className="dt-footer"><span>{t('common.rows', { n: filtered.length })}</span></div>}
  </div>);
}

function FilterPopover({ columns, draft, setDraft, onAdd, onClose }) {
  const { t } = useI18n(); const ref = useRef(null);
  useEffect(() => { const out = e => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('.listbox')) onClose(); }; document.addEventListener('mousedown', out); return () => document.removeEventListener('mousedown', out); }, [onClose]);
  const needsValue = !['empty', 'notEmpty'].includes(draft.op);
  return <div className="menu start" ref={ref} role="dialog" aria-label={t('dt.addFilter')} style={{ padding: 'var(--aiv-space-4)', width: 320 }} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } if (e.key === 'Enter' && (!needsValue || draft.value)) { e.preventDefault(); onAdd(); } }}>
    <div className="stack">
      <Select size="md" aria-label={t('dt.field')} value={draft.key} onChange={e => setDraft(d => ({ ...d, key: e.target.value }))} options={columns.map(c => ({ value: c.key, label: c.label }))} />
      <Select size="md" aria-label={t('dt.operator')} value={draft.op} onChange={e => setDraft(d => ({ ...d, op: e.target.value }))} options={OPS.map(o => ({ value: o, label: t('dt.op.' + o) }))} />
      {needsValue && <input className="input md" aria-label={t('dt.value')} placeholder={t('dt.value')} value={draft.value} onChange={e => setDraft(d => ({ ...d, value: e.target.value }))} />}
      <div className="row between"><Btn size="sm" kind="ghost" onClick={onClose}>{t('common.cancel')}</Btn><Btn size="sm" kind="primary" disabled={needsValue && !draft.value} onClick={onAdd}>{t('dt.addFilter')}</Btn></div></div></div>;
}
function ColumnMenu({ columns, hidden, pin, onToggle, onPin, onReset, onClose }) {
  const { t } = useI18n(); const ref = useRef(null);
  useEffect(() => { const out = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); }; const k = e => { if (e.key === 'Escape') onClose(); }; document.addEventListener('mousedown', out); ref.current?.addEventListener('keydown', k); return () => document.removeEventListener('mousedown', out); }, [onClose]);
  return <div className="menu" ref={ref} role="dialog" aria-label={t('dt.columns')}><div className="col-menu">
    <div className="eyebrow">{t('dt.columns')}</div>
    {columns.map((c, i) => <label key={c.key}><input type="checkbox" checked={i === 0 || !hidden.has(c.key)} disabled={i === 0} onChange={() => onToggle(c.key)} />{typeof c.label === 'string' && c.label ? c.label : c.key}</label>)}
    <hr className="divider" style={{ margin: 'var(--aiv-space-2) 0' }} />
    <label><input type="checkbox" checked={pin} onChange={e => onPin(e.target.checked)} />{t('dt.pinFirst')}</label>
    <Btn size="sm" kind="ghost" icon="RotateCcw" onClick={onReset}>{t('dt.resetView')}</Btn></div></div>;
}
