import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireRole from './components/RequireRole.jsx'
import { canManageHierarchy, canManageUsers } from './utils/rbac.js'
import LoginPage from './pages/LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Module1Page from './pages/Module1Page.jsx'
import Module2Page from './pages/Module2Page.jsx'
import Module3Page from './pages/Module3Page.jsx'
import Module4Page from './pages/Module4Page.jsx'
import Module5Page from './pages/Module5Page.jsx'
import Module6Page from './pages/Module6Page.jsx'
import Module7Page from './pages/Module7Page.jsx'
import Module8Page from './pages/Module8Page.jsx'
import Module9Page from './pages/Module9Page.jsx'
import Module10Page from './pages/Module10Page.jsx'
import Module11Page from './pages/Module11Page.jsx'
import Module12Page from './pages/Module12Page.jsx'
import Module13Page from './pages/Module13Page.jsx'
import Module14Page from './pages/Module14Page.jsx'
import Module15Page from './pages/Module15Page.jsx'
import Module16Page from './pages/Module16Page.jsx'
import Module17Page from './pages/Module17Page.jsx'
import Module18Page from './pages/Module18Page.jsx'
import Module19Page from './pages/Module19Page.jsx'
import Module20Page from './pages/Module20Page.jsx'
import Module21Page from './pages/Module21Page.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route
          path="m1"
          element={
            <RequireRole check={canManageHierarchy}>
              <Module1Page />
            </RequireRole>
          }
        />
        <Route
          path="m2"
          element={
            <RequireRole check={canManageUsers}>
              <Module2Page />
            </RequireRole>
          }
        />
        <Route path="m3" element={<Module3Page />} />
        <Route path="m4" element={<Module4Page />} />
        <Route path="m5" element={<Module5Page />} />
        <Route path="m6" element={<Module6Page />} />
        <Route path="m7" element={<Module7Page />} />
        <Route path="m8" element={<Module8Page />} />
        <Route path="m9" element={<Module9Page />} />
        <Route path="m10" element={<Module10Page />} />
        <Route path="m11" element={<Module11Page />} />
        <Route path="m12" element={<Module12Page />} />
        <Route path="m13" element={<Module13Page />} />
        <Route path="m14" element={<Module14Page />} />
        <Route path="m15" element={<Module15Page />} />
        <Route path="m16" element={<Module16Page />} />
        <Route path="m17" element={<Module17Page />} />
        <Route path="m18" element={<Module18Page />} />
        <Route path="m19" element={<Module19Page />} />
        <Route path="m20" element={<Module20Page />} />
        <Route path="m21" element={<Module21Page />} />
      </Route>
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  )
}
