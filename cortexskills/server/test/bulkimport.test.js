// Integration test of the bulk import (FR-DA-MRE-19 – 22, import workflow): an Excel file is uploaded and read,
// its columns mapped with the client's own logic, the rows checked (Paste Preview), committed as one audited
// operation, exported again, protected against a stale overwrite, deleted in a batch and the import undone.
// Run after `npm run seed`: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { createApp } from '../src/app.js';
import { one, all } from '../src/db.js';
import { pick } from '../src/lib/util.js';
import { initialMapping, unmappedRequired, buildRepair, summarize } from '../../web/src/lib/bulk/importer.js';

let server, base, token, task, step, fields;
const PASS = 'CortexSkills#2026';
const call = async (method, path, body, { raw = false, form = null } = {}) => {
  const res = await fetch(base + path, { method, headers: { Authorization: 'Bearer ' + token, ...(form ? {} : { 'Content-Type': 'application/json' }) }, body: form || (body ? JSON.stringify(body) : undefined) });
  if (raw) return res; let data = null; try { data = await res.json(); } catch { /* empty */ } return { status: res.status, data };
};

before(async () => {
  const app = await createApp({ background: false });
  server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`;
  // A head of L&D of an Organization, and a running task with an open record-table step.
  const org = one(`SELECT o.id FROM organizations o JOIN users u ON u.org_id=o.id JOIN user_roles r ON r.user_id=u.id AND r.role_id='R-03' WHERE u.active=1 ORDER BY o.name LIMIT 1`);
  const email = one(`SELECT u.email FROM users u JOIN user_roles r ON r.user_id=u.id WHERE u.org_id=? AND r.role_id='R-03' AND u.active=1 LIMIT 1`, org.id).email;
  const res = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASS }) });
  token = (await res.json()).token; assert.ok(token, 'login');
  for (const t of all(`SELECT id FROM task_instances WHERE org_id=? AND status IN ('In progress','Not started') LIMIT 200`, org.id)) {
    const s = await call('GET', `/api/tasks/${t.id}/steps`); if (s.status !== 200 || s.data.locked) continue;
    const st = s.data.steps.find(x => !x.done && x.form.kind === 'record'); if (st) { task = t.id; step = st; break; }
  }
  assert.ok(task, 'the seed must contain an open record-table step');
  fields = step.form.fields;
});
after(async () => { if (task) for (const r of all(`SELECT id FROM step_rows WHERE data LIKE '%IT-import%'`)) await call('DELETE', `/api/tasks/${task}/steps/${step.id}/rows/${r.id}`); server?.close(); });

test('full import flow: Excel upload, mapping, repair, commit, export, conflict, batched delete, undo', async () => {
  const cols = fields.map(f => ({ key: f.key, label: pick(f.label, 'en'), type: f.type === 'person' ? 'select' : f.type, required: !!f.required, custom: f.custom || f.type === 'person', options: (f.options || []).map(o => ({ value: String(o.value), label: pick(o.label, 'en') || String(o.value) })) }));
  const first = cols[0];
  // 1. An Excel workbook as a user would prepare it: titles (required marked *), a formula and rich text.
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Rows');
  ws.addRow(cols.map(c => (c.required ? `${c.label} *` : c.label)));
  ws.addRow(cols.map((c, i) => (i === 0 ? 'IT-import A' : c.type === 'select' && c.options[0] ? c.options[0].label : '')));
  ws.addRow(cols.map((c, i) => (i === 0 ? { richText: [{ text: 'IT-import ' }, { text: 'B', font: { bold: true } }] } : '')));
  ws.addRow(cols.map((c, i) => (i === 0 ? '' : c.type === 'select' && c.options[0] ? c.options[0].label : 'x'))); // required value missing
  ws.addRow(cols.map((c, i) => (i === 0 ? { formula: '"IT-import "&"C"', result: 'IT-import C' } : '')));
  const buf = Buffer.from(await wb.xlsx.writeBuffer());

  // 2. Upload and read: the first sheet, cell text only.
  const fd = new FormData(); fd.append('file', new Blob([buf]), 'rows.xlsx');
  const parsed = await call('POST', '/api/bulk-entry/parse', null, { form: fd });
  assert.equal(parsed.status, 200, JSON.stringify(parsed.data)); assert.deepEqual(parsed.data.sheets, ['Rows']);
  assert.equal(parsed.data.rows.length, 5); assert.equal(parsed.data.rows[2][0], 'IT-import B'); assert.equal(parsed.data.rows[4][0], 'IT-import C');
  const bad = new FormData(); bad.append('file', new Blob([Buffer.from('%PDF-1.4')]), 'x.pdf');
  assert.equal((await call('POST', '/api/bulk-entry/parse', null, { form: bad })).status, 415, 'only .xlsx is read on the server');

  // 3. Mapping (titles with * recognized) and repair, with the browser's logic.
  const m = initialMapping(parsed.data.rows, cols); assert.equal(m.header, true); assert.equal(m.mapping[0], first.key);
  assert.deepEqual(unmappedRequired(m.mapping, cols), []);
  const items = buildRepair({ rows: parsed.data.rows, header: true, mapping: m.mapping, columns: cols, lang: 'en', existing: [], t: k => k });
  const sum = summarize(items); if (process.env.DBG) console.log(JSON.stringify({ rows: parsed.data.rows, map: m.mapping, items: items.map(x => [x.data, x.errors]) }).slice(0, 1500)); assert.equal(sum.total, 4); assert.equal(sum.error, 1, 'the row without its required value is flagged');

  // 4. Server preview checks the same rows again (nothing written).
  const target = { kind: 'step', task, step: step.id };
  const rows = items.map(x => ({ data: x.data }));
  const pv = await call('POST', '/api/bulk-entry/preview', { target, rows }); assert.equal(pv.status, 200); assert.equal(pv.data.invalid, 1); assert.equal(pv.data.add, 4);

  // 5. Commit: valid rows saved as one audited operation, the invalid one returned.
  const ap = await call('POST', '/api/bulk-entry/apply', { target, rows, format: 'xlsx', mapping: m.mapping }); assert.equal(ap.status, 200, JSON.stringify(ap.data));
  assert.equal(ap.data.created.length, 3); assert.equal(ap.data.rejected.length, 1); assert.ok(one(`SELECT id FROM audit_log WHERE entity='PasteOperation' AND entity_id=?`, ap.data.id), 'one audit entry');
  const after1 = await call('GET', `/api/tasks/${task}/steps`); const mine = after1.data.steps.find(s => s.id === step.id).rows.filter(r => String(r[first.key]).startsWith('IT-import'));
  assert.equal(mine.length, 3); assert.ok(mine.every(r => r._updated), 'each row carries its server stamp');

  // 6. Export of the view: titles kept, formula-like text neutralized.
  const ex = await call('POST', '/api/bulk-entry/export', { name: 'IT-import.xlsx', header: [first.label], rows: [['=1+1'], ['IT-import A']] }, { raw: true });
  assert.equal(ex.status, 200); const back = new ExcelJS.Workbook(); await back.xlsx.load(Buffer.from(await ex.arrayBuffer()));
  assert.equal(back.worksheets[0].getCell('A1').value, first.label); assert.equal(back.worksheets[0].getCell('A2').value, "'=1+1");

  // 7. A stale overwrite is refused (optimistic concurrency), a current one is accepted.
  const r0 = mine[0]; const okPut = await call('PUT', `/api/tasks/${task}/steps/${step.id}/rows/${r0.id}`, { data: { [first.key]: 'IT-import A2' }, expected: r0._updated });
  assert.equal(okPut.status, 200); const stale = await call('PUT', `/api/tasks/${task}/steps/${step.id}/rows/${r0.id}`, { data: { [first.key]: 'IT-import A3' }, expected: r0._updated });
  assert.equal(stale.status, 409); assert.equal(stale.data.error, 'err.rowConflict');

  // 8. Batched delete of one row, then Undo of the whole import removes the others.
  const del = await call('POST', '/api/bulk-entry/delete', { target, ids: [mine[2].id] }); assert.deepEqual(del.data.deleted, [mine[2].id]);
  const un = await call('POST', `/api/bulk-entry/${ap.data.id}/undo`, {}); assert.equal(un.status, 200);
  assert.equal(all(`SELECT id FROM step_rows WHERE data LIKE '%IT-import%'`).length, 0, 'nothing of the import is left');
});
