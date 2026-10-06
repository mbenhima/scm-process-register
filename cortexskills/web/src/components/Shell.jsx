// Application shell: 64 px top bar (logo, global search, language, alerts, assistant, user menu — FR-DA-NAV-16),
// three horizontal layout panels — navigation, content, context — with resizable side panels (FR-DA-PNL-01 – 08),
// breadcrumbs (FR-DA-NAV-18), command palette (FR-DA-NAV-19), offline banner (FR-DA-STA-06) and an error boundary so
// that a page never stays blank (NFR-DA-REL-09).
import { Component, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData, useOnline } from '../lib/session.jsx';
import { post } from '../lib/api.js';
import { Icon, Btn, Select, Seg, Modal, Field, ErrorState, TooltipLayer, Toasts } from './ui.jsx';
import { HeaderSearch, SearchDialog, openSearch } from './GlobalSearch.jsx';

/* ------------------------------------------------------------------------------------------ breadcrumbs */
const CrumbCtx = createContext({ set: () => {} });
/** A page calls useCrumbs([{ label, to }, …, { label }]) to give its trail; otherwise it comes from the menu. */
export function useCrumbs(items) {
  const { set } = useContext(CrumbCtx); const key = JSON.stringify(items || null);
  useEffect(() => { set(items || null); return () => set(null); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}
function Breadcrumbs({ trail }) {
  const { t } = useI18n(); if (!trail?.length || trail.length < 2) return <span />;
  return <nav aria-label={t('nav.breadcrumbs')}><ol className="breadcrumbs">{trail.map((c, i) => <li key={i + (c.label || '')}>{i > 0 && <Icon name="ChevronRight" size={14} className="sep" />}
    {i === trail.length - 1 ? <span aria-current="page">{c.label}</span> : c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}</li>)}</ol></nav>;
}

/* ---------------------------------------------------------------------------------------- panel widths */
const LIMITS = { nav: [180, 480, 260], context: [220, 560, 320] };
const CENTER_MIN = 400;
const clampW = (side, w) => Math.min(LIMITS[side][1], Math.max(LIMITS[side][0], Math.round(w)));
/** Resize handle: drag, arrow keys (16 px), Home / End, double-click to reset; separator role with its values (FR-DA-PNL-03 – 05). */
function ResizeHandle({ side, width, onChange, onCommit, label }) {
  const [active, setActive] = useState(false);
  const rtl = document.dir === 'rtl'; const sign = (side === 'nav' ? 1 : -1) * (rtl ? -1 : 1);
  const down = e => {
    e.preventDefault(); const x0 = e.clientX, w0 = width; setActive(true); document.querySelector('.app')?.classList.add('resizing');
    const move = ev => onChange(clampW(side, w0 + sign * (ev.clientX - x0)));
    const up = () => { setActive(false); document.querySelector('.app')?.classList.remove('resizing'); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); onCommit(); };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  };
  const key = e => {
    let w = null; const grow = side === 'nav' ? (rtl ? 'ArrowLeft' : 'ArrowRight') : (rtl ? 'ArrowRight' : 'ArrowLeft');
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') w = width + (e.key === grow ? 16 : -16); else if (e.key === 'Home') w = LIMITS[side][0]; else if (e.key === 'End') w = LIMITS[side][1];
    if (w != null) { e.preventDefault(); onChange(clampW(side, w)); onCommit(clampW(side, w)); }
  };
  return <div className={`resize-handle ${active ? 'active' : ''}`} role="separator" aria-orientation="vertical" aria-label={label} aria-valuenow={width} aria-valuemin={LIMITS[side][0]} aria-valuemax={LIMITS[side][1]} tabIndex={0}
    onPointerDown={down} onKeyDown={key} onDoubleClick={() => { onChange(LIMITS[side][2]); onCommit(LIMITS[side][2]); }} />;
}
function useViewport() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const r = () => setW(window.innerWidth); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  return w;
}

/* ------------------------------------------------------------------------------------------ error boundary */
class Boundary extends Component {
  constructor(p) { super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); } // eslint-disable-line react/no-did-update-set-state
  componentDidCatch(error) { console.error(error); } // eslint-disable-line no-console
  render() { return this.state.error ? <ErrorState onRetry={() => this.setState({ error: null })} /> : this.props.children; }
}

/* --------------------------------------------------------------------------------------------- shell */
export default function Shell({ children }) {
  const { me, nav, prefs, savePrefs, queuePrefs, expired } = useSession(); const { t } = useI18n(); const loc = useLocation(); const online = useOnline();
  const vw = useViewport(); const mobile = vw < 768; const tablet = vw >= 768 && vw < 1024;
  const dock = prefs.dock || 'left'; const pinned = prefs.pinned !== false; const horizontal = !mobile && (dock === 'top' || dock === 'bottom');
  const panels = prefs.panels || {};
  const [navW, setNavW] = useState(clampW('nav', panels.nav || 260)); const [ctxW, setCtxW] = useState(clampW('context', panels.context || 320));
  const [navOpen, setNavOpen] = useState(false); const [ctxOpen, setCtxOpen] = useState(!!panels.contextOpen && !mobile); const [ctxView, setCtxView] = useState(panels.contextView || 'assistant');
  const [crumbs, setCrumbs] = useState(null); const crumbApi = useMemo(() => ({ set: setCrumbs }), []);
  const latest = useRef({ navW, ctxW, ctxOpen, ctxView }); latest.current = { navW, ctxW, ctxOpen, ctxView };
  const commit = useCallback(() => queuePrefs({ panels: { nav: latest.current.navW, context: latest.current.ctxW, contextOpen: latest.current.ctxOpen, contextView: latest.current.ctxView } }), [queuePrefs]);

  // Clamp the side panels when the window is resized so that the content never drops below 400 px (FR-DA-PNL-02).
  const rail = !mobile && !horizontal && (tablet || !pinned);
  const effNav = horizontal ? 0 : rail ? 64 : navW; const effCtx = ctxOpen && !mobile ? ctxW : 0;
  useEffect(() => { if (mobile) return; let over = effNav + effCtx + CENTER_MIN - vw; if (over <= 0) return;
    if (effCtx) { const c = Math.max(LIMITS.context[0], ctxW - over); over -= ctxW - c; setCtxW(c); }
    if (over > 0 && !rail && !horizontal) setNavW(w => Math.max(LIMITS.nav[0], w - over)); }, [vw]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setNavOpen(false); }, [loc.pathname]);
  useEffect(() => { const h = e => { setCtxView(e.detail || 'assistant'); setCtxOpen(true); }; document.addEventListener('assistant:open', h); document.addEventListener('context:open', h); return () => { document.removeEventListener('assistant:open', h); document.removeEventListener('context:open', h); }; }, []);
  useEffect(() => { commit(); }, [ctxOpen, ctxView]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!nav) return null;

  const trail = crumbs || defaultTrail(nav, loc.pathname, t);
  return (<CrumbCtx.Provider value={crumbApi}><div className="app" data-dock={mobile ? 'left' : dock} data-rail={String(rail)} data-pinned={String(pinned || mobile || horizontal)} style={{ '--nav-w': navW + 'px', '--ctx-w': ctxW + 'px' }}>
    <a href="#main" className="skip-link">{t('nav.skip')}</a>
    <TopBar onMenu={() => setNavOpen(o => !o)} showMenu={mobile} ctxOpen={ctxOpen} onAssistant={() => { setCtxView('assistant'); setCtxOpen(o => !(o && ctxView === 'assistant')); }} />
    {!online && <div className="offline-banner" role="status"><Icon name="WifiOff" />{t('state.offline')}</div>}
    {horizontal && <HNav nav={nav} />}
    <div className="app-body">
      {!horizontal && <>{mobile && navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}
        <SideNav nav={nav} rail={rail} mobile={mobile} open={navOpen} setOpen={setNavOpen} pinned={pinned} onPin={() => savePrefs({ pinned: !pinned })}
          handle={!mobile && !rail && <ResizeHandle side="nav" width={navW} onChange={setNavW} onCommit={commit} label={t('panel.resizeNav')} />} /></>}
      <div className="content-panel">
        <div className="scopebar"><Breadcrumbs trail={trail} /><ScopeSelectors /></div>
        <main id="main" className="content" tabIndex={-1}><Boundary resetKey={loc.pathname}>{children}</Boundary></main>
      </div>
      {ctxOpen && <>{mobile && <div className="scrim" onClick={() => setCtxOpen(false)} />}<aside className="context-panel" aria-label={t('panel.context')}>
        {!mobile && <ResizeHandle side="context" width={ctxW} onChange={setCtxW} onCommit={commit} label={t('panel.resizeContext')} />}
        <ContextPanel view={ctxView} setView={setCtxView} onClose={() => setCtxOpen(false)} /></aside></>}
    </div>
    <SearchDialog /><TooltipLayer /><Toasts />{expired && <SessionExpired />}
  </div></CrumbCtx.Provider>);
}

function defaultTrail(nav, path, t) {
  const item = [...nav.items].sort((a, b) => b.route.length - a.route.length).find(i => (i.route === '/' ? path === '/' : path === i.route || path.startsWith(i.route + '/')));
  if (!item) return null;
  const trail = [{ label: t('navGroup.' + item.group) }, { label: t(item.label), to: item.route }];
  if (path !== item.route) trail.push({ label: t('nav.detail') });
  return trail;
}

function TopBar({ onMenu, showMenu, onAssistant, ctxOpen }) {
  const { me, can, changeLang, logout } = useSession(); const { t, lang, languages } = useI18n(); const navigate = useNavigate();
  const [menu, setMenu] = useState(false); const unread = useData('/alerts/unread-count'); const menuRef = useRef(null);
  useEffect(() => { const id = setInterval(() => unread.reload(), 60000); return () => clearInterval(id); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!menu) return undefined; const out = e => { if (!menuRef.current?.contains(e.target)) setMenu(false); }; const k = e => e.key === 'Escape' && setMenu(false); document.addEventListener('mousedown', out); document.addEventListener('keydown', k); return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', k); }; }, [menu]);
  return (<header className="topbar">
    <div className="topbar-start">{showMenu && <Btn icon="Menu" kind="ghost" aria-label={t('nav.open')} onClick={onMenu} />}<Link to="/" className="logo" aria-label="CortexSkills"><img className="logo-full" src="/brand/cortexskills-lockup-compact.png" alt="CortexSkills" /><img className="logo-icon" src="/brand/cortexskills-icon.png" alt="" /></Link></div>
    <div><HeaderSearch /></div>
    <div className="topbar-end">
      <span className="hide-mobile"><Seg size="sm" label={t('header.language')} value={lang} onChange={changeLang} options={languages.map(l => ({ id: l.code, label: l.code.toUpperCase() }))} /></span>
      <span className="show-mobile"><Select size="sm" aria-label={t('header.language')} value={lang} onChange={e => changeLang(e.target.value)} options={languages.map(l => ({ value: l.code, label: l.code.toUpperCase() }))} /></span>
      <div className="rel"><Btn icon="Bell" kind="ghost" aria-label={t('nav.alerts') + ` (${unread.data?.n || 0})`} onClick={() => navigate('/alerts')} />{unread.data?.n > 0 && <span className="bell-count" aria-hidden="true">{unread.data.n > 99 ? '99+' : unread.data.n}</span>}</div>
      {can('assistant.view') && <Btn icon="MessageSquare" kind="ghost" aria-label={t('nav.assistant')} aria-pressed={ctxOpen} onClick={onAssistant} />}
      <div className="rel" ref={menuRef}><Btn icon="CircleUserRound" kind="ghost" aria-haspopup="menu" aria-expanded={menu} aria-label={me.user.name} onClick={() => setMenu(m => !m)} />
        {menu && <div className="menu" role="menu">
          <div className="menu-head"><div className="strong">{me.user.name}</div><div className="xs muted">{me.user.email}</div><div className="xs muted">{me.user.title}</div></div>
          <hr className="divider" style={{ margin: 'var(--aiv-space-1) 0' }} />
          <Link role="menuitem" to="/settings" onClick={() => setMenu(false)}><Icon name="Settings" />{t('nav.settings')}</Link>
          <Link role="menuitem" to="/help" onClick={() => setMenu(false)}><Icon name="LifeBuoy" />{t('nav.help')}</Link>
          <button role="menuitem" type="button" onClick={logout}><Icon name="LogOut" />{t('header.logout')}</button></div>}</div>
    </div></header>);
}

/** Organization and project scope of every screen. */
function ScopeSelectors() {
  const { me, projects, project, setProject, switchOrg } = useSession(); const { t, L } = useI18n(); const orgs = useData('/context/orgs');
  return <div className="scope-select">
    <Select size="md" aria-label={t('header.organization')} value={me.org?.id || ''} onChange={e => switchOrg(e.target.value)} options={(orgs.data || []).map(o => ({ value: o.id, label: L(o.name) + (o.readOnly ? ` (${t('header.readOnly')})` : '') }))} />
    <Select size="md" aria-label={t('header.project')} value={project || ''} onChange={e => setProject(e.target.value)} options={[{ value: '', label: t('header.allProjects') }, ...projects.map(p => ({ value: p.id, label: L(p.name) }))]} />
    {me.foreignReadOnly && <span className="pill s3">{t('header.readOnlyGroup')}</span>}</div>;
}

/** Side navigation: Search button first, a filter for the menu, favorites, groups (FR-DA-NAV-12, -13, -17). */
function SideNav({ nav, rail, mobile, open, setOpen, pinned, onPin, handle }) {
  const { prefs, savePrefs } = useSession(); const { t } = useI18n(); const [filter, setFilter] = useState('');
  const favRoutes = prefs.favorites || []; const collapsed = new Set(prefs.collapsed || []);
  const toggleFav = route => savePrefs({ favorites: favRoutes.includes(route) ? favRoutes.filter(x => x !== route) : [...favRoutes, route] });
  const toggleGroup = g => savePrefs({ collapsed: collapsed.has(g) ? [...collapsed].filter(x => x !== g) : [...collapsed, g] });
  const favs = favRoutes.map(r => nav.items.find(i => i.route === r)).filter(Boolean);
  const groups = [{ id: 'favorites', items: favs }, ...nav.groups.map(g => ({ id: g, items: nav.items.filter(i => i.group === g) }))].filter(g => g.items.length);
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const hits = filter ? [...favs, ...nav.items.filter(i => !favRoutes.includes(i.route))].filter(i => norm(t(i.label)).includes(norm(filter))) : null;
  const expanded = !rail || open;
  return (<nav className="nav-panel" aria-label={t('nav.primary')} data-open={String(mobile ? open : rail && open)} onMouseEnter={() => rail && !pinned && setOpen(true)} onMouseLeave={() => rail && !pinned && setOpen(false)} onFocus={() => rail && !pinned && setOpen(true)}>
    <div className="nav-tools">
      <button type="button" className="nav-search" onClick={() => openSearch()} data-tip={rail && !open ? t('nav.search') : undefined} aria-label={t('nav.search')}><Icon name="Search" /><span>{t('nav.search')}</span><kbd>Ctrl K</kbd></button>
      {!mobile && <Btn icon={pinned ? 'PanelLeftClose' : 'PanelLeftOpen'} kind="ghost" size="sm" aria-label={pinned ? t('nav.unpin') : t('nav.pin')} onClick={onPin} />}
      {mobile && <Btn icon="X" kind="ghost" aria-label={t('common.close')} onClick={() => setOpen(false)} />}
    </div>
    {expanded && <div className="nav-filter"><input className="input sm" type="search" value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('nav.filter')} aria-label={t('nav.filter')} /></div>}
    <div className="nav-scroll">
      {hits ? (hits.length ? hits.map(i => <NavItem key={'f' + i.id} i={i} fav={favRoutes.includes(i.route)} onFav={toggleFav} hint={t('navGroup.' + i.group)} />) : <p className="xs muted" style={{ padding: 'var(--aiv-space-3)' }}>{t('nav.noMatch')}</p>)
        : groups.map(g => { const isCollapsed = expanded && collapsed.has(g.id);
          return (<div className="nav-group" key={g.id}>
            <button type="button" className="nav-group-btn" aria-expanded={!isCollapsed} onClick={() => toggleGroup(g.id)}>{t('navGroup.' + g.id)}<Icon name={isCollapsed ? 'ChevronRight' : 'ChevronDown'} size={14} className="sep" /></button>
            {!isCollapsed && <div className="nav-group-items">{g.items.map(i => <NavItem key={g.id + i.id} i={i} fav={favRoutes.includes(i.route)} onFav={toggleFav} rail={rail && !open} />)}</div>}</div>); })}
    </div>
    {expanded && <div className="nav-company"><img src="/brand/aivalue-lockup-compact.png" alt={t('nav.company')} /></div>}{handle}</nav>);
}
function NavItem({ i, fav, onFav, hint, rail }) {
  const { t } = useI18n();
  return <NavLink to={i.route} end={i.route === '/'} className="nav-item" data-tip={rail ? t(i.label) : undefined} aria-label={rail ? t(i.label) : undefined}>
    <Icon name={i.icon} size={20} /><span className="label">{t(i.label)}{hint && <span className="group-hint"> · {hint}</span>}</span>
    <button type="button" className="fav" aria-pressed={fav} aria-label={t('nav.favorite')} onClick={e => { e.preventDefault(); e.stopPropagation(); onFav(i.route); }}><Icon name="Star" size={14} /></button></NavLink>;
}
/** Top or bottom dock: groups as drop-down menus. */
function HNav({ nav }) {
  const { t } = useI18n(); const [open, setOpen] = useState(null); const loc = useLocation();
  useEffect(() => setOpen(null), [loc.pathname]);
  return <nav className="hnav" aria-label={t('nav.primary')} onMouseLeave={() => setOpen(null)}>
    <button type="button" className="nav-search" style={{ width: 'auto' }} onClick={() => openSearch()}><Icon name="Search" /><span>{t('nav.search')}</span></button>
    {nav.groups.map(g => { const items = nav.items.filter(i => i.group === g); if (!items.length) return null;
      return <div className="nav-group" key={g}><button type="button" className="nav-group-btn" aria-expanded={open === g} onClick={() => setOpen(o => (o === g ? null : g))} onMouseEnter={() => setOpen(g)}>{t('navGroup.' + g)}<Icon name="ChevronDown" size={14} /></button>
        {open === g && <div className="nav-group-items">{items.map(i => <NavLink key={i.id} to={i.route} end={i.route === '/'} className="nav-item"><Icon name={i.icon} size={20} /><span className="label">{t(i.label)}</span></NavLink>)}</div>}</div>; })}
  </nav>;
}

/* ---------------------------------------------------------------------------------------- context panel */
function ContextPanel({ view, setView, onClose }) {
  const { t } = useI18n(); const { can } = useSession();
  return <>
    <div className="context-head"><Seg size="sm" label={t('panel.context')} value={view} onChange={setView} options={[...(can('assistant.view') ? [{ id: 'assistant', label: t('nav.assistant') }] : []), { id: 'help', label: t('nav.help') }]} />
      <Btn icon="PanelRightClose" kind="ghost" size="sm" aria-label={t('panel.collapse')} onClick={onClose} /></div>
    {view === 'help' ? <HelpView /> : <AssistantView />}</>;
}
function AssistantView() {
  const { t } = useI18n(); const [msgs, setMsgs] = useState([]); const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const end = useRef(null);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [msgs]);
  const ask = async e => { e.preventDefault(); if (!q.trim()) return; const question = q; setQ(''); setBusy(true); setMsgs(m => [...m, { me: true, text: question }]);
    try { const r = await post('/assistant/ask', { question }); setMsgs(m => [...m, { text: r.answer, refs: r.references, engine: r.engine }]); } catch (err) { setMsgs(m => [...m, { text: err.message }]); } finally { setBusy(false); } };
  return <><div className="context-body"><div className="chat" aria-live="polite">{!msgs.length && <p className="muted">{t('assistant.intro')}</p>}
    {msgs.map((m, i) => <div key={i} className={`msg ${m.me ? 'me' : 'bot'}`}>{m.text}{m.refs?.length > 0 && <div className="xs muted" style={{ marginTop: 'var(--aiv-space-2)' }}>{t('assistant.sources')}: {m.refs.slice(0, 3).map(r => r.title).join(' · ')}</div>}</div>)}<div ref={end} /></div></div>
    <form onSubmit={ask} className="context-foot row nowrap"><input className="input md" value={q} onChange={e => setQ(e.target.value)} placeholder={t('assistant.placeholder')} aria-label={t('assistant.placeholder')} /><Btn kind="primary" icon="Send" type="submit" loading={busy} aria-label={t('assistant.send')} /></form></>;
}
function HelpView() {
  const { t, L } = useI18n(); const loc = useLocation(); const help = useData('/help'); const [q, setQ] = useState('');
  const topics = (help.data || []).filter(h => !q || L(h.title).toLowerCase().includes(q.toLowerCase()) || L(h.body || h.text).toLowerCase().includes(q.toLowerCase()));
  const path = loc.pathname.split('/')[1] || 'dashboard'; const first = topics.find(h => (h.route && path && h.route.includes(path)) || (h.module && path.includes(h.module))) || null;
  return <div className="context-body"><input className="input sm" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('help.search')} aria-label={t('help.search')} />
    {[first, ...topics.filter(h => h !== first)].filter(Boolean).slice(0, 12).map(h => <details key={h.id} className="design-section" open={h === first}><summary className="strong small" style={{ cursor: 'pointer' }}>{L(h.title)}</summary><p className="small" style={{ whiteSpace: 'pre-line', marginTop: 'var(--aiv-space-2)' }}>{L(h.body || h.text || h.content)}</p></details>)}</div>;
}

/** Session expired: "Sign in again" without losing the screen (FR-DA-STA-03). */
function SessionExpired() {
  const { me, login, logout } = useSession(); const { t } = useI18n(); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async e => { e?.preventDefault(); setBusy(true); setErr(''); try { await login(me?.user?.email, pw); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return <Modal title={t('state.expired.title')} onClose={logout} destructive footer={<><Btn onClick={logout}>{t('header.logout')}</Btn><Btn kind="primary" loading={busy} disabled={!pw} onClick={go}>{t('state.expired.signIn')}</Btn></>}>
    <p>{t('state.expired.text')}</p><form onSubmit={go}><Field label={t('login.password')} id="reauth" error={err}><input id="reauth" className="input" type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} /></Field></form></Modal>;
}
export { matchPath };
