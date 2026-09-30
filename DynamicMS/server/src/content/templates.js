// IMS document template library: the documented information an integrated management
// system needs (ISO 9001:2015, ISO 14001:2015, ISO 45001:2018), structured the way
// certified organizations write them: document identity, purpose and scope, references,
// responsibilities, content filled from the application's data, records, revision history
// and approval. Tenants can copy, edit or add templates.
//
// mandatory: { 'ISO 9001': 'maintain' | 'retain' } — "maintain" = documented information to
// maintain (a document), "retain" = documented information to retain (a record).
// Section types: text (text with placeholders), data (content built from the project data by
// a named source), signature (approval block).
// Placeholders: {org} {product} {line} {city} {customer} {supplier} {standards} {date} {project}
// {phase} {mp} {ceo} {year}
// Per-item templates: perMp (one per macro process), perPhase (one per E2E phase),
// perAudit (one per audit carried out), perNc (one per major or critical nonconformity).
const L = (en, fr, ar) => ({ en, fr, ar });
const text = (key, title, body) => ({ key, type: 'text', title, text: body });
const data = (key, title, source, intro) => ({ key, type: 'data', title, source, ...(intro ? { text: intro } : {}) });
const approval = { key: 'approval', type: 'signature', title: L('Approval', 'Approbation', 'الاعتماد') };
const purpose = (p) => text('purpose', L('Purpose and scope', 'Objet et domaine d\'application', 'الغرض والنطاق'), p);
const history = data('history', L('Revision history', 'Historique des révisions', 'سجل المراجعات'), 'revisions');
const refs = data('references', L('References', 'Références', 'المراجع'), 'references');
const defs = data('definitions', L('Terms and definitions', 'Termes et définitions', 'المصطلحات والتعاريف'), 'definitions');
const ident = data('identity', L('Document identification', 'Identification du document', 'تعريف الوثيقة'), 'doc_identity');
const T = {
  resp: L('Responsibilities', 'Responsabilités', 'المسؤوليات'),
  records: L('Records', 'Enregistrements', 'السجلات'),
  kpis: L('Performance indicators', 'Indicateurs de performance', 'مؤشرات الأداء'),
  method: L('Method', 'Méthode', 'المنهجية'),
  legend: L('Legend and rating scales', 'Légende et échelles de cotation', 'الدليل وسلالم التقييم'),
  actions: L('Actions', 'Actions', 'الإجراءات'),
  summary: L('Summary', 'Synthèse', 'الملخص'),
};

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

// Policy structure used by certified organizations: vision, context and ambition, strategic
// axes with their measurable objectives, top management commitments, the role of managers
// and of everyone, communication and review, and the signature of the chief executive.
const policySections = (variant) => [
  data('vision', L('Our vision and ambition', 'Notre vision et notre ambition', 'رؤيتنا وطموحنا'), `policy_vision:${variant}`),
  data('axes', L('Our strategic axes', 'Nos axes stratégiques', 'محاورنا الاستراتيجية'), `policy_axes:${variant}`),
  data('commitments', L('Commitments of top management', 'Engagements de la direction', 'التزامات الإدارة العليا'), `policy_commitments:${variant}`),
  data('roles', L('Everyone\'s role', 'Le rôle de chacun', 'دور كل فرد'), `policy_roles:${variant}`),
  data('review', L('Communication and review of this policy', 'Communication et revue de cette politique', 'التواصل ومراجعة هذه السياسة'), 'policy_review'),
  data('signature', L('Signature', 'Signature', 'التوقيع'), 'policy_signature'),
];

export const DOC_TEMPLATES = [
  // ---------------------------------------------------------------- Policies and scope
  {
    code: 'TPL-POL-Q', category: 'policy', docType: 'Policy', formats: ['DOCX', 'PDF'], toc: false, cover: false, ms: ['QMS'], mp: 'MP-002', review: 'Annual', owner: 'top_management',
    name: L('Quality policy', 'Politique qualité', 'سياسة الجودة'),
    description: L('Vision, strategic axes with measurable objectives and commitments, signed by the chief executive (ISO 9001 §5.2). One to two pages, no table of contents.', 'Vision, axes stratégiques avec objectifs mesurables et engagements, signée par le dirigeant (ISO 9001 §5.2). Une à deux pages, sans sommaire.', 'الرؤية والمحاور الاستراتيجية مع أهداف قابلة للقياس والالتزامات، موقعة من الرئيس التنفيذي (ISO 9001 §5.2). صفحة إلى صفحتين دون جدول محتويات.'),
    mandatory: { 'ISO 9001': 'maintain' }, clauses: { 'ISO 9001': '5.2' }, sections: policySections('Q'),
  },
  {
    code: 'TPL-POL-IMS', category: 'policy', docType: 'Policy', formats: ['DOCX', 'PDF'], toc: false, cover: false, ms: ['QHSE'], mp: 'MP-002', review: 'Annual', owner: 'top_management',
    name: L('Integrated QHSE policy', 'Politique QHSE intégrée', 'سياسة الجودة والصحة والسلامة والبيئة المتكاملة'),
    description: L('One policy for quality, environment and occupational health and safety (ISO 9001, ISO 14001 and ISO 45001 §5.2), signed by the chief executive.', 'Une politique unique qualité, environnement, santé et sécurité au travail (ISO 9001, ISO 14001 et ISO 45001 §5.2), signée par le dirigeant.', 'سياسة واحدة للجودة والبيئة والصحة والسلامة المهنية (ISO 9001 وISO 14001 وISO 45001 §5.2) موقعة من الرئيس التنفيذي.'),
    mandatory: { 'ISO 9001': 'maintain', 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '5.2', 'ISO 14001': '5.2', 'ISO 45001': '5.2' }, sections: policySections('IMS'),
  },
  {
    code: 'TPL-POL-E', category: 'policy', docType: 'Policy', formats: ['DOCX', 'PDF'], toc: false, cover: false, ms: ['QHSE'], mp: 'MP-002', review: 'Annual', owner: 'top_management',
    name: L('Environmental policy', 'Politique environnementale', 'السياسة البيئية'),
    description: L('Stand-alone environmental policy (ISO 14001 §5.2) when no integrated policy is used.', 'Politique environnementale autonome (ISO 14001 §5.2) en l\'absence de politique intégrée.', 'سياسة بيئية مستقلة (ISO 14001 §5.2) عند عدم استخدام سياسة متكاملة.'),
    mandatory: { 'ISO 14001': 'maintain' }, clauses: { 'ISO 14001': '5.2' }, alternativeTo: 'TPL-POL-IMS', sections: policySections('E'),
  },
  {
    code: 'TPL-POL-OHS', category: 'policy', docType: 'Policy', formats: ['DOCX', 'PDF'], toc: false, cover: false, ms: ['QHSE'], mp: 'MP-002', review: 'Annual', owner: 'top_management',
    name: L('Occupational health and safety policy', 'Politique santé et sécurité au travail', 'سياسة الصحة والسلامة المهنية'),
    description: L('Stand-alone OH&S policy (ISO 45001 §5.2) when no integrated policy is used.', 'Politique SST autonome (ISO 45001 §5.2) en l\'absence de politique intégrée.', 'سياسة صحة وسلامة مهنية مستقلة (ISO 45001 §5.2) عند عدم استخدام سياسة متكاملة.'),
    mandatory: { 'ISO 45001': 'maintain' }, clauses: { 'ISO 45001': '5.2' }, alternativeTo: 'TPL-POL-IMS', sections: policySections('OHS'),
  },
  {
    code: 'TPL-SCOPE', category: 'policy', docType: 'Scope', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-001', review: 'Annual', owner: 'ims_manager',
    name: L('Scope of the management system', 'Périmètre du système de management', 'نطاق نظام الإدارة'),
    description: L('Scope statement, sites, products and services, boundaries, outsourced processes and justification of non-applicable requirements (§4.3).', 'Énoncé du périmètre, sites, produits et services, limites, processus externalisés et justification des exigences non applicables (§4.3).', 'بيان النطاق والمواقع والمنتجات والخدمات والحدود والعمليات المسندة للخارج وتبرير المتطلبات غير المنطبقة (§4.3).'),
    mandatory: { 'ISO 9001': 'maintain', 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '4.3', 'ISO 14001': '4.3', 'ISO 45001': '4.3' },
    sections: [
      ident,
      purpose(L('This document defines the boundaries and applicability of the management system of {org}, as required by clause 4.3 of {standards}. It is available to interested parties on request.', 'Ce document définit les limites et l\'applicabilité du système de management de {org}, conformément à l\'article 4.3 de {standards}. Il est disponible pour les parties intéressées sur demande.', 'تحدد هذه الوثيقة حدود نظام إدارة {org} وقابليته للتطبيق وفق البند 4.3 من {standards}، وهي متاحة للأطراف المعنية عند الطلب.')),
      data('profile', L('Organization profile', 'Présentation de l\'organisme', 'تعريف المؤسسة'), 'org_profile'),
      data('statement', L('Scope statement', 'Énoncé du périmètre', 'بيان النطاق'), 'scope_statement'),
      data('sites', L('Sites and organization units', 'Sites et unités de l\'organisation', 'المواقع ووحدات المؤسسة'), 'obs_units'),
      data('products', L('Products and services', 'Produits et services', 'المنتجات والخدمات'), 'products_services'),
      data('boundaries', L('Boundaries, interfaces and outsourced processes', 'Limites, interfaces et processus externalisés', 'الحدود والواجهات والعمليات المسندة للخارج'), 'outsourced'),
      data('standards', L('Standards applied', 'Normes appliquées', 'المعايير المطبقة'), 'standards'),
      data('exclusions', L('Requirements not applicable and justification', 'Exigences non applicables et justification', 'المتطلبات غير المنطبقة وتبريرها'), 'exclusions'),
      data('processes', L('Processes in scope', 'Processus inclus', 'العمليات المشمولة'), 'processes'),
      history, approval,
    ],
  },
  {
    code: 'TPL-MAN', category: 'policy', docType: 'Manual', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-036', review: 'Annual', owner: 'ims_manager',
    name: L('Management system manual', 'Manuel du système de management', 'دليل نظام الإدارة'),
    description: L('How the management system meets each clause of the standards (high-level structure 4 to 10), with the process map, responsibilities and the cross-reference to documents. Recommended, not required.', 'Comment le système de management répond à chaque article des normes (structure HLS 4 à 10), avec cartographie, responsabilités et correspondance avec les documents. Recommandé, non exigé.', 'كيف يلبي نظام الإدارة كل بند من المعايير (الهيكل عالي المستوى 4 إلى 10) مع خريطة العمليات والمسؤوليات والإحالة إلى الوثائق. موصى به وغير إلزامي.'),
    mandatory: {}, clauses: { 'ISO 9001': '4–10', 'ISO 14001': '4–10', 'ISO 45001': '4–10' },
    sections: [
      ident,
      text('intro', L('Introduction', 'Introduction', 'مقدمة'), L('This manual describes the management system of {org} and how it meets the requirements of {standards}. It is the entry point to the documented information: each chapter follows the clause of the same number and refers to the procedures and records that apply. The manual is controlled; printed copies are for information only.', 'Ce manuel décrit le système de management de {org} et la manière dont il satisfait aux exigences de {standards}. Il est le point d\'entrée des informations documentées : chaque chapitre suit l\'article de même numéro et renvoie aux procédures et enregistrements applicables. Le manuel est maîtrisé ; les copies imprimées sont données à titre d\'information.', 'يصف هذا الدليل نظام إدارة {org} وكيفية تلبيته لمتطلبات {standards}. وهو المدخل إلى المعلومات الموثقة: يتبع كل فصل البند الذي يحمل الرقم نفسه ويحيل إلى الإجراءات والسجلات المنطبقة. الدليل وثيقة مضبوطة، والنسخ المطبوعة للاطلاع فقط.')),
      data('profile', L('Presentation of the organization', 'Présentation de l\'organisme', 'تقديم المؤسسة'), 'org_profile'),
      data('scope', L('Scope and applicability (§4.3)', 'Périmètre et applicabilité (§4.3)', 'النطاق وقابلية التطبيق (§4.3)'), 'scope_summary'),
      data('context', L('Context of the organization (§4.1, §4.2)', 'Contexte de l\'organisme (§4.1, §4.2)', 'سياق المؤسسة (§4.1، §4.2)'), 'context_summary'),
      data('processmap', L('Management system and its processes (§4.4)', 'Système de management et processus (§4.4)', 'نظام الإدارة وعملياته (§4.4)'), 'pmap_diagram'),
      data('leadership', L('Leadership and commitment (§5)', 'Leadership et engagement (§5)', 'القيادة والالتزام (§5)'), 'leadership_summary'),
      data('racsi', L('Roles, responsibilities and authorities (§5.3)', 'Rôles, responsabilités et autorités (§5.3)', 'الأدوار والمسؤوليات والصلاحيات (§5.3)'), 'racsi'),
      data('planning', L('Planning: risks, opportunities and objectives (§6)', 'Planification : risques, opportunités et objectifs (§6)', 'التخطيط: المخاطر والفرص والأهداف (§6)'), 'planning_summary'),
      data('support', L('Support (§7)', 'Support (§7)', 'الدعم (§7)'), 'support_summary'),
      data('operation', L('Operation (§8)', 'Réalisation des activités opérationnelles (§8)', 'التشغيل (§8)'), 'operation_summary'),
      data('performance', L('Performance evaluation (§9)', 'Évaluation des performances (§9)', 'تقييم الأداء (§9)'), 'performance_summary'),
      data('improvement', L('Improvement (§10)', 'Amélioration (§10)', 'التحسين (§10)'), 'improvement_summary'),
      data('matrix', L('Cross-reference: clauses, processes and documents', 'Correspondance : articles, processus et documents', 'الإحالة: البنود والعمليات والوثائق'), 'clause_matrix'),
      history, approval,
    ],
  },
  // ---------------------------------------------------------------- Context and planning
  {
    code: 'TPL-CTX', category: 'context', docType: 'Report', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-001', review: 'Annual', owner: 'ims_manager',
    name: L('Context and interested parties analysis', 'Analyse du contexte et des parties intéressées', 'تحليل السياق والأطراف المعنية'),
    description: L('PESTLE and SWOT analysis, interested parties with their requirements, influence and interest, conclusions for risks and opportunities, and review (§4.1, §4.2).', 'Analyse PESTEL et SWOT, parties intéressées avec leurs exigences, influence et intérêt, conclusions pour les risques et opportunités, et revue (§4.1, §4.2).', 'تحليل PESTLE وSWOT والأطراف المعنية ومتطلباتها ونفوذها واهتمامها والاستنتاجات للمخاطر والفرص والمراجعة (§4.1، §4.2).'),
    mandatory: {}, clauses: { 'ISO 9001': '4.1, 4.2', 'ISO 14001': '4.1, 4.2', 'ISO 45001': '4.1, 4.2' },
    sections: [
      ident,
      purpose(L('This report records the external and internal issues relevant to the purpose and strategic direction of {org}, and the needs and expectations of its relevant interested parties. Its conclusions feed the risks and opportunities, the scope, the policy and the objectives.', 'Ce rapport consigne les enjeux externes et internes pertinents pour la finalité et l\'orientation stratégique de {org}, ainsi que les besoins et attentes de ses parties intéressées pertinentes. Ses conclusions alimentent les risques et opportunités, le périmètre, la politique et les objectifs.', 'يسجل هذا التقرير القضايا الخارجية والداخلية ذات الصلة بغاية {org} وتوجهها الاستراتيجي، واحتياجات الأطراف المعنية وتوقعاتها. وتغذي استنتاجاته المخاطر والفرص والنطاق والسياسة والأهداف.')),
      data('method', T.method, 'context_method'),
      data('pestle', L('External issues (PESTLE)', 'Enjeux externes (PESTEL)', 'القضايا الخارجية (PESTLE)'), 'pestle'),
      data('internal', L('Internal issues', 'Enjeux internes', 'القضايا الداخلية'), 'context_internal'),
      data('swot', L('SWOT synthesis', 'Synthèse SWOT', 'خلاصة SWOT'), 'swot'),
      data('parties', L('Interested parties and their requirements', 'Parties intéressées et leurs exigences', 'الأطراف المعنية ومتطلباتها'), 'parties_full'),
      data('needs', L('Needs and expectations mapped to the interested parties', 'Besoins et attentes par partie intéressée', 'الاحتياجات والتوقعات حسب الطرف المعني'), 'needs_parties'),
      data('grid', L('Influence and interest grid', 'Grille influence / intérêt', 'شبكة النفوذ والاهتمام'), 'power_grid'),
      data('assessment', L('Assessment of needs and expectations', 'Évaluation des besoins et attentes', 'تقييم الاحتياجات والتوقعات'), 'step_matrix:MP-001.5'),
      data('interactions', L('Process interactions', 'Interactions entre processus', 'التفاعلات بين العمليات'), 'step_rows:MP-001.7'),
      data('conclusions', L('Conclusions: risks and opportunities to address', 'Conclusions : risques et opportunités à traiter', 'الاستنتاجات: المخاطر والفرص الواجب معالجتها'), 'context_conclusions'),
      data('review', L('Monitoring and review', 'Surveillance et revue', 'المراقبة والمراجعة'), 'step_review:MP-001.10'),
      history, approval,
    ],
  },
  {
    code: 'TPL-REG-IP', category: 'context', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-001', review: 'Semi-annual', owner: 'ims_manager',
    name: L('Interested parties register', 'Registre des parties intéressées', 'سجل الأطراف المعنية'),
    description: L('Interested parties, needs and expectations, requirements adopted as compliance obligations, influence, interest, priority, monitoring and owner.', 'Parties intéressées, besoins et attentes, exigences retenues comme obligations de conformité, influence, intérêt, priorité, surveillance et responsable.', 'الأطراف المعنية واحتياجاتها وتوقعاتها والمتطلبات المعتمدة كالتزامات امتثال ونفوذها واهتمامها وأولويتها ومراقبتها والمسؤول.'),
    mandatory: {}, clauses: { 'ISO 9001': '4.2', 'ISO 14001': '4.2', 'ISO 45001': '4.2' },
    sections: [ident, data('parties', L('Interested parties', 'Parties intéressées', 'الأطراف المعنية'), 'parties_full'), data('needs', L('Needs and expectations mapped to the interested parties', 'Besoins et attentes par partie intéressée', 'الاحتياجات والتوقعات حسب الطرف المعني'), 'needs_parties'), data('grid', L('Influence and interest grid', 'Grille influence / intérêt', 'شبكة النفوذ والاهتمام'), 'power_grid')],
  },
  {
    code: 'TPL-REG-RISK', category: 'context', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-012', review: 'Semi-annual', owner: 'risk_manager',
    name: L('Risks and opportunities register', 'Registre des risques et opportunités', 'سجل المخاطر والفرص'),
    description: L('Risks with cause, consequence, existing controls, likelihood, impact, level, treatment and residual risk; opportunities; heat map and scoring method (§6.1).', 'Risques avec cause, conséquence, maîtrises existantes, probabilité, impact, niveau, traitement et risque résiduel ; opportunités ; carte de chaleur et méthode de cotation (§6.1).', 'المخاطر مع السبب والعاقبة والضوابط القائمة والاحتمالية والأثر والمستوى والمعالجة والمخاطر المتبقية؛ الفرص؛ الخريطة الحرارية وطريقة التقييم (§6.1).'),
    mandatory: { 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '6.1', 'ISO 14001': '6.1.1', 'ISO 45001': '6.1.1' },
    sections: [ident, data('summary', T.summary, 'risk_summary'), data('risks', L('Risks', 'Risques', 'المخاطر'), 'risks_full'), data('opportunities', L('Opportunities', 'Opportunités', 'الفرص'), 'opportunities_full'), data('heatmap', L('Heat map (number of risks)', 'Carte de chaleur (nombre de risques)', 'الخريطة الحرارية (عدد المخاطر)'), 'heatmap'), data('method', L('Scoring method and acceptance criteria', 'Méthode de cotation et critères d\'acceptation', 'طريقة التقييم ومعايير القبول'), 'risk_scale')],
  },
  {
    code: 'TPL-OBJ', category: 'context', docType: 'Plan', formats: ['XLSX', 'PDF', 'DOCX'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-003', review: 'Quarterly', owner: 'ims_manager',
    name: L('Objectives and action plan', 'Objectifs et plan d\'actions', 'الأهداف وخطة العمل'),
    description: L('SMART objectives linked to the policy axes: KPI, baseline, target, deadline, owner, resources, evaluation method, progress; with the actions to achieve them (§6.2).', 'Objectifs SMART reliés aux axes de la politique : KPI, référence, cible, échéance, responsable, ressources, méthode d\'évaluation, avancement ; avec les actions pour les atteindre (§6.2).', 'أهداف ذكية مرتبطة بمحاور السياسة: المؤشر وخط الأساس والمستهدف والموعد والمسؤول والموارد وطريقة التقييم والتقدم، مع إجراءات تحقيقها (§6.2).'),
    mandatory: { 'ISO 9001': 'maintain', 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '6.2', 'ISO 14001': '6.2', 'ISO 45001': '6.2' },
    sections: [ident, data('summary', T.summary, 'objectives_summary'), data('objectives', L('Objectives', 'Objectifs', 'الأهداف'), 'objectives_full'), data('actions', L('Action plan', 'Plan d\'actions', 'خطة العمل'), 'actions_objectives'), approval],
  },
  {
    code: 'TPL-LEGAL', category: 'context', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-028', review: 'Semi-annual', owner: 'compliance_officer',
    name: L('Compliance obligations register', 'Registre des obligations de conformité', 'سجل التزامات الامتثال'),
    description: L('Legal requirements and other requirements (contracts, permits, standards): source, reference, applicability, how complied, owner, evaluation of compliance and actions (ISO 14001 / ISO 45001 §6.1.3, §9.1.2).', 'Exigences légales et autres exigences (contrats, autorisations, normes) : source, référence, applicabilité, mode de conformité, responsable, évaluation de la conformité et actions (ISO 14001 / ISO 45001 §6.1.3, §9.1.2).', 'المتطلبات القانونية وغيرها (العقود والتراخيص والمعايير): المصدر والمرجع وقابلية التطبيق وطريقة الامتثال والمسؤول وتقييم الامتثال والإجراءات (ISO 14001 / ISO 45001 §6.1.3، §9.1.2).'),
    mandatory: { 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 9001': '4.2, 5.1.2', 'ISO 14001': '6.1.3, 9.1.2', 'ISO 45001': '6.1.3, 9.1.2' },
    sections: [ident, data('summary', L('Evaluation of compliance — summary', 'Évaluation de la conformité — synthèse', 'تقييم الامتثال — ملخص'), 'obligations_summary'), data('obligations', L('Obligations', 'Obligations', 'الالتزامات'), 'obligations_full'), data('actions', L('Actions for partial or non compliance', 'Actions en cas de conformité partielle ou de non-conformité', 'إجراءات الامتثال الجزئي أو عدم الامتثال'), 'obligations_actions')],
  },
  // ---------------------------------------------------------------- Processes and procedures
  {
    code: 'TPL-PMAP', category: 'process', docType: 'Map', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-004', review: 'Annual', owner: 'process_excellence_manager',
    name: L('Process map and interactions', 'Cartographie des processus et interactions', 'خريطة العمليات وتفاعلاتها'),
    description: L('Process map (management, core and support processes), process owners, purpose, indicators and interactions (§4.4).', 'Cartographie (processus de management, de réalisation et de support), pilotes, finalités, indicateurs et interactions (§4.4).', 'خريطة العمليات (الإدارية والأساسية والداعمة) ومالكوها وغاياتها ومؤشراتها وتفاعلاتها (§4.4).'),
    mandatory: { 'ISO 9001': 'maintain' }, clauses: { 'ISO 9001': '4.4.2' },
    sections: [ident, purpose(L('This document presents the processes of the management system of {org}, their sequence and interactions, their owners and how their performance is measured (§4.4.1).', 'Ce document présente les processus du système de management de {org}, leur séquence et leurs interactions, leurs pilotes et la mesure de leur performance (§4.4.1).', 'تعرض هذه الوثيقة عمليات نظام إدارة {org} وتسلسلها وتفاعلاتها ومالكيها وكيفية قياس أدائها (§4.4.1).')),
      data('map', L('Process map', 'Cartographie des processus', 'خريطة العمليات'), 'pmap_diagram'), data('processes', L('Processes, owners and indicators', 'Processus, pilotes et indicateurs', 'العمليات ومالكوها ومؤشراتها'), 'process_list'), data('interactions', L('Interactions', 'Interactions', 'التفاعلات'), 'step_rows:MP-001.7'), data('racsi', L('Process owners (RACSI)', 'Pilotes de processus (RACSI)', 'مالكو العمليات (RACSI)'), 'racsi'), history, approval],
  },
  {
    code: 'TPL-PSHEET', category: 'process', docType: 'Sheet', formats: ['DOCX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-004', review: 'Semi-annual', owner: 'process_excellence_manager', perMp: true,
    name: L('Macro process sheet', 'Fiche macro-processus', 'بطاقة العملية الكلية'),
    description: L('One sheet per macro process: identity, SIPOC, BPMN diagram, steps with their SIPOC, RACSI, indicators, risks and documents.', 'Une fiche par macro-processus : identité, SIPOC, diagramme BPMN, étapes avec leur SIPOC, RACSI, indicateurs, risques et documents.', 'بطاقة لكل عملية كلية: التعريف وSIPOC ومخطط BPMN والخطوات مع SIPOC الخاص بها وRACSI والمؤشرات والمخاطر والوثائق.'),
    mandatory: {}, clauses: { 'ISO 9001': '4.4' },
    sections: [data('header', L('Process identity', 'Identité du processus', 'تعريف العملية'), 'mp_header'), data('sipoc', L('SIPOC of the process', 'SIPOC du processus', 'SIPOC للعملية'), 'mp_sipoc'), data('bpmn', L('Process flow (BPMN)', 'Logigramme (BPMN)', 'مخطط سير العملية (BPMN)'), 'mp_bpmn'), data('steps', L('Steps and their SIPOC', 'Étapes et leur SIPOC', 'الخطوات وSIPOC الخاص بها'), 'mp_steps_sipoc'), data('exit', L('Go / No-Go to close the process', 'Go / No-Go de clôture du processus', 'قرار المتابعة / التوقف لإغلاق العملية'), 'mp_gonogo'), data('racsi', L('RACSI', 'RACSI', 'RACSI'), 'mp_racsi'), data('kpis', L('Indicators', 'Indicateurs', 'المؤشرات'), 'mp_kpis'), data('risks', L('Risks and controls', 'Risques et maîtrises', 'المخاطر والضوابط'), 'mp_risks'), data('documents', L('Documents and records', 'Documents et enregistrements', 'الوثائق والسجلات'), 'mp_docs'), history],
  },
  {
    code: 'TPL-PROC', category: 'process', docType: 'Procedure', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-006', review: 'Annual', owner: 'process_excellence_manager', perPhase: true,
    name: L('Procedure', 'Procédure', 'إجراء'),
    description: L('Purpose, scope, references, definitions, responsibilities, BPMN flow, activities with the SIPOC of each step, Go / No-Go decision, records, indicators and risks of a process phase.', 'Objet, domaine, références, définitions, responsabilités, logigramme BPMN, activités avec le SIPOC de chaque étape, décision Go / No-Go, enregistrements, indicateurs et risques d\'une phase.', 'الغرض والنطاق والمراجع والتعاريف والمسؤوليات ومخطط BPMN والأنشطة مع SIPOC لكل خطوة وقرار المتابعة / التوقف والسجلات والمؤشرات والمخاطر لمرحلة ما.'),
    mandatory: {}, clauses: { 'ISO 9001': '4.4.2, 8.1', 'ISO 14001': '8.1', 'ISO 45001': '8.1' },
    sections: [
      ident,
      purpose(L('This procedure describes how the phase "{phase}" is carried out at {org}: who does what, in which order, with which inputs and outputs, and how the decision to move to the next phase is taken. It applies to all units and people involved in the phase.', 'Cette procédure décrit le déroulement de la phase « {phase} » chez {org} : qui fait quoi, dans quel ordre, avec quelles entrées et sorties, et comment est prise la décision de passer à la phase suivante. Elle s\'applique à toutes les unités et personnes intervenant dans la phase.', 'يصف هذا الإجراء كيفية تنفيذ مرحلة "{phase}" لدى {org}: من يفعل ماذا وبأي ترتيب وبأي مدخلات ومخرجات وكيف يُتخذ قرار الانتقال إلى المرحلة التالية. وينطبق على جميع الوحدات والأشخاص المشاركين في المرحلة.')),
      refs, defs,
      data('responsibilities', T.resp, 'phase_racsi'),
      data('overview', L('Process overview (BPMN)', 'Vue d\'ensemble du processus (BPMN)', 'نظرة عامة على العملية (BPMN)'), 'phase_bpmn'),
      data('activities', L('Description of activities', 'Description des activités', 'وصف الأنشطة'), 'phase_activities'),
      data('gate', L('Go / No-Go decision', 'Décision Go / No-Go', 'قرار المتابعة / التوقف'), 'phase_gate'),
      data('records', T.records, 'phase_records'),
      data('kpis', T.kpis, 'phase_kpis'),
      data('risks', L('Risks and controls', 'Risques et maîtrises', 'المخاطر والضوابط'), 'phase_risks'),
      history, approval,
    ],
  },
  {
    code: 'TPL-WI', category: 'process', docType: 'Instruction', formats: ['DOCX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-006', review: 'Annual', owner: 'operations_manager',
    name: L('Work instruction', 'Instruction de travail', 'تعليمات العمل'),
    description: L('Step-by-step instruction for one activity: key points and reasons, safety, tools, quality checks and the record to fill.', 'Instruction pas à pas pour une activité : points clés et raisons, sécurité, outillage, contrôles qualité et enregistrement à remplir.', 'تعليمات خطوة بخطوة لنشاط واحد: النقاط الرئيسية وأسبابها والسلامة والأدوات وفحوص الجودة والسجل الواجب تعبئته.'),
    mandatory: {}, clauses: { 'ISO 9001': '7.5, 8.5.1' },
    sections: [
      ident,
      purpose(L('Carry out the activities of {line} right first time, safely, and record the result. Applies to all technicians and operators of {org}.', 'Réaliser les activités de {line} bien du premier coup, en sécurité, et en enregistrer le résultat. S\'applique à tous les techniciens et opérateurs de {org}.', 'تنفيذ أنشطة {line} بشكل صحيح من المرة الأولى وبأمان وتسجيل النتيجة. تنطبق على جميع الفنيين والمشغلين في {org}.')),
      data('safety', L('Safety and PPE', 'Sécurité et EPI', 'السلامة ومعدات الوقاية'), 'wi_safety'),
      data('tools', L('Tools, equipment and materials', 'Outillage, équipements et matières', 'الأدوات والمعدات والمواد'), 'wi_tools'),
      data('steps', L('Instructions', 'Instructions', 'التعليمات'), 'wi_steps'),
      data('checks', L('Quality checks and acceptance criteria', 'Contrôles qualité et critères d\'acceptation', 'فحوص الجودة ومعايير القبول'), 'wi_checks'),
      text('records', T.records, L('Fill in the job sheet in the application (photos, measurements, customer signature). Any deviation is recorded as a nonconformity.', 'Renseigner la fiche d\'intervention dans l\'application (photos, mesures, signature client). Tout écart est enregistré comme non-conformité.', 'تعبئة بطاقة العمل في التطبيق (الصور والقياسات وتوقيع العميل). ويُسجَّل أي انحراف كحالة عدم مطابقة.')),
      history, approval,
    ],
  },
  {
    code: 'TPL-RACSI', category: 'process', docType: 'Matrix', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-004', review: 'Annual', owner: 'process_excellence_manager',
    name: L('RACSI matrix', 'Matrice RACSI', 'مصفوفة RACSI'),
    description: L('Responsible, Accountable, Consulted, Support and Informed roles for every macro process, with the rules of use (§5.3).', 'Rôles Réalise, Approuve, Consulté, Support et Informé pour chaque macro-processus, avec les règles d\'usage (§5.3).', 'أدوار المنفذ والمساءل والمستشار والداعم والمُبلَّغ لكل عملية كلية مع قواعد الاستخدام (§5.3).'),
    mandatory: {}, clauses: { 'ISO 9001': '5.3', 'ISO 14001': '5.3', 'ISO 45001': '5.3' },
    sections: [ident, data('racsi', L('RACSI', 'RACSI', 'RACSI'), 'racsi'), data('rules', L('Rules of use', 'Règles d\'usage', 'قواعد الاستخدام'), 'racsi_rules')],
  },
  // ---------------------------------------------------------------- Support
  {
    code: 'TPL-COMP', category: 'support', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-013', review: 'Semi-annual', owner: 'hr_manager',
    name: L('Competence matrix and training records', 'Matrice des compétences et enregistrements de formation', 'مصفوفة الكفاءات وسجلات التدريب'),
    description: L('Competence requirements per role, people × competences matrix with levels, gaps and actions, training plan, training records and evaluation of effectiveness (§7.2).', 'Exigences de compétence par rôle, matrice personnes × compétences avec niveaux, écarts et actions, plan de formation, enregistrements de formation et évaluation de l\'efficacité (§7.2).', 'متطلبات الكفاءة لكل دور ومصفوفة الأشخاص × الكفاءات مع المستويات والفجوات والإجراءات وخطة التدريب وسجلاته وتقييم الفعالية (§7.2).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '7.2', 'ISO 14001': '7.2', 'ISO 45001': '7.2' },
    sections: [ident, data('requirements', L('Competence requirements', 'Exigences de compétence', 'متطلبات الكفاءة'), 'competence_req'), data('matrix', L('Competence matrix (levels 1–4)', 'Matrice des compétences (niveaux 1–4)', 'مصفوفة الكفاءات (المستويات 1–4)'), 'competence_matrix'), data('gaps', L('Gaps and actions', 'Écarts et actions', 'الفجوات والإجراءات'), 'competence_gaps'), data('plan', L('Training plan', 'Plan de formation', 'خطة التدريب'), 'training_plan'), data('training', L('Training records and effectiveness', 'Enregistrements de formation et efficacité', 'سجلات التدريب وفعاليته'), 'training_full'), data('scale', T.legend, 'competence_scale')],
  },
  {
    code: 'TPL-CAL', category: 'support', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-025', review: 'Semi-annual', owner: 'quality_manager',
    name: L('Monitoring and measuring equipment register', 'Registre des équipements de surveillance et de mesure', 'سجل معدات المراقبة والقياس'),
    description: L('Identification, measuring range and accuracy, calibration method and traceability, provider and certificate, frequency, last result, due date, status, and the impact assessment of any out-of-tolerance (ISO 9001 §7.1.5).', 'Identification, étendue de mesure et exactitude, méthode d\'étalonnage et raccordement, prestataire et certificat, périodicité, dernier résultat, échéance, statut et évaluation de l\'impact de tout hors-tolérance (ISO 9001 §7.1.5).', 'التعريف ونطاق القياس ودقته وطريقة المعايرة والتتبع ومقدم الخدمة والشهادة والتكرار وآخر نتيجة والموعد والحالة وتقييم أثر أي خروج عن التفاوت (ISO 9001 §7.1.5).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '7.1.5', 'ISO 14001': '9.1.1', 'ISO 45001': '9.1.1' },
    sections: [ident, data('summary', L('Calibration status', 'État de l\'étalonnage', 'حالة المعايرة'), 'cal_summary'), data('equipment', L('Equipment register', 'Registre des équipements', 'سجل المعدات'), 'calibration_full'), data('calibration', L('Calibration and verification records', 'Enregistrements d\'étalonnage et de vérification', 'سجلات المعايرة والتحقق'), 'cal_records'), data('oot', L('Out-of-tolerance impact assessments (§7.1.5.2)', 'Évaluations d\'impact des hors-tolérances (§7.1.5.2)', 'تقييمات أثر الخروج عن التفاوت (§7.1.5.2)'), 'cal_oot'), data('legend', T.legend, 'cal_legend')],
  },
  {
    code: 'TPL-COMM', category: 'support', docType: 'Plan', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-014', review: 'Annual', owner: 'ims_manager',
    name: L('Communication plan and records', 'Plan et enregistrements de communication', 'خطة التواصل وسجلاته'),
    description: L('On what, why, with whom, who, how, when, in which language and with which record (§7.4), and the log of internal and external communications.', 'Sur quoi, pourquoi, avec qui, par qui, comment, quand, en quelle langue et avec quel enregistrement (§7.4), et le journal des communications internes et externes.', 'حول ماذا ولماذا ومع من ومن يتواصل وكيف ومتى وبأي لغة وبأي سجل (§7.4)، وسجل الاتصالات الداخلية والخارجية.'),
    mandatory: { 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '7.4', 'ISO 14001': '7.4', 'ISO 45001': '7.4' },
    sections: [ident, data('plan', L('Communication plan', 'Plan de communication', 'خطة التواصل'), 'commplan'), data('log', L('Communication records', 'Enregistrements de communication', 'سجلات التواصل'), 'commlog'), data('steps', L('Communications recorded in the process steps', 'Communications enregistrées dans les étapes', 'الاتصالات المسجلة في الخطوات'), 'communications')],
  },
  {
    code: 'TPL-DOCLIST', category: 'support', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-029', review: 'Quarterly', owner: 'document_controller',
    name: L('Master list of documented information', 'Liste maîtresse des informations documentées', 'القائمة الرئيسية للمعلومات الموثقة'),
    description: L('Every controlled document and record: level, clause, version, status, owner, approver, effective date, review, distribution, storage, retention and disposition; external documents; the documented information required by the standards (§7.5).', 'Chaque document et enregistrement maîtrisé : niveau, article, version, statut, responsable, approbateur, date d\'application, revue, diffusion, stockage, conservation et élimination ; documents externes ; informations documentées exigées par les normes (§7.5).', 'كل وثيقة وسجل مضبوط: المستوى والبند والإصدار والحالة والمسؤول والمعتمد وتاريخ السريان والمراجعة والتوزيع والحفظ والاحتفاظ والإتلاف؛ الوثائق الخارجية؛ المعلومات الموثقة المطلوبة (§7.5).'),
    mandatory: {}, clauses: { 'ISO 9001': '7.5.3', 'ISO 14001': '7.5.3', 'ISO 45001': '7.5.3' },
    sections: [ident, data('hierarchy', L('Documentation structure', 'Structure documentaire', 'هيكل الوثائق'), 'doc_hierarchy'), data('documents', L('Documents to maintain', 'Documents à tenir à jour', 'الوثائق الواجب تحديثها'), 'documents_full'), data('records', L('Records to retain and retention', 'Enregistrements à conserver et durées', 'السجلات الواجب الاحتفاظ بها ومدده'), 'records_retention'), data('external', L('Documents of external origin', 'Documents d\'origine externe', 'الوثائق ذات المصدر الخارجي'), 'external_docs'), data('mandatory', L('Documented information required by the standards', 'Informations documentées exigées par les normes', 'المعلومات الموثقة المطلوبة بالمعايير'), 'mandatory_matrix')],
  },
  // ---------------------------------------------------------------- Operation
  {
    code: 'TPL-SUP', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-024', review: 'Semi-annual', owner: 'quality_manager',
    name: L('Supplier evaluation register', 'Registre d\'évaluation des fournisseurs', 'سجل تقييم الموردين'),
    description: L('Weighted criteria, scores per criterion, class A/B/C, approval status, performance monitoring (on-time delivery, PPM, complaints), re-evaluation dates and actions (ISO 9001 §8.4.1).', 'Critères pondérés, notes par critère, classe A/B/C, statut d\'homologation, surveillance de la performance (livraison à l\'heure, PPM, réclamations), dates de réévaluation et actions (ISO 9001 §8.4.1).', 'معايير مرجحة ودرجات لكل معيار وفئة A/B/C وحالة الاعتماد ومراقبة الأداء (التسليم في الموعد وPPM والشكاوى) ومواعيد إعادة التقييم والإجراءات (ISO 9001 §8.4.1).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '8.4.1', 'ISO 45001': '8.1.4' },
    sections: [ident, data('criteria', L('Evaluation criteria and weighting', 'Critères d\'évaluation et pondération', 'معايير التقييم والترجيح'), 'supplier_criteria'), data('suppliers', L('Supplier evaluations', 'Évaluations des fournisseurs', 'تقييمات الموردين'), 'suppliers_full'), data('performance', L('Performance monitoring', 'Surveillance de la performance', 'مراقبة الأداء'), 'supplier_perf')],
  },
  {
    code: 'TPL-CTRL', category: 'operation', docType: 'Plan', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-007', review: 'Semi-annual', owner: 'operations_manager',
    name: L('Control plan', 'Plan de surveillance', 'خطة الضبط'),
    description: L('Per operation: characteristic, classification, specification, measurement technique, sample size and frequency, control method, responsible, record and reaction plan; with the operational controls and business rules (ISO 9001 §8.1, §8.5.1).', 'Par opération : caractéristique, classification, spécification, technique de mesure, taille et fréquence d\'échantillonnage, méthode de maîtrise, responsable, enregistrement et plan de réaction ; avec les maîtrises opérationnelles et les règles métier (ISO 9001 §8.1, §8.5.1).', 'لكل عملية: الخاصية والتصنيف والمواصفة وتقنية القياس وحجم العينة وتكرارها وطريقة الضبط والمسؤول والسجل وخطة الاستجابة؛ مع الضوابط التشغيلية وقواعد العمل (ISO 9001 §8.1، §8.5.1).'),
    mandatory: { 'ISO 9001': 'maintain' }, clauses: { 'ISO 9001': '8.1, 8.5.1', 'ISO 14001': '8.1', 'ISO 45001': '8.1' },
    sections: [ident, data('header', L('Control plan identification', 'Identification du plan de surveillance', 'تعريف خطة الضبط'), 'ctrl_header'), data('plan', L('Control plan', 'Plan de surveillance', 'خطة الضبط'), 'controlplan'), data('reaction', L('Reaction plan rules', 'Règles du plan de réaction', 'قواعد خطة الاستجابة'), 'ctrl_reaction'), data('controls', L('Operational controls (COSO)', 'Maîtrises opérationnelles (COSO)', 'الضوابط التشغيلية (COSO)'), 'controls'), data('rules', L('Business rules', 'Règles métier', 'قواعد العمل'), 'rules'), approval],
  },
  {
    code: 'TPL-NCO', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-018', review: 'Monthly', owner: 'quality_manager',
    name: L('Nonconforming outputs register', 'Registre des éléments de sortie non conformes', 'سجل المخرجات غير المطابقة'),
    description: L('Description, quantity, where detected, disposition (rework, repair, concession, scrap, return), authority deciding, customer information, cost and link to the nonconformity (ISO 9001 §8.7.2).', 'Description, quantité, lieu de détection, traitement (reprise, réparation, dérogation, rebut, retour), autorité décidant, information du client, coût et lien avec la non-conformité (ISO 9001 §8.7.2).', 'الوصف والكمية ومكان الاكتشاف والمعالجة (إعادة العمل، الإصلاح، التنازل، الإتلاف، الإرجاع) والجهة المقررة وإعلام العميل والتكلفة والربط بحالة عدم المطابقة (ISO 9001 §8.7.2).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '8.7.2' },
    sections: [ident, data('summary', T.summary, 'nco_summary'), data('ncs', L('Nonconforming outputs', 'Éléments non conformes', 'المخرجات غير المطابقة'), 'nco_full')],
  },
  {
    code: 'TPL-REQ', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-001', review: 'Per event', owner: 'operations_manager',
    name: L('Customer requirements review record', 'Enregistrement de revue des exigences clients', 'سجل مراجعة متطلبات العملاء'),
    description: L('Review of requirements before committing to supply: specified, not stated, legal and additional requirements, capability, decision, reviewer and confirmation to the customer (ISO 9001 §8.2.3).', 'Revue des exigences avant l\'engagement à fournir : exigences spécifiées, non formulées, légales et complémentaires, aptitude, décision, réviseur et confirmation au client (ISO 9001 §8.2.3).', 'مراجعة المتطلبات قبل الالتزام بالتوريد: المحددة وغير المصرح بها والقانونية والإضافية والقدرة والقرار والمراجع والتأكيد للعميل (ISO 9001 §8.2.3).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '8.2.3.2' },
    sections: [ident, data('reviews', L('Reviews', 'Revues', 'المراجعات'), 'reqreview'), data('changes', L('Changes to requirements', 'Modifications des exigences', 'تغييرات المتطلبات'), 'changes_customer')],
  },
  {
    code: 'TPL-RELEASE', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-007', review: 'Monthly', owner: 'operations_manager',
    name: L('Release of products and services record', 'Enregistrement de libération des produits et services', 'سجل الإفراج عن المنتجات والخدمات'),
    description: L('Evidence of conformity with the acceptance criteria and traceability to the person authorizing the release (ISO 9001 §8.6).', 'Preuves de conformité aux critères d\'acceptation et traçabilité de la personne autorisant la libération (ISO 9001 §8.6).', 'أدلة المطابقة لمعايير القبول وتتبع الشخص المخول بالإفراج (ISO 9001 §8.6).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '8.6' },
    sections: [ident, data('criteria', L('Acceptance criteria', 'Critères d\'acceptation', 'معايير القبول'), 'release_criteria'), data('releases', L('Release records', 'Enregistrements de libération', 'سجلات الإفراج'), 'releases')],
  },
  {
    code: 'TPL-CHANGE', category: 'operation', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-036', review: 'Per event', owner: 'ims_manager',
    name: L('Control of changes record', 'Enregistrement de maîtrise des modifications', 'سجل ضبط التغييرات'),
    description: L('Change requests with type, reason, impact and risk assessment, resources, approval, implementation, verification of effectiveness and post-change review (ISO 9001 §6.3, §8.5.6; ISO 14001 / 45001 §8.1).', 'Demandes de modification avec type, motif, évaluation de l\'impact et des risques, ressources, approbation, mise en œuvre, vérification de l\'efficacité et revue après changement (ISO 9001 §6.3, §8.5.6 ; ISO 14001 / 45001 §8.1).', 'طلبات التغيير مع النوع والسبب وتقييم الأثر والمخاطر والموارد والاعتماد والتنفيذ والتحقق من الفعالية والمراجعة بعد التغيير (ISO 9001 §6.3، §8.5.6؛ ISO 14001 / 45001 §8.1).'),
    mandatory: { 'ISO 9001': 'retain' }, clauses: { 'ISO 9001': '6.3, 8.5.6', 'ISO 14001': '8.1', 'ISO 45001': '8.1.3' },
    sections: [ident, data('process', L('How changes are controlled', 'Maîtrise des modifications', 'كيفية ضبط التغييرات'), 'change_process'), data('changes', L('Change requests', 'Demandes de modification', 'طلبات التغيير'), 'changes_full'), data('assessment', L('Impact and risk assessment', 'Évaluation de l\'impact et des risques', 'تقييم الأثر والمخاطر'), 'change_risk'), data('verification', L('Implementation and verification', 'Mise en œuvre et vérification', 'التنفيذ والتحقق'), 'change_verification'), data('steps', L('Changes recorded in the process steps', 'Modifications enregistrées dans les étapes', 'التغييرات المسجلة في الخطوات'), 'changes')],
  },
  // ---------------------------------------------------------------- HSE
  {
    code: 'TPL-ASPECTS', category: 'hse', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QHSE'], mp: 'MP-012', review: 'Semi-annual', owner: 'hse_manager',
    name: L('Environmental aspects and impacts register', 'Registre des aspects et impacts environnementaux', 'سجل الجوانب والآثار البيئية'),
    description: L('Activity, aspect, impact, condition (normal, abnormal, emergency), life-cycle stage, severity, frequency, significance, legal link and controls (ISO 14001 §6.1.2).', 'Activité, aspect, impact, condition (normale, anormale, urgence), étape du cycle de vie, gravité, fréquence, significativité, lien réglementaire et maîtrises (ISO 14001 §6.1.2).', 'النشاط والجانب والأثر والظرف (عادي، غير عادي، طارئ) ومرحلة دورة الحياة والشدة والتكرار والأهمية والارتباط القانوني والضوابط (ISO 14001 §6.1.2).'),
    mandatory: { 'ISO 14001': 'maintain' }, clauses: { 'ISO 14001': '6.1.2' },
    sections: [ident, data('aspects', L('Aspects and impacts', 'Aspects et impacts', 'الجوانب والآثار'), 'aspects_full'), data('method', L('Significance criteria', 'Critères de significativité', 'معايير الأهمية'), 'aspects_method')],
  },
  {
    code: 'TPL-HIRA', category: 'hse', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QHSE'], mp: 'MP-012', review: 'Semi-annual', owner: 'hse_manager',
    name: L('Hazard identification and risk assessment (HIRA)', 'Identification des dangers et évaluation des risques (DUER)', 'تحديد المخاطر وتقييمها'),
    description: L('Activity, hazard, harm, persons exposed, existing controls, likelihood × severity, additional controls following the hierarchy of controls, residual risk and owner (ISO 45001 §6.1.2, §8.1.2).', 'Activité, danger, dommage, personnes exposées, mesures existantes, probabilité × gravité, mesures complémentaires selon la hiérarchie des mesures, risque résiduel et responsable (ISO 45001 §6.1.2, §8.1.2).', 'النشاط والخطر والضرر والأشخاص المعرضون والضوابط القائمة والاحتمالية × الشدة والضوابط الإضافية وفق تسلسل الضوابط والمخاطر المتبقية والمسؤول (ISO 45001 §6.1.2، §8.1.2).'),
    mandatory: { 'ISO 45001': 'maintain' }, clauses: { 'ISO 45001': '6.1.2, 8.1.2' },
    sections: [ident, data('hazards', L('Hazards and risks', 'Dangers et risques', 'المخاطر والأخطار'), 'hazards_full'), data('hierarchy', L('Hierarchy of controls', 'Hiérarchie des mesures de maîtrise', 'تسلسل الضوابط'), 'hierarchy_controls'), data('method', L('Rating method', 'Méthode de cotation', 'طريقة التقييم'), 'risk_scale')],
  },
  {
    code: 'TPL-EPR', category: 'hse', docType: 'Plan', formats: ['DOCX', 'PDF'], toc: true, ms: ['QHSE'], mp: 'MP-052', review: 'Annual', owner: 'hse_manager',
    name: L('Emergency preparedness and response plan', 'Plan de préparation et de réponse aux situations d\'urgence', 'خطة التأهب والاستجابة للطوارئ'),
    description: L('Emergency scenarios and response, organization and roles, contacts, resources, drills and their evaluation (ISO 14001 §8.2, ISO 45001 §8.2).', 'Scénarios d\'urgence et réponse, organisation et rôles, contacts, moyens, exercices et leur évaluation (ISO 14001 §8.2, ISO 45001 §8.2).', 'سيناريوهات الطوارئ والاستجابة والتنظيم والأدوار وجهات الاتصال والموارد والتمارين وتقييمها (ISO 14001 §8.2، ISO 45001 §8.2).'),
    mandatory: { 'ISO 14001': 'maintain', 'ISO 45001': 'maintain' }, clauses: { 'ISO 14001': '8.2', 'ISO 45001': '8.2' },
    sections: [
      ident,
      purpose(L('Prepare {org} to respond to emergency situations at {city} and limit their consequences for people, the environment and the business.', 'Préparer {org} à répondre aux situations d\'urgence à {city} et à en limiter les conséquences pour les personnes, l\'environnement et l\'activité.', 'إعداد {org} للاستجابة لحالات الطوارئ في {city} والحد من عواقبها على الأشخاص والبيئة والنشاط.')),
      data('scenarios', L('Emergency scenarios and response', 'Scénarios d\'urgence et réponse', 'سيناريوهات الطوارئ والاستجابة'), 'epr_scenarios'),
      data('roles', L('Emergency organization and roles', 'Organisation et rôles en cas d\'urgence', 'تنظيم الطوارئ والأدوار'), 'epr_roles'),
      data('contacts', L('Emergency contacts', 'Contacts d\'urgence', 'جهات الاتصال في الطوارئ'), 'epr_contacts'),
      data('drills', L('Drills, incidents and lessons learned', 'Exercices, incidents et enseignements', 'التمارين والحوادث والدروس المستفادة'), 'incidents_full'),
      history, approval,
    ],
  },
  {
    code: 'TPL-INC', category: 'hse', docType: 'Report', formats: ['DOCX', 'PDF'], toc: false, ms: ['QHSE'], mp: 'MP-051', review: 'Per event', owner: 'hse_manager',
    name: L('Incident investigation report', 'Rapport d\'enquête sur incident', 'تقرير التحقيق في الحادث'),
    description: L('Facts, severity, immediate actions, root causes, corrective actions and lessons learned of incidents (ISO 45001 §10.2).', 'Faits, gravité, actions immédiates, causes racines, actions correctives et enseignements des incidents (ISO 45001 §10.2).', 'الوقائع والشدة والإجراءات الفورية والأسباب الجذرية والإجراءات التصحيحية والدروس المستفادة من الحوادث (ISO 45001 §10.2).'),
    mandatory: { 'ISO 45001': 'retain' }, clauses: { 'ISO 45001': '10.2' },
    sections: [ident, data('incidents', L('Incidents', 'Incidents', 'الحوادث'), 'incidents_full'), data('actions', L('Corrective actions', 'Actions correctives', 'الإجراءات التصحيحية'), 'actions_corrective'), approval],
  },
  // ---------------------------------------------------------------- Performance evaluation
  {
    code: 'TPL-KPI', category: 'performance', docType: 'Report', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-009', review: 'Monthly', owner: 'performance_manager',
    name: L('KPI dashboard and measurement results', 'Tableau de bord KPI et résultats de mesure', 'لوحة المؤشرات ونتائج القياس'),
    description: L('Indicator definitions (formula, unit, frequency, target, alert threshold, source, owner), results over six periods with trend and status, and the analysis of indicators off target (§9.1.1, §9.1.3).', 'Définition des indicateurs (formule, unité, fréquence, cible, seuil d\'alerte, source, responsable), résultats sur six périodes avec tendance et statut, et analyse des indicateurs hors cible (§9.1.1, §9.1.3).', 'تعريف المؤشرات (الصيغة والوحدة والتكرار والمستهدف وحد التنبيه والمصدر والمسؤول) والنتائج لست فترات مع الاتجاه والحالة وتحليل المؤشرات خارج المستهدف (§9.1.1، §9.1.3).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '9.1.1, 9.1.3', 'ISO 14001': '9.1.1', 'ISO 45001': '9.1.1' },
    sections: [ident, data('summary', T.summary, 'kpi_summary'), data('results', L('Results and trends', 'Résultats et tendances', 'النتائج والاتجاهات'), 'kpi_results'), data('analysis', L('Analysis of indicators off target', 'Analyse des indicateurs hors cible', 'تحليل المؤشرات خارج المستهدف'), 'kpi_analysis'), data('definitions', L('Indicator definitions', 'Définition des indicateurs', 'تعريف المؤشرات'), 'kpi_definitions')],
  },
  {
    code: 'TPL-AUDPRG', category: 'performance', docType: 'Plan', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-039', review: 'Annual', owner: 'audit_manager',
    name: L('Internal audit programme', 'Programme d\'audit interne', 'برنامج التدقيق الداخلي'),
    description: L('Objectives, extent and risks of the programme; audit frequency per process based on importance and past results; planned audits with scope, criteria, method, team and status; auditor qualification (§9.2.2, ISO 19011).', 'Objectifs, étendue et risques du programme ; fréquence d\'audit par processus selon l\'importance et les résultats antérieurs ; audits planifiés avec périmètre, critères, méthode, équipe et statut ; qualification des auditeurs (§9.2.2, ISO 19011).', 'أهداف البرنامج ونطاقه ومخاطره؛ تكرار التدقيق لكل عملية حسب الأهمية والنتائج السابقة؛ التدقيقات المخططة مع النطاق والمعايير والطريقة والفريق والحالة؛ تأهيل المدققين (§9.2.2، ISO 19011).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '9.2.2', 'ISO 14001': '9.2.2', 'ISO 45001': '9.2.2' },
    sections: [ident, data('programme', L('Programme objectives and extent', 'Objectifs et étendue du programme', 'أهداف البرنامج ونطاقه'), 'audprg_intro'), data('frequency', L('Audit frequency per process', 'Fréquence d\'audit par processus', 'تكرار التدقيق لكل عملية'), 'audit_universe'), data('audits', L('Audit programme', 'Programme d\'audit', 'برنامج التدقيق'), 'audits_full'), data('auditors', L('Auditors and qualification', 'Auditeurs et qualification', 'المدققون وتأهيلهم'), 'auditors'), data('legend', L('Frequency options', 'Options de fréquence', 'خيارات التكرار'), 'freq_legend'), approval],
  },
  {
    code: 'TPL-AUDREP', category: 'performance', docType: 'Report', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-039', review: 'Per event', owner: 'audit_manager', perAudit: true,
    name: L('Internal audit report', 'Rapport d\'audit interne', 'تقرير التدقيق الداخلي'),
    description: L('Audit identification, executive summary, strengths, nonconformities graded (major, minor), observations and opportunities for improvement with requirement, objective evidence, correction and due dates, conclusion and distribution (§9.2.2 f, ISO 19011 §6.5).', 'Identification de l\'audit, synthèse, points forts, non-conformités qualifiées (majeures, mineures), observations et pistes d\'amélioration avec exigence, preuve objective, correction et échéances, conclusion et diffusion (§9.2.2 f, ISO 19011 §6.5).', 'تعريف التدقيق والملخص التنفيذي ونقاط القوة وحالات عدم المطابقة المصنفة (رئيسية وثانوية) والملاحظات وفرص التحسين مع المتطلب والدليل الموضوعي والتصحيح والمواعيد والخلاصة والتوزيع (§9.2.2 و، ISO 19011 §6.5).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '9.2.2', 'ISO 14001': '9.2.2', 'ISO 45001': '9.2.2' },
    sections: [
      data('audit', L('Audit identification', 'Identification de l\'audit', 'تعريف التدقيق'), 'audit_header'),
      data('summary', L('Executive summary', 'Synthèse', 'الملخص التنفيذي'), 'audit_summary'),
      data('strengths', L('Strengths', 'Points forts', 'نقاط القوة'), 'audit_strengths'),
      data('findings', L('Summary of findings', 'Synthèse des constats', 'ملخص الملاحظات'), 'audit_findings'),
      data('ncs', L('Nonconformities — detailed report', 'Non-conformités — rapport détaillé', 'حالات عدم المطابقة — تقرير مفصل'), 'audit_nc_detail'),
      data('others', L('Observations and opportunities for improvement', 'Observations et pistes d\'amélioration', 'الملاحظات وفرص التحسين'), 'audit_ofi'),
      data('grading', L('Grading of findings', 'Qualification des constats', 'تصنيف الملاحظات'), 'finding_grading'),
      data('conclusion', L('Audit conclusion and follow-up', 'Conclusion de l\'audit et suivi', 'خلاصة التدقيق والمتابعة'), 'audit_conclusion'),
      approval,
    ],
  },
  {
    code: 'TPL-MR', category: 'performance', docType: 'Report', formats: ['DOCX', 'PDF'], toc: true, ms: ['QMS', 'QHSE'], mp: 'MP-034', review: 'Per event', owner: 'ims_manager',
    name: L('Management review minutes', 'Compte rendu de revue de direction', 'محضر مراجعة الإدارة'),
    description: L('Meeting identification and attendance, agenda, every input required by §9.3.2 with its status and trend, the outputs required by §9.3.3 (decisions on improvement, changes and resources), conclusions on suitability, adequacy and effectiveness, and signatures.', 'Identification de la réunion et présence, ordre du jour, chaque élément d\'entrée exigé par le §9.3.2 avec son état et sa tendance, les éléments de sortie exigés par le §9.3.3 (décisions d\'amélioration, de modification et de ressources), conclusions sur la pertinence, l\'adéquation et l\'efficacité, et signatures.', 'تعريف الاجتماع والحضور وجدول الأعمال وكل مدخل مطلوب في §9.3.2 مع حالته واتجاهه والمخرجات المطلوبة في §9.3.3 (قرارات التحسين والتغيير والموارد) والاستنتاجات حول الملاءمة والكفاية والفعالية والتوقيعات.'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '9.3', 'ISO 14001': '9.3', 'ISO 45001': '9.3' },
    sections: [
      data('meeting', L('Meeting identification and attendance', 'Identification de la réunion et participants', 'تعريف الاجتماع والحضور'), 'mr_header'),
      data('agenda', L('Agenda', 'Ordre du jour', 'جدول الأعمال'), 'mr_agenda'),
      data('inputs', L('Review inputs (§9.3.2)', 'Éléments d\'entrée (§9.3.2)', 'مدخلات المراجعة (§9.3.2)'), 'mr_inputs'),
      data('kpis', L('Process performance and conformity', 'Performance des processus et conformité', 'أداء العمليات والمطابقة'), 'kpi_results_short'),
      data('objectives', L('Extent to which objectives have been met', 'Degré de réalisation des objectifs', 'مدى تحقيق الأهداف'), 'objectives_full'),
      data('audits', L('Audit results', 'Résultats d\'audit', 'نتائج التدقيق'), 'findings'),
      data('ncs', L('Nonconformities and corrective actions', 'Non-conformités et actions correctives', 'حالات عدم المطابقة والإجراءات التصحيحية'), 'ncs_short'),
      data('suppliers', L('Performance of external providers', 'Performance des prestataires externes', 'أداء مقدمي الخدمات الخارجيين'), 'supplier_perf'),
      data('risks', L('Effectiveness of actions on risks and opportunities', 'Efficacité des actions face aux risques et opportunités', 'فعالية الإجراءات تجاه المخاطر والفرص'), 'risks_top'),
      data('decisions', L('Review outputs: decisions and actions (§9.3.3)', 'Éléments de sortie : décisions et actions (§9.3.3)', 'مخرجات المراجعة: القرارات والإجراءات (§9.3.3)'), 'mr_outputs'),
      data('conclusion', L('Conclusions on the management system', 'Conclusions sur le système de management', 'الاستنتاجات حول نظام الإدارة'), 'mr_conclusion'),
      approval,
    ],
  },
  // ---------------------------------------------------------------- Improvement
  {
    code: 'TPL-NC', category: 'improvement', docType: 'Register', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-021', review: 'Monthly', owner: 'quality_manager',
    name: L('Nonconformity and corrective action register', 'Registre des non-conformités et actions correctives', 'سجل حالات عدم المطابقة والإجراءات التصحيحية'),
    description: L('Nature of nonconformities, source, criticality, correction, root cause, corrective actions, due dates, effectiveness and closure (§10.2.2).', 'Nature des non-conformités, source, criticité, correction, cause racine, actions correctives, échéances, efficacité et clôture (§10.2.2).', 'طبيعة حالات عدم المطابقة ومصدرها وخطورتها والتصحيح والسبب الجذري والإجراءات التصحيحية والمواعيد والفعالية والإغلاق (§10.2.2).'),
    mandatory: { 'ISO 9001': 'retain', 'ISO 14001': 'retain', 'ISO 45001': 'retain' }, clauses: { 'ISO 9001': '10.2.2', 'ISO 14001': '10.2.2', 'ISO 45001': '10.2.2' },
    sections: [ident, data('summary', T.summary, 'nc_summary'), data('ncs', L('Nonconformities', 'Non-conformités', 'حالات عدم المطابقة'), 'ncs_full'), data('actions', L('Corrective actions', 'Actions correctives', 'الإجراءات التصحيحية'), 'actions_corrective')],
  },
  {
    code: 'TPL-CAPA', category: 'improvement', docType: 'Report', formats: ['DOCX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-020', review: 'Per event', owner: 'quality_manager', perNc: true,
    name: L('Corrective action report (8D)', 'Rapport d\'action corrective (8D)', 'تقرير الإجراء التصحيحي (8D)'),
    description: L('Eight disciplines for one major nonconformity: D0 identification, D1 team, D2 problem (5W2H), D3 containment, D4 root cause (Ishikawa, 5 Whys, occurrence and non-detection), D5–D6 corrective actions and validation, D7 prevention, D8 closure and lessons learned.', 'Huit disciplines pour une non-conformité majeure : D0 identification, D1 équipe, D2 problème (QQOQCCP), D3 confinement, D4 cause racine (Ishikawa, 5 pourquoi, apparition et non-détection), D5–D6 actions correctives et validation, D7 prévention, D8 clôture et enseignements.', 'التخصصات الثمانية لحالة عدم مطابقة رئيسية: D0 التعريف، D1 الفريق، D2 المشكلة (5W2H)، D3 الاحتواء، D4 السبب الجذري (إيشيكاوا، لماذا الخمسة، الحدوث وعدم الاكتشاف)، D5–D6 الإجراءات التصحيحية والتحقق، D7 الوقاية، D8 الإغلاق والدروس المستفادة.'),
    mandatory: {}, clauses: { 'ISO 9001': '10.2' },
    sections: [
      data('d0', L('D0 — Identification', 'D0 — Identification', 'D0 — التعريف'), 'capa_d0'),
      data('d1', L('D1 — Team', 'D1 — Équipe', 'D1 — الفريق'), 'capa_d1'),
      data('d2', L('D2 — Problem description (5W2H)', 'D2 — Description du problème (QQOQCCP)', 'D2 — وصف المشكلة (5W2H)'), 'capa_d2'),
      data('d3', L('D3 — Containment actions', 'D3 — Actions de confinement', 'D3 — إجراءات الاحتواء'), 'capa_d3'),
      data('d4', L('D4 — Root cause analysis', 'D4 — Analyse des causes racines', 'D4 — تحليل السبب الجذري'), 'capa_d4'),
      data('d5', L('D5–D6 — Corrective actions and validation', 'D5–D6 — Actions correctives et validation', 'D5–D6 — الإجراءات التصحيحية والتحقق'), 'capa_d5'),
      data('d7', L('D7 — Prevention of recurrence', 'D7 — Prévention de la récurrence', 'D7 — منع التكرار'), 'capa_d7'),
      data('d8', L('D8 — Closure and lessons learned', 'D8 — Clôture et enseignements', 'D8 — الإغلاق والدروس المستفادة'), 'capa_d8'),
      approval,
    ],
  },
  {
    code: 'TPL-IMP', category: 'improvement', docType: 'Plan', formats: ['XLSX', 'PDF'], toc: false, ms: ['QMS', 'QHSE'], mp: 'MP-023', review: 'Quarterly', owner: 'transformation_manager',
    name: L('Improvement plan', 'Plan d\'amélioration', 'خطة التحسين'),
    description: L('Improvement opportunities with source, expected gain, ROI, effort, priority, owner, status and results, and the improvement actions (§10.1, §10.3).', 'Pistes d\'amélioration avec source, gain attendu, ROI, effort, priorité, responsable, statut et résultats, et actions d\'amélioration (§10.1, §10.3).', 'فرص التحسين مع المصدر والعائد المتوقع ونسبة العائد والجهد والأولوية والمسؤول والحالة والنتائج وإجراءات التحسين (§10.1، §10.3).'),
    mandatory: {}, clauses: { 'ISO 9001': '10.1, 10.3', 'ISO 14001': '10.3', 'ISO 45001': '10.3' },
    sections: [ident, data('ideas', L('Improvement opportunities', 'Pistes d\'amélioration', 'فرص التحسين'), 'ideas_full'), data('actions', L('Improvement actions', 'Actions d\'amélioration', 'إجراءات التحسين'), 'actions_improvement')],
  },
];

export const templateByCode = Object.fromEntries(DOC_TEMPLATES.map(t => [t.code, t]));

// Templates suggested for a macro process (used by the "Generate document" button of a step).
export function templatesForMp(mpId, msType) {
  return DOC_TEMPLATES.filter(t => t.mp === mpId && t.ms.includes(msType));
}
