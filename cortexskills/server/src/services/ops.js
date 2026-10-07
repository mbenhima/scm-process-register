// Platform operations: consistent online backups with retention (FR-DA-OPS-01..03), KPI recomputation,
// and the internal benchmarking engine (Section 3.12, FR-DA-BMK-01..09).
import fs from 'node:fs';
import path from 'node:path';
import { db, all, one, run } from '../db.js';
import { config } from '../config.js';
import { uuid, now, J, pick, addDays } from '../lib/util.js';
import * as cat from '../catalog.js';

export function backupNow(kind = 'on-demand') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(config.backupDir, `cortexskills-${stamp}.db`);
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`); // consistent copy while the service stays online
  const size = fs.statSync(file).size;
  run(`INSERT INTO backups(id,file,size,created_at,expires_at,kind) VALUES(?,?,?,?,?,?)`, uuid(), path.basename(file), size, now(), addDays(now(), config.backupRetentionDays), kind);
  purgeBackups();
  return { file: path.basename(file), size };
}
export function purgeBackups() {
  for (const b of all(`SELECT id, file FROM backups WHERE expires_at < ?`, now())) {
    try { fs.unlinkSync(path.join(config.backupDir, b.file)); } catch { /* already gone */ }
    run(`DELETE FROM backups WHERE id=?`, b.id);
  }
  // Files left by an earlier database (for example before a reseed) are not listed any more: remove them past retention.
  const known = new Set(all(`SELECT file FROM backups`).map(b => b.file)); const limit = Date.now() - config.backupRetentionDays * 86400000;
  if (fs.existsSync(config.backupDir)) for (const f of fs.readdirSync(config.backupDir)) {
    if (!/^cortexskills-[\w-]+\.db$/.test(f) || known.has(f)) continue;
    try { const full = path.join(config.backupDir, f); if (fs.statSync(full).mtimeMs < limit) fs.unlinkSync(full); } catch { /* in use or gone */ }
  }
}
export function listBackups() {
  return all(`SELECT * FROM backups ORDER BY created_at DESC`).filter(b => fs.existsSync(path.join(config.backupDir, b.file)));
}
export function scheduleDailyBackup() {
  const tick = () => {
    const last = one(`SELECT created_at FROM backups WHERE kind='daily' ORDER BY created_at DESC LIMIT 1`);
    if (!last || Date.now() - new Date(last.created_at) > 23.5 * 3600000) { try { backupNow('daily'); } catch (e) { console.warn('[backup]', e.message); } }
  };
  setTimeout(tick, 15000); return setInterval(tick, 3600000);
}

// ---------------------------------------------------------------- KPI engine
const pct = (a, b) => (b ? Math.round((a * 1000) / b) / 10 : 0);
/** Live computation of the standard KPIs that can be derived from records; others keep their recorded values. */
export const LIVE_KPIS = {
  'KPI-061': (p) => { const s = one(`SELECT COUNT(*) n FROM records WHERE entity='Stakeholder' AND project_id=?`, p).n; const r = one(`SELECT COUNT(DISTINCT json_extract(data,'$.stakeholder_ref')) n FROM records WHERE entity='QuestionnaireResponse' AND project_id=?`, p).n; return pct(r, s); },
  'KPI-004': (p) => { const t = one(`SELECT COUNT(*) n, SUM(status='Completed') d FROM task_instances WHERE project_id=? AND e2e_id='E2E-03'`, p); return pct(t.d || 0, t.n); },
};
export function recomputeKpis(orgId) {
  const per = new Date().toISOString().slice(0, 7);
  for (const p of all(`SELECT id FROM projects WHERE org_id=?`, orgId)) {
    for (const [kpi, fn] of Object.entries(LIVE_KPIS)) {
      const v = fn(p.id); const row = one(`SELECT id, target, direction FROM kpi_values WHERE project_id=? AND kpi_id=? AND period=?`, p.id, kpi, per);
      if (row) run(`UPDATE kpi_values SET value=?, status=? WHERE id=?`, v, ragOf(v, row.target, row.direction), row.id);
    }
  }
}
export function ragOf(v, target, dir = 'up') {
  if (target == null) return 'Amber';
  const ok = dir === 'down' ? v <= target : v >= target;
  const near = dir === 'down' ? v <= target * 1.2 : v >= target * 0.85;
  return ok ? 'Green' : near ? 'Amber' : 'Red';
}

// ---------------------------------------------------------------- Internal benchmarking
export const MIN_SAMPLE = 3;
/** Metric catalog, defined once (FR-DA-BMK-01). Records = end-to-end process instances. */
export const BENCHMARK_METRICS = [
  { id: 'progress', unit: '%', better: 'higher', calc: r => r.progress },
  { id: 'completion', unit: '%', better: 'higher', calc: r => pct(r.done, r.total) },
  { id: 'overdue', unit: '%', better: 'lower', calc: r => pct(r.overdue, r.total) },
  { id: 'cycle', unit: 'days', better: 'lower', calc: r => r.cycle },
  { id: 'aiShare', unit: '%', better: 'higher', calc: r => pct(r.ai, r.total) },
];
function e2eRows(orgId) {
  return all(`SELECT e.id, e.e2e_id, e.progress, e.phase, p.focus, p.mode, p.track, p.segment, p.obs_function,
      COUNT(t.id) total, SUM(t.status='Completed') done, SUM(t.status!='Completed' AND t.due_date < ?) overdue, SUM(t.ai_used) ai,
      AVG(CASE WHEN t.completed_at IS NOT NULL AND t.started_at IS NOT NULL THEN julianday(t.completed_at)-julianday(t.started_at) END) cycle
    FROM e2e_instances e JOIN projects p ON p.id=e.project_id LEFT JOIN task_instances t ON t.e2e_instance_id=e.id
    WHERE e.org_id=? GROUP BY e.id`, now(), orgId).map(r => ({ ...r, cycle: r.cycle == null ? null : Math.round(r.cycle * 10) / 10 }));
}
const median = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const avg = a => { const s = a.filter(x => x != null); return s.length ? Math.round((s.reduce((x, y) => x + y, 0) / s.length) * 10) / 10 : null; };

export function benchmarkWithin(orgId, dimension = 'focus') {
  const rows = e2eRows(orgId);
  const seg = r => dimension === 'phase' ? 'Phase ' + r.phase : dimension === 'family' ? (cat.get('e2e', r.e2e_id)?.family || '—') : (r[dimension] || '—');
  const groups = {}; for (const r of rows) (groups[seg(r)] ||= []).push(r);
  return BENCHMARK_METRICS.map(m => {
    const org = avg(rows.map(m.calc));
    const segments = Object.entries(groups).map(([k, v]) => ({ segment: k, n: v.length, comparable: v.length >= MIN_SAMPLE, value: avg(v.map(m.calc)) }));
    return { metric: m.id, unit: m.unit, better: m.better, organization: org, median: median(segments.filter(s => s.comparable).map(s => s.value)), segments };
  });
}
export function benchmarkGroup(orgId) {
  const me = one(`SELECT group_id FROM organizations WHERE id=?`, orgId);
  if (!me?.group_id) return { independent: true, metrics: [] };
  const orgs = all(`SELECT id, name, sector, benchmark_sharing FROM organizations WHERE group_id=?`, me.group_id);
  // Aggregates only: no record, title, person or identifier of another Organization leaves its tenant (FR-DA-BMK-04).
  const contrib = orgs.filter(o => o.benchmark_sharing || o.id === orgId).map(o => {
    const rows = e2eRows(o.id);
    return { self: o.id === orgId, name: o.name, sector: o.sector, n: rows.length, values: Object.fromEntries(BENCHMARK_METRICS.map(m => [m.id, avg(rows.map(m.calc))])) };
  });
  const metrics = BENCHMARK_METRICS.map(m => {
    const comp = contrib.filter(c => c.n >= MIN_SAMPLE && c.values[m.id] != null);
    const sorted = [...comp].sort((a, b) => m.better === 'higher' ? b.values[m.id] - a.values[m.id] : a.values[m.id] - b.values[m.id]);
    const rank = c => { if (c.n < MIN_SAMPLE) return null; const v = c.values[m.id]; return 1 + sorted.filter(x => (m.better === 'higher' ? x.values[m.id] > v : x.values[m.id] < v)).length; }; // ties share a rank
    return { metric: m.id, unit: m.unit, better: m.better, median: median(comp.map(c => c.values[m.id])),
      organizations: contrib.map(c => ({ self: c.self, name: c.name, sector: c.sector, n: c.n, comparable: c.n >= MIN_SAMPLE, value: c.values[m.id], rank: rank(c) })) };
  });
  return { independent: false, withdrawn: !orgs.find(o => o.id === orgId)?.benchmark_sharing, metrics };
}
