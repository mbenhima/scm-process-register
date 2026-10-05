// Training plan structure: Program → Training (level, identifier, name, objectives, duration, prerequisites),
// a detailed agenda given half-day by half-day with lectures, quizzes and workshops, and the value proposition of
// the training for each persona (behaviour, pain points, hopes → fit).
// Golden rules: every half-day has exactly one quiz and exactly one workshop, and at least one lecture; the number
// of half-days matches the duration.
import { J, pick } from '../lib/util.js';

export const LEVELS = ['Foundation', 'Intermediate', 'Advanced', 'Expert'];
export const ITEM_TYPES = ['Lecture', 'Quiz', 'Workshop'];
const L = (en, fr, ar) => ({ en, fr, ar });
const fill = (tpl, vars) => Object.fromEntries(Object.entries(tpl).map(([l, s]) => [l, String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : typeof vars[k] === 'object' ? pick(vars[k], l) : vars[k]))]));

export function halfDayLabel(i, lang = 'en') {
  const day = Math.floor(i / 2) + 1; const pm = i % 2 === 1;
  return { en: `Day ${day} — ${pm ? 'afternoon' : 'morning'}`, fr: `Jour ${day} — ${pm ? 'après-midi' : 'matin'}`, ar: `اليوم ${day} — ${pm ? 'بعد الزوال' : 'الصباح'}` }[lang] || `Day ${day}`;
}

/** Checks a training against the golden rules. Blocking issues prevent approval; warnings inform. */
export function checkRules(c) {
  const issues = []; const warnings = [];
  const agenda = Array.isArray(c.agenda) ? c.agenda : [];
  const d = Number(c.duration_days);
  if (!(d > 0) || Math.round(d * 2) !== d * 2) issues.push({ code: 'durationHalfDays' });
  else if (agenda.length !== d * 2) issues.push({ code: 'halfDayCount', expected: d * 2, found: agenda.length });
  agenda.forEach((h, i) => {
    const items = h.items || [];
    const n = type => items.filter(x => x.type === type).length;
    if (n('Quiz') !== 1) issues.push({ code: n('Quiz') ? 'manyQuiz' : 'noQuiz', halfDay: i + 1, n: n('Quiz') });
    if (n('Workshop') !== 1) issues.push({ code: n('Workshop') ? 'manyWorkshop' : 'noWorkshop', halfDay: i + 1, n: n('Workshop') });
    if (n('Lecture') < 1) issues.push({ code: 'noLecture', halfDay: i + 1 });
    if (items.some(x => !pick(x.title, 'en').trim() && !pick(x.title, 'fr').trim() && !pick(x.title, 'ar').trim())) issues.push({ code: 'untitledItem', halfDay: i + 1 });
    const minutes = items.reduce((s, x) => s + (Number(x.minutes) || 0), 0);
    if (minutes && (minutes < 150 || minutes > 240)) warnings.push({ code: 'halfDayMinutes', halfDay: i + 1, minutes });
  });
  if (!(c.objectives || []).filter(o => pick(o, 'en').trim() || pick(o, 'fr').trim()).length) issues.push({ code: 'noObjective' });
  if (!c.level) issues.push({ code: 'noLevel' });
  if (!String(pick(c.prerequisites, 'en') || pick(c.prerequisites, 'fr') || '').trim()) warnings.push({ code: 'noPrerequisites' });
  const personas = (c.personas || []).filter(p => p.persona_id);
  if (!personas.length) issues.push({ code: 'noPersona' });
  for (const p of personas) if (!['behaviour', 'pain_points', 'hopes', 'fit'].every(k => String(pick(p[k], 'en') || pick(p[k], 'fr') || pick(p[k], 'ar') || '').trim())) warnings.push({ code: 'personaIncomplete', persona: p.persona_id });
  return { ok: !issues.length, issues, warnings, halfDays: agenda.length, quizzes: agenda.reduce((s, h) => s + (h.items || []).filter(x => x.type === 'Quiz').length, 0), workshops: agenda.reduce((s, h) => s + (h.items || []).filter(x => x.type === 'Workshop').length, 0) };
}

// ------------------------------------------------------------------ built-in agenda generator (AIUC-04 "Module structure proposal")
const HD = {
  open: { lectures: [[L('Foundations of {theme}: key concepts and vocabulary', 'Fondamentaux de {theme} : concepts clés et vocabulaire', 'أساسيات {theme}: المفاهيم الأساسية والمصطلحات'), 75], [L('Why {theme} matters for {core}', 'Pourquoi {theme} compte pour {core}', 'لماذا يهم {theme} وظيفة {core}'), 45]],
    quiz: [L('Quiz — key concepts of {theme}', 'Quiz — concepts clés de {theme}', 'اختبار — المفاهيم الأساسية لـ {theme}'), 20], workshop: [L('Workshop — map today’s practices in {core} against {theme}', 'Atelier — cartographier les pratiques actuelles de {core} au regard de {theme}', 'ورشة — رسم خريطة الممارسات الحالية في {core} مقارنة بـ {theme}'), 75] },
  method: { lectures: [[L('Methods and tools of {theme}', 'Méthodes et outils de {theme}', 'مناهج وأدوات {theme}'), 75], [L('Worked example from the {sector} sector', 'Exemple commenté du secteur {sector}', 'مثال تطبيقي من قطاع {sector}'), 40]],
    quiz: [L('Quiz — choosing the right method', 'Quiz — choisir la bonne méthode', 'اختبار — اختيار المنهج المناسب'), 20], workshop: [L('Workshop — apply the method to a real case from {org}', 'Atelier — appliquer la méthode à un cas réel de {org}', 'ورشة — تطبيق المنهج على حالة حقيقية من {org}'), 80] },
  govern: { lectures: [[L('Governance, risks and {standard} requirements', 'Gouvernance, risques et exigences {standard}', 'الحكامة والمخاطر ومتطلبات {standard}'), 60], [L('Data, quality and evidence to keep', 'Données, qualité et preuves à conserver', 'البيانات والجودة والأدلة الواجب حفظها'), 45]],
    quiz: [L('Quiz — compliance and risk scenarios', 'Quiz — scénarios de conformité et de risque', 'اختبار — سيناريوهات المطابقة والمخاطر'), 20], workshop: [L('Workshop — build the control checklist of your process', 'Atelier — construire la check-list de contrôle de votre processus', 'ورشة — إعداد قائمة المراقبة الخاصة بمساركم'), 80] },
  deploy: { lectures: [[L('Deploying {theme}: roles, change and adoption', 'Déployer {theme} : rôles, changement et adoption', 'تنزيل {theme}: الأدوار والتغيير والتبني'), 60], [L('Indicators that measure the results', 'Indicateurs pour mesurer les résultats', 'المؤشرات التي تقيس النتائج'), 45]],
    quiz: [L('Quiz — adoption and indicator cases', 'Quiz — cas d’adoption et d’indicateurs', 'اختبار — حالات التبني والمؤشرات'), 20], workshop: [L('Workshop — design the indicator dashboard of your team', 'Atelier — concevoir le tableau de bord d’indicateurs de votre équipe', 'ورشة — تصميم لوحة مؤشرات فريقك'), 80] },
  advanced: { lectures: [[L('Advanced practices and lessons learned in {core}', 'Pratiques avancées et retours d’expérience en {core}', 'ممارسات متقدمة ودروس مستفادة في {core}'), 75]],
    quiz: [L('Quiz — advanced cases', 'Quiz — cas avancés', 'اختبار — حالات متقدمة'), 25], workshop: [L('Workshop — solve a critical incident scenario', 'Atelier — résoudre un scénario d’incident critique', 'ورشة — معالجة سيناريو حادث حرج'), 100] },
  transfer: { lectures: [[L('Transfer to the workplace: the 30-60-90-day plan', 'Transfert en situation de travail : le plan 30-60-90 jours', 'النقل إلى وضعية العمل: مخطط 30-60-90 يوما'), 60]],
    quiz: [L('Final assessment (Kirkpatrick level 2)', 'Évaluation finale (niveau 2 de Kirkpatrick)', 'التقييم النهائي (المستوى 2 من كيركباتريك)'), 30], workshop: [L('Workshop — individual action plan and peer review', 'Atelier — plan d’action individuel et revue entre pairs', 'ورشة — مخطط العمل الفردي والمراجعة بين الأقران'), 90] },
};
const SEQ = ['open', 'method', 'govern', 'deploy', 'advanced'];
/** Draft agenda for a duration, respecting the golden rules: one quiz and one workshop per half-day. */
export function draftAgenda(durationDays, vars) {
  const n = Math.max(1, Math.round(Number(durationDays) * 2));
  return Array.from({ length: n }, (_, i) => {
    const key = n === 1 ? 'open' : i === 0 ? 'open' : i === n - 1 ? 'transfer' : SEQ[1 + ((i - 1) % (SEQ.length - 1))];
    const p = HD[key]; const cont = i > 0 && key === SEQ[1 + ((i - 1) % (SEQ.length - 1))] && i - 1 >= SEQ.length - 1;
    const items = [
      ...p.lectures.map(([tt, m], k) => ({ type: 'Lecture', title: fill(tt, vars), minutes: m, ...(cont && k === 0 ? { note: L('continued', 'suite', 'تتمة') } : {}) })),
      { type: 'Quiz', title: fill(p.quiz[0], vars), minutes: p.quiz[1] },
      { type: 'Workshop', title: fill(p.workshop[0], vars), minutes: p.workshop[1] },
    ];
    // Order within the half-day: lectures, then the quiz that checks them, then the workshop that applies them.
    return { half_day: i + 1, label: { en: halfDayLabel(i, 'en'), fr: halfDayLabel(i, 'fr'), ar: halfDayLabel(i, 'ar') }, items };
  });
}

export function draftObjectives(vars) {
  return [
    fill(L('Explain the key concepts of {theme} and how they apply to {core}', 'Expliquer les concepts clés de {theme} et leur application à {core}', 'شرح المفاهيم الأساسية لـ {theme} وكيفية تطبيقها في {core}'), vars),
    fill(L('Apply the methods and tools of {theme} to a real case from {org}', 'Appliquer les méthodes et outils de {theme} à un cas réel de {org}', 'تطبيق مناهج وأدوات {theme} على حالة حقيقية من {org}'), vars),
    fill(L('Plan the deployment of {theme} with its indicators and controls ({standard})', 'Planifier le déploiement de {theme} avec ses indicateurs et contrôles ({standard})', 'تخطيط تنزيل {theme} بمؤشراته وضوابطه ({standard})'), vars),
  ];
}

// ------------------------------------------------------------------ personas and value proposition
export const PERSONA_SEED = [
  { code: 'P-DG', population: 'DG', name: L('Executive sponsor — General Manager', 'Sponsor exécutif — Directeur général', 'الراعي التنفيذي — المدير العام'),
    description: L('Sets the strategy and arbitrates the training budget.', 'Fixe la stratégie et arbitre le budget de formation.', 'يحدد الاستراتيجية ويحسم في ميزانية التكوين.'),
    behaviour: L('Decides on facts presented in short steering meetings; delegates execution to the management team; follows a few indicators.', 'Décide sur des faits présentés en comités courts ; délègue l’exécution à l’équipe de management ; suit quelques indicateurs.', 'يتخذ القرار بناء على وقائع تعرض في اجتماعات قيادة قصيرة؛ يفوض التنفيذ لفريق التدبير؛ يتتبع بعض المؤشرات.'),
    pain_points: L('Training spend with no visible link to the strategic objectives; results of the previous plan hard to prove; {standard} audits that expose competence gaps.', 'Dépenses de formation sans lien visible avec les objectifs stratégiques ; résultats du plan précédent difficiles à prouver ; audits {standard} qui révèlent des écarts de compétences.', 'نفقات تكوين دون صلة واضحة بالأهداف الاستراتيجية؛ صعوبة إثبات نتائج المخطط السابق؛ تدقيقات {standard} تكشف عن فجوات في الكفاءات.'),
    hopes: L('A prioritized plan that serves the strategy, a measurable return, and a management team able to lead the change.', 'Un plan priorisé au service de la stratégie, un retour mesurable, et une équipe de management capable de conduire le changement.', 'مخطط مرتب حسب الأولوية يخدم الاستراتيجية، وعائد قابل للقياس، وفريق تدبير قادر على قيادة التغيير.') },
  { code: 'P-MGT', population: 'Management', name: L('Manager — director, head of department, process owner', 'Manager — directeur, responsable, pilote de processus', 'المسير — مدير، مسؤول، قائد مسار'),
    description: L('Runs a function or a cross-functional process and its team.', 'Pilote une fonction ou un processus transverse et son équipe.', 'يقود وظيفة أو مسارا عرضانيا وفريقه.'),
    behaviour: L('Balances daily operations and improvement projects; prefers practical, short formats; relies on key people in the team.', 'Arbitre entre opérations quotidiennes et projets d’amélioration ; préfère des formats pratiques et courts ; s’appuie sur des personnes clés de l’équipe.', 'يوازن بين العمليات اليومية ومشاريع التحسين؛ يفضل صيغا عملية وقصيرة؛ يعتمد على أشخاص محوريين في الفريق.'),
    pain_points: L('Team absent from the job during long trainings; skills gaps on critical activities of {core}; processes not documented or without an owner.', 'Équipe absente du poste pendant des formations longues ; écarts de compétences sur les activités critiques de {core} ; processus non documentés ou sans pilote.', 'غياب الفريق عن العمل خلال تكوينات طويلة؛ فجوات في الكفاءات في الأنشطة الحرجة لـ {core}؛ مسارات غير موثقة أو دون قائد.'),
    hopes: L('Trainings that solve the function’s real problems, applied on the job the following week, with indicators the manager can follow.', 'Des formations qui règlent les vrais problèmes de la fonction, appliquées dès la semaine suivante, avec des indicateurs que le manager peut suivre.', 'تكوينات تعالج المشاكل الحقيقية للوظيفة، تطبق في العمل منذ الأسبوع الموالي، بمؤشرات يمكن للمسير تتبعها.') },
  { code: 'P-MBR', population: 'Member', name: L('Team member — {core}', 'Membre de l’équipe — {core}', 'عضو الفريق — {core}'),
    description: L('Performs the tasks of the job and is evaluated on them.', 'Réalise les tâches du poste et est évalué sur celles-ci.', 'ينجز مهام المنصب ويقيم عليها.'),
    behaviour: L('Learns by doing and from peers; uses a phone more than a computer; wants to know what changes in daily work.', 'Apprend en faisant et auprès des pairs ; utilise plus le téléphone que l’ordinateur ; veut savoir ce qui change au quotidien.', 'يتعلم بالممارسة ومن الزملاء؛ يستعمل الهاتف أكثر من الحاسوب؛ يريد معرفة ما يتغير في عمله اليومي.'),
    pain_points: L('New tools introduced without explanation; theoretical trainings far from the tasks; fear of making mistakes with {theme}.', 'Nouveaux outils introduits sans explication ; formations théoriques éloignées des tâches ; peur de se tromper avec {theme}.', 'أدوات جديدة تدخل دون شرح؛ تكوينات نظرية بعيدة عن المهام؛ الخوف من الخطأ عند استعمال {theme}.'),
    hopes: L('Practical skills recognized by a certificate, less rework, and a clear path to the next position.', 'Des compétences pratiques reconnues par une attestation, moins de reprises, et un parcours clair vers le poste suivant.', 'كفاءات عملية معترف بها بشهادة، وإعادة عمل أقل، ومسار واضح نحو المنصب الموالي.') },
];
const FIT = {
  DG: L('Links {theme} to the strategic objectives with the indicators to follow in steering meetings; answers the concern about training spend without proven results and supports a measurable return.', 'Relie {theme} aux objectifs stratégiques avec les indicateurs à suivre en comité ; répond à la crainte de dépenses sans résultats prouvés et soutient un retour mesurable.', 'يربط {theme} بالأهداف الاستراتيجية مع المؤشرات الواجب تتبعها في اجتماعات القيادة؛ يستجيب للتخوف من نفقات دون نتائج مثبتة ويدعم عائدا قابلا للقياس.'),
  Management: L('Short half-days with one workshop on the function’s own cases, so {theme} is applied the following week; closes gaps on critical activities of {core} and gives the manager indicators to follow.', 'Des demi-journées courtes avec un atelier sur les cas de la fonction, pour appliquer {theme} dès la semaine suivante ; comble les écarts sur les activités critiques de {core} et donne au manager des indicateurs à suivre.', 'أنصاف أيام قصيرة بورشة حول حالات الوظيفة نفسها، لتطبيق {theme} منذ الأسبوع الموالي؛ تسد الفجوات في الأنشطة الحرجة لـ {core} وتمنح المسير مؤشرات للتتبع.'),
  Member: L('Hands-on workshop and a quiz every half-day make {theme} concrete for daily tasks in {core}; reduces the fear of mistakes and leads to a recognized certificate.', 'L’atelier pratique et le quiz de chaque demi-journée rendent {theme} concret pour les tâches quotidiennes de {core} ; réduit la peur de se tromper et mène à une attestation reconnue.', 'الورشة التطبيقية والاختبار في كل نصف يوم يجعلان {theme} ملموسا في المهام اليومية لـ {core}؛ يقلل الخوف من الخطأ ويؤدي إلى شهادة معترف بها.'),
};
export function personaFit(persona, vars) {
  const v = { ...vars };
  return { persona_id: persona.id, behaviour: fill(persona.behaviour, v), pain_points: fill(persona.pain_points, v), hopes: fill(persona.hopes, v), fit: fill(FIT[persona.population] || FIT.Member, v) };
}
export const fillVars = fill;
export const personaNeeds = p => ['behaviour', 'pain_points', 'hopes'].every(k => J(p[k], p[k]));
