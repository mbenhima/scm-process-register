import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext.jsx'

// D-Config item 4/5: gates a module route against the tenant's active Pack
// configuration (data.packConfig.enabledModules), set from the Configuration
// Management module. This is the enforcement that the pre-existing
// data.license.features array never had — see ConfigurationPage.jsx.
export default function RequireModule({ routeId, children }) {
  const { data } = useAppState()
  const enabled = data.packConfig?.enabledModules
  if (Array.isArray(enabled) && !enabled.includes(routeId)) return <Navigate to="/app/dashboard" replace />
  return children
}
