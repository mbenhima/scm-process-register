// Export of a Multi-Entry: the current view (filters and sort) or the selected rows, with the grid's column titles,
// as CSV (UTF-8 with BOM) or Excel. Text a spreadsheet would run as a formula is neutralized (NFR-DA-SEC-21).

export const neutralize = v => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) && !/^[-+]?\d[\d\s.,]*$/.test(v) ? "'" + v : v);

/** File name <parent-name>-<yyyy-mm-dd>.<ext>, safe on every system. */
export function exportName(parent, ext, date = new Date()) {
  const base = String(parent || 'export').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'export';
  return `${base}-${date.toISOString().slice(0, 10)}.${ext}`;
}
/** Display value of a cell for export: the label of a list value, Yes/No for a tick. */
export function cellOut(col, v, t = k => k) {
  if (col.type === 'boolean') return v === true || v === 'true' ? t('common.yes') : t('common.no');
  if (col.type === 'select') return (col.options || []).find(o => String(o.value ?? o) === String(v))?.label ?? (v ?? '');
  if (v && typeof v === 'object') return v.en ?? JSON.stringify(v);
  return v ?? '';
}
/** Header and rows (arrays of display values) for the given columns. */
export function table(columns, rows, t) {
  return { header: columns.map(c => c.label), rows: rows.map(d => columns.map(c => cellOut(c, d[c.key], t))) };
}
export function toCSV(columns, rows, t, sep = ',') {
  const { header, rows: body } = table(columns, rows, t);
  const esc = v => { const s = String(neutralize(v) ?? ''); return /[",\n;\t]/.test(s) || s.includes(sep) ? `"${s.replace(/"/g, '""')}"` : s; };
  return '﻿' + [header, ...body].map(r => r.map(esc).join(sep)).join('\r\n');
}
