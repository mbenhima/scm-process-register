import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './lib/i18n.jsx';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { ToastProvider, Skeleton } from './components/ui.jsx';
import Shell from './components/Shell.jsx';
import Login from './pages/Login.jsx';
import { ALL_ITEMS } from './components/navModel.js';
import { useI18n } from './lib/i18n.jsx';
import { PageHeader, Empty } from './components/ui.jsx';

const P = (f) => lazy(f);
const pages = {
  Dashboard: P(() => import('./pages/Dashboard.jsx')), MyTasks: P(() => import('./pages/MyTasks.jsx')), Alerts: P(() => import('./pages/Alerts.jsx')),
  Projects: P(() => import('./pages/Projects.jsx')), ProjectNew: P(() => import('./pages/ProjectNew.jsx')), Project: P(() => import('./pages/Project.jsx')),
  Task: P(() => import('./pages/Task.jsx')), GateBoard: P(() => import('./pages/GateBoard.jsx')), Gate: P(() => import('./pages/Gate.jsx')),
  Library: P(() => import('./pages/Library.jsx')), MacroProcess: P(() => import('./pages/MacroProcess.jsx')), E2EList: P(() => import('./pages/E2EList.jsx')),
  E2EDetail: P(() => import('./pages/E2EDetail.jsx')), Coverage: P(() => import('./pages/Coverage.jsx')), Tracks: P(() => import('./pages/Tracks.jsx')),
  GatesReference: P(() => import('./pages/GatesReference.jsx')),
  BusinessRules: P(() => import('./pages/governance/BusinessRules.jsx')), Controls: P(() => import('./pages/governance/Controls.jsx')),
  Risks: P(() => import('./pages/governance/Risks.jsx')), Kpis: P(() => import('./pages/governance/Kpis.jsx')), Racsi: P(() => import('./pages/governance/Racsi.jsx')),
  Bpmn: P(() => import('./pages/governance/Bpmn.jsx')),
  AiUseCases: P(() => import('./pages/AiUseCases.jsx')), AssistantPage: P(() => import('./pages/AssistantPage.jsx')), Knowledge: P(() => import('./pages/Knowledge.jsx')),
  Templates: P(() => import('./pages/Templates.jsx')), Rex: P(() => import('./pages/Rex.jsx')), Wbs: P(() => import('./pages/Wbs.jsx')),
  Reports: P(() => import('./pages/Reports.jsx')), DataModel: P(() => import('./pages/DataModel.jsx')), RoleMenus: P(() => import('./pages/RoleMenus.jsx')),
  Organizations: P(() => import('./pages/admin/Organizations.jsx')), Users: P(() => import('./pages/admin/Users.jsx')), Permissions: P(() => import('./pages/admin/Permissions.jsx')),
  Configuration: P(() => import('./pages/admin/Configuration.jsx')), Catalog: P(() => import('./pages/admin/Catalog.jsx')), Integrations: P(() => import('./pages/admin/Integrations.jsx')),
  Licensing: P(() => import('./pages/admin/Licensing.jsx')), Audit: P(() => import('./pages/admin/Audit.jsx')), Traceability: P(() => import('./pages/admin/Traceability.jsx')),
  Notifications: P(() => import('./pages/Notifications.jsx')), Settings: P(() => import('./pages/Settings.jsx')), Help: P(() => import('./pages/Help.jsx')), Benchmarking: P(() => import('./pages/Benchmarking.jsx')),
};

const ROUTES = [
  ['/', 'Dashboard'], ['/my-tasks', 'MyTasks'], ['/alerts', 'Alerts'], ['/projects', 'Projects'], ['/projects/new', 'ProjectNew'], ['/projects/:id', 'Project'],
  ['/tasks/:id', 'Task'], ['/gate-board', 'GateBoard'], ['/gates/:id', 'Gate'], ['/library', 'Library'], ['/library/:id', 'MacroProcess'], ['/e2e', 'E2EList'],
  ['/e2e/:id', 'E2EDetail'], ['/coverage', 'Coverage'], ['/tracks', 'Tracks'], ['/gates-reference', 'GatesReference'], ['/business-rules', 'BusinessRules'],
  ['/controls', 'Controls'], ['/risks', 'Risks'], ['/kpis', 'Kpis'], ['/racsi', 'Racsi'], ['/bpmn', 'Bpmn'], ['/bpmn/:id', 'Bpmn'], ['/ai', 'AiUseCases'],
  ['/assistant', 'AssistantPage'], ['/knowledge', 'Knowledge'], ['/knowledge/:id', 'Knowledge'], ['/templates', 'Templates'], ['/rex', 'Rex'], ['/rex/:id', 'Rex'],
  ['/wbs', 'Wbs'], ['/wbs/:id', 'Wbs'], ['/reports', 'Reports'], ['/reports/:id', 'Reports'], ['/benchmarking', 'Benchmarking'], ['/data-model', 'DataModel'], ['/role-menus', 'RoleMenus'],
  ['/admin/organizations', 'Organizations'], ['/admin/users', 'Users'], ['/admin/permissions', 'Permissions'], ['/admin/configuration', 'Configuration'],
  ['/admin/catalog', 'Catalog'], ['/admin/integrations', 'Integrations'], ['/admin/licensing', 'Licensing'], ['/admin/audit', 'Audit'],
  ['/admin/traceability', 'Traceability'], ['/notifications', 'Notifications'], ['/settings', 'Settings'], ['/help', 'Help'],
];

// Route guard: a page opened by URL shows a clear message when the user's roles do not include it.
function Guard({ path, children }) {
  const { can } = useAuth();
  const { t } = useI18n();
  const base = `/${path.split('/').filter(Boolean).slice(0, path.startsWith('/admin') ? 2 : 1).join('/')}`;
  const item = ALL_ITEMS.find((i) => i.to === base);
  if (item?.perm && !can(...item.perm)) {
    return <div className="page"><PageHeader eyebrow={t('Access')} title={t(item.label)} /><Empty text={t('Your roles do not give access to this page. Ask your administrator if you need it.')} /></div>;
  }
  return children;
}

function Gate() {
  const { me, loading } = useAuth();
  if (loading) return <div className="page"><Skeleton h={400} /></div>;
  if (!me) return <Login />;
  return (
    <Routes>
      <Route element={<Shell />}>
        {ROUTES.map(([path, name]) => { const C = pages[name]; return <Route key={path} path={path} element={<Guard path={path}><Suspense fallback={<div className="page"><Skeleton h={400} /></div>}><C /></Suspense></Guard>} />; })}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <Gate />
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
