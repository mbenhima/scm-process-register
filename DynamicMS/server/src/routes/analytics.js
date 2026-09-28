// Dashboards, portfolio overview and benchmarking (FR-DA-REP-01, FR-DA-PFO, FR-DA-BMK).
import { Router } from 'express';
import { all, get, P } from '../db.js';
import { requirePerm, can, assertFeature } from '../auth.js';
import { h, send, bad, loadProject, requireOrg, orgAccess, langOf, forbidden } from '../http.js';
import { catalog, loc } from '../catalog/store.js';
import { config } from '../config.js';

const r = Router();
const L = (en, fr, ar) => ({ en, fr, ar });

r.get('/projects/:id/dashboard', requirePerm('dashboard.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const c = catalog();
  const s = get(`SELECT COUNT(*) n, SUM(status='Done') done, SUM(status='InProgress') prog, SUM(status<>'Done' AND due_date < date('now')) overdue,
                 SUM(status='Done' AND completed_at <= due_date || 'T23:59:59') ontime FROM step_exec WHERE project_id=?`, p.id);
  const mine = get(`SELECT COUNT(*) n FROM step_exec WHERE project_id=? AND status<>'Done' AND (assignee_user=? OR assignee_role IN (${req.user.roles.map(() => '?').join(',') || "''"}))`, p.id, req.user.id, ...req.user.roles).n;
  const phases = all('SELECT e2e_id, status, gate_decision, seq FROM phases WHERE project_id=? ORDER BY seq', p.id).map(ph => {
    const x = get(`SELECT COUNT(*) n, SUM(status='Done') d FROM step_exec WHERE project_id=? AND e2e_id=?`, p.id, ph.e2e_id);
    return { ...ph, name: c.e2eById[ph.e2e_id].name, progress: Math.round(100 * x.d / Math.max(1, x.n)) };
  });
  const kpis = all('SELECT id, code, name, target, target_text, direction, unit FROM kpis WHERE project_id=? ORDER BY source DESC, code', p.id).map(k => {
    const series = all('SELECT period, value FROM kpi_values WHERE kpi_id=? ORDER BY period', k.id);
    const last = series[series.length - 1]?.value;
    return { ...k, name: P(k.name), series, last, onTarget: k.target === null || last === undefined ? null : k.direction === 'down' ? last <= k.target : last >= k.target };
  });
  const ncs = all(`SELECT stage, COUNT(*) n FROM ncs WHERE project_id=? GROUP BY stage`, p.id);
  const actions = get(`SELECT COUNT(*) n, SUM(status<>'Closed') open, SUM(status<>'Closed' AND due_date < date('now')) overdue, SUM(effectiveness='Effective') eff, SUM(effectiveness IS NOT NULL) evaluated FROM actions WHERE project_id=?`, p.id);
  const alerts = all(`SELECT severity, COUNT(*) n FROM alerts WHERE project_id=? AND dismissed=0 AND read_at IS NULL GROUP BY severity`, p.id);
  const heat = all(`SELECT likelihood l, impact i, COUNT(*) n FROM risks WHERE project_id=? AND kind<>'Opportunity' GROUP BY l, i`, p.id);
  const upcoming = all(`SELECT id, step_id, mp_id, due_date, status, assignee_role FROM step_exec WHERE project_id=? AND status<>'Done' ORDER BY due_date LIMIT 8`, p.id).map(x => ({ ...x, name: c.stepById[x.step_id]?.name, mpCode: c.mpById[x.mp_id]?.code }));
  const audits = all(`SELECT id, code, title, type, planned_date, status FROM audits WHERE project_id=? AND status='Planned' ORDER BY planned_date LIMIT 4`, p.id).map(a => ({ ...a, title: P(a.title) }));
  const ai = get(`SELECT COUNT(*) n, SUM(outcome='Accepted') acc, SUM(outcome='Edited') ed, SUM(outcome='Rejected') rej FROM ai_usage_log WHERE project_id=?`, p.id);
  const monthly = all(`SELECT substr(completed_at,1,7) m, COUNT(*) n FROM step_exec WHERE project_id=? AND status='Done' GROUP BY m ORDER BY m`, p.id);
  send(req, res, { steps: s, mine, phases, kpis, ncs, actions, alerts, heat, upcoming, audits, ai, monthly, progress: Math.round(100 * s.done / Math.max(1, s.n)) });
}));

// ---- Portfolio overview: one row per project, one column per E2E stage
const CELL = { Closed: 'Completed', Active: 'In progress', AtGate: 'At gate', OnHold: 'On hold', Planned: 'Not started' };
r.get('/portfolio', requirePerm('tenancy.view', 'dashboard.view'), h((req, res) => {
  const c = catalog();
  let orgs;
  if (req.query.groupId) orgs = all('SELECT * FROM organizations WHERE group_id=?', req.query.groupId);
  else if (req.query.orgIds) orgs = String(req.query.orgIds).split(',').map(id => get('SELECT * FROM organizations WHERE id=?', id)).filter(Boolean);
  else orgs = all('SELECT * FROM organizations WHERE id=?', req.user.org_id);
  orgs = orgs.filter(o => orgAccess(req, o.id));
  const lang = langOf(req);
  const stages = c.e2e.map(e => ({ id: e.id, name: e.name }));
  const rowsOut = [];
  for (const o of orgs) for (const p of all('SELECT * FROM projects WHERE org_id=? ORDER BY code', o.id)) {
    const ph = Object.fromEntries(all('SELECT e2e_id, status, run_count FROM phases WHERE project_id=?', p.id).map(x => [x.e2e_id, x]));
    rowsOut.push({ id: p.id, code: p.code, name: P(p.name), org: P(o.name), orgId: o.id, access: orgAccess(req, o.id), ms: p.ms_type, mode: p.mode, progress: p.progress_cache,
      cells: Object.fromEntries(stages.map(s => [s.id, ph[s.id] ? { status: CELL[ph[s.id].status] || ph[s.id].status, runs: ph[s.id].run_count } : { status: 'Not applicable', runs: 0 }])) });
  }
  const totals = Object.fromEntries(stages.map(s => [s.id, rowsOut.reduce((acc, r2) => { const st = r2.cells[s.id].status; acc[st] = (acc[st] || 0) + 1; return acc; }, {})]));
  if (req.query.format === 'csv') {
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Code', 'Project', 'Organization', 'MS', 'Progress', ...stages.map(s => s.id)].map(q).join(',')];
    for (const x of rowsOut) lines.push([x.code, loc(x.name, lang), loc(x.org, lang), x.ms, `${x.progress}%`, ...stages.map(s => x.cells[s.id].status + (x.cells[s.id].runs > 1 ? ` (x${x.cells[s.id].runs})` : ''))].map(q).join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="portfolio.csv"');
    return res.send('﻿' + lines.join('\r\n'));
  }
  send(req, res, { stages, rows: rowsOut, totals, legend: ['Completed', 'In progress', 'At gate', 'On hold', 'Not started', 'Not applicable'] });
}));

// ---- Benchmark metric catalog (one module, consumed by every benchmark screen)
export const METRICS = [
  { id: 'progress', unit: '%', good: 'up', label: L('Lifecycle progress', 'Avancement du cycle de vie', 'تقدم دورة الحياة'), explain: L('Share of workflow steps completed.', 'Part des étapes du workflow terminées.', 'نسبة خطوات سير العمل المنجزة.'),
    sql: `SELECT 100.0*SUM(status='Done')/COUNT(*) v FROM step_exec WHERE project_id=?` },
  { id: 'ontime', unit: '%', good: 'up', label: L('Steps completed on time', 'Étapes terminées à l\'heure', 'الخطوات المنجزة في موعدها'), explain: L('Completed steps closed by their due date.', 'Étapes terminées au plus tard à leur échéance.', 'الخطوات المنجزة قبل موعد استحقاقها أو فيه.'),
    sql: `SELECT 100.0*SUM(completed_at <= due_date || 'T23:59:59')/MAX(1,SUM(status='Done')) v FROM step_exec WHERE project_id=? AND status='Done'` },
  { id: 'overdue', unit: '%', good: 'down', label: L('Overdue steps', 'Étapes en retard', 'الخطوات المتأخرة'), explain: L('Open steps past their due date, as a share of open steps.', 'Étapes ouvertes échues, en part des étapes ouvertes.', 'الخطوات المفتوحة المتجاوزة لموعدها كنسبة من الخطوات المفتوحة.'),
    sql: `SELECT 100.0*SUM(due_date < date('now'))/MAX(1,COUNT(*)) v FROM step_exec WHERE project_id=? AND status<>'Done'` },
  { id: 'kpi', unit: '%', good: 'up', label: L('KPIs on target', 'KPI dans la cible', 'المؤشرات ضمن المستهدف'), explain: L('KPIs whose last value meets the target.', 'KPI dont la dernière valeur atteint la cible.', 'المؤشرات التي تبلغ آخر قيمة لها المستهدف.'), compute: 'kpi' },
  { id: 'ncdays', unit: 'd', good: 'down', label: L('Days to close a nonconformity', 'Jours pour clôturer une NC', 'أيام إغلاق حالة عدم المطابقة'), explain: L('Average days from detection to closure.', 'Délai moyen entre détection et clôture.', 'متوسط الأيام من الكشف إلى الإغلاق.'),
    sql: `SELECT AVG(julianday(closed_at)-julianday(detected_at)) v FROM ncs WHERE project_id=? AND closed_at IS NOT NULL` },
  { id: 'effective', unit: '%', good: 'up', label: L('Effective actions', 'Actions efficaces', 'الإجراءات الفعالة'), explain: L('Evaluated actions judged effective by an independent evaluator.', 'Actions évaluées jugées efficaces par un évaluateur indépendant.', 'الإجراءات المقيّمة التي حكم مقيّم مستقل بفعاليتها.'),
    sql: `SELECT 100.0*SUM(effectiveness='Effective')/MAX(1,SUM(effectiveness IS NOT NULL)) v FROM actions WHERE project_id=?` },
  { id: 'ai', unit: '%', good: 'up', label: L('AI suggestions accepted', 'Suggestions IA acceptées', 'اقتراحات الذكاء الاصطناعي المقبولة'), explain: L('Accepted or edited suggestions out of all decided suggestions.', 'Suggestions acceptées ou modifiées parmi les suggestions tranchées.', 'الاقتراحات المقبولة أو المعدلة من بين الاقتراحات المحسومة.'),
    sql: `SELECT 100.0*SUM(outcome IN ('Accepted','Edited'))/MAX(1,SUM(outcome<>'Pending')) v FROM ai_usage_log WHERE project_id=?` },
];
function metricValue(m, projectId) {
  if (m.compute === 'kpi') {
    const ks = all('SELECT id, target, direction FROM kpis WHERE project_id=? AND target IS NOT NULL', projectId);
    if (!ks.length) return null;
    let ok = 0;
    for (const k of ks) { const v = get('SELECT value FROM kpi_values WHERE kpi_id=? ORDER BY period DESC LIMIT 1', k.id)?.value; if (v !== undefined && (k.direction === 'down' ? v <= k.target : v >= k.target)) ok++; }
    return (100 * ok) / ks.length;
  }
  const v = get(m.sql, projectId)?.v;
  return v === null || v === undefined ? null : v;
}
const round = (v) => (v === null ? null : Math.round(v * 10) / 10);
const avg = (xs) => { const a = xs.filter(x => x !== null); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
function rank(list, good) {
  const sorted = list.filter(x => x.value !== null).map(x => x.value).sort((a, b) => (good === 'up' ? b - a : a - b));
  return list.map(x => ({ ...x, rank: x.value === null ? null : sorted.indexOf(x.value) + 1 }));
}

r.get('/benchmark/metrics', requirePerm('benchmark.view'), h((req, res) => send(req, res, METRICS.map(({ sql, compute, ...m }) => m))));
r.get('/benchmark/internal', requirePerm('benchmark.view'), h((req, res) => {
  const orgId = req.query.orgId || req.user.org_id;
  requireOrg(req, orgId);
  assertFeature(orgId, 'benchmark');
  const dim = ['ms_type', 'mode', 'track', 'vertical'].includes(req.query.dimension) ? req.query.dimension : 'ms_type';
  const projs = all('SELECT id, code, name, ms_type, mode, track, vertical FROM projects WHERE org_id=?', orgId);
  const vals = projs.map(p => ({ ...p, v: Object.fromEntries(METRICS.map(m => [m.id, metricValue(m, p.id)])) }));
  const segs = [...new Set(vals.map(p => p[dim] || '—'))];
  send(req, res, {
    dimension: dim, metrics: METRICS.map(({ sql, compute, ...m }) => ({ ...m, orgValue: round(avg(vals.map(p => p.v[m.id]))),
      segments: rank(segs.map(s => ({ segment: s, count: vals.filter(p => (p[dim] || '—') === s).length, value: round(avg(vals.filter(p => (p[dim] || '—') === s).map(p => p.v[m.id]))) })), m.good) })),
    projects: vals.map(p => ({ id: p.id, code: p.code, name: P(p.name), segment: p[dim] || '—', values: Object.fromEntries(Object.entries(p.v).map(([k, v]) => [k, round(v)])) })),
  });
}));
r.get('/benchmark/group', requirePerm('benchmark.group'), h((req, res) => {
  const groupId = req.query.groupId || req.user.group_id;
  if (!groupId) throw bad('NO_GROUP', 'Your organization does not belong to a group.');
  if (!req.user.is_platform_admin && req.user.group_id !== groupId) throw forbidden();
  if (req.user.org_id) assertFeature(req.user.org_id, 'benchmark_group');
  const orgs = all('SELECT * FROM organizations WHERE group_id=? ORDER BY short_code', groupId);
  const sharing = orgs.filter(o => o.benchmark_sharing);
  const msFilter = ['QMS', 'QHSE'].includes(req.query.ms) ? req.query.ms : null;
  const per = sharing.map(o => {
    const ps = all(`SELECT id FROM projects WHERE org_id=? ${msFilter ? 'AND ms_type=?' : ''}`, o.id, ...(msFilter ? [msFilter] : []));
    return { id: o.id, name: P(o.name), code: o.short_code, sector: o.sector, size: o.size, projects: ps.length, own: o.id === req.user.org_id, v: Object.fromEntries(METRICS.map(m => [m.id, avg(ps.map(p => metricValue(m, p.id)))])) };
  });
  const enough = per.length >= config.minBenchmarkSample;
  send(req, res, {
    groupId, participating: per.length, excluded: orgs.length - sharing.length, minSample: config.minBenchmarkSample, suppressed: !enough,
    metrics: enough ? METRICS.map(({ sql, compute, ...m }) => ({ ...m, groupAverage: round(avg(per.map(o => o.v[m.id]))), orgs: rank(per.map(o => ({ id: o.id, name: o.name, code: o.code, sector: o.sector, own: o.own, value: round(o.v[m.id]) })), m.good) })) : [],
  });
}));

export default r;
