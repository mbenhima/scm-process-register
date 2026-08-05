import { ROLES, ROLES_WITH_INDIVIDUAL_VISIBILITY, ROLES_WITH_WRITE_ACCESS } from '../data/constants.js'

export function canWrite(role) {
  return ROLES_WITH_WRITE_ACCESS.has(role)
}

export function canSeeIndividualData(role) {
  return ROLES_WITH_INDIVIDUAL_VISIBILITY.has(role)
}

export function canManageHierarchy(role) {
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN].includes(role)
}

export function canManageUsers(role) {
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN].includes(role)
}

export function canManageAiCatalog(role) {
  return role === ROLES.SUPER_ADMIN
}

export function canActivateAiForOrg(role) {
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN].includes(role)
}

export function canRequestProjectAiOverride(role) {
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN, ROLES.CHANGE_MANAGER].includes(role)
}

/** Organizations visible to a user, respecting Group / Organization / Project scope. */
export function visibleOrganizations(user, data) {
  if (!user) return []
  if (user.role === ROLES.SUPER_ADMIN) return data.organizations
  if (user.scopeType === 'group') return data.organizations.filter((o) => o.groupId === user.scopeId)
  if (user.scopeType === 'organization') return data.organizations.filter((o) => o.id === user.scopeId)
  if (user.scopeType === 'project') {
    const proj = data.cmProjects.find((p) => p.id === user.scopeId)
    return data.organizations.filter((o) => o.id === proj?.orgId)
  }
  return data.organizations
}

/** CM Projects visible to a user within a given organization. */
export function visibleProjects(user, data, orgId) {
  if (!user) return []
  const inOrg = data.cmProjects.filter((p) => p.orgId === orgId)
  if (user.scopeType === 'project') return inOrg.filter((p) => p.id === user.scopeId)
  return inOrg
}

export function roleLabelKey(role) {
  return `role_${role}`
}

export function canDelete(role) {
  return ROLES_WITH_WRITE_ACCESS.has(role)
}

const ORG_LEVEL_ROLES = new Set([ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN, ROLES.EXECUTIVE])
const GROUP_LEVEL_ROLES = new Set([ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN])

/**
 * Which roll-up levels (beyond 'project') a user's role is permitted to view for a given
 * Organization — 'organization' requires an Organization-scope-or-broader role;
 * 'group' additionally requires the Organization to actually belong to a Group.
 * This is what keeps a Change Manager, scoped to one Project, from ever seeing an
 * Organization- or Group-wide roll-up — the tenant boundary the Dashboard/Analytics
 * level switcher must respect.
 */
export function availableRollupLevels(user, org) {
  const levels = []
  if (!user || !org) return levels
  if (ORG_LEVEL_ROLES.has(user.role)) levels.push('organization')
  if (org.groupId && GROUP_LEVEL_ROLES.has(user.role)) levels.push('group')
  return levels
}

/**
 * Resolves the set of CM Projects a "Project / Organization / Group" level
 * selector should aggregate, given the currently scoped Organization. This is
 * the tenant boundary for Module 15 and the Portfolio Dashboard's level
 * switcher — 'group' never reaches outside the current Organization's own
 * Group, 'organization' never reaches outside the current Organization.
 */
export function projectsForLevel(data, level, scope, org) {
  if (level === 'project') {
    const proj = data.cmProjects.find((p) => p.id === scope.cmProjectId)
    return proj ? [proj] : []
  }
  if (level === 'group' && org?.groupId) {
    const orgIds = new Set(data.organizations.filter((o) => o.groupId === org.groupId).map((o) => o.id))
    return data.cmProjects.filter((p) => orgIds.has(p.orgId))
  }
  if (org) {
    return data.cmProjects.filter((p) => p.orgId === org.id)
  }
  return []
}
