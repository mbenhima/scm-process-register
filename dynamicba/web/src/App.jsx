import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import IconBadge from './components/IconBadge'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AppProvider } from './contexts/AppContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectWorkspacePage from './pages/ProjectWorkspacePage'
import CataloguePage from './pages/CataloguePage'
import GovernancePage from './pages/GovernancePage'
import ReportsPage from './pages/ReportsPage'
import AIUseCasesPage from './pages/AIUseCasesPage'
import AdminPage from './pages/AdminPage'
import RecycleBinPage from './pages/RecycleBinPage'
import HelpPage from './pages/HelpPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-grey-medium">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile?.roles?.includes('org_admin')) return <Navigate to="/" replace />
  return children
}

function ApiHealthGate({ children }) {
  const [status, setStatus] = useState('checking') // 'checking' | 'ok' | 'unreachable'

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || '/api'
    fetch(`${base}/health`)
      .then((r) => setStatus(r.ok ? 'ok' : 'unreachable'))
      .catch(() => setStatus('unreachable'))
  }, [])

  if (status === 'checking') return null
  if (status === 'unreachable') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="card p-8 max-w-lg">
          <IconBadge icon={WifiOff} tone="ink" size={40} className="mb-4" />
          <h1 className="h-page !text-xl mb-2">Can&apos;t reach the DynamicBA server</h1>
          <p className="text-sm text-grey-ink mb-3">The web app can&apos;t connect to its API server. This usually means the server isn&apos;t running yet.</p>
          <p className="text-sm text-grey-ink">Open a terminal in the <code>server</code> folder and run <code>npm run dev</code>, then reload this page. See the Installation Guide if you haven&apos;t set up the server yet.</p>
        </div>
      </div>
    )
  }
  return children
}

export default function App() {
  return (
    <LanguageProvider>
      <ApiHealthGate>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<RegisterPage />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="workspace" element={<ProjectWorkspacePage />} />
                <Route path="catalogue" element={<CataloguePage />} />
                <Route path="governance" element={<GovernancePage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="ai-use-cases" element={<AIUseCasesPage />} />
                <Route path="recycle" element={<RecycleBinPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
      </ApiHealthGate>
    </LanguageProvider>
  )
}
