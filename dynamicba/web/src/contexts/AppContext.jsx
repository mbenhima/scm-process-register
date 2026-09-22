import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../lib/api'
import { SaasLicenceProvider } from '../licensing/LicenceProvider'
import { DEFAULT_PERMISSION_MATRIX, can as canFn } from '../lib/roles'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { profile } = useAuth()
  const orgId = profile?.orgId

  const [organization, setOrganization] = useState(null)
  const [licence, setLicence] = useState(null)
  const [permissionMatrix, setPermissionMatrix] = useState(DEFAULT_PERMISSION_MATRIX)
  const [complianceStandards, setComplianceStandards] = useState({})
  const [activeClientId, setActiveClientId] = useState(() => localStorage.getItem('dba_active_client') || null)
  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem('dba_active_project') || null)

  const refresh = useCallback(async () => {
    if (!orgId) return
    const [org, lic, cfg] = await Promise.all([
      api.get(`/organizations/${orgId}`),
      api.get(`/licences/${orgId}`),
      api.get(`/organizations/${orgId}/config`),
    ])
    setOrganization(org)
    setLicence(lic)
    setPermissionMatrix(cfg?.permissionMatrix || DEFAULT_PERMISSION_MATRIX)
    setComplianceStandards(cfg?.complianceStandards || {})
  }, [orgId])

  useEffect(() => { refresh() }, [refresh])

  function selectClient(id) {
    setActiveClientId(id)
    localStorage.setItem('dba_active_client', id || '')
    setActiveProjectId(null)
    localStorage.removeItem('dba_active_project')
  }
  function selectProject(id) {
    setActiveProjectId(id)
    localStorage.setItem('dba_active_project', id || '')
  }

  const licenceProvider = useMemo(() => new SaasLicenceProvider(licence), [licence])

  const value = {
    orgId,
    organization,
    licence,
    licenceProvider,
    permissionMatrix,
    complianceStandards,
    activeClientId,
    activeProjectId,
    selectClient,
    selectProject,
    refresh,
    can: (capability) => canFn(permissionMatrix, profile?.roles, capability),
    roles: profile?.roles || [],
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
