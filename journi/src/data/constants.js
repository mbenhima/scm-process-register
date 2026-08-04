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

export const ADKAR_BLOCKS = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement']

export const BRIDGES_PHASES = ['ending', 'neutral', 'beginning']

export const SENTIMENT_STAGES = ['denial', 'resistance', 'exploration', 'commitment']

export const LEWIN_PHASES = ['unfreeze', 'change', 'refreeze']

export const AI_TIERS = { ASSISTIVE: 'assistive', AUGMENTED: 'augmented' }

export const RISK_CATEGORIES = ['adoption', 'sponsorship', 'capacity', 'saturation']

export const RESISTANCE_TYPES = ['role', 'skill', 'will', 'systemic']

export const SECTORS = ['manufacturing', 'logistics', 'health']
export const ARCHETYPES = ['erp', 'automation', 'qms']

export const VISIBILITY_LEVELS = ['weak', 'moderate', 'strong']
