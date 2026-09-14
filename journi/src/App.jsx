import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireRole from './components/RequireRole.jsx'
import RequireModule from './components/RequireModule.jsx'
import { canManageHierarchy, canManageUsers, canManageConfiguration } from './utils/rbac.js'
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
import Module22Page from './pages/Module22Page.jsx'
import QueryDataPage from './pages/QueryDataPage.jsx'
import QueryFeaturesPage from './pages/QueryFeaturesPage.jsx'
import HelpPage from './pages/HelpPage.jsx'
import ConfigurationPage from './pages/ConfigurationPage.jsx'
import TemplateLibraryPage from './pages/TemplateLibraryPage.jsx'

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
        <Route path="m3" element={<RequireModule routeId="m3"><Module3Page /></RequireModule>} />
        <Route path="m4" element={<RequireModule routeId="m4"><Module4Page /></RequireModule>} />
        <Route path="m5" element={<RequireModule routeId="m5"><Module5Page /></RequireModule>} />
        <Route path="m6" element={<RequireModule routeId="m6"><Module6Page /></RequireModule>} />
        <Route path="m7" element={<RequireModule routeId="m7"><Module7Page /></RequireModule>} />
        <Route path="m8" element={<RequireModule routeId="m8"><Module8Page /></RequireModule>} />
        <Route path="m9" element={<RequireModule routeId="m9"><Module9Page /></RequireModule>} />
        <Route path="m10" element={<RequireModule routeId="m10"><Module10Page /></RequireModule>} />
        <Route path="m11" element={<RequireModule routeId="m11"><Module11Page /></RequireModule>} />
        <Route path="m12" element={<RequireModule routeId="m12"><Module12Page /></RequireModule>} />
        <Route path="m13" element={<RequireModule routeId="m13"><Module13Page /></RequireModule>} />
        <Route path="m14" element={<RequireModule routeId="m14"><Module14Page /></RequireModule>} />
        <Route path="m15" element={<RequireModule routeId="m15"><Module15Page /></RequireModule>} />
        <Route path="m16" element={<RequireModule routeId="m16"><Module16Page /></RequireModule>} />
        <Route path="m17" element={<RequireModule routeId="m17"><Module17Page /></RequireModule>} />
        <Route path="m18" element={<RequireModule routeId="m18"><Module18Page /></RequireModule>} />
        <Route path="m19" element={<RequireModule routeId="m19"><Module19Page /></RequireModule>} />
        <Route path="m20" element={<RequireModule routeId="m20"><Module20Page /></RequireModule>} />
        <Route path="m21" element={<RequireModule routeId="m21"><Module21Page /></RequireModule>} />
        <Route path="m22" element={<RequireModule routeId="m22"><Module22Page /></RequireModule>} />
        <Route path="query-data" element={<QueryDataPage />} />
        <Route path="query-features" element={<QueryFeaturesPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route
          path="config"
          element={
            <RequireRole check={canManageConfiguration}>
              <ConfigurationPage />
            </RequireRole>
          }
        />
        <Route path="templates" element={<TemplateLibraryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  )
}
