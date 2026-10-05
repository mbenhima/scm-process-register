// Navigation shell (FR-DA-NAV): one navigation model, permission + entitlement
// filtering, favorites, collapsible groups, pin/unpin with edge handle, dock on
// any edge (logical start/end under RTL), mobile drawer, keyboard operable.
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, Workflow, Bell, ShieldAlert, Gauge, Grid3x3, Scale, AlertOctagon, CheckSquare, ClipboardCheck, FileText, BookOpen,
  GanttChart, FileBarChart, LayoutGrid, BarChart3, MessageSquare, Sparkles, Library, Network, Layers, ListTree, Building2, FolderPlus, Settings2,
  LifeBuoy, UserCog, Star, Search, Boxes, FileCog, PenTool, Pin, PinOff, Menu, LogOut, ChevronDown, ChevronRight, PanelLeft, PanelRight, PanelTop, PanelBottom,
} from 'lucide-react';
import { useApp } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { tx } from './ui.jsx';
import SearchModal from './SearchModal.jsx';

export const NAV = [
  { id: 'home', group: 'Work', label: 'Home', icon: LayoutDashboard, to: '/', perm: 'dashboard.view' },
  { id: 'tasks', group: 'Work', label: 'My tasks', icon: ListChecks, to: '/tasks', perm: 'execution.view' },
  { id: 'lifecycle', group: 'Work', label: 'Lifecycle', icon: Workflow, to: '/lifecycle', perm: 'execution.view' },
  { id: 'alerts', group: 'Work', label: 'Alerts', icon: Bell, to: '/alerts', perm: 'alerts.view' },
  { id: 'risks', group: 'Governance', label: 'Risks and opportunities', icon: ShieldAlert, to: '/risks', perm: 'governance.view', feature: 'governance' },
  { id: 'kpis', group: 'Governance', label: 'KPIs', icon: Gauge, to: '/kpis', perm: 'governance.view' },
  { id: 'racsi', group: 'Governance', label: 'RACSI matrix', icon: Grid3x3, to: '/racsi', perm: 'governance.view', feature: 'governance' },
  { id: 'rules', group: 'Governance', label: 'Rules and controls', icon: Scale, to: '/rules', perm: 'governance.view', feature: 'governance' },
  { id: 'ncs', group: 'Records', label: 'Nonconformities', icon: AlertOctagon, to: '/ncs', perm: 'records.view' },
  { id: 'actions', group: 'Records', label: 'Actions', icon: CheckSquare, to: '/actions', perm: 'records.view' },
  { id: 'audits', group: 'Records', label: 'Audits', icon: ClipboardCheck, to: '/audits', perm: 'records.view' },
  { id: 'documents', group: 'Records', label: 'Documents', icon: FileText, to: '/documents', perm: 'records.view' },
  { id: 'registers', group: 'Records', label: 'Registers', icon: BookOpen, to: '/registers', perm: 'records.view' },
  { id: 'planning', group: 'Records', label: 'Planning and Gantt', icon: GanttChart, to: '/planning', perm: 'records.view', feature: 'wbs' },
  { id: 'reports', group: 'Insight', label: 'Reports', icon: FileBarChart, to: '/reports', perm: 'reports.view' },
  { id: 'portfolio', group: 'Insight', label: 'Portfolio', icon: LayoutGrid, to: '/portfolio', perm: 'tenancy.view' },
  { id: 'benchmark', group: 'Insight', label: 'Benchmarking', icon: BarChart3, to: '/benchmark', perm: 'benchmark.view', feature: 'benchmark' },
  { id: 'assistant', group: 'Intelligence', label: 'AI Assistant', icon: MessageSquare, to: '/assistant', perm: 'assistant.use', feature: 'assistant' },
  { id: 'ai', group: 'Intelligence', label: 'AI use cases', icon: Sparkles, to: '/ai', perm: 'ai.view' },
  { id: 'knowledge', group: 'Intelligence', label: 'Knowledge base', icon: Library, to: '/knowledge', perm: 'kb.view' },
  { id: 'process', group: 'Design', label: 'Process design', icon: Network, to: '/process', perm: 'process.view' },
  { id: 'design', group: 'Design', label: 'Process design editor', icon: PenTool, to: '/design', perm: 'process.view' },
  { id: 'functions', group: 'Design', label: 'Functions', icon: Boxes, to: '/design?type=function', perm: 'process.view' },
  { id: 'doctemplates', group: 'Records', label: 'Document templates and layout', icon: FileCog, to: '/documents?tab=templates', perm: 'records.view' },
  { id: 'libraries', group: 'Design', label: 'Libraries', icon: Layers, to: '/libraries', perm: 'process.view' },
  { id: 'traceability', group: 'Design', label: 'Traceability', icon: ListTree, to: '/traceability', perm: 'process.view' },
  { id: 'organization', group: 'Organization', label: 'Organization', icon: Building2, to: '/organization', perm: 'tenancy.view' },
  { id: 'newproject', group: 'Organization', label: 'New project', icon: FolderPlus, to: '/projects/new', perm: 'project.create' },
  { id: 'admin', group: 'Organization', label: 'Administration', icon: Settings2, to: '/admin', perm: ['users.manage', 'config.manage', 'permissions.manage', 'audit.view'] },
  { id: 'help', group: 'Organization', label: 'Help', icon: LifeBuoy, to: '/help' },
  { id: 'settings', group: 'Organization', label: 'Settings', icon: UserCog, to: '/settings' },
];
const GROUPS = ['Work', 'Governance', 'Records', 'Insight', 'Intelligence', 'Design', 'Organization'];
const DOCKS = [['start', PanelLeft, 'Dock at start'], ['end', PanelRight, 'Dock at end'], ['top', PanelTop, 'Dock at top'], ['bottom', PanelBottom, 'Dock at bottom']];

export function useNavItems() {
  const { can, hasFeature } = useApp();
  return useMemo(() => NAV.filter(n => (!n.perm || (Array.isArray(n.perm) ? n.perm.some(can) : can(n.perm))) && (!n.feature || hasFeature(n.feature))), [can, hasFeature]);
}

function Brand() {
  return (
    <NavLink to="/" className="brand" aria-label="DynamicMS">
      <img className="brand-mark" src="/dynamicms-logo.png" alt="" width="40" height="40" />
      <span className="brand-word">Dynamic<span>MS</span></span>
    </NavLink>
  );
}

export default function Shell({ children }) {
  const { t, lang, setLang, me, logout, orgs, projectId, setProjectId, prefs, savePrefs, alertCount, setAlertCount, project } = useApp();
  const items = useNavItems();
  const loc = useLocation();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const menuBtn = useRef(null);
  const [search, setSearch] = useState(null);
  const [filter, setFilter] = useState('');
  const dock = prefs.dock || 'start';
  const pinned = prefs.pinned !== false;
  const horizontal = dock === 'top' || dock === 'bottom';
  const collapsed = prefs.collapsed || [];
  const favs = prefs.favorites || [];

  useEffect(() => { setDrawer(false); setOpenGroup(null); setHoverOpen(false); }, [loc.pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { if (drawer) { setDrawer(false); menuBtn.current?.focus(); } setOpenGroup(null); setHoverOpen(false); } };
    // Ctrl/Cmd+K opens the global search from any screen.
    const onSearchKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(''); } };
    document.addEventListener('keydown', onKey);
    document.addEventListener('keydown', onSearchKey);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('keydown', onSearchKey); };
  }, [drawer]);
  useEffect(() => {
    if (!projectId) return undefined;
    const load = () => api(`/alerts?projectId=${projectId}&unread=1&limit=1`).then(r => setAlertCount(r.unread)).catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [projectId, setAlertCount]);

  const toggleGroup = (g) => {
    if (horizontal) { setOpenGroup(o => (o === g ? null : g)); return; }
    savePrefs({ collapsed: collapsed.includes(g) ? collapsed.filter(x => x !== g) : [...collapsed, g] });
  };
  const toggleFav = (id) => savePrefs({ favorites: favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id] });
  const favItems = favs.map(id => items.find(i => i.id === id)).filter(Boolean);
  // Typing in the menu search field filters the menu items (favorites first).
  const f = filter.trim().toLowerCase();
  const match = (n) => !f || t(n.label).toLowerCase().includes(f) || t(n.group).toLowerCase().includes(f);
  const groups = [...(favItems.length ? [['Favorites', favItems.filter(match)]] : []), ...GROUPS.map(g => [g, items.filter(i => i.group === g && match(i))])].filter(([, l]) => l.length);

  const renderItem = (n) => (
    <NavLink key={n.id} to={n.to} end={n.to === '/'} className="nav-item">
      <n.icon aria-hidden="true" /><span>{t(n.label)}</span>
      {!horizontal && <button className="fav" aria-pressed={favs.includes(n.id)} aria-label={favs.includes(n.id) ? t('Remove from favorites') : t('Add to favorites')} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(n.id); }}><Star size={14} fill={favs.includes(n.id) ? 'currentColor' : 'none'} /></button>}
    </NavLink>
  );

  const unpinned = !pinned && !horizontal;
  const navClass = `nav ${unpinned ? 'unpinned' : ''} ${unpinned && hoverOpen ? 'open' : ''} ${drawer ? 'drawer-open' : ''}`;
  const projectsByOrg = orgs.filter(o => o.access);

  return (
    <div className={`app dock-${dock} ${unpinned ? 'unpinned-layout' : ''}`}>
      <a href="#main" className="skip-link">{t('Skip to content')}</a>
      <header className="header">
        <button ref={menuBtn} className="btn btn-ghost btn-icon menu-btn" aria-label={t('Open menu')} aria-expanded={drawer} onClick={() => setDrawer(true)}><Menu size={20} /></button>
        <Brand />
        <div className="context">
          <label className="sr-only" htmlFor="project-switch">{t('Current project')}</label>
          <select id="project-switch" className="select" value={projectId || ''} onChange={e => setProjectId(e.target.value)}>
            {projectsByOrg.map(o => (
              <optgroup key={o.id} label={`${tx(o.name, lang)}${o.access === 'read' ? ` (${t('read-only')})` : ''}`}>
                {o.projects.map(p => <option key={p.id} value={p.id}>{p.code} — {tx(p.name, lang)}</option>)}
              </optgroup>
            ))}
          </select>
          {project?.org?.access === 'read' && <span className="tag s2">{t('Read-only')}</span>}
        </div>
        <form className="header-search" role="search" onSubmit={e => { e.preventDefault(); setSearch(e.currentTarget.q.value); }}>
          <Search size={16} aria-hidden="true" />
          <input name="q" className="input" placeholder={t('Search everything… (Ctrl+K)')} aria-label={t('Search')} onFocus={e => { setSearch(e.target.value); e.target.blur(); }} onChange={e => setSearch(e.target.value)} />
        </form>
        <div className="tools">
          <label className="sr-only" htmlFor="lang-switch">{t('Language')}</label>
          <select id="lang-switch" className="select" style={{ width: 'auto', minHeight: 36 }} value={lang} onChange={e => setLang(e.target.value)}>
            <option value="en">EN</option><option value="fr">FR</option><option value="ar">ع</option>
          </select>
          <button className="btn btn-ghost btn-icon bell" aria-label={t('Alerts ({n} unread)', { n: alertCount })} onClick={() => navigate('/alerts')}><Bell size={20} />{alertCount > 0 && <span className="count">{alertCount > 99 ? '99+' : alertCount}</span>}</button>
          <span className="small strong nowrap" style={{ display: 'none' }}>{me?.user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/settings')} title={me?.user?.email}><UserCog size={18} /><span className="nowrap" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{me?.user?.name}</span></button>
          <button className="btn btn-ghost btn-icon" aria-label={t('Sign out')} onClick={logout}><LogOut size={18} /></button>
        </div>
      </header>

      {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)} />}
      {unpinned && !hoverOpen && <><button className="nav-handle" aria-label={t('Open menu')} onMouseEnter={() => setHoverOpen(true)} onFocus={() => setHoverOpen(true)} onClick={() => setHoverOpen(true)} /><button className="nav-handle-search btn btn-icon btn-sm" aria-label={t('Search')} title={`${t('Search')} (Ctrl+K)`} onClick={() => setSearch('')}><Search size={16} /></button></>}
      <nav className={navClass} aria-label={t('Main menu')} onMouseLeave={() => unpinned && setHoverOpen(false)}>
        <div className="nav-search" role="search">
          <button className="btn btn-primary btn-sm nav-search-btn" onClick={() => setSearch(filter)} title="Ctrl+K"><Search size={16} aria-hidden="true" /><span>{t('Search')}</span></button>
          {!horizontal && <input className="input nav-filter" value={filter} onChange={e => setFilter(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && filter.trim()) setSearch(filter); if (e.key === 'Escape') setFilter(''); }} placeholder={t('Filter the menu…')} aria-label={t('Filter the menu')} />}
        </div>
        {groups.map(([g, list]) => {
          const isCollapsed = horizontal ? openGroup !== g : collapsed.includes(g) && !f;
          const active = list.some(n => (n.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(n.to)));
          return (
            <div key={g} className="nav-group">
              <button aria-expanded={!isCollapsed} onClick={() => toggleGroup(g)} style={horizontal && active ? { color: 'var(--aiv-navy)' } : undefined}>
                <span>{t(g)}</span>{isCollapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              </button>
              {!isCollapsed && <div className="nav-items stack-8" style={{ gap: 2 }}>{list.map(renderItem)}</div>}
            </div>
          );
        })}
        <div className="nav-foot" role="group" aria-label={t('Menu layout')}>
          {!horizontal && <button className="btn btn-ghost btn-icon btn-sm" aria-pressed={pinned} aria-label={pinned ? t('Unpin menu') : t('Pin menu')} title={pinned ? t('Unpin menu') : t('Pin menu')} onClick={() => savePrefs({ pinned: !pinned })}>{pinned ? <PinOff size={16} /> : <Pin size={16} />}</button>}
          {DOCKS.map(([d, Icon, label]) => <button key={d} className="btn btn-ghost btn-icon btn-sm" aria-pressed={dock === d} aria-label={t(label)} title={t(label)} onClick={() => savePrefs({ dock: d })} style={dock === d ? { background: 'var(--aiv-azure-tint)' } : undefined}><Icon size={16} /></button>)}
        </div>
      </nav>
      <main id="main" className="main" tabIndex={-1}>{children}</main>
      {search !== null && <SearchModal initial={search} onClose={() => setSearch(null)} />}
    </div>
  );
}
