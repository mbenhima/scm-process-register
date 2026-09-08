import { randomUUID } from 'node:crypto';
import db from '../db/index.js';

export function writeAudit(req, action, entityType, entityId, oldValue, newValue) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, organization_id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      randomUUID(),
      req.user?.organizationId || null,
      req.user?.id || null,
      action,
      entityType,
      entityId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      req.ip || null,
    );
  } catch (e) {
    // Audit logging must never break the primary request.
    console.error('audit log failed', e.message);
  }
}
