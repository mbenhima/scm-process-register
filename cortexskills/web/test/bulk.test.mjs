// Unit tests of the bulk-entry logic (validation, undo/redo, batching, drafts and conflicts, import mapping and
// repair, export, retry). Run with: npm test (web folder) — node's built-in test runner, no extra dependency.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCell, validateRow, duplicates } from '../src/lib/bulk/validate.js';
import { createHistory, applyEntry, keysOf } from '../src/lib/bulk/history.js';
import { runBatches, chunk } from '../src/lib/bulk/batch.js';
import { saveDraft, loadDraft, clearDraft, mergeDraft, resolveConflict } from '../src/lib/bulk/draft.js';
import { checkFile, decode, rowsFromText, templateRows, initialMapping, unmappedRequired, buildRepair, revalidate, summarize, suggestFixes, applyFix, needsAttention } from '../src/lib/bulk/importer.js';
import { toCSV, exportName, neutralize } from '../src/lib/bulk/exporter.js';
import { backoff, isNetworkError, withRetry } from '../src/lib/bulk/net.js';

const t = (k, p) => (p ? `${k}:${Object.values(p).join(',')}` : k);
const COLS = [
  { key: 'date', label: 'Date', type: 'date', required: true, notFuture: true },
  { key: 'category', label: 'Category', type: 'select', required: true, options: [{ value: 'travel', label: 'Travel' }, { value: 'meals', label: 'Meals' }] },
  { key: 'merchant', label: 'Merchant', type: 'text', required: true, minLength: 1, maxLength: 120 },
  { key: 'amount', label: 'Amount', type: 'number', required: true, min: 0, decimals: 2 },
  { key: 'notes', label: 'Notes', type: 'textarea', maxLength: 500 },
];
const memory = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };

test('validation: required, type, range, decimals, list, length, future date', () => {
  const [date, cat, merchant, amount, notes] = COLS;
  assert.equal(validateCell(merchant, '', {}, t), 'mre.required:Merchant');
  assert.equal(validateCell(amount, 'abc', {}, t), 'mre.number');
  assert.equal(validateCell(amount, '-1', {}, t), 'mre.min:0');
  assert.equal(validateCell(amount, '1.234', {}, t), 'mre.decimals:2');
  assert.equal(validateCell(amount, '12.50', {}, t), null);
  assert.equal(validateCell(cat, 'hotel', {}, t), 'mre.notInList');
  assert.equal(validateCell(cat, 'meals', {}, t), null);
  assert.equal(validateCell(date, '2999-01-01', {}, t), 'mre.future');
  assert.equal(validateCell(date, '31/12/2020', {}, t), 'mre.date');
  assert.equal(validateCell(date, '2020-12-31', {}, t), null);
  assert.equal(validateCell(merchant, 'x'.repeat(121), {}, t), 'mre.maxLength:120');
  assert.equal(validateCell(notes, '', {}, t), null);
  assert.deepEqual(Object.keys(validateRow(COLS, { date: '2020-01-01', category: 'x', merchant: '', amount: '5' }, t)).sort(), ['category', 'merchant']);
});
test('duplicates within the file and against existing records', () => {
  const d = duplicates([{ merchant: 'A' }, { merchant: 'b' }, { merchant: 'a ' }, { merchant: 'C' }], COLS, [{ merchant: 'c' }], ['merchant']);
  assert.deepEqual([...d.entries()], [[2, { kind: 'file', of: 0 }], [3, { kind: 'existing' }]]);
});

test('undo / redo of a cell change, an add, a delete and a batch', () => {
  const h = createHistory(); const r0 = [{ _key: 'a', data: { merchant: 'A' }, status: 'clean' }, { _key: 'b', data: { merchant: 'B' }, status: 'clean' }];
  const set = { kind: 'set', key: 'a', col: 'merchant', before: 'A', after: 'A2' }; h.push(set);
  let rows = applyEntry(r0, set, +1); assert.equal(rows[0].data.merchant, 'A2'); assert.equal(rows[0].status, 'dirty');
  const add = { kind: 'add', rows: [{ row: { _key: 'c', data: { merchant: 'C' } }, index: 1 }] }; h.push(add); rows = applyEntry(rows, add, +1);
  assert.deepEqual(rows.map(r => r._key), ['a', 'c', 'b']);
  const del = { kind: 'delete', rows: [{ row: rows[2], index: 2 }] }; h.push(del); rows = applyEntry(rows, del, +1);
  assert.deepEqual(rows.map(r => r._key), ['a', 'c']);
  rows = applyEntry(rows, h.undo(), -1); assert.deepEqual(rows.map(r => r._key), ['a', 'c', 'b']);
  rows = applyEntry(rows, h.undo(), -1); assert.deepEqual(rows.map(r => r._key), ['a', 'b']);
  rows = applyEntry(rows, h.undo(), -1); assert.equal(rows[0].data.merchant, 'A');
  assert.equal(h.undo(), null);
  rows = applyEntry(rows, h.redo(), +1); assert.equal(rows[0].data.merchant, 'A2');
  const batch = { kind: 'batch', entries: [{ kind: 'set', key: 'a', col: 'merchant', before: 'A2', after: 'X' }, { kind: 'set', key: 'b', col: 'merchant', before: 'B', after: 'X' }] };
  rows = applyEntry(rows, batch, +1); assert.deepEqual(rows.map(r => r.data.merchant), ['X', 'X']);
  rows = applyEntry(rows, batch, -1); assert.deepEqual(rows.map(r => r.data.merchant), ['A2', 'B']);
  assert.deepEqual(keysOf(batch), ['a', 'b']);
  h.push(set); assert.equal(h.canRedo(), false, 'a new change clears the redo stack');
});

test('batching: chunks of 250, isolation of a failed batch, cancel and resume', async () => {
  const items = Array.from({ length: 1000 }, (_, i) => i);
  assert.deepEqual(chunk(items, 300).map(c => c.length), [300, 300, 300, 100]);
  const seen = [];
  const res = await runBatches(items, async (b, i) => { seen.push(i); if (i === 1) throw new Error('boom'); return b.length; }, { size: 250 });
  assert.equal(res.total, 4); assert.equal(res.done, 3); assert.equal(res.failed.length, 1); assert.equal(res.failed[0].index, 1); assert.deepEqual(seen, [0, 1, 2, 3]);
  const ctl = new AbortController(); const progress = [];
  const part = await runBatches(items, async (b, i) => { if (i === 1) ctl.abort(); return i; }, { size: 250, signal: ctl.signal, onProgress: p => progress.push(p.done) });
  assert.equal(part.cancelled, true); assert.equal(part.next, 2);
  const rest = await runBatches(items, async (b, i) => i, { size: 250, from: part.next });
  assert.equal(rest.done, 2); assert.deepEqual(rest.results.filter(x => x != null), [2, 3]);
  const retry = await runBatches(items, async (b, i) => i, { size: 250, only: [1] }); assert.equal(retry.done, 1);
});

test('save per row: only pending rows go to the draft, restored with a notice and conflict detection', () => {
  const s = memory();
  const rows = [{ _key: 'a', id: 'r1', data: { merchant: 'A*' }, status: 'dirty', base: 't1' }, { _key: 'b', id: 'r2', data: { merchant: 'B' }, status: 'clean', base: 't1' }, { _key: 'n', id: null, data: { merchant: 'New' }, status: 'dirty' }, { _key: 'x', id: 'r3', data: { merchant: 'X*' }, status: 'error', base: 't1' }];
  const d = saveDraft(s, 'grid1', rows, { now: 1000 }); assert.equal(d.rows.length, 3); assert.equal(loadDraft(s, 'grid1').savedAt, 1000);
  const server = [{ _key: 'a', id: 'r1', data: { merchant: 'A' }, status: 'clean', base: 't2' }, { _key: 'b', id: 'r2', data: { merchant: 'B' }, status: 'clean', base: 't1' }];
  const m = mergeDraft(server, loadDraft(s, 'grid1'));
  assert.equal(m.restored, 3);
  assert.deepEqual(m.conflicts.map(c => [c.id, c.kind]), [['r1', 'changed'], ['r3', 'deleted']]);
  assert.equal(m.rows.find(r => r.id === 'r1').data.merchant, 'A*'); assert.ok(m.rows.find(r => r.data.merchant === 'New'));
  const theirs = resolveConflict(m.rows, m.conflicts[0], 'theirs'); assert.equal(theirs.find(r => r.id === 'r1').data.merchant, 'A');
  const mine = resolveConflict(m.rows, m.conflicts[0], 'mine'); assert.equal(mine.find(r => r.id === 'r1').force, true);
  const gone = resolveConflict(m.rows, m.conflicts[1], 'mine'); assert.ok(gone.find(r => r.data.merchant === 'X*' && !r.id), 'a row deleted on the server is re-created when kept');
  saveDraft(s, 'grid1', rows.map(r => ({ ...r, status: 'clean', id: r.id || 'n1' }))); assert.equal(loadDraft(s, 'grid1'), null, 'nothing pending: the draft is removed');
  saveDraft(s, 'grid1', rows); clearDraft(s, 'grid1'); assert.equal(loadDraft(s, 'grid1'), null);
  assert.equal(saveDraft({ setItem() { throw new Error('full'); }, removeItem() {} }, 'g', rows), null, 'storage errors never throw');
});

test('import: file checks, decoding, template and column mapping', () => {
  assert.equal(checkFile({ name: 'a.pdf', size: 10 }).code, 'typeNotSupported');
  assert.equal(checkFile({ name: 'a.csv', size: 0 }).code, 'empty');
  assert.equal(checkFile({ name: 'a.CSV', size: 10e6 }, { maxBytes: 1e6 }).code, 'tooLarge');
  assert.equal(checkFile({ name: 'a.xlsx', size: 10 }).ok, true);
  const latin = new Uint8Array([0x43, 0x61, 0x66, 0xe9]); // "Café" in Windows-1252
  assert.deepEqual([decode(latin).text, decode(latin).fallback], ['Café', true]);
  assert.equal(decode(new TextEncoder().encode('﻿Café')).text, 'Café');
  const tpl = templateRows(COLS, t); assert.equal(tpl.header[0], 'Date *'); assert.equal(tpl.example.length, 5);
  const rows = rowsFromText('Merchant;Amount;Date\nAcme;12,5;2020-01-02\nBeta;3;2020-01-03\n');
  assert.equal(rows.length, 3); assert.equal(rows[1][1], '12,5');
  const m = initialMapping(rows, COLS); assert.equal(m.header, true); assert.deepEqual(m.mapping, ['merchant', 'amount', 'date']);
  assert.deepEqual(unmappedRequired(m.mapping, COLS).map(c => c.key), ['category']);
  assert.deepEqual(unmappedRequired(['merchant', 'amount', 'date', 'category'], COLS), []);
  const tplRows = [tpl.header, tpl.example]; assert.equal(initialMapping(tplRows, COLS).header, true, 'the template header (with *) is recognized');
});

test('import: error repair, duplicates, guided fixes and summary', () => {
  const rows = [['Merchant', 'Category', 'Amount', 'Date'], ['Acme', 'Travel', '10', '2020-01-02'], ['', 'Hotel', '5', '2020-01-02'], ['Beta', 'Hotel', 'x', '2020-01-03'], ['acme', 'Meals', '1', '2020-01-04'], ['Old', 'Meals', '1', '2020-01-04']];
  let items = buildRepair({ rows, header: true, mapping: ['merchant', 'category', 'amount', 'date'], columns: COLS, lang: 'en', existing: [{ merchant: 'old' }], t });
  assert.equal(items[0].data.category, 'travel', 'list values are matched by label');
  assert.deepEqual(Object.keys(items[1].errors).sort(), ['category', 'merchant']);
  assert.equal(items[3].duplicate.kind, 'file'); assert.equal(items[4].duplicate.kind, 'existing');
  assert.equal(items.filter(needsAttention).length, 4);
  const fixes = suggestFixes(items, COLS);
  assert.deepEqual(fixes.map(f => f.kind + ':' + (f.key || '') + ':' + (f.from || '') + ':' + f.n), ['fill:merchant::1', 'replace:category:Hotel:2', 'skipDuplicates:::2']);
  items = applyFix(items, fixes[1], 'travel'); items = applyFix(items, fixes[0], 'Gamma'); items = applyFix(items, fixes[2]);
  items = revalidate(items, COLS, [{ merchant: 'old' }], t);
  items = revalidate(items.map((x, i) => (i === 2 ? { ...x, data: { ...x.data, amount: '7' } } : x)), COLS, [{ merchant: 'old' }], t);
  const s = summarize(items); assert.deepEqual(s, { ok: 3, warning: 0, error: 0, skipped: 2, total: 5 });
});

test('export: CSV with titles, labels and neutralized formulas; file name', () => {
  const csv = toCSV([COLS[2], COLS[1], COLS[3]], [{ merchant: '=HYPERLINK("x")', category: 'meals', amount: '-3' }], t);
  assert.ok(csv.startsWith('﻿Merchant,Category,Amount\r\n'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")",Meals,-3`), csv);
  assert.equal(neutralize('+1'), '+1'); assert.equal(neutralize('@x'), "'@x");
  assert.equal(exportName('Plan d’action — Été 2026', 'xlsx', new Date('2026-10-13T10:00:00Z')), 'Plan-d-action-Ete-2026-2026-10-13.xlsx');
});

test('network: backoff, network errors retried, refusals not retried', async () => {
  assert.deepEqual([0, 1, 2, 10].map(a => backoff(a, { jitter: 0 })), [1000, 2000, 4000, 30000]);
  assert.equal(isNetworkError(new TypeError('Failed to fetch')), true);
  assert.equal(isNetworkError({ status: 422, message: 'invalid' }), false);
  assert.equal(isNetworkError({ status: 503 }), true);
  let n = 0; const waits = [];
  assert.equal(await withRetry(async () => { if (++n < 3) throw new TypeError('Failed to fetch'); return 'ok'; }, { wait: async ms => waits.push(ms), jitter: 0 }), 'ok');
  assert.deepEqual(waits, [1000, 2000]);
  await assert.rejects(withRetry(async () => { throw Object.assign(new Error('no'), { status: 403 }); }, { wait: async () => {} }), /no/);
});
