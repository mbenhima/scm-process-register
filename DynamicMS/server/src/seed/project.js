// Generates one "full run" project: the whole lifecycle of a QMS or QHSE management
// system, from context analysis (E2E-01) to continual improvement (E2E-12), with every
// activated macro process, task and step, and the records each phase produces.
import { run, all, get, uid, J } from '../db.js';
import { rng, iso, addDays, DAY } from './rng.js';
import { stepValue, fill, S } from './text.js';
import { smartObjectives } from './content.js';
import { DOC_TEMPLATES } from '../content/templates.js';
import { buildContent } from '../services/docdata.js';
import { ROLES } from '../permissions.js';
import { CHECKLISTS, VERTICAL_CHECKLISTS, COMPLEXITY_CRITERIA, SME_TRACKS } from './libraries.js';
import * as R from './records.js';
import { seedImsRecords, supplierDetail, FINDING_DETAIL } from './imsdata.js';

export const TODAY = '2026-09-28';
const E2E_ORDER = ['E2E-01', 'E2E-02', 'E2E-03', 'E2E-04', 'E2E-05', 'E2E-06', 'E2E-07', 'E2E-08', 'E2E-09', 'E2E-10', 'E2E-11', 'E2E-12'];
export const TRACK_GATES = {
  'TRK-LIGHT': ['E2E-01', 'E2E-10'],
  'TRK-STANDARD': ['E2E-01', 'E2E-04', 'E2E-09', 'E2E-10'],
  'TRK-ADVANCED': ['E2E-01', 'E2E-03', 'E2E-04', 'E2E-08', 'E2E-09', 'E2E-10'],
};
// Cross-sector Tier 6 processes a universal (non-vertical) large company activates.
export const UNI_T6 = ['DMS055', 'DMS056', 'DMS058', 'DMS064', 'DMS069', 'DMS070', 'DMS071', 'DMS072', 'DMS073', 'DMS074', 'DMS077', 'DMS078', 'DMS081'];

const roleName = (code) => (ROLES.find(r => r.code === code) || ROLES.find(r => r.code === 'ims_manager')).name;
const ts = (date, r) => `${date}T${String(r.int(7, 17)).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}:00.000Z`;
const days = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);
const ymd = (d) => d.slice(0, 7);

// Maps free-text RACSI role labels from the process design to platform roles.
const ROLE_RULES = [
  [/top mgmt|board|cfo|general manager|top management|audit committee|investors/i, 'top_management'],
  [/\bai\b|ai gov|ai engine|orchestrator|data scientist|ai engineer/i, 'ai_governance_officer'],
  [/audit|auditor|certification/i, 'audit_manager'],
  [/hse|safety|environmental|hygien|occ health|medical|maritime|fleet/i, 'hse_manager'],
  [/quality|metrolog|lab mgr/i, 'quality_manager'],
  [/risk|bcp|crisis|investigator/i, 'risk_manager'],
  [/compliance|legal|dpo|regulat|sovereign|policy owner/i, 'compliance_officer'],
  [/\bhr\b|hr mgr|trainer|sme hr/i, 'hr_manager'],
  [/doc|records|author/i, 'document_controller'],
  [/\bit\b|ciso|security|iam|architect|dsi|cloud|iot|platform|development/i, 'it_manager'],
  [/sustainab|esg|lca|eco-design|carbon/i, 'esg_manager'],
  [/data|kpi|performance|analyst|report users|knowledge/i, 'performance_manager'],
  [/improvement|innovation|transformation|pmo|lean|ci pilot|simulation|deployment|project team/i, 'transformation_manager'],
  [/process/i, 'process_excellence_manager'],
  [/admin|tenant/i, 'tenant_admin'],
  [/operation|maintenance|supply|procurement|logistic|engineer|facilit|welding|field|supervisor|operators/i, 'operations_manager'],
  [/employee|all |all$|community|partners|customers|stakeholders|organization|business/i, 'employee'],
];
export function roleCodeOf(label) {
  for (const [re, code] of ROLE_RULES) if (re.test(label)) return code;
  return 'ims_manager';
}

function parseTarget(t) {
  const s = String(t || '').replace(',', '.');
  const m = s.match(/(<=|>=|≤|≥|<|>|=)?\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return { value: null, dir: 'up', pct: /%/.test(s) };
  const op = m[1] || '';
  return { value: +m[2], dir: /<|≤/.test(op) ? 'down' : 'up', pct: /%/.test(s) };
}

function series(target, dir, n, r, quality) {
  const out = [];
  const t = target ?? 90;
  let a; let b;
  if (dir === 'down') {
    if (t === 0) { a = r.int(3, 6); b = quality > 0.5 ? 0 : 1; } else { a = t * (1.35 + r.next() * 0.5); b = t * (quality > 0.5 ? 0.78 + r.next() * 0.2 : 1.02 + r.next() * 0.15); }
  } else {
    a = t * (0.78 + r.next() * 0.12); b = t * (quality > 0.5 ? 0.99 + r.next() * 0.05 : 0.93 + r.next() * 0.05);
  }
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 1 : i / (n - 1);
    let v = a + (b - a) * x + (r.next() - 0.5) * Math.abs(t || 5) * 0.04;
    if (t <= 100 && dir === 'up' && t >= 50) v = Math.min(v, 100);
    v = Math.max(v, 0);
    out.push(Math.round(v * 10) / 10);
  }
  return out;
}
const meets = (v, target, dir) => (target === null ? true : dir === 'down' ? v <= target : v >= target);

function months(from, to) {
  const out = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) { out.push(`${y}-${String(m).padStart(2, '0')}`); m++; if (m > 12) { m = 1; y++; } }
  return out;
}

// Selects the macro processes a project runs: vertical activation matrix, restricted by
// the organization's licensed packs; QMS runs exclude the H, E and S scopes.
export function activatedMps(cat, org, msType, entitled) {
  const seg = org.sector;
  return cat.macroProcesses.filter(mp => {
    let on;
    if (org.size === 'SME') {
      on = ['✓', 'S'].includes(mp.activation.SME) || (mp.tier === 6 && seg !== 'UNI' && ['✓', 'S'].includes(mp.activation[seg]));
    } else if (seg === 'UNI') {
      on = (mp.tier >= 1 && mp.tier <= 5) || (mp.tier === 6 && UNI_T6.includes(mp.code));
    } else on = ['✓', 'S'].includes(mp.activation[seg]);
    if (!on || !entitled.has(mp.id)) return false;
    if (msType === 'QMS' && mp.scope !== 'Q') return false;
    return true;
  });
}

export function generateProject(ctx) {
  const { cat, org, orgName, msType, users, profile, seg, entitled, libs, scenario } = ctx;
  const r = rng(`${org.short_code}:${msType}`);
  const large = org.size !== 'SME';
  const qhse = msType === 'QHSE';
  const start = large ? (qhse ? '2025-10-15' : '2025-10-01') : (qhse ? '2025-12-01' : '2025-11-15');
  const end = addDays(start, large ? 455 : 395);
  const U = (code) => users[code] || users.ims_manager;
  const uName = (code) => U(code).name;
  const pid = uid();
  const oid = org.id;
  const createdAt = ts(addDays(start, -10), r);

  // ---- Standards in scope
  const must = seg ? seg.mustStandards || [] : [];
  const base = qhse ? ['ISO 9001', 'ISO 14001', 'ISO 45001'] : ['ISO 9001'];
  // A QMS run keeps quality standards only; environment and OH&S standards belong to QHSE runs.
  const mustQ = must.filter(x => qhse || !/14001|45001|50001|14064|27001|27701|ISO 26000|SA8000/.test(x));
  const standards = [...new Set([...base, ...mustQ.slice(0, qhse ? 2 : 3)])];
  const stdMain = standards[0];

  // ---- Macro processes and steps of the run, in lifecycle order
  const mps = activatedMps(cat, org, msType, entitled);
  const mpSet = new Set(mps.map(m => m.id));
  const phasesE2E = E2E_ORDER.filter(e => cat.e2eById[e].mpIds.some(m => mpSet.has(m)));
  const ordered = [];
  for (const e of phasesE2E) for (const m of cat.e2eById[e].mpIds) if (mpSet.has(m)) ordered.push(cat.mpById[m]);
  const allSteps = [];
  for (const mp of ordered) for (const s of cat.stepsByMp[mp.id] || []) allSteps.push({ s, mp });

  // ---- Complexity score and SME track (FR-DA-SCO)
  const smeScale = org.employees < 50 ? -1 : org.employees > 150 ? 1 : 0;
  const levels = COMPLEXITY_CRITERIA.map(c => Math.min(5, Math.max(1, (large ? 3 : 2) + smeScale + r.int(-1, 1) + (c.code === 'CX-03' && qhse ? 1 : 0))));
  const score = Math.round(COMPLEXITY_CRITERIA.reduce((a, c, i) => a + c.weight * (levels[i] - 1) / 4, 0));
  let track = null;
  if (!large) track = (SME_TRACKS.find(t => score >= t.min && score < t.max) || SME_TRACKS[2]).code;
  if (scenario === 'SME-AEC-QMS') track = 'TRK-STANDARD';
  const gatePhases = large ? phasesE2E : TRACK_GATES[track].filter(e => phasesE2E.includes(e));

  // ---- Project record
  const yr = large ? '2025–2026' : '2025–2026';
  const name = fill(qhse ? R.PROJECT_TEXT.nameH : R.PROJECT_TEXT.nameQ, yr, orgName);
  const description = fill(R.PROJECT_TEXT.desc, msType, orgName, mps.length, phasesE2E.length, standards.join(', '));
  const template = libs.templates[`${large ? 'FULL' : 'SME'}-${msType}-${org.sector}`] || libs.templates[`${large ? 'FULL' : 'SME'}-${msType}-UNI`];
  const creationMode = large ? 'catalog' : org.sector === 'UNI' ? 'manual' : 'ai';
  const owner = qhse ? U('ims_manager') : U('quality_manager');
  run(`INSERT INTO projects(id,org_id,code,name,description,ms_type,mode,track,vertical,standards,status,start_date,end_date,template_id,creation_mode,complexity,owner_user,scenario,created_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  pid, oid, `${org.short_code}-${msType}`, J(name), J(description), msType, large ? 'FULL' : 'SME', track, org.sector, J(standards), 'Active', start, end,
  template, creationMode, J({ score, levels }), owner.id, scenario || null, createdAt);

  const recommendedTrack = large ? null : (SME_TRACKS.find(t => score >= t.min && score < t.max) || SME_TRACKS[2]).code;
  run(`INSERT INTO complexity_scores(project_id,org_id,criteria,score,recommended_mode,recommended_track,chosen_track,justification,approved_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    pid, oid, J(COMPLEXITY_CRITERIA.map((c, i) => ({ code: c.code, level: levels[i], weight: c.weight }))), score, large ? 'FULL' : 'SME',
    recommendedTrack, track, recommendedTrack && track !== recommendedTrack ? J(S('Customer certification deadline requires the Standard track.', 'L\'échéance de certification client impose le parcours standard.', 'يتطلب موعد اعتماد العميل المسار القياسي.')) : null,
    U('top_management').id, createdAt);

  // OBS node for the project under the organization root
  const obsId = uid();
  run('INSERT INTO obs_nodes(id,org_id,project_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?,?)', obsId, oid, pid, ctx.obsRoot, J(fill(R.PROJECT_TEXT.obsProject, msType)), 'Project', createdAt);

  // ---- KPIs (catalog KPIs of activated MPs + vertical KPIs + core QMS/HSE KPIs)
  const periods = months(start.slice(0, 7), '2026-09');
  const quality = r.next();
  const kpiDefs = [];
  for (const k of cat.kpis) if (mpSet.has(k.mp)) kpiDefs.push({ code: k.id, name: k.name, formula: k.formula, target: k.target, mp: k.mp, owner: cat.mpById[k.mp].ownerRoleCode, freq: 'Monthly', source: 'catalog' });
  for (const k of (seg && seg.id !== 'SME' ? seg.kpis : [])) kpiDefs.push({ code: k.code, name: k.name, formula: S('Sector formula — see compliance pack', 'Formule sectorielle — voir le pack de conformité', 'صيغة قطاعية — انظر حزمة الامتثال'), target: k.target, mp: null, owner: 'quality_manager', freq: k.frequency?.en || 'Monthly', source: 'vertical' });
  for (const k of R.QMS_KPIS) kpiDefs.push({ ...k, owner: k.owner, freq: 'Monthly', source: 'core' });
  if (qhse) for (const k of R.HSE_KPIS) kpiDefs.push({ ...k, freq: 'Monthly', source: 'core' });
  const kpis = [];
  for (const k of kpiDefs) {
    const id = uid();
    const tg = parseTarget(k.target);
    const vals = series(tg.value, tg.dir, periods.length, r, quality + (r.next() - 0.5) * 0.6);
    const racsi = { R: [k.owner || 'performance_manager'], A: ['ims_manager'], C: ['performance_manager'], S: ['it_manager'], I: ['top_management'] };
    run(`INSERT INTO kpis(id,org_id,project_id,code,name,formula,unit,target,target_text,direction,frequency,analysis_frequency,mp_id,owner_role,custom,racsi,source,created_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, id, oid, pid, k.code, J(k.name), J(k.formula), k.unit ?? (tg.pct ? '%' : ''), tg.value, k.target, tg.dir,
    k.freq, 'Quarterly', k.mp, k.owner || 'performance_manager', 0, J(racsi), k.source, createdAt);
    periods.forEach((p, i) => run('INSERT INTO kpi_values(kpi_id,org_id,period,value,comment) VALUES(?,?,?,?,?)', id, oid, p, vals[i], null));
    kpis.push({ id, code: k.code, name: k.name, sample: vals[vals.length - 1], targetText: k.target, target: tg.value, dir: tg.dir, last: vals[vals.length - 1], mp: k.mp, source: k.source, freq: k.freq });
  }

  // ---- Context shared by the step values: people, organization units, KPIs, SMART objectives
  const obsList = all('SELECT n.id, n.name, n.type FROM obs_nodes n WHERE n.org_id=? AND n.project_id IS NULL ORDER BY n.created_at', oid).map(n => ({ id: n.id, name: JSON.parse(n.name), type: n.type }));
  const obsUnits = obsList.filter(n => n.type !== 'Organization');
  const memberUnit = {};
  for (const m of all('SELECT m.node_id, m.role_in_node FROM obs_members m WHERE m.org_id=?', oid)) memberUnit[m.role_in_node] ||= m.node_id;
  const obsRef = (n) => ({ id: n.id, name: n.name });
  const kpiByCode = Object.fromEntries(kpis.map(k => [k.code, k]));
  const sbase = {
    profile, segRisks: seg && seg.risks && seg.risks.length ? seg.risks : cat.risks.slice(0, 5).map(x => x.name), standards, stdMain, qhse, ms: msType, orgCode: org.short_code, start,
    roleName, userName: uName, user: (role) => U(role).id,
    kpis: kpis.map(k => ({ ...k, core: k.source === 'core' })), kpiByCode,
    obsAll: obsUnits.filter(n => n.type === 'Site').map(obsRef),
    obsFor: (role) => { const n = obsList.find(x => x.id === memberUnit[role]); return n ? [obsRef(n)] : obsUnits.slice(0, 1).map(obsRef); },
    obsName: (en) => { const n = obsList.find(x => x.name.en === en) || obsUnits[0]; return obsRef(n); },
    v: { org: orgName, product: profile.product, line: profile.line, city: profile.city, customer: profile.customer, supplier: profile.supplier, d0: profile.defects[0], d1: profile.defects[1] || profile.defects[0], d2: profile.defects[2] || profile.defects[0], std: standards.join(', ') },
  };
  sbase.objectives = smartObjectives(sbase);
  sbase.objectives.forEach((o, j) => {
    const k = kpis.find(x => x.id === o.kpi);
    const ok = k ? meets(k.last, k.target, k.dir) : true;
    const id = uid();
    run('INSERT INTO registers(id,org_id,project_id,register,code,title,data,status,mp_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', id, oid, pid, 'objectives', `OBJ-${j + 1}`, J(o.objective),
      J({ kpi: k?.code, kpiId: o.kpi, target: o.target, baseline: o.baseline, current: k?.last, deadline: o.deadline, ownerUser: o.owner, resources: o.resources, relevance: o.relevance }), ok ? 'On track' : 'At risk', 'MP-003', ts(addDays(start, 20), r));
    o._registerId = id; o._ok = ok; o._k = k;
  });

  // ---- Step execution (the full run)
  const maturity = scenario ? 0.9 : large ? 0.8 + r.next() * 0.14 : 0.76 + r.next() * 0.16;
  const total = allSteps.length;
  const nDone = Math.floor(total * maturity);
  const nProg = Math.max(3, Math.floor(total * 0.03));
  const doneEnd = addDays(TODAY, -2);
  const span = days(start, doneEnd);
  const segRisks = seg && seg.risks && seg.risks.length ? seg.risks : cat.risks.slice(0, 5).map(x => x.name);
  const kctx = kpis.slice(0, 12).map(k => ({ name: k.name, sample: k.sample, targetText: k.targetText }));
  const stepRows = [];
  const mpState = {};
  allSteps.forEach(({ s, mp }, i) => {
    let status; let due; let completedAt = null; let by = null;
    if (i < nDone) {
      status = 'Done';
      const d = addDays(start, Math.floor((i / Math.max(1, nDone)) * span));
      due = addDays(d, r.int(0, 5));
      completedAt = ts(d, r);
    } else if (i < nDone + nProg) {
      status = 'InProgress';
      due = addDays(TODAY, r.int(-6, 14));
    } else {
      status = 'Todo';
      const k = (i - nDone - nProg) / Math.max(1, total - nDone - nProg);
      due = r.chance(0.035) ? addDays(TODAY, -r.int(2, 18)) : addDays(TODAY, 3 + Math.floor(k * 80));
    }
    const roleCode = s.type === 'Service Task' || s.role === 'DynamicMS Engine' ? null : (s.roleCode || mp.ownerRoleCode || 'ims_manager');
    const assignee = roleCode ? U(roleCode) : null;
    if (status === 'Done') by = assignee ? assignee.id : null;
    let fields = null; let summary = null;
    if (status !== 'Todo') {
      const v = stepValue(s, { ...sbase, mp, mpSteps: cat.stepsByMp[mp.id] }, r, status, due);
      fields = v.fields; summary = v.summary;
    }
    const id = uid();
    const task = (cat.tasksByMp[mp.id] || []).find(t => t.id === s.task);
    run(`INSERT INTO step_exec(id,org_id,project_id,mp_id,step_id,e2e_id,task_name,seq,status,assignee_role,assignee_user,due_date,completed_at,completed_by,form_kind,value,fields,notes,updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, id, oid, pid, mp.id, s.id, mp.e2e, task ? J(task.name) : null, i + 1, status, roleCode || 'system',
    assignee ? assignee.id : null, due, completedAt, by, s.formKind, J(summary), J(fields), null, completedAt || createdAt);
    stepRows.push({ id, s, mp, status, due, completedAt, by, roleCode, fields });
    const st = (mpState[mp.id] ||= { n: 0, done: 0, first: null, last: null });
    st.n++; if (status === 'Done') { st.done++; st.first ||= completedAt; st.last = completedAt; } else if (status === 'InProgress') st.first ||= ts(addDays(TODAY, -5), r);
  });
  for (const mp of ordered) {
    const st = mpState[mp.id] || { n: 0, done: 0 };
    const status = st.n && st.done === st.n ? 'Completed' : st.first ? 'InProgress' : 'NotStarted';
    run('INSERT INTO project_mps(project_id,org_id,mp_id,e2e_id,activation,status,owner_role,progress,started_at,completed_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      pid, oid, mp.id, mp.e2e, org.size === 'SME' ? (mp.activation.SME || mp.activation[org.sector] || '✓') : (mp.activation[org.sector] || '✓'), status, mp.ownerRoleCode,
      st.n ? Math.round(100 * st.done / st.n) : 0, st.first || null, status === 'Completed' ? st.last : null);
  }
  const doneCount = stepRows.filter(x => x.status === 'Done').length;
  run('UPDATE projects SET progress_cache=? WHERE id=?', Math.round(100 * doneCount / Math.max(1, total)), pid);

  // One step completed, reopened with justification and completed again (FR-DA-WF-04).
  const reopenRow = stepRows.find(x => x.status === 'Done' && x.s.formKind === 'list') || stepRows.find(x => x.status === 'Done');
  if (reopenRow) {
    const reopenAt = addDays(reopenRow.completedAt.slice(0, 10), 9) < TODAY ? addDays(reopenRow.completedAt.slice(0, 10), 9) : reopenRow.completedAt.slice(0, 10);
    run('INSERT INTO entity_versions(id,org_id,entity_type,entity_id,version,data,user_id,justification,at,is_current) VALUES(?,?,?,?,?,?,?,?,?,?)',
      uid(), oid, 'step', reopenRow.id, 1, J({ status: 'Done', completed_at: reopenRow.completedAt }), reopenRow.by, null, reopenRow.completedAt, 0);
    run('INSERT INTO entity_versions(id,org_id,entity_type,entity_id,version,data,user_id,justification,at,is_current) VALUES(?,?,?,?,?,?,?,?,?,?)',
      uid(), oid, 'step', reopenRow.id, 2, J({ status: 'Done', completed_at: ts(reopenAt, r) }), reopenRow.by, J(R.PROJECT_TEXT.reopen), ts(reopenAt, r), 1);
    run('INSERT INTO audit_log(id,org_id,user_id,entity_type,entity_id,action,before_,after_,justification,at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      uid(), oid, U('quality_manager').id, 'step', reopenRow.id, 'reopen', J({ status: 'Done' }), J({ status: 'InProgress' }), J(R.PROJECT_TEXT.reopen), ts(reopenAt, r));
  }

  // ---- Phases, gates and checklists
  const phaseInfo = {};
  phasesE2E.forEach((e, idx) => {
    const rows = stepRows.filter(x => x.mp.e2e === e);
    const done = rows.filter(x => x.status === 'Done');
    const status = done.length === rows.length ? 'Closed' : done.length || rows.some(x => x.status === 'InProgress') ? 'Active' : 'Planned';
    const hasGate = gatePhases.includes(e);
    const lastDone = done.length ? done.map(x => x.completedAt).sort().pop().slice(0, 10) : null;
    const decidedAt = status === 'Closed' && hasGate ? (addDays(lastDone, 1) > TODAY ? TODAY : addDays(lastDone, 1)) : null;
    const id = uid();
    run('INSERT INTO phases(id,org_id,project_id,e2e_id,seq,status,gate_decision,decided_at,decided_by,comment,run_count) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      id, oid, pid, e, idx + 1, status, decidedAt ? 'Go' : null, decidedAt ? ts(decidedAt, r) : null, decidedAt ? U('top_management').id : null,
      decidedAt ? J(R.PROJECT_TEXT.gateGo) : null, ['E2E-09', 'E2E-10'].includes(e) && status !== 'Planned' ? 2 : 1);
    phaseInfo[e] = { id, status, decidedAt, rows, hasGate, start: rows[0]?.completedAt?.slice(0, 10) || rows[0]?.due, end: lastDone || rows[rows.length - 1]?.due };
    if (decidedAt) run('INSERT INTO audit_log(id,org_id,user_id,entity_type,entity_id,action,before_,after_,justification,at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      uid(), oid, U('top_management').id, 'gate', id, 'gate_decision', null, J({ decision: 'Go', e2e: e }), J(R.PROJECT_TEXT.gateGo), ts(decidedAt, r));
    if (!hasGate) return;
    const gate = libs.gates[e];
    const addChecklist = (tplCode, items) => {
      const cid = uid();
      const tpl = libs.checklists[tplCode];
      run('INSERT INTO checklists(id,org_id,project_id,phase_id,gate_id,template_id,title,frozen,signed_off) VALUES(?,?,?,?,?,?,?,?,?)',
        cid, oid, pid, id, gate, tpl?.id || null, J(tpl?.name || S(tplCode, tplCode, tplCode)), status === 'Closed' ? 1 : 0, status === 'Closed' ? 1 : 0);
      const doneShare = status === 'Closed' ? 1 : status === 'Active' ? done.length / rows.length : 0;
      items.forEach((it, j) => {
        const isDone = j < Math.round(items.length * doneShare);
        run('INSERT INTO checklist_items(id,checklist_id,org_id,seq,text,mandatory,evidence_required,done,done_by,done_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
          uid(), cid, oid, j + 1, J(it.text), it.mandatory ? 1 : 0, it.evidence ? 1 : 0, isDone ? 1 : 0, isDone ? U('ims_manager').id : null, isDone ? ts(decidedAt || addDays(TODAY, -3), r) : null);
      });
    };
    addChecklist(`CL-${e}`, CHECKLISTS[e]);
    if (e === 'E2E-08' && VERTICAL_CHECKLISTS[org.sector]) addChecklist(`CL-V-${org.sector}`, VERTICAL_CHECKLISTS[org.sector]);
    if (e === 'E2E-10' && !large) addChecklist('CL-V-SME', VERTICAL_CHECKLISTS.SME);
  });

  // ---- RACSI: E2E activities from the process design + one per macro process
  const addActivity = (e2e, mpId, stepRef, name, letters) => {
    const aid = uid();
    run('INSERT INTO racsi_activities(id,org_id,project_id,e2e_id,mp_id,step_ref,linked_type,linked_id,name,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      aid, oid, pid, e2e, mpId, stepRef, mpId ? 'mp' : 'e2e', mpId || e2e, J(name), createdAt);
    const seen = new Set();
    let hasA = false;
    for (const L of ['A', 'R', 'C', 'S', 'I']) {
      for (const code of letters[L] || []) {
        if (L === 'A') { if (hasA) continue; hasA = true; }
        const key = `${L}:${code}`; if (seen.has(key)) continue; seen.add(key);
        run('INSERT INTO racsi_assignments(id,activity_id,org_id,letter,assignee) VALUES(?,?,?,?,?)', uid(), aid, oid, L, code);
      }
    }
  };
  for (const e of phasesE2E) {
    for (const a of cat.e2eById[e].racsi) {
      const conv = {}; for (const L of 'RACSI') conv[L] = [...new Set(a[L].map(x => roleCodeOf(x.en)))];
      addActivity(e, null, null, a.activity, conv);
    }
  }
  for (const mp of ordered) {
    const counts = {};
    for (const s of cat.stepsByMp[mp.id] || []) if (s.roleCode) counts[s.roleCode] = (counts[s.roleCode] || 0) + 1;
    const Rrole = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || mp.ownerRoleCode;
    addActivity(mp.e2e, mp.id, null, mp.name, { A: [mp.ownerRoleCode || 'ims_manager'], R: [Rrole], C: [qhse ? 'hse_manager' : 'risk_manager'], S: ['document_controller'], I: ['top_management'] });
  }

  // ---- Risks, hazards, aspects and opportunities
  const risks = [];
  const addRisk = (code, kind, title, category, L, I, residual, ownerRole, status, mpId, treatment, controls, kri) => {
    const id = uid();
    run(`INSERT INTO risks(id,org_id,project_id,code,kind,title,category,likelihood,impact,score,residual,owner_role,status,controls,mp_id,treatment,kri,obs_node,created_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, id, oid, pid, code, kind, J(title), category, L, I, L * I, residual, ownerRole, status, J(controls || []), mpId, treatment ? J(treatment) : null, kri ? J(kri) : null, obsId, createdAt);
    risks.push({ id, code, title, score: L * I, ownerRole, status });
  };
  const LI = (score) => { for (let l = 5; l >= 1; l--) for (let i = 5; i >= 1; i--) if (l * i <= score && l * i >= score - 2) return [l, i]; return [2, 2]; };
  const TREAT = [S('Reduce', 'Réduire', 'تقليص'), S('Reduce', 'Réduire', 'تقليص'), S('Transfer', 'Transférer', 'نقل'), S('Accept', 'Accepter', 'قبول')];
  for (const k of cat.risks) {
    const [l, i] = LI(k.inherent);
    addRisk(k.id, 'Risk', k.name, k.category, l, i, k.residual, 'risk_manager', r.pick(['Treated', 'Monitoring', 'Monitoring', 'Open']), null, TREAT[r.int(0, 3)], k.controls, k.kri);
  }
  segRisks.forEach((t, j) => { const l = r.int(2, 5); const i2 = r.int(3, 5); addRisk(`${org.sector}-R${String(j + 1).padStart(2, '0')}`, 'Risk', t, 'Sector', l, i2, Math.max(2, Math.round(l * i2 / 3)), 'risk_manager', r.pick(['Treated', 'Monitoring', 'Open']), 'MP-012', S('Reduce', 'Réduire', 'تقليص'), [], null); });
  profile.defects.forEach((t, j) => addRisk(`Q-R${String(j + 1).padStart(2, '0')}`, 'Risk', t, 'Quality', r.int(2, 4), r.int(3, 5), r.int(3, 8), 'quality_manager', r.pick(['Treated', 'Monitoring']), 'MP-012', S('Reduce', 'Réduire', 'تقليص'), ['CTL-05'], null));
  if (qhse) {
    profile.hazards.forEach((t, j) => addRisk(`H-${String(j + 1).padStart(2, '0')}`, 'Hazard', t, 'OH&S', r.int(2, 4), r.int(4, 5), r.int(4, 8), 'hse_manager', r.pick(['Treated', 'Monitoring']), 'MP-012', S('Engineering control and PPE', 'Mesure technique et EPI', 'ضبط هندسي ومعدات وقاية'), [], null));
    profile.aspects.forEach((t, j) => addRisk(`E-${String(j + 1).padStart(2, '0')}`, 'Aspect', t, 'Environment', r.int(2, 4), r.int(3, 5), r.int(3, 8), 'hse_manager', r.pick(['Treated', 'Monitoring']), 'MP-012', S('Operational control', 'Maîtrise opérationnelle', 'ضبط تشغيلي'), [], null));
  }
  R.REG.ideas.slice(0, 3).forEach((t, j) => addRisk(`O-${String(j + 1).padStart(2, '0')}`, 'Opportunity', fill(t, profile.line), 'Opportunity', r.int(3, 5), r.int(2, 4), 0, 'transformation_manager', 'Open', 'MP-012', null, [], null));

  // ---- Nonconformities, actions and REX (E2E-09)
  const people = ['quality_manager', 'operations_manager', 'hse_manager', 'document_controller', 'hr_manager', 'process_excellence_manager'];
  const nNc = large ? 10 : 6;
  const pool = [
    ...profile.defects.map(d => ({ t: S('{0}', '{0}', '{0}'), arg: d, src: r.pick(['Customer', 'Process', 'Process']), cat: 'Product' })),
    ...R.NC_GENERIC.map(g => ({ t: g.t, arg: r.pick([profile.line, profile.product, profile.supplier]), src: g.src, cat: g.cat })),
    ...(qhse ? R.NC_HSE.map(g => ({ t: g.t, arg: profile.line, src: g.src, cat: g.cat })) : []),
  ];
  const ncs = []; const actions = [];
  const addAction = (sourceType, sourceId, kind, title, status, startDate, dueDate, ownerRole, evaluatorRole, mpId) => {
    const id = uid();
    const ownerU = U(ownerRole); let evalU = U(evaluatorRole);
    if (evalU.id === ownerU.id) evalU = U(ownerRole === 'audit_manager' ? 'quality_manager' : 'audit_manager');
    const done = status === 'Closed';
    const eff = done ? (r.chance(0.85) ? 'Effective' : 'Partially effective') : null;
    run(`INSERT INTO actions(id,org_id,project_id,source_type,source_id,kind,title,owner_user,evaluator_user,status,start_date,due_date,done_at,pct,effectiveness,verdict,predecessors,created_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, id, oid, pid, sourceType, sourceId, kind, J(title), ownerU.id, evalU.id, status, startDate, dueDate,
    done ? ts(dueDate > TODAY ? TODAY : dueDate, r) : null, done ? 100 : status === 'InProgress' ? r.int(20, 80) : 0, eff, eff ? J(R.VERDICT[eff]) : null, J([]), ts(startDate, r));
    actions.push({ id, status, mpId, startDate, dueDate, title });
    return id;
  };
  for (let j = 0; j < nNc; j++) {
    const p = pool[j % pool.length];
    const title = fill(p.t, p.arg);
    const detected = addDays(start, Math.floor(((j + 0.5) / nNc) * (days(start, TODAY) - 10)));
    const crit = j === 1 ? 'Critical' : r.chance(0.35) ? 'Major' : 'Minor';
    const age = days(detected, TODAY);
    const stage = age > 90 ? 'Closed' : age > 45 ? (r.chance(0.6) ? 'Closed' : 'Verification') : age > 20 ? 'Action' : age > 8 ? 'Analysis' : 'Open';
    const closedAt = stage === 'Closed' ? addDays(detected, r.int(25, 60)) : null;
    const id = uid();
    const code = `NC-${org.short_code}-${msType}-${String(j + 1).padStart(3, '0')}`;
    const cause = stage === 'Open' ? null : r.pick(R.CAUSES);
    const owner = U(p.cat === 'OH&S' || p.cat === 'Environment' ? 'hse_manager' : r.pick(people.slice(0, 2)));
    run(`INSERT INTO ncs(id,org_id,project_id,code,title,description,source,category,criticality,status,stage,detected_at,due_date,closed_at,mp_id,owner_user,root_cause,cost,created_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, id, oid, pid, code, J(title), J(fill(R.NC_DESC, detected, profile.line)), p.src, p.cat, crit,
    stage === 'Closed' ? 'Closed' : 'Open', stage, detected, addDays(detected, crit === 'Critical' ? 15 : 45), closedAt, org.size === 'SME' && mpSet.has('MP-158') ? 'MP-158' : 'MP-018', owner.id,
    cause ? J(cause) : null, r.int(4, 90) * 100, ts(detected, r));
    ncs.push({ id, code, title, crit, stage, detected, closedAt });
    if (stage !== 'Open') {
      addAction('nc', id, 'Containment', fill(R.ACTION_TITLES.containment, title), 'Closed', detected, addDays(detected, 1), owner === U('hse_manager') ? 'hse_manager' : 'operations_manager', 'quality_manager', 'MP-019');
    }
    if (['Action', 'Verification', 'Closed'].includes(stage)) {
      const st = stage === 'Closed' ? 'Closed' : stage === 'Verification' ? 'Closed' : 'InProgress';
      addAction('nc', id, 'Corrective', fill(R.ACTION_TITLES.corrective, title), st, addDays(detected, 5), addDays(detected, 35), 'operations_manager', 'audit_manager', 'MP-021');
    }
    if (stage === 'Closed') {
      if (r.chance(0.4)) addAction('nc', id, 'Preventive', fill(R.ACTION_TITLES.preventive, title), age > 120 ? 'Closed' : 'InProgress', addDays(detected, 20), addDays(detected, 80), 'process_excellence_manager', 'quality_manager', 'MP-021');
      run(`INSERT INTO rex(id,org_id,project_id,source_type,source_id,went_well,not_well,root_cause,recommendation,category,rating,mp_id,obs_node,created_by,created_at,version)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, uid(), oid, pid, 'nc', id, J(R.REX.well), J(R.REX.notWell), J(cause), J(R.REX.rec), p.cat, r.int(3, 5), 'MP-022', obsId, U('quality_manager').id, ts(closedAt, r), 1);
      run('INSERT INTO audit_log(id,org_id,user_id,entity_type,entity_id,action,before_,after_,justification,at) VALUES(?,?,?,?,?,?,?,?,?,?)',
        uid(), oid, U('quality_manager').id, 'nc', id, 'close', J({ stage: 'Verification' }), J({ stage: 'Closed' }), null, ts(closedAt, r));
    }
  }
  // Risk treatment actions
  risks.filter(x => x.score >= 12).slice(0, 4).forEach((k, j) => addAction('risk', k.id, 'Treatment', fill(R.ACTION_TITLES.risk, k.title), j < 2 ? 'Closed' : 'InProgress', addDays(start, 40 + j * 20), addDays(start, 120 + j * 30), k.ownerRole === 'risk_manager' ? 'risk_manager' : k.ownerRole, 'audit_manager', 'MP-038'));

  // ---- Audits and findings (E2E-04, E2E-10)
  const auditPlan = [
    ['Internal', addDays(start, 120), 'ISO 9001', 'E2E-05'], ['Internal', addDays(start, 180), stdMain, 'E2E-08'], ['Supplier', addDays(start, 210), 'ISO 9001', 'E2E-08'],
    ['Mock', addDays(start, 250), standards.join(', '), 'E2E-04'], ['Internal', addDays(start, 300), qhse ? 'ISO 45001' : 'ISO 9001', 'E2E-09'],
    ['Certification', addDays(start, 320), standards.slice(0, qhse ? 3 : 1).join(', '), 'E2E-04'], ['Surveillance', addDays(TODAY, 60), standards.slice(0, qhse ? 3 : 1).join(', '), 'E2E-10'],
  ];
  if (qhse) auditPlan.splice(2, 0, ['Internal', addDays(start, 200), 'ISO 14001', 'E2E-03']);
  const findingsPool = qhse ? [...R.FINDINGS, ...R.FINDINGS_HSE] : R.FINDINGS;
  const audits = [];
  auditPlan.forEach(([type, date, std, e2e], j) => {
    const done = date < TODAY;
    const id = uid();
    const title = fill(R.AUDIT_TITLE, R.AUDIT_TYPES[type], cat.e2eById[e2e].name);
    const external = type === 'Certification' || type === 'Surveillance';
    const freq = external ? 'Annual' : type === 'Supplier' ? 'Annual' : type === 'Mock' ? 'Custom' : j % 2 ? 'Semi-annual' : 'Annual';
    const auditProcesses = cat.e2eById[e2e].mpIds.filter(m => mpSet.has(m)).slice(0, 4);
    run(`INSERT INTO audits(id,org_id,project_id,code,title,type,standard,planned_date,done_date,status,lead_user,scope,created_at,frequency,frequency_custom,criteria,objectives,team,auditees,method,duration_h,processes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id, oid, pid, `AUD-${org.short_code}-${msType}-${String(j + 1).padStart(2, '0')}`, J(title), type, std, date, done ? date : null, done ? 'Completed' : 'Planned',
      external ? U('auditor').id : U('audit_manager').id, J(cat.e2eById[e2e].name), ts(addDays(date, -30), r),
      freq, freq === 'Custom' ? J(S('Once, 6 weeks before the certification audit', 'Une fois, 6 semaines avant l\'audit de certification', 'مرة واحدة، قبل 6 أسابيع من تدقيق الاعتماد')) : null,
      J(S(`${std}; procedures and records of the processes audited; applicable legal requirements`, `${std} ; procédures et enregistrements des processus audités ; exigences légales applicables`, `${std}؛ إجراءات وسجلات العمليات المدققة؛ المتطلبات القانونية المنطبقة`)),
      J(external ? S('Certify conformity and effectiveness of the management system', 'Certifier la conformité et l\'efficacité du système de management', 'اعتماد مطابقة نظام الإدارة وفعاليته') : S('Verify conformity to the criteria and the effectiveness of the processes; identify improvement', 'Vérifier la conformité aux critères et l\'efficacité des processus ; identifier des améliorations', 'التحقق من المطابقة للمعايير وفعالية العمليات؛ تحديد فرص التحسين')),
      J([external ? U('auditor').name : U('audit_manager').name, ...(external ? [] : [U(qhse ? 'hse_manager' : 'process_excellence_manager').name])]),
      J(auditProcesses.map(m => cat.mpById[m].ownerRoleCode).filter(Boolean).map(rc => U(rc).name).filter((v, i, a) => a.indexOf(v) === i)),
      J(S('Interviews, observation on site, sampling of records (ISO 19011)', 'Entretiens, observation sur site, échantillonnage d\'enregistrements (ISO 19011)', 'المقابلات والملاحظة الميدانية وأخذ عينات من السجلات (ISO 19011)')),
      external ? 16 : type === 'Mock' ? 12 : 6, J(auditProcesses));
    audits.push({ id, type, date, done, code: `AUD-${org.short_code}-${msType}-${String(j + 1).padStart(2, '0')}` });
    if (!done) return;
    const nF = type === 'Certification' ? 2 : r.int(2, 4);
    for (let f = 0; f < nF; f++) {
      const fp = findingsPool[(j * 3 + f) % findingsPool.length];
      const ftype = type === 'Certification' ? (f === 0 ? 'Minor' : 'OFI') : f === 0 && type === 'Mock' ? 'Major' : f === 0 ? 'Minor' : r.pick(['Minor', 'Observation', 'OFI', 'OFI']);
      const text = fill(fp.t, profile.line);
      let actionId = null;
      if (['Major', 'Minor'].includes(ftype)) actionId = addAction('finding', null, 'Corrective', fill(R.ACTION_TITLES.finding, text), days(date, TODAY) > 60 ? 'Closed' : 'InProgress', addDays(date, 3), addDays(date, 45), 'quality_manager', 'audit_manager', 'MP-039');
      const det = FINDING_DETAIL[fp.clause] || FINDING_DETAIL['7.5.3'];
      const nc = ['Major', 'Minor'].includes(ftype);
      const fClosed = actionId && days(date, TODAY) > 60;
      run('INSERT INTO findings(id,org_id,audit_id,type,clause,text,status,action_id,mp_id,code,requirement,evidence,area,auditee,due_date,correction,root_cause,verification,verified_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', uid(), oid, id, ftype, fp.clause, J(text),
        fClosed ? 'Closed' : ['Observation', 'OFI'].includes(ftype) ? 'Noted' : 'Open', actionId, 'MP-039',
        `F-${String(j + 1).padStart(2, '0')}-${f + 1}`, J(det.req), J(det.ev), J(det.area), U(r.pick(['operations_manager', 'quality_manager', 'document_controller'])).name,
        nc ? addDays(date, ftype === 'Major' ? 30 : 60) : null, nc ? J(S('Immediate correction made on the day of the audit', 'Correction immédiate réalisée le jour de l\'audit', 'تم إجراء تصحيح فوري يوم التدقيق')) : null,
        nc ? J(S('Requirement not translated into the working document; no check at the change', 'Exigence non traduite dans le document de travail ; aucun contrôle lors du changement', 'لم يُترجم المتطلب إلى وثيقة العمل؛ لا تحقق عند التغيير')) : null,
        fClosed ? J(S('Evidence reviewed by the lead auditor; action effective', 'Preuves revues par l\'auditeur responsable ; action efficace', 'راجع المدقق الرئيسي الأدلة؛ الإجراء فعال')) : null, fClosed ? addDays(date, 58) : null);
    }
  });

  // ---- Documented information (E2E-05): one document per applicable IMS template, populated
  // from the project's data (content is rendered from the live data, or snapshotted below).
  const docs = [];
  const LIVE = { format: 'structured', live: true };
  const addDoc = (code, title, type, tplId, scopeType, ownerRole, mpId, versions, reviewFreq, target) => {
    const id = uid();
    const last = versions[versions.length - 1];
    const nextReview = addDays(last.date, reviewFreq === 'Annual' ? 365 : reviewFreq === 'Quarterly' ? 91 : reviewFreq === 'Monthly' ? 30 : 180);
    run(`INSERT INTO documents(id,org_id,project_id,code,title,doc_type,template_id,standards,scope_type,current_version,status,owner_role,review_frequency,next_review,mp_id,created_at,target,updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, id, oid, pid, code, J(title), type, tplId, J(standards), scopeType, last.v, last.status, ownerRole, reviewFreq, nextReview, mpId, ts(versions[0].date, r), J(target || {}), ts(last.date, r));
    const vids = [];
    versions.forEach((v) => {
      const vid = uid(); vids.push(vid);
      run(`INSERT INTO document_versions(id,org_id,document_id,version,status,change_type,summary,content,author,approver,approved_at,formats,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        vid, oid, id, v.v, v.status, v.change, J(v.summary || R.CHANGE[v.change]), J(v.content ?? LIVE), U('document_controller').id, v.status === 'Draft' || v.status === 'In review' ? null : U(ownerRole).id,
        v.status === 'Draft' || v.status === 'In review' ? null : ts(v.date, r), J(['PDF', 'DOCX']), ts(v.date, r));
      if (v.status === 'Published' || v.status === 'Superseded') run('INSERT INTO audit_log(id,org_id,user_id,entity_type,entity_id,action,before_,after_,justification,at) VALUES(?,?,?,?,?,?,?,?,?,?)',
        uid(), oid, U(ownerRole).id, 'document', id, 'approve', null, J({ version: v.v }), null, ts(v.date, r));
    });
    docs.push({ id, code, title, nextReview, template: tplId, mp: mpId, target, lastVersion: vids[vids.length - 1] });
  };
  const scopeType = qhse ? 'Integrated' : 'Single-standard';
  const clampDate = (d) => (d > TODAY ? addDays(TODAY, -3) : d);
  const versionsFor = (state, d0, twice) => {
    if (state === 'Completed') return twice ? [{ v: '1.0', status: 'Superseded', change: 'New', date: clampDate(d0) }, { v: '1.1', status: 'Published', change: 'Minor', date: clampDate(addDays(d0, 150)) }] : [{ v: '1.0', status: 'Published', change: 'New', date: clampDate(d0) }];
    if (state === 'InProgress') return [{ v: '0.9', status: 'In review', change: 'New', date: clampDate(d0) }];
    return [{ v: '0.1', status: 'Draft', change: 'New', date: clampDate(d0) }];
  };
  const mpDocState = (mpId) => { const st = mpState[mpId]; if (!st) return 'NotStarted'; return st.n && st.done === st.n ? 'Completed' : st.done || st.first ? 'InProgress' : 'NotStarted'; };
  const mpDate = (mpId, j) => (mpState[mpId]?.last || mpState[mpId]?.first || ts(addDays(start, 20 + j * 12), r)).slice(0, 10);
  const docCode = (t, suffix) => `${org.short_code}-${msType}-${t.code.replace(/^TPL-/, '')}${suffix ? `-${suffix}` : ''}`;
  DOC_TEMPLATES.filter(t => t.ms.includes(msType) && !t.perMp && !t.perPhase && !t.perAudit && !t.perNc && !t.alternativeTo).forEach((t, j) => {
    const mandatory = Object.keys(t.mandatory).some(x => standards.includes(x));
    const state = mpSet.has(t.mp) ? mpDocState(t.mp) : (mandatory ? 'Completed' : null);
    if (!state || (state === 'NotStarted' && !mandatory)) return;
    const twice = ['Policy', 'Manual', 'Scope'].includes(t.docType) || (t.docType === 'Register' && j % 2 === 0);
    addDoc(docCode(t), t.name, t.docType, t.code, scopeType, t.owner, t.mp, versionsFor(state, mpDate(t.mp, j), twice), t.review, {});
  });
  const sheetTpl = DOC_TEMPLATES.find(t => t.code === 'TPL-PSHEET');
  ordered.filter(m => m.tier === 1).slice(0, 6).forEach((mp, j) => addDoc(docCode(sheetTpl, mp.code), fill(R.DOCS.sheet, mp.name), 'Sheet', 'TPL-PSHEET', 'Single-standard', mp.ownerRoleCode, mp.id,
    versionsFor(mpDocState(mp.id), mpDate(mp.id, j), false), 'Semi-annual', { mp: mp.id }));
  const procTpl = DOC_TEMPLATES.find(t => t.code === 'TPL-PROC');
  phasesE2E.forEach((e, j) => {
    const ph = phaseInfo[e];
    const d0 = ph.start && ph.start < TODAY ? ph.start : addDays(start, 20 + j * 25);
    const state = ph.status === 'Closed' ? 'Completed' : ph.status === 'Planned' ? 'NotStarted' : 'InProgress';
    addDoc(docCode(procTpl, e.slice(4)), fill(R.DOCS.procedure, cat.e2eById[e].name), 'Procedure', 'TPL-PROC', scopeType, cat.e2eById[e].mpIds.map(m => cat.mpById[m]).find(m => mpSet.has(m.id))?.ownerRoleCode || 'ims_manager', null,
      versionsFor(state, d0, state === 'Completed'), 'Annual', { e2e: e });
  });

  const audTpl = DOC_TEMPLATES.find(t => t.code === 'TPL-AUDREP');
  audits.filter(a => a.done && a.type !== 'Certification' && a.type !== 'Surveillance').forEach((a, j) => addDoc(docCode(audTpl, String(j + 1).padStart(2, '0')), fill(R.DOCS.auditReport, a.code), 'Report', 'TPL-AUDREP', scopeType, 'audit_manager', 'MP-039',
    versionsFor('Completed', addDays(a.date, 7), false), 'Per event', { audit: a.id }));
  const capaTpl = DOC_TEMPLATES.find(t => t.code === 'TPL-CAPA');
  ncs.filter(n => ['Major', 'Critical'].includes(n.crit)).forEach((n) => addDoc(docCode(capaTpl, n.code.split('-').pop()), fill(R.DOCS.capa, n.code), 'Report', 'TPL-CAPA', scopeType, 'quality_manager', 'MP-020',
    versionsFor(n.stage === 'Closed' ? 'Completed' : 'InProgress', n.detected, false), 'Per event', { nc: n.id }));

  // ---- Registers
  const reg = (register, code, title, data, status, mpId, date) => run('INSERT INTO registers(id,org_id,project_id,register,code,title,data,status,mp_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    uid(), oid, pid, register, code, J(title), J(data), status, mpId, ts(date || addDays(start, 10), r));
  segRisks.slice(0, 3).forEach((t, j) => reg('context', `CI-E${j + 1}`, t, { type: R.REG.issueExt, category: R.REG.pestle[[1, 4, 3][j] ?? 0], impact: r.int(3, 5) }, 'Active', 'MP-001'));
  profile.defects.slice(0, 2).forEach((t, j) => reg('context', `CI-I${j + 1}`, t, { type: R.REG.issueInt, category: R.REG.pestle[3], impact: r.int(2, 4) }, 'Active', 'MP-001'));
  R.REG.parties.forEach(([p, need], j) => { if (!qhse && j === 5) return; reg('parties', `IP-${j + 1}`, fill(p, profile.customer, profile.supplier), { needs: fill(need, profile.product), influence: r.int(2, 5), interest: r.int(2, 5) }, 'Active', 'MP-001'); });
  for (const o of sbase.objectives) if (!o._ok) addAction('objective', o._registerId, 'Improvement', fill(R.ACTION_TITLES.objective, o.objective), 'InProgress', addDays(TODAY, -40), addDays(TODAY, 50), 'performance_manager', 'ims_manager', 'MP-003');
  const certAudit = audits.find(a => a.type === 'Certification');
  standards.slice(0, qhse ? 3 : 1).forEach((s, j) => reg('certificates', `CERT-${j + 1}`, { en: s, fr: s, ar: s }, { body: R.REG.certBody, issued: certAudit?.done ? addDays(certAudit.date, 30) : null, expiry: certAudit?.done ? addDays(certAudit.date, 30 + 1095) : null, number: `MCS-${org.short_code}-${String(r.int(1000, 9999))}` }, certAudit?.done ? 'Valid' : 'Planned', 'MP-017'));
  R.REG.supplierNames.forEach((t, j) => { const score = r.int(62, 98); const det = supplierDetail(r, j, score, TODAY, addDays); reg('suppliers', `SUP-${j + 1}`, fill(t, profile.supplier), { ...det, critical: j === 0, lastEvaluation: addDays(TODAY, -r.int(10, 150)) }, det.score >= 80 ? 'Approved' : det.score >= 65 ? 'Conditional' : 'Under review', 'MP-024'); });
  R.REG.ideas.forEach((t, j) => {
    const roi = r.int(80, 420);
    const st = j < 2 ? 'Implemented' : j < 4 ? 'In progress' : 'Proposed';
    reg('ideas', `IDEA-${j + 1}`, fill(t, profile.line), { roi, effort: r.pick(['Low', 'Medium', 'High']), submittedBy: uName(r.pick(['employee', 'operations_manager', 'quality_manager'])) }, st, 'MP-023', addDays(start, 60 + j * 40));
    if (st !== 'Proposed') addAction('idea', null, 'Improvement', fill(R.ACTION_TITLES.idea, fill(t, profile.line)), st === 'Implemented' ? 'Closed' : 'InProgress', addDays(start, 70 + j * 40), addDays(start, 140 + j * 50), 'transformation_manager', 'process_excellence_manager', 'MP-023');
  });
  ['2026-03', '2026-09'].forEach((p, j) => { const d = `${p}-${j ? '15' : '20'}`; if (d > TODAY || d < start) return; reg('reviews', `MR-${j + 1}`, fill(R.REG.reviewTitle, p), { date: d, attendees: ['top_management', 'ims_manager', 'quality_manager', qhse ? 'hse_manager' : 'performance_manager'].map(uName), outputs: fill(R.REG.reviewOut, profile.line) }, 'Held', 'MP-034', d); });
  if (qhse) R.REG.incidents.forEach(([type, t], j) => reg('incidents', `INC-${j + 1}`, fill(t, profile.line), { type, date: addDays(start, 50 + j * 70), lostDays: j === 1 ? 0 : 0, investigated: true }, 'Closed', 'MP-051', addDays(start, 50 + j * 70)));

  seedImsRecords({ r, reg, profile, qhse, uName, TODAY, start, addDays, ncs, standards });

  // ---- Links between steps and the records they produced ("where are these records?")
  const regsByMp = {};
  for (const x of all('SELECT id, register, code, title, mp_id FROM registers WHERE project_id=?', pid)) (regsByMp[x.mp_id] ||= []).push(x);
  const docsByMp = {};
  for (const d of docs) if (d.mp) (docsByMp[d.mp] ||= []).push(d);
  const docRef = (d) => ({ type: 'document', id: d.id, code: d.code, title: d.title });
  const regRef = (x) => ({ type: 'register', register: x.register, id: x.id, code: x.code, title: JSON.parse(x.title) });
  const stepActStatus = (due) => (due < addDays(TODAY, -45) ? 'Closed' : due < TODAY ? 'InProgress' : 'Open');
  for (const x of stepRows) {
    const f = x.fields;
    if (!f || x.status !== 'Done') continue;
    let changed = false;
    for (const key of ['activities', 'decisions']) {
      for (const row of Array.isArray(f[key]) ? f[key] : []) {
        const ownerId = row.owner || U(x.roleCode || 'ims_manager').id;
        let evalId = U(x.mp.ownerRoleCode || 'ims_manager').id;
        if (evalId === ownerId) evalId = U('ims_manager').id;
        if (evalId === ownerId) evalId = U('quality_manager').id;
        const aid = uid(); const st = stepActStatus(row.due || x.due);
        run(`INSERT INTO actions(id,org_id,project_id,source_type,source_id,kind,title,owner_user,evaluator_user,status,start_date,due_date,done_at,pct,effectiveness,verdict,predecessors,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          aid, oid, pid, 'step', x.id, key === 'decisions' ? 'Review decision' : 'Planned', J(row.activity || row.decision), ownerId, evalId, st, row.start || x.due, row.due || addDays(x.due, 30),
          st === 'Closed' ? ts(row.due || x.due, r) : null, st === 'Closed' ? 100 : st === 'InProgress' ? 50 : 0, st === 'Closed' ? 'Effective' : null, st === 'Closed' ? J(R.VERDICT.Effective) : null, J([]), x.completedAt);
        actions.push({ id: aid, status: st, mpId: x.mp.id, startDate: row.start || x.due, dueDate: row.due || addDays(x.due, 30), title: row.activity || row.decision });
        row._actionId = aid; changed = true;
      }
    }
    if (['document', 'execute', 'update', 'close', 'service'].includes(x.s.formKind)) {
      const refs = [];
      const md = docsByMp[x.mp.id] || [];
      if (x.s.formKind === 'document') { const d = md.find(y => y.template === f.template) || md[0] || docs.find(y => y.template === f.template); if (d) refs.push(docRef(d)); }
      else {
        md.slice(0, x.s.formKind === 'service' ? 2 : 1).forEach(d => refs.push(docRef(d)));
        (regsByMp[x.mp.id] || []).slice(0, x.s.formKind === 'service' ? 4 : 2).forEach(y => refs.push(regRef(y)));
        const acts = actions.filter(a => a.mpId === x.mp.id).slice(0, 1);
        acts.forEach(a => refs.push({ type: 'action', id: a.id, title: a.title }));
      }
      if (refs.length) { f.records = refs; changed = true; }
    }
    if (changed) run('UPDATE step_exec SET fields=? WHERE id=?', J(f), x.id);
  }
  // Scenario runs keep a frozen snapshot of each document's current version (the others are
  // rendered from the live data when downloaded).
  if (scenario) {
    for (const d of docs) {
      const content = buildContent(pid, d.template, { docId: d.id, mpId: d.target?.mp || d.mp, e2e: d.target?.e2e, target: d.target || {}, ownerRole: null, date: TODAY });
      if (content) run('UPDATE document_versions SET content=? WHERE id=?', J(content), d.lastVersion);
    }
  }

  // ---- AI usage log (human-in-the-loop outcomes)
  const aiSteps = stepRows.filter(x => x.status === 'Done' && x.s.formKind === 'ai');
  const ucs = ctx.aiUsecases;
  for (const x of aiSteps) {
    const uc = ucs.find(u => u.mp === x.mp.id) || ucs[r.int(0, ucs.length - 1)];
    const f = x.completedAt;
    run('INSERT INTO ai_usage_log(id,org_id,project_id,usecase_id,record_type,record_id,user_id,outcome,confidence,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      uid(), oid, pid, uc.id, 'step', x.id, x.by, r.pick(['Accepted', 'Edited', 'Edited', 'Rejected']), Math.round((0.62 + r.next() * 0.33) * 100) / 100, 'rules+retrieval', f);
  }
  for (const uc of ucs.filter(u => mpSet.has(u.mp))) {
    for (let k = 0; k < r.int(1, 3); k++) run('INSERT INTO ai_usage_log(id,org_id,project_id,usecase_id,record_type,record_id,user_id,outcome,confidence,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      uid(), oid, pid, uc.id, 'usecase', null, U(r.pick(['quality_manager', 'ims_manager', 'risk_manager'])).id, r.pick(['Accepted', 'Edited', 'Rejected']), Math.round((0.55 + r.next() * 0.4) * 100) / 100, 'rules+retrieval', ts(addDays(start, r.int(30, days(start, TODAY) - 1)), r));
  }
  if (large && ucs[4]) run('INSERT INTO ai_project_overrides(usecase_id,project_id,org_id,state) VALUES(?,?,?,?)', ucs[4].id, pid, oid, 'Inactive');

  // ---- WBS (project > phases > actions) for Gantt planning
  const root = uid();
  run('INSERT INTO wbs_nodes(id,org_id,project_id,parent_id,name,action_ids,start_date,end_date,pct,predecessors,seq) VALUES(?,?,?,?,?,?,?,?,?,?,?)', root, oid, pid, null, J(name), J([]), start, end, Math.round(100 * doneCount / total), J([]), 0);
  let prev = null;
  phasesE2E.forEach((e, j) => {
    const ph = phaseInfo[e];
    const nid = uid();
    const acts = actions.filter(a => a.mpId && cat.mpById[a.mpId]?.e2e === e).map(a => a.id);
    const pct = ph.rows.length ? Math.round(100 * ph.rows.filter(x => x.status === 'Done').length / ph.rows.length) : 0;
    const s0 = ph.rows.map(x => x.completedAt?.slice(0, 10) || x.due).sort()[0] || start;
    const e0 = ph.rows.map(x => x.completedAt?.slice(0, 10) || x.due).sort().pop() || end;
    run('INSERT INTO wbs_nodes(id,org_id,project_id,parent_id,name,action_ids,start_date,end_date,pct,predecessors,seq) VALUES(?,?,?,?,?,?,?,?,?,?,?)', nid, oid, pid, root, J(cat.e2eById[e].name), J(acts), s0, e0, pct, J(prev ? [prev] : []), j + 1);
    prev = nid;
  });

  // ---- Alerts (deduplicated by org, type, entity and period)
  const period = ymd(TODAY);
  const alert = (type, severity, title, entityType, entityId, escalation, stepRef, createdAtIso, read) => {
    run(`INSERT OR IGNORE INTO alerts(id,org_id,project_id,type,severity,title,entity_type,entity_id,period,escalation,step_ref,created_at,read_at,dismissed) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,0)`,
      uid(), oid, pid, type, severity, J(title), entityType, entityId, period, J(escalation), stepRef, createdAtIso, read ? createdAtIso : null);
  };
  stepRows.filter(x => x.status !== 'Done' && x.due < TODAY).slice(0, 8).forEach(x => alert('STEP_OVERDUE', 'Medium', fill(S('Step overdue: {0}', 'Étape en retard : {0}', 'خطوة متأخرة: {0}'), x.s.name), 'step', x.id, [x.roleCode, x.mp.ownerRoleCode], x.s.id, ts(addDays(x.due, 1), r), false));
  kpis.filter(k => !meets(k.last, k.target, k.dir)).slice(0, 5).forEach(k => alert('KPI_OFF_TARGET', 'High', fill(S('KPI off target: {0} = {1} (target {2})', 'KPI hors cible : {0} = {1} (cible {2})', 'مؤشر خارج المستهدف: {0} = {1} (المستهدف {2})'), k.name, k.last, k.targetText), 'kpi', k.id, ['performance_manager', 'ims_manager'], null, ts(addDays(TODAY, -r.int(1, 20)), r), r.chance(0.4)));
  ncs.filter(n => n.crit === 'Critical' && n.stage !== 'Closed').forEach(n => alert('NC_CRITICAL', 'Critical', fill(S('Critical nonconformity open: {0}', 'Non-conformité critique ouverte : {0}', 'عدم مطابقة حرجة مفتوحة: {0}'), n.title), 'nc', n.id, ['quality_manager', 'top_management'], null, ts(n.detected, r), false));
  actions.filter(a => a.status !== 'Closed' && a.dueDate < TODAY).slice(0, 5).forEach(a => alert('ACTION_OVERDUE', 'Medium', fill(S('Action overdue: {0}', 'Action en retard : {0}', 'إجراء متأخر: {0}'), a.title), 'action', a.id, ['quality_manager'], null, ts(addDays(a.dueDate, 1), r), r.chance(0.3)));
  docs.filter(d => d.nextReview < addDays(TODAY, 30)).slice(0, 4).forEach(d => alert('DOC_REVIEW_DUE', 'Low', fill(S('Document review due: {0}', 'Revue documentaire à échéance : {0}', 'موعد مراجعة الوثيقة: {0}'), d.title), 'document', d.id, ['document_controller'], null, ts(addDays(d.nextReview, -30) < TODAY ? addDays(d.nextReview, -30) : TODAY, r), false));
  const activePhase = phasesE2E.find(e => phaseInfo[e].status === 'Active' && phaseInfo[e].hasGate);
  if (activePhase) alert('GATE_PENDING', 'Medium', fill(S('Gate decision pending: {0}', 'Décision de jalon en attente : {0}', 'قرار البوابة معلّق: {0}'), cat.e2eById[activePhase].name), 'phase', phaseInfo[activePhase].id, ['top_management'], null, ts(addDays(TODAY, -2), r), false);
  cat.alerts.filter(a => mpSet.has(a.step.split('.')[0])).slice(0, 3).forEach(a => alert(a.id, a.severity, a.condition, 'rule', a.rule, a.escalation.map(x => roleCodeOf(x.en)), a.step, ts(addDays(TODAY, -r.int(3, 40)), r), r.chance(0.5)));

  // ---- Audit trail sample: creation + the latest step completions
  run('INSERT INTO audit_log(id,org_id,user_id,entity_type,entity_id,action,before_,after_,justification,at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    uid(), oid, owner.id, 'project', pid, 'create', null, J({ mode: large ? 'FULL' : 'SME', creation: creationMode, template }), null, createdAt);
  stepRows.filter(x => x.status === 'Done').slice(-25).forEach(x => run('INSERT INTO audit_log(id,org_id,user_id,entity_type,entity_id,action,before_,after_,justification,at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    uid(), oid, x.by, 'step', x.id, 'complete', J({ status: 'InProgress' }), J({ status: 'Done', step: x.s.id }), null, x.completedAt));

  return { id: pid, steps: total, done: doneCount, mps: mps.length, phases: phasesE2E.length, kpis: kpis.length, track, score };
}
