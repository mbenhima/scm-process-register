import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext.jsx'

export default function RequireRole({ check, children }) {
  const { currentUser, data } = useAppState()
  if (!currentUser || !check(currentUser.role, data.rolePermissions)) return <Navigate to="/app/dashboard" replace />
  return children
}
