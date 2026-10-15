// Shared helpers of the steps that work on the project's records (skills diagnosis, plan, delivery, evaluation):
// rows and fields of other steps, the project's records, the lists offered by the fields, the contacts of a person,
// and "campaigns" — questionnaires sent by e-mail or WhatsApp (assessments, invitations to sessions, expert reviews,
// capsules, evaluations) whose links are answered on the public response page.
import { all, one, run } from '../db.js';
import { J, S, pick, uuid, now, addDays, HttpError } from '../lib/util.js';
import { config } from '../config.js';
import * as cat from '../catalog.js';
import * as Q from './questionnaires.js';
import { insertRecord } from './projects.js';
import { normalizePhone, validEmail, send } from './channels.js';
import { orgCurrencies } from './money.js';
import { dispatch } from './dispatch.js';

export const L = (en, fr, ar) => ({ en, fr, ar });
export const T = (lang, en, fr, ar) => (lang === 'fr' ? fr : lang === 'ar' ? ar ?? en : en);
export const ml = s => ({ en: String(s ?? ''), fr: String(s ?? ''), ar: String(s ?? '') });
export const str = (v, lang = 'en') => (v && typeof v === 'object' && !Array.isArray(v) ? pick(v, lang) : v == null ? '' : String(v));
export const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();
export const split = v => (Array.isArray(v) ? v : String(v || '').split(/\s*[,;|]\s*/)).map(x => String(x).trim()).filter(Boolean);
export const num = v => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
export const round1 = v => (v == null ? null : Math.round(v * 10) / 10);
export const avg = a => { const x = a.filter(v => v != null); return x.length ? round1(x.reduce((s, v) => s + v, 0) / x.length) : null; };
export const today = () => now().slice(0, 10);
export const dplus = (n, from) => addDays(from ? new Date(from).toISOString() : now(), n).slice(0, 10);
export const fmtD = (d, lang) => { if (!d) return ''; const [y, m, x] = String(d).slice(0, 10).split('-'); return lang === 'en' ? `${x}/${m}/${y}` : `${x}/${m}/${y}`; };
export const fmtN = (v, lang) => (v == null ? '—' : Number(v).toLocaleString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-GB', { maximumFractionDigits: 1 }));
export const baseUrl = req => config.publicUrl || req?.get?.('origin') || (req?.get ? `${req.protocol}://${req.get('host')}` : 'http://localhost:4000');

/* ------------------------------------------------------------------ project data */
/** Rows of a step in the project; `uft` narrows to the task when the step appears in two tasks. */
export function rowsOfStep(projectId, stepId, uft = null) {
  return all(`SELECT r.id, r.data FROM step_rows r JOIN step_records sr ON sr.id=r.step_record_id JOIN task_instances ti ON ti.id=sr.task_instance_id
    WHERE sr.project_id=? AND sr.step_id=? ${uft ? 'AND ti.uft_id=?' : ''} ORDER BY r.sort, r.created_at`, ...(uft ? [projectId, stepId, uft] : [projectId, stepId])).map(r => ({ _id: r.id, ...J(r.data, {}) }));
}
export function fieldsOfStep(projectId, stepId, uft = null) {
  const r = one(`SELECT sr.fields, sr.status FROM step_records sr JOIN task_instances ti ON ti.id=sr.task_instance_id WHERE sr.project_id=? AND sr.step_id=? ${uft ? 'AND ti.uft_id=?' : ''} ORDER BY sr.updated_at DESC LIMIT 1`, ...(uft ? [projectId, stepId, uft] : [projectId, stepId]));
  return r ? { ...J(r.fields, {}), _status: r.status } : null;
}
export const stepDone = (projectId, stepId, uft = null) => fieldsOfStep(projectId, stepId, uft)?._status === 'Completed';
export const recs = (entity, projectId) => all(`SELECT id, ref, data, updated_at FROM records WHERE entity=? AND project_id=? ORDER BY created_at, ref`, entity, projectId).map(r => ({ _id: r.id, _ref: r.ref, _at: r.updated_at, ...J(r.data, {}) }));
/** Creates or updates the project record keyed by `key` (one record per item of the step that produced it). */
export function upsert(req, t, entity, key, data, ref = null) {
  const ex = one(`SELECT id, data FROM records WHERE entity=? AND project_id=? AND json_extract(data,'$.flow_key')=?`, entity, t.project_id, key);
  if (ex) { run(`UPDATE records SET data=?, ref=coalesce(?,ref), version=version+1, updated_by=?, updated_at=? WHERE id=?`, S({ ...J(ex.data, {}), ...data, flow_key: key }), ref, req.user.id, now(), ex.id); return ex.id; }
  const id = uuid(); insertRecord(id, entity, req.orgId, t.project_id, ref, { ...data, flow_key: key }, req.user.id, true); return id;
}
/** Removes the records a step produced earlier and no longer lists (after rows were deleted and the step completed again). */
export function prune(entity, projectId, stepId, keep) {
  for (const r of all(`SELECT id, data FROM records WHERE entity=? AND project_id=? AND json_extract(data,'$.flow_step')=?`, entity, projectId, stepId)) if (!keep.has(J(r.data, {}).flow_key)) run(`DELETE FROM records WHERE id=?`, r.id);
}
export const patch = (id, data, userId) => { const r = one(`SELECT data FROM records WHERE id=?`, id); if (r) run(`UPDATE records SET data=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, S({ ...J(r.data, {}), ...data }), userId, now(), id); };
export const projectOf = id => one(`SELECT * FROM projects WHERE id=?`, id) || {};
export const orgOf = id => one(`SELECT * FROM organizations WHERE id=?`, id) || {};
export const sectorSeed = sector => cat.list('verticalSeed').find(v => v.id === sector) || null;
export const planYear = p => Number(p.plan_year) || new Date().getFullYear() + 1;
export const yearEnd = p => `${planYear(p)}-12-31`;

/* ------------------------------------------------------------------ the project's objects, read back by the next steps */
export function competencies(projectId) {
  return recs('Competency', projectId).filter(c => c.flow_step).map(c => ({ ...c, code: c.code, name: c.name_text || pick(c.name, 'en') }));
}
export const compName = (c, lang) => str(c?.name, lang) || c?.name_text || c?.code || '';
export const compByCode = (projectId, code) => competencies(projectId).find(c => norm(c.code) === norm(code) || norm(c.name_text) === norm(code));
export const targets = projectId => recs('PositionCompetencyTarget', projectId).filter(x => x.flow_step);
export const employees = projectId => recs('Employee', projectId).filter(x => x.flow_step);
export const empByName = (projectId, name) => employees(projectId).find(e => norm(e.name) === norm(name));
export const assessments = projectId => recs('SkillAssessment', projectId).filter(x => x.flow_step);
export const gaps = projectId => recs('SkillGap', projectId).filter(x => x.flow_step);
export const objectives = projectId => recs('StrategicObjective', projectId).filter(x => x.flow_step);
export const needs = projectId => recs('TrainingNeed', projectId);
export const themes = projectId => recs('TrainingTheme', projectId).filter(x => x.flow_step);
export const courses = projectId => recs('TrainingCourse', projectId).filter(x => x.flow_step);
export const courseByCode = (projectId, code) => courses(projectId).find(c => norm(c.training_code) === norm(code) || norm(c.name_text) === norm(code));
export const sessions = projectId => recs('Session', projectId).filter(x => x.flow_step).sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)) || String(a.code).localeCompare(String(b.code)));
export const sessionByCode = (projectId, code) => sessions(projectId).find(s => norm(s.code) === norm(code));
export const enrollments = projectId => recs('Enrollment', projectId).filter(x => x.flow_step);
export const rooms = projectId => recs('TrainingRoom', projectId);
export const trainers = projectId => recs('Trainer', projectId);
export const capsules = projectId => recs('ContentAsset', projectId).filter(x => x.format === 'Capsule');
export const scenarios = projectId => recs('SimulationScenario', projectId);
export const stakeholders = projectId => recs('Stakeholder', projectId);
/** Function of a stakeholder, by its name in the language (an OBS function is stored by its id). */
export function fnOf(s, lang = 'en') { if (s?.function_name) return str(s.function_name, lang); const n = s?.function_id ? one(`SELECT name FROM obs_nodes WHERE id=?`, s.function_id) : null; return n ? pick(J(n.name, n.name), lang) : ''; }
export const fnKey = s => s?.function_id || norm(s?.function_name) || '';
export const courseLabel = (c, lang) => `${c.training_code} — ${str(c.name, lang) || c.name_text}`;

/** E-mail, phone, role and channel of a person known to the project (stakeholders, assessed staff, learners, users). */
export function contactOf(orgId, projectId, name) {
  const k = norm(name); if (!k) return {};
  const st = stakeholders(projectId).find(s => norm(s.name) === k);
  const em = employees(projectId).find(e => norm(e.name) === k);
  const tr = trainers(projectId).find(x => norm(x.name) === k);
  const u = one(`SELECT id, email, title FROM users WHERE org_id=? AND lower(name)=lower(?)`, orgId, String(name).trim());
  return { email: em?.email || st?.email || tr?.email || u?.email || null, phone: em?.phone || st?.phone || tr?.phone || null, role: st?.role || em?.position || u?.title || null,
    channel: em?.channel || (st?.preferred_channel === 'WhatsApp' ? 'WhatsApp' : st ? 'Email' : null), site: em?.site || st?.site || null, function: st?.function_name || null, level: st?.decision_level || null,
    category: st?.category || null, user_id: u?.id || null, language: st?.language || null };
}

/* ------------------------------------------------------------------ lists offered by the fields */
const opt = (value, label) => ({ value: String(value), label: typeof label === 'object' ? label : ml(label) });
export function sourceList(name, orgId, projectId, lang = 'en') {
  if (!projectId) return null;
  switch (name) {
    case 'people': {
      const m = new Map(); const add = (n, extra) => { const x = String(n || '').trim(); if (!x || m.has(norm(x))) return; m.set(norm(x), opt(x, extra ? `${x} (${extra})` : x)); };
      for (const s of stakeholders(projectId)) add(s.name, s.role); for (const e of employees(projectId)) add(e.name, e.position);
      for (const u of all(`SELECT name, title FROM users WHERE org_id=? AND active=1 ORDER BY name`, orgId)) add(u.name, u.title);
      return [...m.values()];
    }
    case 'assessed': return employees(projectId).map(e => opt(e.name, `${e.name} (${e.position || '—'})`));
    case 'learners': { const m = new Map(); for (const e of enrollments(projectId)) if (!m.has(norm(e.name))) m.set(norm(e.name), opt(e.name, e.name)); return [...m.values()]; }
    case 'positions': {
      const m = new Map(); const add = x => { const s = String(x || '').trim(); if (s && !m.has(norm(s))) m.set(norm(s), opt(s, s)); };
      for (const s of stakeholders(projectId)) add(s.role); for (const x of targets(projectId)) add(x.position);
      for (const p of all(`SELECT data FROM records WHERE entity='Position' AND org_id=? AND (project_id IS NULL OR project_id=?)`, orgId, projectId)) add(pick(J(p.data, {}).title, lang));
      return [...m.values()];
    }
    case 'targetPositions': { const m = new Map(); for (const x of targets(projectId)) if (!m.has(norm(x.position))) m.set(norm(x.position), opt(x.position, x.position)); return m.size ? [...m.values()] : sourceList('positions', orgId, projectId, lang); }
    case 'competencies': return competencies(projectId).map(c => opt(c.code, `${c.code} — ${compName(c, lang)}`));
    case 'objectives': return objectives(projectId).map(o => opt(o.code, `${o.code} — ${str(o.statement, lang)}`));
    case 'needThemes': { const m = new Map(); for (const n of needs(projectId)) { const s = str(n.title || n.theme, lang); if (s && !m.has(norm(s))) m.set(norm(s), opt(s, s)); } return [...m.values()]; }
    case 'themes': return themes(projectId).map(x => opt(x.name_text, x.name_text));
    case 'courses': return courses(projectId).map(c => opt(c.training_code, courseLabel(c, lang)));
    case 'approvedCourses': return courses(projectId).filter(c => c.review_status === 'Approved' || c.status === 'Published').map(c => opt(c.training_code, courseLabel(c, lang)));
    case 'rooms': return rooms(projectId).map(r => opt(r.name, `${r.name}${r.capacity ? ` (${r.capacity})` : ''}`));
    case 'trainers': return trainers(projectId).map(r => opt(r.name, `${r.name}${r.organisation ? ` — ${r.organisation}` : ''}`));
    case 'vendors': { const m = new Map([[norm('Interne'), opt(T(lang, 'Internal', 'Interne', 'داخلي'), T(lang, 'Internal', 'Interne', 'داخلي'))]]); for (const v of all(`SELECT data FROM records WHERE entity='Vendor' AND org_id=?`, orgId)) { const n = pick(J(v.data, {}).legal_name, lang) || pick(J(v.data, {}).label, lang); if (n && !m.has(norm(n))) m.set(norm(n), opt(n, n)); } return [...m.values()]; }
    case 'sessions': return sessions(projectId).map(s => opt(s.code, `${s.code} — ${s.course_code} · ${fmtD(s.start_date, lang)}`));
    case 'capsules': return capsules(projectId).map(c => opt(c.name_text, c.name_text));
    case 'scenarios': return scenarios(projectId).map(s => opt(s.name, s.name));
    case 'flowKpis': return FLOW_KPIS.map(k => opt(k.id, `${k.id} — ${pick(k.name, lang)}`));
    case 'roles': return all(`SELECT id, name FROM roles ORDER BY sort`).map(r => opt(r.id, `${r.id} — ${pick(J(r.name, r.name), lang)}`));
    case 'currencies': return orgCurrencies(orgId).enabled.map(c => opt(c, c));
    default: return null;
  }
}

/* ------------------------------------------------------------------ indicators computed by the evaluation */
export const FLOW_KPIS = [
  { id: 'KPI-012', name: L('Average level-1 satisfaction (out of 5)', 'Satisfaction moyenne de niveau 1 (sur 5)', 'متوسط الرضا من المستوى 1 (من 5)'), target: 4.2, direction: 'up', unit: '/5' },
  { id: 'KPI-013', name: L('Skills progression rate', 'Taux de progression des compétences', 'نسبة تقدم الكفاءات'), target: 70, direction: 'up', unit: '%' },
  { id: 'FLOW-L2', name: L('Level-2 test pass rate', 'Taux de réussite au test de niveau 2', 'نسبة النجاح في اختبار المستوى 2'), target: 80, direction: 'up', unit: '%' },
  { id: 'FLOW-ATT', name: L('Attendance rate', 'Taux de présence', 'نسبة الحضور'), target: 90, direction: 'up', unit: '%' },
  { id: 'KPI-008', name: L('Session fill rate', 'Taux de remplissage des sessions', 'نسبة ملء الدورات'), target: 85, direction: 'up', unit: '%' },
  { id: 'KPI-003', name: L('Critical gap rate', 'Taux d’écarts critiques', 'نسبة الفجوات الحرجة'), target: 10, direction: 'down', unit: '%' },
  { id: 'KPI-022', name: L('Budget execution variance', 'Écart d’exécution budgétaire', 'فارق تنفيذ الميزانية'), target: 5, direction: 'down', unit: '%' },
  { id: 'KPI-030', name: L('Capsule completion rate', 'Taux d’achèvement des capsules', 'نسبة إتمام الكبسولات'), target: 85, direction: 'up', unit: '%' },
];
/** Writes an indicator value of the project for the current month (the KPI page and the documents read it). */
export function kpiValue(req, t, id, value) {
  const k = FLOW_KPIS.find(x => x.id === id); if (!k || value == null) return;
  const period = now().slice(0, 7); const ok = k.direction === 'up' ? value >= k.target : value <= k.target; const near = k.direction === 'up' ? value >= k.target * 0.9 : value <= k.target * 1.1;
  run(`DELETE FROM kpi_values WHERE project_id=? AND kpi_id=? AND period=?`, t.project_id, id, period);
  run(`INSERT INTO kpi_values(id,org_id,project_id,kpi_id,period,value,target,direction,status) VALUES(?,?,?,?,?,?,?,?,?)`, uuid(), req.orgId, t.project_id, id, period, value, k.target, k.direction, ok ? 'Green' : near ? 'Amber' : 'Red');
}

/* ------------------------------------------------------------------ campaigns (questionnaires sent for a purpose) */
export function campaignOf(orgId, projectId, purpose) {
  const r = one(`SELECT id FROM records WHERE entity='Questionnaire' AND project_id=? AND json_extract(data,'$.purpose')=? ORDER BY created_at DESC LIMIT 1`, projectId, purpose);
  return r ? Q.getQuestionnaire(orgId, r.id) : null;
}
/** Creates (or extends) the project questionnaire of a purpose with the given forms; it is open at once. */
export function campaign(req, t, purpose, label, forms, extra = {}) {
  let q = campaignOf(req.orgId, t.project_id, purpose);
  if (!q) {
    const id = uuid();
    insertRecord(id, 'Questionnaire', req.orgId, t.project_id, null, { label, purpose, forms: [], status: 'Distributed', distributed_on: now(), distributed_by: req.user.id, due_date: dplus(extra.days || 14), threshold: 50,
      channels: ['Email', 'WhatsApp'], channel_mode: 'Combination', reminders: { Email: { every_days: 3, max: 2 }, WhatsApp: { every_days: 2, max: 2 } }, owner_id: req.user.id, public_base: baseUrl(req),
      per_form_title: true, response_count: 0, source_task_id: t.id, elaboration_mode: 'Generated', modes: ['Generated'] }, req.user.id, true);
    q = Q.getQuestionnaire(req.orgId, id);
    Q.event(req.orgId, id, null, 'questionnaire.created', { detail: { purpose, from: t.uft_id }, userId: req.user.id });
  }
  for (const fm of forms) { const i = (q.forms || []).findIndex(x => x.code === fm.code); if (i >= 0) q.forms[i] = fm; else (q.forms ||= []).push(fm); }
  Object.assign(q, extra.data || {}); q.public_base = baseUrl(req); if (q.status !== 'Distributed') { q.status = 'Distributed'; q.distributed_on = now(); }
  Q.saveQuestionnaire(q, req.user.id); return Q.getQuestionnaire(req.orgId, q.id);
}
/** Invites people to their form of a campaign on their channel and sends the first message now; reminders follow. */
export async function invite(req, q, people) {
  let added = 0; const missing = [];
  for (const p of people) {
    const phone = p.phone ? normalizePhone(p.phone) : null;
    if ((p.channel === 'Email' && !validEmail(p.email)) || (p.channel === 'WhatsApp' && !phone)) { missing.push(p.name); continue; }
    if (one(`SELECT id FROM q_invitations WHERE questionnaire_id=? AND stakeholder_id=?`, q.id, p.key)) continue;
    const plan = [{ channel: p.channel, action: 'invite', after_days: 0 }, { channel: p.channel, action: 'remind', after_days: 3 }];
    added += Q.addInvitations(req.orgId, q, [{ id: p.key, name: p.name, email: p.email || null, phone, population: p.population || 'Member', language: p.lang || req.lang, decision_level: p.level || null, function_name: p.fn || null, user_id: p.user_id || null }],
      { templateCode: p.form, plan, userId: req.user.id }).length;
  }
  const res = await Q.advance(req.orgId, Q.getQuestionnaire(req.orgId, q.id), { base: baseUrl(req), userId: req.user.id, force: true });
  return { added, sent: res.steps, missing };
}
/** Invitations of a campaign with their answers (subject, status, last channel). */
export function invitationsOf(orgId, q) {
  if (!q) return [];
  return all(`SELECT i.*, r.data rdata FROM q_invitations i LEFT JOIN records r ON r.id=i.response_id WHERE i.questionnaire_id=? ORDER BY i.created_at`, q.id).map(i => ({ ...i, channel_plan: J(i.channel_plan, []), answers: J(i.rdata, {})?.answers_json || null }));
}
export const statusLabel = (s, lang) => ({ Planned: T(lang, 'Planned', 'Prévu', 'مبرمج'), Invited: T(lang, 'Invited', 'Invité', 'مدعو'), Opened: T(lang, 'Link opened', 'Lien ouvert', 'تم فتح الرابط'), 'In progress': T(lang, 'In progress', 'En cours', 'جارٍ'),
  Responded: T(lang, 'Answered', 'Répondu', 'أجاب'), Declined: T(lang, 'Declined', 'Refusé', 'رفض'), Expired: T(lang, 'Expired', 'Expiré', 'منتهٍ') }[s] || s);
/** Reminder sent now to everyone who has not answered a campaign. */
export async function remindNow(req, q) {
  let sent = 0;
  for (const inv of all(`SELECT * FROM q_invitations WHERE questionnaire_id=? AND status NOT IN ('Responded','Declined','Expired') AND opted_out=0`, q.id)) {
    const plan = J(inv.channel_plan, []); const step = { ...(plan[Math.max(0, inv.step_index)] || plan[0]), action: 'remind' };
    const r = await Q.runStep(req.orgId, { ...q, public_base: baseUrl(req) }, inv, step, { userId: req.user.id, base: baseUrl(req) }); if (r.status !== 'failed') sent++;
  }
  return sent;
}
/** One-way message (announcement, plan distribution, lessons learned) on e-mail or WhatsApp; in the application for users. */
export async function message(req, t, { name, email, phone, channel, user_id }, subject, text, kind = 'announcement') {
  const link = baseUrl(req); const org = pick(J(orgOf(req.orgId).name, orgOf(req.orgId).name), req.lang);
  if (channel === 'Application' && user_id) { dispatch({ orgId: req.orgId, userId: user_id, category: 'projects', subjectKey: 'flow.appMessage', params: { subject } }); return { status: 'delivered', channel: 'Application' }; }
  const ch = channel === 'WhatsApp' && phone ? 'whatsapp' : 'email'; const to = ch === 'whatsapp' ? normalizePhone(phone) : validEmail(email) ? email : null;
  if (!to) return { status: 'failed', error: 'noAddress', channel: ch };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const html = `<div style="font-family:'Open Sans',Arial,sans-serif;color:#2C3E50;max-width:560px">${esc(text).split('\n').map(l => `<p style="margin:0 0 10px">${l}</p>`).join('')}</div>`;
  const m = await send({ orgId: req.orgId, projectId: t.project_id, kind, channel: ch, to, subject, text, html, lang: req.lang, params: [name || '', org, subject, link, today()], userId: req.user.id });
  return { status: m.status, error: m.error, channel: ch, id: m.id };
}
export const messagesOf = (projectId, kind) => all(`SELECT * FROM messages WHERE project_id=? AND kind=? ORDER BY created_at`, projectId, kind);
export const err = (code, params) => new HttpError(422, code, params);
export { pick, J, S, now, uuid, all, one, run };
