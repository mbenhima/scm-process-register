// Canonical permission catalog and the 9 standard role -> permission templates
// (per NCP Solver Knowledge Base KB-011). Shared by the seed script and the
// Permission Matrix admin screen.

export const PERMISSIONS = [
  // module, action, code, description
  ['dashboard', 'view', 'dashboard.view', 'View dashboards'],
  ['help', 'view', 'help.view', 'View the in-app help & user guide'],

  ['fiche', 'view', 'fiche.view', 'View NCP fiches'],
  ['fiche', 'create', 'fiche.create', 'Create NCP fiches (S1)'],
  ['fiche', 'edit', 'fiche.edit', 'Edit NCP fiche content (S2-S7)'],
  ['fiche', 'delete', 'fiche.delete', 'Delete NCP fiches'],
  ['fiche', 'validate', 'fiche.validate', 'Validate stage completion'],
  ['fiche', 'close', 'fiche.close', 'Close NCP fiches (S7)'],
  ['fiche', 'assignTeam', 'fiche.assignTeam', 'Assign NCP team members'],

  ['action', 'view', 'action.view', 'View actions'],
  ['action', 'create', 'action.create', 'Create actions'],
  ['action', 'edit', 'action.edit', 'Edit actions'],
  ['action', 'delete', 'action.delete', 'Delete actions'],
  ['action', 'updateOwn', 'action.updateOwn', 'Update status/evidence of own assigned actions'],
  ['action', 'evaluate', 'action.evaluate', 'Record action effectiveness evaluation'],

  ['rootcause', 'view', 'rootcause.view', 'View root causes'],
  ['rootcause', 'create', 'rootcause.create', 'Create root causes'],
  ['rootcause', 'edit', 'rootcause.edit', 'Edit root causes'],
  ['rootcause', 'delete', 'rootcause.delete', 'Delete root causes'],
  ['rootcause', 'validate', 'rootcause.validate', 'Validate root causes'],

  ['rex', 'view', 'rex.view', 'View REX / capitalization entries'],
  ['rex', 'create', 'rex.create', 'Create REX entries'],
  ['rex', 'edit', 'rex.edit', 'Edit REX entries'],
  ['rex', 'validate', 'rex.validate', 'Validate & publish REX to Capitalization Library'],

  ['standard', 'view', 'standard.view', 'View standards knowledge base'],
  ['standard', 'create', 'standard.create', 'Create standards'],
  ['standard', 'edit', 'standard.edit', 'Edit standards'],
  ['standard', 'delete', 'standard.delete', 'Delete standards'],

  ['capitalization', 'view', 'capitalization.view', 'Search the Capitalization Library (RAG)'],

  ['user', 'view', 'user.view', 'View users'],
  ['user', 'create', 'user.create', 'Create users'],
  ['user', 'edit', 'user.edit', 'Edit users'],
  ['user', 'delete', 'user.delete', 'Delete / deactivate users'],
  ['user', 'manageRoles', 'user.manageRoles', 'Assign roles & scopes to users'],

  ['role', 'view', 'role.view', 'View roles'],
  ['role', 'create', 'role.create', 'Create roles'],
  ['role', 'edit', 'role.edit', 'Edit roles'],
  ['role', 'delete', 'role.delete', 'Delete roles'],
  ['role', 'managePermissions', 'role.managePermissions', 'Manage the role permission matrix'],

  ['hierarchy', 'view', 'hierarchy.view', 'View group / organization / project hierarchy'],
  ['hierarchy', 'manage', 'hierarchy.manage', 'Manage group / organization / project hierarchy'],

  ['obs', 'view', 'obs.view', 'View organizational breakdown structure'],
  ['obs', 'manage', 'obs.manage', 'Manage organizational breakdown structure'],

  ['license', 'view', 'license.view', 'View license & plan'],
  ['license', 'manage', 'license.manage', 'Manage license & plan (SaaS/OnPrem, seats, tier)'],

  ['governance', 'view', 'governance.view', 'View governance settings'],
  ['governance', 'manage', 'governance.manage', 'Manage governance settings (KPI thresholds, alerts, RCA defaults)'],

  ['aiUseCase', 'view', 'aiUseCase.view', 'View the AI Use Case Library'],
  ['aiUseCase', 'create', 'aiUseCase.create', 'Create AI use cases in the catalog'],
  ['aiUseCase', 'edit', 'aiUseCase.edit', 'Edit AI use cases (incl. new versions and reverting)'],
  ['aiUseCase', 'delete', 'aiUseCase.delete', 'Delete AI use cases from the catalog'],
  ['aiUseCase', 'activate', 'aiUseCase.activate', 'Activate/deactivate an AI use case for the Organization'],
  ['aiUseCase', 'projectOverride', 'aiUseCase.projectOverride', 'Override an AI use case\'s activation state for a single Project'],
  ['aiUseCase', 'viewUsageLog', 'aiUseCase.viewUsageLog', 'View the AI Usage Log (accepted/edited/rejected outcomes)'],

  ['businessRule', 'view', 'businessRule.view', 'View business rules'],
  ['businessRule', 'create', 'businessRule.create', 'Create business rules'],
  ['businessRule', 'edit', 'businessRule.edit', 'Edit business rules'],
  ['businessRule', 'delete', 'businessRule.delete', 'Delete business rules'],

  ['control', 'view', 'control.view', 'View controls (COSO framework)'],
  ['control', 'create', 'control.create', 'Create controls'],
  ['control', 'edit', 'control.edit', 'Edit controls'],
  ['control', 'delete', 'control.delete', 'Delete controls'],

  ['riskOpportunity', 'view', 'riskOpportunity.view', 'View risks & opportunities'],
  ['riskOpportunity', 'create', 'riskOpportunity.create', 'Create risks & opportunities'],
  ['riskOpportunity', 'edit', 'riskOpportunity.edit', 'Edit risks & opportunities'],
  ['riskOpportunity', 'delete', 'riskOpportunity.delete', 'Delete risks & opportunities'],

  ['racsi', 'view', 'racsi.view', 'View the RACSI accountability matrix'],
  ['racsi', 'create', 'racsi.create', 'Create RACSI activities'],
  ['racsi', 'edit', 'racsi.edit', 'Edit RACSI activities and manage assignments'],
  ['racsi', 'delete', 'racsi.delete', 'Delete RACSI activities'],

  ['bpmn', 'view', 'bpmn.view', 'View BPMN process diagrams'],
  ['bpmn', 'create', 'bpmn.create', 'Create BPMN process diagrams'],
  ['bpmn', 'edit', 'bpmn.edit', 'Edit BPMN process diagrams in the modeler'],
  ['bpmn', 'delete', 'bpmn.delete', 'Delete BPMN process diagrams'],

  ['assistant', 'view', 'assistant.view', 'Use the AI Assistant (data queries + application help)'],

  ['report', 'view', 'report.view', 'View reports'],
  ['report', 'export', 'report.export', 'Export reports'],

  ['alert', 'view', 'alert.view', 'View alerts & notifications'],
  ['alert', 'manage', 'alert.manage', 'Manage alert configuration'],

  ['audit', 'view', 'audit.view', 'View audit trail'],
];

export const ALL_CODES = PERMISSIONS.map((p) => p[2]);

const dept = ['dashboard.view', 'help.view', 'assistant.view', 'report.view', 'obs.view', 'alert.view', 'fiche.view', 'bpmn.view'];

export const ROLE_TEMPLATES = {
  admin: {
    name: 'Administrator', name_fr: 'Administrateur', name_ar: 'مدير النظام',
    description: 'Full CRUD on all records; user management; tenant configuration; RBAC matrix.',
    permissions: ALL_CODES,
  },
  quality_manager: {
    name: 'Quality Manager', name_fr: 'Responsable Qualité', name_ar: 'مدير الجودة',
    description: 'Validate and close all fiches; configure KPI thresholds; compliance reports.',
    permissions: [
      'dashboard.view', 'help.view', 'assistant.view', 'fiche.view', 'fiche.validate', 'fiche.close',
      'action.view', 'action.evaluate', 'rootcause.view', 'rootcause.validate',
      'rex.view', 'rex.validate', 'standard.view', 'standard.create', 'standard.edit', 'standard.delete',
      'capitalization.view', 'governance.view', 'governance.manage', 'report.view', 'report.export',
      'alert.view', 'aiUseCase.view', 'aiUseCase.create', 'aiUseCase.edit', 'aiUseCase.delete',
      'aiUseCase.activate', 'aiUseCase.projectOverride', 'aiUseCase.viewUsageLog',
      'audit.view', 'obs.view', 'hierarchy.view',
      'businessRule.view', 'businessRule.create', 'businessRule.edit', 'businessRule.delete',
      'control.view', 'control.create', 'control.edit', 'control.delete',
      'riskOpportunity.view', 'riskOpportunity.create', 'riskOpportunity.edit', 'riskOpportunity.delete',
      'racsi.view', 'racsi.create', 'racsi.edit', 'racsi.delete',
      'bpmn.view', 'bpmn.create', 'bpmn.edit', 'bpmn.delete',
    ],
  },
  ci_pilot: {
    name: 'CI Pilot', name_fr: 'Pilote AC', name_ar: 'قائد التحسين المستمر',
    description: 'Create/edit/validate all fiches in scope; approve action plans; manage REX; all dashboards.',
    permissions: [
      'dashboard.view', 'help.view', 'assistant.view', 'fiche.view', 'fiche.create', 'fiche.edit', 'fiche.validate', 'fiche.assignTeam',
      'action.view', 'action.create', 'action.edit', 'action.delete',
      'rootcause.view', 'rootcause.create', 'rootcause.edit', 'rootcause.validate',
      'rex.view', 'rex.create', 'rex.edit', 'standard.view', 'capitalization.view',
      'report.view', 'report.export', 'alert.view', 'alert.manage',
      'aiUseCase.view', 'aiUseCase.create', 'aiUseCase.edit', 'aiUseCase.projectOverride', 'aiUseCase.viewUsageLog',
      'obs.view', 'hierarchy.view', 'user.view',
      'businessRule.view', 'businessRule.create', 'businessRule.edit',
      'control.view', 'riskOpportunity.view', 'riskOpportunity.create', 'riskOpportunity.edit',
      'racsi.view', 'racsi.create', 'racsi.edit',
      'bpmn.view', 'bpmn.create', 'bpmn.edit',
    ],
  },
  ncp_team_member: {
    name: 'NCP Team Member', name_fr: 'Membre équipe MRP', name_ar: 'عضو فريق حل المشكلات',
    description: 'View and edit assigned fiches; complete S2/S4/S5 stages; add root causes and actions.',
    permissions: [
      'dashboard.view', 'help.view', 'assistant.view', 'fiche.view', 'fiche.edit', 'action.view', 'action.create', 'action.edit',
      'rootcause.view', 'rootcause.create', 'rootcause.edit', 'rex.view', 'rex.create',
      'capitalization.view', 'standard.view', 'obs.view', 'racsi.view', 'bpmn.view',
    ],
  },
  action_owner: {
    name: 'Action Owner (AR)', name_fr: 'Responsable Réalisation', name_ar: 'مسؤول التنفيذ',
    description: 'Update own action status; enter completion date; upload evidence.',
    permissions: ['dashboard.view', 'help.view', 'assistant.view', 'fiche.view', 'action.view', 'action.updateOwn'],
  },
  evaluator: {
    name: 'Evaluator (AE)', name_fr: 'Responsable Évaluation', name_ar: 'مسؤول التقييم',
    description: 'View pending evaluations; record effectiveness verdict and date; upload evaluation evidence.',
    permissions: ['dashboard.view', 'help.view', 'assistant.view', 'fiche.view', 'action.view', 'action.evaluate'],
  },
  department_head: {
    name: 'Department Head', name_fr: 'Chef de Département', name_ar: 'رئيس القسم',
    description: 'View all fiches in own department; department dashboard and reports; receive dept-level alerts.',
    permissions: [...dept, 'action.view', 'rootcause.view', 'rex.view', 'riskOpportunity.view', 'racsi.view'],
  },
  reporter: {
    name: 'Reporter', name_fr: 'Déclarant', name_ar: 'المبلّغ',
    description: 'Create new fiches (S1 only); view own submitted fiches; no edit rights after submission.',
    permissions: ['dashboard.view', 'help.view', 'assistant.view', 'fiche.view', 'fiche.create'],
  },
  auditor: {
    name: 'Read-Only / Auditor', name_fr: 'Auditeur (lecture seule)', name_ar: 'مدقق (قراءة فقط)',
    description: 'Read-only access to fiches and reports; full audit trail view; no create/edit/delete.',
    permissions: [
      'dashboard.view', 'help.view', 'assistant.view', 'fiche.view', 'action.view', 'rootcause.view', 'rex.view',
      'standard.view', 'capitalization.view', 'report.view', 'audit.view', 'obs.view', 'hierarchy.view',
      'businessRule.view', 'control.view', 'riskOpportunity.view', 'racsi.view', 'bpmn.view',
      'aiUseCase.view', 'aiUseCase.viewUsageLog',
    ],
  },
};
