// Typed step execution (FR-DA-SFM-02 – 07), registers, record links and choice libraries (FR-DA-LNK-01 – 05).
import { all, one, run, tx } from '../db.js';
import { J, S, HttpError, now, uuid, pick } from '../lib/util.js';
import * as D from './design.js';
import { orgCurrencies } from './money.js';
import * as cat from '../catalog.js';
import { describeStep, SINGLE } from './stepforms.js';
import * as AI from './ai.js';
import { getSpec, liveConfig, assemble, variables } from './prompts.js';
import { retrieve } from './retrieval.js';
import * as QS from './qsteps.js';

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
function stepDef(orgId, stepId, rel, ctx = {}) {
  const s = D.get(orgId, 'step', stepId, { releaseId: rel }) || cat.get('step', stepId); if (!s) return null;
  const mp = D.get(orgId, 'mp', s.mp, { releaseId: rel }); const u = D.list(orgId, 'uft', { releaseId: rel }).find(x => (x.steps || []).includes(s.id));
  const form = describeStep(s, { mpName: mp?.name, inputs: u?.input });
  // Lists named by a field (organizations, sectors, templates, sections, sites) and placeholder defaults are resolved here.
  if (form.fields?.some(f => f.source || typeof f.default === 'string')) form.fields = QS.resolveSources(orgId, form.fields, ctx);
  // Every amount carries its currency (SRS 1.8 FR-DA-I18N-09): a Currency column follows the first amount column.
  const mi = (form.fields || []).findIndex(f => f.type === 'number' && /(^|_)(budget|amount|cost|price|fee)(_|$)/.test(f.key));
  if (mi >= 0 && !form.fields.some(f => f.key === 'currency')) {
    const c = orgCurrencies(orgId);
    form.fields = [...form.fields.slice(0, mi + 1), { key: 'currency', type: 'select', label: { en: 'Currency', fr: 'Devise', ar: 'العملة' }, help: { en: 'Currency of the amount; the organization’s default when left empty.', fr: 'Devise du montant ; celle de l’organisation si elle est laissée vide.', ar: 'عملة المبلغ؛ عملة المؤسسة إذا تُركت فارغة.' }, options: c.enabled.map(x => ({ value: x, label: x })), default: c.default, width: 90 }, ...form.fields.slice(mi + 1)];
  }
  return { step: s, form };
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
  const ucs = AI.useCases(req.orgId); const ucOut = u => ({ id: u.id, code: u.code, name: u.name, tier: u.tier, checkpoint: u.checkpoint || null, effective: AI.effectiveActive(req.orgId, t.project_id, u.id) });
  return { task: { id: t.id, uft_id: t.uft_id, status: t.status, release: rel }, locked, steps: (uft?.steps || []).map(sid => {
    const d = stepDef(req.orgId, sid, rel, { projectId: t.project_id, lang: req.lang, user: req.user }); if (!d) return null; const rec = recordOf(t, sid, d.form.kind);
    const rows = rec ? rowsOf(rec.id).map(r => ({ id: r.id, ...locObj(J(r.data, {}), req.lang), _origin: r.origin, _author: r.author, _updated: r.updated_at })) : [];
    return { id: sid, name: d.step.name, type: d.step.type, role: d.step.role, form: d.form, record: rec ? { id: rec.id, status: rec.status, fields: locObj(J(rec.fields, {}), req.lang), completed_at: rec.completed_at } : null, rows,
      done: rec?.status === 'Completed' || !!done.get(sid)?.done, count: rows.length,
      // The AI Use Cases linked to the step, with their tier and effective state (FR-DA-AI-12, FR-DA-AIP-01).
      aiUseCases: ucs.filter(u => u.steps.includes(sid)).map(ucOut) };
  }).filter(Boolean), project: { id: p.id }, questionnaire: (uft?.steps || []).some(s => /^MP-54\./.test(s)) ? QS.questionnaireFor(req.orgId, t.project_id)?.id || null : undefined };
}
/**
 * The task output drafted from what was typed in its steps: one line per single-form value, one line per table row,
 * with list values shown by their labels. The user edits it before completing the task (FR-DA-SFM-03).
 */
export function taskSummary(req, taskId) {
  const { steps } = taskSteps(req, taskId); const lang = req.lang || 'en'; const lines = [];
  const show = (f, v) => {
    if (v == null || v === '' || (typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(Boolean))) return '';
    if (f.type === 'boolean') return v === true || v === 'true' ? pick(f.label, lang) : '';
    const lbl = x => pick((f.options || []).find(o => String(o.value) === String(x))?.label, lang) || String(x);
    if (f.type === 'multi') return String(v).split(/\s*[,;|]\s*/).filter(Boolean).map(lbl).join(', ');
    if (f.type === 'date' && /^\d{4}-\d{2}-\d{2}/.test(String(v))) { const [y, m, d] = String(v).slice(0, 10).split('-'); return lang === 'en' ? `${d}/${m}/${y}` : `${d}/${m}/${y}`; }
    return f.options ? lbl(v) : String(typeof v === 'object' ? pick(v, lang) : v);
  };
  for (const s of steps) {
    const fields = s.form.fields || []; if (s.form.kind === 'system' || s.form.kind === 'module') continue;
    if (SINGLE.has(s.form.kind)) {
      const vals = fields.map(f => [pick(f.label, lang), show(f, s.record?.fields?.[f.key])]).filter(([, v]) => v);
      if (vals.length) lines.push(`${pick(s.name, lang)} — ${vals.map(([k, v]) => `${k} : ${v}`).join(' ; ')}`);
    } else if (s.rows.length) {
      lines.push(`${pick(s.name, lang)} (${s.rows.length}) :`);
      for (const r of s.rows.slice(0, 30)) { const vals = fields.map(f => show(f, r[f.key])).filter(Boolean).slice(0, 5); if (vals.length) lines.push(`• ${vals.join(' · ')}`); }
    }
  }
  return lines.join('\n');
}
function guard(req, taskId, stepId) {
  const ctx = taskContext(req.orgId, taskId);
  if (!(ctx.uft?.steps || []).includes(stepId)) throw new HttpError(404, 'err.notFound');
  if (isLocked(ctx.t.project_id, ctx.phase)) throw new HttpError(409, 'err.stepLocked');
  const d = stepDef(req.orgId, stepId, ctx.rel, { projectId: ctx.t.project_id, lang: req.lang, user: req.user }); return { ...ctx, d };
}
export function validateValues(fields, data, { partial = true } = {}) {
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
    if (f.type === 'multi' && !f.custom && f.options && String(v).split(/\s*[,;|]\s*/).filter(Boolean).some(x => !f.options.some(o => String(o.value) === x))) errors[f.key] = 'notInList';
    if (typeof v === 'string' && v.length > 4000) errors[f.key] = 'tooLong';
  }
  if (data.start && data.end && fields.some(f => f.validate === 'afterStart') && Date.parse(data.end) < Date.parse(data.start)) errors.end = 'afterStart';
  return errors;
}
const sanitize = (fields, data) => Object.fromEntries(fields.filter(f => data[f.key] !== undefined).map(f => { const v = data[f.key]; return [f.key, v == null ? '' : f.type === 'boolean' ? v === true || v === 'true' || v === 1 || v === '1' : typeof v === 'object' ? v : String(v).slice(0, 4000)]; }));

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
export function saveRow(req, taskId, stepId, rowId, data, origin = 'manual', { expected = null } = {}) {
  const { t, d } = guard(req, taskId, stepId); if (SINGLE.has(d.form.kind) || d.form.kind === 'system' || d.form.kind === 'module') throw new HttpError(422, 'err.wrongPattern');
  const out = saveRowIn(req, t, d, stepId, rowId, data, origin, { expected });
  if (d.form.stakeholders) QS.syncStakeholders(req, t, recordOf(t, stepId).id);
  return out;
}
function saveRowIn(req, t, d, stepId, rowId, data, origin, { expected }) {
  const errs = validateValues(d.form.fields, data); if (Object.keys(errs).length) throw new HttpError(422, 'err.invalidFields', { fields: Object.keys(errs).join(', '), errors: errs });
  const rec = recordOf(t, stepId, d.form.kind, true, req.user.id); const tm = now(); const clean = sanitize(d.form.fields, data);
  // A function of the Organization is kept with its names in every language, so the row reads the same in EN, FR and AR.
  for (const f of d.form.fields.filter(x => x.type === 'function' && typeof clean[x.key] === 'string' && clean[x.key].trim())) {
    const v = clean[f.key].trim(); const hit = all(`SELECT name FROM obs_nodes WHERE org_id=? AND type='Function'`, req.orgId).map(x => J(x.name, x.name)).find(n => (typeof n === 'object' ? Object.values(n) : [n]).some(x => String(x).trim().toLowerCase() === v.toLowerCase()));
    if (hit) clean[f.key] = hit;
  }
  if (rowId) {
    const row = one(`SELECT * FROM step_rows WHERE id=? AND step_record_id=?`, rowId, rec.id); if (!row) throw new HttpError(404, 'err.notFound');
    // Optimistic concurrency: the row the user edited must still be the one stored, else a conflict is reported.
    if (expected && row.updated_at && String(expected) !== String(row.updated_at)) throw new HttpError(409, 'err.rowConflict', { by: one(`SELECT name FROM users WHERE id=?`, row.updated_by)?.name || '—' });
    const prev = J(row.data, {});
    // An unchanged multilingual value comes back in the user's language: the stored translations are kept.
    for (const [k, v] of Object.entries(clean)) if (typeof v === 'string' && prev[k] && typeof prev[k] === 'object' && !Array.isArray(prev[k]) && loc(prev[k], req.lang) === v) clean[k] = prev[k];
    const merged = { ...prev, ...clean };
    run(`UPDATE step_rows SET data=?, updated_by=?, updated_at=? WHERE id=?`, S(merged), req.user.id, tm, rowId);
    return { id: rowId, ...locObj(merged, req.lang), _updated: tm };
  }
  const id = uuid(); const sort = (one(`SELECT MAX(sort) m FROM step_rows WHERE step_record_id=?`, rec.id)?.m ?? -1) + 1;
  run(`INSERT INTO step_rows(id,step_record_id,org_id,project_id,step_id,sort,data,origin,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, id, rec.id, t.org_id, t.project_id, stepId, sort, S(clean), ['manual', 'library', 'ai'].includes(origin) ? origin : 'manual', req.user.id, tm, req.user.id, tm);
  return { id, ...locObj(clean, req.lang), _origin: origin, _updated: tm };
}
export function deleteRow(req, taskId, stepId, rowId) {
  const { t } = guard(req, taskId, stepId); const rec = recordOf(t, stepId); if (!rec) throw new HttpError(404, 'err.notFound');
  run(`DELETE FROM step_rows WHERE id=? AND step_record_id=?`, rowId, rec.id); run(`DELETE FROM record_links WHERE org_id=? AND ((from_type='row' AND from_id=?) OR (to_type='row' AND to_id=?))`, req.orgId, rowId, rowId);
  const d = stepDef(req.orgId, stepId, null); if (d?.form.stakeholders) QS.syncStakeholders(req, t, rec.id);
  return { ok: true };
}
/** Completion: mandatory fields checked and named, rows propagated to their register (FR-DA-SFM-04, -06, FR-DA-LNK-04). */
export function completeStep(req, taskId, stepId) {
  const { t, d } = guard(req, taskId, stepId); const kind = d.form.kind; const rec = recordOf(t, stepId, kind, true, req.user.id);
  const label = f => pick(f.label, req.lang);
  if (kind === 'module') { const why = QS.moduleBlocker(req, t, d.form.module, d.form); if (why) throw new HttpError(422, why); }
  else if (kind !== 'system') {
    if (SINGLE.has(kind)) {
      // A default shown in the form (today, the user, the object of the step, the sector...) counts as typed.
      const filled = QS.withDefaults(d.form.fields, J(rec.fields, {}), req.lang, d.form.object);
      if (S(filled) !== rec.fields) { run(`UPDATE step_records SET fields=?, updated_at=? WHERE id=?`, S(filled), now(), rec.id); rec.fields = S(filled); }
      const missing = d.form.fields.filter(f => f.required && !String(filled[f.key] ?? '').trim()); if (missing.length) throw new HttpError(422, 'err.missingFields', { fields: missing.map(label).join(', ') });
    }
    else {
      const rows = rowsOf(rec.id).map(r => J(r.data, {})); if (!rows.length) throw new HttpError(422, 'err.noRows');
      const missing = new Set(); rows.forEach(r => d.form.fields.forEach(f => { if (f.required && !String(loc(r[f.key], 'en') ?? '').trim()) missing.add(label(f)); })); if (missing.size) throw new HttpError(422, 'err.missingFields', { fields: [...missing].join(', ') });
      // The RACSI and the channels are written into the project questionnaire (they are checked there first).
      if (d.form.questionnaire === 'racsi') QS.applyRacsi(req, t, rows);
      if (d.form.questionnaire === 'channels') QS.applyChannels(req, t, rows);
      if (d.form.stakeholders) QS.syncStakeholders(req, t, rec.id);
    }
    if (d.form.questionnaire === 'create') { const qid = QS.createQuestionnaire(req, t, J(rec.fields, {})); const fl = { ...J(rec.fields, {}), questionnaire_id: qid }; run(`UPDATE step_records SET fields=? WHERE id=?`, S(fl), rec.id); rec.fields = S(fl); }
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
  // The task's own step checklist is reopened too, else the step would still read as done.
  const steps = J(t.steps, []); if (steps.some(s => s.id === stepId && s.done)) run(`UPDATE task_instances SET steps=?, updated_at=? WHERE id=?`, S(steps.map(s => (s.id === stepId ? { ...s, done: false } : s))), now(), t.id);
  run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,justification,created_at) VALUES(?,?,?,?,?,?,?,?)`, uuid(), req.orgId, req.user.id, 'StepRecord', t.id + '|' + stepId, 'reopen', justification, now());
  return { ok: true };
}
/** Register Propagation: each row creates or updates the register entry matched by its identifier or its name. */
export function propagate(req, t, stepId, d, rec) {
  const reg = d.form.register; if (!reg) return 0; const tm = now(); let n = 0;
  const items = SINGLE.has(d.form.kind) ? [{ id: rec.id, data: J(rec.fields, {}) }] : rowsOf(rec.id).map(r => ({ id: r.id, data: J(r.data, {}) }));
  for (const it of items) {
    const name = loc(it.data.item ?? it.data.subject ?? it.data.session ?? it.data.indicator ?? it.data.setting ?? it.data.scope ?? it.data.role ?? (SINGLE.has(d.form.kind) ? d.form.object : null), 'en');
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
function builtInRows(req, t, stepId, d) {
  const lang = req.lang; const f = d.form;
  if (f.kind === 'levels') { // One row per OBS function not yet in the matrix; levels proposed from the function's place in the OBS.
    const rec = one(`SELECT id FROM step_records WHERE task_instance_id=? AND step_id=?`, t.id, stepId);
    const have = new Set((rec ? rowsOf(rec.id) : []).map(r => loc(J(r.data, {}).function, lang)));
    const fns = all(`SELECT name, parent_id FROM obs_nodes WHERE org_id=? AND type='Function' ORDER BY name LIMIT 60`, req.orgId).map(x => ({ name: loc(J(x.name, x.name), lang), top: !x.parent_id })).filter(x => x.name && !have.has(x.name));
    const rows = fns.slice(0, 8).map(x => ({ function: x.name, ms: x.top, mo: true, op: !x.top, note: lang === 'fr' ? 'Proposé à partir de l’OBS' : lang === 'ar' ? 'مقترح انطلاقاً من الهيكل التنظيمي' : 'Proposed from the OBS' }));
    return { rows, reason: rows.length ? null : 'allCovered' };
  }
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
  return { rows, reason: rows.length ? null : 'noContext' };
}

/**
 * AI-proposed rows for a step, through the AI Use Case linked to it — the single governed path (NFR-DA-MAINT-04):
 * refused when no use case serves the step or when it is deactivated (FR-DA-AI-05, FR-DA-AIP-01); grounded in
 * retrieved references disclosed with the answer (FR-DA-AI-11); the live model is used when the Organization has one,
 * with a fallback to the built-in engine and the reason shown (FR-DA-AI-09, FR-DA-AIP-12); every run is logged with the
 * use case, specification version, engine and model (FR-DA-AIP-10). The rows are proposals: nothing is written.
 */
export async function suggestRows(req, taskId, stepId, code) {
  const { t, d } = guard(req, taskId, stepId); const lang = req.lang;
  const ucs = AI.useCasesForStep(req.orgId, t.project_id, stepId);
  const uc = code ? ucs.find(u => u.code === code || u.id === code) : ucs.find(u => u.effective) || ucs[0];
  if (!uc) throw new HttpError(409, 'err.noUseCase', { step: stepId });
  AI.assertActive(req.orgId, t.project_id, uc.code);
  const spec = getSpec(req.orgId, uc.id); const live = liveConfig(req.orgId, spec.model);
  const refs = retrieve(req.orgId, [pick(uc.name, lang), pick(d.step.name, lang)].join(' '), { lang, k: 4 }).map(r => ({ source: r.source, title: r.title, score: r.score, route: r.route }));
  const base = builtInRows(req, t, stepId, d);
  let out = { rows: base.rows, engine: 'built-in', model: null, reason: live ? null : 'noModel', emptyReason: base.reason };
  if (live) {
    const { prompt, missing } = assemble(spec, variables(req.orgId, { projectId: t.project_id, lang, taskId: t.id, stepId }), lang);
    if (missing.length) out = { ...out, reason: 'promptVariable', reasonDetail: missing.join(', ') };
    else {
      const keys = d.form.fields.map(f => f.key);
      try {
        const text = await AI.liveCall(live, `${prompt}\n\n## References\n${refs.map(r => r.title).join(' | ')}\n\n## Answer\nReturn only a JSON array of at most 8 objects with the keys: ${keys.join(', ')}.`);
        const m = String(text).match(/\[[\s\S]*\]/); const arr = m ? JSON.parse(m[0]) : null;
        if (!Array.isArray(arr)) throw new Error('No rows in the answer');
        out = { rows: arr.slice(0, 8).map(x => Object.fromEntries(keys.filter(k => x?.[k] != null).map(k => [k, typeof x[k] === 'object' ? JSON.stringify(x[k]) : x[k]]))), engine: 'live', model: live.model, reason: null };
      } catch (e) { out = { ...out, fallback: true, reason: 'modelError', reasonDetail: String(e.providerMessage || e.message).slice(0, 200) }; }
    }
  }
  AI.logUsage({ orgId: req.orgId, projectId: t.project_id, useCaseId: uc.code, recordRef: `Step:${t.id}:${stepId}`, userId: req.user.id, outcome: 'Proposed', source: out.engine === 'live' ? 'live:' + out.model : 'built-in', confidence: out.engine === 'live' ? 0.8 : 0.6, question: stepId, specVersion: spec.version, engine: out.engine, model: out.model });
  return { ...out, useCase: { id: uc.id, code: uc.code, name: uc.name, tier: uc.tier, checkpoint: uc.checkpoint || null }, specVersion: spec.version, references: refs, recordRef: `Step:${t.id}:${stepId}`, generatedAt: now() };
}

/** The fields of a multi-record step, after the rights and lock checks (structured paste, FR-DA-MRE-22). */
export function stepTableFields(req, taskId, stepId) {
  const { d } = guard(req, taskId, stepId); if (SINGLE.has(d.form.kind) || d.form.kind === 'system') throw new HttpError(422, 'err.wrongPattern');
  return d.form.fields;
}
/** Current data of the rows of a step (to keep what a paste overwrites, so it can be undone). */
export function stepRowData(req, taskId, stepId, ids) {
  const { t } = guard(req, taskId, stepId); const rec = recordOf(t, stepId); if (!rec || !ids.length) return {};
  return Object.fromEntries(all(`SELECT id, data FROM step_rows WHERE step_record_id=? AND id IN (${ids.map(() => '?').join(',')})`, rec.id, ...ids).map(r => [r.id, J(r.data, {})]));
}
export function restoreRow(req, taskId, stepId, rowId, data) {
  const { t } = guard(req, taskId, stepId); const rec = recordOf(t, stepId); if (!rec) return false;
  return run(`UPDATE step_rows SET data=?, updated_by=?, updated_at=? WHERE id=? AND step_record_id=?`, S(data), req.user.id, now(), rowId, rec.id).changes > 0;
}
