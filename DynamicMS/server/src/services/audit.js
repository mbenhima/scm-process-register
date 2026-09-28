// Audit trail and generic version management (FR-DA-AUD, FR-DA-VER).
import { run, get, all, uid, now, J } from '../db.js';

export function audit(req, orgId, entityType, entityId, action, before, after, justification) {
  run('INSERT INTO audit_log(id,org_id,user_id,entity_type,entity_id,action,before_,after_,justification,at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    uid(), orgId, req?.user?.id || null, entityType, entityId, action, J(before ?? null), J(after ?? null), justification ? J(typeof justification === 'string' ? { [req?.lang || 'en']: justification } : justification) : null, now());
}

// Stores a full snapshot as the new current version of an entity.
export function snapshot(req, orgId, entityType, entityId, data, justification) {
  const last = get('SELECT MAX(version) v FROM entity_versions WHERE entity_type=? AND entity_id=?', entityType, entityId);
  const v = (last?.v || 0) + 1;
  run('UPDATE entity_versions SET is_current=0 WHERE entity_type=? AND entity_id=?', entityType, entityId);
  run('INSERT INTO entity_versions(id,org_id,entity_type,entity_id,version,data,user_id,justification,at,is_current) VALUES(?,?,?,?,?,?,?,?,?,1)',
    uid(), orgId, entityType, entityId, v, J(data), req?.user?.id || null, justification ? J(typeof justification === 'string' ? { en: justification } : justification) : null, now());
  return v;
}

export function versions(entityType, entityId) {
  return all('SELECT * FROM entity_versions WHERE entity_type=? AND entity_id=? ORDER BY version DESC', entityType, entityId);
}
