// Library of documented-information templates (FR-DA-DOC-01, -02, -11; FR-DA-DGC-04; FR-DA-DFP-01).
// One deliverable template per end-to-end process, plus the Training Engineering Report, the Training Plan, the Audit
// Report and the Master List of documented information. Every section is bound to a named data source.
const L = (en, fr, ar) => ({ en, fr, ar });

export const CATEGORIES = { Plan: L('Plan', 'Plan', 'مخطط'), Report: L('Report', 'Rapport', 'تقرير'), Procedure: L('Procedure', 'Procédure', 'مسطرة'), Record: L('Record', 'Enregistrement', 'سجل'), Register: L('Register', 'Registre', 'سجل'), Design: L('Design', 'Conception', 'تصميم'), Evaluation: L('Evaluation', 'Évaluation', 'تقييم'), Contract: L('Contract', 'Contrat', 'عقد') };

// [E2E, code suffix, name, category, entities bound to the document]
const DELIVERABLES = [
  ['E2E-01', L('Annual L&D plan and budget', 'Plan annuel de formation et budget', 'المخطط السنوي للتكوين والميزانية'), 'Plan', ['StrategicObjective', 'BudgetLine', 'TrainingPlan']],
  ['E2E-02', L('Skills gap diagnosis', 'Diagnostic des écarts de compétences', 'تشخيص فجوات الكفاءات'), 'Report', ['SkillAssessment', 'SkillGap']],
  ['E2E-03', L('Training needs report and roadmap', 'Rapport des besoins de formation et feuille de route', 'تقرير حاجيات التكوين وخارطة الطريق'), 'Report', ['TrainingNeed', 'TrainingTheme', 'RoadmapInitiative']],
  ['E2E-04', L('Curriculum design document', 'Dossier de conception pédagogique', 'وثيقة التصميم البيداغوجي'), 'Design', ['LearningPath', 'LearningModule']],
  ['E2E-05', L('Training delivery report', 'Rapport de réalisation des formations', 'تقرير تنفيذ التكوينات'), 'Record', ['Session', 'Enrollment']],
  ['E2E-06', L('Learner engagement report', 'Rapport d’engagement des apprenants', 'تقرير انخراط المتعلمين'), 'Report', ['Enrollment', 'GamificationAward']],
  ['E2E-07', L('Training evaluation report', 'Rapport d’évaluation des formations', 'تقرير تقييم التكوينات'), 'Evaluation', ['Evaluation']],
  ['E2E-08', L('ROI and business impact report', 'Rapport de ROI et d’impact métier', 'تقرير العائد على الاستثمار والأثر'), 'Evaluation', ['Evaluation', 'BudgetLine']],
  ['E2E-09', L('Compliance and certification register', 'Registre de conformité et des certifications', 'سجل المطابقة والشهادات'), 'Register', ['Certification']],
  ['E2E-10', L('Internal mobility and career paths', 'Mobilité interne et parcours de carrière', 'التنقل الداخلي والمسارات المهنية'), 'Plan', ['InternalOpportunity', 'DevelopmentPlan']],
  ['E2E-11', L('Onboarding programme record', 'Dossier du programme d’intégration', 'ملف برنامج الإدماج'), 'Record', ['OnboardingRecord']],
  ['E2E-12', L('Knowledge capture and transfer record', 'Capitalisation et transfert des connaissances', 'رسملة ونقل المعارف'), 'Record', ['RexEntry']],
  ['E2E-13', L('Content catalogue and lifecycle', 'Catalogue et cycle de vie des contenus', 'كتالوج المحتويات ودورة حياتها'), 'Register', ['ContentAsset']],
  ['E2E-14', L('Extended enterprise training report', 'Rapport de formation de l’entreprise étendue', 'تقرير تكوين المؤسسة الموسعة'), 'Report', ['Enrollment', 'Certification']],
  ['E2E-15', L('Data, AI and integration governance', 'Gouvernance des données, de l’IA et des intégrations', 'حوكمة البيانات والذكاء الاصطناعي والربط'), 'Procedure', ['AIUseCase@org', 'ExternalIntegration@org']],
  ['E2E-16', L('Vendor management file', 'Dossier de gestion des prestataires', 'ملف تدبير المزودين'), 'Contract', ['PurchaseOrder', 'Invoice', 'Vendor@org']],
  ['E2E-17', L('Change and adoption plan', 'Plan de conduite du changement et d’adoption', 'مخطط قيادة التغيير والتبني'), 'Plan', ['Action', 'DevelopmentPlan']],
  ['E2E-18', L('Quality, risk and improvement report', 'Rapport qualité, risques et amélioration', 'تقرير الجودة والمخاطر والتحسين'), 'Report', ['RiskOpportunity@org', 'Control@org']],
  ['E2E-19', L('Consulting engagement closure report', 'Rapport de clôture de mission de conseil', 'تقرير إغلاق مهمة الاستشارة'), 'Report', ['ConsultingEngagement', 'CoachingEngagement']],
  ['E2E-20', L('Multi-axis diagnostic and maturity report', 'Rapport de diagnostic multi-axes et de maturité', 'تقرير التشخيص متعدد المحاور والنضج'), 'Report', ['DiagnosticAssessment', 'MaturityAssessment']],
  ['E2E-21', L('Previous plan impact evaluation', 'Évaluation de l’impact du plan précédent', 'تقييم أثر المخطط السابق'), 'Evaluation', ['Evaluation', 'TrainingPlan']],
  ['E2E-22', L('Multi-site deployment plan', 'Plan de déploiement multi-sites', 'مخطط النشر متعدد المواقع'), 'Plan', ['RoadmapInitiative', 'Session']],
  ['E2E-23', L('Regulatory submission file', 'Dossier de soumission réglementaire', 'ملف الإيداع التنظيمي'), 'Record', ['RegulatorySubmission']],
  ['E2E-24', L('Competitive intelligence note', 'Note de veille concurrentielle', 'مذكرة اليقظة التنافسية'), 'Report', ['IntelligenceReport']],
  ['E2E-25', L('Job architecture and competency map', 'Architecture des emplois et cartographie des compétences', 'هيكلة المناصب وخريطة الكفاءات'), 'Register', ['Position@org', 'PositionCompetencyTarget@org']],
  ['E2E-26', L('Forward planning of jobs and skills (GPEC)', 'Gestion prévisionnelle des emplois et compétences (GPEC)', 'التدبير التوقعي للوظائف والكفاءات'), 'Plan', ['SkillGap', 'Position@org']],
  ['E2E-27', L('Training demand consolidation', 'Consolidation des demandes de formation', 'توحيد طلبات التكوين'), 'Record', ['TrainingDemand']],
  ['E2E-28', L('Performance assessment and RAG dashboard', 'Évaluation des performances et tableau RAG', 'تقييم الأداء ولوحة RAG'), 'Evaluation', ['PerformanceAssessment']],
  ['E2E-29', L('Functional SWOT and improvement axes', 'SWOT fonctionnel et axes d’amélioration', 'SWOT الوظيفي ومحاور التحسين'), 'Report', ['FunctionalSwot', 'ImprovementAxis']],
  ['E2E-30', L('Prioritized resource plan', 'Plan de ressources priorisé', 'مخطط الموارد حسب الأولوية'), 'Plan', ['TrainingTheme', 'BudgetLine', 'TrainingCourse']],
  ['E2E-31', L('Post-engagement roadmap', 'Feuille de route post-mission', 'خارطة طريق ما بعد المهمة'), 'Plan', ['Roadmap', 'RexEntry']],
  ['E2E-32', L('Scope of work and stakeholder register', 'Cahier des charges et registre des parties prenantes', 'دفتر التحملات وسجل الأطراف المعنية'), 'Contract', ['ScopeOfWork', 'Stakeholder', 'ScopeCriterion']],
  ['E2E-33', L('Questionnaire campaign report', 'Rapport de campagne de questionnaires', 'تقرير حملة الاستبيانات'), 'Report', ['Questionnaire']],
];

/** Default Document Formatting from the AI Value Graphical Chart (NFR-DA-VDS-20): Open Sans 11 pt Ink body, Montserrat Navy headings, Navy table headers, 2 cm margins, A4. */
export const DEFAULT_FORMATTING = { bodyFont: 'Open Sans', bodySize: 11, headingFont: 'Montserrat', h1Size: 16, h2Size: 13, h3Size: 11.5, align: 'left', orientation: 'portrait', paper: 'A4', margins: 20, // mm (2 cm, NFR-DA-VDS-20)
  cover: true, toc: true, numbering: true, pageNumbers: true, headingColor: '123A5F', h2Color: '123A5F', tableHeader: '123A5F', logo: 'organization', logoPosition: 'top-left', logoInHeader: false, header: '', footer: '' };
/** Values an Organization may choose for its layout (FR-DA-DOC-07): AI Value Graphical Chart colours and fonts only. */
export const ALLOWED = { fonts: ['Open Sans', 'Montserrat', 'Times New Roman', 'Cambria', 'Calibri', 'Georgia', 'Garamond'], sizes: [9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 13.5, 14, 16, 17, 18, 20, 24], align: ['left', 'center', 'right', 'justify'],
  orientation: ['portrait', 'landscape'], paper: ['A4', 'Letter'], colors: ['123A5F', '0D2A47', '1876C6', '17A2B8', '28C87C', '2C3E50', '5A6B7B', 'F5F8FB', 'E1E8F0', 'E8F1FB', 'FFFFFF'], logo: ['organization', 'uploaded', 'none'], logoPosition: ['top-left', 'top-center', 'top-right'], margins: [12, 15, 19, 20, 25, 30] };

const sec = (id, type, title, extra = {}) => ({ id, type, title, ...extra });
const purpose = (e2eName, goal) => L(
  `This document records the results of the end-to-end process “${e2eName.en}” for {{org}} in the project {{project}}. Objective: ${goal.en}. It is generated from the records captured in the application on {{date}}; every table row names its source record.`,
  `Ce document consigne les résultats du processus de bout en bout « ${e2eName.fr} » pour {{org}} dans le projet {{project}}. Objectif : ${goal.fr}. Il est généré à partir des enregistrements saisis dans l’application le {{date}} ; chaque ligne de tableau indique son enregistrement source.`,
  `تسجل هذه الوثيقة نتائج العملية الشاملة «${e2eName.ar}» لفائدة {{org}} ضمن المشروع {{project}}. الهدف: ${goal.ar}. أنشئت انطلاقاً من السجلات المدخلة في التطبيق بتاريخ {{date}}؛ ويذكر كل صف في الجداول سجله المصدر.`);

/** The seeded library, built from the effective design of each end-to-end process (`e2e(id)` returns its name and goal). */
export function libraryTemplates(e2e) {
  const out = [];
  for (const [id, name, category, entities] of DELIVERABLES) {
    const e = e2e(id) || { name: name, goal: name };
    out.push({ code: 'DT-' + id, name, category, formats: ['docx', 'pdf', 'xlsx'], e2e: [id], status: 'Published', profile: { identification: true, revisions: true, sources: true, approval: true }, formatting: { ...DEFAULT_FORMATTING },
      sections: [
        sec('purpose', 'text', L('Purpose and scope', 'Objet et périmètre', 'الغرض والنطاق'), { text: purpose(e.name, e.goal) }),
        sec('flow', 'diagram', L('Process flow', 'Logigramme du processus', 'مخطط سير العملية'), { source: 'bpmn:' + id, text: L('Lanes per role, from trigger to end event (BPMN 2.0).', 'Couloirs par rôle, du déclencheur à l’événement de fin (BPMN 2.0).', 'ممرات حسب الدور، من الحدث المطلق إلى حدث النهاية (BPMN 2.0).') }),
        sec('sipoc', 'table', L('Activities, inputs and outputs (SIPOC)', 'Activités, entrées et sorties (SIPOC)', 'الأنشطة والمدخلات والمخرجات (SIPOC)'), { source: 'sipoc:' + id }),
        sec('results', 'steps', L('Results by step', 'Résultats par étape', 'النتائج حسب الخطوة'), { source: 'steps:' + id }),
        ...entities.map((ent, i) => sec('rec' + i, 'table', null, { source: 'records:' + ent })),
        sec('kpis', 'table', L('Indicators', 'Indicateurs', 'المؤشرات'), { source: 'kpis:' + id }),
        sec('risks', 'table', L('Risks and controls', 'Risques et contrôles', 'المخاطر والضوابط'), { source: 'risks:' + id }),
        sec('racsi', 'table', L('Roles and responsibilities (RACSI)', 'Rôles et responsabilités (RACSI)', 'الأدوار والمسؤوليات (RACSI)'), { source: 'racsi:' + id }),
      ] });
  }
  out.push({ code: 'DT-TER', name: L('Training Engineering Report and Training Plan', 'Rapport d’ingénierie de formation et plan de formation', 'تقرير هندسة التكوين ومخطط التكوين'), category: 'Report', formats: ['docx', 'pdf', 'xlsx'], e2e: ['E2E-03', 'E2E-30'], status: 'Published',
    profile: { identification: true, revisions: true, sources: true, approval: true }, formatting: { ...DEFAULT_FORMATTING }, sections: [sec('ter', 'builtin', null, { source: 'ter' })] });
  out.push({ code: 'DT-PLAN', name: L('Training plan with detailed agendas', 'Plan de formation avec programmes détaillés', 'مخطط التكوين مع البرامج المفصلة'), category: 'Plan', formats: ['docx', 'pdf', 'xlsx'], e2e: ['E2E-30', 'E2E-04'], status: 'Published',
    profile: { identification: true, revisions: true, sources: true, approval: true }, formatting: { ...DEFAULT_FORMATTING },
    sections: [sec('purpose', 'text', L('Purpose', 'Objet', 'الغرض'), { text: L('Training plan of {{org}} for {{year}}: programs, trainings, half-day agendas and the value of each training for each persona.', 'Plan de formation de {{org}} pour {{year}} : programmes, formations, programmes par demi-journée et valeur de chaque formation pour chaque persona.', 'مخطط تكوين {{org}} لسنة {{year}}: البرامج والتكوينات والبرامج حسب نصف اليوم وقيمة كل تكوين لكل شخصية.') }),
      sec('plan', 'table', L('Trainings', 'Formations', 'التكوينات'), { source: 'trainingPlan' }), sec('agenda', 'table', L('Detailed agendas by half-day', 'Programmes détaillés par demi-journée', 'البرامج المفصلة حسب نصف اليوم'), { source: 'trainingAgenda' }),
      sec('personas', 'table', L('Value proposition per persona', 'Proposition de valeur par persona', 'القيمة المقترحة لكل شخصية'), { source: 'trainingPersonas' })] });
  out.push({ code: 'DT-AUDIT', name: L('Audit report', 'Rapport d’audit', 'تقرير التدقيق'), category: 'Report', formats: ['docx', 'pdf', 'xlsx'], e2e: ['E2E-18'], status: 'Published', profile: { identification: true, revisions: true, sources: true, approval: true }, formatting: { ...DEFAULT_FORMATTING },
    sections: [sec('audit', 'builtin', null, { source: 'audit' })] });
  out.push({ code: 'DT-MASTER', name: L('Master list of documented information', 'Liste maîtresse des informations documentées', 'القائمة الرئيسية للمعلومات الموثقة'), category: 'Register', formats: ['docx', 'pdf', 'xlsx'], e2e: [], status: 'Published', profile: { identification: true, revisions: false, sources: true, approval: true }, formatting: { ...DEFAULT_FORMATTING, orientation: 'landscape' },
    sections: [sec('master', 'table', L('Documented information of the project', 'Informations documentées du projet', 'المعلومات الموثقة للمشروع'), { source: 'masterList' })] });
  return out;
}

/**
 * Documented information each standard requires — to maintain (a document) or to retain (a record) — with the
 * template that answers it (FR-DA-DOC-03).
 */
export const STANDARD_REQUIREMENTS = {
  'ISO 9001': [['7.2', 'retain', L('Evidence of competence', 'Preuves de compétence', 'أدلة الكفاءة'), 'DT-E2E-02'], ['7.2', 'retain', L('Training records', 'Enregistrements des formations', 'سجلات التكوين'), 'DT-E2E-05'], ['6.2', 'maintain', L('Quality objectives', 'Objectifs qualité', 'أهداف الجودة'), 'DT-E2E-01'], ['9.1', 'retain', L('Evaluation of effectiveness', 'Évaluation de l’efficacité', 'تقييم الفعالية'), 'DT-E2E-07'], ['9.2', 'retain', L('Internal audit results', 'Résultats d’audit interne', 'نتائج التدقيق الداخلي'), 'DT-AUDIT'], ['10.2', 'retain', L('Nonconformities and corrective actions', 'Non-conformités et actions correctives', 'عدم المطابقة والإجراءات التصحيحية'), 'DT-E2E-18'], ['7.5', 'maintain', L('Control of documented information', 'Maîtrise des informations documentées', 'التحكم في المعلومات الموثقة'), 'DT-MASTER']],
  'ISO 21001': [['7.2', 'retain', L('Competence of staff and trainers', 'Compétence du personnel et des formateurs', 'كفاءة الموظفين والمكونين'), 'DT-E2E-02'], ['8.3', 'maintain', L('Design of educational products', 'Conception des produits éducatifs', 'تصميم المنتجات التعليمية'), 'DT-E2E-04'], ['8.5', 'retain', L('Delivery records', 'Enregistrements de réalisation', 'سجلات التنفيذ'), 'DT-E2E-05'], ['9.1', 'retain', L('Learner satisfaction and results', 'Satisfaction et résultats des apprenants', 'رضا ونتائج المتعلمين'), 'DT-E2E-07'], ['9.2', 'retain', L('Internal audit results', 'Résultats d’audit interne', 'نتائج التدقيق الداخلي'), 'DT-AUDIT']],
  'ISO 10015': [['4.2', 'maintain', L('Competence needs analysis', 'Analyse des besoins en compétences', 'تحليل حاجيات الكفاءات'), 'DT-E2E-03'], ['4.3', 'maintain', L('Competence development plan', 'Plan de développement des compétences', 'مخطط تطوير الكفاءات'), 'DT-PLAN'], ['4.5', 'retain', L('Evaluation of competence development', 'Évaluation du développement des compétences', 'تقييم تطوير الكفاءات'), 'DT-E2E-08']],
  'ISO 45001': [['7.2', 'retain', L('Safety competence records', 'Enregistrements de compétence sécurité', 'سجلات كفاءة السلامة'), 'DT-E2E-09'], ['6.1', 'maintain', L('Risks and opportunities', 'Risques et opportunités', 'المخاطر والفرص'), 'DT-E2E-18']],
  'ISO 27001': [['7.2', 'retain', L('Security awareness and competence', 'Sensibilisation et compétence sécurité', 'التوعية والكفاءة في الأمن'), 'DT-E2E-09'], ['A.5', 'maintain', L('Data and AI governance', 'Gouvernance des données et de l’IA', 'حوكمة البيانات والذكاء الاصطناعي'), 'DT-E2E-15']],
  'GDPR': [['30', 'maintain', L('Records of processing (training data)', 'Registre des traitements (données de formation)', 'سجل المعالجات (بيانات التكوين)'), 'DT-E2E-15'], ['5', 'retain', L('Questionnaire consent evidence', 'Preuves de consentement aux questionnaires', 'أدلة الموافقة على الاستبيانات'), 'DT-E2E-33']],
};
