// Trilingual text pools for the records created during each full run: KPIs,
// nonconformities, audits, documents and registers. Fictional demonstration data.
import { S } from './text.js';

// Extra KPIs so every project measures its core results even where the catalog
// KPIs are process-design KPIs.
export const QMS_KPIS = [
  { code: 'Q-KPI-01', name: S('Customer satisfaction index', 'Indice de satisfaction client', 'مؤشر رضا العملاء'), formula: S('Average survey score / 5 x 100', 'Score moyen de l\'enquête / 5 x 100', 'متوسط درجة الاستبيان / 5 × 100'), unit: '%', target: '>= 85%', owner: 'quality_manager', mp: 'MP-035' },
  { code: 'Q-KPI-02', name: S('On-time delivery rate', 'Taux de livraison à l\'heure', 'معدل التسليم في الموعد'), formula: S('Orders delivered on time / orders delivered x 100', 'Commandes livrées à l\'heure / commandes livrées x 100', 'الطلبات المسلّمة في موعدها / الطلبات المسلّمة × 100'), unit: '%', target: '>= 95%', owner: 'operations_manager', mp: 'MP-033' },
  { code: 'Q-KPI-03', name: S('First pass yield', 'Rendement au premier passage', 'نسبة النجاح من المرة الأولى'), formula: S('Units right first time / units produced x 100', 'Unités bonnes du premier coup / unités produites x 100', 'الوحدات السليمة من المرة الأولى / الوحدات المنتجة × 100'), unit: '%', target: '>= 97%', owner: 'operations_manager', mp: 'MP-007' },
  { code: 'Q-KPI-04', name: S('Cost of poor quality', 'Coût de la non-qualité', 'تكلفة ضعف الجودة'), formula: S('Internal + external failure costs / revenue x 100', 'Coûts des défaillances internes + externes / chiffre d\'affaires x 100', 'تكاليف الإخفاق الداخلي والخارجي / الإيرادات × 100'), unit: '%', target: '<= 2%', owner: 'quality_manager', mp: 'MP-032' },
  { code: 'Q-KPI-05', name: S('Corrective actions closed on time', 'Actions correctives clôturées dans les délais', 'الإجراءات التصحيحية المغلقة في موعدها'), formula: S('CAs closed by due date / CAs due x 100', 'AC clôturées à l\'échéance / AC échues x 100', 'الإجراءات المغلقة في موعدها / الإجراءات المستحقة × 100'), unit: '%', target: '>= 90%', owner: 'quality_manager', mp: 'MP-021' },
];
export const HSE_KPIS = [
  { code: 'H-KPI-01', name: S('Lost time injury frequency rate (LTIFR)', 'Taux de fréquence des accidents avec arrêt (TF1)', 'معدل تكرار الإصابات المضيّعة للوقت (LTIFR)'), formula: S('Lost time injuries x 1,000,000 / hours worked', 'Accidents avec arrêt x 1 000 000 / heures travaillées', 'الإصابات المضيّعة للوقت × 1,000,000 / ساعات العمل'), unit: '', target: '<= 1.5', owner: 'hse_manager', mp: 'MP-012' },
  { code: 'H-KPI-02', name: S('Near-miss reports per 100 employees', 'Presque-accidents déclarés pour 100 salariés', 'بلاغات الحوادث الوشيكة لكل 100 موظف'), formula: S('Near-miss reports / headcount x 100', 'Déclarations de presque-accidents / effectif x 100', 'بلاغات الحوادث الوشيكة / عدد الموظفين × 100'), unit: '', target: '>= 12', owner: 'hse_manager', mp: 'MP-012' },
  { code: 'H-KPI-03', name: S('Energy intensity', 'Intensité énergétique', 'كثافة استهلاك الطاقة'), formula: S('kWh consumed / production units', 'kWh consommés / unités produites', 'الكيلوواط ساعة المستهلكة / وحدات الإنتاج'), unit: 'kWh/u', target: '<= 4.2', owner: 'esg_manager', mp: 'MP-067' },
  { code: 'H-KPI-04', name: S('Waste recycling rate', 'Taux de valorisation des déchets', 'معدل إعادة تدوير النفايات'), formula: S('Waste recycled / total waste x 100', 'Déchets valorisés / total des déchets x 100', 'النفايات المعاد تدويرها / إجمالي النفايات × 100'), unit: '%', target: '>= 70%', owner: 'hse_manager', mp: 'MP-067' },
  { code: 'H-KPI-05', name: S('HSE training completion', 'Réalisation des formations HSE', 'إنجاز التدريب على الصحة والسلامة والبيئة'), formula: S('HSE trainings completed / planned x 100', 'Formations HSE réalisées / prévues x 100', 'التدريبات المنجزة / المخطط لها × 100'), unit: '%', target: '>= 95%', owner: 'hr_manager', mp: 'MP-013' },
];

export const NC_SOURCES = {
  Customer: S('Customer complaint', 'Réclamation client', 'شكوى عميل'),
  Audit: S('Internal audit', 'Audit interne', 'تدقيق داخلي'),
  Process: S('Process control', 'Contrôle process', 'ضبط العملية'),
  Supplier: S('Supplier', 'Fournisseur', 'مورد'),
  Incident: S('HSE incident', 'Incident HSE', 'حادث صحة وسلامة وبيئة'),
};
export const CRIT = { Minor: S('Minor', 'Mineure', 'ثانوية'), Major: S('Major', 'Majeure', 'رئيسية'), Critical: S('Critical', 'Critique', 'حرجة') };

export const NC_GENERIC = [
  { t: S('Calibration overdue on measuring device {0}', 'Étalonnage échu sur l\'instrument de mesure {0}', 'تجاوز موعد معايرة جهاز القياس {0}'), src: 'Audit', cat: 'Metrology' },
  { t: S('Obsolete work instruction found at {0}', 'Instruction de travail obsolète trouvée au poste {0}', 'العثور على تعليمات عمل متقادمة في {0}'), src: 'Audit', cat: 'Documentation' },
  { t: S('Late delivery of {0} batch', 'Livraison tardive du lot de {0}', 'تأخر تسليم دفعة {0}'), src: 'Supplier', cat: 'Supplier' },
  { t: S('Training record missing for new operator on {0}', 'Enregistrement de formation manquant pour un nouvel opérateur sur {0}', 'غياب سجل تدريب مشغّل جديد على {0}'), src: 'Audit', cat: 'Competence' },
  { t: S('Customer returned {0} for labelling error', 'Retour client de {0} pour erreur d\'étiquetage', 'إرجاع العميل {0} بسبب خطأ في الوسم'), src: 'Customer', cat: 'Product' },
];
export const NC_HSE = [
  { t: S('Near miss: forklift and pedestrian at {0}', 'Presque-accident : chariot et piéton à {0}', 'حادث وشيك: رافعة شوكية وأحد المشاة في {0}'), src: 'Incident', cat: 'OH&S' },
  { t: S('Oil spill in chemical storage area', 'Déversement d\'huile dans la zone de stockage chimique', 'انسكاب زيت في منطقة تخزين المواد الكيميائية'), src: 'Incident', cat: 'Environment' },
  { t: S('PPE not worn during maintenance on {0}', 'EPI non porté lors de la maintenance sur {0}', 'عدم ارتداء معدات الوقاية أثناء صيانة {0}'), src: 'Incident', cat: 'OH&S' },
  { t: S('Waste segregation not respected at {0}', 'Tri des déchets non respecté à {0}', 'عدم احترام فرز النفايات في {0}'), src: 'Audit', cat: 'Environment' },
];
export const NC_DESC = S('Detected on {0} at {1}. Immediate containment applied and affected items segregated.', 'Détectée le {0} à {1}. Confinement immédiat appliqué et éléments concernés isolés.', 'تم الكشف في {0} في {1}. طُبّق الاحتواء الفوري وعُزلت العناصر المتأثرة.');
export const CAUSES = [
  S('Work instruction not updated after change', 'Instruction de travail non mise à jour après modification', 'عدم تحديث تعليمات العمل بعد التغيير'),
  S('Insufficient training of new operators', 'Formation insuffisante des nouveaux opérateurs', 'تدريب غير كافٍ للمشغلين الجدد'),
  S('Supplier batch variation not detected at receiving', 'Variation du lot fournisseur non détectée à la réception', 'عدم اكتشاف تباين دفعة المورد عند الاستلام'),
  S('Preventive maintenance interval too long', 'Intervalle de maintenance préventive trop long', 'فترة الصيانة الوقائية طويلة جدًا'),
  S('Unclear responsibility at shift handover', 'Responsabilité floue lors de la relève d\'équipe', 'غموض المسؤولية عند تسليم المناوبة'),
];
export const ACTION_TITLES = {
  containment: S('Contain and sort: {0}', 'Confiner et trier : {0}', 'احتواء وفرز: {0}'),
  corrective: S('Eliminate root cause: {0}', 'Éliminer la cause racine : {0}', 'إزالة السبب الجذري: {0}'),
  preventive: S('Extend the fix to similar lines: {0}', 'Étendre la solution aux lignes similaires : {0}', 'تعميم الحل على الخطوط المماثلة: {0}'),
  finding: S('Address audit finding: {0}', 'Traiter le constat d\'audit : {0}', 'معالجة ملاحظة التدقيق: {0}'),
  risk: S('Treat risk: {0}', 'Traiter le risque : {0}', 'معالجة المخاطر: {0}'),
  idea: S('Implement improvement: {0}', 'Mettre en œuvre l\'amélioration : {0}', 'تنفيذ التحسين: {0}'),
  objective: S('Deliver objective: {0}', 'Atteindre l\'objectif : {0}', 'تحقيق الهدف: {0}'),
};
export const VERDICT = {
  Effective: S('Effective — no recurrence over three months', 'Efficace — aucune récurrence sur trois mois', 'فعّال — لا تكرار خلال ثلاثة أشهر'),
  'Partially effective': S('Partially effective — one recurrence, action extended', 'Partiellement efficace — une récurrence, action prolongée', 'فعّال جزئيًا — تكرار واحد، وتم تمديد الإجراء'),
};
export const REX = {
  well: S('Fast containment and clear ownership', 'Confinement rapide et responsabilités claires', 'احتواء سريع ووضوح في المسؤوليات'),
  notWell: S('Detection came late in the process', 'Détection tardive dans le processus', 'جاء الاكتشاف متأخرًا في العملية'),
  rec: S('Add a check at the step where the defect originates', 'Ajouter un contrôle à l\'étape d\'origine du défaut', 'إضافة فحص في الخطوة التي ينشأ فيها العيب'),
};

export const AUDIT_TYPES = {
  Internal: S('Internal audit', 'Audit interne', 'تدقيق داخلي'),
  Supplier: S('Supplier audit', 'Audit fournisseur', 'تدقيق المورد'),
  Mock: S('Mock certification audit', 'Audit à blanc de certification', 'تدقيق اعتماد تجريبي'),
  Certification: S('Certification audit (stage 2)', 'Audit de certification (étape 2)', 'تدقيق الاعتماد (المرحلة 2)'),
  Surveillance: S('Surveillance audit', 'Audit de surveillance', 'تدقيق المتابعة'),
};
export const AUDIT_TITLE = S('{0} — {1}', '{0} — {1}', '{0} — {1}');
export const FINDING_TYPES = { Major: S('Major nonconformity', 'Non-conformité majeure', 'عدم مطابقة رئيسية'), Minor: S('Minor nonconformity', 'Non-conformité mineure', 'عدم مطابقة ثانوية'), Observation: S('Observation', 'Observation', 'ملاحظة'), OFI: S('Opportunity for improvement', 'Piste d\'amélioration', 'فرصة للتحسين') };
export const FINDINGS = [
  { clause: '7.5.3', t: S('Two controlled documents at {0} had no revision status', 'Deux documents maîtrisés à {0} sans statut de révision', 'وثيقتان مضبوطتان في {0} بدون حالة المراجعة') },
  { clause: '8.5.1', t: S('Control plan for {0} not updated after process change', 'Plan de surveillance de {0} non mis à jour après modification', 'خطة ضبط {0} لم تُحدَّث بعد تغيير العملية') },
  { clause: '9.1.3', t: S('KPI trend analysis not documented for two months', 'Analyse de tendance des KPI non documentée sur deux mois', 'عدم توثيق تحليل اتجاه المؤشرات لشهرين') },
  { clause: '7.2', t: S('Competence evidence missing for one auditor', 'Preuve de compétence manquante pour un auditeur', 'غياب دليل الكفاءة لأحد المدققين') },
  { clause: '10.2', t: S('Root cause analysis stopped at the first why', 'Analyse des causes arrêtée au premier pourquoi', 'توقف تحليل السبب الجذري عند السؤال الأول') },
  { clause: '8.4.1', t: S('Supplier of {0} evaluated without delivery data', 'Fournisseur de {0} évalué sans données de livraison', 'تقييم مورد {0} دون بيانات التسليم') },
];
export const FINDINGS_HSE = [
  { clause: '6.1.2', t: S('Hazard identification not reviewed after new equipment on {0}', 'Identification des dangers non revue après nouvel équipement sur {0}', 'عدم مراجعة تحديد المخاطر بعد تركيب معدات جديدة في {0}') },
  { clause: '8.2', t: S('Emergency drill report without follow-up actions', 'Rapport d\'exercice d\'urgence sans actions de suivi', 'تقرير تمرين الطوارئ دون إجراءات متابعة') },
  { clause: '9.1.2', t: S('Compliance evaluation for air emissions overdue', 'Évaluation de conformité des rejets atmosphériques échue', 'تجاوز موعد تقييم الامتثال لانبعاثات الهواء') },
];

export const DOCS = {
  policyQ: S('Quality Policy', 'Politique qualité', 'سياسة الجودة'),
  policyI: S('Integrated QHSE Policy', 'Politique QHSE intégrée', 'سياسة الجودة والصحة والسلامة والبيئة المتكاملة'),
  manual: S('Management System Manual', 'Manuel du système de management', 'دليل نظام الإدارة'),
  procedure: S('Procedure — {0}', 'Procédure — {0}', 'إجراء — {0}'),
  sheet: S('Macro process sheet — {0}', 'Fiche macro-processus — {0}', 'بطاقة العملية الكلية — {0}'),
  map: S('Process map', 'Cartographie des processus', 'خريطة العمليات'),
  controlPlan: S('Control plan — {0}', 'Plan de surveillance — {0}', 'خطة الضبط — {0}'),
  matrix: S('{0} compliance matrix', 'Matrice de conformité {0}', 'مصفوفة الامتثال لـ {0}'),
  hira: S('Hazard identification and risk assessment (HIRA)', 'Identification des dangers et évaluation des risques', 'تحديد المخاطر وتقييمها'),
  aspects: S('Environmental aspects and impacts register', 'Registre des aspects et impacts environnementaux', 'سجل الجوانب والآثار البيئية'),
  emergency: S('Emergency preparedness and response plan', 'Plan de préparation et de réponse aux urgences', 'خطة التأهب والاستجابة للطوارئ'),
  auditReport: S('Internal audit report — {0}', 'Rapport d\'audit interne — {0}', 'تقرير التدقيق الداخلي — {0}'),
  capa: S('Corrective action report (8D) — {0}', 'Rapport d\'action corrective (8D) — {0}', 'تقرير الإجراء التصحيحي (8D) — {0}'),
  legal: S('Legal and other requirements register', 'Registre des exigences légales et autres', 'سجل المتطلبات القانونية وغيرها'),
};
export const DOC_TYPES = { Policy: S('Policy', 'Politique', 'سياسة'), Manual: S('Manual', 'Manuel', 'دليل'), Procedure: S('Procedure', 'Procédure', 'إجراء'), Sheet: S('Process sheet', 'Fiche processus', 'بطاقة عملية'), Map: S('Process map', 'Cartographie', 'خريطة'), Plan: S('Plan', 'Plan', 'خطة'), Register: S('Register', 'Registre', 'سجل') };
export const DOC_CONTENT = S(
  'Purpose: define how {0} is managed at {1}. Scope: {2}. Responsibilities: the process owner approves, the Document Controller publishes. Requirements covered: {3}.',
  'Objet : définir la maîtrise de {0} chez {1}. Domaine d\'application : {2}. Responsabilités : le propriétaire du processus approuve, le gestionnaire documentaire publie. Exigences couvertes : {3}.',
  'الغرض: تحديد كيفية إدارة {0} لدى {1}. النطاق: {2}. المسؤوليات: يعتمد مالك العملية، وينشر مراقب الوثائق. المتطلبات المشمولة: {3}.');
export const POLICY_Q = S(
  '{0} commits to satisfy customer and applicable requirements for {1}, to set and review quality objectives, and to continually improve its quality management system ({2}).',
  '{0} s\'engage à satisfaire les exigences des clients et les exigences applicables pour {1}, à fixer et revoir ses objectifs qualité et à améliorer en continu son système de management de la qualité ({2}).',
  'تلتزم {0} بتلبية متطلبات العملاء والمتطلبات المنطبقة على {1}، وبوضع أهداف الجودة ومراجعتها، وبالتحسين المستمر لنظام إدارة الجودة ({2}).');
export const POLICY_I = S(
  '{0} commits to deliver compliant {1}, to prevent injury and ill health, to protect the environment and prevent pollution, to fulfil compliance obligations, to consult workers, and to continually improve its integrated management system ({2}).',
  '{0} s\'engage à fournir des {1} conformes, à prévenir les traumatismes et pathologies, à protéger l\'environnement et prévenir la pollution, à respecter ses obligations de conformité, à consulter les travailleurs et à améliorer en continu son système de management intégré ({2}).',
  'تلتزم {0} بتقديم {1} مطابقة، ومنع الإصابات والأمراض المهنية، وحماية البيئة ومنع التلوث، والوفاء بالتزامات الامتثال، واستشارة العاملين، والتحسين المستمر لنظام الإدارة المتكامل ({2}).');
export const CHANGE = {
  New: S('New document', 'Nouveau document', 'وثيقة جديدة'),
  Minor: S('Minor revision after internal audit', 'Révision mineure après audit interne', 'مراجعة طفيفة بعد التدقيق الداخلي'),
  Major: S('Major revision after management review', 'Révision majeure après revue de direction', 'مراجعة رئيسية بعد مراجعة الإدارة'),
};

export const REG = {
  issueExt: S('External', 'Externe', 'خارجي'), issueInt: S('Internal', 'Interne', 'داخلي'),
  pestle: [S('Political', 'Politique', 'سياسي'), S('Economic', 'Économique', 'اقتصادي'), S('Social', 'Social', 'اجتماعي'), S('Technological', 'Technologique', 'تقني'), S('Legal', 'Légal', 'قانوني'), S('Environmental', 'Environnemental', 'بيئي')],
  parties: [
    [S('Customers ({0})', 'Clients ({0})', 'العملاء ({0})'), S('Conforming {0} delivered on time', '{0} conformes livrés à temps', 'تسليم {0} مطابقة في الموعد')],
    [S('Employees', 'Salariés', 'الموظفون'), S('Safe workplace, training and fair recognition', 'Lieu de travail sûr, formation et reconnaissance', 'بيئة عمل آمنة وتدريب وتقدير عادل')],
    [S('Regulators', 'Autorités réglementaires', 'الجهات التنظيمية'), S('Compliance with licences and reporting duties', 'Respect des autorisations et obligations de déclaration', 'الامتثال للتراخيص والتزامات الإبلاغ')],
    [S('Suppliers of {0}', 'Fournisseurs de {0}', 'موردو {0}'), S('Clear specifications and payment on time', 'Spécifications claires et paiement à l\'échéance', 'مواصفات واضحة وسداد في الموعد')],
    [S('Shareholders', 'Actionnaires', 'المساهمون'), S('Sustainable margin and certification maintained', 'Marge durable et certification maintenue', 'هامش مستدام والحفاظ على الاعتماد')],
    [S('Local community', 'Communauté locale', 'المجتمع المحلي'), S('No nuisance and local employment', 'Absence de nuisances et emploi local', 'عدم الإزعاج وتوفير فرص العمل المحلية')],
  ],
  objectives: [
    [S('Raise customer satisfaction to {0}', 'Porter la satisfaction client à {0}', 'رفع رضا العملاء إلى {0}'), 'Q-KPI-01'],
    [S('Reach on-time delivery of {0}', 'Atteindre une livraison à l\'heure de {0}', 'تحقيق تسليم في الموعد بنسبة {0}'), 'Q-KPI-02'],
    [S('Cut cost of poor quality to {0}', 'Réduire le coût de la non-qualité à {0}', 'خفض تكلفة ضعف الجودة إلى {0}'), 'Q-KPI-04'],
    [S('Close corrective actions on time at {0}', 'Clôturer les actions correctives à temps à {0}', 'إغلاق الإجراءات التصحيحية في موعدها بنسبة {0}'), 'Q-KPI-05'],
  ],
  objectivesHse: [
    [S('Keep LTIFR at or below {0}', 'Maintenir le TF1 à {0} ou moins', 'الإبقاء على LTIFR عند {0} أو أقل'), 'H-KPI-01'],
    [S('Recycle {0} of waste', 'Valoriser {0} des déchets', 'إعادة تدوير {0} من النفايات'), 'H-KPI-04'],
    [S('Reduce energy intensity to {0}', 'Réduire l\'intensité énergétique à {0}', 'خفض كثافة الطاقة إلى {0}'), 'H-KPI-03'],
  ],
  obligationsHse: [
    S('National labour code — occupational health and safety chapter', 'Code du travail — chapitre santé et sécurité au travail', 'مدونة الشغل — باب الصحة والسلامة المهنية'),
    S('Environmental permit — air emissions and wastewater limits', 'Autorisation environnementale — limites d\'émissions et de rejets', 'الترخيص البيئي — حدود الانبعاثات والمياه العادمة'),
    S('Hazardous waste transport and disposal regulation', 'Réglementation du transport et de l\'élimination des déchets dangereux', 'تنظيم نقل النفايات الخطرة والتخلص منها'),
  ],
  certBody: S('Meridian Certification Services (fictional)', 'Meridian Certification Services (fictif)', 'ميريديان لخدمات الاعتماد (خيالي)'),
  supplierNames: [S('{0} — Supplier A', '{0} — Fournisseur A', '{0} — المورد أ'), S('{0} — Supplier B', '{0} — Fournisseur B', '{0} — المورد ب'), S('Packaging supplier', 'Fournisseur d\'emballages', 'مورد التغليف'), S('Logistics provider', 'Prestataire logistique', 'مزوّد الخدمات اللوجستية'), S('Calibration laboratory', 'Laboratoire d\'étalonnage', 'مختبر المعايرة')],
  ideas: [
    S('Digitize {0} records on tablets', 'Numériser les enregistrements de {0} sur tablettes', 'رقمنة سجلات {0} على الأجهزة اللوحية'),
    S('Poka-yoke on {0}', 'Détrompeur sur {0}', 'نظام منع الخطأ في {0}'),
    S('Supplier scorecard shared monthly', 'Tableau de bord fournisseurs partagé chaque mois', 'بطاقة أداء الموردين تُشارك شهريًا'),
    S('Visual management board at {0}', 'Tableau de management visuel à {0}', 'لوحة الإدارة المرئية في {0}'),
    S('Reduce changeover time on {0}', 'Réduire le temps de changement de série sur {0}', 'تقليص زمن التبديل في {0}'),
  ],
  competences: [
    [S('Internal auditing (ISO 19011)', 'Audit interne (ISO 19011)', 'التدقيق الداخلي (ISO 19011)'), 'audit_manager'],
    [S('Root cause analysis', 'Analyse des causes racines', 'تحليل السبب الجذري'), 'quality_manager'],
    [S('Risk assessment', 'Évaluation des risques', 'تقييم المخاطر'), 'risk_manager'],
    [S('Document control', 'Maîtrise documentaire', 'ضبط الوثائق'), 'document_controller'],
    [S('Process performance analysis', 'Analyse de la performance des processus', 'تحليل أداء العمليات'), 'performance_manager'],
  ],
  competencesHse: [
    [S('Hazard identification', 'Identification des dangers', 'تحديد المخاطر'), 'hse_manager'],
    [S('Emergency response', 'Intervention d\'urgence', 'الاستجابة للطوارئ'), 'operations_manager'],
  ],
  incidents: [
    [S('Near miss', 'Presque-accident', 'حادث وشيك'), S('Forklift reversing without spotter at {0}', 'Chariot en marche arrière sans guide à {0}', 'رافعة شوكية ترجع دون موجّه في {0}')],
    [S('First aid case', 'Soins de premiers secours', 'حالة إسعاف أولي'), S('Minor cut during handling on {0}', 'Coupure légère lors d\'une manutention sur {0}', 'جرح طفيف أثناء المناولة في {0}')],
    [S('Environmental incident', 'Incident environnemental', 'حادث بيئي'), S('Small hydraulic oil leak contained at {0}', 'Petite fuite d\'huile hydraulique contenue à {0}', 'احتواء تسرب صغير لزيت هيدروليكي في {0}')],
  ],
  equipment: [S('Torque wrench', 'Clé dynamométrique', 'مفتاح عزم'), S('Digital caliper', 'Pied à coulisse numérique', 'قدمة رقمية'), S('Temperature logger', 'Enregistreur de température', 'مسجّل درجة الحرارة'), S('Pressure gauge', 'Manomètre', 'مقياس الضغط')],
  reviewTitle: S('Management review {0}', 'Revue de direction {0}', 'مراجعة الإدارة {0}'),
  reviewOut: S('Objectives confirmed; resources approved for {0}; two improvement actions opened.', 'Objectifs confirmés ; ressources approuvées pour {0} ; deux actions d\'amélioration ouvertes.', 'تأكيد الأهداف؛ اعتماد الموارد لـ {0}؛ فتح إجراءين للتحسين.'),
};

export const PROJECT_TEXT = {
  nameQ: S('QMS full run {0} — {1}', 'Déploiement complet SMQ {0} — {1}', 'التشغيل الكامل لنظام إدارة الجودة {0} — {1}'),
  nameH: S('QHSE full run {0} — {1}', 'Déploiement complet QHSE {0} — {1}', 'التشغيل الكامل لنظام الجودة والصحة والسلامة والبيئة {0} — {1}'),
  desc: S('End-to-end lifecycle of the {0} management system for {1}: {2} macro processes across {3} E2E phases. Standards: {4}.',
    'Cycle de vie de bout en bout du système de management {0} pour {1} : {2} macro-processus répartis sur {3} phases E2E. Normes : {4}.',
    'دورة الحياة الكاملة لنظام الإدارة {0} لـ {1}: {2} عملية كلية عبر {3} مراحل شاملة. المعايير: {4}.'),
  gateGo: S('Exit criteria met; evidence reviewed; proceed to the next phase.', 'Critères de sortie atteints ; preuves revues ; passage à la phase suivante.', 'تم استيفاء معايير الخروج ومراجعة الأدلة؛ الانتقال إلى المرحلة التالية.'),
  reopen: S('Customer requirement changed; register updated and step re-completed.', 'Exigence client modifiée ; registre mis à jour et étape de nouveau terminée.', 'تغيّر متطلب العميل؛ تم تحديث السجل وإعادة إنجاز الخطوة.'),
  hq: S('Headquarters', 'Siège', 'المقر الرئيسي'),
  plant: S('{0} site', 'Site de {0}', 'موقع {0}'),
  depts: [S('Quality', 'Qualité', 'الجودة'), S('HSE', 'HSE', 'الصحة والسلامة والبيئة'), S('Operations', 'Opérations', 'العمليات'), S('Human Resources', 'Ressources humaines', 'الموارد البشرية'), S('Information Technology', 'Informatique', 'تقنية المعلومات'), S('Finance', 'Finance', 'المالية')],
  obsProject: S('{0} programme', 'Programme {0}', 'برنامج {0}'),
};
