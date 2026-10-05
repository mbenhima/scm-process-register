// Questionnaire & Survey Management (SRS Section 4.36, FR-DA-QLT-01..12) with the respondent model and the channel
// plan: who answers (respondents drawn from the stakeholder register, each with a population and the form that fits
// it), how they answer (Face-to-Face, Email, WhatsApp, Application, or a combination played in sequence), reminders
// on each channel's cadence, consented collection, completeness, consolidation and reporting.
import { all, one, run } from '../db.js';
import { uuid, now, J, S, pick, HttpError, addDays } from '../lib/util.js';
import { t } from '../i18n.js';
import { dispatch } from './dispatch.js';
import { send, normalizePhone, validEmail } from './channels.js';
import { newToken, seal, open, hashToken } from './secrets.js';
import { insertRecord } from './projects.js';

export const CHANNELS = ['Face-to-Face', 'Email', 'WhatsApp', 'Application'];
export const MODES = ['Face-to-Face', 'Email', 'WhatsApp', 'Application', 'Combination'];
export const ACTIONS = ['invite', 'remind', 'interview'];
export const POPULATIONS = ['DG', 'Management', 'Member'];
export const INVITATION_STATUSES = ['Planned', 'Invited', 'Opened', 'In progress', 'Interview to schedule', 'Interview scheduled', 'Responded', 'Declined', 'Expired'];
const DAY = 86400000;

// ------------------------------------------------------------------ channel plans
/** Default plan for a population: how the respondent is reached, reminded and, if needed, met in person. */
export function defaultPlan(population, { hasPhone = false, hasUser = false } = {}) {
  if (population === 'DG') return [{ channel: 'Email', action: 'invite', after_days: 0 }, { channel: 'Face-to-Face', action: 'interview', after_days: 3 }];
  if (population === 'Management') return [{ channel: 'Email', action: 'invite', after_days: 0 }, { channel: 'Email', action: 'remind', after_days: 4 }, { channel: 'Face-to-Face', action: 'interview', after_days: 8 }];
  const first = hasPhone ? 'WhatsApp' : hasUser ? 'Application' : 'Email';
  return [{ channel: first, action: 'invite', after_days: 0 }, { channel: hasPhone ? 'WhatsApp' : 'Email', action: 'remind', after_days: 3 }, { channel: 'Email', action: 'remind', after_days: 6 }, { channel: 'Face-to-Face', action: 'interview', after_days: 10 }]
    .filter((s, i, a) => i === 0 || !(s.channel === a[i - 1].channel && s.action === a[i - 1].action));
}
/** A single-channel plan when a mode other than Combination is chosen. */
export function planForMode(mode, population, ctx) {
  if (mode === 'Combination' || !mode) return defaultPlan(population, ctx);
  if (mode === 'Face-to-Face') return [{ channel: 'Face-to-Face', action: 'interview', after_days: 0 }];
  return [{ channel: mode, action: 'invite', after_days: 0 }, { channel: mode, action: 'remind', after_days: 3 }, { channel: mode, action: 'remind', after_days: 7 }];
}
export function validatePlan(plan) {
  if (!Array.isArray(plan) || !plan.length) throw new HttpError(422, 'err.planEmpty');
  let last = -1;
  return plan.map((s, i) => {
    if (!CHANNELS.includes(s.channel)) throw new HttpError(422, 'err.invalidOption', { field: 'channel', value: s.channel });
    const action = s.channel === 'Face-to-Face' ? 'interview' : (ACTIONS.includes(s.action) && s.action !== 'interview' ? s.action : i === 0 ? 'invite' : 'remind');
    const d = Math.max(0, Math.round(Number(s.after_days) || 0));
    if (d < last) throw new HttpError(422, 'err.planOrder');
    last = d; return { channel: s.channel, action, after_days: d };
  });
}
export const modeOfPlan = plan => { const set = new Set((plan || []).map(s => s.channel)); return set.size === 1 ? [...set][0] : 'Combination'; };
/** Channels through which the respondent can answer, derived from the plan. */
export const responseChannels = plan => { const c = new Set((plan || []).map(s => s.channel)); const out = []; if (c.has('Email') || c.has('WhatsApp') || c.has('Application')) out.push('Application'); if (c.has('Email')) out.push('Email'); if (c.has('Face-to-Face')) out.push('Face-to-Face'); return out; };

// ------------------------------------------------------------------ forms and completeness
export const nonEmpty = v => v != null && (typeof v === 'object' ? Object.values(v).some(nonEmpty) : String(v).trim() !== '' && v !== false);
export function applicable(section, flags = {}) {
  if (section.type === 'note') return false;
  if (section.condition === 'previous_plan') return flags.previous_plan !== false;
  if (section.condition === 'hr_function') return flags.hr_function === true;
  return true;
}
/** Share of the answerable elements that carry an answer (FR-DA-QLT-09). A table counts once, a grid once per row. */
export function completeness(sections, answers = {}, flags = {}) {
  let total = 0, filled = 0;
  for (const s of sections || []) {
    if (!applicable(s, flags)) continue;
    const a = answers[s.id];
    const keys = s.type === 'identity' ? s.fields : s.type === 'swot' ? s.boxes : s.type === 'grid' ? s.rows : ['questions', 'rating', 'yesno'].includes(s.type) ? s.items : null;
    if (keys) { for (const k of keys) { total++; const v = a?.[k.key]; if (nonEmpty(s.type === 'yesno' ? v?.value : v)) filled++; } }
    else if (s.type === 'table') { total++; if (Array.isArray(a) && a.some(nonEmpty)) filled++; }
  }
  return total ? Math.round((filled * 1000) / total) / 10 : 0;
}
export function formOf(q, code) { return (q.forms || []).find(f => f.code === code) || (q.forms || [])[0] || null; }

/** Copies library templates into a questionnaire's forms; each question keeps its origin (FR-DA-QLT-02). */
export function formsFromTemplates(templates) {
  return templates.map(tp => ({ code: tp.code, template_id: tp.id, name: tp.name, population: tp.population, decision_level: tp.decision_level, form: tp.form,
    sections: (tp.sections || []).map(s => ({ ...s, origin: 'template', racsi: s.racsi || { R: 'L&D Analyst', A: 'Head of L&D', C: 'Consultant PM', S: 'Function head', I: 'HR Director' } })) }));
}

// ------------------------------------------------------------------ records
export function getQuestionnaire(orgId, id) {
  const r = one(`SELECT * FROM records WHERE id=? AND entity='Questionnaire' AND org_id=?`, id, orgId);
  if (!r) throw new HttpError(404, 'err.notFound');
  return { id: r.id, project_id: r.project_id, version: r.version, ...J(r.data, {}) };
}
export function saveQuestionnaire(q, userId) {
  const { id, project_id, version, ...data } = q;
  run(`UPDATE records SET data=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, S(data), userId, now(), id);
}
export function event(orgId, questionnaireId, invitationId, kind, { channel = null, recipient = null, status = null, detail = null, userId = null, at = null } = {}) {
  run(`INSERT INTO q_events(id,org_id,questionnaire_id,invitation_id,kind,channel,recipient,status,detail,user_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    uuid(), orgId, questionnaireId, invitationId, kind, channel, recipient, status, detail == null ? null : typeof detail === 'string' ? detail : S(detail), userId, at || now());
}

/** Distribution guards: validated AI questions (QLT-03), exactly one Accountable per section (QLT-04), respondents, deadline. */
export function distributionIssues(q, invitations) {
  const issues = [];
  for (const f of q.forms || []) for (const s of f.sections || []) {
    if (s.type === 'note') continue;
    const unvalidated = [s, ...(s.items || [])].filter(x => x.origin === 'ai' && !x.validated_by).length;
    if (unvalidated) issues.push({ code: 'aiUnvalidated', form: f.code, section: s.id, n: unvalidated });
    const A = String(s.racsi?.A || '').split(/[,;/]/).map(x => x.trim()).filter(Boolean);
    if (A.length !== 1) issues.push({ code: A.length ? 'manyAccountable' : 'noAccountable', form: f.code, section: s.id });
  }
  if (!invitations.length) issues.push({ code: 'noRespondents' });
  const noAddress = invitations.filter(i => (i.channel_plan || []).some(s => (s.channel === 'Email' && !validEmail(i.email)) || (s.channel === 'WhatsApp' && !i.phone)));
  if (noAddress.length) issues.push({ code: 'missingAddress', n: noAddress.length });
  if (!q.due_date) issues.push({ code: 'noDueDate' });
  return issues;
}

// ------------------------------------------------------------------ invitations
const invOut = i => i && ({ ...i, channel_plan: J(i.channel_plan, []), consent: J(i.consent), draft: undefined, token_enc: undefined, token_hash: undefined, mode: modeOfPlan(J(i.channel_plan, [])), respondVia: responseChannels(J(i.channel_plan, [])) });
export function listInvitations(orgId, questionnaireId) {
  return all(`SELECT * FROM q_invitations WHERE org_id=? AND questionnaire_id=? ORDER BY population, name`, orgId, questionnaireId).map(invOut);
}
export function getInvitation(orgId, id) {
  const i = one(`SELECT * FROM q_invitations WHERE id=? AND org_id=?`, id, orgId); if (!i) throw new HttpError(404, 'err.notFound'); return i;
}
export function populationOf(st) {
  if (st.population && POPULATIONS.includes(st.population)) return st.population;
  const role = String(pick(st.role, 'en') || '').toLowerCase();
  if (/general manager|ceo|\bdg\b|managing director|président|pdg/.test(role)) return 'DG';
  if (st.decision_level === 'MS' || /head|director|manager|responsable|pilot/.test(role)) return 'Management';
  return 'Member';
}
export function addInvitations(orgId, q, stakeholders, { population, templateCode, plan, mode, lang, userId, at } = {}) {
  const added = []; const orgLang = one(`SELECT default_language l FROM organizations WHERE id=?`, orgId)?.l || 'en';
  for (const st of stakeholders) {
    if (one(`SELECT id FROM q_invitations WHERE questionnaire_id=? AND stakeholder_id=?`, q.id, st.id)) continue;
    const pop = population || populationOf(st);
    const form = (q.forms || []).find(f => f.code === templateCode) || (q.forms || []).find(f => f.population === pop) || (q.forms || [])[0];
    const phone = st.phone ? normalizePhone(st.phone) : null;
    const p = plan ? validatePlan(plan) : planForMode(mode || q.channel_mode || 'Combination', pop, { hasPhone: !!phone, hasUser: !!st.user_id });
    const { token, hash } = newToken(); const id = uuid(); const tm = at || now();
    run(`INSERT INTO q_invitations(id,org_id,project_id,questionnaire_id,stakeholder_id,user_id,name,email,phone,population,template_code,function_id,function_name,decision_level,lang,channel_plan,step_index,status,token_hash,token_enc,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,-1,'Planned',?,?,?,?)`, id, orgId, q.project_id, q.id, st.id, st.user_id || null, pick(st.name, 'en') || pick(st.label, 'en'), st.email || null, phone, pop, form?.code || null,
      st.function_id || null, st.function_name ? (typeof st.function_name === 'object' ? pick(st.function_name, lang || orgLang) : String(st.function_name)) : null, st.decision_level || null, lang || st.language || null, S(p), hash, seal(token), tm, tm);
    event(orgId, q.id, id, 'respondent.added', { detail: { population: pop, form: form?.code, mode: modeOfPlan(p) }, userId, at: tm });
    added.push(id);
  }
  return added;
}
export const linkFor = (inv, base) => `${(base || '').replace(/\/$/, '')}/respond/${open(inv.token_enc)}`;

// ------------------------------------------------------------------ messages
function orgInfo(orgId) { const o = one(`SELECT name, default_language FROM organizations WHERE id=?`, orgId); return { name: J(o?.name, o?.name), lang: o?.default_language || 'en' }; }
function compose(inv, q, kind, base) {
  const org = orgInfo(inv.org_id); const lang = inv.lang || org.lang;
  const vars = { name: inv.name || '', org: pick(org.name, lang), title: pick(q.label, lang), link: linkFor(inv, base || q.public_base), due: q.due_date ? new Date(q.due_date).toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—',
    interview: inv.interview_at ? new Date(inv.interview_at).toLocaleString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }) : '' };
  const k = kind === 'remind' ? 'reminder' : kind === 'interview' ? 'interview' : 'invite';
  const subject = t(`qmsg.${k}.subject`, lang, vars); const text = t(`qmsg.${k}.body`, lang, vars) + '\n\n' + t('qmsg.footer', lang, vars);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const html = `<div style="font-family:Calibri,Arial,sans-serif;color:#3A3A3C;max-width:560px;${lang === 'ar' ? 'direction:rtl;text-align:right;' : ''}">` +
    esc(t(`qmsg.${k}.body`, lang, vars)).split('\n').map(l => l.includes(vars.link) ? `<p><a href="${esc(vars.link)}" style="display:inline-block;background:#F8931D;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">${esc(t('qmsg.button', lang))}</a></p>` : `<p style="margin:0 0 10px">${l}</p>`).join('') +
    `<p style="font-size:12px;color:#808184;margin-top:18px">${esc(t('qmsg.footer', lang, vars))}</p></div>`;
  return { lang, subject, text, html, params: [vars.name, vars.org, vars.title, vars.link, vars.due] };
}

/** Executes one step of an invitation's plan on its channel and records it in the immutable log (FR-DA-COMM-08). */
export async function runStep(orgId, q, inv, step, { userId = null, base = null } = {}) {
  const kind = step.action === 'interview' ? 'interview' : inv.last_sent_at || step.action === 'remind' ? 'remind' : 'invite';
  if (step.channel === 'Face-to-Face') {
    const st = inv.interview_at ? 'Interview scheduled' : 'Interview to schedule';
    run(`UPDATE q_invitations SET status=?, updated_at=? WHERE id=?`, st, now(), inv.id);
    event(orgId, q.id, inv.id, 'interview.planned', { channel: 'Face-to-Face', recipient: inv.name, status: st, userId });
    if (q.owner_id) dispatch({ orgId, userId: q.owner_id, category: 'questionnaires', subjectKey: 'qmsg.interviewToSchedule', params: { name: inv.name } });
    return { channel: 'Face-to-Face', status: st };
  }
  let to = null, result;
  const msg = compose(inv, q, kind, base);
  if (step.channel === 'Email') to = validEmail(inv.email) ? inv.email : null;
  if (step.channel === 'WhatsApp') to = inv.phone || null;
  if (step.channel === 'Application') {
    if (!inv.user_id) { to = validEmail(inv.email) ? inv.email : null; step = { ...step, channel: 'Email' }; }
    else { dispatch({ orgId, userId: inv.user_id, category: 'questionnaires', subjectKey: `qmsg.${kind === 'remind' ? 'reminder' : 'invite'}.subject`, params: { org: msg.params[1], title: msg.params[2], name: inv.name } }); result = { status: 'delivered', channel: 'Application' }; }
  }
  if (!result) {
    if (!to) { event(orgId, q.id, inv.id, kind, { channel: step.channel, status: 'failed', detail: 'noAddress', userId }); return { channel: step.channel, status: 'failed', error: 'noAddress' }; }
    const m = await send({ orgId, projectId: q.project_id, questionnaireId: q.id, invitationId: inv.id, kind, channel: step.channel === 'Email' ? 'email' : 'whatsapp', to, subject: msg.subject, text: msg.text, html: msg.html, lang: msg.lang, params: msg.params, userId });
    result = { status: m.status, channel: step.channel, messageId: m.id, error: m.error };
  }
  const ok = result.status !== 'failed';
  run(`UPDATE q_invitations SET status=CASE WHEN status IN ('Planned','Interview to schedule') AND ? THEN 'Invited' ELSE status END, last_sent_at=CASE WHEN ? THEN ? ELSE last_sent_at END, reminders_sent=reminders_sent+?, updated_at=? WHERE id=?`,
    ok ? 1 : 0, ok ? 1 : 0, now(), kind === 'remind' && ok ? 1 : 0, now(), inv.id);
  event(orgId, q.id, inv.id, kind, { channel: result.channel, recipient: to || inv.name, status: result.status, detail: result.error ? { error: result.error } : { message: result.messageId }, userId });
  return result;
}

/** Plays the plans of a distributed questionnaire: next step when its day is reached, reminders on each channel's cadence. */
export async function advance(orgId, q, { base = null, userId = null, force = false } = {}) {
  if (q.status !== 'Distributed') return { steps: 0, reminders: 0 };
  const start = new Date(q.distributed_on || now()).getTime(); const tnow = Date.now();
  const due = q.due_date ? new Date(q.due_date).getTime() + DAY : Infinity;
  let steps = 0, reminders = 0;
  for (const inv of all(`SELECT * FROM q_invitations WHERE questionnaire_id=? AND status NOT IN ('Responded','Declined','Expired') AND opted_out=0`, q.id)) {
    if (tnow > due && !force) continue;
    const plan = J(inv.channel_plan, []);
    let idx = inv.step_index;
    while (idx + 1 < plan.length && (force && idx < 0 || start + plan[idx + 1].after_days * DAY <= tnow)) {
      idx++; run(`UPDATE q_invitations SET step_index=? WHERE id=?`, idx, inv.id);
      await runStep(orgId, q, one(`SELECT * FROM q_invitations WHERE id=?`, inv.id), plan[idx], { base, userId }); steps++;
      if (force) break;
    }
    // Reminder cadence of the current channel (FR-DA-COMM-07): only non-respondents, stopped at response or closure.
    const cur = plan[idx]; const cad = cur && q.reminders?.[cur.channel];
    if (cur && cad && cur.channel !== 'Face-to-Face' && cad.every_days > 0) {
      const fresh = one(`SELECT * FROM q_invitations WHERE id=?`, inv.id);
      const sentOnChannel = one(`SELECT COUNT(*) n FROM q_events WHERE invitation_id=? AND kind='remind' AND channel=?`, inv.id, cur.channel).n;
      if (fresh.last_sent_at && new Date(fresh.last_sent_at).getTime() + cad.every_days * DAY <= tnow && sentOnChannel < (cad.max ?? 2)) {
        await runStep(orgId, q, fresh, { ...cur, action: 'remind' }, { base, userId }); reminders++;
      }
    }
  }
  return { steps, reminders };
}
/** Background tick for every distributed questionnaire (every 10 minutes). */
export async function tickAll() {
  for (const r of all(`SELECT id, org_id FROM records WHERE entity='Questionnaire' AND json_extract(data,'$.status')='Distributed'`)) {
    try { await advance(r.org_id, getQuestionnaire(r.org_id, r.id)); } catch (e) { console.error('[questionnaires]', e.message); }
  }
}

// ------------------------------------------------------------------ responses
/**
 * Stores a response. Consent is required before anything is stored (FR-DA-QLT-06): without it the answers are
 * dropped and the refusal is logged. Offline captures keep their original capture time and a client id so a
 * replayed sync never creates a duplicate (FR-DA-QLT-08).
 */
export function storeResponse(orgId, q, inv, { answers = {}, flags = {}, consent, final = false, channel = 'Application', capturedAt = null, clientId = null, userId = null, source = 'respondent' }) {
  if (consent !== true) {
    event(orgId, q.id, inv.id, 'consent.refused', { channel, recipient: inv.name, status: 'rejected', detail: 'Response not stored: no consent', userId });
    throw new HttpError(422, 'err.consentRequired');
  }
  if (inv.status === 'Responded' && final && source === 'respondent') throw new HttpError(409, 'err.alreadyResponded');
  if (clientId) { const dup = one(`SELECT id FROM q_events WHERE invitation_id=? AND kind='response.synced' AND detail LIKE ?`, inv.id, `%${clientId}%`); if (dup) return { duplicate: true, responseId: inv.response_id }; }
  const form = formOf(q, inv.template_code);
  const pct = completeness(form?.sections, answers, flags); const tm = now();
  const consentRec = { given: true, at: capturedAt || tm, channel, by: source };
  if (!final) {
    run(`UPDATE q_invitations SET draft=?, consent=?, status=CASE WHEN status IN ('Planned','Invited','Opened') THEN 'In progress' ELSE status END, updated_at=? WHERE id=?`, S({ answers, flags, pct, saved_at: tm }), S(consentRec), tm, inv.id);
    event(orgId, q.id, inv.id, 'response.draft', { channel, status: 'saved', detail: { completeness: pct }, userId });
    return { draft: true, completeness: pct };
  }
  const touched = [...new Set(all(`SELECT DISTINCT channel FROM q_events WHERE invitation_id=? AND channel IS NOT NULL AND status NOT IN ('failed')`, inv.id).map(x => x.channel).concat(channel))];
  const below = pct < (q.threshold ?? 70);
  const data = { questionnaire_id: q.id, invitation_id: inv.id, stakeholder_id: inv.stakeholder_id, stakeholder_ref: inv.stakeholder_id, label: { en: inv.name, fr: inv.name, ar: inv.name },
    respondent: inv.name, population: inv.population, template_code: form?.code, function_name: inv.function_name, decision_level: inv.decision_level,
    channel_used: channel, channels_touched: touched, hybrid: touched.length > 1, submitted_at: capturedAt || tm, synced_at: capturedAt ? tm : null, consent_given: true,
    completeness_pct: pct, flags, answers_json: answers, included: !below, flagged: below ? 'Below threshold' : null, captured_by: source === 'respondent' ? null : userId, language: inv.lang };
  let rid = inv.response_id;
  if (rid && one(`SELECT id FROM records WHERE id=?`, rid)) run(`UPDATE records SET data=?, version=version+1, updated_at=?, updated_by=? WHERE id=?`, S(data), tm, userId, rid);
  else { rid = uuid(); insertRecord(rid, 'QuestionnaireResponse', orgId, q.project_id, null, data, userId, true); }
  run(`UPDATE q_invitations SET status='Responded', response_id=?, responded_at=?, consent=?, draft=NULL, updated_at=? WHERE id=?`, rid, capturedAt || tm, S(consentRec), tm, inv.id);
  event(orgId, q.id, inv.id, clientId ? 'response.synced' : 'response', { channel, recipient: inv.name, status: below ? 'below-threshold' : 'stored', detail: { completeness: pct, clientId, capturedAt }, userId , at: capturedAt || null });
  refreshCount(q.id);
  return { responseId: rid, completeness: pct, below };
}
export function refreshCount(qid) {
  const n = one(`SELECT COUNT(*) n FROM records WHERE entity='QuestionnaireResponse' AND json_extract(data,'$.questionnaire_id')=?`, qid).n;
  run(`UPDATE records SET data=json_set(data,'$.response_count',?) WHERE id=?`, n, qid);
}
export function responsesOf(orgId, qid, { includedOnly = false } = {}) {
  return all(`SELECT id, data, created_at, updated_at FROM records WHERE entity='QuestionnaireResponse' AND org_id=? AND json_extract(data,'$.questionnaire_id')=?`, orgId, qid)
    .map(r => ({ id: r.id, ...J(r.data, {}) })).filter(r => !includedOnly || r.included !== false);
}

// ------------------------------------------------------------------ consolidation (FR-DA-QLT-10/11)
const avg = a => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 10) / 10 : null);
const num = v => (v === 'Nv' || v === '' || v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);
/** Structured dataset from the included responses of one questionnaire, scoped to its tenant. */
export function consolidate(orgId, q, lang = 'en') {
  const resp = responsesOf(orgId, q.id, { includedOnly: true });
  const ds = { responses: resp.length, byPopulation: {}, byChannel: {}, softSkills: [], leadership: [], performance: [], transverse: [], competences: [], swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    strategy: {}, history: [], previousPlan: {}, trainingHistory: [], objectives: [], projects: [], ambitions: [], jobs: [], hr: [], strategicPlanning: {}, asOf: now() };
  const softAcc = {}; const leadAcc = {}; const perfAcc = {}; const tpAcc = {}; const compAcc = {};
  const addComp = (text, src, pop) => { for (const c of String(text || '').split(/[;\n•]|, (?=[A-ZÀ-ÿ])/).map(s => s.trim().replace(/\.$/, '')).filter(s => s.length > 2)) { const k = c.toLowerCase(); (compAcc[k] ||= { competence: c, count: 0, sources: new Set(), populations: new Set() }); compAcc[k].count++; compAcc[k].sources.add(src); if (pop) compAcc[k].populations.add(pop); } };
  for (const r of resp) {
    ds.byPopulation[r.population || '—'] = (ds.byPopulation[r.population || '—'] || 0) + 1;
    ds.byChannel[r.channel_used || '—'] = (ds.byChannel[r.channel_used || '—'] || 0) + 1;
    const form = formOf(q, r.template_code); if (!form) continue;
    const A = r.answers_json || {};
    for (const s of form.sections) {
      const a = A[s.id]; if (a == null) continue;
      const src = pick(s.title, lang) || s.id;
      if (s.type === 'rating' && s.feeds === 'soft_skills') for (const it of s.items) { const v = num(a[it.key]); if (v != null) (softAcc[it.key] ||= { label: pick(it.label, lang), values: [] }).values.push(v); }
      if (s.type === 'grid' && s.feeds === 'leadership') for (const row of s.rows) { const v = num(a[row.key]?.pct ?? a[row.key]?.self); if (v != null) (leadAcc[row.key] ||= { label: pick(row.label, lang), values: [], kind: a[row.key]?.pct != null ? 'pct' : 'self' }).values.push(v); }
      if (s.type === 'grid' && s.feeds === 'transverse') for (const row of s.rows) { const x = a[row.key]; if (!x) continue; const acc = (tpAcc[row.key] ||= { label: pick(row.label, lang), group: pick(row.group, lang), documented: 0, owner: 0, n: 0, scores: [] }); acc.n++; if (x.documented === 'Yes') acc.documented++; if (x.owner === 'Yes') acc.owner++; const sc = num(x.score); if (sc != null) acc.scores.push(sc); }
      if (s.type === 'grid' && s.feeds === 'strategy') for (const row of s.rows) { const v = a[row.key]?.details; if (nonEmpty(v)) (ds.strategy[row.key] ||= { label: pick(row.label, lang), values: [] }).values.push(v); }
      if (s.type === 'table' && Array.isArray(a)) {
        const rows = a.filter(nonEmpty);
        if (s.feeds === 'performance') for (const x of rows) { const f = String(x.function || '').trim(); if (!f) continue; const acc = (perfAcc[f.toLowerCase()] ||= { function: f, ms: [], mo: [], op: [] }); for (const k of ['ms', 'mo', 'op']) { const v = num(x[k]); if (v != null) acc[k].push(v); } }
        if (s.feeds === 'history') ds.history.push(...rows);
        if (s.feeds === 'training_history') ds.trainingHistory.push(...rows.map(x => ({ ...x, respondent: r.respondent })));
        if (s.feeds === 'objectives') ds.objectives.push(...rows.map(x => ({ ...x, population: r.population })));
        if (s.feeds === 'projects') ds.projects.push(...rows);
        if (s.feeds === 'jobs' || s.feeds === 'job_tasks') ds.jobs.push(...rows.map(x => ({ ...x, population: r.population, respondent: r.respondent })));
        if (s.feeds === 'swot') for (const x of rows) { if (x.strengths) ds.swot.strengths.push(x.strengths); if (x.weaknesses) ds.swot.weaknesses.push(x.weaknesses); }
        for (const c of s.columns.filter(c => c.competence)) for (const x of rows) if (x[c.key]) addComp(x[c.key], src, r.population);
      }
      if (s.type === 'swot') for (const b of s.boxes) if (nonEmpty(a[b.key])) ds.swot[b.key].push(a[b.key]);
      if (s.type === 'questions' && s.feeds === 'hr_orientations') for (const it of s.items) if (nonEmpty(a[it.key])) ds.hr.push({ answer: a[it.key], respondent: r.respondent });
      if (s.type === 'yesno' && s.feeds === 'strategic_planning') for (const it of s.items) { const v = a[it.key]?.value; if (v) { const acc = (ds.strategicPlanning[it.key] ||= { question: pick(it.label, lang), yes: 0, no: 0 }); acc[v === 'Yes' ? 'yes' : 'no']++; } }
      if (s.type === 'questions' && s.feeds === 'previous_plan') for (const it of s.items) if (nonEmpty(a[it.key])) (ds.previousPlan[it.key] ||= { question: pick(it.label, lang), answers: [] }).answers.push(a[it.key]);
      if (s.type === 'questions' && s.feeds === 'ambitions') for (const it of s.items) { if (nonEmpty(a[it.key])) ds.ambitions.push({ key: it.key, question: pick(it.label, lang), answer: a[it.key], population: r.population }); if (it.competence && a[it.key]) addComp(a[it.key], src, r.population); }
    }
  }
  ds.softSkills = Object.entries(softAcc).map(([key, x]) => ({ key, label: x.label, average: avg(x.values), n: x.values.length })).sort((a, b) => a.average - b.average);
  ds.leadership = Object.entries(leadAcc).map(([key, x]) => ({ key, label: x.label, kind: x.kind, average: avg(x.values), n: x.values.length }));
  ds.performance = Object.values(perfAcc).map(x => ({ function: x.function, ms: avg(x.ms), mo: avg(x.mo), op: avg(x.op), n: Math.max(x.ms.length, x.mo.length, x.op.length) }));
  ds.transverse = Object.entries(tpAcc).map(([key, x]) => ({ key, label: x.label, group: x.group, documented: Math.round((x.documented / x.n) * 100), owner: Math.round((x.owner / x.n) * 100), score: avg(x.scores), n: x.n }));
  ds.competences = Object.values(compAcc).map(x => ({ competence: x.competence, count: x.count, sources: [...x.sources], populations: [...x.populations].filter(Boolean) })).sort((a, b) => b.count - a.count).slice(0, 60);
  return ds;
}
/** Response statistics per channel, focus, population and function (FR-DA-QLT-12). */
export function stats(orgId, qid) {
  const inv = all(`SELECT population, function_name, status, channel_plan, opened_at, response_id FROM q_invitations WHERE questionnaire_id=?`, qid);
  const resp = responsesOf(orgId, qid);
  const by = (keyInv, keyResp) => {
    const out = {};
    for (const i of inv) { const k = keyInv(i) || '—'; (out[k] ||= { invited: 0, engaged: 0, responded: 0, completeness: [] }).invited++; if (i.opened_at || ['In progress', 'Responded', 'Interview scheduled'].includes(i.status)) out[k].engaged++; }
    for (const r of resp) { const k = keyResp(r) || '—'; (out[k] ||= { invited: 0, engaged: 0, responded: 0, completeness: [] }).responded++; out[k].completeness.push(r.completeness_pct || 0); }
    return Object.entries(out).map(([k, v]) => ({ key: k, invited: v.invited, responded: v.responded, responseRate: v.invited ? Math.round((v.responded / v.invited) * 100) : null, engagementRate: v.invited ? Math.round((Math.max(v.engaged, v.responded) / v.invited) * 100) : null, completeness: avg(v.completeness) }));
  };
  const total = { invited: inv.length, responded: resp.length, included: resp.filter(r => r.included !== false).length, responseRate: inv.length ? Math.round((resp.length / inv.length) * 100) : 0,
    engagementRate: inv.length ? Math.round((inv.filter(i => i.opened_at || ['In progress', 'Responded', 'Interview scheduled'].includes(i.status)).length / inv.length) * 100) : 0, completeness: avg(resp.map(r => r.completeness_pct || 0)) };
  return { total, byChannel: by(i => modeOfPlan(J(i.channel_plan, [])), r => r.channel_used), byPopulation: by(i => i.population, r => r.population), byFunction: by(i => i.function_name, r => r.function_name),
    byStatus: inv.reduce((m, i) => ((m[i.status] = (m[i.status] || 0) + 1), m), {}) };
}
export { hashToken };
