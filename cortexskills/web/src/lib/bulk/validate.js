// Cell and row validation of a Multi-Entry (FR-DA-MRE-08). Pure functions, shared by the grid, the Row Editor, the
// Paste Preview and the import wizard, and tested on their own. `t(key, params)` translates the message.
//
// Column rules: required; type number (min, max, decimals), date (notFuture), select (options, custom), boolean;
// minLength / maxLength for text; a column may add its own check with validate(value, data).

export const isEmpty = v => v == null || String(v).trim() === '';
const today = () => new Date().toISOString().slice(0, 10);

/** The first problem of a value for its column, as a translated message, or null. */
export function validateCell(col, value, data = {}, t = (k, p) => `${k}${p ? ' ' + JSON.stringify(p) : ''}`) {
  if (col.required && isEmpty(value)) return t('mre.required', { field: col.label });
  if (isEmpty(value)) return col.validate ? col.validate(value, data) || null : null;
  const s = String(value).trim();
  if (col.type === 'number') {
    const n = Number(s); if (Number.isNaN(n)) return t('mre.number');
    if (col.min != null && n < col.min) return t('mre.min', { min: col.min });
    if (col.max != null && n > col.max) return t('mre.max', { max: col.max });
    if (col.decimals != null && (s.split('.')[1] || '').length > col.decimals) return t('mre.decimals', { n: col.decimals });
  }
  if (col.type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}/.test(s) || Number.isNaN(Date.parse(s))) return t('mre.date');
    if (col.notFuture && s.slice(0, 10) > today()) return t('mre.future');
  }
  if (col.type === 'select' && !col.custom && col.options && !col.options.some(o => String(o.value ?? o) === s)) return t('mre.notInList');
  if (col.type === 'multi' && !col.custom && col.options && s.split(/\s*[,;|]\s*/).filter(Boolean).some(x => !col.options.some(o => String(o.value ?? o) === x))) return t('mre.notInList');
  if (col.type === 'boolean' && ![true, false, 'true', 'false'].includes(value)) return t('mre.notInList');
  if (col.minLength != null && s.length < col.minLength) return t('mre.minLength', { n: col.minLength });
  if (col.maxLength != null && s.length > col.maxLength) return t('mre.maxLength', { n: col.maxLength });
  return col.validate ? col.validate(value, data) || null : null;
}

/** Every problem of a row, by column key. */
export function validateRow(columns, data, t) {
  const errors = {};
  for (const c of columns) { if (c.readOnly || c.computed) continue; const e = validateCell(c, data[c.key], data, t); if (e) errors[c.key] = e; }
  return errors;
}

/** Rows that repeat another row, or an existing record, on the key columns (first required column by default). */
export function duplicates(rows, columns, existing = [], keys) {
  // The identifying columns: those marked key, else the first required text column (the object of the table).
  const k = keys?.length ? keys : columns.some(c => c.key && c.isKey) ? columns.filter(c => c.isKey).map(c => c.key)
    : [(columns.find(c => c.required && !c.readOnly && (!c.type || c.type === 'text' || c.type === 'textarea' || (c.type === 'select' && c.custom))) || columns.find(c => c.required) || columns[0])?.key].filter(Boolean);
  const sig = d => k.map(x => String(d?.[x] ?? '').trim().toLowerCase()).join('\u0001');
  const have = new Set(existing.map(sig).filter(s => s.replace(/\u0001/g, '')));
  const seen = new Map(); const out = new Map();
  rows.forEach((d, i) => {
    const s = sig(d); if (!s.replace(/\u0001/g, '')) return;
    if (have.has(s)) out.set(i, { kind: 'existing' });
    else if (seen.has(s)) out.set(i, { kind: 'file', of: seen.get(s) });
    else seen.set(s, i);
  });
  return out;
}
