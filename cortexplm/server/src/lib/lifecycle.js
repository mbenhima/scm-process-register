// CortexPLM lifecycle engine: innovation projects moving through E2E processes, gate checklists (MP-122)
// and phase-gate decisions (MP-121), under the track rules of Part 7 and the business rules of D03.
// All mutating functions take a context { user, orgId, now, notify } so the seed and the API share code.
import { q, json } from '../db.js';
import { E2E, GATE, GATE_OF_E2E, TRACKS, TRACK_MATRIX, R2_TASKS, CONDITIONAL, STEPS, mpIdsIn, PROC } from './ref.js';
import { validateTaskData, businessCase, formFor } from './taskForms.js';
import { audit, diff } from './audit.js';
import { raiseAlert } from './alerts.js';
import { notifyUsers, notifyRoles } from './dispatch.js';
import { checkQuota } from './entitlements.js';

export class AppError extends Error { constructor(status, message, extra = {}) { super(message); this.status = status; Object.assign(this, extra); } }

const today = (ctx) => (ctx.now || new Date().toISOString()).slice(0, 10);
const nowIso = (ctx) => ctx.now || new Date().toISOString();
const addDays = (iso, n) => { const d = new Date(iso.slice(0, 10) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// ---------------------------------------------------------------- Track configuration (MP-123, versioned per organization)
export function matrixFor(orgId) {
  const v = q.get("SELECT data FROM entity_versions WHERE entity_type = 'track_config' AND entity_id = ? AND is_current = 1", orgId);
  const custom = v ? json(v.data, null)?.matrix : null;
  return custom ? { ...TRACK_MATRIX, ...custom } : TRACK_MATRIX;
}

// ---------------------------------------------------------------- Track selection (Section 7.4, BR-010)
export const CRITERIA = PROC.scoring.map((c, i) => ({ key: ['strategic', 'investment', 'novelty', 'regulatory', 'market', 'reach', 'integration'][i], label: c.Criterion, low: c['Score 1 (low)'], mid: c['Score 3 (medium)'], high: c['Score 5 (high)'] }));

export function recommendTrack(scores = {}, safetyCritical = false) {
  const vals = CRITERIA.map((c) => Number(scores[c.key]));
  if (vals.some((v) => !(v >= 1 && v <= 5))) throw new AppError(400, 'Score each of the 7 criteria from 1 to 5.');
  const total = vals.reduce((a, b) => a + b, 0);
  let recommended = total <= 14 ? 'Fast' : total <= 24 ? 'Light' : 'Full';
  const reasons = [];
  let minimum = 'Fast';
  if (vals.some((v) => v === 5)) { minimum = 'Light'; reasons.push('Fast Track is not allowed when any criterion scores 5.'); }
  if (Number(scores.regulatory) >= 4) { minimum = 'Light'; reasons.push('Light Track is the minimum when regulatory and safety exposure scores 4 or more.'); }
  if (safetyCritical) { minimum = 'Full'; reasons.push('Full Track is mandatory for any safety-critical product.'); }
  const rank = { Fast: 1, Light: 2, Full: 3 };
  if (rank[recommended] < rank[minimum]) recommended = minimum;
  const allowed = Object.keys(rank).filter((t) => rank[t] >= rank[minimum]);
  return { total, recommended, minimum, allowed, reasons };
}

// ---------------------------------------------------------------- People
const ROLE_OF = {
  'Product Manager': 'R03', 'Executive Sponsor': 'R01', Executive: 'R01', Marketing: 'R12', Sales: 'R12', UX: 'R12', 'R&D': 'R05',
  Engineering: 'R05', Finance: 'R10', Legal: 'R09', 'Compliance Officer': 'R08', Compliance: 'R08', HR: 'R19', 'Quality Assurance': 'R07',
  QA: 'R07', 'Gate Review Board': 'R02', 'Gate Board': 'R02', 'Process Owner': 'R17', Operations: 'R06', IT: 'R18', Service: 'R13',
  'Customer Success': 'R19', Customers: 'R21',
};
export const roleIdFor = (label) => ROLE_OF[label] || 'R03';

function usersWithRole(orgId, roleId) {
  return q.all('SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id WHERE u.org_id = ? AND ur.role_id = ? AND u.active = 1 ORDER BY u.id', orgId, roleId).map((r) => r.id);
}
function pick(orgId, roleId, project, salt, exclude = []) {
  if (roleId === 'R03' && project.owner_id && !exclude.includes(project.owner_id)) return project.owner_id;
  if (roleId === 'R01' && project.sponsor_id && !exclude.includes(project.sponsor_id)) return project.sponsor_id;
  const c = usersWithRole(orgId, roleId).filter((id) => !exclude.includes(id));
  if (!c.length) return usersWithRole(orgId, 'R03').find((id) => !exclude.includes(id)) || null;
  return c[(project.id * 7 + salt) % c.length];
}

// ---------------------------------------------------------------- Projects
export function createProject(ctx, input) {
  const { name, description, offer_type = 'Product', scores, safety_critical = false, track, override_reason, owner_id, sponsor_id,
    obs_node_id, planned_launch_date, budget, region, parent_product, template_id, optional_mps = [] } = input;
  if (!name?.trim()) throw new AppError(400, 'Project name is required.');
  checkQuota(ctx.orgId, 'projects');
  const rec = recommendTrack(scores, safety_critical);
  const chosen = track || rec.recommended;
  if (!rec.allowed.includes(chosen)) throw new AppError(400, `The ${chosen} Track is not allowed: ${rec.reasons.join(' ')}`);
  if (chosen !== rec.recommended && !override_reason?.trim()) throw new AppError(400, 'Choosing a track other than the recommended one needs a justification (MP-123, task 12).');
  const org = q.get('SELECT industry FROM organizations WHERE id = ?', ctx.orgId);
  const n = q.get('SELECT COUNT(*) n FROM projects WHERE org_id = ?', ctx.orgId).n + 1;
  const prefix = q.get('SELECT uid FROM organizations WHERE id = ?', ctx.orgId).uid.split('-')[1];
  const code = input.code || `${prefix}-${String(n).padStart(3, '0')}`;
  const id = q.insert('projects', {
    org_id: ctx.orgId, code, name: name.trim(), description, offer_type, track: chosen, recommended_track: rec.recommended,
    scores, score_total: rec.total, safety_critical, track_override_reason: override_reason || null, status: 'Active',
    owner_id: owner_id || ctx.user?.id, sponsor_id, obs_node_id, planned_launch_date, budget, region, parent_product, template_id,
    current_e2e: 'E2E-01', created_at: nowIso(ctx),
  });
  audit(ctx, 'project', id, 'create', { name: [null, name], track: [null, chosen], score_total: [null, rec.total] }, override_reason || null);
  if (chosen !== rec.recommended) audit(ctx, 'project', id, 'track_override', { track: [rec.recommended, chosen] }, override_reason);
  // Tailoring baseline (MP-124): mandatory processes auto-activated, industry-conditional ones by industry.
  const industryFlag = { Healthcare: ['Life Sciences', 'MedTech'], Transportation: ['Automotive'] }[org.industry] || [];
  for (const [mp, row] of Object.entries(matrixFor(ctx.orgId))) {
    let state = row[chosen];
    if (state.startsWith('If ')) state = industryFlag.includes(CONDITIONAL[mp]) ? 'Mandatory' : 'Optional';
    const selected = state === 'Mandatory' ? 'Mandatory' : state === 'Optional' ? (optional_mps.includes(mp) ? 'Selected' : 'Optional') : 'Not activated';
    q.insert('project_mps', { project_id: id, mp_id: mp, state: selected });
  }
  const project = getProject(id);
  startRun(ctx, project, 'E2E-01', { trigger: 'Project created (UFS-28 Configure Track & Macro Processes).' });
  return getProject(id);
}

export const getProject = (id) => q.get('SELECT * FROM projects WHERE id = ?', id);

export function projectForOrg(orgId, id) {
  const p = q.get('SELECT * FROM projects WHERE id = ? AND org_id = ?', id, orgId);
  if (!p) throw new AppError(404, 'Project not found.');
  return p;
}

// Tailoring changes (BR-011 / ACT-37): deselecting a mandatory process, or activating a not-activated
// one, needs a justification and executive approval.
export function setProjectMp(ctx, projectId, mpId, want, justification, canApprove) {
  const row = q.get('SELECT * FROM project_mps WHERE project_id = ? AND mp_id = ?', projectId, mpId);
  if (!row) throw new AppError(404, 'Macro process not found for this project.');
  const project = getProject(projectId);
  const base = matrixFor(project.org_id)[mpId][project.track];
  const guarded = (row.state === 'Mandatory' && want === 'Deselected') || (base === 'Not activated' && want === 'Selected');
  if (guarded) {
    if (!justification?.trim()) throw new AppError(400, 'A justification is required for this change (BR-011).');
    if (!canApprove) throw new AppError(403, 'Executive approval is required: only a user with tailoring approval rights can make this change (ACT-37).');
  }
  q.run('UPDATE project_mps SET state = ?, justification = ?, approved_by = ? WHERE project_id = ? AND mp_id = ?', want, justification || null, guarded ? ctx.user.id : null, projectId, mpId);
  audit(ctx, 'project', projectId, 'tailoring', { [mpId]: [row.state, want] }, justification || null);
}

// ---------------------------------------------------------------- Gate checklists (MP-122)
export function checklistTemplate(e2eId, gate, track) {
  const n = TRACKS[track].checklistItems;
  const base = GATE[gate].evidence.replace(/\.$/, '').split(/;\s*/).map((t) => ({ text: t.charAt(0).toUpperCase() + t.slice(1), source: `Gate ${gate} minimum evidence (Part 8)`, mandatory: 1 }));
  const mps = [...new Set([...E2E[e2eId].tasks.flatMap((t) => mpIdsIn(t.macroProcesses)), ...mpIdsIn(E2E[e2eId].related)])].filter((m) => !['MP-121', 'MP-122', 'MP-123', 'MP-124'].includes(m));
  const extra = [];
  const perMp = Object.fromEntries(mps.map((m) => [m, STEPS.filter((s) => s.Parent_Macro_Process_ID === m)]));
  for (let i = 0; extra.length < 60 && i < 12; i += 1) {
    for (const m of mps) { const s = perMp[m][i]; if (s) extra.push({ text: `Evidence: ${s.Step_Name}`, source: s.Step_ID, mandatory: 0 }); }
  }
  const items = [...base, ...extra];
  // Mandatory share grows with rigor: Fast = gate evidence only, Light = + every 3rd, Full = + every 2nd.
  return items.slice(0, n).map((it, i) => ({ ...it, seq: i + 1, mandatory: it.mandatory || (track === 'Full' ? i % 2 === 0 : track === 'Light' ? i % 3 === 0 : 0) ? 1 : 0 }));
}

// ---------------------------------------------------------------- E2E runs
function tasksForRun(project, e2eId, branch) {
  let list = E2E[e2eId].tasks;
  if (e2eId === 'E2E-08') list = list.filter((t) => (branch === 'A' ? /Branch A/.test(t.chainLink) : !/Branch A/.test(t.chainLink)));
  const out = list.map((t) => ({ ...t, light: 0 }));
  // Rule R1: Light Track runs UFT-06-04 / UFT-06-05 in light form ahead of E2E-07.
  if (e2eId === 'E2E-07' && project.track === 'Light') {
    const e6 = E2E['E2E-06'].tasks.filter((t) => ['UFT-06-04', 'UFT-06-05'].includes(t.id)).map((t) => ({ ...t, light: 1 }));
    out.unshift(...e6);
  }
  return out;
}

const kindOf = (t) => (/^Complete Gate Checklist/.test(t.name) ? 'checklist' : /^Approve T[-\d]+ Gate/.test(t.name) ? 'gate' : 'work');

export function startRun(ctx, project, e2eId, { trigger, branch = null, scheduledStart = null, durationDays = 7 } = {}) {
  const runNo = (q.get('SELECT MAX(run_no) n FROM e2e_runs WHERE project_id = ? AND e2e_id = ?', project.id, e2eId)?.n || 0) + 1;
  const start = scheduledStart || today(ctx);
  const status = scheduledStart && scheduledStart > today(ctx) ? 'Scheduled' : 'In progress';
  const runId = q.insert('e2e_runs', { org_id: project.org_id, project_id: project.id, e2e_id: e2eId, run_no: runNo, status, branch, trigger_note: trigger, scheduled_start: scheduledStart, started_at: status === 'Scheduled' ? null : nowIso(ctx) });
  let cursor = start;
  tasksForRun(project, e2eId, branch).forEach((t, i) => {
    const kind = kindOf(t);
    const owner = pick(project.org_id, roleIdFor(t.R), project, i);
    let evaluator = pick(project.org_id, roleIdFor(t.A), project, i + 3, [owner]);
    if (evaluator === owner) evaluator = null;
    const dur = kind === 'gate' ? 5 : kind === 'checklist' ? 4 : durationDays;
    const skippable = project.track === 'Fast' && R2_TASKS.includes(t.id);
    q.insert('run_tasks', {
      org_id: project.org_id, run_id: runId, project_id: project.id, uft_id: t.id, seq: i + 1, name: t.name, kind,
      status: 'To do', owner_id: owner, evaluator_id: evaluator, planned_start: cursor, due_date: addDays(cursor, dur),
      light_form: t.light, data: skippable ? { r2Skippable: true } : null,
    });
    cursor = addDays(cursor, dur);
  });
  const gate = GATE_OF_E2E[e2eId];
  const hasGate = gate && TRACKS[project.track].gates.includes(gate) && !(e2eId === 'E2E-08' && branch === 'A');
  if (hasGate) {
    const gid = q.insert('gate_reviews', { org_id: project.org_id, run_id: runId, project_id: project.id, gate, status: 'Open' });
    for (const it of checklistTemplate(e2eId, gate, project.track)) {
      q.insert('checklist_items', { org_id: project.org_id, gate_review_id: gid, seq: it.seq, text: it.text, source: it.source, mandatory: it.mandatory, evidence_required: it.mandatory ? 1 : 0 });
    }
  }
  if (e2eId !== 'E2E-09') q.run('UPDATE projects SET current_e2e = ? WHERE id = ?', e2eId, project.id);
  audit(ctx, 'e2e_run', runId, 'start', { e2e: [null, e2eId], run_no: [null, runNo] }, trigger);
  if (ctx.notify !== false) {
    const owners = q.all('SELECT DISTINCT owner_id FROM run_tasks WHERE run_id = ?', runId).map((r) => r.owner_id);
    notifyUsers(project.org_id, owners, 'task', 'run.started', { project: project.name, e2e: `${e2eId} ${E2E[e2eId].name}` }, { entityType: 'e2e_run', entityId: runId, now: nowIso(ctx) });
  }
  return runId;
}

// Activate runs whose scheduled start (Rule R1 observation period) has arrived.
export function activateScheduledRuns(ctx) {
  for (const r of q.all("SELECT id FROM e2e_runs WHERE status = 'Scheduled' AND scheduled_start <= ?", today(ctx))) {
    q.run("UPDATE e2e_runs SET status = 'In progress', started_at = ? WHERE id = ?", nowIso(ctx), r.id);
  }
}

// ---------------------------------------------------------------- Tasks
export function taskForOrg(orgId, id) {
  const t = q.get('SELECT * FROM run_tasks WHERE id = ? AND org_id = ?', id, orgId);
  if (!t) throw new AppError(404, 'Task not found.');
  return t;
}

function assertEditable(ctx, task, project, canManage) {
  if (project.status !== 'Active') throw new AppError(409, `The project is ${project.status}; tasks cannot change.`);
  const run = q.get('SELECT status FROM e2e_runs WHERE id = ?', task.run_id);
  if (run.status === 'Scheduled') throw new AppError(409, 'This E2E run has not started yet (observation period, Rule R1).');
  if (!canManage && task.owner_id !== ctx.user.id) throw new AppError(403, 'Only the task owner or a process manager can update this task.');
}

export function startTask(ctx, taskId, canManage) {
  const t = taskForOrg(ctx.orgId, taskId); const p = getProject(t.project_id);
  assertEditable(ctx, t, p, canManage);
  if (t.status !== 'To do') return t;
  q.run("UPDATE run_tasks SET status = 'In progress', started_at = ?, pct = 10 WHERE id = ?", nowIso(ctx), taskId);
  audit(ctx, 'task', taskId, 'start', { status: ['To do', 'In progress'] });
  return taskForOrg(ctx.orgId, taskId);
}

export function completeTask(ctx, taskId, { data = {}, output = '' } = {}, canManage = false) {
  const t = taskForOrg(ctx.orgId, taskId); const p = getProject(t.project_id);
  assertEditable(ctx, t, p, canManage);
  if (['Done', 'Skipped'].includes(t.status)) throw new AppError(409, 'This task is already closed.');
  if (t.kind === 'gate') throw new AppError(409, 'A gate task closes when the Gate Review Board records its decision.');
  const effects = [];
  if (t.kind === 'checklist') {
    const g = q.get('SELECT id FROM gate_reviews WHERE run_id = ? ORDER BY id DESC LIMIT 1', t.run_id);
    const open = q.get("SELECT COUNT(*) n FROM checklist_items WHERE gate_review_id = ? AND mandatory = 1 AND status NOT IN ('Complete','Waived')", g.id).n;
    if (open) throw new AppError(409, `${open} mandatory checklist item(s) are still open without an approved waiver (BR-004).`, { rule: 'BR-004' });
  } else {
    const errors = validateTaskData(t.uft_id, data);
    if (!String(output).trim()) errors.unshift('Result / output is required.');
    if (errors.length) throw new AppError(400, errors.join(' '), { errors });
  }
  const merged = { ...(json(t.data, {}) || {}), ...data };
  q.run("UPDATE run_tasks SET status = 'Done', completed_at = ?, pct = 100, data = ?, output = ?, started_at = COALESCE(started_at, ?) WHERE id = ?",
    nowIso(ctx), JSON.stringify(merged), output || t.output, nowIso(ctx), taskId);
  audit(ctx, 'task', taskId, 'complete', { status: [t.status, 'Done'], output: [t.output, output] });
  q.run("UPDATE alerts SET resolved_at = ? WHERE entity_type = 'task' AND entity_id = ? AND resolved_at IS NULL", nowIso(ctx), taskId);
  applyEffects(ctx, t, p, data, effects);
  afterTaskClosed(ctx, t);
  if (ctx.notify !== false && t.evaluator_id) notifyUsers(p.org_id, [t.evaluator_id], 'task', 'task.evaluate', { task: t.name, project: p.name }, { entityType: 'task', entityId: t.id, now: nowIso(ctx) });
  return { task: taskForOrg(ctx.orgId, taskId), effects, rexPrompt: true };
}

function applyEffects(ctx, t, p, data, effects) {
  const set = (fields) => { q.update('projects', p.id, fields); audit(ctx, 'project', p.id, 'update', diff(p, fields)); };
  if (formFor(t.uft_id).some((f) => f.effect === 'BR-002')) {
    const bc = businessCase(data); // ACT-02
    set({ npv: bc.npv, roi: bc.roi, payback_years: bc.payback, budget: Number(data.investment) });
    effects.push({ rule: 'BR-002', action: 'ACT-02', message: `NPV ${bc.npv} kUSD, ROI ${bc.roi}%, payback ${bc.payback ?? 'n/a'} years.` });
  }
  if (t.uft_id === 'UFT-01-02') {
    set({ strategic_fit: Number(data.strategic_fit) });
    if (Number(data.strategic_fit) < 50) { // BR-001 -> ACT-01 Park idea
      q.update('projects', p.id, { status: 'On Hold', hold_until: addDays(today(ctx), 90) });
      audit(ctx, 'project', p.id, 'status', { status: [p.status, 'On Hold'] }, 'Low strategic fit (BR-001 / ACT-01).');
      raiseAlert(p.org_id, 'SYS-04', { entityType: 'project', entityId: p.id, projectId: p.id, message: `${p.name}: parked, strategic-fit score ${data.strategic_fit} is below 50.`, now: nowIso(ctx), notify: ctx.notify !== false, extraUserIds: [p.owner_id] });
      effects.push({ rule: 'BR-001', action: 'ACT-01', message: 'Strategic-fit score below 50: the idea is parked (On Hold) for 90 days.' });
    }
  }
  if (t.uft_id === 'UFT-01-04') {
    q.insert('risks', { org_id: p.org_id, code: `${p.code}-R1`, name: data.top_risk, kind: 'Risk', category: 'Project', likelihood: Number(data.likelihood), impact: Number(data.impact), owner: 'Compliance Officer', status: 'Open', process_tag: 'MP-121', project_id: p.id });
    effects.push({ rule: 'MP-30-T1', message: 'Risk added to the risk register.' });
  }
  if (t.uft_id === 'UFT-05-02') set({ planned_launch_date: data.planned_launch_date });
}

function afterTaskClosed(ctx, t) {
  const run = q.get('SELECT * FROM e2e_runs WHERE id = ?', t.run_id);
  const open = q.get("SELECT COUNT(*) n FROM run_tasks WHERE run_id = ? AND status NOT IN ('Done','Skipped')", run.id).n;
  const hasGate = q.get('SELECT id FROM gate_reviews WHERE run_id = ?', run.id);
  if (open || hasGate) return;
  q.run("UPDATE e2e_runs SET status = 'Completed', completed_at = ? WHERE id = ?", nowIso(ctx), run.id);
  audit(ctx, 'e2e_run', run.id, 'complete', { status: [run.status, 'Completed'] });
  const project = getProject(run.project_id);
  if (run.e2e_id === 'E2E-08' && run.branch === 'A') {
    const reentry = json(q.get("SELECT data FROM run_tasks WHERE run_id = ? AND uft_id = 'UFT-08-04'", run.id)?.data, {})?.reentry || 'E2E-03';
    startRun(ctx, project, reentry, { trigger: `Relaunch (E2E-08 Branch A) re-enters ${reentry}.` });
  }
}

export function skipTask(ctx, taskId, reason, canManage) {
  const t = taskForOrg(ctx.orgId, taskId); const p = getProject(t.project_id);
  assertEditable(ctx, t, p, canManage);
  if (!json(t.data, {})?.r2Skippable) throw new AppError(409, 'Only Fast Track tasks that depend on non-activated macro processes can be skipped (Rule R2).');
  if (!reason?.trim()) throw new AppError(400, 'Give a reason for skipping.');
  q.run("UPDATE run_tasks SET status = 'Skipped', skip_reason = ?, completed_at = ? WHERE id = ?", reason, nowIso(ctx), taskId);
  audit(ctx, 'task', taskId, 'skip', { status: [t.status, 'Skipped'] }, reason);
  afterTaskClosed(ctx, t);
  return taskForOrg(ctx.orgId, taskId);
}

// Owner / Evaluator segregation (FR-DA-RBAC-04, NFR-DA-SEC-05).
export function evaluateTask(ctx, taskId, verdict, notes) {
  const t = taskForOrg(ctx.orgId, taskId);
  if (!['Effective', 'Not effective'].includes(verdict)) throw new AppError(400, 'Verdict must be Effective or Not effective.');
  if (t.status !== 'Done') throw new AppError(409, 'Only completed tasks can be evaluated.');
  if (t.owner_id === ctx.user.id) throw new AppError(403, 'The owner of a task cannot evaluate it (segregation of duties).');
  if (t.evaluator_id && t.evaluator_id !== ctx.user.id) throw new AppError(403, 'Only the assigned evaluator can evaluate this task.');
  q.run('UPDATE run_tasks SET evaluation = ?, evaluated_at = ?, evaluator_id = ? WHERE id = ?', JSON.stringify({ verdict, notes }), nowIso(ctx), ctx.user.id, taskId);
  audit(ctx, 'task', taskId, 'evaluate', { evaluation: [null, verdict] }, notes);
}

export function assignTask(ctx, taskId, { owner_id, evaluator_id, due_date }) {
  const t = taskForOrg(ctx.orgId, taskId);
  const o = owner_id ?? t.owner_id; const e = evaluator_id ?? t.evaluator_id;
  if (o && e && Number(o) === Number(e)) throw new AppError(400, 'Owner and evaluator must be different people.');
  for (const u of [o, e]) if (u && !q.get('SELECT id FROM users WHERE id = ? AND org_id = ?', u, ctx.orgId)) throw new AppError(400, 'Unknown user.');
  const fields = { owner_id: o, evaluator_id: e, due_date: due_date ?? t.due_date };
  q.update('run_tasks', taskId, fields);
  audit(ctx, 'task', taskId, 'assign', diff(t, fields));
}

// ---------------------------------------------------------------- Checklist items
export function updateChecklistItem(ctx, itemId, { action, evidence, reason }, perms) {
  const it = q.get('SELECT c.*, g.project_id, g.status gstatus, g.run_id FROM checklist_items c JOIN gate_reviews g ON g.id = c.gate_review_id WHERE c.id = ? AND c.org_id = ?', itemId, ctx.orgId);
  if (!it) throw new AppError(404, 'Checklist item not found.');
  if (!['Open', 'On hold'].includes(it.gstatus)) throw new AppError(409, 'The gate has been submitted; the checklist is frozen.');
  const upd = {};
  if (action === 'complete') {
    if (it.evidence_required && !String(evidence || '').trim() && !q.get("SELECT id FROM evidence_files WHERE entity_type = 'checklist_item' AND entity_id = ?", itemId)) {
      throw new AppError(409, 'Evidence is required before this item can be marked complete (BR-005).', { rule: 'BR-005' });
    }
    Object.assign(upd, { status: 'Complete', evidence: evidence || it.evidence, completed_by: ctx.user.id, completed_at: nowIso(ctx) });
  } else if (action === 'reopen') {
    Object.assign(upd, { status: 'Open', completed_by: null, completed_at: null });
  } else if (action === 'waive') {
    if (!String(reason || '').trim()) throw new AppError(400, 'A waiver needs a reason.');
    // CTL-04: waivers require board approval; others can only request one.
    const approve = perms.has('gate.decide');
    Object.assign(upd, approve ? { status: 'Waived', waiver_reason: reason, waiver_approved_by: ctx.user.id } : { status: 'Waiver requested', waiver_reason: reason });
  } else throw new AppError(400, 'Unknown checklist action.');
  q.update('checklist_items', itemId, upd);
  audit(ctx, 'checklist_item', itemId, action, { status: [it.status, upd.status] }, reason || evidence || null);
  return q.get('SELECT * FROM checklist_items WHERE id = ?', itemId);
}

// ---------------------------------------------------------------- Gates (MP-121)
export function gateForOrg(orgId, id) {
  const g = q.get('SELECT * FROM gate_reviews WHERE id = ? AND org_id = ?', id, orgId);
  if (!g) throw new AppError(404, 'Gate review not found.');
  return g;
}

export function submitGate(ctx, gateId) {
  const g = gateForOrg(ctx.orgId, gateId); const p = getProject(g.project_id);
  if (p.status !== 'Active') throw new AppError(409, `The project is ${p.status}.`);
  if (g.status !== 'Open') throw new AppError(409, `The gate is ${g.status}.`);
  const openWork = q.all("SELECT name FROM run_tasks WHERE run_id = ? AND kind != 'gate' AND status NOT IN ('Done','Skipped')", g.run_id);
  if (openWork.length) throw new AppError(409, `Complete these tasks before submitting the gate: ${openWork.map((t) => t.name).join('; ')}.`);
  const openMandatory = q.get("SELECT COUNT(*) n FROM checklist_items WHERE gate_review_id = ? AND mandatory = 1 AND status NOT IN ('Complete','Waived')", g.id).n;
  if (openMandatory) { // BR-004 -> ACT-03, ALR-01
    raiseAlert(ctx.orgId, 'ALR-01', { entityType: 'gate_review', entityId: g.id, projectId: p.id, message: `${p.name}: ${g.gate} submission blocked, ${openMandatory} mandatory item(s) open.`, now: nowIso(ctx), notify: ctx.notify !== false });
    throw new AppError(409, `Gate submission blocked: ${openMandatory} mandatory checklist item(s) are open without an approved waiver (BR-004).`, { rule: 'BR-004' });
  }
  if (g.gate === 'T3') { // BR-030: go-live requested while regulatory approvals are incomplete
    const reg = json(q.get("SELECT data FROM run_tasks WHERE run_id = ? AND uft_id = 'UFT-05-08'", g.run_id)?.data, {});
    if (reg?.approvals_complete === 'No') {
      raiseAlert(ctx.orgId, 'ALR-11', { entityType: 'gate_review', entityId: g.id, projectId: p.id, message: `${p.name}: go-live requested while regulatory approvals are incomplete.`, now: nowIso(ctx), notify: ctx.notify !== false });
      throw new AppError(409, 'Go-live is blocked: final regulatory validation reports incomplete approvals (BR-030).', { rule: 'BR-030' });
    }
  }
  q.update('gate_reviews', g.id, { status: 'Submitted', submitted_at: nowIso(ctx), submitted_by: ctx.user.id });
  q.run("UPDATE run_tasks SET status = 'In progress', started_at = COALESCE(started_at, ?) WHERE run_id = ? AND kind = 'gate'", nowIso(ctx), g.run_id);
  audit(ctx, 'gate_review', g.id, 'submit', { status: ['Open', 'Submitted'] });
  raiseAlert(ctx.orgId, 'SYS-06', { entityType: 'gate_review', entityId: g.id, projectId: p.id, message: `${p.name}: ${g.gate} gate pack is ready for decision.`, periodKey: `c${g.cycle}`, now: nowIso(ctx), notify: ctx.notify !== false }); // BR-006 -> ACT-04
  return gateForOrg(ctx.orgId, gateId);
}

export function decideGate(ctx, gateId, { decision, rationale, hold_until, recycle_tasks = [], next_path, votes }) {
  const g = gateForOrg(ctx.orgId, gateId); const p = getProject(g.project_id);
  if (g.status !== 'Submitted') throw new AppError(409, 'Only a submitted gate can be decided.');
  if (!['Go', 'Kill', 'Hold', 'Recycle'].includes(decision)) throw new AppError(400, 'Decision must be Go, Kill, Hold or Recycle.');
  if (p.owner_id === ctx.user.id) throw new AppError(403, 'The person accountable for the project cannot record its gate decision (CTL-01).', { control: 'CTL-01' });
  if (!String(rationale || '').trim()) throw new AppError(400, 'Record the decision rationale (BR-009, MP-121 task 11).', { rule: 'BR-009' });
  if (decision === 'Hold' && !hold_until) throw new AppError(400, 'A Hold decision needs a re-review date.');
  if (decision === 'Go' && g.gate === 'T5' && !['A', 'B'].includes(next_path)) throw new AppError(400, 'At T5 choose the next path: Relaunch (Branch A) or Retire (Branch B).');
  if (decision === 'Go' && g.gate === 'T5' && next_path === 'B' && p.track !== 'Full') throw new AppError(400, 'Only the Full Track has the retirement branch; the Light Track runs E2E-08 relaunch only.');
  const ts = nowIso(ctx);
  const upd = { status: decision === 'Hold' ? 'On hold' : decision === 'Recycle' ? 'Open' : 'Decided', decided_at: ts, decided_by: ctx.user.id, decision, rationale, hold_until: hold_until || null, recycle_tasks: recycle_tasks.length ? recycle_tasks : null, next_path: next_path || null, votes: votes || null };
  q.update('gate_reviews', g.id, upd);
  audit(ctx, 'gate_review', g.id, 'decision', { decision: [g.decision, decision] }, rationale);
  q.run("UPDATE alerts SET resolved_at = ? WHERE entity_type = 'gate_review' AND entity_id = ? AND type IN ('SYS-06','ALR-01') AND resolved_at IS NULL", ts, g.id);
  if (votes && Number(votes.against) > 0) raiseAlert(ctx.orgId, 'ALR-02', { entityType: 'gate_review', entityId: g.id, projectId: p.id, message: `${p.name}: ${g.gate} board vote was not unanimous (${votes.for} for, ${votes.against} against).`, periodKey: `vote${g.cycle}`, now: ts, notify: ctx.notify !== false });
  const result = { decision, started: [] };
  if (decision === 'Go') {
    q.run("UPDATE run_tasks SET status = 'Done', completed_at = ?, pct = 100, output = ? WHERE run_id = ? AND kind = 'gate'", ts, `Go: ${rationale}`, g.run_id);
    q.run("UPDATE e2e_runs SET status = 'Completed', completed_at = ? WHERE id = ?", ts, g.run_id);
    q.update('projects', p.id, { current_gate: g.gate });
    result.started = triggerNext(ctx, getProject(p.id), g, next_path);
  } else if (decision === 'Kill') {
    closeProject(ctx, p, 'Killed', g.run_id, rationale);
    result.rexPrompt = true;
  } else if (decision === 'Hold') {
    q.update('projects', p.id, { status: 'On Hold', hold_until });
    audit(ctx, 'project', p.id, 'status', { status: [p.status, 'On Hold'] }, rationale);
  } else if (decision === 'Recycle') {
    const run = q.get('SELECT * FROM e2e_runs WHERE id = ?', g.run_id);
    const targets = recycle_tasks.length ? recycle_tasks : q.all("SELECT uft_id FROM run_tasks WHERE run_id = ? AND kind = 'work'", run.id).map((r) => r.uft_id).slice(1);
    for (const uft of [...targets]) q.run("UPDATE run_tasks SET status = 'To do', pct = 0, completed_at = NULL, due_date = ? WHERE run_id = ? AND uft_id = ?", addDays(today(ctx), 10), run.id, uft);
    q.run("UPDATE run_tasks SET status = 'To do', pct = 0, completed_at = NULL, due_date = ? WHERE run_id = ? AND kind IN ('checklist','gate')", addDays(today(ctx), 14), run.id);
    q.run('UPDATE gate_reviews SET cycle = cycle + 1, submitted_at = NULL WHERE id = ?', g.id);
    result.recycled = targets;
  }
  if (ctx.notify !== false) notifyUsers(p.org_id, [p.owner_id, p.sponsor_id], 'gate', 'gate.decided', { project: p.name, gate: g.gate, decision }, { entityType: 'gate_review', entityId: g.id, now: ts });
  return result;
}

function closeProject(ctx, p, status, runId, reason) {
  const ts = nowIso(ctx);
  q.update('projects', p.id, { status, closed_at: ts });
  if (runId) q.run("UPDATE e2e_runs SET status = ? , completed_at = ? WHERE id = ?", status === 'Killed' ? 'Killed' : 'Completed', ts, runId);
  q.run("UPDATE e2e_runs SET status = 'Closed', completed_at = ? WHERE project_id = ? AND status IN ('In progress','Scheduled')", ts, p.id);
  q.run("UPDATE run_tasks SET status = 'Cancelled' WHERE project_id = ? AND status IN ('To do','In progress')", p.id);
  audit(ctx, 'project', p.id, 'status', { status: [p.status, status] }, reason);
  q.run('UPDATE alerts SET resolved_at = ? WHERE project_id = ? AND resolved_at IS NULL', ts, p.id);
}

// Chain relationships (Part 3) filtered by the project's track (Part 7, rules R1 and R3).
function triggerNext(ctx, p, g, nextPath) {
  const started = [];
  const go = (e2e, opts) => { started.push(e2e); return startRun(ctx, p, e2e, opts); };
  const active = (e2e) => q.get("SELECT id FROM e2e_runs WHERE project_id = ? AND e2e_id = ? AND status IN ('In progress','Scheduled')", p.id, e2e);
  const obs = Number(q.get("SELECT value FROM governance_settings WHERE org_id = ? AND key = 'light_observation_days'", p.org_id)?.value || 182);
  const next = {
    Full: { 'T-1': ['E2E-02'], T0: ['E2E-03'], T1: ['E2E-04'], T2: ['E2E-05'], T3: ['E2E-06', 'E2E-09'], T4: ['E2E-07'], T5: ['E2E-08'], T6: [] },
    Light: { 'T-1': ['E2E-02'], T0: ['E2E-03'], T1: ['E2E-04'], T2: ['E2E-05'], T3: ['E2E-07', 'E2E-09'], T5: ['E2E-08'] },
    Fast: { 'T-1': ['E2E-02'], T0: ['E2E-05'], T3: [] },
  }[p.track][g.gate] || [];
  if (g.gate === 'T3') q.update('projects', p.id, { actual_launch_date: today(ctx) });
  for (const e2e of next) {
    if (e2e === 'E2E-09' && active('E2E-09')) continue;
    if (e2e === 'E2E-07' && p.track === 'Light') { go(e2e, { trigger: `T3 Go-Live + ${obs}-day observation period (Rule R1).`, scheduledStart: addDays(today(ctx), obs) }); continue; }
    if (e2e === 'E2E-08') { go(e2e, { trigger: `T5 decision: ${nextPath === 'B' ? 'Retire (Branch B)' : 'Relaunch (Branch A)'}.`, branch: nextPath }); continue; }
    go(e2e, { trigger: `${g.gate} Go decision.` });
  }
  if (p.track === 'Fast' && g.gate === 'T3') { // Rule R3
    q.update('projects', p.id, { status: 'Launched', closed_at: nowIso(ctx) });
    audit(ctx, 'project', p.id, 'status', { status: [p.status, 'Launched'] }, 'Fast Track ends at T3; performance and retirement follow the parent product lifecycle (Rule R3).');
    q.run("UPDATE e2e_runs SET status = 'Closed' WHERE project_id = ? AND status IN ('In progress','Scheduled')", p.id);
  }
  if (g.gate === 'T6') closeProject(ctx, p, 'Retired', null, 'T6 End-of-Life confirmed.');
  return started;
}

export function resumeProject(ctx, projectId) {
  const p = getProject(projectId);
  if (p.status !== 'On Hold') throw new AppError(409, 'Only projects on hold can be resumed.');
  q.update('projects', p.id, { status: 'Active', hold_until: null });
  q.run("UPDATE gate_reviews SET status = 'Open', submitted_at = NULL WHERE project_id = ? AND status = 'On hold'", p.id);
  audit(ctx, 'project', p.id, 'status', { status: ['On Hold', 'Active'] }, 'Re-review: project resumed.');
}

// Manually start E2E-09 (parallel stream) once portfolio strategy is approved.
export function startParallelCampaign(ctx, projectId) {
  const p = getProject(projectId);
  if (!TRACKS[p.track].e2e.includes('E2E-09')) throw new AppError(409, 'E2E-09 is not part of the Fast Track.');
  if (q.get("SELECT id FROM e2e_runs WHERE project_id = ? AND e2e_id = 'E2E-09' AND status = 'In progress'", p.id)) throw new AppError(409, 'A campaign run is already in progress.');
  return startRun(ctx, p, 'E2E-09', { trigger: 'Portfolio strategy approved; parallel market stream started.' });
}

export { notifyRoles };
