import { useMemo } from 'react'
import { useAppState } from '../state/AppStateContext.jsx'

export function useScopedOrg() {
  const { data, scope } = useAppState()
  return useMemo(() => data.organizations.find((o) => o.id === scope.orgId) || null, [data.organizations, scope.orgId])
}

export function useScopedProject() {
  const { data, scope } = useAppState()
  return useMemo(() => data.cmProjects.find((p) => p.id === scope.cmProjectId) || null, [data.cmProjects, scope.cmProjectId])
}

export function useOrgProjects(orgId) {
  const { data } = useAppState()
  return useMemo(() => data.cmProjects.filter((p) => p.orgId === orgId), [data.cmProjects, orgId])
}

/** A CM Project can link to zero, one, or more Main Projects — see mainProjectIds. */
export function useMainProjects(mainProjectIds) {
  const { data } = useAppState()
  return useMemo(
    () => (mainProjectIds || []).map((id) => data.mainProjects.find((mp) => mp.id === id)).filter(Boolean),
    [data.mainProjects, mainProjectIds],
  )
}
