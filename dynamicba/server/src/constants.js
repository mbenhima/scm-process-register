// Server-side copies of the small constant tables the web app also has under
// web/src/lib/ (roles.js, catalogue.js). Duplicated rather than shared via a package
// because server/ and web/ are installed independently with their own package.json, per
// the requested layout; both copies are static reference data, not business logic.

export const ROLE_IDS = [
  'org_admin', 'delivery_lead', 'solution_architect', 'lead_business_analyst',
  'business_analyst', 'senior_business_analyst', 'automation_consultant', 'client_viewer', 'auditor',
]

export const CAPABILITIES = [
  'hierarchy.manage', 'users.manage', 'permissions.manage', 'config.manage',
  'project.write', 'project.read', 'governance.manage', 'governance.read',
  'signoff.approve', 'export.run', 'ai_usecases.manage', 'audit.view', 'recyclebin.manage',
]

export const DEFAULT_PERMISSION_MATRIX = {
  org_admin: Object.fromEntries(CAPABILITIES.map((c) => [c, true])),
  delivery_lead: {
    'hierarchy.manage': true, 'project.write': true, 'project.read': true,
    'governance.manage': true, 'governance.read': true, 'signoff.approve': true,
    'export.run': true, 'audit.view': true, 'recyclebin.manage': true,
  },
  solution_architect: {
    'project.write': true, 'project.read': true, 'governance.manage': true,
    'governance.read': true, 'export.run': false, 'audit.view': true,
  },
  lead_business_analyst: { 'project.write': true, 'project.read': true, 'governance.read': true },
  business_analyst: { 'project.write': true, 'project.read': true, 'governance.read': true },
  senior_business_analyst: { 'project.write': true, 'project.read': true, 'governance.read': true },
  automation_consultant: { 'project.write': true, 'project.read': true, 'governance.read': true },
  client_viewer: { 'project.read': true, 'governance.read': true },
  auditor: { 'project.read': true, 'governance.read': true, 'audit.view': true },
}

export const PLAN_MODULES = {
  starter: ['MOD-01'],
  professional: ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-04'],
  enterprise: ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05', 'MOD-06', 'MOD-07'],
  pay_per_project: ['MOD-08'],
}

export const PLAN_MAX_USERS = { starter: 5, professional: 15, enterprise: 100, pay_per_project: 3 }

export const AI_USE_CASE_IDS = [
  'AIUC-01', 'AIUC-02', 'AIUC-03', 'AIUC-04', 'AIUC-05', 'AIUC-06', 'AIUC-07', 'AIUC-08',
  'AIUC-09', 'AIUC-10', 'AIUC-11', 'AIUC-12', 'AIUC-13', 'AIUC-14', 'AIUC-15', 'AIUC-16',
]
