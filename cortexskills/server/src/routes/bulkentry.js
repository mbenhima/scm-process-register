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
function cellErrors(req, tg, data) {
  const out = {};
  if (tg.kind === 'step') {
    const errs = St.validateValues(tg.fields, data);
    for (const [k, code] of Object.entries(errs)) { const f = tg.fields.find(x => x.key === k); out[k] = t('mre.' + code, req.lang, { field: pick(f?.label, req.lang) || k, min: f?.min, max: f?.max }); }
    return out;
  }
  for (const fld of tg.def.fields) {
    if (!(fld.name in data)) continue;
    try { validate({ ...tg.def, fields: [{ ...fld, required: false }] }, { [fld.name]: data[fld.name] }, req.lang); } catch (e) { const lbl = t('field.' + fld.name, req.lang); out[fld.name] = t(e.code || 'err.server', req.lang, { ...(e.params || {}), field: lbl === 'field.' + fld.name ? fld.name : lbl }); }
  }
  return out;
}

r.get('/bulk-entry/limits', ah(() => ({ maxRows: config.pasteMaxRows })));

/** Paste Preview: per-cell results, rows to add and to overwrite; nothing is written (FR-DA-MRE-20). */
r.post('/bulk-entry/preview', ah(req => {
  const tg = target(req, req.body); const rows = capRows(req.body.rows);
  const results = rows.map((x, i) => { const errors = cellErrors(req, tg, x.data); return { index: i, id: x.id, action: x.id ? 'overwrite' : 'add', errors, valid: !Object.keys(errors).length }; });
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
      const errors = cellErrors(req, tg, x.data);
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
