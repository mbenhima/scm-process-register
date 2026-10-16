// Row operations of a Multi-Entry (FR-DA-MRE-09, -22, -26, -29; NFR-DA-REL-11): every saved row
// carries a Row Stamp; a change based on an older stamp is refused as an Edit Conflict naming
// who changed the row, unless the user chose to overwrite. Rows are checked on the server with
// the same rules as the grid (the validation of the client library is shared, not copied).
import crypto from 'node:crypto';
import { validateCell, isEmpty, plain } from '../../../web/src/lib/multientry.js';

export const newStamp = () => `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
const META = (k) => k.startsWith('_');
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Server check of one row: a new row on every column, an overwrite on the cells it changes. */
export function checkRow(row, columns, changed = null, t = plain) {
  const errs = {};
  const cols = columns.filter(c => !c.readOnly && !c.computed);
  if (!changed && cols.every(c => isEmpty(row[c.key]))) return { _row: t('The row is empty.') };
  for (const c of cols) {
    if (changed && !changed.includes(c.key)) continue;
    // Server-side the value may already be normalized to {en, fr, ar}: test its text.
    const v = row[c.key] && typeof row[c.key] === 'object' && !Array.isArray(row[c.key]) && !c.objectValue ? Object.values(row[c.key]).find(x => !isEmpty(x)) ?? '' : row[c.key];
    const { validate, ...plain } = c;
    const m = validateCell(v, plain, row, t);
    if (m) errs[c.key] = m;
  }
  return errs;
}

/**
 * Applies upserts and deletes to the stored rows.
 * stored: [{ _rid, _stamp, _by, _byName, ...values }]
 * ops: { upserts: [{ _cid, _rid?, _base?, ...values }], deletes: [{ _rid, _base? }], order?: [rid | cid], force?: [rid] }
 * opts: { columns, user: { id, name }, normalize(values, prevRow) → values, quota }
 * Returns { rows, results, created: [rid], changed: [{ rid, before }], deleted: [{ row, index }] }.
 */
export function applyRowOps(stored, ops, { columns, user, normalize = (v) => v, quota = Infinity, t = plain }) {
  const rows = stored.map(r => ({ ...r }));
  const index = () => Object.fromEntries(rows.map((r, i) => [r._rid, i]));
  const force = new Set(ops.force || []);
  const results = []; const created = []; const changed = []; const deleted = [];
  const conflictOf = (r) => ({ by: r._byName || null, at: r._at || null, server: r });
  for (const d of ops.deletes || []) {
    const i = index()[d._rid];
    if (i === undefined) { results.push({ _rid: d._rid, ok: true, gone: true }); continue; }
    if (d._base && rows[i]._stamp && rows[i]._stamp !== d._base && !force.has(d._rid)) { results.push({ _rid: d._rid, ok: false, conflict: conflictOf(rows[i]) }); continue; }
    deleted.push({ row: rows[i], index: i });
    rows.splice(i, 1);
    results.push({ _rid: d._rid, ok: true, deleted: true });
  }
  const cidToRid = {};
  for (const u of ops.upserts || []) {
    const values = Object.fromEntries(Object.entries(u).filter(([k]) => !META(k)));
    const i = u._rid ? index()[u._rid] : undefined;
    if (u._rid && i === undefined && !force.has(u._rid)) { results.push({ _cid: u._cid, _rid: u._rid, ok: false, conflict: { by: null, at: null, server: null, deleted: true } }); continue; }
    if (i !== undefined) {
      const cur = rows[i];
      if (u._base && cur._stamp && cur._stamp !== u._base && !force.has(u._rid)) { results.push({ _cid: u._cid, _rid: u._rid, ok: false, conflict: conflictOf(cur) }); continue; }
      const next = normalize(values, cur);
      const changedCols = Object.keys(next).filter(k => !same(next[k], cur[k]));
      const errs = checkRow({ ...cur, ...next }, columns, changedCols, t);
      if (Object.keys(errs).length) { results.push({ _cid: u._cid, _rid: u._rid, ok: false, errors: errs }); continue; }
      if (!changedCols.length) { results.push({ _cid: u._cid, _rid: cur._rid, ok: true, stamp: cur._stamp, unchanged: true }); continue; }
      changed.push({ rid: cur._rid, before: cur });
      rows[i] = { ...cur, ...next, _stamp: newStamp(), _by: user.id, _byName: user.name, _at: new Date().toISOString() };
      results.push({ _cid: u._cid, _rid: cur._rid, ok: true, stamp: rows[i]._stamp, row: rows[i] });
    } else {
      if (rows.length >= quota) { results.push({ _cid: u._cid, ok: false, errors: { _row: t('The Solution Pack allows {n} rows in this table.', { n: quota }) } }); continue; }
      const next = normalize(values, null);
      const errs = checkRow(next, columns, null, t);
      if (Object.keys(errs).length) { results.push({ _cid: u._cid, ok: false, errors: errs }); continue; }
      const rid = (u._rid && force.has(u._rid)) ? crypto.randomUUID() : crypto.randomUUID();
      const row = { ...next, _rid: rid, _stamp: newStamp(), _by: user.id, _byName: user.name, _at: new Date().toISOString() };
      const at = Number.isInteger(u._index) ? Math.max(0, Math.min(u._index, rows.length)) : rows.length;
      rows.splice(at, 0, row);
      created.push(rid); cidToRid[u._cid] = rid;
      results.push({ _cid: u._cid, _rid: rid, ok: true, stamp: row._stamp, row, created: true });
    }
  }
  if (Array.isArray(ops.order) && ops.order.length) {
    const pos = new Map(ops.order.map((k, i) => [cidToRid[k] || k, i]));
    const keyed = rows.map((r, i) => [r, pos.has(r._rid) ? pos.get(r._rid) : 1e9 + i]);
    keyed.sort((a, b) => a[1] - b[1]);
    rows.splice(0, rows.length, ...keyed.map(([r]) => r));
  }
  return { rows, results, created, changed, deleted };
}

/** Gives every stored row a Row Stamp (rows saved before stamps existed). */
export function stampRows(list, at = '0') {
  let changed = false;
  const out = (Array.isArray(list) ? list : []).map(r => {
    if (!r || typeof r !== 'object') return r;
    if (r._rid && r._stamp) return r;
    changed = true;
    return { ...r, _rid: r._rid || crypto.randomUUID(), _stamp: r._stamp || at };
  });
  return { rows: out, changed };
}
