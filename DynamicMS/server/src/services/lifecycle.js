// Lifecycle engine: project creation (catalog / manual / AI modes), step completion
// and reopen, progress roll-up and gate decisions.
import { run, get, all, uid, now, J, P, tx } from '../db.js';
import { catalog } from '../catalog/store.js';
import { FORM_KINDS, matrixScore } from '../catalog/forms.js';
import { formFor } from '../catalog/stepforms.js';
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

const isEmpty = (v) => v === null || v === undefined || v === '' || (typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(x => (typeof x === 'object' ? x && Object.keys(x).length : String(x ?? '').trim()))) || (Array.isArray(v) && !v.length);

function validateFields(kind, fields, step) {
  const def = formFor(step, kind);
  const missing = [];
  for (const f of def.fields) {
    const v = fields?.[f.key];
    if (f.required && isEmpty(v)) { missing.push(f.key); continue; }
    // Row tables: every row needs its required columns.
    if (Array.isArray(v) && f.columns) {
      const req = f.columns.filter(c => c.required).map(c => c.key);
      if (v.some(row => req.some(k => isEmpty(row?.[k])))) missing.push(f.key);
    }
  }
  if (kind === 'assess') { const s = +fields?.score; if (!(s >= 1 && s <= 5)) missing.push('score'); }
  if (kind === 'needs' && Array.isArray(fields?.matrix) && fields.matrix.length) { const s = +fields?.score; if (!(s >= 1 && s <= 5)) missing.push('matrix'); }
  return [...new Set(missing)];
}

// Localized text values entered by users are stored under the author's language;
// values already stored as {en, fr, ar} (seeded or untouched) are kept as they are.
const textVal = (v, lang) => (v && typeof v === 'object' ? v : String(v ?? '').trim() ? { [lang]: String(v) } : null);
function normCell(type, v, lang) {
  if (v === undefined) return undefined;
  if (['text', 'textarea'].includes(type)) return textVal(v, lang);
  if (['number', 'score'].includes(type)) return v === '' || v === null ? null : +v;
  if (type === 'obs' || type === 'parties') return normObs(v, lang);
  // A choice from the list is kept as its trilingual label; a custom value is stored as text.
  if (type === 'combo') return v && typeof v === 'object' ? v : textVal(v, lang);
  if (type === 'mp') return typeof v === 'string' && catalog().mpById[v] ? v : textVal(v, lang);
  return v;
}
function normObs(v, lang) {
  if (v === null || v === undefined || v === '') return null;
  const one = (x) => (typeof x === 'string' ? { id: null, name: { [lang]: x } } : { id: x.id || null, name: typeof x.name === 'string' ? { [lang]: x.name } : x.name });
  return Array.isArray(v) ? v.filter(Boolean).map(one) : one(v);
}
function normalizeFields(kind, fields, lang, step) {
  const def = formFor(step, kind);
  const out = {};
  for (const f of def.fields) {
    const v = fields?.[f.key];
    if (v === undefined) continue;
    if (f.columns && Array.isArray(v)) {
      out[f.key] = v.filter(r => r && typeof r === 'object').map(r => {
        const o = {};
        for (const c of f.columns) { const x = normCell(c.type, r[c.key], lang); if (x !== undefined) o[c.key] = x; }
        for (const k of Object.keys(r)) if (k.startsWith('_')) o[k] = r[k];
        // Interactions keep a readable item "Macro process 1 → Macro process 2".
        if (f.rule === 'interactions' && (o.from || o.to)) o.item = mpPair(o.from, o.to);
        return o;
      });
    } else if (f.type === 'obs') out[f.key] = normObs(v, lang);
    else out[f.key] = normCell(f.type, v, lang);
  }
  if ((kind === 'assess' || kind === 'needs') && Array.isArray(out.matrix)) out.score = matrixScore(out.matrix);
  return out;
}
const mpText = (v) => { const m = typeof v === 'string' ? catalog().mpById[v] : null; if (m) return Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, `${m.code} (${m.name[l] ?? m.name.en})`])); return v && typeof v === 'object' ? v : { en: String(v ?? '') }; };
function mpPair(a, b) { const x = mpText(a); const y = mpText(b); return Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, `${x[l] ?? x.en ?? ''} → ${y[l] ?? y.en ?? ''}`])); }

function phaseLocked(exec) {
  const ph = get('SELECT gate_decision FROM phases WHERE project_id=? AND e2e_id=?', exec.project_id, exec.e2e_id);
  return ph && ph.gate_decision === 'Go';
}

export function saveStep(req, exec, fields, complete) {
  const cat = catalog();
  if (exec.status === 'Done') throw conflict('STEP_DONE', 'Step is completed. Reopen it first.');
  if (phaseLocked(exec)) throw conflict('PHASE_LOCKED', 'The phase gate is decided; the step can no longer change.');
  const lang = req.lang || 'en';
  const step = cat.stepById[exec.step_id];
  const norm = normalizeFields(exec.form_kind, fields, lang, step);
  const merged = { ...(P(exec.fields) || {}), ...norm };
  const applied = cat.rules.filter(r => r.step === exec.step_id).map(r => ({ id: r.id, type: r.type, condition: r.condition, action: r.action }));
  if (complete) {
    const missing = validateFields(exec.form_kind, merged, step);
    if (missing.length) throw bad('FIELDS_REQUIRED', 'Complete the required fields.', { fields: missing });
    if (exec.form_kind === 'decision' && merged.decision === 'No-Go' && !merged.comment) throw bad('FIELDS_REQUIRED', 'A No-Go decision needs a comment.', { fields: ['comment'] });
  }
  const summary = summarize(exec.form_kind, merged, lang, step);
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
    if (complete) { applyCompletionEffects(req, exec, merged, lang); run('UPDATE step_exec SET fields=? WHERE id=?', J(merged), exec.id); }
    refreshProgress(exec.project_id);
    if (complete) {
      const ph = get('SELECT * FROM phases WHERE project_id=? AND e2e_id=?', exec.project_id, exec.e2e_id);
      if (ph && ph.status === 'AtGate') raise({ orgId: exec.org_id, projectId: exec.project_id, type: 'GATE_PENDING', title: { en: `Gate decision pending: ${cat.e2eById[ph.e2e_id].name.en}`, fr: `Décision de jalon en attente : ${cat.e2eById[ph.e2e_id].name.fr}`, ar: `قرار البوابة معلّق: ${cat.e2eById[ph.e2e_id].name.ar}` }, entityType: 'phase', entityId: ph.id, escalation: ['top_management'] });
    }
  });
  return { status, rulesApplied: applied };
}

// Completing a step writes the records it produces into the matching modules:
// plan and review decisions -> Action plan, SMART objectives -> objectives register,
// RACSI -> RACSI matrix, standards -> project, KPI rows -> KPI values (with off-target alerts).
function userOfRole(orgId, role) { return get('SELECT id FROM users WHERE org_id=? AND roles LIKE ? AND status=? LIMIT 1', orgId, `%"${role}"%`, 'Active')?.id || null; }
function applyCompletionEffects(req, exec, f, lang) {
  const cat = catalog();
  const def = formFor(cat.stepById[exec.step_id], exec.form_kind);
  const mp = cat.mpById[exec.mp_id];
  const today = now().slice(0, 10);
  const refs = Array.isArray(f.records) ? f.records : [];
  const addRef = (ref) => { if (!refs.some(x => x.type === ref.type && x.id === ref.id)) refs.push(ref); };
  for (const fd of def.fields) {
    const list = Array.isArray(f[fd.key]) ? f[fd.key] : null;
    if (!list) continue;
    if (fd.createsActions) {
      for (const row of list) {
        const title = row.activity || row.decision;
        if (!title || row._actionId) continue;
        const owner = row.owner && get('SELECT id FROM users WHERE id=? AND org_id=?', row.owner, exec.org_id) ? row.owner : (exec.assignee_user || req.user.id);
        let evaluator = userOfRole(exec.org_id, mp?.ownerRoleCode || 'ims_manager');
        if (!evaluator || evaluator === owner) evaluator = userOfRole(exec.org_id, 'ims_manager');
        if (!evaluator || evaluator === owner) evaluator = userOfRole(exec.org_id, 'quality_manager');
        if (evaluator === owner) evaluator = null;
        const id = uid();
        run('INSERT INTO actions(id,org_id,project_id,source_type,source_id,kind,title,owner_user,evaluator_user,status,start_date,due_date,pct,predecessors,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)',
          id, exec.org_id, exec.project_id, 'step', exec.id, fd.key === 'decisions' ? 'Review decision' : 'Planned', J(textVal(title, lang)), owner, evaluator, 'Open', row.start || today, row.due || addDays(today, 30), J([]), now());
        row._actionId = id;
        addRef({ type: 'action', id, title: textVal(title, lang) });
      }
    }
    if (fd.createsObjectives) {
      list.forEach((row) => {
        if (!row.objective || row._registerId) return;
        const n = get('SELECT COUNT(*) n FROM registers WHERE project_id=? AND register=?', exec.project_id, 'objectives').n;
        const id = uid();
        const kpi = row.kpi ? get('SELECT code FROM kpis WHERE id=? AND project_id=?', row.kpi, exec.project_id) : null;
        run('INSERT INTO registers(id,org_id,project_id,register,code,title,data,status,mp_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', id, exec.org_id, exec.project_id, 'objectives', `OBJ-${n + 1}`,
          J(textVal(row.objective, lang)), J({ kpi: kpi?.code || null, kpiId: row.kpi || null, baseline: row.baseline || null, target: row.target || null, deadline: row.deadline || null, ownerUser: row.owner || null, resources: row.resources || null, relevance: row.relevance || null, stepId: exec.step_id }), 'On track', exec.mp_id, now());
        row._registerId = id;
        addRef({ type: 'register', register: 'objectives', id, title: textVal(row.objective, lang) });
      });
    }
    if (fd.register) syncRegister(exec, fd, list, lang, addRef);
    if (fd.needs) syncNeeds(exec, list);
    if (fd.type === 'kpis') {
      const period = today.slice(0, 7);
      for (const row of list) {
        const k = row.kpi ? get('SELECT * FROM kpis WHERE id=? AND project_id=?', row.kpi, exec.project_id) : null;
        if (!k || row.value === null || row.value === undefined || row.value === '') continue;
        run('INSERT INTO kpi_values(kpi_id,org_id,period,value,comment) VALUES(?,?,?,?,?) ON CONFLICT(kpi_id,period) DO UPDATE SET value=excluded.value, comment=excluded.comment', k.id, exec.org_id, period, +row.value, J(textVal(row.why, lang)));
        if (k.target !== null && (k.direction === 'down' ? +row.value > k.target : +row.value < k.target)) {
          raise({ orgId: exec.org_id, projectId: exec.project_id, type: 'KPI_OFF_TARGET', title: { [lang]: `${P(k.name)?.[lang] || P(k.name)?.en} = ${row.value} (${k.target_text})` }, entityType: 'kpi', entityId: k.id, escalation: ['performance_manager', 'ims_manager'] });
        }
        addRef({ type: 'kpi', id: k.id, title: P(k.name) });
      }
    }
  }
  if (exec.form_kind === 'assign' && f.racsi && typeof f.racsi === 'object') {
    const letters = f.racsi;
    const a = (letters.A || []).filter(Boolean);
    if (a.length > 1) throw bad('ONE_ACCOUNTABLE', 'Only one role can be Accountable (A).');
    let act = get(`SELECT id FROM racsi_activities WHERE project_id=? AND mp_id=? AND linked_type='mp'`, exec.project_id, exec.mp_id);
    if (!act) { const aid = uid(); run('INSERT INTO racsi_activities(id,org_id,project_id,e2e_id,mp_id,linked_type,linked_id,name,created_at) VALUES(?,?,?,?,?,?,?,?,?)', aid, exec.org_id, exec.project_id, exec.e2e_id, exec.mp_id, 'mp', exec.mp_id, J(mp?.name), now()); act = { id: aid }; }
    run('DELETE FROM racsi_assignments WHERE activity_id=?', act.id);
    for (const L of ['R', 'A', 'C', 'S', 'I']) for (const code of [...new Set(letters[L] || [])].filter(Boolean)) run('INSERT INTO racsi_assignments(id,activity_id,org_id,letter,assignee) VALUES(?,?,?,?,?)', uid(), act.id, exec.org_id, L, code);
    addRef({ type: 'racsi', id: act.id, title: mp?.name });
  }
  if (exec.form_kind === 'standards' && Array.isArray(f.standards) && f.standards.length) {
    run('UPDATE projects SET standards=? WHERE id=?', J(f.standards), exec.project_id);
    run('UPDATE documents SET standards=? WHERE project_id=?', J(f.standards), exec.project_id);
  }
  if (refs.length && def.fields.some(x => x.key === 'records')) f.records = refs;
  else if (refs.length) f._links = refs;
}

// Rows of "identify issues / interested parties" steps become entries of the matching
// register, so registers and documents show what was typed in the step.
const LEVEL = { High: 5, Medium: 3, Low: 2 };
function syncRegister(exec, fd, list, lang, addRef) {
  const reg = fd.register;
  const prefix = reg === 'context' ? (fd.rule === 'internal' ? 'CI-I' : 'CI-E') : 'IP-';
  const existing = all('SELECT id, code, title FROM registers WHERE project_id=? AND register=?', exec.project_id, reg);
  const key = (t) => String((t && typeof t === 'object' ? t.en ?? t[lang] ?? Object.values(t)[0] : t) || '').trim().toLowerCase();
  let n = existing.filter(x => x.code.startsWith(prefix)).length;
  for (const row of list) {
    if (!row.item) continue;
    const title = row.item && typeof row.item === 'object' ? row.item : textVal(row.item, lang);
    const data = reg === 'context'
      ? { type: fd.rule === 'internal' ? 'Internal' : 'External', category: row.category || null, impact: LEVEL[row.priority] || 3, detail: row.detail || null, source: row.source || null, stepId: exec.step_id }
      : { needs: row.detail || null, category: row.category || null, influence: +row.influence || (row.priority === 'High' ? 4 : 3), interest: +row.interest || (row.priority === 'High' ? 4 : 3), source: row.source || null, stepId: exec.step_id };
    const found = row._registerId ? existing.find(x => x.id === row._registerId) : existing.find(x => key(P(x.title)) === key(title));
    if (found) { run('UPDATE registers SET title=?, data=? WHERE id=?', J(title), J(data), found.id); row._registerId = found.id; continue; }
    n += 1;
    const id = uid();
    const code = `${prefix}${n}`;
    run('INSERT INTO registers(id,org_id,project_id,register,code,title,data,status,mp_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', id, exec.org_id, exec.project_id, reg, code, J(title), J(data), 'Active', exec.mp_id, now());
    row._registerId = id;
    addRef({ type: 'register', register: reg, id, title });
  }
}
// Needs mapped to interested parties are added to each party's register entry.
function syncNeeds(exec, list) {
  const parties = all('SELECT id, title, data FROM registers WHERE project_id=? AND register=?', exec.project_id, 'parties');
  const norm = (t) => String((t && typeof t === 'object' ? t.en ?? Object.values(t)[0] : t) || '').trim().toLowerCase();
  for (const p of parties) {
    const pt = P(p.title);
    const mine = list.filter(r => (r.parties || []).some(x => [norm(x?.name), norm(x)].includes(norm(pt))));
    if (!mine.length) continue;
    const d = P(p.data) || {};
    d.needsList = mine.map(r => ({ need: r.need, type: r.type || null, obligation: r.obligation || null, response: r.response || null }));
    d.obligation = mine.some(r => r.obligation === 'Yes');
    run('UPDATE registers SET data=? WHERE id=?', J(d), p.id);
  }
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
function summarize(kind, f, lang, step) {
  const txt = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.en ?? Object.values(v).find(x => typeof x === 'string') ?? '') : Array.isArray(v) ? v.map(x => (x && typeof x === 'object' ? (x.name ? txt(x.name) : x[lang] ?? x.en ?? '') : x)).join('; ') : v ?? '');
  const def = formFor(step, kind);
  const rowsField = def.fields.find(x => x.columns && Array.isArray(f[x.key]) && f[x.key].length);
  let s;
  if (kind === 'needs') s = `${(f.needs || []).length} × ${(f.needs || []).slice(0, 2).map(r => txt(r.need)).join('; ')}${f.score ? ` — ${f.score}/5` : ''}`;
  else if (kind === 'assess') s = `${f.score ?? ''}/5 — ${txt(f.rationale)}`;
  else if (kind === 'decision') s = `${f.decision || ''} — ${txt(f.comment)}`;
  else if (rowsField) { const first = rowsField.columns[0].key; s = `${f[rowsField.key].length} × ${f[rowsField.key].slice(0, 3).map(r => txt(r[first])).join('; ')}`; }
  else s = String(Object.values(f).map(txt).find(x => x && String(x).length > 0) || '');
  return { [lang]: s.slice(0, 240) };
}

export { roleCodeOf, SME_TRACKS, CHECKLISTS };
