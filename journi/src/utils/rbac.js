import { ROLES, ROLES_WITH_INDIVIDUAL_VISIBILITY, ROLES_WITH_WRITE_ACCESS, DEFAULT_ROLE_PERMISSIONS } from '../data/constants.js'

// Each of these five checks now reads from the runtime-editable permission
// matrix (Module 2's Permission Matrix tab, backed by data.rolePermissions)
// when a caller passes one in as the second argument. The hardcoded
// fallback below only fires for a call site that hasn't been updated to
// pass the matrix, or if a role/capability is missing an explicit entry.
export function canWrite(role, matrix) {
  if (matrix) return !!matrix[role]?.write
  return ROLES_WITH_WRITE_ACCESS.has(role)
}

export function canSeeIndividualData(role) {
  return ROLES_WITH_INDIVIDUAL_VISIBILITY.has(role)
}

export function canManageHierarchy(role, matrix) {
  if (matrix) return !!matrix[role]?.manageHierarchy
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN].includes(role)
}

export function canManageUsers(role, matrix) {
  if (matrix) return !!matrix[role]?.manageUsers
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN].includes(role)
}

export function canManageAiCatalog(role) {
  return role === ROLES.SUPER_ADMIN
}

export function canActivateAiForOrg(role, matrix) {
  if (matrix) return !!matrix[role]?.activateAiForOrg
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN].includes(role)
}

export function canRequestProjectAiOverride(role, matrix) {
  if (matrix) return !!matrix[role]?.requestProjectAiOverride
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN, ROLES.CHANGE_MANAGER].includes(role)
}

// D31b Charter RBAC x OBS CRUD matrix: Super/Group/Org Admin and Change
// Manager can create/edit charter definitions; deletion is narrower still
// (see canDeleteCharter) — Change Manager can create/edit but never delete.
export function canManageCharters(role, matrix) {
  if (matrix) return !!matrix[role]?.manageCharters
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN, ROLES.CHANGE_MANAGER].includes(role)
}

// D31b: "cannot delete a charter still in Active status anywhere — must
// retire it first" and deletion itself is Group/Org Admin or above only,
// never a Change Manager even though they can create/edit. Not part of the
// runtime-configurable matrix, matching how canDelete() elsewhere is also a
// fixed role set rather than a Permission Matrix column.
export function canDeleteCharter(role) {
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN].includes(role)
}

// D33/D34: AI Use Case and Phase Template catalogs became full versioned CRUD
// after shipping read-only/toggle-only — same admin + Change Manager set as
// canManageCharters, since both are shared platform-wide reference content a
// Change Manager routinely adapts, not a per-project write.
export function canManageAiUseCases(role, matrix) {
  if (matrix) return !!matrix[role]?.manageAiUseCases
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN, ROLES.CHANGE_MANAGER].includes(role)
}

export function canManageTemplates(role, matrix) {
  if (matrix) return !!matrix[role]?.manageTemplates
  return [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.ORG_ADMIN, ROLES.CHANGE_MANAGER].includes(role)
}

// Only used to seed data.rolePermissions at buildSeed() time.
export { DEFAULT_ROLE_PERMISSIONS }

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
 * the tenant boundary for Module 20 and the Portfolio Dashboard's level
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
