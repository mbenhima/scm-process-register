import {
  LayoutDashboard, ListChecks, Bell, FolderKanban, Gavel, GanttChart, Lightbulb, Library, Workflow, Grid3x3, SlidersHorizontal,
  Flag, Scale, ShieldCheck, TriangleAlert, Gauge, Users2, Network, Bot, MessageSquare, BookOpen, FileStack, BarChart3, Database,
  Menu as MenuIcon, ChartBarBig, Building2, UserCog, KeyRound, Settings2, Store, Plug, BadgeCheck, History, ClipboardCheck, BellRing, Settings, HelpCircle,
  Boxes, LayoutGrid, ClipboardList,
} from 'lucide-react';

// Menu organized by what people do, in the order they do it:
// Home (my work) > Portfolio (tenancy, projects, gates) > Process design (how work is defined) > Governance & risk
// > AI & knowledge > Reports > Administration > Me.
// perm: any of these permissions; feature: Pack entitlement (shown locked when missing).
export const NAV = [
  { group: 'Home', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, perm: ['dashboard.view'] },
    { to: '/my-tasks', label: 'My tasks', icon: ListChecks, perm: ['task.view'] },
    { to: '/alerts', label: 'Alerts', icon: Bell, perm: ['alert.view'] },
    { to: '/notifications', label: 'Notifications', icon: BellRing },
  ] },
  { group: 'Portfolio', items: [
    { to: '/tenancy', label: 'Groups, organizations & projects', icon: Boxes, perm: ['tenancy.view', 'hierarchy.manage'] },
    { to: '/portfolio', label: 'Portfolio overview', icon: LayoutGrid, perm: ['portfolio.view'] },
    { to: '/projects', label: 'Innovation projects', icon: FolderKanban, perm: ['project.view'] },
    { to: '/gate-board', label: 'Gate board', icon: Gavel, perm: ['gate.view'] },
    { to: '/wbs', label: 'WBS & Gantt', icon: GanttChart, perm: ['wbs.view'] },
    { to: '/benchmarking', label: 'Benchmarking', icon: ChartBarBig, perm: ['benchmark.view'] },
  ] },
  { group: 'Process design', items: [
    { to: '/e2e', label: 'End-to-end processes', icon: Workflow, perm: ['reference.view'] },
    { to: '/library', label: 'Macro processes', icon: Library, perm: ['reference.view'] },
    { to: '/bpmn', label: 'BPMN diagrams', icon: Network, perm: ['bpmn.view'] },
    { to: '/checklist-templates', label: 'Checklist templates', icon: ClipboardList, perm: ['checklist.template.view'] },
    { to: '/tracks', label: 'Track configuration', icon: SlidersHorizontal, perm: ['track.view'] },
    { to: '/gates-reference', label: 'Phase-gate reference', icon: Flag, perm: ['reference.view'] },
    { to: '/coverage', label: 'Coverage matrix', icon: Grid3x3, perm: ['reference.view'] },
  ] },
  { group: 'Governance & risk', items: [
    { to: '/business-rules', label: 'Business rules', icon: Scale, perm: ['governance.view'], feature: 'governance' },
    { to: '/controls', label: 'Controls (COSO)', icon: ShieldCheck, perm: ['governance.view'], feature: 'governance' },
    { to: '/risks', label: 'Risks & opportunities', icon: TriangleAlert, perm: ['governance.view'], feature: 'governance' },
    { to: '/kpis', label: 'KPIs', icon: Gauge, perm: ['kpi.view'] },
    { to: '/racsi', label: 'RACSI matrix', icon: Users2, perm: ['racsi.view'] },
  ] },
  { group: 'AI & knowledge', items: [
    { to: '/ai', label: 'AI use cases', icon: Bot, perm: ['ai.view'], feature: 'ai' },
    { to: '/assistant', label: 'AI Assistant', icon: MessageSquare, perm: ['assistant.use'], feature: 'assistant' },
    { to: '/knowledge', label: 'Knowledge base', icon: BookOpen, perm: ['kb.view'] },
    { to: '/rex', label: 'Lessons learned (REX)', icon: Lightbulb, perm: ['rex.view'] },
    { to: '/templates', label: 'Project templates', icon: FileStack, perm: ['template.view'] },
  ] },
  { group: 'Reports', items: [
    { to: '/reports', label: 'Reports & cockpits', icon: BarChart3, perm: ['report.view'] },
    { to: '/data-model', label: 'Data model', icon: Database, perm: ['reference.view'] },
    { to: '/role-menus', label: 'Role menus', icon: MenuIcon, perm: ['reference.view'] },
  ] },
  { group: 'Administration', items: [
    { to: '/admin/organizations', label: 'Organizations, OBS & teams', icon: Building2, perm: ['hierarchy.manage'] },
    { to: '/admin/users', label: 'Users & roles', icon: UserCog, perm: ['user.manage'] },
    { to: '/admin/permissions', label: 'Permission matrix', icon: KeyRound, perm: ['permission.manage', 'audit.view'] },
    { to: '/admin/configuration', label: 'Configuration & AI model', icon: Settings2, perm: ['config.view'] },
    { to: '/admin/catalog', label: 'Commercial catalog', icon: Store, perm: ['catalog.view'] },
    { to: '/admin/integrations', label: 'Integrations', icon: Plug, perm: ['integration.view'], feature: 'integrations' },
    { to: '/admin/licensing', label: 'Licensing', icon: BadgeCheck, perm: ['license.manage'] },
    { to: '/admin/audit', label: 'Audit trail', icon: History, perm: ['audit.view'] },
    { to: '/admin/traceability', label: 'Requirements traceability', icon: ClipboardCheck, perm: ['config.view'] },
  ] },
  { group: 'Me', items: [
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/help', label: 'Help', icon: HelpCircle },
  ] },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));
