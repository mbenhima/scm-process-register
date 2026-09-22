import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
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

  useEffect(() => {
    if (!orgId) { setOrganization(null); return }
    return onSnapshot(doc(db, 'organizations', orgId), (s) => setOrganization(s.exists() ? s.data() : null))
  }, [orgId])

  useEffect(() => {
    if (!orgId) { setLicence(null); return }
    return onSnapshot(doc(db, 'licences', orgId), (s) => setLicence(s.exists() ? s.data() : null))
  }, [orgId])

  useEffect(() => {
    if (!orgId) return
    return onSnapshot(doc(db, 'organizations', orgId, 'config', 'permissionMatrix'), (s) => {
      if (s.exists()) setPermissionMatrix(s.data())
    })
  }, [orgId])

  useEffect(() => {
    if (!orgId) return
    return onSnapshot(doc(db, 'organizations', orgId, 'config', 'complianceStandards'), (s) => {
      if (s.exists()) setComplianceStandards(s.data())
    })
  }, [orgId])

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
    can: (capability) => canFn(permissionMatrix, profile?.roles, capability),
    roles: profile?.roles || [],
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
