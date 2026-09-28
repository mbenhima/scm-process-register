// Standard roles (D15b Role Menus) mapped to the six SRS baseline classes, the
// permission catalog (module.action) and the default grants. The runtime-editable
// Permission Matrix overrides these defaults (FR-DA-RBAC-02).
const L = (en, fr, ar) => ({ en, fr, ar });

export const ROLES = [
  { code: 'platform_admin', name: L('Platform Administrator', 'Administrateur de la plateforme', 'مسؤول المنصة'), cls: 'admin' },
  { code: 'tenant_admin', name: L('Tenant Administrator', 'Administrateur du locataire', 'مسؤول المستأجر'), cls: 'admin' },
  { code: 'ims_manager', name: L('IMS Manager', 'Responsable SMI', 'مدير نظام الإدارة المتكامل'), cls: 'owner' },
  { code: 'quality_manager', name: L('Quality Manager', 'Responsable qualité', 'مدير الجودة'), cls: 'owner' },
  { code: 'hse_manager', name: L('HSE Manager', 'Responsable HSE', 'مدير الصحة والسلامة والبيئة'), cls: 'owner' },
  { code: 'risk_manager', name: L('Risk Manager', 'Responsable des risques', 'مدير المخاطر'), cls: 'owner' },
  { code: 'compliance_officer', name: L('Compliance Officer', 'Responsable conformité', 'مسؤول الامتثال'), cls: 'owner' },
  { code: 'audit_manager', name: L('Internal Audit Manager', 'Responsable de l\'audit interne', 'مدير التدقيق الداخلي'), cls: 'owner' },
  { code: 'hr_manager', name: L('HR Manager', 'Responsable RH', 'مدير الموارد البشرية'), cls: 'contributor' },
  { code: 'document_controller', name: L('Document Controller', 'Gestionnaire documentaire', 'مراقب الوثائق'), cls: 'contributor' },
  { code: 'it_manager', name: L('IT Manager', 'Responsable informatique', 'مدير تقنية المعلومات'), cls: 'contributor' },
  { code: 'operations_manager', name: L('Operations Manager', 'Responsable des opérations', 'مدير العمليات'), cls: 'contributor' },
  { code: 'performance_manager', name: L('Performance Manager', 'Responsable de la performance', 'مدير الأداء'), cls: 'contributor' },
  { code: 'esg_manager', name: L('ESG Manager', 'Responsable ESG', 'مدير الاستدامة'), cls: 'contributor' },
  { code: 'transformation_manager', name: L('Transformation Manager', 'Responsable de la transformation', 'مدير التحول'), cls: 'contributor' },
  { code: 'process_excellence_manager', name: L('Process Excellence Manager', 'Responsable excellence des processus', 'مدير تميّز العمليات'), cls: 'owner' },
  { code: 'ai_governance_officer', name: L('AI Governance Officer', 'Responsable de la gouvernance de l\'IA', 'مسؤول حوكمة الذكاء الاصطناعي'), cls: 'owner' },
  { code: 'top_management', name: L('Top Management', 'Direction générale', 'الإدارة العليا'), cls: 'viewer' },
  { code: 'employee', name: L('Employee', 'Employé', 'الموظف'), cls: 'reporter' },
  { code: 'auditor', name: L('Auditor (read-only)', 'Auditeur (lecture seule)', 'مدقق (قراءة فقط)'), cls: 'readonly' },
];

export const BASELINE_CLASSES = {
  admin: L('Platform / Organization Administrator', 'Administrateur plateforme / organisation', 'مسؤول المنصة / المؤسسة'),
  owner: L('Process Owner / Manager', 'Propriétaire / responsable de processus', 'مالك العملية / المدير'),
  contributor: L('Team Contributor', 'Contributeur d\'équipe', 'عضو فريق مساهم'),
  evaluator: L('Action Owner / Evaluator', 'Propriétaire / évaluateur d\'action', 'مالك الإجراء / المقيّم'),
  viewer: L('Scoped Viewer / Sponsor', 'Lecteur restreint / sponsor', 'مطّلع محدود النطاق / راعٍ'),
  reporter: L('Reporter', 'Déclarant', 'المُبلِّغ'),
  readonly: L('Read-Only / Auditor', 'Lecture seule / auditeur', 'قراءة فقط / مدقق'),
};

// [code, label, default classes granted]
export const PERMISSIONS = [
  ['dashboard.view', L('View dashboard', 'Voir le tableau de bord', 'عرض لوحة المعلومات'), 'admin owner contributor viewer reporter readonly'],
  ['tenancy.view', L('View tenancy (groups, organizations, projects)', 'Voir la structure (groupes, organisations, projets)', 'عرض الهيكل (المجموعات والمؤسسات والمشاريع)'), 'admin owner contributor viewer readonly'],
  ['tenancy.manage', L('Manage groups, organizations and projects', 'Gérer groupes, organisations et projets', 'إدارة المجموعات والمؤسسات والمشاريع'), 'admin'],
  ['tenancy.group_view', L('Read-only view of other organizations of my group', 'Consultation des autres organisations du groupe', 'عرض مؤسسات مجموعتي الأخرى للقراءة فقط'), 'admin viewer'],
  ['obs.manage', L('Manage organizational breakdown structure', 'Gérer l\'organigramme (OBS)', 'إدارة الهيكل التنظيمي'), 'admin owner'],
  ['project.create', L('Create projects', 'Créer des projets', 'إنشاء المشاريع'), 'admin owner'],
  ['project.manage', L('Edit projects, phases and gates', 'Modifier projets, phases et jalons', 'تعديل المشاريع والمراحل والبوابات'), 'admin owner'],
  ['process.view', L('View process design catalog', 'Voir le référentiel des processus', 'عرض كتالوج تصميم العمليات'), 'admin owner contributor viewer reporter readonly'],
  ['process.design', L('Edit process design, verticals and libraries', 'Modifier la conception, les secteurs et les bibliothèques', 'تعديل التصميم والقطاعات والمكتبات'), 'admin owner'],
  ['execution.view', L('View process execution', 'Voir l\'exécution des processus', 'عرض تنفيذ العمليات'), 'admin owner contributor viewer reporter readonly'],
  ['execution.perform', L('Perform workflow steps', 'Réaliser les étapes du workflow', 'تنفيذ خطوات سير العمل'), 'admin owner contributor'],
  ['execution.reopen', L('Reopen completed steps (with justification)', 'Rouvrir des étapes terminées (avec justification)', 'إعادة فتح الخطوات المكتملة (مع مبرر)'), 'admin owner'],
  ['governance.view', L('View governance (rules, controls, risks, KPIs, RACSI)', 'Voir la gouvernance (règles, contrôles, risques, KPI, RACSI)', 'عرض الحوكمة (القواعد والضوابط والمخاطر والمؤشرات وRACSI)'), 'admin owner contributor viewer readonly'],
  ['governance.manage', L('Manage governance records', 'Gérer les éléments de gouvernance', 'إدارة سجلات الحوكمة'), 'admin owner'],
  ['records.view', L('View records (NC, actions, audits, documents)', 'Voir les enregistrements (NC, actions, audits, documents)', 'عرض السجلات (عدم المطابقة والإجراءات والتدقيقات والوثائق)'), 'admin owner contributor viewer reporter readonly'],
  ['records.create', L('Create records (report a problem, submit an idea)', 'Créer des enregistrements (signaler, proposer)', 'إنشاء السجلات (الإبلاغ، تقديم فكرة)'), 'admin owner contributor reporter'],
  ['records.manage', L('Manage records', 'Gérer les enregistrements', 'إدارة السجلات'), 'admin owner contributor'],
  ['evaluation.view', L('View evaluation verdict contents', 'Voir le contenu des verdicts d\'évaluation', 'عرض محتوى أحكام التقييم'), 'admin owner'],
  ['alerts.view', L('View alerts', 'Voir les alertes', 'عرض التنبيهات'), 'admin owner contributor viewer reporter readonly'],
  ['alerts.manage', L('Configure alert types', 'Paramétrer les types d\'alertes', 'تهيئة أنواع التنبيهات'), 'admin owner'],
  ['ai.view', L('View AI use cases', 'Voir les cas d\'usage de l\'IA', 'عرض حالات استخدام الذكاء الاصطناعي'), 'admin owner contributor viewer readonly'],
  ['ai.use', L('Run AI suggestions', 'Exécuter les suggestions de l\'IA', 'تشغيل اقتراحات الذكاء الاصطناعي'), 'admin owner contributor'],
  ['ai.manage', L('Manage AI use case library', 'Gérer la bibliothèque des cas d\'usage IA', 'إدارة مكتبة حالات استخدام الذكاء الاصطناعي'), 'admin'],
  ['kb.view', L('View knowledge base', 'Voir la base de connaissances', 'عرض قاعدة المعرفة'), 'admin owner contributor viewer reporter readonly'],
  ['kb.manage', L('Manage knowledge base and REX', 'Gérer la base de connaissances et le REX', 'إدارة قاعدة المعرفة والدروس المستفادة'), 'admin owner'],
  ['reports.view', L('View reports', 'Voir les rapports', 'عرض التقارير'), 'admin owner contributor viewer readonly'],
  ['reports.export', L('Export reports (PDF, Excel, Word)', 'Exporter les rapports (PDF, Excel, Word)', 'تصدير التقارير (PDF وExcel وWord)'), 'admin owner contributor viewer readonly'],
  ['benchmark.view', L('Internal benchmarking', 'Benchmarking interne', 'المقارنة المرجعية الداخلية'), 'admin owner viewer'],
  ['benchmark.group', L('Group benchmarking', 'Benchmarking de groupe', 'المقارنة المرجعية للمجموعة'), 'admin viewer'],
  ['benchmark.manage', L('Manage group sharing', 'Gérer le partage avec le groupe', 'إدارة المشاركة مع المجموعة'), 'admin'],
  ['assistant.use', L('Use the AI Assistant', 'Utiliser l\'assistant IA', 'استخدام المساعد الذكي'), 'admin owner contributor viewer reporter readonly'],
  ['users.manage', L('Manage users', 'Gérer les utilisateurs', 'إدارة المستخدمين'), 'admin'],
  ['permissions.manage', L('Edit permission matrix', 'Modifier la matrice des autorisations', 'تعديل مصفوفة الصلاحيات'), 'admin'],
  ['config.manage', L('Manage packs, add-ons and standards', 'Gérer packs, options et normes', 'إدارة الحزم والإضافات والمعايير'), 'admin'],
  ['audit.view', L('View audit trail', 'Voir la piste d\'audit', 'عرض سجل التدقيق'), 'admin owner readonly'],
  ['ops.manage', L('Backups and platform operations', 'Sauvegardes et exploitation', 'النسخ الاحتياطي وعمليات المنصة'), 'admin'],
  ['templates.manage', L('Manage project templates, gates and checklists', 'Gérer modèles de projets, jalons et listes de contrôle', 'إدارة نماذج المشاريع والبوابات وقوائم التحقق'), 'admin owner'],
  ['integrations.manage', L('Manage external integrations', 'Gérer les intégrations externes', 'إدارة التكاملات الخارجية'), 'admin'],
];

export const PERMISSION_CODES = PERMISSIONS.map(p => p[0]);

export function defaultGrant(roleCode, perm) {
  if (roleCode === 'platform_admin') return true;
  const role = ROLES.find(r => r.code === roleCode);
  const p = PERMISSIONS.find(x => x[0] === perm);
  if (!role || !p) return false;
  return p[2].split(' ').includes(role.cls);
}

export const ROLE_CODES = ROLES.map(r => r.code);
