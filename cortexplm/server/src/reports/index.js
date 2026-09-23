// Standard reports and cockpits (D08). Each report = its KPIs (D06) + one or more data tables built from
// the requesting tenant's live records.
import { q, json } from '../db.js';
import { DLV, E2E } from '../lib/ref.js';
import { computeKpis } from '../lib/kpis.js';

const pctDone = (runId) => {
  const t = q.get("SELECT COUNT(*) n, SUM(status IN ('Done','Skipped')) d FROM run_tasks WHERE run_id = ?", runId);
  return t.n ? Math.round((t.d / t.n) * 100) : 0;
};
const today = () => new Date().toISOString().slice(0, 10);

const T = {
  portfolio: (o) => ({ title: 'Project portfolio', columns: ['Code', 'Project', 'Track', 'Current E2E', 'Status', 'NPV (kUSD)', 'ROI (%)'],
    rows: q.all('SELECT code, name, track, current_e2e, status, npv, roi FROM projects WHERE org_id = ? ORDER BY code', o).map((p) => [p.code, p.name, p.track, p.current_e2e, p.status, p.npv, p.roi]) }),
  gates: (o) => ({ title: 'Gate reviews', columns: ['Project', 'Gate', 'Status', 'Checklist complete (%)', 'Decision', 'Decided', 'NPV (kUSD)'],
    rows: q.all(`SELECT p.code, p.name, g.id, g.gate, g.status, g.decision, g.decided_at, p.npv FROM gate_reviews g JOIN projects p ON p.id = g.project_id WHERE g.org_id = ? ORDER BY g.id DESC LIMIT 200`, o).map((g) => {
      const c = q.get("SELECT COUNT(*) n, SUM(status IN ('Complete','Waived')) d FROM checklist_items WHERE gate_review_id = ?", g.id);
      return [`${g.code} ${g.name}`, g.gate, g.status, c.n ? Math.round((c.d / c.n) * 100) : 0, g.decision || '', (g.decided_at || '').slice(0, 10), g.npv];
    }) }),
  gatePerf: (o) => ({ title: 'Decisions by gate', columns: ['Gate', 'Reviewed', 'Go', 'Kill', 'Hold', 'Recycle', 'Average cycle (days)'],
    rows: q.all(`SELECT gate, COUNT(*) n, SUM(decision='Go') go, SUM(decision='Kill') kill, SUM(decision='Hold') hold, SUM(cycle>1) recyc,
      ROUND(AVG(julianday(decided_at) - julianday(submitted_at)),1) cyc FROM gate_reviews WHERE org_id = ? AND decided_at IS NOT NULL GROUP BY gate ORDER BY gate`, o).map((r) => [r.gate, r.n, r.go, r.kill, r.hold, r.recyc, r.cyc]) }),
  pmCockpit: (o) => ({ title: 'Active projects', columns: ['Code', 'Project', 'Current E2E', 'Planned launch', 'Open tasks', 'Overdue tasks'],
    rows: q.all("SELECT id, code, name, current_e2e, planned_launch_date FROM projects WHERE org_id = ? AND status = 'Active' ORDER BY code", o).map((p) => [p.code, p.name, p.current_e2e, p.planned_launch_date || '',
      q.get("SELECT COUNT(*) n FROM run_tasks WHERE project_id = ? AND status IN ('To do','In progress')", p.id).n,
      q.get("SELECT COUNT(*) n FROM run_tasks WHERE project_id = ? AND status IN ('To do','In progress') AND due_date < ?", p.id, today()).n]) }),
  tasksOf: (ufts, title) => (o) => ({ title, columns: ['Project', 'Task', 'Owner', 'Status', 'Due', 'Output'],
    rows: q.all(`SELECT p.code, t.name, u.name owner, t.status, t.due_date, t.output FROM run_tasks t JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.owner_id
      WHERE t.org_id = ? AND t.uft_id IN (${ufts.map(() => '?').join(',')}) ORDER BY t.due_date DESC LIMIT 150`, o, ...ufts).map((r) => [r.code, r.name, r.owner, r.status, r.due_date, (r.output || '').slice(0, 120)]) }),
  dataOf: (uft, title, fields) => (o) => ({ title, columns: ['Project', ...fields.map((f) => f[1])],
    rows: q.all("SELECT p.code, p.name, t.data FROM run_tasks t JOIN projects p ON p.id = t.project_id WHERE t.org_id = ? AND t.uft_id = ? AND t.status = 'Done' ORDER BY p.code", o, uft)
      .map((r) => { const d = json(r.data, {}); return [`${r.code} ${r.name}`, ...fields.map((f) => (typeof f[0] === 'function' ? f[0](d) : d[f[0]] ?? ''))]; }) }),
  launch: (o) => ({ title: 'Launch readiness (E2E-05 runs in progress)', columns: ['Project', 'Run', 'Tasks done (%)', 'Planned launch'],
    rows: q.all("SELECT r.id, r.run_no, p.code, p.name, p.planned_launch_date FROM e2e_runs r JOIN projects p ON p.id = r.project_id WHERE r.org_id = ? AND r.e2e_id = 'E2E-05' AND r.status = 'In progress'", o).map((r) => [`${r.code} ${r.name}`, r.run_no, pctDone(r.id), r.planned_launch_date || '']) }),
  technician: (o) => ({ title: 'Service tasks due in the next 14 days', columns: ['Project', 'Task', 'Owner', 'Due', 'Status'],
    rows: q.all(`SELECT p.code, t.name, u.name owner, t.due_date, t.status FROM run_tasks t JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.owner_id
      WHERE t.org_id = ? AND t.status IN ('To do','In progress') AND t.due_date BETWEEN ? AND date(?, '+14 day') AND t.uft_id IN ('UFT-06-01','UFT-06-05','UFT-08-02','UFT-08-07') ORDER BY t.due_date`, o, today(), today()).map((r) => [r.code, r.name, r.owner, r.due_date, r.status]) }),
  aiUsage: (o) => ({ title: 'AI suggestion outcomes by use case', columns: ['Use case', 'Accepted', 'Edited', 'Rejected', 'Acceptance (%)'],
    rows: q.all("SELECT use_case_code c, SUM(outcome='Accepted') a, SUM(outcome='Edited') e, SUM(outcome='Rejected') r, COUNT(*) n FROM ai_usage_log WHERE org_id = ? GROUP BY c ORDER BY c", o).map((r) => [r.c, r.a, r.e, r.r, Math.round((r.a / r.n) * 100)]) }),
  health: (o) => ({ title: 'Integration health', columns: ['Integration', 'Enabled', 'Health', 'Last check', 'Calls', 'Success (%)'],
    rows: q.all('SELECT id, name, enabled, health_status, health_checked_at FROM integrations WHERE org_id = ? ORDER BY name', o).map((i) => {
      const c = q.get("SELECT COUNT(*) n, SUM(result='success') s FROM integration_log WHERE integration_id = ?", i.id);
      return [i.name, i.enabled ? 'Yes' : 'No', i.health_status, (i.health_checked_at || '').slice(0, 16), c.n, c.n ? Math.round((c.s / c.n) * 100) : ''];
    }) }),
  tailoring: (o) => ({ title: 'Tailoring deviations with justification', columns: ['Project', 'Macro process', 'State', 'Justification'],
    rows: q.all("SELECT p.code, m.mp_id, m.state, m.justification FROM project_mps m JOIN projects p ON p.id = m.project_id WHERE p.org_id = ? AND m.justification IS NOT NULL ORDER BY p.code", o).map((r) => [r.code, r.mp_id, r.state, r.justification]) }),
  launched: (o) => ({ title: 'Products and services in market', columns: ['Code', 'Offer', 'Type', 'Launched', 'Status'],
    rows: q.all("SELECT code, name, offer_type, actual_launch_date, status FROM projects WHERE org_id = ? AND actual_launch_date IS NOT NULL ORDER BY actual_launch_date DESC", o).map((r) => [r.code, r.name, r.offer_type, r.actual_launch_date, r.status]) }),
  quality: (o) => ({ title: 'Quality alerts', columns: ['Alert', 'Severity', 'Message', 'Raised'],
    rows: q.all("SELECT type, severity, message, created_at FROM alerts WHERE org_id = ? AND type IN ('ALR-05','ALR-06','ALR-07','ALR-16','ALR-01') ORDER BY id DESC LIMIT 100", o).map((r) => [r.type, r.severity, r.message, r.created_at.slice(0, 10)]) }),
  measurements: (kpis) => (o) => ({ title: 'Recorded measurements (last 12 periods)', columns: ['KPI', 'Period', 'Value'],
    rows: q.all(`SELECT kpi_id, period, value FROM kpi_values WHERE org_id = ? AND kpi_id IN (${kpis.map(() => '?').join(',')}) ORDER BY kpi_id, period DESC`, o, ...kpis).map((r) => [r.kpi_id, r.period, r.value]) }),
};

const TABLES = {
  'RPT-01': [T.portfolio], 'RPT-02': [T.gates], 'RPT-03': [T.gatePerf], 'RPT-04': [T.pmCockpit],
  'RPT-05': [T.tasksOf(['UFT-04-03', 'UFT-08-03'], 'Configuration and change tasks')], 'RPT-06': [T.tasksOf(['UFT-02-03', 'UFT-03-01', 'UFT-08-01'], 'Specification and requirements tasks')],
  'RPT-07': [T.measurements(['KPI-08', 'KPI-19'])], 'RPT-08': [T.quality, T.measurements(['KPI-10', 'KPI-11', 'KPI-12'])],
  'RPT-09': [T.dataOf('UFT-05-08', 'Final regulatory validation', [['approvals_complete', 'Approvals complete']]), T.tasksOf(['UFT-02-06', 'UFT-01-04'], 'Regulatory tasks')],
  'RPT-10': [T.measurements(['KPI-13', 'KPI-14'])],
  'RPT-11': [T.dataOf('UFT-07-02', 'Profitability by product', [['revenue', 'Revenue (kUSD)'], ['cogs', 'COGS (kUSD)'], [(d) => (d.revenue ? Math.round(((d.revenue - d.cogs) / d.revenue) * 1000) / 10 : ''), 'Gross margin (%)']])],
  'RPT-12': [T.launch], 'RPT-13': [T.dataOf('UFT-06-04', 'Customer satisfaction after launch', [['csat', 'CSAT'], ['nps', 'NPS']]), T.dataOf('UFT-07-03', 'Customer experience feedback', [['csat', 'CSAT'], ['nps', 'NPS']])],
  'RPT-14': [T.measurements(['KPI-22', 'KPI-23', 'KPI-24'])], 'RPT-15': [T.technician],
  'RPT-16': [T.dataOf('UFT-06-05', 'Field performance', [['mtbf_hours', 'MTBF (hours)']]), T.measurements(['KPI-25', 'KPI-26'])],
  'RPT-17': [T.measurements(['KPI-29', 'KPI-30', 'KPI-31'])], 'RPT-18': [T.aiUsage], 'RPT-19': [T.health], 'RPT-20': [T.tailoring],
  'RPT-21': [T.measurements(['KPI-27'])], 'RPT-22': [T.dataOf('UFT-05-06', 'Launch training', [['people_trained', 'People trained']]), T.measurements(['KPI-35'])],
  'RPT-23': [T.launched], 'RPT-24': [T.measurements(['KPI-13', 'KPI-14'])],
};

export const REPORTS = DLV['D08 Reports & Cockpits'].map((r) => ({ id: r.Report_ID, name: r.Report_Name, audience: r.Audience_Role, cadence: r.Refresh_Cadence, fields: r.Key_Fields_Shown }));

export function buildReport(orgId, id) {
  const def = REPORTS.find((r) => r.id === id);
  if (!def) return null;
  const want = def.fields.match(/KPI-\d+/g) || [];
  const all = computeKpis(orgId);
  const kpis = all.filter((k) => want.includes(k.id));
  const org = q.get('SELECT name, industry FROM organizations WHERE id = ?', orgId);
  return { ...def, organization: org.name, industry: org.industry, generatedAt: new Date().toISOString(), kpis, tables: (TABLES[id] || [T.portfolio]).map((f) => f(orgId)) };
}

export const e2eName = (id) => `${id} ${E2E[id]?.name || ''}`;
