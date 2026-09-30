// Step input forms. Every step of every macro process is executed through one of
// these form kinds; the kind is inferred from the step's leading verb and type.
// Field types: text, textarea, number, date, select, role, roles, person, obs (organization
// unit with custom value), rows (a table of records with add / edit / delete), kpis (KPI picker
// with "create new KPI"), records (links to project records), template (document template),
// racsi (R, A, C, S, I in five columns) and matrix (decision matrix with weighted score).
const L = (en, fr, ar) => ({ en, fr, ar });

const PRIORITY = ['High', 'Medium', 'Low'];
export const SCORE_SCALE = [
  { score: 1, label: L('Not in place: no evidence', 'Inexistant : aucune preuve', 'غير موجود: لا دليل') },
  { score: 2, label: L('Initial: informal, partial evidence', 'Initial : informel, preuves partielles', 'أولي: غير رسمي، أدلة جزئية') },
  { score: 3, label: L('Defined: documented, applied in most cases', 'Défini : documenté, appliqué dans la plupart des cas', 'محدد: موثق ومطبق في معظم الحالات') },
  { score: 4, label: L('Managed: applied everywhere, measured', 'Maîtrisé : appliqué partout, mesuré', 'مُدار: مطبق في كل مكان ومقاس') },
  { score: 5, label: L('Optimized: measured, improved, benchmarked', 'Optimisé : mesuré, amélioré, comparé', 'محسَّن: مقاس ومحسن ومقارن') },
];

const col = (key, type, label, extra = {}) => ({ key, type, label, ...extra });
// Why the score and conclusion fields exist (shown under them in the form).
const HINT_SCORE = L('Computed from the decision matrix: Σ(weight × score) ÷ Σ(weight). It rates the whole assessment on the 1–5 scale (3 = Defined) and is printed in the documents; it cannot be typed.', 'Calculée à partir de la matrice : Σ(poids × note) ÷ Σ(poids). Elle situe l\'évaluation sur l\'échelle 1–5 (3 = Défini) et figure dans les documents ; elle ne se saisit pas.', 'تُحسب من مصفوفة القرار: Σ(الوزن × الدرجة) ÷ Σ(الوزن). تضع التقييم على سلم 1–5 (3 = محدد) وتظهر في الوثائق؛ ولا تُكتب يدويًا.');
const HINT_CONCLUSION = L('What the assessment shows and the actions it calls for, in two or three sentences. It is the text management reads first and it is printed in the related document.', 'Ce que montre l\'évaluation et les actions qu\'elle appelle, en deux ou trois phrases. C\'est le texte que la direction lit en premier ; il figure dans le document associé.', 'ما يُظهره التقييم والإجراءات التي يستدعيها في جملتين أو ثلاث. هو النص الذي تقرؤه الإدارة أولًا ويظهر في الوثيقة المرتبطة.');

export const FORM_KINDS = {
  standards: {
    label: L('Standards and scope', 'Normes et périmètre', 'المعايير والنطاق'),
    fields: [
      { key: 'standards', type: 'standards', label: L('Standards the management system applies', 'Normes appliquées par le système de management', 'المعايير التي يطبقها نظام الإدارة'), required: true },
      { key: 'scopeType', type: 'select', options: ['Single-standard', 'Integrated'], label: L('Scope type', 'Type de périmètre', 'نوع النطاق'), required: true },
      { key: 'coverage', type: 'obs', multiple: true, label: L('Organization units covered', 'Unités de l\'organisation couvertes', 'وحدات المؤسسة المشمولة'), required: true },
      { key: 'rationale', type: 'textarea', label: L('Why these standards', 'Pourquoi ces normes', 'سبب اختيار هذه المعايير') },
    ],
  },
  periodicity: {
    label: L('Periodicity', 'Périodicité', 'الدورية'),
    fields: [
      { key: 'frequency', type: 'select', list: 'LST-FREQ', label: L('Frequency', 'Fréquence', 'التكرار'), required: true },
      { key: 'nextDate', type: 'date', label: L('Next due date', 'Prochaine échéance', 'موعد الاستحقاق التالي'), required: true },
      { key: 'chair', type: 'role', label: L('Review chaired by', 'Revue présidée par', 'يرأس المراجعة'), required: true },
      { key: 'scope', type: 'obs', multiple: true, label: L('Organization units in scope', 'Unités de l\'organisation concernées', 'وحدات المؤسسة المشمولة'), required: true },
      { key: 'notes', type: 'textarea', label: L('Review inputs and notes', 'Éléments d\'entrée et notes', 'مدخلات المراجعة وملاحظات') },
    ],
  },
  list: {
    label: L('Register items', 'Éléments du registre', 'بنود السجل'),
    fields: [
      { key: 'items', type: 'rows', required: true, label: L('Items identified', 'Éléments identifiés', 'البنود المحددة'), columns: [
        col('item', 'text', L('Item', 'Élément', 'البند'), { required: true }),
        col('category', 'text', L('Category', 'Catégorie', 'الفئة')),
        col('detail', 'textarea', L('Description and impact', 'Description et impact', 'الوصف والأثر')),
        col('priority', 'select', L('Relevance', 'Pertinence', 'الأهمية'), { options: PRIORITY }),
        col('source', 'text', L('Source / evidence', 'Source / preuve', 'المصدر / الدليل')),
      ] },
    ],
  },
  assess: {
    label: L('Assessment', 'Évaluation', 'التقييم'),
    scale: SCORE_SCALE,
    fields: [
      { key: 'matrix', type: 'matrix', required: true, label: L('Decision matrix', 'Matrice de décision', 'مصفوفة القرار'), columns: [
        col('criterion', 'text', L('Criterion', 'Critère', 'المعيار'), { required: true }),
        col('weight', 'number', L('Weight (%)', 'Poids (%)', 'الوزن (%)'), { required: true }),
        col('score', 'score', L('Score (1–5)', 'Note (1–5)', 'الدرجة (1–5)'), { required: true }),
        col('justification', 'textarea', L('Facts that justify the score', 'Faits qui justifient la note', 'الوقائع التي تبرر الدرجة')),
      ] },
      { key: 'score', type: 'number', computed: true, label: L('Weighted score (1–5)', 'Note pondérée (1–5)', 'الدرجة المرجحة (1–5)'), required: true, hint: HINT_SCORE },
      { key: 'rationale', type: 'textarea', label: L('Conclusion', 'Conclusion', 'الخلاصة'), required: true, hint: HINT_CONCLUSION },
    ],
  },
  // Needs and expectations of interested parties (ISO 9001 §4.2, ISO 14001 §4.2, ISO 45001 §4.2):
  // one row per need, mapped to one or more interested parties; rows typed, taken from the
  // library or suggested by the AI. The optional matrix rates how well the needs are handled.
  needs: {
    label: L('Needs and expectations', 'Besoins et attentes', 'الاحتياجات والتوقعات'),
    scale: SCORE_SCALE,
    fields: [
      { key: 'needs', type: 'rows', required: true, needs: true, label: L('Needs and expectations of the interested parties', 'Besoins et attentes des parties intéressées', 'احتياجات الأطراف المعنية وتوقعاتها'), columns: [
        col('need', 'textarea', L('Need or expectation', 'Besoin ou attente', 'الحاجة أو التوقع'), { required: true, wide: true }),
        col('parties', 'parties', L('Interested parties concerned', 'Parties intéressées concernées', 'الأطراف المعنية'), { required: true }),
        col('type', 'combo', L('Type of requirement', 'Type d\'exigence', 'نوع المتطلب'), { options: 'needType' }),
        col('obligation', 'select', L('Adopted as a compliance obligation', 'Retenue comme obligation de conformité', 'معتمد كالتزام امتثال'), { options: ['Yes', 'No'] }),
        col('response', 'textarea', L('How the organization addresses it (process, control)', 'Réponse de l\'organisme (processus, maîtrise)', 'كيف تستجيب المؤسسة (العملية، الضبط)'), { wide: true }),
        col('priority', 'select', L('Relevance', 'Pertinence', 'الأهمية'), { options: PRIORITY }),
        col('origin', 'select', L('Entered from', 'Origine de la saisie', 'مصدر الإدخال'), { options: ['Manual', 'Library', 'AI'] }),
        col('source', 'textarea', L('Source / evidence', 'Source / preuve', 'المصدر / الدليل')),
      ] },
      { key: 'matrix', type: 'matrix', label: L('How well the needs are known and handled (optional decision matrix)', 'Degré de maîtrise des besoins (matrice de décision facultative)', 'مدى معرفة الاحتياجات ومعالجتها (مصفوفة قرار اختيارية)'), columns: [
        col('criterion', 'text', L('Criterion', 'Critère', 'المعيار'), { required: true }),
        col('weight', 'number', L('Weight (%)', 'Poids (%)', 'الوزن (%)'), { required: true }),
        col('score', 'score', L('Score (1–5)', 'Note (1–5)', 'الدرجة (1–5)'), { required: true }),
        col('justification', 'textarea', L('Facts that justify the score', 'Faits qui justifient la note', 'الوقائع التي تبرر الدرجة')),
      ] },
      { key: 'score', type: 'number', computed: true, label: L('Weighted score (1–5)', 'Note pondérée (1–5)', 'الدرجة المرجحة (1–5)'), hint: HINT_SCORE },
      { key: 'rationale', type: 'textarea', label: L('Conclusion', 'Conclusion', 'الخلاصة'), required: true, hint: HINT_CONCLUSION },
    ],
  },
  decision: {
    label: L('Decision', 'Décision', 'القرار'),
    fields: [
      { key: 'criteria', type: 'rows', label: L('Decision criteria checked', 'Critères de décision vérifiés', 'معايير القرار المتحقق منها'), columns: [
        col('criterion', 'text', L('Criterion', 'Critère', 'المعيار'), { required: true }),
        col('met', 'select', L('Met', 'Satisfait', 'مستوفى'), { options: ['Yes', 'Partly', 'No'] }),
        col('evidence', 'text', L('Evidence', 'Preuve', 'الدليل')),
      ] },
      { key: 'decision', type: 'select', options: ['Go', 'No-Go', 'Hold'], label: L('Decision', 'Décision', 'القرار'), required: true },
      { key: 'approver', type: 'role', label: L('Approver (Accountable)', 'Approbateur (Autorité)', 'الموافق (المساءَل)'), required: true },
      { key: 'comment', type: 'textarea', label: L('Decision comment and conditions', 'Commentaire et conditions de la décision', 'تعليق القرار وشروطه') },
    ],
  },
  document: {
    label: L('Document', 'Document', 'الوثيقة'),
    fields: [
      { key: 'template', type: 'template', label: L('Document template', 'Modèle de document', 'نموذج الوثيقة'), required: true },
      { key: 'docRef', type: 'text', label: L('Document reference', 'Référence du document', 'مرجع الوثيقة'), required: true },
      { key: 'version', type: 'text', label: L('Version', 'Version', 'الإصدار'), required: true },
      { key: 'summary', type: 'textarea', label: L('Content summary', 'Résumé du contenu', 'ملخص المحتوى') },
      { key: 'records', type: 'records', label: L('Generated document', 'Document généré', 'الوثيقة المولَّدة') },
    ],
  },
  communicate: {
    label: L('Communication', 'Communication', 'التواصل'),
    fields: [
      { key: 'messages', type: 'rows', required: true, label: L('Communication records', 'Enregistrements de communication', 'سجلات التواصل'), columns: [
        col('audience', 'obs', L('Audience', 'Public', 'الجمهور'), { required: true, allowParties: true }),
        col('channel', 'select', L('Channel', 'Canal', 'القناة'), { options: ['Intranet', 'E-mail', 'Meeting', 'Notice board', 'Portal'], required: true }),
        col('date', 'date', L('Date', 'Date', 'التاريخ')),
        col('message', 'textarea', L('Key message', 'Message clé', 'الرسالة الرئيسية')),
        col('by', 'role', L('Communicated by', 'Communiqué par', 'يتواصل')),
      ] },
    ],
  },
  train: {
    label: L('Training', 'Formation', 'التدريب'),
    fields: [
      { key: 'session', type: 'text', label: L('Session / module', 'Session / module', 'الجلسة / الوحدة'), required: true },
      { key: 'date', type: 'date', label: L('Date', 'Date', 'التاريخ') },
      { key: 'audience', type: 'obs', multiple: true, label: L('Units trained', 'Unités formées', 'الوحدات المتدربة') },
      { key: 'participants', type: 'number', label: L('Participants', 'Participants', 'المشاركون'), required: true },
      { key: 'method', type: 'select', options: ['Quiz', 'On-the-job observation', 'Supervisor assessment', 'Practical test'], label: L('Effectiveness evaluation method', 'Méthode d\'évaluation de l\'efficacité', 'طريقة تقييم الفعالية') },
      { key: 'effectiveness', type: 'number', label: L('Effectiveness (%)', 'Efficacité (%)', 'الفعالية (%)') },
    ],
  },
  monitor: {
    label: L('Measurement', 'Mesure', 'القياس'),
    fields: [
      { key: 'kpis', type: 'kpis', required: true, label: L('Indicators measured', 'Indicateurs mesurés', 'المؤشرات المقاسة'), columns: [
        col('kpi', 'kpi', L('KPI', 'KPI', 'المؤشر'), { required: true }),
        col('why', 'textarea', L('Why this KPI for this step', 'Pourquoi ce KPI pour cette étape', 'سبب اختيار هذا المؤشر لهذه الخطوة'), { required: true }),
        col('value', 'number', L('Measured value', 'Valeur mesurée', 'القيمة المقاسة'), { required: true }),
        col('target', 'text', L('Target', 'Cible', 'المستهدف')),
      ] },
      { key: 'comment', type: 'textarea', label: L('Analysis of gaps and trend', 'Analyse des écarts et de la tendance', 'تحليل الفجوات والاتجاه') },
    ],
  },
  review: {
    label: L('Review', 'Revue', 'المراجعة'),
    fields: [
      { key: 'frequency', type: 'select', list: 'LST-FREQ', label: L('Review frequency', 'Fréquence de revue', 'تكرار المراجعة'), required: true },
      { key: 'date', type: 'date', label: L('Review date', 'Date de revue', 'تاريخ المراجعة'), required: true },
      { key: 'nextDate', type: 'date', label: L('Next review', 'Prochaine revue', 'المراجعة التالية'), required: true },
      { key: 'chair', type: 'role', label: L('Chaired by', 'Présidée par', 'يرأسها'), required: true },
      { key: 'participants', type: 'roles', label: L('Participants', 'Participants', 'المشاركون') },
      { key: 'inputs', type: 'rows', label: L('Inputs reviewed', 'Éléments d\'entrée revus', 'المدخلات المراجَعة'), columns: [
        col('input', 'text', L('Input', 'Élément d\'entrée', 'المدخل'), { required: true }),
        col('finding', 'textarea', L('Finding', 'Constat', 'الملاحظة')),
      ] },
      { key: 'decisions', type: 'rows', label: L('Decisions and actions', 'Décisions et actions', 'القرارات والإجراءات'), columns: [
        col('decision', 'text', L('Decision', 'Décision', 'القرار'), { required: true }),
        col('owner', 'person', L('Owner', 'Responsable', 'المسؤول')),
        col('due', 'date', L('Due date', 'Échéance', 'تاريخ الاستحقاق')),
      ], createsActions: true },
    ],
  },
  plan: {
    label: L('Plan', 'Plan', 'الخطة'),
    fields: [
      { key: 'activities', type: 'rows', required: true, createsActions: true, label: L('Planned activities (become actions)', 'Activités planifiées (deviennent des actions)', 'الأنشطة المخططة (تتحول إلى إجراءات)'), columns: [
        col('activity', 'text', L('Activity', 'Activité', 'النشاط'), { required: true }),
        col('owner', 'person', L('Owner', 'Responsable', 'المسؤول'), { required: true }),
        col('start', 'date', L('Start', 'Début', 'البداية')),
        col('due', 'date', L('Due date', 'Échéance', 'تاريخ الاستحقاق'), { required: true }),
        col('deliverable', 'text', L('Deliverable', 'Livrable', 'المخرج')),
      ] },
    ],
  },
  objectives: {
    label: L('SMART objectives', 'Objectifs SMART', 'الأهداف الذكية'),
    fields: [
      { key: 'objectives', type: 'rows', required: true, createsObjectives: true, label: L('Objectives (become entries of the objectives register)', 'Objectifs (deviennent des entrées du registre des objectifs)', 'الأهداف (تصبح قيودًا في سجل الأهداف)'), columns: [
        col('objective', 'text', L('Specific objective', 'Objectif spécifique', 'الهدف المحدد'), { required: true }),
        col('kpi', 'kpi', L('Measure (KPI)', 'Mesure (KPI)', 'القياس (المؤشر)'), { required: true }),
        col('baseline', 'text', L('Baseline', 'Valeur de départ', 'خط الأساس')),
        col('target', 'text', L('Achievable target', 'Cible atteignable', 'المستهدف القابل للتحقيق'), { required: true }),
        col('relevance', 'text', L('Relevant to (policy commitment)', 'Pertinent pour (engagement)', 'مرتبط بـ (التزام السياسة)')),
        col('owner', 'person', L('Owner', 'Responsable', 'المسؤول'), { required: true }),
        col('deadline', 'date', L('Time-bound deadline', 'Échéance', 'الموعد النهائي'), { required: true }),
        col('resources', 'text', L('Resources', 'Ressources', 'الموارد')),
      ] },
    ],
  },
  execute: {
    label: L('Execution', 'Exécution', 'التنفيذ'),
    fields: [
      { key: 'evidence', type: 'textarea', label: L('What was done', 'Ce qui a été réalisé', 'ما تم إنجازه'), required: true },
      { key: 'records', type: 'records', label: L('Records that prove it', 'Enregistrements qui le prouvent', 'السجلات التي تثبت ذلك') },
      { key: 'completion', type: 'number', label: L('Completion (%)', 'Avancement (%)', 'نسبة الإنجاز (%)'), required: true },
    ],
  },
  assign: {
    label: L('Assignment', 'Affectation', 'الإسناد'),
    fields: [
      { key: 'role', type: 'role', label: L('Role', 'Rôle', 'الدور'), required: true },
      { key: 'person', type: 'person', label: L('Person (from the OBS)', 'Personne (issue de l\'OBS)', 'الشخص (من الهيكل التنظيمي)'), required: true },
      { key: 'scope', type: 'obs', multiple: true, label: L('Organization units covered', 'Unités de l\'organisation couvertes', 'وحدات المؤسسة المشمولة') },
      { key: 'racsi', type: 'racsi', label: L('RACSI of the macro process', 'RACSI du macro-processus', 'مصفوفة RACSI للعملية الكلية') },
    ],
  },
  configure: {
    label: L('Configuration', 'Configuration', 'التهيئة'),
    fields: [
      { key: 'settings', type: 'rows', required: true, label: L('Settings', 'Paramètres', 'الإعدادات'), columns: [
        col('setting', 'text', L('Setting', 'Paramètre', 'الإعداد'), { required: true }),
        col('value', 'text', L('Value', 'Valeur', 'القيمة'), { required: true }),
        col('reason', 'text', L('Reason', 'Motif', 'السبب')),
      ] },
      { key: 'tested', type: 'select', options: ['Yes', 'No'], label: L('Tested before use', 'Testé avant usage', 'تم الاختبار قبل الاستخدام'), required: true },
    ],
  },
  update: {
    label: L('Change', 'Modification', 'التغيير'),
    fields: [
      { key: 'change', type: 'textarea', label: L('Change made', 'Modification apportée', 'التغيير المُجرى'), required: true },
      { key: 'reason', type: 'text', label: L('Reason', 'Motif', 'السبب'), required: true },
      { key: 'records', type: 'records', label: L('Documents or records updated', 'Documents ou enregistrements mis à jour', 'الوثائق أو السجلات المحدثة') },
    ],
  },
  close: {
    label: L('Closure', 'Clôture', 'الإغلاق'),
    fields: [
      { key: 'evidence', type: 'textarea', label: L('Closure evidence', 'Preuve de clôture', 'دليل الإغلاق'), required: true },
      { key: 'records', type: 'records', label: L('Records that prove effectiveness', 'Enregistrements prouvant l\'efficacité', 'السجلات التي تثبت الفعالية') },
      { key: 'date', type: 'date', label: L('Closure date', 'Date de clôture', 'تاريخ الإغلاق'), required: true },
    ],
  },
  escalate: {
    label: L('Escalation', 'Escalade', 'التصعيد'),
    fields: [
      { key: 'to', type: 'role', label: L('Escalated to', 'Escaladé à', 'تم التصعيد إلى'), required: true },
      { key: 'reason', type: 'textarea', label: L('Reason', 'Motif', 'السبب'), required: true },
    ],
  },
  ai: {
    label: L('AI-assisted draft', 'Brouillon assisté par IA', 'مسودة بمساعدة الذكاء الاصطناعي'),
    fields: [
      { key: 'context', type: 'textarea', label: L('Context given to the assistant', 'Contexte fourni à l\'assistant', 'السياق المقدم للمساعد'), required: true },
      { key: 'outcome', type: 'select', options: ['Accepted', 'Edited', 'Rejected'], label: L('Suggestion outcome', 'Issue de la suggestion', 'نتيجة الاقتراح'), required: true },
      { key: 'final', type: 'textarea', label: L('Final validated text', 'Texte final validé', 'النص النهائي المعتمد') },
    ],
  },
  service: {
    label: L('Automated service task', 'Tâche de service automatisée', 'مهمة خدمة آلية'),
    fields: [
      { key: 'result', type: 'text', label: L('System result confirmed', 'Résultat système confirmé', 'نتيجة النظام المؤكدة'), required: true },
      { key: 'records', type: 'records', label: L('Records produced', 'Enregistrements produits', 'السجلات الناتجة') },
    ],
  },
};

const RULES = [
  [/^(fix|set|establish) (review )?(periodicity|frequency)|^(set|establish) frequency|periodicity/i, 'periodicity'],
  [/^(cascade$|cascade objectives|define smart|define objectives|set targets|set objectives|translate policy)/i, 'objectives'],
  [/^(approve|obtain approval|validate|confirm|certify|close and obtain|issue certification|accept|go\/no-go|lock for approval|approve startup|review and approve)/i, 'decision'],
  [/^(review periodically|plan review|schedule review|review$|review\/improve|review\/certify|mini-reviews|full reviews|exco|commercial committees|periodic review|review relevance|hold)/i, 'review'],
  [/needs( and |\s*\/\s*|\s*&\s*)expectations|expectations of (the )?interested parties/i, 'needs'],
  [/^(assess|evaluate|analy[sz]e|score|calculate|quantify|compute|compare|rank|classify|prioriti[sz]e|determine|review effectiveness|test|verify|check)/i, 'assess'],
  [/^(document|draft|publish|issue|record|produce|write|register|file|prepare|compile|generate|author|create procedure|develop instructions|maintain (register|registry|log|records|repository|legal register|trails))/i, 'document'],
  [/^(communicate|notify|distribute|share|report|inform|present|alert|transmit|deliver report|send)/i, 'communicate'],
  [/^(train|deliver formal training|refresher|conduct exercises|deliver)/i, 'train'],
  [/^(monitor|track|measure|follow up|observe|re-?benchmark|benchmark|audit|inspect|survey)/i, 'monitor'],
  [/^(plan|schedule|design|define plans|develop plan|establish roadmaps|build portfolio)/i, 'plan'],
  [/^(designate|assign|allocate|appoint|form teams|select pilots|assemble team|match expert|identify candidates)/i, 'assign'],
  [/^(configure|set up|activate|enable|integrate|connect|deploy|install|provide|operate|implement|enforce|apply)/i, 'configure'],
  [/^(update|adjust|correct|remediate|improve|refine|revise|optimi[sz]e|retrain|upgrade|translate|customi[sz]e|standardi[sz]e)/i, 'update'],
  [/^(close|archive|dispose|retire|decommission|complete handover|close account|supersede)/i, 'close'],
  [/^(escalate|confirm or escalate)/i, 'escalate'],
  [/^(identify|define|collect|list|select|capture|map|gather|determine|consult|integrate commitments|aggregate|ingest|extract|detect|discover)/i, 'list'],
  [/^(execute|conduct|run|perform|carry out|contain|launch|celebrate|recognize|support|move to steady state|execute transition|conduct pilot|take action|join|participate|ask|attend|collaborate|interview|consult)/i, 'execute'],
];

export function formKindOf(stepName, stepType) {
  if (stepType === 'Service Task') return 'service';
  if (stepType === 'AI-Assisted Task') return 'ai';
  const s = (stepName || '').trim();
  for (const [rx, kind] of RULES) if (rx.test(s)) return kind;
  return 'execute';
}

// Weighted score of a decision matrix, rounded to one decimal (1..5).
export function matrixScore(rows) {
  const list = (rows || []).filter(r => +r.score >= 1 && +r.score <= 5);
  if (!list.length) return null;
  const w = list.reduce((a, r) => a + (+r.weight > 0 ? +r.weight : 1), 0);
  const s = list.reduce((a, r) => a + (+r.weight > 0 ? +r.weight : 1) * +r.score, 0);
  return Math.round((s / w) * 10) / 10;
}
