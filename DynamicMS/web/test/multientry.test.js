// Multi-record entry logic (NFR-DA-PORT-05): validation, undo and redo, batching with failure,
// cancellation and resumption, Draft Backup restore and Edit Conflicts, column mapping and
// error repair, export and retries.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDelimited, parseClipboard, isBlock, proposeMapping, looksLikeHeader, missingRequired, convertValue, validateCell, validateRow,
  viewRows, nextSort, applyPatches, cmdSet, cmdInsert, cmdRemove, createHistory, runBatches, backoff, isRetryable,
  makeDraft, mergeDraft, toCsv, toClipboard, neutralize, exportName, findDuplicates, parseLocaleNumber, parseLocaleDate,
} from '../src/lib/multientry.js';

const COLS = [
  { key: 'item', type: 'text', label: { en: 'Item', fr: 'Élément' }, required: true },
  { key: 'category', type: 'select', label: { en: 'Category', fr: 'Catégorie' }, options: [{ value: 'Process', label: 'Process' }, { value: 'People', label: { en: 'People', fr: 'Personnes' } }] },
  { key: 'score', type: 'number', label: 'Score', min: 1, max: 5 },
  { key: 'due', type: 'date', label: 'Due date' },
  { key: 'level', type: 'select', label: 'Level', custom: false, options: ['Low', 'High'] },
];

test('clipboard: tab, semicolon and quoted comma text', () => {
  assert.deepEqual(parseDelimited('a\tb\nc\td\n').rows, [['a', 'b'], ['c', 'd']]);
  assert.deepEqual(parseDelimited('a;b\nc;d').rows, [['a', 'b'], ['c', 'd']]);
  assert.deepEqual(parseDelimited('"x, y",2\n"line1\nline2","q""uote"').rows, [['x, y', '2'], ['line1\nline2', 'q"uote']]);
  const p = parseClipboard({ text: 'one value' });
  assert.equal(isBlock(p.rows), false);
  assert.equal(isBlock(parseClipboard({ text: 'a\tb' }).rows), true);
});

test('column mapping: by header name, then by position, saved mapping first', () => {
  assert.equal(looksLikeHeader(['Élément', 'Catégorie'], COLS, 'fr'), true);
  assert.deepEqual(proposeMapping({ header: ['Category', 'Item'], width: 2, columns: COLS, startKey: 'item' }), ['category', 'item']);
  assert.deepEqual(proposeMapping({ header: null, width: 2, columns: COLS, startKey: 'category' }), ['category', 'score']);
  assert.deepEqual(proposeMapping({ header: null, width: 2, columns: COLS, startKey: 'item', saved: ['score', null] }), ['score', null]);
  assert.deepEqual(missingRequired(['category', null], COLS), ['item']);
});

test('conversion: locale numbers and dates, list labels ignoring case and accents, custom values', () => {
  assert.equal(parseLocaleNumber('1 234,5', 'fr-FR'), 1234.5);
  assert.equal(parseLocaleNumber('1,234.5', 'en-GB'), 1234.5);
  assert.equal(parseLocaleDate('31/12/2026', 'fr-FR'), '2026-12-31');
  assert.equal(parseLocaleDate('12/31/2026', 'en-US'), '2026-12-31');
  assert.equal(parseLocaleDate('46387', 'en'), '2026-12-31');
  assert.deepEqual(convertValue('personnes', COLS[1], { lang: 'fr' }), { value: 'People' });
  assert.deepEqual(convertValue('Suppliers', COLS[1], {}), { value: 'Suppliers' }); // kept as a Custom value
  assert.equal(convertValue('Medium', COLS[4], {}).error, 'Not in the list');
  assert.equal(convertValue('abc', COLS[2], {}).error, 'Enter a number');
  assert.deepEqual(convertValue('  multi\nline ', { type: 'textarea' }, {}), { value: 'multi\nline' });
});

test('validation: required, number range, date, closed list; a new empty row is not checked', () => {
  assert.equal(validateCell('', COLS[0], {}), 'Required');
  assert.equal(validateCell(9, COLS[2], {}), 'Maximum 5');
  assert.equal(validateCell('2026-13', COLS[3], {}), 'Enter a date');
  assert.equal(validateCell('Medium', COLS[4], {}), 'Not in the list');
  assert.deepEqual(validateRow({ item: '', category: '', score: '', due: '', level: '' }, COLS), {});
  assert.deepEqual(validateRow({ item: '', category: 'Process' }, COLS), { item: 'Required' });
});

test('undo and redo: cell edit, insert, delete, each one step', () => {
  let rows = [{ _key: 'a', item: 'A' }, { _key: 'b', item: 'B' }];
  const h = createHistory();
  const c1 = cmdSet(rows, [{ key: 'a', col: 'item', value: 'A2' }]); rows = applyPatches(rows, c1.redo); h.push(c1);
  const c2 = cmdInsert(rows, [{ index: 1, row: { _key: 'c', item: 'C' } }]); rows = applyPatches(rows, c2.redo); h.push(c2);
  const c3 = cmdRemove(rows, ['b']); rows = applyPatches(rows, c3.redo); h.push(c3);
  assert.deepEqual(rows.map(r => r._key), ['a', 'c']);
  rows = applyPatches(rows, h.undo().undo); assert.deepEqual(rows.map(r => r._key), ['a', 'c', 'b']);
  rows = applyPatches(rows, h.undo().undo); assert.deepEqual(rows.map(r => r._key), ['a', 'b']);
  rows = applyPatches(rows, h.undo().undo); assert.equal(rows[0].item, 'A');
  rows = applyPatches(rows, h.redo().redo); assert.equal(rows[0].item, 'A2');
  assert.equal(h.canRedo, true);
});

test('view: search, filter, errors only; unsaved rows stay at the end while sorted', () => {
  const rows = [{ _key: '1', _rid: 'x', item: 'b' }, { _key: '2', _rid: 'y', item: 'a' }, { _key: '3', item: 'aa' }];
  const display = (r, k) => String(r[k] ?? '');
  const out = viewRows(rows, { sort: { key: 'item', dir: 'asc' }, filters: [], errorKeys: new Set(), pendingKeys: new Set(['3']), display });
  assert.deepEqual(out.map(r => r._key), ['2', '1', '3']);
  assert.deepEqual(viewRows(rows, { search: 'aa', filters: [], errorKeys: new Set(), pendingKeys: new Set(), display }).map(r => r._key), ['3']);
  assert.deepEqual(viewRows(rows, { filters: [], errorsOnly: true, errorKeys: new Set(['1']), pendingKeys: new Set(), display }).map(r => r._key), ['1']);
  assert.deepEqual(nextSort(null, 'item'), { key: 'item', dir: 'asc' });
  assert.equal(nextSort({ key: 'item', dir: 'desc' }, 'item'), null);
});

test('batches: a failed batch does not stop the others; cancel and resume', async () => {
  const items = Array.from({ length: 10 }, (_, i) => i);
  const sent = [];
  const r1 = await runBatches(items, { size: 3, send: async (b, i) => { if (i === 1) throw new Error('boom'); sent.push(...b); } });
  assert.deepEqual(r1.done.sort(), [0, 2, 3]);
  assert.equal(r1.failed.length, 1);
  let stop = false;
  const r2 = await runBatches(items, { size: 3, send: async (b, i) => { if (i === 1) stop = true; }, isCancelled: () => stop });
  assert.equal(r2.cancelled, true);
  assert.equal(r2.next, 2);
  const r3 = await runBatches(items, { size: 3, send: async () => {}, startAt: r2.next, done: r2.done });
  assert.deepEqual(r3.done.sort(), [0, 1, 2, 3]);
});

test('retries: exponential backoff up to 30 s; a refusal is not retried', () => {
  assert.deepEqual([0, 1, 2, 5, 9].map(backoff), [1000, 2000, 4000, 30000, 30000]);
  assert.equal(isRetryable(new TypeError('Failed to fetch')), true);
  assert.equal(isRetryable({ status: 400 }), false);
  assert.equal(isRetryable({ status: 409 }), false);
});

test('Draft Backup: restore pending rows; changed or deleted records are Edit Conflicts', () => {
  const server = [{ _key: 'r1', _rid: 'r1', _stamp: 's1', item: 'A' }, { _key: 'r2', _rid: 'r2', _stamp: 's9', item: 'B' }];
  const local = [{ _key: 'r1', _rid: 'r1', _base: 's1', item: 'A mine' }, { _key: 'r2', _rid: 'r2', _base: 's2', item: 'B mine' }, { _key: 'r3', _rid: 'gone', _base: 's3', item: 'C mine' }, { _key: 'n1', item: 'new' }];
  const draft = makeDraft(local, new Set(['r1', 'r2', 'r3', 'n1']));
  const m = mergeDraft(server, JSON.parse(JSON.stringify(draft)));
  assert.equal(m.rows.find(r => r._rid === 'r1').item, 'A mine');
  assert.ok(m.rows.some(r => r._key === 'n1'));
  assert.deepEqual(m.conflicts.map(c => c.kind).sort(), ['changed', 'deleted']);
});

test('export: UTF-8 with BOM, formulas neutralized, titles kept, file name', () => {
  const csv = toCsv(['Titre', 'Valeur'], [['=SUM(A1)', 'É'], ['+1', 'a,b']]);
  assert.ok(csv.startsWith('﻿'));
  assert.ok(csv.includes("'=SUM(A1)"));
  assert.ok(csv.includes('"a,b"'));
  assert.equal(neutralize('@cmd'), "'@cmd");
  const { tsv, html } = toClipboard(['A', 'B'], [['1', 'x<y']]);
  assert.equal(tsv, 'A\tB\n1\tx<y');
  assert.ok(html.includes('<th>A</th>') && html.includes('x&lt;y'));
  assert.equal(exportName('HZ: Context/issues', new Date('2026-10-15')), 'HZ_Context_issues-2026-10-15');
});

test('import repair: duplicates within the file and against existing rows', () => {
  const dup = findDuplicates([{ item: 'A' }, { item: 'b' }, { item: 'a ' }, { item: 'C' }], ['item'], [{ item: 'c' }]);
  assert.deepEqual([...dup].sort(), [0, 2, 3]);
});
