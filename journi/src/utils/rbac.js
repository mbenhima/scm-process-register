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
