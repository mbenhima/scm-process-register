// Canonical permission catalog and the 9 standard role -> permission templates
// (per NCP Solver Knowledge Base KB-011). Shared by the seed script and the
// Permission Matrix admin screen.

export const PERMISSIONS = [
  // module, action, code, description
  ['dashboard', 'view', 'dashboard.view', 'View dashboards'],

  ['fiche', 'view', 'fiche.view', 'View NCP fiches'],
  ['fiche', 'create', 'fiche.create', 'Create NCP fiches (E1)'],
  ['fiche', 'edit', 'fiche.edit', 'Edit NCP fiche content (E2-E7)'],
  ['fiche', 'delete', 'fiche.delete', 'Delete NCP fiches'],
  ['fiche', 'validate', 'fiche.validate', 'Validate stage completion'],
  ['fiche', 'close', 'fiche.close', 'Close NCP fiches (E7)'],
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

  ['aiUseCase', 'view', 'aiUseCase.view', 'View AI use cases library'],
  ['aiUseCase', 'create', 'aiUseCase.create', 'Create AI use cases'],
  ['aiUseCase', 'edit', 'aiUseCase.edit', 'Edit AI use cases'],
  ['aiUseCase', 'delete', 'aiUseCase.delete', 'Delete AI use cases'],

  ['report', 'view', 'report.view', 'View reports'],
  ['report', 'export', 'report.export', 'Export reports'],

  ['alert', 'view', 'alert.view', 'View alerts & notifications'],
  ['alert', 'manage', 'alert.manage', 'Manage alert configuration'],

  ['audit', 'view', 'audit.view', 'View audit trail'],
];

export const ALL_CODES = PERMISSIONS.map((p) => p[2]);

const dept = ['dashboard.view', 'report.view', 'obs.view', 'alert.view', 'fiche.view'];

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
      'dashboard.view', 'fiche.view', 'fiche.validate', 'fiche.close',
      'action.view', 'action.evaluate', 'rootcause.view', 'rootcause.validate',
      'rex.view', 'rex.validate', 'standard.view', 'standard.create', 'standard.edit', 'standard.delete',
      'capitalization.view', 'governance.view', 'governance.manage', 'report.view', 'report.export',
      'alert.view', 'aiUseCase.view', 'audit.view', 'obs.view', 'hierarchy.view',
    ],
  },
  ci_pilot: {
    name: 'CI Pilot', name_fr: 'Pilote AC', name_ar: 'قائد التحسين المستمر',
    description: 'Create/edit/validate all fiches in scope; approve action plans; manage REX; all dashboards.',
    permissions: [
      'dashboard.view', 'fiche.view', 'fiche.create', 'fiche.edit', 'fiche.validate', 'fiche.assignTeam',
      'action.view', 'action.create', 'action.edit', 'action.delete',
      'rootcause.view', 'rootcause.create', 'rootcause.edit', 'rootcause.validate',
      'rex.view', 'rex.create', 'rex.edit', 'standard.view', 'capitalization.view',
      'report.view', 'report.export', 'alert.view', 'alert.manage',
      'aiUseCase.view', 'aiUseCase.create', 'aiUseCase.edit', 'obs.view', 'hierarchy.view', 'user.view',
    ],
  },
  ncp_team_member: {
    name: 'NCP Team Member', name_fr: 'Membre équipe MRP', name_ar: 'عضو فريق حل المشكلات',
    description: 'View and edit assigned fiches; complete E2/E4/E5 stages; add root causes and actions.',
    permissions: [
      'dashboard.view', 'fiche.view', 'fiche.edit', 'action.view', 'action.create', 'action.edit',
      'rootcause.view', 'rootcause.create', 'rootcause.edit', 'rex.view', 'rex.create',
      'capitalization.view', 'standard.view', 'obs.view',
    ],
  },
  action_owner: {
    name: 'Action Owner (RR)', name_fr: 'Responsable Réalisation', name_ar: 'مسؤول التنفيذ',
    description: 'Update own action status; enter completion date; upload evidence.',
    permissions: ['dashboard.view', 'fiche.view', 'action.view', 'action.updateOwn'],
  },
  evaluator: {
    name: 'Evaluator (RE)', name_fr: 'Responsable Évaluation', name_ar: 'مسؤول التقييم',
    description: 'View pending evaluations; record effectiveness verdict and date; upload evaluation evidence.',
    permissions: ['dashboard.view', 'fiche.view', 'action.view', 'action.evaluate'],
  },
  department_head: {
    name: 'Department Head', name_fr: 'Chef de Département', name_ar: 'رئيس القسم',
    description: 'View all fiches in own department; department dashboard and reports; receive dept-level alerts.',
    permissions: [...dept, 'action.view', 'rootcause.view', 'rex.view'],
  },
  reporter: {
    name: 'Reporter', name_fr: 'Déclarant', name_ar: 'المبلّغ',
    description: 'Create new fiches (E1 only); view own submitted fiches; no edit rights after submission.',
    permissions: ['dashboard.view', 'fiche.view', 'fiche.create'],
  },
  auditor: {
    name: 'Read-Only / Auditor', name_fr: 'Auditeur (lecture seule)', name_ar: 'مدقق (قراءة فقط)',
    description: 'Read-only access to fiches and reports; full audit trail view; no create/edit/delete.',
    permissions: [
      'dashboard.view', 'fiche.view', 'action.view', 'rootcause.view', 'rex.view',
      'standard.view', 'capitalization.view', 'report.view', 'audit.view', 'obs.view', 'hierarchy.view',
    ],
  },
};
