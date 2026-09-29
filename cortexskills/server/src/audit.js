// Audit Trail Service and generic Version Management service (FR-DA-AUD-01..05, FR-DA-VER-01..06).
import { run, all, one } from './db.js';
import { uuid, now, S, J } from './lib/util.js';

/** Append-only. Never blocks or fails the primary operation (FR-DA-AUD-04). */
export function audit(req, entity, entityId, action, before, after, justification) {
  try {
    run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,before_val,after_val,justification,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
      uuid(), req?.orgId ?? null, req?.user?.id ?? null, entity, entityId, action, before == null ? null : S(before), after == null ? null : S(after), justification || null, now());
  } catch (e) { console.warn('[audit] write skipped:', e.message); }
}

/** Every edit duplicates the new state into an immutable version and moves the Current pointer. */
export function recordVersion(entity, recordId, orgId, data, userId, justification) {
  const last = one(`SELECT MAX(version) v FROM entity_versions WHERE entity=? AND record_id=?`, entity, recordId);
  const v = (last?.v || 0) + 1;
  run(`UPDATE entity_versions SET is_current=0 WHERE entity=? AND record_id=?`, entity, recordId);
  run(`INSERT INTO entity_versions(id,entity,record_id,org_id,version,data,user_id,justification,is_current,created_at) VALUES(?,?,?,?,?,?,?,?,1,?)`,
    uuid(), entity, recordId, orgId, v, S(data), userId, justification || null, now());
  return v;
}
export function versions(entity, recordId) {
  return all(`SELECT v.id, v.version, v.data, v.user_id, u.name user_name, v.justification, v.is_current, v.created_at FROM entity_versions v LEFT JOIN users u ON u.id=v.user_id WHERE v.entity=? AND v.record_id=? ORDER BY v.version DESC`, entity, recordId)
    .map(r => ({ ...r, data: J(r.data), is_current: !!r.is_current }));
}
export function versionData(entity, recordId, version) {
  const r = one(`SELECT data FROM entity_versions WHERE entity=? AND record_id=? AND version=?`, entity, recordId, version);
  return r ? J(r.data) : null;
}
/** Field-by-field comparison of two versions (FR-DA-VER-06). */
export function compare(a, b) {
  const keys = [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])];
  return keys.map(k => ({ field: k, a: a?.[k] ?? null, b: b?.[k] ?? null, changed: JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k]) }));
}
