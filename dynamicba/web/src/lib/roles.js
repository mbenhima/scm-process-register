// src/lib/roles.js
// RBAC roles reconciling the Standard SRS's 6 baseline user classes (Section 2.4) with
// DynamicBA's own RASCI actors (Catalogue "Main Stakeholders" / RASCI tables), per the
// build spec's synthesis section 6.4.

export const ROLES = [
  { id: 'org_admin', label: 'Organization Admin', baseline: 'Platform / Organization Administrator' },
  { id: 'delivery_lead', label: 'Delivery Lead', baseline: 'Process Owner / Manager' },
  { id: 'solution_architect', label: 'Solution Architect', baseline: 'Process Owner / Manager' },
  { id: 'lead_business_analyst', label: 'Lead Business Analyst', baseline: 'Team Contributor' },
  { id: 'business_analyst', label: 'Business Analyst', baseline: 'Team Contributor' },
  { id: 'senior_business_analyst', label: 'Senior Business Analyst', baseline: 'Team Contributor' },
  { id: 'automation_consultant', label: 'Automation Consultant', baseline: 'Team Contributor' },
  { id: 'client_viewer', label: 'Client Sponsor / Steering Committee (Viewer)', baseline: 'Scoped Viewer / Sponsor' },
  { id: 'auditor', label: 'Reporter / Read-Only / Auditor', baseline: 'Reporter / Read-Only / Auditor' },
]

export const ROLE_IDS = ROLES.map((r) => r.id)

// Capability codes checked throughout the app (module.action convention, per SRS 7.2).
export const CAPABILITIES = [
  'hierarchy.manage', // Clients, Projects, OBS CRUD
  'users.manage', // user CRUD + role assignment
  'permissions.manage', // Permission Matrix edits
  'config.manage', // Solution Pack / license / compliance standards
  'project.write', // create/edit within a project's wizard + artifacts
  'project.read',
  'governance.manage', // Business Rules / Controls / Risks / Custom KPIs / RACSI CRUD
  'governance.read',
  'signoff.approve', // capture client sign-off
  'export.run', // Export & Handoff actions
  'ai_usecases.manage', // AI Use Case Library activation/versioning
  'audit.view',
  'recyclebin.manage',
]

// Default Permission Matrix: role -> capability -> boolean. Editable at runtime by an
// org_admin via the Admin > Permission Matrix screen (FR-DA-RBAC-02); this is only the
// seeded default, not a hardcoded ceiling — see AdminPage.jsx / usePermissionMatrix.js.
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

export function can(matrix, roleIds, capability) {
  if (!roleIds || roleIds.length === 0) return false
  return roleIds.some((r) => matrix?.[r]?.[capability])
}
