// Typed step execution (FR-DA-SFM-02 – 07), registers, record links and choice libraries (FR-DA-LNK-01 – 05).
import { all, one, run, tx } from '../db.js';
import { J, S, HttpError, now, uuid, pick } from '../lib/util.js';
import * as D from './design.js';
import * as cat from '../catalog.js';
import { describeStep, SINGLE } from './stepforms.js';

const loc = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) && ('en' in v || 'fr' in v || 'ar' in v) ? pick(v, lang) : v);
const locObj = (o, lang) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, loc(v, lang)]));
const normKey = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();

export function taskContext(orgId, taskId) {
  const t = one(`SELECT * FROM task_instances WHERE id=? AND org_id=?`, taskId, orgId); if (!t) throw new HttpError(404, 'err.notFound');
  const p = one(`SELECT id, design_release_id, vertical_id FROM projects WHERE id=?`, t.project_id);
  const rel = p?.design_release_id || null;
  const uft = D.get(orgId, 'uft', t.uft_id, { releaseId: rel }) || cat.get('uft', t.uft_id);
  const e = one(`SELECT phase, e2e_id FROM e2e_instances WHERE id=?`, t.e2e_instance_id);
  return { t, p, rel, uft, phase: e?.phase, e2e: e?.e2e_id };
}
/** A step is locked once the gate of its phase has been passed (FR-DA-SFM-06); reopening follows FR-DA-AUD-05. */
export function isLocked(projectId, phase) {
  return all(`SELECT data FROM records WHERE entity='PhaseChecklist' AND project_id=? AND json_extract(data,'$.phase')=?`, projectId, phase).some(x => J(x.data).decision === 'Go');
}
function stepDef(orgId, stepId, rel) {
  const s = D.get(orgId, 'step', stepId, { releaseId: rel }) || cat.get('step', stepId); if (!s) return null;
  const mp = D.get(orgId, 'mp', s.mp, { releaseId: rel }); const u = D.list(orgId, 'uft', { releaseId: rel }).find(x => (x.steps || []).includes(s.id));
  return { step: s, form: describeStep(s, { mpName: mp?.name, inputs: u?.input }) };
}
function recordOf(t, stepId, kind, create = false, userId = null) {
  let rec = one(`SELECT * FROM step_records WHERE task_instance_id=? AND step_id=?`, t.id, stepId);
  if (!rec && create) { const id = uuid(); run(`INSERT INTO step_records(id,org_id,project_id,task_instance_id,step_id,kind,fields,status,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, id, t.org_id, t.project_id, t.id, stepId, kind, '{}', 'Open', userId, now()); rec = one(`SELECT * FROM step_records WHERE id=?`, id); }
  return rec;
}
const rowsOf = recId => all(`SELECT r.*, u.name author FROM step_rows r LEFT JOIN users u ON u.id=r.created_by WHERE r.step_record_id=? ORDER BY r.sort, r.created_at`, recId);

/** Steps of a task with their typed form, values, rows, status and lock (FR-DA-SFM-01 – 03). */
export function taskSteps(req, taskId) {
  const { t, p, rel, uft, phase } = taskContext(req.orgId, taskId); const locked = isLocked(t.project_id, phase); const done = new Map(J(t.steps, []).map(s => [s.id, s]));
  return { task: { id: t.id, uft_id: t.uft_id, status: t.status, release: rel }, locked, steps: (uft?.steps || []).map(sid => {
    const d = stepDef(req.orgId, sid, rel); if (!d) return null; const rec = recordOf(t, sid, d.form.kind);
    const rows = rec ? rowsOf(rec.id).map(r => ({ id: r.id, ...locObj(J(r.data, {}), req.lang), _origin: r.origin, _author: r.author, _updated: r.updated_at })) : [];
    return { id: sid, name: d.step.name, type: d.step.type, role: d.step.role, form: d.form, record: rec ? { id: rec.id, status: rec.status, fields: locObj(J(rec.fields, {}), req.lang), completed_at: rec.completed_at } : null, rows,
      done: rec?.status === 'Completed' || !!done.get(sid)?.done, count: rows.length };
  }).filter(Boolean), project: { id: p.id } };
}
function guard(req, taskId, stepId) {
  const ctx = taskContext(req.orgId, taskId);
  if (!(ctx.uft?.steps || []).includes(stepId)) throw new HttpError(404, 'err.notFound');
  if (isLocked(ctx.t.project_id, ctx.phase)) throw new HttpError(409, 'err.stepLocked');
  const d = stepDef(req.orgId, stepId, ctx.rel); return { ...ctx, d };
}
function validateValues(fields, data, { partial = true } = {}) {
  const errors = {};
  for (const f of fields) {
    const v = data[f.key]; const empty = v == null || String(v).trim() === '';
    if (!partial && f.required && empty) errors[f.key] = 'required';
    if (empty) continue;
    if (f.type === 'number' && Number.isNaN(Number(v))) errors[f.key] = 'number';
    if (f.type === 'number' && f.min != null && Number(v) < f.min) errors[f.key] = 'min';
    if (f.type === 'number' && f.max != null && Number(v) > f.max) errors[f.key] = 'max';
    if (f.type === 'date' && Number.isNaN(Date.parse(v))) errors[f.key] = 'date';
    if (f.type === 'select' && !f.custom && f.options && !f.options.some(o => String(o.value) === String(v))) errors[f.key] = 'notInList';
    if (typeof v === 'string' && v.length > 4000) errors[f.key] = 'tooLong';
  }
  if (data.start && data.end && fields.some(f => f.validate === 'afterStart') && Date.parse(data.end) < Date.parse(data.start)) errors.end = 'afterStart';
  return errors;
}
const sanitize = (fields, data) => Object.fromEntries(fields.filter(f => data[f.key] !== undefined).map(f => [f.key, data[f.key] == null ? '' : typeof data[f.key] === 'object' ? data[f.key] : String(data[f.key]).slice(0, 4000)]));

/** Values of a single-record step (decision, review). */
export function saveFields(req, taskId, stepId, data) {
  const { t, d } = guard(req, taskId, stepId); if (!SINGLE.has(d.form.kind)) throw new HttpError(422, 'err.wrongPattern');
  const errs = validateValues(d.form.fields, data); if (Object.keys(errs).length) throw new HttpError(422, 'err.invalidFields', { fields: Object.keys(errs).join(', '), errors: errs });
  const rec = recordOf(t, stepId, d.form.kind, true, req.user.id);
  const fields = { ...J(rec.fields, {}), ...sanitize(d.form.fields, data) };
  run(`UPDATE step_records SET fields=?, updated_by=?, updated_at=? WHERE id=?`, S(fields), req.user.id, now(), rec.id);
  return { id: rec.id, fields: locObj(fields, req.lang), status: rec.status };
}
/** One row of a multi-record step, saved on its own (FR-DA-MRE-09). */
export function saveRow(req, taskId, stepId, rowId, data, origin = 'manual') {
  const { t, d } = guard(req, taskId, stepId); if (SINGLE.has(d.form.kind) || d.form.kind === 'system') throw new HttpError(422, 'err.wrongPattern');
  const errs = validateValues(d.form.fields, data); if (Object.keys(errs).length) throw new HttpError(422, 'err.invalidFields', { fields: Object.keys(errs).join(', '), errors: errs });
  const rec = recordOf(t, stepId, d.form.kind, true, req.user.id); const tm = now(); const clean = sanitize(d.form.fields, data);
  if (rowId) {
    const row = one(`SELECT * FROM step_rows WHERE id=? AND step_record_id=?`, rowId, rec.id); if (!row) throw new HttpError(404, 'err.notFound');
    const merged = { ...J(row.data, {}), ...clean };
    run(`UPDATE step_rows SET data=?, updated_by=?, updated_at=? WHERE id=?`, S(merged), req.user.id, tm, rowId);
    return { id: rowId, ...locObj(merged, req.lang) };
  }
  const id = uuid(); const sort = (one(`SELECT MAX(sort) m FROM step_rows WHERE step_record_id=?`, rec.id)?.m ?? -1) + 1;
  run(`INSERT INTO step_rows(id,step_record_id,org_id,project_id,step_id,sort,data,origin,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, id, rec.id, t.org_id, t.project_id, stepId, sort, S(clean), ['manual', 'library', 'ai'].includes(origin) ? origin : 'manual', req.user.id, tm, req.user.id, tm);
  return { id, ...locObj(clean, req.lang), _origin: origin };
}
export function deleteRow(req, taskId, stepId, rowId) {
  const { t } = guard(req, taskId, stepId); const rec = recordOf(t, stepId); if (!rec) throw new HttpError(404, 'err.notFound');
  run(`DELETE FROM step_rows WHERE id=? AND step_record_id=?`, rowId, rec.id); run(`DELETE FROM record_links WHERE org_id=? AND ((from_type='row' AND from_id=?) OR (to_type='row' AND to_id=?))`, req.orgId, rowId, rowId); return { ok: true };
}
/** Completion: mandatory fields checked and named, rows propagated to their register (FR-DA-SFM-04, -06, FR-DA-LNK-04). */
export function completeStep(req, taskId, stepId) {
  const { t, d } = guard(req, taskId, stepId); const kind = d.form.kind; const rec = recordOf(t, stepId, kind, true, req.user.id);
  const label = f => pick(f.label, req.lang);
  if (kind !== 'system') {
    if (SINGLE.has(kind)) { const missing = d.form.fields.filter(f => f.required && !String(J(rec.fields, {})[f.key] ?? '').trim()); if (missing.length) throw new HttpError(422, 'err.missingFields', { fields: missing.map(label).join(', ') }); }
    else {
      const rows = rowsOf(rec.id).map(r => J(r.data, {})); if (!rows.length) throw new HttpError(422, 'err.noRows');
      const missing = new Set(); rows.forEach(r => d.form.fields.forEach(f => { if (f.required && !String(loc(r[f.key], 'en') ?? '').trim()) missing.add(label(f)); })); if (missing.size) throw new HttpError(422, 'err.missingFields', { fields: [...missing].join(', ') });
    }
  }
  let propagated = 0;
  tx(() => {
    run(`UPDATE step_records SET status='Completed', completed_by=?, completed_at=?, updated_at=? WHERE id=?`, req.user.id, now(), now(), rec.id);
    const steps = J(t.steps, []).map(s => (s.id === stepId ? { ...s, done: true, doneBy: req.user.id } : s));
    run(`UPDATE task_instances SET steps=?, status=CASE WHEN status='Not started' THEN 'In progress' ELSE status END, started_at=coalesce(started_at, ?), updated_at=? WHERE id=?`, S(steps), now(), now(), t.id);
    propagated = propagate(req, t, stepId, d, rec);
  });
  return { ok: true, propagated };
}
export function reopenStep(req, taskId, stepId, justification) {
  const { t } = guard(req, taskId, stepId); if (!String(justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
  run(`UPDATE step_records SET status='Open', updated_at=? WHERE task_instance_id=? AND step_id=?`, now(), t.id, stepId);
  run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,justification,created_at) VALUES(?,?,?,?,?,?,?,?)`, uuid(), req.orgId, req.user.id, 'StepRecord', t.id + '|' + stepId, 'reopen', justification, now());
  return { ok: true };
}
/** Register Propagation: each row creates or updates the register entry matched by its identifier or its name. */
export function propagate(req, t, stepId, d, rec) {
  const reg = d.form.register; if (!reg) return 0; const tm = now(); let n = 0;
  const items = SINGLE.has(d.form.kind) ? [{ id: rec.id, data: J(rec.fields, {}) }] : rowsOf(rec.id).map(r => ({ id: r.id, data: J(r.data, {}) }));
  for (const it of items) {
    const name = loc(it.data.item ?? it.data.subject ?? it.data.session ?? it.data.indicator ?? it.data.setting ?? it.data.scope ?? it.data.role, 'en');
    const key = normKey(it.data.code || name || it.id);
    const ex = one(`SELECT id, version FROM register_entries WHERE org_id=? AND project_id=? AND register=? AND item_key=?`, t.org_id, t.project_id, reg.key, key);
    if (ex) run(`UPDATE register_entries SET data=?, source_row_id=?, source_task_id=?, source_step_id=?, version=version+1, updated_at=? WHERE id=?`, S(it.data), it.id, t.id, stepId, tm, ex.id);
    else run(`INSERT INTO register_entries(id,org_id,project_id,register,register_name,item_key,data,source_row_id,source_task_id,source_step_id,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)`, uuid(), t.org_id, t.project_id, reg.key, S(reg.name), key, S(it.data), it.id, t.id, stepId, tm, tm);
    n++;
    // Indicator rows become KPI values of the period (FR-DA-SFM-04, -05).
    if (d.form.kind === 'monitoring') { const ind = loc(it.data.indicator, 'en'); const k = cat.list('kpi').find(x => x.id === ind || pick(x.name, 'en') === ind);
      if (k && it.data.value !== '' && it.data.value != null) run(`INSERT INTO kpi_values(id,org_id,project_id,kpi_id,period,value,target,direction,status) VALUES(?,?,?,?,?,?,?,?,?)`, uuid(), t.org_id, t.project_id, k.id, String(loc(it.data.period, 'en') || tm.slice(0, 7)), Number(it.data.value), Number(it.data.target) || k.targetValue || null, k.direction, it.data.status || null); }
  }
  return n;
}

/** Readiness Checklist shown before a macro process starts (FR-DA-SFM-07). */
export function readiness(orgId, e2eInstanceId, lang) {
  const e = one(`SELECT * FROM e2e_instances WHERE id=? AND org_id=?`, e2eInstanceId, orgId); if (!e) throw new HttpError(404, 'err.notFound');
  const p = one(`SELECT design_release_id FROM projects WHERE id=?`, e.project_id); const rel = p?.design_release_id || null;
  const def = D.get(orgId, 'e2e', e.e2e_id, { releaseId: rel }) || cat.get('e2e', e.e2e_id);
  const preds = D.list(orgId, 'e2e', { releaseId: rel }).filter(x => String(x.feedsInto || '').includes(e.e2e_id));
  const predInst = preds.map(x => one(`SELECT e2e_id, status FROM e2e_instances WHERE project_id=? AND e2e_id=?`, e.project_id, x.id)).filter(Boolean);
  const tasks = all(`SELECT uft_id, owner_id FROM task_instances WHERE e2e_instance_id=?`, e.id);
  const ufts = (def?.ufts || []).map(id => D.get(orgId, 'uft', id, { releaseId: rel })).filter(Boolean);
  const kpis = cat.list('kpi').filter(k => (def?.mps || []).includes(k.mp));
  const tpl = all(`SELECT id FROM records WHERE entity='DocumentTemplate' AND (org_id=? OR org_id IS NULL) AND data LIKE ?`, orgId, `%"${e.e2e_id}"%`).length;
  const items = [
    { code: 'inputs', ok: predInst.every(x => x.status === 'Completed'), detail: predInst.filter(x => x.status !== 'Completed').map(x => x.e2e_id).join(', ') },
    { code: 'owner', ok: !!e.owner_id && tasks.every(x => x.owner_id), detail: String(tasks.filter(x => !x.owner_id).length) },
    { code: 'racsi', ok: ufts.every(u => u.racsi?.A || u.racsi?.R), detail: ufts.filter(u => !u.racsi?.A).map(u => u.id).join(', ') },
    { code: 'templates', ok: tpl > 0, detail: String(tpl) },
    { code: 'kpis', ok: kpis.length > 0, detail: kpis.map(k => k.id).slice(0, 6).join(', ') },
  ];
  return { e2e: e.e2e_id, ready: items.every(i => i.ok), items };
}

/* ------------------------------------------------------------------------------------- registers */
export function registers(orgId, projectId) {
  return all(`SELECT register, register_name, COUNT(*) n, MAX(updated_at) updated FROM register_entries WHERE org_id=? ${projectId ? 'AND project_id=?' : ''} GROUP BY register ORDER BY register`, orgId, ...(projectId ? [projectId] : [])).map(r => ({ key: r.register, name: J(r.register_name, r.register_name), count: r.n, updated: r.updated }));
}
export function registerEntries(orgId, key, projectId, lang) {
  return all(`SELECT e.*, p.name project_name FROM register_entries e LEFT JOIN projects p ON p.id=e.project_id WHERE e.org_id=? AND e.register=? ${projectId ? 'AND e.project_id=?' : ''} ORDER BY e.updated_at DESC LIMIT 2000`, orgId, key, ...(projectId ? [projectId] : []))
    .map(e => ({ id: e.id, project_id: e.project_id, project: pick(J(e.project_name, e.project_name), lang), version: e.version, updated_at: e.updated_at, source_task_id: e.source_task_id, source_step_id: e.source_step_id, ...locObj(J(e.data, {}), lang),
      links: one(`SELECT COUNT(*) n FROM record_links WHERE org_id=? AND ((from_type='register' AND from_id=?) OR (to_type='register' AND to_id=?))`, orgId, e.id, e.id).n }));
}
/* ----------------------------------------------------------------------------------------- links */
export function links(orgId, type, id) {
  return all(`SELECT * FROM record_links WHERE org_id=? AND ((from_type=? AND from_id=?) OR (to_type=? AND to_id=?)) ORDER BY created_at`, orgId, type, id, type, id).map(l => {
    const other = l.from_type === type && l.from_id === id ? { type: l.to_type, id: l.to_id } : { type: l.from_type, id: l.from_id };
    return { id: l.id, label: l.label, other, title: titleOf(orgId, other.type, other.id) };
  });
}
export function titleOf(orgId, type, id) {
  if (type === 'register') { const e = one(`SELECT data, register_name FROM register_entries WHERE id=? AND org_id=?`, id, orgId); const d = J(e?.data, {}); return { item: d.item ?? d.subject ?? d.indicator ?? d.session ?? '—', register: J(e?.register_name, null) }; }
  if (type === 'row') { const r = one(`SELECT data FROM step_rows WHERE id=? AND org_id=?`, id, orgId); const d = J(r?.data, {}); return { item: d.item ?? d.indicator ?? d.session ?? '—' }; }
  const rec = one(`SELECT ref, data, entity FROM records WHERE id=? AND org_id=?`, id, orgId); const d = J(rec?.data, {}); return { item: d.name ?? d.title ?? d.code ?? rec?.ref ?? id, entity: rec?.entity };
}
export function addLink(req, b) {
  const ok = t => ['register', 'row', 'record', 'stakeholder', 'risk', 'process'].includes(t);
  if (!ok(b.from_type) || !ok(b.to_type) || !b.from_id || !b.to_id) throw new HttpError(422, 'err.invalidLink');
  if (b.from_type === b.to_type && b.from_id === b.to_id) throw new HttpError(422, 'err.invalidLink');
  const dup = one(`SELECT id FROM record_links WHERE org_id=? AND from_type=? AND from_id=? AND to_type=? AND to_id=?`, req.orgId, b.from_type, b.from_id, b.to_type, b.to_id); if (dup) return { id: dup.id };
  const id = uuid(); run(`INSERT INTO record_links(id,org_id,from_type,from_id,to_type,to_id,label,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)`, id, req.orgId, b.from_type, b.from_id, b.to_type, b.to_id, b.label || null, req.user.id, now()); return { id };
}
/** Choice Library: values entered before in the Organization in any project, with the reference list (FR-DA-LNK-03). */
export function choices(orgId, field, lang, q = '') {
  const prior = all(`SELECT DISTINCT json_extract(data, '$.' || ?) v FROM step_rows WHERE org_id=? AND json_extract(data, '$.' || ?) IS NOT NULL LIMIT 500`, field, orgId, field).map(r => loc(J(r.v, r.v), lang)).filter(v => typeof v === 'string' && v.trim());
  const ref = all(`SELECT data FROM records WHERE entity='ChoiceList' AND (org_id=? OR org_id IS NULL) AND json_extract(data,'$.field')=?`, orgId, field).flatMap(r => (J(r.data, {}).values || []).map(v => loc(v, lang)));
  const s = String(q).toLowerCase(); const uniq = [...new Set([...ref, ...prior])].filter(v => !s || v.toLowerCase().includes(s)).slice(0, 200);
  return uniq.map(v => ({ value: v, source: ref.includes(v) ? 'library' : 'prior' }));
}
/** AI-proposed rows for a record step, built from the records already captured (FR-DA-AIP-13, -16): never an echo of the input. */
export function suggestRows(req, taskId, stepId) {
  const { t, d } = guard(req, taskId, stepId); const lang = req.lang; const f = d.form;
  const themes = all(`SELECT data FROM records WHERE entity IN ('TrainingTheme','TrainingNeed','SkillGap','StrategicObjective') AND project_id=? LIMIT 40`, t.project_id).map(x => J(x.data, {}));
  const regs = all(`SELECT data FROM register_entries WHERE project_id=? ORDER BY updated_at DESC LIMIT 40`, t.project_id).map(x => J(x.data, {}));
  const names = [...new Set([...themes.map(x => loc(x.name || x.theme || x.statement || x.title, lang)), ...regs.map(x => loc(x.item, lang))].filter(v => typeof v === 'string' && v.length > 3))].slice(0, 5);
  const users = all(`SELECT name FROM users WHERE org_id=? AND active=1 LIMIT 8`, req.orgId).map(u => u.name);
  const rows = names.slice(0, 3).map((n, i) => { const r = {}; for (const fd of f.fields) {
    if (fd.key === 'item' || fd.key === 'session' || fd.key === 'setting') r[fd.key] = n;
    else if (fd.type === 'select' && fd.options?.length) r[fd.key] = String(fd.options[i % fd.options.length].value);
    else if (fd.type === 'person') r[fd.key] = users[i % Math.max(1, users.length)] || '';
    else if (fd.type === 'date') r[fd.key] = new Date(Date.now() + (i + 1) * 14 * 86400000).toISOString().slice(0, 10);
    else if (fd.type === 'number') r[fd.key] = fd.key === 'weight' ? '30' : fd.key === 'allocation' ? '50' : '10';
    else if (fd.key === 'source') r[fd.key] = lang === 'fr' ? 'Registre du projet' : lang === 'ar' ? 'سجل المشروع' : 'Project register';
    else if (fd.key === 'description' || fd.key === 'facts' || fd.key === 'reason') r[fd.key] = lang === 'fr' ? `Proposé à partir de « ${n} » déjà saisi dans le projet.` : lang === 'ar' ? `مقترح انطلاقاً من «${n}» المسجل في المشروع.` : `Proposed from “${n}”, already recorded in this project.`;
  } return r; });
  run(`INSERT INTO ai_usage_log(id,org_id,project_id,use_case_id,record_ref,user_id,outcome,source,confidence,question,created_at,engine) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, uuid(), req.orgId, t.project_id, null, 'Step:' + stepId, req.user.id, 'Proposed', 'built-in', 0.6, stepId, now(), 'built-in');
  return { rows, engine: 'built-in', reason: rows.length ? null : 'noContext' };
}
