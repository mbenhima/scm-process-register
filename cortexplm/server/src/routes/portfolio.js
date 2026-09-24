// Tenancy tree (Group Yes/No > Organization > Projects) and the portfolio overview across a chosen scope.
// Every list is limited to the organizations the user may see (lib/scope.js).
import { Router } from 'express';
import { q, json } from '../db.js';
import { requirePerm } from '../lib/security.js';
import { E2E, E2E_IDS, TRACKS, GATE_OF_E2E } from '../lib/ref.js';
import { accessibleOrgs, scopedOrgIds } from '../lib/scope.js';
import { h } from './util.js';

const r = Router();
const today = () => new Date().toISOString().slice(0, 10);
const inList = (ids) => ids.map(() => '?').join(',') || 'NULL';

// ------------------------------------------------------------------ Tenancy tree
r.get('/tenancy', requirePerm('tenancy.view', 'hierarchy.manage'), h((req) => {
  const orgs = accessibleOrgs(req).map((o) => ({
    ...o, inGroup: !!o.group_id, own: o.id === req.orgId,
    users: q.get('SELECT COUNT(*) n FROM users WHERE org_id = ?', o.id).n,
    subscription: q.get('SELECT subscription_id FROM org_config WHERE org_id = ?', o.id)?.subscription_id,
    projects: q.all('SELECT id, code, name, track, status, offer_type, current_e2e FROM projects WHERE org_id = ? ORDER BY code', o.id),
  }));
  const groupIds = [...new Set(orgs.map((o) => o.group_id).filter(Boolean))];
  const allGroups = req.user.is_platform_admin ? q.all('SELECT * FROM groups_ ORDER BY id') : q.all(`SELECT * FROM groups_ WHERE id IN (${inList(groupIds)}) ORDER BY id`, ...groupIds);
  return {
    groups: allGroups.map((g) => ({ ...g, orgs: orgs.filter((o) => o.group_id === g.id) })),
    independent: orgs.filter((o) => !o.group_id),
    totals: { groups: allGroups.length, orgs: orgs.length, projects: orgs.reduce((s, o) => s + o.projects.length, 0) },
    scope: req.user.is_platform_admin ? 'platform' : orgs.length > 1 ? 'group' : 'organization',
  };
}));

// Filter options for the scope pickers: groups, organizations and projects the user may see.
r.get('/portfolio/scope', requirePerm('project.view'), h((req) => {
  const orgs = accessibleOrgs(req);
  const ids = orgs.map((o) => o.id);
  const groups = [...new Map(orgs.filter((o) => o.group_id).map((o) => [o.group_id, { id: o.group_id, name: o.group_name }])).values()];
  return {
    groups, hasIndependent: orgs.some((o) => !o.group_id),
    orgs: orgs.map((o) => ({ id: o.id, name: o.name, industry: o.industry, group_id: o.group_id, group_name: o.group_name })),
    projects: q.all(`SELECT id, org_id, code, name FROM projects WHERE org_id IN (${inList(ids)}) ORDER BY org_id, code`, ...ids),
  };
}));

// Projects across the chosen scope (read-only outside the user's own organization).
r.get('/portfolio/projects', requirePerm('project.view'), h((req) => {
  const orgs = scopedOrgIds(req);
  const ids = orgs.map((o) => o.id);
  const where = [`p.org_id IN (${inList(ids)})`]; const args = [...ids];
  for (const k of ['status', 'track']) if (req.query[k]) { where.push(`p.${k} = ?`); args.push(req.query[k]); }
  const projects = String(req.query.projects || '').split(',').filter(Boolean);
  if (projects.length) { where.push(`p.id IN (${inList(projects)})`); args.push(...projects); }
  const rows = q.all(`SELECT p.*, u.name owner_name FROM projects p LEFT JOIN users u ON u.id = p.owner_id WHERE ${where.join(' AND ')} ORDER BY p.org_id, p.code`, ...args);
  const byOrg = Object.fromEntries(orgs.map((o) => [o.id, o]));
  return rows.map((p) => {
    const t = q.get("SELECT COUNT(*) n, SUM(status IN ('Done','Skipped')) d, SUM(status IN ('To do','In progress') AND due_date < ?) late FROM run_tasks WHERE project_id = ?", today(), p.id);
    return { ...p, scores: json(p.scores, {}), org_name: byOrg[p.org_id]?.name, industry: byOrg[p.org_id]?.industry, group_name: byOrg[p.org_id]?.group_name || null, own: p.org_id === req.orgId,
      progress: t.n ? Math.round((t.d / t.n) * 100) : 0, overdue: t.late || 0, e2e_name: E2E[p.current_e2e]?.name };
  });
}));

// Portfolio overview: rows = projects, columns = E2E processes, cell = status of that process for the project.
export const CELL_STATES = [
  { key: 'Completed', tone: 's5', description: 'Every run of this process is finished and its gate passed (Go).' },
  { key: 'In progress', tone: 's3', description: 'Tasks of this process are being worked on.' },
  { key: 'At gate', tone: 's2', description: 'The gate closing this process is submitted and waits for the board decision.' },
  { key: 'On hold', tone: 'hold', description: 'The board put the project on hold at this gate.' },
  { key: 'Stopped', tone: 's1', description: 'The project was killed at this gate, or the run was stopped.' },
  { key: 'Not started', tone: 'open', description: 'Part of the project track, not started yet.' },
  { key: 'Not in track', tone: 'none', description: 'The project track does not include this process.' },
];

r.get('/portfolio/matrix', requirePerm('portfolio.view'), h((req) => {
  const orgs = scopedOrgIds(req);
  const ids = orgs.map((o) => o.id);
  const projects = String(req.query.projects || '').split(',').filter(Boolean);
  const where = [`org_id IN (${inList(ids)})`]; const args = [...ids];
  if (projects.length) { where.push(`id IN (${inList(projects)})`); args.push(...projects); }
  if (req.query.track) { where.push('track = ?'); args.push(req.query.track); }
  const rows = q.all(`SELECT id, org_id, code, name, track, status, current_e2e FROM projects WHERE ${where.join(' AND ')} ORDER BY org_id, code`, ...args);
  const byOrg = Object.fromEntries(orgs.map((o) => [o.id, o]));
  const out = rows.map((p) => {
    const runs = q.all('SELECT r.id, r.e2e_id, r.status, r.run_no, g.status gate_status, g.decision FROM e2e_runs r LEFT JOIN gate_reviews g ON g.run_id = r.id WHERE r.project_id = ? ORDER BY r.id', p.id);
    const cells = {};
    for (const e of E2E_IDS) {
      const mine = runs.filter((x) => x.e2e_id === e);
      const last = mine[mine.length - 1];
      let status;
      if (!last) status = TRACKS[p.track].e2e.includes(e) ? 'Not started' : 'Not in track';
      else if (last.status === 'Killed' || last.decision === 'Kill') status = 'Stopped';
      else if (last.gate_status === 'On hold' || last.decision === 'Hold') status = 'On hold';
      else if (last.gate_status === 'Submitted') status = 'At gate';
      else if (last.status === 'Completed') status = 'Completed';
      else status = 'In progress';
      cells[e] = { status, runs: mine.length, gate: GATE_OF_E2E[e], runId: last?.id || null };
    }
    return { ...p, org_name: byOrg[p.org_id]?.name, group_name: byOrg[p.org_id]?.group_name || null, own: p.org_id === req.orgId, cells };
  });
  const totals = Object.fromEntries(E2E_IDS.map((e) => [e, Object.fromEntries(CELL_STATES.map((s) => [s.key, out.filter((p) => p.cells[e].status === s.key).length]))]));
  return { e2e: E2E_IDS.map((id) => ({ id, name: E2E[id].name, gate: GATE_OF_E2E[id] })), rows: out, legend: CELL_STATES, totals };
}));

export default r;
