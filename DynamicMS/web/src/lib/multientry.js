// Multi-record entry logic (SRS 4.49, FR-DA-MRE-01 to 35), kept free of React so that it is
// tested on its own (NFR-DA-PORT-05): clipboard and file parsing, column mapping, value
// conversion, validation, the view (search, filters, sort), undo and redo, batching,
// Draft Backup with Edit Conflicts, export and retry timing.

// ---------------------------------------------------------------- values
/** Default message function: English text with its {placeholders} filled in. */
export const plain = (s, vars) => Object.entries(vars || {}).reduce((out, [k, v]) => out.split(`{${k}}`).join(String(v)), String(s));
export const isEmpty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'string' && !v.trim());

/** Lower case without accents or surrounding spaces, to compare labels typed or pasted. */
export const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

let seq = 0;
/** A client key for a row (never derived from its values or its position). */
export const newKey = () => `k${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---------------------------------------------------------------- clipboard and files
/** Splits delimited text (tab, semicolon or comma) with quoted fields; keeps line breaks inside quotes. */
export function parseDelimited(text, delimiter) {
  const src = String(text ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const d = delimiter || detectDelimiter(src);
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
    } else if (ch === '"' && cell === '') q = true;
    else if (ch === d) { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  while (rows.length && rows[rows.length - 1].every(c => c === '')) rows.pop();
  return { rows, delimiter: d };
}
export function detectDelimiter(text) {
  const head = String(text).split('\n').slice(0, 5).join('\n');
  const count = (c) => (head.match(new RegExp(c === '\t' ? '\t' : `\\${c}`, 'g')) || []).length;
  if (count('\t')) return '\t';
  const sc = count(';'); const cm = count(',');
  return sc > cm ? ';' : cm ? ',' : '\t';
}

/** Reads the cells of the first HTML table of a clipboard (Word, Excel, web page): text only. */
export function parseHtmlTable(html, DOMParserImpl = typeof DOMParser !== 'undefined' ? DOMParser : null) {
  if (!html || !DOMParserImpl || !/<table/i.test(html)) return null;
  const doc = new DOMParserImpl().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;
  const rows = [];
  for (const tr of table.querySelectorAll('tr')) {
    const cells = [];
    for (const td of tr.querySelectorAll('th, td')) {
      // Text only: markup, styles, scripts, images and objects are discarded (NFR-DA-SEC-21).
      td.querySelectorAll('script, style, img, object, embed, svg').forEach(x => x.remove());
      td.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
      td.querySelectorAll('p, div, li').forEach(p => p.append('\n'));
      const text = (td.textContent || '').replace(/ /g, ' ').replace(/\n{2,}/g, '\n').replace(/^\s+|\s+$/g, '');
      const span = Math.max(1, Math.min(50, Number(td.getAttribute('colspan')) || 1));
      cells.push(text); for (let k = 1; k < span; k++) cells.push('');
    }
    if (cells.length) rows.push(cells);
  }
  return rows.length ? rows : null;
}

/** The rows of a clipboard: an HTML table first, then tab-, semicolon- or comma-separated text. */
export function parseClipboard({ html, text }, DOMParserImpl) {
  const fromHtml = parseHtmlTable(html, DOMParserImpl);
  if (fromHtml) return { rows: trimRows(fromHtml), source: 'html' };
  const t = String(text ?? '');
  if (!t.trim()) return { rows: [], source: 'text' };
  const { rows, delimiter } = parseDelimited(t);
  return { rows: trimRows(rows), source: delimiter === '\t' ? 'tsv' : 'csv' };
}
const trimRows = (rows) => {
  const w = Math.max(0, ...rows.map(r => r.length));
  return rows.filter(r => r.some(c => String(c).trim() !== '')).map(r => Array.from({ length: w }, (_, i) => r[i] ?? ''));
};
/** One value pasted in one cell is typed text, not a block of records. */
export const isBlock = (rows) => rows.length > 1 || (rows[0] && rows[0].length > 1);

// ---------------------------------------------------------------- column mapping
const labelOf = (c, lang) => (typeof c.label === 'object' && c.label ? (c.label[lang] ?? c.label.en ?? '') : String(c.label ?? c.key));
/** True when the first row reads as column titles (it names fields of the table). */
export function looksLikeHeader(first, columns, lang) {
  if (!first) return false;
  const names = new Set(columns.flatMap(c => [norm(labelOf(c, lang)), norm(c.key), ...(typeof c.label === 'object' && c.label ? Object.values(c.label).map(norm) : [])]));
  const hits = first.filter(v => names.has(norm(v))).length;
  return hits >= Math.max(1, Math.ceil(first.filter(v => String(v).trim()).length / 2));
}
/**
 * Proposes the field of each pasted column: by header name when the block has titles, then
 * by position from the start column; a confirmed mapping saved for the table comes first.
 * Returns an array (one entry per pasted column) of column keys or null (ignored).
 */
export function proposeMapping({ header, width, columns, startKey, saved, lang = 'en' }) {
  const editable = columns.filter(c => !c.readOnly && !c.computed);
  if (saved && saved.length === width && saved.every(k => k === null || editable.some(c => c.key === k))) return [...saved];
  const out = Array(width).fill(null);
  const used = new Set();
  if (header) {
    header.forEach((h, i) => {
      const n = norm(h);
      const c = editable.find(x => !used.has(x.key) && (norm(labelOf(x, lang)) === n || norm(x.key) === n || (typeof x.label === 'object' && x.label && Object.values(x.label).some(v => norm(v) === n))));
      if (c) { out[i] = c.key; used.add(c.key); }
    });
    if (out.some(Boolean)) return out;
  }
  const s = Math.max(0, editable.findIndex(c => c.key === startKey));
  for (let i = 0; i < width; i++) { const c = editable[s + i]; if (c && !used.has(c.key)) { out[i] = c.key; used.add(c.key); } }
  return out;
}
/** Every required field of the table has a column (FR-DA-MRE-30, stage 3). */
export const missingRequired = (mapping, columns) => columns.filter(c => c.required && !c.readOnly && !mapping.includes(c.key)).map(c => c.key);

// ---------------------------------------------------------------- conversion and validation
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Reads a number typed in the user's locale: "1 234,5" (fr), "1,234.5" (en). */
export function parseLocaleNumber(s, locale = 'en') {
  let t = String(s ?? '').replace(/[\s  ]/g, '');
  if (!t) return null;
  if (/^[+-]?\d+([.,]\d+)?%?$/.test(t)) return Number(t.replace(',', '.').replace('%', ''));
  const comma = /^(fr|ar|de|es|it|pt)/.test(locale);
  t = comma ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  const n = Number(t.replace('%', ''));
  return Number.isFinite(n) ? n : NaN;
}
/** Reads a date: ISO, or day/month/year (month/day/year under en-US), or an Excel serial. */
export function parseLocaleDate(s, locale = 'en') {
  const t = String(s ?? '').trim();
  if (!t) return '';
  if (DATE_ISO.test(t)) return t;
  if (/^\d{4}-\d{2}-\d{2}T/.test(t)) return t.slice(0, 10);
  if (/^\d{5}(\.\d+)?$/.test(t)) { const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+t) * 86400000); return d.toISOString().slice(0, 10); }
  const m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!m) return null;
  let [a, b, y] = [+m[1], +m[2], +m[3]];
  if (y < 100) y += 2000;
  const us = locale === 'en-US';
  const [d, mo] = us ? [b, a] : [a, b];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
const firstLine = (s) => String(s ?? '').trim();

/**
 * Converts a pasted or imported text to the value of a field (FR-DA-MRE-21). Returns
 * { value, error } — the value is always kept, the error flags the cell.
 * col: { type, options: [{value,label}] | strings, custom (allows values outside the list), parse }
 */
export function convertValue(raw, col, { locale = 'en', lang = 'en', t = plain } = {}) {
  const text = String(raw ?? '').replace(/\r\n?/g, '\n');
  if (col.parse) return col.parse(text, { locale, lang });
  const v = text.trim();
  if (!v) return { value: col.type === 'checkbox' ? false : '' };
  switch (col.type) {
    case 'number': case 'score': {
      const n = parseLocaleNumber(v, locale);
      return Number.isNaN(n) ? { value: v, error: t('Enter a number') } : { value: n };
    }
    case 'date': {
      const d = parseLocaleDate(v, locale);
      return d === null ? { value: v, error: t('Enter a date') } : { value: d };
    }
    case 'checkbox': return { value: /^(1|true|yes|oui|vrai|x|✓|نعم)$/i.test(v) };
    case 'select': case 'combo': {
      const opts = (col.options || []).map(o => (typeof o === 'object' && o !== null && 'value' in o ? o : { value: o, label: o }));
      const n = norm(v);
      const hit = opts.find(o => norm(o.value) === n || norm(typeof o.label === 'object' ? (o.label[lang] ?? o.label.en) : o.label) === n || (typeof o.label === 'object' && o.label && Object.values(o.label).some(x => norm(x) === n)));
      if (hit) return { value: hit.value };
      // Not in the list: kept as a Custom value (FR-DA-DEU-02), flagged only when the list is closed.
      return col.custom === false ? { value: v, error: t('Not in the list') } : { value: v };
    }
    default: return { value: col.type === 'textarea' ? text.trim() : firstLine(text) };
  }
}

/** The message of an invalid cell, or null (FR-DA-MRE-08). */
export function validateCell(value, col, row, t = plain) {
  if (col.readOnly || col.computed) return null;
  if (col.required && isEmpty(value)) return t('Required');
  if (!isEmpty(value)) {
    if ((col.type === 'number' || col.type === 'score') && !Number.isFinite(Number(value))) return t('Enter a number');
    if (col.type === 'number' && col.min !== undefined && Number(value) < col.min) return t('Minimum {n}', { n: col.min });
    if (col.type === 'number' && col.max !== undefined && Number(value) > col.max) return t('Maximum {n}', { n: col.max });
    if (col.type === 'score' && !(Number(value) >= 1 && Number(value) <= 5)) return t('From 1 to 5');
    if (col.type === 'date' && !DATE_ISO.test(String(value))) return t('Enter a date');
    if (col.type === 'select' && col.custom === false && (col.options || []).length) {
      const vals = col.options.map(o => (typeof o === 'object' && o !== null && 'value' in o ? o.value : o));
      if (!vals.includes(value)) return t('Not in the list');
    }
  }
  if (col.validate) return col.validate(value, row) || null;
  return null;
}
/** Every error of a row: { colKey: message }. A new row left empty is not checked. */
export function validateRow(row, columns, t = plain) {
  const out = {};
  if (columns.every(c => isEmpty(row[c.key]) || c.readOnly || c.computed)) return out;
  for (const c of columns) { const m = validateCell(row[c.key], c, row, t); if (m) out[c.key] = m; }
  return out;
}

// ---------------------------------------------------------------- view: search, filters, sort
export const OPERATORS = ['contains', 'equals', 'not', 'empty', 'notEmpty', 'gt', 'lt'];
export function matchFilter(value, display, f) {
  const v = norm(display); const x = norm(f.value);
  switch (f.op) {
    case 'equals': return v === x;
    case 'not': return v !== x;
    case 'empty': return isEmpty(value);
    case 'notEmpty': return !isEmpty(value);
    case 'gt': return Number(value) > Number(f.value) || (!Number.isFinite(Number(value)) && v > x);
    case 'lt': return Number(value) < Number(f.value) || (!Number.isFinite(Number(value)) && v < x);
    default: return v.includes(x);
  }
}
/**
 * The rows shown: search, filters, "rows with errors", then the sort. While a sort applies,
 * rows not yet saved stay at the end in the order they were added (FR-DA-MRE-11).
 */
export function viewRows(rows, { search, filters = [], sort, errorsOnly, errorKeys, pendingKeys, display }) {
  const shown = (r, c) => display(r, c);
  let out = rows;
  if (search) { const q = norm(search); out = out.filter(r => Object.keys(r).some(k => !k.startsWith('_') && norm(shown(r, k)).includes(q))); }
  for (const f of filters) out = out.filter(r => matchFilter(r[f.key], shown(r, f.key), f));
  if (errorsOnly) out = out.filter(r => errorKeys.has(r._key));
  if (sort) {
    const saved = out.filter(r => !pendingKeys.has(r._key) || r._rid);
    const fresh = out.filter(r => pendingKeys.has(r._key) && !r._rid);
    const val = (r) => { const v = r[sort.key]; const n = Number(v); return v !== '' && v !== null && Number.isFinite(n) && typeof v !== 'boolean' ? n : norm(shown(r, sort.key)); };
    saved.sort((a, b) => { const x = val(a); const y = val(b); if (x === y) return 0; if (x === '' || x === null) return 1; if (y === '' || y === null) return -1; return (x > y ? 1 : -1) * (sort.dir === 'asc' ? 1 : -1); });
    out = [...saved, ...fresh];
  }
  return out;
}
export const nextSort = (sort, key) => (sort?.key !== key ? { key, dir: 'asc' } : sort.dir === 'asc' ? { key, dir: 'desc' } : null);

// ---------------------------------------------------------------- undo and redo
/**
 * Patches apply to the list of rows (each with a _key):
 *   { op: 'set', key, col, value } · { op: 'insert', index, row } · { op: 'remove', key }
 * A command holds the patches that redo it and those that undo it.
 */
export function applyPatches(rows, patches) {
  let out = rows;
  for (const p of patches) {
    if (p.op === 'set') out = out.map(r => (r._key === p.key ? { ...r, [p.col]: p.value } : r));
    else if (p.op === 'insert') { const n = [...out]; n.splice(Math.max(0, Math.min(p.index, n.length)), 0, p.row); out = n; }
    else if (p.op === 'remove') out = out.filter(r => r._key !== p.key);
  }
  return out;
}
export const cmdSet = (rows, changes) => { // changes: [{ key, col, value }]
  const byKey = Object.fromEntries(rows.map(r => [r._key, r]));
  const redo = changes.map(c => ({ op: 'set', ...c }));
  const undo = changes.map(c => ({ op: 'set', key: c.key, col: c.col, value: byKey[c.key]?.[c.col] })).reverse();
  return { redo, undo };
};
export const cmdInsert = (rows, inserts) => { // inserts: [{ index, row }]
  const redo = inserts.map(x => ({ op: 'insert', ...x }));
  const undo = inserts.map(x => ({ op: 'remove', key: x.row._key })).reverse();
  return { redo, undo };
};
export const cmdRemove = (rows, keys) => {
  const set = new Set(keys);
  const idx = rows.map((r, i) => [r, i]).filter(([r]) => set.has(r._key));
  return { redo: idx.map(([r]) => ({ op: 'remove', key: r._key })), undo: idx.map(([r, i]) => ({ op: 'insert', index: i, row: r })) };
};
export function createHistory(limit = 200) {
  const past = []; const future = [];
  return {
    push(cmd) { past.push(cmd); if (past.length > limit) past.shift(); future.length = 0; },
    undo() { const c = past.pop(); if (c) future.push(c); return c || null; },
    redo() { const c = future.pop(); if (c) past.push(c); return c || null; },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    peek() { return past[past.length - 1] || null; },
    clear() { past.length = 0; future.length = 0; },
  };
}

// ---------------------------------------------------------------- batches and retries
export const chunk = (list, size) => { const out = []; for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size)); return out; };
/**
 * Runs a Batch Operation (FR-DA-MRE-29): batches saved one after the other, a failed batch not
 * stopping the others, cancellation between batches and resumption from the first batch not done.
 * send(batch, index) → Promise. Returns { done: [indexes], failed: [{ index, error }], cancelled, next }.
 */
export async function runBatches(items, { size = 300, send, onProgress, isCancelled = () => false, startAt = 0, done = [] }) {
  const batches = chunk(items, Math.max(1, size));
  const ok = new Set(done); const failed = [];
  for (let i = startAt; i < batches.length; i++) {
    if (ok.has(i)) continue;
    if (isCancelled()) return { done: [...ok], failed, cancelled: true, next: i, total: batches.length };
    try { await send(batches[i], i); ok.add(i); } catch (error) { failed.push({ index: i, error }); }
    onProgress?.({ index: i, done: ok.size, failed: failed.length, total: batches.length });
  }
  return { done: [...ok], failed, cancelled: false, next: batches.length, total: batches.length };
}
/** Retry delay of a save waiting for the connection: 1, 2, 4… seconds up to 30 (FR-DA-MRE-27). */
export const backoff = (attempt) => Math.min(30000, 1000 * 2 ** Math.max(0, attempt));
/** A save refused by the server is not retried by itself; a network failure is. */
export const isRetryable = (e) => !e || e.name === 'TypeError' || e.status === 0 || e.status === 502 || e.status === 503 || e.status === 504 || e.code === 'NETWORK';

// ---------------------------------------------------------------- Draft Backup and Edit Conflicts
export const DRAFT_VERSION = 1;
export function makeDraft(rows, pendingKeys, deleted = []) {
  return { v: DRAFT_VERSION, at: new Date().toISOString(), rows: rows.filter(r => pendingKeys.has(r._key)), deleted, order: rows.map(r => r._key) };
}
/**
 * Restores a Draft Backup on the rows read from the server. A draft row whose record changed
 * (another stamp) or disappeared since the draft was taken is an Edit Conflict.
 * Returns { rows, pending: Set, conflicts: [{ key, kind: 'changed'|'deleted', mine, server }] }.
 */
export function mergeDraft(serverRows, draft) {
  if (!draft || draft.v !== DRAFT_VERSION) return { rows: serverRows, pending: new Set(), conflicts: [] };
  const byRid = Object.fromEntries(serverRows.filter(r => r._rid).map(r => [r._rid, r]));
  const conflicts = []; const pending = new Set();
  let rows = [...serverRows];
  for (const d of draft.rows || []) {
    if (d._rid) {
      const s = byRid[d._rid];
      if (!s) { conflicts.push({ key: d._key, kind: 'deleted', mine: d, server: null }); continue; }
      if (s._stamp && d._base && s._stamp !== d._base) { conflicts.push({ key: s._key, kind: 'changed', mine: { ...d, _key: s._key }, server: s }); continue; }
      rows = rows.map(r => (r._rid === d._rid ? { ...d, _key: r._key, _stamp: r._stamp } : r));
      pending.add(rows.find(r => r._rid === d._rid)._key);
    } else { rows.push(d); pending.add(d._key); }
  }
  const gone = new Set((draft.deleted || []).map(x => x._rid));
  rows = rows.filter(r => !gone.has(r._rid));
  return { rows, pending, conflicts };
}

// ---------------------------------------------------------------- export
/** A text starting with =, +, -, @, a tab or a carriage return is not a formula (NFR-DA-SEC-21). */
export const neutralize = (v) => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const csvCell = (v) => { const s = String(neutralize(v ?? '')); return /[";\n,\t]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
/** Delimited text in UTF-8 with a byte-order mark (FR-DA-MRE-31, NFR-DA-I18N-07). */
export function toCsv(headers, rows, delimiter = ',') {
  return '﻿' + [headers, ...rows].map(r => r.map(csvCell).join(delimiter)).join('\r\n');
}
/** Rows as tab-separated text and as an HTML table, with their column titles (FR-DA-MRE-23). */
export function toClipboard(headers, rows) {
  const tsv = [headers, ...rows].map(r => r.map(c => String(c ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ')).join('\t')).join('\n');
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  const html = `<table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return { tsv, html };
}
/** File name of an export: <parent>-<yyyy-mm-dd>. */
export const exportName = (parent, date = new Date()) => `${String(parent || 'export').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, '_').slice(0, 80)}-${date.toISOString().slice(0, 10)}`;

// ---------------------------------------------------------------- import repair
/** Duplicate rows within the file and against the rows already in the table, by the key columns. */
export function findDuplicates(rows, keyCols, existing = []) {
  const sig = (r) => keyCols.map(k => norm(typeof r[k] === 'object' && r[k] ? JSON.stringify(r[k]) : r[k])).join('\u0001');
  const have = new Set(existing.map(sig));
  const seen = new Map(); const dup = new Set();
  rows.forEach((r, i) => { const s = sig(r); if (!s.replace(/\u0001/g, '')) return; if (have.has(s)) dup.add(i); if (seen.has(s)) { dup.add(i); dup.add(seen.get(s)); } else seen.set(s, i); });
  return dup;
}
