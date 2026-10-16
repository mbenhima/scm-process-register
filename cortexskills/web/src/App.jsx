import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSession } from './lib/session.jsx';
import { useI18n } from './lib/i18n.jsx';
import Shell from './components/Shell.jsx';
import { Loading, Toasts, TooltipLayer } from './components/ui.jsx';
import { NavGuardHost } from './lib/navguard.jsx';
import Login from './pages/Login.jsx';
import Respond from './pages/Respond.jsx';

// Each screen is its own chunk, loaded on first visit (smaller first download); the sign-in and response pages stay in
// the main bundle.
const pageHome = () => import('./pages/Home.jsx');
const Dashboard = lazy(() => pageHome().then(m => ({ default: m.Dashboard })));
const MyTasks = lazy(() => pageHome().then(m => ({ default: m.MyTasks })));
const Alerts = lazy(() => pageHome().then(m => ({ default: m.Alerts })));
const AssistantPage = lazy(() => pageHome().then(m => ({ default: m.AssistantPage })));
const pagePortfolio = () => import('./pages/Portfolio.jsx');
const Tenancy = lazy(() => pagePortfolio().then(m => ({ default: m.Tenancy })));
const Projects = lazy(() => pagePortfolio().then(m => ({ default: m.Projects })));
const NewProject = lazy(() => pagePortfolio().then(m => ({ default: m.NewProject })));
const Portfolio = lazy(() => pagePortfolio().then(m => ({ default: m.Portfolio })));
const Modules = lazy(() => pagePortfolio().then(m => ({ default: m.Modules })));
const ModuleWorkspace = lazy(() => pagePortfolio().then(m => ({ default: m.ModuleWorkspace })));
const Records = lazy(() => pagePortfolio().then(m => ({ default: m.Records })));
const pageWorkspace = () => import('./pages/Workspace.jsx');
const ProjectWorkspace = lazy(() => pageWorkspace().then(m => ({ default: m.ProjectWorkspace })));
const E2EInstance = lazy(() => pageWorkspace().then(m => ({ default: m.E2EInstance })));
const Gantt = lazy(() => pageWorkspace().then(m => ({ default: m.Gantt })));
const pageProcess = () => import('./pages/Process.jsx');
const MacroProcesses = lazy(() => pageProcess().then(m => ({ default: m.MacroProcesses })));
const MacroProcess = lazy(() => pageProcess().then(m => ({ default: m.MacroProcess })));
const E2EList = lazy(() => pageProcess().then(m => ({ default: m.E2EList })));
const E2EDetail = lazy(() => pageProcess().then(m => ({ default: m.E2EDetail })));
const Chain = lazy(() => pageProcess().then(m => ({ default: m.Chain })));
const Coverage = lazy(() => pageProcess().then(m => ({ default: m.Coverage })));
const InfoModel = lazy(() => pageProcess().then(m => ({ default: m.InfoModel })));
const Verticals = lazy(() => pageProcess().then(m => ({ default: m.Verticals })));
const Sme = lazy(() => pageProcess().then(m => ({ default: m.Sme })));
const Templates = lazy(() => pageProcess().then(m => ({ default: m.Templates })));
const Gates = lazy(() => pageProcess().then(m => ({ default: m.Gates })));
const Checklists = lazy(() => pageProcess().then(m => ({ default: m.Checklists })));
const pageBpmn = () => import('./pages/Bpmn.jsx');
const BpmnPage = lazy(() => pageBpmn().then(m => ({ default: m.BpmnPage })));
const pageGovernance = () => import('./pages/Governance.jsx');
const Rules = lazy(() => pageGovernance().then(m => ({ default: m.Rules })));
const Controls = lazy(() => pageGovernance().then(m => ({ default: m.Controls })));
const Risks = lazy(() => pageGovernance().then(m => ({ default: m.Risks })));
const Kpis = lazy(() => pageGovernance().then(m => ({ default: m.Kpis })));
const AlertSettings = lazy(() => pageGovernance().then(m => ({ default: m.AlertSettings })));
const Racsi = lazy(() => pageGovernance().then(m => ({ default: m.Racsi })));
const Rex = lazy(() => pageGovernance().then(m => ({ default: m.Rex })));
const pageAi = () => import('./pages/Ai.jsx');
const AiUseCases = lazy(() => pageAi().then(m => ({ default: m.AiUseCases })));
const AiUsage = lazy(() => pageAi().then(m => ({ default: m.AiUsage })));
const Kb = lazy(() => pageAi().then(m => ({ default: m.Kb })));
const AiModel = lazy(() => pageAi().then(m => ({ default: m.AiModel })));
const pageReports = () => import('./pages/Reports.jsx');
const Reports = lazy(() => pageReports().then(m => ({ default: m.Reports })));
const Benchmark = lazy(() => pageReports().then(m => ({ default: m.Benchmark })));
const pageAdmin = () => import('./pages/Admin.jsx');
const Users = lazy(() => pageAdmin().then(m => ({ default: m.Users })));
const Permissions = lazy(() => pageAdmin().then(m => ({ default: m.Permissions })));
const Configuration = lazy(() => pageAdmin().then(m => ({ default: m.Configuration })));
const Pricing = lazy(() => pageAdmin().then(m => ({ default: m.Pricing })));
const Integrations = lazy(() => pageAdmin().then(m => ({ default: m.Integrations })));
const Onboarding = lazy(() => pageAdmin().then(m => ({ default: m.Onboarding })));
const Audit = lazy(() => pageAdmin().then(m => ({ default: m.Audit })));
const Backups = lazy(() => pageAdmin().then(m => ({ default: m.Backups })));
const Traceability = lazy(() => pageAdmin().then(m => ({ default: m.Traceability })));
const pageSettings = () => import('./pages/Settings.jsx');
const Settings = lazy(() => pageSettings().then(m => ({ default: m.Settings })));
const Help = lazy(() => pageSettings().then(m => ({ default: m.Help })));
const pageQuestionnaires = () => import('./pages/Questionnaires.jsx');
const Questionnaires = lazy(() => pageQuestionnaires().then(m => ({ default: m.Questionnaires })));
const QuestionnaireDetail = lazy(() => pageQuestionnaires().then(m => ({ default: m.QuestionnaireDetail })));
const QuestionnaireTemplates = lazy(() => pageQuestionnaires().then(m => ({ default: m.QuestionnaireTemplates })));
const CaptureResponse = lazy(() => pageQuestionnaires().then(m => ({ default: m.CaptureResponse })));
const pageTrainingPlan = () => import('./pages/TrainingPlan.jsx');
const TrainingPlan = lazy(() => pageTrainingPlan().then(m => ({ default: m.TrainingPlan })));
const pageChannels = () => import('./pages/Channels.jsx');
const ChannelSettings = lazy(() => pageChannels().then(m => ({ default: m.ChannelSettings })));
const pageDocuments = () => import('./pages/Documents.jsx');
const Documents = lazy(() => pageDocuments().then(m => ({ default: m.Documents })));
const DocumentEditor = lazy(() => pageDocuments().then(m => ({ default: m.DocumentEditor })));
const DocTemplates = lazy(() => pageDocuments().then(m => ({ default: m.DocTemplates })));
const DocLayout = lazy(() => pageDocuments().then(m => ({ default: m.DocLayout })));
const MasterList = lazy(() => pageDocuments().then(m => ({ default: m.MasterList })));
const pageDesign = () => import('./pages/Design.jsx');
const ProcessDesign = lazy(() => pageDesign().then(m => ({ default: m.ProcessDesign })));
const pageObs = () => import('./pages/Obs.jsx');
const Obs = lazy(() => pageObs().then(m => ({ default: m.Obs })));
const pageAiSpec = () => import('./pages/AiSpec.jsx');
const PromptSpec = lazy(() => pageAiSpec().then(m => ({ default: m.PromptSpec })));
const AiSettings = lazy(() => pageAiSpec().then(m => ({ default: m.AiSettings })));
const pageBlueprint = () => import('./pages/Blueprint.jsx');
const Blueprint = lazy(() => pageBlueprint().then(m => ({ default: m.Blueprint })));
const pageAudits = () => import('./pages/Audits.jsx');
const Audits = lazy(() => pageAudits().then(m => ({ default: m.Audits })));
const AuditDetail = lazy(() => pageAudits().then(m => ({ default: m.AuditDetail })));
const Registers = lazy(() => pageAudits().then(m => ({ default: m.Registers })));

export default function App() {
  const { me, loading } = useSession(); const { ready } = useI18n(); const loc = useLocation();
  // The respondent's page is public: it opens from the link sent by e-mail or WhatsApp, without signing in.
  if (loc.pathname.startsWith('/respond/')) return ready ? <Routes><Route path="/respond/:token" element={<Respond />} /></Routes> : <Loading />;
  if (!ready || loading) return <Loading />;
  if (!me) return <><Login /><Toasts /><TooltipLayer /></>;
  return (<Shell><NavGuardHost /><Suspense fallback={<Loading />}><Routes>
    <Route path="/" element={<Dashboard />} /><Route path="/my-tasks" element={<MyTasks />} /><Route path="/alerts" element={<Alerts />} /><Route path="/assistant" element={<AssistantPage />} />
    <Route path="/tenancy" element={<Tenancy />} /><Route path="/projects" element={<Projects />} /><Route path="/projects/new" element={<NewProject />} /><Route path="/projects/:id" element={<ProjectWorkspace />} />
    <Route path="/projects/:id/gantt" element={<Gantt />} /><Route path="/runs/:id" element={<E2EInstance />} /><Route path="/portfolio" element={<Portfolio />} />
    <Route path="/modules" element={<Modules />} /><Route path="/modules/:id" element={<ModuleWorkspace />} /><Route path="/records" element={<Records />} /><Route path="/records/:entity" element={<Records />} />
    <Route path="/questionnaires" element={<Questionnaires />} /><Route path="/questionnaires/templates" element={<QuestionnaireTemplates />} /><Route path="/questionnaires/capture/:id" element={<CaptureResponse />} /><Route path="/questionnaires/:id" element={<QuestionnaireDetail />} />
    <Route path="/training-plan" element={<TrainingPlan />} /><Route path="/documents" element={<Documents />} /><Route path="/documents/templates" element={<DocTemplates />} /><Route path="/documents/layout" element={<DocLayout />} /><Route path="/documents/master-list" element={<MasterList />} /><Route path="/documents/:id" element={<DocumentEditor />} />
    <Route path="/process/design" element={<ProcessDesign />} /><Route path="/process/templates/:id" element={<Blueprint />} /><Route path="/gov/obs" element={<Obs />} /><Route path="/gov/audits" element={<Audits />} /><Route path="/gov/audits/:id" element={<AuditDetail />} /><Route path="/registers" element={<Registers />} />
    <Route path="/ai/use-cases/:id/spec" element={<PromptSpec defaultTab="spec" />} /><Route path="/ai/use-cases/:id" element={<PromptSpec />} /><Route path="/ai/settings" element={<AiSettings />} /><Route path="/admin/channels" element={<ChannelSettings />} />
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
  </Routes></Suspense></Shell>);
}
