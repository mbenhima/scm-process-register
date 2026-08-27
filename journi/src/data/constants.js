export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  GROUP_ADMIN: 'group_admin',
  ORG_ADMIN: 'org_admin',
  SPONSOR: 'sponsor',
  CHANGE_MANAGER: 'change_manager',
  PEOPLE_MANAGER: 'people_manager',
  PRACTITIONER: 'practitioner',
  EMPLOYEE: 'employee',
  EXECUTIVE: 'executive',
}

export const ROLE_SCOPE_LEVEL = {
  [ROLES.SUPER_ADMIN]: 'platform',
  [ROLES.GROUP_ADMIN]: 'group',
  [ROLES.ORG_ADMIN]: 'organization',
  [ROLES.SPONSOR]: 'project',
  [ROLES.CHANGE_MANAGER]: 'project',
  [ROLES.PEOPLE_MANAGER]: 'project',
  [ROLES.PRACTITIONER]: 'project',
  [ROLES.EMPLOYEE]: 'project',
  [ROLES.EXECUTIVE]: 'organization',
}

// Which roles may see individual-level ADKAR/sentiment data vs. aggregated only
export const ROLES_WITH_INDIVIDUAL_VISIBILITY = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.GROUP_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.CHANGE_MANAGER,
  ROLES.PEOPLE_MANAGER,
])

export const ROLES_WITH_WRITE_ACCESS = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.GROUP_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.CHANGE_MANAGER,
  ROLES.PRACTITIONER,
  ROLES.PEOPLE_MANAGER,
])

// The configurable capabilities shown on Module 2's Permission Matrix tab.
// Each maps 1:1 to a check function in utils/rbac.js; DEFAULT_ROLE_PERMISSIONS
// below is that same function's original hardcoded logic, expressed as data
// so it can be seeded into app state and edited at runtime by a Super Admin
// instead of requiring a code change.
export const CAPABILITIES = [
  { key: 'manageHierarchy', label: 'Manage Hierarchy', description: 'Create/delete Groups, Organizations, Main Projects, and Change Management Projects (Module 1).' },
  { key: 'manageUsers', label: 'Manage Users', description: 'Add, edit, or remove users and change their role/scope (Module 2).' },
  { key: 'write', label: 'Edit CM Project Data', description: 'Edit ADKAR scores, risks, communications, training, and every other Change Management module (M3–M15).' },
  { key: 'activateAiForOrg', label: 'Activate AI Use Cases (Org)', description: 'Turn AI use cases on or off for an Organization (Module 16).' },
  { key: 'requestProjectAiOverride', label: 'Override AI Use Cases (Project)', description: 'Override an AI use case’s activation for a single Project (Module 16).' },
  { key: 'manageCharters', label: 'Manage Charters', description: 'Create and edit CM Charter definitions (Module 19). Deleting a Retired charter is Group/Organization Admin and above only, regardless of this setting — see D31b.' },
  { key: 'manageAiUseCases', label: 'Manage AI Use Cases', description: 'Create, edit, delete, and revert AI Use Case definitions in the shared catalog (Module 16) — distinct from activating/deactivating one for an Organization or Project.' },
  { key: 'manageTemplates', label: 'Manage Phase Templates', description: 'Create, edit, delete, and revert Phase Template definitions in the shared library (Module 17) — distinct from loading a template into a project’s WBS.' },
]

export const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: { manageHierarchy: true, manageUsers: true, write: true, activateAiForOrg: true, requestProjectAiOverride: true, manageCharters: true, manageAiUseCases: true, manageTemplates: true },
  [ROLES.GROUP_ADMIN]: { manageHierarchy: true, manageUsers: true, write: true, activateAiForOrg: true, requestProjectAiOverride: true, manageCharters: true, manageAiUseCases: true, manageTemplates: true },
  [ROLES.ORG_ADMIN]: { manageHierarchy: true, manageUsers: true, write: true, activateAiForOrg: true, requestProjectAiOverride: true, manageCharters: true, manageAiUseCases: true, manageTemplates: true },
  [ROLES.SPONSOR]: { manageHierarchy: false, manageUsers: false, write: false, activateAiForOrg: false, requestProjectAiOverride: false, manageCharters: false, manageAiUseCases: false, manageTemplates: false },
  [ROLES.CHANGE_MANAGER]: { manageHierarchy: false, manageUsers: false, write: true, activateAiForOrg: false, requestProjectAiOverride: true, manageCharters: true, manageAiUseCases: true, manageTemplates: true },
  [ROLES.PEOPLE_MANAGER]: { manageHierarchy: false, manageUsers: false, write: true, activateAiForOrg: false, requestProjectAiOverride: false, manageCharters: false, manageAiUseCases: false, manageTemplates: false },
  [ROLES.PRACTITIONER]: { manageHierarchy: false, manageUsers: false, write: true, activateAiForOrg: false, requestProjectAiOverride: false, manageCharters: false, manageAiUseCases: false, manageTemplates: false },
  [ROLES.EMPLOYEE]: { manageHierarchy: false, manageUsers: false, write: false, activateAiForOrg: false, requestProjectAiOverride: false, manageCharters: false, manageAiUseCases: false, manageTemplates: false },
  [ROLES.EXECUTIVE]: { manageHierarchy: false, manageUsers: false, write: false, activateAiForOrg: false, requestProjectAiOverride: false, manageCharters: false, manageAiUseCases: false, manageTemplates: false },
}

export const ADKAR_BLOCKS = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement']

export const BRIDGES_PHASES = ['ending', 'neutral', 'beginning']

export const SENTIMENT_STAGES = ['denial', 'resistance', 'exploration', 'commitment']

export const LEWIN_PHASES = ['unfreeze', 'change', 'refreeze']

export const AI_TIERS = { ASSISTIVE: 'assistive', AUGMENTED: 'augmented' }

export const RISK_CATEGORIES = ['adoption', 'sponsorship', 'capacity', 'saturation']

export const RESISTANCE_TYPES = ['role', 'skill', 'will', 'systemic']

export const SECTORS = ['manufacturing', 'logistics', 'health']
export const ARCHETYPES = ['erp', 'automation', 'qms', 'bpr', 'cultural', 'operating_model', 'compliance', 'training_skills']

export const VISIBILITY_LEVELS = ['weak', 'moderate', 'strong']
