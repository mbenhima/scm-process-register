// Built-in KPIs (D06). Where the platform holds the source data, the value is computed live from current
// records (FR-DA-REP-01); otherwise the latest recorded measurement is shown and labelled as such.
import { q, json } from '../db.js';
import { DLV } from './ref.js';

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const days = (a, b) => (new Date(b) - new Date(a)) / 86400000;
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

function taskValues(orgId, ufts, key) {
  return q.all(`SELECT data FROM run_tasks WHERE org_id = ? AND status = 'Done' AND uft_id IN (${ufts.map(() => '?').join(',')})`, orgId, ...ufts)
    .map((r) => Number(json(r.data, {})?.[key])).filter((v) => Number.isFinite(v));
}

const LIVE = {
  'KPI-01': (o) => {
    const rows = q.all(`SELECT a.project_id, a.decided_at t1, b.decided_at t3 FROM gate_reviews a JOIN gate_reviews b ON b.project_id = a.project_id AND b.gate = 'T3' AND b.decision = 'Go'
      WHERE a.org_id = ? AND a.gate = 'T-1' AND a.decision = 'Go'`, o);
    return r1(avg(rows.map((r) => days(r.t1, r.t3))));
  },
  'KPI-02': (o) => r1(avg(q.all("SELECT submitted_at, decided_at FROM gate_reviews WHERE org_id = ? AND decided_at IS NOT NULL AND submitted_at IS NOT NULL", o).map((r) => days(r.submitted_at, r.decided_at)))),
  'KPI-03': (o) => {
    const d = q.all("SELECT decision, cycle FROM gate_reviews WHERE org_id = ? AND status = 'Decided'", o);
    return d.length ? r1((d.filter((g) => g.cycle === 1).length / d.length) * 100) : null;
  },
  'KPI-04': (o) => q.get("SELECT SUM(npv) s FROM projects WHERE org_id = ? AND status = 'Active'", o).s,
  'KPI-05': (o) => {
    const today = new Date().toISOString().slice(0, 10);
    const act = q.all("SELECT id FROM projects WHERE org_id = ? AND status = 'Active'", o);
    if (!act.length) return null;
    const late = act.filter((p) => q.get("SELECT COUNT(*) n FROM run_tasks WHERE project_id = ? AND status IN ('To do','In progress') AND due_date < ?", p.id, today).n > 0).length;
    return r1(((act.length - late) / act.length) * 100);
  },
  'KPI-16': (o) => {
    const l = q.all('SELECT planned_launch_date p, actual_launch_date a FROM projects WHERE org_id = ? AND planned_launch_date IS NOT NULL AND actual_launch_date IS NOT NULL', o);
    return l.length ? r1((l.filter((x) => Math.abs(days(x.p, x.a)) <= 14).length / l.length) * 100) : null;
  },
  'KPI-18': (o) => {
    const rows = q.all("SELECT data FROM run_tasks WHERE org_id = ? AND status = 'Done' AND uft_id = 'UFT-07-02'", o).map((r) => json(r.data, {})).filter((d) => d.revenue > 0);
    return rows.length ? r1(avg(rows.map((d) => ((d.revenue - d.cogs) / d.revenue) * 100))) : null;
  },
  'KPI-20': (o) => r1(avg(taskValues(o, ['UFT-06-04', 'UFT-07-03'], 'nps'))),
  'KPI-21': (o) => r1(avg(taskValues(o, ['UFT-06-04', 'UFT-07-03'], 'csat'))),
  'KPI-32': (o) => {
    const l = q.all('SELECT outcome FROM ai_usage_log WHERE org_id = ?', o);
    return l.length ? r1((l.filter((x) => x.outcome === 'Accepted').length / l.length) * 100) : null;
  },
  'KPI-33': (o) => {
    const l = q.all('SELECT result FROM integration_log WHERE org_id = ?', o);
    return l.length ? r1((l.filter((x) => x.result === 'success').length / l.length) * 100) : null;
  },
  'KPI-37': (o) => {
    const rows = q.all("SELECT data FROM run_tasks WHERE org_id = ? AND status = 'Done' AND uft_id = 'UFT-08-09'", o).map((r) => json(r.data, {}));
    const aff = rows.reduce((s, d) => s + Number(d.customers_affected || 0), 0);
    return aff ? r1((rows.reduce((s, d) => s + Number(d.customers_migrated || 0), 0) / aff) * 100) : null;
  },
  'KPI-38': (o) => {
    const t = q.get(`SELECT COUNT(*) n, SUM(CASE WHEN c.status = 'Complete' AND (c.evidence IS NOT NULL AND c.evidence != '') THEN 1 WHEN c.status = 'Waived' THEN 1 ELSE 0 END) ok
      FROM checklist_items c JOIN gate_reviews g ON g.id = c.gate_review_id WHERE c.org_id = ? AND c.mandatory = 1 AND g.status IN ('Submitted','Decided')`, o);
    return t.n ? r1((t.ok / t.n) * 100) : null;
  },
};

const UNITS = { 'KPI-01': 'days', 'KPI-02': 'days', 'KPI-04': 'kUSD', 'KPI-09': 'days', 'KPI-14': 'PPM', 'KPI-20': 'pts', 'KPI-21': '/5', 'KPI-24': 'hours', 'KPI-25': 'hours', 'KPI-29': 'kg CO2e' };
export const unitOf = (id) => UNITS[id] || '%';

export function evaluateTarget(target, value) {
  if (value == null) return 'none';
  const m = String(target).replace(/,/g, '').match(/(≤|≥)?\s*(-?[\d.]+)/);
  if (!m || /plan|year on year|product target/.test(target)) return 'info';
  const t = Number(m[2]); const op = m[1] || '≥';
  const ok = op === '≤' ? value <= t : value >= t;
  if (ok) return 'met';
  const gap = Math.abs(value - t) / (Math.abs(t) || 1);
  return gap <= 0.1 ? 'near' : 'missed';
}

export function computeKpis(orgId) {
  return DLV['D06 KPIs'].map((k) => {
    const live = LIVE[k.KPI_ID];
    let value = live ? live(orgId) : null;
    let source = live ? 'Computed live' : 'Recorded measurement';
    const series = q.all('SELECT period, value FROM kpi_values WHERE org_id = ? AND kpi_id = ? ORDER BY period', orgId, k.KPI_ID);
    if (value == null && series.length) { value = series[series.length - 1].value; source = live ? 'Recorded measurement (no live data yet)' : source; }
    return {
      id: k.KPI_ID, name: k.KPI_Name, type: k.Type, formula: k.Formula, target: k.Target, process: k.Linked_Macro_Process_ID,
      value, unit: unitOf(k.KPI_ID), source, status: evaluateTarget(k.Target, value), series,
    };
  });
}
