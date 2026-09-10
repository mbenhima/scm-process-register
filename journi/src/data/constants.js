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
// Display label/description for each lives in i18n/translations.js as
// cap_<key>_label / cap_<key>_desc, resolved via t() at render time
// (Module2Page) — this array only carries the stable identifiers.
export const CAPABILITIES = [
  { key: 'manageHierarchy' },
  { key: 'manageUsers' },
  { key: 'write' },
  { key: 'activateAiForOrg' },
  { key: 'requestProjectAiOverride' },
  { key: 'manageCharters' },
  { key: 'manageAiUseCases' },
  { key: 'manageTemplates' },
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
