// OBS: functions, roles and people (FR-DA-OBS-01 – 10) and role-based RACSI (FR-DA-GOV-09, -10).
// OBS Roles are distinct from RBAC access roles: holding an OBS Role grants no permission (FR-DA-OBS-09).
import { all, one, run, tx } from '../db.js';
import { J, S, HttpError, now, uuid, pick } from '../lib/util.js';
import * as D from './design.js';
import { effectiveConfig } from '../entitlements.js';

const ver = (entity, id, orgId, data, userId, note) => {
  const v = (one(`SELECT MAX(version) v FROM entity_versions WHERE entity=? AND record_id=?`, entity, id)?.v || 0) + 1;
  run(`UPDATE entity_versions SET is_current=0 WHERE entity=? AND record_id=?`, entity, id);
  run(`INSERT INTO entity_versions(id,entity,record_id,org_id,version,data,user_id,justification,is_current,created_at) VALUES(?,?,?,?,?,?,?,?,1,?)`, uuid(), entity, id, orgId, v, S(data), userId, note || null, now());
  return v;
};
const audit = (req, entity, id, action, before, after, just) => run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,before_val,after_val,justification,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, uuid(), req.orgId, req.user.id, entity, id, action, before ? S(before) : null, after ? S(after) : null, just || null, now());
const ml = v => (v && typeof v === 'object' ? v : { en: String(v ?? ''), fr: String(v ?? ''), ar: String(v ?? '') });
const today = () => now().slice(0, 10);
const activeAt = (a, d) => (!a.start_date || a.start_date.slice(0, 10) <= d) && (!a.end_date || a.end_date.slice(0, 10) >= d);

/* ----------------------------------------------------------------------------------------- functions */
export function functions(orgId) { return all(`SELECT * FROM obs_nodes WHERE org_id=? AND type='Function' ORDER BY coalesce(code, name)`, orgId).map(f => ({ ...f, name: J(f.name, f.name), description: J(f.description, null), roles: all(`SELECT id, name FROM obs_roles WHERE org_id=? AND functions LIKE ?`, orgId, `%"${f.id}"%`).map(r => ({ id: r.id, name: J(r.name, r.name) })) })); }
export function saveFunction(req, id, b) {
  if (!b.name || !(pick(b.name, 'en') || pick(b.name, req.lang))) throw new HttpError(422, 'err.required', { field: 'name' });
  if (b.parent_id) { let cur = one(`SELECT * FROM obs_nodes WHERE id=? AND org_id=?`, b.parent_id, req.orgId); if (!cur) throw new HttpError(404, 'err.notFound'); while (cur) { if (cur.id === id) throw new HttpError(422, 'err.obsCycle'); cur = cur.parent_id ? one(`SELECT * FROM obs_nodes WHERE id=?`, cur.parent_id) : null; } }
  const tm = now();
  if (id) { const cur = one(`SELECT * FROM obs_nodes WHERE id=? AND org_id=? AND type='Function'`, id, req.orgId); if (!cur) throw new HttpError(404, 'err.notFound');
    run(`UPDATE obs_nodes SET name=?, code=?, description=?, parent_id=?, status=coalesce(?, status), version=coalesce(version,1)+1 WHERE id=?`, S(ml(b.name)), b.code ?? cur.code, b.description ? S(ml(b.description)) : cur.description, b.parent_id === undefined ? cur.parent_id : b.parent_id || null, b.status || null, id);
    ver('ObsNode', id, req.orgId, { name: b.name, code: b.code, description: b.description, parent_id: b.parent_id }, req.user.id, b._justification); audit(req, 'Function', id, 'update', { name: J(cur.name) }, b, b._justification); }
  else { id = uuid(); const root = one(`SELECT id FROM obs_nodes WHERE org_id=? AND type='Organization'`, req.orgId)?.id || null;
    run(`INSERT INTO obs_nodes(id,org_id,parent_id,name,type,code,description,status,version,created_at) VALUES(?,?,?,?,?,?,?,?,1,?)`, id, req.orgId, b.parent_id || root, S(ml(b.name)), 'Function', b.code || null, b.description ? S(ml(b.description)) : null, 'Active', tm);
    ver('ObsNode', id, req.orgId, b, req.user.id, 'create'); audit(req, 'Function', id, 'create', null, b); }
  return functions(req.orgId).find(f => f.id === id);
}
export function deleteFunction(req, id) {
  const n = one(`SELECT COUNT(*) n FROM obs_roles WHERE org_id=? AND functions LIKE ?`, req.orgId, `%"${id}"%`).n;
  if (n) throw new HttpError(409, 'err.functionInUse', { n });
  run(`UPDATE obs_nodes SET parent_id=(SELECT parent_id FROM obs_nodes WHERE id=?) WHERE parent_id=? AND org_id=?`, id, id, req.orgId); run(`DELETE FROM obs_nodes WHERE id=? AND org_id=? AND type='Function'`, id, req.orgId);
  audit(req, 'Function', id, 'delete'); return { ok: true };
}

/* --------------------------------------------------------------------------------------------- roles */
const roleOut = (r, date = today()) => ({ ...r, name: J(r.name, r.name), mission: J(r.mission, null), responsibilities: J(r.responsibilities, null), competences: J(r.competences, null), access_roles: J(r.access_roles, []), functions: J(r.functions, []),
  holders: all(`SELECT a.*, u.name, u.email, u.title FROM obs_assignments a JOIN users u ON u.id=a.user_id WHERE a.role_id=? ORDER BY a.holder_type, u.name`, r.id).filter(a => activeAt(a, date)) });
export function roles(orgId, date = today()) { return all(`SELECT * FROM obs_roles WHERE org_id=? ORDER BY coalesce(code, name)`, orgId).map(r => roleOut(r, date)); }
export function role(orgId, id) { const r = one(`SELECT * FROM obs_roles WHERE id=? AND org_id=?`, id, orgId); if (!r) throw new HttpError(404, 'err.notFound'); return { ...roleOut(r), assignments: all(`SELECT a.*, u.name FROM obs_assignments a JOIN users u ON u.id=a.user_id WHERE a.role_id=? ORDER BY a.start_date DESC`, id), versions: all(`SELECT version, created_at, justification, (SELECT name FROM users WHERE id=user_id) author FROM entity_versions WHERE entity='ObsRole' AND record_id=? ORDER BY version DESC`, id) }; }
export function saveRole(req, id, b) {
  if (!b.name || !(pick(b.name, 'en') || pick(b.name, req.lang))) throw new HttpError(422, 'err.required', { field: 'name' });
  const fns = Array.isArray(b.functions) ? b.functions.filter(Boolean) : [];
  if (!fns.length) throw new HttpError(422, 'err.roleNeedsFunction'); // a role is linked to at least one function (FR-DA-OBS-03)
  for (const f of fns) if (!one(`SELECT id FROM obs_nodes WHERE id=? AND org_id=? AND type='Function'`, f, req.orgId)) throw new HttpError(422, 'err.invalidOption', { field: 'functions', value: f });
  if (b.reports_to && b.reports_to === id) throw new HttpError(422, 'err.obsCycle');
  const data = { name: S(ml(b.name)), code: b.code || null, node_id: b.node_id || null, mission: b.mission ? S(ml(b.mission)) : null, responsibilities: b.responsibilities ? S(ml(b.responsibilities)) : null, competences: b.competences ? S(ml(b.competences)) : null, reports_to: b.reports_to || null, access_roles: S(Array.isArray(b.access_roles) ? b.access_roles : []), functions: S(fns) };
  const tm = now();
  if (id) { const cur = one(`SELECT * FROM obs_roles WHERE id=? AND org_id=?`, id, req.orgId); if (!cur) throw new HttpError(404, 'err.notFound');
    run(`UPDATE obs_roles SET name=?, code=?, node_id=?, mission=?, responsibilities=?, competences=?, reports_to=?, access_roles=?, functions=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, data.name, data.code, data.node_id, data.mission, data.responsibilities, data.competences, data.reports_to, data.access_roles, data.functions, req.user.id, tm, id);
    audit(req, 'ObsRole', id, 'update', roleOut(cur), b, b._justification); }
  else { const max = Number(effectiveConfig(req.orgId)?.quotas?.obs) || 0; const n = one(`SELECT COUNT(*) n FROM obs_roles WHERE org_id=?`, req.orgId).n;
    if (max && n >= max) throw new HttpError(409, 'err.quota', { quota: 'obs', max }); // quotas of FR-DA-TEN-07
    id = uuid(); run(`INSERT INTO obs_roles(id,org_id,node_id,code,name,mission,responsibilities,competences,reports_to,access_roles,functions,status,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,'Active',1,?,?)`, id, req.orgId, data.node_id, data.code, data.name, data.mission, data.responsibilities, data.competences, data.reports_to, data.access_roles, data.functions, req.user.id, tm);
    audit(req, 'ObsRole', id, 'create', null, b); }
  ver('ObsRole', id, req.orgId, { ...b, functions: fns }, req.user.id, b._justification);
  return role(req.orgId, id);
}
export function deleteRole(req, id) {
  const r = one(`SELECT * FROM obs_roles WHERE id=? AND org_id=?`, id, req.orgId); if (!r) throw new HttpError(404, 'err.notFound');
  const refs = one(`SELECT COUNT(*) n FROM racsi_assignments WHERE assignee=?`, 'role:' + id).n; if (refs) throw new HttpError(409, 'err.roleInUse', { n: refs });
  run(`DELETE FROM obs_roles WHERE id=?`, id); audit(req, 'ObsRole', id, 'delete', roleOut(r), null, req.body?._justification); return { ok: true };
}

/* --------------------------------------------------------------------------------------- assignments */
export function saveAssignment(req, id, b) {
  const r = one(`SELECT id FROM obs_roles WHERE id=? AND org_id=?`, b.role_id, req.orgId); if (!r) throw new HttpError(404, 'err.notFound');
  const u = one(`SELECT id FROM users WHERE id=? AND org_id=?`, b.user_id, req.orgId); if (!u) throw new HttpError(422, 'err.invalidOption', { field: 'user_id', value: b.user_id });
  if (!['Holder', 'Deputy', 'Acting'].includes(b.holder_type || 'Holder')) throw new HttpError(422, 'err.invalidOption', { field: 'holder_type', value: b.holder_type });
  const alloc = Number(b.allocation ?? 100); if (!(alloc > 0 && alloc <= 100)) throw new HttpError(422, 'err.range', { field: 'allocation', min: 1, max: 100 });
  if (b.end_date && b.start_date && b.end_date < b.start_date) throw new HttpError(422, 'err.dateOrder');
  const tm = now();
  if (id) { const cur = one(`SELECT * FROM obs_assignments WHERE id=? AND org_id=?`, id, req.orgId); if (!cur) throw new HttpError(404, 'err.notFound');
    run(`UPDATE obs_assignments SET role_id=?, user_id=?, start_date=?, end_date=?, allocation=?, holder_type=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, b.role_id, b.user_id, b.start_date || null, b.end_date || null, alloc, b.holder_type || 'Holder', req.user.id, tm, id);
    if (b.end_date && !cur.end_date && b.end_date <= today()) reassignOnEnd(req, { ...cur, end_date: b.end_date }); }
  else { id = uuid(); run(`INSERT INTO obs_assignments(id,org_id,role_id,user_id,start_date,end_date,allocation,holder_type,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,1,?,?)`, id, req.orgId, b.role_id, b.user_id, b.start_date || today(), b.end_date || null, alloc, b.holder_type || 'Holder', req.user.id, tm); }
  ver('ObsAssignment', id, req.orgId, b, req.user.id, b._justification); audit(req, 'ObsAssignment', id, 'save', null, b, b._justification);
  return one(`SELECT * FROM obs_assignments WHERE id=?`, id);
}
/** When an assignment ends, open work assigned through the role moves to the remaining holder; the rest is listed (FR-DA-OBS-07). */
export function reassignOnEnd(req, a) {
  const r = one(`SELECT name FROM obs_roles WHERE id=?`, a.role_id); const roleName = pick(J(r?.name, {}), 'en');
  const next = all(`SELECT * FROM obs_assignments WHERE role_id=? AND user_id!=? ORDER BY CASE holder_type WHEN 'Holder' THEN 0 WHEN 'Acting' THEN 1 ELSE 2 END`, a.role_id, a.user_id).find(x => activeAt(x, today()));
  const open = all(`SELECT t.id, t.uft_id FROM task_instances t WHERE t.org_id=? AND t.owner_id=? AND t.status!='Completed'`, req.orgId, a.user_id);
  const viaRole = open.filter(t => { const u = D.get(req.orgId, 'uft', t.uft_id); return u && (u.racsi?.R === roleName || pick(u.racsiT?.R, 'en') === roleName); });
  if (next) for (const t of viaRole) run(`UPDATE task_instances SET owner_id=?, updated_at=? WHERE id=?`, next.user_id, now(), t.id);
  audit(req, 'ObsAssignment', a.id, 'end', null, { moved: next ? viaRole.length : 0, to: next?.user_id || null });
  return { moved: next ? viaRole.length : 0, to: next?.user_id || null, byName: open.filter(t => !viaRole.includes(t)).map(t => t.id) };
}
export function deleteAssignment(req, id) { run(`DELETE FROM obs_assignments WHERE id=? AND org_id=?`, id, req.orgId); audit(req, 'ObsAssignment', id, 'delete'); return { ok: true }; }

/* --------------------------------------------------------------------------------------------- views */
/** The OBS by unit, by function, by person and as an organization chart, as it was on any date (FR-DA-OBS-05, -10). */
export function views(orgId, date = today()) {
  const rs = all(`SELECT * FROM obs_roles WHERE org_id=?`, orgId).filter(r => !date || !r.updated_at || true).map(r => roleOut(r, date));
  const units = all(`SELECT id, name, type, parent_id FROM obs_nodes WHERE org_id=? ORDER BY type DESC, name`, orgId).map(n => ({ ...n, name: J(n.name, n.name) }));
  const people = all(`SELECT id, name, title, email FROM users WHERE org_id=? AND active=1 ORDER BY name`, orgId);
  const assigns = all(`SELECT a.*, r.name role_name FROM obs_assignments a JOIN obs_roles r ON r.id=a.role_id WHERE a.org_id=?`, orgId).filter(a => activeAt(a, date));
  return {
    date,
    byUnit: units.map(u => ({ unit: u, roles: rs.filter(r => r.node_id === u.id || (!r.node_id && u.type === 'Organization')).map(r => ({ id: r.id, name: r.name, holders: r.holders.map(h => h.name) })) })),
    byFunction: units.filter(u => u.type === 'Function').map(f => ({ function: f, roles: rs.filter(r => r.functions.includes(f.id)).map(r => ({ id: r.id, name: r.name, holders: r.holders.map(h => ({ id: h.user_id, name: h.name, type: h.holder_type })) })) })),
    byPerson: people.map(p => ({ person: p, roles: assigns.filter(a => a.user_id === p.id).map(a => ({ id: a.role_id, name: J(a.role_name, a.role_name), allocation: a.allocation, holder_type: a.holder_type })) })).filter(p => p.roles.length),
    chart: rs.map(r => ({ id: r.id, name: r.name, reports_to: r.reports_to, holders: r.holders.map(h => h.name), vacant: !r.holders.length })),
    vacant: rs.filter(r => !r.holders.length).map(r => ({ id: r.id, name: r.name })),
  };
}
/** Pickers drawn from the OBS (FR-DA-OBS-08): people with their roles, roles with their holders, units with their type. */
export function pickers(orgId) {
  const v = views(orgId);
  return { people: all(`SELECT id, name, title FROM users WHERE org_id=? AND active=1 ORDER BY name`, orgId).map(p => ({ id: p.id, name: p.name, title: p.title, roles: (v.byPerson.find(x => x.person.id === p.id)?.roles || []).map(r => r.name) })),
    roles: v.chart.map(r => ({ id: r.id, name: r.name, holders: r.holders, vacant: r.vacant })), units: all(`SELECT id, name, type FROM obs_nodes WHERE org_id=?`, orgId).map(u => ({ ...u, name: J(u.name, u.name) })) };
}
/** Resolves an assignee — `role:<id>`, `user:<id>` or a role name — to the people currently playing it (FR-DA-OBS-06, FR-DA-GOV-09). */
export function resolve(orgId, assignee) {
  const a = String(assignee || ''); const d = today();
  if (a.startsWith('user:')) { const u = one(`SELECT id, name FROM users WHERE id=? AND org_id=?`, a.slice(5), orgId); return { kind: 'person', people: u ? [u] : [], vacant: !u }; }
  let r = a.startsWith('role:') ? one(`SELECT * FROM obs_roles WHERE id=? AND org_id=?`, a.slice(5), orgId) : null;
  if (!r && a) r = all(`SELECT * FROM obs_roles WHERE org_id=?`, orgId).find(x => Object.values(J(x.name, {})).some(n => String(n).toLowerCase() === a.toLowerCase()));
  if (!r) return { kind: 'text', label: a, people: [], vacant: true };
  const holders = all(`SELECT a.*, u.name FROM obs_assignments a JOIN users u ON u.id=a.user_id WHERE a.role_id=?`, r.id).filter(x => activeAt(x, d));
  return { kind: 'role', role: { id: r.id, name: J(r.name, r.name) }, people: holders.map(h => ({ id: h.user_id, name: h.name, holder_type: h.holder_type })), vacant: !holders.length };
}

/* --------------------------------------------------------------------------- RACSI editor per macro process */
/** One row per task or step of the macro process, one column per letter, exactly one Accountable per row (FR-DA-GOV-10). */
export function racsiMatrix(orgId, mpId, lang) {
  const mp = D.get(orgId, 'mp', mpId); if (!mp) throw new HttpError(404, 'err.notFound');
  const steps = D.list(orgId, 'step').filter(s => s.mp === mpId);
  const rows = steps.map(s => {
    const act = one(`SELECT id FROM racsi_activities WHERE org_id=? AND ref_type='step' AND ref_id=? AND project_id IS NULL`, orgId, s.id);
    const assigned = act ? all(`SELECT letter, assignee FROM racsi_assignments WHERE activity_id=?`, act.id) : [];
    const cells = { R: [], A: [], C: [], S: [], I: [] }; for (const x of assigned) cells[x.letter].push(x.assignee);
    if (!assigned.length) cells.R = [pick(s.role, 'en')]; // the owner of each step defaults to its Responsible
    return { step: { id: s.id, name: s.name, role: s.role, task: s.task }, cells, owner: cells.R[0] || null, ok: cells.A.length === 1 };
  });
  return { mp: { id: mp.id, name: mp.name }, rows, complete: rows.every(r => r.ok) };
}
export function saveRacsiRow(req, mpId, stepId, cells) {
  const s = D.get(req.orgId, 'step', stepId); if (!s || s.mp !== mpId) throw new HttpError(404, 'err.notFound');
  if ((cells.A || []).filter(Boolean).length !== 1) throw new HttpError(422, 'err.oneAccountable');
  tx(() => {
    let act = one(`SELECT id FROM racsi_activities WHERE org_id=? AND ref_type='step' AND ref_id=? AND project_id IS NULL`, req.orgId, stepId);
    if (!act) { const id = uuid(); run(`INSERT INTO racsi_activities(id,org_id,ref_type,ref_id,name,process_tag,created_at) VALUES(?,?,?,?,?,?,?)`, id, req.orgId, 'step', stepId, pick(s.name, 'en'), mpId, now()); act = { id }; }
    run(`DELETE FROM racsi_assignments WHERE activity_id=?`, act.id);
    for (const L of ['R', 'A', 'C', 'S', 'I']) for (const a of (cells[L] || []).filter(Boolean)) run(`INSERT INTO racsi_assignments(id,activity_id,letter,assignee,user_id) VALUES(?,?,?,?,?)`, uuid(), act.id, L, String(a), String(a).startsWith('user:') ? String(a).slice(5) : null);
    audit(req, 'Racsi', stepId, 'update', null, cells);
  });
  return racsiMatrix(req.orgId, mpId, req.lang).rows.find(r => r.step.id === stepId);
}
