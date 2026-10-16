// Cell editors of a Multi-Entry, defined at module scope so a cell keeps its identity, element
// type and focus across renders (NFR-DA-FOC-04, -06, -07): the value given to a field is always
// of the primitive type it edits, never undefined or an object.
import { memo } from 'react';
import { tx } from '../ui.jsx';

export const labelText = (label, t, lang) => (label && typeof label === 'object' ? tx(label, lang) : t(String(label ?? '')));
export const optionList = (col) => (col.options || []).map(o => (o !== null && typeof o === 'object' && 'value' in o ? o : { value: o, label: o }));
export const optionLabel = (col, o, { t, lang, L }) => (o.label && typeof o.label === 'object' ? tx(o.label, lang) : col.translate ? L(String(o.label)) : String(o.label ?? o.value));

/** The text of a value, as shown, searched, copied and exported. */
export function displayValue(col, value, row, ctx) {
  if (col.display) return col.display(value, row) ?? '';
  if (value === null || value === undefined) return '';
  if (col.type === 'checkbox') return value ? ctx.t('Yes') : ctx.t('No');
  if (col.type === 'select' || col.type === 'combo') {
    const o = optionList(col).find(x => x.value === value || (typeof value === 'object' && value && JSON.stringify(x.value) === JSON.stringify(value)));
    if (o) return optionLabel(col, o, ctx);
  }
  if (Array.isArray(value)) return value.map(v => (v && typeof v === 'object' ? tx(v.name ?? v, ctx.lang) : String(v))).join(', ');
  if (typeof value === 'object') return tx(value.name ?? value, ctx.lang);
  return String(value);
}

/** The value a plain editor shows: text for multilingual values, '' for missing ones. */
const editText = (v, lang) => (v === null || v === undefined ? '' : typeof v === 'object' && !Array.isArray(v) ? tx(v, lang) : Array.isArray(v) ? v.map(x => tx(x?.name ?? x, lang)).join(', ') : String(v));

export const CellEditor = memo(function CellEditor({ col, value, onChange, big, wrap, row, ctx, renderCell, aria, id, disabled }) {
  const { t, lang, L } = ctx;
  if (renderCell) { const node = renderCell(col, value, onChange, { row, big, aria, id }); if (node !== undefined) return node; }
  const common = { id, 'aria-label': aria, disabled, className: big ? 'input' : 'grid-input' };
  switch (col.type) {
    case 'textarea': return <textarea {...common} className={big ? 'textarea' : 'grid-input'} rows={big ? 6 : 1} wrap={big || wrap ? 'soft' : 'off'} value={editText(value, lang)} onChange={e => onChange(e.target.value)} />;
    case 'number': return <input {...common} type="number" inputMode="decimal" min={col.min} max={col.max} value={value === null || value === undefined ? '' : value} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'score': return <select {...common} value={value === null || value === undefined ? '' : String(value)} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}><option value="">—</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select>;
    case 'date': return <input {...common} type="date" value={typeof value === 'string' ? value.slice(0, 10) : ''} onChange={e => onChange(e.target.value)} />;
    case 'checkbox': return <input id={id} aria-label={aria} disabled={disabled} type="checkbox" className="grid-check" checked={!!value} onChange={e => onChange(e.target.checked)} />;
    case 'select': {
      const opts = optionList(col);
      const cur = value === null || value === undefined ? '' : typeof value === 'object' ? (opts.find(o => JSON.stringify(o.value) === JSON.stringify(value))?.value ?? '') : value;
      const known = cur === '' || opts.some(o => o.value === cur);
      return (
        <select {...common} value={String(cur)} onChange={e => { const o = opts.find(x => String(x.value) === e.target.value); onChange(o ? o.value : e.target.value); }}>
          {!col.required && <option value="">—</option>}
          {col.required && cur === '' && <option value="">{t('Choose…')}</option>}
          {!known && <option value={String(cur)}>{String(cur)}</option>}
          {opts.map(o => <option key={String(o.value)} value={String(o.value)}>{optionLabel(col, o, { t, lang, L })}</option>)}
        </select>
      );
    }
    default: return <input {...common} value={editText(value, lang)} placeholder={col.placeholder || undefined} onChange={e => onChange(e.target.value)} />;
  }
});
