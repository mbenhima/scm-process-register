// Audit trail (FR-DA-AUD-01..04) and generic Version Management (FR-DA-VER-01..05).
import { q, json } from '../db.js';

// Audit writes never block or fail the primary operation.
export function audit(ctx, entityType, entityId, action, changes = {}, justification = null) {
  try {
    const u = ctx?.user || {};
    const entries = Object.keys(changes).length ? Object.entries(changes) : [[null, [null, null]]];
    for (const [field, [before, after]] of entries) {
      q.insert('audit_log', {
        org_id: ctx?.orgId ?? null, user_id: u.id ?? null, user_name: u.name ?? 'System',
        entity_type: entityType, entity_id: String(entityId), action, field,
        before_value: fmt(before), after_value: fmt(after), justification,
        created_at: ctx?.now || new Date().toISOString(),
      });
    }
  } catch (e) { console.error('[audit] write failed:', e.message); }
}
const fmt = (v) => (v == null ? null : typeof v === 'object' ? JSON.stringify(v) : String(v));

export function diff(before, after, fields) {
  const out = {};
  for (const f of fields || Object.keys(after)) {
    if (after[f] === undefined) continue;
    const b = before?.[f] ?? null; const a = after[f] ?? null;
    if (String(b ?? '') !== String(typeof a === 'object' && a !== null ? JSON.stringify(a) : a ?? '')) out[f] = [b, a];
  }
  return out;
}

// Stage-then-justify: when the org requires justification, a governed change must carry a note.
export function justificationRequired(orgId) {
  const r = q.get("SELECT value FROM governance_settings WHERE org_id = ? AND key = 'justification_required'", orgId);
  return r ? r.value === '1' : true;
}

export const VERSIONED = new Set(['ai_use_case', 'template', 'rex_entry', 'track_config', 'business_rule', 'control']);

export function snapshot(ctx, entityType, entityId, data, justification = null) {
  const last = q.get('SELECT MAX(version) v FROM entity_versions WHERE entity_type = ? AND entity_id = ?', entityType, entityId)?.v || 0;
  q.run('UPDATE entity_versions SET is_current = 0 WHERE entity_type = ? AND entity_id = ?', entityType, entityId);
  q.insert('entity_versions', {
    org_id: ctx?.orgId ?? null, entity_type: entityType, entity_id: entityId, version: last + 1,
    data: JSON.stringify(data), user_id: ctx?.user?.id ?? null, user_name: ctx?.user?.name ?? 'System',
    justification, is_current: 1, created_at: ctx?.now || new Date().toISOString(),
  });
  return last + 1;
}

export const versionsOf = (entityType, entityId) =>
  q.all('SELECT id, version, user_name, justification, is_current, created_at, data FROM entity_versions WHERE entity_type = ? AND entity_id = ? ORDER BY version DESC', entityType, entityId)
    .map((v) => ({ ...v, data: json(v.data, {}) }));
