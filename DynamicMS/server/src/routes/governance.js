// Governance: business rules, controls (COSO), risks, RACSI and KPIs (FR-DA-GOV).
import { Router } from 'express';
import { all, get, run, uid, now, J, P, tx } from '../db.js';
import { requirePerm, assertFeature } from '../auth.js';
import { h, send, row, rows, bad, notFound, requireOrg, loadProject, loadOrgRow, conflict } from '../http.js';
import { audit, snapshot } from '../services/audit.js';
import { raise } from '../services/alerts.js';
import { ROLES } from '../permissions.js';
import { COMPLIANCE_STANDARDS } from '../packs.js';

const r = Router();
const tr = (req, v) => (v === undefined ? undefined : v === null ? null : typeof v === 'object' ? v : { [req.lang]: String(v) });
const merge = (req, cur, v) => (v === undefined ? cur : { ...(typeof cur === 'string' ? P(cur) : cur || {}), ...tr(req, v) });

// ---- Business rules (org level)
r.get('/orgs/:id/rules', requirePerm('governance.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  send(req, res, rows(all('SELECT * FROM business_rules WHERE org_id=? ORDER BY code', req.params.id)));
}));
r.post('/orgs/:id/rules', requirePerm('governance.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  assertFeature(req.params.id, 'governance');
  const b = req.body || {};
  if (!b.condition || !b.action || !b.ruleType) throw bad('FIELDS_REQUIRED', 'Condition, action and rule type are required.');
  const n = get('SELECT COUNT(*) n FROM business_rules WHERE org_id=? AND code LIKE ?', req.params.id, 'BR-C%').n;
  const id = uid();
  run('INSERT INTO business_rules(id,org_id,code,step_ref,mp_id,condition,action_code,action,rule_type,severity,owner_role,obs_node,active,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,?)',
    id, req.params.id, `BR-C${String(n + 1).padStart(2, '0')}`, b.stepRef || null, b.stepRef ? b.stepRef.split('.')[0] : null, J(tr(req, b.condition)), b.actionCode || null, J(tr(req, b.action)), b.ruleType, b.severity || 'Medium', b.ownerRole || 'ims_manager', b.obsNode || null, now());
  audit(req, req.params.id, 'rule', id, 'create', null, b, null);
  snapshot(req, req.params.id, 'rule', id, b, null);
  res.status(201).json({ id });
}));
r.put('/rules/:id', requirePerm('governance.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'business_rules', req.params.id, true, 'Rule');
  const b = req.body || {};
  run('UPDATE business_rules SET condition=?, action=?, rule_type=COALESCE(?,rule_type), severity=COALESCE(?,severity), owner_role=COALESCE(?,owner_role), active=COALESCE(?,active) WHERE id=?',
    J(merge(req, x.condition, b.condition)), J(merge(req, x.action, b.action)), b.ruleType || null, b.severity || null, b.ownerRole || null, b.active === undefined ? null : (b.active ? 1 : 0), x.id);
  audit(req, x.org_id, 'rule', x.id, 'update', x, b, b.justification || null);
  snapshot(req, x.org_id, 'rule', x.id, row(get('SELECT * FROM business_rules WHERE id=?', x.id)), b.justification || null);
  res.json({ ok: true });
}));
r.delete('/rules/:id', requirePerm('governance.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'business_rules', req.params.id, true, 'Rule');
  run('DELETE FROM business_rules WHERE id=?', x.id);
  audit(req, x.org_id, 'rule', x.id, 'delete', x, null, null);
  res.json({ ok: true });
}));

// ---- Controls (org level, COSO classified; compliance scaffolds are tagged by standard)
r.get('/orgs/:id/controls', requirePerm('governance.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  send(req, res, rows(all('SELECT * FROM controls WHERE org_id=? ORDER BY standard <> ?, code', req.params.id, 'ISO 9001')));
}));
r.post('/orgs/:id/controls', requirePerm('governance.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const b = req.body || {};
  if (!b.name || !b.type || !b.coso) throw bad('FIELDS_REQUIRED', 'Name, type and COSO component are required.');
  const n = get('SELECT COUNT(*) n FROM controls WHERE org_id=? AND code LIKE ?', req.params.id, 'CTL-C%').n;
  const id = uid();
  run('INSERT INTO controls(id,org_id,code,name,description,type,coso,frequency,owner_role,effectiveness,standard,step_refs,mp_id,obs_node,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    id, req.params.id, `CTL-C${String(n + 1).padStart(2, '0')}`, J(tr(req, b.name)), J(tr(req, b.description || '')), b.type, b.coso, b.frequency || 'Quarterly', b.ownerRole || 'ims_manager', b.effectiveness || 'Not tested', b.standard || 'ISO 9001', J(b.stepRefs || []), b.mpId || null, b.obsNode || null, now());
  audit(req, req.params.id, 'control', id, 'create', null, b, null);
  snapshot(req, req.params.id, 'control', id, b, null);
  res.status(201).json({ id });
}));
r.put('/controls/:id', requirePerm('governance.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'controls', req.params.id, true, 'Control');
  const b = req.body || {};
  run('UPDATE controls SET name=?, description=?, type=COALESCE(?,type), coso=COALESCE(?,coso), frequency=COALESCE(?,frequency), owner_role=COALESCE(?,owner_role), effectiveness=COALESCE(?,effectiveness) WHERE id=?',
    J(merge(req, x.name, b.name)), J(merge(req, x.description, b.description)), b.type || null, b.coso || null, b.frequency || null, b.ownerRole || null, b.effectiveness || null, x.id);
  audit(req, x.org_id, 'control', x.id, 'update', x, b, b.justification || null);
  snapshot(req, x.org_id, 'control', x.id, row(get('SELECT * FROM controls WHERE id=?', x.id)), b.justification || null);
  res.json({ ok: true });
}));
r.delete('/controls/:id', requirePerm('governance.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'controls', req.params.id, true, 'Control');
  if (COMPLIANCE_STANDARDS.some(s => s.id === x.standard)) throw conflict('SCAFFOLD_CONTROL', 'Controls seeded by a Compliance & Security Standard are kept for traceability.');
  run('DELETE FROM controls WHERE id=?', x.id);
  audit(req, x.org_id, 'control', x.id, 'delete', x, null, null);
  res.json({ ok: true });
}));

// ---- Risks, hazards, aspects, opportunities (project level)
r.get('/projects/:id/risks', requirePerm('governance.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const kind = req.query.kind;
  send(req, res, rows(all(`SELECT * FROM risks WHERE project_id=? ${kind ? 'AND kind=?' : ''} ORDER BY score DESC, code`, p.id, ...(kind ? [kind] : []))));
}));
r.post('/projects/:id/risks', requirePerm('governance.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const b = req.body || {};
  const L = +b.likelihood; const I = +b.impact;
  if (!b.title || !(L >= 1 && L <= 5) || !(I >= 1 && I <= 5)) throw bad('FIELDS_REQUIRED', 'Title, likelihood (1–5) and impact (1–5) are required.');
  const kind = ['Risk', 'Opportunity', 'Hazard', 'Aspect'].includes(b.kind) ? b.kind : 'Risk';
  const n = get('SELECT COUNT(*) n FROM risks WHERE project_id=? AND kind=?', p.id, kind).n;
  const id = uid();
  const code = `${kind[0]}-N${String(n + 1).padStart(2, '0')}`;
  run('INSERT INTO risks(id,org_id,project_id,code,kind,title,category,likelihood,impact,score,residual,owner_role,status,controls,mp_id,treatment,kri,obs_node,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    id, p.org_id, p.id, code, kind, J(tr(req, b.title)), b.category || kind, L, I, L * I, b.residual ?? null, b.ownerRole || 'risk_manager', 'Open', J(b.controls || []), b.mpId || 'MP-012', b.treatment ? J(tr(req, b.treatment)) : null, null, null, now());
  audit(req, p.org_id, 'risk', id, 'create', null, b, null);
  snapshot(req, p.org_id, 'risk', id, { ...b, code }, null);
  if (L * I >= 20 && kind !== 'Opportunity') raise({ orgId: p.org_id, projectId: p.id, type: 'RISK_HIGH', severity: 'High', title: { [req.lang]: `${code} — ${b.title} (${L * I})` }, entityType: 'risk', entityId: id, escalation: ['risk_manager', 'top_management'] });
  res.status(201).json({ id, code });
}));
r.put('/risks/:id', requirePerm('governance.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'risks', req.params.id, true, 'Risk');
  const b = req.body || {};
  const L = b.likelihood ? +b.likelihood : x.likelihood; const I = b.impact ? +b.impact : x.impact;
  run('UPDATE risks SET title=?, category=COALESCE(?,category), likelihood=?, impact=?, score=?, residual=COALESCE(?,residual), owner_role=COALESCE(?,owner_role), status=COALESCE(?,status), treatment=?, controls=COALESCE(?,controls) WHERE id=?',
    J(merge(req, x.title, b.title)), b.category || null, L, I, L * I, b.residual ?? null, b.ownerRole || null, b.status || null, J(b.treatment === undefined ? x.treatment : merge(req, x.treatment, b.treatment)), b.controls ? J(b.controls) : null, x.id);
  audit(req, x.org_id, 'risk', x.id, 'update', x, b, b.justification || null);
  snapshot(req, x.org_id, 'risk', x.id, row(get('SELECT * FROM risks WHERE id=?', x.id)), b.justification || null);
  res.json({ ok: true });
}));
r.delete('/risks/:id', requirePerm('governance.manage'), h((req, res) => {
  const x = loadOrgRow(req, 'risks', req.params.id, true, 'Risk');
  run('DELETE FROM risks WHERE id=?', x.id);
  audit(req, x.org_id, 'risk', x.id, 'delete', x, null, null);
  res.json({ ok: true });
}));

// ---- RACSI matrix (one Accountable per activity, enforced by a unique index)
const roleName = (c) => ROLES.find(x => x.code === c)?.name || c;
r.get('/projects/:id/racsi', requirePerm('governance.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const acts = rows(all('SELECT * FROM racsi_activities WHERE project_id=? ORDER BY e2e_id, linked_type DESC, mp_id', p.id));
  const asg = all('SELECT * FROM racsi_assignments WHERE org_id=? AND activity_id IN (SELECT id FROM racsi_activities WHERE project_id=?)', p.org_id, p.id);
  const by = {};
  for (const a of asg) (by[a.activity_id] ||= []).push({ id: a.id, letter: a.letter, assignee: a.assignee, roleName: roleName(a.assignee) });
  send(req, res, { roles: ROLES.filter(x => !['platform_admin', 'auditor'].includes(x.code)), activities: acts.map(a => ({ ...a, assignments: by[a.id] || [] })) });
}));
r.put('/racsi/:activityId', requirePerm('governance.manage'), h((req, res) => {
  const a = loadOrgRow(req, 'racsi_activities', req.params.activityId, true, 'Activity');
  const list = Array.isArray(req.body?.assignments) ? req.body.assignments : null;
  if (!list) throw bad('ASSIGNMENTS_REQUIRED', 'Send the list of assignments.');
  const nA = list.filter(x => x.letter === 'A').length;
  if (nA !== 1) throw bad('ONE_ACCOUNTABLE', 'Each activity needs exactly one Accountable (A).');
  if (list.some(x => !'RACSI'.includes(x.letter) || !ROLES.find(r2 => r2.code === x.assignee))) throw bad('BAD_ASSIGNMENT', 'Unknown letter or role.');
  const before = all('SELECT letter, assignee FROM racsi_assignments WHERE activity_id=?', a.id);
  tx(() => {
    run('DELETE FROM racsi_assignments WHERE activity_id=?', a.id);
    const seen = new Set();
    for (const x of list) { const k = x.letter + x.assignee; if (seen.has(k)) continue; seen.add(k); run('INSERT INTO racsi_assignments(id,activity_id,org_id,letter,assignee) VALUES(?,?,?,?,?)', uid(), a.id, a.org_id, x.letter, x.assignee); }
    audit(req, a.org_id, 'racsi', a.id, 'update', before, list, null);
    snapshot(req, a.org_id, 'racsi', a.id, list, null);
  });
  res.json({ ok: true });
}));
r.post('/projects/:id/racsi', requirePerm('governance.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const b = req.body || {};
  if (!b.name || !b.accountable) throw bad('FIELDS_REQUIRED', 'Activity name and Accountable role are required.');
  const id = uid();
  run('INSERT INTO racsi_activities(id,org_id,project_id,e2e_id,mp_id,step_ref,linked_type,linked_id,name,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', id, p.org_id, p.id, b.e2e || null, b.mpId || null, b.stepRef || null, b.linkedType || 'custom', b.linkedId || null, J(tr(req, b.name)), now());
  run('INSERT INTO racsi_assignments(id,activity_id,org_id,letter,assignee) VALUES(?,?,?,?,?)', uid(), id, p.org_id, 'A', b.accountable);
  audit(req, p.org_id, 'racsi', id, 'create', null, b, null);
  res.status(201).json({ id });
}));

// ---- KPIs and measurements
r.get('/projects/:id/kpis', requirePerm('governance.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const list = rows(all('SELECT * FROM kpis WHERE project_id=? ORDER BY source, code', p.id));
  const vals = all('SELECT kpi_id, period, value FROM kpi_values WHERE org_id=? AND kpi_id IN (SELECT id FROM kpis WHERE project_id=?) ORDER BY period', p.org_id, p.id);
  const by = {};
  for (const v of vals) (by[v.kpi_id] ||= []).push({ period: v.period, value: v.value });
  send(req, res, list.map(k => {
    const s = by[k.id] || []; const last = s[s.length - 1]?.value;
    const onTarget = k.target === null || last === undefined ? null : k.direction === 'down' ? last <= k.target : last >= k.target;
    return { ...k, series: s, last, onTarget };
  }));
}));
r.post('/projects/:id/kpis', requirePerm('governance.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  const b = req.body || {};
  if (!b.name || !b.formula || b.target === undefined) throw bad('FIELDS_REQUIRED', 'Name, formula and target are required.');
  if (b.analysisFrequency && b.frequency && rank(b.analysisFrequency) < rank(b.frequency)) throw bad('BR-011', 'The analysis frequency cannot be more frequent than the measurement frequency.');
  const n = get('SELECT COUNT(*) n FROM kpis WHERE project_id=? AND custom=1', p.id).n;
  const id = uid();
  run('INSERT INTO kpis(id,org_id,project_id,code,name,formula,unit,target,target_text,direction,frequency,analysis_frequency,mp_id,owner_role,custom,racsi,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)',
    id, p.org_id, p.id, `KPI-C${String(n + 1).padStart(2, '0')}`, J(tr(req, b.name)), J(tr(req, b.formula)), b.unit || '', +b.target, `${b.direction === 'down' ? '<=' : '>='} ${b.target}${b.unit === '%' ? '%' : ''}`, b.direction === 'down' ? 'down' : 'up', b.frequency || 'Monthly', b.analysisFrequency || 'Quarterly', b.mpId || null, b.ownerRole || 'performance_manager', J(b.racsi || { A: ['ims_manager'] }), 'custom', now());
  audit(req, p.org_id, 'kpi', id, 'create', null, b, null);
  snapshot(req, p.org_id, 'kpi', id, b, null);
  res.status(201).json({ id });
}));
const FREQ = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual'];
const rank = (f) => Math.max(0, FREQ.indexOf(f));
r.put('/kpis/:id', requirePerm('governance.manage'), h((req, res) => {
  const k = loadOrgRow(req, 'kpis', req.params.id, true, 'KPI');
  const b = req.body || {};
  const target = b.target !== undefined ? +b.target : k.target;
  const dir = b.direction || k.direction;
  run('UPDATE kpis SET name=?, formula=?, target=?, target_text=?, direction=?, frequency=COALESCE(?,frequency), analysis_frequency=COALESCE(?,analysis_frequency), owner_role=COALESCE(?,owner_role) WHERE id=?',
    J(merge(req, k.name, b.name)), J(merge(req, k.formula, b.formula)), target, b.target !== undefined ? `${dir === 'down' ? '<=' : '>='} ${target}${k.unit === '%' ? '%' : ''}` : k.target_text, dir, b.frequency || null, b.analysisFrequency || null, b.ownerRole || null, k.id);
  audit(req, k.org_id, 'kpi', k.id, 'update', k, b, b.justification || null);
  snapshot(req, k.org_id, 'kpi', k.id, row(get('SELECT * FROM kpis WHERE id=?', k.id)), b.justification || null);
  res.json({ ok: true });
}));
r.post('/kpis/:id/values', requirePerm('records.manage', 'governance.manage'), h((req, res) => {
  const k = loadOrgRow(req, 'kpis', req.params.id, true, 'KPI');
  const period = String(req.body?.period || '');
  const value = Number(req.body?.value);
  if (!/^\d{4}-\d{2}$/.test(period) || !Number.isFinite(value)) throw bad('FIELDS_REQUIRED', 'Period (YYYY-MM) and a numeric value are required.');
  run('INSERT INTO kpi_values(kpi_id,org_id,period,value,comment) VALUES(?,?,?,?,?) ON CONFLICT(kpi_id,period) DO UPDATE SET value=excluded.value, comment=excluded.comment', k.id, k.org_id, period, value, req.body?.comment ? J({ [req.lang]: req.body.comment }) : null);
  audit(req, k.org_id, 'kpi', k.id, 'measure', null, { period, value }, null);
  const off = k.target !== null && (k.direction === 'down' ? value > k.target : value < k.target);
  if (off) raise({ orgId: k.org_id, projectId: k.project_id, type: 'KPI_OFF_TARGET', title: { en: `KPI off target: ${k.name?.en || k.code} = ${value} (target ${k.target_text})`, fr: `KPI hors cible : ${k.name?.fr || k.code} = ${value} (cible ${k.target_text})`, ar: `مؤشر خارج المستهدف: ${k.name?.ar || k.code} = ${value} (المستهدف ${k.target_text})` }, entityType: 'kpi', entityId: k.id, escalation: ['performance_manager', 'ims_manager'], period });
  res.json({ ok: true, onTarget: !off });
}));

export default r;
