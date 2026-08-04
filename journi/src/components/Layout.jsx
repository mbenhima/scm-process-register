import React, { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import { useAppState } from '../state/AppStateContext.jsx'

export default function Layout() {
  const { currentUser } = useAppState()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!currentUser) return <Navigate to="/login" replace />

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
