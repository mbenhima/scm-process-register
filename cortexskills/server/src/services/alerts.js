// Alert & Notification Engine. The alert catalog is defined once here and consumed identically by the seed
// and by live computation (FR-DA-ALT-01, NFR-DA-MAINT-05). Delivery goes through the shared dispatch service.
import { all, one, run } from '../db.js';
import { J, uuid, now, pick } from '../lib/util.js';
import * as cat from '../catalog.js';
import { t } from '../i18n.js';
import { dispatch } from './dispatch.js';
import { getLicenceProvider } from '../licensing/LicenceProvider.js';
import { quotas, usage } from '../entitlements.js';

export function alertCatalog() {
  const steps = cat.byId('step'); const rules = cat.byId('rule');
  return cat.list('alertType').map(a => {
    const s = steps.get(a.step); const r = rules.get(a.rule);
    return { ...a, name: a.name || s?.name, stage: s?.mp || null, stepName: s?.name, condition: r?.condition };
  });
}
export const period = (d = new Date()) => d.toISOString().slice(0, 7);

function raise(orgId, projectId, type, entityType, entityId, severity, message, stepId, when = now(), per = period()) {
  const enabled = one(`SELECT enabled FROM alert_settings WHERE org_id=? AND type=?`, orgId, type);
  if (enabled && !enabled.enabled) return null;
  // Deduplicated per type, entity and period by a unique index (FR-DA-ALT-03).
  const id = uuid();
  const r = run(`INSERT OR IGNORE INTO alerts(id,org_id,project_id,type,entity_type,entity_id,severity,period,message,step_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    id, orgId, projectId, type, entityType, entityId, severity, per, JSON.stringify(message), stepId, when);
  return r.changes ? id : null;
}

/** Recompute alerts for one organization from live data. */
export function computeAlerts(orgId) {
  const catAlerts = alertCatalog(); const raised = [];
  const byStep = new Map(); for (const a of catAlerts) (byStep.get(a.step) || byStep.set(a.step, []).get(a.step)).push(a);
  // Generic rule: an open task whose linked step carries an alert type raises it once overdue.
  const overdue = all(`SELECT t.id, t.project_id, t.uft_id, t.steps, t.due_date FROM task_instances t WHERE t.org_id=? AND t.status!='Completed' AND t.due_date < ?`, orgId, now());
  const ufts = cat.byId('uft');
  for (const tk of overdue) {
    const u = ufts.get(tk.uft_id); if (!u) continue;
    for (const sid of u.steps) for (const a of byStep.get(sid) || []) {
      const id = raise(orgId, tk.project_id, a.id, 'task', tk.id, a.severity, { key: 'alert.overdueStep', params: { step: sid, task: tk.uft_id } }, sid);
      if (id) raised.push(id);
    }
  }
  const lic = getLicenceProvider(orgId).check();
  if (lic.status === 'warning') { const id = raise(orgId, null, 'ALR-LIC-EXP', 'licence', orgId, 'High', { key: 'alert.licenceExpiry', params: { days: lic.daysLeft } }, 'MP-51.4'); if (id) raised.push(id); }
  const q = quotas(orgId), u = usage(orgId);
  for (const dim of ['projects', 'obs', 'aiCustom', 'questionnaires', 'users']) {
    if (q[dim] != null && u[dim] >= q[dim]) { const id = raise(orgId, null, 'ALR-QUOTA', 'quota', dim, 'Medium', { key: 'alert.quota', params: { dimension: dim, used: u[dim], limit: q[dim] } }, 'MP-51.6'); if (id) raised.push(id); }
  }
  const red = all(`SELECT project_id, kpi_id FROM kpi_values WHERE org_id=? AND status='Red' AND period=?`, orgId, period());
  for (const k of red) { const id = raise(orgId, k.project_id, 'ALR-KPI', 'kpi', k.kpi_id + ':' + k.project_id, 'Medium', { key: 'alert.kpiRed', params: { kpi: k.kpi_id } }, null); if (id) raised.push(id); }
  if (raised.length) notifyNew(orgId, raised);
  return raised.length;
}

function notifyNew(orgId, ids) {
  const heads = all(`SELECT DISTINCT u.id, u.language FROM users u JOIN user_roles r ON r.user_id=u.id WHERE u.org_id=? AND r.role_id IN ('R-03','R-01')`, orgId);
  for (const u of heads) dispatch({ orgId, userId: u.id, category: 'alerts', subjectKey: 'notify.newAlerts', params: { n: ids.length } });
}

export function alertText(a, lang) {
  const m = J(a.message, {});
  return m.key ? t(m.key, lang, m.params || {}) : pick(m, lang);
}
export { raise as raiseAlert };
