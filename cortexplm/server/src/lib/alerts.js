// Shared Alert Catalog (FR-DA-ALT-01, NFR-DA-MAINT-05): every alert type is named ONCE here, with its
// primary process tag, and consumed identically by seed data and live computation.
import { q } from '../db.js';
import { DLV } from './ref.js';
import { notifyRoles, notifyUsers } from './dispatch.js';

const NAMES = {
  'ALR-01': 'Gate submitted with open mandatory items', 'ALR-02': 'Gate decision escalated', 'ALR-03': 'Change order overdue past effectivity',
  'ALR-04': 'Restricted substance found in BOM', 'ALR-05': 'Major or critical non-conformance raised', 'ALR-06': 'CAPA overdue',
  'ALR-07': 'High FMEA risk priority', 'ALR-08': 'Supplier score below threshold', 'ALR-09': 'Component end-of-life notice',
  'ALR-10': 'Regulatory submission package incomplete', 'ALR-11': 'Go-live requested without regulatory approvals', 'ALR-12': 'SLA breach risk',
  'ALR-13': 'P1 ticket opened', 'ALR-14': 'Predicted failure within 14 days', 'ALR-15': 'Sensor reading outside design envelope',
  'ALR-16': 'Field MTBF below target', 'ALR-17': 'Privileged session anomaly', 'ALR-18': 'Integration failing repeatedly',
  'ALR-19': 'AI model accuracy below threshold', 'ALR-20': 'AI bias outside tolerance', 'ALR-21': 'Knowledge article review overdue',
  'ALR-22': 'Export-controlled data requested without clearance', 'ALR-23': 'Serious adverse event recorded', 'ALR-24': 'Demand exceeds capacity',
  'ALR-25': 'Should-cost above target cost',
};

export const ALERT_CATALOG = [
  ...DLV['D07 Alerts'].map((a) => ({
    type: a.Alert_ID, name: NAMES[a.Alert_ID], rule: a.Rule_Condition, severity: a.Severity, escalation: a.Escalation_Path,
    step: a.Linked_Step_ID, process: a.Linked_Step_ID.split('.')[0],
  })),
  { type: 'SYS-01', name: 'Task overdue', rule: 'Due date passed', severity: 'Medium', escalation: 'Task owner → Product Manager (2 days)', step: 'MP-121.7', process: 'MP-121' },
  { type: 'SYS-02', name: 'Licence expiring', rule: 'CTRL-003', severity: 'High', escalation: 'Platform Administrator (30 days before expiry)', step: 'MP-18', process: 'MP-18' },
  { type: 'SYS-03', name: 'Quota reached', rule: 'FR-DA-CFG-08', severity: 'Medium', escalation: 'Platform Administrator', step: 'MP-124.16', process: 'MP-124' },
  { type: 'SYS-04', name: 'Idea parked for low strategic fit', rule: 'BR-001', severity: 'Low', escalation: 'Product Manager → Portfolio Manager', step: 'MP-01.3', process: 'MP-01' },
  { type: 'SYS-05', name: 'On-hold project due for re-review', rule: 'Hold date reached', severity: 'Medium', escalation: 'Portfolio Manager → Gate Review Board Member', step: 'MP-121.10', process: 'MP-121' },
  { type: 'SYS-06', name: 'Gate pack ready for board review', rule: 'BR-006', severity: 'Low', escalation: 'Gate Review Board Member', step: 'MP-121.7', process: 'MP-121' },
];
export const ALERT = Object.fromEntries(ALERT_CATALOG.map((a) => [a.type, a]));

export const alertEnabled = (orgId, type) => {
  const r = q.get('SELECT enabled FROM alert_settings WHERE org_id = ? AND alert_type = ?', orgId, type);
  return r ? !!r.enabled : true;
};

// Raise an alert once per (type, entity, period) - FR-DA-ALT-03.
export function raiseAlert(orgId, type, { entityType = null, entityId = null, projectId = null, message, periodKey, now, notify = true, extraUserIds = [] } = {}) {
  const def = ALERT[type];
  if (!def || !alertEnabled(orgId, type)) return null;
  const ts = now || new Date().toISOString();
  const pk = periodKey || ts.slice(0, 10);
  const exists = q.get('SELECT id FROM alerts WHERE org_id = ? AND type = ? AND entity_type IS ? AND entity_id IS ? AND period_key = ?', orgId, type, entityType, entityId, pk);
  if (exists) return null;
  const id = q.insert('alerts', { org_id: orgId, type, severity: def.severity, entity_type: entityType, entity_id: entityId, project_id: projectId, message, period_key: pk, created_at: ts });
  if (notify) {
    const firstRole = def.escalation.split('→')[0].replace(/\(.*\)/, '').trim();
    notifyRoles(orgId, [firstRole], 'alert', 'alert.raised', { name: def.name, message, severity: def.severity }, { entityType: 'alert', entityId: id, now: ts });
    if (extraUserIds.length) notifyUsers(orgId, extraUserIds, 'alert', 'alert.raised', { name: def.name, message, severity: def.severity }, { entityType: 'alert', entityId: id, now: ts });
  }
  return id;
}

const workingDaysBetween = (a, b) => {
  let n = 0; const d = new Date(a);
  while (d < b) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) n += 1; }
  return n;
};

// Live recomputation (Alerts > "Run checks"; also runs every 15 minutes).
export function computeAlerts(orgId, now = new Date()) {
  const iso = now.toISOString();
  let raised = 0;
  const r = (...a) => { if (raiseAlert(...a)) raised += 1; };
  // ALR-02 / BR-008: gate decision pending more than 10 working days.
  for (const g of q.all("SELECT g.id, g.gate, g.submitted_at, g.project_id, p.name FROM gate_reviews g JOIN projects p ON p.id = g.project_id WHERE g.org_id = ? AND g.status = 'Submitted'", orgId)) {
    if (workingDaysBetween(new Date(g.submitted_at), now) > 10) r(orgId, 'ALR-02', { entityType: 'gate_review', entityId: g.id, projectId: g.project_id, message: `${g.name}: ${g.gate} decision pending for more than 10 working days.`, periodKey: 'pending', now: iso });
  }
  // SYS-01: overdue tasks.
  for (const t of q.all("SELECT t.id, t.name, t.due_date, t.project_id, t.owner_id, p.name pname FROM run_tasks t JOIN projects p ON p.id = t.project_id WHERE t.org_id = ? AND t.status IN ('To do','In progress') AND t.due_date < ? AND p.status = 'Active'", orgId, iso.slice(0, 10))) {
    r(orgId, 'SYS-01', { entityType: 'task', entityId: t.id, projectId: t.project_id, message: `${t.pname}: "${t.name}" was due ${t.due_date}.`, periodKey: 'overdue', now: iso, notify: false });
  }
  // SYS-05: hold re-review due.
  for (const p of q.all("SELECT id, name, hold_until FROM projects WHERE org_id = ? AND status = 'On Hold' AND hold_until IS NOT NULL AND hold_until <= ?", orgId, iso.slice(0, 10))) {
    r(orgId, 'SYS-05', { entityType: 'project', entityId: p.id, projectId: p.id, message: `${p.name}: re-review date ${p.hold_until} reached.`, periodKey: p.hold_until, now: iso });
  }
  // ALR-18 / BR-048: integration call fails 3 times in a row.
  for (const i of q.all('SELECT id, name FROM integrations WHERE org_id = ? AND enabled = 1', orgId)) {
    const last = q.all('SELECT result FROM integration_log WHERE integration_id = ? ORDER BY id DESC LIMIT 3', i.id);
    if (last.length === 3 && last.every((l) => l.result !== 'success')) r(orgId, 'ALR-18', { entityType: 'integration', entityId: i.id, message: `${i.name}: last 3 integration calls failed.`, periodKey: iso.slice(0, 10), now: iso });
  }
  return raised;
}
