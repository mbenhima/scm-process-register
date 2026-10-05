// Questionnaire template library (FR-DA-TPL-06..09, FR-DA-QLT-01): the three IF-PAC interview forms used for a
// training engineering mission — General Manager (workshop), Management (directors, managers, process owners) and
// Team member. French is the source language of the forms; every label is also given in English and Arabic.
// Section types: note, identity, table, grid, questions, rating, swot, yesno. "feeds" names the consolidated dataset
// the answers go to (needs analysis, diagnostic, Training Engineering Report).

const L = (en, fr, ar) => ({ en, fr, ar });
const col = (key, label, kind = 'text', extra = {}) => ({ key, label, kind, ...extra });
const item = (key, label, extra = {}) => ({ key, label, ...extra });

// ---------------------------------------------------------------- shared vocabulary
const COMPETENCE = L('Competence(s) to develop', 'Compétence(s) à développer', 'الكفاءات المراد تطويرها');
const SCALE5 = { min: 1, max: 5 };

const identity = extraNote => ({
  id: 'identity', type: 'identity', feeds: 'respondent', mandatory: true,
  title: L('Respondent', 'Participant', 'المشارك'), instructions: extraNote || null,
  fields: [
    item('full_name', L('Full name', 'Nom complet', 'الاسم الكامل')),
    item('position', L('Position', 'Poste', 'المنصب')),
    item('reports_to', L('Reports to', 'Reporte à', 'يرفع تقاريره إلى')),
    item('experience_years', L('Years of experience', "Nombre d'années d'expérience", 'عدد سنوات الخبرة'), { kind: 'number' }),
    item('years_in_position', L('Years in the position', 'Ancienneté dans le poste (ans)', 'الأقدمية في المنصب (سنوات)'), { kind: 'number' }),
    item('age', L('Age', 'Âge', 'السن'), { kind: 'number' }),
  ],
});

const trainingHistory = {
  id: 'training_history', type: 'table', feeds: 'training_history', minRows: 3,
  title: L('Training attended in your company or institution', 'Formations auxquelles vous avez assisté dans votre entreprise / institution', 'التكوينات التي حضرتها في مؤسستك'),
  columns: [
    col('title', L('Training title', 'Intitulé de la formation', 'عنوان التكوين')),
    col('month_year', L('Month / Year', 'Mois / Année', 'الشهر / السنة')),
    col('days', L('Duration (days)', 'Durée en jours', 'المدة بالأيام'), 'number'),
    col('learnings', L('Learnings', 'Acquis / Apprentissages', 'المكتسبات / التعلمات')),
  ],
};

const previousPlan = {
  id: 'previous_plan', type: 'questions', feeds: 'previous_plan', condition: 'previous_plan',
  title: L('Impact of the previous year’s training plan (n-1)', 'Impact du plan de formation de l’année n-1', 'أثر مخطط التكوين للسنة الماضية (ن-1)'),
  instructions: L('Preliminary questions — ask only if the company had a training plan in year n-1.', 'Questions préliminaires — à poser seulement si l’entreprise avait un plan de formation pendant l’année n-1.', 'أسئلة تمهيدية — تُطرح فقط إذا كان للمؤسسة مخطط تكوين في السنة ن-1.'),
  items: [
    item('noticed', L('What did you notice about the n-1 training plan?', 'Qu’avez-vous remarqué à propos du plan de formation de l’année n-1 ?', 'ماذا لاحظت بخصوص مخطط التكوين للسنة ن-1؟')),
    item('strengths', L('What were the strengths of the n-1 plan?', 'Quels étaient les points forts du plan de formation de l’année n-1 ?', 'ما هي نقاط قوة مخطط السنة ن-1؟')),
    item('improvements', L('What improvements did the n-1 plan bring?', 'Quelles étaient les améliorations apportées par le plan de formation de l’année n-1 ?', 'ما هي التحسينات التي جاء بها مخطط السنة ن-1؟')),
    item('challenges', L('What were the challenges of the n-1 plan?', 'Quels étaient les défis concernant le plan de formation de l’année n-1 ?', 'ما هي التحديات المتعلقة بمخطط السنة ن-1؟')),
    item('liked', L('What did you appreciate and like about the n-1 plan?', 'Qu’avez-vous apprécié et aimé à propos du plan de formation de l’année n-1 ?', 'ما الذي أعجبك في مخطط السنة ن-1؟')),
    item('different', L('For a new training plan, what would you like to see done differently?', 'Si on faisait un nouveau plan de formation, qu’est-ce que vous aimeriez voir de différent ?', 'في مخطط تكوين جديد، ما الذي تود أن يكون مختلفا؟')),
    item('outcome', L('If this is achieved, what would the situation become?', 'Si cela est réalisé, que deviendrait la situation ?', 'إذا تحقق ذلك، كيف سيصبح الوضع؟')),
    item('suggestions', L('What are your suggestions for the new training plan?', 'Quelles seraient vos suggestions pour le nouveau plan de formation ?', 'ما هي اقتراحاتك لمخطط التكوين الجديد؟')),
    item('company_action', L('What could the company do with these suggestions?', 'Que pourrait faire l’entreprise avec ces suggestions ?', 'ماذا يمكن للمؤسسة أن تفعل بهذه الاقتراحات؟')),
  ],
};

const orgChart = {
  id: 'org_chart', type: 'yesno', feeds: 'org_chart',
  title: L('Company organization chart', 'L’organigramme de l’entreprise', 'الهيكل التنظيمي للمؤسسة'),
  items: [item('confirmed', L('Organization chart of the scope in question confirmed', 'Organigramme du périmètre en question confirmé', 'تم تأكيد الهيكل التنظيمي للنطاق المعني'))],
};

const jobs = {
  id: 'jobs', type: 'table', feeds: 'jobs', minRows: 3,
  title: L('Current and future jobs (N-1 only: those reporting to the General Manager) — description and development planning', 'Les emplois actuels et futurs (N-1 uniquement : ceux qui reportent au DG) — description et planification pour le développement', 'الوظائف الحالية والمستقبلية (ن-1 فقط: التابعون للمدير العام) — الوصف والتخطيط للتطوير'),
  columns: [
    col('job_title', L('Job title', 'Titre de l’emploi', 'مسمى الوظيفة')),
    col('existing', L('Existing or future job', 'Emploi existant ou futur', 'وظيفة قائمة أو مستقبلية'), 'choice', { options: [L('Existing', 'Existant', 'قائمة'), L('Future', 'Futur', 'مستقبلية')] }),
    col('key_activities', L('Key activities (existing and future N-1)', 'Activités clés (N-1 existants et futurs)', 'الأنشطة الرئيسية (ن-1 الحالية والمستقبلية)')),
    col('competences', COMPETENCE, 'text', { competence: true }),
    col('critical', L('Most critical activities with a high impact on performance', 'Les activités les plus critiques qui ont un grand impact sur la performance', 'الأنشطة الأكثر حساسية ذات الأثر الكبير على الأداء')),
  ],
};

const strategy = {
  id: 'strategy', type: 'grid', feeds: 'strategy',
  title: L('Strategic orientations and competence needs', 'Les orientations stratégiques et besoins en compétences', 'التوجهات الاستراتيجية والحاجيات من الكفاءات'),
  instructions: L('Before the face-to-face meeting, fill in as much as possible from the preparatory documents. During the meeting: confirm and update.', 'Avant la rencontre face to face, remplir le maximum à partir des documents préparatoires. Durant la rencontre : confirmer et actualiser.', 'قبل اللقاء المباشر، املأ أكبر قدر ممكن انطلاقا من الوثائق التحضيرية. خلال اللقاء: التأكيد والتحيين.'),
  columns: [col('details', L('Details', 'Détails', 'التفاصيل'))],
  rows: [
    item('vision', L('Vision', 'Vision', 'الرؤية')), item('mission', L('Mission', 'Mission', 'المهمة')), item('values', L('Values', 'Valeurs', 'القيم')),
    item('context', L('Context', 'Contexte', 'السياق')), item('products_existing', L('Products — existing', 'Produits — existants', 'المنتجات — الحالية')),
    item('products_new', L('Products — new', 'Produits — nouveaux', 'المنتجات — الجديدة')), item('segments', L('Market segments', 'Segments du marché', 'شرائح السوق')),
    item('strategies', L('Strategy(ies) adopted', 'Stratégie(s) adoptée(s)', 'الاستراتيجيات المعتمدة')),
    item('priority_axes', L('Priority axes for training and human capital development', 'Axes priorisés pour les formations et développement du capital humain', 'المحاور ذات الأولوية للتكوين وتنمية الرأسمال البشري')),
    item('actions', L('Actions under way or planned', 'Actions engagées ou envisagées', 'الإجراءات الجارية أو المرتقبة')),
  ],
};

const keyDates = {
  id: 'key_dates', type: 'table', feeds: 'history', minRows: 3,
  title: L('Key dates of the company', 'Dates clés de l’entreprise', 'التواريخ الرئيسية للمؤسسة'),
  columns: [col('date', L('Date', 'Date', 'التاريخ')), col('event', L('Event', 'Événement', 'الحدث'))],
};

const DASHBOARD = [
  ['customer', L('Customer satisfaction', 'Satisfaction des clients', 'رضا الزبناء')],
  ['financial', L('Financial performance', 'Performance financière', 'الأداء المالي')],
  ['operational', L('Operational and production efficiency', 'Efficacité opérationnelle et de production', 'النجاعة التشغيلية والإنتاجية')],
  ['hr', L('HR / human capital', 'RH / Capital humain', 'الموارد البشرية / الرأسمال البشري')],
  ['innovation', L('Innovation (products, services, processes, business model)', 'Innovation (produits, services, processus, business model…)', 'الابتكار (المنتجات، الخدمات، المسارات، نموذج الأعمال)')],
];
const objectives = (own = false) => ({
  id: 'objectives', type: 'table', feeds: 'objectives', minRows: 2,
  title: own ? L('Performance indicators — my objectives', 'Indicateurs de performance — mes objectifs', 'مؤشرات الأداء — أهدافي') : L('Performance indicators — strategic objectives', 'Indicateurs de performance — objectifs stratégiques', 'مؤشرات الأداء — الأهداف الاستراتيجية'),
  instructions: L('Tick the performance dashboard areas each objective is linked to.', 'Cocher les domaines du tableau de bord de la performance auxquels chaque objectif est lié.', 'ضع علامة على مجالات لوحة قيادة الأداء المرتبطة بكل هدف.'),
  columns: [
    col('objective', own ? L('Objective', 'Objectif', 'الهدف') : L('Strategic objective', 'Objectif stratégique', 'الهدف الاستراتيجي')),
    col('smart', L('Description (SMART)', 'Description (SMART)', 'الوصف (SMART)')),
    ...DASHBOARD.map(([k, lb]) => col('link_' + k, L('Link: ' + lb.en, 'Lien : ' + lb.fr, 'الارتباط: ' + lb.ar), 'check')),
    col('competences', L('Competences to develop to meet these objectives', 'Compétences à développer pour répondre à ces objectifs', 'الكفاءات المراد تطويرها لتحقيق هذه الأهداف'), 'text', { competence: true }),
  ],
});

const performance = {
  id: 'performance', type: 'table', feeds: 'performance', minRows: 3,
  title: L('Performance by function and decision level (1 – 5; 5: highest)', 'Performance par fonction et niveau (1 – 5 ; 5 : plus haute)', 'الأداء حسب الوظيفة والمستوى (1 – 5؛ 5: الأعلى)'),
  instructions: L('List every function of the company. MS: strategic management, MO: operational management, OP: operational.', 'Lister ici toutes les fonctions de l’entreprise. MS : management stratégique, MO : management opérationnel, OP : opérationnel.', 'اذكر جميع وظائف المؤسسة. MS: التدبير الاستراتيجي، MO: التدبير العملياتي، OP: التنفيذ.'),
  columns: [
    col('function', L('Function', 'Fonction', 'الوظيفة'), 'function'),
    col('ms', L('Strategic management (MS)', 'Management stratégique (MS)', 'التدبير الاستراتيجي (MS)'), 'scale', SCALE5),
    col('mo', L('Operational management (MO)', 'Management opérationnel (MO)', 'التدبير العملياتي (MO)'), 'scale', SCALE5),
    col('op', L('Operational (OP)', 'Opérationnel (OP)', 'التنفيذ (OP)'), 'scale', SCALE5),
    col('competences', L('Competences required to improve performance (MS / MO / OP)', 'Compétences requises pour améliorer la performance (MS / MO / OP)', 'الكفاءات المطلوبة لتحسين الأداء (MS / MO / OP)'), 'text', { competence: true }),
  ],
};

const LEVELS5 = [
  item('personal_productivity', L('Personal productivity', 'Productivité personnelle', 'الإنتاجية الشخصية'), { hint: L('“I deliver with reminders”', '« Je produis avec des relances »', '«أنتج مع التذكير»') }),
  item('personal_leadership', L('Personal leadership', 'Leadership personnel', 'القيادة الشخصية'), { hint: L('“I deliver and I am autonomous”', '« Je produis et je suis autonome »', '«أنتج وأنا مستقل»') }),
  item('team_leadership', L('Leadership applied to teams', 'Leadership appliqué aux équipes', 'القيادة المطبقة على الفرق'), { hint: L('“I can lead a team”', '« Je peux assurer le leadership d’une équipe »', '«أستطيع قيادة فريق»') }),
  item('subfunction_leadership', L('Leadership of a sub-function of the organization', 'Leadership d’une sous-fonction de l’organisation', 'قيادة وظيفة فرعية في المؤسسة'), { hint: L('“I can lead a sub-function of the organization”', '« Je peux assurer le leadership d’une sous-fonction de l’organisation »', '«أستطيع قيادة وظيفة فرعية في المؤسسة»') }),
  item('function_leadership', L('Leadership of a function or of the whole organization', 'Leadership d’une fonction ou de toute l’organisation', 'قيادة وظيفة أو المؤسسة بأكملها'), { hint: L('“I can lead a function or the whole organization”', '« Je peux assurer le leadership d’une fonction ou de toute l’organisation »', '«أستطيع قيادة وظيفة أو المؤسسة بأكملها»') }),
];
const leadershipScope = {
  id: 'leadership', type: 'grid', feeds: 'leadership',
  title: L('The 5 levels of leadership and excellence', 'Les 5 niveaux de leadership et excellence', 'المستويات الخمسة للقيادة والتميز'),
  instructions: L('Total headcount in your scope, including yourself, goes in the first row’s details. The percentages add up to 100% of the employees.', 'Indiquer l’effectif global de votre périmètre (vous inclus) dans les détails de la première ligne. Le total fait 100 % des employés / capital humain.', 'اذكر العدد الإجمالي للعاملين في نطاقك (بما فيهم أنت) في تفاصيل السطر الأول. المجموع يساوي 100٪ من المستخدمين.'),
  rows: LEVELS5,
  columns: [
    col('pct', L('% of employees in the scope', 'Pourcentage des employés du périmètre', 'نسبة المستخدمين في النطاق'), 'number'),
    col('grade', L('Hierarchical level (director, manager, officer, team lead, technician…)', 'Niveau hiérarchique (directeur, responsable, chargé de mission, chef d’équipe, technicien…)', 'المستوى الهرمي (مدير، مسؤول، مكلف بمهمة، رئيس فريق، تقني…)')),
    col('details', L('Details', 'Détails', 'التفاصيل')),
  ],
};
const leadershipSelf = {
  id: 'leadership', type: 'grid', feeds: 'leadership',
  title: L('The levels of leadership and excellence', 'Les niveaux de leadership et excellence', 'مستويات القيادة والتميز'),
  rows: LEVELS5.slice(0, 3),
  columns: [col('self', L('Your assessment (1 – 5: excellent)', 'Votre évaluation (1 – 5 : excellent)', 'تقييمك (1 – 5: ممتاز)'), 'scale', SCALE5), col('details', L('Details', 'Détails', 'التفاصيل'))],
};

const TP = (domain, key, en, fr, ar) => item(key, L(en, fr, ar), { group: domain });
const D_CLIENT = L('Customer', 'Client', 'الزبون'); const D_PROD = L('Production equipment / network infrastructure', 'Machines de production / infrastructure réseau', 'آلات الإنتاج / البنية التحتية للشبكة'); const D_PLM = L('Products / services / marketing / PLM', 'Produits / services / marketing / PLM', 'المنتجات / الخدمات / التسويق / PLM');
const transverse = {
  id: 'transverse', type: 'grid', feeds: 'transverse',
  title: L('Management of cross-functional processes', 'Management des processus transverses', 'تدبير المسارات العرضانية'),
  instructions: L('These processes drive business performance from the customer, operational efficiency, financial, HR and innovation perspectives.', 'Ces processus impactent directement la performance business : domaines client, efficacité opérationnelle, financier, RH, innovation et nouveaux produits.', 'تؤثر هذه المسارات مباشرة في أداء المؤسسة من منظور الزبون والنجاعة التشغيلية والمالية والموارد البشرية والابتكار.'),
  rows: [
    TP(D_CLIENT, 'prospect_cash', '“From prospect to cash”', '« D’un prospect à l’encaissement »', '«من الزبون المحتمل إلى التحصيل»'),
    TP(D_CLIENT, 'change_impl', '“From a change request to its implementation”', '« D’une demande de changement à son implémentation »', '«من طلب التغيير إلى تنفيذه»'),
    TP(D_CLIENT, 'request_answer', '“From a customer request to its answer”', '« D’une demande client à sa réponse »', '«من طلب الزبون إلى الرد عليه»'),
    TP(D_CLIENT, 'usage_payment', '“From product / service use to payment” (rental…)', '« De l’utilisation produit / service au paiement » (location…)', '«من استعمال المنتج / الخدمة إلى الأداء» (الكراء…)'),
    TP(D_CLIENT, 'problem_resolution', '“From a customer problem to its resolution”', '« D’un problème client à sa résolution »', '«من مشكلة الزبون إلى حلها»'),
    TP(D_CLIENT, 'complaint_resolution', '“From a customer complaint to its resolution”', '« D’une plainte client à sa résolution »', '«من شكاية الزبون إلى معالجتها»'),
    TP(D_CLIENT, 'termination', '“From a termination request to its closure”', '« D’une demande de terminaison à sa clôture »', '«من طلب الإنهاء إلى الإغلاق»'),
    TP(D_PROD, 'delivery_acceptance', '“From internal product delivery to customer acceptance”', '« De la livraison du produit interne à son acceptance par les clients »', '«من تسليم المنتج الداخلي إلى قبوله من الزبناء»'),
    TP(D_PROD, 'capacity', '“Delivery capacity management”', '« Management de la capacité de livraison »', '«تدبير القدرة على التسليم»'),
    TP(D_PROD, 'tech_lifecycle', '“Technical resources life-cycle management”', '« Gestion de cycle de vie des ressources techniques »', '«تدبير دورة حياة الموارد التقنية»'),
    TP(D_PROD, 'service_lifecycle', '“Service life-cycle management”', '« Gestion de cycle de vie des services »', '«تدبير دورة حياة الخدمات»'),
    TP(D_PROD, 'incident', '“From a production / service resource incident to its resolution”', '« D’un incident ressource de production / service à sa résolution »', '«من عطل في موارد الإنتاج / الخدمة إلى حله»'),
    TP(D_PROD, 'usage_closure', '“From product / service use to its closure” (rental…)', '« De l’utilisation produit / service à sa clôture » (location…)', '«من استعمال المنتج / الخدمة إلى إغلاقه» (الكراء…)'),
    TP(D_PLM, 'product_strategy', '“Develop the product strategy and roadmap”', '« Développer la stratégie et feuille de route produits »', '«تطوير استراتيجية المنتجات وخارطة طريقها»'),
    TP(D_PLM, 'design_develop', '“Design and develop a product”', '« Concevoir et développer un produit »', '«تصميم وتطوير منتج»'),
    TP(D_PLM, 'monitor_product', '“Monitor the performance of a product”', '« Monitorer la performance d’un produit »', '«تتبع أداء منتج»'),
  ],
  columns: [
    col('documented', L('Documented (yes, no)', 'Documenté (oui, non)', 'موثق (نعم، لا)'), 'yesno'),
    col('owner', L('Global (virtual) process owner in place', 'Pilote global (pilote virtuel) en place', 'وجود قائد عام (افتراضي) للمسار'), 'yesno'),
    col('score', L('Current performance (1 – 5, 5: excellent)', 'État actuel de la performance (1 – 5, 5 : excellent)', 'الأداء الحالي (1 – 5، 5: ممتاز)'), 'scale', SCALE5),
  ],
};

const swotGeneral = {
  id: 'swot', type: 'swot', feeds: 'swot',
  title: L('General SWOT', 'SWOT général', 'تحليل SWOT العام'),
  boxes: [item('strengths', L('Strengths', 'Forces', 'نقاط القوة')), item('weaknesses', L('Areas for improvement', 'Points d’amélioration', 'نقاط التحسين')), item('opportunities', L('Opportunities', 'Opportunités', 'الفرص')), item('threats', L('Threats', 'Menaces', 'التهديدات'))],
};
const swotFunction = {
  id: 'swot_function', type: 'table', feeds: 'swot', minRows: 2,
  title: L('SWOT of the function', 'SWOT de la fonction', 'تحليل SWOT للوظيفة'),
  columns: [
    col('scope', L('Job / function / detailed scope of action', 'Métier / fonction / périmètre d’action détaillé', 'المهنة / الوظيفة / نطاق العمل المفصل')),
    col('strengths', L('Strengths', 'Points forts', 'نقاط القوة')),
    col('weaknesses', L('High-level areas for improvement (dysfunctions, problems, shortfalls)', 'Points d’amélioration à très haut niveau liés aux dysfonctionnements / problèmes / insuffisances', 'نقاط التحسين الكبرى المرتبطة بالاختلالات / المشاكل / النواقص')),
    col('competences', COMPETENCE, 'text', { competence: true }),
  ],
};
const swotOT = { id: 'swot_ot', type: 'swot', feeds: 'swot', title: L('Opportunities and threats', 'Opportunités et menaces', 'الفرص والتهديدات'), boxes: [item('opportunities', L('Opportunities', 'Opportunités', 'الفرص')), item('threats', L('Threats', 'Menaces', 'التهديدات'))] };
const swotLight = {
  id: 'swot_light', type: 'table', feeds: 'swot', minRows: 2,
  title: L('My light SWOT', 'Mon SWOT light', 'تحليل SWOT المبسط الخاص بي'),
  columns: [
    col('strengths', L('Strengths', 'Points forts', 'نقاط القوة')),
    col('weaknesses', L('High-level areas for improvement (dysfunctions, problems, shortfalls)', 'Points d’amélioration à très haut niveau liés aux dysfonctionnements / problèmes / insuffisances', 'نقاط التحسين الكبرى المرتبطة بالاختلالات / المشاكل / النواقص')),
    col('competences', COMPETENCE, 'text', { competence: true }),
  ],
};

const strategicPlanning = {
  id: 'strategic_planning', type: 'yesno', feeds: 'strategic_planning',
  title: L('Strategic planning and macro business plans', 'Planification stratégique de l’entreprise et macro business plans', 'التخطيط الاستراتيجي للمؤسسة ومخططات الأعمال الكبرى'),
  items: [
    item('exists', L('Is there a strategic plan with macro business plans at company level?', 'Existe-t-il un plan stratégique et des macro business plans au niveau de l’entreprise ?', 'هل يوجد مخطط استراتيجي ومخططات أعمال كبرى على مستوى المؤسسة؟')),
    item('implemented', L('Are this strategic plan and the macro business plans implemented?', 'Ce plan stratégique et les macro business plans sont-ils mis en place ?', 'هل تم تنزيل هذا المخطط الاستراتيجي ومخططات الأعمال الكبرى؟')),
    item('monitored', L('Are they monitored?', 'Sont-ils surveillés ?', 'هل تتم مراقبتها؟')),
    item('improved', L('Are they subject to continuous improvement?', 'Sont-ils sujets à l’amélioration continue ?', 'هل تخضع للتحسين المستمر؟')),
  ],
};

const SOFT = [
  ['self_motivation', 'Self-motivation and energy', 'Auto-motivation et énergie', 'التحفيز الذاتي والطاقة'],
  ['self_control', 'Self-control and excellence', 'Auto-contrôle et excellence', 'ضبط النفس والتميز'],
  ['positive_thinking', 'Positive thinking and positive results (focus on solutions, break a big challenge into small pieces, look ahead)', 'Pensée positive et résultats positifs (focus sur les solutions, diviser un grand challenge en petits morceaux, être tourné vers le futur)', 'التفكير الإيجابي والنتائج الإيجابية (التركيز على الحلول، تقسيم التحدي الكبير إلى أجزاء صغيرة، التطلع إلى المستقبل)'],
  ['mbo_self', 'Management by objectives and strategic vision applied to oneself', 'Management par objectif et vision stratégique appliqué à soi-même', 'التدبير بالأهداف والرؤية الاستراتيجية المطبقة على الذات'],
  ['personal_development', 'Personal development plan and continuous learning', 'Plan de développement personnel et apprentissage continu', 'مخطط التطوير الشخصي والتعلم المستمر'],
  ['time_priorities', 'Time management and priorities', 'Gestion du temps et priorités', 'تدبير الوقت والأولويات'],
  ['mbo_others', 'Management by objectives and strategic vision applied to others', 'Management par objectif et vision stratégique appliqué aux autres', 'التدبير بالأهداف والرؤية الاستراتيجية المطبقة على الآخرين'],
  ['coaching_others', 'Coaching others towards excellence', 'Accompagnement des autres pour l’excellence', 'مواكبة الآخرين نحو التميز'],
  ['comm_self', 'Communication with oneself', 'Communication avec soi-même', 'التواصل مع الذات'],
  ['comm_others', 'Communication with others', 'Communication avec les autres', 'التواصل مع الآخرين'],
  ['comm_team', 'Communication with the team', 'Communication avec l’équipe', 'التواصل مع الفريق'],
  ['comm_public', 'Public speaking', 'Communication en public', 'التواصل أمام الجمهور'],
  ['rewards', 'Rewards and motivation', 'Récompenses et motivation', 'المكافآت والتحفيز'],
  ['training_effectiveness', 'Training and effectiveness', 'Formations et efficacité', 'التكوين والفعالية'],
  ['flexibility', 'Managing with flexibility', 'Management avec flexibilité', 'التدبير بمرونة'],
  ['values_mgmt', 'Management by values', 'Management par les valeurs', 'التدبير بالقيم'],
  ['enterprise_mgmt', 'Enterprise management: macro view of the company’s businesses and functions and how they are steered; overall dashboard', 'Management d’entreprise : vue macro des métiers / fonctions de l’entreprise et leur pilotage ; tableau de bord global', 'تدبير المؤسسة: رؤية شاملة لمهن ووظائف المؤسسة وقيادتها؛ لوحة القيادة الشاملة', 'managers'],
  ['problem_solving', 'Continuous quality improvement — problem solving and solutions', 'Amélioration continue de la qualité — résolution de problèmes et solutions', 'التحسين المستمر للجودة — حل المشكلات والحلول'],
  ['conflict_resolution', 'Continuous quality improvement — conflict resolution and solutions', 'Amélioration continue de la qualité — résolution de conflits et solutions', 'التحسين المستمر للجودة — حل النزاعات والحلول'],
  ['innovation', 'Continuous quality improvement — innovation and solutions', 'Amélioration continue de la qualité — innovation et solutions', 'التحسين المستمر للجودة — الابتكار والحلول'],
  ['change_mgmt', 'Change management (identify, plan, execute, follow up and update a change plan)', 'Management du changement (identification, planification, exécution d’un plan de conduite du changement, le suivre, le mettre à jour)', 'تدبير التغيير (تحديد وتخطيط وتنفيذ مخطط قيادة التغيير وتتبعه وتحيينه)'],
  ['recruitment', 'Effective recruitment', 'Recrutement efficace', 'التوظيف الفعال'],
];
const softSkills = managers => ({
  id: 'soft_skills', type: 'rating', feeds: 'soft_skills',
  title: L('Self-assessment of management / leadership competences', 'Comment vous évaluez-vous par rapport aux compétences managériales / leadership suivantes', 'التقييم الذاتي للكفاءات التدبيرية / القيادية'),
  instructions: managers
    ? L('Scale: New (Nv), 1 – 5 (5: excellent). Tell the participant that priorities generally follow their voice, the strategic objectives and the training prerequisites.', 'Échelle : Nouvelle (Nv), 1 – 5 (5 : excellent). Informer le participant que les priorités sont en général fonction de sa voix, des objectifs stratégiques et des prérequis des formations.', 'السلم: جديدة (Nv)، 1 – 5 (5: ممتاز). أخبر المشارك بأن الأولويات تتبع عموما رأيه والأهداف الاستراتيجية والمتطلبات القبلية للتكوينات.')
    : L('Scale: 1 – 3 average, 4 very good, 5 excellent. Priorities generally follow your voice, the strategic objectives and the training prerequisites.', 'Échelle : 1 – 3 moyen, 4 très bien, 5 excellent. Les priorités sont en général fonction de votre voix, des objectifs stratégiques et des prérequis des formations.', 'السلم: 1 – 3 متوسط، 4 جيد جدا، 5 ممتاز. تتبع الأولويات عموما رأيك والأهداف الاستراتيجية والمتطلبات القبلية للتكوينات.'),
  scale: { ...SCALE5, allowNew: managers },
  items: SOFT.filter(s => managers || s[4] !== 'managers').map(([k, en, fr, ar]) => item(k, L(en, fr, ar))),
});

const hrOrientations = {
  id: 'hr_orientations', type: 'questions', feeds: 'hr_orientations', condition: 'hr_function',
  title: L('HR orientations (HR function only)', 'Orientations RH (seulement pour la fonction RH)', 'توجهات الموارد البشرية (لوظيفة الموارد البشرية فقط)'),
  items: [item('orientations', L('What are the HR orientations?', 'Quelles sont les orientations RH ?', 'ما هي توجهات الموارد البشرية؟'))],
};

const jobSheet = {
  id: 'job_sheet', type: 'table', feeds: 'job_tasks', minRows: 4,
  title: L('Job description', 'Fiche de poste', 'بطاقة المنصب'),
  columns: [
    col('task', L('Tasks performed', 'Tâches effectuées', 'المهام المنجزة')),
    col('status', L('Existing / new', 'Existante / nouvelle', 'قائمة / جديدة'), 'choice', { options: [L('Existing', 'Existante', 'قائمة'), L('New', 'Nouvelle', 'جديدة')] }),
    col('critical', L('Criticality (1 – 5, 5: very high impact on performance)', 'Critique (1 – 5, 5 : très haute avec un grand impact sur la performance)', 'درجة الحساسية (1 – 5، 5: أثر كبير جدا على الأداء)'), 'scale', SCALE5),
    col('performance', L('Performance (1 – 5, 5: excellent)', 'État de la performance (1 – 5, 5 : excellent)', 'حالة الأداء (1 – 5، 5: ممتاز)'), 'scale', SCALE5),
    col('competences', COMPETENCE, 'text', { competence: true }),
  ],
};

const projects = {
  id: 'projects', type: 'table', feeds: 'projects', minRows: 2,
  title: L('Projects under way', 'Les projets en cours', 'المشاريع الجارية'),
  columns: [
    col('project', L('Project', 'Projet', 'المشروع')), col('details', L('Details', 'Détails', 'التفاصيل')),
    col('start', L('Start date', 'Date de début', 'تاريخ البداية'), 'date'), col('end', L('End date', 'Date de fin', 'تاريخ النهاية'), 'date'),
    col('state', L('Current state', 'État actuel', 'الوضع الحالي')), col('remarks', L('Remarks', 'Remarques', 'ملاحظات')),
    col('competences', COMPETENCE, 'text', { competence: true }),
  ],
};

const ambitions = own => ({
  id: 'ambitions', type: 'questions', feeds: 'ambitions',
  title: L('Ambitions, expected impact and recommendations', 'Ambitions, impact attendu et recommandations', 'الطموحات والأثر المنتظر والتوصيات'),
  items: [
    item('ambitions', own ? L('What are your current ambitions to improve your performance?', 'Quelles sont vos ambitions actuelles afin d’améliorer votre performance ?', 'ما هي طموحاتك الحالية لتحسين أدائك؟') : L('What are your current ambitions to improve overall performance?', 'Quelles sont vos ambitions actuelles afin d’améliorer la performance globale ?', 'ما هي طموحاتك الحالية لتحسين الأداء العام؟')),
    item('feelings', L('Once these ambitions are achieved, how would you feel?', 'Une fois ces ambitions réalisées, quels seraient vos sentiments ?', 'بعد تحقيق هذه الطموحات، ما هو شعورك؟')),
    item('evidence', L('How will you know they are achieved?', 'Comment allez-vous savoir qu’elles sont réalisées ?', 'كيف ستعرف أنها تحققت؟')),
    item('can_do', L('What can you do to achieve them?', 'Que pouvez-vous faire pour les réaliser ?', 'ماذا يمكنك أن تفعل لتحقيقها؟')),
    item('will_do', L('What will you do to achieve them?', 'Qu’allez-vous faire pour les réaliser ?', 'ماذا ستفعل لتحقيقها؟')),
    item('needs', L('What do you need to excel further in your position?', 'De quoi avez-vous besoin pour exceller davantage dans votre poste ?', 'ما الذي تحتاجه لتتميز أكثر في منصبك؟'), { competence: true }),
    item('impact', L('In your view, what impact and results do you expect from the competence development trainings?', 'Impact et résultats attendus des différentes formations liées au développement de compétences, à votre avis', 'في رأيك، ما هو الأثر والنتائج المنتظرة من التكوينات المرتبطة بتطوير الكفاءات؟')),
    item('recommendations', L('Your recommendations', 'Vos recommandations', 'توصياتك')),
  ],
});

const dgBrief = {
  id: 'brief', type: 'note',
  title: L('Interviewer brief — workshop with the General Manager', 'Consignes — workshop avec le DG', 'توجيهات المحاور — ورشة مع المدير العام'),
  instructions: L(
    'During this meeting with the General Manager: 1) update the strategic vision; 2) ask an open question on the priority training axes; 3) validate the axes that came out of the face-to-face meetings with the other participants; 4) on request, validate the themes of some axes; and confirm the organization chart of the scope. Outcome of the face-to-face meetings: spread the training content over several years (2 years…).',
    'Lors de cette rencontre avec le DG : 1) actualiser la vision stratégique ; 2) poser une question ouverte sur les axes prioritaires de formation ; 3) valider les axes issus des rencontres face to face avec les autres participants ; 4) valider à la demande les thèmes de certains axes ; et confirmer l’organigramme du périmètre en question. Résultat des rencontres face to face : répartir le contenu des formations sur plusieurs années (2 ans…).',
    'خلال هذا اللقاء مع المدير العام: 1) تحيين الرؤية الاستراتيجية؛ 2) طرح سؤال مفتوح حول محاور التكوين ذات الأولوية؛ 3) المصادقة على المحاور المنبثقة عن اللقاءات المباشرة مع باقي المشاركين؛ 4) المصادقة عند الطلب على مواضيع بعض المحاور؛ وتأكيد الهيكل التنظيمي للنطاق المعني. نتيجة اللقاءات المباشرة: توزيع محتوى التكوينات على عدة سنوات (سنتان…).'),
};

export const QUESTIONNAIRE_TEMPLATES = [
  { code: 'QT-IFPAC-DG', population: 'DG', decision_level: 'MS', default_channel: 'FaceToFace', form: 'F1',
    name: L('IF-PAC form — General Manager workshop', 'Formulaire IF-PAC — workshop DG', 'استمارة IF-PAC — ورشة المدير العام'),
    description: L('Training engineering interview with the General Manager: strategy, performance by function, leadership levels, cross-functional processes, SWOT, strategic planning and priorities.', 'Entretien d’ingénierie de formation avec le DG : stratégie, performance par fonction, niveaux de leadership, processus transverses, SWOT, planification stratégique et priorités.', 'مقابلة هندسة التكوين مع المدير العام: الاستراتيجية، الأداء حسب الوظيفة، مستويات القيادة، المسارات العرضانية، SWOT، التخطيط الاستراتيجي والأولويات.'),
    sections: [dgBrief, identity(), trainingHistory, previousPlan, orgChart, jobs, strategy, keyDates, objectives(), performance, leadershipScope, transverse, swotGeneral, strategicPlanning, softSkills(true), projects, ambitions(false)] },
  { code: 'QT-IFPAC-MGT', population: 'Management', decision_level: 'MO', default_channel: 'Combination', form: 'F2',
    name: L('IF-PAC form — Management (directors, managers, process owners)', 'Formulaire IF-PAC — Management (directeurs / responsables, pilotes de processus)', 'استمارة IF-PAC — الأطر المسيرة (المديرون، المسؤولون، قادة المسارات)'),
    description: L('Training engineering interview with directors, managers and process owners: jobs, performance, leadership levels, cross-functional processes, SWOT of the function, objectives and soft skills.', 'Entretien d’ingénierie de formation avec les directeurs, responsables et pilotes de processus : emplois, performance, niveaux de leadership, processus transverses, SWOT de la fonction, objectifs et soft skills.', 'مقابلة هندسة التكوين مع المديرين والمسؤولين وقادة المسارات: الوظائف، الأداء، مستويات القيادة، المسارات العرضانية، SWOT الوظيفة، الأهداف والمهارات الشخصية.'),
    sections: [identity(), trainingHistory, previousPlan, orgChart, jobs, performance, leadershipScope, transverse, swotFunction, swotOT, objectives(), softSkills(true), hrOrientations, projects, ambitions(false)] },
  { code: 'QT-IFPAC-MBR', population: 'Member', decision_level: 'OP', default_channel: 'Application', form: 'F3',
    name: L('IF-PAC form — Team member', 'Formulaire IF-PAC — Membre de l’équipe', 'استمارة IF-PAC — عضو الفريق'),
    description: L('Questionnaire for team members: training history, job description, leadership self-assessment, light SWOT, objectives, soft skills, projects and ambitions.', 'Questionnaire pour les membres des équipes : formations suivies, fiche de poste, auto-évaluation leadership, SWOT light, objectifs, soft skills, projets et ambitions.', 'استبيان لأعضاء الفرق: التكوينات المتبعة، بطاقة المنصب، التقييم الذاتي للقيادة، SWOT مبسط، الأهداف، المهارات الشخصية، المشاريع والطموحات.'),
    sections: [identity(), trainingHistory, previousPlan, jobSheet, leadershipSelf, swotLight, objectives(true), softSkills(false), projects, ambitions(true)] },
];
