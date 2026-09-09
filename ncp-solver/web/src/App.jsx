import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './context/I18nContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import FichesListPage from './pages/FichesListPage.jsx';
import FicheDetailPage from './pages/FicheDetailPage.jsx';
import NewFichePage from './pages/NewFichePage.jsx';
import ActionsPage from './pages/ActionsPage.jsx';
import CapitalizationPage from './pages/CapitalizationPage.jsx';
import StandardsPage from './pages/StandardsPage.jsx';
import AiUseCasesPage from './pages/AiUseCasesPage.jsx';
import AiUseCaseDetailPage from './pages/AiUseCaseDetailPage.jsx';
import BusinessRulesPage from './pages/BusinessRulesPage.jsx';
import ControlsPage from './pages/ControlsPage.jsx';
import RisksPage from './pages/RisksPage.jsx';
import RacsiPage from './pages/RacsiPage.jsx';
import BpmnPage from './pages/BpmnPage.jsx';
import BpmnDiagramPage from './pages/BpmnDiagramPage.jsx';
import AiAssistantPage from './pages/AiAssistantPage.jsx';
import LlmSettingsPage from './pages/LlmSettingsPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import HierarchyPage from './pages/HierarchyPage.jsx';
import ObsPage from './pages/ObsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import PermissionMatrixPage from './pages/PermissionMatrixPage.jsx';
import GovernancePage from './pages/GovernancePage.jsx';
import LicensePage from './pages/LicensePage.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-grey-medium">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function PermissionGate({ permission, children }) {
  const { hasPermission } = useAuth();
  if (permission && !hasPermission(permission)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="fiches" element={<PermissionGate permission="fiche.view"><FichesListPage /></PermissionGate>} />
        <Route path="fiches/new" element={<PermissionGate permission="fiche.create"><NewFichePage /></PermissionGate>} />
        <Route path="fiches/:id" element={<PermissionGate permission="fiche.view"><FicheDetailPage /></PermissionGate>} />
        <Route path="actions" element={<PermissionGate permission="action.view"><ActionsPage /></PermissionGate>} />
        <Route path="capitalization" element={<PermissionGate permission="capitalization.view"><CapitalizationPage /></PermissionGate>} />
        <Route path="standards" element={<PermissionGate permission="standard.view"><StandardsPage /></PermissionGate>} />
        <Route path="ai-use-cases" element={<PermissionGate permission="aiUseCase.view"><AiUseCasesPage /></PermissionGate>} />
        <Route path="ai-use-cases/:id" element={<PermissionGate permission="aiUseCase.view"><AiUseCaseDetailPage /></PermissionGate>} />
        <Route path="business-rules" element={<PermissionGate permission="businessRule.view"><BusinessRulesPage /></PermissionGate>} />
        <Route path="controls" element={<PermissionGate permission="control.view"><ControlsPage /></PermissionGate>} />
        <Route path="risks" element={<PermissionGate permission="riskOpportunity.view"><RisksPage /></PermissionGate>} />
        <Route path="racsi" element={<PermissionGate permission="racsi.view"><RacsiPage /></PermissionGate>} />
        <Route path="bpmn" element={<PermissionGate permission="bpmn.view"><BpmnPage /></PermissionGate>} />
        <Route path="bpmn/:id" element={<PermissionGate permission="bpmn.view"><BpmnDiagramPage /></PermissionGate>} />
        <Route path="help" element={<HelpPage />} />
        <Route path="reports" element={<PermissionGate permission="report.view"><ReportsPage /></PermissionGate>} />
        <Route path="alerts" element={<PermissionGate permission="alert.view"><AlertsPage /></PermissionGate>} />
        <Route path="hierarchy" element={<PermissionGate permission="hierarchy.view"><HierarchyPage /></PermissionGate>} />
        <Route path="obs" element={<PermissionGate permission="obs.view"><ObsPage /></PermissionGate>} />
        <Route path="users" element={<PermissionGate permission="user.view"><UsersPage /></PermissionGate>} />
        <Route path="permissions" element={<PermissionGate permission="role.view"><PermissionMatrixPage /></PermissionGate>} />
        <Route path="governance" element={<PermissionGate permission="governance.view"><GovernancePage /></PermissionGate>} />
        <Route path="license" element={<PermissionGate permission="license.view"><LicensePage /></PermissionGate>} />
        <Route path="llm-settings" element={<PermissionGate permission="llmConfig.view"><LlmSettingsPage /></PermissionGate>} />
        <Route path="assistant" element={<PermissionGate permission="assistant.view"><AiAssistantPage /></PermissionGate>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
