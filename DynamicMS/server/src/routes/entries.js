// Multi-record entry interfaces (SRS 7.2, FR-DA-MRE-19 to 31): open a Multi-Entry, save rows
// with their Row Stamps, undo a paste or an import as one audited operation, read an imported
// file (untrusted input, NFR-DA-SEC-22), give the import template and export the current view.
import { safePackage } from '../services/ooxml.js';
import express, { Router } from 'express';
import ExcelJS from 'exceljs';
import { get, run, uid, now, J, P } from '../db.js';
import { requirePerm } from '../auth.js';
import { h, bad, notFound, HttpError, langOf, attachment } from '../http.js';
import { audit } from '../services/audit.js';
import { config } from '../config.js';
import { openSource, readStamped, REASONS } from '../services/entrysources.js';
import { applyRowOps } from '../services/rowops.js';
import { neutralize, toCsv, exportName } from '../../../web/src/lib/multientry.js';

const r = Router();
const MSG = {
  READ_ONLY: { en: 'This table is read-only', fr: 'Ce tableau est en lecture seule', ar: 'هذا الجدول للقراءة فقط' },
  TOO_MANY: { en: 'Up to {n} rows can be pasted at once.', fr: 'Jusqu\'à {n} lignes peuvent être collées en une fois.', ar: 'يمكن لصق {n} صفًا كحد أقصى في المرة الواحدة.' },
};
const T = (req) => (s, vars) => {
  const dict = {
    Required: { fr: 'Obligatoire', ar: 'مطلوب' }, 'Enter a number': { fr: 'Saisissez un nombre', ar: 'أدخل رقمًا' }, 'Enter a date': { fr: 'Saisissez une date', ar: 'أدخل تاريخًا' },
    'Not in the list': { fr: 'Absent de la liste', ar: 'غير موجود في القائمة' }, 'From 1 to 5': { fr: 'De 1 à 5', ar: 'من 1 إلى 5' }, 'Minimum {n}': { fr: 'Minimum {n}', ar: 'الحد الأدنى {n}' }, 'Maximum {n}': { fr: 'Maximum {n}', ar: 'الحد الأقصى {n}' },
    'The row is empty.': { fr: 'La ligne est vide.', ar: 'الصف فارغ.' },
    'The Solution Pack allows {n} rows in this table.': { fr: 'Le Solution Pack autorise {n} lignes dans ce tableau.', ar: 'تسمح حزمة الحلول بـ {n} صفًا في هذا الجدول.' },
  };
  let out = dict[s]?.[langOf(req)] || s;
  for (const [k, v] of Object.entries(vars || {})) out = out.split(`{${k}}`).join(v);
  return out;
};
const loc = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? v.en : v);

// Open: columns, rows with their stamps, rights and limits.
r.get('/entries/:source', requirePerm('records.view', 'execution.view', 'process.view', 'templates.manage'), h((req, res) => {
  const src = openSource(req, req.params.source);
  const lang = langOf(req);
  res.json({
    source: req.params.source, title: src.title, parent: src.parent, back: src.back, columns: src.columns.map(({ validate, ...c }) => c),
    rows: readStamped(src), readOnly: src.readOnly, reason: src.reason ? loc(REASONS[src.reason], lang) : null,
    limits: { pasteMaxRows: config.pasteMaxRows, importMaxRows: config.importMaxRows, importMaxBytes: config.importMaxBytes, batchSize: config.batchSize, quota: Number.isFinite(src.quota) ? src.quota : null },
  });
}));

// Save rows: upserts and deletes, each checked against its Row Stamp and with the grid's rules.
r.post('/entries/:source/ops', requirePerm('records.view', 'execution.view', 'process.view', 'templates.manage'), h((req, res) => {
  const src = openSource(req, req.params.source);
  if (src.readOnly) throw new HttpError(403, 'READ_ONLY', `${loc(MSG.READ_ONLY, langOf(req))}: ${loc(REASONS[src.reason], langOf(req)) || ''}`);
  const b = req.body || {};
  const kind = ['edit', 'paste', 'import', 'bulk', 'undo'].includes(b.kind) ? b.kind : 'edit';
  const nrows = (b.upserts || []).length + (b.deletes || []).length;
  if (kind === 'paste' && nrows > config.pasteMaxRows) throw bad('PASTE_TOO_LARGE', loc(MSG.TOO_MANY, langOf(req)).replace('{n}', config.pasteMaxRows));
  if (nrows > Math.max(config.batchSize, 500) * 2) throw bad('BATCH_TOO_LARGE', 'Send the rows in batches.');
  const before = readStamped(src);
  const out = applyRowOps(before, { upserts: b.upserts || [], deletes: b.deletes || [], order: b.order, force: b.force }, { columns: src.columns, user: { id: req.user.id, name: req.user.name }, normalize: src.normalize, quota: src.quota, t: T(req) });
  if (out.created.length || out.changed.length || out.deleted.length || b.order) src.write(out.rows, before);
  // One audited operation per request; a paste or an import keeps what it changed for its Undo.
  if (out.created.length || out.changed.length || out.deleted.length) {
    const summary = { kind, source: req.params.source, opId: b.opId || null, created: out.created, changed: out.changed.map(c => c.rid), deleted: out.deleted.map(d => d.row._rid), undoOf: b.undoOf || null };
    audit(req, src.orgId, 'entries', req.params.source, kind === 'edit' ? 'rows' : kind, null, summary, null);
    if (b.opId && (kind === 'paste' || kind === 'import')) {
      const table = kind === 'paste' ? 'paste_operations' : 'import_sessions';
      const cur = get(`SELECT changes FROM ${table} WHERE id=?`, b.opId);
      const prev = P(cur?.changes) || { created: [], changed: [] };
      const changes = { created: [...prev.created, ...out.created], changed: [...prev.changed, ...out.changed.filter(c => !prev.changed.some(p => p.rid === c.rid))] };
      if (kind === 'paste') {
        if (cur) run('UPDATE paste_operations SET changes=?, rows_created=?, rows_changed=? WHERE id=?', J(changes), changes.created.length, changes.changed.length, b.opId);
        else run('INSERT INTO paste_operations(id,org_id,source,user_id,rows_created,rows_changed,mapping,changes,at) VALUES(?,?,?,?,?,?,?,?,?)', b.opId, src.orgId, req.params.source, req.user.id, changes.created.length, changes.changed.length, J(b.mapping || null), J(changes), now());
      } else if (cur) run('UPDATE import_sessions SET changes=?, status=?, committed_at=COALESCE(committed_at, ?) WHERE id=?', J(changes), 'Committed', now(), b.opId);
    }
    if (b.batch && b.batch.id) {
      const bo = get('SELECT * FROM batch_operations WHERE id=?', b.batch.id);
      if (bo) run('UPDATE batch_operations SET batches_done=batches_done+1, failed=failed+?, status=?, updated_at=? WHERE id=?', out.results.filter(x => !x.ok).length, bo.batches_done + 1 >= bo.batches_total ? 'Done' : 'Running', now(), bo.id);
      else run('INSERT INTO batch_operations(id,org_id,source,user_id,kind,total_rows,batch_size,batches_total,batches_done,failed,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,1,?,?,?,?)', b.batch.id, src.orgId, req.params.source, req.user.id, kind, b.batch.total || nrows, b.batch.size || nrows, b.batch.count || 1, out.results.filter(x => !x.ok).length, (b.batch.count || 1) <= 1 ? 'Done' : 'Running', now(), now());
    }
  }
  res.json({ results: out.results, rows: b.returnRows ? out.rows : undefined });
}));

// Undo a paste or an import as its audited operation: created rows removed, changed rows restored.
r.post('/entries/ops/:opId/undo', requirePerm('records.view', 'execution.view', 'process.view', 'templates.manage'), h((req, res) => {
  const op = get('SELECT *, \'paste\' AS kind FROM paste_operations WHERE id=?', req.params.opId) || get('SELECT *, \'import\' AS kind FROM import_sessions WHERE id=?', req.params.opId);
  if (!op) throw notFound('Operation');
  if (op.user_id !== req.user.id) throw new HttpError(403, 'NOT_YOURS', 'Only the user who made the operation can undo it.');
  if (op.undone_at) return res.json({ ok: true, already: true });
  const src = openSource(req, op.source);
  if (src.readOnly) throw new HttpError(403, 'READ_ONLY', loc(MSG.READ_ONLY, langOf(req)));
  const ch = P(op.changes) || { created: [], changed: [] };
  const before = readStamped(src);
  let rows = before.filter(x => !ch.created.includes(x._rid));
  rows = rows.map(x => { const c = ch.changed.find(y => y.rid === x._rid); return c ? { ...c.before, _stamp: `${Date.now().toString(36)}-u` } : x; });
  src.write(rows, before);
  run(`UPDATE ${op.kind === 'paste' ? 'paste_operations' : 'import_sessions'} SET undone_at=? WHERE id=?`, now(), op.id);
  audit(req, src.orgId, 'entries', op.source, `undo-${op.kind}`, null, { opId: op.id, removed: ch.created, restored: ch.changed.map(c => c.rid) }, null);
  res.json({ ok: true, removed: ch.created.length, restored: ch.changed.length, rows: readStamped(src) });
}));

// Import (stage 2): the file is untrusted input — type by extension and content, size and row
// limits, UTF-8 or a stated fallback encoding; a workbook keeps cell text only.
const ENCODINGS = ['utf-8', 'windows-1252', 'iso-8859-1', 'utf-16le'];
r.post('/entries/:source/import', requirePerm('records.view', 'execution.view', 'process.view', 'templates.manage'), express.raw({ type: () => true, limit: config.importMaxBytes }), h(async (req, res) => {
  const src = openSource(req, req.params.source);
  if (src.readOnly) throw new HttpError(403, 'READ_ONLY', loc(MSG.READ_ONLY, langOf(req)));
  const name = decodeURIComponent(String(req.headers['x-file-name'] || 'file')).slice(0, 200);
  const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
  if (!buf.length) throw bad('EMPTY_FILE', 'The file is empty.');
  if (buf.length > config.importMaxBytes) throw bad('FILE_TOO_LARGE', `The file exceeds ${Math.round(config.importMaxBytes / 1048576)} MB.`);
  const ext = (name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
  let rows = []; let encoding = null; let type;
  if (['xlsx', 'xlsm'].includes(ext)) {
    if (!isZip) throw bad('BAD_FILE_TYPE', 'The file is not a spreadsheet workbook (.xlsx).');
    type = 'xlsx';
    const wb = new ExcelJS.Workbook();
    try { await wb.xlsx.load(buf); } catch { throw bad('BAD_FILE', 'The workbook cannot be read.'); }
    const ws = wb.worksheets.find(w => w.rowCount > 0) || wb.worksheets[0];
    if (ws) ws.eachRow({ includeEmpty: false }, (row) => {
      const cells = [];
      for (let c = 1; c <= Math.min(ws.columnCount, 200); c++) {
        const v = row.getCell(c).value;
        // Only text: a formula gives its last result, a date its ISO day, rich text its plain text.
        const text = v === null || v === undefined ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === 'object' ? (v.result !== undefined ? String(v.result instanceof Date ? v.result.toISOString().slice(0, 10) : v.result) : v.richText ? v.richText.map(x => x.text).join('') : v.text ?? v.hyperlink ?? '') : String(v);
        cells.push(text);
      }
      rows.push(cells);
    });
  } else if (['csv', 'txt', 'tsv', 'tab'].includes(ext) || !ext) {
    if (isZip || buf.subarray(0, 4096).includes(0) && !String(req.query.encoding || '').startsWith('utf-16')) throw bad('BAD_FILE_TYPE', 'The file is not delimited text.');
    type = 'text';
    const wanted = ENCODINGS.includes(String(req.query.encoding)) ? String(req.query.encoding) : null;
    if (wanted) encoding = wanted;
    else { try { new TextDecoder('utf-8', { fatal: true }).decode(buf); encoding = 'utf-8'; } catch { encoding = 'windows-1252'; } }
    const text = new TextDecoder(encoding).decode(buf).replace(/^\uFEFF/, '');
    const { parseDelimited } = await import('../../../web/src/lib/multientry.js');
    rows = parseDelimited(text).rows;
  } else throw bad('BAD_FILE_TYPE', 'Accepted files: .xlsx, .csv, .txt.');
  rows = rows.filter(x => x.some(c => String(c).trim() !== ''));
  if (rows.length - 1 > config.importMaxRows) throw bad('TOO_MANY_ROWS', `The file has ${rows.length - 1} rows; the limit is ${config.importMaxRows}.`);
  const id = uid();
  run('INSERT INTO import_sessions(id,org_id,source,user_id,file_name,file_type,encoding,row_count,stage,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)', id, src.orgId, req.params.source, req.user.id, name, type, encoding, Math.max(0, rows.length - 1), 'upload', 'Open', now());
  res.json({ sessionId: id, fileName: name, type, encoding, encodings: type === 'text' ? ENCODINGS : [], rows, rowCount: Math.max(0, rows.length - 1), size: buf.length });
}));
r.put('/entries/import/:id', requirePerm('records.view', 'execution.view', 'process.view', 'templates.manage'), h((req, res) => {
  const s = get('SELECT * FROM import_sessions WHERE id=?', req.params.id);
  if (!s || s.user_id !== req.user.id) throw notFound('Import');
  const b = req.body || {};
  run('UPDATE import_sessions SET stage=COALESCE(?,stage), mapping=COALESCE(?,mapping), status=COALESCE(?,status), result=COALESCE(?,result) WHERE id=?', b.stage || null, b.mapping ? J(b.mapping) : null, b.status || null, b.result ? J(b.result) : null, s.id);
  res.json({ ok: true });
}));

export { attachment };

// Import template (stage 1): column titles, required ones marked, and an example row.
r.get('/entries/:source/template', requirePerm('records.view', 'execution.view', 'process.view', 'templates.manage'), h(async (req, res) => {
  const src = openSource(req, req.params.source);
  const lang = langOf(req);
  const cols = src.columns.filter(c => !c.readOnly && !c.computed);
  const head = cols.map(c => `${loc(c.label, lang)}${c.required ? ' *' : ''}`);
  const example = cols.map(c => (c.type === 'number' ? (c.min ?? 3) : c.type === 'date' ? '2026-12-31' : c.type === 'checkbox' ? 'yes' : c.options?.length ? loc(c.options[0].label, lang) ?? c.options[0].value : `${loc(c.label, lang)} 1`));
  const name = `${exportName(loc(src.parent, lang) || 'import')}-template`;
  if (req.query.format === 'csv') { attachment(res, `${name}.csv`); res.setHeader('Content-Type', 'text/csv; charset=utf-8'); return res.send(toCsv(head, [example])); }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Import');
  ws.addRow(head).eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Open Sans' }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123A5F' } }; });
  ws.addRow(example.map(neutralize));
  ws.columns.forEach(c => { c.width = 24; });
  attachment(res, `${name}.xlsx`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(await safePackage(Buffer.from(await wb.xlsx.writeBuffer())));
}));

// Export of the current view (FR-DA-MRE-31): display values with the grid's column titles,
// formulas neutralized, named <parent>-<yyyy-mm-dd>.
r.post('/entries/:source/export', requirePerm('records.view', 'execution.view', 'process.view', 'templates.manage'), h(async (req, res) => {
  const src = openSource(req, req.params.source);
  const lang = langOf(req);
  const { headers = [], rows = [], format = 'xlsx' } = req.body || {};
  if (!Array.isArray(headers) || !Array.isArray(rows) || rows.length > 100000) throw bad('BAD_EXPORT', 'Nothing to export.');
  const name = exportName(loc(src.parent, lang) || 'export');
  audit(req, src.orgId, 'entries', req.params.source, 'export', null, { rows: rows.length, format }, null);
  if (format === 'csv') { attachment(res, `${name}.csv`); res.setHeader('Content-Type', 'text/csv; charset=utf-8'); return res.send(toCsv(headers, rows)); }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(String(loc(src.title, lang) || 'Export').replace(/[\\/?*[\]:]/g, ' ').slice(0, 28) || 'Export', { views: [{ state: 'frozen', ySplit: 1, rightToLeft: lang === 'ar' }] });
  ws.addRow(headers.map(String)).eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Open Sans' }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123A5F' } }; });
  for (const r0 of rows) ws.addRow(r0.map(v => neutralize(v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : v)));
  ws.columns.forEach((c, i) => { c.width = Math.min(60, Math.max(10, String(headers[i] || '').length + 4)); });
  if (headers.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  attachment(res, `${name}.xlsx`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(await safePackage(Buffer.from(await wb.xlsx.writeBuffer())));
}));

export default r;
