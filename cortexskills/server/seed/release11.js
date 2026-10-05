// Release 1.1 demonstration data: IF-PAC questionnaire campaigns with respondents, channel plans, messages and
// responses; personas; training programs and trainings with half-day agendas; generated Training Engineering Reports.
import { all, one, run } from '../src/db.js';
import { detUuid as U, S, J, rng, addDays, pick, uuid } from '../src/lib/util.js';
import { insertRecord } from '../src/services/projects.js';
import { t } from '../src/i18n.js';
import * as Q from '../src/services/questionnaires.js';
import * as TR from '../src/services/training.js';
import { buildTer } from '../src/services/documents.js';
import { answersFor } from './questionnaire-answers.js';
import { QUESTIONNAIRE_TEMPLATES } from './questionnaire-templates.js';

const DAY = 86400000;
const tri = k => (vars) => ({ en: t(k, 'en', vars.en), fr: t(k, 'fr', vars.fr), ar: t(k, 'ar', vars.ar) });

export function seedTemplateLibrary() {
  for (const tp of QUESTIONNAIRE_TEMPLATES)
    insertRecord(U('qtpl:' + tp.code), 'QuestionnaireTemplate', null, null, tp.code, { ...tp, focus: 'All', sector: null, language: 'fr', version_no: 1, owner_role: 'Head of L&D', sections_count: tp.sections.length }, null, true);
}

export function seedPersonas(o) {
  const vars = { core: o.v.coreFunction.name, standard: o.v.standards[0], theme: o.v.themes.ai[0], sector: o.v.name, org: o.name };
  for (const pz of TR.PERSONA_SEED) insertRecord(U(`persona:${o.id}:${pz.code}`), 'Persona', o.id, null, pz.code,
    { code: pz.code, population: pz.population, name: TR.fillVars(pz.name, vars), description: TR.fillVars(pz.description, vars), behaviour: TR.fillVars(pz.behaviour, vars), pain_points: TR.fillVars(pz.pain_points, vars), hopes: TR.fillVars(pz.hopes, vars) }, o.users[0].id, true);
}

/** One IF-PAC campaign per run: the three forms, every stakeholder as a respondent, the plan of each played to date. */
export function seedQuestionnaires(o, p, focus, lvl, ctx, { sow, done, started, themesML, users }) {
  const r = rng('q:' + p.id);
  const tpls = all(`SELECT id, data FROM records WHERE entity='QuestionnaireTemplate' AND org_id IS NULL ORDER BY ref`).map(x => ({ id: x.id, ...J(x.data, {}) }));
  const order = ['QT-IFPAC-DG', 'QT-IFPAC-MGT', 'QT-IFPAC-MBR'];
  const forms = Q.formsFromTemplates(order.map(c => tpls.find(x => x.code === c)).filter(Boolean));
  const status = !started('E2E-33') ? 'Draft' : lvl >= 4 && done('E2E-33') ? 'Closed' : 'Distributed';
  const distributedOn = addDays(p.start_date, 10);
  const head = users.find(u => u.role === 'R-03') || users[0]; const analyst = users.find(u => u.role === 'R-04') || head;
  // AI-tailored questions (AIUC-36) for the AI runs, validated by the Head of L&D before distribution.
  if (focus === 'AI') {
    const L3 = x => ({ en: pick(x, 'en'), fr: pick(x, 'fr'), ar: pick(x, 'ar') });
    const v = l => ({ theme1: pick(themesML[0], l), theme2: pick(themesML[1], l), theme3: pick(themesML[2], l), core: pick(o.v.coreFunction.name, l), standard: o.v.standards[0], sector: pick(o.v.name, l), focus });
    const V3 = { en: v('en'), fr: v('fr'), ar: v('ar') };
    for (const f of forms) {
      const at = Math.max(0, f.sections.findIndex(s => s.id === 'ambitions'));
      const validated = status !== 'Draft' ? { validated_by: head.id, validated_at: addDays(p.start_date, 8) } : {};
      f.sections.splice(at, 0, { id: 'ai_sector', type: 'questions', feeds: 'ambitions', title: tri('qai.section')(V3), origin: 'ai', ...validated, racsi: { R: 'L&D Analyst', A: 'Head of L&D', C: 'Consultant PM', S: 'Function head', I: 'HR Director' },
        items: ['q1', 'q2', 'q3', 'q4', 'q5'].map((k, i) => ({ key: 'ai_' + k, label: tri('qai.' + k)(V3), origin: 'ai', competence: i === 3, ...validated })) });
    }
  }
  const qid = U(`Questionnaire:${p.id}:q`);
  const label = { en: `IF-PAC questionnaire campaign ${p.plan_year}`, fr: `Campagne de questionnaires IF-PAC ${p.plan_year}`, ar: `حملة استبيانات IF-PAC ${p.plan_year}` };
  const data = { label, sow_id: sow, template_id: forms[0].template_id, template_ids: forms.map(f => f.template_id), elaboration_mode: focus === 'AI' ? 'Load + AI' : 'Load', modes: focus === 'AI' ? ['Load', 'AI'] : ['Load'], ai_generated: focus === 'AI',
    tailoring_notes: focus === 'AI' ? { en: '5 AI questions tailored to the sector and the AI focus, validated by the Head of L&D', fr: '5 questions IA adaptées au secteur et au focus IA, validées par le responsable formation', ar: '5 أسئلة مولدة بالذكاء الاصطناعي ومكيفة مع القطاع، صادق عليها مسؤول التكوين' } : null,
    racsi_allocation: forms[0].sections.filter(s => s.type !== 'note').map(s => ({ section: s.id, ...s.racsi })), channels: Q.CHANNELS, status, distributed_on: status === 'Draft' ? null : distributedOn, due_date: addDays(distributedOn, 21).slice(0, 10), response_count: 0,
    forms, channel_mode: 'Combination', reminders: { Email: { every_days: 3, max: 2 }, WhatsApp: { every_days: 2, max: 2 }, Application: { every_days: 3, max: 1 } }, threshold: 70, owner_id: head.id, public_base: 'http://localhost:5173', distributed_by: status === 'Draft' ? null : head.id, closed_on: status === 'Closed' ? addDays(distributedOn, 24) : null };
  insertRecord(qid, 'Questionnaire', o.id, p.id, 'q', data, head.id, true);
  Q.event(o.id, qid, null, 'questionnaire.created', { detail: { templates: order }, userId: head.id, at: addDays(p.start_date, 6) });
  if (focus === 'AI') Q.event(o.id, qid, null, 'ai.tailored', { detail: { questions: 15, engine: 'built-in' }, userId: head.id, at: addDays(p.start_date, 7) });
  const q = { id: qid, project_id: p.id, ...data };
  const fnName = new Map(ctx.fns.map(f => [f.id, f.name]));
  const stakeholders = all(`SELECT id, data FROM records WHERE entity='Stakeholder' AND project_id=? ORDER BY ref`, p.id).map(x => ({ id: x.id, ...J(x.data, {}) })).map(s => ({ ...s, function_name: fnName.get(s.function_id) }));
  Q.addInvitations(o.id, q, stakeholders, { userId: head.id, at: addDays(p.start_date, 7) });
  if (status === 'Draft') return;
  Q.event(o.id, qid, null, 'questionnaire.distributed', { detail: { respondents: stakeholders.length }, userId: head.id, at: distributedOn });
  const t0 = new Date(distributedOn).getTime(); const nowT = Date.now();
  const share = status === 'Closed' ? 0.85 : 0.55;
  const vth = o.v.themes[focus === 'AI' ? 'ai' : 'digital'];
  const functions = ctx.fns.slice(0, 5).map(f => pick(f.name, o.lang));
  const invs = all(`SELECT * FROM q_invitations WHERE questionnaire_id=? ORDER BY created_at, rowid`, qid);
  invs.forEach((inv, i) => {
    const plan = J(inv.channel_plan, []);
    const responds = i === 0 || r() < share;
    const reached = plan.filter(s => t0 + s.after_days * DAY <= nowT).length || 1;
    const respStep = responds ? Math.min(reached, 1 + Math.floor(r() * plan.length)) - 1 : reached - 1;
    let sent = 0;
    for (let k = 0; k <= respStep; k++) {
      const st = plan[k]; const at = new Date(t0 + st.after_days * DAY + 3600000 * (9 + (i % 6))).toISOString();
      if (st.channel === 'Face-to-Face') { Q.event(o.id, qid, inv.id, 'interview.planned', { channel: st.channel, recipient: inv.name, status: 'Interview to schedule', userId: analyst.id, at }); continue; }
      const kind = sent ? 'remind' : 'invite'; const ch = st.channel === 'WhatsApp' ? 'whatsapp' : 'email';
      const to = ch === 'whatsapp' ? inv.phone : inv.email; if (!to) continue;
      const lang = o.lang; const vars = { name: inv.name, org: pick(o.name, lang), title: pick(label, lang), link: `http://localhost:5173/respond/…`, due: data.due_date };
      run(`INSERT INTO messages(id,org_id,project_id,questionnaire_id,invitation_id,kind,channel,recipient,subject,body,lang,status,provider,attempts,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,'simulated','sandbox',1,?,?,?)`,
        uuid(), o.id, p.id, qid, inv.id, kind, ch, to, t(`qmsg.${kind === 'remind' ? 'reminder' : 'invite'}.subject`, lang, vars), t(`qmsg.${kind === 'remind' ? 'reminder' : 'invite'}.body`, lang, vars), lang, head.id, at, at);
      Q.event(o.id, qid, inv.id, kind, { channel: st.channel, recipient: to, status: 'simulated', userId: head.id, at }); sent++;
    }
    const last = plan[respStep];
    run(`UPDATE q_invitations SET step_index=?, last_sent_at=?, reminders_sent=?, status=?, interview_at=?, interviewer_id=? WHERE id=?`, respStep, sent ? new Date(t0 + plan[Math.max(0, respStep)].after_days * DAY).toISOString() : null, Math.max(0, sent - 1),
      responds ? 'Invited' : status === 'Closed' ? 'Expired' : last?.channel === 'Face-to-Face' ? (i % 2 ? 'Interview scheduled' : 'Interview to schedule') : i % 4 === 0 ? 'Opened' : 'Invited',
      !responds && last?.channel === 'Face-to-Face' && i % 2 ? addDays(new Date(nowT).toISOString(), 2 + (i % 5)) : null, last?.channel === 'Face-to-Face' ? analyst.id : null, inv.id);
    if (!responds) return;
    const channel = last.channel === 'Face-to-Face' ? 'Face-to-Face' : r() < 0.15 && last.channel === 'Email' ? 'Email' : 'Application';
    const st = stakeholders.find(s => s.id === inv.stakeholder_id) || {};
    const form = Q.formOf(q, inv.template_code);
    const { answers, flags } = answersFor(form, { lang: o.lang, name: inv.name, position: pick(st.role_t, o.lang) || st.role, reportsTo: inv.population === 'DG' ? (o.lang === 'fr' ? 'Conseil d’administration' : o.lang === 'ar' ? 'مجلس الإدارة' : 'Board of directors') : pick(users.find(u => u.role === 'R-02')?.name, 'en'),
      theme: vth[i % vth.length], core: o.v.coreFunction.name, standard: o.v.standards[0], sector: o.v.name, org: o.name, functions, functionName: inv.function_name || '' }, r, { skip: i % 13 === 7 ? 0.45 : 0.06 });
    const capturedAt = new Date(Math.min(nowT - 3600000, t0 + (last.after_days + 1) * DAY + 3600000 * (10 + (i % 5)))).toISOString();
    Q.storeResponse(o.id, q, one(`SELECT * FROM q_invitations WHERE id=?`, inv.id), { answers, flags, consent: true, final: true, channel, capturedAt, userId: channel === 'Application' ? null : analyst.id, source: channel === 'Application' ? 'respondent' : 'staff' });
  });
  if (status === 'Closed') Q.event(o.id, qid, null, 'questionnaire.closed', { userId: head.id, at: data.closed_on });
}

/** Two programs per run and one training per prioritized theme, each with its half-day agenda and persona fit. */
export function seedTraining(o, p, focus, lvl, { done }) {
  const themes = all(`SELECT id, data FROM records WHERE entity='TrainingTheme' AND project_id=?`, p.id).map(x => ({ id: x.id, ...J(x.data, {}) })).sort((a, b) => a.priority_rank - b.priority_rank);
  const personas = all(`SELECT id, data FROM records WHERE entity='Persona' AND org_id=?`, o.id).map(x => ({ id: x.id, ...J(x.data, {}) }));
  const fl = { AI: { en: 'AI', fr: 'IA', ar: 'الذكاء الاصطناعي' }, Digital: { en: 'digital', fr: 'numériques', ar: 'الرقمية' } }[focus];
  const prg = [
    { code: 'PRG-1', name: { en: `${focus === 'AI' ? 'AI' : 'Digital'} skills for ${o.v.coreFunction.name.en}`, fr: `Compétences ${fl.fr} pour ${o.v.coreFunction.name.fr}`, ar: `الكفاءات ${fl.ar} لـ ${o.v.coreFunction.name.ar}` }, axis: { en: 'Execution of the core function', fr: 'Exécution de la fonction cœur', ar: 'تنفيذ الوظيفة الأساسية' }, description: { en: `Sector themes of ${o.v.name.en}, ranked by impact and urgency.`, fr: `Thèmes sectoriels ${o.v.name.fr}, classés par impact et urgence.`, ar: `مواضيع قطاع ${o.v.name.ar} مرتبة حسب الأثر والاستعجال.` } },
    { code: 'PRG-2', name: { en: `${focus === 'AI' ? 'AI' : 'Digital'} foundations for all staff`, fr: `Fondamentaux ${fl.fr} pour tous`, ar: `أساسيات ${fl.ar} لجميع العاملين` }, axis: { en: 'Leadership, performance and responsible use', fr: 'Leadership, performance et usage responsable', ar: 'القيادة والأداء والاستعمال المسؤول' }, description: { en: 'Cross-functional themes open to every function.', fr: 'Thèmes transverses ouverts à toutes les fonctions.', ar: 'مواضيع عرضانية مفتوحة لجميع الوظائف.' } },
  ].map((x, i) => { const id = U(`TrainingProgram:${p.id}:${x.code}`); insertRecord(id, 'TrainingProgram', o.id, p.id, x.code, { ...x, year: p.plan_year, sort: i }, o.users[0].id, true); return id; });
  const LV = ['Intermediate', 'Intermediate', 'Advanced', 'Foundation', 'Foundation', 'Intermediate'];
  const approved = done('E2E-30');
  themes.slice(0, 6).forEach((th, i) => {
    const level = LV[i]; const code = `TR-${focus === 'AI' ? 'AI' : 'DIG'}-${String(i + 1).padStart(2, '0')}`;
    const vars = { theme: th.name, core: o.v.coreFunction.name, standard: o.v.standards[0], sector: o.v.name, org: o.name };
    const agenda = TR.draftAgenda(th.days_per_group || 1, vars);
    if (!approved && i === 5 && agenda.length) agenda[agenda.length - 1].items.splice(1, 0, { ...agenda[agenda.length - 1].items.find(x => x.type === 'Quiz') }); // a second quiz: breaks the golden rule, shown in the check
    const pre = level === 'Foundation' ? { en: 'None — open to all staff', fr: 'Aucun — ouvert à tous', ar: 'لا شيء — مفتوح للجميع' } : level === 'Advanced' ? { en: `TR-${focus === 'AI' ? 'AI' : 'DIG'}-01 or equivalent experience`, fr: `TR-${focus === 'AI' ? 'AI' : 'DIG'}-01 ou expérience équivalente`, ar: `TR-${focus === 'AI' ? 'AI' : 'DIG'}-01 أو خبرة مماثلة` } : { en: 'Basic digital literacy; the Foundation training is recommended', fr: 'Culture numérique de base ; la formation Fondamentaux est recommandée', ar: 'ثقافة رقمية أساسية؛ يوصى بتكوين الأساسيات' };
    insertRecord(U(`TrainingCourse:${p.id}:${code}`), 'TrainingCourse', o.id, p.id, code, { program_id: prg[i < 3 ? 0 : 1], training_code: code, name: th.name, level, objectives: TR.draftObjectives(vars), duration_days: th.days_per_group || 1, prerequisites: pre, agenda,
      personas: personas.map(pz => TR.personaFit(pz, vars)), theme_id: th.id, groups: th.group_count || 1, modality: i % 2 ? 'Blended' : 'Classroom', status: approved ? 'Approved' : 'Draft', sort: i }, o.users[0].id, true);
  });
}

/** A generated Training Engineering Report per run: published once the report process is complete, otherwise a draft. */
export function seedDocuments(o, p, { done }) {
  const author = o.users.find(u => u.role === 'R-05') || o.users.find(u => u.role === 'R-03'); const approver = o.users.find(u => u.role === 'R-02') || o.users[0];
  const published = done('E2E-03'); const at = addDays(p.start_date, 85);
  const built = buildTer(o.id, p.id, o.lang, { version: 1, status: published ? 'Published' : 'Draft', author: author.name, approver: published ? approver.name : null, dataAsOf: new Date().toISOString() });
  run(`INSERT INTO documents(id,org_id,project_id,doc_type,version,status,lang,title,data_as_of,model,sources,findings,author_id,approver_id,change_note,created_at,updated_at,published_at) VALUES(?,?,?,?,1,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    U(`doc:${p.id}:TER:1`), o.id, p.id, 'TER', published ? 'Published' : 'Draft', o.lang, built.model.title, built.dataAsOf, S(built.model), S(built.sources), S(built.findings), author.id, published ? approver.id : null, published ? 'Version 1 approved by the Steering Committee' : null, at, at, published ? at : null);
}
