// Alert & Notification Engine: one catalog of alert types, deduplicated raising,
// per-organization enablement and multi-channel dispatch (FR-DA-ALT, FR-DA-COMM).
import { run, get, all, uid, now, J } from '../db.js';
import { catalog } from '../catalog/store.js';

const L = (en, fr, ar) => ({ en, fr, ar });
export const ALERT_TYPES = {
  STEP_OVERDUE: { severity: 'Medium', name: L('Step overdue', 'Étape en retard', 'خطوة متأخرة'), description: L('A workflow step passed its due date without completion.', 'Une étape du workflow a dépassé son échéance sans être terminée.', 'تجاوزت خطوة سير العمل موعدها دون إنجاز.') },
  KPI_OFF_TARGET: { severity: 'High', name: L('KPI off target', 'KPI hors cible', 'مؤشر خارج المستهدف'), description: L('The latest measured value misses the KPI target.', 'La dernière valeur mesurée n\'atteint pas la cible du KPI.', 'آخر قيمة مقاسة لا تبلغ مستهدف المؤشر.') },
  NC_CRITICAL: { severity: 'Critical', name: L('Critical nonconformity', 'Non-conformité critique', 'عدم مطابقة حرجة'), description: L('A nonconformity rated Critical is open.', 'Une non-conformité critique est ouverte.', 'توجد حالة عدم مطابقة حرجة مفتوحة.') },
  ACTION_OVERDUE: { severity: 'Medium', name: L('Action overdue', 'Action en retard', 'إجراء متأخر'), description: L('An action passed its due date and is not closed.', 'Une action a dépassé son échéance sans être clôturée.', 'تجاوز إجراء موعده دون إغلاق.') },
  DOC_REVIEW_DUE: { severity: 'Low', name: L('Document review due', 'Revue documentaire à échéance', 'موعد مراجعة وثيقة'), description: L('A document reaches its review date within 30 days.', 'Un document atteint sa date de revue sous 30 jours.', 'تبلغ وثيقة موعد مراجعتها خلال 30 يومًا.') },
  GATE_PENDING: { severity: 'Medium', name: L('Gate decision pending', 'Décision de jalon en attente', 'قرار بوابة معلّق'), description: L('A phase is ready for its gate decision.', 'Une phase attend sa décision de jalon.', 'مرحلة بانتظار قرار البوابة.') },
};

export function alertEnabled(orgId, type) {
  const s = get('SELECT enabled FROM alert_settings WHERE org_id=? AND type=?', orgId, type);
  return s ? !!s.enabled : true;
}

// Raises an alert once per (organization, type, entity, period) and dispatches it to
// the users holding the escalation roles.
// A project created from a template follows the template's alert list: a type the template
// switched off is not raised for the project, and its severity and escalation role apply.
function projectAlert(projectId, type) {
  if (!projectId) return null;
  const p = get('SELECT blueprint FROM projects WHERE id=?', projectId);
  if (!p?.blueprint) return null;
  try { return (JSON.parse(p.blueprint).alerts || []).find(a => a.id === type) || null; } catch { return null; }
}
export function raise({ orgId, projectId, type, severity, title, entityType, entityId, escalation = [], stepRef = null, period }) {
  if (!alertEnabled(orgId, type)) return null;
  const pa = projectAlert(projectId, type);
  if (pa && pa.enabled === false) return null;
  if (pa?.severity) severity = pa.severity;
  if (pa?.escalation && !escalation.includes(pa.escalation)) escalation = [...escalation, pa.escalation];
  const p = period || now().slice(0, 7);
  const id = uid();
  const res = run(`INSERT OR IGNORE INTO alerts(id,org_id,project_id,type,severity,title,entity_type,entity_id,period,escalation,step_ref,created_at,dismissed)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,0)`, id, orgId, projectId, type, severity || ALERT_TYPES[type]?.severity || 'Medium', J(title), entityType, entityId, p, J(escalation), stepRef, now());
  if (!res.changes) return null;
  const users = all('SELECT id, roles FROM users WHERE org_id=? AND status=?', orgId, 'Active').filter(u => JSON.parse(u.roles).some(r => escalation.includes(r)));
  for (const u of users) for (const ch of ['in-app', 'email']) {
    run('INSERT INTO dispatches(id,org_id,user_id,alert_id,category,subject,channel,status,attempts,at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      uid(), orgId, u.id, id, type, J(title), ch, ch === 'in-app' ? 'Delivered' : 'Queued', ch === 'in-app' ? 1 : 0, now());
  }
  return id;
}

// Periodic scan for time-based alerts (overdue steps and actions, reviews due).
export function scan(today = now().slice(0, 10)) {
  let n = 0;
  const L2 = (t, x) => ({ en: t.en.replace('{0}', x.en ?? x), fr: t.fr.replace('{0}', x.fr ?? x), ar: t.ar.replace('{0}', x.ar ?? x) });
  for (const s of all(`SELECT id, org_id, project_id, step_id, assignee_role, due_date FROM step_exec WHERE status<>'Done' AND due_date < ? LIMIT 5000`, today)) {
    if (raise({ orgId: s.org_id, projectId: s.project_id, type: 'STEP_OVERDUE', title: L2(L('Step overdue: {0}', 'Étape en retard : {0}', 'خطوة متأخرة: {0}'), catalog().stepById[s.step_id]?.name || s.step_id), entityType: 'step', entityId: s.id, escalation: [s.assignee_role], stepRef: s.step_id })) n++;
  }
  for (const a of all(`SELECT id, org_id, project_id, title FROM actions WHERE status<>'Closed' AND due_date < ? LIMIT 5000`, today)) {
    const t = JSON.parse(a.title || '{}');
    if (raise({ orgId: a.org_id, projectId: a.project_id, type: 'ACTION_OVERDUE', title: L2(L('Action overdue: {0}', 'Action en retard : {0}', 'إجراء متأخر: {0}'), t), entityType: 'action', entityId: a.id, escalation: ['quality_manager'] })) n++;
  }
  return n;
}
