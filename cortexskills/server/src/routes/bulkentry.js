// Structured paste of records into a Multi-Entry (SRS 1.8 FR-DA-MRE-19 – 22, NFR-DA-SEC-21).
// Preview validates every pasted cell like a typed one and returns the result per cell; Apply saves the rows as ONE
// audited PasteOperation (records created, changed and rejected, with the overwritten values kept for Undo); Undo
// reverses it in one action. Pasted content is untrusted: markup is removed, rights, quotas, tenant and step lock
// are checked server-side, and the number of rows is capped (PASTE_MAX_ROWS, default 1,000).
import { Router } from 'express';
import { ah, projectOf } from '../lib/http.js';
import { all, one, run, tx } from '../db.js';
import { J, S, HttpError, now, uuid, pick } from '../lib/util.js';
import { has } from '../rbac.js';
import { audit } from '../audit.js';
import { config } from '../config.js';
import { t } from '../i18n.js';
import { guard as entityGuard } from './governance.js';
import { validate, createRecord, updateRecord, deleteRecord, getRecord } from '../entities.js';
import { checkQuota } from '../entitlements.js';
import { invalidateTenant } from '../services/retrieval.js';
import * as St from '../services/steps.js';
import multer from 'multer';
import ExcelJS from 'exceljs';

const r = Router();

/** Text only: tags, scripts, styles and control characters are dropped; line breaks are kept (NFR-DA-SEC-21). */
export function cleanCell(v) {
  if (v == null) return v;
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'object') return Array.isArray(v) ? v.map(cleanCell) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cleanCell(x)]));
  return String(v).replace(/<(script|style)[\s\S]*?<\/\1\s*>/gi, '').replace(/<\/?[a-z!][^>]*>/gi, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').slice(0, 4000);
}
const cleanRow = d => Object.fromEntries(Object.entries(d || {}).filter(([k]) => !k.startsWith('_') && /^[\w.-]{1,80}$/.test(k)).map(([k, v]) => [k, cleanCell(v)]));

/** The target of a paste, with its write checks: an entity (business records, registers) or a step table. */
function target(req, body) {
  if (req.foreignReadOnly) throw new HttpError(403, 'err.foreignReadOnly');
  const tg = body?.target || {};
  if (tg.kind === 'step') {
    if (!has(req, 'tasks.execute')) throw new HttpError(403, 'err.forbidden', { permission: 'tasks.execute' });
    const fields = St.stepTableFields(req, tg.task, tg.step); // 404 / 409 err.stepLocked when the step is locked
    return { kind: 'step', key: `step:${tg.task}:${tg.step}`, fields, task: tg.task, step: tg.step, projectId: null };
  }
  if (tg.kind === 'entity') {
    const def = entityGuard(req, tg.entity, true);
    if (tg.project) projectOf(req, tg.project);
    return { kind: 'entity', key: `entity:${def.name}`, def, entity: def.name, projectId: tg.project || null };
  }
  throw new HttpError(422, 'err.invalidOption', { field: 'target', value: String(tg.kind || '') });
}
function capRows(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new HttpError(422, 'err.required', { field: 'rows' });
  if (rows.length > config.pasteMaxRows) throw new HttpError(413, 'err.pasteTooMany', { n: rows.length, max: config.pasteMaxRows });
  return rows.map(x => ({ id: x?.id ? String(x.id) : null, data: cleanRow(x?.data) }));
}
/** Errors of one row, per cell, in the user's language. */
function cellErrors(req, tg, data, isNew = false) {
  const out = {};
  if (tg.kind === 'step') {
    // A new row must carry its required values, as when it is typed in the grid; an overwrite may change only some cells.
    const errs = St.validateValues(tg.fields, data, { partial: !isNew });
    for (const [k, code] of Object.entries(errs)) { const f = tg.fields.find(x => x.key === k); out[k] = t('mre.' + code, req.lang, { field: pick(f?.label, req.lang) || k, min: f?.min, max: f?.max }); }
    return out;
  }
  for (const fld of tg.def.fields) {
    if (!(fld.name in data)) continue;
    try { validate({ ...tg.def, fields: [{ ...fld, required: false }] }, { [fld.name]: data[fld.name] }, req.lang); } catch (e) { const lbl = t('field.' + fld.name, req.lang); out[fld.name] = t(e.code || 'err.server', req.lang, { ...(e.params || {}), field: lbl === 'field.' + fld.name ? fld.name : lbl }); }
  }
  return out;
}

r.get('/bulk-entry/limits', ah(() => ({ maxRows: config.pasteMaxRows, importMaxBytes: config.importMaxBytes, importMaxRows: config.importMaxRows, batch: config.importBatch })));

// ---- Import of a file: an Excel workbook is read here (exceljs), CSV and text are read in the browser. Only cell
// text is kept; formulas give their last value; the first sheet is read unless another is named.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.importMaxBytes, files: 1 } });
r.post('/bulk-entry/parse', (req, res, next) => upload.single('file')(req, res, e => (e ? next(new HttpError(413, 'err.fileTooLarge', { max: Math.round(config.importMaxBytes / 1048576) + ' MB' })) : next())), ah(async req => {
  const f = req.file; if (!f) throw new HttpError(422, 'err.required', { field: 'file' });
  if (!/\.xlsx$/i.test(f.originalname || '') || f.buffer.subarray(0, 2).toString('latin1') !== 'PK') throw new HttpError(415, 'err.importType', { types: '.xlsx' });
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(f.buffer); } catch { throw new HttpError(422, 'err.fileUnreadable'); }
  const sheets = wb.worksheets.map(w => w.name); const ws = (req.body?.sheet && wb.getWorksheet(String(req.body.sheet))) || wb.worksheets[0];
  if (!ws) throw new HttpError(422, 'err.fileUnreadable');
  const text = v => { if (v == null) return ''; if (v instanceof Date) return v.toISOString().slice(0, 10); if (typeof v === 'object') { if ('result' in v) return text(v.result); if (v.richText) return v.richText.map(x => x.text).join(''); if ('text' in v) return String(v.text); return ''; } return String(v); };
  const rows = []; let truncated = false;
  ws.eachRow({ includeEmpty: false }, row => { if (rows.length > config.importMaxRows) { truncated = true; return; } const vals = row.values.slice(1).map(v => cleanCell(text(v))); if (vals.some(x => x !== '')) rows.push(vals); });
  return { sheets, sheet: ws.name, rows: rows.slice(0, config.importMaxRows + 1), truncated, maxRows: config.importMaxRows };
}));

/** Excel export of the current view of a Multi-Entry: the column titles and display values given by the client. */
r.post('/bulk-entry/export', ah(async (req, res) => {
  const b = req.body || {}; const header = Array.isArray(b.header) ? b.header.slice(0, 200).map(x => String(x ?? '')) : [];
  const rows = Array.isArray(b.rows) ? b.rows.slice(0, 50000) : [];
  const wb = new ExcelJS.Workbook(); wb.creator = 'CortexSkills'; wb.created = new Date();
  const ws = wb.addWorksheet(String(b.sheet || 'Export').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Export');
  const neutral = v => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) && !/^[-+]?\d[\d\s.,]*$/.test(v) ? "'" + v : v); // NFR-DA-SEC-21
  ws.addRow(header); ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B2A4A' } };
  for (const r of rows) ws.addRow((Array.isArray(r) ? r : []).slice(0, header.length).map(v => { const x = neutral(v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v); return typeof x === 'string' && /^-?\d+(\.\d+)?$/.test(x) && x.length < 15 ? Number(x) : x; }));
  ws.columns.forEach((c, i) => { c.width = Math.min(60, Math.max(10, ...[header[i], ...rows.slice(0, 200).map(r => r?.[i])].map(v => String(v ?? '').length + 2))); });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const name = String(b.name || 'export.xlsx').replace(/[^\p{L}\p{N}._-]+/gu, '-').slice(0, 120);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const fname = name.endsWith('.xlsx') ? name : name + '.xlsx'; // non-Latin names travel encoded (RFC 6266)
  res.setHeader('Content-Disposition', `attachment; filename="${fname.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(fname)}`);
  await wb.xlsx.write(res); res.end();
}));

/** Batched delete (bulk delete of a Multi-Entry): each record is deleted on its own; a refusal does not stop the others. */
r.post('/bulk-entry/delete', ah(req => {
  const tg = target(req, req.body); const ids = Array.isArray(req.body?.ids) ? [...new Set(req.body.ids.map(String))].slice(0, 500) : [];
  if (!ids.length) throw new HttpError(422, 'err.required', { field: 'ids' });
  const deleted = [], failed = [];
  tx(() => { for (const id of ids) { try { if (tg.kind === 'step') St.deleteRow(req, tg.task, tg.step, id); else deleteRecord(req, tg.entity, id); deleted.push(id); } catch (e) { if (e.status === 403 || (e.status === 409 && e.code === 'err.stepLocked')) throw e; failed.push({ id, error: t(e.code || 'err.server', req.lang, e.params || {}) }); } } });
  audit(req, 'BulkDelete', uuid(), 'delete', null, { target: tg.key, deleted: deleted.length, failed: failed.length });
  if (tg.kind === 'entity') invalidateTenant(req.orgId);
  return { deleted, failed };
}));

/** Paste Preview: per-cell results, rows to add and to overwrite; nothing is written (FR-DA-MRE-20). */
r.post('/bulk-entry/preview', ah(req => {
  const tg = target(req, req.body); const rows = capRows(req.body.rows);
  const results = rows.map((x, i) => { const errors = cellErrors(req, tg, x.data, !x.id); return { index: i, id: x.id, action: x.id ? 'overwrite' : 'add', errors, valid: !Object.keys(errors).length }; });
  return { target: tg.key, maxRows: config.pasteMaxRows, add: results.filter(x => x.action === 'add').length, overwrite: results.filter(x => x.action === 'overwrite').length, invalid: results.filter(x => !x.valid).length, results };
}));

/** Apply: valid rows saved as one operation; invalid rows are returned (never discarded silently) (FR-DA-MRE-21). */
r.post('/bulk-entry/apply', ah(req => {
  const tg = target(req, req.body); const rows = capRows(req.body.rows);
  const format = ['html', 'tsv', 'csv', 'ssv', 'text'].includes(req.body.format) ? req.body.format : 'text';
  const mapping = Array.isArray(req.body.mapping) ? req.body.mapping.slice(0, 200).map(m => (m == null ? null : String(m).slice(0, 80))) : [];
  const created = [], changed = [], rejected = [], before = {}; const saved = [];
  const opId = uuid();
  tx(() => {
    if (tg.kind === 'step') Object.assign(before, St.stepRowData(req, tg.task, tg.step, rows.filter(x => x.id).map(x => x.id)));
    rows.forEach((x, i) => {
      const errors = cellErrors(req, tg, x.data, !(x.id && before[x.id]));
      if (Object.keys(errors).length) { rejected.push({ index: i, id: x.id, errors }); return; }
      try {
        if (tg.kind === 'step') {
          const out = St.saveRow(req, tg.task, tg.step, x.id && before[x.id] ? x.id : null, x.data, 'manual'); // Entry Origin Manual
          (x.id && before[x.id] ? changed : created).push(out.id); saved.push({ index: i, ...out });
        } else {
          if (x.id) { const cur = getRecord(req, tg.entity, x.id); before[x.id] = cur; const out = updateRecord(req, tg.entity, x.id, { ...x.data, _justification: x.data._justification || 'Paste' }); changed.push(out.id); saved.push({ index: i, ...out }); }
          else {
            if (tg.entity === 'Questionnaire') checkQuota(req.orgId, 'questionnaires');
            const out = createRecord(req, tg.entity, { ...x.data, entry_origin: 'Manual' }, { projectId: tg.projectId, skipAudit: true }); created.push(out.id); saved.push({ index: i, ...out });
          }
        }
      } catch (e) { if (e.status === 403 || e.status === 409 && e.code === 'err.stepLocked') throw e; rejected.push({ index: i, id: x.id, errors: { _row: t(e.code || 'err.server', req.lang, e.params || {}) } }); }
    });
    run(`INSERT INTO paste_operations(id,org_id,user_id,target,target_kind,project_id,format,mapping,created,changed,rejected,before_val,undo_state,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,'Applied',?)`,
      opId, req.orgId, req.user.id, tg.key, tg.kind, tg.projectId, format, S(mapping), S(created), S(changed), S(rejected.map(x => x.index)), S(before), now());
  });
  // One audit entry for the whole paste, listing the records created and changed (FR-DA-MRE-21).
  audit(req, 'PasteOperation', opId, 'paste', null, { target: tg.key, format, rows: rows.length, created, changed, rejected: rejected.length });
  if (tg.kind === 'entity') invalidateTenant(req.orgId);
  return { id: opId, created, changed, rejected, saved };
}));

/** Undo of a paste in one action: created records removed, overwritten values restored. */
r.post('/bulk-entry/:id/undo', ah(req => {
  const op = one(`SELECT * FROM paste_operations WHERE id=? AND org_id=?`, req.params.id, req.orgId);
  if (!op) throw new HttpError(404, 'err.notFound');
  if (op.user_id !== req.user.id && !has(req, 'audit.view')) throw new HttpError(403, 'err.forbidden', { permission: 'audit.view' });
  if (op.undo_state !== 'Applied') throw new HttpError(409, 'err.pasteUndone');
  const [kind, a, b] = op.target.split(':'); const created = J(op.created, []), changed = J(op.changed, []), before = J(op.before_val, {});
  tx(() => {
    if (kind === 'step') {
      for (const id of created) St.deleteRow(req, a, b, id);
      for (const id of changed) if (before[id]) St.restoreRow(req, a, b, id, before[id]);
    } else {
      entityGuard(req, a, true);
      for (const id of created) { try { deleteRecord(req, a, id); } catch (e) { if (e.status !== 404) throw e; } }
      for (const id of changed) if (before[id]) { const { id: _i, entity, org_id, project_id, ref, version, created_at, updated_at, created_by, updated_by, ...data } = before[id]; updateRecord(req, a, id, { ...data, _justification: 'Paste undone' }); }
    }
    run(`UPDATE paste_operations SET undo_state='Undone', undone_at=? WHERE id=?`, now(), op.id);
  });
  audit(req, 'PasteOperation', op.id, 'undo', { created, changed }, null);
  if (kind === 'entity') invalidateTenant(req.orgId);
  return { ok: true, removed: created.length, restored: changed.length };
}));

/** The user's recent paste operations (audit view of the operation). */
r.get('/bulk-entry/operations', ah(req => all(`SELECT id, target, target_kind, format, created, changed, rejected, undo_state, created_at, undone_at FROM paste_operations WHERE org_id=? AND user_id=? ORDER BY created_at DESC LIMIT 50`, req.orgId, req.user.id)
  .map(x => ({ ...x, created: J(x.created, []).length, changed: J(x.changed, []).length, rejected: J(x.rejected, []).length }))));

export default r;
