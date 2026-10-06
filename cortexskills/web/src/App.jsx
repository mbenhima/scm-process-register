import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSession } from './lib/session.jsx';
import { useI18n } from './lib/i18n.jsx';
import Shell from './components/Shell.jsx';
import { Loading, Toasts, TooltipLayer } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import { Dashboard, MyTasks, Alerts, AssistantPage } from './pages/Home.jsx';
import { Tenancy, Projects, NewProject, Portfolio, Modules, ModuleWorkspace, Records } from './pages/Portfolio.jsx';
import { ProjectWorkspace, E2EInstance, Gantt } from './pages/Workspace.jsx';
import { MacroProcesses, MacroProcess, E2EList, E2EDetail, Chain, Coverage, InfoModel, Verticals, Sme, Templates, Gates, Checklists } from './pages/Process.jsx';
import { BpmnPage } from './pages/Bpmn.jsx';
import { Rules, Controls, Risks, Kpis, AlertSettings, Racsi, Rex } from './pages/Governance.jsx';
import { AiUseCases, AiUsage, Kb, AiModel } from './pages/Ai.jsx';
import { Reports, Benchmark } from './pages/Reports.jsx';
import { Users, Permissions, Configuration, Pricing, Integrations, Onboarding, Audit, Backups, Traceability } from './pages/Admin.jsx';
import { Settings, Help } from './pages/Settings.jsx';
import { Questionnaires, QuestionnaireDetail, QuestionnaireTemplates, CaptureResponse } from './pages/Questionnaires.jsx';
import { TrainingPlan } from './pages/TrainingPlan.jsx';
import { ChannelSettings } from './pages/Channels.jsx';
import { Documents, DocumentEditor, DocTemplates, DocLayout, MasterList } from './pages/Documents.jsx';
import { ProcessDesign } from './pages/Design.jsx';
import { Obs } from './pages/Obs.jsx';
import { PromptSpec, AiSettings } from './pages/AiSpec.jsx';
import { Blueprint } from './pages/Blueprint.jsx';
import { Audits, AuditDetail, Registers } from './pages/Audits.jsx';
import Respond from './pages/Respond.jsx';

export default function App() {
  const { me, loading } = useSession(); const { ready } = useI18n(); const loc = useLocation();
  // The respondent's page is public: it opens from the link sent by e-mail or WhatsApp, without signing in.
  if (loc.pathname.startsWith('/respond/')) return ready ? <Routes><Route path="/respond/:token" element={<Respond />} /></Routes> : <Loading />;
  if (!ready || loading) return <Loading />;
  if (!me) return <><Login /><Toasts /><TooltipLayer /></>;
  return (<Shell><Routes>
    <Route path="/" element={<Dashboard />} /><Route path="/my-tasks" element={<MyTasks />} /><Route path="/alerts" element={<Alerts />} /><Route path="/assistant" element={<AssistantPage />} />
    <Route path="/tenancy" element={<Tenancy />} /><Route path="/projects" element={<Projects />} /><Route path="/projects/new" element={<NewProject />} /><Route path="/projects/:id" element={<ProjectWorkspace />} />
    <Route path="/projects/:id/gantt" element={<Gantt />} /><Route path="/runs/:id" element={<E2EInstance />} /><Route path="/portfolio" element={<Portfolio />} />
    <Route path="/modules" element={<Modules />} /><Route path="/modules/:id" element={<ModuleWorkspace />} /><Route path="/records" element={<Records />} /><Route path="/records/:entity" element={<Records />} />
    <Route path="/questionnaires" element={<Questionnaires />} /><Route path="/questionnaires/templates" element={<QuestionnaireTemplates />} /><Route path="/questionnaires/capture/:id" element={<CaptureResponse />} /><Route path="/questionnaires/:id" element={<QuestionnaireDetail />} />
    <Route path="/training-plan" element={<TrainingPlan />} /><Route path="/documents" element={<Documents />} /><Route path="/documents/templates" element={<DocTemplates />} /><Route path="/documents/layout" element={<DocLayout />} /><Route path="/documents/master-list" element={<MasterList />} /><Route path="/documents/:id" element={<DocumentEditor />} />
    <Route path="/process/design" element={<ProcessDesign />} /><Route path="/process/templates/:id" element={<Blueprint />} /><Route path="/gov/obs" element={<Obs />} /><Route path="/gov/audits" element={<Audits />} /><Route path="/gov/audits/:id" element={<AuditDetail />} /><Route path="/registers" element={<Registers />} />
    <Route path="/ai/use-cases/:id/spec" element={<PromptSpec />} /><Route path="/ai/settings" element={<AiSettings />} /><Route path="/admin/channels" element={<ChannelSettings />} />
    <Route path="/process/mp" element={<MacroProcesses />} /><Route path="/process/mp/:id" element={<MacroProcess />} /><Route path="/process/e2e" element={<E2EList />} /><Route path="/process/e2e/:id" element={<E2EDetail />} />
    <Route path="/process/chain" element={<Chain />} /><Route path="/process/coverage" element={<Coverage />} /><Route path="/process/bpmn" element={<BpmnPage />} /><Route path="/process/model" element={<InfoModel />} />
    <Route path="/process/verticals" element={<Verticals />} /><Route path="/process/sme" element={<Sme />} /><Route path="/process/templates" element={<Templates />} /><Route path="/process/gates" element={<Gates />} /><Route path="/process/checklists" element={<Checklists />} />
    <Route path="/gov/rules" element={<Rules />} /><Route path="/gov/controls" element={<Controls />} /><Route path="/gov/risks" element={<Risks />} /><Route path="/gov/kpis" element={<Kpis />} />
    <Route path="/gov/alert-settings" element={<AlertSettings />} /><Route path="/gov/racsi" element={<Racsi />} /><Route path="/gov/rex" element={<Rex />} /><Route path="/gov/gantt" element={<Gantt />} />
    <Route path="/ai/use-cases" element={<AiUseCases />} /><Route path="/ai/usage" element={<AiUsage />} /><Route path="/ai/kb" element={<Kb />} /><Route path="/ai/model" element={<AiModel />} />
    <Route path="/reports" element={<Reports />} /><Route path="/benchmark" element={<Benchmark />} />
    <Route path="/admin/users" element={<Users />} /><Route path="/admin/permissions" element={<Permissions />} /><Route path="/admin/config" element={<Configuration />} /><Route path="/admin/pricing" element={<Pricing />} />
    <Route path="/admin/integrations" element={<Integrations />} /><Route path="/admin/onboarding" element={<Onboarding />} /><Route path="/admin/audit" element={<Audit />} /><Route path="/admin/backups" element={<Backups />} /><Route path="/admin/traceability" element={<Traceability />} />
    <Route path="/settings" element={<Settings />} /><Route path="/help" element={<Help />} /><Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Shell>);
}
