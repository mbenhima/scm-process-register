import { Router } from 'express';
import { ah, projectOf, parseMl } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { J, HttpError, now, pick } from '../lib/util.js';
import { requirePerm, has } from '../rbac.js';
import { audit } from '../audit.js';
import { buildReport, reportCatalog } from '../services/reports.js';
import { exportModel, MIME } from '../services/exporters.js';
import { computeAlerts, alertCatalog, alertText } from '../services/alerts.js';
import { benchmarkWithin, benchmarkGroup, BENCHMARK_METRICS, recomputeKpis } from '../services/ops.js';
import * as cat from '../catalog.js';

const r = Router();
r.get('/reports', requirePerm('reports.view'), ah(() => reportCatalog()));
r.get('/reports/:id', requirePerm('reports.view'), ah(req => buildReport(req, req.params.id, { projectId: req.query.project || null })));
/** File named with report key and date, correct MIME type, attachment disposition (FR-DA-REP-03). */
r.get('/reports/:id/export', requirePerm('reports.export'), ah(async (req, res) => {
  const fmt = String(req.query.format || 'pdf'); if (!MIME[fmt]) throw new HttpError(422, 'err.invalidOption', { field: 'format', value: fmt });
  const model = buildReport(req, req.params.id, { projectId: req.query.project || null });
  const buf = await exportModel(model, fmt);
  res.set({ 'Content-Type': MIME[fmt], 'Content-Disposition': `attachment; filename="${req.params.id}_${new Date().toISOString().slice(0, 10)}.${fmt}"` }).send(buf);
}));

// ------------------------------------------------------------------ KPIs
r.get('/kpis', requirePerm('reports.view'), ah(req => {
  recomputeKpis(req.orgId);
  const scope = req.query.project ? ['project_id=?', projectOf(req, req.query.project).id] : ['org_id=?', req.orgId];
  const latest = all(`SELECT kpi_id, AVG(value) value, AVG(target) target, MAX(period) period, SUM(status='Red') red, SUM(status='Amber') amber, SUM(status='Green') green FROM kpi_values WHERE ${scope[0]} AND period=(SELECT MAX(period) FROM kpi_values WHERE ${scope[0]}) GROUP BY kpi_id`, scope[1], scope[1]);
  const trend = all(`SELECT kpi_id, period, AVG(value) value FROM kpi_values WHERE ${scope[0]} GROUP BY kpi_id, period ORDER BY period`, scope[1]);
  const defs = all(`SELECT id, data FROM records WHERE entity='KpiDefinition' AND org_id=?`, req.orgId).map(x => ({ id: x.id, ...J(x.data) }));
  const custom = all(`SELECT id, data FROM records WHERE entity='CustomKpi' AND org_id=?`, req.orgId).map(x => ({ id: x.id, ...J(x.data) }));
  return { definitions: defs, latest, trend, custom };
}));

// ------------------------------------------------------------------ Alerts (FR-DA-ALT-01..05)
r.get('/alerts', requirePerm('alerts.view'), ah(req => {
  const rows = all(`SELECT a.*, x.read_at, x.dismissed FROM alerts a LEFT JOIN alert_reads x ON x.alert_id=a.id AND x.user_id=? WHERE a.org_id=? ${req.query.project ? 'AND a.project_id=?' : ''} ORDER BY a.created_at DESC LIMIT 400`, req.user.id, req.orgId, ...(req.query.project ? [req.query.project] : []));
  const catMap = new Map(alertCatalog().map(a => [a.id, a]));
  return rows.filter(a => !a.dismissed).map(a => ({ ...a, catalog: catMap.get(a.type) || null, text: alertText(a, req.lang), read: !!a.read_at }));
}));
r.get('/alerts/unread-count', requirePerm('alerts.view'), ah(req => ({ n: one(`SELECT COUNT(*) n FROM alerts a WHERE a.org_id=? AND NOT EXISTS (SELECT 1 FROM alert_reads x WHERE x.alert_id=a.id AND x.user_id=?)`, req.orgId, req.user.id).n })));
r.post('/alerts/run', requirePerm('alerts.view'), ah(req => ({ raised: computeAlerts(req.orgId) })));
r.post('/alerts/:id/read', requirePerm('alerts.view'), ah(req => {
  const a = one(`SELECT id FROM alerts WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!a) throw new HttpError(404, 'err.notFound');
  run(`INSERT INTO alert_reads(alert_id,user_id,read_at,dismissed) VALUES(?,?,?,?) ON CONFLICT(alert_id,user_id) DO UPDATE SET read_at=excluded.read_at, dismissed=max(dismissed, excluded.dismissed)`, a.id, req.user.id, now(), req.body?.dismiss ? 1 : 0);
  return { ok: true };
}));
r.post('/alerts/read-all', requirePerm('alerts.view'), ah(req => {
  for (const a of all(`SELECT id FROM alerts WHERE org_id=?`, req.orgId)) run(`INSERT OR IGNORE INTO alert_reads(alert_id,user_id,read_at,dismissed) VALUES(?,?,?,0)`, a.id, req.user.id, now());
  return { ok: true };
}));
r.get('/alert-catalog', requirePerm('alerts.view'), ah(() => alertCatalog()));
r.get('/notifications', ah(req => all(`SELECT d.*, (SELECT json_group_array(json_object('channel',channel,'status',status,'attempts',attempts)) FROM delivery_status s WHERE s.dispatch_id=d.id) deliveries FROM dispatches d WHERE d.user_id=? ORDER BY d.created_at DESC LIMIT 100`, req.user.id).map(d => ({ ...d, deliveries: J(d.deliveries, []) }))));

// ------------------------------------------------------------------ Dashboard
r.get('/dashboard', requirePerm('dashboard.view'), ah(req => {
  const o = req.orgId; const pid = req.query.project || null; const sc = pid ? ['project_id=?', projectOf(req, pid).id] : ['org_id=?', o];
  const counts = one(`SELECT COUNT(*) n, SUM(status='Completed') done, SUM(status='In progress') wip, SUM(status='Blocked') blocked, SUM(status!='Completed' AND due_date < ?) overdue FROM task_instances WHERE ${sc[0]}`, now(), sc[1]);
  const projects = all(`SELECT id, name, focus, segment, mode, track, progress, status FROM projects WHERE org_id=?`, o).map(parseMl);
  const phases = all(`SELECT phase, ROUND(AVG(progress)) progress, COUNT(*) n FROM e2e_instances WHERE ${sc[0]} GROUP BY phase ORDER BY phase`, sc[1]);
  const rag = all(`SELECT status, COUNT(*) n FROM kpi_values WHERE ${sc[0]} AND period=(SELECT MAX(period) FROM kpi_values WHERE ${sc[0]}) GROUP BY status`, sc[1], sc[1]);
  const trend = all(`SELECT substr(completed_at,1,7) month, COUNT(*) n FROM task_instances WHERE ${sc[0]} AND completed_at IS NOT NULL GROUP BY month ORDER BY month`, sc[1]);
  const planned = all(`SELECT substr(due_date,1,7) month, COUNT(*) n FROM task_instances WHERE ${sc[0]} GROUP BY month ORDER BY month`, sc[1]);
  const alerts = one(`SELECT COUNT(*) n FROM alerts a WHERE a.org_id=? AND NOT EXISTS (SELECT 1 FROM alert_reads x WHERE x.alert_id=a.id AND x.user_id=?)`, o, req.user.id).n;
  const mine = one(`SELECT COUNT(*) n FROM task_instances WHERE org_id=? AND owner_id=? AND status!='Completed'`, o, req.user.id).n;
  const topE2e = all(`SELECT e2e_id, ROUND(AVG(progress)) progress FROM e2e_instances WHERE ${sc[0]} GROUP BY e2e_id ORDER BY e2e_id`, sc[1]);
  const responses = one(`SELECT COUNT(*) n FROM records WHERE entity='QuestionnaireResponse' AND ${sc[0]}`, sc[1]).n;
  const stakeholders = one(`SELECT COUNT(*) n FROM records WHERE entity='Stakeholder' AND ${sc[0]}`, sc[1]).n;
  return { counts, projects, phases, rag, trend, planned, alerts, mine, topE2e, responses, stakeholders };
}));

// ------------------------------------------------------------------ Internal benchmarking (FR-DA-BMK-01..09)
r.get('/benchmark/metrics', requirePerm('benchmark.view'), ah(() => BENCHMARK_METRICS.map(({ calc, ...m }) => m)));
r.get('/benchmark/within', requirePerm('benchmark.view'), ah(req => benchmarkWithin(req.orgId, ['focus', 'mode', 'track', 'phase', 'obs_function'].includes(req.query.dimension) ? req.query.dimension : 'focus')));
r.get('/benchmark/group', requirePerm('benchmark.group'), ah(req => benchmarkGroup(req.orgId)));
r.put('/benchmark/sharing', requirePerm('benchmark.manage'), ah(req => {
  run(`UPDATE organizations SET benchmark_sharing=? WHERE id=?`, req.body.enabled ? 1 : 0, req.orgId);
  audit(req, 'BenchmarkSharing', req.orgId, req.body.enabled ? 'rejoin' : 'withdraw', null, { enabled: !!req.body.enabled }); return { ok: true };
}));
export default r;
