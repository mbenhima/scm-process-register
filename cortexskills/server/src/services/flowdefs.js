// Step forms of the skills diagnosis (E2E-02), the training plan (E2E-01), delivery (E2E-05) and evaluation (E2E-07)
// chosen by the meaning of each step (SRS 1.9, step forms chosen by the meaning of the step). Every step works on the
// project's own records: the competency framework, targets per position, the assessed population, the validated
// inventory, the gaps, the objectives, needs, budget, courses, sessions, enrolments and evaluations. A step that
// appears in two tasks with two meanings is keyed "UFT:step" (for example the priority competencies of the plan).
// `source` names a list built from the project's data (flow.js sourceList); `fill` names the ways the step can be
// filled besides typing or pasting: from a template of the library and from an AI proposal.
const L = (en, fr, ar) => ({ en, fr, ar });
const f = (key, label, type, o = {}) => ({ key, label, type, ...o });
const opt = (value, label) => ({ value, label });
const opts = (map) => Object.entries(map).map(([v, l]) => opt(v, l));

export const LEVEL4 = opts({ 1: L('1 — Notions', '1 — Notions', '1 — مبادئ'), 2: L('2 — Practice with support', '2 — Pratique accompagnée', '2 — ممارسة بمرافقة'), 3: L('3 — Autonomous', '3 — Autonome', '3 — مستقل'), 4: L('4 — Expert', '4 — Expert', '4 — خبير') });
export const FAMILIES = opts({ Technical: L('Technical', 'Technique', 'تقني'), Behavioural: L('Behavioural', 'Comportemental', 'سلوكي'), Managerial: L('Managerial', 'Managérial', 'تدبيري'), Digital: L('Digital', 'Numérique', 'رقمي'), AI: L('AI', 'IA', 'الذكاء الاصطناعي'), Regulatory: L('Regulatory', 'Réglementaire', 'تنظيمي') });
export const CRITICALITY = opts({ Critical: L('Critical', 'Critique', 'حرجة'), Important: L('Important', 'Importante', 'مهمة'), Useful: L('Useful', 'Utile', 'مفيدة') });
export const SEND = opts({ Email: L('E-mail', 'E-mail', 'البريد الإلكتروني'), WhatsApp: L('WhatsApp', 'WhatsApp', 'واتساب') });
const SEND3 = [...SEND, opt('Application', L('In the application', 'Dans l’application', 'داخل التطبيق'))];
export const MODALITY = opts({ 'On site': L('On site', 'Présentiel', 'حضوري'), Remote: L('Remote', 'À distance', 'عن بعد'), Blended: L('Blended', 'Mixte', 'مدمج'), 'E-learning': L('E-learning', 'E-learning', 'تعلم إلكتروني') });
const PROVIDER = opts({ Internal: L('Internal', 'Interne', 'داخلي'), External: L('External', 'Externe', 'خارجي') });
const YESNO = opts({ Yes: L('Yes', 'Oui', 'نعم'), No: L('No', 'Non', 'لا') });
const PRIORITY = opts({ 1: L('1 — High', '1 — Haute', '1 — عالية'), 2: L('2 — Medium', '2 — Moyenne', '2 — متوسطة'), 3: L('3 — Low', '3 — Basse', '3 — منخفضة') });
const CONTRIB = opts({ Primary: L('Primary', 'Principale', 'رئيسية'), Secondary: L('Secondary', 'Secondaire', 'ثانوية') });
const EVIDENCE = opts({ Self: L('Self-assessment', 'Auto-évaluation', 'التقييم الذاتي'), Manager: L('Manager assessment', 'Évaluation manager', 'تقييم المدير'), Observation: L('Observation at work', 'Observation en situation', 'ملاحظة في العمل'), Certificate: L('Certificate', 'Certificat', 'شهادة') });
const RAG = opts({ Green: L('Green', 'Vert', 'أخضر'), Amber: L('Amber', 'Ambre', 'كهرماني'), Red: L('Red', 'Rouge', 'أحمر') });
const REVIEW = opts({ Approved: L('Approved', 'Approuvé', 'موافق عليه'), 'To correct': L('To correct', 'À corriger', 'للتصحيح'), Rejected: L('Rejected', 'Rejeté', 'مرفوض') });
const ATTEND = opts({ Present: L('Present', 'Présent', 'حاضر'), Absent: L('Absent', 'Absent', 'غائب'), Excused: L('Excused', 'Excusé', 'معذور') });
const SCORE5 = [1, 2, 3, 4, 5].map(v => opt(String(v), L(String(v), String(v), String(v))));
const IMPACT = opts({ Practices: L('Change in practices', 'Changement des pratiques', 'تغيير الممارسات'), Workload: L('Workload', 'Charge de travail', 'عبء العمل'), Skills: L('New skills', 'Compétences nouvelles', 'كفاءات جديدة'), Tools: L('New tools', 'Nouveaux outils', 'أدوات جديدة'), Resistance: L('Likely resistance', 'Résistance probable', 'مقاومة محتملة') });
const SCHEME = opts({ CSF: L('Special training contracts (CSF)', 'Contrats spéciaux de formation (CSF)', 'عقود التكوين الخاصة'), GIAC: L('GIAC', 'GIAC', 'GIAC'), None: L('Not eligible', 'Non éligible', 'غير مؤهل') });
const BUDGET_SOURCE = opts({ Training: L('Training budget', 'Budget formation', 'ميزانية التكوين'), Refund: L('Refund scheme', 'Dispositif de remboursement', 'آلية الاسترداد'), Other: L('Other', 'Autre', 'أخرى') });
const INSTRUMENT = opts({ L1: L('Satisfaction questionnaire (level 1)', 'Questionnaire de satisfaction (niveau 1)', 'استبيان الرضا (المستوى 1)'), L2: L('Knowledge test (level 2)', 'Test de connaissances (niveau 2)', 'اختبار المعارف (المستوى 2)'), L3: L('Observation at work (level 3)', 'Observation en situation de travail (niveau 3)', 'الملاحظة في العمل (المستوى 3)') });
const TIMING = opts({ End: L('End of session', 'Fin de session', 'نهاية الدورة'), D30: L('Day 30', 'J+30', 'اليوم 30'), D90: L('Day 90', 'J+90', 'اليوم 90') });
const RESPONDENTS = opts({ Learners: L('Learners', 'Apprenants', 'المتعلمون'), Managers: L('Managers', 'Managers', 'المديرون') });
const ANSWER = ['A', 'B', 'C', 'D'].map(v => opt(v, L(v, v, v)));
const CHART = opts({ Tile: L('Tile', 'Tuile', 'بطاقة'), Bar: L('Bar chart', 'Barres', 'أعمدة'), Gauge: L('Gauge', 'Jauge', 'مقياس'), Line: L('Line', 'Courbe', 'منحنى') });
const AUDIENCE = opts({ Sponsors: L('Sponsors and decision makers', 'Sponsors et décideurs', 'الرعاة وأصحاب القرار'), Managers: L('Managers of the learners', 'Managers des apprenants', 'مديرو المتعلمين'), Learners: L('Learners', 'Apprenants', 'المتعلمون'), Relays: L('Change relays', 'Relais du changement', 'ممثلو التغيير') });
const CAPSULE_STATUS = opts({ Draft: L('Draft', 'Brouillon', 'مسودة'), 'To validate': L('To validate', 'À valider', 'للمصادقة') });

const owner = f('owner', L('Owner', 'Responsable', 'المسؤول'), 'person');
const due = (key = 'deadline', label = L('Deadline', 'Échéance', 'الأجل'), o = {}) => f(key, label, 'date', o);
const money = (key, label, o = {}) => f(key, label, 'number', { min: 0, ...o });
const rationale = f('rationale', L('Rationale', 'Justification', 'التعليل'), 'textarea', { required: true });
const date = f('date', L('Decision date', 'Date de décision', 'تاريخ القرار'), 'date', { required: true, default: '{today}' });
const decidedBy = f('decidedBy', L('Decided by', 'Décidé par', 'قرر من طرف'), 'person', { required: true, default: '{me}' });
const decision = f('decision', L('Decision', 'Décision', 'القرار'), 'select', { required: true, default: 'Approved', options: opts({ Approved: L('Approved', 'Approuvé', 'موافق عليه'), 'Approved with conditions': L('Approved with conditions', 'Approuvé sous conditions', 'موافق عليه بشروط'), Rejected: L('Rejected', 'Rejeté', 'مرفوض'), Deferred: L('Deferred', 'Reporté', 'مؤجل') }) });
const review = (scopeLabel) => [f('scope', scopeLabel, 'text', { required: true, default: '{object}' }), f('findings', L('Findings', 'Constats', 'الملاحظات'), 'textarea', { required: true }),
  f('conclusion', L('Conclusion', 'Conclusion', 'الخلاصة'), 'select', { required: true, options: opts({ Conforming: L('Conforming', 'Conforme', 'مطابق'), 'Minor corrections': L('Minor corrections', 'Corrections mineures', 'تصحيحات طفيفة'), 'Major corrections': L('Major corrections', 'Corrections majeures', 'تصحيحات جوهرية') }) }),
  f('followUp', L('Follow-up actions', 'Actions de suivi', 'إجراءات المتابعة'), 'textarea'), f('date', L('Review date', 'Date de revue', 'تاريخ المراجعة'), 'date', { required: true, default: '{today}' })];
const person = (key, label, o = {}) => f(key, label, 'select', { custom: true, source: 'people', ...o });
const BOTH = ['template', 'ai']; const TPL = ['template'];

/** Typed forms by "UFT:step" or by step id: kind (record, decision, review, module), fields, the ways to fill them, panel. */
export const FLOW_DEFS = {
  /* ------------------------------------------------------------------ E2E-02 skills diagnosis */
  'MP-02.1': { kind: 'record', fill: BOTH, fields: [
    f('code', L('Code', 'Code', 'الرمز'), 'text', { help: L('Short code used in the next steps, e.g. C-01.', 'Code court utilisé dans les étapes suivantes, par exemple C-01.', 'رمز قصير يستعمل في الخطوات التالية، مثل C-01.'), width: 80 }),
    f('item', L('Competency', 'Compétence', 'الكفاءة'), 'text', { required: true }),
    f('family', L('Family', 'Famille', 'العائلة'), 'select', { required: true, custom: true, options: FAMILIES, carry: true }),
    f('description', L('What mastery looks like', 'Ce que recouvre la maîtrise', 'ما يعنيه الإتقان'), 'textarea'),
    f('levels', L('Level scale', 'Échelle des niveaux', 'سلم المستويات'), 'text', { default: '1-4', help: L('1 Notions · 2 Practice with support · 3 Autonomous · 4 Expert.', '1 Notions · 2 Pratique accompagnée · 3 Autonome · 4 Expert.', '1 مبادئ · 2 ممارسة بمرافقة · 3 مستقل · 4 خبير.'), width: 90 }),
    owner, f('source', L('Source', 'Source', 'المصدر'), 'select', { custom: true, carry: true, options: opts({ Needs: L('Needs questionnaire', 'Questionnaire des besoins', 'استبيان الحاجيات'), Library: L('Sector library', 'Bibliothèque sectorielle', 'مكتبة القطاع'), Job: L('Job description', 'Fiche de poste', 'بطاقة المنصب'), Interview: L('Interview', 'Entretien', 'مقابلة') }) })] },
  'MP-02.2': { kind: 'record', fill: BOTH, fields: [
    f('position', L('Position', 'Poste', 'المنصب'), 'select', { required: true, custom: true, source: 'positions', carry: true }),
    f('competency', L('Competency', 'Compétence', 'الكفاءة'), 'select', { required: true, custom: true, source: 'competencies' }),
    f('target', L('Target level', 'Niveau cible', 'المستوى المستهدف'), 'select', { required: true, options: LEVEL4 }),
    f('criticality', L('Criticality', 'Criticité', 'الأهمية'), 'select', { options: CRITICALITY }),
    f('headcount', L('Headcount', 'Effectif', 'العدد'), 'number', { min: 0 }), due(), owner] },
  'MP-02.3': { kind: 'record', fill: BOTH, panel: 'assessCampaign', fields: [
    f('item', L('Person assessed', 'Personne évaluée', 'الشخص المقيَّم'), 'select', { required: true, custom: true, source: 'people' }),
    f('email', L('E-mail', 'E-mail', 'البريد الإلكتروني'), 'email'), f('phone', L('Phone (WhatsApp)', 'Téléphone (WhatsApp)', 'الهاتف (واتساب)'), 'phone'),
    f('position', L('Position', 'Poste', 'المنصب'), 'select', { required: true, custom: true, source: 'targetPositions' }),
    person('manager', L('Manager (assessor)', 'Manager (évaluateur)', 'المدير (المقيِّم)'), { required: true }),
    f('managerEmail', L('Manager e-mail', 'E-mail du manager', 'بريد المدير'), 'email'), f('managerPhone', L('Manager phone', 'Téléphone du manager', 'هاتف المدير'), 'phone'),
    f('channel', L('Channel', 'Canal', 'القناة'), 'select', { required: true, options: SEND, carry: true }),
    f('site', L('Site', 'Site', 'الموقع'), 'select', { custom: true, source: 'sites', carry: true })] },
  'MP-02.4': { kind: 'module', module: 'flow', panel: 'assessResponses' },
  'MP-02.5': { kind: 'module', module: 'flow', panel: 'assessConsolidate' },
  'MP-02.6': { kind: 'record', fill: BOTH, fields: [
    f('employee', L('Employee', 'Salarié', 'الموظف'), 'select', { required: true, custom: true, source: 'assessed' }),
    f('competency', L('Competency', 'Compétence', 'الكفاءة'), 'select', { required: true, custom: true, source: 'competencies' }),
    f('self', L('Self-assessment', 'Auto-évaluation', 'التقييم الذاتي'), 'number', { min: 1, max: 4, total: false, width: 90 }),
    f('manager', L('Manager assessment', 'Évaluation manager', 'تقييم المدير'), 'number', { min: 1, max: 4, total: false, width: 90 }),
    f('proposed', L('Proposed level', 'Niveau proposé', 'المستوى المقترح'), 'select', { required: true, options: LEVEL4 }),
    f('evidence', L('Evidence', 'Preuves', 'الأدلة'), 'textarea'),
    f('source', L('Main source', 'Source principale', 'المصدر الرئيسي'), 'select', { custom: true, options: EVIDENCE })] },
  'MP-02.7': { kind: 'decision', fill: BOTH, fields: [decision, f('subject', L('Skills inventory', 'Inventaire des compétences', 'جرد الكفاءات'), 'text', { required: true, default: '{object}' }), rationale,
    f('conditions', L('Conditions', 'Conditions', 'الشروط'), 'textarea'), date, decidedBy] },
  'MP-03.1': { kind: 'module', module: 'flow', panel: 'gaps' },
  'MP-03.2': { kind: 'review', fill: BOTH, fields: review(L('Gap matrix by site and function', 'Matrice des écarts par site et par fonction', 'مصفوفة الفجوات حسب الموقع والوظيفة')) },
  'MP-28.3': { kind: 'record', fill: BOTH, fields: [
    f('competency', L('Competency', 'Compétence', 'الكفاءة'), 'select', { required: true, custom: true, source: 'competencies' }),
    f('current', L('Average gap today', 'Écart moyen actuel', 'متوسط الفجوة الحالي'), 'number', { min: 0, max: 4, total: false }),
    f('forecast6', L('Gap in 6 months', 'Écart à 6 mois', 'الفجوة بعد 6 أشهر'), 'number', { min: 0, max: 4, total: false }),
    f('forecast12', L('Gap in 12 months', 'Écart à 12 mois', 'الفجوة بعد 12 شهراً'), 'number', { min: 0, max: 4, total: false }),
    f('assumption', L('Assumption', 'Hypothèse', 'الفرضية'), 'textarea'), f('status', L('Status', 'Statut', 'الحالة'), 'select', { options: RAG })] },
  'MP-28.1': { kind: 'module', module: 'flow', panel: 'gapDataset' },

  /* ------------------------------------------------------------------ E2E-01 training plan */
  'MP-01.1': { kind: 'record', fill: BOTH, fields: [
    f('code', L('Code', 'Code', 'الرمز'), 'text', { width: 80, help: L('e.g. OS-1', 'par exemple OS-1', 'مثل OS-1') }),
    f('item', L('Strategic objective', 'Objectif stratégique', 'الهدف الاستراتيجي'), 'text', { required: true }),
    f('indicator', L('Indicator', 'Indicateur', 'المؤشر'), 'text'), f('baseline', L('Baseline', 'Valeur de départ', 'القيمة الأساسية'), 'text', { width: 100 }),
    f('target', L('Target', 'Cible', 'الهدف'), 'text', { required: true, width: 100 }), due('deadline', L('Deadline', 'Échéance', 'الأجل'), { required: true }), owner] },
  'MP-01.2': { kind: 'record', fill: BOTH, fields: [
    f('objective', L('Objective', 'Objectif', 'الهدف'), 'select', { required: true, custom: true, source: 'objectives', carry: true }),
    f('function', L('Function', 'Fonction', 'الوظيفة'), 'function', { required: true }), f('site', L('Site', 'Site', 'الموقع'), 'select', { custom: true, source: 'sites' }),
    f('contribution', L('Contribution', 'Contribution', 'المساهمة'), 'select', { options: CONTRIB }), f('description', L('How the function contributes', 'Comment la fonction y contribue', 'كيف تساهم الوظيفة'), 'textarea'), owner] },
  'UFT-01-03:MP-02.1': { kind: 'record', fill: BOTH, name: L('Rank the priority competencies', 'Classer les compétences prioritaires', 'ترتيب الكفاءات ذات الأولوية'), fields: [
    f('competency', L('Competency', 'Compétence', 'الكفاءة'), 'select', { required: true, custom: true, source: 'competencies' }),
    f('avgGap', L('Average gap', 'Écart moyen', 'متوسط الفجوة'), 'number', { min: 0, max: 4, total: false }), f('people', L('People with a gap', 'Personnes en écart', 'أشخاص في فجوة'), 'number', { min: 0 }),
    f('priority', L('Priority', 'Priorité', 'الأولوية'), 'select', { required: true, options: PRIORITY }), f('objective', L('Objective served', 'Objectif servi', 'الهدف المخدوم'), 'select', { custom: true, source: 'objectives' }),
    f('rationale', L('Rationale', 'Justification', 'التعليل'), 'textarea')] },
  'UFT-01-03:MP-02.2': { kind: 'record', fill: BOTH, name: L('Set the targets of the plan', 'Fixer les cibles du plan', 'تحديد أهداف الخطة'), fields: [
    f('competency', L('Competency', 'Compétence', 'الكفاءة'), 'select', { required: true, custom: true, source: 'competencies' }),
    f('position', L('Position', 'Poste', 'المنصب'), 'select', { required: true, custom: true, source: 'targetPositions' }),
    f('current', L('Average level today', 'Niveau moyen actuel', 'المستوى المتوسط الحالي'), 'number', { min: 0, max: 4, total: false }),
    f('planTarget', L('Level at the end of the plan', 'Niveau en fin de plan', 'المستوى في نهاية الخطة'), 'select', { required: true, options: LEVEL4 }), due(), owner] },
  'UFT-01-04:MP-03.1': { kind: 'module', module: 'flow', panel: 'needs', name: L('Build the training needs from the priorities', 'Construire les besoins de formation à partir des priorités', 'بناء حاجيات التكوين انطلاقاً من الأولويات') },
  'UFT-01-04:MP-03.2': { kind: 'review', fill: BOTH, name: L('Review the pre-framed needs', 'Revoir les besoins pré-cadrés', 'مراجعة الحاجيات المؤطرة'), fields: review(L('Pre-framed training needs', 'Besoins de formation pré-cadrés', 'حاجيات التكوين المؤطرة')) },
  'MP-01.3': { kind: 'decision', fill: BOTH, fields: [
    money('amount', L('Envelope amount', 'Montant de l’enveloppe', 'مبلغ الغلاف'), { required: true }), f('currency', L('Currency', 'Devise', 'العملة'), 'select', { source: 'currencies', default: '{currency}' }),
    f('year', L('Plan year', 'Exercice', 'السنة المالية'), 'number', { required: true, min: 2020, max: 2100, default: '{planYear}' }),
    f('source', L('Funding', 'Financement', 'التمويل'), 'select', { options: BUDGET_SOURCE, default: 'Training' }),
    f('contingency', L('Contingency (%)', 'Provision pour aléas (%)', 'احتياطي الطوارئ (%)'), 'number', { min: 0, max: 30, default: '10' }), rationale, date, decidedBy] },
  'MP-18.1': { kind: 'record', fill: BOTH, fields: [
    f('theme', L('Training theme', 'Thème de formation', 'محور التكوين'), 'select', { required: true, custom: true, source: 'needThemes' }),
    f('competency', L('Competency', 'Compétence', 'الكفاءة'), 'select', { custom: true, source: 'competencies' }),
    f('site', L('Site', 'Site', 'الموقع'), 'select', { custom: true, source: 'sites', carry: true }),
    f('people', L('Learners', 'Apprenants', 'المتعلمون'), 'number', { min: 0 }), f('groups', L('Groups', 'Groupes', 'المجموعات'), 'number', { min: 0 }),
    f('days', L('Days per group', 'Jours par groupe', 'أيام لكل مجموعة'), 'number', { min: 0, max: 60 }), money('costDay', L('Cost per day', 'Coût par jour', 'الكلفة لليوم'), { total: false }),
    money('budget', L('Budget', 'Budget', 'الميزانية'), { required: true }), f('modality', L('Modality', 'Modalité', 'الصيغة'), 'select', { options: MODALITY }),
    f('provider', L('Provider', 'Prestataire', 'المزود'), 'select', { options: PROVIDER }), owner] },
  'MP-18.2': { kind: 'record', fill: BOTH, fields: [
    f('theme', L('Training theme', 'Thème de formation', 'محور التكوين'), 'select', { required: true, custom: true, source: 'themes' }),
    money('budget', L('Budget', 'Budget', 'الميزانية')), f('scheme', L('Refund scheme', 'Dispositif', 'الآلية'), 'select', { required: true, options: SCHEME }),
    f('rate', L('Refund rate (%)', 'Taux de remboursement (%)', 'نسبة الاسترداد (%)'), 'number', { min: 0, max: 100, total: false }), money('refund', L('Expected refund', 'Remboursement prévu', 'الاسترداد المتوقع')),
    due('filing', L('Filing date', 'Date de dépôt', 'تاريخ الإيداع'))] },
  'MP-19.1': { kind: 'record', fill: BOTH, fields: [
    f('population', L('Population', 'Population', 'الفئة'), 'select', { required: true, custom: true, source: 'targetPositions', carry: true }),
    f('criterion', L('Criterion', 'Critère', 'المعيار'), 'select', { required: true, custom: true, options: IMPACT }),
    f('weight', L('Weight (%)', 'Poids (%)', 'الوزن (%)'), 'number', { min: 0, max: 100 }), f('score', L('Score (1–5)', 'Note (1–5)', 'النقطة (1–5)'), 'select', { required: true, options: SCORE5 }),
    f('facts', L('Facts behind the score', 'Faits justifiant la note', 'الوقائع المبررة'), 'textarea')] },
  'MP-19.2': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Adoption action', 'Action d’adoption', 'إجراء التبني'), 'text', { required: true }), person('owner', L('Owner', 'Responsable', 'المسؤول'), { required: true }),
    f('audience', L('For whom', 'Pour qui', 'لمن'), 'select', { custom: true, source: 'targetPositions' }), f('start', L('Start', 'Début', 'البداية'), 'date'), f('end', L('End', 'Fin', 'النهاية'), 'date', { validate: 'afterStart' }),
    money('budget', L('Budget', 'Budget', 'الميزانية')), f('deliverable', L('Deliverable', 'Livrable', 'المخرج'), 'text')] },
  'MP-01.4': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Steering milestone', 'Jalon du comité de pilotage', 'محطة لجنة القيادة'), 'text', { required: true }), person('owner', L('Owner', 'Responsable', 'المسؤول')),
    f('start', L('Date', 'Date', 'التاريخ'), 'date', { required: true }), f('agenda', L('Agenda', 'Ordre du jour', 'جدول الأعمال'), 'textarea'), f('deliverable', L('Deliverable', 'Livrable', 'المخرج'), 'text')] },
  'MP-01.5': { kind: 'module', module: 'document', doc: 'DT-E2E-01', report: 'RPT-001' },
  'MP-04.1': { kind: 'module', module: 'flow', panel: 'upstream' },
  'MP-01.6': { kind: 'decision', fill: BOTH, fields: [decision, f('subject', L('Annual training plan', 'Plan annuel de formation', 'المخطط السنوي للتكوين'), 'text', { required: true, default: '{object}' }), rationale,
    f('conditions', L('Conditions', 'Conditions', 'الشروط'), 'textarea'), date, decidedBy] },
  'MP-01.7': { kind: 'module', module: 'flow', panel: 'planDiffuse' },

  /* ------------------------------------------------------------------ E2E-05 delivery */
  'MP-06.3': { kind: 'record', fill: BOTH, panel: 'reviewRequests', name: L('Submit the content to the expert review', 'Soumettre le contenu à la revue de l’expert', 'إحالة المحتوى على مراجعة الخبير'), fields: [
    f('course', L('Course', 'Formation', 'التكوين'), 'select', { required: true, custom: true, source: 'courses' }), f('format', L('Format', 'Format', 'الصيغة'), 'select', { options: MODALITY }),
    f('hours', L('Duration (hours)', 'Durée (heures)', 'المدة (ساعات)'), 'number', { min: 0 }), person('expert', L('Reviewing expert', 'Expert relecteur', 'الخبير المراجع'), { required: true }),
    f('expertEmail', L('Expert e-mail', 'E-mail de l’expert', 'بريد الخبير'), 'email', { required: true }), due('due', L('Answer by', 'Réponse attendue le', 'الرد قبل'))] },
  'MP-06.4': { kind: 'record', fill: BOTH, fields: [
    f('course', L('Course', 'Formation', 'التكوين'), 'select', { required: true, custom: true, source: 'courses' }), f('decision', L('Review decision', 'Décision de revue', 'قرار المراجعة'), 'select', { required: true, options: REVIEW }),
    f('comments', L('Comments', 'Commentaires', 'التعليقات'), 'textarea'), person('expert', L('Expert', 'Expert', 'الخبير')), f('date', L('Date', 'Date', 'التاريخ'), 'date', { default: '{today}' })] },
  'MP-06.6': { kind: 'record', fill: BOTH, panel: 'announcements', fields: [
    f('course', L('Course', 'Formation', 'التكوين'), 'select', { required: true, custom: true, source: 'approvedCourses' }),
    f('audience', L('Audience (positions)', 'Public (postes)', 'الجمهور (المناصب)'), 'multi', { custom: true, source: 'targetPositions' }),
    f('channel', L('Channel', 'Canal', 'القناة'), 'select', { required: true, options: SEND3, carry: true }), f('message', L('Message', 'Message', 'الرسالة'), 'textarea', { required: true }),
    f('date', L('Date', 'Date', 'التاريخ'), 'date', { default: '{today}' })] },
  'MP-11.1': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Room or equipment', 'Salle ou équipement', 'القاعة أو التجهيز'), 'text', { required: true }), f('site', L('Site', 'Site', 'الموقع'), 'select', { custom: true, source: 'sites', carry: true }),
    f('capacity', L('Capacity', 'Capacité', 'السعة'), 'number', { min: 0, total: false }), f('start', L('Available from', 'Disponible du', 'متاحة من'), 'date'), f('end', L('Available until', 'Disponible au', 'متاحة إلى'), 'date', { validate: 'afterStart' }),
    money('cost', L('Cost', 'Coût', 'الكلفة')), f('equipment', L('Equipment', 'Équipements', 'التجهيزات'), 'text')] },
  'MP-11.2': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Trainer', 'Formateur', 'المكون'), 'text', { required: true }), f('organisation', L('Organisation', 'Organisme', 'الهيئة'), 'select', { custom: true, source: 'vendors' }),
    f('email', L('E-mail', 'E-mail', 'البريد الإلكتروني'), 'email'), f('phone', L('Phone', 'Téléphone', 'الهاتف'), 'phone'),
    f('start', L('Available from', 'Disponible du', 'متاح من'), 'date'), f('end', L('Available until', 'Disponible au', 'متاح إلى'), 'date', { validate: 'afterStart' }),
    f('courses', L('Courses', 'Formations', 'التكوينات'), 'multi', { custom: true, source: 'courses' }), money('dayRate', L('Day rate', 'Tarif journalier', 'التعريفة اليومية'), { total: false })] },
  'MP-07.1': { kind: 'record', fill: BOTH, fields: [
    f('code', L('Session', 'Session', 'الدورة'), 'text', { required: true, width: 90 }), f('course', L('Course', 'Formation', 'التكوين'), 'select', { required: true, custom: true, source: 'courses' }),
    f('date', L('Date', 'Date', 'التاريخ'), 'date', { required: true }), f('time', L('Start time', 'Heure de début', 'ساعة البداية'), 'text', { default: '09:00', width: 80 }),
    f('hours', L('Hours', 'Heures', 'الساعات'), 'number', { min: 0, max: 40 }), f('room', L('Room', 'Salle', 'القاعة'), 'select', { custom: true, source: 'rooms' }),
    f('trainer', L('Trainer', 'Formateur', 'المكون'), 'select', { custom: true, source: 'trainers' }), f('capacity', L('Capacity', 'Capacité', 'السعة'), 'number', { min: 0 }),
    f('modality', L('Modality', 'Modalité', 'الصيغة'), 'select', { options: MODALITY })] },
  'MP-07.2': { kind: 'module', module: 'flow', panel: 'conflicts' },
  'MP-07.3': { kind: 'record', fill: BOTH, fields: [
    f('session', L('Session', 'Session', 'الدورة'), 'select', { required: true, custom: true, source: 'sessions', carry: true }),
    f('item', L('Learner', 'Apprenant', 'المتعلم'), 'select', { required: true, custom: true, source: 'people' }),
    f('email', L('E-mail', 'E-mail', 'البريد الإلكتروني'), 'email'), f('phone', L('Phone (WhatsApp)', 'Téléphone (WhatsApp)', 'الهاتف (واتساب)'), 'phone'),
    f('channel', L('Invitation channel', 'Canal de convocation', 'قناة الاستدعاء'), 'select', { required: true, options: SEND, carry: true }),
    f('manager', L('Manager', 'Manager', 'المدير'), 'select', { custom: true, source: 'people' })] },
  'MP-07.4': { kind: 'module', module: 'flow', panel: 'convocations' },
  'MP-17.1': { kind: 'module', module: 'flow', panel: 'provision' },
  'MP-25.1': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Capsule', 'Capsule', 'الكبسولة'), 'text', { required: true }), f('course', L('Course', 'Formation', 'التكوين'), 'select', { custom: true, source: 'courses' }),
    f('text', L('Capsule text', 'Texte de la capsule', 'نص الكبسولة'), 'textarea', { required: true, help: L('What the learner reads on the phone: short, three key points and a question.', 'Ce que l’apprenant lit sur son téléphone : court, trois points clés et une question.', 'ما يقرؤه المتعلم على هاتفه: نص قصير بثلاث نقاط وسؤال.') }),
    f('minutes', L('Reading time (min)', 'Durée de lecture (min)', 'مدة القراءة (د)'), 'number', { min: 1, max: 30, total: false }), f('channel', L('Channel', 'Canal', 'القناة'), 'select', { required: true, options: SEND, carry: true }),
    f('sendDate', L('Send on', 'Envoi le', 'الإرسال يوم'), 'date')] },
  'MP-25.2': { kind: 'record', fill: BOTH, fields: [
    f('source', L('Source document', 'Document source', 'الوثيقة المصدر'), 'text', { required: true }), f('course', L('Course', 'Formation', 'التكوين'), 'select', { custom: true, source: 'courses' }),
    f('item', L('Draft capsule', 'Projet de capsule', 'مشروع الكبسولة'), 'text', { required: true }), f('text', L('Draft text', 'Texte proposé', 'النص المقترح'), 'textarea', { required: true }),
    f('status', L('Status', 'Statut', 'الحالة'), 'select', { options: CAPSULE_STATUS, default: 'To validate' })] },
  'MP-25.3': { kind: 'module', module: 'flow', panel: 'capsulePush' },
  'MP-25.4': { kind: 'record', fill: TPL, fields: [
    f('item', L('Learner', 'Apprenant', 'المتعلم'), 'select', { required: true, custom: true, source: 'learners' }), f('capsule', L('Capsule', 'Capsule', 'الكبسولة'), 'select', { required: true, custom: true, source: 'capsules' }),
    f('read', L('Read', 'Lue', 'مقروءة'), 'select', { required: true, options: YESNO }), f('date', L('Date', 'Date', 'التاريخ'), 'date'), f('comment', L('Comment', 'Commentaire', 'تعليق'), 'text')] },
  'MP-25.5': { kind: 'module', module: 'flow', panel: 'capsuleCompletion' },
  'MP-30.1': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Scenario', 'Scénario', 'السيناريو'), 'text', { required: true }), f('course', L('Course', 'Formation', 'التكوين'), 'select', { required: true, custom: true, source: 'courses' }),
    f('situation', L('Situation', 'Situation', 'الوضعية'), 'textarea', { required: true }), f('expected', L('Expected behaviour', 'Comportement attendu', 'السلوك المنتظر'), 'textarea'), owner] },
  'MP-30.2': { kind: 'record', fill: BOTH, fields: [
    f('scenario', L('Scenario', 'Scénario', 'السيناريو'), 'select', { required: true, custom: true, source: 'scenarios', carry: true }), f('item', L('Scoring criterion', 'Critère de notation', 'معيار التنقيط'), 'text', { required: true }),
    f('weight', L('Weight (%)', 'Poids (%)', 'الوزن (%)'), 'number', { min: 0, max: 100 }), f('pass', L('Pass mark (%)', 'Seuil de réussite (%)', 'عتبة النجاح (%)'), 'number', { min: 0, max: 100, total: false })] },
  'MP-30.3': { kind: 'record', fill: BOTH, panel: 'simLaunch', fields: [
    f('session', L('Session', 'Session', 'الدورة'), 'select', { required: true, custom: true, source: 'sessions' }), f('scenario', L('Scenario', 'Scénario', 'السيناريو'), 'select', { required: true, custom: true, source: 'scenarios' }),
    f('date', L('Date', 'Date', 'التاريخ'), 'date', { required: true }), f('channel', L('Channel', 'Canal', 'القناة'), 'select', { required: true, options: SEND }),
    f('message', L('Message to the learners', 'Message aux apprenants', 'رسالة إلى المتعلمين'), 'textarea', { required: true })] },
  'MP-30.4': { kind: 'record', fill: TPL, name: L('Capture the performance in the simulation', 'Saisir la performance en simulation', 'تسجيل الأداء في المحاكاة'), fields: [
    f('item', L('Learner', 'Apprenant', 'المتعلم'), 'select', { required: true, custom: true, source: 'learners' }), f('scenario', L('Scenario', 'Scénario', 'السيناريو'), 'select', { required: true, custom: true, source: 'scenarios' }),
    f('score', L('Score (%)', 'Score (%)', 'النتيجة (%)'), 'number', { required: true, min: 0, max: 100, total: false }), f('observation', L('Observation', 'Observation', 'الملاحظة'), 'textarea')] },
  'MP-30.5': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Learner', 'Apprenant', 'المتعلم'), 'select', { required: true, custom: true, source: 'learners' }), f('date', L('Date', 'Date', 'التاريخ'), 'date', { default: '{today}' }),
    f('strengths', L('Strengths', 'Points forts', 'نقاط القوة'), 'textarea', { required: true }), f('improvements', L('To improve', 'À améliorer', 'للتحسين'), 'textarea', { required: true }), f('next', L('Next step', 'Prochaine étape', 'الخطوة التالية'), 'text')] },
  'MP-30.6': { kind: 'module', module: 'flow', panel: 'simEvidence' },
  'MP-07.5': { kind: 'record', fill: TPL, fields: [
    f('session', L('Session', 'Session', 'الدورة'), 'select', { required: true, custom: true, source: 'sessions', carry: true }), f('item', L('Learner', 'Apprenant', 'المتعلم'), 'select', { required: true, custom: true, source: 'learners' }),
    f('status', L('Attendance', 'Présence', 'الحضور'), 'select', { required: true, options: ATTEND }), f('hours', L('Hours attended', 'Heures suivies', 'الساعات المتابعة'), 'number', { min: 0, max: 40 }),
    f('signed', L('Sheet signed', 'Feuille signée', 'الورقة موقعة'), 'select', { options: YESNO })] },
  'MP-07.6': { kind: 'decision', fill: BOTH, fields: [decision, f('subject', L('Sessions closed', 'Sessions clôturées', 'الدورات المغلقة'), 'multi', { required: true, custom: true, source: 'sessions' }), rationale, date, decidedBy] },
  'MP-11.5': { kind: 'review', fill: BOTH, fields: review(L('Attendance and invoices', 'Présences et factures', 'الحضور والفواتير')) },
  'MP-11.6': { kind: 'module', module: 'document', doc: 'DT-E2E-05', report: 'RPT-005', name: L('Archive the records of the period (delivery report)', 'Archiver les dossiers de la période (rapport de réalisation)', 'أرشفة ملفات الفترة (تقرير الإنجاز)') },
  'MP-11.3': { kind: 'record', fill: BOTH, fields: [
    f('vendor', L('Provider', 'Organisme', 'الهيئة'), 'select', { required: true, custom: true, source: 'vendors' }), f('item', L('Invoice number', 'N° de facture', 'رقم الفاتورة'), 'text', { required: true }),
    f('session', L('Session', 'Session', 'الدورة'), 'select', { custom: true, source: 'sessions' }), money('amount', L('Amount', 'Montant', 'المبلغ'), { required: true }),
    f('participants', L('Participants invoiced', 'Participants facturés', 'المشاركون المفوترون'), 'number', { min: 0 }), f('date', L('Invoice date', 'Date de facture', 'تاريخ الفاتورة'), 'date')] },
  'MP-11.4': { kind: 'review', fill: BOTH, fields: review(L('Training record corrected', 'Dossier de formation corrigé', 'ملف التكوين المصحح')) },

  /* ------------------------------------------------------------------ E2E-07 evaluation */
  'MP-09.1': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Instrument', 'Instrument', 'الأداة'), 'select', { required: true, options: INSTRUMENT }), f('courses', L('Courses', 'Formations', 'التكوينات'), 'multi', { custom: true, source: 'courses' }),
    f('timing', L('When', 'Moment', 'التوقيت'), 'select', { options: TIMING }), f('threshold', L('Pass mark (%)', 'Seuil (%)', 'العتبة (%)'), 'number', { min: 0, max: 100, total: false }),
    f('respondents', L('Respondents', 'Répondants', 'المجيبون'), 'select', { required: true, options: RESPONDENTS })] },
  'MP-09.2': { kind: 'record', fill: BOTH, fields: [
    f('course', L('Course', 'Formation', 'التكوين'), 'select', { required: true, custom: true, source: 'courses', carry: true }), f('item', L('Question', 'Question', 'السؤال'), 'text', { required: true }),
    f('choices', L('Choices (A ; B ; C ; D)', 'Choix (A ; B ; C ; D)', 'الخيارات (A ; B ; C ; D)'), 'text', { required: true, help: L('Four answers separated by semicolons.', 'Quatre réponses séparées par des points-virgules.', 'أربعة أجوبة مفصولة بفاصلة منقوطة.') }),
    f('answer', L('Right answer', 'Bonne réponse', 'الجواب الصحيح'), 'select', { required: true, options: ANSWER }), f('points', L('Points', 'Points', 'النقاط'), 'number', { min: 1, max: 10, default: '1' })] },
  'MP-09.3': { kind: 'module', module: 'flow', panel: 'l1' },
  'MP-09.4': { kind: 'module', module: 'flow', panel: 'l2' },
  'MP-09.5': { kind: 'module', module: 'flow', panel: 'l3' },
  'MP-09.6': { kind: 'module', module: 'flow', panel: 'progress' },
  'MP-10.3': { kind: 'module', module: 'flow', panel: 'kpis' },
  'MP-09.7': { kind: 'review', fill: BOTH, fields: review(L('Evaluation results', 'Résultats d’évaluation', 'نتائج التقييم')) },
  'MP-20.5': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Point reviewed', 'Point revu', 'النقطة المراجعة'), 'text', { required: true }), f('finding', L('Finding', 'Constat', 'الملاحظة'), 'textarea', { required: true }),
    f('status', L('Status', 'Statut', 'الحالة'), 'select', { required: true, options: RAG }), f('action', L('Action', 'Action', 'الإجراء'), 'text'), person('owner', L('Owner', 'Responsable', 'المسؤول')), due('due', L('Due', 'Échéance', 'الأجل'))] },
  'MP-10.4': { kind: 'module', module: 'document', doc: 'DT-E2E-07', report: 'RPT-007', name: L('Export the evaluation report', 'Exporter le rapport d’évaluation', 'تصدير تقرير التقييم') },
  'MP-10.6': { kind: 'record', fill: BOTH, panel: 'lessons', fields: [
    f('audience', L('Audience', 'Destinataires', 'المرسل إليهم'), 'select', { required: true, custom: true, options: AUDIENCE }), f('channel', L('Channel', 'Canal', 'القناة'), 'select', { required: true, options: SEND }),
    f('message', L('Message', 'Message', 'الرسالة'), 'textarea', { required: true }), f('date', L('Date', 'Date', 'التاريخ'), 'date', { default: '{today}' })] },
  'MP-10.2': { kind: 'record', fill: BOTH, fields: [
    f('item', L('Indicator', 'Indicateur', 'المؤشر'), 'select', { required: true, custom: true, source: 'flowKpis' }), f('chart', L('Display', 'Affichage', 'العرض'), 'select', { required: true, options: CHART }),
    f('target', L('Target', 'Cible', 'الهدف'), 'number', { total: false }), f('roles', L('Visible to', 'Visible pour', 'مرئي لـ'), 'multi', { custom: true, source: 'roles' })] },
};

/** Labels of the flow panels (kind "module", module "flow"). */
export const PANEL_LABEL = {
  assessResponses: L('Self and manager assessments', 'Auto-évaluations et évaluations managers', 'التقييمات الذاتية وتقييمات المديرين'),
  assessConsolidate: L('Consolidated assessments', 'Évaluations consolidées', 'التقييمات الموحدة'), gaps: L('Gap matrix', 'Matrice des écarts', 'مصفوفة الفجوات'),
  gapDataset: L('Analytical dataset', 'Jeu de données analytique', 'مجموعة البيانات التحليلية'), needs: L('Training needs', 'Besoins de formation', 'حاجيات التكوين'),
  upstream: L('Upstream deliverables', 'Livrables amont', 'المخرجات السابقة'), planDiffuse: L('Plan distribution', 'Diffusion du plan', 'نشر الخطة'),
  conflicts: L('Schedule check', 'Contrôle du planning', 'مراقبة البرمجة'), convocations: L('Invitations to the sessions', 'Convocations aux sessions', 'الاستدعاءات للدورات'),
  provision: L('Learner accounts', 'Comptes des apprenants', 'حسابات المتعلمين'), capsulePush: L('Capsules sent', 'Envoi des capsules', 'إرسال الكبسولات'),
  capsuleCompletion: L('Capsule completion', 'Achèvement des capsules', 'إتمام الكبسولات'), simEvidence: L('Simulation evidence', 'Preuves de simulation', 'أدلة المحاكاة'),
  l1: L('Satisfaction (level 1)', 'Satisfaction (niveau 1)', 'الرضا (المستوى 1)'), l2: L('Knowledge test (level 2)', 'Test de connaissances (niveau 2)', 'اختبار المعارف (المستوى 2)'),
  l3: L('Observation at work (level 3)', 'Observation en situation (niveau 3)', 'الملاحظة في العمل (المستوى 3)'), progress: L('Skills progression', 'Progression des compétences', 'تقدم الكفاءات'),
  kpis: L('Indicators', 'Indicateurs', 'المؤشرات'),
};
/** The definition of a step in a task: the task-specific one first, then the step's own. */
export const flowDef = (uft, stepId) => (uft && FLOW_DEFS[`${uft}:${stepId}`]) || FLOW_DEFS[stepId] || null;
