// Bulk import of rows from a file or a paste, in five stages: template, upload, column mapping, error repair and
// summary. Pure logic, shared by the wizard and its tests: file checks, text decoding, the template, the required
// columns left unmapped, the repair state of every row and the guided "fix all" actions.
import { parseDelimited, looksLikeHeader, proposeMapping, buildRows } from '../paste.js';
import { validateRow, duplicates, isEmpty } from './validate.js';

export const IMPORT_TYPES = { csv: 'text/csv', tsv: 'text/tab-separated-values', txt: 'text/plain', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
export const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

/** Type and size of a chosen file: { ok, ext, code } (code = typeNotSupported | tooLarge | empty). */
export function checkFile(file, { maxBytes = DEFAULT_MAX_BYTES } = {}) {
  const ext = String(file?.name || '').toLowerCase().split('.').pop();
  if (!file || !IMPORT_TYPES[ext]) return { ok: false, ext, code: 'typeNotSupported' };
  if (!file.size) return { ok: false, ext, code: 'empty' };
  if (file.size > maxBytes) return { ok: false, ext, code: 'tooLarge', max: maxBytes };
  return { ok: true, ext };
}
/**
 * Text of a file's bytes in the chosen encoding; "auto" reads UTF-8 and, when the bytes are not valid UTF-8, reads
 * them as Windows-1252 and says so (accents of files saved by older spreadsheet programs).
 */
export function decode(bytes, encoding = 'auto') {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const strip = s => s.replace(/^﻿/, '');
  if (encoding !== 'auto') return { text: strip(new TextDecoder(encoding).decode(u8)), encoding, fallback: false };
  try { return { text: strip(new TextDecoder('utf-8', { fatal: true }).decode(u8)), encoding: 'utf-8', fallback: false }; }
  catch { return { text: strip(new TextDecoder('windows-1252').decode(u8)), encoding: 'windows-1252', fallback: true }; }
}
/** Rows of cells from delimited text (tab, semicolon or comma, detected). */
export function rowsFromText(text) {
  const body = String(text || '').replace(/\r\n?/g, '\n').replace(/\n+$/, ''); if (!body.trim()) return [];
  const lines = body.split('\n').slice(0, 20);
  const sep = lines.some(l => l.includes('\t')) ? '\t' : (lines[0].split(';').length >= lines[0].split(',').length && lines[0].includes(';')) ? ';' : lines[0].includes(',') ? ',' : '\t';
  return parseDelimited(body, sep);
}

/** Template rows: the column titles and one example row matching each column's type. */
export function templateRows(columns, t = k => k) {
  const ex = c => {
    if (c.example != null) return c.example;
    if (c.type === 'number') return String(c.min ?? 1);
    if (c.type === 'date') return new Date().toISOString().slice(0, 10);
    if (c.type === 'boolean') return t('common.yes');
    if (c.type === 'select') return c.options?.[0]?.label ?? c.options?.[0] ?? '';
    return t('imp.example', { c: c.label });
  };
  const cols = columns.filter(c => !c.readOnly && !c.computed);
  return { header: cols.map(c => (c.required ? `${c.label} *` : c.label)), example: cols.map(ex), columns: cols };
}

/** First mapping proposal: header detection and mapping by title, else by position. */
export function initialMapping(rows, columns) {
  const header = rows.length > 1 && looksLikeHeader(rows[0].map(h => String(h).replace(/\s*\*$/, '')), columns, rows.slice(1));
  const clean = header ? [rows[0].map(h => String(h).replace(/\s*\*$/, '')), ...rows.slice(1)] : rows;
  return { header, ...proposeMapping({ rows: clean, header, columns }) };
}
/** Required columns that no source column feeds (they block the next stage). */
export function unmappedRequired(mapping, columns) {
  const used = new Set(mapping.filter(Boolean));
  return columns.filter(c => c.required && !c.readOnly && !c.computed && !used.has(c.key));
}
/** Sample values of each source column (for the mapping stage). */
export function samples(rows, header, n = 3) {
  const body = header ? rows.slice(1) : rows; const width = Math.max(0, ...rows.map(r => r.length));
  return Array.from({ length: width }, (_, i) => body.map(r => r[i]).filter(v => !isEmpty(v)).slice(0, n));
}

/**
 * The repair state: every row with its values, errors by column and duplicate flag. `existing` are the records
 * already in the Multi-Entry (duplicates against them are flagged too).
 */
export function buildRepair({ rows, header, mapping, columns, lang, existing = [], t }) {
  const built = buildRows({ rows: header ? [rows[0].map(h => String(h).replace(/\s*\*$/, '')), ...rows.slice(1)] : rows, header, mapping, columns, lang });
  return revalidate(built.map((b, i) => ({ i, data: b.data, custom: b.custom, skip: false })), columns, existing, t);
}
export function revalidate(items, columns, existing = [], t) {
  const mapped = new Set(items.flatMap(x => Object.keys(x.data)));
  const cols = columns.filter(c => mapped.has(c.key) || c.required);
  const dup = duplicates(items.map(x => x.data), columns, existing.map(e => e.data || e));
  return items.map((x, k) => ({ ...x, errors: validateRow(cols, x.data, t), duplicate: dup.get(k) || null }));
}
export const needsAttention = x => !x.skip && (Object.keys(x.errors).length > 0 || !!x.duplicate);

/** Counts for the summary: rows to import, with a warning (duplicate or custom value), with errors, skipped. */
export function summarize(items) {
  let ok = 0, warning = 0, error = 0, skipped = 0;
  for (const x of items) {
    if (x.skip) skipped++;
    else if (Object.keys(x.errors).length) error++;
    else if (x.duplicate || Object.keys(x.custom || {}).length) warning++;
    else ok++;
  }
  return { ok, warning, error, skipped, total: items.length };
}

/**
 * Guided fixes for the most common errors, each applying to every row it concerns:
 *  fill — a required column left empty, filled with one value;
 *  replace — one value not in a list, replaced by an option of the list;
 *  skipDuplicates — rows repeating another row or an existing record, left out.
 */
export function suggestFixes(items, columns) {
  const fixes = []; const byKey = Object.fromEntries(columns.map(c => [c.key, c]));
  const empty = {}; const invalid = {};
  for (const x of items) {
    if (x.skip) continue;
    for (const k of Object.keys(x.errors)) {
      const c = byKey[k]; if (!c) continue; const v = x.data[k];
      if (isEmpty(v)) empty[k] = (empty[k] || 0) + 1;
      else if (c.type === 'select' && !c.custom) { invalid[k] ||= {}; invalid[k][v] = (invalid[k][v] || 0) + 1; }
    }
  }
  for (const [k, n] of Object.entries(empty)) fixes.push({ kind: 'fill', key: k, n });
  for (const [k, vals] of Object.entries(invalid)) for (const [v, n] of Object.entries(vals)) fixes.push({ kind: 'replace', key: k, from: v, n });
  const dups = items.filter(x => !x.skip && x.duplicate).length; if (dups) fixes.push({ kind: 'skipDuplicates', n: dups });
  return fixes;
}
export function applyFix(items, fix, value) {
  if (fix.kind === 'skipDuplicates') return items.map(x => (x.duplicate ? { ...x, skip: true } : x));
  if (fix.kind === 'fill') return items.map(x => (!x.skip && isEmpty(x.data[fix.key]) ? { ...x, data: { ...x.data, [fix.key]: value } } : x));
  if (fix.kind === 'replace') return items.map(x => (!x.skip && String(x.data[fix.key]) === String(fix.from) ? { ...x, data: { ...x.data, [fix.key]: value } } : x));
  return items;
}
