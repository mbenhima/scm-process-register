// Detailed chapters of the Training Engineering Report (SRS 4.43, FR-DA-DGC-05 fine grain): stakeholders and scope,
// diagnostic and maturity, response statistics, one analysis per function, the skills assessment of every employee,
// gaps, needs, objectives, jobs and projects quoted by respondents, roadmap and schedule, learning design, sessions,
// budget, vendors, evaluation, risks and indicators, and every respondent's answers in annex. Every row comes from a
// record of the project or the Organization.
import { all, one } from '../db.js';
import { J, pick } from '../lib/util.js';
import { t } from '../i18n.js';

const L = (en, fr, ar) => ({ en, fr, ar });
const X = {
  stakeholders: L('Stakeholders consulted', 'Parties prenantes consultées', 'الأطراف المعنية المستشارة'), name: L('Name', 'Nom', 'الاسم'), role: L('Role', 'Rôle', 'الدور'),
  population: L('Population', 'Population', 'الفئة'), fn: L('Function', 'Fonction', 'الوظيفة'), level: L('Decision level', 'Niveau de décision', 'مستوى القرار'), channel: L('Channel', 'Canal', 'القناة'),
  consent: L('Consent', 'Consentement', 'الموافقة'), stakeholdersIntro: L('{n} people were consulted: {dg} from general management, {mg} managers and {mb} staff members.', '{n} personnes ont été consultées : {dg} de la direction générale, {mg} managers et {mb} collaborateurs.', 'تمت استشارة {n} شخصاً: {dg} من الإدارة العامة و{mg} من المسؤولين و{mb} من الموظفين.'),
  scope: L('Scope of the mission', 'Périmètre de la mission', 'نطاق المهمة'), criterion: L('Criterion', 'Critère', 'المعيار'), value: L('Value', 'Valeur', 'القيمة'), weight: L('Weight', 'Pondération', 'الوزن'), type: L('Type', 'Type', 'النوع'),
  focus: L('Focus', 'Orientation', 'التوجّه'), levels: L('Decision levels', 'Niveaux de décision', 'مستويات القرار'), approval: L('Approval', 'Approbation', 'المصادقة'), approvedOn: L('Approved on', 'Approuvé le', 'تاريخ المصادقة'),
  diagnostic: L('Diagnostic and maturity', 'Diagnostic et maturité', 'التشخيص والنضج'), axis: L('Axis', 'Axe', 'المحور'), score: L('Score (out of 5)', 'Note (sur 5)', 'الدرجة (من 5)'), reading: L('Reading', 'Lecture', 'القراءة'),
  axes: { strategy: L('Strategy', 'Stratégie', 'الاستراتيجية'), organization: L('Organization', 'Organisation', 'التنظيم'), processes: L('Processes', 'Processus', 'العمليات'), people: L('People and skills', 'Personnes et compétences', 'الأفراد والكفاءات'), is: L('Information systems', 'Systèmes d’information', 'نظم المعلومات') },
  strong: L('Strength to build on', 'Point fort à consolider', 'نقطة قوة يجب البناء عليها'), mid: L('Partly in place', 'Partiellement en place', 'قائم جزئياً'), weak: L('Priority for development', 'Priorité de développement', 'أولوية للتطوير'),
  maturity: L('Maturity model', 'Modèle de maturité', 'نموذج النضج'), current: L('Current level', 'Niveau actuel', 'المستوى الحالي'), target: L('Target level', 'Niveau cible', 'المستوى المستهدف'),
  stats: L('Response statistics', 'Statistiques de réponse', 'إحصاءات الإجابة'), invited: L('Invited', 'Invités', 'المدعوون'), responded: L('Responded', 'Ont répondu', 'أجابوا'), rate: L('Response rate', 'Taux de réponse', 'نسبة الإجابة'), completeness: L('Average completeness', 'Complétude moyenne', 'متوسط الاكتمال'),
  byPop: L('by population', 'par population', 'حسب الفئة'), byFn: L('by function', 'par fonction', 'حسب الوظيفة'), byCh: L('by channel', 'par canal', 'حسب القناة'),
  fnAnalysis: L('Competence needs by function', 'Besoins en compétences par fonction', 'حاجيات الكفاءات حسب الوظيفة'),
  fnIntro: L('Function {f}: {e} employees in the sample, {r} respondents, {g} skill gaps recorded and {d} training demands.', 'Fonction {f} : {e} collaborateurs dans l’échantillon, {r} répondants, {g} écarts de compétences relevés et {d} demandes de formation.', 'وظيفة {f}: {e} موظفين في العينة، و{r} مجيبين، و{g} فجوات كفاءة مسجلة، و{d} طلبات تكوين.'),
  perf: L('Performance by decision level', 'Performance par niveau de décision', 'الأداء حسب مستوى القرار'), status: L('Status', 'Statut', 'الحالة'), gap: L('Gap', 'Écart', 'الفجوة'),
  employee: L('Employee', 'Collaborateur', 'الموظف'), position: L('Position', 'Poste', 'المنصب'), competency: L('Competency', 'Compétence', 'الكفاءة'), selfL: L('Self-assessed', 'Auto-évalué', 'التقييم الذاتي'), validated: L('Validated', 'Validé', 'المعتمد'),
  assessment: L('Skills assessment of the employees', 'Évaluation des compétences des collaborateurs', 'تقييم كفاءات الموظفين'), gaps: L('Skill gaps by competency', 'Écarts de compétences par compétence', 'فجوات الكفاءات حسب الكفاءة'),
  people: L('People', 'Personnes', 'الأشخاص'), avgGap: L('Average gap', 'Écart moyen', 'متوسط الفجوة'), critical: L('Critical', 'Critique', 'حرجة'), family: L('Family', 'Famille', 'العائلة'),
  needsReg: L('Training needs register', 'Registre des besoins de formation', 'سجل حاجيات التكوين'), source: L('Source', 'Source', 'المصدر'), impact: L('Impact (1–5)', 'Impact (1–5)', 'الأثر (1–5)'), theme: L('Theme', 'Thème', 'المحور'),
  objectives: L('Objectives stated by the respondents', 'Objectifs exprimés par les répondants', 'الأهداف التي عبّر عنها المجيبون'), objective: L('Objective', 'Objectif', 'الهدف'), smart: L('SMART formulation', 'Formulation SMART', 'الصياغة الذكية'), links: L('Linked to', 'Lié à', 'مرتبط بـ'),
  linkK: { link_customer: L('customer', 'client', 'الزبون'), link_financial: L('financial', 'financier', 'المالي'), link_operational: L('operational', 'opérationnel', 'التشغيلي'), link_hr: L('HR', 'RH', 'الموارد البشرية'), link_innovation: L('innovation', 'innovation', 'الابتكار') },
  jobs: L('Jobs, key activities and competences', 'Métiers, activités clés et compétences', 'المهن والأنشطة الرئيسية والكفاءات'), job: L('Job or task', 'Métier ou tâche', 'المهنة أو المهمة'), activities: L('Key activities', 'Activités clés', 'الأنشطة الرئيسية'), competences: L('Competences', 'Compétences', 'الكفاءات'), criticality: L('Criticality (1–5)', 'Criticité (1–5)', 'الأهمية (1–5)'),
  projects: L('Projects cited by the respondents', 'Projets cités par les répondants', 'المشاريع التي ذكرها المجيبون'), project: L('Project', 'Projet', 'المشروع'), period: L('Period', 'Période', 'الفترة'), state: L('State', 'État', 'الحالة'),
  aiUse: L('Use of AI and digital tools today', 'Usage actuel de l’IA et des outils numériques', 'الاستعمال الحالي للذكاء الاصطناعي والأدوات الرقمية'), question: L('Question', 'Question', 'السؤال'), answer: L('Answer', 'Réponse', 'الإجابة'), respondent: L('Respondent', 'Répondant', 'المجيب'),
  planning: L('Strategic planning practices', 'Pratiques de planification stratégique', 'ممارسات التخطيط الاستراتيجي'), yes: L('Yes', 'Oui', 'نعم'), no: L('No', 'Non', 'لا'),
  roadmap: L('Roadmap by wave', 'Feuille de route par vague', 'خارطة الطريق حسب الموجة'), wave: L('Wave', 'Vague', 'الموجة'), initiative: L('Initiative', 'Initiative', 'المبادرة'),
  schedule: L('Project schedule', 'Calendrier du projet', 'الجدول الزمني للمشروع'), task: L('Work package', 'Lot de travail', 'حزمة العمل'), start: L('Start', 'Début', 'البداية'), end: L('End', 'Fin', 'النهاية'), done: L('Progress', 'Avancement', 'التقدم'),
  design: L('Learning design: paths, modules and content', 'Ingénierie pédagogique : parcours, modules et contenus', 'الهندسة البيداغوجية: المسارات والوحدات والمحتويات'), path: L('Learning path', 'Parcours', 'المسار'), days: L('Days', 'Jours', 'الأيام'),
  module: L('Module', 'Module', 'الوحدة'), modality: L('Modality', 'Modalité', 'النمط'), hours: L('Hours', 'Heures', 'الساعات'), designStatus: L('Design status', 'Statut de conception', 'حالة التصميم'),
  content: L('Content assets', 'Ressources pédagogiques', 'الموارد البيداغوجية'), format: L('Format', 'Format', 'الصيغة'), size: L('Size (MB)', 'Taille (Mo)', 'الحجم (ميغابايت)'), review: L('Review date', 'Date de revue', 'تاريخ المراجعة'), language: L('Language', 'Langue', 'اللغة'),
  sessions: L('Sessions and enrolments', 'Sessions et inscriptions', 'الدورات والتسجيلات'), session: L('Session', 'Session', 'الدورة'), date: L('Date', 'Date', 'التاريخ'), capacity: L('Capacity', 'Capacité', 'السعة'), trainer: L('Trainer', 'Formateur', 'المكوّن'), enrolled: L('Enrolled', 'Inscrits', 'المسجلون'),
  attendance: L('Attendance', 'Présence', 'الحضور'), completion: L('Completion', 'Achèvement', 'الإنجاز'), enrolments: L('Enrolments', 'Inscriptions', 'التسجيلات'),
  budget: L('Budget detail', 'Détail du budget', 'تفاصيل الميزانية'), line: L('Budget line', 'Ligne budgétaire', 'بند الميزانية'), allocated: L('Allocated', 'Alloué', 'المخصص'), planned: L('Planned', 'Prévu', 'المخطط'), committed: L('Committed', 'Engagé', 'الملتزم به'), actual: L('Actual', 'Réalisé', 'الفعلي'), refund: L('Refund forecast', 'Remboursement prévu', 'الاسترداد المتوقع'), total: L('Total', 'Total', 'المجموع'),
  budgetText: L('Allocated {a}, committed {c} ({cp} %), spent {s} ({sp} % of planned); expected refunds {r}.', 'Alloué {a}, engagé {c} ({cp} %), réalisé {s} ({sp} % du prévu) ; remboursements attendus {r}.', 'المخصص {a}، الملتزم به {c} ({cp}%)، المنفق {s} ({sp}% من المخطط)؛ الاستردادات المتوقعة {r}.'),
  vendors: L('Training providers', 'Prestataires de formation', 'مقدمو خدمات التكوين'), vendor: L('Provider', 'Prestataire', 'المقدّم'), accreditation: L('Accreditation valid until', 'Agrément valable jusqu’au', 'الاعتماد صالح إلى غاية'), performance: L('Performance (out of 5)', 'Performance (sur 5)', 'الأداء (من 5)'),
  evaluation: L('Evaluation of the trainings', 'Évaluation des formations', 'تقييم التكوينات'), evalLevel: L('Kirkpatrick level', 'Niveau Kirkpatrick', 'مستوى كيركباتريك'), results: L('Results', 'Résultats', 'النتائج'), average: L('Average score', 'Score moyen', 'متوسط الدرجة'),
  kp: { 1: L('Reaction', 'Réaction', 'رد الفعل'), 2: L('Learning', 'Apprentissage', 'التعلم'), 3: L('Behaviour', 'Comportement', 'السلوك'), 4: L('Results', 'Résultats', 'النتائج') },
  certs: L('Certifications', 'Certifications', 'الشهادات'), requirement: L('Requirement', 'Exigence', 'المتطلب'), validUntil: L('Valid until', 'Valable jusqu’au', 'صالحة إلى غاية'),
  idp: L('Individual development plans', 'Plans de développement individuels', 'خطط التطوير الفردية'), progress: L('Progress', 'Avancement', 'التقدم'),
  risks: L('Risks, controls and indicators', 'Risques, contrôles et indicateurs', 'المخاطر والضوابط والمؤشرات'), risk: L('Risk or opportunity', 'Risque ou opportunité', 'الخطر أو الفرصة'), category: L('Category', 'Catégorie', 'الفئة'),
  inherent: L('Inherent', 'Inhérent', 'المتأصل'), residual: L('Residual', 'Résiduel', 'المتبقي'), controls: L('Controls', 'Contrôles', 'الضوابط'), owner: L('Owner', 'Propriétaire', 'المالك'),
  kpis: L('Indicators of the project', 'Indicateurs du projet', 'مؤشرات المشروع'), indicator: L('Indicator', 'Indicateur', 'المؤشر'), last: L('Latest periods', 'Dernières périodes', 'الفترات الأخيرة'),
  answers: L('Answers of each respondent', 'Réponses de chaque répondant', 'إجابات كل مجيب'), answersIntro: L('Answers are shown in the language of this document; the original wording, in the language of the interview or of the form, is kept in the application.', 'Les réponses sont présentées dans la langue de ce document ; la formulation d’origine, dans la langue de l’entretien ou du formulaire, est conservée dans l’application.', 'تُعرض الإجابات بلغة هذه الوثيقة؛ ويُحتفظ في التطبيق بالصياغة الأصلية بلغة المقابلة أو الاستمارة.'),
  submitted: L('Submitted', 'Soumise le', 'تاريخ الإرسال'), item: L('Item', 'Élément', 'العنصر'),
};
const x = (k, lang, p = {}) => { const v = X[k]; const s = (v?.[lang] || v?.en || k); return Object.entries(p).reduce((a, [kk, vv]) => a.split(`{${kk}}`).join(String(vv)), s); };

/** Builds the detailed sections; `put(at, section)` inserts a section after the chapter it belongs to. */
export function terDetails(orgId, projectId, lang, { qs, sets, src }) {
  const P = v => (v && typeof v === 'object' && !Array.isArray(v) ? pick(v, lang) : v);
  const fmtN = n => Number(n || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-US');
  const st = s => { const v = t('status.' + s, lang); return v === 'status.' + s ? s : v; };
  const recs = e => all(`SELECT id, data, version, updated_at FROM records WHERE entity=? AND project_id=?`, e, projectId).map(r => ({ id: r.id, updated_at: r.updated_at, ...J(r.data, {}) }));
  const orgRecs = e => all(`SELECT id, data, updated_at FROM records WHERE entity=? AND org_id=? AND project_id IS NULL`, e, orgId).map(r => ({ id: r.id, updated_at: r.updated_at, ...J(r.data, {}) }));
  const userName = id => (id ? one(`SELECT name FROM users WHERE id=?`, id)?.name : null) || '—';
  const fnNodes = all(`SELECT id, name FROM obs_nodes WHERE org_id=? AND type='Function'`, orgId).map(f => { const n = J(f.name, f.name); return { id: f.id, name: P(n), names: typeof n === 'object' ? Object.values(n) : [n] }; });
  const fnName = id => fnNodes.find(f => f.id === id)?.name || '—';
  const fnLabel = name => fnNodes.find(f => f.names.includes(name))?.name || name; // function names are stored in the language of the form
  const out = { c1: [], c3: [], c4: [], c5: [], c6: [], annex: [] };

  // ---------------------------------------------------------------- chapter 1 additions
  const sh = src('Stakeholder', recs('Stakeholder'), 'MP-53');
  if (sh.length) { const c = p => sh.filter(s => s.population === p).length;
    out.c1.push({ heading: x('stakeholders', lang), text: x('stakeholdersIntro', lang, { n: sh.length, dg: c('DG'), mg: c('Management'), mb: c('Member') }),
      table: { columns: [x('name', lang), x('role', lang), x('population', lang), x('fn', lang), x('level', lang), x('channel', lang), x('consent', lang)],
        rows: sh.map(s => [s.name || s.label, P(s.role_t) || s.role || '—', t('pop.' + s.population, lang), fnName(s.function_id), s.decision_level || '—', st(s.preferred_channel), st(s.consent_status)]) } }); }
  const sow = recs('ScopeOfWork')[0]; const crit = src('ScopeCriterion', recs('ScopeCriterion'), 'MP-52');
  if (sow || crit.length) out.c1.push({ heading: x('scope', lang), text: sow ? `${x('focus', lang)}: ${sow.focus} · ${x('levels', lang)}: ${(sow.decision_levels || []).join(', ')} · ${x('approval', lang)}: ${st(sow.approval_status)}${sow.approved_on ? ` (${String(sow.approved_on).slice(0, 10)}, ${userName(sow.approved_by)})` : ''}` : null,
    table: crit.length ? { columns: [x('criterion', lang), x('type', lang), x('fn', lang), x('level', lang), x('weight', lang)], rows: crit.map(c => [P(c.label), c.criterion_type, fnName(c.function_id) !== '—' ? fnName(c.function_id) : P(c.criterion_value), c.decision_level || '—', String(c.weight ?? 1)]) } : null });
  const dia = recs('DiagnosticAssessment')[0]; const mat = recs('MaturityAssessment');
  if (dia?.axis_scores) out.c1.push({ heading: x('diagnostic', lang), table: { columns: [x('axis', lang), x('score', lang), x('reading', lang)],
    rows: Object.entries(dia.axis_scores).map(([k, v]) => [P(X.axes[k]) || k, String(v), x(v >= 3.2 ? 'strong' : v >= 2.6 ? 'mid' : 'weak', lang)]) } });
  if (mat.length) out.c1.push({ heading: x('maturity', lang), table: { columns: [x('maturity', lang), x('current', lang), x('target', lang), x('gap', lang)], rows: mat.map(m => [`${P(m.label)} (${m.model})`, String(m.overall_level), String(m.target_level), String((m.target_level || 0) - (m.overall_level || 0))]) } });
  const inv = all(`SELECT population, function_name, status, channel_plan FROM q_invitations WHERE project_id=?`, projectId);
  const resp = recs('QuestionnaireResponse');
  if (inv.length) {
    const group = (keyI, keyR) => { const m = {}; for (const i of inv) { const k = keyI(i) || '—'; (m[k] ||= { inv: 0, resp: 0, comp: [] }).inv++; } for (const r of resp) { const k = keyR(r) || '—'; (m[k] ||= { inv: 0, resp: 0, comp: [] }).resp++; m[k].comp.push(Number(r.completeness_pct) || 0); } return Object.entries(m); };
    const rows = g => g.map(([k, v]) => [k, String(v.inv), String(v.resp), v.inv ? Math.round(v.resp / v.inv * 100) + ' %' : '—', v.comp.length ? Math.round(v.comp.reduce((a, b) => a + b, 0) / v.comp.length) + ' %' : '—']);
    const cols = k => [k, x('invited', lang), x('responded', lang), x('rate', lang), x('completeness', lang)];
    out.c1.push({ heading: `${x('stats', lang)} — ${x('byPop', lang)}`, table: { columns: cols(x('population', lang)), rows: rows(group(i => t('pop.' + i.population, lang), r => t('pop.' + r.population, lang))) } });
    out.c1.push({ heading: `${x('stats', lang)} — ${x('byFn', lang)}`, table: { columns: cols(x('fn', lang)), rows: rows(group(i => fnLabel(i.function_name), r => fnLabel(r.function_name))) } });
    out.c1.push({ heading: `${x('stats', lang)} — ${x('byCh', lang)}`, table: { columns: cols(x('channel', lang)), rows: rows(group(() => null, r => st(r.channel_used)).filter(([k]) => k !== '—').map(([k, v]) => [k, { ...v, inv: v.resp }])) } });
  }

  // ---------------------------------------------------------------- chapter 3 additions: one analysis per function
  const emps = orgRecs('Employee'); const positions = new Map(orgRecs('Position').map(p => [p.id, p])); const comps = new Map(orgRecs('Competency').map(c => [c.id, c]));
  const targets = orgRecs('PositionCompetencyTarget'); const sa = src('SkillAssessment', recs('SkillAssessment'), 'MP-16'); const gaps = src('SkillGap', recs('SkillGap'), 'MP-16');
  const perf = recs('PerformanceAssessment'); const swf = recs('FunctionalSwot'); const dem = recs('TrainingDemand'); const ax = recs('ImprovementAxis');
  const empById = new Map(emps.map(e => [e.id, e]));
  const fnOfEmp = id => empById.get(id)?.obs_node_id;
  const isFn = (f, name) => f.names.includes(name); // responses keep the function name in the language of the form
  const fnList = fnNodes.filter(f => perf.some(p => p.obs_node_id === f.id) || emps.some(e => e.obs_node_id === f.id) || resp.some(r => isFn(f, r.function_name)));
  for (const f of fnList) {
    const fe = emps.filter(e => e.obs_node_id === f.id); const fr = resp.filter(r => isFn(f, r.function_name));
    const fg = gaps.filter(g => fnOfEmp(g.employee_id) === f.id); const fd = dem.filter(d => fnOfEmp(d.requester_employee_id) === f.id);
    out.c3.push({ heading: `${x('fnAnalysis', lang)} — ${f.name}`, text: x('fnIntro', lang, { f: f.name, e: fe.length, r: fr.length, g: fg.length, d: fd.length }),
      table: { columns: [x('level', lang), x('score', lang).replace(/\(.*\)/, '(%)'), x('status', lang), x('gap', lang)], rows: perf.filter(p => p.obs_node_id === f.id).sort((a, b) => ['MS', 'MO', 'OP'].indexOf(a.level) - ['MS', 'MO', 'OP'].indexOf(b.level)).map(p => [p.level, `${p.score_pct} %`, st(p.rag), P(p.gap_comment) || '—']) } });
    const sw = swf.find(s => s.obs_node_id === f.id || P(s.function_name) === f.name);
    if (sw) out.c3.push({ heading: `${f.name} — SWOT`, table: { columns: [t('ter.strengths', lang), t('ter.weaknesses', lang), t('ter.opportunities', lang), t('ter.threats', lang)], rows: [[P(sw.strengths), P(sw.weaknesses), P(sw.opportunities), P(sw.threats)]] } });
    const rows = [];
    for (const e of fe) { const pos = positions.get(e.position_id); for (const tg of targets.filter(tt => tt.position_id === e.position_id)) { const a = sa.find(s => s.employee_id === e.id && s.competency_id === tg.competency_id); rows.push([e.label, P(pos?.title) || '—', P(comps.get(tg.competency_id)?.name) || '—', String(tg.target_level), a ? `${a.validated_level} (${x('selfL', lang).toLowerCase()} ${a.self_level})` : '—', a ? String(Math.max(0, tg.target_level - a.validated_level)) : '—']); } }
    if (rows.length) out.c3.push({ heading: `${f.name} — ${x('assessment', lang)}`, table: { columns: [x('employee', lang), x('position', lang), x('competency', lang), x('target', lang), x('validated', lang), x('gap', lang)], rows } });
    const quotes = fr.flatMap(r => { const A = r.answers_i18n?.[lang] || r.answers_json || {}; return [...(A.swot_function || []), ...(A.swot_light || [])].filter(Boolean).map(s => [r.respondent, t('pop.' + r.population, lang), [s.scope, s.strengths, s.weaknesses].filter(Boolean).join(' — '), s.competences || '—']); });
    if (quotes.length) out.c3.push({ heading: `${f.name} — ${x('competences', lang)}`, table: { columns: [x('respondent', lang), x('population', lang), `${t('ter.strengths', lang)} / ${t('ter.weaknesses', lang)}`, x('competences', lang)], rows: quotes } });
    if (fd.length) out.c3.push({ heading: `${f.name} — ${t('ter.demands', lang)}`, table: { columns: [x('employee', lang), x('theme', lang), x('type', lang), t('ter.priority', lang), x('status', lang)], rows: fd.map(d => [P(empById.get(d.requester_employee_id)?.label) || '—', P(d.theme), st(d.demand_type), st(d.priority), st(d.status)]) } });
  }
  const byComp = {}; for (const g of gaps) { const k = P(g.competency) || P(comps.get(g.competency_id)?.name) || '—'; (byComp[k] ||= { n: 0, sum: 0, crit: 0, fam: comps.get(g.competency_id)?.family || '' }); byComp[k].n++; byComp[k].sum += Number(g.gap_value) || 0; if (g.is_critical) byComp[k].crit++; }
  if (gaps.length) out.c3.push({ heading: x('gaps', lang), table: { columns: [x('competency', lang), x('family', lang), x('people', lang), x('avgGap', lang), x('critical', lang)], rows: Object.entries(byComp).sort((a, b) => b[1].sum - a[1].sum).map(([k, v]) => [k, v.fam, String(v.n), (v.sum / v.n).toFixed(1), String(v.crit)]) } });
  const needs = src('TrainingNeed', recs('TrainingNeed'), 'MP-03');
  if (needs.length) out.c3.push({ heading: x('needsReg', lang), table: { columns: ['#', x('theme', lang), x('source', lang), x('impact', lang), x('status', lang)], rows: needs.sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0)).map((n, i) => [String(i + 1), P(n.theme) || P(n.title), st(n.source), String(n.impact_score ?? '—'), st(n.validation_status)]) } });
  const obj = sets.flatMap(s => s.objectives || []);
  if (obj.length) out.c3.push({ heading: x('objectives', lang), table: { columns: [x('objective', lang), x('smart', lang), x('links', lang), x('competences', lang), x('population', lang)],
    rows: obj.map(o => [o.objective || '', o.smart || '', Object.keys(X.linkK).filter(k => o[k] === true || o[k] === 'true').map(k => P(X.linkK[k])).join(', ') || '—', o.competences || '—', t('pop.' + o.population, lang)]) } });
  const jobs = sets.flatMap(s => s.jobs || []);
  if (jobs.length) out.c3.push({ heading: x('jobs', lang), table: { columns: [x('job', lang), x('activities', lang), x('competences', lang), x('criticality', lang), x('respondent', lang)],
    rows: jobs.map(j => [j.job_title || j.task || '', j.key_activities || (j.performance != null ? `${x('performance', lang)}: ${j.performance}/5` : ''), j.competences || '—', String(j.critical ?? '—'), j.respondent || '']) } });
  const prj = sets.flatMap(s => s.projects || []);
  if (prj.length) out.c3.push({ heading: x('projects', lang), table: { columns: [x('project', lang), x('reading', lang), x('period', lang), x('state', lang), x('competences', lang)],
    rows: prj.map(p => [p.project || '', [p.details, p.remarks].filter(Boolean).join(' — '), [p.start, p.end].filter(Boolean).join(' → '), p.state || '—', p.competences || '—']) } });
  const ai = sets.flatMap(s => (s.ambitions || []).filter(a => /^ai_q/.test(a.key)));
  const aiRows = resp.flatMap(r => Object.entries((r.answers_i18n?.[lang] || r.answers_json)?.ai_sector || {}).filter(([k, v]) => /^ai_q/.test(k) && v).map(([k, v]) => [k.replace('ai_q', 'Q'), String(v), `${r.respondent} (${t('pop.' + r.population, lang)})`]));
  if (aiRows.length || ai.length) out.c3.push({ heading: x('aiUse', lang), table: { columns: [x('question', lang), x('answer', lang), x('respondent', lang)], rows: aiRows } });
  const sp = Object.values(sets.reduce((m, s) => { for (const [k, v] of Object.entries(s.strategicPlanning || {})) { (m[k] ||= { question: v.question, yes: 0, no: 0 }); m[k].yes += v.yes; m[k].no += v.no; } return m; }, {}));
  if (sp.length) out.c3.push({ heading: x('planning', lang), table: { columns: [x('question', lang), x('yes', lang), x('no', lang)], rows: sp.map(s => [s.question, String(s.yes), String(s.no)]) } });

  // ---------------------------------------------------------------- chapter 4 additions
  const ri = src('RoadmapInitiative', recs('RoadmapInitiative'), 'MP-04'); const themes = recs('TrainingTheme');
  if (ri.length) out.c4.push({ heading: x('roadmap', lang), table: { columns: [x('wave', lang), x('initiative', lang), x('theme', lang), t('ter.priority', lang), x('impact', lang)],
    rows: ri.sort((a, b) => (a.phase || 9) - (b.phase || 9)).map(r => { const th = themes.find(tt => tt.id === r.theme_id); return [String(r.phase ?? '—'), P(r.label), P(th?.name) || '—', String(th?.priority_rank ?? '—'), String(th?.impact_score ?? '—')]; }) } });
  const wbs = src('WbsNode', recs('WbsNode'), 'MP-49');
  if (wbs.length) out.c4.push({ heading: x('schedule', lang), table: { columns: [x('task', lang), x('start', lang), x('end', lang), x('done', lang)], rows: wbs.sort((a, b) => (a.sort || 0) - (b.sort || 0)).map(w => [P(w.name), w.start || '', w.end || '', `${w.percent ?? 0} %`]) } });

  // ---------------------------------------------------------------- chapter 5 additions
  const paths = recs('LearningPath'); const mods = recs('LearningModule'); const assets = recs('ContentAsset');
  if (paths.length || mods.length) out.c5.push({ heading: x('design', lang), table: { columns: [x('path', lang), x('days', lang), x('module', lang), x('modality', lang), x('hours', lang), x('designStatus', lang)],
    rows: paths.flatMap(p => { const m = mods.filter(mm => mm.path_id === p.id); return (m.length ? m : [{}]).map((mm, i) => [i ? '' : P(p.label), i ? '' : String(p.total_days ?? ''), P(mm.label) || '—', st(mm.modality || '—'), String(mm.duration_hours ?? ''), st(mm.design_status || '—')]); }) } });
  if (assets.length) out.c5.push({ heading: x('content', lang), table: { columns: [x('item', lang), x('format', lang), x('size', lang), x('review', lang), x('status', lang), x('language', lang)], rows: assets.map(a => [P(a.label), a.format, String(a.file_size_mb ?? ''), a.review_date || '', st(a.status), String(a.language || '').toUpperCase()]) } });
  const ses = src('Session', recs('Session'), 'MP-05'); const enr = recs('Enrollment');
  if (ses.length) out.c5.push({ heading: x('sessions', lang), table: { columns: [x('session', lang), x('date', lang), x('capacity', lang), x('trainer', lang), x('enrolled', lang)], rows: ses.map(s => [P(s.label), String(s.start_at || '').slice(0, 10), String(s.capacity ?? ''), userName(s.trainer_user_id), String(enr.filter(e => e.session_id === s.id).length)]) } });
  if (enr.length) out.c5.push({ heading: x('enrolments', lang), table: { columns: [x('employee', lang), x('session', lang), x('attendance', lang), x('completion', lang), x('date', lang)], rows: enr.map(e => [P(empById.get(e.employee_id)?.label) || '—', P(ses.find(s => s.id === e.session_id)?.label) || '—', st(e.attendance_status), st(e.completion_status), String(e.completed_at || '').slice(0, 10)]) } });
  const bl = recs('BudgetLine');
  if (bl.length) { const s = k => bl.reduce((a, b) => a + (Number(b[k]) || 0), 0); const pc = (a, b) => (b ? Math.round(a / b * 100) : 0);
    out.c5.push({ heading: x('budget', lang), text: x('budgetText', lang, { a: fmtN(s('allocated_amount')), c: fmtN(s('committed_amount')), cp: pc(s('committed_amount'), s('allocated_amount')), s: fmtN(s('actual_amount')), sp: pc(s('actual_amount'), s('planned_amount')), r: fmtN(s('refund_forecast')) }),
      table: { columns: [x('line', lang), x('allocated', lang), x('planned', lang), x('committed', lang), x('actual', lang), x('refund', lang)], rows: [...bl.map(b => [P(b.label), fmtN(b.allocated_amount), fmtN(b.planned_amount), fmtN(b.committed_amount), fmtN(b.actual_amount), fmtN(b.refund_forecast)]), [x('total', lang), fmtN(s('allocated_amount')), fmtN(s('planned_amount')), fmtN(s('committed_amount')), fmtN(s('actual_amount')), fmtN(s('refund_forecast'))]] } }); }
  const ven = orgRecs('Vendor');
  if (ven.length) out.c5.push({ heading: x('vendors', lang), table: { columns: [x('vendor', lang), x('accreditation', lang), x('performance', lang)], rows: ven.map(v => [v.legal_name || P(v.label), v.accreditation_valid_until || '—', String(v.performance_score ?? '—')]) } });
  const ev = recs('Evaluation');
  if (ev.length) { const by = {}; for (const e of ev) (by[e.level] ||= []).push(Number(e.score_pct) || 0);
    out.c5.push({ heading: x('evaluation', lang), table: { columns: [x('evalLevel', lang), x('results', lang), x('average', lang)], rows: Object.entries(by).sort().map(([k, v]) => [`${k} — ${P(X.kp[k]) || ''}`, String(v.length), Math.round(v.reduce((a, b) => a + b, 0) / v.length) + ' %']) } }); }
  const cert = recs('Certification');
  if (cert.length) out.c5.push({ heading: x('certs', lang), table: { columns: [x('employee', lang), x('item', lang), x('requirement', lang), x('validUntil', lang), x('status', lang)], rows: cert.map(c => [P(empById.get(c.employee_id)?.label) || '—', P(c.label), c.requirement_code || '—', c.valid_until || '—', st(c.status)]) } });
  const idp = recs('DevelopmentPlan');
  if (idp.length) out.c5.push({ heading: x('idp', lang), table: { columns: [x('employee', lang), x('item', lang), x('progress', lang)], rows: idp.map(d => [P(empById.get(d.employee_id)?.label) || '—', P(d.label), `${d.progress_pct ?? 0} %`]) } });

  // ---------------------------------------------------------------- chapter 6: risks and indicators
  const ro = orgRecs('RiskOpportunity');
  if (ro.length) out.c6.push({ heading: x('risks', lang), table: { columns: ['ID', x('risk', lang), x('category', lang), x('inherent', lang), x('residual', lang), x('controls', lang), x('owner', lang)],
    rows: ro.sort((a, b) => (b.residual_score || 0) - (a.residual_score || 0)).map(r => [r.code, P(r.title), P(r.category), String(r.inherent_score ?? ''), String(r.residual_score ?? ''), r.controls || '—', P(r.owner) || '—']) } });
  const kv = all(`SELECT kpi_id, period, value, target, status FROM kpi_values WHERE project_id=? ORDER BY period`, projectId); const kdef = new Map(all(`SELECT id, data FROM catalog WHERE kind='kpi'`).map(r => [r.id, J(r.data, {})]));
  const byK = {}; for (const v of kv) (byK[v.kpi_id] ||= []).push(v);
  if (kv.length) out.c6.push({ heading: x('kpis', lang), table: { columns: ['ID', x('indicator', lang), x('target', lang), x('last', lang), x('status', lang)],
    rows: Object.entries(byK).map(([k, v]) => [k, P(kdef.get(k)?.name) || k, P(kdef.get(k)?.target) || String(v.at(-1).target ?? ''), v.slice(-3).map(p => `${p.period}: ${p.value}`).join(' · '), st(v.at(-1).status)]) } });

  // ---------------------------------------------------------------- annex: every respondent's answers
  const qById = new Map(qs.map(q => [q.id, q]));
  const fmtA = v => (v == null ? '' : typeof v === 'object' ? (Array.isArray(v) ? v.join(', ') : Object.values(v).filter(z => z !== '' && z != null).join(' — ')) : String(v));
  resp.sort((a, b) => ['DG', 'Management', 'Member'].indexOf(a.population) - ['DG', 'Management', 'Member'].indexOf(b.population) || String(a.respondent).localeCompare(String(b.respondent)));
  for (const [i, r] of resp.entries()) {
    const q = qById.get(r.questionnaire_id); const form = (q?.forms || []).find(f => f.code === r.template_code) || q?.forms?.[0]; const A = r.answers_i18n?.[lang] || r.answers_json || {}; if (!form) continue;
    const rows = [[x('population', lang), t('pop.' + r.population, lang)], [x('fn', lang), fnLabel(r.function_name) || '—'], [x('level', lang), r.decision_level || '—'], [x('channel', lang), st(r.channel_used)], [x('submitted', lang), String(r.submitted_at || '').slice(0, 10)], [x('completeness', lang), `${r.completeness_pct ?? '—'} %`]];
    // One row per section: the answers of the section joined in reading order.
    for (const s of form.sections) {
      const a = A[s.id]; if (a == null || a === '' || s.type === 'note') continue; const title = P(s.title) || s.id; const parts = [];
      if (s.fields) for (const f of s.fields) { if (a[f.key] != null && a[f.key] !== '') parts.push(`${P(f.label)}: ${fmtA(a[f.key])}`); }
      else if (s.items) for (const it of s.items) { const v = a[it.key]; if (v != null && v !== '') parts.push(`${P(it.label)}: ${typeof v === 'object' ? [v.value === 'Yes' ? x('yes', lang) : v.value === 'No' ? x('no', lang) : v.value, v.comment].filter(Boolean).join(' — ') : (s.type === 'rating' ? `${v}/${s.scale?.max || 5}` : String(v))}`); }
      else if (s.boxes) for (const b of s.boxes) { if (a[b.key]) parts.push(`${P(b.label) || b.key}: ${fmtA(a[b.key])}`); }
      else if (s.rows && s.columns) for (const row of s.rows) { const v = a[row.key]; if (v && Object.values(v).some(z => z !== '' && z != null)) parts.push(`${P(row.label)}: ${s.columns.map(c => (v[c.key] != null && v[c.key] !== '' ? v[c.key] : null)).filter(Boolean).join(' / ')}`); }
      else if (Array.isArray(a) && s.columns) a.filter(z => z && Object.values(z).some(v => v !== '' && v != null && v !== false)).forEach(z => parts.push(s.columns.map(c => (z[c.key] != null && z[c.key] !== '' && z[c.key] !== false ? (z[c.key] === true ? P(c.label) : z[c.key]) : null)).filter(Boolean).join(' · ')));
      else if (typeof a !== 'object') parts.push(String(a));
      if (parts.length) rows.push([title, parts.join(s.type === 'rating' || (s.rows && s.columns) ? ' ; ' : '\n')]);
    }
    out.annex.push({ heading: `${x('answers', lang)} — ${i + 1}. ${r.respondent} (${t('pop.' + r.population, lang)}, ${fnLabel(r.function_name) || '—'})`, text: i === 0 ? x('answersIntro', lang) : null, table: { columns: [x('question', lang), x('answer', lang)], rows } });
  }
  return out;
}
