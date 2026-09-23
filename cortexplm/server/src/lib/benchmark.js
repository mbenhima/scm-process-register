// Internal benchmarking. Two scopes only, both inside the platform:
//  1. within an organization, comparing project segments (project type, track, owning department);
//  2. across the organizations of the same group, comparing organization-level aggregates.
// External benchmarking (against organizations outside the group or market data) is out of scope.
// Peer organizations are only ever seen as aggregates: no project, person or record of another tenant is returned.
import { q } from '../db.js';

const MIN_PROJECTS = 3; // a segment or peer with fewer projects is shown but flagged as not comparable

// Metric catalog. `better` tells which direction is good; `unit` is shown next to values.
export const METRICS = [
  { key: 'projects', label: 'Projects', unit: '', better: null },
  { key: 'launch_rate', label: 'Launch rate', unit: '%', better: 'high', help: 'Share of decided projects that reached launch (launched, relaunched or retired after launch).' },
  { key: 'go_rate', label: 'First-time Go rate', unit: '%', better: 'high', help: 'Decided gates passed with Go at the first decision, without an earlier Recycle or Hold.' },
  { key: 'recycle_rate', label: 'Recycle rate', unit: '%', better: 'low', help: 'Recycle decisions out of all gate decisions ever recorded (from the audit trail).' },
  { key: 'kill_rate', label: 'Kill rate', unit: '%', better: null, help: 'Projects stopped at a gate. Neither good nor bad on its own: early kills save money.' },
  { key: 'gate_cycle_days', label: 'Gate decision time', unit: 'days', better: 'low', help: 'Average days between gate submission and decision.' },
  { key: 'time_to_market_days', label: 'Time to market', unit: 'days', better: 'low', help: 'Average days from project creation to launch.' },
  { key: 'on_time_task_rate', label: 'Tasks completed on time', unit: '%', better: 'high', help: 'Completed tasks closed on or before their due date.' },
  { key: 'checklist_compliance', label: 'Checklist compliance', unit: '%', better: 'high', help: 'Mandatory checklist items of submitted gates completed with evidence; waived items count as missing evidence.' },
  { key: 'effective_rate', label: 'Tasks rated Effective', unit: '%', better: 'high', help: 'Evaluated tasks rated Effective by their evaluator.' },
  { key: 'avg_npv', label: 'Average NPV', unit: 'kUSD', better: 'high', help: 'Average net present value from the business cases.' },
  { key: 'avg_roi', label: 'Average ROI', unit: '%', better: 'high', help: 'Average return on investment from the business cases.' },
  { key: 'rex_rating', label: 'Lessons-learned rating', unit: '/5', better: 'high', help: 'Average effectiveness rating of lessons learned.' },
];

export const DIMENSIONS = {
  offer_type: { label: 'Project type', sql: 'p.offer_type' },
  track: { label: 'Track', sql: 'p.track' },
  department: { label: 'Owning department', sql: "COALESCE(o.name, 'Not assigned')" },
};

const round = (v, d = 1) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const pct = (a, b) => (b ? round((100 * a) / b) : null);
const days = (a, b) => (new Date(b) - new Date(a)) / 86400000;

// Gates passed with Go at the first decision (no earlier Recycle or Hold on the same gate).
function firstTimeGo(orgId, ids) {
  return q.get(`SELECT COUNT(*) n FROM gate_reviews g WHERE g.org_id = ? AND g.project_id IN (${ids}) AND g.decision = 'Go'
    AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.org_id = g.org_id AND a.entity_type = 'gate_review' AND a.entity_id = CAST(g.id AS TEXT)
      AND a.action = 'decision' AND a.field = 'decision' AND a.after_value IN ('Recycle', 'Hold'))`, orgId).n;
}

// Aggregates for a set of project ids of one organization.
function metricsFor(orgId, projectIds) {
  const n = projectIds.length;
  const out = { projects: n };
  if (!n) return out;
  const ids = projectIds.join(',');
  const projects = q.all(`SELECT id, status, created_at, actual_launch_date, npv, roi FROM projects WHERE org_id = ? AND id IN (${ids})`, orgId);
  const decided = projects.filter((p) => p.status !== 'Active' || p.actual_launch_date);
  const launched = projects.filter((p) => p.actual_launch_date);
  out.launch_rate = pct(launched.length, decided.length);
  out.kill_rate = pct(projects.filter((p) => p.status === 'Killed').length, n);
  out.time_to_market_days = launched.length ? round(launched.reduce((s, p) => s + days(p.created_at, p.actual_launch_date), 0) / launched.length, 0) : null;
  const npv = projects.filter((p) => p.npv != null); const roi = projects.filter((p) => p.roi != null);
  out.avg_npv = npv.length ? round(npv.reduce((s, p) => s + p.npv, 0) / npv.length, 0) : null;
  out.avg_roi = roi.length ? round(roi.reduce((s, p) => s + p.roi, 0) / roi.length) : null;
  const gates = q.all(`SELECT decision, submitted_at, decided_at FROM gate_reviews WHERE org_id = ? AND project_id IN (${ids}) AND decision IS NOT NULL`, orgId);
  // Every decision ever recorded (a Recycle later followed by a Go counts twice), read from the audit trail.
  const history = q.all(`SELECT a.after_value decision FROM audit_log a JOIN gate_reviews g ON g.id = CAST(a.entity_id AS INTEGER)
    WHERE a.org_id = ? AND a.entity_type = 'gate_review' AND a.action = 'decision' AND a.field = 'decision' AND g.project_id IN (${ids})`, orgId);
  out.go_rate = pct(firstTimeGo(orgId, ids), gates.length);
  out.recycle_rate = pct(history.filter((g) => g.decision === 'Recycle').length, history.length);
  const timed = gates.filter((g) => g.submitted_at && g.decided_at);
  out.gate_cycle_days = timed.length ? round(timed.reduce((s, g) => s + days(g.submitted_at, g.decided_at), 0) / timed.length) : null;
  const t = q.get(`SELECT COUNT(*) done, SUM(CASE WHEN substr(completed_at, 1, 10) <= due_date THEN 1 ELSE 0 END) ontime,
    SUM(CASE WHEN json_extract(evaluation, '$.verdict') IS NOT NULL THEN 1 ELSE 0 END) evaluated,
    SUM(CASE WHEN json_extract(evaluation, '$.verdict') = 'Effective' THEN 1 ELSE 0 END) effective
    FROM run_tasks WHERE org_id = ? AND project_id IN (${ids}) AND status = 'Done' AND kind = 'work'`, orgId);
  out.on_time_task_rate = pct(t.ontime || 0, t.done);
  out.effective_rate = pct(t.effective || 0, t.evaluated);
  const c = q.get(`SELECT COUNT(*) total, SUM(CASE WHEN c.status = 'Complete' AND (COALESCE(c.evidence, '') != '' OR EXISTS (SELECT 1 FROM evidence_files f WHERE f.entity_type = 'checklist_item' AND f.entity_id = c.id)) THEN 1 ELSE 0 END) ok
    FROM checklist_items c JOIN gate_reviews g ON g.id = c.gate_review_id WHERE c.org_id = ? AND g.project_id IN (${ids}) AND c.mandatory = 1 AND g.status != 'Open'`, orgId);
  out.checklist_compliance = pct(c.ok || 0, c.total);
  const r = q.get(`SELECT AVG(rating) a FROM rex_entries WHERE org_id = ? AND project_id IN (${ids}) AND rating IS NOT NULL`, orgId);
  out.rex_rating = round(r.a);
  return out;
}

// Median of the segments' values, used as the reference line; rank 1 = best.
function annotate(rows) {
  const stats = {};
  for (const m of METRICS) {
    const vals = rows.filter((r) => r.comparable && r.metrics[m.key] != null).map((r) => r.metrics[m.key]).sort((a, b) => a - b);
    const median = vals.length ? (vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2) : null;
    stats[m.key] = { median: round(median), min: vals[0] ?? null, max: vals[vals.length - 1] ?? null };
    if (m.better) {
      const order = [...vals].sort((a, b) => (m.better === 'high' ? b - a : a - b));
      for (const r of rows) {
        const v = r.metrics[m.key];
        r.ranks = r.ranks || {};
        r.ranks[m.key] = r.comparable && v != null ? order.indexOf(v) + 1 : null;
      }
    }
  }
  return stats;
}

// Scope 1: segments of the requesting organization.
export function internalBenchmark(orgId, dimension = 'offer_type', filters = {}) {
  const dim = DIMENSIONS[dimension];
  if (!dim) throw Object.assign(new Error('Unknown comparison dimension.'), { status: 400 });
  const where = ['p.org_id = ?']; const args = [orgId];
  if (filters.track) { where.push('p.track = ?'); args.push(filters.track); }
  if (filters.offer_type) { where.push('p.offer_type = ?'); args.push(filters.offer_type); }
  const rows = q.all(`SELECT ${dim.sql} segment, GROUP_CONCAT(p.id) ids FROM projects p LEFT JOIN obs_nodes o ON o.id = p.obs_node_id
    WHERE ${where.join(' AND ')} GROUP BY segment ORDER BY segment`, ...args)
    .map((r) => { const ids = r.ids.split(',').map(Number); return { segment: r.segment, comparable: ids.length >= MIN_PROJECTS, metrics: metricsFor(orgId, ids) }; });
  const all = q.all(`SELECT p.id FROM projects p WHERE ${where.join(' AND ')}`, ...args).map((r) => r.id);
  const stats = annotate(rows);
  return { scope: 'organization', dimension, dimensionLabel: dim.label, minProjects: MIN_PROJECTS, metrics: METRICS, rows, stats, total: metricsFor(orgId, all) };
}

export const sharesWithGroup = (orgId) => (q.get("SELECT value FROM governance_settings WHERE org_id = ? AND key = 'group_benchmark_sharing'", orgId)?.value ?? '1') === '1';

// Scope 2: organizations of the requesting organization's group. Returns aggregates only.
export function groupBenchmark(orgId, filters = {}) {
  const me = q.get('SELECT id, group_id FROM organizations WHERE id = ?', orgId);
  if (!me.group_id) return { scope: 'group', inGroup: false, rows: [], metrics: METRICS, stats: {} };
  const group = q.get('SELECT id, name FROM groups_ WHERE id = ?', me.group_id);
  const members = q.all('SELECT id, name, industry FROM organizations WHERE group_id = ? ORDER BY name', me.group_id);
  const rows = members.map((o) => {
    const self = o.id === orgId;
    const shared = self || sharesWithGroup(o.id);
    const where = ['org_id = ?']; const args = [o.id];
    if (filters.track) { where.push('track = ?'); args.push(filters.track); }
    if (filters.offer_type) { where.push('offer_type = ?'); args.push(filters.offer_type); }
    const ids = shared ? q.all(`SELECT id FROM projects WHERE ${where.join(' AND ')}`, ...args).map((r) => r.id) : [];
    return { segment: o.name, industry: o.industry, self, shared, comparable: shared && ids.length >= MIN_PROJECTS, metrics: shared ? metricsFor(o.id, ids) : {} };
  });
  const stats = annotate(rows);
  return { scope: 'group', inGroup: true, group: group.name, sharing: sharesWithGroup(orgId), minProjects: MIN_PROJECTS, metrics: METRICS, rows, stats };
}
