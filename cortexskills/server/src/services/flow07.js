// Evaluation (E2E-07): the instruments of the four Kirkpatrick levels used here (satisfaction, knowledge test,
// observation at work), the question bank of the test, the questionnaires sent to the learners and to their managers
// by e-mail or WhatsApp, the scores computed from the answers, the progression of the skills against the validated
// levels of the diagnosis, the indicators, the quality review, the lessons shared and the dashboard widgets.
import * as C from './flowcore.js';
const { T, ml, str, norm, num, avg, round1, today, fmtN, fmtD } = C;

const completed = t => C.enrollments(t.project_id).filter(e => e.completion_status === 'Completed' || e.attendance_status === 'Present');
const note = (title, text) => ({ id: 'info', type: 'note', title: ml(title), instructions: ml(text) });

/* ------------------------------------------------------------------ MP-09.1 instruments */
function instrumentRows({ t }, ai) {
  const all = C.courses(t.project_id).map(c => c.training_code).join(', ');
  const p1 = C.courses(t.project_id).filter(c => c.provider === 'External' || /triage|urgen/i.test(c.name_text)).length;
  return [{ item: 'L1', courses: all, timing: 'End', threshold: '80', respondents: 'Learners' }, { item: 'L2', courses: all, timing: 'End', threshold: ai && p1 ? '80' : '70', respondents: 'Learners' }, { item: 'L3', courses: all, timing: ai ? 'D30' : 'D90', threshold: '70', respondents: 'Managers' }];
}
function completeInstruments({ req, t, rows }) { const keep = new Set(); for (const r of rows) { const k = 'instr|' + r.item; keep.add(k); C.upsert(req, t, 'EvaluationInstrument', k, { level: { L1: 1, L2: 2, L3: 3 }[r.item] || 1, kind: r.item, courses: C.split(r.courses), timing: r.timing, threshold: num(r.threshold), respondents: r.respondents, flow_step: 'MP-09.1' }); } C.prune('EvaluationInstrument', t.project_id, 'MP-09.1', keep); }
const instrument = (t, kind) => C.recs('EvaluationInstrument', t.project_id).find(x => x.kind === kind);

/* ------------------------------------------------------------------ MP-09.2 question bank */
const BANK = [
  [/triage|urgen|decision/, [['L’outil de triage IA propose une priorité basse pour un patient dont l’état vous inquiète. Que faites-vous ?', 'Vous suivez la proposition de l’outil ; Vous réévaluez le patient et décidez selon votre jugement clinique, puis tracez l’écart ; Vous attendez l’avis d’un collègue sans rien noter ; Vous modifiez les données saisies pour obtenir une priorité haute', 'B'],
    ['Avant de lire la proposition de l’outil de triage, il faut d’abord :', 'Vérifier que les constantes et le motif saisis sont complets et exacts ; Imprimer la fiche patient ; Prévenir le médecin chef ; Rien de particulier', 'A'],
    ['Que doit contenir la traçabilité d’une décision de triage assistée par l’IA ?', 'Uniquement la priorité finale ; La priorité proposée, la priorité retenue et la raison d’un éventuel écart ; Le nom de l’éditeur du logiciel ; La durée d’attente prévue', 'B'],
    ['Un outil de triage IA peut se tromper surtout quand :', 'Les données d’entrée sont incomplètes ou inhabituelles ; Le patient est connu de l’établissement ; Il est utilisé de jour ; Le service est calme', 'A']]],
  [/imag|radio/, [['L’outil d’IA signale une « suspicion de nodule » sur une radiographie. Le bon réflexe est :', 'Considérer le diagnostic comme posé ; Transmettre le signalement au radiologue avec l’image, sans conclure soi-même ; Supprimer le signalement s’il semble faux ; Attendre le prochain examen', 'B'],
    ['Un « faux positif » de l’outil d’imagerie signifie :', 'L’outil signale une anomalie qui n’existe pas ; L’outil ne signale pas une anomalie présente ; L’image est floue ; Le patient a refusé l’examen', 'A'],
    ['Pourquoi vérifier la qualité de l’image avant l’analyse par l’IA ?', 'Pour respecter le planning ; Parce qu’une image de mauvaise qualité peut fausser le résultat de l’outil ; Pour réduire la dose ; Ce n’est pas utile', 'B'],
    ['Qui reste responsable de l’interprétation finale de l’examen ?', 'L’éditeur de l’outil ; Le technicien seul ; Le radiologue ; L’administration', 'C']]],
  [/./, [['Une suggestion d’un outil d’IA doit être :', 'Appliquée sans vérification ; Vérifiée et confrontée au jugement professionnel avant d’agir ; Ignorée systématiquement ; Validée par le service informatique', 'B'],
    ['Quelle donnée ne doit jamais être saisie dans un outil d’IA public non autorisé ?', 'Le nom de la formation ; Les données d’identification d’un patient ; La date du jour ; Le nom du service', 'B'],
    ['Que faire si l’outil d’IA donne un résultat incohérent ?', 'Le signaler et tracer l’incident ; Recommencer jusqu’à obtenir le résultat attendu ; Ne rien dire ; Arrêter d’utiliser l’ordinateur', 'A']]]];
const BANK_EN = { 'B': 'B' };
function questionRows({ t, lang }, ai) {
  const out = [];
  for (const c of C.courses(t.project_id)) {
    const set = BANK.find(([rx]) => rx.test(norm(c.name_text)))[1]; const gen = BANK[BANK.length - 1][1];
    const qs = ai ? [...set, ...gen.slice(0, 1)] : set.slice(0, 3);
    for (const [q, ch, a] of qs) out.push({ course: c.training_code, item: lang === 'fr' ? q : q, choices: ch, answer: a, points: '1' });
    if (ai) for (const o of (c.objectives || []).slice(1, 2)) out.push({ course: c.training_code, item: T(lang, `Which behaviour shows the objective “${str(o, lang)}”?`, `Quel comportement montre l’objectif « ${str(o, lang)} » ?`, `أي سلوك يظهر الهدف؟`), choices: T(lang, 'Doing it without checking ; Doing it, checking the result and recording the decision ; Asking someone else to do it ; Postponing it', 'Le faire sans vérifier ; Le faire, vérifier le résultat et tracer la décision ; Demander à quelqu’un d’autre de le faire ; Le reporter', 'القيام به دون تحقق ; القيام به والتحقق والتوثيق ; طلبه من غيره ; تأجيله'), answer: 'B', points: '1' });
  }
  void BANK_EN; return out;
}

/* ------------------------------------------------------------------ MP-09.3 level 1, MP-09.4 level 2, MP-09.5 level 3 */
const L1_ITEMS = lang => [['objectives', T(lang, 'The objectives were clear', 'Les objectifs étaient clairs', 'الأهداف كانت واضحة')], ['useful', T(lang, 'The content is useful for my job', 'Le contenu est utile pour mon poste', 'المحتوى مفيد لعملي')], ['trainer', T(lang, 'The trainer made it easy to learn', 'L’animation a facilité l’apprentissage', 'المكون سهّل التعلم')], ['logistics', T(lang, 'Organisation and room', 'Organisation et salle', 'التنظيم والقاعة')], ['recommend', T(lang, 'I recommend this course', 'Je recommande cette formation', 'أنصح بهذا التكوين')]];
async function sendL1({ req, t }) {
  const lang = req.lang; const forms = []; const people = [];
  for (const c of C.courses(t.project_id)) {
    const code = `L1-${c.training_code}`; forms.push({ code, name: ml(T(lang, `Your opinion on ${c.name_text}`, `Votre avis sur ${c.name_text}`, `رأيك في ${c.name_text}`)), population: 'Member', course: c.training_code,
      sections: [note(T(lang, 'Satisfaction (level 1)', 'Satisfaction (niveau 1)', 'الرضا (المستوى 1)'), T(lang, 'Rate each statement from 1 (not at all) to 5 (fully). It takes two minutes.', 'Notez chaque affirmation de 1 (pas du tout) à 5 (tout à fait). Cela prend deux minutes.', 'قيّم من 1 إلى 5.')),
        { id: 'rating', type: 'rating', title: ml(T(lang, 'Your rating', 'Votre note', 'تقييمك')), scale: { max: 5 }, items: L1_ITEMS(lang).map(([key, label]) => ({ key, label: ml(label) })) },
        { id: 'open', type: 'questions', title: ml(T(lang, 'In your words', 'En quelques mots', 'بكلماتك')), items: [{ key: 'apply', label: ml(T(lang, 'What will you apply first at work?', 'Qu’allez-vous appliquer en premier au travail ?', 'ما الذي ستطبقه أولاً؟')) }, { key: 'improve', label: ml(T(lang, 'What should be improved?', 'Que faudrait-il améliorer ?', 'ما الذي يجب تحسينه؟')) }] }] });
    for (const e of completed(t).filter(x => x.course_code === c.training_code)) people.push({ key: `l1:${e._id}`, name: e.name, email: e.email, phone: e.phone, channel: e.channel, form: code, lang });
  }
  return C.invite(req, C.campaign(req, t, 'l1', ml(T(lang, 'Training satisfaction', 'Satisfaction des formations', 'الرضا عن التكوين')), forms, { days: 10 }), people);
}
function l1Results(req, t) { const q = C.campaignOf(req.orgId, t.project_id, 'l1'); if (!q) return []; return C.invitationsOf(req.orgId, q).filter(i => i.answers).map(i => { const r = i.answers.rating || {}; const v = Object.values(r).map(num).filter(x => x != null); return { name: i.name, course: (q.forms || []).find(f => f.code === i.template_code)?.course, avg: avg(v), apply: i.answers.open?.apply || '', improve: i.answers.open?.improve || '' }; }); }
function evalSave(req, t, level, rows, key) { for (const r of rows) { const e = C.enrollments(t.project_id).find(x => norm(x.name) === norm(r.name) && (!r.course || x.course_code === r.course)); C.upsert(req, t, 'Evaluation', `l${level}|${norm(r.name)}|${norm(r.course || '')}`, { label: ml(`Kirkpatrick ${level}`), enrollment_id: e?._id || null, learner: r.name, course_code: r.course || null, level, kind: key, score: r.score ?? null, score_pct: r.pct ?? null, passed: r.passed ?? null, comment: r.comment || null, flow_step: `MP-09.${level + 2}` }); } }
function l1Panel({ req, t, lang }) {
  const res = l1Results(req, t); const q = C.campaignOf(req.orgId, t.project_id, 'l1'); const inv = q ? C.invitationsOf(req.orgId, q) : []; const a = avg(res.map(x => x.avg));
  return { kpis: [{ label: T(lang, 'Learners asked', 'Apprenants sollicités', 'متعلمون'), value: inv.length }, { label: T(lang, 'Answers', 'Réponses', 'إجابات'), value: res.length }, { label: T(lang, 'Average satisfaction', 'Satisfaction moyenne', 'متوسط الرضا'), value: a == null ? '—' : `${fmtN(a, lang)} / 5` }],
    tables: [{ title: T(lang, 'Answers (level 1)', 'Réponses (niveau 1)', 'الإجابات'), csv: true, columns: [['name', T(lang, 'Learner', 'Apprenant', 'المتعلم')], ['course', T(lang, 'Course', 'Formation', 'التكوين')], ['avg', T(lang, 'Average /5', 'Moyenne /5', 'المعدل')], ['apply', T(lang, 'Will apply', 'Va appliquer', 'سيطبق')], ['improve', T(lang, 'To improve', 'À améliorer', 'للتحسين')]], rows: res.map(x => ({ ...x, avg: fmtN(x.avg, lang) })) }],
    actions: [{ key: 'send', label: inv.length ? T(lang, 'Send to the learners not yet asked', 'Envoyer aux apprenants restants', 'إرسال للباقين') : T(lang, 'Send the satisfaction questionnaire', 'Envoyer le questionnaire de satisfaction', 'إرسال استبيان الرضا'), icon: 'Send', primary: !inv.length }, ...(inv.length ? [{ key: 'remind', label: T(lang, 'Remind', 'Relancer', 'تذكير'), icon: 'BellRing' }] : [])] };
}
function l1Store(req, t) { const res = l1Results(req, t); evalSave(req, t, 1, res.map(x => ({ name: x.name, course: x.course, score: x.avg, pct: x.avg == null ? null : Math.round((x.avg / 5) * 100), comment: [x.apply, x.improve].filter(Boolean).join(' — ') })), 'Satisfaction'); const a = avg(res.map(x => x.avg)); if (a != null) C.kpiValue(req, t, 'KPI-012', a); return res.length; }

async function sendL2({ req, t }) {
  const lang = req.lang; const bank = C.rowsOfStep(t.project_id, 'MP-09.2'); if (!bank.length) throw C.err('err.flowNoQuestions'); const forms = []; const people = []; const keys = {};
  for (const c of C.courses(t.project_id)) {
    const qs = bank.filter(r => norm(r.course) === norm(c.training_code)); if (!qs.length) continue; const code = `L2-${c.training_code}`; keys[code] = {};
    const items = qs.map((r, i) => { const k = `q${i + 1}`; keys[code][k] = { answer: r.answer, points: num(r.points) || 1 }; const ch = C.split(str(r.choices).replace(/\s;\s/g, ';')); return { key: k, label: ml(str(r.item)), options: ch.slice(0, 4).map((x, j) => ({ value: 'ABCD'[j], label: ml(`${'ABCD'[j]}. ${x}`) })) }; });
    forms.push({ code, name: ml(T(lang, `Test — ${c.name_text}`, `Test — ${c.name_text}`, `اختبار — ${c.name_text}`)), population: 'Member', course: c.training_code,
      sections: [note(T(lang, 'Knowledge test (level 2)', 'Test de connaissances (niveau 2)', 'اختبار المعارف'), T(lang, `${items.length} questions, one right answer each. Pass mark: ${instrument(t, 'L2')?.threshold || 70} %.`, `${items.length} questions, une seule bonne réponse chacune. Seuil de réussite : ${instrument(t, 'L2')?.threshold || 70} %.`, `${items.length} أسئلة.`)), { id: 'quiz', type: 'choice', title: ml(T(lang, 'Questions', 'Questions', 'الأسئلة')), items }] });
    for (const e of completed(t).filter(x => x.course_code === c.training_code)) people.push({ key: `l2:${e._id}`, name: e.name, email: e.email, phone: e.phone, channel: e.channel, form: code, lang });
  }
  const q = C.campaign(req, t, 'l2', ml(T(lang, 'Knowledge tests', 'Tests de connaissances', 'اختبارات المعارف')), forms, { days: 10, data: { answer_keys: keys } });
  return C.invite(req, q, people);
}
function l2Results(req, t) {
  const q = C.campaignOf(req.orgId, t.project_id, 'l2'); if (!q) return []; const th = instrument(t, 'L2')?.threshold || 70;
  return C.invitationsOf(req.orgId, q).filter(i => i.answers).map(i => { const keys = q.answer_keys?.[i.template_code] || {}; const a = i.answers.quiz || {}; let pts = 0, max = 0;
    for (const [k, v] of Object.entries(keys)) { max += v.points; if (String(a[k] || '') === String(v.answer)) pts += v.points; }
    const pct = max ? Math.round((pts / max) * 100) : 0; return { name: i.name, course: (q.forms || []).find(f => f.code === i.template_code)?.course, score: `${pts}/${max}`, pct, passed: pct >= th }; });
}
function l2Panel({ req, t, lang }) {
  const res = l2Results(req, t); const q = C.campaignOf(req.orgId, t.project_id, 'l2'); const inv = q ? C.invitationsOf(req.orgId, q) : [];
  return { notes: [T(lang, 'The scores are computed from the answers and the right answers of the question bank (step MP-09.2); the right answers are never shown to the learners.', 'Les scores sont calculés à partir des réponses et des bonnes réponses de la banque de questions (étape MP-09.2) ; les bonnes réponses ne sont jamais montrées aux apprenants.', 'تحسب النتائج من الأجوبة.')],
    kpis: [{ label: T(lang, 'Tests sent', 'Tests envoyés', 'اختبارات مرسلة'), value: inv.length }, { label: T(lang, 'Answers', 'Réponses', 'إجابات'), value: res.length }, { label: T(lang, 'Pass rate', 'Taux de réussite', 'نسبة النجاح'), value: res.length ? `${Math.round((res.filter(x => x.passed).length / res.length) * 100)} %` : '—' }],
    tables: [{ title: T(lang, 'Scores (level 2)', 'Scores (niveau 2)', 'النتائج'), csv: true, columns: [['name', T(lang, 'Learner', 'Apprenant', 'المتعلم')], ['course', T(lang, 'Course', 'Formation', 'التكوين')], ['score', 'Points'], ['pct', '%'], ['passed', T(lang, 'Passed', 'Réussi', 'ناجح')]], rows: res.map(x => ({ ...x, passed: x.passed ? '✓' : '✗' })) }],
    actions: [{ key: 'send', label: inv.length ? T(lang, 'Send to the learners not yet tested', 'Envoyer aux apprenants restants', 'إرسال للباقين') : T(lang, 'Send the test', 'Envoyer le test', 'إرسال الاختبار'), icon: 'Send', primary: !inv.length }, ...(inv.length ? [{ key: 'remind', label: T(lang, 'Remind', 'Relancer', 'تذكير'), icon: 'BellRing' }] : [])] };
}
function l2Store(req, t) { const res = l2Results(req, t); evalSave(req, t, 2, res.map(x => ({ name: x.name, course: x.course, score: null, pct: x.pct, passed: x.passed })), 'Test'); if (res.length) C.kpiValue(req, t, 'FLOW-L2', Math.round((res.filter(x => x.passed).length / res.length) * 100)); return res.length; }

async function sendL3({ req, t }) {
  const lang = req.lang; const forms = []; const people = []; const subjects = {};
  completed(t).forEach((e, i) => {
    const c = C.courseByCode(t.project_id, e.course_code); const comp = C.compByCode(t.project_id, e.competency_code); if (!comp || !e.manager) return; const code = `L3-${i + 1}`; subjects[code] = e._id;
    forms.push({ code, name: ml(T(lang, `Observation of ${e.name} after ${c?.name_text || ''}`, `Observation de ${e.name} après ${c?.name_text || ''}`, `ملاحظة ${e.name}`)), population: 'Management', learner: e.name, course: e.course_code,
      sections: [note(T(lang, 'Observation at work (level 3)', 'Observation en situation de travail (niveau 3)', 'الملاحظة في العمل'), T(lang, `${e.name} completed the course “${c?.name_text}”. From what you have seen at work since, give the level shown today: 1 Notions · 2 Practice with support · 3 Autonomous · 4 Expert.`, `${e.name} a suivi la formation « ${c?.name_text} ». D’après ce que vous avez observé au travail depuis, indiquez le niveau démontré aujourd’hui : 1 Notions · 2 Pratique accompagnée · 3 Autonome · 4 Expert.`, `${e.name} أنهى التكوين.`)),
        { id: 'levels', type: 'rating', title: ml(T(lang, 'Level observed', 'Niveau observé', 'المستوى الملاحظ')), scale: { max: 4 }, items: [{ key: comp.code, label: ml(`${comp.code} — ${C.compName(comp, lang)}`) }] },
        { id: 'facts', type: 'questions', title: ml(T(lang, 'Facts', 'Faits', 'وقائع')), items: [{ key: 'facts', label: ml(T(lang, 'Which situations did you observe?', 'Quelles situations avez-vous observées ?', 'ما الوضعيات التي لاحظتها؟')) }] }] });
    people.push({ key: `l3:${e._id}`, name: e.manager, email: e.manager_email, phone: e.manager_phone, channel: e.manager_email ? 'Email' : 'WhatsApp', form: code, population: 'Management', lang });
  });
  return C.invite(req, C.campaign(req, t, 'l3', ml(T(lang, 'Observation at work after the training', 'Observation en situation après la formation', 'الملاحظة في العمل بعد التكوين')), forms, { days: 21, data: { subjects } }), people);
}
function l3Results(req, t) { const q = C.campaignOf(req.orgId, t.project_id, 'l3'); if (!q) return []; return C.invitationsOf(req.orgId, q).filter(i => i.answers).map(i => { const f = (q.forms || []).find(x => x.code === i.template_code); const [code, lv] = Object.entries(i.answers.levels || {})[0] || []; return { name: f?.learner, manager: i.name, course: f?.course, code, level: num(lv), facts: i.answers.facts?.facts || '' }; }); }
function l3Panel({ req, t, lang }) {
  const res = l3Results(req, t); const q = C.campaignOf(req.orgId, t.project_id, 'l3'); const inv = q ? C.invitationsOf(req.orgId, q) : [];
  return { kpis: [{ label: T(lang, 'Managers asked', 'Managers sollicités', 'مديرون'), value: inv.length }, { label: T(lang, 'Observations', 'Observations', 'ملاحظات'), value: res.length }],
    tables: [{ title: T(lang, 'Observations (level 3)', 'Observations (niveau 3)', 'الملاحظات'), csv: true, columns: [['name', T(lang, 'Learner', 'Apprenant', 'المتعلم')], ['manager', T(lang, 'Manager', 'Manager', 'المدير')], ['code', T(lang, 'Competency', 'Compétence', 'الكفاءة')], ['level', T(lang, 'Level observed', 'Niveau observé', 'المستوى')], ['facts', T(lang, 'Facts', 'Faits', 'وقائع')]], rows: res }],
    actions: [{ key: 'send', label: inv.length ? T(lang, 'Send to the managers not yet asked', 'Envoyer aux managers restants', 'إرسال للباقين') : T(lang, 'Send the observation grids to the managers', 'Envoyer les grilles d’observation aux managers', 'إرسال الشبكات'), icon: 'Send', primary: !inv.length }, ...(inv.length ? [{ key: 'remind', label: T(lang, 'Remind', 'Relancer', 'تذكير'), icon: 'BellRing' }] : [])] };
}
function l3Store(req, t) { const res = l3Results(req, t); evalSave(req, t, 3, res.map(x => ({ name: x.name, course: x.course, score: x.level, comment: x.facts })), 'Observation');
  for (const x of res) { const a = C.assessments(t.project_id).find(y => norm(y.employee) === norm(x.name) && norm(y.competency_code) === norm(x.code)); if (a) C.patch(a._id, { observed_level: x.level, observed_at: today() }, req.user.id); } return res.length; }

/* ------------------------------------------------------------------ MP-09.6 progression, MP-10.3 indicators */
function progression(t) { return C.assessments(t.project_id).filter(a => a.observed_level != null).map(a => { const g = C.gaps(t.project_id).find(x => norm(x.employee) === norm(a.employee) && x.competency_code === a.competency_code);
  return { name: a.employee, code: a.competency_code, before: a.validated_level, after: a.observed_level, target: g?.target_level ?? null, delta: (a.observed_level ?? 0) - (a.validated_level ?? 0), reached: g ? a.observed_level >= g.target_level : null }; }); }
function progressStore(req, t) { const p = progression(t); if (p.length) C.kpiValue(req, t, 'KPI-013', Math.round((p.filter(x => x.delta >= 1 || x.reached).length / p.length) * 100)); return p.length; }
function progressPanel({ t, lang }) { const p = progression(t); const rate = p.length ? Math.round((p.filter(x => x.delta >= 1 || x.reached).length / p.length) * 100) : null;
  return { notes: [T(lang, 'Before = level validated in the diagnosis; after = level observed by the manager (level 3).', 'Avant = niveau validé au diagnostic ; après = niveau observé par le manager (niveau 3).', 'قبل = المستوى المعتمد؛ بعد = المستوى الملاحظ.')],
    kpis: [{ label: T(lang, 'Learners observed', 'Apprenants observés', 'متعلمون ملاحظون'), value: p.length }, { label: T(lang, 'Progressed or at target', 'En progression ou à la cible', 'تقدم أو بلغ الهدف'), value: rate == null ? '—' : `${rate} %` }, { label: T(lang, 'Average gain', 'Gain moyen', 'متوسط الربح'), value: fmtN(avg(p.map(x => x.delta)), lang) }],
    tables: [{ title: T(lang, 'Progression', 'Progression', 'التقدم'), csv: true, columns: [['name', T(lang, 'Learner', 'Apprenant', 'المتعلم')], ['code', T(lang, 'Competency', 'Compétence', 'الكفاءة')], ['before', T(lang, 'Before', 'Avant', 'قبل')], ['after', T(lang, 'After', 'Après', 'بعد')], ['target', T(lang, 'Target', 'Cible', 'الهدف')], ['reached', T(lang, 'Target reached', 'Cible atteinte', 'بلغ الهدف')]], rows: p.map(x => ({ ...x, reached: x.reached ? '✓' : '✗' })) }],
    actions: [{ key: 'compute', label: T(lang, 'Compute the progression', 'Calculer la progression', 'حساب التقدم'), icon: 'Calculator', primary: true }] }; }
export function indicators(req, t) {
  const l1 = C.recs('Evaluation', t.project_id).filter(x => x.level === 1 && x.score != null); const l2 = C.recs('Evaluation', t.project_id).filter(x => x.level === 2 && x.kind === 'Test'); const en = C.enrollments(t.project_id); const att = en.filter(x => x.attendance_status);
  const p = progression(t); const g = C.gaps(t.project_id); const ss = C.sessions(t.project_id); const cap = ss.reduce((s, x) => s + (x.capacity || 0), 0);
  const bl = C.recs('BudgetLine', t.project_id).filter(x => x.flow_step); const planned = bl.reduce((s, x) => s + (x.planned_amount || 0), 0); const actual = bl.reduce((s, x) => s + (x.actual_amount || 0), 0) + C.themes(t.project_id).filter(x => x.provider !== 'External').reduce((s, x) => s + (x.budget || 0), 0);
  const caps = (() => { const q = C.campaignOf(req.orgId, t.project_id, 'capsule'); if (!q) return null; const i = C.invitationsOf(req.orgId, q); return i.length ? Math.round((i.filter(x => x.opened_at || x.status === 'Responded').length / i.length) * 100) : null; })();
  const v = { 'KPI-012': avg(l1.map(x => x.score)), 'KPI-013': p.length ? Math.round((p.filter(x => x.delta >= 1 || x.reached).length / p.length) * 100) : null, 'FLOW-L2': l2.length ? Math.round((l2.filter(x => x.passed).length / l2.length) * 100) : null,
    'FLOW-ATT': att.length ? Math.round((att.filter(x => x.attendance_status === 'Present').length / att.length) * 100) : null, 'KPI-008': cap ? Math.round((en.length / cap) * 100) : null, 'KPI-003': g.length ? Math.round((g.filter(x => x.is_critical).length / g.length) * 100) : null,
    'KPI-022': planned ? round1((Math.abs(actual - planned) / planned) * 100) : null, 'KPI-030': caps };
  return C.FLOW_KPIS.map(k => ({ ...k, value: v[k.id], status: v[k.id] == null ? null : (k.direction === 'up' ? v[k.id] >= k.target : v[k.id] <= k.target) ? 'Green' : (k.direction === 'up' ? v[k.id] >= k.target * 0.9 : v[k.id] <= k.target * 1.1) ? 'Amber' : 'Red' }));
}
function storeIndicators(req, t) { const ks = indicators(req, t); for (const k of ks) if (k.value != null) C.kpiValue(req, t, k.id, k.value); return ks.filter(k => k.value != null).length; }
const statusTxt = (s, lang) => ({ Green: T(lang, 'Green', 'Vert', 'أخضر'), Amber: T(lang, 'Amber', 'Ambre', 'كهرماني'), Red: T(lang, 'Red', 'Rouge', 'أحمر') }[s] || '—');
function kpiPanel({ req, t, lang }) { const ks = indicators(req, t);
  return { tables: [{ title: T(lang, 'Indicators of the plan', 'Indicateurs du plan', 'مؤشرات الخطة'), csv: true, columns: [['id', 'ID'], ['name', T(lang, 'Indicator', 'Indicateur', 'المؤشر')], ['value', T(lang, 'Value', 'Valeur', 'القيمة')], ['target', T(lang, 'Target', 'Cible', 'الهدف')], ['status', T(lang, 'Status', 'Statut', 'الحالة')]],
    rows: ks.map(k => ({ id: k.id, name: C.pick(k.name, lang), value: k.value == null ? '—' : `${fmtN(k.value, lang)}${k.unit === '%' ? ' %' : k.unit}`, target: `${k.direction === 'up' ? '≥' : '≤'} ${fmtN(k.target, lang)}${k.unit === '%' ? ' %' : k.unit}`, status: statusTxt(k.status, lang) })) }],
    actions: [{ key: 'compute', label: T(lang, 'Refresh the indicators', 'Actualiser les indicateurs', 'تحيين المؤشرات'), icon: 'RefreshCw', primary: true }] }; }

/* ------------------------------------------------------------------ MP-09.7 review, MP-20.5 quality review, MP-10.6 lessons, MP-10.2 widgets */
function evalFindings(req, t, lang) { return indicators(req, t).filter(k => k.value != null).map(k => `• ${C.pick(k.name, lang)} : ${fmtN(k.value, lang)}${k.unit === '%' ? ' %' : k.unit} (${T(lang, 'target', 'cible', 'الهدف')} ${k.direction === 'up' ? '≥' : '≤'} ${fmtN(k.target, lang)}) — ${statusTxt(k.status, lang)}`).join('\n'); }
function reviewFields({ req, t, lang }, ai) { const ks = indicators(req, t).filter(k => k.value != null); const red = ks.filter(k => k.status !== 'Green');
  return { findings: evalFindings(req, t, lang), conclusion: red.some(k => k.status === 'Red') ? 'Major corrections' : red.length ? 'Minor corrections' : 'Conforming',
    followUp: ai ? red.map(k => T(lang, `${k.id}: analyse the causes with the trainers and the managers; action in the quality review.`, `${k.id} : analyser les causes avec les formateurs et les managers ; action à la revue qualité.`, `${k.id}: تحليل الأسباب.`)).join('\n') : '' }; }
function qualityRows({ req, t, lang }, ai) { return indicators(req, t).filter(k => k.value != null).map(k => ({ item: C.pick(k.name, lang), finding: `${fmtN(k.value, lang)}${k.unit === '%' ? ' %' : k.unit} — ${T(lang, 'target', 'cible', 'الهدف')} ${k.direction === 'up' ? '≥' : '≤'} ${fmtN(k.target, lang)}${k.unit === '%' ? ' %' : k.unit}`, status: k.status,
  action: k.status === 'Green' ? '' : ai ? ({ 'KPI-012': T(lang, 'Review the content with the trainer using the level-1 comments', 'Revoir le contenu avec le formateur à partir des commentaires de niveau 1', 'مراجعة المحتوى'), 'FLOW-L2': T(lang, 'Add practice exercises before the test; second attempt for those who failed', 'Ajouter des exercices pratiques avant le test ; seconde tentative pour les apprenants en échec', 'إضافة تمارين'), 'KPI-013': T(lang, 'Coaching at work by the referent for the learners below target', 'Accompagnement en poste par le référent pour les apprenants sous la cible', 'مرافقة في العمل'), 'FLOW-ATT': T(lang, 'Re-enrol the absentees and fix the dates with the managers', 'Réinscrire les absents et caler les dates avec les managers', 'إعادة تسجيل الغائبين'), 'KPI-008': T(lang, 'Merge the sessions under-filled', 'Regrouper les sessions peu remplies', 'دمج الدورات'), 'KPI-022': T(lang, 'Check the invoices against the budget lines', 'Contrôler les factures face aux lignes budgétaires', 'مراقبة الفواتير'), 'KPI-030': T(lang, 'Send the capsules by the channel the learner opens most', 'Envoyer les capsules par le canal le plus ouvert par l’apprenant', 'إرسال عبر القناة الأنسب'), 'KPI-003': T(lang, 'Keep the critical competencies in the next plan', 'Garder les compétences critiques dans le plan suivant', 'إبقاء الكفاءات الحرجة') }[k.id] || '') : T(lang, 'To define', 'À définir', 'يحدد'),
  owner: k.status === 'Green' ? '' : req.user.name, due: k.status === 'Green' ? '' : C.dplus(30) })); }
function completeQuality({ req, t, rows }) { const keep = new Set(); for (const r of rows.filter(x => str(x.action))) { const k = 'qa|' + norm(str(r.item)); keep.add(k); C.upsert(req, t, 'Action', k, { title: ml(str(r.action)), label: ml(str(r.action)), action_type: 'Improvement', source: str(r.item), owner: str(r.owner), due_date: r.due || null, status: 'Open', flow_step: 'MP-20.5' }); } C.prune('Action', t.project_id, 'MP-20.5', keep); }
function lessonRows({ req, t, lang }, ai) { const ks = indicators(req, t).filter(k => k.value != null); const line = ks.slice(0, 5).map(k => `${C.pick(k.name, lang)} : ${fmtN(k.value, lang)}${k.unit === '%' ? ' %' : k.unit}`).join(' ; '); const p = progression(t);
  const rows = [{ audience: 'Sponsors', channel: 'Email', message: T(lang, `Results of the training plan: ${line}.`, `Résultats du plan de formation : ${line}.`, `نتائج الخطة: ${line}.`) + (ai ? ' ' + T(lang, `${p.filter(x => x.reached).length} of ${p.length} learners observed at their target level.`, `${p.filter(x => x.reached).length} apprenant(s) sur ${p.length} observé(s) au niveau cible.`, '') : ''), date: today() },
    { audience: 'Managers', channel: 'Email', message: T(lang, `Thank you for the observations. ${ai ? 'Keep supporting the learners below target: the referent will contact you.' : ''}`, `Merci pour vos observations. ${ai ? 'Continuez d’accompagner les apprenants sous la cible : le référent vous contactera.' : ''}`, 'شكراً على ملاحظاتكم.'), date: today() },
    { audience: 'Learners', channel: 'WhatsApp', message: T(lang, 'Thank you for taking part in the training. Your opinion and your results help us improve the next sessions.', 'Merci d’avoir participé à la formation. Votre avis et vos résultats nous aident à améliorer les prochaines sessions.', 'شكراً على مشاركتكم.'), date: today() }];
  return rows; }
function audiencePeople(t, audience) {
  const st = C.stakeholders(t.project_id); const ch = s => (s.preferred_channel === 'WhatsApp' && s.phone ? 'WhatsApp' : 'Email');
  if (audience === 'Sponsors') return st.filter(s => ['Sponsor', 'Decision maker'].includes(s.category) || s.population === 'DG').map(s => ({ name: s.name, email: s.email, phone: s.phone, channel: ch(s) }));
  if (audience === 'Relays') return st.filter(s => s.category === 'Change relay').map(s => ({ name: s.name, email: s.email, phone: s.phone, channel: ch(s) }));
  if (audience === 'Managers') { const m = new Map(); for (const e of C.enrollments(t.project_id)) if (e.manager && !m.has(norm(e.manager))) m.set(norm(e.manager), { name: e.manager, email: e.manager_email, phone: e.manager_phone }); return [...m.values()]; }
  if (audience === 'Learners') { const m = new Map(); for (const e of C.enrollments(t.project_id)) if (!m.has(norm(e.name))) m.set(norm(e.name), { name: e.name, email: e.email, phone: e.phone }); return [...m.values()]; }
  return st.filter(s => norm(s.category) === norm(audience) || norm(s.role) === norm(audience)).map(s => ({ name: s.name, email: s.email, phone: s.phone, channel: ch(s) }));
}
async function shareLessons({ req, t, rows }) { let n = 0; for (const r of rows) for (const p of audiencePeople(t, r.audience)) { const res = await C.message(req, t, { ...p, channel: r.channel === 'WhatsApp' && p.phone ? 'WhatsApp' : 'Email' }, T(req.lang, 'Results of the training plan', 'Résultats du plan de formation', 'نتائج خطة التكوين'), `${T(req.lang, `Hello ${p.name},`, `Bonjour ${p.name},`, `مرحبا ${p.name}،`)}\n${str(r.message)}`, 'lessons'); if (res.status !== 'failed') n++; } return { sent: n }; }
function widgetRows({ req, t, lang }, ai) { const ks = indicators(req, t); const pick = ai ? ks.filter(k => k.value != null).sort((a, b) => (a.status === 'Green') - (b.status === 'Green')) : ks.filter(k => ['KPI-012', 'KPI-013', 'FLOW-L2', 'FLOW-ATT'].includes(k.id));
  return pick.slice(0, 6).map(k => ({ item: k.id, chart: k.unit === '%' ? 'Gauge' : 'Tile', target: String(k.target), roles: ai && k.status !== 'Green' ? 'R-02, R-03, R-13' : 'R-02, R-03' })); }
function completeWidgets({ req, t, rows }) { const keep = new Set(); rows.forEach((r, i) => { const k = 'widget|' + norm(str(r.item)); keep.add(k); C.upsert(req, t, 'DashboardWidget', k, { kpi_id: str(r.item), chart: r.chart, target: num(r.target), roles: C.split(r.roles), sort: i, flow_step: 'MP-10.2' }); }); C.prune('DashboardWidget', t.project_id, 'MP-10.2', keep); }
/** Widgets of the project dashboard with their current values (shown on the project page). */
export function widgets(req, projectId) { const t = { project_id: projectId }; const ks = indicators(req, t); return C.recs('DashboardWidget', projectId).sort((a, b) => a.sort - b.sort).map(w => { const k = ks.find(x => x.id === w.kpi_id); return { id: w.kpi_id, chart: w.chart, target: w.target ?? k?.target, roles: w.roles, name: k?.name || ml(w.kpi_id), value: k?.value ?? null, unit: k?.unit || '', status: k?.status || null, direction: k?.direction }; }); }

const rem = purpose => async ({ req, t }) => ({ sent: await C.remindNow(req, C.campaignOf(req.orgId, t.project_id, purpose)) });
const hasAnswers = (fn, code = 'err.noResponses') => ({ req, t }) => (fn(req, t).length ? null : code);
export const HOOKS = {
  'MP-09.1': { template: ctx => instrumentRows(ctx, false), ai: ctx => instrumentRows(ctx, true), complete: completeInstruments },
  'MP-09.2': { template: ctx => questionRows(ctx, false), ai: ctx => questionRows(ctx, true) },
  'MP-09.3': { panel: l1Panel, actions: { send: ctx => sendL1(ctx), remind: rem('l1') }, onComplete: ({ req, t }) => l1Store(req, t), blocker: hasAnswers(l1Results) },
  'MP-09.4': { panel: l2Panel, actions: { send: ctx => sendL2(ctx), remind: rem('l2') }, onComplete: ({ req, t }) => l2Store(req, t), blocker: hasAnswers(l2Results) },
  'MP-09.5': { panel: l3Panel, actions: { send: ctx => sendL3(ctx), remind: rem('l3') }, onComplete: ({ req, t }) => l3Store(req, t), blocker: hasAnswers(l3Results) },
  'MP-09.6': { panel: progressPanel, actions: { compute: ({ req, t }) => ({ lines: progressStore(req, t) }) }, onComplete: ({ req, t }) => progressStore(req, t), blocker: ({ t }) => (progression(t).length ? null : 'err.noResponses') },
  'MP-10.3': { panel: kpiPanel, actions: { compute: ({ req, t }) => ({ indicators: storeIndicators(req, t) }) }, onComplete: ({ req, t }) => storeIndicators(req, t) },
  'MP-09.7': { template: ctx => reviewFields(ctx, false), ai: ctx => reviewFields(ctx, true) },
  'MP-20.5': { template: ctx => qualityRows(ctx, false), ai: ctx => qualityRows(ctx, true), complete: completeQuality },
  'MP-10.6': { template: ctx => lessonRows(ctx, false), ai: ctx => lessonRows(ctx, true), completeAsync: ctx => shareLessons(ctx), panel: ({ t, lang }) => { const m = C.messagesOf(t.project_id, 'lessons'); return m.length ? { tables: [{ title: T(lang, 'Messages sent', 'Messages envoyés', 'الرسائل المرسلة'), columns: [['to', T(lang, 'To', 'À', 'إلى')], ['channel', T(lang, 'Channel', 'Canal', 'القناة')], ['status', T(lang, 'Status', 'Statut', 'الحالة')]], rows: m.map(x => ({ to: x.recipient, channel: x.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail', status: x.status })) }] } : {}; } },
  'MP-10.2': { template: ctx => widgetRows(ctx, false), ai: ctx => widgetRows(ctx, true), complete: completeWidgets },
};
