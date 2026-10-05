import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { useApp } from './lib/state.jsx';
import Shell from './components/Shell.jsx';
import { Loading, Toasts } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Tasks from './pages/Tasks.jsx';
import Lifecycle from './pages/Lifecycle.jsx';
import MacroProcess from './pages/MacroProcess.jsx';
import Step from './pages/Step.jsx';
import Alerts from './pages/Alerts.jsx';
import Risks from './pages/Risks.jsx';
import Kpis from './pages/Kpis.jsx';
import Racsi from './pages/Racsi.jsx';
import Rules from './pages/Rules.jsx';
import Ncs, { NcDetail } from './pages/Ncs.jsx';
import Actions from './pages/Actions.jsx';
import Audits, { AuditDetail } from './pages/Audits.jsx';
import Documents, { DocumentDetail } from './pages/Documents.jsx';
import Registers from './pages/Registers.jsx';
import Planning from './pages/Planning.jsx';
import Reports from './pages/Reports.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Benchmark from './pages/Benchmark.jsx';
import Assistant from './pages/Assistant.jsx';
import AiUseCases from './pages/AiUseCases.jsx';
import Knowledge from './pages/Knowledge.jsx';
import Process, { E2EDetail, CatalogMp } from './pages/Process.jsx';
import Libraries from './pages/Libraries.jsx';
import ProcessDesign from './pages/ProcessDesign.jsx';
import Traceability from './pages/Traceability.jsx';
import Organization from './pages/Organization.jsx';
import NewProject from './pages/NewProject.jsx';
import ProjectTemplates, { ProjectTemplate } from './pages/ProjectTemplates.jsx';
import Admin from './pages/Admin.jsx';
import Help from './pages/Help.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { me, booting } = useApp();
  const loc = useLocation();
  if (booting) return <Loading />;
  if (!me) return <><Login /><Toasts /></>;
  return (
    <Shell>
      <ErrorBoundary resetKey={loc.pathname + loc.search}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/lifecycle" element={<Lifecycle />} />
        <Route path="/lifecycle/:e2e" element={<Lifecycle />} />
        <Route path="/mp/:mpId" element={<MacroProcess />} />
        <Route path="/steps/:id" element={<Step />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/risks" element={<Risks />} />
        <Route path="/kpis" element={<Kpis />} />
        <Route path="/racsi" element={<Racsi />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/ncs" element={<Ncs />} />
        <Route path="/ncs/:id" element={<NcDetail />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/audits" element={<Audits />} />
        <Route path="/audits/:id" element={<AuditDetail />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/registers" element={<Registers />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/benchmark" element={<Benchmark />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/ai" element={<AiUseCases />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/process" element={<Process />} />
        <Route path="/process/e2e/:id" element={<E2EDetail />} />
        <Route path="/process/mp/:id" element={<CatalogMp />} />
        <Route path="/libraries" element={<Libraries />} />
        <Route path="/design" element={<ProcessDesign />} />
        <Route path="/traceability" element={<Traceability />} />
        <Route path="/organization" element={<Organization />} />
        <Route path="/projects/new" element={<NewProject />} />
        <Route path="/project-templates" element={<ProjectTemplates />} />
        <Route path="/project-templates/:id" element={<ProjectTemplate />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
      <Toasts />
    </Shell>
  );
}
