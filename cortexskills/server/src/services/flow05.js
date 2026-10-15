// Delivery (E2E-05): expert review of the courses of the approved plan, publication to the catalogue with an
// announcement to the staff concerned, rooms and trainers, sessions and their schedule check, enrolment of the people
// with a gap, invitations sent by e-mail or WhatsApp with a confirmation link, learner accounts, micro-learning
// capsules pushed to the learners, immersive simulations, attendance, closure of the sessions, invoices and their
// reconciliation with attendance.
import * as C from './flowcore.js';
import { hashPassword } from '../auth.js';
import { normalizePhone } from './channels.js';
const { T, ml, str, norm, num, avg, today, dplus, fmtN, fmtD } = C;

const note = (title, text) => ({ id: 'info', type: 'note', title: ml(title), instructions: ml(text) });
const yesno = (key, label, comment = true) => ({ id: key, type: 'yesno', title: ml(label), items: [{ key, label: ml(label) }], comment });
const ask = (id, title, items) => ({ id, type: 'questions', title: ml(title), items: items.map(([key, label]) => ({ key, label: ml(label) })) });
const learnersOf = (t, courseCode) => C.enrollments(t.project_id).filter(e => !courseCode || norm(e.course_code) === norm(courseCode));

/* ------------------------------------------------------------------ MP-06.3 expert review, MP-06.4 decisions */
function expertFor(t, course, lang, ai) {
  const st = C.stakeholders(t.project_id); const n = norm(course.name_text);
  const pick = ai ? st.find(s => (/imag|radio/.test(n) && /radio|imag/i.test(s.role)) || (/triage|urgen|decision/.test(n) && /(m[eé]dical|urgen)/i.test(s.role))) : null;
  return pick || st.find(s => s.category === 'Expert') || st.find(s => /m[eé]dical/i.test(String(s.role))) || st.find(s => s.decision_level === 'MS' && s.category !== 'Sponsor') || null;
}
function reviewRows({ t, lang }, ai) {
  return C.courses(t.project_id).map(c => { const e = expertFor(t, c, lang, ai); return { course: c.training_code, format: c.modality || 'On site', hours: String(c.hours || 7), expert: e?.name || '', expertEmail: e?.email || '', due: dplus(7) }; });
}
async function sendReviews({ req, t, rows }) {
  const lang = req.lang; const forms = []; const people = [];
  for (const r of rows) {
    const c = C.courseByCode(t.project_id, str(r.course)); if (!c) continue; const code = `REV-${c.training_code}`;
    forms.push({ code, name: ml(T(lang, `Review of ${C.courseLabel(c, lang)}`, `Revue de ${C.courseLabel(c, lang)}`, `مراجعة ${C.courseLabel(c, lang)}`)), population: 'Management', course: c.training_code,
      sections: [note(T(lang, 'Content to review', 'Contenu à relire', 'المحتوى المراد مراجعته'), [`${C.courseLabel(c, lang)} — ${c.hours || 7} h, ${c.modality || ''}`, T(lang, 'Objectives:', 'Objectifs :', 'الأهداف:'), ...(c.objectives || []).map(o => `• ${str(o, lang)}`), str(c.competency_description)].join('\n')),
        yesno('approve', T(lang, 'I approve this content as it stands', 'J’approuve ce contenu en l’état', 'أوافق على هذا المحتوى')), ask('comments', T(lang, 'Comments', 'Commentaires', 'تعليقات'), [['comments', T(lang, 'What must be corrected or added?', 'Que faut-il corriger ou ajouter ?', 'ما الذي يجب تصحيحه أو إضافته؟')]])] });
    people.push({ key: `rev:${c._id}`, name: str(r.expert), email: r.expertEmail, phone: C.contactOf(req.orgId, t.project_id, str(r.expert)).phone, channel: 'Email', form: code, population: 'Management', lang });
    C.patch(c._id, { review_status: 'In review', reviewer: str(r.expert), review_due: r.due || null }, req.user.id);
  }
  const q = C.campaign(req, t, 'review', ml(T(lang, 'Expert review of the courses', 'Revue experte des formations', 'مراجعة الخبراء للتكوينات')), forms, { days: 10 });
  return C.invite(req, q, people);
}
function reviewAnswers(req, t) {
  const q = C.campaignOf(req.orgId, t.project_id, 'review'); if (!q) return [];
  return C.invitationsOf(req.orgId, q).map(i => { const f = (q.forms || []).find(x => x.code === i.template_code); return { inv: i, course: f?.course, approve: i.answers?.approve?.approve?.value, comment: [i.answers?.approve?.approve?.comment, i.answers?.comments?.comments].filter(Boolean).join(' — ') }; });
}
function reviewsPanel({ req, t, lang }) {
  const a = reviewAnswers(req, t); if (!a.length) return { notes: [T(lang, 'Completing the step sends each expert a link to the content to review; the answers come back in step MP-06.4.', 'La clôture de l’étape envoie à chaque expert un lien vers le contenu à relire ; les réponses reviennent à l’étape MP-06.4.', 'يرسل لكل خبير رابط للمحتوى.')] };
  return { tables: [{ title: T(lang, 'Review requests', 'Demandes de revue', 'طلبات المراجعة'), columns: [['course', T(lang, 'Course', 'Formation', 'التكوين')], ['expert', T(lang, 'Expert', 'Expert', 'الخبير')], ['status', T(lang, 'Status', 'Statut', 'الحالة')], ['answer', T(lang, 'Approves', 'Approuve', 'يوافق')], ['comment', T(lang, 'Comments', 'Commentaires', 'تعليقات')]],
    rows: a.map(x => ({ course: x.course, expert: x.inv.name, status: C.statusLabel(x.inv.status, lang), answer: x.approve ? T(lang, x.approve, x.approve === 'Yes' ? 'Oui' : 'Non', x.approve) : '—', comment: x.comment || '—' })) }],
    actions: a.some(x => x.inv.status !== 'Responded') ? [{ key: 'remind', label: T(lang, 'Remind the experts', 'Relancer les experts', 'تذكير الخبراء'), icon: 'BellRing' }] : [] };
}
function decisionRows({ req, t, lang }, ai) {
  const a = reviewAnswers(req, t); const out = [];
  for (const c of C.courses(t.project_id)) {
    const x = a.find(y => y.course === c.training_code);
    if (x?.approve) out.push({ course: c.training_code, decision: x.approve === 'Yes' ? 'Approved' : 'To correct', comments: x.comment, expert: x.inv.name, date: x.inv.responded_at?.slice(0, 10) || today() });
    else if (ai) out.push({ course: c.training_code, decision: 'Approved', comments: T(lang, 'No answer from the expert: the content covers the objectives of the plan; to confirm at the first session.', 'Pas de réponse de l’expert : le contenu couvre les objectifs du plan ; à confirmer à la première session.', 'لا جواب من الخبير.'), expert: x?.inv.name || '', date: today() });
  }
  return out;
}
function completeDecisions({ req, t, rows }) { for (const r of rows) { const c = C.courseByCode(t.project_id, str(r.course)); if (c) C.patch(c._id, { review_status: r.decision, review_comments: str(r.comments), reviewer: str(r.expert) || c.reviewer, reviewed_at: r.date || today() }, req.user.id); } }

/* ------------------------------------------------------------------ MP-06.6 catalogue and announcement */
function announceRows({ t, lang }, ai) {
  return C.courses(t.project_id).filter(c => c.review_status === 'Approved').map(c => {
    const pos = [...new Set(C.gaps(t.project_id).filter(g => g.competency_code === c.competency_code && g.gap_value > 0).map(g => g.position))];
    return { course: c.training_code, audience: pos.join(', '), channel: 'Email', date: today(),
      message: ai ? T(lang, `A new course is open in the catalogue: ${c.name_text} (${c.hours} h, ${c.modality}). It targets level ${c.level === 'Intermediate' ? 3 : 2} and is planned for ${pos.join(', ')}. You will receive your invitation with the date and the room.`, `Une nouvelle formation est ouverte au catalogue : ${c.name_text} (${c.hours} h, ${c.modality === 'On site' ? 'présentiel' : c.modality === 'Blended' ? 'mixte' : c.modality}). Elle vise le niveau ${c.level === 'Intermediate' ? 3 : 2} et est prévue pour : ${pos.join(', ')}. Vous recevrez votre convocation avec la date et la salle.`, `تكوين جديد في الفهرس: ${c.name_text}.`)
        : T(lang, `New in the catalogue: ${c.name_text}. Invitations will follow.`, `Nouveau au catalogue : ${c.name_text}. Les convocations suivront.`, `جديد في الفهرس: ${c.name_text}.`) };
  });
}
async function publish({ req, t, rows }) {
  let n = 0;
  for (const r of rows) {
    const c = C.courseByCode(t.project_id, str(r.course)); if (!c) continue; C.patch(c._id, { status: 'Published', published_at: today() }, req.user.id);
    const aud = C.split(r.audience).map(norm); const people = C.employees(t.project_id).filter(e => !aud.length || aud.includes(norm(e.position)));
    for (const e of people) { const res = await C.message(req, t, { name: e.name, email: e.email, phone: e.phone, channel: r.channel === 'Application' ? 'Application' : r.channel, user_id: C.contactOf(req.orgId, t.project_id, e.name).user_id }, T(req.lang, `New course: ${c.name_text}`, `Nouvelle formation : ${c.name_text}`, `تكوين جديد: ${c.name_text}`), `${T(req.lang, `Hello ${e.name},`, `Bonjour ${e.name},`, `مرحبا ${e.name}،`)}\n${str(r.message)}`, 'announcement'); if (res.status !== 'failed') n++; }
  }
  return { sent: n };
}
function messagesPanel(kind, title) { return ({ t, lang }) => { const m = C.messagesOf(t.project_id, kind); return { tables: [{ title: title(lang), columns: [['to', T(lang, 'To', 'À', 'إلى')], ['channel', T(lang, 'Channel', 'Canal', 'القناة')], ['subject', T(lang, 'Subject', 'Objet', 'الموضوع')], ['status', T(lang, 'Status', 'Statut', 'الحالة')], ['at', T(lang, 'Sent', 'Envoyé', 'أرسل')]],
  rows: m.map(x => ({ to: x.recipient, channel: x.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail', subject: x.subject, status: x.status, at: fmtD(x.created_at, lang) })) }] }; }; }

/* ------------------------------------------------------------------ MP-11.1 rooms, MP-11.2 trainers */
function roomRows({ req, t, lang }, ai) {
  const p = C.projectOf(t.project_id); const site = C.stakeholders(t.project_id).find(s => s.site)?.site || C.orgOf(req.orgId).city || ''; const max = Math.max(12, ...C.courses(t.project_id).map(c => Math.ceil((c.learners || []).length / Math.max(1, c.groups || 1))));
  const rows = [{ item: T(lang, `Training room — ${site}`, `Salle de formation — ${site}`, `قاعة التكوين — ${site}`), site, capacity: String(max), start: dplus(14), end: C.yearEnd(p), cost: '0', equipment: T(lang, 'Projector, screen, 12 laptops', 'Vidéoprojecteur, écran, 12 ordinateurs portables', 'جهاز عرض وحواسيب') }];
  if (ai && C.courses(t.project_id).some(c => /triage|urgen|imag|simul/i.test(c.name_text))) rows.push({ item: T(lang, `Simulation room (emergency box) — ${site}`, `Salle de simulation (box des urgences) — ${site}`, `قاعة المحاكاة — ${site}`), site, capacity: '6', start: dplus(14), end: C.yearEnd(p), cost: '0', equipment: T(lang, 'Patient monitor, workstation with the AI tool', 'Moniteur patient, poste équipé de l’outil d’IA', 'جهاز مراقبة وحاسوب') });
  return rows;
}
function trainerRows({ req, t, lang }, ai) {
  const p = C.projectOf(t.project_id); const cs = C.courses(t.project_id); const rows = [];
  for (const u of C.all(`SELECT u.name, u.email FROM users u JOIN user_roles r ON r.user_id=u.id AND r.role_id='R-11' WHERE u.org_id=? AND u.active=1`, req.orgId)) rows.push({ item: u.name, organisation: T(lang, 'Internal', 'Interne', 'داخلي'), email: u.email, phone: '', start: dplus(14), end: C.yearEnd(p), courses: (ai ? cs.filter(c => c.provider !== 'External') : cs).map(c => c.training_code).join(', '), dayRate: '0' });
  if (ai) for (const c of cs.filter(x => x.provider === 'External')) { const v = C.all(`SELECT data FROM records WHERE entity='Vendor' AND org_id=?`, req.orgId).map(x => C.J(x.data, {}))[0]; if (v) rows.push({ item: '', organisation: C.pick(v.legal_name, lang) || C.pick(v.label, lang), email: '', phone: '', start: dplus(21), end: C.yearEnd(p), courses: c.training_code, dayRate: String(7000) }); }
  return rows;
}
function completeRooms({ req, t, rows }) { const keep = new Set(); for (const r of rows) { const k = 'room|' + norm(str(r.item)); keep.add(k); C.upsert(req, t, 'TrainingRoom', k, { name: str(r.item), site: str(r.site), capacity: num(r.capacity), available_from: r.start || null, available_to: r.end || null, cost: num(r.cost), equipment: str(r.equipment), flow_step: 'MP-11.1' }); } C.prune('TrainingRoom', t.project_id, 'MP-11.1', keep); }
function completeTrainers({ req, t, rows }) {
  const keep = new Set(); const internal = new Set(['interne', 'internal', 'داخلي']);
  for (const r of rows) { const k = 'trainer|' + norm(str(r.item)); keep.add(k); const org = str(r.organisation);
    C.upsert(req, t, 'Trainer', k, { name: str(r.item), organisation: org, external: !!org && !internal.has(norm(org)), email: r.email || null, phone: r.phone || null, available_from: r.start || null, available_to: r.end || null, courses: C.split(r.courses), day_rate: num(r.dayRate), flow_step: 'MP-11.2' });
    if (org && !internal.has(norm(org)) && !C.one(`SELECT id FROM records WHERE entity='Vendor' AND org_id=? AND (json_extract(data,'$.legal_name')=? OR json_extract(data,'$.legal_name.en')=?)`, req.orgId, org, org)) C.upsert(req, t, 'Vendor', 'vendor|' + norm(org), { legal_name: ml(org), label: ml(org), flow_step: 'MP-11.2' }); }
  C.prune('Trainer', t.project_id, 'MP-11.2', keep);
}

/* ------------------------------------------------------------------ MP-07.1 sessions, MP-07.2 conflicts */
const nextMonday = (from, w) => { const d = new Date(from); d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + 7 * w); return d.toISOString().slice(0, 10); };
function sessionRows({ req, t, lang }, ai) {
  const cs = C.courses(t.project_id).filter(c => c.status === 'Published' || c.review_status === 'Approved'); const rm = C.rooms(t.project_id); const tr = C.trainers(t.project_id); const rows = []; const busy = new Set(); let n = 0; let w = 0;
  for (const c of cs) for (let g = 0; g < (c.groups || 1); g++) {
    let date = nextMonday(dplus(14), w++); const trainer = tr.find(x => x.courses?.map(norm).includes(norm(c.training_code))) || tr[0]; const room = (ai && /triage|urgen|simul/i.test(c.name_text) ? rm.find(r => /simul/i.test(r.name)) : null) || rm[0];
    if (ai) while (busy.has(`${date}|${trainer?.name}`) || busy.has(`${date}|${room?.name}`) || (trainer?.available_from && date < trainer.available_from)) date = C.dplus(1, date);
    busy.add(`${date}|${trainer?.name}`); busy.add(`${date}|${room?.name}`);
    rows.push({ code: `S-${String(++n).padStart(2, '0')}`, course: c.training_code, date, time: '09:00', hours: String(c.hours || 7), room: room?.name || '', trainer: trainer?.name || '', capacity: String(Math.min(room?.capacity || 12, 12)), modality: c.modality || 'On site' });
  }
  return rows;
}
function completeSessions({ req, t, rows }) {
  const keep = new Set();
  for (const r of rows) { const k = 'session|' + norm(str(r.code)); keep.add(k); const c = C.courseByCode(t.project_id, str(r.course));
    C.upsert(req, t, 'Session', k, { code: str(r.code), label: ml(`${r.code} ${c?.name_text || r.course}`), course_code: c?.training_code || str(r.course), course: c?.name_text || str(r.course), competency_code: c?.competency_code || null, start_date: r.date, start_time: str(r.time) || '09:00', start_at: `${r.date}T${str(r.time) || '09:00'}:00`,
      hours: num(r.hours), room: str(r.room), trainer: str(r.trainer), capacity: num(r.capacity), modality: r.modality || 'On site', status: 'Planned', flow_step: 'MP-07.1' }, str(r.code)); }
  C.prune('Session', t.project_id, 'MP-07.1', keep);
}
function conflicts(t, lang) {
  const ss = C.sessions(t.project_id); const rm = C.rooms(t.project_id); const tr = C.trainers(t.project_id); const out = [];
  for (let i = 0; i < ss.length; i++) {
    const s = ss[i]; for (let j = i + 1; j < ss.length; j++) { const o = ss[j]; if (s.start_date !== o.start_date) continue;
      if (s.trainer && norm(s.trainer) === norm(o.trainer)) out.push({ session: `${s.code} / ${o.code}`, problem: T(lang, `Trainer ${s.trainer} booked twice on ${fmtD(s.start_date, lang)}`, `Formateur ${s.trainer} réservé deux fois le ${fmtD(s.start_date, lang)}`, `المكون محجوز مرتين`) });
      if (s.room && norm(s.room) === norm(o.room)) out.push({ session: `${s.code} / ${o.code}`, problem: T(lang, `Room ${s.room} booked twice on ${fmtD(s.start_date, lang)}`, `Salle ${s.room} réservée deux fois le ${fmtD(s.start_date, lang)}`, `القاعة محجوزة مرتين`) }); }
    const r = rm.find(x => norm(x.name) === norm(s.room)); if (r?.capacity && s.capacity > r.capacity) out.push({ session: s.code, problem: T(lang, `Capacity ${s.capacity} above the room (${r.capacity})`, `Capacité ${s.capacity} supérieure à la salle (${r.capacity})`, `السعة أكبر من القاعة`) });
    const x = tr.find(y => norm(y.name) === norm(s.trainer)); if (x && ((x.available_from && s.start_date < x.available_from) || (x.available_to && s.start_date > x.available_to))) out.push({ session: s.code, problem: T(lang, `${s.trainer} not available on ${fmtD(s.start_date, lang)}`, `${s.trainer} indisponible le ${fmtD(s.start_date, lang)}`, `المكون غير متاح`) });
    if (!s.trainer) out.push({ session: s.code, problem: T(lang, 'No trainer', 'Aucun formateur', 'لا مكون') });
  }
  return out;
}
function conflictsPanel({ t, lang }) { const c = conflicts(t, lang); const ss = C.sessions(t.project_id);
  return { kpis: [{ label: T(lang, 'Sessions', 'Sessions', 'الدورات'), value: ss.length }, { label: T(lang, 'Conflicts', 'Conflits', 'تعارضات'), value: c.length }],
    notes: c.length ? [T(lang, 'Correct the sessions in step MP-07.1 (task “Plan the sessions”), then complete this step.', 'Corrigez les sessions à l’étape MP-07.1 (tâche « Planifier les sessions »), puis terminez cette étape.', 'صحح الدورات ثم أنه الخطوة.')] : [T(lang, 'No conflict: rooms, trainers, dates and capacities are consistent.', 'Aucun conflit : salles, formateurs, dates et capacités sont cohérents.', 'لا تعارض.')],
    tables: [{ title: T(lang, 'Schedule', 'Planning', 'البرمجة'), csv: true, columns: [['code', T(lang, 'Session', 'Session', 'الدورة')], ['course', T(lang, 'Course', 'Formation', 'التكوين')], ['date', T(lang, 'Date', 'Date', 'التاريخ')], ['room', T(lang, 'Room', 'Salle', 'القاعة')], ['trainer', T(lang, 'Trainer', 'Formateur', 'المكون')], ['capacity', T(lang, 'Capacity', 'Capacité', 'السعة')]],
      rows: ss.map(s => ({ code: s.code, course: `${s.course_code} — ${s.course}`, date: `${fmtD(s.start_date, lang)} ${s.start_time}`, room: s.room, trainer: s.trainer, capacity: s.capacity })) },
    ...(c.length ? [{ title: T(lang, 'Conflicts', 'Conflits', 'تعارضات'), columns: [['session', T(lang, 'Session', 'Session', 'الدورة')], ['problem', T(lang, 'Problem', 'Problème', 'المشكلة')]], rows: c }] : [])] }; }

/* ------------------------------------------------------------------ MP-07.3 enrolment, MP-07.4 invitations, MP-17.1 accounts */
function enrolRows({ t }, ai) {
  const out = []; const taken = new Map();
  for (const s of C.sessions(t.project_id)) {
    const gs = C.gaps(t.project_id).filter(g => g.competency_code === s.competency_code && g.gap_value > 0).sort((a, b) => ai ? (b.is_critical - a.is_critical) || (b.gap_value - a.gap_value) : 0);
    let n = 0; for (const g of gs) { if (n >= (s.capacity || 12)) break; const k = `${s.course_code}|${norm(g.employee)}`; if (taken.has(k)) continue; if (ai && out.some(r => r.item === g.employee && C.sessionByCode(t.project_id, r.session)?.start_date === s.start_date)) continue;
      const e = C.empByName(t.project_id, g.employee); taken.set(k, 1); n++; out.push({ session: s.code, item: g.employee, email: e?.email || '', phone: e?.phone || '', channel: e?.channel || 'Email', manager: e?.manager || '' }); }
  }
  return out;
}
function completeEnrol({ req, t, rows }) {
  const bad = rows.filter(r => (r.channel === 'Email' && !r.email) || (r.channel === 'WhatsApp' && !r.phone)).map(r => str(r.item)); if (bad.length) throw C.err('err.flowMissingAddress', { names: bad.join(', ') });
  const keep = new Set();
  for (const r of rows) { const s = C.sessionByCode(t.project_id, str(r.session)); const name = str(r.item); const k = `enr|${norm(r.session)}|${norm(name)}`; keep.add(k); const e = C.empByName(t.project_id, name);
    C.upsert(req, t, 'Enrollment', k, { name, label: ml(name), employee_id: e?._id || null, session_id: s?._id || null, session_code: str(r.session), course_code: s?.course_code || null, competency_code: s?.competency_code || null, email: r.email || null, phone: r.phone || null, channel: r.channel, manager: str(r.manager) || e?.manager || null,
      manager_email: e?.manager_email || C.contactOf(req.orgId, t.project_id, str(r.manager)).email || null, manager_phone: e?.manager_phone || null, attendance_status: null, completion_status: 'Not started', flow_step: 'MP-07.3' }); }
  C.prune('Enrollment', t.project_id, 'MP-07.3', keep);
}
const sessionText = (s, lang) => [`${T(lang, 'Course', 'Formation', 'التكوين')} : ${s.course_code} — ${s.course}`, `${T(lang, 'Date', 'Date', 'التاريخ')} : ${fmtD(s.start_date, lang)} ${T(lang, 'at', 'à', 'على')} ${s.start_time}`, `${T(lang, 'Duration', 'Durée', 'المدة')} : ${s.hours} h`, `${T(lang, 'Room', 'Salle', 'القاعة')} : ${s.room || '—'}`, `${T(lang, 'Trainer', 'Formateur', 'المكون')} : ${s.trainer || '—'}`].join('\n');
async function sendConvocations({ req, t }, purpose = 'convocation', only = null) {
  const lang = req.lang; const forms = []; const people = [];
  for (const s of C.sessions(t.project_id).filter(x => !only || only.includes(x.code))) {
    const code = `${purpose === 'simulation' ? 'SIM' : 'SES'}-${s.code}`; const sc = purpose === 'simulation' ? C.rowsOfStep(t.project_id, 'MP-30.3').find(r => norm(r.session) === norm(s.code)) : null;
    forms.push({ code, name: ml(purpose === 'simulation' ? T(lang, `Simulation — ${s.course} — ${fmtD(sc?.date || s.start_date, lang)}`, `Simulation — ${s.course} — ${fmtD(sc?.date || s.start_date, lang)}`, `محاكاة — ${s.course}`) : T(lang, `Invitation — ${s.course} — ${fmtD(s.start_date, lang)} ${s.start_time}`, `Convocation — ${s.course} — ${fmtD(s.start_date, lang)} ${s.start_time}`, `استدعاء — ${s.course}`)), population: 'Member', session: s.code,
      sections: [note(T(lang, 'Your session', 'Votre session', 'دورتك'), (sc ? `${str(sc.message)}\n` : '') + sessionText(s, lang)), yesno('confirm', T(lang, 'I confirm that I will attend', 'Je confirme ma présence', 'أؤكد حضوري'))] });
    for (const e of learnersOf(t).filter(x => norm(x.session_code) === norm(s.code))) people.push({ key: `${purpose}:${e._id}`, name: e.name, email: e.email, phone: e.phone, channel: purpose === 'simulation' && sc?.channel ? sc.channel : e.channel, form: code, population: 'Member', lang });
  }
  const q = C.campaign(req, t, purpose, ml(purpose === 'simulation' ? T(lang, 'Simulation sessions', 'Séances de simulation', 'جلسات المحاكاة') : T(lang, 'Invitations to the training sessions', 'Convocations aux sessions de formation', 'الاستدعاءات لدورات التكوين')), forms, { days: 30 });
  const r = await C.invite(req, q, people);
  if (purpose === 'convocation') for (const e of learnersOf(t)) C.patch(e._id, { convocation_sent_at: C.now() }, req.user.id);
  return r;
}
export function confirmations(req, t, purpose = 'convocation') {
  const q = C.campaignOf(req.orgId, t.project_id, purpose); const m = new Map(); if (!q) return m;
  for (const i of C.invitationsOf(req.orgId, q)) m.set(i.stakeholder_id.split(':').pop(), { status: i.status, confirm: i.answers?.confirm?.confirm?.value || null, comment: i.answers?.confirm?.confirm?.comment || '', opened: !!i.opened_at, at: i.responded_at, channel: i.channel_plan?.[0]?.channel });
  return m;
}
function convocationsPanel({ req, t, lang }) {
  const cf = confirmations(req, t); const en = learnersOf(t);
  return { kpis: [{ label: T(lang, 'Learners', 'Apprenants', 'المتعلمون'), value: en.length }, { label: T(lang, 'Invitations sent', 'Convocations envoyées', 'استدعاءات مرسلة'), value: [...cf.values()].length }, { label: T(lang, 'Confirmed', 'Confirmées', 'مؤكدة'), value: [...cf.values()].filter(x => x.confirm === 'Yes').length }],
    tables: [{ title: T(lang, 'Invitations', 'Convocations', 'الاستدعاءات'), csv: true, columns: [['session', T(lang, 'Session', 'Session', 'الدورة')], ['name', T(lang, 'Learner', 'Apprenant', 'المتعلم')], ['channel', T(lang, 'Channel', 'Canal', 'القناة')], ['status', T(lang, 'Status', 'Statut', 'الحالة')], ['confirm', T(lang, 'Confirmed', 'Confirmé', 'مؤكد')]],
      rows: en.map(e => { const c = cf.get(e._id); return { session: e.session_code, name: e.name, channel: e.channel === 'WhatsApp' ? 'WhatsApp' : 'E-mail', status: c ? C.statusLabel(c.status, lang) : T(lang, 'Not sent', 'Non envoyée', 'غير مرسل'), confirm: c?.confirm ? (c.confirm === 'Yes' ? T(lang, 'Yes', 'Oui', 'نعم') : T(lang, 'No', 'Non', 'لا')) + (c.comment ? ` — ${c.comment}` : '') : '—' }; }) }],
    actions: [{ key: 'send', label: cf.size ? T(lang, 'Send the invitations not yet sent', 'Envoyer les convocations restantes', 'إرسال الباقي') : T(lang, 'Send the invitations', 'Envoyer les convocations', 'إرسال الاستدعاءات'), icon: 'Send', primary: !cf.size }, ...(cf.size ? [{ key: 'remind', label: T(lang, 'Remind those who have not confirmed', 'Relancer ceux qui n’ont pas confirmé', 'تذكير'), icon: 'BellRing' }] : [])] };
}
function provision(req, t) {
  let created = 0; const out = [];
  for (const e of learnersOf(t)) {
    if (!e.email) { out.push({ name: e.name, email: '—', status: 'noEmail' }); continue; }
    const ex = C.one(`SELECT id FROM users WHERE lower(email)=lower(?)`, e.email);
    if (ex) { C.run(`INSERT OR IGNORE INTO user_roles(user_id,role_id) VALUES(?,'R-12')`, ex.id); out.push({ name: e.name, email: e.email, status: 'exists' }); continue; }
    const id = C.uuid(); C.run(`INSERT INTO users(id,org_id,email,name,password_hash,language,title,created_at) VALUES(?,?,?,?,?,?,?,?)`, id, req.orgId, e.email, e.name, hashPassword(C.uuid()), req.lang, 'Employee / Learner', C.now());
    C.run(`INSERT OR IGNORE INTO user_roles(user_id,role_id) VALUES(?,'R-12')`, id); created++; out.push({ name: e.name, email: e.email, status: 'created' });
  }
  C.patch(C.recs('TrainingPlan', t.project_id).find(x => x.flow_key === 'plan')?._id || '', { accounts_provisioned_at: C.now() }, req.user.id);
  return { created, out };
}
function provisionPanel({ req, t, lang }) {
  const en = learnersOf(t); const rows = en.map(e => { const u = e.email && C.one(`SELECT u.id, (SELECT 1 FROM user_roles r WHERE r.user_id=u.id AND r.role_id='R-12') learner FROM users u WHERE lower(email)=lower(?)`, e.email); return { name: e.name, email: e.email || '—', account: u ? (u.learner ? T(lang, 'Learner account', 'Compte apprenant', 'حساب متعلم') : T(lang, 'Account (other role)', 'Compte (autre rôle)', 'حساب')) : '—' }; });
  return { notes: [T(lang, 'Each learner with an e-mail address gets a learner account (single sign-on of the organization; no password is sent).', 'Chaque apprenant ayant une adresse e-mail reçoit un compte apprenant (authentification unique de l’organisation ; aucun mot de passe n’est envoyé).', 'لكل متعلم حساب.')],
    tables: [{ title: T(lang, 'Learner accounts', 'Comptes des apprenants', 'حسابات المتعلمين'), columns: [['name', T(lang, 'Learner', 'Apprenant', 'المتعلم')], ['email', 'E-mail'], ['account', T(lang, 'Account', 'Compte', 'الحساب')]], rows }],
    actions: [{ key: 'provision', label: T(lang, 'Create the learner accounts', 'Créer les comptes apprenants', 'إنشاء الحسابات'), icon: 'UserPlus', primary: true }] };
}

/* ------------------------------------------------------------------ MP-25 capsules */
function capsuleRows({ t, lang }, ai) {
  return C.courses(t.project_id).map(c => { const first = C.sessions(t.project_id).find(s => s.course_code === c.training_code);
    const pts = (c.objectives || []).map(o => `• ${str(o, lang)}`).join('\n');
    const text = ai ? T(lang, `${c.name_text} in 3 points:\n${pts}\nQuestion: in which situation of your day will you use it first?`, `${c.name_text} en 3 points :\n${pts}\nQuestion : dans quelle situation de votre journée allez-vous l’utiliser en premier ?`, `${c.name_text} في 3 نقاط:\n${pts}`)
      : T(lang, `Did you know? ${c.name_text}:\n${pts}`, `Le saviez-vous ? ${c.name_text} :\n${pts}`, `هل تعلم؟ ${c.name_text}:\n${pts}`);
    return { item: T(lang, `The essentials — ${c.name_text}`, `L’essentiel — ${c.name_text}`, `الأساسيات — ${c.name_text}`), course: c.training_code, text, minutes: '3', channel: 'WhatsApp', sendDate: first ? C.dplus(2, first.start_date) : dplus(30) }; });
}
function draftRows({ t, lang }, ai) { return C.courses(t.project_id).map(c => ({ source: T(lang, `Course material — ${c.name_text}`, `Support de cours — ${c.name_text}`, `دعامة الدرس — ${c.name_text}`), course: c.training_code, item: T(lang, `Check before you act — ${c.name_text}`, `Vérifier avant d’agir — ${c.name_text}`, `تحقق قبل التصرف — ${c.name_text}`),
  text: ai ? T(lang, `Before following a suggestion of ${c.name_text}: 1) check the data it used, 2) compare with your own assessment, 3) record what you decided and why.`, `Avant de suivre une suggestion de ${c.name_text} : 1) vérifiez les données utilisées, 2) comparez avec votre propre évaluation, 3) tracez ce que vous avez décidé et pourquoi.`, `قبل اتباع اقتراح: تحقق، قارن، وثق.`) : T(lang, `Summary of the course material of ${c.name_text}.`, `Résumé du support de cours de ${c.name_text}.`, `ملخص دعامة ${c.name_text}.`), status: 'To validate' })); }
function completeCapsules(step) { return ({ req, t, rows }) => { const keep = new Set(); for (const r of rows) { const k = `cap|${step}|${norm(str(r.item))}`; keep.add(k); C.upsert(req, t, 'ContentAsset', k, { format: 'Capsule', name_text: str(r.item), label: ml(str(r.item)), course_code: str(r.course), text: str(r.text), minutes: num(r.minutes), channel: r.channel || 'WhatsApp', send_date: r.sendDate || null, source: str(r.source) || null, status: step === 'MP-25.2' ? (r.status || 'To validate') : 'Published', language: req.lang, flow_step: step }); } C.prune('ContentAsset', t.project_id, step, keep); }; }
async function pushCapsules({ req, t }) {
  const lang = req.lang; const forms = []; const people = [];
  for (const [i, c] of C.capsules(t.project_id).filter(x => x.status === 'Published').entries()) {
    const code = `CAP-${i + 1}`; forms.push({ code, name: ml(c.name_text), population: 'Member', capsule: c.name_text, sections: [note(c.name_text, c.text), yesno('useful', T(lang, 'This capsule was useful to me', 'Cette capsule m’a été utile', 'كانت هذه الكبسولة مفيدة'))] });
    for (const e of learnersOf(t, c.course_code)) people.push({ key: `cap:${c._id}:${e._id}`, name: e.name, email: e.email, phone: e.phone, channel: c.channel === 'Email' || !e.phone ? 'Email' : 'WhatsApp', form: code, lang });
  }
  return C.invite(req, C.campaign(req, t, 'capsule', ml(T(lang, 'Micro-learning capsules', 'Capsules de micro-apprentissage', 'كبسولات التعلم المصغر')), forms, { days: 30 }), people);
}
function capsuleStatus(req, t) { const q = C.campaignOf(req.orgId, t.project_id, 'capsule'); if (!q) return []; return C.invitationsOf(req.orgId, q).map(i => ({ learner: i.name, capsule: (q.forms || []).find(f => f.code === i.template_code)?.capsule, opened: !!i.opened_at || i.status === 'Responded', answered: i.status === 'Responded', at: (i.responded_at || i.opened_at || '').slice(0, 10), useful: i.answers?.useful?.useful?.value })); }
function capsulePanel({ req, t, lang }, push) {
  const s = capsuleStatus(req, t); const by = new Map(); for (const x of s) { const a = by.get(x.capsule) || { capsule: x.capsule, sent: 0, opened: 0, answered: 0 }; a.sent++; if (x.opened) a.opened++; if (x.answered) a.answered++; by.set(x.capsule, a); }
  const rate = s.length ? Math.round((s.filter(x => x.opened).length / s.length) * 100) : null; if (!push && rate != null) C.kpiValue(req, t, 'KPI-030', rate);
  return { kpis: [{ label: T(lang, 'Capsules sent', 'Capsules envoyées', 'كبسولات مرسلة'), value: s.length }, { label: T(lang, 'Opened', 'Ouvertes', 'مفتوحة'), value: rate == null ? '—' : `${rate} %` }],
    tables: [{ title: T(lang, 'By capsule', 'Par capsule', 'حسب الكبسولة'), columns: [['capsule', T(lang, 'Capsule', 'Capsule', 'الكبسولة')], ['sent', T(lang, 'Sent', 'Envoyées', 'مرسلة')], ['opened', T(lang, 'Opened', 'Ouvertes', 'مفتوحة')], ['answered', T(lang, 'Answered', 'Répondu', 'أجاب')]], rows: [...by.values()] }],
    actions: push ? [{ key: 'push', label: s.length ? T(lang, 'Send the capsules not yet sent', 'Envoyer les capsules restantes', 'إرسال الباقي') : T(lang, 'Send the capsules to the learners', 'Envoyer les capsules aux apprenants', 'إرسال الكبسولات'), icon: 'Send', primary: !s.length }] : [] };
}

/* ------------------------------------------------------------------ MP-30 simulations */
const SCEN = [[/triage|urgen|decision clinique|decision support/, L2 => T(L2, 'A 67-year-old patient arrives at the emergency room with chest pain. The AI triage tool proposes a priority level. Check the data entered, decide the priority and explain your choice.', 'Un patient de 67 ans arrive aux urgences avec une douleur thoracique. L’outil de triage IA propose un niveau de priorité. Vérifiez les données saisies, décidez de la priorité et expliquez votre choix.', 'مريض في الـ67 يصل إلى المستعجلات بألم في الصدر.')],
  [/imag|radio/, L2 => T(L2, 'A chest X-ray is flagged by the AI tool as “suspicion of nodule”. Review the image and the flag, decide what to report to the radiologist and record it.', 'Une radiographie thoracique est signalée par l’outil d’IA comme « suspicion de nodule ». Examinez l’image et le signalement, décidez ce que vous transmettez au radiologue et tracez-le.', 'صورة صدرية مُعلَّمة من أداة الذكاء الاصطناعي.')]];
function scenarioRows({ req, t, lang }, ai) { return C.courses(t.project_id).map(c => { const m = SCEN.find(([rx]) => rx.test(norm(c.name_text)));
  return { item: T(lang, `Case — ${c.name_text}`, `Cas — ${c.name_text}`, `حالة — ${c.name_text}`), course: c.training_code, situation: m ? m[1](lang) : T(lang, `A real situation of the position where ${c.name_text} is needed.`, `Une situation réelle du poste où ${c.name_text} est nécessaire.`, `وضعية حقيقية.`), expected: ai ? (c.objectives || []).map(o => str(o, lang)).join(' ; ') : '', owner: req.user.name }; }); }
const RUBRIC = lang => [[T(lang, 'Collects and checks the data', 'Recueil et vérification des données', 'جمع البيانات والتحقق منها'), 25], [T(lang, 'Uses the AI tool correctly', 'Utilisation correcte de l’outil d’IA', 'الاستعمال الصحيح للأداة'), 25], [T(lang, 'Decision and its justification', 'Décision et justification', 'القرار وتعليله'), 30], [T(lang, 'Communication and record', 'Communication et traçabilité', 'التواصل والتوثيق'), 20]];
function rubricRows({ t, lang }, ai) { const out = []; for (const s of C.scenarios(t.project_id)) for (const [item, w] of RUBRIC(lang)) out.push({ scenario: s.name, item: ai && /imag|radio/.test(norm(s.course_name || s.name)) && w === 25 && out.length % 4 === 1 ? T(lang, 'Spots the AI flags and their limits', 'Repère les signalements de l’IA et leurs limites', 'يرصد تنبيهات الأداة') : item, weight: String(w), pass: '70' }); return out; }
function completeScenarios({ req, t, rows }) { const keep = new Set(); for (const r of rows) { const k = 'scen|' + norm(str(r.item)); keep.add(k); const c = C.courseByCode(t.project_id, str(r.course)); C.upsert(req, t, 'SimulationScenario', k, { name: str(r.item), course_code: str(r.course), course_name: c?.name_text || '', situation: str(r.situation), expected: str(r.expected), owner: str(r.owner), flow_step: 'MP-30.1' }); } C.prune('SimulationScenario', t.project_id, 'MP-30.1', keep); }
function launchRows({ t, lang }, ai) { const out = []; for (const s of C.sessions(t.project_id)) { const sc = C.scenarios(t.project_id).find(x => x.course_code === s.course_code); if (!sc) continue;
  out.push({ session: s.code, scenario: sc.name, date: s.start_date, channel: ai ? (learnersOf(t).filter(e => e.session_code === s.code).every(e => e.phone) ? 'WhatsApp' : 'Email') : 'Email', message: T(lang, `During the session, you will take part in a simulation: “${sc.name}”. It takes about 20 minutes and is assessed on a grid shared beforehand.`, `Pendant la session, vous participerez à une simulation : « ${sc.name} ». Elle dure environ 20 minutes et est évaluée sur une grille partagée à l’avance.`, `ستشارك في محاكاة: «${sc.name}».`) }); } return out; }
function captureRows({ t }) { const out = []; for (const r of C.rowsOfStep(t.project_id, 'MP-30.3')) for (const e of learnersOf(t).filter(x => norm(x.session_code) === norm(r.session))) out.push({ item: e.name, scenario: str(r.scenario), score: '', observation: '' }); return out; }
function debriefRows({ t, lang }, ai) { return C.rowsOfStep(t.project_id, 'MP-30.4').map(r => { const s = num(r.score) ?? 0; const ok = s >= 70;
  return { item: str(r.item), date: today(), strengths: ai ? (ok ? T(lang, `Score ${s} %: the decision is justified and recorded. ${str(r.observation)}`, `Score ${s} % : la décision est justifiée et tracée. ${str(r.observation)}`, `النتيجة ${s}%.`) : T(lang, `Score ${s} %: data collected. ${str(r.observation)}`, `Score ${s} % : données recueillies. ${str(r.observation)}`, `النتيجة ${s}%.`)) : '',
    improvements: ai ? (ok ? T(lang, 'Say aloud the limits of the AI suggestion before deciding.', 'Verbaliser les limites de la suggestion de l’IA avant de décider.', 'ذكر حدود الاقتراح.') : T(lang, 'Check the data entered in the tool before reading its suggestion; justify the decision.', 'Vérifier les données saisies dans l’outil avant de lire sa suggestion ; justifier la décision.', 'التحقق من البيانات قبل القرار.')) : '', next: ok ? T(lang, 'Apply at work; observation at day 30', 'Mettre en pratique ; observation à J+30', 'تطبيق في العمل') : T(lang, 'Second simulation at the next session', 'Seconde simulation à la prochaine session', 'محاكاة ثانية') }; }); }
function simEvidence(req, t) { let n = 0; for (const r of C.rowsOfStep(t.project_id, 'MP-30.4')) { const e = C.enrollments(t.project_id).find(x => norm(x.name) === norm(str(r.item))); C.upsert(req, t, 'Evaluation', `sim|${norm(str(r.item))}|${norm(str(r.scenario))}`, { label: ml(`Simulation — ${str(r.scenario)}`), enrollment_id: e?._id || null, learner: str(r.item), kind: 'Simulation', level: 2, score_pct: num(r.score), passed: (num(r.score) ?? 0) >= 70, observation: str(r.observation), flow_step: 'MP-30.6' }); n++; } return n; }
function simPanel({ req, t, lang }) { const ev = C.recs('Evaluation', t.project_id).filter(x => x.kind === 'Simulation');
  return { kpis: [{ label: T(lang, 'Simulations recorded', 'Simulations enregistrées', 'محاكاة مسجلة'), value: ev.length }, { label: T(lang, 'Average score', 'Score moyen', 'المعدل'), value: ev.length ? `${fmtN(avg(ev.map(x => x.score_pct)), lang)} %` : '—' }],
    tables: [{ title: T(lang, 'Simulation evidence', 'Preuves de simulation', 'أدلة المحاكاة'), columns: [['learner', T(lang, 'Learner', 'Apprenant', 'المتعلم')], ['score', 'Score (%)'], ['passed', T(lang, 'Passed', 'Réussi', 'ناجح')]], rows: ev.map(x => ({ learner: x.learner, score: x.score_pct, passed: x.passed ? '✓' : '✗' })) }],
    actions: [{ key: 'record', label: T(lang, 'Record the evidence', 'Enregistrer les preuves', 'تسجيل الأدلة'), icon: 'Save', primary: true }] }; }

/* ------------------------------------------------------------------ MP-07.5 attendance, MP-07.6 closure, MP-11 invoices */
function attendanceRows({ req, t }) { const cf = confirmations(req, t); return learnersOf(t).map(e => { const s = C.sessionByCode(t.project_id, e.session_code); const c = cf.get(e._id); const absent = c?.confirm === 'No';
  return { session: e.session_code, item: e.name, status: absent ? 'Absent' : 'Present', hours: absent ? '0' : String(s?.hours || 7), signed: absent ? 'No' : 'Yes' }; }); }
function completeAttendance({ req, t, rows }) { for (const r of rows) { const e = C.enrollments(t.project_id).find(x => norm(x.name) === norm(str(r.item)) && norm(x.session_code) === norm(str(r.session))); if (e) C.patch(e._id, { attendance_status: r.status, hours_attended: num(r.hours), sheet_signed: r.signed === 'Yes' }, req.user.id); }
  const en = C.enrollments(t.project_id); const att = en.filter(x => x.attendance_status); if (att.length) C.kpiValue(req, t, 'FLOW-ATT', Math.round((att.filter(x => x.attendance_status === 'Present').length / att.length) * 100));
  const ss = C.sessions(t.project_id); const cap = ss.reduce((s, x) => s + (x.capacity || 0), 0); if (cap) C.kpiValue(req, t, 'KPI-008', Math.round((en.length / cap) * 100)); }
function attendanceStats(t, lang) { const en = C.enrollments(t.project_id); const pr = en.filter(x => x.attendance_status === 'Present').length; return { en, pr, text: T(lang, `${C.sessions(t.project_id).length} session(s), ${en.length} learner(s) enrolled, ${pr} present, ${en.filter(x => x.attendance_status === 'Absent').length} absent, ${en.filter(x => x.attendance_status === 'Excused').length} excused.`, `${C.sessions(t.project_id).length} session(s), ${en.length} apprenant(s) inscrit(s), ${pr} présent(s), ${en.filter(x => x.attendance_status === 'Absent').length} absent(s), ${en.filter(x => x.attendance_status === 'Excused').length} excusé(s).`, `${en.length} متعلم.`) }; }
function closeFields({ t, lang }, ai) { const s = attendanceStats(t, lang); const abs = s.en.filter(x => x.attendance_status !== 'Present').map(x => x.name);
  return { decision: 'Approved', subject: C.sessions(t.project_id).map(x => x.code).join(', '), rationale: s.text + (ai && abs.length ? ' ' + T(lang, `To re-enrol in a next session: ${abs.join(', ')}.`, `À réinscrire à une prochaine session : ${abs.join(', ')}.`, `يجب إعادة تسجيل: ${abs.join(', ')}.`) : '') }; }
function completeClose({ req, t, fields }) { if (!/^Approved/.test(fields.decision || '')) return; const codes = C.split(fields.subject).map(norm);
  for (const s of C.sessions(t.project_id).filter(x => !codes.length || codes.includes(norm(x.code)))) { C.patch(s._id, { status: 'Closed', closed_at: today() }, req.user.id);
    for (const e of C.enrollments(t.project_id).filter(x => x.session_code === s.code)) C.patch(e._id, { completion_status: e.attendance_status === 'Present' ? 'Completed' : 'Not completed', completed_at: e.attendance_status === 'Present' ? today() : null }, req.user.id); } }
function invoiceRows({ t }) { let n = 0; return C.sessions(t.project_id).map(s => { const tr = C.trainers(t.project_id).find(x => norm(x.name) === norm(s.trainer)); if (!tr?.external) return null; const pr = C.enrollments(t.project_id).filter(e => e.session_code === s.code && e.attendance_status === 'Present').length;
  return { vendor: tr.organisation, item: '', session: s.code, amount: String(Math.round(((s.hours || 7) / 7) * (tr.day_rate || 0))), participants: String(pr), date: today(), _n: ++n }; }).filter(Boolean).map(({ _n, ...r }) => r); }
function completeInvoices({ req, t, rows }) { const keep = new Set(); for (const r of rows) { const k = 'inv|' + norm(str(r.item)); keep.add(k); C.upsert(req, t, 'Invoice', k, { invoice_number: str(r.item), label: ml(str(r.item)), vendor: str(r.vendor), session_code: str(r.session), amount: num(r.amount), participants: num(r.participants), invoice_date: r.date || null, flow_step: 'MP-11.3' }, str(r.item)); } C.prune('Invoice', t.project_id, 'MP-11.3', keep);
  const b = C.recs('BudgetLine', t.project_id); for (const x of b) { const s = C.sessions(t.project_id).filter(y => norm(y.course) === norm(x.theme)).map(y => y.code); const amt = C.recs('Invoice', t.project_id).filter(i => s.includes(i.session_code)).reduce((a, i) => a + (i.amount || 0), 0); C.patch(x._id, { actual_amount: amt, committed_amount: amt }, req.user.id); } }
function reconcile(t, lang) { const inv = C.recs('Invoice', t.project_id); return inv.map(i => { const pr = C.enrollments(t.project_id).filter(e => e.session_code === i.session_code && e.attendance_status === 'Present').length; return { i, pr, ok: (i.participants ?? pr) === pr }; }); }
function reconcileFields({ t, lang }, ai) { const r = reconcile(t, lang); const bad = r.filter(x => !x.ok);
  const findings = r.length ? r.map(x => `• ${x.i.invoice_number} (${x.i.vendor}, ${x.i.session_code}) : ${x.i.participants} ${T(lang, 'invoiced', 'facturé(s)', 'مفوتر')} / ${x.pr} ${T(lang, 'present', 'présent(s)', 'حاضر')}${x.ok ? ' ✓' : ' ✗'}`).join('\n') : T(lang, 'No external invoice for the period: every session was delivered by internal trainers.', 'Aucune facture externe sur la période : toutes les sessions ont été animées par des formateurs internes.', 'لا فواتير خارجية.');
  return { findings, conclusion: bad.length ? 'Minor corrections' : 'Conforming', followUp: bad.length ? bad.map(x => T(lang, `Ask ${x.i.vendor} for a credit note on ${x.i.invoice_number} (${x.i.participants - x.pr} participant(s) not present).`, `Demander à ${x.i.vendor} un avoir sur ${x.i.invoice_number} (${x.i.participants - x.pr} participant(s) non présent(s)).`, `طلب تصحيح.`)).join('\n') : ai ? T(lang, 'Nothing to correct.', 'Rien à corriger.', 'لا شيء للتصحيح.') : '' }; }

const rem = purpose => async ({ req, t }) => ({ sent: await C.remindNow(req, C.campaignOf(req.orgId, t.project_id, purpose)) });
export const HOOKS = {
  'MP-06.3': { template: ctx => reviewRows(ctx, false), ai: ctx => reviewRows(ctx, true), completeAsync: ctx => sendReviews(ctx), panel: reviewsPanel, actions: { remind: rem('review') }, blocker: ({ t }) => (C.courses(t.project_id).length ? null : 'err.flowNoCourses') },
  'MP-06.4': { template: ctx => decisionRows(ctx, false), ai: ctx => decisionRows(ctx, true), complete: completeDecisions },
  'MP-06.6': { template: ctx => announceRows(ctx, false), ai: ctx => announceRows(ctx, true), completeAsync: ctx => publish(ctx), panel: messagesPanel('announcement', lang => T(lang, 'Announcements sent', 'Annonces envoyées', 'الإعلانات المرسلة')) },
  'MP-11.1': { template: ctx => roomRows(ctx, false), ai: ctx => roomRows(ctx, true), complete: completeRooms },
  'MP-11.2': { template: ctx => trainerRows(ctx, false), ai: ctx => trainerRows(ctx, true), complete: completeTrainers },
  'MP-07.1': { template: ctx => sessionRows(ctx, false), ai: ctx => sessionRows(ctx, true), complete: completeSessions, blocker: ({ t }) => (C.rooms(t.project_id).length && C.trainers(t.project_id).length ? null : 'err.flowNoLogistics') },
  'MP-07.2': { panel: conflictsPanel, blocker: ({ t, lang }) => (!C.sessions(t.project_id).length ? 'err.flowNoSessions' : conflicts(t, lang).length ? 'err.flowConflicts' : null) },
  'MP-07.3': { template: ctx => enrolRows(ctx, false), ai: ctx => enrolRows(ctx, true), complete: completeEnrol },
  'MP-07.4': { panel: convocationsPanel, actions: { send: ctx => sendConvocations(ctx), remind: rem('convocation') }, blocker: ({ req, t }) => (learnersOf(t).length && learnersOf(t).every(e => e.convocation_sent_at) ? null : 'err.flowNotSent') },
  'MP-17.1': { panel: provisionPanel, actions: { provision: ({ req, t }) => ({ created: provision(req, t).created }) }, onComplete: ({ req, t }) => provision(req, t) },
  'MP-25.1': { template: ctx => capsuleRows(ctx, false), ai: ctx => capsuleRows(ctx, true), complete: completeCapsules('MP-25.1') },
  'MP-25.2': { template: ctx => draftRows(ctx, false), ai: ctx => draftRows(ctx, true), complete: completeCapsules('MP-25.2') },
  'MP-25.3': { panel: ctx => capsulePanel(ctx, true), actions: { push: ctx => pushCapsules(ctx) }, blocker: ({ req, t }) => (capsuleStatus(req, t).length ? null : 'err.flowNotSent') },
  'MP-25.4': { template: ({ req, t }) => capsuleStatus(req, t).map(x => ({ item: x.learner, capsule: x.capsule, read: x.opened ? 'Yes' : 'No', date: x.at, comment: x.useful ? (x.useful === 'Yes' ? 'Utile' : 'Peu utile') : '' })) },
  'MP-25.5': { panel: ctx => capsulePanel(ctx, false) },
  'MP-30.1': { template: ctx => scenarioRows(ctx, false), ai: ctx => scenarioRows(ctx, true), complete: completeScenarios },
  'MP-30.2': { template: ctx => rubricRows(ctx, false), ai: ctx => rubricRows(ctx, true), complete: ({ req, t, rows }) => { for (const s of C.scenarios(t.project_id)) C.patch(s._id, { rubric: rows.filter(r => norm(r.scenario) === norm(s.name)).map(r => ({ criterion: str(r.item), weight: num(r.weight), pass: num(r.pass) })) }, req.user.id); } },
  'MP-30.3': { template: ctx => launchRows(ctx, false), ai: ctx => launchRows(ctx, true), completeAsync: ({ req, t, rows }) => sendConvocations({ req, t }, 'simulation', rows.map(r => str(r.session))), panel: ({ req, t, lang }) => { const q = C.campaignOf(req.orgId, t.project_id, 'simulation'); return q ? { tables: [{ title: T(lang, 'Messages to the learners', 'Messages aux apprenants', 'الرسائل'), columns: [['name', T(lang, 'Learner', 'Apprenant', 'المتعلم')], ['status', T(lang, 'Status', 'Statut', 'الحالة')]], rows: C.invitationsOf(req.orgId, q).map(i => ({ name: i.name, status: C.statusLabel(i.status, lang) })) }] } : {}; } },
  'MP-30.4': { template: captureRows },
  'MP-30.5': { template: ctx => debriefRows(ctx, false), ai: ctx => debriefRows(ctx, true) },
  'MP-30.6': { panel: simPanel, actions: { record: ({ req, t }) => ({ records: simEvidence(req, t) }) }, onComplete: ({ req, t }) => simEvidence(req, t) },
  'MP-07.5': { template: attendanceRows, complete: completeAttendance },
  'MP-07.6': { template: ctx => closeFields(ctx, false), ai: ctx => closeFields(ctx, true), complete: completeClose },
  'MP-11.5': { template: ctx => reconcileFields(ctx, false), ai: ctx => reconcileFields(ctx, true) },
  'MP-11.3': { template: invoiceRows, ai: invoiceRows, complete: completeInvoices },
  'MP-11.4': { template: ctx => reconcileFields(ctx, false), ai: ctx => reconcileFields(ctx, true) },
};
export { normalizePhone };
