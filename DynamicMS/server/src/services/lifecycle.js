// Lifecycle engine: project creation (catalog / manual / AI modes), step completion
// and reopen, progress roll-up and gate decisions.
import { run, get, all, uid, now, J, P, tx } from '../db.js';
import { catalog } from '../catalog/store.js';
import { FORM_KINDS } from '../catalog/forms.js';
import { entitledMps, orgConfig } from '../packs.js';
import { activatedMps, roleCodeOf, TRACK_GATES } from '../seed/project.js';
import { COMPLEXITY_CRITERIA, SME_TRACKS, CHECKLISTS, VERTICAL_CHECKLISTS } from '../seed/libraries.js';
import { QMS_KPIS, HSE_KPIS } from '../seed/records.js';
import { audit, snapshot } from './audit.js';
import { raise } from './alerts.js';
import { bad, conflict, HttpError } from '../http.js';
import { addDays } from '../seed/rng.js';

const E2E_ORDER = ['E2E-01', 'E2E-02', 'E2E-03', 'E2E-04', 'E2E-05', 'E2E-06', 'E2E-07', 'E2E-08', 'E2E-09', 'E2E-10', 'E2E-11', 'E2E-12'];
const S = (en, fr, ar) => ({ en, fr, ar });

// Complexity score (FR-DA-SCO-01..03): weighted criteria incl. the vertical driver.
export function scoreComplexity(levels, vertical) {
  const crit = all('SELECT * FROM complexity_criteria WHERE vertical IS NULL OR vertical = ? ORDER BY code', vertical || '');
  let wsum = 0; let acc = 0;
  const detail = crit.map(c => {
    const lv = Math.min(5, Math.max(1, +(levels?.[c.code] ?? 3)));
    wsum += c.weight; acc += c.weight * (lv - 1) / 4;
    return { code: c.code, name: P(c.name), weight: c.weight, level: lv };
  });
  const score = Math.round((acc / (wsum || 100)) * 100);
  const tracks = all('SELECT * FROM sme_tracks WHERE status=? ORDER BY min_score', 'Active');
  const track = (tracks.find(t => score >= t.min_score && score < t.max_score) || tracks[tracks.length - 1])?.code;
  return { score, detail, recommendedMode: score >= 60 ? 'FULL' : 'SME', recommendedTrack: track };
}

// "With AI" drafting (FR-DA-PCM-04): deterministic, explainable suggestion from a short description.
export function draftFromDescription(org, description) {
  const d = (description || '').toLowerCase();
  const qhse = /hse|safety|sécurité|environment|environnement|45001|14001|سلامة|بيئ/.test(d);
  const levels = {};
  for (const c of COMPLEXITY_CRITERIA) levels[c.code] = 3;
  if (/certif|audit|اعتماد/.test(d)) levels['CX-03'] = 4;
  if (/group|groupe|multi-site|sites|مواقع/.test(d)) { levels['CX-01'] = 4; levels['CX-05'] = 4; }
  if (/small|petite|quick|rapide|صغير/.test(d) || org.size === 'SME') { levels['CX-04'] = 2; levels['CX-05'] = 2; }
  if (/urgent|deadline|échéance|client|موعد/.test(d)) levels['CX-07'] = 4;
  const sc = scoreComplexity(levels, org.sector);
  const mode = org.size === 'SME' ? 'SME' : sc.recommendedMode;
  const ms = qhse ? 'QHSE' : 'QMS';
  const tpl = get('SELECT id, code, name FROM project_templates WHERE (vertical=? OR vertical IS NULL) AND mode=? AND ms_type=? AND status=? ORDER BY vertical IS NULL LIMIT 1', org.sector, mode, ms, 'Published');
  return { msType: ms, mode, track: mode === 'SME' ? sc.recommendedTrack : null, levels, score: sc.score, template: tpl ? { id: tpl.id, code: tpl.code, name: P(tpl.name) } : null,
    confidence: 0.72, rationale: S(`Detected scope ${ms}; complexity ${sc.score}/100.`, `Périmètre détecté ${ms} ; complexité ${sc.score}/100.`, `النطاق المكتشف ${ms}؛ درجة التعقيد ${sc.score}/100.`) };
}

export function createProject(req, org, body) {
  const cat = catalog();
  const cfg = orgConfig(org);
  const count = get('SELECT COUNT(*) n FROM projects WHERE org_id=?', org.id).n;
  if (count >= cfg.quotas.projects) throw new HttpError(402, 'QUOTA_EXCEEDED', `Project quota reached (${cfg.quotas.projects}).`);
  const mode = ['catalog', 'manual', 'ai'].includes(body.creationMode) ? body.creationMode : 'manual';
  const msType = body.msType === 'QHSE' ? 'QHSE' : 'QMS';
  const pmode = org.size === 'SME' ? 'SME' : (body.mode === 'SME' ? 'SME' : 'FULL');
  if (!body.name || !String(body.name).trim()) throw bad('NAME_REQUIRED', 'Project name is required.');
  const sc = scoreComplexity(body.levels || {}, org.sector);
  const track = pmode === 'SME' ? (body.track || sc.recommendedTrack) : null;
  if (track && body.track && body.track !== sc.recommendedTrack && !body.justification) throw bad('JUSTIFICATION_REQUIRED', 'A justification is required to override the recommended track.');
  let template = null;
  if (mode === 'catalog') {
    template = get('SELECT * FROM project_templates WHERE id=? AND status=?', body.templateId, 'Published');
    if (!template) throw bad('TEMPLATE_REQUIRED', 'Choose a published template.');
  }
  const lang = req.lang || 'en';
  const id = uid();
  const start = body.startDate || now().slice(0, 10);
  const end = body.endDate || addDays(start, pmode === 'SME' ? 180 : 365);
  const standards = body.standards?.length ? body.standards : msType === 'QHSE' ? ['ISO 9001', 'ISO 14001', 'ISO 45001'] : ['ISO 9001'];
  const seq = count + 1;
  const code = body.code || `${org.short_code}-${msType}-${String(seq).padStart(2, '0')}`;
  tx(() => {
    run(`INSERT INTO projects(id,org_id,code,name,description,ms_type,mode,track,vertical,standards,status,start_date,end_date,template_id,creation_mode,complexity,owner_user,scenario,created_at,progress_cache)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`, id, org.id, code, J({ [lang]: String(body.name) }), body.description ? J({ [lang]: String(body.description) }) : null,
    msType, pmode, track, org.sector, J(standards), 'Active', start, end, template?.id || null, mode, J({ score: sc.score, levels: body.levels || {} }), req.user.id, null, now());
    run(`INSERT INTO complexity_scores(project_id,org_id,criteria,score,recommended_mode,recommended_track,chosen_track,justification,approved_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
      id, org.id, J(sc.detail.map(d => ({ code: d.code, level: d.level, weight: d.weight }))), sc.score, sc.recommendedMode, sc.recommendedTrack, track, body.justification ? J({ [lang]: body.justification }) : null, req.user.id, now());
    if (template) run('UPDATE project_templates SET use_count = use_count + 1 WHERE id=?', template.id);

    // Macro processes, steps and phases
    const entitled = entitledMps(org);
    const mps = activatedMps(cat, { ...org, size: pmode === 'SME' ? 'SME' : org.size }, msType, entitled);
    const set = new Set(mps.map(m => m.id));
    const phases = E2E_ORDER.filter(e => cat.e2eById[e].mpIds.some(m => set.has(m)));
    const steps = [];
    for (const e of phases) for (const m of cat.e2eById[e].mpIds) if (set.has(m)) for (const s of cat.stepsByMp[m] || []) steps.push({ s, mp: cat.mpById[m] });
    const span = Math.max(30, Math.round((new Date(end) - new Date(start)) / 86400000));
    const users = all('SELECT id, roles FROM users WHERE org_id=? AND status=?', org.id, 'Active').map(u => ({ id: u.id, roles: JSON.parse(u.roles) }));
    const userFor = (role) => users.find(u => u.roles.includes(role))?.id || null;
    steps.forEach(({ s, mp }, i) => {
      const role = s.type === 'Service Task' || s.role === 'DynamicMS Engine' ? null : (s.roleCode || mp.ownerRoleCode || 'ims_manager');
      const task = (cat.tasksByMp[mp.id] || []).find(t => t.id === s.task);
      run(`INSERT INTO step_exec(id,org_id,project_id,mp_id,step_id,e2e_id,task_name,seq,status,assignee_role,assignee_user,due_date,form_kind,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        uid(), org.id, id, mp.id, s.id, mp.e2e, task ? J(task.name) : null, i + 1, 'Todo', role || 'system', role ? userFor(role) : null, addDays(start, Math.round(((i + 1) / steps.length) * span)), s.formKind, now());
    });
    for (const mp of mps) run('INSERT INTO project_mps(project_id,org_id,mp_id,e2e_id,activation,status,owner_role,progress) VALUES(?,?,?,?,?,?,?,0)', id, org.id, mp.id, mp.e2e, mp.activation[org.sector] || mp.activation.SME || '✓', 'NotStarted', mp.ownerRoleCode);
    const gatePhases = pmode === 'SME' ? TRACK_GATES[track] || [] : phases;
    const selectedGates = body.gates && mode === 'manual' ? body.gates : null;
    phases.forEach((e, j) => {
      const pid = uid();
      run('INSERT INTO phases(id,org_id,project_id,e2e_id,seq,status,run_count) VALUES(?,?,?,?,?,?,1)', pid, org.id, id, e, j + 1, j === 0 ? 'Active' : 'Planned');
      const hasGate = selectedGates ? selectedGates.includes(e) : gatePhases.includes(e);
      if (!hasGate) return;
      const gate = get('SELECT id FROM gate_defs WHERE code=?', `GATE-${e}`);
      const lists = [get('SELECT * FROM checklist_templates WHERE code=?', `CL-${e}`)];
      if (e === 'E2E-08' && VERTICAL_CHECKLISTS[org.sector]) lists.push(get('SELECT * FROM checklist_templates WHERE code=?', `CL-V-${org.sector}`));
      if (e === 'E2E-10' && pmode === 'SME') lists.push(get('SELECT * FROM checklist_templates WHERE code=?', 'CL-V-SME'));
      for (const t of lists.filter(Boolean)) {
        const cid = uid();
        run('INSERT INTO checklists(id,org_id,project_id,phase_id,gate_id,template_id,title,frozen,signed_off) VALUES(?,?,?,?,?,?,?,0,0)', cid, org.id, id, pid, gate?.id, t.id, t.name);
        JSON.parse(t.items).forEach((it, k) => run('INSERT INTO checklist_items(id,checklist_id,org_id,seq,text,mandatory,evidence_required,done) VALUES(?,?,?,?,?,?,?,0)', uid(), cid, org.id, k + 1, J(it.text), it.mandatory ? 1 : 0, it.evidence ? 1 : 0));
      }
    });
    // KPIs of the activated processes + core KPIs
    const kdefs = [...cat.kpis.filter(k => set.has(k.mp)).map(k => ({ code: k.id, name: k.name, formula: k.formula, target: k.target, mp: k.mp, owner: cat.mpById[k.mp].ownerRoleCode })), ...QMS_KPIS, ...(msType === 'QHSE' ? HSE_KPIS : [])];
    for (const k of kdefs) {
      const m = String(k.target).replace(',', '.').match(/(<=|>=|≤|≥|<|>)?\s*(-?\d+(?:\.\d+)?)/);
      run(`INSERT INTO kpis(id,org_id,project_id,code,name,formula,unit,target,target_text,direction,frequency,analysis_frequency,mp_id,owner_role,custom,racsi,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?)`,
        uid(), org.id, id, k.code, J(k.name), J(k.formula), k.unit ?? (/%/.test(k.target) ? '%' : ''), m ? +m[2] : null, k.target, m && /<|≤/.test(m[1] || '') ? 'down' : 'up', 'Monthly', 'Quarterly', k.mp, k.owner || 'performance_manager',
        J({ R: [k.owner || 'performance_manager'], A: ['ims_manager'], I: ['top_management'] }), 'catalog', now());
    }
    // RACSI per macro process (one Accountable)
    for (const mp of mps) {
      const aid = uid();
      run('INSERT INTO racsi_activities(id,org_id,project_id,e2e_id,mp_id,linked_type,linked_id,name,created_at) VALUES(?,?,?,?,?,?,?,?,?)', aid, org.id, id, mp.e2e, mp.id, 'mp', mp.id, J(mp.name), now());
      run('INSERT INTO racsi_assignments(id,activity_id,org_id,letter,assignee) VALUES(?,?,?,?,?)', uid(), aid, org.id, 'A', mp.ownerRoleCode || 'ims_manager');
      run('INSERT INTO racsi_assignments(id,activity_id,org_id,letter,assignee) VALUES(?,?,?,?,?)', uid(), aid, org.id, 'I', 'top_management');
    }
    const root = get('SELECT id FROM obs_nodes WHERE org_id=? AND parent_id IS NULL', org.id);
    run('INSERT INTO obs_nodes(id,org_id,project_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?,?)', uid(), org.id, id, root?.id || null, J({ [lang]: String(body.name) }), 'Project', now());
    audit(req, org.id, 'project', id, 'create', null, { creationMode: mode, template: template ? { id: template.id, code: template.code, version: template.version } : null, score: sc.score, track, aiAccepted: body.aiAccepted || null }, body.justification || null);
    snapshot(req, org.id, 'project', id, { name: body.name, msType, mode: pmode, track, standards }, null);
    refreshProgress(id);
  });
  return id;
}

export function refreshProgress(projectId) {
  const mps = all(`SELECT mp_id, COUNT(*) n, SUM(status='Done') d, SUM(status='InProgress') p, MIN(completed_at) f, MAX(completed_at) l FROM step_exec WHERE project_id=? GROUP BY mp_id`, projectId);
  let tot = 0; let done = 0;
  for (const m of mps) {
    tot += m.n; done += m.d;
    const status = m.d === m.n ? 'Completed' : m.d || m.p ? 'InProgress' : 'NotStarted';
    run('UPDATE project_mps SET progress=?, status=?, started_at=COALESCE(started_at, ?), completed_at=? WHERE project_id=? AND mp_id=?', Math.round(100 * m.d / m.n), status, m.f, status === 'Completed' ? m.l : null, projectId, m.mp_id);
  }
  run('UPDATE projects SET progress_cache=? WHERE id=?', tot ? Math.round(100 * done / tot) : 0, projectId);
  // Phase status follows its steps; a decided gate keeps the phase closed.
  for (const ph of all('SELECT * FROM phases WHERE project_id=?', projectId)) {
    const c = get(`SELECT COUNT(*) n, SUM(status='Done') d, SUM(status='InProgress') p FROM step_exec WHERE project_id=? AND e2e_id=?`, projectId, ph.e2e_id);
    let status = c.n && c.d === c.n ? (ph.gate_decision === 'Go' || !hasGate(ph.id) ? 'Closed' : 'AtGate') : (c.d || c.p ? 'Active' : ph.status === 'Active' ? 'Active' : 'Planned');
    if (ph.gate_decision === 'Go') status = 'Closed';
    if (ph.gate_decision === 'Hold') status = 'OnHold';
    if (status !== ph.status) run('UPDATE phases SET status=? WHERE id=?', status, ph.id);
  }
}
const hasGate = (phaseId) => !!get('SELECT 1 FROM checklists WHERE phase_id=? LIMIT 1', phaseId);

function validateFields(kind, fields) {
  const def = FORM_KINDS[kind] || FORM_KINDS.execute;
  const missing = [];
  for (const f of def.fields) {
    if (!f.required) continue;
    const v = fields?.[f.key];
    const empty = v === null || v === undefined || v === '' || (typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(x => String(x || '').trim())) || (Array.isArray(v) && !v.length);
    if (empty) missing.push(f.key);
  }
  if (kind === 'score' || kind === 'assess') { const s = +fields?.score; if (!(s >= 1 && s <= 5)) missing.push('score'); }
  return missing;
}

// Localized text values entered by users are stored under the author's language.
function normalizeFields(kind, fields, lang) {
  const def = FORM_KINDS[kind] || FORM_KINDS.execute;
  const out = {};
  for (const f of def.fields) {
    const v = fields?.[f.key];
    if (v === undefined) continue;
    if (['text', 'textarea'].includes(f.type) && typeof v === 'string') out[f.key] = v.trim() ? { [lang]: v } : null;
    else if (f.type === 'number' || f.type === 'score') out[f.key] = v === '' || v === null ? null : +v;
    else out[f.key] = v;
  }
  return out;
}

function phaseLocked(exec) {
  const ph = get('SELECT gate_decision FROM phases WHERE project_id=? AND e2e_id=?', exec.project_id, exec.e2e_id);
  return ph && ph.gate_decision === 'Go';
}

export function saveStep(req, exec, fields, complete) {
  const cat = catalog();
  if (exec.status === 'Done') throw conflict('STEP_DONE', 'Step is completed. Reopen it first.');
  if (phaseLocked(exec)) throw conflict('PHASE_LOCKED', 'The phase gate is decided; the step can no longer change.');
  const lang = req.lang || 'en';
  const norm = normalizeFields(exec.form_kind, fields, lang);
  const merged = { ...(P(exec.fields) || {}), ...norm };
  const step = cat.stepById[exec.step_id];
  const applied = cat.rules.filter(r => r.step === exec.step_id).map(r => ({ id: r.id, type: r.type, condition: r.condition, action: r.action }));
  if (complete) {
    const missing = validateFields(exec.form_kind, merged);
    if (missing.length) throw bad('FIELDS_REQUIRED', 'Complete the required fields.', { fields: missing });
    if (exec.form_kind === 'decision' && merged.decision === 'No-Go' && !merged.comment) throw bad('FIELDS_REQUIRED', 'A No-Go decision needs a comment.', { fields: ['comment'] });
  }
  const summary = summarize(exec.form_kind, merged, lang);
  const before = { status: exec.status, fields: P(exec.fields) };
  const status = complete ? 'Done' : 'InProgress';
  tx(() => {
    run('UPDATE step_exec SET fields=?, value=?, status=?, completed_at=?, completed_by=?, assignee_user=COALESCE(assignee_user, ?), updated_at=? WHERE id=?',
      J(merged), J(summary), status, complete ? now() : null, complete ? req.user.id : null, req.user.id, now(), exec.id);
    audit(req, exec.org_id, 'step', exec.id, complete ? 'complete' : 'save', before, { status, fields: merged }, null);
    if (complete) snapshot(req, exec.org_id, 'step', exec.id, { status, fields: merged }, null);
    // Notification rules linked to this step escalate through the alert engine.
    for (const r of applied.filter(x => /Notification|Escalation/.test(x.type))) {
      raise({ orgId: exec.org_id, projectId: exec.project_id, type: r.id, title: r.condition, entityType: 'step', entityId: exec.id, escalation: [cat.mpById[exec.mp_id]?.ownerRoleCode || 'ims_manager'], stepRef: exec.step_id });
    }
    if (complete && exec.form_kind === 'monitor' && merged.value !== undefined && merged.target) {
      const m = String(merged.target).match(/(<=|>=|≤|≥|<|>)?\s*(-?\d+(?:\.\d+)?)/);
      if (m) {
        const down = /<|≤/.test(m[1] || ''); const t = +m[2]; const v = +merged.value;
        if (down ? v > t : v < t) raise({ orgId: exec.org_id, projectId: exec.project_id, type: 'KPI_OFF_TARGET', title: { [lang]: `${typeof merged.metric === 'object' ? Object.values(merged.metric)[0] : merged.metric || step?.name?.[lang]} = ${v} (${merged.target})` }, entityType: 'step', entityId: exec.id, escalation: ['performance_manager', 'ims_manager'] });
      }
    }
    refreshProgress(exec.project_id);
    if (complete) {
      const ph = get('SELECT * FROM phases WHERE project_id=? AND e2e_id=?', exec.project_id, exec.e2e_id);
      if (ph && ph.status === 'AtGate') raise({ orgId: exec.org_id, projectId: exec.project_id, type: 'GATE_PENDING', title: { en: `Gate decision pending: ${cat.e2eById[ph.e2e_id].name.en}`, fr: `Décision de jalon en attente : ${cat.e2eById[ph.e2e_id].name.fr}`, ar: `قرار البوابة معلّق: ${cat.e2eById[ph.e2e_id].name.ar}` }, entityType: 'phase', entityId: ph.id, escalation: ['top_management'] });
    }
  });
  return { status, rulesApplied: applied };
}

export function reopenStep(req, exec, justification) {
  if (!justification || String(justification).trim().length < 5) throw bad('JUSTIFICATION_REQUIRED', 'A justification is required to reopen a step.');
  if (exec.status !== 'Done') throw conflict('NOT_DONE', 'Only completed steps can be reopened.');
  if (phaseLocked(exec)) throw conflict('PHASE_LOCKED', 'The phase gate is decided; the step can no longer be reopened.');
  tx(() => {
    run('UPDATE step_exec SET status=?, completed_at=NULL, completed_by=NULL, updated_at=? WHERE id=?', 'InProgress', now(), exec.id);
    audit(req, exec.org_id, 'step', exec.id, 'reopen', { status: 'Done' }, { status: 'InProgress' }, { [req.lang || 'en']: justification });
    snapshot(req, exec.org_id, 'step', exec.id, { status: 'InProgress', fields: P(exec.fields) }, { [req.lang || 'en']: justification });
    refreshProgress(exec.project_id);
  });
}

export function decideGate(req, phase, decision, comment) {
  if (!['Go', 'No-Go', 'Hold'].includes(decision)) throw bad('BAD_DECISION', 'Decision must be Go, No-Go or Hold.');
  if (phase.gate_decision === 'Go') throw conflict('GATE_DECIDED', 'This gate is already passed.');
  const open = get(`SELECT COUNT(*) n FROM step_exec WHERE project_id=? AND e2e_id=? AND status<>'Done'`, phase.project_id, phase.e2e_id).n;
  const missing = get(`SELECT COUNT(*) n FROM checklist_items ci JOIN checklists c ON c.id = ci.checklist_id WHERE c.phase_id=? AND ci.mandatory=1 AND ci.done=0`, phase.id).n;
  if (decision === 'Go' && (open || missing)) throw conflict('GATE_CRITERIA_NOT_MET', `Exit criteria not met: ${open} open step(s), ${missing} mandatory checklist item(s).`);
  if (decision !== 'Go' && !comment) throw bad('COMMENT_REQUIRED', 'A comment is required for No-Go or Hold.');
  tx(() => {
    run('UPDATE phases SET gate_decision=?, decided_at=?, decided_by=?, comment=?, status=? WHERE id=?', decision, now(), req.user.id, comment ? J({ [req.lang || 'en']: comment }) : null,
      decision === 'Go' ? 'Closed' : decision === 'Hold' ? 'OnHold' : 'Active', phase.id);
    if (decision === 'Go') {
      run('UPDATE checklists SET frozen=1, signed_off=1 WHERE phase_id=?', phase.id);
      const next = get('SELECT id FROM phases WHERE project_id=? AND seq=?', phase.project_id, phase.seq + 1);
      if (next) run(`UPDATE phases SET status='Active' WHERE id=? AND status='Planned'`, next.id);
    }
    audit(req, phase.org_id, 'gate', phase.id, 'gate_decision', { decision: phase.gate_decision }, { decision, e2e: phase.e2e_id }, comment || null);
  });
}

// One-line trilingual-ready summary of a step value for lists.
function summarize(kind, f, lang) {
  const txt = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? Object.values(v)[0] : Array.isArray(v) ? v.map(x => (x && typeof x === 'object' ? x[lang] ?? x.en : x)).join('; ') : v ?? '');
  const firstText = Object.values(f).map(txt).find(x => x && String(x).length > 0) || '';
  const s = kind === 'assess' ? `${f.score}/5 — ${txt(f.rationale)}` : kind === 'decision' ? `${f.decision || ''} — ${txt(f.comment)}` : kind === 'monitor' ? `${txt(f.metric)} = ${f.value} (${f.target || ''})` : String(firstText);
  return { [lang]: s.slice(0, 240) };
}

export { roleCodeOf, SME_TRACKS, CHECKLISTS };
