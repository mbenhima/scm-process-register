// IMS document template library: the documented information an integrated management
// system needs (ISO 9001:2015, ISO 14001:2015, ISO 45001:2018), with the sections of each
// document and the project data that populates them. Tenants can copy, edit or add templates.
//
// mandatory: { 'ISO 9001': 'maintain' | 'retain' } — "maintain" = documented information to
// maintain (a document), "retain" = documented information to retain (a record).
// Section types: text (boilerplate with placeholders), data (table or list filled from the
// project), step (value typed in a workflow step), signature (approval block).
// Placeholders: {org} {product} {line} {city} {customer} {supplier} {standards} {date} {owner} {project}
const L = (en, fr, ar) => ({ en, fr, ar });
const text = (key, title, body) => ({ key, type: 'text', title, text: body });
const data = (key, title, source, intro) => ({ key, type: 'data', title, source, ...(intro ? { text: intro } : {}) });
const approval = { key: 'approval', type: 'signature', title: L('Approval', 'Approbation', 'الاعتماد') };
const purpose = (p) => text('purpose', L('Purpose and scope', 'Objet et domaine d\'application', 'الغرض والنطاق'), p);
const history = data('history', L('Revision history', 'Historique des révisions', 'سجل المراجعات'), 'revisions');

export const TEMPLATE_CATEGORIES = [
  { id: 'policy', name: L('Policies and scope', 'Politiques et périmètre', 'السياسات والنطاق') },
  { id: 'context', name: L('Context and planning', 'Contexte et planification', 'السياق والتخطيط') },
  { id: 'process', name: L('Processes and procedures', 'Processus et procédures', 'العمليات والإجراءات') },
  { id: 'support', name: L('Support', 'Support', 'الدعم') },
  { id: 'operation', name: L('Operation', 'Réalisation', 'التشغيل') },
  { id: 'hse', name: L('Health, safety and environment', 'Santé, sécurité et environnement', 'الصحة والسلامة والبيئة') },
  { id: 'performance', name: L('Performance evaluation', 'Évaluation des performances', 'تقييم الأداء') },
  { id: 'improvement', name: L('Improvement', 'Amélioration', 'التحسين') },
];

export const DOC_TEMPLATES = [
  // ---------------------------------------------------------------- Policies and scope
  {
    code: 'TPL-POL-Q', category: 'policy', docType: 'Policy', formats: ['DOCX', 'PDF'], toc: false, ms: ['QMS'], mp: 'MP-002', review: 'Annual', owner: 'top_management',
    name: L('Quality policy', 'Politique qualité', 'سياسة الجودة'),
    description: L('One-page statement signed by top management (ISO 9001 §5.2). No table of contents.', 'Déclaration d\'une page signée par la direction (ISO 9001 §5.2). Sans sommaire.', 'بيان من صفحة واحدة توقعه الإدارة العليا (ISO 9001 §5.2). بدون جدول محتويات.'),
    mandatory: { 'ISO 9001': 'maintain' }, clauses: { 'ISO 9001': '5.2' },
    sections: [
      data('statement', L('Our commitment', 'Notre engagement', 'التزامنا'), 'policy_statement'),
      data('commitments', L('Commitments', 'Engagements', 'الالتزامات'), 'policy_commitments'),
      text('framework', L('Framework for objectives', 'Cadre des objectifs', 'إطار الأهداف'), L('This policy provides the framework for setting and reviewing our quality objectives. It is communicated to all staff, available to interested parties and reviewed every year at the management review.', 'Cette politique fournit le cadre pour établir et revoir nos objectifs qualité. Elle est communiquée à tout le personnel, disponible pour les parties intéressées et revue chaque année en revue de direction.', 'توفر هذه السياسة الإطار لوضع أهداف الجودة ومراجعتها. ويتم إبلاغها لجميع العاملين وإتاحتها للأطراف المعنية ومراجعتها سنويًا خلال مراجعة الإدارة.')),
      approval,
    ],
  },
  {
    code: 'TPL-POL-IMS', category: 'policy', docType: 'Policy', formats: ['DOCX', 'PDF'], toc: false, ms: ['QHSE'], mp: 'MP-002', review: 'Annual', owner: 'top_management',
    name: L('Integrated QHSE policy', 'Politique QHSE intégrée', 'سياسة الجودة والصحة والسلامة والبيئة المتكاملة'),
    description: L('Single policy covering ISO 9001 §5.2, ISO 14001 §5.2 and ISO 45001 §5.2. No table of contents.', 'Politique unique couvrant ISO 9001 §5.2, ISO 14001 §5.2 et ISO 45001 §5.2. Sans sommaire.', 'سياسة واحدة تغطي ISO 9001 §5.2 وISO 14001 §5.2 وISO 45001 §5.2. بدون جدول محتويات.'),
    mandatory: { 'ISO 9001': 'maintain', 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '5.2', 'ISO 14001': '5.2', 'ISO 45001': '5.2' },
    sections: [
      data('statement', L('Our commitment', 'Notre engagement', 'التزامنا'), 'policy_statement'),
      data('commitments', L('Commitments', 'Engagements', 'الالتزامات'), 'policy_commitments'),
      text('workers', L('Consultation and participation of workers', 'Consultation et participation des travailleurs', 'استشارة العاملين ومشاركتهم'), L('Workers and their representatives are consulted on hazards, risks and the measures taken, and take part in incident investigations.', 'Les travailleurs et leurs représentants sont consultés sur les dangers, les risques et les mesures prises, et participent aux enquêtes sur les incidents.', 'تتم استشارة العاملين وممثليهم بشأن المخاطر والتدابير المتخذة، ويشاركون في التحقيق في الحوادث.')),
      approval,
    ],
  },
  {
    code: 'TPL-POL-E', category: 'policy', docType: 'Policy', formats: ['DOCX', 'PDF'], toc: false, ms: ['QHSE'], mp: 'MP-002', review: 'Annual', owner: 'top_management',
    name: L('Environmental policy', 'Politique environnementale', 'السياسة البيئية'),
    description: L('Stand-alone environmental policy (ISO 14001 §5.2) when no integrated policy is used.', 'Politique environnementale autonome (ISO 14001 §5.2) en l\'absence de politique intégrée.', 'سياسة بيئية مستقلة (ISO 14001 §5.2) عند عدم استخدام سياسة متكاملة.'),
    mandatory: { 'ISO 14001': 'maintain' }, clauses: { 'ISO 14001': '5.2' }, alternativeTo: 'TPL-POL-IMS',
    sections: [data('statement', L('Our commitment', 'Notre engagement', 'التزامنا'), 'policy_statement_env'), approval],
  },
  {
    code: 'TPL-POL-OHS', category: 'policy', docType: 'Policy', formats: ['DOCX', 'PDF'], toc: false, ms: ['QHSE'], mp: 'MP-002', review: 'Annual', owner: 'top_management',
    name: L('Occupational health and safety policy', 'Politique santé et sécurité au travail', 'سياسة الصحة والسلامة المهنية'),
    description: L('Stand-alone OH&S policy (ISO 45001 §5.2) when no integrated policy is used.', 'Politique SST autonome (ISO 45001 §5.2) en l\'absence de politique intégrée.', 'سياسة صحة وسلامة مهنية مستقلة (ISO 45001 §5.2) عند عدم استخدام سياسة متكاملة.'),
    mandatory: { 'ISO 45001': 'maintain' }, clauses: { 'ISO 45001': '5.2' }, alternativeTo: 'TPL-POL-IMS',
    sections: [data('statement', L('Our commitment', 'Notre engagement', 'التزامنا'), 'policy_statement_ohs'), approval],
  },
  {
    code: 'TPL-SCOPE', category: 'policy', docType: 'Scope', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-001', review: 'Annual', owner: 'ims_manager',
    name: L('Scope of the management system', 'Périmètre du système de management', 'نطاق نظام الإدارة'),
    description: L('Boundaries, sites, products and services covered, and justification of non-applicable requirements (§4.3).', 'Limites, sites, produits et services couverts et justification des exigences non applicables (§4.3).', 'الحدود والمواقع والمنتجات والخدمات المشمولة وتبرير المتطلبات غير المنطبقة (§4.3).'),
    mandatory: { 'ISO 9001': 'maintain', 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '4.3', 'ISO 14001': '4.3', 'ISO 45001': '4.3' },
    sections: [
      data('statement', L('Scope statement', 'Énoncé du périmètre', 'بيان النطاق'), 'scope'),
      data('sites', L('Sites and organization units', 'Sites et unités de l\'organisation', 'المواقع ووحدات المؤسسة'), 'obs_units'),
      data('standards', L('Standards applied', 'Normes appliquées', 'المعايير المطبقة'), 'standards'),
      data('processes', L('Processes in scope', 'Processus inclus', 'العمليات المشمولة'), 'processes'),
      history, approval,
    ],
  },
  {
    code: 'TPL-MAN', category: 'policy', docType: 'Manual', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-036', review: 'Annual', owner: 'ims_manager',
    name: L('Management system manual', 'Manuel du système de management', 'دليل نظام الإدارة'),
    description: L('Overview of the management system: context, leadership, processes, documented information map. Recommended, not required.', 'Vue d\'ensemble du système : contexte, leadership, processus, cartographie documentaire. Recommandé, non exigé.', 'نظرة شاملة على النظام: السياق والقيادة والعمليات وخريطة المعلومات الموثقة. موصى به وغير إلزامي.'),
    mandatory: {}, clauses: { 'ISO 9001': '4–10' },
    sections: [
      text('intro', L('Presentation of the organization', 'Présentation de l\'organisme', 'تقديم المؤسسة'), L('{org} provides {product} from {city}. This manual describes how the management system is organized to meet {standards}.', '{org} fournit des {product} depuis {city}. Ce manuel décrit l\'organisation du système de management pour satisfaire {standards}.', 'تقدم {org} {product} من {city}. يصف هذا الدليل تنظيم نظام الإدارة لتلبية {standards}.')),
      data('context', L('Context of the organization', 'Contexte de l\'organisme', 'سياق المؤسسة'), 'context_issues'),
      data('parties', L('Interested parties', 'Parties intéressées', 'الأطراف المعنية'), 'parties'),
      data('scope', L('Scope', 'Périmètre', 'النطاق'), 'scope'),
      data('policy', L('Policy', 'Politique', 'السياسة'), 'policy_statement'),
      data('processes', L('Process map', 'Cartographie des processus', 'خريطة العمليات'), 'processes'),
      data('racsi', L('Roles and responsibilities (RACSI)', 'Rôles et responsabilités (RACSI)', 'الأدوار والمسؤوليات (RACSI)'), 'racsi'),
      data('documents', L('Documented information', 'Informations documentées', 'المعلومات الموثقة'), 'documents'),
      history, approval,
    ],
  },
  // ---------------------------------------------------------------- Context and planning
  {
    code: 'TPL-CTX', category: 'context', docType: 'Report', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-001', review: 'Annual', owner: 'ims_manager',
    name: L('Context and interested parties analysis', 'Analyse du contexte et des parties intéressées', 'تحليل السياق والأطراف المعنية'),
    description: L('External and internal issues (PESTLE, SWOT), interested parties and their requirements (§4.1, §4.2).', 'Enjeux externes et internes (PESTEL, SWOT), parties intéressées et leurs exigences (§4.1, §4.2).', 'القضايا الخارجية والداخلية (PESTLE وSWOT) والأطراف المعنية ومتطلباتها (§4.1، §4.2).'),
    mandatory: {}, clauses: { 'ISO 9001': '4.1, 4.2', 'ISO 14001': '4.1, 4.2', 'ISO 45001': '4.1, 4.2' },
    sections: [
      purpose(L('This report records the issues that affect the ability of {org} to achieve the intended results of its management system, and the needs and expectations of relevant interested parties.', 'Ce rapport consigne les enjeux qui influent sur la capacité de {org} à atteindre les résultats attendus de son système de management, ainsi que les besoins et attentes des parties intéressées pertinentes.', 'يسجل هذا التقرير القضايا التي تؤثر في قدرة {org} على تحقيق النتائج المرجوة من نظام إدارتها، واحتياجات الأطراف المعنية ذات الصلة وتوقعاتها.')),
      data('external', L('External issues', 'Enjeux externes', 'القضايا الخارجية'), 'context_external'),
      data('internal', L('Internal issues', 'Enjeux internes', 'القضايا الداخلية'), 'context_internal'),
      data('parties', L('Interested parties and requirements', 'Parties intéressées et exigences', 'الأطراف المعنية ومتطلباتها'), 'parties'),
      data('assessment', L('Assessment of needs and expectations', 'Évaluation des besoins et attentes', 'تقييم الاحتياجات والتوقعات'), 'step_matrix:MP-001.5'),
      data('interactions', L('Process interactions', 'Interactions entre processus', 'التفاعلات بين العمليات'), 'step_rows:MP-001.7'),
      data('review', L('Review of the analysis', 'Revue de l\'analyse', 'مراجعة التحليل'), 'step_review:MP-001.10'),
      history, approval,
    ],
  },
  {
    code: 'TPL-REG-IP', category: 'context', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-001', review: 'Semi-annual', owner: 'ims_manager',
    name: L('Interested parties register', 'Registre des parties intéressées', 'سجل الأطراف المعنية'),
    description: L('Interested parties, needs and expectations, influence, interest and the requirements adopted as compliance obligations.', 'Parties intéressées, besoins et attentes, influence, intérêt et exigences retenues comme obligations de conformité.', 'الأطراف المعنية واحتياجاتها وتوقعاتها ونفوذها واهتمامها والمتطلبات المعتمدة كالتزامات امتثال.'),
    mandatory: {}, clauses: { 'ISO 9001': '4.2', 'ISO 14001': '4.2', 'ISO 45001': '4.2' },
    sections: [data('parties', L('Interested parties', 'Parties intéressées', 'الأطراف المعنية'), 'parties')],
  },
  {
    code: 'TPL-REG-RISK', category: 'context', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-012', review: 'Semi-annual', owner: 'risk_manager',
    name: L('Risks and opportunities register', 'Registre des risques et opportunités', 'سجل المخاطر والفرص'),
    description: L('Risks and opportunities to address, scoring, owners, treatment and residual risk (§6.1).', 'Risques et opportunités à traiter, cotation, responsables, traitement et risque résiduel (§6.1).', 'المخاطر والفرص الواجب معالجتها والتقييم والمسؤولون والمعالجة والمخاطر المتبقية (§6.1).'),
    mandatory: { 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '6.1', 'ISO 14001': '6.1.1', 'ISO 45001': '6.1.1' },
    sections: [data('risks', L('Risks', 'Risques', 'المخاطر'), 'risks'), data('opportunities', L('Opportunities', 'Opportunités', 'الفرص'), 'opportunities'), data('method', L('Scoring method', 'Méthode de cotation', 'طريقة التقييم'), 'risk_scale')],
  },
  {
    code: 'TPL-OBJ', category: 'context', docType: 'Plan', formats: ['XLSX', 'PDF', 'DOCX'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-003', review: 'Quarterly', owner: 'ims_manager',
    name: L('Objectives and action plan', 'Objectifs et plan d\'actions', 'الأهداف وخطة العمل'),
    description: L('SMART objectives, KPI, target, owner, deadline, resources and how results are evaluated (§6.2).', 'Objectifs SMART, KPI, cible, responsable, échéance, ressources et évaluation des résultats (§6.2).', 'الأهداف الذكية والمؤشر والمستهدف والمسؤول والموعد والموارد وطريقة تقييم النتائج (§6.2).'),
    mandatory: { 'ISO 9001': 'maintain', 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '6.2', 'ISO 14001': '6.2', 'ISO 45001': '6.2' },
    sections: [data('objectives', L('Objectives', 'Objectifs', 'الأهداف'), 'objectives'), data('actions', L('Actions to achieve the objectives', 'Actions pour atteindre les objectifs', 'الإجراءات لتحقيق الأهداف'), 'actions_objectives')],
  },
  {
    code: 'TPL-LEGAL', category: 'context', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-028', review: 'Semi-annual', owner: 'compliance_officer',
    name: L('Compliance obligations register', 'Registre des obligations de conformité', 'سجل التزامات الامتثال'),
    description: L('Legal and other requirements, applicability, evaluation of compliance (ISO 14001 §6.1.3, §9.1.2; ISO 45001 §6.1.3, §9.1.2).', 'Exigences légales et autres, applicabilité, évaluation de la conformité (ISO 14001 §6.1.3, §9.1.2 ; ISO 45001 §6.1.3, §9.1.2).', 'المتطلبات القانونية وغيرها وقابلية التطبيق وتقييم الامتثال (ISO 14001 §6.1.3، §9.1.2؛ ISO 45001 §6.1.3، §9.1.2).'),
    mandatory: { 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '4.2', 'ISO 14001': '6.1.3', 'ISO 45001': '6.1.3' },
    sections: [data('obligations', L('Obligations', 'Obligations', 'الالتزامات'), 'obligations')],
  },
  // ---------------------------------------------------------------- Processes and procedures
  {
    code: 'TPL-PMAP', category: 'process', docType: 'Map', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-004', review: 'Annual', owner: 'process_excellence_manager',
    name: L('Process map and interactions', 'Cartographie des processus et interactions', 'خريطة العمليات وتفاعلاتها'),
    description: L('Management, core and support processes, owners, inputs, outputs and interactions (§4.4).', 'Processus de management, de réalisation et de support, pilotes, entrées, sorties et interactions (§4.4).', 'العمليات الإدارية والأساسية والداعمة ومالكوها ومدخلاتها ومخرجاتها وتفاعلاتها (§4.4).'),
    mandatory: { 'ISO 9001': 'maintain' }, clauses: { 'ISO 9001': '4.4.2' },
    sections: [data('processes', L('Processes', 'Processus', 'العمليات'), 'processes'), data('interactions', L('Interactions', 'Interactions', 'التفاعلات'), 'step_rows:MP-001.7'), data('racsi', L('Process owners (RACSI)', 'Pilotes de processus (RACSI)', 'مالكو العمليات (RACSI)'), 'racsi'), history, approval],
  },
  {
    code: 'TPL-PSHEET', category: 'process', docType: 'Sheet', formats: ['DOCX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-004', review: 'Semi-annual', owner: 'process_excellence_manager', perMp: true,
    name: L('Macro process sheet', 'Fiche macro-processus', 'بطاقة العملية الكلية'),
    description: L('One sheet per macro process: goal, SIPOC, tasks and steps, RACSI, KPIs, risks and documents.', 'Une fiche par macro-processus : finalité, SIPOC, tâches et étapes, RACSI, KPI, risques et documents.', 'بطاقة لكل عملية كلية: الغاية وSIPOC والمهام والخطوات وRACSI والمؤشرات والمخاطر والوثائق.'),
    mandatory: {}, clauses: { 'ISO 9001': '4.4' },
    sections: [data('goal', L('Goal', 'Finalité', 'الغاية'), 'mp_goal'), data('sipoc', L('SIPOC', 'SIPOC', 'SIPOC'), 'mp_sipoc'), data('steps', L('Tasks and steps', 'Tâches et étapes', 'المهام والخطوات'), 'mp_steps'), data('racsi', L('RACSI', 'RACSI', 'RACSI'), 'mp_racsi'), data('kpis', L('KPIs', 'KPI', 'المؤشرات'), 'mp_kpis'), history],
  },
  {
    code: 'TPL-PROC', category: 'process', docType: 'Procedure', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-006', review: 'Annual', owner: 'process_excellence_manager', perPhase: true,
    name: L('Procedure', 'Procédure', 'إجراء'),
    description: L('Purpose, scope, definitions, responsibilities, steps, records and KPIs of a process.', 'Objet, domaine, définitions, responsabilités, déroulement, enregistrements et KPI d\'un processus.', 'الغرض والنطاق والتعاريف والمسؤوليات والخطوات والسجلات والمؤشرات لعملية ما.'),
    mandatory: {}, clauses: { 'ISO 9001': '4.4.2, 8.1' },
    sections: [
      purpose(L('This procedure describes how {phase} is carried out at {org}.', 'Cette procédure décrit le déroulement de {phase} chez {org}.', 'يصف هذا الإجراء كيفية تنفيذ {phase} لدى {org}.')),
      data('responsibilities', L('Responsibilities', 'Responsabilités', 'المسؤوليات'), 'phase_racsi'),
      data('steps', L('Steps', 'Déroulement', 'الخطوات'), 'phase_steps'),
      data('records', L('Records', 'Enregistrements', 'السجلات'), 'phase_outputs'),
      data('kpis', L('Indicators', 'Indicateurs', 'المؤشرات'), 'phase_kpis'),
      history, approval,
    ],
  },
  {
    code: 'TPL-WI', category: 'process', docType: 'Instruction', formats: ['DOCX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-006', review: 'Annual', owner: 'operations_manager',
    name: L('Work instruction', 'Instruction de travail', 'تعليمات العمل'),
    description: L('Step-by-step instruction for one activity, with safety points and the record to fill.', 'Instruction pas à pas pour une activité, avec points de sécurité et enregistrement à remplir.', 'تعليمات خطوة بخطوة لنشاط واحد مع نقاط السلامة والسجل الواجب تعبئته.'),
    mandatory: {}, clauses: { 'ISO 9001': '7.5, 8.5.1' },
    sections: [
      purpose(L('Carry out {line} activities right first time.', 'Réaliser les activités de {line} bien du premier coup.', 'تنفيذ أنشطة {line} بشكل صحيح من المرة الأولى.')),
      text('steps', L('Instructions', 'Instructions', 'التعليمات'), L('1. Check the job order and the validated quote.\n2. Prepare tools and parts; check calibration labels.\n3. Carry out the work following the manufacturer instructions.\n4. Test the result with the customer.\n5. Have the job sheet signed and photograph it in the application.', '1. Vérifier l\'ordre de travail et le devis validé.\n2. Préparer outils et pièces ; vérifier les étiquettes d\'étalonnage.\n3. Réaliser l\'intervention selon les instructions du fabricant.\n4. Tester le résultat avec le client.\n5. Faire signer la fiche d\'intervention et la photographier dans l\'application.', '1. التحقق من أمر العمل وعرض السعر المعتمد.\n2. تجهيز الأدوات والقطع والتحقق من ملصقات المعايرة.\n3. تنفيذ العمل وفق تعليمات الصانع.\n4. اختبار النتيجة مع العميل.\n5. توقيع بطاقة العمل وتصويرها في التطبيق.')),
      text('safety', L('Safety points', 'Points de sécurité', 'نقاط السلامة'), L('Wear the required PPE; isolate energy sources before intervention; report any near miss.', 'Porter les EPI requis ; consigner les énergies avant intervention ; déclarer tout presque-accident.', 'ارتداء معدات الوقاية المطلوبة وعزل مصادر الطاقة قبل التدخل والإبلاغ عن أي حادث وشيك.')),
      history,
    ],
  },
  {
    code: 'TPL-RACSI', category: 'process', docType: 'Matrix', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-004', review: 'Annual', owner: 'process_excellence_manager',
    name: L('RACSI matrix', 'Matrice RACSI', 'مصفوفة RACSI'),
    description: L('Responsible, Accountable, Consulted, Support and Informed roles for every macro process (§5.3).', 'Rôles Réalise, Approuve, Consulté, Support et Informé pour chaque macro-processus (§5.3).', 'أدوار المنفذ والمساءل والمستشار والداعم والمُبلَّغ لكل عملية كلية (§5.3).'),
    mandatory: {}, clauses: { 'ISO 9001': '5.3', 'ISO 14001': '5.3', 'ISO 45001': '5.3' },
    sections: [data('racsi', L('RACSI', 'RACSI', 'RACSI'), 'racsi')],
  },
  // ---------------------------------------------------------------- Support
  {
    code: 'TPL-COMP', category: 'support', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-013', review: 'Semi-annual', owner: 'hr_manager',
    name: L('Competence matrix and training records', 'Matrice des compétences et enregistrements de formation', 'مصفوفة الكفاءات وسجلات التدريب'),
    description: L('Required and actual competence per role, training done and effectiveness (§7.2).', 'Compétences requises et réelles par rôle, formations suivies et efficacité (§7.2).', 'الكفاءات المطلوبة والفعلية لكل دور والتدريب المنجز وفعاليته (§7.2).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '7.2', 'ISO 14001': '7.2', 'ISO 45001': '7.2' },
    sections: [data('competence', L('Competence matrix', 'Matrice des compétences', 'مصفوفة الكفاءات'), 'competence'), data('training', L('Training records', 'Enregistrements de formation', 'سجلات التدريب'), 'training')],
  },
  {
    code: 'TPL-CAL', category: 'support', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-025', review: 'Semi-annual', owner: 'quality_manager',
    name: L('Monitoring and measuring equipment register', 'Registre des équipements de surveillance et de mesure', 'سجل معدات المراقبة والقياس'),
    description: L('Equipment, calibration status, last and next calibration (ISO 9001 §7.1.5).', 'Équipements, état d\'étalonnage, dernier et prochain étalonnage (ISO 9001 §7.1.5).', 'المعدات وحالة المعايرة وآخر معايرة والمعايرة التالية (ISO 9001 §7.1.5).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '7.1.5', 'ISO 14001': '9.1.1', 'ISO 45001': '9.1.1' },
    sections: [data('equipment', L('Equipment', 'Équipements', 'المعدات'), 'calibration')],
  },
  {
    code: 'TPL-COMM', category: 'support', docType: 'Plan', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-014', review: 'Annual', owner: 'ims_manager',
    name: L('Communication plan and records', 'Plan et enregistrements de communication', 'خطة التواصل وسجلاته'),
    description: L('What, when, with whom, how and who communicates (§7.4), with the records of each communication.', 'Quoi, quand, avec qui, comment et qui communique (§7.4), avec les enregistrements de chaque communication.', 'ماذا ومتى ومع من وكيف ومن يتواصل (§7.4) مع سجلات كل تواصل.'),
    mandatory: { 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '7.4', 'ISO 14001': '7.4', 'ISO 45001': '7.4' },
    sections: [data('messages', L('Communications', 'Communications', 'الاتصالات'), 'communications')],
  },
  {
    code: 'TPL-DOCLIST', category: 'support', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-029', review: 'Quarterly', owner: 'document_controller',
    name: L('Master list of documented information', 'Liste maîtresse des informations documentées', 'القائمة الرئيسية للمعلومات الموثقة'),
    description: L('Every controlled document and record with version, status, owner and next review (§7.5).', 'Chaque document et enregistrement maîtrisé avec version, statut, responsable et prochaine revue (§7.5).', 'كل وثيقة وسجل خاضع للضبط مع الإصدار والحالة والمسؤول والمراجعة التالية (§7.5).'),
    mandatory: {}, clauses: { 'ISO 9001': '7.5.3', 'ISO 14001': '7.5.3', 'ISO 45001': '7.5.3' },
    sections: [data('documents', L('Documents', 'Documents', 'الوثائق'), 'documents'), data('mandatory', L('Mandatory documented information', 'Informations documentées obligatoires', 'المعلومات الموثقة الإلزامية'), 'mandatory_matrix')],
  },
  // ---------------------------------------------------------------- Operation
  {
    code: 'TPL-SUP', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-024', review: 'Semi-annual', owner: 'quality_manager',
    name: L('Supplier evaluation register', 'Registre d\'évaluation des fournisseurs', 'سجل تقييم الموردين'),
    description: L('Criteria and results of evaluation, selection, monitoring and re-evaluation of external providers (ISO 9001 §8.4.1).', 'Critères et résultats de l\'évaluation, sélection, surveillance et réévaluation des prestataires externes (ISO 9001 §8.4.1).', 'معايير ونتائج تقييم مقدمي الخدمات الخارجيين واختيارهم ومراقبتهم وإعادة تقييمهم (ISO 9001 §8.4.1).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '8.4.1', 'ISO 45001': '8.1.4' },
    sections: [data('suppliers', L('Suppliers', 'Fournisseurs', 'الموردون'), 'suppliers')],
  },
  {
    code: 'TPL-CTRL', category: 'operation', docType: 'Plan', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-007', review: 'Semi-annual', owner: 'operations_manager',
    name: L('Control plan', 'Plan de surveillance', 'خطة الضبط'),
    description: L('Characteristics, methods, frequency, reaction plan and records of operational control (ISO 9001 §8.5.1).', 'Caractéristiques, méthodes, fréquence, plan de réaction et enregistrements de la maîtrise opérationnelle (ISO 9001 §8.5.1).', 'الخصائص والطرق والتكرار وخطة الاستجابة وسجلات الضبط التشغيلي (ISO 9001 §8.5.1).'),
    mandatory: { 'ISO 9001': 'maintain' }, clauses: { 'ISO 9001': '8.1, 8.5.1' },
    sections: [data('controls', L('Controls', 'Contrôles', 'الضوابط'), 'controls'), data('rules', L('Business rules', 'Règles métier', 'قواعد العمل'), 'rules')],
  },
  {
    code: 'TPL-NCO', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-018', review: 'Monthly', owner: 'quality_manager',
    name: L('Nonconforming outputs register', 'Registre des éléments de sortie non conformes', 'سجل المخرجات غير المطابقة'),
    description: L('Description of the nonconformity, actions taken, concessions and authority deciding (ISO 9001 §8.7.2).', 'Description de la non-conformité, actions menées, dérogations et autorité décidant (ISO 9001 §8.7.2).', 'وصف عدم المطابقة والإجراءات المتخذة والتنازلات والجهة المقررة (ISO 9001 §8.7.2).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '8.7.2' },
    sections: [data('ncs', L('Nonconforming outputs', 'Éléments non conformes', 'المخرجات غير المطابقة'), 'ncs')],
  },
  {
    code: 'TPL-REQ', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-001', review: 'Per event', owner: 'operations_manager',
    name: L('Customer requirements review record', 'Enregistrement de revue des exigences clients', 'سجل مراجعة متطلبات العملاء'),
    description: L('Review of the requirements before committing to supply (quotes, orders, contract changes) and new requirements (ISO 9001 §8.2.3.2).', 'Revue des exigences avant l\'engagement à fournir (devis, commandes, avenants) et nouvelles exigences (ISO 9001 §8.2.3.2).', 'مراجعة المتطلبات قبل الالتزام بالتوريد (العروض والطلبات وتعديلات العقود) والمتطلبات الجديدة (ISO 9001 §8.2.3.2).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '8.2.3.2' },
    sections: [
      purpose(L('Record, for each quote or order of {product}, that the requirements are defined, feasible and accepted before {org} commits to supply.', 'Consigner, pour chaque devis ou commande de {product}, que les exigences sont définies, réalisables et acceptées avant que {org} s\'engage à fournir.', 'تسجيل أن المتطلبات محددة وقابلة للتنفيذ ومقبولة لكل عرض أو طلب لـ {product} قبل التزام {org} بالتوريد.')),
      data('requirements', L('Customer and other requirements', 'Exigences clients et autres', 'متطلبات العملاء وغيرها'), 'parties'),
      data('changes', L('Changes to requirements', 'Modifications des exigences', 'تغييرات المتطلبات'), 'changes'),
      approval,
    ],
  },
  {
    code: 'TPL-RELEASE', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-007', review: 'Monthly', owner: 'operations_manager',
    name: L('Release of products and services record', 'Enregistrement de libération des produits et services', 'سجل الإفراج عن المنتجات والخدمات'),
    description: L('Evidence of conformity with the acceptance criteria and traceability to the person authorizing the release (ISO 9001 §8.6).', 'Preuves de conformité aux critères d\'acceptation et traçabilité de la personne autorisant la libération (ISO 9001 §8.6).', 'أدلة المطابقة لمعايير القبول وتتبع الشخص المخول بالإفراج (ISO 9001 §8.6).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '8.6' },
    sections: [data('criteria', L('Acceptance criteria and controls', 'Critères d\'acceptation et contrôles', 'معايير القبول والضوابط'), 'controls'), data('results', L('Release indicators', 'Indicateurs de libération', 'مؤشرات الإفراج'), 'kpis'), approval],
  },
  {
    code: 'TPL-CHANGE', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-036', review: 'Per event', owner: 'ims_manager',
    name: L('Control of changes record', 'Enregistrement de maîtrise des modifications', 'سجل ضبط التغييرات'),
    description: L('Result of the review of changes, the person authorizing the change and the actions arising (ISO 9001 §6.3, §8.5.6).', 'Résultat de la revue des modifications, personne autorisant la modification et actions qui en découlent (ISO 9001 §6.3, §8.5.6).', 'نتيجة مراجعة التغييرات والشخص المخول بالتغيير والإجراءات الناتجة (ISO 9001 §6.3، §8.5.6).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '8.5.6', 'ISO 14001': '8.1', 'ISO 45001': '8.1.3' },
    sections: [data('changes', L('Changes', 'Modifications', 'التغييرات'), 'changes'), data('actions', L('Actions arising', 'Actions qui en découlent', 'الإجراءات الناتجة'), 'actions_review')],
  },
  // ---------------------------------------------------------------- HSE
  {
    code: 'TPL-ASPECTS', category: 'hse', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QHSE'], mp: 'MP-012', review: 'Semi-annual', owner: 'hse_manager',
    name: L('Environmental aspects and impacts register', 'Registre des aspects et impacts environnementaux', 'سجل الجوانب والآثار البيئية'),
    description: L('Aspects, impacts, significance criteria and controls (ISO 14001 §6.1.2).', 'Aspects, impacts, critères de significativité et maîtrises (ISO 14001 §6.1.2).', 'الجوانب والآثار ومعايير الأهمية والضوابط (ISO 14001 §6.1.2).'),
    mandatory: { 'ISO 14001': 'maintain' }, clauses: { 'ISO 14001': '6.1.2' },
    sections: [data('aspects', L('Aspects', 'Aspects', 'الجوانب'), 'aspects')],
  },
  {
    code: 'TPL-HIRA', category: 'hse', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QHSE'], mp: 'MP-012', review: 'Semi-annual', owner: 'hse_manager',
    name: L('Hazard identification and risk assessment (HIRA)', 'Identification des dangers et évaluation des risques (DUER)', 'تحديد المخاطر وتقييمها'),
    description: L('Hazards, exposed people, risk rating, hierarchy of controls and residual risk (ISO 45001 §6.1.2).', 'Dangers, personnes exposées, cotation, hiérarchie des mesures et risque résiduel (ISO 45001 §6.1.2).', 'المخاطر والأشخاص المعرضون والتقييم وتسلسل الضوابط والمخاطر المتبقية (ISO 45001 §6.1.2).'),
    mandatory: { 'ISO 45001': 'maintain' }, clauses: { 'ISO 45001': '6.1.2' },
    sections: [data('hazards', L('Hazards', 'Dangers', 'المخاطر'), 'hazards'), data('method', L('Rating method', 'Méthode de cotation', 'طريقة التقييم'), 'risk_scale')],
  },
  {
    code: 'TPL-EPR', category: 'hse', docType: 'Plan', formats: ['DOCX', 'PDF'], toc: true, ms: ['QHSE'], mp: 'MP-052', review: 'Annual', owner: 'hse_manager',
    name: L('Emergency preparedness and response plan', 'Plan de préparation et de réponse aux situations d\'urgence', 'خطة التأهب والاستجابة للطوارئ'),
    description: L('Emergency scenarios, response, roles, contacts and drills (ISO 14001 §8.2, ISO 45001 §8.2).', 'Scénarios d\'urgence, réponse, rôles, contacts et exercices (ISO 14001 §8.2, ISO 45001 §8.2).', 'سيناريوهات الطوارئ والاستجابة والأدوار وجهات الاتصال والتمارين (ISO 14001 §8.2، ISO 45001 §8.2).'),
    mandatory: { 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 14001': '8.2', 'ISO 45001': '8.2' },
    sections: [
      purpose(L('Prepare {org} to respond to emergency situations at {city} and limit their consequences for people and the environment.', 'Préparer {org} à répondre aux situations d\'urgence à {city} et à en limiter les conséquences pour les personnes et l\'environnement.', 'إعداد {org} للاستجابة لحالات الطوارئ في {city} والحد من عواقبها على الأشخاص والبيئة.')),
      text('scenarios', L('Emergency scenarios and response', 'Scénarios d\'urgence et réponse', 'سيناريوهات الطوارئ والاستجابة'), L('Fire: raise the alarm, evacuate to the assembly point, call 15/150.\nInjury: give first aid, call the rescue services, report the incident.\nSpill: contain with the spill kit, protect drains, inform the HSE Manager.\nRoad accident: secure the area, call 19, inform the office.', 'Incendie : donner l\'alerte, évacuer vers le point de rassemblement, appeler le 15/150.\nBlessure : porter les premiers secours, appeler les secours, déclarer l\'incident.\nDéversement : contenir avec le kit antipollution, protéger les regards, informer le responsable HSE.\nAccident de la route : sécuriser la zone, appeler le 19, prévenir le bureau.', 'الحريق: إطلاق الإنذار والإخلاء إلى نقطة التجمع والاتصال بـ 15/150.\nالإصابة: تقديم الإسعافات الأولية والاتصال بالإنقاذ والإبلاغ عن الحادث.\nالانسكاب: الاحتواء بعدة الانسكاب وحماية المصارف وإبلاغ مدير الصحة والسلامة.\nحادث الطريق: تأمين المكان والاتصال بـ 19 وإبلاغ المكتب.')),
      data('drills', L('Drills and incidents', 'Exercices et incidents', 'التمارين والحوادث'), 'incidents'),
      history, approval,
    ],
  },
  {
    code: 'TPL-INC', category: 'hse', docType: 'Report', formats: ['DOCX', 'PDF'], toc: false, ms: ['QHSE'], mp: 'MP-051', review: 'Per event', owner: 'hse_manager',
    name: L('Incident investigation report', 'Rapport d\'enquête sur incident', 'تقرير التحقيق في الحادث'),
    description: L('Facts, root causes, corrective actions and lessons learned of incidents (ISO 45001 §10.2).', 'Faits, causes racines, actions correctives et enseignements des incidents (ISO 45001 §10.2).', 'الوقائع والأسباب الجذرية والإجراءات التصحيحية والدروس المستفادة من الحوادث (ISO 45001 §10.2).'),
    mandatory: { 'ISO 45001': 'retain' }, clauses: { 'ISO 45001': '10.2' },
    sections: [data('incidents', L('Incidents', 'Incidents', 'الحوادث'), 'incidents'), data('actions', L('Corrective actions', 'Actions correctives', 'الإجراءات التصحيحية'), 'actions_corrective')],
  },
  // ---------------------------------------------------------------- Performance evaluation
  {
    code: 'TPL-KPI', category: 'performance', docType: 'Report', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-009', review: 'Monthly', owner: 'performance_manager',
    name: L('KPI dashboard and measurement results', 'Tableau de bord KPI et résultats de mesure', 'لوحة المؤشرات ونتائج القياس'),
    description: L('Monitoring and measurement results, target, trend and analysis (§9.1.1).', 'Résultats de surveillance et de mesure, cible, tendance et analyse (§9.1.1).', 'نتائج المراقبة والقياس والمستهدف والاتجاه والتحليل (§9.1.1).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '9.1.1', 'ISO 14001': '9.1.1', 'ISO 45001': '9.1.1' },
    sections: [data('kpis', L('Indicators', 'Indicateurs', 'المؤشرات'), 'kpis'), data('values', L('Monthly values', 'Valeurs mensuelles', 'القيم الشهرية'), 'kpi_values')],
  },
  {
    code: 'TPL-AUDPRG', category: 'performance', docType: 'Plan', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-039', review: 'Annual', owner: 'audit_manager',
    name: L('Internal audit programme', 'Programme d\'audit interne', 'برنامج التدقيق الداخلي'),
    description: L('Planned audits with scope, criteria, auditors and dates (§9.2.2).', 'Audits planifiés avec périmètre, critères, auditeurs et dates (§9.2.2).', 'التدقيقات المخططة ونطاقها ومعاييرها ومدققوها وتواريخها (§9.2.2).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '9.2.2', 'ISO 14001': '9.2.2', 'ISO 45001': '9.2.2' },
    sections: [data('audits', L('Audit programme', 'Programme d\'audit', 'برنامج التدقيق'), 'audits')],
  },
  {
    code: 'TPL-AUDREP', category: 'performance', docType: 'Report', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-039', review: 'Per event', owner: 'audit_manager',
    name: L('Internal audit report', 'Rapport d\'audit interne', 'تقرير التدقيق الداخلي'),
    description: L('Audit scope, criteria, findings, strengths and conclusions (§9.2.2 f).', 'Périmètre, critères, constats, points forts et conclusions de l\'audit (§9.2.2 f).', 'نطاق التدقيق ومعاييره وملاحظاته ونقاط القوة والخلاصات (§9.2.2 و).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '9.2.2', 'ISO 14001': '9.2.2', 'ISO 45001': '9.2.2' },
    sections: [data('audits', L('Audits carried out', 'Audits réalisés', 'التدقيقات المنفذة'), 'audits_done'), data('findings', L('Findings', 'Constats', 'الملاحظات'), 'findings'), history, approval],
  },
  {
    code: 'TPL-MR', category: 'performance', docType: 'Report', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-034', review: 'Per event', owner: 'ims_manager',
    name: L('Management review minutes', 'Compte rendu de revue de direction', 'محضر مراجعة الإدارة'),
    description: L('Inputs (§9.3.2) and outputs (§9.3.3) of the management review: decisions, actions and resources.', 'Éléments d\'entrée (§9.3.2) et de sortie (§9.3.3) de la revue de direction : décisions, actions et ressources.', 'مدخلات مراجعة الإدارة (§9.3.2) ومخرجاتها (§9.3.3): القرارات والإجراءات والموارد.'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '9.3.3', 'ISO 14001': '9.3', 'ISO 45001': '9.3' },
    sections: [
      data('meetings', L('Reviews held', 'Revues tenues', 'المراجعات المنعقدة'), 'reviews'),
      data('kpis', L('Performance and effectiveness', 'Performance et efficacité', 'الأداء والفعالية'), 'kpis'),
      data('objectives', L('Objectives achievement', 'Atteinte des objectifs', 'تحقيق الأهداف'), 'objectives'),
      data('audits', L('Audit results', 'Résultats d\'audit', 'نتائج التدقيق'), 'findings'),
      data('ncs', L('Nonconformities and corrective actions', 'Non-conformités et actions correctives', 'حالات عدم المطابقة والإجراءات التصحيحية'), 'ncs'),
      data('risks', L('Risks and opportunities', 'Risques et opportunités', 'المخاطر والفرص'), 'risks_top'),
      data('decisions', L('Decisions and actions', 'Décisions et actions', 'القرارات والإجراءات'), 'actions_review'),
      approval,
    ],
  },
  // ---------------------------------------------------------------- Improvement
  {
    code: 'TPL-NC', category: 'improvement', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-021', review: 'Monthly', owner: 'quality_manager',
    name: L('Nonconformity and corrective action register', 'Registre des non-conformités et actions correctives', 'سجل حالات عدم المطابقة والإجراءات التصحيحية'),
    description: L('Nature of nonconformities, actions taken and results of corrective actions (§10.2.2).', 'Nature des non-conformités, actions menées et résultats des actions correctives (§10.2.2).', 'طبيعة حالات عدم المطابقة والإجراءات المتخذة ونتائج الإجراءات التصحيحية (§10.2.2).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '10.2.2', 'ISO 14001': '10.2.2', 'ISO 45001': '10.2.2' },
    sections: [data('ncs', L('Nonconformities', 'Non-conformités', 'حالات عدم المطابقة'), 'ncs'), data('actions', L('Corrective actions', 'Actions correctives', 'الإجراءات التصحيحية'), 'actions_corrective')],
  },
  {
    code: 'TPL-CAPA', category: 'improvement', docType: 'Report', formats: ['DOCX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-020', review: 'Per event', owner: 'quality_manager',
    name: L('Corrective action report (8D)', 'Rapport d\'action corrective (8D)', 'تقرير الإجراء التصحيحي (8D)'),
    description: L('Eight disciplines: team, problem, containment, root cause, corrective action, verification, prevention, closure.', 'Huit disciplines : équipe, problème, confinement, cause racine, action corrective, vérification, prévention, clôture.', 'التخصصات الثمانية: الفريق والمشكلة والاحتواء والسبب الجذري والإجراء التصحيحي والتحقق والوقاية والإغلاق.'),
    mandatory: {}, clauses: { 'ISO 9001': '10.2' },
    sections: [data('ncs', L('Problem description (D2)', 'Description du problème (D2)', 'وصف المشكلة (D2)'), 'ncs_major'), data('actions', L('Actions (D3–D7)', 'Actions (D3–D7)', 'الإجراءات (D3–D7)'), 'actions_corrective'), data('rex', L('Lessons learned (D8)', 'Enseignements (D8)', 'الدروس المستفادة (D8)'), 'rex'), approval],
  },
  {
    code: 'TPL-IMP', category: 'improvement', docType: 'Plan', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-023', review: 'Quarterly', owner: 'transformation_manager',
    name: L('Improvement plan', 'Plan d\'amélioration', 'خطة التحسين'),
    description: L('Improvement ideas, expected gain, status and actions (§10.1, §10.3).', 'Idées d\'amélioration, gain attendu, statut et actions (§10.1, §10.3).', 'أفكار التحسين والعائد المتوقع والحالة والإجراءات (§10.1، §10.3).'),
    mandatory: {}, clauses: { 'ISO 9001': '10.3', 'ISO 14001': '10.3', 'ISO 45001': '10.3' },
    sections: [data('ideas', L('Improvement ideas', 'Idées d\'amélioration', 'أفكار التحسين'), 'ideas'), data('actions', L('Improvement actions', 'Actions d\'amélioration', 'إجراءات التحسين'), 'actions_improvement')],
  },
];

export const templateByCode = Object.fromEntries(DOC_TEMPLATES.map(t => [t.code, t]));

// Templates suggested for a macro process (used by the "Generate document" button of a step).
export function templatesForMp(mpId, msType) {
  return DOC_TEMPLATES.filter(t => t.mp === mpId && t.ms.includes(msType));
}
