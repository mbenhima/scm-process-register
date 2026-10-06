// Organization provisioning (FR-DA-TEN-14) and project instantiation shared by the API and the seed.
import { all, one, run } from '../db.js';
import { uuid, now, S, J, pick, addDays, HttpError, rng } from '../lib/util.js';
import * as cat from '../catalog.js';
import { hashPassword } from '../auth.js';
import { guidanceFor } from './guidance.js';

export const PHASES = () => cat.list('phase');

/** Everything a new Organization receives on creation. */
export function provisionOrg(orgId, { packId = 'PK-01', starterTeam = false, domain, password = 'Welcome#2026', lang = 'en', seats = 100, addons = [], compliance = [], expiryDays = 400 } = {}, ids = uuid) {
  const t = now();
  run(`INSERT OR IGNORE INTO org_config(org_id,pack_id,addons,compliance,seats,justification_required,updated_at) VALUES(?,?,?,?,?,1,?)`, orgId, packId, S(addons), S(compliance), seats, t);
  issueSaasLicence(orgId, packId, seats, expiryDays);
  // OBS skeleton: functions of the organization.
  const org = one(`SELECT * FROM organizations WHERE id=?`, orgId);
  const vertical = cat.get('verticalSeed', org.sector);
  const root = ids(`obs:${orgId}:root`);
  run(`INSERT OR IGNORE INTO obs_nodes(id,org_id,name,type,created_at) VALUES(?,?,?,?,?)`, root, orgId, org.name, 'Organization', t);
  for (const fn of cat.list('function').concat(vertical ? [vertical.coreFunction] : [])) {
    run(`INSERT OR IGNORE INTO obs_nodes(id,org_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?)`, ids(`obs:${orgId}:${fn.id}`), orgId, root, S(fn.name), 'Function', t);
  }
  // Standard governance catalog, copied so the Organization can adapt it (FR-DA-GOV-01..05).
  const copy = (entity, list, map) => { for (const x of list) insertRecord(ids(`${entity}:${orgId}:${x.id}`), entity, orgId, null, x.id, map(x)); };
  copy('BusinessRule', cat.list('rule'), x => ({ code: x.id, condition: x.condition, action_id: x.action, rule_type: x.type, severity: x.severity, owner: x.owner, process_tag: x.step, status: 'Active' }));
  copy('Control', cat.list('control'), x => ({ code: x.id, name: x.name, description: x.description, control_type: x.type, coso: x.coso, frequency: x.frequency, owner: x.owner, effectiveness: x.effectiveness, process_tag: x.steps, standard: x.standard || null }));
  copy('RiskOpportunity', cat.list('risk'), x => ({ code: x.id, title: x.name, kind: 'Risk', category: x.category, likelihood: x.likelihood, impact: x.impact, score: x.likelihood * x.impact, inherent_score: x.inherent, residual_score: x.residual, controls: x.controls, kri: x.kri, owner: x.owner, status: 'Open' }));
  copy('KpiDefinition', cat.list('kpi'), x => ({ code: x.id, name: x.name, kpi_type: x.type, formula: x.formula, target: x.target, macro_process: x.mp, direction: x.direction }));
  copy('AIUseCase', cat.list('aiUseCase').filter(u => !u.isCustom), x => ({ ...x, code: x.id }));
  for (const a of cat.list('alertType')) run(`INSERT OR IGNORE INTO alert_settings(org_id,type,enabled) VALUES(?,?,1)`, orgId, a.id);
  // Sector checklists for new Organizations of that sector (FR-DA-CHK-04).
  if (vertical) for (const c of cat.list('checklistSeed').filter(c => c.vertical === org.sector)) insertRecord(ids(`chk:${orgId}:${c.id}`), 'ChecklistTemplate', orgId, null, c.id, c.data);
  if (starterTeam) {
    if (!domain) throw new HttpError(422, 'err.required', { field: 'email_domain' });
    for (const role of all(`SELECT * FROM roles ORDER BY sort`)) {
      const uid = ids(`user:${orgId}:${role.id}`); const local = pick(role.name, 'en').toLowerCase().split(/[ /(]/)[0].replace(/[^a-z&]/g, '').replace('&', '') || 'user';
      const email = `${local}.${role.id.toLowerCase()}@${domain}`;
      run(`INSERT OR IGNORE INTO users(id,org_id,email,name,password_hash,language,title,created_at) VALUES(?,?,?,?,?,?,?,?)`, uid, orgId, email, pick(role.name, 'en'), hashPassword(password), lang, pick(role.name, 'en'), t);
      run(`INSERT OR IGNORE INTO user_roles(user_id,role_id) VALUES(?,?)`, uid, role.id);
    }
  }
}

export function insertRecord(id, entity, orgId, projectId, ref, data, userId = null, version = true) {
  const t = now();
  run(`INSERT OR IGNORE INTO records(id,entity,org_id,project_id,ref,data,version,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,1,?,?,?)`, id, entity, orgId, projectId, ref, S(data), userId, t, t);
  if (version) run(`INSERT OR IGNORE INTO entity_versions(id,entity,record_id,org_id,version,data,user_id,is_current,created_at) VALUES(?,?,?,?,1,?,?,1,?)`, id + ':v1', entity, id, orgId, S(data), userId, t);
}

import { SaasLicenceProvider } from '../licensing/LicenceProvider.js';
export function issueSaasLicence(orgId, plan, maxUsers, days = 400) {
  const org = one(`SELECT name FROM organizations WHERE id=?`, orgId);
  const data = { version: 1, companyId: orgId, companyName: pick(org?.name, 'en'), hardwareId: null, expiryDate: addDays(now(), days), maxUsers, plan, features: ['analytics', 'export', 'api'], issueDate: now() };
  run(`INSERT INTO licences(org_id,data,signature,updated_at) VALUES(?,?,?,?) ON CONFLICT(org_id) DO UPDATE SET data=excluded.data, signature=excluded.signature, updated_at=excluded.updated_at`, orgId, S(data), SaasLicenceProvider.sign(data), now());
  return data;
}

/** The E2E processes of a project, per phase, for a mode, track and vertical. */
export function processPlan({ mode = 'Full', track = null, vertical = null }) {
  const phases = PHASES().map(p => ({ ...p, e2e: [...p.e2e] }));
  const v = vertical ? cat.get('verticalSeed', vertical) : null;
  if (v) for (const e of v.e2e) phases.find(p => p.no === e.phase).e2e.push(e.id);
  if (mode === 'SME') { const tr = cat.get('smeTrackSeed', track) || cat.list('smeTrackSeed')[1]; for (const e of cat.list('smeE2E')) phases.find(p => p.no === e.phase).e2e.push(e.id); phases.forEach(p => { p.gate = tr?.gates.includes(p.gate) ? p.gate : null; }); }
  return phases;
}

/** Creates the E2E process instances and their user-facing task instances (with guidance) for a project. */
export function instantiateProject(project, { phases, users = [], seedRng = null, ids = uuid, level = null, startDate = now(), excludedTasks = null }) {
  const r = seedRng || rng(project.id); const ufts = cat.byId('uft');
  const pick1 = arr => arr[Math.floor(r() * arr.length)];
  let sort = 0; const ctx = guidanceContext(project);
  const lvl = level ?? 0; // 0 = nothing started; 1..6 = phase in progress; 7 = everything completed
  for (const ph of phases) {
    for (const e2eId of ph.e2e) {
      const e = cat.get('e2e', e2eId); if (!e) continue;
      const iid = ids(`e2e:${project.id}:${e2eId}`); sort++;
      const phaseState = ph.no === 0 ? (lvl >= 3 ? 'mid' : lvl > 0 ? 'early' : 'none') : ph.no < lvl ? 'done' : ph.no === lvl ? 'mid' : 'none';
      const taskIds = excludedTasks ? e.ufts.filter(u => !excludedTasks.has(u)) : e.ufts; if (!taskIds.length) continue;
      const n = taskIds.length;
      const doneCount = phaseState === 'done' ? n : phaseState === 'mid' ? Math.floor(n * (0.3 + r() * 0.55)) : phaseState === 'early' ? Math.floor(n * 0.25) : 0;
      const base = new Date(startDate).getTime() + (Math.max(ph.no, 1) - 1) * 28 * 86400000;
      const due0 = new Date(base).toISOString();
      let completed = 0;
      const ownerE2e = users.find(x => x.roleNames.includes(pick(cat.get('mp', e.mps[0])?.owner, 'en')))?.id ?? users[0]?.id ?? null;
      run(`INSERT OR IGNORE INTO e2e_instances(id,org_id,project_id,e2e_id,phase,status,progress,owner_id,due_date,sort) VALUES(?,?,?,?,?,'Not started',0,?,?,?)`, iid, project.org_id, project.id, e2eId, ph.no, ownerE2e, addDays(due0, 3 * n + 3), sort);
      taskIds.forEach((uid, k) => {
        const u = ufts.get(uid); const tid = ids(`task:${project.id}:${uid}`);
        const status = k < doneCount ? 'Completed' : k === doneCount && phaseState !== 'none' ? (r() < 0.12 ? 'Blocked' : 'In progress') : 'Not started';
        if (status === 'Completed') completed++;
        const owner = users.length ? (users.find(x => x.roleNames.includes(u.racsi.R)) || users.find(x => x.roleNames.includes(u.racsi.A)) || pick1(users)) : null;
        const evaluator = users.length ? (users.find(x => x.roleNames.includes(u.racsi.A) && x.id !== owner?.id) || users.find(x => x.id !== owner?.id)) : null;
        const due = addDays(due0, 3 * (k + 1));
        const started = status !== 'Not started' ? addDays(due0, 3 * k) : null;
        const completedAt = status === 'Completed' ? addDays(due0, 3 * k + 2) : null;
        const steps = u.steps.map((s, j) => ({ id: s, done: status === 'Completed' || (status === 'In progress' && j < Math.ceil(u.steps.length / 2)) }));
        const g = guidanceFor(uid, ctx);
        run(`INSERT OR IGNORE INTO task_instances(id,org_id,project_id,e2e_instance_id,e2e_id,uft_id,sort,status,owner_id,evaluator_id,due_date,started_at,completed_at,guidance,output,steps,ai_used,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          tid, project.org_id, project.id, iid, e2eId, uid, k + 1, status, owner?.id ?? null, evaluator?.id ?? null, due, started, completedAt, S(g), status === 'Completed' ? S(g) : status === 'In progress' ? S(partial(g)) : null, S(steps), status === 'Completed' && u.ai ? 1 : 0, completedAt || started || now());
      });
      const progress = n ? Math.round((completed * 100) / n) : 0;
      const st = progress === 100 ? 'Completed' : progress > 0 || phaseState === 'mid' ? 'In progress' : 'Not started';
      run(`UPDATE e2e_instances SET status=?, progress=?, started_at=?, completed_at=? WHERE id=?`, st, progress, st !== 'Not started' ? due0 : null, st === 'Completed' ? addDays(due0, 3 * n) : null, iid);
    }
  }
  refreshProgress(project.id);
}
const partial = g => Object.fromEntries(Object.entries(g).map(([k, v]) => [k, String(v).split(/(?<=[.;])\s/)[0]]));

export function guidanceContext(project) {
  const org = one(`SELECT * FROM organizations WHERE id=?`, project.org_id);
  return { org: J(org.name, { en: org.name }), sector: org.sector, focus: project.focus, segment: project.segment, year: project.plan_year, mode: project.mode };
}

export function refreshProgress(projectId) {
  const t = one(`SELECT COUNT(*) n, SUM(status='Completed') d FROM task_instances WHERE project_id=?`, projectId);
  const p = t.n ? Math.round(((t.d || 0) * 1000) / t.n) / 10 : 0;
  run(`UPDATE projects SET progress=?, updated_at=? WHERE id=?`, p, now(), projectId);
  for (const e of all(`SELECT id FROM e2e_instances WHERE project_id=?`, projectId)) {
    const x = one(`SELECT COUNT(*) n, SUM(status='Completed') d, SUM(status!='Not started') s FROM task_instances WHERE e2e_instance_id=?`, e.id);
    const pr = x.n ? Math.round(((x.d || 0) * 100) / x.n) : 0;
    run(`UPDATE e2e_instances SET progress=?, status=? WHERE id=?`, pr, pr === 100 ? 'Completed' : x.s ? 'In progress' : 'Not started', e.id);
  }
  return p;
}
